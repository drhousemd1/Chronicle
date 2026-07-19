import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

if (!('localStorage' in globalThis)) {
  const storage = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
      clear: () => storage.clear(),
    },
  });
}

const repositoryRoot = fileURLToPath(new URL('../', import.meta.url));
const evidenceRoot = resolve(repositoryRoot, '.validation-evidence/roleplay-pipeline');
const {
  parseValidationGateCliArgs,
  recordFixtureExecution,
} = await import('../src/features/validation-evidence/runner.ts');
const gateId = parseValidationGateCliArgs(process.argv.slice(2));
const { getRoleplayValidationGate } = await import('../src/features/validation-evidence/roleplay-gates.ts');
const gate = getRoleplayValidationGate(gateId);

if (!gate) throw new Error(`Unknown validation gate: ${gateId}`);
if (gate.lifecycle !== 'active') throw new Error(`Validation gate is not active: ${gateId}`);
if (gate.runner.kind === 'manual') throw new Error(`Manual gate must be recorded with validation:manual-review: ${gateId}`);

if (gate.runner.kind === 'fixture') {
  const recordExecution = (input: Parameters<typeof recordFixtureExecution>[0]) => recordFixtureExecution({
    ...input,
    evidenceRoot,
    repositoryRoot,
  });
  const run = gate.runner.batch === 'batch0'
    ? await (await import('../src/features/chat-runtime/roleplay-batch0-validation.ts')).runRoleplayBatch0Validation({ gateIds: [gateId], recordExecution })
    : await (await import('../src/features/chat-runtime/roleplay-batch1-validation.ts')).runRoleplayBatch1Validation({ gateIds: [gateId], recordExecution });
  console.log(`Validation fixture recorded for ${gateId}: ${run.summary.passed}/${run.summary.total} passing.`);
  if (run.summary.failed > 0) process.exitCode = 1;
} else {
  const { runPredefinedCommandGate } = await import('../src/features/validation-evidence/runner.ts');
  const execution = await runPredefinedCommandGate(gateId, repositoryRoot);
  console.log(`Validation command recorded for ${gateId}: ${execution.result}.`);
  process.exitCode = execution.processExitCode ?? (execution.result === 'error' ? 1 : 0);
}
