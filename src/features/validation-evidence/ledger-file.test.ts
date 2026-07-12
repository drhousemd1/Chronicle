import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { afterEach, describe, expect, it } from 'vitest';

import type { AutomatedExecutionRecord } from './ledger';
import {
  appendAutomatedExecution,
  buildValidationEvidenceLedgerSnapshot,
  readAutomatedExecutions,
  resolveEvidencePath,
} from './ledger-file';

const tempDirs: string[] = [];

function record(executionId: string, result: 'pass' | 'fail'): AutomatedExecutionRecord {
  return {
    schemaVersion: 1,
    executionId,
    gateId: 'issue-24-fixture-harness-command',
    result,
    processExitCode: result === 'pass' ? 0 : 1,
    failureCause: result === 'pass' ? '' : 'fixture failed',
    exactCommand: 'npm run validation:gate -- --gate issue-24-fixture-harness-command',
    fixtureId: 'issue-24-fixture-harness-command',
    executedAt: '2026-07-10T00:00:00.000Z',
    sourceRevision: null,
    sourceState: 'dirty',
    durationMs: 10,
    rawReportPath: null,
    legacy: false,
  };
}

describe('append-only validation evidence storage', () => {
  afterEach(async () => {
    await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
  });

  it('preserves prior executions instead of replacing a gate by id', async () => {
    const root = await mkdtemp(join(tmpdir(), 'chronicle-ledger-'));
    tempDirs.push(root);
    await appendAutomatedExecution(record('execution-fail', 'fail'), root);
    await appendAutomatedExecution(record('execution-pass', 'pass'), root);

    const executions = await readAutomatedExecutions(root);
    expect(executions.map((execution) => execution.executionId).sort()).toEqual(['execution-fail', 'execution-pass']);

    const snapshot = await buildValidationEvidenceLedgerSnapshot({ revision: null, state: 'dirty' }, root);
    const gate = snapshot.gates.find((candidate) => candidate.definition.gateId === 'issue-24-fixture-harness-command');
    expect(gate?.executionHistory).toHaveLength(2);
    expect(gate?.latestExecution?.executionId).toBe('execution-pass');
  });

  it('refuses to overwrite an immutable execution record', async () => {
    const root = await mkdtemp(join(tmpdir(), 'chronicle-ledger-'));
    tempDirs.push(root);
    await appendAutomatedExecution(record('same-execution', 'fail'), root);
    await expect(appendAutomatedExecution(record('same-execution', 'pass'), root)).rejects.toMatchObject({ code: 'EEXIST' });
  });

  it('rejects absolute paths and paths that escape the evidence root', () => {
    expect(() => resolveEvidencePath('/tmp/report.json')).toThrow('Absolute validation-evidence paths are not allowed');
    expect(() => resolveEvidencePath('.validation-evidence/roleplay-pipeline/../outside.json')).toThrow('escapes the allowed evidence root');
  });
});
