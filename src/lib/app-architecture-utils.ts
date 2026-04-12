export type ArchitectureNodeType = "root" | "folder" | "file";

export interface ArchitectureFileMeta {
  extension: string;
  fileKind: string;
  probableSymbols: string[];
}

export interface ArchitectureNode {
  id: string;
  type: ArchitectureNodeType;
  name: string;
  path: string;
  parentId: string | null;
  childIds: string[];
  depth: number;
  description: string;
  tags: string[];
  fileMeta?: ArchitectureFileMeta;
}

export interface ArchitectureStats {
  totalFolders: number;
  totalFiles: number;
  totalReactFiles: number;
  routeFiles: number;
  featureFiles: number;
  serviceFiles: number;
  probableReactBlocks: number;
}

export interface ArchitectureRegistry {
  version: 1;
  generatedAt: string;
  projectRootName: string;
  rootId: string;
  nodes: Record<string, ArchitectureNode>;
  orderedNodeIds: string[];
  stats: ArchitectureStats;
}

export interface ArchitectureTransferPackage {
  packageType: "chronicle-app-architecture";
  packageVersion: 1;
  exportedAt: string;
  registry: ArchitectureRegistry;
  notesByNodeId: Record<string, string>;
}

const FOLDER_DESCRIPTIONS: Array<{ pattern: RegExp; description: string }> = [
  { pattern: /^\/src$/, description: "Core application source code for routes, features, components, and shared logic." },
  { pattern: /^\/src\/pages$/, description: "Route-level page entry points mounted by the app router." },
  { pattern: /^\/src\/features$/, description: "Feature-first domain modules. Each feature groups UI, utilities, and local types." },
  { pattern: /^\/src\/components$/, description: "Reusable UI components used across pages and features." },
  { pattern: /^\/src\/components\/admin$/, description: "Admin dashboard tools and editor surfaces." },
  { pattern: /^\/src\/components\/chronicle$/, description: "Chronicle-specific shared UI blocks and tab components." },
  { pattern: /^\/src\/services$/, description: "API and persistence service layer." },
  { pattern: /^\/src\/integrations$/, description: "External integration clients and generated integration types." },
  { pattern: /^\/src\/hooks$/, description: "Reusable React hooks for state and behavior composition." },
  { pattern: /^\/src\/contexts$/, description: "Application-level React context providers." },
  { pattern: /^\/src\/data$/, description: "Static or seeded app data structures." },
  { pattern: /^\/src\/types$/, description: "Shared TypeScript types and contracts used throughout the app." },
  { pattern: /^\/src\/lib$/, description: "Utility functions, formatters, schema helpers, and non-UI core logic." },
  { pattern: /^\/supabase$/, description: "Database migrations, SQL, and backend integration support files." },
  { pattern: /^\/docs$/, description: "Engineering and implementation documentation." },
  { pattern: /^\/public$/, description: "Static public assets and HTML tools served directly by the app." },
];

