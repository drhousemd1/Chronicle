import type { Character, SideCharacter } from '@/types';

export type RoleplayCharacterCardSource = Character | SideCharacter;

export type CharacterPromptFactRuntimeUse =
  | 'identity'
  | 'stable_reference'
  | 'current_state'
  | 'relationship'
  | 'goal'
  | 'private_reference'
  | 'debug_only';

export type CharacterPromptFactAuthority =
  | 'saved_card_identity'
  | 'saved_card_reference'
  | 'current_state'
  | 'goal_selector'
  | 'visibility_policy';

export type CharacterPromptFactRelevance =
  | 'always'
  | 'current'
  | 'conditional'
  | 'inactive';

export type CharacterPromptFactVisibility =
  | 'broad_reference'
  | 'current_scene'
  | 'character_knowledge'
  | 'private_reference'
  | 'debug_only';

export type CharacterPromptFactWordingPolicy =
  | 'compact_fact'
  | 'voice_affordance'
  | 'do_not_copy_phrase'
  | 'withhold';

export type CharacterPromptFactDisposition =
  | 'included'
  | 'transformed'
  | 'suppressed'
  | 'debug_only';

export type CharacterPromptFact = Readonly<{
  characterId: string;
  characterName: string;
  sourceField: string;
  sourceLabel?: string;
  sourceValue: string;
  value: string;
  runtimeUse: CharacterPromptFactRuntimeUse;
  authority: CharacterPromptFactAuthority;
  relevance: CharacterPromptFactRelevance;
  visibility: CharacterPromptFactVisibility;
  wordingPolicy: CharacterPromptFactWordingPolicy;
  modelFacing: boolean;
  disposition: CharacterPromptFactDisposition;
  reason: string;
}>;

export type CharacterPromptFactDuplicateGroup = Readonly<{
  value: string;
  sourceFields: string[];
  renderedOccurrences: number;
}>;

export type CharacterPromptFactReviewSummary = Readonly<{
  characterId: string;
  characterName: string;
  totalFacts: number;
  modelFacingFacts: number;
  transformedFacts: number;
  suppressedFacts: number;
  debugOnlyFacts: number;
  duplicateSourceGroups: CharacterPromptFactDuplicateGroup[];
  repeatedRenderedValues: string[];
  legacyRawHeadingsPresent: string[];
}>;

export type CharacterPromptOutputCopyMetric = Readonly<{
  characterId: string;
  characterName: string;
  factSource: 'generation_captured_facts' | 'current_card_fallback';
  exactSourceValueCopies: Array<Readonly<{
    sourceField: string;
    sourceLabel?: string;
    sourceValue: string;
  }>>;
  copiedSourceLabels: Array<Readonly<{
    sourceField: string;
    sourceLabel: string;
  }>>;
}>;

export type CreateCharacterPromptFactInput = Omit<
  CharacterPromptFact,
  'sourceValue' | 'value' | 'modelFacing'
> & Readonly<{
  sourceValue: string;
  promptValue?: string;
}>;

function normalizePromptValue(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

const PROMPT_COPY_STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'been', 'being', 'by', 'for', 'from', 'has', 'have',
  'her', 'his', 'in', 'into', 'is', 'it', 'its', 'of', 'on', 'our', 'that', 'the', 'their', 'this',
  'to', 'until', 'was', 'were', 'with', 'during', 'your',
]);

function compactCreatorPromptValue(value: string): string {
  const normalized = normalizePromptValue(value);
  const words = normalized.split(' ');
  if (words.length <= 4) return normalized;
  const compacted = words
    .filter((word) => !PROMPT_COPY_STOPWORDS.has(word.toLocaleLowerCase().replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '')))
    .slice(0, 14)
    .join(' · ')
    .replace(/\s+([,.;!?])/g, '$1');
  return compacted || normalized;
}

export function createCharacterPromptFact(
  input: CreateCharacterPromptFactInput,
): CharacterPromptFact {
  const normalizedSourceValue = normalizePromptValue(input.sourceValue);
  const value = normalizePromptValue(input.promptValue ?? input.sourceValue);
  const disposition = input.disposition === 'transformed' && value === normalizedSourceValue
    ? 'included'
    : input.disposition;
  const modelFacing = disposition === 'included' || disposition === 'transformed';

  return Object.freeze({
    characterId: input.characterId,
    characterName: input.characterName,
    sourceField: input.sourceField,
    sourceLabel: input.sourceLabel,
    sourceValue: input.sourceValue,
    value,
    runtimeUse: input.runtimeUse,
    authority: input.authority,
    relevance: input.relevance,
    visibility: input.visibility,
    wordingPolicy: input.wordingPolicy,
    modelFacing,
    disposition,
    reason: input.reason,
  });
}

