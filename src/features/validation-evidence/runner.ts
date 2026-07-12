import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import { isAbsolute, resolve } from 'node:path';

import type { AutomatedExecutionRecord, AutomatedExecutionResult } from './ledger';
import {
  appendAutomatedExecution,
  buildValidationEvidenceLedgerSnapshot,
  writeRawReport,
} from './ledger-file';
import { getRoleplayValidationGate, type CommandGateRunner } from './roleplay-gates';
import { readValidationSourceIdentity } from './source-identity';

const MAX_CAPTURED_OUTPUT = 1_000_000;
const FORCE_KILL_GRACE_MS = 5_000;
const ANSI_PATTERN = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g');
const SECRET_ASSIGNMENT_PATTERN = /\b([A-Z0-9_]*(?:KEY|TOKEN|SECRET|PASSWORD)[A-Z0-9_]*)=([^\s]+)/gi;

function createExecutionId(gateId: string, executedAt: string) {
  return `${executedAt.replace(/[^0-9]/g, '')}-${gateId}-${randomUUID()}`;
}

function sanitizeOutput(value: string) {
  return value
    .replace(ANSI_PATTERN, '')
    .replace(SECRET_ASSIGNMENT_PATTERN, '$1=[redacted]')
    .slice(0, MAX_CAPTURED_OUTPUT);
}

function quoteCommandPart(value: string) {
  return /^[a-zA-Z0-9_./:@=-]+$/.test(value) ? value : JSON.stringify(value);
}

function formatCommand(runner: CommandGateRunner) {
  return [runner.executable, ...runner.args].map(quoteCommandPart).join(' ');
}

function allowedEnvironment(keys: readonly string[]) {
  return Object.fromEntries(keys.flatMap((key) => {
    const value = process.env[key];
    return value === undefined ? [] : [[key, value]];
  }));
}

export function buildCommandSpawnSpec(runner: CommandGateRunner, repositoryRoot: string) {
  if (!isAbsolute(repositoryRoot)) throw new Error('Validation repository root must be absolute.');
  return {
    executable: process.execPath,
    args: [...runner.args],
    cwd: resolve(repositoryRoot),
    env: allowedEnvironment(runner.environmentAllowlist),
  };
}

export function scheduleValidationProcessTimeout(
  child: Pick<ChildProcess, 'kill'>,
  timeoutMs: number,
  onTimeout: () => void,
) {
  let forceKillTimer: ReturnType<typeof setTimeout> | null = null;
  const terminateTimer = setTimeout(() => {
    onTimeout();
    child.kill('SIGTERM');
    forceKillTimer = setTimeout(() => {
      child.kill('SIGKILL');
    }, FORCE_KILL_GRACE_MS);
  }, timeoutMs);

  return () => {
    clearTimeout(terminateTimer);
    if (forceKillTimer) clearTimeout(forceKillTimer);
  };
}

export function parseValidationGateCliArgs(args: string[]) {
  if (args.length !== 2 || args[0] !== '--gate' || !args[1]) {
    throw new Error('Usage: npm run validation:gate -- --gate <predefined-gate-id>');
  }
  return args[1];
}

export type RecordFixtureExecutionInput = {
  gateId: string;
  result: AutomatedExecutionResult;
  failureCause: string;
  report: unknown;
  exactCommand: string;
  durationMs: number;
  evidenceRoot?: string;
  repositoryRoot?: string;
};

export async function recordFixtureExecution(input: RecordFixtureExecutionInput) {
  const gate = getRoleplayValidationGate(input.gateId);
  if (!gate || gate.lifecycle !== 'active' || gate.runner.kind !== 'fixture') {
    throw new Error(`Active fixture gate is not defined: ${input.gateId}`);
  }
  const executedAt = new Date().toISOString();
  const sourceIdentity = await readValidationSourceIdentity(input.repositoryRoot);
  const executionId = createExecutionId(gate.gateId, executedAt);
  const rawReportPath = await writeRawReport(executionId, input.report, input.evidenceRoot);
  const record: AutomatedExecutionRecord = {
    schemaVersion: 1,
    executionId,
    gateId: gate.gateId,
    result: input.result,
    processExitCode: input.result === 'error' ? null : input.result === 'pass' ? 0 : 1,
    failureCause: input.failureCause,
    exactCommand: input.exactCommand,
    fixtureId: gate.runner.fixtureId,
    executedAt,
    sourceRevision: sourceIdentity.revision,
    sourceState: sourceIdentity.state,
    durationMs: input.durationMs,
    rawReportPath,
    legacy: false,
  };
  await appendAutomatedExecution(record, input.evidenceRoot);
  await buildValidationEvidenceLedgerSnapshot(sourceIdentity, input.evidenceRoot);
  return record;
}

