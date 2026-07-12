import { describe, expect, it } from 'vitest';

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
import {
  defaultCurrentlyWearing,
  defaultPhysicalAppearance,
  defaultPreferredClothing,
  defaultSideCharacterBackground,
  defaultSideCharacterPersonality,
} from '@/types';
import { buildGoalAlignmentKey } from '@/lib/goal-alignment';
import {
  applyCharacterSnapshot,
  applySideCharacterSnapshot,
  buildActiveMemoriesWithPruningReport,
  buildActiveCharacterSnapshotMap,
  buildActiveGoalAlignmentMap,
  buildActiveGoalCompletionIds,
  buildActiveMemories,
  buildActiveSideCharacterSnapshotMap,
  buildEffectiveWorldCore,
  buildEffectiveStatePruningReports,
  buildMessageGenerationMap,
  mergeConversationMessageIdentityIndex,
  upsertCharacterStateMessageSnapshot,
  upsertSideCharacterStateMessageSnapshot,
} from './effective-state';

const message = (id: string, generationId?: string): Message => ({
  id,
  generationId,
  role: 'assistant',
  text: id,
  createdAt: Number(id.replace(/\D/g, '') || 1),
});

const memory = (patch: Partial<Memory>): Memory => ({
  id: patch.id || 'memory-1',
  conversationId: patch.conversationId || 'conversation-1',
  content: patch.content || 'memory',
  day: patch.day ?? 1,
  timeOfDay: patch.timeOfDay ?? 'day',
  source: patch.source || 'message',
  entryType: patch.entryType || 'bullet',
  createdAt: patch.createdAt ?? 1,
  updatedAt: patch.updatedAt ?? 1,
  ...patch,
});

const derivation = (patch: Partial<StoryGoalStepDerivation>): StoryGoalStepDerivation => ({
  id: patch.id || 'derivation-1',
  conversationId: patch.conversationId || 'conversation-1',
  goalId: patch.goalId || 'goal-1',
  stepId: patch.stepId || 'step-1',
  sourceMessageId: patch.sourceMessageId || 'm1',
  sourceGenerationId: patch.sourceGenerationId || 'g1',
  completed: patch.completed ?? true,
  day: patch.day ?? 1,
  timeOfDay: patch.timeOfDay ?? 'day',
  createdAt: patch.createdAt ?? 1,
});

const alignment = (patch: Partial<GoalAlignmentState> & Pick<GoalAlignmentState, 'goalId' | 'goalKind'>): GoalAlignmentState => ({
  conversationId: 'conversation-1',
  score: 50,
  status: 'active',
  trend: 'stable',
  supportCount: 0,
  resistanceCount: 0,
  driftCount: 0,
  lastSignal: 'neutral',
  sourceMessageId: 'm1',
  sourceGenerationId: 'g1',
  previousState: null,
  ...patch,
});

const baseCharacter = (patch: Partial<Character> = {}): Character => ({
  id: patch.id || 'char-1',
  name: patch.name || 'Ashley',
  nicknames: patch.nicknames || '',
  age: patch.age || '',
  sexType: patch.sexType || '',
  sexualOrientation: patch.sexualOrientation || '',
  location: patch.location || 'Base location',
  controlledBy: patch.controlledBy || 'AI',
  characterRole: patch.characterRole || 'Main',
  roleDescription: patch.roleDescription || '',
  tags: patch.tags || '',
  avatarDataUrl: patch.avatarDataUrl || 'base-avatar',
  avatarPosition: patch.avatarPosition,
  physicalAppearance: patch.physicalAppearance || { ...defaultPhysicalAppearance },
  currentlyWearing: patch.currentlyWearing || { ...defaultCurrentlyWearing },
  preferredClothing: patch.preferredClothing || { ...defaultPreferredClothing },
  goals: patch.goals || [],
  sections: patch.sections || [{ id: 'section-1', title: 'Base', items: [], createdAt: 1, updatedAt: 1 }],
  createdAt: patch.createdAt || 1,
  updatedAt: patch.updatedAt || 1,
  ...patch,
});