type CharacterFactPolicy = Pick<
  CreateCharacterPromptFactInput,
  | 'runtimeUse'
  | 'authority'
  | 'relevance'
  | 'visibility'
  | 'wordingPolicy'
  | 'disposition'
  | 'reason'
>;

function text(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
}

function appendFact(
  facts: CharacterPromptFact[],
  character: RoleplayCharacterCardSource,
  sourceField: string,
  sourceValue: unknown,
  policy: CharacterFactPolicy,
  sourceLabel?: string,
) {
  const value = text(sourceValue);
  if (!value) return;
  facts.push(createCharacterPromptFact({
    characterId: character.id,
    characterName: character.name,
    sourceField,
    sourceLabel,
    sourceValue: value,
    promptValue: policy.disposition === 'transformed'
      ? compactCreatorPromptValue(value)
      : undefined,
    ...policy,
  }));
}

function appendRecordFacts(
  facts: CharacterPromptFact[],
  character: RoleplayCharacterCardSource,
  sourceField: string,
  source: Record<string, unknown> | undefined,
  policy: CharacterFactPolicy,
) {
  if (!source) return;
  for (const [key, value] of Object.entries(source)) {
    if (key === '_extras') continue;
    appendFact(facts, character, `${sourceField}.${key}`, value, policy);
  }
  const extras = source._extras;
  if (!Array.isArray(extras)) return;
  extras.forEach((entry, index) => {
    const label = text(entry?.label);
    const value = text(entry?.value);
    appendFact(
      facts,
      character,
      `${sourceField}._extras[${index}].value`,
      value || label,
      policy,
      label || undefined,
    );
  });
}

const identityPolicy: CharacterFactPolicy = {
  runtimeUse: 'identity',
  authority: 'saved_card_identity',
  relevance: 'always',
  visibility: 'broad_reference',
  wordingPolicy: 'compact_fact',
  disposition: 'included',
  reason: 'durable_character_identity',
};

const stableReferencePolicy: CharacterFactPolicy = {
  runtimeUse: 'stable_reference',
  authority: 'saved_card_reference',
  relevance: 'conditional',
  visibility: 'character_knowledge',
  wordingPolicy: 'do_not_copy_phrase',
  disposition: 'transformed',
  reason: 'creator_reference_requires_compact_nonverbatim_prompt_copy',
};

const voicePolicy: CharacterFactPolicy = {
  ...stableReferencePolicy,
  wordingPolicy: 'voice_affordance',
  reason: 'creator_reference_informs_character_voice_without_reusable_prose',
};

const relationshipPolicy: CharacterFactPolicy = {
  runtimeUse: 'relationship',
  authority: 'saved_card_reference',
  relevance: 'conditional',
  visibility: 'character_knowledge',
  wordingPolicy: 'compact_fact',
  disposition: 'transformed',
  reason: 'saved_relationship_reference_requires_current_context_before_use',
};

const currentStatePolicy: CharacterFactPolicy = {
  runtimeUse: 'current_state',
  authority: 'current_state',
  relevance: 'current',
  visibility: 'current_scene',
  wordingPolicy: 'withhold',
  disposition: 'debug_only',
  reason: 'saved_card_copy_is_not_the_live_current_state_authority',
};

const goalPolicy: CharacterFactPolicy = {
  runtimeUse: 'goal',
  authority: 'goal_selector',
  relevance: 'conditional',
  visibility: 'debug_only',
  wordingPolicy: 'withhold',
  disposition: 'debug_only',
  reason: 'goal_selector_owns_live_goal_prompt_material',
};

const privatePolicy: CharacterFactPolicy = {
  runtimeUse: 'private_reference',
  authority: 'visibility_policy',
  relevance: 'conditional',
  visibility: 'private_reference',
  wordingPolicy: 'withhold',
  disposition: 'debug_only',
  reason: 'private_saved_fact_requires_explicit_visibility_or_knowledge_policy',
};

const debugPolicy: CharacterFactPolicy = {
  runtimeUse: 'debug_only',
  authority: 'saved_card_reference',
  relevance: 'inactive',
  visibility: 'debug_only',
  wordingPolicy: 'withhold',
  disposition: 'debug_only',
  reason: 'saved_card_metadata_is_not_roleplay_prompt_content',
};

