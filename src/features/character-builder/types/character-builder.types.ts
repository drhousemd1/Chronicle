export type CharacterBuiltInSectionKey =
  | 'basics'
  | 'physicalAppearance'
  | 'currentlyWearing'
  | 'preferredClothing'
  | 'personality'
  | 'tone'
  | 'background'
  | 'keyLifeEvents'
  | 'relationships'
  | 'secrets'
  | 'fears'
  | 'characterGoals';

export type CharacterSectionKey = CharacterBuiltInSectionKey | `custom:${string}`;

export type SectionProgress = {
  completed: number;
  total: number;
  percent: number;
};

export type NavButtonImageConfig = {
  src: string;
  x: number;
  y: number;
  scale: number;
};

export type CharacterSectionNavItem = {
  key: CharacterSectionKey;
  label: string;
};
