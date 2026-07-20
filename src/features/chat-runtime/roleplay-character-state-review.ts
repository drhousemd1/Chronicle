import {
  classifyRoleplayUserStateClaim,
  type RoleplayUserStateAuthority,
  type RoleplayUserStateAuthorityDecision,
  type RoleplayUserStateEvidenceBasis,
  type RoleplayUserStateModelFacingAction,
} from './roleplay-user-state-authority';

export const ROLEPLAY_REVIEWED_CHARACTER_STATE_FIELDS = [
  'location',
  'scenePosition',
] as const;

export type RoleplayReviewedCharacterStateField =
  (typeof ROLEPLAY_REVIEWED_CHARACTER_STATE_FIELDS)[number];

export type RoleplayCharacterStateApplyOutcome =
  | 'persisted'
  | 'no_canonical_delta'
  | 'missing_source_metadata'
  | 'stale_generation'
  | 'character_not_found'
  | 'unsupported_field'
  | 'runtime_state_sync_failed'
  | 'persistence_failed';

export type RoleplayCharacterStateEligibilityReason =
  | 'speaker_tag'
  | 'name_match'
  | 'nickname_match'
  | 'previous_name_match';

export type RoleplayCharacterStateEligibilityInput = {
  characterId?: string;
  characterName: string;
  controlledBy?: 'User' | 'AI';
  reasons?: RoleplayCharacterStateEligibilityReason[];
};

export type RoleplayCharacterStateAuthorityMetadata = {
  claimType?: 'voluntary_action';
  sourceRole?: 'user' | 'assistant' | 'unknown';
  evidenceBasis?: RoleplayUserStateEvidenceBasis;
  authority?: RoleplayUserStateAuthority;
  modelFacingAction?: RoleplayUserStateModelFacingAction;
  sourceMessageId?: string;
  sourceGenerationId?: string;
  userCharacterId?: string;
  authorityReason?: string;
};

export type RoleplayCharacterStateCandidateReviewInput = {
  index?: number;
  accepted?: boolean;
  reason?: string;
  character?: string;
  originalCharacter?: string;
  field?: string;
  value?: string;
  evidence?: string;
  confidence?: number;
};

export type RoleplayPhysicalStateReviewInput = {
  character?: string;
  reviewed?: boolean;
  locationReviewed?: boolean;
  scenePositionReviewed?: boolean;
  reason?: string;
  evidence?: string;
  confidence?: number;
};

export type RoleplayReviewedCharacterStateUpdate = RoleplayCharacterStateAuthorityMetadata & {
  index: number;
  characterName: string;
  originalCharacter?: string;
  field: RoleplayReviewedCharacterStateField;
  value: string;
  evidence: string;
  confidence: number;
  edgeAccepted: boolean;
  frontendAccepted: true;
  reason: string;
};

export type RoleplayRejectedCharacterStateUpdate = RoleplayCharacterStateAuthorityMetadata & {
  index: number;
  characterName: string;
  originalCharacter?: string;
  field: string;
  value: string;
  evidence: string;
  confidence: number;
  edgeAccepted: boolean;
  frontendAccepted: false;
  reason: string;
};

export type RoleplayReviewedCharacterStateRow = {
  characterId?: string;
  characterName: string;
  eligible: true;
  eligibilityReasons: string[];
  reviewedFields: RoleplayReviewedCharacterStateField[];
  acceptedUpdates: RoleplayReviewedCharacterStateUpdate[];
  rejectedUpdates: RoleplayRejectedCharacterStateUpdate[];
  missingReviewReason?: string;
};

export type RoleplayCharacterStateApplyReceipt = {
  characterId?: string;
  characterName: string;
  field: string;
  value: string;
  edgeAccepted: boolean;
  frontendAccepted: boolean;
  reviewStatus: 'accepted_reviewed_candidate';
  persisted: boolean;
  runtimeStateApplied?: boolean;
  outcome: RoleplayCharacterStateApplyOutcome;
  reason: string;
  sourceMessageId?: string;
  sourceGenerationId?: string;
  sourceUserMessageId?: string;
  claimType?: 'voluntary_action';
  sourceRole?: 'user' | 'assistant' | 'unknown';
  evidenceBasis?: RoleplayUserStateEvidenceBasis;
  authority?: RoleplayUserStateAuthority;
  modelFacingAction?: RoleplayUserStateModelFacingAction;
  authoritySourceMessageId?: string;
  authoritySourceGenerationId?: string;
  userCharacterId?: string;
  persistenceTargetId?: string;
};

