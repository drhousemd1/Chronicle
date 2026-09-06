import { describe, expect, it } from "vitest";

import { queryCanonicalRepositoryGraphHistory } from "../../../scripts/chronicle-repository-graph/historian";
import { runRepositoryGraphHistoryCommand } from "../../../scripts/chronicle-repository-graph/history-cli";

import type {
  AcceptedCloseoutChangelogRecord,
  ChangelogRecordRegistry,
  CorrectionChangelogRecord,
  LegacyImportChangelogRecord,
} from "./changelog-record-contract";
import {
  deriveRepositoryGraphHistory,
  searchRepositoryGraphHistory,
} from "./repository-graph-historian";

const accepted: AcceptedCloseoutChangelogRecord = {
  kind: "changelog",
  variant: "accepted_closeout",
  id: "CG-CHANGE-001",
  title: "Gallery retry accepted",
  changeDate: "2026-08-09",
  outcome: "The retry distinguishes a failed request from an empty Gallery.",
  provenance: "accepted-closeout",
  affectedCapabilities: ["community-gallery"],
  sourcePath: "docs/architecture-knowledge/changelog/entries/CG-CHANGE-001.md",
  body: "Accepted body",
  rawSource: "Accepted source",
  problem: "A failed request looked like an empty Gallery.",
  whyChangeWasNeeded: "People needed a visible recovery action.",
  changes: "The Gallery now displays a retry state.",
  acceptedEvidenceSummary: "Focused regression checks and human review passed.",
  acceptedEvidenceLimits: "The review did not inspect unrelated Gallery actions.",
  owningCapability: "community-gallery",
  acceptedOn: "2026-08-09",
  acceptedBy: "Chronicle owner",
  acceptanceRef: "CG-EV-007",
  sourceRevision: `sha256:${"a".repeat(64)}`,
  archivedProjectId: "CG-WORK-001",
  archiveRecord: "docs/current-work/archive/community-gallery/CG-WORK-001.md",
  archiveRoute: "/style-guide/chronicle-knowledge-base/archive/CG-WORK-001",
  resolvedIssueIds: ["CG-ISSUE-001"],
  remainingIssueIds: [],
};

const legacyRoot: LegacyImportChangelogRecord = {
  kind: "changelog",
  variant: "legacy_import",
  id: "LEGACY-QH-cl-001",
  title: "Original Quality Hub title",
  changeDate: "2026-06-20",
  outcome: "Original historical outcome",
  provenance: "historical-quality-hub",
  affectedCapabilities: ["community-gallery", "my-stories"],
  sourcePath: "docs/architecture-knowledge/changelog/entries/LEGACY-QH-cl-001.md",
  body: "Legacy body",
  rawSource: "Legacy source",
  legacySourceId: "cl-001",
  originalRecord: {
    id: "cl-001",
    title: "Original Quality Hub title",
    summary: "Original historical outcome",
    severity: "fix",
    status: "completed",
    problem: "The old card showed stale publication data.",
    plan: "Refresh the publication map after the mutation.",
    changes: "The historical implementation refreshed the map.",
    filesAffected: ["/src/components/chronicle/StoryHub.tsx", "$HOME/private-note.md"],
    agent: "Historical agent",
    relatedFindingIds: [],
    relatedRunIds: [],
    tags: ["gallery"],
    comments: [],
    createdAt: "2026-06-19T12:00:00.000Z",
    updatedAt: "2026-06-20T12:00:00.000Z",
  },
  sourceHash: "b".repeat(64),
  privacyRedactions: [{ field: "filesAffected[1]", transformation: "home-directory-prefix-to-$HOME" }],
  migrationSnapshotHash: "c".repeat(64),
  importedOn: "2026-08-04",
  sourceLineage: ["repository-seed"],
  migrationReceipt: "docs/architecture-knowledge/changelog/migration-receipt.md",
  applicabilityEvidence: "Reviewed for Community Gallery.",
  applicabilityStatus: "capability-reviewed",
  galleryApplicability: "applicable",
  provenanceLimit: "post_incident_union_original_170_membership_unknown",
  modernAcceptance: "not_assessed",
  proofStatus: "not_reverified",
};

