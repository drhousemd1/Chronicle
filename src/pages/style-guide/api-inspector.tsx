import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye } from "lucide-react";
import { apiInspectorMapRegistry } from "@/data/api-inspector-map-registry";
import settingsCogIcon from "@/assets/admin/settings-cog.png";
import {
  phaseOneAuditGroups,
  type PhaseOneAuditContainer,
  type PhaseOneAuditField,
  type PhaseOneAuditStatus,
} from "@/data/api-inspector-phase1-audit";
import {
  apiInspectorLiveSections,
  type ApiInspectorFileRef,
  type ApiInspectorGroup,
  type ApiInspectorItem,
  type ApiInspectorPhase,
  type ApiInspectorSection,
  type ApiInspectorTag,
} from "@/data/api-inspector-live-map";
import type {
  ApiMapCrossRef,
  ApiMapFileRef,
  ApiMapItem,
  ApiMapPhase,
  ApiMapSection,
  ApiMapSubItem,
  ApiMapTagType,
} from "@/lib/api-inspector-schema";

const HEADER_HEIGHT = 76;
const ROOT_ID = "api-inspector-root";
const API_CALL_1_REGISTRY_PHASE_IDS = [
  "phase-user-sends-message",
  "phase-system-prompt-assembly",
  "phase-api-call-1-fires",
  "phase-response-streaming-display",
] as const;
const API_CALL_2_REGISTRY_PHASE_IDS = ["phase-post-response-processing-api-call-2"] as const;
const API_CALL_3_REGISTRY_PHASE_IDS = ["phase-image-generation-calls", "phase-ai-character-generation-calls"] as const;
const LIVE_SECTION_ORDER = [
  "admin-telemetry",
  "data-and-storage",
] as const;

const FOLDER_ICON_DATA_URI =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='22' height='22' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M3.5 7.5c0-1.1.9-2 2-2h4.2l1.6 1.7h7.2c1.1 0 2 .9 2 2v6.8c0 1.1-.9 2-2 2H5.5c-1.1 0-2-.9-2-2V7.5Z' fill='%239bd0ff'/%3E%3Cpath d='M3.5 8.6c0-.9.7-1.6 1.6-1.6h5.3c.4 0 .8.2 1.1.5l.9.9h6.4c.9 0 1.6.7 1.6 1.6v5.9c0 .9-.7 1.6-1.6 1.6H5.1c-.9 0-1.6-.7-1.6-1.6V8.6Z' fill='url(%23g)' stroke='rgba(255,255,255,0.32)' stroke-width='.6'/%3E%3Cdefs%3E%3ClinearGradient id='g' x1='12' y1='7' x2='12' y2='17.5' gradientUnits='userSpaceOnUse'%3E%3Cstop stop-color='%237da4d3'/%3E%3Cstop offset='1' stop-color='%235f85b3'/%3E%3C/linearGradient%3E%3C/defs%3E%3C/svg%3E";

type RenderTag = ApiInspectorTag | ApiMapTagType | "api-call";

interface RenderFileRef {
  path: string;
  lines?: string;
  note?: string;
}

interface RenderDetail {
  id: string;
  label: string;
  text: string;
}

interface RenderCrossRef {
  badge: string;
  targetId: string;
  label: string;
  tooltip: string;
}

interface RenderItem {
  id: string;
  title: string;
  summary: string;
  whyItExists?: string;
  problemSolved?: string;
  tag: RenderTag;
  settingsGate?: string;
  ownerPath: string;
  ownerFolderPath: string;
  ownerFileName: string;
  fileRefs: RenderFileRef[];
  details: RenderDetail[];
  dataSource?: string;
  codeSource?: string;
  codeSourceLabel?: string;
  promptViewEnabled?: boolean;
  crossRefs?: RenderCrossRef[];
  meta?: string[];
}

interface RenderGroup {
  id: string;
  title: string;
  description: string;
  defaultOpen: boolean;
  items: RenderItem[];
}

interface RenderPhase {
  id: string;
  title: string;
  subtitle: string;
  defaultOpen: boolean;
  groups: RenderGroup[];
}

interface RenderShell {
  id: string;
  kicker: string;
  title: string;
  subtitle: string;
  navLabel: string;
  navSubtitle: string;
  phases: RenderPhase[];
}

const PHASE_ONE_STATUS_LABELS: Record<PhaseOneAuditStatus, string> = {
  connected: "Connected",
  missing: "Missing",
  partial: "Partial",
  "once-only": "Once-only",
  "code-handled": "Code-handled",
  "not-in-prompt": "Not in prompt",
};

interface AnchorContext {
  kind: "shell" | "phase" | "group" | "item";
  shellId: string;
  phaseId?: string;
  groupId?: string;
}

interface InspectorModel {
  shells: RenderShell[];
  anchorLookup: Map<string, AnchorContext>;
  phaseIds: string[];
  groupIds: string[];
  itemIds: string[];
}

const TAG_META: Record<RenderTag, { label: string; className: string }> = {
  "code-logic": { label: "Code Logic", className: "code-logic" },
  "context-injection": { label: "Context Injection", className: "context-injection" },
  "core-prompt": { label: "Core Prompt", className: "core-prompt" },
  "data-block": { label: "Data Block", className: "data-block" },
  validation: { label: "Validation Check", className: "validation" },
  "validation-check": { label: "Validation Check", className: "validation" },
  service: { label: "Service Call", className: "service" },
  "edge-function": { label: "Edge Function", className: "edge-function" },
  storage: { label: "Storage Lane", className: "storage" },
  rpc: { label: "RPC", className: "rpc" },
  database: { label: "Database", className: "database" },
  "api-call": { label: "API Call", className: "api-call" },
};

