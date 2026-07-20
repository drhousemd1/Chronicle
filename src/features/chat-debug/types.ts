import type {
  RoleplayDuplicateSourceMetric,
  RoleplayProviderSectionCoverage,
  RoleplaySourceReceipt,
  RoleplaySourceReceiptCoverage,
} from '@/features/chat-runtime/roleplay-source-receipts';
import type {
  RoleplayActiveScenePacketCandidate,
  RoleplayEffectiveFieldEvidence,
  RoleplaySourcePacketComparison,
  RoleplaySourceBudgetSummary,
  RoleplaySourceSelectionEvidence,
} from '@/features/chat-runtime/roleplay-source-shaping';
import type { RoleplaySupportReviewEnvelope } from '@/features/chat-runtime/roleplay-support-review-envelope';
import type {
  SupportCallReadinessRecord,
  SupportReadinessSnapshot,
} from '@/features/chat-runtime/roleplay-support-readiness';
import type { RoleplayUserStateAuthorityDecision } from '@/features/chat-runtime/roleplay-user-state-authority';
import type {
  CharacterPromptFact,
  CharacterPromptFactReviewSummary,
} from '@/features/chat-runtime/roleplay-character-card-facts';
import type { KnowledgeVisibilityFact } from '@/features/chat-runtime/roleplay-knowledge-visibility';
import type { RoleplayGoalExposureDecision } from '@/features/chat-runtime/roleplay-goal-selector';
import type { EffectiveResponseDetail } from '@/features/chat-runtime/roleplay-response-detail';
import type { RoleplayArtifactIdentity } from '@/features/validation-evidence/roleplay-artifact-identity';

export type ChatDebugSelectionReason = 'bridge' | 'scored';

export const CHAT_DEBUG_ISSUE_TAGS = [
  'Scene Logic',
  'Character Control',
  'Speaker Flow',
  'Follow-Through',
  'Repetition',
  'Dialogue Quality',
  'Formatting',
  'Prompt Leakage',
  'Memory / State',
  'Context Use',
  'Other',
] as const;

export type ChatDebugIssueTag = (typeof CHAT_DEBUG_ISSUE_TAGS)[number];

export function isChatDebugIssueTag(value: unknown): value is ChatDebugIssueTag {
  return typeof value === 'string' && CHAT_DEBUG_ISSUE_TAGS.includes(value as ChatDebugIssueTag);
}

export function normalizeDialogDebugTags(tags: unknown): ChatDebugIssueTag[] {
  if (!Array.isArray(tags)) return [];
  const selected = new Set(tags.filter(isChatDebugIssueTag));
  return CHAT_DEBUG_ISSUE_TAGS.filter((tag) => selected.has(tag));
}

export type DialogDebugComment = {
  messageId: string;
  generationId: string;
  note: string;
  tags: ChatDebugIssueTag[];
  createdAt: number;
  updatedAt: number;
};

export type ChatDebugTraceExcerpt = {
  role: 'system' | 'user' | 'assistant';
  preview: string;
  selectionReason: ChatDebugSelectionReason;
  score: number;
};

export type ChatDebugPlannerPlan = {
  focusCharacter: string | null;
  allowedSpeakers: string[];
  maxSpeakerBlocks: number;
  directQuestionsToAnswer: string[];
  mentionedAiCharacters: string[];
  immediateSceneFocus: string;
  mustInclude: string[];
  mustAvoid: string[];
  continuityNotes: string[];
  sceneStateFacts: string[];
  formattingNotes: string[];
};

export type ChatDebugValidatorTrace = {
  approved: boolean | null;
  issues: string[];
  usedRevision: boolean;
  usedWriterDraftFallback: boolean;
  failureReason: string | null;
  revisedPreview: string;
};

export type ChatDebugTiming = {
  totalMs: number | null;
  plannerMs: number | null;
  writerMs: number | null;
  normalizationMs: number | null;
  directMs: number | null;
  fallbackMs: number | null;
};

export type ChatDebugCharacterSceneState = {
  characterId?: string;
  name: string;
  controlledBy?: string;
  characterRole?: string;
  location?: string;
  scenePosition?: string;
};

