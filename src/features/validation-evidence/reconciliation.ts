import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { basename, resolve } from 'node:path';

import type {
  AutomatedExecutionRecord,
  LegacyReconciliationSummary,
  OrphanedLegacyEvidence,
} from './ledger';
import {
  appendAutomatedExecution,
  readAutomatedExecutions,
  VALIDATION_EVIDENCE_ROOT,
  writeRawReport,
  writeReconciliationReport,
} from './ledger-file';
import { getRoleplayValidationGate } from './roleplay-gates';

export const LEGACY_LEDGER_PATH = 'public/validation-evidence/generated/roleplay-pipeline-ledger.json';
export const LEGACY_REPORT_DIRECTORY = 'public/validation-evidence/reports';

type LegacyLedgerRow = {
  id: string;
  issueNumber: number;
  issueTitle: string;
  validationPhase: string;
  commandOrFixture: string;
  result: 'Pass' | 'Fail';
  failureCause: string;
  evidenceFile: string;
  manualReview: string;
  rawReport?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeLegacyRow(value: unknown): LegacyLedgerRow | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== 'string' || !value.id) return null;
  if (typeof value.issueNumber !== 'number' || value.issueNumber <= 0) return null;
  if (typeof value.issueTitle !== 'string' || typeof value.validationPhase !== 'string') return null;
  if (typeof value.commandOrFixture !== 'string' || typeof value.failureCause !== 'string') return null;
  if (typeof value.evidenceFile !== 'string' || typeof value.manualReview !== 'string') return null;
  if (value.result !== 'Pass' && value.result !== 'Fail') return null;
  return value as unknown as LegacyLedgerRow;
}

function legacyExecutionId(row: LegacyLedgerRow) {
  const digest = createHash('sha256').update(JSON.stringify(row)).digest('hex').slice(0, 16);
  return `legacy-${row.id}-${digest}`;
}

function metadataMatches(row: LegacyLedgerRow) {
  const gate = getRoleplayValidationGate(row.id);
  if (!gate || gate.evidenceKind !== 'fixture' || gate.runner.kind !== 'fixture') return false;
  return gate.issueNumber === row.issueNumber
    && gate.issueTitle === row.issueTitle
    && gate.validationPhase === row.validationPhase
    && gate.runner.fixtureId === row.id;
}

async function readLegacyReport(row: LegacyLedgerRow, reportDirectory: string) {
  const expectedName = `${row.id}.json`;
  if (basename(row.evidenceFile) !== expectedName) return null;
  try {
    return JSON.parse(await readFile(resolve(reportDirectory, expectedName), 'utf8')) as unknown;
  } catch {
    return null;
  }
}

async function hasReadableJson(path: string) {
  try {
    JSON.parse(await readFile(path, 'utf8'));
    return true;
  } catch {
    return false;
  }
}

export type ReconcileLegacyEvidenceOptions = {
  ledgerPath?: string;
  reportDirectory?: string;
  reconciledAt?: string;
  evidenceRoot?: string;
};

export async function reconcileLegacyValidationEvidence({
  ledgerPath = LEGACY_LEDGER_PATH,
  reportDirectory = LEGACY_REPORT_DIRECTORY,
  reconciledAt = new Date().toISOString(),
  evidenceRoot = VALIDATION_EVIDENCE_ROOT,
}: ReconcileLegacyEvidenceOptions = {}) {
  const parsed = JSON.parse(await readFile(ledgerPath, 'utf8')) as unknown;
  const sourceRows = isRecord(parsed) && Array.isArray(parsed.rows) ? parsed.rows : [];
  const duplicateIds = sourceRows
    .map((row) => isRecord(row) && typeof row.id === 'string' ? row.id : '')
    .filter(Boolean)
    .filter((id, index, values) => values.indexOf(id) !== index)
    .filter((id, index, values) => values.indexOf(id) === index);
  const existingExecutionIds = new Set((await readAutomatedExecutions(evidenceRoot)).map((execution) => execution.executionId));
  const referencedReports = new Set<string>();
  const orphanedRows: OrphanedLegacyEvidence[] = [];
  const missingReports: string[] = [];
  let malformed = 0;
  let matched = 0;

  for (const sourceRow of sourceRows) {
    const row = normalizeLegacyRow(sourceRow);
    if (!row) {
      malformed += 1;
      continue;
    }
    if (duplicateIds.includes(row.id)) {
      orphanedRows.push({ legacyId: row.id, reason: 'duplicate_legacy_id', sourceRecord: sourceRow });
      continue;
    }
    if (!metadataMatches(row)) {
      orphanedRows.push({ legacyId: row.id, reason: 'no_supported_gate_match', sourceRecord: sourceRow });
      continue;
    }

    const expectedReportName = `${row.id}.json`;
    referencedReports.add(expectedReportName);
    const legacyReport = await readLegacyReport(row, reportDirectory);

    const executionId = legacyExecutionId(row);
    let rawReportPath: string | null = null;
    const destinationReportReference = `reports/${executionId}.json`;
    const destinationReportPath = resolve(evidenceRoot, destinationReportReference);
    const destinationReportExists = await hasReadableJson(destinationReportPath);
    if (destinationReportExists || legacyReport !== null) {
      rawReportPath = destinationReportReference;
    }
    if (legacyReport !== null) {
      if (!destinationReportExists) {
        try {
          await writeRawReport(executionId, legacyReport, evidenceRoot);
        } catch {
          missingReports.push(destinationReportReference);
        }
      }
    } else if (!destinationReportExists) {
      missingReports.push(expectedReportName);
    }

    const gate = getRoleplayValidationGate(row.id);
    const execution: AutomatedExecutionRecord = {
      schemaVersion: 1,
      executionId,
      gateId: row.id,
      result: row.result === 'Pass' ? 'pass' : 'fail',
      processExitCode: null,
      failureCause: row.failureCause,
      exactCommand: null,
      fixtureId: gate?.runner.kind === 'fixture' ? gate.runner.fixtureId : null,
      executedAt: null,
      sourceRevision: null,
      sourceState: 'unknown',
      durationMs: null,
      rawReportPath,
      legacy: true,
    };
    if (!existingExecutionIds.has(executionId)) {
      await appendAutomatedExecution(execution, evidenceRoot);
      existingExecutionIds.add(executionId);
    }
    matched += 1;
  }

  let reportNames: string[] = [];
  try {
    reportNames = (await readdir(reportDirectory)).filter((name) => name.endsWith('.json'));
  } catch {
    reportNames = [];
  }

  const report: LegacyReconciliationSummary = {
    reconciledAt,
    sourceLedgerPath: ledgerPath,
    totalRows: sourceRows.length,
    matched,
    orphaned: orphanedRows.length,
    malformed,
    duplicateIds,
    missingReports,
    orphanReports: reportNames.filter((name) => !referencedReports.has(name)).sort(),
    orphanedRows,
  };
  await writeReconciliationReport(report, evidenceRoot);
  return report;
}
