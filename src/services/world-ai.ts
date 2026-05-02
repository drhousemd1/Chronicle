import { Character, CodexEntry, ContentThemes, OpeningDialog, WorldCore } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { trackAiUsageEvent } from "@/services/usage-tracking";
import { buildRequiredPresence, trackApiValidationSnapshot } from "@/services/api-usage-validation";
import { buildContentThemeDirectives } from "@/constants/tag-injection-registry";

// Only include string fields that can be AI-enhanced
export type EnhanceableWorldFields =
  | Extract<keyof WorldCore, 'scenarioName' | 'briefDescription' | 'storyPremise' | 'dialogFormatting'>
  | 'customContent'
  | 'worldCustomField'
  | 'storyGoalOutcome'
  | 'storyGoalStep'
  | 'arcPhaseOutcome';

export type WorldEnhanceContext = {
  worldCore: Partial<WorldCore>;
  openingDialog?: Partial<OpeningDialog>;
  characters?: Character[];
  entries?: CodexEntry[];
  contentThemes?: ContentThemes | null;
};

export const WORLD_GENERATE_BOTH_PREFIX = '__GENERATE_BOTH__:';
const WORLD_SPLIT_DELIMITER = '\n---SPLIT---\n';

export function parseWorldGenerateBothResponse(response: string): { label: string; value: string } | null {
  if (!response.includes('---SPLIT---')) return null;
  const [label, ...rest] = response.split('---SPLIT---');
  return { label: label.trim(), value: rest.join('---SPLIT---').trim() };
}

// Field-specific prompts that enforce structured expansion
const FIELD_PROMPTS: Record<EnhanceableWorldFields, { label: string; instruction: string; maxSentences: number }> = {
  scenarioName: {
    label: "Story Name",
    instruction: "Generate a compelling story name. Be evocative but concise (2-5 words). Examples: 'Echoes of Ashenvale', 'The Crimson Inheritance', 'Neon Shadows'.",
    maxSentences: 1
  },
  briefDescription: {
    label: "Brief Description",
    instruction: "Write a 1-2 sentence summary suitable for a story card. Focus on the hook that would make someone want to play.",
    maxSentences: 2
  },
  storyPremise: {
    label: "Story Premise",
    instruction: "Describe the central conflict and stakes. Format: Situation + Tension + Stakes. What's happening, why it matters, what could go wrong.",
    maxSentences: 4
  },
  dialogFormatting: {
    label: "Dialog Formatting",
    instruction: "Specify any additional dialog formatting rules beyond the standard (quotes for speech, asterisks for actions, parentheses for thoughts).",
    maxSentences: 3
  },
  customContent: {
    label: "Custom Content",
    instruction: "Expand and enrich this world-building content based on the provided context. Be specific and narrative-relevant. Preserve the existing content's intent while adding depth.",
    maxSentences: 5
  },
  worldCustomField: {
    label: "World Custom Field",
    instruction: "Enhance this custom world field with concrete setting detail. Keep the existing intent, avoid generic filler, and tie the content to the active story premise.",
    maxSentences: 4
  },
  storyGoalOutcome: {
    label: "Story Goal Outcome",
    instruction: "Describe the desired end state for this story goal. Explain what changes in the world or narrative if this outcome is achieved.",
    maxSentences: 3
  },
  storyGoalStep: {
    label: "Story Goal Step",
    instruction: "Write one specific step that progresses the story goal. Keep it actionable, plot-relevant, and consistent with existing world context.",
    maxSentences: 2
  },
  arcPhaseOutcome: {
    label: "Arc Phase Outcome",
    instruction: "Describe the desired outcome for this phase of the arc and how it affects the next phase or branch.",
    maxSentences: 3
  }
};

function extractAssistantText(data: unknown): string {
  const payload = (data ?? {}) as Record<string, unknown>;
  const choice = Array.isArray(payload.choices) ? payload.choices[0] as Record<string, unknown> | undefined : undefined;
  const message = (choice?.message ?? {}) as Record<string, unknown>;
  const raw = message.content ?? choice?.text ?? payload.output_text;

  if (typeof raw === 'string') {
    return raw.trim();
  }

  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const maybeText = (raw as Record<string, unknown>).text;
    if (typeof maybeText === 'string') {
      return maybeText.trim();
    }
  }

  if (Array.isArray(raw)) {
    const joined = raw
      .map((part) => {
        if (typeof part === 'string') return part;
        if (!part || typeof part !== 'object') return '';
        const record = part as Record<string, unknown>;
        if (typeof record.text === 'string') return record.text;
        if (typeof record.content === 'string') return record.content;
        return '';
      })
      .filter(Boolean)
      .join('\n')
      .trim();
    if (joined) return joined;
  }

  return '';
}

