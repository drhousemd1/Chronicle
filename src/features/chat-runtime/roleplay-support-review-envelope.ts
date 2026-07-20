export const ROLEPLAY_SUPPORT_WORKERS = [
  'character_state',
  'memory_extraction',
  'goal_progress',
  'goal_alignment',
  'day_memory_compression',
] as const;

export type RoleplaySupportWorker = (typeof ROLEPLAY_SUPPORT_WORKERS)[number];

export type RoleplaySupportReadiness =
  | 'pending'
  | 'completed'
  | 'no_updates'
  | 'rejected_only'
  | 'failed'
  | 'skipped_stale'
  | 'skipped_no_conversation'
  | 'source_not_persisted';

export type RoleplaySupportPersistenceStatus =
  | 'not_requested'
  | 'pending'
  | 'persisted'
  | 'persisted_runtime_state_pending'
  | 'no_updates'
  | 'failed'
  | 'skipped_stale'
  | 'source_not_persisted'
  | 'debug_only';

export type RoleplaySupportPromptTarget =
  | 'memory'
  | 'current_state'
  | 'goal_state'
  | 'summary';

export const ROLEPLAY_SUPPORT_REVIEW_ENVELOPE_CONTRACT = 'RoleplaySupportReviewEnvelope' as const;
export const ROLEPLAY_SUPPORT_REVIEW_ENVELOPE_VERSION = 2 as const;

export type RoleplaySupportWorkerArtifact = {
  worker: string;
  contract: string;
  version: number;
  artifactVersion: string;
};

export type RoleplaySupportReviewItem = {
  id: string;
  label: string;
  reason: string;
  evidence?: string;
  category?: string;
  sourceClassification?: string;
  claimType?: string;
  sourceRole?: string;
  evidenceBasis?: string;
  authority?: string;
  modelFacingAction?: string;
  sourceMessageId?: string;
  sourceGenerationId?: string;
  userCharacterId?: string;
  persistenceStatus?: string;
  persistenceTargetId?: string;
};

export type RoleplaySupportPersistence = {
  status: RoleplaySupportPersistenceStatus;
  targets: string[];
  reason: string;
};

export type RoleplaySupportFuturePromptImpact = {
  eligible: boolean;
  targets: RoleplaySupportPromptTarget[];
  reason: string;
};

export type RoleplaySupportReviewEnvelope = {
  contract: typeof ROLEPLAY_SUPPORT_REVIEW_ENVELOPE_CONTRACT;
  version: typeof ROLEPLAY_SUPPORT_REVIEW_ENVELOPE_VERSION;
  worker: RoleplaySupportWorker;
  workerArtifact?: RoleplaySupportWorkerArtifact;
  sourceMessageId?: string;
  sourceGenerationId?: string;
  accepted: RoleplaySupportReviewItem[];
  rejected: RoleplaySupportReviewItem[];
  omitted: RoleplaySupportReviewItem[];
  persistence: RoleplaySupportPersistence;
  readiness: RoleplaySupportReadiness;
  futurePromptImpact: RoleplaySupportFuturePromptImpact;
  contextGaps: string[];
};

export type CreateRoleplaySupportReviewEnvelopeInput = Omit<
  RoleplaySupportReviewEnvelope,
  'contract' | 'version' | 'accepted' | 'rejected' | 'omitted' | 'contextGaps'
> & {
  accepted?: RoleplaySupportReviewItem[];
  rejected?: RoleplaySupportReviewItem[];
  omitted?: RoleplaySupportReviewItem[];
  contextGaps?: string[];
};

export type FinalizeRoleplaySupportReviewEnvelopeInput = {
  persistenceStatus: RoleplaySupportPersistenceStatus;
  persistenceTargets?: string[];
  persistenceReason: string;
  contextGap?: string;
  accepted?: RoleplaySupportReviewItem[];
  rejected?: RoleplaySupportReviewItem[];
  omitted?: RoleplaySupportReviewItem[];
};

const ROLEPLAY_SUPPORT_WORKER_SET = new Set<string>(ROLEPLAY_SUPPORT_WORKERS);

export function isRoleplaySupportWorker(value: unknown): value is RoleplaySupportWorker {
  return typeof value === 'string' && ROLEPLAY_SUPPORT_WORKER_SET.has(value);
}

export function getRoleplaySupportPromptTargets(
  worker: RoleplaySupportWorker,
): RoleplaySupportPromptTarget[] {
  if (worker === 'character_state') return ['current_state'];
  if (worker === 'memory_extraction') return ['memory'];
  if (worker === 'goal_progress') return ['goal_state'];
  if (worker === 'day_memory_compression') return ['summary'];
  return [];
}

