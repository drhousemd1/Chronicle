import { describe, expect, it } from 'vitest';

import {
  deriveExecutionFreshness,
  deriveValidationGate,
  isAutomatedExecutionResult,
  summarizeDerivedValidationGates,
  type AutomatedExecutionRecord,
  type ManualReviewRecord,
} from './ledger';
import type { RoleplayArtifactIdentityReport } from './roleplay-artifact-identity';
import { getRoleplayValidationGate } from './roleplay-gates';

function gate(gateId: string) {
  const definition = getRoleplayValidationGate(gateId);
  if (!definition) throw new Error(`Missing test gate: ${gateId}`);
  return definition;
}

function execution(overrides: Partial<AutomatedExecutionRecord> = {}): AutomatedExecutionRecord {
  return {
    schemaVersion: 1,
    executionId: 'execution-1',
    gateId: 'issue-01-contract-unit-tests',
    result: 'pass',
    processExitCode: 0,
    failureCause: '',
    exactCommand: 'npm run validation:gate -- --gate issue-01-contract-unit-tests',
    fixtureId: 'issue-01-contract-unit-tests',
    executedAt: '2026-07-10T01:00:00.000Z',
    sourceRevision: null,
    sourceState: 'dirty',
    durationMs: 10,
    rawReportPath: 'reports/execution-1.json',
    legacy: false,
    ...overrides,
  };
}

function artifactReport(
  state: RoleplayArtifactIdentityReport['state'],
  sourceRevision: string | null = 'revision-1',
): RoleplayArtifactIdentityReport {
  return {
    schemaVersion: 1,
    state,
    sourceRevision,
    sourceState: sourceRevision ? 'clean' : 'unknown',
    terminalMigration: 'migration.sql',
    generatedAt: '2026-07-10T01:00:00.000Z',
    artifacts: [],
    reasons: [],
  };
}

describe('validation evidence derived state', () => {
  it('derives Not Run from an active gate without storing a fake execution result', () => {
    const derived = deriveValidationGate(
      gate('issue-01-contract-unit-tests'),
      [],
      [],
      { currentSourceRevision: null, currentSourceState: 'dirty' },
    );

    expect(derived.state).toBe('not_run');
    expect(derived.latestExecution).toBeNull();
    expect(isAutomatedExecutionResult('not_run')).toBe(false);
    expect(isAutomatedExecutionResult('Not Run')).toBe(false);
  });

  it('keeps expected-red as a failed execution while deriving a demonstrated checkpoint', () => {
    const red = execution({
      executionId: 'red-1',
      gateId: 'issue-26-recent-history-expected-red',
      result: 'fail',
      processExitCode: 1,
      sourceState: 'unknown',
    });
    const derived = deriveValidationGate(
      gate('issue-26-recent-history-expected-red'),
      [red],
      [],
      { currentSourceRevision: null, currentSourceState: 'dirty' },
    );

    expect(derived.latestExecution?.result).toBe('fail');
    expect(derived.state).toBe('expected_red_demonstrated');
    expect(derived.freshness).toBe('unknown');
  });

  it('uses the latest expected-red execution while preserving the earlier failure in history', () => {
    const derived = deriveValidationGate(
      gate('issue-26-recent-history-expected-red'),
      [
        execution({ executionId: 'red-1', gateId: 'issue-26-recent-history-expected-red', result: 'fail', processExitCode: 1 }),
        execution({ executionId: 'red-2', gateId: 'issue-26-recent-history-expected-red', result: 'pass', processExitCode: 0, executedAt: '2026-07-10T02:00:00.000Z' }),
      ],
      [],
      { currentSourceRevision: null, currentSourceState: 'dirty' },
    );

    expect(derived.executionHistory).toHaveLength(2);
    expect(derived.latestExecution?.result).toBe('pass');
    expect(derived.state).toBe('unexpected_pass');
  });

  it('keeps manual review independent from automated executions', () => {
    const review: ManualReviewRecord = {
      schemaVersion: 1,
      reviewId: 'review-1',
      gateId: 'issue-24-admin-export-manual-review',
      outcome: 'approved',
      reviewer: 'admin',
      reviewedAt: '2026-07-10T03:00:00.000Z',
      notes: 'Export reviewed.',
      evidenceReferences: ['local-export.html'],
    };
    const pending = deriveValidationGate(
      gate('issue-24-admin-export-manual-review'),
      [],
      [],
      { currentSourceRevision: null, currentSourceState: 'dirty' },
    );
    const approved = deriveValidationGate(
      gate('issue-24-admin-export-manual-review'),
      [],
      [review],
      { currentSourceRevision: null, currentSourceState: 'dirty' },
    );

    expect(pending.state).toBe('manual_pending');
    expect(approved.state).toBe('manual_approved');
  });

  it('requires exact artifact identity before evidence can be current', () => {
    const base = execution({
      sourceRevision: 'revision-1',
      sourceState: 'clean',
    });
    const options = {
      currentSourceRevision: 'revision-1',
      currentSourceState: 'clean' as const,
    };

    expect(deriveExecutionFreshness(base, options)).toBe('unknown');
    expect(deriveExecutionFreshness({
      ...base,
      artifactIdentityReport: artifactReport('unknown'),
    }, options)).toBe('unknown');
    expect(deriveExecutionFreshness({
      ...base,
      artifactIdentityReport: artifactReport('mismatch'),
    }, options)).toBe('stale');
    expect(deriveExecutionFreshness({
      ...base,
      artifactIdentityReport: artifactReport('current'),
    }, options)).toBe('current');
  });

  it('treats an artifact report from a different source revision as stale', () => {
    expect(deriveExecutionFreshness(execution({
      sourceRevision: 'revision-1',
      sourceState: 'clean',
      artifactIdentityReport: artifactReport('current', 'revision-2'),
    }), {
      currentSourceRevision: 'revision-1',
      currentSourceState: 'clean',
    })).toBe('stale');
  });

  it('counts gate coverage rather than execution-history volume', () => {
    const definitions = [gate('issue-01-contract-unit-tests'), gate('issue-26-recent-history-expected-green')];
    const executions = [
      execution({ executionId: 'one' }),
      execution({ executionId: 'two', executedAt: '2026-07-10T02:00:00.000Z' }),
    ];
    const derived = definitions.map((definition) => deriveValidationGate(
      definition,
      executions,
      [],
      { currentSourceRevision: null, currentSourceState: 'dirty' },
    ));

    expect(summarizeDerivedValidationGates(derived)).toMatchObject({
      activeGates: 2,
      passing: 1,
      notRun: 1,
    });
  });
});