/**
 * Build a structured expansion prompt for the AI
 */
function normalizeSectionItems(section: any): Array<{ label: string; value: string }> {
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
}

function buildWorldScenarioContext(context: WorldEnhanceContext): string {
  const parts: string[] = [];
  const core = context.worldCore;

  if (core.scenarioName) parts.push(`Story: ${core.scenarioName}`);
  if (core.briefDescription) parts.push(`Brief Description: ${core.briefDescription}`);
  if (core.storyPremise) parts.push(`Story Premise: ${core.storyPremise}`);
  if (core.dialogFormatting) parts.push(`Dialog Formatting Rules: ${core.dialogFormatting}`);

  if (context.contentThemes) {
    const themeParts: string[] = [];
    if (context.contentThemes.storyType) themeParts.push(`Story Type: ${context.contentThemes.storyType}`);
    if (context.contentThemes.genres?.length) themeParts.push(`Genres: ${context.contentThemes.genres.join(', ')}`);
    if (context.contentThemes.characterTypes?.length) themeParts.push(`Character Types: ${context.contentThemes.characterTypes.join(', ')}`);
    if (context.contentThemes.origin?.length) themeParts.push(`Story Origin: ${context.contentThemes.origin.join(', ')}`);
    if (context.contentThemes.triggerWarnings?.length) themeParts.push(`Trigger Warnings: ${context.contentThemes.triggerWarnings.join(', ')}`);
    if (context.contentThemes.customTags?.length) themeParts.push(`Custom Tags: ${context.contentThemes.customTags.join(', ')}`);
    if (themeParts.length) parts.push(`Selected Story Tags:\n- ${themeParts.join('\n- ')}`);

    const contentThemeDirectives = buildContentThemeDirectives(context.contentThemes).trim();
    if (contentThemeDirectives) {
      parts.push(`Prompt Guidance Derived From Selected Tags:\n${contentThemeDirectives}`);
    }
  }

  if (core.structuredLocations?.length) {
    const locs = core.structuredLocations
      .filter((entry) => (entry.label || '').trim() || (entry.description || '').trim())
      .map((entry) => `  - ${entry.label || 'Unnamed location'}: ${entry.description || '(description empty)'}`)
      .join('\n');
    if (locs) parts.push(`Primary Locations:\n${locs}`);
  }

  if (core.customWorldSections?.length) {
    const customSections = core.customWorldSections
      .map((section) => {
        const title = (section?.title || '').trim() || 'Untitled';
        const items = normalizeSectionItems(section);
        if (!items.length) return '';
        return `  [${title}]\n${items.map((item) => `    - ${item.label}: ${item.value}`).join('\n')}`;
      })
      .filter(Boolean)
      .join('\n');
    if (customSections) parts.push(`Custom World Content:\n${customSections}`);
  }

  if (core.storyGoals?.length) {
    const goalLines = core.storyGoals
      .filter((goal) => (goal.title || '').trim() || (goal.desiredOutcome || '').trim() || (goal.steps || []).some((step) => (step.description || '').trim()))
      .map((goal) => {
        const goalParts = [`• ${goal.title || 'Untitled Goal'}`];
        if ((goal.desiredOutcome || '').trim()) goalParts.push(`Outcome: ${goal.desiredOutcome}`);
        if ((goal.currentStatus || '').trim()) goalParts.push(`Status: ${goal.currentStatus}`);
        const filledSteps = (goal.steps || [])
          .filter((step) => (step.description || '').trim())
          .map((step) => step.description.trim());
        if (filledSteps.length) goalParts.push(`Steps: ${filledSteps.join(' | ')}`);
        return goalParts.join(' — ');
      })
      .join('\n');
    if (goalLines) parts.push(`Story Goals:\n${goalLines}`);
  }

  if (context.openingDialog?.text?.trim()) {
    const timingBits: string[] = [];
    if (context.openingDialog.startingDay) timingBits.push(`Day ${context.openingDialog.startingDay}`);
    if (context.openingDialog.startingTimeOfDay) timingBits.push(context.openingDialog.startingTimeOfDay);
    if (context.openingDialog.timeProgressionMode) timingBits.push(`${context.openingDialog.timeProgressionMode} time progression`);
    if (context.openingDialog.timeProgressionMode === 'automatic' && context.openingDialog.timeProgressionInterval) {
      timingBits.push(`${context.openingDialog.timeProgressionInterval}-minute interval`);
    }
    const timingSummary = timingBits.length ? ` (${timingBits.join(', ')})` : '';
    parts.push(`Opening Dialog${timingSummary}:\n${context.openingDialog.text}`);
  }

  if (context.entries?.length) {
    const entryLines = context.entries
      .filter((entry) => (entry.title || '').trim() || (entry.body || '').trim())
      .map((entry) => `• ${entry.title || 'Untitled Entry'}: ${entry.body || '(body empty)'}`)
      .join('\n');
    if (entryLines) parts.push(`Additional Lore Entries:\n${entryLines}`);
  }

  if (context.characters?.length) {
    const characterLines = context.characters
      .map((character) => {
        const bits: string[] = [];
        bits.push(character.name || 'Unnamed Character');
        if (character.characterRole) bits.push(`role: ${character.characterRole}`);
        if (character.controlledBy) bits.push(`control: ${character.controlledBy}`);
        if (character.roleDescription) bits.push(`function: ${character.roleDescription}`);
        if (character.tags) bits.push(`tags: ${character.tags}`);
        if (character.location) bits.push(`location: ${character.location}`);
        if (character.currentMood) bits.push(`mood: ${character.currentMood}`);
        const personalityBits = character.personality
          ? (
              character.personality.splitMode
                ? [...(character.personality.outwardTraits || []), ...(character.personality.inwardTraits || [])]
                : (character.personality.traits || [])
            )
              .filter((trait) => (trait.label || '').trim() || (trait.value || '').trim())
              .slice(0, 3)
              .map((trait) => trait.label || trait.value)
          : [];
        if (personalityBits.length) bits.push(`personality anchors: ${personalityBits.join(', ')}`);
        return `• ${bits.join(' — ')}`;
      })
      .join('\n');
    if (characterLines) parts.push(`Character Roster:\n${characterLines}`);
  }

  return parts.join('\n\n') || 'No story context available.';
}

