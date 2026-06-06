export type AssistantStyleMessage = {
  role?: string;
  text?: string | null;
};

type CadenceMarker = 'action' | 'dialogue' | 'thought';

type CadenceAnalysis = {
  shapes: string[];
  blockCadences: CadenceMarker[][];
  repeatedTriadBlocks: number;
  actionFirstDialogueBlocks: number;
  narrationHeavyBlocks: number;
  lowDialogueBlocks: number;
  frontLoadedNarrationBlocks: number;
  totalBlocks: number;
};

type AssistantMessageStyle = CadenceAnalysis & {
  wordCount: number;
  shortQuotes: string[];
  descriptiveTerms: string[];
  contentTerms: string[];
};

const DESCRIPTIVE_STOPWORDS = new Set([
  'about',
  'again',
  'against',
  'after',
  'along',
  'already',
  'around',
  'before',
  'behind',
  'being',
  'between',
  'could',
  'every',
  'their',
  'there',
  'these',
  'thing',
  'through',
  'under',
  'while',
  'would',
]);

const CONTENT_STOPWORDS = new Set([
  ...DESCRIPTIVE_STOPWORDS,
  'because',
  'being',
  'close',
  'going',
  'right',
  'something',
  'still',
  'think',
  'thing',
  'things',
  'want',
  'wants',
]);

