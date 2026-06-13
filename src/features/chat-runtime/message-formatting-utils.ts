export type MessageToken = {
  type: 'plain' | 'speech' | 'action' | 'thought';
  content: string;
  trailing?: string;
};

export type PlainTextMode = 'default' | 'action';

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

export function parseMessageTokens(text: string, preserveWhitespace = false): MessageToken[] {
  let cleanRaw = text.replace(/\[SCENE:\s*.*?\]/g, '');
  cleanRaw = cleanRaw.replace(THOUGHT_WRAPPED_AS_ACTION_REGEX, '($1)');
  if (!preserveWhitespace) cleanRaw = cleanRaw.trim();
  const regex = /(\*[\s\S]*?\*)|([“"][\s\S]*?[”"][,.!?;:]?)|(\([\s\S]*?\))/g;

  const parts: MessageToken[] = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(cleanRaw)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'plain', content: cleanRaw.slice(lastIndex, match.index) });
    }

    const found = match[0];
    if (found.startsWith('*')) {
      parts.push({ type: 'action', content: found.slice(1, -1) });
    } else if (found.startsWith('"') || found.startsWith('“')) {
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
    } else if (found.startsWith('(')) {
      parts.push({ type: 'thought', content: found.slice(1, -1) });
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < cleanRaw.length) {
    parts.push({ type: 'plain', content: cleanRaw.slice(lastIndex) });
  }

  return parts;
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
