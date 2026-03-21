export const LEGACY_TO_CANONICAL_BUILDER_TAB = {
  world: 'story_builder',
  characters: 'character_builder',
} as const;

export const CANONICAL_TO_LEGACY_BUILDER_TAB = {
  story_builder: 'world',
  character_builder: 'characters',
} as const;

export type BuilderTabCanonical = 'story_builder' | 'character_builder';
export type BuilderTabLegacy = keyof typeof LEGACY_TO_CANONICAL_BUILDER_TAB;

export const normalizeBuilderTab = (tab: string): string => {
  if (tab in LEGACY_TO_CANONICAL_BUILDER_TAB) {
    return LEGACY_TO_CANONICAL_BUILDER_TAB[tab as BuilderTabLegacy];
  }
  return tab;
};

export const toLegacyBuilderTab = (tab: string): string => {
  if (tab in CANONICAL_TO_LEGACY_BUILDER_TAB) {
    return CANONICAL_TO_LEGACY_BUILDER_TAB[tab as BuilderTabCanonical];
  }
  return tab;
};
