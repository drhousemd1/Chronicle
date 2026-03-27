
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
  const normalizeSectionItems = (section: any): Array<{ label: string; value: string }> => {
    const sectionTitle = (section?.title || '').trim();
    const rawItems = Array.isArray(section?.items) ? section.items : [];
    const normalized = rawItems
      .map((item: any) => ({
        label: (item?.label || '').trim(),
        value: (item?.value || '').trim()
      }))
      .filter((item: any) => item.label || item.value)
      .map((item: any) => ({
        label: item.label || (sectionTitle ? `${sectionTitle} Details` : 'Details'),
        value: item.value || item.label
      }));

    if (normalized.length > 0) return normalized;

    const freeform = (section?.freeformValue || '').trim();
    if (freeform) {
      return [{ label: sectionTitle ? `${sectionTitle} Notes` : 'Details', value: freeform }];
    }
    return [];
  };

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
      const filled = normalizeSectionItems(sec);
      if (filled.length) {
        parts.push(`${sec.title}:\n${filled.map(i => `  - ${i.label}: ${i.value}`).join('\n')}`);
      }
    }
  }

  if (core.storyGoals?.length) {
    const goalLines = core.storyGoals.map(g => {
      const outcome = g.desiredOutcome ? `: ${g.desiredOutcome}` : '';
      return `  - ${g.title}${outcome}`;
    }).join('\n');
    parts.push(`Story Goals:\n${goalLines}`);
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
  const normalizeSectionItems = (section: any): Array<{ label: string; value: string }> => {
    const sectionTitle = (section?.title || '').trim();
    const rawItems = Array.isArray(section?.items) ? section.items : [];
    const normalized = rawItems
      .map((item: any) => ({
        label: (item?.label || '').trim(),
        value: (item?.value || '').trim()
      }))
      .filter((item: any) => item.label || item.value)
      .map((item: any) => ({
        label: item.label || (sectionTitle ? `${sectionTitle} Details` : 'Details'),
        value: item.value || item.label
      }));

    if (normalized.length > 0) return normalized;

    const freeform = (section?.freeformValue || '').trim();
    if (freeform) {
      return [{ label: sectionTitle ? `${sectionTitle} Notes` : 'Details', value: freeform }];
    }
    return [];
  };

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
    const filled = normalizeSectionItems(sec);
    if (filled.length) {
      parts.push(`${sec.title}: ${filled.map(i => `${i.label}: ${i.value}`).join('; ')}`);
    }
  }

  return parts.join('\n');
}

// ============================================================
// Per-Field AI Enhancement (Structured Expansion)
// ============================================================

// "Generate both" mode: when label is empty, AI generates label + description
export const GENERATE_BOTH_PREFIX = '__GENERATE_BOTH__:';
const SPLIT_DELIMITER = '\n---SPLIT---\n';

export function parseGenerateBothResponse(response: string): { label: string; value: string } | null {
  if (!response.includes('---SPLIT---')) return null;
  const [label, ...rest] = response.split('---SPLIT---');
  return { label: label.trim(), value: rest.join('---SPLIT---').trim() };
}

