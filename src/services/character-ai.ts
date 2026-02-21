
import { ScenarioData, Character, CharacterTraitSection, PhysicalAppearance, CurrentlyWearing, PreferredClothing, WorldCore, CharacterExtraRow } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { uid, now } from "@/utils";

// ============================================================
// Shared Context Builders
// ============================================================

/**
 * Build comprehensive world + other-characters context from the full scenario data.
 * Used by BOTH per-row sparkle and AI Fill/Generate.
 */
function buildFullContext(appData: ScenarioData, targetCharacterId: string): string {
  const parts: string[] = [];
  const core = appData.world.core;

  // World info
  if (core.scenarioName) parts.push(`Scenario: ${core.scenarioName}`);
  if (core.briefDescription) parts.push(`Description: ${core.briefDescription}`);
  if (core.storyPremise) parts.push(`Premise: ${core.storyPremise}`);

  // Locations — structured first, fallback to legacy
  if (core.structuredLocations?.length) {
    const locs = core.structuredLocations.map(l => `  - ${l.label}: ${l.description}`).join('\n');
    parts.push(`Locations:\n${locs}`);
  } else if (core.locations) {
    parts.push(`Locations: ${core.locations}`);
  }

  if (core.factions) parts.push(`Factions: ${core.factions}`);
  if (core.toneThemes) parts.push(`Tone & Themes: ${core.toneThemes}`);
  if (core.plotHooks) parts.push(`Plot Hooks: ${core.plotHooks}`);
  if (core.historyTimeline) parts.push(`History: ${core.historyTimeline}`);
  if (core.dialogFormatting) parts.push(`Dialog Style: ${core.dialogFormatting}`);

  // Content themes
  const ct = appData.contentThemes;
  if (ct) {
    const themeParts: string[] = [];
    if (ct.storyType) themeParts.push(`Story Type: ${ct.storyType}`);
    if (ct.genres?.length) themeParts.push(`Genres: ${ct.genres.join(', ')}`);
    if (ct.characterTypes?.length) themeParts.push(`Character Types: ${ct.characterTypes.join(', ')}`);
    if (ct.origin?.length) themeParts.push(`Origin: ${ct.origin.join(', ')}`);
    if (themeParts.length) parts.push(themeParts.join('; '));
  }

  // Custom world sections
  if (core.customWorldSections?.length) {
    for (const sec of core.customWorldSections) {
      const filled = sec.items.filter(i => i.label && i.value);
      if (filled.length) {
        parts.push(`${sec.title}:\n${filled.map(i => `  - ${i.label}: ${i.value}`).join('\n')}`);
      }
    }
  }

  // Story goals/arcs
  if (core.storyGoals?.length) {
    const goalLines = core.storyGoals.map(g => {
      const outcome = g.desiredOutcome ? `: ${g.desiredOutcome}` : '';
      const mode = g.mode ? ` [${g.mode}]` : '';
      return `  - ${g.title}${outcome}${mode}`;
    }).join('\n');
    parts.push(`Story Arcs:\n${goalLines}`);
  }

  // Other characters (comprehensive summaries)
  const otherChars = appData.characters.filter(c => c.id !== targetCharacterId);
  if (otherChars.length > 0) {
    const charSummaries = otherChars.map(c => {
      const bits: string[] = [];
      bits.push(c.name || 'Unnamed');
      if (c.roleDescription) bits.push(`role: ${c.roleDescription}`);
      if (c.age) bits.push(`age ${c.age}`);
      if (c.sexType) bits.push(c.sexType);
      if (c.tags) bits.push(`tags: ${c.tags}`);
      if (c.location) bits.push(`at: ${c.location}`);
      // Key personality summary
      const pers = c.personality;
      if (pers) {
        const traits = (pers.splitMode
          ? [...(pers.outwardTraits || []), ...(pers.inwardTraits || [])]
          : (pers.traits || [])
        ).filter(t => t.value).map(t => t.value).slice(0, 3);
        if (traits.length) bits.push(`personality: ${traits.join(', ')}`);
      }
      // Relationship extras
      const rels = c.relationships?._extras?.filter(e => e.label && e.value);
      if (rels?.length) bits.push(`relationships: ${rels.map(r => `${r.label}: ${r.value}`).join('; ')}`);
      return `  - ${bits.join(', ')}`;
    }).join('\n');
    parts.push(`\nOTHER CHARACTERS IN SCENARIO:\n${charSummaries}`);
  }

  return parts.join('\n') || 'No world context available';
}

/**
 * Build comprehensive self-context from everything already filled on a character.
 * Ensures new fields stay consistent with existing data.
 */
