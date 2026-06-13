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

export function buildMessageGenerationMap(messages: Message[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const message of messages) {
    map.set(message.id, message.generationId || message.id);
  }
  return map;
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
  return sourceMemories.filter((memory) => {
    if (!memory.sourceMessageId) return true;
    const currentGeneration = generationMap.get(memory.sourceMessageId);
    if (!currentGeneration) return false;
    if (!memory.sourceGenerationId) return true;
    return currentGeneration === memory.sourceGenerationId;
  });
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

function buildMessageOrder(messages: Message[]): Map<string, number> {
  const messageOrder = new Map<string, number>();
  messages.forEach((message, index) => {
    messageOrder.set(message.id, index);
  });
  return messageOrder;
}

export function buildActiveCharacterSnapshotMap(
  snapshots: CharacterStateMessageSnapshot[],
  generationMap: Map<string, string>,
  messages: Message[],
): Map<string, CharacterStateMessageSnapshot> {
  const messageOrder = buildMessageOrder(messages);
  const latestByCharacter = new Map<string, { order: number; createdAt: number; snapshot: CharacterStateMessageSnapshot }>();

  for (const snapshot of snapshots) {
    if (generationMap.get(snapshot.sourceMessageId) !== snapshot.sourceGenerationId) continue;
    const order = messageOrder.get(snapshot.sourceMessageId);
    if (order == null) continue;
    const existing = latestByCharacter.get(snapshot.characterId);
    if (!existing || order > existing.order || (order === existing.order && snapshot.createdAt >= existing.createdAt)) {
      latestByCharacter.set(snapshot.characterId, {
        order,
        createdAt: snapshot.createdAt,
        snapshot,
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
  messages: Message[],
): Map<string, SideCharacterMessageSnapshot> {
  const messageOrder = buildMessageOrder(messages);
  const latestByCharacter = new Map<string, { order: number; createdAt: number; snapshot: SideCharacterMessageSnapshot }>();

  for (const snapshot of snapshots) {
    if (generationMap.get(snapshot.sourceMessageId) !== snapshot.sourceGenerationId) continue;
    const order = messageOrder.get(snapshot.sourceMessageId);
    if (order == null) continue;
    const existing = latestByCharacter.get(snapshot.sideCharacterId);
    if (!existing || order > existing.order || (order === existing.order && snapshot.createdAt >= existing.createdAt)) {
      latestByCharacter.set(snapshot.sideCharacterId, {
        order,
        createdAt: snapshot.createdAt,
        snapshot,
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
