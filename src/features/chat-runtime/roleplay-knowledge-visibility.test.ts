import { describe, expect, it } from 'vitest';
import {
  classifyCharacterPromptFactVisibility,
  classifyStructuredKnowledgeCandidate,
  classifySupportEnvelopeKnowledgeFacts,
  buildResolvedCurrentSceneKnowledgeFacts,
  createKnowledgeVisibilityFact,
  KNOWLEDGE_VISIBILITY_AVAILABILITIES,
  KNOWLEDGE_VISIBILITY_DISPOSITIONS,
  KNOWLEDGE_VISIBILITY_SOURCES,
} from './roleplay-knowledge-visibility';
import {
  createCharacterPromptFact,
  type CharacterPromptFact,
} from './roleplay-character-card-facts';
import { createRoleplaySupportReviewEnvelope } from './roleplay-support-review-envelope';
import type { Character } from '@/types';

function characterFact(
  overrides: Partial<CharacterPromptFact> = {},
): CharacterPromptFact {
  const sourceValue = overrides.sourceValue ?? 'Protect vulnerable clients.';
  return createCharacterPromptFact({
    characterId: overrides.characterId ?? 'character-1',
    characterName: overrides.characterName ?? 'Mara',
    sourceField: overrides.sourceField ?? 'background.motivation',
    sourceLabel: overrides.sourceLabel,
    sourceValue,
    promptValue: overrides.value ?? sourceValue,
    runtimeUse: overrides.runtimeUse ?? 'stable_reference',
    authority: overrides.authority ?? 'saved_card_reference',
    relevance: overrides.relevance ?? 'conditional',
    visibility: overrides.visibility ?? 'character_knowledge',
    wordingPolicy: overrides.wordingPolicy ?? 'do_not_copy_phrase',
    disposition: overrides.disposition ?? 'included',
    reason: overrides.reason ?? 'creator_reference_requires_compact_nonverbatim_prompt_copy',
  });
}