const correction: CorrectionChangelogRecord = {
  kind: "changelog",
  variant: "correction",
  id: "LEGACY-QH-cl-001-COR-001",
  title: "Corrected Quality Hub title",
  changeDate: "2026-08-01",
  outcome: "Original historical outcome",
  provenance: "correction",
  affectedCapabilities: ["community-gallery", "my-stories"],
  sourcePath: "docs/architecture-knowledge/changelog/entries/LEGACY-QH-cl-001-COR-001.md",
  body: "Correction body",
  rawSource: "Correction source",
  targetChangeId: legacyRoot.id,
  correctionSequence: 1,
  correctedOn: "2026-08-01",
  correctionAuthority: "Chronicle owner",
  correctionReason: "The historical title needed clarification.",
  sourceRevision: `sha256:${"d".repeat(64)}`,
  clarifiedFields: { title: "Corrected Quality Hub title" },
};

const secondLegacyCorrection: CorrectionChangelogRecord = {
  ...correction,
  id: "LEGACY-QH-cl-001-COR-002",
  changeDate: "2026-08-02",
  correctionSequence: 2,
  correctedOn: "2026-08-02",
  correctionAuthority: "Chronicle migration reviewer",
  correctionReason: "The historical outcome needed a narrower description.",
  sourceRevision: `sha256:${"e".repeat(64)}`,
  clarifiedFields: { outcome: "Historical outcome clarified" },
};

const acceptedCorrection: CorrectionChangelogRecord = {
  kind: "changelog",
  variant: "correction",
  id: "CG-CHANGE-001-COR-001",
  title: accepted.title,
  changeDate: "2026-08-10",
  outcome: accepted.outcome,
  provenance: "correction",
  affectedCapabilities: accepted.affectedCapabilities,
  sourcePath: "docs/architecture-knowledge/changelog/entries/CG-CHANGE-001-COR-001.md",
  body: "Accepted correction body",
  rawSource: "Accepted correction source",
  targetChangeId: accepted.id,
  correctionSequence: 1,
  correctedOn: "2026-08-10",
  correctionAuthority: "Chronicle owner",
  correctionReason: "The implementation description needed clarification.",
  sourceRevision: `sha256:${"f".repeat(64)}`,
  clarifiedFields: { changes: "The Gallery displays a retry state while preserving the current query." },
};

const correctedLegacy: LegacyImportChangelogRecord = {
  ...legacyRoot,
  title: "Corrected Quality Hub title",
  outcome: "Historical outcome clarified",
};

const correctedAccepted: AcceptedCloseoutChangelogRecord = {
  ...accepted,
  changes: "The Gallery displays a retry state while preserving the current query.",
};

const registry: ChangelogRecordRegistry = {
  records: [accepted, legacyRoot, correction, secondLegacyCorrection, acceptedCorrection],
  roots: [accepted, legacyRoot],
  corrections: [correction, secondLegacyCorrection, acceptedCorrection],
  effectiveEntries: [
    {
      id: legacyRoot.id,
      variant: "legacy_import",
      title: correctedLegacy.title,
      changeDate: secondLegacyCorrection.changeDate,
      outcome: correctedLegacy.outcome,
      provenance: "correction",
      affectedCapabilities: correctedLegacy.affectedCapabilities,
      sourcePath: legacyRoot.sourcePath,
      body: legacyRoot.body,
      rootRecord: legacyRoot,
      effectiveRecord: correctedLegacy,
      appliedCorrections: [correction, secondLegacyCorrection],
    },
    {
      id: accepted.id,
      variant: "accepted_closeout",
      title: accepted.title,
      changeDate: acceptedCorrection.changeDate,
      outcome: accepted.outcome,
      provenance: "correction",
      affectedCapabilities: accepted.affectedCapabilities,
      sourcePath: accepted.sourcePath,
      body: accepted.body,
      rootRecord: accepted,
      effectiveRecord: correctedAccepted,
      appliedCorrections: [acceptedCorrection],
    },
  ],
};

