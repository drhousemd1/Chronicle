import { resolve } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import { resolveEvidencePath } from './ledger-file';
import { getRoleplayValidationGate } from './roleplay-gates';
import {
  buildCommandSpawnSpec,
  parseValidationGateCliArgs,
  runPredefinedCommandGate,
  scheduleValidationProcessTimeout,
} from './runner';

describe('restricted validation gate runner', () => {
  it('accepts exactly one predefined gate id argument', () => {
    expect(parseValidationGateCliArgs(['--gate', 'issue-26-recent-history-expected-red']))
      .toBe('issue-26-recent-history-expected-red');
    expect(() => parseValidationGateCliArgs(['--gate', 'gate', '--', 'rm', '-rf']))
      .toThrow('Usage: npm run validation:gate');
    expect(() => parseValidationGateCliArgs(['--command', 'npm test']))
      .toThrow('Usage: npm run validation:gate');
  });

  it('rejects unknown, manual, and fixture gates from the command runner', async () => {
    await expect(runPredefinedCommandGate('unknown-gate', resolve('.'))).rejects.toThrow('Unknown validation gate');
    await expect(runPredefinedCommandGate('issue-24-admin-export-manual-review', resolve('.'))).rejects.toThrow('not a command gate');
    await expect(runPredefinedCommandGate('issue-01-contract-unit-tests', resolve('.'))).rejects.toThrow('not a command gate');
  });

  it('rejects report path traversal before filesystem access', () => {
    expect(() => resolveEvidencePath('.validation-evidence/roleplay-pipeline/reports/../../../private.json'))
      .toThrow('escapes the allowed evidence root');
  });

  it('uses the current Node executable and excludes executable-injection environment variables', () => {
    const gate = getRoleplayValidationGate('issue-26-recent-history-expected-red');
    if (!gate || gate.runner.kind !== 'command') throw new Error('Missing command gate.');
    const runner = gate.runner;

    const spec = buildCommandSpawnSpec(runner, resolve('.'));

    expect(spec.executable).toBe(process.execPath);
    expect(resolve(spec.cwd)).toBe(resolve('.'));
    expect(spec.args).toEqual(runner.args);
    expect(spec.env).not.toHaveProperty('PATH');
    expect(spec.env).not.toHaveProperty('NODE_OPTIONS');
    expect(() => buildCommandSpawnSpec(runner, '.')).toThrow('repository root must be absolute');
  });

  it('forces a timed-out child process to stop if it ignores SIGTERM', async () => {
    vi.useFakeTimers();
    try {
      const kill = vi.fn(() => true);
      const onTimeout = vi.fn();
      const clear = scheduleValidationProcessTimeout({ kill }, 1_000, onTimeout);

      await vi.advanceTimersByTimeAsync(1_000);
      expect(onTimeout).toHaveBeenCalledTimes(1);
      expect(kill).toHaveBeenCalledWith('SIGTERM');

      await vi.advanceTimersByTimeAsync(5_000);
      expect(kill).toHaveBeenCalledWith('SIGKILL');
      clear();
    } finally {
      vi.useRealTimers();
    }
  });
});
