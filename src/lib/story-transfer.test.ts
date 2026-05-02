import { describe, it, expect } from 'vitest';
import {
  exportScenarioToJson,
  exportScenarioToText,
  exportScenarioToWordDocument,
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
      currentStatus: 'Envoys are still trying to secure a peace summit.',
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
  scenario.story.openingDialog.timeProgressionMode = 'automatic';
  scenario.story.openingDialog.timeProgressionInterval = 15;
  scenario.selectedArtStyle = 'dark-fantasy-oil';
  const baseUiSettings = scenario.uiSettings ?? createDefaultScenarioData().uiSettings!;
  scenario.uiSettings = {
    ...baseUiSettings,
    showBackgrounds: baseUiSettings.showBackgrounds,
    transparentBubbles: baseUiSettings.transparentBubbles,
    darkMode: baseUiSettings.darkMode,
    realismMode: true,
    proactiveNarrative: false,
    responseVerbosity: 'detailed',
  };
  scenario.contentThemes = {
    storyType: 'NSFW',
    characterTypes: ['Female', 'Male'],
    genres: ['Fantasy', 'Romance'],
    origin: ['Novel'],
    triggerWarnings: ['BDSM'],
    customTags: ['Snowbound cabin'],
  };
  scenario.world.entries = [
    {
      id: uid('codex'),
      title: 'Winter Notes',
      body: 'Keep the fire alive and ration food carefully.',
      createdAt: now(),
      updatedAt: now(),
    },
  ];
  scenario.scenes = [
    {
      id: uid('scene'),
      title: 'Cabin Exterior',
      url: 'https://example.com/scene-1.webp',
      tags: ['snow', 'cabin'],
      isStartingScene: true,
      createdAt: now(),
    },
  ];
  scenario.sideCharacters = [
    {
      id: uid('side'),
      name: 'Watcher',
      nicknames: '',
      age: 'Unknown',
      sexType: 'Male',
      sexualOrientation: '',
      location: 'Treeline',
      currentMood: 'Silent',
      controlledBy: 'AI',
      characterRole: 'Side',
      roleDescription: 'A shadowy observer in the storm.',
      physicalAppearance: { ...aiCharacter.physicalAppearance },
      currentlyWearing: { ...aiCharacter.currentlyWearing },
      preferredClothing: { ...aiCharacter.preferredClothing },
      background: {
        relationshipStatus: '',
        residence: '',
        educationLevel: '',
      },
      personality: {
        traits: ['patient'],
        miscellaneous: '',
        secrets: '',
        fears: '',
        kinksFantasies: '',
        desires: '',
      },
      sections: [],
      avatarDataUrl: 'https://example.com/side-character.png',
      avatarPosition: { x: 50, y: 50 },
      firstMentionedIn: 'conv-1',
      extractedTraits: [],
      createdAt: now(),
      updatedAt: now(),
    },
  ];
  scenario.conversations = [
    {
      id: uid('conv'),
      title: 'Session 1',
      messages: [
        {
          id: uid('msg'),
          role: 'assistant',
          text: 'The snow keeps falling.',
          createdAt: now(),
        },
      ],
      currentDay: 1,
      currentTimeOfDay: 'sunset',
      timeProgressionMode: 'automatic',
      timeProgressionInterval: 15,
      createdAt: now(),
      updatedAt: now(),
    },
  ];
  scenario.characters = [
    {
      ...aiCharacter,
      controlledBy: 'AI',
      characterRole: 'Main',
      name: 'Captain Rowan',
      scenePosition: 'Braced beside the gate',
      tags: 'captain, guard, winter campaign',
      avatarDataUrl: 'https://example.com/captain-rowan.png',
      avatarPosition: { x: 42, y: 28 },
      sections: [],
      personality: {
        splitMode: false,
        traits: [
          {
            id: uid('ptrait'),
            label: 'Steady under pressure',
            value: '',
            flexibility: 'normal',
          },
        ],
        outwardTraits: [],
        inwardTraits: [],
      },
      tone: { _extras: [] },
      keyLifeEvents: { _extras: [] },
      relationships: { _extras: [] },
      secrets: { _extras: [] },
      fears: {
        _extras: [
          {
            id: uid('fear'),
            label: 'Failing the city',
            value: '',
          },
        ],
      },
      goals: [
        {
          id: uid('cgoal'),
          title: 'Keep the peace',
          desiredOutcome: '',
          currentStatus: 'Patrols are stretched thin across the capital.',
          progress: 0,
          flexibility: 'normal',
          steps: [],
          createdAt: now(),
          updatedAt: now(),
        },
      ],
    },
    {
      ...userCharacter,
      controlledBy: 'User',
      characterRole: 'Main',
      name: 'Envoy Mira',
      sections: [],
    },
  ];

  return scenario;
};

