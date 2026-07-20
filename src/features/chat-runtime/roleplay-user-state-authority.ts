import type { FieldChangeMetadataMap } from '@/types';

export const ROLEPLAY_USER_STATE_AUTHORITIES = [
  'raw_user_fact',
  'accepted_assistant_observable_change',
  'assistant_interpretation',
  'unsupported_overreach',
] as const;

export type RoleplayUserStateAuthority = typeof ROLEPLAY_USER_STATE_AUTHORITIES[number];

export const ROLEPLAY_USER_STATE_CLAIM_TYPES = [
  'emotion',
  'intent',
  'arousal',
  'consent',
  'bodily_reaction',
  'preference',
  'voluntary_action',
  'dialogue_assignment',
  'internal_thought',
] as const;

export type RoleplayUserStateClaimType = typeof ROLEPLAY_USER_STATE_CLAIM_TYPES[number];

export type RoleplayUserStateEvidenceBasis =
  | 'explicit_user_authorship'
  | 'accepted_visible_observation'
  | 'in_character_interpretation'
  | 'unsupported';

export type RoleplayUserStateUse = 'prompt' | 'persistence' | 'debug';

export type RoleplayUserStateModelFacingAction =
  | 'allow_as_fact'
  | 'allow_as_observation'
  | 'allow_as_character_interpretation'
  | 'debug_only'
  | 'reject_from_persistence';

export type RoleplayUserStateAuthorityDecision = {
  claim: string;
  userCharacterId?: string;
  claimType: RoleplayUserStateClaimType;
  sourceMessageId?: string;
  sourceGenerationId?: string;
  sourceRole: 'user' | 'assistant' | 'unknown';
  evidenceBasis?: RoleplayUserStateEvidenceBasis;
  authority: RoleplayUserStateAuthority;
  modelFacingAction: RoleplayUserStateModelFacingAction;
  reason: string;
};

export type ClassifyRoleplayUserStateClaimInput = {
  claim: string;
  userCharacterId?: string;
  claimType: RoleplayUserStateClaimType;
  sourceMessageId?: string;
  sourceGenerationId?: string;
  sourceRole: 'user' | 'assistant' | 'unknown';
  sourceGenerationAccepted?: boolean;
  evidenceBasis: RoleplayUserStateEvidenceBasis;
  intendedUse: RoleplayUserStateUse;
};

export type RoleplayUserStateAuthorityDebugSummary = {
  total: number;
  selected: number;
  downgraded: number;
  rejected: number;
  byAuthority: Record<RoleplayUserStateAuthority, number>;
};

export type RoleplayUserStatePromptProjection = {
  establishedFacts: RoleplayUserStateAuthorityDecision[];
  observations: RoleplayUserStateAuthorityDecision[];
  interpretations: RoleplayUserStateAuthorityDecision[];
  rejected: RoleplayUserStateAuthorityDecision[];
};

const ROLEPLAY_USER_STATE_CLAIM_TYPE_SET = new Set<string>(ROLEPLAY_USER_STATE_CLAIM_TYPES);
const ROLEPLAY_USER_STATE_AUTHORITY_SET = new Set<string>(ROLEPLAY_USER_STATE_AUTHORITIES);
const ROLEPLAY_USER_STATE_EVIDENCE_BASIS_SET = new Set<string>([
  'explicit_user_authorship',
  'accepted_visible_observation',
  'in_character_interpretation',
  'unsupported',
]);
const ROLEPLAY_USER_STATE_MODEL_ACTION_SET = new Set<string>([
  'allow_as_fact',
  'allow_as_observation',
  'allow_as_character_interpretation',
  'debug_only',
  'reject_from_persistence',
]);

