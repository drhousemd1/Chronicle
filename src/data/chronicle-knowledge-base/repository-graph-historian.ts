import {
  isSafeRepositoryGraphPath,
} from "./repository-graph-contract";
import type {
  ChangelogRecordRegistry,
  EffectiveChangelogEntry,
} from "./changelog-record-contract";
import type { ChronicleCapabilityId } from "./capability-ids";

export type RepositoryGraphHistoryEntry = Readonly<{
  id: string;
  title: string;
  meaningfulDate: string;
  originalDate: string;
  dateLabel: "Accepted" | "Last updated in Quality Hub" | "Corrected";
  recordType: "Accepted Chronicle change" | "Accepted bounded update" | "Historical Quality Hub record";
  affectedCapabilities: readonly ChronicleCapabilityId[];
  problem: string | null;
  whyChangeWasNeeded: string | null;
  planRecordedAtTheTime: string | null;
  changes: string | null;
  outcome: string;
  evidenceSummary: string;
  evidenceLimits: string;
  recordedSourcePaths: readonly string[];
  repositorySourcePaths: readonly string[];
  resolvedIssueIds: readonly string[];
  remainingIssueIds: readonly string[];
  correctionIds: readonly string[];
  corrections: readonly Readonly<{
    id: string;
    correctedOn: string;
    authority: string;
    reason: string;
    sourceRevision: string;
  }>[];
  acceptedOn: string | null;
  acceptedBy: string | null;
  acceptanceReference: string | null;
  reviewMethod: string | null;
  sourceRevision: string | null;
  archivedProjectId: string | null;
  archiveRoute: string | null;
  legacySourceLineage: readonly string[];
  legacyMigrationReceipt: string | null;
  legacyProvenanceLimit: string | null;
  modernAcceptance: string | null;
  proofStatus: string | null;
  sourcePath: string;
}>;

function recordedRepositoryPath(value: string) {
  const trimmed = value.trim();
  const candidate = trimmed.startsWith("/") ? trimmed.slice(1) : trimmed;
  if (candidate.startsWith("$") || candidate.includes("$HOME")) return null;
  return isSafeRepositoryGraphPath(candidate) ? candidate : null;
}

