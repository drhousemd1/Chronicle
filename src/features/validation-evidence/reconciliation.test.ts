import { mkdtemp, mkdir, readFile, rm, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { afterEach, describe, expect, it } from 'vitest';

import { readAutomatedExecutions } from './ledger-file';
import { reconcileLegacyValidationEvidence } from './reconciliation';

const tempDirs: string[] = [];

describe('legacy validation evidence reconciliation', () => {
  afterEach(async () => {
    await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
  });

  it('matches supported rows, preserves nullable legacy metadata, and leaves unmatched rows orphaned', async () => {
    const root = await mkdtemp(join(tmpdir(), 'chronicle-reconciliation-'));
    tempDirs.push(root);
    const ledgerPath = join(root, 'legacy-ledger.json');
    const reportDirectory = join(root, 'legacy-reports');
    const evidenceRoot = join(root, 'evidence');
    await mkdir(reportDirectory, { recursive: true });
    await writeFile(join(reportDirectory, 'issue-01-contract-unit-tests.json'), JSON.stringify({ legacy: true }), 'utf8');
    await writeFile(ledgerPath, JSON.stringify({
      rows: [
        {
          id: 'issue-01-contract-unit-tests',
          issueNumber: 1,
          issueTitle: 'First-Class Response Job Contract',
          validationPhase: 'Validation Phase 1: Contract Unit Tests',
          commandOrFixture: 'npm run validation:roleplay:batch0',
          result: 'Pass',
          failureCause: '',
          evidenceFile: 'public/validation-evidence/reports/issue-01-contract-unit-tests.json',
          manualReview: 'none',
        },
        {
          id: 'legacy-unmatched-row',
          issueNumber: 99,
          issueTitle: 'Unmatched',
          validationPhase: 'Unknown',
          commandOrFixture: 'unknown',
          result: 'Pass',
          failureCause: '',
          evidenceFile: 'public/validation-evidence/reports/legacy-unmatched-row.json',
          manualReview: 'none',
        },
        { id: 'malformed-row' },
      ],
    }), 'utf8');

    const report = await reconcileLegacyValidationEvidence({ ledgerPath, reportDirectory, evidenceRoot, reconciledAt: '2026-07-10T00:00:00.000Z' });
    expect(report).toMatchObject({ totalRows: 3, matched: 1, orphaned: 1, malformed: 1 });
    expect(report.orphanedRows[0]).toMatchObject({ legacyId: 'legacy-unmatched-row', reason: 'no_supported_gate_match' });

    const executions = await readAutomatedExecutions(evidenceRoot);
    expect(executions).toHaveLength(1);
    expect(executions[0]).toMatchObject({
      gateId: 'issue-01-contract-unit-tests',
      result: 'pass',
      executedAt: null,
      sourceRevision: null,
      sourceState: 'unknown',
      processExitCode: null,
      legacy: true,
    });
    expect(JSON.parse(await readFile(join(evidenceRoot, executions[0].rawReportPath ?? ''), 'utf8'))).toEqual({ legacy: true });

    await unlink(join(evidenceRoot, executions[0].rawReportPath ?? ''));
    const secondReport = await reconcileLegacyValidationEvidence({ ledgerPath, reportDirectory, evidenceRoot, reconciledAt: '2026-07-10T01:00:00.000Z' });
    expect(secondReport.missingReports).toEqual([]);
    expect(await readAutomatedExecutions(evidenceRoot)).toHaveLength(1);
    expect(JSON.parse(await readFile(join(evidenceRoot, executions[0].rawReportPath ?? ''), 'utf8'))).toEqual({ legacy: true });
  });
});
