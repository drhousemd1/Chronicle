import { describe, expect, it } from 'vitest';
import {
  applyGoalAlignmentEvaluation,
  describeGoalAlignmentForPrompt,
  formatGoalAlignmentChange,
  normalizeGoalAlignmentState,
  shouldRenderGoalToWriter,
} from './goal-alignment';

describe('goal-alignment scoring', () => {
  it('moves flexible goals more aggressively than rigid goals', () => {
    const rigid = applyGoalAlignmentEvaluation(
      { goalId: 'g1', goalKind: 'story' },
      { goalId: 'g1', goalKind: 'story', signal: 'resistance', intensity: 3 },
      'rigid',
    );
    const flexible = applyGoalAlignmentEvaluation(
      { goalId: 'g1', goalKind: 'story' },
      { goalId: 'g1', goalKind: 'story', signal: 'resistance', intensity: 3 },
      'flexible',
    );

    expect(rigid.score).toBe(44);
    expect(flexible.score).toBe(30);
    expect(rigid.status).toBe('resisted');
    expect(flexible.status).toBe('resisted');
  });

  it('drops flexible goals after repeated strong resistance but does not drop rigid goals', () => {
    let flexible = normalizeGoalAlignmentState({ goalId: 'g1', goalKind: 'story' });
    for (let i = 0; i < 3; i += 1) {
      flexible = applyGoalAlignmentEvaluation(
        flexible,
        { goalId: 'g1', goalKind: 'story', signal: 'resistance', intensity: 3 },
        'flexible',
      );
    }

    let rigid = normalizeGoalAlignmentState({ goalId: 'g1', goalKind: 'story' });
    for (let i = 0; i < 8; i += 1) {
      rigid = applyGoalAlignmentEvaluation(
        rigid,
        { goalId: 'g1', goalKind: 'story', signal: 'resistance', intensity: 3 },
        'rigid',
      );
    }

    expect(flexible.status).toBe('dropped');
    expect(shouldRenderGoalToWriter(flexible, 'flexible')).toBe(false);
    expect(rigid.status).not.toBe('dropped');
    expect(shouldRenderGoalToWriter(rigid, 'rigid')).toBe(true);
  });

  it('drops normal goals only after sustained strong negative evidence', () => {
    let normal = normalizeGoalAlignmentState({ goalId: 'g1', goalKind: 'story' });
    for (let i = 0; i < 4; i += 1) {
      normal = applyGoalAlignmentEvaluation(
        normal,
        { goalId: 'g1', goalKind: 'story', signal: 'resistance', intensity: 3 },
        'normal',
      );
    }

    expect(normal.score).toBe(0);
    expect(normal.status).toBe('resisted');
    expect(shouldRenderGoalToWriter(normal, 'normal')).toBe(true);

    normal = applyGoalAlignmentEvaluation(
      normal,
      { goalId: 'g1', goalKind: 'story', signal: 'resistance', intensity: 3 },
      'normal',
    );

    expect(normal.status).toBe('dropped');
    expect(shouldRenderGoalToWriter(normal, 'normal')).toBe(false);
  });

  it('does not move score or counters for neutral and not-applicable evaluations', () => {
    let state = normalizeGoalAlignmentState({ goalId: 'g1', goalKind: 'story' });
    state = applyGoalAlignmentEvaluation(
      state,
      { goalId: 'g1', goalKind: 'story', signal: 'neutral', intensity: 3 },
      'normal',
    );
    state = applyGoalAlignmentEvaluation(
      state,
      { goalId: 'g1', goalKind: 'story', signal: 'not_applicable', intensity: 3 },
      'normal',
    );

    expect(state.score).toBe(50);
    expect(state.supportCount).toBe(0);
    expect(state.resistanceCount).toBe(0);
    expect(state.driftCount).toBe(0);
    expect(state.status).toBe('active');
  });

  it('lets user support revive a dropped non-rigid goal back into writer guidance', () => {
    let flexible = normalizeGoalAlignmentState({ goalId: 'g1', goalKind: 'story' });
    for (let i = 0; i < 3; i += 1) {
      flexible = applyGoalAlignmentEvaluation(
        flexible,
        { goalId: 'g1', goalKind: 'story', signal: 'resistance', intensity: 3 },
        'flexible',
      );
    }

    expect(flexible.status).toBe('dropped');
    expect(shouldRenderGoalToWriter(flexible, 'flexible')).toBe(false);

    flexible = applyGoalAlignmentEvaluation(
      flexible,
      { goalId: 'g1', goalKind: 'story', signal: 'support', intensity: 3 },
      'flexible',
    );

    expect(flexible.status).toBe('dormant');
    expect(shouldRenderGoalToWriter(flexible, 'flexible')).toBe(true);
  });

  it('keeps the prior cumulative state as a rollback snapshot for regenerated turns', () => {
    const previous = applyGoalAlignmentEvaluation(
      { goalId: 'g1', goalKind: 'story' },
      { goalId: 'g1', goalKind: 'story', signal: 'support', intensity: 3 },
      'normal',
      { sourceMessageId: 'message-a', sourceGenerationId: 'generation-a' },
    );

    const next = applyGoalAlignmentEvaluation(
      previous,
      { goalId: 'g1', goalKind: 'story', signal: 'resistance', intensity: 3 },
      'normal',
      { sourceMessageId: 'message-b', sourceGenerationId: 'generation-b' },
    );

    expect(next.score).toBe(48);
    expect(next.previousState?.score).toBe(61);
    expect(next.previousState?.status).toBe('supported');
    expect(next.previousState?.sourceMessageId).toBe('message-a');
    expect(next.previousState?.sourceGenerationId).toBe('generation-a');
    expect(formatGoalAlignmentChange(next, 'Story goal "Trust"')).toContain('score 61/100 -> 48/100');
    expect(formatGoalAlignmentChange(next, 'Story goal "Trust"')).toContain('supported -> resisted');
  });

  it('tracks drift separately from direct resistance', () => {
    const state = applyGoalAlignmentEvaluation(
      { goalId: 'g1', goalKind: 'story' },
      { goalId: 'g1', goalKind: 'story', signal: 'drift', intensity: 2 },
      'normal',
    );

    expect(state.score).toBe(46);
    expect(state.driftCount).toBe(1);
    expect(state.resistanceCount).toBe(0);
    expect(state.status).toBe('drifting');
    expect(state.trend).toBe('falling');
  });

  it('renders compact writer-facing alignment guidance', () => {
    const state = applyGoalAlignmentEvaluation(
      { goalId: 'g1', goalKind: 'character' },
      {
        goalId: 'g1',
        goalKind: 'character',
        signal: 'support',
        intensity: 3,
        rationale: 'The user accepted the character pushing the relationship further.',
      },
      'normal',
    );

    expect(describeGoalAlignmentForPrompt(state, 'normal')).toContain('supported');
    expect(describeGoalAlignmentForPrompt(state, 'normal')).toContain('score 61/100');
  });
});
