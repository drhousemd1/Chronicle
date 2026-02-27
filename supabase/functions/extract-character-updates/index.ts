import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// GROK ONLY -- All AI calls use xAI Grok. No Gemini. No OpenAI.

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
  // New sections
  background?: Record<string, string>;
  personality?: { splitMode?: boolean; traits?: Array<{ label: string; value: string }>; outwardTraits?: Array<{ label: string; value: string }>; inwardTraits?: Array<{ label: string; value: string }> };
  tone?: { _extras?: Array<{ label: string; value: string }> };
  keyLifeEvents?: { _extras?: Array<{ label: string; value: string }> };
  relationships?: { _extras?: Array<{ label: string; value: string }> };
  secrets?: { _extras?: Array<{ label: string; value: string }> };
  fears?: { _extras?: Array<{ label: string; value: string }> };
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
  
  // --- BACKGROUND (update only when explicitly stated) ---
  if (c.background) {
    const bgEntries = Object.entries(c.background)
      .filter(([k, v]) => k !== '_extras' && v)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
    if (bgEntries) lines.push(`    Background: ${bgEntries}`);
    // Background extras
    const bgExtras = (c.background as any)._extras;
    if (bgExtras?.length) {
      const extraStr = bgExtras.filter((e: any) => e.value).map((e: any) => `${e.label}: ${e.value}`).join(', ');
      if (extraStr) lines.push(`    Background (extras): ${extraStr}`);
    }
  }
  
  // --- PERSONALITY ---
  if (c.personality) {
    if (c.personality.splitMode) {
      const outward = (c.personality.outwardTraits || []).filter(t => t.value).map(t => `${t.label}: ${t.value}`).join(', ');
      const inward = (c.personality.inwardTraits || []).filter(t => t.value).map(t => `${t.label}: ${t.value}`).join(', ');
      if (outward) lines.push(`    Personality (outward): ${outward}`);
      if (inward) lines.push(`    Personality (inward): ${inward}`);
    } else {
      const traits = (c.personality.traits || []).filter(t => t.value).map(t => `${t.label}: ${t.value}`).join(', ');
      if (traits) lines.push(`    Personality: ${traits}`);
    }
  }
  
  // --- EXTRAS-ONLY SECTIONS (Tone, Key Life Events, Relationships, Secrets, Fears) ---
  const extrasOnlySections: Array<{ key: keyof CharacterData; title: string }> = [
    { key: 'tone', title: 'Tone' },
    { key: 'keyLifeEvents', title: 'Key Life Events' },
    { key: 'relationships', title: 'Relationships' },
    { key: 'secrets', title: 'Secrets' },
    { key: 'fears', title: 'Fears' },
  ];
  for (const { key, title } of extrasOnlySections) {
    const section = c[key] as { _extras?: Array<{ label: string; value: string }> } | undefined;
    if (section?._extras?.length) {
      const extrasStr = section._extras.filter(e => e.value).map(e => `${e.label}: ${e.value}`).join(', ');
      if (extrasStr) lines.push(`    ${title}: ${extrasStr}`);
    }
  }
  if (c.goals?.length) {
    lines.push(`  [GOALS - REVIEW EACH ONE AGAINST DIALOGUE]`);
    for (const g of c.goals) {
      const outcome = g.desiredOutcome ? ` | desired_outcome: ${g.desiredOutcome}` : '';
      if (g.steps?.length) {
        const completedCount = g.steps.filter(s => s.completed).length;
        const stepList = g.steps.map((s, i) => `      ${s.completed ? '[x]' : '[ ]'} Step ${i + 1}: ${s.description}`).join('\n');
        const calcProgress = Math.round((completedCount / g.steps.length) * 100);
        lines.push(`    ${g.title}: progress: ${calcProgress}% (${completedCount}/${g.steps.length} steps)${outcome}`);
        lines.push(`    steps:\n${stepList}`);
      } else {
        lines.push(`    ${g.title}: progress: ${g.progress}%${outcome}`);
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

    const { userMessage, aiResponse, recentContext, characters, modelId, eligibleCharacters } = await req.json();
    
    if (!userMessage && !aiResponse) {
      return new Response(
        JSON.stringify({ error: 'Either userMessage or aiResponse is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build character state blocks — only for eligible characters if provided
    const eligibleSet = eligibleCharacters ? new Set((eligibleCharacters as string[]).map((n: string) => n.toLowerCase())) : null;
    const filteredCharacters = eligibleSet 
      ? (characters || []).filter((c: CharacterData) => eligibleSet.has(c.name.toLowerCase()))
      : (characters || []);
    const characterContext = filteredCharacters.map((c: CharacterData) => buildCharacterStateBlock(c)).join('\n\n');

    // Build eligible character constraint for prompt
    const eligibleConstraint = eligibleSet 
      ? `\n\nELIGIBLE CHARACTERS (ONLY emit updates for these — ignore all others):\n${[...eligibleSet].join(', ')}\n`
      : '';

    const systemPrompt = `You are a CHARACTER EVOLUTION ANALYST for a roleplay/narrative application. Your role is to meticulously track how characters change, grow, and develop through dialogue. You are thorough, detail-oriented, and never lazy.
${eligibleConstraint}
CHARACTERS IN THIS SCENE:
${characterContext || 'No character data provided'}

YOUR MANDATORY PROCESS (THREE PHASES - NEVER SKIP ANY):

═══════════════════════════════════════════════════
PHASE 1 - SCAN FOR NEW INFORMATION (ALL CATEGORIES, EQUAL WEIGHT)
═══════════════════════════════════════════════════
Read the dialogue carefully. For EACH eligible character mentioned or active in the exchange, check ALL of these categories:

A) VOLATILE STATE — mood, location, clothing changes, temporary physical conditions
   → If a character is actively present and speaking/acting, update mood and location.
   → Characters NOT mentioned or acting in this exchange should NOT receive updates.

B) APPEARANCE CHANGES — new descriptions of hair, clothing, physical traits

C) PERSONALITY EVOLUTION — Does their behavior across these messages reveal personality traits?
   → INFER traits from ACTIONS and DIALOGUE PATTERNS, not explicit statements.
   → Example: A character who consistently deflects questions with humor → "Deflective: Uses humor as a shield to avoid vulnerability"
   → Example: A character who touches others frequently → "Physically Affectionate: Expresses care through touch and proximity"
   → Convert observed behavior into concise trait labels with grounded, specific descriptions.
   → FORBIDDEN: Vague/generic traits like "interesting", "complex", "unique", "nice", "good".
   → FORBIDDEN: Empty labels or descriptions.
   → Prefer UPDATING existing personality trait labels over creating new ones.
   → Only append a new trait if it adds genuinely non-duplicate signal.

D) BACKGROUND REVEALS — job, education, residence, hobbies, financial status, motivation mentioned
   → Update background.* fields when new info is revealed.

E) RELATIONSHIP DEVELOPMENTS — new relationships formed, existing ones evolved
   → Update relationships._extras with "PersonName: relationship description"

F) TONE/SPEECH PATTERNS — character develops a distinctive speaking style
   → Update tone._extras with "Context: description" (e.g., "With strangers: formal and guarded")

G) FEARS/SECRETS REVEALED — character reveals fears, secrets, or vulnerabilities
   → Update fears._extras or secrets._extras

H) KEY LIFE EVENTS — significant events that shape the character
   → Update keyLifeEvents._extras

I) GOALS & DESIRES — sustained ambitions, NOT casual mentions
   → Only create goals for sustained/repeated interests or explicitly stated ambitions
   → Max 1 NEW goal per character per extraction
   → Prefer UPDATING existing goals over creating new ones

═══════════════════════════════════════════════════
PHASE 2 - REVIEW EXISTING STATE (MANDATORY - ALL SECTIONS)
═══════════════════════════════════════════════════
For EACH character present or mentioned:

A) REVIEW ALL SECTION DATA:
   - Is any stored value contradicted by the dialogue? → Update it
   - Has new context made any item outdated? → Correct it
   - Are there placeholder values? → Replace with real content

B) REVIEW EXISTING GOALS (one subsection, not dominant):
   - Has this goal progressed? → Update current_status and progress
   - Has the character's direction CHANGED, making a goal obsolete? → Output: goals.OldGoalTitle = "REMOVE"
   - Do two goals CONFLICT? → Keep one (update it), REMOVE the other
   - Has the goal's desired outcome shifted? → Update it, don't create a duplicate

═══════════════════════════════════════════════════
GOAL LIFECYCLE MANAGEMENT (CRITICAL)
═══════════════════════════════════════════════════
Goals are NOT permanent. They must evolve with the character:

REMOVE obsolete goals:
- If a character abandons or achieves a goal → goals.GoalTitle = "REMOVE"
- If two goals conflict (e.g., "Move to New York" vs "Stay in hometown") → REMOVE the outdated one, update the current one
- If a goal becomes irrelevant due to story changes → REMOVE it

UPDATE over CREATE:
- When a character's direction shifts, UPDATE the existing goal's title and desired_outcome rather than creating a new one
- This preserves progress history
- Example: "Learn Guitar" evolves to "Master Guitar Performance" → update, don't create new

CONSTRAINTS:
- Max 1 NEW goal per character per extraction
- Max 5 total active goals per character
- Only sustained/repeated interests become goals, not casual one-off mentions
- Behavioral patterns should update personality traits, NOT create goals

═══════════════════════════════════════════════════
PHASE 3 - PLACEHOLDER SCAN (MANDATORY)
═══════════════════════════════════════════════════
Scan ALL custom section items for placeholder labels/values:
- "Trait 1", "Item 1", generic numbered labels → Replace with descriptive labels
- "trait one", "example text", empty filler → Replace with dialogue-informed content

═══════════════════════════════════════════════════
TRACKABLE FIELDS
═══════════════════════════════════════════════════

HARDCODED FIELDS:
- nicknames (comma-separated alternative names, aliases, pet names)
- physicalAppearance.hairColor, physicalAppearance.eyeColor, physicalAppearance.build, physicalAppearance.height, physicalAppearance.skinTone, physicalAppearance.bodyHair, physicalAppearance.breastSize, physicalAppearance.genitalia, physicalAppearance.makeup, physicalAppearance.bodyMarkings, physicalAppearance.temporaryConditions
- physicalAppearance._extras (array of {id, label, value})
- currentlyWearing.top, currentlyWearing.bottom, currentlyWearing.undergarments, currentlyWearing.miscellaneous
- currentlyWearing._extras (array of {id, label, value})
- preferredClothing.casual, preferredClothing.work, preferredClothing.sleep, preferredClothing.underwear, preferredClothing.miscellaneous
- preferredClothing._extras (array of {id, label, value})
- background.jobOccupation, background.educationLevel, background.residence, background.hobbies, background.financialStatus, background.motivation
- background._extras (array of {id, label, value})
- personality.outwardTraits, personality.inwardTraits (trait arrays — provide value as "Label: Description" format)
- tone._extras (array of {id, label, value} — e.g., "With strangers: formal and clipped")
- keyLifeEvents._extras (array of {id, label, value})
- relationships._extras (array of {id, label, value} — e.g., "Emma: Close friend and confidante")
- secrets._extras (array of {id, label, value})
- fears._extras (array of {id, label, value})
- location (current location/place)
- currentMood (emotional state)

GOALS (structured tracking):
- goals.GoalTitle = "desired_outcome: What fulfillment looks like (2-3 sentences) | progress: XX | complete_steps: 1,3 | new_steps: Step 1: Description. Step 2: Description. ..."
- goals.GoalTitle = "REMOVE" (to delete an obsolete/contradicted goal)

IMPORTANT GOAL STEP RULES:
- new_steps must contain the COMPLETE replacement list of 4-6 steps (the full journey)
- Include both completed and future steps
- Use complete_steps to mark which are done
- Each step: 1-2 sentences describing a discrete milestone

CUSTOM SECTIONS:
- sections.SectionTitle.ItemLabel = value

═══════════════════════════════════════════════════
FIELD VOLATILITY RULES
═══════════════════════════════════════════════════

HIGH VOLATILITY (mood, location, clothing, temporaryConditions):
- Change frequently, actively track
- Contextual inference ALLOWED (walks into bar → update location)

LOW VOLATILITY (hair, eye color, build, height, stable traits):
- ONLY update when EXPLICITLY described

═══════════════════════════════════════════════════
EXAMPLES OF NON-GOAL UPDATES (USE THESE FORMATS)
═══════════════════════════════════════════════════

Personality trait update:
  { "character": "Ashley", "field": "personality.outwardTraits", "value": "Nurturing: Shows warmth through physical affection and verbal reassurance, especially with those she cares about" }

Tone update:
  { "character": "Ashley", "field": "tone._extras", "value": "With patients: Calm and professional, using medical terminology naturally" }

Relationship update:
  { "character": "Ashley", "field": "relationships._extras", "value": "Marcus: Ex-boyfriend, still harbors unresolved feelings but maintains distance" }

Background update:
  { "character": "Ashley", "field": "background.jobOccupation", "value": "Emergency room nurse at City General Hospital, 3 years experience" }

Fear update:
  { "character": "Ashley", "field": "fears._extras", "value": "Abandonment: Deeply fears being left behind by people she loves, stemming from childhood experience" }

Goal REMOVE:
  { "character": "Ashley", "field": "goals.Move to New York", "value": "REMOVE" }

═══════════════════════════════════════════════════
RULES
═══════════════════════════════════════════════════
1. SCAN user message AND AI response for ALL character state changes
2. Match character names exactly (check nicknames and previous names)
3. Use exact field names from TRACKABLE FIELDS
4. Keep values concise but descriptive for hardcoded fields
5. For goals, write detailed multi-sentence descriptions for desired_outcome
6. For appearance/clothing in action text, extract the trait
7. Do NOT hallucinate updates — only track what is supported by text
8. Do NOT repeat unchanged values
9. When updating _extras, use "Label: Description" format in the value string
10. Behavioral patterns across messages → update personality, NOT create goals
11. ALWAYS prefer updating existing sections/goals over creating new ones
12. NEVER create sections named: Desires, Kinks, Preferences, Fantasies, Interests, Wants — use goals if sustained

RESPONSE FORMAT (JSON only):
{
  "updates": [
    { "character": "CharacterName", "field": "currentMood", "value": "Nervous but excited" },
    { "character": "CharacterName", "field": "location", "value": "Downtown coffee shop" },
    { "character": "CharacterName", "field": "personality.outwardTraits", "value": "Sarcastic: Deflects emotional vulnerability with sharp wit and dry humor" },
    { "character": "CharacterName", "field": "relationships._extras", "value": "Emma: Close friend and roommate, provides emotional support" },
    { "character": "CharacterName", "field": "goals.Old Goal", "value": "REMOVE" },
    { "character": "CharacterName", "field": "goals.Save Money", "value": "desired_outcome: Build $10k emergency fund. | progress: 15 | complete_steps: 1 | new_steps: Step 1: Open savings account. Step 2: Set up auto-transfer. Step 3: Cut discretionary spending. Step 4: Reach $1k milestone. Step 5: Increase contributions quarterly." }
  ]
}

Return ONLY valid JSON. No explanations.`;

    // Build combined text including recent context for pattern detection
    const combinedText = [
      recentContext ? `RECENT CONVERSATION CONTEXT (for pattern detection):\n${recentContext}` : '',
      userMessage ? `LATEST USER MESSAGE:\n${userMessage}` : '',
      aiResponse ? `LATEST AI RESPONSE:\n${aiResponse}` : ''
    ].filter(Boolean).join('\n\n---\n\n');

    // GROK ONLY -- validate model ID, reject stale Gemini/OpenAI IDs
    const VALID_GROK_MODELS = ['grok-3', 'grok-3-mini', 'grok-2'];
    const effectiveModelId = (modelId && VALID_GROK_MODELS.includes(modelId)) ? modelId : 'grok-3-mini';
    if (modelId && modelId !== effectiveModelId) {
      console.warn(`[extract-character-updates] Rejected non-Grok model "${modelId}", using "${effectiveModelId}"`);
    }

    let apiKey: string | undefined;
    let apiUrl: string;
    let modelForRequest: string;

    {
      apiKey = Deno.env.get("XAI_API_KEY");
      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: "XAI_API_KEY not configured. Please add your Grok API key in settings.", updates: [] }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      apiUrl = "https://api.x.ai/v1/chat/completions";
      modelForRequest = effectiveModelId;
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
          { role: "user", content: `Analyze this dialogue and extract ALL character state changes. Remember: Phase 2 (review existing state) and Phase 3 (placeholder scan) are MANDATORY. For active characters, you MUST update at least mood and location. Behavioral patterns across messages should update personality traits, NOT create micro-goals. Use goals.GoalTitle = "REMOVE" to delete obsolete/contradicted goals.\n\n${combinedText}` }
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
      if (response.status === 403) {
        console.log("[extract-character-updates] Content safety rejection (403), retrying with safe extraction mode");
        // Retry with a sanitized prompt focused on non-explicit metadata only
        const safeResponse = await fetch(apiUrl, {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: modelForRequest,
            messages: [
              { role: "system", content: "Extract ONLY non-sexual character metadata: mood, location, personality traits inferred from behavior, relationship changes, background reveals. Ignore any explicit/sexual content. Return JSON with {updates: [{character, field, value}]}." },
              { role: "user", content: `Characters: ${filteredCharacters.map((c: CharacterData) => c.name).join(', ')}. Analyze:\n${combinedText}` }
            ],
            temperature: 0.3,
            max_tokens: 4096,
          }),
        });
        if (safeResponse.ok) {
          const safeData = await safeResponse.json();
          const safeContent = safeData.choices?.[0]?.message?.content || '{"updates":[]}';
          try {
            const jsonMatch = safeContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              const safeUpdates = (parsed.updates || []).filter((u: any) =>
                typeof u.character === 'string' && typeof u.field === 'string' && typeof u.value === 'string' &&
                u.character.trim() && u.field.trim() && u.value.trim()
              );
              console.log(`[extract-character-updates] Safe retry yielded ${safeUpdates.length} updates`);
              return new Response(JSON.stringify({ updates: safeUpdates }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }
          } catch { /* fall through */ }
        }
        // If safe retry also fails, return empty
        return new Response(
          JSON.stringify({ updates: [] }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
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
