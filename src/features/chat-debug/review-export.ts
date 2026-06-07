import type { Character, Conversation, Message, ScenarioData, SideCharacter, TimeOfDay } from '@/types';
import { parseMessageSegments, type MessageSegment } from '@/services/side-character-generator';
import { buildReviewDebugMetrics, type ReviewDebugMetrics, type ReviewSegmentDebugMetrics } from './review-metrics';
import {
  CHAT_DEBUG_ISSUE_TAGS,
  type ChatDebugIssueTag,
  type DialogDebugComment,
  type StoredChatDebugTrace,
  type StoredChatDebugTraceMap,
} from './types';

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
  generationId: string;
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
  imageUrl?: string;
  liveComment?: ChatReviewLiveComment;
  postTurnStateChanges?: string[];
  debugRecord?: StoredChatDebugTrace | null;
  debugMetrics?: ReviewSegmentDebugMetrics;
  localNotice?: Message['localNotice'] | null;
};

export type ChatReviewLiveComment = {
  messageId: DialogDebugComment['messageId'];
  generationId?: DialogDebugComment['generationId'];
  note: DialogDebugComment['note'];
  tags: DialogDebugComment['tags'];
  createdAt: DialogDebugComment['createdAt'];
  updatedAt: DialogDebugComment['updatedAt'];
};

export type ChatReviewActionEvent = {
  messageId: string;
  generationId?: string;
  timestamp: number;
};

