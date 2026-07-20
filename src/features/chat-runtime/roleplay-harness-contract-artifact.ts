import type { Message } from '@/types';

import { buildRoleplayCharacterStateApplyReceipt } from './roleplay-character-state-review';
import { createRoleplayFixtureScenario } from './roleplay-fixture-scenarios';
import { projectPlayerTurnVisibility } from './player-turn-visibility';
import { compileRoleplayRecentHistory } from './roleplay-recent-history';
import { buildRetryRegenerateResponseJob } from './roleplay-response-job';
import { buildRoleplayActiveScenePacketCandidate } from './roleplay-source-shaping';
import { createRoleplaySourceReceipt } from './roleplay-source-receipts';

export type RoleplayHarnessContractTargets = Readonly<{
  selectSources: typeof buildRoleplayActiveScenePacketCandidate;
  projectPlayerTurn: typeof projectPlayerTurnVisibility;
  compileRecentHistory: typeof compileRoleplayRecentHistory;
  buildPersistenceReceipt: typeof buildRoleplayCharacterStateApplyReceipt;
}>;

export type RoleplayHarnessContractArtifact = Readonly<{
  sourceSelection: Readonly<{
    selectedReceiptIds: readonly string[];
    expectedReceiptId: string;
  }>;
  playerProjection: Readonly<{
    visibleText: string;
    privateText: string;
  }>;
  retryHistory: Readonly<{
    providerMessages: readonly string[];
    rejectedText: string;
  }>;
  persistence: Readonly<{
    sourceGenerationId?: string;
    expectedSourceGenerationId: string;
  }>;
}>;

export type RoleplayHarnessContractChecks = Readonly<{
  highestAuthoritySourceSelected: boolean;
  privatePlayerTextWithheld: boolean;
  rejectedRetryGenerationExcluded: boolean;
  acceptedPersistenceGenerationPreserved: boolean;
}>;

const DEFAULT_TARGETS: RoleplayHarnessContractTargets = {
  selectSources: buildRoleplayActiveScenePacketCandidate,
  projectPlayerTurn: projectPlayerTurnVisibility,
  compileRecentHistory: compileRoleplayRecentHistory,
  buildPersistenceReceipt: buildRoleplayCharacterStateApplyReceipt,
};

export function buildRoleplayHarnessContractArtifact(
  overrides: Partial<RoleplayHarnessContractTargets> = {},
): RoleplayHarnessContractArtifact {
  const targets = { ...DEFAULT_TARGETS, ...overrides };
  const scenario = createRoleplayFixtureScenario({ id: 'roleplay-harness-contract-artifact' });
  const highAuthorityReceipt = createRoleplaySourceReceipt({
    surface: 'player_turn',
    sourceId: 'latest-player-turn',
    content: 'The latest player correction applies now.',
    authority: 'highest',
    modelFacing: true,
    disposition: 'included',
    reason: 'latest_player_authority',
  });
  const staleReceipt = createRoleplaySourceReceipt({
    surface: 'current_state',
    sourceId: 'stale-current-state',
    content: 'The latest player correction applies now.',
    authority: 'medium',
    modelFacing: true,
    disposition: 'included',
    reason: 'saved_runtime_state',
  });
  const selectedSources = targets.selectSources({
    receipts: [staleReceipt, highAuthorityReceipt],
    turnNumber: 3,
  });

  const latestPlayerMessage = scenario.messages.find((message) => message.id === 'message-user-latest');
  const retryChain = scenario.generationChains.find((chain) => chain.kind === 'retry');
  if (!latestPlayerMessage || !retryChain) {
    throw new Error('Harness scenario is missing its latest player message or Retry chain.');
  }
  const visibleText = targets.projectPlayerTurn(
    latestPlayerMessage.text,
    latestPlayerMessage.id,
  ).visibleText;

  const historyMessages = scenario.messages
    .filter((message) => [retryChain.parentUserMessageId, retryChain.sourceAssistantMessageId].includes(message.id))
    .map((message) => ({
      id: message.id,
      role: message.role,
      text: message.text,
      generationId: message.generationId,
      createdAt: message.createdAt,
    } satisfies Message));
  const rejectedMessage = historyMessages.find((message) => message.id === retryChain.sourceAssistantMessageId);
  if (!rejectedMessage) throw new Error('Harness scenario is missing its rejected Retry message.');
  const retryJob = buildRetryRegenerateResponseJob({
    conversationId: scenario.conversationId,
    playerTurn: { messageId: latestPlayerMessage.id, text: visibleText },
    rejectedAttempt: {
      messageId: rejectedMessage.id,
      generationId: rejectedMessage.generationId,
      text: rejectedMessage.text,
      summary: 'The rejected response repeated its prior response strategy.',
    },
    currentStateSummary: 'The current scene remains active.',
    responseDetail: 'standard',
  });
  const recentHistory = targets.compileRecentHistory({
    messages: historyMessages,
    responseJob: retryJob,
    limit: 20,
    isLocalNotice: () => false,
  }).packet;

  const persistenceReceipt = targets.buildPersistenceReceipt({
    candidate: {
      reviewStatus: 'accepted_reviewed_candidate',
      character: 'Primary Companion',
      field: 'location',
      value: 'Shared workspace',
      evidence: 'The accepted assistant generation moved her there.',
      confidence: 1,
    },
    outcome: 'persisted',
    reason: 'reviewed_location_persisted',
    sourceMessageId: retryChain.resultAssistantMessageId,
    sourceGenerationId: retryChain.resultGenerationId,
    persistenceTargetId: 'snapshot-current',
  });

  return {
    sourceSelection: {
      selectedReceiptIds: selectedSources.includedReceiptIds,
      expectedReceiptId: highAuthorityReceipt.id,
    },
    playerProjection: {
      visibleText,
      privateText: scenario.privatePlayerText,
    },
    retryHistory: {
      providerMessages: recentHistory.providerMessages.map((message) => message.content),
      rejectedText: rejectedMessage.text,
    },
    persistence: {
      sourceGenerationId: persistenceReceipt.sourceGenerationId,
      expectedSourceGenerationId: retryChain.resultGenerationId,
    },
  };
}

export function evaluateRoleplayHarnessContractArtifact(
  artifact: RoleplayHarnessContractArtifact,
): RoleplayHarnessContractChecks {
  return {
    highestAuthoritySourceSelected: artifact.sourceSelection.selectedReceiptIds
      .includes(artifact.sourceSelection.expectedReceiptId),
    privatePlayerTextWithheld: !artifact.playerProjection.visibleText
      .includes(artifact.playerProjection.privateText),
    rejectedRetryGenerationExcluded: artifact.retryHistory.providerMessages
      .every((message) => !message.includes(artifact.retryHistory.rejectedText)),
    acceptedPersistenceGenerationPreserved: artifact.persistence.sourceGenerationId
      === artifact.persistence.expectedSourceGenerationId,
  };
}
