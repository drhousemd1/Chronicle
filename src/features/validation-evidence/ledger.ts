import type { ValidationGateDefinition } from './roleplay-gates';

export const ROLEPLAY_PIPELINE_LEDGER_DEV_PATH = '/__validation-evidence/roleplay-pipeline-ledger.json';
export const ROLEPLAY_PIPELINE_REPORT_DEV_PATH = '/__validation-evidence/report';

export type AutomatedExecutionResult = 'pass' | 'fail' | 'error';
export type ManualReviewOutcome = 'approved' | 'rejected';
export type ValidationFreshness = 'current' | 'stale' | 'unknown';
export type DerivedValidationState =
  | 'passing'
  | 'failing'
  | 'error'
  | 'not_run'
  | 'expected_red_demonstrated'
  | 'unexpected_pass'
  | 'manual_pending'
  | 'manual_approved'
  | 'manual_rejected'
  | 'blocked'
  | 'superseded';

export type AutomatedExecutionRecord = {
  schemaVersion: 1;
  executionId: string;
  gateId: string;
  result: AutomatedExecutionResult;
  processExitCode: number | null;
  failureCause: string;
  exactCommand: string | null;
  fixtureId: string | null;
  executedAt: string | null;
  sourceRevision: string | null;
  sourceState: 'clean' | 'dirty' | 'unknown';
  durationMs: number | null;
  rawReportPath: string | null;
  legacy: boolean;
};

export type ManualReviewRecord = {
  schemaVersion: 1;
  reviewId: string;
  gateId: string;
  outcome: ManualReviewOutcome;
  reviewer: string;
  reviewedAt: string;
  notes: string;
  evidenceReferences: string[];
};

export type OrphanedLegacyEvidence = {
  legacyId: string;
  reason: string;
  sourceRecord: unknown;
};

export type LegacyReconciliationSummary = {
  reconciledAt: string;
  sourceLedgerPath: string;
  totalRows: number;
  matched: number;
  orphaned: number;
  malformed: number;
  duplicateIds: string[];
  missingReports: string[];
  orphanReports: string[];
  orphanedRows: OrphanedLegacyEvidence[];
};

export type ValidationExecutionSummary = AutomatedExecutionRecord;

export type DerivedValidationGate = {
  definition: ValidationGateDefinition;
  state: DerivedValidationState;
  stateLabel: string;
  freshness: ValidationFreshness;
  latestExecution: AutomatedExecutionRecord | null;
  executionHistory: ValidationExecutionSummary[];
  latestManualReview: ManualReviewRecord | null;
  manualReviewHistory: ManualReviewRecord[];
};

export type ValidationLedgerSummary = {
  activeGates: number;
  passing: number;
  failing: number;
  errors: number;
  notRun: number;
  expectedRedDemonstrated: number;
  manualPending: number;
  manualApproved: number;
  manualRejected: number;
  freshnessCurrent: number;
  freshnessStale: number;
  freshnessUnknown: number;
  orphanedLegacyEvidence: number;
};

export type ValidationEvidenceLedgerSnapshot = {
  schemaVersion: 1;
  generatedAt: string;
  activeScopeId: string;
  sourceRevision: string | null;
  sourceState: 'clean' | 'dirty' | 'unknown';
  summary: ValidationLedgerSummary;
  gates: DerivedValidationGate[];
  reconciliation: LegacyReconciliationSummary | null;
};

export type DeriveGateOptions = {
  currentSourceRevision: string | null;
  currentSourceState: 'clean' | 'dirty' | 'unknown';
};

function executionSortValue(execution: AutomatedExecutionRecord) {
  return execution.executedAt ?? '';
}

function reviewSortValue(review: ManualReviewRecord) {
  return review.reviewedAt;
}

export function deriveExecutionFreshness(
  execution: AutomatedExecutionRecord | null,
  options: DeriveGateOptions,
): ValidationFreshness {
  if (!execution?.sourceRevision || options.currentSourceState !== 'clean' || !options.currentSourceRevision) {
    return 'unknown';
  }

  return execution.sourceRevision === options.currentSourceRevision ? 'current' : 'stale';
}

