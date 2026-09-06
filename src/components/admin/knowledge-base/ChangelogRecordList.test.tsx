// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import type {
  AcceptedCloseoutChangelogRecord,
  ChangelogRecordRegistry,
  CorrectionChangelogRecord,
  EffectiveChangelogEntry,
  LegacyImportChangelogRecord,
} from "@/data/chronicle-knowledge-base/changelog-record-contract";
import type { ChangelogRegistryLoader } from "@/data/chronicle-knowledge-base/changelog-record-sources";

import ChangelogRecordList from "./ChangelogRecordList";

function acceptedEntry(
  id: string,
  overrides: Partial<AcceptedCloseoutChangelogRecord> = {},
): EffectiveChangelogEntry {
  const projectId = id.replace("CHANGE", "WORK");
  const record: AcceptedCloseoutChangelogRecord = {
    kind: "changelog",
    variant: "accepted_closeout",
    id,
    title: `${id} accepted title`,
    changeDate: "2026-08-05",
    problem: `${id} accepted problem`,
    whyChangeWasNeeded: `${id} accepted reason`,
    changes: `${id} accepted changes`,
    outcome: `${id} accepted outcome`,
    acceptedEvidenceSummary: `${id} accepted evidence`,
    acceptedEvidenceLimits: `${id} accepted limits`,
    provenance: "accepted-closeout",
    affectedCapabilities: ["community-gallery"],
    owningCapability: "community-gallery",
    acceptedOn: "2026-08-05",
    acceptedBy: "Chronicle owner",
    acceptanceRef: `${id}-EV-001`,
    sourceRevision: `sha256:${"a".repeat(64)}`,
    archivedProjectId: projectId,
    archiveRecord: `docs/current-work/archive/community-gallery/${projectId}.md`,
    archiveRoute: `/style-guide/chronicle-knowledge-base/archive/${projectId}`,
    resolvedIssueIds: [`${id}-ISSUE-RESOLVED`],
    remainingIssueIds: [`${id}-ISSUE-OPEN`],
    sourcePath: `docs/architecture-knowledge/changelog/entries/${id}.md`,
    body: "",
    rawSource: "",
    ...overrides,
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

function legacyEntry(
  id: string,
  affectedCapabilities: LegacyImportChangelogRecord["affectedCapabilities"] = [
    "community-gallery",
  ],
): EffectiveChangelogEntry {
  const record: LegacyImportChangelogRecord = {
    kind: "changelog",
    variant: "legacy_import",
    id,
    title: `${id} historical title`,
    changeDate: "2026-07-31",
    outcome: `${id} historical summary`,
    provenance: "historical-quality-hub",
    affectedCapabilities,
    sourcePath: `docs/architecture-knowledge/changelog/entries/${id}.md`,
    body: "",
    rawSource: "",
    legacySourceId: id.replace("LEGACY-QH-", ""),
    originalRecord: {
      id: id.replace("LEGACY-QH-", ""),
      title: `${id} historical title`,
      summary: `${id} historical summary`,
      severity: "fix",
      status: "completed",
      problem: `${id} historical problem and impact`,
      plan: `${id} historical plan`,
      changes: `${id} historical changes`,
      filesAffected: [`src/${id}.tsx`],
      agent: "Quality Hub agent",
      relatedFindingIds: [`${id}-FINDING`],
      relatedRunIds: [`${id}-RUN`],
      tags: ["history"],
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
    applicabilityEvidence: "The preserved record names Community Gallery.",
    applicabilityStatus: "capability-reviewed",
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

function correctedAcceptedEntry(id: string): EffectiveChangelogEntry {
  const root = acceptedEntry(id);
  if (root.rootRecord.variant !== "accepted_closeout") {
    throw new Error("Accepted fixture root was not accepted_closeout");
  }
  const correction: CorrectionChangelogRecord = {
    kind: "changelog",
    variant: "correction",
    id: `${id}-CORRECTION-001`,
    title: `Correction for ${id}`,
    changeDate: "2026-08-06",
    outcome: `Corrected ${id} outcome`,
    provenance: "correction",
    affectedCapabilities: ["community-gallery"],
    sourcePath: `docs/architecture-knowledge/changelog/entries/${id}-CORRECTION-001.md`,
    body: "",
    rawSource: "",
    targetChangeId: id,
    correctionSequence: 1,
    correctedOn: "2026-08-06",
    correctionAuthority: "Chronicle owner",
    correctionReason: "The accepted narrative needed a factual clarification.",
    sourceRevision: `sha256:${"d".repeat(64)}`,
    clarifiedFields: {
      problem: `${id} corrected problem`,
      changes: `${id} corrected changes`,
      outcome: `Corrected ${id} outcome`,
      acceptedEvidenceLimits: `${id} corrected limits`,
    },
  };
  const effectiveRecord: AcceptedCloseoutChangelogRecord = {
    ...root.rootRecord,
    problem: `${id} corrected problem`,
    changes: `${id} corrected changes`,
    outcome: `Corrected ${id} outcome`,
    acceptedEvidenceLimits: `${id} corrected limits`,
  };
  return {
    ...root,
    changeDate: correction.correctedOn,
    outcome: effectiveRecord.outcome,
    provenance: "correction",
    effectiveRecord,
    appliedCorrections: [correction],
  };
}

function readyLoader(
  entries: readonly EffectiveChangelogEntry[],
): ChangelogRegistryLoader {
  const registry: ChangelogRecordRegistry = {
    records: [],
    roots: [],
    corrections: [],
    effectiveEntries: entries,
  };
  return async () => ({ status: "ready", registry });
}

const defaultProps = {
  scopeLabel: "Test Changelog scope.",
  emptyMessage: "No test Changelog records exist.",
};

function renderList(
  element: ReactElement,
  initialEntry = "/style-guide/chronicle-knowledge-base",
) {
  return render(
    <MemoryRouter
      initialEntries={[initialEntry]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      {element}
    </MemoryRouter>,
  );
}

describe("ChangelogRecordList", () => {
  it("renders complete source-backed primary narratives for legacy, accepted, and corrected records", async () => {
    renderList(
      <ChangelogRecordList
        {...defaultProps}
        detailScope="community-gallery"
        detailOrigin="knowledge-base"
        loader={readyLoader([
          legacyEntry("LEGACY-QH-cl-001"),
          acceptedEntry("CG-CHANGE-001"),
          correctedAcceptedEntry("CG-CHANGE-002"),
        ])}
      />,
    );

    await waitFor(() => {
      expect(document.querySelectorAll("[data-changelog-id]")).toHaveLength(3);
    });
    expect(screen.getAllByRole("heading", { name: "What changed" })).toHaveLength(3);
    expect(screen.getAllByRole("heading", { name: "Result and verification" })).toHaveLength(2);
    expect(
      screen.getByRole("heading", {
        name: "Preserved Quality Hub summary and verification limits",
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { name: "Issue disposition" })).toHaveLength(3);

    const legacy = document.querySelector<HTMLElement>(
      '[data-changelog-id="LEGACY-QH-cl-001"]',
    )!;
    expect(legacy).toHaveTextContent("LEGACY-QH-cl-001 historical problem and impact");
    expect(legacy).toHaveTextContent("LEGACY-QH-cl-001 historical changes");
    expect(legacy).toHaveTextContent("LEGACY-QH-cl-001 historical summary");
    expect(legacy).toHaveTextContent(
      "Quality Hub did not store a separate why-needed field, so no rationale is inferred.",
    );
    expect(legacy).toHaveTextContent("Modern acceptance was not assessed");
    expect(legacy).toHaveTextContent("No modern Chronicle Issue disposition is available");
    expect(legacy).toHaveTextContent("Not available — this record predates Chronicle Current Work.");

    const accepted = document.querySelector<HTMLElement>(
      '[data-changelog-id="CG-CHANGE-001"]',
    )!;
    expect(accepted).toHaveTextContent("CG-CHANGE-001 accepted problem");
    expect(accepted).toHaveTextContent("CG-CHANGE-001 accepted reason");
    expect(accepted).toHaveTextContent("CG-CHANGE-001 accepted changes");
    expect(accepted).toHaveTextContent("CG-CHANGE-001 accepted evidence");
    expect(accepted).toHaveTextContent("CG-CHANGE-001 accepted limits");
    expect(accepted).toHaveTextContent("CG-CHANGE-001-ISSUE-RESOLVED");
    expect(accepted).toHaveTextContent("CG-CHANGE-001-ISSUE-OPEN");
    expect(
      within(accepted).queryByRole("link", {
        name: "Open the complete archived Current Work record",
      }),
    ).not.toBeInTheDocument();
    expect(accepted).toHaveTextContent(
      "Archived Current Work link unavailable — the accepted record and reciprocal archive were not verified together.",
    );

    const corrected = document.querySelector<HTMLElement>(
      '[data-changelog-id="CG-CHANGE-002"]',
    )!;
    expect(corrected).toHaveTextContent("Correction applied");
    expect(corrected).toHaveTextContent("CG-CHANGE-002 corrected problem");
    expect(corrected).toHaveTextContent("CG-CHANGE-002 corrected changes");
    expect(corrected).toHaveTextContent("Corrected CG-CHANGE-002 outcome");
    expect(corrected).toHaveTextContent("CG-CHANGE-002 corrected limits");
    expect(corrected).not.toHaveTextContent("CG-CHANGE-002 accepted problem");

    expect(
      within(legacy).getByRole("link", { name: "Read complete Changelog record" }),
    ).toHaveAttribute(
      "href",
      "/style-guide/changelog/LEGACY-QH-cl-001?scope=community-gallery&from=knowledge-base",
    );
    expect(screen.getByText(/Records are ordered by their latest meaningful history date/)).toBeInTheDocument();
  });

  it("renders a bounded, explicitly labeled preview with complete-record links", async () => {
    renderList(
      <ChangelogRecordList
        {...defaultProps}
        limit={2}
        mode="preview"
        detailScope="global"
        detailOrigin="quality-hub-overview"
        loader={readyLoader([
          legacyEntry("LEGACY-QH-cl-001"),
          legacyEntry("LEGACY-QH-cl-002"),
          legacyEntry("LEGACY-QH-cl-003"),
        ])}
      />,
      "/style-guide/ui-audit",
    );

    await waitFor(() => {
      expect(document.querySelectorAll("[data-changelog-id]")).toHaveLength(2);
    });
    expect(screen.getByText("2 of 3 records")).toBeInTheDocument();
    expect(
      screen.getByText(
        "This is a preview of the 2 newest records. Each preview links to the complete canonical record.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("heading", {
        name: "Preserved Quality Hub summary preview",
      }),
    ).toHaveLength(2);
    expect(screen.queryByRole("heading", { name: "What changed" })).not.toBeInTheDocument();
    const links = screen.getAllByRole("link", { name: "Read complete record" });
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute(
      "href",
      "/style-guide/changelog/LEGACY-QH-cl-001?scope=global&from=quality-hub-overview",
    );
  });

  it("keeps loading, empty, and validation-error states visibly distinct", async () => {
    const pendingLoader: ChangelogRegistryLoader = () => new Promise(() => undefined);
    const { unmount } = renderList(
      <ChangelogRecordList {...defaultProps} loader={pendingLoader} />,
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Loading repository Changelog history",
    );
    expect(screen.queryByText(defaultProps.emptyMessage)).not.toBeInTheDocument();
    unmount();

    const emptyRender = renderList(
      <ChangelogRecordList {...defaultProps} loader={readyLoader([])} />,
    );
    expect(await screen.findByText(defaultProps.emptyMessage)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    emptyRender.unmount();

    const errorLoader: ChangelogRegistryLoader = async () => ({
      status: "error",
      errors: ["docs/example.md: invalid record"],
    });
    renderList(<ChangelogRecordList {...defaultProps} loader={errorLoader} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("not an empty history");
    expect(screen.getByText("docs/example.md: invalid record")).toBeInTheDocument();
    expect(screen.queryByText(defaultProps.emptyMessage)).not.toBeInTheDocument();
  });

  it("shows a rejected loader as an error instead of an empty history", async () => {
    const rejectingLoader: ChangelogRegistryLoader = async () => {
      throw new Error("repository read failed");
    };

    renderList(<ChangelogRecordList {...defaultProps} loader={rejectingLoader} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("repository read failed");
    expect(screen.queryByText(defaultProps.emptyMessage)).not.toBeInTheDocument();
  });

  it("ignores a stale loader result after the requested projection changes", async () => {
    let resolveFirst: ((value: Awaited<ReturnType<ChangelogRegistryLoader>>) => void) | undefined;
    let resolveSecond: ((value: Awaited<ReturnType<ChangelogRegistryLoader>>) => void) | undefined;
    const firstLoader: ChangelogRegistryLoader = () => new Promise((resolve) => {
      resolveFirst = resolve;
    });
    const secondLoader: ChangelogRegistryLoader = () => new Promise((resolve) => {
      resolveSecond = resolve;
    });
    const firstRegistry = await readyLoader([legacyEntry("LEGACY-QH-stale")])();
    const secondRegistry = await readyLoader([legacyEntry("LEGACY-QH-current")])();

    const { rerender } = renderList(
      <ChangelogRecordList {...defaultProps} loader={firstLoader} />,
    );
    rerender(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ChangelogRecordList
          {...defaultProps}
          capability="community-gallery"
          loader={secondLoader}
        />
      </MemoryRouter>,
    );

    await act(async () => {
      resolveSecond?.(secondRegistry);
    });
    expect(await screen.findByText("LEGACY-QH-current historical title")).toBeInTheDocument();

    await act(async () => {
      resolveFirst?.(firstRegistry);
    });
    expect(screen.getByText("LEGACY-QH-current historical title")).toBeInTheDocument();
    expect(screen.queryByText("LEGACY-QH-stale historical title")).not.toBeInTheDocument();
  });

  it("focuses a repository record when a reciprocal hash target loads", async () => {
    renderList(
      <ChangelogRecordList
        {...defaultProps}
        capability="community-gallery"
        detailScope="community-gallery"
        loader={readyLoader([acceptedEntry("CG-CHANGE-001")])}
      />,
      "/style-guide/chronicle-knowledge-base?section=community-gallery&tab=changelog#changelog-CG-CHANGE-001",
    );

    await waitFor(() => {
      expect(document.activeElement).toHaveAttribute(
        "data-changelog-id",
        "CG-CHANGE-001",
      );
    });
  });

  it("namespaces shared records and focuses only the capability requested by the route", async () => {
    const sharedEntry = legacyEntry("LEGACY-QH-cl-shared", [
      "community-gallery",
      "my-stories",
    ]);

    renderList(
      <>
        <ChangelogRecordList
          {...defaultProps}
          capability="community-gallery"
          detailScope="community-gallery"
          loader={readyLoader([sharedEntry])}
        />
        <ChangelogRecordList
          {...defaultProps}
          capability="my-stories"
          detailScope="my-stories"
          loader={readyLoader([sharedEntry])}
        />
      </>,
      "/style-guide/chronicle-knowledge-base?section=my-stories&tab=changelog#changelog-LEGACY-QH-cl-shared",
    );

    await waitFor(() => {
      expect(document.querySelectorAll("[data-changelog-id]")).toHaveLength(2);
    });
    const sharedRecords = [
      ...document.querySelectorAll<HTMLElement>(
        '[data-changelog-id="LEGACY-QH-cl-shared"]',
      ),
    ];
    expect(new Set(sharedRecords.map((record) => record.id)).size).toBe(2);
    expect(sharedRecords.map((record) => record.id)).toEqual([
      "changelog-community-gallery-LEGACY-QH-cl-shared",
      "changelog-my-stories-LEGACY-QH-cl-shared",
    ]);
    expect(document.activeElement).toBe(sharedRecords[1]);
  });
});
