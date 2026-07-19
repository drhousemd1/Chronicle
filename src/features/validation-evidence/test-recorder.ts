import type { AutomatedExecutionRecord } from './ledger';
import { getRoleplayValidationGate } from './roleplay-gates';
import type { RecordFixtureExecutionInput } from './runner';

export type FixtureTestRow = {
  id: string;
  issueNumber: number;
  issueTitle: string;
  validationPhase: string;
  commandOrFixture: string;
  result: 'Pass' | 'Fail' | 'Error';
  failureCause: string;
  rawReport: unknown;
};

export function createFixtureExecutionCollector() {
  const rows: FixtureTestRow[] = [];
  let count = 0;

  async function recordExecution(input: RecordFixtureExecutionInput): Promise<AutomatedExecutionRecord> {
    const gate = getRoleplayValidationGate(input.gateId);
    if (!gate) throw new Error(`Unknown test gate: ${input.gateId}`);
    count += 1;
    rows.push({
      id: gate.gateId,
      issueNumber: gate.issueNumber,
      issueTitle: gate.issueTitle,
      validationPhase: gate.validationPhase,
      commandOrFixture: input.exactCommand,
      result: input.result === 'pass' ? 'Pass' : input.result === 'fail' ? 'Fail' : 'Error',
      failureCause: input.failureCause,
      rawReport: input.report,
    });
    rows.sort((a, b) => a.issueNumber - b.issueNumber
      || a.validationPhase.localeCompare(b.validationPhase)
      || a.id.localeCompare(b.id));
    return {
      schemaVersion: 1,
      executionId: `test-execution-${count}`,
      gateId: gate.gateId,
      result: input.result,
      processExitCode: input.result === 'error' ? null : input.result === 'pass' ? 0 : 1,
      failureCause: input.failureCause,
      exactCommand: input.exactCommand,
      fixtureId: gate.runner.kind === 'fixture' ? gate.runner.fixtureId : null,
      executedAt: '2026-07-10T00:00:00.000Z',
      sourceRevision: null,
      sourceState: 'unknown',
      durationMs: input.durationMs,
      rawReportPath: null,
      legacy: false,
    };
  }

  return { rows, recordExecution };
}
