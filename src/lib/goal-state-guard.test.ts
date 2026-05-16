import { describe, expect, it } from 'vitest';

import { isTaskLevelGoalText, parseExtractedGoalUpdateValue } from '@/lib/goal-state-guard';

describe('goal-state guard', () => {
  it('separates extractor control fields so new_steps cannot become current status', () => {
    const parsed = parseExtractedGoalUpdateValue(
      'progress: 25% | complete_steps: 1 | new_steps: Step 1: Spot abandoned cabin through blizzard. Step 2: Reach the cabin and check door. Step 3: Enter and secure interior.',
    );

    expect(parsed.progress).toBe(25);
    expect(parsed.completeStepIndexes).toEqual([1]);
    expect(parsed.currentStatus).toBe('');
    expect(parsed.hasCurrentStatus).toBe(false);
    expect(parsed.newStepsText).toContain('Reach the cabin and check door');
  });

  it('recognizes short concrete scene actions as task-level while keeping durable milestones', () => {
    expect(isTaskLevelGoalText('Reach the cabin and check door')).toBe(true);
    expect(isTaskLevelGoalText('Guide group to cabin door')).toBe(true);
    expect(isTaskLevelGoalText('Enter and secure interior')).toBe(true);

    expect(isTaskLevelGoalText('Establish reliable shelter for the group')).toBe(false);
    expect(isTaskLevelGoalText('Secure a sustainable food supply')).toBe(false);
    expect(isTaskLevelGoalText('Build enough trust to cooperate under pressure')).toBe(false);
  });
});
