import { describe, expect, it } from 'vitest';

import { __testables as characterPromptTestables } from '@/services/character-ai';
import {
  __testables as worldPromptTestables,
  parseWorldGenerateBothResponse,
  WORLD_GENERATE_BOTH_PREFIX,
} from '@/services/world-ai';
import { createDefaultScenarioData, getHardcodedTestCharacters, now } from '@/utils';

describe('field enhancement prompt coverage', () => {
  it('keeps character row enhancement anchored to an existing label and includes full scenario guidance', () => {
    const scenario = createDefaultScenarioData();
    scenario.characters = getHardcodedTestCharacters();
    scenario.world.core.scenarioName = 'Lost';
    scenario.world.core.briefDescription = 'Three stranded survivors are trapped in a snowed-in cabin.';
    scenario.world.core.storyPremise = 'A freak blizzard isolates the group and turns every secret into pressure.';
    scenario.contentThemes = {
      storyType: 'NSFW',
      characterTypes: ['Multiple'],
      genres: ['Fantasy', 'Romance'],
      origin: ['Novel'],
      triggerWarnings: ['Coercion / Manipulation'],
      customTags: ['Secret baby'],
    };
    scenario.story.openingDialog.text = 'Sarah: *She bars the door against the storm.* "Nobody goes outside tonight."';
    scenario.world.entries = [
      {
        id: 'entry-1',
        title: 'Cabin Lore',
        body: 'The abandoned cabin used to shelter hunters who vanished in the first deep freeze.',
        createdAt: now(),
        updatedAt: now(),
      },
    ];
    scenario.scenes = [
      {
        id: 'scene-1',
        url: 'https://example.com/scene.png',
        title: 'Cabin Exterior',
        tags: ['snow', 'cabin'],
        createdAt: now(),
      },
    ];

    const target = {
      ...scenario.characters[0],
      fears: {
        _extras: [
          {
            id: 'fear-1',
            label: "Ashley's intersex status being discovered",
            value: '',
          },
        ],
      },
    };

    const fullContext = characterPromptTestables.buildFullContext(scenario, target.id);
    expect(fullContext).toContain('Prompt Guidance Derived From Selected Tags');
    expect(fullContext).toContain('Opening Dialog');
    expect(fullContext).toContain('Additional Lore Entries');
    expect(fullContext).toContain('Scene References');

    const selfContext = characterPromptTestables.buildCharacterSelfContext(target);
    expect(selfContext).toContain("Ashley's intersex status being discovered: (description empty)");

    const prompt = characterPromptTestables.buildCharacterFieldPrompt(
      'extra_fear_fear-1',
      '',
      fullContext,
      selfContext,
      "Ashley's intersex status being discovered",
      'detailed'
    );

    expect(prompt).toContain('SPECIFIC SUBJECT TO EXPAND');
    expect(prompt).toContain("Ashley's intersex status being discovered");
    expect(prompt).toContain('Do not rename it, contradict it, or drift to a different concept');
  });

  it('builds story/world enhancement prompts with character roster, tag directives, and row-specific subject context', () => {
    const scenario = createDefaultScenarioData();
    scenario.characters = getHardcodedTestCharacters();
    scenario.world.core.scenarioName = 'Lost';
    scenario.world.core.briefDescription = 'A blizzard traps the cast in one isolated location.';
    scenario.world.core.storyPremise = 'The cabin becomes a pressure cooker for survival, lust, and betrayal.';
    scenario.world.core.structuredLocations = [
      { id: 'loc-1', label: 'Cabin', description: 'A cramped lakeside shelter sealed by storm ice.' },
    ];
    scenario.world.core.storyGoals = [
      {
        id: 'goal-1',
        title: 'Survive the storm',
        desiredOutcome: 'Make it to sunrise with everyone alive.',
        currentStatus: 'The door is barely holding.',
        steps: [{ id: 'step-1', description: 'Reinforce the cabin before midnight.', completed: false }],
        flexibility: 'normal',
        createdAt: now(),
        updatedAt: now(),
      },
    ];
    scenario.contentThemes = {
      storyType: 'NSFW',
      characterTypes: ['Multiple'],
      genres: ['Romance'],
      origin: ['Original'],
      triggerWarnings: ['Isolation Control'],
      customTags: ['Forced proximity'],
    };
    scenario.story.openingDialog.text = 'James: *Snow hammers the shutters as he braces the table against the door.*';
    scenario.world.entries = [
      {
        id: 'entry-1',
        title: 'Weather Pattern',
        body: 'The storm intensifies after sunset and distorts sound around the tree line.',
        createdAt: now(),
        updatedAt: now(),
      },
    ];

    const context = {
      worldCore: scenario.world.core,
      openingDialog: scenario.story.openingDialog,
      characters: scenario.characters,
      entries: scenario.world.entries,
      contentThemes: scenario.contentThemes,
    };

    const prompt = worldPromptTestables.buildPrompt(
      'storyGoalOutcome',
      '',
      context,
      'Desired Outcome for story goal: Survive the storm',
      'detailed'
    );

    expect(prompt).toContain('Character Roster');
    expect(prompt).toContain('Prompt Guidance Derived From Selected Tags');
    expect(prompt).toContain('Opening Dialog');
    expect(prompt).toContain('SPECIFIC SUBJECT TO EXPAND');
    expect(prompt).toContain('Desired Outcome for story goal: Survive the storm');
  });

  it('supports generate-both story prompts for empty structured world rows', () => {
    const scenario = createDefaultScenarioData();
    const context = {
      worldCore: scenario.world.core,
      openingDialog: scenario.story.openingDialog,
      characters: scenario.characters,
      entries: scenario.world.entries,
      contentThemes: scenario.contentThemes,
    };

    const prompt = worldPromptTestables.buildPrompt(
      'worldCustomField',
      '',
      context,
      `${WORLD_GENERATE_BOTH_PREFIX}custom world field for Political Stakes`
    );

    expect(prompt).toContain('generate BOTH a short label/name AND a description');
    expect(prompt).toContain('LABEL: <your label here>');
    expect(prompt).toContain('DESCRIPTION: <your description here>');

    expect(
      parseWorldGenerateBothResponse('Power Vacuum\n---SPLIT---\nThe old lord is dead, and every household is circling for leverage.')
    ).toEqual({
      label: 'Power Vacuum',
      value: 'The old lord is dead, and every household is circling for leverage.',
    });
  });
});
