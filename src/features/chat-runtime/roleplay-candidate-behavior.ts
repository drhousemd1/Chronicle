import { parseMessageTokensWithWarnings } from './message-formatting-utils';

export const ROLEPLAY_CANDIDATE_BEHAVIOR_VERSION = 'candidate-behavior-v2';

export type RoleplayCandidateBehaviorCriterion =
  | 'retry_strategy_difference'
  | 'continue_advancement'
  | 'response_development'
  | 'thought_function'
  | 'private_information_leakage'
  | 'history_self_anchoring';

export type RoleplayCandidateBehaviorResult = 'pass' | 'fail' | 'review_required';

export type RoleplayMessageUnitShape = 'dialogue' | 'action' | 'question' | 'narration' | 'empty';

export type RoleplayCandidateBehaviorInput = Readonly<{
  criterion: RoleplayCandidateBehaviorCriterion;
  mode: 'normal_send' | 'retry_regenerate' | 'continue_assistant_tail';
  playerTurn: string;
  candidateResponse: string;
  referenceResponse?: string;
  requiredFacts?: readonly string[];
  requiredDevelopments?: readonly string[];
  forbiddenPhrases?: readonly string[];
  priorAssistantResponses?: readonly string[];
  withheldPlayerText?: readonly string[];
}>;

export type RoleplayCandidateBehaviorSignals = Readonly<{
  tokenTrigramJaccard: number;
  longestSharedContentSpan: number;
  playerTurnTrigramJaccard: number;
  playerTurnSharedContentSpan: number;
  candidateUnitCount: number;
  referenceUnitCount: number;
  candidateWordCount: number;
  referenceWordCount: number;
  responseLengthRatio: number;
  candidateQuestionCount: number;
  referenceQuestionCount: number;
  candidateEndsWithQuestion: boolean;
  referenceEndsWithQuestion: boolean;
  hasNewMessageUnit: boolean;
  hasObservableDevelopment: boolean;
  openingShapeChanged: boolean;
  endingShapeChanged: boolean;
  repeatedClosingFunction: boolean;
  lengthIncreaseWithoutNewDevelopment: boolean;
  thoughtUnitCount: number;
  emptyThoughtUnitCount: number;
  adjacentThoughtPairCount: number;
  stitchedThoughtCount: number;
  thoughtEndsResponse: boolean;
  referenceThoughtEndsResponse: boolean;
  maximumThoughtVisibleActionOverlap: number;
  maximumThoughtVisibleActionSharedSpan: number;
  maximumThoughtHistoryOverlap: number;
  maximumThoughtHistorySharedSpan: number;
  maximumThoughtWithheldPlayerOverlap: number;
  maximumThoughtWithheldPlayerSharedSpan: number;
  requiredFactsMissing: readonly string[];
  requiredDevelopmentsMissing: readonly string[];
  requiredDevelopmentsAlreadyInReference: readonly string[];
  forbiddenPhrasesPresent: readonly string[];
  maximumForbiddenTokenOverlap: number;
  maximumForbiddenSharedContentSpan: number;
}>;

export type RoleplayCandidateBehaviorEvaluation = Readonly<{
  version: typeof ROLEPLAY_CANDIDATE_BEHAVIOR_VERSION;
  criterion: RoleplayCandidateBehaviorCriterion;
  result: RoleplayCandidateBehaviorResult;
  reasons: readonly string[];
  warnings: readonly string[];
  signals: RoleplayCandidateBehaviorSignals;
}>;

export type ResponseDevelopmentReview = Readonly<{
  kind: 'response_development_review';
  diagnosticOnly: true;
  hiddenRetryAllowed: false;
  evaluation: RoleplayCandidateBehaviorEvaluation;
}>;

export type ThoughtFunctionReview = Readonly<{
  kind: 'thought_function_review';
  diagnosticOnly: true;
  hiddenRetryAllowed: false;
  evaluation: RoleplayCandidateBehaviorEvaluation;
}>;

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'been', 'but', 'by', 'for', 'from',
  'had', 'has', 'have', 'he', 'her', 'hers', 'him', 'his', 'i', 'in', 'is', 'it',
  'its', 'me', 'my', 'of', 'on', 'or', 'our', 'ours', 'she', 'that', 'the', 'their',
  'theirs', 'them', 'they', 'this', 'to', 'was', 'we', 'were', 'with', 'you', 'your',
]);

