import { createHash } from "node:crypto";

import { z } from "zod";

import {
  isSafeRepositoryGraphPath,
  parseRepositoryGraphEnvelope,
  stableRepositoryGraphJson,
  type CapabilityGraphLens,
  type RepositoryGraphCommunity,
  type RepositoryGraphEdge,
  type RepositoryGraphEnvelope,
  type RepositoryGraphNode,
} from "../../src/data/chronicle-knowledge-base/repository-graph-contract";
import type { RepositoryGraphSourceEntry } from "./corpus";

const GRAPHIFY_VERSION = "0.9.52";
const GRAPHIFY_SOURCE_IDENTITY = "5588ea9af433a8cf74ada89dfc0b981abf596a1327a1375fdaf661905562bf44";
const WRAPPER_VERSION = "1";
const forbiddenRawKeys = /^(?:body|content|source_code|text|prompt|embedding|secret|token|password)$/i;
const secretCanary = ["CHRONICLE", "GRAPH", "SECRET", "CANARY"].join("_");
const forbiddenRawContent = new RegExp(`(?:/Users/|/home/|\\\\Users\\\\|-----BEGIN [A-Z ]*PRIVATE KEY-----|${secretCanary})`);
const forbiddenCanonicalContent = [
  new RegExp(`(?:/Users/|/home/|\\\\Users\\\\|-----BEGIN [A-Z ]*PRIVATE KEY-----|${secretCanary}|\\bAKIA[0-9A-Z]{16}\\b)`),
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
] as const;

const rawNodeSchema = z
  .object({
    id: z.union([z.string().max(500), z.number()]).transform(String),
    label: z.string().min(1).max(500),
    file_type: z.string().max(100).default("code"),
    source_file: z.string().max(500).nullable().optional(),
    source_location: z.string().max(50).nullable().optional(),
    _callable: z.boolean().optional(),
    _origin: z.string().max(100).optional(),
    community: z.union([z.string().max(200), z.number()]).optional(),
    community_name: z.string().max(300).optional(),
  })
  .passthrough();

const rawEdgeSchema = z
  .object({
    source: z.union([z.string(), z.number()]).transform(String),
    target: z.union([z.string(), z.number()]).transform(String),
    relation: z.string().min(1).max(200),
    context: z.string().max(2000).optional(),
    confidence: z.string().max(100).optional(),
    confidence_score: z.number().optional(),
    source_file: z.string().max(500).nullable().optional(),
    source_location: z.string().max(50).nullable().optional(),
    weight: z.number().optional(),
    _origin: z.string().max(100).optional(),
  })
  .passthrough();

const rawGraphSchema = z
  .object({
    nodes: z.array(rawNodeSchema).max(250_000),
    edges: z.array(rawEdgeSchema).max(1_000_000).optional(),
    links: z.array(rawEdgeSchema).max(1_000_000).optional(),
    hyperedges: z.array(z.unknown()).max(250_000).optional(),
  })
  .passthrough();

function sha256(value: string | Buffer) {
  return createHash("sha256").update(value).digest("hex");
}

function shortId(prefix: "node" | "edge" | "community", value: unknown, length: number) {
  return `${prefix}:${sha256(stableRepositoryGraphJson(value)).slice(0, length)}`;
}

function normalizeLocation(value: string | null | undefined) {
  if (!value) return null;
  const match = value.match(/^L\d+(?:-L\d+)?$/);
  if (!match) throw new Error(`Graphify emitted an unsupported source location ${JSON.stringify(value)}.`);
  return value;
}

function normalizeOrigin(value: string | undefined): "ast" | "sql" | "graphify" {
  if (value === "ast") return "ast";
  if (value === "sql") return "sql";
  return "graphify";
}

function normalizeConfidence(value: string | undefined): "EXTRACTED" | "INFERRED" | "AMBIGUOUS" {
  if (value === "INFERRED" || value === "AMBIGUOUS") return value;
  return "EXTRACTED";
}

function assertRawObjectIsSafe(value: unknown, location = "root", depth = 0) {
  if (depth > 30) throw new Error(`Graphify raw output exceeds the maximum nesting depth at ${location}.`);
  if (typeof value === "string" && forbiddenRawContent.test(value)) {
    throw new Error(`Graphify raw output contains a forbidden private value at ${location}.`);
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertRawObjectIsSafe(entry, `${location}[${index}]`, depth + 1));
    return;
  }
  if (value !== null && typeof value === "object") {
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      if (forbiddenRawKeys.test(key)) throw new Error(`Graphify raw output contains forbidden field ${location}.${key}.`);
      assertRawObjectIsSafe(entry, `${location}.${key}`, depth + 1);
    }
  }
}

