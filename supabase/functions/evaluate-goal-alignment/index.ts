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

type GoalKind = "story" | "character";
type GoalFlexibility = "rigid" | "normal" | "flexible";
type GoalAlignmentSignal = "support" | "resistance" | "drift" | "neutral" | "not_applicable";

type GoalInput = {
  goalId: string;
  goalKind: GoalKind;
  characterId?: string | null;
  characterName?: string;
  title: string;
  desiredOutcome?: string;
  currentStatus?: string;
  flexibility?: GoalFlexibility;
  openStep?: string;
  alignment?: {
    score?: number;
    status?: string;
    trend?: string;
    lastSignal?: string;
    lastRationale?: string;
  };
};

type EvaluationRequest = {
  userMessage: string;
  aiResponse: string;
  recentContext?: string;
  goals: GoalInput[];
  currentDay?: number;
  currentTimeOfDay?: string;
  debugTrace?: boolean;
};

type GoalAlignmentEvaluation = {
  goalId: string;
  goalKind: GoalKind;
  characterId?: string | null;
  signal: GoalAlignmentSignal;
  intensity: 0 | 1 | 2 | 3;
  rationale: string;
  evidence?: string;
};

type AlignmentReview = Partial<GoalAlignmentEvaluation> & {
  index: number;
  accepted: boolean;
  reason: string;
  goalId: string;
  goalKind?: GoalKind;
};

const allowedSignals = new Set<GoalAlignmentSignal>([
  "support",
  "resistance",
  "drift",
  "neutral",
  "not_applicable",
]);

function normalizeSignal(value: unknown): GoalAlignmentSignal | null {
  const signal = String(value || "not_applicable").toLowerCase() as GoalAlignmentSignal;
  return allowedSignals.has(signal) ? signal : null;
}

function normalizeIntensity(value: unknown): 0 | 1 | 2 | 3 | null {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(numeric) || numeric < 0 || numeric > 3) return null;
  return numeric as 0 | 1 | 2 | 3;
}

