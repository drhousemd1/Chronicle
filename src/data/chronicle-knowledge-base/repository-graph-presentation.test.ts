import { describe, expect, it } from "vitest";

import type { RepositoryGraphViewPayload } from "./repository-graph-client";
import {
  buildCapabilityGraphPresentation,
  buildChronicleAreaCommunityPresentation,
  buildChronicleGraphPresentation,
  CHRONICLE_GRAPH_AREAS,
  classifyRepositoryGraphNode,
} from "./repository-graph-presentation";

const payload: RepositoryGraphViewPayload = {
  schemaVersion: 1,
  state: "ready-current",
  graphId: `graph:${"a".repeat(64)}`,
  generatedAt: "2026-08-31T10:00:00.000Z",
  reasons: [],
  counts: { nodes: 4, edges: 3, communities: 2, lenses: 1 },
  capability: {
    id: "community-gallery",
    label: "Community Gallery",
    sourcePaths: [],
    unresolvedSourcePaths: [],
    coreNodeIds: [
      "node:111111111111111111111111",
      "node:222222222222222222222222",
      "node:333333333333333333333333",
      "node:444444444444444444444444",
    ],
    contextNodeIds: [],
  },
  nodes: [
    ["111111111111111111111111", "GalleryHub", "symbol", "src/components/chronicle/GalleryHub.tsx", "ast", "community:1111111111111111"],
    ["222222222222222222222222", "scenarios", "table", "src/services/persistence/scenarios.ts", "sql", "community:2222222222222222"],
    ["333333333333333333333333", "GalleryHub test", "file", "src/components/chronicle/GalleryHub.test.tsx", "ast", "community:1111111111111111"],
    ["444444444444444444444444", "App", "file", "src/pages/Index.tsx", "ast", "community:2222222222222222"],
  ].map(([id, label, kind, sourcePath, origin, communityId]) => ({
    id: `node:${id}`,
    upstreamId: id,
    kind: kind as "symbol" | "table" | "file",
    label,
    qualifiedName: label,
    fileType: sourcePath.endsWith(".tsx") ? "tsx" : "ts",
    sourcePath,
    sourceLocation: "L1-L20",
    origin: origin as "ast" | "sql",
    callable: kind === "symbol",
    communityIds: [communityId],
  })),
  edges: [
    ["111111111111111111111111", "111111111111111111111111", "222222222222222222222222", "READS_FROM"],
    ["222222222222222222222222", "333333333333333333333333", "111111111111111111111111", "REFERENCES"],
    ["333333333333333333333333", "444444444444444444444444", "111111111111111111111111", "IMPORTS"],
  ].map(([id, source, target, relation]) => ({
    id: `edge:${id}`,
    source: `node:${source}`,
    target: `node:${target}`,
    relation,
    context: null,
    confidence: "EXTRACTED" as const,
    confidenceScore: 1,
    sourcePath: "src/components/chronicle/GalleryHub.tsx",
    sourceLocation: "L10",
    origin: "ast" as const,
    weight: 1,
  })),
  communities: [
    { id: "community:1111111111111111", upstreamCommunity: "1", label: "Gallery code", nodeIds: ["node:111111111111111111111111", "node:333333333333333333333333"] },
    { id: "community:2222222222222222", upstreamCommunity: "2", label: "Data and shell", nodeIds: ["node:222222222222222222222222", "node:444444444444444444444444"] },
  ],
};

describe("repository graph presentation", () => {
  it("keeps the fourteen approved Chronicle areas separate from structural communities", () => {
    expect(CHRONICLE_GRAPH_AREAS).toHaveLength(14);
    expect(classifyRepositoryGraphNode(payload.nodes[0])).toBe("gallery-profile-account");
    expect(classifyRepositoryGraphNode(payload.nodes[1])).toBe("story-hub-sessions");
    expect(classifyRepositoryGraphNode(payload.nodes[2])).toBe("gallery-profile-account");
    expect(classifyRepositoryGraphNode(payload.nodes[3])).toBe("app-shell-shared-ui");

    const presentation = buildChronicleGraphPresentation(payload.nodes, payload.edges, payload.communities);
    expect(presentation.areas).toHaveLength(14);
    expect(presentation.areas.find((area) => area.id === "gallery-profile-account")).toMatchObject({ nodeCount: 2, sourceCount: 2 });
    expect(presentation.areas.find((area) => area.id === "gallery-profile-account")?.matchedRules).toEqual([
      expect.objectContaining({ label: "Gallery components", count: 2 }),
    ]);
    expect(presentation.connections).toEqual(expect.arrayContaining([
      expect.objectContaining({ sourceAreaId: "gallery-profile-account", targetAreaId: "story-hub-sessions", count: 1 }),
      expect.objectContaining({ sourceAreaId: "app-shell-shared-ui", targetAreaId: "gallery-profile-account", count: 1 }),
    ]));
    expect(presentation.areas.find((area) => area.id === "research-development")?.coverageNote).toMatch(/excluded from the production graph corpus/i);
  });

  it("projects real Graphify communities and their directed links inside a Chronicle area", () => {
    const presentation = buildChronicleGraphPresentation(payload.nodes, payload.edges, payload.communities);
    const gallery = buildChronicleAreaCommunityPresentation(
      "gallery-profile-account",
      payload.nodes,
      payload.edges,
      payload.communities,
      presentation.nodeAreaIds,
    );

    expect(gallery.communities).toEqual([
      expect.objectContaining({
        id: "community:1111111111111111",
        label: "components / chronicle / GalleryHub",
        graphifyLabel: "Gallery code",
        areaNodeCount: 2,
        totalNodeCount: 2,
        relationshipEvidence: expect.arrayContaining([
          expect.objectContaining({
            direction: "outgoing",
            relation: "READS_FROM",
            origin: "ast",
            confidence: "EXTRACTED",
            confidenceScore: 1,
            sourcePath: "src/components/chronicle/GalleryHub.tsx",
            sourceLocation: "L10",
          }),
        ]),
      }),
    ]);
    expect(gallery.connections).toEqual([]);
  });

  it("derives the capability orientation without inventing stored-data or test claims", () => {
    const presentation = buildCapabilityGraphPresentation(payload, "src/components/chronicle/GalleryHub.tsx");
    expect(presentation.entryPoint).toBe("src/components/chronicle/GalleryHub.tsx");
    expect(presentation.incomingHandoffs).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: "src/pages/Index.tsx", count: 1 }),
      expect.objectContaining({ path: "src/components/chronicle/GalleryHub.test.tsx", count: 1 }),
    ]));
    expect(presentation.outgoingHandoffs).toEqual([
      expect.objectContaining({ path: "src/services/persistence/scenarios.ts", count: 1 }),
    ]);
    expect(presentation.storedDataSources).toContain("src/services/persistence/scenarios.ts");
    expect(presentation.storedDataSources).not.toContain("src/components/chronicle/GalleryHub.test.tsx");
    expect(presentation.focusedTests).toEqual(["src/components/chronicle/GalleryHub.test.tsx"]);
    expect(presentation.structuralCommunities.map((community) => community.label)).toEqual(["Data and shell", "Gallery code"]);
  });
});