/**
 * Build a structured expansion prompt for the AI
 */
function buildPrompt(
  fieldName: EnhanceableWorldFields,
  currentValue: string,
  worldContext: WorldEnhanceContext,
  customLabel?: string,
  mode: 'precise' | 'detailed' = 'detailed'
): string {
  const fieldConfig = FIELD_PROMPTS[fieldName];
  const isGenerateBoth = customLabel?.startsWith(WORLD_GENERATE_BOTH_PREFIX);
  const subjectLabel = isGenerateBoth
    ? customLabel!.slice(WORLD_GENERATE_BOTH_PREFIX.length).trim()
    : (customLabel || '').trim();
  const scenarioContext = buildWorldScenarioContext(worldContext);
  const subjectSection = subjectLabel
    ? `SPECIFIC SUBJECT TO EXPAND:\n${subjectLabel}\n\n`
    : '';

  const currentValueSection = currentValue.trim()
    ? `CURRENT VALUE (enhance while preserving intent):\n${currentValue}\n\n`
    : 'CURRENT VALUE: Empty - generate appropriate content based on context.\n\n';

  if (isGenerateBoth) {
    return `You are a story-building assistant for an interactive roleplay scenario.

You need to generate BOTH a short label/name AND a description for a structured world/story field.

RULES:
1. The LABEL should be 1-5 words and feel native to the current story/world.
2. The DESCRIPTION should be 1-3 concise sentences or fragments that explain or flesh out that label.
3. Use all available story context, character context, selected content tags, and lore context below.
4. Do NOT duplicate an existing field if a similar concept is already present elsewhere in the scenario.
5. Stay tightly consistent with the actual scenario premise, cast, and selected themes.
6. No purple prose, no generic filler, and no random worldbuilding that ignores the current setup.

STORY + CHARACTER CONTEXT:
${scenarioContext}

${subjectSection}${currentValueSection}FIELD TYPE: ${fieldConfig.label}

You MUST respond in EXACTLY this format (two lines, no extra text):
LABEL: <your label here>
DESCRIPTION: <your description here>`;
  }

  if (mode === 'precise') {
    return `You are enhancing a story field for an interactive roleplay.

Expand the following into 3-6 short key points separated by semicolons.
Focus on essential facts only. No sentences, no explanations, no narrative rationale.
If a specific subject is provided below, every point must reinforce THAT exact subject. Do not rename it, soften it, or switch to a different concept.

STORY + CHARACTER CONTEXT:
${scenarioContext}

${subjectSection}${currentValueSection}FIELD TYPE: ${fieldConfig.label}
${subjectLabel ? 'Treat the subject label as binding context for the output.\n' : ''}INSTRUCTION: ${fieldConfig.instruction}

Output format: Point1; Point2; Point3; Point4
Return ONLY the semicolon-separated points. Nothing else.`;
  }

  return `You are enhancing a story field for an interactive roleplay. Use STRUCTURED EXPANSION:

RULES:
1. Be concise and factual (max ${fieldConfig.maxSentences} sentences)
2. Focus on narrative-relevant implications - what matters for the story
3. NO purple prose or flowery language
4. Format: State the fact, then its implication for gameplay/story
5. ${currentValue.trim() ? 'Preserve the existing content\'s intent while enhancing it' : 'Generate appropriate content from available context'}
6. If a specific subject or row label is provided below, expand THAT exact subject. Do not rename it, contradict it, or drift into a different idea.
7. Use the story premise, character roster, selected tags, lore entries, and opening context below to stay grounded.

STORY + CHARACTER CONTEXT:
${scenarioContext}

${subjectSection}${currentValueSection}FIELD TYPE: ${fieldConfig.label}
INSTRUCTION: ${fieldConfig.instruction}

Return ONLY the enhanced text. No explanations, no prefixes, no markdown formatting.`;
}

