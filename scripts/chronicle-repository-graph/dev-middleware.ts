import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";

import type { getRepositoryGraphRuntimeStatus } from "./cli";
import { getRepositoryGraphAutoRefreshStatus } from "./auto-refresh";

const API_ROOT = "/__chronicle-repository-graph";
const STATUS_PATH = `${API_ROOT}/status`;
const VIEW_PATH = `${API_ROOT}/view`;
const NODE_PATH_PREFIX = `${API_ROOT}/node/`;
const SAFE_CAPABILITY = /^[a-z0-9][a-z0-9-]{0,99}$/;
const SAFE_NODE = /^node:[a-f0-9]{24}$/;

function isLoopbackRequest(request: IncomingMessage) {
  const address = request.socket.remoteAddress ?? "";
  return address === "127.0.0.1" || address === "::1" || address === "::ffff:127.0.0.1";
}

function isCrossOriginBrowserRequest(request: IncomingMessage) {
  const fetchSite = request.headers?.["sec-fetch-site"];
  if (fetchSite === "cross-site" || fetchSite === "same-site") return true;
  const origin = request.headers?.origin;
  if (origin === undefined) return false;
  if (typeof origin !== "string" || typeof request.headers.host !== "string") return true;
  try {
    const protocol = (request.socket as { encrypted?: boolean }).encrypted ? "https:" : "http:";
    return new URL(origin).origin !== `${protocol}//${request.headers.host}`;
  } catch {
    return true;
  }
}

function sendJson(response: ServerResponse, statusCode: number, value: unknown, headOnly = false) {
  const bytes = Buffer.from(`${JSON.stringify(value)}\n`, "utf8");
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Content-Length", String(bytes.byteLength));
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.end(headOnly ? undefined : bytes);
}

function runtimeSummary(status: Awaited<ReturnType<typeof getRepositoryGraphRuntimeStatus>>) {
  const currentGraph = status.state === "ready-current" ? status.graph : null;
  return {
    schemaVersion: 1,
    state: status.state,
    graphId: status.graph?.graphId ?? null,
    generatedAt: status.graph?.generatedAt ?? null,
    reasons: status.reasons,
    counts: currentGraph
      ? {
          nodes: currentGraph.graph.nodes.length,
          edges: currentGraph.graph.edges.length,
          communities: currentGraph.graph.communities.length,
          lenses: currentGraph.lenses.length,
        }
      : null,
  };
}

function graphView(status: Awaited<ReturnType<typeof getRepositoryGraphRuntimeStatus>>, capabilityId: string | null) {
  if (status.state !== "ready-current" || !status.graph) {
    return { ...runtimeSummary(status), capability: null, nodes: [], edges: [], communities: [] };
  }
  const lens = capabilityId
    ? status.graph.lenses.find((entry) => entry.capabilityId === capabilityId)
    : null;
  if (capabilityId && !lens) return null;
  const nodeIds = lens ? new Set([...lens.coreNodeIds, ...lens.contextNodeIds]) : null;
  const edgeIds = lens ? new Set(lens.edgeIds) : null;
  const nodes = nodeIds ? status.graph.graph.nodes.filter((node) => nodeIds.has(node.id)) : status.graph.graph.nodes;
  const edges = edgeIds ? status.graph.graph.edges.filter((edge) => edgeIds.has(edge.id)) : status.graph.graph.edges;
  const selectedNodeIds = new Set(nodes.map((node) => node.id));
  const communities = status.graph.graph.communities
    .map((community) => ({ ...community, nodeIds: community.nodeIds.filter((nodeId) => selectedNodeIds.has(nodeId)) }))
    .filter((community) => community.nodeIds.length > 0);
  return {
    ...runtimeSummary(status),
    capability: lens
      ? {
          id: lens.capabilityId,
          label: lens.label,
          sourcePaths: lens.sourcePaths,
          unresolvedSourcePaths: lens.unresolvedSourcePaths,
          coreNodeIds: lens.coreNodeIds,
          contextNodeIds: lens.contextNodeIds,
        }
      : null,
    nodes,
    edges,
    communities,
  };
}

