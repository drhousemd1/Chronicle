import type { Conversation, Message, ScenarioData } from '@/types';
import type {
  RoleplayRecentHistoryPacket,
  RoleplayRecentHistoryReceipt,
  RoleplaySuppressedStyleAnchor,
} from '@/features/chat-runtime/roleplay-recent-history';
import {
  buildRoleplayUserStateAuthorityDebugSummary,
  type RoleplayUserStateAuthorityDebugSummary,
  type RoleplayUserStateAuthorityDecision,
} from '@/features/chat-runtime/roleplay-user-state-authority';
import {
  buildCharacterPromptOutputCopyMetric,
  buildCharacterPromptOutputCopyMetricsFromCapturedFacts,
  type CharacterPromptFact,
  type CharacterPromptFactReviewSummary,
  type CharacterPromptOutputCopyMetric,
} from '@/features/chat-runtime/roleplay-character-card-facts';

export type ReviewMetricRole = Message['role'];
export type ReviewMetricModality = 'action' | 'dialogue' | 'internal_thought' | 'plain_text';

export type ReviewMetricSegmentInput = {
  reviewId: string;
  messageId: string;
  generationId: string;
  turnNumber: number;
  segmentNumber: number;
  role: ReviewMetricRole;
  speakerName: string;
  text: string;
  rawMessageText: string;
  localNotice?: Message['localNotice'] | null;
  recentHistoryPacket?: RoleplayRecentHistoryPacket | null;
  userStateAuthorityDecisions?: RoleplayUserStateAuthorityDecision[];
  characterPromptFacts?: CharacterPromptFact[];
  characterPromptFactSummaries?: CharacterPromptFactReviewSummary[];
};

export type ReviewMetricCount = {
  value: string;
  count: number;
};

export type ReviewSourceOverlap = {
  source: 'latest_user_message' | 'recent_chat_history' | 'character_card_data' | 'story_card_data' | 'goal_data' | 'current_state' | 'no_obvious_source_found';
  matchedTerms: string[];
  matchCount: number;
};

export type ReviewInternalThoughtMetric = {
  index: number;
  wordCount: number;
  sentenceCount: number;
  possibleMultiTopicWarning: boolean;
  backToBackThoughtWarning: boolean;
  repeatsVisibleActionTerms: string[];
  preview: string;
};

export type ReviewSegmentDebugMetrics = {
  reviewId: string;
  messageId: string;
  generationId: string;
  role: ReviewMetricRole;
  isLocalNotice: boolean;
  speakerName: string;
  turnNumber: number;
  segmentNumber: number;
  wordCount: number;
  sentenceCount: number;
  actionSegmentCount: number;
  dialogueSegmentCount: number;
  internalThoughtCount: number;
  plainTextSegmentCount: number;
  actionWordCount: number;
  dialogueWordCount: number;
  internalThoughtWordCount: number;
  plainTextWordCount: number;
  dialogueToNarrationRatio: number;
  modalitySequence: ReviewMetricModality[];
  compressedModalitySequence: ReviewMetricModality[];
  topRepeatedTerms: ReviewMetricCount[];
  repeatedPhrases: ReviewMetricCount[];
  repeatedTermsFromEarlierAssistantBlocks: string[];
  internalThoughtDiagnostics: ReviewInternalThoughtMetric[];
  sourceOverlap: ReviewSourceOverlap[];
  recentHistoryReceipts: RoleplayRecentHistoryReceipt[];
  suppressedStyleAnchors: RoleplaySuppressedStyleAnchor[];
  userStateAuthorityDecisions: RoleplayUserStateAuthorityDecision[];
  userStateAuthoritySummary: RoleplayUserStateAuthorityDebugSummary;
  characterPromptFactSummaries: CharacterPromptFactReviewSummary[];
  characterPromptOutputFactSource: CharacterPromptOutputCopyMetric['factSource'];
  characterPromptOutputCopyMetrics: CharacterPromptOutputCopyMetric[];
};