const baseSideCharacter = (patch: Partial<SideCharacter> = {}): SideCharacter => ({
  id: patch.id || 'side-1',
  name: patch.name || 'Morgan',
  nicknames: patch.nicknames || '',
  age: patch.age || '',
  sexType: patch.sexType || '',
  sexualOrientation: patch.sexualOrientation || '',
  location: patch.location || 'Base side location',
  controlledBy: patch.controlledBy || 'AI',
  characterRole: patch.characterRole || 'Side',
  roleDescription: patch.roleDescription || '',
  physicalAppearance: patch.physicalAppearance || { ...defaultPhysicalAppearance },
  currentlyWearing: patch.currentlyWearing || { ...defaultCurrentlyWearing },
  preferredClothing: patch.preferredClothing || { ...defaultPreferredClothing },
  background: patch.background || { ...defaultSideCharacterBackground },
  personality: patch.personality || { ...defaultSideCharacterPersonality },
  sections: patch.sections || [{ id: 'section-1', title: 'Base', items: [], createdAt: 1, updatedAt: 1 }],
  avatarDataUrl: patch.avatarDataUrl || 'base-side-avatar',
  avatarPosition: patch.avatarPosition,
  firstMentionedIn: patch.firstMentionedIn || 'conversation-1',
  extractedTraits: patch.extractedTraits || ['base trait'],
  createdAt: patch.createdAt || 1,
  updatedAt: patch.updatedAt || 1,
  ...patch,
});

