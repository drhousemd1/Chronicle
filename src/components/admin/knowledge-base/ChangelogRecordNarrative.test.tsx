// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import type {
  AcceptedCloseoutChangelogRecord,
  CorrectionChangelogRecord,
  EffectiveChangelogEntry,
  LegacyImportChangelogRecord,
} from "@/data/chronicle-knowledge-base/changelog-record-contract";

import { ChangelogRecordNarrative } from "./ChangelogRecordNarrative";

function acceptedRecord(id = "CG-CHANGE-900"): AcceptedCloseoutChangelogRecord {
  return {
    kind: "changelog",
    variant: "accepted_closeout",
    id,
    title: "Accepted narrative fixture",
    changeDate: "2026-08-05",
    problem: "The accepted workflow previously omitted the problem statement.",
    whyChangeWasNeeded: "A reader could not understand why the accepted work mattered.",
    changes: "The accepted record now preserves its complete narrative.",
    outcome: "The complete narrative was accepted on the tested source revision.",
    acceptedEvidenceSummary: "Contract and browser evidence supported the accepted result.",
    acceptedEvidenceLimits: "The evidence did not establish deployment or unrelated runtime behavior.",
    provenance: "accepted-closeout",
    affectedCapabilities: ["community-gallery", "admin"],
    owningCapability: "community-gallery",
    acceptedOn: "2026-08-05",
    acceptedBy: "Chronicle owner",
    acceptanceRef: "CG-EV-900",
    sourceRevision: `sha256:${"a".repeat(64)}`,
    archivedProjectId: "CG-WORK-900",
    archiveRecord: "docs/current-work/archive/community-gallery/CG-WORK-900.md",
    archiveRoute: "/style-guide/chronicle-knowledge-base/archive/CG-WORK-900",
    resolvedIssueIds: ["CG-ISSUE-900"],
    remainingIssueIds: ["CG-ISSUE-901"],
    sourcePath: `docs/architecture-knowledge/changelog/entries/${id}.md`,
    body: "",
    rawSource: "",
  };
}

function acceptedEntry(): EffectiveChangelogEntry {
  const record = acceptedRecord();
  return {
    id: record.id,
    variant: record.variant,
    title: record.title,
    changeDate: record.changeDate,
    outcome: record.outcome,
    provenance: record.provenance,
    affectedCapabilities: record.affectedCapabilities,
    sourcePath: record.sourcePath,
    body: record.body,
    rootRecord: record,
    effectiveRecord: record,
    appliedCorrections: [],
  };
}

function correction(
  sequence: number,
  correctedOn: string,
  clarifiedFields: CorrectionChangelogRecord["clarifiedFields"],
): CorrectionChangelogRecord {
  return {
    kind: "changelog",
    variant: "correction",
    id: `CG-CORRECTION-90${sequence}`,
    title: `Accepted fixture correction ${sequence}`,
    changeDate: correctedOn,
    outcome: `Correction ${sequence} applied`,
    provenance: "correction",
    affectedCapabilities: ["community-gallery", "admin"],
    sourcePath: `docs/architecture-knowledge/changelog/entries/CG-CORRECTION-90${sequence}.md`,
    body: "",
    rawSource: "",
    targetChangeId: "CG-CHANGE-900",
    correctionSequence: sequence,
    correctedOn,
    correctionAuthority: `Correction authority ${sequence}`,
    correctionReason: `Correction reason ${sequence}`,
    sourceRevision: `sha256:${String(sequence).repeat(64)}`,
    clarifiedFields,
  };
}