function buildCharacterSelfContext(character: Character): string {
  const parts: string[] = [];

  // Basic info
  if (character.name && character.name !== "New Character") parts.push(`Name: ${character.name}`);
  if (character.age) parts.push(`Age: ${character.age}`);
  if (character.sexType) parts.push(`Sex/Identity: ${character.sexType}`);
  if (character.sexualOrientation) parts.push(`Sexual Orientation: ${character.sexualOrientation}`);
  if (character.roleDescription) parts.push(`Role: ${character.roleDescription}`);
  if (character.tags) parts.push(`Tags: ${character.tags}`);
  if (character.location) parts.push(`Location: ${character.location}`);
  if (character.currentMood) parts.push(`Current Mood: ${character.currentMood}`);
  if (character.nicknames) parts.push(`Nicknames: ${character.nicknames}`);

  // Physical appearance (filled fields only)
  const pa = character.physicalAppearance;
  if (pa) {
    const paItems = Object.entries(pa)
      .filter(([k, v]) => k !== '_extras' && v)
      .map(([k, v]) => `${k}: ${v}`);
    const paExtras = (pa._extras || []).filter(e => e.label && e.value).map(e => `${e.label}: ${e.value}`);
    const allPa = [...paItems, ...paExtras];
    if (allPa.length) parts.push(`Physical Appearance: ${allPa.join(', ')}`);
  }

  // Currently wearing
  const cw = character.currentlyWearing;
  if (cw) {
    const cwItems = Object.entries(cw).filter(([k, v]) => k !== '_extras' && v).map(([k, v]) => `${k}: ${v}`);
    const cwExtras = (cw._extras || []).filter(e => e.label && e.value).map(e => `${e.label}: ${e.value}`);
    const allCw = [...cwItems, ...cwExtras];
    if (allCw.length) parts.push(`Currently Wearing: ${allCw.join(', ')}`);
  }

  // Preferred clothing
  const pc = character.preferredClothing;
  if (pc) {
    const pcItems = Object.entries(pc).filter(([k, v]) => k !== '_extras' && v).map(([k, v]) => `${k}: ${v}`);
    const pcExtras = (pc._extras || []).filter(e => e.label && e.value).map(e => `${e.label}: ${e.value}`);
    const allPc = [...pcItems, ...pcExtras];
    if (allPc.length) parts.push(`Preferred Clothing: ${allPc.join(', ')}`);
  }

  // Background
  const bg = character.background;
  if (bg) {
    const bgItems = Object.entries(bg).filter(([k, v]) => k !== '_extras' && v).map(([k, v]) => `${k}: ${v}`);
    const bgExtras = (bg._extras || []).filter(e => e.label && e.value).map(e => `${e.label}: ${e.value}`);
    const allBg = [...bgItems, ...bgExtras];
    if (allBg.length) parts.push(`Background: ${allBg.join(', ')}`);
  }

  // Personality
  const pers = character.personality;
  if (pers) {
    const traits = (pers.splitMode
      ? [
          ...(pers.outwardTraits || []).filter(t => t.value).map(t => `(outward) ${t.label}: ${t.value}`),
          ...(pers.inwardTraits || []).filter(t => t.value).map(t => `(inward) ${t.label}: ${t.value}`)
        ]
      : (pers.traits || []).filter(t => t.value).map(t => `${t.label}: ${t.value}`)
    );
    if (traits.length) parts.push(`Personality: ${traits.join('; ')}`);
  }

  // Extras-only sections
  const extrasSections = [
    { key: 'tone', label: 'Tone' },
    { key: 'keyLifeEvents', label: 'Key Life Events' },
    { key: 'relationships', label: 'Relationships' },
    { key: 'secrets', label: 'Secrets' },
    { key: 'fears', label: 'Fears' },
  ] as const;
  for (const { key, label } of extrasSections) {
    const sec = character[key];
    const filled = sec?._extras?.filter(e => e.label && e.value);
    if (filled?.length) {
      parts.push(`${label}: ${filled.map(e => `${e.label}: ${e.value}`).join('; ')}`);
    }
  }

  // Goals
  if (character.goals?.length) {
    const goalLines = character.goals.map(g => `${g.title}${g.desiredOutcome ? ` → ${g.desiredOutcome}` : ''}`);
    parts.push(`Goals: ${goalLines.join('; ')}`);
  }

  // Custom sections
  for (const sec of character.sections) {
    const filled = sec.items.filter(i => i.label && i.value);
    if (filled.length) {
      parts.push(`${sec.title}: ${filled.map(i => `${i.label}: ${i.value}`).join('; ')}`);
    }
  }

  return parts.join('\n');
}

// ============================================================
// Per-Field AI Enhancement (Structured Expansion)
// ============================================================

// Field-specific prompts that enforce structured expansion
const CHARACTER_FIELD_PROMPTS: Record<string, { label: string; instruction: string; maxSentences: number }> = {
  // Physical Appearance
  hairColor: { label: "Hair Color", instruction: "Describe hair color, style, and length concisely. Format: Color + Style + Notable features.", maxSentences: 2 },
  eyeColor: { label: "Eye Color", instruction: "Describe eye color and any notable characteristics. Format: Color + Quality/Expression.", maxSentences: 1 },
  build: { label: "Build", instruction: "Describe body type and physique. Format: Type + Defining features.", maxSentences: 2 },
  bodyHair: { label: "Body Hair", instruction: "Describe body hair amount and pattern. Format: Amount + Location/Pattern.", maxSentences: 1 },
  height: { label: "Height", instruction: "Provide height (with measurement) and how they carry themselves.", maxSentences: 1 },
  breastSize: { label: "Breast Size", instruction: "Describe size and relevant details if applicable.", maxSentences: 1 },
  genitalia: { label: "Genitalia", instruction: "Describe relevant anatomical details if applicable.", maxSentences: 1 },
  skinTone: { label: "Skin Tone", instruction: "Describe skin tone and any notable texture or qualities.", maxSentences: 1 },
  makeup: { label: "Makeup", instruction: "Describe makeup style, colors, and intensity.", maxSentences: 2 },
  bodyMarkings: { label: "Body Markings", instruction: "Describe type, location, and significance of any markings (scars, tattoos, birthmarks).", maxSentences: 2 },
  temporaryConditions: { label: "Temporary Conditions", instruction: "Describe any temporary physical conditions (injuries, illness, etc.) and their visibility.", maxSentences: 2 },
  
  // Currently Wearing
  top: { label: "Shirt/Top", instruction: "Describe the top/shirt being worn. Include garment type, color, fit, and style.", maxSentences: 2 },
  bottom: { label: "Pants/Bottoms", instruction: "Describe pants/skirt/shorts being worn. Include garment type, color, fit, and style.", maxSentences: 2 },
  undergarments: { label: "Undergarments", instruction: "Describe undergarments being worn. Include type, color, and style.", maxSentences: 2 },
  miscellaneous: { label: "Miscellaneous", instruction: "Describe additional items (outerwear, footwear, accessories). List each item briefly.", maxSentences: 3 },
  
  // Preferred Clothing
  casual: { label: "Casual", instruction: "Describe preferred casual clothing style. Include typical pieces and aesthetic.", maxSentences: 2 },
  work: { label: "Work", instruction: "Describe preferred work/professional attire. Include typical pieces and aesthetic.", maxSentences: 2 },
  sleep: { label: "Sleep", instruction: "Describe preferred sleepwear. Include style and comfort preferences.", maxSentences: 2 },
  
  // Background
  jobOccupation: { label: "Job / Occupation", instruction: "Describe current job, career, or primary occupation. Include role and workplace if relevant.", maxSentences: 2 },
  educationLevel: { label: "Education Level", instruction: "Describe highest education achieved and any notable institutions or fields of study.", maxSentences: 2 },
  residence: { label: "Residence", instruction: "Describe where the character lives. Include type of dwelling, neighborhood, and living situation.", maxSentences: 2 },
  hobbies: { label: "Hobbies", instruction: "List primary hobbies and leisure activities. Focus on what they enjoy most.", maxSentences: 2 },
  financialStatus: { label: "Financial Status", instruction: "Describe financial standing — wealthy, comfortable, struggling, etc. Include context.", maxSentences: 2 },
  motivation: { label: "Motivation", instruction: "Describe the character's core driving motivation. What keeps them going?", maxSentences: 2 },
  
  // Custom fields (fallback)
  custom: { label: "Custom", instruction: "Provide relevant details for this character trait. Be concise and story-relevant.", maxSentences: 3 }
};

/**
 * Build a structured expansion prompt for character field enhancement
 */
