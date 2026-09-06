// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  MemoryRouter,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { qualityHubInitialRegistry } from "@/data/ui-audit-findings";
import {
  loadChronicleChangelogRegistry,
  selectLoadedChangelogEntries,
} from "@/data/chronicle-knowledge-base/changelog-record-sources";
import {
  buildChangelogRecordPath,
  buildQualityHubChangelogHref,
} from "@/data/chronicle-knowledge-base/knowledge-routes";
import type { ChronicleCapabilityId } from "@/data/chronicle-knowledge-base/capability-ids";
import UiAuditPage from "./ui-audit";

const mocks = vi.hoisted(() => ({
  authState: {
    user: null as { id: string } | null,
    session: null as { user: { id: string } } | null,
    loading: false,
    isAuthenticated: false,
  },
  from: vi.fn(),
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => mocks.authState,
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: { getUser: vi.fn() },
    from: mocks.from,
  },
}));

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{`${location.pathname}${location.search}`}</output>;
}

function HistoryControls() {
  const navigate = useNavigate();
  return (
    <>
      <button type="button" onClick={() => navigate(-1)}>Test Back</button>
      <button type="button" onClick={() => navigate(1)}>Test Forward</button>
    </>
  );
}

function renderQualityHub(initialEntry: string) {
  return render(
    <MemoryRouter
      initialEntries={[initialEntry]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <UiAuditPage />
      <LocationProbe />
      <HistoryControls />
    </MemoryRouter>,
  );
}

async function expectedCanonicalEntries(capability?: ChronicleCapabilityId) {
  const result = await loadChronicleChangelogRegistry();
  expect(result.status).toBe("ready");
  if (result.status !== "ready") return [];
  return selectLoadedChangelogEntries(result, capability);
}

async function expectCanonicalRows(capability?: ChronicleCapabilityId, limit?: number) {
  const entries = await expectedCanonicalEntries(capability);
  const expectedCount = limit === undefined ? entries.length : Math.min(limit, entries.length);
  await waitFor(() => {
    expect(document.querySelectorAll("[data-changelog-id]")).toHaveLength(expectedCount);
  });
  return entries;
}

async function expectedCanonicalIds(capability?: ChronicleCapabilityId) {
  return (await expectedCanonicalEntries(capability)).map((entry) => entry.id);
}

function renderedCanonicalIds() {
  return Array.from(document.querySelectorAll("[data-changelog-id]"), (row) =>
    row.getAttribute("data-changelog-id"),
  );
}

describe("Quality Hub canonical Changelog projection", () => {
  beforeEach(() => {
    window.localStorage.clear();
    mocks.from.mockReset();
  });

  it("opens the exact filtered URL with the same derived repository projection", async () => {
    const ownerRegistry = structuredClone(qualityHubInitialRegistry);
    ownerRegistry.changeLog[0].title = "OWNER REGISTRY ONLY — MUST NOT RENDER";
    window.localStorage.setItem(
      "chronicle-quality-hub-v1",
      JSON.stringify(ownerRegistry),
    );

    renderQualityHub(
      buildQualityHubChangelogHref("community-gallery"),
    );

    const filteredEntries = await expectCanonicalRows("community-gallery");
    expect(renderedCanonicalIds()).toEqual(
      await expectedCanonicalIds("community-gallery"),
    );
    expect(screen.getByTestId("location")).toHaveTextContent(
      buildQualityHubChangelogHref("community-gallery"),
    );
    expect(screen.getByText("Community Gallery")).toBeInTheDocument();
    expect(screen.queryByText("OWNER REGISTRY ONLY — MUST NOT RENDER")).not.toBeInTheDocument();
    expect(screen.getAllByText("Historical Quality Hub record")).toHaveLength(
      filteredEntries.filter((entry) => entry.rootRecord.variant === "legacy_import").length,
    );
    const filteredIds = await expectedCanonicalIds("community-gallery");
    const firstFilteredRecord = document.querySelector<HTMLElement>(
      `[data-changelog-id="${filteredIds[0]}"]`,
    );
    expect(firstFilteredRecord).not.toBeNull();
    expect(
      firstFilteredRecord?.querySelector('[data-changelog-id]'),
    ).toBeNull();
    expect(
      firstFilteredRecord?.querySelector(".changelog-narrative__body"),
    ).not.toBeNull();
    expect(
      screen.getAllByRole("link", { name: "Read complete Changelog record" })[0],
    ).toHaveAttribute(
      "href",
      `${buildChangelogRecordPath(filteredIds[0])}?scope=community-gallery&from=quality-hub`,
    );
    expect(
      screen.getByRole("button", { name: /^Changelog Read-only repository change history/ }),
    ).toHaveAttribute("aria-current", "page");
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("presents the repository Changelog as read-only with no legacy edit controls", async () => {
    renderQualityHub("/style-guide/ui-audit?view=changelog");

    await expectCanonicalRows();
    expect(screen.getByText("Repository history · Read-only")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /add entry/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /save entry/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /add comment/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    const globalIds = await expectedCanonicalIds();
    expect(
      screen.getAllByRole("link", { name: "Read complete Changelog record" })[0],
    ).toHaveAttribute(
      "href",
      `${buildChangelogRecordPath(globalIds[0])}?scope=global&from=quality-hub`,
    );
  });

  it("shows the complete derived registry without a capability and treats an invalid capability as global", async () => {
    const { unmount } = renderQualityHub("/style-guide/ui-audit?view=changelog");
    await expectCanonicalRows();
    expect(renderedCanonicalIds()).toEqual(await expectedCanonicalIds());
    expect(screen.getByText("All Chronicle records")).toBeInTheDocument();
    unmount();

    renderQualityHub(
      "/style-guide/ui-audit?view=changelog&capability=unreviewed-capability",
    );
    await expectCanonicalRows();
    expect(screen.getByText("All Chronicle records")).toBeInTheDocument();
  });

  it("preserves a capability-specific mapped history instead of widening it to global", async () => {
    renderQualityHub(buildQualityHubChangelogHref("my-stories"));

    await expectCanonicalRows("my-stories");
    expect(screen.getByText("My Stories")).toBeInTheDocument();
    expect(renderedCanonicalIds()).toEqual(await expectedCanonicalIds("my-stories"));
    expect(screen.getByText("2 records")).toBeInTheDocument();
    expect(screen.queryByText("No canonical Changelog records are currently verified as affecting My Stories.")).not.toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent(
      buildQualityHubChangelogHref("my-stories"),
    );
  });

  it("falls back to Overview for an invalid view", async () => {
    renderQualityHub(
      "/style-guide/ui-audit?view=unknown&capability=community-gallery",
    );
    expect(screen.getByText("Quality Hub Navigation")).toBeInTheDocument();
    expect(screen.getByText("Recent Repository Changes Preview")).toBeInTheDocument();
    expect(screen.queryByText("Repository history")).not.toBeInTheDocument();
    await expectCanonicalRows(undefined, 5);
  });

  it("uses canonical repository records for the Overview's recent history", async () => {
    const ownerRegistry = structuredClone(qualityHubInitialRegistry);
    ownerRegistry.changeLog[0].title = "OWNER REGISTRY ONLY — MUST NOT RENDER";
    window.localStorage.setItem(
      "chronicle-quality-hub-v1",
      JSON.stringify(ownerRegistry),
    );

    renderQualityHub("/style-guide/ui-audit");

    const globalEntries = await expectCanonicalRows(undefined, 5);
    expect(screen.getByText("Recent Repository Changes Preview")).toBeInTheDocument();
    const previewCount = Math.min(5, globalEntries.length);
    expect(
      screen.getByText(`${previewCount} of ${globalEntries.length} records`),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "This is a preview of the 5 newest records. Each preview links to the complete canonical record.",
      ),
    ).toBeInTheDocument();
    const previewEntries = globalEntries.slice(0, previewCount);
    expect(
      screen.queryAllByRole("heading", {
        name: "Preserved Quality Hub summary preview",
      }),
    ).toHaveLength(
      previewEntries.filter((entry) => entry.rootRecord.variant === "legacy_import").length,
    );
    expect(
      screen.queryAllByRole("heading", { name: "Accepted result preview" }),
    ).toHaveLength(
      previewEntries.filter((entry) => entry.rootRecord.variant !== "legacy_import").length,
    );
    expect(screen.queryByRole("heading", { name: "What changed" })).not.toBeInTheDocument();
    const previewIds = (await expectedCanonicalIds()).slice(0, 5);
    const previewLinks = screen.getAllByRole("link", { name: "Read complete record" });
    expect(previewLinks).toHaveLength(5);
    expect(previewLinks[0]).toHaveAttribute(
      "href",
      `${buildChangelogRecordPath(previewIds[0])}?scope=global&from=quality-hub-overview`,
    );
    expect(screen.queryByText("OWNER REGISTRY ONLY — MUST NOT RENDER")).not.toBeInTheDocument();
    expect(screen.queryByText("Recent Change Log (Mirror)")).not.toBeInTheDocument();
  });

  it("writes navigation to the URL and restores the Changelog scope with Back and Forward", async () => {
    renderQualityHub("/style-guide/ui-audit");

    fireEvent.click(
      screen.getByRole("button", { name: /^Changelog Read-only repository change history/ }),
    );
    await expectCanonicalRows();
    expect(screen.getByTestId("location")).toHaveTextContent(
      buildQualityHubChangelogHref(),
    );

    fireEvent.click(screen.getByRole("link", { name: "Show Community Gallery only" }));
    await expectCanonicalRows("community-gallery");
    expect(screen.getByTestId("location")).toHaveTextContent(
      buildQualityHubChangelogHref("community-gallery"),
    );

    fireEvent.click(screen.getByRole("button", { name: "Test Back" }));
    await expectCanonicalRows();
    expect(screen.getByTestId("location")).toHaveTextContent(
      buildQualityHubChangelogHref(),
    );

    fireEvent.click(screen.getByRole("button", { name: "Test Forward" }));
    await expectCanonicalRows("community-gallery");
    expect(screen.getByTestId("location")).toHaveTextContent(
      buildQualityHubChangelogHref("community-gallery"),
    );
  });

  it("does not revive an inapplicable capability parameter when opening Changelog", async () => {
    renderQualityHub("/style-guide/ui-audit?capability=community-gallery");

    fireEvent.click(
      screen.getByRole("button", { name: /^Changelog Read-only repository change history/ }),
    );

    await expectCanonicalRows();
    expect(screen.getByTestId("location")).toHaveTextContent(
      buildQualityHubChangelogHref(),
    );
  });
});