function summarize(value: unknown, max = 260): string {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function buildMalformedAlignmentReview(reason: string, content: string): AlignmentReview {
  return {
    index: 0,
    accepted: false,
    reason,
    goalId: "unknown",
    rationale: summarize(content, 220),
    evidence: "",
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }
  const corsHeaders = getCorsHeaders(req);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rateDecision = checkRateLimit({ scope: "evaluate-goal-alignment", key: user.id, windowMs: SUPPORT_RATE_LIMIT_WINDOW_MS, max: SUPPORT_RATE_LIMIT_MAX });
    if (!rateDecision.allowed) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded. Please wait before retrying goal alignment evaluation.",
          retryAfterSeconds: rateDecision.retryAfterSeconds,
          evaluations: [],
        }),
        { status: 429, headers: { ...corsHeaders, ...getRateLimitHeaders(rateDecision), "Content-Type": "application/json" } }
      );
    }
    const rateHeaders = getRateLimitHeaders(rateDecision);
    const responseHeadersBase = { ...corsHeaders, ...rateHeaders };

    const body: EvaluationRequest = await req.json();
    const { userMessage, aiResponse, recentContext = "", goals = [], currentDay, currentTimeOfDay, debugTrace = false } = body;
    const debugTraceAllowed = await shouldReturnAdminDebugTrace(supabase, user.id, debugTrace, "[evaluate-goal-alignment]");

    if ((!userMessage && !aiResponse) || goals.length === 0) {
      return new Response(JSON.stringify({ evaluations: [] }), {
        headers: { ...responseHeadersBase, "Content-Type": "application/json" },
      });
    }

    const XAI_API_KEY = Deno.env.get("XAI_API_KEY");
    if (!XAI_API_KEY) {
      throw new Error("XAI_API_KEY is not configured");
    }

    const goalsContext = goals.map((goal, index) => {
      const parts = [
        `Goal ${index + 1}`,
        `id: ${goal.goalId}`,
        `kind: ${goal.goalKind}`,
        goal.characterId ? `character_id: ${goal.characterId}` : "",
        goal.characterName ? `character_name: ${goal.characterName}` : "",
        `title: ${goal.title}`,
        goal.desiredOutcome ? `desired_outcome: ${goal.desiredOutcome}` : "",
        goal.currentStatus ? `current_status: ${goal.currentStatus}` : "",
        `guidance_strength: ${goal.flexibility || "normal"}`,
        goal.openStep ? `open_milestone: ${goal.openStep}` : "",
        goal.alignment ? `current_alignment: score ${goal.alignment.score ?? 50}/100, status ${goal.alignment.status || "active"}, trend ${goal.alignment.trend || "stable"}, last_signal ${goal.alignment.lastSignal || "not_applicable"}` : "",
        goal.alignment?.lastRationale ? `last_rationale: ${goal.alignment.lastRationale}` : "",
      ].filter(Boolean);
      return parts.join("\n");
    }).join("\n\n");

    const storyClock = currentDay != null || currentTimeOfDay
      ? `Day: ${currentDay ?? "unknown"}\nTime of Day: ${currentTimeOfDay ?? "unknown"}`
      : "Day: unknown\nTime of Day: unknown";

    const userPrompt = `You are the post-turn GOAL ALIGNMENT evaluator for an adult roleplay app.

Your job is NOT to write story text, create new goals, complete goal steps, or update character cards.
Your only job is to judge whether the latest exchange shows the user and scene supporting, resisting, drifting away from, or not engaging each existing goal.

--- STORY CLOCK ---
${storyClock}

--- RECENT CONTEXT ---
${recentContext || "(none provided)"}

--- LATEST USER MESSAGE ---
${userMessage || "(empty)"}

--- LATEST AI RESPONSE ---
${aiResponse || "(empty)"}

--- GOALS TO EVALUATE ---
${goalsContext}

--- CLASSIFICATION RULES ---
For each goal, choose exactly one signal:
- support: The latest exchange accepts, enables, follows, advances, or becomes more receptive to this goal.
- resistance: The user explicitly refuses, blocks, contradicts, rejects, avoids, or pushes back against this goal or an AI attempt to move toward it.
- drift: The user or scene keeps moving elsewhere without directly rejecting the goal. Use this when the goal is becoming less central because the roleplay is naturally carrying away from it.
- neutral: The goal is present as background but the exchange does not meaningfully change alignment.
- not_applicable: The goal has no real connection to this exchange.

Intensity:
- 0: no meaningful signal
- 1: weak signal
- 2: clear signal
- 3: strong signal

Important:
- Evaluate alignment only. Do not judge whether a step is completed.
- Do not penalize a goal just because it did not appear in a single turn. Use drift only when the user or scene is actively carrying away from it.
- Rigid, normal, and flexible are guidance strengths, not signals. Classify the exchange evidence only; these results may remain diagnostic until the app explicitly enables adaptive goal pressure.
- Empty or mostly not_applicable results are valid.

Respond in JSON only:
{
  "evaluations": [
    {
      "goalId": "...",
      "goalKind": "story|character",
      "characterId": null,
      "signal": "support|resistance|drift|neutral|not_applicable",
      "intensity": 0,
      "rationale": "One concise reason.",
      "evidence": "Short quote or paraphrase from this exchange."
    }
  ]
}`;

    const messages = [
      { role: "system" as const, content: "You are a precise goal-alignment classifier. Return valid JSON only." },
      { role: "user" as const, content: userPrompt },
    ];
    const responseFormat = {
      type: "json_schema",
      json_schema: {
        name: "chronicle_goal_alignment",
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            evaluations: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  goalId: { type: "string" },
                  goalKind: { type: "string", enum: ["story", "character"] },
                  characterId: { anyOf: [{ type: "string" }, { type: "null" }] },
                  signal: { type: "string", enum: ["support", "resistance", "drift", "neutral", "not_applicable"] },
                  intensity: { type: "number", enum: [0, 1, 2, 3] },
                  rationale: { type: "string" },
                  evidence: { type: "string" },
                },
                required: ["goalId", "goalKind", "characterId", "signal", "intensity", "rationale", "evidence"],
              },
            },
          },
          required: ["evaluations"],
        },
      },
    };
    const result = await callXaiResponses({
      apiKey: XAI_API_KEY,
      model: "grok-4.3",
      messages,
      temperature: 0.15,
      maxOutputTokens: 2048,
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
      console.error(`[evaluate-goal-alignment] xAI Responses error: ${result.status} - ${result.errorText}`);
      return new Response(JSON.stringify({
        evaluations: [],
        error: "Goal alignment classification failed",
        ...(debugPayload ? { chronicle_debug_payload: debugPayload } : {}),
      }), {
        headers: { ...responseHeadersBase, "Content-Type": "application/json" },
      });
    }

    const data = await result.response.json();
    const bodyError = getXaiResponsesBodyError(data, { requireOutputText: true });
    if (bodyError) {
      console.error(`[evaluate-goal-alignment] xAI Responses body error: ${bodyError}`);
      return new Response(JSON.stringify({
        evaluations: [],
        error: "Goal alignment classification failed",
        providerBodyError: bodyError,
        ...(debugPayload ? { chronicle_debug_payload: debugPayload } : {}),
      }), {
        headers: { ...responseHeadersBase, "Content-Type": "application/json" },
      });
    }
    const content = extractXaiResponsesText(data) || "";

    let parsed: { evaluations?: GoalAlignmentEvaluation[] };
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch {
      console.error("[evaluate-goal-alignment] Failed to parse classification response:", content);
      const alignmentReviews = [buildMalformedAlignmentReview("parse_error", content)];
      return new Response(JSON.stringify({
        evaluations: [],
        alignmentReviews,
        rejectedEvaluations: alignmentReviews,
        parseError: "parse_error",
        ...(debugPayload ? { chronicle_debug_payload: debugPayload } : {}),
      }), {
        headers: { ...responseHeadersBase, "Content-Type": "application/json" },
      });
    }

    if (!Array.isArray(parsed.evaluations)) {
      const alignmentReviews = [buildMalformedAlignmentReview("evaluations_not_array", content)];
      return new Response(JSON.stringify({
        evaluations: [],
        alignmentReviews,
        rejectedEvaluations: alignmentReviews,
        parseError: "evaluations_not_array",
        ...(debugPayload ? { chronicle_debug_payload: debugPayload } : {}),
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const goalKeys = new Set(goals.map((goal) => `${goal.goalKind}:${goal.characterId || ""}:${goal.goalId}`));
    const alignmentReviews: AlignmentReview[] = parsed.evaluations.map((evaluation, index) => {
      const goalKind = evaluation?.goalKind === "story" || evaluation?.goalKind === "character" ? evaluation.goalKind : null;
      const signal = normalizeSignal(evaluation.signal);
      const intensity = normalizeIntensity(evaluation.intensity);
      const goalId = summarize(evaluation?.goalId, 120);

      const normalized = {
        goalId,
        goalKind,
        characterId: evaluation?.characterId ?? null,
        signal,
        intensity,
        rationale: summarize(evaluation?.rationale),
        evidence: summarize(evaluation?.evidence, 220),
      };
      const key = `${normalized.goalKind || ""}:${normalized.characterId || ""}:${normalized.goalId}`;
      const accepted = Boolean(goalKind && signal && intensity !== null && goalKeys.has(key));
      const reason = accepted
        ? "accepted"
        : !goalId
          ? "missing_goal_id"
          : !goalKind
            ? "invalid_goal_kind"
            : !signal
              ? "invalid_signal"
              : intensity === null
                ? "invalid_intensity"
                : !goalKeys.has(key)
                  ? "unknown_goal"
                  : "rejected";
      return {
        index,
        ...normalized,
        accepted,
        reason,
      } as AlignmentReview;
    });
    const evaluations = alignmentReviews
      .filter((review) => review.accepted)
      .map(({ index: _index, accepted: _accepted, reason: _reason, ...evaluation }) => evaluation as GoalAlignmentEvaluation);
    const rejectedEvaluations = alignmentReviews.filter((review) => !review.accepted);

    console.log(`[evaluate-goal-alignment] Evaluated ${evaluations.length} of ${goals.length} goals`);

    await recordServerAiUsage({
      userId: user.id,
      eventType: "goal_alignment_eval_call",
      functionName: "evaluate-goal-alignment",
      metadata: {
        modelId: "grok-4.3",
        status: "success",
        goalCount: goals.length,
        acceptedEvaluationCount: evaluations.length,
      },
    });

    return new Response(JSON.stringify({
      evaluations,
      alignmentReviews,
      rejectedEvaluations,
      ...(debugPayload ? { chronicle_debug_payload: debugPayload } : {}),
    }), {
      headers: { ...responseHeadersBase, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[evaluate-goal-alignment] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error", evaluations: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
