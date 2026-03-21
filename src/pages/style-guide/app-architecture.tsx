import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, RefreshCcw, Upload } from "lucide-react";
import {
  ArchitectureNode,
  ArchitectureRegistry,
  ArchitectureTransferPackage,
  buildArchitectureRegistry,
  isArchitectureRegistry,
  isArchitectureTransferPackage,
} from "@/lib/app-architecture-utils";
import { architectureSourcePaths } from "@/data/architecture-source-paths";
import { architectureExtraPaths } from "@/data/architecture-extra-paths";

const STORAGE_KEY = "chronicle-app-architecture-v1";
const GENERATED_PATHS = [...architectureSourcePaths, ...architectureExtraPaths].sort((a, b) =>
  a.localeCompare(b),
);

const architectureStyles = `
.app-architecture-page {
  background: #ffffff;
  color: #111111;
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.6;
}

.app-architecture-page .content-shell {
  padding: 30px;
}

.app-architecture-page h2.arch-title {
  font-family: -apple-system, sans-serif;
  font-size: 15px;
  margin-bottom: 20px;
  color: #555555;
}

.app-architecture-page .tree-node {
  position: relative;
}

.app-architecture-page .folder-row {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 1px 7px;
  border-radius: 3px;
  cursor: pointer;
  user-select: none;
  transition: background 0.1s;
  background: #fff8f0;
  border: 1px solid #e67e22;
  margin: 2px 0;
}

.app-architecture-page button.folder-row {
  appearance: none;
  font: inherit;
  color: inherit;
}

.app-architecture-page .folder-row:hover {
  background: #ffedd5;
}

.app-architecture-page .chevron {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #e67e22;
  font-size: 9px;
  transition: transform 0.15s;
}

.app-architecture-page .tree-node.open > .folder-row > .chevron {
  transform: rotate(90deg);
}

.app-architecture-page .folder-icon {
  flex-shrink: 0;
  font-size: 12px;
}

.app-architecture-page .folder-label {
  font-weight: 600;
  color: #e67e22;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 13px;
}

.app-architecture-page .folder-desc {
  color: #111111;
  font-weight: 400;
  font-size: 12px;
  margin-left: 6px;
  font-family: -apple-system, sans-serif;
}

.app-architecture-page .folder-count {
  font-size: 9px;
  color: #e67e22;
  background: #fff8f0;
  border: 1px solid #f0c89a;
  border-radius: 8px;
  padding: 0 5px;
  margin-left: 4px;
  white-space: nowrap;
  font-family: -apple-system, sans-serif;
}

.app-architecture-page .children {
  display: none;
  margin-left: 28px;
  border-left: 1px solid #111111;
}

.app-architecture-page .tree-node.open > .children {
  display: block;
}

.app-architecture-page .file-row {
  position: relative;
  padding: 3px 8px 3px 16px;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.app-architecture-page .file-row::before {
  content: '';
  position: absolute;
  left: 0;
  top: 13px;
  width: 14px;
  height: 0;
  border-top: 1px solid #111111;
}

.app-architecture-page .file-name-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
  flex-wrap: wrap;
}

.app-architecture-page .file-name {
  color: #1565c0;
  font-weight: 500;
  font-size: 13px;
}

.app-architecture-page .file-ext {
  font-size: 9px;
  padding: 0 5px;
  border-radius: 3px;
  font-weight: 600;
  font-family: -apple-system, sans-serif;
}

.app-architecture-page .file-ext.tsx {
  background: rgba(97, 218, 251, 0.2);
  color: #0288d1;
}

.app-architecture-page .file-ext.ts {
  background: rgba(49, 120, 198, 0.15);
  color: #1565c0;
}

.app-architecture-page .file-ext.other {
  background: rgba(55, 65, 81, 0.14);
  color: #374151;
}

.app-architecture-page .file-desc {
  color: #333333;
  font-size: 12px;
  line-height: 1.5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.app-architecture-page .file-subs {
  margin-left: 28px;
  border-left: 1px solid #111111;
  margin-top: 2px;
  margin-bottom: 6px;
}

.app-architecture-page .file-sub {
  position: relative;
  padding: 2px 0 2px 14px;
  font-size: 12px;
  line-height: 1.5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.app-architecture-page .file-sub::before {
  content: '';
  position: absolute;
  left: 0;
  top: 12px;
  width: 12px;
  height: 0;
  border-top: 1px solid #111111;
}

.app-architecture-page .sub-name {
  font-weight: 600;
}

.app-architecture-page .sub-name.component {
  color: #7b1fa2;
}

.app-architecture-page .sub-name.feature {
  color: #1565c0;
}

.app-architecture-page .sub-desc {
  color: #333333;
}

.app-architecture-page .sub-tag {
  display: inline-block;
  font-size: 8.5px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  padding: 0px 4px;
  border-radius: 2px;
  margin-right: 5px;
  vertical-align: baseline;
  font-family: -apple-system, sans-serif;
}

.app-architecture-page .sub-tag.component {
  background: rgba(123, 31, 162, 0.12);
  color: #7b1fa2;
  border: 1px solid rgba(123, 31, 162, 0.25);
}

.app-architecture-page .sub-tag.feature {
  background: rgba(21, 101, 192, 0.08);
  color: #1565c0;
  border: 1px solid rgba(21, 101, 192, 0.2);
}

.app-architecture-page .component-features {
  margin-left: 28px;
  border-left: 1px solid #111111;
  margin-top: 2px;
  margin-bottom: 4px;
}

.app-architecture-page .component-features .file-sub {
  position: relative;
  padding: 2px 0 2px 14px;
  font-size: 12px;
  line-height: 1.5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.app-architecture-page .component-features .file-sub::before {
  content: '';
  position: absolute;
  left: 0;
  top: 12px;
  width: 12px;
  height: 0;
  border-top: 1px solid #111111;
}

.app-architecture-page .legend {
  margin-bottom: 28px;
  padding: 16px 20px;
  background: #fafafa;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 12.5px;
  line-height: 1.7;
  color: #333333;
}

.app-architecture-page .legend h3 {
  font-size: 13px;
  font-weight: 700;
  color: #111111;
  margin-bottom: 10px;
}

.app-architecture-page .legend-section {
  margin-bottom: 12px;
}

.app-architecture-page .legend-section:last-child {
  margin-bottom: 0;
}

.app-architecture-page .legend-section-title {
  font-weight: 700;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #888888;
  margin-bottom: 4px;
}

.app-architecture-page .legend-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin: 3px 0;
}

.app-architecture-page .legend-rule {
  margin: 10px 0;
  border: none;
  border-top: 1px solid #e0e0e0;
}
`;