function correctedEntry(): EffectiveChangelogEntry {
  const root = acceptedRecord();
  const first = correction(1, "2026-08-06", {
    problem: "The corrected problem statement is now authoritative.",
    acceptedEvidenceSummary: "The corrected evidence summary is now authoritative.",
  });
  const second = correction(2, "2026-08-07", {
    title: "The corrected accepted title is now authoritative.",
    changeDate: "2026-08-07",
    whyChangeWasNeeded: "The corrected rationale is now authoritative.",
    changes: "The corrected change description is now authoritative.",
    acceptedEvidenceLimits: "The corrected evidence limits remain intentionally narrow.",
    outcome: "The corrected accepted outcome is now authoritative.",
    affectedCapabilities: ["community-gallery", "admin", "my-stories"],
    acceptedOn: "2026-08-07",
    acceptedBy: "Corrected Chronicle reviewer",
    acceptanceRef: "CG-EV-902",
    sourceRevision: `sha256:${"e".repeat(64)}`,
    archivedProjectId: "CG-WORK-902",
    archiveRecord: "docs/current-work/archive/community-gallery/CG-WORK-902.md",
    archiveRoute: "/style-guide/chronicle-knowledge-base/archive/CG-WORK-902",
    resolvedIssueIds: ["CG-ISSUE-902"],
    remainingIssueIds: ["CG-ISSUE-903"],
  });
  const effective: AcceptedCloseoutChangelogRecord = {
    ...root,
    title: "The corrected accepted title is now authoritative.",
    changeDate: "2026-08-07",
    problem: "The corrected problem statement is now authoritative.",
    whyChangeWasNeeded: "The corrected rationale is now authoritative.",
    changes: "The corrected change description is now authoritative.",
    outcome: "The corrected accepted outcome is now authoritative.",
    acceptedEvidenceSummary: "The corrected evidence summary is now authoritative.",
    acceptedEvidenceLimits: "The corrected evidence limits remain intentionally narrow.",
    affectedCapabilities: ["community-gallery", "admin", "my-stories"],
    acceptedOn: "2026-08-07",
    acceptedBy: "Corrected Chronicle reviewer",
    acceptanceRef: "CG-EV-902",
    sourceRevision: `sha256:${"e".repeat(64)}`,
    archivedProjectId: "CG-WORK-902",
    archiveRecord: "docs/current-work/archive/community-gallery/CG-WORK-902.md",
    archiveRoute: "/style-guide/chronicle-knowledge-base/archive/CG-WORK-902",
    resolvedIssueIds: ["CG-ISSUE-902"],
    remainingIssueIds: ["CG-ISSUE-903"],
  };
  return {
    id: root.id,
    variant: root.variant,
    title: effective.title,
    changeDate: second.correctedOn,
    outcome: effective.outcome,
    provenance: "correction",
    affectedCapabilities: effective.affectedCapabilities,
    sourcePath: root.sourcePath,
    body: root.body,
    rootRecord: root,
    effectiveRecord: effective,
    appliedCorrections: [first, second],
  };
}

function legacyEntry(): EffectiveChangelogEntry {
  const record: LegacyImportChangelogRecord = {
    kind: "changelog",
    variant: "legacy_import",
    id: "LEGACY-QH-cl-900",
    title: "Historical narrative fixture",
    changeDate: "2026-07-31",
    outcome: "Historical summary",
    provenance: "historical-quality-hub",
    affectedCapabilities: ["community-gallery"],
    sourcePath: "docs/architecture-knowledge/changelog/entries/LEGACY-QH-cl-900.md",
    body: "",
    rawSource: "",
    legacySourceId: "cl-900",
    originalRecord: {
      id: "cl-900",
      title: "Historical narrative fixture",
      summary: "Historical summary",
      severity: "fix",
      status: "completed",
      problem: "Quality Hub recorded the historical problem and impact.",
      plan: "Quality Hub recorded this historical plan.",
      changes: "Quality Hub recorded these historical changes.",
      filesAffected: ["src/legacy-one.ts", "src/legacy-two.tsx"],
      agent: "Historical agent",
      relatedFindingIds: ["QH-FINDING-900"],
      relatedRunIds: ["QH-RUN-900"],
      tags: ["gallery", "history"],
      comments: [
        {
          id: "comment-900",
          author: "Historical reviewer",
          timestamp: "2026-07-31T14:00:00.000Z",
          text: "The historical reviewer recorded this comment.",
        },
      ],
      createdAt: "2026-07-30T10:00:00.000Z",
      updatedAt: "2026-07-31T12:00:00.000Z",
    },
    sourceHash: `sha256:${"b".repeat(64)}`,
    privacyRedactions: [],
    migrationSnapshotHash: `sha256:${"c".repeat(64)}`,
    importedOn: "2026-08-01",
    sourceLineage: ["repository-seed", "local-storage"],
    migrationReceipt: "docs/architecture-knowledge/changelog/migration-receipt.md",
    applicabilityEvidence: "The source explicitly named Community Gallery.",
    applicabilityStatus: "capability-reviewed",
    galleryApplicability: "applicable",
    provenanceLimit: "post_incident_union_original_170_membership_unknown",
    modernAcceptance: "not_assessed",
    proofStatus: "not_reverified",
  };
  return {
    id: record.id,
    variant: record.variant,
    title: record.title,
    changeDate: record.changeDate,
    outcome: record.outcome,
    provenance: record.provenance,
    affectedCapabilities: record.affectedCapabilities,
    sourcePath: record.sourcePath,
    body: record.body,
    rootRecord: record,
    effectiveRecord: record,
    appliedCorrections: [],
  };
}

