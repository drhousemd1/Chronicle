import {
  ROLEPLAY_USER_STATE_CLAIM_TYPES,
  classifyRoleplayUserStateClaim,
  type RoleplayUserStateAuthority,
  type RoleplayUserStateClaimType,
  type RoleplayUserStateEvidenceBasis,
  type RoleplayUserStateModelFacingAction,
} from './roleplay-user-state-authority';

export type RoleplayMemorySourceMessage = {
  id: string;
  generationId?: string;
  text: string;
};

export type RoleplayMemoryUserCharacter = {
  id: string;
  name: string;
  previousNames?: string[];
};

export type RoleplayMemoryCandidateReview = {
  id: string;
  label: string;
  accepted: boolean;
  reason: string;
  evidence?: string;
  durabilityCategory?: RoleplayMemoryDurabilityCategory;
  sourceClassification?: RoleplayMemorySourceClassification;
  claimType?: RoleplayUserStateClaimType;
  sourceRole?: 'user' | 'assistant';
  evidenceBasis?: RoleplayUserStateEvidenceBasis;
  authority?: RoleplayUserStateAuthority;
  modelFacingAction?: RoleplayUserStateModelFacingAction;
  sourceMessageId?: string;
  sourceGenerationId?: string;
  userCharacterId?: string;
};

export const ROLEPLAY_MEMORY_DURABILITY_CATEGORIES = [
  'durable_relationship_dynamic',
  'meaningful_behavior_shift',
  'character_status_change',
  'durable_preference_or_boundary',
  'durable_scene_or_world_fact',
  'meaningful_interaction_pattern',
  'temporary_scene_state',
  'not_memory',
] as const;

export type RoleplayMemoryDurabilityCategory =
  (typeof ROLEPLAY_MEMORY_DURABILITY_CATEGORIES)[number];

export const ROLEPLAY_MEMORY_SOURCE_CLASSIFICATIONS = [
  'raw_user_fact',
  'accepted_assistant_observable_change',
  'assistant_interpretation',
  'unsupported_overreach',
  'static_descriptor',
  'duplicate_existing_memory',
  'repeated_phrase',
  'support_artifact',
] as const;

export type RoleplayMemorySourceClassification =
  (typeof ROLEPLAY_MEMORY_SOURCE_CLASSIFICATIONS)[number];

export type MemoryExtractionCandidateV1 = {
  id: string;
  candidateText: string;
  decision: 'accepted' | 'rejected';
  durabilityCategory: RoleplayMemoryDurabilityCategory;
  sourceClassification: RoleplayMemorySourceClassification;
  evidence: string;
  rejectionReason?: string;
  appliesToUserCharacter: boolean;
  userCharacterName?: string;
  claimType?: RoleplayUserStateClaimType;
  sourceRole: 'user' | 'assistant';
  evidenceBasis: RoleplayUserStateEvidenceBasis | 'not_applicable';
  authorityReason: string;
};

export const MEMORY_EXTRACTION_RESPONSE_CONTRACT = 'MemoryExtractionResponseV1' as const;
export const MEMORY_EXTRACTION_RESPONSE_VERSION = 1 as const;
export const MEMORY_EXTRACTION_WORKER_ARTIFACT_VERSION = 'extract-memory-events-candidates-v1' as const;

export type MemoryExtractionWorkerArtifactV1 = {
  worker: 'extract-memory-events';
  contract: typeof MEMORY_EXTRACTION_RESPONSE_CONTRACT;
  version: typeof MEMORY_EXTRACTION_RESPONSE_VERSION;
  artifactVersion: string;
};

export type MemoryExtractionResponseV1 = {
  contract: typeof MEMORY_EXTRACTION_RESPONSE_CONTRACT;
  version: typeof MEMORY_EXTRACTION_RESPONSE_VERSION;
  workerArtifact: MemoryExtractionWorkerArtifactV1;
  candidates: unknown[];
};

export type MemoryExtractionResponseParseResult =
  | { ok: true; response: MemoryExtractionResponseV1 }
  | { ok: false; reason: string };

export type RoleplayMemoryOmittedCandidate = Omit<RoleplayMemoryCandidateReview, 'accepted'>;

