export async function persistDynamicSideCharactersBeforeStateReview<T extends { id: string }>(input: {
  currentCharacters: T[];
  newCharacters: T[];
  publish: (characters: T[]) => void;
  persist: (character: T) => Promise<void>;
}): Promise<T[]> {
  if (input.newCharacters.length === 0) return [];

  const newIds = new Set(input.newCharacters.map((character) => character.id));
  const existing = input.currentCharacters.filter((character) => !newIds.has(character.id));
  input.publish([...existing, ...input.newCharacters]);

  const persisted: T[] = [];
  for (const character of input.newCharacters) {
    try {
      await input.persist(character);
      persisted.push(character);
    } catch {
      // A character without its minimal database row cannot safely enter
      // same-turn state persistence. Failed rows are removed below.
    }
  }

  if (persisted.length !== input.newCharacters.length) {
    input.publish([...existing, ...persisted]);
  }

  return persisted;
}
