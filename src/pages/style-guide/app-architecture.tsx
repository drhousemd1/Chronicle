import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import {
  ArchitectureNode,
  ArchitectureRegistry,
  buildArchitectureRegistry,
  countDescendants,
} from "@/lib/app-architecture-utils";
import { architectureFileAnalysis } from "@/data/architecture-file-analysis";
import {
  manualArchitectureFileByPath,
  manualArchitectureFiles,
} from "@/data/app-architecture-manual";
import type { ManualArchitectureFile } from "@/data/app-architecture-manual/types";
import { databaseSchemaInventory } from "@/data/database-schema-inventory";
import {
  AppArchitectureExportFile,
  AppArchitectureExportNavSection,
  buildAppArchitectureMarkdown,
} from "@/lib/app-architecture-export";
import securityShieldIcon from "@/assets/admin/security-shield-v2-cropped.png";

const MANUAL_ARCHITECTURE_PATHS = manualArchitectureFiles
  .map((file) => file.path)
  .sort((a, b) => a.localeCompare(b));

const FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "service", label: "Services" },
  { value: "hook", label: "Hooks" },
  { value: "context", label: "Contexts" },
  { value: "component", label: "React Components" },
  { value: "feature", label: "Features" },
  { value: "code-logic", label: "Code Logic" },
  { value: "context-injection", label: "Context Injection" },
  { value: "data-block", label: "Data Blocks" },
  { value: "db-table", label: "Database Tables" },
  { value: "db-migration", label: "DB Migrations" },
  { value: "edge-fn", label: "Edge Functions" },
  { value: "integration", label: "Integrations" },
  { value: "documentation", label: "Documentation" },
  { value: "tooling", label: "Tooling" },
  { value: "script", label: "Scripts" },
  { value: "test", label: "Tests" },
  { value: "api-call", label: "API Calls" },
  { value: "security", label: "Security" },
] as const;

type FilterValue = (typeof FILTER_OPTIONS)[number]["value"];

type NavSnapshotEntry =
  | {
      kind: "file";
      path: string;
    }
  | {
      kind: "folder";
      path: string;
      children: NavSnapshotEntry[];
    };

type NavSnapshotSection = {
  title: string;
  path?: string;
  children: NavSnapshotEntry[];
};

type FileAnalysis = {
  imports: string[];
  importedBy: string[];
  tables: string[];
  tableReads: string[];
  tableWrites: string[];
  rpcs: string[];
  edgeFunctions: string[];
  storageBuckets: string[];
  storageReads: string[];
  storageWrites: string[];
  localStorageReads: string[];
  localStorageWrites: string[];
  sessionStorageReads: string[];
  sessionStorageWrites: string[];
};

type DetailLineKind = "files" | "tables" | "rpcs" | "edges" | "buckets" | "plain";

type DetailLine = {
  label: string;
  values: string[];
  kind: DetailLineKind;
};

type FileRow = {
  id: string;
  title: string;
  summary: string;
  badgeLabel: string;
  badgeClass:
    | "component"
    | "feature"
    | "code-logic"
    | "data-block"
    | "context-injection"
    | "edge-fn"
    | "db-table"
    | "integration"
    | "api-call"
    | "hook"
    | "context"
    | "documentation"
    | "tooling"
    | "script"
    | "test"
    | "db-migration";
  details: DetailLine[];
  signal?: "refactor" | "issue";
  note?: string;
  security?: boolean;
};

type HeaderBadge = ManualArchitectureFile["header"];

const PAID_AI_EDGE_FUNCTIONS = new Set([
  "chat",
  "extract-character-updates",
  "extract-memory-events",
  "compress-day-memories",
  "evaluate-goal-progress",
  "evaluate-goal-alignment",
  "generate-cover-image",
  "generate-scene-image",
  "generate-side-character",
  "generate-side-character-avatar",
]);

const FOLDER_ICON_DATA_URI =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='22' height='22' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M3.5 7.5c0-1.1.9-2 2-2h4.2l1.6 1.7h7.2c1.1 0 2 .9 2 2v6.8c0 1.1-.9 2-2 2H5.5c-1.1 0-2-.9-2-2V7.5Z' fill='%239bd0ff'/%3E%3Cpath d='M3.5 8.6c0-.9.7-1.6 1.6-1.6h5.3c.4 0 .8.2 1.1.5l.9.9h6.4c.9 0 1.6.7 1.6 1.6v5.9c0 .9-.7 1.6-1.6 1.6H5.1c-.9 0-1.6-.7-1.6-1.6V8.6Z' fill='url(%23g)' stroke='rgba(255,255,255,0.32)' stroke-width='.6'/%3E%3Cdefs%3E%3ClinearGradient id='g' x1='12' y1='7' x2='12' y2='17.5' gradientUnits='userSpaceOnUse'%3E%3Cstop stop-color='%237da4d3'/%3E%3Cstop offset='1' stop-color='%235f85b3'/%3E%3C/linearGradient%3E%3C/defs%3E%3C/svg%3E";

type SchemaTable = (typeof databaseSchemaInventory.tables)[keyof typeof databaseSchemaInventory.tables];
type SchemaFunction = (typeof databaseSchemaInventory.database_functions)[number];
type SchemaBucket = (typeof databaseSchemaInventory.storage_buckets)[number];
type SchemaEdgeFunction = (typeof databaseSchemaInventory.edge_functions)[number];

const ROOT_CHILD_ORDER: readonly string[] = [
  "README.md",
  "package.json",
  "vite.config.ts",
  "playwright.config.ts",
  "eslint.config.js",
  "tsconfig.json",
  "components.json",
  "src",
  "docs",
  "public",
  "scripts",
  "e2e",
  "supabase",
];

const DETAIL_HELPERS: Record<string, string> = {
  Defines: "Shows the primary contracts, registries, or behaviors this file explicitly owns.",
  Uses: "Shows other code files this file directly imports and depends on.",
  Calls: "Shows backend functions or services this file triggers directly.",
  "Renders / Opens": "Shows the visible UI blocks, modal flows, or screens this file directly renders or opens.",
  "Uses Table": "Shows backend tables this file directly reads from or writes to.",
  "Uses Tables": "Shows backend tables this file directly reads from or writes to.",
  "Reads Table": "Shows backend tables this file directly reads from without changing durable rows.",
  "Reads Tables": "Shows backend tables this file directly reads from without changing durable rows.",
  "Mutates Table": "Shows backend tables this file directly inserts, updates, upserts, or deletes.",
  "Mutates Tables": "Shows backend tables this file directly inserts, updates, upserts, or deletes.",
  "Uses RPC": "Shows database functions this file calls through Supabase RPC.",
  "Uses RPCs": "Shows database functions this file calls through Supabase RPC.",
  "Uses Storage": "Shows storage buckets this file reads from or writes to.",
  "Reads Storage": "Shows storage buckets this file reads, lists, or resolves URLs from.",
  "Mutates Storage": "Shows storage buckets this file uploads to, removes from, or otherwise changes.",
  "Reads Browser Storage": "Shows localStorage or sessionStorage keys this file reads in the browser runtime.",
  "Mutates Browser Storage": "Shows localStorage or sessionStorage keys this file writes or clears in the browser runtime.",
  "Used By": "Shows other files that import and depend on this file.",
  Access: "Shows the access boundary this row operates inside.",
  Mutates: "Shows the durable data or state this row can change.",
  Requires: "Shows the conditions that must be true before this row can work safely.",
  "Tracks Usage In": "Shows the analytics or billing table that records the paid event path.",
  "Code Reference": "Shows backend names the code is currently expecting to exist.",
  "Verified Tables": "Shows matching real backend tables from the latest schema export.",
  Columns: "Shows how many fields exist on the live database table.",
  RLS: "Row Level Security policies controlling who can access rows in this table.",
};

