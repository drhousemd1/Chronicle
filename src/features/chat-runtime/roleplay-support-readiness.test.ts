import { describe, expect, it } from 'vitest';

import {
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

  it('allows future-turn eligibility only after completed persisted/no-update results', () => {
    const persisted = record({
      lifecycle: 'completed',
      persistenceStatus: 'persisted',
      firstEligibleFutureTurn: 8,
      startedAt: 12,
      completedAt: 20,
      reason: 'accepted_output_persisted_for_future_turn',
    });
    const noUpdates = record({
      id: 'readiness:goal:assistant-1',
      worker: 'goal_progress',
      lifecycle: 'completed',
      persistenceStatus: 'no_updates',
      firstEligibleFutureTurn: 8,
      startedAt: 12,
      completedAt: 20,
      reason: 'worker_proved_no_persistable_updates',
    });

    expect(persisted.firstEligibleFutureTurn).toBe(8);
    expect(noUpdates.firstEligibleFutureTurn).toBe(8);
  });

  it.each([
    ['running', 'pending'],
    ['completed', 'pending'],
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
      })).toThrow('future-turn eligibility requires completed lifecycle and persisted/no_updates status');
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
    })).toThrow('persisted/no_updates status requires completed lifecycle');

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

  it('rejects records from another source message or generation', () => {
    expect(() => createSupportReadinessSnapshot({
      id: 'snapshot-1',
      dispatchMessageId: 'user-2',
      previousAssistantMessageId: 'assistant-1',
      previousAssistantGenerationId: 'generation-1',
      capturedAt: 30,
      records: [record({ sourceMessageId: 'assistant-other' })],
    })).toThrow('does not belong to the previous assistant message');

    expect(() => createSupportReadinessSnapshot({
      id: 'snapshot-2',
      dispatchMessageId: 'user-2',
      previousAssistantMessageId: 'assistant-1',
      previousAssistantGenerationId: 'generation-1',
      capturedAt: 30,
      records: [record({ sourceGenerationId: 'generation-other' })],
    })).toThrow('does not belong to the previous assistant generation');
  });

  it('rejects aggregate duplicate worker status', () => {
    expect(() => createSupportReadinessSnapshot({
      id: 'snapshot-1',
      dispatchMessageId: 'user-2',
      previousAssistantMessageId: 'assistant-1',
      capturedAt: 30,
      records: [record(), record({ id: 'duplicate-memory' })],
    })).toThrow('at most one record per worker');
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
