import type {
  RepositoryGraphCommunity,
  RepositoryGraphEdge,
  RepositoryGraphNode,
} from "./repository-graph-contract";

export type RepositoryGraphViewState =
  | "ready-current"
  | "ready-stale"
  | "refreshing"
  | "unavailable"
  | "error";

export type RepositoryGraphViewPayload = Readonly<{
  schemaVersion: 1;
  state: RepositoryGraphViewState;
  graphId: string | null;
  generatedAt: string | null;
  reasons: readonly string[];
  counts: Readonly<{ nodes: number; edges: number; communities: number; lenses: number }> | null;
  capability: Readonly<{
    id: string;
    label: string;
    sourcePaths: readonly string[];
    unresolvedSourcePaths: readonly string[];
    coreNodeIds: readonly string[];
    contextNodeIds: readonly string[];
  }> | null;
  nodes: readonly RepositoryGraphNode[];
  edges: readonly RepositoryGraphEdge[];
  communities: readonly RepositoryGraphCommunity[];
}>;

export async function loadRepositoryGraphView(
  capabilityId: string | null,
  signal?: AbortSignal,
): Promise<RepositoryGraphViewPayload> {
  const search = new URLSearchParams();
  if (capabilityId) search.set("capability", capabilityId);
  const response = await fetch(
    `/__chronicle-repository-graph/view${search.size ? `?${search.toString()}` : ""}`,
    { method: "GET", cache: "no-store", signal },
  );
  if (!response.ok) throw new Error(`Repository graph request failed with status ${response.status}.`);
  const value = await response.json() as Partial<RepositoryGraphViewPayload>;
  if (
    value.schemaVersion !== 1 ||
    typeof value.state !== "string" ||
    !Array.isArray(value.nodes) ||
    !Array.isArray(value.edges) ||
    !Array.isArray(value.communities)
  ) {
    throw new Error("Repository graph response is malformed.");
  }
  return value as RepositoryGraphViewPayload;
}