function toPascalCase(input: string): string {
  return input
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

function normalizePath(path: string): string {
  if (!path) return "/";
  const trimmed = path.trim();
  const normalized = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return normalized.replace(/\/{2,}/g, "/");
}

function pathToNodeId(path: string): string {
  return `node:${normalizePath(path).replace(/\//g, "|")}`;
}

function inferFileKind(path: string): string {
  if (/\/supabase\/functions\/[^/]+\/index\.ts$/.test(path)) return "edge-function";
  if (/\/supabase\/functions\/_shared\/.+\.ts$/.test(path)) return "backend-shared";
  if (/\/supabase\/migrations\/.+\.sql$/.test(path)) return "database-script";
  if (/\/pages\//.test(path)) return "route-page";
  if (/\/features\//.test(path) && /Screen\.tsx$/.test(path)) return "feature-screen";
  if (/\/features\//.test(path) && /\.tsx$/.test(path)) return "feature-component";
  if (/\/components\//.test(path) && /Modal\.tsx$/.test(path)) return "modal-component";
  if (/\/components\//.test(path) && /\.tsx$/.test(path)) return "shared-component";
  if (/\/hooks\//.test(path)) return "react-hook";
  if (/\/services\//.test(path)) return "service";
  if (/\/contexts\//.test(path)) return "context-provider";
  if (/\/integrations\//.test(path)) return "integration";
  if (/\/types\//.test(path)) return "types";
  if (/\/data\//.test(path)) return "data-registry";
  if (/\/lib\//.test(path)) return "utility";
  if (/\.css$/.test(path) || /\.scss$/.test(path)) return "style-sheet";
  if (/\.sql$/.test(path)) return "database-script";
  if (/\.md$/.test(path)) return "documentation";
  if (/\.html$/.test(path)) return "static-html-tool";
  return "source-file";
}

function describeFolder(path: string): string {
  const hit = FOLDER_DESCRIPTIONS.find((entry) => entry.pattern.test(path));
  if (hit) return hit.description;

  const name = path.split("/").filter(Boolean).at(-1) ?? "root";
  return `${toPascalCase(name)} directory used by the Chronicle app architecture.`;
}

function describeFile(path: string, kind: string): string {
  const fileName = path.split("/").pop() ?? path;
  if (kind === "route-page") return `${fileName} is a route-level page mounted directly by the router.`;
  if (kind === "feature-screen") return `${fileName} is a feature screen that composes multiple lower-level UI blocks.`;
  if (kind === "feature-component") return `${fileName} is a feature-specific React component used inside a feature module.`;
  if (kind === "shared-component") return `${fileName} is a shared React component reused across pages or features.`;
  if (kind === "modal-component") return `${fileName} is a modal/dialog component for focused workflows.`;
  if (kind === "react-hook") return `${fileName} is a React hook that encapsulates reusable behavior or state flow.`;
  if (kind === "service") return `${fileName} is a service-layer module for data/API operations.`;
  if (kind === "context-provider") return `${fileName} defines shared app state via a React context provider.`;
  if (kind === "integration") return `${fileName} contains external integration setup or generated integration types.`;
  if (kind === "edge-function") return `${fileName} is a Supabase edge function entry point for server-side app workflows.`;
  if (kind === "backend-shared") return `${fileName} contains shared backend helper logic reused across edge functions.`;
  if (kind === "utility") return `${fileName} is a utility/helper module used by other app layers.`;
  if (kind === "types") return `${fileName} defines shared data and interface types.`;
  if (kind === "style-sheet") return `${fileName} controls styling rules and visual behavior.`;
  if (kind === "database-script") return `${fileName} contains database migration or SQL behavior.`;
  if (kind === "documentation") return `${fileName} documents architecture, implementation, or operating procedures.`;
  return `${fileName} is part of the Chronicle source tree.`;
}

function inferFileTags(path: string, kind: string): string[] {
  const tags = new Set<string>();
  const ext = path.split(".").pop()?.toLowerCase();
  if (ext) tags.add(ext);
  tags.add(kind);

  if (/\/pages\//.test(path)) tags.add("routes");
  if (/\/features\//.test(path)) tags.add("feature-layer");
  if (/\/components\//.test(path)) tags.add("ui-layer");
  if (/\/hooks\//.test(path)) tags.add("state-layer");
  if (/\/services\//.test(path) || /\/integrations\//.test(path)) tags.add("data-layer");
  if (/\/supabase\//.test(path)) tags.add("backend-layer");
  if (/\/supabase\/functions\//.test(path)) tags.add("edge-runtime");
  if (/\/docs\//.test(path)) tags.add("documentation");

  return Array.from(tags);
}

function inferProbableSymbols(path: string): string[] {
  if (!/\.tsx?$/.test(path)) return [];

  const parts = path.split("/");
  const file = parts[parts.length - 1];
  const base = file.replace(/\.[^.]+$/, "");
  if (!base) return [];

  if (base === "index") {
    const parent = parts[parts.length - 2] ?? "module";
    return [toPascalCase(parent)];
  }

  const symbol = toPascalCase(base);
  return symbol ? [symbol] : [];
}

function ensureNode(
  nodes: Record<string, ArchitectureNode>,
  path: string,
  type: ArchitectureNodeType,
  parentId: string | null,
  depth: number,
): ArchitectureNode {
  const normalizedPath = normalizePath(path);
  const id = pathToNodeId(normalizedPath);
  const existing = nodes[id];
  if (existing) return existing;

  const name = normalizedPath === "/" ? "/" : normalizedPath.split("/").filter(Boolean).at(-1) ?? normalizedPath;
  let node: ArchitectureNode;

  if (type === "file") {
    const extension = (name.includes(".") ? name.split(".").pop() : "") || "";
    const fileKind = inferFileKind(normalizedPath);
    node = {
      id,
      type,
      name,
      path: normalizedPath,
      parentId,
      childIds: [],
      depth,
      description: describeFile(normalizedPath, fileKind),
      tags: inferFileTags(normalizedPath, fileKind),
      fileMeta: {
        extension,
        fileKind,
        probableSymbols: inferProbableSymbols(normalizedPath),
      },
    };
  } else {
    node = {
      id,
      type,
      name: normalizedPath === "/" ? "Chronicle-main" : name,
      path: normalizedPath,
      parentId,
      childIds: [],
      depth,
      description: describeFolder(normalizedPath),
      tags: type === "root" ? ["project-root"] : ["directory"],
    };
  }

  nodes[id] = node;
  return node;
}

export function buildArchitectureRegistry(paths: string[], projectRootName = "Chronicle-main"): ArchitectureRegistry {
  const normalizedPaths = Array.from(new Set(paths.map((p) => normalizePath(p))))
    .filter((p) => p !== "/" && p.includes("/"))
    .sort((a, b) => a.localeCompare(b));

  const nodes: Record<string, ArchitectureNode> = {};
  const root = ensureNode(nodes, "/", "root", null, 0);
  root.name = projectRootName;

  normalizedPaths.forEach((fullPath) => {
    const segments = fullPath.split("/").filter(Boolean);
    if (segments.length === 0) return;

    let currentPath = "";
    let parent = root;

    segments.forEach((segment, idx) => {
      currentPath = `${currentPath}/${segment}`;
      const isLast = idx === segments.length - 1;
      const nodeType: ArchitectureNodeType = isLast ? "file" : "folder";
      const child = ensureNode(nodes, currentPath, nodeType, parent.id, idx + 1);
      if (!parent.childIds.includes(child.id)) parent.childIds.push(child.id);
      parent = child;
    });
  });

  Object.values(nodes).forEach((node) => {
    node.childIds.sort((a, b) => {
      const nodeA = nodes[a];
      const nodeB = nodes[b];
      if (!nodeA || !nodeB) return 0;
      if (nodeA.type !== nodeB.type) return nodeA.type === "folder" ? -1 : 1;
      return nodeA.name.localeCompare(nodeB.name);
    });
  });

  const allNodes = Object.values(nodes);
  const fileNodes = allNodes.filter((node) => node.type === "file");
  const folderNodes = allNodes.filter((node) => node.type === "folder");
  const reactFiles = fileNodes.filter((node) => node.path.endsWith(".tsx"));
  const routeFiles = fileNodes.filter((node) => node.fileMeta?.fileKind === "route-page");
  const featureFiles = fileNodes.filter((node) => (node.fileMeta?.fileKind || "").startsWith("feature-"));
  const serviceFiles = fileNodes.filter((node) => node.fileMeta?.fileKind === "service");
  const probableReactBlocks = fileNodes.reduce((sum, node) => sum + (node.fileMeta?.probableSymbols.length || 0), 0);

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    projectRootName,
    rootId: root.id,
    nodes,
    orderedNodeIds: allNodes.sort((a, b) => a.path.localeCompare(b.path)).map((node) => node.id),
    stats: {
      totalFolders: folderNodes.length,
      totalFiles: fileNodes.length,
      totalReactFiles: reactFiles.length,
      routeFiles: routeFiles.length,
      featureFiles: featureFiles.length,
      serviceFiles: serviceFiles.length,
      probableReactBlocks,
    },
  };
}

export function isArchitectureRegistry(value: unknown): value is ArchitectureRegistry {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ArchitectureRegistry>;
  if (candidate.version !== 1) return false;
  if (!candidate.rootId || typeof candidate.rootId !== "string") return false;
  if (!candidate.nodes || typeof candidate.nodes !== "object") return false;
  if (!candidate.stats || typeof candidate.stats !== "object") return false;
  return true;
}

export function isArchitectureTransferPackage(value: unknown): value is ArchitectureTransferPackage {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ArchitectureTransferPackage>;
  if (candidate.packageType !== "chronicle-app-architecture") return false;
  if (candidate.packageVersion !== 1) return false;
  if (!candidate.registry || !isArchitectureRegistry(candidate.registry)) return false;
  if (!candidate.notesByNodeId || typeof candidate.notesByNodeId !== "object") return false;
  return true;
}

export function countDescendants(registry: ArchitectureRegistry, nodeId: string): { folders: number; files: number } {
  const node = registry.nodes[nodeId];
  if (!node) return { folders: 0, files: 0 };

  const queue = [...node.childIds];
  let folders = 0;
  let files = 0;

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (!currentId) continue;
    const current = registry.nodes[currentId];
    if (!current) continue;

    if (current.type === "file") files += 1;
    if (current.type === "folder") folders += 1;
    queue.push(...current.childIds);
  }

  return { folders, files };
}

export function getTopLevelNodeIds(registry: ArchitectureRegistry): string[] {
  const root = registry.nodes[registry.rootId];
  if (!root) return [];
  return root.childIds;
}

export function buildNodePromptSummary(
  registry: ArchitectureRegistry,
  nodeId: string,
  notesByNodeId: Record<string, string>,
): string {
  const node = registry.nodes[nodeId];
  if (!node) return "Node not found.";

  const descendantCounts = countDescendants(registry, nodeId);
  const lines: string[] = [];
  lines.push(`Node: ${node.name}`);
  lines.push(`Path: ${node.path}`);
  lines.push(`Type: ${node.type}`);
  lines.push(`Description: ${node.description}`);
  lines.push(`Tags: ${node.tags.join(", ") || "none"}`);
  lines.push(`Children: ${node.childIds.length}`);
  lines.push(`Descendants: ${descendantCounts.folders} folders, ${descendantCounts.files} files`);

  if (node.fileMeta) {
    lines.push(`File kind: ${node.fileMeta.fileKind}`);
    lines.push(`Extension: ${node.fileMeta.extension || "n/a"}`);
    lines.push(`Probable React blocks: ${node.fileMeta.probableSymbols.join(", ") || "none"}`);
  }

  const note = notesByNodeId[nodeId]?.trim();
  if (note) lines.push(`Custom note: ${note}`);

  const childPreview = node.childIds
    .slice(0, 12)
    .map((childId) => registry.nodes[childId]?.name)
    .filter(Boolean);
  if (childPreview.length > 0) lines.push(`Child preview: ${childPreview.join(", ")}`);

  return lines.join("\n");
}
