import type { RoleplayRecentHistoryPacket } from './roleplay-recent-history';
import type { RoleplayFinalUserLane } from './roleplay-response-job';
import type { PlayerTurnVisibilityProjection } from './player-turn-visibility';

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

export const ROLEPLAY_SOURCE_PACKET_VERSION = 'roleplay-source-packet-v1' as const;
export type RoleplaySourcePacketVersion = typeof ROLEPLAY_SOURCE_PACKET_VERSION;

export type RoleplaySourceClass =
  | 'player_turn'
  | 'mode_control'
  | 'current_state'
  | 'character_card'
  | 'goal'
  | 'memory'
  | 'recent_history'
  | 'story_reference'
  | 'runtime_instruction'
  | 'debug_evidence';

export type RoleplaySourceTransformation =
  | 'exact'
  | 'structured_fact'
  | 'visible_projection'
  | 'compacted'
  | 'outcome_summary'
  | 'control_summary'
  | 'none';

export const ROLEPLAY_MODEL_FACING_SECTIONS = [
  'system_roleplay_core',
  'system_story_world',
  'system_goals',
  'system_content_theme',
  'system_main_character_cards',
  'system_side_character_cards',
  'system_user_character_cards',
  'system_memory',
  'system_current_state',
  'system_active_scene',
  'system_temporal_context',
  'system_dialog_rules',
  'system_ui_settings',
  'final_player_turn',
  'final_established_fact_note',
  'final_current_state',
  'final_response_detail',
  'final_mode_control',
  'recent_history',
  'execution_brief',
] as const;

export type RoleplayModelFacingSection = (typeof ROLEPLAY_MODEL_FACING_SECTIONS)[number];

export type RoleplaySourceRecency = Readonly<{
  kind: 'current_turn' | 'recent_exchange' | 'durable_runtime' | 'static_reference' | 'unknown';
  messageId?: string;
  generationId?: string;
  timestamp?: number;
  sequence?: number;
}>;

export type RoleplaySourceRelevanceEvidence = Readonly<{
  status: 'mandatory' | 'relevant' | 'unknown' | 'irrelevant';
  reasons: readonly string[];
}>;

export type RoleplaySourcePrivacyDisposition = Readonly<{
  sensitivity: 'ordinary' | 'private_player_thought' | 'private_reference' | 'sensitive_owner_data';
  owner: Readonly<{
    scope: 'conversation_owner' | 'character_owner' | 'runtime';
    characterId?: string;
  }>;
  audience: 'model' | 'owner_private_debug' | 'admin_test_session_debug';
  selectionEligibility: 'eligible' | 'withheld' | 'debug_only';
  reason: string;
}>;

export type RoleplaySourceContentReference = Readonly<{
  kind: 'inline' | 'source_record' | 'generated_artifact';
  referenceId: string;
  fieldPath?: string;
}>;

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
  packetVersion: RoleplaySourcePacketVersion;
  surface: RoleplaySourceSurface;
  sourceClass: RoleplaySourceClass;
  sourceId?: string;
  sourceRecordId?: string;
  sourceField?: string;
  sourceMessageId?: string;
  sourceGenerationId?: string;
  textHash: string;
  authority: RoleplaySourceAuthority;
  modelFacing: boolean;
  disposition: RoleplaySourceDisposition;
  transformation: RoleplaySourceTransformation;
  privacy?: RoleplaySourcePrivacyDisposition;
  omissionReason?: string;
  modelFacingSection?: RoleplayModelFacingSection;
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
  relevanceText?: string;
  playerTurnVisibilityProjection?: PlayerTurnVisibilityProjection | null;
  roleplayContext?: unknown;
};

export type CreateRoleplaySourceReceiptInput = Omit<
  RoleplaySourceReceipt,
  | 'id'
  | 'packetVersion'
  | 'sourceClass'
  | 'textHash'
  | 'transformation'
  | 'contentLength'
  | 'preview'
  | 'duplicateGroup'
> & {
  content: string;
  packetVersion?: RoleplaySourcePacketVersion;
  sourceClass?: RoleplaySourceClass;
  transformation?: RoleplaySourceTransformation;
  duplicateGroup?: string;
};

