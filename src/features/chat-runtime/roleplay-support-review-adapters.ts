import {
  createRoleplaySupportReviewEnvelope,
  getRoleplaySupportPromptTargets,
  type RoleplaySupportPersistenceStatus,
  type RoleplaySupportReviewEnvelope,
  type RoleplaySupportReviewItem,
  type RoleplaySupportWorker,
} from './roleplay-support-review-envelope';

type LegacySupportResultInput = {
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

export type LegacyMemoryExtractionReview = {
  acceptedEvents: string[];
  candidateReviews: Array<{
    id: string;
    label: string;
    accepted: true;
    reason: 'accepted_after_local_duplicate_review';
  }>;
  omittedCandidates: Array<{
    id: string;
    label: string;
    reason: 'near_duplicate_existing_memory';
  }>;
};

export function reviewLegacyMemoryExtractionEvents(input: {
  events: unknown;
  isNearDuplicate: (acceptedEvents: string[], candidate: string) => boolean;
}): LegacyMemoryExtractionReview {
  const acceptedEvents: string[] = [];
  const candidateReviews: LegacyMemoryExtractionReview['candidateReviews'] = [];
  const omittedCandidates: LegacyMemoryExtractionReview['omittedCandidates'] = [];
  const events = asArray(input.events)
    .filter((event): event is string => typeof event === 'string')
    .map((event) => event.trim())
    .filter(Boolean);

  events.forEach((event, index) => {
    const id = `memory-candidate-${index + 1}`;
    if (input.isNearDuplicate(acceptedEvents, event)) {
      omittedCandidates.push({
        id,
        label: event,
        reason: 'near_duplicate_existing_memory',
      });
      return;
    }
    acceptedEvents.push(event);
    candidateReviews.push({
      id,
      label: event,
      accepted: true,
      reason: 'accepted_after_local_duplicate_review',
    });
  });

  return { acceptedEvents, candidateReviews, omittedCandidates };
}

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

function itemFromRow(row: unknown, index: number, fallbackLabel: string): RoleplaySupportReviewItem {
  const value = asRecord(row);
  if (!value) {
    const text = asText(row);
    return {
      id: `${fallbackLabel}-${index + 1}`,
      label: text || `${fallbackLabel} ${index + 1}`,
      reason: 'legacy_response_item',
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
    || (value.accepted === true ? 'accepted' : 'legacy_response_item');
  const evidence = asText(value.evidence) || undefined;
  const category = asText(value.category) || asText(value.durabilityCategory) || undefined;
  const claimType = asText(value.claimType) || undefined;
  const sourceRole = asText(value.sourceRole) || undefined;
  const authority = asText(value.authority) || undefined;
  const modelFacingAction = asText(value.modelFacingAction) || undefined;
  const sourceMessageId = asText(value.sourceMessageId) || undefined;
  const sourceGenerationId = asText(value.sourceGenerationId) || undefined;
  const userCharacterId = asText(value.userCharacterId) || undefined;

  return {
    id,
    label,
    reason,
    evidence,
    category,
    claimType,
    sourceRole,
    authority,
    modelFacingAction,
    sourceMessageId,
    sourceGenerationId,
    userCharacterId,
  };
}

function splitReviewedRows(rows: unknown[], fallbackLabel: string): {
  accepted: RoleplaySupportReviewItem[];
  rejected: RoleplaySupportReviewItem[];
} {
  const accepted: RoleplaySupportReviewItem[] = [];
  const rejected: RoleplaySupportReviewItem[] = [];

  rows.forEach((row, index) => {
    const item = itemFromRow(row, index, fallbackLabel);
    const value = asRecord(row);
    if (value?.accepted === false || value?.frontendAccepted === false) rejected.push(item);
    else accepted.push(item);
  });

  return { accepted, rejected };
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
      .concat(asArray(response.rejectedUpdates));
    rows = reviewedApplyCandidates.length
      ? reviewedApplyCandidates
      : asArray(response.characterUpdateReviews).length
        ? asArray(response.characterUpdateReviews)
        : asArray(response.candidateReviews).length
          ? asArray(response.candidateReviews)
          : asArray(response.updates);
    fallbackLabel = 'character state candidate';
  } else if (worker === 'memory_extraction') {
    rows = asArray(response.candidateReviews).length
      ? asArray(response.candidateReviews)
      : asArray(response.extractedEvents);
    fallbackLabel = 'memory candidate';
  } else if (worker === 'goal_progress') {
    rows = asArray(response.stepCompletionReviews).length
      ? asArray(response.stepCompletionReviews)
      : asArray(response.classificationReviews).length
        ? asArray(response.classificationReviews)
        : asArray(response.stepUpdates);
    fallbackLabel = 'goal progress candidate';
  } else if (worker === 'goal_alignment') {
    rows = asArray(response.evaluations);
    fallbackLabel = 'goal alignment evaluation';
  } else if (worker === 'day_memory_compression') {
    const synopsis = asText(response.synopsis);
    const inputRowIds = asArray(response.inputRowIds).map(asText).filter(Boolean);
    const deletionEligibleRowIds = asArray(response.deletionEligibleRowIds).map(asText).filter(Boolean);
    rows = synopsis ? [{
      id: 'compressed-synopsis',
      label: synopsis,
      accepted: true,
      evidence: [
        inputRowIds.length ? `input rows: ${inputRowIds.join(', ')}` : '',
        deletionEligibleRowIds.length ? `deletion eligible: ${deletionEligibleRowIds.join(', ')}` : '',
      ].filter(Boolean).join('; '),
    }] : [];
    fallbackLabel = 'compressed synopsis';
  }

  const reviewed = splitReviewedRows(rows, fallbackLabel);
  const omittedRows = asArray(response.omitted)
    .concat(asArray(response.omittedCandidates))
    .concat(asArray(response.omittedRows))
    .concat(worker === 'character_state' ? asArray(response.missingCharacterStateReviews) : []);

  return {
    ...reviewed,
    omitted: omittedRows.map((row, index) => itemFromRow(row, index, 'omitted outcome')),
  };
}

export function wrapLegacyRoleplaySupportResult(
  input: LegacySupportResultInput,
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
    legacyWrapped: true,
  });
}
