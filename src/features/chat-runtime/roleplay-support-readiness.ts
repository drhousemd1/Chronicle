import type {
  RoleplaySupportPersistenceStatus,
  RoleplaySupportWorker,
} from './roleplay-support-review-envelope';
import type {
  RoleplayResponseJob,
  RoleplayResponseMode,
  RoleplayResponsePurpose,
} from './roleplay-response-job';

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
  firstEligibleResponseJobId?: string;
  firstEligibleAt?: number;
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
  responseJobId: string;
  responseJobMode: RoleplayResponseMode;
  responseJobPurpose: RoleplayResponsePurpose;
  previousAssistantMessageId: string;
  previousAssistantGenerationId?: string;
  capturedAt: number;
  records: readonly SupportCallReadinessRecord[];
  scope: 'session_debug_only';
}>;

export type AdvanceSupportCallReadinessInput = Readonly<{
  lifecycle: SupportCallLifecycle;
  occurredAt: number;
  persistenceStatus?: RoleplaySupportPersistenceStatus;
  reason: string;
  firstEligibleFutureTurn?: number;
}>;

export type CaptureSupportReadinessForResponseJobInput = Readonly<{
  snapshotId: string;
  dispatchMessageId: string;
  dispatchGenerationId?: string;
  previousAssistantMessageId: string;
  previousAssistantGenerationId?: string;
  capturedAt: number;
  dispatchOrdinal: number;
  responseJob: Pick<RoleplayResponseJob, 'id' | 'mode' | 'purpose'>;
  records: readonly SupportCallReadinessRecord[];
}>;

export type CapturedSupportReadiness = Readonly<{
  snapshot: SupportReadinessSnapshot;
  updatedRecords: readonly SupportCallReadinessRecord[];
  newlyEligibleRecords: readonly SupportCallReadinessRecord[];
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
  return status === 'persisted';
}

export function createSupportCallReadinessRecord(input: Omit<
  SupportCallReadinessRecord,
  'unavailableToTriggeringResponse' | 'scope'
>): SupportCallReadinessRecord {
  const queuedAt = optionalTimestamp(input.queuedAt, 'queuedAt');
  const startedAt = optionalTimestamp(input.startedAt, 'startedAt');
  const completedAt = optionalTimestamp(input.completedAt, 'completedAt');
  const firstEligibleAt = optionalTimestamp(input.firstEligibleAt, 'firstEligibleAt');
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
      'Support readiness persisted status requires completed lifecycle',
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
        'Support readiness future-turn eligibility requires completed lifecycle and persisted status',
      );
    }
    if (!input.firstEligibleResponseJobId?.trim()) {
      throw new Error('Support readiness future-turn eligibility requires response job identity');
    }
    if (firstEligibleAt == null) {
      throw new Error('Support readiness future-turn eligibility requires capture timestamp');
    }
  } else if (input.firstEligibleResponseJobId != null || firstEligibleAt != null) {
    throw new Error('Support readiness response-job eligibility fields require future-turn eligibility');
  }

  return Object.freeze({
    id: requiredText(input.id, 'id'),
    worker: input.worker,
    sourceMessageId: requiredText(input.sourceMessageId, 'sourceMessageId'),
    sourceGenerationId: input.sourceGenerationId?.trim() || undefined,
    lifecycle: input.lifecycle,
    persistenceStatus: input.persistenceStatus,
    firstEligibleFutureTurn: input.firstEligibleFutureTurn,
    firstEligibleResponseJobId: input.firstEligibleResponseJobId?.trim() || undefined,
    firstEligibleAt,
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
    return createSupportCallReadinessRecord(sourceRecord);
  }));
  const recordKeys = records.map((record) => [
    record.worker,
    record.sourceMessageId,
    record.sourceGenerationId || '',
  ].join(':'));
  if (new Set(recordKeys).size !== recordKeys.length) {
    throw new Error('Support readiness snapshot requires at most one record per worker and source generation');
  }

  return Object.freeze({
    id: requiredText(input.id, 'id'),
    dispatchMessageId: requiredText(input.dispatchMessageId, 'dispatchMessageId'),
    dispatchGenerationId: input.dispatchGenerationId?.trim() || undefined,
    responseJobId: requiredText(input.responseJobId, 'responseJobId'),
    responseJobMode: input.responseJobMode,
    responseJobPurpose: input.responseJobPurpose,
    previousAssistantMessageId,
    previousAssistantGenerationId,
    capturedAt: optionalTimestamp(input.capturedAt, 'capturedAt')!,
    records,
    scope: 'session_debug_only',
  });
}

export function advanceSupportCallReadinessRecord(
  record: SupportCallReadinessRecord,
  input: AdvanceSupportCallReadinessInput,
): SupportCallReadinessRecord {
  const occurredAt = optionalTimestamp(input.occurredAt, 'occurredAt')!;
  const isTerminal = input.lifecycle === 'completed'
    || input.lifecycle === 'failed'
    || input.lifecycle === 'skipped'
    || input.lifecycle === 'stale';
  const queuedAt = record.queuedAt ?? occurredAt;
  const startedAt = input.lifecycle === 'queued'
    ? undefined
    : record.startedAt ?? occurredAt;

  return createSupportCallReadinessRecord({
    ...record,
    lifecycle: input.lifecycle,
    persistenceStatus: input.persistenceStatus ?? record.persistenceStatus,
    firstEligibleFutureTurn: input.firstEligibleFutureTurn ?? record.firstEligibleFutureTurn,
    queuedAt,
    startedAt,
    completedAt: isTerminal ? occurredAt : undefined,
    reason: input.reason,
  });
}

export function markSupportCallReadinessEligible(
  record: SupportCallReadinessRecord,
  firstEligibleFutureTurn: number,
  firstEligibleResponseJobId: string,
  firstEligibleAt: number,
): SupportCallReadinessRecord {
  return createSupportCallReadinessRecord({
    ...record,
    firstEligibleFutureTurn,
    firstEligibleResponseJobId,
    firstEligibleAt,
  });
}

export function captureSupportReadinessForResponseJob(
  input: CaptureSupportReadinessForResponseJobInput,
): CapturedSupportReadiness {
  if (!Number.isInteger(input.dispatchOrdinal) || input.dispatchOrdinal < 1) {
    throw new Error('Support readiness dispatch ordinal must be a positive integer');
  }

  const newlyEligibleRecords: SupportCallReadinessRecord[] = [];
  const updatedRecords = input.records.map((record) => {
    if (
      record.firstEligibleFutureTurn == null
      && record.lifecycle === 'completed'
      && record.persistenceStatus === 'persisted'
    ) {
      const eligibleRecord = markSupportCallReadinessEligible(
        record,
        input.dispatchOrdinal,
        input.responseJob.id,
        input.capturedAt,
      );
      newlyEligibleRecords.push(eligibleRecord);
      return eligibleRecord;
    }
    return record;
  });

  return Object.freeze({
    snapshot: createSupportReadinessSnapshot({
      id: input.snapshotId,
      dispatchMessageId: input.dispatchMessageId,
      dispatchGenerationId: input.dispatchGenerationId,
      responseJobId: input.responseJob.id,
      responseJobMode: input.responseJob.mode,
      responseJobPurpose: input.responseJob.purpose,
      previousAssistantMessageId: input.previousAssistantMessageId,
      previousAssistantGenerationId: input.previousAssistantGenerationId,
      capturedAt: input.capturedAt,
      records: updatedRecords,
    }),
    updatedRecords: Object.freeze(updatedRecords),
    newlyEligibleRecords: Object.freeze(newlyEligibleRecords),
  });
}
