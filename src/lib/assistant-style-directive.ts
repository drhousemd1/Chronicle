export type AssistantStyleMessage = {
  role?: string;
  text?: string | null;
};

type CadenceMarker = 'action' | 'dialogue' | 'thought';

type CadenceAnalysis = {
  shapes: string[];
  blockCadences: CadenceMarker[][];
  repeatedTriadBlocks: number;
  totalBlocks: number;
};

function normalizeQuote(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
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

  for (const message of messages) {
    const cadences = splitTaggedBlocks(message.text || '')
      .map(extractCadenceMarkers)
      .filter((cadence) => cadence.length > 0);

    if (cadences.length === 0) continue;
    shapes.push(cadences.map((cadence) => cadence.join('>')).join('|'));
    blockCadences.push(...cadences);
  }

  const repeatedTriadBlocks = blockCadences.filter(hasActionDialogueThoughtCadence).length;

  return {
    shapes,
    blockCadences,
    repeatedTriadBlocks,
    totalBlocks: blockCadences.length,
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

  if (!hasLockedLength && !hasLockedShape && !hasRepeatedTriadCadence && !hasRepeatedShortQuote) {
    return '';
  }

  const reasons = [
    hasLockedLength ? 'similar assistant response lengths' : '',
    hasLockedShape ? 'the same assistant block order' : '',
    hasRepeatedTriadCadence ? 'repeated action -> dialogue -> internal thought cadence' : '',
    hasRepeatedShortQuote ? 'reused short assistant dialogue phrasing' : '',
  ].filter(Boolean).join(', ');

  return `[STYLE ADJUSTMENT FOR THIS TURN]
Your own recent assistant responses are repeating ${reasons}. Compare against your own previous 2-3 assistant character blocks, not the user's message. Vary the next response naturally. Do not force every character block into the same action -> dialogue -> internal thought sequence, and do not reuse recent distinctive sentence shapes or short reactive lines unless the scene specifically calls for that repetition.`;
}
