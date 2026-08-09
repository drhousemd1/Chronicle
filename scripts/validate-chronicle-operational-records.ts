import { execFileSync } from "node:child_process";
import process from "node:process";

import {
  assertActiveKnowledgeCertificationContext,
  assertNoUnfinishedKnowledgeTransaction,
} from "./knowledge-record-transaction-guard.mjs";

assertActiveKnowledgeCertificationContext({
  repoRoot: process.cwd(),
  expectedCommand: "knowledge-operational-check",
});
assertNoUnfinishedKnowledgeTransaction({ repoRoot: process.cwd() });

const { validateOperationalRecordSources } = await import(
  "../src/data/chronicle-knowledge-base/operational-record-contract"
);
const {
  inventoryToOperationalSourceMap,
  readCanonicalSourceInventory,
} = await import("./knowledge-records/source-set");

const SOURCE_DIRECTORIES = [
  "docs/architecture-knowledge/issues/community-gallery",
  "docs/current-work/active/community-gallery",
  "docs/current-work/archive/community-gallery",
  "docs/architecture-knowledge/changelog/entries",
] as const;

async function readCurrentSources() {
  return inventoryToOperationalSourceMap(
    await readCanonicalSourceInventory(process.cwd()),
  );
}

function readBaselineSources() {
  const sources: Record<string, string> = {};
  let trackedPaths: string[] = [];

  try {
    trackedPaths = execFileSync(
      "git",
      ["ls-tree", "-r", "--name-only", "HEAD", "--", ...SOURCE_DIRECTORIES],
      { encoding: "utf8" },
    )
      .split(/\r?\n/)
      .filter((sourcePath) => sourcePath.endsWith(".md"));
  } catch {
    return sources;
  }

  for (const sourcePath of trackedPaths) {
    sources[sourcePath] = execFileSync("git", ["show", `HEAD:${sourcePath}`], {
      encoding: "utf8",
    });
  }

  return sources;
}

function requestedAsOf() {
  const argument = process.argv.find((value) => value.startsWith("--as-of="));
  return argument?.slice("--as-of=".length) ?? new Date().toISOString().slice(0, 10);
}

const currentSources = await readCurrentSources();
const baselineSources = readBaselineSources();
const result = validateOperationalRecordSources(currentSources, {
  asOf: requestedAsOf(),
  baselineSources,
});

if (!result.ok) {
  console.error("Chronicle operational-record validation failed:");
  result.errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(
  [
    "Chronicle operational-record validation passed:",
    `${result.registry.issues.length} Issues`,
    `${result.registry.activeProjects.length} active projects`,
    `${result.registry.archivedProjects.length} archived projects`,
    `${result.registry.changelogEntries.length} Changelog entries`,
  ].join(" "),
);
