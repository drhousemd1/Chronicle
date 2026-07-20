import { describe, expect, it, vi } from 'vitest';

import {
  ROLEPLAY_REVIEWED_CHARACTER_STATE_FIELDS,
  areRoleplayCharacterStateSourcesCurrent,
  applyPersistedRoleplayCharacterStateSnapshotToRuntime,
  buildRoleplayCharacterStateEligibilityRows,
  buildRoleplayCharacterStateApplyReceipt,
  buildRoleplayReviewedCharacterStateContract,
  getRoleplayReviewedCharacterStatePersistenceCandidates,
  isRoleplayReviewedCharacterStatePersistenceCandidate,
  isRoleplayReviewedCharacterStateField,
  type RoleplayCharacterStateApplyOutcome,
} from './roleplay-character-state-review';
import { projectPlayerTurnVisibility } from './player-turn-visibility';

describe('reviewed character-state contract', () => {
  it('requires both assistant and user source generations to remain current', () => {
    const currentSources = new Map([
      ['assistant-message-1', 'assistant-generation-1'],
      ['user-message-1', 'user-generation-1'],
    ]);
    const isSourceCurrent = (messageId?: string, generationId?: string) => (
      Boolean(messageId && generationId)
      && currentSources.get(messageId as string) === generationId
    );

    expect(areRoleplayCharacterStateSourcesCurrent({
      sourceAssistantMessageId: 'assistant-message-1',
      sourceAssistantGenerationId: 'assistant-generation-1',
      sourceUserMessageId: 'user-message-1',
      sourceUserGenerationId: 'user-generation-1',
      isSourceCurrent,
    })).toBe(true);
    expect(areRoleplayCharacterStateSourcesCurrent({
      sourceAssistantMessageId: 'assistant-message-1',
      sourceAssistantGenerationId: 'assistant-generation-1',
      sourceUserMessageId: 'user-message-1',
      sourceUserGenerationId: 'user-generation-old',
      isSourceCurrent,
    })).toBe(false);
    expect(areRoleplayCharacterStateSourcesCurrent({
      sourceAssistantMessageId: 'assistant-message-1',
      sourceAssistantGenerationId: 'assistant-generation-1',
      sourceUserMessageId: 'user-message-1',
      isSourceCurrent,
    })).toBe(false);
    expect(areRoleplayCharacterStateSourcesCurrent({
      sourceAssistantMessageId: 'assistant-message-1',
      sourceAssistantGenerationId: 'assistant-generation-old',
      sourceUserMessageId: 'user-message-1',
      sourceUserGenerationId: 'user-generation-1',
      isSourceCurrent,
    })).toBe(false);
  });

  it('admits only complete accepted reviewed candidates to the persistence boundary', () => {
    const reviewedCandidate = {
      reviewStatus: 'accepted_reviewed_candidate' as const,
      character: 'Avery',
      field: 'location' as const,
      value: 'Kitchen',
      evidence: 'Avery enters the kitchen.',
      confidence: 0.96,
    };

    expect(isRoleplayReviewedCharacterStatePersistenceCandidate(reviewedCandidate)).toBe(true);
    expect(isRoleplayReviewedCharacterStatePersistenceCandidate({
      ...reviewedCandidate,
      reviewStatus: 'raw_model_update',
    })).toBe(false);
    expect(isRoleplayReviewedCharacterStatePersistenceCandidate({
      ...reviewedCandidate,
      field: 'assignedDialogue',
    })).toBe(false);
    expect(isRoleplayReviewedCharacterStatePersistenceCandidate({
      ...reviewedCandidate,
      evidence: '',
    })).toBe(false);
    expect(isRoleplayReviewedCharacterStatePersistenceCandidate({
      ...reviewedCandidate,
      confidence: Number.NaN,
    })).toBe(false);
  });

  it('records deterministic eligibility reasons without pronoun-only inference', () => {
    const rows = buildRoleplayCharacterStateEligibilityRows({
      userMessage: '[Avery] I call for Red and tell her to follow me. She nods.',
      assistantMessage: 'Morgan enters after them.',
      taggedSpeakerNames: ['Avery'],
      mainCharacters: [
        { id: 'avery', name: 'Avery' },
        { id: 'scarlet', name: 'Scarlet', nicknames: 'Red' },
        { id: 'morgan', name: 'Morgan', previousNames: ['Mara'] },
        { id: 'pronoun-only', name: 'Taylor' },
      ],
      sideCharacters: [],
    });

    expect(rows).toEqual([
      expect.objectContaining({ characterId: 'avery', reasons: ['speaker_tag', 'name_match'] }),
      expect.objectContaining({ characterId: 'scarlet', reasons: ['nickname_match'] }),
      expect.objectContaining({ characterId: 'morgan', reasons: ['name_match'] }),
    ]);
    expect(rows.some((row) => row.characterId === 'pronoun-only')).toBe(false);
  });

  it('records previous-name matches independently', () => {
    expect(buildRoleplayCharacterStateEligibilityRows({
      userMessage: 'I still remember when Morgan went by Mara.',
      assistantMessage: '',
      taggedSpeakerNames: [],
      mainCharacters: [{ id: 'morgan', name: 'Morgan', previousNames: ['Mara'] }],
      sideCharacters: [],
    })).toEqual([expect.objectContaining({
      characterId: 'morgan',
      reasons: ['name_match', 'previous_name_match'],
    })]);
  });

  it('locks the v1 persistence fields and apply receipt outcomes', () => {
    expect(ROLEPLAY_REVIEWED_CHARACTER_STATE_FIELDS).toEqual(['location', 'scenePosition']);
    expect(isRoleplayReviewedCharacterStateField('location')).toBe(true);
    expect(isRoleplayReviewedCharacterStateField('scenePosition')).toBe(true);
    for (const unsupportedUserStateField of [
      'consent',
      'preference',
      'voluntaryAction',
      'assignedDialogue',
      'internalThought',
    ]) {
      expect(isRoleplayReviewedCharacterStateField(unsupportedUserStateField)).toBe(false);
    }

    const outcomes: RoleplayCharacterStateApplyOutcome[] = [
      'persisted',
      'no_canonical_delta',
      'missing_source_metadata',
      'stale_generation',
      'character_not_found',
      'unsupported_field',
      'runtime_state_sync_failed',
      'persistence_failed',
    ];
    expect(outcomes).toHaveLength(8);
  });

  it('builds candidate-level apply receipts without confusing acceptance with persistence', () => {
    const candidate = {
      reviewStatus: 'accepted_reviewed_candidate' as const,
      character: 'Avery',
      field: 'location' as const,
      value: 'Kitchen',
      evidence: 'Avery enters the kitchen.',
      confidence: 0.95,
    };
    expect(buildRoleplayCharacterStateApplyReceipt({
      candidate,
      outcome: 'persisted',
      reason: 'character_state_snapshot_persisted',
      characterId: 'character-1',
      sourceMessageId: 'assistant-1',
      sourceGenerationId: 'generation-1',
      sourceUserMessageId: 'user-1',
      persistenceTargetId: 'snapshot-1',
    })).toMatchObject({
      edgeAccepted: true,
      frontendAccepted: true,
      reviewStatus: 'accepted_reviewed_candidate',
      persisted: true,
      outcome: 'persisted',
      sourceMessageId: 'assistant-1',
      sourceGenerationId: 'generation-1',
      sourceUserMessageId: 'user-1',
      persistenceTargetId: 'snapshot-1',
    });
    expect(buildRoleplayCharacterStateApplyReceipt({
      candidate,
      outcome: 'runtime_state_sync_failed',
      reason: 'character_state_snapshot_persisted_but_runtime_state_sync_failed',
      persisted: true,
      runtimeStateApplied: false,
      persistenceTargetId: 'snapshot-runtime-gap',
    })).toMatchObject({
      reviewStatus: 'accepted_reviewed_candidate',
      persisted: true,
      runtimeStateApplied: false,
      outcome: 'runtime_state_sync_failed',
      persistenceTargetId: 'snapshot-runtime-gap',
    });
    expect(buildRoleplayCharacterStateApplyReceipt({
      candidate,
      outcome: 'stale_generation',
      reason: 'source_generation_superseded_before_persistence',
    })).toMatchObject({
      edgeAccepted: true,
      frontendAccepted: true,
      persisted: false,
      outcome: 'stale_generation',
      persistenceTargetId: undefined,
    });
    expect(buildRoleplayCharacterStateApplyReceipt({
      candidate,
      outcome: 'stale_generation',
      reason: 'source_generation_superseded_during_character_persistence_cleanup_failed',
      persisted: true,
      persistenceTargetId: 'snapshot-stale-1',
    })).toMatchObject({
      persisted: true,
      outcome: 'stale_generation',
      persistenceTargetId: 'snapshot-stale-1',
    });
  });

  it('keeps a successful database write distinct from a failed runtime-state update', async () => {
    const writeSnapshot = vi.fn(async () => ({ id: 'snapshot-1', statePayload: { location: 'Kitchen' } }));
    const applyRuntimeState = vi.fn(() => {
      throw new Error('runtime state unavailable');
    });

    const persistedSnapshot = await writeSnapshot();
    const runtimeResult = applyPersistedRoleplayCharacterStateSnapshotToRuntime({
      snapshot: persistedSnapshot,
      apply: applyRuntimeState,
    });

    expect(writeSnapshot).toHaveBeenCalledTimes(1);
    expect(applyRuntimeState).toHaveBeenCalledWith(persistedSnapshot);
    expect(runtimeResult).toEqual({
      applied: false,
      error: 'runtime state unavailable',
    });
  });

  it('accepts only edge-accepted v1 updates backed by physical-state review coverage', () => {
    const contract = buildRoleplayReviewedCharacterStateContract({
      eligibleCharacters: [{
        characterId: 'character-1',
        characterName: 'Avery',
        reasons: ['name_match'],
      }],
      physicalStateReviews: [{
        character: 'Avery',
        reviewed: true,
        locationReviewed: true,
        scenePositionReviewed: true,
        reason: 'reviewed_latest_exchange',
      }],
      candidateReviews: [
        {
          index: 0,
          accepted: true,
          reason: 'accepted',
          character: 'Avery',
          field: 'location',
          value: 'Kitchen',
          evidence: 'Avery enters the kitchen.',
          confidence: 0.96,
        },
        {
          index: 1,
          accepted: false,
          reason: 'unsupported_inference',
          character: 'Avery',
          field: 'scenePosition',
          value: 'Beside the window',
          evidence: 'No supporting text.',
          confidence: 0.3,
        },
        {
          index: 2,
          accepted: true,
          reason: 'accepted',
          character: 'Avery',
          field: 'assignedDialogue',
          value: 'Leave now.',
          evidence: 'Avery should say this next.',
          confidence: 0.9,
        },
      ],
    });

    expect(contract.rows).toEqual([expect.objectContaining({
      characterId: 'character-1',
      characterName: 'Avery',
      eligible: true,
      eligibilityReasons: ['name_match'],
      reviewedFields: ['location', 'scenePosition'],
      missingReviewReason: undefined,
      acceptedUpdates: [expect.objectContaining({
        field: 'location',
        value: 'Kitchen',
        edgeAccepted: true,
      })],
      rejectedUpdates: [
        expect.objectContaining({ field: 'scenePosition', reason: 'unsupported_inference' }),
        expect.objectContaining({ field: 'assignedDialogue', reason: 'unsupported_field' }),
      ],
    })]);
    expect(contract.unmatchedCandidates).toEqual([]);
    expect(getRoleplayReviewedCharacterStatePersistenceCandidates(contract)).toEqual([{
      reviewStatus: 'accepted_reviewed_candidate',
      character: 'Avery',
      field: 'location',
      value: 'Kitchen',
      evidence: 'Avery enters the kitchen.',
      confidence: 0.96,
    }]);
  });

  it('fails closed when coverage is missing and preserves ineligible candidates as diagnostic evidence', () => {
    const contract = buildRoleplayReviewedCharacterStateContract({
      eligibleCharacters: [{ characterName: 'Avery', reasons: ['speaker_tag'] }],
      physicalStateReviews: [],
      missingPhysicalStateReviews: ['Avery'],
      candidateReviews: [
        {
          accepted: true,
          character: 'Avery',
          field: 'location',
          value: 'Kitchen',
          evidence: 'Avery enters the kitchen.',
          confidence: 0.95,
        },
        {
          accepted: true,
          character: 'Morgan',
          field: 'scenePosition',
          value: 'At the door',
          evidence: 'Morgan stands at the door.',
          confidence: 0.95,
        },
      ],
    });

    expect(contract.rows[0]).toMatchObject({
      characterName: 'Avery',
      reviewedFields: [],
      acceptedUpdates: [],
      missingReviewReason: 'missing_physical_state_review',
      rejectedUpdates: [expect.objectContaining({
        field: 'location',
        edgeAccepted: true,
        reason: 'missing_required_review',
      })],
    });
    expect(contract.unmatchedCandidates).toEqual([expect.objectContaining({
      characterName: 'Morgan',
      edgeAccepted: true,
      reason: 'ineligible_character',
    })]);
    expect(getRoleplayReviewedCharacterStatePersistenceCandidates(contract)).toEqual([]);
  });

  it('allows a user-controlled physical update only when its evidence is in the visible player turn', () => {
    const contract = buildRoleplayReviewedCharacterStateContract({
      eligibleCharacters: [{
        characterId: 'avery',
        characterName: 'Avery',
        controlledBy: 'User',
        reasons: ['speaker_tag'],
      }],
      physicalStateReviews: [{
        character: 'Avery',
        reviewed: true,
        locationReviewed: true,
        scenePositionReviewed: true,
      }],
      candidateReviews: [{
        accepted: true,
        character: 'Avery',
        field: 'location',
        value: 'Kitchen',
        evidence: 'I step into the kitchen.',
        confidence: 0.97,
      }],
      authorityContext: {
        visibleUserMessage: 'I step into the kitchen.',
        assistantMessage: 'Avery arrives and Morgan looks up.',
        sourceUserMessageId: 'user-1',
        sourceUserGenerationId: 'user-generation-1',
        sourceAssistantMessageId: 'assistant-1',
        sourceAssistantGenerationId: 'generation-1',
        sourceAssistantGenerationAccepted: true,
      },
    });

    expect(contract.authorityDecisions).toEqual([expect.objectContaining({
      authority: 'raw_user_fact',
      modelFacingAction: 'allow_as_fact',
      evidenceBasis: 'explicit_user_authorship',
      sourceMessageId: 'user-1',
      sourceGenerationId: 'user-generation-1',
    })]);
    expect(contract.rows[0].acceptedUpdates).toEqual([expect.objectContaining({
      field: 'location',
      authority: 'raw_user_fact',
      sourceRole: 'user',
    })]);
    expect(getRoleplayReviewedCharacterStatePersistenceCandidates(contract)).toEqual([
      expect.objectContaining({
        character: 'Avery',
        field: 'location',
        authority: 'raw_user_fact',
        sourceMessageId: 'user-1',
        sourceGenerationId: 'user-generation-1',
      }),
    ]);
  });

  it('rejects assistant-only voluntary movement for a user-controlled character', () => {
    const contract = buildRoleplayReviewedCharacterStateContract({
      eligibleCharacters: [{
        characterId: 'avery',
        characterName: 'Avery',
        controlledBy: 'User',
        reasons: ['name_match'],
      }],
      physicalStateReviews: [{
        character: 'Avery',
        reviewed: true,
        locationReviewed: true,
        scenePositionReviewed: true,
      }],
      candidateReviews: [{
        accepted: true,
        character: 'Avery',
        field: 'scenePosition',
        value: 'Beside the window',
        evidence: 'Avery walks to the window.',
        confidence: 0.95,
      }],
      authorityContext: {
        visibleUserMessage: 'I wait for Morgan to answer.',
        assistantMessage: 'Avery walks to the window.',
        sourceUserMessageId: 'user-1',
        sourceAssistantMessageId: 'assistant-1',
        sourceAssistantGenerationId: 'generation-1',
        sourceAssistantGenerationAccepted: true,
      },
    });

    expect(contract.rows[0].acceptedUpdates).toEqual([]);
    expect(contract.rows[0].rejectedUpdates).toEqual([expect.objectContaining({
      reason: 'user_owned_state_requires_user_authorship',
      authority: 'assistant_interpretation',
      modelFacingAction: 'reject_from_persistence',
      sourceMessageId: 'assistant-1',
      sourceGenerationId: 'generation-1',
    })]);
    expect(getRoleplayReviewedCharacterStatePersistenceCandidates(contract)).toEqual([]);
  });

  it('rejects stale assistant evidence and evidence found only in a private player span', () => {
    const visibleProjection = projectPlayerTurnVisibility(
      '(I quietly move to the cellar.) I wait for Morgan.',
      'user-1',
    );
    const baseInput = {
      eligibleCharacters: [{
        characterId: 'avery',
        characterName: 'Avery',
        controlledBy: 'User' as const,
        reasons: ['speaker_tag' as const],
      }],
      physicalStateReviews: [{
        character: 'Avery',
        reviewed: true,
        locationReviewed: true,
        scenePositionReviewed: true,
      }],
      candidateReviews: [{
        accepted: true,
        character: 'Avery',
        field: 'location',
        value: 'Cellar',
        evidence: 'I quietly move to the cellar.',
        confidence: 0.95,
      }],
    };

    const privateOnly = buildRoleplayReviewedCharacterStateContract({
      ...baseInput,
      authorityContext: {
        visibleUserMessage: visibleProjection.visibleText,
        assistantMessage: '',
        sourceUserMessageId: 'user-1',
        sourceAssistantMessageId: 'assistant-1',
        sourceAssistantGenerationId: 'generation-1',
        sourceAssistantGenerationAccepted: true,
      },
    });
    expect(privateOnly.rows[0].rejectedUpdates).toEqual([expect.objectContaining({
      authority: 'unsupported_overreach',
      evidenceBasis: 'unsupported',
    })]);

    const staleAssistant = buildRoleplayReviewedCharacterStateContract({
      ...baseInput,
      authorityContext: {
        visibleUserMessage: visibleProjection.visibleText,
        assistantMessage: 'I quietly move to the cellar.',
        sourceUserMessageId: 'user-1',
        sourceAssistantMessageId: 'assistant-1',
        sourceAssistantGenerationId: 'generation-old',
        sourceAssistantGenerationAccepted: false,
      },
    });
    expect(staleAssistant.rows[0].rejectedUpdates).toEqual([expect.objectContaining({
      authority: 'unsupported_overreach',
      reason: 'assistant_generation_not_accepted',
    })]);
  });
});
