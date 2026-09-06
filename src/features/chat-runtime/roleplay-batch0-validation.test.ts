import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

import { createFixtureExecutionCollector } from '@/features/validation-evidence/test-recorder';
import { runRoleplayBatch0Validation } from './roleplay-batch0-validation';

describe('runRoleplayBatch0Validation', () => {
  it('records Batch 0 fixture and response-job evidence through the shared execution writer', async () => {
    const recorder = createFixtureExecutionCollector();
    const run = await runRoleplayBatch0Validation({ recordExecution: recorder.recordExecution });

    expect(run.results
      .filter((result) => result.result === 'fail')
      .map((result) => ({ id: result.id, failedAssertions: result.failedAssertions })))
      .toEqual([]);
    expect(run.summary).toEqual({ total: 11, passed: 11, failed: 0 });

    const ledger = { rows: recorder.rows };
    expect(ledger.rows.map((row) => row.id)).toEqual([
      'issue-01-contract-unit-tests',
      'issue-01-provider-free-snapshot-tests',
      'issue-01-runtime-integration',
      'issue-01-deleted-assistant-recovery-fixture',
      'issue-01-debug-export-review',
      'issue-24-fixture-harness-command',
      'issue-24-detail-visibility-physical-state-fixtures',
      'issue-24-mode-separation-fixtures',
      'issue-24-source-pressure-state-staleness',
      'issue-24-debug-export-support-fixtures',
      'issue-24-targeted-command-documentation',
    ]);
    expect(ledger.rows).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'issue-24-fixture-harness-command',
        issueNumber: 24,
        result: 'Pass',
        commandOrFixture: 'npm run validation:roleplay:batch0',
      }),
      expect.objectContaining({
        id: 'issue-24-source-pressure-state-staleness',
        issueNumber: 24,
        validationPhase: 'Validation Phase 2: Existing Runtime And Debug Tests',
        result: 'Pass',
        commandOrFixture: 'npm run validation:roleplay:batch0',
      }),
      expect.objectContaining({
        id: 'issue-24-detail-visibility-physical-state-fixtures',
        issueNumber: 24,
        validationPhase: 'Validation Phase 2: Existing Runtime And Debug Tests',
        result: 'Pass',
        commandOrFixture: 'npm run validation:roleplay:batch0',
      }),
      expect.objectContaining({
        id: 'issue-24-debug-export-support-fixtures',
        issueNumber: 24,
        validationPhase: 'Validation Phase 3: Support-Call And Saved-Output Checks',
        result: 'Pass',
        commandOrFixture: 'npm run validation:roleplay:batch0',
      }),
      expect.objectContaining({
        id: 'issue-24-targeted-command-documentation',
        issueNumber: 24,
        validationPhase: 'Validation Phase 4: Typecheck And Inspection Snapshots',
        result: 'Pass',
        commandOrFixture: 'npm run validation:roleplay:batch0',
      }),
      expect.objectContaining({
        id: 'issue-24-mode-separation-fixtures',
        issueNumber: 24,
        validationPhase: 'Validation Phase 2: Existing Runtime And Debug Tests',
        result: 'Pass',
        commandOrFixture: 'npm run validation:roleplay:batch0',
      }),
      expect.objectContaining({
        id: 'issue-01-contract-unit-tests',
        issueNumber: 1,
        result: 'Pass',
        failureCause: '',
      }),
      expect.objectContaining({
        id: 'issue-01-runtime-integration',
        issueNumber: 1,
        validationPhase: 'Validation Phase 3: Runtime Integration Tests',
        result: 'Pass',
      }),
      expect.objectContaining({
        id: 'issue-01-deleted-assistant-recovery-fixture',
        issueNumber: 1,
        result: 'Pass',
      }),
      expect.objectContaining({
        id: 'issue-01-debug-export-review',
        issueNumber: 1,
        validationPhase: 'Validation Phase 5: Debug Export Review',
        result: 'Pass',
      }),
    ]));

    const runtimeIntegrationRow = ledger.rows.find((row) => row.id === 'issue-01-runtime-integration');
    const runtimeArtifactPreview = (runtimeIntegrationRow?.rawReport as { artifactPreview?: string } | undefined)?.artifactPreview;
    expect(runtimeArtifactPreview).toContain('"retryBranchBuildsRetryJob": true');
    expect(runtimeArtifactPreview).toContain('"retryBranchPassesResponseJob": true');
    expect(runtimeArtifactPreview).toContain('"retryRenderedMode": "retry_regenerate"');
    expect(runtimeArtifactPreview).toContain('"continueBranchBuildsContinueJob": true');
    expect(runtimeArtifactPreview).toContain('"continueBranchPassesResponseJob": true');
    expect(runtimeArtifactPreview).toContain('"continueRenderedMode": "continue_assistant_tail"');

    const debugExportRow = ledger.rows.find((row) => row.id === 'issue-01-debug-export-review');
    const debugExportArtifactPreview = (debugExportRow?.rawReport as { artifactPreview?: string } | undefined)?.artifactPreview;
    expect(debugExportArtifactPreview).toContain('"hasResponseJobSummary": true');
    expect(debugExportArtifactPreview).toContain('"hasRetryModeSummary": true');
    expect(debugExportArtifactPreview).toContain('"hasContinueModeSummary": true');
    expect(debugExportArtifactPreview).toContain('"leaksFullRejectedText": false');

    const sourcePressureRow = ledger.rows.find((row) => row.id === 'issue-24-source-pressure-state-staleness');
    const sourcePressureArtifactPreview = (sourcePressureRow?.rawReport as { artifactPreview?: string } | undefined)?.artifactPreview;
    expect(sourcePressureArtifactPreview).toContain('"rawUserFactAuthority": "raw_user_fact"');
    expect(sourcePressureArtifactPreview).toContain('"savedRuntimeStateAuthority": "saved_runtime_state"');
    expect(sourcePressureArtifactPreview).toContain('"overriddenThisTurn": true');
    expect(sourcePressureArtifactPreview).toContain('"staleSavedStateExcluded": true');
    expect(sourcePressureArtifactPreview).toContain('"sourceMessageId": "message-user-latest"');
    expect(sourcePressureArtifactPreview).not.toContain('stale saved-state location');

    const modeSeparationRow = ledger.rows.find((row) => row.id === 'issue-24-mode-separation-fixtures');
    const modeSeparationArtifactPreview = (modeSeparationRow?.rawReport as { artifactPreview?: string } | undefined)?.artifactPreview;
    expect(modeSeparationArtifactPreview).toContain('"normalMode": "normal_send"');
    expect(modeSeparationArtifactPreview).toContain('"retryMode": "retry_regenerate"');
    expect(modeSeparationArtifactPreview).toContain('"continueMode": "continue_assistant_tail"');
    expect(modeSeparationArtifactPreview).toContain('"deletedAssistantRecoveryMode": "normal_send"');
    expect(modeSeparationArtifactPreview).toContain('"retryHasRetryRejectionLane": true');
    expect(modeSeparationArtifactPreview).toContain('"continueHasContinueAnchorLane": true');
    expect(modeSeparationArtifactPreview).toContain('"deletedRecoveryCreatesNewUserMessage": false');
    expect(modeSeparationArtifactPreview).toContain('"continueHasPlayerTurnLane": false');
    expect(modeSeparationArtifactPreview).not.toContain('full rejected attempt text');

    const detailVisibilityRow = ledger.rows.find((row) => row.id === 'issue-24-detail-visibility-physical-state-fixtures');
    const detailVisibilityArtifactPreview = (detailVisibilityRow?.rawReport as { artifactPreview?: string } | undefined)?.artifactPreview;
    expect(detailVisibilityArtifactPreview).toContain('"responseDetailLane": "detailed"');
    expect(detailVisibilityArtifactPreview).toContain('"thoughtTokenCount": 1');
    expect(detailVisibilityArtifactPreview).toContain('"privateTextWithheld": true');
    expect(detailVisibilityArtifactPreview).toContain('"privacyEvaluationResult": "pass"');
    expect(detailVisibilityArtifactPreview).toContain('"activeSnapshotId": "snapshot-valid-old"');
    expect(detailVisibilityArtifactPreview).toContain('"physicalStateLocation": "Shared workspace"');
    expect(detailVisibilityArtifactPreview).toContain('"staleSnapshotExcluded": true');
    expect(detailVisibilityArtifactPreview).not.toContain('I do not want anyone else to know that I am worried.');

    const debugSupportRow = ledger.rows.find((row) => row.id === 'issue-24-debug-export-support-fixtures');
    const debugSupportArtifactPreview = (debugSupportRow?.rawReport as { artifactPreview?: string } | undefined)?.artifactPreview;
    expect(debugSupportArtifactPreview).toContain('"hasResponseJobSummary": true');
    expect(debugSupportArtifactPreview).toContain('"hasCharacterStateSupportSummary": true');
    expect(debugSupportArtifactPreview).toContain('"hasAcceptedSupportOutcome": true');
    expect(debugSupportArtifactPreview).toContain('"hasRejectedSupportOutcome": true');
    expect(debugSupportArtifactPreview).toContain('"hasPhysicalStateReviewRows": true');
    expect(debugSupportArtifactPreview).toContain('"hasGoalAlignmentDiagnosticOnly": true');
    expect(debugSupportArtifactPreview).toContain('"hasMemoryRejectedOutcome": true');

    const targetedCommandRow = ledger.rows.find((row) => row.id === 'issue-24-targeted-command-documentation');
    const targetedCommandArtifactPreview = (targetedCommandRow?.rawReport as { artifactPreview?: string } | undefined)?.artifactPreview;
    expect(targetedCommandArtifactPreview).toContain('"targetedCommand": "npm run validation:roleplay:batch0"');
    expect(targetedCommandArtifactPreview).toContain('"packageScript": "vite-node scripts/write-roleplay-batch0-validation-ledger.ts"');
    expect(targetedCommandArtifactPreview).toContain('"deterministicFixturesBeforeManualPlaythrough": true');
    expect(targetedCommandArtifactPreview).toContain('"manualAdminExportAfterFixtures": true');
    expect(targetedCommandArtifactPreview).toContain('"providerTransportOutOfScope": true');
    expect(targetedCommandArtifactPreview).toContain('"companionChecks"');
    expect(targetedCommandArtifactPreview).toContain('npm run test -- src/services/api-usage-validation.test.ts');
    expect(targetedCommandArtifactPreview).not.toContain('"manualPlaythroughFirst": true');
  });

  it('exposes a package command for generating the file-backed ledger artifact', async () => {
    const packageJson = JSON.parse(await readFile('package.json', 'utf8'));

    expect(packageJson.scripts['validation:roleplay:batch0'])
      .toBe('vite-node scripts/write-roleplay-batch0-validation-ledger.ts');

    const scriptSource = await readFile('scripts/write-roleplay-batch0-validation-ledger.ts', 'utf8');
    expect(scriptSource).toContain('runRoleplayBatch0Validation');
  });
});
