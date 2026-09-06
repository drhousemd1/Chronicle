import type { RepositoryGraphEnvelope } from "../../src/data/chronicle-knowledge-base/repository-graph-contract";

function boundedLimit(value: number | undefined, fallback: number, maximum: number) {
  const limit = value ?? fallback;
  if (!Number.isInteger(limit) || limit < 1 || limit > maximum) {
    throw new Error(`Repository graph query limit must be between 1 and ${maximum}.`);
  }
  return limit;
}

export function queryRepositoryGraph(
  envelope: RepositoryGraphEnvelope,
  literal: string,
  options: Readonly<{ limit?: number }> = {},
) {
  const query = literal.trim().toLocaleLowerCase();
  if (query.length < 2 || query.length > 200) throw new Error("Repository graph query must contain 2 to 200 characters.");
  const limit = boundedLimit(options.limit, 20, 100);
  return envelope.graph.nodes
    .map((node) => {
      const fields = [node.label, node.qualifiedName, node.sourcePath, node.kind, node.fileType];
      const exact = fields.some((value) => value.toLocaleLowerCase() === query);
      const prefix = fields.some((value) => value.toLocaleLowerCase().startsWith(query));
      const contains = fields.some((value) => value.toLocaleLowerCase().includes(query));
      return { node, score: exact ? 3 : prefix ? 2 : contains ? 1 : 0 };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.node.label.localeCompare(right.node.label) || left.node.id.localeCompare(right.node.id))
    .slice(0, limit)
    .map((entry) => entry.node);
}

export function shortestRepositoryGraphPath(
  envelope: RepositoryGraphEnvelope,
  fromNodeId: string,
  toNodeId: string,
  options: Readonly<{ maxDepth?: number; maxVisited?: number }> = {},
) {
  const maxDepth = boundedLimit(options.maxDepth, 8, 20);
  const maxVisited = boundedLimit(options.maxVisited, 5000, 20000);
  const nodes = new Map(envelope.graph.nodes.map((node) => [node.id, node]));
  if (!nodes.has(fromNodeId) || !nodes.has(toNodeId)) throw new Error("Repository graph path endpoints must identify existing nodes.");
  const outbound = new Map<string, typeof envelope.graph.edges>();
  for (const edge of envelope.graph.edges) {
    outbound.set(edge.source, [...(outbound.get(edge.source) ?? []), edge]);
  }
  const queue: Array<{ nodeId: string; nodeIds: string[]; edgeIds: string[] }> = [
    { nodeId: fromNodeId, nodeIds: [fromNodeId], edgeIds: [] },
  ];
  const visited = new Set([fromNodeId]);
  while (queue.length > 0) {
    if (visited.size > maxVisited) throw new Error("Repository graph path exceeded the visited-node limit.");
    const current = queue.shift()!;
    if (current.nodeId === toNodeId) return Object.freeze({ nodeIds: current.nodeIds, edgeIds: current.edgeIds });
    if (current.edgeIds.length >= maxDepth) continue;
    for (const edge of (outbound.get(current.nodeId) ?? []).slice().sort((left, right) => left.id.localeCompare(right.id))) {
      if (visited.has(edge.target)) continue;
      if (visited.size >= maxVisited) throw new Error("Repository graph path exceeded the visited-node limit.");
      visited.add(edge.target);
      queue.push({
        nodeId: edge.target,
        nodeIds: [...current.nodeIds, edge.target],
        edgeIds: [...current.edgeIds, edge.id],
      });
    }
  }
  return null;
}

export function explainRepositoryGraphNode(
  envelope: RepositoryGraphEnvelope,
  nodeId: string,
  options: Readonly<{ edgeLimit?: number }> = {},
) {
  const node = envelope.graph.nodes.find((candidate) => candidate.id === nodeId);
  if (!node) throw new Error(`Unknown repository graph node ${JSON.stringify(nodeId)}.`);
  const edgeLimit = boundedLimit(options.edgeLimit, 30, 100);
  const edges = envelope.graph.edges
    .filter((edge) => edge.source === nodeId || edge.target === nodeId)
    .sort((left, right) => left.id.localeCompare(right.id))
    .slice(0, edgeLimit);
  const nodeIds = new Set(edges.flatMap((edge) => [edge.source, edge.target]));
  nodeIds.delete(nodeId);
  const neighbors = envelope.graph.nodes
    .filter((candidate) => nodeIds.has(candidate.id))
    .sort((left, right) => left.label.localeCompare(right.label) || left.id.localeCompare(right.id));
  return Object.freeze({ node, edges, neighbors });
}
