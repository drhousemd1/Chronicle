import { describe, expect, it } from 'vitest';
import type { ScenarioData } from '@/types';
import { getSystemInstruction } from '@/services/llm';
import { selectRoleplayGoalsForTurn } from './roleplay-goal-selector';

function fixture(): ScenarioData {
  return {
    version: 1,
    characters: [
      {
        id: 'character-sarah',
        name: 'Sarah',
        controlledBy: 'AI',
        characterRole: 'Main',
        location: 'Workshop',
        goals: [
          {
            id: 'character-goal-repair',
            title: 'Repair the transmitter',
            desiredOutcome: 'Restore the transmitter before nightfall.',
            currentStatus: 'The power board is exposed.',
            progress: 25,
            steps: [{ id: 'repair-step', description: 'Replace the damaged power board.', completed: false }],
            flexibility: 'normal',
            createdAt: 1,
            updatedAt: 1,
          },
          {
            id: 'character-goal-leave',
            title: 'Leave the settlement',
            desiredOutcome: 'Depart after the winter supply is secured.',
            currentStatus: 'Long-range planning only.',
            progress: 0,
            steps: [{ id: 'leave-step', description: 'Secure winter provisions.', completed: false }],
            flexibility: 'normal',
            createdAt: 1,
            updatedAt: 1,
          },
        ],
        nicknames: '', age: '', sexType: '', sexualOrientation: '', scenePosition: '',
        roleDescription: '', tags: '', avatarDataUrl: '', physicalAppearance: {} as never,
        currentlyWearing: {} as never, preferredClothing: {} as never, sections: [], createdAt: 1, updatedAt: 1,
      },
    ],
    sideCharacters: [],
    world: {
      core: {
        scenarioName: 'Signal', briefDescription: '', storyPremise: '', dialogFormatting: '',
        storyGoals: [
          {
            id: 'story-goal-storm',
            title: 'Survive the storm',
            desiredOutcome: 'Keep the settlement safe during the storm.',
            currentStatus: 'The storm remains several days away.',
            steps: [{ id: 'storm-step', description: 'Reinforce the outer wall.', completed: false }],
            flexibility: 'normal', createdAt: 1, updatedAt: 1,
          },
          {
            id: 'story-goal-hidden',
            title: 'Find the hidden vault',
            desiredOutcome: 'Discover a vault unknown to the characters.',
            steps: [], flexibility: 'normal',
            alignment: {
              goalId: 'story-goal-hidden', goalKind: 'story', score: 0, status: 'dropped',
              trend: 'falling', supportCount: 0, resistanceCount: 1, driftCount: 1,
              lastSignal: 'resistance', updatedAt: 1,
            },
            createdAt: 1, updatedAt: 1,
          },
        ],
        structuredLocations: [], customWorldSections: [],
      },
      entries: [],
    },
    story: { openingDialog: {} as never },
    scenes: [], conversations: [],
  } as ScenarioData;
}

describe('selectRoleplayGoalsForTurn', () => {
  it('returns active, background, and hidden decisions with deterministic evidence', () => {
    const receipt = selectRoleplayGoalsForTurn({
      appData: fixture(),
      latestPlayerTurn: 'Sarah, replace the damaged transmitter power board now.',
      activeScene: { id: 'scene-1', url: '', title: 'Workshop repair', tags: ['transmitter'], createdAt: 1 },
      mode: 'normal_send',
    });

    expect(receipt.mode).toBe('normal_send');
    expect(receipt.receiptId).toMatch(/^goal-exposure:normal_send:/);
    expect(receipt.decisions.find((row) => row.goalId === 'character-goal-repair')).toMatchObject({
      tier: 'active', renderDetail: 'full', openMilestoneId: 'repair-step', partialProgress: 'debug_only',
    });
    expect(receipt.decisions.find((row) => row.goalId === 'character-goal-leave')).toMatchObject({
      tier: 'background',
      reason: 'writer_visible_without_current_turn_support',
    });
    expect(receipt.decisions.find((row) => row.goalId === 'story-goal-storm')).toMatchObject({
      tier: 'background', renderDetail: 'compact',
    });
    expect(receipt.decisions.find((row) => row.goalId === 'story-goal-hidden')).toMatchObject({
      tier: 'hidden_this_turn', renderDetail: 'debug_only',
    });
  });

  it('produces the same exposure decisions for all three response modes', () => {
    const appData = fixture();
    const input = {
      appData,
      latestPlayerTurn: 'Sarah, replace the damaged transmitter power board now.',
      activeScene: null,
    };
    const normal = selectRoleplayGoalsForTurn({ ...input, mode: 'normal_send' });
    const retry = selectRoleplayGoalsForTurn({ ...input, mode: 'retry_regenerate' });
    const continuation = selectRoleplayGoalsForTurn({ ...input, mode: 'continue_assistant_tail' });
    expect(retry.decisions).toEqual(normal.decisions);
    expect(continuation.decisions).toEqual(normal.decisions);
    expect(retry.mode).toBe('retry_regenerate');
    expect(continuation.mode).toBe('continue_assistant_tail');
  });

  it('renders active goals fully, background goals compactly, and hidden goals not at all', () => {
    const appData = fixture();
    const receipt = selectRoleplayGoalsForTurn({
      appData,
      latestPlayerTurn: 'Sarah, replace the damaged transmitter power board now.',
      activeScene: null,
      mode: 'normal_send',
    });
    const prompt = getSystemInstruction(appData, 1, 'day', [], true, null, receipt.decisions);

    expect(prompt).toContain('CHARACTER GOAL: Repair the transmitter');
    expect(prompt).toContain('Current open milestone: Replace the damaged power board');
    expect(prompt).toContain('STORY GOAL: Survive the storm');
    expect(prompt).toContain('Background context only');
    expect(prompt).not.toContain('Current open milestone: Reinforce the outer wall');
    expect(prompt).not.toContain('Find the hidden vault');
  });
});
