import { describe, expect, it } from 'vitest';

import { createFixtureExecutionCollector } from '@/features/validation-evidence/test-recorder';
import { projectPlayerTurnVisibility } from './player-turn-visibility';
import { buildRoleplayCharacterStateApplyReceipt } from './roleplay-character-state-review';
import {
  buildRoleplayHarnessContractArtifact,
  evaluateRoleplayHarnessContractArtifact,
  type RoleplayHarnessContractChecks,
  type RoleplayHarnessContractTargets,
} from './roleplay-harness-contract-artifact';
import { compileRoleplayRecentHistory } from './roleplay-recent-history';
import { buildRoleplayActiveScenePacketCandidate } from './roleplay-source-shaping';
import {
  runRoleplayRegressionFixtures,
  type RoleplayRegressionFixture,
} from './roleplay-regression-fixture';

const ISSUE_24_GATE = {
  id: 'issue-24-fixture-harness-command',
  issueNumber: 24,
  issueTitle: 'Roleplay Regression Fixture Harness',
  validationPhase: 'Validation Phase 1: New Fixture Harness Command',
  commandOrFixture: 'roleplay-regression-fixture:harness-self-test',
  manualReview: 'No manual review required for provider-free harness self-test.',
} as const;

function issue24Fixture(
  input: Pick<RoleplayRegressionFixture, 'createArtifact'>
    & Partial<Pick<RoleplayRegressionFixture, 'positiveAssertions' | 'negativeAssertions' | 'artifactAssertions' | 'timeoutMs'>>,
): RoleplayRegressionFixture {
  return {
    ...ISSUE_24_GATE,
    createArtifact: input.createArtifact,
    positiveAssertions: input.positiveAssertions ?? [],
    negativeAssertions: input.negativeAssertions ?? [],
    artifactAssertions: input.artifactAssertions,
    timeoutMs: input.timeoutMs,
  };
}

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
      assertionInventory: [
        'includes:captures-runtime-mode',
        'includes:captures-source-receipt',
        'excludes:does-not-leak-rejected-assistant-text',
      ],
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

  it.each([
    {
      name: 'timeout',
      fixture: issue24Fixture({
        timeoutMs: 5,
        createArtifact: () => new Promise(() => undefined),
        positiveAssertions: [{ label: 'never reached', includes: 'ready' }],
      }),
      error: 'Fixture timed out after 5 milliseconds.',
    },
    {
      name: 'malformed artifact',
      fixture: issue24Fixture({
        createArtifact: () => null as unknown as { text: string },
        positiveAssertions: [{ label: 'never reached', includes: 'ready' }],
      }),
      error: 'Fixture returned a malformed artifact',
    },
    {
      name: 'missing assertions',
      fixture: issue24Fixture({ createArtifact: () => ({ text: 'valid artifact' }) }),
      error: 'Fixture has no assertions',
    },
    {
      name: 'duplicate assertion identities',
      fixture: issue24Fixture({
        createArtifact: () => ({ text: 'valid artifact' }),
        artifactAssertions: [
          { id: 'duplicate', label: 'first', evaluate: () => true },
          { id: 'duplicate', label: 'second', evaluate: () => true },
        ],
      }),
      error: 'Fixture contains duplicate assertion identities',
    },
  ])('records $name as an execution error', async ({ fixture, error }) => {
    const recorder = createFixtureExecutionCollector();

    await expect(runRoleplayRegressionFixtures({
      recordExecution: recorder.recordExecution,
      fixtures: [fixture],
    })).rejects.toThrow(error);

    expect(recorder.rows).toEqual([
      expect.objectContaining({
        id: ISSUE_24_GATE.id,
        result: 'Error',
        failureCause: expect.stringContaining(error),
      }),
    ]);
  });

  it('appends reruns instead of replacing earlier execution reports', async () => {
    const recorder = createFixtureExecutionCollector();
    const fixture = issue24Fixture({
      createArtifact: () => ({ text: 'calculated=true' }),
      positiveAssertions: [{ label: 'calculated result is present', includes: 'calculated=true' }],
    });

    const first = await runRoleplayRegressionFixtures({
      recordExecution: recorder.recordExecution,
      fixtures: [fixture],
    });
    const second = await runRoleplayRegressionFixtures({
      recordExecution: recorder.recordExecution,
      fixtures: [fixture],
    });

    expect(recorder.rows).toHaveLength(2);
    expect(first.results[0].executionId).not.toBe(second.results[0].executionId);
  });

  it('attributes deliberately broken source, privacy, Retry history, and persistence checks', async () => {
    const recorder = createFixtureExecutionCollector();
    const mutationFixture = (
      assertionId: string,
      label: string,
      targets: Partial<RoleplayHarnessContractTargets>,
      check: keyof RoleplayHarnessContractChecks,
    ) => issue24Fixture({
      createArtifact: () => {
        const contractArtifact = buildRoleplayHarnessContractArtifact(targets);
        return {
          text: JSON.stringify(contractArtifact),
          metadata: evaluateRoleplayHarnessContractArtifact(contractArtifact),
        };
      },
      artifactAssertions: [{
        id: assertionId,
        label,
        evaluate: (artifact) => (
          (artifact.metadata as RoleplayHarnessContractChecks)[check]
        ),
      }],
    });
    const run = await runRoleplayRegressionFixtures({
      recordExecution: recorder.recordExecution,
      fixtures: [
        mutationFixture(
          'source-selector:highest-authority-selected',
          'source selector keeps the highest-authority duplicate',
          {
            selectSources: (input) => {
              const result = buildRoleplayActiveScenePacketCandidate(input);
              const staleReceipt = input.receipts.find((receipt) => receipt.authority === 'medium');
              return {
                ...result,
                includedReceiptIds: staleReceipt ? [staleReceipt.id] : [],
              };
            },
          },
          'highestAuthoritySourceSelected',
        ),
        mutationFixture(
          'privacy:private-text-withheld',
          'private player text is absent from visible provider text',
          {
            projectPlayerTurn: (text, sourceMessageId) => ({
              ...projectPlayerTurnVisibility(text, sourceMessageId),
              visibleText: text,
              changed: false,
            }),
          },
          'privatePlayerTextWithheld',
        ),
        mutationFixture(
          'retry-history:rejected-generation-excluded',
          'rejected Retry text is absent from accepted provider history',
          {
            compileRecentHistory: (input) => {
              const result = compileRoleplayRecentHistory(input);
              const rejected = input.messages.find((message) => message.role === 'assistant');
              return {
                ...result,
                packet: {
                  ...result.packet,
                  providerMessages: [
                    ...result.packet.providerMessages,
                    ...(rejected ? [{ role: 'assistant' as const, content: rejected.text }] : []),
                  ],
                },
              };
            },
          },
          'rejectedRetryGenerationExcluded',
        ),
        mutationFixture(
          'persistence:accepted-generation-preserved',
          'persistence receipt retains the accepted source generation',
          {
            buildPersistenceReceipt: (input) => ({
              ...buildRoleplayCharacterStateApplyReceipt(input),
              sourceGenerationId: 'generation-stale',
            }),
          },
          'acceptedPersistenceGenerationPreserved',
        ),
      ],
    });

    expect(run.summary).toEqual({ total: 4, passed: 0, failed: 4 });
    expect(run.results.map((result) => result.failedAssertions[0])).toEqual([
      'source selector keeps the highest-authority duplicate',
      'private player text is absent from visible provider text',
      'rejected Retry text is absent from accepted provider history',
      'persistence receipt retains the accepted source generation',
    ]);
    expect(run.results.flatMap((result) => result.assertionResults)).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'source-selector:highest-authority-selected', passed: false }),
      expect.objectContaining({ id: 'privacy:private-text-withheld', passed: false }),
      expect.objectContaining({ id: 'retry-history:rejected-generation-excluded', passed: false }),
      expect.objectContaining({ id: 'persistence:accepted-generation-preserved', passed: false }),
    ]));
  });
});