function buildCharacterFieldPrompt(
  fieldName: string,
  currentValue: string,
  fullContext: string,
  selfContext: string,
  customLabel?: string
): string {
  const fieldConfig = CHARACTER_FIELD_PROMPTS[fieldName] || CHARACTER_FIELD_PROMPTS.custom;
  const label = customLabel || fieldConfig.label;

  const currentValueSection = currentValue.trim()
    ? `CURRENT VALUE (enhance while preserving intent):\n${currentValue}\n\n`
    : 'CURRENT VALUE: Empty - generate appropriate content based on context.\n\n';

  return `You are enhancing a character field for an interactive roleplay. Use STRUCTURED EXPANSION:

RULES:
1. Be concise and factual (max ${fieldConfig.maxSentences} sentences)
2. Focus on narrative-relevant details - what matters for the story
3. NO purple prose or flowery language
4. Format: State the fact, then its implication if relevant
5. ${currentValue.trim() ? 'Preserve the existing content\'s intent while enhancing it' : 'Generate appropriate content from available context'}
6. Stay consistent with all existing character data and world context below

WORLD & SCENARIO CONTEXT:
${fullContext}

THIS CHARACTER'S EXISTING DATA:
${selfContext || 'No data filled yet.'}

${currentValueSection}FIELD: ${label}
INSTRUCTION: ${fieldConfig.instruction}

Return ONLY the enhanced text. No explanations, no prefixes, no markdown formatting.`;
}

// ============================================================
// Shared AI call with content-filter fallback
// ============================================================

// GROK ONLY -- All AI calls use xAI Grok. No Gemini. No OpenAI.
const FALLBACK_MODELS = ['grok-3-mini', 'grok-2'];