const pageStyles = `
:root {
  --bg: #121214;
  --text: #e0e0e0;
  --line: #555555;
  --indent: 28px;
  --danger-red: #ef4444;
  --live-header-height: ${HEADER_HEIGHT}px;
}

* {
  box-sizing: border-box;
}

body {
  background: var(--bg);
}

.api-inspector-page {
  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
  font-family: "SF Mono", "Fira Code", "Consolas", monospace;
  font-size: 13px;
  line-height: 1.6;
}

.page-shell {
  display: flex;
  align-items: stretch;
  min-height: calc(100vh - var(--live-header-height));
}

.page-main {
  flex: 1 1 auto;
  min-width: 0;
}

.header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #e0e0e0;
  padding: 14px 24px;
  display: flex;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
}

.header h1 {
  font-size: 17px;
  font-weight: 900;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #111111;
}

.nav-rail-shell {
  flex: 0 0 296px;
  width: 296px;
  min-width: 296px;
  max-width: 296px;
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

.nav-rail-body {
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

.nav-rail-body::-webkit-scrollbar {
  display: none;
}

.nav-root-link,
.nav-section-link,
.nav-branch-link,
.nav-tree-item {
  border: 0;
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.nav-root-link {
  display: flex;
  align-items: center;
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
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.nav-section-stack {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.nav-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nav-section-link {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 42px;
  padding: 0 14px;
  border-radius: 14px;
  background: #3c3e47;
  box-shadow:
    0 8px 20px rgba(0,0,0,0.28),
    inset 0 1px 0 rgba(255,255,255,0.07),
    inset 0 -1px 0 rgba(0,0,0,0.18);
  color: rgba(255,255,255,0.92);
  text-decoration: none;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: -0.01em;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.nav-section-subtitle {
  margin: -3px 2px 2px 14px;
  color: #959eac;
  font-size: 11px;
  line-height: 1.45;
  font-weight: 600;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.nav-tree-group {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0 0 0 4px;
  padding-left: 18px;
}

.nav-tree-group::before {
  content: "";
  position: absolute;
  left: 8px;
  top: 8px;
  bottom: 8px;
  width: 1px;
  background: rgba(255,255,255,0.16);
}

.nav-tree-group--nested {
  margin-left: 14px;
  padding-top: 2px;
}

.nav-tree-group > .nav-tree-item,
.nav-tree-group > .nav-branch {
  position: relative;
}

.nav-tree-group > .nav-tree-item::before,
.nav-tree-group > .nav-branch::before {
  content: "";
  position: absolute;
  left: -10px;
  top: 18px;
  width: 12px;
  height: 1px;
  background: rgba(255,255,255,0.16);
}

.nav-tree-group > .nav-tree-item:last-child::after,
.nav-tree-group > .nav-branch:last-child::after {
  content: "";
  position: absolute;
  left: -10px;
  top: 18px;
  bottom: -10px;
  width: 1px;
  background: #2d2e36;
}

.nav-branch {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nav-branch-link,
.nav-tree-item {
  display: flex;
  align-items: stretch;
  gap: 0;
  min-height: 36px;
  color: #d4d4d8;
  text-decoration: none;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: -0.01em;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  min-width: 0;
  max-width: 100%;
  overflow: visible;
}

.nav-link-body {
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

.nav-link-label {
  min-width: 0;
  flex: 1 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-section-link {
  color: rgba(255,255,255,0.92);
}

.nav-branch-link .nav-link-label {
  color: rgba(255,255,255,0.92);
}

.nav-branch-link {
  min-height: auto;
  width: 100%;
}

.nav-branch-link .nav-link-body {
  width: 100%;
  min-height: 36px;
  padding-top: 8px;
  padding-bottom: 8px;
  align-items: flex-start;
}

.nav-branch-link .nav-link-label {
  white-space: normal;
  overflow: visible;
  text-overflow: clip;
  line-height: 1.25;
}

.nav-branch-link.nav-accent-core-prompt .nav-link-label,
.nav-tree-item.nav-accent-core-prompt .nav-link-label {
  color: #93c5fd;
}

.nav-branch-link.nav-accent-code-logic .nav-link-label,
.nav-tree-item.nav-accent-code-logic .nav-link-label {
  color: #cbd5e1;
}

.nav-branch-link.nav-accent-data-block .nav-link-label,
.nav-tree-item.nav-accent-data-block .nav-link-label {
  color: #5eead4;
}

.nav-branch-link.nav-accent-context-injection .nav-link-label,
.nav-tree-item.nav-accent-context-injection .nav-link-label {
  color: #fdba74;
}

.nav-branch-link.nav-accent-validation .nav-link-label,
.nav-tree-item.nav-accent-validation .nav-link-label {
  color: #ff9b72;
}

.nav-branch-link.nav-accent-service .nav-link-label,
.nav-tree-item.nav-accent-service .nav-link-label {
  color: #5eead4;
}

.nav-branch-link.nav-accent-edge-function .nav-link-label,
.nav-tree-item.nav-accent-edge-function .nav-link-label {
  color: #f8fafc;
}

.nav-branch-link.nav-accent-storage .nav-link-label,
.nav-tree-item.nav-accent-storage .nav-link-label {
  color: #67e8f9;
}

.nav-branch-link.nav-accent-rpc .nav-link-label,
.nav-tree-item.nav-accent-rpc .nav-link-label {
  color: #93dcff;
}

.nav-branch-link.nav-accent-database .nav-link-label,
.nav-tree-item.nav-accent-database .nav-link-label {
  color: #86efac;
}

.nav-branch-link:hover .nav-link-body,
.nav-tree-item:hover .nav-link-body {
  background: rgba(255,255,255,0.04);
  color: #ffffff;
}

.nav-jump-link.active .nav-link-body,
.nav-section-link.active,
.nav-root-link.active {
  border-color: rgba(110, 137, 173, 0.45);
  background: rgba(74, 95, 127, 0.25);
  color: #e7eef8;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.06);
}

.content {
  height: calc(100vh - 76px);
  min-height: calc(100vh - 76px);
  overflow: auto;
  padding: 24px;
}

.legend-toggle-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  margin-left: auto;
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
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.legend-toggle-btn:hover {
  background: #343439;
}

.legend-toggle-btn:active {
  transform: scale(0.98);
}

.legend-toggle-btn[aria-expanded="true"] {
  background: #38414c;
}

.legend {
  margin: 0 24px 24px;
  display: none;
  max-width: calc(100% - 48px);
}

.legend.open {
  display: block;
}

.legend-shell {
  background: #2a2a2f;
  border-radius: 24px;
  overflow: hidden;
  max-width: 100%;
  box-shadow:
    0 12px 32px -2px rgba(0,0,0,0.50),
    inset 1px 1px 0 rgba(255,255,255,0.09),
    inset -1px -1px 0 rgba(0,0,0,0.35);
}

.legend-shell-header {
  position: relative;
  overflow: hidden;
  padding: 14px 20px 12px;
  background: linear-gradient(180deg, #5a7292 0%, #4a5f7f 100%);
  border-top: 1px solid rgba(255,255,255,0.20);
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.30);
}

.legend-shell-header::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 32%);
  pointer-events: none;
}

.legend-shell-title {
  color: #ffffff;
  font-size: 17px;
  font-weight: 800;
  letter-spacing: -0.02em;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  position: relative;
  z-index: 1;
}

.legend-shell-body {
  padding: 18px 20px 20px;
}

.legend-main-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
  gap: 16px;
}

.legend-card {
  padding: 16px;
  border-radius: 18px;
  background: #2e2e33;
  box-shadow:
    inset 1px 1px 0 rgba(255,255,255,0.07),
    inset -1px -1px 0 rgba(0,0,0,0.30),
    0 8px 20px rgba(0,0,0,0.28);
}

.legend-card-kicker {
  color: #93a7c3;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  margin-bottom: 6px;
}

.legend-card-title {
  color: #f3f6fb;
  font-size: 15px;
  font-weight: 800;
  letter-spacing: -0.02em;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  margin-bottom: 12px;
}

.legend-definition-grid,
.legend-signal-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.legend-definition-item,
.legend-signal-item,
.legend-health-row {
  padding: 12px;
  border-radius: 14px;
  background: #1c1c1f;
  border: 1px solid rgba(255,255,255,0.06);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.03);
}

.legend-definition-item .tag-dark {
  margin-bottom: 8px;
}

.legend-definition-copy,
.legend-signal-copy,
.legend-health-copy {
  color: #a1a1aa;
  font-size: 12px;
  line-height: 1.55;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.legend-signal-label,
.legend-health-title {
  color: #cfd5e2;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  margin-bottom: 8px;
}

.legend-signal-label--icon {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.legend-inline-icon {
  width: 18px;
  height: 18px;
  object-fit: contain;
  flex-shrink: 0;
}

.legend-signal-preview-card,
.legend-signal-preview-shell {
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 8px;
}

.legend-signal-preview-card {
  background: #2a2a2f;
  box-shadow:
    0 12px 32px -2px rgba(0,0,0,0.50),
    inset 1px 1px 0 rgba(255,255,255,0.09),
    inset -1px -1px 0 rgba(0,0,0,0.35);
}

.legend-signal-preview-card.is-blue-card {
  border: 2px solid rgba(70,130,255,0.95);
}

.legend-signal-preview-card.is-red-card {
  border: 2px solid rgba(255,70,70,0.95);
}

.legend-preview-mini-header {
  height: 12px;
  background: linear-gradient(180deg, #5a7292 0%, #4a5f7f 100%);
}

.legend-preview-mini-row {
  padding: 10px 12px;
  background: #3c3e47;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.legend-preview-mini-row.is-blue-row {
  border: 2px solid rgba(70,130,255,0.95);
  border-radius: 12px;
}

.legend-preview-mini-row.is-red-row {
  border: 2px solid rgba(255,70,70,0.95);
  border-radius: 12px;
}

.legend-preview-mini-copy {
  color: #e8edf5;
  font-size: 12px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.legend-health-block {
  margin-top: 14px;
}

.legend-health-list {
  display: grid;
  gap: 8px;
}

.legend-health-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.api-call-stack {
  display: grid;
  gap: 28px;
}

.api-call-section {
  margin: 0 8px;
  padding: 20px 22px 18px;
  border-radius: 26px;
  background: linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.025) 100%);
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow:
    0 18px 40px rgba(0,0,0,0.30),
    inset 0 1px 0 rgba(255,255,255,0.04);
}

.api-call-section-header {
  display: grid;
  gap: 10px;
  padding: 0 6px 16px;
  margin-bottom: 14px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}

.api-call-section-meta {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.api-call-section-copy {
  display: grid;
  gap: 4px;
}

.api-call-section-copy h2 {
  color: #f7fbff;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.05;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.api-call-section-copy p {
  color: #aab4c4;
  font-size: 13px;
  line-height: 1.55;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.tree-node {
  position: relative;
  padding: 16px 0 12px;
}

.tree > .tree-node {
  border-left: 2px solid var(--line);
  padding-left: 22px;
  margin-left: 8px;
}

.tree > .tree-node:last-child {
  border-left-color: transparent;
}

.tree > .tree-node::before {
  content: "";
  position: absolute;
  top: 0;
  left: -2px;
  width: 20px;
  height: 18px;
  border: solid var(--line);
  border-width: 0 0 2px 2px;
}

.children {
  display: none;
  margin-left: var(--indent);
  position: relative;
}

.children::before {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  border-left: 1px solid var(--line);
}

.children.is-open {
  display: block;
}

.children > .item-row,
.children > .tree-node {
  border-left: none;
}

.children > :last-child {
  border-left-color: transparent;
}

.children > .tree-node {
  padding-left: 16px;
}

.children > .tree-node::before {
  content: "";
  position: absolute;
  top: 0;
  left: -1px;
  width: 15px;
  height: 14px;
  border: solid var(--line);
  border-width: 0 0 1px 1px;
}

.item-row {
  position: relative;
  padding: 3px 8px 3px 16px;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.item-row::before {
  content: "";
  position: absolute;
  top: 0;
  left: -1px;
  width: 15px;
  height: 14px;
  border: solid var(--line);
  border-width: 0 0 1px 1px;
}

details > summary {
  list-style: none;
}

details > summary::-webkit-details-marker {
  display: none;
}

.phase-summary {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 42px;
  width: 100%;
  padding: 9px 16px;
  border-radius: 12px;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s ease;
  background: linear-gradient(180deg, #d85b5b 0%, #b63f3f 100%);
  color: #ffffff;
  border-top: 1px solid rgba(255,255,255,0.22);
  border-left: none;
  border-right: none;
  border-bottom: none;
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.35);
  margin: 2px 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  appearance: none;
  overflow: hidden;
  padding-right: 16px;
}

.phase-summary::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.00) 30%);
  pointer-events: none;
}

.phase-summary:hover {
  box-shadow: 0 12px 20px -3px rgba(0,0,0,0.40);
  filter: brightness(1.08);
}

.phase-copy,
.folder-copy {
  position: relative;
  z-index: 1;
  flex: 1 1 auto;
  min-width: 0;
  line-height: 1.35;
  white-space: normal;
  overflow-wrap: anywhere;
}

.phase-title {
  font-weight: 700;
  font-size: 15px;
  letter-spacing: -0.015em;
  color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  display: inline;
}

.phase-subtitle {
  color: rgba(255,255,255,0.74);
  font-weight: 400;
  font-size: 12px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  margin-left: 4px;
  display: inline;
}

.phase-chevron,
.folder-chevron {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0;
  color: transparent;
  transition: transform 0.18s ease;
  transform: rotate(-90deg);
  opacity: 0.9;
  margin-top: 0;
  position: relative;
  z-index: 1;
}

.phase-chevron::before,
.folder-chevron::before {
  content: "";
  display: block;
  width: 22px;
  height: 22px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.82)' stroke-width='2.6' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: center;
  background-size: 22px 22px;
}

.folder-chevron {
  width: 18px;
  height: 18px;
  margin-top: 0;
}

.folder-chevron::before {
  width: 18px;
  height: 18px;
  background-size: 18px 18px;
}

.phase-summary.is-open .phase-chevron,
.folder-row.is-open .folder-chevron {
  transform: rotate(0deg);
}

.folder-row {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 42px;
  width: 100%;
  padding: 9px 16px;
  border-radius: 12px;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s ease;
  border-top: 1px solid rgba(255,255,255,0.22);
  border-left: none;
  border-right: none;
  border-bottom: none;
  font-family: inherit;
  font-size: inherit;
  color: #ffffff;
  overflow: hidden;
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.35);
  background: linear-gradient(180deg, #c07840 0%, #a5652e 100%);
  margin: 2px 0;
}

.folder-icon-image {
  width: 22px;
  height: 22px;
  object-fit: contain;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

.folder-row::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.00) 30%);
  pointer-events: none;
}

.folder-row:hover {
  box-shadow: 0 12px 20px -3px rgba(0,0,0,0.40);
  filter: brightness(1.08);
}

.folder-label,
.folder-desc {
  position: relative;
  z-index: 1;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.folder-label {
  font-weight: 700;
  font-size: 15px;
  letter-spacing: -0.015em;
  display: inline;
}

.folder-desc {
  color: rgba(255,255,255,0.7);
  font-size: 12px;
  margin-left: 4px;
  display: inline;
}

.folder-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 22px;
  padding: 0 9px;
  margin-left: auto;
  flex: 0 0 auto;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #ffffff;
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.20);
  border-radius: 999px;
  white-space: nowrap;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  position: relative;
  z-index: 1;
}

.app-card {
  background: #2a2a2f;
  border-radius: 16px;
  overflow: hidden;
  box-shadow:
    0 12px 32px -2px rgba(0,0,0,0.50),
    inset 1px 1px 0 rgba(255,255,255,0.09),
    inset -1px -1px 0 rgba(0,0,0,0.35);
  margin: 12px 0;
}

.app-card-header {
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

.app-card-actions {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  position: relative;
  z-index: 1;
}

.app-card-actions .line-count-badge {
  margin-left: 0;
}

.app-card-header::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.00) 30%);
  pointer-events: none;
}

.app-card-body {
  padding: 14px;
}

.app-card-inner {
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

.app-card-desc {
  color: #a1a1aa;
  font-size: 12px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  line-height: 1.5;
  margin-bottom: 8px;
}

.item-name {
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  position: relative;
  z-index: 1;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.line-count-badge {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 22px;
  padding: 0 9px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.10);
  background: #1c1c1f;
  color: #eef4ff;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  font-family: "SF Mono", "Fira Code", "Consolas", monospace;
  white-space: nowrap;
  position: relative;
  z-index: 1;
}

.line-count-badge.is-large {
  color: #ffe28a;
}

.line-count-badge.is-refactor-soon {
  color: #ffc18c;
}

.line-count-badge.is-refactor-needed {
  color: var(--danger-red);
  border-color: rgba(239,68,68,0.82);
  box-shadow:
    0 0 2px rgba(239,68,68,0.95),
    0 0 6px rgba(239,68,68,0.82),
    0 0 14px rgba(239,68,68,0.50),
    inset 0 0 1px rgba(255,255,255,0.12);
}

.source-icon-btn {
  width: 28px;
  height: 28px;
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.42);
  color: #dbeafe;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.08),
    0 8px 16px rgba(0,0,0,0.22);
  transition: background 0.15s ease, transform 0.15s ease, border-color 0.15s ease;
}

.source-icon-btn:hover {
  background: rgba(59, 130, 246, 0.22);
  border-color: rgba(147, 197, 253, 0.45);
}

.source-icon-btn:active {
  transform: scale(0.97);
}

.detail-block {
  display: grid;
  gap: 8px;
}

.detail-block > summary {
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

.detail-block > summary::-webkit-details-marker {
  display: none;
}

.detail-block > summary::after {
  content: "";
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

.detail-block.is-open > summary::after {
  transform: translateY(-50%) rotate(180deg);
}

.detail-summary-inline {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
  min-width: 0;
}

.detail-summary-inline.has-settings-icon {
  align-items: flex-start;
}

.detail-summary-text {
  min-width: 0;
  flex: 1;
}

.settings-cog-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  object-fit: contain;
  align-self: flex-start;
  margin-top: 2px;
}

.detail-summary-inline .sub-name {
  font-weight: 600;
  color: #eaedf1;
  font-size: 13px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.detail-summary-inline .sub-desc {
  color: #a1a1aa;
  font-size: 12px;
  line-height: 1.5;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  display: inline;
}

.detail-panel {
  padding: 12px 14px;
  background: #1c1c1f;
  border: 1px solid rgba(0,0,0,0.35);
  border-radius: 10px;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.03);
}

.detail-stack {
  display: grid;
  gap: 8px;
}

.detail-line {
  color: #a1a1aa;
  font-size: 12px;
  line-height: 1.55;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.detail-line strong {
  color: #eaedf1;
  font-weight: 600;
}

.detail-line--source-trigger {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.code-view-btn {
  border: 0;
  border-radius: 999px;
  background: rgba(122, 162, 247, 0.18);
  color: #dbeafe;
  min-height: 28px;
  padding: 0 12px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  cursor: pointer;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.10),
    0 8px 16px rgba(0,0,0,0.22);
}

.code-view-btn:hover {
  background: rgba(122, 162, 247, 0.28);
}

.code-view-copy {
  color: #d7deeb;
  font-size: 12px;
  font-weight: 700;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.code-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.70);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28px;
  z-index: 30;
}

.code-modal {
  width: min(980px, 100%);
  max-height: min(82vh, 920px);
  background: #18181b;
  border-radius: 18px;
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow:
    0 28px 70px rgba(0,0,0,0.55),
    inset 0 1px 0 rgba(255,255,255,0.06);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.code-modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 18px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  background: linear-gradient(180deg, rgba(90,114,146,0.95) 0%, rgba(74,95,127,0.95) 100%);
}

.code-modal-copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.code-modal-kicker {
  color: rgba(234, 241, 255, 0.82);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.code-modal-copy span:last-child {
  color: #ffffff;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.4;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.code-modal-close {
  border: 0;
  border-radius: 999px;
  background: rgba(0,0,0,0.24);
  color: #f4f4f5;
  min-height: 32px;
  padding: 0 14px;
  font-size: 12px;
  font-weight: 700;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  cursor: pointer;
}

.code-modal-close:hover {
  background: rgba(0,0,0,0.34);
}

.code-modal-body {
  padding: 18px;
  overflow: auto;
  background: #111113;
}

.code-modal-body pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  color: #d7deeb;
  font-size: 12px;
  line-height: 1.72;
  font-family: "SF Mono", "Fira Code", "Consolas", monospace;
}

.cross-ref-wrap {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 8px;
  vertical-align: middle;
}

.cross-ref-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid rgba(168,85,247,0.36);
  background: rgba(91,33,182,0.18);
  color: #e9d5ff;
  font-size: 11px;
  font-weight: 700;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  cursor: pointer;
}

.cross-ref-chip:hover {
  background: rgba(91,33,182,0.26);
}

.tag-dark,
.tag-inset,
.tag-header {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  cursor: default;
}

.tag-dark {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  padding: 3px 9px;
  border-radius: 8px;
  background: #2a2a2f;
}

.tag-inset {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  padding: 3px 9px;
  border-radius: 8px;
  background: #1c1c1f;
  border-top: 1px solid rgba(0,0,0,0.35);
}

.tag-header {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  padding: 3px 9px;
  border-radius: 8px;
  background: rgba(0,0,0,0.25);
  border: 1px solid rgba(255,255,255,0.12);
  position: relative;
  z-index: 1;
}

.tag-dark.service,
.tag-inset.service,
.tag-header.service {
  color: #5eead4;
}

.tag-dark.code-logic,
.tag-inset.code-logic,
.tag-header.code-logic {
  color: #cbd5e1;
}

.tag-dark.context-injection,
.tag-inset.context-injection,
.tag-header.context-injection {
  color: #fdba74;
}

.tag-dark.core-prompt,
.tag-inset.core-prompt,
.tag-header.core-prompt {
  color: #93c5fd;
}

.tag-dark.data-block,
.tag-inset.data-block,
.tag-header.data-block {
  color: #5eead4;
}

.tag-dark.validation,
.tag-inset.validation,
.tag-header.validation {
  color: #ff9b72;
}

.tag-header.validation {
  background: rgba(73, 33, 20, 0.42);
  border-color: rgba(255, 155, 114, 0.34);
}

.tag-dark.edge-function,
.tag-inset.edge-function,
.tag-header.edge-function {
  color: #f8fafc;
}

.tag-dark.storage,
.tag-inset.storage,
.tag-header.storage {
  color: #67e8f9;
}

.tag-dark.rpc,
.tag-inset.rpc,
.tag-header.rpc {
  color: #93dcff;
}

.tag-dark.database,
.tag-inset.database,
.tag-header.database {
  color: #86efac;
}

.tag-dark.api-call,
.tag-header.api-call {
  color: var(--danger-red);
}

#api-inspector-root,
.api-call-section[id],
.tree-node[id] {
  scroll-margin-top: 92px;
}

.jump-target-flash {
  animation: jumpFlash 3s ease;
}

@keyframes jumpFlash {
  0% {
    box-shadow:
      0 0 0 2px rgba(147, 197, 253, 0.95),
      0 0 24px rgba(96, 165, 250, 0.3),
      inset 0 1px 0 rgba(255,255,255,0.09),
      inset 0 -1px 0 rgba(0,0,0,0.35);
  }
  100% {
    box-shadow:
      0 12px 32px -2px rgba(0,0,0,0.50),
      inset 1px 1px 0 rgba(255,255,255,0.09),
      inset -1px -1px 0 rgba(0,0,0,0.35);
  }
}

@media (max-width: 1180px) {
  .page-shell {
    display: block;
  }

  .nav-rail-shell {
    display: none;
  }

  .legend-main-grid,
  .legend-definition-grid,
  .legend-signal-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 840px) {
  .content {
    height: auto;
    min-height: calc(100vh - 76px);
    padding: 18px;
  }

  .legend {
    margin: 0 0 18px;
    max-width: 100%;
  }

  .api-call-section {
    margin: 0;
    padding: 18px 16px 16px;
  }

  .api-call-section-meta {
    flex-direction: column;
  }

  .phase-summary,
  .folder-row {
    width: 100%;
    flex-wrap: wrap;
  }

  .phase-chevron {
    margin-left: 0;
  }

  .folder-count,
  .line-count-badge {
    margin-left: 0;
  }
}
`;