function correctedLegacyEntry(): EffectiveChangelogEntry {
  const entry = legacyEntry();
  if (entry.rootRecord.variant !== "legacy_import") {
    throw new Error("Legacy fixture root was not legacy_import");
  }
  const root = entry.rootRecord;
  const correctedOriginalRecord = {
    ...root.originalRecord,
    title: "Corrected historical title",
    summary: "Corrected historical summary",
    problem: "Corrected historical problem and impact.",
    plan: "Corrected historical plan.",
    changes: "Corrected historical changes.",
    updatedAt: "2026-08-01T12:00:00.000Z",
  };
  const clarifiedFields: CorrectionChangelogRecord["clarifiedFields"] = {
    title: correctedOriginalRecord.title,
    changeDate: "2026-08-01",
    outcome: correctedOriginalRecord.summary,
    affectedCapabilities: [],
    originalRecord: correctedOriginalRecord,
    sourceHash: "d".repeat(64),
    preservedRecordHash: "e".repeat(64),
    privacyRedactions: [
      {
        field: "filesAffected[0]",
        transformation: "home-directory-prefix-to-$HOME",
      },
    ],
    migrationSnapshotHash: "f".repeat(64),
    importedOn: "2026-08-02",
    sourceLineage: ["owner-db"],
    migrationReceipt:
      "docs/architecture-knowledge/changelog/corrected-migration-receipt.md",
    applicabilityEvidence: "Corrected review found no Community Gallery scope.",
    applicabilityStatus: "gallery-reviewed-other-capabilities-unclassified",
    galleryApplicability: "not_applicable",
  };
  const correctionRecord: CorrectionChangelogRecord = {
    kind: "changelog",
    variant: "correction",
    id: "LEGACY-QH-cl-900-COR-001",
    title: "Correct the preserved Quality Hub record",
    changeDate: "2026-08-03",
    outcome: "The corrected Quality Hub projection is now effective.",
    provenance: "correction",
    affectedCapabilities: [],
    sourcePath:
      "docs/architecture-knowledge/changelog/entries/LEGACY-QH-cl-900-COR-001.md",
    body: "",
    rawSource: "",
    targetChangeId: root.id,
    correctionSequence: 1,
    correctedOn: "2026-08-03",
    correctionAuthority: "Chronicle owner approval on 2026-08-03",
    correctionReason: "Later source review corrected every mutable legacy field.",
    sourceRevision: `sha256:${"3".repeat(64)}`,
    clarifiedFields,
  };
  const effective: LegacyImportChangelogRecord = {
    ...root,
    title: correctedOriginalRecord.title,
    changeDate: "2026-08-01",
    outcome: correctedOriginalRecord.summary,
    affectedCapabilities: [],
    originalRecord: correctedOriginalRecord,
    sourceHash: "d".repeat(64),
    preservedRecordHash: "e".repeat(64),
    privacyRedactions: clarifiedFields.privacyRedactions ?? [],
    migrationSnapshotHash: "f".repeat(64),
    importedOn: "2026-08-02",
    sourceLineage: ["owner-db"],
    migrationReceipt:
      "docs/architecture-knowledge/changelog/corrected-migration-receipt.md",
    applicabilityEvidence: "Corrected review found no Community Gallery scope.",
    applicabilityStatus: "gallery-reviewed-other-capabilities-unclassified",
    galleryApplicability: "not_applicable",
  };
  return {
    ...entry,
    title: effective.title,
    changeDate: correctionRecord.correctedOn,
    outcome: effective.outcome,
    provenance: "correction",
    affectedCapabilities: effective.affectedCapabilities,
    effectiveRecord: effective,
    appliedCorrections: [correctionRecord],
  };
}

