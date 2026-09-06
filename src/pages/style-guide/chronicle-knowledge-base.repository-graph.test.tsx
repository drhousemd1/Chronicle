// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";

import ChronicleKnowledgeBasePage from "./chronicle-knowledge-base";

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{`${location.pathname}${location.search}${location.hash}`}</output>;
}

function graphPayload(capabilityId: string | null = null, capabilityLabel = "Chronicle") {
  return {
    schemaVersion: 1,
    state: "ready-current",
    graphId: `graph:${"c".repeat(64)}`,
    generatedAt: "2026-08-31T10:00:00.000Z",
    reasons: [],
    counts: { nodes: 2, edges: 1, communities: 2, lenses: 13 },
    capability: capabilityId ? {
      id: capabilityId,
      label: capabilityLabel,
      sourcePaths: ["src/App.tsx", "src/components/chronicle/GalleryHub.tsx"],
      unresolvedSourcePaths: [],
      coreNodeIds: ["node:111111111111111111111111", "node:222222222222222222222222"],
      contextNodeIds: [],
    } : null,
    nodes: [
      {
        id: "node:111111111111111111111111",
        upstreamId: "app",
        kind: "file",
        label: "App",
        qualifiedName: "App",
        fileType: "tsx",
        sourcePath: "src/App.tsx",
        sourceLocation: "L1-L40",
        origin: "ast",
        callable: false,
        communityIds: ["community:2222222222222222"],
      },
      {
        id: "node:222222222222222222222222",
        upstreamId: "gallery",
        kind: "symbol",
        label: "GalleryHub",
        qualifiedName: "GalleryHub",
        fileType: "tsx",
        sourcePath: "src/components/chronicle/GalleryHub.tsx",
        sourceLocation: "L1-L80",
        origin: "ast",
        callable: true,
        communityIds: ["community:1111111111111111"],
      },
    ],
    edges: [{
      id: "edge:111111111111111111111111",
      source: "node:111111111111111111111111",
      target: "node:222222222222222222222222",
      relation: "IMPORTS",
      context: null,
      confidence: "EXTRACTED",
      confidenceScore: 1,
      sourcePath: "src/App.tsx",
      sourceLocation: "L12",
      origin: "ast",
      weight: 1,
    }],
    communities: [
      {
        id: "community:1111111111111111",
        upstreamCommunity: "1",
        label: "Application source group",
        nodeIds: ["node:111111111111111111111111"],
      },
      {
        id: "community:2222222222222222",
        upstreamCommunity: "2",
        label: "Gallery capability group",
        nodeIds: ["node:222222222222222222222222"],
      },
    ],
  };
}

function renderPage(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/style-guide/chronicle-knowledge-base" element={<ChronicleKnowledgeBasePage />} />
      </Routes>
      <LocationProbe />
    </MemoryRouter>,
  );
}

afterEach(() => vi.unstubAllGlobals());

describe("Chronicle Knowledge Base repository graph integration", () => {
  it("places the full human-first explorer inside Chronicle Overview and removes the separate reference section", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => graphPayload() }));
    renderPage("/style-guide/chronicle-knowledge-base?section=chronicle-overview&tab=overview#chronicle-repository-map");

    const overview = document.getElementById("chronicle-overview")!;
    expect(await within(overview).findByRole("heading", { name: "Chronicle repository and system map" })).toBeInTheDocument();
    expect(within(overview).getByRole("tab", { name: "Chronicle Areas" })).toHaveAttribute("aria-selected", "true");
    expect(within(overview).getByLabelText("Chronicle product areas")).toBeInTheDocument();
    expect(document.getElementById("app-architecture-reference")).toBeNull();
    expect(fetch).toHaveBeenCalledWith("/__chronicle-repository-graph/view", expect.objectContaining({ method: "GET" }));
  }, 30_000);

  it("redirects the old App Architecture Reference deep link to the one Overview explorer", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => graphPayload() }));
    renderPage("/style-guide/chronicle-knowledge-base?section=app-architecture-reference&tab=architecture");
    expect(await screen.findByTestId("location")).toHaveTextContent("?section=chronicle-overview&tab=overview#chronicle-repository-map");
    expect(await screen.findByRole("heading", { name: "Chronicle repository and system map" })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { name: "Chronicle repository and system map" })).toHaveLength(1);
  }, 30_000);

  it.each([
    ["community-gallery", "Community Gallery", "community-gallery.md"],
    ["my-stories", "My Stories", "my-stories.md"],
    ["character-library", "Character Library", "character-library.md"],
    ["my-images", "Image Library", "my-images.md"],
    ["story-builder", "Story Builder", "story-builder.md"],
    ["character-builder", "Character Builder", "character-builder.md"],
    ["chat-interface", "Chat Interface", "chat-interface.md"],
    ["roleplay-pipeline", "Roleplay Pipeline", "roleplay-pipeline.md"],
    ["chat-history", "Chat History", "chat-history.md"],
    ["public-profile", "Public Profile", "public-profile.md"],
    ["account", "Account & Subscription", "account.md"],
    ["admin", "Admin Panel", "admin-panel.md"],
    ["shared-systems", "Shared Application Systems", "shared-application-systems.md"],
  ])("places a clean shared graph preview above the %s written architecture", async (capabilityId, capabilityLabel, sourceOwner) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => graphPayload(capabilityId, capabilityLabel) }));
    renderPage(`/style-guide/chronicle-knowledge-base?section=${capabilityId}&tab=app-architecture`);

    const capability = document.getElementById(capabilityId)!;
    const architecture = capability.querySelector<HTMLElement>(`[data-source-owner="${sourceOwner}"]`)!;
    const lensHeading = await within(architecture).findByRole("heading", { name: `${capabilityLabel} architecture map` });
    const manualHeading = architecture.querySelector<HTMLElement>(".knowledge-architecture-source__manual h2")!;
    expect(manualHeading).toBeInTheDocument();
    expect(lensHeading.compareDocumentPosition(manualHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(architecture).getByLabelText(`${capabilityLabel} structural map`)).toBeInTheDocument();
    expect(architecture.querySelectorAll('[data-node-kind="capability-structural-community"]')).toHaveLength(2);
    expect(architecture.querySelector('[data-link-kind="capability-structural-community"]')).toBeInTheDocument();
    expect(architecture.querySelector(".repository-capability-map__stage svg")).toHaveAttribute("preserveAspectRatio", "none");
    const connectedCommunityIds = new Set(
      [...architecture.querySelectorAll<SVGLineElement>('[data-link-kind="capability-structural-community"]')]
        .flatMap((line) => [line.dataset.sourceCommunityId, line.dataset.targetCommunityId]),
    );
    expect(
      [...architecture.querySelectorAll<HTMLElement>('[data-node-kind="capability-structural-community"]')]
        .every((node) => connectedCommunityIds.has(node.dataset.communityId)),
    ).toBe(true);
    expect(architecture.querySelector(".repository-capability-lens__grid")).toBeNull();
    expect(within(architecture).queryByText("Mapped source files")).not.toBeInTheDocument();
    expect(within(architecture).queryByText("How to read this evidence")).not.toBeInTheDocument();
    expect(within(architecture).queryByText(/does not prove runtime behavior/)).not.toBeInTheDocument();
    expect(within(architecture).queryByText("Capability summary")).not.toBeInTheDocument();
    expect(within(architecture).queryByText("Selected structural group")).not.toBeInTheDocument();
    expect(within(architecture).getByRole("link", { name: "Open full map" })).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(`/__chronicle-repository-graph/view?capability=${capabilityId}`, expect.objectContaining({ method: "GET" }));
  }, 30_000);
});
