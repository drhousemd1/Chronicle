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

type DirectiveRequest = {
  recentMessages: { role: string; text: string }[];
  storyGoals: { description: string; flexibility: string; currentStepDescription?: string }[];
  characterGoals: { name: string; goals: string[]; desires: string[] }[];
  currentDay: number;
  currentTimeOfDay: string;
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

    const body: DirectiveRequest = await req.json();
    const { recentMessages, storyGoals, characterGoals, currentDay, currentTimeOfDay } = body;

    if (!recentMessages?.length) {
      return new Response(JSON.stringify({ directive: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const XAI_API_KEY = Deno.env.get("XAI_API_KEY");
    if (!XAI_API_KEY) {
      console.error("[generate-narrative-directive] XAI_API_KEY is not configured");
      throw new Error("XAI_API_KEY is not configured");
    }
    console.log(`[generate-narrative-directive] Processing request: ${recentMessages.length} messages, ${storyGoals?.length || 0} goals, ${characterGoals?.length || 0} character goals`);

    // Build compact conversation summary
    const conversationSummary = recentMessages
      .map(m => `[${m.role}]: ${m.text.slice(0, 300)}${m.text.length > 300 ? '...' : ''}`)
      .join('\n');

    // Build goals context
    const goalsContext = storyGoals?.length
      ? `STORY ARCS:\n${storyGoals.map(g => `- [${g.flexibility}] ${g.description}${g.currentStepDescription ? ` (Current step: ${g.currentStepDescription})` : ''}`).join('\n')}`
      : 'No story arcs defined.';

    const charGoalsContext = characterGoals?.length
      ? `CHARACTER GOALS:\n${characterGoals.map(c => `- ${c.name}: Goals=[${c.goals.join('; ')}] Desires=[${c.desires.join('; ')}]`).join('\n')}`
      : '';

    const directivePrompt = `You are a narrative director analyzing a roleplay conversation. Your job is to produce a 1-3 sentence directive telling the AI what should happen NEXT to advance the story meaningfully.

CONTEXT:
- Day ${currentDay}, Time: ${currentTimeOfDay}

${goalsContext}

${charGoalsContext}

RECENT CONVERSATION (last messages):
${conversationSummary}

ANALYSIS RULES:
1. Identify what has been STAGNANT — emotional circling, repeated reactions, static locations, unresolved goals.
2. Identify the MOST URGENT story beat that needs advancement — a pending arc step, an unacted-on character goal, a scene that's been static too long.
3. Produce a SPECIFIC, ACTIONABLE directive for the next AI response. Name characters. Name actions. Be concrete.
4. If a character has been passively reacting for multiple turns, direct them to take initiative.
5. If the scene has been in one location for many exchanges, consider directing a location change or interruption.
6. NEVER say "continue the story" — that's too vague. Say WHAT should happen and WHO should do it.

Respond with ONLY the directive text (1-3 sentences). No preamble, no explanation.`;

    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${XAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "grok-4-1-fast-reasoning",
        messages: [
          { role: "system", content: "You are a concise narrative director. Respond with only the directive — no preamble or explanation." },
          { role: "user", content: directivePrompt },
        ],
        temperature: 0.4,
        max_tokens: 256,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[generate-narrative-directive] xAI error: ${response.status} - ${errorText}`);
      return new Response(JSON.stringify({ directive: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const data = await response.json();
    const directive = data.choices?.[0]?.message?.content?.trim() || null;

    console.log(`[generate-narrative-directive] Generated directive: ${directive?.slice(0, 100)}...`);

    return new Response(JSON.stringify({ directive }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("[generate-narrative-directive] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error", directive: null }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
