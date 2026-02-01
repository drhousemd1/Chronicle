import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function getGateway(modelId: string): 'lovable' | 'xai' {
  if (modelId.startsWith('grok')) {
    return 'xai';
  }
  return 'lovable';
}

function normalizeModelId(modelId: string): string {
  if (modelId.startsWith('gemini-')) {
    return `google/${modelId}`;
  }
  if (modelId.startsWith('gpt-')) {
    return `openai/${modelId}`;
  }
  return modelId;
}

interface CharacterData {
  name: string;
  physicalAppearance?: Record<string, string>;
  currentlyWearing?: Record<string, string>;
  location?: string;
  currentMood?: string;
}

interface ExtractedUpdate {
  character: string;
  field: string;
  value: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userMessage, aiResponse, characters, modelId } = await req.json();
    
    if (!userMessage && !aiResponse) {
      return new Response(
        JSON.stringify({ error: 'Either userMessage or aiResponse is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build character context for the extraction prompt
    const characterContext = (characters || []).map((c: CharacterData) => {
      const fields: string[] = [];
      fields.push(`Name: ${c.name}`);
      if (c.physicalAppearance) {
        const appearance = Object.entries(c.physicalAppearance)
          .filter(([_, v]) => v)
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ');
        if (appearance) fields.push(`Appearance: ${appearance}`);
      }
      if (c.currentlyWearing) {
        const wearing = Object.entries(c.currentlyWearing)
          .filter(([_, v]) => v)
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ');
        if (wearing) fields.push(`Wearing: ${wearing}`);
      }
      if (c.location) fields.push(`Location: ${c.location}`);
      if (c.currentMood) fields.push(`Mood: ${c.currentMood}`);
      return fields.join(' | ');
    }).join('\n');

    const systemPrompt = `You are a character state tracker for a roleplay/narrative application. Your ONLY job is to extract character attribute changes from dialogue.

CHARACTERS IN THIS SCENE:
${characterContext || 'No character data provided'}

TRACKABLE FIELDS (HARDCODED):
- nicknames (comma-separated alternative names, aliases, pet names the character is called)
- physicalAppearance.hairColor, physicalAppearance.eyeColor, physicalAppearance.build, physicalAppearance.height, physicalAppearance.skinTone, physicalAppearance.bodyHair, physicalAppearance.breastSize, physicalAppearance.genitalia, physicalAppearance.makeup, physicalAppearance.bodyMarkings, physicalAppearance.temporaryConditions
- currentlyWearing.top, currentlyWearing.bottom, currentlyWearing.undergarments, currentlyWearing.miscellaneous
- preferredClothing.casual, preferredClothing.work, preferredClothing.sleep, preferredClothing.underwear, preferredClothing.miscellaneous
- location (current location/place)
- currentMood (emotional state)

CUSTOM SECTIONS (DYNAMIC):
You can also update or create custom character sections using this field format:
- sections.SectionTitle.ItemLabel = value

Examples:
- sections.Background.Occupation = "Doctor at City Hospital"
- sections.Secrets.Hidden Fear = "Afraid of being rejected"
- sections.Goals.Current Objective = "Find the missing artifact"

If a section doesn't exist, it will be created automatically.
If an item label doesn't exist in a section, it will be added as a new row.

EXTRACTION RULES:
1. SCAN the user message AND AI response for ANY character state changes
2. Extract ONLY explicitly stated changes (not implied or assumed)
3. Match character names exactly as provided (also check nicknames)
4. Use the exact field names from TRACKABLE FIELDS for hardcoded fields
5. Use sections.SectionTitle.ItemLabel format for custom/dynamic content
6. Keep values concise but descriptive (e.g., "Short brown" not "He has short brown hair")
7. For appearance details described in action text like "*runs hand through short brown hair*", extract the trait
8. For clothing described like "wearing navy blue scrubs", extract to currentlyWearing fields
9. For mood/emotion indicators like "(God I love her)" or described feelings, update currentMood
10. For new nicknames/aliases (e.g., "call me Rhy" or user says "Mom" to refer to Sarah), add to nicknames as comma-separated
11. For new character facts, goals, secrets, or backstory revealed in dialogue, create appropriate sections.* entries
12. Return empty updates array if nothing clearly changed

RESPONSE FORMAT (JSON only):
{
  "updates": [
    { "character": "CharacterName", "field": "physicalAppearance.hairColor", "value": "Short brown" },
    { "character": "CharacterName", "field": "currentlyWearing.top", "value": "Navy blue scrubs" },
    { "character": "CharacterName", "field": "currentMood", "value": "Affectionate" },
    { "character": "CharacterName", "field": "sections.Background.Job", "value": "Bartender at neighborhood bar" },
    { "character": "CharacterName", "field": "sections.Goals.Current Goal", "value": "Save enough money for nursing school" }
  ]
}

Return ONLY valid JSON. No explanations.`;

    const combinedText = [
      userMessage ? `USER MESSAGE:\n${userMessage}` : '',
      aiResponse ? `AI RESPONSE:\n${aiResponse}` : ''
    ].filter(Boolean).join('\n\n');

    // Use provided modelId to route to correct gateway (respects BYOK)
    const effectiveModelId = modelId || 'google/gemini-2.5-flash-lite';
    const gateway = getGateway(effectiveModelId);

    let apiKey: string | undefined;
    let apiUrl: string;
    let modelForRequest: string;

    if (gateway === 'xai') {
      apiKey = Deno.env.get("XAI_API_KEY");
      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: "XAI_API_KEY not configured. Please add your Grok API key in settings.", updates: [] }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      apiUrl = "https://api.x.ai/v1/chat/completions";
      modelForRequest = effectiveModelId;
    } else {
      apiKey = Deno.env.get("LOVABLE_API_KEY");
      if (!apiKey) {
        throw new Error("LOVABLE_API_KEY is not configured");
      }
      apiUrl = "https://ai.gateway.lovable.dev/v1/chat/completions";
      modelForRequest = normalizeModelId(effectiveModelId);
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelForRequest,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Extract character state changes from this dialogue:\n\n${combinedText}` }
        ],
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later.", updates: [] }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to continue.", updates: [] }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to extract character updates");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{"updates":[]}';
    
    // Parse the JSON response
    let extractedUpdates: ExtractedUpdate[] = [];
    try {
      // Try to find JSON object in the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        extractedUpdates = parsed.updates || [];
      }
    } catch (parseError) {
      console.error("Failed to parse extraction response:", content);
      extractedUpdates = [];
    }

    // Validate and filter updates
    extractedUpdates = extractedUpdates.filter((u: any) => 
      typeof u.character === 'string' && 
      typeof u.field === 'string' && 
      typeof u.value === 'string' &&
      u.character.trim() &&
      u.field.trim() &&
      u.value.trim()
    );

    console.log(`[extract-character-updates] Extracted ${extractedUpdates.length} updates from dialogue`);

    return new Response(
      JSON.stringify({ updates: extractedUpdates }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in extract-character-updates:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error', updates: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
