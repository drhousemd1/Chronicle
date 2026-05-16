import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

describe('extract-character-updates prompt guidance', () => {
  const source = readFileSync('supabase/functions/extract-character-updates/index.ts', 'utf8');

  it('uses positive milestone guidance for generated goal steps', () => {
    expect(source).toContain(
      'The desired_outcome describes the ultimate sustained result of the goal: what becomes true when the goal is meaningfully achieved.',
    );
    expect(source).toContain(
      'New steps should be logical milestone stages that naturally build toward that desired_outcome.',
    );
    expect(source).toContain(
      'A good step changes the ongoing story state after it happens. It should still matter later.',
    );
    expect(source).toContain(
      'Examples are structural only. Do not copy their subject matter, genre, relationship type, setting, kink, or wording into unrelated stories.',
    );
  });

  it('keeps the structural example generic rather than story-specific', () => {
    expect(source).toContain('goals.Establish Lasting Dynamic');
    expect(source).toContain('CharacterName and OtherCharacter establish a sustained relationship dynamic');
    expect(source).not.toContain('goals.Long-Term Objective');
    expect(source).not.toContain('Reach the sustained outcome.');
  });

  it('requires scenePosition updates when immediate placement is clear', () => {
    expect(source).toContain('scenePosition: volatile immediate placement within the broad place');
    expect(source).toContain('Do not leave scenePosition blank when the current exchange clearly establishes immediate placement.');
    expect(source).toContain('Update it only when the exchange clearly establishes that the character has actually arrived in, entered, left, or relocated');
  });
});
