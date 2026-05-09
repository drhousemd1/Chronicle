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
  age?: string;
  sexType?: string;
  sexualOrientation?: string;
  roleDescription?: string;
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
  personality?: {
    splitMode?: boolean;
    traits?: Array<{ label: string; value: string } | string>;
    outwardTraits?: Array<{ label: string; value: string }>;
    inwardTraits?: Array<{ label: string; value: string }>;
    miscellaneous?: string;
    secrets?: string;
    fears?: string;
    kinksFantasies?: string;
    desires?: string;
  };
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
  if (["age", "sexType", "sexualOrientation", "roleDescription", "location", "scenePosition", "currentMood", "nicknames"].includes(field)) return true;
  if (field.startsWith("goals.")) return true;
  if (field.startsWith("sections.")) {
    const sectionTitle = field.split(".")[1]?.trim().toLowerCase();
    return sectionTitle !== "goals" && sectionTitle !== "goal";
  }
  if (!field.includes(".")) return false;

  const [parent, child] = field.split(".");
  if (!parent || !child) return false;

  if (parent === "physicalAppearance" || parent === "currentlyWearing" || parent === "preferredClothing" || parent === "background") {
    return true;
  }
  if (parent === "personality") {
    return ["traits", "outwardTraits", "inwardTraits", "splitMode", "miscellaneous", "secrets", "fears", "kinksFantasies", "desires"].includes(child);
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
      .map((t: any) => {
        if (typeof t === "string") {
          const parsed = parseLabeledValue(t);
          return parsed
            ? { label: parsed.label, value: parsed.description }
            : { label: t.trim(), value: t.trim() };
        }
        return { label: String(t?.label || "").trim(), value: String(t?.value || "").trim() };
      })
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
      ["personality.traits", "personality.outwardTraits", "personality.inwardTraits"].includes(update.field) ||
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

function buildCharacterStateBlock(c: CharacterData): string {
  const formatTraitEntry = (trait: unknown): string => {
    if (typeof trait === "string") {
      const trimmed = trait.trim();
      return trimmed ? `- ${trimmed}` : "";
    }
    if (trait && typeof trait === "object") {
      const record = trait as { label?: unknown; value?: unknown };
      const label = String(record.label || "").trim();
      const value = String(record.value || "").trim();
      if (label && value) return `- ${label}: ${value}`;
      if (label) return `- ${label}`;
      if (value) return `- ${value}`;
    }
    return "";
  };

  const formatRecord = (record: Record<string, any> | undefined): string[] => {
    if (!record) return [];
    const lines: string[] = [];
    for (const [key, rawValue] of Object.entries(record)) {
      if (key === "_extras") continue;
      const value = typeof rawValue === "string" ? rawValue.trim() : "";
      if (value) lines.push(`- ${key}: ${value}`);
    }
    const extras = (record as any)._extras;
    if (Array.isArray(extras)) {
      for (const entry of extras) {
        const label = String(entry?.label || "").trim();
        const value = String(entry?.value || "").trim();
        if (label || value) lines.push(`- ${label || "Extra"}: ${value || "(empty)"}`);
      }
    }
    return lines;
  };

  const formatExtras = (section: { _extras?: Array<{ label: string; value: string }> } | undefined): string[] => {
    if (!Array.isArray(section?._extras)) return [];
    return section!._extras!
      .map((entry) => {
        const label = String(entry?.label || "").trim();
        const value = String(entry?.value || "").trim();
        return label || value ? `- ${label || "Entry"}: ${value || "(empty)"}` : "";
      })
      .filter(Boolean);
  };

  const appendBlock = (lines: string[], title: string, entries: string[]) => {
    lines.push(`--- ${title} ---`);
    lines.push(entries.length ? entries.join("\n") : "(empty)");
  };

  const lines: string[] = [];
  lines.push(`## ${c.name}`);

  if (c.previousNames?.length) {
    lines.push(`Previously known as: ${c.previousNames.join(", ")}`);
  }
  if (c.nicknames) {
    lines.push(`Nicknames: ${c.nicknames}`);
  }
  appendBlock(lines, "Core details", [
    `- age: ${c.age || "(empty)"}`,
    `- sexType: ${c.sexType || "(empty)"}`,
    `- sexualOrientation: ${c.sexualOrientation || "(empty)"}`,
    `- roleDescription: ${c.roleDescription || "(empty)"}`,
  ]);

  appendBlock(lines, "Current state", [
    `- currentMood: ${c.currentMood || "(empty)"}`,
    `- location: ${c.location || "(empty)"}`,
    `- scenePosition: ${c.scenePosition || "(empty)"}`,
  ]);
  appendBlock(lines, "Physical appearance", formatRecord(c.physicalAppearance));
  appendBlock(lines, "Currently wearing", formatRecord(c.currentlyWearing));
  appendBlock(lines, "Preferred clothing", formatRecord(c.preferredClothing));
  appendBlock(lines, "Background", formatRecord(c.background));

  if (c.personality?.splitMode) {
    appendBlock(lines, "Personality outward traits", (c.personality.outwardTraits || []).map(formatTraitEntry).filter(Boolean));
    appendBlock(lines, "Personality inward traits", (c.personality.inwardTraits || []).map(formatTraitEntry).filter(Boolean));
  } else if (Array.isArray(c.personality?.traits)) {
    appendBlock(lines, "Personality traits", c.personality.traits.map(formatTraitEntry).filter(Boolean));
  } else if (c.personality) {
    appendBlock(lines, "Personality", Object.entries(c.personality).map(([key, value]) => `- ${key}: ${Array.isArray(value) ? value.join(", ") : value}`).filter(Boolean));
  }

  const sidePersonalityDetails = [
    ["miscellaneous", c.personality?.miscellaneous],
    ["secrets", c.personality?.secrets],
    ["fears", c.personality?.fears],
    ["kinksFantasies", c.personality?.kinksFantasies],
    ["desires", c.personality?.desires],
  ]
    .map(([key, value]) => String(value || "").trim() ? `- ${key}: ${String(value).trim()}` : "")
    .filter(Boolean);
  if (sidePersonalityDetails.length) {
    appendBlock(lines, "Personality details", sidePersonalityDetails);
  }

  const extrasOnlySections: Array<{ key: keyof CharacterData; title: string }> = [
    { key: "tone", title: "Tone" },
    { key: "keyLifeEvents", title: "Key life events" },
    { key: "relationships", title: "Relationships" },
    { key: "secrets", title: "Secrets" },
    { key: "fears", title: "Fears" },
  ];
  for (const { key, title } of extrasOnlySections) {
    appendBlock(lines, title, formatExtras(c[key] as { _extras?: Array<{ label: string; value: string }> } | undefined));
  }

  if (c.goals?.length) {
    lines.push(`--- Character goals ---`);
    for (const g of c.goals) {
      const outcome = g.desiredOutcome ? `desired_outcome: ${g.desiredOutcome}` : "";
      lines.push(`- ${g.title}: ${outcome} | current_status: ${g.currentStatus || "(empty)"} | progress: ${g.progress || 0}%`);
      if (g.steps?.length) {
        for (const [index, step] of g.steps.entries()) {
          lines.push(`  ${step.completed ? "[x]" : "[ ]"} Step ${index + 1}: ${step.description}`);
        }
      }
    }
  } else {
    appendBlock(lines, "Character goals", []);
  }

  if (c.customSections?.length) {
    for (const section of c.customSections) {
      appendBlock(lines, `Custom section: ${section.title}`, (section.items || []).map(item => `- ${item.label}: ${item.value}`).filter(Boolean));
    }
  }

  return lines.join("\n");
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

    const { userMessage, aiResponse, recentContext, characters, modelId, eligibleCharacters, currentDay, currentTimeOfDay } = await req.json();
    
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

    const storyClock = currentDay != null || currentTimeOfDay
      ? `Day: ${currentDay ?? 'unknown'}\nTime of Day: ${currentTimeOfDay ?? 'unknown'}`
      : 'Day: unknown\nTime of Day: unknown';

    const supportedFields = `
Top-level fields:
- age
- sexType
- sexualOrientation
- roleDescription
- nicknames
- location
- scenePosition
- currentMood

Nested detail fields:
- physicalAppearance.* and physicalAppearance._extras
- currentlyWearing.* and currentlyWearing._extras
- preferredClothing.* and preferredClothing._extras
- background.* and background._extras

Structured sections:
- personality.traits
- personality.outwardTraits
- personality.inwardTraits
- personality.splitMode
- personality.miscellaneous
- personality.secrets
- personality.fears
- personality.kinksFantasies
- personality.desires
- tone._extras
- keyLifeEvents._extras
- relationships._extras
- secrets._extras
- fears._extras
- sections.SectionTitle.ItemLabel

Character goals:
- goals.GoalTitle
- goals.GoalTitle = "REMOVE"`;

    const systemPrompt = `You are the post-turn CHARACTER STATE SYNC worker for an adult roleplay app. Your job is to compare the latest exchange against the current saved character cards and return only supported field updates that materially changed.

--- CURRENT STORY CLOCK ---
${storyClock}

The app code owns timestamps. Do not invent day/time metadata. If an accepted update is saved, the backend will stamp it with the current story clock and source message/generation.

${eligibleConstraint}
--- CURRENT CHARACTER STATE ---
${characterContext || 'No eligible character data provided'}

--- SUPPORTED FIELD PATHS ---
${supportedFields}

--- CORE TASK ---
- Review the latest user message and AI response against every supported field for each eligible character.
- Return an update when the latest exchange changes, reveals, corrects, progresses, completes, or contradicts a supported field.
- Return no update when the existing card is still accurate or when the evidence is weak.
- Use the real field path from SUPPORTED FIELD PATHS. Never create fake containers such as sections.Goals.* when goals.* exists.
- Preserve current card information unless the latest exchange gives a clear reason to change it.

--- FIELD GUIDANCE ---
- currentMood: emotional/psychological state only, max 12 words. No body-part prose, clothing, objects, or action sequences.
- location: broad place, such as "abandoned cabin" or "downtown coffee shop".
- scenePosition: immediate placement inside the broad place, max 18 words. It should not summarize mood or the full action sequence.
- appearance/clothing/background: update when the exchange explicitly reveals or changes the fact.
- personality/tone/relationships/secrets/fears/keyLifeEvents: write "Label: Description" as the value. Prefer refining a matching existing entry over adding a duplicate.
- custom sections: use sections.SectionTitle.ItemLabel only when the information belongs in an existing or clearly appropriate custom section. Do not use custom sections to avoid the structured fields above.

--- CHARACTER GOALS ---
- Use goals.GoalTitle only for sustained goals, not one-off impulses or routine actions.
- Prefer updating an existing goal over creating a near-duplicate.
- Create at most one new goal per character from this exchange.
- Keep goals bounded: 3-6 logical steps, never runaway lists.
- Goal value format:
  desired_outcome: What success looks like. | current_status: Current state. | progress: 0-100 | complete_steps: 1,3 | new_steps: Step 1: First milestone. Step 2: Second milestone.
- Use complete_steps only for existing steps that were clearly completed.
- Use goals.GoalTitle = "REMOVE" only when a goal is clearly obsolete, contradicted, or abandoned.

--- CONSERVATIVE UPDATE RULES ---
- Empty updates are valid and preferred over low-confidence edits.
- Do not emit unchanged values.
- Do not reword existing values just to make them sound better.
- Do not add duplicate traits, tone entries, relationship entries, goals, or custom-section items under slightly different labels.
- Do not update characters outside ELIGIBLE CHARACTERS.
- Do not output unsupported fields; unsupported fields will be ignored.

--- OUTPUT JSON ---
Return only this JSON shape:
{
  "updates": [
    { "character": "CharacterName", "field": "currentMood", "value": "Nervous but determined" },
    { "character": "CharacterName", "field": "scenePosition", "value": "inside the cabin near the fireplace" },
    { "character": "CharacterName", "field": "relationships._extras", "value": "Emma: Trusted confidante after sharing the secret" },
    { "character": "CharacterName", "field": "goals.Rebuild Trust", "value": "desired_outcome: Restore enough trust to work together honestly. | current_status: First honest conversation happened. | progress: 25 | complete_steps: 1 | new_steps: Step 1: Admit the lie. Step 2: Explain why it happened. Step 3: Follow through on one promise." }
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
          { role: "user", content: `Analyze the latest exchange and return only material supported character-card deltas.\n\n${combinedText}` }
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
              { role: "system", content: "Extract only non-explicit character state metadata from the latest exchange. Return JSON with {updates:[{character,field,value}]}. Use only supported field paths and omit low-confidence changes." },
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