async function handleRepositoryGraphRequest(
  repositoryRoot: string,
  request: IncomingMessage,
  response: ServerResponse,
  readRuntimeStatus = getRepositoryGraphAutoRefreshStatus,
) {
  const requestUrl = new URL(request.url ?? "/", "http://localhost");
  const isGraphRoute = requestUrl.pathname === STATUS_PATH || requestUrl.pathname === VIEW_PATH || requestUrl.pathname.startsWith(NODE_PATH_PREFIX);
  if (!isGraphRoute) return false;
  if (!isLoopbackRequest(request)) {
    sendJson(response, 403, { error: "repository_graph_is_loopback_only" });
    return true;
  }
  if (isCrossOriginBrowserRequest(request)) {
    sendJson(response, 403, { error: "repository_graph_is_same_origin_only" }, request.method === "HEAD");
    return true;
  }
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.setHeader("Allow", "GET, HEAD");
    sendJson(response, 405, { error: "method_not_allowed" });
    return true;
  }
  const headOnly = request.method === "HEAD";
  const capabilityId = requestUrl.pathname === VIEW_PATH ? requestUrl.searchParams.get("capability") : null;
  if (requestUrl.pathname === VIEW_PATH && requestUrl.searchParams.has("capability") && (
    requestUrl.searchParams.getAll("capability").length !== 1 || !capabilityId || !SAFE_CAPABILITY.test(capabilityId)
  )) {
    sendJson(response, 400, { error: "invalid_capability" }, headOnly);
    return true;
  }
  let nodeId: string | null = null;
  if (requestUrl.pathname.startsWith(NODE_PATH_PREFIX)) {
    try {
      nodeId = decodeURIComponent(requestUrl.pathname.slice(NODE_PATH_PREFIX.length));
    } catch {
      sendJson(response, 400, { error: "invalid_node" }, headOnly);
      return true;
    }
    if (!SAFE_NODE.test(nodeId)) {
      sendJson(response, 400, { error: "invalid_node" }, headOnly);
      return true;
    }
  }
  try {
    const status = await readRuntimeStatus(repositoryRoot, !headOnly);
    if (requestUrl.pathname === STATUS_PATH) {
      sendJson(response, 200, runtimeSummary(status), headOnly);
      return true;
    }
    if (requestUrl.pathname === VIEW_PATH) {
      const view = graphView(status, capabilityId);
      if (!view) {
        sendJson(response, 404, { error: "capability_lens_not_available" }, headOnly);
        return true;
      }
      sendJson(response, 200, view, headOnly);
      return true;
    }
    if (status.state !== "ready-current" || !status.graph) {
      sendJson(response, 409, {
        error: "repository_graph_not_current",
        ...runtimeSummary(status),
      }, headOnly);
      return true;
    }
    const node = status.graph.graph.nodes.find((entry) => entry.id === nodeId);
    if (!node) {
      sendJson(response, 404, { error: "node_not_found" }, headOnly);
      return true;
    }
    const edges = status.graph!.graph.edges.filter((edge) => edge.source === nodeId || edge.target === nodeId).slice(0, 500);
    const connectedIds = new Set(edges.flatMap((edge) => [edge.source, edge.target]));
    sendJson(response, 200, {
      ...runtimeSummary(status),
      node,
      edges,
      connectedNodes: status.graph!.graph.nodes.filter((entry) => connectedIds.has(entry.id)),
      truncated: status.graph!.graph.edges.filter((edge) => edge.source === nodeId || edge.target === nodeId).length > edges.length,
    }, headOnly);
    return true;
  } catch {
    sendJson(response, 500, { error: "repository_graph_unavailable" }, headOnly);
    return true;
  }
}

export function repositoryGraphDevPlugin(): Plugin {
  return {
    name: "chronicle-repository-graph-dev",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        if (!(await handleRepositoryGraphRequest(server.config.root, request, response))) next();
      });
    },
  };
}

export const repositoryGraphDevPaths = Object.freeze({ status: STATUS_PATH, view: VIEW_PATH, nodePrefix: NODE_PATH_PREFIX });
export { handleRepositoryGraphRequest };
