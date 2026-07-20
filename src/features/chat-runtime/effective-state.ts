import type {
  Character,
  CharacterStateMessageSnapshot,
  GoalAlignmentState,
  Memory,
  Message,
  SideCharacter,
  SideCharacterMessageSnapshot,
  StoryGoalStepDerivation,
  WorldCore,
} from '@/types';
import { buildGoalAlignmentKey, normalizeGoalAlignmentState } from '@/lib/goal-alignment';
import { isPersistedRoleplayUserStateAuthorityDecision } from './roleplay-user-state-authority';

export type EffectiveStatePruningItemType =
  | 'memory'
  | 'goal_derivation'
  | 'character_state'
  | 'side_character_state'
  | 'goal_alignment';

export type EffectiveStatePruningReason =
  | 'current_generation'
  | 'manual_or_legacy_no_generation'
  | 'stale_generation'
  | 'deleted_source_message'
  | 'missing_source';

export type EffectiveStatePruningReport = {
  itemType: EffectiveStatePruningItemType;
  itemId: string;
  sourceMessageId?: string;
  sourceGenerationId?: string;
  currentGenerationId?: string;
  included: boolean;
  reason: EffectiveStatePruningReason;
  valuePreview?: string;
};

export type ConversationMessageIdentity = Pick<Message, 'id' | 'generationId' | 'createdAt'>;

export function buildMessageGenerationMap(messages: ConversationMessageIdentity[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const message of messages) {
    map.set(message.id, message.generationId || message.id);
  }
  return map;
}

export function mergeConversationMessageIdentityIndex(
  persistedIdentities: ConversationMessageIdentity[],
  loadedMessages: ConversationMessageIdentity[],
): ConversationMessageIdentity[] {
  const merged = new Map<string, ConversationMessageIdentity>();
  for (const identity of persistedIdentities) merged.set(identity.id, identity);
  for (const message of loadedMessages) merged.set(message.id, message);
  return Array.from(merged.values()).sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
}

type GenerationSourcedStateItem = {
  id?: string;
  sourceMessageId?: string | null;
  sourceGenerationId?: string | null;
};

function compactPreview(value: unknown): string | undefined {
  if (value == null) return undefined;
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return undefined;
  return normalized.length > 180 ? `${normalized.slice(0, 177)}...` : normalized;
}

function buildGenerationPruningReport({
  item,
  itemType,
  itemId,
  generationMap,
  valuePreview,
}: {
  item: GenerationSourcedStateItem;
  itemType: EffectiveStatePruningItemType;
  itemId: string;
  generationMap: Map<string, string>;
  valuePreview?: string;
}): EffectiveStatePruningReport {
  const sourceMessageId = item.sourceMessageId || undefined;
  const sourceGenerationId = item.sourceGenerationId || undefined;
  if (!sourceMessageId) {
    return {
      itemType,
      itemId,
      sourceGenerationId,
      included: !sourceGenerationId,
      reason: sourceGenerationId ? 'missing_source' : 'manual_or_legacy_no_generation',
      valuePreview,
    };
  }

  const currentGenerationId = generationMap.get(sourceMessageId);
  if (!currentGenerationId) {
    return {
      itemType,
      itemId,
      sourceMessageId,
      sourceGenerationId,
      included: false,
      reason: 'deleted_source_message',
      valuePreview,
    };
  }

  if (!sourceGenerationId) {
    return {
      itemType,
      itemId,
      sourceMessageId,
      currentGenerationId,
      included: false,
      reason: 'missing_source',
      valuePreview,
    };
  }

  const included = currentGenerationId === sourceGenerationId;
  return {
    itemType,
    itemId,
    sourceMessageId,
    sourceGenerationId,
    currentGenerationId,
    included,
    reason: included ? 'current_generation' : 'stale_generation',
    valuePreview,
  };
}

export function buildActiveGoalCompletionIds(
  derivations: StoryGoalStepDerivation[],
  generationMap: Map<string, string>,
): Set<string> {
  const completed = new Set<string>();
  for (const derivation of derivations) {
    if (!derivation.completed) continue;
    if (generationMap.get(derivation.sourceMessageId) !== derivation.sourceGenerationId) continue;
    completed.add(derivation.stepId);
  }
  return completed;
}