async function callAIWithFallback(
  messages: { role: string; content: string }[],
  modelId: string,
  stream: boolean = false
): Promise<string> {
  const modelsToTry = [modelId, ...FALLBACK_MODELS.filter(m => m !== modelId)];

  for (const model of modelsToTry) {
    const { data, error } = await supabase.functions.invoke('chat', {
      body: { messages, modelId: model, stream }
    });

    if (error) {
      console.error(`[character-ai] Error with model ${model}:`, error);
      continue;
    }

    const finishReason = data?.choices?.[0]?.finish_reason;
    const content = data?.choices?.[0]?.message?.content;

    if (finishReason === 'content_filter' || !content) {
      console.warn(`[character-ai] Model ${model} blocked (${finishReason || 'empty content'}), trying fallback...`);
      continue;
    }

    if (model !== modelId) {
      console.log(`[character-ai] Fallback to ${model} succeeded`);
    }
    return content.trim().replace(/^["']|["']$/g, '');
  }

  throw new Error('Content was blocked by all available models. Try rephrasing the content or using a different model.');
}

/**
 * Enhance a single character field using AI
 */
export async function aiEnhanceCharacterField(
  fieldName: string,
  currentValue: string,
  character: Character,
  appData: ScenarioData,
  modelId: string,
  customLabel?: string
): Promise<string> {
  const fullContext = buildFullContext(appData, character.id);
  const selfContext = buildCharacterSelfContext(character);
  const prompt = buildCharacterFieldPrompt(fieldName, currentValue, fullContext, selfContext, customLabel);

  console.log(`[character-ai] Enhancing field: ${fieldName} with model: ${modelId}`);

  return callAIWithFallback(
    [
      { role: 'system', content: 'You are a concise character creation assistant. Return only the requested content, no explanations.' },
      { role: 'user', content: prompt }
    ],
    modelId
  );
}

// ============================================================
// Existing AI Fill / AI Generate Functions
// ============================================================

// Analyze story type from world context
function analyzeStoryType(worldCore: WorldCore) {
  const text = `${worldCore.briefDescription || ''} ${worldCore.storyPremise || ''} ${worldCore.toneThemes || ''} ${worldCore.plotHooks || ''}`.toLowerCase();
  
  return {
    isNSFW: /nsfw|adult|mature|erotic|sensual|intimate|sexual/.test(text),
    isFantasy: /fantasy|magic|d&d|dungeons|dragons|medieval|quest|wizard|sorcerer|elf|dwarf/.test(text),
    isMystery: /mystery|detective|thriller|crime|investigation|noir/.test(text),
    isSurvival: /survival|apocalypse|wilderness|zombie|post-apocalyptic/.test(text),
    isRomance: /romance|love|relationship|dating|passion/.test(text),
    isSciFi: /sci-fi|space|future|cyberpunk|technology|android|robot/.test(text),
    isAction: /action|combat|war|military|adventure|fight/.test(text),
  };
}

// Get empty fields from hardcoded sections
function getEmptyHardcodedFields(character: Character) {
  const emptyFields: Record<string, string[]> = {
    basics: [],
    physicalAppearance: [],
    currentlyWearing: [],
    preferredClothing: [],
  };

  // Check basic fields
  if (!character.name || character.name === "New Character") emptyFields.basics.push("name");
  if (!character.age) emptyFields.basics.push("age");
  if (!character.sexType) emptyFields.basics.push("sexType");
  if (!character.sexualOrientation) emptyFields.basics.push("sexualOrientation");
  if (!character.roleDescription) emptyFields.basics.push("roleDescription");
  if (!character.location) emptyFields.basics.push("location");
  if (!character.currentMood) emptyFields.basics.push("currentMood");

  // Check physical appearance
  const pa = character.physicalAppearance;
  if (!pa?.hairColor) emptyFields.physicalAppearance.push("hairColor");
  if (!pa?.eyeColor) emptyFields.physicalAppearance.push("eyeColor");
  if (!pa?.build) emptyFields.physicalAppearance.push("build");
  if (!pa?.bodyHair) emptyFields.physicalAppearance.push("bodyHair");
  if (!pa?.height) emptyFields.physicalAppearance.push("height");
  if (!pa?.breastSize) emptyFields.physicalAppearance.push("breastSize");
  if (!pa?.genitalia) emptyFields.physicalAppearance.push("genitalia");
  if (!pa?.skinTone) emptyFields.physicalAppearance.push("skinTone");
  if (!pa?.makeup) emptyFields.physicalAppearance.push("makeup");
  if (!pa?.bodyMarkings) emptyFields.physicalAppearance.push("bodyMarkings");
  if (!pa?.temporaryConditions) emptyFields.physicalAppearance.push("temporaryConditions");

  // Check currently wearing
  const cw = character.currentlyWearing;
  if (!cw?.top) emptyFields.currentlyWearing.push("top");
  if (!cw?.bottom) emptyFields.currentlyWearing.push("bottom");
  if (!cw?.undergarments) emptyFields.currentlyWearing.push("undergarments");
  if (!cw?.miscellaneous) emptyFields.currentlyWearing.push("miscellaneous");

  // Check preferred clothing
  const pc = character.preferredClothing;
  if (!pc?.casual) emptyFields.preferredClothing.push("casual");
  if (!pc?.work) emptyFields.preferredClothing.push("work");
  if (!pc?.sleep) emptyFields.preferredClothing.push("sleep");
  if (!pc?.undergarments) emptyFields.preferredClothing.push("undergarments");
  if (!pc?.miscellaneous) emptyFields.preferredClothing.push("miscellaneous");

  // Check background
  emptyFields.background = [];
  const bg = character.background;
  if (!bg?.jobOccupation) emptyFields.background.push("jobOccupation");
  if (!bg?.educationLevel) emptyFields.background.push("educationLevel");
  if (!bg?.residence) emptyFields.background.push("residence");
  if (!bg?.hobbies) emptyFields.background.push("hobbies");
  if (!bg?.financialStatus) emptyFields.background.push("financialStatus");
  if (!bg?.motivation) emptyFields.background.push("motivation");
  // Check background _extras for empty values
  if (bg?._extras?.length) {
    for (const extra of bg._extras) {
      if (extra.label && !extra.value) emptyFields.background.push(`_extras.${extra.id}`);
    }
  }

  // Check personality traits for empty values (include label for AI context)
  emptyFields.personality = [];
  const pers = character.personality;
  if (pers) {
    if (pers.splitMode) {
      for (const t of (pers.outwardTraits || [])) {
        if (t.label && !t.value) emptyFields.personality.push(`outward.${t.id}:${t.label}`);
      }
      for (const t of (pers.inwardTraits || [])) {
        if (t.label && !t.value) emptyFields.personality.push(`inward.${t.id}:${t.label}`);
      }
    } else {
      for (const t of (pers.traits || [])) {
        if (t.label && !t.value) emptyFields.personality.push(`trait.${t.id}:${t.label}`);
      }
    }
  }

  // Check _extras-only sections for empty values (include label for AI context)
  const extrasOnlySections = ['tone', 'keyLifeEvents', 'relationships', 'secrets', 'fears'] as const;
  for (const sectionKey of extrasOnlySections) {
    emptyFields[sectionKey] = [];
    const section = character[sectionKey];
    if (section?._extras?.length) {
      for (const extra of section._extras) {
        if (extra.label && !extra.value) {
          // Has label but no value - AI needs to fill the value
          emptyFields[sectionKey].push(`_extras.${extra.id}:${extra.label}`);
        } else if (!extra.label && !extra.value) {
          // Both empty - AI needs to generate both label and value
          emptyFields[sectionKey].push(`_extras.${extra.id}:__empty__`);
        }
      }
    }
  }

  return emptyFields;
}

// Get empty items in custom sections
function getEmptyCustomSectionItems(character: Character) {
  const emptyItems: { sectionId: string; sectionTitle: string; itemId: string; label: string }[] = [];
  
  for (const section of character.sections) {
    for (const item of section.items) {
      if (item.label && !item.value) {
        emptyItems.push({
          sectionId: section.id,
          sectionTitle: section.title,
          itemId: item.id,
          label: item.label
        });
      }
    }
  }
  
  return emptyItems;
}

// Build prompt for AI Fill (empty fields only)
function buildAiFillPrompt(
  character: Character, 
  emptyFields: Record<string, string[]>, 
  emptyCustomItems: ReturnType<typeof getEmptyCustomSectionItems>, 
  worldContext: string,
  userPrompt?: string,
  useExistingDetails: boolean = true
) {
  // Helper to format enriched field descriptors for the prompt
  const formatEnrichedFields = (fields: string[], sectionName: string): string | null => {
    if (!fields.length) return null;
    const formatted = fields.map(f => {
      const colonIdx = f.indexOf(':');
      if (colonIdx === -1) return f; // plain field like "jobOccupation"
      const id = f.substring(0, colonIdx);
      const label = f.substring(colonIdx + 1);
      if (label === '__empty__') return `${id} (GENERATE BOTH LABEL AND VALUE)`;
      return `"${label}" (${id})`;
    }).join(', ');
    return `${sectionName}: ${formatted}`;
  };

  const fieldsToFill: string[] = [];
  
  if (emptyFields.basics.length > 0) {
    fieldsToFill.push(`Basics: ${emptyFields.basics.join(", ")}`);
  }
  if (emptyFields.physicalAppearance.length > 0) {
    fieldsToFill.push(`Physical Appearance: ${emptyFields.physicalAppearance.join(", ")}`);
  }
  if (emptyFields.currentlyWearing.length > 0) {
    fieldsToFill.push(`Currently Wearing: ${emptyFields.currentlyWearing.join(", ")}`);
  }
  if (emptyFields.preferredClothing.length > 0) {
    fieldsToFill.push(`Preferred Clothing: ${emptyFields.preferredClothing.join(", ")}`);
  }
  if (emptyFields.background?.length > 0) {
    fieldsToFill.push(`Background: ${emptyFields.background.join(", ")}`);
  }
  const personalityLine = formatEnrichedFields(emptyFields.personality || [], 'Personality Traits');
  if (personalityLine) fieldsToFill.push(personalityLine);
  const toneLine = formatEnrichedFields(emptyFields.tone || [], 'Tone');
  if (toneLine) fieldsToFill.push(toneLine);
  const kleLine = formatEnrichedFields(emptyFields.keyLifeEvents || [], 'Key Life Events');
  if (kleLine) fieldsToFill.push(kleLine);
  const relLine = formatEnrichedFields(emptyFields.relationships || [], 'Relationships');
  if (relLine) fieldsToFill.push(relLine);
  const secLine = formatEnrichedFields(emptyFields.secrets || [], 'Secrets');
  if (secLine) fieldsToFill.push(secLine);
  const fearLine = formatEnrichedFields(emptyFields.fears || [], 'Fears');
  if (fearLine) fieldsToFill.push(fearLine);
  if (emptyCustomItems.length > 0) {
    const customLabels = emptyCustomItems.map(i => `${i.sectionTitle}/${i.label}`).join(", ");
    fieldsToFill.push(`Custom Fields: ${customLabels}`);
  }

  // Add user prompt section if provided
  const userPromptSection = userPrompt?.trim() 
    ? `\nUSER GUIDANCE:\n${userPrompt.trim()}\n\nPay special attention to this guidance when creating the character.\n`
    : '';

  // Adjust context emphasis based on useExistingDetails
  const contextEmphasis = useExistingDetails
    ? 'EXISTING CHARACTER INFO (maintain strong consistency with these details):'
    : 'EXISTING CHARACTER INFO (use as light reference, prioritize user guidance):';

  const selfContext = buildCharacterSelfContext(character);

  return `You are filling in empty character fields for "${character.name || 'a character'}".
${userPromptSection}
WORLD & SCENARIO CONTEXT:
${worldContext}

${contextEmphasis}
${selfContext || 'No details filled yet.'}

FIELDS THAT NEED TO BE FILLED:
${fieldsToFill.join("\n")}

IMPORTANT: Only fill EMPTY fields. Do NOT modify or overwrite any field that already has content.

Return a JSON object with ONLY the empty fields filled in. Use the exact field names.
For physical attributes, provide realistic, detailed descriptions.
For clothing, describe specific items and styles.

Example format:
{
  "basics": { "age": "28", "sexType": "Female Human" },
  "physicalAppearance": { "hairColor": "Auburn waves falling to mid-back", "eyeColor": "Emerald green" },
  "currentlyWearing": { "top": "Fitted black turtleneck" },
  "preferredClothing": { "casual": "Comfortable jeans and soft sweaters" },
  "background": { "jobOccupation": "Freelance photographer", "residence": "Small apartment in the arts district" },
  "personality": { "outwardTraits": [{ "id": "trait_id_here", "value": "Warm and approachable" }], "inwardTraits": [{ "id": "trait_id_here", "value": "Deeply insecure" }], "traits": [{ "id": "trait_id_here", "value": "Curious and adventurous" }] },
  "tone": { "_extras": [{ "id": "extra_id_here", "value": "Formal and measured when speaking to authority" }] },
  "keyLifeEvents": { "_extras": [{ "id": "extra_id_here", "value": "Lost childhood home in a fire at age 12" }] },
  "relationships": { "_extras": [{ "id": "extra_id_here", "value": "Estranged from older brother since college" }] },
  "secrets": { "_extras": [{ "id": "extra_id_here", "value": "Secretly writes poetry under a pseudonym" }] },
  "fears": { "_extras": [{ "id": "extra_id_here", "value": "Terrified of deep water since a childhood incident" }] },
  "customFields": { "Biography": "Born in a small coastal town..." }
}

For personality traits, use the exact trait IDs from the fields list above and provide only the value text.
For _extras sections (tone, keyLifeEvents, relationships, secrets, fears), use the exact extra IDs from the fields list above and provide only the value text.
For entries marked "GENERATE BOTH LABEL AND VALUE", return objects with BOTH "id", "label", and "value" keys. The label should be a short descriptor (2-4 words) and the value should be the detailed description.

ONLY include fields that were listed above as needing to be filled. Return valid JSON only.`;
}

// Build prompt for AI Generate (fill + create sections)
function buildAiGeneratePrompt(
  character: Character, 
  emptyFields: Record<string, string[]>, 
  emptyCustomItems: ReturnType<typeof getEmptyCustomSectionItems>,
  existingSectionTitles: string[],
  storyContext: ReturnType<typeof analyzeStoryType>,
  worldContext: string,
  userPrompt?: string,
  useExistingDetails: boolean = true
) {
  const sectionsToCreate: string[] = [];
  
  // Standard sections to recommend
  // Only suggest sections that are NOT hardcoded (Background, Personality, Tone, Fears are now built-in)
  const standardSections: { title: string; items: string[] }[] = [];

  // Conditional sections based on story type
  if (storyContext.isNSFW) {
    standardSections.push({ title: "Kinks & Fantasies", items: ["Preferences", "Turn-ons", "Boundaries"] });
  }
  if (storyContext.isFantasy || storyContext.isSurvival || storyContext.isAction) {
    standardSections.push({ title: "Abilities & Skills", items: ["Primary Skill", "Secondary Skills", "Special Abilities"] });
  }
  if (storyContext.isMystery) {
    standardSections.push({ title: "Secrets & Connections", items: ["Hidden Agenda", "Key Contacts", "Dark Past"] });
  }
  if (storyContext.isSciFi) {
    standardSections.push({ title: "Tech & Augments", items: ["Equipment", "Cybernetics", "Specializations"] });
  }

  // Filter out existing sections
  for (const sec of standardSections) {
    const exists = existingSectionTitles.some(title => 
      title.toLowerCase().includes(sec.title.toLowerCase()) || 
      sec.title.toLowerCase().includes(title.toLowerCase())
    );
    if (!exists) {
      sectionsToCreate.push(`${sec.title}: ${sec.items.join(", ")}`);
    }
  }

  // Add user prompt section if provided
  const userPromptSection = userPrompt?.trim() 
    ? `\nUSER GUIDANCE:\n${userPrompt.trim()}\n\nPay special attention to this guidance when creating the character.\n`
    : '';

  // Adjust context emphasis based on useExistingDetails
  const contextEmphasis = useExistingDetails
    ? 'EXISTING CHARACTER INFO (maintain strong consistency with these details):'
    : 'EXISTING CHARACTER INFO (use as light reference, prioritize user guidance):';

  // Helper to format enriched field descriptors for the prompt
  const formatEnrichedFields = (fields: string[], sectionName: string): string | null => {
    if (!fields.length) return null;
    const formatted = fields.map(f => {
      const colonIdx = f.indexOf(':');
      if (colonIdx === -1) return f;
      const id = f.substring(0, colonIdx);
      const label = f.substring(colonIdx + 1);
      if (label === '__empty__') return `${id} (GENERATE BOTH LABEL AND VALUE)`;
      return `"${label}" (${id})`;
    }).join(', ');
    return `${sectionName}: ${formatted}`;
  };

  // List empty fields that need to be filled
  const emptyFieldsList: string[] = [];
  if (emptyFields.basics.length > 0) {
    emptyFieldsList.push(`Basics: ${emptyFields.basics.join(", ")}`);
  }
  if (emptyFields.physicalAppearance.length > 0) {
    emptyFieldsList.push(`Physical Appearance: ${emptyFields.physicalAppearance.join(", ")}`);
  }
  if (emptyFields.currentlyWearing.length > 0) {
    emptyFieldsList.push(`Currently Wearing: ${emptyFields.currentlyWearing.join(", ")}`);
  }
  if (emptyFields.preferredClothing.length > 0) {
    emptyFieldsList.push(`Preferred Clothing: ${emptyFields.preferredClothing.join(", ")}`);
  }
  if (emptyFields.background?.length > 0) {
    emptyFieldsList.push(`Background: ${emptyFields.background.join(", ")}`);
  }
  const personalityLine = formatEnrichedFields(emptyFields.personality || [], 'Personality Traits');
  if (personalityLine) emptyFieldsList.push(personalityLine);
  const toneLine = formatEnrichedFields(emptyFields.tone || [], 'Tone');
  if (toneLine) emptyFieldsList.push(toneLine);
  const kleLine = formatEnrichedFields(emptyFields.keyLifeEvents || [], 'Key Life Events');
  if (kleLine) emptyFieldsList.push(kleLine);
  const relLine = formatEnrichedFields(emptyFields.relationships || [], 'Relationships');
  if (relLine) emptyFieldsList.push(relLine);
  const secLine = formatEnrichedFields(emptyFields.secrets || [], 'Secrets');
  if (secLine) emptyFieldsList.push(secLine);
  const fearLine = formatEnrichedFields(emptyFields.fears || [], 'Fears');
  if (fearLine) emptyFieldsList.push(fearLine);
  if (emptyCustomItems.length > 0) {
    const customLabels = emptyCustomItems.map(i => `${i.sectionTitle}/${i.label}`).join(", ");
    emptyFieldsList.push(`Custom Fields: ${customLabels}`);
  }

  const selfContext = buildCharacterSelfContext(character);

  return `You are creating a complete, well-rounded character profile for "${character.name || 'a character'}".
${userPromptSection}
WORLD & SCENARIO CONTEXT:
${worldContext}

STORY THEMES DETECTED:
${storyContext.isNSFW ? "- Adult/Mature content" : ""}
${storyContext.isFantasy ? "- Fantasy/Magic setting" : ""}
${storyContext.isMystery ? "- Mystery/Investigation themes" : ""}
${storyContext.isSurvival ? "- Survival/Apocalyptic setting" : ""}
${storyContext.isRomance ? "- Romance elements" : ""}
${storyContext.isSciFi ? "- Sci-Fi/Futuristic setting" : ""}
${storyContext.isAction ? "- Action/Combat focus" : ""}

${contextEmphasis}
${selfContext || 'No details filled yet.'}

EMPTY FIELDS TO FILL:
${emptyFieldsList.length > 0 ? emptyFieldsList.join("\n") : "None"}

EXISTING SECTIONS (add to these if relevant, don't duplicate):
${existingSectionTitles.length > 0 ? existingSectionTitles.join(", ") : "None"}

SECTIONS TO CREATE (create only if not already existing):
${sectionsToCreate.join("\n")}

IMPORTANT: Only fill EMPTY fields. Do NOT modify or overwrite any field that already has content.

Return a JSON object with:
1. "emptyFieldsFill" - Values for any empty hardcoded fields (ONLY empty ones)
2. "newSections" - Array of new sections to create with their items filled in
3. "existingSectionAdditions" - Object mapping existing section titles to new items to add
4. "customFieldsFill" - Values for empty items in existing custom sections

Example format:
{
  "emptyFieldsFill": {
    "basics": { "age": "28" },
    "physicalAppearance": { "hairColor": "Auburn" }
  },
  "newSections": [
    {
      "title": "Personality",
      "items": [
        { "label": "Primary Trait", "value": "Stubborn but loyal" },
        { "label": "Secondary Trait", "value": "Quick-witted" }
      ]
    }
  ],
  "existingSectionAdditions": {
    "Background": [
      { "label": "Childhood", "value": "Raised in a merchant family" }
    ]
  },
  "customFieldsFill": { "Biography": "Born in a small coastal town..." }
}

Make all content cohesive, detailed, and appropriate for the detected story themes.
Return valid JSON only.`;
}
// ── Robust JSON extraction ──────────────────────────────────────────
function extractJsonFromResponse(raw: string): any | null {
  if (!raw || !raw.trim()) {
    console.warn('[ai-fill] Empty response from LLM');
    return null;
  }

  // 1. Strip markdown code fences
  let cleaned = raw.replace(/```(?:json)?\s*/gi, '').replace(/```\s*/g, '');

  // 2. Try direct parse
  try { return JSON.parse(cleaned); } catch (_) { /* continue */ }

  // 3. Regex extract + cleanup
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    let candidate = jsonMatch[0]
      .replace(/,\s*([}\]])/g, '$1')           // trailing commas
      .replace(/[\x00-\x1F\x7F]/g, ' ');       // control chars
    try { return JSON.parse(candidate); } catch (_) { /* continue */ }
  }

  // 4. Manual balanced-brace extraction
  const start = raw.indexOf('{');
  if (start !== -1) {
    let depth = 0;
    let end = -1;
    for (let i = start; i < raw.length; i++) {
      if (raw[i] === '{') depth++;
      else if (raw[i] === '}') { depth--; if (depth === 0) { end = i; break; } }
    }
    if (end !== -1) {
      let slice = raw.substring(start, end + 1)
        .replace(/,\s*([}\]])/g, '$1')
        .replace(/[\x00-\x1F\x7F]/g, ' ');
      try { return JSON.parse(slice); } catch (_) { /* continue */ }
    }
  }

  console.error('[ai-fill] All JSON extraction strategies failed. Raw response (first 500 chars):', raw.substring(0, 500));
  return null;
}