function normalizeQuote(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

function countWords(value: string): number {
  return (value.match(/[A-Za-z][A-Za-z'-]{1,}/g) || []).length;
}

function extractDialogueText(value: string): string {
  return Array.from(value.matchAll(/"([^"]+)"|“([^”]+)”/g))
    .map((match) => match[1] || match[2] || '')
    .join(' ');
}

function extractDialogueSegments(value: string): string[] {
  return Array.from(value.matchAll(/"([^"]+)"|“([^”]+)”/g))
    .map((match) => (match[1] || match[2] || '').trim())
    .filter(Boolean);
}

function stripDialogueText(value: string): string {
  return value.replace(/"[^"]+"|“[^”]+”/g, ' ');
}

function firstDialogueRatio(value: string): number {
  const straightQuote = value.search(/"/);
  const curlyQuote = value.search(/“/);
  const indexes = [straightQuote, curlyQuote].filter((index) => index >= 0);
  if (indexes.length === 0 || value.length === 0) return 1;
  return Math.min(...indexes) / value.length;
}

function extractDescriptiveTerms(value: string): string[] {
  const withoutDialogue = stripDialogueText(value)
    .replace(/(?:^|\n{2,})([^:\n]{1,80}):\s*/g, ' ')
    .replace(/\b[A-Z][a-z]+(?:'s)?\b/g, ' ')
    .replace(/[*()]/g, ' ')
    .toLowerCase();

  return (withoutDialogue.match(/[a-z][a-z'-]{4,}/g) || [])
    .map((term) => term.replace(/'s$/, ''))
    .filter((term) => !DESCRIPTIVE_STOPWORDS.has(term));
}

function extractContentTerms(value: string): string[] {
  const normalized = (value || '')
    .replace(/(?:^|\n{2,})([^:\n]{1,80}):\s*/g, ' ')
    .replace(/[*()"]/g, ' ')
    .toLowerCase();

  return (normalized.match(/[a-z][a-z'-]{4,}/g) || [])
    .map((term) => term.replace(/'s$/, ''))
    .filter((term) => !CONTENT_STOPWORDS.has(term));
}

function splitTaggedBlocks(text: string): string[] {
  const normalized = (text || '').replace(/\r/g, '').trim();
  if (!normalized) return [];

  const matches = Array.from(normalized.matchAll(/(?:^|\n{2,})([^:\n]{1,80}):\s*/g));
  if (matches.length === 0) return [normalized];

  return matches
    .map((match, index) => {
      const start = (match.index || 0) + match[0].length;
      const next = matches[index + 1];
      const end = next?.index ?? normalized.length;
      return normalized.slice(start, end).trim();
    })
    .filter(Boolean);
}

function extractCadenceMarkers(blockText: string): CadenceMarker[] {
  const markers = Array.from(
    blockText.matchAll(/\*[^*]+\*|"[^"]+"|“[^”]+”|\([^)]{2,}\)/g),
  ).map((match): CadenceMarker => {
    const value = match[0];
    if (value.startsWith('*')) return 'action';
    if (value.startsWith('(')) return 'thought';
    return 'dialogue';
  });

  return markers.filter((marker, index) => marker !== markers[index - 1]);
}

function hasActionDialogueThoughtCadence(cadence: CadenceMarker[]): boolean {
  const actionIndex = cadence.indexOf('action');
  if (actionIndex !== 0) return false;
  const dialogueIndex = cadence.indexOf('dialogue', actionIndex + 1);
  if (dialogueIndex < 0) return false;
  const thoughtIndex = cadence.indexOf('thought', dialogueIndex + 1);
  return thoughtIndex >= 0;
}

function hasActionFirstDialogueCadence(cadence: CadenceMarker[]): boolean {
  return cadence[0] === 'action' && cadence.includes('dialogue');
}

function analyzeAssistantCadence(messages: AssistantStyleMessage[]): CadenceAnalysis {
  const shapes: string[] = [];
  const blockCadences: CadenceMarker[][] = [];
  let narrationHeavyBlocks = 0;
  let lowDialogueBlocks = 0;
  let frontLoadedNarrationBlocks = 0;

  for (const message of messages) {
    const blocks = splitTaggedBlocks(message.text || '');
    const cadences = blocks.map(extractCadenceMarkers).filter((cadence) => cadence.length > 0);

    blocks.forEach((block) => {
      const totalWords = countWords(block);
      const dialogueWords = countWords(extractDialogueText(block));
      const dialogueRatio = totalWords > 0 ? dialogueWords / totalWords : 0;

      if (totalWords >= 60 && dialogueRatio < 0.12) narrationHeavyBlocks += 1;
      if (totalWords >= 45 && dialogueWords < 10) lowDialogueBlocks += 1;
      if (totalWords >= 70 && firstDialogueRatio(block) > 0.45) frontLoadedNarrationBlocks += 1;
    });

    if (cadences.length === 0) continue;
    shapes.push(cadences.map((cadence) => cadence.join('>')).join('|'));
    blockCadences.push(...cadences);
  }

  const repeatedTriadBlocks = blockCadences.filter(hasActionDialogueThoughtCadence).length;
  const actionFirstDialogueBlocks = blockCadences.filter(hasActionFirstDialogueCadence).length;

  return {
    shapes,
    blockCadences,
    repeatedTriadBlocks,
    actionFirstDialogueBlocks,
    narrationHeavyBlocks,
    lowDialogueBlocks,
    frontLoadedNarrationBlocks,
    totalBlocks: blockCadences.length,
  };
}

function analyzeAssistantMessage(text: string): AssistantMessageStyle {
  const cadence = analyzeAssistantCadence([{ role: 'assistant', text }]);
  const shortQuotes = Array.from((text || '').matchAll(/"([^"]{3,120})"|“([^”]{3,120})”/g))
    .map((match) => normalizeQuote(match[1] || match[2] || ''))
    .filter((quote) => quote.split(/\s+/).length <= 14);

  return {
    ...cadence,
    wordCount: countWords(text),
    shortQuotes: Array.from(new Set(shortQuotes)),
    descriptiveTerms: Array.from(new Set(extractDescriptiveTerms(text))),
    contentTerms: Array.from(new Set(extractContentTerms(text))),
  };
}

function hasOffloadingQuestion(value: string): boolean {
  const normalizedDialogue = extractDialogueSegments(value).map(normalizeQuote);
  const normalizedFullText = normalizeQuote(
    (value || '')
      .replace(/(?:^|\n{2,})([^:\n]{1,80}):\s*/g, ' ')
      .replace(/[*()"]/g, ' '),
  );

  const offloadingPattern = /\b(what do you want me to do|what should i do|what do you do next|how do you respond|what happens next|tell me what happens|tell me what to do|your move)\b/i;

  return normalizedDialogue.some((line) => line.includes('?') && offloadingPattern.test(line))
    || offloadingPattern.test(normalizedFullText);
}

function hasSubstantialAiDevelopment(value: string): boolean {
  const actionOrThoughtWords = countWords(
    stripDialogueText(value)
      .replace(/\([^)]*\)/g, ' ')
      .replace(/(?:^|\n{2,})([^:\n]{1,80}):\s*/g, ' '),
  );
  const dialogueWords = countWords(extractDialogueText(value));
  return actionOrThoughtWords >= 40 || dialogueWords >= 24;
}

export function buildAssistantStyleDirective(
  messages: AssistantStyleMessage[],
  recentLengths: number[] = [],
): string {
  const recentAssistantMessages = messages
    .filter((message) => message.role === 'assistant' && message.text?.trim())
    .slice(-3);

  if (recentAssistantMessages.length === 0) return '';

  const recentAssistantLengths = recentLengths.slice(-3);
  const hasLockedLength = recentAssistantLengths.length >= 3 && (() => {
    const min = Math.min(...recentAssistantLengths);
    const max = Math.max(...recentAssistantLengths);
    return min > 0 && (max - min) / min <= 0.2;
  })();

  const cadenceWindow = recentAssistantMessages.slice(-2);
  const cadenceAnalysis = analyzeAssistantCadence(cadenceWindow);
  const hasLockedShape = cadenceAnalysis.shapes.length >= 2
    && cadenceAnalysis.shapes.every((shape) => shape === cadenceAnalysis.shapes[0]);
  const hasRepeatedTriadCadence = cadenceAnalysis.totalBlocks >= 2
    && cadenceAnalysis.repeatedTriadBlocks >= 2
    && cadenceAnalysis.repeatedTriadBlocks / cadenceAnalysis.totalBlocks >= 0.5;
  const hasRepeatedActionDialogueCadence = cadenceAnalysis.totalBlocks >= 2
    && cadenceAnalysis.actionFirstDialogueBlocks >= 2
    && cadenceAnalysis.actionFirstDialogueBlocks / cadenceAnalysis.totalBlocks >= 0.5;

  const quotedLineCounts = new Map<string, number>();
  recentAssistantMessages.forEach((message) => {
    const quotes = Array.from((message.text || '').matchAll(/"([^"]{3,120})"|“([^”]{3,120})”/g))
      .map((match) => normalizeQuote(match[1] || match[2] || ''))
      .filter((quote) => quote.split(/\s+/).length <= 14);
    new Set(quotes).forEach((quote) => {
      quotedLineCounts.set(quote, (quotedLineCounts.get(quote) || 0) + 1);
    });
  });
  const hasRepeatedShortQuote = Array.from(quotedLineCounts.values()).some((count) => count >= 2);
  const descriptiveTermCounts = new Map<string, number>();
  recentAssistantMessages.forEach((message) => {
    new Set(extractDescriptiveTerms(message.text || '')).forEach((term) => {
      descriptiveTermCounts.set(term, (descriptiveTermCounts.get(term) || 0) + 1);
    });
  });
  const repeatedDescriptiveTerms = Array.from(descriptiveTermCounts.entries())
    .filter(([, count]) => count >= 2)
    .map(([term]) => term)
    .slice(0, 5);
  const hasRepeatedDescriptiveTerms = repeatedDescriptiveTerms.length > 0;
  const contentTermCounts = new Map<string, number>();
  recentAssistantMessages.forEach((message) => {
    new Set(extractContentTerms(message.text || '')).forEach((term) => {
      contentTermCounts.set(term, (contentTermCounts.get(term) || 0) + 1);
    });
  });
  const repeatedContentTerms = Array.from(contentTermCounts.entries())
    .filter(([, count]) => count >= 2)
    .map(([term]) => term)
    .slice(0, 4);
  const hasRepeatedContentFocus = repeatedContentTerms.length >= 3;
  const hasNarrationHeavyOutput = cadenceAnalysis.totalBlocks >= 1 && cadenceAnalysis.narrationHeavyBlocks > 0;
  const hasLowDialogueOutput = cadenceAnalysis.totalBlocks >= 1 && cadenceAnalysis.lowDialogueBlocks > 0;
  const hasFrontLoadedNarration = cadenceAnalysis.totalBlocks >= 1 && cadenceAnalysis.frontLoadedNarrationBlocks > 0;

  if (
    !hasLockedLength
    && !hasLockedShape
    && !hasRepeatedTriadCadence
    && !hasRepeatedActionDialogueCadence
    && !hasRepeatedShortQuote
    && !hasRepeatedDescriptiveTerms
    && !hasRepeatedContentFocus
    && !hasNarrationHeavyOutput
    && !hasLowDialogueOutput
    && !hasFrontLoadedNarration
  ) {
    return '';
  }

  const reasons = [
    hasLockedLength ? 'similar assistant response lengths' : '',
    hasLockedShape ? 'the same assistant block order' : '',
    hasRepeatedTriadCadence ? 'repeated action -> dialogue -> internal thought cadence' : '',
    hasRepeatedActionDialogueCadence ? 'repeated action-first dialogue cadence' : '',
    hasRepeatedShortQuote ? 'reused short assistant dialogue phrasing' : '',
    hasRepeatedDescriptiveTerms ? `repeated descriptive terms (${repeatedDescriptiveTerms.join(', ')})` : '',
    hasRepeatedContentFocus ? `repeated dialogue or topic focus (${repeatedContentTerms.join(', ')})` : '',
    hasNarrationHeavyOutput ? 'narration-heavy responses' : '',
    hasLowDialogueOutput ? 'missing or very low external dialogue' : '',
    hasFrontLoadedNarration ? 'external dialogue appearing too late after a long narration opening' : '',
  ].filter(Boolean).join(', ');

  const correctiveLines = [
    'Use recent assistant messages for story state, not as a style template.',
    hasRepeatedDescriptiveTerms || hasRepeatedContentFocus
      ? 'Use established details as causes or consequences, not repeated description or topic recycling.'
      : '',
    hasNarrationHeavyOutput || hasLowDialogueOutput || hasFrontLoadedNarration
      ? 'Move into purposeful external dialogue when present AI-controlled characters can naturally speak.'
      : '',
    'Vary the next response with a natural structure that fits the current exchange and active Response Detail setting.',
  ].filter(Boolean);

  return `[STYLE ADJUSTMENT FOR THIS TURN]
Recent assistant responses are repeating: ${reasons}.
${correctiveLines.join('\n')}`;
}

export function buildDetailedCollapseDirective(
  messages: AssistantStyleMessage[],
  recentLengths: number[] = [],
): string {
  const recentAssistantMessages = messages
    .filter((message) => message.role === 'assistant' && message.text?.trim())
    .slice(-3);

  if (recentAssistantMessages.length < 2) return '';

  const measuredLengths = recentLengths.length > 0
    ? recentLengths.slice(-3)
    : recentAssistantMessages.map((message) => analyzeAssistantMessage(message.text || '').wordCount);
  const lastTwo = measuredLengths.slice(-2);
  const sorted = [...measuredLengths].sort((a, b) => a - b);
  const median = sorted.length > 0 ? sorted[Math.floor(sorted.length / 2)] : 0;
  const collapsedTwoTurns = lastTwo.length >= 2 && lastTwo.every((length) => length > 0 && length < 70);
  const collapsedWindow = measuredLengths.length >= 3 && median > 0 && median < 90;

  if (!collapsedTwoTurns && !collapsedWindow) return '';

  return `[STYLE CORRECTION]
Recent assistant responses are shorter or less developed than the active Response Detail setting calls for.
Use recent messages for story state, not as a response-length template.
Develop the AI-controlled side of the current exchange with meaningful external dialogue when speech is natural and enough action or description to make the moment clear before stopping for the user.`;
}

export function buildAssistantRepetitionRepairDirective(
  messages: AssistantStyleMessage[],
  candidateText: string,
  recentLengths: number[] = [],
  comparisonTexts: string[] = [],
): string {
  const recentAssistantMessages = messages
    .filter((message) => message.role === 'assistant' && message.text?.trim())
    .slice(-3);

  const comparisonMessages = comparisonTexts
    .filter((text) => text?.trim())
    .map((text) => ({ role: 'assistant', text }));

  if (recentAssistantMessages.length === 0 && comparisonMessages.length === 0) return '';
  if (!candidateText.trim()) return '';

  const candidate = analyzeAssistantMessage(candidateText);
  const previous = [...recentAssistantMessages, ...comparisonMessages]
    .map((message) => analyzeAssistantMessage(message.text || ''));
  const previousShapes = new Set(previous.flatMap((analysis) => analysis.shapes));
  const previousShortQuotes = new Set(previous.flatMap((analysis) => analysis.shortQuotes));
  const previousTerms = new Set(previous.flatMap((analysis) => analysis.descriptiveTerms));
  const previousContentTerms = new Set(previous.flatMap((analysis) => analysis.contentTerms));

  const repeatedTerms = candidate.descriptiveTerms.filter((term) => previousTerms.has(term)).slice(0, 5);
  const repeatedContentTerms = candidate.contentTerms.filter((term) => previousContentTerms.has(term)).slice(0, 4);
  const repeatedQuotes = candidate.shortQuotes.filter((quote) => previousShortQuotes.has(quote));
  const repeatedShape = candidate.shapes.some((shape) => previousShapes.has(shape));
  const repeatedTriad = candidate.totalBlocks > 0
    && candidate.repeatedTriadBlocks / candidate.totalBlocks >= 0.5
    && previous.some((analysis) => analysis.totalBlocks > 0 && analysis.repeatedTriadBlocks / analysis.totalBlocks >= 0.5);
  const repeatedActionFirstDialogue = candidate.totalBlocks > 0
    && candidate.actionFirstDialogueBlocks / candidate.totalBlocks >= 0.5
    && previous.some((analysis) => analysis.totalBlocks > 0 && analysis.actionFirstDialogueBlocks / analysis.totalBlocks >= 0.5);
  const frontLoaded = candidate.frontLoadedNarrationBlocks > 0 || candidate.narrationHeavyBlocks > 0 || candidate.lowDialogueBlocks > 0;
  const offloadedScene = hasOffloadingQuestion(candidateText) && !hasSubstantialAiDevelopment(candidateText);
  const lockedLength = recentLengths.length > 0 && (() => {
    const lastLength = recentLengths[recentLengths.length - 1];
    const candidateLength = candidate.wordCount;
    if (!lastLength || !candidateLength) return false;
    const min = Math.min(lastLength, candidateLength);
    const max = Math.max(lastLength, candidateLength);
    return (max - min) / min <= 0.15;
  })();

  const structureReasons = [
    repeatedShape ? 'same structure as a recent assistant response' : '',
    repeatedTriad ? 'same action -> dialogue -> internal thought cadence' : '',
    repeatedActionFirstDialogue ? 'same action-first dialogue cadence' : '',
    lockedLength ? 'same response length band' : '',
  ].filter(Boolean);
  const wordingReasons = [
    repeatedQuotes.length > 0 ? 'reused short dialogue phrasing' : '',
    repeatedTerms.length >= 3 ? `reused descriptive focus (${repeatedTerms.join(', ')})` : '',
    repeatedContentTerms.length >= 3 ? `reused dialogue or topic focus (${repeatedContentTerms.join(', ')})` : '',
  ].filter(Boolean);
  const qualityReasons = [
    frontLoaded ? 'front-loaded narration or weak dialogue balance' : '',
    offloadedScene ? 'offloaded the scene to the user instead of developing the AI-controlled side' : '',
  ].filter(Boolean);

  const reasonGroupsPresent = [
    structureReasons.length > 0,
    wordingReasons.length > 0,
    qualityReasons.length > 0,
  ].filter(Boolean).length;
  const hasDirectCopyRisk = repeatedQuotes.length > 0
    && (repeatedTerms.length >= 2 || repeatedContentTerms.length >= 2);
  const hasRegenerationQuoteReuse = repeatedQuotes.length > 0 && comparisonMessages.length > 0;
  const shouldRepair = reasonGroupsPresent >= 2 || hasDirectCopyRisk || hasRegenerationQuoteReuse || offloadedScene;

  const reasons = [...structureReasons, ...wordingReasons, ...qualityReasons];

  if (!shouldRepair || reasons.length === 0) return '';

  return `[OUTPUT REVISION REQUIRED]
The draft needs revision because: ${reasons.join(', ')}.
Rewrite once while preserving the current story facts, speaker tags, user-control boundaries, and user input.
Use established details as causes or consequences, not repeated description.
Add concrete AI-controlled development instead of restating the same structure, topic focus, closing pattern, or asking the user to carry the scene.`;
}
