import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  'https://hello-git-hug.lovable.app',
  'https://id-preview--a004b824-bad4-4e86-a30f-524c97ca4ddb.lovable.app',
  'http://localhost:5173',
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

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
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }
  const corsHeaders = getCorsHeaders(req);

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
    const { userMessage, aiResponse, pendingSteps } = body;

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

    const classificationPrompt = `You are a story goal progress evaluator. Analyze how the user's response relates to each pending story goal step.

PENDING STEPS:
${stepsContext}

USER MESSAGE:
${userMessage}

AI RESPONSE (for context):
${aiResponse}

For EACH step, classify the user's behavior as exactly ONE of:
- ALIGNED: User cooperates with or advances toward the step's objective
- SOFT_RESISTANCE: User shows hesitation, deferral, ambiguity, or avoidance
- HARD_RESISTANCE: User actively refuses, blocks, contradicts, or takes action against the step's objective

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
        model: "grok-4-1-fast-reasoning",
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

    const stepUpdates: StepUpdate[] = (parsed.classifications || []).map(c => {
      const step = pendingSteps.find(s => s.stepId === c.stepId);
      if (!step) return null;
      return {
        stepId: c.stepId,
        classification: c.classification as StepUpdate['classification'],
        summary: c.summary || '',
      };
    }).filter(Boolean) as StepUpdate[];

    console.log(`[evaluate-arc-progress] Classified ${stepUpdates.length} steps`);

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
