import { describe, expect, it } from 'vitest';

import {
  advanceSupportCallReadinessRecord,
  captureSupportReadinessForResponseJob,
  createSupportCallReadinessRecord,
  createSupportReadinessSnapshot,
  SUPPORT_CALL_LIFECYCLES,
  type SupportCallReadinessRecord,
} from './roleplay-support-readiness';

function record(
  overrides: Partial<SupportCallReadinessRecord> = {},
): SupportCallReadinessRecord {
  return createSupportCallReadinessRecord({
    id: overrides.id ?? 'readiness:memory:assistant-1',
    worker: overrides.worker ?? 'memory_extraction',
    sourceMessageId: overrides.sourceMessageId ?? 'assistant-1',
    sourceGenerationId: overrides.sourceGenerationId ?? 'generation-1',
    lifecycle: overrides.lifecycle ?? 'queued',
    persistenceStatus: overrides.persistenceStatus ?? 'pending',
    firstEligibleFutureTurn: overrides.firstEligibleFutureTurn,
    firstEligibleResponseJobId: overrides.firstEligibleResponseJobId,
    firstEligibleAt: overrides.firstEligibleAt,
    queuedAt: 'queuedAt' in overrides ? overrides.queuedAt : 10,
    startedAt: overrides.startedAt,
    completedAt: overrides.completedAt,
    reason: overrides.reason ?? 'queued_after_visible_assistant_response',
  });
}

