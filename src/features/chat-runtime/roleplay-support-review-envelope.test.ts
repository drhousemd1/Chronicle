import { describe, expect, it } from 'vitest';

import {
  ROLEPLAY_SUPPORT_WORKERS,
  createPendingRoleplaySupportReviewEnvelope,
  createRoleplaySupportReviewEnvelope,
  finalizeRoleplaySupportReviewEnvelope,
  isRoleplaySupportReviewEnvelopePromptEligible,
  isRoleplaySupportWorker,
} from './roleplay-support-review-envelope';

describe('RoleplaySupportReviewEnvelope', () => {
  it('locks the support-worker vocabulary to the five real post-response workers', () => {
    expect(ROLEPLAY_SUPPORT_WORKERS).toEqual([
      'character_state',
      'memory_extraction',
      'goal_progress',
      'goal_alignment',
      'day_memory_compression',
    ]);
    expect(isRoleplaySupportWorker('memory_extraction')).toBe(true);
    expect(isRoleplaySupportWorker('memory')).toBe(false);
    expect(isRoleplaySupportWorker('style_telemetry')).toBe(false);
    expect(isRoleplaySupportWorker('new_character_detection')).toBe(false);
  });

  it('keeps review outcome, persistence, readiness, and future prompt impact separate', () => {
    const envelope = createRoleplaySupportReviewEnvelope({
      worker: 'memory_extraction',
      sourceMessageId: 'assistant-1',
      sourceGenerationId: 'generation-1',
      accepted: [{
        id: 'memory-1',
        label: 'Accepted memory candidate',
        reason: 'durable_supported_fact',
        evidence: 'The latest exchange established the lasting preference.',
        category: 'durable_preference',
      }],
      rejected: [{
        id: 'memory-2',
        label: 'Rejected memory candidate',
        reason: 'unsupported_inference',
      }],
      omitted: [{
        id: 'memory-3',
        label: 'Omitted duplicate',
        reason: 'near_duplicate_existing_memory',
      }],
      persistence: {
        status: 'pending',
        targets: [],
        reason: 'accepted_candidate_not_yet_persisted',
      },
      readiness: 'completed',
      futurePromptImpact: {
        eligible: false,
        targets: [],
        reason: 'persistence_pending',
      },
      contextGaps: ['Accepted memory is not available to the next prompt yet.'],
    });

    expect(envelope).toMatchObject({
      contract: 'RoleplaySupportReviewEnvelope',
      version: 2,
      worker: 'memory_extraction',
      sourceMessageId: 'assistant-1',
      sourceGenerationId: 'generation-1',
      readiness: 'completed',
      persistence: { status: 'pending' },
      futurePromptImpact: { eligible: false },
    });
    expect(envelope.accepted).toHaveLength(1);
    expect(envelope.rejected).toHaveLength(1);
    expect(envelope.omitted).toHaveLength(1);
  });

  it('creates a pending debug-scoped envelope without claiming persistence or re-entry', () => {
    expect(createPendingRoleplaySupportReviewEnvelope({
      worker: 'character_state',
      sourceMessageId: 'assistant-2',
      sourceGenerationId: 'generation-2',
    })).toMatchObject({
      worker: 'character_state',
      readiness: 'pending',
      persistence: {
        status: 'pending',
        targets: [],
      },
      futurePromptImpact: {
        eligible: false,
        targets: [],
      },
      accepted: [],
      rejected: [],
      omitted: [],
      contextGaps: [],
    });
  });

  it.each([
    ['pending readiness', 'memory_extraction', 'pending'],
    ['failed readiness', 'memory_extraction', 'failed'],
    ['stale readiness', 'memory_extraction', 'skipped_stale'],
    ['diagnostic-only worker', 'goal_alignment', 'completed'],
  ] as const)('blocks contradictory future-prompt eligibility for %s', (_label, worker, readiness) => {
    const envelope = createRoleplaySupportReviewEnvelope({
      worker,
      accepted: [{ id: 'accepted-1', label: 'Accepted result', reason: 'accepted' }],
      persistence: { status: 'persisted', targets: ['row-1'], reason: 'persisted' },
      readiness,
      futurePromptImpact: { eligible: true, targets: ['memory'], reason: 'caller_claimed_eligible' },
    });

    expect(isRoleplaySupportReviewEnvelopePromptEligible(envelope)).toBe(false);
    expect(envelope.futurePromptImpact).toEqual({
      eligible: false,
      targets: [],
      reason: 'blocked_by_support_envelope_invariant:caller_claimed_eligible',
    });
  });

  it('finalizes persistence without losing review outcomes or source lineage', () => {
    const pending = createRoleplaySupportReviewEnvelope({
      worker: 'goal_progress',
      sourceMessageId: 'assistant-3',
      sourceGenerationId: 'generation-3',
      accepted: [{ id: 'step-1', label: 'Reach the station', reason: 'accepted' }],
      rejected: [{ id: 'step-2', label: 'Skip ahead', reason: 'unsupported' }],
      persistence: { status: 'pending', targets: [], reason: 'pending' },
      readiness: 'completed',
      futurePromptImpact: { eligible: false, targets: [], reason: 'persistence_pending' },
    });
    const persisted = finalizeRoleplaySupportReviewEnvelope(pending, {
      persistenceStatus: 'persisted',
      persistenceTargets: ['goal-derivation-1'],
      persistenceReason: 'goal_derivation_persisted',
    });

    expect(persisted).toMatchObject({
      sourceMessageId: 'assistant-3',
      sourceGenerationId: 'generation-3',
      readiness: 'completed',
      persistence: {
        status: 'persisted',
        targets: ['goal-derivation-1'],
      },
      futurePromptImpact: {
        eligible: true,
        targets: ['goal_state'],
      },
    });
    expect(persisted.accepted).toEqual(pending.accepted);
    expect(persisted.rejected).toEqual(pending.rejected);
  });

  it('replaces pending item outcomes with final per-item persistence evidence', () => {
    const pending = createRoleplaySupportReviewEnvelope({
      worker: 'memory_extraction',
      accepted: [
        { id: 'memory-1', label: 'Persisted memory', reason: 'accepted', persistenceStatus: 'pending' },
        { id: 'memory-2', label: 'Failed memory', reason: 'accepted', persistenceStatus: 'pending' },
      ],
      persistence: { status: 'pending', targets: [], reason: 'pending' },
      readiness: 'completed',
      futurePromptImpact: { eligible: false, targets: [], reason: 'persistence_pending' },
    });
    const finalized = finalizeRoleplaySupportReviewEnvelope(pending, {
      persistenceStatus: 'persisted',
      persistenceTargets: ['memory-row-1'],
      persistenceReason: 'accepted_memory_candidates_partially_persisted',
      accepted: [
        { id: 'memory-1', label: 'Persisted memory', reason: 'accepted', persistenceStatus: 'persisted', persistenceTargetId: 'memory-row-1' },
        { id: 'memory-2', label: 'Failed memory', reason: 'accepted', persistenceStatus: 'failed' },
      ],
    });

    expect(finalized.accepted).toEqual([
      expect.objectContaining({ id: 'memory-1', persistenceStatus: 'persisted' }),
      expect.objectContaining({ id: 'memory-2', persistenceStatus: 'failed' }),
    ]);
    expect(isRoleplaySupportReviewEnvelopePromptEligible(finalized)).toBe(true);
  });

  it('keeps persisted day-compression output prompt-eligible while preserving a cleanup gap', () => {
    const reviewed = createRoleplaySupportReviewEnvelope({
      worker: 'day_memory_compression',
      accepted: [{
        id: 'compressed-synopsis',
        label: 'A durable day summary.',
        reason: 'accepted',
      }],
      persistence: { status: 'pending', targets: [], reason: 'pending' },
      readiness: 'completed',
      futurePromptImpact: { eligible: false, targets: [], reason: 'persistence_pending' },
    });
    const persistedWithCleanupGap = finalizeRoleplaySupportReviewEnvelope(reviewed, {
      persistenceStatus: 'persisted',
      persistenceTargets: ['synopsis-1'],
      persistenceReason: 'compressed_synopsis_persisted_with_cleanup_gap',
      contextGap: 'Source bullet cleanup failed for row bullet-2.',
    });

    expect(persistedWithCleanupGap).toMatchObject({
      readiness: 'completed',
      persistence: {
        status: 'persisted',
        targets: ['synopsis-1'],
        reason: 'compressed_synopsis_persisted_with_cleanup_gap',
      },
      futurePromptImpact: {
        eligible: true,
        targets: ['summary'],
      },
      contextGaps: ['Source bullet cleanup failed for row bullet-2.'],
    });
    expect(isRoleplaySupportReviewEnvelopePromptEligible(persistedWithCleanupGap)).toBe(true);
  });

  it('does not mark persisted character state prompt-ready while runtime state is pending', () => {
    const reviewed = createRoleplaySupportReviewEnvelope({
      worker: 'character_state',
      accepted: [{ id: 'location-1', label: 'Avery.location', reason: 'accepted' }],
      persistence: { status: 'pending', targets: [], reason: 'pending' },
      readiness: 'completed',
      futurePromptImpact: { eligible: false, targets: [], reason: 'persistence_pending' },
    });
    const runtimePending = finalizeRoleplaySupportReviewEnvelope(reviewed, {
      persistenceStatus: 'persisted_runtime_state_pending',
      persistenceTargets: ['snapshot-1'],
      persistenceReason: 'character_state_snapshots_persisted_with_runtime_state_sync_gap',
      contextGap: 'Reload is required before the persisted row can affect the active prompt.',
    });

    expect(runtimePending).toMatchObject({
      readiness: 'completed',
      persistence: {
        status: 'persisted_runtime_state_pending',
        targets: ['snapshot-1'],
      },
      futurePromptImpact: {
        eligible: false,
        targets: [],
      },
    });
    expect(isRoleplaySupportReviewEnvelopePromptEligible(runtimePending)).toBe(false);
  });
});