/**
 * Enhance a single World Core field using AI
 */
export async function aiEnhanceWorldField(
  fieldName: EnhanceableWorldFields,
  currentValue: string,
  worldContext: WorldEnhanceContext,
  modelId: string,
  customLabel?: string,
  mode: 'precise' | 'detailed' = 'detailed'
): Promise<string> {
  const prompt = buildPrompt(fieldName, currentValue, worldContext, customLabel, mode);

  console.log(`[world-ai] Enhancing field: ${fieldName} with model: ${modelId} (mode: ${mode})`);
  void trackAiUsageEvent({
    eventType: mode === "precise" ? "world_ai_enhance_precise" : "world_ai_enhance_detailed",
    eventSource: "world-ai",
    metadata: {
      fieldName,
      customLabel: customLabel || null,
    },
  });

  void trackApiValidationSnapshot({
    eventKey: "validation.single.world_ai_enhance",
    eventSource: "world-ai.enhance",
    apiCallGroup: "single_call",
    parentRowId: "summary.single.world_ai_enhance",
    detailPresence: buildRequiredPresence([
      ["single.world_ai_enhance.field_name", fieldName],
      ["single.world_ai_enhance.prompt", prompt],
      ["single.world_ai_enhance.model_id", modelId],
    ]),
  });

  const isGenerateBoth = customLabel?.startsWith(WORLD_GENERATE_BOTH_PREFIX);

  const { data, error } = await supabase.functions.invoke('chat', {
    body: {
      messages: [
        { role: 'system', content: 'You are a concise worldbuilding assistant. Return only the requested content, no explanations.' },
        { role: 'user', content: prompt }
      ],
      modelId,
      stream: false
    },
  });

  if (error) {
    const payload = (data && typeof data === 'object') ? data as Record<string, unknown> : null;
    const payloadError = typeof payload?.error === 'string' ? payload.error : '';
    const payloadDetails = typeof payload?.details === 'string' ? payload.details : '';
    const details = [payloadError, payloadDetails, error.message].filter(Boolean).join(' | ');
    console.error('[world-ai] Enhancement error:', details || error);
    throw new Error(details || 'Failed to enhance field');
  }

  const content = extractAssistantText(data);
  if (!content) {
    throw new Error('No content returned from AI');
  }

  let result = content.trim().replace(/^["']|["']$/g, '');

  // Post-process precise mode
  if (isGenerateBoth) {
    const labelMatch = result.match(/^LABEL:\s*(.+)/m);
    const descMatch = result.match(/^DESCRIPTION:\s*(.+)/m);
    if (labelMatch && descMatch) {
      return `${labelMatch[1].trim()}${WORLD_SPLIT_DELIMITER}${descMatch[1].trim()}`;
    }
    return result;
  }

  if (mode === 'precise') {
    result = result
      .replace(/\.\s*;/g, ';')
      .replace(/\.$/g, '')
      .replace(/;\s*$/g, '')
      .trim();
  }

  return result;
}

/**
 * Get the field configuration for UI display
 */
export function getFieldConfig(fieldName: keyof WorldCore) {
  return FIELD_PROMPTS[fieldName as EnhanceableWorldFields];
}

export const __testables = {
  buildPrompt,
  buildWorldScenarioContext,
};
