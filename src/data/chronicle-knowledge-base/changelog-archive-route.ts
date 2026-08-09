import type { EffectiveChangelogEntry } from "./changelog-record-contract";
import type { OperationalRecordRegistry } from "./operational-record-contract";

export function resolveVerifiedChangelogArchiveRoute(
  entry: EffectiveChangelogEntry,
  registry: OperationalRecordRegistry,
): string | null {
  if (entry.effectiveRecord.variant !== "accepted_closeout") return null;

  const verifiedEntry = registry.changelogRegistry.effectiveEntries.find(
    (candidate) =>
      candidate.id === entry.id &&
      candidate.sourcePath === entry.sourcePath &&
      candidate.effectiveRecord.variant === "accepted_closeout",
  );
  if (!verifiedEntry || verifiedEntry.effectiveRecord.variant !== "accepted_closeout") {
    return null;
  }

  const requestedRecord = entry.effectiveRecord;
  const verifiedRecord = verifiedEntry.effectiveRecord;
  if (
    requestedRecord.archivedProjectId !== verifiedRecord.archivedProjectId ||
    requestedRecord.archiveRecord !== verifiedRecord.archiveRecord ||
    requestedRecord.archiveRoute !== verifiedRecord.archiveRoute
  ) {
    return null;
  }

  const reciprocalArchive = registry.archivedProjects.find(
    (project) =>
      project.id === verifiedRecord.archivedProjectId &&
      project.placement === "archive" &&
      project.workflowState === "Closed" &&
      project.sourcePath === verifiedRecord.archiveRecord &&
      project.closeout?.changelogIds.includes(verifiedEntry.id),
  );

  return reciprocalArchive ? verifiedRecord.archiveRoute : null;
}
