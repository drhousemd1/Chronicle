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
  claimType?: RoleplayUserStateClaimType;
  sourceRole?: 'user' | 'assistant';
  evidenceBasis?: RoleplayUserStateEvidenceBasis;
  authority?: RoleplayUserStateAuthority;
  modelFacingAction?: RoleplayUserStateModelFacingAction;
  sourceMessageId?: string;
  sourceGenerationId?: string;
  userCharacterId?: string;
};

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

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
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
