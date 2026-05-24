export type AssistantStyleMessage = {
  role?: string;
  text?: string | null;
};

type CadenceMarker = 'action' | 'dialogue' | 'thought';

type CadenceAnalysis = {
  shapes: string[];
  blockCadences: CadenceMarker[][];
  repeatedTriadBlocks: number;
  narrationHeavyBlocks: number;
  lowDialogueBlocks: number;
  frontLoadedNarrationBlocks: number;
  totalBlocks: number;
};

type AssistantMessageStyle = CadenceAnalysis & {
  wordCount: number;
  shortQuotes: string[];
  descriptiveTerms: string[];
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

  return {
    shapes,
    blockCadences,
    repeatedTriadBlocks,
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
  };
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
  const hasNarrationHeavyOutput = cadenceAnalysis.totalBlocks >= 1 && cadenceAnalysis.narrationHeavyBlocks > 0;
  const hasLowDialogueOutput = cadenceAnalysis.totalBlocks >= 1 && cadenceAnalysis.lowDialogueBlocks > 0;
  const hasFrontLoadedNarration = cadenceAnalysis.totalBlocks >= 1 && cadenceAnalysis.frontLoadedNarrationBlocks > 0;

  if (
    !hasLockedLength
    && !hasLockedShape
    && !hasRepeatedTriadCadence
    && !hasRepeatedShortQuote
    && !hasRepeatedDescriptiveTerms
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
    hasRepeatedShortQuote ? 'reused short assistant dialogue phrasing' : '',
    hasRepeatedDescriptiveTerms ? `repeated descriptive terms (${repeatedDescriptiveTerms.join(', ')})` : '',
    hasNarrationHeavyOutput ? 'narration-heavy responses' : '',
    hasLowDialogueOutput ? 'missing or very low external dialogue' : '',
    hasFrontLoadedNarration ? 'external dialogue appearing too late after a long narration opening' : '',
  ].filter(Boolean).join(', ');

  return `[STYLE ADJUSTMENT FOR THIS TURN]
Your own recent assistant responses are repeating ${reasons}. Compare against your own previous 2-3 assistant character blocks, not the user's message. Vary the next response naturally. Do not force every character block into the same action -> dialogue -> internal thought sequence, do not bury external dialogue behind a long narration opening, and do not reuse recent descriptive terms, body/clothing focus, object focus, location focus, distinctive sentence shapes, or short reactive lines unless the scene specifically calls for that repetition.`;
}

export function buildAssistantRepetitionRepairDirective(
  messages: AssistantStyleMessage[],
  candidateText: string,
  recentLengths: number[] = [],
): string {
  const recentAssistantMessages = messages
    .filter((message) => message.role === 'assistant' && message.text?.trim())
    .slice(-3);

  if (recentAssistantMessages.length === 0 || !candidateText.trim()) return '';

  const candidate = analyzeAssistantMessage(candidateText);
  const previous = recentAssistantMessages.map((message) => analyzeAssistantMessage(message.text || ''));
  const previousShapes = new Set(previous.flatMap((analysis) => analysis.shapes));
  const previousShortQuotes = new Set(previous.flatMap((analysis) => analysis.shortQuotes));
  const previousTerms = new Set(previous.flatMap((analysis) => analysis.descriptiveTerms));

  const repeatedTerms = candidate.descriptiveTerms.filter((term) => previousTerms.has(term)).slice(0, 5);
  const repeatedQuotes = candidate.shortQuotes.filter((quote) => previousShortQuotes.has(quote));
  const repeatedShape = candidate.shapes.some((shape) => previousShapes.has(shape));
  const repeatedTriad = candidate.totalBlocks > 0
    && candidate.repeatedTriadBlocks / candidate.totalBlocks >= 0.5
    && previous.some((analysis) => analysis.totalBlocks > 0 && analysis.repeatedTriadBlocks / analysis.totalBlocks >= 0.5);
  const frontLoaded = candidate.frontLoadedNarrationBlocks > 0 || candidate.narrationHeavyBlocks > 0 || candidate.lowDialogueBlocks > 0;
  const lockedLength = recentLengths.length > 0 && (() => {
    const lastLength = recentLengths[recentLengths.length - 1];
    const candidateLength = candidate.wordCount;
    if (!lastLength || !candidateLength) return false;
    const min = Math.min(lastLength, candidateLength);
    const max = Math.max(lastLength, candidateLength);
    return (max - min) / min <= 0.15;
  })();

  const reasons = [
    repeatedShape ? 'same structure as a recent assistant response' : '',
    repeatedTriad ? 'same action -> dialogue -> internal thought cadence' : '',
    repeatedQuotes.length > 0 ? 'reused short dialogue phrasing' : '',
    repeatedTerms.length >= 3 ? `reused descriptive focus (${repeatedTerms.join(', ')})` : '',
    frontLoaded ? 'front-loaded narration or weak dialogue balance' : '',
    lockedLength ? 'same response length band' : '',
  ].filter(Boolean);

  if (reasons.length === 0) return '';

  return `[OUTPUT REVISION REQUIRED]
The draft response repeated ${reasons.join(', ')}. Regenerate the response once. Keep the same established facts, speaker tags, user-character boundaries, and emotional direction, but do not rewrite the same exchange with swapped wording. The new response must add a concrete AI-owned development that changes the situation while preserving the user's control of their character. Use meaningful external dialogue when the character can speak, and avoid reusing the same descriptive focus, sentence shape, or closing internal thought pattern.`;
}
