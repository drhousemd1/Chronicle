import { readFile, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";

const [graphPath, outputPath] = process.argv.slice(2);

if (!graphPath || !outputPath) {
  throw new Error(
    "Usage: node generate-chronicle-area-map.mjs <graph.json> <chronicle-areas.html>",
  );
}

const AREAS = [
  {
    id: "chat-interface",
    label: "Chat Interface",
    color: "#60a5fa",
    description: "The visible conversation screen, chat controls, message formatting, and chat-specific presentation behavior.",
    evidence: [
      "src/components/chronicle/ChatInterfaceTab.tsx",
      "src/features/chat-debug/",
    ],
    rules: [
      ["ChatInterfaceTab", (path) => path.includes("src/components/chronicle/chatinterfacetab")],
      ["Chat UI components", (path) => /src\/components\/chronicle\/(chat|message|conversationbubble|autoresizetextarea)/.test(path)],
      ["Chat debugging UI", (path) => path.includes("src/features/chat-debug/")],
      ["Message presentation utilities", (path) => /src\/features\/chat-runtime\/(avatar-position|message-formatting|local-notices)/.test(path)],
    ],
  },
  {
    id: "api-roleplay-pipeline",
    label: "API & Roleplay Pipeline",
    color: "#a78bfa",
    description: "Prompt assembly, model calls, response processing, memory extraction, roleplay state, and Supabase Edge Function execution.",
    evidence: [
      "src/features/chat-runtime/",
      "src/services/llm.ts",
      "supabase/functions/chat/",
    ],
    rules: [
      ["Chat runtime", (path) => path.includes("src/features/chat-runtime/")],
      ["Model and roleplay services", (path) => /src\/services\/(llm|character-ai|side-character-generator|roleplay|api-|field-enhance)/.test(path)],
      ["Chat and extraction Edge Functions", (path) => /supabase\/functions\/(chat|extract-|generate-|enhance-|analyze-)/.test(path)],
      ["Shared Edge Function runtime", (path) => path.includes("supabase/functions/_shared/")],
      ["Roleplay tooling", (path) => /scripts\/.*(roleplay|prompt|llm|model)/.test(path)],
    ],
  },
  {
    id: "story-builder",
    label: "Story Builder",
    color: "#34d399",
    description: "Story setup, world details, scenes, opening dialogue, roster composition, and story import/export.",
    evidence: [
      "src/features/story-builder/",
      "src/components/chronicle/WorldTab.tsx",
    ],
    rules: [
      ["Story Builder feature", (path) => path.includes("src/features/story-builder/")],
      ["World and story screens", (path) => /src\/components\/chronicle\/(worldtab|world|storygoals|contentthemes)/.test(path)],
      ["Story transfer", (path) => path.includes("src/lib/story-transfer")],
      ["Story workspace hooks", (path) => /src\/hooks\/use-index-(story|scenario)/.test(path)],
    ],
  },
  {
    id: "character-builder",
    label: "Character Builder",
    color: "#f59e0b",
    description: "Character creation, editing, traits, goals, personality, roster selection, and library-aware character workflows.",
    evidence: [
      "src/features/character-builder/",
      "src/features/character-editor-modal/",
      "src/components/chronicle/CharactersTab.tsx",
    ],
    rules: [
      ["Character Builder feature", (path) => path.includes("src/features/character-builder/")],
      ["Character editor feature", (path) => path.includes("src/features/character-editor-modal/")],
      ["Character screens and sections", (path) => /src\/components\/chronicle\/(characterstab|character|personality|spicerating)/.test(path)],
      ["Character workspace services", (path) => /src\/(services|hooks)\/.*character/.test(path)],
    ],
  },
  {
    id: "story-hub-sessions",
    label: "My Stories & Chat History",
    color: "#2dd4bf",
    description: "The story hub, saved scenarios, session registry, conversation history, and resume/delete workflows.",
    evidence: [
      "src/components/chronicle/ScenarioHub.tsx",
      "src/components/chronicle/ConversationsTab.tsx",
      "src/services/persistence/conversations.ts",
    ],
    rules: [
      ["Story hub", (path) => /src\/components\/chronicle\/(scenariohub|storyhub)/.test(path)],
      ["Chat history", (path) => /src\/components\/chronicle\/(conversationstab|conversationhistory)/.test(path)],
      ["Scenario and conversation persistence", (path) => /src\/services\/persistence\/(scenarios|conversations)/.test(path)],
      ["Conversation registry", (path) => /src\/.*conversation-registry/.test(path)],
    ],
  },
  {
    id: "media-image-library",
    label: "Media & Image Library",
    color: "#f472b6",
    description: "Image generation, media settings, image folders, backgrounds, uploads, and stored visual assets.",
    evidence: [
      "src/components/chronicle/ImageLibraryTab.tsx",
      "src/components/admin/ImageGenerationTool.tsx",
      "src/services/persistence/media-settings.ts",
    ],
    rules: [
      ["Image library", (path) => path.includes("src/components/chronicle/imagelibrary")],
      ["Image generation UI", (path) => /src\/components\/.*imagegeneration/.test(path)],
      ["Media persistence", (path) => path.includes("src/services/persistence/media-settings")],
      ["Media and background modules", (path) => /src\/.*(media|image-library|background)/.test(path)],
      ["Image Edge Functions", (path) => /supabase\/functions\/.*image/.test(path)],
    ],
  },
  {
    id: "gallery-profile-account",
    label: "Gallery, Profiles & Account",
    color: "#fb7185",
    description: "Community Gallery, published stories, bookmarks, creator profiles, account settings, and subscription-facing UI.",
    evidence: [
      "src/components/chronicle/GalleryHub.tsx",
      "src/pages/CreatorProfile.tsx",
      "src/components/account/",
    ],
    rules: [
      ["Gallery components", (path) => /src\/components\/chronicle\/gallery/.test(path)],
      ["Gallery and creator pages", (path) => /src\/pages\/(gallery|creatorprofile)/.test(path)],
      ["Account components", (path) => path.includes("src/components/account/")],
      ["Gallery and profile services", (path) => /src\/services\/.*(gallery|profile|bookmark|publish)/.test(path)],
      ["Account and subscription modules", (path) => /src\/.*(account|subscription)/.test(path)],
    ],
  },
  {
    id: "research-development",
    label: "Research & Development",
    color: "#22d3ee",
    description: "The Admin-only prototype workspace, coded experiments, local mock-up persistence, and generated research artifacts.",
    evidence: ["src/components/admin/research-development/"],
    rules: [
      ["R&D prototype workspace", (path) => path.includes("src/components/admin/research-development/")],
      ["R&D generated and saved artifacts", (path) => path.includes("docs/research-development/")],
    ],
  },
  {
    id: "finance-usage",
    label: "Finance & API Usage",
    color: "#eab308",
    description: "Finance dashboards, usage accounting, provider costs, reporting, projections, and validation of API spending.",
    evidence: [
      "src/components/admin/finance/",
      "src/services/finance-dashboard/",
      "src/services/admin-usage-metrics.ts",
    ],
    rules: [
      ["Finance UI", (path) => path.includes("src/components/admin/finance/")],
      ["Finance services", (path) => path.includes("src/services/finance-dashboard/")],
      ["Usage and cost modules", (path) => /src\/.*(usage-metrics|usage-cost|api-usage)/.test(path)],
      ["Usage Edge Functions", (path) => /supabase\/functions\/.*usage/.test(path)],
    ],
  },
  {
    id: "admin-knowledge-quality",
    label: "Admin, Knowledge & Quality",
    color: "#818cf8",
    description: "Admin tools, Chronicle Knowledge Base records, Quality Hub, validation evidence, and style or architecture reference surfaces.",
    evidence: [
      "src/pages/Admin.tsx",
      "src/data/chronicle-knowledge-base/",
      "src/features/quality-hub/",
    ],
    rules: [
      ["Knowledge records", (path) => /src\/data\/chronicle-knowledge-base\//.test(path)],
      ["Knowledge tooling", (path) => /scripts\/(knowledge-records|knowledge-record|validate-architecture)/.test(path)],
      ["Quality and evidence features", (path) => /src\/features\/(quality-hub|validation-evidence)\//.test(path)],
      ["Style and architecture pages", (path) => /src\/pages\/style-guide\//.test(path)],
      ["Admin UI", (path) => path.includes("src/components/admin/") || path === "src/pages/admin.tsx"],
    ],
  },
  {
    id: "supabase-data",
    label: "Supabase & Data Persistence",
    color: "#10b981",
    description: "Database migrations, Supabase client integration, schema inventories, and shared persistence services outside a single page owner.",
    evidence: [
      "supabase/migrations/",
      "src/integrations/supabase/",
      "src/services/persistence/",
    ],
    rules: [
      ["Database migrations", (path) => path.includes("supabase/migrations/")],
      ["Supabase integration", (path) => path.includes("src/integrations/supabase/")],
      ["Schema inventories", (path) => /src\/data\/(database-schema|supabase-schema)/.test(path)],
      ["Shared persistence", (path) => path.includes("src/services/persistence/")],
      ["Other Supabase modules", (path) => path.includes("supabase/")],
    ],
  },
  {
    id: "app-shell-shared-ui",
    label: "App Shell & Shared UI",
    color: "#94a3b8",
    description: "Application composition, sidebar and top bar, reusable UI primitives, navigation contracts, and shared builder presentation.",
    evidence: [
      "src/pages/Index.tsx",
      "src/components/app-shell/",
      "src/components/ui/",
    ],
    rules: [
      ["Application composition", (path) => path === "src/pages/index.tsx" || path === "src/types.ts"],
      ["App shell", (path) => path.includes("src/components/app-shell/")],
      ["UI primitives", (path) => path.includes("src/components/ui/")],
      ["Shared builder and navigation", (path) => /src\/features\/(shared-builder|navigation)\//.test(path)],
      ["Shared libraries", (path) => /src\/(lib|hooks)\//.test(path)],
    ],
  },
  {
    id: "tooling-tests-build",
    label: "Tooling, Tests & Build",
    color: "#64748b",
    description: "Repository scripts, test harnesses, configuration, generated architecture inventories, and build-time tooling without a single product-page owner.",
    evidence: ["scripts/", "vite.config.ts", "package.json"],
    rules: [
      ["Repository scripts", (path) => path.startsWith("scripts/")],
      ["Tests and fixtures", (path) => /(^|\/)(__tests__|test|tests|fixtures)(\/|\.|$)/.test(path)],
      ["Build configuration", (path) => /(^|\/)(package|vite|vitest|eslint|tsconfig|tailwind|postcss)/.test(path)],
    ],
  },
];

const SHARED_AREA = {
  id: "shared-cross-cutting",
  label: "Shared / Cross-cutting",
  color: "#a1a1aa",
  description: "Files without one clear page owner, plus Graphify communities whose nodes span several Chronicle areas.",
  evidence: ["Deterministic fallback when no rule matches or no area owns at least 45% of a community."],
  rules: [],
};

const ALL_AREAS = [...AREAS, SHARED_AREA];

function classifyNode(node) {
  const sourcePath = String(node.source_file || "").replace(/^\.\//, "").toLowerCase();
  for (const area of AREAS) {
    for (const [rule, matches] of area.rules) {
      if (matches(sourcePath)) {
        return { areaId: area.id, rule, sourcePath };
      }
    }
  }
  return { areaId: SHARED_AREA.id, rule: "No product-area path rule matched", sourcePath };
}

const graph = JSON.parse(await readFile(resolve(graphPath), "utf8"));
const nodesById = new Map();
const nodeAssignments = new Map();
const areaNodeCounts = new Map(ALL_AREAS.map((area) => [area.id, 0]));
const areaRuleCounts = new Map(ALL_AREAS.map((area) => [area.id, new Map()]));

for (const node of graph.nodes) {
  nodesById.set(node.id, node);
  const assignment = classifyNode(node);
  nodeAssignments.set(node.id, assignment);
  areaNodeCounts.set(assignment.areaId, (areaNodeCounts.get(assignment.areaId) || 0) + 1);
  const ruleCounts = areaRuleCounts.get(assignment.areaId);
  ruleCounts.set(assignment.rule, (ruleCounts.get(assignment.rule) || 0) + 1);
}

const communityBuckets = new Map();
for (const node of graph.nodes) {
  const communityId = String(node.community ?? "unclustered");
  const bucket = communityBuckets.get(communityId) || {
    id: communityId,
    graphifyName: node.community_name || `Community ${communityId}`,
    nodes: [],
    areaCounts: new Map(),
  };
  const assignment = nodeAssignments.get(node.id);
  bucket.nodes.push(node);
  bucket.areaCounts.set(assignment.areaId, (bucket.areaCounts.get(assignment.areaId) || 0) + 1);
  communityBuckets.set(communityId, bucket);
}

const communitySummaries = [];
const communityAreaById = new Map();
for (const bucket of communityBuckets.values()) {
  const distribution = [...bucket.areaCounts.entries()]
    .map(([areaId, count]) => ({ areaId, count }))
    .sort((a, b) => b.count - a.count || a.areaId.localeCompare(b.areaId));
  const leader = distribution[0];
  const share = leader ? leader.count / bucket.nodes.length : 0;
  const areaId = leader && share >= 0.45 ? leader.areaId : SHARED_AREA.id;
  communityAreaById.set(bucket.id, areaId);

  const files = [...new Set(bucket.nodes.map((node) => node.source_file).filter(Boolean))].sort();
  communitySummaries.push({
    id: bucket.id,
    graphifyName: bucket.graphifyName,
    areaId,
    nodeCount: bucket.nodes.length,
    dominantShare: share,
    distribution,
    exampleFiles: files.slice(0, 12),
    exampleNodes: bucket.nodes
      .slice()
      .sort((a, b) => String(a.label).localeCompare(String(b.label)))
      .slice(0, 12)
      .map((node) => ({ label: node.label, sourceFile: node.source_file, sourceLocation: node.source_location })),
  });
}

const areaEdges = new Map();
const communityEdges = new Map();
for (const link of graph.links) {
  const sourceNode = nodesById.get(link.source);
  const targetNode = nodesById.get(link.target);
  if (!sourceNode || !targetNode) continue;

  const sourceArea = nodeAssignments.get(sourceNode.id).areaId;
  const targetArea = nodeAssignments.get(targetNode.id).areaId;
  if (sourceArea !== targetArea) {
    const key = [sourceArea, targetArea].sort().join("::");
    const edge = areaEdges.get(key) || { from: sourceArea, to: targetArea, count: 0 };
    edge.count += 1;
    areaEdges.set(key, edge);
  }

  const sourceCommunity = String(sourceNode.community ?? "unclustered");
  const targetCommunity = String(targetNode.community ?? "unclustered");
  if (sourceCommunity !== targetCommunity) {
    const key = [sourceCommunity, targetCommunity].sort().join("::");
    const edge = communityEdges.get(key) || {
      from: sourceCommunity,
      to: targetCommunity,
      count: 0,
      areaCounts: new Map(),
    };
    edge.count += 1;
    for (const areaId of new Set([sourceArea, targetArea])) {
      edge.areaCounts.set(areaId, (edge.areaCounts.get(areaId) || 0) + 1);
    }
    communityEdges.set(key, edge);
  }
}

const payload = {
  project: "Chronicle",
  sourceGraph: basename(graphPath),
  builtAtCommit: graph.built_at_commit || null,
  totals: {
    nodes: graph.nodes.length,
    links: graph.links.length,
    communities: communitySummaries.length,
  },
  areas: ALL_AREAS.map((area) => ({
    id: area.id,
    label: area.label,
    color: area.color,
    description: area.description,
    evidence: area.evidence,
    nodeCount: areaNodeCounts.get(area.id) || 0,
    communityCount: communitySummaries.filter((community) =>
      community.distribution.some((entry) => entry.areaId === area.id),
    ).length,
    rules: [...areaRuleCounts.get(area.id).entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count),
  })),
  communities: communitySummaries.sort((a, b) => b.nodeCount - a.nodeCount),
  areaEdges: [...areaEdges.values()].sort((a, b) => b.count - a.count),
  communityEdges: [...communityEdges.values()]
    .map((edge) => ({
      from: edge.from,
      to: edge.to,
      count: edge.count,
      areas: [...edge.areaCounts.entries()].map(([areaId, count]) => ({ areaId, count })),
    }))
    .sort((a, b) => b.count - a.count),
};

const json = JSON.stringify(payload).replaceAll("<", "\\u003c");
const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chronicle Areas — Graphify</title>
  <script src="/__rnd-repository/generated/graphify-chronicle-map/vis-network.min.js"></script>
  <style>
    :root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; background: #101114; color: #f4f4f5; overflow: hidden; }
    button, input { font: inherit; }
    .app { display: grid; grid-template-rows: auto minmax(0, 1fr); height: 100vh; overflow: hidden; }
    header { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 16px 20px; border-bottom: 1px solid #34343b; background: #1c1c20; }
    h1 { margin: 0; font-size: 18px; letter-spacing: .02em; }
    .subtitle { margin: 4px 0 0; color: #a1a1aa; font-size: 12px; }
    .summary { display: flex; gap: 16px; color: #d4d4d8; font-size: 12px; white-space: nowrap; }
    .summary strong { color: white; }
    .workspace { display: grid; grid-template-columns: 250px minmax(0, 1fr) 300px; min-height: 0; overflow: hidden; }
    aside { min-height: 0; overflow: auto; background: #1b1b1f; }
    .filters { border-right: 1px solid #34343b; padding: 14px; }
    .panel { border-left: 1px solid #34343b; padding: 18px; }
    .label { margin: 0 0 10px; color: #a1a1aa; font-size: 10px; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; }
    .area-button { width: 100%; display: grid; grid-template-columns: 10px minmax(0, 1fr) auto; align-items: center; gap: 10px; min-height: 42px; margin-bottom: 6px; padding: 8px 10px; border: 1px solid transparent; border-radius: 9px; background: transparent; color: #d4d4d8; text-align: left; cursor: pointer; }
    .area-button:hover { background: #29292f; color: white; }
    .area-button.active { border-color: #526a8b; background: linear-gradient(180deg, #34445a, #2a3749); color: white; }
    .dot { width: 9px; height: 9px; border-radius: 999px; background: var(--area-color); box-shadow: 0 0 0 3px color-mix(in srgb, var(--area-color) 18%, transparent); }
    .area-name { font-size: 12px; font-weight: 700; line-height: 1.25; }
    .count { color: #a1a1aa; font-size: 10px; }
    .graph-wrap { position: relative; min-width: 0; min-height: 0; overflow: hidden; background: radial-gradient(circle at 50% 45%, #1d2330 0, #121318 48%, #0c0d10 100%); }
    #graph { width: 100%; height: 100%; min-height: 0; }
    .toolbar { position: absolute; z-index: 2; top: 14px; left: 14px; right: 14px; display: flex; align-items: center; gap: 8px; pointer-events: none; }
    .toolbar > * { pointer-events: auto; }
    .back { display: none; align-items: center; gap: 7px; min-height: 34px; padding: 0 12px; border: 1px solid #4b5563; border-radius: 8px; background: #29292f; color: white; cursor: pointer; }
    .back.visible { display: inline-flex; }
    .search { width: min(330px, 48%); min-height: 34px; padding: 0 12px; border: 1px solid #3f3f46; border-radius: 8px; outline: none; background: rgba(24,24,27,.94); color: white; }
    .search:focus { border-color: #6b85aa; box-shadow: 0 0 0 2px rgba(90,114,146,.22); }
    .mode { margin-left: auto; padding: 8px 10px; border: 1px solid #3f3f46; border-radius: 8px; background: rgba(24,24,27,.9); color: #d4d4d8; font-size: 11px; }
    .empty { display: none; position: absolute; inset: 0; place-items: center; padding: 30px; color: #a1a1aa; text-align: center; pointer-events: none; }
    .empty.visible { display: grid; }
    .empty strong { display: block; margin-bottom: 6px; color: white; font-size: 15px; }
    .panel h2 { margin: 0 0 8px; font-size: 17px; }
    .panel p { margin: 0 0 14px; color: #b4b4bc; font-size: 12px; line-height: 1.55; }
    .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 14px 0; }
    .stat { padding: 10px; border: 1px solid #34343b; border-radius: 8px; background: #242429; }
    .stat strong { display: block; font-size: 18px; }
    .stat span { color: #a1a1aa; font-size: 10px; text-transform: uppercase; letter-spacing: .08em; }
    .detail-list { margin: 8px 0 18px; padding: 0; list-style: none; }
    .detail-list li { margin-bottom: 7px; padding-bottom: 7px; border-bottom: 1px solid #303036; color: #d4d4d8; font-size: 11px; line-height: 1.4; overflow-wrap: anywhere; }
    .detail-list small { display: block; color: #85858f; margin-top: 2px; }
    .badge { display: inline-flex; margin: 0 5px 5px 0; padding: 4px 7px; border-radius: 999px; background: #2d2d33; color: #d4d4d8; font-size: 10px; }
    .boundary { margin-top: 16px; padding: 11px; border: 1px solid #3f3f46; border-radius: 8px; background: #202027; color: #a1a1aa; font-size: 10px; line-height: 1.45; }
    @media (max-width: 900px) {
      .workspace { grid-template-columns: 225px minmax(0, 1fr); }
      .panel { display: none; }
      .summary { display: none; }
    }
    @media (max-width: 620px) {
      .workspace { grid-template-columns: 1fr; grid-template-rows: auto minmax(0, 1fr); }
      .filters { display: flex; gap: 6px; overflow-x: auto; padding: 9px; border-right: 0; border-bottom: 1px solid #34343b; }
      .filters .label { display: none; }
      .area-button { flex: 0 0 auto; width: auto; margin: 0; }
      header { padding: 12px 14px; }
      .subtitle { display: none; }
      .search { flex: 1; width: auto; }
      .mode { display: none; }
    }
  </style>
</head>
<body>
  <div class="app">
    <header>
      <div>
        <h1>Chronicle Areas</h1>
        <p class="subtitle">Product-page ownership layered over Graphify's automatic code communities</p>
      </div>
      <div class="summary">
        <span><strong>${payload.totals.nodes.toLocaleString()}</strong> nodes</span>
        <span><strong>${payload.totals.links.toLocaleString()}</strong> links</span>
        <span><strong>${payload.totals.communities.toLocaleString()}</strong> Graphify communities</span>
      </div>
    </header>
    <div class="workspace">
      <aside class="filters" aria-label="Chronicle product areas">
        <p class="label">Chronicle areas</p>
        <button class="area-button active" data-area="all" style="--area-color:#ffffff">
          <span class="dot"></span><span class="area-name">All Chronicle Areas</span><span class="count">${payload.areas.length}</span>
        </button>
        ${payload.areas.map((area) => `<button class="area-button" data-area="${area.id}" style="--area-color:${area.color}">
          <span class="dot"></span><span class="area-name">${area.label}</span><span class="count">${area.nodeCount.toLocaleString()}</span>
        </button>`).join("")}
      </aside>
      <main class="graph-wrap">
        <div class="toolbar">
          <button class="back" type="button">← All areas</button>
          <input class="search" type="search" aria-label="Filter Graphify communities" placeholder="Filter communities or source files…">
          <span class="mode">Area relationships</span>
        </div>
        <div id="graph" aria-label="Chronicle area graph"></div>
        <div class="empty"><div><strong>No matching communities</strong>Try another term or clear the filter.</div></div>
      </main>
      <aside class="panel" aria-live="polite"></aside>
    </div>
  </div>
  <script id="chronicle-area-data" type="application/json">${json}</script>
  <script>
    const data = JSON.parse(document.getElementById("chronicle-area-data").textContent);
    const areaById = new Map(data.areas.map(area => [area.id, area]));
    const communityById = new Map(data.communities.map(community => [community.id, community]));
    const buttons = [...document.querySelectorAll(".area-button")];
    const panel = document.querySelector(".panel");
    const search = document.querySelector(".search");
    const back = document.querySelector(".back");
    const mode = document.querySelector(".mode");
    const empty = document.querySelector(".empty");
    let selectedArea = "all";

    const network = new vis.Network(
      document.getElementById("graph"),
      { nodes: [], edges: [] },
      {
        autoResize: true,
        interaction: { hover: true, tooltipDelay: 120, navigationButtons: true, keyboard: true },
        physics: { stabilization: { iterations: 160 }, barnesHut: { gravitationalConstant: -4200, springLength: 135, springConstant: .025 } },
        nodes: { borderWidth: 2, font: { color: "#f8fafc", size: 13, face: "Inter, system-ui" }, shadow: { enabled: true, color: "rgba(0,0,0,.45)", size: 12 } },
        edges: { color: { color: "#4b5563", highlight: "#93c5fd" }, smooth: { type: "continuous" }, font: { color: "#9ca3af", size: 9, strokeWidth: 0 } },
      },
    );

    function showOverview() {
      panel.innerHTML = '<p class="label">How to read this</p><h2>Chronicle product areas</h2><p>Each large node is a recognizable Chronicle page or structural area derived from repository ownership. Connections count Graphify links that cross between those areas.</p><div class="stat-grid"><div class="stat"><strong>' + data.areas.length + '</strong><span>Areas</span></div><div class="stat"><strong>' + data.totals.communities + '</strong><span>Communities</span></div></div><p>Choose an area to see the original Graphify communities underneath it. Mixed communities remain in Shared / Cross-cutting rather than being forced into the wrong page.</p><div class="boundary">Static local code scan. No live Supabase connection. Grouping uses ordered repository-path rules; Graphify communities remain a separate secondary signal.</div>';
    }

    function showArea(area) {
      const rules = area.rules.slice(0, 8).map(rule => '<li>' + rule.label + '<small>' + rule.count.toLocaleString() + ' nodes</small></li>').join('');
      panel.innerHTML = '<p class="label">Chronicle area</p><h2 style="color:' + area.color + '">' + area.label + '</h2><p>' + area.description + '</p><div class="stat-grid"><div class="stat"><strong>' + area.nodeCount.toLocaleString() + '</strong><span>Nodes</span></div><div class="stat"><strong>' + area.communityCount.toLocaleString() + '</strong><span>Communities</span></div></div><p class="label">Repository evidence</p><ul class="detail-list">' + area.evidence.map(item => '<li>' + item + '</li>').join('') + '</ul><p class="label">Matched rules</p><ul class="detail-list">' + (rules || '<li>Fallback assignment</li>') + '</ul>';
    }

    function showCommunity(community) {
      const primaryArea = areaById.get(community.areaId);
      const selectedAreaRecord = areaById.get(selectedArea);
      const selectedAreaCount = community.distribution.find(item => item.areaId === selectedArea)?.count || 0;
      const distribution = community.distribution.slice(0, 5).map(item => {
        const part = areaById.get(item.areaId);
        return '<span class="badge">' + (part?.label || item.areaId) + ' · ' + item.count + '</span>';
      }).join('');
      panel.innerHTML = '<p class="label">Graphify community ' + community.id + '</p><h2>' + community.graphifyName + '</h2><p>This community contains <strong style="color:' + selectedAreaRecord.color + '">' + selectedAreaCount + ' ' + selectedAreaRecord.label + ' nodes</strong>. Its strongest overall ownership is ' + primaryArea.label + '.</p><div class="stat-grid"><div class="stat"><strong>' + community.nodeCount.toLocaleString() + '</strong><span>Total nodes</span></div><div class="stat"><strong>' + Math.round(community.dominantShare * 100) + '%</strong><span>Largest share</span></div></div><div>' + distribution + '</div><p class="label" style="margin-top:14px">Example source files</p><ul class="detail-list">' + community.exampleFiles.map(file => '<li>' + file + '</li>').join('') + '</ul>';
    }

    function renderAreas() {
      // Keep every area label inside Chronicle's constrained R&D preview canvas.
      // The iframe is commonly about 620px wide after the filter rail is shown.
      const radius = 185;
      const nodes = data.areas.map((area, index) => {
        const angle = (Math.PI * 2 * index) / data.areas.length - Math.PI / 2;
        return { id: area.id, label: area.label + "\\n" + area.nodeCount.toLocaleString() + " nodes", value: Math.max(area.nodeCount, 1), x: Math.cos(angle) * radius, y: Math.sin(angle) * radius, fixed: { x: true, y: true }, color: { background: area.color, border: "#e5e7eb", highlight: { background: area.color, border: "#ffffff" } }, shape: "dot", title: area.description };
      });
      const edges = data.areaEdges.filter(edge => areaById.has(edge.from) && areaById.has(edge.to)).map((edge, index) => ({ id: "area-" + index, from: edge.from, to: edge.to, value: Math.max(edge.count, 1), title: edge.count.toLocaleString() + " cross-area links" }));
      empty.classList.remove("visible");
      mode.textContent = "Area relationships";
      back.classList.remove("visible");
      search.value = "";
      search.placeholder = "Choose an area to filter communities…";
      network.setOptions({ physics: { enabled: false } });
      network.setData({ nodes, edges });
      network.fit({ animation: { duration: 350 } });
      showOverview();
    }

    function renderCommunities() {
      const query = search.value.trim().toLowerCase();
      const area = areaById.get(selectedArea);
      const communities = data.communities.filter(community => {
        const areaSlice = community.distribution.find(item => item.areaId === selectedArea);
        if (!areaSlice) return false;
        if (!query) return true;
        return community.graphifyName.toLowerCase().includes(query) || community.exampleFiles.some(file => file.toLowerCase().includes(query));
      });
      const ids = new Set(communities.map(community => community.id));
      const nodes = communities.map(community => {
        const areaNodeCount = community.distribution.find(item => item.areaId === selectedArea)?.count || 0;
        return { id: community.id, label: community.graphifyName + "\\n" + areaNodeCount + " area nodes · " + community.nodeCount + " total", value: Math.max(areaNodeCount, 1), color: { background: area.color, border: "#f4f4f5", highlight: { background: area.color, border: "#ffffff" } }, shape: "dot", title: "Graphify community " + community.id };
      });
      const edges = data.communityEdges.filter(edge => ids.has(edge.from) && ids.has(edge.to) && edge.areas.some(item => item.areaId === selectedArea)).map((edge, index) => {
        const areaCount = edge.areas.find(item => item.areaId === selectedArea)?.count || 0;
        return { id: "community-" + index, from: edge.from, to: edge.to, value: Math.max(areaCount, 1), title: areaCount + " links touching this area" };
      });
      empty.classList.toggle("visible", nodes.length === 0);
      mode.textContent = area.label + " · Graphify communities";
      back.classList.add("visible");
      search.placeholder = "Filter communities or source files…";
      network.setOptions({ physics: { enabled: true, stabilization: { iterations: 160 }, barnesHut: { gravitationalConstant: -4200, springLength: 135, springConstant: .025 } } });
      network.setData({ nodes, edges });
      if (nodes.length) network.fit({ animation: { duration: 300 } });
      showArea(area);
    }

    function selectArea(areaId) {
      selectedArea = areaId;
      buttons.forEach(button => button.classList.toggle("active", button.dataset.area === areaId));
      if (areaId === "all") renderAreas(); else renderCommunities();
    }

    buttons.forEach(button => button.addEventListener("click", () => selectArea(button.dataset.area)));
    back.addEventListener("click", () => selectArea("all"));
    search.addEventListener("input", () => { if (selectedArea !== "all") renderCommunities(); });
    network.on("click", params => {
      if (!params.nodes.length) return;
      const id = String(params.nodes[0]);
      if (selectedArea === "all" && areaById.has(id)) selectArea(id);
      else if (communityById.has(id)) showCommunity(communityById.get(id));
    });
    selectArea("all");
  </script>
</body>
</html>`;

await writeFile(resolve(outputPath), html, "utf8");
console.log(
  JSON.stringify(
    {
      output: resolve(outputPath),
      areas: payload.areas.map((area) => ({ id: area.id, nodes: area.nodeCount, communities: area.communityCount })),
      totals: payload.totals,
    },
    null,
    2,
  ),
);
