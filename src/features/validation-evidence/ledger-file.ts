import { randomUUID } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { basename, dirname, isAbsolute, relative, resolve } from 'node:path';

import {
  deriveValidationGate,
  isAutomatedExecutionResult,
  summarizeDerivedValidationGates,
  type AutomatedExecutionRecord,
  type LegacyReconciliationSummary,
  type ManualReviewOutcome,
  type ManualReviewRecord,
  type ValidationEvidenceLedgerSnapshot,
} from './ledger';
import {
  ROLEPLAY_VALIDATION_GATES,
  ROLEPLAY_VALIDATION_SCOPE_ID,
  getRoleplayValidationGate,
} from './roleplay-gates';

export const VALIDATION_EVIDENCE_ROOT = '.validation-evidence/roleplay-pipeline';
export const VALIDATION_EXECUTION_DIRECTORY = `${VALIDATION_EVIDENCE_ROOT}/executions`;
export const VALIDATION_MANUAL_REVIEW_DIRECTORY = `${VALIDATION_EVIDENCE_ROOT}/manual-reviews`;
export const VALIDATION_REPORT_DIRECTORY = `${VALIDATION_EVIDENCE_ROOT}/reports`;
export const VALIDATION_RECONCILIATION_DIRECTORY = `${VALIDATION_EVIDENCE_ROOT}/reconciliation`;
export const VALIDATION_CURRENT_LEDGER_PATH = `${VALIDATION_EVIDENCE_ROOT}/generated/current-ledger.json`;
export const VALIDATION_CURRENT_RECONCILIATION_PATH = `${VALIDATION_RECONCILIATION_DIRECTORY}/current-reconciliation.json`;

function evidencePath(root: string, child: string) {
  return `${root}/${child}`;
}

type SourceIdentity = {
  revision: string | null;
  state: 'clean' | 'dirty' | 'unknown';
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function safeRecordId(value: string, label: string) {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(value)) {
    throw new Error(`${label} contains unsupported characters.`);
  }
  return value;
}

export function resolveEvidencePath(path: string, root = VALIDATION_EVIDENCE_ROOT) {
  if (isAbsolute(path) && !isAbsolute(root)) throw new Error('Absolute validation-evidence paths are not allowed.');
  const rootPath = resolve(root);
  const targetPath = resolve(path);
  const relativePath = relative(rootPath, targetPath);
  if (relativePath.startsWith('..') || isAbsolute(relativePath)) {
    throw new Error('Validation-evidence path escapes the allowed evidence root.');
  }
  return targetPath;
}

async function writeImmutableJson(path: string, value: unknown) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' });
}

