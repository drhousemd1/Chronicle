import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { characterToDb, dbToCharacter } from '@/services/persistence/characters';
import { getHardcodedTestCharacters } from '@/utils';

const readSource = (relativeUrl: string) => readFileSync(
  fileURLToPath(new URL(relativeUrl, import.meta.url)),
  'utf8',
);

describe('structured mood retirement', () => {
  it('ignores legacy character mood rows and omits mood from application-owned writes', () => {
    const legacyRow = {
      id: 'character-1',
      name: 'Rowan',
      current_mood: 'Anxious',
      created_at: new Date(0).toISOString(),
      updated_at: new Date(0).toISOString(),
    };

    const character = dbToCharacter(legacyRow);
    expect((character as any).currentMood).toBeUndefined();

    const [defaultCharacter] = getHardcodedTestCharacters();
    const writeRow = characterToDb(
      { ...defaultCharacter, currentMood: 'Guarded' } as any,
      'user-1',
      'scenario-1',
    );
    expect(writeRow).not.toHaveProperty('current_mood');
  });

  it('keeps current_mood out of active side-character, session, and worker source paths', () => {
    const activeSources = [
      readSource('../../services/persistence/side-characters.ts'),
      readSource('../../services/persistence/conversations.ts'),
      readSource('../../../supabase/functions/extract-character-updates/index.ts'),
    ];

    for (const source of activeSources) {
      expect(source).not.toContain('current_mood');
      expect(source).not.toContain('currentMood');
    }
  });
});