export async function runPredefinedCommandGate(gateId: string, repositoryRoot: string) {
  const gate = getRoleplayValidationGate(gateId);
  if (!gate) throw new Error(`Unknown validation gate: ${gateId}`);
  if (gate.lifecycle !== 'active') throw new Error(`Validation gate is not active: ${gateId}`);
  if (gate.runner.kind !== 'command') throw new Error(`Validation gate is not a command gate: ${gateId}`);

  const runner = gate.runner;
  const exactCommand = formatCommand(runner);
  const spawnSpec = buildCommandSpawnSpec(runner, repositoryRoot);
  const evidenceRoot = resolve(repositoryRoot, '.validation-evidence/roleplay-pipeline');
  const sourceIdentity = await readValidationSourceIdentity(repositoryRoot);
  const executedAt = new Date().toISOString();
  const executionId = createExecutionId(gate.gateId, executedAt);
  const startedAt = Date.now();

  const outcome = await new Promise<{
    result: AutomatedExecutionResult;
    exitCode: number | null;
    signal: NodeJS.Signals | null;
    stdout: string;
    stderr: string;
    failureCause: string;
  }>((resolveOutcome) => {
    const child = spawn(spawnSpec.executable, spawnSpec.args, {
      cwd: spawnSpec.cwd,
      env: spawnSpec.env,
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    const clearTerminationTimers = scheduleValidationProcessTimeout(child, runner.timeoutMs, () => {
      timedOut = true;
    });

    child.stdout.on('data', (chunk) => {
      if (stdout.length < MAX_CAPTURED_OUTPUT) stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      if (stderr.length < MAX_CAPTURED_OUTPUT) stderr += chunk.toString();
    });
    child.on('error', (error) => {
      clearTerminationTimers();
      resolveOutcome({
        result: 'error',
        exitCode: null,
        signal: null,
        stdout,
        stderr,
        failureCause: `Runner error: ${error.message}`,
      });
    });
    child.on('close', (exitCode, signal) => {
      clearTerminationTimers();
      if (timedOut) {
        resolveOutcome({ result: 'error', exitCode, signal, stdout, stderr, failureCause: `Command timed out after ${runner.timeoutMs}ms.` });
      } else {
        resolveOutcome({
          result: exitCode === 0 ? 'pass' : 'fail',
          exitCode,
          signal,
          stdout,
          stderr,
          failureCause: exitCode === 0 ? '' : `Command exited with code ${exitCode ?? 'unknown'}.`,
        });
      }
    });
  });

  const report = {
    gateId: gate.gateId,
    exactCommand,
    executedAt,
    durationMs: Date.now() - startedAt,
    processExitCode: outcome.exitCode,
    signal: outcome.signal,
    stdout: sanitizeOutput(outcome.stdout),
    stderr: sanitizeOutput(outcome.stderr),
  };
  const rawReportPath = await writeRawReport(executionId, report, evidenceRoot);
  const record: AutomatedExecutionRecord = {
    schemaVersion: 1,
    executionId,
    gateId: gate.gateId,
    result: outcome.result,
    processExitCode: outcome.exitCode,
    failureCause: outcome.failureCause,
    exactCommand,
    fixtureId: null,
    executedAt,
    sourceRevision: sourceIdentity.revision,
    sourceState: sourceIdentity.state,
    durationMs: Date.now() - startedAt,
    rawReportPath,
    legacy: false,
  };
  await appendAutomatedExecution(record, evidenceRoot);
  await buildValidationEvidenceLedgerSnapshot(sourceIdentity, evidenceRoot);
  return record;
}