export function isPersistedRoleplayUserStateAuthorityDecision(
  value: unknown,
): value is RoleplayUserStateAuthorityDecision & { sourceMessageId: string; sourceGenerationId: string } {
  if (!value || typeof value !== 'object') return false;
  const decision = value as Record<string, unknown>;
  const structurallyValid = typeof decision.claim === 'string'
    && decision.claim.trim().length > 0
    && ROLEPLAY_USER_STATE_CLAIM_TYPE_SET.has(String(decision.claimType || ''))
    && typeof decision.sourceMessageId === 'string'
    && decision.sourceMessageId.trim().length > 0
    && typeof decision.sourceGenerationId === 'string'
    && decision.sourceGenerationId.trim().length > 0
    && (decision.sourceRole === 'user' || decision.sourceRole === 'assistant')
    && ROLEPLAY_USER_STATE_EVIDENCE_BASIS_SET.has(String(decision.evidenceBasis || ''))
    && ROLEPLAY_USER_STATE_AUTHORITY_SET.has(String(decision.authority || ''))
    && ROLEPLAY_USER_STATE_MODEL_ACTION_SET.has(String(decision.modelFacingAction || ''))
    && typeof decision.reason === 'string'
    && decision.reason.trim().length > 0;
  if (!structurallyValid) return false;

  if (decision.sourceRole === 'user') {
    return decision.evidenceBasis === 'explicit_user_authorship'
      && decision.authority === 'raw_user_fact'
      && decision.modelFacingAction === 'allow_as_fact';
  }

  return decision.evidenceBasis === 'accepted_visible_observation'
    && decision.claimType === 'bodily_reaction'
    && decision.authority === 'accepted_assistant_observable_change'
    && decision.modelFacingAction === 'allow_as_observation';
}

export function collectPersistedRoleplayUserStateAuthorityDecisions(
  metadataMaps: Array<FieldChangeMetadataMap | undefined>,
): RoleplayUserStateAuthorityDecision[] {
  return metadataMaps.flatMap((metadata) => (
    Object.values(metadata ?? {}).flatMap((entry) => (
      isPersistedRoleplayUserStateAuthorityDecision(entry.userStateAuthorityDecision)
        ? [entry.userStateAuthorityDecision]
        : []
    ))
  ));
}

const OBSERVABLE_CLAIM_TYPES = new Set<RoleplayUserStateClaimType>([
  'bodily_reaction',
]);

function actionForAuthority(
  authority: RoleplayUserStateAuthority,
  intendedUse: RoleplayUserStateUse,
): RoleplayUserStateModelFacingAction {
  if (intendedUse === 'debug') return 'debug_only';
  if (authority === 'raw_user_fact') return 'allow_as_fact';
  if (authority === 'accepted_assistant_observable_change') return 'allow_as_observation';
  if (authority === 'assistant_interpretation') {
    return intendedUse === 'persistence'
      ? 'reject_from_persistence'
      : 'allow_as_character_interpretation';
  }
  return intendedUse === 'persistence' ? 'reject_from_persistence' : 'debug_only';
}

function authorityAndReason(
  input: ClassifyRoleplayUserStateClaimInput,
): Pick<RoleplayUserStateAuthorityDecision, 'authority' | 'reason'> {
  if (!input.claim.trim()) {
    return { authority: 'unsupported_overreach', reason: 'empty_claim' };
  }
  if (!input.sourceMessageId) {
    return { authority: 'unsupported_overreach', reason: 'missing_source_message_id' };
  }
  if (input.sourceRole === 'user' && input.evidenceBasis === 'explicit_user_authorship') {
    return { authority: 'raw_user_fact', reason: 'explicit_user_authorship' };
  }
  if (input.sourceRole === 'assistant' && !input.sourceGenerationId) {
    return { authority: 'unsupported_overreach', reason: 'missing_source_generation_id' };
  }
  if (input.sourceRole === 'assistant' && input.sourceGenerationAccepted !== true) {
    return { authority: 'unsupported_overreach', reason: 'assistant_generation_not_accepted' };
  }
  if (
    input.sourceRole === 'assistant'
    && input.evidenceBasis === 'accepted_visible_observation'
    && OBSERVABLE_CLAIM_TYPES.has(input.claimType)
  ) {
    return {
      authority: 'accepted_assistant_observable_change',
      reason: 'accepted_assistant_generation_with_observable_change',
    };
  }
  if (
    input.sourceRole === 'assistant'
    && (input.evidenceBasis === 'in_character_interpretation'
      || input.evidenceBasis === 'accepted_visible_observation')
  ) {
    return {
      authority: 'assistant_interpretation',
      reason: OBSERVABLE_CLAIM_TYPES.has(input.claimType)
        ? 'assistant_claim_preserved_as_interpretation'
        : 'user_owned_state_requires_user_authorship',
    };
  }
  return { authority: 'unsupported_overreach', reason: 'unsupported_source_authority' };
}

