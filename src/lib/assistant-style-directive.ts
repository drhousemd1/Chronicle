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


export type AssistantStyleFlag =
  | 'locked_response_length'
  | 'locked_block_shape'
  | 'repeated_action_dialogue_thought_cadence'
  | 'repeated_action_first_dialogue_cadence'
  | 'reused_short_dialogue_phrasing'
  | 'repeated_descriptive_terms'
  | 'repeated_dialogue_or_topic_focus'
  | 'narration_heavy_output'
  | 'low_external_dialogue'
  | 'front_loaded_narration'
  | 'detailed_response_collapse'
  | 'same_candidate_structure'
  | 'candidate_length_lock'
  | 'offloaded_scene_to_user';

export type AssistantStyleTelemetry = {
  source: 'recent_assistant_window' | 'candidate_output';
  diagnosticOnly: true;
  hiddenRetryAllowed: false;
  triggered: boolean;
  flags: AssistantStyleFlag[];
  reasons: string[];
  repeatedDescriptiveTerms: string[];
  repeatedContentTerms: string[];
  repeatedShortDialogue: string[];
  metrics: {
    assistantMessageCount: number;
    totalBlocks: number;
    wordCount?: number;
    recentLengths?: number[];
  };
};

function buildTelemetry(input: Omit<AssistantStyleTelemetry, 'diagnosticOnly' | 'hiddenRetryAllowed' | 'triggered'>): AssistantStyleTelemetry {
  const uniqueFlags = Array.from(new Set(input.flags));
  const uniqueReasons = Array.from(new Set(input.reasons.filter(Boolean)));
  return {
    ...input,
    diagnosticOnly: true,
    hiddenRetryAllowed: false,
    triggered: uniqueFlags.length > 0,
    flags: uniqueFlags,
    reasons: uniqueReasons,
  };
}

function countRepeatedShortQuotes(messages: AssistantStyleMessage[]): Map<string, number> {
  const quotedLineCounts = new Map<string, number>();
  messages.forEach((message) => {
    const quotes = Array.from((message.text || '').matchAll(/"([^"]{3,120})"|“([^”]{3,120})”/g))
      .map((match) => normalizeQuote(match[1] || match[2] || ''))
      .filter((quote) => quote.split(/\s+/).length <= 14);
    new Set(quotes).forEach((quote) => {
      quotedLineCounts.set(quote, (quotedLineCounts.get(quote) || 0) + 1);
    });
  });
  return quotedLineCounts;
}

function collectRepeatedTerms(
  messages: AssistantStyleMessage[],
  extractor: (value: string) => string[],
  minimumCount: number,
  maxTerms: number,
): string[] {
  const counts = new Map<string, number>();
  messages.forEach((message) => {
    new Set(extractor(message.text || '')).forEach((term) => {
      counts.set(term, (counts.get(term) || 0) + 1);
    });
  });
  return Array.from(counts.entries())
    .filter(([, count]) => count >= minimumCount)
    .map(([term]) => term)
    .slice(0, maxTerms);
}