async function writeGeneratedJson(path: string, value: unknown) {
  await mkdir(dirname(path), { recursive: true });
  const temporaryPath = `${path}.${process.pid}.${randomUUID()}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  const { rename } = await import('node:fs/promises');
  await rename(temporaryPath, path);
}

async function readJsonFiles(directory: string) {
  try {
    const entries = await readdir(directory, { withFileTypes: true });
    const values: unknown[] = [];
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
      try {
        values.push(JSON.parse(await readFile(resolve(directory, entry.name), 'utf8')));
      } catch {
        // Malformed generated records are reported by reconciliation and ignored in the current view.
      }
    }
    return values;
  } catch {
    return [];
  }
}

function normalizeExecution(value: unknown): AutomatedExecutionRecord | null {
  if (!isRecord(value) || value.schemaVersion !== 1) return null;
  if (typeof value.executionId !== 'string' || typeof value.gateId !== 'string') return null;
  if (!isAutomatedExecutionResult(value.result)) return null;
  if (value.executedAt !== null && typeof value.executedAt !== 'string') return null;
  if (value.sourceRevision !== null && typeof value.sourceRevision !== 'string') return null;
  if (value.processExitCode !== null && typeof value.processExitCode !== 'number') return null;
  if (value.sourceState !== 'clean' && value.sourceState !== 'dirty' && value.sourceState !== 'unknown') return null;

  return value as AutomatedExecutionRecord;
}

function normalizeManualReview(value: unknown): ManualReviewRecord | null {
  if (!isRecord(value) || value.schemaVersion !== 1) return null;
  if (typeof value.reviewId !== 'string' || typeof value.gateId !== 'string') return null;
  if (value.outcome !== 'approved' && value.outcome !== 'rejected') return null;
  if (typeof value.reviewedAt !== 'string' || typeof value.reviewer !== 'string' || typeof value.notes !== 'string') return null;
  if (!Array.isArray(value.evidenceReferences) || value.evidenceReferences.some((item) => typeof item !== 'string')) return null;
  return value as unknown as ManualReviewRecord;
}

export async function readAutomatedExecutions(root = VALIDATION_EVIDENCE_ROOT) {
  const values = await readJsonFiles(evidencePath(root, 'executions'));
  return values.map(normalizeExecution).filter((value): value is AutomatedExecutionRecord => value !== null);
}

export async function readManualReviews(root = VALIDATION_EVIDENCE_ROOT) {
  const values = await readJsonFiles(evidencePath(root, 'manual-reviews'));
  return values.map(normalizeManualReview).filter((value): value is ManualReviewRecord => value !== null);
}

export async function readCurrentReconciliation(root = VALIDATION_EVIDENCE_ROOT): Promise<LegacyReconciliationSummary | null> {
  try {
    const value = JSON.parse(await readFile(evidencePath(root, 'reconciliation/current-reconciliation.json'), 'utf8')) as unknown;
    return isRecord(value) && typeof value.reconciledAt === 'string'
      ? value as unknown as LegacyReconciliationSummary
      : null;
  } catch {
    return null;
  }
}

export async function appendAutomatedExecution(record: AutomatedExecutionRecord, root = VALIDATION_EVIDENCE_ROOT) {
  safeRecordId(record.executionId, 'Execution id');
  if (!getRoleplayValidationGate(record.gateId)) {
    throw new Error(`Unknown validation gate: ${record.gateId}`);
  }
  if (!isAutomatedExecutionResult(record.result)) {
    throw new Error('Automated execution result must be pass, fail, or error.');
  }
  const targetPath = resolveEvidencePath(evidencePath(root, `executions/${record.executionId}.json`), root);
  await writeImmutableJson(targetPath, record);
  return targetPath;
}

export type AppendManualReviewInput = {
  gateId: string;
  outcome: ManualReviewOutcome;
  reviewer: string;
  notes: string;
  evidenceReferences: string[];
  reviewedAt?: string;
};

export async function appendManualReview(input: AppendManualReviewInput, root = VALIDATION_EVIDENCE_ROOT) {
  const gate = getRoleplayValidationGate(input.gateId);
  if (!gate || gate.evidenceKind !== 'manual') {
    throw new Error(`Manual review gate is not defined: ${input.gateId}`);
  }
  const reviewedAt = input.reviewedAt ?? new Date().toISOString();
  const reviewId = `${reviewedAt.replace(/[^0-9]/g, '')}-${safeRecordId(input.gateId, 'Gate id')}-${randomUUID()}`;
  const record: ManualReviewRecord = {
    schemaVersion: 1,
    reviewId,
    gateId: input.gateId,
    outcome: input.outcome,
    reviewer: input.reviewer.trim(),
    reviewedAt,
    notes: input.notes.trim(),
    evidenceReferences: input.evidenceReferences,
  };
  await writeImmutableJson(resolveEvidencePath(evidencePath(root, `manual-reviews/${reviewId}.json`), root), record);
  return record;
}

export async function writeRawReport(executionId: string, report: unknown, root = VALIDATION_EVIDENCE_ROOT) {
  safeRecordId(executionId, 'Execution id');
  const relativePath = `reports/${executionId}.json`;
  await writeImmutableJson(resolveEvidencePath(evidencePath(root, relativePath), root), report);
  return relativePath;
}

export async function writeReconciliationReport(report: LegacyReconciliationSummary, root = VALIDATION_EVIDENCE_ROOT) {
  const immutableName = `reconciliation-${report.reconciledAt.replace(/[^0-9]/g, '')}-${randomUUID()}.json`;
  await writeImmutableJson(resolveEvidencePath(evidencePath(root, `reconciliation/${immutableName}`), root), report);
  await writeGeneratedJson(resolveEvidencePath(evidencePath(root, 'reconciliation/current-reconciliation.json'), root), report);
}

export async function buildValidationEvidenceLedgerSnapshot(
  sourceIdentity: SourceIdentity,
  root = VALIDATION_EVIDENCE_ROOT,
): Promise<ValidationEvidenceLedgerSnapshot> {
  const [executions, manualReviews, reconciliation] = await Promise.all([
    readAutomatedExecutions(root),
    readManualReviews(root),
    readCurrentReconciliation(root),
  ]);
  const gates = ROLEPLAY_VALIDATION_GATES.map((definition) => deriveValidationGate(
    definition,
    executions,
    manualReviews,
    {
      currentSourceRevision: sourceIdentity.revision,
      currentSourceState: sourceIdentity.state,
    },
  ));
  const snapshot: ValidationEvidenceLedgerSnapshot = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    activeScopeId: ROLEPLAY_VALIDATION_SCOPE_ID,
    sourceRevision: sourceIdentity.revision,
    sourceState: sourceIdentity.state,
    summary: summarizeDerivedValidationGates(gates, reconciliation?.orphaned ?? 0),
    gates,
    reconciliation,
  };
  await writeGeneratedJson(resolveEvidencePath(evidencePath(root, 'generated/current-ledger.json'), root), snapshot);
  return snapshot;
}

export async function readRawReportForExecution(executionId: string, root = VALIDATION_EVIDENCE_ROOT) {
  safeRecordId(executionId, 'Execution id');
  const executions = await readAutomatedExecutions(root);
  const execution = executions.find((candidate) => candidate.executionId === executionId);
  if (!execution?.rawReportPath) return null;
  const reportPath = resolveEvidencePath(evidencePath(root, execution.rawReportPath), root);
  if (basename(reportPath) !== `${executionId}.json`) {
    throw new Error('Execution report identity does not match its immutable execution id.');
  }
  return JSON.parse(await readFile(reportPath, 'utf8')) as unknown;
}
