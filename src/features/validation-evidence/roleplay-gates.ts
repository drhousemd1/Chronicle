export const ROLEPLAY_VALIDATION_SCOPE_ID = 'roleplay-restart-v1';

export type ValidationEvidenceKind = 'fixture' | 'command' | 'manual';
export type ValidationGateExpectation = 'pass' | 'fail';
export type ValidationGateLifecycle = 'active' | 'blocked' | 'superseded';

export type FixtureGateRunner = {
  kind: 'fixture';
  batch: 'batch0' | 'batch1';
  fixtureId: string;
};

export type CommandGateRunner = {
  kind: 'command';
  executable: 'node';
  args: readonly string[];
  workingDirectory: 'repo-root';
  timeoutMs: number;
  environmentAllowlist: readonly string[];
};

export type ManualGateRunner = {
  kind: 'manual';
};

export type ValidationGateDefinition = {
  gateId: string;
  activeScopeId: typeof ROLEPLAY_VALIDATION_SCOPE_ID;
  issueNumber: number;
  issueTitle: string;
  validationPhase: string;
  evidenceKind: ValidationEvidenceKind;
  expectedResult: ValidationGateExpectation;
  lifecycle: ValidationGateLifecycle;
  manualReviewRequired: boolean;
  runner: FixtureGateRunner | CommandGateRunner | ManualGateRunner;
};

type FixtureGateSeed = readonly [
  gateId: string,
  issueNumber: number,
  issueTitle: string,
  validationPhase: string,
  batch: 'batch0' | 'batch1',
];

const FIXTURE_GATE_SEEDS: readonly FixtureGateSeed[] = [
  ['issue-01-contract-unit-tests', 1, 'First-Class Response Job Contract', 'Validation Phase 1: Contract Unit Tests', 'batch0'],
  ['issue-01-provider-free-snapshot-tests', 1, 'First-Class Response Job Contract', 'Validation Phase 2: Provider-Free Snapshot Tests', 'batch0'],
  ['issue-01-runtime-integration', 1, 'First-Class Response Job Contract', 'Validation Phase 3: Runtime Integration Tests', 'batch0'],
  ['issue-01-deleted-assistant-recovery-fixture', 1, 'First-Class Response Job Contract', 'Validation Phase 4: Deleted-Assistant Recovery Fixture', 'batch0'],
  ['issue-01-debug-export-review', 1, 'First-Class Response Job Contract', 'Validation Phase 5: Debug Export Review', 'batch0'],
  ['issue-02-retry-job-contract-fixture', 2, 'Retry Button Failure', 'Validation Phase 1: Retry Job Contract Fixture', 'batch1'],
  ['issue-02-provider-lane-snapshot', 2, 'Retry Button Failure', 'Validation Phase 2: Provider Message Lane Snapshot', 'batch1'],
  ['issue-02-retry-contrast-metrics', 2, 'Retry Button Failure', 'Validation Phase 3: Retry Contrast Metrics Fixture', 'batch1'],
  ['issue-02-debug-export-review', 2, 'Retry Button Failure', 'Validation Phase 4: Debug Export Review', 'batch1'],
  ['issue-03-regenerate-state-pruning-fixture', 3, 'Retry Superseded-Generation Contamination', 'Validation Phase 1: Regenerate State Fixture', 'batch1'],
  ['issue-03-persistence-memory-pruning-proof', 3, 'Retry Superseded-Generation Contamination', 'Validation Phase 2: Persistence Memory Proof', 'batch1'],
  ['issue-03-review-export-pruning-proof', 3, 'Retry Superseded-Generation Contamination', 'Validation Phase 3: Review Export Proof', 'batch1'],
  ['issue-03-prompt-leakage-guard', 3, 'Retry Superseded-Generation Contamination', 'Validation Phase 4: Prompt Leakage Guard', 'batch1'],
  ['issue-04-assistant-tail-continue-fixture', 4, 'Continue Rewrite Failure', 'Validation Phase 1: Assistant-Tail Continue Fixture', 'batch1'],
  ['issue-04-user-tail-eligibility-guard', 4, 'Continue Rewrite Failure', 'Validation Phase 2: User-Tail Eligibility Fixture', 'batch1'],
  ['issue-04-deleted-assistant-recovery-fixture', 4, 'Continue Rewrite Failure', 'Validation Phase 3: Deleted-Assistant Recovery Fixture', 'batch1'],
  ['issue-04-output-debug-advancement-proof', 4, 'Continue Rewrite Failure', 'Validation Phase 4: Output And Debug Advancement Proof', 'batch1'],
  ['issue-05-final-user-lane-authority', 5, 'Final User Wrapper Over-Authority', 'Validation Phase 1: API Call Lane Fixtures', 'batch1'],
  ['issue-05-structured-final-user-rendering', 5, 'Final User Wrapper Over-Authority', 'Validation Phase 2: Debug Export Fixture', 'batch1'],
  ['issue-05-old-contract-regression', 5, 'Final User Wrapper Over-Authority', 'Validation Phase 3: Old Contract Regression Checks', 'batch1'],
  ['issue-05-authority-conflict-proof', 5, 'Final User Wrapper Over-Authority', 'Validation Phase 4: Authority Conflict Proof', 'batch1'],
  ['issue-24-fixture-harness-command', 24, 'Roleplay Regression Fixture Harness', 'Validation Phase 1: New Fixture Harness Command', 'batch0'],
  ['issue-24-detail-visibility-physical-state-fixtures', 24, 'Roleplay Regression Fixture Harness', 'Validation Phase 2: Existing Runtime And Debug Tests', 'batch0'],
  ['issue-24-mode-separation-fixtures', 24, 'Roleplay Regression Fixture Harness', 'Validation Phase 2: Existing Runtime And Debug Tests', 'batch0'],
  ['issue-24-source-pressure-state-staleness', 24, 'Roleplay Regression Fixture Harness', 'Validation Phase 2: Existing Runtime And Debug Tests', 'batch0'],
  ['issue-24-debug-export-support-fixtures', 24, 'Roleplay Regression Fixture Harness', 'Validation Phase 3: Support-Call And Saved-Output Checks', 'batch0'],
  ['issue-24-targeted-command-documentation', 24, 'Roleplay Regression Fixture Harness', 'Validation Phase 4: Typecheck And Inspection Snapshots', 'batch0'],
  ['issue-27-normal-send-lane-fixture', 27, 'Established-Fact Note Mixed Into Player Turn', 'Validation Phase 1: Normal Send Lane Fixture', 'batch1'],
  ['issue-27-api-call-rendering-snapshot', 27, 'Established-Fact Note Mixed Into Player Turn', 'Validation Phase 2: API Call Rendering Snapshot', 'batch1'],
  ['issue-27-live-contract-guard', 27, 'Established-Fact Note Mixed Into Player Turn', 'Validation Phase 3: Live Contract Guard', 'batch1'],
  ['issue-27-debug-export-proof', 27, 'Established-Fact Note Mixed Into Player Turn', 'Validation Phase 4: Debug Export Proof', 'batch1'],
  ['issue-22-parent-message-regression-fixture', 22, 'Debug Export Parent Message Boundaries', 'Shared Regression Gate: Parent Message Export Boundaries', 'batch1'],
  ['issue-26-recent-history-regression-fixture', 26, 'Recent Assistant History Self-Anchoring', 'Shared Regression Gate: Recent-History Mode Policies', 'batch1'],
];

