import type { RoleplayRecentHistoryPacket } from './roleplay-recent-history';
import type { RoleplayFinalUserLane } from './roleplay-response-job';

export const ROLEPLAY_SOURCE_SURFACES = [
  'roleplay_core',
  'story_world',
  'content_theme',
  'main_character_cards',
  'side_character_cards',
  'user_character_cards',
  'goals',
  'memory',
  'current_state',
  'active_scene',
  'temporal_context',
  'dialog_rules',
  'ui_settings',
  'response_detail',
  'recent_user_history',
  'recent_assistant_history',
  'mode_control',
  'execution_brief',
  'final_user_lane',
  'player_turn',
  'debug_roleplay_context',
] as const;

export type RoleplaySourceSurface = (typeof ROLEPLAY_SOURCE_SURFACES)[number];

export type RoleplaySourceAuthority =
  | 'highest'
  | 'high'
  | 'medium'
  | 'low'
  | 'contrast_only'
  | 'debug_only';

export type RoleplaySourceDisposition =
  | 'included'
  | 'compacted'
  | 'downgraded'
  | 'suppressed'
  | 'debug_only';

export type RoleplaySourceReceipt = {
  id: string;
  surface: RoleplaySourceSurface;
  sourceId?: string;
  textHash: string;
  authority: RoleplaySourceAuthority;
  modelFacing: boolean;
  disposition: RoleplaySourceDisposition;
  duplicateGroup?: string;
  reason: string;
  contentLength: number;
  preview: string;
};

export type RoleplayDuplicateSourceMetric = {
  duplicateGroup: string;
  receiptIds: string[];
  surfaces: RoleplaySourceSurface[];
  authorities: RoleplaySourceAuthority[];
  dispositions: RoleplaySourceDisposition[];
  modelFacingCount: number;
  totalCount: number;
};

export type RoleplaySourceReceiptCoverage = {
  receiptId: string;
  surface: RoleplaySourceSurface;
  status: 'covered' | 'missing_provider_text' | 'not_applicable';
  providerMessageIndexes: number[];
  reason: string;
};

export type RoleplayProviderSectionCoverage = {
  providerSectionId: string;
  expectedSurface: RoleplaySourceSurface;
  status: 'covered' | 'missing_source_receipt';
  receiptIds: string[];
};

export type BuildRoleplaySourceReceiptsInput = {
  systemInstruction: string;
  finalUserLanes: RoleplayFinalUserLane[];
  recentHistoryPacket: RoleplayRecentHistoryPacket;
  executionBrief: string;
  roleplayContext?: unknown;
};

type CreateRoleplaySourceReceiptInput = Omit<
  RoleplaySourceReceipt,
  'id' | 'textHash' | 'contentLength' | 'preview' | 'duplicateGroup'
> & {
  content: string;
  duplicateGroup?: string;
};

const SYSTEM_SECTION_SURFACES: Record<string, RoleplaySourceSurface> = {
  'SECTION 1': 'roleplay_core',
  'SECTION 2': 'story_world',
  'SECTION 3': 'main_character_cards',
  'SECTION 4': 'side_character_cards',
  'SECTION 5': 'user_character_cards',
  'SECTION 6': 'current_state',
  'SECTION 7': 'dialog_rules',
  'SECTION 8': 'ui_settings',
};

const SECTION_6_SURFACES: Record<string, RoleplaySourceSurface> = {
  'STORY MEMORIES': 'memory',
  'CURRENT PHYSICAL SCENE STATE': 'current_state',
  'ACTIVE SCENE CONTEXT': 'active_scene',
  'CURRENT TEMPORAL CONTEXT': 'temporal_context',
};

function normalizeReceiptText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function previewReceiptText(value: string, maxLength = 180): string {
  const compact = normalizeReceiptText(value);
  if (compact.length <= maxLength) return compact;
  return `${compact.slice(0, maxLength - 3)}...`;
}

