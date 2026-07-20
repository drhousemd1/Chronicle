import type {
  Character,
  CharacterGoal,
  ScenarioData,
  StoryGoal,
} from '@/types';
import nlp from 'compromise/two';
import { shouldRenderGoalToWriter } from '@/lib/goal-alignment';
import type { RoleplayResponseMode } from './roleplay-response-job';

export type RoleplayGoalTier = 'active' | 'hidden_this_turn';
export type RoleplayGoalRenderDetail = 'full' | 'debug_only';
export type RoleplayGoalEvidenceConfidence = 'explicit' | 'strong' | 'none';

export type RoleplayGoalTurnDecision = {
  goalId: string;
  title: string;
  goalKind: 'story' | 'character';
  ownerCharacterId?: string;
  ownerCharacterName?: string;
  tier: RoleplayGoalTier;
  reason: string;
  evidence: string[];
  evidenceConfidence: RoleplayGoalEvidenceConfidence;
  sourceMessageId?: string;
  renderDetail: RoleplayGoalRenderDetail;
  openMilestoneId?: string;
  openMilestoneDescription?: string;
  partialProgress: 'none' | 'debug_only';
};

export type RoleplayGoalExposureDecision = {
  mode: RoleplayResponseMode;
  receiptId: string;
  sourceMessageId?: string;
  decisions: RoleplayGoalTurnDecision[];
};

export type SelectRoleplayGoalsForTurnInput = {
  appData: ScenarioData;
  latestPlayerTurn: string;
  sourceMessageId?: string;
  mode: RoleplayResponseMode;
};

type SelectableGoal = StoryGoal | CharacterGoal;

type GoalCandidate = {
  goal: SelectableGoal;
  goalKind: 'story' | 'character';
  owner?: Pick<Character, 'id' | 'name'>;
};

type GoalRelevanceProfile = {
  sourcePhrases: string[];
  distinctivePhrases: string[];
  distinctiveTerms: Set<string>;
};

type PlayerEvidenceClause = {
  raw: string;
  normalized: string;
  terms: Set<string>;
  negated: boolean;
};

function goalCandidateKey(candidate: GoalCandidate): string {
  return `${candidate.goalKind}:${candidate.owner?.id ?? ''}:${candidate.goal.id}`;
}

const GOAL_STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'from', 'into', 'about', 'after', 'again', 'also',
  'being', 'could', 'every', 'have',
  'more', 'should', 'their', 'there', 'these', 'they', 'this', 'through',
  'would', 'your', 'goal', 'current', 'story', 'character', 'someone',
  'something', 'things', 'people', 'person', 'really', 'still',
  'beside', 'near', 'toward', 'towards',
]);

const GENERIC_GOAL_TERMS = new Set([
  'ask', 'asked', 'begin', 'bring', 'change', 'close', 'come', 'continue', 'deal',
  'finish', 'give', 'given', 'going', 'help', 'keep', 'leave', 'make', 'meet',
  'move', 'open', 'plan', 'protect', 'reach', 'return', 'save', 'secure', 'show',
  'speak', 'start', 'stay', 'stop', 'take', 'talk', 'tell', 'think', 'trying',
  'turn', 'want', 'work', 'approach', 'hold', 'kiss', 'look', 'softly', 'gently',
  'quietly', 'smile', 'stand', 'touch', 'wait', 'walk', 'watch',
  'lie', 'run', 'sit',
]);

