import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(path, 'utf8');

describe('story-character refactor blueprint mapping', () => {
  it('keeps the prose mapping aligned with the committed mapping JSON', () => {
    const blueprint = read('docs/guides/story-character-builder-refactor-blueprint.md');
    const mapping = JSON.parse(read('docs/guides/mappings/story-character-refactor-path-map.json')) as Record<
      string,
      string[]
    >;

    const mappedPaths = Object.entries(mapping).flatMap(([source, targets]) => [source, ...targets]);

    mappedPaths.forEach((path) => {
      expect(blueprint).toContain(path);
    });

    [
      'src/features/story-builder/StoryBuilderLayout.tsx',
      'src/features/story-builder/sidebar/AddCharacterPlaceholderCard.tsx',
      'src/features/story-builder/sections/WorldCoreSection.tsx',
      'src/features/character-builder/CharacterBuilderLayout.tsx',
      'src/features/character-builder/sidebar/CharacterBuilderSidebar.tsx',
      'src/features/character-builder/sidebar/CharacterHeaderTile.tsx',
      'src/features/character-builder/sidebar/TraitNavList.tsx',
      'src/features/character-builder/rows/LockedTraitRow.tsx',
      'src/features/character-builder/rows/EditableTraitRow.tsx',
    ].forEach((stalePath) => {
      expect(blueprint).not.toContain(stalePath);
    });
  });
});
