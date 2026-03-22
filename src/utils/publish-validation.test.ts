import { describe, it, expect } from 'vitest';
import { hasPublishErrors, validateForPublish } from '@/utils/publish-validation';
import { createDefaultScenarioData, getHardcodedTestCharacters, now, uid } from '@/utils';
import { defaultContentThemes } from '@/types';

const buildValidPublishInput = () => {
  const scenario = createDefaultScenarioData();
  const [aiCharacter, userCharacter] = getHardcodedTestCharacters();

  scenario.world.core.scenarioName = 'Valid Story';
  scenario.world.core.briefDescription = 'A validated brief description.';
  scenario.world.core.storyPremise = 'A complete premise with stakes.';
  scenario.world.core.structuredLocations = [
    {
      id: uid('loc'),
      label: 'City Gate',
      description: 'A heavily guarded entrance to the capital.',
    },
  ];
  scenario.world.core.storyGoals = [
    {
      id: uid('goal'),
      title: 'Secure Alliance',
      desiredOutcome: 'Sign a pact before sunrise.',
      steps: [
        {
          id: uid('step'),
          description: 'Meet the envoy council.',
          completed: false,
        },
      ],
      flexibility: 'normal',
      createdAt: now(),
      updatedAt: now(),
    },
  ];

  scenario.story.openingDialog.text = 'A cold wind sweeps across the battlements.';
  scenario.characters = [
    {
      ...aiCharacter,
      id: uid('char'),
      name: 'Warden Elric',
      controlledBy: 'AI',
      age: '34',
      characterRole: 'Main',
    },
    {
      ...userCharacter,
      id: uid('char'),
      name: 'Commander Vale',
      controlledBy: 'User',
      age: '29',
      characterRole: 'Main',
    },
  ];

  const contentThemes = {
    ...defaultContentThemes,
    storyType: 'SFW' as const,
    characterTypes: ['Leader'],
    genres: ['Fantasy', 'Political'],
    origin: ['Original'],
    customTags: ['Intrigue'],
    triggerWarnings: [],
  };

  return {
    scenario,
    contentThemes,
    coverImage: 'https://example.com/cover.jpg',
  };
};

describe('publish-validation', () => {
  it('flags missing required publishing fields', () => {
    const scenario = createDefaultScenarioData();

    const errors = validateForPublish({
      scenarioTitle: scenario.world.core.scenarioName,
      world: scenario.world,
      characters: scenario.characters,
      openingDialog: scenario.story.openingDialog,
      contentThemes: defaultContentThemes,
      coverImage: '',
    });

    expect(hasPublishErrors(errors)).toBe(true);
    expect(errors.storyTitle).toBeTruthy();
    expect(errors.storyPremise).toBeTruthy();
    expect(errors.openingDialog).toBeTruthy();
    expect(errors.tags).toBeTruthy();
    expect(errors.storyType).toBeTruthy();
    expect(errors.noAICharacter).toBeTruthy();
    expect(errors.noUserCharacter).toBeTruthy();
    expect(errors.location).toBeTruthy();
    expect(errors.storyGoal).toBeTruthy();
    expect(errors.coverImage).toBeTruthy();
    expect(errors.briefDescription).toBeTruthy();
  });

  it('passes validation when required publish data is complete', () => {
    const { scenario, contentThemes, coverImage } = buildValidPublishInput();

    const errors = validateForPublish({
      scenarioTitle: scenario.world.core.scenarioName,
      world: scenario.world,
      characters: scenario.characters,
      openingDialog: scenario.story.openingDialog,
      contentThemes,
      coverImage,
    });

    expect(hasPublishErrors(errors)).toBe(false);
    expect(errors).toEqual({});
  });

  it('enforces NSFW age requirement per character', () => {
    const { scenario, contentThemes, coverImage } = buildValidPublishInput();

    const nsfwThemes = {
      ...contentThemes,
      storyType: 'NSFW' as const,
    };

    scenario.characters = scenario.characters.map((character) =>
      character.controlledBy === 'User'
        ? { ...character, age: '17' }
        : character
    );

    const errors = validateForPublish({
      scenarioTitle: scenario.world.core.scenarioName,
      world: scenario.world,
      characters: scenario.characters,
      openingDialog: scenario.story.openingDialog,
      contentThemes: nsfwThemes,
      coverImage,
    });

    expect(hasPublishErrors(errors)).toBe(true);
    expect(errors.characters).toBeTruthy();
    const characterErrorMessages = Object.values(errors.characters || {}).flat();
    expect(characterErrorMessages).toContain('Characters in NSFW stories must be 18+');
  });
});