export type RoleplayMemoryExtractionReview = {
  acceptedEvents: string[];
  candidateReviews: RoleplayMemoryCandidateReview[];
  omittedCandidates: RoleplayMemoryOmittedCandidate[];
};

type NormalizedReviewRow = {
  eventIndex: number;
  event: string;
  appliesToUserCharacter: boolean;
  userCharacterName?: string;
  claimType?: RoleplayUserStateClaimType;
  sourceRole?: 'user' | 'assistant';
  evidenceBasis?: RoleplayUserStateEvidenceBasis | 'not_applicable';
  evidence: string;
  reason: string;
};

const CLAIM_TYPE_SET = new Set<string>(ROLEPLAY_USER_STATE_CLAIM_TYPES);
const EVIDENCE_BASIS_SET = new Set<string>([
  'explicit_user_authorship',
  'accepted_visible_observation',
  'in_character_interpretation',
  'unsupported',
  'not_applicable',
]);
const DURABILITY_CATEGORY_SET = new Set<string>(ROLEPLAY_MEMORY_DURABILITY_CATEGORIES);
const SOURCE_CLASSIFICATION_SET = new Set<string>(ROLEPLAY_MEMORY_SOURCE_CLASSIFICATIONS);
const ACCEPTED_DURABILITY_CATEGORY_SET = new Set<RoleplayMemoryDurabilityCategory>([
  'durable_relationship_dynamic',
  'meaningful_behavior_shift',
  'character_status_change',
  'durable_preference_or_boundary',
  'durable_scene_or_world_fact',
  'meaningful_interaction_pattern',
]);
const ACCEPTED_SOURCE_CLASSIFICATION_SET = new Set<RoleplayMemorySourceClassification>([
  'raw_user_fact',
  'accepted_assistant_observable_change',
]);

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function parseMemoryExtractionResponseV1(
  value: unknown,
): MemoryExtractionResponseParseResult {
  const response = asRecord(value);
  if (!response) return { ok: false, reason: 'memory_response_not_object' };
  if (response.contract !== MEMORY_EXTRACTION_RESPONSE_CONTRACT) {
    return { ok: false, reason: 'memory_response_contract_mismatch' };
  }
  if (response.version !== MEMORY_EXTRACTION_RESPONSE_VERSION) {
    return { ok: false, reason: 'memory_response_version_mismatch' };
  }
  if (
    Object.prototype.hasOwnProperty.call(response, 'events')
    || Object.prototype.hasOwnProperty.call(response, 'extractedEvents')
    || Object.prototype.hasOwnProperty.call(response, 'userStateReviews')
  ) {
    return { ok: false, reason: 'memory_response_contains_obsolete_aliases' };
  }
  if (!Array.isArray(response.candidates)) {
    return { ok: false, reason: 'memory_response_candidates_not_array' };
  }

  const workerArtifact = asRecord(response.workerArtifact);
  if (
    workerArtifact?.worker !== 'extract-memory-events'
    || workerArtifact.contract !== MEMORY_EXTRACTION_RESPONSE_CONTRACT
    || workerArtifact.version !== MEMORY_EXTRACTION_RESPONSE_VERSION
    || asText(workerArtifact.artifactVersion) !== MEMORY_EXTRACTION_WORKER_ARTIFACT_VERSION
  ) {
    return { ok: false, reason: 'memory_response_worker_artifact_invalid' };
  }

  return {
    ok: true,
    response: {
      contract: MEMORY_EXTRACTION_RESPONSE_CONTRACT,
      version: MEMORY_EXTRACTION_RESPONSE_VERSION,
      workerArtifact: {
        worker: 'extract-memory-events',
        contract: MEMORY_EXTRACTION_RESPONSE_CONTRACT,
        version: MEMORY_EXTRACTION_RESPONSE_VERSION,
        artifactVersion: asText(workerArtifact.artifactVersion),
      },
      candidates: response.candidates,
    },
  };
}

