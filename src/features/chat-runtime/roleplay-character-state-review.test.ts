import { describe, expect, it } from 'vitest';

import {
  ROLEPLAY_REVIEWED_CHARACTER_STATE_FIELDS,
  buildRoleplayCharacterStateEligibilityRows,
  buildRoleplayCharacterStateApplyReceipt,
  buildRoleplayReviewedCharacterStateContract,
  getRoleplayReviewedCharacterStatePersistenceCandidates,
  isRoleplayReviewedCharacterStateField,
  type RoleplayCharacterStateApplyOutcome,
} from './roleplay-character-state-review';

describe('reviewed character-state contract', () => {
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
      'persistence_failed',
    ];
    expect(outcomes).toHaveLength(7);
  });

  it('builds candidate-level apply receipts without confusing acceptance with persistence', () => {
    const candidate = {
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
      persisted: true,
      outcome: 'persisted',
      sourceMessageId: 'assistant-1',
      sourceGenerationId: 'generation-1',
      sourceUserMessageId: 'user-1',
      persistenceTargetId: 'snapshot-1',
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
});