export function compileCharacterPromptFacts(character: RoleplayCharacterCardSource): CharacterPromptFact[] {
  const facts: CharacterPromptFact[] = [];

  appendFact(facts, character, 'name', character.name, identityPolicy);
  appendFact(facts, character, 'nicknames', character.nicknames, identityPolicy);
  appendFact(facts, character, 'age', character.age, identityPolicy);
  appendFact(facts, character, 'sexType', character.sexType, identityPolicy);
  appendFact(facts, character, 'sexualOrientation', character.sexualOrientation, identityPolicy);
  appendFact(facts, character, 'controlledBy', character.controlledBy, identityPolicy);
  appendFact(facts, character, 'characterRole', character.characterRole, identityPolicy);
  appendFact(facts, character, 'roleDescription', character.roleDescription, stableReferencePolicy);

  appendFact(facts, character, 'location', character.location, currentStatePolicy);
  appendFact(facts, character, 'scenePosition', character.scenePosition, currentStatePolicy);
  appendRecordFacts(facts, character, 'currentlyWearing', character.currentlyWearing, currentStatePolicy);

  const {
    temporaryConditions,
    ...stablePhysicalAppearance
  } = character.physicalAppearance ?? {};
  appendRecordFacts(facts, character, 'physicalAppearance', stablePhysicalAppearance, stableReferencePolicy);
  appendFact(
    facts,
    character,
    'physicalAppearance.temporaryConditions',
    temporaryConditions,
    currentStatePolicy,
  );
  appendRecordFacts(facts, character, 'preferredClothing', character.preferredClothing, stableReferencePolicy);
  const fullCharacter = 'tags' in character ? character : undefined;
  appendRecordFacts(facts, character, 'tone', fullCharacter?.tone, voicePolicy);
  appendRecordFacts(facts, character, 'background', character.background, stableReferencePolicy);
  appendRecordFacts(facts, character, 'keyLifeEvents', fullCharacter?.keyLifeEvents, stableReferencePolicy);
  appendRecordFacts(facts, character, 'relationships', fullCharacter?.relationships, relationshipPolicy);
  appendRecordFacts(facts, character, 'fears', fullCharacter?.fears, stableReferencePolicy);
  appendRecordFacts(facts, character, 'secrets', fullCharacter?.secrets, privatePolicy);

  const personality = character.personality;
  const hasStructuredTraits = personality
    ? 'splitMode' in personality
      || personality.traits.some((trait) => typeof trait === 'object')
    : false;
  if (personality && hasStructuredTraits) {
    const groups = 'splitMode' in personality && personality.splitMode
      ? [
          ['outwardTraits', personality.outwardTraits],
          ['inwardTraits', personality.inwardTraits],
        ] as const
      : [['traits', personality.traits]] as const;
    for (const [groupName, traits] of groups) {
      traits.forEach((trait, index) => {
        const value = typeof trait === 'string'
          ? trait
          : text(trait.value) || trait.label;
        appendFact(
          facts,
          character,
          `personality.${groupName}[${index}].value`,
          value,
          voicePolicy,
          typeof trait === 'string' ? undefined : text(trait.label) || undefined,
        );
      });
    }
  } else if (personality && 'miscellaneous' in personality) {
    personality.traits.forEach((trait, index) => {
      appendFact(facts, character, `personality.traits[${index}]`, trait, voicePolicy);
    });
    appendFact(facts, character, 'personality.miscellaneous', personality.miscellaneous, voicePolicy);
    appendFact(facts, character, 'personality.fears', personality.fears, stableReferencePolicy);
    appendFact(facts, character, 'personality.secrets', personality.secrets, privatePolicy);
    appendFact(facts, character, 'personality.kinksFantasies', personality.kinksFantasies, privatePolicy);
    appendFact(facts, character, 'personality.desires', personality.desires, privatePolicy);
  }

  (character.sections ?? []).forEach((section, sectionIndex) => {
    section.items.forEach((item, itemIndex) => {
      appendFact(
        facts,
        character,
        `sections[${sectionIndex}].items[${itemIndex}].value`,
        text(item.value) || item.label,
        stableReferencePolicy,
        [text(section.title), text(item.label)].filter(Boolean).join(': ') || undefined,
      );
    });
    appendFact(
      facts,
      character,
      `sections[${sectionIndex}].freeformValue`,
      section.freeformValue,
      stableReferencePolicy,
      text(section.title) || undefined,
    );
  });

  fullCharacter?.goals?.forEach((goal, goalIndex) => {
    appendFact(facts, character, `goals[${goalIndex}].title`, goal.title, goalPolicy);
    appendFact(facts, character, `goals[${goalIndex}].desiredOutcome`, goal.desiredOutcome, goalPolicy);
    appendFact(facts, character, `goals[${goalIndex}].currentStatus`, goal.currentStatus, goalPolicy);
    goal.steps?.forEach((step, stepIndex) => {
      appendFact(
        facts,
        character,
        `goals[${goalIndex}].steps[${stepIndex}].description`,
        step.description,
        goalPolicy,
      );
    });
  });

  appendFact(facts, character, 'tags', fullCharacter?.tags, debugPolicy);
  if ('firstMentionedIn' in character) {
    appendFact(facts, character, 'firstMentionedIn', character.firstMentionedIn, debugPolicy);
    character.extractedTraits.forEach((trait, index) => {
      appendFact(facts, character, `extractedTraits[${index}]`, trait, debugPolicy);
    });
  }
  return facts;
}