// Field-specific prompts that enforce structured expansion
const CHARACTER_FIELD_PROMPTS: Record<string, { label: string; instruction: string; maxSentences: number }> = {
  // Physical Appearance
  hairColor: { label: "Hair Color", instruction: "Describe hair color, style, and length concisely. Format: Color + Style + Notable features.", maxSentences: 2 },
  eyeColor: { label: "Eye Color", instruction: "Describe eye color and any notable characteristics. Format: Color + Quality/Expression.", maxSentences: 1 },
  build: { label: "Build", instruction: "Describe body type and physique. Format: Type + Defining features.", maxSentences: 2 },
  bodyHair: { label: "Body Hair", instruction: "Describe body hair amount and pattern. Format: Amount + Location/Pattern.", maxSentences: 1 },
  height: { label: "Height", instruction: "Provide height (with measurement) and how they carry themselves.", maxSentences: 1 },
  breastSize: { label: "Breasts", instruction: "Describe size and relevant details if applicable.", maxSentences: 1 },
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
  
  // Tone / Voice
  tone: {
    label: "Tone",
    instruction: "Describe how this character speaks and expresses themselves. Focus on vocal qualities, speech rhythm, vocabulary level, verbal tics or habits, formality, and emotional register. This must naturally reflect the character's personality, background, and world context — not a random or generic speech style. If a specific tone label is provided (e.g. 'Nurturing', 'Sarcastic'), describe how THAT specific tone manifests in this character's speech, drawing on who they are and their established traits.",
    maxSentences: 3
  },

  // Personality
  personality: {
    label: "Personality Trait",
    instruction: "Describe this personality trait and how it manifests in the character's behavior, decisions, and interactions. Focus on behavioral patterns, emotional tendencies, and how this trait shapes who they are. Stay grounded in the character's background and world context. Do NOT describe speech patterns or vocal qualities — focus on personality and behavior.",
    maxSentences: 2
  },
  personality_outward: {
    label: "Outward Personality Trait",
    instruction: "Describe this OUTWARD personality trait — how the character presents themselves to others. Focus on projected behavior, social demeanor, dialogue style, body language, and the persona they show the world. This is what other characters would observe and experience. Do NOT describe internal feelings or hidden thoughts — focus on external presentation.",
    maxSentences: 2
  },
  personality_inward: {
    label: "Inward Personality Trait",
    instruction: "Describe this INWARD personality trait — the character's internal emotional landscape. Focus on private thoughts, hidden impulses, inner contradictions, suppressed feelings, and emotional patterns they don't show others. This is what the character experiences internally but may hide or struggle with. Do NOT describe outward behavior — focus on inner state.",
    maxSentences: 2
  },

  // Role Description
  roleDescription: {
    label: "Role Description",
    instruction: "Describe this character's role and function in the story. What is their narrative purpose? Are they a protagonist, antagonist, mentor, love interest, comic relief? How do they drive the plot or support other characters? Be specific to the scenario context.",
    maxSentences: 3
  },

  // Key Life Events
  keyLifeEvent: {
    label: "Key Life Event",
    instruction: "Describe a formative event from this character's past and how it shaped who they are today. Focus on what happened, the emotional impact, and lasting consequences on personality or relationships. Ground it in the character's established background and world context.",
    maxSentences: 3
  },

  // Relationships
  relationship: {
    label: "Relationship",
    instruction: "Describe this relationship dynamic — who the other person is, the nature of the bond (family, romantic, rival, mentor, etc.), current state of the relationship, and any tension or significance for the story. Reference other characters in the scenario when relevant.",
    maxSentences: 3
  },

  // Secrets
  secret: {
    label: "Secret",
    instruction: "Describe a hidden truth, concealed history, or private knowledge this character keeps from others. Explain what the secret is, why they hide it, and what would happen if it were revealed. Ground it in the character's background and relationships.",
    maxSentences: 3
  },

  // Fears
  fear: {
    label: "Fear",
    instruction: "Describe this fear — what triggers it, how it manifests in the character's behavior (avoidance, anxiety, overcompensation), and how it connects to their past or current situation. Be specific rather than generic.",
    maxSentences: 3
  },

  // Character Goals
  characterGoal: {
    label: "Character Goal",
    instruction: "Describe what this character wants to achieve, their underlying motivation for wanting it, and the obstacles or conflicts standing in their way. Connect the goal to the story premise and the character's personality.",
    maxSentences: 3
  },
  characterGoalOutcome: {
    label: "Character Goal Outcome",
    instruction: "Describe what successful completion of this character goal looks like. Include the desired end state, why it matters to the character, and what changes if they achieve it.",
    maxSentences: 3
  },
  characterGoalStep: {
    label: "Character Goal Step",
    instruction: "Write one concrete, actionable step that advances this character goal. Keep it specific, grounded in the story context, and realistic for this character.",
    maxSentences: 2
  },

  // Extra variants for section-specific extras
  physicalAppearanceExtra: {
    label: "Physical Detail",
    instruction: "Describe an additional physical characteristic or detail about this character's appearance. Be specific and visually descriptive. Complement existing physical traits without duplicating them.",
    maxSentences: 2
  },
  currentlyWearingExtra: {
    label: "Clothing Item",
    instruction: "Describe an additional clothing item or accessory the character is currently wearing. Include type, color, fit, and style.",
    maxSentences: 2
  },
  preferredClothingExtra: {
    label: "Preferred Outfit",
    instruction: "Describe an additional preferred clothing item or outfit for a specific occasion. Include style, aesthetic, and when they'd wear it.",
    maxSentences: 2
  },
  backgroundExtra: {
    label: "Background Detail",
    instruction: "Describe an additional background detail about this character — a life experience, cultural element, skill, or contextual fact that enriches their story. Ground it in existing character data.",
    maxSentences: 2
  },

  // Custom fields (fallback)
  custom: { label: "Custom", instruction: "Provide relevant details for this character trait. Be concise and story-relevant.", maxSentences: 3 }
};