function mergeIntervals(intervals: Array<[number, number]>) {
  if (intervals.length === 0) return intervals;
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
  const merged: Array<[number, number]> = [sorted[0]];

  for (let index = 1; index < sorted.length; index += 1) {
    const [start, end] = sorted[index];
    const last = merged[merged.length - 1];
    if (start <= last[1] + 1) {
      last[1] = Math.max(last[1], end);
    } else {
      merged.push([start, end]);
    }
  }

  return merged;
}

function extractIntervals(spec?: string): Array<[number, number]> {
  if (!spec) return [];
  const intervals: Array<[number, number]> = [];
  const rangeMatches = spec.matchAll(/~?(\d+)\s*-\s*~?(\d+)/g);
  for (const match of rangeMatches) {
    const start = Number(match[1]);
    const end = Number(match[2]);
    if (Number.isNaN(start) || Number.isNaN(end)) continue;
    intervals.push([Math.min(start, end), Math.max(start, end)]);
  }
  if (intervals.length > 0) return intervals;
  if (spec.includes("~")) return [];

  const singleMatches = spec.matchAll(/\b(\d+)\b/g);
  for (const match of singleMatches) {
    const line = Number(match[1]);
    if (Number.isNaN(line)) continue;
    intervals.push([line, line]);
  }

  return intervals;
}