function normalizeForEvidenceMatch(value: string): string {
  return value
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .toLowerCase()
    .replace(/[*_`~()[\]{}<>]/g, ' ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeForIdentityMatch(value: string): string {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function evidenceAppearsInSource(evidence: string, sourceText: string): boolean {
  const normalizedEvidence = normalizeForEvidenceMatch(evidence);
  return normalizedEvidence.length >= 3
    && normalizeForEvidenceMatch(sourceText).includes(normalizedEvidence);
}

function normalizeReviewRow(value: unknown): NormalizedReviewRow | null {
  const row = asRecord(value);
  if (!row || !Number.isInteger(row.eventIndex) || typeof row.appliesToUserCharacter !== 'boolean') {
    return null;
  }
  const sourceRole = row.sourceRole === 'user' || row.sourceRole === 'assistant'
    ? row.sourceRole
    : undefined;
  const claimType = CLAIM_TYPE_SET.has(asText(row.claimType))
    ? asText(row.claimType) as RoleplayUserStateClaimType
    : undefined;
  const evidenceBasis = EVIDENCE_BASIS_SET.has(asText(row.evidenceBasis))
    ? asText(row.evidenceBasis) as NormalizedReviewRow['evidenceBasis']
    : undefined;
  return {
    eventIndex: row.eventIndex as number,
    event: asText(row.event),
    appliesToUserCharacter: row.appliesToUserCharacter,
    userCharacterName: asText(row.userCharacterName) || undefined,
    claimType,
    sourceRole,
    evidenceBasis,
    evidence: asText(row.evidence),
    reason: asText(row.reason),
  };
}

function normalizeMemoryCandidate(value: unknown, index: number): MemoryExtractionCandidateV1 | null {
  const row = asRecord(value);
  if (!row) return null;
  const candidateText = asText(row.candidateText);
  const decision = row.decision === 'accepted' || row.decision === 'rejected'
    ? row.decision
    : null;
  const durabilityCategory = DURABILITY_CATEGORY_SET.has(asText(row.durabilityCategory))
    ? asText(row.durabilityCategory) as RoleplayMemoryDurabilityCategory
    : null;
  const sourceClassification = SOURCE_CLASSIFICATION_SET.has(asText(row.sourceClassification))
    ? asText(row.sourceClassification) as RoleplayMemorySourceClassification
    : null;
  const sourceRole = row.sourceRole === 'user' || row.sourceRole === 'assistant'
    ? row.sourceRole
    : null;
  const evidenceBasis = EVIDENCE_BASIS_SET.has(asText(row.evidenceBasis))
    ? asText(row.evidenceBasis) as MemoryExtractionCandidateV1['evidenceBasis']
    : null;
  const claimType = CLAIM_TYPE_SET.has(asText(row.claimType))
    ? asText(row.claimType) as RoleplayUserStateClaimType
    : undefined;

  if (
    !candidateText
    || !decision
    || !durabilityCategory
    || !sourceClassification
    || !sourceRole
    || !evidenceBasis
    || typeof row.appliesToUserCharacter !== 'boolean'
    || !asText(row.evidence)
    || !asText(row.authorityReason)
  ) {
    return null;
  }

  return {
    id: asText(row.id) || `memory-candidate-${index + 1}`,
    candidateText,
    decision,
    durabilityCategory,
    sourceClassification,
    evidence: asText(row.evidence),
    rejectionReason: asText(row.rejectionReason) || undefined,
    appliesToUserCharacter: row.appliesToUserCharacter,
    userCharacterName: asText(row.userCharacterName) || undefined,
    claimType,
    sourceRole,
    evidenceBasis,
    authorityReason: asText(row.authorityReason),
  };
}

function rejectedMemoryCandidateReview(
  candidate: MemoryExtractionCandidateV1,
  reason: string,
  input: Pick<
    Parameters<typeof reviewRoleplayMemoryExtractionCandidates>[0],
    'userSourceMessage' | 'assistantSourceMessage' | 'assistantSourceAccepted' | 'userCharacters'
  >,
): RoleplayMemoryCandidateReview {
  const sourceMessage = candidate.sourceRole === 'user'
    ? input.userSourceMessage
    : input.assistantSourceMessage;
  const sourceIdentityVerified = Boolean(
    sourceMessage && evidenceAppearsInSource(candidate.evidence, sourceMessage.text),
  );
  const userCharacter = candidate.appliesToUserCharacter
    ? findUserCharacter(candidate.userCharacterName, input.userCharacters)
    : undefined;
  const authorityDecision = sourceIdentityVerified
    && userCharacter
    && candidate.claimType
    && candidate.evidenceBasis !== 'not_applicable'
    ? classifyRoleplayUserStateClaim({
        claim: candidate.candidateText,
        userCharacterId: userCharacter.id,
        claimType: candidate.claimType,
        sourceMessageId: sourceMessage?.id,
        sourceGenerationId: sourceMessage?.generationId,
        sourceRole: candidate.sourceRole,
        sourceGenerationAccepted: candidate.sourceRole === 'assistant'
          ? input.assistantSourceAccepted
          : undefined,
        evidenceBasis: candidate.evidenceBasis,
        intendedUse: 'persistence',
      })
    : undefined;

  return {
    id: candidate.id,
    label: candidate.candidateText,
    accepted: false,
    reason,
    evidence: candidate.evidence,
    durabilityCategory: candidate.durabilityCategory,
    sourceClassification: candidate.sourceClassification,
    claimType: candidate.claimType,
    sourceRole: candidate.sourceRole,
    evidenceBasis: candidate.evidenceBasis === 'not_applicable'
      ? undefined
      : candidate.evidenceBasis,
    authority: authorityDecision?.authority,
    modelFacingAction: 'reject_from_persistence',
    sourceMessageId: sourceIdentityVerified ? sourceMessage?.id : undefined,
    sourceGenerationId: sourceIdentityVerified ? sourceMessage?.generationId : undefined,
    userCharacterId: authorityDecision?.userCharacterId,
  };
}

export function reviewRoleplayMemoryExtractionCandidates(input: {
  candidates: unknown;
  userSourceMessage?: RoleplayMemorySourceMessage;
  assistantSourceMessage: RoleplayMemorySourceMessage;
  assistantSourceAccepted: boolean;
  userCharacters: RoleplayMemoryUserCharacter[];
  isNearDuplicate: (acceptedEvents: string[], candidate: string) => boolean;
}): RoleplayMemoryExtractionReview {
  const rawCandidates = Array.isArray(input.candidates) ? input.candidates : [];
  const candidateReviews: RoleplayMemoryCandidateReview[] = [];
  const omittedCandidates: RoleplayMemoryOmittedCandidate[] = [];
  const eligibleCandidates: MemoryExtractionCandidateV1[] = [];

  rawCandidates.forEach((value, index) => {
    const candidate = normalizeMemoryCandidate(value, index);
    if (!candidate) {
      candidateReviews.push({
        id: `memory-candidate-${index + 1}`,
        label: asText(asRecord(value)?.candidateText) || `memory candidate ${index + 1}`,
        accepted: false,
        reason: 'malformed_memory_candidate',
      });
      return;
    }
    if (candidate.decision === 'rejected') {
      candidateReviews.push(rejectedMemoryCandidateReview(
        candidate,
        candidate.rejectionReason || 'worker_rejected_candidate',
        input,
      ));
      return;
    }
    if (!ACCEPTED_DURABILITY_CATEGORY_SET.has(candidate.durabilityCategory)) {
      candidateReviews.push(rejectedMemoryCandidateReview(
        candidate,
        'candidate_not_durable',
        input,
      ));
      return;
    }
    if (!ACCEPTED_SOURCE_CLASSIFICATION_SET.has(candidate.sourceClassification)) {
      candidateReviews.push(rejectedMemoryCandidateReview(
        candidate,
        'unsafe_source_classification',
        input,
      ));
      return;
    }
    eligibleCandidates.push(candidate);
  });

  const authorityReview = reviewRoleplayMemoryExtractionEvents({
    events: eligibleCandidates.map((candidate) => candidate.candidateText),
    userStateReviews: eligibleCandidates.map((candidate, eventIndex) => ({
      eventIndex,
      event: candidate.candidateText,
      appliesToUserCharacter: candidate.appliesToUserCharacter,
      userCharacterName: candidate.userCharacterName ?? null,
      claimType: candidate.claimType ?? null,
      sourceRole: candidate.sourceRole,
      evidenceBasis: candidate.evidenceBasis,
      evidence: candidate.evidence,
      reason: candidate.authorityReason,
    })),
    userSourceMessage: input.userSourceMessage,
    assistantSourceMessage: input.assistantSourceMessage,
    assistantSourceAccepted: input.assistantSourceAccepted,
    userCharacters: input.userCharacters,
    isNearDuplicate: input.isNearDuplicate,
  });

  const eligibleCandidateByReviewId = new Map(
    eligibleCandidates.map((candidate, index) => [
      `memory-candidate-${index + 1}`,
      candidate,
    ]),
  );

  authorityReview.candidateReviews.forEach((review) => {
    const candidate = eligibleCandidateByReviewId.get(review.id);
    candidateReviews.push(candidate ? {
      ...review,
      id: candidate.id,
      label: candidate.candidateText,
      durabilityCategory: candidate.durabilityCategory,
      sourceClassification: candidate.sourceClassification,
    } : review);
  });
  authorityReview.omittedCandidates.forEach((review) => {
    const candidate = eligibleCandidateByReviewId.get(review.id);
    omittedCandidates.push(candidate ? {
      ...review,
      id: candidate.id,
      label: candidate.candidateText,
      durabilityCategory: candidate.durabilityCategory,
      sourceClassification: candidate.sourceClassification,
    } : review);
  });

  return {
    acceptedEvents: authorityReview.acceptedEvents,
    candidateReviews,
    omittedCandidates,
  };
}

function findUserCharacter(
  name: string | undefined,
  userCharacters: RoleplayMemoryUserCharacter[],
): RoleplayMemoryUserCharacter | undefined {
  const normalizedName = normalizeForIdentityMatch(name || '');
  if (!normalizedName) return undefined;
  return userCharacters.find((character) => [character.name, ...(character.previousNames ?? [])]
    .some((candidate) => normalizeForIdentityMatch(candidate) === normalizedName));
}

function eventMentionsUserCharacter(
  event: string,
  character: RoleplayMemoryUserCharacter,
): boolean {
  const normalizedEvent = normalizeForIdentityMatch(event);
  return [character.name, ...(character.previousNames ?? [])].some((name) => {
    const normalizedName = normalizeForIdentityMatch(name);
    if (!normalizedName) return false;
    if (!/[\p{L}\p{N}]/u.test(normalizedName)) return normalizedEvent.includes(normalizedName);
    return new RegExp(
      `(?:^|[^\\p{L}\\p{N}])${escapeRegExp(normalizedName)}(?:$|[^\\p{L}\\p{N}])`,
      'u',
    ).test(normalizedEvent);
  });
}

function rejectedReview(
  id: string,
  label: string,
  reason: string,
  row?: NormalizedReviewRow,
): RoleplayMemoryCandidateReview {
  return {
    id,
    label,
    accepted: false,
    reason,
    evidence: row?.evidence || undefined,
    claimType: row?.claimType,
    sourceRole: row?.sourceRole,
    evidenceBasis: row?.evidenceBasis === 'not_applicable' ? undefined : row?.evidenceBasis,
  };
}

export function reviewRoleplayMemoryExtractionEvents(input: {
  events: unknown;
  userStateReviews: unknown;
  userSourceMessage?: RoleplayMemorySourceMessage;
  assistantSourceMessage: RoleplayMemorySourceMessage;
  assistantSourceAccepted: boolean;
  userCharacters: RoleplayMemoryUserCharacter[];
  isNearDuplicate: (acceptedEvents: string[], candidate: string) => boolean;
}): RoleplayMemoryExtractionReview {
  const acceptedEvents: string[] = [];
  const candidateReviews: RoleplayMemoryCandidateReview[] = [];
  const omittedCandidates: RoleplayMemoryOmittedCandidate[] = [];
  const events = (Array.isArray(input.events) ? input.events : [])
    .filter((event): event is string => typeof event === 'string')
    .map((event) => event.trim())
    .filter(Boolean);
  const normalizedRows = (Array.isArray(input.userStateReviews) ? input.userStateReviews : [])
    .map(normalizeReviewRow);

  events.forEach((event, index) => {
    const id = `memory-candidate-${index + 1}`;
    const matchingRows = normalizedRows.filter((row) => row?.eventIndex === index);
    if (matchingRows.length !== 1 || !matchingRows[0]) {
      candidateReviews.push(rejectedReview(
        id,
        event,
        matchingRows.length > 1 ? 'duplicate_source_authority_review' : 'missing_source_authority_review',
      ));
      return;
    }
    const row = matchingRows[0];
    if (normalizeForEvidenceMatch(row.event) !== normalizeForEvidenceMatch(event)) {
      candidateReviews.push(rejectedReview(id, event, 'source_authority_review_event_mismatch', row));
      return;
    }
    if (!row.sourceRole || !row.evidenceBasis || !row.evidence || !row.reason) {
      candidateReviews.push(rejectedReview(id, event, 'malformed_source_authority_review', row));
      return;
    }
    const sourceMessage = row.sourceRole === 'user'
      ? input.userSourceMessage
      : input.assistantSourceMessage;
    if (!sourceMessage || !evidenceAppearsInSource(row.evidence, sourceMessage.text)) {
      candidateReviews.push(rejectedReview(id, event, 'source_evidence_not_found', row));
      return;
    }

    if (input.isNearDuplicate(acceptedEvents, event)) {
      omittedCandidates.push({
        id,
        label: event,
        reason: 'near_duplicate_existing_memory',
        evidence: row.evidence,
        claimType: row.claimType,
        sourceRole: row.sourceRole,
        sourceMessageId: sourceMessage.id,
        sourceGenerationId: sourceMessage.generationId,
      });
      return;
    }

    const mentionedUserCharacters = input.userCharacters.filter((character) => (
      eventMentionsUserCharacter(event, character)
    ));
    if (!row.appliesToUserCharacter) {
      if (mentionedUserCharacters.length > 0) {
        candidateReviews.push(rejectedReview(id, event, 'user_character_subject_mislabeled', row));
        return;
      }
      if (row.evidenceBasis !== 'not_applicable') {
        candidateReviews.push(rejectedReview(id, event, 'invalid_non_user_state_review_basis', row));
        return;
      }
      acceptedEvents.push(event);
      candidateReviews.push({
        id,
        label: event,
        accepted: true,
        reason: 'accepted_non_user_state_after_source_review',
        evidence: row.evidence,
        sourceRole: row.sourceRole,
        sourceMessageId: sourceMessage.id,
        sourceGenerationId: sourceMessage.generationId,
      });
      return;
    }

    const userCharacter = findUserCharacter(row.userCharacterName, input.userCharacters);
    if (
      !userCharacter
      || !mentionedUserCharacters.some((character) => character.id === userCharacter.id)
      || !row.claimType
      || !row.evidenceBasis
      || row.evidenceBasis === 'not_applicable'
    ) {
      candidateReviews.push(rejectedReview(id, event, 'incomplete_user_state_authority_review', row));
      return;
    }

    const decision = classifyRoleplayUserStateClaim({
      claim: event,
      userCharacterId: userCharacter.id,
      claimType: row.claimType,
      sourceMessageId: sourceMessage.id,
      sourceGenerationId: sourceMessage.generationId,
      sourceRole: row.sourceRole,
      sourceGenerationAccepted: row.sourceRole === 'assistant' ? input.assistantSourceAccepted : undefined,
      evidenceBasis: row.evidenceBasis,
      intendedUse: 'persistence',
    });
    const accepted = decision.modelFacingAction === 'allow_as_fact'
      || decision.modelFacingAction === 'allow_as_observation';
    if (accepted) acceptedEvents.push(event);
    candidateReviews.push({
      id,
      label: event,
      accepted,
      reason: decision.reason,
      evidence: row.evidence,
      claimType: decision.claimType,
      sourceRole: decision.sourceRole === 'unknown' ? undefined : decision.sourceRole,
      evidenceBasis: row.evidenceBasis,
      authority: decision.authority,
      modelFacingAction: decision.modelFacingAction,
      sourceMessageId: decision.sourceMessageId,
      sourceGenerationId: decision.sourceGenerationId,
      userCharacterId: decision.userCharacterId,
    });
  });

  normalizedRows.forEach((row, index) => {
    if (!row || events[row.eventIndex] != null) return;
    omittedCandidates.push({
      id: `orphaned-memory-review-${index + 1}`,
      label: row.event || `memory review ${index + 1}`,
      reason: 'orphaned_source_authority_review',
      evidence: row.evidence || undefined,
      claimType: row.claimType,
      sourceRole: row.sourceRole,
    });
  });

  return { acceptedEvents, candidateReviews, omittedCandidates };
}
