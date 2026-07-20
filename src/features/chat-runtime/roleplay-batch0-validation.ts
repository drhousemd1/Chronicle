import { readFile } from 'node:fs/promises';

import {
  buildContinueAssistantTailResponseJob,
  buildDeletedAssistantRecoveryResponseJob,
  buildNormalSendResponseJob,
  buildRetryRegenerateResponseJob,
} from './roleplay-response-job';
import { evaluateRoleplayCandidateBehavior } from './roleplay-candidate-behavior';
import { createRoleplayFixtureScenario } from './roleplay-fixture-scenarios';
import {
  buildRoleplayHarnessContractArtifact,
  evaluateRoleplayHarnessContractArtifact,
} from './roleplay-harness-contract-artifact';
import { projectPlayerTurnVisibility } from './player-turn-visibility';
import { renderRoleplayResponseJobFinalUserContent } from './roleplay-response-job-rendering';
import {
  buildActiveCharacterSnapshotMap,
  buildMessageGenerationMap,
} from './effective-state';
import {
  runRoleplayRegressionFixtures,
  type RoleplayRegressionFixtureRun,
} from './roleplay-regression-fixture';
import { buildChatReviewHtml } from '../chat-debug/review-export';
import { renderResponseJobSummary } from '../chat-debug/response-job-summary';
import { auditRoleplayValidationRunnerReuse } from '@/features/validation-evidence/roleplay-gates';
import type {
  CharacterStateMessageSnapshot,
  Conversation,
  Message,
  ScenarioData,
} from '@/types';

export type RunRoleplayBatch0ValidationOptions = {
  gateIds?: string[];
  recordExecution?: Parameters<typeof runRoleplayRegressionFixtures>[0]['recordExecution'];
};

const COMMAND = 'npm run validation:roleplay:batch0';