export type RoleplaySourceCandidate = Readonly<{
  id: string;
  packetVersion: RoleplaySourcePacketVersion;
  receiptId: string;
  sourceClass: RoleplaySourceClass;
  surface: RoleplaySourceSurface;
  sourceId?: string;
  sourceRecordId?: string;
  sourceField?: string;
  sourceMessageId?: string;
  sourceGenerationId?: string;
  authority: RoleplaySourceAuthority;
  recency: RoleplaySourceRecency;
  relevance: RoleplaySourceRelevanceEvidence;
  privacy: RoleplaySourcePrivacyDisposition;
  estimatedChars: number;
  contentHash: string;
  content: string;
  contentReference: RoleplaySourceContentReference;
}>;

export type CreateRoleplaySourceCandidateInput = Readonly<{
  receipt: RoleplaySourceReceipt;
  content: string;
  recency: RoleplaySourceRecency;
  relevance: RoleplaySourceRelevanceEvidence;
  privacy: RoleplaySourcePrivacyDisposition;
  contentReference?: RoleplaySourceContentReference;
}>;

export type RoleplaySourceArtifacts = Readonly<{
  receipts: RoleplaySourceReceipt[];
  candidates: RoleplaySourceCandidate[];
}>;

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

const SYSTEM_SECTION_MODEL_SECTIONS: Record<string, RoleplayModelFacingSection> = {
  'SECTION 1': 'system_roleplay_core',
  'SECTION 2': 'system_story_world',
  'SECTION 3': 'system_main_character_cards',
  'SECTION 4': 'system_side_character_cards',
  'SECTION 5': 'system_user_character_cards',
  'SECTION 6': 'system_current_state',
  'SECTION 7': 'system_dialog_rules',
  'SECTION 8': 'system_ui_settings',
};

const SECTION_6_SURFACES: Record<string, RoleplaySourceSurface> = {
  'STORY MEMORIES': 'memory',
  'CURRENT PHYSICAL SCENE STATE': 'current_state',
  'ACTIVE SCENE CONTEXT': 'active_scene',
  'CURRENT TEMPORAL CONTEXT': 'temporal_context',
};

const SECTION_6_MODEL_SECTIONS: Record<string, RoleplayModelFacingSection> = {
  'STORY MEMORIES': 'system_memory',
  'CURRENT PHYSICAL SCENE STATE': 'system_current_state',
  'ACTIVE SCENE CONTEXT': 'system_active_scene',
  'CURRENT TEMPORAL CONTEXT': 'system_temporal_context',
};

function normalizeReceiptText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function roleplaySourceClassForSurface(surface: RoleplaySourceSurface): RoleplaySourceClass {
  if (surface === 'player_turn') return 'player_turn';
  if (surface === 'mode_control') return 'mode_control';
  if (surface === 'current_state') return 'current_state';
  if (surface === 'main_character_cards' || surface === 'side_character_cards' || surface === 'user_character_cards') {
    return 'character_card';
  }
  if (surface === 'goals') return 'goal';
  if (surface === 'memory') return 'memory';
  if (surface === 'recent_user_history' || surface === 'recent_assistant_history') return 'recent_history';
  if (surface === 'story_world' || surface === 'content_theme' || surface === 'active_scene' || surface === 'temporal_context') {
    return 'story_reference';
  }
  if (surface === 'debug_roleplay_context') return 'debug_evidence';
  return 'runtime_instruction';
}

