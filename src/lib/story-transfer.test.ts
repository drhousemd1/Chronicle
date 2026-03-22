import { describe, it, expect } from 'vitest';
import {
  exportScenarioToJson,
  exportScenarioToText,
  importScenarioFromAny,
} from '@/lib/story-transfer';
import { createDefaultScenarioData, getHardcodedTestCharacters, now, uid } from '@/utils';

const buildScenario = () => {
  const scenario = createDefaultScenarioData();
  const [aiCharacter, userCharacter] = getHardcodedTestCharacters();

  scenario.world.core.scenarioName = 'Chronicle Test Story';
  scenario.world.core.briefDescription = 'A concise summary of the scenario.';
  scenario.world.core.storyPremise = 'A kingdom on the brink of civil war.';
  scenario.world.core.structuredLocations = [
    {
      id: uid('loc'),
      label: 'Blackwood Keep',
      description: 'An old fortress overlooking the capital.',
    },
  ];
  scenario.world.core.storyGoals = [
    {
      id: uid('goal'),
      title: 'Stabilize the Realm',
      desiredOutcome: 'Broker peace between rival factions.',
      steps: [
        {
          id: uid('step'),
          description: 'Secure an audience with both houses.',
          completed: false,
        },
      ],
      flexibility: 'normal',
      createdAt: now(),
      updatedAt: now(),
    },
  ];
  scenario.story.openingDialog.text = 'The city bells ring at dawn as unrest spreads.';
  scenario.characters = [
    {
      ...aiCharacter,
      controlledBy: 'AI',
      characterRole: 'Main',
      name: 'Captain Rowan',
    },
    {
      ...userCharacter,
      controlledBy: 'User',
      characterRole: 'Main',
      name: 'Envoy Mira',
    },
  ];

  return scenario;
};

describe('story-transfer import/export', () => {
  it('exports markdown text with expected Chronicle sections', () => {
    const text = exportScenarioToText(buildScenario());

    expect(text).toContain('# Story Builder');
    expect(text).toContain('- Story Card');
    expect(text).toContain('# Characters');
    expect(text).toContain('# Character: Captain Rowan');
    expect(text).not.toContain('BEGIN CHRONICLE MACHINE DATA');
  });

  it('merge import keeps existing scalar fields and appends rich text fields', () => {
    const base = buildScenario();
    base.world.core.scenarioName = 'Existing Title';
    base.world.core.briefDescription = 'Existing brief';

    const incoming = [
      '# Story Builder',
      '# Story Card',
      '- Story Name: Incoming Title',
      '- Brief Description: Incoming brief',
    ].join('\n');

    const result = importScenarioFromAny({ text: incoming, fileName: 'merge.md' }, base, 'merge');

    expect(result.data.world.core.scenarioName).toBe('Existing Title');
    expect(result.data.world.core.briefDescription).toContain('Existing brief');
    expect(result.data.world.core.briefDescription).toContain('Incoming brief');
  });

  it('rewrite import replaces existing scalar and rich text fields', () => {
    const base = buildScenario();
    base.world.core.scenarioName = 'Old Title';
    base.world.core.briefDescription = 'Old brief';

    const incoming = [
      '# Story Builder',
      '# Story Card',
      '- Story Name: New Title',
      '- Brief Description: New brief',
    ].join('\n');

    const result = importScenarioFromAny({ text: incoming, fileName: 'rewrite.md' }, base, 'rewrite');

    expect(result.data.world.core.scenarioName).toBe('New Title');
    expect(result.data.world.core.briefDescription).toBe('New brief');
  });

  it('round-trips JSON export into scenario data using importScenarioFromAny', () => {
    const source = buildScenario();
    const exportedJson = exportScenarioToJson(source);

    const imported = importScenarioFromAny(
      { text: exportedJson, fileName: 'story-transfer.json', mimeType: 'application/json' },
      createDefaultScenarioData(),
      'rewrite'
    );

    expect(imported.data.world.core.scenarioName).toBe(source.world.core.scenarioName);
    expect(imported.data.world.core.storyPremise).toBe(source.world.core.storyPremise);
    expect(imported.data.characters.length).toBe(2);
    const importedNames = imported.data.characters.map((character) => character.name);
    expect(importedNames).toContain('Captain Rowan');
    expect(importedNames).toContain('Envoy Mira');
  });
});
