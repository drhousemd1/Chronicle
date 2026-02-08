import { WorldCore } from "@/types";
import { supabase } from "@/integrations/supabase/client";

// Only include string fields that can be AI-enhanced
export type EnhanceableWorldFields = Extract<keyof WorldCore, 'scenarioName' | 'briefDescription' | 'storyPremise' | 'settingOverview' | 'factions' | 'locations' | 'historyTimeline' | 'plotHooks' | 'narrativeStyle' | 'dialogFormatting'>;

// Field-specific prompts that enforce structured expansion
const FIELD_PROMPTS: Record<EnhanceableWorldFields, { label: string; instruction: string; maxSentences: number }> = {
  scenarioName: {
    label: "Scenario Name",
    instruction: "Generate a compelling scenario/story name. Be evocative but concise (2-5 words). Examples: 'Echoes of Ashenvale', 'The Crimson Inheritance', 'Neon Shadows'.",
    maxSentences: 1
  },
  briefDescription: {
    label: "Brief Description",
    instruction: "Write a 1-2 sentence summary suitable for a story card. Focus on the hook that would make someone want to play.",
    maxSentences: 2
  },
  storyPremise: {
    label: "Scenario",
    instruction: "Describe the central conflict and stakes. Format: Situation + Tension + Stakes. What's happening, why it matters, what could go wrong.",
    maxSentences: 4
  },
  settingOverview: {
    label: "Setting Overview",
    instruction: "Describe the physical and cultural landscape. Format: Geography + Culture + Atmosphere. Be factual and concise about what defines this world.",
    maxSentences: 5
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
  narrativeStyle: {
    label: "Narrative Style",
    instruction: "Describe the narrative voice and writing style. Format: POV + Prose style + Descriptive focus areas.",
    maxSentences: 3
  },
  dialogFormatting: {
    label: "Dialog Formatting",
    instruction: "Specify any additional dialog formatting rules beyond the standard (quotes for speech, asterisks for actions, parentheses for thoughts).",
    maxSentences: 3
  }
};

/**
 * Build a structured expansion prompt for the AI
 */
function buildPrompt(
  fieldName: EnhanceableWorldFields,
  currentValue: string,
  worldContext: Partial<WorldCore>
): string {
  const fieldConfig = FIELD_PROMPTS[fieldName];
  
  // Build context from other non-empty fields
  const contextParts: string[] = [];
  if (worldContext.scenarioName && fieldName !== 'scenarioName') {
    contextParts.push(`- Scenario: ${worldContext.scenarioName}`);
  }
  if (worldContext.briefDescription && fieldName !== 'briefDescription') {
    contextParts.push(`- Description: ${worldContext.briefDescription}`);
  }
  if (worldContext.storyPremise && fieldName !== 'storyPremise') {
    contextParts.push(`- Premise: ${worldContext.storyPremise}`);
  }
  if (worldContext.settingOverview && fieldName !== 'settingOverview') {
    contextParts.push(`- Setting: ${worldContext.settingOverview}`);
  }

  const contextSection = contextParts.length > 0 
    ? `CONTEXT FROM OTHER FIELDS:\n${contextParts.join('\n')}\n\n` 
    : '';

  const currentValueSection = currentValue.trim()
    ? `CURRENT VALUE (enhance while preserving intent):\n${currentValue}\n\n`
    : 'CURRENT VALUE: Empty - generate appropriate content based on context.\n\n';

  return `You are enhancing a story/scenario field for an interactive roleplay. Use STRUCTURED EXPANSION:

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
  modelId: string
): Promise<string> {
  const prompt = buildPrompt(fieldName, currentValue, worldContext);

  console.log(`[world-ai] Enhancing field: ${fieldName} with model: ${modelId}`);

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

  // Clean up response - remove any accidental markdown or quotes
  return content.trim().replace(/^["']|["']$/g, '');
}

/**
 * Get the field configuration for UI display
 */
export function getFieldConfig(fieldName: keyof WorldCore) {
  return FIELD_PROMPTS[fieldName];
}
