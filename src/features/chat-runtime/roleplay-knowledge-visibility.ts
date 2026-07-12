export const KNOWLEDGE_VISIBILITY_SOURCES = [
  'card',
  'relationship',
  'backstory',
  'memory',
  'current_state',
  'latest_player_turn',
  'goal',
  'debug',
] as const;

export type KnowledgeVisibilitySource = typeof KNOWLEDGE_VISIBILITY_SOURCES[number];

export const KNOWLEDGE_VISIBILITY_AVAILABILITIES = [
  'visible_now',
  'known_established',
  'suspected_only',
  'hidden',
  'unconfirmed',
  'creator_reference',
  'private_internal',
  'debug_only',
] as const;

export type KnowledgeVisibilityAvailability =
  typeof KNOWLEDGE_VISIBILITY_AVAILABILITIES[number];

export const KNOWLEDGE_VISIBILITY_DISPOSITIONS = [
  'include',
  'downgrade',
  'withhold',
  'debug_only',
] as const;

export type KnowledgeVisibilityDisposition =
  typeof KNOWLEDGE_VISIBILITY_DISPOSITIONS[number];

/**
 * Per-character availability decision for an app-known roleplay fact.
 *
 * This does not replace RoleplaySourceReceipt, CharacterPromptFact, or the
 * user-state authority classifier. Those contracts own rendered-source
 * lineage, saved-card shaping, and user-owned claims respectively. This row
 * records whether one fact is available to the active character for the
 * current response while leaving the stored source intact.
 */
export type KnowledgeVisibilityFact = Readonly<{
  factId: string;
  characterId?: string;
  sourceId?: string;
  sourceMessageId?: string;
  sourceGenerationId?: string;
  source: KnowledgeVisibilitySource;
  text: string;
  availability: KnowledgeVisibilityAvailability;
  modelFacing: boolean;
  disposition: KnowledgeVisibilityDisposition;
  reason: string;
}>;

export type CreateKnowledgeVisibilityFactInput = KnowledgeVisibilityFact;

export type StructuredKnowledgeCandidate = Readonly<{
  factId: string;
  characterId?: string;
  source: KnowledgeVisibilitySource;
  text: string;
}>;

function requiredText(value: string, fieldName: string): string {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (!normalized) throw new Error(`KnowledgeVisibilityFact requires ${fieldName}`);
  return normalized;
}

export function createKnowledgeVisibilityFact(
  input: CreateKnowledgeVisibilityFactInput,
): KnowledgeVisibilityFact {
  return Object.freeze({
    factId: requiredText(input.factId, 'factId'),
    characterId: input.characterId?.trim() || undefined,
    sourceId: input.sourceId?.trim() || undefined,
    sourceMessageId: input.sourceMessageId?.trim() || undefined,
    sourceGenerationId: input.sourceGenerationId?.trim() || undefined,
    source: input.source,
    text: requiredText(input.text, 'text'),
    availability: input.availability,
    modelFacing: input.modelFacing,
    disposition: input.disposition,
    reason: requiredText(input.reason, 'reason'),
  });
}

type ResolvedCurrentSceneCharacter = Pick<
  Character | SideCharacter,
  'id' | 'location' | 'scenePosition' | 'currentlyWearing' | 'physicalAppearance'
>;

type CurrentSceneField = Readonly<{
  field: string;
  value: string | undefined;
  availability: KnowledgeVisibilityAvailability;
  modelFacing: boolean;
  disposition: KnowledgeVisibilityDisposition;
  reason: string;
}>;

function normalizedOptionalText(value: string | undefined): string | undefined {
  const normalized = value?.replace(/\s+/g, ' ').trim();
  return normalized || undefined;
}

/**
 * Builds debug-ready visibility decisions from the already resolved effective
 * character object. Hidden undergarments are intentionally not inspected.
 */