describe('support call readiness contracts', () => {
  it('locks worker lifecycle vocabulary separately from persistence status', () => {
    expect(SUPPORT_CALL_LIFECYCLES).toEqual([
      'queued',
      'running',
      'completed',
      'failed',
      'skipped',
      'stale',
    ]);
    expect(record()).toMatchObject({
      lifecycle: 'queued',
      persistenceStatus: 'pending',
      unavailableToTriggeringResponse: true,
      scope: 'session_debug_only',
    });
  });

  it('allows future-turn eligibility only after a completed persisted result', () => {
    const persisted = record({
      lifecycle: 'completed',
      persistenceStatus: 'persisted',
      firstEligibleFutureTurn: 8,
      firstEligibleResponseJobId: 'response-job-8',
      firstEligibleAt: 25,
      startedAt: 12,
      completedAt: 20,
      reason: 'accepted_output_persisted_for_future_turn',
    });
    const noUpdates = record({
      id: 'readiness:goal:assistant-1',
      worker: 'goal_progress',
      lifecycle: 'completed',
      persistenceStatus: 'no_updates',
      startedAt: 12,
      completedAt: 20,
      reason: 'worker_proved_no_persistable_updates',
    });

    expect(persisted.firstEligibleFutureTurn).toBe(8);
    expect(noUpdates.firstEligibleFutureTurn).toBeUndefined();
  });

  it.each([
    ['running', 'pending'],
    ['completed', 'pending'],
    ['completed', 'no_updates'],
    ['completed', 'failed'],
    ['failed', 'failed'],
    ['stale', 'skipped_stale'],
  ] as const)(
    'rejects future-turn eligibility for %s lifecycle with %s persistence',
    (lifecycle, persistenceStatus) => {
      expect(() => record({
        lifecycle,
        persistenceStatus,
        firstEligibleFutureTurn: 3,
        firstEligibleResponseJobId: 'response-job-3',
        firstEligibleAt: 30,
      })).toThrow('future-turn eligibility requires completed lifecycle and persisted status');
    },
  );

  it('keeps timing optional but validates known order', () => {
    expect(record({ queuedAt: undefined })).toMatchObject({ queuedAt: undefined });
    expect(() => record({ queuedAt: 20, startedAt: 10 })).toThrow(
      'startedAt cannot precede queuedAt',
    );
    expect(() => record({ queuedAt: 10, startedAt: 20, completedAt: 15 })).toThrow(
      'completedAt cannot precede startedAt',
    );
    expect(() => record({ queuedAt: 20, startedAt: undefined, completedAt: 10 })).toThrow(
      'completedAt cannot precede queuedAt',
    );
  });

  it('rejects persisted readiness before lifecycle completion', () => {
    expect(() => record({
      lifecycle: 'queued',
      persistenceStatus: 'persisted',
    })).toThrow('persisted status requires completed lifecycle');

    expect(() => record({
      lifecycle: 'running',
      persistenceStatus: 'failed',
    })).toThrow('queued/running lifecycle requires pending or not_requested persistence');
  });

  it('rejects lifecycle timestamps that claim unfinished work has advanced', () => {
    expect(() => record({ lifecycle: 'queued', startedAt: 12 })).toThrow(
      'queued lifecycle cannot have start or completion timestamps',
    );
    expect(() => record({ lifecycle: 'queued', completedAt: 20 })).toThrow(
      'queued lifecycle cannot have start or completion timestamps',
    );
    expect(() => record({ lifecycle: 'running', startedAt: 12, completedAt: 20 })).toThrow(
      'running lifecycle cannot have a completion timestamp',
    );
  });

  it('captures independent per-worker readiness at one dispatch', () => {
    const snapshot = createSupportReadinessSnapshot({
      id: 'snapshot:dispatch-2',
      dispatchMessageId: 'user-2',
      dispatchGenerationId: 'user-generation-2',
      responseJobId: 'response-job-2',
      responseJobMode: 'normal_send',
      responseJobPurpose: 'respond_to_player_turn',
      previousAssistantMessageId: 'assistant-1',
      previousAssistantGenerationId: 'generation-1',
      capturedAt: 30,
      records: [
        record(),
        record({
          id: 'readiness:character:assistant-1',
          worker: 'character_state',
          lifecycle: 'completed',
          persistenceStatus: 'persisted',
          firstEligibleFutureTurn: 2,
          firstEligibleResponseJobId: 'response-job-2',
          firstEligibleAt: 30,
          startedAt: 11,
          completedAt: 25,
          reason: 'character_state_persisted',
        }),
      ],
    });

    expect(snapshot.records).toHaveLength(2);
    expect(snapshot.records.map((entry) => entry.lifecycle)).toEqual(['queued', 'completed']);
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.records)).toBe(true);
    expect(Object.isFrozen(snapshot.records[0])).toBe(true);
  });

  it('advances one immutable record through runtime and persistence lifecycle', () => {
    const queued = record();
    const running = advanceSupportCallReadinessRecord(queued, {
      lifecycle: 'running',
      occurredAt: 12,
      reason: 'support_worker_started',
    });
    const persisted = advanceSupportCallReadinessRecord(running, {
      lifecycle: 'completed',
      occurredAt: 20,
      persistenceStatus: 'persisted',
      reason: 'reviewed_output_persisted',
    });

    expect(queued).toMatchObject({ lifecycle: 'queued', startedAt: undefined });
    expect(running).toMatchObject({ lifecycle: 'running', queuedAt: 10, startedAt: 12 });
    expect(persisted).toMatchObject({
      lifecycle: 'completed',
      persistenceStatus: 'persisted',
      queuedAt: 10,
      startedAt: 12,
      completedAt: 20,
    });
    expect(Object.isFrozen(persisted)).toBe(true);
  });

  it('retains delayed records from older source turns in the current response-job snapshot', () => {
    const snapshot = createSupportReadinessSnapshot({
      id: 'snapshot-2',
      dispatchMessageId: 'user-3',
      responseJobId: 'response-job-3',
      responseJobMode: 'normal_send',
      responseJobPurpose: 'respond_to_player_turn',
      previousAssistantMessageId: 'assistant-2',
      previousAssistantGenerationId: 'generation-2',
      capturedAt: 30,
      records: [record({ sourceMessageId: 'assistant-1', sourceGenerationId: 'generation-1' })],
    });

    expect(snapshot.records[0]).toMatchObject({
      sourceMessageId: 'assistant-1',
      sourceGenerationId: 'generation-1',
    });
  });

  it('rejects aggregate duplicate worker status', () => {
    expect(() => createSupportReadinessSnapshot({
      id: 'snapshot-1',
      dispatchMessageId: 'user-2',
      responseJobId: 'response-job-2',
      responseJobMode: 'normal_send',
      responseJobPurpose: 'respond_to_player_turn',
      previousAssistantMessageId: 'assistant-1',
      capturedAt: 30,
      records: [record(), record({ id: 'duplicate-memory' })],
    })).toThrow('at most one record per worker and source generation');
  });

  it('proves a delayed persisted result is absent from turn N and first eligible for turn N+1', () => {
    const pending = record({
      lifecycle: 'running',
      persistenceStatus: 'pending',
      startedAt: 12,
      reason: 'support_worker_started',
    });
    const turnN = captureSupportReadinessForResponseJob({
      snapshotId: 'snapshot-turn-n',
      dispatchMessageId: 'user-2',
      responseJob: {
        id: 'response-job-turn-n',
        mode: 'normal_send',
        purpose: 'respond_to_player_turn',
      },
      previousAssistantMessageId: 'assistant-1',
      previousAssistantGenerationId: 'generation-1',
      capturedAt: 15,
      dispatchOrdinal: 1,
      records: [pending],
    });
    const persistedAfterDispatch = advanceSupportCallReadinessRecord(pending, {
      lifecycle: 'completed',
      occurredAt: 20,
      persistenceStatus: 'persisted',
      reason: 'reviewed_output_persisted_after_turn_n_dispatch',
    });
    const turnNPlus1 = captureSupportReadinessForResponseJob({
      snapshotId: 'snapshot-turn-n-plus-1',
      dispatchMessageId: 'user-3',
      responseJob: {
        id: 'response-job-turn-n-plus-1',
        mode: 'normal_send',
        purpose: 'respond_to_player_turn',
      },
      previousAssistantMessageId: 'assistant-2',
      previousAssistantGenerationId: 'generation-2',
      capturedAt: 30,
      dispatchOrdinal: 2,
      records: [persistedAfterDispatch],
    });

    expect(turnN.snapshot.records[0]).toMatchObject({
      lifecycle: 'running',
      firstEligibleResponseJobId: undefined,
    });
    expect(turnN.newlyEligibleRecords).toEqual([]);
    expect(turnNPlus1.snapshot.records[0]).toMatchObject({
      lifecycle: 'completed',
      persistenceStatus: 'persisted',
      firstEligibleFutureTurn: 2,
      firstEligibleResponseJobId: 'response-job-turn-n-plus-1',
      firstEligibleAt: 30,
    });
    expect(turnNPlus1.newlyEligibleRecords).toHaveLength(1);
  });

  it.each(['id', 'sourceMessageId', 'reason'] as const)(
    'requires nonblank record %s',
    (fieldName) => {
      expect(() => record({ [fieldName]: '   ' })).toThrow(
        `Support readiness requires ${fieldName}`,
      );
    },
  );
});
