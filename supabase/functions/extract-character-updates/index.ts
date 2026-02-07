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

interface CharacterGoalData {
  title: string;
  currentStatus: string;
  progress: number;
}

interface CharacterData {
  name: string;
  previousNames?: string[];
  nicknames?: string;
  physicalAppearance?: Record<string, string>;
  currentlyWearing?: Record<string, string>;
  preferredClothing?: Record<string, string>;
  location?: string;
  currentMood?: string;
  goals?: CharacterGoalData[];
  customSections?: Array<{ title: string; items: Array<{ label: string; value: string }> }>;
}

interface ExtractedUpdate {
  character: string;
  field: string;
  value: string;
}

/**
 * Build a structured "CURRENT STATE" view for each character.
 * Presents data in a way that emphasizes what the AI should maintain.
 */
function buildCharacterStateBlock(c: CharacterData): string {
  const lines: string[] = [];
  lines.push(`=== ${c.name} ===`);
  
  // Include previous names for lookup
  if (c.previousNames?.length) {
    lines.push(`  Previously known as: ${c.previousNames.join(', ')}`);
  }
  if (c.nicknames) {
    lines.push(`  Nicknames: ${c.nicknames}`);
  }
  
  // --- VOLATILE STATE (should be actively maintained) ---
  lines.push(`  [VOLATILE - maintain actively]`);
  lines.push(`    Mood: ${c.currentMood || '(not set)'}`);
  lines.push(`    Location: ${c.location || '(not set)'}`);
  
  if (c.currentlyWearing) {
    const wearing = Object.entries(c.currentlyWearing)
      .filter(([_, v]) => v)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
    lines.push(`    Currently Wearing: ${wearing || '(not set)'}`);
  }
  
  // --- STABLE STATE (update only when explicitly stated) ---
  lines.push(`  [STABLE - update only when explicitly described]`);
  if (c.physicalAppearance) {
    const appearance = Object.entries(c.physicalAppearance)
      .filter(([_, v]) => v)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
    if (appearance) lines.push(`    Physical Appearance: ${appearance}`);
  }
  
  if (c.preferredClothing) {
    const preferred = Object.entries(c.preferredClothing)
      .filter(([_, v]) => v)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
    if (preferred) lines.push(`    Preferred Clothing: ${preferred}`);
  }
  
  // --- GOALS ---
  if (c.goals?.length) {
    lines.push(`  [GOALS]`);
    for (const g of c.goals) {
      lines.push(`    ${g.title}: ${g.currentStatus || 'No status'} (progress: ${g.progress}%)`);
    }
  }
  
  // --- CUSTOM SECTIONS ---
  if (c.customSections?.length) {
    for (const section of c.customSections) {
      lines.push(`  [${section.title}]`);
      for (const item of section.items) {
        lines.push(`    ${item.label}: ${item.value}`);
      }
    }
  }
  
  return lines.join('\n');
}

