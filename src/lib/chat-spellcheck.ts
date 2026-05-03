const WORD_REGEX = /[A-Za-z]+(?:['’][A-Za-z]+)*/g;
const MAX_SUGGESTION_DISTANCE = 2;
const MAX_SUGGESTIONS = 5;
const DICTIONARY_URL = '/spellcheck/en-words.txt';

export type SpellcheckDictionary = {
  words: Set<string>;
  wordsByLength: Map<number, string[]>;
  wordsByFirstLetterAndLength: Map<string, string[]>;
};

export type MisspelledRange = {
  start: number;
  end: number;
  word: string;
};

export type SpellOverlaySegment =
  | { kind: 'plain'; text: string }
  | { kind: 'misspelled'; text: string; range: MisspelledRange };

let dictionaryPromise: Promise<SpellcheckDictionary> | null = null;

export function normalizeSpellToken(word: string): string {
  return word.trim().toLowerCase().replace(/’/g, "'");
}

function titleCaseWord(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function preserveWordCase(source: string, suggestion: string): string {
  if (source.toUpperCase() === source) {
    return suggestion.toUpperCase();
  }

  if (source.charAt(0).toUpperCase() === source.charAt(0) && source.slice(1).toLowerCase() === source.slice(1)) {
    return titleCaseWord(suggestion);
  }

  return suggestion;
}

function buildDictionary(words: string[]): SpellcheckDictionary {
  const wordSet = new Set<string>();
  const wordsByLength = new Map<number, string[]>();
  const wordsByFirstLetterAndLength = new Map<string, string[]>();

  for (const rawWord of words) {
    const word = normalizeSpellToken(rawWord);
    if (!word || wordSet.has(word)) continue;

    wordSet.add(word);

    const lengthBucket = wordsByLength.get(word.length);
    if (lengthBucket) {
      lengthBucket.push(word);
    } else {
      wordsByLength.set(word.length, [word]);
    }

    const firstKey = `${word.charAt(0)}:${word.length}`;
    const firstBucket = wordsByFirstLetterAndLength.get(firstKey);
    if (firstBucket) {
      firstBucket.push(word);
    } else {
      wordsByFirstLetterAndLength.set(firstKey, [word]);
    }
  }

  return {
    words: wordSet,
    wordsByLength,
    wordsByFirstLetterAndLength,
  };
}

export function loadEnglishSpellDictionary(): Promise<SpellcheckDictionary> {
  if (!dictionaryPromise) {
    dictionaryPromise = fetch(DICTIONARY_URL)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load spellcheck dictionary: ${response.status}`);
        }

        return response.text();
      })
      .then((text) => buildDictionary(text.split('\n').map((entry) => entry.trim()).filter(Boolean)))
      .catch((error) => {
        dictionaryPromise = null;
        throw error;
      });
  }

  return dictionaryPromise;
}

function commonPrefixLength(a: string, b: string): number {
  const max = Math.min(a.length, b.length);
  let count = 0;
  while (count < max && a.charCodeAt(count) === b.charCodeAt(count)) {
    count += 1;
  }
  return count;
}

function damerauLevenshteinWithin(a: string, b: string, maxDistance: number): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > maxDistance) return maxDistance + 1;

  const prevPrev: number[] = new Array(b.length + 1).fill(0);
  const prev: number[] = new Array(b.length + 1).fill(0);
  const curr: number[] = new Array(b.length + 1).fill(0);

  for (let j = 0; j <= b.length; j += 1) {
    prev[j] = j;
  }

  for (let i = 1; i <= a.length; i += 1) {
    curr[0] = i;
    let rowMin = curr[0];

    for (let j = 1; j <= b.length; j += 1) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
      let value = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + cost,
      );

      if (
        i > 1
        && j > 1
        && a.charCodeAt(i - 1) === b.charCodeAt(j - 2)
        && a.charCodeAt(i - 2) === b.charCodeAt(j - 1)
      ) {
        value = Math.min(value, prevPrev[j - 2] + cost);
      }

      curr[j] = value;
      if (value < rowMin) {
        rowMin = value;
      }
    }

    if (rowMin > maxDistance) {
      return maxDistance + 1;
    }

    for (let j = 0; j <= b.length; j += 1) {
      prevPrev[j] = prev[j];
      prev[j] = curr[j];
    }
  }

  return prev[b.length];
}

function shouldSkipSpellcheckToken(rawWord: string, allowlist: Set<string>): boolean {
  const normalized = normalizeSpellToken(rawWord);
  if (normalized.length < 3) return true;
  if (allowlist.has(normalized)) return true;
  if (/^[a-z]+'[a-z]+'[a-z]+$/.test(normalized)) return true;
  if (/^([a-z])\1{2,}$/.test(normalized)) return true;
  return false;
}

export function isCorrectWord(
  rawWord: string,
  dictionary: SpellcheckDictionary,
  allowlist: Set<string>,
): boolean {
  const normalized = normalizeSpellToken(rawWord);
  if (shouldSkipSpellcheckToken(rawWord, allowlist)) return true;
  return dictionary.words.has(normalized);
}

export function extractMisspelledRanges(
  text: string,
  dictionary: SpellcheckDictionary,
  allowlist: Set<string>,
): MisspelledRange[] {
  const results: MisspelledRange[] = [];
  WORD_REGEX.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = WORD_REGEX.exec(text)) !== null) {
    const word = match[0];
    if (!isCorrectWord(word, dictionary, allowlist)) {
      results.push({
        start: match.index,
        end: match.index + word.length,
        word,
      });
    }
  }

  return results;
}

export function buildSpellOverlaySegments(text: string, misspellings: MisspelledRange[]): SpellOverlaySegment[] {
  if (misspellings.length === 0) {
    return [{ kind: 'plain', text }];
  }

  const segments: SpellOverlaySegment[] = [];
  let cursor = 0;

  for (const range of misspellings) {
    if (range.start > cursor) {
      segments.push({
        kind: 'plain',
        text: text.slice(cursor, range.start),
      });
    }

    segments.push({
      kind: 'misspelled',
      text: text.slice(range.start, range.end),
      range,
    });

    cursor = range.end;
  }

  if (cursor < text.length) {
    segments.push({
      kind: 'plain',
      text: text.slice(cursor),
    });
  }

  return segments;
}

function collectCandidates(
  dictionary: SpellcheckDictionary,
  normalizedWord: string,
): string[] {
  const lengths = [];
  for (let delta = -2; delta <= 2; delta += 1) {
    const next = normalizedWord.length + delta;
    if (next >= 3) lengths.push(next);
  }

  const candidates = new Set<string>();
  for (const length of lengths) {
    const primaryBucket = dictionary.wordsByFirstLetterAndLength.get(`${normalizedWord.charAt(0)}:${length}`) ?? [];
    for (const candidate of primaryBucket) {
      candidates.add(candidate);
    }
  }

  if (candidates.size < 12) {
    for (const length of lengths) {
      const bucket = dictionary.wordsByLength.get(length) ?? [];
      for (const candidate of bucket) {
        candidates.add(candidate);
      }
    }
  }

  return Array.from(candidates);
}

export function getSpellingSuggestions(
  rawWord: string,
  dictionary: SpellcheckDictionary,
  allowlist: Set<string>,
  limit = MAX_SUGGESTIONS,
): string[] {
  const normalizedWord = normalizeSpellToken(rawWord);
  if (!normalizedWord || isCorrectWord(rawWord, dictionary, allowlist)) {
    return [];
  }

  const scored = collectCandidates(dictionary, normalizedWord)
    .filter((candidate) => candidate !== normalizedWord)
    .map((candidate) => {
      const distance = damerauLevenshteinWithin(normalizedWord, candidate, MAX_SUGGESTION_DISTANCE);
      if (distance > MAX_SUGGESTION_DISTANCE) return null;

      const prefix = commonPrefixLength(normalizedWord, candidate);
      const lengthGap = Math.abs(normalizedWord.length - candidate.length);
      const score = (distance * 100) + (lengthGap * 10) - (prefix * 3);

      return {
        candidate,
        score,
        distance,
        prefix,
        lengthGap,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    .sort((a, b) => (
      a.score - b.score
      || a.distance - b.distance
      || b.prefix - a.prefix
      || a.lengthGap - b.lengthGap
      || a.candidate.localeCompare(b.candidate)
    ));

  const unique = new Set<string>();
  const suggestions: string[] = [];
  for (const entry of scored) {
    if (unique.has(entry.candidate)) continue;
    unique.add(entry.candidate);
    suggestions.push(preserveWordCase(rawWord, entry.candidate));
    if (suggestions.length >= limit) break;
  }

  return suggestions;
}

function tokenizeAllowlistText(value: string, allowlist: Set<string>) {
  const matches = value.match(WORD_REGEX) ?? [];
  for (const match of matches) {
    const normalized = normalizeSpellToken(match);
    if (normalized.length >= 2) {
      allowlist.add(normalized);
    }
  }
}

export function buildChatSpellAllowlist(entries: Array<string | null | undefined>): Set<string> {
  const allowlist = new Set<string>();
  for (const entry of entries) {
    if (!entry) continue;
    tokenizeAllowlistText(entry, allowlist);
  }
  return allowlist;
}