export type RoleplayCharacterStateRuntimeApplyResult =
  | { applied: true }
  | { applied: false; error: string };

export function areRoleplayCharacterStateSourcesCurrent(input: {
  sourceAssistantMessageId?: string;
  sourceAssistantGenerationId?: string;
  sourceUserMessageId?: string;
  sourceUserGenerationId?: string;
  isSourceCurrent: (messageId?: string, generationId?: string) => boolean;
}): boolean {
  if (!input.isSourceCurrent(
    input.sourceAssistantMessageId,
    input.sourceAssistantGenerationId,
  )) return false;

  if (!input.sourceUserMessageId && !input.sourceUserGenerationId) return true;
  if (!input.sourceUserMessageId || !input.sourceUserGenerationId) return false;
  return input.isSourceCurrent(input.sourceUserMessageId, input.sourceUserGenerationId);
}

export function applyPersistedRoleplayCharacterStateSnapshotToRuntime<TSnapshot>(input: {
  snapshot: TSnapshot;
  apply: (snapshot: TSnapshot) => void;
}): RoleplayCharacterStateRuntimeApplyResult {
  try {
    input.apply(input.snapshot);
    return { applied: true };
  } catch (error) {
    return {
      applied: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export function buildRoleplayCharacterStateApplyReceipt(input: {
  candidate: RoleplayReviewedCharacterStatePersistenceCandidate;
  outcome: RoleplayCharacterStateApplyOutcome;
  reason: string;
  sourceMessageId?: string;
  sourceGenerationId?: string;
  sourceUserMessageId?: string;
  characterId?: string;
  persistenceTargetId?: string;
  persisted?: boolean;
  runtimeStateApplied?: boolean;
}): RoleplayCharacterStateApplyReceipt {
  const persisted = input.persisted ?? input.outcome === 'persisted';
  return {
    characterId: input.characterId,
    characterName: input.candidate.character,
    field: input.candidate.field,
    value: input.candidate.value,
    edgeAccepted: true,
    frontendAccepted: true,
    reviewStatus: input.candidate.reviewStatus,
    persisted,
    runtimeStateApplied: input.runtimeStateApplied,
    outcome: input.outcome,
    reason: input.reason,
    sourceMessageId: input.sourceMessageId,
    sourceGenerationId: input.sourceGenerationId,
    sourceUserMessageId: input.sourceUserMessageId,
    claimType: input.candidate.claimType,
    sourceRole: input.candidate.sourceRole,
    evidenceBasis: input.candidate.evidenceBasis,
    authority: input.candidate.authority,
    modelFacingAction: input.candidate.modelFacingAction,
    authoritySourceMessageId: input.candidate.sourceMessageId,
    authoritySourceGenerationId: input.candidate.sourceGenerationId,
    userCharacterId: input.candidate.userCharacterId,
    persistenceTargetId: persisted ? input.persistenceTargetId : undefined,
  };
}

export type RoleplayReviewedCharacterStateContract = {
  rows: RoleplayReviewedCharacterStateRow[];
  unmatchedCandidates: RoleplayRejectedCharacterStateUpdate[];
  authorityDecisions: RoleplayUserStateAuthorityDecision[];
};

export type RoleplayReviewedCharacterStatePersistenceCandidate = RoleplayCharacterStateAuthorityMetadata & {
  reviewStatus: 'accepted_reviewed_candidate';
  character: string;
  field: RoleplayReviewedCharacterStateField;
  value: string;
  evidence: string;
  confidence: number;
};

export function isRoleplayReviewedCharacterStatePersistenceCandidate(
  value: unknown,
): value is RoleplayReviewedCharacterStatePersistenceCandidate {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return candidate.reviewStatus === 'accepted_reviewed_candidate'
    && typeof candidate.character === 'string'
    && candidate.character.trim().length > 0
    && isRoleplayReviewedCharacterStateField(candidate.field)
    && typeof candidate.value === 'string'
    && candidate.value.trim().length > 0
    && typeof candidate.evidence === 'string'
    && candidate.evidence.trim().length > 0
    && typeof candidate.confidence === 'number'
    && Number.isFinite(candidate.confidence)
    && candidate.confidence >= 0
    && candidate.confidence <= 1;
}

export type RoleplayCharacterStateAuthorityContext = {
  visibleUserMessage: string;
  assistantMessage: string;
  sourceUserMessageId?: string;
  sourceUserGenerationId?: string;
  sourceAssistantMessageId?: string;
  sourceAssistantGenerationId?: string;
  sourceAssistantGenerationAccepted?: boolean;
};

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeKey(value: unknown): string {
  return normalizeText(value).toLowerCase();
}

function normalizeConfidence(value: unknown): number {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(1, numeric));
}

function isAliasMentioned(text: string, alias: string): boolean {
  const trimmed = alias.trim();
  if (!trimmed) return false;
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-zA-Z0-9])${escaped}(?=$|[^a-zA-Z0-9])`, 'i').test(text);
}

function splitNicknames(value: unknown): string[] {
  return typeof value === 'string'
    ? value.split(',').map(normalizeText).filter(Boolean)
    : [];
}

export function buildRoleplayCharacterStateEligibilityRows(input: {
  userMessage: string;
  assistantMessage: string;
  taggedSpeakerNames: string[];
  mainCharacters: Array<{
    id?: string;
    name: string;
    controlledBy?: 'User' | 'AI';
    nicknames?: string;
    previousNames?: string[];
  }>;
  sideCharacters: Array<{
    id?: string;
    name: string;
    controlledBy?: 'User' | 'AI';
    nicknames?: string;
  }>;
}): RoleplayCharacterStateEligibilityInput[] {
  const combinedText = `${input.userMessage}\n${input.assistantMessage}`;
  const taggedSpeakerKeys = new Set(input.taggedSpeakerNames.map(normalizeKey).filter(Boolean));
  const rows: RoleplayCharacterStateEligibilityInput[] = [];

  for (const character of [...input.mainCharacters, ...input.sideCharacters]) {
    const reasons = new Set<RoleplayCharacterStateEligibilityReason>();
    const characterKey = normalizeKey(character.name);
    if (!characterKey) continue;
    if (taggedSpeakerKeys.has(characterKey)) reasons.add('speaker_tag');
    if (isAliasMentioned(combinedText, character.name)) reasons.add('name_match');
    if (splitNicknames(character.nicknames).some((alias) => isAliasMentioned(combinedText, alias))) {
      reasons.add('nickname_match');
    }
    if ('previousNames' in character && Array.isArray(character.previousNames)
      && character.previousNames.some((alias) => isAliasMentioned(combinedText, alias))) {
      reasons.add('previous_name_match');
    }
    if (reasons.size === 0) continue;

    rows.push({
      characterId: character.id,
      characterName: character.name,
      controlledBy: character.controlledBy,
      reasons: [...reasons],
    });
  }

  return rows;
}

export function isRoleplayReviewedCharacterStateField(
  value: unknown,
): value is RoleplayReviewedCharacterStateField {
  return value === 'location' || value === 'scenePosition';
}

function normalizeRejectedUpdate(
  candidate: RoleplayCharacterStateCandidateReviewInput,
  index: number,
  reason: string,
  authorityMetadata: RoleplayCharacterStateAuthorityMetadata = {},
): RoleplayRejectedCharacterStateUpdate {
  return {
    index: typeof candidate.index === 'number' ? candidate.index : index,
    characterName: normalizeText(candidate.character),
    originalCharacter: normalizeText(candidate.originalCharacter) || undefined,
    field: normalizeText(candidate.field),
    value: normalizeText(candidate.value),
    evidence: normalizeText(candidate.evidence),
    confidence: normalizeConfidence(candidate.confidence),
    edgeAccepted: candidate.accepted === true,
    frontendAccepted: false,
    reason,
    ...authorityMetadata,
  };
}

function normalizedEvidenceText(value: string): string {
  return value
    .replace(/[“”]/gu, '"')
    .replace(/[‘’]/gu, "'")
    .replace(/\s+/gu, ' ')
    .trim()
    .replace(/^["']+|["']+$/gu, '')
    .toLocaleLowerCase();
}

function sourceContainsEvidence(source: string, evidence: string): boolean {
  const normalizedSource = normalizedEvidenceText(source);
  const normalizedEvidence = normalizedEvidenceText(evidence);
  return normalizedEvidence.length >= 3 && normalizedSource.includes(normalizedEvidence);
}

function characterStateClaim(
  characterName: string,
  field: RoleplayReviewedCharacterStateField,
  value: string,
): string {
  return field === 'location'
    ? `${characterName} is at ${value}.`
    : `${characterName}'s scene position is ${value}.`;
}

