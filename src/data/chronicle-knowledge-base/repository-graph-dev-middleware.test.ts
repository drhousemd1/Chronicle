import type { IncomingMessage, ServerResponse } from "node:http";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getRepositoryGraphRuntimeStatus } = vi.hoisted(() => ({
  getRepositoryGraphRuntimeStatus: vi.fn(),
}));

vi.mock("../../../scripts/chronicle-repository-graph/cli", () => ({ getRepositoryGraphRuntimeStatus }));

import { handleRepositoryGraphRequest } from "../../../scripts/chronicle-repository-graph/dev-middleware";

const status = {
  state: "ready-current",
  buildId: null,
  reasons: [],
  graph: {
    schemaVersion: 1,
    graphId: `graph:${"a".repeat(64)}`,
    generatedAt: "2026-08-30T09:00:00.000Z",
    graph: {
      nodes: [
        {
          id: "node:111111111111111111111111",
          sourcePath: "src/pages/Index.tsx",
          communityIds: ["community:1111111111111111"],
        },
        {
          id: "node:222222222222222222222222",
          sourcePath: "src/components/chronicle/GalleryHub.tsx",
          communityIds: ["community:1111111111111111"],
        },
      ],
      edges: [
        {
          id: "edge:111111111111111111111111",
          source: "node:111111111111111111111111",
          target: "node:222222222222222222222222",
        },
      ],
      communities: [
        {
          id: "community:1111111111111111",
          label: "Gallery group",
          nodeIds: ["node:111111111111111111111111", "node:222222222222222222222222"],
        },
      ],
    },
    lenses: [
      {
        capabilityId: "community-gallery",
        label: "Community Gallery",
        sourcePaths: ["src/pages/Index.tsx"],
        unresolvedSourcePaths: [],
        coreNodeIds: ["node:111111111111111111111111"],
        contextNodeIds: ["node:222222222222222222222222"],
        edgeIds: ["edge:111111111111111111111111"],
      },
    ],
  },
};

function request(url: string, method = "GET", remoteAddress = "127.0.0.1") {
  const headers = new Map<string, string>();
  let body = Buffer.alloc(0);
  const response = {
    statusCode: 0,
    setHeader(name: string, value: string) {
      headers.set(name.toLowerCase(), String(value));
    },
    end(value?: Buffer) {
      body = value ?? Buffer.alloc(0);
    },
  } as unknown as ServerResponse;
  const incoming = {
    url,
    method,
    socket: { remoteAddress },
  } as unknown as IncomingMessage;
  return {
    incoming,
    response,
    result: () => ({
      statusCode: response.statusCode,
      headers,
      body: body.toString("utf8"),
      json: body.length > 0 ? JSON.parse(body.toString("utf8")) as Record<string, unknown> : null,
    }),
  };
}

beforeEach(() => {
  getRepositoryGraphRuntimeStatus.mockReset().mockResolvedValue(status);
});

describe("repository graph development middleware", () => {
  it("ignores unrelated routes and rejects non-loopback graph requests", async () => {
    const unrelated = request("/anything-else");
    expect(await handleRepositoryGraphRequest("/repo", unrelated.incoming, unrelated.response)).toBe(false);
    expect(getRepositoryGraphRuntimeStatus).not.toHaveBeenCalled();

    const remote = request("/__chronicle-repository-graph/status", "GET", "192.168.1.10");
    expect(await handleRepositoryGraphRequest("/repo", remote.incoming, remote.response)).toBe(true);
    expect(remote.result().statusCode).toBe(403);
    expect(remote.result().json).toEqual({ error: "repository_graph_is_loopback_only" });
  });

  it("serves status, filtered views, node detail, and HEAD without exposing the private files directly", async () => {
    const summary = request("/__chronicle-repository-graph/status");
    await handleRepositoryGraphRequest("/repo", summary.incoming, summary.response);
    expect(summary.result().statusCode).toBe(200);
    expect(summary.result().json).toMatchObject({ state: "ready-current", counts: { nodes: 2, edges: 1, communities: 1, lenses: 1 } });
    expect(summary.result().headers.get("cache-control")).toBe("no-store");

    const view = request("/__chronicle-repository-graph/view?capability=community-gallery");
    await handleRepositoryGraphRequest("/repo", view.incoming, view.response);
    expect(view.result().json).toMatchObject({ capability: { id: "community-gallery" } });
    expect((view.result().json!.nodes as unknown[])).toHaveLength(2);

    const node = request("/__chronicle-repository-graph/node/node%3A111111111111111111111111");
    await handleRepositoryGraphRequest("/repo", node.incoming, node.response);
    expect(node.result().json).toMatchObject({ node: { id: "node:111111111111111111111111" }, truncated: false });

    const head = request("/__chronicle-repository-graph/status", "HEAD");
    await handleRepositoryGraphRequest("/repo", head.incoming, head.response);
    expect(head.result().statusCode).toBe(200);
    expect(head.result().body).toBe("");
    expect(Number(head.result().headers.get("content-length"))).toBeGreaterThan(0);
  });

  it("fails closed for unsupported methods, invalid input, missing lenses, and malformed node encoding", async () => {
    const post = request("/__chronicle-repository-graph/status", "POST");
    await handleRepositoryGraphRequest("/repo", post.incoming, post.response);
    expect(post.result().statusCode).toBe(405);
    expect(post.result().headers.get("allow")).toBe("GET, HEAD");

    const invalidCapability = request("/__chronicle-repository-graph/view?capability=../secret");
    await handleRepositoryGraphRequest("/repo", invalidCapability.incoming, invalidCapability.response);
    expect(invalidCapability.result().statusCode).toBe(400);

    const missingCapability = request("/__chronicle-repository-graph/view?capability=my-stories");
    await handleRepositoryGraphRequest("/repo", missingCapability.incoming, missingCapability.response);
    expect(missingCapability.result().statusCode).toBe(404);

    const invalidNode = request("/__chronicle-repository-graph/node/not-a-node");
    await handleRepositoryGraphRequest("/repo", invalidNode.incoming, invalidNode.response);
    expect(invalidNode.result().statusCode).toBe(400);

    const malformedNode = request("/__chronicle-repository-graph/node/%E0%A4%A");
    await handleRepositoryGraphRequest("/repo", malformedNode.incoming, malformedNode.response);
    expect(malformedNode.result().statusCode).toBe(400);
  });

  it("refuses to expose stale relationship data", async () => {
    getRepositoryGraphRuntimeStatus.mockResolvedValue({
      ...status,
      state: "ready-stale",
      reasons: ["source corpus changed"],
    });

    const summary = request("/__chronicle-repository-graph/status");
    await handleRepositoryGraphRequest("/repo", summary.incoming, summary.response);
    expect(summary.result().json).toMatchObject({ state: "ready-stale", counts: null });

    const view = request("/__chronicle-repository-graph/view?capability=community-gallery");
    await handleRepositoryGraphRequest("/repo", view.incoming, view.response);
    expect(view.result().json).toMatchObject({
      state: "ready-stale",
      capability: null,
      nodes: [],
      edges: [],
      communities: [],
    });

    const node = request("/__chronicle-repository-graph/node/node%3A111111111111111111111111");
    await handleRepositoryGraphRequest("/repo", node.incoming, node.response);
    expect(node.result().statusCode).toBe(409);
    expect(node.result().json).toMatchObject({
      error: "repository_graph_not_current",
      state: "ready-stale",
      counts: null,
    });
  });
});
