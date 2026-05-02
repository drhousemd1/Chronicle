import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

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
  scenePosition?: string;
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

function sanitizeCurrentMood(value: string): string {
  const cleaned = value
    .replace(/[*"()[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return "";

  const firstSentence = cleaned.split(/[.!?]/)[0].trim();
  const limited = firstSentence.split(/\s+/).slice(0, 12).join(" ");
  const forbiddenPattern = /\b(foot|feet|toe|toes|thigh|hips?|breast|boob|cock|penis|pussy|ass|butt|bed|door|shirt|shorts|thong|bra|moves?|moving|walks?|walking|leans?|leaning|touches?|touching|presses?|pressing|curls?|curling|kneads?|kneading|whispers?|whispering|kisses?|kissing)\b/i;
  return forbiddenPattern.test(limited) ? "" : limited;
}

function isAllowedUpdateField(field: string): boolean {
  if (field === "location" || field === "scenePosition" || field === "currentMood" || field === "nicknames") return true;
  if (field.startsWith("goals.")) return true;
  if (field.startsWith("sections.")) return true;
  if (!field.includes(".")) return false;

  const [parent, child] = field.split(".");
  if (!parent || !child) return false;

  if (parent === "physicalAppearance" || parent === "currentlyWearing" || parent === "preferredClothing" || parent === "background") {
    return true;
  }
  if (parent === "personality") {
    return ["traits", "outwardTraits", "inwardTraits", "splitMode"].includes(child);
  }
  if (["tone", "keyLifeEvents", "relationships", "secrets", "fears"].includes(parent)) {
    return child === "_extras";
  }
  return false;
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenSet(value: string): Set<string> {
  const STOP = new Set(["a", "an", "the", "and", "or", "of", "to", "in", "on", "for", "with", "by", "at", "from", "is", "are"]);
  return new Set(normalizeText(value).split(/\s+/).filter(t => t && !STOP.has(t)));
}

function tokenSimilarity(a: string, b: string): number {
  const aSet = tokenSet(a);
  const bSet = tokenSet(b);
  if (aSet.size === 0 || bSet.size === 0) return 0;
  let overlap = 0;
  for (const t of aSet) {
    if (bSet.has(t)) overlap += 1;
  }
  return overlap / Math.max(aSet.size, bSet.size);
}

function noveltyRatio(existing: string, incoming: string): number {
  const existingSet = tokenSet(existing);
  const incomingSet = tokenSet(incoming);
  if (incomingSet.size === 0) return 0;
  let novel = 0;
  for (const t of incomingSet) {
    if (!existingSet.has(t)) novel += 1;
  }
  return novel / incomingSet.size;
}

function isMeaningfulRefinement(existing: string, incoming: string): boolean {
  const oldText = (existing || "").trim();
  const newText = (incoming || "").trim();
  if (!newText) return false;
  if (!oldText) return true;

  const similarity = tokenSimilarity(oldText, newText);
  if (similarity < 0.72) return true;

  const novelty = noveltyRatio(oldText, newText);
  return newText.length >= oldText.length * 1.12 && novelty >= 0.20;
}

function parseLabeledValue(value: string): { label: string; description: string } | null {
  const idx = value.indexOf(":");
  if (idx <= 0) return null;
  const label = value.slice(0, idx).trim();
  const description = value.slice(idx + 1).trim();
  if (!label || !description) return null;
  return { label, description };
}

function findBestExistingMatch(
  existingEntries: Array<{ label: string; value: string }>,
  nextLabel: string,
  nextDescription: string
): { index: number; exact: boolean } {
  const normalizedNextLabel = normalizeText(nextLabel);
  let bestIdx = -1;
  let bestScore = 0;
  const exact = false;

  for (let i = 0; i < existingEntries.length; i += 1) {
    const entry = existingEntries[i];
    const normalizedExistingLabel = normalizeText(entry.label || "");
    if (normalizedExistingLabel && normalizedExistingLabel === normalizedNextLabel) {
      return { index: i, exact: true };
    }
    const labelScore = tokenSimilarity(entry.label || "", nextLabel);
    const valueScore = tokenSimilarity(entry.value || "", nextDescription);
    const combinedScore = tokenSimilarity(`${entry.label || ""} ${entry.value || ""}`, `${nextLabel} ${nextDescription}`);
    const score = Math.max(labelScore, valueScore, combinedScore);
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }

  if (bestScore >= 0.72) {
    return { index: bestIdx, exact };
  }
  return { index: -1, exact: false };
}

function getExistingStructuredEntries(character: CharacterData, field: string): Array<{ label: string; value: string }> {
  if (!field.includes(".")) return [];
  const [parent, child] = field.split(".");

  if (parent === "personality" && ["traits", "outwardTraits", "inwardTraits"].includes(child)) {
    const traits = (character.personality as any)?.[child];
    if (!Array.isArray(traits)) return [];
    return traits
      .map((t: any) => ({ label: String(t?.label || "").trim(), value: String(t?.value || "").trim() }))
      .filter(t => t.label && t.value);
  }

  if (["tone", "keyLifeEvents", "relationships", "secrets", "fears"].includes(parent) && child === "_extras") {
    const extras = (character as any)?.[parent]?._extras;
    if (!Array.isArray(extras)) return [];
    return extras
      .map((e: any) => ({ label: String(e?.label || "").trim(), value: String(e?.value || "").trim() }))
      .filter(e => e.label && e.value);
  }

  return [];
}

function isLikelyToneDescription(description: string): boolean {
  return /\b(voice|tone|speaks?|speech|word(?: choice)?|vocab(?:ulary)?|cadence|rhythm|formal|informal|direct|indirect|clipped|hesitant|quiet|loud|whisper(?:ed|ing)?|sarcastic|blunt|polite|curt|warm)\b/i.test(description);
}

function buildCharacterIndex(characters: CharacterData[]): Map<string, CharacterData> {
  const map = new Map<string, CharacterData>();
  for (const c of characters || []) {
    const primary = c.name?.toLowerCase?.().trim?.();
    if (primary) map.set(primary, c);
    for (const alias of c.previousNames || []) {
      const a = alias?.toLowerCase?.().trim?.();
      if (a) map.set(a, c);
    }
    for (const nick of (c.nicknames || "").split(",")) {
      const n = nick.trim().toLowerCase();
      if (n) map.set(n, c);
    }
  }
  return map;
}

function reconcileStructuredUpdates(
  updates: ExtractedUpdate[],
  characters: CharacterData[]
): ExtractedUpdate[] {
  const charIndex = buildCharacterIndex(characters);
  const accepted: ExtractedUpdate[] = [];

  for (const update of updates) {
    const existingChar = charIndex.get(update.character.toLowerCase()) || null;
    if (!existingChar) {
      accepted.push(update);
      continue;
    }

    const structuredField =
      update.field.startsWith("personality.") ||
      ["tone._extras", "keyLifeEvents._extras", "relationships._extras", "secrets._extras", "fears._extras"].includes(update.field);

    if (!structuredField) {
      accepted.push(update);
      continue;
    }

    const parsed = parseLabeledValue(update.value);
    if (!parsed) {
      // Force structured fields to stay structured.
      continue;
    }

    if (update.field === "tone._extras" && !isLikelyToneDescription(parsed.description)) {
      continue;
    }

    const existingEntries = getExistingStructuredEntries(existingChar, update.field);
    const match = findBestExistingMatch(existingEntries, parsed.label, parsed.description);

    if (match.index !== -1) {
      const existing = existingEntries[match.index];
      if (!isMeaningfulRefinement(existing.value, parsed.description)) {
        continue;
      }
      accepted.push({
        ...update,
        // Preserve canonical existing label to avoid variant-label duplication.
        value: `${existing.label}: ${parsed.description}`
      });
      continue;
    }

    // Also suppress duplicates introduced earlier in the same extraction payload.
    const sameFieldAccepted = accepted.filter(a =>
      a.character.toLowerCase() === update.character.toLowerCase() && a.field === update.field
    );
    const priorEntries = sameFieldAccepted
      .map(a => parseLabeledValue(a.value))
      .filter((x): x is { label: string; description: string } => Boolean(x))
      .map(x => ({ label: x.label, value: x.description }));

    const priorMatch = findBestExistingMatch(priorEntries, parsed.label, parsed.description);
    if (priorMatch.index !== -1) {
      const existing = priorEntries[priorMatch.index];
      if (!isMeaningfulRefinement(existing.value, parsed.description)) {
        continue;
      }
      // Replace prior accepted variant with refined single entry.
      const replaceIdx = accepted.findIndex(a =>
        a.character.toLowerCase() === update.character.toLowerCase() &&
        a.field === update.field &&
        normalizeText(a.value.split(":")[0] || "") === normalizeText(existing.label)
      );
      if (replaceIdx !== -1) {
        accepted[replaceIdx] = {
          ...accepted[replaceIdx],
          value: `${accepted[replaceIdx].value.split(":")[0].trim()}: ${parsed.description}`
        };
        continue;
      }
    }

    accepted.push(update);
  }

  return accepted;
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
  lines.push(`    Scene Position: ${c.scenePosition || '(not set)'}`);
  
  {
    const wearingEntries = c.currentlyWearing ? Object.entries(c.currentlyWearing).filter(([k, v]) => k !== '_extras' && v).map(([k, v]) => `${k}: ${v}`).join(', ') : '';
    const wearingExtras = (c.currentlyWearing as any)?._extras;
    const extrasStr = wearingExtras?.length ? wearingExtras.filter((e: any) => e.value).map((e: any) => `${e.label}: ${e.value}`).join(', ') : '';
    const allWearing = [wearingEntries, extrasStr].filter(Boolean).join(', ');
    lines.push(`    Currently Wearing: ${allWearing || '(not yet described -- update when clothing is mentioned)'}`);
  }
  
  // --- STABLE STATE (update only when explicitly stated) ---
  lines.push(`  [STABLE - update only when explicitly described]`);
  {
    const appearance = c.physicalAppearance ? Object.entries(c.physicalAppearance).filter(([k, v]) => k !== '_extras' && v).map(([k, v]) => `${k}: ${v}`).join(', ') : '';
    const paExtras = (c.physicalAppearance as any)?._extras;
    const paExtrasStr = paExtras?.length ? paExtras.filter((e: any) => e.value).map((e: any) => `${e.label}: ${e.value}`).join(', ') : '';
    const allAppearance = [appearance, paExtrasStr].filter(Boolean).join(', ');
    lines.push(`    Physical Appearance: ${allAppearance || '(not yet described -- populate when revealed in dialogue)'}`);
  }
  
  {
    const preferred = c.preferredClothing ? Object.entries(c.preferredClothing).filter(([k, v]) => k !== '_extras' && v).map(([k, v]) => `${k}: ${v}`).join(', ') : '';
    const pcExtras = (c.preferredClothing as any)?._extras;
    const pcExtrasStr = pcExtras?.length ? pcExtras.filter((e: any) => e.value).map((e: any) => `${e.label}: ${e.value}`).join(', ') : '';
    const allPreferred = [preferred, pcExtrasStr].filter(Boolean).join(', ');
    lines.push(`    Preferred Clothing: ${allPreferred || '(not yet described -- populate when style preferences emerge)'}`);
  }
  
  // --- BACKGROUND (update only when explicitly stated) ---
  {
    const bgEntries = c.background ? Object.entries(c.background).filter(([k, v]) => k !== '_extras' && v).map(([k, v]) => `${k}: ${v}`).join(', ') : '';
    const bgExtras = (c.background as any)?._extras;
    const bgExtrasStr = bgExtras?.length ? bgExtras.filter((e: any) => e.value).map((e: any) => `${e.label}: ${e.value}`).join(', ') : '';
    const allBg = [bgEntries, bgExtrasStr].filter(Boolean).join(', ');
    lines.push(`    Background: ${allBg || '(not yet described -- populate when job, education, residence, hobbies, etc. are revealed)'}`);
  }
  
  // --- PERSONALITY ---
  {
    if (c.personality?.splitMode) {
      const outward = (c.personality.outwardTraits || []).filter(t => t.value).map(t => `${t.label}: ${t.value}`).join(', ');
      const inward = (c.personality.inwardTraits || []).filter(t => t.value).map(t => `${t.label}: ${t.value}`).join(', ');
      lines.push(`    Personality (outward): ${outward || '(not yet described -- infer outward traits from observed behavior)'}`);
      lines.push(`    Personality (inward): ${inward || '(not yet described -- infer inner traits from thoughts and private moments)'}`);
    } else {
      const traits = (c.personality?.traits || []).filter(t => t.value).map(t => `${t.label}: ${t.value}`).join(', ');
      lines.push(`    Personality: ${traits || '(not yet described -- infer traits from observed behavior and dialogue patterns)'}`);
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
    const extrasStr = section?._extras?.length ? section._extras.filter(e => e.value).map(e => `${e.label}: ${e.value}`).join(', ') : '';
    lines.push(`    ${title}: ${extrasStr || '(none yet -- populate when revealed in dialogue)'}`);
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

A) VOLATILE STATE — mood, broad location, micro scene position, clothing changes, temporary physical conditions
   → If a character is actively present and speaking/acting, update mood, location, and scenePosition when they materially changed.
   → Characters NOT mentioned or acting in this exchange should NOT receive updates.
   → location is the broad place ("abandoned cabin", "kitchen", "downtown coffee shop").
   → scenePosition is the immediate physical placement within that place ("outside the cabin door", "halfway through the doorway", "inside near the fireplace", "pinned against the wall").
   → For user-controlled characters, track scenePosition from the user's authored actions and from visible AI reactions, but NEVER assume they completed a movement the user did not write.

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
ANALYTICAL DEPTH FRAMEWORK (apply to ALL phases above and below)
═══════════════════════════════════════════════════

--- BLOCK 1: PSYCHOLOGICAL INFERENCE FRAMEWORK ---
(Apply to ALL personality, tone, fear, and relationship extractions)

Before writing any trait or section entry, reason through THREE layers:
- LAYER 1 (Surface): What did the character do or say in this specific moment?
- LAYER 2 (Pattern): Is this consistent with earlier behavior, or new? One occurrence = tentative. Two or more = pattern. A revealing moment = decisive.
- LAYER 3 (Psychology): What does this behavior suggest about the underlying personality, need, fear, or defense mechanism? What is the WHY behind the WHAT?

Write ALL traits and entries at LAYER 3 depth, not LAYER 1.

WRONG (Layer 1): "Humorous: Makes jokes frequently"
RIGHT (Layer 3): "Deflective Humor: Uses wit and levity as a primary buffer against emotional vulnerability. Humor increases noticeably when conversation moves toward personal territory or when the character feels cornered — functions as both a social shield and a way to maintain control of the emotional temperature of an interaction."

FORBIDDEN trait descriptions:
- Single words without context (e.g., "Funny", "Shy", "Smart")
- Vague adjectives without behavioral grounding (e.g., "Interesting", "Complex")
- Circular descriptions (e.g., "Reserved: Is reserved in social situations")
- Generic positives with no specificity (e.g., "Kind: Is a kind person")

--- BLOCK 2: PROGRESSIVE TRAIT REFINEMENT ---
Treat every trait as a hypothesis that gets more precise over time, never less. When updating an existing trait, ask: "Can I make this more specific with the evidence I now have?" If yes, you MUST refine it.

REFINEMENT STAGES:
- STAGE 1 (Tentative, 1 observation): Broad label with minimal description. Example: "Reserved: Tends toward quietness in social settings."
- STAGE 2 (Contextualised, 2-3 observations): Specify WHEN and WITH WHOM. Example: "Selectively Reserved: Comfortable and open in one-on-one conversation but noticeably quieter and more guarded in group settings."
- STAGE 3 (Psychologically Grounded, 4+ observations or revealing moment): Describe the underlying mechanism and what it costs the character. Example: "Social Performance Anxiety: Functions confidently in intimate settings where they control the conversational frame. In groups, fear of being evaluated triggers withdrawal — shorter sentences, physical distancing, deflecting attention to others."

RULES:
- Always advance the stage if evidence supports it.
- Never collapse a Stage 3 trait back to Stage 1 — only forward, never backward.
- If you cannot yet reach Stage 2, write Stage 1 with tentative language.

--- BLOCK 3: TRAIT CONFLICT RESOLUTION ---
(CRITICAL — apply before finalising any update)

When new evidence CONTRADICTS or COMPLICATES an existing trait or entry, DO NOT simply add a second contradictory entry. Choose one resolution path:

PATH A (Genuine Evolution): The character has changed over the session. Update the single trait entry to capture the arc. Example: Old "Conflict-Avoidant" + new directness → "Emerging Assertiveness: Initially defaulted to conflict avoidance, but across this session has shown growing willingness to state disagreement directly — particularly when the topic feels important."

PATH B (Context Dependency): Both observations are true in different contexts. Merge into a single nuanced entry that specifies WHEN each applies. Example: Old "Outgoing" + new guardedness → "Contextually Social: Projects genuine warmth in structured settings where the social script is clear. In unstructured personal contexts, becomes noticeably more guarded."

PATH C (False Presentation): The character is performing a trait they do not hold. This is a split-mode candidate. Move the performed trait to outwardTraits and the true underlying trait to inwardTraits.

RESOLUTION RULE: After resolution, exactly ONE entry per psychological concept. Zero duplicates. Zero silent contradictions.

STALENESS RULE: If a trait is contradicted and no resolution path applies cleanly, append "(REVIEW: may no longer be accurate based on recent behaviour)" to the description.

--- BLOCK 4: SPLIT PERSONALITY MODE DETECTION ---
The character card supports two personality modes:
- STANDARD MODE: A single unified trait list (personality.traits)
- SPLIT MODE: Separate outwardTraits (public persona) and inwardTraits (private self)

Flag a character as a Split Mode candidate when you observe CONSISTENT divergence between:
- How the character presents publicly vs. what internal dialogue reveals about their actual state
- What they say vs. what they do when alone or off-guard
- How they behave with strangers vs. with trusted people
- Emotions they perform vs. emotions they clearly feel

When detected across 3+ exchanges, add to the personality section:
[SPLIT MODE CANDIDATE: Consistent divergence observed between public persona and internal state. Recommend switching to Split Mode. Outward: [brief]. Inward: [brief].]

When a character IS already in Split Mode:
- outwardTraits = How others perceive them; the face they show the world
- inwardTraits = Their actual emotional experience; private self
- The two lists must COMPLEMENT each other, never duplicate
- NEVER make outward = positive and inward = negative. Both should contain complex, realistic entries.

--- BLOCK 5: TONE INFERENCE FROM DIALOGUE ---
(for tone._extras — extract from the text itself, do NOT wait for explicit statements)

Tone captures HOW this character communicates — their linguistic fingerprint. Extract from:
- VOCABULARY: Technical terms, slang, formal register, monosyllabic replies, elaborate sentences?
- RHYTHM: Short/punchy or long/winding? Trail off, self-interrupt, or speak in polished thoughts?
- FORMALITY SHIFTS: Does language change by audience? Map these shifts.
- EMOTIONAL DIRECTNESS: Name feelings plainly ("I am angry") or obliquely ("It is fine. Whatever.")?
- DEFLECTION PATTERNS: When pressed on uncomfortable topics — change subject? Counter-question? Go flat?
- INTENSITY ESCALATION: Stay measured when emotional, or become clipped/expansive/erratic under pressure?

FORMAT: "[Context]: [specific description of how they communicate]"
Examples:
- "Under pressure: Voice becomes clipped and transactional. Stops using filler words. Emotional content stripped from language entirely."
- "With trusted people: Longer sentences with self-interruptions. Allows thoughts to trail off. Uses 'I mean' and 'the thing is' as openers."
- "When deflecting: Pivots to questions rather than answering directly. Increases hedging language."

--- BLOCK 6: CROSS-FIELD COHERENCE ENFORCEMENT ---
(Run after all updates are determined, before finalising output)

Verify the character card tells a coherent story across all fields:
- BACKGROUND → PERSONALITY: Do experiences produce the observed traits? Instability/trauma should show coping mechanisms.
- FEARS → BEHAVIOUR: Do stored fears echo in personality and tone? If fear of abandonment exists, look for behavioural echoes.
- GOALS → MOTIVATION: Does at least one goal connect to background motivation?
- TONE → PERSONALITY: Does speech style align with personality? "Emotionally open" + "deflective and guarded" tone = incoherence.
- RELATIONSHIPS → FEARS/SECRETS: Do dynamics reflect known vulnerabilities?

When incoherence is found: flag it with a correction update, or note the inconsistency in the relevant field.

--- BLOCK 7: COMPLETE TRAIT LIFECYCLE ---
Every stored value passes through this lifecycle. Use the appropriate operation:

- CREATE: New info with no existing home. Must pass Layer 3 depth. No duplicates. Max 1 new non-goal entry per section per extraction.
- REFINE: Existing info can be more specific. Always advance precision. PREFERRED over CREATE when topic is already represented.
- MERGE: Two entries cover same psychological territory. Combine into one richer entry.
- CORRECT: Entry factually contradicted. Apply Conflict Resolution (Block 3). Result: one accurate entry.
- CONTEXTUALISE: Entry true in some situations. Specify contexts in one entry, do not split into two.
- REMOVE: Entry definitively no longer accurate. For goals: goals.GoalTitle = "REMOVE". For traits: empty string ONLY if actively harmful to coherence. Err on CORRECT or CONTEXTUALISE over REMOVE.
- HOLD: Entry not contradicted but not reinforced. Do not modify. Only flag if it creates active incoherence.

GOLDEN RULE: "Every section of the character card should tell the same story as every other section. The card is a portrait — every brushstroke should contribute to one coherent image."

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
- preferredClothing.casual, preferredClothing.work, preferredClothing.sleep, preferredClothing.undergarments, preferredClothing.miscellaneous
- preferredClothing._extras (array of {id, label, value})
- background.jobOccupation, background.educationLevel, background.residence, background.hobbies, background.financialStatus, background.motivation
- background._extras (array of {id, label, value})
- personality.outwardTraits, personality.inwardTraits (trait arrays — provide value as "Label: Description" format)
- personality.traits (unified trait array -- used when character is NOT in split mode. Provide value as "Label: Description" format)
- tone._extras (array of {id, label, value} — e.g., "With strangers: formal and clipped")
- keyLifeEvents._extras (array of {id, label, value})
- relationships._extras (array of {id, label, value} — e.g., "Emma: Close friend and confidante")
- secrets._extras (array of {id, label, value})
- fears._extras (array of {id, label, value})
- location (current location/place)
- scenePosition (micro-position inside the current place, max 18 words; examples: "outside the cabin door", "halfway through the doorway", "inside near the fireplace")
- currentMood (emotional/psychological state ONLY, max 12 words, no physical actions)

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

SCENE POSITION QUALITY RULES (CRITICAL):
- scenePosition tracks immediate physical placement, not mood or personality.
- Update scenePosition when the exchange changes doorway/threshold status, inside/outside status, room position, proximity, restraints, vehicles, beds, hiding places, danger zones, or who is stuck/blocked.
- Use concise natural phrases, max 18 words.
- Do NOT put the whole action sequence in scenePosition.
- CORRECT: "outside the narrow cabin door, waiting to enter"
- CORRECT: "inside the cabin near the doorway"
- WRONG: "Shivering and terrified while thinking about the storm"

CURRENT MOOD QUALITY RULES (CRITICAL):
- currentMood must describe FEELING, not ACTION.
- FORBIDDEN in currentMood: body parts, movement verbs, clothing/object references, sexual mechanics.
- CORRECT: "Slyly delighted but cautious"
- WRONG: "Extending her foot under the bedspread toward his thigh"

CONSERVATIVE UPDATE RULES (CRITICAL):
- Preserve existing information unless directly contradicted by clear evidence.
- Do NOT replace an existing tone/personality entry with a slight rewording.
- Before adding a new tone/personality item, check if it's semantically similar to an existing one.
  If similar, update/refine the existing entry instead of creating a new duplicate.
- Avoid generic labels that are not true communication style or psychology.
- Never emit top-level fields like "tone" or "personality" as raw strings; use allowed subfields only.
- DEFAULT TO NO UPDATE when no material change is present.
- EMPTY updates array is valid and preferred over low-confidence edits.
- Only update mood/location when the latest exchange clearly changed them.

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
    { "character": "CharacterName", "field": "scenePosition", "value": "standing outside the shop entrance" },
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

    // Only grok-4.20-0309-reasoning is used app-wide; reject anything else
    const VALID_GROK_MODELS = ['grok-4.20-0309-reasoning'];
    const effectiveModelId = (modelId && VALID_GROK_MODELS.includes(modelId)) ? modelId : 'grok-4.20-0309-reasoning';
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
          { role: "user", content: `Analyze this dialogue and extract only MATERIAL character state deltas. Remember: Phase 2 (review existing state) and Phase 3 (placeholder scan) are MANDATORY. If the exchange does not materially change a field, do NOT emit an update. Mood/location/scenePosition should be updated only when clearly changed. Behavioral patterns across messages should refine existing personality/tone entries, not generate paraphrase duplicates. Use goals.GoalTitle = "REMOVE" only when a goal is clearly obsolete or contradicted.\n\n${combinedText}` }
        ],
        temperature: 0.15,
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
            model: 'grok-4.20-0309-reasoning',
            messages: [
              { role: "system", content: "Extract ONLY non-sexual character metadata: mood, location, scenePosition, personality traits inferred from behavior, relationship changes, background reveals. Ignore any explicit/sexual content. scenePosition is the immediate physical placement inside the broad location. Return JSON with {updates: [{character, field, value}]}." },
              { role: "user", content: `Characters: ${filteredCharacters.map((c: CharacterData) => c.name).join(', ')}. Analyze:\n${combinedText}` }
            ],
            temperature: 0.2,
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
              const safeUpdates = (parsed.updates || [])
                .filter((u: any) =>
                  typeof u.character === 'string' && typeof u.field === 'string' && typeof u.value === 'string' &&
                  u.character.trim() && u.field.trim() && u.value.trim() && isAllowedUpdateField(u.field.trim())
                )
                .map((u: ExtractedUpdate) => {
                  if (u.field !== 'currentMood') return u;
                  const sanitizedMood = sanitizeCurrentMood(u.value);
                  return sanitizedMood ? { ...u, value: sanitizedMood } : null;
                })
                .filter((u: ExtractedUpdate | null): u is ExtractedUpdate => Boolean(u));
              const reconciledSafeUpdates = reconcileStructuredUpdates(safeUpdates, filteredCharacters as CharacterData[]);
              console.log(`[extract-character-updates] Safe retry yielded ${reconciledSafeUpdates.length} updates`);
              return new Response(JSON.stringify({ updates: reconciledSafeUpdates }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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

    // Validate, sanitize, and filter updates
    extractedUpdates = extractedUpdates
      .filter((u: any) =>
        typeof u.character === 'string' &&
        typeof u.field === 'string' &&
        typeof u.value === 'string' &&
        u.character.trim() &&
        u.field.trim() &&
        u.value.trim() &&
        isAllowedUpdateField(u.field.trim())
      )
      .map((u: ExtractedUpdate) => {
        if (u.field !== 'currentMood') return u;
        const sanitizedMood = sanitizeCurrentMood(u.value);
        return sanitizedMood ? { ...u, value: sanitizedMood } : null;
      })
      .filter((u): u is ExtractedUpdate => Boolean(u));

    extractedUpdates = reconcileStructuredUpdates(extractedUpdates, filteredCharacters as CharacterData[]);

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
