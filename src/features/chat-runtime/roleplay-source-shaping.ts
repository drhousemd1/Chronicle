import type { CharacterPromptFact } from './roleplay-character-card-facts';
import type { RoleplayResponseJob } from './roleplay-response-job';
import type { RoleplaySceneRosterRow } from './roleplay-scene-roster';
import type {
  RoleplayDuplicateSourceMetric,
  RoleplayModelFacingSection,
  RoleplaySourceCandidate,
  RoleplaySourceAuthority,
  RoleplaySourceClass,
  RoleplaySourceDisposition,
  RoleplaySourcePacketVersion,
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

export type RoleplaySourceRefreshReason =
  | 'first_turn'
  | 'routine_turn'
  | 'periodic_turn_count'
  | 'source_edited'
  | 'scene_change'
  | 'safety_refresh'
  | 'state_reset'
  | 'manual_debug';

export type RoleplaySourceRefreshState = Readonly<{
  sourceFingerprint: string;
  sceneFingerprint: string;
}>;

export function resolveRoleplaySourceRefreshReason(input: {
  playerTurnCount: number;
  current: RoleplaySourceRefreshState;
  previous?: RoleplaySourceRefreshState | null;
  requestedReason?: RoleplaySourceRefreshReason;
}): RoleplaySourceRefreshReason {
  if (input.requestedReason) return input.requestedReason;
  if (input.playerTurnCount <= 1) return 'first_turn';
  if (!input.previous) return 'state_reset';
  if (input.current.sceneFingerprint !== input.previous.sceneFingerprint) return 'scene_change';
  if (input.current.sourceFingerprint !== input.previous.sourceFingerprint) return 'source_edited';
  if (input.playerTurnCount % 12 === 0) return 'periodic_turn_count';
  return 'routine_turn';
}

export type RoleplaySourceSelectionDecision = Readonly<{
  candidateId: string;
  receiptId: string;
  disposition: 'selected' | 'omitted';
  reason: string;
  modelFacingSection?: RoleplayModelFacingSection;
}>;

export type RoleplaySourceSectionBudget = Readonly<{
  sectionId: RoleplayModelFacingSection;
  sourceClass: RoleplaySourceClass;
  maxChars: number;
  usedChars: number;
  maxCandidates?: number;
  selectedCount: number;
}>;

export type RoleplayMandatorySourceCoverage = Readonly<{
  candidateId: string;
  receiptId: string;
  status: 'covered' | 'missing';
  reason: string;
}>;

export type RoleplaySourceSelection = Readonly<{
  id: string;
  packetVersion: RoleplaySourcePacketVersion;
  policyVersion: string;
  liveShapingEnabled: boolean;
  refreshReason: RoleplaySourceRefreshReason;
  candidates: readonly RoleplaySourceCandidate[];
  selectedCandidateIds: readonly string[];
  omittedCandidateIds: readonly string[];
  decisions: readonly RoleplaySourceSelectionDecision[];
  sectionBudgets: readonly RoleplaySourceSectionBudget[];
  mandatorySourceCoverage: readonly RoleplayMandatorySourceCoverage[];
}>;

export type RoleplaySourceSelectionEvidence = Readonly<{
  id: string;
  packetVersion: RoleplaySourcePacketVersion;
  policyVersion: string;
  liveShapingEnabled: boolean;
  refreshReason: RoleplaySourceRefreshReason;
  candidateCount: number;
  selectedCandidateIds: readonly string[];
  omittedCandidateIds: readonly string[];
  decisions: readonly RoleplaySourceSelectionDecision[];
  sectionBudgets: readonly RoleplaySourceSectionBudget[];
  mandatorySourceCoverage: readonly RoleplayMandatorySourceCoverage[];
}>;

export type RoleplaySelectedProviderPacket = Readonly<{
  messages: Array<Readonly<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>>;
  systemInstruction: string;
  historyMessages: Array<Readonly<{
    role: 'user' | 'assistant';
    content: string;
  }>>;
  fullChars: number;
  selectedChars: number;
  removedChars: number;
}>;

export type RoleplaySourcePacketComparison = Readonly<{
  fullMessageCount: number;
  selectedMessageCount: number;
  fullChars: number;
  selectedChars: number;
  removedChars: number;
}>;

export function buildRoleplaySourceSelectionEvidence(
  selection: RoleplaySourceSelection,
): RoleplaySourceSelectionEvidence {
  return {
    id: selection.id,
    packetVersion: selection.packetVersion,
    policyVersion: selection.policyVersion,
    liveShapingEnabled: selection.liveShapingEnabled,
    refreshReason: selection.refreshReason,
    candidateCount: selection.candidates.length,
    selectedCandidateIds: selection.selectedCandidateIds,
    omittedCandidateIds: selection.omittedCandidateIds,
    decisions: selection.decisions,
    sectionBudgets: selection.sectionBudgets,
    mandatorySourceCoverage: selection.mandatorySourceCoverage,
  };
}

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
  refreshReason: RoleplaySourceRefreshReason;
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

const RELEVANCE_WEIGHT: Record<RoleplaySourceCandidate['relevance']['status'], number> = {
  mandatory: 4,
  relevant: 3,
  unknown: 2,
  irrelevant: 1,
};

const RECENCY_WEIGHT: Record<RoleplaySourceCandidate['recency']['kind'], number> = {
  current_turn: 5,
  recent_exchange: 4,
  durable_runtime: 3,
  static_reference: 2,
  unknown: 1,
};

const DEFAULT_CLASS_BUDGETS: Record<RoleplaySourceClass, number> = {
  player_turn: 40_000,
  mode_control: 16_000,
  current_state: 20_000,
  character_card: 16_000,
  goal: 6_000,
  memory: 8_000,
  recent_history: 10_000,
  story_reference: 10_000,
  runtime_instruction: 48_000,
  debug_evidence: 0,
};

function semanticCandidateKey(candidate: RoleplaySourceCandidate): string {
  if (candidate.sourceRecordId && candidate.sourceField) {
    return `field:${candidate.sourceRecordId}:${candidate.sourceField}`;
  }
  return `content:${candidate.contentHash}`;
}

function compareCandidatePriority(left: RoleplaySourceCandidate, right: RoleplaySourceCandidate): number {
  return RELEVANCE_WEIGHT[right.relevance.status] - RELEVANCE_WEIGHT[left.relevance.status]
    || AUTHORITY_WEIGHT[right.authority] - AUTHORITY_WEIGHT[left.authority]
    || RECENCY_WEIGHT[right.recency.kind] - RECENCY_WEIGHT[left.recency.kind]
    || left.id.localeCompare(right.id);
}

function receiptForCandidate(
  candidate: RoleplaySourceCandidate,
  receiptsById: Map<string, RoleplaySourceReceipt>,
): RoleplaySourceReceipt {
  const receipt = receiptsById.get(candidate.receiptId);
  if (!receipt) throw new Error(`Missing source receipt for candidate ${candidate.id}.`);
  return receipt;
}

function budgetKey(receipt: RoleplaySourceReceipt, candidate: RoleplaySourceCandidate): string {
  return `${receipt.modelFacingSection || 'unassigned'}:${candidate.sourceClass}`;
}

export function selectRoleplaySources(input: {
  candidates: readonly RoleplaySourceCandidate[];
  receipts: readonly RoleplaySourceReceipt[];
  refreshReason: RoleplaySourceRefreshReason;
  liveShapingEnabled: boolean;
  classBudgets?: Partial<Record<RoleplaySourceClass, number>>;
  policyVersion?: string;
}): RoleplaySourceSelection {
  const receiptsById = new Map(input.receipts.map((receipt) => [receipt.id, receipt]));
  const budgets = { ...DEFAULT_CLASS_BUDGETS, ...input.classBudgets };
  const refreshExpansion = input.refreshReason === 'first_turn'
    || input.refreshReason === 'periodic_turn_count'
    || input.refreshReason === 'source_edited'
    || input.refreshReason === 'scene_change'
    || input.refreshReason === 'safety_refresh';
  const winners = new Map<string, RoleplaySourceCandidate>();

  for (const candidate of input.candidates) {
    if (candidate.privacy.selectionEligibility !== 'eligible') continue;
    const key = semanticCandidateKey(candidate);
    const current = winners.get(key);
    if (!current || compareCandidatePriority(candidate, current) < 0) winners.set(key, candidate);
  }

  const selectedCandidateIds: string[] = [];
  const omittedCandidateIds: string[] = [];
  const decisions: RoleplaySourceSelectionDecision[] = [];
  const usedByBudget = new Map<string, number>();
  const selectedByBudget = new Map<string, number>();

  for (const candidate of input.candidates) {
    const receipt = receiptForCandidate(candidate, receiptsById);
    const sectionId = receipt.modelFacingSection;
    let selected = false;
    let reason = '';

    if (candidate.privacy.selectionEligibility !== 'eligible' || !receipt.modelFacing) {
      reason = candidate.privacy.selectionEligibility === 'withheld'
        ? `privacy_withheld:${candidate.privacy.reason}`
        : `debug_only:${candidate.privacy.reason}`;
    } else if (winners.get(semanticCandidateKey(candidate))?.id !== candidate.id) {
      reason = 'lower_priority_semantic_or_exact_duplicate';
    } else if (candidate.relevance.status === 'irrelevant') {
      reason = `irrelevant:${candidate.relevance.reasons.join(',')}`;
    } else if (!sectionId) {
      reason = 'missing_provider_section';
    } else if (candidate.relevance.status === 'mandatory') {
      selected = true;
      reason = 'mandatory_source_selected';
    } else {
      const key = budgetKey(receipt, candidate);
      const baseMax = budgets[candidate.sourceClass];
      const maxChars = refreshExpansion ? Math.ceil(baseMax * 1.5) : baseMax;
      const usedChars = usedByBudget.get(key) || 0;
      if (usedChars + candidate.estimatedChars <= maxChars) {
        selected = true;
        reason = candidate.relevance.status === 'relevant'
          ? 'relevant_source_within_budget'
          : refreshExpansion
            ? 'refresh_source_within_expanded_budget'
            : 'unknown_relevance_source_within_budget';
      } else {
        reason = `section_budget_exceeded:${usedChars}+${candidate.estimatedChars}>${maxChars}`;
      }
    }

    if (selected) {
      selectedCandidateIds.push(candidate.id);
      const key = budgetKey(receipt, candidate);
      usedByBudget.set(key, (usedByBudget.get(key) || 0) + candidate.estimatedChars);
      selectedByBudget.set(key, (selectedByBudget.get(key) || 0) + 1);
    } else {
      omittedCandidateIds.push(candidate.id);
    }
    decisions.push({
      candidateId: candidate.id,
      receiptId: candidate.receiptId,
      disposition: selected ? 'selected' : 'omitted',
      reason,
      modelFacingSection: sectionId,
    });
  }

  const sectionBudgetKeys = new Map<string, {
    sectionId: RoleplayModelFacingSection;
    sourceClass: RoleplaySourceClass;
  }>();
  for (const candidate of input.candidates) {
    const receipt = receiptForCandidate(candidate, receiptsById);
    if (!receipt.modelFacingSection || candidate.privacy.selectionEligibility !== 'eligible') continue;
    sectionBudgetKeys.set(budgetKey(receipt, candidate), {
      sectionId: receipt.modelFacingSection,
      sourceClass: candidate.sourceClass,
    });
  }

  const sectionBudgets = [...sectionBudgetKeys.entries()].map(([key, value]) => ({
    sectionId: value.sectionId,
    sourceClass: value.sourceClass,
    maxChars: refreshExpansion
      ? Math.ceil(budgets[value.sourceClass] * 1.5)
      : budgets[value.sourceClass],
    usedChars: usedByBudget.get(key) || 0,
    selectedCount: selectedByBudget.get(key) || 0,
  }));
  const selectedSet = new Set(selectedCandidateIds);
  const mandatorySourceCoverage = input.candidates
    .filter((candidate) => candidate.relevance.status === 'mandatory')
    .map((candidate) => ({
      candidateId: candidate.id,
      receiptId: candidate.receiptId,
      status: selectedSet.has(candidate.id) ? 'covered' as const : 'missing' as const,
      reason: selectedSet.has(candidate.id)
        ? 'mandatory_candidate_selected'
        : 'mandatory_candidate_missing_from_selection',
    }));

  return {
    id: `source-selection:${input.refreshReason}:${input.candidates.length}:${selectedCandidateIds.length}`,
    packetVersion: input.candidates[0]?.packetVersion || 'roleplay-source-packet-v1',
    policyVersion: input.policyVersion || 'roleplay-source-selection-v1',
    liveShapingEnabled: input.liveShapingEnabled,
    refreshReason: input.refreshReason,
    candidates: input.candidates,
    selectedCandidateIds,
    omittedCandidateIds,
    decisions,
    sectionBudgets,
    mandatorySourceCoverage,
  };
}

export function applyRoleplaySourceSelectionToReceipts(input: {
  receipts: readonly RoleplaySourceReceipt[];
  selection: RoleplaySourceSelection;
}): RoleplaySourceReceipt[] {
  const selectedReceiptIds = new Set(input.selection.decisions
    .filter((decision) => decision.disposition === 'selected')
    .map((decision) => decision.receiptId));
  const decisionsByReceiptId = new Map(input.selection.decisions.map((decision) => [decision.receiptId, decision]));

  return input.receipts.map((receipt) => {
    if (!receipt.modelFacing || receipt.disposition === 'debug_only' || selectedReceiptIds.has(receipt.id)) {
      return { ...receipt };
    }
    const decision = decisionsByReceiptId.get(receipt.id);
    return {
      ...receipt,
      modelFacing: false,
      disposition: 'suppressed',
      omissionReason: decision?.reason || 'omitted_by_source_selection',
      reason: `${receipt.reason};source_selection:${decision?.reason || 'omitted'}`,
    };
  });
}

export function buildRoleplaySelectedProviderPacket(input: {
  fullMessages: Array<Readonly<{ role: 'system' | 'user' | 'assistant'; content: string }>>;
  receipts: readonly RoleplaySourceReceipt[];
  selection: RoleplaySourceSelection;
  finalUserContent: string;
}): RoleplaySelectedProviderPacket {
  const receiptsById = new Map(input.receipts.map((receipt) => [receipt.id, receipt]));
  const selectedSet = new Set(input.selection.selectedCandidateIds);
  const systemContent: string[] = [];
  const historyMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  for (const candidate of input.selection.candidates) {
    if (!selectedSet.has(candidate.id)) continue;
    const receipt = receiptForCandidate(candidate, receiptsById);
    if (receipt.modelFacingSection?.startsWith('system_')) {
      systemContent.push(candidate.content);
    } else if (receipt.modelFacingSection === 'recent_history') {
      historyMessages.push({
        role: receipt.surface === 'recent_user_history' ? 'user' : 'assistant',
        content: candidate.content,
      });
    }
  }

  const systemInstruction = systemContent.join('\n\n').trim();
  if (!systemInstruction) throw new Error('Source selection removed every system instruction source.');
  const messages = [
    { role: 'system' as const, content: systemInstruction },
    ...historyMessages,
    { role: 'user' as const, content: input.finalUserContent },
  ];
  const fullChars = input.fullMessages.reduce((sum, message) => sum + message.content.length, 0);
  const selectedChars = messages.reduce((sum, message) => sum + message.content.length, 0);

  return {
    messages,
    systemInstruction,
    historyMessages,
    fullChars,
    selectedChars,
    removedChars: Math.max(0, fullChars - selectedChars),
  };
}

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
    sourceReceiptIds: fact.modelFacing
      ? input.receipts
          .filter((receipt) => (
            receipt.surface === fact.sourceSurface
            && receipt.modelFacing
            && receipt.disposition !== 'debug_only'
          ))
          .map((receipt) => receipt.id)
      : [],
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
