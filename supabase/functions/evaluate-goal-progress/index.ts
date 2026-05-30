import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

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
  result: 'no_progress' | 'partial_progress' | 'completed' | 'unsupported';
  confidence: number;
  evidence: string;
  summary: string;
};

function clampConfidence(value: unknown): number {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(1, numeric));
}

function summarize(value: unknown, max = 320): string {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function isGenericEvidence(value: string): boolean {
  return /^(short quote|close paraphrase|supported by|evidence from|latest exchange)/i.test(value.trim());
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

    const body: EvaluationRequest = await req.json();
    const { userMessage, aiResponse, pendingSteps, currentDay, currentTimeOfDay, debugTrace = false } = body;

    if (!userMessage || !pendingSteps?.length) {
      return new Response(JSON.stringify({ stepUpdates: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
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

    const xaiRequestBody = {
      model: "grok-4.3",
      messages: [
        { role: "system", content: "You are a precise story goal classifier. Respond only in valid JSON." },
        { role: "user", content: classificationPrompt },
      ],
      temperature: 0.3,
      max_tokens: 1024,
    };
    const debugPayload = debugTrace === true
      ? {
          modelRequest: {
            endpoint: "https://api.x.ai/v1/chat/completions",
            method: "POST",
            capturedAt: Date.now(),
            requestBody: xaiRequestBody,
          },
        }
      : null;

    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${XAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(xaiRequestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[evaluate-goal-progress] xAI error: ${response.status} - ${errorText}`);
      return new Response(JSON.stringify({ stepUpdates: [], error: 'Classification failed', ...(debugPayload ? { chronicle_debug_payload: debugPayload } : {}) }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
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
      return new Response(JSON.stringify({ stepUpdates: [], ...(debugPayload ? { chronicle_debug_payload: debugPayload } : {}) }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const stepUpdates: StepUpdate[] = (parsed.classifications || []).map(c => {
      const step = pendingSteps.find(s => s.stepId === c.stepId);
      if (!step) return null;
      const confidence = clampConfidence(c.confidence);
      const evidence = summarize(c.evidence, 280);
      const result = normalizeResult(c.result, c.completed);
      const completed = result === "completed" && c.completed === true && confidence >= 0.75 && !!evidence && !isGenericEvidence(evidence);
      return {
        stepId: c.stepId,
        completed,
        result,
        confidence,
        evidence,
        summary: summarize(c.summary, 260),
      };
    }).filter(Boolean) as StepUpdate[];

    console.log(`[evaluate-goal-progress] Classified ${stepUpdates.length} steps, ${stepUpdates.filter(u => u.completed).length} completed`);

    return new Response(JSON.stringify({ stepUpdates, ...(debugPayload ? { chronicle_debug_payload: debugPayload } : {}) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("[evaluate-goal-progress] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
