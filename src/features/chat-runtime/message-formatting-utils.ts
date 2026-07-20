export type MessageToken = {
  type: 'plain' | 'speech' | 'action' | 'thought';
  content: string;
  trailing?: string;
};

export type PlainTextMode = 'default' | 'action';

export type MessageFormattingWarning = Readonly<{
  code: 'unmatched_opening_parenthesis' | 'unmatched_closing_parenthesis';
  index: number;
  delimiter: '(' | ')';
}>;

export type BalancedParentheticalSpan = Readonly<{
  start: number;
  end: number;
  rawText: string;
  content: string;
}>;

export type MessageTokenizationResult = Readonly<{
  tokens: MessageToken[];
  parentheticalSpans: BalancedParentheticalSpan[];
  warnings: MessageFormattingWarning[];
}>;

const CHAT_RENDER_ARTIFACT_LINE_REGEX = /^\s*(?:(?:[-—*_]){3,}|```(?:\w+)?|<\/?writer_draft>)\s*$/gim;
const DOUBLE_COLON_SPEAKER_REGEX = /^(\s*(?:\*\*)?[A-Z][a-zA-Z\s'-]{0,29}(?:\*\*)?)\s*:{2,}\s*/gm;
const THOUGHT_WRAPPED_AS_ACTION_REGEX = /\*\(\s*([\s\S]*?)\s*\)\*/g;
const PLANNER_LANGUAGE_LEAK_REGEX = /\b(?:survival\s+(?:priority|step)\s*[:—-]?|priority(?:\s+is|'s)\s*[:—-]?|priority\s*:)\s*/gi;
const PLANNER_LABEL_LEAK_REGEX = /\b(?:goal|directive|plan|must include)\s*:\s*/gi;

export function normalizeEmDashUsage(text: string): string {
  return text.replace(/\s*—\s*/g, '... ');
}

export function sanitizeAssistantMessageText(text: string): string {
  return text
    .replace(CHAT_RENDER_ARTIFACT_LINE_REGEX, '')
    .replace(DOUBLE_COLON_SPEAKER_REGEX, '$1: ')
    .replace(THOUGHT_WRAPPED_AS_ACTION_REGEX, '($1)')
    .replace(PLANNER_LANGUAGE_LEAK_REGEX, '')
    .replace(PLANNER_LABEL_LEAK_REGEX, '')
    .split('\n').map(normalizeEmDashUsage).join('\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function scanBalancedParentheticalSpans(text: string): Readonly<{
  spans: BalancedParentheticalSpan[];
  warnings: MessageFormattingWarning[];
}> {
  const openIndexes: number[] = [];
  const spans: BalancedParentheticalSpan[] = [];
  const warnings: MessageFormattingWarning[] = [];

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '(') {
      openIndexes.push(index);
      continue;
    }
    if (character !== ')') continue;

    if (openIndexes.length === 0) {
      warnings.push({
        code: 'unmatched_closing_parenthesis',
        index,
        delimiter: ')',
      });
      continue;
    }

    const start = openIndexes.pop() as number;
    if (openIndexes.length === 0) {
      spans.push({
        start,
        end: index + 1,
        rawText: text.slice(start, index + 1),
        content: text.slice(start + 1, index),
      });
    }
  }

  openIndexes.forEach((index) => warnings.push({
    code: 'unmatched_opening_parenthesis',
    index,
    delimiter: '(',
  }));

  return {
    spans,
    warnings: warnings.sort((left, right) => left.index - right.index),
  };
}

function parseVisibleMessageTokens(text: string): MessageToken[] {
  const regex = /(\*[\s\S]*?\*)|([“"][\s\S]*?[”"][,.!?;:]?)/g;
  const parts: MessageToken[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'plain', content: text.slice(lastIndex, match.index) });
    }

    const found = match[0];
    if (found.startsWith('*')) {
      parts.push({ type: 'action', content: found.slice(1, -1) });
    } else {
      const speechMatch = found.match(/^([“"])([\s\S]*?)([”"])([,.!?;:]?)$/);
      if (speechMatch) {
        parts.push({
          type: 'speech',
          content: speechMatch[2],
          trailing: speechMatch[4] || '',
        });
      } else {
        parts.push({ type: 'speech', content: found.replace(/^["“]|["”]$/g, '') });
      }
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'plain', content: text.slice(lastIndex) });
  }
  return parts;
}

export function parseMessageTokensWithWarnings(
  text: string,
  preserveWhitespace = false,
): MessageTokenizationResult {
  let cleanRaw = text.replace(/\[SCENE:\s*.*?\]/g, '');
  cleanRaw = cleanRaw.replace(THOUGHT_WRAPPED_AS_ACTION_REGEX, '($1)');
  if (!preserveWhitespace) cleanRaw = cleanRaw.trim();
  const { spans, warnings } = scanBalancedParentheticalSpans(cleanRaw);
  const parts: MessageToken[] = [];
  let lastIndex = 0;

  for (const span of spans) {
    if (span.start > lastIndex) {
      parts.push(...parseVisibleMessageTokens(cleanRaw.slice(lastIndex, span.start)));
    }
    parts.push({ type: 'thought', content: span.content });
    lastIndex = span.end;
  }

  if (lastIndex < cleanRaw.length) {
    parts.push(...parseVisibleMessageTokens(cleanRaw.slice(lastIndex)));
  }

  return { tokens: parts, parentheticalSpans: spans, warnings };
}

export function parseMessageTokens(text: string, preserveWhitespace = false): MessageToken[] {
  return parseMessageTokensWithWarnings(text, preserveWhitespace).tokens;
}

export function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function tokensToStyledHtml(
  tokens: MessageToken[],
  dynamicText: boolean,
  plainTextMode: PlainTextMode = 'default',
): string {
  return tokens.map(token => {
    if (!dynamicText) {
      if (token.type === 'speech') {
        return `<span style="color:white;font-weight:500">"${escapeHtml(token.content)}"${escapeHtml(token.trailing || '')}</span>`;
      }
      if (token.type === 'plain' && plainTextMode === 'action') {
        return `<span style="color:rgb(148,163,184);font-style:italic">${escapeHtml(token.content)}</span>`;
      }
      return `<span style="color:white;font-weight:500">${escapeHtml(token.content)}</span>`;
    }
    if (token.type === 'speech') {
      return `<span style="color:white;font-weight:500">"${escapeHtml(token.content)}"${escapeHtml(token.trailing || '')}</span>`;
    }
    if (token.type === 'action') {
      return `<span style="color:rgb(148,163,184);font-style:italic">*${escapeHtml(token.content)}*</span>`;
    }
    if (token.type === 'thought') {
      return `<span style="color:rgba(199,210,254,0.9);font-style:italic;letter-spacing:-0.025em;text-shadow:0 0 8px rgba(129,140,248,0.6),0 0 16px rgba(129,140,248,0.4),0 0 24px rgba(129,140,248,0.2)">(${escapeHtml(token.content)})</span>`;
    }
    if (plainTextMode === 'action') {
      return `<span style="color:rgb(148,163,184);font-style:italic">${escapeHtml(token.content)}</span>`;
    }
    return `<span style="color:rgb(203,213,225)">${escapeHtml(token.content)}</span>`;
  }).join('');
}
