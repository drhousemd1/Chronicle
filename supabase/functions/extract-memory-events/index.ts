// ============================================================================
// GROK ONLY -- All memory extraction uses xAI Grok. No Gemini. No OpenAI.
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(req) });
  }
  const corsHeaders = getCorsHeaders(req);

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { messageText, userMessage, aiResponse, characterNames, modelId } = await req.json();
    const exchangeText = [
      userMessage ? `USER MESSAGE:\n${userMessage}` : '',
      aiResponse ? `AI RESPONSE:\n${aiResponse}` : '',
      !userMessage && !aiResponse && messageText ? `MESSAGE:\n${messageText}` : '',
    ].filter(Boolean).join('\n\n---\n\n');
    
    if (!exchangeText) {
      return new Response(
        JSON.stringify({ error: 'userMessage, aiResponse, or messageText is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GROK ONLY -- use xAI API key
    const XAI_API_KEY = Deno.env.get("XAI_API_KEY");
    if (!XAI_API_KEY) {
      throw new Error("XAI_API_KEY is not configured");
    }

    const systemPrompt = `You are a story memory curator for an adult roleplay. Your job is to identify only durable events from the latest user+AI exchange that will affect future scenes and narrative consistency.

CHARACTERS: ${characterNames?.join(', ') || 'Unknown'}

--- EXTRACT ---
- Relationship milestones, intimacy milestones, durable agreements, promises, rules, secrets revealed, major decisions, injuries, pregnancy/status changes, persistent location changes, appearance changes, or new backstory that would cause a future inconsistency if forgotten.
- Include facts introduced by the USER even if the AI response did not repeat them.
- Use past tense and include character names.

--- IGNORE ---
- Minor gestures, routine actions, mood-only beats, atmosphere, flirting/buildup without consequence, or lines that do not reveal new information.

--- RULES ---
- Return 0-3 events maximum.
- Empty array is valid when nothing durable happened.
- Keep each point under 90 characters.
- For preferences, intentions, rules, or secrets, state who they belong to.

Return ONLY a JSON array. Example: ["James confessed his love", "Ashley revealed her secret identity"]
Empty array is acceptable: []`;

    // GROK ONLY -- call xAI API directly
    const effectiveModel = modelId || "grok-4.20-0309-reasoning";
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
          { role: "user", content: `Extract durable story-memory events from this latest exchange:\n\n${exchangeText}` }
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

    console.log(`[extract-memory-events] Extracted ${extractedEvents.length} events from latest exchange`);

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
