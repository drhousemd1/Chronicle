import { describe, expect, it, vi } from 'vitest';

import { persistDynamicSideCharactersBeforeStateReview } from './roleplay-side-character-registration';

describe('persistDynamicSideCharactersBeforeStateReview', () => {
  it('publishes the new character immediately but resolves only after minimal persistence', async () => {
    let resolvePersist!: () => void;
    const persistPromise = new Promise<void>((resolve) => {
      resolvePersist = resolve;
    });
    const publish = vi.fn();
    const persist = vi.fn(() => persistPromise);

    const resultPromise = persistDynamicSideCharactersBeforeStateReview({
      currentCharacters: [{ id: 'existing' }],
      newCharacters: [{ id: 'dynamic' }],
      publish,
      persist,
    });

    expect(publish).toHaveBeenCalledWith([{ id: 'existing' }, { id: 'dynamic' }]);
    expect(persist).toHaveBeenCalledWith({ id: 'dynamic' });

    resolvePersist();
    await expect(resultPromise).resolves.toEqual([{ id: 'dynamic' }]);
  });

  it('removes failed minimal rows before same-turn state review can consume them', async () => {
    const publish = vi.fn();
    const persisted = await persistDynamicSideCharactersBeforeStateReview({
      currentCharacters: [{ id: 'existing' }],
      newCharacters: [{ id: 'kept' }, { id: 'failed' }],
      publish,
      persist: vi.fn(async (character) => {
        if (character.id === 'failed') throw new Error('database unavailable');
      }),
    });

    expect(persisted).toEqual([{ id: 'kept' }]);
    expect(publish).toHaveBeenLastCalledWith([{ id: 'existing' }, { id: 'kept' }]);
  });
});
