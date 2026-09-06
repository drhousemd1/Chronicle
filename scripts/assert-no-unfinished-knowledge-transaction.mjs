#!/usr/bin/env node

import { assertNoUnfinishedKnowledgeTransaction } from "./knowledge-record-transaction-guard.mjs";

const repoRoot = process.argv[2] ?? process.cwd();

try {
  const status = assertNoUnfinishedKnowledgeTransaction({ repoRoot });
  process.stdout.write(
    `Knowledge transaction guard passed: no global or scoped writer and no unfinished transactions in ${status.repositoryRoot}.\n`,
  );
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
