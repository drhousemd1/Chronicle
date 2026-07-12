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
  | 'persistence_failed';

export type RoleplayCharacterStateEligibilityReason =
  | 'speaker_tag'
  | 'name_match'
  | 'nickname_match'
  | 'previous_name_match';

export type RoleplayCharacterStateEligibilityInput = {
  characterId?: string;
  characterName: string;
  reasons?: RoleplayCharacterStateEligibilityReason[];
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

export type RoleplayReviewedCharacterStateUpdate = {
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

export type RoleplayRejectedCharacterStateUpdate = {
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
  persisted: boolean;
  outcome: RoleplayCharacterStateApplyOutcome;
  reason: string;
  sourceMessageId?: string;
  sourceGenerationId?: string;
  sourceUserMessageId?: string;
  persistenceTargetId?: string;
};

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
}): RoleplayCharacterStateApplyReceipt {
  const persisted = input.persisted ?? input.outcome === 'persisted';
  return {
    characterId: input.characterId,
    characterName: input.candidate.character,
    field: input.candidate.field,
    value: input.candidate.value,
    edgeAccepted: true,
    frontendAccepted: true,
    persisted,
    outcome: input.outcome,
    reason: input.reason,
    sourceMessageId: input.sourceMessageId,
    sourceGenerationId: input.sourceGenerationId,
    sourceUserMessageId: input.sourceUserMessageId,
    persistenceTargetId: persisted ? input.persistenceTargetId : undefined,
  };
}

export type RoleplayReviewedCharacterStateContract = {
  rows: RoleplayReviewedCharacterStateRow[];
  unmatchedCandidates: RoleplayRejectedCharacterStateUpdate[];
};

export type RoleplayReviewedCharacterStatePersistenceCandidate = {
  character: string;
  field: RoleplayReviewedCharacterStateField;
  value: string;
  evidence: string;
  confidence: number;
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
    nicknames?: string;
    previousNames?: string[];
  }>;
  sideCharacters: Array<{
    id?: string;
    name: string;
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
  };
}

export function buildRoleplayReviewedCharacterStateContract(input: {
  eligibleCharacters: RoleplayCharacterStateEligibilityInput[];
  candidateReviews: RoleplayCharacterStateCandidateReviewInput[];
  physicalStateReviews: RoleplayPhysicalStateReviewInput[];
  missingPhysicalStateReviews?: string[];
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

  return { rows, unmatchedCandidates };
}

export function getRoleplayReviewedCharacterStatePersistenceCandidates(
  contract: RoleplayReviewedCharacterStateContract,
): RoleplayReviewedCharacterStatePersistenceCandidate[] {
  return contract.rows.flatMap((row) => row.acceptedUpdates.map((update) => ({
    character: row.characterName,
    field: update.field,
    value: update.value,
    evidence: update.evidence,
    confidence: update.confidence,
  })));
}
