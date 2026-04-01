#!/usr/bin/env node
import { spawn } from "node:child_process";

const checks = [
  { id: "lint", label: "Lint", cmd: "npm", args: ["run", "lint"] },
  { id: "types", label: "Type Check", cmd: "npx", args: ["tsc", "--noEmit"] },
  { id: "tests", label: "Unit Tests", cmd: "npm", args: ["run", "test"] },
  { id: "build", label: "Build", cmd: "npm", args: ["run", "build"] },
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