function defaultSourceTransformation(input: CreateRoleplaySourceReceiptInput): RoleplaySourceTransformation {
  if (!input.modelFacing || input.disposition === 'debug_only') return 'none';
  if (input.disposition === 'compacted' || input.disposition === 'downgraded') return 'compacted';
  if (input.reason.includes('outcome_summary')) return 'outcome_summary';
  if (input.authority === 'contrast_only' || input.surface === 'mode_control') return 'control_summary';
  return 'exact';
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
  if (input.privacy?.owner.scope === 'character_owner' && !input.privacy.owner.characterId) {
    throw new Error('Character-owned source receipts require an owner character ID.');
  }
  if (input.privacy?.audience === 'model'
    && (!input.modelFacing || input.privacy.selectionEligibility !== 'eligible')) {
    throw new Error('Model-audience source receipts must be model-facing and eligible.');
  }
  if (input.privacy?.audience !== undefined
    && input.privacy.audience !== 'model'
    && (input.modelFacing || input.privacy.selectionEligibility === 'eligible')) {
    throw new Error('Private or debug source receipts cannot be model-facing or eligible.');
  }
  const normalized = normalizeReceiptText(input.content);
  const textHash = hashRoleplaySourceText(normalized);
  const sourceKey = [
    input.sourceId || input.surface,
    input.sourceRecordId && input.sourceRecordId !== input.sourceId
      ? input.sourceRecordId
      : '',
    input.sourceField || '',
  ].filter(Boolean).join(':');

  return {
    id: `${input.surface}:${sourceKey}:${textHash}`,
    packetVersion: input.packetVersion || ROLEPLAY_SOURCE_PACKET_VERSION,
    surface: input.surface,
    sourceClass: input.sourceClass || roleplaySourceClassForSurface(input.surface),
    sourceId: input.sourceId,
    sourceRecordId: input.sourceRecordId || input.sourceId,
    sourceField: input.sourceField,
    sourceMessageId: input.sourceMessageId,
    sourceGenerationId: input.sourceGenerationId,
    textHash,
    authority: input.authority,
    modelFacing: input.modelFacing,
    disposition: input.disposition,
    transformation: input.transformation || defaultSourceTransformation(input),
    privacy: input.privacy,
    omissionReason: input.omissionReason,
    modelFacingSection: input.modelFacingSection,
    duplicateGroup: input.duplicateGroup || (normalized ? `exact:${textHash}` : undefined),
    reason: input.reason,
    contentLength: normalized.length,
    preview: previewReceiptText(normalized),
  };
}

export function createRoleplaySourceCandidate(
  input: CreateRoleplaySourceCandidateInput,
): RoleplaySourceCandidate {
  if (input.privacy.owner.scope === 'character_owner' && !input.privacy.owner.characterId) {
    throw new Error('Character-owned source candidates require an owner character ID.');
  }
  if (input.privacy.audience === 'model' && input.privacy.selectionEligibility !== 'eligible') {
    throw new Error('Model-audience source candidates must be eligible for selection.');
  }
  if (input.privacy.audience !== 'model' && input.privacy.selectionEligibility === 'eligible') {
    throw new Error('Private or debug source candidates cannot be eligible for model selection.');
  }
  if ((!input.receipt.modelFacing || input.receipt.disposition === 'debug_only')
    && input.privacy.selectionEligibility === 'eligible') {
    throw new Error('A non-model-facing receipt cannot produce a model-eligible source candidate.');
  }

  const content = input.content;
  const contentReference = input.contentReference || {
    kind: 'source_record' as const,
    referenceId: input.receipt.sourceRecordId || input.receipt.sourceId || input.receipt.id,
    fieldPath: input.receipt.sourceField,
  };

  return {
    id: `candidate:${input.receipt.id}`,
    packetVersion: input.receipt.packetVersion,
    receiptId: input.receipt.id,
    sourceClass: input.receipt.sourceClass,
    surface: input.receipt.surface,
    sourceId: input.receipt.sourceId,
    sourceRecordId: input.receipt.sourceRecordId,
    sourceField: input.receipt.sourceField,
    sourceMessageId: input.receipt.sourceMessageId,
    sourceGenerationId: input.receipt.sourceGenerationId,
    authority: input.receipt.authority,
    recency: input.recency,
    relevance: input.relevance,
    privacy: input.privacy,
    estimatedChars: content.length,
    contentHash: hashRoleplaySourceText(content),
    content,
    contentReference,
  };
}

const SECTION_2_BLOCK_PATTERN = /^(--- (?:WORLD CONTEXT|LOCATIONS|CUSTOM WORLD CONTENT|ADDITIONAL LORE ENTRIES|STORY THEMES) ---|MAIN STORY GOALS)$/gm;

