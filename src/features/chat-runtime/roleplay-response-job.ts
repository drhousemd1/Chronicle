export type RoleplayResponseMode = 'normal_send' | 'retry_regenerate' | 'continue_assistant_tail';

export type RoleplayResponsePurpose =
  | 'respond_to_player_turn'
  | 'replace_rejected_assistant_response'
  | 'extend_accepted_assistant_response'
  | 'recover_after_deleted_assistant_response';

export type RoleplayResponseDetail = 'concise' | 'standard' | 'detailed';

export type RoleplayPlayerTurn = {
  messageId: string;
  text: string;
};

export type RoleplayFinalUserLaneKind =
  | 'player_turn'
  | 'established_fact_note'
  | 'current_state'
  | 'response_detail'
  | 'retry_rejection'
  | 'continue_anchor';

export type RoleplayFinalUserLaneAuthority =
  | 'player_turn'
  | 'state'
  | 'control'
  | 'debug_only';

export type RoleplayFinalUserLane = {
  id: string;
  kind: RoleplayFinalUserLaneKind;
  sourceRole: 'user' | 'assistant' | 'runtime';
  authority: RoleplayFinalUserLaneAuthority;
  modelFacing: boolean;
  content: string;
};

export type RoleplayFinalUserLaneEvidence = {
  id: string;
  kind: RoleplayFinalUserLaneKind;
  sourceRole: RoleplayFinalUserLane['sourceRole'];
  authority: RoleplayFinalUserLaneAuthority;
  modelFacing: boolean;
  contentLength: number;
  contentPreview: string;
};

export type RoleplayHistoryPolicy =
  | { strategy: 'standard_recent_history' }
  | { strategy: 'exclude_rejected_attempt' }
  | { strategy: 'anchor_on_accepted_assistant_tail' };

export type RoleplayNormalSendModeData = {
  kind: 'normal_send';
  variant?: 'deleted_assistant_recovery';
  deletedAssistantMessageId?: string;
  deletedAssistantGenerationId?: string;
  createsNewUserMessage?: boolean;
  tailActionReason?: 'assistant_reply_deleted_latest_user_tail';
};

export type RoleplayRetryRegenerateModeData = {
  kind: 'retry_regenerate';
  rejectedMessageId: string;
  rejectedGenerationId?: string;
  rejectedAttemptSummary: string;
  requiredDifference: string;
  preserveRule: string;
};

export type RoleplayContinueAssistantTailModeData = {
  kind: 'continue_assistant_tail';
  assistantMessageId: string;
  assistantGenerationId?: string;
  priorUserMessageId?: string;
};

export type RoleplayResponseJobModeData =
  | RoleplayNormalSendModeData
  | RoleplayRetryRegenerateModeData
  | RoleplayContinueAssistantTailModeData;

export type RoleplayResponseJob = {
  conversationId: string;
  mode: RoleplayResponseMode;
  purpose: RoleplayResponsePurpose;
  playerTurn: RoleplayPlayerTurn | null;
  currentStateSummary: string;
  responseDetail: RoleplayResponseDetail;
  historyPolicy: RoleplayHistoryPolicy;
  modeData: RoleplayResponseJobModeData;
  finalUserLanes: RoleplayFinalUserLane[];
  sourceReceiptIds?: string[];
};

export type BuildNormalSendResponseJobInput = {
  conversationId: string;
  playerTurn: RoleplayPlayerTurn;
  establishedFactNote?: string;
  currentStateSummary: string;
  responseDetail: RoleplayResponseDetail;
};

export type BuildRetryRegenerateResponseJobInput = {
  conversationId: string;
  playerTurn: RoleplayPlayerTurn;
  establishedFactNote?: string;
  rejectedAttempt: {
    messageId: string;
    generationId?: string;
    text: string;
    summary: string;
  };
  requiredDifference?: string;
  preserveRule?: string;
  currentStateSummary: string;
  responseDetail: RoleplayResponseDetail;
};

export type BuildContinueAssistantTailResponseJobInput = {
  conversationId: string;
  assistantAnchor: {
    messageId: string;
    generationId?: string;
    acceptedTextTail: string;
  };
  priorUserMessageId?: string;
  currentStateSummary: string;
  responseDetail: RoleplayResponseDetail;
};

export type BuildDeletedAssistantRecoveryResponseJobInput = {
  conversationId: string;
  visibleUserTail: RoleplayPlayerTurn;
  deletedAssistantMessageId: string;
  deletedAssistantGenerationId?: string;
  currentStateSummary: string;
  responseDetail: RoleplayResponseDetail;
};

function sharedContextLanes(currentStateSummary: string, responseDetail: RoleplayResponseDetail): RoleplayFinalUserLane[] {
  return [
    {
      id: 'current_state',
      kind: 'current_state',
      sourceRole: 'runtime',
      authority: 'state',
      modelFacing: true,
      content: currentStateSummary,
    },
    {
      id: 'response_detail',
      kind: 'response_detail',
      sourceRole: 'runtime',
      authority: 'control',
      modelFacing: true,
      content: responseDetail,
    },
  ];
}

