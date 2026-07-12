import { describe, expect, it } from 'vitest';

import {
  reviewLegacyMemoryExtractionEvents,
  wrapLegacyRoleplaySupportResult,
} from './roleplay-support-review-adapters';

describe('legacy support result adapters', () => {
  it('classifies near-duplicate memory output as omitted before building accepted outcomes', () => {
    const review = reviewLegacyMemoryExtractionEvents({
      events: ['Mara promised to return.', 'Mara promised to return.', 'The key was buried outside.'],
      isNearDuplicate: (accepted, candidate) => accepted.includes(candidate),
    });

    expect(review.acceptedEvents).toEqual([
      'Mara promised to return.',
      'The key was buried outside.',
    ]);
    expect(review.candidateReviews).toHaveLength(2);
    expect(review.omittedCandidates).toEqual([{
      id: 'memory-candidate-2',
      label: 'Mara promised to return.',
      reason: 'near_duplicate_existing_memory',
    }]);
  });
  it('wraps character-state accepted and rejected candidates without claiming persistence', () => {
    const envelope = wrapLegacyRoleplaySupportResult({
      worker: 'character_state',
      sourceMessageId: 'assistant-1',
      sourceGenerationId: 'generation-1',
      responseBody: {
        characterUpdateReviews: [
          { id: 'candidate-1', character: 'Mara', value: 'near the door', evidence: 'Mara moved to the door.', accepted: true, reason: 'accepted' },
          { id: 'candidate-2', character: 'Mara', value: 'secretly afraid', accepted: false, reason: 'unsupported_inference' },
        ],
      },
    });

    expect(envelope.accepted).toHaveLength(1);
    expect(envelope.rejected).toHaveLength(1);
    expect(envelope.persistence.status).toBe('pending');
    expect(envelope.readiness).toBe('completed');
    expect(envelope.futurePromptImpact).toMatchObject({ eligible: false, targets: [] });
  });

  it('prefers reviewed character-state rows and treats missing coverage as omitted evidence', () => {
    const envelope = wrapLegacyRoleplaySupportResult({
      worker: 'character_state',
      sourceMessageId: 'assistant-1',
      sourceGenerationId: 'generation-1',
      responseBody: {
        characterUpdateReviews: [{
          character: 'Avery',
          field: 'location',
          value: 'Kitchen',
          accepted: true,
          reason: 'accepted',
        }],
        acceptedUpdates: [],
        rejectedUpdates: [{
          characterName: 'Avery',
          field: 'location',
          value: 'Kitchen',
          edgeAccepted: true,
          frontendAccepted: false,
          reason: 'missing_required_review',
        }],
        missingCharacterStateReviews: [{
          characterName: 'Avery',
          missingReviewReason: 'missing_physical_state_review',
        }],
      },
    });

    expect(envelope.accepted).toEqual([]);
    expect(envelope.rejected).toEqual([expect.objectContaining({
      id: 'Avery',
      reason: 'missing_required_review',
    })]);
    expect(envelope.omitted).toEqual([expect.objectContaining({
      id: 'Avery',
      reason: 'missing_physical_state_review',
    })]);
    expect(envelope.persistence).toMatchObject({
      status: 'no_updates',
      reason: 'no_persistable_updates',
    });
    expect(envelope.readiness).toBe('rejected_only');
    expect(envelope.futurePromptImpact.eligible).toBe(false);
  });

  it('wraps memory events, semantic rejections, and omitted duplicates separately', () => {
    const envelope = wrapLegacyRoleplaySupportResult({
      worker: 'memory_extraction',
      responseBody: {
        candidateReviews: [
          { id: 'memory-1', label: 'Mara promised to return.', accepted: true, reason: 'durable_supported_fact' },
          { id: 'memory-2', label: 'Mara likes the wallpaper.', accepted: false, reason: 'not_durable' },
        ],
        omittedCandidates: [
          { id: 'memory-3', label: 'Mara promised to return.', reason: 'near_duplicate_existing_memory' },
        ],
      },
    });

    expect(envelope.accepted.map((item) => item.id)).toEqual(['memory-1']);
    expect(envelope.rejected.map((item) => item.id)).toEqual(['memory-2']);
    expect(envelope.omitted.map((item) => item.id)).toEqual(['memory-3']);
  });

  it('preserves memory source-authority metadata in the support envelope', () => {
    const envelope = wrapLegacyRoleplaySupportResult({
      worker: 'memory_extraction',
      sourceMessageId: 'assistant-1',
      sourceGenerationId: 'assistant-generation-1',
      responseBody: {
        candidateReviews: [{
          id: 'memory-1',
          label: 'Avery stated that they were afraid.',
          accepted: true,
          reason: 'explicit_user_authorship',
          evidence: 'I am afraid',
          claimType: 'emotion',
          sourceRole: 'user',
          authority: 'raw_user_fact',
          modelFacingAction: 'allow_as_fact',
          sourceMessageId: 'user-1',
          sourceGenerationId: 'user-generation-1',
          userCharacterId: 'avery',
        }],
      },
    });

    expect(envelope.accepted[0]).toMatchObject({
      authority: 'raw_user_fact',
      modelFacingAction: 'allow_as_fact',
      sourceMessageId: 'user-1',
      sourceGenerationId: 'user-generation-1',
      userCharacterId: 'avery',
    });
  });

  it('keeps goal alignment diagnostic-only and ineligible for future prompts', () => {
    const envelope = wrapLegacyRoleplaySupportResult({
      worker: 'goal_alignment',
      responseBody: { evaluations: [{ id: 'goal-1', label: 'Alignment review' }] },
      persistenceStatus: 'persisted',
    });

    expect(envelope.persistence.status).toBe('debug_only');
    expect(envelope.futurePromptImpact).toEqual({
      eligible: false,
      targets: [],
      reason: 'goal_alignment_is_diagnostic_only',
    });
  });

  it('marks superseded output as stale review evidence rather than prompt material', () => {
    const envelope = wrapLegacyRoleplaySupportResult({
      worker: 'goal_progress',
      sourceMessageId: 'assistant-1',
      sourceGenerationId: 'generation-old',
      sourceCurrent: false,
      responseBody: {
        stepCompletionReviews: [{ stepId: 'step-1', description: 'Reach the station', accepted: true }],
      },
    });

    expect(envelope.readiness).toBe('skipped_stale');
    expect(envelope.persistence.status).toBe('skipped_stale');
    expect(envelope.futurePromptImpact.eligible).toBe(false);
    expect(envelope.contextGaps[0]).toContain('superseded');
  });

  it('distinguishes parse or request failure from a valid rejected-only result', () => {
    const failed = wrapLegacyRoleplaySupportResult({
      worker: 'memory_extraction',
      responseBody: { parseError: 'missing_json_object' },
      error: 'parseError: missing_json_object',
    });
    const rejectedOnly = wrapLegacyRoleplaySupportResult({
      worker: 'memory_extraction',
      responseBody: {
        candidateReviews: [{ id: 'memory-1', label: 'Temporary detail', accepted: false, reason: 'not_durable' }],
      },
    });

    expect(failed.readiness).toBe('failed');
    expect(failed.persistence.status).toBe('failed');
    expect(rejectedOnly.readiness).toBe('rejected_only');
    expect(rejectedOnly.persistence.status).toBe('no_updates');
  });

  it('makes persisted accepted compression eligible only for summary re-entry', () => {
    const envelope = wrapLegacyRoleplaySupportResult({
      worker: 'day_memory_compression',
      responseBody: {
        synopsis: 'Day 1 ended with Mara agreeing to return.',
        inputRowIds: ['memory-1', 'memory-2'],
        deletionEligibleRowIds: ['memory-1', 'memory-2'],
      },
      persistenceStatus: 'persisted',
      persistenceTargets: ['memory-row-day-1'],
    });

    expect(envelope.futurePromptImpact).toEqual({
      eligible: true,
      targets: ['summary'],
      reason: 'accepted_output_persisted_for_future_prompt_use',
    });
    expect(envelope.accepted[0].evidence).toContain('input rows: memory-1, memory-2');
    expect(envelope.accepted[0].evidence).toContain('deletion eligible: memory-1, memory-2');
  });
});