export function analyzeRecentAssistantStyle(
  messages: AssistantStyleMessage[],
  recentLengths: number[] = [],
  responseVerbosity: string = 'balanced',
): AssistantStyleTelemetry {
  const recentAssistantMessages = messages
    .filter((message) => message.role === 'assistant' && message.text?.trim())
    .slice(-3);

  if (recentAssistantMessages.length <= 1) {
    return buildTelemetry({
      source: 'recent_assistant_window',
      flags: [],
      reasons: [],
      repeatedDescriptiveTerms: [],
      repeatedContentTerms: [],
      repeatedShortDialogue: [],
      metrics: {
        assistantMessageCount: recentAssistantMessages.length,
        totalBlocks: 0,
        recentLengths: recentLengths.slice(-3),
      },
    });
  }

  const flags: AssistantStyleFlag[] = [];
  const reasons: string[] = [];
  const recentAssistantLengths = recentLengths.slice(-3);
  const hasLockedLength = recentAssistantLengths.length >= 3 && (() => {
    const min = Math.min(...recentAssistantLengths);
    const max = Math.max(...recentAssistantLengths);
    return min > 0 && (max - min) / min <= 0.2;
  })();
  if (hasLockedLength) {
    flags.push('locked_response_length');
    reasons.push('Recent assistant responses stayed in the same length band.');
  }

  const cadenceWindow = recentAssistantMessages.slice(-2);
  const cadenceAnalysis = analyzeAssistantCadence(cadenceWindow);
  const hasLockedShape = cadenceAnalysis.shapes.length >= 2
    && cadenceAnalysis.shapes.every((shape) => shape === cadenceAnalysis.shapes[0]);
  if (hasLockedShape) {
    flags.push('locked_block_shape');
    reasons.push('Recent assistant character blocks used the same marker order.');
  }

  const hasRepeatedTriadCadence = cadenceAnalysis.totalBlocks >= 2
    && cadenceAnalysis.repeatedTriadBlocks >= 2
    && cadenceAnalysis.repeatedTriadBlocks / cadenceAnalysis.totalBlocks >= 0.5;
  if (hasRepeatedTriadCadence) {
    flags.push('repeated_action_dialogue_thought_cadence');
    reasons.push('Recent assistant blocks repeatedly used action, dialogue, then internal thought.');
  }

  const hasRepeatedActionDialogueCadence = cadenceAnalysis.totalBlocks >= 2
    && cadenceAnalysis.actionFirstDialogueBlocks >= 2
    && cadenceAnalysis.actionFirstDialogueBlocks / cadenceAnalysis.totalBlocks >= 0.5;
  if (hasRepeatedActionDialogueCadence) {
    flags.push('repeated_action_first_dialogue_cadence');
    reasons.push('Recent assistant blocks repeatedly opened with action before dialogue.');
  }

  const repeatedShortDialogue = Array.from(countRepeatedShortQuotes(recentAssistantMessages).entries())
    .filter(([, count]) => count >= 2)
    .map(([quote]) => quote)
    .slice(0, 5);
  if (repeatedShortDialogue.length > 0) {
    flags.push('reused_short_dialogue_phrasing');
    reasons.push('Recent assistant output reused short dialogue phrasing.');
  }

  const repeatedDescriptiveTerms = collectRepeatedTerms(recentAssistantMessages, extractDescriptiveTerms, 2, 5);
  if (repeatedDescriptiveTerms.length > 0) {
    flags.push('repeated_descriptive_terms');
    reasons.push('Recent assistant output reused descriptive terms.');
  }

  const repeatedContentTerms = collectRepeatedTerms(recentAssistantMessages, extractContentTerms, 2, 4);
  if (repeatedContentTerms.length >= 3) {
    flags.push('repeated_dialogue_or_topic_focus');
    reasons.push('Recent assistant output repeated the same dialogue or topic focus.');
  }

  if (cadenceAnalysis.totalBlocks >= 1 && cadenceAnalysis.narrationHeavyBlocks > 0) {
    flags.push('narration_heavy_output');
    reasons.push('Recent assistant output was narration-heavy.');
  }
  if (cadenceAnalysis.totalBlocks >= 1 && cadenceAnalysis.lowDialogueBlocks > 0) {
    flags.push('low_external_dialogue');
    reasons.push('Recent assistant output had very little external dialogue.');
  }
  if (cadenceAnalysis.totalBlocks >= 1 && cadenceAnalysis.frontLoadedNarrationBlocks > 0) {
    flags.push('front_loaded_narration');
    reasons.push('Recent assistant output delayed external dialogue behind a long narration opening.');
  }

  const measuredLengths = recentLengths.length > 0
    ? recentLengths.slice(-3)
    : recentAssistantMessages.map((message) => analyzeAssistantMessage(message.text || '').wordCount);
  const lastTwo = measuredLengths.slice(-2);
  const sorted = [...measuredLengths].sort((a, b) => a - b);
  const median = sorted.length > 0 ? sorted[Math.floor(sorted.length / 2)] : 0;
  const collapsedTwoTurns = responseVerbosity === 'detailed' && lastTwo.length >= 2 && lastTwo.every((length) => length > 0 && length < 70);
  const collapsedWindow = responseVerbosity === 'detailed' && measuredLengths.length >= 3 && median > 0 && median < 90;
  if (collapsedTwoTurns || collapsedWindow) {
    flags.push('detailed_response_collapse');
    reasons.push('Recent assistant responses were shorter than expected for the selected detail setting.');
  }

  return buildTelemetry({
    source: 'recent_assistant_window',
    flags,
    reasons,
    repeatedDescriptiveTerms,
    repeatedContentTerms,
    repeatedShortDialogue,
    metrics: {
      assistantMessageCount: recentAssistantMessages.length,
      totalBlocks: cadenceAnalysis.totalBlocks,
      recentLengths: measuredLengths,
    },
  });
}