export function buildActiveGoalAlignmentMap(
  states: GoalAlignmentState[],
  generationMap: Map<string, string>,
): Map<string, GoalAlignmentState> {
  const map = new Map<string, GoalAlignmentState>();
  for (const state of states) {
    const latestSourceIsStale =
      (state.sourceMessageId && state.sourceGenerationId && generationMap.get(state.sourceMessageId) !== state.sourceGenerationId) ||
      (!state.sourceMessageId && !!state.sourceGenerationId);

    if (latestSourceIsStale) {
      const previous = state.previousState;
      if (!previous) continue;
      const previousSourceIsStale =
        (previous.sourceMessageId && previous.sourceGenerationId && generationMap.get(previous.sourceMessageId) !== previous.sourceGenerationId) ||
        (!previous.sourceMessageId && !!previous.sourceGenerationId);
      if (previousSourceIsStale) continue;

      const normalizedPrevious = normalizeGoalAlignmentState({
        ...state,
        ...previous,
        previousState: null,
      });
      map.set(buildGoalAlignmentKey(normalizedPrevious.goalKind, normalizedPrevious.goalId, normalizedPrevious.characterId), normalizedPrevious);
      continue;
    }

    const normalized = normalizeGoalAlignmentState(state);
    map.set(buildGoalAlignmentKey(normalized.goalKind, normalized.goalId, normalized.characterId), normalized);
  }
  return map;
}

export function buildActiveMemories(
  sourceMemories: Memory[],
  generationMap: Map<string, string>,
): Memory[] {
  return buildActiveMemoriesWithPruningReport(sourceMemories, generationMap).activeMemories;
}

export function buildActiveMemoriesWithPruningReport(
  sourceMemories: Memory[],
  generationMap: Map<string, string>,
): { activeMemories: Memory[]; pruningReports: EffectiveStatePruningReport[] } {
  const pruningReports = sourceMemories.map((memory) => buildGenerationPruningReport({
    item: memory,
    itemType: 'memory',
    itemId: memory.id,
    generationMap,
    valuePreview: compactPreview(memory.content),
  }));
  const includedMemoryIds = new Set(
    pruningReports
      .filter((report) => report.included)
      .map((report) => report.itemId),
  );

  return {
    activeMemories: sourceMemories.filter((memory) => includedMemoryIds.has(memory.id)),
    pruningReports,
  };
}

export function buildEffectiveStatePruningReports({
  generationMap,
  memories = [],
  goalDerivations = [],
  characterSnapshots = [],
  sideCharacterSnapshots = [],
  goalAlignmentStates = [],
}: {
  generationMap: Map<string, string>;
  memories?: Memory[];
  goalDerivations?: StoryGoalStepDerivation[];
  characterSnapshots?: CharacterStateMessageSnapshot[];
  sideCharacterSnapshots?: SideCharacterMessageSnapshot[];
  goalAlignmentStates?: GoalAlignmentState[];
}): EffectiveStatePruningReport[] {
  return [
    ...memories.map((memory) => buildGenerationPruningReport({
      item: memory,
      itemType: 'memory',
      itemId: memory.id,
      generationMap,
      valuePreview: compactPreview(memory.content),
    })),
    ...goalDerivations.map((derivation) => buildGenerationPruningReport({
      item: derivation,
      itemType: 'goal_derivation',
      itemId: derivation.id,
      generationMap,
      valuePreview: compactPreview({ goalId: derivation.goalId, stepId: derivation.stepId, completed: derivation.completed }),
    })),
    ...characterSnapshots.map((snapshot) => buildGenerationPruningReport({
      item: snapshot,
      itemType: 'character_state',
      itemId: snapshot.id,
      generationMap,
      valuePreview: compactPreview(snapshot.statePayload),
    })),
    ...sideCharacterSnapshots.map((snapshot) => buildGenerationPruningReport({
      item: snapshot,
      itemType: 'side_character_state',
      itemId: snapshot.id,
      generationMap,
      valuePreview: compactPreview(snapshot.statePayload),
    })),
    ...goalAlignmentStates.map((state) => buildGenerationPruningReport({
      item: state,
      itemType: 'goal_alignment',
      itemId: buildGoalAlignmentKey(state.goalKind, state.goalId, state.characterId),
      generationMap,
      valuePreview: compactPreview({ score: state.score, status: state.status, trend: state.trend }),
    })),
  ];
}