function getItemReferencedLineCount(fileRefs: RenderFileRef[]): number | null {
  const grouped = new Map<string, Array<[number, number]>>();

  fileRefs.forEach((fileRef) => {
    const intervals = extractIntervals(fileRef.lines);
    if (intervals.length === 0) return;
    const path = fileRef.path.startsWith("/") ? fileRef.path : `/${fileRef.path}`;
    const next = grouped.get(path) ?? [];
    next.push(...intervals);
    grouped.set(path, next);
  });

  if (grouped.size === 0) return null;

  let total = 0;
  grouped.forEach((intervals) => {
    total += mergeIntervals(intervals).reduce((sum, [start, end]) => sum + (end - start + 1), 0);
  });

  return total > 0 ? total : null;
}

function getLineCountClass(lineCount: number | null) {
  if (!lineCount) return "";
  if (lineCount >= 1000) return "is-refactor-needed";
  if (lineCount >= 600) return "is-refactor-soon";
  if (lineCount >= 400) return "is-large";
  return "";
}

function formatLineCountLabel(lineCount: number) {
  return `${lineCount.toLocaleString()} ${lineCount === 1 ? "line" : "lines"}`;
}

function formatFileRef(fileRef: RenderFileRef) {
  if (fileRef.lines && fileRef.note) return `${fileRef.path} - ${fileRef.lines} - ${fileRef.note}`;
  if (fileRef.lines) return `${fileRef.path} - ${fileRef.lines}`;
  if (fileRef.note) return `${fileRef.path} - ${fileRef.note}`;
  return fileRef.path;
}

function getSourceViewLabel(item: Pick<RenderItem, "codeSourceLabel" | "promptViewEnabled">) {
  return item.codeSourceLabel ?? (item.promptViewEnabled ? "Prompt / Source View" : "Source Snapshot");
}

function normalizeSourcePath(path: string) {
  return path.startsWith("/") ? path.slice(1) : path;
}

function getFileName(path: string) {
  const normalized = normalizeSourcePath(path);
  const parts = normalized.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? normalized;
}

function getParentFolderPath(path: string) {
  const normalized = normalizeSourcePath(path);
  const parts = normalized.split("/").filter(Boolean);
  if (parts.length <= 1) return normalized;
  return parts.slice(0, -1).join("/");
}

const OWNER_PATH_DESCRIPTION_OVERRIDES: Array<[prefix: string, description: string]> = [
  ["src/components/chronicle", "Visible chat UI and action entrypoints."],
  ["src/services/persistence", "Generation-safe continuity persistence."],
  ["src/services", "Prompt assembly and request orchestration."],
  ["src/features/chat-debug", "Trace shaping and session-log export."],
  ["src/hooks", "Shared client runtime hooks."],
  ["src/data", "Inspector registries and generated maps."],
  ["src/lib", "Shared inspector and architecture helpers."],
  ["src/pages/style-guide", "Operator-facing architecture tooling."],
  ["src/integrations/supabase", "Supabase client and typed contracts."],
  ["supabase/functions/chat", "Chat relay and provider dispatch."],
  ["supabase/functions", "Backend edge-function entrypoints."],
  ["supabase/migrations", "Continuity and generation schema."],
];

