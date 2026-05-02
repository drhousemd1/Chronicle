import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

type StepInput = {
  stepId: string;
  description: string;
};

type EvaluationRequest = {
  userMessage: string;
  aiResponse: string;
  pendingSteps: StepInput[];
  flexibility: 'rigid' | 'normal' | 'flexible';
  currentDay?: number;
  currentTimeOfDay?: string;
};

type StepUpdate = {
  stepId: string;
  completed: boolean;
  summary: string;
};

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
    const { userMessage, aiResponse, pendingSteps, currentDay, currentTimeOfDay } = body;

    if (!userMessage || !pendingSteps?.length) {
      return new Response(JSON.stringify({ stepUpdates: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const XAI_API_KEY = Deno.env.get("XAI_API_KEY");
    if (!XAI_API_KEY) {
      throw new Error("XAI_API_KEY is not configured");
    }

    const stepsContext = pendingSteps.map((s, i) =>
      `Step ${i + 1} (ID: ${s.stepId}): "${s.description}"`
    ).join('\n');

    const timeContext = currentDay != null || currentTimeOfDay
      ? `\nCURRENT STORY TIMELINE:\n- Day: ${currentDay ?? 'unknown'}\n- Time of Day: ${currentTimeOfDay ?? 'unknown'}\n\nUse this timeline context when evaluating time-sensitive goals (e.g. "by Day 3", "before nightfall").\n`
      : '';

    const classificationPrompt = `You are a story goal progress evaluator. Analyze how the latest exchange relates to each pending story step.
${timeContext}
PENDING STEPS:
${stepsContext}

USER MESSAGE:
${userMessage}

AI RESPONSE (for context):
${aiResponse}

For EACH step, determine if the exchange ADVANCES or COMPLETES the step's objective. Consider the current day and time when evaluating deadline-based or pacing-sensitive goals. Classify as:
- ALIGNED: The exchange moves toward or completes the step's objective
- NOT_ALIGNED: The exchange does not advance this step

Respond in JSON format ONLY:
{
  "classifications": [
    { "stepId": "...", "completed": true/false, "summary": "Brief 1-sentence explanation" }
  ]
}

Set "completed" to true ONLY when the step's objective has been clearly achieved or fulfilled.`;

    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${XAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "grok-4.20-0309-reasoning",
        messages: [
          { role: "system", content: "You are a precise story goal classifier. Respond only in valid JSON." },
          { role: "user", content: classificationPrompt },
        ],
        temperature: 0.3,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[evaluate-goal-progress] xAI error: ${response.status} - ${errorText}`);
      return new Response(JSON.stringify({ stepUpdates: [], error: 'Classification failed' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    let parsed: { classifications: Array<{ stepId: string; completed: boolean; summary: string }> };
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch {
      console.error('[evaluate-goal-progress] Failed to parse classification response:', content);
      return new Response(JSON.stringify({ stepUpdates: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const stepUpdates: StepUpdate[] = (parsed.classifications || []).map(c => {
      const step = pendingSteps.find(s => s.stepId === c.stepId);
      if (!step) return null;
      return {
        stepId: c.stepId,
        completed: !!c.completed,
        summary: c.summary || '',
      };
    }).filter(Boolean) as StepUpdate[];

    console.log(`[evaluate-goal-progress] Classified ${stepUpdates.length} steps, ${stepUpdates.filter(u => u.completed).length} completed`);

    return new Response(JSON.stringify({ stepUpdates }), {
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
