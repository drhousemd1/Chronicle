import type { Character, Conversation, Message, ScenarioData, SideCharacter, TimeOfDay } from '@/types';
import { parseMessageSegments, type MessageSegment } from '@/services/side-character-generator';
import { mergeByRenderedSpeaker } from '@/features/chat-runtime/speaker-resolution';
import { buildReviewDebugMetrics, type ReviewDebugMetrics, type ReviewSegmentDebugMetrics } from './review-metrics';
import {
  CHAT_DEBUG_ISSUE_TAGS,
  type ChatDebugIssueTag,
  type DialogDebugComment,
  type StoredChatDebugTrace,
  type StoredChatDebugTraceMap,
} from './types';
import type {
  ChatReviewRetryAttemptHistory,
  ChatReviewRetryLineage,
} from './retry-history';
import { buildChatReviewRetryLineage } from './retry-history';
import { renderResponseJobSummary } from './response-job-summary';
import type { EffectiveStatePruningReport } from '@/features/chat-runtime/effective-state';
import type { RoleplayRecentHistoryPacket } from '@/features/chat-runtime/roleplay-recent-history';
import { deriveRoleplaySupportReviewRows } from '@/features/chat-runtime/roleplay-support-review-projections';

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
};

export type ReviewExportParserOrigin =
  | 'raw_speaker_label'
  | 'paragraph_split'
  | 'inferred_speaker'
  | 'fallback';

export type ReviewExportParserDiagnostics = {
  rawSpeakerLabelCount: number;
  parsedSegmentCount: number;
  renderedChildCount: number;
  mergeCount: number;
  inferredSpeakerCount: number;
  fallbackSpeakerCount: number;
  splitOrigins: ReviewExportParserOrigin[];
};