export function buildEffectiveWorldCore({
  baseCore,
  worldCoreSessionOverrides,
  activeGoalAlignmentMap,
  activeGoalCompletionIds,
}: {
  baseCore: WorldCore;
  worldCoreSessionOverrides?: Partial<WorldCore> | null;
  activeGoalAlignmentMap: Map<string, GoalAlignmentState>;
  activeGoalCompletionIds: Set<string>;
}): WorldCore {
  const manualCore = worldCoreSessionOverrides
    ? {
        ...baseCore,
        ...worldCoreSessionOverrides,
        structuredLocations: worldCoreSessionOverrides.structuredLocations ?? baseCore.structuredLocations,
        customWorldSections: worldCoreSessionOverrides.customWorldSections ?? baseCore.customWorldSections,
        storyGoals: worldCoreSessionOverrides.storyGoals ?? baseCore.storyGoals,
      }
    : baseCore;

  const storyGoals = (manualCore.storyGoals || []).map((goal) => ({
    ...goal,
    alignment: activeGoalAlignmentMap.get(buildGoalAlignmentKey('story', goal.id)),
    steps: (goal.steps || []).map((step) => {
      if (!activeGoalCompletionIds.has(step.id)) return step;
      return step.completed ? step : { ...step, completed: true };
    }),
  }));

  return {
    ...manualCore,
    storyGoals,
  };
}

function buildMessageOrder(messages: ConversationMessageIdentity[]): Map<string, number> {
  const messageOrder = new Map<string, number>();
  messages.forEach((message, index) => {
    messageOrder.set(message.id, index);
  });
  return messageOrder;
}

function deleteSnapshotField(payload: Record<string, unknown>, fieldPath: string): void {
  const parts = fieldPath.split('.').filter(Boolean);
  if (parts.length === 0) return;
  let current: Record<string, unknown> = payload;
  for (const part of parts.slice(0, -1)) {
    const next = current[part];
    if (!next || typeof next !== 'object' || Array.isArray(next)) return;
    current = next as Record<string, unknown>;
  }
  delete current[parts.at(-1) as string];
}

function pruneStaleUserAuthorityFields<TPayload extends { _fieldChangeMetadata?: Record<string, unknown> }>(
  payload: TPayload,
  generationMap: Map<string, string>,
): TPayload {
  const metadata = payload._fieldChangeMetadata;
  if (!metadata) return payload;
  const nextPayload = typeof structuredClone === 'function'
    ? structuredClone(payload)
    : JSON.parse(JSON.stringify(payload)) as TPayload;
  const nextMetadata = nextPayload._fieldChangeMetadata ?? {};

  for (const [fieldPath, rawMetadata] of Object.entries(metadata)) {
    if (!rawMetadata || typeof rawMetadata !== 'object') continue;
    const decision = (rawMetadata as { userStateAuthorityDecision?: unknown }).userStateAuthorityDecision;
    if (decision == null) continue;
    const decisionIsCurrent = isPersistedRoleplayUserStateAuthorityDecision(decision)
      && generationMap.get(decision.sourceMessageId) === decision.sourceGenerationId;
    if (decisionIsCurrent) continue;
    deleteSnapshotField(nextPayload as Record<string, unknown>, fieldPath);
    delete nextMetadata[fieldPath];
  }

  nextPayload._fieldChangeMetadata = nextMetadata;
  return nextPayload;
}

export function buildActiveCharacterSnapshotMap(
  snapshots: CharacterStateMessageSnapshot[],
  generationMap: Map<string, string>,
  messages: ConversationMessageIdentity[],
): Map<string, CharacterStateMessageSnapshot> {
  const messageOrder = buildMessageOrder(messages);
  const latestByCharacter = new Map<string, { order: number; createdAt: number; snapshot: CharacterStateMessageSnapshot }>();

  for (const snapshot of snapshots) {
    if (generationMap.get(snapshot.sourceMessageId) !== snapshot.sourceGenerationId) continue;
    const order = messageOrder.get(snapshot.sourceMessageId);
    if (order == null) continue;
    const currentSnapshot = {
      ...snapshot,
      statePayload: pruneStaleUserAuthorityFields(snapshot.statePayload, generationMap),
    };
    const existing = latestByCharacter.get(snapshot.characterId);
    if (!existing || order > existing.order || (order === existing.order && snapshot.createdAt >= existing.createdAt)) {
      latestByCharacter.set(snapshot.characterId, {
        order,
        createdAt: snapshot.createdAt,
        snapshot: currentSnapshot,
      });
    }
  }

  return new Map(
    Array.from(latestByCharacter.entries()).map(([characterId, value]) => [characterId, value.snapshot]),
  );
}

