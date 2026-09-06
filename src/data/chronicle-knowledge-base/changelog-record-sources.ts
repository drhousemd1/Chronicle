import {
  selectChangelogEntriesFromRegistry,
  validateChangelogRecordSources,
  type ChangelogRecordRegistry,
  type ChangelogSourceMap,
} from "./changelog-record-contract";
import type { ChronicleCapabilityId } from "./capability-ids";
import { getKnowledgeCheckDate } from "./knowledge-check-date";

const changelogModules = import.meta.glob(
  "../../../docs/architecture-knowledge/changelog/entries/*.md",
  { eager: true, query: "?raw", import: "default" },
);

export const CHRONICLE_CHANGELOG_RECORDS_CHECKED_ON = getKnowledgeCheckDate();

export type ChangelogRegistryReadyResult = Readonly<{
  status: "ready";
  registry: ChangelogRecordRegistry;
}>;

export type ChangelogRegistryLoadResult =
  | ChangelogRegistryReadyResult
  | Readonly<{
      status: "error";
      errors: readonly string[];
    }>;

export type ChangelogRegistryLoader = () => Promise<ChangelogRegistryLoadResult>;

function canonicalSourcePath(modulePath: string) {
  const docsIndex = modulePath.indexOf("docs/");
  if (docsIndex < 0) {
    throw new Error(`Changelog record is outside the docs source tree: ${modulePath}`);
  }
  return modulePath.slice(docsIndex);
}

function collectRawSources(modules: Record<string, unknown>): ChangelogSourceMap {
  return Object.freeze(
    Object.fromEntries(
      Object.entries(modules).map(([modulePath, source]) => {
        if (typeof source !== "string") {
          throw new Error(`Changelog record did not load as Markdown: ${modulePath}`);
        }
        return [canonicalSourcePath(modulePath), source];
      }),
    ),
  );
}

export const chronicleChangelogRecordSources = collectRawSources(changelogModules);

export function readChangelogRegistrySources(
  sources: ChangelogSourceMap,
  asOf = CHRONICLE_CHANGELOG_RECORDS_CHECKED_ON,
): ChangelogRegistryLoadResult {
  const result = validateChangelogRecordSources(sources, { asOf });
  if (!result.ok) {
    return Object.freeze({
      status: "error" as const,
      errors: Object.freeze([...result.errors]),
    });
  }
  return Object.freeze({
    status: "ready" as const,
    registry: result.registry,
  });
}

export function readCanonicalChangelogRegistryModules(
  modules: Record<string, unknown>,
): ChangelogRegistryLoadResult {
  try {
    const sources = collectRawSources(modules);
    if (Object.keys(sources).length === 0) {
      return Object.freeze({
        status: "error" as const,
        errors: Object.freeze([
          "No canonical repository Changelog records were discovered. This is a source-loading failure, not an empty history.",
        ]),
      });
    }
    return readChangelogRegistrySources(sources);
  } catch (error) {
    return Object.freeze({
      status: "error" as const,
      errors: Object.freeze([
        error instanceof Error
          ? error.message
          : "The repository Changelog could not be loaded.",
      ]),
    });
  }
}

function readCanonicalChangelogRegistry(): ChangelogRegistryLoadResult {
  return readCanonicalChangelogRegistryModules(changelogModules);
}

let canonicalRegistryPromise: Promise<ChangelogRegistryLoadResult> | null = null;

export const loadChronicleChangelogRegistry: ChangelogRegistryLoader = () => {
  canonicalRegistryPromise ??= Promise.resolve().then(readCanonicalChangelogRegistry);
  return canonicalRegistryPromise;
};

export function selectLoadedChangelogEntries(
  result: ChangelogRegistryReadyResult,
  capability?: ChronicleCapabilityId,
) {
  return selectChangelogEntriesFromRegistry(result.registry, capability);
}