/** Check a value is a usable non-empty string */
function isNonEmpty(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

// AI Fill: Fill only empty existing fields
export async function aiFillCharacter(
  character: Character,
  appData: ScenarioData,
  modelId: string,
  userPrompt?: string,
  useExistingDetails: boolean = true
): Promise<Partial<Character>> {
  const emptyFields = getEmptyHardcodedFields(character);
  const emptyCustomItems = getEmptyCustomSectionItems(character);
  
  // Check if there's anything to fill
  const totalEmpty = 
    emptyFields.basics.length + 
    emptyFields.physicalAppearance.length + 
    emptyFields.currentlyWearing.length + 
    emptyFields.preferredClothing.length +
    (emptyFields.background?.length || 0) +
    (emptyFields.personality?.length || 0) +
    (emptyFields.tone?.length || 0) +
    (emptyFields.keyLifeEvents?.length || 0) +
    (emptyFields.relationships?.length || 0) +
    (emptyFields.secrets?.length || 0) +
    (emptyFields.fears?.length || 0) +
    emptyCustomItems.length;
  
  console.log(`[ai-fill] ${totalEmpty} empty fields detected across all sections`);

  if (totalEmpty === 0) {
    return {}; // Nothing to fill
  }

  const worldContext = buildFullContext(appData, character.id);
  const selfContext = buildCharacterSelfContext(character);

  const prompt = buildAiFillPrompt(character, emptyFields, emptyCustomItems, worldContext, userPrompt, useExistingDetails);

  try {
    const content = await callAIWithFallback(
      [
        { role: 'system', content: 'You are a character creation assistant. Return only valid JSON.' },
        { role: 'user', content: prompt }
      ],
      modelId
    );
    console.log(`[ai-fill] LLM response length: ${content.length}, first 200 chars:`, content.substring(0, 200));

    const result = extractJsonFromResponse(content);
    if (!result) {
      console.error('[ai-fill] Could not extract JSON from LLM response');
      return {};
    }

    const patch: Partial<Character> = {};
    let fieldsApplied = 0;

    // Apply basics
    if (result.basics) {
      if (isNonEmpty(result.basics.name) && emptyFields.basics.includes("name")) { patch.name = result.basics.name; fieldsApplied++; }
      if (isNonEmpty(result.basics.age) && emptyFields.basics.includes("age")) { patch.age = result.basics.age; fieldsApplied++; }
      if (isNonEmpty(result.basics.sexType) && emptyFields.basics.includes("sexType")) { patch.sexType = result.basics.sexType; fieldsApplied++; }
      if (isNonEmpty(result.basics.roleDescription) && emptyFields.basics.includes("roleDescription")) { patch.roleDescription = result.basics.roleDescription; fieldsApplied++; }
      if (isNonEmpty(result.basics.location) && emptyFields.basics.includes("location")) { patch.location = result.basics.location; fieldsApplied++; }
      if (isNonEmpty(result.basics.currentMood) && emptyFields.basics.includes("currentMood")) { patch.currentMood = result.basics.currentMood; fieldsApplied++; }
    }

    // Apply physical appearance (only empty fields)
    if (result.physicalAppearance) {
      patch.physicalAppearance = { ...character.physicalAppearance };
      for (const [key, value] of Object.entries(result.physicalAppearance)) {
        if (emptyFields.physicalAppearance.includes(key) && isNonEmpty(value)) {
          (patch.physicalAppearance as any)[key] = value;
          fieldsApplied++;
        }
      }
    }

    // Apply currently wearing (only empty fields)
    if (result.currentlyWearing) {
      patch.currentlyWearing = { ...character.currentlyWearing };
      for (const [key, value] of Object.entries(result.currentlyWearing)) {
        if (emptyFields.currentlyWearing.includes(key) && isNonEmpty(value)) {
          (patch.currentlyWearing as any)[key] = value;
          fieldsApplied++;
        }
      }
    }

    // Apply preferred clothing (only empty fields)
    if (result.preferredClothing) {
      patch.preferredClothing = { ...character.preferredClothing };
      for (const [key, value] of Object.entries(result.preferredClothing)) {
        if (emptyFields.preferredClothing.includes(key) && isNonEmpty(value)) {
          (patch.preferredClothing as any)[key] = value;
          fieldsApplied++;
        }
      }
    }

    // Apply background fields (only empty fields)
    if (result.background && emptyFields.background?.length) {
      patch.background = { ...(character.background || { jobOccupation: '', educationLevel: '', residence: '', hobbies: '', financialStatus: '', motivation: '' }) };
      for (const [key, value] of Object.entries(result.background)) {
        if (key === '_extras') continue;
        if (emptyFields.background.includes(key) && isNonEmpty(value)) {
          (patch.background as any)[key] = value;
          fieldsApplied++;
        }
      }
    }

    // Apply personality trait values (only empty traits)
    if (result.personality && emptyFields.personality?.length) {
      const pers = character.personality;
      if (pers) {
        const updatedPersonality = JSON.parse(JSON.stringify(pers));
        const applyTraitValues = (traits: any[], resultTraits: any[]) => {
          if (!resultTraits?.length) return;
          for (const rt of resultTraits) {
            if (!rt.id || !isNonEmpty(rt.value)) continue;
            const trait = traits.find((t: any) => t.id === rt.id);
            if (trait && !trait.value) {
              trait.value = rt.value;
              fieldsApplied++;
            }
          }
        };
        if (pers.splitMode) {
          applyTraitValues(updatedPersonality.outwardTraits || [], result.personality.outwardTraits || []);
          applyTraitValues(updatedPersonality.inwardTraits || [], result.personality.inwardTraits || []);
        } else {
          applyTraitValues(updatedPersonality.traits || [], result.personality.traits || []);
        }
        patch.personality = updatedPersonality;
      }
    }

    // Apply _extras values for tone/keyLifeEvents/relationships/secrets/fears
    const extrasKeys = ['tone', 'keyLifeEvents', 'relationships', 'secrets', 'fears'] as const;
    for (const key of extrasKeys) {
      if (result[key]?._extras?.length && emptyFields[key]?.length) {
        const section = character[key] || {};
        const existingExtras = [...(section._extras || [])];
        for (const re of result[key]._extras) {
          if (!re.id || !isNonEmpty(re.value)) continue;
          const idx = existingExtras.findIndex((e: any) => e.id === re.id);
          if (idx !== -1) {
            const update: any = { ...existingExtras[idx], value: re.value };
            if (!existingExtras[idx].label && isNonEmpty(re.label)) {
              update.label = re.label;
            }
            existingExtras[idx] = update;
            fieldsApplied++;
          }
        }
        (patch as any)[key] = { ...section, _extras: existingExtras };
      }
    }

    // Apply custom field values (only empty items)
    if (result.customFields && emptyCustomItems.length > 0) {
      patch.sections = character.sections.map(section => {
        const updatedItems = section.items.map(item => {
          const emptyItem = emptyCustomItems.find(ei => ei.itemId === item.id);
          if (emptyItem && isNonEmpty(result.customFields[item.label])) {
            fieldsApplied++;
            return { ...item, value: result.customFields[item.label], updatedAt: now() };
          }
          return item;
        });
        return { ...section, items: updatedItems, updatedAt: now() };
      });
    }

    console.log(`[ai-fill] Done. ${fieldsApplied} fields applied out of ${totalEmpty} empty.`);
    return patch;
  } catch (e) {
    console.error("[ai-fill] AI Fill failed:", e);
    return {};
  }
}

// AI Generate: Fill empty fields + create new sections
export async function aiGenerateCharacter(
  character: Character,
  appData: ScenarioData,
  modelId: string,
  userPrompt?: string,
  useExistingDetails: boolean = true
): Promise<Partial<Character>> {
  const emptyFields = getEmptyHardcodedFields(character);
  const emptyCustomItems = getEmptyCustomSectionItems(character);
  const existingSectionTitles = character.sections.map(s => s.title);
  const storyContext = analyzeStoryType(appData.world.core);

  const worldContext = buildFullContext(appData, character.id);

  const prompt = buildAiGeneratePrompt(character, emptyFields, emptyCustomItems, existingSectionTitles, storyContext, worldContext, userPrompt, useExistingDetails);

  try {
    const content = await callAIWithFallback(
      [
        { role: 'system', content: 'You are a creative character design assistant. Return only valid JSON.' },
        { role: 'user', content: prompt }
      ],
      modelId
    );
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return {};

    const result = JSON.parse(jsonMatch[0]);
    const patch: Partial<Character> = {};

    // Apply empty fields fill (same as AI Fill)
    if (result.emptyFieldsFill) {
      const fill = result.emptyFieldsFill;
      
      if (fill.basics) {
        if (fill.basics.name && emptyFields.basics.includes("name")) patch.name = fill.basics.name;
        if (fill.basics.age && emptyFields.basics.includes("age")) patch.age = fill.basics.age;
        if (fill.basics.sexType && emptyFields.basics.includes("sexType")) patch.sexType = fill.basics.sexType;
        if (fill.basics.roleDescription && emptyFields.basics.includes("roleDescription")) patch.roleDescription = fill.basics.roleDescription;
        if (fill.basics.location && emptyFields.basics.includes("location")) patch.location = fill.basics.location;
        if (fill.basics.currentMood && emptyFields.basics.includes("currentMood")) patch.currentMood = fill.basics.currentMood;
      }

      if (fill.physicalAppearance) {
        patch.physicalAppearance = { ...character.physicalAppearance };
        for (const [key, value] of Object.entries(fill.physicalAppearance)) {
          if (emptyFields.physicalAppearance.includes(key) && value) {
            (patch.physicalAppearance as any)[key] = value;
          }
        }
      }

      if (fill.currentlyWearing) {
        patch.currentlyWearing = { ...character.currentlyWearing };
        for (const [key, value] of Object.entries(fill.currentlyWearing)) {
          if (emptyFields.currentlyWearing.includes(key) && value) {
            (patch.currentlyWearing as any)[key] = value;
          }
        }
      }

      if (fill.preferredClothing) {
        patch.preferredClothing = { ...character.preferredClothing };
        for (const [key, value] of Object.entries(fill.preferredClothing)) {
          if (emptyFields.preferredClothing.includes(key) && value) {
            (patch.preferredClothing as any)[key] = value;
          }
        }
      }

      // Apply background fields
      if (fill.background && emptyFields.background?.length) {
        patch.background = { ...(character.background || { jobOccupation: '', educationLevel: '', residence: '', hobbies: '', financialStatus: '', motivation: '' }) };
        for (const [key, value] of Object.entries(fill.background)) {
          if (key === '_extras') continue;
          if (emptyFields.background.includes(key) && value) {
            (patch.background as any)[key] = value;
          }
        }
      }

      // Apply personality trait values
      if (fill.personality && emptyFields.personality?.length) {
        const pers = character.personality;
        if (pers) {
          const updatedPersonality = JSON.parse(JSON.stringify(pers));
          const applyTraitValues = (traits: any[], resultTraits: any[]) => {
            if (!resultTraits?.length) return;
            for (const rt of resultTraits) {
              if (!rt.id || !rt.value) continue;
              const trait = traits.find((t: any) => t.id === rt.id);
              if (trait && !trait.value) trait.value = rt.value;
            }
          };
          if (pers.splitMode) {
            applyTraitValues(updatedPersonality.outwardTraits || [], fill.personality.outwardTraits || []);
            applyTraitValues(updatedPersonality.inwardTraits || [], fill.personality.inwardTraits || []);
          } else {
            applyTraitValues(updatedPersonality.traits || [], fill.personality.traits || []);
          }
          patch.personality = updatedPersonality;
        }
      }

      // Apply _extras for tone/keyLifeEvents/relationships/secrets/fears
      const extrasKeys = ['tone', 'keyLifeEvents', 'relationships', 'secrets', 'fears'] as const;
      for (const key of extrasKeys) {
        if (fill[key]?._extras?.length && emptyFields[key]?.length) {
          const section = character[key] || {};
          const existingExtras = [...(section._extras || [])];
          for (const re of fill[key]._extras) {
            if (!re.id || !re.value) continue;
            const idx = existingExtras.findIndex((e: any) => e.id === re.id);
            if (idx !== -1) {
              const update: any = { ...existingExtras[idx], value: re.value };
              if (!existingExtras[idx].label && re.label) {
                update.label = re.label;
              }
              existingExtras[idx] = update;
            }
          }
          (patch as any)[key] = { ...section, _extras: existingExtras };
        }
      }
    }

    // Start with existing sections
    let updatedSections = [...character.sections];

    // Add new items to existing sections
    if (result.existingSectionAdditions) {
      for (const [sectionTitle, newItems] of Object.entries(result.existingSectionAdditions)) {
        const sectionIndex = updatedSections.findIndex(s => 
          s.title.toLowerCase() === sectionTitle.toLowerCase()
        );
        if (sectionIndex >= 0 && Array.isArray(newItems)) {
          const existingLabels = updatedSections[sectionIndex].items.map(i => i.label.toLowerCase());
          const itemsToAdd = (newItems as any[])
            .filter(item => !existingLabels.includes(item.label?.toLowerCase()))
            .map(item => ({
              id: uid('item'),
              label: item.label || '',
              value: item.value || '',
              createdAt: now(),
              updatedAt: now()
            }));
          
          updatedSections[sectionIndex] = {
            ...updatedSections[sectionIndex],
            items: [...updatedSections[sectionIndex].items, ...itemsToAdd],
            updatedAt: now()
          };
        }
      }
    }

    // Create new sections
    if (result.newSections && Array.isArray(result.newSections)) {
      for (const newSection of result.newSections) {
        if (!newSection.title) continue;
        
        // Check if section already exists
        const exists = updatedSections.some(s => 
          s.title.toLowerCase() === newSection.title.toLowerCase()
        );
        if (exists) continue;

        const section: CharacterTraitSection = {
          id: uid('sec'),
          title: newSection.title,
          items: Array.isArray(newSection.items) 
            ? newSection.items.map((item: any) => ({
                id: uid('item'),
                label: item.label || '',
                value: item.value || '',
                createdAt: now(),
                updatedAt: now()
              }))
            : [],
          createdAt: now(),
          updatedAt: now()
        };
        updatedSections.push(section);
      }
    }

    patch.sections = updatedSections;
    return patch;
  } catch (e) {
    console.error("AI Generate parsing failed:", e);
    return {};
  }
}
