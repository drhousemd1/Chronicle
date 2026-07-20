import type { Character, SideCharacter } from '@/types';
import nlp from 'compromise/three';

export type RoleplayCharacterCardSource = Character | SideCharacter;

export type CharacterPromptFactRuntimeUse =
  | 'identity'
  | 'stable_reference'
  | 'current_state'
  | 'relationship'
  | 'goal'
  | 'private_reference'
  | 'debug_only';

export type CharacterPromptFactAuthority =
  | 'saved_card_identity'
  | 'saved_card_reference'
  | 'current_state'
  | 'goal_selector'
  | 'visibility_policy';

export type CharacterPromptFactRelevance =
  | 'always'
  | 'current'
  | 'conditional'
  | 'inactive';

export type CharacterPromptFactVisibility =
  | 'broad_reference'
  | 'current_scene'
  | 'character_knowledge'
  | 'private_reference'
  | 'debug_only';

export type CharacterPromptFactWordingPolicy =
  | 'compact_fact'
  | 'voice_affordance'
  | 'do_not_copy_phrase'
  | 'withhold';

export type CharacterPromptFactDisposition =
  | 'included'
  | 'transformed'
  | 'suppressed'
  | 'debug_only';

export type CharacterPromptFactSourceSurface =
  | 'main_character_cards'
  | 'side_character_cards'
  | 'user_character_cards';

export type CharacterPromptFact = Readonly<{
  characterId: string;
  characterName: string;
  sourceField: string;
  sourceLabel?: string;
  sourceValue: string;
  sourceSurface: CharacterPromptFactSourceSurface;
  value: string;
  semanticKey: string;
  runtimeUse: CharacterPromptFactRuntimeUse;
  authority: CharacterPromptFactAuthority;
  relevance: CharacterPromptFactRelevance;
  visibility: CharacterPromptFactVisibility;
  wordingPolicy: CharacterPromptFactWordingPolicy;
  modelFacing: boolean;
  disposition: CharacterPromptFactDisposition;
  reason: string;
}>;

export type CharacterPromptFactDuplicateGroup = Readonly<{
  value: string;
  sourceFields: string[];
  renderedOccurrences: number;
}>;

export type CharacterPromptFactReviewSummary = Readonly<{
  characterId: string;
  characterName: string;
  totalFacts: number;
  modelFacingFacts: number;
  transformedFacts: number;
  suppressedFacts: number;
  debugOnlyFacts: number;
  duplicateSourceGroups: CharacterPromptFactDuplicateGroup[];
  repeatedRenderedValues: string[];
  legacyRawHeadingsPresent: string[];
}>;

export type CharacterPromptOutputCopyMetric = Readonly<{
  characterId: string;
  characterName: string;
  factSource: 'generation_captured_facts' | 'current_card_fallback';
  exactSourceValueCopies: Array<Readonly<{
    sourceField: string;
    sourceLabel?: string;
    sourceValue: string;
  }>>;
  copiedSourceLabels: Array<Readonly<{
    sourceField: string;
    sourceLabel: string;
  }>>;
}>;

export type CreateCharacterPromptFactInput = Omit<
  CharacterPromptFact,
  'sourceValue' | 'value' | 'semanticKey' | 'modelFacing'
> & Readonly<{
  sourceValue: string;
  promptValue?: string;
}>;

