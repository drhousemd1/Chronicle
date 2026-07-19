import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

import { createFixtureExecutionCollector } from '@/features/validation-evidence/test-recorder';
import { runRoleplayBatch1Validation } from './roleplay-batch1-validation';

describe('runRoleplayBatch1Validation', () => {
  it('records Issue #5 final-user lane authority and rendering evidence through the shared execution writer', async () => {
    const recorder = createFixtureExecutionCollector();
    const run = await runRoleplayBatch1Validation({ recordExecution: recorder.recordExecution });

    expect(run.summary).toEqual({ total: 22, passed: 22, failed: 0 });

    const ledger = { rows: recorder.rows };
    expect(ledger.rows.map((row) => row.id)).toEqual([
      'issue-02-retry-job-contract-fixture',
      'issue-02-provider-lane-snapshot',
      'issue-02-retry-contrast-metrics',
      'issue-02-debug-export-review',
      'issue-03-regenerate-state-pruning-fixture',
      'issue-03-persistence-memory-pruning-proof',
      'issue-03-review-export-pruning-proof',
      'issue-03-prompt-leakage-guard',
      'issue-04-assistant-tail-continue-fixture',
      'issue-04-user-tail-eligibility-guard',
      'issue-04-deleted-assistant-recovery-fixture',
      'issue-04-output-debug-advancement-proof',
      'issue-05-final-user-lane-authority',
      'issue-05-structured-final-user-rendering',
      'issue-05-old-contract-regression',
      'issue-05-authority-conflict-proof',
      'issue-22-parent-message-regression-fixture',
      'issue-26-recent-history-regression-fixture',
      'issue-27-normal-send-lane-fixture',
      'issue-27-api-call-rendering-snapshot',
      'issue-27-live-contract-guard',
      'issue-27-debug-export-proof',
    ]);
    expect(ledger.rows[12]).toEqual(expect.objectContaining({
      id: 'issue-05-final-user-lane-authority',
      issueNumber: 5,
      issueTitle: 'Final User Wrapper Over-Authority',
      validationPhase: 'Validation Phase 1: API Call Lane Fixtures',
      commandOrFixture: 'npm run validation:roleplay:batch1',
      result: 'Pass',
      failureCause: '',
    }));

    const artifactPreview = (ledger.rows[12].rawReport as { artifactPreview?: string }).artifactPreview;
    expect(artifactPreview).toContain('"normalPlayerAuthority": "player_turn"');
    expect(artifactPreview).toContain('"normalCurrentStateAuthority": "state"');
    expect(artifactPreview).toContain('"normalResponseDetailAuthority": "control"');
    expect(artifactPreview).toContain('"retryRejectionAuthority": "control"');
    expect(artifactPreview).toContain('"continueAnchorAuthority": "state"');
    expect(artifactPreview).toContain('"reviewExportShowsRetryAuthority": true');
    expect(artifactPreview).toContain('"reviewExportShowsContinueAuthority": true');
    expect(artifactPreview).toContain('"playerTurnLaneExcludesRuntimeState": true');
    expect(artifactPreview).not.toContain('"missingAuthority"');

    expect(ledger.rows[13]).toEqual(expect.objectContaining({
      id: 'issue-05-structured-final-user-rendering',
      issueNumber: 5,
      issueTitle: 'Final User Wrapper Over-Authority',
      validationPhase: 'Validation Phase 2: Debug Export Fixture',
      commandOrFixture: 'npm run validation:roleplay:batch1',
      result: 'Pass',
      failureCause: '',
    }));

    const renderingPreview = (ledger.rows[13].rawReport as { artifactPreview?: string }).artifactPreview;
    expect(renderingPreview).toContain('[player_turn | user | player_turn | model-facing]');
    expect(renderingPreview).toContain('[current_state | runtime | state | model-facing]');
    expect(renderingPreview).toContain('[response_detail | runtime | control | model-facing]');
    expect(renderingPreview).toContain('"kind": "player_turn"');
    expect(renderingPreview).toContain('"authority": "player_turn"');
    expect(renderingPreview).toContain('"contentLength": 14');
    expect(renderingPreview).toContain('"contentPreview": "I step closer."');
    expect(renderingPreview).toContain('"debugExportShowsResponseJobSummary": true');
    expect(renderingPreview).toContain('"debugExportShowsNormalSendMode": true');
    expect(renderingPreview).toContain('"debugExportShowsPlayerLaneAuthority": true');
    expect(renderingPreview).toContain('"debugExportShowsCurrentStateLaneAuthority": true');
    expect(renderingPreview).toContain('"debugExportShowsResponseDetailLaneAuthority": true');
    expect(renderingPreview).toContain('"liveRequestCaptureIncludesResponseJob": true');
    expect(renderingPreview).toContain('"liveRequestCaptureIncludesLaneEvidence": true');
    expect(renderingPreview).toContain('"reviewExportReadsResponseJobFromCapturedRequestBody": true');
    expect(renderingPreview).toContain('"fallbackTextRendered": false');
    expect(renderingPreview).toContain('"fallbackStateRendered": false');

    expect(ledger.rows[14]).toEqual(expect.objectContaining({
      id: 'issue-05-old-contract-regression',
      issueNumber: 5,
      issueTitle: 'Final User Wrapper Over-Authority',
      validationPhase: 'Validation Phase 3: Old Contract Regression Checks',
      commandOrFixture: 'npm run validation:roleplay:batch1',
      result: 'Pass',
      failureCause: '',
    }));

    const oldContractPreview = (ledger.rows[14].rawReport as { artifactPreview?: string }).artifactPreview;
    expect(oldContractPreview).toContain('"responseJobWinsOverLegacyUserMessage": true');
    expect(oldContractPreview).toContain('"responseJobWinsOverLegacyCurrentState": true');
    expect(oldContractPreview).toContain('"responseJobWinsOverLegacyRegenerationDirective": true');
    expect(oldContractPreview).toContain('"legacyPathStillExistsWithoutResponseJob": true');
    expect(oldContractPreview).toContain('"finalMessageUsesResponseJobContent": true');
    expect(oldContractPreview).toContain('"responseJobLaneEvidencePresent": true');
    expect(oldContractPreview).toContain('"legacyFallbackTextRendered": false');
    expect(oldContractPreview).toContain('"legacyFallbackStateRendered": false');
    expect(oldContractPreview).toContain('"legacyRegenerationDirectiveRenderedInResponseJobPath": false');

    expect(ledger.rows[15]).toEqual(expect.objectContaining({
      id: 'issue-05-authority-conflict-proof',
      issueNumber: 5,
      issueTitle: 'Final User Wrapper Over-Authority',
      validationPhase: 'Validation Phase 4: Authority Conflict Proof',
      commandOrFixture: 'npm run validation:roleplay:batch1',
      result: 'Pass',
      failureCause: '',
    }));

    const conflictPreview = (ledger.rows[15].rawReport as { artifactPreview?: string }).artifactPreview;
    expect(conflictPreview).toContain('"playerTurnLanePrecedesCurrentStateLane": true');
    expect(conflictPreview).toContain('"playerTurnAuthorityVisible": true');
    expect(conflictPreview).toContain('"currentStateAuthorityVisible": true');
    expect(conflictPreview).toContain('"currentStateStillAvailable": true');
    expect(conflictPreview).toContain('"conflictPriorityRuleRendered": true');
    expect(conflictPreview).toContain('"laneEvidenceSeparatesPlayerTurnAndState": true');
    expect(conflictPreview).toContain('"currentStateCopiedIntoPlayerTurnLane": false');
    expect(conflictPreview).toContain('"playerActionCopiedIntoCurrentStateLane": false');

    expect(ledger.rows[18]).toEqual(expect.objectContaining({
      id: 'issue-27-normal-send-lane-fixture',
      issueNumber: 27,
      issueTitle: 'Established-Fact Note Mixed Into Player Turn',
      validationPhase: 'Validation Phase 1: Normal Send Lane Fixture',
      commandOrFixture: 'npm run validation:roleplay:batch1',
      result: 'Pass',
      failureCause: '',
    }));

    const normalSendLanePreview = (ledger.rows[18].rawReport as { artifactPreview?: string }).artifactPreview;
    expect(normalSendLanePreview).toContain('"hasEstablishedFactLane": true');
    expect(normalSendLanePreview).toContain('"playerTurnLaneContainsOnlyRawPlayerText": true');
    expect(normalSendLanePreview).toContain('"establishedFactNoteCopiedIntoPlayerTurn": false');
    expect(normalSendLanePreview).toContain('"retryOrContinueLaneRendered": false');

    expect(ledger.rows[19]).toEqual(expect.objectContaining({
      id: 'issue-27-api-call-rendering-snapshot',
      issueNumber: 27,
      issueTitle: 'Established-Fact Note Mixed Into Player Turn',
      validationPhase: 'Validation Phase 2: API Call Rendering Snapshot',
      commandOrFixture: 'npm run validation:roleplay:batch1',
      result: 'Pass',
      failureCause: '',
    }));

    const renderingSnapshotPreview = (ledger.rows[19].rawReport as { artifactPreview?: string }).artifactPreview;
    expect(renderingSnapshotPreview).toContain('"responseJobWinsOverPoisonedUserMessage": true');
    expect(renderingSnapshotPreview).toContain('"finalUserContentShowsEstablishedFactLane": true');
    expect(renderingSnapshotPreview).toContain('"poisonedLegacyUserMessageRendered": false');

    expect(ledger.rows[20]).toEqual(expect.objectContaining({
      id: 'issue-27-live-contract-guard',
      issueNumber: 27,
      issueTitle: 'Established-Fact Note Mixed Into Player Turn',
      validationPhase: 'Validation Phase 3: Live Contract Guard',
      commandOrFixture: 'npm run validation:roleplay:batch1',
      result: 'Pass',
      failureCause: '',
    }));

    const liveContractPreview = (ledger.rows[20].rawReport as { artifactPreview?: string }).artifactPreview;
    expect(liveContractPreview).toContain('"normalSendBuilderReceivesEstablishedFactNote": true');
    expect(liveContractPreview).toContain('"normalSendPlayerTurnUsesRawUserInput": true');
    expect(liveContractPreview).toContain('"collectRoleplayResponseUsesRawCompatibilityUserMessage": true');
    expect(liveContractPreview).toContain('"oldMixedLlmInputControlsNormalSend": false');

    expect(ledger.rows[21]).toEqual(expect.objectContaining({
      id: 'issue-27-debug-export-proof',
      issueNumber: 27,
      issueTitle: 'Established-Fact Note Mixed Into Player Turn',
      validationPhase: 'Validation Phase 4: Debug Export Proof',
      commandOrFixture: 'npm run validation:roleplay:batch1',
      result: 'Pass',
      failureCause: '',
    }));

    const debugExportPreview = (ledger.rows[21].rawReport as { artifactPreview?: string }).artifactPreview;
    expect(debugExportPreview).toContain('"debugExportShowsEstablishedFactLane": true');
    expect(debugExportPreview).toContain('"debugExportShowsPlayerTurnLane": true');
    expect(debugExportPreview).toContain('"debugExportClaimsFullSourceReceiptCoverage": false');
    expect(debugExportPreview).toContain('"debugExportRepresentsNoteAsPlayerAuthored": false');

    expect(ledger.rows[0]).toEqual(expect.objectContaining({
      id: 'issue-02-retry-job-contract-fixture',
      issueNumber: 2,
      issueTitle: 'Retry Button Failure',
      validationPhase: 'Validation Phase 1: Retry Job Contract Fixture',
      commandOrFixture: 'npm run validation:roleplay:batch1',
      result: 'Pass',
      failureCause: '',
    }));

    const retryContractPreview = (ledger.rows[0].rawReport as { artifactPreview?: string }).artifactPreview;
    expect(retryContractPreview).toContain('"mode": "retry_regenerate"');
    expect(retryContractPreview).toContain('"strategy": "exclude_rejected_attempt"');
    expect(retryContractPreview).toContain('"playerTurnLaneContainsOnlyRawPlayerText": true');
    expect(retryContractPreview).toContain('"establishedFactLaneExists": true');
    expect(retryContractPreview).toContain('"retryRejectionLaneAuthority": "control"');
    expect(retryContractPreview).toContain('"rejectedFullTextModelFacing": false');
    expect(retryContractPreview).toContain('"establishedFactNoteCopiedIntoPlayerTurn": false');

    expect(ledger.rows[1]).toEqual(expect.objectContaining({
      id: 'issue-02-provider-lane-snapshot',
      issueNumber: 2,
      issueTitle: 'Retry Button Failure',
      validationPhase: 'Validation Phase 2: Provider Message Lane Snapshot',
      result: 'Pass',
      failureCause: '',
    }));

    const retrySnapshotPreview = (ledger.rows[1].rawReport as { artifactPreview?: string }).artifactPreview;
    expect(retrySnapshotPreview).toContain('"finalMessageUsesResponseJobContent": true');
    expect(retrySnapshotPreview).toContain('"finalUserContentShowsEstablishedFactLane": true');
    expect(retrySnapshotPreview).toContain('"finalUserContentShowsRetryRejectionLane": true');
    expect(retrySnapshotPreview).toContain('"finalUserContentShowsRetrySummary": true');
    expect(retrySnapshotPreview).toContain('"poisonedLegacyFallbackRendered": false');
    expect(retrySnapshotPreview).toContain('"rejectedFullTextRendered": false');
    expect(retrySnapshotPreview).toContain('"legacyRegenerationDirectiveRendered": false');

    expect(ledger.rows[2]).toEqual(expect.objectContaining({
      id: 'issue-02-retry-contrast-metrics',
      issueNumber: 2,
      issueTitle: 'Retry Button Failure',
      validationPhase: 'Validation Phase 3: Retry Contrast Metrics Fixture',
      result: 'Pass',
      failureCause: '',
    }));

    const retryContrastPreview = (ledger.rows[2].rawReport as { artifactPreview?: string }).artifactPreview;
    expect(retryContrastPreview).toContain('"telemetryDiagnosticOnly": true');
    expect(retryContrastPreview).toContain('"hiddenRetryAllowed": false');
    expect(retryContrastPreview).toContain('"candidateTelemetryTriggered": true');
    expect(retryContrastPreview).toContain('reused_short_dialogue_phrasing');
    expect(retryContrastPreview).toContain('"retryUsesRejectedAttemptComparisonText": true');
    expect(retryContrastPreview).toContain('"retryRecordsRegenerateStyleTelemetry": true');
    expect(retryContrastPreview).toContain('"hiddenSecondRetryPathCreated": false');

    expect(ledger.rows[3]).toEqual(expect.objectContaining({
      id: 'issue-02-debug-export-review',
      issueNumber: 2,
      issueTitle: 'Retry Button Failure',
      validationPhase: 'Validation Phase 4: Debug Export Review',
      result: 'Pass',
      failureCause: '',
    }));

    const retryDebugExportPreview = (ledger.rows[3].rawReport as { artifactPreview?: string }).artifactPreview;
    expect(retryDebugExportPreview).toContain('"debugExportShowsRetryMode": true');
    expect(retryDebugExportPreview).toContain('"debugExportShowsEstablishedFactLane": true');
    expect(retryDebugExportPreview).toContain('"debugExportShowsRetryRejectionLane": true');
    expect(retryDebugExportPreview).toContain('"liveRetryBuilderReceivesEstablishedFactNote": true');
    expect(retryDebugExportPreview).toContain('"liveRetryCollectorUsesRawCompatibilityUserMessage": true');
    expect(retryDebugExportPreview).toContain('"debugExportLeaksFullRejectedText": false');
    expect(retryDebugExportPreview).toContain('"liveRetryStillBuildsPreviousAssistantContext": false');

    const recentHistoryPreview = (ledger.rows[17].rawReport as { artifactPreview?: string }).artifactPreview;
    expect(ledger.rows[17]).toEqual(expect.objectContaining({
      id: 'issue-26-recent-history-regression-fixture',
      issueNumber: 26,
      issueTitle: 'Recent Assistant History Self-Anchoring',
      result: 'Pass',
      failureCause: '',
    }));
    expect(recentHistoryPreview).toContain('"normalKeepsLatestAssistant": true');
    expect(recentHistoryPreview).toContain('"normalUsesStructuredOutcomeSummary": true');
    expect(recentHistoryPreview).toContain('"normalSummaryPreservesApprovedObservation": true');
    expect(recentHistoryPreview).toContain('"normalSummaryExcludesDistinctiveOldAssistantWording": true');
    expect(recentHistoryPreview).toContain('"normalRemovesRepeatedAnchorFromOlderAssistant": true');
    expect(recentHistoryPreview).toContain('"retryRejectsFullTextFromHistory": true');
    expect(recentHistoryPreview).toContain('"retryHasContrastReceipt": true');
    expect(recentHistoryPreview).toContain('"continueAvoidsTailDuplication": true');
    expect(recentHistoryPreview).toContain('"continueHasAnchorReceipt": true');
    expect(recentHistoryPreview).toContain('"retryOrContinueInventsOutcomeSummary": false');

    expect(ledger.rows[4]).toEqual(expect.objectContaining({
      id: 'issue-03-regenerate-state-pruning-fixture',
      issueNumber: 3,
      issueTitle: 'Retry Superseded-Generation Contamination',
      validationPhase: 'Validation Phase 1: Regenerate State Fixture',
      result: 'Pass',
      failureCause: '',
    }));

    const regeneratePruningPreview = (ledger.rows[4].rawReport as { artifactPreview?: string }).artifactPreview;
    expect(regeneratePruningPreview).toContain('"activeMemoryIds": [');
    expect(regeneratePruningPreview).toContain('"memory-current"');
    expect(regeneratePruningPreview).toContain('"memory-stale"');
    expect(regeneratePruningPreview).toContain('"included": false');
    expect(regeneratePruningPreview).toContain('"reason": "stale_generation"');
    expect(regeneratePruningPreview).toContain('"staleMemoryIncludedAsActive": false');

    expect(ledger.rows[5]).toEqual(expect.objectContaining({
      id: 'issue-03-persistence-memory-pruning-proof',
      issueNumber: 3,
      issueTitle: 'Retry Superseded-Generation Contamination',
      validationPhase: 'Validation Phase 2: Persistence Memory Proof',
      result: 'Pass',
      failureCause: '',
    }));

    const persistencePreview = (ledger.rows[5].rawReport as { artifactPreview?: string }).artifactPreview;
    expect(persistencePreview).toContain('"activeMemoryIds": [');
    expect(persistencePreview).toContain('"pruningReportCount": 3');
    expect(persistencePreview).toContain('"staleMemoryReturned": false');
    expect(persistencePreview).toContain('"deletedSourceMemoryReturned": false');

    expect(ledger.rows[6]).toEqual(expect.objectContaining({
      id: 'issue-03-review-export-pruning-proof',
      issueNumber: 3,
      issueTitle: 'Retry Superseded-Generation Contamination',
      validationPhase: 'Validation Phase 3: Review Export Proof',
      result: 'Pass',
      failureCause: '',
    }));

    const exportPreview = (ledger.rows[6].rawReport as { artifactPreview?: string }).artifactPreview;
    expect(exportPreview).toContain('"exportShowsStatePruningReport": true');
    expect(exportPreview).toContain('"exportShowsPrunedStaleMemory": true');
    expect(exportPreview).toContain('"exportTreatsPruningAsAppliedUpdates": false');
    expect(exportPreview).toContain('"embeddedDebugDataIncludesPruningReports": true');

    expect(ledger.rows[7]).toEqual(expect.objectContaining({
      id: 'issue-03-prompt-leakage-guard',
      issueNumber: 3,
      issueTitle: 'Retry Superseded-Generation Contamination',
      validationPhase: 'Validation Phase 4: Prompt Leakage Guard',
      result: 'Pass',
      failureCause: '',
    }));

    const leakagePreview = (ledger.rows[7].rawReport as { artifactPreview?: string }).artifactPreview;
    expect(leakagePreview).toContain('"activeMemoryRendered": true');
    expect(leakagePreview).toContain('"staleMemoryRendered": false');
    expect(leakagePreview).toContain('"pruningReasonRendered": false');
    expect(leakagePreview).toContain('"debugOnlyReportRendered": false');
  });

  it('records Issue #4 continue and deleted-assistant recovery evidence through the shared execution writer', async () => {
    const recorder = createFixtureExecutionCollector();
    const run = await runRoleplayBatch1Validation({ recordExecution: recorder.recordExecution });

    expect(run.summary.total).toBeGreaterThanOrEqual(20);

    const ledger = { rows: recorder.rows };
    const issue04Rows = ledger.rows.filter((row) => row.issueNumber === 4);

    expect(issue04Rows.map((row) => row.id)).toEqual([
      'issue-04-assistant-tail-continue-fixture',
      'issue-04-user-tail-eligibility-guard',
      'issue-04-deleted-assistant-recovery-fixture',
      'issue-04-output-debug-advancement-proof',
    ]);

    const assistantTailPreview = (issue04Rows[0].rawReport as { artifactPreview?: string }).artifactPreview;
    expect(assistantTailPreview).toContain('"continueMode": "continue_assistant_tail"');
    expect(assistantTailPreview).toContain('"continuePurpose": "extend_accepted_assistant_response"');
    expect(assistantTailPreview).toContain('"assistantAnchorId": "assistant-accepted-1"');
    expect(assistantTailPreview).toContain('"playerTurnIsNull": true');
    expect(assistantTailPreview).toContain('"continueAnchorLaneRendered": true');
    expect(assistantTailPreview).toContain('"playerTurnLaneRendered": false');

    const userTailGuardPreview = (issue04Rows[1].rawReport as { artifactPreview?: string }).artifactPreview;
    expect(userTailGuardPreview).toContain('"liveHandlerImportsRecoveryBuilder": true');
    expect(userTailGuardPreview).toContain('"liveHandlerBuildsRecoveryJob": true');
    expect(userTailGuardPreview).toContain('"liveHandlerStillHasAssistantOnlyEarlyReturn": false');
    expect(userTailGuardPreview).toContain('"latestUserTailBuildsContinueJob": false');

    const recoveryPreview = (issue04Rows[2].rawReport as { artifactPreview?: string }).artifactPreview;
    expect(recoveryPreview).toContain('"recoveryMode": "normal_send"');
    expect(recoveryPreview).toContain('"recoveryVariant": "deleted_assistant_recovery"');
    expect(recoveryPreview).toContain('"createsNewUserMessage": false');
    expect(recoveryPreview).toContain('"visibleUserTailRenderedOnce": true');
    expect(recoveryPreview).toContain('"deletedAssistantTextRendered": false');
    expect(recoveryPreview).toContain('"continueAnchorRendered": false');

    const debugPreview = (issue04Rows[3].rawReport as { artifactPreview?: string }).artifactPreview;
    expect(debugPreview).toContain('"continueDebugShowsMode": true');
    expect(debugPreview).toContain('"continueDebugShowsAnchor": true');
    expect(debugPreview).toContain('"recoveryDebugShowsVariant": true');
    expect(debugPreview).toContain('"recoveryDebugShowsNoNewUserRow": true');
    expect(debugPreview).toContain('"debugTreatsRecoveryAsFourthMode": false');
  });

  it('exposes a package command for generating the Batch 1 ledger artifact', async () => {
    const packageJson = JSON.parse(await readFile('package.json', 'utf8'));

    expect(packageJson.scripts['validation:roleplay:batch1'])
      .toBe('vite-node scripts/write-roleplay-batch1-validation-ledger.ts');

    const scriptSource = await readFile('scripts/write-roleplay-batch1-validation-ledger.ts', 'utf8');
    expect(scriptSource).toContain('runRoleplayBatch1Validation');
  });
});
