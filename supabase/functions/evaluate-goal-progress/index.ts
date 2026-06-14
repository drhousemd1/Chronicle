import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { shouldReturnAdminDebugTrace } from "../_shared/admin-debug.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { checkRateLimit, getRateLimitHeaders } from "../_shared/rate-limit.ts";
import { recordServerAiUsage } from "../_shared/server-usage.ts";
import { callXaiResponses, extractXaiResponsesText, getXaiResponsesBodyError } from "../_shared/xai-responses.ts";

const SUPPORT_REASONING_EFFORT = "medium" as const;
const SUPPORT_STORE = false;
const SUPPORT_RATE_LIMIT_WINDOW_MS = 60_000;
const SUPPORT_RATE_LIMIT_MAX = 30;

type StepInput = {
  stepId: string;
  description: string;
  goalId?: string;
  goalTitle?: string;
  goalDesiredOutcome?: string;
  goalCurrentStatus?: string;
  flexibility?: 'rigid' | 'normal' | 'flexible';
};

type EvaluationRequest = {
  userMessage: string;
  aiResponse: string;
  pendingSteps: StepInput[];
  flexibility?: 'rigid' | 'normal' | 'flexible';
  currentDay?: number;
  currentTimeOfDay?: string;
  debugTrace?: boolean;
};

type StepUpdate = {
  stepId: string;
  completed: boolean;
  modelCompleted: boolean;
  result: 'no_progress' | 'partial_progress' | 'completed' | 'unsupported';
  confidence: number;
  evidence: string;
  summary: string;
  rejectionReason?: string;
};

type ClassificationReview = StepUpdate & {
  index: number;
  accepted: boolean;
  knownStep: boolean;
  reason: string;
};

function clampConfidence(value: unknown): number {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(1, numeric));
}

function summarize(value: unknown, max = 320): string {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function normalizeEvidence(value: unknown, max = 320): string {
  return summarize(value, max)
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/^evidence\s*:\s*/i, "")
    .trim();
}

function isGenericEvidence(value: string): boolean {
  const normalized = normalizeEvidence(value).toLowerCase();
  return !normalized ||
    /^(short quote|close paraphrase|supported by|evidence from|latest exchange|short exchange evidence|brief evidence|model evidence)/i.test(normalized) ||
    normalized.includes("from this exchange");
}

function buildMalformedClassificationReview(reason: string, content: string): ClassificationReview {
  return {
    index: 0,
    stepId: "unknown",
    completed: false,
    modelCompleted: false,
    result: "unsupported",
    confidence: 0,
    evidence: "",
    summary: summarize(content, 260),
    accepted: false,
    knownStep: false,
    reason,
    rejectionReason: reason,
  };
}

const allowedResults = new Set<StepUpdate["result"]>([
  "no_progress",
  "partial_progress",
  "completed",
  "unsupported",
]);

