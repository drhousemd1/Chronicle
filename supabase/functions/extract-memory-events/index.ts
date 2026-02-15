// ============================================================================
// GROK ONLY -- All memory extraction uses xAI Grok. No Gemini. No OpenAI.
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } });
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(authHeader.replace('Bearer ', ''));
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { messageText, characterNames, modelId } = await req.json();
    
    if (!messageText) {
      return new Response(
        JSON.stringify({ error: 'messageText is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GROK ONLY -- use xAI API key
    const XAI_API_KEY = Deno.env.get("XAI_API_KEY");
    if (!XAI_API_KEY) {
      throw new Error("XAI_API_KEY is not configured");
    }

    const systemPrompt = `You are a story memory curator for an adult roleplay. Your job is to identify ONLY events that will affect future scenes and that the AI must remember for narrative consistency.

CHARACTERS: ${characterNames?.join(', ') || 'Unknown'}

WHAT TO EXTRACT (events with lasting consequences):

RELATIONSHIP & INTIMACY:
✓ Relationship milestones (first kiss, confession of love, becoming exclusive, breakup, proposal)
✓ Sexual acts that occurred (not just flirting or buildup)
✓ Changes in relationship dynamics (power shifts, one becoming dominant/submissive)
✓ Rules established between characters ("You will call me X", "No doing Y without permission")

REVELATIONS & SECRETS:
✓ Secrets revealed or discovered ("I'm actually a spy", "I have a twin sister")
✓ Revealed preferences - kinks, desires, turn-ons disclosed by a character
✓ New information about characters (backstory, true identity, hidden traits)

INTENTIONS & COMMITMENTS:
✓ Stated intentions - when a character declares what they want to do or their plan
✓ Promises or commitments made ("I'll meet you at midnight", "I promise to protect you")
✓ Major decisions or agreements (agreeing to elope, refusing a job offer)

PHYSICAL & STATUS CHANGES:
✓ Physical changes (injuries, illness, discovering pregnancy, transformations)
✓ Location changes that persist (moved cities, arrived at new home)
✓ Appearance changes (new haircut, costume, etc.)

WHAT TO IGNORE (scene flavor with no lasting impact):
✗ Minor gestures (touched shoulder, pulled closer, smiled, nodded)
✗ Invitations fulfilled immediately ("sit down" followed by sitting)
✗ Mood or atmosphere descriptions
✗ Dialogue that doesn't reveal new information
✗ Buildup/teasing without conclusion
✗ Routine actions (drinking coffee, looking out window)

KEY QUESTION: "If the AI forgot this, would it cause a plot hole or inconsistency later?"
- If YES → include it
- If NO → skip it

RULES:
1. Return 0-2 events MAXIMUM (only truly significant ones)
2. It's OKAY to return an empty array if nothing significant happened
3. Be extremely selective - less is more
4. Use past tense, include character names
5. Keep each point under 60 characters
6. For preferences/intentions, note WHO has them

EXAMPLES OF GOOD EXTRACTIONS:
✓ "James confessed his love for Ashley"
✓ "Ashley revealed she is a spy"
✓ "James promised to meet Ashley at midnight"
✓ "Ashley established a rule: James must ask permission first"
✓ "James revealed he has a feminization kink"
✓ "Ashley declared her plan to train James as her submissive"
✓ "James was injured in the fight"
✓ "Ashley discovered she is pregnant"
✓ "They agreed to elope next week"

Return ONLY a JSON array. Example: ["James confessed his love", "Ashley revealed her secret identity"]
Empty array is acceptable: []`;

    // GROK ONLY -- call xAI API directly
    const effectiveModel = modelId || "grok-3-mini";
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${XAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: effectiveModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Extract key story events from this message:\n\n${messageText}` }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("xAI error:", response.status, errorText);
      throw new Error("Failed to extract memory events");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '[]';
    
    let extractedEvents: string[] = [];
    try {
      const jsonMatch = content.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        extractedEvents = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error("Failed to parse extraction response:", content);
      extractedEvents = [];
    }

    extractedEvents = extractedEvents
      .filter((e: any) => typeof e === 'string' && e.trim().length > 0)
      .slice(0, 3);

    console.log(`[extract-memory-events] Extracted ${extractedEvents.length} events from message`);

    return new Response(
      JSON.stringify({ extractedEvents }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in extract-memory-events:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