export type ReviewExportParentMessage = {
  reviewId: string;
  messageId: string;
  generationId: string;
  turnNumber: number;
  role: Message['role'];
  rawMessageText: string;
  childSegments: ReviewExportSegment[];
  parserDiagnostics: ReviewExportParserDiagnostics;
  day?: number;
  timeOfDay?: TimeOfDay;
  createdAt: number;
  isContinueTarget: boolean;
  isRegenerated: boolean;
  imageUrl?: string;
  liveComment?: ChatReviewLiveComment;
  postTurnStateChanges: string[];
  statePruningReports: EffectiveStatePruningReport[];
  debugRecord: StoredChatDebugTrace | null;
  retryLineage: ChatReviewRetryLineage | null;
  localNotice?: Message['localNotice'] | null;
  childMetrics?: ReviewSegmentDebugMetrics[];
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
  statePruningReports?: Record<string, EffectiveStatePruningReport[]>;
  debugRecords?: StoredChatDebugTraceMap;
  retryAttemptHistory?: ChatReviewRetryAttemptHistory;
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

function resolveCanonicalExportSpeakerName(characters: ReviewExportCharacter[], speakerName: string): string | null {
  return findCharacter(characters, speakerName)?.name || null;
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

function readRecentHistoryPacket(value: unknown): RoleplayRecentHistoryPacket | null {
  const requestBody = asRecord(value);
  const packet = asRecord(requestBody?.recentHistoryPacket);
  if (!packet || !Array.isArray(packet.providerMessages) || !Array.isArray(packet.receipts) || !Array.isArray(packet.suppressedStyleAnchors)) {
    return null;
  }
  return packet as RoleplayRecentHistoryPacket;
}

function renderKeyValueRows(rows: Array<[string, unknown]>): string {
  return rows
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '')
    .map(([label, value]) => `<span><strong>${escapeHtml(label)}</strong>${escapeHtml(String(value))}</span>`)
    .join('');
}

const ROLEPLAY_SUPPORT_ENDPOINTS = [
  'extract-character-updates',
  'extract-memory-events',
  'evaluate-goal-progress',
  'evaluate-goal-alignment',
  'compress-day-memories',
];

function renderSupportEnvelopeItems(
  title: string,
  items: Array<{
    label: string;
    reason: string;
    evidence?: string;
    category?: string;
    claimType?: string;
    sourceRole?: string;
    authority?: string;
    modelFacingAction?: string;
    sourceMessageId?: string;
    sourceGenerationId?: string;
    userCharacterId?: string;
  }>,
): string {
  if (items.length === 0) return '';
  return `<div class="support-summary-title">${escapeHtml(title)}</div><ul>${items.map((item) => {
    const metadata = [
      item.claimType ? `claim type: ${item.claimType}` : '',
      item.sourceRole ? `source role: ${item.sourceRole}` : '',
      item.authority ? `authority: ${item.authority}` : '',
      item.modelFacingAction ? `action: ${item.modelFacingAction}` : '',
      item.sourceMessageId ? `source message: ${item.sourceMessageId}` : '',
      item.sourceGenerationId ? `source generation: ${item.sourceGenerationId}` : '',
      item.userCharacterId ? `user character: ${item.userCharacterId}` : '',
      item.category ? `category: ${item.category}` : '',
      item.evidence ? `evidence: ${item.evidence}` : '',
    ].filter(Boolean).join('; ');
    return `<li><strong>${escapeHtml(item.label)}</strong> - ${escapeHtml(item.reason)}${metadata ? `; ${escapeHtml(metadata)}` : ''}</li>`;
  }).join('')}</ul>`;
}

function renderSupportReviewEnvelope(call: NonNullable<StoredChatDebugTrace['supportCalls']>[number]): string {
  const envelope = call.roleplaySupportReviewEnvelope;
  if (!envelope) {
    return ROLEPLAY_SUPPORT_ENDPOINTS.some((endpoint) => call.endpoint.includes(endpoint))
      ? `<div class="support-summary"><div class="support-summary-title">Legacy support record</div><p>This captured support call predates RoleplaySupportReviewEnvelope and remains archive-only endpoint evidence.</p></div>`
      : '';
  }

  const rows = deriveRoleplaySupportReviewRows(envelope);
  const reentry = rows.reentry.length > 0
    ? `<div class="support-summary-title">Future prompt re-entry</div><ul>${rows.reentry.map((row) => `<li><strong>${escapeHtml(row.target)}</strong> - ${escapeHtml(row.reason)}; accepted ids: ${escapeHtml(row.acceptedItemIds.join(', ') || 'none')}; persisted targets: ${escapeHtml(row.persistenceTargets.join(', ') || 'none')}</li>`).join('')}</ul>`
    : '<p><strong>Future prompt re-entry:</strong> none.</p>';
  const contextGaps = rows.contextGaps.length > 0
    ? `<div class="support-summary-title">Context gaps</div><ul>${rows.contextGaps.map((row) => `<li>${escapeHtml(row.message)}</li>`).join('')}</ul>`
    : '';

  return `
    <div class="support-summary">
      <div class="support-summary-title">Roleplay support review envelope</div>
      <div class="support-summary-grid">
        ${renderKeyValueRows([
          ['Worker', envelope.worker],
          ['Source message', envelope.sourceMessageId || 'unavailable'],
          ['Source generation', envelope.sourceGenerationId || 'unavailable'],
          ['Readiness', envelope.readiness],
          ['Persistence', envelope.persistence.status],
          ['Future prompt eligible', rows.registry.futurePromptEligible ? 'yes' : 'no'],
          ['Accepted', envelope.accepted.length],
          ['Rejected', envelope.rejected.length],
          ['Omitted', envelope.omitted.length],
          ['Wrapped legacy response', envelope.legacyWrapped ? 'yes' : 'no'],
        ])}
      </div>
      <p><strong>Persistence reason:</strong> ${escapeHtml(envelope.persistence.reason)}</p>
      <p><strong>Future-prompt reason:</strong> ${escapeHtml(envelope.futurePromptImpact.reason)}</p>
      <p><strong>Review scope:</strong> This envelope is stored in Chronicle's browser-local admin debug trace for this playthrough. This implementation does not mirror it to a database or create a broad backend playthrough browser.</p>
      <p><strong>Future backend boundary:</strong> Any later service-role review path must remain narrow, audited, admin-scoped, session-scoped, and explicitly enabled because service-role access can bypass normal row-level security.</p>
      ${renderSupportEnvelopeItems('Accepted outcomes', envelope.accepted)}
      ${renderSupportEnvelopeItems('Rejected outcomes', envelope.rejected)}
      ${renderSupportEnvelopeItems('Omitted outcomes', envelope.omitted)}
      ${reentry}
      ${contextGaps}
    </div>
  `;
}

export function renderSupportCallSummary(call: NonNullable<StoredChatDebugTrace['supportCalls']>[number]): string {
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
    const edgeReviewRows = asArray(response?.characterUpdateReviews).length
      ? asArray(response?.characterUpdateReviews)
      : asArray(response?.candidateReviews).length
        ? asArray(response?.candidateReviews)
        : updates;
    const hasFrontendReviewedRows = Boolean(response) && (
      Object.prototype.hasOwnProperty.call(response, 'acceptedUpdates')
      || Object.prototype.hasOwnProperty.call(response, 'rejectedUpdates')
    );
    const accepted = hasFrontendReviewedRows
      ? asArray(response?.acceptedUpdates)
      : edgeReviewRows.filter((entry) => asRecord(entry)?.accepted === true);
    const rejected = hasFrontendReviewedRows
      ? asArray(response?.rejectedUpdates)
      : edgeReviewRows.filter((entry) => asRecord(entry)?.accepted === false);
    const reviewRows = hasFrontendReviewedRows ? [...accepted, ...rejected] : edgeReviewRows;
    const proposedCandidateCount = edgeReviewRows.length || updates.length;
    const characterEligibilityReviews = asArray(response?.characterEligibilityReviews);
    const reviewedCharacterStateRows = asArray(response?.reviewedCharacterStateRows);
    const missingCharacterStateReviews = asArray(response?.missingCharacterStateReviews);
    const applyStageReviews = asArray(response?.applyStageReviews);
    const persistedUpdates = asArray(response?.persistedUpdates);
    const rejectedAtApplyStage = asArray(response?.rejectedAtApplyStage);
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
            ['Eligibility rows', characterEligibilityReviews.length],
            ['Reviewed character rows', reviewedCharacterStateRows.length],
            ['Physical state review rows', physicalStateReviews.length],
            ['Missing physical state reviews', missingPhysicalStateReviews.length],
            ['Missing reviewed character rows', missingCharacterStateReviews.length],
            ['Apply-stage receipts', applyStageReviews.length],
            ['Persisted apply outcomes', persistedUpdates.length],
            ['Rejected/skipped apply outcomes', rejectedAtApplyStage.length],
          ])}
        </div>
        ${reviewRows.length ? `<ul>${reviewRows.map((entry) => {
          const item = asRecord(entry) || {};
          const character = String(item.characterName || item.character || 'Unknown character');
          const field = String(item.field || 'unknown field');
          const value = item.value == null ? '' : String(item.value);
          const frontendAccepted = item.frontendAccepted === true || item.accepted === true;
          const statusLabel = frontendAccepted
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
        ${characterEligibilityReviews.length ? `<div class="support-summary-title">Deterministic character eligibility</div><ul>${characterEligibilityReviews.map((entry) => {
          const item = asRecord(entry) || {};
          const character = String(item.characterName || 'Unknown character');
          const reasons = asArray(item.reasons).map(String).join(', ') || 'unspecified';
          return `<li><strong>${escapeHtml(character)}</strong> — ${escapeHtml(reasons)}</li>`;
        }).join('')}</ul>` : ''}
        ${missingCharacterStateReviews.length ? `<div class="support-summary-title">Missing reviewed character coverage</div><ul>${missingCharacterStateReviews.map((entry) => {
          const item = asRecord(entry) || {};
          return `<li><strong>${escapeHtml(String(item.characterName || 'Unknown character'))}</strong> — ${escapeHtml(String(item.missingReviewReason || 'missing_physical_state_review'))}</li>`;
        }).join('')}</ul>` : ''}
        ${applyStageReviews.length ? `<div class="support-summary-title">Apply-stage persistence receipts</div><ul>${applyStageReviews.map((entry) => {
          const item = asRecord(entry) || {};
          const character = String(item.characterName || 'Unknown character');
          const field = String(item.field || 'unknown field');
          const outcome = String(item.outcome || 'unknown');
          const value = item.value == null ? '' : ` -> ${escapeHtml(textPreview(String(item.value), 180))}`;
          const target = item.persistenceTargetId ? ` / target ${escapeHtml(String(item.persistenceTargetId))}` : '';
          const lineage = [item.sourceMessageId, item.sourceGenerationId].filter(Boolean).map(String).join(' / ');
          const lineageText = lineage ? ` / source ${escapeHtml(lineage)}` : '';
          const reason = item.reason ? ` — ${escapeHtml(String(item.reason))}` : '';
          return `<li><strong>${escapeHtml(character)}.${escapeHtml(field)}</strong> [${escapeHtml(outcome)}]${value}${target}${lineageText}${reason}</li>`;
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
      ${request.providerStreamError ? `<div class="trace-warning"><strong>Provider stream error</strong>${escapeHtml(request.providerStreamError)}</div>` : ''}
      ${request.responseUsage ? renderDebugJsonBlock('Provider response usage', request.responseUsage) : ''}
      ${request.reasoningSummaries?.length ? renderDebugJsonBlock('Provider reasoning summaries', request.reasoningSummaries) : ''}
      ${renderDebugJsonBlock('Exact request body sent to Grok/xAI', request.requestBody)}
    </div>
  `).join('');
}

function renderRoleplaySourceReceiptEvidence(call: StoredChatDebugTrace['call1Request']): string {
  const receipts = call?.roleplaySourceReceipts || [];
  const duplicateMetrics = call?.roleplayDuplicateSourceMetrics || [];
  const receiptCoverage = call?.roleplaySourceReceiptCoverage || [];
  const providerSectionCoverage = call?.roleplayProviderSectionCoverage || [];
  if (receipts.length === 0) return '';

  const receiptCards = receipts.map((receipt) => `
    <section class="support-call-card">
      <div class="support-call-header">
        <div>
          <strong>${escapeHtml(receipt.surface)}</strong>
          <span>${escapeHtml(receipt.id)}</span>
        </div>
        <em>${escapeHtml(receipt.disposition)}</em>
      </div>
      <div class="trace-meta-grid">
        <span><strong>Authority</strong>${escapeHtml(receipt.authority)}</span>
        <span><strong>Model facing</strong>${receipt.modelFacing ? 'yes' : 'no'}</span>
        <span><strong>Duplicate group</strong>${escapeHtml(receipt.duplicateGroup || 'none')}</span>
        <span><strong>Content length</strong>${receipt.contentLength}</span>
      </div>
      <p>${escapeHtml(receipt.reason)}</p>
      ${receipt.preview ? `<div class="debug-json-block"><div class="debug-json-label">Compact source preview</div><pre>${escapeHtml(receipt.preview)}</pre></div>` : ''}
    </section>
  `).join('');

  return `
    <details class="trace-details">
      <summary>Source Receipt Ledger (${receipts.length})</summary>
      <p>Frontend-authored telemetry describing model-facing and debug-only source ownership. Receipt metadata is not part of the literal Grok/xAI request.</p>
      ${duplicateMetrics.length
        ? renderDebugJsonBlock('Duplicate source groups', duplicateMetrics)
        : '<p>No exact-text duplicate source groups were detected for this request.</p>'}
      ${receiptCoverage.length
        ? renderDebugJsonBlock('Receipt to provider coverage', receiptCoverage)
        : ''}
      ${providerSectionCoverage.length
        ? renderDebugJsonBlock('Provider section to receipt coverage', providerSectionCoverage)
        : ''}
      ${receiptCards}
    </details>
  `;
}

function renderCharacterPromptFactEvidence(call: StoredChatDebugTrace['call1Request']): string {
  const facts = call?.roleplayCharacterPromptFacts || [];
  const summaries = call?.roleplayCharacterPromptFactSummaries || [];
  if (facts.length === 0 && summaries.length === 0) return '';

  return `
    <details class="trace-details">
      <summary>Character Prompt Fact Ledger (${facts.length})</summary>
      <p>Deterministic frontend evidence for character-card source shaping. These rows describe the compiled prompt copy and its source policy; they are not model reasoning and do not modify saved card data.</p>
      ${summaries.length ? renderDebugJsonBlock('Character fact copy-risk metrics', summaries) : ''}
      ${facts.length ? renderDebugJsonBlock('Compiled character prompt facts', facts) : ''}
    </details>
  `;
}

function renderApiCall1Details(segment: ReviewExportParentMessage): string {
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
      ${renderResponseJobSummary(call)}
      ${renderRoleplaySourceReceiptEvidence(call)}
      ${renderCharacterPromptFactEvidence(call)}
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

function renderSupportCallDetails(segment: ReviewExportParentMessage): string {
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
      ${renderSupportReviewEnvelope(call)}
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

function renderAppliedUpdatesDetails(segment: ReviewExportParentMessage): string {
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

function renderStatePruningReportDetails(segment: ReviewExportParentMessage): string {
  if (segment.role !== 'assistant') return '';

  const reports = segment.statePruningReports || [];
  if (reports.length === 0) return '';

  const activeCount = reports.filter((report) => report.included).length;
  const prunedCount = reports.length - activeCount;

  return `
    <details class="trace-details state-pruning-details">
      <summary>State Pruning Report (${activeCount} active / ${prunedCount} pruned)</summary>
      <p>Debug-only source lineage report for generation-derived state. Active rows may be used as current state; pruned rows are excluded from prompt truth and preserved here only for review.</p>
      <ul>${reports.map((report) => `
        <li>
          <strong>${escapeHtml(report.itemType)} · ${escapeHtml(report.itemId)}</strong>
          <span>${escapeHtml(report.included ? 'active' : 'pruned')} / ${escapeHtml(report.reason)}</span>
          <small>${escapeHtml([
            report.sourceMessageId ? `source message ${report.sourceMessageId}` : '',
            report.sourceGenerationId ? `source generation ${report.sourceGenerationId}` : '',
            report.currentGenerationId ? `current generation ${report.currentGenerationId}` : '',
          ].filter(Boolean).join(' · '))}</small>
          ${report.valuePreview ? `<em>${escapeHtml(report.valuePreview)}</em>` : ''}
        </li>
      `).join('')}</ul>
    </details>
  `;
}

function renderRetryAttemptHistory(parent: ReviewExportParentMessage): string {
  if (parent.role !== 'assistant') return '';

  const lineage = parent.retryLineage;
  const attempts = lineage?.attempts || [];
  if (attempts.length === 0) return '';

  const attemptsHtml = attempts.map((attempt) => {
    const call1Label = attempt.debugRecord?.call1Request?.label || null;
    const call1Status = attempt.debugRecord?.call1Request?.status || null;
    const responseJobSummary = renderResponseJobSummary(attempt.debugRecord?.call1Request);
    return `
      <section class="retry-attempt-card">
        <div class="retry-attempt-header">
          <strong>Attempt ${attempt.attemptNumber}</strong>
          <span>${escapeHtml(attempt.generationId)}</span>
        </div>
        <div class="trace-meta-grid">
          ${renderKeyValueRows([
            ['Attempt message', attempt.messageId],
            ['Captured', formatDebugDate(attempt.capturedAt)],
            ['Original created', formatDebugDate(attempt.createdAt)],
            ['Day', attempt.day != null ? `Day ${attempt.day}` : undefined],
            ['Time', formatTimeOfDay(attempt.timeOfDay)],
            ['Trace', call1Label || 'No API Call 1 trace captured'],
            ['Trace status', call1Status],
          ])}
        </div>
        ${responseJobSummary}
        <div class="retry-attempt-text rendered-message">${renderStyledText(attempt.text)}</div>
      </section>
    `;
  }).join('');

  return `
    <details class="trace-details retry-history-details">
      <summary>Retry Attempt History (${attempts.length})</summary>
      <p>Debug-only captured versions that were replaced by Retry before the current visible assistant response. This is not saved story state and is only included to compare what changed between attempts.</p>
      <div class="trace-meta-grid">
        ${renderKeyValueRows([
          ['Parent message', lineage?.parentMessageId],
          ['Final generation', lineage?.finalGenerationId],
          ['Storage scope', lineage?.storageScope],
          ['Live prompt re-entry', lineage?.livePromptReentry ? 'yes' : 'no'],
          ['Child segments', lineage?.childSegmentIds.length || 0],
        ])}
      </div>
      <div class="retry-attempt-list">${attemptsHtml}</div>
    </details>
  `;
}

function renderCountList(entries: Array<{ value: string; count: number }>, emptyText: string): string {
  if (!entries.length) return `<p>${escapeHtml(emptyText)}</p>`;
  return `<ul>${entries.map((entry) => `<li><strong>${escapeHtml(entry.value)}</strong> repeated ${entry.count}x</li>`).join('')}</ul>`;
}

function renderDebugMetricsDetails(parent: ReviewExportParentMessage): string {
  if (parent.role !== 'assistant' || !parent.childMetrics?.length) return '';
  return parent.childMetrics.map(renderDebugMetricsBlock).join('');
}

function renderDebugMetricsBlock(metrics: ReviewSegmentDebugMetrics): string {
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
  const recentHistoryReceipts = metrics.recentHistoryReceipts.length
    ? `<ul>${metrics.recentHistoryReceipts.map((receipt) => {
      const repeatedAnchors = receipt.repeatedAnchors?.length
        ? `; repeated anchors: ${receipt.repeatedAnchors.join(', ')}`
        : '';
      const transformedSummary = receipt.transformedContent
        ? `; transformed summary: ${receipt.transformedContent}`
        : '';
      const sourceAuthority = receipt.sourceAuthorityDecisionCount != null
        ? `; source-authority decisions: ${receipt.sourceAuthorityDecisionCount}; authority classes: ${receipt.sourceAuthorityClasses?.join(', ') || 'none'}`
        : '';
      const finalUserLane = receipt.alsoRenderedInFinalUserLane
        ? `; final-user lane: ${receipt.alsoRenderedInFinalUserLane}`
        : '';
      const generation = receipt.generationId
        ? `; generation: ${receipt.generationId}`
        : '';
      const sourceGeneration = receipt.sourceGenerationId
        ? `; response-job generation: ${receipt.sourceGenerationId}; generation match: ${receipt.generationMatchesResponseJobSource === true ? 'yes' : 'no'}`
        : '';
      return `<li><strong>${escapeHtml(receipt.messageId)}</strong> ${escapeHtml(receipt.role)}; ${escapeHtml(receipt.treatment)}; ${receipt.includedInProviderHistory ? 'included in provider history' : 'excluded from provider history'}; source lane: ${escapeHtml(receipt.responseJobSource)}; reason: ${escapeHtml(receipt.reason)}${escapeHtml(generation)}${escapeHtml(sourceGeneration)}${escapeHtml(finalUserLane)}${escapeHtml(repeatedAnchors)}${escapeHtml(sourceAuthority)}${escapeHtml(transformedSummary)}</li>`;
    }).join('')}</ul>`
    : '<p>No recent-history treatment receipt was captured for this response.</p>';
  const suppressedStyleAnchors = metrics.suppressedStyleAnchors.length
    ? `<ul>${metrics.suppressedStyleAnchors.map((entry) => (
      `<li><strong>${escapeHtml(entry.messageId)}</strong> ${escapeHtml(entry.repeatedAnchors.join(', '))}</li>`
    )).join('')}</ul>`
    : '<p>No older assistant style anchors were suppressed.</p>';
  const authorityDecisions = metrics.userStateAuthorityDecisions.length
    ? `<ul>${metrics.userStateAuthorityDecisions.map((decision) => {
      const source = [
        decision.sourceMessageId ? `message ${decision.sourceMessageId}` : 'message unavailable',
        decision.sourceGenerationId ? `generation ${decision.sourceGenerationId}` : '',
      ].filter(Boolean).join('; ');
      return `<li><strong>${escapeHtml(decision.claim)}</strong> — claim type: ${escapeHtml(decision.claimType)}; source role: ${escapeHtml(decision.sourceRole)}; ${escapeHtml(source)}; authority: ${escapeHtml(decision.authority)}; action: ${escapeHtml(decision.modelFacingAction)}; reason: ${escapeHtml(decision.reason)}</li>`;
    }).join('')}</ul>`
    : '<p>No user-state source-authority decisions were captured for this response.</p>';

  return `
    <details class="trace-details metrics-details">
      <summary>Deterministic Debug Metrics - ${escapeHtml(metrics.speakerName)}</summary>
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
        <div class="support-summary-title">User-state source authority</div>
        <p>These rows report structured runtime decisions already captured with the request. They do not infer intent from exported prose and do not change the visible response.</p>
        <div class="support-summary-grid">
          ${renderKeyValueRows([
            ['Total decisions', metrics.userStateAuthoritySummary.total],
            ['Accepted facts or observations', metrics.userStateAuthoritySummary.selected],
            ['Downgraded interpretations', metrics.userStateAuthoritySummary.downgraded],
            ['Rejected or debug-only', metrics.userStateAuthoritySummary.rejected],
          ])}
        </div>
        ${authorityDecisions}
      </div>
      <div class="support-summary">
        <div class="support-summary-title">Source overlap hints</div>
        <p>Local term overlap only, checked against the current exported app/story state and recent transcript text. This does not prove why the model wrote something or guarantee that every source bucket was present in this exact historical request.</p>
        ${sourceOverlap}
        <div class="support-summary-title">Recent-history treatment receipts</div>
        <p>Captured runtime treatment evidence. These rows show what was included, kept in a mode-specific lane, or suppressed; they are not model reasoning and they are not sent as another prompt instruction.</p>
        ${recentHistoryReceipts}
        <div class="support-summary-title">Suppressed assistant style anchors</div>
        ${suppressedStyleAnchors}
        <div class="support-summary-title">Character prompt fact copy-risk metrics</div>
        <p>Request-time summaries report transformed/debug-only fact counts, duplicate source values, repeated rendered values, and legacy raw headings. Output-copy metrics separately report exact raw card phrases or creator-authored labels found in this assistant block. Legitimate compact use of a fact is not treated as a failure.</p>
        <p><strong>Output-copy fact source:</strong> ${escapeHtml(metrics.characterPromptOutputFactSource)}${metrics.characterPromptOutputFactSource === 'current_card_fallback' ? ' (legacy trace fallback; later card edits may not match generation-time data)' : ''}</p>
        ${metrics.characterPromptFactSummaries.length
          ? renderDebugJsonBlock('Character prompt fact summaries', metrics.characterPromptFactSummaries)
          : '<p>No character prompt fact summary was captured for this response.</p>'}
        ${metrics.characterPromptOutputCopyMetrics.length
          ? renderDebugJsonBlock('Assistant output card-copy matches', metrics.characterPromptOutputCopyMetrics)
          : '<p>No exact raw card phrase or creator-label copy was detected in this assistant block.</p>'}
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

function parserLabelCount(value: string) {
  return value.match(/(?:^|\n)\s*[A-Za-z][A-Za-z0-9 _'-]{0,40}:/g)?.length ?? 0;
}

function buildMessageGroups(input: ChatReviewExportInput): ReviewExportParentMessage[] {
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
  const parents: ReviewExportParentMessage[] = [];
  let visibleTurn = 0;

  for (const message of input.conversation.messages) {
    if (message.role === 'system') continue;
    visibleTurn += 1;

    const rawMessageText = message.role === 'assistant'
      ? input.sanitizeAssistantText(message.text)
      : message.text;
    const parsedSegments = parseMessageSegments(rawMessageText);
    const userCharacter = input.appData.characters.find((character) => character.controlledBy === 'User') || null;
    const mergedSegments = mergeByRenderedSpeaker(
      parsedSegments,
      message.role === 'assistant',
      input.appData,
      userCharacter,
      (speakerName) => resolveCanonicalExportSpeakerName(characters, speakerName),
    );
    const messageSegments = mergedSegments.length > 0
      ? mergedSegments
      : [{ speakerName: null, content: rawMessageText }];
    const liveComment = input.messageComments?.[message.id];
    const postTurnStateChanges = input.postTurnStateChanges?.[message.id] || [];
    const generationId = message.generationId || message.id;
    const debugRecord = input.debugRecords?.[debugTraceKey(message.id, generationId)] || null;
    const statePruningReports = input.statePruningReports?.[debugTraceKey(message.id, generationId)]
      || input.statePruningReports?.[message.id]
      || [];

    let inferredSpeakerCount = 0;
    let fallbackSpeakerCount = 0;
    const childSegments = messageSegments.map((segment, segmentIndex): ReviewExportSegment => {
      const speaker = resolveSpeaker(segment, message.role, characters);
      const fallbackSpeaker = message.role === 'assistant' ? 'AI' : 'User';
      if (!segment.speakerName && speaker) inferredSpeakerCount += 1;
      if (!speaker && !segment.speakerName) fallbackSpeakerCount += 1;
      return {
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
      };
    });

    const splitOrigins = new Set<ReviewExportParserOrigin>();
    if (parserLabelCount(rawMessageText) > 0) splitOrigins.add('raw_speaker_label');
    if (/\n\s*\n/.test(rawMessageText)) splitOrigins.add('paragraph_split');
    if (inferredSpeakerCount > 0) splitOrigins.add('inferred_speaker');
    if (fallbackSpeakerCount > 0) splitOrigins.add('fallback');

    parents.push({
      reviewId: message.id,
      messageId: message.id,
      generationId,
      turnNumber: visibleTurn,
      role: message.role,
      rawMessageText,
      childSegments,
      parserDiagnostics: {
        rawSpeakerLabelCount: parserLabelCount(rawMessageText),
        parsedSegmentCount: parsedSegments.length,
        renderedChildCount: childSegments.length,
        mergeCount: Math.max(0, parsedSegments.length - childSegments.length),
        inferredSpeakerCount,
        fallbackSpeakerCount,
        splitOrigins: [...splitOrigins],
      },
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
      statePruningReports,
      debugRecord,
      retryLineage: buildChatReviewRetryLineage({
        history: input.retryAttemptHistory || {},
        parentMessageId: message.id,
        finalGenerationId: generationId,
        childSegmentIds: childSegments.map((segment) => segment.reviewId),
      }),
    });
  }

  return parents;
}

function renderChildSegmentCard(parent: ReviewExportParentMessage, segment: ReviewExportSegment): string {
  const turnLabel = segment.segmentNumber === 1
    ? `Turn ${parent.turnNumber}`
    : `Turn ${parent.turnNumber}.${segment.segmentNumber}`;

  return `
    <article id="review-${escapeAttribute(segment.reviewId)}" class="message-child-card" data-review-id="${escapeAttribute(segment.reviewId)}" data-message-id="${escapeAttribute(parent.messageId)}" data-generation-id="${escapeAttribute(parent.generationId)}" data-segment-number="${segment.segmentNumber}" data-speaker="${escapeAttribute(segment.speakerName)}">
      <div class="message-main">
        <div class="avatar">${avatarHtml(segment)}</div>
        <div class="message-content">
          <header class="message-header">
            <div>
              <span class="turn-label">${turnLabel} ${escapeHtml(segment.speakerName)}</span>
              <h2>${escapeHtml(segment.speakerName)}</h2>
              <p>${escapeHtml(segment.speakerControl)}${segment.speakerRole ? ` / ${escapeHtml(segment.speakerRole)}` : ''}</p>
            </div>
          </header>
          <div class="rendered-message">${renderStyledText(segment.text)}</div>
        </div>
      </div>
    </article>
  `;
}

function renderParserDiagnostics(parent: ReviewExportParentMessage): string {
  const diagnostics = parent.parserDiagnostics;
  return `
    <details class="trace-details parser-diagnostics-details">
      <summary>Parser Diagnostics</summary>
      <p>Export-side parsing facts only. Child cards are review renderings of one saved message, not separate model responses.</p>
      <div class="trace-meta-grid">
        ${renderKeyValueRows([
          ['Raw speaker labels', diagnostics.rawSpeakerLabelCount],
          ['Parsed segments', diagnostics.parsedSegmentCount],
          ['Rendered child cards', diagnostics.renderedChildCount],
          ['Merged segments', diagnostics.mergeCount],
          ['Inferred speakers', diagnostics.inferredSpeakerCount],
          ['Fallback speakers', diagnostics.fallbackSpeakerCount],
          ['Origins', diagnostics.splitOrigins.join(', ') || 'none'],
        ])}
      </div>
    </details>
  `;
}

function renderParentMessageCard(parent: ReviewExportParentMessage, index: number): string {
  const classes = [
    'message-parent-card',
    'message-card',
    parent.role === 'user' ? 'user-card' : 'assistant-card',
    parent.isRegenerated ? 'is-regenerated' : '',
    parent.isContinueTarget ? 'is-continue' : '',
  ].filter(Boolean).join(' ');

  const selectedTags = uniqueIssueTags(parent.liveComment?.tags);
  const liveCommentTags = selectedTags.length
    ? `<div class="comment-tag-row">${selectedTags.map((tag) => `<span class="comment-tag">${escapeHtml(tag)}</span>`).join('')}</div>`
    : '';
  const liveCommentBlock = parent.liveComment?.note || selectedTags.length
    ? `<section class="live-comment"><div>Live tester note</div>${liveCommentTags}${parent.liveComment?.note ? `<p>${escapeHtml(parent.liveComment.note)}</p>` : '<p>No written note. Tags only.</p>'}</section>`
    : '';
  const imageBlock = parent.imageUrl
    ? `<img class="scene-image" src="${escapeAttribute(parent.imageUrl)}" alt="Generated scene image" loading="lazy" />`
    : '';
  const traceBlocks = parent.role === 'assistant'
    ? `<div class="trace-stack">${renderRetryAttemptHistory(parent)}${renderDebugMetricsDetails(parent)}${renderApiCall1Details(parent)}${renderSupportCallDetails(parent)}${renderStatePruningReportDetails(parent)}${renderAppliedUpdatesDetails(parent)}</div>`
    : '';
  const childCards = parent.childSegments.map((segment) => renderChildSegmentCard(parent, segment)).join('');

  return `
    <article id="review-${escapeAttribute(parent.reviewId)}" class="${classes}" data-review-index="${index}" data-review-id="${escapeAttribute(parent.reviewId)}" data-parent-message-id="${escapeAttribute(parent.messageId)}" data-generation-id="${escapeAttribute(parent.generationId)}" data-turn="${parent.turnNumber}" data-role="${escapeAttribute(parent.role)}" data-child-count="${parent.childSegments.length}" data-has-live-comment="${parent.liveComment ? 'true' : 'false'}" data-live-comment-note="${escapeAttribute(parent.liveComment?.note || '')}" data-live-comment-tags="${escapeAttribute(selectedTags.join(', '))}" data-excerpt="${escapeAttribute(textPreview(parent.rawMessageText, 260))}">
      <header class="parent-message-header">
        <div>
          <span class="turn-label">Turn ${parent.turnNumber} · Saved ${escapeHtml(parent.role)} message</span>
          <h2>${parent.childSegments.length} rendered ${parent.childSegments.length === 1 ? 'child' : 'children'}</h2>
          <p>message ${escapeHtml(parent.messageId)} · generation ${escapeHtml(parent.generationId)}</p>
        </div>
        <div class="message-meta">
          <span>${parent.day != null ? `Day ${parent.day}` : 'Day ?'}</span>
          <span>${escapeHtml(formatTimeOfDay(parent.timeOfDay))}</span>
          ${parent.isRegenerated ? '<span class="event-pill">Regenerated</span>' : ''}
          ${parent.isContinueTarget ? '<span class="event-pill">Continue</span>' : ''}
        </div>
      </header>
      <div class="message-child-list">${childCards}</div>
      ${liveCommentBlock}
      ${imageBlock}
      ${renderParserDiagnostics(parent)}
      ${traceBlocks}
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
  parents: ReviewExportParentMessage[],
): string {
  const commentEntries = Object.values(comments || {})
    .filter((comment) => comment.note.trim() || uniqueIssueTags(comment.tags).length > 0)
    .sort((left, right) => left.updatedAt - right.updatedAt);

  if (commentEntries.length === 0) return '';

  return `
    <section class="live-comment-index" data-live-comment-count="${commentEntries.length}">
      <div class="issue-summary-header">
        <div class="eyebrow">Tester notes quick links</div>
        <p>Compact navigation for saved tester notes. Full note text appears inline on the first message card it belongs to.</p>
      </div>
      <div class="live-comment-index-list">
        ${commentEntries.map((comment, index) => {
    const matchingParent = parents.find((parent) => (
      parent.messageId === comment.messageId
      && (!comment.generationId || parent.generationId === comment.generationId)
    ));
    const selectedTags = uniqueIssueTags(comment.tags);
    const links = matchingParent
      ? `<a href="#review-${escapeAttribute(matchingParent.reviewId)}">Turn ${matchingParent.turnNumber} parent message</a>`
      : '<span>No rendered message card matched this saved note.</span>';

    return `
          <article class="live-comment-index-card" data-live-comment-index="${index}" data-message-id="${escapeAttribute(comment.messageId)}" data-generation-id="${escapeAttribute(comment.generationId || comment.messageId)}">
            <div class="comment-index-meta">
              <strong>Note ${index + 1}</strong>
              <span>message ${escapeHtml(comment.messageId)} · generation ${escapeHtml(comment.generationId || comment.messageId)}</span>
            </div>
            ${selectedTags.length ? `<div class="comment-tag-row">${selectedTags.map((tag) => `<span class="comment-tag">${escapeHtml(tag)}</span>`).join('')}</div>` : ''}
            ${comment.note ? `<p>${escapeHtml(textPreview(comment.note, 180))}</p>` : '<p>No written note. Tags only.</p>'}
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
    .parent-message-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 14px;
      padding: 18px;
      border-bottom: 1px solid var(--line);
      background: rgba(255,255,255,0.035);
    }
    .parent-message-header h2 { margin: 2px 0 0; }
    .parent-message-header p { margin: 2px 0 0; color: var(--muted); font-size: 12px; }
    .message-child-list { display: grid; gap: 12px; padding: 16px; }
    .message-child-card {
      border: 1px solid var(--line);
      border-radius: 18px;
      background: rgba(255,255,255,0.035);
      overflow: hidden;
    }
    .message-parent-card > .live-comment,
    .message-parent-card > .scene-image,
    .message-parent-card > .trace-details,
    .message-parent-card > .trace-stack { margin: 0 16px 16px; }
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
    .trace-warning {
      color: #ffd7a3;
      background: rgba(255, 168, 88, 0.12);
      border: 1px solid rgba(255, 168, 88, 0.24);
      border-radius: 10px;
      padding: 10px 12px;
      margin: 10px 0;
      font-size: 12px;
    }
    .trace-warning strong {
      display: block;
      color: #ffbf7b;
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: .08em;
      font-size: 10px;
    }
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
    .retry-history-details {
      border-color: rgba(120,220,202,0.24);
      background: rgba(120,220,202,0.055);
    }
    .retry-history-details summary { color: var(--accent); }
    .retry-attempt-list {
      display: grid;
      gap: 12px;
      padding: 0 12px 12px;
    }
    .retry-attempt-card {
      border: 1px solid rgba(120,220,202,0.18);
      border-radius: 14px;
      background: rgba(0,0,0,0.16);
      padding: 12px;
    }
    .retry-attempt-header {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 10px;
    }
    .retry-attempt-header strong { color: var(--text); }
    .retry-attempt-header span {
      color: var(--muted);
      font-size: 12px;
      overflow-wrap: anywhere;
    }
    .retry-attempt-card .trace-meta-grid { padding: 0 0 10px; }
    .retry-attempt-text {
      border-top: 1px solid rgba(255,255,255,0.08);
      padding-top: 10px;
      font-size: 15px;
      line-height: 1.65;
    }
     .state-change-details ul { margin: 0; padding: 0 18px 14px 34px; color: #d8e2f2; }
     .state-change-details li { margin: 7px 0; }
     .state-pruning-details ul { margin: 0; padding: 0 18px 14px 34px; color: #d8e2f2; }
     .state-pruning-details li { margin: 9px 0; }
     .state-pruning-details li span,
     .state-pruning-details li small,
     .state-pruning-details li em {
       display: block;
       color: var(--muted);
       font-size: 12px;
       margin-top: 2px;
       overflow-wrap: anywhere;
     }
     .state-pruning-details li em { color: #d8e2f2; font-style: normal; }
     .footer-note { color: var(--muted); text-align: center; margin-top: 26px; }
    @media (max-width: 720px) {
      .message-main { grid-template-columns: 1fr; }
      .message-header { display: block; }
      .parent-message-header { display: block; }
      .message-meta { justify-content: flex-start; margin-top: 10px; }
    }
  `;
}

export function buildChatReviewHtml(input: ChatReviewExportInput): string {
  const characters = getCharacters(input.appData);
  const parentMessages = buildMessageGroups(input);
  const debugMetrics = buildReviewDebugMetrics({
    appData: input.appData,
    conversation: input.conversation,
    segments: parentMessages.flatMap((parent) => parent.childSegments.map((segment, childIndex) => ({
      reviewId: segment.reviewId,
      messageId: parent.messageId,
      generationId: parent.generationId,
      turnNumber: parent.turnNumber,
      segmentNumber: segment.segmentNumber,
      role: parent.role,
      speakerName: segment.speakerName,
      text: segment.text,
      rawMessageText: parent.rawMessageText,
      localNotice: parent.localNotice ?? null,
      recentHistoryPacket: childIndex === 0
        ? readRecentHistoryPacket(parent.debugRecord?.call1Request?.requestBody)
        : null,
      userStateAuthorityDecisions: childIndex === 0
        ? parent.debugRecord?.call1Request?.roleplayUserStateAuthorityDecisions ?? []
        : [],
      characterPromptFacts: parent.debugRecord?.call1Request?.roleplayCharacterPromptFacts,
      characterPromptFactSummaries: childIndex === 0
        ? parent.debugRecord?.call1Request?.roleplayCharacterPromptFactSummaries ?? []
        : [],
    }))),
  });
  const metricsByReviewId = new Map(debugMetrics.segments.map((metrics) => [metrics.reviewId, metrics]));
  const parentsWithMetrics = parentMessages.map((parent) => ({
    ...parent,
    childMetrics: parent.childSegments
      .map((segment) => metricsByReviewId.get(segment.reviewId))
      .filter((metrics): metrics is ReviewSegmentDebugMetrics => metrics != null),
  }));
  const exportedAt = formatExportDate(input.exportedAt);
  const cards = parentsWithMetrics.map((parent, index) => renderParentMessageCard(parent, index)).join('\n');
  const issueSummary = renderIssueSummary(input.messageComments);
  const transcriptMetricsSummary = renderTranscriptMetricsSummary(debugMetrics);
  const liveCommentIndex = renderLiveCommentIndex(input.messageComments, parentsWithMetrics);
  const liveComments = Object.values(input.messageComments || {}).map((comment) => ({
    messageId: comment.messageId,
    generationId: comment.generationId || comment.messageId,
    note: comment.note,
    tags: uniqueIssueTags(comment.tags),
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    renderedSegments: parentsWithMetrics
      .filter((parent) => (
        parent.messageId === comment.messageId
        && (!comment.generationId || parent.generationId === comment.generationId)
      ))
      .flatMap((parent) => parent.childSegments.map((segment) => ({
        reviewId: segment.reviewId,
        parentReviewId: parent.reviewId,
        turnNumber: parent.turnNumber,
        segmentNumber: segment.segmentNumber,
        speakerName: segment.speakerName,
      }))),
  }));
  const embeddedDebugData = {
    schema: 'chronicle-session-review-v2',
    retryLineageSchema: 'chronicle-session-retry-lineage-v1',
    exportedAt,
    scenarioTitle: input.scenarioTitle,
    conversationId: input.conversation.id,
    liveComments,
    parentMessages: parentsWithMetrics.map((parent) => ({
      reviewId: parent.reviewId,
      messageId: parent.messageId,
      generationId: parent.generationId,
      role: parent.role,
      turnNumber: parent.turnNumber,
      parserDiagnostics: parent.parserDiagnostics,
      childSegments: parent.childSegments.map((segment) => ({
        reviewId: segment.reviewId,
        segmentNumber: segment.segmentNumber,
        speakerName: segment.speakerName,
        text: segment.text,
      })),
      liveComment: parent.liveComment || null,
      retryLineage: parent.retryLineage,
      debugRecord: parent.debugRecord,
      postTurnStateChanges: parent.postTurnStateChanges,
      statePruningReports: parent.statePruningReports,
      parentMetrics: parent.childMetrics || [],
    })),
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
      statePruningReports: input.statePruningReports?.[debugTraceKey(message.id, message.generationId || message.id)]
        || input.statePruningReports?.[message.id]
        || [],
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
      <p>Styled transcript export with avatars, message-level speaker cards, generated images, Continue/Regenerate markers, and any live dialogue debug notes saved while testing.</p>
      <div class="meta-grid">
        <div class="meta-card"><strong>${escapeHtml(input.conversation.title || 'Untitled conversation')}</strong><span>Conversation</span></div>
        <div class="meta-card"><strong>${escapeHtml(input.modelId)}</strong><span>Model</span></div>
        <div class="meta-card"><strong>${parentsWithMetrics.length}</strong><span>Saved parent messages</span></div>
        <div class="meta-card"><strong>${parentsWithMetrics.reduce((sum, parent) => sum + parent.childSegments.length, 0)}</strong><span>Rendered child cards</span></div>
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