export type ReviewTranscriptDebugMetrics = {
  assistantBlockCount: number;
  userBlockCount: number;
  assistantWordCounts: number[];
  averageAssistantWords: number;
  assistantWordCountVariance: number;
  assistantSimilarLengthWarning: boolean;
  repeatedTermsAcrossAssistant: ReviewMetricCount[];
  repeatedPhrasesAcrossAssistant: ReviewMetricCount[];
};

export type ReviewDebugMetrics = {
  schema: 'chronicle-session-deterministic-metrics-v1';
  explanation: string;
  transcript: ReviewTranscriptDebugMetrics;
  segments: ReviewSegmentDebugMetrics[];
};

type TextToken = {
  modality: ReviewMetricModality;
  raw: string;
  inner: string;
};

type SourceCorpus = {
  source: Exclude<ReviewSourceOverlap['source'], 'no_obvious_source_found'>;
  text: string;
};

const WORD_REGEX = /[A-Za-z][A-Za-z'-]*/g;
const TOKEN_REGEX = /(\*[\s\S]*?\*)|([“"][\s\S]*?[”"][,.!?;:]?)|(\([\s\S]*?\))/g;

const TERM_STOPWORDS = new Set([
  'able', 'about', 'above', 'across', 'after', 'again', 'against', 'almost', 'along', 'already', 'also',
  'always', 'around', 'away', 'back', 'because', 'been', 'before', 'behind', 'being', 'both', 'came',
  'come', 'comes', 'could', 'down', 'each', 'even', 'ever', 'every', 'felt', 'from', 'gets', 'going',
  'gone', 'have', 'having', 'here', 'hers', 'himself', 'into', 'itself', 'just', 'keep', 'kept', 'know',
  'last', 'like', 'made', 'make', 'many', 'might', 'more', 'most', 'much', 'must', 'need', 'next',
  'only', 'over', 'said', 'same', 'seem', 'seen', 'should', 'still', 'than', 'that', 'them', 'then',
  'there', 'these', 'they', 'thing', 'this', 'those', 'through', 'time', 'toward', 'under', 'until',
  'want', 'were', 'what', 'when', 'where', 'which', 'while', 'will', 'with', 'would', 'your', 'their',
]);

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function stripWrapper(token: string, modality: ReviewMetricModality): string {
  const trimmed = token.trim();
  if (modality === 'action' && trimmed.startsWith('*') && trimmed.endsWith('*')) {
    return trimmed.slice(1, -1).trim();
  }
  if (modality === 'internal_thought' && trimmed.startsWith('(') && trimmed.endsWith(')')) {
    return trimmed.slice(1, -1).trim();
  }
  if (modality === 'dialogue') {
    return trimmed.replace(/^[“"]/, '').replace(/[”"][,.!?;:]?$/, '').trim();
  }
  return trimmed;
}

function modalityForToken(token: string): ReviewMetricModality {
  if (token.startsWith('*')) return 'action';
  if (token.startsWith('(')) return 'internal_thought';
  if (token.startsWith('"') || token.startsWith('“')) return 'dialogue';
  return 'plain_text';
}

function tokenizeRoleplayText(text: string): TextToken[] {
  const cleanText = text.replace(/\[SCENE:\s*.*?\]/g, '').trim();
  const tokens: TextToken[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = TOKEN_REGEX.exec(cleanText)) !== null) {
    if (match.index > lastIndex) {
      const plain = cleanText.slice(lastIndex, match.index);
      if (plain.trim()) {
        tokens.push({ modality: 'plain_text', raw: plain, inner: plain.trim() });
      }
    }

    const raw = match[0];
    const modality = modalityForToken(raw);
    tokens.push({ modality, raw, inner: stripWrapper(raw, modality) });
    lastIndex = TOKEN_REGEX.lastIndex;
  }

  if (lastIndex < cleanText.length) {
    const plain = cleanText.slice(lastIndex);
    if (plain.trim()) {
      tokens.push({ modality: 'plain_text', raw: plain, inner: plain.trim() });
    }
  }

  return tokens.filter((token) => token.inner.trim());
}