const FIXTURE_GATE_DEFINITIONS: ValidationGateDefinition[] = FIXTURE_GATE_SEEDS.map(([
  gateId,
  issueNumber,
  issueTitle,
  validationPhase,
  batch,
]) => ({
  gateId,
  activeScopeId: ROLEPLAY_VALIDATION_SCOPE_ID,
  issueNumber,
  issueTitle,
  validationPhase,
  evidenceKind: 'fixture',
  expectedResult: 'pass',
  lifecycle: 'active',
  manualReviewRequired: false,
  runner: {
    kind: 'fixture',
    batch,
    fixtureId: gateId,
  },
}));

const ISSUE_26_COMMAND = [
  'node_modules/vitest/vitest.mjs',
  'run',
  'src/services/llm-canonical-coverage.test.ts',
  '-t',
  'recent-history treatment receipts',
] as const;

function issue26VitestCommand(testFile: string, testName: string) {
  return [
    'node_modules/vitest/vitest.mjs',
    'run',
    testFile,
    '-t',
    testName,
  ] as const;
}

function issue22VitestCommand(testFile: string, testName: string) {
  return [
    'node_modules/vitest/vitest.mjs',
    'run',
    testFile,
    '-t',
    testName,
  ] as const;
}

function issue22VitestFilesCommand(testFiles: readonly string[]) {
  return [
    'node_modules/vitest/vitest.mjs',
    'run',
    ...testFiles,
  ] as const;
}

const ISSUE_22_TYPECHECK_COMMAND = [
  'node_modules/typescript/bin/tsc',
  '-b',
] as const;

const COMMAND_ENVIRONMENT_ALLOWLIST = ['HOME', 'TMPDIR', 'CI'] as const;

type IssueCommandGateSeed = {
  issueNumber: number;
  issueTitle: string;
  testFiles: readonly string[];
  phases: readonly (readonly [gateSuffix: string, validationPhase: string])[];
};

type IssueManualGateSeed = {
  gateId: string;
  issueNumber: number;
  issueTitle: string;
  validationPhase: string;
};

function issueVitestFilesCommand(testFiles: readonly string[]) {
  return [
    'node_modules/vitest/vitest.mjs',
    'run',
    ...testFiles,
  ] as const;
}

function buildIssueCommandGates(seed: IssueCommandGateSeed): ValidationGateDefinition[] {
  return seed.phases.map(([gateSuffix, validationPhase]) => ({
    gateId: `issue-${String(seed.issueNumber).padStart(2, '0')}-${gateSuffix}`,
    activeScopeId: ROLEPLAY_VALIDATION_SCOPE_ID,
    issueNumber: seed.issueNumber,
    issueTitle: seed.issueTitle,
    validationPhase,
    evidenceKind: 'command',
    expectedResult: 'pass',
    lifecycle: 'active',
    manualReviewRequired: false,
    runner: {
      kind: 'command',
      executable: 'node',
      args: issueVitestFilesCommand(seed.testFiles),
      workingDirectory: 'repo-root',
      timeoutMs: 180_000,
      environmentAllowlist: COMMAND_ENVIRONMENT_ALLOWLIST,
    },
  }));
}

function buildManualGate(seed: IssueManualGateSeed): ValidationGateDefinition {
  return {
    ...seed,
    activeScopeId: ROLEPLAY_VALIDATION_SCOPE_ID,
    evidenceKind: 'manual',
    expectedResult: 'pass',
    lifecycle: 'active',
    manualReviewRequired: true,
    runner: { kind: 'manual' },
  };
}