function normalizePromptValue(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

type CreatorFactTransform = Readonly<{
  value: string;
  safe: boolean;
  reason: string;
}>;

type CreatorLanguageTerm = Readonly<{
  text: string;
  normal: string;
  tags: readonly string[];
  switch?: string;
}>;

function parseCreatorLanguageTerms(value: string): CreatorLanguageTerm[] {
  const firstSentence = nlp(value).json()[0] as {
    terms?: Array<{ text: string; normal: string; tags: string[]; switch?: string }>;
  } | undefined;
  return (firstSentence?.terms ?? []).map((term) => ({
    text: term.text,
    normal: term.normal,
    tags: term.tags,
    switch: term.switch,
  }));
}

function hasLanguageTag(term: CreatorLanguageTerm | undefined, tag: string): boolean {
  return term?.tags.includes(tag) ?? false;
}

function firstTermCanBeVerb(term: CreatorLanguageTerm | undefined): boolean {
  if (!term?.normal) return false;
  const isolated = parseCreatorLanguageTerms(term.normal)[0];
  return hasLanguageTag(isolated, 'Verb');
}

function finiteVerbIndex(terms: CreatorLanguageTerm[]): number {
  return terms.findIndex((term) => (
    hasLanguageTag(term, 'Verb')
    && (
      hasLanguageTag(term, 'PastTense')
      || hasLanguageTag(term, 'Modal')
      || hasLanguageTag(term, 'Auxiliary')
      || (
        hasLanguageTag(term, 'PresentTense')
        && !hasLanguageTag(term, 'Infinitive')
        && !hasLanguageTag(term, 'Imperative')
        && !hasLanguageTag(term, 'Gerund')
      )
    )
  ));
}

function startsWithFinitePredicate(value: string): boolean {
  const terms = parseCreatorLanguageTerms(value);
  if (!terms.length) return false;

  let firstContentIndex = 0;
  while (
    hasLanguageTag(terms[firstContentIndex], 'Adverb')
    || hasLanguageTag(terms[firstContentIndex], 'Negative')
  ) {
    firstContentIndex += 1;
  }

  const first = terms[firstContentIndex];
  if (!first) return false;
  if (/^(?:being|having)$/i.test(first.normal)) return false;
  if (finiteVerbIndex(terms.slice(firstContentIndex)) === 0) return true;

  // Ambiguous third-person forms become much clearer when the parser sees a
  // real subject. This distinguishes predicates such as "wears jeans" and
  // "builds shelters" from noun phrases such as "systems engineer".
  const contextualTerms = parseCreatorLanguageTerms(`Mara ${value}`);
  const contextualPredicateIndex = firstContentIndex + 1;
  if (finiteVerbIndex(contextualTerms.slice(contextualPredicateIndex)) === 0) {
    return true;
  }

  // Some third-person verbs are lexically ambiguous with plural nouns. Ask the
  // parser about the isolated token, then require a clause-compatible follower.
  if (hasLanguageTag(first, 'Plural') && firstTermCanBeVerb(first)) {
    const next = terms[firstContentIndex + 1];
    const afterNext = terms[firstContentIndex + 2];
    return Boolean(next && (
      hasLanguageTag(next, 'Preposition')
      ||
      hasLanguageTag(next, 'Determiner')
      || hasLanguageTag(next, 'Noun')
      || hasLanguageTag(next, 'Pronoun')
      || hasLanguageTag(next, 'Adverb')
      || hasLanguageTag(next, 'Expression')
      || (
        hasLanguageTag(next, 'Adjective')
        && /(?:^|\|)Verb(?:\||$)/u.test(first.switch ?? '')
      )
      || (
        (hasLanguageTag(next, 'Adjective') || hasLanguageTag(next, 'PastTense'))
        && hasLanguageTag(afterNext, 'Noun')
      )
    ));
  }

  // Unknown third-person verbs are often tagged as plural nouns. Accept the
  // structural predicate shape only when a clause-compatible complement
  // follows; conjunctions, copulas, and bare adjective phrases remain nouns.
  if (
    hasLanguageTag(first, 'Plural')
    && !hasLanguageTag(first, 'ProperNoun')
    && /^[\p{L}']+s$/u.test(first.text)
  ) {
    const next = terms[firstContentIndex + 1];
    const afterNext = terms[firstContentIndex + 2];
    return Boolean(next && (
      hasLanguageTag(next, 'Preposition')
      || hasLanguageTag(next, 'Determiner')
      || hasLanguageTag(next, 'Pronoun')
      || hasLanguageTag(next, 'Adverb')
      || (
        (hasLanguageTag(next, 'Adjective') || hasLanguageTag(next, 'PastTense'))
        && hasLanguageTag(afterNext, 'Noun')
      )
    ));
  }

  return false;
}

function startsWithPassiveOrAdjectivalPredicate(value: string): boolean {
  const terms = parseCreatorLanguageTerms(value);
  let firstContentIndex = 0;
  while (
    hasLanguageTag(terms[firstContentIndex], 'Adverb')
    || hasLanguageTag(terms[firstContentIndex], 'Negative')
  ) {
    firstContentIndex += 1;
  }

  const predicate = terms[firstContentIndex];
  if (!predicate || (!hasLanguageTag(predicate, 'PastTense') && !hasLanguageTag(predicate, 'Adjective'))) {
    return false;
  }

  const complementTerms = terms.slice(firstContentIndex + 1);
  if (complementTerms.length === 0) {
    return firstContentIndex > 0
      || hasLanguageTag(predicate, 'PastTense')
      || hasLanguageTag(predicate, 'Adjective');
  }
  if (complementTerms.every((term) => (
    hasLanguageTag(term, 'Adverb') || hasLanguageTag(term, 'Adjective')
  ))) {
    return hasLanguageTag(predicate, 'PastTense')
      || /(?:Adj\|Past|Past\|Adj)/u.test(predicate.switch ?? '');
  }
  if (
    (hasLanguageTag(predicate, 'Adjective') || hasLanguageTag(predicate, 'PastTense'))
    && hasLanguageTag(complementTerms[0], 'Noun')
  ) {
    return false;
  }
  return complementTerms.some((term) => (
    hasLanguageTag(term, 'Preposition')
    || hasLanguageTag(term, 'Conjunction')
    || hasLanguageTag(term, 'QuestionWord')
    || /^(?:at|by|for|from|in|on|to|under|with|without)$/i.test(term.normal)
  ));
}

function looksLikeAmbiguousNominalCompound(value: string): boolean {
  const terms = parseCreatorLanguageTerms(value);
  const first = terms[0];
  const hasNominalAlternative = hasLanguageTag(first, 'Plural')
    || /(?:Noun|Plural)\|Verb|Verb\|(?:Noun|Plural)/u.test(first?.switch ?? '');
  if (
    !(
      (hasLanguageTag(first, 'Verb') && hasLanguageTag(first, 'PresentTense'))
      || (hasLanguageTag(first, 'Plural') && firstTermCanBeVerb(first))
    )
    || !hasNominalAlternative
    || hasLanguageTag(first, 'Auxiliary')
    || terms.length < 2
  ) {
    return false;
  }

  const followers = terms.slice(1);
  const looksLikeOccupationalHead = (term: CreatorLanguageTerm | undefined): boolean => {
    if (!term) return false;
    return hasLanguageTag(term, 'Actor')
      || hasLanguageTag(term, 'Person')
      || /(?:er|or|ist|ian|ician|therapist)$/iu.test(term.normal)
      || /^(?:chair|head|lead|liaison)$/iu.test(term.normal);
  };
  const prepositionIndex = followers.findIndex((term) => hasLanguageTag(term, 'Preposition'));
  if (prepositionIndex >= 0) {
    const nounsAfterPreposition = followers.slice(prepositionIndex + 1)
      .filter((term) => hasLanguageTag(term, 'Noun'));
    const finalNoun = nounsAfterPreposition.at(-1);
    if (
      nounsAfterPreposition.length >= 2
      && finalNoun
      && !hasLanguageTag(finalNoun, 'Plural')
      && looksLikeOccupationalHead(finalNoun)
    ) {
      return true;
    }
  }

  const hasClauseMarker = followers.some((term) => (
    hasLanguageTag(term, 'Determiner')
    || hasLanguageTag(term, 'Pronoun')
    || hasLanguageTag(term, 'Adverb')
  ));
  if (hasClauseMarker) return false;

  const allNominalFollowers = followers.every((term) => (
    hasLanguageTag(term, 'Noun')
    || hasLanguageTag(term, 'Adjective')
    || hasLanguageTag(term, 'PastTense')
    || hasLanguageTag(term, 'Conjunction')
  ));
  return allNominalFollowers;
}

function looksLikeAmbiguousActivityNounPhrase(value: string): boolean {
  const terms = parseCreatorLanguageTerms(value);
  const first = terms[0];
  const final = terms.at(-1);
  const hasActivityNounHead = /(?:craft|graphy|making|work)$/iu.test(final?.normal ?? '')
    || hasLanguageTag(final, 'Gerund');
  if (
    !first
    || terms.length < 2
    || (hasLanguageTag(first, 'Verb') && !hasActivityNounHead)
    || !(
      hasLanguageTag(first, 'Plural')
      || /(?:Noun|Plural)\|Verb|Verb\|(?:Noun|Plural)/u.test(first.switch ?? '')
    )
  ) {
    return false;
  }

  const followers = terms.slice(1);
  if (followers.some((term) => (
    hasLanguageTag(term, 'Determiner')
    || hasLanguageTag(term, 'Pronoun')
    || hasLanguageTag(term, 'Adverb')
    || hasLanguageTag(term, 'Conjunction')
  ))) {
    return false;
  }

  return followers.every((term) => (
    hasLanguageTag(term, 'Noun')
    || hasLanguageTag(term, 'Adjective')
    || hasLanguageTag(term, 'PastTense')
  ));
}

function looksLikeLeadingModifierNounPhrase(value: string): boolean {
  const terms = parseCreatorLanguageTerms(value);
  let firstContentIndex = 0;
  while (hasLanguageTag(terms[firstContentIndex], 'Adverb')) firstContentIndex += 1;
  const first = terms[firstContentIndex];
  if (!first || (!hasLanguageTag(first, 'PastTense') && !hasLanguageTag(first, 'Adjective'))) {
    return false;
  }

  const followers = terms.slice(firstContentIndex + 1);
  if (followers.some((term) => (
    hasLanguageTag(term, 'Preposition')
    || hasLanguageTag(term, 'Conjunction')
    || hasLanguageTag(term, 'QuestionWord')
    || /^(?:at|by|for|from|in|on|to|under|with|without)$/i.test(term.normal)
  ))) {
    return false;
  }
  return followers.some((term) => hasLanguageTag(term, 'Noun'));
}

function hasExplicitSubjectPredicate(value: string): boolean {
  const terms = parseCreatorLanguageTerms(value);
  if (hasLanguageTag(terms[0], 'Adjective')) return false;
  const verbIndex = finiteVerbIndex(terms);
  if (verbIndex <= 0) return false;
  return terms.slice(0, verbIndex).some((term) => (
    hasLanguageTag(term, 'Noun') || hasLanguageTag(term, 'Pronoun')
  ));
}

function startsWithNounCopula(value: string): boolean {
  const terms = parseCreatorLanguageTerms(value);
  return hasLanguageTag(terms[0], 'Noun') && hasLanguageTag(terms[1], 'Copula');
}

function startsWithBareInfinitive(value: string): boolean {
  const first = parseCreatorLanguageTerms(value)[0];
  const contextualFirst = parseCreatorLanguageTerms('Mara ' + value)[1];
  return hasLanguageTag(first, 'Verb')
    && hasLanguageTag(first, 'Infinitive')
    && (
      !hasLanguageTag(contextualFirst, 'Noun')
      || !/(?:Noun|Plural)\|Verb|Verb\|(?:Noun|Plural)/u.test(first?.switch ?? '')
    );
}

function ensureSentence(value: string): string {
  const normalized = normalizePromptValue(value)
    .replace(/^[•*-]+\s*/, '')
    .replace(/\s+([,.;!?])/g, '$1')
    .trim();
  if (!normalized) return '';
  return /[.!?]$/.test(normalized) ? normalized : `${normalized}.`;
}

function recordedCreatorPhrase(
  characterName: string,
  fieldLabel: string,
  value: string,
): string {
  return `${possessive(characterName)} ${fieldLabel}: ${ensureSentence(value)}`;
}

function recordedCreatorLabelPhrase(
  characterName: string,
  sourceLabel: string,
  value: string,
): string {
  const label = withoutTerminalPunctuation(sourceLabel.trim()) || 'Recorded reference';
  return `For ${characterName}, ${label}: ${ensureSentence(value)}`;
}

function lowerFirst(value: string): string {
  if (!value) return value;
  const firstWord = value.match(/^\S+/)?.[0] ?? '';
  if (/^(?:[A-Z]\.){2,}/.test(firstWord) || /^[A-Z]{2,}(?:\b|[.-])/.test(firstWord)) return value;
  const terms = parseCreatorLanguageTerms(value);
  if (hasLanguageTag(terms[0], 'ProperNoun')) return value;
  if (/^(?:[A-Z][\p{L}'-]*|(?:[A-Z]\.){2,})\s+(?:[A-Z][\p{L}'-]*|(?:[A-Z]\.){2,})(?:\b|\s)/u.test(value)) {
    return value;
  }
  return `${value[0].toLocaleLowerCase()}${value.slice(1)}`;
}

function lowerFirstPreservingPotentialName(value: string): string {
  const normalized = withoutTerminalPunctuation(value);
  const first = parseCreatorLanguageTerms(normalized)[0];
  if (
    (
      /^\p{Lu}[\p{L}\p{N}']*-[\p{L}\p{N}'-]+(?:\s|$)/u.test(normalized)
      || (
        /^\p{Lu}[\p{L}\p{N}'-]*$/u.test(first?.text ?? '')
        && hasLanguageTag(first, 'Noun')
        && hasLanguageTag(first, 'Singular')
      )
    )
  ) {
    return normalized;
  }
  return lowerFirst(normalized);
}

function withoutTerminalPunctuation(value: string): string {
  return normalizePromptValue(value).replace(/[.!?]+$/, '').trim();
}

function withIndefiniteArticle(value: string): string {
  const normalized = withoutTerminalPunctuation(value);
  if (!normalized || /^(?:a|an|the)\b/i.test(normalized)) return normalized;
  const firstWord = normalized.match(/^[A-Za-z]+/)?.[0] ?? '';
  const firstToken = normalized.match(/^[A-Za-z](?:[A-Za-z.]*)/)?.[0] ?? '';
  const acronym = firstToken.replace(/\./g, '');
  const isUppercaseAcronym = acronym.length >= 2 && acronym === acronym.toLocaleUpperCase();
  const soundsLikeConsonant = /^(?:uni(?:[^nmd]|$)|use|user|usual|euro|one|once|ubiq)/i.test(firstWord);
  const soundsLikeVowel = /^(?:honest|honor|hour|heir)/i.test(firstWord);
  const acronymIsPronouncedAsWord = isUppercaseAcronym
    && acronym.length >= 4
    && /[AEIOU]/.test(acronym);
  const acronymSoundsLikeVowel = isUppercaseAcronym && (
    acronymIsPronouncedAsWord
      ? /^[AEIOU]/.test(acronym)
      : /^[AEFHILMNORSX]/.test(acronym)
  );
  const useAn = isUppercaseAcronym
    ? acronymSoundsLikeVowel
    : soundsLikeVowel || (!soundsLikeConsonant && /^[aeiou]/i.test(firstWord));
  const article = useAn
    ? 'an'
    : 'a';
  return `${article} ${normalized}`;
}

function asSingleClothingPhrase(value: string): string {
  const normalized = withoutTerminalPunctuation(value);
  const terms = parseCreatorLanguageTerms(normalized);
  const firstBoundary = terms.findIndex((term) => hasLanguageTag(term, 'Preposition'));
  const headCandidates = (firstBoundary < 0 ? terms : terms.slice(0, firstBoundary))
    .filter((term) => hasLanguageTag(term, 'Noun'));
  const headTerm = headCandidates.at(-1) ?? terms.at(-1);
  const headWord = headTerm?.text ?? normalized.split(/\s+/).at(-1) ?? '';
  const normalizedHead = headWord.toLocaleLowerCase();
  const textLooksPlural = /s$/u.test(normalizedHead)
    && !/(?:ss|us|is|ous|ness)$/u.test(normalizedHead);
  const irregularPlural = /^(?:clothes|feet|jeans|men|pants|shorts|teeth|trousers|women)$/u.test(normalizedHead);
  const knownMassClothing = /^(?:footwear|hosiery|jewelry|jewellery|knitwear|outerwear)$/u.test(normalizedHead);
  const parserAllowsPlural = hasLanguageTag(headTerm, 'Plural')
    || /(?:^|\|)Plural(?:\||$)/u.test(headTerm?.switch ?? '');
  const pluralOrUncountable = hasLanguageTag(headTerm, 'Uncountable')
    || irregularPlural
    || knownMassClothing
    || (parserAllowsPlural && textLooksPlural);
  if (
    !normalized
    || /^(?:a|an|the|some)\b/i.test(normalized)
    || pluralOrUncountable
    || /^(?:attire|clothing|lingerie|armor|mail|sleepwear|underwear)$/i.test(headWord)
  ) {
    return normalized;
  }
  return withIndefiniteArticle(normalized);
}

function looksLikeClothingNounPhrase(value: string): boolean {
  const normalized = withoutTerminalPunctuation(value);
  const terms = parseCreatorLanguageTerms(value);
  const first = terms[0];
  if (!first) return false;
  if (/[\n\r|,;/&+•‣∙·]|\s[-–—]\s|\b(?:and|or)\b/iu.test(value)) return true;
  const nounAlternative = /(?:Noun|Plural)\|Verb|Verb\|(?:Noun|Plural)/u.test(first.switch ?? '');
  if (!hasLanguageTag(first, 'Noun') && !nounAlternative) return false;
  const next = terms[1];
  return hasLanguageTag(first, 'Uncountable')
    || hasLanguageTag(next, 'Conjunction')
    || hasLanguageTag(next, 'Preposition');
}

function asClothingPhrase(value: string): string {
  const normalized = withoutTerminalPunctuation(value);
  const parts = normalized.split(/(\s*,\s+(?:and|or)\s+|\s*,\s*|\s+(?:and|or)\s+)/iu);
  if (parts.length === 1) return asSingleClothingPhrase(normalized);

  return parts.map((part, index) => {
    if (index % 2 === 0) return asSingleClothingPhrase(part.trim());
    if (/^\s*,\s+and\s+$/iu.test(part)) return ', and ';
    if (/^\s*,\s+or\s+$/iu.test(part)) return ', or ';
    if (/^\s*,/u.test(part)) return ', ';
    if (/\bor\b/iu.test(part)) return ' or ';
    return ' and ';
  }).join('');
}

function phraseUsesPluralCopula(value: string): boolean {
  const terms = parseCreatorLanguageTerms(value);
  const firstBoundary = terms.findIndex((term) => (
    hasLanguageTag(term, 'Preposition') || hasLanguageTag(term, 'Conjunction')
  ));
  const head = (firstBoundary < 0 ? terms : terms.slice(0, firstBoundary))
    .filter((term) => hasLanguageTag(term, 'Noun'))
    .at(-1);
  return hasLanguageTag(head, 'Plural')
    || hasLanguageTag(head, 'Uncountable')
    || /^(?:labia|genitalia)$/i.test(head?.normal ?? '');
}

function possessive(name: string): string {
  return /s$/i.test(name) ? `${name}'` : `${name}'s`;
}

function sourceFieldLeaf(sourceField: string): string {
  return sourceField
    .replace(/\._extras\[\d+\]\.value$/, '')
    .replace(/\.value$/, '')
    .split('.')
    .at(-1)
    ?.replace(/\[\d+\]$/, '')
    ?? 'reference';
}

function humanizeField(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase();
}

function stripRedundantCustomPrefix(value: string, sourceLabel: string | undefined): string {
  const colonIndex = value.indexOf(':');
  if (colonIndex < 0 || !sourceLabel) return value;
  const prefix = humanizeField(value.slice(0, colonIndex));
  const labelParts = sourceLabel.split(':').map(humanizeField).filter(Boolean);
  return labelParts.includes(prefix) ? value.slice(colonIndex + 1).trim() : value;
}

function splitSentences(value: string): string[] {
  const normalized = normalizePromptValue(value);
  if (!normalized) return [];
  const protectedAbbreviations = new Set([
    'dr', 'mr', 'mrs', 'ms', 'prof', 'sr', 'jr', 'st', 'vs', 'etc', 'e.g', 'i.e',
  ]);
  const sentences: string[] = [];
  let start = 0;

  for (let index = 0; index < normalized.length; index += 1) {
    const punctuation = normalized[index];
    if (!'.!?'.includes(punctuation)) continue;
    if (
      punctuation === '.'
      && /\d/.test(normalized[index - 1] ?? '')
      && /\d/.test(normalized[index + 1] ?? '')
    ) {
      continue;
    }
    if (punctuation === '.') {
      const preceding = normalized.slice(0, index).match(/([A-Za-z](?:[A-Za-z.]*)?)$/)?.[1] ?? '';
      if (
        protectedAbbreviations.has(preceding.toLocaleLowerCase())
        || /^[A-Z]$/.test(preceding)
        || /^(?:[A-Z]\.)+[A-Z]$/.test(preceding)
      ) {
        continue;
      }
    }

    let punctuationEnd = index + 1;
    while (/[.!?]/.test(normalized[punctuationEnd] ?? '')) punctuationEnd += 1;
    let next = punctuationEnd;
    while (/\s/.test(normalized[next] ?? '')) next += 1;
    const nextCharacter = normalized[next] ?? '';
    const hasSentenceBoundary = next >= normalized.length
      || (next > punctuationEnd && /[A-Z0-9"'([]/.test(nextCharacter));
    if (!hasSentenceBoundary) continue;

    const sentence = normalized.slice(start, punctuationEnd).trim();
    if (sentence) sentences.push(sentence);
    start = next;
    index = next - 1;
  }

  const remainder = normalized.slice(start).trim();
  if (remainder) sentences.push(remainder);
  return sentences;
}

function splitLabeledFieldClauses(value: string): string[] {
  return splitSentences(value).flatMap((sentence) => (
    sentence.split(/\s*;\s*/u).map((part) => part.trim()).filter(Boolean)
  ));
}

/** Keep complete creator propositions or fail closed. Deterministic trimming
 * cannot know whether a later sentence or qualifier contains a boundary,
 * negation, relationship direction, or other durable meaning. */
function selectSafeCreatorExcerpt(value: string, maxChars: number): CreatorFactTransform {
  const normalized = normalizePromptValue(value);
  if (!normalized) return { value: '', safe: false, reason: 'empty_creator_reference' };

  if (normalized.length <= maxChars) {
    return {
      value: normalized,
      safe: true,
      reason: splitSentences(normalized).length > 1
        ? 'creator_reference_preserved_at_complete_sentence_boundaries'
        : 'creator_reference_already_concise',
    };
  }

  return {
    value: normalized,
    safe: false,
    reason: 'creator_reference_too_dense_for_safe_deterministic_compaction',
  };
}

function conjugateFirstVerb(value: string, form: 'Infinitive' | 'PresentTense'): string | null {
  const terms = parseCreatorLanguageTerms(value);
  const verbIndex = terms.findIndex((term) => hasLanguageTag(term, 'Verb'));
  const verb = terms[verbIndex];
  if (verbIndex < 0 || !verb?.text) return null;
  const conjugation = nlp(verb.text).verbs().conjugate()[0] as Record<string, string> | undefined;
  const replacement = conjugation?.[form]?.trim();
  if (!replacement) return null;
  const escapedVerb = verb.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return value.replace(new RegExp(`^(${terms.slice(0, verbIndex).map((term) => (
    term.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  )).join('\\s+')}${verbIndex ? '\\s+' : ''})${escapedVerb}\\b`, 'iu'), `$1${replacement}`);
}

function normalizeFirstPersonPredicate(value: string): string | null {
  const normalized = value.trim();
  const explicitAuxiliary = [
    [/^am\b/iu, 'is'],
    [/^was\b/iu, 'was'],
    [/^were\b/iu, 'was'],
    [/^have\b/iu, 'has'],
    [/^haven't\b/iu, 'has not'],
    [/^do\s+not\b/iu, 'does not'],
    [/^don't\b/iu, 'does not'],
  ] as const;
  for (const [pattern, replacement] of explicitAuxiliary) {
    if (pattern.test(normalized)) return normalized.replace(pattern, replacement);
  }
  if (/^(?:can|can't|cannot|could|may|might|must|shall|should|will|won't|would)\b/iu.test(normalized)) {
    return normalized;
  }
  return conjugateFirstVerb(normalized, 'PresentTense');
}

function rewriteEmbeddedSubjectReferences(
  value: string,
  characterName: string,
  subject: 'first_person' | 'singular_they',
): string {
  const subjectPossessive = possessive(characterName);
  if (subject === 'first_person') {
    return value
      .replace(/\bmyself\b/giu, 'themself')
      .replace(/\bmine\b/giu, subjectPossessive)
      .replace(/\bmy\b/giu, subjectPossessive)
      .replace(/\bme\b/giu, characterName);
  }

  return value
    .replace(/\b(?:themselves|themself)\b/giu, 'themself')
    .replace(/\btheirs\b/giu, subjectPossessive)
    .replace(/\btheir\b/giu, subjectPossessive);
}

function replaceLeadingSubject(value: string, characterName: string): string {
  const escapedName = characterName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const firstPerson = value.match(/^I\s+(.+)$/iu);
  if (firstPerson) {
    const predicate = normalizeFirstPersonPredicate(firstPerson[1]);
    return predicate
      ? `${characterName} ${rewriteEmbeddedSubjectReferences(predicate, characterName, 'first_person')}`
      : value;
  }
  if (/^my\b/iu.test(value)) {
    return value.replace(/^my\b/iu, possessive(characterName));
  }
  const singularThey = value.match(/^they\s+(.+)$/iu);
  if (singularThey) {
    const predicate = normalizeFirstPersonPredicate(singularThey[1]);
    return predicate
      ? `${characterName} ${rewriteEmbeddedSubjectReferences(predicate, characterName, 'singular_they')}`
      : value;
  }
  return value
    .replace(new RegExp(`^(?:${escapedName}|she|he)\\b`, 'i'), characterName)
    .replace(/^(?:her|his|their)\b/i, possessive(characterName));
}

function buildPastEventCapsule(value: string, characterName: string): string | null {
  const terms = parseCreatorLanguageTerms(value);
  const first = terms[0];
  if (!first) return null;
  if (/^born$/i.test(first.text)) return ensureSentence(`${characterName} was ${lowerFirst(value)}`);
  if (/^[A-Za-z']+ed\s+by\b/i.test(value)) {
    return ensureSentence(`${characterName} was ${lowerFirst(value)}`);
  }
  if (hasLanguageTag(first, 'Adjective') && /^[A-Za-z']+ed\s+(?:at|by|from|in|on|with|without)\b/i.test(value)) {
    return ensureSentence(`${characterName} was ${lowerFirst(value)}`);
  }
  if (hasLanguageTag(first, 'PastTense') && !hasLanguageTag(terms[1], 'Preposition')) {
    return ensureSentence(`${characterName} ${lowerFirst(value)}`);
  }
  return null;
}

function buildSubjectPredicateCapsule(value: string, characterName: string): string | null {
  const transformed: string[] = [];
  for (const sentence of splitSentences(value)) {
    const withLeadingSubject = replaceLeadingSubject(sentence, characterName);
    const escapedName = characterName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`^${escapedName}\\s+`, 'i').test(withLeadingSubject)) {
      transformed.push(ensureSentence(withLeadingSubject));
      continue;
    }
    if (startsWithPassiveOrAdjectivalPredicate(withLeadingSubject)) {
      transformed.push(ensureSentence(`${characterName} is ${lowerFirst(withLeadingSubject)}`));
      continue;
    }
    if (!startsWithFinitePredicate(withLeadingSubject)) return null;
    transformed.push(ensureSentence(`${characterName} ${lowerFirst(withLeadingSubject)}`));
  }
  return transformed.length ? transformed.join(' ') : null;
}

function buildUnambiguousSentenceCapsule(value: string, characterName: string): string | null {
  const transformed: string[] = [];
  const sentences = splitSentences(value);
  if (!sentences.length) return null;

  for (const sentence of sentences) {
    if (
      looksLikeAmbiguousNominalCompound(sentence)
      || looksLikeLeadingModifierNounPhrase(sentence)
    ) {
      return null;
    }
    const capsule = buildSubjectPredicateCapsule(sentence, characterName);
    if (!capsule) return null;
    transformed.push(capsule);
  }

  return transformed.join(' ');
}

function buildUnambiguousClauseSequenceCapsule(
  value: string,
  characterName: string,
): string | null {
  const clauses = splitLabeledFieldClauses(value);
  if (!clauses.length) return null;
  const transformed = clauses.map((clause) => (
    buildUnambiguousSentenceCapsule(clause, characterName)
  ));
  return transformed.every((clause): clause is string => Boolean(clause))
    ? transformed.join(' ')
    : null;
}

function buildRoleClausePredicateCapsule(
  value: string,
  characterName: string,
): string | null {
  const unambiguous = buildUnambiguousSentenceCapsule(value, characterName);
  if (unambiguous) return unambiguous;

  const terms = parseCreatorLanguageTerms(value);
  const first = terms[0];
  const directObject = terms[1];
  if (
    terms.length === 2
    && hasLanguageTag(first, 'Plural')
    && /^[\p{L}']+s$/u.test(first?.text ?? '')
    && hasLanguageTag(directObject, 'Noun')
    && !hasLanguageTag(directObject, 'Actor')
    && !hasLanguageTag(directObject, 'Person')
  ) {
    return ensureSentence(`${characterName} ${lowerFirst(value)}`);
  }
  return null;
}

function buildPassiveBodyMarkingCapsule(value: string, characterName: string): string | null {
  const terms = parseCreatorLanguageTerms(value);
  let predicateIndex = 0;
  while (
    hasLanguageTag(terms[predicateIndex], 'Adverb')
    || hasLanguageTag(terms[predicateIndex], 'Negative')
  ) predicateIndex += 1;
  const predicate = terms[predicateIndex];
  if (
    !predicate
    || (
      !hasLanguageTag(predicate, 'PastTense')
      && !/(?:Adj\|Past|Past\|Adj)/u.test(predicate.switch ?? '')
    )
  ) return null;

  return ensureSentence(`${characterName} is ${lowerFirst(value)}`);
}

function pluralizeFirstFinitePredicate(value: string): string | null {
  const leadingAuxiliary: Record<string, string> = {
    is: 'are',
    "isn't": 'are not',
    are: 'are',
    "aren't": 'are not',
    was: 'were',
    "wasn't": 'were not',
    were: 'were',
    "weren't": 'were not',
    has: 'have',
    "hasn't": 'have not',
    have: 'have',
    "haven't": 'have not',
    does: 'do',
    "doesn't": 'do not',
    do: 'do',
    "don't": 'do not',
  };
  const leading = value.match(/^([\p{L}']+)\b/iu)?.[1];
  const normalizedLeading = leading?.toLocaleLowerCase();
  if (leading && normalizedLeading && leadingAuxiliary[normalizedLeading]) {
    return value.replace(/^([\p{L}']+)\b/iu, leadingAuxiliary[normalizedLeading]);
  }

  const terms = parseCreatorLanguageTerms(value);
  let predicateIndex = finiteVerbIndex(terms);
  if (predicateIndex < 0 && startsWithFinitePredicate(value)) {
    predicateIndex = terms.findIndex((term) => (
      !hasLanguageTag(term, 'Adverb') && !hasLanguageTag(term, 'Negative')
    ));
  }
  const predicate = terms[predicateIndex];
  if (predicateIndex < 0 || !predicate?.text) return null;
  const lowerPredicate = predicate.text.toLocaleLowerCase();
  const conjugation = nlp(predicate.text).verbs().conjugate()[0] as Record<string, string> | undefined;
  const replacement = conjugation?.Infinitive;
  if (!replacement) return null;
  const escapedPredicate = predicate.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return value.replace(new RegExp(escapedPredicate, 'iu'), replacement);
}

function buildGenitalPredicateCapsule(value: string, characterName: string): string | null {
  const terms = parseCreatorLanguageTerms(value);
  const normalized = withoutTerminalPunctuation(value);
  if (/^no\s+\S/iu.test(normalized)) {
    return ensureSentence(`${possessive(characterName)} genitalia have ${lowerFirst(normalized)}`);
  }
  const anatomyShorthand = normalized.match(
    /^(circumcised|uncircumcised|pierced|unpierced)\s+(clitoris|genitals?|genitalia|labia|penis|scrotum|testicles|vagina|vulva)\b(.*)$/iu,
  );
  if (anatomyShorthand) {
    const phrase = `${anatomyShorthand[1]} ${anatomyShorthand[2]}${anatomyShorthand[3]}`.trim();
    if (/^(?:genitals?|genitalia)$/iu.test(anatomyShorthand[2])) {
      return ensureSentence(`${possessive(characterName)} genitalia are ${lowerFirst(anatomyShorthand[1])}${anatomyShorthand[3]}`);
    }
    return ensureSentence(
      `${possessive(characterName)} genitalia include ${phraseUsesPluralCopula(phrase)
        ? lowerFirst(phrase)
        : withIndefiniteArticle(lowerFirst(phrase))}`,
    );
  }
  if (hasLanguageTag(terms[0], 'Copula') || /^(?:isn't|wasn't|aren't|weren't)\b/iu.test(normalized)) {
    const pluralPredicate = pluralizeFirstFinitePredicate(normalized);
    return pluralPredicate
      ? ensureSentence(`${possessive(characterName)} genitalia ${lowerFirst(pluralPredicate)}`)
      : null;
  }
  if (/^(?:has|hasn't|have|haven't)\b/iu.test(normalized)) {
    if (/^(?:has|have)\s+(?:a|an)\s+(?:clitoris|penis|scrotum|vagina|vulva)\b/iu.test(normalized)) {
      return ensureSentence(`${characterName} ${lowerFirst(normalized)}`);
    }
    const pluralPredicate = pluralizeFirstFinitePredicate(normalized);
    return pluralPredicate
      ? ensureSentence(`${possessive(characterName)} genitalia ${lowerFirst(pluralPredicate)}`)
      : null;
  }
  if (startsWithPassiveOrAdjectivalPredicate(normalized)) return null;
  if (
    startsWithFinitePredicate(normalized)
    || startsWithBareInfinitive(normalized)
    || (
      hasLanguageTag(terms[0], 'Verb')
      && !hasLanguageTag(terms[0], 'PastTense')
      && !hasLanguageTag(terms[0], 'Adjective')
    )
  ) {
    const pluralPredicate = startsWithFinitePredicate(normalized)
      ? pluralizeFirstFinitePredicate(normalized)
      : lowerFirst(normalized);
    return pluralPredicate
      ? ensureSentence(`${possessive(characterName)} genitalia ${lowerFirst(pluralPredicate)}`)
      : null;
  }

  const subjectStart = hasLanguageTag(terms[0], 'Determiner') ? 1 : 0;
  const anatomyIndex = terms.findIndex((term, index) => (
    index >= subjectStart
    && /^(?:clitoris|genitals?|genitalia|labia|penis|scrotum|testicles|vagina|vulva)$/iu.test(term.normal)
  ));
  const predicateIndex = anatomyIndex + 1;
  const predicate = terms[predicateIndex];
  if (
    anatomyIndex < subjectStart
    || !predicate
    || !hasLanguageTag(predicate, 'Verb')
  ) {
    return null;
  }

  const subjectOffset = subjectStart === 1
    ? normalized.replace(/^[^\s]+\s+/u, '')
    : normalized;
  const subjectPhrase = terms.slice(subjectStart, predicateIndex)
    .map((term) => term.text)
    .join(' ');
  const remainder = subjectOffset.slice(subjectPhrase.length).trim();
  return remainder
    ? ensureSentence(`${possessive(characterName)} ${lowerFirst(subjectPhrase)} ${remainder}`)
    : null;
}

function normalizeCreatorListLines(value: string): string {
  return value
    .split(/\r?\n/gu)
    .map((line) => line.replace(/^\s*(?:[-*•]\s+|\d+[.)]\s+)/u, '').trim())
    .filter(Boolean)
    .join('; ');
}

function replaceFirstCharacterBodyPossessive(value: string, characterName: string): string {
  const bodyPart = '(?:hair|eye|eyes|eyebrow|eyebrows|cheek|cheeks|face|skin|arm|arms|hand|hands|finger|fingers|chest|breast|breasts|back|waist|hip|hips|thigh|thighs|leg|legs|knee|knees|foot|feet|neck|shoulder|shoulders|stomach|abdomen|wrist|wrists|ankle|ankles|genitals|penis|vulva|ass)';
  const pattern = new RegExp(`\\b(?:her|his|their)\\s+((?:(?:left|right|upper|lower)\\s+)?${bodyPart})\\b`, 'i');
  return splitSentences(value)
    .map((sentence) => sentence.replace(pattern, `${possessive(characterName)} $1`))
    .join(' ');
}

function containsAppearanceNoun(value: string): boolean {
  return /\b(?:hair|eyes?|skin|breasts?|chest)\b/i.test(value);
}

function buildCreatorFactCapsule(input: {
  character: RoleplayCharacterCardSource;
  sourceField: string;
  sourceLabel?: string;
  sourceValue: string;
  runtimeUse: CharacterPromptFactRuntimeUse;
}): CreatorFactTransform {
  const maxChars = input.sourceField === 'roleDescription'
    || input.sourceField.startsWith('relationships.')
    ? 260
    : input.sourceField.startsWith('sections[')
      ? 320
      : 220;
  const sourceValue = input.sourceValue.includes('\n')
    || input.sourceField.startsWith('preferredClothing.')
    || input.sourceField === 'roleDescription'
    || input.sourceField === 'background.jobOccupation'
    || input.sourceField === 'background.motivation'
    ? normalizeCreatorListLines(input.sourceValue)
    : input.sourceValue;
  const excerpt = selectSafeCreatorExcerpt(sourceValue, maxChars);
  if (!excerpt.safe) return excerpt;

  const characterName = input.character.name || 'This character';
  const namedExcerpt = replaceLeadingSubject(excerpt.value, characterName);
  const subjectPredicate = buildSubjectPredicateCapsule(excerpt.value, characterName);

  if (input.sourceField === 'roleDescription') {
    const roleSentences = splitLabeledFieldClauses(namedExcerpt);
    if (roleSentences.length > 1) {
      const rolePredicates = roleSentences.map((sentence) => (
        buildRoleClausePredicateCapsule(sentence, characterName)
      ));
      if (rolePredicates.every((sentence): sentence is string => Boolean(sentence))) {
        return { ...excerpt, value: rolePredicates.join(' ') };
      }
      const firstRole = withoutTerminalPunctuation(roleSentences[0])
        .replace(/^(?:a|an)\s+/i, '');
      const remaining = roleSentences.slice(1)
        .map((sentence) => buildUnambiguousSentenceCapsule(sentence, characterName));
      if (
        firstRole
        && !buildRoleClausePredicateCapsule(firstRole, characterName)
        && remaining.every((sentence): sentence is string => Boolean(sentence))
      ) {
        return {
          ...excerpt,
          value: [
            ensureSentence(`${characterName} serves in the role of ${parseCreatorLanguageTerms(firstRole).length === 1
              ? lowerFirst(firstRole)
              : firstRole}`),
            ...remaining,
          ].join(' '),
        };
      }
      return {
        ...excerpt,
        value: recordedCreatorPhrase(characterName, 'role description', namedExcerpt),
        reason: 'ambiguous_creator_phrase_preserved_under_field_label',
      };
    }
    const ambiguousNominal = looksLikeAmbiguousNominalCompound(namedExcerpt);
    if (
      subjectPredicate
      && !ambiguousNominal
      && !looksLikeLeadingModifierNounPhrase(namedExcerpt)
    ) {
      return { ...excerpt, value: subjectPredicate };
    }
    if (ambiguousNominal) {
      return {
        ...excerpt,
        value: recordedCreatorPhrase(characterName, 'role description', namedExcerpt),
        reason: 'ambiguous_creator_phrase_preserved_under_field_label',
      };
    }
    const role = withoutTerminalPunctuation(namedExcerpt).match(
      /^(?:(?:a|an)\s+)?(.+?)\s+(?:trying|working|seeking)\s+to\s+(.+)$/i,
    );
    if (role) {
      return {
        ...excerpt,
        value: `${ensureSentence(`${characterName} serves in the role of ${lowerFirstPreservingPotentialName(role[1])}`)} ${ensureSentence(`${characterName} aims to ${lowerFirst(role[2])}`)}`,
      };
    }
    const worksAsRole = withoutTerminalPunctuation(roleSentences[0] || '')
      .match(/^works\s+as\s+(.+)$/i);
    if (worksAsRole) {
      const remaining = roleSentences.slice(1)
        .map((sentence) => buildSubjectPredicateCapsule(sentence, characterName));
      if (remaining.some((sentence) => !sentence)) {
        return {
          ...excerpt,
          safe: false,
          reason: 'creator_reference_requires_manual_semantic_compaction',
        };
      }
      return {
        ...excerpt,
        value: [
          ensureSentence(`${characterName} works as ${lowerFirstPreservingPotentialName(worksAsRole[1])}`),
          ...remaining.filter((sentence): sentence is string => Boolean(sentence)),
        ].join(' '),
      };
    }
    const roleValue = namedExcerpt.replace(/^(?:a|an)\s+/i, '');
    return {
      ...excerpt,
      value: ensureSentence(
        `${characterName} serves in the role of ${parseCreatorLanguageTerms(roleValue).length === 1
          ? lowerFirst(roleValue)
          : lowerFirstPreservingPotentialName(roleValue)}`,
      ),
    };
  }

  if (input.sourceField.startsWith('physicalAppearance.')) {
    const field = sourceFieldLeaf(input.sourceField);
    const sourceLabel = input.sourceLabel?.trim();
    if (sourceLabel && input.sourceField.includes('._extras[')) {
      return {
        ...excerpt,
        value: recordedCreatorLabelPhrase(characterName, sourceLabel, namedExcerpt),
        reason: 'creator_physical_phrase_preserved_under_source_label',
      };
    }
    const label = humanizeField(field);
    if (startsWithNounCopula(namedExcerpt)) {
      return {
        ...excerpt,
        value: ensureSentence(`${possessive(characterName)} ${lowerFirst(namedExcerpt)}`),
      };
    }
    if (hasExplicitSubjectPredicate(namedExcerpt)) {
      return {
        ...excerpt,
        value: ensureSentence(replaceFirstCharacterBodyPossessive(namedExcerpt, characterName)),
      };
    }
    if (namedExcerpt.startsWith(possessive(characterName))) {
      return { ...excerpt, value: ensureSentence(namedExcerpt) };
    }
    if (field === 'eyeColor') {
      const eyeColor = withoutTerminalPunctuation(namedExcerpt)
        .replace(/^(?:eye\s+color|eyes?)\s*(?:(?:is|are)\s+|[:=]\s*)?/i, '')
        .replace(/\s+eyes?$/i, '')
        .trim();
      return { ...excerpt, value: ensureSentence(`${possessive(characterName)} eyes are ${lowerFirstPreservingPotentialName(eyeColor)}`) };
    }
    if (containsAppearanceNoun(namedExcerpt)) {
      return { ...excerpt, value: ensureSentence(`${characterName} has ${lowerFirstPreservingPotentialName(namedExcerpt)}`) };
    }
    if (field === 'height') {
      return { ...excerpt, value: ensureSentence(`${characterName} is ${lowerFirstPreservingPotentialName(namedExcerpt)}`) };
    }
    if (field === 'bodyMarkings') {
      const passiveMarking = buildPassiveBodyMarkingCapsule(namedExcerpt, characterName);
      if (passiveMarking) return { ...excerpt, value: passiveMarking };
      if (subjectPredicate) return { ...excerpt, value: subjectPredicate };
      return {
        ...excerpt,
        value: ensureSentence(`${possessive(characterName)} body markings include ${lowerFirstPreservingPotentialName(namedExcerpt)}`),
      };
    }
    if (field === 'genitalia') {
      const genitalPredicate = buildGenitalPredicateCapsule(namedExcerpt, characterName);
      if (genitalPredicate) return { ...excerpt, value: genitalPredicate };
      const genitalPhrase = lowerFirstPreservingPotentialName(namedExcerpt);
      if (parseCreatorLanguageTerms(genitalPhrase).length === 1) {
        return {
          ...excerpt,
          value: recordedCreatorPhrase(characterName, 'genitalia', namedExcerpt),
          reason: 'creator_genital_shorthand_preserved_under_field_label',
        };
      }
      const containsAnatomyNoun = parseCreatorLanguageTerms(genitalPhrase).some((term) => (
        /^(?:clitoris|genitals?|genitalia|labia|penis|scrotum|testicles|vagina|vulva)$/iu.test(term.normal)
      ));
      if (!containsAnatomyNoun) {
        return {
          ...excerpt,
          value: recordedCreatorPhrase(characterName, 'genitalia', namedExcerpt),
          reason: 'creator_genital_fragment_preserved_under_field_label',
        };
      }
      const pluralGenitalPhrase = phraseUsesPluralCopula(genitalPhrase);
      return {
        ...excerpt,
        value: ensureSentence(
          `${possessive(characterName)} genitalia include ${pluralGenitalPhrase
            ? genitalPhrase
            : withIndefiniteArticle(genitalPhrase)}`,
        ),
      };
    }
    return {
      ...excerpt,
      value: ensureSentence(
        `${possessive(characterName)} ${label} is ${lowerFirstPreservingPotentialName(namedExcerpt)}`,
      ),
    };
  }

  if (input.sourceField.startsWith('preferredClothing.')) {
    const context = humanizeField(sourceFieldLeaf(input.sourceField));
    const sourceContext = input.sourceLabel?.trim();
    if (sourceContext) {
      return {
        ...excerpt,
        value: recordedCreatorLabelPhrase(characterName, sourceContext, namedExcerpt),
        reason: 'creator_clothing_phrase_preserved_under_source_label',
      };
    }
    if (/^wears?\b/iu.test(namedExcerpt) && subjectPredicate) {
      return { ...excerpt, value: subjectPredicate };
    }
    if (looksLikeClothingNounPhrase(namedExcerpt)) {
      const fieldLabel: Record<string, string> = {
        casual: 'casual clothing',
        work: 'work clothing',
        sleep: 'sleep clothing',
        undergarments: 'preferred undergarments',
        miscellaneous: 'preferred clothing',
      };
      return {
        ...excerpt,
        value: recordedCreatorPhrase(
          characterName,
          sourceContext ?? fieldLabel[context] ?? `${context} clothing`,
          namedExcerpt,
        ),
        reason: 'creator_clothing_phrase_preserved_under_field_label',
      };
    }
    if (
      subjectPredicate
      && startsWithFinitePredicate(namedExcerpt)
      && !looksLikeLeadingModifierNounPhrase(namedExcerpt)
      && !looksLikeClothingNounPhrase(namedExcerpt)
    ) {
      return { ...excerpt, value: subjectPredicate };
    }
    const clothing = asClothingPhrase(lowerFirstPreservingPotentialName(namedExcerpt));
    const contextSentence: Record<string, string> = {
      casual: `${possessive(characterName)} casual clothing includes ${clothing}`,
      work: `${characterName} wears ${clothing} for work`,
      sleep: `${characterName} wears ${clothing} to sleep`,
      undergarments: `${possessive(characterName)} preferred undergarments include ${clothing}`,
      miscellaneous: `${possessive(characterName)} preferred clothing includes ${clothing}`,
    };
    return {
      ...excerpt,
      value: ensureSentence(contextSentence[context] ?? `${characterName} wears ${clothing} for ${context}`),
    };
  }

  if (input.sourceField.startsWith('tone.')) {
    const sourceLabel = input.sourceLabel?.trim();
    const normalizedSourceLabel = sourceLabel ? humanizeField(sourceLabel) : undefined;
    const isGenericToneLabel = /^(?:delivery|diction|speaking style)$/iu.test(normalizedSourceLabel ?? '');
    if (sourceLabel && !isGenericToneLabel) {
      return {
        ...excerpt,
        value: recordedCreatorLabelPhrase(characterName, sourceLabel, namedExcerpt),
        reason: 'creator_tone_phrase_preserved_under_field_label',
      };
    }
    if (subjectPredicate && startsWithFinitePredicate(namedExcerpt)) {
      return { ...excerpt, value: subjectPredicate };
    }
    return {
      ...excerpt,
      value: ensureSentence(`${possessive(characterName)} speaking style is ${lowerFirstPreservingPotentialName(namedExcerpt)}`),
    };
  }

  if (input.sourceField.startsWith('background.')) {
    const field = sourceFieldLeaf(input.sourceField);
    if (input.sourceLabel?.trim()) {
      return {
        ...excerpt,
        value: recordedCreatorLabelPhrase(characterName, input.sourceLabel, namedExcerpt),
        reason: 'creator_background_phrase_preserved_under_source_label',
      };
    }
    if (field === 'jobOccupation') {
      const jobSentences = splitLabeledFieldClauses(namedExcerpt);
      if (jobSentences.length > 1) {
        const completePredicates = buildUnambiguousClauseSequenceCapsule(
          namedExcerpt,
          characterName,
        );
        return completePredicates
          ? { ...excerpt, value: completePredicates }
          : {
            ...excerpt,
            value: recordedCreatorPhrase(characterName, 'occupation', namedExcerpt),
            reason: 'ambiguous_creator_phrase_preserved_under_field_label',
          };
      }
      const jobTerms = parseCreatorLanguageTerms(namedExcerpt);
      const leadingPastParticipleNounPhrase = hasLanguageTag(jobTerms[0], 'PastTense')
        && hasLanguageTag(jobTerms[1], 'Noun');
      const ambiguousNominal = looksLikeAmbiguousNominalCompound(namedExcerpt);
      if (
        subjectPredicate
        && !leadingPastParticipleNounPhrase
        && !ambiguousNominal
      ) {
        return { ...excerpt, value: subjectPredicate };
      }
      if (ambiguousNominal) {
        return {
          ...excerpt,
          value: recordedCreatorPhrase(characterName, 'occupation', namedExcerpt),
          reason: 'ambiguous_creator_phrase_preserved_under_field_label',
        };
      }
      return {
        ...excerpt,
        value: ensureSentence(
          `${characterName} works in the role of ${lowerFirstPreservingPotentialName(namedExcerpt.replace(/^(?:a|an)\s+/i, ''))}`,
        ),
      };
    }
    if (field === 'residence') {
      if (subjectPredicate) return { ...excerpt, value: subjectPredicate };
      return {
        ...excerpt,
        value: ensureSentence(`${characterName} lives in ${lowerFirstPreservingPotentialName(namedExcerpt)}`),
      };
    }
    if (field === 'hobbies') {
      const ambiguousNominal = looksLikeAmbiguousNominalCompound(namedExcerpt)
        || looksLikeAmbiguousActivityNounPhrase(namedExcerpt);
      if (
        subjectPredicate
        && !ambiguousNominal
      ) {
        return { ...excerpt, value: subjectPredicate };
      }
      if (ambiguousNominal) {
        return {
          ...excerpt,
          value: recordedCreatorPhrase(characterName, 'hobbies', namedExcerpt),
          reason: 'ambiguous_creator_phrase_preserved_under_field_label',
        };
      }
      return { ...excerpt, value: `${possessive(characterName)} hobbies: ${ensureSentence(namedExcerpt)}` };
    }
    if (field === 'motivation') {
      const motivationSentences = splitLabeledFieldClauses(namedExcerpt);
      if (motivationSentences.length > 1) {
        const completePredicates = buildUnambiguousClauseSequenceCapsule(
          namedExcerpt,
          characterName,
        );
        return completePredicates
          ? { ...excerpt, value: completePredicates }
          : {
            ...excerpt,
            value: recordedCreatorPhrase(characterName, 'motivation', namedExcerpt),
            reason: 'ambiguous_creator_phrase_preserved_under_field_label',
          };
      }
      const ambiguousNominal = looksLikeAmbiguousNominalCompound(namedExcerpt)
        || looksLikeLeadingModifierNounPhrase(namedExcerpt);
      if (
        subjectPredicate
        && !ambiguousNominal
      ) {
        return { ...excerpt, value: subjectPredicate };
      }
      if (ambiguousNominal) {
        return {
          ...excerpt,
          value: recordedCreatorPhrase(characterName, 'motivation', namedExcerpt),
          reason: 'ambiguous_creator_phrase_preserved_under_field_label',
        };
      }
      return {
        ...excerpt,
        value: ensureSentence(startsWithBareInfinitive(namedExcerpt)
          ? `${characterName} is motivated to ${lowerFirst(namedExcerpt)}`
          : `${possessive(characterName)} motivation is ${lowerFirstPreservingPotentialName(namedExcerpt)}`),
      };
    }
    if (field === 'educationLevel') {
      return {
        ...excerpt,
        value: ensureSentence(
          `${possessive(characterName)} recorded education level is "${withoutTerminalPunctuation(namedExcerpt)}"`,
        ),
      };
    }
    if (field === 'financialStatus') {
      if (subjectPredicate) return { ...excerpt, value: subjectPredicate };
      return { ...excerpt, value: ensureSentence(`${possessive(characterName)} financial situation is ${lowerFirstPreservingPotentialName(namedExcerpt)}`) };
    }
  }

  if (input.sourceField.startsWith('keyLifeEvents.')) {
    const pastEvent = buildPastEventCapsule(namedExcerpt, characterName);
    if (pastEvent) return { ...excerpt, value: pastEvent };
    if (subjectPredicate) return { ...excerpt, value: subjectPredicate };
    if (hasExplicitSubjectPredicate(namedExcerpt)) {
      return { ...excerpt, value: ensureSentence(namedExcerpt) };
    }
    return {
      ...excerpt,
      value: ensureSentence(`${possessive(characterName)} history records this event: ${lowerFirstPreservingPotentialName(namedExcerpt)}`),
    };
  }

  if (input.sourceField.startsWith('relationships.')) {
    const target = input.sourceLabel?.trim() || 'this person';
    const relationshipClauses = splitLabeledFieldClauses(namedExcerpt);
    if (input.sourceValue.includes('\n') && relationshipClauses.length > 1) {
      const relationshipPredicates = relationshipClauses.map((clause) => (
        buildSubjectPredicateCapsule(
          startsWithFinitePredicate(clause)
            ? `${clause[0].toLocaleLowerCase()}${clause.slice(1)}`
            : clause,
          characterName,
        )
      ));
      if (relationshipPredicates.every((clause): clause is string => Boolean(clause))) {
        return { ...excerpt, value: relationshipPredicates.join(' ') };
      }
      return {
        ...excerpt,
        value: `${possessive(characterName)} relationship with ${target}: ${relationshipClauses
          .map(ensureSentence)
          .join(' ')}`,
        reason: 'relationship_clauses_preserved_at_complete_boundaries',
      };
    }
    if (subjectPredicate) return { ...excerpt, value: subjectPredicate };
    if (hasExplicitSubjectPredicate(namedExcerpt)) {
      return { ...excerpt, value: ensureSentence(namedExcerpt) };
    }
    return {
      ...excerpt,
      value: ensureSentence(`${possessive(characterName)} relationship with ${target} is ${lowerFirstPreservingPotentialName(namedExcerpt)}`),
    };
  }

  if (input.sourceField.startsWith('fears.') || input.sourceField === 'personality.fears') {
    const fearClauses = splitLabeledFieldClauses(excerpt.value);
    if (input.sourceValue.includes('\n') && fearClauses.length > 1) {
      const transformedClauses = fearClauses.map((clause) => buildCreatorFactCapsule({
        ...input,
        sourceValue: clause,
      }));
      if (transformedClauses.every((clause) => clause.safe)) {
        return {
          ...excerpt,
          value: transformedClauses.map((clause) => clause.value).join(' '),
          reason: 'fear_clauses_preserved_at_complete_boundaries',
        };
      }
    }
    const normalizedFear = withoutTerminalPunctuation(namedExcerpt);
    if (/^(?:(?:do|does|did)\s+not|(?:don't|doesn't|didn't)|(?:cannot|can't|won't)|never)\s+fear\b/iu.test(normalizedFear)) {
      return { ...excerpt, value: ensureSentence(characterName + ' ' + lowerFirst(normalizedFear)) };
    }
    const lackingFear = normalizedFear.match(/^lacking\s+(.+\bfear\b.*)$/iu);
    if (lackingFear) {
      return { ...excerpt, value: ensureSentence(characterName + ' lacks ' + lowerFirst(lackingFear[1])) };
    }
    if (/^lacks?\b.*\bfear\b/iu.test(normalizedFear)) {
      return { ...excerpt, value: ensureSentence(characterName + ' ' + lowerFirst(normalizedFear)) };
    }
    if (/^(?:free\s+(?:of|from)|devoid\s+of)\b.*\b(?:fear|afraid)\b/iu.test(normalizedFear)) {
      return { ...excerpt, value: ensureSentence(`${characterName} is ${lowerFirst(normalizedFear)}`) };
    }
    if (/^(?:has|is)\b/iu.test(normalizedFear)) {
      return { ...excerpt, value: ensureSentence(`${characterName} ${lowerFirst(normalizedFear)}`) };
    }
    if (/^without\b.*\bfear\b/iu.test(normalizedFear)) {
      return { ...excerpt, value: ensureSentence(`${characterName} is ${lowerFirst(normalizedFear)}`) };
    }
    const directFear = normalizedFear.match(/^(?:fear|afraid)\s+of\s+(.+)$/iu);
    if (directFear) {
      return {
        ...excerpt,
        value: ensureSentence(`${characterName} fears ${lowerFirstPreservingPotentialName(directFear[1])}`),
      };
    }
    if (/^(?:(?:almost|nearly|virtually|practically)\s+)?no\s+(?:real\s+)?fear\b/iu.test(normalizedFear)) {
      return { ...excerpt, value: ensureSentence(`${characterName} has ${lowerFirst(normalizedFear)}`) };
    }
    if (/^(?:hardly|barely|scarcely)\s+afraid\b/iu.test(normalizedFear)) {
      return { ...excerpt, value: ensureSentence(`${characterName} is ${lowerFirst(normalizedFear)}`) };
    }
    if (/^(?:very\s+)?little\s+fear\b/iu.test(normalizedFear)) {
      return { ...excerpt, value: ensureSentence(`${characterName} has ${lowerFirst(normalizedFear)}`) };
    }
    if (/^(?:rarely|seldom|infrequently|occasionally)\s+afraid\b/iu.test(normalizedFear)) {
      return { ...excerpt, value: ensureSentence(`${characterName} is ${lowerFirst(normalizedFear)}`) };
    }
    if (subjectPredicate && startsWithFinitePredicate(normalizedFear)) {
      return { ...excerpt, value: subjectPredicate };
    }
    const fearTerms = parseCreatorLanguageTerms(normalizedFear);
    if (
      fearTerms.some((term) => term.normal === 'afraid')
      && finiteVerbIndex(fearTerms) < 0
    ) {
      return { ...excerpt, value: ensureSentence(`${characterName} is ${lowerFirst(normalizedFear)}`) };
    }
    if (
      fearTerms.some((term) => term.normal === 'fear' && hasLanguageTag(term, 'Noun'))
      && finiteVerbIndex(fearTerms) < 0
    ) {
      return { ...excerpt, value: ensureSentence(`${characterName} has ${lowerFirst(normalizedFear)}`) };
    }
    if (
      /\b(?:free\s+(?:of|from)|devoid\s+of|zero|not|never|without|lack|lacks|lacking)\b.*\b(?:fear|afraid)\b/iu.test(normalizedFear)
      || /\b(?:isn't|aren't|wasn't|weren't|doesn't|don't|didn't|can't|cannot|won't)\b.*\b(?:fear|afraid)\b/iu.test(normalizedFear)
    ) {
      const negativePredicate = buildSubjectPredicateCapsule(normalizedFear, characterName);
      if (negativePredicate) return { ...excerpt, value: negativePredicate };
    }
    if (subjectPredicate && /\b(?:not|never|no|without|lack|lacks|lacking)\b/i.test(namedExcerpt)) {
      return { ...excerpt, value: subjectPredicate };
    }
    if (subjectPredicate && !/\b(?:fear|afraid|being)\b/i.test(namedExcerpt)) {
      return { ...excerpt, value: subjectPredicate };
    }
    const escapedName = characterName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (/^[\p{L}'-]+s\b.*\bno\b.*\bfear\b/iu.test(normalizedFear)) {
      return { ...excerpt, value: ensureSentence(`${characterName} ${lowerFirst(normalizedFear)}`) };
    }
    const noFear = normalizedFear.match(/^no\b.*\bfear\b.*$/iu);
    if (noFear) {
      return { ...excerpt, value: ensureSentence(`${characterName} has ${lowerFirst(normalizedFear)}`) };
    }
    const withoutFear = normalizedFear.match(/^without\b.*\bfear\b.*$/iu);
    if (withoutFear) {
      return { ...excerpt, value: ensureSentence(`${characterName} is ${lowerFirst(normalizedFear)}`) };
    }
    const explicitFear = normalizedFear.match(
      new RegExp(`^(?:(?:${escapedName}(?:'s)?|her|his|their)\\s+)?(?:greatest\\s+)?fear\\s+(?:is|of)\\s+(.+)$`, 'iu'),
    ) ?? normalizedFear.match(/^(?:afraid\s+of|fears\s+of|feared\s+of|fears|feared|is afraid of)\s+(.+)$/iu);
    if (explicitFear && splitSentences(explicitFear[1]).length === 1) {
      return {
        ...excerpt,
        value: ensureSentence(`${characterName} fears ${lowerFirstPreservingPotentialName(explicitFear[1])}`),
      };
    }
    if (hasExplicitSubjectPredicate(normalizedFear)) {
      return { ...excerpt, value: ensureSentence(normalizedFear) };
    }
    const fearSentences = splitSentences(normalizedFear);
    if (
      fearSentences.length === 1
      && (
        finiteVerbIndex(fearTerms) < 0
        || /^being\b/iu.test(normalizedFear)
      )
      && !/[;:]/u.test(normalizedFear)
    ) {
      return {
        ...excerpt,
        value: ensureSentence(`${characterName} fears ${lowerFirstPreservingPotentialName(normalizedFear)}`),
      };
    }
    return {
      ...excerpt,
      value: recordedCreatorLabelPhrase(
        characterName,
        input.sourceLabel?.trim() || 'Fear reference',
        namedExcerpt,
      ),
      reason: 'ambiguous_creator_fear_preserved_under_source_label',
    };
  }

  if (input.sourceField.startsWith('personality.')) {
    const trait = input.sourceLabel?.trim();
    if (trait) {
      return {
        ...excerpt,
        value: recordedCreatorLabelPhrase(characterName, trait, subjectPredicate ?? namedExcerpt),
        reason: 'creator_personality_phrase_preserved_under_source_label',
      };
    }
    if (subjectPredicate) return { ...excerpt, value: subjectPredicate };
    return {
      ...excerpt,
      value: ensureSentence(`${possessive(characterName)} behavior is ${lowerFirst(namedExcerpt)}`),
    };
  }

  if (input.sourceField.startsWith('sections[')) {
    const customExcerpt = stripRedundantCustomPrefix(excerpt.value, input.sourceLabel);
    const customNamedExcerpt = replaceLeadingSubject(customExcerpt, characterName);
    const customSentences = splitSentences(customNamedExcerpt);
    const customAmbiguousNominal = customSentences.some((sentence) => (
      looksLikeAmbiguousNominalCompound(sentence)
      || looksLikeLeadingModifierNounPhrase(sentence)
    ));
    const customSubjectPredicate = parseCreatorLanguageTerms(customExcerpt).length > 1
      && !customAmbiguousNominal
      ? buildUnambiguousSentenceCapsule(customExcerpt, characterName)
      : null;
    if (customSubjectPredicate) {
      const label = withoutTerminalPunctuation(input.sourceLabel?.trim() || 'Custom reference');
      return { ...excerpt, value: `${label}: ${customSubjectPredicate}` };
    }
    const label = withoutTerminalPunctuation(input.sourceLabel?.trim() || 'Custom reference');
    return {
      ...excerpt,
      value: `${label}: ${splitSentences(customNamedExcerpt).map(ensureSentence).join(' ')}`,
      reason: splitSentences(customNamedExcerpt).length > 1
        ? 'creator_reference_preserved_as_labeled_complete_sentences'
        : 'creator_reference_preserved_as_labeled_fact',
    };
  }

  const label = humanizeField(sourceFieldLeaf(input.sourceField));
  if (subjectPredicate) return { ...excerpt, value: subjectPredicate };
  return {
    ...excerpt,
    value: ensureSentence(`${possessive(characterName)} ${label} is ${lowerFirst(namedExcerpt)}`),
  };
}

function canonicalPhysicalSubject(value: string): string {
  const normalized = humanizeField(value);
  if (/^(?:eye|eyes|eye colour|eye color|eye hue|eye shade|iris|iris colour|iris color|iris hue|iris shade)$/.test(normalized)) return 'eye color';
  if (/^(?:hair|hair colour|hair color)$/.test(normalized)) return 'hair color';
  if (/^(?:skin|skin colour|skin color|skin tone)$/.test(normalized)) return 'skin tone';
  if (/^(?:breast|breasts|breast size)$/.test(normalized)) return 'breast size';
  if (/^(?:marking|markings|body marking|body markings)$/.test(normalized)) return 'body markings';
  if (/^(?:genital|genitals|genitalia)$/.test(normalized)) return 'genitalia';
  return normalized;
}

function isCustomPreferenceProposition(value: string, characterName: string): boolean {
  const escapedName = characterName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(
    `^(?:(?:${escapedName}|I|she|he|they)\\s+)?(?:prefers?|likes?|enjoys?|dislikes?|hates?|avoids?|needs?|wants?)\\b`,
    'iu',
  ).test(value.trim());
}

function semanticSubject(
  sourceField: string,
  sourceLabel: string | undefined,
  sourceValue: string,
  characterName: string,
): string {
  if (sourceField.startsWith('physicalAppearance.')) {
    return canonicalPhysicalSubject(sourceLabel || sourceFieldLeaf(sourceField));
  }
  if (sourceField.startsWith('relationships.')) return `relationship:${sourceLabel || 'unspecified'}`;
  if (sourceField.startsWith('sections[')) {
    if (isCustomPreferenceProposition(sourceValue, characterName)) {
      return 'custom:preference';
    }
    return `custom:${sourceLabel || sourceField}`;
  }
  if (sourceField.startsWith('personality.')) return `personality:${sourceLabel || 'behavior'}`;
  if (sourceField.includes('._extras[') && sourceLabel) {
    return humanizeField(sourceLabel);
  }
  return humanizeField(sourceFieldLeaf(sourceField));
}

function selectionDedupeKey(fact: CharacterPromptFact): string {
  return fact.semanticKey;
}

function canonicalStructuredMeaning(
  input: CreateCharacterPromptFactInput,
  subject: string,
  renderedValue: string,
): string {
  const normalizedName = input.characterName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const semanticSeed = input.sourceField.startsWith('physicalAppearance.')
    || (
      input.sourceField.startsWith('sections[')
      && isCustomPreferenceProposition(input.sourceValue, input.characterName)
    )
    ? input.sourceValue
    : renderedValue;
  let meaning = normalizePromptValue(semanticSeed)
    .toLocaleLowerCase()
    .replace(new RegExp(`^(?:${normalizedName}(?:'s)?|i|she|he|they|her|his|their)\\s+`, 'i'), '')
    .replace(/[.!?]+$/g, '')
    .trim();

  if (
    input.sourceField.startsWith('sections[')
    && isCustomPreferenceProposition(input.sourceValue, input.characterName)
  ) {
    meaning = meaning
      .replace(/^(?:prefer|prefers|like|likes|enjoy|enjoys|need|needs|want|wants)\s+/iu, 'preference ')
      .replace(/^(?:dislike|dislikes|hate|hates|avoid|avoids)\s+/iu, 'avoidance ');
  }

  if (input.sourceField.startsWith('physicalAppearance.')) {
    const physicalAliases: Record<string, string> = {
      'eye color': '(?:eye\\s+(?:colou?r|hue|shade)|iris(?:es)?\\s+(?:colou?r|hue|shade)|iris(?:es)?|eyes?)',
      'hair color': '(?:hair\\s+color|hair)',
      'skin tone': '(?:skin\\s+tone|skin)',
      height: '(?:height)',
      build: '(?:build|body\\s+build)',
      'body hair': '(?:body\\s+hair)',
      'breast size': '(?:breast\\s+size|breasts?)',
      genitalia: '(?:genitalia|genitals)',
      makeup: '(?:makeup)',
      'body markings': '(?:body\\s+markings?|markings?)',
    };
    const alias = physicalAliases[subject];
    if (alias) {
      meaning = meaning.replace(new RegExp(`^${alias}\\s*(?:(?:is|are|has|have)\\s+|[:=]\\s*)?`, 'i'), '');
      meaning = meaning.replace(new RegExp(`\\s+${alias}$`, 'i'), '');
    }
  }

  if (input.sourceField.startsWith('relationships.')) {
    meaning = meaning.replace(/^(?:relationship\s+(?:with|to)\s+[^:]+\s+(?:is|was)\s+)/i, '');
  }

  return meaning
    .replace(/[^\p{L}\p{N}']+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildSemanticKey(input: CreateCharacterPromptFactInput, value: string): string {
  const subject = semanticSubject(
    input.sourceField,
    input.sourceLabel,
    input.sourceValue,
    input.characterName,
  )
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
  const orderedMeaning = canonicalStructuredMeaning(input, subject, value);
  const fallback = normalizePromptValue(value).toLocaleLowerCase();
  return `${input.characterId}:${input.runtimeUse}:${subject}:${orderedMeaning || fallback}`;
}

export function createCharacterPromptFact(
  input: CreateCharacterPromptFactInput,
): CharacterPromptFact {
  const normalizedSourceValue = normalizePromptValue(input.sourceValue);
  const value = normalizePromptValue(input.promptValue ?? input.sourceValue);
  const disposition = input.disposition === 'transformed' && value === normalizedSourceValue
    ? 'included'
    : input.disposition;
  const modelFacing = disposition === 'included' || disposition === 'transformed';

  return Object.freeze({
    characterId: input.characterId,
    characterName: input.characterName,
    sourceField: input.sourceField,
    sourceLabel: input.sourceLabel,
    sourceValue: input.sourceValue,
    sourceSurface: input.sourceSurface,
    value,
    semanticKey: buildSemanticKey(input, value),
    runtimeUse: input.runtimeUse,
    authority: input.authority,
    relevance: input.relevance,
    visibility: input.visibility,
    wordingPolicy: input.wordingPolicy,
    modelFacing,
    disposition,
    reason: input.reason,
  });
}

type CharacterFactPolicy = Pick<
  CreateCharacterPromptFactInput,
  | 'runtimeUse'
  | 'authority'
  | 'relevance'
  | 'visibility'
  | 'wordingPolicy'
  | 'disposition'
  | 'reason'
>;

function text(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
}

function appendFact(
  facts: CharacterPromptFact[],
  character: RoleplayCharacterCardSource,
  sourceField: string,
  sourceValue: unknown,
  policy: CharacterFactPolicy,
  sourceLabel?: string,
) {
  const value = text(sourceValue);
  if (!value) return;
  const transformed = policy.disposition === 'transformed'
    ? buildCreatorFactCapsule({
        character,
        sourceField,
        sourceLabel,
        sourceValue: value,
        runtimeUse: policy.runtimeUse,
      })
    : null;
  const safePolicy = transformed && !transformed.safe
    ? {
        ...policy,
        wordingPolicy: 'withhold' as const,
        disposition: 'debug_only' as const,
        reason: `${policy.reason}:${transformed.reason}`,
      }
    : {
        ...policy,
        reason: transformed ? `${policy.reason}:${transformed.reason}` : policy.reason,
      };
  facts.push(createCharacterPromptFact({
    characterId: character.id,
    characterName: character.name,
    sourceSurface: character.controlledBy === 'User'
      ? 'user_character_cards'
      : character.characterRole === 'Main'
        ? 'main_character_cards'
        : 'side_character_cards',
    sourceField,
    sourceLabel,
    sourceValue: value,
    promptValue: transformed?.value,
    ...safePolicy,
  }));
}

function appendRecordFacts(
  facts: CharacterPromptFact[],
  character: RoleplayCharacterCardSource,
  sourceField: string,
  source: Record<string, unknown> | undefined,
  policy: CharacterFactPolicy,
) {
  if (!source) return;
  for (const [key, value] of Object.entries(source)) {
    if (key === '_extras') continue;
    appendFact(facts, character, `${sourceField}.${key}`, value, policy);
  }
  const extras = source._extras;
  if (!Array.isArray(extras)) return;
  extras.forEach((entry, index) => {
    const label = text(entry?.label);
    const value = text(entry?.value);
    appendFact(
      facts,
      character,
      `${sourceField}._extras[${index}].value`,
      value || label,
      policy,
      label || undefined,
    );
  });
}

const identityPolicy: CharacterFactPolicy = {
  runtimeUse: 'identity',
  authority: 'saved_card_identity',
  relevance: 'always',
  visibility: 'broad_reference',
  wordingPolicy: 'compact_fact',
  disposition: 'included',
  reason: 'durable_character_identity',
};

const stableReferencePolicy: CharacterFactPolicy = {
  runtimeUse: 'stable_reference',
  authority: 'saved_card_reference',
  relevance: 'conditional',
  visibility: 'character_knowledge',
  wordingPolicy: 'do_not_copy_phrase',
  disposition: 'transformed',
  reason: 'creator_reference_requires_compact_nonverbatim_prompt_copy',
};

const voicePolicy: CharacterFactPolicy = {
  ...stableReferencePolicy,
  wordingPolicy: 'voice_affordance',
  reason: 'creator_reference_informs_character_voice_without_reusable_prose',
};

const relationshipPolicy: CharacterFactPolicy = {
  runtimeUse: 'relationship',
  authority: 'saved_card_reference',
  relevance: 'conditional',
  visibility: 'character_knowledge',
  wordingPolicy: 'compact_fact',
  disposition: 'transformed',
  reason: 'saved_relationship_reference_requires_current_context_before_use',
};

const currentStatePolicy: CharacterFactPolicy = {
  runtimeUse: 'current_state',
  authority: 'current_state',
  relevance: 'current',
  visibility: 'current_scene',
  wordingPolicy: 'withhold',
  disposition: 'debug_only',
  reason: 'saved_card_copy_is_not_the_live_current_state_authority',
};

const goalPolicy: CharacterFactPolicy = {
  runtimeUse: 'goal',
  authority: 'goal_selector',
  relevance: 'conditional',
  visibility: 'debug_only',
  wordingPolicy: 'withhold',
  disposition: 'debug_only',
  reason: 'goal_selector_owns_live_goal_prompt_material',
};

const privatePolicy: CharacterFactPolicy = {
  runtimeUse: 'private_reference',
  authority: 'visibility_policy',
  relevance: 'conditional',
  visibility: 'private_reference',
  wordingPolicy: 'withhold',
  disposition: 'debug_only',
  reason: 'private_saved_fact_requires_explicit_visibility_or_knowledge_policy',
};

const debugPolicy: CharacterFactPolicy = {
  runtimeUse: 'debug_only',
  authority: 'saved_card_reference',
  relevance: 'inactive',
  visibility: 'debug_only',
  wordingPolicy: 'withhold',
  disposition: 'debug_only',
  reason: 'saved_card_metadata_is_not_roleplay_prompt_content',
};

export function compileCharacterPromptFacts(character: RoleplayCharacterCardSource): CharacterPromptFact[] {
  const facts: CharacterPromptFact[] = [];

  appendFact(facts, character, 'name', character.name, identityPolicy);
  appendFact(facts, character, 'nicknames', character.nicknames, identityPolicy);
  appendFact(facts, character, 'age', character.age, identityPolicy);
  appendFact(facts, character, 'sexType', character.sexType, identityPolicy);
  appendFact(facts, character, 'sexualOrientation', character.sexualOrientation, identityPolicy);
  appendFact(facts, character, 'controlledBy', character.controlledBy, identityPolicy);
  appendFact(facts, character, 'characterRole', character.characterRole, identityPolicy);
  appendFact(facts, character, 'roleDescription', character.roleDescription, stableReferencePolicy);

  appendFact(facts, character, 'location', character.location, currentStatePolicy);
  appendFact(facts, character, 'scenePosition', character.scenePosition, currentStatePolicy);
  appendRecordFacts(facts, character, 'currentlyWearing', character.currentlyWearing, currentStatePolicy);

  const {
    temporaryConditions,
    ...stablePhysicalAppearance
  } = character.physicalAppearance ?? {};
  appendRecordFacts(facts, character, 'physicalAppearance', stablePhysicalAppearance, stableReferencePolicy);
  appendFact(
    facts,
    character,
    'physicalAppearance.temporaryConditions',
    temporaryConditions,
    currentStatePolicy,
  );
  appendRecordFacts(facts, character, 'preferredClothing', character.preferredClothing, stableReferencePolicy);
  const fullCharacter = 'tags' in character ? character : undefined;
  appendRecordFacts(facts, character, 'tone', fullCharacter?.tone, voicePolicy);
  appendRecordFacts(facts, character, 'background', character.background, stableReferencePolicy);
  appendRecordFacts(facts, character, 'keyLifeEvents', fullCharacter?.keyLifeEvents, stableReferencePolicy);
  appendRecordFacts(facts, character, 'relationships', fullCharacter?.relationships, relationshipPolicy);
  appendRecordFacts(facts, character, 'fears', fullCharacter?.fears, stableReferencePolicy);
  appendRecordFacts(facts, character, 'secrets', fullCharacter?.secrets, privatePolicy);

  const personality = character.personality;
  const hasStructuredTraits = personality
    ? 'splitMode' in personality
      || personality.traits.some((trait) => typeof trait === 'object')
    : false;
  if (personality && hasStructuredTraits) {
    const groups = 'splitMode' in personality && personality.splitMode
      ? [
          ['outwardTraits', personality.outwardTraits],
          ['inwardTraits', personality.inwardTraits],
        ] as const
      : [['traits', personality.traits]] as const;
    for (const [groupName, traits] of groups) {
      traits.forEach((trait, index) => {
        const value = typeof trait === 'string'
          ? trait
          : text(trait.value) || trait.label;
        appendFact(
          facts,
          character,
          `personality.${groupName}[${index}].value`,
          value,
          voicePolicy,
          typeof trait === 'string' ? undefined : text(trait.label) || undefined,
        );
      });
    }
  } else if (personality && 'miscellaneous' in personality) {
    personality.traits.forEach((trait, index) => {
      appendFact(facts, character, `personality.traits[${index}]`, trait, voicePolicy);
    });
    appendFact(facts, character, 'personality.miscellaneous', personality.miscellaneous, voicePolicy);
    appendFact(facts, character, 'personality.fears', personality.fears, stableReferencePolicy);
    appendFact(facts, character, 'personality.secrets', personality.secrets, privatePolicy);
    appendFact(facts, character, 'personality.kinksFantasies', personality.kinksFantasies, privatePolicy);
    appendFact(facts, character, 'personality.desires', personality.desires, privatePolicy);
  }

  (character.sections ?? []).forEach((section, sectionIndex) => {
    section.items.forEach((item, itemIndex) => {
      appendFact(
        facts,
        character,
        `sections[${sectionIndex}].items[${itemIndex}].value`,
        text(item.value) || item.label,
        stableReferencePolicy,
        [text(section.title), text(item.label)].filter(Boolean).join(': ') || undefined,
      );
    });
    appendFact(
      facts,
      character,
      `sections[${sectionIndex}].freeformValue`,
      section.freeformValue,
      stableReferencePolicy,
      text(section.title) || undefined,
    );
  });

  fullCharacter?.goals?.forEach((goal, goalIndex) => {
    appendFact(facts, character, `goals[${goalIndex}].title`, goal.title, goalPolicy);
    appendFact(facts, character, `goals[${goalIndex}].desiredOutcome`, goal.desiredOutcome, goalPolicy);
    appendFact(facts, character, `goals[${goalIndex}].currentStatus`, goal.currentStatus, goalPolicy);
    goal.steps?.forEach((step, stepIndex) => {
      appendFact(
        facts,
        character,
        `goals[${goalIndex}].steps[${stepIndex}].description`,
        step.description,
        goalPolicy,
      );
    });
  });

  appendFact(facts, character, 'tags', fullCharacter?.tags, debugPolicy);
  if ('firstMentionedIn' in character) {
    appendFact(facts, character, 'firstMentionedIn', character.firstMentionedIn, debugPolicy);
    character.extractedTraits.forEach((trait, index) => {
      appendFact(facts, character, `extractedTraits[${index}]`, trait, debugPolicy);
    });
  }
  return facts;
}

export function selectCharacterPromptFactsForRendering(
  character: RoleplayCharacterCardSource,
): CharacterPromptFact[] {
  const seenSemanticKeys = new Set<string>();
  return compileCharacterPromptFacts(character).map((fact) => {
    if (!fact.modelFacing) return fact;
    const key = selectionDedupeKey(fact);
    if (!key || !seenSemanticKeys.has(key)) {
      if (key) seenSemanticKeys.add(key);
      return fact;
    }
    return Object.freeze({
      ...fact,
      modelFacing: false,
      disposition: 'suppressed' as const,
      reason: `duplicate_model_facing_value_suppressed:${fact.reason}`,
    });
  });
}

function titleCaseSourceField(sourceField: string): string {
  const leaf = sourceField
    .replace(/\._extras\[\d+\]\.value$/, '')
    .replace(/\.value$/, '')
    .split('.')
    .at(-1)
    ?.replace(/\[\d+\]$/, '')
    ?? 'reference';
  return leaf
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function promptLabel(fact: CharacterPromptFact): string {
  if (fact.sourceLabel) return fact.sourceLabel;
  const labels: Record<string, string> = {
    controlledBy: 'Controlled by',
    characterRole: 'Story role',
    roleDescription: 'Role in story',
    sexType: 'Sex / type',
    sexualOrientation: 'Sexual orientation',
  };
  if (labels[fact.sourceField]) return labels[fact.sourceField];
  if (fact.sourceField.startsWith('personality.')) return 'Voice / behavior';
  if (fact.sourceField.startsWith('relationships.')) return 'Relationship';
  if (fact.sourceField.startsWith('sections.')) return 'Custom reference';
  return titleCaseSourceField(fact.sourceField);
}

function renderFactRows(facts: CharacterPromptFact[]): string {
  return facts.map((fact) => (
    fact.disposition === 'transformed'
      ? `- ${fact.value}`
      : `- ${promptLabel(fact)}: ${fact.value}`
  )).join('\n');
}

export function renderCharacterPromptFacts(character: RoleplayCharacterCardSource): string {
  const facts = selectCharacterPromptFactsForRendering(character).filter((fact) => (
    fact.modelFacing && fact.sourceField !== 'name'
  ));
  const identity = facts.filter((fact) => fact.runtimeUse === 'identity');
  const compact = facts.filter((fact) => (
    fact.runtimeUse !== 'identity' && fact.wordingPolicy === 'compact_fact'
  ));
  const creatorReference = facts.filter((fact) => fact.wordingPolicy === 'do_not_copy_phrase');
  const voice = facts.filter((fact) => fact.wordingPolicy === 'voice_affordance');

  return [
    `CHARACTER: ${character.name || 'Unnamed'}`,
    identity.length ? `IDENTITY FACTS\n${renderFactRows(identity)}` : '',
    compact.length ? `COMPACT REFERENCE FACTS\n${renderFactRows(compact)}` : '',
    creatorReference.length
      ? `CREATOR REFERENCE FACTS\nUse only when relevant. Preserve the meaning, but do not copy creator wording into narration or dialogue.\n${renderFactRows(creatorReference)}`
      : '',
    voice.length
      ? `VOICE AND BEHAVIOR AFFORDANCES\nExpress these through fresh behavior and dialogue; do not quote these lines.\n${renderFactRows(voice)}`
      : '',
  ].filter(Boolean).join('\n\n');
}

function countNormalizedOccurrences(haystack: string, needle: string): number {
  const normalizedHaystack = haystack.toLocaleLowerCase().replace(/\s+/g, ' ');
  const normalizedNeedle = needle.toLocaleLowerCase().replace(/\s+/g, ' ').trim();
  if (!normalizedNeedle) return 0;
  return normalizedHaystack.split(normalizedNeedle).length - 1;
}

function isAtomicSourceTerm(value: string): boolean {
  const normalized = withoutTerminalPunctuation(value);
  if (
    !normalized
    || normalized.split(/\s+/u).length > 5
    || /[;:]/u.test(normalized)
    || splitSentences(normalized).length !== 1
  ) {
    return false;
  }
  return finiteVerbIndex(parseCreatorLanguageTerms(normalized)) < 0
    && !hasExplicitSubjectPredicate(normalized);
}

export function buildCharacterPromptFactReviewSummary(
  character: RoleplayCharacterCardSource,
  systemInstruction: string,
): CharacterPromptFactReviewSummary {
  const compiledFacts = compileCharacterPromptFacts(character);
  const facts = selectCharacterPromptFactsForRendering(character);
  const byValue = new Map<string, CharacterPromptFact[]>();
  for (const fact of compiledFacts) {
    const key = fact.semanticKey;
    if (!key) continue;
    byValue.set(key, [...(byValue.get(key) ?? []), fact]);
  }
  const duplicateSourceGroups = [...byValue.values()]
    .filter((group) => group.length > 1)
    .map((group) => ({
      value: normalizePromptValue(group[0].sourceValue),
      sourceFields: group.map((fact) => fact.sourceField),
      renderedOccurrences: countNormalizedOccurrences(systemInstruction, group[0].value),
    }));
  const repeatedRenderedValues = facts
    .filter((fact) => (
      fact.modelFacing
      && fact.sourceValue.length >= 18
      && fact.sourceValue.split(/\s+/).length >= 3
      && countNormalizedOccurrences(systemInstruction, fact.sourceValue) > 1
    ))
    .map((fact) => fact.sourceValue)
    .filter((value, index, values) => values.indexOf(value) === index);
  const legacyHeadings = [
    'CHARACTER BASICS',
    `${character.name} PHYSICAL APPEARANCE`,
    `${character.name} CURRENTLY WEARING`,
    `${character.name} PREFERRED CLOTHING`,
    `${character.name} PERSONALITY`,
    `${character.name} CUSTOM CONTENT`,
  ];

  return Object.freeze({
    characterId: character.id,
    characterName: character.name,
    totalFacts: facts.length,
    modelFacingFacts: facts.filter((fact) => fact.modelFacing).length,
    transformedFacts: facts.filter((fact) => fact.disposition === 'transformed').length,
    suppressedFacts: facts.filter((fact) => fact.disposition === 'suppressed').length,
    debugOnlyFacts: facts.filter((fact) => fact.disposition === 'debug_only').length,
    duplicateSourceGroups,
    repeatedRenderedValues,
    legacyRawHeadingsPresent: legacyHeadings.filter((heading) => systemInstruction.includes(heading)),
  });
}

function buildCharacterPromptOutputCopyMetricFromFacts(
  facts: CharacterPromptFact[],
  assistantOutput: string,
  factSource: CharacterPromptOutputCopyMetric['factSource'],
): CharacterPromptOutputCopyMetric {
  const characterId = facts[0]?.characterId ?? 'unknown-character';
  const characterName = facts[0]?.characterName ?? 'Unknown character';
  const exactSourceValueCopies = facts
    .filter((fact) => (
      fact.sourceValue.length >= 18
      && fact.sourceValue.split(/\s+/).length >= 3
      && !isAtomicSourceTerm(fact.sourceValue)
      && countNormalizedOccurrences(assistantOutput, fact.sourceValue) > 0
    ))
    .map((fact) => ({
      sourceField: fact.sourceField,
      sourceLabel: fact.sourceLabel,
      sourceValue: fact.sourceValue,
    }));
  const copiedSourceLabels = facts
    .filter((fact) => (
      fact.sourceLabel
      && !fact.sourceField.startsWith('relationships.')
      && fact.sourceLabel.length >= 4
      && countNormalizedOccurrences(assistantOutput, `${fact.sourceLabel}:`) > 0
    ))
    .map((fact) => ({
      sourceField: fact.sourceField,
      sourceLabel: fact.sourceLabel as string,
    }));

  return Object.freeze({
    characterId,
    characterName,
    factSource,
    exactSourceValueCopies,
    copiedSourceLabels,
  });
}

export function buildCharacterPromptOutputCopyMetric(
  character: RoleplayCharacterCardSource,
  assistantOutput: string,
): CharacterPromptOutputCopyMetric {
  return buildCharacterPromptOutputCopyMetricFromFacts(
    compileCharacterPromptFacts(character),
    assistantOutput,
    'current_card_fallback',
  );
}

export function buildCharacterPromptOutputCopyMetricsFromCapturedFacts(
  facts: CharacterPromptFact[],
  assistantOutput: string,
): CharacterPromptOutputCopyMetric[] {
  const factsByCharacter = new Map<string, CharacterPromptFact[]>();
  for (const fact of facts) {
    factsByCharacter.set(fact.characterId, [
      ...(factsByCharacter.get(fact.characterId) ?? []),
      fact,
    ]);
  }
  return [...factsByCharacter.values()].map((characterFacts) => (
    buildCharacterPromptOutputCopyMetricFromFacts(
      characterFacts,
      assistantOutput,
      'generation_captured_facts',
    )
  ));
}