function renderNarrative(
  entry: EffectiveChangelogEntry,
  verifiedArchiveRoute: string | null = null,
) {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <article aria-label={`Fixture ${entry.id}`}>
        <ChangelogRecordNarrative
          entry={entry}
          mode="detail"
          detailHref={`/style-guide/changelog/${entry.id}?scope=global&from=quality-hub`}
          verifiedArchiveRoute={verifiedArchiveRoute}
        />
      </article>
    </MemoryRouter>,
  );
}

describe("ChangelogRecordNarrative", () => {
  it("renders every accepted narrative, evidence, Issue, archive, and source-state field", () => {
    renderNarrative(
      acceptedEntry(),
      "/style-guide/chronicle-knowledge-base/archive/CG-WORK-900",
    );

    for (const text of [
      "The accepted workflow previously omitted the problem statement.",
      "A reader could not understand why the accepted work mattered.",
      "The accepted record now preserves its complete narrative.",
      "The complete narrative was accepted on the tested source revision.",
      "Contract and browser evidence supported the accepted result.",
      "The evidence did not establish deployment or unrelated runtime behavior.",
      "CG-ISSUE-900",
      "CG-ISSUE-901",
      "Chronicle owner",
      "CG-EV-900",
      "community-gallery, admin",
      "CG-WORK-900",
    ]) {
      expect(screen.getAllByText(text)).not.toHaveLength(0);
    }
    expect(
      screen.getByRole("link", {
        name: "Open the complete archived Current Work record",
      }),
    ).toHaveAttribute(
      "href",
      "/style-guide/chronicle-knowledge-base/archive/CG-WORK-900",
    );
    expect(screen.getByText("No corrections have been applied to this record.")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Read complete Changelog record" })).not.toBeInTheDocument();
  });

  it("does not render a declared archive route without reciprocal registry verification", () => {
    renderNarrative(acceptedEntry());

    expect(
      screen.queryByRole("link", {
        name: "Open the complete archived Current Work record",
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(
        /Archived Current Work link unavailable.*reciprocal archive were not verified together/,
      ),
    ).toBeInTheDocument();
  });

  it("renders corrected effective values while preserving ordered append-only correction history", () => {
    const { container } = renderNarrative(correctedEntry());

    expect(screen.getByText("Correction applied")).toBeInTheDocument();
    expect(
      container.querySelector(".changelog-narrative__history-date small"),
    ).toHaveTextContent("Originally accepted: 2026-08-05");
    for (const text of [
      "The corrected accepted title is now authoritative.",
      "The corrected problem statement is now authoritative.",
      "The corrected rationale is now authoritative.",
      "The corrected change description is now authoritative.",
      "The corrected accepted outcome is now authoritative.",
      "The corrected evidence summary is now authoritative.",
      "The corrected evidence limits remain intentionally narrow.",
      "Corrected Chronicle reviewer",
      "CG-EV-902",
      `sha256:${"e".repeat(64)}`,
      "community-gallery, admin, my-stories",
      "CG-WORK-902",
      "docs/current-work/archive/community-gallery/CG-WORK-902.md",
      "/style-guide/chronicle-knowledge-base/archive/CG-WORK-902",
      "CG-ISSUE-902",
      "CG-ISSUE-903",
    ]) {
      expect(screen.getAllByText(text)).not.toHaveLength(0);
    }
    const originalHeading = screen.getByRole("heading", {
      name: "Immutable original narrative",
    });
    const originalSection = originalHeading.closest("section");
    expect(originalSection).not.toBeNull();
    for (const text of [
      "Accepted narrative fixture",
      "2026-08-05",
      "The accepted workflow previously omitted the problem statement.",
      "A reader could not understand why the accepted work mattered.",
      "The accepted record now preserves its complete narrative.",
      "The complete narrative was accepted on the tested source revision.",
      "Contract and browser evidence supported the accepted result.",
      "The evidence did not establish deployment or unrelated runtime behavior.",
      "community-gallery, admin",
      "Chronicle owner",
      "CG-EV-900",
      `sha256:${"a".repeat(64)}`,
      "CG-WORK-900",
      "docs/current-work/archive/community-gallery/CG-WORK-900.md",
      "/style-guide/chronicle-knowledge-base/archive/CG-WORK-900",
      "CG-ISSUE-900",
      "CG-ISSUE-901",
      "docs/architecture-knowledge/changelog/entries/CG-CHANGE-900.md",
    ]) {
      expect(within(originalSection!).getAllByText(text)).not.toHaveLength(0);
    }
    const correctionItems = Array.from(
      container.querySelectorAll<HTMLElement>(".changelog-narrative__corrections > li"),
    );
    expect(correctionItems).toHaveLength(2);
    expect(within(correctionItems[0]).getByRole("heading", { name: "CG-CORRECTION-901" })).toBeInTheDocument();
    expect(correctionItems[0]).toHaveTextContent("Correction reason 1");
    expect(correctionItems[0]).toHaveTextContent(
      "What was broken, Accepted evidence summary",
    );
    expect(within(correctionItems[1]).getByRole("heading", { name: "CG-CORRECTION-902" })).toBeInTheDocument();
    expect(correctionItems[1]).toHaveTextContent("Correction reason 2");
    expect(correctionItems[1]).toHaveTextContent(
      "Accepted result",
    );
  });

  it("renders preserved legacy plan, files, references, comments, provenance, and verification limits", () => {
    renderNarrative(legacyEntry());

    for (const text of [
      "Quality Hub recorded the historical problem and impact.",
      "Quality Hub recorded these historical changes.",
      "Historical summary",
      "Quality Hub recorded this historical plan.",
      "src/legacy-one.ts",
      "src/legacy-two.tsx",
      "QH-FINDING-900",
      "QH-RUN-900",
      "Historical reviewer",
      "The historical reviewer recorded this comment.",
      "repository-seed, local-storage",
      "Not assessed",
      "Not reverified",
    ]) {
      expect(screen.getAllByText(text)).not.toHaveLength(0);
    }
    expect(
      screen.getByText("No modern Chronicle Issue disposition is available for this historical Quality Hub record."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Problem and impact recorded in Quality Hub",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Quality Hub did not store a separate why-needed field, so no rationale is inferred.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Not available — this record predates Chronicle Current Work.")).toBeInTheDocument();
  });

  it("renders the effective legacy correction while preserving the complete original payload and migration metadata", () => {
    const { container } = renderNarrative(correctedLegacyEntry());

    for (const text of [
      "Corrected historical title",
      "Corrected historical summary",
      "Corrected historical problem and impact.",
      "Corrected historical plan.",
      "Corrected historical changes.",
      "Corrected review found no Community Gallery scope.",
      "docs/architecture-knowledge/changelog/corrected-migration-receipt.md",
    ]) {
      expect(screen.getAllByText(text)).not.toHaveLength(0);
    }

    const originalHeading = screen.getByRole("heading", {
      name: "Immutable original Quality Hub record and migration metadata",
    });
    const originalSection = originalHeading.closest("section");
    expect(originalSection).not.toBeNull();
    for (const text of [
      "Historical narrative fixture",
      "Historical summary",
      "fix",
      "completed",
      "Quality Hub recorded the historical problem and impact.",
      "Quality Hub recorded this historical plan.",
      "Quality Hub recorded these historical changes.",
      "Historical agent",
      "QH-FINDING-900",
      "QH-RUN-900",
      "gallery, history",
      "2026-07-30T10:00:00.000Z",
      "2026-07-31T12:00:00.000Z",
      "cl-900",
      `sha256:${"b".repeat(64)}`,
      `sha256:${"c".repeat(64)}`,
      "2026-08-01",
      "repository-seed, local-storage",
      "docs/architecture-knowledge/changelog/migration-receipt.md",
      "The source explicitly named Community Gallery.",
      "capability-reviewed",
      "applicable",
      "post_incident_union_original_170_membership_unknown",
      "not_assessed",
      "not_reverified",
      "docs/architecture-knowledge/changelog/entries/LEGACY-QH-cl-900.md",
    ]) {
      expect(within(originalSection!).getAllByText(text)).not.toHaveLength(0);
    }
    expect(
      within(originalSection!).getByText(
        /src\/legacy-one\.ts\s+src\/legacy-two\.tsx/,
      ),
    ).toBeInTheDocument();

    const correctionItem = container.querySelector<HTMLElement>(
      ".changelog-narrative__corrections > li",
    );
    expect(correctionItem).not.toBeNull();
    expect(correctionItem).toHaveTextContent("Preserved Quality Hub title");
    expect(correctionItem).toHaveTextContent("Preserved Quality Hub summary");
    expect(correctionItem).toHaveTextContent("Preserved Quality Hub payload");
  });
});
