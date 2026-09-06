import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import {
  validateChangelogRecordSources,
  type ChangelogSourceMap,
} from "../../src/data/chronicle-knowledge-base/changelog-record-contract";
import type { ChronicleCapabilityId } from "../../src/data/chronicle-knowledge-base/capability-ids";
import {
  deriveRepositoryGraphHistory,
  searchRepositoryGraphHistory,
  type RepositoryGraphHistoryEntry,
} from "../../src/data/chronicle-knowledge-base/repository-graph-historian";

export type RepositoryGraphHistoryQuery = Readonly<{
  capability?: ChronicleCapabilityId;
  literal?: string;
  sourcePath?: string;
  limit?: number;
}>;

function currentDate() {
  return new Date().toISOString().slice(0, 10);
}

export async function loadCanonicalRepositoryGraphHistory(
  repositoryRoot: string,
  capability?: ChronicleCapabilityId,
) {
  const entriesRoot = path.join(repositoryRoot, "docs/architecture-knowledge/changelog/entries");
  const names = (await readdir(entriesRoot)).filter((name) => name.endsWith(".md")).sort();
  const sources = Object.fromEntries(await Promise.all(names.map(async (name) => {
    const sourcePath = `docs/architecture-knowledge/changelog/entries/${name}`;
    return [sourcePath, await readFile(path.join(entriesRoot, name), "utf8")];
  }))) as ChangelogSourceMap;
  const result = validateChangelogRecordSources(sources, { asOf: currentDate() });
  if (!result.ok) {
    throw new Error(`The canonical Chronicle Changelog did not validate:\n${result.errors.join("\n")}`);
  }
  return deriveRepositoryGraphHistory(result.registry, capability);
}

export function queryCanonicalRepositoryGraphHistory(
  entries: readonly RepositoryGraphHistoryEntry[],
  query: RepositoryGraphHistoryQuery,
) {
  const literalMatches = searchRepositoryGraphHistory(entries, query.literal ?? "");
  const sourceQuery = query.sourcePath?.trim().toLocaleLowerCase() ?? "";
  const sourceMatches = sourceQuery
    ? literalMatches.filter((entry) =>
        entry.sourcePath.toLocaleLowerCase().includes(sourceQuery) ||
        entry.repositorySourcePaths.some((sourcePath) => sourcePath.toLocaleLowerCase().includes(sourceQuery)),
      )
    : literalMatches;
  const limit = Math.min(Math.max(query.limit ?? 20, 1), 50);
  return Object.freeze(sourceMatches.slice(0, limit));
}
