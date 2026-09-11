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
  type IssueRecord,
  type OperationalRecordRegistry,
} from "@/data/chronicle-knowledge-base/operational-record-contract";
import {
  CHRONICLE_CHANGELOG_RECORDS_CHECKED_ON,
  loadChronicleChangelogRegistry,
  selectLoadedChangelogEntries,
} from "@/data/chronicle-knowledge-base/changelog-record-sources";
import {
  buildArchivedCurrentWorkHref,
  buildChangelogRecordPath,
  buildKnowledgeBaseTabHref,
  buildQualityHubChangelogHref,
} from "@/data/chronicle-knowledge-base/knowledge-routes";

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
function archiveFixtureBody(projectId: string) {
  return `# ${projectId}: Archived reader fixture

## Current State / Resume Here

The complete preserved fixture body is visible on the archive route.

### Verification command

\`\`\`text
npm run knowledge:operational:check -- --fixture-with-a-deliberately-long-responsive-command
\`\`\`
`;
}

function archiveFixtureRegistry({
  projectId = ARCHIVE_FIXTURE_PROJECT_ID,
  changeId = ARCHIVE_FIXTURE_CHANGE_ID,
  capabilityId = "community-gallery",
}: {
  projectId?: string;
  changeId?: string;
  capabilityId?: "community-gallery" | "my-stories";
} = {}): OperationalRecordRegistry {
  const effectiveRecord = {
    variant: "accepted_closeout",
    archiveRoute: buildArchivedCurrentWorkHref(projectId),
  };
  const changelogEntry = {
    id: changeId,
    variant: "accepted_closeout",
    title: "Archived reader fixture accepted",
    changeDate: "2026-08-06",
    outcome: "The fixture exercises reciprocal archive navigation.",
    provenance: "accepted-closeout",
    affectedCapabilities: [capabilityId],
    sourcePath: `docs/architecture-knowledge/changelog/entries/${changeId}.md`,
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
        id: projectId,
        title: "Archived reader fixture",
        ownerCapability: capabilityId,
        workflowState: "Closed",
        placement: "archive",
        sourcePath: `docs/current-work/archive/${capabilityId}/${projectId}.md`,
        body: archiveFixtureBody(projectId),
        closeout: {
          archivedOn: "2026-08-06",
          changelogIds: [changeId],
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
        ownerCapability: "community-gallery",
        linkedIssueIds: ["CG-ISSUE-001"],
        placement: "active",
      },
    ],
    archivedProjects: [
      {
        id: "CG-WORK-003",
        ownerCapability: "community-gallery",
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
  it("keeps Issues independent and shows historical work links only when a preserved record exists", () => {
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
    expect(within(issueArticles[0]).queryByRole("link", { name: /Current Work|Historical work record/ })).not.toBeInTheDocument();
    expect(within(issueArticles[1]).queryByText("Related history")).not.toBeInTheDocument();
    expect(within(gallery).queryByText("No Current Work record is linked.")).not.toBeInTheDocument();
    expect(
      within(issueArticles[2]).getByRole("link", {
        name: "Historical work record: CG-WORK-003",
      }),
    ).toHaveAttribute(
      "href",
      buildArchivedCurrentWorkHref("CG-WORK-003"),
    );
    expect(
      within(issueArticles[2]).getByRole("heading", { name: "Resolution" }),
    ).toBeInTheDocument();
  });

  it("renders the complete application map and approved capability tab sets", () => {
    renderPage();

    expect(
      within(document.querySelector(".chronicle-knowledge-header") as HTMLElement)
        .getByRole("heading", { name: "Chronicle Knowledge Base" }),
    ).toBeInTheDocument();

    const applicationMap = document.getElementById("chronicle-overview");
    expect(applicationMap).not.toBeNull();
    expect(within(applicationMap!).getAllByRole("tab")).toHaveLength(14);

    const gallery = document.getElementById("community-gallery");
    expect(gallery).not.toBeNull();
    expect(within(gallery!).getAllByRole("tab")).toHaveLength(6);

    for (const capabilityId of [
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
    ]) {
      const section = document.getElementById(capabilityId);
      expect(section, capabilityId).not.toBeNull();
      expect(
        within(section!)
          .getAllByRole("tab")
          .map((tab) => tab.textContent?.replace(/\d+$/, "")),
        capabilityId,
      ).toEqual([
        "Overview",
        "UI Elements and Functions",
        "App Architecture",
        "Issues",
        "Supabase Tables",
        "Changelog",
      ]);
    }

    const roleplayPipeline = document.getElementById("roleplay-pipeline");
    expect(roleplayPipeline).not.toBeNull();
    expect(
      within(roleplayPipeline!)
        .getAllByRole("tab")
        .map((tab) => tab.textContent?.replace(/\d+$/, "")),
    ).toEqual([
      "Overview",
      "App Architecture",
      "Issues",
      "Supabase Tables",
      "Changelog",
    ]);

    expect(document.getElementById("ai-api-services")).toBeNull();
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
      name: "Historical work record: CG-WORK-002",
    });
    expect(archivedWorkLink).toHaveAttribute(
      "href",
      buildArchivedCurrentWorkHref("CG-WORK-002"),
    );
    expect(
      within(gallery).queryByText("Operational records checked:"),
    ).not.toBeInTheDocument();
    expect(issuesTab).not.toHaveClass("knowledge-tab--issues-active");
    expect(issuesTab).toHaveAttribute("aria-selected", "true");

    expect(within(gallery).queryByRole("tab", { name: "Current Work" })).not.toBeInTheDocument();

    fireEvent.click(
      within(gallery).getByRole("tab", { name: "Changelog" }),
    );
    expect(screen.getByTestId("location")).toHaveTextContent(
      buildKnowledgeBaseTabHref("community-gallery", "changelog"),
    );
    const changelogResult = await loadChronicleChangelogRegistry();
    expect(changelogResult.status).toBe("ready");
    if (changelogResult.status !== "ready") return;
    const expectedGalleryEntries = selectLoadedChangelogEntries(
      changelogResult,
      "community-gallery",
    );
    const legacyGalleryEntries = expectedGalleryEntries.filter(
      (entry) => entry.rootRecord.variant === "legacy_import",
    );
    const acceptedCloseoutEntries = expectedGalleryEntries.filter(
      (entry) => entry.rootRecord.variant === "accepted_closeout",
    );
    await waitFor(() => {
      expect(
        gallery.querySelectorAll(
          '[data-source-record^="docs/architecture-knowledge/changelog/entries/LEGACY-QH-"]',
        ),
      ).toHaveLength(legacyGalleryEntries.length);
    });
    expect(
      gallery.querySelectorAll(
        '[data-source-record="docs/architecture-knowledge/changelog/entries/CG-CHANGE-001.md"]',
      ),
    ).toHaveLength(1);
    expect(
      Array.from(gallery.querySelectorAll("[data-changelog-id]"), (row) =>
        row.getAttribute("data-changelog-id"),
      ),
    ).toEqual(expectedGalleryEntries.map((entry) => entry.id));
    expect(
      within(gallery).queryByText(
        "No accepted Community Gallery changes are currently recorded.",
      ),
    ).not.toBeInTheDocument();
    expect(
      within(gallery).queryAllByText("Historical Quality Hub record"),
    ).toHaveLength(legacyGalleryEntries.length);
    expect(
      within(gallery).queryAllByText("Accepted Chronicle closeout"),
    ).toHaveLength(acceptedCloseoutEntries.length);
    expect(
      within(gallery).queryAllByText(
        "Not available — this record predates Chronicle Current Work.",
      ),
    ).toHaveLength(0);
    expect(
      within(gallery).queryAllByRole("heading", {
        name: "Problem and impact recorded in Quality Hub",
      }),
    ).toHaveLength(legacyGalleryEntries.length);
    expect(
      within(gallery).queryAllByRole("heading", { name: "What changed" }),
    ).toHaveLength(expectedGalleryEntries.length);
    expect(
      within(gallery).queryAllByRole("heading", {
        name: "Preserved Quality Hub summary and verification limits",
      }),
    ).toHaveLength(legacyGalleryEntries.length);
    expect(
      within(gallery).queryAllByRole("heading", {
        name: "Plan recorded at the time",
      }),
    ).toHaveLength(legacyGalleryEntries.length);
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
    expect(completeRecordLinks).toHaveLength(expectedGalleryEntries.length);
    expect(completeRecordLinks[0]).toHaveAttribute(
      "href",
      `${buildChangelogRecordPath(firstExpectedEntry.id)}?scope=community-gallery&from=knowledge-base`,
    );
    expect(
      within(gallery).getByRole("link", {
        name: "Open the historical work record",
      }),
    ).toHaveAttribute(
      "href",
      buildArchivedCurrentWorkHref("CG-WORK-002"),
    );
    expect(
      within(gallery).getByRole("link", {
        name: "Open the same Community Gallery history in Quality Hub",
      }),
    ).toHaveAttribute(
      "href",
      buildQualityHubChangelogHref("community-gallery"),
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
  }, 15_000);

  it("redirects a retired Current Work tab link to that section's Overview", async () => {
    renderPage("/style-guide/chronicle-knowledge-base?section=community-gallery&tab=current-work");
    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/style-guide/chronicle-knowledge-base?section=community-gallery&tab=overview",
      );
    });
    const gallery = document.getElementById("community-gallery")!;
    expect(within(gallery).getByRole("tab", { name: "Overview" })).toHaveAttribute("aria-selected", "true");
    expect(within(gallery).queryByRole("tab", { name: "Current Work" })).not.toBeInTheDocument();
    expect(document.querySelector("[data-current-work-id]")).toBeNull();
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
      buildArchivedCurrentWorkHref(ARCHIVE_FIXTURE_PROJECT_ID),
      registry,
    );

    expect(
      screen.getByRole("heading", { name: "Historical work record" }),
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
      `${buildChangelogRecordPath(ARCHIVE_FIXTURE_CHANGE_ID)}?scope=community-gallery&from=archive`,
    );
    expect(
      document.querySelector(
        `[data-source-record="docs/current-work/archive/community-gallery/${ARCHIVE_FIXTURE_PROJECT_ID}.md"]`,
      ),
    ).not.toBeNull();
    expect(document.querySelector("pre.knowledge-code-block > code")).not.toBeNull();
  });

  it("does not infer historical work for an unknown project ID", () => {
    renderPage(
      buildArchivedCurrentWorkHref("CG-WORK-999"),
    );

    expect(
      screen.getByRole("heading", { name: "Historical work record not found" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "No canonical archived Chronicle project matches this address. Nothing was inferred from active work or Changelog history.",
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

  it("keeps a non-Gallery archive and its complete Changelog link in the owning capability scope", () => {
    const projectId = "MS-WORK-900";
    const changeId = "CG-CHANGE-901";
    renderPage(
      buildArchivedCurrentWorkHref(projectId),
      archiveFixtureRegistry({
        projectId,
        changeId,
        capabilityId: "my-stories",
      }),
    );

    expect(
      screen.getByText(
        "This preserved My Stories work record is historical reference. Its workflow instructions and resume points are retired, not current assignments. The recorded state is retained; archiving does not mean unfinished work was completed.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: `Open the complete ${changeId} Changelog record`,
      }),
    ).toHaveAttribute(
      "href",
      `${buildChangelogRecordPath(changeId)}?scope=my-stories&from=archive`,
    );
  });
});