function section2ReceiptInputs(input: {
  heading: string;
  content: string;
}): CreateRoleplaySourceReceiptInput[] {
  const { content } = input;
  const matches = [...content.matchAll(SECTION_2_BLOCK_PATTERN)];
  if (matches.length === 0) {
    return [{
      surface: 'story_world',
      sourceId: 'section-2-story-world',
      modelFacingSection: 'system_story_world',
      content: `--- SECTION 2 - ${input.heading} ---\n\n${content}`,
      authority: 'medium',
      modelFacing: true,
      disposition: 'included',
      reason: 'rendered_story_world_block',
    }];
  }

  const inputs: CreateRoleplaySourceReceiptInput[] = [];
  const preamble = content.slice(0, matches[0].index ?? 0).trim();
  inputs.push({
    surface: 'roleplay_core',
    sourceId: 'section-2-structure',
    modelFacingSection: 'system_roleplay_core',
    content: `--- SECTION 2 - ${input.heading} ---`,
    authority: 'high',
    modelFacing: true,
    disposition: 'included',
    reason: 'rendered_story_world_section_structure',
  });
  if (preamble) {
    inputs.push({
      surface: 'story_world',
      sourceId: 'section-2-story-world-preamble',
      modelFacingSection: 'system_story_world',
      content: preamble,
      authority: 'medium',
      modelFacing: true,
      disposition: 'included',
      reason: 'rendered_story_world_block',
    });
  }

  inputs.push(...matches.map((match, index): CreateRoleplaySourceReceiptInput => {
    const marker = match[1];
    const start = match.index ?? 0;
    const end = matches[index + 1]?.index ?? content.length;
    const block = content.slice(start, end).trim();
    const isGoal = marker === 'MAIN STORY GOALS';
    const isTheme = marker === '--- STORY THEMES ---';
    const sourceId = marker
      .replace(/^--- | ---$/g, '')
      .toLowerCase()
      .replace(/\s+/g, '-');

    return {
      surface: isGoal ? 'goals' : isTheme ? 'content_theme' : 'story_world',
      sourceId,
      modelFacingSection: isGoal
        ? 'system_goals'
        : isTheme
          ? 'system_content_theme'
          : 'system_story_world',
      content: block,
      authority: 'medium',
      modelFacing: true,
      disposition: 'included',
      reason: isGoal
        ? 'rendered_story_goal_block'
        : isTheme
          ? 'rendered_content_theme_block'
          : 'rendered_story_world_block',
    };
  }));
  return inputs;
}

function characterSectionReceiptInputs(input: {
  sectionId: string;
  heading: string;
  content: string;
  surface: 'main_character_cards' | 'side_character_cards' | 'user_character_cards';
  modelFacingSection: RoleplayModelFacingSection;
}): CreateRoleplaySourceReceiptInput[] {
  const firstCharacterIndex = input.content.search(/^CHARACTER: /m);
  if (firstCharacterIndex < 0) {
    return [{
      surface: input.surface,
      sourceId: input.sectionId.toLowerCase().replace(/\s+/g, '-'),
      modelFacingSection: input.modelFacingSection,
      content: `--- ${input.sectionId} - ${input.heading} ---\n\n${input.content}`,
      authority: 'medium',
      modelFacing: true,
      disposition: 'included',
      reason: 'rendered_character_card_section',
    }];
  }

  const inputs: CreateRoleplaySourceReceiptInput[] = [];
  const preamble = input.content.slice(0, firstCharacterIndex).trim();
  if (preamble) {
    inputs.push({
      surface: 'roleplay_core',
      sourceId: `${input.sectionId.toLowerCase().replace(/\s+/g, '-')}-instructions`,
      modelFacingSection: 'system_roleplay_core',
      content: `--- ${input.sectionId} - ${input.heading} ---\n\n${preamble}`,
      authority: 'high',
      modelFacing: true,
      disposition: 'included',
      reason: 'rendered_character_section_instruction',
    });
  }

  const characterContent = input.content.slice(firstCharacterIndex);
  const characterBlocks = characterContent.split(/\n\n(?=CHARACTER: )/);
  for (const [index, block] of characterBlocks.entries()) {
    const name = block.match(/^CHARACTER: ([^\n]+)/)?.[1]?.trim() || `character-${index + 1}`;
    const characterSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const sourceRecordId = `${input.surface}:${characterSlug}`;
    inputs.push({
      surface: input.surface,
      sourceId: `${input.sectionId.toLowerCase().replace(/\s+/g, '-')}:${characterSlug}`,
      sourceRecordId,
      sourceField: 'prompt_card',
      modelFacingSection: input.modelFacingSection,
      content: block.trim(),
      authority: 'medium',
      modelFacing: true,
      disposition: 'included',
      transformation: 'structured_fact',
      reason: 'rendered_character_prompt_card',
    });
  }
  return inputs;
}

