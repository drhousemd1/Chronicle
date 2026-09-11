// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { Profiler } from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { RepositoryGraphViewPayload } from "@/data/chronicle-knowledge-base/repository-graph-client";

import { RepositoryGraphView } from "./RepositoryGraphView";

const payload: RepositoryGraphViewPayload = {
  schemaVersion: 1,
  state: "ready-current",
  graphId: `graph:${"a".repeat(64)}`,
  generatedAt: "2026-08-30T09:00:00.000Z",
  reasons: [],
  counts: { nodes: 6, edges: 5, communities: 3, lenses: 6 },
  capability: {
    id: "community-gallery",
    label: "Community Gallery",
    sourcePaths: [
      "src/pages/Index.tsx",
      "src/components/chronicle/GalleryHub.tsx",
      "src/services/gallery-service.ts",
      "src/services/persistence/scenarios.ts",
      "src/components/chronicle/GalleryHub.test.tsx",
      "src/components/ui/dialog.tsx",
    ],
    unresolvedSourcePaths: ["src/data/supabase-schema-map.ts"],
    coreNodeIds: [
      "node:111111111111111111111111",
      "node:222222222222222222222222",
      "node:333333333333333333333333",
      "node:444444444444444444444444",
      "node:555555555555555555555555",
      "node:666666666666666666666666",
    ],
    contextNodeIds: [],
  },
  nodes: [
    {
      id: "node:111111111111111111111111",
      upstreamId: "one",
      kind: "file",
      label: "Index",
      qualifiedName: "Index",
      fileType: "tsx",
      sourcePath: "src/pages/Index.tsx",
      sourceLocation: "L1-L20",
      origin: "ast",
      callable: false,
      communityIds: ["community:1111111111111111"],
    },
    {
      id: "node:222222222222222222222222",
      upstreamId: "two",
      kind: "symbol",
      label: "GalleryHub",
      qualifiedName: "GalleryHub",
      fileType: "tsx",
      sourcePath: "src/components/chronicle/GalleryHub.tsx",
      sourceLocation: "L10-L80",
      origin: "ast",
      callable: true,
      communityIds: ["community:1111111111111111"],
    },
    {
      id: "node:333333333333333333333333",
      upstreamId: "three",
      kind: "symbol",
      label: "fetchGalleryScenarios",
      qualifiedName: "fetchGalleryScenarios",
      fileType: "ts",
      sourcePath: "src/services/gallery-service.ts",
      sourceLocation: "L1-L30",
      origin: "ast",
      callable: true,
      communityIds: ["community:1111111111111111"],
    },
    {
      id: "node:444444444444444444444444",
      upstreamId: "four",
      kind: "table",
      label: "scenarios",
      qualifiedName: "public.scenarios",
      fileType: "ts",
      sourcePath: "src/services/persistence/scenarios.ts",
      sourceLocation: "L1-L50",
      origin: "sql",
      callable: false,
      communityIds: ["community:2222222222222222"],
    },
    {
      id: "node:555555555555555555555555",
      upstreamId: "five",
      kind: "file",
      label: "GalleryHub test",
      qualifiedName: "GalleryHub test",
      fileType: "tsx",
      sourcePath: "src/components/chronicle/GalleryHub.test.tsx",
      sourceLocation: "L1-L80",
      origin: "ast",
      callable: false,
      communityIds: ["community:2222222222222222"],
    },
    {
      id: "node:666666666666666666666666",
      upstreamId: "six",
      kind: "file",
      label: "Dialog",
      qualifiedName: "Dialog",
      fileType: "tsx",
      sourcePath: "src/components/ui/dialog.tsx",
      sourceLocation: "L1-L40",
      origin: "ast",
      callable: false,
      communityIds: ["community:3333333333333333"],
    },
  ],
  edges: [
    ["111111111111111111111111", "111111111111111111111111", "222222222222222222222222", "IMPORTS"],
    ["222222222222222222222222", "222222222222222222222222", "333333333333333333333333", "CALLS"],
    ["333333333333333333333333", "333333333333333333333333", "222222222222222222222222", "CALLS"],
    ["444444444444444444444444", "333333333333333333333333", "444444444444444444444444", "READS_FROM"],
    ["555555555555555555555555", "555555555555555555555555", "222222222222222222222222", "REFERENCES"],
  ].map(([id, source, target, relation]) => ({
    id: `edge:${id}`,
    source: `node:${source}`,
    target: `node:${target}`,
    relation,
    context: null,
    confidence: "EXTRACTED" as const,
    confidenceScore: 1,
    sourcePath: "src/components/chronicle/GalleryHub.tsx",
    sourceLocation: "L12",
    origin: "ast" as const,
    weight: 1,
  })),
  communities: [
    {
      id: "community:1111111111111111",
      upstreamCommunity: "1",
      label: "Gallery source group",
      nodeIds: [
        "node:111111111111111111111111",
        "node:222222222222222222222222",
        "node:333333333333333333333333",
      ],
    },
    {
      id: "community:2222222222222222",
      upstreamCommunity: "2",
      label: "Gallery data and tests",
      nodeIds: [
        "node:444444444444444444444444",
        "node:555555555555555555555555",
      ],
    },
    {
      id: "community:3333333333333333",
      upstreamCommunity: "3",
      label: "Unconnected interface group",
      nodeIds: ["node:666666666666666666666666"],
    },
  ],
};

