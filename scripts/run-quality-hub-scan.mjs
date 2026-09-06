#!/usr/bin/env node
import { spawn } from "node:child_process";

import {
  assertActiveKnowledgeCertificationContext,
  assertNoUnfinishedKnowledgeTransaction,
} from "./knowledge-record-transaction-guard.mjs";

const repoRoot = process.cwd();
assertActiveKnowledgeCertificationContext({
  repoRoot,
  expectedCommand: "quality-scan",
});
assertNoUnfinishedKnowledgeTransaction({ repoRoot });

const checks = [
  { id: "lint", label: "Lint", cmd: "npm", args: ["run", "lint"] },
  { id: "types", label: "Type Check", cmd: "npm", args: ["run", "typecheck"] },
  {
    id: "tests",
    label: "Unit Tests",
    cmd: process.execPath,
    args: ["node_modules/vitest/vitest.mjs", "run"],
  },
  {
    id: "build-preparation",
    label: "Build Preparation",
    cmd: process.execPath,
    args: ["scripts/generate-roleplay-artifact-identity.mjs"],
  },
  {
    id: "build",
    label: "Build",
    cmd: process.execPath,
    args: ["node_modules/vite/bin/vite.js", "build"],
  },
  { id: "audit", label: "Dependency Audit", cmd: "npm", args: ["audit", "--omit=dev"] },
];

function runCheck({ label, cmd, args }) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { stdio: "inherit", shell: false });
    child.on("close", (code) => resolve(code === 0));
    child.on("error", () => resolve(false));
  });
}

const startedAt = new Date();
const results = [];

for (const check of checks) {
  console.log(`\n[quality-scan] Running ${check.label}...`);
  const ok = await runCheck(check);
  results.push({ ...check, ok });
  console.log(`[quality-scan] ${check.label}: ${ok ? "PASS" : "FAIL"}`);
  if (!ok) {
    break;
  }
}

const failed = results.find((r) => !r.ok);
const finishedAt = new Date();
console.log("\n[quality-scan] Summary");
console.log(`[quality-scan] Started:  ${startedAt.toISOString()}`);
console.log(`[quality-scan] Finished: ${finishedAt.toISOString()}`);
for (const r of results) {
  console.log(`[quality-scan] - ${r.label}: ${r.ok ? "PASS" : "FAIL"}`);
}

if (failed) {
  console.error(`[quality-scan] Stopped after failure in: ${failed.label}`);
  process.exit(1);
}

console.log("[quality-scan] All checks passed.");
process.exit(0);
