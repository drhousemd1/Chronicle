import type { IncomingMessage, ServerResponse } from "node:http";
import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";
import type { spawn } from "node:child_process";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getRepositoryGraphRuntimeStatus, buildRepositoryGraph, sourceKey } = vi.hoisted(() => ({
  getRepositoryGraphRuntimeStatus: vi.fn(),
  buildRepositoryGraph: vi.fn(),
  sourceKey: vi.fn(),
}));

vi.mock("../../../scripts/chronicle-repository-graph/cli", () => ({
  getRepositoryGraphRuntimeStatus,
  buildRepositoryGraph,
  printableRepositoryGraphError: (error: unknown) => error instanceof Error ? error.message : String(error),
}));

import { handleRepositoryGraphRequest as handleRequest } from "../../../scripts/chronicle-repository-graph/dev-middleware";
import { createRepositoryGraphRuntimeAccess, runRepositoryGraphUpdateProcess } from "../../../scripts/chronicle-repository-graph/auto-refresh";

let readRuntimeStatus: ReturnType<typeof createRepositoryGraphRuntimeAccess>;

function handleRepositoryGraphRequest(root: string, incoming: IncomingMessage, response: ServerResponse) {
  return handleRequest(root, incoming, response, readRuntimeStatus);
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((onResolve, onReject) => { resolve = onResolve; reject = onReject; });
  return { promise, resolve, reject };
}

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