function trimSentence(text: string) {
  return text.replace(/\s+/g, " ").trim().replace(/[.?!]\s*$/, "");
}

function buildOwnerGroupDescription(ownerPath: string, items: RenderItem[]) {
  const override = OWNER_PATH_DESCRIPTION_OVERRIDES.find(([prefix]) => ownerPath.startsWith(prefix));
  if (override) {
    return override[1];
  }

  const summary = items
    .map((item) => trimSentence(item.summary))
    .find((text) => text.length > 0);

  if (summary) {
    return `${summary}.`;
  }

  const fileNames = Array.from(new Set(items.map((item) => item.ownerFileName).filter(Boolean)));
  if (fileNames.length > 0) {
    return `Runtime blocks owned here include ${fileNames.join(", ")}.`;
  }

  return "Mapped runtime blocks for this part of the request flow.";
}

function getNavAccentClass(tagType?: RenderTag) {
  if (!tagType) return "";
  return `nav-accent-${TAG_META[tagType].className}`;
}

function normalizePhaseTitle(title: string) {
  const match = title.match(/^Phase\s+(\d+)\s*[:-]\s*(.+)$/i);
  if (!match) return title;
  return `Phase ${match[1]} - ${match[2].trim()}`;
}

function normalizeGroupDescription(description: string) {
  return description.replace(/^\s*[—-]\s*/, "").trim();
}

function toRenderFileRef(fileRef: ApiMapFileRef | ApiInspectorFileRef): RenderFileRef {
  if ("locator" in fileRef) {
    return {
      path: fileRef.path,
      note: fileRef.locator,
    };
  }

  const mapFileRef = fileRef as ApiMapFileRef;
  return {
    path: mapFileRef.path,
    lines: mapFileRef.lines,
    note: mapFileRef.note,
  };
}

function buildRegistryDetails(itemId: string, subItems?: ApiMapSubItem[]) {
  return (
    subItems?.map((subItem) => ({
      id: `${itemId}::${subItem.id}`,
      label: subItem.title,
      text: subItem.description,
    })) ?? []
  );
}

function buildContextDetails(
  itemId: string,
  summary: string,
  whyItExists?: string,
  problemSolved?: string,
): RenderDetail[] {
  return [
    {
      id: `${itemId}::detail::what-it-does`,
      label: "What It Does",
      text: summary,
    },
    ...(whyItExists
      ? [
          {
            id: `${itemId}::detail::why-it-exists`,
            label: "Why It Exists",
            text: whyItExists,
          },
        ]
      : []),
    ...(problemSolved
      ? [
          {
            id: `${itemId}::detail::problem-solved`,
            label: "Problem / Risk It Covers",
            text: problemSolved,
          },
        ]
      : []),
  ];
}

function buildRegistryItem(item: ApiMapItem): RenderItem {
  const primaryFileRef = item.fileRefs[0];
  const ownerPath = primaryFileRef ? normalizeSourcePath(primaryFileRef.path) : "unknown";
  return {
    id: item.id,
    title: item.title,
    summary: item.purpose,
    whyItExists: item.whyItExists,
    problemSolved: item.problemSolved,
    tag: item.tagType,
    settingsGate: item.settingsGate,
    ownerPath,
    ownerFolderPath: getParentFolderPath(ownerPath),
    ownerFileName: getFileName(ownerPath),
    fileRefs: item.fileRefs.map(toRenderFileRef),
    details: buildRegistryDetails(item.id, item.subItems),
    dataSource: item.dataSource,
    codeSource: item.codeSource,
    codeSourceLabel: item.codeSourceLabel,
    promptViewEnabled: item.promptViewEnabled,
    crossRefs: item.crossRefs?.map((ref) => ({
      badge: ref.badge,
      targetId: ref.targetItemId,
      label: ref.label,
      tooltip: ref.tooltip,
    })),
  };
}

function buildRegistryGroup(scopeId: string, section: ApiMapSection): RenderGroup {
  const items = section.items.map(buildRegistryItem);
  const fallbackDescription = buildOwnerGroupDescription(section.title, items);
  return {
    id: `${scopeId}::${section.id}`,
    title: section.title,
    description: normalizeGroupDescription(section.description) || fallbackDescription,
    defaultOpen: section.defaultOpen ?? true,
    items,
  };
}

function buildRegistryPhase(parentPhase: ApiMapPhase): RenderPhase {
  const parentTitle = normalizePhaseTitle(parentPhase.title).replace(/^Phase\s+\d+\s*-\s*/i, "").trim();
  return {
    id: parentPhase.id,
    title: normalizePhaseTitle(parentPhase.title),
    subtitle: normalizeGroupDescription(parentPhase.subtitle),
    defaultOpen: parentPhase.defaultOpen ?? true,
    groups: parentPhase.sections.map((section) => buildRegistryGroup(parentPhase.id, section)),
  };
}

function buildLiveDetails(itemId: string, item: ApiInspectorItem): RenderDetail[] {
  return item.bullets.map((bullet, index) => ({
    id: `${itemId}::detail::${index}`,
    label: bullet.label,
    text: bullet.text,
  }));
}

function buildLiveItem(itemId: string, item: ApiInspectorItem): RenderItem {
  const primaryFileRef = item.fileRefs[0];
  const ownerPath = primaryFileRef ? normalizeSourcePath(primaryFileRef.path) : "unknown";
  return {
    id: itemId,
    title: item.title,
    summary: item.summary,
    whyItExists: item.whyItExists,
    problemSolved: item.problemSolved,
    tag: item.tag,
    settingsGate: item.settingsGate,
    ownerPath,
    ownerFolderPath: getParentFolderPath(ownerPath),
    ownerFileName: getFileName(ownerPath),
    fileRefs: item.fileRefs.map(toRenderFileRef),
    details: buildLiveDetails(itemId, item),
    meta: item.meta,
  };
}

function buildLiveGroup(sectionId: string, phaseId: string, group: ApiInspectorGroup): RenderGroup {
  const items = group.items.map((item) => buildLiveItem(`${sectionId}::${phaseId}::${group.id}::${item.id}`, item));
  const ownerPath = normalizeSourcePath(group.primaryRef.path);
  return {
    id: `${sectionId}::${phaseId}::${group.id}`,
    title: group.title,
    description: normalizeGroupDescription(group.description) || buildOwnerGroupDescription(ownerPath, items),
    defaultOpen: true,
    items,
  };
}

function buildLivePhase(sectionId: string, phase: ApiInspectorPhase): RenderPhase {
  return {
    id: `${sectionId}::${phase.id}`,
    title: normalizePhaseTitle(phase.title),
    subtitle: phase.subtitle,
    defaultOpen: true,
    groups: phase.groups.map((group) => buildLiveGroup(sectionId, phase.id, group)),
  };
}

function getAuditItemTag(fields: PhaseOneAuditField[]): RenderTag {
  if (fields.some((field) => field.status === "missing" || field.status === "partial")) {
    return "validation";
  }

  if (fields.every((field) => field.status === "not-in-prompt" || field.status === "code-handled" || field.status === "once-only")) {
    return "code-logic";
  }

  return "data-block";
}

function formatAuditFieldText(field: PhaseOneAuditField) {
  const pieces = [`${PHASE_ONE_STATUS_LABELS[field.status]} — ${field.detail}`];
  if (field.issueType) pieces.push(`Issue: ${field.issueType}`);
  if (field.recommendation) pieces.push(`Recommendation: ${field.recommendation}`);
  return pieces.join(" ");
}

function buildAuditItem(group: { id: string; title: string }, container: PhaseOneAuditContainer): RenderItem {
  const primaryFileRef = container.fileRefs[0];
  const ownerPath = primaryFileRef ? normalizeSourcePath(primaryFileRef.path) : "unknown";
  return {
    id: `phase1-audit::${group.id}::${container.id}`,
    title: container.title,
    summary: container.description,
    tag: getAuditItemTag(container.fields),
    ownerPath,
    ownerFolderPath: getParentFolderPath(ownerPath),
    ownerFileName: getFileName(ownerPath),
    fileRefs: container.fileRefs.map((fileRef) => ({
      path: fileRef.path,
      lines: fileRef.lines,
      note: fileRef.note,
    })),
    details: container.fields.map((field, index) => ({
      id: `phase1-audit::${container.id}::field::${index}`,
      label: field.label,
      text: formatAuditFieldText(field),
    })),
    codeSource: container.codeSource,
    codeSourceLabel: container.codeSource ? "Serialization / Prompt Coverage" : undefined,
    promptViewEnabled: Boolean(container.codeSource),
    meta: Array.from(new Set(container.fields.map((field) => PHASE_ONE_STATUS_LABELS[field.status]))),
  };
}

