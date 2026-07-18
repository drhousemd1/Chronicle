import { describe, expect, it } from 'vitest';

import {
  buildRoleplaySceneRoster,
  renderRoleplaySceneRoster,
} from './roleplay-scene-roster';

function character(index: number, overrides: Record<string, unknown> = {}) {
  return {
    id: `character-${index}`,
    name: `Character ${index}`,
    controlledBy: index % 2 === 0 ? 'User' : 'AI',
    characterRole: 'Main',
    location: `Location ${index}`,
    scenePosition: `Position ${index}`,
    ...overrides,
  } as any;
}

describe('RoleplaySceneRosterRow', () => {
  it('keeps every main and side character in stable input order without a cap', () => {
    const mainCharacters = Array.from({ length: 8 }, (_, index) => character(index + 1));
    const sideCharacters = Array.from({ length: 7 }, (_, index) => character(index + 9, {
      characterRole: 'Side',
    }));

    const roster = buildRoleplaySceneRoster({ mainCharacters, sideCharacters });

    expect(roster).toHaveLength(15);
    expect(roster.map((row) => row.characterId)).toEqual(
      Array.from({ length: 15 }, (_, index) => `character-${index + 1}`),
    );
    expect(roster.slice(0, 8).every((row) => row.role === 'Main')).toBe(true);
    expect(roster.slice(8).every((row) => row.role === 'Side')).toBe(true);
  });

  it('renders unknown location explicitly and omits an empty scene position', () => {
    const roster = buildRoleplaySceneRoster({
      mainCharacters: [character(1, { location: '  ', scenePosition: '' })],
    });

    expect(roster[0]).toEqual({
      characterId: 'character-1',
      name: 'Character 1',
      control: 'AI',
      role: 'Main',
      location: 'Unknown',
    });
    expect(renderRoleplaySceneRoster(roster)).toBe(
      '[SCENE PRESENCE ROSTER]\n- Character 1; control=AI; role=Main; location=Unknown',
    );
  });

  it('does not introduce observer metadata', () => {
    const roster = buildRoleplaySceneRoster({
      mainCharacters: [character(1)],
    });
    const rendered = renderRoleplaySceneRoster(roster);

    expect(rendered).not.toMatch(/observer|observedBy/i);
    expect(Object.isFrozen(roster[0])).toBe(true);
  });
});
