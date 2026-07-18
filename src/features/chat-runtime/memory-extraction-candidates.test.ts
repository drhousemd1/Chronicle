import { describe, expect, it } from 'vitest';

import { reviewRoleplayMemoryExtractionCandidates } from './roleplay-memory-user-state-review';

const userSource = {
  id: 'user-1',
  generationId: 'user-generation-1',
  text: 'I tell Mara that I will never return to the cellar.',
};

const assistantSource = {
  id: 'assistant-1',
  generationId: 'assistant-generation-1',
  text: 'Mara writes the promise down. Avery visibly shivers beside the cellar door.',
};

function candidate(overrides: Record<string, unknown>) {
  return {
    id: 'candidate-1',
    candidateText: 'Avery promised Mara never to return to the cellar.',
    decision: 'accepted',
    durabilityCategory: 'durable_preference_or_boundary',
    sourceClassification: 'raw_user_fact',
    evidence: 'I will never return to the cellar',
    rejectionReason: null,
    appliesToUserCharacter: true,
    userCharacterName: 'Avery',
    claimType: 'intent',
    sourceRole: 'user',
    evidenceBasis: 'explicit_user_authorship',
    authorityReason: 'The player explicitly authored the promise.',
    ...overrides,
  };
}

describe('MemoryExtractionResponseV1 candidate review', () => {
  it('accepts a durable source-backed candidate through the shared authority classifier', () => {
    const review = reviewRoleplayMemoryExtractionCandidates({
      candidates: [candidate({})],
      userSourceMessage: userSource,
      assistantSourceMessage: assistantSource,
      assistantSourceAccepted: true,
      userCharacters: [{ id: 'avery', name: 'Avery' }],
      isNearDuplicate: () => false,
    });

    expect(review.acceptedEvents).toEqual([
      'Avery promised Mara never to return to the cellar.',
    ]);
    expect(review.candidateReviews[0]).toMatchObject({
      id: 'candidate-1',
      accepted: true,
      durabilityCategory: 'durable_preference_or_boundary',
      sourceClassification: 'raw_user_fact',
      authority: 'raw_user_fact',
    });
  });

  it('keeps semantic rejections visible without treating them as parse failures', () => {
    const review = reviewRoleplayMemoryExtractionCandidates({
      candidates: [
        candidate({
          id: 'static-description',
          candidateText: 'Mara has black hair.',
          decision: 'rejected',
          durabilityCategory: 'not_memory',
          sourceClassification: 'static_descriptor',
          evidence: 'Mara has black hair',
          rejectionReason: 'static_character_descriptor',
          appliesToUserCharacter: false,
          userCharacterName: null,
          claimType: null,
          sourceRole: 'assistant',
          evidenceBasis: 'not_applicable',
        }),
      ],
      userSourceMessage: userSource,
      assistantSourceMessage: assistantSource,
      assistantSourceAccepted: true,
      userCharacters: [{ id: 'avery', name: 'Avery' }],
      isNearDuplicate: () => false,
    });

    expect(review.acceptedEvents).toEqual([]);
    expect(review.candidateReviews[0]).toMatchObject({
      id: 'static-description',
      accepted: false,
      reason: 'static_character_descriptor',
      sourceClassification: 'static_descriptor',
      durabilityCategory: 'not_memory',
    });
  });

  it('fails closed for malformed, temporary, unsafe, duplicate, or stale candidates', () => {
    const review = reviewRoleplayMemoryExtractionCandidates({
      candidates: [
        { id: 'malformed', candidateText: 'Missing fields.' },
        candidate({
          id: 'temporary',
          candidateText: 'Avery is standing by the cellar.',
          durabilityCategory: 'temporary_scene_state',
        }),
        candidate({
          id: 'interpretation',
          candidateText: 'Avery secretly wanted Mara to follow.',
          sourceClassification: 'assistant_interpretation',
          sourceRole: 'assistant',
          evidenceBasis: 'in_character_interpretation',
          evidence: 'Avery visibly shivers',
        }),
        candidate({ id: 'duplicate' }),
      ],
      userSourceMessage: userSource,
      assistantSourceMessage: assistantSource,
      assistantSourceAccepted: false,
      userCharacters: [{ id: 'avery', name: 'Avery' }],
      isNearDuplicate: (_accepted, value) => value.includes('promised Mara'),
    });

    expect(review.acceptedEvents).toEqual([]);
    expect(review.candidateReviews.map((entry) => entry.reason)).toEqual([
      'malformed_memory_candidate',
      'candidate_not_durable',
      'unsafe_source_classification',
    ]);
    expect(review.omittedCandidates).toEqual([
      expect.objectContaining({
        id: 'duplicate',
        reason: 'near_duplicate_existing_memory',
      }),
    ]);
  });
});