function buildAuditShell(): RenderShell {
  return {
    id: "phase-1-gap-map",
    kicker: "Phase 1 Gap Map",
    title: "Field-by-Field Prompt Coverage Audit",
    subtitle:
      "Code-truth audit of which Story Builder and Character Builder fields actually land in API Call 1, which are once-only, and which are handled outside the recurring prompt.",
    navLabel: "Phase 1 Gap Map",
    navSubtitle: "Story/character field coverage",
    phases: phaseOneAuditGroups.map((group, index) => ({
      id: `phase1-audit::${group.id}`,
      title: `Audit ${index + 1} - ${group.title}`,
      subtitle: group.description,
      defaultOpen: true,
      groups: [
        {
          id: `phase1-audit::${group.id}::containers`,
          title: group.title,
          description: group.description,
          defaultOpen: true,
          items: group.containers.map((container) => buildAuditItem(group, container)),
        },
      ],
    })),
  };
}

function getRequiredLiveSection(id: string): ApiInspectorSection {
  const section = apiInspectorLiveSections.find((entry) => entry.id === id);
  if (!section) {
    throw new Error(`Missing API inspector live section: ${id}`);
  }
  return section;
}

function getRequiredRegistryPhase(id: string): ApiMapPhase {
  const phase = apiInspectorMapRegistry.phases.find((entry) => entry.id === id);
  if (!phase) {
    throw new Error(`Missing API inspector registry phase: ${id}`);
  }
  return phase;
}

function buildInspectorModel(): InspectorModel {
  const shells: RenderShell[] = [];

  const call1Meta = getRequiredLiveSection("api-call-1");
  shells.push({
    id: call1Meta.id,
    kicker: call1Meta.kicker,
    title: call1Meta.title,
    subtitle: call1Meta.description,
    navLabel: call1Meta.navLabel,
    navSubtitle: call1Meta.navSubtitle,
    phases: API_CALL_1_REGISTRY_PHASE_IDS.map((phaseId) => buildRegistryPhase(getRequiredRegistryPhase(phaseId))),
  });

  shells.push(buildAuditShell());

  shells.push({
    id: "api-call-2-shell",
    kicker: "API Call 2",
    title: "Post-Response Stateful Extraction",
    subtitle:
      "Memory writes, character-state extraction, stale-result protection, and post-turn continuity updates after the streamed assistant response lands.",
    navLabel: "API Call 2",
    navSubtitle: "Post-response processing",
    phases: API_CALL_2_REGISTRY_PHASE_IDS.map((phaseId) => buildRegistryPhase(getRequiredRegistryPhase(phaseId))),
  });

  shells.push({
    id: "api-call-3-shell",
    kicker: "API Call 3",
    title: "Supporting Generation + Enhance Lanes",
    subtitle:
      "Image-generation and authoring-assist flows that sit outside the paid narrative request but still call shared chat/image backends.",
    navLabel: "API Call 3",
    navSubtitle: "Images + authoring assists",
    phases: API_CALL_3_REGISTRY_PHASE_IDS.map((phaseId) => buildRegistryPhase(getRequiredRegistryPhase(phaseId))),
  });

  LIVE_SECTION_ORDER.forEach((sectionId) => {
    const section = getRequiredLiveSection(sectionId);
    shells.push({
      id: section.id,
      kicker: section.kicker,
      title: section.title,
      subtitle: section.description,
      navLabel: section.navLabel,
      navSubtitle: section.navSubtitle,
      phases: section.phases.map((phase) => buildLivePhase(section.id, phase)),
    });
  });

  const anchorLookup = new Map<string, AnchorContext>();
  const phaseIds: string[] = [];
  const groupIds: string[] = [];
  const itemIds: string[] = [];

  shells.forEach((shell) => {
    anchorLookup.set(shell.id, {
      kind: "shell",
      shellId: shell.id,
    });

    shell.phases.forEach((phase) => {
      phaseIds.push(phase.id);
      anchorLookup.set(phase.id, {
        kind: "phase",
        shellId: shell.id,
        phaseId: phase.id,
      });

      phase.groups.forEach((group) => {
        groupIds.push(group.id);
        anchorLookup.set(group.id, {
          kind: "group",
          shellId: shell.id,
          phaseId: phase.id,
          groupId: group.id,
        });

        group.items.forEach((item) => {
          itemIds.push(item.id);
          anchorLookup.set(item.id, {
            kind: "item",
            shellId: shell.id,
            phaseId: phase.id,
            groupId: group.id,
          });
        });
      });
    });
  });

  return {
    shells,
    anchorLookup,
    phaseIds,
    groupIds,
    itemIds,
  };
}

