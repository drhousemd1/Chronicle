import { readFile } from 'node:fs/promises';

import {
  buildContinueAssistantTailResponseJob,
  buildDeletedAssistantRecoveryResponseJob,
  buildNormalSendResponseJob,
  buildRetryRegenerateResponseJob,
} from './roleplay-response-job';
import { resolveRoleplayContinueTailAction } from './continue-tail-action';
import { compileRoleplayRecentHistory } from './roleplay-recent-history';
import {
  runRoleplayRegressionFixtures,
  type RoleplayRegressionFixtureRun,
} from './roleplay-regression-fixture';
import { renderResponseJobSummary } from '../chat-debug/response-job-summary';
import { buildRoleplayApiMessages, REGENERATION_DIRECTIVE_TEXT } from '@/services/llm';
import { analyzeAssistantCandidateStyle } from '@/lib/assistant-style-directive';
import { buildChatReviewHtml } from '@/features/chat-debug/review-export';
import {
  buildActiveMemoriesWithPruningReport,
  buildMessageGenerationMap,
} from './effective-state';
import { buildMemoryFetchWithPruningReport } from '@/services/persistence/conversations';
import type { Memory, Message } from '@/types';
import { createDefaultScenarioData } from '@/utils';

export type RunRoleplayBatch1ValidationOptions = {
  gateIds?: string[];
  recordExecution?: Parameters<typeof runRoleplayRegressionFixtures>[0]['recordExecution'];
};

const COMMAND = 'npm run validation:roleplay:batch1';