export function analyzeAssistantCandidateStyle(
  messages: AssistantStyleMessage[],
  candidateText: string,
  recentLengths: number[] = [],
  comparisonTexts: string[] = [],
): AssistantStyleTelemetry {
  const recentAssistantMessages = messages
    .filter((message) => message.role === 'assistant' && message.text?.trim())
    .slice(-3);
  const comparisonMessages = comparisonTexts
    .filter((text) => text?.trim())
    .map((text) => ({ role: 'assistant', text }));

  if ((recentAssistantMessages.length === 0 && comparisonMessages.length === 0) || !candidateText.trim()) {
    return buildTelemetry({
      source: 'candidate_output',
      flags: [],
      reasons: [],
      repeatedDescriptiveTerms: [],
      repeatedContentTerms: [],
      repeatedShortDialogue: [],
      metrics: {
        assistantMessageCount: recentAssistantMessages.length + comparisonMessages.length,
        totalBlocks: 0,
        wordCount: countWords(candidateText),
        recentLengths: recentLengths.slice(-3),
      },
    });
  }

  const candidate = analyzeAssistantMessage(candidateText);
  const previous = [...recentAssistantMessages, ...comparisonMessages]
    .map((message) => analyzeAssistantMessage(message.text || ''));
  const previousShapes = new Set(previous.flatMap((analysis) => analysis.shapes));
  const previousShortQuotes = new Set(previous.flatMap((analysis) => analysis.shortQuotes));
  const previousTerms = new Set(previous.flatMap((analysis) => analysis.descriptiveTerms));
  const previousContentTerms = new Set(previous.flatMap((analysis) => analysis.contentTerms));

  const repeatedDescriptiveTerms = candidate.descriptiveTerms.filter((term) => previousTerms.has(term)).slice(0, 5);
  const repeatedContentTerms = candidate.contentTerms.filter((term) => previousContentTerms.has(term)).slice(0, 4);
  const repeatedShortDialogue = candidate.shortQuotes.filter((quote) => previousShortQuotes.has(quote));
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

  const flags: AssistantStyleFlag[] = [];
  const reasons: string[] = [];

  if (repeatedShape) {
    flags.push('same_candidate_structure');
    reasons.push('Candidate used the same block structure as recent assistant output.');
  }
  if (repeatedTriad) {
    flags.push('repeated_action_dialogue_thought_cadence');
    reasons.push('Candidate repeated action, dialogue, then internal thought cadence.');
  }
  if (repeatedActionFirstDialogue) {
    flags.push('repeated_action_first_dialogue_cadence');
    reasons.push('Candidate repeated action-first dialogue cadence.');
  }
  if (lockedLength) {
    flags.push('candidate_length_lock');
    reasons.push('Candidate stayed in the same length band as the prior assistant response.');
  }
  if (repeatedShortDialogue.length > 0) {
    flags.push('reused_short_dialogue_phrasing');
    reasons.push('Candidate reused short dialogue phrasing.');
  }
  if (repeatedDescriptiveTerms.length >= 3) {
    flags.push('repeated_descriptive_terms');
    reasons.push('Candidate reused descriptive focus.');
  }
  if (repeatedContentTerms.length >= 3) {
    flags.push('repeated_dialogue_or_topic_focus');
    reasons.push('Candidate reused dialogue or topic focus.');
  }
  if (frontLoaded) {
    if (candidate.narrationHeavyBlocks > 0) flags.push('narration_heavy_output');
    if (candidate.lowDialogueBlocks > 0) flags.push('low_external_dialogue');
    if (candidate.frontLoadedNarrationBlocks > 0) flags.push('front_loaded_narration');
    reasons.push('Candidate had front-loaded narration or weak dialogue balance.');
  }
  if (offloadedScene) {
    flags.push('offloaded_scene_to_user');
    reasons.push('Candidate asked the user to carry the scene instead of developing the AI-controlled side.');
  }

  const structureReasonsPresent = repeatedShape || repeatedTriad || repeatedActionFirstDialogue || lockedLength;
  const wordingReasonsPresent = repeatedShortDialogue.length > 0 || repeatedDescriptiveTerms.length >= 3 || repeatedContentTerms.length >= 3;
  const qualityReasonsPresent = frontLoaded || offloadedScene;
  const reasonGroupsPresent = [structureReasonsPresent, wordingReasonsPresent, qualityReasonsPresent].filter(Boolean).length;
  const hasDirectCopyRisk = repeatedShortDialogue.length > 0
    && (repeatedDescriptiveTerms.length >= 2 || repeatedContentTerms.length >= 2);
  const hasRegenerationQuoteReuse = repeatedShortDialogue.length > 0 && comparisonMessages.length > 0;
  const shouldReport = reasonGroupsPresent >= 2 || hasDirectCopyRisk || hasRegenerationQuoteReuse || offloadedScene;

  if (!shouldReport) {
    return buildTelemetry({
      source: 'candidate_output',
      flags: [],
      reasons: [],
      repeatedDescriptiveTerms: [],
      repeatedContentTerms: [],
      repeatedShortDialogue: [],
      metrics: {
        assistantMessageCount: recentAssistantMessages.length + comparisonMessages.length,
        totalBlocks: candidate.totalBlocks,
        wordCount: candidate.wordCount,
        recentLengths: recentLengths.slice(-3),
      },
    });
  }

  return buildTelemetry({
    source: 'candidate_output',
    flags,
    reasons,
    repeatedDescriptiveTerms,
    repeatedContentTerms,
    repeatedShortDialogue,
    metrics: {
      assistantMessageCount: recentAssistantMessages.length + comparisonMessages.length,
      totalBlocks: candidate.totalBlocks,
      wordCount: candidate.wordCount,
      recentLengths: recentLengths.slice(-3),
    },
  });
}
