import type { Character, Conversation, Message, ScenarioData, SideCharacter, TimeOfDay } from '@/types';
import { parseMessageSegments, type MessageSegment } from '@/services/side-character-generator';
import type { StoredChatDebugTrace } from './types';
import { formatChatDebugTraceForSessionLog } from './session-log';

type ReviewExportCharacter = {
  name: string;
  control: string;
  role: string;
  avatarUrl: string;
  aliases: string[];
};

type ReviewExportSegment = {
  reviewId: string;
  messageId: string;
  turnNumber: number;
  segmentNumber: number;
  role: Message['role'];
  speakerName: string;
  speakerControl: string;
  speakerRole: string;
  avatarUrl: string;
  text: string;
  rawMessageText: string;
  day?: number;
  timeOfDay?: TimeOfDay;
  createdAt: number;
  isContinueTarget: boolean;
  isRegenerated: boolean;
  trace: StoredChatDebugTrace | null;
  imageUrl?: string;
  liveComment?: ChatReviewLiveComment;
};

export type ChatReviewLiveComment = {
  messageId: string;
  note: string;
  createdAt: number;
  updatedAt: number;
};

export type ChatReviewExportInput = {
  appData: ScenarioData;
  conversation: Conversation;
  scenarioTitle: string;
  modelId: string;
  exportedAt: Date;
  continueMessageIds: string[];
  regenerateMessageIds: string[];
  getTraceForMessage: (message: Message) => StoredChatDebugTrace | null;
  sanitizeAssistantText: (text: string) => string;
  messageComments?: Record<string, ChatReviewLiveComment>;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replace(/`/g, '&#96;');
}

export function slugifyReviewExportFilePart(value: string): string {
  return value.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'untitled';
}

function formatExportDate(date: Date): string {
  return date.toISOString().slice(0, 16).replace('T', ' ');
}

function formatTimeOfDay(value?: TimeOfDay): string {
  if (!value) return '?';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function initialsForName(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const initials = words.slice(0, 2).map((word) => word.charAt(0).toUpperCase()).join('');
  return initials || '?';
}

function characterAliases(character: Character | SideCharacter): string[] {
  return [
    character.name,
    ...(character.nicknames || '').split(',').map((name) => name.trim()).filter(Boolean),
  ];
}

function getCharacters(appData: ScenarioData): ReviewExportCharacter[] {
  const mainCharacters = appData.characters.map((character) => ({
    name: character.name,
    control: character.controlledBy,
    role: character.characterRole,
    avatarUrl: character.avatarDataUrl || '',
    aliases: characterAliases(character),
  }));

  const sideCharacters = (appData.sideCharacters || []).map((character) => ({
    name: character.name,
    control: character.controlledBy,
    role: character.characterRole,
    avatarUrl: character.avatarDataUrl || '',
    aliases: characterAliases(character),
  }));

  return [...mainCharacters, ...sideCharacters];
}

function findCharacter(characters: ReviewExportCharacter[], speakerName: string | null): ReviewExportCharacter | null {
  if (!speakerName) return null;
  const normalized = speakerName.trim().toLowerCase();
  return characters.find((character) => (
    character.aliases.some((alias) => alias.toLowerCase() === normalized)
  )) || null;
}

function inferNarrativeSpeaker(segment: MessageSegment, characters: ReviewExportCharacter[]): ReviewExportCharacter | null {
  const text = segment.content.trim();
  if (!text) return null;

  const sortedAliases = characters
    .flatMap((character) => character.aliases.map((alias) => ({ alias, character })))
    .filter((entry) => entry.alias.trim())
    .sort((left, right) => right.alias.length - left.alias.length);

  for (const entry of sortedAliases) {
    const escapedAlias = entry.alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`^${escapedAlias}(?:['’]s\\b|\\b(?=[\\s,]))`, 'i');
    if (pattern.test(text)) return entry.character;
  }

  return null;
}

function defaultCharacterForRole(characters: ReviewExportCharacter[], role: Message['role']): ReviewExportCharacter | null {
  if (role === 'user') {
    return characters.find((character) => character.control === 'User') || null;
  }
  if (role === 'assistant') {
    return characters.find((character) => character.control === 'AI') || null;
  }
  return null;
}

function resolveSpeaker(segment: MessageSegment, role: Message['role'], characters: ReviewExportCharacter[]): ReviewExportCharacter | null {
  return findCharacter(characters, segment.speakerName)
    || (role === 'assistant' ? inferNarrativeSpeaker(segment, characters) : null)
    || defaultCharacterForRole(characters, role);
}

function textPreview(value: string, max = 180): string {
  const compact = value.replace(/\s+/g, ' ').trim();
  if (compact.length <= max) return compact;
  return `${compact.slice(0, max - 3)}...`;
}

function renderStyledText(text: string): string {
  const cleanText = text.replace(/\[SCENE:\s*.*?\]/g, '').trim();
  const tokenRegex = /(\*[\s\S]*?\*)|([“"][\s\S]*?[”"][,.!?;:]?)|(\([\s\S]*?\))/g;
  const parts: string[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(cleanText)) !== null) {
    if (match.index > lastIndex) {
      parts.push(`<span class="plain-text">${escapeHtml(cleanText.slice(lastIndex, match.index))}</span>`);
    }

    const token = match[0];
    if (token.startsWith('*')) {
      parts.push(`<span class="action-text">${escapeHtml(token)}</span>`);
    } else if (token.startsWith('(')) {
      parts.push(`<span class="thought-text">${escapeHtml(token)}</span>`);
    } else {
      parts.push(`<span class="speech-text">${escapeHtml(token)}</span>`);
    }

    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < cleanText.length) {
    parts.push(`<span class="plain-text">${escapeHtml(cleanText.slice(lastIndex))}</span>`);
  }

  return parts.join('');
}

function avatarHtml(segment: ReviewExportSegment): string {
  if (segment.avatarUrl) {
    return `<img src="${escapeAttribute(segment.avatarUrl)}" alt="${escapeAttribute(segment.speakerName)} avatar" loading="lazy" />`;
  }
  return `<span>${escapeHtml(initialsForName(segment.speakerName))}</span>`;
}

function buildSegments(input: ChatReviewExportInput): ReviewExportSegment[] {
  const characters = getCharacters(input.appData);
  const continueSet = new Set(input.continueMessageIds);
  const regenerateSet = new Set(input.regenerateMessageIds);
  const segments: ReviewExportSegment[] = [];
  let visibleTurn = 0;

  for (const message of input.conversation.messages) {
    if (message.role === 'system') continue;
    visibleTurn += 1;

    const rawMessageText = message.role === 'assistant'
      ? input.sanitizeAssistantText(message.text)
      : message.text;
    const parsedSegments = parseMessageSegments(rawMessageText);
    const messageSegments = parsedSegments.length > 0
      ? parsedSegments
      : [{ speakerName: null, content: rawMessageText }];
    const trace = message.role === 'assistant' ? input.getTraceForMessage(message) : null;

    messageSegments.forEach((segment, segmentIndex) => {
      const speaker = resolveSpeaker(segment, message.role, characters);
      const fallbackSpeaker = message.role === 'assistant' ? 'AI' : 'User';
      segments.push({
        reviewId: `${message.id}-${segmentIndex}`,
        messageId: message.id,
        turnNumber: visibleTurn,
        segmentNumber: segmentIndex + 1,
        role: message.role,
        speakerName: speaker?.name || segment.speakerName || fallbackSpeaker,
        speakerControl: speaker?.control || (message.role === 'assistant' ? 'AI' : 'User'),
        speakerRole: speaker?.role || '',
        avatarUrl: speaker?.avatarUrl || '',
        text: segment.content,
        rawMessageText,
        day: message.day,
        timeOfDay: message.timeOfDay,
        createdAt: message.createdAt,
        isContinueTarget: continueSet.has(message.id),
        isRegenerated: regenerateSet.has(message.id),
        trace,
        imageUrl: message.imageUrl,
        liveComment: input.messageComments?.[message.id],
      });
    });
  }

  return segments;
}

function renderDebugTrace(trace: StoredChatDebugTrace | null): string {
  if (!trace) return '<p class="debug-empty">No debug trace captured for this turn.</p>';
  const markdownLines = formatChatDebugTraceForSessionLog(trace).join('\n');
  return `<pre>${escapeHtml(markdownLines)}</pre>`;
}

function renderSegmentCard(segment: ReviewExportSegment, index: number): string {
  const issueTypes = [
    ['unnatural', 'Unnatural wording'],
    ['ignored-input', 'Ignored user input'],
    ['spoke-for-user', 'Spoke for user'],
    ['wrong-speaker', 'Wrong speaker'],
    ['unneeded-speaker', 'Unneeded character'],
    ['ping-pong', 'Ping-pong / too many blocks'],
    ['formatting', 'Formatting / punctuation'],
    ['continuity', 'Continuity / scene logic'],
    ['stalling', 'Stalling / no progression'],
    ['other', 'Other'],
  ];

  const typeControls = issueTypes.map(([value, label]) => `
    <label class="issue-chip">
      <input type="checkbox" value="${value}" data-review-field="issueType" />
      <span>${escapeHtml(label)}</span>
    </label>
  `).join('');

  const classes = [
    'message-card',
    segment.role === 'user' ? 'user-card' : 'assistant-card',
    segment.isRegenerated ? 'is-regenerated' : '',
    segment.isContinueTarget ? 'is-continue' : '',
  ].filter(Boolean).join(' ');

  const debugBlock = segment.role === 'assistant'
    ? `<details class="debug-details"><summary>Debug trace for this AI turn</summary>${renderDebugTrace(segment.trace)}</details>`
    : '';

  const rawBlock = `<details class="raw-details"><summary>Raw saved message text</summary><pre>${escapeHtml(segment.rawMessageText)}</pre></details>`;
  const liveCommentBlock = segment.liveComment?.note
    ? `<section class="live-comment"><div>Live tester note</div><p>${escapeHtml(segment.liveComment.note)}</p></section>`
    : '';
  const imageBlock = segment.imageUrl
    ? `<img class="scene-image" src="${escapeAttribute(segment.imageUrl)}" alt="Generated scene image" loading="lazy" />`
    : '';

  return `
    <article class="${classes}" data-review-index="${index}" data-review-id="${escapeAttribute(segment.reviewId)}" data-message-id="${escapeAttribute(segment.messageId)}" data-turn="${segment.turnNumber}" data-role="${escapeAttribute(segment.role)}" data-speaker="${escapeAttribute(segment.speakerName)}" data-excerpt="${escapeAttribute(textPreview(segment.text, 260))}">
      <div class="message-main">
        <div class="avatar">${avatarHtml(segment)}</div>
        <div class="message-content">
          <header class="message-header">
            <div>
              <span class="turn-label">Turn ${segment.turnNumber}${segment.segmentNumber > 1 ? `.${segment.segmentNumber}` : ''}</span>
              <h2>${escapeHtml(segment.speakerName)}</h2>
              <p>${escapeHtml(segment.speakerControl)}${segment.speakerRole ? ` / ${escapeHtml(segment.speakerRole)}` : ''}</p>
            </div>
            <div class="message-meta">
              <span>${segment.day != null ? `Day ${segment.day}` : 'Day ?'}</span>
              <span>${escapeHtml(formatTimeOfDay(segment.timeOfDay))}</span>
              ${segment.isRegenerated ? '<span class="event-pill">Regenerated</span>' : ''}
              ${segment.isContinueTarget ? '<span class="event-pill">Continue</span>' : ''}
            </div>
          </header>
          <div class="rendered-message">${renderStyledText(segment.text)}</div>
          ${liveCommentBlock}
          ${imageBlock}
          ${rawBlock}
          ${debugBlock}
        </div>
      </div>
      <section class="review-panel">
        <div class="review-title">Issue notes for this message</div>
        <div class="issue-grid">${typeControls}</div>
        <div class="review-fields">
          <label>
            Severity
            <select data-review-field="severity">
              <option value="">Not set</option>
              <option value="minor">Minor annoyance</option>
              <option value="moderate">Noticeable problem</option>
              <option value="major">Breaks the scene</option>
              <option value="critical">Critical failure</option>
            </select>
          </label>
          <label>
            What went wrong?
            <textarea data-review-field="note" placeholder="Example: Sarah answered a question James asked Ashley, or the response sounded mechanical here.">${segment.liveComment?.note ? escapeHtml(segment.liveComment.note) : ''}</textarea>
          </label>
          <label>
            What should have happened instead?
            <textarea data-review-field="expected" placeholder="Optional: describe the behavior you expected in plain English."></textarea>
          </label>
        </div>
      </section>
    </article>
  `;
}

function renderCharacterSummary(characters: ReviewExportCharacter[]): string {
  return characters.map((character) => `
    <div class="character-pill">
      <div class="mini-avatar">${character.avatarUrl ? `<img src="${escapeAttribute(character.avatarUrl)}" alt="" loading="lazy" />` : `<span>${escapeHtml(initialsForName(character.name))}</span>`}</div>
      <div>
        <strong>${escapeHtml(character.name)}</strong>
        <span>${escapeHtml(character.control)}${character.role ? ` / ${escapeHtml(character.role)}` : ''}</span>
      </div>
    </div>
  `).join('');
}

function buildReviewScript(downloadBaseName: string): string {
  const baseName = JSON.stringify(downloadBaseName);
  return `
    <script>
      (function () {
        const downloadBaseName = ${baseName};

        function collectAnnotations() {
          return Array.from(document.querySelectorAll('[data-review-index]')).map((card) => {
            const note = card.querySelector('[data-review-field="note"]')?.value.trim() || '';
            const expected = card.querySelector('[data-review-field="expected"]')?.value.trim() || '';
            const severity = card.querySelector('[data-review-field="severity"]')?.value || '';
            const issueTypes = Array.from(card.querySelectorAll('[data-review-field="issueType"]'))
              .filter((input) => input.checked)
              .map((input) => input.value);
            if (!note && !expected && !severity && issueTypes.length === 0) return null;
            return {
              reviewId: card.dataset.reviewId,
              messageId: card.dataset.messageId,
              turn: Number(card.dataset.turn),
              role: card.dataset.role,
              speaker: card.dataset.speaker,
              excerpt: card.dataset.excerpt,
              issueTypes,
              severity,
              note,
              expected,
            };
          }).filter(Boolean);
        }

        function downloadFile(filename, mimeType, content) {
          const blob = new Blob([content], { type: mimeType });
          const url = URL.createObjectURL(blob);
          const anchor = document.createElement('a');
          anchor.href = url;
          anchor.download = filename;
          document.body.appendChild(anchor);
          anchor.click();
          anchor.remove();
          URL.revokeObjectURL(url);
        }

        function updateCount() {
          const count = collectAnnotations().length;
          const counter = document.getElementById('annotation-count');
          if (counter) counter.textContent = String(count);
        }

        function syncAnnotatedHtmlClone(clone) {
          const originalCards = Array.from(document.querySelectorAll('[data-review-index]'));
          const cloneCards = Array.from(clone.querySelectorAll('[data-review-index]'));
          originalCards.forEach((originalCard, index) => {
            const cloneCard = cloneCards[index];
            if (!cloneCard) return;

            const originalTextareas = Array.from(originalCard.querySelectorAll('textarea'));
            const cloneTextareas = Array.from(cloneCard.querySelectorAll('textarea'));
            originalTextareas.forEach((textarea, textareaIndex) => {
              const cloneTextarea = cloneTextareas[textareaIndex];
              if (!cloneTextarea) return;
              cloneTextarea.textContent = textarea.value;
            });

            const originalSelects = Array.from(originalCard.querySelectorAll('select'));
            const cloneSelects = Array.from(cloneCard.querySelectorAll('select'));
            originalSelects.forEach((select, selectIndex) => {
              const cloneSelect = cloneSelects[selectIndex];
              if (!cloneSelect) return;
              Array.from(cloneSelect.options).forEach((option) => {
                if (option.value === select.value) option.setAttribute('selected', 'selected');
                else option.removeAttribute('selected');
              });
            });

            const originalChecks = Array.from(originalCard.querySelectorAll('input[type="checkbox"]'));
            const cloneChecks = Array.from(cloneCard.querySelectorAll('input[type="checkbox"]'));
            originalChecks.forEach((checkbox, checkboxIndex) => {
              const cloneCheckbox = cloneChecks[checkboxIndex];
              if (!cloneCheckbox) return;
              if (checkbox.checked) cloneCheckbox.setAttribute('checked', 'checked');
              else cloneCheckbox.removeAttribute('checked');
            });
          });
        }

        document.addEventListener('input', updateCount);
        document.addEventListener('change', updateCount);

        document.getElementById('download-annotation-json')?.addEventListener('click', () => {
          const payload = {
            exportedAt: new Date().toISOString(),
            sourceFile: downloadBaseName + '.html',
            annotations: collectAnnotations(),
          };
          downloadFile(downloadBaseName + '-annotations.json', 'application/json;charset=utf-8', JSON.stringify(payload, null, 2));
        });

        document.getElementById('download-annotated-html')?.addEventListener('click', () => {
          const clone = document.documentElement.cloneNode(true);
          syncAnnotatedHtmlClone(clone);
          downloadFile(downloadBaseName + '-annotated.html', 'text/html;charset=utf-8', '<!doctype html>\\n' + clone.outerHTML);
        });

        updateCount();
      })();
    </script>
  `;
}

function reviewStyles(): string {
  return `
    :root {
      color-scheme: dark;
      --bg: #101114;
      --panel: #181a20;
      --panel-2: #222530;
      --line: rgba(255,255,255,0.12);
      --text: #eef2f7;
      --muted: #a8afbd;
      --accent: #78dcca;
      --blue: #6f8fbf;
      --warn: #e2b36a;
      --danger: #ff7b7b;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: radial-gradient(circle at top left, rgba(111,143,191,0.24), transparent 32rem), var(--bg);
      color: var(--text);
      font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.55;
    }
    .shell { max-width: 1180px; margin: 0 auto; padding: 32px 22px 72px; }
    .hero {
      border: 1px solid var(--line);
      border-radius: 28px;
      background: linear-gradient(145deg, rgba(34,37,48,0.92), rgba(15,16,20,0.92));
      box-shadow: 0 30px 80px rgba(0,0,0,0.42);
      padding: 28px;
      margin-bottom: 20px;
    }
    .eyebrow { color: var(--accent); text-transform: uppercase; letter-spacing: 0.15em; font-size: 12px; font-weight: 900; }
    h1 { margin: 8px 0 10px; font-size: clamp(30px, 4vw, 54px); line-height: 0.95; letter-spacing: -0.05em; }
    .hero p { color: var(--muted); max-width: 860px; margin: 0 0 14px; }
    .meta-grid, .character-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 10px; margin-top: 18px; }
    .meta-card, .character-pill {
      border: 1px solid var(--line);
      border-radius: 16px;
      background: rgba(255,255,255,0.045);
      padding: 12px;
    }
    .meta-card span, .character-pill span { display: block; color: var(--muted); font-size: 12px; }
    .character-pill { display: flex; gap: 10px; align-items: center; }
    .mini-avatar, .avatar {
      flex: 0 0 auto;
      border-radius: 14px;
      overflow: hidden;
      background: linear-gradient(145deg, #44546d, #20242d);
      display: grid;
      place-items: center;
      color: white;
      font-weight: 900;
      border: 1px solid rgba(255,255,255,0.18);
    }
    .mini-avatar { width: 38px; height: 38px; }
    .avatar { width: 58px; height: 58px; }
    .mini-avatar img, .avatar img { width: 100%; height: 100%; object-fit: cover; }
    .toolbar {
      position: sticky;
      top: 0;
      z-index: 10;
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
      justify-content: space-between;
      border: 1px solid var(--line);
      border-radius: 18px;
      background: rgba(16,17,20,0.92);
      backdrop-filter: blur(18px);
      padding: 12px;
      margin-bottom: 22px;
    }
    .toolbar strong { color: var(--accent); }
    button {
      border: 1px solid rgba(255,255,255,0.18);
      border-radius: 12px;
      background: linear-gradient(180deg, #4c5f80, #344055);
      color: white;
      font-weight: 800;
      padding: 10px 14px;
      cursor: pointer;
    }
    .message-card {
      border: 1px solid var(--line);
      border-radius: 24px;
      background: rgba(24,26,32,0.86);
      box-shadow: 0 18px 50px rgba(0,0,0,0.26);
      margin: 18px 0;
      overflow: hidden;
    }
    .user-card { border-color: rgba(120,220,202,0.28); }
    .assistant-card { border-color: rgba(111,143,191,0.28); }
    .message-main { display: grid; grid-template-columns: 74px 1fr; gap: 14px; padding: 18px; }
    .message-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; margin-bottom: 10px; }
    .turn-label { color: var(--accent); text-transform: uppercase; letter-spacing: 0.12em; font-size: 11px; font-weight: 900; }
    h2 { margin: 2px 0 0; font-size: 22px; letter-spacing: -0.03em; }
    .message-header p { margin: 0; color: var(--muted); font-size: 12px; }
    .message-meta { display: flex; flex-wrap: wrap; gap: 7px; justify-content: flex-end; }
    .message-meta span, .event-pill {
      border: 1px solid rgba(255,255,255,0.13);
      border-radius: 999px;
      background: rgba(255,255,255,0.06);
      color: var(--muted);
      font-size: 11px;
      font-weight: 800;
      padding: 4px 8px;
    }
    .event-pill { color: var(--warn) !important; }
    .rendered-message {
      white-space: pre-wrap;
      font-size: 18px;
      line-height: 1.75;
      color: #d7dde8;
      overflow-wrap: anywhere;
    }
    .action-text { color: #a8afbd; font-style: italic; }
    .speech-text { color: #fff; font-weight: 650; }
    .thought-text { color: #c9d4ff; font-style: italic; text-shadow: 0 0 18px rgba(129,140,248,0.28); }
    .scene-image { max-width: min(100%, 520px); border-radius: 18px; border: 1px solid var(--line); margin-top: 14px; display: block; }
    .live-comment {
      border: 1px solid rgba(120,220,202,0.28);
      border-radius: 16px;
      background: rgba(120,220,202,0.08);
      margin-top: 14px;
      padding: 12px;
    }
    .live-comment div {
      color: var(--accent);
      font-size: 11px;
      font-weight: 900;
      letter-spacing: 0.13em;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    .live-comment p { margin: 0; color: #d7f7ef; white-space: pre-wrap; }
    details { margin-top: 12px; border: 1px solid rgba(255,255,255,0.10); border-radius: 14px; background: rgba(0,0,0,0.18); }
    summary { cursor: pointer; color: var(--muted); font-weight: 800; padding: 10px 12px; }
    pre { white-space: pre-wrap; margin: 0; padding: 12px; color: #cbd5e1; overflow-wrap: anywhere; }
    .debug-empty { color: var(--muted); margin: 0; padding: 12px; }
    .review-panel { border-top: 1px solid var(--line); background: rgba(255,255,255,0.035); padding: 16px 18px 18px; }
    .review-title { color: var(--accent); text-transform: uppercase; letter-spacing: 0.13em; font-size: 12px; font-weight: 900; margin-bottom: 10px; }
    .issue-grid { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
    .issue-chip { display: inline-flex; gap: 7px; align-items: center; border: 1px solid rgba(255,255,255,0.13); border-radius: 999px; padding: 7px 10px; color: #dbe3ef; font-size: 12px; background: rgba(0,0,0,0.16); }
    .review-fields { display: grid; gap: 12px; }
    label { color: var(--muted); font-size: 12px; font-weight: 800; }
    textarea, select {
      width: 100%;
      margin-top: 6px;
      border: 1px solid rgba(255,255,255,0.14);
      border-radius: 14px;
      background: rgba(8,9,12,0.72);
      color: var(--text);
      padding: 11px 12px;
      font: inherit;
    }
    textarea { min-height: 88px; resize: vertical; }
    .footer-note { color: var(--muted); text-align: center; margin-top: 26px; }
    @media (max-width: 720px) {
      .message-main { grid-template-columns: 1fr; }
      .message-header { display: block; }
      .message-meta { justify-content: flex-start; margin-top: 10px; }
    }
  `;
}

export function buildChatReviewHtml(input: ChatReviewExportInput): string {
  const characters = getCharacters(input.appData);
  const segments = buildSegments(input);
  const assistantMessages = input.conversation.messages.filter((message) => message.role === 'assistant');
  const capturedTraceCount = assistantMessages.filter((message) => input.getTraceForMessage(message)).length;
  const exportedAt = formatExportDate(input.exportedAt);
  const downloadBaseName = `chat-review-${slugifyReviewExportFilePart(input.scenarioTitle)}-${input.exportedAt.getTime()}`;
  const cards = segments.map((segment, index) => renderSegmentCard(segment, index)).join('\n');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Chronicle Chat Review - ${escapeHtml(input.scenarioTitle)}</title>
  <style>${reviewStyles()}</style>
</head>
<body>
  <main class="shell">
    <section class="hero">
      <div class="eyebrow">Chronicle chat review export</div>
      <h1>${escapeHtml(input.scenarioTitle)}</h1>
      <p>This file is meant for real roleplay review. Read the transcript, mark only the turns that actually fail, then download annotations as JSON or an annotated HTML copy.</p>
      <div class="meta-grid">
        <div class="meta-card"><strong>${escapeHtml(input.conversation.title || 'Untitled conversation')}</strong><span>Conversation</span></div>
        <div class="meta-card"><strong>${escapeHtml(input.modelId)}</strong><span>Model</span></div>
        <div class="meta-card"><strong>${segments.length}</strong><span>Rendered message blocks</span></div>
        <div class="meta-card"><strong>${capturedTraceCount} / ${assistantMessages.length}</strong><span>AI debug traces captured</span></div>
        <div class="meta-card"><strong>${escapeHtml(exportedAt)}</strong><span>Exported</span></div>
      </div>
      <div class="character-grid">${renderCharacterSummary(characters)}</div>
    </section>

    <nav class="toolbar">
      <div><strong id="annotation-count">0</strong> message blocks currently marked with notes.</div>
      <div>
        <button id="download-annotation-json" type="button">Download annotation JSON</button>
        <button id="download-annotated-html" type="button">Download annotated HTML</button>
      </div>
    </nav>

    ${cards}

    <p class="footer-note">If a turn has no issue, leave its review fields empty. The JSON export only includes marked turns.</p>
  </main>
  ${buildReviewScript(downloadBaseName)}
</body>
</html>`;
}