const THOUGHT_CONCERN_TERMS = {
  motive: ['because', 'motive', 'purpose', 'reason', 'why'],
  fear: ['afraid', 'fear', 'scared', 'terrified', 'worry', 'worried'],
  desire: ['desire', 'hope', 'need', 'want', 'wish', 'yearn'],
  uncertainty: ['doubt', 'maybe', 'perhaps', 'uncertain', 'unsure', 'wonder'],
  memory: ['forgot', 'memory', 'recall', 'remember', 'remembered'],
  decision: ['choose', 'decide', 'decision', 'must', 'should', 'will'],
} as const;

function round(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}'\s]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function words(value: string): string[] {
  return normalizeText(value).match(/[\p{L}\p{N}']+/gu) ?? [];
}

function contentWords(value: string): string[] {
  return words(value).filter((word) => word.length > 1 && !STOP_WORDS.has(word));
}

function ngrams(tokens: readonly string[], size: number): string[] {
  if (tokens.length < size) return [];
  const result: string[] = [];
  for (let index = 0; index <= tokens.length - size; index += 1) {
    result.push(tokens.slice(index, index + size).join(' '));
  }
  return result;
}

function jaccard(left: readonly string[], right: readonly string[]): number {
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  if (leftSet.size === 0 && rightSet.size === 0) return 1;
  const intersection = [...leftSet].filter((entry) => rightSet.has(entry)).length;
  const union = new Set([...leftSet, ...rightSet]).size;
  return union === 0 ? 0 : intersection / union;
}

function tokenSimilarity(left: string, right: string): number {
  return jaccard(contentWords(left), contentWords(right));
}

function trigramSimilarity(left: string, right: string): number {
  return jaccard(ngrams(contentWords(left), 3), ngrams(contentWords(right), 3));
}

function longestSharedSpan(left: string, right: string): number {
  const leftWords = contentWords(left);
  const rightWords = contentWords(right);
  if (!leftWords.length || !rightWords.length) return 0;
  const previous = new Array<number>(rightWords.length + 1).fill(0);
  let longest = 0;
  for (let leftIndex = 1; leftIndex <= leftWords.length; leftIndex += 1) {
    const current = new Array<number>(rightWords.length + 1).fill(0);
    for (let rightIndex = 1; rightIndex <= rightWords.length; rightIndex += 1) {
      if (leftWords[leftIndex - 1] !== rightWords[rightIndex - 1]) continue;
      current[rightIndex] = previous[rightIndex - 1] + 1;
      longest = Math.max(longest, current[rightIndex]);
    }
    for (let index = 0; index < current.length; index += 1) previous[index] = current[index];
  }
  return longest;
}

function splitMessageUnits(value: string): string[] {
  return value
    .split(/\n+|(?<=[.!?])\s+/)
    .map((unit) => unit.trim())
    .filter((unit) => contentWords(unit).length >= 2);
}

function unitShape(unit: string | undefined): RoleplayMessageUnitShape {
  if (!unit) return 'empty';
  const trimmed = unit.trim();
  if (!trimmed) return 'empty';
  if (trimmed.startsWith('*') || /^\[[^\]]+\]/.test(trimmed)) return 'action';
  if (trimmed.startsWith('"') || trimmed.startsWith("'") || /["'][^"']+["']/.test(trimmed)) {
    return 'dialogue';
  }
  if (trimmed.endsWith('?')) return 'question';
  return 'narration';
}