const ADDITIONAL_COMMAND_GATE_DEFINITIONS = [
  ...buildIssueCommandGates({
    issueNumber: 6,
    issueTitle: 'Current-Turn State Conflict',
    testFiles: [
      'src/features/chat-runtime/roleplay-response-job.test.ts',
      'src/features/chat-runtime/roleplay-batch1-validation.test.ts',
      'src/services/llm-canonical-coverage.test.ts',
      'src/services/roleplay-runtime-responses.behavior.test.ts',
    ],
    phases: [
      ['request-authority-snapshot', 'Validation Phase 1: Request Authority Snapshot'],
      ['no-speculative-resolver-regression', 'Validation Phase 2: No Speculative Resolver Regression'],
    ],
  }),
  ...buildIssueCommandGates({
    issueNumber: 7,
    issueTitle: 'Source Pressure and Salience Stacking',
    testFiles: [
      'src/features/chat-runtime/roleplay-source-receipts.test.ts',
      'src/features/chat-runtime/roleplay-source-shaping.test.ts',
      'src/features/chat-debug/review-export.test.ts',
      'src/features/chat-debug/review-metrics.test.ts',
      'src/services/llm-canonical-coverage.test.ts',
    ],
    phases: [
      ['telemetry-receipt-fixture', 'Validation Phase 1: Telemetry Receipt Fixture'],
      ['duplicate-metrics-export', 'Validation Phase 2: Duplicate Metrics Export'],
      ['prompt-shaping-fixture', 'Validation Phase 3: Prompt Shaping Fixture'],
      ['source-budget-integrity', 'Validation Phase 4: Source Budget Integrity Test'],
    ],
  }),
  ...buildIssueCommandGates({
    issueNumber: 8,
    issueTitle: 'Raw Character-Card Copy Pressure',
    testFiles: [
      'src/features/chat-runtime/roleplay-character-card-facts.test.ts',
      'src/features/chat-runtime/roleplay-knowledge-visibility.test.ts',
      'src/features/chat-runtime/roleplay-goal-selector.test.ts',
      'src/features/chat-debug/review-metrics.test.ts',
      'src/features/chat-debug/review-export.test.ts',
      'src/services/api-usage-validation.test.ts',
    ],
    phases: [
      ['repeated-descriptor-fixture', 'Validation Phase 1: Repeated Descriptor Fixture'],
      ['current-scene-detail-fixture', 'Validation Phase 2: Current-Scene Detail Fixture'],
      ['hidden-knowledge-goal-routing', 'Validation Phase 3: Hidden Knowledge And Goal Routing'],
      ['metrics-api-validation', 'Validation Phase 4: Metrics And API Validation'],
      ['debug-export-review', 'Validation Phase 5: Debug Export Review'],
    ],
  }),
  ...buildIssueCommandGates({
    issueNumber: 9,
    issueTitle: 'Memory Extraction Contamination',
    testFiles: [
      'src/features/chat-runtime/memory-extraction-candidates.test.ts',
      'src/features/chat-runtime/roleplay-memory-candidate-persistence.test.ts',
      'src/features/chat-runtime/roleplay-memory-user-state-review.test.ts',
      'src/features/chat-runtime/roleplay-support-review-runtime-wiring.test.ts',
      'src/features/chat-debug/review-export.test.ts',
    ],
    phases: [
      ['candidate-review-fixture', 'Validation Phase 1: Candidate Review Fixture'],
      ['frontend-persistence-tests', 'Validation Phase 2: Frontend Persistence Tests'],
      ['compatibility-array-tests', 'Validation Phase 3: Compatibility Array Tests'],
      ['prompt-reentry-export-review', 'Validation Phase 4: Prompt Re-Entry And Export Review'],
    ],
  }),
  ...buildIssueCommandGates({
    issueNumber: 10,
    issueTitle: 'Day Memory Compression Unsafe Deletion',
    testFiles: [
      'src/features/chat-runtime/roleplay-day-compression.test.ts',
      'src/features/chat-runtime/roleplay-support-review-runtime-wiring.test.ts',
      'src/features/chat-runtime/use-post-turn-support-queue.test.ts',
      'src/features/chat-debug/review-export.test.ts',
    ],
    phases: [
      ['subset-delete-fixture', 'Validation Phase 1: Subset Delete Fixture'],
      ['malformed-response-guards', 'Validation Phase 2: Malformed Response Guards'],
      ['persistence-order-coverage', 'Validation Phase 3: Persistence Order Coverage'],
      ['day-rollover-trigger-fixture', 'Validation Phase 4: Day Rollover Trigger Fixture'],
      ['debug-export-review', 'Validation Phase 5: Debug Export Review'],
    ],
  }),
  ...buildIssueCommandGates({
    issueNumber: 11,
    issueTitle: 'Support-Call One-Turn Lag',
    testFiles: [
      'src/features/chat-runtime/roleplay-support-readiness.test.ts',
      'src/features/chat-runtime/roleplay-support-review-runtime-wiring.test.ts',
      'src/features/chat-runtime/use-post-turn-support-queue.test.ts',
      'src/features/chat-debug/review-export.test.ts',
    ],
    phases: [
      ['pending-worker-race-fixture', 'Validation Phase 1: Pending Worker Race Fixture'],
      ['persistence-readiness-tests', 'Validation Phase 2: Persistence Readiness Tests'],
      ['debug-export-order-review', 'Validation Phase 3: Debug Export Order Review'],
      ['stale-generation-fixture', 'Validation Phase 4: Stale Generation Fixture'],
    ],
  }),
  ...buildIssueCommandGates({
    issueNumber: 12,
    issueTitle: 'API Call 2 Support-Call Review Envelope, Re-Entry, and Readiness',
    testFiles: [
      'src/features/chat-runtime/roleplay-support-review-envelope.test.ts',
      'src/features/chat-runtime/roleplay-support-review-adapters.test.ts',
      'src/features/chat-runtime/roleplay-support-review-projections.test.ts',
      'src/features/chat-runtime/roleplay-support-review-runtime-wiring.test.ts',
      'src/features/chat-runtime/roleplay-support-readiness.test.ts',
      'src/features/chat-debug/review-export.test.ts',
      'src/services/admin-debug-trace-authorization.test.ts',
    ],
    phases: [
      ['worker-envelope-fixtures', 'Validation Phase 1: Worker Envelope Fixtures'],
      ['worker-vocabulary-alias-rejection', 'Validation Phase 2: Worker Vocabulary And Alias Rejection'],
      ['readiness-reentry-tests', 'Validation Phase 3: Readiness And Re-Entry Tests'],
      ['debug-export-review', 'Validation Phase 4: Debug Export Review'],
      ['privacy-admin-capture-tests', 'Validation Phase 5: Privacy And Admin Capture Tests'],
    ],
  }),
  ...buildIssueCommandGates({
    issueNumber: 13,
    issueTitle: 'Character-State Review Coverage Before Raw Update Application',
    testFiles: [
      'src/features/chat-runtime/roleplay-character-state-review.test.ts',
      'src/features/chat-runtime/roleplay-character-state-runtime-wiring.test.ts',
      'src/features/chat-runtime/roleplay-support-review-runtime-wiring.test.ts',
      'src/features/chat-debug/review-export.test.ts',
    ],
    phases: [
      ['rejected-raw-update-fixture', 'Validation Phase 1: Rejected Raw Update Fixture'],
      ['apply-receipt-fixtures', 'Validation Phase 2: Apply Receipt Fixtures'],
      ['multi-character-review-coverage', 'Validation Phase 3: Multi-Character Review Coverage'],
      ['retry-export-reentry-guard', 'Validation Phase 4: Retry Export And Re-Entry Guard'],
    ],
  }),
  ...buildIssueCommandGates({
    issueNumber: 14,
    issueTitle: 'Visibility / Character Knowledge Failure',
    testFiles: [
      'src/features/chat-runtime/roleplay-scene-roster.test.ts',
      'src/features/chat-runtime/roleplay-knowledge-visibility.test.ts',
      'src/features/chat-runtime/player-turn-visibility.test.ts',
      'src/features/chat-runtime/roleplay-player-visibility-runtime-wiring.test.ts',
      'src/features/chat-runtime/roleplay-candidate-behavior.test.ts',
      'src/features/chat-runtime/roleplay-recent-history.test.ts',
      'src/features/chat-runtime/use-post-turn-support-queue.test.ts',
      'src/features/chat-runtime/roleplay-source-receipts.test.ts',
      'src/features/chat-debug/review-export.test.ts',
      'src/services/api-usage-validation.test.ts',
      'src/services/llm-canonical-coverage.test.ts',
    ],
    phases: [
      ['scene-roster-coverage', 'Validation Phase 1: Scene Roster Coverage'],
      ['visibility-boundary-fixtures', 'Validation Phase 2: Visibility Boundary Fixtures'],
      ['debug-export-review', 'Validation Phase 3: Debug Export Review'],
    ],
  }),
  ...buildIssueCommandGates({
    issueNumber: 15,
    issueTitle: 'Physical State Contradiction And Scene-Position Drift',
    testFiles: [
      'src/features/chat-runtime/roleplay-scene-roster.test.ts',
      'src/features/chat-runtime/effective-state.test.ts',
      'src/features/chat-runtime/roleplay-side-character-registration.test.ts',
      'src/features/chat-runtime/roleplay-side-character-registration-runtime-wiring.test.ts',
      'src/features/chat-runtime/roleplay-character-state-review.test.ts',
      'src/features/chat-runtime/roleplay-character-state-runtime-wiring.test.ts',
      'src/features/chat-debug/review-export.test.ts',
    ],
    phases: [
      ['authority-single-roster-fixtures', 'Validation Phase 1: Authority And Single-Roster Fixtures'],
      ['pagination-generation-safety', 'Validation Phase 2: Pagination And Generation Safety'],
      ['dynamic-side-character-registration', 'Validation Phase 3: Dynamic Side-Character Registration'],
      ['accepted-rejected-persistence', 'Validation Phase 4: Accepted And Rejected Persistence'],
      ['continuity-export-review', 'Validation Phase 5: Continuity Export Review'],
    ],
  }),
  ...buildIssueCommandGates({
    issueNumber: 16,
    issueTitle: 'Mood Over-Authority',
    testFiles: [
      'src/features/chat-runtime/structured-mood-removal.test.ts',
      'src/lib/story-transfer.test.ts',
      'src/lib/canonical-field-registry.test.ts',
      'src/data/supabase-schema-reference.test.ts',
      'src/services/llm-canonical-coverage.test.ts',
      'src/services/extract-character-updates-completeness.test.ts',
      'src/services/extract-character-updates-prompt.test.ts',
    ],
    phases: [
      ['ui-story-transfer-absence', 'Validation Phase 1: UI And Story-Transfer Absence'],
      ['api-call-1-mood-absence', 'Validation Phase 2: API Call 1 Mood Absence'],
      ['api-call-2-app-persistence-absence', 'Validation Phase 3: API Call 2 And App Persistence Absence'],
      ['debug-schema-absence', 'Validation Phase 4: Debug And Schema Absence'],
      ['terminal-database-verification', 'Validation Phase 5: Terminal Database Verification'],
    ],
  }),
  ...buildIssueCommandGates({
    issueNumber: 17,
    issueTitle: 'Goal Exposure Pressure',
    testFiles: [
      'src/features/chat-runtime/roleplay-goal-selector.test.ts',
      'src/features/chat-runtime/roleplay-response-job.test.ts',
      'src/features/chat-debug/review-export.test.ts',
    ],
    phases: [
      ['selector-tier-fixtures', 'Validation Phase 1: Selector Tier Fixtures'],
      ['shared-mode-snapshots', 'Validation Phase 2: Shared Mode Snapshots'],
      ['partial-progress-safety', 'Validation Phase 3: Partial Progress Safety Fixture'],
      ['debug-export-review', 'Validation Phase 4: Debug Export Review'],
    ],
  }),
  ...buildIssueCommandGates({
    issueNumber: 18,
    issueTitle: 'Continue Goal Context Divergence',
    testFiles: [
      'src/features/chat-runtime/roleplay-goal-selector.test.ts',
      'src/features/chat-runtime/roleplay-response-job.test.ts',
      'src/services/roleplay-runtime-responses.behavior.test.ts',
      'src/features/chat-debug/review-export.test.ts',
    ],
    phases: [
      ['shared-mode-snapshot-tests', 'Validation Phase 1: Shared Mode Snapshot Tests'],
      ['continue-packet-fixture', 'Validation Phase 2: Continue Packet Fixture'],
      ['multi-goal-decision-fixture', 'Validation Phase 3: Multi-Goal Decision Fixture'],
      ['debug-export-receipt-review', 'Validation Phase 4: Debug Export Receipt Review'],
    ],
  }),
  ...buildIssueCommandGates({
    issueNumber: 19,
    issueTitle: 'Response Detail And Dialogue Development Not Verified',
    testFiles: [
      'src/features/chat-runtime/roleplay-response-detail.test.ts',
      'src/services/llm-canonical-coverage.test.ts',
      'src/features/chat-debug/review-metrics.test.ts',
      'src/features/chat-debug/review-export.test.ts',
    ],
    phases: [
      ['response-detail-request-snapshots', 'Validation Phase 1: Response Detail Request Snapshots'],
      ['parent-message-metrics-fixtures', 'Validation Phase 2: Parent Message Metrics Fixtures'],
      ['warning-escape-reason-fixtures', 'Validation Phase 3: Warning And Escape Reason Fixtures'],
      ['normal-retry-continue-export-coverage', 'Validation Phase 4: Normal Retry Continue Export Coverage'],
      ['no-hidden-repair-guard', 'Validation Phase 5: No Hidden Repair Guard'],
    ],
  }),
  ...buildIssueCommandGates({
    issueNumber: 20,
    issueTitle: 'Internal Thought Coherence Diagnostics',
    testFiles: [
      'src/features/chat-debug/review-metrics.test.ts',
      'src/features/chat-debug/review-export.test.ts',
      'src/services/llm-canonical-coverage.test.ts',
      'src/services/admin-debug-trace-authorization.test.ts',
    ],
    phases: [
      ['thought-unit-metrics-fixtures', 'Validation Phase 1: Thought Unit Metrics Fixtures'],
      ['debug-export-parent-fixture', 'Validation Phase 2: Debug Export Parent Fixture'],
      ['runtime-noninterference-regression', 'Validation Phase 3: Runtime Noninterference Regression'],
      ['visible-retry-admin-guard', 'Validation Phase 4: Visible Retry And Admin Guard'],
    ],
  }),
  ...buildIssueCommandGates({
    issueNumber: 21,
    issueTitle: 'Unsupported User-Character State Inference',
    testFiles: [
      'src/features/chat-runtime/roleplay-user-state-authority.test.ts',
      'src/features/chat-runtime/roleplay-memory-user-state-review.test.ts',
      'src/features/chat-runtime/roleplay-character-state-review.test.ts',
      'src/features/chat-runtime/roleplay-character-state-runtime-wiring.test.ts',
      'src/features/chat-debug/review-export.test.ts',
    ],
    phases: [
      ['assistant-only-overreach-fixtures', 'Validation Phase 1: Assistant-Only Overreach Fixtures'],
      ['user-authored-state-fixtures', 'Validation Phase 2: User-Authored State Fixtures'],
      ['visible-cue-observation-fixtures', 'Validation Phase 3: Visible-Cue Observation Fixtures'],
      ['prompt-packet-persistence-regression', 'Validation Phase 4: Prompt Packet And Persistence Regression'],
      ['debug-export-review', 'Validation Phase 5: Debug Export Review'],
    ],
  }),
  ...buildIssueCommandGates({
    issueNumber: 23,
    issueTitle: 'Retry Attempt History Visibility',
    testFiles: [
      'src/features/chat-debug/retry-history.test.ts',
      'src/features/chat-debug/review-export.test.ts',
      'src/features/chat-debug/review-metrics.test.ts',
      'src/features/chat-runtime/dialog-debug-comments.test.ts',
    ],
    phases: [
      ['retry-history-unit-tests', 'Validation Phase 1: Retry History Unit Tests'],
      ['parent-export-retry-fixtures', 'Validation Phase 2: Parent Export Retry Fixtures'],
      ['debug-evidence-regression-tests', 'Validation Phase 3: Debug Evidence Regression Tests'],
    ],
  }),
  ...buildIssueCommandGates({
    issueNumber: 25,
    issueTitle: 'Provider Transport Is Not Source Discipline',
    testFiles: [
      'src/services/xai-responses-adapter.test.ts',
      'src/services/chat-edge-request-hardening.test.ts',
      'src/features/chat-runtime/roleplay-source-receipts.test.ts',
      'src/features/chat-runtime/roleplay-source-shaping.test.ts',
      'src/features/chat-debug/review-export.test.ts',
    ],
    phases: [
      ['export-boundary-review', 'Validation Phase 1: Export Boundary Review'],
      ['provider-recovery-retry-separation', 'Validation Phase 2: Provider Recovery And Retry Separation Tests'],
      ['active-owner-fold-proof', 'Validation Phase 3: Active Owner Fold Proof'],
    ],
  }),
  ...buildIssueCommandGates({
    issueNumber: 26,
    issueTitle: 'Recent Assistant History Self-Anchoring',
    testFiles: [
      'src/features/chat-runtime/roleplay-recent-history.test.ts',
      'src/services/llm-canonical-coverage.test.ts',
      'src/features/chat-debug/review-metrics.test.ts',
      'src/features/chat-debug/review-export.test.ts',
    ],
    phases: [
      ['outcome-summary-transformation', 'Validation Phase 6: Outcome Summary Transformation Fixture'],
    ],
  }),
  ...buildIssueCommandGates({
    issueNumber: 28,
    issueTitle: 'Source Shaping Remains Prototype-Only',
    testFiles: [
      'src/features/chat-runtime/roleplay-source-receipts.test.ts',
      'src/features/chat-runtime/effective-state.test.ts',
      'src/features/chat-runtime/roleplay-source-shaping.test.ts',
      'src/features/chat-runtime/roleplay-response-job.test.ts',
      'src/features/chat-debug/review-export.test.ts',
      'src/services/llm-canonical-coverage.test.ts',
    ],
    phases: [
      ['receipt-coverage-fixture', 'Validation Phase 1: Receipt Coverage Fixture'],
      ['effective-state-authority-fixture', 'Validation Phase 2: Effective State Authority Fixture'],
      ['source-budget-summary', 'Validation Phase 3: Source Budget Summary'],
      ['debug-export-review', 'Validation Phase 4: Debug Export Review'],
      ['active-scene-comparison', 'Validation Phase 5: Active-Scene Comparison'],
      ['mode-refresh-coverage', 'Validation Phase 6: Mode And Refresh Coverage'],
    ],
  }),
];