function pretty(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function buildDebugExportFixtureHtml() {
  const retryRejectedText = 'Full rejected debug-only text that must not appear in the response-job summary.';
  const retryResponseJob = buildRetryRegenerateResponseJob({
    conversationId: 'conversation-1',
    playerTurn: {
      messageId: 'message-user-1',
      text: 'I step closer.',
    },
    rejectedAttempt: {
      messageId: 'message-ai-rejected',
      text: retryRejectedText,
      summary: 'The rejected answer repeated the same closing question.',
    },
    currentStateSummary: 'Kitchen scene remains active.',
    responseDetail: 'detailed',
  });
  const continueResponseJob = buildContinueAssistantTailResponseJob({
    conversationId: 'conversation-1',
    assistantAnchor: {
      messageId: 'message-ai-1',
      acceptedTextTail: 'Ashley looks up from the counter.',
    },
    currentStateSummary: 'Kitchen scene remains active.',
    responseDetail: 'standard',
  });
  const html = [
    renderResponseJobSummary({ requestBody: { responseJob: retryResponseJob } }),
    renderResponseJobSummary({ requestBody: { responseJob: continueResponseJob } }),
  ].join('\n');

  return {
    html,
    retryRejectedText,
  };
}

function buildSourcePressureStateStalenessArtifact() {
  const messages: Message[] = [
    {
      id: 'message-user-latest',
      role: 'user',
      text: 'The user explicitly corrects the current scene state.',
      createdAt: 2,
      generationId: 'generation-current',
    },
  ];
  const generationMap = buildMessageGenerationMap(messages);
  const snapshots: CharacterStateMessageSnapshot[] = [
    {
      id: 'snapshot-stale',
      conversationId: 'conversation-1',
      characterId: 'character-1',
      sourceMessageId: 'message-user-latest',
      sourceGenerationId: 'generation-stale',
      statePayload: { location: 'stale saved-state location' },
      createdAt: 1,
    },
    {
      id: 'snapshot-current',
      conversationId: 'conversation-1',
      characterId: 'character-1',
      sourceMessageId: 'message-user-latest',
      sourceGenerationId: 'generation-current',
      statePayload: { location: 'latest user corrected location' },
      createdAt: 2,
    },
  ];
  const activeSnapshot = buildActiveCharacterSnapshotMap(snapshots, generationMap, messages).get('character-1');
  const modelFacingCurrentState = activeSnapshot?.statePayload?.location ?? '';

  return pretty({
    rawUserFactAuthority: 'raw_user_fact',
    savedRuntimeStateAuthority: 'saved_runtime_state',
    overriddenThisTurn: modelFacingCurrentState === 'latest user corrected location',
    sourceMessageId: activeSnapshot?.sourceMessageId,
    sourceGenerationId: activeSnapshot?.sourceGenerationId,
    modelFacingCurrentState,
    staleSavedStateExcluded: modelFacingCurrentState !== snapshots[0].statePayload?.location,
    debugSignals: [
      'raw_user_fact',
      'saved_runtime_state',
      'overridden_this_turn',
      'source_message_id',
    ],
  });
}

function buildModeSeparationArtifact() {
  const normal = buildNormalSendResponseJob({
    conversationId: 'conversation-1',
    playerTurn: { messageId: 'message-user-1', text: 'I step closer.' },
    currentStateSummary: 'Kitchen scene remains active.',
    responseDetail: 'standard',
  });
  const retry = buildRetryRegenerateResponseJob({
    conversationId: 'conversation-1',
    playerTurn: { messageId: 'message-user-1', text: 'I step closer.' },
    rejectedAttempt: {
      messageId: 'message-assistant-rejected',
      text: 'full rejected attempt text',
      summary: 'The rejected response reused the same move.',
    },
    currentStateSummary: 'Kitchen scene remains active.',
    responseDetail: 'standard',
  });
  const continuation = buildContinueAssistantTailResponseJob({
    conversationId: 'conversation-1',
    assistantAnchor: {
      messageId: 'message-assistant-accepted',
      acceptedTextTail: 'Ashley keeps her hand on the counter.',
    },
    currentStateSummary: 'Kitchen scene remains active.',
    responseDetail: 'standard',
  });
  const deletedRecovery = buildDeletedAssistantRecoveryResponseJob({
    conversationId: 'conversation-1',
    visibleUserTail: { messageId: 'message-user-latest', text: 'What happens next?' },
    deletedAssistantMessageId: 'message-assistant-deleted',
    currentStateSummary: 'The assistant reply was deleted; latest visible message is user-authored.',
    responseDetail: 'standard',
  });

  const retryLaneKinds = retry.finalUserLanes.map((lane) => lane.kind);
  const continueLaneKinds = continuation.finalUserLanes.map((lane) => lane.kind);
  const deletedRecoveryMetadata = deletedRecovery.modeData.kind === 'normal_send'
    ? deletedRecovery.modeData
    : null;

  return pretty({
    normalMode: normal.mode,
    retryMode: retry.mode,
    continueMode: continuation.mode,
    deletedAssistantRecoveryMode: deletedRecovery.mode,
    normalHasPlayerTurnLane: normal.finalUserLanes.some((lane) => lane.kind === 'player_turn'),
    retryHasRetryRejectionLane: retryLaneKinds.includes('retry_rejection'),
    retryHasContinueAnchorLane: retryLaneKinds.includes('continue_anchor'),
    continueHasContinueAnchorLane: continueLaneKinds.includes('continue_anchor'),
    continueHasPlayerTurnLane: continueLaneKinds.includes('player_turn'),
    deletedRecoveryCreatesNewUserMessage: deletedRecoveryMetadata?.createsNewUserMessage ?? true,
    deletedRecoveryVariant: deletedRecoveryMetadata?.variant,
  });
}

function buildDetailVisibilityPhysicalStateArtifact() {
  const scenario = createRoleplayFixtureScenario({
    id: 'issue-24-detail-visibility-physical-state',
    sideCharacterCount: 12,
  });
  const latestPlayerMessage = scenario.messages.find((message) => message.id === 'message-user-latest');
  if (!latestPlayerMessage) throw new Error('Realistic fixture is missing its latest player message.');
  const playerProjection = projectPlayerTurnVisibility(
    latestPlayerMessage.text,
    latestPlayerMessage.id,
  );
  const visiblePlayerTurn = playerProjection.visibleText;
  const acceptedMessages = scenario.messages
    .filter((message) => message.accepted && !message.deleted && !message.superseded)
    .map((message) => ({
      id: message.id,
      role: message.role,
      text: message.text,
      generationId: message.generationId,
      createdAt: message.createdAt,
    } satisfies Message));
  const generationMap = buildMessageGenerationMap(acceptedMessages);
  const snapshots = scenario.snapshots.map((snapshot, index) => ({
    id: snapshot.id,
    conversationId: scenario.conversationId,
    characterId: snapshot.characterId,
    sourceMessageId: snapshot.sourceMessageId,
    sourceGenerationId: snapshot.sourceGenerationId ?? snapshot.sourceMessageId,
    statePayload: {
      location: snapshot.location,
      scenePosition: snapshot.scenePosition,
    },
    createdAt: index + 1,
  } satisfies CharacterStateMessageSnapshot));
  const activeSnapshot = buildActiveCharacterSnapshotMap(
    snapshots,
    generationMap,
    acceptedMessages,
  ).get('character-companion');
  const currentStateSummary = [
    `Primary Companion location: ${activeSnapshot?.statePayload?.location ?? 'Unknown'}`,
    activeSnapshot?.statePayload?.scenePosition
      ? `Primary Companion position: ${activeSnapshot.statePayload.scenePosition}`
      : '',
  ].filter(Boolean).join('\n');
  const responseJob = buildNormalSendResponseJob({
    conversationId: scenario.conversationId,
    playerTurn: {
      messageId: latestPlayerMessage.id,
      text: visiblePlayerTurn,
    },
    currentStateSummary,
    responseDetail: 'detailed',
  });
  const rendered = renderRoleplayResponseJobFinalUserContent(responseJob);
  const responseDetailLane = responseJob.finalUserLanes.find((lane) => lane.kind === 'response_detail');
  const privacyEvaluation = evaluateRoleplayCandidateBehavior({
    criterion: 'private_information_leakage',
    mode: 'normal_send',
    playerTurn: visiblePlayerTurn,
    candidateResponse: 'The companion turns the documents toward the player and identifies the immediate choice.',
    forbiddenPhrases: [scenario.privatePlayerText],
  });

  return pretty({
    responseDetailLane: responseDetailLane?.content,
    renderedIncludesResponseDetailLane: rendered.includes('[response_detail | runtime | control | model-facing]'),
    visiblePlayerTurn,
    thoughtTokenCount: playerProjection.privateSpans.length,
    privateTextWithheld: !rendered.includes(scenario.privatePlayerText),
    privacyEvaluationResult: privacyEvaluation.result,
    activeSnapshotId: activeSnapshot?.id,
    physicalStateLocation: activeSnapshot?.statePayload?.location,
    staleSnapshotExcluded: activeSnapshot?.id !== 'snapshot-rejected',
    finalUserLaneKinds: responseJob.finalUserLanes.map((lane) => lane.kind),
  });
}

function buildFixtureHarnessReadinessArtifact() {
  const scenario = createRoleplayFixtureScenario({
    id: 'issue-24-harness-readiness',
    sideCharacterCount: 12,
  });
  const retryEvaluation = evaluateRoleplayCandidateBehavior({
    criterion: 'retry_strategy_difference',
    mode: 'retry_regenerate',
    playerTurn: 'I place the sealed folder between us and wait.',
    referenceResponse: '"I promise I am here for you." She offers a quiet smile. "What do you want to do?"',
    candidateResponse: '*She rotates the sealed folder and points to the unsigned page.* "Choose which clause we challenge first."',
    requiredFacts: ['sealed folder'],
    requiredDevelopments: ['unsigned page'],
  });
  const reuseGroups = auditRoleplayValidationRunnerReuse();
  const contractChecks = evaluateRoleplayHarnessContractArtifact(
    buildRoleplayHarnessContractArtifact(),
  );

  return pretty({
    scenarioCharacterCount: scenario.characters.length,
    denseCharacterCardCount: scenario.characterCards.filter((card) => card.facts.length >= 10).length,
    hasDynamicSideCharacter: scenario.characters.some((character) => character.origin === 'dynamic_side'),
    hasPrivatePlayerText: scenario.messages.some((message) => message.text.includes(scenario.privatePlayerText)),
    hasRejectedGeneration: scenario.messages.some((message) => message.superseded && !message.accepted),
    hasRetryChain: scenario.generationChains.some((chain) => chain.kind === 'retry'),
    hasContinueChain: scenario.generationChains.some((chain) => chain.kind === 'continue'),
    hasDayTransition: scenario.dayTransitions.length > 0,
    retryEvaluationResult: retryEvaluation.result,
    retryEvaluationReasons: retryEvaluation.reasons,
    contractChecks,
    sharedRunnerGroups: reuseGroups.map((group) => ({
      runnerIdentity: group.runnerIdentity,
      gateCount: group.gateIds.length,
    })),
  });
}

function buildDebugExportSupportArtifact() {
  const appData = {
    world: {
      core: {
        scenarioName: 'Fixture Scenario',
        briefDescription: 'Generic roleplay fixture scenario.',
        storyPremise: 'A generic roleplay exchange used for structural validation.',
        dialogFormatting: '',
        storyGoals: [],
      },
      entries: [],
    },
    characters: [
      {
        name: 'Player',
        nicknames: '',
        controlledBy: 'User',
        characterRole: 'Main',
        avatarDataUrl: '',
      },
      {
        name: 'Assistant',
        nicknames: '',
        controlledBy: 'AI',
        characterRole: 'Main',
        avatarDataUrl: '',
      },
    ],
    sideCharacters: [],
  } as unknown as ScenarioData;
  const conversation: Conversation = {
    id: 'conversation-1',
    title: 'Fixture Session',
    currentDay: 1,
    currentTimeOfDay: 'day',
    createdAt: 1,
    updatedAt: 2,
    messages: [
      {
        id: 'message-user-1',
        role: 'user',
        text: 'Player: *I change position and wait for the assistant response.*',
        day: 1,
        timeOfDay: 'day',
        createdAt: 10,
      },
      {
        id: 'message-assistant-1',
        generationId: 'generation-assistant-1',
        role: 'assistant',
        text: 'Assistant: *The assistant acknowledges the visible movement.* "I see it."',
        day: 1,
        timeOfDay: 'day',
        createdAt: 11,
      },
    ],
  };
  const responseJob = buildNormalSendResponseJob({
    conversationId: 'conversation-1',
    playerTurn: {
      messageId: 'message-user-1',
      text: 'I change position and wait for the assistant response.',
    },
    currentStateSummary: 'Latest visible physical movement remains active.',
    responseDetail: 'detailed',
  });
  const html = buildChatReviewHtml({
    appData,
    conversation,
    scenarioTitle: 'Fixture Scenario',
    modelId: 'fixture-model',
    exportedAt: new Date('2026-07-06T00:00:00.000Z'),
    sanitizeAssistantText: (text) => text,
    debugRecords: {
      'message-assistant-1:generation-assistant-1': {
        messageId: 'message-assistant-1',
        generationId: 'generation-assistant-1',
        capturedAt: 12,
        trace: null,
        call1Request: {
          id: 'call1.roleplay-generation',
          label: 'API Call 1 - Roleplay generation',
          apiCallGroup: 'call_1',
          endpoint: '/functions/v1/chat',
          method: 'POST',
          capturedAt: 12,
          status: 'sent',
          requestBody: {
            responseJob,
          },
        },
        supportCalls: [
          {
            id: 'support.character-state-sync',
            label: 'Support Call - Character state sync',
            apiCallGroup: 'support',
            endpoint: '/functions/v1/extract-character-updates',
            method: 'POST',
            capturedAt: 13,
            status: 'completed',
            requestBody: { userMessage: 'fixture user turn', aiResponse: 'fixture assistant response' },
            responseBody: {
              updates: [
                { character: 'Assistant', field: 'location', value: 'Kitchen', evidence: 'Assistant steps into the kitchen.', confidence: 0.9 },
              ],
              candidateReviews: [
                { index: 0, accepted: true, reason: 'accepted', character: 'Assistant', field: 'location', value: 'Kitchen', evidence: 'Assistant steps into the kitchen.', confidence: 0.9 },
                { index: 1, accepted: false, reason: 'unsupported_field', character: 'Assistant', field: 'unsupported.path', value: 'Rejected value', evidence: 'not supported', confidence: 0.2 },
              ],
              physicalStateReviews: [
                { character: 'Assistant', reviewed: true, locationReviewed: true, scenePositionReviewed: true, changed: false, reason: 'visible position reviewed', evidence: 'Assistant acknowledges visible movement.', confidence: 0.9, source: 'primary' },
              ],
              physicalStateCompletenessReviews: [
                { character: 'Assistant', reviewed: true, reason: 'visible position reviewed', source: 'primary' },
              ],
              missingPhysicalStateReviews: [],
            },
          },
          {
            id: 'support.goal-alignment',
            label: 'Support Call - Goal alignment evaluation',
            apiCallGroup: 'support',
            endpoint: '/functions/v1/evaluate-goal-alignment',
            method: 'POST',
            capturedAt: 14,
            status: 'completed',
            requestBody: { goals: [] },
            responseBody: {
              evaluations: [],
              alignmentReviews: [
                { index: 0, accepted: false, reason: 'unknown_goal', goalId: 'missing-goal', signal: 'support', intensity: 1, rationale: 'Fixture rejected unsupported goal.', evidence: 'unknown' },
              ],
              rejectedEvaluations: [
                { index: 0, accepted: false, reason: 'unknown_goal', goalId: 'missing-goal', signal: 'support', intensity: 1, rationale: 'Fixture rejected unsupported goal.', evidence: 'unknown' },
              ],
              parseError: 'evaluations_not_array',
              shadowMode: true,
              persistence: 'diagnostic_only',
            },
          },
          {
            id: 'support.memory-extraction',
            label: 'Support Call - Memory extraction',
            apiCallGroup: 'support',
            endpoint: '/functions/v1/extract-memory-events',
            method: 'POST',
            capturedAt: 15,
            status: 'completed',
            requestBody: { userMessage: 'fixture user turn', aiResponse: 'fixture assistant response' },
            responseBody: {
              contract: 'MemoryExtractionResponseV1',
              version: 1,
              workerArtifact: {
                worker: 'extract-memory-events',
                contract: 'MemoryExtractionResponseV1',
                version: 1,
                artifactVersion: 'extract-memory-events-candidates-v1',
              },
              candidates: [],
              acceptedCandidates: [],
              rejectedEvents: [
                { index: 0, accepted: false, reason: 'parse_error', value: 'not json' },
              ],
              parseError: 'parse_error',
            },
          },
        ],
      },
    },
  });

  return pretty({
    hasResponseJobSummary: html.includes('Response Job Summary'),
    hasCharacterStateSupportSummary: html.includes('Character state sync summary'),
    hasAcceptedSupportOutcome: html.includes('Accepted update candidates') && html.includes('[accepted]'),
    hasRejectedSupportOutcome: html.includes('Rejected updates') && html.includes('rejected: unsupported_field'),
    hasPhysicalStateReviewRows: html.includes('Physical state review rows') && html.includes('Physical state completeness review'),
    hasGoalAlignmentDiagnosticOnly: html.includes('Goal alignment summary') && html.includes('diagnostic_only'),
    hasMemoryRejectedOutcome: html.includes('Memory extraction summary') && html.includes('Rejected memory output'),
  });
}

async function buildTargetedCommandDocumentationArtifact() {
  const packageJson = JSON.parse(await readFile('package.json', 'utf8')) as {
    scripts?: Record<string, string>;
  };
  const packageScript = packageJson.scripts?.['validation:roleplay:batch0'] ?? '';

  return pretty({
    targetedCommand: COMMAND,
    packageScript,
    companionChecks: [
      'npm run test -- src/features/chat-runtime/roleplay-response-job.test.ts src/features/chat-runtime/roleplay-regression-fixture.test.ts src/features/chat-runtime/collect-roleplay-response.test.ts src/services/roleplay-runtime-responses.test.ts src/services/roleplay-runtime-responses.behavior.test.ts src/features/chat-runtime/roleplay-batch0-validation.test.ts',
      'npm run test -- src/features/chat-debug/review-export.test.ts src/features/chat-runtime/roleplay-batch0-validation.test.ts',
      'npm run test -- src/services/api-usage-validation.test.ts',
      'npm run typecheck',
      'npm run build',
    ],
    deterministicFixturesBeforeManualPlaythrough: true,
    manualAdminExportAfterFixtures: true,
    providerTransportOutOfScope: true,
    manualPlaythroughFirst: false,
  });
}

export async function runRoleplayBatch0Validation({
  gateIds,
  recordExecution,
}: RunRoleplayBatch0ValidationOptions = {}): Promise<RoleplayRegressionFixtureRun> {
  return runRoleplayRegressionFixtures({
    gateIds,
    exactCommand: COMMAND,
    recordExecution,
    fixtures: [
      {
        id: 'issue-01-contract-unit-tests',
        issueNumber: 1,
        issueTitle: 'First-Class Response Job Contract',
        validationPhase: 'Validation Phase 1: Contract Unit Tests',
        commandOrFixture: COMMAND,
        manualReview: 'No manual review required for the pure response-job contract shape.',
        createArtifact: () => {
          const normalSend = buildNormalSendResponseJob({
            conversationId: 'conversation-1',
            playerTurn: { messageId: 'user-1', text: 'I step closer.' },
            currentStateSummary: 'Ashley and James are in the kitchen.',
            responseDetail: 'detailed',
          });
          const retry = buildRetryRegenerateResponseJob({
            conversationId: 'conversation-1',
            playerTurn: { messageId: 'user-1', text: 'I step closer.' },
            rejectedAttempt: {
              messageId: 'assistant-1',
              text: 'Full rejected assistant text that must stay debug-only.',
              summary: 'The rejected answer repeated the same final question.',
            },
            currentStateSummary: 'Ashley and James are in the kitchen.',
            responseDetail: 'detailed',
          });
          const continuation = buildContinueAssistantTailResponseJob({
            conversationId: 'conversation-1',
            assistantAnchor: {
              messageId: 'assistant-2',
              acceptedTextTail: 'Ashley looks up from the counter.',
            },
            currentStateSummary: 'Ashley and James are in the kitchen.',
            responseDetail: 'concise',
          });

          return {
            text: pretty({ normalSend, retry, continuation }),
          };
        },
        positiveAssertions: [
          { label: 'normal send mode is explicit', includes: '"mode": "normal_send"' },
          { label: 'retry mode is explicit', includes: '"mode": "retry_regenerate"' },
          { label: 'continue mode is explicit', includes: '"mode": "continue_assistant_tail"' },
          { label: 'retry excludes rejected attempt from history policy', includes: '"strategy": "exclude_rejected_attempt"' },
        ],
        negativeAssertions: [
          { label: 'full rejected text is not model-facing', excludes: 'Full rejected assistant text that must stay debug-only.' },
        ],
      },
      {
        id: 'issue-01-provider-free-snapshot-tests',
        issueNumber: 1,
        issueTitle: 'First-Class Response Job Contract',
        validationPhase: 'Validation Phase 2: Provider-Free Snapshot Tests',
        commandOrFixture: COMMAND,
        manualReview: 'Review only if the snapshot structure changes unexpectedly.',
        createArtifact: () => {
          const retry = buildRetryRegenerateResponseJob({
            conversationId: 'conversation-1',
            playerTurn: { messageId: 'user-1', text: 'I step closer.' },
            rejectedAttempt: {
              messageId: 'assistant-1',
              text: 'Rejected prose kept out of the provider-facing snapshot.',
              summary: 'Rejected response reused the prior move.',
            },
            currentStateSummary: 'Kitchen scene remains active.',
            responseDetail: 'standard',
          });
          const continuation = buildContinueAssistantTailResponseJob({
            conversationId: 'conversation-1',
            assistantAnchor: {
              messageId: 'assistant-2',
              acceptedTextTail: 'Ashley reaches for the doorframe.',
            },
            currentStateSummary: 'Kitchen scene remains active.',
            responseDetail: 'standard',
          });

          return {
            text: pretty({
              retryLaneKinds: retry.finalUserLanes.map((lane) => lane.kind),
              continueLaneKinds: continuation.finalUserLanes.map((lane) => lane.kind),
              retryModelFacingContent: retry.finalUserLanes.map((lane) => lane.content),
              continueModelFacingContent: continuation.finalUserLanes.map((lane) => lane.content),
            }),
          };
        },
        positiveAssertions: [
          { label: 'retry snapshot includes player turn lane', includes: 'player_turn' },
          { label: 'retry snapshot includes rejection summary lane', includes: 'retry_rejection' },
          { label: 'continue snapshot includes assistant tail anchor', includes: 'continue_anchor' },
        ],
        negativeAssertions: [
          { label: 'provider-free retry snapshot excludes rejected prose', excludes: 'Rejected prose kept out of the provider-facing snapshot.' },
        ],
      },
      {
        id: 'issue-01-runtime-integration',
        issueNumber: 1,
        issueTitle: 'First-Class Response Job Contract',
        validationPhase: 'Validation Phase 3: Runtime Integration Tests',
        commandOrFixture: COMMAND,
        manualReview: 'Later manual playthrough should confirm visible Send still feels unchanged; this row proves the code seam carries the normal_send job.',
        createArtifact: async () => {
          const [
            chatInterfaceSource,
            collectorSource,
            llmSource,
          ] = await Promise.all([
            readFile('src/components/chronicle/ChatInterfaceTab.tsx', 'utf8'),
            readFile('src/features/chat-runtime/collect-roleplay-response.ts', 'utf8'),
            readFile('src/services/llm.ts', 'utf8'),
          ]);
          const responseJob = buildNormalSendResponseJob({
            conversationId: 'conversation-1',
            playerTurn: { messageId: 'user-1', text: 'I step closer.' },
            currentStateSummary: 'Kitchen scene remains active.',
            responseDetail: 'detailed',
          });
          const retryRejectedText = 'Full rejected retry text that must stay out of the provider-facing lane.';
          const retryResponseJob = buildRetryRegenerateResponseJob({
            conversationId: 'conversation-1',
            playerTurn: { messageId: 'user-1', text: 'I step closer.' },
            rejectedAttempt: {
              messageId: 'assistant-1',
              text: retryRejectedText,
              summary: 'The prior assistant response should be replaced with a meaningfully different answer.',
            },
            currentStateSummary: 'Kitchen scene remains active.',
            responseDetail: 'detailed',
          });
          const continueResponseJob = buildContinueAssistantTailResponseJob({
            conversationId: 'conversation-1',
            assistantAnchor: {
              messageId: 'assistant-2',
              acceptedTextTail: 'Ashley looks up from the counter.',
            },
            currentStateSummary: 'Kitchen scene remains active.',
            responseDetail: 'standard',
          });

          const renderedFinalUserContent = renderRoleplayResponseJobFinalUserContent(responseJob);
          const retryRenderedFinalUserContent = renderRoleplayResponseJobFinalUserContent(retryResponseJob);
          const continueRenderedFinalUserContent = renderRoleplayResponseJobFinalUserContent(continueResponseJob);
          const fallbackText = 'legacy fallback should not own rendered request';

          return {
            text: pretty({
              chatInterfaceBuildsNormalSendJob: chatInterfaceSource.includes('const normalSendResponseJob = buildNormalSendResponseJob({'),
              chatInterfacePassesResponseJob: chatInterfaceSource.includes('responseJob: normalSendResponseJob'),
              retryBranchBuildsRetryJob: chatInterfaceSource.includes('const retryRegenerateResponseJob = buildRetryRegenerateResponseJob({'),
              retryBranchPassesResponseJob: chatInterfaceSource.includes('responseJob: retryRegenerateResponseJob'),
              continueBranchBuildsContinueJob: chatInterfaceSource.includes('buildContinueAssistantTailResponseJob({'),
              continueBranchGuardsAssistantTail: chatInterfaceSource.includes('resolveRoleplayContinueTailAction({')
                && chatInterfaceSource.includes("if (tailAction.kind === 'unavailable') return;"),
              continueBranchPassesResponseJob: chatInterfaceSource.includes('responseJob: continueResponseJob'),
              collectorRequiresResponseJob: collectorSource.includes('responseJob: RoleplayResponseJob'),
              collectorForwardsResponseJob: collectorSource.includes('responseJob,'),
              llmUsesResponseJobRenderer: llmSource.includes('renderRoleplayResponseJobFinalUserContent(responseJob)'),
              responseJobMode: responseJob.mode,
              renderedFinalUserContent,
              retryRenderedMode: retryResponseJob.mode,
              retryRenderedFinalUserContent,
              continueRenderedMode: continueResponseJob.mode,
              continueRenderedFinalUserContent,
              fallbackTextRendered: renderedFinalUserContent.includes(fallbackText),
              retryFullRejectedTextRendered: retryRenderedFinalUserContent.includes(retryRejectedText),
              continueRenderedHasPlayerTurnLane: continueRenderedFinalUserContent.includes('[player_turn | user | player_turn | model-facing]'),
            }),
          };
        },
        positiveAssertions: [
          { label: 'send branch builds normal_send response job', includes: '"chatInterfaceBuildsNormalSendJob": true' },
          { label: 'send branch passes response job to collector', includes: '"chatInterfacePassesResponseJob": true' },
          { label: 'retry branch builds retry_regenerate response job', includes: '"retryBranchBuildsRetryJob": true' },
          { label: 'retry branch passes retry response job to collector', includes: '"retryBranchPassesResponseJob": true' },
          { label: 'continue branch builds continue_assistant_tail response job', includes: '"continueBranchBuildsContinueJob": true' },
          { label: 'continue branch guards assistant-tail anchor', includes: '"continueBranchGuardsAssistantTail": true' },
          { label: 'continue branch passes continue response job to collector', includes: '"continueBranchPassesResponseJob": true' },
          { label: 'collector requires a typed response job', includes: '"collectorRequiresResponseJob": true' },
          { label: 'collector forwards the typed response job', includes: '"collectorForwardsResponseJob": true' },
          { label: 'llm renderer uses response job path', includes: '"llmUsesResponseJobRenderer": true' },
          { label: 'response job mode is normal_send', includes: '"responseJobMode": "normal_send"' },
          { label: 'retry rendered mode is retry_regenerate', includes: '"retryRenderedMode": "retry_regenerate"' },
          { label: 'continue rendered mode is continue_assistant_tail', includes: '"continueRenderedMode": "continue_assistant_tail"' },
          { label: 'renderer sees response job block', includes: '[ROLEPLAY RESPONSE JOB]' },
          { label: 'renderer uses player turn lane', includes: '[player_turn | user | player_turn | model-facing]' },
          { label: 'retry renderer uses rejection lane', includes: '[retry_rejection | assistant | control | model-facing]' },
          { label: 'continue renderer uses assistant tail lane', includes: '[continue_anchor | assistant | state | model-facing]' },
          { label: 'renderer includes response detail lane', includes: '[response_detail | runtime | control | model-facing]' },
        ],
        negativeAssertions: [
          { label: 'legacy fallback text does not own rendered request', excludes: '"fallbackTextRendered": true' },
          { label: 'retry full rejected text does not render provider-facing', excludes: '"retryFullRejectedTextRendered": true' },
          { label: 'continue renderer does not create a player-turn lane', excludes: '"continueRenderedHasPlayerTurnLane": true' },
        ],
      },
      {
        id: 'issue-01-deleted-assistant-recovery-fixture',
        issueNumber: 1,
        issueTitle: 'First-Class Response Job Contract',
        validationPhase: 'Validation Phase 4: Deleted-Assistant Recovery Fixture',
        commandOrFixture: COMMAND,
        manualReview: 'Manual playthrough still needs to confirm the UI exposes the recovery action without adding a dummy user row.',
        createArtifact: () => ({
          text: pretty(buildDeletedAssistantRecoveryResponseJob({
            conversationId: 'conversation-1',
            visibleUserTail: { messageId: 'user-2', text: 'What does she do next?' },
            deletedAssistantMessageId: 'assistant-deleted-1',
            currentStateSummary: 'Latest visible message is user-authored because an assistant reply was deleted.',
            responseDetail: 'detailed',
          })),
        }),
        positiveAssertions: [
          { label: 'deleted-assistant recovery stays normal send', includes: '"mode": "normal_send"' },
          { label: 'deleted-assistant recovery variant is explicit', includes: '"variant": "deleted_assistant_recovery"' },
          { label: 'deleted-assistant recovery avoids dummy user row', includes: '"createsNewUserMessage": false' },
        ],
        negativeAssertions: [
          { label: 'deleted-assistant recovery does not use continue mode', excludes: '"mode": "continue_assistant_tail"' },
        ],
      },
      {
        id: 'issue-01-debug-export-review',
        issueNumber: 1,
        issueTitle: 'First-Class Response Job Contract',
        validationPhase: 'Validation Phase 5: Debug Export Review',
        commandOrFixture: COMMAND,
        manualReview: 'Later browser review should open an exported session log and confirm the response-job summary is readable to a human reviewer.',
        createArtifact: () => {
          const { html, retryRejectedText } = buildDebugExportFixtureHtml();
          return {
            text: pretty({
              hasResponseJobSummary: html.includes('Response Job Summary'),
              hasRetryModeSummary: html.includes('Mode</strong>retry_regenerate'),
              hasContinueModeSummary: html.includes('Mode</strong>continue_assistant_tail'),
              hasRetryHistoryTreatment: html.includes('History treatment</strong>exclude_rejected_attempt'),
              hasContinueHistoryTreatment: html.includes('History treatment</strong>anchor_on_accepted_assistant_tail'),
              hasRetryLaneInventory: html.includes('retry_rejection / assistant / control / model-facing'),
              hasContinueLaneInventory: html.includes('continue_anchor / assistant / state / model-facing'),
              hasRetryAttemptSummary: html.includes('The rejected answer repeated the same closing question.'),
              leaksFullRejectedText: html.includes(retryRejectedText),
            }),
          };
        },
        positiveAssertions: [
          { label: 'export includes response job summary', includes: '"hasResponseJobSummary": true' },
          { label: 'export includes retry mode summary', includes: '"hasRetryModeSummary": true' },
          { label: 'export includes continue mode summary', includes: '"hasContinueModeSummary": true' },
          { label: 'export includes retry history treatment', includes: '"hasRetryHistoryTreatment": true' },
          { label: 'export includes continue history treatment', includes: '"hasContinueHistoryTreatment": true' },
          { label: 'export includes retry lane inventory', includes: '"hasRetryLaneInventory": true' },
          { label: 'export includes continue lane inventory', includes: '"hasContinueLaneInventory": true' },
          { label: 'export includes retry replacement summary', includes: '"hasRetryAttemptSummary": true' },
        ],
        negativeAssertions: [
          { label: 'export summary does not leak full rejected assistant text', excludes: '"leaksFullRejectedText": true' },
        ],
      },
      {
        id: 'issue-24-fixture-harness-command',
        issueNumber: 24,
        issueTitle: 'Roleplay Regression Fixture Harness',
        validationPhase: 'Validation Phase 1: New Fixture Harness Command',
        commandOrFixture: COMMAND,
        manualReview: 'No manual review required for provider-free harness smoke.',
        createArtifact: () => ({ text: buildFixtureHarnessReadinessArtifact() }),
        positiveAssertions: [
          { label: 'realistic scenario includes more than ten playable characters', includes: '"scenarioCharacterCount": 14' },
          { label: 'realistic scenario includes dense character cards', includes: '"denseCharacterCardCount": 14' },
          { label: 'realistic scenario includes a dynamic side character', includes: '"hasDynamicSideCharacter": true' },
          { label: 'realistic scenario includes private player text', includes: '"hasPrivatePlayerText": true' },
          { label: 'realistic scenario includes a rejected generation', includes: '"hasRejectedGeneration": true' },
          { label: 'realistic scenario includes a Retry chain', includes: '"hasRetryChain": true' },
          { label: 'realistic scenario includes a Continue chain', includes: '"hasContinueChain": true' },
          { label: 'realistic scenario includes a day transition', includes: '"hasDayTransition": true' },
          { label: 'candidate evaluator calculates a passing Retry strategy', includes: '"retryEvaluationResult": "pass"' },
          { label: 'real source selector keeps the highest-authority duplicate', includes: '"highestAuthoritySourceSelected": true' },
          { label: 'real player projection withholds private text', includes: '"privatePlayerTextWithheld": true' },
          { label: 'real Retry history excludes the rejected generation', includes: '"rejectedRetryGenerationExcluded": true' },
          { label: 'real persistence receipt preserves accepted generation identity', includes: '"acceptedPersistenceGenerationPreserved": true' },
          { label: 'shared runner identities are reported transparently', includes: '"runnerIdentity": "fixture:batch0"' },
        ],
        negativeAssertions: [
          { label: 'candidate evaluator does not require manual review for the clear Retry fixture', excludes: '"retryEvaluationResult": "review_required"' },
        ],
      },
      {
        id: 'issue-24-source-pressure-state-staleness',
        issueNumber: 24,
        issueTitle: 'Roleplay Regression Fixture Harness',
        validationPhase: 'Validation Phase 2: Existing Runtime And Debug Tests',
        commandOrFixture: COMMAND,
        manualReview: 'Later export review should confirm source-pressure and state-staleness evidence is readable to a human reviewer.',
        createArtifact: () => ({
          text: buildSourcePressureStateStalenessArtifact(),
        }),
        positiveAssertions: [
          { label: 'raw user fact authority is visible', includes: '"rawUserFactAuthority": "raw_user_fact"' },
          { label: 'saved runtime state authority is visible', includes: '"savedRuntimeStateAuthority": "saved_runtime_state"' },
          { label: 'current turn override is explicit', includes: '"overriddenThisTurn": true' },
          { label: 'stale saved-state snapshot is excluded', includes: '"staleSavedStateExcluded": true' },
          { label: 'source message id is preserved', includes: '"sourceMessageId": "message-user-latest"' },
          { label: 'current user-corrected state is model-facing', includes: '"modelFacingCurrentState": "latest user corrected location"' },
        ],
        negativeAssertions: [
          { label: 'stale saved-state text is not model-facing', excludes: 'stale saved-state location' },
        ],
      },
      {
        id: 'issue-24-detail-visibility-physical-state-fixtures',
        issueNumber: 24,
        issueTitle: 'Roleplay Regression Fixture Harness',
        validationPhase: 'Validation Phase 2: Existing Runtime And Debug Tests',
        commandOrFixture: COMMAND,
        manualReview: 'Later export review should confirm response-detail, visibility, physical-state, and internal-thought diagnostic evidence is readable to a human reviewer.',
        createArtifact: () => ({
          text: buildDetailVisibilityPhysicalStateArtifact(),
        }),
        positiveAssertions: [
          { label: 'response detail lane is detailed', includes: '"responseDetailLane": "detailed"' },
          { label: 'response detail lane renders as runtime lane', includes: '"renderedIncludesResponseDetailLane": true' },
          { label: 'message parser identifies one private thought span', includes: '"thoughtTokenCount": 1' },
          { label: 'private player text is withheld from rendered provider content', includes: '"privateTextWithheld": true' },
          { label: 'privacy evaluator passes the nonleaking candidate', includes: '"privacyEvaluationResult": "pass"' },
          { label: 'generation-matched physical snapshot remains active', includes: '"activeSnapshotId": "snapshot-valid-old"' },
          { label: 'active physical location is derived from the valid snapshot', includes: '"physicalStateLocation": "Shared workspace"' },
          { label: 'rejected generation snapshot is excluded', includes: '"staleSnapshotExcluded": true' },
        ],
        negativeAssertions: [
          { label: 'private player sentence is absent from provider artifact', excludes: 'I do not want anyone else to know that I am worried.' },
          { label: 'rejected physical snapshot is not selected', excludes: '"activeSnapshotId": "snapshot-rejected"' },
        ],
      },
      {
        id: 'issue-24-mode-separation-fixtures',
        issueNumber: 24,
        issueTitle: 'Roleplay Regression Fixture Harness',
        validationPhase: 'Validation Phase 2: Existing Runtime And Debug Tests',
        commandOrFixture: COMMAND,
        manualReview: 'Later manual smoke should confirm the visible controls feel correct; this fixture proves the provider-free mode contract.',
        createArtifact: () => ({
          text: buildModeSeparationArtifact(),
        }),
        positiveAssertions: [
          { label: 'normal send mode is normal_send', includes: '"normalMode": "normal_send"' },
          { label: 'retry mode is retry_regenerate', includes: '"retryMode": "retry_regenerate"' },
          { label: 'continue mode is continue_assistant_tail', includes: '"continueMode": "continue_assistant_tail"' },
          { label: 'deleted-assistant recovery remains normal_send', includes: '"deletedAssistantRecoveryMode": "normal_send"' },
          { label: 'retry has retry rejection lane', includes: '"retryHasRetryRejectionLane": true' },
          { label: 'continue has continue anchor lane', includes: '"continueHasContinueAnchorLane": true' },
          { label: 'deleted-assistant recovery creates no new user message', includes: '"deletedRecoveryCreatesNewUserMessage": false' },
          { label: 'continue has no player-turn lane', includes: '"continueHasPlayerTurnLane": false' },
        ],
        negativeAssertions: [
          { label: 'full rejected text is not copied into artifact preview', excludes: 'full rejected attempt text' },
          { label: 'retry does not include continue anchor lane', excludes: '"retryHasContinueAnchorLane": true' },
        ],
      },
      {
        id: 'issue-24-debug-export-support-fixtures',
        issueNumber: 24,
        issueTitle: 'Roleplay Regression Fixture Harness',
        validationPhase: 'Validation Phase 3: Support-Call And Saved-Output Checks',
        commandOrFixture: COMMAND,
        manualReview: 'Later browser review should confirm the exported debug/support sections are readable to an admin reviewer.',
        createArtifact: () => ({
          text: buildDebugExportSupportArtifact(),
        }),
        positiveAssertions: [
          { label: 'debug export includes response job summary', includes: '"hasResponseJobSummary": true' },
          { label: 'debug export includes character-state support summary', includes: '"hasCharacterStateSupportSummary": true' },
          { label: 'support fixture exposes accepted outcome', includes: '"hasAcceptedSupportOutcome": true' },
          { label: 'support fixture exposes rejected outcome', includes: '"hasRejectedSupportOutcome": true' },
          { label: 'support fixture exposes physical-state review rows', includes: '"hasPhysicalStateReviewRows": true' },
          { label: 'goal alignment remains diagnostic-only', includes: '"hasGoalAlignmentDiagnosticOnly": true' },
          { label: 'memory fixture exposes rejected output', includes: '"hasMemoryRejectedOutcome": true' },
        ],
        negativeAssertions: [],
      },
      {
        id: 'issue-24-targeted-command-documentation',
        issueNumber: 24,
        issueTitle: 'Roleplay Regression Fixture Harness',
        validationPhase: 'Validation Phase 4: Typecheck And Inspection Snapshots',
        commandOrFixture: COMMAND,
        manualReview: 'Later tracker/browser review should confirm the shell and admin ledger both point future agents to the same deterministic command before manual playthrough.',
        createArtifact: async () => ({
          text: await buildTargetedCommandDocumentationArtifact(),
        }),
        positiveAssertions: [
          { label: 'targeted command is documented', includes: '"targetedCommand": "npm run validation:roleplay:batch0"' },
          { label: 'package script points at ledger writer', includes: '"packageScript": "vite-node scripts/write-roleplay-batch0-validation-ledger.ts"' },
          { label: 'companion checks are listed', includes: '"companionChecks"' },
          { label: 'deterministic fixtures run before manual playthrough', includes: '"deterministicFixturesBeforeManualPlaythrough": true' },
          { label: 'manual admin export runs after fixtures', includes: '"manualAdminExportAfterFixtures": true' },
          { label: 'provider transport stays out of fixture command scope', includes: '"providerTransportOutOfScope": true' },
        ],
        negativeAssertions: [
          { label: 'manual playthrough is not the first proof layer', excludes: '"manualPlaythroughFirst": true' },
        ],
      },
    ],
  });
}