function normalizeResult(value: unknown, completed: unknown): StepUpdate["result"] {
  const raw = String(value || "").toLowerCase();
  if (allowedResults.has(raw as StepUpdate["result"])) return raw as StepUpdate["result"];
  return completed === true ? "completed" : "no_progress";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }
  const corsHeaders = getCorsHeaders(req);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const rateDecision = checkRateLimit({ scope: "evaluate-goal-progress", key: user.id, windowMs: SUPPORT_RATE_LIMIT_WINDOW_MS, max: SUPPORT_RATE_LIMIT_MAX });
    if (!rateDecision.allowed) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded. Please wait before retrying goal progress evaluation.",
          retryAfterSeconds: rateDecision.retryAfterSeconds,
          stepUpdates: [],
        }),
        { status: 429, headers: { ...corsHeaders, ...getRateLimitHeaders(rateDecision), "Content-Type": "application/json" } }
      );
    }
    const rateHeaders = getRateLimitHeaders(rateDecision);
    const responseHeadersBase = { ...corsHeaders, ...rateHeaders };

    const body: EvaluationRequest = await req.json();
    const { userMessage, aiResponse, pendingSteps, currentDay, currentTimeOfDay, debugTrace = false } = body;
    const debugTraceAllowed = await shouldReturnAdminDebugTrace(supabase, user.id, debugTrace, "[evaluate-goal-progress]");

    if (!userMessage || !pendingSteps?.length) {
      return new Response(JSON.stringify({ stepUpdates: [] }), {
        headers: { ...responseHeadersBase, "Content-Type": "application/json" }
      });
    }

    const XAI_API_KEY = Deno.env.get("XAI_API_KEY");
    if (!XAI_API_KEY) {
      throw new Error("XAI_API_KEY is not configured");
    }

    const stepsContext = pendingSteps.map((s, i) => {
      const parts = [
        `Step ${i + 1}`,
        `step_id: ${s.stepId}`,
        s.goalId ? `goal_id: ${s.goalId}` : "",
        s.goalTitle ? `goal_title: ${s.goalTitle}` : "",
        s.goalDesiredOutcome ? `goal_desired_outcome: ${s.goalDesiredOutcome}` : "",
        s.goalCurrentStatus ? `goal_current_status: ${s.goalCurrentStatus}` : "",
        `guidance_strength: ${s.flexibility || body.flexibility || "normal"}`,
        `step_description: ${s.description}`,
      ].filter(Boolean);
      return parts.join("\n");
    }).join('\n\n');

    const timeContext = currentDay != null || currentTimeOfDay
      ? `\nCURRENT STORY TIMELINE:\n- Day: ${currentDay ?? 'unknown'}\n- Time of Day: ${currentTimeOfDay ?? 'unknown'}\n\nUse this timeline context when evaluating time-sensitive goals (e.g. "by Day 3", "before nightfall").\n`
      : '';

    const classificationPrompt = `You are a story goal progress evaluator. Analyze how the latest exchange relates to each pending story step.
${timeContext}
PENDING STEPS:
${stepsContext}

USER MESSAGE:
${userMessage}

AI RESPONSE:
${aiResponse}

Evaluate each pending step from the latest exchange only, using the existing goal context to understand what the step means. A step is completed only when the latest exchange establishes the lasting condition described by that step as true in the story state. Discussion, intention, pressure, preparation, partial movement, or a temporary scene action can be partial progress, but it is not completion.

Goal guidance strength affects how cautious you should be. Rigid goals can remain important background direction, but their steps still require direct support before completion. Flexible goals may drift or pause, but they should not be completed from weak evidence.

For each step, return a result:
- no_progress: the latest exchange does not materially advance this step
- partial_progress: the latest exchange moves toward the step but does not make it true yet
- completed: the lasting condition is now true
- unsupported: the step cannot be evaluated from this exchange

Evidence must be a short quote or close paraphrase from the latest user message or AI response. Confidence is 0 to 1. Use high confidence only when the evidence directly supports the result.

Respond in JSON format ONLY:
{
  "classifications": [
    {
      "stepId": "...",
      "result": "no_progress|partial_progress|completed|unsupported",
      "completed": true/false,
      "confidence": 0.0,
      "evidence": "Short quote or close paraphrase from this exchange.",
      "summary": "Brief explanation."
    }
  ]
}

Set "completed" to true only when result is "completed", confidence is at least 0.75, and evidence directly supports the lasting condition. Empty or conservative results are valid.`;

    const messages = [
      { role: "system" as const, content: "You are a precise story goal classifier. Respond only in valid JSON." },
      { role: "user" as const, content: classificationPrompt },
    ];
    const responseFormat = {
      type: "json_schema",
      json_schema: {
        name: "chronicle_goal_progress",
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            classifications: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  stepId: { type: "string" },
                  result: { type: "string", enum: ["no_progress", "partial_progress", "completed", "unsupported"] },
                  completed: { type: "boolean" },
                  confidence: { type: "number" },
                  evidence: { type: "string" },
                  summary: { type: "string" },
                },
                required: ["stepId", "result", "completed", "confidence", "evidence", "summary"],
              },
            },
          },
          required: ["classifications"],
        },
      },
    };
    const result = await callXaiResponses({
      apiKey: XAI_API_KEY,
      model: "grok-4.3",
      messages,
      temperature: 0.3,
      maxOutputTokens: 1024,
      store: SUPPORT_STORE,
      reasoningEffort: SUPPORT_REASONING_EFFORT,
      textFormat: responseFormat,
    });
    const debugPayload = debugTraceAllowed
      ? {
          modelRequest: result.modelRequest,
        }
      : null;

    if (!result.ok) {
      console.error(`[evaluate-goal-progress] xAI Responses error: ${result.status} - ${result.errorText}`);
      return new Response(JSON.stringify({ stepUpdates: [], error: 'Classification failed', ...(debugPayload ? { chronicle_debug_payload: debugPayload } : {}) }), {
        headers: { ...responseHeadersBase, "Content-Type": "application/json" }
      });
    }

    const data = await result.response.json();
    const bodyError = getXaiResponsesBodyError(data, { requireOutputText: true });
    if (bodyError) {
      console.error(`[evaluate-goal-progress] xAI Responses body error: ${bodyError}`);
      return new Response(JSON.stringify({
        stepUpdates: [],
        error: "Classification failed",
        providerBodyError: bodyError,
        ...(debugPayload ? { chronicle_debug_payload: debugPayload } : {}),
      }), {
        headers: { ...responseHeadersBase, "Content-Type": "application/json" },
      });
    }
    const content = extractXaiResponsesText(data) || '';
    
    let parsed: {
      classifications: Array<{
        stepId: string;
        result?: string;
        completed?: boolean;
        confidence?: number;
        evidence?: string;
        summary?: string;
      }>;
    };
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch {
      console.error('[evaluate-goal-progress] Failed to parse classification response:', content);
      const classificationReviews = [buildMalformedClassificationReview("parse_error", content)];
      return new Response(JSON.stringify({
        stepUpdates: [],
        classificationReviews,
        rejectedClassifications: classificationReviews,
        parseError: "Failed to parse classification response",
        ...(debugPayload ? { chronicle_debug_payload: debugPayload } : {}),
      }), {
        headers: { ...responseHeadersBase, "Content-Type": "application/json" }
      });
    }

    if (!Array.isArray(parsed.classifications)) {
      const classificationReviews = [buildMalformedClassificationReview("classifications_not_array", content)];
      return new Response(JSON.stringify({
        stepUpdates: [],
        classificationReviews,
        rejectedClassifications: classificationReviews,
        parseError: "classifications was not an array",
        ...(debugPayload ? { chronicle_debug_payload: debugPayload } : {}),
      }), {
        headers: { ...responseHeadersBase, "Content-Type": "application/json" }
      });
    }

    const classifications = parsed.classifications;
    const pendingByStepId = new Map(pendingSteps.map((step) => [step.stepId, step]));
    const classificationReviews: ClassificationReview[] = classifications.map((raw, index) => {
      const c = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
      const rawStepId = typeof c.stepId === "string" ? c.stepId.trim() : "";
      const step = pendingByStepId.get(rawStepId);
      const confidence = clampConfidence(c.confidence);
      const evidence = normalizeEvidence(c.evidence, 280);
      const result = normalizeResult(c.result, c.completed);
      const modelCompleted = c.completed === true;
      const completed = !!step && result === "completed" && modelCompleted && confidence >= 0.75 && !!evidence && !isGenericEvidence(evidence);
      const reason = completed
        ? "accepted"
        : !rawStepId
          ? "missing_step_id"
          : !step
            ? "unknown_step"
            : result !== "completed"
              ? "result_not_completed"
              : !modelCompleted
                ? "not_marked_completed"
                : confidence < 0.75
                  ? "low_confidence"
                  : !evidence || isGenericEvidence(evidence)
                    ? "missing_evidence"
                    : "rejected";
      const review: ClassificationReview = {
        index,
        stepId: rawStepId || "unknown",
        completed,
        modelCompleted,
        result,
        confidence,
        evidence,
        summary: summarize(c.summary, 260),
        accepted: completed,
        knownStep: Boolean(step),
        reason,
      };
      if (!completed) review.rejectionReason = reason;
      return review;
    });

    const stepUpdates: StepUpdate[] = classificationReviews
      .filter((review) => review.knownStep)
      .map(({ index: _index, accepted: _accepted, knownStep: _knownStep, reason: _reason, ...update }) => update);
    const rejectedClassifications = classificationReviews.filter(
      (review) => !review.accepted && (review.modelCompleted || review.result === "completed" || !review.knownStep),
    );

    console.log(`[evaluate-goal-progress] Classified ${stepUpdates.length} steps, ${stepUpdates.filter(u => u.completed).length} completed`);

    await recordServerAiUsage({
      userId: user.id,
      eventType: "goal_progress_eval_call",
      functionName: "evaluate-goal-progress",
      metadata: {
        modelId: "grok-4.3",
        status: "success",
        pendingStepCount: pendingSteps.length,
        classifiedStepCount: stepUpdates.length,
        completedStepCount: stepUpdates.filter((update) => update.completed).length,
      },
    });

    return new Response(JSON.stringify({
      stepUpdates,
      classificationReviews,
      rejectedClassifications,
      ...(debugPayload ? { chronicle_debug_payload: debugPayload } : {}),
    }), {
      headers: { ...responseHeadersBase, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("[evaluate-goal-progress] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
