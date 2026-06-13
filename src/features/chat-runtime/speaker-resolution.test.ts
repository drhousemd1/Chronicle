import { describe, expect, it } from 'vitest';

import type { Character, ScenarioData } from '@/types';
import {
  defaultCurrentlyWearing,
  defaultPhysicalAppearance,
  defaultPreferredClothing,
} from '@/types';
import {
  buildEditableMessageSegments,
  buildInlineEditedMessageText,
  extractHiddenMessageTags,
  mergeByRenderedSpeaker,
} from './speaker-resolution';

const baseCharacter = (patch: Partial<Character>): Character => ({
  id: patch.id || 'char-1',
  name: patch.name || 'Ashley',
  nicknames: patch.nicknames || '',
  age: '',
  sexType: '',
  sexualOrientation: '',
  location: '',
  currentMood: '',
  controlledBy: patch.controlledBy || 'AI',
  characterRole: patch.characterRole || 'Main',
  roleDescription: '',
  tags: '',
  avatarDataUrl: '',
  physicalAppearance: patch.physicalAppearance || { ...defaultPhysicalAppearance },
  currentlyWearing: patch.currentlyWearing || { ...defaultCurrentlyWearing },
  preferredClothing: patch.preferredClothing || { ...defaultPreferredClothing },
  sections: [],
  createdAt: 1,
  updatedAt: 1,
  ...patch,
});

const scenario: ScenarioData = {
  version: 1,
  characters: [
    baseCharacter({ id: 'ashley', name: 'Ashley', nicknames: 'Ash', controlledBy: 'AI' }),
    baseCharacter({ id: 'james', name: 'James', controlledBy: 'User' }),
  ],
  sideCharacters: [],
  world: {
    core: {
      scenarioName: '',
      briefDescription: '',
      storyPremise: '',
      dialogFormatting: '',
    },
    entries: [],
  },
  story: { openingDialog: { enabled: false, text: '', startingDay: 1, startingTimeOfDay: 'day' } },
  scenes: [],
  conversations: [],
};

describe('chat speaker resolution helpers', () => {
  it('extracts hidden system tags and restores them before edited visible text', () => {
    const text = '[SCENE: Kitchen]\n[UPDATE: mood=tense]\n\nAshley: "Stay here."';

    expect(extractHiddenMessageTags(text)).toEqual([
      '[SCENE: Kitchen]',
      '[UPDATE: mood=tense]',
    ]);
    expect(buildInlineEditedMessageText(
      [{ speakerName: 'Ashley', content: ' "Move." ' }],
      extractHiddenMessageTags(text),
    )).toBe('[SCENE: Kitchen]\n[UPDATE: mood=tense]\n\nAshley: "Move."');
  });

  it('merges adjacent explicit and inferred speaker segments by rendered character identity', () => {
    const merged = mergeByRenderedSpeaker(
      [
        { speakerName: 'Ash', content: '"Go."' },
        { speakerName: null, content: 'Ashley moved closer.' },
        { speakerName: 'James', content: '"Okay."' },
      ],
      true,
      scenario,
      scenario.characters[1],
      (name) => (name === 'Ash' ? 'Ashley' : name),
    );

    expect(merged).toEqual([
      { speakerName: 'Ashley', content: '"Go."\n\nAshley moved closer.' },
      { speakerName: 'James', content: '"Okay."' },
    ]);
  });

  it('builds editable segments using the same rendered-speaker merge path as normal chat rendering', () => {
    const segments = buildEditableMessageSegments(
      'Ash: "Go."\n\nAshley moved closer.',
      true,
      scenario,
      scenario.characters[1],
      (name) => (name === 'Ash' ? 'Ashley' : name),
    );

    expect(segments).toEqual([
      { speakerName: 'Ashley', content: '"Go."\n\nAshley moved closer.' },
    ]);
  });

  it('round-trips hidden system tags through inline editing without duplicating them', () => {
    const savedText = '[SCENE: Kitchen]\n[UPDATE: mood=tense]\n\nAsh: "Stay here."\n\nAshley blocked the hallway.';
    const hiddenTags = extractHiddenMessageTags(savedText);
    const editableSegments = buildEditableMessageSegments(
      savedText,
      true,
      scenario,
      scenario.characters[1],
      (name) => (name === 'Ash' ? 'Ashley' : name),
    );

    expect(editableSegments).toEqual([
      { speakerName: 'Ashley', content: '"Stay here."\n\nAshley blocked the hallway.' },
    ]);

    const editedText = buildInlineEditedMessageText(
      [{ speakerName: 'Ashley', content: '"Move now."\n\nAshley stepped aside.' }],
      hiddenTags,
    );

    expect(editedText).toBe('[SCENE: Kitchen]\n[UPDATE: mood=tense]\n\nAshley: "Move now."\n\nAshley stepped aside.');
    expect(editedText.match(/\[SCENE:/g)).toHaveLength(1);
    expect(editedText.match(/\[UPDATE:/g)).toHaveLength(1);
  });
});