export function hashRoleplaySourceText(value: string): string {
  const normalized = normalizeReceiptText(value);
  let hash = 0x811c9dc5;

  for (let index = 0; index < normalized.length; index += 1) {
    hash ^= normalized.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

export function createRoleplaySourceReceipt(
  input: CreateRoleplaySourceReceiptInput,
): RoleplaySourceReceipt {
  const normalized = normalizeReceiptText(input.content);
  const textHash = hashRoleplaySourceText(normalized);
  const sourceKey = input.sourceId || input.surface;

  return {
    id: `${input.surface}:${sourceKey}:${textHash}`,
    surface: input.surface,
    sourceId: input.sourceId,
    textHash,
    authority: input.authority,
    modelFacing: input.modelFacing,
    disposition: input.disposition,
    duplicateGroup: input.duplicateGroup || (normalized ? `exact:${textHash}` : undefined),
    reason: input.reason,
    contentLength: normalized.length,
    preview: previewReceiptText(normalized),
  };
}

function section2SupplementalReceiptInputs(content: string): CreateRoleplaySourceReceiptInput[] {
  const inputs: CreateRoleplaySourceReceiptInput[] = [];
  const goalsMatch = content.match(/(?:^|\n\n)(MAIN STORY GOALS\n[\s\S]*?)(?=\n\n--- [A-Z][A-Z ]+ ---|$)/);
  if (goalsMatch?.[1]) {
    inputs.push({
      surface: 'goals',
      sourceId: 'main-story-goals',
      content: goalsMatch[1].trim(),
      authority: 'medium',
      modelFacing: true,
      disposition: 'included',
      reason: 'rendered_story_goal_block',
    });
  }

  const themesMatch = content.match(/(?:^|\n\n)(--- STORY THEMES ---\n[\s\S]*?)$/);
  if (themesMatch?.[1]) {
    inputs.push({
      surface: 'content_theme',
      sourceId: 'story-themes',
      content: themesMatch[1].trim(),
      authority: 'medium',
      modelFacing: true,
      disposition: 'included',
      reason: 'rendered_content_theme_block',
    });
  }

  return inputs;
}

function systemSectionReceiptInputs(systemInstruction: string): CreateRoleplaySourceReceiptInput[] {
  const sectionPattern = /--- (SECTION \d+) - ([^-]+?) ---\n\n([\s\S]*?)(?=\n--- SECTION \d+ -|$)/g;
  const inputs: CreateRoleplaySourceReceiptInput[] = [];
  let match: RegExpExecArray | null;

  while ((match = sectionPattern.exec(systemInstruction)) !== null) {
    const sectionId = match[1];
    const heading = match[2].trim();
    const content = match[3].trim();
    const surface = SYSTEM_SECTION_SURFACES[sectionId] || 'roleplay_core';

    if (sectionId === 'SECTION 6') {
      const nestedPattern = /--- (STORY MEMORIES|CURRENT PHYSICAL SCENE STATE|ACTIVE SCENE CONTEXT|CURRENT TEMPORAL CONTEXT) ---\n\n([\s\S]*?)(?=\n--- (?:STORY MEMORIES|CURRENT PHYSICAL SCENE STATE|ACTIVE SCENE CONTEXT|CURRENT TEMPORAL CONTEXT) ---|$)/g;
      let nestedMatch: RegExpExecArray | null;
      let nestedCount = 0;

      while ((nestedMatch = nestedPattern.exec(content)) !== null) {
        const nestedHeading = nestedMatch[1];
        const nestedContent = nestedMatch[2].trim();
        inputs.push({
          surface: SECTION_6_SURFACES[nestedHeading],
          sourceId: nestedHeading.toLowerCase().replace(/\s+/g, '-'),
          content: `--- ${nestedHeading} ---\n\n${nestedContent}`,
          authority: 'high',
          modelFacing: true,
          disposition: 'included',
          reason: 'rendered_current_context_subsection',
        });
        nestedCount += 1;
      }

      if (nestedCount > 0) continue;
    }

    inputs.push({
      surface,
      sourceId: sectionId.toLowerCase().replace(/\s+/g, '-'),
      content: `--- ${sectionId} - ${heading} ---\n\n${content}`,
      authority: surface === 'roleplay_core' || surface === 'dialog_rules' ? 'high' : 'medium',
      modelFacing: true,
      disposition: 'included',
      reason: 'rendered_system_instruction_section',
    });

    if (sectionId === 'SECTION 2') {
      inputs.push(...section2SupplementalReceiptInputs(content));
    }
  }

  return inputs;
}

function systemSectionReceipts(systemInstruction: string): RoleplaySourceReceipt[] {
  return systemSectionReceiptInputs(systemInstruction).map(createRoleplaySourceReceipt);
}

function laneSurface(lane: RoleplayFinalUserLane): RoleplaySourceSurface {
  if (lane.kind === 'player_turn') return 'player_turn';
  if (lane.kind === 'current_state') return 'current_state';
  if (lane.kind === 'response_detail') return 'response_detail';
  if (lane.kind === 'retry_rejection' || lane.kind === 'continue_anchor') return 'mode_control';
  return 'final_user_lane';
}

function laneAuthority(lane: RoleplayFinalUserLane): RoleplaySourceAuthority {
  if (!lane.modelFacing || lane.authority === 'debug_only') return 'debug_only';
  if (lane.authority === 'player_turn') return 'highest';
  if (lane.kind === 'retry_rejection') return 'contrast_only';
  if (lane.authority === 'state') return 'high';
  return 'medium';
}

function finalUserLaneReceipts(lanes: RoleplayFinalUserLane[]): RoleplaySourceReceipt[] {
  return lanes.map((lane) => createRoleplaySourceReceipt({
    surface: laneSurface(lane),
    sourceId: lane.id,
    content: lane.content,
    authority: laneAuthority(lane),
    modelFacing: lane.modelFacing,
    disposition: lane.modelFacing ? 'included' : 'debug_only',
    reason: `response_job_lane:${lane.kind}`,
  }));
}

function recentHistoryReceipts(
  packet: RoleplayRecentHistoryPacket,
  finalUserLanes: RoleplayFinalUserLane[],
): RoleplaySourceReceipt[] {
  let providerMessageIndex = 0;

  return packet.receipts.map((receipt) => {
    const providerMessage = receipt.includedInProviderHistory
      ? packet.providerMessages[providerMessageIndex]
      : undefined;
    if (receipt.includedInProviderHistory) providerMessageIndex += 1;

    const surface = receipt.role === 'user'
      ? 'recent_user_history'
      : 'recent_assistant_history';
    const authority: RoleplaySourceAuthority = receipt.responseJobSource === 'retry_contrast'
      ? 'contrast_only'
      : receipt.role === 'user'
        ? 'high'
        : 'medium';

    const representedLane = receipt.alsoRenderedInFinalUserLane
      ? finalUserLanes.find((lane) => lane.kind === receipt.alsoRenderedInFinalUserLane)
      : undefined;

    return createRoleplaySourceReceipt({
      surface,
      sourceId: receipt.generationId
        ? `${receipt.messageId}:${receipt.generationId}`
        : receipt.messageId,
      content: providerMessage?.content || representedLane?.content || '',
      authority,
      modelFacing: receipt.includedInProviderHistory,
      disposition: receipt.includedInProviderHistory ? 'included' : 'suppressed',
      reason: `recent_history:${receipt.reason}`,
    });
  });
}

export function buildRoleplaySourceReceipts({
  systemInstruction,
  finalUserLanes,
  recentHistoryPacket,
  executionBrief,
  roleplayContext,
}: BuildRoleplaySourceReceiptsInput): RoleplaySourceReceipt[] {
  const receipts = [
    ...systemSectionReceipts(systemInstruction),
    ...recentHistoryReceipts(recentHistoryPacket, finalUserLanes),
    ...finalUserLaneReceipts(finalUserLanes),
    createRoleplaySourceReceipt({
      surface: 'execution_brief',
      sourceId: 'roleplay-execution-brief',
      content: executionBrief,
      authority: 'high',
      modelFacing: true,
      disposition: 'included',
      reason: 'rendered_response_job_execution_brief',
    }),
  ];

  if (roleplayContext !== undefined) {
    receipts.push(createRoleplaySourceReceipt({
      surface: 'debug_roleplay_context',
      sourceId: 'browser-roleplay-context',
      content: JSON.stringify(roleplayContext),
      authority: 'debug_only',
      modelFacing: false,
      disposition: 'debug_only',
      reason: 'browser_to_edge_debug_context_not_provider_facing',
    }));
  }

  return receipts;
}

export function buildRoleplayDuplicateSourceMetrics(
  receipts: RoleplaySourceReceipt[],
): RoleplayDuplicateSourceMetric[] {
  const groups = new Map<string, RoleplaySourceReceipt[]>();

  for (const receipt of receipts) {
    if (!receipt.duplicateGroup) continue;
    const group = groups.get(receipt.duplicateGroup) ?? [];
    group.push(receipt);
    groups.set(receipt.duplicateGroup, group);
  }

  return [...groups.entries()]
    .filter(([, group]) => group.length > 1)
    .map(([duplicateGroup, group]) => ({
      duplicateGroup,
      receiptIds: group.map((receipt) => receipt.id),
      surfaces: [...new Set(group.map((receipt) => receipt.surface))],
      authorities: [...new Set(group.map((receipt) => receipt.authority))],
      dispositions: [...new Set(group.map((receipt) => receipt.disposition))],
      modelFacingCount: group.filter((receipt) => receipt.modelFacing).length,
      totalCount: group.length,
    }))
    .sort((left, right) => right.totalCount - left.totalCount
      || left.duplicateGroup.localeCompare(right.duplicateGroup));
}

function coverageNeedle(receipt: RoleplaySourceReceipt): string {
  return normalizeReceiptText(receipt.preview.replace(/\.\.\.$/, '')).slice(0, 120);
}

function laneSurfaceFromKind(kind: string): RoleplaySourceSurface {
  if (kind === 'player_turn') return 'player_turn';
  if (kind === 'current_state') return 'current_state';
  if (kind === 'response_detail') return 'response_detail';
  if (kind === 'retry_rejection' || kind === 'continue_anchor') return 'mode_control';
  return 'final_user_lane';
}

export function buildRoleplaySourceCoverage(input: {
  receipts: RoleplaySourceReceipt[];
  providerMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
}): {
  receiptCoverage: RoleplaySourceReceiptCoverage[];
  providerSectionCoverage: RoleplayProviderSectionCoverage[];
} {
  const normalizedMessages = input.providerMessages.map((message) => normalizeReceiptText(message.content));
  const receiptCoverage = input.receipts.map((receipt): RoleplaySourceReceiptCoverage => {
    if (!receipt.modelFacing || receipt.disposition === 'debug_only') {
      return {
        receiptId: receipt.id,
        surface: receipt.surface,
        status: 'not_applicable',
        providerMessageIndexes: [],
        reason: 'receipt_is_not_model_facing',
      };
    }

    const needle = coverageNeedle(receipt);
    const providerMessageIndexes = needle
      ? normalizedMessages
          .map((message, index) => ({ message, index }))
          .filter(({ message }) => message.includes(needle))
          .map(({ index }) => index)
      : [];

    return {
      receiptId: receipt.id,
      surface: receipt.surface,
      status: providerMessageIndexes.length > 0 ? 'covered' : 'missing_provider_text',
      providerMessageIndexes,
      reason: providerMessageIndexes.length > 0
        ? 'receipt_preview_found_in_rendered_provider_message'
        : 'model_facing_receipt_preview_missing_from_provider_messages',
    };
  });

  const expectedSections: Array<{
    id: string;
    surface: RoleplaySourceSurface;
    textHash: string;
  }> = [];
  const systemMessage = input.providerMessages.find((message) => message.role === 'system')?.content || '';
  for (const receiptInput of systemSectionReceiptInputs(systemMessage)) {
    expectedSections.push({
      id: receiptInput.sourceId || receiptInput.surface,
      surface: receiptInput.surface,
      textHash: hashRoleplaySourceText(receiptInput.content),
    });
  }

  const finalUserMessage = input.providerMessages[input.providerMessages.length - 1];
  if (finalUserMessage?.role === 'user') {
    const lanePattern = /\[([a-z_]+) \| [^\]]+\]\n([\s\S]*?)(?=\n\n\[[A-Z_ a-z|_-]+\]|$)/g;
    for (const match of finalUserMessage.content.matchAll(lanePattern)) {
      expectedSections.push({
        id: `final-user-lane:${match[1]}`,
        surface: laneSurfaceFromKind(match[1]),
        textHash: hashRoleplaySourceText(match[2].trim()),
      });
    }
    const executionBriefMatch = finalUserMessage.content.match(/\[EXECUTION BRIEF\]\n([\s\S]*?)$/);
    if (executionBriefMatch?.[1]) {
      expectedSections.push({
        id: 'execution-brief',
        surface: 'execution_brief',
        textHash: hashRoleplaySourceText(`[EXECUTION BRIEF]\n${executionBriefMatch[1].trim()}`),
      });
    }
  }

  input.providerMessages.slice(1, -1).forEach((message, index) => {
    expectedSections.push({
      id: `recent-history:${index + 1}:${message.role}`,
      surface: message.role === 'user' ? 'recent_user_history' : 'recent_assistant_history',
      textHash: hashRoleplaySourceText(message.content),
    });
  });

  const providerSectionCoverage = expectedSections.map((section): RoleplayProviderSectionCoverage => {
    const matchingReceipts = input.receipts.filter((receipt) => {
      if (!receipt.modelFacing || receipt.surface !== section.surface) return false;
      return receipt.textHash === section.textHash;
    });

    return {
      providerSectionId: section.id,
      expectedSurface: section.surface,
      status: matchingReceipts.length > 0 ? 'covered' : 'missing_source_receipt',
      receiptIds: matchingReceipts.map((receipt) => receipt.id),
    };
  });

  return { receiptCoverage, providerSectionCoverage };
}