describe('effective roleplay state helpers', () => {
  it('merges the full identity index with newly loaded messages in chronological order', () => {
    const merged = mergeConversationMessageIdentityIndex(
      [message('m1', 'g1'), message('m2', 'old-g2')],
      [message('m2', 'g2'), message('m3', 'g3')],
    );

    expect(merged.map((entry) => [entry.id, entry.generationId])).toEqual([
      ['m1', 'g1'],
      ['m2', 'g2'],
      ['m3', 'g3'],
    ]);
  });

  it('builds generation maps and excludes stale or deleted message-derived memories', () => {
    const generationMap = buildMessageGenerationMap([message('m1', 'g2'), message('m3')]);

    expect(generationMap.get('m1')).toBe('g2');
    expect(generationMap.get('m3')).toBe('m3');
    expect(buildActiveMemories([
      memory({ id: 'manual', source: 'user', sourceMessageId: undefined, sourceGenerationId: undefined }),
      memory({ id: 'current', sourceMessageId: 'm1', sourceGenerationId: 'g2' }),
      memory({ id: 'legacy-no-generation', sourceMessageId: 'm1', sourceGenerationId: undefined }),
      memory({ id: 'stale', sourceMessageId: 'm1', sourceGenerationId: 'g1' }),
      memory({ id: 'deleted', sourceMessageId: 'm2', sourceGenerationId: 'g1' }),
    ], generationMap).map((entry) => entry.id)).toEqual(['manual', 'current', 'legacy-no-generation']);
  });

  it('keeps goal completions only from visible message generations', () => {
    const generationMap = buildMessageGenerationMap([message('m1', 'g2'), message('m2', 'g1')]);
    const completed = buildActiveGoalCompletionIds([
      derivation({ stepId: 'current', sourceMessageId: 'm1', sourceGenerationId: 'g2' }),
      derivation({ stepId: 'stale', sourceMessageId: 'm1', sourceGenerationId: 'g1' }),
      derivation({ stepId: 'incomplete', sourceMessageId: 'm2', sourceGenerationId: 'g1', completed: false }),
    ], generationMap);

    expect(Array.from(completed)).toEqual(['current']);
  });

  it('falls back to previous goal alignment state when the current source generation is stale', () => {
    const generationMap = buildMessageGenerationMap([message('m1', 'g1'), message('m2', 'g2')]);
    const map = buildActiveGoalAlignmentMap([
      alignment({
        goalId: 'goal-1',
        goalKind: 'story',
        score: 80,
        sourceMessageId: 'm2',
        sourceGenerationId: 'stale-g2',
        previousState: {
          score: 42,
          status: 'resisted',
          trend: 'falling',
          supportCount: 1,
          resistanceCount: 2,
          driftCount: 0,
          lastSignal: 'resistance',
          sourceMessageId: 'm1',
          sourceGenerationId: 'g1',
        },
      }),
    ], generationMap);

    const restored = map.get(buildGoalAlignmentKey('story', 'goal-1'));
    expect(restored?.score).toBe(42);
    expect(restored?.status).toBe('resisted');
    expect(restored?.previousState).toBeNull();
  });

  it('applies world overrides and active goal completions without mutating the base core', () => {
    const baseCore: WorldCore = {
      scenarioName: 'Base',
      briefDescription: 'Base brief',
      storyPremise: 'Base premise',
      dialogFormatting: 'Base format',
      structuredLocations: [{ id: 'loc-1', label: 'Base room', description: 'Base' }],
      storyGoals: [{
        id: 'goal-1',
        title: 'Goal',
        desiredOutcome: 'Outcome',
        steps: [{ id: 'step-1', description: 'First step', completed: false }],
        flexibility: 'normal',
        createdAt: 1,
        updatedAt: 1,
      }],
    };
    const activeAlignment = alignment({ goalId: 'goal-1', goalKind: 'story', score: 65 });
    const core = buildEffectiveWorldCore({
      baseCore,
      worldCoreSessionOverrides: { scenarioName: 'Override' },
      activeGoalAlignmentMap: new Map([[buildGoalAlignmentKey('story', 'goal-1'), activeAlignment]]),
      activeGoalCompletionIds: new Set(['step-1']),
    });

    expect(core.scenarioName).toBe('Override');
    expect(core.structuredLocations).toBe(baseCore.structuredLocations);
    expect(core.storyGoals?.[0].alignment?.score).toBe(65);
    expect(core.storyGoals?.[0].steps[0].completed).toBe(true);
    expect(baseCore.storyGoals?.[0].steps[0].completed).toBe(false);
  });

  it('selects the latest visible character and side-character snapshots by message order and createdAt', () => {
    const messages = [message('m1', 'g1'), message('m2', 'g2')];
    const generationMap = buildMessageGenerationMap(messages);
    const mainSnapshots: CharacterStateMessageSnapshot[] = [
      { id: 'old', conversationId: 'conversation-1', characterId: 'char-1', sourceMessageId: 'm1', sourceGenerationId: 'g1', statePayload: { location: 'old' }, createdAt: 10 },
      { id: 'newer-same-message', conversationId: 'conversation-1', characterId: 'char-1', sourceMessageId: 'm2', sourceGenerationId: 'g2', statePayload: { location: 'newer' }, createdAt: 5 },
      { id: 'same-message-tie-winner', conversationId: 'conversation-1', characterId: 'char-1', sourceMessageId: 'm2', sourceGenerationId: 'g2', statePayload: { location: 'tie winner' }, createdAt: 15 },
      { id: 'stale', conversationId: 'conversation-1', characterId: 'char-2', sourceMessageId: 'm2', sourceGenerationId: 'old-g2', statePayload: { location: 'stale' }, createdAt: 20 },
    ];
    const sideSnapshots: SideCharacterMessageSnapshot[] = [
      { id: 'side-old', conversationId: 'conversation-1', sideCharacterId: 'side-1', sourceMessageId: 'm1', sourceGenerationId: 'g1', statePayload: { location: 'side old' }, createdAt: 10 },
      { id: 'side-new', conversationId: 'conversation-1', sideCharacterId: 'side-1', sourceMessageId: 'm2', sourceGenerationId: 'g2', statePayload: { location: 'side new' }, createdAt: 5 },
    ];

    expect(buildActiveCharacterSnapshotMap(mainSnapshots, generationMap, messages).get('char-1')?.statePayload.location).toBe('tie winner');
    expect(buildActiveCharacterSnapshotMap(mainSnapshots, generationMap, messages).has('char-2')).toBe(false);
    expect(buildActiveSideCharacterSnapshotMap(sideSnapshots, generationMap, messages).get('side-1')?.statePayload.location).toBe('side new');
  });

  it('keeps a valid older snapshot active when its message body is outside the loaded transcript window', () => {
    const fullIdentityIndex = Array.from({ length: 35 }, (_, index) => message(`m${index + 1}`, `g${index + 1}`));
    const loadedMessages = fullIdentityIndex.slice(-30);
    const mergedIdentityIndex = mergeConversationMessageIdentityIndex(fullIdentityIndex, loadedMessages);
    const generationMap = buildMessageGenerationMap(mergedIdentityIndex);
    const snapshots: CharacterStateMessageSnapshot[] = [{
      id: 'older-valid-snapshot',
      conversationId: 'conversation-1',
      characterId: 'char-1',
      sourceMessageId: 'm2',
      sourceGenerationId: 'g2',
      statePayload: { location: 'Older but still valid location' },
      createdAt: 2,
    }];

    expect(buildActiveCharacterSnapshotMap(snapshots, generationMap, mergedIdentityIndex)
      .get('char-1')?.statePayload.location).toBe('Older but still valid location');
  });

  it('upserts character and side-character message snapshots without mutating the previous array', () => {
    const originalCharacterSnapshot: CharacterStateMessageSnapshot = {
      id: 'snapshot-1',
      conversationId: 'conversation-1',
      characterId: 'char-1',
      sourceMessageId: 'assistant-1',
      sourceGenerationId: 'generation-1',
      statePayload: { location: 'old location' },
      createdAt: 1,
    };
    const replacementCharacterSnapshot: CharacterStateMessageSnapshot = {
      ...originalCharacterSnapshot,
      id: 'snapshot-2',
      statePayload: { location: 'new location' },
      createdAt: 2,
    };
    const secondCharacterSnapshot: CharacterStateMessageSnapshot = {
      ...originalCharacterSnapshot,
      id: 'snapshot-3',
      characterId: 'char-2',
      statePayload: { location: 'other character' },
    };

    const characterSnapshots = [originalCharacterSnapshot];
    const replacedCharacters = upsertCharacterStateMessageSnapshot(characterSnapshots, replacementCharacterSnapshot);
    const appendedCharacters = upsertCharacterStateMessageSnapshot(replacedCharacters, secondCharacterSnapshot);

    expect(characterSnapshots).toEqual([originalCharacterSnapshot]);
    expect(replacedCharacters).toHaveLength(1);
    expect(replacedCharacters[0]).toBe(replacementCharacterSnapshot);
    expect(appendedCharacters).toEqual([replacementCharacterSnapshot, secondCharacterSnapshot]);

    const originalSideSnapshot: SideCharacterMessageSnapshot = {
      id: 'side-snapshot-1',
      conversationId: 'conversation-1',
      sideCharacterId: 'side-1',
      sourceMessageId: 'assistant-1',
      sourceGenerationId: 'generation-1',
      statePayload: { location: 'old side location' },
      createdAt: 1,
    };
    const replacementSideSnapshot: SideCharacterMessageSnapshot = {
      ...originalSideSnapshot,
      id: 'side-snapshot-2',
      statePayload: { location: 'new side location' },
      createdAt: 2,
    };
    const secondSideSnapshot: SideCharacterMessageSnapshot = {
      ...originalSideSnapshot,
      id: 'side-snapshot-3',
      sideCharacterId: 'side-2',
      statePayload: { location: 'other side character' },
    };

    const sideSnapshots = [originalSideSnapshot];
    const replacedSideCharacters = upsertSideCharacterStateMessageSnapshot(sideSnapshots, replacementSideSnapshot);
    const appendedSideCharacters = upsertSideCharacterStateMessageSnapshot(replacedSideCharacters, secondSideSnapshot);

    expect(sideSnapshots).toEqual([originalSideSnapshot]);
    expect(replacedSideCharacters).toHaveLength(1);
    expect(replacedSideCharacters[0]).toBe(replacementSideSnapshot);
    expect(appendedSideCharacters).toEqual([replacementSideSnapshot, secondSideSnapshot]);
  });

  it('applies character and side-character snapshots while preserving protected base fields and fallbacks', () => {
    const character = baseCharacter({
      id: 'char-1',
      avatarDataUrl: 'manual-avatar',
      goals: [{
        id: 'char-goal-1',
        title: 'Character goal',
        desiredOutcome: 'Outcome',
        progress: 0,
        steps: [],
        flexibility: 'normal',
        createdAt: 1,
        updatedAt: 1,
      }],
    });
    const characterSnapshot: CharacterStateMessageSnapshot = {
      id: 'snapshot-1',
      conversationId: 'conversation-1',
      characterId: 'char-1',
      sourceMessageId: 'm1',
      sourceGenerationId: 'g1',
      statePayload: { id: 'bad-id', location: 'snapshot-location', avatarDataUrl: undefined, previousNames: ['Old name'] },
      createdAt: 1,
    };
    const characterAlignment = alignment({ goalId: 'char-goal-1', goalKind: 'character', characterId: 'char-1', score: 70 });

    const effectiveCharacter = applyCharacterSnapshot({
      baseChar: character,
      manualMergedCharacter: { ...character, location: 'manual-location' },
      snapshotMap: new Map([['char-1', characterSnapshot]]),
      alignmentMap: new Map([[buildGoalAlignmentKey('character', 'char-goal-1', 'char-1'), characterAlignment]]),
    });

    expect(effectiveCharacter.id).toBe('char-1');
    expect(effectiveCharacter.location).toBe('snapshot-location');
    expect(effectiveCharacter.avatarDataUrl).toBe('manual-avatar');
    expect(effectiveCharacter.previousNames).toEqual(['Old name']);
    expect(effectiveCharacter.goals?.[0].alignment?.score).toBe(70);

    const sideCharacter = baseSideCharacter({ id: 'side-1', avatarDataUrl: 'side-avatar', extractedTraits: ['base trait'] });
    const sideSnapshot: SideCharacterMessageSnapshot = {
      id: 'side-snapshot-1',
      conversationId: 'conversation-1',
      sideCharacterId: 'side-1',
      sourceMessageId: 'm1',
      sourceGenerationId: 'g1',
      statePayload: { id: 'bad-side-id', location: 'side snapshot', avatarDataUrl: undefined, extractedTraits: undefined },
      createdAt: 1,
    };

    const effectiveSideCharacter = applySideCharacterSnapshot(sideCharacter, new Map([['side-1', sideSnapshot]]));
    expect(effectiveSideCharacter.id).toBe('side-1');
    expect(effectiveSideCharacter.location).toBe('side snapshot');
    expect(effectiveSideCharacter.avatarDataUrl).toBe('side-avatar');
    expect(effectiveSideCharacter.extractedTraits).toEqual(['base trait']);
  });

  it('excludes replaced-generation state in a regenerate-style truncated history fixture', () => {
    const regeneratedMessages = [message('user-1', 'user-g1'), message('assistant-1', 'assistant-g2')];
    const generationMap = buildMessageGenerationMap(regeneratedMessages);

    const activeMemoryIds = buildActiveMemories([
      memory({ id: 'old-memory', sourceMessageId: 'assistant-1', sourceGenerationId: 'assistant-g1' }),
      memory({ id: 'new-memory', sourceMessageId: 'assistant-1', sourceGenerationId: 'assistant-g2' }),
    ], generationMap).map((entry) => entry.id);
    const activeSnapshotMap = buildActiveCharacterSnapshotMap([
      { id: 'old-snapshot', conversationId: 'conversation-1', characterId: 'char-1', sourceMessageId: 'assistant-1', sourceGenerationId: 'assistant-g1', statePayload: { location: 'old branch' }, createdAt: 1 },
      { id: 'new-snapshot', conversationId: 'conversation-1', characterId: 'char-1', sourceMessageId: 'assistant-1', sourceGenerationId: 'assistant-g2', statePayload: { location: 'new branch' }, createdAt: 2 },
    ], generationMap, regeneratedMessages);
    const activeCompletions = buildActiveGoalCompletionIds([
      derivation({ stepId: 'old-step', sourceMessageId: 'assistant-1', sourceGenerationId: 'assistant-g1' }),
      derivation({ stepId: 'new-step', sourceMessageId: 'assistant-1', sourceGenerationId: 'assistant-g2' }),
    ], generationMap);

    expect(activeMemoryIds).toEqual(['new-memory']);
    expect(activeSnapshotMap.get('char-1')?.statePayload.location).toBe('new branch');
    expect(Array.from(activeCompletions)).toEqual(['new-step']);
  });

  it('reports included and pruned generation-derived state without weakening filters', () => {
    const regeneratedMessages = [message('assistant-1', 'assistant-g2'), message('assistant-2', 'assistant-g3')];
    const generationMap = buildMessageGenerationMap(regeneratedMessages);

    const memoryResult = buildActiveMemoriesWithPruningReport([
      memory({ id: 'manual-memory', source: 'user', sourceMessageId: undefined, sourceGenerationId: undefined }),
      memory({ id: 'current-memory', sourceMessageId: 'assistant-1', sourceGenerationId: 'assistant-g2' }),
      memory({ id: 'legacy-memory', sourceMessageId: 'assistant-1', sourceGenerationId: undefined }),
      memory({ id: 'stale-memory', sourceMessageId: 'assistant-1', sourceGenerationId: 'assistant-g1' }),
      memory({ id: 'deleted-source-memory', sourceMessageId: 'assistant-deleted', sourceGenerationId: 'assistant-old' }),
    ], generationMap);

    expect(memoryResult.activeMemories.map((entry) => entry.id)).toEqual([
      'manual-memory',
      'current-memory',
      'legacy-memory',
    ]);
    expect(memoryResult.pruningReports).toEqual(expect.arrayContaining([
      expect.objectContaining({
        itemType: 'memory',
        itemId: 'current-memory',
        included: true,
        reason: 'current_generation',
        sourceMessageId: 'assistant-1',
        sourceGenerationId: 'assistant-g2',
        currentGenerationId: 'assistant-g2',
      }),
      expect.objectContaining({
        itemType: 'memory',
        itemId: 'stale-memory',
        included: false,
        reason: 'stale_generation',
        sourceMessageId: 'assistant-1',
        sourceGenerationId: 'assistant-g1',
        currentGenerationId: 'assistant-g2',
      }),
      expect.objectContaining({
        itemType: 'memory',
        itemId: 'deleted-source-memory',
        included: false,
        reason: 'deleted_source_message',
        sourceMessageId: 'assistant-deleted',
        sourceGenerationId: 'assistant-old',
      }),
    ]));

    const pruningReports = buildEffectiveStatePruningReports({
      generationMap,
      memories: memoryResult.activeMemories,
      goalDerivations: [
        derivation({ id: 'current-goal', stepId: 'current-step', sourceMessageId: 'assistant-1', sourceGenerationId: 'assistant-g2' }),
        derivation({ id: 'stale-goal', stepId: 'stale-step', sourceMessageId: 'assistant-1', sourceGenerationId: 'assistant-g1' }),
      ],
      characterSnapshots: [
        { id: 'current-character', conversationId: 'conversation-1', characterId: 'char-1', sourceMessageId: 'assistant-1', sourceGenerationId: 'assistant-g2', statePayload: { location: 'current branch' }, createdAt: 2 },
        { id: 'stale-character', conversationId: 'conversation-1', characterId: 'char-1', sourceMessageId: 'assistant-1', sourceGenerationId: 'assistant-g1', statePayload: { location: 'old branch' }, createdAt: 1 },
      ],
      sideCharacterSnapshots: [
        { id: 'current-side-character', conversationId: 'conversation-1', sideCharacterId: 'side-1', sourceMessageId: 'assistant-2', sourceGenerationId: 'assistant-g3', statePayload: { location: 'current side branch' }, createdAt: 2 },
        { id: 'stale-side-character', conversationId: 'conversation-1', sideCharacterId: 'side-1', sourceMessageId: 'assistant-2', sourceGenerationId: 'assistant-g2', statePayload: { location: 'old side branch' }, createdAt: 1 },
      ],
    });

    expect(pruningReports).toEqual(expect.arrayContaining([
      expect.objectContaining({ itemType: 'goal_derivation', itemId: 'current-goal', included: true, reason: 'current_generation' }),
      expect.objectContaining({ itemType: 'goal_derivation', itemId: 'stale-goal', included: false, reason: 'stale_generation' }),
      expect.objectContaining({ itemType: 'character_state', itemId: 'current-character', included: true, reason: 'current_generation' }),
      expect.objectContaining({ itemType: 'character_state', itemId: 'stale-character', included: false, reason: 'stale_generation' }),
      expect.objectContaining({ itemType: 'side_character_state', itemId: 'current-side-character', included: true, reason: 'current_generation' }),
      expect.objectContaining({ itemType: 'side_character_state', itemId: 'stale-side-character', included: false, reason: 'stale_generation' }),
    ]));
  });
});