function request(url: string, method = "GET", remoteAddress = "127.0.0.1", requestHeaders: Record<string, string> = {}) {
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
    headers: requestHeaders,
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
  buildRepositoryGraph.mockReset().mockImplementation(() => new Promise(() => {}));
  sourceKey.mockReset().mockResolvedValue("source-a");
  readRuntimeStatus = createRepositoryGraphRuntimeAccess({
    readStatus: getRepositoryGraphRuntimeStatus,
    build: buildRepositoryGraph,
    sourceKey,
  });
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
    expect(summary.result().json).toMatchObject({ state: "refreshing", counts: null });

    const view = request("/__chronicle-repository-graph/view?capability=community-gallery");
    await handleRepositoryGraphRequest("/repo", view.incoming, view.response);
    expect(view.result().json).toMatchObject({
      state: "refreshing",
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
      state: "refreshing",
      counts: null,
    });
  });

  it.each(["unavailable", "ready-stale"])("automatically publishes a %s graph without holding the response open", async (state) => {
    const build = deferred<unknown>();
    getRepositoryGraphRuntimeStatus.mockResolvedValue({ ...status, state, graph: state === "unavailable" ? null : status.graph });
    buildRepositoryGraph.mockReturnValue(build.promise);

    const first = request("/__chronicle-repository-graph/view");
    await handleRepositoryGraphRequest("/repo", first.incoming, first.response);
    expect(first.result().json).toMatchObject({ state: "refreshing", nodes: [], edges: [], counts: null });
    await vi.waitFor(() => expect(buildRepositoryGraph).toHaveBeenCalledTimes(1));

    getRepositoryGraphRuntimeStatus.mockResolvedValue(status);
    build.resolve(status.graph);
    await vi.waitFor(async () => {
      const next = request("/__chronicle-repository-graph/view?capability=community-gallery");
      await handleRepositoryGraphRequest("/repo", next.incoming, next.response);
      expect(next.result().json).toMatchObject({ state: "ready-current", capability: { id: "community-gallery" } });
      expect(next.result().json!.nodes).toHaveLength(2);
    });
    expect(buildRepositoryGraph).toHaveBeenCalledTimes(1);
  });

  it("shares status reads and one background build across concurrent global and capability views", async () => {
    const initial = deferred<unknown>();
    getRepositoryGraphRuntimeStatus.mockReturnValue(initial.promise);
    const global = request("/__chronicle-repository-graph/view");
    const lens = request("/__chronicle-repository-graph/view?capability=community-gallery");
    const requests = Promise.all([
      handleRepositoryGraphRequest("/repo", global.incoming, global.response),
      handleRepositoryGraphRequest("/repo/.", lens.incoming, lens.response),
    ]);
    await vi.waitFor(() => expect(getRepositoryGraphRuntimeStatus).toHaveBeenCalledTimes(1));
    initial.resolve({ ...status, state: "ready-stale" });
    await requests;
    expect(global.result().json).toMatchObject({ state: "refreshing" });
    expect(lens.result().json).toMatchObject({ state: "refreshing" });
    await vi.waitFor(() => expect(buildRepositoryGraph).toHaveBeenCalledTimes(1));

    const polling = request("/__chronicle-repository-graph/view");
    await handleRepositoryGraphRequest("/repo", polling.incoming, polling.response);
    expect(getRepositoryGraphRuntimeStatus).toHaveBeenCalledTimes(1);
    expect(sourceKey).toHaveBeenCalledTimes(1);
    expect(buildRepositoryGraph).toHaveBeenCalledTimes(1);
  });

  it("respects an already-running custody lock", async () => {
    getRepositoryGraphRuntimeStatus.mockResolvedValue({ ...status, state: "refreshing", buildId: "build-other-process" });
    const view = request("/__chronicle-repository-graph/view");
    await handleRepositoryGraphRequest("/repo", view.incoming, view.response);
    expect(view.result().json).toMatchObject({ state: "refreshing", nodes: [] });
    expect(buildRepositoryGraph).not.toHaveBeenCalled();
    expect(sourceKey).not.toHaveBeenCalled();
  });

  it("reports the actual failure once per source and retries only after source changes", async () => {
    getRepositoryGraphRuntimeStatus.mockResolvedValue({ ...status, state: "ready-stale" });
    buildRepositoryGraph.mockRejectedValue(new Error("Pinned Graphify environment is missing."));
    const first = request("/__chronicle-repository-graph/view");
    await handleRepositoryGraphRequest("/repo", first.incoming, first.response);

    await vi.waitFor(async () => {
      const failed = request("/__chronicle-repository-graph/view");
      await handleRepositoryGraphRequest("/repo", failed.incoming, failed.response);
      expect(failed.result().json).toMatchObject({ state: "error", reasons: ["Pinned Graphify environment is missing."], nodes: [] });
    });
    const unchanged = Array.from({ length: 3 }, () => request("/__chronicle-repository-graph/view?capability=community-gallery"));
    await Promise.all(unchanged.map((view) => handleRepositoryGraphRequest("/repo", view.incoming, view.response)));
    expect(unchanged.every((view) => view.result().json!.state === "error")).toBe(true);
    expect(buildRepositoryGraph).toHaveBeenCalledTimes(1);

    sourceKey.mockResolvedValue("source-b");
    buildRepositoryGraph.mockImplementation(() => new Promise(() => {}));
    const changed = request("/__chronicle-repository-graph/view");
    const changedLens = request("/__chronicle-repository-graph/view?capability=community-gallery");
    await Promise.all([
      handleRepositoryGraphRequest("/repo", changed.incoming, changed.response),
      handleRepositoryGraphRequest("/repo", changedLens.incoming, changedLens.response),
    ]);
    expect(changed.result().json).toMatchObject({ state: "refreshing" });
    await vi.waitFor(() => expect(buildRepositoryGraph).toHaveBeenCalledTimes(2));
  });

  it("recognizes explicit recovery after an automatic build failure", async () => {
    getRepositoryGraphRuntimeStatus.mockResolvedValue({ ...status, state: "ready-stale" });
    buildRepositoryGraph.mockRejectedValue(new Error("Extraction failed."));
    await readRuntimeStatus("/repo");
    await vi.waitFor(async () => expect((await readRuntimeStatus("/repo")).state).toBe("error"));

    getRepositoryGraphRuntimeStatus.mockResolvedValue(status);
    expect((await readRuntimeStatus("/repo")).state).toBe("ready-current");
    expect(buildRepositoryGraph).toHaveBeenCalledTimes(1);
  });

  it("never starts recovery for invalid, non-loopback, unsupported, or HEAD requests", async () => {
    getRepositoryGraphRuntimeStatus.mockResolvedValue({ ...status, state: "unavailable", graph: null });
    const invalid = [
      request("/__chronicle-repository-graph/view?capability=../secret"),
      request("/__chronicle-repository-graph/view?capability="),
      request("/__chronicle-repository-graph/view?capability=community-gallery&capability=../secret"),
      request("/__chronicle-repository-graph/node/not-a-node"),
      request("/__chronicle-repository-graph/node/%E0%A4%A"),
      request("/__chronicle-repository-graph/view", "GET", "192.168.1.10"),
      request("/__chronicle-repository-graph/view", "POST"),
      request("/__chronicle-repository-graph/view", "GET", "127.0.0.1", { "sec-fetch-site": "cross-site" }),
      request("/__chronicle-repository-graph/view", "GET", "127.0.0.1", { "sec-fetch-site": "same-site" }),
      request("/__chronicle-repository-graph/view", "GET", "127.0.0.1", { origin: "https://foreign.example", host: "127.0.0.1:8080" }),
      request("/__chronicle-repository-graph/view", "GET", "127.0.0.1", { origin: "null", host: "127.0.0.1:8080" }),
    ];
    await Promise.all(invalid.map((view) => handleRepositoryGraphRequest("/repo", view.incoming, view.response)));
    expect(getRepositoryGraphRuntimeStatus).not.toHaveBeenCalled();
    expect(invalid.every((view) => view.result().statusCode >= 400)).toBe(true);

    const head = request("/__chronicle-repository-graph/view", "HEAD");
    await handleRepositoryGraphRequest("/repo", head.incoming, head.response);
    expect(head.result().statusCode).toBe(200);
    expect(head.result().body).toBe("");
    expect(buildRepositoryGraph).not.toHaveBeenCalled();
    expect(sourceKey).not.toHaveBeenCalled();
  });

  it("allows the same-origin local browser to start automatic recovery", async () => {
    getRepositoryGraphRuntimeStatus.mockResolvedValue({ ...status, state: "unavailable", graph: null });
    const view = request("/__chronicle-repository-graph/view", "GET", "127.0.0.1", {
      origin: "http://127.0.0.1:8080",
      host: "127.0.0.1:8080",
      "sec-fetch-site": "same-origin",
    });
    await handleRepositoryGraphRequest("/repo", view.incoming, view.response);
    expect(view.result().json).toMatchObject({ state: "refreshing" });
    await vi.waitFor(() => expect(buildRepositoryGraph).toHaveBeenCalledTimes(1));
  });
});