function resolveCharacterFieldName(fieldName: string): string {
  if (fieldName.startsWith('cw_')) return fieldName.slice(3);
  if (fieldName.startsWith('pc_')) return fieldName.slice(3);
  if (fieldName.startsWith('goal_outcome_')) return 'characterGoalOutcome';
  if (fieldName.startsWith('goal_step_')) return 'characterGoalStep';

  if (fieldName.startsWith('extra_tone')) return 'tone';
  if (fieldName.startsWith('extra_kle')) return 'keyLifeEvent';
  if (fieldName.startsWith('extra_rel')) return 'relationship';
  if (fieldName.startsWith('extra_sec')) return 'secret';
  if (fieldName.startsWith('extra_fear')) return 'fear';
  if (fieldName.startsWith('extra_pa')) return 'physicalAppearanceExtra';
  if (fieldName.startsWith('extra_cw')) return 'currentlyWearingExtra';
  if (fieldName.startsWith('extra_pc')) return 'preferredClothingExtra';
  if (fieldName.startsWith('extra_bg')) return 'backgroundExtra';
  if (fieldName.startsWith('bg_')) return fieldName.slice(3);
  if (fieldName.startsWith('personality_outward_')) return 'personality_outward';
  if (fieldName.startsWith('personality_inward_')) return 'personality_inward';
  if (fieldName.startsWith('personality_')) return 'personality';

  return fieldName;
}

/**
 * Build a structured expansion prompt for character field enhancement
 */