const acceptedHistoryRecord = {
  kind: "changelog" as const,
  variant: "accepted_update" as const,
  id: "CG-UPDATE-001",
  title: "Gallery wording clarified",
  changeDate: "2026-08-29",
  outcome: "The Gallery now explains the empty state in ordinary language.",
  provenance: "accepted-update" as const,
  affectedCapabilities: ["community-gallery" as const],
  sourcePath: "docs/architecture-knowledge/changelog/entries/CG-UPDATE-001.md",
  body: "Accepted update body",
  rawSource: "Accepted update source",
  whyChangeWasNeeded: "The earlier wording was ambiguous.",
  changes: "The empty-state explanation was rewritten.",
  acceptedEvidenceSummary: "The affected page and focused renderer check passed.",
  acceptedEvidenceLimits: "No unrelated Gallery workflow was reviewed.",
  owningCapability: "community-gallery" as const,
  acceptedOn: "2026-08-29",
  acceptedBy: "Chronicle owner",
  reviewMethod: "Visible review of the affected local page.",
  sourceRevision: `sha256:${"a".repeat(64)}`,
  workflowRecordContext: "no_issue_current_work_archive_or_proof_matrix" as const,
};

function historianLoader() {
  return Promise.resolve({
    status: "ready" as const,
    registry: {
      records: [acceptedHistoryRecord],
      roots: [acceptedHistoryRecord],
      corrections: [],
      effectiveEntries: [{
        id: acceptedHistoryRecord.id,
        variant: acceptedHistoryRecord.variant,
        title: acceptedHistoryRecord.title,
        changeDate: acceptedHistoryRecord.changeDate,
        outcome: acceptedHistoryRecord.outcome,
        provenance: acceptedHistoryRecord.provenance,
        affectedCapabilities: acceptedHistoryRecord.affectedCapabilities,
        sourcePath: acceptedHistoryRecord.sourcePath,
        body: acceptedHistoryRecord.body,
        rootRecord: acceptedHistoryRecord,
        effectiveRecord: acceptedHistoryRecord,
        appliedCorrections: [],
      }],
    },
  });
}

function graphResponse(value: RepositoryGraphViewPayload) {
  return { ok: true, json: async () => value };
}

