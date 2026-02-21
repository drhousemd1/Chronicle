import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type StepInput = {
  stepId: string;
  description: string;
  currentScore: number;
};

type EvaluationRequest = {
  userMessage: string;
  aiResponse: string;
  pendingSteps: StepInput[];
  flexibility: 'rigid' | 'normal' | 'flexible';
};

type StepUpdate = {
  stepId: string;
  classification: 'aligned' | 'soft_resistance' | 'hard_resistance';
  summary: string;
  newScore: number;
  suggestedStatusChange: 'failed' | 'deviated' | null;
};

const SCORE_DELTAS: Record<string, number> = {
  aligned: 10,
  soft_resistance: -5,
  hard_resistance: -10,
};

const THRESHOLDS: Record<string, { score: number; status: 'failed' | 'deviated' }> = {
  rigid: { score: -50, status: 'deviated' },
  normal: { score: -30, status: 'failed' },
  flexible: { score: -20, status: 'failed' },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
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
    const { userMessage, aiResponse, pendingSteps, flexibility } = body;

    if (!userMessage || !pendingSteps?.length) {
      return new Response(JSON.stringify({ stepUpdates: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const XAI_API_KEY = Deno.env.get("XAI_API_KEY");
    if (!XAI_API_KEY) {
      throw new Error("XAI_API_KEY is not configured");
    }

    // Build classification prompt
    const stepsContext = pendingSteps.map((s, i) =>
      `Step ${i + 1} (ID: ${s.stepId}): "${s.description}"`
    ).join('\n');

    const classificationPrompt = `You are a story arc progress evaluator. Analyze how the user's response relates to each pending story step.

PENDING STEPS:
${stepsContext}

USER MESSAGE:
${userMessage}

AI RESPONSE (for context):
${aiResponse}

For EACH step, classify the user's behavior as exactly ONE of:
- ALIGNED: User cooperates with or advances toward the step's objective
- SOFT_RESISTANCE: User shows hesitation, deferral, ambiguity, or avoidance ("let's talk later", "I'm not sure", changing subject)
- HARD_RESISTANCE: User actively refuses, blocks, contradicts, or takes action against the step's objective

IMPORTANT: Evaluate the OVERALL sentiment of the exchange as a single classification per step. Even if the user says "no" multiple times in one message, it counts as ONE classification.

Respond in JSON format ONLY:
{
  "classifications": [
    { "stepId": "...", "classification": "aligned|soft_resistance|hard_resistance", "summary": "Brief 1-sentence explanation" }
  ]
}`;

    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${XAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "grok-3-mini",
        messages: [
          { role: "system", content: "You are a precise story arc classifier. Respond only in valid JSON." },
          { role: "user", content: classificationPrompt },
        ],
        temperature: 0.3,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[evaluate-arc-progress] xAI error: ${response.status} - ${errorText}`);
      return new Response(JSON.stringify({ stepUpdates: [], error: 'Classification failed' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Parse JSON from response (handle markdown code blocks)
    let parsed: { classifications: Array<{ stepId: string; classification: string; summary: string }> };
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch {
      console.error('[evaluate-arc-progress] Failed to parse classification response:', content);
      return new Response(JSON.stringify({ stepUpdates: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const threshold = THRESHOLDS[flexibility] || THRESHOLDS.normal;

    // Calculate new scores and suggested status changes
    const stepUpdates: StepUpdate[] = (parsed.classifications || []).map(c => {
      const step = pendingSteps.find(s => s.stepId === c.stepId);
      if (!step) return null;

      const delta = SCORE_DELTAS[c.classification] || 0;
      // Clamp between -50 and +20
      const newScore = Math.max(-50, Math.min(20, (step.currentScore || 0) + delta));
      
      let suggestedStatusChange: 'failed' | 'deviated' | null = null;
      if (newScore <= threshold.score) {
        suggestedStatusChange = threshold.status;
      }

      return {
        stepId: c.stepId,
        classification: c.classification as StepUpdate['classification'],
        summary: c.summary || '',
        newScore,
        suggestedStatusChange,
      };
    }).filter(Boolean) as StepUpdate[];

    console.log(`[evaluate-arc-progress] Classified ${stepUpdates.length} steps for flexibility=${flexibility}`);

    return new Response(JSON.stringify({ stepUpdates }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("[evaluate-arc-progress] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