export function classifyRoleplayUserStateClaim(
  input: ClassifyRoleplayUserStateClaimInput,
): RoleplayUserStateAuthorityDecision {
  const claim = input.claim.trim();
  const { authority, reason } = authorityAndReason(input);
  return {
    claim,
    userCharacterId: input.userCharacterId,
    claimType: input.claimType,
    sourceMessageId: input.sourceMessageId,
    sourceGenerationId: input.sourceGenerationId,
    sourceRole: input.sourceRole,
    evidenceBasis: input.evidenceBasis,
    authority,
    modelFacingAction: actionForAuthority(authority, input.intendedUse),
    reason,
  };
}

export function mergeRoleplayUserStateAuthorityDecisions(input: {
  existing: RoleplayUserStateAuthorityDecision[];
  incoming: RoleplayUserStateAuthorityDecision[];
  isSourceCurrent: (sourceMessageId?: string, sourceGenerationId?: string) => boolean;
}): RoleplayUserStateAuthorityDecision[] {
  const merged = new Map<string, RoleplayUserStateAuthorityDecision>();
  for (const decision of [...input.existing, ...input.incoming]) {
    if (
      decision.sourceRole !== 'unknown'
      && !input.isSourceCurrent(decision.sourceMessageId, decision.sourceGenerationId)
    ) {
      continue;
    }
    const key = [
      decision.userCharacterId ?? '',
      decision.claimType,
      decision.sourceRole,
      decision.sourceMessageId ?? '',
      decision.sourceGenerationId ?? '',
      decision.authority,
      decision.modelFacingAction,
      decision.claim.trim().toLocaleLowerCase(),
    ].join('\u0000');
    merged.set(key, decision);
  }
  return [...merged.values()];
}

export function buildRoleplayUserStateAuthorityDebugSummary(
  decisions: RoleplayUserStateAuthorityDecision[],
): RoleplayUserStateAuthorityDebugSummary {
  const byAuthority = Object.fromEntries(
    ROLEPLAY_USER_STATE_AUTHORITIES.map((authority) => [authority, 0]),
  ) as Record<RoleplayUserStateAuthority, number>;
  for (const decision of decisions) byAuthority[decision.authority] += 1;

  return {
    total: decisions.length,
    selected: byAuthority.raw_user_fact + byAuthority.accepted_assistant_observable_change,
    downgraded: byAuthority.assistant_interpretation,
    rejected: byAuthority.unsupported_overreach,
    byAuthority,
  };
}

export function projectRoleplayUserStateClaimsForPrompt(
  decisions: RoleplayUserStateAuthorityDecision[],
): RoleplayUserStatePromptProjection {
  return {
    establishedFacts: decisions.filter((decision) => decision.modelFacingAction === 'allow_as_fact'),
    observations: decisions.filter((decision) => decision.modelFacingAction === 'allow_as_observation'),
    interpretations: decisions.filter(
      (decision) => decision.modelFacingAction === 'allow_as_character_interpretation',
    ),
    rejected: decisions.filter(
      (decision) => decision.modelFacingAction === 'debug_only'
        || decision.modelFacingAction === 'reject_from_persistence',
    ),
  };
}