function deriveHistoryEntry(entry: EffectiveChangelogEntry): RepositoryGraphHistoryEntry {
  const record = entry.effectiveRecord;
  const corrected = entry.appliedCorrections.length > 0;
  const common = {
    id: entry.id,
    title: entry.title,
    meaningfulDate: entry.changeDate,
    originalDate: entry.rootRecord.changeDate,
    affectedCapabilities: Object.freeze([...entry.affectedCapabilities]),
    outcome: entry.outcome,
    correctionIds: Object.freeze(entry.appliedCorrections.map((correction) => correction.id)),
    corrections: Object.freeze(entry.appliedCorrections.map((correction) => Object.freeze({
      id: correction.id,
      correctedOn: correction.correctedOn,
      authority: correction.correctionAuthority,
      reason: correction.correctionReason,
      sourceRevision: correction.sourceRevision,
    }))),
    sourcePath: entry.sourcePath,
  };

  if (record.variant === "accepted_closeout") {
    return Object.freeze({
      ...common,
      dateLabel: corrected ? "Corrected" as const : "Accepted" as const,
      recordType: "Accepted Chronicle change" as const,
      problem: record.problem,
      whyChangeWasNeeded: record.whyChangeWasNeeded,
      planRecordedAtTheTime: null,
      changes: record.changes,
      evidenceSummary: record.acceptedEvidenceSummary,
      evidenceLimits: record.acceptedEvidenceLimits,
      recordedSourcePaths: Object.freeze([]),
      repositorySourcePaths: Object.freeze([]),
      resolvedIssueIds: Object.freeze([...record.resolvedIssueIds]),
      remainingIssueIds: Object.freeze([...record.remainingIssueIds]),
      acceptedOn: record.acceptedOn,
      acceptedBy: record.acceptedBy,
      acceptanceReference: record.acceptanceRef,
      reviewMethod: null,
      sourceRevision: record.sourceRevision,
      archivedProjectId: record.archivedProjectId,
      archiveRoute: record.archiveRoute,
      legacySourceLineage: Object.freeze([]),
      legacyMigrationReceipt: null,
      legacyProvenanceLimit: null,
      modernAcceptance: null,
      proofStatus: null,
    });
  }

  if (record.variant === "accepted_update") {
    return Object.freeze({
      ...common,
      dateLabel: corrected ? "Corrected" as const : "Accepted" as const,
      recordType: "Accepted bounded update" as const,
      problem: null,
      whyChangeWasNeeded: record.whyChangeWasNeeded,
      planRecordedAtTheTime: null,
      changes: record.changes,
      evidenceSummary: record.acceptedEvidenceSummary,
      evidenceLimits: record.acceptedEvidenceLimits,
      recordedSourcePaths: Object.freeze([]),
      repositorySourcePaths: Object.freeze([]),
      resolvedIssueIds: Object.freeze([]),
      remainingIssueIds: Object.freeze([]),
      acceptedOn: record.acceptedOn,
      acceptedBy: record.acceptedBy,
      acceptanceReference: null,
      reviewMethod: record.reviewMethod,
      sourceRevision: record.sourceRevision,
      archivedProjectId: null,
      archiveRoute: null,
      legacySourceLineage: Object.freeze([]),
      legacyMigrationReceipt: null,
      legacyProvenanceLimit: null,
      modernAcceptance: null,
      proofStatus: null,
    });
  }

  const recordedSourcePaths = Object.freeze([...record.originalRecord.filesAffected]);
  const repositorySourcePaths = Object.freeze([
    ...new Set(recordedSourcePaths.map(recordedRepositoryPath).filter((value): value is string => value !== null)),
  ].sort());
  return Object.freeze({
    ...common,
    dateLabel: corrected ? "Corrected" as const : "Last updated in Quality Hub" as const,
    recordType: "Historical Quality Hub record" as const,
    problem: record.originalRecord.problem || null,
    whyChangeWasNeeded: null,
    planRecordedAtTheTime: record.originalRecord.plan || null,
    changes: record.originalRecord.changes || null,
    evidenceSummary: `Original Quality Hub status: ${record.originalRecord.status}.`,
    evidenceLimits: "This historical status was preserved as recorded. Modern acceptance was not assessed, and the historical proof was not reverified.",
    recordedSourcePaths,
    repositorySourcePaths,
    resolvedIssueIds: Object.freeze([]),
    remainingIssueIds: Object.freeze([]),
    acceptedOn: null,
    acceptedBy: null,
    acceptanceReference: null,
    reviewMethod: null,
    sourceRevision: null,
    archivedProjectId: null,
    archiveRoute: null,
    legacySourceLineage: Object.freeze([...record.sourceLineage]),
    legacyMigrationReceipt: record.migrationReceipt,
    legacyProvenanceLimit: record.provenanceLimit,
    modernAcceptance: record.modernAcceptance,
    proofStatus: record.proofStatus,
  });
}

export function deriveRepositoryGraphHistory(
  registry: ChangelogRecordRegistry,
  capability?: ChronicleCapabilityId,
) {
  return Object.freeze(
    registry.effectiveEntries
      .filter((entry) => capability === undefined || entry.affectedCapabilities.includes(capability))
      .map(deriveHistoryEntry)
      .sort((left, right) => right.meaningfulDate.localeCompare(left.meaningfulDate) || left.id.localeCompare(right.id)),
  );
}

export function searchRepositoryGraphHistory(
  entries: readonly RepositoryGraphHistoryEntry[],
  literal: string,
) {
  const query = literal.trim().toLocaleLowerCase();
  if (!query) return Object.freeze([...entries]);
  return Object.freeze(entries.filter((entry) => [
    entry.id,
    entry.title,
    entry.problem,
    entry.whyChangeWasNeeded,
    entry.planRecordedAtTheTime,
    entry.changes,
    entry.outcome,
    entry.evidenceSummary,
    entry.evidenceLimits,
    entry.sourcePath,
    entry.acceptedBy,
    entry.acceptanceReference,
    entry.reviewMethod,
    entry.sourceRevision,
    entry.archivedProjectId,
    entry.archiveRoute,
    entry.legacyMigrationReceipt,
    entry.legacyProvenanceLimit,
    entry.modernAcceptance,
    entry.proofStatus,
    ...entry.affectedCapabilities,
    ...entry.recordedSourcePaths,
    ...entry.repositorySourcePaths,
    ...entry.resolvedIssueIds,
    ...entry.remainingIssueIds,
    ...entry.legacySourceLineage,
    ...entry.correctionIds,
    ...entry.corrections.flatMap((correction) => [
      correction.id,
      correction.correctedOn,
      correction.authority,
      correction.reason,
      correction.sourceRevision,
    ]),
  ].some((value) => value?.toLocaleLowerCase().includes(query))));
}
