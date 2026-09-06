import {
  buildOperationalRecordRegistry,
  type OperationalRecordRegistry,
  type OperationalRecordSourceMap,
} from "./operational-record-contract";
import {
  chronicleChangelogRecordSources,
} from "./changelog-record-sources";
import { getKnowledgeCheckDate } from "./knowledge-check-date";
import type { OperationalCapabilityId } from "./operational-capability-registry";

const issueModules = import.meta.glob(
  "../../../docs/architecture-knowledge/issues/*/*.md",
  { eager: true, query: "?raw", import: "default" },
);
const activeWorkModules = import.meta.glob(
  "../../../docs/current-work/active/*/*.md",
  { eager: true, query: "?raw", import: "default" },
);
const archivedWorkModules = import.meta.glob(
  "../../../docs/current-work/archive/*/*.md",
  { eager: true, query: "?raw", import: "default" },
);
function canonicalSourcePath(modulePath: string) {
  const docsIndex = modulePath.indexOf("docs/");
  if (docsIndex < 0) {
    throw new Error(`Operational record is outside the docs source tree: ${modulePath}`);
  }
  return modulePath.slice(docsIndex);
}

function collectRawSources(
  modules: Record<string, unknown>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(modules).map(([modulePath, source]) => {
      if (typeof source !== "string") {
        throw new Error(`Operational record did not load as Markdown: ${modulePath}`);
      }
      return [canonicalSourcePath(modulePath), source];
    }),
  );
}

export const CHRONICLE_OPERATIONAL_RECORDS_CHECKED_ON = getKnowledgeCheckDate();

export const chronicleOperationalRecordSources: OperationalRecordSourceMap =
  Object.freeze({
    ...collectRawSources(issueModules),
    ...collectRawSources(activeWorkModules),
    ...collectRawSources(archivedWorkModules),
    ...chronicleChangelogRecordSources,
  });

export const chronicleOperationalRecordRegistry =
  buildOperationalRecordRegistry(chronicleOperationalRecordSources, {
    asOf: CHRONICLE_OPERATIONAL_RECORDS_CHECKED_ON,
  });

export function selectCapabilityOperationalRecordRegistry(
  registry: OperationalRecordRegistry,
  capabilityId: OperationalCapabilityId,
) {
  const issues = registry.issues.filter(
    (issue) => issue.ownerCapability === capabilityId,
  );
  const belongsToCapability = (project: (typeof registry.activeProjects)[number]) =>
    project.ownerCapability === capabilityId;

  return Object.freeze({
    ...registry,
    issues: Object.freeze(issues),
    activeProjects: Object.freeze(
      registry.activeProjects.filter(belongsToCapability),
    ),
    archivedProjects: Object.freeze(
      registry.archivedProjects.filter(belongsToCapability),
    ),
    openIssueCount: issues.filter((issue) => issue.status === "open").length,
  });
}

export function getCapabilityOperationalRecordRegistry(
  capabilityId: OperationalCapabilityId,
) {
  return selectCapabilityOperationalRecordRegistry(
    chronicleOperationalRecordRegistry,
    capabilityId,
  );
}

export const galleryOperationalRecordSources: OperationalRecordSourceMap =
  Object.freeze(
    Object.fromEntries(
      Object.entries(chronicleOperationalRecordSources).filter(
        ([sourcePath]) =>
          sourcePath.includes("/community-gallery/") ||
          sourcePath.includes("/changelog/"),
      ),
    ),
  );

export const galleryOperationalRecordRegistry =
  getCapabilityOperationalRecordRegistry("community-gallery");
