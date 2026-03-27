import { WorldCore } from "@/types";
import { supabase } from "@/integrations/supabase/client";

// Only include string fields that can be AI-enhanced
export type EnhanceableWorldFields =
  | Extract<keyof WorldCore, 'scenarioName' | 'briefDescription' | 'storyPremise' | 'factions' | 'locations' | 'historyTimeline' | 'plotHooks' | 'dialogFormatting'>
  | 'customContent'
  | 'worldCustomField'
  | 'storyGoalOutcome'
  | 'storyGoalStep'
  | 'arcPhaseOutcome';

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
  factions: {
    label: "Factions",
    instruction: "List major factions or groups. Format: 'Faction Name - Brief description and their role in the story/conflict'.",
    maxSentences: 6
  },
  locations: {
    label: "Primary Locations",
    instruction: "List key locations with their narrative significance. Format: 'Location Name - Brief description and story relevance'.",
    maxSentences: 6
  },
  historyTimeline: {
    label: "History & Timeline",
    instruction: "Summarize key historical events that impact the current story. Format: chronological bullet points of important past events.",
    maxSentences: 5
  },
  plotHooks: {
    label: "Plot Hooks",
    instruction: "List potential story hooks or quests. Format: 'Hook Name - Brief setup and what's at stake'.",
    maxSentences: 5
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

/**
 * Build a structured expansion prompt for the AI
 */
function buildPrompt(
  fieldName: EnhanceableWorldFields,
  currentValue: string,
  worldContext: Partial<WorldCore>,
  mode: 'precise' | 'detailed' = 'detailed'
): string {
  const fieldConfig = FIELD_PROMPTS[fieldName];
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
  
  // Build context from other non-empty fields
  const contextParts: string[] = [];
  if (worldContext.scenarioName && fieldName !== 'scenarioName') {
    contextParts.push(`- Story: ${worldContext.scenarioName}`);
  }
  if (worldContext.briefDescription && fieldName !== 'briefDescription') {
    contextParts.push(`- Description: ${worldContext.briefDescription}`);
  }
  if (worldContext.storyPremise && fieldName !== 'storyPremise') {
    contextParts.push(`- Premise: ${worldContext.storyPremise}`);
  }
  if (worldContext.customWorldSections?.length) {
    const customSections = worldContext.customWorldSections
      .map((section) => {
        const title = (section?.title || '').trim() || 'Untitled';
        const items = normalizeSectionItems(section);
        if (!items.length) return '';
        return `  [${title}]\n${items.map((item) => `    - ${item.label}: ${item.value}`).join('\n')}`;
      })
      .filter(Boolean)
      .join('\n');
    if (customSections) {
      contextParts.push(`- Custom World Content:\n${customSections}`);
    }
  }

  const contextSection = contextParts.length > 0 
    ? `CONTEXT FROM OTHER FIELDS:\n${contextParts.join('\n')}\n\n` 
    : '';

  const currentValueSection = currentValue.trim()
    ? `CURRENT VALUE (enhance while preserving intent):\n${currentValue}\n\n`
    : 'CURRENT VALUE: Empty - generate appropriate content based on context.\n\n';

  if (mode === 'precise') {
    return `You are enhancing a story field for an interactive roleplay.

Expand the following into 3-6 short key points separated by semicolons.
Focus on essential facts only. No sentences, no explanations, no narrative rationale.

${contextSection}${currentValueSection}FIELD: ${fieldConfig.label}

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

${contextSection}${currentValueSection}FIELD: ${fieldConfig.label}
INSTRUCTION: ${fieldConfig.instruction}

Return ONLY the enhanced text. No explanations, no prefixes, no markdown formatting.`;
}

/**
 * Enhance a single World Core field using AI
 */
export async function aiEnhanceWorldField(
  fieldName: EnhanceableWorldFields,
  currentValue: string,
  worldContext: Partial<WorldCore>,
  modelId: string,
  mode: 'precise' | 'detailed' = 'detailed'
): Promise<string> {
  const prompt = buildPrompt(fieldName, currentValue, worldContext, mode);

  console.log(`[world-ai] Enhancing field: ${fieldName} with model: ${modelId} (mode: ${mode})`);

  const { data, error } = await supabase.functions.invoke('chat', {
    body: {
      messages: [
        { role: 'system', content: 'You are a concise worldbuilding assistant. Return only the requested content, no explanations.' },
        { role: 'user', content: prompt }
      ],
      modelId,
      stream: false
    }
  });

  if (error) {
    console.error('[world-ai] Enhancement error:', error);
    throw new Error(error.message || 'Failed to enhance field');
  }

  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('No content returned from AI');
  }

  let result = content.trim().replace(/^["']|["']$/g, '');

  // Post-process precise mode
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
