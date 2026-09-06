import { z } from "zod";

import { sha256Hex } from "../../lib/sha256";

const SHA256 = /^[a-f0-9]{64}$/;
const GRAPH_ID = /^graph:[a-f0-9]{64}$/;
const NODE_ID = /^node:[a-f0-9]{24}$/;
const EDGE_ID = /^edge:[a-f0-9]{24}$/;
const COMMUNITY_ID = /^community:[a-f0-9]{16}$/;

export function isSafeRepositoryGraphPath(value: string) {
  return (
    value.length > 0 &&
    value.length <= 500 &&
    !value.startsWith("/") &&
    !value.startsWith("~") &&
    !value.includes("\\") &&
    !value.includes("\0") &&
    value.split("/").every((part) => part !== "" && part !== "." && part !== "..")
  );
}

const repositoryPathSchema = z.string().refine(isSafeRepositoryGraphPath, {
  message: "must be a normalized repository-relative POSIX path",
});

const graphNodeSchema = z
  .object({
    id: z.string().regex(NODE_ID),
    upstreamId: z.string().trim().min(1).max(500),
    kind: z.enum(["file", "symbol", "table", "module", "unknown"]),
    label: z.string().trim().min(1).max(500),
    qualifiedName: z.string().trim().min(1).max(1000),
    fileType: z.string().trim().min(1).max(100),
    sourcePath: repositoryPathSchema,
    sourceLocation: z.string().regex(/^L\d+(?:-L\d+)?$/).nullable(),
    origin: z.enum(["ast", "sql", "graphify"]),
    callable: z.boolean(),
    communityIds: z.array(z.string().regex(COMMUNITY_ID)),
  })
  .strict();

const graphEdgeSchema = z
  .object({
    id: z.string().regex(EDGE_ID),
    source: z.string().regex(NODE_ID),
    target: z.string().regex(NODE_ID),
    relation: z.string().trim().min(1).max(200),
    context: z.string().trim().min(1).max(300).nullable(),
    confidence: z.enum(["EXTRACTED", "INFERRED", "AMBIGUOUS"]),
    confidenceScore: z.number().min(0).max(1).nullable(),
    sourcePath: repositoryPathSchema,
    sourceLocation: z.string().regex(/^L\d+(?:-L\d+)?$/).nullable(),
    origin: z.enum(["ast", "sql", "graphify"]),
    weight: z.number().finite().nonnegative(),
  })
  .strict();

const graphCommunitySchema = z
  .object({
    id: z.string().regex(COMMUNITY_ID),
    upstreamCommunity: z.string().trim().min(1).max(200),
    label: z.string().trim().min(1).max(300),
    nodeIds: z.array(z.string().regex(NODE_ID)).min(1),
  })
  .strict();

const capabilityLensSchema = z
  .object({
    capabilityId: z.string().trim().min(1).max(100),
    label: z.string().trim().min(1).max(200),
    sourcePaths: z.array(repositoryPathSchema),
    unresolvedSourcePaths: z.array(repositoryPathSchema),
    coreNodeIds: z.array(z.string().regex(NODE_ID)),
    contextNodeIds: z.array(z.string().regex(NODE_ID)),
    edgeIds: z.array(z.string().regex(EDGE_ID)),
  })
  .strict();