export type ChatReviewExportInput = {
  appData: ScenarioData;
  conversation: Conversation;
  scenarioTitle: string;
  modelId: string;
  exportedAt: Date;
  continueMessageIds?: string[];
  regenerateMessageIds?: string[];
  continueMessageEvents?: ChatReviewActionEvent[];
  regenerateMessageEvents?: ChatReviewActionEvent[];
  sanitizeAssistantText: (text: string) => string;
  messageComments?: Record<string, ChatReviewLiveComment>;
  postTurnStateChanges?: Record<string, string[]>;
  debugRecords?: StoredChatDebugTraceMap;
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

function formatDebugDate(value: number | undefined): string {
  if (!value || !Number.isFinite(value)) return 'unknown time';
  return new Date(value).toISOString().replace('T', ' ').slice(0, 19);
}

function prettyJson(value: unknown): string {
  if (value == null) return '(none)';
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function safeJsonScript(value: unknown): string {
  return JSON.stringify(value, null, 2)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

function debugTraceKey(messageId: string, generationId?: string | null): string {
  return `${messageId}:${generationId || messageId}`;
}

function renderDebugJsonBlock(label: string, value: unknown): string {
  return `
    <div class="debug-json-block">
      <div class="debug-json-label">${escapeHtml(label)}</div>
      <pre>${escapeHtml(prettyJson(value))}</pre>
    </div>
  `;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function renderKeyValueRows(rows: Array<[string, unknown]>): string {
  return rows
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '')
    .map(([label, value]) => `<span><strong>${escapeHtml(label)}</strong>${escapeHtml(String(value))}</span>`)
    .join('');
}

function renderSupportCallSummary(call: NonNullable<StoredChatDebugTrace['supportCalls']>[number]): string {
  const response = asRecord(call.responseBody);
  const endpoint = call.endpoint;
  const notes = call.notes?.length
    ? `<ul class="support-summary-notes">${call.notes.map((note) => `<li>${escapeHtml(note)}</li>`).join('')}</ul>`
    : '';

  if (endpoint.includes('assistant-style-telemetry')) {
    const recentTelemetry = asRecord(response?.recentTelemetry);
    const candidateTelemetry = asRecord(response?.candidateTelemetry);
    const recentFlags = asArray(recentTelemetry?.flags);
    const candidateFlags = asArray(candidateTelemetry?.flags);
    return `
      <div class="support-summary">
        <div class="support-summary-title">Assistant style telemetry summary</div>
        <div class="support-summary-grid">
          ${renderKeyValueRows([
            ['Diagnostic only', 'yes'],
            ['Sent to Grok/xAI', 'no'],
            ['Recent-window flags', recentFlags.length],
            ['Candidate-output flags', candidateFlags.length],
          ])}
        </div>
        ${recentFlags.length || candidateFlags.length ? `<ul>
          ${recentFlags.length ? `<li><strong>Recent assistant window</strong> ${recentFlags.map((flag) => escapeHtml(String(flag))).join(', ')}</li>` : ''}
          ${candidateFlags.length ? `<li><strong>Candidate output</strong> ${candidateFlags.map((flag) => escapeHtml(String(flag))).join(', ')}</li>` : ''}
        </ul>` : '<p>No style or repetition detector flags were raised.</p>'}
        ${response?.summary ? `<p>${escapeHtml(String(response.summary))}</p>` : ''}
        ${notes}
      </div>
    `;
  }

  if (endpoint.includes('evaluate-goal-progress')) {
    const updates = asArray(response?.stepUpdates);
    const reviewRows = asArray(response?.stepCompletionReviews).length
      ? asArray(response?.stepCompletionReviews)
      : asArray(response?.classificationReviews).length
        ? asArray(response?.classificationReviews)
        : updates;
    const modelCompletedCount = reviewRows.filter((entry) => {
      const item = asRecord(entry) || {};
      return item.modelCompleted === true || (!('modelCompleted' in item) && item.completed === true);
    }).length;
    const accepted = reviewRows.filter((entry) => asRecord(entry)?.accepted === true);
    const rejected = reviewRows.filter((entry) => {
      const item = asRecord(entry) || {};
      return item.accepted !== true && (item.modelCompleted === true || item.result === 'completed' || item.knownStep === false);
    });
    return `
      <div class="support-summary">
        <div class="support-summary-title">Goal progress summary</div>
        <div class="support-summary-grid">
          ${renderKeyValueRows([
            ['Returned steps', updates.length],
            ['Model marked complete', modelCompletedCount],
            ['Accepted completions', accepted.length],
            ['Rejected completion candidates', rejected.length],
          ])}
        </div>
        ${reviewRows.length ? `<ul>${reviewRows.map((entry) => {
          const item = asRecord(entry) || {};
          const stepId = String(item.stepId || 'unknown step');
          const statusLabel = item.accepted === true
            ? 'accepted'
            : item.reason
              ? `rejected: ${String(item.reason)}`
              : 'not accepted';
          const confidence = item.confidence == null ? '' : ` / confidence ${escapeHtml(String(item.confidence))}`;
          const result = item.result ? ` / ${escapeHtml(String(item.result))}` : '';
          const evidence = item.evidence ? ` Evidence: ${escapeHtml(String(item.evidence))}` : '';
          const modelCompleted = item.modelCompleted === true ? ' / model marked complete' : '';
          return `<li><strong>${escapeHtml(stepId)}</strong> [${escapeHtml(statusLabel)}] ${item.accepted === true ? 'accepted by gate' : 'not accepted by gate'}${modelCompleted}${result}${confidence}${item.summary ? ` — ${escapeHtml(String(item.summary))}` : ''}${evidence}</li>`;
        }).join('')}</ul>` : '<p>No step updates returned.</p>'}
        ${notes}
      </div>
    `;
  }

  if (endpoint.includes('extract-character-updates')) {
    const updates = asArray(response?.updates);
    const reviewRows = asArray(response?.characterUpdateReviews).length
      ? asArray(response?.characterUpdateReviews)
      : asArray(response?.candidateReviews).length
        ? asArray(response?.candidateReviews)
        : updates;
    const accepted = reviewRows.filter((entry) => asRecord(entry)?.accepted === true);
    const rejected = reviewRows.filter((entry) => asRecord(entry)?.accepted === false);
    const proposedCandidateCount = reviewRows.length || updates.length;
    const physicalStateReviews = asArray(response?.physicalStateReviews);
    const physicalStateCompletenessReviews = asArray(response?.physicalStateCompletenessReviews);
    const missingPhysicalStateReviews = asArray(response?.missingPhysicalStateReviews);
    return `
      <div class="support-summary">
        <div class="support-summary-title">Character state sync summary</div>
        <div class="support-summary-grid">
          ${renderKeyValueRows([
            ['Proposed candidates', proposedCandidateCount],
            ['Accepted update candidates', accepted.length],
            ['Rejected updates', rejected.length],
            ['Physical state review rows', physicalStateReviews.length],
            ['Missing physical state reviews', missingPhysicalStateReviews.length],
          ])}
        </div>
        ${reviewRows.length ? `<ul>${reviewRows.map((entry) => {
          const item = asRecord(entry) || {};
          const character = String(item.character || 'Unknown character');
          const field = String(item.field || 'unknown field');
          const value = item.value == null ? '' : String(item.value);
          const statusLabel = item.accepted === true
            ? 'accepted'
            : item.reason
              ? `rejected: ${String(item.reason)}`
              : 'not accepted';
          const confidence = item.confidence == null ? '' : ` / confidence ${escapeHtml(String(item.confidence))}`;
          const evidence = item.evidence ? ` Evidence: ${escapeHtml(String(item.evidence))}` : '';
          return `<li><strong>${escapeHtml(character)}.${escapeHtml(field)}</strong> [${escapeHtml(statusLabel)}]${value ? ` -> ${escapeHtml(textPreview(value, 180))}` : ''}${confidence}${evidence}</li>`;
        }).join('')}</ul>` : '<p>No character-card updates returned.</p>'}
        ${physicalStateCompletenessReviews.length ? `<div class="support-summary-title">Physical state completeness review</div><ul>${physicalStateCompletenessReviews.map((entry) => {
          const item = asRecord(entry) || {};
          const character = String(item.character || 'Unknown character');
          const status = item.reviewed === true ? 'reviewed' : 'missing';
          const source = item.source ? ` / ${escapeHtml(String(item.source))}` : '';
          const reason = item.reason ? ` — ${escapeHtml(String(item.reason))}` : '';
          return `<li><strong>${escapeHtml(character)}</strong> [${escapeHtml(status)}${source}]${reason}</li>`;
        }).join('')}</ul>` : ''}
        ${notes}
      </div>
    `;
  }

	  if (endpoint.includes('evaluate-goal-alignment')) {
	    const evaluations = asArray(response?.evaluations);
	    const reviewRows = asArray(response?.alignmentReviews).length
	      ? asArray(response?.alignmentReviews)
	      : evaluations;
	    const rejected = asArray(response?.rejectedEvaluations).length
	      ? asArray(response?.rejectedEvaluations)
	      : reviewRows.filter((entry) => asRecord(entry)?.accepted === false);
	    return `
	      <div class="support-summary">
	        <div class="support-summary-title">Goal alignment summary</div>
	        <div class="support-summary-grid">
	          ${renderKeyValueRows([
	            ['Evaluations', evaluations.length],
	            ['Review rows', reviewRows.length],
	            ['Rejected evaluations', rejected.length],
	            ['Parse error', response?.parseError],
	            ['Shadow mode', response?.shadowMode],
	            ['Persistence', response?.persistence],
	            ['Error', response?.error],
	          ])}
	        </div>
	        ${reviewRows.length ? `<ul>${reviewRows.map((entry) => {
	          const item = asRecord(entry) || {};
	          const statusLabel = item.accepted === false
	            ? `rejected: ${String(item.reason || 'not accepted')}`
	            : item.accepted === true
	              ? 'accepted'
	              : 'returned';
	          return `<li><strong>${escapeHtml(String(item.goalId || 'unknown goal'))}</strong> [${escapeHtml(statusLabel)}] ${escapeHtml(String(item.signal || 'unknown'))}${item.intensity != null ? ` / intensity ${escapeHtml(String(item.intensity))}` : ''}${item.rationale ? ` — ${escapeHtml(String(item.rationale))}` : ''}${item.evidence ? ` Evidence: ${escapeHtml(String(item.evidence))}` : ''}</li>`;
	        }).join('')}</ul>` : '<p>No goal-alignment evaluations returned.</p>'}
	        ${notes}
	      </div>
	    `;
	  }

	  if (endpoint.includes('extract-memory-events')) {
	    const events = asArray(response?.extractedEvents);
	    const rejectedEvents = asArray(response?.rejectedEvents);
	    return `
	      <div class="support-summary">
	        <div class="support-summary-title">Memory extraction summary</div>
	        <div class="support-summary-grid">
	          ${renderKeyValueRows([
	            ['Events extracted', events.length],
	            ['Rejected/malformed rows', rejectedEvents.length],
	            ['Parse error', response?.parseError],
	            ['Error', response?.error],
	          ])}
	        </div>
	        ${events.length ? `<ul>${events.map((event) => `<li>${escapeHtml(String(event))}</li>`).join('')}</ul>` : '<p>No durable memory events returned.</p>'}
	        ${rejectedEvents.length ? `<ul>${rejectedEvents.map((entry) => {
	          const item = asRecord(entry) || {};
	          const reason = String(item.reason || 'rejected');
	          const value = item.value == null ? '' : ` — ${escapeHtml(textPreview(String(item.value), 220))}`;
	          return `<li><strong>Rejected memory output</strong> [${escapeHtml(reason)}]${value}</li>`;
	        }).join('')}</ul>` : ''}
	        ${notes}
	      </div>
	    `;
	  }

  if (endpoint.includes('generate-side-character')) {
    return `
      <div class="support-summary">
        <div class="support-summary-title">Side-character support summary</div>
        <div class="support-summary-grid">
          ${renderKeyValueRows([
            ['Returned name', response?.name],
            ['Returned role', response?.roleDescription],
            ['Image returned', response?.imageUrl ? 'yes' : undefined],
            ['Error', response?.error],
          ])}
        </div>
        ${notes}
      </div>
    `;
  }

  if (endpoint.includes('generate-scene-image') || endpoint.includes('generate-cover-image')) {
    return `
      <div class="support-summary">
        <div class="support-summary-title">Image support summary</div>
        <div class="support-summary-grid">
          ${renderKeyValueRows([
            ['Image returned', response?.imageUrl ? 'yes' : undefined],
            ['Error', response?.error],
          ])}
        </div>
        ${notes}
      </div>
    `;
  }

  if (!notes) return '';
  return `<div class="support-summary"><div class="support-summary-title">Support-call notes</div>${notes}</div>`;
}

function renderModelRequestBlocks(call: StoredChatDebugTrace['call1Request']): string {
  if (!call) return '';

  const modelRequests = [
    ...(call.modelRequest ? [{ label: 'Grok-facing request', ...call.modelRequest }] : []),
    ...(call.modelRequests || []),
  ];

  if (modelRequests.length === 0) return '';

  return modelRequests.map((request, index) => `
    <div class="model-request-card">
      <div class="trace-meta-grid">
        <span><strong>Model request</strong>${escapeHtml(request.label || `Grok-facing request ${index + 1}`)}</span>
        <span><strong>Endpoint</strong>${escapeHtml(request.endpoint)}</span>
        <span><strong>Method</strong>${escapeHtml(request.method || 'POST')}</span>
        <span><strong>Captured</strong>${escapeHtml(formatDebugDate(request.capturedAt))}</span>
      </div>
      ${request.notes?.length ? `<ul class="trace-note-list">${request.notes.map((note) => `<li>${escapeHtml(note)}</li>`).join('')}</ul>` : ''}
      ${renderDebugJsonBlock('Exact request body sent to Grok/xAI', request.requestBody)}
    </div>
  `).join('');
}

function renderApiCall1Details(segment: ReviewExportSegment): string {
  if (segment.role !== 'assistant') return '';

  const call = segment.debugRecord?.call1Request;
  const trace = segment.debugRecord?.trace;

  if (!call && !trace) {
    return `<details class="trace-details trace-empty"><summary>API Call 1 Data</summary><p>No API Call 1 trace was captured for this message generation.</p></details>`;
  }

  const modelRequestBlocks = renderModelRequestBlocks(call);
  const callBody = call
    ? `
      <div class="trace-meta-grid">
        <span><strong>Endpoint</strong>${escapeHtml(call.endpoint)}</span>
        <span><strong>Status</strong>${escapeHtml(call.status || 'captured')}</span>
        <span><strong>Captured</strong>${escapeHtml(formatDebugDate(call.capturedAt))}</span>
      </div>
      ${modelRequestBlocks || renderDebugJsonBlock('Browser-to-edge request body captured before Grok call', call.requestBody)}
      ${modelRequestBlocks ? renderDebugJsonBlock('Browser-to-edge request body', call.requestBody) : ''}
    `
    : '<p>No frontend or Grok-facing request payload was captured for this message generation.</p>';

  const backendTrace = trace
    ? renderDebugJsonBlock('Backend debug trace returned by chat edge function', trace)
    : '<p>No backend debug trace was returned for this message generation.</p>';

  return `
    <details class="trace-details">
      <summary>API Call 1 Data</summary>
      ${callBody}
      ${backendTrace}
    </details>
  `;
}

function renderSupportCallDetails(segment: ReviewExportSegment): string {
  if (segment.role !== 'assistant') return '';

  const supportCalls = segment.debugRecord?.supportCalls || [];
  if (supportCalls.length === 0) {
    return `<details class="trace-details trace-empty"><summary>API Call 2 + Supporting API Call Data</summary><p>No post-turn or support-call records were captured for this message generation at export time.</p></details>`;
  }

  const callsHtml = supportCalls.map((call) => `
    <section class="support-call-card">
      <div class="support-call-header">
        <div>
          <strong>${escapeHtml(call.label)}</strong>
          <span>${escapeHtml(call.endpoint)}</span>
        </div>
        <em>${escapeHtml(call.status || 'captured')}</em>
      </div>
      <div class="trace-meta-grid">
        <span><strong>Group</strong>${escapeHtml(call.apiCallGroup)}</span>
        <span><strong>Method</strong>${escapeHtml(call.method || 'n/a')}</span>
        <span><strong>Captured</strong>${escapeHtml(formatDebugDate(call.capturedAt))}</span>
      </div>
      ${call.error ? `<p class="trace-error">${escapeHtml(call.error)}</p>` : ''}
      ${renderSupportCallSummary(call)}
      ${renderModelRequestBlocks(call)}
      ${renderDebugJsonBlock(call.modelRequest || call.modelRequests?.length ? 'Browser-to-edge request body' : call.endpoint?.startsWith('local://') ? 'Local diagnostic payload' : 'Request body sent', call.requestBody)}
      ${renderDebugJsonBlock('Response body received', call.responseBody ?? '(not captured yet)')}
    </section>
  `).join('');

  return `
    <details class="trace-details">
      <summary>API Call 2 + Supporting API Call Data (${supportCalls.length})</summary>
      ${callsHtml}
    </details>
  `;
}

function renderAppliedUpdatesDetails(segment: ReviewExportSegment): string {
  if (segment.role !== 'assistant') return '';

  const changes = segment.postTurnStateChanges || [];
  if (changes.length === 0) {
    return `<details class="trace-details trace-empty"><summary>Applied Updates Summary</summary><p>No saved character, side-character, memory, story-goal, or goal-alignment updates were recorded for this message generation at export time.</p></details>`;
  }

  return `
    <details class="trace-details state-change-details">
      <summary>Applied Updates Summary (${changes.length})</summary>
      <ul>${changes.map((change) => `<li>${escapeHtml(change)}</li>`).join('')}</ul>
    </details>
  `;
}

function renderCountList(entries: Array<{ value: string; count: number }>, emptyText: string): string {
  if (!entries.length) return `<p>${escapeHtml(emptyText)}</p>`;
  return `<ul>${entries.map((entry) => `<li><strong>${escapeHtml(entry.value)}</strong> repeated ${entry.count}x</li>`).join('')}</ul>`;
}

function renderDebugMetricsDetails(segment: ReviewExportSegment): string {
  if (segment.role !== 'assistant' || !segment.debugMetrics) return '';

  const metrics = segment.debugMetrics;
  const modalitySequence = metrics.modalitySequence.length
    ? metrics.modalitySequence.join(' -> ')
    : 'none detected';
  const compressedSequence = metrics.compressedModalitySequence.length
    ? metrics.compressedModalitySequence.join(' -> ')
    : 'none detected';
  const repeatedPreviousTerms = metrics.repeatedTermsFromEarlierAssistantBlocks.length
    ? metrics.repeatedTermsFromEarlierAssistantBlocks.join(', ')
    : 'none detected';
  const thoughtDiagnostics = metrics.internalThoughtDiagnostics.length
    ? `<ul>${metrics.internalThoughtDiagnostics.map((thought) => {
      const warnings = [
        thought.possibleMultiTopicWarning ? 'possible multi-topic thought' : '',
        thought.backToBackThoughtWarning ? 'back-to-back thought' : '',
        thought.repeatsVisibleActionTerms.length ? `repeats action terms: ${thought.repeatsVisibleActionTerms.join(', ')}` : '',
      ].filter(Boolean);
      return `<li><strong>Thought ${thought.index}</strong> ${thought.wordCount} words / ${thought.sentenceCount} sentence(s)${warnings.length ? ` — ${escapeHtml(warnings.join('; '))}` : ''}<br><span>${escapeHtml(thought.preview)}</span></li>`;
    }).join('')}</ul>`
    : '<p>No internal thoughts detected in this character block.</p>';
  const sourceOverlap = metrics.sourceOverlap.length
    ? `<ul>${metrics.sourceOverlap.map((entry) => (
      `<li><strong>${escapeHtml(entry.source)}</strong> ${entry.matchCount} matched term(s)${entry.matchedTerms.length ? ` — ${escapeHtml(entry.matchedTerms.join(', '))}` : ''}</li>`
    )).join('')}</ul>`
    : '<p>No source-overlap scan was run for this block.</p>';

  return `
    <details class="trace-details metrics-details">
      <summary>Deterministic Debug Metrics</summary>
      <div class="support-summary">
        <div class="support-summary-title">Response structure counts</div>
        <div class="support-summary-grid">
          ${renderKeyValueRows([
            ['Words', metrics.wordCount],
            ['Sentences', metrics.sentenceCount],
            ['Actions', metrics.actionSegmentCount],
            ['External dialogue', metrics.dialogueSegmentCount],
            ['Internal thoughts', metrics.internalThoughtCount],
            ['Plain text spans', metrics.plainTextSegmentCount],
            ['Dialogue words', metrics.dialogueWordCount],
            ['Narration/action/thought words', metrics.actionWordCount + metrics.internalThoughtWordCount + metrics.plainTextWordCount],
            ['Dialogue-to-narration ratio', metrics.dialogueToNarrationRatio],
          ])}
        </div>
        <p><strong>Full modality sequence:</strong> ${escapeHtml(modalitySequence)}</p>
        <p><strong>Compressed modality sequence:</strong> ${escapeHtml(compressedSequence)}</p>
      </div>
      <div class="support-summary">
        <div class="support-summary-title">Repetition hints</div>
        <p><strong>Repeated terms from earlier assistant blocks:</strong> ${escapeHtml(repeatedPreviousTerms)}</p>
        <div class="metrics-columns">
          <div>
            <strong>Repeated terms inside this block</strong>
            ${renderCountList(metrics.topRepeatedTerms, 'No repeated descriptive/content terms detected inside this block.')}
          </div>
          <div>
            <strong>Repeated phrases inside this block</strong>
            ${renderCountList(metrics.repeatedPhrases, 'No repeated 2-5 word phrases detected inside this block.')}
          </div>
        </div>
      </div>
      <div class="support-summary">
        <div class="support-summary-title">Internal thought diagnostics</div>
        ${thoughtDiagnostics}
      </div>
      <div class="support-summary">
        <div class="support-summary-title">Source overlap hints</div>
        <p>Local term overlap only, checked against the current exported app/story state and recent transcript text. This does not prove why the model wrote something or guarantee that every source bucket was present in this exact historical request.</p>
        ${sourceOverlap}
      </div>
    </details>
  `;
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

function uniqueIssueTags(tags: ChatDebugIssueTag[] | undefined): ChatDebugIssueTag[] {
  const seen = new Set<ChatDebugIssueTag>();
  const ordered: ChatDebugIssueTag[] = [];

  for (const tag of CHAT_DEBUG_ISSUE_TAGS) {
    if (tags?.includes(tag) && !seen.has(tag)) {
      seen.add(tag);
      ordered.push(tag);
    }
  }

  return ordered;
}

function buildIssueTagCounts(
  comments: Record<string, ChatReviewLiveComment> | undefined,
): Array<{ tag: ChatDebugIssueTag; count: number }> {
  const counts = new Map<ChatDebugIssueTag, number>();

  for (const comment of Object.values(comments || {})) {
    for (const tag of uniqueIssueTags(comment.tags)) {
      counts.set(tag, (counts.get(tag) || 0) + 1);
    }
  }

  return CHAT_DEBUG_ISSUE_TAGS
    .map((tag) => ({ tag, count: counts.get(tag) || 0 }))
    .filter((entry) => entry.count > 0);
}

function buildSegments(input: ChatReviewExportInput): ReviewExportSegment[] {
  const characters = getCharacters(input.appData);
  const buildEventKey = (messageId: string, generationId?: string) => `${messageId}:${generationId || ''}`;
  const continueSet = new Set(input.continueMessageIds || []);
  const regenerateSet = new Set(input.regenerateMessageIds || []);
  const continueGenerationSet = new Set(
    (input.continueMessageEvents || []).map((event) => buildEventKey(event.messageId, event.generationId)),
  );
  const regenerateGenerationSet = new Set(
    (input.regenerateMessageEvents || []).map((event) => buildEventKey(event.messageId, event.generationId)),
  );
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
    const liveComment = input.messageComments?.[message.id];
    const postTurnStateChanges = input.postTurnStateChanges?.[message.id] || [];
    const generationId = message.generationId || message.id;
    const debugRecord = input.debugRecords?.[debugTraceKey(message.id, generationId)] || null;

    messageSegments.forEach((segment, segmentIndex) => {
      const speaker = resolveSpeaker(segment, message.role, characters);
      const fallbackSpeaker = message.role === 'assistant' ? 'AI' : 'User';
      segments.push({
        reviewId: `${message.id}-${segmentIndex}`,
        messageId: message.id,
        generationId,
        turnNumber: visibleTurn,
        segmentNumber: segmentIndex + 1,
        role: message.role,
        speakerName: speaker?.name || segment.speakerName || fallbackSpeaker,
        speakerControl: speaker?.control || (message.role === 'assistant' ? 'AI' : 'User'),
        speakerRole: speaker?.role || '',
        avatarUrl: speaker?.avatarUrl || '',
        text: segment.content,
        rawMessageText,
        localNotice: message.localNotice ?? null,
        day: message.day,
        timeOfDay: message.timeOfDay,
        createdAt: message.createdAt,
        isContinueTarget: continueGenerationSet.size > 0
          ? continueGenerationSet.has(buildEventKey(message.id, generationId))
          : continueSet.has(message.id),
        isRegenerated: regenerateGenerationSet.size > 0
          ? regenerateGenerationSet.has(buildEventKey(message.id, generationId))
          : regenerateSet.has(message.id),
        imageUrl: message.imageUrl,
        liveComment,
        postTurnStateChanges,
        debugRecord,
      });
    });
  }

  return segments;
}

function renderSegmentCard(segment: ReviewExportSegment, index: number): string {
  const classes = [
    'message-card',
    segment.role === 'user' ? 'user-card' : 'assistant-card',
    segment.isRegenerated ? 'is-regenerated' : '',
    segment.isContinueTarget ? 'is-continue' : '',
  ].filter(Boolean).join(' ');

  const selectedTags = uniqueIssueTags(segment.liveComment?.tags);
  const liveCommentTags = selectedTags.length
    ? `<div class="comment-tag-row">${selectedTags.map((tag) => `<span class="comment-tag">${escapeHtml(tag)}</span>`).join('')}</div>`
    : '';
  const liveCommentBlock = segment.liveComment?.note || selectedTags.length
    ? `<section class="live-comment"><div>Live tester note</div>${liveCommentTags}${segment.liveComment?.note ? `<p>${escapeHtml(segment.liveComment.note)}</p>` : '<p>No written note. Tags only.</p>'}</section>`
    : '';
  const imageBlock = segment.imageUrl
    ? `<img class="scene-image" src="${escapeAttribute(segment.imageUrl)}" alt="Generated scene image" loading="lazy" />`
    : '';
  const traceBlocks = segment.role === 'assistant'
    ? `<div class="trace-stack">${renderDebugMetricsDetails(segment)}${renderApiCall1Details(segment)}${renderSupportCallDetails(segment)}${renderAppliedUpdatesDetails(segment)}</div>`
    : '';

  return `
    <article id="review-${escapeAttribute(segment.reviewId)}" class="${classes}" data-review-index="${index}" data-review-id="${escapeAttribute(segment.reviewId)}" data-message-id="${escapeAttribute(segment.messageId)}" data-generation-id="${escapeAttribute(segment.generationId)}" data-turn="${segment.turnNumber}" data-role="${escapeAttribute(segment.role)}" data-speaker="${escapeAttribute(segment.speakerName)}" data-has-live-comment="${segment.liveComment ? 'true' : 'false'}" data-live-comment-note="${escapeAttribute(segment.liveComment?.note || '')}" data-live-comment-tags="${escapeAttribute(selectedTags.join(', '))}" data-excerpt="${escapeAttribute(textPreview(segment.text, 260))}">
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
          ${traceBlocks}
        </div>
      </div>
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

function renderLiveCommentIndex(
  comments: Record<string, ChatReviewLiveComment> | undefined,
  segments: ReviewExportSegment[],
): string {
  const commentEntries = Object.values(comments || {})
    .filter((comment) => comment.note.trim() || uniqueIssueTags(comment.tags).length > 0)
    .sort((left, right) => left.updatedAt - right.updatedAt);

  if (commentEntries.length === 0) return '';

  return `
    <section class="live-comment-index" data-live-comment-count="${commentEntries.length}">
      <div class="issue-summary-header">
        <div class="eyebrow">Live tester notes index</div>
        <p>Every saved tester note is listed here and repeated on each split speaker card for the message it belongs to, so comments are easy to find by eye, search, or parser.</p>
      </div>
      <div class="live-comment-index-list">
        ${commentEntries.map((comment, index) => {
    const matchingSegments = segments.filter((segment) => (
      segment.messageId === comment.messageId
      && (!comment.generationId || segment.generationId === comment.generationId)
    ));
    const selectedTags = uniqueIssueTags(comment.tags);
    const links = matchingSegments.length
      ? matchingSegments.map((segment) => `<a href="#review-${escapeAttribute(segment.reviewId)}">Turn ${segment.turnNumber}${segment.segmentNumber > 1 ? `.${segment.segmentNumber}` : ''} ${escapeHtml(segment.speakerName)}</a>`).join(' ')
      : '<span>No rendered message card matched this saved note.</span>';

    return `
          <article class="live-comment-index-card" data-live-comment-index="${index}" data-message-id="${escapeAttribute(comment.messageId)}" data-generation-id="${escapeAttribute(comment.generationId || comment.messageId)}">
            <div class="comment-index-meta">
              <strong>Note ${index + 1}</strong>
              <span>message ${escapeHtml(comment.messageId)} · generation ${escapeHtml(comment.generationId || comment.messageId)}</span>
            </div>
            ${selectedTags.length ? `<div class="comment-tag-row">${selectedTags.map((tag) => `<span class="comment-tag">${escapeHtml(tag)}</span>`).join('')}</div>` : ''}
            ${comment.note ? `<p>${escapeHtml(comment.note)}</p>` : '<p>No written note. Tags only.</p>'}
            <div class="comment-index-links">${links}</div>
          </article>
        `;
  }).join('')}
      </div>
    </section>
  `;
}

function renderIssueSummary(
  comments: Record<string, ChatReviewLiveComment> | undefined,
): string {
  const issueCounts = buildIssueTagCounts(comments);
  if (!issueCounts.length) return '';

  return `
    <section class="issue-summary">
      <div class="issue-summary-header">
        <div class="eyebrow">Issue summary</div>
        <p>Counted from the tags saved on dialogue debug notes in this transcript.</p>
      </div>
      <div class="issue-summary-grid">
        ${issueCounts.map((entry) => `
          <div class="issue-summary-card">
            <strong>${escapeHtml(entry.tag)}</strong>
            <span>${entry.count} tagged ${entry.count === 1 ? 'note' : 'notes'}</span>
          </div>
        `).join('')}
      </div>
    </section>
  `;
}

function renderTranscriptMetricsSummary(metrics: ReviewDebugMetrics): string {
  const transcript = metrics.transcript;
  return `
    <section class="issue-summary metrics-summary">
      <div class="issue-summary-header">
        <div class="eyebrow">Deterministic debug metrics</div>
        <p>Computed locally from the exported transcript and app state. These measurements are not sent to Grok and do not affect roleplay output.</p>
      </div>
      <div class="issue-summary-grid">
        <div class="issue-summary-card"><strong>${transcript.assistantBlockCount}</strong><span>Assistant character blocks</span></div>
        <div class="issue-summary-card"><strong>${transcript.averageAssistantWords}</strong><span>Average assistant words per block</span></div>
        <div class="issue-summary-card"><strong>${transcript.assistantWordCountVariance}</strong><span>Assistant word-count variance</span></div>
        <div class="issue-summary-card"><strong>${transcript.assistantSimilarLengthWarning ? 'Yes' : 'No'}</strong><span>Similar-length block warning</span></div>
      </div>
      <div class="metrics-columns metrics-summary-columns">
        <div>
          <strong>Repeated terms across assistant blocks</strong>
          ${renderCountList(transcript.repeatedTermsAcrossAssistant, 'No terms repeated across assistant blocks above the threshold.')}
        </div>
        <div>
          <strong>Repeated phrases across assistant blocks</strong>
          ${renderCountList(transcript.repeatedPhrasesAcrossAssistant, 'No repeated 2-5 word phrases detected across assistant blocks.')}
        </div>
      </div>
    </section>
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
    .comment-tag-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: 0 0 10px;
    }
    .comment-tag {
      border: 1px solid rgba(120,220,202,0.24);
      border-radius: 999px;
      background: rgba(120,220,202,0.12);
      color: #d7f7ef;
      font-size: 11px;
      font-weight: 900;
      letter-spacing: 0.02em;
      padding: 4px 9px;
    }
    .issue-summary {
      border: 1px solid var(--line);
      border-radius: 22px;
      background: rgba(255,255,255,0.04);
      box-shadow: 0 20px 56px rgba(0,0,0,0.18);
      padding: 18px;
      margin: 0 0 20px;
    }
    .issue-summary-header p {
      margin: 6px 0 0;
      color: var(--muted);
      font-size: 13px;
    }
    .issue-summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
      gap: 10px;
      margin-top: 14px;
    }
    .issue-summary-card {
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px;
      background: rgba(255,255,255,0.035);
      padding: 12px;
    }
    .issue-summary-card strong {
      display: block;
      font-size: 14px;
      margin-bottom: 3px;
    }
    .issue-summary-card span {
      color: var(--muted);
      font-size: 12px;
    }
    .live-comment-index {
      border: 1px solid rgba(120,220,202,0.24);
      border-radius: 24px;
      background: rgba(120,220,202,0.06);
      padding: 18px;
      margin: 20px 0;
    }
    .live-comment-index-list {
      display: grid;
      gap: 12px;
      margin-top: 14px;
    }
    .live-comment-index-card {
      border: 1px solid rgba(120,220,202,0.22);
      border-radius: 18px;
      background: rgba(12,20,22,0.76);
      padding: 14px;
    }
    .comment-index-meta {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      color: var(--muted);
      font-size: 12px;
      margin-bottom: 8px;
    }
    .comment-index-meta strong { color: var(--text); }
    .live-comment-index-card p {
      color: #d7f7ef;
      white-space: pre-wrap;
      margin: 8px 0 10px;
    }
    .comment-index-links {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .comment-index-links a, .comment-index-links span {
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 999px;
      color: var(--accent);
      background: rgba(255,255,255,0.05);
      padding: 4px 8px;
      font-size: 12px;
      text-decoration: none;
    }
    details { margin-top: 12px; border: 1px solid rgba(255,255,255,0.10); border-radius: 14px; background: rgba(0,0,0,0.18); }
    summary { cursor: pointer; color: var(--muted); font-weight: 800; padding: 10px 12px; }
    pre { white-space: pre-wrap; margin: 0; padding: 12px; color: #cbd5e1; overflow-wrap: anywhere; }
    .trace-stack { display: grid; gap: 10px; margin-top: 14px; }
    .trace-details {
      margin-top: 0;
      border-color: rgba(226,179,106,0.22);
      background: rgba(226,179,106,0.055);
    }
    .trace-details summary {
      color: #f6df8f;
      font-size: 13px;
      letter-spacing: 0.01em;
    }
    .trace-details p {
      margin: 0;
      padding: 0 12px 12px;
      color: #d5d9e3;
    }
    .trace-empty { border-style: dashed; opacity: 0.86; }
    .trace-meta-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
      gap: 8px;
      padding: 0 12px 12px;
    }
    .trace-meta-grid span {
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px;
      background: rgba(0,0,0,0.18);
      color: #cfd6e4;
      padding: 8px 10px;
      font-size: 12px;
    }
    .trace-meta-grid strong {
      display: block;
      color: var(--muted);
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 2px;
    }
    .debug-json-block {
      border-top: 1px solid rgba(255,255,255,0.08);
      margin-top: 8px;
    }
    .debug-json-label {
      color: #f6df8f;
      font-size: 11px;
      font-weight: 900;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 10px 12px 0;
    }
    .debug-json-block pre {
      max-height: 520px;
      overflow: auto;
      color: #d8e2f2;
      font-size: 12px;
      line-height: 1.5;
    }
    .model-request-card {
      border-top: 1px solid rgba(120,220,202,0.18);
      background: rgba(120,220,202,0.045);
      padding-top: 10px;
      margin-top: 8px;
    }
    .trace-note-list {
      margin: 0;
      padding: 0 18px 12px 34px;
      color: #d8e2f2;
      font-size: 12px;
    }
    .trace-note-list li { margin: 5px 0; }
    .trace-note {
      color: #d8e2f2;
      background: rgba(120,220,202,0.07);
      border: 1px solid rgba(120,220,202,0.16);
      border-radius: 10px;
      padding: 10px 12px;
      margin: 0 0 12px;
    }
    .support-call-card {
      border-top: 1px solid rgba(255,255,255,0.08);
      padding-top: 10px;
    }
    .support-call-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      padding: 0 12px 10px;
    }
    .support-call-header strong { display: block; color: var(--text); }
    .support-call-header span { display: block; color: var(--muted); font-size: 12px; }
    .support-call-header em {
      border: 1px solid rgba(120,220,202,0.22);
      border-radius: 999px;
      color: var(--accent);
      font-style: normal;
      font-weight: 900;
      font-size: 11px;
      padding: 4px 8px;
      text-transform: uppercase;
    }
    .support-summary {
      margin: 0 12px 12px;
      border: 1px solid rgba(120,220,202,0.18);
      border-radius: 14px;
      background: rgba(120,220,202,0.055);
      padding: 10px 12px;
    }
    .support-summary-title {
      color: var(--accent);
      font-size: 11px;
      font-weight: 900;
      letter-spacing: 0.10em;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .support-summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 8px;
      margin-bottom: 8px;
    }
    .support-summary-grid span {
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 10px;
      background: rgba(0,0,0,0.16);
      color: #d8e2f2;
      padding: 7px 9px;
      font-size: 12px;
    }
    .support-summary-grid strong {
      display: block;
      color: var(--muted);
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 2px;
    }
    .support-summary ul,
    .support-summary-notes {
      margin: 0;
      padding: 0 0 0 20px;
      color: #d8e2f2;
      font-size: 12px;
    }
    .support-summary li { margin: 5px 0; }
    .support-summary p {
      margin: 0 !important;
      padding: 0 !important;
      color: #d8e2f2;
      font-size: 12px;
    }
    .metrics-columns {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 12px;
      margin-top: 10px;
    }
    .metrics-columns > div {
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px;
      background: rgba(0,0,0,0.14);
      padding: 10px;
    }
    .metrics-columns strong {
      display: block;
      color: var(--text);
      font-size: 12px;
      margin-bottom: 6px;
    }
    .metrics-summary-columns {
      margin-top: 14px;
    }
    .metrics-summary-columns ul,
    .metrics-details ul {
      margin: 0;
      padding: 0 0 0 20px;
      color: #d8e2f2;
      font-size: 12px;
    }
    .metrics-summary-columns li,
    .metrics-details li {
      margin: 5px 0;
    }
    .metrics-details li span {
      color: var(--muted);
    }
    .support-summary-notes {
      border-top: 1px solid rgba(255,255,255,0.08);
      margin-top: 8px;
      padding-top: 8px;
    }
    .trace-error {
      color: #ffd0d0 !important;
      background: rgba(255,123,123,0.10);
      border-top: 1px solid rgba(255,123,123,0.18);
      border-bottom: 1px solid rgba(255,123,123,0.18);
      margin-bottom: 8px !important;
      padding-top: 8px !important;
    }
    .state-change-details ul { margin: 0; padding: 0 18px 14px 34px; color: #d8e2f2; }
    .state-change-details li { margin: 7px 0; }
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
  const debugMetrics = buildReviewDebugMetrics({
    appData: input.appData,
    conversation: input.conversation,
    segments: segments.map((segment) => ({
      reviewId: segment.reviewId,
      messageId: segment.messageId,
      generationId: segment.generationId,
      turnNumber: segment.turnNumber,
      segmentNumber: segment.segmentNumber,
      role: segment.role,
      speakerName: segment.speakerName,
      text: segment.text,
      rawMessageText: segment.rawMessageText,
      localNotice: segment.localNotice ?? null,
    })),
  });
  const metricsByReviewId = new Map(debugMetrics.segments.map((metrics) => [metrics.reviewId, metrics]));
  const segmentsWithMetrics = segments.map((segment) => ({
    ...segment,
    debugMetrics: metricsByReviewId.get(segment.reviewId),
  }));
  const exportedAt = formatExportDate(input.exportedAt);
  const cards = segmentsWithMetrics.map((segment, index) => renderSegmentCard(segment, index)).join('\n');
  const issueSummary = renderIssueSummary(input.messageComments);
  const transcriptMetricsSummary = renderTranscriptMetricsSummary(debugMetrics);
  const liveCommentIndex = renderLiveCommentIndex(input.messageComments, segmentsWithMetrics);
  const liveComments = Object.values(input.messageComments || {}).map((comment) => ({
    messageId: comment.messageId,
    generationId: comment.generationId || comment.messageId,
    note: comment.note,
    tags: uniqueIssueTags(comment.tags),
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    renderedSegments: segmentsWithMetrics
      .filter((segment) => (
        segment.messageId === comment.messageId
        && (!comment.generationId || segment.generationId === comment.generationId)
      ))
      .map((segment) => ({
        reviewId: segment.reviewId,
        turnNumber: segment.turnNumber,
        segmentNumber: segment.segmentNumber,
        speakerName: segment.speakerName,
      })),
  }));
  const embeddedDebugData = {
    schema: 'chronicle-session-review-v2',
    exportedAt,
    scenarioTitle: input.scenarioTitle,
    conversationId: input.conversation.id,
    liveComments,
    messages: input.conversation.messages.map((message) => ({
      id: message.id,
      generationId: message.generationId || message.id,
      role: message.role,
      text: message.text,
      localNotice: message.localNotice ?? null,
      day: message.day ?? null,
      timeOfDay: message.timeOfDay ?? null,
      createdAt: message.createdAt,
      comment: input.messageComments?.[message.id] || null,
      appliedUpdates: input.postTurnStateChanges?.[message.id] || [],
      debugRecord: input.debugRecords?.[debugTraceKey(message.id, message.generationId || message.id)] || null,
      deterministicMetrics: debugMetrics.segments.filter((metrics) => metrics.messageId === message.id),
    })),
    deterministicMetrics: debugMetrics,
  };

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Chronicle Session Log - ${escapeHtml(input.scenarioTitle)}</title>
  <style>${reviewStyles()}</style>
</head>
<body>
  <main class="shell">
    <section class="hero">
      <div class="eyebrow">Chronicle session log</div>
      <h1>${escapeHtml(input.scenarioTitle)}</h1>
      <p>Styled transcript export with avatars, split speaker blocks, generated images, Continue/Regenerate markers, and any live dialogue debug notes saved while testing.</p>
      <div class="meta-grid">
        <div class="meta-card"><strong>${escapeHtml(input.conversation.title || 'Untitled conversation')}</strong><span>Conversation</span></div>
        <div class="meta-card"><strong>${escapeHtml(input.modelId)}</strong><span>Model</span></div>
        <div class="meta-card"><strong>${segmentsWithMetrics.length}</strong><span>Rendered message blocks</span></div>
        <div class="meta-card"><strong>${escapeHtml(exportedAt)}</strong><span>Exported</span></div>
      </div>
      <div class="character-grid">${renderCharacterSummary(characters)}</div>
    </section>

    ${issueSummary}
    ${transcriptMetricsSummary}
    ${liveCommentIndex}
    ${cards}

    <p class="footer-note">Dialogue debug notes are saved to this playthrough for testing only. They are not sent to the roleplay model and are not saved story state.</p>
    <script type="application/json" id="chronicle-session-review-comments">${safeJsonScript(liveComments)}</script>
    <script type="application/json" id="chronicle-session-review-data">${safeJsonScript(embeddedDebugData)}</script>
  </main>
</body>
</html>`;
}