function playerTurnLane(playerTurn: RoleplayPlayerTurn): RoleplayFinalUserLane {
  return {
    id: 'player_turn',
    kind: 'player_turn',
    sourceRole: 'user',
    authority: 'player_turn',
    modelFacing: true,
    content: playerTurn.text,
  };
}

function establishedFactNoteLane(establishedFactNote?: string): RoleplayFinalUserLane[] {
  const content = establishedFactNote?.trim();
  if (!content) return [];

  return [{
    id: 'established_fact_note',
    kind: 'established_fact_note',
    sourceRole: 'runtime',
    authority: 'state',
    modelFacing: true,
    content,
  }];
}

const DEFAULT_RETRY_REQUIRED_DIFFERENCE =
  'Change at least one response function, opening move, dialogue angle, action progression, or final-question shape.';

const DEFAULT_RETRY_PRESERVE_RULE =
  'Preserve established facts and user-controlled actions; keep the full rejected assistant text debug-only by default.';

export function buildNormalSendResponseJob({
  conversationId,
  playerTurn,
  establishedFactNote,
  currentStateSummary,
  responseDetail,
}: BuildNormalSendResponseJobInput): RoleplayResponseJob {
  return {
    conversationId,
    mode: 'normal_send',
    purpose: 'respond_to_player_turn',
    playerTurn,
    currentStateSummary,
    responseDetail,
    historyPolicy: { strategy: 'standard_recent_history' },
    modeData: { kind: 'normal_send' },
    finalUserLanes: [
      playerTurnLane(playerTurn),
      ...establishedFactNoteLane(establishedFactNote),
      ...sharedContextLanes(currentStateSummary, responseDetail),
    ],
  };
}

export function buildRetryRegenerateResponseJob({
  conversationId,
  playerTurn,
  establishedFactNote,
  rejectedAttempt,
  requiredDifference = DEFAULT_RETRY_REQUIRED_DIFFERENCE,
  preserveRule = DEFAULT_RETRY_PRESERVE_RULE,
  currentStateSummary,
  responseDetail,
}: BuildRetryRegenerateResponseJobInput): RoleplayResponseJob {
  return {
    conversationId,
    mode: 'retry_regenerate',
    purpose: 'replace_rejected_assistant_response',
    playerTurn,
    currentStateSummary,
    responseDetail,
    historyPolicy: { strategy: 'exclude_rejected_attempt' },
    modeData: {
      kind: 'retry_regenerate',
      rejectedMessageId: rejectedAttempt.messageId,
      rejectedGenerationId: rejectedAttempt.generationId,
      rejectedAttemptSummary: rejectedAttempt.summary,
      requiredDifference,
      preserveRule,
    },
    finalUserLanes: [
      playerTurnLane(playerTurn),
      ...establishedFactNoteLane(establishedFactNote),
      {
        id: 'retry_rejection',
        kind: 'retry_rejection',
        sourceRole: 'assistant',
        authority: 'control',
        modelFacing: true,
        content: [
          `Rejected attempt summary: ${rejectedAttempt.summary}`,
          `Required difference: ${requiredDifference}`,
          `Preserve: ${preserveRule}`,
        ].join('\n'),
      },
      ...sharedContextLanes(currentStateSummary, responseDetail),
    ],
  };
}

export function buildContinueAssistantTailResponseJob({
  conversationId,
  assistantAnchor,
  priorUserMessageId,
  currentStateSummary,
  responseDetail,
}: BuildContinueAssistantTailResponseJobInput): RoleplayResponseJob {
  return {
    conversationId,
    mode: 'continue_assistant_tail',
    purpose: 'extend_accepted_assistant_response',
    playerTurn: null,
    currentStateSummary,
    responseDetail,
    historyPolicy: { strategy: 'anchor_on_accepted_assistant_tail' },
    modeData: {
      kind: 'continue_assistant_tail',
      assistantMessageId: assistantAnchor.messageId,
      assistantGenerationId: assistantAnchor.generationId,
      priorUserMessageId,
    },
    finalUserLanes: [
      {
        id: 'continue_anchor',
        kind: 'continue_anchor',
        sourceRole: 'assistant',
        authority: 'state',
        modelFacing: true,
        content: assistantAnchor.acceptedTextTail,
      },
      ...sharedContextLanes(currentStateSummary, responseDetail),
    ],
  };
}

export function buildDeletedAssistantRecoveryResponseJob({
  conversationId,
  visibleUserTail,
  deletedAssistantMessageId,
  deletedAssistantGenerationId,
  currentStateSummary,
  responseDetail,
}: BuildDeletedAssistantRecoveryResponseJobInput): RoleplayResponseJob {
  return {
    ...buildNormalSendResponseJob({
      conversationId,
      playerTurn: visibleUserTail,
      currentStateSummary,
      responseDetail,
    }),
    purpose: 'recover_after_deleted_assistant_response',
    modeData: {
      kind: 'normal_send',
      variant: 'deleted_assistant_recovery',
      deletedAssistantMessageId,
      deletedAssistantGenerationId,
      createsNewUserMessage: false,
      tailActionReason: 'assistant_reply_deleted_latest_user_tail',
    },
  };
}
