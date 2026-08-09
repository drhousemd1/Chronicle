import {
  buildOperationalRecordRegistry,
  type OperationalRecordSourceMap,
} from "./operational-record-contract";
import {
  chronicleChangelogRecordSources,
} from "./changelog-record-sources";

const issueModules = import.meta.glob(
  "../../../docs/architecture-knowledge/issues/community-gallery/*.md",
  { eager: true, query: "?raw", import: "default" },
);
const activeWorkModules = import.meta.glob(
  "../../../docs/current-work/active/community-gallery/*.md",
  { eager: true, query: "?raw", import: "default" },
);
const archivedWorkModules = import.meta.glob(
  "../../../docs/current-work/archive/community-gallery/*.md",
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

export const GALLERY_OPERATIONAL_RECORDS_CHECKED_ON =
  "2026-08-09";

export const galleryOperationalRecordSources: OperationalRecordSourceMap =
  Object.freeze({
    ...collectRawSources(issueModules),
    ...collectRawSources(activeWorkModules),
    ...collectRawSources(archivedWorkModules),
    ...chronicleChangelogRecordSources,
  });

export const galleryOperationalRecordRegistry =
  buildOperationalRecordRegistry(galleryOperationalRecordSources, {
    asOf: GALLERY_OPERATIONAL_RECORDS_CHECKED_ON,
  });