describe("repository graph Changelog historian", () => {
  it("preserves accepted, legacy, and append-only correction meaning", () => {
    const entries = deriveRepositoryGraphHistory(registry, "community-gallery");
    expect(entries.map((entry) => entry.id)).toEqual([accepted.id, legacyRoot.id]);
    expect(entries[1]).toMatchObject({
      dateLabel: "Corrected",
      originalDate: "2026-06-20",
      recordType: "Historical Quality Hub record",
      problem: "The old card showed stale publication data.",
      evidenceLimits: expect.stringContaining("not reverified"),
      correctionIds: [correction.id, secondLegacyCorrection.id],
      corrections: [
        expect.objectContaining({ authority: "Chronicle owner", reason: correction.correctionReason }),
        expect.objectContaining({ authority: "Chronicle migration reviewer", reason: secondLegacyCorrection.correctionReason }),
      ],
      recordedSourcePaths: ["/src/components/chronicle/StoryHub.tsx", "$HOME/private-note.md"],
      repositorySourcePaths: ["src/components/chronicle/StoryHub.tsx"],
      legacySourceLineage: ["repository-seed"],
      legacyProvenanceLimit: "post_incident_union_original_170_membership_unknown",
      modernAcceptance: "not_assessed",
      proofStatus: "not_reverified",
    });
    expect(entries[0]).toMatchObject({
      dateLabel: "Corrected",
      recordType: "Accepted Chronicle change",
      resolvedIssueIds: ["CG-ISSUE-001"],
      evidenceSummary: accepted.acceptedEvidenceSummary,
      evidenceLimits: accepted.acceptedEvidenceLimits,
      acceptedBy: "Chronicle owner",
      acceptanceReference: "CG-EV-007",
      sourceRevision: accepted.sourceRevision,
      correctionIds: [acceptedCorrection.id],
      corrections: [expect.objectContaining({ reason: acceptedCorrection.correctionReason })],
    });
  });

  it("filters by canonical capability and searches recorded reasons and source paths", () => {
    expect(deriveRepositoryGraphHistory(registry, "character-library")).toEqual([]);
    const entries = deriveRepositoryGraphHistory(registry, "my-stories");
    expect(searchRepositoryGraphHistory(entries, "StoryHub.tsx").map((entry) => entry.id)).toEqual([legacyRoot.id]);
    expect(searchRepositoryGraphHistory(entries, "stale publication").map((entry) => entry.id)).toEqual([legacyRoot.id]);
    expect(searchRepositoryGraphHistory(deriveRepositoryGraphHistory(registry), "CG-ISSUE-001").map((entry) => entry.id)).toEqual([accepted.id]);
    expect(searchRepositoryGraphHistory(deriveRepositoryGraphHistory(registry), accepted.sourcePath).map((entry) => entry.id)).toEqual([accepted.id]);
    expect(searchRepositoryGraphHistory(entries, "Chronicle migration reviewer").map((entry) => entry.id)).toEqual([legacyRoot.id]);
    expect(searchRepositoryGraphHistory(entries, "not present")).toEqual([]);
  });

  it("keeps CLI history queries bounded and finds canonical record and recorded repository paths", async () => {
    const entries = deriveRepositoryGraphHistory(registry);
    expect(queryCanonicalRepositoryGraphHistory(entries, { sourcePath: accepted.sourcePath }).map((entry) => entry.id)).toEqual([accepted.id]);
    expect(queryCanonicalRepositoryGraphHistory(entries, { sourcePath: "StoryHub.tsx" }).map((entry) => entry.id)).toEqual([legacyRoot.id]);
    expect(queryCanonicalRepositoryGraphHistory(entries, { literal: "Gallery", limit: 1 })).toHaveLength(1);
    await expect(runRepositoryGraphHistoryCommand("/not/read", [])).rejects.toThrow(/requires a capability, source path, or literal search/);
    await expect(runRepositoryGraphHistoryCommand("/not/read", ["--capability", "not-a-capability"])).rejects.toThrow(/unknown Chronicle capability/);
  });
});
