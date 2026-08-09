// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { describe, expect, it } from "vitest";

import type { EffectiveChangelogEntry } from "@/data/chronicle-knowledge-base/changelog-record-contract";
import {
  getCurrentWorkBodyAfterResumeHere,
  type IssueRecord,
  type OperationalRecordRegistry,
} from "@/data/chronicle-knowledge-base/operational-record-contract";
import { GALLERY_OPERATIONAL_RECORDS_CHECKED_ON } from "@/data/chronicle-knowledge-base/operational-record-sources";
import {
  CHRONICLE_CHANGELOG_RECORDS_CHECKED_ON,
  loadChronicleChangelogRegistry,
  selectLoadedChangelogEntries,
} from "@/data/chronicle-knowledge-base/changelog-record-sources";

import ChronicleKnowledgeBasePage from "./chronicle-knowledge-base";

function LocationProbe() {
  const location = useLocation();
  return (
    <output data-testid="location">
      {`${location.pathname}${location.search}${location.hash}`}
    </output>
  );
}

function renderPage(
  initialEntry = "/style-guide/chronicle-knowledge-base",
  operationalRegistry?: OperationalRecordRegistry,
) {
  return render(
    <MemoryRouter
      initialEntries={[initialEntry]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route
          path="/style-guide/chronicle-knowledge-base"
          element={
            <ChronicleKnowledgeBasePage
              operationalRegistry={operationalRegistry}
            />
          }
        />
        <Route
          path="/style-guide/chronicle-knowledge-base/archive/:projectId"
          element={
            <ChronicleKnowledgeBasePage
              operationalRegistry={operationalRegistry}
            />
          }
        />
        <Route path="/" element={<div />} />
      </Routes>
      <LocationProbe />
    </MemoryRouter>,
  );
}

const ARCHIVE_FIXTURE_PROJECT_ID = "CG-WORK-900";
const ARCHIVE_FIXTURE_CHANGE_ID = "CG-CHANGE-900";
const ARCHIVE_FIXTURE_BODY = `# ${ARCHIVE_FIXTURE_PROJECT_ID}: Archived reader fixture

## Current State / Resume Here

The complete preserved fixture body is visible on the archive route.

### Verification command

\`\`\`text
npm run knowledge:operational:check -- --fixture-with-a-deliberately-long-responsive-command
\`\`\`
`;

function archiveFixtureRegistry(): OperationalRecordRegistry {
  const effectiveRecord = {
    variant: "accepted_closeout",
    archiveRoute: `/style-guide/chronicle-knowledge-base/archive/${ARCHIVE_FIXTURE_PROJECT_ID}`,
  };
  const changelogEntry = {
    id: ARCHIVE_FIXTURE_CHANGE_ID,
    variant: "accepted_closeout",
    title: "Archived reader fixture accepted",
    changeDate: "2026-08-06",
    outcome: "The fixture exercises reciprocal archive navigation.",
    provenance: "accepted-closeout",
    affectedCapabilities: ["community-gallery"],
    sourcePath: `docs/architecture-knowledge/changelog/entries/${ARCHIVE_FIXTURE_CHANGE_ID}.md`,
    body: "",
    rootRecord: effectiveRecord,
    effectiveRecord,
    appliedCorrections: [],
  } as unknown as EffectiveChangelogEntry;

  return {
    asOf: "2026-08-06",
    issues: [],
    activeProjects: [],
    archivedProjects: [
      {
        id: ARCHIVE_FIXTURE_PROJECT_ID,
        title: "Archived reader fixture",
        workflowState: "Closed",
        placement: "archive",
        sourcePath: `docs/current-work/archive/community-gallery/${ARCHIVE_FIXTURE_PROJECT_ID}.md`,
        body: ARCHIVE_FIXTURE_BODY,
        closeout: {
          archivedOn: "2026-08-06",
          changelogIds: [ARCHIVE_FIXTURE_CHANGE_ID],
        },
      },
    ],
    changelogEntries: [],
    changelogRegistry: {
      records: [],
      roots: [],
      corrections: [],
      effectiveEntries: [changelogEntry],
    },
    openIssueCount: 0,
  } as unknown as OperationalRecordRegistry;
}

function issueFixtureRecord({
  id,
  status,
  lastVerifiedOn,
  title,
}: {
  id: string;
  status: "open" | "resolved";
  lastVerifiedOn: string;
  title: string;
}): IssueRecord {
  return {
    kind: "issue",
    id,
    title,
    ownerCapability: "community-gallery",
    status,
    discoveredOn: "2026-07-20",
    lastVerifiedOn,
    sourcePath: `docs/architecture-knowledge/issues/community-gallery/${id}.md`,
    content: {
      expectedBehavior: `${title} expected behavior.`,
      currentBehavior: `${title} current behavior.`,
      whyThisIsAProblem: `${title} problem explanation.`,
      supportingEvidence: `${title} supporting evidence.`,
      whatThisEvidenceEstablishes: `${title} evidence limit.`,
      whatRemainsUnverified: `${title} remaining uncertainty.`,
      resolution: status === "resolved" ? `${title} resolution.` : null,
    },
    body: "",
  };
}

function multipleIssueFixtureRegistry(): OperationalRecordRegistry {
  const issues = [
    issueFixtureRecord({
      id: "CG-ISSUE-003",
      status: "resolved",
      lastVerifiedOn: "2026-08-01",
      title: "Resolved fixture",
    }),
    issueFixtureRecord({
      id: "CG-ISSUE-002",
      status: "open",
      lastVerifiedOn: "2026-07-30",
      title: "Older open fixture",
    }),
    issueFixtureRecord({
      id: "CG-ISSUE-001",
      status: "open",
      lastVerifiedOn: "2026-08-01",
      title: "Newest open fixture",
    }),
  ];
  return {
    asOf: "2026-08-01",
    issues,
    activeProjects: [
      {
        id: "CG-WORK-001",
        linkedIssueIds: ["CG-ISSUE-001"],
        placement: "active",
      },
    ],
    archivedProjects: [
      {
        id: "CG-WORK-003",
        linkedIssueIds: ["CG-ISSUE-003"],
        placement: "archive",
      },
    ],
    changelogEntries: [],
    changelogRegistry: {
      records: [],
      roots: [],
      corrections: [],
      effectiveEntries: [],
    },
    openIssueCount: 2,
  } as unknown as OperationalRecordRegistry;
}

describe("Chronicle Knowledge Base page", () => {
  it("keeps the rendered Resume Here separate from the remaining project history", () => {
    expect(
      getCurrentWorkBodyAfterResumeHere(
        "# Project\n\n## Current State / Resume Here\n\nSummary.\n\n## Versioned Outcome and Success Contract\n\nContract.\n\n## Attempt and Decision Log\n\nHistory.",
      ),
    ).toBe(
      "## Versioned Outcome and Success Contract\n\nContract.\n\n## Attempt and Decision Log\n\nHistory.",
    );
  });

  it("gives multiple Issues clear boundaries, approved ordering, and derived Current Work links", () => {
    renderPage(
      "/style-guide/chronicle-knowledge-base?section=community-gallery&tab=issues",
      multipleIssueFixtureRegistry(),
    );

    const gallery = document.getElementById("community-gallery")!;
    const issueArticles = Array.from(
      gallery.querySelectorAll<HTMLElement>("[data-issue-id]"),
    );
    expect(issueArticles.map((article) => article.dataset.issueId)).toEqual([
      "CG-ISSUE-001",
      "CG-ISSUE-002",
      "CG-ISSUE-003",
    ]);
    expect(
      within(issueArticles[0]).getByRole("link", {
        name: "Active Current Work: CG-WORK-001",
      }),
    ).toHaveAttribute(
      "href",
      "/style-guide/chronicle-knowledge-base?section=community-gallery&tab=current-work",
    );
    expect(
      within(issueArticles[1]).getByText("No Current Work record is linked."),
    ).toBeInTheDocument();
    expect(
      within(issueArticles[2]).getByRole("link", {
        name: "Archived Current Work: CG-WORK-003",
      }),
    ).toHaveAttribute(
      "href",
      "/style-guide/chronicle-knowledge-base/archive/CG-WORK-003",
    );
    expect(
      within(issueArticles[2]).getByRole("heading", { name: "Resolution" }),
    ).toBeInTheDocument();
  });

  it("renders the migrated application map and capability skeleton", () => {
    renderPage();

    expect(
      screen.getByRole("heading", { name: "Chronicle Knowledge Base" }),
    ).toBeInTheDocument();

    const applicationMap = document.getElementById("chronicle-overview");
    expect(applicationMap).not.toBeNull();
    expect(within(applicationMap!).getAllByRole("tab")).toHaveLength(12);

    const gallery = document.getElementById("community-gallery");
    expect(gallery).not.toBeNull();
    expect(within(gallery!).getAllByRole("tab")).toHaveLength(7);

    [
      "my-stories",
      "character-library",
      "my-images",
      "story-builder",
      "character-builder",
      "chat-interface",
      "chat-history",
      "public-profile",
      "account",
      "admin",
      "shared-systems",
      "ai-api-services",
      "app-architecture-reference",
    ].forEach((id) => {
      const capability = document.getElementById(id);
      expect(capability, id).not.toBeNull();
      expect(within(capability!).getAllByRole("tab"), id).toHaveLength(3);
    });
  });

  it("renders source-backed images, Gallery architecture, issues, and Supabase directions", async () => {
    renderPage();

    const applicationMap = document.getElementById("chronicle-overview")!;
    fireEvent.click(
      within(applicationMap).getByRole("tab", { name: "Admin Panel" }),
    );
    const adminImage = within(applicationMap).getByRole("img", {
      name: "Admin Panel",
    });
    expect(adminImage).toBeInTheDocument();
    expect(adminImage.getAttribute("src")).toContain(
      "admin-panel-overview.png",
    );

    const gallery = document.getElementById("community-gallery")!;
    const galleryImage = within(gallery).getByRole("img", {
      name: "Community Gallery showing its discovery controls and published story results",
    });
    expect(galleryImage).toBeInTheDocument();
    expect(galleryImage.getAttribute("src")).toContain(
      "community-gallery-overview.png",
    );

    fireEvent.click(
      within(gallery).getByRole("tab", { name: "App Architecture" }),
    );
    expect(
      within(gallery).getByRole("heading", {
        name: "What This Architecture Account Covers",
      }),
    ).toBeInTheDocument();
    expect(within(gallery).getAllByText("GalleryHub.tsx").length).toBeGreaterThan(0);
    expect(within(gallery).getAllByText("gallery-data.ts").length).toBeGreaterThan(0);
    expect(
      within(gallery).getByText(
        "Dormant standalone implementation; not registered as the delivered Gallery route",
      ),
    ).toBeInTheDocument();

    const issuesTab = within(gallery).getByRole("tab", {
      name: "Issues",
    });
    fireEvent.click(issuesTab);
    expect(
      within(gallery).getByRole("heading", { name: "Identified Issues" }),
    ).toBeInTheDocument();
    expect(
      within(gallery).getByRole("heading", {
        name: "Gallery request failures appear as empty results",
      }),
    ).toBeInTheDocument();
    expect(
      within(gallery).getByRole("heading", { name: "Resolved Issues" }),
    ).toBeInTheDocument();
    expect(
      within(gallery).queryByRole("heading", { name: "Open Issues" }),
    ).not.toBeInTheDocument();
    for (const heading of [
      "Expected Behavior",
      "Problem",
      "Current Behavior",
      "Why This Is a Problem",
      "Evidence and Verification",
      "Supporting Evidence",
      "What This Evidence Establishes",
      "What Remains Unverified",
    ]) {
      expect(
        within(gallery).getByRole("heading", { name: heading }),
      ).toBeInTheDocument();
    }
    expect(within(gallery).getByText("CG-ISSUE-001")).toBeInTheDocument();
    expect(within(gallery).getByText("Resolved")).toBeInTheDocument();
    expect(within(gallery).getByText("2026-07-25")).toBeInTheDocument();
    expect(within(gallery).getByText("2026-08-08")).toBeInTheDocument();
    const archivedWorkLink = within(gallery).getByRole("link", {
      name: "Archived Current Work: CG-WORK-002",
    });
    expect(archivedWorkLink).toHaveAttribute(
      "href",
      "/style-guide/chronicle-knowledge-base/archive/CG-WORK-002",
    );
    expect(
      within(gallery).queryByText("Operational records checked:"),
    ).not.toBeInTheDocument();
    expect(issuesTab).not.toHaveClass("knowledge-tab--issues-active");
    expect(issuesTab).toHaveAttribute("aria-selected", "true");

    fireEvent.click(
      within(gallery).getByRole("tab", { name: "Current Work" }),
    );
    expect(
      within(gallery).getByText(
        "This tab tracks active work for this capability. It does not define Chronicle’s intended behavior, replace the current architecture explanation, or prove that an issue is resolved. Read the stable capability documentation and the linked Issues or approved objective before acting.",
      ),
    ).toBeInTheDocument();
    const currentWorkArticles = Array.from(
      gallery.querySelectorAll<HTMLElement>("[data-current-work-id]"),
    );
    expect(
      currentWorkArticles.map((article) =>
        article.getAttribute("data-current-work-id"),
      ),
    ).toEqual(["CG-WORK-001"]);
    const currentWork = currentWorkArticles[0];
    expect(currentWork).toBeDefined();
    if (!currentWork) return;
    expect(within(currentWork).getByText("Primary")).toBeInTheDocument();
    expect(
      currentWork.querySelector(".knowledge-current-work__id"),
    ).toHaveTextContent("CG-WORK-001");
    expect(
      within(currentWork).getByRole("heading", {
        name: "Complete and validate the Community Gallery Knowledge Base pilot",
      }),
    ).toBeInTheDocument();
    expect(
      within(currentWork).getByRole("heading", {
        name: "Current State / Resume Here",
      }),
    ).toBeInTheDocument();
    for (const heading of [
      "Project and Status",
      "Resume Point",
      "Evidence and Uncertainty",
      "Ownership and Blockers",
      "Source and Reading Order",
    ]) {
      expect(
        within(currentWork).getByRole("heading", { name: heading }),
      ).toBeInTheDocument();
    }
    for (const field of [
      "Project status",
      "Last recorded activity",
      "Current coordinator/task",
      "Latest completed result",
      "Where work stopped",
      "Remaining work",
      "Next action",
      "Best current evidence",
      "Not yet proven or needing re-check",
      "Blocking condition",
      "Unblock condition",
      "External decision/action",
      "Status reason",
      "Controlling history entry",
      "Source state to re-check",
      "Read first",
      "Scope guard",
    ]) {
      expect(within(currentWork).getByText(field)).toBeInTheDocument();
    }
    expect(
      within(currentWork).getByText(
        "Codex task /root under the user-approved Community Gallery governing plan",
      ),
    ).toBeInTheDocument();
    expect(
      currentWork.querySelectorAll(".knowledge-current-work__header"),
    ).toHaveLength(1);
    expect(
      within(gallery).queryByText(
        `No active, paused, blocked, deferred, or closeout-pending work recorded as of ${GALLERY_OPERATIONAL_RECORDS_CHECKED_ON}.`,
      ),
    ).not.toBeInTheDocument();
    expect(
      gallery.querySelector(
        `time[datetime="${GALLERY_OPERATIONAL_RECORDS_CHECKED_ON}"]`,
      ),
    ).toHaveTextContent(GALLERY_OPERATIONAL_RECORDS_CHECKED_ON);

    fireEvent.click(
      within(gallery).getByRole("tab", { name: "Changelog" }),
    );
    expect(screen.getByTestId("location")).toHaveTextContent(
      "/style-guide/chronicle-knowledge-base?section=community-gallery&tab=changelog",
    );
    await waitFor(() => {
      expect(
        gallery.querySelectorAll(
          '[data-source-record^="docs/architecture-knowledge/changelog/entries/LEGACY-QH-"]',
        ),
      ).toHaveLength(22);
    });
    expect(
      gallery.querySelectorAll(
        '[data-source-record="docs/architecture-knowledge/changelog/entries/CG-CHANGE-001.md"]',
      ),
    ).toHaveLength(1);
    const changelogResult = await loadChronicleChangelogRegistry();
    expect(changelogResult.status).toBe("ready");
    if (changelogResult.status !== "ready") return;
    expect(
      Array.from(gallery.querySelectorAll("[data-changelog-id]"), (row) =>
        row.getAttribute("data-changelog-id"),
      ),
    ).toEqual(
      selectLoadedChangelogEntries(changelogResult, "community-gallery").map(
        (entry) => entry.id,
      ),
    );
    expect(
      within(gallery).queryByText(
        "No accepted Community Gallery changes are currently recorded.",
      ),
    ).not.toBeInTheDocument();
    expect(
      within(gallery).getAllByText("Historical Quality Hub record"),
    ).toHaveLength(22);
    expect(
      within(gallery).getByText("Accepted Chronicle change"),
    ).toBeInTheDocument();
    expect(
      within(gallery).getAllByText(
        "Not available — this record predates Chronicle Current Work.",
      ),
    ).toHaveLength(22);
    expect(
      within(gallery).getAllByRole("heading", {
        name: "Problem and impact recorded in Quality Hub",
      }),
    ).toHaveLength(22);
    expect(
      within(gallery).getAllByRole("heading", { name: "What changed" }),
    ).toHaveLength(23);
    expect(
      within(gallery).getAllByRole("heading", {
        name: "Preserved Quality Hub summary and verification limits",
      }),
    ).toHaveLength(22);
    expect(
      within(gallery).getAllByRole("heading", {
        name: "Plan recorded at the time",
      }),
    ).toHaveLength(22);
    const expectedGalleryEntries = selectLoadedChangelogEntries(
      changelogResult,
      "community-gallery",
    );
    const firstExpectedEntry = expectedGalleryEntries[0];
    const firstRenderedRecord = gallery.querySelector<HTMLElement>(
      `[data-changelog-id="${firstExpectedEntry.id}"]`,
    );
    expect(firstRenderedRecord).not.toBeNull();
    if (firstExpectedEntry.effectiveRecord.variant === "legacy_import") {
      const normalizedRenderedText = (firstRenderedRecord?.textContent ?? "")
        .replace(/\s+/g, " ")
        .trim();
      for (const expectedText of [
        firstExpectedEntry.effectiveRecord.originalRecord.problem,
        firstExpectedEntry.effectiveRecord.originalRecord.changes,
        firstExpectedEntry.effectiveRecord.outcome,
      ]) {
        expect(normalizedRenderedText).toContain(
          expectedText.replace(/\s+/g, " ").trim(),
        );
      }
    }
    const completeRecordLinks = within(gallery).getAllByRole("link", {
      name: "Read complete Changelog record",
    });
    expect(completeRecordLinks).toHaveLength(23);
    expect(completeRecordLinks[0]).toHaveAttribute(
      "href",
      `/style-guide/changelog/${firstExpectedEntry.id}?scope=community-gallery&from=knowledge-base`,
    );
    expect(
      within(gallery).getByRole("link", {
        name: "Open the complete archived Current Work record",
      }),
    ).toHaveAttribute(
      "href",
      "/style-guide/chronicle-knowledge-base/archive/CG-WORK-002",
    );
    expect(
      within(gallery).getByRole("link", {
        name: "Open the same Community Gallery history in Quality Hub",
      }),
    ).toHaveAttribute(
      "href",
      "/style-guide/ui-audit?view=changelog&capability=community-gallery",
    );
    const structuralCheckLabel = within(gallery).getByText(
      "Changelog files structurally checked:",
    );
    expect(structuralCheckLabel.closest("p")).toHaveTextContent(
      CHRONICLE_CHANGELOG_RECORDS_CHECKED_ON,
    );
    expect(
      within(gallery).getByText(
        /It is not a change date and does not prove that every historical record was factually reverified/,
      ),
    ).toBeInTheDocument();

    fireEvent.click(
      within(gallery).getByRole("tab", { name: "Supabase Tables" }),
    );
    expect(screen.getByTestId("location")).toHaveTextContent(
      "/style-guide/chronicle-knowledge-base",
    );
    expect(
      within(gallery).getByRole("link", {
        name: "/style-guide/supabase-schema-reference",
      }),
    ).toHaveAttribute("href", "/style-guide/supabase-schema-reference");
  });

  it("uses the header chevron to return to the Admin hub", () => {
    renderPage();

    fireEvent.click(
      screen.getByRole("button", { name: "Back to Admin Panel" }),
    );
    expect(screen.getByTestId("location")).toHaveTextContent("/?tab=admin");
  });

  it("opens the Community Gallery Changelog directly from its reciprocal URL", async () => {
    renderPage(
      "/style-guide/chronicle-knowledge-base?section=community-gallery&tab=changelog#changelog-LEGACY-QH-cl-20260620-001",
    );

    const gallery = document.getElementById("community-gallery")!;
    expect(within(gallery).getByRole("tab", { name: "Changelog" })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    await waitFor(() => {
      expect(document.activeElement).toHaveAttribute(
        "data-changelog-id",
        "LEGACY-QH-cl-20260620-001",
      );
    });
  });

  it("renders the complete archive hierarchy and links reciprocally to the complete Changelog record", () => {
    const registry = archiveFixtureRegistry();
    renderPage(
      `/style-guide/chronicle-knowledge-base/archive/${ARCHIVE_FIXTURE_PROJECT_ID}`,
      registry,
    );

    expect(
      screen.getByRole("heading", { name: "Archived Current Work" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: `${ARCHIVE_FIXTURE_PROJECT_ID}: Archived reader fixture`,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 3,
        name: "Current State / Resume Here",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 4,
        name: "Verification command",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(ARCHIVE_FIXTURE_PROJECT_ID)).toBeInTheDocument();
    expect(screen.getByText("Closed")).toBeInTheDocument();
    expect(screen.getByText("2026-08-06")).toBeInTheDocument();
    expect(
      screen.getByText(
        "The complete preserved fixture body is visible on the archive route.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: `Open the complete ${ARCHIVE_FIXTURE_CHANGE_ID} Changelog record`,
      }),
    ).toHaveAttribute(
      "href",
      `/style-guide/changelog/${ARCHIVE_FIXTURE_CHANGE_ID}?scope=community-gallery&from=archive`,
    );
    expect(
      document.querySelector(
        `[data-source-record="docs/current-work/archive/community-gallery/${ARCHIVE_FIXTURE_PROJECT_ID}.md"]`,
      ),
    ).not.toBeNull();
    expect(document.querySelector("pre.knowledge-code-block > code")).not.toBeNull();
  });

  it("does not infer an archive from an active or unknown project ID", () => {
    renderPage(
      "/style-guide/chronicle-knowledge-base/archive/CG-WORK-001",
    );

    expect(
      screen.getByRole("heading", { name: "Archived Current Work not found" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "No canonical archived Community Gallery project matches this address. Nothing was inferred from active work or Changelog history.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", {
        name: "CG-WORK-001: Complete and validate the Community Gallery Knowledge Base pilot",
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Return to Chronicle Knowledge Base" }),
    ).toHaveAttribute("href", "/style-guide/chronicle-knowledge-base");
  });
});
