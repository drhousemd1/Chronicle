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
    const systemPrompt = `You are extracting story events from roleplay dialogue for a memory system that helps maintain narrative continuity.

CHARACTER NAMES IN STORY: ${characterNames?.join(', ') || 'Unknown characters'}

WHAT TO EXTRACT:
- Actions taken by characters (physical actions, movements, gestures)
- Relationship interactions (kisses, hugs, conversations, conflicts)
- Revelations or information shared
- Emotional moments or reactions
- Location or scene changes
- Decisions or agreements made
- What characters talked about
- Mood or atmosphere of the scene

CRITICAL RULES:
1. ALWAYS extract at least one event - never return an empty array
2. Be LITERAL and FACTUAL - only state what actually happens in the text
3. DO NOT add "first time", "first ever", "for the first time" unless the text explicitly says it
4. DO NOT infer relationship history or status
5. DO NOT add assumptions about what events mean for relationships
6. DO NOT add emotional interpretations not present in the text
7. Keep each point under 80 characters
8. Use past tense, third person
9. Include character names when relevant

EXAMPLES OF CORRECT EXTRACTION:
- Text: "He kissed her softly" → "He kissed her"
- Text: "She told him she was a spy" → "She revealed she is a spy"
- Text: "They walked through the garden talking" → "They walked through the garden together"
- Text: "James placed his hand on her shoulder" → "James touched her shoulder"

INCORRECT (over-interpretation - DO NOT DO THIS):
- "They shared their first kiss" (when text just says "he kissed her")
- "She finally confessed her secret" (when text just says "she told him")
- "He showed his love for the first time" (adding "first time" without evidence)

Return ONLY a valid JSON array of strings. No markdown, no explanation.
Example: ["James kissed Ashley", "They arrived at the cafe"]
Maximum 3 events.`;

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
