import type { ChatDebugRequestRecord } from './types';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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

function compactLanePreview(value: unknown, maxLength = 220): string {
  const compact = typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
  if (!compact) return '';
  if (compact.length <= maxLength) return compact;
  return `${compact.slice(0, maxLength - 1).trim()}…`;
}

function responseJobFromCall(call: Pick<ChatDebugRequestRecord, 'requestBody'> | null | undefined): Record<string, unknown> | null {
  const requestBody = asRecord(call?.requestBody);
  return asRecord(requestBody?.responseJob);
}

export function renderResponseJobSummary(
  call: Pick<ChatDebugRequestRecord, 'requestBody'> | null | undefined,
): string {
  const responseJob = responseJobFromCall(call);
  if (!responseJob) return '';

  const modeData = asRecord(responseJob.modeData);
  const historyPolicy = asRecord(responseJob.historyPolicy);
  const lanes = asArray(responseJob.finalUserLanes)
    .map((lane) => asRecord(lane))
    .filter((lane): lane is Record<string, unknown> => Boolean(lane));
  const modelFacingCount = lanes.filter((lane) => lane.modelFacing === true).length;
  const laneRows = lanes.length
    ? `<ul>${lanes.map((lane) => {
      const kind = String(lane.kind || 'unknown_lane');
      const sourceRole = String(lane.sourceRole || 'unknown_source');
      const authority = String(lane.authority || 'unknown_authority');
      const facing = lane.modelFacing === true ? 'model-facing' : 'debug-only';
      const contentPreview = compactLanePreview(lane.content);
      return `<li><strong>${escapeHtml(`${kind} / ${sourceRole} / ${authority} / ${facing}`)}</strong>${contentPreview ? `<span>${escapeHtml(contentPreview)}</span>` : ''}</li>`;
    }).join('')}</ul>`
    : '<p>No final-user lanes were recorded on this response job.</p>';

  const modeRows: Array<[string, unknown]> = [];
  if (modeData?.kind === 'retry_regenerate') {
    modeRows.push(
      ['Rejected attempt message', modeData.rejectedMessageId],
      ['Rejected attempt summary', modeData.rejectedAttemptSummary],
      ['Required difference', modeData.requiredDifference],
      ['Preserve rule', modeData.preserveRule],
    );
  } else if (modeData?.kind === 'continue_assistant_tail') {
    modeRows.push(
      ['Continue anchor message', modeData.assistantMessageId],
      ['Continue anchor generation', modeData.assistantGenerationId],
      ['Prior user boundary message', modeData.priorUserMessageId],
    );
  } else if (modeData?.kind === 'normal_send') {
    modeRows.push(
      ['Normal send variant', modeData.variant || 'standard'],
      ['Deleted assistant message', modeData.deletedAssistantMessageId],
      ['Deleted assistant generation', modeData.deletedAssistantGenerationId],
      ['Creates new user message', modeData.createsNewUserMessage],
      ['Tail action reason', modeData.tailActionReason],
    );
  }

  return `
    <div class="support-summary response-job-summary">
      <div class="support-summary-title">Response Job Summary</div>
      <div class="support-summary-grid">
        ${renderKeyValueRows([
          ['Mode', responseJob.mode],
          ['Purpose', responseJob.purpose],
          ['History treatment', historyPolicy?.strategy],
          ['Response detail', responseJob.responseDetail],
          ['Final-user lanes', lanes.length],
          ['Model-facing lanes', modelFacingCount],
        ])}
      </div>
      ${modeRows.length ? `<div class="support-summary-grid">${renderKeyValueRows(modeRows)}</div>` : ''}
      <div class="support-summary-title">Final-user lane inventory</div>
      ${laneRows}
    </div>
  `;
}