type PersistedArchitectureState = {
  registry: ArchitectureRegistry;
};

type FeatureDetail = {
  name: string;
  description: string;
};

type FileSubItem =
  | {
      kind: "component";
      name: string;
      description: string;
      features: FeatureDetail[];
    }
  | {
      kind: "feature";
      name: string;
      description: string;
    };

const FEATURE_TEMPLATES_BY_KIND: Record<string, FeatureDetail[]> = {
  "route-page": [
    {
      name: "Route Lifecycle",
      description: "Mounts page-level state and orchestrates route entry behavior for this screen.",
    },
    {
      name: "Surface Composition",
      description: "Composes child layout blocks, section components, and route-level interactions.",
    },
  ],
  "feature-screen": [
    {
      name: "Feature Workflow",
      description: "Coordinates the end-to-end feature flow and module interactions for this surface.",
    },
    {
      name: "Feature State Management",
      description: "Manages scoped state transitions and feature-specific UI behavior.",
    },
  ],
  "feature-component": [
    {
      name: "Interaction Handling",
      description: "Handles user interaction events and state transitions within this feature block.",
    },
    {
      name: "Data Binding",
      description: "Maps props and state values into rendered feature content.",
    },
  ],
  "shared-component": [
    {
      name: "Reusable Presentation",
      description: "Provides reusable visual structure shared across multiple routes or features.",
    },
    {
      name: "Prop-driven Rendering",
      description: "Renders display states based on incoming props and context data.",
    },
  ],
  "modal-component": [
    {
      name: "Open/Close Control",
      description: "Controls modal visibility lifecycle and close actions for focused workflows.",
    },
    {
      name: "Contained Form Flow",
      description: "Runs local modal interactions and validates actions before commit.",
    },
  ],
  "react-hook": [
    {
      name: "Reusable Hook Logic",
      description: "Encapsulates stateful logic so multiple components can share behavior consistently.",
    },
  ],
  service: [
    {
      name: "Data Operations",
      description: "Performs data fetch, write, and transformation operations for app workflows.",
    },
    {
      name: "Error and Response Handling",
      description: "Normalizes response/error handling so callers receive consistent outcomes.",
    },
  ],
  "context-provider": [
    {
      name: "Shared Context State",
      description: "Provides app-wide state values and actions through a React context boundary.",
    },
  ],
  integration: [
    {
      name: "External Integration Mapping",
      description: "Maps external API contracts and adapter functions into local app structures.",
    },
  ],
  utility: [
    {
      name: "Utility Helpers",
      description: "Contains helper functions used by higher-level UI and feature modules.",
    },
  ],
  "data-registry": [
    {
      name: "Seeded Data Registry",
      description: "Stores static data catalogs and bootstrap values consumed by the UI.",
    },
  ],
  types: [
    {
      name: "Type Contracts",
      description: "Defines type contracts to keep interfaces and state payloads aligned.",
    },
  ],
  "style-sheet": [
    {
      name: "Visual Style Rules",
      description: "Defines style rules and visual state behavior for associated UI surfaces.",
    },
  ],
  "database-script": [
    {
      name: "Schema and Migration Logic",
      description: "Defines schema changes and migration operations for persisted data.",
    },
  ],
  documentation: [
    {
      name: "Reference Documentation",
      description: "Documents implementation decisions, architecture, and operating guidance.",
    },
  ],
};