function buildCharacterFieldPrompt(
  fieldName: string,
  currentValue: string,
  fullContext: string,
  selfContext: string,
  customLabel?: string,
  mode: 'precise' | 'detailed' = 'detailed'
): string {
  const resolvedFieldName = resolveCharacterFieldName(fieldName);
  const fieldConfig = CHARACTER_FIELD_PROMPTS[resolvedFieldName] || CHARACTER_FIELD_PROMPTS.custom;
  const isGenerateBoth = customLabel?.startsWith(GENERATE_BOTH_PREFIX);
  const sectionHint = isGenerateBoth ? customLabel!.slice(GENERATE_BOTH_PREFIX.length) : '';
  const label = isGenerateBoth ? sectionHint : (customLabel || fieldConfig.label);

  const currentValueSection = currentValue.trim()
    ? `CURRENT VALUE (enhance while preserving intent):\n${currentValue}\n\n`
    : 'CURRENT VALUE: Empty - generate appropriate content based on context.\n\n';

  // Generate-both mode: AI must return LABEL + DESCRIPTION
  // Section-specific hints for generate-both mode
  const SECTION_HINTS: Record<string, string> = {
    'character tone/voice detail': 'Generate a tone/voice trait describing HOW this character speaks — e.g. speech rhythm, vocabulary, verbal habits, emotional register, formality level. Good label examples: "Dry Wit", "Formal Register", "Nervous Stammer", "Warm Drawl", "Clipped Authority". The description should explain how this specific character exhibits that tone trait, based on their personality, background, and context. Do NOT generate personality traits — focus strictly on how they SOUND and EXPRESS themselves vocally.',
    'personality trait': 'Generate a personality trait describing a core behavioral pattern, emotional tendency, or character quality. Good label examples: "Stubborn", "Empathetic", "Reckless Courage", "Quiet Ambition", "People-Pleaser". The description should explain how this trait manifests in the character\'s behavior and decisions. Do NOT generate tone/voice traits — focus on personality and behavior.',
    'outward personality trait': 'Generate an OUTWARD personality trait — something other characters would notice and experience. Good label examples: "Charming Deflector", "Stoic Composure", "Infectious Optimism", "Cold Professionalism", "Disarming Humor". Focus on projected behavior, social demeanor, and how they present themselves. Do NOT describe internal feelings or speech patterns.',
    'inward personality trait': 'Generate an INWARD personality trait — something the character experiences internally but may hide. Good label examples: "Chronic Self-Doubt", "Suppressed Rage", "Secret Tenderness", "Fear of Abandonment", "Hidden Guilt". Focus on private thoughts, inner contradictions, and emotional patterns they don\'t show others. Do NOT describe outward behavior or speech patterns.',
    'key life event': 'Generate a formative past event. Good label examples: "Mother\'s Disappearance", "First Kill", "Academy Expulsion", "The Betrayal", "Childhood Fire". The description should explain what happened and how it shaped the character. Ground it in their established background.',
    'relationship': 'Generate a relationship with another character or figure. Good label examples: "Rival — Marcus Cole", "Mentor — Old Gregor", "Ex-Lover — Diana", "Estranged Father". The description should explain the dynamic, current state, and story significance.',
    'secret': 'Generate a secret the character keeps hidden. Good label examples: "True Parentage", "The Incident at Millbrook", "Hidden Addiction", "Double Agent". The description should explain what the secret is, why they hide it, and what would happen if revealed.',
    'fear': 'Generate a specific fear. Good label examples: "Abandonment", "Loss of Control", "Deep Water", "Becoming Like Father", "Public Failure". The description should explain how this fear manifests in behavior and connects to the character\'s past.',
    'character goal': 'Generate a character goal. Good label examples: "Find the Lost Heir", "Earn Father\'s Approval", "Escape the Guild", "Protect the Family Secret". The description should explain motivation and obstacles.',
    'physical appearance detail': 'Generate an additional physical detail. Good label examples: "Crooked Nose", "Calloused Hands", "Distinctive Gait", "Faded Scar". The description should be visually specific and complement existing appearance traits.',
    'currently wearing detail': 'Generate an additional clothing item. Good label examples: "Worn Leather Gloves", "Silver Locket", "Mud-Stained Boots", "Concealed Holster". Include type, appearance, and any significance.',
    'preferred clothing detail': 'Generate a preferred outfit for a specific occasion. Good label examples: "Date Night", "Formal Events", "Training Gear", "Disguise Kit". Describe the style and aesthetic.',
    'background detail': 'Generate an additional background detail. Good label examples: "Military Service", "Orphaned at 12", "Speaks Three Languages", "Former Street Performer". The description should enrich the character\'s history.',
  };

  if (isGenerateBoth) {
    const sectionGuidance = SECTION_HINTS[sectionHint] || '';
    const sectionGuidanceBlock = sectionGuidance
      ? `\nSECTION-SPECIFIC GUIDANCE:\n${sectionGuidance}\n`
      : '';

    return `You are a character creation assistant for an interactive roleplay scenario.

You need to generate BOTH a short label/name AND a description for a ${sectionHint} field on this character.

RULES:
1. The LABEL should be 1-4 words — a concise name for this trait/detail (e.g. "Loyal", "Childhood Trauma", "Raspy Voice")
2. The DESCRIPTION should be 1-2 sentences explaining/expanding on it
3. Look at all existing character data and world context to determine what trait/detail would be most fitting and NOT duplicate existing ones
4. Stay consistent with the character's established identity
5. NO purple prose. Be factual and story-relevant.
${sectionGuidanceBlock}
WORLD & SCENARIO CONTEXT:
${fullContext}

THIS CHARACTER'S EXISTING DATA:
${selfContext || 'No data filled yet.'}

${currentValueSection}SECTION TYPE: ${sectionHint}

You MUST respond in EXACTLY this format (two lines, no extra text):
LABEL: <your label here>
DESCRIPTION: <your description here>`;
  }

  if (mode === 'precise') {
    return `You are enhancing a character field for an interactive roleplay.

Expand the following character detail into 3-5 short tags separated by semicolons.
Focus on visual or key attributes only. No sentences, no explanations, no narrative rationale.

WORLD & SCENARIO CONTEXT:
${fullContext}

THIS CHARACTER'S EXISTING DATA:
${selfContext || 'No data filled yet.'}

${currentValueSection}FIELD: ${label}

Output format: Tag1; Tag2; Tag3; Tag4
Return ONLY the semicolon-separated tags. Nothing else.`;
  }

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
// Shared AI call with retry (same model, no fallback to worse models)
// ============================================================

const MAX_RETRIES = 3;

async function callAIWithRetry(
  messages: { role: string; content: string }[],
  modelId: string,
  stream: boolean = false
): Promise<string> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const { data, error } = await supabase.functions.invoke('chat', {
      body: { messages, modelId, stream }
    });

    if (error) {
      console.error(`[character-ai] Attempt ${attempt}/${MAX_RETRIES} failed:`, error);
      if (attempt < MAX_RETRIES) continue;
      throw new Error('AI request failed after 3 attempts. Please try again.');
    }

    const finishReason = data?.choices?.[0]?.finish_reason;
    const content = data?.choices?.[0]?.message?.content;

    if (finishReason === 'content_filter' || !content) {
      console.warn(`[character-ai] Attempt ${attempt}/${MAX_RETRIES} blocked (${finishReason || 'empty content'})`);
      if (attempt < MAX_RETRIES) continue;
      throw new Error('AI request failed after 3 attempts. Try rephrasing the content.');
    }

    return content.trim().replace(/^["']|["']$/g, '');
  }

  throw new Error('AI request failed after 3 attempts.');
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
  customLabel?: string,
  mode: 'precise' | 'detailed' = 'detailed'
): Promise<string> {
  const fullContext = buildFullContext(appData, character.id);
  const selfContext = buildCharacterSelfContext(character);
  const prompt = buildCharacterFieldPrompt(fieldName, currentValue, fullContext, selfContext, customLabel, mode);

  console.log(`[character-ai] Enhancing field: ${fieldName} with model: ${modelId} (mode: ${mode})`);

  const isGenerateBoth = customLabel?.startsWith(GENERATE_BOTH_PREFIX);

  const result = await callAIWithRetry(
    [
      { role: 'system', content: 'You are a concise character creation assistant. Return only the requested content, no explanations.' },
      { role: 'user', content: prompt }
    ],
    modelId
  );

  // Parse generate-both response into delimiter format for callers
  if (isGenerateBoth) {
    const labelMatch = result.match(/^LABEL:\s*(.+)/m);
    const descMatch = result.match(/^DESCRIPTION:\s*(.+)/m);
    if (labelMatch && descMatch) {
      return `${labelMatch[1].trim()}${SPLIT_DELIMITER}${descMatch[1].trim()}`;
    }
    // Fallback: return as-is if parsing fails
    return result;
  }

  // Post-process precise mode: clean up formatting
  if (mode === 'precise') {
    return result
      .replace(/\.\s*;/g, ';')     // Remove periods before semicolons
      .replace(/\.$/g, '')           // Remove trailing period
      .replace(/;\s*$/g, '')         // Remove trailing semicolon
      .trim();
  }

  return result;
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

  const replaceControlCharacters = (value: string): string =>
    Array.from(value, (char) => {
      const code = char.charCodeAt(0);
      return code <= 31 || code === 127 ? ' ' : char;
    }).join('');

  // 1. Strip markdown code fences
  const cleaned = raw.replace(/```(?:json)?\s*/gi, '').replace(/```\s*/g, '');

  // 2. Try direct parse
  try { return JSON.parse(cleaned); } catch (_) { /* continue */ }

  // 3. Regex extract + cleanup
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    let candidate = jsonMatch[0]
      .replace(/,\s*([}\]])/g, '$1');          // trailing commas
    candidate = replaceControlCharacters(candidate);
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
        .replace(/,\s*([}\]])/g, '$1');
      slice = replaceControlCharacters(slice);
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
    const content = await callAIWithRetry(
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
      if (isNonEmpty(result.basics.sexualOrientation) && emptyFields.basics.includes("sexualOrientation")) { patch.sexualOrientation = result.basics.sexualOrientation; fieldsApplied++; }
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
    const content = await callAIWithRetry(
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
        if (fill.basics.sexualOrientation && emptyFields.basics.includes("sexualOrientation")) patch.sexualOrientation = fill.basics.sexualOrientation;
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
    const updatedSections = [...character.sections];

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
