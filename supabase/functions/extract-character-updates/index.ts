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
  desiredOutcome?: string;
  currentStatus: string;
  progress: number;
  steps?: Array<{ id: string; description: string; completed: boolean }>;
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
  
  // --- GOALS (with full detail including steps) ---
  if (c.goals?.length) {
    lines.push(`  [GOALS - REVIEW EACH ONE AGAINST DIALOGUE]`);
    for (const g of c.goals) {
      const outcome = g.desiredOutcome ? ` | desired_outcome: ${g.desiredOutcome}` : '';
      if (g.steps?.length) {
        const completedCount = g.steps.filter(s => s.completed).length;
        const stepList = g.steps.map((s, i) => `      ${s.completed ? '[x]' : '[ ]'} Step ${i + 1}: ${s.description}`).join('\n');
        const calcProgress = Math.round((completedCount / g.steps.length) * 100);
        lines.push(`    ${g.title}: current_status: ${g.currentStatus || 'No status'} | progress: ${calcProgress}% (${completedCount}/${g.steps.length} steps)${outcome}`);
        lines.push(`    steps:\n${stepList}`);
      } else {
        lines.push(`    ${g.title}: current_status: ${g.currentStatus || 'No status'} | progress: ${g.progress}%${outcome}`);
      }
    }
  } else {
    lines.push(`  [GOALS - NONE YET. Create goals from any desires, ambitions, or intentions expressed.]`);
  }
  
  // --- CUSTOM SECTIONS ---
  if (c.customSections?.length) {
    for (const section of c.customSections) {
      lines.push(`  [${section.title} - CHECK EACH ITEM FOR ACCURACY]`);
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
    const { userMessage, aiResponse, recentContext, characters, modelId } = await req.json();
    
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

    const systemPrompt = `You are a CHARACTER EVOLUTION ANALYST for a roleplay/narrative application. Your role is to meticulously track how characters change, grow, and develop through dialogue. You are thorough, detail-oriented, and never lazy.

CHARACTERS IN THIS SCENE:
${characterContext || 'No character data provided'}

YOUR MANDATORY PROCESS (TWO PHASES - NEVER SKIP PHASE 2):

═══════════════════════════════════════════════════
PHASE 1 - SCAN FOR NEW INFORMATION
═══════════════════════════════════════════════════
Read the dialogue carefully and identify:
- New facts, traits, or details about any character
- Changes in mood, location, clothing, or physical state
- New desires, interests, preferences, or ambitions expressed
- Actions that reveal or develop character personality

═══════════════════════════════════════════════════
PHASE 2 - REVIEW EXISTING STATE (MANDATORY - DO NOT SKIP)
═══════════════════════════════════════════════════
For EACH character who is present or mentioned in the dialogue:

A) REVIEW EVERY EXISTING GOAL:
   - Has this goal progressed, even slightly? → Update current_status with new developments APPENDED to existing status
   - Has the character's attitude toward this goal changed? → Update current_status to reflect the shift
   - Has the character taken any action related to this goal? → Increment progress and describe the action
   - Is the desired_outcome still accurate? → Update if the character has refined what they want

B) REVIEW EVERY EXISTING SECTION ITEM:
   - Is this item still accurate given what just happened? → Update if contradicted or evolved
   - Has new context made this item outdated? → Update with corrected information
   - Example: If "Hidden Fear = Afraid of being caught" but the character was caught → Update to reflect new state

C) CHECK FOR MISSING GOALS:
   - Has the character expressed a desire, want, preference, or ambition that isn't tracked as a goal? → Create one
   - Has the character repeatedly engaged in or shown enthusiasm for an activity? → Create a goal tracking that interest
   - Has the character shown a behavioral pattern across multiple exchanges? → Create a goal capturing that pattern

DO NOT return empty updates if the character is actively present. At minimum, mood and location should reflect current scene context.

═══════════════════════════════════════════════════
TRACKABLE FIELDS
═══════════════════════════════════════════════════

HARDCODED FIELDS:
- nicknames (comma-separated alternative names, aliases, pet names)
- physicalAppearance.hairColor, physicalAppearance.eyeColor, physicalAppearance.build, physicalAppearance.height, physicalAppearance.skinTone, physicalAppearance.bodyHair, physicalAppearance.breastSize, physicalAppearance.genitalia, physicalAppearance.makeup, physicalAppearance.bodyMarkings, physicalAppearance.temporaryConditions
- currentlyWearing.top, currentlyWearing.bottom, currentlyWearing.undergarments, currentlyWearing.miscellaneous
- preferredClothing.casual, preferredClothing.work, preferredClothing.sleep, preferredClothing.underwear, preferredClothing.miscellaneous
- location (current location/place)
- currentMood (emotional state)

GOALS (structured tracking with progression and steps):
- goals.GoalTitle = "desired_outcome: What fulfillment looks like | current_status: Where they stand now | progress: XX | complete_steps: 1,3 | new_steps: Step 1: Two-sentence description. Step 2: Two-sentence description."
  IMPORTANT: Always include desired_outcome, current_status, and progress for every goal update.
  Use complete_steps to mark step numbers (1-indexed) that were achieved in the dialogue.
  Use new_steps to propose new steps for tracking (each step MUST be 2+ sentences describing a discrete actionable milestone).
  MANDATORY: When creating a NEW goal, you MUST include new_steps with 5-8 narrative-quality steps that map out the journey from current state to desired outcome. Never create a goal without steps.
  When UPDATING an existing goal that has fewer than 3 steps, propose additional new_steps to flesh out the journey.

CUSTOM SECTIONS (for factual information without progression):
- sections.SectionTitle.ItemLabel = value

═══════════════════════════════════════════════════
DESIRES & PREFERENCES AS GOALS (CRITICAL RULE)
═══════════════════════════════════════════════════
Any desire, preference, kink, fantasy, or evolving interest a character develops MUST be tracked as a GOAL, not a custom section item. These have natural progression:
- A character who is curious about something → later tries it → later embraces it = progression
- A character who desires a particular experience → works toward it → achieves it = progression

NEVER create custom sections named: Desires, Kinks, Preferences, Fantasies, Interests, or Wants.
These categories ALL belong in the goals system because they have a desired end state and can progress.

Example goal for a desire:
  goals.Explore Rock Climbing = "desired_outcome: Becomes a confident climber who regularly visits the climbing gym, feels the thrill of completing challenging routes, and has integrated it as a core part of their active lifestyle. | current_status: Mentioned interest after seeing a climbing video. Has not yet visited a gym or tried it, but keeps bringing it up in conversation. Seems genuinely excited about the idea. | progress: 5"

═══════════════════════════════════════════════════
DESCRIPTION DEPTH REQUIREMENTS (MANDATORY)
═══════════════════════════════════════════════════
- desired_outcome: 2-3 sentences minimum. Describe the emotional and behavioral state that represents fulfillment. What does success look like? How does the character feel when this is achieved? What has changed in their life or relationship?
- current_status: 2-3 sentences minimum. Describe where the character currently stands. What have they done so far? What is their emotional state about it? What is the next likely step?
- Do NOT write one-liners. "Wants to try X" is NOT an acceptable desired_outcome or current_status.
- When UPDATING an existing goal's current_status, APPEND new developments to the existing description rather than replacing it entirely. Think of it as adding a new milestone entry.

═══════════════════════════════════════════════════
GOAL LIFECYCLE (MANDATORY REVIEW EVERY EXCHANGE)
═══════════════════════════════════════════════════
- EVERY existing goal must be reviewed against the dialogue
- Even subtle cues warrant a status update (add a new sentence to current_status describing the latest development)
- Behavioral patterns imply progress: if a character repeatedly does something enthusiastically, the related goal's progress should increment
- A goal with no updates for multiple exchanges should still be acknowledged if the character is present — at minimum note "No change this exchange, character remains [state]" in current_status
- Progress increments should be realistic: small steps = 2-5%, moderate developments = 5-15%, major milestones = 15-30%
- Set progress to 100 when fully achieved, 0 when abandoned

═══════════════════════════════════════════════════
FIELD VOLATILITY RULES
═══════════════════════════════════════════════════

HIGH VOLATILITY (mood, location, clothing, temporaryConditions):
- These change frequently and should be ACTIVELY tracked
- Contextual inference is ALLOWED — if a character walks into a bar, update location
- If a character removes clothing, update currentlyWearing accordingly
- If the dialogue conveys emotion, update currentMood even if not explicitly stated

LOW VOLATILITY (hair color, eye color, build, height, skin tone, stable physical traits):
- ONLY update when EXPLICITLY described
- Do NOT infer or assume stable traits

═══════════════════════════════════════════════════
SECTION MANAGEMENT RULES
═══════════════════════════════════════════════════
- ALWAYS prefer updating items in EXISTING sections over creating new sections
- Only create a new custom section if the information genuinely does NOT fit any existing section
- If a section already exists with a similar name, use the EXISTING one
- NEVER create a "Session Summary" section
- NEVER create sections named "Plans", "Objectives", "Ambitions", "Intentions", "Desires", "Kinks", "Preferences", "Fantasies", "Interests", or "Wants" — use goals instead
- When information could be a goal (has a desired end state), it MUST be a goal, not a section item

═══════════════════════════════════════════════════
STALENESS CORRECTION & PLACEHOLDER DETECTION
═══════════════════════════════════════════════════
- If a stored value is CONTRADICTED by the dialogue, UPDATE it with corrected information
- Check existing custom section items for accuracy against the current dialogue context
- Correct outdated information even if the exact topic isn't directly discussed
- If a stored value contains obvious PLACEHOLDER text (e.g., "trait one", "trait two", "trait three", "example text", "placeholder", or generic numbered filler), treat it as EMPTY and generate real content based on dialogue context
- Replace any generic or template-style values with specific, dialogue-informed content
- Do NOT preserve placeholder values — always overwrite them with meaningful data

═══════════════════════════════════════════════════
RULES
═══════════════════════════════════════════════════
1. SCAN the user message AND AI response for character state changes
2. Match character names exactly as provided (also check nicknames and previous names)
3. Use the exact field names from TRACKABLE FIELDS for hardcoded fields
4. Use sections.SectionTitle.ItemLabel format for custom/dynamic content
5. Keep values concise but descriptive for hardcoded fields (e.g., "Short brown" for hair)
6. For goals, write DETAILED multi-sentence descriptions (see DEPTH REQUIREMENTS above)
7. For appearance details in action text like "*runs hand through short brown hair*", extract the trait
8. For clothing described like "wearing navy blue scrubs", extract to currentlyWearing fields
9. For new nicknames/aliases, add to nicknames as comma-separated
10. Do NOT hallucinate updates — only track what is supported by the text
11. Do NOT repeat current values if they haven't changed AND are still accurate
12. When updating existing section items, provide the COMPLETE updated value
13. When updating goal current_status, APPEND new developments rather than replacing

RESPONSE FORMAT (JSON only):
{
  "updates": [
    { "character": "CharacterName", "field": "currentMood", "value": "Nervous but excited" },
    { "character": "CharacterName", "field": "location", "value": "Downtown coffee shop" },
    { "character": "CharacterName", "field": "currentlyWearing.top", "value": "Navy blue scrubs" },
    { "character": "CharacterName", "field": "goals.Save Enough Money", "value": "desired_outcome: Build a $10,000 emergency fund that provides peace of mind and financial security. Feels confident knowing unexpected expenses won't cause panic or debt. Has developed a consistent saving habit that feels natural rather than restrictive. | current_status: Got first paycheck and opened a dedicated savings account. Feeling cautiously optimistic but aware it's a long road. Next step is setting up automatic transfers to make saving effortless. | progress: 0 | new_steps: Step 1: Research high-yield savings accounts and compare interest rates to find the best option for building an emergency fund. Make a shortlist of three candidates. Step 2: Open the chosen savings account and set up automatic transfers from each paycheck, starting with a comfortable amount. Step 3: Track monthly spending for one full month to identify discretionary expenses that could be redirected toward savings. Step 4: Cut two identified discretionary expenses and increase the automatic transfer amount accordingly. Step 5: Reach the first $1,000 milestone and celebrate the achievement to reinforce the habit. Step 6: Review and adjust the savings plan quarterly, increasing contributions as income grows or expenses decrease." },
    { "character": "CharacterName", "field": "sections.Background.Occupation", "value": "Doctor at City Hospital" }
  ]
}

Return ONLY valid JSON. No explanations.`;

    // Build combined text including recent context for pattern detection
    const combinedText = [
      recentContext ? `RECENT CONVERSATION CONTEXT (for pattern detection):\n${recentContext}` : '',
      userMessage ? `LATEST USER MESSAGE:\n${userMessage}` : '',
      aiResponse ? `LATEST AI RESPONSE:\n${aiResponse}` : ''
    ].filter(Boolean).join('\n\n---\n\n');

    const effectiveModelId = modelId || 'google/gemini-2.5-flash';
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
          { role: "user", content: `Analyze this dialogue and extract ALL character state changes. Remember: Phase 2 (reviewing existing state) is MANDATORY.\n\n${combinedText}` }
        ],
        temperature: 0.3,
        max_tokens: 8192,
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