function pretty(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function laneAuthorityArtifact() {
  const currentStateSummary = 'Kitchen scene remains active.';
  const normal = buildNormalSendResponseJob({
    conversationId: 'conversation-1',
    playerTurn: { messageId: 'message-user-1', text: 'I step closer.' },
    currentStateSummary,
    responseDetail: 'detailed',
  });
  const retry = buildRetryRegenerateResponseJob({
    conversationId: 'conversation-1',
    playerTurn: { messageId: 'message-user-1', text: 'I step closer.' },
    rejectedAttempt: {
      messageId: 'message-assistant-rejected',
      text: 'Full rejected attempt text must not become player authority.',
      summary: 'The rejected response repeated the same move.',
    },
    currentStateSummary,
    responseDetail: 'standard',
  });
  const continuation = buildContinueAssistantTailResponseJob({
    conversationId: 'conversation-1',
    assistantAnchor: {
      messageId: 'message-assistant-accepted',
      acceptedTextTail: 'Ashley keeps her hand on the counter.',
    },
    currentStateSummary,
    responseDetail: 'standard',
  });

  const normalPlayerLane = normal.finalUserLanes.find((lane) => lane.kind === 'player_turn');
  const normalCurrentStateLane = normal.finalUserLanes.find((lane) => lane.kind === 'current_state');
  const normalResponseDetailLane = normal.finalUserLanes.find((lane) => lane.kind === 'response_detail');
  const retryRejectionLane = retry.finalUserLanes.find((lane) => lane.kind === 'retry_rejection');
  const continueAnchorLane = continuation.finalUserLanes.find((lane) => lane.kind === 'continue_anchor');
  const retryExportSummary = renderResponseJobSummary({ requestBody: { responseJob: retry } });
  const continueExportSummary = renderResponseJobSummary({ requestBody: { responseJob: continuation } });

  const laneAuthorityValues = [
    normalPlayerLane?.authority,
    normalCurrentStateLane?.authority,
    normalResponseDetailLane?.authority,
    retryRejectionLane?.authority,
    continueAnchorLane?.authority,
  ];

  return pretty({
    normalPlayerAuthority: normalPlayerLane?.authority ?? 'missingAuthority',
    normalCurrentStateAuthority: normalCurrentStateLane?.authority ?? 'missingAuthority',
    normalResponseDetailAuthority: normalResponseDetailLane?.authority ?? 'missingAuthority',
    retryRejectionAuthority: retryRejectionLane?.authority ?? 'missingAuthority',
    continueAnchorAuthority: continueAnchorLane?.authority ?? 'missingAuthority',
    everyLaneHasAuthority: [...normal.finalUserLanes, ...retry.finalUserLanes, ...continuation.finalUserLanes]
      .every((lane) => typeof lane.authority === 'string' && lane.authority.length > 0),
    authorityVocabulary: [...new Set(laneAuthorityValues)].sort(),
    reviewExportShowsRetryAuthority: retryExportSummary.includes('retry_rejection / assistant / control / model-facing'),
    reviewExportShowsContinueAuthority: continueExportSummary.includes('continue_anchor / assistant / state / model-facing'),
    playerTurnLaneExcludesRuntimeState: !String(normalPlayerLane?.content ?? '').includes(currentStateSummary),
    retryFullRejectedTextModelFacing: retry.finalUserLanes
      .filter((lane) => lane.modelFacing)
      .some((lane) => lane.content.includes('Full rejected attempt text must not become player authority.')),
  });
}

async function structuredFinalUserRenderingArtifact() {
  const fallbackUserText = 'loose fallback text that should not render';
  const fallbackStateText = 'fallback current state should not render when responseJob lanes are present';
  const [
    llmSource,
    responseJobSummarySource,
  ] = await Promise.all([
    readFile('src/services/llm.ts', 'utf8'),
    readFile('src/features/chat-debug/response-job-summary.ts', 'utf8'),
  ]);
  const responseJob = buildNormalSendResponseJob({
    conversationId: 'conversation-1',
    playerTurn: {
      messageId: 'message-user-1',
      text: 'I step closer.',
    },
    currentStateSummary: 'Kitchen scene remains active.',
    responseDetail: 'detailed',
  });
  const built = buildRoleplayApiMessages({
    conversationMessages: [],
    systemInstruction: 'SYSTEM',
    userMessage: fallbackUserText,
    currentTurnStateDigest: `[CURRENT TURN STATE]\n- ${fallbackStateText}`,
    responseJob,
  });
  const debugExportSummary = renderResponseJobSummary({ requestBody: { responseJob } });

  return pretty({
    finalUserContent: built.finalUserContent,
    finalUserLaneEvidence: built.finalUserLaneEvidence,
    finalMessageIsRenderedFinalUserContent: built.messages.at(-1)?.content === built.finalUserContent,
    debugExportShowsResponseJobSummary: debugExportSummary.includes('Response Job Summary'),
    debugExportShowsNormalSendMode: debugExportSummary.includes('Mode</strong>normal_send'),
    debugExportShowsPlayerLaneAuthority: debugExportSummary.includes('player_turn / user / player_turn / model-facing'),
    debugExportShowsCurrentStateLaneAuthority: debugExportSummary.includes('current_state / runtime / state / model-facing'),
    debugExportShowsResponseDetailLaneAuthority: debugExportSummary.includes('response_detail / runtime / control / model-facing'),
    liveRequestCaptureIncludesResponseJob: llmSource.includes('responseJob: options?.responseJob ?? null'),
    liveRequestCaptureIncludesLaneEvidence: llmSource.includes('finalUserLaneEvidence,'),
    reviewExportReadsResponseJobFromCapturedRequestBody: responseJobSummarySource.includes('requestBody?.responseJob'),
    fallbackTextRendered: built.finalUserContent.includes(fallbackUserText),
    fallbackStateRendered: built.finalUserContent.includes(fallbackStateText),
  });
}

function oldContractRegressionArtifact() {
  const legacyFallbackText = 'legacy loose userMessage text should not control the response-job path';
  const legacyFallbackState = 'legacy currentTurnStateDigest should not control the response-job path';
  const responseJobCurrentState = 'Response-job current state controls the state lane.';
  const responseJobPlayerTurn = 'I choose a different angle.';
  const responseJobRejectedSummary = 'The prior answer repeated the same closing question.';
  const responseJob = buildRetryRegenerateResponseJob({
    conversationId: 'conversation-1',
    playerTurn: { messageId: 'message-user-1', text: responseJobPlayerTurn },
    rejectedAttempt: {
      messageId: 'message-assistant-rejected',
      text: 'Full rejected attempt text remains archival and must not become the player turn.',
      summary: responseJobRejectedSummary,
    },
    currentStateSummary: responseJobCurrentState,
    responseDetail: 'standard',
  });

  const withResponseJob = buildRoleplayApiMessages({
    conversationMessages: [],
    systemInstruction: 'SYSTEM',
    userMessage: legacyFallbackText,
    currentTurnStateDigest: `[CURRENT TURN STATE]\n- ${legacyFallbackState}`,
    isRegeneration: true,
    responseJob,
  });
  const withoutResponseJob = buildRoleplayApiMessages({
    conversationMessages: [],
    systemInstruction: 'SYSTEM',
    userMessage: legacyFallbackText,
    currentTurnStateDigest: `[CURRENT TURN STATE]\n- ${legacyFallbackState}`,
    isRegeneration: true,
  });

  const legacyRegenerationDirectiveRenderedInResponseJobPath =
    withResponseJob.finalUserContent.includes(REGENERATION_DIRECTIVE_TEXT)
    || withResponseJob.finalUserContent.includes('Change the execution rather than the situation');

  return pretty({
    responseJobWinsOverLegacyUserMessage:
      withResponseJob.finalUserContent.includes(responseJobPlayerTurn)
      && !withResponseJob.finalUserContent.includes(legacyFallbackText),
    responseJobWinsOverLegacyCurrentState:
      withResponseJob.finalUserContent.includes(responseJobCurrentState)
      && !withResponseJob.finalUserContent.includes(legacyFallbackState),
    responseJobWinsOverLegacyRegenerationDirective: !legacyRegenerationDirectiveRenderedInResponseJobPath,
    legacyPathStillExistsWithoutResponseJob:
      withoutResponseJob.finalUserContent.includes('[APP TURN CONTROLS]')
      && withoutResponseJob.finalUserContent.includes(REGENERATION_DIRECTIVE_TEXT)
      && withoutResponseJob.finalUserContent.includes(legacyFallbackText)
      && withoutResponseJob.finalUserContent.includes(legacyFallbackState),
    finalMessageUsesResponseJobContent: withResponseJob.messages.at(-1)?.content === withResponseJob.finalUserContent,
    responseJobLaneEvidencePresent:
      withResponseJob.finalUserLaneEvidence.some((lane) => lane.kind === 'player_turn')
      && withResponseJob.finalUserLaneEvidence.some((lane) => lane.kind === 'retry_rejection')
      && withResponseJob.finalUserLaneEvidence.some((lane) => lane.kind === 'current_state'),
    retryRejectionSummaryRendered: withResponseJob.finalUserContent.includes(responseJobRejectedSummary),
    legacyFallbackTextRendered: withResponseJob.finalUserContent.includes(legacyFallbackText),
    legacyFallbackStateRendered: withResponseJob.finalUserContent.includes(legacyFallbackState),
    legacyRegenerationDirectiveRenderedInResponseJobPath,
  });
}

const ISSUE_02_ESTABLISHED_FACT_NOTE = '[ESTABLISHED FACT NOTE: User wrote content for AI character(s) in this message. That content is already true in the scene -- do not re-narrate it. Continue the story from after those events.]';
const ISSUE_02_PLAYER_TURN = 'Sarah: "Keep your hands where I can see them."';
const ISSUE_02_REJECTED_FULL_TEXT = 'Sarah: *Sarah repeats the same motion and pauses at the end.* "What do you do next?"';
const ISSUE_02_REJECTED_SUMMARY = 'The rejected response repeated the same action/dialogue/final-question pattern and needs a meaningfully different answer.';
const ISSUE_03_TITLE = 'Retry Superseded-Generation Contamination';
const ISSUE_03_ACTIVE_MEMORY = 'Sarah stayed by the hearth after the accepted retry.';
const ISSUE_03_STALE_MEMORY = 'Sarah walked away in the rejected attempt.';
const ISSUE_04_TITLE = 'Continue Rewrite Failure';
const ISSUE_04_USER_TAIL = 'What does she do next?';
const ISSUE_04_DELETED_ASSISTANT_TEXT = 'Deleted assistant text must stay out of accepted state and continue anchors.';

function buildIssue02RetryJob() {
  return buildRetryRegenerateResponseJob({
    conversationId: 'conversation-1',
    playerTurn: { messageId: 'message-user-retry-source', text: ISSUE_02_PLAYER_TURN },
    establishedFactNote: ISSUE_02_ESTABLISHED_FACT_NOTE,
    rejectedAttempt: {
      messageId: 'message-assistant-rejected',
      text: ISSUE_02_REJECTED_FULL_TEXT,
      summary: ISSUE_02_REJECTED_SUMMARY,
    },
    currentStateSummary: 'Kitchen scene remains active.',
    responseDetail: 'detailed',
  });
}

function issue02RetryJobContractArtifact() {
  const retry = buildIssue02RetryJob();
  const playerTurnLane = retry.finalUserLanes.find((lane) => lane.kind === 'player_turn');
  const establishedFactLane = retry.finalUserLanes.find((lane) => lane.kind === 'established_fact_note');
  const retryRejectionLane = retry.finalUserLanes.find((lane) => lane.kind === 'retry_rejection');

  return pretty({
    mode: retry.mode,
    purpose: retry.purpose,
    historyPolicy: retry.historyPolicy,
    finalUserLaneKinds: retry.finalUserLanes.map((lane) => lane.kind),
    playerTurnLaneContainsOnlyRawPlayerText: playerTurnLane?.content === ISSUE_02_PLAYER_TURN,
    establishedFactLaneExists: Boolean(establishedFactLane),
    establishedFactLaneAuthority: establishedFactLane?.authority ?? 'missing',
    establishedFactLaneSourceRole: establishedFactLane?.sourceRole ?? 'missing',
    retryRejectionLaneAuthority: retryRejectionLane?.authority ?? 'missing',
    retryRejectionLaneContent: retryRejectionLane?.content ?? 'missing',
    rejectedAttemptSummaryStored: retry.modeData.kind === 'retry_regenerate'
      ? retry.modeData.rejectedAttemptSummary
      : 'missing',
    rejectedFullTextModelFacing: retry.finalUserLanes
      .filter((lane) => lane.modelFacing)
      .some((lane) => lane.content.includes(ISSUE_02_REJECTED_FULL_TEXT)),
    establishedFactNoteCopiedIntoPlayerTurn: String(playerTurnLane?.content ?? '').includes('ESTABLISHED FACT NOTE'),
  });
}

function issue02ProviderLaneSnapshotArtifact() {
  const retry = buildIssue02RetryJob();
  const poisonedLegacyFallback = `${ISSUE_02_ESTABLISHED_FACT_NOTE}\n${ISSUE_02_PLAYER_TURN}\n${ISSUE_02_REJECTED_FULL_TEXT}`;
  const rendered = buildRoleplayApiMessages({
    conversationMessages: [],
    systemInstruction: 'SYSTEM',
    userMessage: poisonedLegacyFallback,
    currentTurnStateDigest: '[CURRENT TURN STATE]\n- poisoned legacy current state',
    isRegeneration: true,
    responseJob: retry,
  });

  return pretty({
    finalUserContent: rendered.finalUserContent,
    finalUserLaneEvidence: rendered.finalUserLaneEvidence,
    finalMessageUsesResponseJobContent: rendered.messages.at(-1)?.content === rendered.finalUserContent,
    finalUserContentShowsPlayerTurnLane:
      rendered.finalUserContent.includes('[player_turn | user | player_turn | model-facing]'),
    finalUserContentShowsEstablishedFactLane:
      rendered.finalUserContent.includes('[established_fact_note | runtime | state | model-facing]'),
    finalUserContentShowsRetryRejectionLane:
      rendered.finalUserContent.includes('[retry_rejection | assistant | control | model-facing]'),
    finalUserContentShowsCurrentStateLane:
      rendered.finalUserContent.includes('[current_state | runtime | state | model-facing]'),
    finalUserContentShowsRetrySummary: rendered.finalUserContent.includes(ISSUE_02_REJECTED_SUMMARY),
    poisonedLegacyFallbackRendered: rendered.finalUserContent.includes(poisonedLegacyFallback),
    rejectedFullTextRendered: rendered.finalUserContent.includes(ISSUE_02_REJECTED_FULL_TEXT),
    legacyRegenerationDirectiveRendered: rendered.finalUserContent.includes(REGENERATION_DIRECTIVE_TEXT),
    laneEvidenceIncludesRetryRejection:
      rendered.finalUserLaneEvidence.some((lane) => lane.kind === 'retry_rejection' && lane.authority === 'control'),
    laneEvidenceIncludesEstablishedFact:
      rendered.finalUserLaneEvidence.some((lane) => lane.kind === 'established_fact_note' && lane.authority === 'state'),
  });
}

async function issue02RetryContrastMetricsArtifact() {
  const chatInterfaceSource = await readFile('src/components/chronicle/ChatInterfaceTab.tsx', 'utf8');
  const regenerateSlice = chatInterfaceSource.slice(
    chatInterfaceSource.indexOf('const handleRegenerateMessage = async'),
    chatInterfaceSource.indexOf('const handleContinueConversation = async'),
  );
  const repeatedCandidate = 'Sarah: *Sarah repeats the same motion and pauses at the end.* "What do you do next?"';
  const telemetry = analyzeAssistantCandidateStyle(
    [{ role: 'assistant', text: ISSUE_02_REJECTED_FULL_TEXT }],
    repeatedCandidate,
    [12],
    [ISSUE_02_REJECTED_FULL_TEXT],
  );

  return pretty({
    telemetrySource: telemetry.source,
    telemetryDiagnosticOnly: telemetry.diagnosticOnly,
    hiddenRetryAllowed: telemetry.hiddenRetryAllowed,
    candidateTelemetryTriggered: telemetry.triggered,
    candidateTelemetryFlags: telemetry.flags,
    repeatedShortDialogue: telemetry.repeatedShortDialogue,
    repeatedContentTerms: telemetry.repeatedContentTerms,
    retryUsesRejectedAttemptComparisonText:
      regenerateSlice.includes('[existingMessage.text]'),
    retryRecordsRegenerateStyleTelemetry:
      regenerateSlice.includes("buildAssistantStyleTelemetryCall('regenerate'"),
    retryCandidateStyleUsesCleanedText:
      regenerateSlice.includes('analyzeAssistantCandidateStyle(')
      && regenerateSlice.includes('cleanedText'),
    hiddenSecondRetryPathCreated:
      regenerateSlice.includes('collectRoleplayResponse({')
      && regenerateSlice.split('collectRoleplayResponse({').length - 1 > 1,
  });
}

async function issue02DebugExportArtifact() {
  const chatInterfaceSource = await readFile('src/components/chronicle/ChatInterfaceTab.tsx', 'utf8');
  const regenerateSlice = chatInterfaceSource.slice(
    chatInterfaceSource.indexOf('const handleRegenerateMessage = async'),
    chatInterfaceSource.indexOf('const handleContinueConversation = async'),
  );
  const retry = buildIssue02RetryJob();
  const summary = renderResponseJobSummary({ requestBody: { responseJob: retry } });

  return pretty({
    debugExportShowsResponseJobSummary: summary.includes('Response Job Summary'),
    debugExportShowsRetryMode: summary.includes('Mode</strong>retry_regenerate'),
    debugExportShowsRetryHistoryTreatment: summary.includes('History treatment</strong>exclude_rejected_attempt'),
    debugExportShowsEstablishedFactLane: summary.includes('established_fact_note / runtime / state / model-facing'),
    debugExportShowsRetryRejectionLane: summary.includes('retry_rejection / assistant / control / model-facing'),
    debugExportShowsRetrySummary: summary.includes(ISSUE_02_REJECTED_SUMMARY),
    debugExportLeaksFullRejectedText: summary.includes(ISSUE_02_REJECTED_FULL_TEXT),
    liveRetryBuilderReceivesEstablishedFactNote: regenerateSlice.includes('establishedFactNote,'),
    liveRetryPlayerTurnUsesRawUserMessage: regenerateSlice.includes('text: userMessage.text'),
    liveRetryCollectorUsesRawCompatibilityUserMessage: regenerateSlice.includes('userMessage: userMessage.text'),
    liveRetryStillBuildsPreviousAssistantContext:
      regenerateSlice.includes('previousAssistantContext')
      || regenerateSlice.includes('regenInput')
      || regenerateSlice.includes('PREVIOUS ASSISTANT RESPONSE BEING REGENERATED'),
    debugExportLaneInventoryExcerpt: summary
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  });
}

const issue03Message = (id: string, generationId: string): Message => ({
  id,
  generationId,
  role: 'assistant',
  text: id,
  createdAt: 1,
});

const issue03Memory = (patch: Partial<Memory>): Memory => ({
  id: patch.id || 'memory-1',
  conversationId: patch.conversationId || 'conversation-1',
  content: patch.content || ISSUE_03_ACTIVE_MEMORY,
  day: patch.day ?? 1,
  timeOfDay: patch.timeOfDay ?? 'day',
  source: patch.source || 'message',
  entryType: patch.entryType || 'bullet',
  sourceMessageId: patch.sourceMessageId,
  sourceGenerationId: patch.sourceGenerationId,
  createdAt: patch.createdAt ?? 1,
  updatedAt: patch.updatedAt ?? 1,
});

function buildIssue03StateFixture() {
  const messages = [
    issue03Message('message-ai-1', 'generation-current'),
    issue03Message('message-ai-2', 'generation-current-2'),
  ];
  const memories = [
    issue03Memory({
      id: 'memory-current',
      content: ISSUE_03_ACTIVE_MEMORY,
      sourceMessageId: 'message-ai-1',
      sourceGenerationId: 'generation-current',
    }),
    issue03Memory({
      id: 'memory-stale',
      content: ISSUE_03_STALE_MEMORY,
      sourceMessageId: 'message-ai-1',
      sourceGenerationId: 'generation-stale',
    }),
    issue03Memory({
      id: 'memory-deleted-source',
      content: 'Deleted-source memory should not survive.',
      sourceMessageId: 'message-deleted',
      sourceGenerationId: 'generation-deleted',
    }),
  ];
  const generationMap = buildMessageGenerationMap(messages);
  const { activeMemories, pruningReports } = buildActiveMemoriesWithPruningReport(memories, generationMap);

  return { messages, memories, activeMemories, pruningReports };
}

function issue03RegenerateStatePruningArtifact() {
  const { activeMemories, pruningReports } = buildIssue03StateFixture();

  return pretty({
    activeMemoryIds: activeMemories.map((memory) => memory.id),
    pruningReports,
    staleMemoryIncludedAsActive: activeMemories.some((memory) => memory.id === 'memory-stale'),
    deletedSourceMemoryIncludedAsActive: activeMemories.some((memory) => memory.id === 'memory-deleted-source'),
    currentMemoryHasIncludedReport: pruningReports.some((report) => report.itemId === 'memory-current' && report.included && report.reason === 'current_generation'),
    staleMemoryHasPrunedReport: pruningReports.some((report) => report.itemId === 'memory-stale' && !report.included && report.reason === 'stale_generation'),
    deletedSourceMemoryHasPrunedReport: pruningReports.some((report) => report.itemId === 'memory-deleted-source' && !report.included && report.reason === 'deleted_source_message'),
  });
}

function issue03PersistenceMemoryPruningArtifact() {
  const { messages, memories } = buildIssue03StateFixture();
  const { activeMemories, pruningReports } = buildMemoryFetchWithPruningReport(
    memories,
    buildMessageGenerationMap(messages),
  );

  return pretty({
    activeMemoryIds: activeMemories.map((memory) => memory.id),
    pruningReportCount: pruningReports.length,
    pruningReports,
    staleMemoryReturned: activeMemories.some((memory) => memory.id === 'memory-stale'),
    deletedSourceMemoryReturned: activeMemories.some((memory) => memory.id === 'memory-deleted-source'),
    persistencePreservesReviewReport:
      pruningReports.some((report) => report.itemId === 'memory-stale' && report.reason === 'stale_generation')
      && pruningReports.some((report) => report.itemId === 'memory-deleted-source' && report.reason === 'deleted_source_message'),
  });
}

function issue03ReviewExportPruningArtifact() {
  const appData = createDefaultScenarioData();
  appData.world.core.scenarioName = 'Issue 3 pruning review';
  appData.conversations = [{
    id: 'conversation-1',
    title: 'Issue 3 pruning review',
    currentDay: 1,
    currentTimeOfDay: 'day',
    messages: [
      {
        id: 'message-user-1',
        role: 'user',
        text: 'James: "Stay here."',
        createdAt: 1,
      },
      {
        id: 'message-ai-1',
        generationId: 'generation-current',
        role: 'assistant',
        text: 'Sarah: "I am staying by the hearth."',
        createdAt: 2,
      },
    ],
    createdAt: 1,
    updatedAt: 2,
  }];
  const { pruningReports } = buildIssue03StateFixture();
  const html = buildChatReviewHtml({
    appData,
    conversation: appData.conversations[0],
    scenarioTitle: 'Issue 3 pruning review',
    modelId: 'fixture-model',
    exportedAt: new Date('2026-07-06T12:00:00.000Z'),
    sanitizeAssistantText: (text) => text,
    statePruningReports: {
      'message-ai-1:generation-current': pruningReports,
    },
  });

  return pretty({
    exportShowsStatePruningReport: html.includes('State Pruning Report'),
    exportShowsActiveCurrentMemory: html.includes('memory-current') && html.includes('current_generation'),
    exportShowsPrunedStaleMemory: html.includes('memory-stale') && html.includes('stale_generation'),
    exportShowsDeletedSourceMemory: html.includes('memory-deleted-source') && html.includes('deleted_source_message'),
    exportTreatsPruningAsAppliedUpdates: html.includes('Applied Updates Summary (3)') || html.includes('Applied Updates Summary (2)'),
    embeddedDebugDataIncludesPruningReports:
      html.includes('"statePruningReports"')
      && html.includes('memory-stale')
      && html.includes('memory-deleted-source'),
  });
}

function issue03PromptLeakageGuardArtifact() {
  const { activeMemories, pruningReports } = buildIssue03StateFixture();
  const currentStateSummary = activeMemories.map((memory) => memory.content).join(' | ');
  const responseJob = buildRetryRegenerateResponseJob({
    conversationId: 'conversation-1',
    playerTurn: { messageId: 'message-user-1', text: 'I tell Sarah to stay near the hearth.' },
    rejectedAttempt: {
      messageId: 'message-ai-rejected',
      text: 'Sarah walks away in the rejected full attempt text.',
      summary: 'The rejected attempt moved Sarah away from the hearth.',
    },
    currentStateSummary,
    responseDetail: 'standard',
  });
  const rendered = buildRoleplayApiMessages({
    conversationMessages: [],
    systemInstruction: 'SYSTEM',
    userMessage: 'legacy fallback should not control response-job path',
    currentTurnStateDigest: `[CURRENT TURN STATE]\n- ${ISSUE_03_STALE_MEMORY}\n- pruning report stale_generation`,
    isRegeneration: true,
    responseJob,
  });

  return pretty({
    finalUserContent: rendered.finalUserContent,
    pruningReports,
    activeMemoryRendered: rendered.finalUserContent.includes(ISSUE_03_ACTIVE_MEMORY),
    staleMemoryRendered: rendered.finalUserContent.includes(ISSUE_03_STALE_MEMORY),
    pruningReasonRendered:
      rendered.finalUserContent.includes('stale_generation')
      || rendered.finalUserContent.includes('deleted_source_message'),
    debugOnlyReportRendered:
      rendered.finalUserContent.includes('memory-stale')
      || rendered.finalUserContent.includes('State Pruning Report'),
  });
}

function issue04AssistantTailContinueArtifact() {
  const action = resolveRoleplayContinueTailAction({
    messages: [
      { id: 'user-prior-1', role: 'user', text: ISSUE_04_USER_TAIL, generationId: 'generation-user-prior-1' },
      {
        id: 'assistant-accepted-1',
        role: 'assistant',
        text: 'She starts to answer and reaches for the door.',
        generationId: 'generation-assistant-accepted-1',
      },
    ],
  });
  if (action.kind !== 'continue_assistant_tail') {
    return pretty({ actionKind: action.kind });
  }

  const responseJob = buildContinueAssistantTailResponseJob({
    conversationId: 'conversation-1',
    assistantAnchor: {
      messageId: action.assistantMessageId,
      generationId: action.assistantGenerationId,
      acceptedTextTail: action.assistantMessage.text,
    },
    priorUserMessageId: action.priorUserMessage?.id,
    currentStateSummary: 'Kitchen scene remains active.',
    responseDetail: 'standard',
  });
  const rendered = buildRoleplayApiMessages({
    conversationMessages: [],
    systemInstruction: 'SYSTEM',
    userMessage: 'legacy continue prompt should not become player_turn lane',
    responseJob,
  });

  return pretty({
    continueMode: responseJob.mode,
    continuePurpose: responseJob.purpose,
    assistantAnchorId: responseJob.modeData.kind === 'continue_assistant_tail'
      ? responseJob.modeData.assistantMessageId
      : 'missing',
    assistantGenerationId: responseJob.modeData.kind === 'continue_assistant_tail'
      ? responseJob.modeData.assistantGenerationId
      : 'missing',
    priorUserMessageId: responseJob.modeData.kind === 'continue_assistant_tail'
      ? responseJob.modeData.priorUserMessageId
      : 'missing',
    playerTurnIsNull: responseJob.playerTurn === null,
    continueAnchorLaneRendered: rendered.finalUserContent.includes('[continue_anchor | assistant | state | model-facing]'),
    playerTurnLaneRendered: rendered.finalUserContent.includes('[player_turn'),
    legacyContinuePromptRendered: rendered.finalUserContent.includes('legacy continue prompt should not become player_turn lane'),
  });
}

async function issue04UserTailEligibilityGuardArtifact() {
  const chatInterfaceSource = await readFile('src/components/chronicle/ChatInterfaceTab.tsx', 'utf8');
  const continueSlice = chatInterfaceSource.slice(
    chatInterfaceSource.indexOf('const handleContinueConversation = async'),
    chatInterfaceSource.indexOf('// Generate scene image from recent conversation context'),
  );
  const latestUserTailAction = resolveRoleplayContinueTailAction({
    messages: [
      { id: 'user-latest-1', role: 'user', text: ISSUE_04_USER_TAIL, generationId: 'generation-user-latest-1' },
    ],
  });
  const recoveryTailAction = resolveRoleplayContinueTailAction({
    messages: [
      { id: 'user-latest-1', role: 'user', text: ISSUE_04_USER_TAIL, generationId: 'generation-user-latest-1' },
    ],
    deletedAssistantRecovery: {
      deletedAssistantMessageId: 'assistant-deleted-1',
      deletedAssistantGenerationId: 'generation-assistant-deleted-1',
      sourceUserMessageId: 'user-latest-1',
    },
  });

  return pretty({
    latestUserTailActionKind: latestUserTailAction.kind,
    recoveryTailActionKind: recoveryTailAction.kind,
    liveHandlerImportsRecoveryBuilder: chatInterfaceSource.includes('buildDeletedAssistantRecoveryResponseJob'),
    liveHandlerBuildsRecoveryJob: continueSlice.includes('buildDeletedAssistantRecoveryResponseJob({'),
    liveHandlerUsesSharedTailResolver: continueSlice.includes('resolveContinueTailActionForMessages(conversation.messages)'),
    liveHandlerStillHasAssistantOnlyEarlyReturn: continueSlice.includes("lastRoleplayMessage.role !== 'assistant'"),
    latestUserTailBuildsContinueJob: latestUserTailAction.kind === 'continue_assistant_tail',
    deletedAssistantRecoveryBuildsContinueJob: recoveryTailAction.kind === 'continue_assistant_tail',
  });
}

function issue04DeletedAssistantRecoveryArtifact() {
  const responseJob = buildDeletedAssistantRecoveryResponseJob({
    conversationId: 'conversation-1',
    visibleUserTail: {
      messageId: 'user-latest-1',
      text: ISSUE_04_USER_TAIL,
    },
    deletedAssistantMessageId: 'assistant-deleted-1',
    deletedAssistantGenerationId: 'generation-assistant-deleted-1',
    currentStateSummary: 'The latest visible message is user-authored because the assistant reply was deleted.',
    responseDetail: 'detailed',
  });
  const rendered = buildRoleplayApiMessages({
    conversationMessages: [
      {
        id: 'assistant-deleted-1',
        role: 'assistant',
        text: ISSUE_04_DELETED_ASSISTANT_TEXT,
        createdAt: 1,
      },
    ],
    systemInstruction: 'SYSTEM',
    userMessage: 'legacy fallback should not create a duplicate user row',
    responseJob,
  });
  const userTailOccurrences = rendered.finalUserContent.split(ISSUE_04_USER_TAIL).length - 1;

  return pretty({
    recoveryMode: responseJob.mode,
    recoveryPurpose: responseJob.purpose,
    recoveryVariant: responseJob.modeData.kind === 'normal_send' ? responseJob.modeData.variant : 'missing',
    deletedAssistantMessageId: responseJob.modeData.kind === 'normal_send' ? responseJob.modeData.deletedAssistantMessageId : 'missing',
    deletedAssistantGenerationId: responseJob.modeData.kind === 'normal_send' ? responseJob.modeData.deletedAssistantGenerationId : 'missing',
    createsNewUserMessage: responseJob.modeData.kind === 'normal_send' ? responseJob.modeData.createsNewUserMessage : true,
    tailActionReason: responseJob.modeData.kind === 'normal_send' ? responseJob.modeData.tailActionReason : 'missing',
    visibleUserTailRenderedOnce: userTailOccurrences === 1,
    deletedAssistantTextRendered: rendered.finalUserContent.includes(ISSUE_04_DELETED_ASSISTANT_TEXT),
    continueAnchorRendered: rendered.finalUserContent.includes('[continue_anchor'),
    legacyFallbackRendered: rendered.finalUserContent.includes('legacy fallback should not create a duplicate user row'),
  });
}

function issue04OutputDebugAdvancementArtifact() {
  const continueJob = buildContinueAssistantTailResponseJob({
    conversationId: 'conversation-1',
    assistantAnchor: {
      messageId: 'assistant-accepted-1',
      generationId: 'generation-assistant-accepted-1',
      acceptedTextTail: 'She starts to answer and reaches for the door.',
    },
    priorUserMessageId: 'user-prior-1',
    currentStateSummary: 'Kitchen scene remains active.',
    responseDetail: 'standard',
  });
  const recoveryJob = buildDeletedAssistantRecoveryResponseJob({
    conversationId: 'conversation-1',
    visibleUserTail: {
      messageId: 'user-latest-1',
      text: ISSUE_04_USER_TAIL,
    },
    deletedAssistantMessageId: 'assistant-deleted-1',
    deletedAssistantGenerationId: 'generation-assistant-deleted-1',
    currentStateSummary: 'The latest visible message is user-authored because the assistant reply was deleted.',
    responseDetail: 'detailed',
  });
  const continueSummary = renderResponseJobSummary({ requestBody: { responseJob: continueJob } });
  const recoverySummary = renderResponseJobSummary({ requestBody: { responseJob: recoveryJob } });

  return pretty({
    continueDebugShowsMode: continueSummary.includes('Mode</strong>continue_assistant_tail'),
    continueDebugShowsAnchor: continueSummary.includes('assistant-accepted-1')
      && continueSummary.includes('generation-assistant-accepted-1'),
    continueDebugShowsPriorUserBoundary: continueSummary.includes('user-prior-1'),
    recoveryDebugShowsVariant: recoverySummary.includes('Normal send variant</strong>deleted_assistant_recovery'),
    recoveryDebugShowsNoNewUserRow: recoverySummary.includes('Creates new user message</strong>false'),
    recoveryDebugShowsReason: recoverySummary.includes('Tail action reason</strong>assistant_reply_deleted_latest_user_tail'),
    debugTreatsRecoveryAsFourthMode:
      recoverySummary.includes('Mode</strong>deleted_assistant_recovery')
      || recoveryJob.mode === 'continue_assistant_tail',
  });
}

function authorityConflictArtifact() {
  const playerAction = 'I leave the doorway and sit on the couch.';
  const conflictingCurrentState = 'Current state says the player-controlled character is still standing in the doorway.';
  const responseJob = buildNormalSendResponseJob({
    conversationId: 'conversation-1',
    playerTurn: { messageId: 'message-user-1', text: playerAction },
    currentStateSummary: conflictingCurrentState,
    responseDetail: 'standard',
  });
  const built = buildRoleplayApiMessages({
    conversationMessages: [],
    systemInstruction: 'SYSTEM',
    userMessage: 'legacy fallback text should not control the conflict fixture',
    currentTurnStateDigest: `[CURRENT TURN STATE]\n- ${conflictingCurrentState}`,
    responseJob,
  });
  const playerLane = responseJob.finalUserLanes.find((lane) => lane.kind === 'player_turn');
  const currentStateLane = responseJob.finalUserLanes.find((lane) => lane.kind === 'current_state');
  const playerLaneIndex = built.finalUserContent.indexOf('[player_turn | user | player_turn | model-facing]');
  const currentStateLaneIndex = built.finalUserContent.indexOf('[current_state | runtime | state | model-facing]');

  return pretty({
    playerTurnLanePrecedesCurrentStateLane:
      playerLaneIndex >= 0 && currentStateLaneIndex >= 0 && playerLaneIndex < currentStateLaneIndex,
    playerTurnAuthorityVisible: built.finalUserContent.includes('[player_turn | user | player_turn | model-facing]'),
    currentStateAuthorityVisible: built.finalUserContent.includes('[current_state | runtime | state | model-facing]'),
    currentStateStillAvailable: built.finalUserContent.includes(conflictingCurrentState),
    conflictPriorityRuleRendered: built.finalUserContent.includes('When player_turn conflicts with current_state'),
    laneEvidenceSeparatesPlayerTurnAndState:
      built.finalUserLaneEvidence.some((lane) => lane.kind === 'player_turn' && lane.authority === 'player_turn')
      && built.finalUserLaneEvidence.some((lane) => lane.kind === 'current_state' && lane.authority === 'state'),
    currentStateCopiedIntoPlayerTurnLane: String(playerLane?.content ?? '').includes(conflictingCurrentState),
    playerActionCopiedIntoCurrentStateLane: String(currentStateLane?.content ?? '').includes(playerAction),
  });
}

const ISSUE_27_ESTABLISHED_FACT_NOTE = '[ESTABLISHED FACT NOTE: User wrote content for AI character(s) in this message. That content is already true in the scene -- do not re-narrate it. Continue the story from after those events.]';
const ISSUE_27_PLAYER_TURN = 'Sarah: "Keep your hands where I can see them."';

function buildIssue27NormalSendJob() {
  return buildNormalSendResponseJob({
    conversationId: 'conversation-1',
    playerTurn: { messageId: 'message-user-established-fact', text: ISSUE_27_PLAYER_TURN },
    establishedFactNote: ISSUE_27_ESTABLISHED_FACT_NOTE,
    currentStateSummary: 'Kitchen scene remains active.',
    responseDetail: 'detailed',
  });
}

function issue27NormalSendLaneArtifact() {
  const responseJob = buildIssue27NormalSendJob();
  const establishedFactLane = responseJob.finalUserLanes.find((lane) => lane.kind === 'established_fact_note');
  const playerTurnLane = responseJob.finalUserLanes.find((lane) => lane.kind === 'player_turn');
  const rendered = buildRoleplayApiMessages({
    conversationMessages: [],
    systemInstruction: 'SYSTEM',
    userMessage: `${ISSUE_27_ESTABLISHED_FACT_NOTE} legacy fallback text`,
    responseJob,
  });

  return pretty({
    finalUserLaneKinds: responseJob.finalUserLanes.map((lane) => lane.kind),
    hasEstablishedFactLane: Boolean(establishedFactLane),
    establishedFactLaneAuthority: establishedFactLane?.authority ?? 'missing',
    establishedFactLaneSourceRole: establishedFactLane?.sourceRole ?? 'missing',
    playerTurnLaneContainsOnlyRawPlayerText: playerTurnLane?.content === ISSUE_27_PLAYER_TURN,
    establishedFactNoteCopiedIntoPlayerTurn: String(playerTurnLane?.content ?? '').includes('ESTABLISHED FACT NOTE'),
    renderedShowsEstablishedFactLane: rendered.finalUserContent.includes('[established_fact_note | runtime | state | model-facing]'),
    renderedShowsPlayerTurnLane: rendered.finalUserContent.includes('[player_turn | user | player_turn | model-facing]'),
    retryOrContinueLaneRendered:
      rendered.finalUserContent.includes('[retry_rejection')
      || rendered.finalUserContent.includes('[continue_anchor'),
  });
}

function issue27ApiCallRenderingArtifact() {
  const responseJob = buildIssue27NormalSendJob();
  const poisonedLegacyUserMessage = `${ISSUE_27_ESTABLISHED_FACT_NOTE} poisoned legacy player turn`;
  const rendered = buildRoleplayApiMessages({
    conversationMessages: [],
    systemInstruction: 'SYSTEM',
    userMessage: poisonedLegacyUserMessage,
    currentTurnStateDigest: '[CURRENT TURN STATE]\n- poisoned legacy current-state fallback',
    responseJob,
  });

  return pretty({
    responseJobWinsOverPoisonedUserMessage:
      rendered.finalUserContent.includes(ISSUE_27_PLAYER_TURN)
      && !rendered.finalUserContent.includes('poisoned legacy player turn'),
    finalUserContentShowsEstablishedFactLane:
      rendered.finalUserContent.includes('[established_fact_note | runtime | state | model-facing]'),
    finalUserContentShowsPlayerTurnLane:
      rendered.finalUserContent.includes('[player_turn | user | player_turn | model-facing]'),
    poisonedLegacyUserMessageRendered: rendered.finalUserContent.includes('poisoned legacy player turn'),
    poisonedLegacyCurrentStateRendered: rendered.finalUserContent.includes('poisoned legacy current-state fallback'),
    finalMessageUsesResponseJobContent: rendered.messages.at(-1)?.content === rendered.finalUserContent,
  });
}

async function issue27LiveContractGuardArtifact() {
  const [chatInterfaceSource, collectSource] = await Promise.all([
    readFile('src/components/chronicle/ChatInterfaceTab.tsx', 'utf8'),
    readFile('src/features/chat-runtime/collect-roleplay-response.ts', 'utf8'),
  ]);
  const normalSendBlock = chatInterfaceSource.slice(
    chatInterfaceSource.indexOf('const normalSendResponseJob = buildNormalSendResponseJob'),
    chatInterfaceSource.indexOf('const responseResult = await collectRoleplayResponse', chatInterfaceSource.indexOf('const normalSendResponseJob = buildNormalSendResponseJob')),
  );
  const collectBlock = chatInterfaceSource.slice(
    chatInterfaceSource.indexOf('const responseResult = await collectRoleplayResponse'),
    chatInterfaceSource.indexOf('const cleanedText = responseResult.cleanedText', chatInterfaceSource.indexOf('const responseResult = await collectRoleplayResponse')),
  );

  return pretty({
    normalSendBuilderReceivesEstablishedFactNote: normalSendBlock.includes('establishedFactNote,'),
    normalSendPlayerTurnUsesRawUserInput: normalSendBlock.includes('text: userInput'),
    collectRoleplayResponseUsesRawCompatibilityUserMessage: collectBlock.includes('userMessage: userInput'),
    collectRoleplayResponsePassesResponseJob: collectBlock.includes('responseJob: normalSendResponseJob'),
    collectForwardsResponseJobToGenerator: collectSource.includes('responseJob,') && collectSource.includes('generateStream('),
    oldMixedLlmInputControlsNormalSend:
      chatInterfaceSource.includes('const llmInput = establishedFactNote + input')
      || normalSendBlock.includes('text: llmInput')
      || collectBlock.includes('userMessage: llmInput'),
  });
}

function issue27DebugExportArtifact() {
  const responseJob = buildIssue27NormalSendJob();
  const summary = renderResponseJobSummary({ requestBody: { responseJob } });

  return pretty({
    debugExportShowsResponseJobSummary: summary.includes('Response Job Summary'),
    debugExportShowsNormalSendMode: summary.includes('Mode</strong>normal_send'),
    debugExportShowsEstablishedFactLane: summary.includes('established_fact_note / runtime / state / model-facing'),
    debugExportShowsPlayerTurnLane: summary.includes('player_turn / user / player_turn / model-facing'),
    debugExportShowsLanePreview: summary.includes('User wrote content for AI character') && summary.includes('Keep your hands where I can see them'),
    debugExportClaimsFullSourceReceiptCoverage: summary.includes('RoleplaySourceReceipt'),
    debugExportRepresentsNoteAsPlayerAuthored: summary.includes('established_fact_note / user / player_turn'),
    debugExportLaneInventoryExcerpt: summary
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  });
}

function issue22ParentMessageBoundaryArtifact() {
  const appData = createDefaultScenarioData();
  appData.world.core.scenarioName = 'Issue 22 parent-message boundary';
  appData.conversations = [{
    id: 'issue-22-conversation',
    title: 'Issue 22 parent-message boundary',
    currentDay: 1,
    currentTimeOfDay: 'day',
    messages: [
      {
        id: 'issue-22-user',
        role: 'user',
        text: 'James: "Show me both responses."',
        createdAt: 1,
      },
      {
        id: 'issue-22-assistant',
        generationId: 'issue-22-generation',
        role: 'assistant',
        text: 'Sarah: *She checks the room.* "First."\n\nAshley: *She stays beside Sarah.* "Second."',
        createdAt: 2,
      },
    ],
    createdAt: 1,
    updatedAt: 2,
  }];
  const html = buildChatReviewHtml({
    appData,
    conversation: appData.conversations[0],
    scenarioTitle: 'Issue 22 parent-message boundary',
    modelId: 'fixture-model',
    exportedAt: new Date('2026-07-10T12:00:00.000Z'),
    sanitizeAssistantText: (text) => text,
    messageComments: {
      'issue-22-assistant': {
        messageId: 'issue-22-assistant',
        generationId: 'issue-22-generation',
        note: 'Parent-owned tester note.',
        tags: ['Speaker Flow'],
        createdAt: 3,
        updatedAt: 3,
      },
    },
    debugRecords: {
      'issue-22-assistant:issue-22-generation': {
        messageId: 'issue-22-assistant',
        generationId: 'issue-22-generation',
        capturedAt: 4,
        trace: null,
        call1Request: {
          id: 'issue-22-call1',
          label: 'API Call 1 - Issue 22 parent fixture',
          apiCallGroup: 'call_1',
          endpoint: '/functions/v1/chat',
          capturedAt: 4,
          requestBody: { messages: [] },
        },
      },
    },
    retryAttemptHistory: {
      'issue-22-assistant': [{
        messageId: 'issue-22-assistant',
        generationId: 'issue-22-rejected-generation',
        attemptNumber: 1,
        capturedAt: 5,
        text: 'Rejected attempt.',
        createdAt: 5,
      }],
    },
  });
  const count = (needle: string) => html.split(needle).length - 1;

  return pretty({
    savedMessageParentCount: count('class="message-parent-card'),
    assistantParentCount: count('data-parent-message-id="issue-22-assistant"'),
    nestedChildCardCount: count('class="message-child-card'),
    parentNoteSectionCount: count('<section class="live-comment">'),
    retryHistorySectionCount: count('Retry Attempt History'),
    apiCall1SectionCount: count('API Call 1 Data'),
    noteIndexTargetsParent: html.includes('href="#review-issue-22-assistant"'),
    embeddedParentContractPresent:
      html.includes('"parentMessages"')
      && html.includes('"parserDiagnostics"')
      && html.includes('"parentMetrics"'),
    childCardsRenderedAsTopLevelMessages: html.includes('class="message-card message-child-card'),
    parentOwnedEvidenceDuplicatedAcrossChildren:
      count('<section class="live-comment">') > 1
      || count('Retry Attempt History') > 1
      || count('API Call 1 Data') > 1,
  });
}

function issue26RecentHistoryRegressionArtifact() {
  const normalMessages: Message[] = [
    { id: 'issue-26-user-1', role: 'user', text: 'I wait for her answer.', createdAt: 1 },
    {
      id: 'issue-26-assistant-old',
      generationId: 'issue-26-generation-old',
      role: 'assistant',
      text: 'Mara: *She rests against the balcony rail.* "What do you do next?"',
      createdAt: 2,
    },
    { id: 'issue-26-user-2', role: 'user', text: 'I ask her to decide.', createdAt: 3 },
    {
      id: 'issue-26-assistant-latest',
      generationId: 'issue-26-generation-latest',
      role: 'assistant',
      text: 'Mara: *She finally chooses a direction.* "What do you do next?"',
      createdAt: 4,
    },
  ];
  const normal = compileRoleplayRecentHistory({
    messages: normalMessages,
    userStateAuthorityDecisions: [{
      claim: 'The user character visibly steadies one hand.',
      claimType: 'bodily_reaction',
      sourceMessageId: 'issue-26-assistant-old',
      sourceGenerationId: 'issue-26-generation-old',
      sourceRole: 'assistant',
      authority: 'accepted_assistant_observable_change',
      modelFacingAction: 'allow_as_observation',
      reason: 'accepted_assistant_generation_with_observable_change',
    }],
    limit: 5,
    isLocalNotice: (message) => message.localNotice != null,
  });

  const retryJob = buildRetryRegenerateResponseJob({
    conversationId: 'conversation-1',
    playerTurn: { messageId: 'issue-26-user-retry', text: 'Try again.' },
    rejectedAttempt: {
      messageId: 'issue-26-assistant-rejected',
      generationId: 'issue-26-generation-rejected',
      text: 'Rejected full text must remain outside accepted history.',
      summary: 'The prior answer repeated the same closing move.',
    },
    currentStateSummary: 'The room remains unchanged.',
    responseDetail: 'standard',
  });
  const retry = compileRoleplayRecentHistory({
    messages: [
      { id: 'issue-26-user-retry', role: 'user', text: 'Try again.', createdAt: 1 },
      {
        id: 'issue-26-assistant-rejected',
        generationId: 'issue-26-generation-rejected',
        role: 'assistant',
        text: 'Rejected full text must remain outside accepted history.',
        createdAt: 2,
      },
    ],
    responseJob: retryJob,
    limit: 5,
    isLocalNotice: (message) => message.localNotice != null,
  });

  const continueJob = buildContinueAssistantTailResponseJob({
    conversationId: 'conversation-1',
    assistantAnchor: {
      messageId: 'issue-26-assistant-tail',
      generationId: 'issue-26-generation-tail',
      acceptedTextTail: 'Mara: "I have decided."',
    },
    priorUserMessageId: 'issue-26-user-continue',
    currentStateSummary: 'The room remains unchanged.',
    responseDetail: 'standard',
  });
  const continuation = compileRoleplayRecentHistory({
    messages: [
      { id: 'issue-26-user-continue', role: 'user', text: 'I wait.', createdAt: 1 },
      {
        id: 'issue-26-assistant-tail',
        generationId: 'issue-26-generation-tail',
        role: 'assistant',
        text: 'Mara: "I have decided."',
        createdAt: 2,
      },
    ],
    responseJob: continueJob,
    limit: 5,
    isLocalNotice: (message) => message.localNotice != null,
  });

  return pretty({
    normalProviderContent: normal.packet.providerMessages.map((message) => message.content),
    normalReceipts: normal.packet.receipts,
    normalSuppressedAnchors: normal.packet.suppressedStyleAnchors,
    retryProviderContent: retry.packet.providerMessages.map((message) => message.content),
    retryReceipts: retry.packet.receipts,
    continueProviderContent: continuation.packet.providerMessages.map((message) => message.content),
    continueReceipts: continuation.packet.receipts,
    normalKeepsLatestAssistant: normal.packet.providerMessages.some((message) => message.content.includes('finally chooses a direction')),
    normalUsesStructuredOutcomeSummary: normal.packet.receipts.some((receipt) => (
      receipt.messageId === 'issue-26-assistant-old'
      && receipt.treatment === 'outcome_summary'
      && receipt.sourceAuthorityDecisionCount === 1
    )),
    normalSummaryPreservesApprovedObservation: normal.packet.providerMessages
      .some((message) => message.content.includes('The user character visibly steadies one hand.')),
    normalSummaryExcludesDistinctiveOldAssistantWording: !normal.packet.providerMessages
      .some((message) => message.content.includes('rests against the balcony rail')),
    normalRemovesRepeatedAnchorFromOlderAssistant: normal.packet.providerMessages
      .filter((message) => message.content.includes('What do you do next?')).length === 1,
    retryRejectsFullTextFromHistory: !retry.packet.providerMessages.some((message) => message.content.includes('Rejected full text')),
    retryHasContrastReceipt: retry.packet.receipts.some((receipt) => receipt.responseJobSource === 'retry_contrast' && !receipt.includedInProviderHistory),
    continueAvoidsTailDuplication: !continuation.packet.providerMessages.some((message) => message.content.includes('I have decided')),
    continueHasAnchorReceipt: continuation.packet.receipts.some((receipt) => receipt.responseJobSource === 'continue_anchor' && !receipt.includedInProviderHistory),
    retryOrContinueInventsOutcomeSummary: [retry, continuation]
      .some((result) => result.packet.receipts.some((receipt) => receipt.treatment === 'outcome_summary')),
  });
}

export async function runRoleplayBatch1Validation({
  gateIds,
  recordExecution,
}: RunRoleplayBatch1ValidationOptions = {}): Promise<RoleplayRegressionFixtureRun> {
  return runRoleplayRegressionFixtures({
    gateIds,
    exactCommand: COMMAND,
    recordExecution,
    fixtures: [
      {
        id: 'issue-03-regenerate-state-pruning-fixture',
        issueNumber: 3,
        issueTitle: ISSUE_03_TITLE,
        validationPhase: 'Validation Phase 1: Regenerate State Pruning Fixture',
        commandOrFixture: COMMAND,
        manualReview: 'Manual review should confirm the pruning report wording is understandable; it does not replace the structural active-versus-pruned assertions.',
        createArtifact: () => ({ text: issue03RegenerateStatePruningArtifact() }),
        positiveAssertions: [
          { label: 'current generation memory stays active', includes: '"memory-current"' },
          { label: 'stale memory is reported', includes: '"memory-stale"' },
          { label: 'stale memory is pruned', includes: '"reason": "stale_generation"' },
          { label: 'deleted source memory is pruned', includes: '"reason": "deleted_source_message"' },
          { label: 'current memory has included report', includes: '"currentMemoryHasIncludedReport": true' },
          { label: 'stale memory has pruned report', includes: '"staleMemoryHasPrunedReport": true' },
        ],
        negativeAssertions: [
          { label: 'stale memory is not active', excludes: '"staleMemoryIncludedAsActive": true' },
          { label: 'deleted-source memory is not active', excludes: '"deletedSourceMemoryIncludedAsActive": true' },
        ],
      },
      {
        id: 'issue-03-persistence-memory-pruning-proof',
        issueNumber: 3,
        issueTitle: ISSUE_03_TITLE,
        validationPhase: 'Validation Phase 2: Persistence Memory Pruning Proof',
        commandOrFixture: COMMAND,
        manualReview: 'Manual review should only inspect whether active and pruned persisted-memory rows are readable in the generated evidence.',
        createArtifact: () => ({ text: issue03PersistenceMemoryPruningArtifact() }),
        positiveAssertions: [
          { label: 'persistence returns active current memory', includes: '"memory-current"' },
          { label: 'persistence emits all pruning reports', includes: '"pruningReportCount": 3' },
          { label: 'persistence preserves review report', includes: '"persistencePreservesReviewReport": true' },
        ],
        negativeAssertions: [
          { label: 'stale persisted memory is not returned active', excludes: '"staleMemoryReturned": true' },
          { label: 'deleted-source persisted memory is not returned active', excludes: '"deletedSourceMemoryReturned": true' },
        ],
      },
      {
        id: 'issue-03-review-export-pruning-proof',
        issueNumber: 3,
        issueTitle: ISSUE_03_TITLE,
        validationPhase: 'Validation Phase 3: Debug Export Pruning Report',
        commandOrFixture: COMMAND,
        manualReview: 'Manual review should confirm the exported report distinguishes active rows from pruned rows without presenting pruned values as applied updates.',
        createArtifact: () => ({ text: issue03ReviewExportPruningArtifact() }),
        positiveAssertions: [
          { label: 'export shows pruning report section', includes: '"exportShowsStatePruningReport": true' },
          { label: 'export shows active current memory', includes: '"exportShowsActiveCurrentMemory": true' },
          { label: 'export shows pruned stale memory', includes: '"exportShowsPrunedStaleMemory": true' },
          { label: 'export shows deleted-source pruning', includes: '"exportShowsDeletedSourceMemory": true' },
          { label: 'embedded debug data includes pruning reports', includes: '"embeddedDebugDataIncludesPruningReports": true' },
        ],
        negativeAssertions: [
          { label: 'export does not treat pruning as applied updates', excludes: '"exportTreatsPruningAsAppliedUpdates": true' },
        ],
      },
      {
        id: 'issue-03-prompt-leakage-guard',
        issueNumber: 3,
        issueTitle: ISSUE_03_TITLE,
        validationPhase: 'Validation Phase 4: Prompt Leakage Guard',
        commandOrFixture: COMMAND,
        manualReview: 'No manual review is required for the structural leakage guard unless the response-job lane format changes unexpectedly.',
        createArtifact: () => ({ text: issue03PromptLeakageGuardArtifact() }),
        positiveAssertions: [
          { label: 'active memory renders into current state', includes: '"activeMemoryRendered": true' },
        ],
        negativeAssertions: [
          { label: 'stale memory does not render model-facing', excludes: '"staleMemoryRendered": true' },
          { label: 'pruning reason does not render model-facing', excludes: '"pruningReasonRendered": true' },
          { label: 'debug-only pruning report does not render model-facing', excludes: '"debugOnlyReportRendered": true' },
        ],
      },
      {
        id: 'issue-04-assistant-tail-continue-fixture',
        issueNumber: 4,
        issueTitle: ISSUE_04_TITLE,
        validationPhase: 'Validation Phase 1: Assistant-Tail Continue Fixture',
        commandOrFixture: COMMAND,
        manualReview: 'Manual playthrough should later confirm the continuation reads like a forward extension, but this fixture proves the typed assistant-tail request shape.',
        createArtifact: () => ({ text: issue04AssistantTailContinueArtifact() }),
        positiveAssertions: [
          { label: 'continue mode is explicit', includes: '"continueMode": "continue_assistant_tail"' },
          { label: 'continue purpose extends accepted assistant response', includes: '"continuePurpose": "extend_accepted_assistant_response"' },
          { label: 'assistant anchor id is carried', includes: '"assistantAnchorId": "assistant-accepted-1"' },
          { label: 'assistant generation id is carried', includes: '"assistantGenerationId": "generation-assistant-accepted-1"' },
          { label: 'prior user boundary is carried', includes: '"priorUserMessageId": "user-prior-1"' },
          { label: 'continue has no player turn', includes: '"playerTurnIsNull": true' },
          { label: 'continue anchor lane renders', includes: '"continueAnchorLaneRendered": true' },
        ],
        negativeAssertions: [
          { label: 'continue does not render player turn lane', excludes: '"playerTurnLaneRendered": true' },
          { label: 'legacy continue prompt does not render', excludes: '"legacyContinuePromptRendered": true' },
        ],
      },
      {
        id: 'issue-04-user-tail-eligibility-guard',
        issueNumber: 4,
        issueTitle: ISSUE_04_TITLE,
        validationPhase: 'Validation Phase 2: User-Tail Eligibility Fixture',
        commandOrFixture: COMMAND,
        manualReview: 'Manual UI review should later confirm the affordance is understandable; this fixture proves ordinary user tails do not become Continue requests.',
        createArtifact: async () => ({ text: await issue04UserTailEligibilityGuardArtifact() }),
        positiveAssertions: [
          { label: 'ordinary latest user tail is unavailable', includes: '"latestUserTailActionKind": "unavailable"' },
          { label: 'matching deleted assistant marker selects recovery', includes: '"recoveryTailActionKind": "normal_send_deleted_assistant_recovery"' },
          { label: 'live handler imports recovery builder', includes: '"liveHandlerImportsRecoveryBuilder": true' },
          { label: 'live handler builds recovery job', includes: '"liveHandlerBuildsRecoveryJob": true' },
          { label: 'live handler uses shared resolver', includes: '"liveHandlerUsesSharedTailResolver": true' },
        ],
        negativeAssertions: [
          { label: 'live handler no longer has assistant-only early return', excludes: '"liveHandlerStillHasAssistantOnlyEarlyReturn": true' },
          { label: 'ordinary latest user tail does not build continue job', excludes: '"latestUserTailBuildsContinueJob": true' },
          { label: 'deleted assistant recovery does not build continue job', excludes: '"deletedAssistantRecoveryBuildsContinueJob": true' },
        ],
      },
      {
        id: 'issue-04-deleted-assistant-recovery-fixture',
        issueNumber: 4,
        issueTitle: ISSUE_04_TITLE,
        validationPhase: 'Validation Phase 3: Deleted-Assistant Recovery Fixture',
        commandOrFixture: COMMAND,
        manualReview: 'Manual playthrough should later confirm recovery feels natural after deleting a bad assistant reply; this fixture proves the structural request does not create a dummy user row.',
        createArtifact: () => ({ text: issue04DeletedAssistantRecoveryArtifact() }),
        positiveAssertions: [
          { label: 'recovery uses normal send', includes: '"recoveryMode": "normal_send"' },
          { label: 'recovery purpose is explicit', includes: '"recoveryPurpose": "recover_after_deleted_assistant_response"' },
          { label: 'recovery variant is explicit', includes: '"recoveryVariant": "deleted_assistant_recovery"' },
          { label: 'deleted assistant id is carried', includes: '"deletedAssistantMessageId": "assistant-deleted-1"' },
          { label: 'deleted assistant generation is carried', includes: '"deletedAssistantGenerationId": "generation-assistant-deleted-1"' },
          { label: 'recovery records no new user row', includes: '"createsNewUserMessage": false' },
          { label: 'recovery reason is explicit', includes: '"tailActionReason": "assistant_reply_deleted_latest_user_tail"' },
          { label: 'visible user tail renders once', includes: '"visibleUserTailRenderedOnce": true' },
        ],
        negativeAssertions: [
          { label: 'deleted assistant text does not render', excludes: '"deletedAssistantTextRendered": true' },
          { label: 'recovery does not render continue anchor', excludes: '"continueAnchorRendered": true' },
          { label: 'legacy fallback does not render', excludes: '"legacyFallbackRendered": true' },
        ],
      },
      {
        id: 'issue-04-output-debug-advancement-proof',
        issueNumber: 4,
        issueTitle: ISSUE_04_TITLE,
        validationPhase: 'Validation Phase 4: Output And Debug Advancement Proof',
        commandOrFixture: COMMAND,
        manualReview: 'Manual review should inspect whether the exported labels are readable and whether the final roleplay continuation feels like forward movement after deterministic checks pass.',
        createArtifact: () => ({ text: issue04OutputDebugAdvancementArtifact() }),
        positiveAssertions: [
          { label: 'continue debug shows mode', includes: '"continueDebugShowsMode": true' },
          { label: 'continue debug shows anchor', includes: '"continueDebugShowsAnchor": true' },
          { label: 'continue debug shows prior user boundary', includes: '"continueDebugShowsPriorUserBoundary": true' },
          { label: 'recovery debug shows variant', includes: '"recoveryDebugShowsVariant": true' },
          { label: 'recovery debug shows no new user row', includes: '"recoveryDebugShowsNoNewUserRow": true' },
          { label: 'recovery debug shows reason', includes: '"recoveryDebugShowsReason": true' },
        ],
        negativeAssertions: [
          { label: 'debug does not treat recovery as fourth mode', excludes: '"debugTreatsRecoveryAsFourthMode": true' },
        ],
      },
      {
        id: 'issue-05-final-user-lane-authority',
        issueNumber: 5,
        issueTitle: 'Final User Wrapper Over-Authority',
        validationPhase: 'Validation Phase 1: API Call Lane Fixtures',
        commandOrFixture: COMMAND,
        manualReview: 'Manual review should only confirm that exported lane authority labels are readable; it does not replace the structural lane authority assertions.',
        createArtifact: () => ({ text: laneAuthorityArtifact() }),
        positiveAssertions: [
          { label: 'normal player turn has player authority', includes: '"normalPlayerAuthority": "player_turn"' },
          { label: 'normal current state has state authority', includes: '"normalCurrentStateAuthority": "state"' },
          { label: 'response detail has control authority', includes: '"normalResponseDetailAuthority": "control"' },
          { label: 'retry rejection summary has control authority', includes: '"retryRejectionAuthority": "control"' },
          { label: 'continue anchor has state authority', includes: '"continueAnchorAuthority": "state"' },
          { label: 'every lane has authority metadata', includes: '"everyLaneHasAuthority": true' },
          { label: 'review export shows retry authority', includes: '"reviewExportShowsRetryAuthority": true' },
          { label: 'review export shows continue authority', includes: '"reviewExportShowsContinueAuthority": true' },
          { label: 'player turn excludes runtime state', includes: '"playerTurnLaneExcludesRuntimeState": true' },
        ],
        negativeAssertions: [
          { label: 'no lane reports missing authority', excludes: 'missingAuthority' },
          { label: 'full rejected text is not model-facing', excludes: '"retryFullRejectedTextModelFacing": true' },
        ],
      },
      {
        id: 'issue-05-structured-final-user-rendering',
        issueNumber: 5,
        issueTitle: 'Final User Wrapper Over-Authority',
        validationPhase: 'Validation Phase 2: Debug Export Fixture',
        commandOrFixture: COMMAND,
        manualReview: 'Manual review should confirm that rendered lane labels and compact lane evidence are readable in the downstream debug/export surface.',
        createArtifact: async () => ({ text: await structuredFinalUserRenderingArtifact() }),
        positiveAssertions: [
          { label: 'rendered player turn lane includes authority', includes: '[player_turn | user | player_turn | model-facing]' },
          { label: 'rendered current state lane includes authority', includes: '[current_state | runtime | state | model-facing]' },
          { label: 'rendered response detail lane includes authority', includes: '[response_detail | runtime | control | model-facing]' },
          { label: 'lane evidence includes player turn kind', includes: '"kind": "player_turn"' },
          { label: 'lane evidence includes player authority', includes: '"authority": "player_turn"' },
          { label: 'lane evidence includes content length', includes: '"contentLength": 14' },
          { label: 'lane evidence includes content preview', includes: '"contentPreview": "I step closer."' },
          { label: 'final API user message uses rendered response-job content', includes: '"finalMessageIsRenderedFinalUserContent": true' },
          { label: 'debug export shows response-job summary', includes: '"debugExportShowsResponseJobSummary": true' },
          { label: 'debug export shows normal send mode', includes: '"debugExportShowsNormalSendMode": true' },
          { label: 'debug export shows player lane authority', includes: '"debugExportShowsPlayerLaneAuthority": true' },
          { label: 'debug export shows current state lane authority', includes: '"debugExportShowsCurrentStateLaneAuthority": true' },
          { label: 'debug export shows response detail lane authority', includes: '"debugExportShowsResponseDetailLaneAuthority": true' },
          { label: 'live request capture includes response job', includes: '"liveRequestCaptureIncludesResponseJob": true' },
          { label: 'live request capture includes lane evidence', includes: '"liveRequestCaptureIncludesLaneEvidence": true' },
          { label: 'review export reads response job from captured request body', includes: '"reviewExportReadsResponseJobFromCapturedRequestBody": true' },
        ],
        negativeAssertions: [
          { label: 'legacy fallback user text does not render', excludes: '"fallbackTextRendered": true' },
          { label: 'legacy fallback current state does not render', excludes: '"fallbackStateRendered": true' },
        ],
      },
      {
        id: 'issue-05-old-contract-regression',
        issueNumber: 5,
        issueTitle: 'Final User Wrapper Over-Authority',
        validationPhase: 'Validation Phase 3: Old Contract Regression Checks',
        commandOrFixture: COMMAND,
        manualReview: 'Manual review should confirm the legacy no-response-job path is documented as compatibility plumbing only, not the preferred active control path.',
        createArtifact: () => ({ text: oldContractRegressionArtifact() }),
        positiveAssertions: [
          { label: 'response job wins over legacy userMessage', includes: '"responseJobWinsOverLegacyUserMessage": true' },
          { label: 'response job wins over legacy current state digest', includes: '"responseJobWinsOverLegacyCurrentState": true' },
          { label: 'response job wins over legacy regeneration directive', includes: '"responseJobWinsOverLegacyRegenerationDirective": true' },
          { label: 'legacy path remains available only without response job', includes: '"legacyPathStillExistsWithoutResponseJob": true' },
          { label: 'final message uses response-job content', includes: '"finalMessageUsesResponseJobContent": true' },
          { label: 'response-job lane evidence is present', includes: '"responseJobLaneEvidencePresent": true' },
          { label: 'retry rejection summary renders as compact control evidence', includes: '"retryRejectionSummaryRendered": true' },
        ],
        negativeAssertions: [
          { label: 'legacy fallback text does not render in response-job path', excludes: '"legacyFallbackTextRendered": true' },
          { label: 'legacy fallback state does not render in response-job path', excludes: '"legacyFallbackStateRendered": true' },
          { label: 'legacy regeneration directive does not render in response-job path', excludes: '"legacyRegenerationDirectiveRenderedInResponseJobPath": true' },
        ],
      },
      {
        id: 'issue-05-authority-conflict-proof',
        issueNumber: 5,
        issueTitle: 'Final User Wrapper Over-Authority',
        validationPhase: 'Validation Phase 4: Authority Conflict Proof',
        commandOrFixture: COMMAND,
        manualReview: 'Manual review should only confirm the structural conflict example is understandable; semantic state reconciliation remains owned by Issue #6.',
        createArtifact: () => ({ text: authorityConflictArtifact() }),
        positiveAssertions: [
          { label: 'player turn lane precedes current state lane', includes: '"playerTurnLanePrecedesCurrentStateLane": true' },
          { label: 'player turn authority is visible', includes: '"playerTurnAuthorityVisible": true' },
          { label: 'current state authority is visible', includes: '"currentStateAuthorityVisible": true' },
          { label: 'conflicting current state remains available', includes: '"currentStateStillAvailable": true' },
          { label: 'wrapper renders conflict priority rule', includes: '"conflictPriorityRuleRendered": true' },
          { label: 'lane evidence separates player turn and state', includes: '"laneEvidenceSeparatesPlayerTurnAndState": true' },
        ],
        negativeAssertions: [
          { label: 'current state is not copied into player turn lane', excludes: '"currentStateCopiedIntoPlayerTurnLane": true' },
          { label: 'player action is not copied into current state lane', excludes: '"playerActionCopiedIntoCurrentStateLane": true' },
        ],
      },
      {
        id: 'issue-27-normal-send-lane-fixture',
        issueNumber: 27,
        issueTitle: 'Established-Fact Note Mixed Into Player Turn',
        validationPhase: 'Validation Phase 1: Normal Send Lane Fixture',
        commandOrFixture: COMMAND,
        manualReview: 'Manual review should confirm the lane labels are understandable; it does not replace the structural proof that the established-fact note is outside the player-turn lane.',
        createArtifact: () => ({ text: issue27NormalSendLaneArtifact() }),
        positiveAssertions: [
          { label: 'established fact lane exists', includes: '"hasEstablishedFactLane": true' },
          { label: 'established fact lane uses state authority', includes: '"establishedFactLaneAuthority": "state"' },
          { label: 'established fact lane is runtime-authored', includes: '"establishedFactLaneSourceRole": "runtime"' },
          { label: 'player turn lane contains only raw player text', includes: '"playerTurnLaneContainsOnlyRawPlayerText": true' },
          { label: 'rendered content shows established fact lane', includes: '"renderedShowsEstablishedFactLane": true' },
          { label: 'rendered content shows player turn lane', includes: '"renderedShowsPlayerTurnLane": true' },
        ],
        negativeAssertions: [
          { label: 'established fact note is not copied into player turn', excludes: '"establishedFactNoteCopiedIntoPlayerTurn": true' },
          { label: 'normal send does not render retry or continue lanes', excludes: '"retryOrContinueLaneRendered": true' },
        ],
      },
      {
        id: 'issue-27-api-call-rendering-snapshot',
        issueNumber: 27,
        issueTitle: 'Established-Fact Note Mixed Into Player Turn',
        validationPhase: 'Validation Phase 2: API Call Rendering Snapshot',
        commandOrFixture: COMMAND,
        manualReview: 'No manual review is required for the responseJob-over-userMessage structural snapshot unless the snapshot changes unexpectedly.',
        createArtifact: () => ({ text: issue27ApiCallRenderingArtifact() }),
        positiveAssertions: [
          { label: 'response job wins over poisoned legacy userMessage', includes: '"responseJobWinsOverPoisonedUserMessage": true' },
          { label: 'final user content shows established fact lane', includes: '"finalUserContentShowsEstablishedFactLane": true' },
          { label: 'final user content shows player turn lane', includes: '"finalUserContentShowsPlayerTurnLane": true' },
          { label: 'final message uses response-job content', includes: '"finalMessageUsesResponseJobContent": true' },
        ],
        negativeAssertions: [
          { label: 'poisoned legacy userMessage does not render', excludes: '"poisonedLegacyUserMessageRendered": true' },
          { label: 'poisoned legacy current state does not render', excludes: '"poisonedLegacyCurrentStateRendered": true' },
        ],
      },
      {
        id: 'issue-27-live-contract-guard',
        issueNumber: 27,
        issueTitle: 'Established-Fact Note Mixed Into Player Turn',
        validationPhase: 'Validation Phase 3: Live Contract Guard',
        commandOrFixture: COMMAND,
        manualReview: 'Manual review should only confirm the compatibility fallback is documented clearly; the source guard proves the live send path uses responseJob.',
        createArtifact: async () => ({ text: await issue27LiveContractGuardArtifact() }),
        positiveAssertions: [
          { label: 'normal send builder receives established fact note', includes: '"normalSendBuilderReceivesEstablishedFactNote": true' },
          { label: 'normal send player turn uses raw user input', includes: '"normalSendPlayerTurnUsesRawUserInput": true' },
          { label: 'collector receives raw compatibility userMessage', includes: '"collectRoleplayResponseUsesRawCompatibilityUserMessage": true' },
          { label: 'collector receives normal send response job', includes: '"collectRoleplayResponsePassesResponseJob": true' },
          { label: 'collector forwards response job to generator', includes: '"collectForwardsResponseJobToGenerator": true' },
        ],
        negativeAssertions: [
          { label: 'old mixed llmInput no longer controls normal send', excludes: '"oldMixedLlmInputControlsNormalSend": true' },
        ],
      },
      {
        id: 'issue-27-debug-export-proof',
        issueNumber: 27,
        issueTitle: 'Established-Fact Note Mixed Into Player Turn',
        validationPhase: 'Validation Phase 4: Debug Export Proof',
        commandOrFixture: COMMAND,
        manualReview: 'Manual review should confirm a non-coder can distinguish the app-authored note from the player-authored turn in the export.',
        createArtifact: () => ({ text: issue27DebugExportArtifact() }),
        positiveAssertions: [
          { label: 'debug export shows response-job summary', includes: '"debugExportShowsResponseJobSummary": true' },
          { label: 'debug export shows normal send mode', includes: '"debugExportShowsNormalSendMode": true' },
          { label: 'debug export shows established fact lane', includes: '"debugExportShowsEstablishedFactLane": true' },
          { label: 'debug export shows player turn lane', includes: '"debugExportShowsPlayerTurnLane": true' },
          { label: 'debug export shows lane preview', includes: '"debugExportShowsLanePreview": true' },
        ],
        negativeAssertions: [
          { label: 'debug export does not claim full source receipt coverage', excludes: '"debugExportClaimsFullSourceReceiptCoverage": true' },
          { label: 'debug export does not represent note as player-authored', excludes: '"debugExportRepresentsNoteAsPlayerAuthored": true' },
        ],
      },
      {
        id: 'issue-02-retry-job-contract-fixture',
        issueNumber: 2,
        issueTitle: 'Retry Button Failure',
        validationPhase: 'Validation Phase 1: Retry Job Contract Fixture',
        commandOrFixture: COMMAND,
        manualReview: 'No manual review required for the response-job contract shape; this fixture proves retry_regenerate owns the compact rejected-attempt control lane.',
        createArtifact: () => ({ text: issue02RetryJobContractArtifact() }),
        positiveAssertions: [
          { label: 'retry mode is explicit', includes: '"mode": "retry_regenerate"' },
          { label: 'retry purpose is replacement', includes: '"purpose": "replace_rejected_assistant_response"' },
          { label: 'retry excludes rejected attempt from history', includes: '"strategy": "exclude_rejected_attempt"' },
          { label: 'player turn lane contains only raw player text', includes: '"playerTurnLaneContainsOnlyRawPlayerText": true' },
          { label: 'established fact lane exists', includes: '"establishedFactLaneExists": true' },
          { label: 'established fact lane uses state authority', includes: '"establishedFactLaneAuthority": "state"' },
          { label: 'retry rejection lane uses control authority', includes: '"retryRejectionLaneAuthority": "control"' },
          { label: 'rejected attempt summary is stored', includes: `"rejectedAttemptSummaryStored": ${JSON.stringify(ISSUE_02_REJECTED_SUMMARY)}` },
        ],
        negativeAssertions: [
          { label: 'full rejected text is not model-facing', excludes: '"rejectedFullTextModelFacing": true' },
          { label: 'established fact note is not copied into player turn', excludes: '"establishedFactNoteCopiedIntoPlayerTurn": true' },
        ],
      },
      {
        id: 'issue-02-provider-lane-snapshot',
        issueNumber: 2,
        issueTitle: 'Retry Button Failure',
        validationPhase: 'Validation Phase 2: Provider Message Lane Snapshot',
        commandOrFixture: COMMAND,
        manualReview: 'No manual review is required unless the rendered response-job lane format changes unexpectedly.',
        createArtifact: () => ({ text: issue02ProviderLaneSnapshotArtifact() }),
        positiveAssertions: [
          { label: 'final message uses response-job content', includes: '"finalMessageUsesResponseJobContent": true' },
          { label: 'final user content shows player turn lane', includes: '"finalUserContentShowsPlayerTurnLane": true' },
          { label: 'final user content shows established fact lane', includes: '"finalUserContentShowsEstablishedFactLane": true' },
          { label: 'final user content shows retry rejection lane', includes: '"finalUserContentShowsRetryRejectionLane": true' },
          { label: 'final user content shows current state lane', includes: '"finalUserContentShowsCurrentStateLane": true' },
          { label: 'final user content shows compact retry summary', includes: '"finalUserContentShowsRetrySummary": true' },
          { label: 'lane evidence includes retry rejection', includes: '"laneEvidenceIncludesRetryRejection": true' },
          { label: 'lane evidence includes established fact note', includes: '"laneEvidenceIncludesEstablishedFact": true' },
        ],
        negativeAssertions: [
          { label: 'legacy poisoned fallback does not render', excludes: '"poisonedLegacyFallbackRendered": true' },
          { label: 'full rejected text does not render provider-facing', excludes: '"rejectedFullTextRendered": true' },
          { label: 'legacy regeneration directive does not render in response-job path', excludes: '"legacyRegenerationDirectiveRendered": true' },
        ],
      },
      {
        id: 'issue-02-retry-contrast-metrics',
        issueNumber: 2,
        issueTitle: 'Retry Button Failure',
        validationPhase: 'Validation Phase 3: Retry Contrast Metrics Fixture',
        commandOrFixture: COMMAND,
        manualReview: 'Manual review should only inspect the exported telemetry wording; it does not replace the deterministic proof that retry compares the new candidate against the rejected attempt.',
        createArtifact: async () => ({ text: await issue02RetryContrastMetricsArtifact() }),
        positiveAssertions: [
          { label: 'candidate telemetry is diagnostic-only', includes: '"telemetryDiagnosticOnly": true' },
          { label: 'candidate telemetry is triggered for repeated retry output', includes: '"candidateTelemetryTriggered": true' },
          { label: 'candidate telemetry records reused dialogue', includes: 'reused_short_dialogue_phrasing' },
          { label: 'retry compares candidate against rejected attempt', includes: '"retryUsesRejectedAttemptComparisonText": true' },
          { label: 'retry records regenerate style telemetry', includes: '"retryRecordsRegenerateStyleTelemetry": true' },
          { label: 'retry candidate style uses cleaned text', includes: '"retryCandidateStyleUsesCleanedText": true' },
        ],
        negativeAssertions: [
          { label: 'style telemetry does not allow hidden retry', excludes: '"hiddenRetryAllowed": true' },
          { label: 'retry does not create a hidden second provider call', excludes: '"hiddenSecondRetryPathCreated": true' },
        ],
      },
      {
        id: 'issue-02-debug-export-review',
        issueNumber: 2,
        issueTitle: 'Retry Button Failure',
        validationPhase: 'Validation Phase 4: Debug Export Review',
        commandOrFixture: COMMAND,
        manualReview: 'Manual review should confirm a non-coder can see retry_regenerate mode, the compact rejected-attempt summary, and the separated established-fact lane in the export.',
        createArtifact: async () => ({ text: await issue02DebugExportArtifact() }),
        positiveAssertions: [
          { label: 'debug export shows response-job summary', includes: '"debugExportShowsResponseJobSummary": true' },
          { label: 'debug export shows retry mode', includes: '"debugExportShowsRetryMode": true' },
          { label: 'debug export shows retry history treatment', includes: '"debugExportShowsRetryHistoryTreatment": true' },
          { label: 'debug export shows established fact lane', includes: '"debugExportShowsEstablishedFactLane": true' },
          { label: 'debug export shows retry rejection lane', includes: '"debugExportShowsRetryRejectionLane": true' },
          { label: 'debug export shows compact retry summary', includes: '"debugExportShowsRetrySummary": true' },
          { label: 'live retry builder receives established fact note', includes: '"liveRetryBuilderReceivesEstablishedFactNote": true' },
          { label: 'live retry player turn uses raw user message', includes: '"liveRetryPlayerTurnUsesRawUserMessage": true' },
          { label: 'live retry collector uses raw compatibility user message', includes: '"liveRetryCollectorUsesRawCompatibilityUserMessage": true' },
        ],
        negativeAssertions: [
          { label: 'debug export does not leak full rejected text in response-job summary', excludes: '"debugExportLeaksFullRejectedText": true' },
          { label: 'live retry no longer builds previous assistant context into model input', excludes: '"liveRetryStillBuildsPreviousAssistantContext": true' },
        ],
      },
      {
        id: 'issue-22-parent-message-regression-fixture',
        issueNumber: 22,
        issueTitle: 'Debug Export Parent Message Boundaries',
        validationPhase: 'Shared Regression Gate: Parent Message Export Boundaries',
        commandOrFixture: COMMAND,
        manualReview: 'Manual review is tracked separately. This provider-free fixture proves saved-message ownership, nested child cards, and nonduplicated parent evidence.',
        createArtifact: () => ({ text: issue22ParentMessageBoundaryArtifact() }),
        positiveAssertions: [
          { label: 'two saved messages produce two parent cards', includes: '"savedMessageParentCount": 2' },
          { label: 'assistant saved message produces one parent boundary', includes: '"assistantParentCount": 1' },
          { label: 'speaker parsing remains available as nested child cards', includes: '"nestedChildCardCount": 3' },
          { label: 'tester note renders once on the parent', includes: '"parentNoteSectionCount": 1' },
          { label: 'retry history renders once on the parent', includes: '"retryHistorySectionCount": 1' },
          { label: 'API Call 1 evidence renders once on the parent', includes: '"apiCall1SectionCount": 1' },
          { label: 'note index targets the parent message', includes: '"noteIndexTargetsParent": true' },
          { label: 'embedded parent contract includes diagnostics and metrics', includes: '"embeddedParentContractPresent": true' },
        ],
        negativeAssertions: [
          { label: 'child cards do not become top-level saved messages', excludes: '"childCardsRenderedAsTopLevelMessages": true' },
          { label: 'parent-owned evidence is not duplicated across children', excludes: '"parentOwnedEvidenceDuplicatedAcrossChildren": true' },
        ],
      },
      {
        id: 'issue-26-recent-history-regression-fixture',
        issueNumber: 26,
        issueTitle: 'Recent Assistant History Self-Anchoring',
        validationPhase: 'Shared Regression Gate: Recent-History Mode Policies',
        commandOrFixture: COMMAND,
        manualReview: 'No manual review is required for this provider-free regression gate. It proves the deterministic structured outcome-summary boundary; later manual review judges continuity quality only.',
        createArtifact: () => ({ text: issue26RecentHistoryRegressionArtifact() }),
        positiveAssertions: [
          { label: 'normal send keeps latest assistant continuity', includes: '"normalKeepsLatestAssistant": true' },
          { label: 'normal send uses structured outcome summary', includes: '"normalUsesStructuredOutcomeSummary": true' },
          { label: 'summary preserves the approved observation', includes: '"normalSummaryPreservesApprovedObservation": true' },
          { label: 'summary excludes distinctive old assistant wording', includes: '"normalSummaryExcludesDistinctiveOldAssistantWording": true' },
          { label: 'normal send removes the repeated older assistant anchor only', includes: '"normalRemovesRepeatedAnchorFromOlderAssistant": true' },
          { label: 'retry rejected text stays outside accepted history', includes: '"retryRejectsFullTextFromHistory": true' },
          { label: 'retry records contrast lineage', includes: '"retryHasContrastReceipt": true' },
          { label: 'continue tail is not duplicated in ordinary history', includes: '"continueAvoidsTailDuplication": true' },
          { label: 'continue records anchor lineage', includes: '"continueHasAnchorReceipt": true' },
        ],
        negativeAssertions: [
          { label: 'retry and continue do not invent outcome summaries', excludes: '"retryOrContinueInventsOutcomeSummary": true' },
          { label: 'rejected Retry text is not provider history', excludes: '"retryProviderContent": [\n    "Try again.",\n    "Rejected full text' },
        ],
      },
    ],
  });
}
