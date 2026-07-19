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

const { runRoleplayBatch1Validation } = await import('../src/features/chat-runtime/roleplay-batch1-validation.ts');

const run = await runRoleplayBatch1Validation();

console.log(`Roleplay Batch 1 validation evidence written: ${run.summary.passed}/${run.summary.total} passing rows.`);

if (run.summary.failed > 0) {
  process.exitCode = 1;
}
