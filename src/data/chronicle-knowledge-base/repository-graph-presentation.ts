import type {
  RepositoryGraphCommunity,
  RepositoryGraphEdge,
  RepositoryGraphNode,
} from "./repository-graph-contract";
import type { RepositoryGraphViewPayload } from "./repository-graph-client";

type AreaRule = Readonly<{
  label: string;
  matches: (path: string) => boolean;
}>;

export type ChronicleGraphAreaDefinition = Readonly<{
  id: string;
  label: string;
  color: string;
  description: string;
  coverageNote?: string;
  evidence: readonly string[];
  rules: readonly AreaRule[];
}>;

export type ChronicleGraphArea = Readonly<{
  id: string;
  label: string;
  color: string;
  description: string;
  coverageNote?: string;
  evidence: readonly string[];
  nodeCount: number;
  sourceCount: number;
  communityCount: number;
  topSourcePaths: readonly string[];
  matchedRules: readonly Readonly<{ label: string; count: number }>[];
}>;

export type ChronicleGraphAreaConnection = Readonly<{
  sourceAreaId: string;
  targetAreaId: string;
  count: number;
  relations: readonly string[];
}>;

export type ChronicleGraphPresentation = Readonly<{
  areas: readonly ChronicleGraphArea[];
  connections: readonly ChronicleGraphAreaConnection[];
  nodeAreaIds: ReadonlyMap<string, string>;
}>;

export type ChronicleAreaCommunityNode = Readonly<{
  id: string;
  label: string;
  graphifyLabel: string;
  areaNodeCount: number;
  totalNodeCount: number;
  sourceCount: number;
  exampleSourcePaths: readonly string[];
  relationshipEvidence: readonly ChronicleAreaCommunityEvidence[];
}>;

export type ChronicleAreaCommunityEvidence = Readonly<{
  direction: "incoming" | "outgoing" | "internal";
  relation: string;
  origin: RepositoryGraphEdge["origin"];
  confidence: RepositoryGraphEdge["confidence"];
  confidenceScore: number | null;
  sourcePath: string;
  sourceLocation: string | null;
  count: number;
}>;

export type ChronicleAreaCommunityConnection = Readonly<{
  sourceCommunityId: string;
  targetCommunityId: string;
  count: number;
}>;

export type ChronicleAreaCommunityPresentation = Readonly<{
  communities: readonly ChronicleAreaCommunityNode[];
  connections: readonly ChronicleAreaCommunityConnection[];
}>;

export type CapabilityGraphPresentation = Readonly<{
  entryPoint: string | null;
  majorOwners: readonly string[];
  incomingHandoffs: readonly CapabilityGraphHandoff[];
  outgoingHandoffs: readonly CapabilityGraphHandoff[];
  sharedSystems: readonly string[];
  storedDataSources: readonly string[];
  focusedTests: readonly string[];
  structuralCommunities: readonly RepositoryGraphCommunity[];
}>;

export type CapabilityGraphHandoff = Readonly<{
  path: string;
  count: number;
  relations: readonly string[];
}>;

const includes = (fragment: string) => (path: string) => path.includes(fragment);
const matches = (pattern: RegExp) => (path: string) => pattern.test(path);