export function deriveValidationGate(
  definition: ValidationGateDefinition,
  executions: AutomatedExecutionRecord[],
  manualReviews: ManualReviewRecord[],
  options: DeriveGateOptions,
): DerivedValidationGate {
  const executionHistory = executions
    .filter((execution) => execution.gateId === definition.gateId)
    .sort((a, b) => executionSortValue(a).localeCompare(executionSortValue(b)) || a.executionId.localeCompare(b.executionId));
  const manualReviewHistory = manualReviews
    .filter((review) => review.gateId === definition.gateId)
    .sort((a, b) => reviewSortValue(a).localeCompare(reviewSortValue(b)) || a.reviewId.localeCompare(b.reviewId));
  const latestExecution = executionHistory.at(-1) ?? null;
  const latestManualReview = manualReviewHistory.at(-1) ?? null;
  const freshness = deriveExecutionFreshness(latestExecution, options);

  let state: DerivedValidationState;
  let stateLabel: string;

  if (definition.lifecycle === 'blocked') {
    state = 'blocked';
    stateLabel = 'Blocked';
  } else if (definition.lifecycle === 'superseded') {
    state = 'superseded';
    stateLabel = 'Superseded';
  } else if (definition.evidenceKind === 'manual') {
    if (!latestManualReview) {
      state = 'manual_pending';
      stateLabel = 'Manual review pending';
    } else if (latestManualReview.outcome === 'approved') {
      state = 'manual_approved';
      stateLabel = 'Manual review approved';
    } else {
      state = 'manual_rejected';
      stateLabel = 'Manual review rejected';
    }
  } else if (!latestExecution) {
    state = 'not_run';
    stateLabel = 'Not Run';
  } else if (latestExecution.result === 'error') {
    state = 'error';
    stateLabel = 'Execution error';
  } else if (definition.expectedResult === 'fail') {
    if (latestExecution.result === 'fail') {
      state = 'expected_red_demonstrated';
      stateLabel = 'Expected red demonstrated';
    } else {
      state = 'unexpected_pass';
      stateLabel = 'Unexpected pass';
    }
  } else if (latestExecution.result === 'pass') {
    state = 'passing';
    stateLabel = 'Passing';
  } else {
    state = 'failing';
    stateLabel = 'Failing';
  }

  return {
    definition,
    state,
    stateLabel,
    freshness,
    latestExecution,
    executionHistory,
    latestManualReview,
    manualReviewHistory,
  };
}

export function summarizeDerivedValidationGates(
  gates: DerivedValidationGate[],
  orphanedLegacyEvidence = 0,
): ValidationLedgerSummary {
  return gates.reduce<ValidationLedgerSummary>((summary, gate) => {
    summary.activeGates += gate.definition.lifecycle === 'active' ? 1 : 0;
    if (gate.state === 'passing') summary.passing += 1;
    if (gate.state === 'failing' || gate.state === 'unexpected_pass') summary.failing += 1;
    if (gate.state === 'error') summary.errors += 1;
    if (gate.state === 'not_run') summary.notRun += 1;
    if (gate.state === 'expected_red_demonstrated') summary.expectedRedDemonstrated += 1;
    if (gate.state === 'manual_pending') summary.manualPending += 1;
    if (gate.state === 'manual_approved') summary.manualApproved += 1;
    if (gate.state === 'manual_rejected') summary.manualRejected += 1;
    if (gate.freshness === 'current') summary.freshnessCurrent += 1;
    if (gate.freshness === 'stale') summary.freshnessStale += 1;
    if (gate.freshness === 'unknown') summary.freshnessUnknown += 1;
    return summary;
  }, {
    activeGates: 0,
    passing: 0,
    failing: 0,
    errors: 0,
    notRun: 0,
    expectedRedDemonstrated: 0,
    manualPending: 0,
    manualApproved: 0,
    manualRejected: 0,
    freshnessCurrent: 0,
    freshnessStale: 0,
    freshnessUnknown: 0,
    orphanedLegacyEvidence,
  });
}

export function isAutomatedExecutionResult(value: unknown): value is AutomatedExecutionResult {
  return value === 'pass' || value === 'fail' || value === 'error';
}