export function selectCharacterPromptFactsForRendering(
  character: RoleplayCharacterCardSource,
): CharacterPromptFact[] {
  const seenValues = new Set<string>();
  return compileCharacterPromptFacts(character).map((fact) => {
    if (!fact.modelFacing) return fact;
    const key = fact.value.toLocaleLowerCase().replace(/\s+/g, ' ').trim();
    if (!key || !seenValues.has(key)) {
      if (key) seenValues.add(key);
      return fact;
    }
    return Object.freeze({
      ...fact,
      modelFacing: false,
      disposition: 'suppressed' as const,
      reason: `duplicate_model_facing_value_suppressed:${fact.reason}`,
    });
  });
}

function titleCaseSourceField(sourceField: string): string {
  const leaf = sourceField
    .replace(/\._extras\[\d+\]\.value$/, '')
    .replace(/\.value$/, '')
    .split('.')
    .at(-1)
    ?.replace(/\[\d+\]$/, '')
    ?? 'reference';
  return leaf
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function promptLabel(fact: CharacterPromptFact): string {
  if (fact.sourceLabel) return fact.sourceLabel;
  const labels: Record<string, string> = {
    controlledBy: 'Controlled by',
    characterRole: 'Story role',
    roleDescription: 'Role in story',
    sexType: 'Sex / type',
    sexualOrientation: 'Sexual orientation',
  };
  if (labels[fact.sourceField]) return labels[fact.sourceField];
  if (fact.sourceField.startsWith('personality.')) return 'Voice / behavior';
  if (fact.sourceField.startsWith('relationships.')) return 'Relationship';
  if (fact.sourceField.startsWith('sections.')) return 'Custom reference';
  return titleCaseSourceField(fact.sourceField);
}

function renderFactRows(facts: CharacterPromptFact[]): string {
  return facts.map((fact) => `- ${promptLabel(fact)}: ${fact.value}`).join('\n');
}

export function renderCharacterPromptFacts(character: RoleplayCharacterCardSource): string {
  const facts = selectCharacterPromptFactsForRendering(character).filter((fact) => (
    fact.modelFacing && fact.sourceField !== 'name'
  ));
  const identity = facts.filter((fact) => fact.runtimeUse === 'identity');
  const compact = facts.filter((fact) => (
    fact.runtimeUse !== 'identity' && fact.wordingPolicy === 'compact_fact'
  ));
  const creatorReference = facts.filter((fact) => fact.wordingPolicy === 'do_not_copy_phrase');
  const voice = facts.filter((fact) => fact.wordingPolicy === 'voice_affordance');

  return [
    `CHARACTER: ${character.name || 'Unnamed'}`,
    identity.length ? `IDENTITY FACTS\n${renderFactRows(identity)}` : '',
    compact.length ? `COMPACT REFERENCE FACTS\n${renderFactRows(compact)}` : '',
    creatorReference.length
      ? `CREATOR REFERENCE FACTS\nUse only when relevant. Preserve the meaning, but do not copy creator wording into narration or dialogue.\n${renderFactRows(creatorReference)}`
      : '',
    voice.length
      ? `VOICE AND BEHAVIOR AFFORDANCES\nExpress these through fresh behavior and dialogue; do not quote these lines.\n${renderFactRows(voice)}`
      : '',
  ].filter(Boolean).join('\n\n');
}

function countNormalizedOccurrences(haystack: string, needle: string): number {
  const normalizedHaystack = haystack.toLocaleLowerCase().replace(/\s+/g, ' ');
  const normalizedNeedle = needle.toLocaleLowerCase().replace(/\s+/g, ' ').trim();
  if (!normalizedNeedle) return 0;
  return normalizedHaystack.split(normalizedNeedle).length - 1;
}

export function buildCharacterPromptFactReviewSummary(
  character: RoleplayCharacterCardSource,
  systemInstruction: string,
): CharacterPromptFactReviewSummary {
  const compiledFacts = compileCharacterPromptFacts(character);
  const facts = selectCharacterPromptFactsForRendering(character);
  const byValue = new Map<string, CharacterPromptFact[]>();
  for (const fact of compiledFacts) {
    const key = fact.sourceValue.toLocaleLowerCase().replace(/\s+/g, ' ').trim();
    if (!key) continue;
    byValue.set(key, [...(byValue.get(key) ?? []), fact]);
  }
  const duplicateSourceGroups = [...byValue.values()]
    .filter((group) => group.length > 1)
    .map((group) => ({
      value: normalizePromptValue(group[0].sourceValue),
      sourceFields: group.map((fact) => fact.sourceField),
      renderedOccurrences: countNormalizedOccurrences(systemInstruction, group[0].value),
    }));
  const repeatedRenderedValues = facts
    .filter((fact) => (
      fact.modelFacing
      && fact.sourceValue.length >= 18
      && fact.sourceValue.split(/\s+/).length >= 3
      && countNormalizedOccurrences(systemInstruction, fact.sourceValue) > 1
    ))
    .map((fact) => fact.sourceValue)
    .filter((value, index, values) => values.indexOf(value) === index);
  const legacyHeadings = [
    'CHARACTER BASICS',
    `${character.name} PHYSICAL APPEARANCE`,
    `${character.name} CURRENTLY WEARING`,
    `${character.name} PREFERRED CLOTHING`,
    `${character.name} PERSONALITY`,
    `${character.name} CUSTOM CONTENT`,
  ];

  return Object.freeze({
    characterId: character.id,
    characterName: character.name,
    totalFacts: facts.length,
    modelFacingFacts: facts.filter((fact) => fact.modelFacing).length,
    transformedFacts: facts.filter((fact) => fact.disposition === 'transformed').length,
    suppressedFacts: facts.filter((fact) => fact.disposition === 'suppressed').length,
    debugOnlyFacts: facts.filter((fact) => fact.disposition === 'debug_only').length,
    duplicateSourceGroups,
    repeatedRenderedValues,
    legacyRawHeadingsPresent: legacyHeadings.filter((heading) => systemInstruction.includes(heading)),
  });
}

function buildCharacterPromptOutputCopyMetricFromFacts(
  facts: CharacterPromptFact[],
  assistantOutput: string,
  factSource: CharacterPromptOutputCopyMetric['factSource'],
): CharacterPromptOutputCopyMetric {
  const characterId = facts[0]?.characterId ?? 'unknown-character';
  const characterName = facts[0]?.characterName ?? 'Unknown character';
  const exactSourceValueCopies = facts
    .filter((fact) => (
      fact.sourceValue.length >= 18
      && fact.sourceValue.split(/\s+/).length >= 3
      && countNormalizedOccurrences(assistantOutput, fact.sourceValue) > 0
    ))
    .map((fact) => ({
      sourceField: fact.sourceField,
      sourceLabel: fact.sourceLabel,
      sourceValue: fact.sourceValue,
    }));
  const copiedSourceLabels = facts
    .filter((fact) => (
      fact.sourceLabel
      && fact.sourceLabel.length >= 4
      && countNormalizedOccurrences(assistantOutput, `${fact.sourceLabel}:`) > 0
    ))
    .map((fact) => ({
      sourceField: fact.sourceField,
      sourceLabel: fact.sourceLabel as string,
    }));

  return Object.freeze({
    characterId,
    characterName,
    factSource,
    exactSourceValueCopies,
    copiedSourceLabels,
  });
}

export function buildCharacterPromptOutputCopyMetric(
  character: RoleplayCharacterCardSource,
  assistantOutput: string,
): CharacterPromptOutputCopyMetric {
  return buildCharacterPromptOutputCopyMetricFromFacts(
    compileCharacterPromptFacts(character),
    assistantOutput,
    'current_card_fallback',
  );
}

export function buildCharacterPromptOutputCopyMetricsFromCapturedFacts(
  facts: CharacterPromptFact[],
  assistantOutput: string,
): CharacterPromptOutputCopyMetric[] {
  const factsByCharacter = new Map<string, CharacterPromptFact[]>();
  for (const fact of facts) {
    factsByCharacter.set(fact.characterId, [
      ...(factsByCharacter.get(fact.characterId) ?? []),
      fact,
    ]);
  }
  return [...factsByCharacter.values()].map((characterFacts) => (
    buildCharacterPromptOutputCopyMetricFromFacts(
      characterFacts,
      assistantOutput,
      'generation_captured_facts',
    )
  ));
}
