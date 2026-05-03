import { describe, expect, it } from 'vitest';

import {
  buildChatSpellAllowlist,
  buildSpellOverlaySegments,
  extractMisspelledRanges,
  getSpellingSuggestions,
  isCorrectWord,
  normalizeSpellToken,
  type SpellcheckDictionary,
} from './chat-spellcheck';

function makeDictionary(words: string[]): SpellcheckDictionary {
  const normalized = Array.from(new Set(words.map((word) => normalizeSpellToken(word))));
  const wordSet = new Set(normalized);
  const wordsByLength = new Map<number, string[]>();
  const wordsByFirstLetterAndLength = new Map<string, string[]>();

  for (const word of normalized) {
    const lengthBucket = wordsByLength.get(word.length);
    if (lengthBucket) {
      lengthBucket.push(word);
    } else {
      wordsByLength.set(word.length, [word]);
    }

    const key = `${word.charAt(0)}:${word.length}`;
    const firstBucket = wordsByFirstLetterAndLength.get(key);
    if (firstBucket) {
      firstBucket.push(word);
    } else {
      wordsByFirstLetterAndLength.set(key, [word]);
    }
  }

  return {
    words: wordSet,
    wordsByLength,
    wordsByFirstLetterAndLength,
  };
}

describe('chat spellcheck helpers', () => {
  const dictionary = makeDictionary([
    'the',
    'storm',
    'cabin',
    'sarah',
    'waits',
    'ashley',
    'james',
    'guardian',
    'undiscovered',
    'secret',
    'anxious',
    'tension',
    'protective',
  ]);

  it('treats allowlisted Chronicle names as valid words', () => {
    const allowlist = buildChatSpellAllowlist(['Rhysand, Feyre']);
    expect(isCorrectWord('Rhysand', dictionary, allowlist)).toBe(true);
    expect(isCorrectWord('Feyre', dictionary, allowlist)).toBe(true);
  });

  it('extracts misspelled ranges for words only', () => {
    const allowlist = buildChatSpellAllowlist(['Sarah']);
    const misspellings = extractMisspelledRanges('Sarah waits in teh cabin.', dictionary, allowlist);

    expect(misspellings).toEqual([
      {
        start: 15,
        end: 18,
        word: 'teh',
      },
    ]);
  });

  it('builds clickable overlay segments around misspelled words', () => {
    const allowlist = new Set<string>();
    const misspellings = extractMisspelledRanges('teh storm', dictionary, allowlist);
    const segments = buildSpellOverlaySegments('teh storm', misspellings);

    expect(segments).toEqual([
      {
        kind: 'misspelled',
        text: 'teh',
        range: {
          start: 0,
          end: 3,
          word: 'teh',
        },
      },
      {
        kind: 'plain',
        text: ' storm',
      },
    ]);
  });

  it('offers close spelling suggestions without changing punctuation policy', () => {
    const suggestions = getSpellingSuggestions('teh', dictionary, new Set<string>());
    expect(suggestions[0]).toBe('the');
  });
});
