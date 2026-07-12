import type { Character, SideCharacter } from '@/types';

export type RoleplaySceneRosterRow = Readonly<{
  characterId: string;
  name: string;
  control: 'AI' | 'User' | 'Unspecified';
  role: string;
  location: string;
  scenePosition?: string;
}>;

type SceneRosterCharacter = Pick<
  Character | SideCharacter,
  'id' | 'name' | 'controlledBy' | 'characterRole' | 'location' | 'scenePosition'
>;

function compact(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
}

function toRosterRow(character: SceneRosterCharacter, fallbackRole: 'Main' | 'Side'): RoleplaySceneRosterRow {
  const scenePosition = compact(character.scenePosition);
  const row: RoleplaySceneRosterRow = {
    characterId: compact(character.id),
    name: compact(character.name) || 'Unnamed character',
    control: character.controlledBy === 'AI' || character.controlledBy === 'User'
      ? character.controlledBy
      : 'Unspecified',
    role: compact(character.characterRole) || fallbackRole,
    location: compact(character.location) || 'Unknown',
    ...(scenePosition ? { scenePosition } : {}),
  };

  return Object.freeze(row);
}

export function buildRoleplaySceneRoster(input: {
  mainCharacters: SceneRosterCharacter[];
  sideCharacters?: SceneRosterCharacter[];
}): RoleplaySceneRosterRow[] {
  return Object.freeze([
    ...input.mainCharacters.map((character) => toRosterRow(character, 'Main')),
    ...(input.sideCharacters ?? []).map((character) => toRosterRow(character, 'Side')),
  ]) as unknown as RoleplaySceneRosterRow[];
}

export function renderRoleplaySceneRoster(rows: RoleplaySceneRosterRow[]): string {
  if (rows.length === 0) return '';

  return [
    '[SCENE PRESENCE ROSTER]',
    ...rows.map((row) => [
      `- ${row.name}`,
      `control=${row.control}`,
      `role=${row.role}`,
      `location=${row.location}`,
      row.scenePosition ? `position=${row.scenePosition}` : '',
    ].filter(Boolean).join('; ')),
  ].join('\n');
}