export function buildResolvedCurrentSceneKnowledgeFacts(
  character: ResolvedCurrentSceneCharacter,
): KnowledgeVisibilityFact[] {
  const fields: CurrentSceneField[] = [
    {
      field: 'location',
      value: character.location,
      availability: 'visible_now',
      modelFacing: true,
      disposition: 'include',
      reason: 'resolved_current_scene_location',
    },
    {
      field: 'scenePosition',
      value: character.scenePosition,
      availability: 'visible_now',
      modelFacing: true,
      disposition: 'include',
      reason: 'resolved_current_scene_position',
    },
    {
      field: 'currentlyWearing.top',
      value: character.currentlyWearing?.top,
      availability: 'visible_now',
      modelFacing: true,
      disposition: 'include',
      reason: 'resolved_visible_clothing_top',
    },
    {
      field: 'currentlyWearing.bottom',
      value: character.currentlyWearing?.bottom,
      availability: 'visible_now',
      modelFacing: true,
      disposition: 'include',
      reason: 'resolved_visible_clothing_bottom',
    },
    {
      field: 'physicalAppearance.temporaryConditions',
      value: character.physicalAppearance?.temporaryConditions,
      availability: 'unconfirmed',
      modelFacing: false,
      disposition: 'withhold',
      reason: 'temporary_condition_requires_explicit_observability_evidence',
    },
  ];

  return fields.flatMap((field) => {
    const text = normalizedOptionalText(field.value);
    if (!text) return [];
    const sourceId = `effective-character:${character.id}:${field.field}`;
    return [createKnowledgeVisibilityFact({
      factId: `current-state:${character.id}:${field.field}`,
      characterId: character.id,
      sourceId,
      source: 'current_state',
      text,
      availability: field.availability,
      modelFacing: field.modelFacing,
      disposition: field.disposition,
      reason: field.reason,
    })];
  });
}

function sourceForCharacterPromptFact(fact: CharacterPromptFact): KnowledgeVisibilitySource {
  if (fact.runtimeUse === 'relationship' || fact.sourceField.startsWith('relationships.')) {
    return 'relationship';
  }
  if (
    fact.sourceField === 'roleDescription'
    || fact.sourceField.startsWith('background.')
    || fact.sourceField.startsWith('keyLifeEvents.')
  ) {
    return 'backstory';
  }
  if (fact.runtimeUse === 'goal') return 'goal';
  if (fact.runtimeUse === 'current_state') return 'current_state';
  if (fact.runtimeUse === 'debug_only') return 'debug';
  return 'card';
}

export function classifyCharacterPromptFactVisibility(
  fact: CharacterPromptFact,
): KnowledgeVisibilityFact {
  const source = sourceForCharacterPromptFact(fact);

  if (fact.runtimeUse === 'identity') {
    return createKnowledgeVisibilityFact({
      factId: `character-prompt-fact:${fact.characterId}:${fact.sourceField}`,
      characterId: fact.characterId,
      source,
      text: fact.sourceValue,
      availability: 'known_established',
      modelFacing: fact.modelFacing,
      disposition: fact.modelFacing ? 'include' : 'withhold',
      reason: fact.modelFacing
        ? 'durable_character_identity_is_established'
        : 'character_prompt_fact_not_model_facing',
    });
  }

  if (fact.runtimeUse === 'private_reference') {
    return createKnowledgeVisibilityFact({
      factId: `character-prompt-fact:${fact.characterId}:${fact.sourceField}`,
      characterId: fact.characterId,
      source,
      text: fact.sourceValue,
      availability: 'private_internal',
      modelFacing: false,
      disposition: 'withhold',
      reason: 'private_card_fact_requires_explicit_character_availability',
    });
  }

  if (fact.runtimeUse === 'goal') {
    return createKnowledgeVisibilityFact({
      factId: `character-prompt-fact:${fact.characterId}:${fact.sourceField}`,
      characterId: fact.characterId,
      source: 'goal',
      text: fact.sourceValue,
      availability: 'creator_reference',
      modelFacing: false,
      disposition: 'withhold',
      reason: 'goal_selector_owns_model_facing_exposure',
    });
  }

  if (fact.runtimeUse === 'current_state') {
    return createKnowledgeVisibilityFact({
      factId: `character-prompt-fact:${fact.characterId}:${fact.sourceField}`,
      characterId: fact.characterId,
      source: 'current_state',
      text: fact.sourceValue,
      availability: 'unconfirmed',
      modelFacing: false,
      disposition: 'withhold',
      reason: 'saved_card_state_awaits_resolved_current_scene_evidence',
    });
  }

  if (fact.runtimeUse === 'debug_only') {
    return createKnowledgeVisibilityFact({
      factId: `character-prompt-fact:${fact.characterId}:${fact.sourceField}`,
      characterId: fact.characterId,
      source: 'debug',
      text: fact.sourceValue,
      availability: 'debug_only',
      modelFacing: false,
      disposition: 'debug_only',
      reason: 'character_prompt_fact_is_debug_only',
    });
  }

  return createKnowledgeVisibilityFact({
    factId: `character-prompt-fact:${fact.characterId}:${fact.sourceField}`,
    characterId: fact.characterId,
    source,
    text: fact.sourceValue,
    availability: 'creator_reference',
    modelFacing: fact.modelFacing,
    disposition: fact.modelFacing ? 'downgrade' : 'withhold',
    reason: fact.modelFacing
      ? 'creator_reference_is_writer_context_not_automatic_character_knowledge'
      : 'character_prompt_fact_not_model_facing',
  });
}

