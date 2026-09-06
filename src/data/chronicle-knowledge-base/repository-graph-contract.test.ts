import { describe, expect, it } from "vitest";

import { parseRepositoryGraphEnvelope, stableRepositoryGraphJson } from "./repository-graph-contract";
import { sha256Hex } from "../../lib/sha256";

const HASH = "a".repeat(64);
const NODE_A = `node:${"1".repeat(24)}`;
const NODE_B = `node:${"2".repeat(24)}`;
const EDGE = `edge:${"3".repeat(24)}`;
const COMMUNITY = `community:${"4".repeat(16)}`;

function validEnvelope() {
  const value = {
    schemaVersion: 1,
    graphId: `graph:${"5".repeat(64)}`,
    generatedAt: "2026-08-30T00:00:00.000Z",
    generator: {
      wrapperVersion: "1",
      graphifyVersion: "0.9.52",
      graphifySourceIdentity: HASH,
      toolchainIdentitySha256: HASH,
      normalizerVersion: "1",
      corpusPolicySha256: HASH,
      lensPolicySha256: HASH,
      directed: true,
    },
    source: {
      repositoryHead: "6".repeat(40),
      corpusFingerprintSha256: "",
      dirty: false,
      paths: [
        { path: "src/a.ts", sha256: HASH, state: "present", bytes: 10, mode: 33188 },
        { path: "src/deleted.ts", sha256: null, state: "deleted", bytes: 0, mode: null },
      ],
    },
    graph: {
      nodes: [
        {
          id: NODE_A,
          upstreamId: "a",
          kind: "symbol",
          label: "a",
          qualifiedName: "a",
          fileType: "typescript",
          sourcePath: "src/a.ts",
          sourceLocation: "L1",
          origin: "ast",
          callable: true,
          communityIds: [COMMUNITY],
        },
        {
          id: NODE_B,
          upstreamId: "b",
          kind: "symbol",
          label: "b",
          qualifiedName: "b",
          fileType: "typescript",
          sourcePath: "src/a.ts",
          sourceLocation: "L2",
          origin: "ast",
          callable: true,
          communityIds: [COMMUNITY],
        },
      ],
      edges: [
        {
          id: EDGE,
          source: NODE_A,
          target: NODE_B,
          relation: "CALLS",
          context: null,
          confidence: "EXTRACTED",
          confidenceScore: 1,
          sourcePath: "src/a.ts",
          sourceLocation: "L1",
          origin: "ast",
          weight: 1,
        },
      ],
      communities: [{ id: COMMUNITY, upstreamCommunity: "0", label: "Structural group 0", nodeIds: [NODE_A, NODE_B] }],
    },
    lenses: [
      {
        capabilityId: "example",
        label: "Example",
        sourcePaths: ["src/a.ts"],
        unresolvedSourcePaths: ["src/missing.ts"],
        coreNodeIds: [NODE_A],
        contextNodeIds: [NODE_B],
        edgeIds: [EDGE],
      },
    ],
  };
  value.source.corpusFingerprintSha256 = sha256Hex(stableRepositoryGraphJson({
    policySha256: value.generator.corpusPolicySha256,
    entries: value.source.paths,
  }));
  value.graphId = `graph:${sha256Hex(stableRepositoryGraphJson({
    schemaVersion: value.schemaVersion,
    generator: value.generator,
    source: value.source,
    graph: value.graph,
    lenses: value.lenses,
  }))}`;
  return value;
}

describe("repository graph contract", () => {
  it("accepts one directed, referentially complete graph envelope", () => {
    expect(parseRepositoryGraphEnvelope(validEnvelope()).graph.nodes).toHaveLength(2);
  });

  it.each([
    ["undirected graph", (value: ReturnType<typeof validEnvelope>) => { value.generator.directed = false as true; }],
    ["path traversal", (value: ReturnType<typeof validEnvelope>) => { value.graph.nodes[0].sourcePath = "../a.ts"; }],
    ["dangling edge", (value: ReturnType<typeof validEnvelope>) => { value.graph.edges[0].target = `node:${"9".repeat(24)}`; }],
    ["duplicate node", (value: ReturnType<typeof validEnvelope>) => { value.graph.nodes.push({ ...value.graph.nodes[0] }); }],
    ["orphan lens node", (value: ReturnType<typeof validEnvelope>) => { value.lenses[0].contextNodeIds = [`node:${"9".repeat(24)}`]; }],
    ["lens edge outside node set", (value: ReturnType<typeof validEnvelope>) => { value.lenses[0].contextNodeIds = []; }],
    ["community disagreement", (value: ReturnType<typeof validEnvelope>) => { value.graph.communities[0].nodeIds = [NODE_A]; }],
    ["deleted source used as mapped source", (value: ReturnType<typeof validEnvelope>) => { value.lenses[0].sourcePaths = ["src/deleted.ts"]; }],
    ["present source marked unresolved", (value: ReturnType<typeof validEnvelope>) => { value.lenses[0].unresolvedSourcePaths = ["src/a.ts"]; }],
  ])("rejects %s", (_label, mutate) => {
    const value = validEnvelope();
    mutate(value);
    expect(() => parseRepositoryGraphEnvelope(value)).toThrow();
  });

  it("serializes object keys deterministically", () => {
    expect(stableRepositoryGraphJson({ b: 2, a: { d: 4, c: 3 } })).toBe('{"a":{"c":3,"d":4},"b":2}');
    expect(sha256Hex("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });
});