export function createRoleplaySupportReviewEnvelope(
  input: CreateRoleplaySupportReviewEnvelopeInput,
): RoleplaySupportReviewEnvelope {
  const accepted = input.accepted ?? [];
  const envelope: RoleplaySupportReviewEnvelope = {
    contract: ROLEPLAY_SUPPORT_REVIEW_ENVELOPE_CONTRACT,
    version: ROLEPLAY_SUPPORT_REVIEW_ENVELOPE_VERSION,
    worker: input.worker,
    workerArtifact: input.workerArtifact,
    sourceMessageId: input.sourceMessageId,
    sourceGenerationId: input.sourceGenerationId,
    accepted,
    rejected: input.rejected ?? [],
    omitted: input.omitted ?? [],
    persistence: input.persistence,
    readiness: input.readiness,
    futurePromptImpact: input.futurePromptImpact,
    contextGaps: input.contextGaps ?? [],
  };

  if (!isRoleplaySupportReviewEnvelopePromptEligible(envelope)) {
    envelope.futurePromptImpact = {
      eligible: false,
      targets: [],
      reason: input.futurePromptImpact.eligible
        ? `blocked_by_support_envelope_invariant:${input.futurePromptImpact.reason}`
        : input.futurePromptImpact.reason,
    };
  }

  return envelope;
}

export function isRoleplaySupportReviewEnvelopePromptEligible(
  envelope: RoleplaySupportReviewEnvelope,
): boolean {
  const persistedAcceptedItems = envelope.accepted.filter((item) => (
    item.persistenceStatus
      ? item.persistenceStatus === 'persisted'
      : envelope.persistence.status === 'persisted'
  ));
  return envelope.worker !== 'goal_alignment'
    && envelope.readiness === 'completed'
    && envelope.persistence.status === 'persisted'
    && persistedAcceptedItems.length > 0
    && envelope.futurePromptImpact.eligible
    && envelope.futurePromptImpact.targets.length > 0;
}

export function createPendingRoleplaySupportReviewEnvelope(input: {
  worker: RoleplaySupportWorker;
  sourceMessageId?: string;
  sourceGenerationId?: string;
}): RoleplaySupportReviewEnvelope {
  return createRoleplaySupportReviewEnvelope({
    ...input,
    persistence: {
      status: 'pending',
      targets: [],
      reason: 'support_worker_result_pending',
    },
    readiness: 'pending',
    futurePromptImpact: {
      eligible: false,
      targets: [],
      reason: 'support_worker_result_pending',
    },
  });
}

export function finalizeRoleplaySupportReviewEnvelope(
  envelope: RoleplaySupportReviewEnvelope,
  input: FinalizeRoleplaySupportReviewEnvelopeInput,
): RoleplaySupportReviewEnvelope {
  const accepted = input.accepted ?? envelope.accepted;
  const rejected = input.rejected ?? envelope.rejected;
  const omitted = input.omitted ?? envelope.omitted;
  const hasPersistedAcceptedItem = accepted.some((item) => (
    item.persistenceStatus
      ? item.persistenceStatus === 'persisted'
      : input.persistenceStatus === 'persisted'
  ));
  const readiness: RoleplaySupportReadiness = input.persistenceStatus === 'failed'
    ? 'failed'
    : input.persistenceStatus === 'skipped_stale'
      ? 'skipped_stale'
      : input.persistenceStatus === 'source_not_persisted'
        ? 'source_not_persisted'
        : accepted.length > 0
          ? 'completed'
          : rejected.length > 0
            ? 'rejected_only'
            : 'no_updates';
  const promptTargets = getRoleplaySupportPromptTargets(envelope.worker);
  const eligible = input.persistenceStatus === 'persisted'
    && envelope.worker !== 'goal_alignment'
    && hasPersistedAcceptedItem
    && promptTargets.length > 0;

  return createRoleplaySupportReviewEnvelope({
    ...envelope,
    accepted,
    rejected,
    omitted,
    persistence: {
      status: input.persistenceStatus,
      targets: input.persistenceTargets ?? [],
      reason: input.persistenceReason,
    },
    readiness,
    futurePromptImpact: {
      eligible,
      targets: eligible ? promptTargets : [],
      reason: eligible
        ? 'accepted_output_persisted_for_future_prompt_use'
        : input.persistenceStatus === 'failed'
          ? 'persistence_failed'
          : input.persistenceStatus === 'skipped_stale'
            ? 'superseded_generation'
            : input.persistenceStatus === 'source_not_persisted'
              ? 'source_not_persisted'
              : 'no_eligible_persisted_output',
    },
    contextGaps: input.contextGap
      ? [...envelope.contextGaps, input.contextGap]
      : envelope.contextGaps,
  });
}
