import type {
  RoleplaySupportPersistenceStatus,
  RoleplaySupportWorker,
} from './roleplay-support-review-envelope';

export const SUPPORT_CALL_LIFECYCLES = [
  'queued',
  'running',
  'completed',
  'failed',
  'skipped',
  'stale',
] as const;

export type SupportCallLifecycle = typeof SUPPORT_CALL_LIFECYCLES[number];

export type SupportCallReadinessRecord = Readonly<{
  id: string;
  worker: RoleplaySupportWorker;
  sourceMessageId: string;
  sourceGenerationId?: string;
  lifecycle: SupportCallLifecycle;
  persistenceStatus: RoleplaySupportPersistenceStatus;
  firstEligibleFutureTurn?: number;
  unavailableToTriggeringResponse: true;
  queuedAt?: number;
  startedAt?: number;
  completedAt?: number;
  reason: string;
  scope: 'session_debug_only';
}>;

export type SupportReadinessSnapshot = Readonly<{
  id: string;
  dispatchMessageId: string;
  dispatchGenerationId?: string;
  previousAssistantMessageId: string;
  previousAssistantGenerationId?: string;
  capturedAt: number;
  records: readonly SupportCallReadinessRecord[];
  scope: 'session_debug_only';
}>;

function requiredText(value: string, fieldName: string): string {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (!normalized) throw new Error(`Support readiness requires ${fieldName}`);
  return normalized;
}

function optionalTimestamp(value: number | undefined, fieldName: string): number | undefined {
  if (value == null) return undefined;
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`Support readiness ${fieldName} must be a nonnegative timestamp`);
  }
  return value;
}

function isFutureTurnEligiblePersistence(
  status: RoleplaySupportPersistenceStatus,
): boolean {
  return status === 'persisted' || status === 'no_updates';
}

export function createSupportCallReadinessRecord(input: Omit<
  SupportCallReadinessRecord,
  'unavailableToTriggeringResponse' | 'scope'
>): SupportCallReadinessRecord {
  const queuedAt = optionalTimestamp(input.queuedAt, 'queuedAt');
  const startedAt = optionalTimestamp(input.startedAt, 'startedAt');
  const completedAt = optionalTimestamp(input.completedAt, 'completedAt');
  if (queuedAt != null && startedAt != null && startedAt < queuedAt) {
    throw new Error('Support readiness startedAt cannot precede queuedAt');
  }
  if (startedAt != null && completedAt != null && completedAt < startedAt) {
    throw new Error('Support readiness completedAt cannot precede startedAt');
  }
  if (queuedAt != null && completedAt != null && completedAt < queuedAt) {
    throw new Error('Support readiness completedAt cannot precede queuedAt');
  }
  if (input.lifecycle === 'queued' && (startedAt != null || completedAt != null)) {
    throw new Error('Support readiness queued lifecycle cannot have start or completion timestamps');
  }
  if (input.lifecycle === 'running' && completedAt != null) {
    throw new Error('Support readiness running lifecycle cannot have a completion timestamp');
  }
  if (
    isFutureTurnEligiblePersistence(input.persistenceStatus)
    && input.lifecycle !== 'completed'
  ) {
    throw new Error(
      'Support readiness persisted/no_updates status requires completed lifecycle',
    );
  }
  if (
    (input.lifecycle === 'queued' || input.lifecycle === 'running')
    && input.persistenceStatus !== 'pending'
    && input.persistenceStatus !== 'not_requested'
  ) {
    throw new Error(
      'Support readiness queued/running lifecycle requires pending or not_requested persistence',
    );
  }
  if (input.firstEligibleFutureTurn != null) {
    if (!Number.isInteger(input.firstEligibleFutureTurn) || input.firstEligibleFutureTurn < 1) {
      throw new Error('Support readiness firstEligibleFutureTurn must be a positive integer');
    }
    if (
      input.lifecycle !== 'completed'
      || !isFutureTurnEligiblePersistence(input.persistenceStatus)
    ) {
      throw new Error(
        'Support readiness future-turn eligibility requires completed lifecycle and persisted/no_updates status',
      );
    }
  }

  return Object.freeze({
    id: requiredText(input.id, 'id'),
    worker: input.worker,
    sourceMessageId: requiredText(input.sourceMessageId, 'sourceMessageId'),
    sourceGenerationId: input.sourceGenerationId?.trim() || undefined,
    lifecycle: input.lifecycle,
    persistenceStatus: input.persistenceStatus,
    firstEligibleFutureTurn: input.firstEligibleFutureTurn,
    unavailableToTriggeringResponse: true,
    queuedAt,
    startedAt,
    completedAt,
    reason: requiredText(input.reason, 'reason'),
    scope: 'session_debug_only',
  });
}

export function createSupportReadinessSnapshot(input: Omit<
  SupportReadinessSnapshot,
  'records' | 'scope'
> & Readonly<{
  records: readonly SupportCallReadinessRecord[];
}>): SupportReadinessSnapshot {
  const previousAssistantMessageId = requiredText(
    input.previousAssistantMessageId,
    'previousAssistantMessageId',
  );
  const previousAssistantGenerationId = input.previousAssistantGenerationId?.trim() || undefined;
  const records = Object.freeze(input.records.map((sourceRecord) => {
    const record = createSupportCallReadinessRecord(sourceRecord);
    if (record.sourceMessageId !== previousAssistantMessageId) {
      throw new Error(
        `Support readiness record ${record.id} does not belong to the previous assistant message`,
      );
    }
    if (
      previousAssistantGenerationId
      && record.sourceGenerationId !== previousAssistantGenerationId
    ) {
      throw new Error(
        `Support readiness record ${record.id} does not belong to the previous assistant generation`,
      );
    }
    return record;
  }));
  const workerIds = records.map((record) => record.worker);
  if (new Set(workerIds).size !== workerIds.length) {
    throw new Error('Support readiness snapshot requires at most one record per worker');
  }

  return Object.freeze({
    id: requiredText(input.id, 'id'),
    dispatchMessageId: requiredText(input.dispatchMessageId, 'dispatchMessageId'),
    dispatchGenerationId: input.dispatchGenerationId?.trim() || undefined,
    previousAssistantMessageId,
    previousAssistantGenerationId,
    capturedAt: optionalTimestamp(input.capturedAt, 'capturedAt')!,
    records,
    scope: 'session_debug_only',
  });
}
