#!/usr/bin/env node

import { spawn } from "node:child_process";
import path from "node:path";

import {
  parseProductTestArguments,
  validateProductTestSelection,
  verifyProductTestSelection,
} from "./product-test-boundary";

const repositoryRoot = process.cwd();
const parsedArguments = parseProductTestArguments(process.argv.slice(2));
const selection = await validateProductTestSelection(
  repositoryRoot,
  parsedArguments.requestedPaths,
);
await verifyProductTestSelection(repositoryRoot, selection);
const vitestEntry = path.join(repositoryRoot, "node_modules/vitest/vitest.mjs");
const child = spawn(
  process.execPath,
  [
    vitestEntry,
    "run",
    "--config",
    "vitest.product.config.ts",
    ...parsedArguments.vitestArguments,
  ],
  {
    cwd: repositoryRoot,
    env: {
      ...process.env,
      CHRONICLE_PRODUCT_TEST_FILES: JSON.stringify(selection.selectedPaths),
    },
    shell: false,
    stdio: "inherit",
  },
);

child.once("error", (error) => {
  throw error;
});
child.once("exit", (exitCode, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exitCode = exitCode ?? 1;
});