function Legend({ open }: { open: boolean }) {
  return (
    <div id="legend" className={`legend ${open ? "open" : ""}`.trim()}>
      <div className="legend-shell">
        <div className="legend-shell-header">
          <h3 className="legend-shell-title">API Inspector Page Legend</h3>
        </div>

        <div className="legend-shell-body">
          <div className="legend-main-grid">
            <section className="legend-card">
              <div className="legend-card-kicker">Structure</div>
              <h4 className="legend-card-title">How to read the inspector</h4>

              <div className="legend-definition-grid">
                <div className="legend-definition-item">
                  <span className="tag-dark api-call">API Call</span>
                  <p className="legend-definition-copy">
                    Top-level shell for one runtime family, such as the paid narrative request, post-turn extraction,
                    image generation, or admin support lanes.
                  </p>
                </div>
                <div className="legend-definition-item">
                  <span className="tag-dark code-logic">Phase Header</span>
                  <p className="legend-definition-copy">
                    Large headline rows break each shell into ordered phases so you can follow the request chain from
                    trigger to post-write behavior.
                  </p>
                </div>
                <div className="legend-definition-item">
                  <span className="tag-dark context-injection">Orange Group</span>
                  <p className="legend-definition-copy">
                    File or subsystem lane. Expand it to see the blue cards that spell out what that code block sends,
                    reads, validates, or writes.
                  </p>
                </div>
                <div className="legend-definition-item">
                  <span className="tag-dark core-prompt">Blue Card</span>
                  <p className="legend-definition-copy">
                    The actual mapped runtime block. Expand the inner panel for field details, source files,
                    prompt/source snapshots, and linked cross-references.
                  </p>
                </div>
              </div>
            </section>

            <section className="legend-card">
              <div className="legend-card-kicker">Signals + Health</div>
              <h4 className="legend-card-title">What the badges mean</h4>

              <div className="legend-signal-grid">
                <div className="legend-signal-item">
                  <div className="legend-signal-label">Code Tags</div>
                  <p className="legend-signal-copy">
                    `Code Logic`, `Validation Check`, `Core Prompt`, `Data Block`, `Context Injection`, `Service
                    Call`, `Edge Function`, `RPC`, `Database`, and `Storage Lane` all map directly to the block type.
                  </p>
                </div>

                <div className="legend-signal-item">
                  <div className="legend-signal-label">Line Counters</div>
                  <p className="legend-signal-copy">
                    Counters only appear when the card has trustworthy mapped line refs. They measure the referenced
                    code slice, not the full file size, so duplicate whole-file badges do not swamp the page.
                  </p>
                </div>

                <div className="legend-signal-item">
                  <div className="legend-signal-label legend-signal-label--icon">
                    <img className="legend-inline-icon" src={settingsCogIcon} alt="" aria-hidden="true" />
                    <span>Settings Cog</span>
                  </div>
                  <p className="legend-signal-copy">
                    Marks a conditional lane that only fires for a specific toggle, mode, button path, admin tool,
                    provider setting, or optional follow-up chain.
                  </p>
                </div>

                <div className="legend-signal-item">
                  <div className="legend-signal-label">Cross Refs</div>
                  <p className="legend-signal-copy">
                    Purple chips jump to the connected card when one phase creates something another phase later sends,
                    consumes, retries, or persists.
                  </p>
                </div>

                <div className="legend-signal-item">
                  <div className="legend-signal-label">Prompt / Source View</div>
                  <p className="legend-signal-copy">
                    Some cards include a nested source snapshot so you can inspect the actual prompt fragment or payload
                    expression behind the mapped runtime block.
                  </p>
                </div>
              </div>

              <div className="legend-health-block">
                <div className="legend-health-title">Line Count Health</div>
                <div className="legend-health-list">
                  <div className="legend-health-row">
                    <span className="line-count-badge">299 lines</span>
                    <span className="legend-health-copy">Healthy size. Usually safe to leave alone.</span>
                  </div>
                  <div className="legend-health-row">
                    <span className="line-count-badge is-large">428 lines</span>
                    <span className="legend-health-copy">Large code slice. Keep an eye on it.</span>
                  </div>
                  <div className="legend-health-row">
                    <span className="line-count-badge is-refactor-soon">612 lines</span>
                    <span className="legend-health-copy">Consider refactoring soon.</span>
                  </div>
                  <div className="legend-health-row">
                    <span className="line-count-badge is-refactor-needed">1,200 lines</span>
                    <span className="legend-health-copy">Refactoring needed.</span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionNav({
  shell,
  activeTargetId,
  onJump,
}: {
  shell: RenderShell;
  activeTargetId: string | null;
  onJump: (targetId: string) => void;
}) {
  const shellActive =
    activeTargetId === shell.id ||
    shell.phases.some((phase) => activeTargetId === phase.id || phase.groups.some((group) => activeTargetId === group.id));

  return (
    <section className="nav-section">
      <button
        type="button"
        className={`nav-section-link nav-jump-link ${shellActive ? "active" : ""}`.trim()}
        data-nav-id={shell.id}
        onClick={() => onJump(shell.id)}
      >
        {shell.navLabel}
      </button>
      <div className="nav-section-subtitle">{shell.navSubtitle}</div>
      <div className="nav-tree-group">
        {shell.phases.map((phase) => {
          const phaseActive = activeTargetId === phase.id || phase.groups.some((group) => activeTargetId === group.id);

          return (
            <div key={phase.id} className="nav-branch">
              <button
                type="button"
                className={`nav-branch-link nav-jump-link ${phaseActive ? "active" : ""}`.trim()}
                data-nav-id={phase.id}
                onClick={() => onJump(phase.id)}
              >
                <span className="nav-link-body">
                  <span className="nav-link-label">{phase.title}</span>
                </span>
              </button>

              <div className="nav-tree-group nav-tree-group--nested">
                {phase.groups.map((group) => {
                  const groupActive = activeTargetId === group.id;
                  const accentClass = getNavAccentClass(group.items[0]?.tag);

                  return (
                    <button
                      key={group.id}
                      type="button"
                      className={`nav-tree-item nav-jump-link ${groupActive ? "active" : ""} ${accentClass}`.trim()}
                      data-nav-id={group.id}
                      onClick={() => onJump(group.id)}
                    >
                      <span className="nav-link-body">
                        <span className="nav-link-label">{group.title}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function FlowItemCard({
  item,
  detailOpen,
  onToggleDetail,
  onOpenSource,
  onJump,
}: {
  item: RenderItem;
  detailOpen: boolean;
  onToggleDetail: (itemId: string, open: boolean) => void;
  onOpenSource: (item: RenderItem) => void;
  onJump: (targetId: string) => void;
}) {
  const lineCount = getItemReferencedLineCount(item.fileRefs);
  const lineCountClass = getLineCountClass(lineCount);
  const tagMeta = TAG_META[item.tag];

  return (
    <article id={item.id} className="item-row">
      <div className="app-card">
        <div className="app-card-header">
          <span className={`tag-header ${tagMeta.className}`}>{tagMeta.label}</span>
          <span className="item-name">{item.title}</span>
          <div className="app-card-actions">
            {item.codeSource ? (
              <button
                type="button"
                className="source-icon-btn"
                title={item.promptViewEnabled ? `View Prompt — ${getSourceViewLabel(item)}` : `View Source — ${getSourceViewLabel(item)}`}
                aria-label={item.promptViewEnabled ? `View prompt for ${item.title}` : `View source for ${item.title}`}
                onClick={() => onOpenSource(item)}
              >
                <Eye size={14} aria-hidden="true" />
              </button>
            ) : null}
            {lineCount ? (
              <span
                className={`line-count-badge ${lineCountClass}`.trim()}
                title="Measured from mapped code line refs on this card"
              >
                {formatLineCountLabel(lineCount)}
              </span>
            ) : null}
          </div>
        </div>

        <div className="app-card-body">
          <div className="app-card-desc">{item.summary}</div>

          <div className="app-card-inner">
            <details
              className={`detail-block ${detailOpen ? "is-open" : ""}`.trim()}
              open={detailOpen}
              onToggle={(event) => onToggleDetail(item.id, event.currentTarget.open)}
            >
              <summary>
                <div className={`detail-summary-inline ${item.settingsGate ? "has-settings-icon" : ""}`.trim()}>
                  {item.settingsGate ? (
                    <img className="settings-cog-icon" src={settingsCogIcon} alt="" aria-hidden="true" />
                  ) : null}
                  <span className={`tag-inset ${tagMeta.className}`}>{tagMeta.label}</span>
                  <div className="detail-summary-text">
                    <span className="sub-name">{item.title}:</span>{" "}
                    <span className="sub-desc">{item.summary}</span>
                  </div>
                </div>
              </summary>

              <div className="detail-panel">
                <div className="detail-stack">
                  {buildContextDetails(item.id, item.summary, item.whyItExists, item.problemSolved).map((entry) => (
                    <div key={entry.id} className="detail-line">
                      <strong>{entry.label}:</strong> {entry.text}
                    </div>
                  ))}

                  {item.details.map((entry) => (
                    <div key={entry.id} className="detail-line">
                      <strong>{entry.label}:</strong> {entry.text}
                    </div>
                  ))}

                  {item.dataSource ? (
                    <div className="detail-line">
                      <strong>Data Source:</strong> {item.dataSource}
                    </div>
                  ) : null}

                  {item.settingsGate ? (
                    <div className="detail-line">
                      <strong>Settings Gate:</strong> {item.settingsGate}
                    </div>
                  ) : null}

                  {item.crossRefs?.length ? (
                    <div className="detail-line">
                      <strong>Cross Refs:</strong>{" "}
                      <span className="cross-ref-wrap">
                        {item.crossRefs.map((ref) => (
                          <button
                            key={`${item.id}-${ref.badge}-${ref.targetId}`}
                            type="button"
                            className="cross-ref-chip"
                            title={ref.tooltip}
                            onClick={() => onJump(ref.targetId)}
                          >
                            <span>{ref.badge}</span>
                            <span>{ref.label}</span>
                          </button>
                        ))}
                      </span>
                    </div>
                  ) : null}

                  {item.meta?.length ? (
                    <div className="detail-line">
                      <strong>Meta:</strong> {item.meta.join(" • ")}
                    </div>
                  ) : null}

                  {item.fileRefs.map((fileRef) => (
                    <div key={`${item.id}-${formatFileRef(fileRef)}`} className="detail-line">
                      <strong>Source:</strong> <code>{formatFileRef(fileRef)}</code>
                    </div>
                  ))}

                  {item.codeSource ? (
                    <div className="detail-line">
                      <strong>Prompt / Source View:</strong> Use the eye icon in the card header to inspect {getSourceViewLabel(item)}.
                    </div>
                  ) : null}
                </div>
              </div>
            </details>
          </div>
        </div>
      </div>
    </article>
  );
}

function GroupBlock({
  group,
  isOpen,
  openDetailIds,
  onToggleGroup,
  onToggleDetail,
  onOpenSource,
  onJump,
}: {
  group: RenderGroup;
  isOpen: boolean;
  openDetailIds: Set<string>;
  onToggleGroup: (groupId: string, open: boolean) => void;
  onToggleDetail: (itemId: string, open: boolean) => void;
  onOpenSource: (item: RenderItem) => void;
  onJump: (targetId: string) => void;
}) {
  const accentClass = TAG_META[group.items[0]?.tag ?? "code-logic"].className;

  return (
    <details
      id={group.id}
      className="tree-node"
      open={isOpen}
      data-nav-anchor="true"
      data-node-id={group.id}
      onToggle={(event) => onToggleGroup(group.id, event.currentTarget.open)}
    >
      <summary className={`folder-row ${isOpen ? "is-open" : ""}`.trim()}>
        <div className="folder-chevron">▶</div>
        <img className="folder-icon-image" src={FOLDER_ICON_DATA_URI} alt="" aria-hidden="true" />
        <span className="folder-copy">
          <span className={`folder-label ${accentClass}`}>{group.title}</span>
          <span className="folder-desc">— {group.description}</span>
        </span>
        <span className="folder-count">{group.items.length} blocks</span>
      </summary>

      <div className={`children ${isOpen ? "is-open" : ""}`.trim()}>
        {group.items.map((item) => (
          <FlowItemCard
            key={item.id}
            item={item}
            detailOpen={openDetailIds.has(item.id)}
            onToggleDetail={onToggleDetail}
            onOpenSource={onOpenSource}
            onJump={onJump}
          />
        ))}
      </div>
    </details>
  );
}

function PhaseBlock({
  phase,
  openGroupIds,
  openDetailIds,
  isOpen,
  onTogglePhase,
  onToggleGroup,
  onToggleDetail,
  onOpenSource,
  onJump,
}: {
  phase: RenderPhase;
  openGroupIds: Set<string>;
  openDetailIds: Set<string>;
  isOpen: boolean;
  onTogglePhase: (phaseId: string, open: boolean) => void;
  onToggleGroup: (groupId: string, open: boolean) => void;
  onToggleDetail: (itemId: string, open: boolean) => void;
  onOpenSource: (item: RenderItem) => void;
  onJump: (targetId: string) => void;
}) {
  return (
    <details
      id={phase.id}
      className="tree-node"
      open={isOpen}
      data-nav-anchor="true"
      data-node-id={phase.id}
      onToggle={(event) => onTogglePhase(phase.id, event.currentTarget.open)}
    >
      <summary className={`phase-summary ${isOpen ? "is-open" : ""}`.trim()}>
        <div className="phase-chevron">▶</div>
        <span className="phase-copy">
          <span className="phase-title">{phase.title}</span>
          <span className="phase-subtitle">— {phase.subtitle}</span>
        </span>
      </summary>

      <div className={`children ${isOpen ? "is-open" : ""}`.trim()}>
        {phase.groups.map((group) => (
          <GroupBlock
            key={group.id}
            group={group}
            isOpen={openGroupIds.has(group.id)}
            openDetailIds={openDetailIds}
            onToggleGroup={onToggleGroup}
            onToggleDetail={onToggleDetail}
            onOpenSource={onOpenSource}
            onJump={onJump}
          />
        ))}
      </div>
    </details>
  );
}

const ApiInspectorPage: React.FC = () => {
  const navigate = useNavigate();
  const [legendOpen, setLegendOpen] = useState(false);
  const [activeTargetId, setActiveTargetId] = useState<string | null>(ROOT_ID);
  const mainScrollRef = useRef<HTMLDivElement>(null);
  const navRailRef = useRef<HTMLDivElement>(null);

  const inspectorModel = useMemo(() => buildInspectorModel(), []);
  const { shells, anchorLookup, phaseIds } = inspectorModel;

  const [openPhaseIds, setOpenPhaseIds] = useState<Set<string>>(() => new Set(phaseIds));
  const [openGroupIds, setOpenGroupIds] = useState<Set<string>>(() => {
    const ids = new Set<string>();
    shells.forEach((shell) => {
      shell.phases.forEach((phase) => {
        phase.groups.forEach((group) => {
          ids.add(group.id);
        });
      });
    });
    return ids;
  });
  const [openDetailIds, setOpenDetailIds] = useState<Set<string>>(() => new Set());
  const [activePrompt, setActivePrompt] = useState<{ title: string; source: string; label: string } | null>(null);

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
        setActiveTargetId(bestId);
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

  useEffect(() => {
    const navRoot = navRailRef.current;
    if (!navRoot || !activeTargetId) return;
    const activeElement = navRoot.querySelector<HTMLElement>(`[data-nav-id="${CSS.escape(activeTargetId)}"]`);
    if (!activeElement) return;
    activeElement.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
  }, [activeTargetId]);

  const toggleOpenState = (setter: React.Dispatch<React.SetStateAction<Set<string>>>, id: string, open: boolean) => {
    setter((current) => {
      const next = new Set(current);
      if (open) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const jumpTo = (targetId: string) => {
    if (targetId === ROOT_ID) {
      setActiveTargetId(ROOT_ID);
    }

    const context = anchorLookup.get(targetId);
    if (context?.phaseId) {
      setOpenPhaseIds((current) => new Set(current).add(context.phaseId!));
    }
    if (context?.groupId) {
      setOpenGroupIds((current) => new Set(current).add(context.groupId!));
    }

    const nextActiveTarget =
      context?.kind === "item" ? context.groupId ?? context.phaseId ?? context.shellId : targetId;
    if (nextActiveTarget) {
      setActiveTargetId(nextActiveTarget);
    }

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const element = document.getElementById(targetId);
        if (!element) return;

        element.scrollIntoView({ behavior: "smooth", block: "center" });

        const flashTarget =
          element.querySelector<HTMLElement>(".api-call-section-header, .phase-summary, .folder-row, .app-card") ?? element;

        flashTarget.classList.remove("jump-target-flash");
        window.requestAnimationFrame(() => {
          flashTarget.classList.add("jump-target-flash");
          window.setTimeout(() => flashTarget.classList.remove("jump-target-flash"), 3000);
        });
      });
    });
  };

  return (
    <div className="api-inspector-page">
      <style>{pageStyles}</style>

      <div className="header">
        <button
          type="button"
          onClick={() => navigate("/?tab=admin&adminTool=style_guide")}
          className="p-2 text-[hsl(var(--ui-surface-2))] hover:bg-slate-100 rounded-full transition-colors"
          aria-label="Go back"
          title="Go back"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h1>API Inspector</h1>
        <button
          className="legend-toggle-btn"
          type="button"
          aria-expanded={legendOpen}
          aria-controls="legend"
          onClick={() => setLegendOpen((current) => !current)}
        >
          <span>{legendOpen ? "Hide Legend" : "View Legend"}</span>
        </button>
      </div>

      <div className="page-shell">
        <aside className="nav-rail-shell" aria-label="API inspector navigation">
          <div className="nav-rail-body" ref={navRailRef}>
            <button
              type="button"
              className={`nav-root-link nav-jump-link ${activeTargetId === ROOT_ID ? "active" : ""}`.trim()}
              data-nav-id={ROOT_ID}
              onClick={() => jumpTo(ROOT_ID)}
            >
              API Inspector
            </button>

            <div className="nav-section-stack">
              {shells.map((shell) => (
                <SectionNav key={shell.id} shell={shell} activeTargetId={activeTargetId} onJump={jumpTo} />
              ))}
            </div>
          </div>
        </aside>

        <main className="page-main">
          <div className="content" ref={mainScrollRef}>
            <Legend open={legendOpen} />

            <div id={ROOT_ID} data-nav-anchor="true" data-node-id={ROOT_ID}>
              <div className="api-call-stack">
                {shells.map((shell) => (
                  <section
                    key={shell.id}
                    className="api-call-section"
                    id={shell.id}
                    data-nav-anchor="true"
                    data-node-id={shell.id}
                  >
                    <div className="api-call-section-header">
                      <div className="api-call-section-meta">
                        <span className="tag-header api-call">{shell.kicker}</span>
                        <div className="api-call-section-copy">
                          <h2>{shell.title}</h2>
                          <p>{shell.subtitle}</p>
                        </div>
                      </div>
                    </div>

                    <div className="tree">
                      {shell.phases.map((phase) => (
                        <PhaseBlock
                          key={phase.id}
                          phase={phase}
                          openGroupIds={openGroupIds}
                          openDetailIds={openDetailIds}
                          isOpen={openPhaseIds.has(phase.id)}
                          onTogglePhase={(phaseId, open) => toggleOpenState(setOpenPhaseIds, phaseId, open)}
                          onToggleGroup={(groupId, open) => toggleOpenState(setOpenGroupIds, groupId, open)}
                          onToggleDetail={(itemId, open) => toggleOpenState(setOpenDetailIds, itemId, open)}
                          onOpenSource={(item) =>
                            setActivePrompt({
                              title: item.title,
                              source: item.codeSource ?? "",
                              label: item.codeSourceLabel ?? (item.promptViewEnabled ? "Prompt / Source View" : "Source Snapshot"),
                            })
                          }
                          onJump={jumpTo}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {activePrompt ? (
        <div
          className="code-modal-overlay open"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setActivePrompt(null);
            }
          }}
        >
          <div className="code-modal" role="dialog" aria-modal="true" aria-labelledby="api-inspector-prompt-title">
            <div className="code-modal-header">
              <div className="code-modal-copy">
                <span className="code-modal-kicker">{activePrompt.label}</span>
                <span id="api-inspector-prompt-title">{activePrompt.title}</span>
              </div>
              <button type="button" className="code-modal-close" onClick={() => setActivePrompt(null)}>
                Close
              </button>
            </div>
            <div className="code-modal-body">
              <pre>{activePrompt.source}</pre>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ApiInspectorPage;