serve(async (req) => {
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

    // Build character state blocks
    const characterContext = (characters || []).map((c: CharacterData) => buildCharacterStateBlock(c)).join('\n\n');

    const systemPrompt = `You are a character state tracker for a roleplay/narrative application. Your job is to extract character attribute changes from dialogue and keep character states current.

CHARACTERS IN THIS SCENE:
${characterContext || 'No character data provided'}

TRACKABLE FIELDS:
- nicknames (comma-separated alternative names, aliases, pet names)
- physicalAppearance.hairColor, physicalAppearance.eyeColor, physicalAppearance.build, physicalAppearance.height, physicalAppearance.skinTone, physicalAppearance.bodyHair, physicalAppearance.breastSize, physicalAppearance.genitalia, physicalAppearance.makeup, physicalAppearance.bodyMarkings, physicalAppearance.temporaryConditions
- currentlyWearing.top, currentlyWearing.bottom, currentlyWearing.undergarments, currentlyWearing.miscellaneous
- preferredClothing.casual, preferredClothing.work, preferredClothing.sleep, preferredClothing.underwear, preferredClothing.miscellaneous
- location (current location/place)
- currentMood (emotional state)

GOALS TRACKING:
- goals.GoalTitle = "current status text | progress: XX"
  Examples:
  - goals.Move Out of City = "Found apartment listings online | progress: 15"
  - goals.Get Promoted = "Completed the training program | progress: 60"
  - goals.Win Tournament = "Lost in semi-finals, reconsidering strategy | progress: 40"
  If progress is not clear, estimate based on context. Use 0 for new goals, 100 for completed ones.

CUSTOM SECTIONS (DYNAMIC):
- sections.SectionTitle.ItemLabel = value
  Examples:
  - sections.Background.Occupation = "Doctor at City Hospital"
  - sections.Secrets.Hidden Fear = "Afraid of being rejected"

SESSION SUMMARY (maintain per character when possible):
- sections.Session Summary.Current Situation = brief description of what the character is doing right now
- sections.Session Summary.Recent Events = 1-2 sentences of what just happened
- sections.Session Summary.Active Goals = comma-separated list of current goals

EXTRACTION PHILOSOPHY:

Fields are categorized by VOLATILITY:

HIGH VOLATILITY (mood, location, clothing, temporaryConditions):
- These change frequently and should be ACTIVELY tracked
- Contextual inference is ALLOWED — if a character walks into a bar, update location to the bar
- If a character removes their jacket, update currentlyWearing accordingly
- If the dialogue conveys emotion (excitement, anger, sadness), update currentMood even if not explicitly stated
- If a character is present and active in the scene, at minimum their mood and location should reflect the current context

LOW VOLATILITY (hair color, eye color, build, height, skin tone, stable physical traits):
- These rarely change and should ONLY be updated when EXPLICITLY described
- Do NOT infer or assume stable traits — if hair color isn't mentioned, don't update it
- First-time descriptions count as explicit (e.g., "She had auburn hair" → set hairColor)

GOALS:
- Track new goals when characters express intentions, desires, or objectives
- Update existing goals when progress is made or status changes
- Set progress to 100 when a goal is achieved, 0 when abandoned or failed

SESSION SUMMARY:
- Update "Current Situation" whenever the character's immediate context changes
- Update "Recent Events" to reflect the latest significant plot points
- Update "Active Goals" to list current active goals by title

RULES:
1. SCAN the user message AND AI response for character state changes
2. Match character names exactly as provided (also check nicknames and previous names)
3. Use the exact field names from TRACKABLE FIELDS for hardcoded fields
4. Use sections.SectionTitle.ItemLabel format for custom/dynamic content
5. Keep values concise but descriptive (e.g., "Short brown" not "He has short brown hair")
6. For appearance details in action text like "*runs hand through short brown hair*", extract the trait
7. For clothing described like "wearing navy blue scrubs", extract to currentlyWearing fields
8. For new nicknames/aliases, add to nicknames as comma-separated
9. For new character facts, goals, secrets, or backstory revealed in dialogue, create appropriate entries
10. Do NOT hallucinate updates — only track what is supported by the text
11. Do NOT repeat current values if they haven't changed

RESPONSE FORMAT (JSON only):
{
  "updates": [
    { "character": "CharacterName", "field": "currentMood", "value": "Nervous but excited" },
    { "character": "CharacterName", "field": "location", "value": "Downtown coffee shop" },
    { "character": "CharacterName", "field": "currentlyWearing.top", "value": "Navy blue scrubs" },
    { "character": "CharacterName", "field": "goals.Save Enough Money", "value": "Got first paycheck, opened savings | progress: 10" },
    { "character": "CharacterName", "field": "sections.Session Summary.Current Situation", "value": "Having coffee with Sarah after work" }
  ]
}

Return ONLY valid JSON. No explanations.`;

    const combinedText = [
      userMessage ? `USER MESSAGE:\n${userMessage}` : '',
      aiResponse ? `AI RESPONSE:\n${aiResponse}` : ''
    ].filter(Boolean).join('\n\n');

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
        temperature: 0.3,
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
    
    let extractedUpdates: ExtractedUpdate[] = [];
    try {
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
    if (extractedUpdates.length > 0) {
      console.log(`[extract-character-updates] Updates:`, JSON.stringify(extractedUpdates));
    }

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
