import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messageText, characterNames, modelId } = await req.json();
    
    if (!messageText) {
      return new Response(
        JSON.stringify({ error: 'messageText is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build system prompt for memory extraction
    const systemPrompt = `You are extracting key story events from roleplay dialogue for a memory system.

The memory system helps maintain narrative continuity by storing important events that happened in the story.

CHARACTER NAMES IN STORY: ${characterNames?.join(', ') || 'Unknown characters'}

Focus on extracting:
- Relationship changes (first kiss, confession, proposal, breakup, becoming friends)
- Major revelations (secrets revealed, true identity discovered, important information shared)
- Significant decisions (agreements, promises, plans made)
- Physical/emotional state changes (injuries, mood shifts, realizations)
- Location changes or important arrivals/departures
- Any "first time" events (first meeting, first date, first fight, etc.)

Rules:
- Return 1-3 bullet points MAXIMUM
- Each point should be under 100 characters
- Use past tense, third person
- Include character names when relevant
- Exclude mundane dialogue, descriptions, and routine actions
- If no significant events happened, return an empty array

IMPORTANT: Return ONLY a valid JSON array of strings, nothing else. No markdown, no explanation.
Example: ["They shared their first kiss", "Sarah revealed she is a spy"]
If nothing significant: []`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelId || "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Extract key story events from this message:\n\n${messageText}` }
        ],
        temperature: 0.3, // Low temperature for more focused extraction
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to extract memory events");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '[]';
    
    // Parse the JSON response
    let extractedEvents: string[] = [];
    try {
      // Try to find JSON array in the response
      const jsonMatch = content.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        extractedEvents = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error("Failed to parse extraction response:", content);
      extractedEvents = [];
    }

    // Ensure we only have strings and limit to 3
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
