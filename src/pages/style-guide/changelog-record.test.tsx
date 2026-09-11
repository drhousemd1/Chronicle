// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import type {
  AcceptedCloseoutChangelogRecord,
  ChangelogRecordRegistry,
  CorrectionChangelogRecord,
  EffectiveChangelogEntry,
  LegacyImportChangelogRecord,
} from "@/data/chronicle-knowledge-base/changelog-record-contract";
import type { ChangelogRegistryLoader } from "@/data/chronicle-knowledge-base/changelog-record-sources";
import type { OperationalRecordRegistry } from "@/data/chronicle-knowledge-base/operational-record-contract";

import { ChangelogRecordPage } from "./changelog-record";

function legacyEntry(
  id = "LEGACY-QH-cl-900",
  affectedCapabilities: LegacyImportChangelogRecord["affectedCapabilities"] = [
    "community-gallery",
  ],
): EffectiveChangelogEntry {
  const record: LegacyImportChangelogRecord = {
    kind: "changelog",
    variant: "legacy_import",
    id,
    title: "Direct-load historical fixture",
    changeDate: "2026-07-31",
    outcome: "Historical direct-load summary",
    provenance: "historical-quality-hub",
    affectedCapabilities,
    sourcePath: `docs/architecture-knowledge/changelog/entries/${id}.md`,
    body: "",
    rawSource: "",
    legacySourceId: id.replace("LEGACY-QH-", ""),
    originalRecord: {
      id: id.replace("LEGACY-QH-", ""),
      title: "Direct-load historical fixture",
      summary: "Historical direct-load summary",
      severity: "fix",
      status: "completed",
      problem: "The historical route problem is visible after direct load.",
      plan: "The historical route plan is visible in the complete record.",
      changes: "The historical route changes are visible after direct load.",
      filesAffected: ["src/direct-load-history.ts"],
      agent: "Historical route agent",
      relatedFindingIds: ["QH-FINDING-DIRECT"],
      relatedRunIds: [],
      tags: ["direct-load"],
      comments: [],
      createdAt: "2026-07-30T10:00:00.000Z",
      updatedAt: "2026-07-31T12:00:00.000Z",
    },
    sourceHash: `sha256:${"b".repeat(64)}`,
    privacyRedactions: [],
    migrationSnapshotHash: `sha256:${"c".repeat(64)}`,
    importedOn: "2026-08-01",
    sourceLineage: ["repository-seed"],
    migrationReceipt: "docs/architecture-knowledge/changelog/migration-receipt.md",
    applicabilityEvidence: "The direct-load fixture records its scope.",
    applicabilityStatus: affectedCapabilities.includes("community-gallery")
      ? "capability-reviewed"
      : "gallery-reviewed-other-capabilities-unclassified",
    galleryApplicability: affectedCapabilities.includes("community-gallery")
      ? "applicable"
      : "not_applicable",
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

function correctedAcceptedEntry(): EffectiveChangelogEntry {
  const root: AcceptedCloseoutChangelogRecord = {
    kind: "changelog",
    variant: "accepted_closeout",
    id: "CG-CHANGE-900",
    title: "Corrected accepted route fixture",
    changeDate: "2026-08-05",
    problem: "The original accepted route problem.",
    whyChangeWasNeeded: "The accepted route needed a complete canonical reader.",
    changes: "The original accepted route change.",
    outcome: "The original accepted route result.",
    acceptedEvidenceSummary: "The original accepted evidence summary.",
    acceptedEvidenceLimits: "The original accepted evidence limits.",
    provenance: "accepted-closeout",
    affectedCapabilities: ["community-gallery"],
    owningCapability: "community-gallery",
    acceptedOn: "2026-08-05",
    acceptedBy: "Chronicle owner",
    acceptanceRef: "CG-EV-900",
    sourceRevision: `sha256:${"a".repeat(64)}`,
    archivedProjectId: "CG-WORK-900",
    archiveRecord: "docs/current-work/archive/community-gallery/CG-WORK-900.md",
    archiveRoute: "/style-guide/chronicle-knowledge-base/archive/CG-WORK-900",
    resolvedIssueIds: [],
    remainingIssueIds: [],
    sourcePath: "docs/architecture-knowledge/changelog/entries/CG-CHANGE-900.md",
    body: "",
    rawSource: "",
  };
  const correction: CorrectionChangelogRecord = {
    kind: "changelog",
    variant: "correction",
    id: "CG-CORRECTION-900",
    title: "Corrected accepted route fixture clarification",
    changeDate: "2026-08-06",
    outcome: "The corrected route result is authoritative.",
    provenance: "correction",
    affectedCapabilities: ["community-gallery"],
    sourcePath: "docs/architecture-knowledge/changelog/entries/CG-CORRECTION-900.md",
    body: "",
    rawSource: "",
    targetChangeId: root.id,
    correctionSequence: 1,
    correctedOn: "2026-08-06",
    correctionAuthority: "Chronicle owner",
    correctionReason: "The route result needed correction.",
    sourceRevision: `sha256:${"d".repeat(64)}`,
    clarifiedFields: { outcome: "The corrected route result is authoritative." },
  };
  const effective: AcceptedCloseoutChangelogRecord = {
    ...root,
    outcome: "The corrected route result is authoritative.",
  };
  return {
    id: root.id,
    variant: root.variant,
    title: root.title,
    changeDate: correction.correctedOn,
    outcome: effective.outcome,
    provenance: "correction",
    affectedCapabilities: effective.affectedCapabilities,
    sourcePath: root.sourcePath,
    body: root.body,
    rootRecord: root,
    effectiveRecord: effective,
    appliedCorrections: [correction],
  };
}

function readyLoader(entries: readonly EffectiveChangelogEntry[]): ChangelogRegistryLoader {
  const registry: ChangelogRecordRegistry = {
    records: [],
    roots: [],
    corrections: [],
    effectiveEntries: entries,
  };
  return async () => ({ status: "ready", registry });
}

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{`${location.pathname}${location.search}`}</output>;
}

function reciprocalRegistryFixture(
  entry: EffectiveChangelogEntry,
): OperationalRecordRegistry {
  if (entry.effectiveRecord.variant !== "accepted_closeout") {
    throw new Error("Reciprocal registry fixture requires an accepted entry");
  }
  const record = entry.effectiveRecord;
  return {
    asOf: "2026-08-08",
    issues: [],
    activeProjects: [],
    archivedProjects: [
      {
        id: record.archivedProjectId,
        placement: "archive",
        workflowState: "Closed",
        sourcePath: record.archiveRecord,
        closeout: { changelogIds: [entry.id] },
      } as unknown as OperationalRecordRegistry["archivedProjects"][number],
    ],
    changelogEntries: [entry.rootRecord, ...entry.appliedCorrections],
    changelogRegistry: {
      records: [entry.rootRecord, ...entry.appliedCorrections],
      roots: [entry.rootRecord],
      corrections: entry.appliedCorrections,
      effectiveEntries: [entry],
    },
    openIssueCount: 0,
  };
}

function renderDetail(
  initialEntry: string,
  loader: ChangelogRegistryLoader,
  operationalRegistry?: OperationalRecordRegistry,
) {
  return render(
    <MemoryRouter
      initialEntries={[initialEntry]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route
          path="/style-guide/changelog/:recordId"
          element={
            <ChangelogRecordPage
              loader={loader}
              operationalRegistry={operationalRegistry}
            />
          }
        />
      </Routes>
      <LocationProbe />
    </MemoryRouter>,
  );
}

describe("ChangelogRecordPage", () => {
  it("direct-loads a complete canonical record and returns to the preserved global Quality Hub scope", async () => {
    const entry = legacyEntry();
    renderDetail(
      `/style-guide/changelog/${entry.id}?scope=global&from=quality-hub`,
      readyLoader([entry]),
    );

    expect(await screen.findByText("Direct-load historical fixture")).toBeInTheDocument();
    expect(screen.getByText("The historical route problem is visible after direct load.")).toBeInTheDocument();
    expect(
      screen.getAllByText(
        "The historical route plan is visible in the complete record.",
      ),
    ).not.toHaveLength(0);
    expect(screen.getByText("src/direct-load-history.ts")).toBeInTheDocument();
    expect(document.querySelector('[data-changelog-id="LEGACY-QH-cl-900"]')).not.toBeNull();
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Complete Changelog record" })).toHaveFocus();
    });
    expect(screen.getByRole("link", { name: "Back to Admin Panel" })).toHaveAttribute(
      "href",
      "/?tab=admin",
    );
  });

  it("renders a distinct not-found state for an unknown canonical ID", async () => {
    renderDetail(
      "/style-guide/changelog/UNKNOWN-CHANGE?scope=global&from=quality-hub",
      readyLoader([legacyEntry()]),
    );

    expect(
      await screen.findByRole("heading", { name: "Changelog record not found" }),
    ).toBeInTheDocument();
    expect(screen.getByText("UNKNOWN-CHANGE")).toBeInTheDocument();
    expect(document.querySelector("[data-changelog-id]")).toBeNull();
    expect(screen.getByRole("link", { name: "Return to Quality Hub Changelog" })).toHaveAttribute(
      "href",
      "/style-guide/ui-audit?view=changelog",
    );
  });

  it.each([
    ["missing", "/style-guide/changelog/LEGACY-QH-cl-900"],
    ["invalid", "/style-guide/changelog/LEGACY-QH-cl-900?scope=not-a-scope"],
    [
      "not operational",
      "/style-guide/changelog/LEGACY-QH-cl-900?scope=chronicle-overview",
    ],
  ])("rejects an %s scope before loading canonical history", async (_label, address) => {
    const loader = vi.fn<ChangelogRegistryLoader>(readyLoader([legacyEntry()]));
    renderDetail(address, loader);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This Changelog address has an invalid or missing scope.",
    );
    expect(loader).not.toHaveBeenCalled();
    expect(document.querySelector("[data-changelog-id]")).toBeNull();
  });

  it("distinguishes a known record excluded from Gallery scope without widening to global history", async () => {
    const excluded = legacyEntry("LEGACY-QH-cl-global-only", ["admin"]);
    renderDetail(
      `/style-guide/changelog/${excluded.id}?scope=community-gallery&from=knowledge-base`,
      readyLoader([excluded]),
    );

    expect(
      await screen.findByRole("heading", { name: "Record is outside the requested scope" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/will not silently widen to global history/)).toBeInTheDocument();
    expect(document.querySelector("[data-changelog-id]")).toBeNull();
    expect(
      screen.getByRole("link", { name: "Return to Community Gallery Changelog" }),
    ).toHaveAttribute(
      "href",
      "/style-guide/chronicle-knowledge-base?section=community-gallery&tab=changelog",
    );
  });

  it.each([
    ["my-stories", "My Stories"],
    ["chat-interface", "Chat Interface"],
  ])("preserves %s scope on an excluded complete-record address", async (scope, label) => {
    const excluded = legacyEntry();
    renderDetail(
      `/style-guide/changelog/${excluded.id}?scope=${scope}&from=knowledge-base`,
      readyLoader([excluded]),
    );

    expect(
      await screen.findByRole("heading", { name: "Record is outside the requested scope" }),
    ).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`not positively verified as affecting ${label}`))).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: `Return to ${label} Changelog` }),
    ).toHaveAttribute(
      "href",
      `/style-guide/chronicle-knowledge-base?section=${scope}&tab=changelog`,
    );
  });

  it.each([
    [
      "global Knowledge Base origin",
      "/style-guide/changelog/LEGACY-QH-cl-900?scope=global&from=knowledge-base",
      "Back to Admin Panel",
      "/?tab=admin",
    ],
    [
      "global archive origin",
      "/style-guide/changelog/LEGACY-QH-cl-900?scope=global&from=archive",
      "Back to Admin Panel",
      "/?tab=admin",
    ],
    [
      "Gallery overview origin",
      "/style-guide/changelog/LEGACY-QH-cl-900?scope=community-gallery&from=quality-hub-overview",
      "Back to Admin Panel",
      "/?tab=admin",
    ],
  ])(
    "falls back safely for an incompatible %s",
    async (_label, address, backLabel, destination) => {
      renderDetail(address, readyLoader([legacyEntry()]));

      expect(await screen.findByText("Direct-load historical fixture")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: backLabel })).toHaveAttribute(
        "href",
        destination,
      );
    },
  );

  it("renders a loader or validation failure instead of a missing-record state", async () => {
    const loader: ChangelogRegistryLoader = async () => ({
      status: "error",
      errors: ["docs/example.md: canonical validation failed"],
    });
    renderDetail(
      "/style-guide/changelog/LEGACY-QH-cl-900?scope=global&from=quality-hub",
      loader,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "docs/example.md: canonical validation failed",
    );
    expect(
      screen.queryByRole("heading", { name: "Changelog record not found" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Return to Quality Hub Changelog" }),
    ).toHaveAttribute("href", "/style-guide/ui-audit?view=changelog");
  });

  it("returns a failed Quality Hub overview load to the overview that opened it", async () => {
    const loader: ChangelogRegistryLoader = async () => ({
      status: "error",
      errors: ["docs/example.md: canonical validation failed"],
    });
    renderDetail(
      "/style-guide/changelog/LEGACY-QH-cl-900?scope=global&from=quality-hub-overview",
      loader,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "docs/example.md: canonical validation failed",
    );
    expect(
      screen.getByRole("link", { name: "Return to Quality Hub overview" }),
    ).toHaveAttribute("href", "/style-guide/ui-audit");
  });

  it("returns a missing Quality Hub overview record to the overview that opened it", async () => {
    renderDetail(
      "/style-guide/changelog/UNKNOWN-CHANGE?scope=global&from=quality-hub-overview",
      readyLoader([legacyEntry()]),
    );

    expect(
      await screen.findByRole("heading", { name: "Changelog record not found" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Return to Quality Hub overview" }),
    ).toHaveAttribute("href", "/style-guide/ui-audit");
  });

  it("does not trust an accepted record's raw archive route without reciprocal verification", async () => {
    const entry = correctedAcceptedEntry();
    renderDetail(
      `/style-guide/changelog/${entry.id}?scope=community-gallery&from=archive`,
      readyLoader([entry]),
    );

    expect(
      await screen.findAllByText("Corrected accepted route fixture"),
    ).not.toHaveLength(0);
    expect(
      screen.getAllByText("The corrected route result is authoritative."),
    ).not.toHaveLength(0);
    expect(screen.getByRole("heading", { name: "CG-CORRECTION-900" })).toBeInTheDocument();
    expect(screen.getByText("The route result needed correction.")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Back to Admin Panel" }),
    ).toHaveAttribute(
      "href",
      "/?tab=admin",
    );
    expect(
      screen.queryByRole("link", {
        name: "Open the complete archived Current Work record",
      }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/reciprocal archive were not verified together/)).toBeInTheDocument();
  });

  it("keeps the verified archive link while the header returns to Admin", async () => {
    const entry = correctedAcceptedEntry();
    renderDetail(
      `/style-guide/changelog/${entry.id}?scope=community-gallery&from=archive`,
      readyLoader([entry]),
      reciprocalRegistryFixture(entry),
    );

    expect(
      await screen.findAllByText("Corrected accepted route fixture"),
    ).not.toHaveLength(0);
    expect(
      screen.getByRole("link", { name: "Back to Admin Panel" }),
    ).toHaveAttribute(
      "href",
      "/?tab=admin",
    );
    expect(
      screen.getByRole("link", {
        name: "Open the complete archived Current Work record",
      }),
    ).toHaveAttribute(
      "href",
      "/style-guide/chronicle-knowledge-base/archive/CG-WORK-900",
    );
  });
});