function assertCanonicalObjectIsSafe(value: unknown, location = "root") {
  if (typeof value === "string" && forbiddenCanonicalContent.some((pattern) => pattern.test(value))) {
    throw new Error(`Normalized repository graph contains a forbidden private value at ${location}.`);
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertCanonicalObjectIsSafe(entry, `${location}[${index}]`));
    return;
  }
  if (value !== null && typeof value === "object") {
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      assertCanonicalObjectIsSafe(entry, `${location}.${key}`);
    }
  }
}

export function normalizeGraphifyOutput({
  extraction,
  clustered,
  generatedAt,
  repositoryHead,
  dirty,
  sourceEntries,
  corpusFingerprintSha256,
  corpusPolicySha256,
  lensPolicySha256,
  toolchainIdentitySha256,
  normalizerVersion,
  lenses = [],
}: Readonly<{
  extraction: unknown;
  clustered: unknown;
  generatedAt: string;
  repositoryHead: string;
  dirty: boolean;
  sourceEntries: readonly RepositoryGraphSourceEntry[];
  corpusFingerprintSha256: string;
  corpusPolicySha256: string;
  lensPolicySha256: string;
  toolchainIdentitySha256: string;
  normalizerVersion: string;
  lenses?: readonly CapabilityGraphLens[];
}>): RepositoryGraphEnvelope {
  assertRawObjectIsSafe(extraction, "extraction");
  assertRawObjectIsSafe(clustered, "clustered");
  const raw = rawGraphSchema.parse(extraction);
  const clusteredGraph = rawGraphSchema.parse(clustered);
  const presentPaths = new Set(sourceEntries.filter((entry) => entry.state === "present").map((entry) => entry.path));
  const extractionIds = raw.nodes.map((node) => node.id);
  const clusteredIds = clusteredGraph.nodes.map((node) => node.id);
  if (new Set(extractionIds).size !== extractionIds.length) throw new Error("Graphify extraction contains duplicate node IDs.");
  if (new Set(clusteredIds).size !== clusteredIds.length) throw new Error("Graphify clustering contains duplicate node IDs.");
  const extractionIdSet = new Set(extractionIds);
  const clusteredIdSet = new Set(clusteredIds);
  if (
    extractionIdSet.size !== clusteredIdSet.size ||
    extractionIds.some((id) => !clusteredIdSet.has(id)) ||
    clusteredIds.some((id) => !extractionIdSet.has(id))
  ) {
    throw new Error("Graphify extraction and clustering node sets do not match exactly.");
  }
  const upstreamToCanonical = new Map<string, string>();
  const baseNodeById = new Map<string, RepositoryGraphNode>();
  for (const node of raw.nodes) {
    const sourcePath = node.source_file?.split("\\").join("/") ?? "";
    // Graphify also emits external package/module placeholders that have no
    // repository source. Chronicle's graph is intentionally source-backed, so
    // those nodes (and their incident edges) remain private raw data and are
    // omitted from the published envelope.
    if (!isSafeRepositoryGraphPath(sourcePath) || !presentPaths.has(sourcePath)) continue;
    const sourceLocation = normalizeLocation(node.source_location);
    const kind: RepositoryGraphNode["kind"] =
      node._callable === true
        ? "symbol"
        : node.label === sourcePath.split("/").at(-1)
          ? "file"
          : node.file_type === "sql"
            ? "table"
            : "symbol";
    const identity = [
      kind,
      sourcePath,
      sourceLocation,
      node.label,
      node.file_type,
      normalizeOrigin(node._origin),
      node._callable === true,
    ];
    const id = shortId("node", identity, 24);
    upstreamToCanonical.set(node.id, id);
    const candidate: RepositoryGraphNode = {
      id,
      upstreamId: `graphify:${sha256(stableRepositoryGraphJson(identity))}`,
      kind,
      label: node.label,
      qualifiedName: node.label,
      fileType: node.file_type,
      sourcePath,
      sourceLocation,
      origin: normalizeOrigin(node._origin),
      callable: node._callable === true,
      communityIds: [],
    };
    const existing = baseNodeById.get(id);
    if (existing && stableRepositoryGraphJson(existing) !== stableRepositoryGraphJson(candidate)) {
      throw new Error("Chronicle normalized node identity collision detected.");
    }
    if (!existing) baseNodeById.set(id, candidate);
  }

  const rawCommunityMembers = new Map<string, string[]>();
  for (const node of clusteredGraph.nodes) {
    if (node.community === undefined) continue;
    const rawCommunity = String(node.community);
    const members = rawCommunityMembers.get(rawCommunity) ?? [];
    members.push(node.id);
    rawCommunityMembers.set(rawCommunity, members);
  }
  const communityIdsByNode = new Map<string, Set<string>>();
  const communityIdentityById = new Map<string, string>();
  const communityById = new Map<string, RepositoryGraphCommunity>();
  for (const rawMembers of rawCommunityMembers.values()) {
    const includedRawMembers = rawMembers.filter((rawId) => upstreamToCanonical.has(rawId));
    if (includedRawMembers.length === 0) continue;
    const nodeIds = [...new Set(includedRawMembers.map((rawId) => upstreamToCanonical.get(rawId)!))].sort();
    const memberIdentity = stableRepositoryGraphJson(nodeIds);
    const id = shortId("community", nodeIds, 16);
    const priorIdentity = communityIdentityById.get(id);
    if (priorIdentity && priorIdentity !== memberIdentity) throw new Error(`Chronicle normalized community identity collision detected for ${id}.`);
    communityIdentityById.set(id, memberIdentity);
    for (const nodeId of nodeIds) {
      const memberships = communityIdsByNode.get(nodeId) ?? new Set<string>();
      memberships.add(id);
      communityIdsByNode.set(nodeId, memberships);
    }
    communityById.set(id, {
      id,
      upstreamCommunity: `structural:${sha256(memberIdentity).slice(0, 16)}`,
      label: "Structural group",
      nodeIds,
    });
  }
  const communities: RepositoryGraphCommunity[] = [...communityById.values()]
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((community, index) => ({ ...community, label: `Structural group ${index + 1}` }));
  const nodes: RepositoryGraphNode[] = [...baseNodeById.values()]
    .map((node) => ({ ...node, communityIds: [...(communityIdsByNode.get(node.id) ?? [])].sort() }))
    .sort((left, right) => left.id.localeCompare(right.id));

  const edgeByIdentity = new Map<string, RepositoryGraphEdge>();
  for (const edge of raw.edges ?? raw.links ?? []) {
    const source = upstreamToCanonical.get(edge.source);
    const target = upstreamToCanonical.get(edge.target);
    if (!source || !target) continue;
    const sourcePath = edge.source_file?.split("\\").join("/") ?? "";
    if (!isSafeRepositoryGraphPath(sourcePath) || !presentPaths.has(sourcePath)) continue;
    const identity = [
      source,
      target,
      edge.relation,
      normalizeConfidence(edge.confidence),
      sourcePath,
      normalizeLocation(edge.source_location),
      normalizeOrigin(edge._origin),
    ];
    const identityKey = stableRepositoryGraphJson(identity);
    const existing = edgeByIdentity.get(identityKey);
    if (existing) {
      edgeByIdentity.set(identityKey, { ...existing, weight: existing.weight + (edge.weight ?? 1) });
      continue;
    }
    edgeByIdentity.set(identityKey, {
      id: shortId("edge", identity, 24),
      source,
      target,
      relation: edge.relation,
      context: null,
      confidence: normalizeConfidence(edge.confidence),
      confidenceScore: edge.confidence_score ?? null,
      sourcePath,
      sourceLocation: normalizeLocation(edge.source_location),
      origin: normalizeOrigin(edge._origin),
      weight: edge.weight ?? 1,
    });
  }
  const edges = [...edgeByIdentity.values()].sort((left, right) => left.id.localeCompare(right.id));

  const base = {
    schemaVersion: 1 as const,
    generator: {
      wrapperVersion: WRAPPER_VERSION,
      graphifyVersion: GRAPHIFY_VERSION as "0.9.52",
      graphifySourceIdentity: GRAPHIFY_SOURCE_IDENTITY,
      toolchainIdentitySha256,
      normalizerVersion,
      corpusPolicySha256,
      lensPolicySha256,
      directed: true as const,
    },
    source: {
      repositoryHead,
      corpusFingerprintSha256,
      dirty,
      paths: [...sourceEntries],
    },
    graph: { nodes, edges, communities },
    lenses: [...lenses],
  };
  assertCanonicalObjectIsSafe(base);
  const graphId = `graph:${sha256(stableRepositoryGraphJson(base))}`;
  return parseRepositoryGraphEnvelope({ ...base, graphId, generatedAt });
}