function systemSectionReceiptInputs(systemInstruction: string): CreateRoleplaySourceReceiptInput[] {
  const sectionPattern = /--- (SECTION \d+) - ([^-]+?) ---\n\n([\s\S]*?)(?=\n--- (?:SECTION \d+ -|STORY AND CHARACTER CARD REFERENCE RULE ---)|$)/g;
  const inputs: CreateRoleplaySourceReceiptInput[] = [];
  const cardReferenceMatch = systemInstruction.match(
    /--- STORY AND CHARACTER CARD REFERENCE RULE ---\n\n([\s\S]*?)(?=\n--- SECTION 3 -|$)/,
  );
  let match: RegExpExecArray | null;

  while ((match = sectionPattern.exec(systemInstruction)) !== null) {
    const sectionId = match[1];
    const heading = match[2].trim();
    const content = match[3].trim();
    const surface = SYSTEM_SECTION_SURFACES[sectionId] || 'roleplay_core';

    if (sectionId === 'SECTION 2') {
      inputs.push(...section2ReceiptInputs({ heading, content }));
      if (cardReferenceMatch?.[1]) {
        inputs.push({
          surface: 'roleplay_core',
          sourceId: 'character-card-reference-rule',
          modelFacingSection: 'system_roleplay_core',
          content: `--- STORY AND CHARACTER CARD REFERENCE RULE ---\n\n${cardReferenceMatch[1].trim()}`,
          authority: 'high',
          modelFacing: true,
          disposition: 'included',
          reason: 'rendered_character_card_reference_rule',
        });
      }
      continue;
    }

    if (sectionId === 'SECTION 3' || sectionId === 'SECTION 4' || sectionId === 'SECTION 5') {
      inputs.push(...characterSectionReceiptInputs({
        sectionId,
        heading,
        content,
        surface: surface as 'main_character_cards' | 'side_character_cards' | 'user_character_cards',
        modelFacingSection: SYSTEM_SECTION_MODEL_SECTIONS[sectionId],
      }));
      continue;
    }

    if (sectionId === 'SECTION 6') {
      const nestedPattern = /--- (STORY MEMORIES|CURRENT PHYSICAL SCENE STATE|ACTIVE SCENE CONTEXT|CURRENT TEMPORAL CONTEXT) ---\n\n([\s\S]*?)(?=\n--- (?:STORY MEMORIES|CURRENT PHYSICAL SCENE STATE|ACTIVE SCENE CONTEXT|CURRENT TEMPORAL CONTEXT) ---|$)/g;
      const firstNestedIndex = content.search(/--- (?:STORY MEMORIES|CURRENT PHYSICAL SCENE STATE|ACTIVE SCENE CONTEXT|CURRENT TEMPORAL CONTEXT) ---/);
      let nestedMatch: RegExpExecArray | null;
      let nestedCount = 0;

      if (firstNestedIndex >= 0) {
        const preamble = content.slice(0, firstNestedIndex).trim();
        inputs.push({
          surface: 'roleplay_core',
          sourceId: 'section-6-instructions',
          modelFacingSection: 'system_roleplay_core',
          content: `--- ${sectionId} - ${heading} ---${preamble ? `\n\n${preamble}` : ''}`,
          authority: 'high',
          modelFacing: true,
          disposition: 'included',
          reason: 'rendered_current_context_section_instruction',
        });
      }

      while ((nestedMatch = nestedPattern.exec(content)) !== null) {
        const nestedHeading = nestedMatch[1];
        const nestedContent = nestedMatch[2].trim();
        inputs.push({
          surface: SECTION_6_SURFACES[nestedHeading],
          sourceId: nestedHeading.toLowerCase().replace(/\s+/g, '-'),
          modelFacingSection: SECTION_6_MODEL_SECTIONS[nestedHeading],
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
      modelFacingSection: SYSTEM_SECTION_MODEL_SECTIONS[sectionId],
      content: `--- ${sectionId} - ${heading} ---\n\n${content}`,
      authority: surface === 'roleplay_core' || surface === 'dialog_rules' ? 'high' : 'medium',
      modelFacing: true,
      disposition: 'included',
      reason: 'rendered_system_instruction_section',
    });

  }

  return inputs;
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

function laneModelFacingSection(lane: RoleplayFinalUserLane): RoleplayModelFacingSection {
  if (lane.kind === 'player_turn') return 'final_player_turn';
  if (lane.kind === 'established_fact_note') return 'final_established_fact_note';
  if (lane.kind === 'current_state') return 'final_current_state';
  if (lane.kind === 'response_detail') return 'final_response_detail';
  return 'final_mode_control';
}

function finalUserLaneReceiptInputs(
  lanes: RoleplayFinalUserLane[],
  projection?: PlayerTurnVisibilityProjection | null,
): CreateRoleplaySourceReceiptInput[] {
  const laneReceipts = lanes.map((lane): CreateRoleplaySourceReceiptInput => ({
    surface: laneSurface(lane),
    sourceId: lane.id,
    sourceRecordId: lane.kind === 'player_turn'
      ? projection?.sourceMessageId || lane.id
      : lane.id,
    sourceField: lane.kind === 'player_turn' ? 'visible_text' : undefined,
    sourceMessageId: lane.kind === 'player_turn' ? projection?.sourceMessageId : undefined,
    content: lane.content,
    authority: laneAuthority(lane),
    modelFacing: lane.modelFacing,
    disposition: lane.modelFacing ? 'included' : 'debug_only',
    transformation: lane.kind === 'retry_rejection' || lane.kind === 'continue_anchor'
      ? 'control_summary'
      : lane.kind === 'player_turn' && projection?.changed
        ? 'visible_projection'
      : 'exact',
    modelFacingSection: laneModelFacingSection(lane),
    reason: `response_job_lane:${lane.kind}`,
  }));

  if (!projection) return laneReceipts;

  const privateSpanReceipts = projection.privateSpans.map((span): CreateRoleplaySourceReceiptInput => ({
    surface: 'player_turn',
    sourceClass: 'player_turn',
    sourceId: span.id,
    sourceRecordId: projection.sourceMessageId || span.id,
    sourceField: `private_parenthetical.${span.index}`,
    sourceMessageId: projection.sourceMessageId,
    content: span.rawText,
    authority: 'debug_only',
    modelFacing: false,
    disposition: 'suppressed',
    transformation: 'none',
    privacy: {
      sensitivity: 'private_player_thought',
      owner: { scope: 'conversation_owner' },
      audience: 'owner_private_debug',
      selectionEligibility: 'withheld',
      reason: 'balanced_parenthetical_private_thought',
    },
    omissionReason: 'balanced_parenthetical_private_thought',
    reason: 'private_player_thought_withheld_from_model',
  }));
  const warningReceipts = projection.warnings.map((warning, index): CreateRoleplaySourceReceiptInput => ({
    surface: 'player_turn',
    sourceClass: 'debug_evidence',
    sourceId: `${projection.sourceMessageId || 'unpersisted-player-turn'}:visibility-warning:${index + 1}`,
    sourceRecordId: projection.sourceMessageId || 'unpersisted-player-turn',
    sourceField: `visibility_warning.${index}`,
    sourceMessageId: projection.sourceMessageId,
    content: `${warning.code} at character ${warning.index}`,
    authority: 'debug_only',
    modelFacing: false,
    disposition: 'debug_only',
    transformation: 'none',
    reason: 'unmatched_parenthetical_delimiter_left_visible',
  }));

  return [...laneReceipts, ...privateSpanReceipts, ...warningReceipts];
}

function recentHistoryReceiptInputs(
  packet: RoleplayRecentHistoryPacket,
  finalUserLanes: RoleplayFinalUserLane[],
): CreateRoleplaySourceReceiptInput[] {
  let providerMessageIndex = 0;

  return packet.receipts.flatMap((receipt) => {
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

    const baseReceipt: CreateRoleplaySourceReceiptInput = {
      surface,
      sourceId: receipt.generationId
        ? `${receipt.messageId}:${receipt.generationId}`
        : receipt.messageId,
      content: providerMessage?.content || representedLane?.content || '',
      sourceMessageId: receipt.messageId,
      sourceGenerationId: receipt.generationId,
      authority,
      modelFacing: receipt.includedInProviderHistory,
      disposition: receipt.includedInProviderHistory ? 'included' : 'suppressed',
      transformation: receipt.treatment === 'outcome_summary'
        ? 'outcome_summary'
        : receipt.treatment === 'visible_user_projection'
          ? 'visible_projection'
          : receipt.includedInProviderHistory
            ? 'exact'
            : 'none',
      modelFacingSection: receipt.includedInProviderHistory ? 'recent_history' : undefined,
      omissionReason: receipt.includedInProviderHistory ? undefined : receipt.reason,
      reason: `recent_history:${receipt.reason}`,
    };

    const privateSpanReceipts = (receipt.privateSpans ?? []).map((span): CreateRoleplaySourceReceiptInput => ({
      surface: 'recent_user_history',
      sourceClass: 'recent_history',
      sourceId: span.id,
      sourceRecordId: receipt.messageId,
      sourceField: `private_parenthetical.${span.index}`,
      sourceMessageId: receipt.messageId,
      sourceGenerationId: receipt.generationId,
      content: span.rawText,
      authority: 'debug_only',
      modelFacing: false,
      disposition: 'suppressed',
      transformation: 'none',
      privacy: {
        sensitivity: 'private_player_thought',
        owner: { scope: 'conversation_owner' },
        audience: 'owner_private_debug',
        selectionEligibility: 'withheld',
        reason: 'balanced_parenthetical_private_thought',
      },
      omissionReason: 'balanced_parenthetical_private_thought',
      reason: 'private_player_thought_withheld_from_recent_history',
    }));
    const warningReceipts = (receipt.visibilityWarnings ?? []).map((warning, index): CreateRoleplaySourceReceiptInput => ({
      surface: 'recent_user_history',
      sourceClass: 'debug_evidence',
      sourceId: `${receipt.messageId}:visibility-warning:${index + 1}`,
      sourceRecordId: receipt.messageId,
      sourceField: `visibility_warning.${index}`,
      sourceMessageId: receipt.messageId,
      sourceGenerationId: receipt.generationId,
      content: `${warning.code} at character ${warning.index}`,
      authority: 'debug_only',
      modelFacing: false,
      disposition: 'debug_only',
      transformation: 'none',
      reason: 'unmatched_parenthetical_delimiter_left_visible_in_recent_history',
    }));

    return [baseReceipt, ...privateSpanReceipts, ...warningReceipts];
  });
}

function buildRoleplaySourceReceiptInputs({
  systemInstruction,
  finalUserLanes,
  recentHistoryPacket,
  executionBrief,
  playerTurnVisibilityProjection,
  roleplayContext,
}: BuildRoleplaySourceReceiptsInput): CreateRoleplaySourceReceiptInput[] {
  const inputs: CreateRoleplaySourceReceiptInput[] = [
    ...systemSectionReceiptInputs(systemInstruction),
    ...recentHistoryReceiptInputs(recentHistoryPacket, finalUserLanes),
    ...finalUserLaneReceiptInputs(finalUserLanes, playerTurnVisibilityProjection),
    {
      surface: 'execution_brief',
      sourceId: 'roleplay-execution-brief',
      content: executionBrief,
      authority: 'high',
      modelFacing: true,
      disposition: 'included',
      modelFacingSection: 'execution_brief',
      reason: 'rendered_response_job_execution_brief',
    },
  ];

  if (roleplayContext !== undefined) {
    inputs.push({
      surface: 'debug_roleplay_context',
      sourceId: 'browser-roleplay-context',
      content: JSON.stringify(roleplayContext),
      authority: 'debug_only',
      modelFacing: false,
      disposition: 'debug_only',
      reason: 'browser_to_edge_debug_context_not_provider_facing',
    });
  }

  return inputs;
}

const CANDIDATE_STOP_WORDS = new Set([
  'about', 'after', 'again', 'also', 'because', 'before', 'being', 'could', 'current',
  'does', 'from', 'have', 'into', 'itself', 'should', 'their', 'there', 'these', 'they',
  'this', 'through', 'using', 'what', 'when', 'where', 'which', 'while', 'with', 'would',
]);

function candidateTerms(value: string): Set<string> {
  return new Set((value.toLowerCase().match(/[a-z0-9']+/g) ?? [])
    .filter((term) => term.length >= 4 && !CANDIDATE_STOP_WORDS.has(term)));
}

function candidateRecency(input: CreateRoleplaySourceReceiptInput): RoleplaySourceRecency {
  if (input.surface === 'player_turn' || input.surface === 'mode_control' || input.surface === 'final_user_lane') {
    return { kind: 'current_turn', messageId: input.sourceMessageId, generationId: input.sourceGenerationId };
  }
  if (input.surface === 'recent_user_history' || input.surface === 'recent_assistant_history') {
    return { kind: 'recent_exchange', messageId: input.sourceMessageId, generationId: input.sourceGenerationId };
  }
  if (input.surface === 'memory' || input.surface === 'current_state') return { kind: 'durable_runtime' };
  if (input.surface === 'main_character_cards'
    || input.surface === 'side_character_cards'
    || input.surface === 'user_character_cards'
    || input.surface === 'story_world'
    || input.surface === 'content_theme'
    || input.surface === 'goals') {
    return { kind: 'static_reference' };
  }
  return { kind: 'unknown' };
}

function candidateRelevance(
  input: CreateRoleplaySourceReceiptInput,
  relevanceText: string,
): RoleplaySourceRelevanceEvidence {
  if (!input.modelFacing || input.disposition === 'debug_only') {
    return { status: 'irrelevant', reasons: ['not_model_eligible'] };
  }
  if (input.surface === 'player_turn'
    || input.surface === 'mode_control'
    || input.surface === 'final_user_lane'
    || input.surface === 'response_detail'
    || input.surface === 'execution_brief'
    || input.surface === 'roleplay_core'
    || input.surface === 'dialog_rules'
    || input.surface === 'ui_settings'
    || input.surface === 'current_state'
    || input.surface === 'active_scene'
    || input.surface === 'temporal_context'
    || input.surface === 'main_character_cards'
    || input.surface === 'user_character_cards') {
    return { status: 'mandatory', reasons: ['required_roleplay_request_source'] };
  }
  if (input.surface === 'goals' || input.surface === 'content_theme'
    || input.surface === 'recent_user_history' || input.surface === 'recent_assistant_history') {
    return { status: 'relevant', reasons: ['already_selected_by_owning_runtime_policy'] };
  }

  const queryTerms = candidateTerms(relevanceText);
  const sourceTerms = candidateTerms(input.content);
  const overlap = [...queryTerms].filter((term) => sourceTerms.has(term));
  if (overlap.length >= 2) {
    return { status: 'relevant', reasons: [`current_exchange_term_overlap:${overlap.slice(0, 4).join(',')}`] };
  }
  return { status: 'unknown', reasons: ['no_direct_current_exchange_evidence'] };
}

function candidatePrivacy(input: CreateRoleplaySourceReceiptInput): RoleplaySourcePrivacyDisposition {
  if (input.privacy) return input.privacy;
  if (input.modelFacing && input.disposition !== 'debug_only') {
    return {
      sensitivity: 'ordinary',
      owner: { scope: 'runtime' },
      audience: 'model',
      selectionEligibility: 'eligible',
      reason: 'approved_model_facing_source',
    };
  }
  return {
    sensitivity: 'ordinary',
    owner: { scope: 'runtime' },
    audience: 'admin_test_session_debug',
    selectionEligibility: 'debug_only',
    reason: input.omissionReason || 'debug_or_withheld_source',
  };
}

export function buildRoleplaySourceArtifacts(
  input: BuildRoleplaySourceReceiptsInput,
): RoleplaySourceArtifacts {
  const receiptInputs = buildRoleplaySourceReceiptInputs(input);
  const receipts = receiptInputs.map(createRoleplaySourceReceipt);
  const candidates = receiptInputs.map((receiptInput, index) => createRoleplaySourceCandidate({
    receipt: receipts[index],
    content: receiptInput.content,
    recency: candidateRecency(receiptInput),
    relevance: candidateRelevance(receiptInput, input.relevanceText || ''),
    privacy: candidatePrivacy(receiptInput),
    contentReference: {
      kind: 'inline',
      referenceId: receipts[index].id,
      fieldPath: receiptInput.sourceField,
    },
  }));
  return { receipts, candidates };
}

export function buildRoleplaySourceReceipts(
  input: BuildRoleplaySourceReceiptsInput,
): RoleplaySourceReceipt[] {
  return buildRoleplaySourceArtifacts(input).receipts;
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