function buildUserControlledStateAuthorityDecision(input: {
  candidate: RoleplayCharacterStateCandidateReviewInput;
  eligible: RoleplayCharacterStateEligibilityInput;
  field: RoleplayReviewedCharacterStateField;
  context: RoleplayCharacterStateAuthorityContext;
}): RoleplayUserStateAuthorityDecision {
  const evidence = normalizeText(input.candidate.evidence);
  const userEvidence = sourceContainsEvidence(input.context.visibleUserMessage, evidence);
  const assistantEvidence = !userEvidence
    && sourceContainsEvidence(input.context.assistantMessage, evidence);
  const sourceRole = userEvidence ? 'user' : assistantEvidence ? 'assistant' : 'unknown';
  const evidenceBasis: RoleplayUserStateEvidenceBasis = userEvidence
    ? 'explicit_user_authorship'
    : assistantEvidence
      ? 'accepted_visible_observation'
      : 'unsupported';

  return classifyRoleplayUserStateClaim({
    claim: characterStateClaim(
      input.eligible.characterName,
      input.field,
      normalizeText(input.candidate.value),
    ),
    userCharacterId: input.eligible.characterId,
    claimType: 'voluntary_action',
    sourceMessageId: userEvidence
      ? input.context.sourceUserMessageId
      : assistantEvidence
        ? input.context.sourceAssistantMessageId
        : undefined,
    sourceGenerationId: userEvidence
      ? input.context.sourceUserGenerationId
      : assistantEvidence
        ? input.context.sourceAssistantGenerationId
        : undefined,
    sourceRole,
    sourceGenerationAccepted: assistantEvidence
      ? input.context.sourceAssistantGenerationAccepted
      : undefined,
    evidenceBasis,
    intendedUse: 'persistence',
  });
}