function isPersistedArchitectureState(value: unknown): value is PersistedArchitectureState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<PersistedArchitectureState>;
  return !!(candidate.registry && isArchitectureRegistry(candidate.registry));
}

function toCompactIso(date: Date = new Date()) {
  return date.toISOString().replace(/[:.]/g, "-");
}

function downloadJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function toPascalCase(input: string): string {
  return input
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

function toTitleWords(input: string): string {
  return input
    .split(/[-_]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function fileExtension(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  if (dot === -1 || dot === fileName.length - 1) return "";
  return fileName.slice(dot + 1).toLowerCase();
}

function fileBaseName(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  if (dot === -1) return fileName;
  return fileName.slice(0, dot);
}

function inferComponentNames(fileNode: ArchitectureNode): string[] {
  const symbolNames = fileNode.fileMeta?.probableSymbols ?? [];
  const ext = fileExtension(fileNode.name);
  const inferredFromName = ext === "tsx" ? [toPascalCase(fileBaseName(fileNode.name))] : [];
  return uniqueStrings([...symbolNames, ...inferredFromName]);
}

function fallbackFeatureFromName(fileNode: ArchitectureNode): FeatureDetail {
  const base = toTitleWords(fileBaseName(fileNode.name)) || fileNode.name;
  return {
    name: `${base} Logic`,
    description: `Implements core behavior and processing flow inside ${fileNode.name}.`,
  };
}

function featureTemplatesForNode(fileNode: ArchitectureNode): FeatureDetail[] {
  const kind = fileNode.fileMeta?.fileKind ?? "";
  const templates = FEATURE_TEMPLATES_BY_KIND[kind];
  if (templates && templates.length > 0) return templates;
  return [fallbackFeatureFromName(fileNode)];
}

function buildFileSubItems(fileNode: ArchitectureNode): FileSubItem[] {
  const ext = fileExtension(fileNode.name);
  const components = inferComponentNames(fileNode);
  const features = featureTemplatesForNode(fileNode);

  if (ext === "tsx" && components.length > 0) {
    return components.map((componentName, index) => ({
      kind: "component",
      name: componentName,
      description:
        index === 0
          ? `Main exported component in ${fileNode.name}.`
          : `Helper component declared in ${fileNode.name}.`,
      features: index === 0 ? features : [],
    }));
  }

  return features.map((feature) => ({
    kind: "feature",
    name: feature.name,
    description: feature.description,
  }));
}

function extensionClass(ext: string): string {
  if (ext === "tsx") return "tsx";
  if (ext === "ts") return "ts";
  return "other";
}

function buildDefaultOpenSet(registry: ArchitectureRegistry): Set<string> {
  const next = new Set<string>();
  registry.orderedNodeIds.forEach((nodeId) => {
    const node = registry.nodes[nodeId];
    if (!node) return;
    if (node.type === "root") {
      next.add(node.id);
      return;
    }
    if (node.type === "folder" && node.depth <= 2) {
      next.add(node.id);
    }
  });
  return next;
}

function folderItemCount(registry: ArchitectureRegistry, node: ArchitectureNode): number {
  let count = 0;
  const queue = [...node.childIds];
  while (queue.length > 0) {
    const currentId = queue.shift();
    if (!currentId) continue;
    const current = registry.nodes[currentId];
    if (!current) continue;
    count += 1;
    queue.push(...current.childIds);
  }
  return count;
}

function renderFileSubItem(item: FileSubItem, key: string) {
  if (item.kind === "feature") {
    return (
      <div key={key} className="file-sub">
        <span className="sub-tag feature">feature</span>
        <span className="sub-name feature">{item.name}</span> —{" "}
        <span className="sub-desc">{item.description}</span>
      </div>
    );
  }

  return (
    <React.Fragment key={key}>
      <div className="file-sub">
        <span className="sub-tag component">react component</span>
        <span className="sub-name component">{item.name}</span> —{" "}
        <span className="sub-desc">{item.description}</span>
      </div>

      {item.features.length > 0 && (
        <div className="component-features">
          {item.features.map((feature, index) => (
            <div key={`${key}-feature-${index}`} className="file-sub">
              <span className="sub-tag feature">feature</span>
              <span className="sub-name feature">{feature.name}</span> —{" "}
              <span className="sub-desc">{feature.description}</span>
            </div>
          ))}
        </div>
      )}
    </React.Fragment>
  );
}

function TreeFolder({
  registry,
  node,
  openFolderIds,
  onToggle,
}: {
  registry: ArchitectureRegistry;
  node: ArchitectureNode;
  openFolderIds: Set<string>;
  onToggle: (nodeId: string) => void;
}) {
  const isOpen = openFolderIds.has(node.id);
  const childNodes = node.childIds
    .map((nodeId) => registry.nodes[nodeId])
    .filter(Boolean)
    .sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === "folder" ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

  const itemCount = folderItemCount(registry, node);

  return (
    <div className={`tree-node ${isOpen ? "open" : ""}`}>
      <button type="button" className="folder-row" onClick={() => onToggle(node.id)}>
        <div className="chevron">▶</div>
        <span className="folder-icon">📁</span>
        <span className="folder-label">{node.name}</span>
        <span className="folder-desc">— {node.description}</span>
        <span className="folder-count">{itemCount} items</span>
      </button>

      <div className="children">
        {childNodes.map((child) => {
          if (child.type === "folder") {
            return (
              <TreeFolder
                key={child.id}
                registry={registry}
                node={child}
                openFolderIds={openFolderIds}
                onToggle={onToggle}
              />
            );
          }

          const ext = fileExtension(child.name);
          const subItems = buildFileSubItems(child);
          return (
            <div key={child.id} className="file-row">
              <div className="file-name-row">
                <span className="file-name">{child.name}</span>
                <span className={`file-ext ${extensionClass(ext)}`}>{ext ? `.${ext}` : "file"}</span>
                <span className="file-desc">— {child.description}</span>
              </div>

              {subItems.length > 0 && (
                <div className="file-subs">
                  {subItems.map((item, index) => renderFileSubItem(item, `${child.id}-${index}`))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AppArchitecturePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const baselineRegistry = useMemo(
    () => buildArchitectureRegistry(GENERATED_PATHS, "Chronicle-main"),
    [],
  );

  const [registry, setRegistry] = useState<ArchitectureRegistry>(baselineRegistry);
  const [openFolderIds, setOpenFolderIds] = useState<Set<string>>(
    buildDefaultOpenSet(baselineRegistry),
  );
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!isPersistedArchitectureState(parsed)) return;
      setRegistry(parsed.registry);
    } catch {
      // Preserve baseline when storage is invalid.
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const payload: PersistedArchitectureState = { registry };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [registry]);

  useEffect(() => {
    setOpenFolderIds(buildDefaultOpenSet(registry));
  }, [registry]);

  const handleBack = useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/?tab=admin&adminTool=style_guide");
  }, [navigate]);

  const handleToggleFolder = useCallback((nodeId: string) => {
    setOpenFolderIds((current) => {
      const next = new Set(current);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const handleExport = useCallback(() => {
    const payload: ArchitectureTransferPackage = {
      packageType: "chronicle-app-architecture",
      packageVersion: 1,
      exportedAt: new Date().toISOString(),
      registry,
      notesByNodeId: {},
    };
    downloadJson(`chronicle-app-architecture-${toCompactIso()}.json`, payload);
    setFeedback("Architecture map exported.");
  }, [registry]);

  const handleImport = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (isArchitectureTransferPackage(parsed)) {
        setRegistry(parsed.registry);
        setFeedback(`Imported architecture package from ${file.name}.`);
        return;
      }
      if (isArchitectureRegistry(parsed)) {
        setRegistry(parsed);
        setFeedback(`Imported architecture registry from ${file.name}.`);
        return;
      }
      setFeedback("Import failed: invalid architecture JSON.");
    } catch {
      setFeedback("Import failed: file could not be parsed.");
    }
  }, []);

  const handleReset = useCallback(() => {
    setRegistry(baselineRegistry);
    setFeedback("Reset to generated baseline.");
  }, [baselineRegistry]);

  const rootNode = registry.nodes[registry.rootId];
  const totalNodes = registry.stats.totalFolders + registry.stats.totalFiles;

  if (!rootNode) return null;

  return (
    <div className="flex flex-col h-screen bg-white">
      <style>{architectureStyles}</style>

      <header className="flex-shrink-0 h-14 border-b border-slate-200 bg-white flex items-center px-4 lg:px-8 shadow-sm gap-3">
        <button
          type="button"
          onClick={handleBack}
          className="p-2 text-[hsl(var(--ui-surface-2))] hover:bg-slate-100 rounded-full transition-colors"
          aria-label="Go back"
          title="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <h1 className="text-lg font-black text-[hsl(var(--ui-surface-2))] uppercase tracking-tight">
          App Architecture
        </h1>

        <div className="ml-auto flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleImport}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 justify-center h-10 px-5 rounded-xl border-none bg-[#2f3137] text-[#eaedf1] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] hover:bg-[#343439] transition-all active:scale-95 text-[10px] font-bold leading-none uppercase tracking-wider"
          >
            <Upload className="w-4 h-4" />
            Import
          </button>

          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-2 justify-center h-10 px-5 rounded-xl border-none bg-[#2f3137] text-[#eaedf1] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] hover:bg-[#343439] transition-all active:scale-95 text-[10px] font-bold leading-none uppercase tracking-wider"
          >
            <Download className="w-4 h-4" />
            Export
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 justify-center h-10 px-5 rounded-xl border-none bg-[#2f3137] text-[#eaedf1] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] hover:bg-[#343439] transition-all active:scale-95 text-[10px] font-bold leading-none uppercase tracking-wider"
          >
            <RefreshCcw className="w-4 h-4" />
            Reset
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-auto app-architecture-page">
        <div className="content-shell">
          <h2 className="arch-title">
            Chronicle Architecture Map — Visual Delineation Between React Components vs. Features
          </h2>

          <div className="legend">
            <h3>Architecture Map — Structure Guide</h3>

            <div className="legend-section">
              <div className="legend-section-title">Hierarchy (top to bottom)</div>
              <div className="legend-row">
                <span style={{ color: "#e67e22", fontWeight: 700 }}>📁 Folder</span> — A real directory in
                the project. Orange label, tight orange border. Clicking it expands/collapses its contents.
              </div>
              <div className="legend-row">
                <span style={{ color: "#1565c0", fontWeight: 600 }}>filename.tsx</span>{" "}
                <span className="file-ext tsx" style={{ fontSize: "9px" }}>
                  .tsx
                </span>{" "}
                — A real file inside that folder. Blue name with an extension badge, followed by a plain
                English summary.
              </div>
              <div className="legend-row">
                <span className="sub-tag component">react component</span> — An actual React component
                defined in the file. Purple name. These are real named components inferred from source.
              </div>
              <div className="legend-row">
                <span className="sub-tag feature">feature</span> — A capability, behavior, or function
                inside a file or component. Blue name. These describe what the code does in plain English.
              </div>
            </div>

            <hr className="legend-rule" />

            <div className="legend-section">
              <div className="legend-section-title">Nesting Rules</div>
              <div style={{ margin: "3px 0" }}>
                Folders contain files. Files contain React components and/or features. If a React component
                has notable features, those features are nested under that component. If a file has no React
                components, its features are listed directly under the file.
              </div>
            </div>

            <hr className="legend-rule" />

            <div className="legend-section">
              <div className="legend-section-title">Visual Rules</div>
              <div style={{ margin: "3px 0" }}>
                White background, black connector lines, and 90-degree connector branches. Folder names are
                orange (#e67e22). File names are blue (#1565c0). React component names are purple (#7b1fa2).
                Feature names are blue (#1565c0). The tree reads top-to-bottom and left-to-right.
              </div>
            </div>

            <hr className="legend-rule" />

            <div className="legend-section">
              <div className="legend-section-title">Current Snapshot</div>
              <div style={{ margin: "3px 0" }}>
                Registry includes {registry.stats.totalFolders} folders and {registry.stats.totalFiles} files (
                {totalNodes} total nodes in scope). Use Import/Export to move this structure between tools.
              </div>
            </div>
          </div>

          <div className="tree">
            <TreeFolder
              registry={registry}
              node={rootNode}
              openFolderIds={openFolderIds}
              onToggle={handleToggleFolder}
            />
          </div>

          {feedback && (
            <p
              style={{
                marginTop: "14px",
                color: "#2f3137",
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                fontSize: "12px",
              }}
            >
              {feedback}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