function countWords(value: string): number {
  return (value.match(WORD_REGEX) || []).length;
}

function countSentences(value: string): number {
  const normalized = normalizeWhitespace(value);
  if (!normalized) return 0;
  const matches = normalized.match(/[.!?]+(?:["”')\]]+)?(?=\s|$)/g);
  return Math.max(1, matches?.length || 0);
}

function extractTerms(value: string): string[] {
  return (value.toLowerCase().match(/[a-z][a-z'-]{3,}/g) || [])
    .map((term) => term.replace(/^'+|'+$/g, '').replace(/'s$/, ''))
    .filter((term) => term.length >= 4 && !TERM_STOPWORDS.has(term));
}

function topCounts(values: string[], minCount: number, limit: number): ReviewMetricCount[] {
  const counts = new Map<string, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
  return Array.from(counts.entries())
    .filter(([, count]) => count >= minCount)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, limit)
    .map(([value, count]) => ({ value, count }));
}

function normalizeWordsForPhrases(value: string): string[] {
  return (value.toLowerCase().match(WORD_REGEX) || [])
    .map((word) => word.replace(/^'+|'+$/g, '').replace(/'s$/, ''))
    .filter(Boolean);
}

function extractRepeatedPhrases(value: string, limit = 8): ReviewMetricCount[] {
  const words = normalizeWordsForPhrases(value);
  const phrases: string[] = [];

  for (let size = 2; size <= 5; size += 1) {
    for (let index = 0; index <= words.length - size; index += 1) {
      const phraseWords = words.slice(index, index + size);
      if (phraseWords.every((word) => TERM_STOPWORDS.has(word))) continue;
      phrases.push(phraseWords.join(' '));
    }
  }

  return topCounts(phrases, 2, limit);
}

function compressSequence(sequence: ReviewMetricModality[]): ReviewMetricModality[] {
  return sequence.filter((modality, index) => modality !== sequence[index - 1]);
}

function summarizeNumber(value: number): number {
  return Number.isFinite(value) ? Number(value.toFixed(3)) : 0;
}

function preview(value: string, max = 120): string {
  const compact = normalizeWhitespace(value);
  return compact.length <= max ? compact : `${compact.slice(0, max - 3)}...`;
}

function getRecordValues(value: unknown, blockedKeyPattern: RegExp, depth = 0): string[] {
  if (value == null || depth > 5) return [];
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed || trimmed.startsWith('data:image/') || /^https?:\/\//i.test(trimmed)) return [];
    return [trimmed];
  }
  if (typeof value === 'number' || typeof value === 'boolean') return [String(value)];
  if (Array.isArray(value)) return value.flatMap((entry) => getRecordValues(entry, blockedKeyPattern, depth + 1));
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).flatMap(([key, entry]) => (
      blockedKeyPattern.test(key) ? [] : getRecordValues(entry, blockedKeyPattern, depth + 1)
    ));
  }
  return [];
}

function characterCardText(appData: ScenarioData): string {
  const blocked = /avatar|image|url|position|goals|alignment/i;
  return [
    ...getRecordValues(appData.characters || [], blocked),
    ...getRecordValues(appData.sideCharacters || [], blocked),
  ].join('\n');
}

function storyCardText(appData: ScenarioData): string {
  const blocked = /avatar|image|url|position|storyGoals/i;
  return [
    ...getRecordValues(appData.world || {}, blocked),
    ...getRecordValues(appData.story || {}, blocked),
    ...getRecordValues(appData.scenes || [], blocked),
    ...getRecordValues(appData.contentThemes || {}, blocked),
  ].join('\n');
}

function goalText(appData: ScenarioData): string {
  const storyGoals = appData.world?.core?.storyGoals || [];
  const characterGoals = (appData.characters || []).flatMap((character) => character.goals || []);
  return [
    ...getRecordValues(storyGoals, /avatar|image|url|position/i),
    ...getRecordValues(characterGoals, /avatar|image|url|position/i),
  ].join('\n');
}

function currentStateText(appData: ScenarioData): string {
  return [...(appData.characters || []), ...(appData.sideCharacters || [])]
    .map((character) => [
      character.name,
      character.controlledBy,
      character.characterRole,
      character.location,
      character.scenePosition,
    ].filter(Boolean).join(' | '))
    .join('\n');
}

function findMessageIndex(conversation: Conversation, messageId: string): number {
  return conversation.messages.findIndex((message) => message.id === messageId);
}

function latestUserIndexBefore(conversation: Conversation, messageIndex: number): number {
  for (let index = messageIndex - 1; index >= 0; index -= 1) {
    const message = conversation.messages[index];
    if (message?.role === 'user') return index;
  }
  return -1;
}

function latestUserMessageBefore(conversation: Conversation, messageIndex: number): string {
  const latestUserIndex = latestUserIndexBefore(conversation, messageIndex);
  return latestUserIndex >= 0 ? conversation.messages[latestUserIndex].text : '';
}

function recentHistoryBefore(conversation: Conversation, messageIndex: number, latestUserIndex: number): string {
  const endIndex = latestUserIndex >= 0 ? latestUserIndex : messageIndex;
  return conversation.messages
    .slice(Math.max(0, endIndex - 8), Math.max(0, endIndex))
    .map((message) => `${message.role}: ${message.text}`)
    .join('\n');
}

function buildSourceCorpora(appData: ScenarioData, conversation: Conversation, segment: ReviewMetricSegmentInput): SourceCorpus[] {
  const messageIndex = findMessageIndex(conversation, segment.messageId);
  const latestUserIndex = messageIndex >= 0 ? latestUserIndexBefore(conversation, messageIndex) : -1;
  return [
    { source: 'latest_user_message', text: messageIndex >= 0 ? latestUserMessageBefore(conversation, messageIndex) : '' },
    { source: 'recent_chat_history', text: messageIndex >= 0 ? recentHistoryBefore(conversation, messageIndex, latestUserIndex) : '' },
    { source: 'character_card_data', text: characterCardText(appData) },
    { source: 'story_card_data', text: storyCardText(appData) },
    { source: 'goal_data', text: goalText(appData) },
    { source: 'current_state', text: currentStateText(appData) },
  ];
}

function calculateSourceOverlap(responseText: string, corpora: SourceCorpus[]): ReviewSourceOverlap[] {
  const responseTerms = Array.from(new Set(extractTerms(responseText)));
  if (responseTerms.length === 0) {
    return [{ source: 'no_obvious_source_found', matchedTerms: [], matchCount: 0 }];
  }

  const rows = corpora.map((corpus) => {
    const sourceTerms = new Set(extractTerms(corpus.text));
    const matchedTerms = responseTerms.filter((term) => sourceTerms.has(term)).slice(0, 16);
    return {
      source: corpus.source,
      matchedTerms,
      matchCount: matchedTerms.length,
    };
  }).filter((entry) => entry.matchCount > 0);

  return rows.length
    ? rows.sort((left, right) => right.matchCount - left.matchCount)
    : [{ source: 'no_obvious_source_found', matchedTerms: [], matchCount: 0 }];
}

function internalThoughtDiagnostics(tokens: TextToken[]): ReviewInternalThoughtMetric[] {
  const actionTerms = new Set(
    tokens
      .filter((token) => token.modality === 'action')
      .flatMap((token) => extractTerms(token.inner)),
  );

  return tokens
    .map((token, index) => ({ token, index }))
    .filter(({ token }) => token.modality === 'internal_thought')
    .map(({ token, index }, thoughtIndex) => {
      const thoughtTerms = Array.from(new Set(extractTerms(token.inner)));
      const connectorCount = (token.inner.match(/\b(and|but|because|while|then|also|still|meanwhile)\b/gi) || []).length;
      const sentenceCount = countSentences(token.inner);
      const repeatedActionTerms = thoughtTerms.filter((term) => actionTerms.has(term)).slice(0, 8);
      return {
        index: thoughtIndex + 1,
        wordCount: countWords(token.inner),
        sentenceCount,
        possibleMultiTopicWarning: sentenceCount > 1 || (countWords(token.inner) >= 36 && connectorCount >= 2),
        backToBackThoughtWarning: tokens[index - 1]?.modality === 'internal_thought' || tokens[index + 1]?.modality === 'internal_thought',
        repeatsVisibleActionTerms: repeatedActionTerms,
        preview: preview(token.inner),
      };
    });
}

function buildSegmentMetrics(
  segment: ReviewMetricSegmentInput,
  appData: ScenarioData,
  conversation: Conversation,
  previousAssistantTerms: Set<string>,
): ReviewSegmentDebugMetrics {
  const tokens = tokenizeRoleplayText(segment.text);
  const modalitySequence = tokens.map((token) => token.modality);
  const actionText = tokens.filter((token) => token.modality === 'action').map((token) => token.inner).join(' ');
  const dialogueText = tokens.filter((token) => token.modality === 'dialogue').map((token) => token.inner).join(' ');
  const thoughtText = tokens.filter((token) => token.modality === 'internal_thought').map((token) => token.inner).join(' ');
  const plainText = tokens.filter((token) => token.modality === 'plain_text').map((token) => token.inner).join(' ');
  const segmentTerms = extractTerms(segment.text);
  const repeatedTermsFromEarlierAssistantBlocks = Array.from(new Set(segmentTerms.filter((term) => previousAssistantTerms.has(term)))).slice(0, 16);
  const narrationWords = countWords(actionText) + countWords(thoughtText) + countWords(plainText);
  const dialogueWords = countWords(dialogueText);
  const totalWords = countWords(segment.text);
  const userStateAuthorityDecisions = segment.userStateAuthorityDecisions ?? [];
  const characterPromptOutputFactSource: CharacterPromptOutputCopyMetric['factSource'] =
    segment.characterPromptFacts != null
      ? 'generation_captured_facts'
      : 'current_card_fallback';
  const characterPromptOutputCopyMetrics = segment.role === 'assistant' && segment.localNotice == null
    ? (
      segment.characterPromptFacts != null
        ? buildCharacterPromptOutputCopyMetricsFromCapturedFacts(segment.characterPromptFacts, segment.text)
        : [...(appData.characters || []), ...(appData.sideCharacters || [])]
          .map((character) => buildCharacterPromptOutputCopyMetric(character, segment.text))
    ).filter((metric) => (
      metric.exactSourceValueCopies.length > 0 || metric.copiedSourceLabels.length > 0
    ))
    : [];

  return {
    reviewId: segment.reviewId,
    messageId: segment.messageId,
    generationId: segment.generationId,
    role: segment.role,
    speakerName: segment.speakerName,
    turnNumber: segment.turnNumber,
    segmentNumber: segment.segmentNumber,
    wordCount: totalWords,
    sentenceCount: countSentences(segment.text),
    actionSegmentCount: tokens.filter((token) => token.modality === 'action').length,
    dialogueSegmentCount: tokens.filter((token) => token.modality === 'dialogue').length,
    internalThoughtCount: tokens.filter((token) => token.modality === 'internal_thought').length,
    plainTextSegmentCount: tokens.filter((token) => token.modality === 'plain_text').length,
    actionWordCount: countWords(actionText),
    dialogueWordCount: dialogueWords,
    internalThoughtWordCount: countWords(thoughtText),
    plainTextWordCount: countWords(plainText),
    dialogueToNarrationRatio: summarizeNumber(dialogueWords / Math.max(1, narrationWords)),
    modalitySequence,
    compressedModalitySequence: compressSequence(modalitySequence),
    topRepeatedTerms: topCounts(segmentTerms, 2, 10),
    repeatedPhrases: extractRepeatedPhrases(segment.text),
    repeatedTermsFromEarlierAssistantBlocks,
    internalThoughtDiagnostics: internalThoughtDiagnostics(tokens),
    isLocalNotice: segment.localNotice != null,
    sourceOverlap: segment.role === 'assistant' && segment.localNotice == null
      ? calculateSourceOverlap(segment.text, buildSourceCorpora(appData, conversation, segment))
      : [],
    recentHistoryReceipts: segment.recentHistoryPacket?.receipts ?? [],
    suppressedStyleAnchors: segment.recentHistoryPacket?.suppressedStyleAnchors ?? [],
    userStateAuthorityDecisions,
    userStateAuthoritySummary: buildRoleplayUserStateAuthorityDebugSummary(userStateAuthorityDecisions),
    characterPromptFactSummaries: segment.characterPromptFactSummaries ?? [],
    characterPromptOutputFactSource,
    characterPromptOutputCopyMetrics,
  };
}

function transcriptMetrics(segments: ReviewSegmentDebugMetrics[]): ReviewTranscriptDebugMetrics {
  const assistantSegments = segments.filter((segment) => segment.role === 'assistant' && !segment.isLocalNotice);
  const userSegments = segments.filter((segment) => segment.role === 'user');
  const assistantWordCounts = assistantSegments.map((segment) => segment.wordCount);
  const averageAssistantWords = assistantWordCounts.length
    ? assistantWordCounts.reduce((sum, value) => sum + value, 0) / assistantWordCounts.length
    : 0;
  const variance = assistantWordCounts.length
    ? assistantWordCounts.reduce((sum, value) => sum + ((value - averageAssistantWords) ** 2), 0) / assistantWordCounts.length
    : 0;
  const minWords = assistantWordCounts.length ? Math.min(...assistantWordCounts) : 0;
  const maxWords = assistantWordCounts.length ? Math.max(...assistantWordCounts) : 0;
  const assistantSimilarLengthWarning = assistantWordCounts.length >= 3 && minWords > 0 && (maxWords - minWords) / minWords <= 0.25;

  return {
    assistantBlockCount: assistantSegments.length,
    userBlockCount: userSegments.length,
    assistantWordCounts,
    averageAssistantWords: summarizeNumber(averageAssistantWords),
    assistantWordCountVariance: summarizeNumber(variance),
    assistantSimilarLengthWarning,
    repeatedTermsAcrossAssistant: topCounts(assistantSegments.flatMap((segment) => extractTerms(segmentMetricsText(segment))), 3, 12),
    repeatedPhrasesAcrossAssistant: extractRepeatedPhrases(assistantSegments.map((segment) => segmentMetricsText(segment)).join('\n'), 12),
  };
}

function segmentMetricsText(segment: Pick<ReviewSegmentDebugMetrics, 'reviewId'> & Partial<ReviewSegmentDebugMetrics>): string {
  return (segment as { _sourceText?: string })._sourceText || '';
}

export function buildReviewDebugMetrics(args: {
  appData: ScenarioData;
  conversation: Conversation;
  segments: ReviewMetricSegmentInput[];
}): ReviewDebugMetrics {
  const previousAssistantTerms = new Set<string>();
  const metrics: ReviewSegmentDebugMetrics[] = [];

  for (const segment of args.segments) {
    const segmentMetrics = buildSegmentMetrics(segment, args.appData, args.conversation, previousAssistantTerms) as ReviewSegmentDebugMetrics & { _sourceText?: string };
    segmentMetrics._sourceText = segment.text;
    metrics.push(segmentMetrics);

    if (segment.role === 'assistant') {
      extractTerms(segment.text).forEach((term) => previousAssistantTerms.add(term));
    }
  }

  return {
    schema: 'chronicle-session-deterministic-metrics-v1',
    explanation: 'Computed locally from exported text and available app state. These are deterministic debugging hints, not model reasoning and not quality judgments.',
    transcript: transcriptMetrics(metrics),
    segments: metrics.map((segment) => {
      const { _sourceText, ...publicMetrics } = segment as ReviewSegmentDebugMetrics & { _sourceText?: string };
      return publicMetrics;
    }),
  };
}
