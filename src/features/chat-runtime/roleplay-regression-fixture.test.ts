import { describe, expect, it } from 'vitest';

import { createFixtureExecutionCollector } from '@/features/validation-evidence/test-recorder';
import { runRoleplayRegressionFixtures } from './roleplay-regression-fixture';

describe('runRoleplayRegressionFixtures', () => {
  it('runs provider-free fixtures and sends immutable execution reports to the shared writer', async () => {
    const recorder = createFixtureExecutionCollector();
    const run = await runRoleplayRegressionFixtures({
      recordExecution: recorder.recordExecution,
      fixtures: [
        {
          id: 'issue-24-fixture-harness-command',
          issueNumber: 24,
          issueTitle: 'Roleplay Regression Fixture Harness',
          validationPhase: 'Validation Phase 1: New Fixture Harness Command',
          commandOrFixture: 'roleplay-regression-fixture:smoke-pass',
          manualReview: 'No manual review required for provider-free harness smoke.',
          createArtifact: () => ({
            text: [
              'mode=normal_send',
              'sourceReceipt=RoleplaySourceReceipt',
              'ledger=row-created',
            ].join('\n'),
          }),
          positiveAssertions: [
            { label: 'captures runtime mode', includes: 'mode=normal_send' },
            { label: 'captures source receipt', includes: 'sourceReceipt=RoleplaySourceReceipt' },
          ],
          negativeAssertions: [
            { label: 'does not leak rejected assistant text', excludes: 'rejected assistant text' },
          ],
        },
        {
          id: 'issue-01-contract-unit-tests',
          issueNumber: 1,
          issueTitle: 'First-Class Response Job Contract',
          validationPhase: 'Validation Phase 1: Contract Unit Tests',
          commandOrFixture: 'roleplay-regression-fixture:smoke-fail',
          manualReview: 'Review failed contract report before marking the phase complete.',
          createArtifact: () => ({ text: 'mode=normal_send\nrejected assistant text' }),
          positiveAssertions: [
            { label: 'captures runtime mode', includes: 'mode=normal_send' },
          ],
          negativeAssertions: [
            { label: 'does not leak rejected assistant text', excludes: 'rejected assistant text' },
          ],
        },
      ],
    });

    expect(run.summary).toEqual({ total: 2, passed: 1, failed: 1 });
    expect(run.results[0]).toMatchObject({
      id: 'issue-24-fixture-harness-command',
      result: 'pass',
      failedAssertions: [],
    });
    expect(run.results[1]).toMatchObject({
      id: 'issue-01-contract-unit-tests',
      result: 'fail',
      failedAssertions: ['does not leak rejected assistant text'],
    });

    const ledger = { rows: recorder.rows };
    expect(ledger.rows).toHaveLength(2);
    expect(ledger.rows).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'issue-24-fixture-harness-command',
        issueNumber: 24,
        result: 'Pass',
        failureCause: '',
      }),
      expect.objectContaining({
        id: 'issue-01-contract-unit-tests',
        issueNumber: 1,
        result: 'Fail',
        failureCause: 'does not leak rejected assistant text',
      }),
    ]));

    const failedReport = ledger.rows.find((row) => row.id === 'issue-01-contract-unit-tests')?.rawReport;
    expect(failedReport).toMatchObject({
      id: 'issue-01-contract-unit-tests',
      result: 'fail',
      failedAssertions: ['does not leak rejected assistant text'],
      artifactPreview: 'mode=normal_send\nrejected assistant text',
    });
  });

  it('records fixture crashes as execution errors before rethrowing', async () => {
    const recorder = createFixtureExecutionCollector();

    await expect(runRoleplayRegressionFixtures({
      recordExecution: recorder.recordExecution,
      fixtures: [{
        id: 'issue-24-fixture-harness-command',
        issueNumber: 24,
        issueTitle: 'Roleplay Regression Fixture Harness',
        validationPhase: 'Validation Phase 1: New Fixture Harness Command',
        commandOrFixture: 'roleplay-regression-fixture:crash',
        manualReview: 'Review the fixture crash report.',
        createArtifact: () => { throw new Error('fixture exploded'); },
        positiveAssertions: [],
        negativeAssertions: [],
      }],
    })).rejects.toThrow('fixture exploded');

    expect(recorder.rows).toEqual([
      expect.objectContaining({
        id: 'issue-24-fixture-harness-command',
        result: 'Error',
        failureCause: 'fixture exploded',
        rawReport: expect.objectContaining({ result: 'error', failureCause: 'fixture exploded' }),
      }),
    ]);
  });
});
