import { CharacterBuiltInSectionKey, CharacterSectionKey } from '@/features/character-builder/types/character-builder.types';

export const LEGACY_TO_CANONICAL_SECTION_KEY = {
  profile: 'basics',
} as const;

export const CANONICAL_TO_LEGACY_SECTION_KEY = {
  basics: 'profile',
} as const;

export const CANONICAL_CHARACTER_BUILT_IN_SECTIONS: ReadonlyArray<{
  key: CharacterBuiltInSectionKey;
  label: string;
}> = [
  { key: 'basics', label: 'Basics' },
  { key: 'physicalAppearance', label: 'Physical Appearance' },
  { key: 'currentlyWearing', label: 'Currently Wearing' },
  { key: 'preferredClothing', label: 'Preferred Clothing' },
  { key: 'personality', label: 'Personality' },
  { key: 'tone', label: 'Tone' },
  { key: 'background', label: 'Background' },
  { key: 'keyLifeEvents', label: 'Key Life Events' },
  { key: 'relationships', label: 'Relationships' },
  { key: 'secrets', label: 'Secrets' },
  { key: 'fears', label: 'Fears' },
  { key: 'characterGoals', label: 'Character Goals' },
];

export const CANONICAL_CHARACTER_BUILT_IN_SECTION_KEYS = new Set(
  CANONICAL_CHARACTER_BUILT_IN_SECTIONS.map((section) => section.key)
);

export const isCustomCharacterSectionKey = (key: string): key is `custom:${string}` =>
  key.startsWith('custom:');

export const toCanonicalCharacterSectionKey = (key: string): CharacterSectionKey | string => {
  if (!key) return 'basics';
  if (isCustomCharacterSectionKey(key)) return key;
  if (key in LEGACY_TO_CANONICAL_SECTION_KEY) {
    return LEGACY_TO_CANONICAL_SECTION_KEY[key as keyof typeof LEGACY_TO_CANONICAL_SECTION_KEY];
  }
  return key;
};

export const toLegacyCharacterSectionKey = (key: string): string => {
  if (!key) return 'profile';
  if (isCustomCharacterSectionKey(key)) return key;
  if (key in CANONICAL_TO_LEGACY_SECTION_KEY) {
    return CANONICAL_TO_LEGACY_SECTION_KEY[key as keyof typeof CANONICAL_TO_LEGACY_SECTION_KEY];
  }
  return key;
};

export const getCharacterSectionKeyAliases = (key: string): string[] => {
  if (!key) return ['basics', 'profile'];
  const canonical = toCanonicalCharacterSectionKey(key);
  const legacy = toLegacyCharacterSectionKey(canonical);
  if (canonical === legacy) return [canonical];
  return [canonical, legacy];
};

export const isCharacterSectionKeyMatch = (left: string, right: string): boolean => {
  const leftCanonical = toCanonicalCharacterSectionKey(left);
  const rightCanonical = toCanonicalCharacterSectionKey(right);
  return leftCanonical === rightCanonical;
};
