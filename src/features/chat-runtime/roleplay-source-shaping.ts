import type { CharacterPromptFact } from './roleplay-character-card-facts';
import type { RoleplayResponseJob } from './roleplay-response-job';
import type { RoleplaySceneRosterRow } from './roleplay-scene-roster';
import type {
  RoleplayDuplicateSourceMetric,
  RoleplaySourceAuthority,
  RoleplaySourceDisposition,
  RoleplaySourceReceipt,
  RoleplaySourceSurface,
} from './roleplay-source-receipts';
import type { RoleplayUserStateAuthorityDecision } from './roleplay-user-state-authority';

export type RoleplayEffectiveFieldTreatment =
  | 'selected'
  | 'transformed'
  | 'suppressed'
  | 'debug_only';

export type RoleplayEffectiveFieldEvidence = Readonly<{
  id: string;
  entityId?: string;
  fieldPath: string;
  valuePreview: string;
  sourceKind: 'scene_roster' | 'character_card_fact' | 'user_state_authority';
  sourceReceiptIds: string[];
  authority: string;
  modelFacing: boolean;
  treatment: RoleplayEffectiveFieldTreatment;
  reason: string;
}>;

export type RoleplaySourceBudgetTreatment =
  | 'included'
  | 'downgraded'
  | 'omitted_by_budget'
  | 'suppressed_conflict'
  | 'debug_only';

export type RoleplaySourceBudgetSummary = Readonly<{
  id: string;
  totalReceipts: number;
  modelFacingReceipts: number;
  debugOnlyReceipts: number;
  bySurface: Record<string, number>;
  byAuthority: Record<string, number>;
  byTreatment: Record<RoleplaySourceBudgetTreatment, number>;
  duplicateGroups: RoleplayDuplicateSourceMetric[];
  repeatedSourcePressureReceiptIds: string[];
}>;

export type RoleplayActiveScenePacketCandidate = Readonly<{
  id: string;
  strategy: 'active_scene_packet';
  turnNumber: number;
  refreshReason: 'first_turn' | 'periodic_turn_count' | 'state_reset' | 'manual_debug';
  liveShapingEnabled: false;
  fullContextReceiptIds: string[];
  includedReceiptIds: string[];
  omittedReceipts: Array<Readonly<{
    receiptId: string;
    treatment: 'omitted_by_budget' | 'debug_only';
    reason: 'duplicate_lower_authority' | 'debug_only_source';
  }>>;
}>;

const AUTHORITY_WEIGHT: Record<RoleplaySourceAuthority, number> = {
  highest: 6,
  high: 5,
  medium: 4,
  low: 3,
  contrast_only: 2,
  debug_only: 1,
};

