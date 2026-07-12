import { describe, expect, it } from 'vitest';

import {
  buildSceneImageCharacterData,
  generatedProfileSourceSupportsValue,
  mergeGeneratedProfileSection,
  sanitizeGeneratedSideCharacterProfile,
} from './side-character-profile';
import type { Character } from '@/types';
import {
  defaultCurrentlyWearing,
  defaultPhysicalAppearance,
  defaultPreferredClothing,
} from '@/types';

const sourceText = [
  'Rina entered the lounge wearing a black leather jacket, blue jeans, and red lace thong.',
  'The dialogue explicitly calls her bisexual and says she keeps a switchblade hidden in her boot.',
].join('\n');

describe('side-character generated profile sanitization', () => {
  it('keeps ordinary visible details while requiring source support for private or intimate fields', () => {
    const sanitized = sanitizeGeneratedSideCharacterProfile({
      nicknames: 'Rina',
      age: '  34  ',
      sexType: ' female ',
      sexualOrientation: ' bisexual ',
      roleDescription: '  bartender at the lounge ',
      physicalAppearance: {
        hairColor: ' black ',
        eyeColor: ' green ',
        build: ' athletic ',
        bodyHair: ' shaved ',
        height: ' tall ',
        breastSize: ' large ',
        genitalia: 'cock',
        skinTone: ' olive ',
        makeup: ' smoky eyeliner ',
        bodyMarkings: ' sleeve tattoo ',
        temporaryConditions: ' rain-damp hair ',
      },
      currentlyWearing: {
        top: ' black leather jacket ',
        bottom: ' blue jeans ',
        undergarments: ' red lace thong ',
        miscellaneous: ' silver rings ',
      },
      background: {
        relationshipStatus: 'married',
        residence: ' apartment above the lounge ',
        educationLevel: ' culinary school ',
      },
      personality: {
        traits: [' watchful ', '', 'dry-humored', 'third should be dropped'],
        miscellaneous: ' guarded but helpful ',
        secrets: ' keeps a switchblade hidden in her boot ',
        fears: 'afraid of crowds',
        kinksFantasies: 'knife play',
        desires: 'wants to leave town',
      },
    }, 'Rina', sourceText);

    expect(sanitized).toMatchObject({
      nicknames: 'Rina',
      age: '34',
      sexType: 'female',
      sexualOrientation: 'bisexual',
      roleDescription: 'bartender at the lounge',
      physicalAppearance: {
        hairColor: 'black',
        eyeColor: 'green',
        build: 'athletic',
        bodyHair: '',
        breastSize: '',
        genitalia: '',
      },
      currentlyWearing: {
        top: 'black leather jacket',
        bottom: 'blue jeans',
        undergarments: 'red lace thong',
      },
      background: {
        relationshipStatus: '',
        residence: 'apartment above the lounge',
      },
      personality: {
        traits: ['watchful', 'dry-humored'],
        secrets: 'keeps a switchblade hidden in her boot',
        fears: '',
        kinksFantasies: '',
        desires: '',
      },
    });
    expect(sanitized.avatarPrompt).toContain('Portrait of Rina, 34, female');
    expect(sanitized.avatarPrompt).toContain('black leather jacket');
    expect(sanitized.avatarPrompt).not.toContain('red lace thong');
    expect(sanitized.avatarPrompt).not.toContain('switchblade');
  });

  it('requires one supported phrase instead of scattered token matches', () => {
    expect(generatedProfileSourceSupportsValue('red lace', 'red door beside a lace curtain')).toBe(false);
    expect(generatedProfileSourceSupportsValue('red lace', 'she wore red lace undergarments')).toBe(true);
  });

  it('merges only meaningful generated section values over existing data', () => {
    const merged = mergeGeneratedProfileSection(
      { top: 'old top', bottom: 'old bottom', undergarments: 'old underwear', misc: { kept: true } },
      { top: '  new top ', bottom: '', undergarments: [], misc: { updated: true } },
    );

    expect(merged).toEqual({
      top: 'new top',
      bottom: 'old bottom',
      undergarments: 'old underwear',
      misc: { updated: true },
    });
  });

  it('builds scene-image character data from visual fields only', () => {
    const character: Character = {
      id: 'char-1',
      name: 'Rina',
      nicknames: '',
      age: '34',
      sexType: 'female',
      sexualOrientation: 'bisexual',
      location: 'lounge',
      controlledBy: 'AI',
      characterRole: 'Main',
      roleDescription: 'bartender',
      tags: '',
      avatarDataUrl: '',
      physicalAppearance: {
        ...defaultPhysicalAppearance,
        hairColor: 'black',
        eyeColor: 'green',
        build: 'athletic',
        bodyHair: 'not visual lane',
        breastSize: 'not visual lane',
        genitalia: 'not visual lane',
      },
      currentlyWearing: {
        ...defaultCurrentlyWearing,
        top: 'black leather jacket',
        bottom: 'blue jeans',
        undergarments: 'red lace thong',
        miscellaneous: 'silver rings',
      },
      preferredClothing: { ...defaultPreferredClothing },
      sections: [],
      createdAt: 1,
      updatedAt: 1,
    };

    expect(buildSceneImageCharacterData(character)).toEqual({
      name: 'Rina',
      physicalAppearance: {
        hairColor: 'black',
        eyeColor: 'green',
        build: 'athletic',
        height: '',
        skinTone: '',
        makeup: '',
        bodyMarkings: '',
        temporaryConditions: '',
      },
      currentlyWearing: {
        top: 'black leather jacket',
        bottom: 'blue jeans',
      },
    });
  });
});