const ADDITIONAL_MANUAL_GATE_DEFINITIONS = [
  buildManualGate({
    gateId: 'issue-06-conflict-heavy-manual-playthrough',
    issueNumber: 6,
    issueTitle: 'Current-Turn State Conflict',
    validationPhase: 'Validation Phase 3: Conflict-Heavy Manual Playthrough',
  }),
  buildManualGate({
    gateId: 'issue-16-ui-absence-manual-review',
    issueNumber: 16,
    issueTitle: 'Mood Over-Authority',
    validationPhase: 'Validation Phase 1: UI And Story-Transfer Absence',
  }),
  buildManualGate({
    gateId: 'issue-16-terminal-database-manual-review',
    issueNumber: 16,
    issueTitle: 'Mood Over-Authority',
    validationPhase: 'Validation Phase 5: Terminal Database Verification',
  }),
  buildManualGate({
    gateId: 'issue-23-admin-export-manual-review',
    issueNumber: 23,
    issueTitle: 'Retry Attempt History Visibility',
    validationPhase: 'Validation Phase 4: Manual Admin Export Review',
  }),
  buildManualGate({
    gateId: 'issue-25-export-boundary-manual-review',
    issueNumber: 25,
    issueTitle: 'Provider Transport Is Not Source Discipline',
    validationPhase: 'Validation Phase 1: Export Boundary Review',
  }),
  buildManualGate({
    gateId: 'issue-28-active-scene-manual-review',
    issueNumber: 28,
    issueTitle: 'Source Shaping Remains Prototype-Only',
    validationPhase: 'Validation Phase 5: Active-Scene Comparison',
  }),
];

