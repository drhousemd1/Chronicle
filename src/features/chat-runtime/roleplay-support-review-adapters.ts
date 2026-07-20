import {
  createRoleplaySupportReviewEnvelope,
  getRoleplaySupportPromptTargets,
  type RoleplaySupportPersistenceStatus,
  type RoleplaySupportReviewEnvelope,
  type RoleplaySupportReviewItem,
  type RoleplaySupportWorker,
  type RoleplaySupportWorkerArtifact,
} from './roleplay-support-review-envelope';

type SupportWorkerResultInput = {
  worker: RoleplaySupportWorker;
  sourceMessageId?: string;
  sourceGenerationId?: string;
  responseBody: unknown;
  error?: string;
  sourceCurrent?: boolean;
  persistenceStatus?: RoleplaySupportPersistenceStatus;
  persistenceTargets?: string[];
  persistenceReason?: string;
  omitted?: RoleplaySupportReviewItem[];
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function readWorkerArtifact(responseBody: unknown): RoleplaySupportWorkerArtifact | undefined {
  const value = asRecord(asRecord(responseBody)?.workerArtifact);
  const worker = asText(value?.worker);
  const contract = asText(value?.contract);
  const artifactVersion = asText(value?.artifactVersion);
  const version = value?.version;
  if (!worker || !contract || !artifactVersion || typeof version !== 'number') return undefined;
  return { worker, contract, version, artifactVersion };
}

function itemFromRow(row: unknown, index: number, fallbackLabel: string): RoleplaySupportReviewItem {
  const value = asRecord(row);
  if (!value) {
    const text = asText(row);
    return {
      id: `${fallbackLabel}-${index + 1}`,
      label: text || `${fallbackLabel} ${index + 1}`,
      reason: 'unclassified_worker_response_item',
    };
  }

  const id = asText(value.id)
    || asText(value.stepId)
    || asText(value.character)
    || asText(value.characterName)
    || `${fallbackLabel}-${index + 1}`;
  const label = asText(value.label)
    || asText(value.description)
    || asText(value.value)
    || asText(value.character)
    || asText(value.characterName)
    || `${fallbackLabel} ${index + 1}`;
  const reason = asText(value.reason)
    || asText(value.rejectionReason)
    || asText(value.missingReviewReason)
    || (value.accepted === true ? 'accepted' : 'unclassified_worker_response_item');
  const evidence = asText(value.evidence) || undefined;
  const category = asText(value.category) || asText(value.durabilityCategory) || undefined;
  const sourceClassification = asText(value.sourceClassification) || undefined;
  const claimType = asText(value.claimType) || undefined;
  const sourceRole = asText(value.sourceRole) || undefined;
  const evidenceBasis = asText(value.evidenceBasis) || undefined;
  const authority = asText(value.authority) || undefined;
  const modelFacingAction = asText(value.modelFacingAction) || undefined;
  const sourceMessageId = asText(value.sourceMessageId) || undefined;
  const sourceGenerationId = asText(value.sourceGenerationId) || undefined;
  const userCharacterId = asText(value.userCharacterId) || undefined;
  const persistenceStatus = asText(value.persistenceStatus) || undefined;
  const persistenceTargetId = asText(value.persistenceTargetId) || undefined;

  return {
    id,
    label,
    reason,
    evidence,
    category,
    sourceClassification,
    claimType,
    sourceRole,
    evidenceBasis,
    authority,
    modelFacingAction,
    sourceMessageId,
    sourceGenerationId,
    userCharacterId,
    persistenceStatus,
    persistenceTargetId,
  };
}

function splitReviewedRows(rows: unknown[], fallbackLabel: string): {
  accepted: RoleplaySupportReviewItem[];
  rejected: RoleplaySupportReviewItem[];
  omitted: RoleplaySupportReviewItem[];
} {
  const accepted: RoleplaySupportReviewItem[] = [];
  const rejected: RoleplaySupportReviewItem[] = [];
  const omitted: RoleplaySupportReviewItem[] = [];

  rows.forEach((row, index) => {
    const item = itemFromRow(row, index, fallbackLabel);
    const value = asRecord(row);
    if (value?.accepted === true || value?.frontendAccepted === true) accepted.push(item);
    else if (value?.accepted === false || value?.frontendAccepted === false) rejected.push(item);
    else omitted.push(item);
  });

  return { accepted, rejected, omitted };
}

function workerRows(worker: RoleplaySupportWorker, responseBody: unknown): {
  accepted: RoleplaySupportReviewItem[];
  rejected: RoleplaySupportReviewItem[];
  omitted: RoleplaySupportReviewItem[];
} {
  const response = asRecord(responseBody) || {};
  let rows: unknown[] = [];
  let fallbackLabel = worker.replace(/_/g, ' ');

  if (worker === 'character_state') {
    const reviewedApplyCandidates = asArray(response.acceptedUpdates)
      .map((row) => ({ ...(asRecord(row) || {}), frontendAccepted: true }))
      .concat(asArray(response.rejectedUpdates)
        .map((row) => ({ ...(asRecord(row) || {}), frontendAccepted: false })));
    rows = reviewedApplyCandidates.length
      ? reviewedApplyCandidates
      : asArray(response.characterUpdateReviews).length
        ? asArray(response.characterUpdateReviews)
        : asArray(response.candidateReviews).length
          ? asArray(response.candidateReviews)
          : asArray(response.updates);
    fallbackLabel = 'character state candidate';
  } else if (worker === 'memory_extraction') {
    rows = asArray(response.candidateReviews);
    fallbackLabel = 'memory candidate';
  } else if (worker === 'goal_progress') {
    rows = asArray(response.stepCompletionReviews).length
      ? asArray(response.stepCompletionReviews)
      : asArray(response.classificationReviews).length
        ? asArray(response.classificationReviews)
        : asArray(response.stepUpdates);
    fallbackLabel = 'goal progress candidate';
  } else if (worker === 'goal_alignment') {
    rows = asArray(response.alignmentReviews).length
      ? asArray(response.alignmentReviews)
      : asArray(response.evaluations);
    fallbackLabel = 'goal alignment evaluation';
  } else if (worker === 'day_memory_compression') {
    const synopsis = asText(response.synopsis);
    const inputMemoryRowIds = asArray(response.inputMemoryRows)
      .map((row) => asText(asRecord(row)?.id))
      .filter(Boolean);
    const compressedInputMemoryRowIds = asArray(response.compressedInputMemoryRowIds)
      .map(asText)
      .filter(Boolean);
    const deletedInputMemoryRowIds = asArray(response.deletedInputMemoryRowIds)
      .map(asText)
      .filter(Boolean);
    const synopsisRows = synopsis && compressedInputMemoryRowIds.length > 0 ? [{
      id: 'compressed-synopsis',
      label: synopsis,
      accepted: true,
      evidence: [
        inputMemoryRowIds.length ? `input rows: ${inputMemoryRowIds.join(', ')}` : '',
        `compressed rows: ${compressedInputMemoryRowIds.join(', ')}`,
        deletedInputMemoryRowIds.length ? `deleted rows: ${deletedInputMemoryRowIds.join(', ')}` : '',
      ].filter(Boolean).join('; '),
    }] : [];
    const rejectedRows = asArray(response.rejectedInputMemoryRows).map((row) => ({
      ...(asRecord(row) || {}),
      accepted: false,
      label: asText(asRecord(row)?.id) || 'rejected compression row',
    }));
    rows = [...synopsisRows, ...rejectedRows];
    fallbackLabel = 'compressed synopsis';
  }

  const reviewed = splitReviewedRows(rows, fallbackLabel);
  const omittedRows = asArray(response.omitted)
    .concat(asArray(response.omittedCandidates))
    .concat(asArray(response.omittedRows))
    .concat(worker === 'day_memory_compression' ? asArray(response.omittedInputMemoryRowIds) : [])
    .concat(worker === 'character_state' ? asArray(response.missingCharacterStateReviews) : []);

  return {
    accepted: reviewed.accepted,
    rejected: reviewed.rejected,
    omitted: [
      ...reviewed.omitted,
      ...omittedRows.map((row, index) => itemFromRow(row, index, 'omitted outcome')),
    ],
  };
}

export function createRoleplaySupportReviewEnvelopeFromWorkerResult(
  input: SupportWorkerResultInput,
): RoleplaySupportReviewEnvelope {
  const outcomes = workerRows(input.worker, input.responseBody);
  const omitted = [...outcomes.omitted, ...(input.omitted ?? [])];
  const sourceCurrent = input.sourceCurrent !== false;
  const persistenceStatus = input.error
    ? 'failed'
    : !sourceCurrent
      ? 'skipped_stale'
      : input.worker === 'goal_alignment'
        ? 'debug_only'
        : input.persistenceStatus
          ?? (outcomes.accepted.length > 0 ? 'pending' : 'no_updates');
  const readiness = input.error
    ? 'failed'
    : !sourceCurrent
      ? 'skipped_stale'
      : outcomes.accepted.length > 0
        ? 'completed'
        : outcomes.rejected.length > 0
          ? 'rejected_only'
          : 'no_updates';
  const promptTargets = getRoleplaySupportPromptTargets(input.worker);
  const futurePromptEligible = persistenceStatus === 'persisted' && promptTargets.length > 0;
  const contextGaps = input.error
    ? [`${input.worker} failed: ${input.error}`]
    : !sourceCurrent
      ? [`${input.worker} output came from a superseded message generation.`]
      : persistenceStatus === 'pending' && outcomes.accepted.length > 0
        ? [`${input.worker} accepted output is not available to a future prompt until persistence succeeds.`]
        : [];

  return createRoleplaySupportReviewEnvelope({
    worker: input.worker,
    workerArtifact: readWorkerArtifact(input.responseBody),
    sourceMessageId: input.sourceMessageId,
    sourceGenerationId: input.sourceGenerationId,
    accepted: outcomes.accepted,
    rejected: outcomes.rejected,
    omitted,
    persistence: {
      status: persistenceStatus,
      targets: input.persistenceTargets ?? [],
      reason: input.persistenceReason
        ?? (input.error
          ? 'support_worker_failed'
          : !sourceCurrent
            ? 'superseded_generation_not_persisted'
            : persistenceStatus === 'debug_only'
              ? 'diagnostic_only_worker'
              : persistenceStatus === 'pending'
                ? 'accepted_output_not_yet_persisted'
                : persistenceStatus === 'no_updates'
                  ? 'no_persistable_updates'
                  : persistenceStatus),
    },
    readiness,
    futurePromptImpact: {
      eligible: futurePromptEligible,
      targets: futurePromptEligible ? promptTargets : [],
      reason: futurePromptEligible
        ? 'accepted_output_persisted_for_future_prompt_use'
        : input.worker === 'goal_alignment'
          ? 'goal_alignment_is_diagnostic_only'
          : persistenceStatus === 'pending'
            ? 'persistence_pending'
            : persistenceStatus === 'skipped_stale'
              ? 'superseded_generation'
              : persistenceStatus === 'failed'
                ? 'persistence_or_worker_failed'
                : 'no_eligible_persisted_output',
    },
    contextGaps,
  });
}
