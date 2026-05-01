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

export type DialogDebugComment = {
  messageId: string;
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
  immediateBeat: string;
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
  name: string;
  controlledBy?: string;
  characterRole?: string;
  location?: string;
  scenePosition?: string;
  currentMood?: string;
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
  notes: string[];
};

export type StoredChatDebugTrace = {
  messageId: string;
  generationId: string;
  capturedAt: number;
  trace: ChatDebugTrace;
};

export type StoredChatDebugTraceMap = Record<string, StoredChatDebugTrace>;