export const ROLEPLAY_VALIDATION_GATES: readonly ValidationGateDefinition[] = [
  ...FIXTURE_GATE_DEFINITIONS,
  ...ADDITIONAL_COMMAND_GATE_DEFINITIONS,
  ...ADDITIONAL_MANUAL_GATE_DEFINITIONS,
  {
    gateId: 'issue-24-admin-export-manual-review',
    activeScopeId: ROLEPLAY_VALIDATION_SCOPE_ID,
    issueNumber: 24,
    issueTitle: 'Roleplay Regression Fixture Harness',
    validationPhase: 'Validation Phase 5: Manual/Admin Export After Fixtures',
    evidenceKind: 'manual',
    expectedResult: 'pass',
    lifecycle: 'active',
    manualReviewRequired: true,
    runner: { kind: 'manual' },
  },
  {
    gateId: 'issue-22-parent-card-expected-red',
    activeScopeId: ROLEPLAY_VALIDATION_SCOPE_ID,
    issueNumber: 22,
    issueTitle: 'Debug Export Parent Message Boundaries',
    validationPhase: 'Expected-Red Checkpoint: Parent Message Export Boundary',
    evidenceKind: 'command',
    expectedResult: 'fail',
    lifecycle: 'active',
    manualReviewRequired: false,
    runner: {
      kind: 'command',
      executable: 'node',
      args: issue22VitestCommand(
        'src/features/chat-debug/review-export.test.ts',
        'renders one saved message parent with nested child speaker cards and parent-owned evidence',
      ),
      workingDirectory: 'repo-root',
      timeoutMs: 120_000,
      environmentAllowlist: COMMAND_ENVIRONMENT_ALLOWLIST,
    },
  },
  {
    gateId: 'issue-22-parent-card-export-fixtures',
    activeScopeId: ROLEPLAY_VALIDATION_SCOPE_ID,
    issueNumber: 22,
    issueTitle: 'Debug Export Parent Message Boundaries',
    validationPhase: 'Validation Phase 1: Parent-Card Export Fixtures',
    evidenceKind: 'command',
    expectedResult: 'pass',
    lifecycle: 'active',
    manualReviewRequired: false,
    runner: {
      kind: 'command',
      executable: 'node',
      args: issue22VitestCommand(
        'src/features/chat-debug/review-export.test.ts',
        'renders one saved message parent with nested child speaker cards and parent-owned evidence',
      ),
      workingDirectory: 'repo-root',
      timeoutMs: 120_000,
      environmentAllowlist: COMMAND_ENVIRONMENT_ALLOWLIST,
    },
  },
  {
    gateId: 'issue-22-note-retry-attachment-fixtures',
    activeScopeId: ROLEPLAY_VALIDATION_SCOPE_ID,
    issueNumber: 22,
    issueTitle: 'Debug Export Parent Message Boundaries',
    validationPhase: 'Validation Phase 2: Note and Retry Attachment Fixtures',
    evidenceKind: 'command',
    expectedResult: 'pass',
    lifecycle: 'active',
    manualReviewRequired: false,
    runner: {
      kind: 'command',
      executable: 'node',
      args: issue22VitestCommand(
        'src/features/chat-debug/review-export.test.ts',
        'exports a styled static session log with speaker cards and one inline live comment per message',
      ),
      workingDirectory: 'repo-root',
      timeoutMs: 120_000,
      environmentAllowlist: COMMAND_ENVIRONMENT_ALLOWLIST,
    },
  },
  {
    gateId: 'issue-22-parser-diagnostics-fixtures',
    activeScopeId: ROLEPLAY_VALIDATION_SCOPE_ID,
    issueNumber: 22,
    issueTitle: 'Debug Export Parent Message Boundaries',
    validationPhase: 'Validation Phase 3: Parser Diagnostics Fixtures',
    evidenceKind: 'command',
    expectedResult: 'pass',
    lifecycle: 'active',
    manualReviewRequired: false,
    runner: {
      kind: 'command',
      executable: 'node',
      args: issue22VitestCommand(
        'src/features/chat-debug/review-export.test.ts',
        'keeps adjacent same-speaker paragraphs in one review card',
      ),
      workingDirectory: 'repo-root',
      timeoutMs: 120_000,
      environmentAllowlist: COMMAND_ENVIRONMENT_ALLOWLIST,
    },
  },
  {
    gateId: 'issue-22-metrics-linkage-regressions',
    activeScopeId: ROLEPLAY_VALIDATION_SCOPE_ID,
    issueNumber: 22,
    issueTitle: 'Debug Export Parent Message Boundaries',
    validationPhase: 'Validation Phase 4: Metrics and Linkage Regressions',
    evidenceKind: 'command',
    expectedResult: 'pass',
    lifecycle: 'active',
    manualReviewRequired: false,
    runner: {
      kind: 'command',
      executable: 'node',
      args: issue22VitestFilesCommand([
        'src/features/chat-debug/review-export.test.ts',
        'src/features/chat-debug/review-metrics.test.ts',
        'src/features/chat-runtime/dialog-debug-comments.test.ts',
      ]),
      workingDirectory: 'repo-root',
      timeoutMs: 120_000,
      environmentAllowlist: COMMAND_ENVIRONMENT_ALLOWLIST,
    },
  },
  {
    gateId: 'issue-22-typecheck-export-contract',
    activeScopeId: ROLEPLAY_VALIDATION_SCOPE_ID,
    issueNumber: 22,
    issueTitle: 'Debug Export Parent Message Boundaries',
    validationPhase: 'Validation Phase 5: Typecheck and Rendered Export Review',
    evidenceKind: 'command',
    expectedResult: 'pass',
    lifecycle: 'active',
    manualReviewRequired: false,
    runner: {
      kind: 'command',
      executable: 'node',
      args: ISSUE_22_TYPECHECK_COMMAND,
      workingDirectory: 'repo-root',
      timeoutMs: 120_000,
      environmentAllowlist: COMMAND_ENVIRONMENT_ALLOWLIST,
    },
  },
  {
    gateId: 'issue-22-rendered-export-manual-review',
    activeScopeId: ROLEPLAY_VALIDATION_SCOPE_ID,
    issueNumber: 22,
    issueTitle: 'Debug Export Parent Message Boundaries',
    validationPhase: 'Validation Phase 5: Typecheck and Rendered Export Review',
    evidenceKind: 'manual',
    expectedResult: 'pass',
    lifecycle: 'active',
    manualReviewRequired: true,
    runner: { kind: 'manual' },
  },
  {
    gateId: 'issue-26-recent-history-expected-red',
    activeScopeId: ROLEPLAY_VALIDATION_SCOPE_ID,
    issueNumber: 26,
    issueTitle: 'Recent Assistant History Self-Anchoring',
    validationPhase: 'Expected-Red Checkpoint: Recent-History Treatment Receipts',
    evidenceKind: 'command',
    expectedResult: 'fail',
    lifecycle: 'active',
    manualReviewRequired: false,
    runner: {
      kind: 'command',
      executable: 'node',
      args: ISSUE_26_COMMAND,
      workingDirectory: 'repo-root',
      timeoutMs: 120_000,
      environmentAllowlist: COMMAND_ENVIRONMENT_ALLOWLIST,
    },
  },
  {
    gateId: 'issue-26-recent-history-expected-green',
    activeScopeId: ROLEPLAY_VALIDATION_SCOPE_ID,
    issueNumber: 26,
    issueTitle: 'Recent Assistant History Self-Anchoring',
    validationPhase: 'Expected-Green Checkpoint: Recent-History Treatment Receipts',
    evidenceKind: 'command',
    expectedResult: 'pass',
    lifecycle: 'active',
    manualReviewRequired: false,
    runner: {
      kind: 'command',
      executable: 'node',
      args: ISSUE_26_COMMAND,
      workingDirectory: 'repo-root',
      timeoutMs: 120_000,
      environmentAllowlist: COMMAND_ENVIRONMENT_ALLOWLIST,
    },
  },
  {
    gateId: 'issue-26-history-compilation-unit-tests',
    activeScopeId: ROLEPLAY_VALIDATION_SCOPE_ID,
    issueNumber: 26,
    issueTitle: 'Recent Assistant History Self-Anchoring',
    validationPhase: 'Validation Phase 1: History Compilation Unit Tests',
    evidenceKind: 'command',
    expectedResult: 'pass',
    lifecycle: 'active',
    manualReviewRequired: false,
    runner: {
      kind: 'command',
      executable: 'node',
      args: issue26VitestCommand(
        'src/features/chat-runtime/roleplay-recent-history.test.ts',
        'keeps exact user turns and latest assistant continuity',
      ),
      workingDirectory: 'repo-root',
      timeoutMs: 120_000,
      environmentAllowlist: COMMAND_ENVIRONMENT_ALLOWLIST,
    },
  },
  {
    gateId: 'issue-26-retry-rejected-text-exclusion',
    activeScopeId: ROLEPLAY_VALIDATION_SCOPE_ID,
    issueNumber: 26,
    issueTitle: 'Recent Assistant History Self-Anchoring',
    validationPhase: 'Validation Phase 2: Retry Rejected-Text Exclusion Fixture',
    evidenceKind: 'command',
    expectedResult: 'pass',
    lifecycle: 'active',
    manualReviewRequired: false,
    runner: {
      kind: 'command',
      executable: 'node',
      args: issue26VitestCommand(
        'src/features/chat-runtime/roleplay-recent-history.test.ts',
        'keeps a rejected Retry attempt outside ordinary provider history',
      ),
      workingDirectory: 'repo-root',
      timeoutMs: 120_000,
      environmentAllowlist: COMMAND_ENVIRONMENT_ALLOWLIST,
    },
  },
  {
    gateId: 'issue-26-continue-tail-anchor',
    activeScopeId: ROLEPLAY_VALIDATION_SCOPE_ID,
    issueNumber: 26,
    issueTitle: 'Recent Assistant History Self-Anchoring',
    validationPhase: 'Validation Phase 3: Continue Tail Anchor Fixture',
    evidenceKind: 'command',
    expectedResult: 'pass',
    lifecycle: 'active',
    manualReviewRequired: false,
    runner: {
      kind: 'command',
      executable: 'node',
      args: issue26VitestCommand(
        'src/features/chat-runtime/roleplay-recent-history.test.ts',
        'keeps a Continue tail in continue_anchor',
      ),
      workingDirectory: 'repo-root',
      timeoutMs: 120_000,
      environmentAllowlist: COMMAND_ENVIRONMENT_ALLOWLIST,
    },
  },
  {
    gateId: 'issue-26-debug-export-receipt-visibility',
    activeScopeId: ROLEPLAY_VALIDATION_SCOPE_ID,
    issueNumber: 26,
    issueTitle: 'Recent Assistant History Self-Anchoring',
    validationPhase: 'Validation Phase 4: Debug Export Receipt Visibility',
    evidenceKind: 'command',
    expectedResult: 'pass',
    lifecycle: 'active',
    manualReviewRequired: false,
    runner: {
      kind: 'command',
      executable: 'node',
      args: issue26VitestCommand(
        'src/features/chat-debug/review-export.test.ts',
        'renders response-job and recent-history treatment metadata',
      ),
      workingDirectory: 'repo-root',
      timeoutMs: 120_000,
      environmentAllowlist: COMMAND_ENVIRONMENT_ALLOWLIST,
    },
  },
  {
    gateId: 'issue-26-source-overlap-similarity-guardrails',
    activeScopeId: ROLEPLAY_VALIDATION_SCOPE_ID,
    issueNumber: 26,
    issueTitle: 'Recent Assistant History Self-Anchoring',
    validationPhase: 'Validation Phase 5: Source-Overlap And Similarity Guardrails',
    evidenceKind: 'command',
    expectedResult: 'pass',
    lifecycle: 'active',
    manualReviewRequired: false,
    runner: {
      kind: 'command',
      executable: 'node',
      args: issue26VitestCommand(
        'src/features/chat-debug/review-metrics.test.ts',
        'counts roleplay modalities, repetition, internal thoughts, source overlap, and recent-history treatment evidence locally',
      ),
      workingDirectory: 'repo-root',
      timeoutMs: 120_000,
      environmentAllowlist: COMMAND_ENVIRONMENT_ALLOWLIST,
    },
  },
];