export const repositoryGraphEnvelopeSchema = z
  .object({
    schemaVersion: z.literal(1),
    graphId: z.string().regex(GRAPH_ID),
    generatedAt: z.string().datetime({ offset: true }),
    generator: z
      .object({
        wrapperVersion: z.string().trim().min(1),
        graphifyVersion: z.literal("0.9.52"),
        graphifySourceIdentity: z.string().regex(SHA256),
        toolchainIdentitySha256: z.string().regex(SHA256),
        normalizerVersion: z.string().trim().min(1),
        corpusPolicySha256: z.string().regex(SHA256),
        lensPolicySha256: z.string().regex(SHA256),
        directed: z.literal(true),
      })
      .strict(),
    source: z
      .object({
        repositoryHead: z.string().regex(/^[a-f0-9]{40}$/),
        corpusFingerprintSha256: z.string().regex(SHA256),
        dirty: z.boolean(),
        paths: z.array(
          z
            .object({
              path: repositoryPathSchema,
              sha256: z.string().regex(SHA256).nullable(),
              state: z.enum(["present", "deleted"]),
              bytes: z.number().int().nonnegative(),
              mode: z.number().int().nonnegative().nullable(),
            })
            .strict()
            .superRefine((value, context) => {
              if (value.state === "present" && value.sha256 === null) {
                context.addIssue({ code: z.ZodIssueCode.custom, path: ["sha256"], message: "is required for a present source" });
              }
              if (value.state === "deleted" && (value.sha256 !== null || value.bytes !== 0 || value.mode !== null)) {
                context.addIssue({ code: z.ZodIssueCode.custom, message: "a deleted source must have null sha256, null mode, and zero bytes" });
              }
            }),
        ),
      })
      .strict(),
    graph: z
      .object({
        nodes: z.array(graphNodeSchema),
        edges: z.array(graphEdgeSchema),
        communities: z.array(graphCommunitySchema),
      })
      .strict(),
    lenses: z.array(capabilityLensSchema),
  })
  .strict()
  .superRefine((value, context) => {
    const expectedCorpusFingerprint = sha256Hex(stableRepositoryGraphJson({
      policySha256: value.generator.corpusPolicySha256,
      entries: value.source.paths,
    }));
    if (value.source.corpusFingerprintSha256 !== expectedCorpusFingerprint) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["source", "corpusFingerprintSha256"], message: "does not authenticate the recorded corpus" });
    }
    const expectedGraphId = `graph:${sha256Hex(stableRepositoryGraphJson({
      schemaVersion: value.schemaVersion,
      generator: value.generator,
      source: value.source,
      graph: value.graph,
      lenses: value.lenses,
    }))}`;
    if (value.graphId !== expectedGraphId) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["graphId"], message: "does not authenticate the graph envelope" });
    }
    const unique = (values: readonly string[], label: string) => {
      const seen = new Set<string>();
      for (const entry of values) {
        if (seen.has(entry)) context.addIssue({ code: z.ZodIssueCode.custom, message: `duplicate ${label} ${entry}` });
        seen.add(entry);
      }
      return seen;
    };
    const sourcePaths = unique(value.source.paths.map((entry) => entry.path), "source path");
    const presentSourcePaths = new Set(value.source.paths.filter((entry) => entry.state === "present").map((entry) => entry.path));
    const nodeIds = unique(value.graph.nodes.map((entry) => entry.id), "node ID");
    const upstreamIds = unique(value.graph.nodes.map((entry) => entry.upstreamId), "upstream node ID");
    const edgeIds = unique(value.graph.edges.map((entry) => entry.id), "edge ID");
    const communityIds = unique(value.graph.communities.map((entry) => entry.id), "community ID");
    unique(value.lenses.map((entry) => entry.capabilityId), "capability lens");
    for (const node of value.graph.nodes) {
      unique(node.communityIds, `community on node ${node.id}`);
      if (!presentSourcePaths.has(node.sourcePath)) context.addIssue({ code: z.ZodIssueCode.custom, message: `node ${node.id} references unavailable source ${node.sourcePath}` });
      for (const communityId of node.communityIds) {
        if (!communityIds.has(communityId)) context.addIssue({ code: z.ZodIssueCode.custom, message: `node ${node.id} references missing community ${communityId}` });
        const community = value.graph.communities.find((entry) => entry.id === communityId);
        if (community && !community.nodeIds.includes(node.id)) context.addIssue({ code: z.ZodIssueCode.custom, message: `node ${node.id} and community ${communityId} disagree about membership` });
      }
    }
    for (const edge of value.graph.edges) {
      if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) context.addIssue({ code: z.ZodIssueCode.custom, message: `edge ${edge.id} has a missing endpoint` });
      if (!presentSourcePaths.has(edge.sourcePath)) context.addIssue({ code: z.ZodIssueCode.custom, message: `edge ${edge.id} references unavailable source ${edge.sourcePath}` });
    }
    for (const community of value.graph.communities) {
      unique(community.nodeIds, `node in community ${community.id}`);
      for (const nodeId of community.nodeIds) {
        if (!nodeIds.has(nodeId)) context.addIssue({ code: z.ZodIssueCode.custom, message: `community ${community.id} references missing node ${nodeId}` });
        const node = value.graph.nodes.find((entry) => entry.id === nodeId);
        if (node && !node.communityIds.includes(community.id)) context.addIssue({ code: z.ZodIssueCode.custom, message: `community ${community.id} and node ${nodeId} disagree about membership` });
      }
    }
    for (const lens of value.lenses) {
      unique([...lens.sourcePaths, ...lens.unresolvedSourcePaths], `source path in ${lens.capabilityId}`);
      unique([...lens.coreNodeIds, ...lens.contextNodeIds], `node in ${lens.capabilityId}`);
      for (const sourcePath of lens.sourcePaths) if (!presentSourcePaths.has(sourcePath)) context.addIssue({ code: z.ZodIssueCode.custom, message: `lens ${lens.capabilityId} maps unavailable source ${sourcePath}` });
      for (const sourcePath of lens.unresolvedSourcePaths) if (presentSourcePaths.has(sourcePath)) context.addIssue({ code: z.ZodIssueCode.custom, message: `lens ${lens.capabilityId} marks present source ${sourcePath} as unresolved` });
      for (const nodeId of [...lens.coreNodeIds, ...lens.contextNodeIds]) if (!nodeIds.has(nodeId)) context.addIssue({ code: z.ZodIssueCode.custom, message: `lens ${lens.capabilityId} references missing node ${nodeId}` });
      const lensNodeIds = new Set([...lens.coreNodeIds, ...lens.contextNodeIds]);
      for (const edgeId of lens.edgeIds) {
        if (!edgeIds.has(edgeId)) context.addIssue({ code: z.ZodIssueCode.custom, message: `lens ${lens.capabilityId} references missing edge ${edgeId}` });
        const edge = value.graph.edges.find((entry) => entry.id === edgeId);
        if (edge && (!lensNodeIds.has(edge.source) || !lensNodeIds.has(edge.target))) context.addIssue({ code: z.ZodIssueCode.custom, message: `lens ${lens.capabilityId} edge ${edgeId} escapes its node set` });
      }
    }
    void sourcePaths;
    void upstreamIds;
  });

export type RepositoryGraphEnvelope = z.infer<typeof repositoryGraphEnvelopeSchema>;
export type RepositoryGraphNode = RepositoryGraphEnvelope["graph"]["nodes"][number];
export type RepositoryGraphEdge = RepositoryGraphEnvelope["graph"]["edges"][number];
export type RepositoryGraphCommunity = RepositoryGraphEnvelope["graph"]["communities"][number];
export type CapabilityGraphLens = RepositoryGraphEnvelope["lenses"][number];

export function parseRepositoryGraphEnvelope(value: unknown) {
  return repositoryGraphEnvelopeSchema.parse(value);
}

export function stableRepositoryGraphJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableRepositoryGraphJson).join(",")}]`;
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableRepositoryGraphJson(entry)}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(value);
}