function compact(value: unknown, maxLength = 180): string {
  const normalized = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 3)}...`;
}

function receiptIdsForSurface(receipts: RoleplaySourceReceipt[], surface: RoleplaySourceSurface): string[] {
  return receipts.filter((receipt) => receipt.surface === surface).map((receipt) => receipt.id);
}

function factTreatment(fact: CharacterPromptFact): RoleplayEffectiveFieldTreatment {
  if (fact.disposition === 'transformed') return 'transformed';
  if (fact.disposition === 'suppressed') return 'suppressed';
  if (fact.disposition === 'debug_only') return 'debug_only';
  return 'selected';
}

function decisionTreatment(decision: RoleplayUserStateAuthorityDecision): RoleplayEffectiveFieldTreatment {
  if (decision.modelFacingAction === 'debug_only' || decision.modelFacingAction === 'reject_from_persistence') {
    return decision.authority === 'unsupported_overreach' ? 'suppressed' : 'debug_only';
  }
  return decision.authority === 'assistant_interpretation' ? 'transformed' : 'selected';
}

export function buildRoleplayEffectiveFieldEvidence(input: {
  receipts: RoleplaySourceReceipt[];
  sceneRoster: RoleplaySceneRosterRow[];
  characterPromptFacts: CharacterPromptFact[];
  userStateAuthorityDecisions: RoleplayUserStateAuthorityDecision[];
}): RoleplayEffectiveFieldEvidence[] {
  const currentStateReceiptIds = receiptIdsForSurface(input.receipts, 'current_state');
  const characterReceiptIds = [
    ...receiptIdsForSurface(input.receipts, 'main_character_cards'),
    ...receiptIdsForSurface(input.receipts, 'side_character_cards'),
    ...receiptIdsForSurface(input.receipts, 'user_character_cards'),
  ];
  const playerTurnReceiptIds = receiptIdsForSurface(input.receipts, 'player_turn');

  const rosterEvidence = input.sceneRoster.flatMap((row) => [
    {
      id: `scene-roster:${row.characterId}:location`,
      entityId: row.characterId,
      fieldPath: 'location',
      valuePreview: row.location,
      sourceKind: 'scene_roster' as const,
      sourceReceiptIds: currentStateReceiptIds,
      authority: 'current_state',
      modelFacing: true,
      treatment: 'selected' as const,
      reason: 'effective_scene_roster_location',
    },
    ...(row.scenePosition ? [{
      id: `scene-roster:${row.characterId}:scenePosition`,
      entityId: row.characterId,
      fieldPath: 'scenePosition',
      valuePreview: row.scenePosition,
      sourceKind: 'scene_roster' as const,
      sourceReceiptIds: currentStateReceiptIds,
      authority: 'current_state',
      modelFacing: true,
      treatment: 'selected' as const,
      reason: 'effective_scene_roster_position',
    }] : []),
  ]);

  const factEvidence = input.characterPromptFacts.map((fact) => ({
    id: `character-fact:${fact.characterId}:${fact.sourceField}`,
    entityId: fact.characterId,
    fieldPath: fact.sourceField,
    valuePreview: compact(fact.value),
    sourceKind: 'character_card_fact' as const,
    sourceReceiptIds: characterReceiptIds,
    authority: fact.authority,
    modelFacing: fact.modelFacing,
    treatment: factTreatment(fact),
    reason: fact.reason,
  }));

  const authorityEvidence = input.userStateAuthorityDecisions.map((decision, index) => ({
    id: `user-state:${decision.sourceMessageId || 'unknown'}:${decision.claimType}:${index + 1}`,
    entityId: decision.userCharacterId,
    fieldPath: `user_state.${decision.claimType}`,
    valuePreview: compact(decision.claim),
    sourceKind: 'user_state_authority' as const,
    sourceReceiptIds: decision.sourceRole === 'user' ? playerTurnReceiptIds : [],
    authority: decision.authority,
    modelFacing: decision.modelFacingAction !== 'debug_only' && decision.modelFacingAction !== 'reject_from_persistence',
    treatment: decisionTreatment(decision),
    reason: decision.reason,
  }));

  return [...rosterEvidence, ...factEvidence, ...authorityEvidence];
}

function budgetTreatment(disposition: RoleplaySourceDisposition): RoleplaySourceBudgetTreatment {
  if (disposition === 'compacted' || disposition === 'downgraded') return 'downgraded';
  if (disposition === 'suppressed') return 'suppressed_conflict';
  if (disposition === 'debug_only') return 'debug_only';
  return 'included';
}

export function buildRoleplaySourceBudgetSummary(input: {
  receipts: RoleplaySourceReceipt[];
  duplicateMetrics: RoleplayDuplicateSourceMetric[];
}): RoleplaySourceBudgetSummary {
  const bySurface: Record<string, number> = {};
  const byAuthority: Record<string, number> = {};
  const byTreatment: Record<RoleplaySourceBudgetTreatment, number> = {
    included: 0,
    downgraded: 0,
    omitted_by_budget: 0,
    suppressed_conflict: 0,
    debug_only: 0,
  };

  for (const receipt of input.receipts) {
    bySurface[receipt.surface] = (bySurface[receipt.surface] || 0) + 1;
    byAuthority[receipt.authority] = (byAuthority[receipt.authority] || 0) + 1;
    byTreatment[budgetTreatment(receipt.disposition)] += 1;
  }

  const repeatedSourcePressureReceiptIds = input.duplicateMetrics
    .filter((metric) => metric.modelFacingCount > 1)
    .flatMap((metric) => metric.receiptIds);

  return {
    id: `source-budget:${input.receipts.length}:${repeatedSourcePressureReceiptIds.length}`,
    totalReceipts: input.receipts.length,
    modelFacingReceipts: input.receipts.filter((receipt) => receipt.modelFacing).length,
    debugOnlyReceipts: input.receipts.filter((receipt) => !receipt.modelFacing).length,
    bySurface,
    byAuthority,
    byTreatment,
    duplicateGroups: input.duplicateMetrics,
    repeatedSourcePressureReceiptIds,
  };
}

export function buildRoleplayActiveScenePacketCandidate(input: {
  receipts: RoleplaySourceReceipt[];
  turnNumber: number;
  refreshReason?: RoleplayActiveScenePacketCandidate['refreshReason'];
}): RoleplayActiveScenePacketCandidate {
  const includedReceiptIds = new Set<string>();
  const omittedReceipts: RoleplayActiveScenePacketCandidate['omittedReceipts'] = [];
  const duplicateGroups = new Map<string, RoleplaySourceReceipt[]>();

  for (const receipt of input.receipts) {
    if (!receipt.modelFacing || receipt.disposition === 'debug_only') {
      omittedReceipts.push({
        receiptId: receipt.id,
        treatment: 'debug_only',
        reason: 'debug_only_source',
      });
      continue;
    }
    if (!receipt.duplicateGroup) {
      includedReceiptIds.add(receipt.id);
      continue;
    }
    const group = duplicateGroups.get(receipt.duplicateGroup) ?? [];
    group.push(receipt);
    duplicateGroups.set(receipt.duplicateGroup, group);
  }

  for (const group of duplicateGroups.values()) {
    const ordered = [...group].sort((left, right) => (
      AUTHORITY_WEIGHT[right.authority] - AUTHORITY_WEIGHT[left.authority]
      || Number(right.modelFacing) - Number(left.modelFacing)
      || left.id.localeCompare(right.id)
    ));
    const selected = ordered[0];
    includedReceiptIds.add(selected.id);
    for (const receipt of ordered.slice(1)) {
      omittedReceipts.push({
        receiptId: receipt.id,
        treatment: 'omitted_by_budget',
        reason: 'duplicate_lower_authority',
      });
    }
  }

  return {
    id: `active-scene-candidate:${input.turnNumber}:${input.receipts.length}`,
    strategy: 'active_scene_packet',
    turnNumber: input.turnNumber,
    refreshReason: input.refreshReason || (input.turnNumber <= 1 ? 'first_turn' : 'manual_debug'),
    liveShapingEnabled: false,
    fullContextReceiptIds: input.receipts.filter((receipt) => receipt.modelFacing).map((receipt) => receipt.id),
    includedReceiptIds: [...includedReceiptIds],
    omittedReceipts,
  };
}

export function linkRoleplayResponseJobSourceReceipts(
  responseJob: RoleplayResponseJob | null | undefined,
  receipts: RoleplaySourceReceipt[],
): RoleplayResponseJob | null {
  if (!responseJob) return null;
  return {
    ...responseJob,
    sourceReceiptIds: receipts.map((receipt) => receipt.id),
  };
}