const GATE_BY_ID = new Map(ROLEPLAY_VALIDATION_GATES.map((gate) => [gate.gateId, gate]));

export function getRoleplayValidationGate(gateId: string) {
  return GATE_BY_ID.get(gateId) ?? null;
}

export function listActiveRoleplayValidationGates() {
  return ROLEPLAY_VALIDATION_GATES.filter((gate) => gate.lifecycle === 'active');
}

export type RoleplayValidationRunnerReuseGroup = Readonly<{
  runnerIdentity: string;
  gateIds: readonly string[];
  issueNumbers: readonly number[];
}>;

function validationRunnerIdentity(gate: ValidationGateDefinition): string {
  if (gate.runner.kind === 'fixture') return `fixture:${gate.runner.batch}`;
  if (gate.runner.kind === 'manual') return 'manual';
  return JSON.stringify({
    executable: gate.runner.executable,
    args: gate.runner.args,
    workingDirectory: gate.runner.workingDirectory,
  });
}

export function auditRoleplayValidationRunnerReuse(): RoleplayValidationRunnerReuseGroup[] {
  const groups = new Map<string, ValidationGateDefinition[]>();
  for (const gate of listActiveRoleplayValidationGates()) {
    const identity = validationRunnerIdentity(gate);
    const existing = groups.get(identity) ?? [];
    existing.push(gate);
    groups.set(identity, existing);
  }

  return [...groups.entries()]
    .filter(([, gates]) => gates.length > 1)
    .map(([runnerIdentity, gates]) => ({
      runnerIdentity,
      gateIds: gates.map((gate) => gate.gateId).sort(),
      issueNumbers: [...new Set(gates.map((gate) => gate.issueNumber))].sort((a, b) => a - b),
    }))
    .sort((left, right) => left.runnerIdentity.localeCompare(right.runnerIdentity));
}