export type ChatDebugTrace = {
  version: 1;
  pipeline: 'roleplay_v2' | 'direct';
  finalPath: string;
  fallbackReason: string | null;
  roleplayContext: {
    conversationId: string | null;
    currentDay: number | null;
    currentTimeOfDay: string | null;
    activeSceneTitle: string | null;
    activeSceneTags: string[];
    aiCharacterNames: string[];
    userCharacterNames: string[];
    characterSceneStates?: ChatDebugCharacterSceneState[];
  };
  latestUserTurnPreview: string;
  recentWindowCount: number;
  supportingExcerpts: ChatDebugTraceExcerpt[];
  planner: {
    usedFallback: boolean;
    failureReason: string | null;
    plan: ChatDebugPlannerPlan;
  };
  writer: {
    temperature: number;
    draftPreview: string;
  };
  validator: ChatDebugValidatorTrace;
  normalization: {
    changed: boolean;
  };
  timing?: ChatDebugTiming;
  modelRequest?: ChatDebugRequestRecord['modelRequest'];
  modelRequests?: ChatDebugRequestRecord['modelRequests'];
  notes: string[];
  artifactIdentity?: RoleplayArtifactIdentity;
};

export type ChatDebugRequestRecord = {
  id: string;
  label: string;
  apiCallGroup: 'call_1' | 'call_2' | 'support';
  endpoint: string;
  method?: string;
  capturedAt: number;
  status?: 'sent' | 'completed' | 'error';
  requestBody: unknown;
  roleplayArtifactIdentity?: RoleplayArtifactIdentity;
  roleplaySourceReceipts?: RoleplaySourceReceipt[];
  roleplayDuplicateSourceMetrics?: RoleplayDuplicateSourceMetric[];
  roleplaySourceReceiptCoverage?: RoleplaySourceReceiptCoverage[];
  roleplayProviderSectionCoverage?: RoleplayProviderSectionCoverage[];
  roleplayEffectiveFieldEvidence?: RoleplayEffectiveFieldEvidence[];
  roleplaySourceBudgetSummary?: RoleplaySourceBudgetSummary;
  roleplayActiveScenePacketCandidate?: RoleplayActiveScenePacketCandidate;
  roleplaySourceSelection?: RoleplaySourceSelectionEvidence;
  roleplaySourcePacketComparison?: RoleplaySourcePacketComparison;
  roleplayUserStateAuthorityDecisions?: RoleplayUserStateAuthorityDecision[];
  roleplayCharacterPromptFacts?: CharacterPromptFact[];
  roleplayCharacterPromptFactSummaries?: CharacterPromptFactReviewSummary[];
  roleplayKnowledgeVisibilityFacts?: KnowledgeVisibilityFact[];
  roleplayGoalExposureDecision?: RoleplayGoalExposureDecision;
  effectiveResponseDetail?: EffectiveResponseDetail;
  roleplaySupportReviewEnvelope?: RoleplaySupportReviewEnvelope;
  roleplaySupportReadinessRecord?: SupportCallReadinessRecord;
  roleplaySupportReadinessSnapshot?: SupportReadinessSnapshot;
  modelRequest?: {
    endpoint: string;
    method?: string;
    requestBody: unknown;
    capturedAt?: number;
    notes?: string[];
    responseUsage?: unknown;
    reasoningSummaries?: string[];
    providerStreamError?: string | null;
  };
  modelRequests?: Array<{
    label?: string;
    endpoint: string;
    method?: string;
    requestBody: unknown;
    capturedAt?: number;
    notes?: string[];
    responseUsage?: unknown;
    reasoningSummaries?: string[];
    providerStreamError?: string | null;
  }>;
  responseBody?: unknown;
  error?: string;
  notes?: string[];
};

export type StoredChatDebugTrace = {
  messageId: string;
  generationId: string;
  capturedAt: number;
  trace?: ChatDebugTrace | null;
  call1Request?: ChatDebugRequestRecord;
  supportCalls?: ChatDebugRequestRecord[];
};

export type StoredChatDebugTraceMap = Record<string, StoredChatDebugTrace>;
