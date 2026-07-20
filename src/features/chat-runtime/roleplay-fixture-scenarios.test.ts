import { describe, expect, it } from 'vitest';

import { createRoleplayFixtureScenario } from './roleplay-fixture-scenarios';

describe('createRoleplayFixtureScenario', () => {
  it('builds a reusable scenario with every required regression category', () => {
    const scenario = createRoleplayFixtureScenario({
      id: 'fixture-coverage',
      sideCharacterCount: 12,
      currentDay: 4,
    });

    expect(scenario.characters).toHaveLength(14);
    expect(scenario.characters.filter((character) => character.role === 'main')).toHaveLength(2);
    expect(scenario.characters.filter((character) => character.origin === 'prebuilt_side')).toHaveLength(11);
    expect(scenario.characters.filter((character) => character.origin === 'dynamic_side')).toHaveLength(1);
    expect(scenario.characters.some((character) => character.location === undefined)).toBe(true);
    expect(scenario.characterCards).toHaveLength(14);
    expect(scenario.characterCards.every((card) => card.facts.length >= 10)).toBe(true);
    expect(scenario.characterCards.every((card) => (
      card.facts.some((fact) => fact.modelFacing)
      && card.facts.some((fact) => !fact.modelFacing)
    ))).toBe(true);
    expect(scenario.goals.map((goal) => goal.status)).toEqual(['open', 'open', 'completed']);
    expect(scenario.messages).toEqual(expect.arrayContaining([
      expect.objectContaining({ role: 'assistant', accepted: false, superseded: true }),
      expect.objectContaining({ role: 'assistant', accepted: true }),
    ]));
    expect(scenario.generationChains).toEqual([
      expect.objectContaining({ kind: 'retry', sourceGenerationId: 'generation-assistant-rejected' }),
      expect.objectContaining({ kind: 'continue', sourceGenerationId: 'generation-assistant-current' }),
    ]);
    expect(scenario.memories).toEqual(expect.arrayContaining([
      expect.objectContaining({ durable: true }),
      expect.objectContaining({ durable: false }),
    ]));
    expect(scenario.snapshots).toEqual(expect.arrayContaining([
      expect.objectContaining({ accepted: true }),
      expect.objectContaining({ accepted: false }),
    ]));
    expect(new Set(scenario.supportResults.map((result) => result.disposition))).toEqual(
      new Set(['accepted', 'stale', 'rejected', 'persistence_failed']),
    );
    expect(scenario.dayTransitions).toEqual([
      expect.objectContaining({ fromDay: 3, toDay: 4 }),
    ]);
    expect(scenario.messages.find((message) => message.id === 'message-user-latest')?.text)
      .toContain(`(${scenario.privatePlayerText})`);
  });

  it('never produces fewer than two side characters', () => {
    const scenario = createRoleplayFixtureScenario({ sideCharacterCount: 0 });
    expect(scenario.characters.filter((character) => character.role === 'side')).toHaveLength(2);
    expect(scenario.characters.at(-1)?.origin).toBe('dynamic_side');
  });
});