const buildExportOptions = (scenario: ReturnType<typeof buildScenario>) => ({
  coverImage: 'https://example.com/covers/chronicle-test-story.webp',
  coverImagePosition: { x: 38, y: 34 },
  contentThemes: scenario.contentThemes,
});

describe('story-transfer import/export', () => {
  it('exports markdown text with expected Chronicle sections', () => {
    const scenario = buildScenario();
    const text = exportScenarioToText(scenario, buildExportOptions(scenario));

    expect(text).toContain('# Story Builder');
    expect(text).toContain('- Story Card');
    expect(text).toContain('- Structured Locations');
    expect(text).toContain('- Blackwood Keep: An old fortress overlooking the capital.');
    expect(text).toContain('- Story Goals');
    expect(text).toContain('- Current Status: Envoys are still trying to secure a peace summit.');
    expect(text).toContain('- World Codex');
    expect(text).toContain('- Entry: Winter Notes');
    expect(text).toContain('- Content Themes');
    expect(text).toContain('- Story Type: NSFW');
    expect(text).toContain('- BDSM: Incorporate BDSM dynamics');
    expect(text).toContain('- Builder Assets');
    expect(text).toContain('- Cover Image: https://example.com/covers/chronicle-test-story.webp');
    expect(text).toContain('- Selected Art Style: dark-fantasy-oil');
    expect(text).toContain('# Characters');
    expect(text).toContain('# Character: Captain Rowan');
    expect(text).toContain('- Steady under pressure:');
    expect(text).toContain('- Failing the city:');
    expect(text).toContain('- Current Status: Patrols are stretched thin across the capital.');
    expect(text).toContain('- Tags: captain, guard, winter campaign');
    expect(text).toContain('- Avatar Image: https://example.com/captain-rowan.png');
    expect(text).toContain('- Time Progression Mode: automatic');
    expect(text).toContain('- Time Progression Interval: 15');
    expect(text).toContain('BEGIN CHRONICLE MACHINE DATA');
  });

  it('exports word text with the same canonical sections and label-only rows', () => {
    const scenario = buildScenario();
    const rtf = exportScenarioToWordDocument(scenario, buildExportOptions(scenario));

    expect(rtf).toContain('Structured Locations');
    expect(rtf).toContain('Blackwood Keep: An old fortress overlooking the capital.');
    expect(rtf).toContain('Story Goals');
    expect(rtf).toContain('World Codex');
    expect(rtf).toContain('Winter Notes');
    expect(rtf).toContain('Content Themes');
    expect(rtf).toContain('Selected Art Style: dark-fantasy-oil');
    expect(rtf).toContain('Current Status: Envoys are still trying to secure a peace summit.');
    expect(rtf).toContain('Steady under pressure:');
    expect(rtf).toContain('Failing the city:');
    expect(rtf).toContain('Time Progression Mode: automatic');
    expect(rtf).toContain('Time Progression Interval: 15');
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
    const exportedJson = exportScenarioToJson(source, buildExportOptions(source));

    const imported = importScenarioFromAny(
      { text: exportedJson, fileName: 'story-transfer.json', mimeType: 'application/json' },
      createDefaultScenarioData(),
      'rewrite'
    );

    expect(imported.data.world.core.scenarioName).toBe(source.world.core.scenarioName);
    expect(imported.data.world.core.storyPremise).toBe(source.world.core.storyPremise);
    expect(imported.data.world.core.storyGoals?.[0]?.currentStatus).toBe(source.world.core.storyGoals?.[0]?.currentStatus);
    expect(imported.data.world.entries?.[0]?.title).toBe(source.world.entries?.[0]?.title);
    expect(imported.data.contentThemes).toEqual(source.contentThemes);
    expect(imported.data.selectedArtStyle).toBe(source.selectedArtStyle);
    expect(imported.data.uiSettings?.responseVerbosity).toBe(source.uiSettings?.responseVerbosity);
    expect(imported.data.story.openingDialog.timeProgressionMode).toBe(source.story.openingDialog.timeProgressionMode);
    expect(imported.data.story.openingDialog.timeProgressionInterval).toBe(source.story.openingDialog.timeProgressionInterval);
    expect(imported.data.scenes?.[0]?.url).toBe(source.scenes?.[0]?.url);
    expect(imported.data.sideCharacters?.[0]?.name).toBe(source.sideCharacters?.[0]?.name);
    expect(imported.data.conversations?.[0]?.title).toBe(source.conversations?.[0]?.title);
    expect(imported.data.characters.length).toBe(2);
    const importedNames = imported.data.characters.map((character) => character.name);
    expect(importedNames).toContain('Captain Rowan');
    expect(importedNames).toContain('Envoy Mira');
    const importedCaptain = imported.data.characters.find((character) => character.name === 'Captain Rowan');
    expect(importedCaptain?.tags).toBe('captain, guard, winter campaign');
    expect(importedCaptain?.scenePosition).toBe('Braced beside the gate');
    expect(importedCaptain?.avatarDataUrl).toBe('https://example.com/captain-rowan.png');
    expect(imported.editorState?.coverImage).toBe('https://example.com/covers/chronicle-test-story.webp');
    expect(imported.editorState?.coverImagePosition).toEqual({ x: 38, y: 34 });
  });

  it('round-trips markdown export without losing label-only rows or story-level sections', () => {
    const source = buildScenario();
    const exported = exportScenarioToText(source, buildExportOptions(source));
    const base = createDefaultScenarioData();
    base.characters = [];

    const imported = importScenarioFromAny(
      { text: exported, fileName: 'story-transfer.md', mimeType: 'text/markdown' },
      base,
      'rewrite'
    );
    const importedCaptain = imported.data.characters.find((character) => character.name === 'Captain Rowan');

    expect(imported.data.world.core.structuredLocations?.[0]?.label).toBe('Blackwood Keep');
    expect(imported.data.world.core.storyGoals?.[0]?.title).toBe('Stabilize the Realm');
    expect(imported.data.world.core.storyGoals?.[0]?.currentStatus).toBe('Envoys are still trying to secure a peace summit.');
    expect(imported.data.contentThemes?.storyType).toBe('NSFW');
    expect(imported.data.world.entries?.[0]?.title).toBe('Winter Notes');
    expect(imported.data.scenes?.[0]?.title).toBe('Cabin Exterior');
    expect(imported.data.selectedArtStyle).toBe('dark-fantasy-oil');
    expect(importedCaptain?.personality?.traits?.[0]?.label).toBe('Steady under pressure');
    expect(importedCaptain?.fears?._extras?.[0]?.label).toBe('Failing the city');
    expect(importedCaptain?.tags).toBe('captain, guard, winter campaign');
    expect(imported.editorState?.coverImage).toBe('https://example.com/covers/chronicle-test-story.webp');
  });
});