const architectureStyles = `
.app-architecture-page {
  --bg: #121214;
  --text: #e0e0e0;
  --line: #555555;
  --indent: 28px;
  --danger-red: #ef4444;
  --live-header-height: 76px;
  --nav-rail-width: 296px;
  --header-pad-x: 24px;
  --content-pad: 24px;
  min-height: 100%;
  height: 100%;
  background: var(--bg);
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.app-architecture-page * {
  box-sizing: border-box;
}

.app-architecture-page .page-header {
  position: sticky;
  top: 0;
  z-index: 30;
  background: rgba(255,255,255,0.96);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #e0e0e0;
  padding: 14px 24px;
  display: flex;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
}

.app-architecture-page .page-title {
  font-size: 17px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #111111;
}

.app-architecture-page .header-spacer {
  flex: 1 1 auto;
}

.app-architecture-page .legend-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 0 16px;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.08);
  background: #2b2b2e;
  color: #f7fbff;
  font-size: 12px;
  font-weight: 700;
  box-shadow:
    0 10px 24px rgba(0,0,0,0.16),
    inset 0 1px 0 rgba(255,255,255,0.04);
}

.app-architecture-page .page-shell {
  display: flex;
  align-items: stretch;
  min-height: calc(100vh - var(--live-header-height));
}

.app-architecture-page .nav-rail-shell {
  flex: 0 0 var(--nav-rail-width);
  width: var(--nav-rail-width);
  height: calc(100vh - var(--live-header-height));
  min-height: calc(100vh - var(--live-header-height));
  max-height: calc(100vh - var(--live-header-height));
  position: sticky;
  top: var(--live-header-height);
  align-self: flex-start;
  background: #2a2a2f;
  border-right: 1px solid rgba(255,255,255,0.08);
  box-shadow:
    0 18px 42px -24px rgba(0,0,0,0.68),
    inset 1px 0 0 rgba(255,255,255,0.04),
    inset -1px 0 0 rgba(0,0,0,0.26);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 9;
}

.app-architecture-page .nav-rail-body {
  flex: 1;
  height: 100%;
  min-height: 0;
  padding: 16px 14px 20px;
  background: #2e2e33;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  scrollbar-width: none;
}

.app-architecture-page .nav-rail-body::-webkit-scrollbar {
  display: none;
}

.app-architecture-page .nav-root-link {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  min-height: 44px;
  width: 100%;
  padding: 0 16px;
  margin-bottom: 12px;
  border-radius: 14px;
  background: linear-gradient(180deg, #6f8db5 0%, #4f688a 100%);
  box-shadow:
    0 10px 22px rgba(0,0,0,0.24),
    inset 0 1px 0 rgba(255,255,255,0.12),
    inset 0 -1px 0 rgba(0,0,0,0.22);
  color: #f7fbff;
  text-decoration: none;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: -0.01em;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  text-align: left;
}

.app-architecture-page .nav-section-stack {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.app-architecture-page .nav-section {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.app-architecture-page .nav-section-link,
.app-architecture-page .nav-section-title {
  display: flex;
  align-items: center;
  min-height: 42px;
  padding: 0 14px;
  border-radius: 14px;
  background: #3c3e47;
  border: 1px solid rgba(0,0,0,0.3);
  box-shadow:
    0 8px 20px rgba(0,0,0,0.28),
    inset 0 1px 0 rgba(255,255,255,0.07),
    inset 0 -1px 0 rgba(0,0,0,0.18);
  color: rgba(255,255,255,0.92);
  text-decoration: none;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: -0.01em;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.app-architecture-page .nav-tree-group {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0 0 0 4px;
  padding-left: 18px;
}

.app-architecture-page .nav-tree-group::before {
  content: "";
  position: absolute;
  left: 8px;
  top: 8px;
  bottom: 8px;
  width: 1px;
  background: rgba(255,255,255,0.16);
}

.app-architecture-page .nav-tree-group--nested {
  margin-left: 14px;
  padding-top: 2px;
}

.app-architecture-page .nav-tree-group > .nav-tree-item,
.app-architecture-page .nav-tree-group > .nav-branch {
  position: relative;
}

.app-architecture-page .nav-tree-group > .nav-tree-item::before,
.app-architecture-page .nav-tree-group > .nav-branch::before {
  content: "";
  position: absolute;
  left: -10px;
  top: 18px;
  width: 12px;
  height: 1px;
  background: rgba(255,255,255,0.16);
}

.app-architecture-page .nav-tree-group > .nav-tree-item:last-child::after,
.app-architecture-page .nav-tree-group > .nav-branch:last-child::after {
  content: "";
  position: absolute;
  left: -10px;
  top: 18px;
  bottom: -10px;
  width: 1px;
  background: #2d2e36;
}

.app-architecture-page .nav-branch {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.app-architecture-page .nav-branch-link,
.app-architecture-page .nav-tree-item {
  display: flex;
  align-items: stretch;
  gap: 0;
  min-height: 36px;
  color: #d4d4d8;
  text-decoration: none;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: -0.01em;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  min-width: 0;
  max-width: 100%;
  overflow: visible;
}

.app-architecture-page .nav-link-body {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  max-width: 100%;
  min-height: 36px;
  min-width: 0;
  padding: 0 12px;
  border-radius: 12px;
  border: 1px solid transparent;
  color: inherit;
  transition:
    background 140ms ease,
    color 140ms ease,
    border-color 140ms ease,
    box-shadow 140ms ease;
}

.app-architecture-page .nav-link-label {
  min-width: 0;
  flex: 1 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-architecture-page .nav-tree-item.nav-accent-tooling .nav-link-label { color: #d8ccff; }
.app-architecture-page .nav-tree-item.nav-accent-service .nav-link-label { color: #5eead4; }
.app-architecture-page .nav-tree-item.nav-accent-hook .nav-link-label { color: #a5b4fc; }
.app-architecture-page .nav-tree-item.nav-accent-context .nav-link-label { color: #fcd34d; }
.app-architecture-page .nav-tree-item.nav-accent-component .nav-link-label { color: #d8b4fe; }
.app-architecture-page .nav-tree-item.nav-accent-integration .nav-link-label { color: #7dd3fc; }
.app-architecture-page .nav-tree-item.nav-accent-documentation .nav-link-label { color: #eab308; }
.app-architecture-page .nav-tree-item.nav-accent-script .nav-link-label { color: #38bdf8; }
.app-architecture-page .nav-tree-item.nav-accent-test .nav-link-label { color: #f472b6; }
.app-architecture-page .nav-tree-item.nav-accent-edge-fn .nav-link-label { color: #f8fafc; }
.app-architecture-page .nav-tree-item.nav-accent-db-migration .nav-link-label { color: #34d399; }
.app-architecture-page .nav-tree-item.nav-accent-code-logic .nav-link-label { color: #cbd5e1; }
.app-architecture-page .nav-section-link {
  color: rgba(255,255,255,0.92);
}

.app-architecture-page .nav-branch-link .nav-link-label {
  color: rgba(255,255,255,0.92);
}

.app-architecture-page .nav-branch-link:hover .nav-link-body,
.app-architecture-page .nav-tree-item:hover .nav-link-body {
  background: rgba(255,255,255,0.04);
  color: #ffffff;
}

.app-architecture-page .nav-jump-link.active .nav-link-body {
  border-color: rgba(110, 137, 173, 0.45);
  background:
    linear-gradient(180deg, rgba(111,141,181,0.18) 0%, rgba(79,104,138,0.22) 100%),
    rgba(255,255,255,0.03);
  box-shadow:
    0 0 0 1px rgba(110,137,173,0.12),
    inset 0 1px 0 rgba(255,255,255,0.06);
}

.app-architecture-page .nav-section-link:hover,
.app-architecture-page .nav-root-link:hover {
  filter: brightness(1.05);
}

.app-architecture-page .nav-section-link.active,
.app-architecture-page .nav-root-link.active {
  border-color: rgba(110, 137, 173, 0.45);
}

.app-architecture-page .page-main {
  flex: 1 1 auto;
  min-width: 0;
}

.app-architecture-page .page-main-scroll {
  height: calc(100vh - var(--live-header-height));
  overflow: auto;
  padding: 24px;
}

.app-architecture-page .legend-panel {
  margin: 0 8px 24px;
  padding: 18px 20px;
  border-radius: 16px;
  background: #1f2025;
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow:
    0 18px 32px rgba(0,0,0,0.28),
    inset 0 1px 0 rgba(255,255,255,0.04);
}

.app-architecture-page .legend-title {
  font-size: 18px;
  font-weight: 800;
  color: #f5f7fb;
  margin-bottom: 16px;
}

.app-architecture-page .legend-grid {
  display: grid;
  gap: 18px;
}

.app-architecture-page .legend-section-title {
  color: #f4f7fb;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.app-architecture-page .legend-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  color: #b6bcc8;
  font-size: 13px;
  line-height: 1.55;
  margin: 6px 0;
}

.app-architecture-page .architecture-filter-dropdown {
  position: relative;
}

.app-architecture-page .architecture-filter-trigger {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 40px;
  padding: 4px 6px 4px 14px;
  border-radius: 999px;
  background: #2b2b2e;
  border: 1px solid #2b2b2e;
  box-shadow:
    0 10px 24px rgba(0,0,0,0.16),
    inset 0 1px 0 rgba(255,255,255,0.04);
  cursor: pointer;
}

.app-architecture-page .architecture-filter-trigger-label {
  color: #f4f7fb;
  font-size: 12px;
  font-weight: 700;
}

.app-architecture-page .architecture-filter-trigger-current {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
  padding: 0 14px;
  border-radius: 999px;
  background: linear-gradient(180deg, #6f8db5 0%, #4f688a 100%);
  box-shadow:
    0 8px 18px rgba(0,0,0,0.18),
    inset 0 1px 0 rgba(255,255,255,0.14),
    inset 0 -1px 0 rgba(0,0,0,0.18);
  border-top: 1px solid rgba(255,255,255,0.2);
  color: #f7fbff;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.app-architecture-page .architecture-filter-trigger-chevron {
  width: 16px;
  height: 16px;
  color: #d3d7df;
  transition: transform 0.18s ease;
}

.app-architecture-page .architecture-filter-dropdown.open .architecture-filter-trigger-chevron {
  transform: rotate(180deg);
}

.app-architecture-page .architecture-filter-menu {
  position: absolute;
  top: calc(100% + 10px);
  left: 0;
  min-width: 240px;
  max-height: min(68vh, 520px);
  overflow: auto;
  display: grid;
  gap: 6px;
  padding: 10px;
  border-radius: 18px;
  background: #2b2b2e;
  border: 1px solid rgba(255,255,255,0.06);
  box-shadow:
    0 24px 48px rgba(0,0,0,0.34),
    inset 0 1px 0 rgba(255,255,255,0.05);
  z-index: 40;
}

.app-architecture-page .architecture-filter-option {
  width: 100%;
  border: none;
  background: transparent;
  color: #a1a1aa;
  padding: 9px 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
  text-align: left;
  cursor: pointer;
}

.app-architecture-page .architecture-filter-option:hover {
  color: #eef2f7;
  background: rgba(255,255,255,0.04);
}

.app-architecture-page .architecture-filter-option.is-active {
  color: #f7fbff;
  background: linear-gradient(180deg, #6f8db5 0%, #4f688a 100%);
  box-shadow:
    0 8px 18px rgba(0,0,0,0.18),
    inset 0 1px 0 rgba(255,255,255,0.14),
    inset 0 -1px 0 rgba(0,0,0,0.18);
}

.app-architecture-page .architecture-tree.filter-mode-active .filter-dim,
.app-architecture-page .filter-mode-active .schema-block.filter-dim {
  opacity: 0.28;
  filter: grayscale(1) saturate(0.18);
}

.app-architecture-page .architecture-tree .folder-row,
.app-architecture-page .architecture-tree .app-card,
.app-architecture-page .architecture-tree .detail-block,
.app-architecture-page .schema-block {
  transition: opacity 0.18s ease, filter 0.18s ease, box-shadow 0.18s ease;
}

.app-architecture-page .tree-node {
  position: relative;
  padding: 12px 0;
}

.app-architecture-page .tree-node.root-node {
  border-left: none;
}

.app-architecture-page .children {
  display: none;
  margin-left: var(--indent);
  position: relative;
}

.app-architecture-page .tree-node.open > .children {
  display: block;
}

.app-architecture-page .children > .item-row,
.app-architecture-page .children > .tree-node {
  border-left: 1px solid var(--line);
}

.app-architecture-page .children > :last-child {
  border-left-color: transparent;
}

.app-architecture-page .children > .item-row,
.app-architecture-page .children > .tree-node {
  position: relative;
}

.app-architecture-page .children > .item-row::before,
.app-architecture-page .children > .tree-node::before {
  content: '';
  position: absolute;
  top: 0;
  left: -1px;
  width: 15px;
  height: 14px;
  border: solid var(--line);
  border-width: 0 0 1px 1px;
}

.app-architecture-page .root-node > .children::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: calc(-1 * var(--indent));
  border-left: 1px solid var(--line);
}

.app-architecture-page .root-node > .children > .item-row,
.app-architecture-page .root-node > .children > .tree-node {
  border-left: none;
}

.app-architecture-page .root-node > .children > .item-row::before,
.app-architecture-page .root-node > .children > .tree-node::before {
  left: calc(-1 * var(--indent));
  width: calc(var(--indent) + 15px);
}

.app-architecture-page .folder-row {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 42px;
  padding: 9px 16px;
  border-radius: 12px;
  cursor: pointer;
  background: linear-gradient(180deg, #c07840 0%, #a5652e 100%);
  border-top: 1px solid rgba(255,255,255,0.22);
  color: #ffffff;
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.35);
  overflow: hidden;
}

.app-architecture-page .folder-row::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.00) 30%);
  pointer-events: none;
}

.app-architecture-page .folder-row:hover {
  box-shadow: 0 12px 20px -3px rgba(0,0,0,0.40);
  filter: brightness(1.08);
}

.app-architecture-page .folder-row.is-root {
  margin-left: 8px;
}

.app-architecture-page .folder-icon {
  width: 20px;
  height: 20px;
  color: #9bd0ff;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

.app-architecture-page .chevron-icon {
  width: 18px;
  height: 18px;
  color: rgba(255,255,255,0.78);
  transition: transform 0.15s ease;
  position: relative;
  z-index: 1;
  flex-shrink: 0;
}

.app-architecture-page .tree-node.open > .folder-row > .chevron-icon,
.app-architecture-page details[open] > summary .detail-chevron {
  transform: rotate(180deg);
}

.app-architecture-page .folder-label {
  font-weight: 700;
  color: #ffffff;
  font-size: 15px;
  letter-spacing: -0.015em;
  position: relative;
  z-index: 1;
}

.app-architecture-page .folder-desc {
  color: rgba(255,255,255,0.7);
  font-weight: 400;
  font-size: 12px;
  margin-left: 4px;
  position: relative;
  z-index: 1;
}

.app-architecture-page .folder-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 22px;
  padding: 0 9px;
  margin-left: 4px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #ffffff;
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.20);
  border-radius: 999px;
  white-space: nowrap;
  position: relative;
  z-index: 1;
}

.app-architecture-page .app-card {
  margin: 0 0 16px;
  border-radius: 16px;
  overflow: hidden;
  background: #2a2a2f;
  box-shadow:
    0 12px 32px -2px rgba(0,0,0,0.50),
    inset 1px 1px 0 rgba(255,255,255,0.09),
    inset -1px -1px 0 rgba(0,0,0,0.35);
}

.app-architecture-page .app-card.has-error {
  position: relative;
  border: 2px solid rgba(255,70,70,0.95);
  box-shadow:
    0 0 2px rgba(255,40,40,0.95),
    0 0 6px rgba(255,30,30,0.95),
    0 0 14px rgba(255,20,20,0.9),
    0 0 22px rgba(255,10,10,0.6),
    0 0 32px rgba(255,0,0,0.3),
    inset 0 0 1px rgba(255,255,255,0.2);
}

.app-architecture-page .app-card.has-error::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 16px;
  background: radial-gradient(circle at 50% 50%, rgba(255,0,0,0) 70%, rgba(255,0,0,0.06) 82%, rgba(255,0,0,0.12) 92%, rgba(255,0,0,0.15) 100%);
  filter: blur(10px);
  transform: scale(1.01);
  pointer-events: none;
  z-index: -1;
}

.app-architecture-page .app-card.has-refactor {
  position: relative;
  border: 2px solid rgba(70,130,255,0.95);
  box-shadow:
    0 0 2px rgba(40,100,255,0.95),
    0 0 6px rgba(30,90,255,0.95),
    0 0 14px rgba(20,80,255,0.9),
    0 0 22px rgba(10,70,255,0.6),
    0 0 32px rgba(0,60,255,0.3),
    inset 0 0 1px rgba(255,255,255,0.2);
}

.app-architecture-page .app-card.has-refactor::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 16px;
  background: radial-gradient(circle at 50% 50%, rgba(0,60,255,0) 70%, rgba(0,60,255,0.06) 82%, rgba(0,60,255,0.12) 92%, rgba(0,60,255,0.15) 100%);
  filter: blur(10px);
  transform: scale(1.01);
  pointer-events: none;
  z-index: -1;
}

.app-architecture-page .highlighted-card {
  box-shadow:
    0 0 0 2px rgba(255,255,255,0.18),
    0 0 0 5px rgba(96, 165, 250, 0.25),
    0 18px 36px rgba(0,0,0,0.52),
    inset 1px 1px 0 rgba(255,255,255,0.09),
    inset -1px -1px 0 rgba(0,0,0,0.35);
}

.app-architecture-page .app-card-header {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: linear-gradient(180deg, #5a7292 0%, #4a5f7f 100%);
  border-top: 1px solid rgba(255,255,255,0.20);
  box-shadow: 0 6px 16px rgba(0,0,0,0.35);
}

.app-architecture-page .app-card-header::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0) 30%);
  pointer-events: none;
}

.app-architecture-page .tag,
.app-architecture-page .tag-dark {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  padding: 1px 6px;
  border-radius: 2px;
  vertical-align: baseline;
  white-space: nowrap;
}

.app-architecture-page .tag-dark {
  font-size: 11px;
  padding: 3px 9px;
  border-radius: 8px;
  background: #2a2a2f;
}

.app-architecture-page .tag.code-logic,
.app-architecture-page .tag-dark.code-logic { background: rgba(85,85,85,0.10); color: #d1d5db; border: 1px solid rgba(85,85,85,0.3); }
.app-architecture-page .tag.component,
.app-architecture-page .tag-dark.component { background: rgba(123,31,162,0.12); color: #c084fc; border: 1px solid rgba(123,31,162,0.25); }
.app-architecture-page .tag.feature,
.app-architecture-page .tag-dark.feature { background: rgba(21,101,192,0.10); color: #60a5fa; border: 1px solid rgba(21,101,192,0.25); }
.app-architecture-page .tag.service,
.app-architecture-page .tag-dark.service,
.app-architecture-page .tag.data-block,
.app-architecture-page .tag-dark.data-block { background: rgba(15,118,110,0.10); color: #2dd4bf; border: 1px solid rgba(15,118,110,0.3); }
.app-architecture-page .tag.context-injection,
.app-architecture-page .tag-dark.context-injection,
.app-architecture-page .tag.context,
.app-architecture-page .tag-dark.context { background: rgba(230,126,34,0.10); color: #fb923c; border: 1px solid rgba(230,126,34,0.3); }
.app-architecture-page .tag.hook,
.app-architecture-page .tag-dark.hook { background: rgba(79,70,229,0.10); color: #a5b4fc; border: 1px solid rgba(79,70,229,0.25); }
.app-architecture-page .tag.edge-fn,
.app-architecture-page .tag-dark.edge-fn { background: rgba(220,38,38,0.08); color: #f8fafc; border: 1px solid rgba(220,38,38,0.2); }
.app-architecture-page .tag.db-table,
.app-architecture-page .tag-dark.db-table,
.app-architecture-page .tag.db-migration,
.app-architecture-page .tag-dark.db-migration { background: rgba(6,78,59,0.10); color: #34d399; border: 1px solid rgba(6,78,59,0.3); }
.app-architecture-page .tag.integration,
.app-architecture-page .tag-dark.integration { background: rgba(3,105,161,0.08); color: #7dd3fc; border: 1px solid rgba(3,105,161,0.2); }
.app-architecture-page .tag.api-call,
.app-architecture-page .tag-dark.api-call { background: rgba(239,68,68,0.08); color: var(--danger-red); border: 1px solid rgba(239,68,68,0.2); }
.app-architecture-page .tag.documentation,
.app-architecture-page .tag-dark.documentation { background: rgba(250,204,21,0.10); color: #eab308; border: 1px solid rgba(250,204,21,0.24); }
.app-architecture-page .tag.tooling,
.app-architecture-page .tag-dark.tooling { background: rgba(196,181,253,0.10); color: #d8ccff; border: 1px solid rgba(196,181,253,0.24); }
.app-architecture-page .tag.script,
.app-architecture-page .tag-dark.script { background: rgba(56,189,248,0.10); color: #38bdf8; border: 1px solid rgba(56,189,248,0.22); }
.app-architecture-page .tag.test,
.app-architecture-page .tag-dark.test { background: rgba(244,114,182,0.10); color: #f472b6; border: 1px solid rgba(244,114,182,0.24); }

.app-architecture-page .item-name-row {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  width: 100%;
  position: relative;
  z-index: 1;
}

.app-architecture-page .item-name {
  font-weight: 800;
  font-size: 14px;
  color: #ffffff;
  min-width: 0;
}

.app-architecture-page .line-count-badge {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 22px;
  padding: 0 9px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.10);
  background: #1c1c1f;
  color: #b9bec8;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.app-architecture-page .line-count-badge.is-large { color: #ffe28a; }
.app-architecture-page .line-count-badge.is-refactor-soon { color: #ffc18c; }
.app-architecture-page .line-count-badge.is-refactor-needed {
  color: #ff8f8f;
  border-color: rgba(239,68,68,0.82);
  box-shadow:
    0 0 2px rgba(239,68,68,0.95),
    0 0 6px rgba(239,68,68,0.82),
    0 0 14px rgba(239,68,68,0.50),
    inset 0 0 1px rgba(255,255,255,0.12);
}

.app-architecture-page .app-card-body {
  padding: 16px 18px 18px;
}

.app-architecture-page .app-card-desc {
  color: #9aa2af;
  font-size: 13px;
  line-height: 1.6;
  margin-bottom: 14px;
}

.app-architecture-page .signal-note {
  margin-bottom: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  font-size: 12px;
  line-height: 1.55;
}

.app-architecture-page .signal-note.refactor {
  background: rgba(37,99,235,0.14);
  border: 1px solid rgba(96,165,250,0.32);
  color: #dbeafe;
}

.app-architecture-page .signal-note.issue {
  background: rgba(127,29,29,0.24);
  border: 1px solid rgba(248,113,113,0.36);
  color: #fee2e2;
}

.app-architecture-page .app-card-inner {
  display: grid;
  gap: 10px;
}

.app-architecture-page .app-card-row,
.app-architecture-page .detail-block > summary,
.app-architecture-page .schema-block > summary {
  list-style: none;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  width: 100%;
  padding: 13px 14px;
  border-radius: 14px;
  background: #35363d;
  border: 1px solid rgba(255,255,255,0.06);
  box-shadow:
    0 10px 22px rgba(0,0,0,0.26),
    inset 0 1px 0 rgba(255,255,255,0.05);
  cursor: default;
}

.app-architecture-page .app-card-row.has-error {
  position: relative;
  border: 2px solid rgba(255, 78, 78, 0.92);
  box-shadow:
    0 0 2px rgba(255, 50, 50, 0.95),
    0 0 6px rgba(255, 35, 35, 0.92),
    0 0 12px rgba(255, 20, 20, 0.82),
    0 0 18px rgba(255, 10, 10, 0.45),
    inset 0 0 1px rgba(255,255,255,0.12);
}

.app-architecture-page .app-card-row.has-refactor {
  position: relative;
  border: 2px solid rgba(70,130,255,0.95);
  box-shadow:
    0 0 2px rgba(40,100,255,0.95),
    0 0 6px rgba(30,90,255,0.92),
    0 0 12px rgba(20,80,255,0.82),
    0 0 18px rgba(10,70,255,0.4),
    inset 0 0 1px rgba(255,255,255,0.12);
}

.app-architecture-page .detail-block > summary,
.app-architecture-page .schema-block > summary {
  cursor: pointer;
}

.app-architecture-page .detail-block.has-error > summary {
  position: relative;
  border: 2px solid rgba(255, 78, 78, 0.92);
  box-shadow:
    0 0 2px rgba(255, 50, 50, 0.95),
    0 0 6px rgba(255, 35, 35, 0.92),
    0 0 12px rgba(255, 20, 20, 0.82),
    0 0 18px rgba(255, 10, 10, 0.45),
    inset 0 0 1px rgba(255,255,255,0.12);
}

.app-architecture-page .detail-block.has-refactor > summary {
  position: relative;
  border: 2px solid rgba(70,130,255,0.95);
  box-shadow:
    0 0 2px rgba(40,100,255,0.95),
    0 0 6px rgba(30,90,255,0.92),
    0 0 12px rgba(20,80,255,0.82),
    0 0 18px rgba(10,70,255,0.4),
    inset 0 0 1px rgba(255,255,255,0.12);
}

.app-architecture-page .detail-block > summary::-webkit-details-marker,
.app-architecture-page .schema-block > summary::-webkit-details-marker {
  display: none;
}

.app-architecture-page .detail-summary-inline,
.app-architecture-page .schema-summary-inline {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1 1 auto;
  flex-wrap: wrap;
}

.app-architecture-page .sub-name {
  color: #f3f4f6;
  font-weight: 700;
  font-size: 13px;
}

.app-architecture-page .sub-desc {
  color: #9ca3af;
  font-size: 12px;
  line-height: 1.5;
}

.app-architecture-page .detail-chevron {
  width: 18px;
  height: 18px;
  color: rgba(255,255,255,0.72);
  margin-left: auto;
  flex-shrink: 0;
  transition: transform 0.15s ease;
}

.app-architecture-page .detail-content,
.app-architecture-page .schema-content {
  padding: 12px 14px 6px 18px;
}

.app-architecture-page .detail-line,
.app-architecture-page .schema-list,
.app-architecture-page .schema-column-meta,
.app-architecture-page .schema-description {
  color: #aeb5c1;
  font-size: 12px;
  line-height: 1.65;
}

.app-architecture-page .detail-line strong,
.app-architecture-page .schema-list strong {
  color: #d9dde5;
}

.app-architecture-page .detail-link {
  border: none;
  background: transparent;
  color: #d6e6ff;
  font-size: 12px;
  font-weight: 600;
  padding: 0;
  text-decoration: underline;
  text-underline-offset: 2px;
  margin-right: 8px;
}

.app-architecture-page .detail-link.table-link { color: #8ce9c6; }
.app-architecture-page .detail-link.rpc-link { color: #f4d38b; }
.app-architecture-page .detail-link.edge-link { color: #f4a3a3; }
.app-architecture-page .detail-link.bucket-link { color: #8dd7ff; }

.app-architecture-page .detail-pill {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(255,255,255,0.08);
  color: #d4d7dd;
  margin-right: 8px;
  margin-top: 6px;
}

.app-architecture-page .security-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  background: rgba(217, 119, 6, 0.14);
  border: 1px solid rgba(245, 158, 11, 0.36);
  color: #fbbf24;
  box-shadow: 0 0 0 1px rgba(0,0,0,0.12);
}

.app-architecture-page .backend-section {
  margin: 28px 8px 0;
  display: grid;
  gap: 12px;
}

.app-architecture-page .backend-title {
  color: #f4f7fb;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.app-architecture-page .schema-grid {
  display: grid;
  gap: 12px;
}

.app-architecture-page .schema-column-list {
  display: grid;
  gap: 10px;
  margin-top: 10px;
}

.app-architecture-page .schema-column {
  padding: 10px 12px;
  border-radius: 12px;
  background: #303138;
  border: 1px solid rgba(255,255,255,0.06);
}

.app-architecture-page .schema-column-name {
  color: #f4f7fb;
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 4px;
}

.app-architecture-page .schema-stats {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.app-architecture-page .schema-stat {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(255,255,255,0.08);
  color: #dbe1eb;
  font-size: 11px;
}

.app-architecture-page .schema-stat-label {
  color: #9aa2af;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-size: 10px;
}

.app-architecture-page button {
  appearance: none;
}

.app-architecture-page .header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #e0e0e0;
  padding: 14px var(--header-pad-x);
  display: flex;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
}

.app-architecture-page .header-filter-wrap {
  display: flex;
  align-items: center;
  min-width: 0;
  flex: 0 0 auto;
}

.app-architecture-page .header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
}

.app-architecture-page .legend-toggle-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  margin-left: 0;
  height: 40px;
  padding: 0 20px;
  border-radius: 14px;
  border: none;
  background: #2f3137;
  color: #eaedf1;
  box-shadow:
    0 8px 24px rgba(0,0,0,0.45),
    inset 0 1px 0 rgba(255,255,255,0.09),
    inset 0 -1px 0 rgba(0,0,0,0.20);
  cursor: pointer;
  transition: background 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.app-architecture-page .legend-toggle-btn:hover { background: #343439; }
.app-architecture-page .legend-toggle-btn:active { transform: scale(0.98); }
.app-architecture-page .legend-toggle-btn[aria-expanded="true"] {
  background: #38414c;
}

.app-architecture-page .page-main {
  flex: 1 1 auto;
  min-width: 0;
}

.app-architecture-page .content {
  height: calc(100vh - 76px);
  min-height: calc(100vh - 76px);
  overflow: auto;
  padding: var(--content-pad);
}

.app-architecture-page .legend {
  margin: 0 24px 24px;
  display: none;
}

.app-architecture-page .legend.open {
  display: block;
}

.app-architecture-page .legend-shell {
  background: #2a2a2f;
  border-radius: 24px;
  overflow: hidden;
  box-shadow:
    0 12px 32px -2px rgba(0,0,0,0.50),
    inset 1px 1px 0 rgba(255,255,255,0.09),
    inset -1px -1px 0 rgba(0,0,0,0.35);
}

.app-architecture-page .legend-shell-header {
  position: relative;
  overflow: hidden;
  padding: 14px 20px 12px;
  background: linear-gradient(180deg, #5a7292 0%, #4a5f7f 100%);
  border-top: 1px solid rgba(255,255,255,0.20);
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.30);
}

.app-architecture-page .legend-shell-header::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.00) 30%);
  pointer-events: none;
}

.app-architecture-page .legend-shell-kicker {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  color: rgba(235,241,250,0.82);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.app-architecture-page .legend-shell-title {
  position: relative;
  z-index: 1;
  margin: 0;
  color: #f7f9fc;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 23px;
  line-height: 1.15;
  font-weight: 900;
  letter-spacing: -0.03em;
}

.app-architecture-page .legend-shell-body {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.app-architecture-page .legend-main-grid {
  display: grid;
  gap: 18px;
  grid-template-columns: minmax(0, 1.25fr) minmax(350px, 0.95fr);
  align-items: start;
}

.app-architecture-page .legend-card {
  background: #2e2e33;
  border-radius: 20px;
  padding: 16px;
  box-shadow:
    inset 1px 1px 0 rgba(255,255,255,0.07),
    inset -1px -1px 0 rgba(0,0,0,0.30),
    0 4px 12px rgba(0,0,0,0.25);
}

.app-architecture-page .legend-card-kicker {
  margin-bottom: 6px;
  color: #9fb3d0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.10em;
  text-transform: uppercase;
}

.app-architecture-page .legend-card-title {
  margin: 0 0 14px;
  color: #f5f7fb;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 18px;
  line-height: 1.2;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.app-architecture-page .legend-definition-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.app-architecture-page .legend-definition-item,
.app-architecture-page .legend-health-row {
  background: #1c1c1f;
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 14px;
  box-shadow:
    inset 0 3px 10px rgba(0,0,0,0.6),
    inset 0 1px 0 rgba(255,255,255,0.05);
}

.app-architecture-page .legend-definition-item {
  padding: 12px 13px;
  min-height: 92px;
}

.app-architecture-page .legend-definition-copy {
  margin: 10px 0 0;
  color: #c7ccd5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 13px;
  line-height: 1.55;
}

.app-architecture-page .legend-security-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 11px 5px 8px;
  border-radius: 10px;
  background: #1b160a;
  border: 1px solid rgba(255,211,77,0.20);
  box-shadow:
    inset 0 1px 0 rgba(255,244,195,0.14),
    0 0 0 1px rgba(0,0,0,0.12);
  color: #ffd95b;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.app-architecture-page .legend-security-badge img {
  width: 18px;
  height: 18px;
  object-fit: contain;
  flex-shrink: 0;
}

.app-architecture-page .legend-signal-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.app-architecture-page .legend-signal-item {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.app-architecture-page .legend-signal-label,
.app-architecture-page .legend-health-title {
  color: #f0f4fa;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.app-architecture-page .legend-signal-preview-card,
.app-architecture-page .legend-signal-preview-shell {
  background: #2a2a2f;
  border-radius: 16px;
  padding: 12px;
  box-shadow:
    0 6px 16px rgba(0,0,0,0.35),
    inset 1px 1px 0 rgba(255,255,255,0.07),
    inset -1px -1px 0 rgba(0,0,0,0.35);
}

.app-architecture-page .legend-signal-preview-card { min-height: 110px; }

.app-architecture-page .legend-signal-preview-card.is-blue-card {
  border: 2px solid rgba(70,130,255,0.95);
  box-shadow:
    0 0 2px rgba(40,100,255,0.95),
    0 0 6px rgba(30,90,255,0.95),
    0 0 14px rgba(20,80,255,0.9),
    0 0 22px rgba(10,70,255,0.45),
    inset 0 0 1px rgba(255,255,255,0.2);
}

.app-architecture-page .legend-signal-preview-card.is-red-card {
  border: 2px solid rgba(239,68,68,0.95);
  box-shadow:
    0 0 2px rgba(239,68,68,0.95),
    0 0 6px rgba(239,68,68,0.85),
    0 0 14px rgba(239,68,68,0.8),
    0 0 22px rgba(239,68,68,0.45),
    inset 0 0 1px rgba(255,255,255,0.2);
}

.app-architecture-page .legend-preview-mini-header {
  height: 16px;
  border-radius: 10px 10px 0 0;
  margin: -12px -12px 12px;
  background: linear-gradient(180deg, #5a7292 0%, #4a5f7f 100%);
  border-top: 1px solid rgba(255,255,255,0.12);
}

.app-architecture-page .legend-preview-mini-row {
  min-height: 46px;
  padding: 10px 12px;
  border-radius: 12px;
  background: #3c3e47;
  box-shadow:
    0 8px 24px rgba(0,0,0,0.32),
    inset 0 1px 0 rgba(255,255,255,0.08),
    inset 0 -1px 0 rgba(0,0,0,0.18);
  display: flex;
  align-items: center;
  gap: 8px;
}

.app-architecture-page .legend-preview-mini-row.is-blue-row {
  border: 2px solid rgba(70,130,255,0.95);
  box-shadow:
    0 0 2px rgba(40,100,255,0.95),
    0 0 6px rgba(30,90,255,0.95),
    0 0 14px rgba(20,80,255,0.55),
    inset 0 1px 0 rgba(255,255,255,0.08),
    inset 0 -1px 0 rgba(0,0,0,0.18);
}

.app-architecture-page .legend-preview-mini-row.is-red-row {
  border: 2px solid rgba(239,68,68,0.95);
  box-shadow:
    0 0 2px rgba(239,68,68,0.95),
    0 0 6px rgba(239,68,68,0.85),
    0 0 14px rgba(239,68,68,0.55),
    inset 0 1px 0 rgba(255,255,255,0.08),
    inset 0 -1px 0 rgba(0,0,0,0.18);
}

.app-architecture-page .legend-preview-mini-copy {
  color: #d8dce4;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 12px;
  line-height: 1.45;
  font-weight: 600;
}

.app-architecture-page .legend-signal-copy {
  margin: 0;
  color: #b9c0cb;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 13px;
  line-height: 1.5;
}

.app-architecture-page .legend-health-block {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(255,255,255,0.07);
}

.app-architecture-page .legend-health-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 12px;
}

.app-architecture-page .legend-health-row {
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.app-architecture-page .legend-health-copy {
  color: #c5cad2;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 13px;
  line-height: 1.5;
}

.app-architecture-page .tree > .tree-node {
  border-left: 2px solid var(--line);
  padding-left: 22px;
  margin-left: 8px;
}

.app-architecture-page .tree > .tree-node:last-child {
  border-left-color: transparent;
}

.app-architecture-page .tree > .tree-node::before {
  content: '';
  position: absolute;
  top: 0;
  left: -2px;
  width: 20px;
  height: 16px;
  border: solid var(--line);
  border-width: 0 0 2px 2px;
}

.app-architecture-page .tree > .tree-node.root-node {
  border-left: none;
  padding-left: 0;
  margin-left: 0;
}

.app-architecture-page .tree > .tree-node.root-node::before {
  display: none;
}

.app-architecture-page .tree > .tree-node.root-node > .children {
  position: relative;
}

.app-architecture-page .tree > .tree-node.root-node > .children::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: calc(-1 * var(--indent));
  border-left: 2px solid var(--line);
}

.app-architecture-page .folder-row {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 16px;
  border-radius: 12px;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s ease;
  background: linear-gradient(180deg, #c07840 0%, #a5652e 100%);
  border-top: 1px solid rgba(255,255,255,0.22);
  border-left: none;
  border-right: none;
  border-bottom: none;
  margin: 2px 0;
  color: #ffffff;
  overflow: hidden;
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.35);
}

.app-architecture-page .folder-row::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.00) 30%);
  pointer-events: none;
}

.app-architecture-page .folder-row:hover {
  box-shadow: 0 12px 20px -3px rgba(0,0,0,0.40);
  filter: brightness(1.08);
}

.app-architecture-page .folder-row:active { transform: scale(0.98); }

.app-architecture-page .folder-icon-image {
  width: 22px;
  height: 22px;
  object-fit: contain;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

.app-architecture-page .chevron {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
  font-size: 0;
  color: transparent;
  transition: transform 0.15s ease;
  transform: rotate(-90deg);
}

.app-architecture-page .chevron::before {
  content: '';
  display: block;
  width: 18px;
  height: 18px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.78)' stroke-width='2.6' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: center;
  background-size: 18px 18px;
}

.app-architecture-page .tree-node.open > .folder-row > .chevron {
  transform: rotate(0deg);
}

.app-architecture-page .children {
  display: none;
  margin-left: var(--indent);
  position: relative;
}

.app-architecture-page .tree-node.open > .children {
  display: block;
}

.app-architecture-page .architecture-tree .children::before {
  display: none;
}

.app-architecture-page .architecture-tree .children > .item-row,
.app-architecture-page .architecture-tree .children > .tree-node {
  border-left: 1px solid var(--line);
}

.app-architecture-page .architecture-tree .children > :last-child {
  border-left-color: transparent;
}

.app-architecture-page .architecture-tree > .tree-node.root-node > .children::before {
  display: block;
  left: calc(-1 * var(--indent));
  border-left: 1px solid var(--line);
}

.app-architecture-page .architecture-tree > .tree-node.root-node > .children > .item-row,
.app-architecture-page .architecture-tree > .tree-node.root-node > .children > .tree-node {
  border-left: none;
}

.app-architecture-page .architecture-tree > .tree-node.root-node > .children > .item-row::before,
.app-architecture-page .architecture-tree > .tree-node.root-node > .children > .tree-node::before {
  left: calc(-1 * var(--indent));
  width: calc(var(--indent) + 15px);
}

.app-architecture-page .item-row {
  position: relative;
  padding: 3px 8px 3px 16px;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.app-architecture-page .item-row::before {
  content: '';
  position: absolute;
  top: 0;
  left: -1px;
  width: 15px;
  height: 14px;
  border: solid var(--line);
  border-width: 0 0 1px 1px;
}

.app-architecture-page .children > .tree-node {
  padding-left: 16px;
}

.app-architecture-page .children > .tree-node::before {
  content: '';
  position: absolute;
  top: 0;
  left: -1px;
  width: 15px;
  height: 14px;
  border: solid var(--line);
  border-width: 0 0 1px 1px;
}

.app-architecture-page .item-name-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
  flex-wrap: wrap;
  width: 100%;
}

.app-architecture-page .app-card {
  background: #2a2a2f;
  border-radius: 16px;
  overflow: hidden;
  box-shadow:
    0 12px 32px -2px rgba(0,0,0,0.50),
    inset 1px 1px 0 rgba(255,255,255,0.09),
    inset -1px -1px 0 rgba(0,0,0,0.35);
  margin: 12px 0;
}

.app-architecture-page .app-card-header {
  position: relative;
  background: linear-gradient(180deg, #5a7292 0%, #4a5f7f 100%);
  border-top: 1px solid rgba(255,255,255,0.20);
  border-radius: 16px 16px 0 0;
  padding: 9px 16px;
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
  box-shadow: 0 6px 16px rgba(0,0,0,0.35);
  overflow: hidden;
}

.app-architecture-page .app-card-header::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.00) 30%);
  pointer-events: none;
}

.app-architecture-page .app-card-header .item-name {
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  position: relative;
  z-index: 1;
}

.app-architecture-page .app-card-header .line-count-badge {
  position: relative;
  z-index: 1;
  background: #1c1c1f;
  border-color: rgba(255,255,255,0.16);
  color: #eef4ff;
}

.app-architecture-page .app-card-body {
  padding: 14px;
}

.app-architecture-page .app-card-desc {
  color: #a1a1aa;
  font-size: 12px;
  line-height: 1.5;
  margin-bottom: 12px;
}

.app-architecture-page .app-card-inner {
  background: #2e2e33;
  border-radius: 12px;
  box-shadow:
    inset 1px 1px 0 rgba(255,255,255,0.07),
    inset -1px -1px 0 rgba(0,0,0,0.30),
    0 4px 12px rgba(0,0,0,0.25);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.app-architecture-page .architecture-connections {
  margin-top: 12px;
  padding: 12px 14px;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px;
  background: #1b1c20;
}

.app-architecture-page .architecture-connections-title {
  margin-bottom: 8px;
  color: #eef4ff;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.app-architecture-page .app-card-row {
  background: #3c3e47;
  border-radius: 10px;
  padding: 10px 14px;
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
  box-shadow:
    0 8px 24px rgba(0,0,0,0.45),
    inset 0 1px 0 rgba(255,255,255,0.09),
    inset 0 -1px 0 rgba(0,0,0,0.20);
}

.app-architecture-page .app-card-row .sub-name,
.app-architecture-page .detail-summary-inline .sub-name {
  font-weight: 600;
  color: #eaedf1;
  font-size: 13px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.app-architecture-page .app-card-row .sub-desc,
.app-architecture-page .detail-summary-inline .sub-desc {
  color: #a1a1aa;
  font-size: 12px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.app-architecture-page .detail-block {
  display: grid;
  gap: 8px;
}

.app-architecture-page .detail-block > summary {
  list-style: none;
  display: block;
  padding: 10px 14px;
  background: #3c3e47;
  border-radius: 10px;
  cursor: pointer;
  position: relative;
  padding-right: 40px;
  box-shadow:
    0 8px 24px rgba(0,0,0,0.45),
    inset 0 1px 0 rgba(255,255,255,0.09),
    inset 0 -1px 0 rgba(0,0,0,0.20);
}

.app-architecture-page .detail-block > summary::-webkit-details-marker,
.app-architecture-page .schema-block > summary::-webkit-details-marker {
  display: none;
}

.app-architecture-page .detail-block > summary::after,
.app-architecture-page .schema-block > summary::after {
  content: '';
  display: inline-block;
  width: 20px;
  height: 20px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.72)' stroke-width='2.6' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: center;
  background-size: 18px 18px;
  transition: transform 0.15s ease;
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
}

.app-architecture-page .detail-block[open] > summary::after {
  transform: translateY(-50%) rotate(180deg);
}

.app-architecture-page .schema-block[open] > summary::after {
  transform: rotate(180deg);
}

.app-architecture-page .detail-summary-inline {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
  min-width: 0;
}

.app-architecture-page .detail-summary-inline.has-security-icon {
  align-items: flex-start;
}

.app-architecture-page .detail-summary-text {
  min-width: 0;
  flex: 1;
}

.app-architecture-page .security-shield-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  object-fit: contain;
  align-self: flex-start;
  margin-top: 2px;
}

.app-architecture-page .detail-panel {
  padding: 12px 14px;
  background: #1c1c1f;
  border: 1px solid rgba(0,0,0,0.35);
  border-radius: 10px;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.03);
}

.app-architecture-page .detail-stack {
  display: grid;
  gap: 4px;
}

.app-architecture-page .detail-line {
  color: #a1a1aa;
  font-size: 12px;
  line-height: 1.55;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.app-architecture-page .detail-line strong {
  color: #eaedf1;
  font-weight: 600;
}

.app-architecture-page .jump-link {
  color: #d4d7de;
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 2px;
  text-decoration-color: rgba(212, 215, 222, 0.38);
  transition: color 0.15s ease, text-decoration-color 0.15s ease;
}

.app-architecture-page .jump-link:hover {
  color: #f3f4f6;
  text-decoration-color: rgba(243, 244, 246, 0.75);
}

.app-architecture-page .detail-link {
  border: none;
  background: transparent;
  padding: 0;
  margin: 0;
  font-size: inherit;
  font-weight: inherit;
  font-family: inherit;
  cursor: pointer;
}

.app-architecture-page .inline-error-text {
  color: var(--danger-red);
  font-size: 12px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  line-height: 1.5;
  margin-bottom: 8px;
}

.app-architecture-page .inline-size-warning {
  color: rgba(70,130,255,0.95);
  font-size: 12px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  line-height: 1.5;
  margin-bottom: 8px;
}

.app-architecture-page .tag-header {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  padding: 3px 9px;
  border-radius: 8px;
  font-family: -apple-system, sans-serif;
  background: rgba(0,0,0,0.25);
  border: 1px solid rgba(255,255,255,0.12);
  position: relative;
  z-index: 1;
}

.app-architecture-page .tag-inset {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  padding: 3px 9px;
  border-radius: 8px;
  font-family: -apple-system, sans-serif;
  background: #1c1c1f;
  border-top: 1px solid rgba(0,0,0,0.35);
}

.app-architecture-page .tag-header .tag-icon,
.app-architecture-page .tag-inset .tag-icon {
  display: none;
}

.app-architecture-page .tag-header.service { color: #5eead4; }
.app-architecture-page .tag-header.data-block { color: #5eead4; }
.app-architecture-page .tag-header.code-logic { color: #cbd5e1; }
.app-architecture-page .tag-header.feature { color: #93c5fd; }
.app-architecture-page .tag-header.component { color: #d8b4fe; }
.app-architecture-page .tag-header.context-injection { color: #fdba74; }
.app-architecture-page .tag-header.hook { color: #a5b4fc; }
.app-architecture-page .tag-header.context { color: #fcd34d; }
.app-architecture-page .tag-header.edge-fn { color: #f8fafc; }
.app-architecture-page .tag-header.db-table { color: #6ee7b7; }
.app-architecture-page .tag-header.integration { color: #7dd3fc; }
.app-architecture-page .tag-header.api-call { color: var(--danger-red); }
.app-architecture-page .tag-header.documentation { color: #fde68a; }
.app-architecture-page .tag-header.tooling { color: #d8ccff; }
.app-architecture-page .tag-header.script { color: #93dcff; }
.app-architecture-page .tag-header.test { color: #fbcfe8; }
.app-architecture-page .tag-header.db-migration { color: #86efac; }

.app-architecture-page .tag-inset.service { color: #2dd4bf; }
.app-architecture-page .tag-inset.code-logic { color: #94a3b8; }
.app-architecture-page .tag-inset.feature { color: #60a5fa; }
.app-architecture-page .tag-inset.component { color: #c084fc; }
.app-architecture-page .tag-inset.context-injection { color: #fb923c; }
.app-architecture-page .tag-inset.data-block { color: #2dd4bf; }
.app-architecture-page .tag-inset.hook { color: #818cf8; }
.app-architecture-page .tag-inset.context { color: #fbbf24; }
.app-architecture-page .tag-inset.edge-fn { color: #f8fafc; }
.app-architecture-page .tag-inset.db-table { color: #34d399; }
.app-architecture-page .tag-inset.integration { color: #38bdf8; }
.app-architecture-page .tag-inset.api-call { color: var(--danger-red); }
.app-architecture-page .tag-inset.documentation { color: #fde68a; }
.app-architecture-page .tag-inset.tooling { color: #c4b5fd; }
.app-architecture-page .tag-inset.script { color: #7dd3fc; }
.app-architecture-page .tag-inset.test { color: #f9a8d4; }
.app-architecture-page .tag-inset.db-migration { color: #6ee7b7; }

.app-architecture-page .schema-block {
  background: #3c3e47;
  border-radius: 12px;
  box-shadow:
    0 8px 24px rgba(0,0,0,0.45),
    inset 0 1px 0 rgba(255,255,255,0.09),
    inset 0 -1px 0 rgba(0,0,0,0.20);
  overflow: hidden;
}

.app-architecture-page .schema-block > summary {
  list-style: none;
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
  padding: 12px 14px;
  cursor: pointer;
  position: relative;
  padding-right: 42px;
}

.app-architecture-page .schema-panel {
  padding: 0 14px 14px;
  display: grid;
  gap: 10px;
}

.app-architecture-page .schema-block-list {
  display: grid;
  gap: 12px;
}

.app-architecture-page .schema-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.app-architecture-page .schema-stat {
  padding: 10px 12px;
  border-radius: 10px;
  background: #1c1c1f;
  border: 1px solid rgba(0,0,0,0.35);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.03);
  display: block;
}

.app-architecture-page .schema-stat-label {
  display: block;
  color: #8f97a7;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  margin-bottom: 4px;
}

.app-architecture-page .schema-stat-value {
  color: #eef2f9;
  font-size: 13px;
  font-weight: 700;
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
}

.app-architecture-page .schema-columns {
  display: grid;
  gap: 8px;
}

.app-architecture-page .schema-columns-title {
  color: #cfd5e2;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.app-architecture-page .schema-column-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.app-architecture-page .schema-column {
  padding: 10px 12px;
  border-radius: 10px;
  background: #1c1c1f;
  border: 1px solid rgba(0,0,0,0.35);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.03);
}

.app-architecture-page .schema-column-name {
  color: #f3f5fa;
  font-size: 13px;
  font-weight: 700;
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
}

.app-architecture-page .schema-column-type {
  color: #7dd3fc;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  margin-top: 2px;
}

.app-architecture-page .schema-column-meta {
  color: #9fa8b8;
  font-size: 11px;
  line-height: 1.45;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  margin-top: 6px;
}

@media (max-width: 1420px) {
  .app-architecture-page {
    --nav-rail-width: 268px;
    --header-pad-x: 20px;
    --content-pad: 20px;
  }

  .app-architecture-page .header {
    gap: 14px;
  }

  .app-architecture-page .nav-rail-body {
    padding: 14px 12px 18px;
  }

  .app-architecture-page .nav-section-stack {
    gap: 12px;
  }

  .app-architecture-page .nav-section {
    gap: 8px;
  }
}

@media (max-width: 1280px) {
  .app-architecture-page {
    --nav-rail-width: 232px;
    --header-pad-x: 16px;
    --content-pad: 16px;
  }

  .app-architecture-page .header {
    gap: 12px;
  }

  .app-architecture-page .page-title {
    font-size: 16px;
  }

  .app-architecture-page .nav-root-link,
  .app-architecture-page .nav-section-link,
  .app-architecture-page .nav-section-title {
    min-height: 40px;
    border-radius: 12px;
    font-size: 12px;
  }

  .app-architecture-page .nav-root-link {
    padding: 0 14px;
  }

  .app-architecture-page .nav-section-link,
  .app-architecture-page .nav-section-title {
    padding: 0 12px;
  }

  .app-architecture-page .nav-tree-group {
    gap: 6px;
    padding-left: 16px;
  }

  .app-architecture-page .nav-branch-link,
  .app-architecture-page .nav-tree-item {
    min-height: 34px;
    font-size: 12px;
  }

  .app-architecture-page .nav-link-body {
    min-height: 34px;
    padding: 0 10px;
  }

  .app-architecture-page .folder-row {
    padding: 8px 12px;
    gap: 7px;
  }

  .app-architecture-page .folder-desc {
    font-size: 12px;
  }
}

@media (max-width: 1120px) {
  .app-architecture-page {
    --nav-rail-width: 212px;
    --header-pad-x: 14px;
    --content-pad: 14px;
  }

  .app-architecture-page .header {
    gap: 10px;
  }

  .app-architecture-page .folder-row {
    padding: 8px 10px;
  }

  .app-architecture-page .folder-count {
    padding: 0 8px;
    font-size: 10px;
  }

  .app-architecture-page .app-card-header {
    padding: 12px 14px;
  }

  .app-architecture-page .app-card-body {
    padding: 14px 14px 16px;
  }

  .app-architecture-page .detail-block > summary,
  .app-architecture-page .schema-block > summary,
  .app-architecture-page .app-card-row {
    padding: 12px 12px;
  }
}

@media (max-width: 980px) {
  .app-architecture-page .page-shell {
    display: block;
  }

  .app-architecture-page .nav-rail-shell {
    display: none;
  }

  .app-architecture-page .content {
    height: auto;
    min-height: calc(100vh - 76px);
    padding: 16px;
  }

  .app-architecture-page .legend-main-grid,
  .app-architecture-page .legend-definition-grid,
  .app-architecture-page .legend-signal-grid,
  .app-architecture-page .schema-grid,
  .app-architecture-page .schema-column-list {
    grid-template-columns: 1fr;
  }

  .app-architecture-page .legend {
    margin: 0 16px 16px;
  }

  .app-architecture-page .legend-shell-header {
    padding: 12px 16px 10px;
  }

  .app-architecture-page .legend-shell-title {
    font-size: 21px;
  }

  .app-architecture-page .legend-shell-body {
    padding: 16px;
  }

  .app-architecture-page .legend-toggle-btn {
    margin-left: 0;
  }
}
`;

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function prefixValues(prefix: string, values: string[]): string[] {
  return (values ?? []).map((value) => `${prefix}: ${value}`);
}