function authorityMetadataFromDecision(
  decision: RoleplayUserStateAuthorityDecision,
): RoleplayCharacterStateAuthorityMetadata {
  return {
    claimType: 'voluntary_action',
    sourceRole: decision.sourceRole,
    evidenceBasis: decision.evidenceBasis,
    authority: decision.authority,
    modelFacingAction: decision.modelFacingAction,
    sourceMessageId: decision.sourceMessageId,
    sourceGenerationId: decision.sourceGenerationId,
    userCharacterId: decision.userCharacterId,
    authorityReason: decision.reason,
  };
}

export function buildRoleplayReviewedCharacterStateContract(input: {
  eligibleCharacters: RoleplayCharacterStateEligibilityInput[];
  candidateReviews: RoleplayCharacterStateCandidateReviewInput[];
  physicalStateReviews: RoleplayPhysicalStateReviewInput[];
  missingPhysicalStateReviews?: string[];
  authorityContext?: RoleplayCharacterStateAuthorityContext;
}): RoleplayReviewedCharacterStateContract {
  const missingReviewKeys = new Set(
    (input.missingPhysicalStateReviews ?? []).map(normalizeKey).filter(Boolean),
  );
  const physicalReviewByKey = new Map(
    input.physicalStateReviews
      .map((review) => [normalizeKey(review.character), review] as const)
      .filter(([key]) => Boolean(key)),
  );
  const eligibleByKey = new Map(
    input.eligibleCharacters
      .map((character) => [normalizeKey(character.characterName), character] as const)
      .filter(([key]) => Boolean(key)),
  );
  const candidatesByKey = new Map<string, Array<{
    candidate: RoleplayCharacterStateCandidateReviewInput;
    index: number;
  }>>();
  const unmatchedCandidates: RoleplayRejectedCharacterStateUpdate[] = [];
  const authorityDecisions: RoleplayUserStateAuthorityDecision[] = [];

  input.candidateReviews.forEach((candidate, index) => {
    const key = normalizeKey(candidate.character);
    if (!key || !eligibleByKey.has(key)) {
      unmatchedCandidates.push(normalizeRejectedUpdate(candidate, index, 'ineligible_character'));
      return;
    }
    const existing = candidatesByKey.get(key) ?? [];
    existing.push({ candidate, index });
    candidatesByKey.set(key, existing);
  });

  const rows = [...eligibleByKey.entries()].map(([key, eligible]) => {
    const physicalReview = physicalReviewByKey.get(key);
    const reviewedFields: RoleplayReviewedCharacterStateField[] = [];
    if (physicalReview?.reviewed === true && physicalReview.locationReviewed === true) {
      reviewedFields.push('location');
    }
    if (physicalReview?.reviewed === true && physicalReview.scenePositionReviewed === true) {
      reviewedFields.push('scenePosition');
    }

    const missingReviewReason = missingReviewKeys.has(key)
      || !physicalReview
      || physicalReview.reviewed !== true
      || reviewedFields.length < ROLEPLAY_REVIEWED_CHARACTER_STATE_FIELDS.length
      ? normalizeText(physicalReview?.reason) || 'missing_physical_state_review'
      : undefined;
    const acceptedUpdates: RoleplayReviewedCharacterStateUpdate[] = [];
    const rejectedUpdates: RoleplayRejectedCharacterStateUpdate[] = [];

    for (const { candidate, index } of candidatesByKey.get(key) ?? []) {
      const field = normalizeText(candidate.field);
      if (candidate.accepted !== true) {
        rejectedUpdates.push(normalizeRejectedUpdate(
          candidate,
          index,
          normalizeText(candidate.reason) || 'rejected_by_character_state_review',
        ));
        continue;
      }
      if (!isRoleplayReviewedCharacterStateField(field)) {
        rejectedUpdates.push(normalizeRejectedUpdate(candidate, index, 'unsupported_field'));
        continue;
      }
      if (missingReviewReason || !reviewedFields.includes(field)) {
        rejectedUpdates.push(normalizeRejectedUpdate(candidate, index, 'missing_required_review'));
        continue;
      }

      let authorityMetadata: RoleplayCharacterStateAuthorityMetadata = {};
      if (eligible.controlledBy === 'User') {
        const authorityDecision = input.authorityContext
          ? buildUserControlledStateAuthorityDecision({
              candidate,
              eligible,
              field,
              context: input.authorityContext,
            })
          : classifyRoleplayUserStateClaim({
              claim: characterStateClaim(eligible.characterName, field, normalizeText(candidate.value)),
              userCharacterId: eligible.characterId,
              claimType: 'voluntary_action',
              sourceRole: 'unknown',
              evidenceBasis: 'unsupported',
              intendedUse: 'persistence',
            });
        authorityDecisions.push(authorityDecision);
        authorityMetadata = authorityMetadataFromDecision(authorityDecision);
        if (authorityDecision.modelFacingAction !== 'allow_as_fact') {
          rejectedUpdates.push(normalizeRejectedUpdate(
            candidate,
            index,
            authorityDecision.reason,
            authorityMetadata,
          ));
          continue;
        }
      }

      acceptedUpdates.push({
        index: typeof candidate.index === 'number' ? candidate.index : index,
        characterName: eligible.characterName,
        originalCharacter: normalizeText(candidate.originalCharacter) || undefined,
        field,
        value: normalizeText(candidate.value),
        evidence: normalizeText(candidate.evidence),
        confidence: normalizeConfidence(candidate.confidence),
        edgeAccepted: true,
        frontendAccepted: true,
        reason: normalizeText(candidate.reason) || 'accepted',
        ...authorityMetadata,
      });
    }

    return {
      characterId: eligible.characterId,
      characterName: eligible.characterName,
      eligible: true as const,
      eligibilityReasons: (eligible.reasons ?? []).map(normalizeText).filter(Boolean),
      reviewedFields,
      acceptedUpdates,
      rejectedUpdates,
      missingReviewReason,
    };
  });

  return { rows, unmatchedCandidates, authorityDecisions };
}

export function getRoleplayReviewedCharacterStatePersistenceCandidates(
  contract: RoleplayReviewedCharacterStateContract,
): RoleplayReviewedCharacterStatePersistenceCandidate[] {
  return contract.rows.flatMap((row) => row.acceptedUpdates.map((update) => ({
    reviewStatus: 'accepted_reviewed_candidate' as const,
    character: row.characterName,
    field: update.field,
    value: update.value,
    evidence: update.evidence,
    confidence: update.confidence,
    ...(update.claimType ? { claimType: update.claimType } : {}),
    ...(update.sourceRole ? { sourceRole: update.sourceRole } : {}),
    ...(update.evidenceBasis ? { evidenceBasis: update.evidenceBasis } : {}),
    ...(update.authority ? { authority: update.authority } : {}),
    ...(update.modelFacingAction ? { modelFacingAction: update.modelFacingAction } : {}),
    ...(update.sourceMessageId ? { sourceMessageId: update.sourceMessageId } : {}),
    ...(update.sourceGenerationId ? { sourceGenerationId: update.sourceGenerationId } : {}),
    ...(update.userCharacterId ? { userCharacterId: update.userCharacterId } : {}),
  })));
}