export function buildActiveSideCharacterSnapshotMap(
  snapshots: SideCharacterMessageSnapshot[],
  generationMap: Map<string, string>,
  messages: ConversationMessageIdentity[],
): Map<string, SideCharacterMessageSnapshot> {
  const messageOrder = buildMessageOrder(messages);
  const latestByCharacter = new Map<string, { order: number; createdAt: number; snapshot: SideCharacterMessageSnapshot }>();

  for (const snapshot of snapshots) {
    if (generationMap.get(snapshot.sourceMessageId) !== snapshot.sourceGenerationId) continue;
    const order = messageOrder.get(snapshot.sourceMessageId);
    if (order == null) continue;
    const currentSnapshot = {
      ...snapshot,
      statePayload: pruneStaleUserAuthorityFields(snapshot.statePayload, generationMap),
    };
    const existing = latestByCharacter.get(snapshot.sideCharacterId);
    if (!existing || order > existing.order || (order === existing.order && snapshot.createdAt >= existing.createdAt)) {
      latestByCharacter.set(snapshot.sideCharacterId, {
        order,
        createdAt: snapshot.createdAt,
        snapshot: currentSnapshot,
      });
    }
  }

  return new Map(
    Array.from(latestByCharacter.entries()).map(([sideCharacterId, value]) => [sideCharacterId, value.snapshot]),
  );
}

export function upsertCharacterStateMessageSnapshot(
  snapshots: CharacterStateMessageSnapshot[],
  snapshot: CharacterStateMessageSnapshot,
): CharacterStateMessageSnapshot[] {
  const next = [...snapshots];
  const index = next.findIndex(
    (entry) =>
      entry.characterId === snapshot.characterId &&
      entry.sourceMessageId === snapshot.sourceMessageId &&
      entry.sourceGenerationId === snapshot.sourceGenerationId,
  );
  if (index === -1) next.push(snapshot);
  else next[index] = snapshot;
  return next;
}

export function upsertSideCharacterStateMessageSnapshot(
  snapshots: SideCharacterMessageSnapshot[],
  snapshot: SideCharacterMessageSnapshot,
): SideCharacterMessageSnapshot[] {
  const next = [...snapshots];
  const index = next.findIndex(
    (entry) =>
      entry.sideCharacterId === snapshot.sideCharacterId &&
      entry.sourceMessageId === snapshot.sourceMessageId &&
      entry.sourceGenerationId === snapshot.sourceGenerationId,
  );
  if (index === -1) next.push(snapshot);
  else next[index] = snapshot;
  return next;
}

export function applyCharacterSnapshot({
  baseChar,
  manualMergedCharacter,
  snapshotMap,
  alignmentMap,
}: {
  baseChar: Character;
  manualMergedCharacter: Character & { previousNames?: string[] };
  snapshotMap: Map<string, CharacterStateMessageSnapshot>;
  alignmentMap: Map<string, GoalAlignmentState>;
}): Character & { previousNames?: string[] } {
  const withGoalAlignment = (character: Character & { previousNames?: string[] }) => ({
    ...character,
    goals: (character.goals || []).map((goal) => ({
      ...goal,
      alignment: alignmentMap.get(buildGoalAlignmentKey('character', goal.id, baseChar.id)),
    })),
  });

  const snapshot = snapshotMap.get(baseChar.id);
  if (!snapshot?.statePayload) return withGoalAlignment(manualMergedCharacter);

  const payload = snapshot.statePayload;
  const merged = {
    ...manualMergedCharacter,
    ...payload,
    id: baseChar.id,
    sections: payload.sections ?? manualMergedCharacter.sections,
    avatarDataUrl: payload.avatarDataUrl ?? manualMergedCharacter.avatarDataUrl,
    previousNames: payload.previousNames ?? manualMergedCharacter.previousNames ?? [],
  };
  return withGoalAlignment(merged as Character & { previousNames?: string[] });
}

export function applySideCharacterSnapshot(
  baseChar: SideCharacter,
  snapshotMap: Map<string, SideCharacterMessageSnapshot>,
): SideCharacter {
  const snapshot = snapshotMap.get(baseChar.id);
  if (!snapshot?.statePayload) return baseChar;

  const payload = snapshot.statePayload;
  return {
    ...baseChar,
    ...payload,
    id: baseChar.id,
    physicalAppearance: payload.physicalAppearance ?? baseChar.physicalAppearance,
    currentlyWearing: payload.currentlyWearing ?? baseChar.currentlyWearing,
    preferredClothing: payload.preferredClothing ?? baseChar.preferredClothing,
    background: payload.background ?? baseChar.background,
    personality: payload.personality ?? baseChar.personality,
    sections: payload.sections ?? baseChar.sections,
    avatarDataUrl: payload.avatarDataUrl ?? baseChar.avatarDataUrl,
    avatarPosition: payload.avatarPosition ?? baseChar.avatarPosition,
    extractedTraits: payload.extractedTraits ?? baseChar.extractedTraits,
  };
}