// This is a production-owned presentation policy. It mirrors the user-approved
// Chronicle-area language from the preserved R&D reference without importing
// prototype code or generated R&D artifacts into the Knowledge Base.
export const CHRONICLE_GRAPH_AREAS: readonly ChronicleGraphAreaDefinition[] = [
  {
    id: "chat-interface",
    label: "Chat Interface",
    color: "#60a5fa",
    description: "The visible conversation screen, chat controls, message formatting, and chat-specific presentation behavior.",
    evidence: ["src/components/chronicle/ChatInterfaceTab.tsx", "src/features/chat-debug/"],
    rules: [
      { label: "ChatInterfaceTab", matches: includes("src/components/chronicle/chatinterfacetab") },
      { label: "Chat UI components", matches: matches(/src\/components\/chronicle\/(chat|message|conversationbubble|autoresizetextarea)/) },
      { label: "Chat debugging UI", matches: includes("src/features/chat-debug/") },
      { label: "Message presentation utilities", matches: matches(/src\/features\/chat-runtime\/(avatar-position|message-formatting|local-notices)/) },
    ],
  },
  {
    id: "api-roleplay-pipeline",
    label: "API & Roleplay Pipeline",
    color: "#a78bfa",
    description: "Prompt assembly, model calls, response processing, memory extraction, roleplay state, and Supabase Edge Function execution.",
    evidence: ["src/features/chat-runtime/", "src/services/llm.ts", "supabase/functions/chat/"],
    rules: [
      { label: "Chat runtime", matches: includes("src/features/chat-runtime/") },
      { label: "Model and roleplay services", matches: matches(/src\/services\/(llm|character-ai|side-character-generator|roleplay|api-|field-enhance)/) },
      { label: "Chat and extraction Edge Functions", matches: matches(/supabase\/functions\/(chat|extract-|generate-|enhance-|analyze-)/) },
      { label: "Shared Edge Function runtime", matches: includes("supabase/functions/_shared/") },
      { label: "Roleplay tooling", matches: matches(/scripts\/.*(roleplay|prompt|llm|model)/) },
    ],
  },
  {
    id: "story-builder",
    label: "Story Builder",
    color: "#34d399",
    description: "Story setup, world details, scenes, opening dialogue, roster composition, and story import/export.",
    evidence: ["src/features/story-builder/", "src/components/chronicle/WorldTab.tsx"],
    rules: [
      { label: "Story Builder feature", matches: includes("src/features/story-builder/") },
      { label: "World and story screens", matches: matches(/src\/components\/chronicle\/(worldtab|world|storygoals|contentthemes)/) },
      { label: "Story transfer", matches: includes("src/lib/story-transfer") },
      { label: "Story workspace hooks", matches: matches(/src\/hooks\/use-index-(story|scenario)/) },
    ],
  },
  {
    id: "character-builder",
    label: "Character Builder",
    color: "#f59e0b",
    description: "Character creation, editing, traits, goals, personality, roster selection, and library-aware character workflows.",
    evidence: ["src/features/character-builder/", "src/features/character-editor-modal/", "src/components/chronicle/CharactersTab.tsx"],
    rules: [
      { label: "Character Builder feature", matches: includes("src/features/character-builder/") },
      { label: "Character editor feature", matches: includes("src/features/character-editor-modal/") },
      { label: "Character screens and sections", matches: matches(/src\/components\/chronicle\/(characterstab|character|personality|spicerating)/) },
      { label: "Character workspace services", matches: matches(/src\/(services|hooks)\/.*character/) },
    ],
  },
  {
    id: "story-hub-sessions",
    label: "My Stories & Chat History",
    color: "#2dd4bf",
    description: "The story hub, saved scenarios, session registry, conversation history, and resume/delete workflows.",
    evidence: ["src/components/chronicle/StoryHub.tsx", "src/components/chronicle/ConversationsTab.tsx", "src/services/persistence/conversations.ts"],
    rules: [
      { label: "Story hub", matches: matches(/src\/components\/chronicle\/(scenariohub|storyhub)/) },
      { label: "Chat history", matches: matches(/src\/components\/chronicle\/(conversationstab|conversationhistory)/) },
      { label: "Scenario and conversation persistence", matches: matches(/src\/services\/persistence\/(scenarios|conversations)/) },
      { label: "Conversation registry", matches: matches(/src\/.*conversation-registry/) },
    ],
  },
  {
    id: "media-image-library",
    label: "Media & Image Library",
    color: "#f472b6",
    description: "Image generation, media settings, image folders, backgrounds, uploads, and stored visual assets.",
    evidence: ["src/components/chronicle/ImageLibraryTab.tsx", "src/components/admin/ImageGenerationTool.tsx", "src/services/persistence/media-settings.ts"],
    rules: [
      { label: "Image library", matches: includes("src/components/chronicle/imagelibrary") },
      { label: "Image generation UI", matches: matches(/src\/components\/.*imagegeneration/) },
      { label: "Media persistence", matches: includes("src/services/persistence/media-settings") },
      { label: "Media and background modules", matches: matches(/src\/.*(media|image-library|background)/) },
      { label: "Image Edge Functions", matches: matches(/supabase\/functions\/.*image/) },
    ],
  },
  {
    id: "gallery-profile-account",
    label: "Gallery, Profiles & Account",
    color: "#fb7185",
    description: "Community Gallery, published stories, bookmarks, creator profiles, account settings, and subscription-facing UI.",
    evidence: ["src/components/chronicle/GalleryHub.tsx", "src/pages/CreatorProfile.tsx", "src/components/account/"],
    rules: [
      { label: "Gallery components", matches: matches(/src\/components\/chronicle\/gallery/) },
      { label: "Gallery and creator pages", matches: matches(/src\/pages\/(gallery|creatorprofile)/) },
      { label: "Account components", matches: includes("src/components/account/") },
      { label: "Gallery and profile services", matches: matches(/src\/services\/.*(gallery|profile|bookmark|publish)/) },
      { label: "Account and subscription modules", matches: matches(/src\/.*(account|subscription)/) },
    ],
  },
  {
    id: "research-development",
    label: "Research & Development",
    color: "#22d3ee",
    description: "The Admin-only prototype workspace, coded experiments, local mock-up persistence, and generated research artifacts.",
    coverageNote: "Intentionally excluded from the production graph corpus. The preserved Graphify reference remains available in Research & Development.",
    evidence: ["src/components/admin/research-development/"],
    rules: [
      { label: "R&D prototype workspace", matches: includes("src/components/admin/research-development/") },
      { label: "R&D generated and saved artifacts", matches: includes("docs/research-development/") },
    ],
  },
  {
    id: "finance-usage",
    label: "Finance & API Usage",
    color: "#eab308",
    description: "Finance dashboards, usage accounting, provider costs, reporting, projections, and validation of API spending.",
    evidence: ["src/components/admin/finance/", "src/services/finance-dashboard/", "src/services/admin-usage-metrics.ts"],
    rules: [
      { label: "Finance UI", matches: includes("src/components/admin/finance/") },
      { label: "Finance services", matches: includes("src/services/finance-dashboard/") },
      { label: "Usage and cost modules", matches: matches(/src\/.*(usage-metrics|usage-cost|api-usage)/) },
      { label: "Usage Edge Functions", matches: matches(/supabase\/functions\/.*usage/) },
    ],
  },
  {
    id: "admin-knowledge-quality",
    label: "Admin, Knowledge & Quality",
    color: "#818cf8",
    description: "Admin tools, Chronicle Knowledge Base records, Quality Hub, validation evidence, and style or architecture reference surfaces.",
    evidence: ["src/pages/Admin.tsx", "src/data/chronicle-knowledge-base/", "src/features/quality-hub/"],
    rules: [
      { label: "Knowledge records", matches: matches(/src\/data\/chronicle-knowledge-base\//) },
      { label: "Knowledge tooling", matches: matches(/scripts\/(knowledge-records|knowledge-record|validate-architecture)/) },
      { label: "Quality and evidence features", matches: matches(/src\/features\/(quality-hub|validation-evidence)\//) },
      { label: "Style and architecture pages", matches: matches(/src\/pages\/style-guide\//) },
      { label: "Admin UI", matches: (path) => path.includes("src/components/admin/") || path === "src/pages/admin.tsx" },
    ],
  },
  {
    id: "supabase-data",
    label: "Supabase & Data Persistence",
    color: "#10b981",
    description: "Database migrations, Supabase client integration, schema inventories, and shared persistence services outside a single page owner.",
    evidence: ["supabase/migrations/", "src/integrations/supabase/", "src/services/persistence/"],
    rules: [
      { label: "Database migrations", matches: includes("supabase/migrations/") },
      { label: "Supabase integration", matches: includes("src/integrations/supabase/") },
      { label: "Schema inventories", matches: matches(/src\/data\/(database-schema|supabase-schema)/) },
      { label: "Shared persistence", matches: includes("src/services/persistence/") },
      { label: "Other Supabase modules", matches: includes("supabase/") },
    ],
  },
  {
    id: "app-shell-shared-ui",
    label: "App Shell & Shared UI",
    color: "#94a3b8",
    description: "Application composition, sidebar and top bar, reusable UI primitives, navigation contracts, and shared builder presentation.",
    evidence: ["src/pages/Index.tsx", "src/components/app-shell/", "src/components/ui/"],
    rules: [
      { label: "Application composition", matches: (path) => path === "src/pages/index.tsx" || path === "src/types.ts" },
      { label: "App shell", matches: includes("src/components/app-shell/") },
      { label: "UI primitives", matches: includes("src/components/ui/") },
      { label: "Shared builder and navigation", matches: matches(/src\/features\/(shared-builder|navigation)\//) },
      { label: "Shared libraries", matches: matches(/src\/(lib|hooks)\//) },
    ],
  },
  {
    id: "tooling-tests-build",
    label: "Tooling, Tests & Build",
    color: "#64748b",
    description: "Repository scripts, test harnesses, configuration, generated architecture inventories, and build-time tooling without a single product-page owner.",
    evidence: ["scripts/", "vite.config.ts", "package.json"],
    rules: [
      { label: "Repository scripts", matches: (path) => path.startsWith("scripts/") },
      { label: "Tests and fixtures", matches: matches(/(^|\/)(__tests__|test|tests|fixtures)(\/|\.|$)/) },
      { label: "Build configuration", matches: matches(/(^|\/)(package|vite|vitest|eslint|tsconfig|tailwind|postcss)/) },
    ],
  },
  {
    id: "shared-cross-cutting",
    label: "Shared / Cross-cutting",
    color: "#a1a1aa",
    description: "Files without one clear page owner, plus structural evidence shared across several Chronicle areas.",
    evidence: ["Deterministic fallback when no Chronicle-area path rule matches."],
    rules: [],
  },
] as const;

function normalizedSourcePath(path: string) {
  return path.replace(/^\.\//, "").toLowerCase();
}

export function classifyRepositoryGraphNode(node: RepositoryGraphNode) {
  const path = normalizedSourcePath(node.sourcePath);
  for (const area of CHRONICLE_GRAPH_AREAS.slice(0, -1)) {
    if (area.rules.some((rule) => rule.matches(path))) return area.id;
  }
  return "shared-cross-cutting";
}

function sortedCounts(values: Iterable<string>) {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));
}

export function buildChronicleGraphPresentation(
  nodes: readonly RepositoryGraphNode[],
  edges: readonly RepositoryGraphEdge[],
  communities: readonly RepositoryGraphCommunity[],
): ChronicleGraphPresentation {
  const nodeAreaIds = new Map(nodes.map((node) => [node.id, classifyRepositoryGraphNode(node)]));
  const nodesByArea = new Map<string, RepositoryGraphNode[]>();
  for (const node of nodes) {
    const areaId = nodeAreaIds.get(node.id) ?? "shared-cross-cutting";
    const areaNodes = nodesByArea.get(areaId) ?? [];
    areaNodes.push(node);
    nodesByArea.set(areaId, areaNodes);
  }

  const areas = CHRONICLE_GRAPH_AREAS.map((definition) => {
    const areaNodes = nodesByArea.get(definition.id) ?? [];
    const sourceCounts = sortedCounts(areaNodes.map((node) => node.sourcePath));
    const areaNodeIds = new Set(areaNodes.map((node) => node.id));
    return {
      id: definition.id,
      label: definition.label,
      color: definition.color,
      description: definition.description,
      coverageNote: definition.coverageNote,
      evidence: definition.evidence,
      nodeCount: areaNodes.length,
      sourceCount: sourceCounts.length,
      communityCount: communities.filter((community) => community.nodeIds.some((nodeId) => areaNodeIds.has(nodeId))).length,
      topSourcePaths: sourceCounts.slice(0, 8).map(([path]) => path),
      matchedRules: definition.rules
        .map((rule) => ({
          label: rule.label,
          count: areaNodes.filter((node) => rule.matches(normalizedSourcePath(node.sourcePath))).length,
        }))
        .filter((rule) => rule.count > 0)
        .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label)),
    } satisfies ChronicleGraphArea;
  });

  const connectionCounts = new Map<string, { count: number; relations: Set<string> }>();
  for (const edge of edges) {
    const sourceAreaId = nodeAreaIds.get(edge.source);
    const targetAreaId = nodeAreaIds.get(edge.target);
    if (!sourceAreaId || !targetAreaId || sourceAreaId === targetAreaId) continue;
    const key = `${sourceAreaId}\0${targetAreaId}`;
    const connection = connectionCounts.get(key) ?? { count: 0, relations: new Set<string>() };
    connection.count += 1;
    connection.relations.add(edge.relation);
    connectionCounts.set(key, connection);
  }

  const connections = [...connectionCounts.entries()]
    .map(([key, value]) => {
      const [sourceAreaId, targetAreaId] = key.split("\0");
      return {
        sourceAreaId,
        targetAreaId,
        count: value.count,
        relations: [...value.relations].sort(),
      } satisfies ChronicleGraphAreaConnection;
    })
    .sort((left, right) => right.count - left.count || left.sourceAreaId.localeCompare(right.sourceAreaId));

  return { areas, connections, nodeAreaIds };
}

export function buildChronicleAreaCommunityPresentation(
  areaId: string,
  nodes: readonly RepositoryGraphNode[],
  edges: readonly RepositoryGraphEdge[],
  communities: readonly RepositoryGraphCommunity[],
  nodeAreaIds: ReadonlyMap<string, string>,
): ChronicleAreaCommunityPresentation {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const areaNodeIds = new Set(nodes.filter((node) => nodeAreaIds.get(node.id) === areaId).map((node) => node.id));

  const readableOwnerLabel = (sourcePath: string | undefined, fallback: string) => {
    if (!sourcePath) return fallback;
    const withoutExtension = sourcePath.replace(/\.[^./]+$/, "");
    const segments = withoutExtension.replace(/^src\//, "").split("/");
    return segments.slice(Math.max(0, segments.length - 3)).join(" / ");
  };

  const communityNodes = communities
    .map((community) => {
      const matchingNodeIds = community.nodeIds.filter((nodeId) => areaNodeIds.has(nodeId));
      const matchingNodeIdSet = new Set(matchingNodeIds);
      const sourceCounts = sortedCounts(
        matchingNodeIds
          .map((nodeId) => nodeById.get(nodeId)?.sourcePath)
          .filter((path): path is string => Boolean(path)),
      );
      const primarySourcePath = sourceCounts.find(([path]) => !/(^|\/)(__tests__|test|tests|fixtures)(\/|\.|$)|\.(test|spec)\.[cm]?[jt]sx?$/i.test(path))?.[0]
        ?? sourceCounts[0]?.[0];
      const evidenceCounts = new Map<string, ChronicleAreaCommunityEvidence>();
      for (const edge of edges) {
        const sourceMatches = matchingNodeIdSet.has(edge.source);
        const targetMatches = matchingNodeIdSet.has(edge.target);
        if (!sourceMatches && !targetMatches) continue;
        const direction = sourceMatches && targetMatches ? "internal" : sourceMatches ? "outgoing" : "incoming";
        const key = [direction, edge.relation, edge.origin, edge.confidence, edge.confidenceScore, edge.sourcePath, edge.sourceLocation ?? ""].join("\0");
        const existing = evidenceCounts.get(key);
        evidenceCounts.set(key, existing ? { ...existing, count: existing.count + 1 } : {
          direction,
          relation: edge.relation,
          origin: edge.origin,
          confidence: edge.confidence,
          confidenceScore: edge.confidenceScore,
          sourcePath: edge.sourcePath,
          sourceLocation: edge.sourceLocation,
          count: 1,
        });
      }
      return {
        id: community.id,
        label: readableOwnerLabel(primarySourcePath, community.label),
        graphifyLabel: community.label,
        areaNodeCount: matchingNodeIds.length,
        totalNodeCount: community.nodeIds.length,
        sourceCount: sourceCounts.length,
        exampleSourcePaths: sourceCounts.slice(0, 6).map(([path]) => path),
        relationshipEvidence: [...evidenceCounts.values()]
          .sort((left, right) => right.count - left.count || left.sourcePath.localeCompare(right.sourcePath))
          .slice(0, 8),
      } satisfies ChronicleAreaCommunityNode;
    })
    .filter((community) => community.areaNodeCount > 0)
    .sort((left, right) =>
      right.areaNodeCount - left.areaNodeCount ||
      right.totalNodeCount - left.totalNodeCount ||
      left.label.localeCompare(right.label),
    );

  const communityIdsByNode = new Map<string, string[]>();
  for (const community of communityNodes) {
    const sourceCommunity = communities.find((candidate) => candidate.id === community.id);
    for (const nodeId of sourceCommunity?.nodeIds ?? []) {
      if (!areaNodeIds.has(nodeId)) continue;
      const ids = communityIdsByNode.get(nodeId) ?? [];
      ids.push(community.id);
      communityIdsByNode.set(nodeId, ids);
    }
  }

  const connectionCounts = new Map<string, number>();
  for (const edge of edges) {
    if (!areaNodeIds.has(edge.source) || !areaNodeIds.has(edge.target)) continue;
    const sourceCommunityIds = communityIdsByNode.get(edge.source) ?? [];
    const targetCommunityIds = communityIdsByNode.get(edge.target) ?? [];
    for (const sourceCommunityId of sourceCommunityIds) {
      for (const targetCommunityId of targetCommunityIds) {
        if (sourceCommunityId === targetCommunityId) continue;
        const key = `${sourceCommunityId}\0${targetCommunityId}`;
        connectionCounts.set(key, (connectionCounts.get(key) ?? 0) + 1);
      }
    }
  }

  const connections = [...connectionCounts.entries()]
    .map(([key, count]) => {
      const [sourceCommunityId, targetCommunityId] = key.split("\0");
      return { sourceCommunityId, targetCommunityId, count } satisfies ChronicleAreaCommunityConnection;
    })
    .sort((left, right) => right.count - left.count || left.sourceCommunityId.localeCompare(right.sourceCommunityId));

  return { communities: communityNodes, connections };
}

function looksLikeTest(path: string) {
  return /(^|\/)(__tests__|test|tests|fixtures)(\/|\.|$)/i.test(path) || /\.(test|spec)\.[cm]?[jt]sx?$/i.test(path);
}

function looksLikeStoredData(path: string) {
  return /(supabase|migration|persistence|database|schema|storage|repository|registry)/i.test(path);
}

function looksLikeSharedSystem(path: string) {
  return /(src\/(services|hooks|lib|integrations)\/|src\/components\/(ui|app-shell)\/|supabase\/)/i.test(path);
}

function handoffsForEntry(
  payload: RepositoryGraphViewPayload,
  entryPoint: string,
) {
  const pathByNode = new Map(payload.nodes.map((node) => [node.id, node.sourcePath]));
  const incoming = new Map<string, { count: number; relations: Set<string> }>();
  const outgoing = new Map<string, { count: number; relations: Set<string> }>();
  for (const edge of payload.edges) {
    const sourcePath = pathByNode.get(edge.source);
    const targetPath = pathByNode.get(edge.target);
    if (!sourcePath || !targetPath || sourcePath === targetPath) continue;
    if (sourcePath === entryPoint) {
      const value = outgoing.get(targetPath) ?? { count: 0, relations: new Set<string>() };
      value.count += 1;
      value.relations.add(edge.relation);
      outgoing.set(targetPath, value);
    }
    if (targetPath === entryPoint) {
      const value = incoming.get(sourcePath) ?? { count: 0, relations: new Set<string>() };
      value.count += 1;
      value.relations.add(edge.relation);
      incoming.set(sourcePath, value);
    }
  }
  const convert = (values: Map<string, { count: number; relations: Set<string> }>) => [...values.entries()]
    .map(([path, value]) => ({ path, count: value.count, relations: [...value.relations].sort() }))
    .sort((left, right) => right.count - left.count || left.path.localeCompare(right.path))
    .slice(0, 5);
  return { incoming: convert(incoming), outgoing: convert(outgoing) };
}

export function buildCapabilityGraphPresentation(
  payload: RepositoryGraphViewPayload,
  preferredSourcePath?: string,
): CapabilityGraphPresentation {
  const sourcePaths = [...new Set(payload.nodes.map((node) => node.sourcePath))].sort();
  const coreNodeIds = new Set(payload.capability?.coreNodeIds ?? payload.nodes.map((node) => node.id));
  const corePaths = [...new Set(payload.nodes.filter((node) => coreNodeIds.has(node.id)).map((node) => node.sourcePath))].sort();
  const entryPoint = preferredSourcePath && sourcePaths.includes(preferredSourcePath)
    ? preferredSourcePath
    : corePaths.find((path) => !looksLikeTest(path)) ?? corePaths[0] ?? sourcePaths[0] ?? null;
  const ownerCounts = sortedCounts(
    payload.nodes
      .filter((node) => coreNodeIds.has(node.id) && !looksLikeTest(node.sourcePath))
      .map((node) => node.sourcePath),
  );
  const handoffs = entryPoint ? handoffsForEntry(payload, entryPoint) : { incoming: [], outgoing: [] };
  const storedNodePaths = payload.nodes.filter((node) => node.kind === "table").map((node) => node.sourcePath);
  const storedDataSources = [...new Set([
    ...sourcePaths.filter((path) => looksLikeStoredData(path) && !looksLikeTest(path)),
    ...storedNodePaths.filter((path) => !looksLikeTest(path)),
  ])].sort();
  const focusedTests = sourcePaths.filter(looksLikeTest);
  const sharedSystems = sourcePaths.filter((path) => looksLikeSharedSystem(path) && path !== entryPoint);

  return {
    entryPoint,
    majorOwners: ownerCounts.slice(0, 5).map(([path]) => path),
    incomingHandoffs: handoffs.incoming,
    outgoingHandoffs: handoffs.outgoing,
    sharedSystems: sharedSystems.slice(0, 6),
    storedDataSources: storedDataSources.slice(0, 8),
    focusedTests: focusedTests.slice(0, 8),
    structuralCommunities: [...payload.communities]
      .sort((left, right) => right.nodeIds.length - left.nodeIds.length || left.label.localeCompare(right.label))
      .slice(0, 4),
  };
}