function downloadMarkdownFile(filename: string, source: string) {
  const blob = new Blob([source], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function pushDetail(lines: DetailLine[], label: string, values: string[], kind: DetailLineKind) {
  const clean = uniqueStrings(values);
  if (clean.length > 0) {
    lines.push({ label, values: clean, kind });
  }
}

function requireManualArchitectureFile(path: string): ManualArchitectureFile {
  const file = manualArchitectureFileByPath.get(path);
  if (!file) {
    throw new Error(`Missing manual App Architecture record for ${path}.`);
  }
  return file;
}

function buildManualFileRows(path: string): FileRow[] {
  return requireManualArchitectureFile(path).rows.map((row) => ({
    ...row,
    details: row.details.map((detail) => ({ ...detail })),
  }));
}

function buildMeasuredConnectionLines(analysis: FileAnalysis): DetailLine[] {
  const lines: DetailLine[] = [];
  pushDetail(lines, "Imports", analysis.imports, "files");
  pushDetail(lines, "Imported By", analysis.importedBy, "files");
  pushDetail(lines, "Reads Tables", analysis.tableReads, "tables");
  pushDetail(lines, "Writes Tables", analysis.tableWrites, "tables");
  pushDetail(lines, "Uses Tables", analysis.tables.filter(
    (table) => !analysis.tableReads.includes(table) && !analysis.tableWrites.includes(table),
  ), "tables");
  pushDetail(lines, "Uses RPCs", analysis.rpcs, "rpcs");
  pushDetail(lines, "Calls Edge Functions", analysis.edgeFunctions, "edges");
  pushDetail(lines, "Reads Storage", analysis.storageReads, "buckets");
  pushDetail(lines, "Writes Storage", analysis.storageWrites, "buckets");
  pushDetail(lines, "Uses Storage", analysis.storageBuckets.filter(
    (bucket) => !analysis.storageReads.includes(bucket) && !analysis.storageWrites.includes(bucket),
  ), "buckets");
  pushDetail(lines, "Reads Browser Storage", uniqueStrings([
    ...prefixValues("localStorage", analysis.localStorageReads),
    ...prefixValues("sessionStorage", analysis.sessionStorageReads),
  ]), "plain");
  pushDetail(lines, "Writes Browser Storage", uniqueStrings([
    ...prefixValues("localStorage", analysis.localStorageWrites),
    ...prefixValues("sessionStorage", analysis.sessionStorageWrites),
  ]), "plain");
  return lines;
}

function resolveHeaderBadge(node: ArchitectureNode): HeaderBadge {
  return requireManualArchitectureFile(node.path).header;
}

function rowFilterValue(row: FileRow): FilterValue {
  switch (row.badgeClass) {
    case "component":
      return "component";
    case "feature":
      return "feature";
    case "code-logic":
      return "code-logic";
    case "data-block":
      return "data-block";
    case "context-injection":
      return "context-injection";
    case "edge-fn":
      return "edge-fn";
    case "db-table":
      return "db-table";
    case "integration":
      return "integration";
    case "api-call":
      return "api-call";
    case "hook":
      return "hook";
    case "context":
      return "context";
    case "documentation":
      return "documentation";
    case "tooling":
      return "tooling";
    case "script":
      return "script";
    case "test":
      return "test";
    case "db-migration":
      return "db-migration";
    default:
      return "all";
  }
}

function folderCountLabel(registry: ArchitectureRegistry, node: ArchitectureNode): string {
  if (node.type === "root") {
    const { folders, files } = countDescendants(registry, node.id);
    return `${folders} folders + ${files} files shown`;
  }

  const childNodes = node.childIds
    .map((id) => registry.nodes[id])
    .filter(Boolean);

  if (node.depth === 1) {
    const directFolders = childNodes.filter((child) => child.type === "folder").length;
    const directFiles = childNodes.filter((child) => child.type === "file").length;
    if (directFolders > 0 && directFiles === 0) return `${directFolders} folders shown`;
    if (directFiles > 0 && directFolders === 0) return `${directFiles} files shown`;
    return `${directFolders} folders + ${directFiles} files shown`;
  }

  const { folders, files } = countDescendants(registry, node.id);
  return `${folders + files} items`;
}

function sortChildNodes(nodes: ArchitectureNode[], parent: ArchitectureNode) {
  if (parent.type === "root") {
    const order = new Map(ROOT_CHILD_ORDER.map((name, index) => [name, index]));
    return [...nodes].sort((a, b) => {
      const aOrder = order.get(a.name);
      const bOrder = order.get(b.name);
      if (aOrder !== undefined || bOrder !== undefined) {
        return (aOrder ?? Number.MAX_SAFE_INTEGER) - (bOrder ?? Number.MAX_SAFE_INTEGER);
      }
      return a.name.localeCompare(b.name);
    });
  }

  return [...nodes].sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === "folder" ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
}

function resolveFileDescription(node: ArchitectureNode) {
  return requireManualArchitectureFile(node.path).description;
}

function getEmptyFileAnalysis(): FileAnalysis {
  return {
    imports: [],
    importedBy: [],
    tables: [],
    tableReads: [],
    tableWrites: [],
    rpcs: [],
    edgeFunctions: [],
    storageBuckets: [],
    storageReads: [],
    storageWrites: [],
    localStorageReads: [],
    localStorageWrites: [],
    sessionStorageReads: [],
    sessionStorageWrites: [],
  };
}

function flattenNavEntries(entries: NavSnapshotEntry[], depth = 0): string[] {
  return entries.flatMap((entry) => {
    const prefix = `${"  ".repeat(depth)}-`;
    if (entry.kind === "file") return [`${prefix} ${entry.path}`];
    return [`${prefix} ${entry.path}`, ...flattenNavEntries(entry.children, depth + 1)];
  });
}

function architectureNodeToNavEntry(
  registry: ArchitectureRegistry,
  node: ArchitectureNode,
): NavSnapshotEntry {
  if (node.type === "file") {
    return { kind: "file", path: node.path };
  }

  const children = sortChildNodes(
    node.childIds.map((id) => registry.nodes[id]).filter(Boolean) as ArchitectureNode[],
    node,
  ).map((child) => architectureNodeToNavEntry(registry, child));

  return { kind: "folder", path: node.path, children };
}

function buildManualNavigationSections(registry: ArchitectureRegistry): NavSnapshotSection[] {
  const root = registry.nodes[registry.rootId];
  if (!root) return [];

  const children = sortChildNodes(
    root.childIds.map((id) => registry.nodes[id]).filter(Boolean) as ArchitectureNode[],
    root,
  );
  const rootFiles = children.filter((child) => child.type === "file");
  const folders = children.filter((child) => child.type === "folder");
  const sections: NavSnapshotSection[] = [];

  if (rootFiles.length > 0) {
    sections.push({
      title: "Root Files",
      children: rootFiles.map((file) => architectureNodeToNavEntry(registry, file)),
    });
  }

  folders.forEach((folder) => {
    const entry = architectureNodeToNavEntry(registry, folder);
    sections.push({
      title: folder.name,
      path: folder.path,
      children: entry.kind === "folder" ? entry.children : [],
    });
  });

  return sections;
}

function renderDetailValues(
  line: DetailLine,
  onJumpToFile: (path: string) => void,
  onJumpToSchema: (kind: "table" | "rpc" | "edge" | "bucket", name: string) => void,
) {
  return line.values.map((value, index) => {
    const suffix = index < line.values.length - 1 ? ", " : "";
    if (line.kind === "files") {
      return (
        <React.Fragment key={value}>
          <button type="button" className="jump-link detail-link" onClick={() => onJumpToFile(value)}>
            {value}
          </button>
          {suffix}
        </React.Fragment>
      );
    }
    if (line.kind === "tables") {
      return (
        <React.Fragment key={value}>
          <button type="button" className="jump-link detail-link table-link" onClick={() => onJumpToSchema("table", value)}>
            {value}
          </button>
          {suffix}
        </React.Fragment>
      );
    }
    if (line.kind === "rpcs") {
      return (
        <React.Fragment key={value}>
          <button type="button" className="jump-link detail-link rpc-link" onClick={() => onJumpToSchema("rpc", value)}>
            {value}
          </button>
          {suffix}
        </React.Fragment>
      );
    }
    if (line.kind === "edges") {
      return (
        <React.Fragment key={value}>
          <button type="button" className="jump-link detail-link edge-link" onClick={() => onJumpToSchema("edge", value)}>
            {value}
          </button>
          {suffix}
        </React.Fragment>
      );
    }
    if (line.kind === "buckets") {
      return (
        <React.Fragment key={value}>
          <button type="button" className="jump-link detail-link bucket-link" onClick={() => onJumpToSchema("bucket", value)}>
            {value}
          </button>
          {suffix}
        </React.Fragment>
      );
    }
    return (
      <React.Fragment key={value}>
        <span className="detail-pill">{value}</span>
        {suffix}
      </React.Fragment>
    );
  });
}

function rowMatchesFilter(row: FileRow, currentFilter: FilterValue) {
  if (currentFilter === "all") return true;
  if (currentFilter === "security") return !!row.security;
  return rowFilterValue(row) === currentFilter;
}

function fileMatchesFilter(
  node: ArchitectureNode,
  rows: FileRow[],
  currentFilter: FilterValue,
) {
  if (currentFilter === "all") return true;
  if (currentFilter === "security") return rows.some((row) => row.security);
  const headerBadge = resolveHeaderBadge(node);
  return headerBadge.filterValue === currentFilter || rows.some((row) => rowMatchesFilter(row, currentFilter));
}

function buildArchitectureDownloadFile(
  node: ArchitectureNode,
  _knownTables: Set<string>,
  _knownRpcs: Set<string>,
  _knownEdgeFunctions: Set<string>,
  _knownBuckets: Set<string>,
): AppArchitectureExportFile {
  const analysis = architectureFileAnalysis[node.path] ?? getEmptyFileAnalysis();
  const profile = requireManualArchitectureFile(node.path);
  const headerBadge = profile.header;
  const rows = buildManualFileRows(node.path);

  return {
    path: node.path,
    name: node.name,
    type: headerBadge.label,
    description: profile.description,
    metric: profile.metric,
    metricDescription: profile.metricDescription,
    imports: analysis.imports,
    importedBy: analysis.importedBy,
    tables: analysis.tables,
    tableReads: analysis.tableReads,
    tableWrites: analysis.tableWrites,
    rpcs: analysis.rpcs,
    edgeFunctions: analysis.edgeFunctions,
    storageBuckets: analysis.storageBuckets,
    storageReads: analysis.storageReads,
    storageWrites: analysis.storageWrites,
    browserStorageReads: uniqueStrings([
      ...prefixValues("localStorage", analysis.localStorageReads),
      ...prefixValues("sessionStorage", analysis.sessionStorageReads),
    ]),
    browserStorageWrites: uniqueStrings([
      ...prefixValues("localStorage", analysis.localStorageWrites),
      ...prefixValues("sessionStorage", analysis.sessionStorageWrites),
    ]),
    rows: rows.map((row) => ({
      title: row.title,
      type: row.badgeLabel,
      summary: row.summary,
      note: row.note,
      signal: row.signal,
      security: row.security,
      details: row.details.map((detail) => ({
        label: detail.label,
        values: detail.values,
      })),
    })),
  };
}

function buildAppArchitectureDownloadMarkdown(
  registry: ArchitectureRegistry,
  schemaTables: Array<[string, SchemaTable]>,
  schemaFunctions: SchemaFunction[],
  storageBuckets: SchemaBucket[],
  edgeFunctions: SchemaEdgeFunction[],
  tableUsageMap: Map<string, string[]>,
  rpcUsageMap: Map<string, string[]>,
  bucketUsageMap: Map<string, string[]>,
  edgeUsageMap: Map<string, string[]>,
  knownTables: Set<string>,
  knownRpcs: Set<string>,
  knownEdgeFunctions: Set<string>,
  knownBuckets: Set<string>,
) {
  const files = Object.values(registry.nodes)
    .filter((node): node is ArchitectureNode & { type: "file" } => node.type === "file")
    .sort((a, b) => a.path.localeCompare(b.path))
    .map((node) => buildArchitectureDownloadFile(node, knownTables, knownRpcs, knownEdgeFunctions, knownBuckets));

  const navSections: AppArchitectureExportNavSection[] = buildManualNavigationSections(registry).map((section) => ({
    title: section.title,
    path: section.path,
    entries: flattenNavEntries(section.children),
  }));

  return buildAppArchitectureMarkdown({
    generatedAt: new Date().toISOString(),
    repoName: "Chronicle-main",
    rootPath: "/Users/thomashall/Documents/New project/Chronicle-main",
    sourcePathCount: MANUAL_ARCHITECTURE_PATHS.length,
    staticPaths: [],
    navSections,
    files,
    schema: {
      exportedAt: databaseSchemaInventory.exported_at,
      tables: schemaTables.map(([name, table]) => ({
        name,
        columns: table.columns.map((column) => ({
          name: column.name,
          type: column.type,
          nullable: column.nullable,
          default: column.default,
          primaryKey: "primary_key" in column ? column.primary_key : undefined,
        })),
        indexes: [...table.indexes],
        policies: table.rls_policies.map((policy) => ({
          name: policy.name,
          command: policy.command,
        })),
        usedBy: tableUsageMap.get(name) ?? [],
      })),
      databaseFunctions: schemaFunctions.map((item) => ({
        name: item.name,
        returns: "returns" in item && item.returns !== undefined ? String(item.returns) : undefined,
        language: "language" in item && item.language !== undefined ? String(item.language) : undefined,
        usedBy: rpcUsageMap.get(item.name) ?? [],
      })),
      storageBuckets: storageBuckets.map((item) => ({
        name: item.name,
        public: item.public,
        usedBy: bucketUsageMap.get(item.name) ?? [],
      })),
      edgeFunctions: edgeFunctions.map((item) => ({
        name: item.name,
        tablesReferenced: [...item.tables_referenced],
        usedBy: edgeUsageMap.get(item.name) ?? [],
        paidAiPath: PAID_AI_EDGE_FUNCTIONS.has(item.name),
      })),
    },
  });
}

function folderMatchesFilter(
  registry: ArchitectureRegistry,
  node: ArchitectureNode,
  currentFilter: FilterValue,
  fileMatchMap: Map<string, boolean>,
): boolean {
  if (currentFilter === "all") return true;
  const queue = [...node.childIds];
  while (queue.length > 0) {
    const currentId = queue.shift();
    if (!currentId) continue;
    const currentNode = registry.nodes[currentId];
    if (!currentNode) continue;
    if (currentNode.type === "file" && fileMatchMap.get(currentNode.id)) return true;
    queue.push(...currentNode.childIds);
  }
  return false;
}

function ArchitectureFileCard({
  node,
  analysis,
  highlighted,
  currentFilter,
  onJumpToFile,
  onJumpToSchema,
  closedDetailIds,
  onDetailToggle,
}: {
  node: ArchitectureNode;
  analysis: FileAnalysis;
  highlighted: boolean;
  currentFilter: FilterValue;
  onJumpToFile: (path: string) => void;
  onJumpToSchema: (kind: "table" | "rpc" | "edge" | "bucket", name: string) => void;
  closedDetailIds: Set<string>;
  onDetailToggle: (detailId: string, open: boolean) => void;
}) {
  const profile = requireManualArchitectureFile(node.path);
  const headerBadge = profile.header;
  const rows = buildManualFileRows(node.path);
  const connectionLines = buildMeasuredConnectionLines(analysis);
  const matchesFilter = fileMatchesFilter(node, rows, currentFilter);
  const cardClasses = ["app-card"];
  if (!matchesFilter) cardClasses.push("filter-dim");
  if (highlighted) cardClasses.push("highlighted-card");

  return (
    <article
      id={node.id}
      data-nav-anchor="true"
      data-node-id={node.id}
      className={cardClasses.join(" ")}
    >
      <div className="app-card-header">
        <span className={`tag-header ${headerBadge.className}`}>{headerBadge.label}</span>
        <span className="item-name">{node.name}</span>
        <span className="line-count-badge" title={profile.metricDescription}>
          {profile.metric}
        </span>
      </div>

      <div className="app-card-body">
        <div className="app-card-desc">{profile.description}</div>

        {rows.length > 0 && <div className="app-card-inner">
          {rows.map((row) => {
            const rowDimmed = currentFilter !== "all" && !rowMatchesFilter(row, currentFilter);
            const rowHasRefactor = row.signal === "refactor";
            const rowHasIssue = row.signal === "issue";
            const rowClassName = ["detail-block"];
            if (rowDimmed) rowClassName.push("filter-dim");
            if (rowHasRefactor) rowClassName.push("has-refactor");
            if (rowHasIssue) rowClassName.push("has-error");
            const defaultOpen = !closedDetailIds.has(row.id);

            if (row.details.length === 0 && !row.note) {
              const flatRowClassName = ["app-card-row"];
              if (rowDimmed) flatRowClassName.push("filter-dim");
              if (rowHasRefactor) flatRowClassName.push("has-refactor");
              if (rowHasIssue) flatRowClassName.push("has-error");
              return (
                <div key={row.id} className={flatRowClassName.join(" ")}>
                  {row.security && (
                    <img
                      className="security-shield-icon"
                      src={securityShieldIcon}
                      alt=""
                      aria-hidden="true"
                    />
                  )}
                  <span className={`tag-inset ${row.badgeClass}`}>{row.badgeLabel}</span>
                  <div className="detail-summary-text">
                    <span className="sub-name">{row.title}:</span>{" "}
                    <span className="sub-desc">{row.summary}</span>
                  </div>
                </div>
              );
            }

            return (
              <details
                key={row.id}
                className={rowClassName.join(" ")}
                open={defaultOpen}
                onToggle={(event) => onDetailToggle(row.id, event.currentTarget.open)}
              >
                <summary>
                  <div className={`detail-summary-inline ${row.security ? "has-security-icon" : ""}`.trim()}>
                    {row.security && (
                      <img
                        className="security-shield-icon"
                        src={securityShieldIcon}
                        alt=""
                        aria-hidden="true"
                      />
                    )}
                    <span className={`tag-inset ${row.badgeClass}`}>{row.badgeLabel}</span>
                    <div className="detail-summary-text">
                      <span className="sub-name">{row.title}:</span>{" "}
                      <span className="sub-desc">{row.summary}</span>
                    </div>
                  </div>
                </summary>
                <div className="detail-panel">
                  {row.note && (
                    <div className={row.signal === "issue" ? "inline-error-text" : "inline-size-warning"}>
                      {row.note}
                    </div>
                  )}
                  <div className="detail-stack">
                    {row.details.map((line, index) => (
                      <div key={`${row.id}-${line.label}-${index}`} className="detail-line">
                        <strong title={DETAIL_HELPERS[line.label] || line.label}>{line.label}:</strong>{" "}
                        {renderDetailValues(line, onJumpToFile, onJumpToSchema)}
                      </div>
                    ))}
                  </div>
                </div>
              </details>
            );
          })}
        </div>}

        {connectionLines.length > 0 && (
          <div className="architecture-connections" aria-label="Measured repository connections">
            <div className="architecture-connections-title">Repository Connections</div>
            <div className="detail-stack">
              {connectionLines.map((line, index) => (
                <div key={`${node.id}-connection-${line.label}-${index}`} className="detail-line">
                  <strong title={DETAIL_HELPERS[line.label] || line.label}>{line.label}:</strong>{" "}
                  {renderDetailValues(line, onJumpToFile, onJumpToSchema)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

function TreeFolder({
  registry,
  node,
  openFolderIds,
  onToggle,
  highlightedId,
  fileAnalysis,
  currentFilter,
  fileMatchMap,
  onJumpToFile,
  onJumpToSchema,
  closedDetailIds,
  onDetailToggle,
}: {
  registry: ArchitectureRegistry;
  node: ArchitectureNode;
  openFolderIds: Set<string>;
  onToggle: (nodeId: string) => void;
  highlightedId: string | null;
  fileAnalysis: Record<string, FileAnalysis>;
  currentFilter: FilterValue;
  fileMatchMap: Map<string, boolean>;
  onJumpToFile: (path: string) => void;
  onJumpToSchema: (kind: "table" | "rpc" | "edge" | "bucket", name: string) => void;
  closedDetailIds: Set<string>;
  onDetailToggle: (detailId: string, open: boolean) => void;
}) {
  const isOpen = openFolderIds.has(node.id);
  const matchesFilter = folderMatchesFilter(registry, node, currentFilter, fileMatchMap);
  const childNodes = sortChildNodes(
    node.childIds.map((nodeId) => registry.nodes[nodeId]).filter(Boolean) as ArchitectureNode[],
    node,
  );

  return (
    <div className={`tree-node ${isOpen ? "open" : ""} ${node.type === "root" ? "root-node" : ""}`.trim()}>
      <button
        type="button"
        className={`folder-row ${node.type === "root" ? "is-root" : ""} ${currentFilter !== "all" && !matchesFilter ? "filter-dim" : ""}`.trim()}
        data-nav-anchor="true"
        data-node-id={node.id}
        onClick={() => onToggle(node.id)}
      >
        <div className="chevron" aria-hidden="true" />
        <img className={`folder-icon-image ${node.type === "root" ? "is-root-folder" : ""}`.trim()} src={FOLDER_ICON_DATA_URI} alt="" aria-hidden="true" />
        <span className="folder-label">{node.name}</span>
        <span className="folder-desc">— {node.description}</span>
        <span className="folder-count">{folderCountLabel(registry, node)}</span>
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
                highlightedId={highlightedId}
                fileAnalysis={fileAnalysis}
                currentFilter={currentFilter}
                fileMatchMap={fileMatchMap}
                onJumpToFile={onJumpToFile}
                onJumpToSchema={onJumpToSchema}
                closedDetailIds={closedDetailIds}
                onDetailToggle={onDetailToggle}
              />
            );
          }

          return (
            <div key={child.id} className="item-row">
              <ArchitectureFileCard
                node={child}
                analysis={fileAnalysis[child.path] ?? {
                  imports: [],
                  importedBy: [],
                  tables: [],
                  tableReads: [],
                  tableWrites: [],
                  rpcs: [],
                  edgeFunctions: [],
                  storageBuckets: [],
                  storageReads: [],
                  storageWrites: [],
                  localStorageReads: [],
                  localStorageWrites: [],
                  sessionStorageReads: [],
                  sessionStorageWrites: [],
                }}
                highlighted={highlightedId === child.id}
                currentFilter={currentFilter}
                onJumpToFile={onJumpToFile}
                onJumpToSchema={onJumpToSchema}
                closedDetailIds={closedDetailIds}
                onDetailToggle={onDetailToggle}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NavSnapshotGroup({
  entries,
  nodeByPath,
  activeNavId,
  onJump,
  nested = false,
}: {
  entries: NavSnapshotEntry[];
  nodeByPath: Map<string, ArchitectureNode>;
  activeNavId: string | null;
  onJump: (nodeId: string) => void;
  nested?: boolean;
}) {
  return (
    <div className={nested ? "nav-tree-group nav-tree-group--nested" : "nav-tree-group"}>
      {entries.map((entry) => {
        const node = nodeByPath.get(entry.path);
        if (!node) return null;

        if (entry.kind === "folder") {
          return (
            <div key={node.id} className="nav-branch">
              <button
                type="button"
                className={`nav-branch-link nav-jump-link ${activeNavId === node.id ? "active" : ""}`.trim()}
                data-nav-id={node.id}
                title={`${node.name}\nFolder`}
                onClick={() => onJump(node.id)}
              >
                <span className="nav-link-body">
                  <span className="nav-link-label">{node.name}</span>
                </span>
              </button>
              {entry.children.length > 0 && (
                <NavSnapshotGroup entries={entry.children} nodeByPath={nodeByPath} activeNavId={activeNavId} onJump={onJump} nested />
              )}
            </div>
          );
        }

        const badge = resolveHeaderBadge(node);
        return (
          <button
            key={node.id}
            type="button"
            className={`nav-tree-item nav-accent-${badge.navAccent} nav-jump-link ${activeNavId === node.id ? "active" : ""}`.trim()}
            data-nav-id={node.id}
            title={`${node.name}\n${badge.label}`}
            onClick={() => onJump(node.id)}
          >
            <span className="nav-link-body">
              <span className="nav-link-label">{node.name}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ArchitectureLegend({ open }: { open: boolean }) {
  return (
    <div id="legend" className={`legend ${open ? "open" : ""}`.trim()}>
      <div className="legend-shell">
        <div className="legend-shell-header">
          <div className="legend-shell-kicker">Visual System</div>
          <h3 className="legend-shell-title">App Architecture Page Legend</h3>
        </div>

        <div className="legend-shell-body">
          <div className="legend-main-grid">
            <section className="legend-card">
              <div className="legend-card-kicker">Badge Meanings</div>
              <h4 className="legend-card-title">What each label communicates</h4>

              <div className="legend-definition-grid">
                <div className="legend-definition-item"><span className="tag-dark code-logic">Code Logic</span><p className="legend-definition-copy">App logic, calculations, processing behavior, orchestration, validation, or state transitions.</p></div>
                <div className="legend-definition-item"><span className="tag-dark feature">Feature</span><p className="legend-definition-copy">A specific capability or behavior inside a file or component.</p></div>
                <div className="legend-definition-item"><span className="tag-dark component">React Component</span><p className="legend-definition-copy">A named React UI block exported from a file.</p></div>
                <div className="legend-definition-item"><span className="tag-dark service">Service</span><p className="legend-definition-copy">Backend data/API service logic that the UI depends on.</p></div>
                <div className="legend-definition-item"><span className="tag-dark hook">Hook</span><p className="legend-definition-copy">Reusable React state or behavior shared across components.</p></div>
                <div className="legend-definition-item"><span className="tag-dark context">Context Provider</span><p className="legend-definition-copy">App-wide shared state delivered through React context.</p></div>
                <div className="legend-definition-item"><span className="tag-dark context-injection">Context Injection</span><p className="legend-definition-copy">Runtime values inserted into a prompt, message, or outgoing request.</p></div>
                <div className="legend-definition-item"><span className="tag-dark data-block">Data Block</span><p className="legend-definition-copy">A chunk of structured persistence, CRUD, or grouped data shape.</p></div>
                <div className="legend-definition-item"><span className="tag-dark edge-fn">Edge Function</span><p className="legend-definition-copy">Server-side function logic that runs off the client.</p></div>
                <div className="legend-definition-item"><span className="tag-dark db-table">Database Table</span><p className="legend-definition-copy">A persisted Supabase table the app reads from or writes to.</p></div>
                <div className="legend-definition-item"><span className="tag-dark integration">Integration</span><p className="legend-definition-copy">Bridge code that connects the app to something external like Supabase.</p></div>
                <div className="legend-definition-item"><span className="tag-dark api-call">API Call</span><p className="legend-definition-copy">Participates in a paid AI request path such as Call 1, Call 2, or a single isolated call.</p></div>
                <div className="legend-definition-item"><span className="tag-dark documentation">Documentation</span><p className="legend-definition-copy">Human-readable guides that define page structure, architecture rules, and intended behavior.</p></div>
                <div className="legend-definition-item"><span className="tag-dark tooling">Tooling</span><p className="legend-definition-copy">Build, registry, or workspace configuration that changes how the app runs or is generated.</p></div>
                <div className="legend-definition-item"><span className="tag-dark script">Script</span><p className="legend-definition-copy">Utility or automation code that scans, syncs, verifies, or generates architecture-critical data.</p></div>
                <div className="legend-definition-item"><span className="tag-dark test">Test</span><p className="legend-definition-copy">Coverage that protects app behavior during refactors or deploy checks.</p></div>
                <div className="legend-definition-item"><span className="tag-dark db-migration">DB Migration</span><p className="legend-definition-copy">SQL schema change, policy update, or RPC definition applied to the backend data layer.</p></div>
                <div className="legend-definition-item">
                  <span className="legend-security-badge">
                    <img src={securityShieldIcon} alt="" aria-hidden="true" />
                    Security Control
                  </span>
                  <p className="legend-definition-copy">Marks code that actively enforces auth, ownership, RLS, or another protection boundary.</p>
                </div>
              </div>
            </section>

            <section className="legend-card">
              <div className="legend-card-kicker">Signals + Health</div>
              <h4 className="legend-card-title">How status appears on the map</h4>

              <div className="legend-signal-grid">
                <div className="legend-signal-item">
                  <div className="legend-signal-label">Blue Card</div>
                  <div className="legend-signal-preview-card is-blue-card">
                    <div className="legend-preview-mini-header" />
                    <div className="legend-preview-mini-row">
                      <span className="tag-inset feature">Refactor</span>
                      <span className="legend-preview-mini-copy">File-level refactor</span>
                    </div>
                  </div>
                  <p className="legend-signal-copy">Use when the planned change affects 2 or more rows, or the file is being split, moved, renamed, or structurally reorganized.</p>
                </div>

                <div className="legend-signal-item">
                  <div className="legend-signal-label">Blue Row</div>
                  <div className="legend-signal-preview-shell">
                    <div className="legend-preview-mini-row is-blue-row">
                      <span className="tag-inset feature">Refactor</span>
                      <span className="legend-preview-mini-copy">Local cleanup</span>
                    </div>
                  </div>
                  <p className="legend-signal-copy">Use when only one specific row or sub-flow is being cleaned up.</p>
                </div>

                <div className="legend-signal-item">
                  <div className="legend-signal-label">Red Card</div>
                  <div className="legend-signal-preview-card is-red-card">
                    <div className="legend-preview-mini-header" />
                    <div className="legend-preview-mini-row">
                      <span className="tag-inset edge-fn">Issue</span>
                      <span className="legend-preview-mini-copy">File-wide breakage</span>
                    </div>
                  </div>
                  <p className="legend-signal-copy">Use when 2 or more rows are broken, or one file-level failure affects the whole module.</p>
                </div>

                <div className="legend-signal-item">
                  <div className="legend-signal-label">Red Row</div>
                  <div className="legend-signal-preview-shell">
                    <div className="legend-preview-mini-row is-red-row">
                      <span className="tag-inset edge-fn">Issue</span>
                      <span className="legend-preview-mini-copy">Isolated breakage</span>
                    </div>
                  </div>
                  <p className="legend-signal-copy">Use when exactly one dependency, table, or sub-component is broken and the rest of the file still basically works.</p>
                </div>
              </div>

              <div className="legend-health-block">
                <div className="legend-health-title">Line Count Health</div>
                <div className="legend-health-list">
                  <div className="legend-health-row"><span className="line-count-badge">299 lines</span><span className="legend-health-copy">Healthy size. Usually safe to leave alone.</span></div>
                  <div className="legend-health-row"><span className="line-count-badge is-large">428 lines</span><span className="legend-health-copy">Large file. Keep an eye on it.</span></div>
                  <div className="legend-health-row"><span className="line-count-badge is-refactor-soon">612 lines</span><span className="legend-health-copy">Consider refactoring soon.</span></div>
                  <div className="legend-health-row"><span className="line-count-badge is-refactor-needed">1,200 lines</span><span className="legend-health-copy">Refactoring needed.</span></div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function SchemaSection({
  currentFilter,
  highlightedId,
  closedSchemaIds,
  onSchemaToggle,
  schemaTables,
  schemaFunctions,
  storageBuckets,
  edgeFunctions,
  tableUsageMap,
  rpcUsageMap,
  bucketUsageMap,
  edgeUsageMap,
  onJumpToFile,
  onJumpToSchema,
}: {
  currentFilter: FilterValue;
  highlightedId: string | null;
  closedSchemaIds: Set<string>;
  onSchemaToggle: (schemaId: string, open: boolean) => void;
  schemaTables: Array<[string, SchemaTable]>;
  schemaFunctions: SchemaFunction[];
  storageBuckets: SchemaBucket[];
  edgeFunctions: SchemaEdgeFunction[];
  tableUsageMap: Map<string, string[]>;
  rpcUsageMap: Map<string, string[]>;
  bucketUsageMap: Map<string, string[]>;
  edgeUsageMap: Map<string, string[]>;
  onJumpToFile: (path: string) => void;
  onJumpToSchema: (kind: "table" | "rpc" | "edge" | "bucket", name: string) => void;
}) {
  const tableDim = currentFilter !== "all" && currentFilter !== "db-table" && currentFilter !== "security";
  const rpcDim = currentFilter !== "all" && currentFilter !== "code-logic";
  const bucketDim = currentFilter !== "all" && currentFilter !== "data-block";
  const edgeDim = currentFilter !== "all" && currentFilter !== "edge-fn" && currentFilter !== "api-call" && currentFilter !== "security";

  return (
    <section className={`backend-section ${currentFilter !== "all" ? "filter-mode-active" : ""}`.trim()}>
      <div className="backend-title">Backend Inventory</div>

      <div className="schema-block-list">
        {schemaTables.map(([tableName, table]) => {
          const fileUsers = tableUsageMap.get(tableName) ?? [];
          const schemaId = `schema-table-${tableName}`;
          const hasSecurity = table.rls_policies.length > 0;
          return (
            <details
              key={tableName}
              id={schemaId}
              className={`schema-block ${tableDim ? "filter-dim" : ""} ${highlightedId === schemaId ? "highlighted-card" : ""}`.trim()}
              open={!closedSchemaIds.has(schemaId)}
              onToggle={(event) => onSchemaToggle(schemaId, event.currentTarget.open)}
            >
              <summary>
                <div className="schema-summary-inline">
                  <span className="tag-inset db-table">DATABASE TABLE</span>
                  {hasSecurity && (
                    <img className="security-shield-icon" src={securityShieldIcon} alt="" aria-hidden="true" />
                  )}
                  <span className="sub-name">{tableName}</span>
                  <span className="sub-desc">
                    {table.columns.length} columns • {table.indexes.length} indexes • {table.rls_policies.length} RLS policies
                  </span>
                </div>
              </summary>
              <div className="schema-panel">
                <div className="schema-grid">
                  <div className="schema-stat">
                    <span className="schema-stat-label">Columns</span>
                    <span className="schema-stat-value">{table.columns.length}</span>
                  </div>
                  <div className="schema-stat">
                    <span className="schema-stat-label">Foreign Keys</span>
                    <span className="schema-stat-value">{table.foreign_keys.length}</span>
                  </div>
                  <div className="schema-stat">
                    <span className="schema-stat-label">RLS</span>
                    <span className="schema-stat-value">{table.rls_policies.length}</span>
                  </div>
                </div>
                {fileUsers.length > 0 && (
                  <div className="detail-line">
                    <strong>Used By:</strong>{" "}
                    {fileUsers.map((filePath) => (
                      <button key={filePath} type="button" className="jump-link detail-link" onClick={() => onJumpToFile(filePath)}>
                        {filePath}
                      </button>
                    ))}
                  </div>
                )}
                <div className="schema-columns">
                  <div className="schema-columns-title">Table Columns</div>
                  <div className="schema-column-list">
                    {table.columns.map((column: SchemaTable["columns"][number]) => (
                      <div key={column.name} className="schema-column">
                        <div className="schema-column-name">{column.name}</div>
                        <div className="schema-column-type">{column.type}</div>
                        <div className="schema-column-meta">
                          Nullable: {column.nullable ? "yes" : "no"}<br />
                          Default: {column.default ?? "none"}
                          {"primary_key" in column && column.primary_key ? <><br />Primary key: yes</> : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {table.indexes.length > 0 && (
                  <div className="schema-list" style={{ marginTop: 10 }}>
                    <strong>Indexes:</strong> {table.indexes.join(" • ")}
                  </div>
                )}
                {table.rls_policies.length > 0 && (
                  <div className="schema-list" style={{ marginTop: 10 }}>
                    <strong>RLS:</strong> {table.rls_policies.map((policy: SchemaTable["rls_policies"][number]) => policy.name).join(" • ")}
                  </div>
                )}
              </div>
            </details>
          );
        })}
      </div>

      <div className="schema-block-list">
        {schemaFunctions.map((item) => {
          const schemaId = `schema-rpc-${item.name}`;
          return (
            <details
              key={item.name}
              id={schemaId}
              className={`schema-block ${rpcDim ? "filter-dim" : ""} ${highlightedId === schemaId ? "highlighted-card" : ""}`.trim()}
              open={!closedSchemaIds.has(schemaId)}
              onToggle={(event) => onSchemaToggle(schemaId, event.currentTarget.open)}
            >
              <summary>
                <div className="schema-summary-inline">
                  <span className="tag-inset code-logic">CODE LOGIC</span>
                  <span className="sub-name">{item.name}</span>
                  <span className="sub-desc">{item.security} security • touches {item.touches.join(", ") || "no tables listed"}</span>
                </div>
              </summary>
              <div className="schema-panel">
                <div className="schema-description">{item.description}</div>
                {(rpcUsageMap.get(item.name) ?? []).length > 0 && (
                  <div className="detail-line" style={{ marginTop: 10 }}>
                    <strong>Used By:</strong>{" "}
                    {(rpcUsageMap.get(item.name) ?? []).map((filePath) => (
                      <button key={filePath} type="button" className="jump-link detail-link" onClick={() => onJumpToFile(filePath)}>
                        {filePath}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </details>
          );
        })}
      </div>

      <div className="schema-block-list">
        {storageBuckets.map((item) => {
          const schemaId = `schema-bucket-${item.name}`;
          return (
            <details
              key={item.name}
              id={schemaId}
              className={`schema-block ${bucketDim ? "filter-dim" : ""} ${highlightedId === schemaId ? "highlighted-card" : ""}`.trim()}
              open={!closedSchemaIds.has(schemaId)}
              onToggle={(event) => onSchemaToggle(schemaId, event.currentTarget.open)}
            >
              <summary>
                <div className="schema-summary-inline">
                  <span className="tag-inset data-block">DATA BLOCK</span>
                  <span className="sub-name">{item.name}</span>
                  <span className="sub-desc">{item.public ? "Public bucket" : "Private bucket"}</span>
                </div>
              </summary>
              <div className="schema-panel">
                {(bucketUsageMap.get(item.name) ?? []).length > 0 ? (
                  <div className="detail-line">
                    <strong>Used By:</strong>{" "}
                    {(bucketUsageMap.get(item.name) ?? []).map((filePath) => (
                      <button key={filePath} type="button" className="jump-link detail-link" onClick={() => onJumpToFile(filePath)}>
                        {filePath}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="schema-description">No direct storage bucket reference was found in the scanned frontend/backend code files.</div>
                )}
              </div>
            </details>
          );
        })}
      </div>

      <div className="schema-block-list">
        {edgeFunctions.map((item) => {
          const schemaId = `schema-edge-${item.name}`;
          const isPaidApiPath = PAID_AI_EDGE_FUNCTIONS.has(item.name);
          return (
            <details
              key={item.name}
              id={schemaId}
              className={`schema-block ${edgeDim ? "filter-dim" : ""} ${highlightedId === schemaId ? "highlighted-card" : ""}`.trim()}
              open={!closedSchemaIds.has(schemaId)}
              onToggle={(event) => onSchemaToggle(schemaId, event.currentTarget.open)}
            >
              <summary>
                <div className="schema-summary-inline">
                  <span className={`tag-inset ${isPaidApiPath ? "api-call" : "edge-fn"}`}>{isPaidApiPath ? "API CALL" : "EDGE FUNCTION"}</span>
                  <img className="security-shield-icon" src={securityShieldIcon} alt="" aria-hidden="true" />
                  <span className="sub-name">{item.name}</span>
                  <span className="sub-desc">Touches {item.tables_referenced.join(", ") || "no tables listed"}</span>
                </div>
              </summary>
              <div className="schema-panel">
                <div className="detail-line">
                  <strong>Uses Tables:</strong>{" "}
                  {item.tables_referenced.map((tableName) => (
                    <button key={tableName} type="button" className="jump-link detail-link table-link" onClick={() => onJumpToSchema("table", tableName)}>
                      {tableName}
                    </button>
                  ))}
                </div>
                {(edgeUsageMap.get(item.name) ?? []).length > 0 && (
                  <div className="detail-line" style={{ marginTop: 10 }}>
                    <strong>Used By:</strong>{" "}
                    {(edgeUsageMap.get(item.name) ?? []).map((filePath) => (
                      <button key={filePath} type="button" className="jump-link detail-link" onClick={() => onJumpToFile(filePath)}>
                        {filePath}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}

export default function AppArchitecturePage() {
  const navigate = useNavigate();
  const baselineRegistry = useMemo(() => buildArchitectureRegistry(MANUAL_ARCHITECTURE_PATHS, "Chronicle-main"), []);
  const registry = baselineRegistry;
  const rootNode = registry.nodes[registry.rootId];
  const navigationSections = useMemo(() => buildManualNavigationSections(registry), [registry]);
  const nodeByPath = useMemo(() => {
    const map = new Map<string, ArchitectureNode>();
    Object.values(registry.nodes).forEach((node) => {
      map.set(node.path, node);
    });
    return map;
  }, [registry]);

  const schemaTables = useMemo<Array<[string, SchemaTable]>>(
    () => Object.entries(databaseSchemaInventory.tables).sort((a, b) => a[0].localeCompare(b[0])) as Array<[string, SchemaTable]>,
    [],
  );
  const schemaFunctions = useMemo<SchemaFunction[]>(
    () => [...databaseSchemaInventory.database_functions].sort((a, b) => a.name.localeCompare(b.name)),
    [],
  );
  const storageBuckets = useMemo<SchemaBucket[]>(
    () => [...databaseSchemaInventory.storage_buckets].sort((a, b) => a.name.localeCompare(b.name)),
    [],
  );
  const edgeFunctions = useMemo<SchemaEdgeFunction[]>(
    () => [...databaseSchemaInventory.edge_functions].sort((a, b) => a.name.localeCompare(b.name)),
    [],
  );

  const knownTables = useMemo(() => new Set(schemaTables.map(([name]) => name)), [schemaTables]);
  const knownRpcs = useMemo(() => new Set(schemaFunctions.map((item) => item.name)), [schemaFunctions]);
  const knownBuckets = useMemo(() => new Set(storageBuckets.map((item) => item.name)), [storageBuckets]);
  const knownEdgeFunctions = useMemo(() => new Set(edgeFunctions.map((item) => item.name)), [edgeFunctions]);

  const initialClosedDetailIds = useMemo(() => {
    const next = new Set<string>();
    Object.values(registry.nodes).forEach((node) => {
      if (node.type !== "file") return;
      const rows = buildManualFileRows(node.path);
      rows.forEach((row) => {
        if (row.details.length > 0 || row.note) {
          next.add(row.id);
        }
      });
    });
    return next;
  }, [registry]);

  const [openFolderIds, setOpenFolderIds] = useState<Set<string>>(() => {
    const next = new Set<string>();
    Object.values(registry.nodes).forEach((node) => {
      if (node.type === "root" || node.type === "folder") {
        next.add(node.id);
      }
    });
    return next;
  });
  const [closedDetailIds, setClosedDetailIds] = useState<Set<string>>(() => new Set(initialClosedDetailIds));
  const [closedSchemaIds, setClosedSchemaIds] = useState<Set<string>>(() => new Set());
  const [showLegend, setShowLegend] = useState(false);
  const [currentFilter, setCurrentFilter] = useState<FilterValue>("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [activeNavId, setActiveNavId] = useState<string | null>(rootNode?.id ?? null);
  const filterRef = useRef<HTMLDivElement>(null);
  const mainScrollRef = useRef<HTMLDivElement>(null);
  const navRailRef = useRef<HTMLDivElement>(null);

  const fileMatchMap = useMemo(() => {
    const map = new Map<string, boolean>();
    Object.values(registry.nodes).forEach((node) => {
      if (node.type !== "file") return;
      const rows = buildManualFileRows(node.path);
      map.set(node.id, fileMatchesFilter(node, rows, currentFilter));
    });
    return map;
  }, [registry, currentFilter]);

  const tableUsageMap = useMemo(() => {
    const map = new Map<string, string[]>();
    Object.entries(architectureFileAnalysis).forEach(([filePath, analysis]) => {
      analysis.tables.forEach((tableName) => {
        if (!map.has(tableName)) map.set(tableName, []);
        map.get(tableName)?.push(filePath);
      });
    });
    for (const [key, value] of map.entries()) {
      map.set(key, uniqueStrings(value).sort((a, b) => a.localeCompare(b)));
    }
    return map;
  }, []);

  const rpcUsageMap = useMemo(() => {
    const map = new Map<string, string[]>();
    Object.entries(architectureFileAnalysis).forEach(([filePath, analysis]) => {
      analysis.rpcs.forEach((name) => {
        if (!map.has(name)) map.set(name, []);
        map.get(name)?.push(filePath);
      });
    });
    for (const [key, value] of map.entries()) {
      map.set(key, uniqueStrings(value).sort((a, b) => a.localeCompare(b)));
    }
    return map;
  }, []);

  const bucketUsageMap = useMemo(() => {
    const map = new Map<string, string[]>();
    Object.entries(architectureFileAnalysis).forEach(([filePath, analysis]) => {
      analysis.storageBuckets.forEach((name) => {
        if (!map.has(name)) map.set(name, []);
        map.get(name)?.push(filePath);
      });
    });
    for (const [key, value] of map.entries()) {
      map.set(key, uniqueStrings(value).sort((a, b) => a.localeCompare(b)));
    }
    return map;
  }, []);

  const edgeUsageMap = useMemo(() => {
    const map = new Map<string, string[]>();
    Object.entries(architectureFileAnalysis).forEach(([filePath, analysis]) => {
      analysis.edgeFunctions.forEach((name) => {
        if (!map.has(name)) map.set(name, []);
        map.get(name)?.push(filePath);
      });
    });
    for (const [key, value] of map.entries()) {
      map.set(key, uniqueStrings(value).sort((a, b) => a.localeCompare(b)));
    }
    return map;
  }, []);

  const handleDownloadArchitecture = useCallback(() => {
    downloadMarkdownFile(
      "chronicle-app-architecture.md",
      buildAppArchitectureDownloadMarkdown(
        registry,
        schemaTables,
        schemaFunctions,
        storageBuckets,
        edgeFunctions,
        tableUsageMap,
        rpcUsageMap,
        bucketUsageMap,
        edgeUsageMap,
        knownTables,
        knownRpcs,
        knownEdgeFunctions,
        knownBuckets,
      ),
    );
  }, [
    registry,
    schemaTables,
    schemaFunctions,
    storageBuckets,
    edgeFunctions,
    tableUsageMap,
    rpcUsageMap,
    bucketUsageMap,
    edgeUsageMap,
    knownTables,
    knownRpcs,
    knownEdgeFunctions,
    knownBuckets,
  ]);

  useEffect(() => {
    if (!highlightedId) return;
    const timeout = window.setTimeout(() => setHighlightedId(null), 1800);
    return () => window.clearTimeout(timeout);
  }, [highlightedId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!filterRef.current?.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const navRoot = navRailRef.current;
    if (!navRoot || !activeNavId) return;
    const activeElement = navRoot.querySelector<HTMLElement>(`[data-nav-id="${CSS.escape(activeNavId)}"]`);
    if (!activeElement) return;
    activeElement.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
  }, [activeNavId]);

  useEffect(() => {
    const scroller = mainScrollRef.current;
    if (!scroller) return;
    let frame = 0;

    const updateActive = () => {
      frame = 0;
      const anchors = Array.from(scroller.querySelectorAll<HTMLElement>("[data-nav-anchor='true']"));
      if (anchors.length === 0) return;

      const viewportTop = scroller.getBoundingClientRect().top + 92;
      let bestId: string | null = null;
      let bestScore = Number.POSITIVE_INFINITY;

      anchors.forEach((anchor) => {
        const rect = anchor.getBoundingClientRect();
        if (rect.bottom < viewportTop - 32 || rect.top > window.innerHeight - 60) return;
        const score = Math.abs(rect.top - viewportTop);
        if (score < bestScore) {
          bestScore = score;
          bestId = anchor.dataset.nodeId ?? null;
        }
      });

      if (bestId) {
        setActiveNavId(bestId);
      }
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(updateActive);
    };

    updateActive();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      scroller.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const revealNode = useCallback((nodeId: string, behavior: ScrollBehavior = "smooth") => {
    const node = registry.nodes[nodeId];
    if (!node) return;

    setOpenFolderIds((current) => {
      const next = new Set(current);
      let cursor: ArchitectureNode | undefined = node;
      while (cursor?.parentId) {
        next.add(cursor.parentId);
        cursor = registry.nodes[cursor.parentId];
      }
      if (node.type === "folder" || node.type === "root") next.add(node.id);
      return next;
    });

    setActiveNavId(nodeId);
    setHighlightedId(nodeId);
    window.requestAnimationFrame(() => {
      const target = document.querySelector<HTMLElement>(`[data-node-id="${CSS.escape(nodeId)}"]`);
      target?.scrollIntoView({ behavior, block: "center" });
    });
  }, [registry.nodes]);

  const revealFile = useCallback((filePath: string) => {
    const target = nodeByPath.get(filePath);
    if (!target) return;
    revealNode(target.id);
  }, [nodeByPath, revealNode]);

  const revealSchema = useCallback((kind: "table" | "rpc" | "edge" | "bucket", name: string) => {
    const schemaId = `schema-${kind}-${name}`;
    setHighlightedId(schemaId);
    window.requestAnimationFrame(() => {
      document.getElementById(schemaId)?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, []);

  const handleToggleFolder = useCallback((nodeId: string) => {
    setOpenFolderIds((current) => {
      const next = new Set(current);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  }, []);

  const handleDetailToggle = useCallback((detailId: string, open: boolean) => {
    setClosedDetailIds((current) => {
      const next = new Set(current);
      if (open) next.delete(detailId);
      else next.add(detailId);
      return next;
    });
  }, []);

  const handleSchemaToggle = useCallback((schemaId: string, open: boolean) => {
    setClosedSchemaIds((current) => {
      const next = new Set(current);
      if (open) next.delete(schemaId);
      else next.add(schemaId);
      return next;
    });
  }, []);

  if (!rootNode) return null;

  return (
    <div className="app-architecture-page">
      <style>{architectureStyles}</style>

      <header className="header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button
            type="button"
            onClick={() => navigate("/?tab=admin")}
            className="p-2 text-[hsl(var(--ui-surface-2))] hover:bg-slate-100 rounded-full transition-colors"
            aria-label="Go back"
            title="Go back"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
          </button>
          <h1 className="page-title" style={{ margin: 0 }}>App Architecture</h1>
        </div>

        <div className="header-filter-wrap">
          <div className="architecture-filter-dropdown" ref={filterRef}>
          <button
            type="button"
            className="architecture-filter-trigger"
            onClick={() => setIsFilterOpen((value) => !value)}
            aria-haspopup="menu"
            aria-expanded={isFilterOpen}
          >
            <span className="architecture-filter-trigger-label">Filter</span>
            <span className="architecture-filter-trigger-current">
              {FILTER_OPTIONS.find((option) => option.value === currentFilter)?.label ?? "All"}
            </span>
            <ChevronDown className="architecture-filter-trigger-chevron" />
          </button>

          {isFilterOpen && (
            <div className="architecture-filter-menu" role="menu">
              {FILTER_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`architecture-filter-option ${currentFilter === option.value ? "is-active" : ""}`.trim()}
                  onClick={() => {
                    setCurrentFilter(option.value);
                    setIsFilterOpen(false);
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="legend-toggle-btn"
            onClick={handleDownloadArchitecture}
          >
            Download Architecture
          </button>

          <button
            type="button"
            className="legend-toggle-btn"
            aria-expanded={showLegend}
            aria-controls="legend"
            onClick={() => setShowLegend((value) => !value)}
          >
            {showLegend ? "Hide Legend" : "View Legend"}
          </button>
        </div>
      </header>

      <div className="page-shell">
        <aside className="nav-rail-shell">
          <div className="nav-rail-body" ref={navRailRef}>
            <button
              type="button"
              className={`nav-root-link ${activeNavId === rootNode.id ? "active" : ""}`.trim()}
              data-nav-id={rootNode.id}
              title={`${rootNode.name}\nFolder`}
              onClick={() => revealNode(rootNode.id)}
            >
              {rootNode.name}
            </button>

            <div className="nav-section-stack">
              {navigationSections.map((section) => {
                const sectionNode = section.path ? nodeByPath.get(section.path) : null;
                const sectionId = sectionNode?.id ?? section.title;

                return (
                  <section key={sectionId} className="nav-section">
                    {sectionNode ? (
                      <button
                        type="button"
                        className={`nav-section-link ${activeNavId === sectionNode.id ? "active" : ""}`.trim()}
                        data-nav-id={sectionNode.id}
                        title={`${sectionNode.name}\nFolder`}
                        onClick={() => revealNode(sectionNode.id)}
                      >
                        {sectionNode.name}
                      </button>
                    ) : (
                      <div className="nav-section-title">{section.title}</div>
                    )}

                    <NavSnapshotGroup
                      entries={section.children}
                      nodeByPath={nodeByPath}
                      activeNavId={activeNavId}
                      onJump={revealNode}
                    />
                  </section>
                );
              })}
            </div>
          </div>
        </aside>

        <main className="page-main">
          <div ref={mainScrollRef} className="content" id="app-architecture-content">
            <ArchitectureLegend open={showLegend} />

            <div className={`tree architecture-tree ${currentFilter !== "all" ? "filter-mode-active" : ""}`.trim()}>
              <TreeFolder
                registry={registry}
                node={rootNode}
                openFolderIds={openFolderIds}
                onToggle={handleToggleFolder}
                highlightedId={highlightedId}
                fileAnalysis={architectureFileAnalysis}
                currentFilter={currentFilter}
                fileMatchMap={fileMatchMap}
                onJumpToFile={revealFile}
                onJumpToSchema={revealSchema}
                closedDetailIds={closedDetailIds}
                onDetailToggle={handleDetailToggle}
              />
            </div>

            <SchemaSection
              currentFilter={currentFilter}
              highlightedId={highlightedId}
              closedSchemaIds={closedSchemaIds}
              onSchemaToggle={handleSchemaToggle}
              schemaTables={schemaTables}
              schemaFunctions={schemaFunctions}
              storageBuckets={storageBuckets}
              edgeFunctions={edgeFunctions}
              tableUsageMap={tableUsageMap}
              rpcUsageMap={rpcUsageMap}
              bucketUsageMap={bucketUsageMap}
              edgeUsageMap={edgeUsageMap}
              onJumpToFile={revealFile}
              onJumpToSchema={revealSchema}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
