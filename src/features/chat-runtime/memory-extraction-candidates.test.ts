import { describe, expect, it } from 'vitest';

import {
  MEMORY_EXTRACTION_RESPONSE_CONTRACT,
  MEMORY_EXTRACTION_RESPONSE_VERSION,
  parseMemoryExtractionResponseV1,
  reviewRoleplayMemoryExtractionCandidates,
} from './roleplay-memory-user-state-review';

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
  const workerArtifact = {
    worker: 'extract-memory-events',
    contract: MEMORY_EXTRACTION_RESPONSE_CONTRACT,
    version: MEMORY_EXTRACTION_RESPONSE_VERSION,
    artifactVersion: 'extract-memory-events-candidates-v1',
  };

  it('accepts only the versioned candidate-only worker response', () => {
    expect(parseMemoryExtractionResponseV1({
      contract: MEMORY_EXTRACTION_RESPONSE_CONTRACT,
      version: MEMORY_EXTRACTION_RESPONSE_VERSION,
      workerArtifact,
      candidates: [candidate({})],
    })).toMatchObject({
      ok: true,
      response: {
        contract: MEMORY_EXTRACTION_RESPONSE_CONTRACT,
        version: MEMORY_EXTRACTION_RESPONSE_VERSION,
        workerArtifact,
      },
    });
  });

  it.each([
    [{ version: 1, workerArtifact, candidates: [] }, 'memory_response_contract_mismatch'],
    [{ contract: MEMORY_EXTRACTION_RESPONSE_CONTRACT, version: 2, workerArtifact, candidates: [] }, 'memory_response_version_mismatch'],
    [{ contract: MEMORY_EXTRACTION_RESPONSE_CONTRACT, version: 1, workerArtifact, events: [], candidates: [] }, 'memory_response_contains_obsolete_aliases'],
    [{ contract: MEMORY_EXTRACTION_RESPONSE_CONTRACT, version: 1, workerArtifact, extractedEvents: [], candidates: [] }, 'memory_response_contains_obsolete_aliases'],
    [{ contract: MEMORY_EXTRACTION_RESPONSE_CONTRACT, version: 1, workerArtifact, userStateReviews: [], candidates: [] }, 'memory_response_contains_obsolete_aliases'],
    [{ contract: MEMORY_EXTRACTION_RESPONSE_CONTRACT, version: 1, workerArtifact, candidates: null }, 'memory_response_candidates_not_array'],
    [{ contract: MEMORY_EXTRACTION_RESPONSE_CONTRACT, version: 1, candidates: [] }, 'memory_response_worker_artifact_invalid'],
    [{
      contract: MEMORY_EXTRACTION_RESPONSE_CONTRACT,
      version: 1,
      workerArtifact: { ...workerArtifact, artifactVersion: 'extract-memory-events-events-v0' },
      candidates: [],
    }, 'memory_response_worker_artifact_invalid'],
  ] as const)('fails closed for a mismatched or obsolete response %#', (response, reason) => {
    expect(parseMemoryExtractionResponseV1(response)).toEqual({ ok: false, reason });
  });

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

  it('preserves verified source identity and authority on an early rejected candidate', () => {
    const review = reviewRoleplayMemoryExtractionCandidates({
      candidates: [candidate({
        decision: 'rejected',
        rejectionReason: 'worker_rejected_candidate',
      })],
      userSourceMessage: userSource,
      assistantSourceMessage: assistantSource,
      assistantSourceAccepted: true,
      userCharacters: [{ id: 'avery', name: 'Avery' }],
      isNearDuplicate: () => false,
    });

    expect(review.candidateReviews[0]).toMatchObject({
      accepted: false,
      evidenceBasis: 'explicit_user_authorship',
      authority: 'raw_user_fact',
      modelFacingAction: 'reject_from_persistence',
      sourceMessageId: 'user-1',
      sourceGenerationId: 'user-generation-1',
      userCharacterId: 'avery',
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

  it('preserves accepted candidate identity after an omitted duplicate', () => {
    const review = reviewRoleplayMemoryExtractionCandidates({
      candidates: [
        candidate({ id: 'accepted-user-fact' }),
        candidate({
          id: 'duplicate-user-fact',
          candidateText: 'Duplicate candidate.',
        }),
        candidate({
          id: 'accepted-assistant-observation',
          candidateText: 'Mara recorded the promise.',
          durabilityCategory: 'durable_scene_or_world_fact',
          sourceClassification: 'accepted_assistant_observable_change',
          evidence: 'Mara writes the promise down',
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
      isNearDuplicate: (_accepted, value) => value === 'Duplicate candidate.',
    });

    expect(review.candidateReviews).toEqual([
      expect.objectContaining({
        id: 'accepted-user-fact',
        accepted: true,
        sourceMessageId: 'user-1',
        sourceGenerationId: 'user-generation-1',
      }),
      expect.objectContaining({
        id: 'accepted-assistant-observation',
        accepted: true,
        sourceMessageId: 'assistant-1',
        sourceGenerationId: 'assistant-generation-1',
      }),
    ]);
    expect(review.omittedCandidates).toEqual([
      expect.objectContaining({
        id: 'duplicate-user-fact',
        reason: 'near_duplicate_existing_memory',
      }),
    ]);
  });
});