export function classifyStructuredKnowledgeCandidate(
  candidate: StructuredKnowledgeCandidate,
): KnowledgeVisibilityFact {
  if (candidate.source === 'debug') {
    return createKnowledgeVisibilityFact({
      ...candidate,
      availability: 'debug_only',
      modelFacing: false,
      disposition: 'debug_only',
      reason: 'structured_debug_fact_is_not_prompt_content',
    });
  }
  if (candidate.source === 'goal') {
    return createKnowledgeVisibilityFact({
      ...candidate,
      availability: 'creator_reference',
      modelFacing: false,
      disposition: 'withhold',
      reason: 'goal_selector_owns_model_facing_exposure',
    });
  }
  if (candidate.source === 'current_state' || candidate.source === 'latest_player_turn') {
    return createKnowledgeVisibilityFact({
      ...candidate,
      availability: 'unconfirmed',
      modelFacing: false,
      disposition: 'withhold',
      reason: 'current_scene_availability_requires_phase3_evidence',
    });
  }
  return createKnowledgeVisibilityFact({
    ...candidate,
    availability: 'creator_reference',
    modelFacing: true,
    disposition: 'downgrade',
    reason: 'structured_story_fact_is_writer_reference_not_automatic_character_knowledge',
  });
}

function sourceForSupportWorker(worker: RoleplaySupportWorker): KnowledgeVisibilitySource {
  if (worker === 'character_state') return 'current_state';
  if (worker === 'memory_extraction' || worker === 'day_memory_compression') return 'memory';
  if (worker === 'goal_progress') return 'goal';
  return 'debug';
}

function supportFactText(item: RoleplaySupportReviewItem): string {
  return item.evidence?.trim() || item.label;
}

export function classifySupportEnvelopeKnowledgeFacts(
  envelope: RoleplaySupportReviewEnvelope,
): KnowledgeVisibilityFact[] {
  const source = sourceForSupportWorker(envelope.worker);
  const promptEligible = isRoleplaySupportReviewEnvelopePromptEligible(envelope);
  const accepted = envelope.accepted.map((item) => {
    const candidate: StructuredKnowledgeCandidate = {
      factId: `support:${envelope.worker}:accepted:${item.id}`,
      characterId: item.userCharacterId,
      source,
      text: supportFactText(item),
    };

    if (source === 'memory' && promptEligible) {
      return createKnowledgeVisibilityFact({
        ...candidate,
        availability: 'creator_reference',
        modelFacing: true,
        disposition: 'downgrade',
        reason: 'persisted_support_memory_is_writer_reference_not_automatic_character_knowledge',
      });
    }

    return createKnowledgeVisibilityFact({
      ...candidate,
      availability: source === 'debug' ? 'debug_only' : 'unconfirmed',
      modelFacing: false,
      disposition: source === 'debug' ? 'debug_only' : 'withhold',
      reason: source === 'goal'
        ? 'goal_selector_owns_model_facing_exposure'
        : 'support_acceptance_does_not_establish_character_knowledge',
    });
  });
  const nonAccepted = [...envelope.rejected, ...envelope.omitted].map((item) => (
    createKnowledgeVisibilityFact({
      factId: `support:${envelope.worker}:non-accepted:${item.id}`,
      characterId: item.userCharacterId,
      source: 'debug',
      text: supportFactText(item),
      availability: 'debug_only',
      modelFacing: false,
      disposition: 'debug_only',
      reason: `support_candidate_not_accepted:${item.reason}`,
    })
  ));

  return [...accepted, ...nonAccepted];
}
import type { CharacterPromptFact } from './roleplay-character-card-facts';
import type { Character, SideCharacter } from '@/types';
import {
  isRoleplaySupportReviewEnvelopePromptEligible,
  type RoleplaySupportReviewEnvelope,
  type RoleplaySupportReviewItem,
  type RoleplaySupportWorker,
} from './roleplay-support-review-envelope';
