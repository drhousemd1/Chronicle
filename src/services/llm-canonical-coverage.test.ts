import { describe, expect, it } from 'vitest';

import { getSystemInstruction } from '@/services/llm';
import { createDefaultScenarioData, getHardcodedTestCharacters, now, uid } from '@/utils';

describe('llm canonical prompt coverage', () => {
  it('serializes canonical story + character authored fields, including custom/freeform values', () => {
    const appData = createDefaultScenarioData();
    const [aiCharacter, userCharacter] = getHardcodedTestCharacters();

    aiCharacter.name = 'Tamlin';
    aiCharacter.controlledBy = 'AI';
    aiCharacter.characterRole = 'Main';
    aiCharacter.age = '27';
    aiCharacter.roleDescription = 'High fae ruler trying to protect his court.';
    aiCharacter.physicalAppearance = {
      ...aiCharacter.physicalAppearance,
      hairColor: 'Golden',
      eyeColor: 'Green',
      build: 'Athletic',
      _extras: [{ id: uid('extra'), label: 'Distinct Mark', value: 'Golden mask scars' }],
    };
    aiCharacter.currentlyWearing = {
      ...aiCharacter.currentlyWearing,
      top: 'Green tunic',
      bottom: 'Dark trousers',
      _extras: [{ id: uid('extra'), label: 'Accessory', value: 'Court signet ring' }],
    };
    aiCharacter.preferredClothing = {
      ...aiCharacter.preferredClothing,
      casual: 'Simple linen shirt',
      work: 'Regal court attire',
      _extras: [{ id: uid('extra'), label: 'Cape', value: 'Emerald travel cape' }],
    };
    (aiCharacter as any).background = {
      ...aiCharacter.background,
      residence: 'Spring Court manor',
      motivation: 'Keep his people safe',
      _extras: [{ id: uid('extra'), label: 'Legacy', value: 'Inherited ancient obligations' }],
    };
    aiCharacter.tone = {
      _extras: [{ id: uid('extra'), label: 'Voice', value: 'Measured and restrained' }],
    };
    aiCharacter.sections = [
      {
        id: uid('sec'),
        title: 'Kinks',
        items: [],
        freeformValue: 'Control dynamics and slow-burn teasing.',
        createdAt: now(),
        updatedAt: now(),
      },
    ];
    aiCharacter.goals = [
      {
        id: uid('goal'),
        title: 'Protect Feyre',
        desiredOutcome: 'Keep her away from political threats.',
        currentStatus: 'Actively watching court movements.',
        flexibility: 'normal',
        steps: [
          { id: uid('step'), description: 'Assign palace guards', completed: true },
        ],
        createdAt: now(),
        updatedAt: now(),
      },
    ];

    userCharacter.name = 'Feyre';
    userCharacter.controlledBy = 'User';
    userCharacter.characterRole = 'Main';

    appData.characters = [aiCharacter, userCharacter];
    appData.world.core.scenarioName = "Ashley's Secret";
    appData.world.core.briefDescription = 'A tense romance under political pressure.';
    appData.world.core.storyPremise = 'Two courts negotiate peace while private desires threaten alliances.';
    appData.world.core.structuredLocations = [
      { id: uid('loc'), label: 'Spring Court', description: 'Palace with hidden corridors.' },
    ];
    appData.world.core.dialogFormatting = 'Keep dialogue elegant and concise.';
    appData.world.core.customWorldSections = [
      {
        id: uid('wsec'),
        title: 'Political Stakes',
        items: [{ id: uid('witem'), label: 'Treaty', value: 'One breach means war.' }],
      },
      {
        id: uid('wsec'),
        title: 'Atmosphere',
        items: [],
        type: 'freeform',
        freeformValue: 'Moonlit dread with restrained courtly etiquette.',
      },
    ];
    appData.world.core.storyGoals = [
      {
        id: uid('sgoal'),
        title: 'Secure lasting peace',
        desiredOutcome: 'Both courts ratify treaty without bloodshed.',
        currentStatus: 'Negotiations stalled by mistrust.',
        flexibility: 'normal',
        steps: [{ id: uid('sstep'), description: 'Hold midnight summit', completed: false }],
        createdAt: now(),
        updatedAt: now(),
      },
    ];

    appData.scenes = [
      {
        id: uid('scene'),
        url: 'https://example.com/scene.jpg',
        tags: ['palace', 'night'],
        isStartingScene: true,
        title: 'Balcony Summit',
        createdAt: now(),
      },
    ];

    const prompt = getSystemInstruction(appData, 4, 'night', [], true, appData.scenes[0]);

    expect(prompt).toContain("STORY NAME: Ashley's Secret");
    expect(prompt).toContain('BRIEF DESCRIPTION: A tense romance under political pressure.');
    expect(prompt).toContain('STORY PREMISE: Two courts negotiate peace while private desires threaten alliances.');
    expect(prompt).toContain('LOCATIONS:');
    expect(prompt).toContain('- Spring Court: Palace with hidden corridors.');
    expect(prompt).toContain('CUSTOM WORLD CONTENT:');
    expect(prompt).toContain('Treaty: One breach means war.');
    expect(prompt).toContain('Moonlit dread with restrained courtly etiquette.');

    expect(prompt).toContain('Goal: "Secure lasting peace"');
    expect(prompt).toContain('Current Status: Negotiations stalled by mistrust.');

    expect(prompt).toContain('CHARACTER: Tamlin');
    expect(prompt).toContain('AGE: 27');
    expect(prompt).toContain('ROLE DESCRIPTION: High fae ruler trying to protect his court.');
    expect(prompt).toContain('PHYSICAL APPEARANCE:');
    expect(prompt).toContain('Hair Color: Golden');
    expect(prompt).toContain('CURRENTLY WEARING:');
    expect(prompt).toContain('Top: Green tunic');
    expect(prompt).toContain('PREFERRED CLOTHING:');
    expect(prompt).toContain('Casual: Simple linen shirt');
    expect(prompt).toContain('CUSTOM TRAITS / CUSTOM CONTENT:');
    expect(prompt).toContain('Control dynamics and slow-burn teasing.');
    expect(prompt).toContain('Current Status: Actively watching court movements.');

    expect(prompt).toContain('ACTIVE SCENE CONTEXT:');
    expect(prompt).toContain('- Scene Title: Balcony Summit');
    expect(prompt).toContain('- Active Scene Tag: palace');
  });
});