function unitIsQuestion(unit: string): boolean {
  return /\?(?:["'”’*\]]+)?$/.test(unit.trim());
}

function maximumPairwiseScore(
  leftValues: readonly string[],
  rightValues: readonly string[],
  scorer: (left: string, right: string) => number,
): number {
  if (!leftValues.length || !rightValues.length) return 0;
  return Math.max(0, ...leftValues.flatMap((left) => rightValues.map((right) => scorer(left, right))));
}

function thoughtConcernCount(value: string): number {
  const normalized = normalizeText(value);
  return Object.values(THOUGHT_CONCERN_TERMS).filter((terms) => (
    terms.some((term) => new RegExp(`\\b${term}\\b`, 'i').test(normalized))
  )).length;
}

function includesRequiredFact(candidate: string, fact: string): boolean {
  const normalizedCandidate = normalizeText(candidate);
  const normalizedFact = normalizeText(fact);
  if (!normalizedFact) return true;
  if (normalizedCandidate.includes(normalizedFact)) return true;
  const factTokens = contentWords(fact);
  if (!factTokens.length) return true;
  const candidateTokens = new Set(contentWords(candidate));
  const retained = factTokens.filter((token) => candidateTokens.has(token)).length;
  return retained / factTokens.length >= 0.8;
}

function buildSignals(input: RoleplayCandidateBehaviorInput): RoleplayCandidateBehaviorSignals {
  const reference = input.referenceResponse ?? '';
  const candidateUnits = splitMessageUnits(input.candidateResponse);
  const referenceUnits = splitMessageUnits(reference);
  const candidateTokens = parseMessageTokensWithWarnings(input.candidateResponse).tokens;
  const thoughtUnits = candidateTokens
    .filter((token) => token.type === 'thought')
    .map((token) => token.content.trim());
  const visibleActionUnits = candidateTokens
    .filter((token) => token.type === 'action' || token.type === 'plain')
    .map((token) => token.content.trim())
    .filter(Boolean);
  const historyTexts = [reference, ...(input.priorAssistantResponses ?? [])]
    .filter((value) => value.trim());
  const withheldPlayerText = [
    ...(input.withheldPlayerText ?? []),
    ...(input.forbiddenPhrases ?? []),
  ].filter((value) => value.trim());
  const hasNewMessageUnit = candidateUnits.some((candidateUnit) => {
    if (contentWords(candidateUnit).length < 3) return false;
    if (!referenceUnits.length) return true;
    const strongestReferenceOverlap = Math.max(
      ...referenceUnits.map((referenceUnit) => tokenSimilarity(candidateUnit, referenceUnit)),
    );
    return strongestReferenceOverlap <= 0.35;
  });
  const hasObservableDevelopment = hasNewMessageUnit && candidateUnits.some((unit) => (
    unitShape(unit) !== 'question' && contentWords(unit).length >= 3
  ));
  const requiredFactsMissing = (input.requiredFacts ?? [])
    .filter((fact) => !includesRequiredFact(input.candidateResponse, fact));
  const requiredDevelopmentsMissing = (input.requiredDevelopments ?? [])
    .filter((development) => !includesRequiredFact(input.candidateResponse, development));
  const requiredDevelopmentsAlreadyInReference = (input.requiredDevelopments ?? [])
    .filter((development) => includesRequiredFact(reference, development));
  const forbiddenPhrasesPresent = (input.forbiddenPhrases ?? []).filter((phrase) => {
    const normalizedPhrase = normalizeText(phrase);
    return Boolean(normalizedPhrase) && normalizeText(input.candidateResponse).includes(normalizedPhrase);
  });
  const maximumForbiddenTokenOverlap = Math.max(
    0,
    ...(input.forbiddenPhrases ?? []).map((phrase) => tokenSimilarity(input.candidateResponse, phrase)),
  );
  const maximumForbiddenSharedContentSpan = Math.max(
    0,
    ...(input.forbiddenPhrases ?? []).map((phrase) => longestSharedSpan(input.candidateResponse, phrase)),
  );
  const candidateWordCount = contentWords(input.candidateResponse).length;
  const referenceWordCount = contentWords(reference).length;
  const responseLengthRatio = referenceWordCount > 0
    ? candidateWordCount / referenceWordCount
    : candidateWordCount > 0 ? 1 : 0;
  const candidateEndsWithQuestion = unitIsQuestion(input.candidateResponse);
  const referenceEndsWithQuestion = unitIsQuestion(reference);
  const thoughtEndsResponse = /\([^()]*\)\s*$/.test(input.candidateResponse);
  const referenceThoughtEndsResponse = /\([^()]*\)\s*$/.test(reference);
  const repeatedClosingFunction = Boolean(reference.trim()) && (
    (candidateEndsWithQuestion && referenceEndsWithQuestion)
    || (thoughtEndsResponse && referenceThoughtEndsResponse)
  );
  const lengthIncreaseWithoutNewDevelopment = responseLengthRatio >= 1.35 && !hasObservableDevelopment;
  const meaningfulCandidateTokens = candidateTokens.filter((token) => (
    token.type === 'thought' || contentWords(token.content).length > 0
  ));
  const adjacentThoughtPairCount = meaningfulCandidateTokens.reduce((count, token, index) => (
    token.type === 'thought' && meaningfulCandidateTokens[index + 1]?.type === 'thought' ? count + 1 : count
  ), 0);

  return {
    tokenTrigramJaccard: round(trigramSimilarity(reference, input.candidateResponse)),
    longestSharedContentSpan: longestSharedSpan(reference, input.candidateResponse),
    playerTurnTrigramJaccard: round(trigramSimilarity(input.playerTurn, input.candidateResponse)),
    playerTurnSharedContentSpan: longestSharedSpan(input.playerTurn, input.candidateResponse),
    candidateUnitCount: candidateUnits.length,
    referenceUnitCount: referenceUnits.length,
    candidateWordCount,
    referenceWordCount,
    responseLengthRatio: round(responseLengthRatio),
    candidateQuestionCount: candidateUnits.filter(unitIsQuestion).length,
    referenceQuestionCount: referenceUnits.filter(unitIsQuestion).length,
    candidateEndsWithQuestion,
    referenceEndsWithQuestion,
    hasNewMessageUnit,
    hasObservableDevelopment,
    openingShapeChanged: unitShape(candidateUnits[0]) !== unitShape(referenceUnits[0]),
    endingShapeChanged: unitShape(candidateUnits.at(-1)) !== unitShape(referenceUnits.at(-1)),
    repeatedClosingFunction,
    lengthIncreaseWithoutNewDevelopment,
    thoughtUnitCount: thoughtUnits.length,
    emptyThoughtUnitCount: thoughtUnits.filter((thought) => contentWords(thought).length === 0).length,
    adjacentThoughtPairCount,
    stitchedThoughtCount: thoughtUnits.filter((thought) => thoughtConcernCount(thought) >= 2).length,
    thoughtEndsResponse,
    referenceThoughtEndsResponse,
    maximumThoughtVisibleActionOverlap: round(maximumPairwiseScore(thoughtUnits, visibleActionUnits, tokenSimilarity)),
    maximumThoughtVisibleActionSharedSpan: maximumPairwiseScore(thoughtUnits, visibleActionUnits, longestSharedSpan),
    maximumThoughtHistoryOverlap: round(maximumPairwiseScore(thoughtUnits, historyTexts, tokenSimilarity)),
    maximumThoughtHistorySharedSpan: maximumPairwiseScore(thoughtUnits, historyTexts, longestSharedSpan),
    maximumThoughtWithheldPlayerOverlap: round(maximumPairwiseScore(thoughtUnits, withheldPlayerText, tokenSimilarity)),
    maximumThoughtWithheldPlayerSharedSpan: maximumPairwiseScore(thoughtUnits, withheldPlayerText, longestSharedSpan),
    requiredFactsMissing,
    requiredDevelopmentsMissing,
    requiredDevelopmentsAlreadyInReference,
    forbiddenPhrasesPresent,
    maximumForbiddenTokenOverlap: round(maximumForbiddenTokenOverlap),
    maximumForbiddenSharedContentSpan,
  };
}

function result(
  input: RoleplayCandidateBehaviorInput,
  signals: RoleplayCandidateBehaviorSignals,
  evaluationResult: RoleplayCandidateBehaviorResult,
  reasons: string[],
  warnings: string[] = [],
): RoleplayCandidateBehaviorEvaluation {
  return {
    version: ROLEPLAY_CANDIDATE_BEHAVIOR_VERSION,
    criterion: input.criterion,
    result: evaluationResult,
    reasons,
    warnings,
    signals,
  };
}

export function evaluateRoleplayCandidateBehavior(
  input: RoleplayCandidateBehaviorInput,
): RoleplayCandidateBehaviorEvaluation {
  const signals = buildSignals(input);
  const hardFailures: string[] = [];
  if (!input.candidateResponse.trim()) hardFailures.push('candidate_response_empty');
  if (signals.requiredFactsMissing.length) hardFailures.push('required_fact_missing');
  if (signals.requiredDevelopmentsMissing.length) hardFailures.push('required_development_missing');
  if (signals.forbiddenPhrasesPresent.length) hardFailures.push('forbidden_phrase_present');

  if (input.criterion === 'private_information_leakage') {
    if (hardFailures.length) return result(input, signals, 'fail', hardFailures);
    if (signals.maximumForbiddenSharedContentSpan >= 6) {
      return result(input, signals, 'fail', ['six_word_private_source_anchor_reused']);
    }
    if (signals.maximumForbiddenTokenOverlap >= 0.35) {
      return result(input, signals, 'review_required', ['possible_private_information_mirroring']);
    }
    return result(input, signals, 'pass', ['no_private_information_signal_detected']);
  }

  if (hardFailures.length) return result(input, signals, 'fail', hardFailures);

  if (input.criterion === 'response_development') {
    const warnings: string[] = [];
    if (signals.repeatedClosingFunction) warnings.push('repeated_closing_function');
    if (signals.lengthIncreaseWithoutNewDevelopment) warnings.push('length_increase_without_new_development');
    if (input.referenceResponse?.trim()
      && (signals.longestSharedContentSpan >= 5 || signals.tokenTrigramJaccard >= 0.72)) {
      return result(input, signals, 'fail', ['response_restates_reference_instead_of_developing'], warnings);
    }
    if (signals.lengthIncreaseWithoutNewDevelopment) {
      return result(input, signals, 'fail', ['response_length_increases_without_development'], warnings);
    }
    const curatedDevelopmentProven = Boolean(input.requiredDevelopments?.length)
      && signals.requiredDevelopmentsMissing.length === 0
      && signals.requiredDevelopmentsAlreadyInReference.length === 0;
    if (!signals.hasObservableDevelopment && !curatedDevelopmentProven) {
      return result(input, signals, 'fail', ['response_does_not_develop_interaction'], warnings);
    }
    if (!input.requiredDevelopments?.length) {
      return result(input, signals, 'review_required', ['observable_development_requires_curated_proof'], warnings);
    }
    if (signals.requiredDevelopmentsAlreadyInReference.length) {
      return result(input, signals, 'fail', ['required_development_is_not_new'], warnings);
    }
    return result(input, signals, 'pass', ['response_adds_observable_development'], warnings);
  }

  if (input.criterion === 'thought_function') {
    const warnings = signals.repeatedClosingFunction
      ? ['repeated_internal_thought_closing_function']
      : [];
    if (signals.thoughtUnitCount === 0) {
      return result(input, signals, 'pass', ['internal_thought_not_required'], warnings);
    }
    if (signals.emptyThoughtUnitCount > 0) {
      return result(input, signals, 'fail', ['empty_internal_thought_unit'], warnings);
    }
    if (signals.maximumThoughtWithheldPlayerSharedSpan >= 5
      || signals.maximumThoughtWithheldPlayerOverlap >= 0.7) {
      return result(input, signals, 'fail', ['internal_thought_reuses_withheld_player_text'], warnings);
    }
    if (signals.maximumThoughtVisibleActionSharedSpan >= 5
      || signals.maximumThoughtVisibleActionOverlap >= 0.7) {
      return result(input, signals, 'fail', ['internal_thought_restates_visible_action'], warnings);
    }
    if (signals.maximumThoughtHistorySharedSpan >= 6
      || signals.maximumThoughtHistoryOverlap >= 0.72) {
      return result(input, signals, 'fail', ['internal_thought_repeats_prior_realization'], warnings);
    }
    if (signals.stitchedThoughtCount > 0) {
      return result(input, signals, 'fail', ['internal_thought_stitches_unrelated_concerns'], warnings);
    }
    if (signals.adjacentThoughtPairCount > 0) {
      return result(input, signals, 'fail', ['internal_thoughts_are_back_to_back'], warnings);
    }
    if (!input.requiredDevelopments?.length) {
      return result(input, signals, 'review_required', ['internal_thought_usefulness_requires_curated_proof'], warnings);
    }
    return result(input, signals, 'pass', ['internal_thought_adds_private_character_meaning'], warnings);
  }

  if (!input.referenceResponse?.trim()) {
    return result(input, signals, 'review_required', ['reference_response_required']);
  }

  if (signals.longestSharedContentSpan >= 6) {
    return result(input, signals, 'fail', ['six_word_source_anchor_reused']);
  }
  if (signals.tokenTrigramJaccard >= 0.72) {
    return result(input, signals, 'fail', ['candidate_is_near_duplicate']);
  }
  if (signals.playerTurnSharedContentSpan >= 6) {
    return result(input, signals, 'fail', ['player_turn_source_anchor_reused']);
  }
  if (!signals.hasNewMessageUnit) {
    return result(input, signals, 'fail', ['candidate_has_no_new_message_unit']);
  }
  if (!input.requiredDevelopments?.length) {
    return result(input, signals, 'review_required', ['semantic_difference_requires_curated_development']);
  }
  if (signals.requiredDevelopmentsAlreadyInReference.length) {
    return result(input, signals, 'fail', ['required_development_is_not_new']);
  }

  if (input.criterion === 'continue_advancement') {
    if (signals.tokenTrigramJaccard <= 0.35 && signals.hasObservableDevelopment) {
      return result(input, signals, 'pass', ['candidate_extends_accepted_tail']);
    }
    return result(input, signals, 'review_required', ['continue_advancement_is_ambiguous']);
  }

  const changedResponseShape = signals.openingShapeChanged || signals.endingShapeChanged;
  const closingQuestionShapeChanged = signals.candidateEndsWithQuestion !== signals.referenceEndsWithQuestion;
  const retainedClosingQuestionLoop = signals.candidateEndsWithQuestion && signals.referenceEndsWithQuestion;
  if (retainedClosingQuestionLoop) {
    return result(input, signals, 'review_required', [
      input.criterion === 'history_self_anchoring'
        ? 'history_closing_question_pattern_requires_review'
        : 'retry_closing_question_pattern_requires_review',
    ]);
  }
  const materiallyChangedResponseFunction = closingQuestionShapeChanged
    || (!signals.candidateEndsWithQuestion && !signals.referenceEndsWithQuestion && changedResponseShape);
  if (signals.tokenTrigramJaccard <= 0.35
    && materiallyChangedResponseFunction
    && signals.hasObservableDevelopment) {
    return result(input, signals, 'pass', [
      input.criterion === 'history_self_anchoring'
        ? 'candidate_breaks_recent_history_pattern'
        : 'candidate_uses_materially_different_response_shape',
    ]);
  }

  return result(input, signals, 'review_required', [
    input.criterion === 'history_self_anchoring'
      ? 'history_similarity_requires_review'
      : 'retry_strategy_difference_requires_review',
  ]);
}

export function buildResponseDevelopmentReview(
  input: Omit<RoleplayCandidateBehaviorInput, 'criterion'>,
): ResponseDevelopmentReview {
  return {
    kind: 'response_development_review',
    diagnosticOnly: true,
    hiddenRetryAllowed: false,
    evaluation: evaluateRoleplayCandidateBehavior({ ...input, criterion: 'response_development' }),
  };
}

export function buildThoughtFunctionReview(
  input: Omit<RoleplayCandidateBehaviorInput, 'criterion'>,
): ThoughtFunctionReview {
  return {
    kind: 'thought_function_review',
    diagnosticOnly: true,
    hiddenRetryAllowed: false,
    evaluation: evaluateRoleplayCandidateBehavior({ ...input, criterion: 'thought_function' }),
  };
}

export function roleplayCandidateBehaviorThresholds() {
  return {
    version: ROLEPLAY_CANDIDATE_BEHAVIOR_VERSION,
    clearDuplicateTrigramJaccard: 0.72,
    clearDistinctTrigramJaccard: 0.35,
    hardSharedContentSpanWords: 6,
  } as const;
}