const NEGATED_GOAL_PATTERNS = [
  /\b(?:do|does|did|should|must|can|could|will|would)\s+not\b/u,
  /\b(?:am|are|is|was|were)\s+not\b/u,
  /\b(?:don't|doesn't|didn't|shouldn't|mustn't|can't|couldn't|won't|wouldn't)\b/u,
  /\b(?:isn't|aren't|wasn't|weren't)\b/u,
  /\b(?:i'm|we're|you're|they're|he's|she's|it's)\s+not\b/u,
  /\b(?:i'm|we're|you're|they're|he's|she's|it's|am|are|is|was|were)(?:\s+[\p{L}'-]+){0,2}\s+not\b/u,
  /\blet(?:'s| us)\s+not\b/u,
  /\bcannot\b/u,
  /\b(?:never|refuse|refuses|refused|avoid|avoids|avoided)\b/u,
  /\bno\s+(?:need|reason|plan|intention)\s+to\b/u,
  /\bno\s+way\b/u,
  /\b(?:except|rather\s+than)\b/u,
  /\bnot(?:\s+(?:ever|really|actually|even|possibly)){0,2}\s+to\b/u,
  /\b(?:anything|everything)\s+but\b/u,
  /^not\b/u,
];

const STANDALONE_REFUSAL_PATTERNS = [
  /^(?:no|nope|nah)$/u,
  /^(?:no|nope|nah)[,\s]+(?:thanks|thank\s+you)$/u,
  /^(?:absolutely\s+)?not$/u,
  /^(?:not\s+(?:a\s+chance|happening|today)|forget\s+it)$/u,
  /^not\s+in\b.+$/u,
  /^(?:no\s+way|(?:absolutely\s+)?never)$/u,
  /^no(?:,\s*|\s+)(?:absolutely\s+)?not$/u,
  /^(?:i|we)(?:\s+[\p{L}'-]+){0,2}\s+refuse(?:\s+to(?:\s+do)?(?:\s+(?:it|that))?)?$/u,
  /^(?:i|we)\s+(?:don't|do\s+not)\s+think\s+so$/u,
  /^(?:i|we)(?:\s+[\p{L}'-]+){0,3}\s+(?:won't|will\s+not|can't|cannot|shouldn't|wouldn't)(?:\s+(?:do|try)\s+(?:it|that))?$/u,
  /^(?:[\p{L}'-]+\s+){0,3}not$/u,
];

function normalizeText(value: unknown): string {
  return typeof value === 'string'
    ? value.trim().toLowerCase().replace(/[‘’]/gu, "'")
    : '';
}

function normalizePhrase(value: unknown): string {
  return normalizeText(value)
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function phraseTerms(value: unknown): string[] {
  return normalizePhrase(value)
    .split(' ')
    .filter((term) => term.length >= 3 && !GOAL_STOP_WORDS.has(term));
}

function normalizeEvidencePhrase(value: unknown): string {
  return phraseTerms(value).join(' ');
}

function evidenceTerms(value: unknown): Set<string> {
  return new Set(phraseTerms(value));
}

function stripEmbeddedQuotedSpeech(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';

  const quotePairs = [
    { open: '"', close: '"' },
    { open: '“', close: '”' },
    { open: '‘', close: '’' },
    { open: '«', close: '»' },
    { open: '「', close: '」' },
  ];

  for (const { open, close } of quotePairs) {
    if (!trimmed.startsWith(open)) continue;
    const closingIndex = trimmed.indexOf(close, open.length);
    if (closingIndex < 0) continue;

    const quotedText = trimmed.slice(open.length, closingIndex).trim();
    const trailingText = trimmed
      .slice(closingIndex + close.length)
      .replace(/^[\s,;:—-]+/u, '')
      .trim();
    // A balanced leading quotation followed by narration is reported speech.
    // A quote with no trailing narration may still be the player's directive.
    return trailingText || quotedText;
  }

  return quotePairs.reduce((result, { open, close }) => {
    const escapedOpen = open.replace(/[\^$.*+?()[\]{}|]/gu, '\\$&');
    const escapedClose = close.replace(/[\^$.*+?()[\]{}|]/gu, '\\$&');
    return result.replace(
      new RegExp(escapedOpen + '[^' + escapedClose + ']*' + escapedClose, 'gu'),
      ' [QUOTED TEXT] ',
    );
  }, trimmed);
}

function isGenericGoalTerm(term: string): boolean {
  if (GENERIC_GOAL_TERMS.has(term)) return true;

  const variants = new Set<string>();
  if (term.endsWith('ing') && term.length > 5) {
    const withoutIng = term.slice(0, -3);
    variants.add(withoutIng);
    if (/([a-z])\1$/u.test(withoutIng)) variants.add(withoutIng.slice(0, -1));
    variants.add(`${withoutIng}e`);
  }
  if (term.endsWith('ed') && term.length > 4) {
    const withoutEd = term.slice(0, -2);
    variants.add(withoutEd);
    variants.add(`${withoutEd}e`);
  }
  if (term.endsWith('es') && term.length > 4) variants.add(term.slice(0, -2));
  if (term.endsWith('s') && term.length > 3) variants.add(term.slice(0, -1));

  return [...variants].some((variant) => GENERIC_GOAL_TERMS.has(variant));
}

function playerEvidenceClauses(value: string): PlayerEvidenceClause[] {
  const rawClauses = stripEmbeddedQuotedSpeech(value)
    .replace(/\[SCENE:[^\]]+\]/giu, ' ')
    .replace(/[;:—]+/gu, ' [CLAUSE BOUNDARY] ')
    .replace(
      /(^|[.!?;\n]\s*)([^,\n]+),\s*(?=(?:i|we|you|he|she|they|it)\b)/giu,
      '$1[NARRATIVE INTRO] $2; ',
    )
    .replace(/\b(?:instead\s+of|rather\s+than)\b/giu, '; not ')
    .replace(/\b(?:anything|everything)\s+but\b/giu, '; not ')
    .replace(/\b(?:anything|everything)\s+(?:other\s+than|apart\s+from)\b/giu, '; not ')
    .replace(/\b(?:apart\s+from|except\s+for|excluding|save\s+for)\b/giu, '; not ')
    .replace(/\?/gu, ' [QUESTION BOUNDARY]; ')
    .replace(/,\s*(?=not\b)/giu, ' [CLAUSE BOUNDARY] ')
    .split(/(?:[.!;\n]+|\s*,?\s+\b(?:but|instead|while|whereas|although|though|because|since|as|when|before|after)\b\s+|\s*,?\s+\b(?:and\s+)?then\b\s+|\s*,\s*(?=(?:not|let(?:'s|\s+us)|we|i|please|can|could|will|would|help)\b)|\s*,?\s+\band\b\s+(?=(?:(?:do|does|did|am|are|is|was|were|should|must|can|could|will|would)\s+not|don't|doesn't|didn't|shouldn't|mustn't|can't|couldn't|won't|wouldn't)\b))/giu)
    .map((clause) => clause.trim())
    .filter(Boolean);

  return rawClauses.map((clause, index) => {
    const endedWithQuestion = clause.includes('[QUESTION BOUNDARY]');
    const evidenceClause = clause.replace(/\[QUESTION BOUNDARY\]/giu, ' ').trim();
    const normalizedText = normalizeText(evidenceClause);
    const nextClause = normalizeText(rawClauses[index + 1]);
    // A questioned action followed by any additional player text is discussion,
    // not the final directive. This fails closed without enumerating every
    // possible refusal or correction phrase.
    const questionedActionWasNotFinal = endedWithQuestion && Boolean(nextClause);
    return {
      raw: evidenceClause,
      normalized: normalizeEvidencePhrase(evidenceClause),
      terms: evidenceTerms(evidenceClause),
      negated: questionedActionWasNotFinal
        || STANDALONE_REFUSAL_PATTERNS.some((pattern) => pattern.test(normalizedText))
        || NEGATED_GOAL_PATTERNS.some((pattern) => pattern.test(normalizedText)),
    };
  });
}

type TaggedTerm = {
  text?: string;
  normal?: string;
  tags?: string[];
  pre?: string;
  post?: string;
  switch?: string;
};

function isLikelyImperativeStart(value: string, protectedObjectTerms: Set<string>): boolean {
  const terms = (nlp(value).terms().json() as Array<{ terms?: TaggedTerm[] }>)
    .flatMap((entry) => entry.terms ?? []);
  const firstActionIndex = terms.findIndex((term) => !term.tags?.includes('Adverb'));
  const firstTags = new Set(terms[firstActionIndex]?.tags ?? []);

  if (
    firstActionIndex < 0
    || !firstTags.has('Verb')
    || firstTags.has('Gerund')
    || firstTags.has('PastTense')
    || firstTags.has('Adjective')
  ) return false;

  if (/^[^,]+,\s*(?:i|we|you|he|she|they|it)\b/iu.test(value.trim())) return false;

  const secondTags = new Set(terms[firstActionIndex + 1]?.tags ?? []);
  if (secondTags.has('PastTense')) return false;

  // The tagger can read noun-led subjects such as "Escape plans change" as
  // imperatives. Once a noun appears after the first token, a later finite
  // verb identifies narration rather than a command. This also catches
  // coordinated subjects such as "Escape or shelter options remain".
  let sawNounAfterAction = false;
  for (const term of terms.slice(firstActionIndex + 1)) {
    if (term.tags?.includes('Noun')) sawNounAfterAction = true;
    const finiteVerb = term.tags?.includes('Verb')
      || term.tags?.includes('Auxiliary')
      || term.tags?.includes('Copula');
    const normalizedTerm = normalizePhrase(term.normal ?? term.text ?? '');
    if (sawNounAfterAction && finiteVerb && !protectedObjectTerms.has(normalizedTerm)) return false;
  }

  const secondToken = normalizePhrase(
    terms[firstActionIndex + 1]?.normal ?? terms[firstActionIndex + 1]?.text ?? '',
  );
  if (secondToken === 'of') return false;

  return true;
}

function directRequestActionScope(value: string): string | null {
  const trimmed = value.trim();
  const patterns = [
    /^(?:please\s+)?let(?:'s|\s+us)\s+(.+)$/iu,
    /^(?:please\s+)?(?:we|i)\s+(?:need|want|plan|intend|have|ought|should|must|am\s+going|are\s+going)(?:\s+to)?\s+(.+)$/iu,
    /^(?:please\s+)?(?:can|could|will|would)\s+(?:you|we)(?:\s+please)?\s+(.+)$/iu,
    /^(?:please\s+)?help\s+(?:me|us)(?:\s+to)?\s+(.+)$/iu,
    /^please\s+(.+)$/iu,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match?.[1]) return match[1].trim();
  }

  return null;
}

const DIRECT_OBJECT_BOUNDARIES = new Set([
  'after', 'along', 'alongside', 'and', 'apart', 'around', 'as', 'before', 'behind',
  'beneath', 'beside', 'besides', 'between', 'beyond', 'but', 'by', 'connected',
  'during', 'except', 'excepting', 'excluding', 'for', 'from', 'if', 'in',
  'inside', 'into', 'near', 'next', 'of', 'on', 'opposite', 'or', 'other',
  'outside', 'over', 'past', 'rather', 'save', 'since', 'than', 'through', 'to',
  'toward', 'towards', 'under', 'unless', 'until', 'using', 'via', 'when',
  'where', 'which', 'while', 'who', 'with', 'without',
]);

const OBJECT_FILLER_WORDS = new Set([
  'a', 'an', 'all', 'any', 'each', 'every', 'my', 'our', 'some', 'that', 'the',
  'their', 'these', 'this', 'those', 'your', 'now', 'please',
]);

type RequestedActionSignature = {
  action: string;
  connector?: string;
  objectHead?: string;
  objectModifiers: Set<string>;
  objectIdentityModifiers: Set<string>;
  structuralTail: boolean;
};

function taggedTerms(value: string): TaggedTerm[] {
  return (nlp(value).terms().json() as Array<{ terms?: TaggedTerm[] }>)
    .flatMap((entry) => entry.terms ?? []);
}

function actionVariants(value: string): Set<string> {
  const normalized = normalizePhrase(value);
  const variants = new Set(normalized ? [normalized] : []);
  if (normalized.endsWith('ies') && normalized.length > 4) variants.add(normalized.slice(0, -3) + 'y');
  if (normalized.endsWith('ing') && normalized.length > 5) {
    const withoutIng = normalized.slice(0, -3);
    variants.add(withoutIng);
    if (/([a-z])\1$/u.test(withoutIng)) variants.add(withoutIng.slice(0, -1));
    variants.add(withoutIng + 'e');
  }
  if (normalized.endsWith('ed') && normalized.length > 4) {
    variants.add(normalized.slice(0, -2));
    variants.add(normalized.slice(0, -2) + 'e');
  }
  if (normalized.endsWith('es') && normalized.length > 4) variants.add(normalized.slice(0, -2));
  if (normalized.endsWith('s') && normalized.length > 3) variants.add(normalized.slice(0, -1));
  return variants;
}

function requestedActionSignature(value: string): RequestedActionSignature | null {
  const hasParentheticalTail = /\([^)]*\)/u.test(value);
  const withoutParentheticals = value.replace(/\([^)]*\)/gu, ' ').trim();
  let structuralTail = hasParentheticalTail
    || withoutParentheticals.includes('[CLAUSE BOUNDARY]');
  const primaryText = withoutParentheticals.split('[CLAUSE BOUNDARY]')[0]?.trim() ?? '';
  const terms = taggedTerms(primaryText);
  const firstActionIndex = terms.findIndex((term) => !term.tags?.includes('Adverb'));
  const first = normalizePhrase(
    terms[firstActionIndex]?.normal ?? terms[firstActionIndex]?.text ?? '',
  );
  if (!first) return null;

  const actionHasCommaAside = /,/u.test(terms[firstActionIndex]?.post ?? '')
    && terms.slice(firstActionIndex + 1).some((term) => (
      term.tags?.includes('Verb')
      || term.tags?.includes('Auxiliary')
      || term.tags?.includes('Copula')
    ));
  structuralTail = structuralTail || actionHasCommaAside;

  let connector: string | undefined;
  let index = firstActionIndex + 1;
  while (index < terms.length) {
    const term = terms[index];
    const normalized = normalizePhrase(term.normal ?? term.text ?? '');
    if (
      !normalized
      || OBJECT_FILLER_WORDS.has(normalized)
      || term.tags?.includes('Adverb')
    ) {
      index += 1;
      continue;
    }
    const isConnector = term.tags?.includes('Preposition')
      || term.tags?.includes('Particle')
      || DIRECT_OBJECT_BOUNDARIES.has(normalized);
    if (isConnector) {
      connector = normalized;
      index += 1;
    }
    break;
  }

  const objectTerms: string[] = [];
  const objectIdentityModifiers = new Set<string>();
  for (; index < terms.length; index += 1) {
    const term = terms[index];
    const normalized = normalizePhrase(term.normal ?? term.text ?? '');
    if (!normalized) continue;
    const previousPost = terms[index - 1]?.post ?? '';
    if (/[,;:—]/u.test(previousPost)) {
      structuralTail = true;
      break;
    }
    if (OBJECT_FILLER_WORDS.has(normalized)) continue;
    if (term.tags?.includes('Adverb')) continue;

    const hasNounAlternative = term.tags?.includes('Noun')
      || term.tags?.includes('Adjective')
      || /(?:Noun|Plural)\|Verb|Verb\|(?:Noun|Plural)/u.test(term.switch ?? '');
    const isBoundary = term.tags?.includes('Preposition')
      || term.tags?.includes('Particle')
      || term.tags?.includes('Conjunction')
      || term.tags?.includes('Negative')
      || DIRECT_OBJECT_BOUNDARIES.has(normalized)
      || (objectTerms.length > 0 && term.tags?.includes('Verb') && !hasNounAlternative);
    if (isBoundary) {
      break;
    }
    if (objectTerms.length === 0 && term.tags?.includes('Verb') && !hasNounAlternative) {
      break;
    }
    const objectTerm = normalized.replace(/'s$/u, '');
    objectTerms.push(objectTerm);
    if (term.tags?.includes('Noun')) objectIdentityModifiers.add(objectTerm);
  }

  const objectHead = objectTerms.at(-1);
  if (objectHead) objectIdentityModifiers.delete(objectHead);
  return {
    action: first,
    connector,
    objectHead,
    objectModifiers: new Set(objectTerms.slice(0, -1)),
    objectIdentityModifiers,
    structuralTail,
  };
}

function signaturesMatchGoal(
  request: RequestedActionSignature,
  sourcePhrase: string,
): boolean {
  const source = requestedActionSignature(sourcePhrase);
  if (!source) return false;
  const requestActions = actionVariants(request.action);
  const sourceActions = actionVariants(source.action);
  if (![...requestActions].some((action) => sourceActions.has(action))) return false;
  if ((request.connector ?? '') !== (source.connector ?? '')) return false;
  if (request.structuralTail) return false;

  // Match the requested object's head, not merely a mentioned word. This keeps
  // a transmitter replica, a vault map, or a transmitter-shaped sculpture from
  // activating the underlying transmitter or vault goal.
  if (!source.objectHead) {
    return !request.objectHead && !request.structuralTail;
  }
  if (request.objectHead !== source.objectHead) return false;
  return request.objectModifiers.size === source.objectModifiers.size
    && [...source.objectModifiers].every((term) => request.objectModifiers.has(term));
}

function actionScopeGoalMatches(scope: string, profile: GoalRelevanceProfile): string[] {
  const request = requestedActionSignature(scope);
  if (!request || request.structuralTail) return [];
  const directMatches = profile.sourcePhrases.filter((phrase) => signaturesMatchGoal(request, phrase));
  if (directMatches.length > 0) return directMatches;

  // A request can use the goal title's action with the open milestone's more
  // specific object, such as "repair the transmitter power board" for a goal
  // titled "Repair the transmitter" whose open milestone targets the power
  // board. Keep the action and object tied to the same authored goal profile;
  // do not fall back to loose term overlap.
  const sourceSignatures = profile.sourcePhrases
    .map((phrase) => ({ phrase, signature: requestedActionSignature(phrase) }))
    .filter((entry): entry is { phrase: string; signature: RequestedActionSignature } => Boolean(entry.signature));
  const supportedObjectTerms = new Set(
    sourceSignatures.flatMap(({ signature }) => [
      ...(signature.objectHead ? [signature.objectHead] : []),
      ...signature.objectModifiers,
    ]),
  );
  const actionMatches = sourceSignatures.filter(({ signature }) => (
    [...actionVariants(request.action)].some((action) => actionVariants(signature.action).has(action))
    && (request.connector ?? '') === (signature.connector ?? '')
  ));
  if (actionMatches.length === 0 || !request.objectHead) return [];

  const objectMatches = sourceSignatures.filter(({ phrase, signature }) => (
    signature.objectHead === request.objectHead
    && (
      signature.objectIdentityModifiers.size === 0
      || [...signature.objectIdentityModifiers].every((term) => (
        request.objectModifiers.has(term)
      ))
    )
    && [...request.objectIdentityModifiers].every((term) => supportedObjectTerms.has(term))
    && [...request.objectModifiers]
      .filter((term) => !signature.objectModifiers.has(term))
      .every((term) => supportedObjectTerms.has(term))
    && (
      actionMatches.some((actionMatch) => actionMatch.phrase !== phrase)
      || [...request.objectModifiers].some((term) => !signature.objectModifiers.has(term))
    )
  ));
  if (objectMatches.length === 0) return [];

  return [...new Set([
    ...actionMatches.map(({ phrase }) => phrase),
    ...objectMatches.map(({ phrase }) => phrase),
  ])];
}

function isDirectRequestGoalInvocation(
  clause: PlayerEvidenceClause,
  profile: GoalRelevanceProfile,
): string[] {
  const scope = directRequestActionScope(clause.raw);
  return scope ? actionScopeGoalMatches(scope, profile) : [];
}

function isImperativeGoalInvocation(
  clause: PlayerEvidenceClause,
  profile: GoalRelevanceProfile,
  identityTerms: Set<string>,
): string[] {
  const rawTokens = normalizePhrase(clause.raw).split(' ').filter(Boolean);
  if (rawTokens.length === 0) return [];
  if (['i', "i'm", 'im', 'my', 'we', "we're", 'our', 'he', 'she', 'they', 'it', 'you'].includes(rawTokens[0])) {
    return [];
  }

  let firstCommandToken = rawTokens[0];
  let commandText = clause.raw;
  if (identityTerms.has(firstCommandToken)) {
    const firstComma = clause.raw.indexOf(',');
    if (firstComma < 0) return [];
    const beforeComma = phraseTerms(clause.raw.slice(0, firstComma));
    if (beforeComma.length === 0 || !beforeComma.every((term) => identityTerms.has(term))) return [];
    commandText = clause.raw.slice(firstComma + 1).trim();
    firstCommandToken = normalizePhrase(
      taggedTerms(commandText).find((term) => !term.tags?.includes('Adverb'))?.normal ?? '',
    );
  }
  if (!identityTerms.has(firstCommandToken)) {
    firstCommandToken = normalizePhrase(
      taggedTerms(commandText).find((term) => !term.tags?.includes('Adverb'))?.normal
        ?? firstCommandToken,
    );
  }
  if (!firstCommandToken) return [];
  const normalizedCommand = normalizePhrase(commandText);
  const exactSourcePhrases = profile.sourcePhrases.filter((phrase) => phrase === normalizedCommand);
  if (exactSourcePhrases.length > 0) return exactSourcePhrases;
  const protectedObjectTerms = new Set(
    profile.sourcePhrases
      .filter((phrase) => phraseTerms(phrase)[0] === firstCommandToken)
      .flatMap(phraseTerms),
  );
  if (!isLikelyImperativeStart(commandText, protectedObjectTerms)) return [];

  return actionScopeGoalMatches(commandText, profile);
}

function goalSourcePhrases(goal: SelectableGoal): string[] {
  const openMilestone = goal.steps?.find((step) => !step.completed)?.description || '';
  return [goal.title, openMilestone]
    .map(normalizePhrase)
    .filter(Boolean);
}

function includesEvidencePhrase(normalizedEvidence: string, phrase: string): boolean {
  return ` ${normalizedEvidence} `.includes(` ${phrase} `);
}

function intersection(left: Set<string>, right: Set<string>): string[] {
  return [...left].filter((term) => right.has(term)).sort();
}

function normalizedFlexibility(goal: SelectableGoal): 'rigid' | 'normal' | 'flexible' {
  return goal.flexibility === 'rigid' || goal.flexibility === 'flexible'
    ? goal.flexibility
    : 'normal';
}

function isCompletedGoal(goal: SelectableGoal): boolean {
  const progress = 'progress' in goal && typeof goal.progress === 'number'
    ? goal.progress
    : undefined;
  return (typeof progress === 'number' && progress >= 100)
    || (Boolean(goal.steps?.length) && Boolean(goal.steps?.every((step) => step.completed)));
}

function buildGoalRelevanceProfiles(
  candidates: GoalCandidate[],
  excludedIdentityTerms: Set<string>,
): Map<string, GoalRelevanceProfile> {
  const sourcePhrasesByGoal = new Map<string, string[]>();
  const termGoalFrequency = new Map<string, number>();
  const phraseGoalFrequency = new Map<string, number>();

  for (const candidate of candidates) {
    const phrases = [...new Set(goalSourcePhrases(candidate.goal))]
      .filter((phrase) => phraseTerms(phrase).some((term) => !excludedIdentityTerms.has(term)));
    sourcePhrasesByGoal.set(goalCandidateKey(candidate), phrases);

    const terms = new Set(
      phrases
        .flatMap(phraseTerms)
        .filter((term) => !excludedIdentityTerms.has(term) && !isGenericGoalTerm(term)),
    );
    for (const term of terms) {
      termGoalFrequency.set(term, (termGoalFrequency.get(term) ?? 0) + 1);
    }
    for (const phrase of phrases) {
      phraseGoalFrequency.set(phrase, (phraseGoalFrequency.get(phrase) ?? 0) + 1);
    }
  }

  return new Map(candidates.map((candidate) => {
    const sourcePhrases = sourcePhrasesByGoal.get(goalCandidateKey(candidate)) ?? [];
    const distinctiveTerms = new Set(
      sourcePhrases
        .flatMap(phraseTerms)
        .filter((term) => (
          !excludedIdentityTerms.has(term)
          && !isGenericGoalTerm(term)
          && termGoalFrequency.get(term) === 1
        )),
    );
    const distinctivePhrases = sourcePhrases.filter((phrase) => (
      phraseGoalFrequency.get(phrase) === 1
      && (() => {
        const originalTerms = phraseTerms(phrase);
        const nonIdentityTerms = originalTerms.filter((term) => !excludedIdentityTerms.has(term));
        const informativeTerms = nonIdentityTerms.filter((term) => !isGenericGoalTerm(term));
        if (informativeTerms.length === 0) return false;
        if (informativeTerms.length >= 2) return true;
        return originalTerms.length === 1 && nonIdentityTerms.length === 1;
      })()
    ));
    return [goalCandidateKey(candidate), { sourcePhrases, distinctivePhrases, distinctiveTerms }];
  }));
}

function collectCharacterIdentityTerms(appData: ScenarioData): Set<string> {
  return new Set(
    [...appData.characters, ...(appData.sideCharacters || [])]
      .flatMap((character) => phraseTerms(`${character.name} ${character.nicknames || ''}`)),
  );
}

function decideGoal(input: {
  goal: SelectableGoal;
  goalKind: 'story' | 'character';
  latestPlayerTurn: string;
  sourceMessageId?: string;
  owner?: Pick<Character, 'id' | 'name'>;
  profile: GoalRelevanceProfile;
  identityTerms: Set<string>;
}): RoleplayGoalTurnDecision {
  const { goal, goalKind, latestPlayerTurn, sourceMessageId, owner, profile, identityTerms } = input;
  const title = goal.title?.trim() || goal.desiredOutcome?.trim() || 'Untitled goal';
  const openMilestone = goal.steps?.find((step) => !step.completed);
  const base = {
    goalId: goal.id,
    title,
    goalKind,
    ownerCharacterId: owner?.id,
    ownerCharacterName: owner?.name,
    openMilestoneId: openMilestone?.id,
    openMilestoneDescription: openMilestone?.description,
    sourceMessageId,
    partialProgress: 'debug_only' as const,
  };

  if (!shouldRenderGoalToWriter(goal.alignment, normalizedFlexibility(goal))) {
    return {
      ...base,
      tier: 'hidden_this_turn',
      reason: 'alignment_not_writer_visible',
      evidence: ['existing_goal_alignment_policy'],
      evidenceConfidence: 'none',
      renderDetail: 'debug_only',
    };
  }

  if (isCompletedGoal(goal)) {
    return {
      ...base,
      tier: 'hidden_this_turn',
      reason: 'goal_completed',
      evidence: [goal.steps?.length ? 'all_authored_goal_steps_completed' : 'goal_progress_complete'],
      evidenceConfidence: 'none',
      renderDetail: 'debug_only',
    };
  }

  const clauses = playerEvidenceClauses(latestPlayerTurn).filter((clause) => !clause.negated);
  const clauseEvidence = clauses.map((clause) => {
    const distinctiveMatches = intersection(profile.distinctiveTerms, clause.terms);
    const phraseMatches = profile.distinctivePhrases.filter((phrase) => (
      includesEvidencePhrase(clause.normalized, phrase)
    ));
    const directPhraseMatches = [...new Set([
      ...isDirectRequestGoalInvocation(clause, profile),
      ...isImperativeGoalInvocation(clause, profile, identityTerms),
    ])];
    const directTermMatches = directPhraseMatches.length > 0 && distinctiveMatches.length >= 2
      ? distinctiveMatches
      : [];
    return {
      distinctiveMatches,
      phraseMatches,
      directPhraseMatches,
      directTermMatches,
      hasDirectRequestEvidence: directPhraseMatches.length > 0,
    };
  });
  const directEvidence = clauseEvidence.find((entry) => entry.hasDirectRequestEvidence);
  const matchedEvidence = directEvidence;
  const hasDirectRequestEvidence = Boolean(directEvidence);
  const directRequestPhrases = directEvidence?.directPhraseMatches ?? [];
  const phraseMatches = matchedEvidence?.phraseMatches ?? [];
  const distinctiveMatches = matchedEvidence?.distinctiveMatches ?? [];

  const evidence = [
    hasDirectRequestEvidence ? 'latest_player_turn_direct_request' : '',
    directRequestPhrases.length > 0
      ? `latest_player_turn_goal_phrase:${directRequestPhrases.join('|')}`
      : '',
    phraseMatches.length > 0
      ? `latest_player_turn_distinctive_phrase:${phraseMatches.join('|')}`
      : '',
    distinctiveMatches.length > 0
      ? `latest_player_turn_distinctive_terms:${distinctiveMatches.join(',')}`
      : '',
  ].filter(Boolean);

  if (hasDirectRequestEvidence) {
    return {
      ...base,
      tier: 'active',
      reason: 'directly_requested_in_latest_player_turn',
      evidence,
      evidenceConfidence: 'explicit',
      renderDetail: 'full',
    };
  }

  return {
    ...base,
    tier: 'hidden_this_turn',
    reason: 'no_strong_current_turn_evidence',
    evidence: ['latest_player_turn_did_not_support_goal'],
    evidenceConfidence: 'none',
    renderDetail: 'debug_only',
  };
}

function hashReceiptValue(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function selectRoleplayGoalsForTurn({
  appData,
  latestPlayerTurn,
  sourceMessageId,
  mode,
}: SelectRoleplayGoalsForTurnInput): RoleplayGoalExposureDecision {
  const candidates: GoalCandidate[] = [
    ...(appData.world.core.storyGoals || []).map((goal) => ({
      goal,
      goalKind: 'story' as const,
    })),
    ...appData.characters.flatMap((character) => (
      (character.goals || []).map((goal) => ({
        goal,
        goalKind: 'character' as const,
        owner: character,
      }))
    )),
  ];
  const identityTerms = collectCharacterIdentityTerms(appData);
  const profiles = buildGoalRelevanceProfiles(candidates, identityTerms);
  const decisions = candidates.map((candidate) => decideGoal({
    ...candidate,
    latestPlayerTurn,
    sourceMessageId,
    identityTerms,
    profile: profiles.get(goalCandidateKey(candidate)) ?? {
      sourcePhrases: [],
      distinctivePhrases: [],
      distinctiveTerms: new Set<string>(),
    },
  }));
  const receiptSource = decisions
    .map((decision) => [
      decision.goalKind,
      decision.ownerCharacterId ?? '',
      decision.goalId,
      decision.title,
      decision.openMilestoneId ?? '',
      decision.openMilestoneDescription ?? '',
      decision.sourceMessageId ?? '',
      decision.tier,
      decision.renderDetail,
      decision.evidenceConfidence,
      decision.reason,
      ...decision.evidence,
    ].join(':'))
    .join('|');
  const receiptInput = [sourceMessageId ?? '', normalizePhrase(latestPlayerTurn), receiptSource].join('|');

  return {
    mode,
    receiptId: `goal-exposure:${mode}:${hashReceiptValue(receiptInput)}`,
    sourceMessageId,
    decisions,
  };
}