function mockPayload(value: RepositoryGraphViewPayload) {
  const fetchMock = vi.fn().mockResolvedValue(graphResponse(value));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

async function advanceGraphTime(milliseconds = 0) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(milliseconds);
  });
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("RepositoryGraphView", () => {
  it("renders a clean interactive capability preview without the global evidence shell", async () => {
    mockPayload(payload);
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <RepositoryGraphView mode="capability" capabilityId="community-gallery" capabilityLabel="Community Gallery" preferredSourcePath="src/components/chronicle/GalleryHub.tsx" />
      </MemoryRouter>,
    );

    expect(screen.getByText("Loading the private local map for Community Gallery…")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Community Gallery architecture map" })).toBeInTheDocument();
    expect(screen.getByLabelText("Community Gallery structural map")).toBeInTheDocument();
    expect(document.querySelectorAll('[data-node-kind="capability-structural-community"]')).toHaveLength(2);
    expect(document.querySelectorAll('[data-link-kind="capability-structural-community"]').length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /Components · Chronicle · Gallery Hub, 3 capability items/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Components · Ui · Dialog/ })).not.toBeInTheDocument();
    expect(document.querySelector(".repository-capability-map__stage svg")).toHaveAttribute("preserveAspectRatio", "none");
    const connectedCommunityIds = new Set(
      [...document.querySelectorAll<SVGLineElement>('[data-link-kind="capability-structural-community"]')]
        .flatMap((line) => [line.dataset.sourceCommunityId, line.dataset.targetCommunityId]),
    );
    expect(
      [...document.querySelectorAll<HTMLElement>('[data-node-kind="capability-structural-community"]')]
        .every((node) => connectedCommunityIds.has(node.dataset.communityId)),
    ).toBe(true);
    expect(screen.queryByText("Current map")).not.toBeInTheDocument();
    expect(screen.queryByText(`graph:${"a".repeat(64)}`)).not.toBeInTheDocument();
    expect(screen.queryByText("Mapped source files")).not.toBeInTheDocument();
    expect(screen.queryByText("How to read this evidence")).not.toBeInTheDocument();
    expect(screen.queryByText(/does not prove runtime behavior/)).not.toBeInTheDocument();
    expect(screen.queryByText("Capability architecture lens")).not.toBeInTheDocument();
    expect(screen.queryByText(/in the current repository/)).not.toBeInTheDocument();
    expect(screen.queryByText("Capability summary")).not.toBeInTheDocument();
    expect(screen.queryByText("Selected structural group")).not.toBeInTheDocument();
    expect(screen.queryByText("src/services/persistence/scenarios.ts")).not.toBeInTheDocument();
    expect(screen.queryByText("src/components/chronicle/GalleryHub.test.tsx")).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "Selected source" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open full map" })).toHaveAttribute("href", expect.stringContaining("section=chronicle-overview"));

    const capabilityNodes = [...document.querySelectorAll<HTMLButtonElement>('[data-node-kind="capability-structural-community"]')];
    expect(capabilityNodes[0]).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(capabilityNodes[1]);
    expect(capabilityNodes[1]).toHaveAttribute("aria-pressed", "true");
    capabilityNodes[0].focus();
    fireEvent.keyDown(capabilityNodes[0], { key: "ArrowRight" });
    expect(capabilityNodes[1]).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: "Zoom capability map in" }));
    expect(document.querySelector(".repository-capability-map__stage")).toHaveStyle({ transform: "scale(1.12)" });
    fireEvent.click(screen.getByRole("button", { name: "Reset capability map" }));
    expect(document.querySelector(".repository-capability-map__stage")).toHaveStyle({ transform: "scale(1)" });
  });

  it("renders the human-first global explorer and all five evidence views", async () => {
    mockPayload({ ...payload, capability: null });
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <RepositoryGraphView mode="global" capabilityId={null} capabilityLabel="the complete Chronicle application" historianLoader={historianLoader} />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Chronicle repository and system map" })).toBeInTheDocument();
    expect(within(screen.getByLabelText("Chronicle product areas")).getByRole("button", { name: /Story Builder/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Zoom in" })).toBeInTheDocument();
    expect(screen.getByText("Chronicle-authored area")).toBeInTheDocument();
    expect(screen.getByText(/structural communities inside Story Builder/)).toBeInTheDocument();
    fireEvent.click(within(screen.getByLabelText("Chronicle product areas")).getByRole("button", { name: /Gallery, Profiles & Account/ }));
    expect(document.querySelectorAll('[data-node-kind="structural-community"]')).toHaveLength(2);
    const communityNodes = [...document.querySelectorAll<HTMLButtonElement>('[data-node-kind="structural-community"]')];
    expect(screen.getByRole("button", { name: /components \/ chronicle \/ GalleryHub, 2 Gallery, Profiles & Account items/ })).toBeInTheDocument();
    communityNodes[0].focus();
    fireEvent.keyDown(communityNodes[0], { key: "ArrowRight" });
    expect(communityNodes[1]).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: /components \/ chronicle \/ GalleryHub, 2 Gallery, Profiles & Account items/ }));
    expect(screen.getByText("Graphify structural community")).toBeInTheDocument();
    expect(screen.getByText(/not a product area of its own/)).toBeInTheDocument();
    expect(screen.getByText(/Graphify cluster label:/).parentElement).toHaveTextContent("Gallery source group");
    expect(screen.getByRole("heading", { name: "Extracted relationship evidence" }).parentElement).toHaveTextContent("origin ast");
    expect(screen.getByRole("heading", { name: "Extracted relationship evidence" }).parentElement).toHaveTextContent("confidence EXTRACTED (1.00)");
    expect(screen.getByRole("heading", { name: "Extracted relationship evidence" }).parentElement).toHaveTextContent("src/components/chronicle/GalleryHub.tsx L12");
    const mapStage = document.querySelector<HTMLElement>(".chronicle-area-explorer__map-stage");
    expect(mapStage).toHaveStyle({ transform: "translate(0px, 0px) scale(1)" });
    fireEvent.click(screen.getByRole("button", { name: "Pan right" }));
    expect(mapStage).toHaveStyle({ transform: "translate(28px, 0px) scale(1)" });
    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    expect(mapStage).toHaveStyle({ transform: "translate(28px, 0px) scale(1.12)" });
    fireEvent.click(screen.getByRole("button", { name: "Reset map" }));
    expect(mapStage).toHaveStyle({ transform: "translate(0px, 0px) scale(1)" });
    fireEvent.click(within(screen.getByLabelText("Chronicle product areas")).getByRole("button", { name: /Research & Development/ }));
    expect(screen.getByText(/Intentionally excluded from the production graph corpus/)).toBeInTheDocument();
    expect(screen.getAllByText("Not included")).toHaveLength(3);

    fireEvent.click(screen.getByRole("tab", { name: "Repository Tree" }));
    expect(screen.getByRole("heading", { name: "Complete mapped repository tree" })).toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: "Find a source file" }), { target: { value: "GalleryHub.tsx" } });
    expect(screen.getByRole("button", { name: "src/components/chronicle/GalleryHub.tsx" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "src/components/chronicle/GalleryHub.tsx" }));
    expect(screen.getByRole("tab", { name: "Dependency Graph" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByLabelText("Files connected to src/components/chronicle/GalleryHub.tsx")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Community Overview" }));
    expect(screen.getByRole("heading", { name: "Graphify structural communities" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "Recorded History" }));
    expect(await screen.findByRole("heading", { name: "Canonical change history" })).toBeInTheDocument();
  });

  it("distinguishes stale, empty, failed, and non-local map states", async () => {
    mockPayload({ ...payload, state: "ready-stale", reasons: ["source fingerprint changed"] });
    const stale = render(<RepositoryGraphView mode="global" capabilityId={null} capabilityLabel="Chronicle" />);
    expect(await screen.findByText("Older map")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Repository relationships are hidden" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Chronicle Areas" })).toBeDisabled();
    expect(screen.getByRole("tab", { name: "Recorded History" })).toBeEnabled();
    stale.unmount();

    mockPayload({ ...payload, state: "refreshing", reasons: ["authorized refresh in progress"] });
    const refreshing = render(<RepositoryGraphView mode="global" capabilityId={null} capabilityLabel="Chronicle" />);
    expect(await screen.findByText("Map updating")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Repository relationships are hidden" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Chronicle Areas" })).toBeDisabled();
    refreshing.unmount();

    mockPayload({ ...payload, state: "error", reasons: ["artifact identity did not match"] });
    const artifactError = render(<RepositoryGraphView mode="global" capabilityId={null} capabilityLabel="Chronicle" />);
    expect(await screen.findByText("Map needs attention")).toBeInTheDocument();
    expect(screen.getByText("artifact identity did not match")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Repository relationships are hidden" })).toBeInTheDocument();
    artifactError.unmount();

    mockPayload({ ...payload, nodes: [], edges: [], communities: [] });
    const empty = render(<RepositoryGraphView mode="capability" capabilityId="community-gallery" capabilityLabel="Community Gallery" />);
    expect(await screen.findByRole("heading", { name: "No repository relationships are available" })).toBeInTheDocument();
    empty.unmount();

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 503 }));
    const failed = render(<RepositoryGraphView mode="capability" capabilityId="community-gallery" capabilityLabel="Community Gallery" />);
    expect(await screen.findByRole("heading", { name: "Local map could not be loaded" })).toBeInTheDocument();
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    failed.unmount();

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<RepositoryGraphView mode="global" capabilityId={null} capabilityLabel="Chronicle" localGraphAvailable={false} />);
    expect(screen.getByRole("heading", { name: "Available only in local development" })).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(["refreshing", "ready-stale", "unavailable"] as const)("automatically populates a %s graph after the pending retry interval", async (state) => {
    vi.useFakeTimers();
    const fetchMock = mockPayload({ ...payload, capability: null });
    fetchMock.mockResolvedValueOnce(graphResponse({ ...payload, state, capability: null }));
    render(<RepositoryGraphView mode="global" capabilityId={null} capabilityLabel="Chronicle" />);
    await advanceGraphTime();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("heading", { name: "Repository relationships are hidden" })).toBeInTheDocument();
    await advanceGraphTime(1_999);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await advanceGraphTime(1);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(screen.getByText("Current map")).toBeInTheDocument();
    expect(screen.getByLabelText("Chronicle product areas")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Repository relationships are hidden" })).not.toBeInTheDocument();
  });

  it("recovers from a network error immediately when the window regains focus", async () => {
    vi.useFakeTimers();
    const fetchMock = mockPayload({ ...payload, capability: null });
    fetchMock.mockRejectedValueOnce(new Error("Network unavailable"));
    render(<RepositoryGraphView mode="global" capabilityId={null} capabilityLabel="Chronicle" />);
    await advanceGraphTime();

    expect(screen.getByRole("heading", { name: "Local map could not be loaded" })).toBeInTheDocument();
    expect(screen.getByText("Network unavailable")).toBeInTheDocument();
    await advanceGraphTime(2_000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    fireEvent(window, new Event("focus"));
    await advanceGraphTime();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(screen.getByText("Current map")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Local map could not be loaded" })).not.toBeInTheDocument();
  });

  it.each(["error response", "network failure"])("rechecks a %s at the steady interval", async (failure) => {
    vi.useFakeTimers();
    const fetchMock = mockPayload({ ...payload, capability: null });
    if (failure === "network failure") fetchMock.mockRejectedValueOnce(new Error("Network unavailable"));
    else fetchMock.mockResolvedValueOnce(graphResponse({ ...payload, state: "error", capability: null }));
    render(<RepositoryGraphView mode="global" capabilityId={null} capabilityLabel="Chronicle" />);
    await advanceGraphTime();

    await advanceGraphTime(29_999);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await advanceGraphTime(1);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(screen.getByText("Current map")).toBeInTheDocument();
  });

  it("loads a changed graph on the steady recheck without losing the selected view, source, or search", async () => {
    vi.useFakeTimers();
    const newSourcePath = "src/services/gallery-refresh.ts";
    const nextPayload: RepositoryGraphViewPayload = {
      ...payload,
      capability: null,
      graphId: `graph:${"b".repeat(64)}`,
      generatedAt: "2026-08-30T09:01:00.000Z",
      counts: { ...payload.counts!, nodes: payload.nodes.length + 1 },
      nodes: [...payload.nodes, {
        ...payload.nodes[0],
        id: "node:777777777777777777777777",
        upstreamId: "seven",
        label: "Gallery refresh",
        qualifiedName: "Gallery refresh",
        fileType: "ts",
        sourcePath: newSourcePath,
      }],
    };
    const fetchMock = mockPayload(nextPayload);
    fetchMock.mockResolvedValueOnce(graphResponse({ ...payload, capability: null }));
    render(<RepositoryGraphView mode="global" capabilityId={null} capabilityLabel="Chronicle" />);
    await advanceGraphTime();

    fireEvent.click(screen.getByRole("tab", { name: "Dependency Graph" }));
    fireEvent.change(screen.getByRole("combobox", { name: "Selected source" }), { target: { value: "src/services/gallery-service.ts" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Find a source file" }), { target: { value: "gallery" } });
    await advanceGraphTime(29_999);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await advanceGraphTime(1);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("tab", { name: "Dependency Graph" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("textbox", { name: "Find a source file" })).toHaveValue("gallery");
    expect(screen.getByRole("combobox", { name: "Selected source" })).toHaveValue("src/services/gallery-service.ts");
    expect(screen.getByRole("option", { name: newSourcePath })).toBeInTheDocument();
  });

  it("does not commit another graph render for an unchanged ready identity", async () => {
    vi.useFakeTimers();
    const onRender = vi.fn();
    const fetchMock = mockPayload({ ...payload, capability: null });
    fetchMock.mockResolvedValueOnce(graphResponse({ ...payload, capability: null, nodes: payload.nodes.map((node) => ({ ...node })) }));
    render(
      <Profiler id="repository-graph" onRender={onRender}>
        <RepositoryGraphView mode="global" capabilityId={null} capabilityLabel="Chronicle" />
      </Profiler>,
    );
    await advanceGraphTime();
    const committedRenders = onRender.mock.calls.length;
    await advanceGraphTime(30_000);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(onRender).toHaveBeenCalledTimes(committedRenders);
    expect(screen.getByText("Current map")).toBeInTheDocument();
  });

  it("does not overlap requests when focus and visibility events arrive while loading", async () => {
    vi.useFakeTimers();
    let completeRequest!: (response: ReturnType<typeof graphResponse>) => void;
    const fetchMock = mockPayload({ ...payload, capability: null });
    fetchMock.mockReturnValueOnce(new Promise((resolve) => { completeRequest = resolve; }));
    render(<RepositoryGraphView mode="global" capabilityId={null} capabilityLabel="Chronicle" />);

    fireEvent(window, new Event("focus"));
    fireEvent(document, new Event("visibilitychange"));
    await advanceGraphTime(10_000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await act(async () => {
      completeRequest(graphResponse({ ...payload, capability: null }));
    });
    expect(screen.getByText("Current map")).toBeInTheDocument();
    await advanceGraphTime(30_000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("pauses polling while hidden and rechecks immediately when visible again", async () => {
    vi.useFakeTimers();
    let hidden = false;
    vi.spyOn(document, "hidden", "get").mockImplementation(() => hidden);
    vi.spyOn(document, "visibilityState", "get").mockImplementation(() => hidden ? "hidden" : "visible");
    const fetchMock = mockPayload({ ...payload, state: "refreshing", capability: null });
    render(<RepositoryGraphView mode="global" capabilityId={null} capabilityLabel="Chronicle" />);
    await advanceGraphTime();

    hidden = true;
    fireEvent(document, new Event("visibilitychange"));
    fireEvent(window, new Event("focus"));
    await advanceGraphTime(60_000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    hidden = false;
    fetchMock.mockResolvedValue(graphResponse({ ...payload, capability: null }));
    fireEvent(document, new Event("visibilitychange"));
    await advanceGraphTime();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(screen.getByText("Current map")).toBeInTheDocument();
  });

  it("never polls or responds to refresh events outside local development", async () => {
    vi.useFakeTimers();
    const fetchMock = mockPayload(payload);
    render(<RepositoryGraphView mode="global" capabilityId={null} capabilityLabel="Chronicle" localGraphAvailable={false} />);
    fireEvent(window, new Event("focus"));
    fireEvent(document, new Event("visibilitychange"));
    await advanceGraphTime(60_000);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
    expect(screen.getByRole("heading", { name: "Available only in local development" })).toBeInTheDocument();
  });

  it("clears a scheduled retry when unmounted", async () => {
    vi.useFakeTimers();
    const fetchMock = mockPayload({ ...payload, state: "refreshing", capability: null });
    const view = render(<RepositoryGraphView mode="global" capabilityId={null} capabilityLabel="Chronicle" />);
    await advanceGraphTime();
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    view.unmount();

    expect(vi.getTimerCount()).toBe(0);
    await advanceGraphTime(60_000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("aborts an in-flight request and removes refresh listeners on unmount", async () => {
    vi.useFakeTimers();
    const addWindowListener = vi.spyOn(window, "addEventListener");
    const removeWindowListener = vi.spyOn(window, "removeEventListener");
    const addDocumentListener = vi.spyOn(document, "addEventListener");
    const removeDocumentListener = vi.spyOn(document, "removeEventListener");
    const fetchMock = mockPayload(payload);
    fetchMock.mockReturnValueOnce(new Promise(() => undefined));
    const view = render(<RepositoryGraphView mode="global" capabilityId={null} capabilityLabel="Chronicle" />);
    const signal = fetchMock.mock.calls[0][1].signal as AbortSignal;
    const focusListener = addWindowListener.mock.calls.find(([type]) => type === "focus")?.[1];
    const visibilityListener = addDocumentListener.mock.calls.find(([type]) => type === "visibilitychange")?.[1];
    expect(focusListener).toBeTypeOf("function");
    expect(visibilityListener).toBeTypeOf("function");
    expect(signal.aborted).toBe(false);
    view.unmount();

    expect(signal.aborted).toBe(true);
    expect(removeWindowListener).toHaveBeenCalledWith("focus", focusListener);
    expect(removeDocumentListener).toHaveBeenCalledWith("visibilitychange", visibilityListener);
    expect(vi.getTimerCount()).toBe(0);
    fireEvent(window, new Event("focus"));
    fireEvent(document, new Event("visibilitychange"));
    await advanceGraphTime(60_000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });
});