describe("automatic graph update child process", () => {
  function runner() {
    const child = Object.assign(new EventEmitter(), { stderr: new PassThrough() });
    const start = vi.fn().mockReturnValue(child);
    const result = runRepositoryGraphUpdateProcess("/repo with spaces", start as unknown as typeof spawn);
    return { child, start, result };
  }

  it("launches the existing local CLI without a shell and resolves only after successful completion", async () => {
    const { child, start, result } = runner();
    expect(start).toHaveBeenCalledWith(process.execPath, [
      "/repo with spaces/node_modules/vite-node/vite-node.mjs",
      "--script",
      "/repo with spaces/scripts/chronicle-repository-graph/cli-entry.ts",
      "update",
    ], { cwd: "/repo with spaces", shell: false, stdio: ["ignore", "ignore", "pipe"], windowsHide: true });
    const complete = vi.fn();
    void result.then(complete);
    await Promise.resolve();
    expect(complete).not.toHaveBeenCalled();
    child.emit("close", 0, null);
    await result;
    expect(complete).toHaveBeenCalledTimes(1);
  });

  it("surfaces nonzero completion with bounded final stderr", async () => {
    const { child, result } = runner();
    child.stderr.write("discarded startup noise\n" + "x".repeat(16000));
    child.stderr.write("\nPinned Graphify environment is missing.");
    child.emit("close", 1, null);
    const error = await result.catch((value: Error) => value);
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain("exit 1");
    expect((error as Error).message).toContain("Pinned Graphify environment is missing.");
    expect((error as Error).message).not.toContain("discarded startup noise");
    expect((error as Error).message.length).toBeLessThan(2100);
  });

  it("reports process launch and signal failures", async () => {
    const failed = runner();
    failed.child.emit("error", new Error("spawn ENOENT"));
    await expect(failed.result).rejects.toThrow("could not start: spawn ENOENT");

    const signaled = runner();
    signaled.child.emit("close", null, "SIGTERM");
    await expect(signaled.result).rejects.toThrow("exit none, signal SIGTERM");
  });
});