describe('KnowledgeVisibilityFact', () => {
  it('locks the authored source, availability, and disposition vocabularies', () => {
    expect(KNOWLEDGE_VISIBILITY_SOURCES).toEqual([
      'card',
      'relationship',
      'backstory',
      'memory',
      'current_state',
      'latest_player_turn',
      'goal',
      'debug',
    ]);
    expect(KNOWLEDGE_VISIBILITY_AVAILABILITIES).toEqual([
      'visible_now',
      'known_established',
      'suspected_only',
      'hidden',
      'unconfirmed',
      'creator_reference',
      'private_internal',
      'debug_only',
    ]);
    expect(KNOWLEDGE_VISIBILITY_DISPOSITIONS).toEqual([
      'include',
      'downgrade',
      'withhold',
      'debug_only',
    ]);
  });

  it('creates an immutable current-scene fact with an explicit inclusion reason', () => {
    const fact = createKnowledgeVisibilityFact({
      factId: 'current-state:character-1:visible-clothing',
      characterId: 'character-1',
      source: 'current_state',
      text: 'Visible clothing: top=white shirt; bottom=black trousers.',
      availability: 'visible_now',
      modelFacing: true,
      disposition: 'include',
      reason: 'resolved_current_scene_fact',
    });

    expect(fact).toEqual({
      factId: 'current-state:character-1:visible-clothing',
      characterId: 'character-1',
      source: 'current_state',
      text: 'Visible clothing: top=white shirt; bottom=black trousers.',
      availability: 'visible_now',
      modelFacing: true,
      disposition: 'include',
      reason: 'resolved_current_scene_fact',
    });
    expect(Object.isFrozen(fact)).toBe(true);
  });

  it('keeps a stored creator reference inspectable without making it model-facing', () => {
    const fact = createKnowledgeVisibilityFact({
      factId: 'card:character-1:private-reference',
      characterId: 'character-1',
      source: 'card',
      text: 'Creator-authored private relationship detail.',
      availability: 'creator_reference',
      modelFacing: false,
      disposition: 'withhold',
      reason: 'not_established_as_character_knowledge',
    });

    expect(fact).toMatchObject({
      availability: 'creator_reference',
      modelFacing: false,
      disposition: 'withhold',
    });
    expect(fact.text).toBe('Creator-authored private relationship detail.');
  });

  it('supports private and debug rows without deleting their source text', () => {
    const privateFact = createKnowledgeVisibilityFact({
      factId: 'relationship:character-1:private-motive',
      characterId: 'character-1',
      source: 'relationship',
      text: 'The character privately distrusts the envoy.',
      availability: 'private_internal',
      modelFacing: false,
      disposition: 'debug_only',
      reason: 'private_motive_not_available_as_shared_scene_fact',
    });

    expect(privateFact.text).toBe('The character privately distrusts the envoy.');
    expect(privateFact.modelFacing).toBe(false);
    expect(privateFact.disposition).toBe('debug_only');
  });

  it.each(['factId', 'text', 'reason'] as const)('rejects a blank required %s', (fieldName) => {
    const input = {
      factId: 'fact-1',
      source: 'memory' as const,
      text: 'A durable event.',
      availability: 'known_established' as const,
      modelFacing: true,
      disposition: 'include' as const,
      reason: 'accepted_durable_memory',
      [fieldName]: '   ',
    };

    expect(() => createKnowledgeVisibilityFact(input)).toThrow(
      `KnowledgeVisibilityFact requires ${fieldName}`,
    );
  });

  it('builds resolved visible scene facts without exposing undergarments', () => {
    const character = {
      id: 'character-1',
      location: 'Kitchen',
      scenePosition: 'Standing beside the counter',
      currentlyWearing: {
        top: 'White shirt',
        bottom: 'Black trousers',
        undergarments: 'Red lace underwear',
        miscellaneous: 'Silver watch',
      },
      physicalAppearance: {
        temporaryConditions: 'Small cut on the right palm',
      },
    } as Character;

    const facts = buildResolvedCurrentSceneKnowledgeFacts(character);

    expect(facts).toEqual(expect.arrayContaining([
      expect.objectContaining({
        factId: 'current-state:character-1:location',
        sourceId: 'effective-character:character-1:location',
        text: 'Kitchen',
        availability: 'visible_now',
        disposition: 'include',
      }),
      expect.objectContaining({
        factId: 'current-state:character-1:physicalAppearance.temporaryConditions',
        text: 'Small cut on the right palm',
        availability: 'unconfirmed',
        modelFacing: false,
        disposition: 'withhold',
        reason: 'temporary_condition_requires_explicit_observability_evidence',
      }),
    ]));
    expect(facts.map((fact) => fact.text)).not.toContain('Red lace underwear');
    expect(facts.every((fact) => Object.isFrozen(fact))).toBe(true);
  });

  it('classifies established identity without creating a second authority contract', () => {
    const result = classifyCharacterPromptFactVisibility(characterFact({
      sourceField: 'name',
      sourceValue: 'Mara',
      value: 'Mara',
      runtimeUse: 'identity',
      authority: 'saved_card_identity',
      relevance: 'always',
      visibility: 'broad_reference',
      wordingPolicy: 'compact_fact',
      disposition: 'included',
      reason: 'durable_character_identity',
    }));

    expect(result).toMatchObject({
      source: 'card',
      text: 'Mara',
      availability: 'known_established',
      modelFacing: true,
      disposition: 'include',
      reason: 'durable_character_identity_is_established',
    });
    expect(result).not.toHaveProperty('authority');
    expect(result).not.toHaveProperty('receipt');
  });

  it('keeps stable card, relationship, and backstory facts at creator-reference authority', () => {
    const card = classifyCharacterPromptFactVisibility(characterFact({
      sourceField: 'physicalAppearance.eyeColor',
      sourceValue: 'Grey',
      value: 'Grey',
    }));
    const relationship = classifyCharacterPromptFactVisibility(characterFact({
      sourceField: 'relationships._extras[0].value',
      sourceLabel: 'Avery',
      sourceValue: 'Distrust mixed with attraction.',
      value: 'Distrust mixed with attraction.',
      runtimeUse: 'relationship',
    }));
    const backstory = classifyCharacterPromptFactVisibility(characterFact());

    expect(card).toMatchObject({ source: 'card', availability: 'creator_reference', disposition: 'downgrade' });
    expect(relationship).toMatchObject({ source: 'relationship', availability: 'creator_reference', disposition: 'downgrade' });
    expect(backstory).toMatchObject({ source: 'backstory', availability: 'creator_reference', disposition: 'downgrade' });
  });

  it('withholds private, goal, and stale saved-state facts without changing source text', () => {
    const privateFact = characterFact({
      sourceField: 'secrets._extras[0].value',
      sourceValue: 'Owes money to the suspect.',
      value: 'Owes money to the suspect.',
      runtimeUse: 'private_reference',
      authority: 'visibility_policy',
      visibility: 'private_reference',
      wordingPolicy: 'withhold',
      disposition: 'debug_only',
      reason: 'private_saved_fact_requires_explicit_visibility_or_knowledge_policy',
    });
    const goalFact = characterFact({
      sourceField: 'goals[0].desiredOutcome',
      sourceValue: 'Identify who planted the evidence.',
      value: 'Identify who planted the evidence.',
      runtimeUse: 'goal',
      authority: 'goal_selector',
      visibility: 'debug_only',
      wordingPolicy: 'withhold',
      disposition: 'debug_only',
      reason: 'goal_selector_owns_live_goal_prompt_material',
    });
    const savedStateFact = characterFact({
      sourceField: 'location',
      sourceValue: 'Library',
      value: 'Library',
      runtimeUse: 'current_state',
      authority: 'current_state',
      relevance: 'current',
      visibility: 'current_scene',
      wordingPolicy: 'withhold',
      disposition: 'debug_only',
      reason: 'saved_card_copy_is_not_the_live_current_state_authority',
    });

    expect(classifyCharacterPromptFactVisibility(privateFact)).toMatchObject({
      text: 'Owes money to the suspect.',
      availability: 'private_internal',
      modelFacing: false,
      disposition: 'withhold',
    });
    expect(classifyCharacterPromptFactVisibility(goalFact)).toMatchObject({
      source: 'goal',
      modelFacing: false,
      reason: 'goal_selector_owns_model_facing_exposure',
    });
    expect(classifyCharacterPromptFactVisibility(savedStateFact)).toMatchObject({
      source: 'current_state',
      availability: 'unconfirmed',
      modelFacing: false,
    });
    expect(privateFact.sourceValue).toBe('Owes money to the suspect.');
  });

  it('classifies structured story sources conservatively without parsing their prose', () => {
    const relationship = classifyStructuredKnowledgeCandidate({
      factId: 'relationship-1',
      characterId: 'character-1',
      source: 'relationship',
      text: 'A true relationship fact that is not necessarily known.',
    });
    const memory = classifyStructuredKnowledgeCandidate({
      factId: 'memory-1',
      source: 'memory',
      text: 'A durable event retained for story continuity.',
    });
    const latestTurn = classifyStructuredKnowledgeCandidate({
      factId: 'turn-1',
      source: 'latest_player_turn',
      text: 'The player reveals a locked box.',
    });

    expect(relationship).toMatchObject({ availability: 'creator_reference', modelFacing: true, disposition: 'downgrade' });
    expect(memory).toMatchObject({ availability: 'creator_reference', modelFacing: true, disposition: 'downgrade' });
    expect(latestTurn).toMatchObject({
      availability: 'unconfirmed',
      modelFacing: false,
      disposition: 'withhold',
      reason: 'current_scene_availability_requires_phase3_evidence',
    });
  });

  it('does not turn accepted support output into automatic character knowledge', () => {
    const memoryEnvelope = createRoleplaySupportReviewEnvelope({
      worker: 'memory_extraction',
      accepted: [{
        id: 'memory-1',
        label: 'Accepted memory',
        evidence: 'The player explicitly established a durable preference.',
        reason: 'accepted_with_source_evidence',
      }],
      rejected: [{ id: 'memory-2', label: 'Rejected invention', reason: 'unsupported_overreach' }],
      omitted: [{ id: 'memory-3', label: 'Omitted duplicate', reason: 'near_duplicate' }],
      persistence: { status: 'persisted', targets: ['memory-row-1'], reason: 'persisted' },
      readiness: 'completed',
      futurePromptImpact: { eligible: true, targets: ['memory'], reason: 'persisted_memory' },
    });
    const stateEnvelope = createRoleplaySupportReviewEnvelope({
      worker: 'character_state',
      accepted: [{ id: 'state-1', label: 'Accepted state candidate', reason: 'accepted' }],
      persistence: { status: 'persisted', targets: ['state-row-1'], reason: 'persisted' },
      readiness: 'completed',
      futurePromptImpact: { eligible: true, targets: ['current_state'], reason: 'persisted_state' },
    });

    const memoryFacts = classifySupportEnvelopeKnowledgeFacts(memoryEnvelope);
    const stateFacts = classifySupportEnvelopeKnowledgeFacts(stateEnvelope);

    expect(memoryFacts).toEqual(expect.arrayContaining([
      expect.objectContaining({
        factId: 'support:memory_extraction:accepted:memory-1',
        source: 'memory',
        availability: 'creator_reference',
        modelFacing: true,
        disposition: 'downgrade',
      }),
      expect.objectContaining({
        factId: 'support:memory_extraction:non-accepted:memory-2',
        source: 'debug',
        availability: 'debug_only',
        modelFacing: false,
      }),
    ]));
    expect(stateFacts[0]).toMatchObject({
      source: 'current_state',
      availability: 'unconfirmed',
      modelFacing: false,
      disposition: 'withhold',
      reason: 'support_acceptance_does_not_establish_character_knowledge',
    });
  });
});
