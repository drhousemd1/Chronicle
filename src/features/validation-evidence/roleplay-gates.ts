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
  ['issue-03-regenerate-state-pruning-fixture', 3, 'Retry Superseded-Generation Contamination', 'Validation Phase 1: Regenerate State Pruning Fixture', 'batch1'],
  ['issue-03-persistence-memory-pruning-proof', 3, 'Retry Superseded-Generation Contamination', 'Validation Phase 2: Persistence Memory Pruning Proof', 'batch1'],
  ['issue-03-review-export-pruning-proof', 3, 'Retry Superseded-Generation Contamination', 'Validation Phase 3: Debug Export Pruning Report', 'batch1'],
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

export const ROLEPLAY_VALIDATION_GATES: readonly ValidationGateDefinition[] = [
  ...FIXTURE_GATE_DEFINITIONS,
  {
    gateId: 'issue-24-admin-export-manual-review',
    activeScopeId: ROLEPLAY_VALIDATION_SCOPE_ID,
    issueNumber: 24,
    issueTitle: 'Roleplay Regression Fixture Harness',
    validationPhase: 'Manual/Admin Export After Fixtures',
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
