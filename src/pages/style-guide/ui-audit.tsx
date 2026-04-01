import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CHANGE_LOG_SEVERITY,
  CHANGE_LOG_STATUS,
  QUALITY_CONFIDENCE,
  QUALITY_DOMAINS,
  QUALITY_FINDING_STATUS,
  QUALITY_SEVERITIES,
  QUALITY_VERIFICATION_STATUS,
  QualityAgent,
  QualityFinding,
  QualityHubRegistry,
  ChangeLogEntry,
  ChangeLogSeverity,
  ChangeLogStatus,
  isQualityHubRegistry,
  makeAgentId,
} from "@/lib/ui-audit-schema";
import {
  countByDomain,
  countBySeverity,
  countByStatus,
  groupFindingsBy,
  mergeRegistries,
  newId,
  sortFindings,
  summarizeRun,
  toCompactIso,
} from "@/lib/ui-audit-utils";
import {
  qualityHubDefaultAgent,
  qualityHubInitialRegistry,
} from "@/data/ui-audit-findings";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

const STORAGE_KEY = "chronicle-quality-hub-v1";

const DOMAIN_LABELS: Record<string, string> = {
  "ui-ux": "UI/UX Design",
  "functionality": "Functionality",
  "orphan-code": "Orphan / Dead Code",
  "cleanup": "Cleanup",
  "accessibility": "Accessibility",
  "performance": "Performance",
  "security": "Security",
  "tests": "Tests",
  "build": "Build",
  "data-integrity": "Data Integrity",
  "documentation": "Documentation",
};

function titleCase(s: string): string {
  return s.replace(/(^|-)(\w)/g, (_, _sep, c) => ` ${c.toUpperCase()}`).trim();
}

function domainLabel(key: string): string {
  return DOMAIN_LABELS[key] ?? titleCase(key);
}
type GroupBy = "severity" | "domain" | "status" | "page" | "component" | "agent";
type HubViewId = "overview" | "findings" | "runs" | "changelog";

const panelOuterClass = "rounded-[24px] overflow-hidden border-none bg-[#2a2a2f] shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50),inset_1px_1px_0_rgba(255,255,255,0.09),inset_-1px_-1px_0_rgba(0,0,0,0.35)]";
const panelHeaderClass = "relative overflow-hidden border-t border-[rgba(255,255,255,0.20)] bg-[linear-gradient(180deg,#5a7292_0%,#4a5f7f_100%)] px-5 py-3 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.30)]";
const panelHeaderOverlayClass = "pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.07)_0%,rgba(255,255,255,0.00)_30%)]";
const panelBodyClass = "p-4 md:p-5";
const panelInnerClass = "rounded-2xl border-none bg-[#2e2e33] p-4 shadow-[inset_1px_1px_0_rgba(255,255,255,0.05),inset_-1px_-1px_0_rgba(0,0,0,0.45)]";
const recessedBlockClass = "rounded-2xl border border-[rgba(255,255,255,0.05)] bg-[#1c1c1f] shadow-[inset_0_3px_10px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.05)]";
const recessedStripClass = "rounded-xl border border-[rgba(255,255,255,0.05)] bg-[#1c1c1f] shadow-[inset_0_2px_8px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.05)]";
const inputClass = "w-full rounded-lg border-none border-t border-[rgba(0,0,0,0.35)] bg-[#1c1c1f] px-3 py-2 text-sm text-white placeholder:text-[#52525b] outline-none focus:shadow-[0_0_0_2px_rgba(59,130,246,0.25)]";
const selectClass = "w-full rounded-lg border-none border-t border-[rgba(0,0,0,0.35)] bg-[#1c1c1f] px-2 py-2 text-sm text-white outline-none focus:shadow-[0_0_0_2px_rgba(59,130,246,0.25)]";
const subtleButtonClass = "rounded-xl border-none bg-[#3c3e47] px-4 py-2 text-xs font-bold text-[#eaedf1] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] transition hover:brightness-110";
const neutralButtonClass = "rounded-xl border-none bg-[#2f3137] px-4 py-2 text-xs font-bold text-[#eaedf1] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] transition hover:brightness-110";

const HUB_VIEWS: Array<{ id: HubViewId; label: string; description: string }> = [
  { id: "overview", label: "Overview", description: "Scan and coverage progress" },
  { id: "findings", label: "Issue Registry", description: "Detailed issue ledger" },
  { id: "runs", label: "Scan Runs", description: "Run history and agent setup" },
  { id: "changelog", label: "Change Log", description: "Development change history and fix log" },
];

const RESOLVED_FINDING_STATUSES = new Set<QualityFinding["status"]>(["fixed", "verified"]);
const OPEN_FINDING_STATUSES = new Set<QualityFinding["status"]>(["open", "in-progress"]);

type ScanCatalogRow = {
  id: string;
  label: string;
  description: string;
  moduleIds: string[];
  domainHints: QualityFinding["domain"][];
};

type ScanCatalogSection = {
  id: string;
  title: string;
  description: string;
  matchPages?: string[];
  rowIds: string[];
};

type ScanCatalogRowSummary = ScanCatalogRow & {
  findingIds: string[];
  issuesFound: number;
  openIssues: number;
  resolvedIssues: number;
  lastScanAt: string | null;
  daysSinceLastScan: number | null;
  checks: string[];
  logTargets: string[];
  moduleNames: string[];
};

type ScanCatalogSectionSummary = ScanCatalogSection & {
  rows: ScanCatalogRowSummary[];
  sectionIssuesFound: number;
  sectionOpenIssues: number;
};

const MODULE_DOMAIN_HINTS: Record<string, QualityFinding["domain"][]> = {
  "module-ui-ux": ["ui-ux"],
  "module-functionality": ["functionality"],
  "module-orphan-code": ["orphan-code"],
  "module-cleanup": ["cleanup"],
  "module-accessibility": ["accessibility"],
  "module-performance": ["performance"],
  "module-security": ["security"],
  "module-security-auth-access-control": ["security"],
  "module-security-encryption-data-protection": ["security"],
  "module-security-secrets-key-management": ["security"],
  "module-security-storage-policies": ["security"],
  "module-security-client-xss-injection": ["security"],
  "module-security-api-rate-limit-abuse": ["security"],
  "module-security-data-visibility": ["security"],
  "module-security-monitoring-incident-readiness": ["security"],
  "module-tests": ["tests"],
  "module-build": ["build"],
  "module-data-integrity": ["data-integrity"],
  "module-docs": ["documentation"],
  "module-runtime-smoke": ["functionality", "build", "performance"],
  "module-validation-gates": ["build", "tests", "security"],
  "module-startup-auth-boot": ["functionality", "performance", "security"],
  "module-app-guide-integrity": ["documentation"],
  "module-app-architecture-integrity": ["documentation"],
  "module-api-inspector-integrity": ["data-integrity", "documentation", "functionality"],
};

const SCAN_CATALOG_ROWS: Record<string, ScanCatalogRow> = {
  "app-guide-doc": {
    id: "app-guide-doc",
    label: "App Guide Documentation Consistency",
    description: "Checks that each long-form App Guide document still matches live routes, file ownership, and behavior descriptions.",
    moduleIds: ["module-app-guide-integrity", "module-docs"],
    domainHints: ["documentation"],
  },
  "app-architecture-doc": {
    id: "app-architecture-doc",
    label: "App Architecture Documentation Consistency",
    description: "Verifies folder/file/component ownership in the App Architecture map still matches the live repo structure.",
    moduleIds: ["module-app-architecture-integrity", "module-docs"],
    domainHints: ["documentation"],
  },
  "api-inspector-doc": {
    id: "api-inspector-doc",
    label: "API Inspector Map Consistency",
    description: "Cross-checks API Inspector flow mapping against real prompt assembly, payload fields, and runtime behavior.",
    moduleIds: ["module-api-inspector-integrity", "module-data-integrity", "module-docs"],
    domainHints: ["data-integrity", "documentation", "functionality"],
  },
  "quick-stability": {
    id: "quick-stability",
    label: "Quick Stability Sweep",
    description: "Fast safety pass for navigation/runtime health, startup/auth bootstrap behavior, and validation gate sanity.",
    moduleIds: ["module-runtime-smoke", "module-startup-auth-boot", "module-validation-gates"],
    domainHints: ["functionality", "build", "performance", "security", "tests"],
  },
  "pre-push-full": {
    id: "pre-push-full",
    label: "Pre-Push Full Sweep",
    description: "Deep release pass across UI quality, behavior correctness, dead code, cleanup, accessibility, data integrity, security, and tests.",
    moduleIds: [
      "module-ui-ux",
      "module-functionality",
      "module-orphan-code",
      "module-cleanup",
      "module-accessibility",
      "module-performance",
      "module-security",
      "module-tests",
      "module-build",
      "module-data-integrity",
      "module-docs",
      "module-runtime-smoke",
      "module-validation-gates",
      "module-startup-auth-boot",
    ],
    domainHints: QUALITY_DOMAINS,
  },
  "security-deep": {
    id: "security-deep",
    label: "Security Deep Sweep",
    description: "Focused security pass on authorization, key handling, storage policy scope, XSS surface, abuse controls, and incident readiness.",
    moduleIds: [
      "module-security",
      "module-security-auth-access-control",
      "module-security-encryption-data-protection",
      "module-security-secrets-key-management",
      "module-security-storage-policies",
      "module-security-client-xss-injection",
      "module-security-api-rate-limit-abuse",
      "module-security-data-visibility",
      "module-security-monitoring-incident-readiness",
      "module-validation-gates",
    ],
    domainHints: ["security", "build"],
  },
  "ui-ux": {
    id: "ui-ux",
    label: "UI/UX and Design System",
    description: "Finds visual inconsistency, token drift, responsive layout regressions, and state-style mismatch.",
    moduleIds: ["module-ui-ux"],
    domainHints: ["ui-ux"],
  },
  functionality: {
    id: "functionality",
    label: "Functionality and Behavior Bugs",
    description: "Finds broken flows, state desync, non-working controls, and behavior regressions.",
    moduleIds: ["module-functionality"],
    domainHints: ["functionality"],
  },
  orphan: {
    id: "orphan",
    label: "Orphan / Dead Code",
    description: "Finds unreferenced components/utilities and stale code paths that increase maintenance risk.",
    moduleIds: ["module-orphan-code"],
    domainHints: ["orphan-code"],
  },
  cleanup: {
    id: "cleanup",
    label: "Code Cleanup Candidates",
    description: "Finds near-duplicate logic, one-off patterns, and consolidation opportunities.",
    moduleIds: ["module-cleanup"],
    domainHints: ["cleanup"],
  },
  accessibility: {
    id: "accessibility",
    label: "Accessibility",
    description: "Checks labels, keyboard reachability, focus states, contrast, and reflow behavior.",
    moduleIds: ["module-accessibility"],
    domainHints: ["accessibility"],
  },
  performance: {
    id: "performance",
    label: "Performance",
    description: "Checks initial load strategy, rerender hotspots, large assets, and bundle pressure risks.",
    moduleIds: ["module-performance"],
    domainHints: ["performance"],
  },
  "data-integrity": {
    id: "data-integrity",
    label: "Data and API Integrity",
    description: "Checks schema/key drift, payload mapping, import/export durability, and AI pipeline data continuity.",
    moduleIds: ["module-data-integrity"],
    domainHints: ["data-integrity"],
  },
  "build-health": {
    id: "build-health",
    label: "Build / Type / Lint / Test Health",
    description: "Runs repository health gates (`lint`, `typecheck`, `test`, `build`, dependency audit`) and logs deltas.",
    moduleIds: ["module-build", "module-tests", "module-validation-gates"],
    domainHints: ["build", "tests", "security"],
  },
};

const PAGE_SCAN_ROW_IDS = [
  "app-guide-doc",
  "app-architecture-doc",
  "quick-stability",
  "pre-push-full",
  "security-deep",
  "ui-ux",
  "functionality",
  "orphan",
  "cleanup",
  "accessibility",
] as const;

const SCAN_CATALOG_SECTIONS: ScanCatalogSection[] = [
  {
    id: "global",
    title: "Global Systems",
    description: "Cross-app scans for shared architecture, startup behavior, build/test gates, and security baseline.",
    rowIds: [
      "app-guide-doc",
      "app-architecture-doc",
      "api-inspector-doc",
      "quick-stability",
      "pre-push-full",
      "security-deep",
      "ui-ux",
      "functionality",
      "orphan",
      "cleanup",
      "accessibility",
      "performance",
      "data-integrity",
      "build-health",
    ],
  },
  { id: "community-gallery", title: "Community Gallery", description: "Page-level scans for Community Gallery UX, behavior, and content integrity.", matchPages: ["Community Gallery"], rowIds: [...PAGE_SCAN_ROW_IDS] },
  { id: "your-stories", title: "Your Stories", description: "Page-level scans for Story Hub/Your Stories list behavior and presentation.", matchPages: ["Your Stories"], rowIds: [...PAGE_SCAN_ROW_IDS] },
  { id: "character-library", title: "Character Library", description: "Page-level scans for character browsing/select flows and interaction integrity.", matchPages: ["Character Library"], rowIds: [...PAGE_SCAN_ROW_IDS] },
  { id: "image-library", title: "Image Library", description: "Page-level scans for image upload/folder/tag flows, storage policy impact, and UI behavior.", matchPages: ["Image Library"], rowIds: [...PAGE_SCAN_ROW_IDS] },
  { id: "chat-history", title: "Chat History", description: "Page-level scans for conversation listing, retrieval, and metadata consistency.", matchPages: ["Chat History"], rowIds: [...PAGE_SCAN_ROW_IDS] },
  {
    id: "story-builder",
    title: "Story Builder",
    description: "Page-level scans for world-building controls, data contracts, and section-level behavior stability.",
    matchPages: ["Story Builder"],
    rowIds: [...PAGE_SCAN_ROW_IDS, "performance", "data-integrity", "build-health"],
  },
  {
    id: "character-builder",
    title: "Character Builder",
    description: "Page-level scans for character section controls, AI-enhance wiring, and persistence integrity.",
    matchPages: ["Character Builder"],
    rowIds: [...PAGE_SCAN_ROW_IDS, "performance", "data-integrity", "build-health"],
  },
  {
    id: "chat-interface",
    title: "Chat Interface",
    description: "Page-level scans for runtime dialogue behavior, state sync, and high-frequency interaction reliability.",
    matchPages: ["Chat Interface"],
    rowIds: [...PAGE_SCAN_ROW_IDS, "performance", "data-integrity", "build-health"],
  },
  {
    id: "admin-panel",
    title: "Admin Panel",
    description: "Page-level scans for admin tooling safety, navigation consistency, and operational controls.",
    matchPages: ["Admin"],
    rowIds: [...PAGE_SCAN_ROW_IDS, "performance", "data-integrity", "build-health"],
  },
  {
    id: "api-inspector-tool",
    title: "Admin Tool: API Inspector",
    description: "Tool-specific scans for prompt/payload architecture map correctness and runtime parity.",
    matchPages: ["API Inspector"],
    rowIds: ["api-inspector-doc", "quick-stability", "security-deep", "functionality", "data-integrity", "build-health"],
  },
  {
    id: "app-guide-tool",
    title: "Admin Tool: App Guide",
    description: "Tool-specific scans for long-form system docs freshness and route/component/source-truth alignment.",
    matchPages: ["Admin", "Quality Hub"],
    rowIds: ["app-guide-doc", "quick-stability", "pre-push-full", "build-health"],
  },
  {
    id: "app-architecture-tool",
    title: "Admin Tool: App Architecture",
    description: "Tool-specific scans ensuring visual architecture map matches current repo ownership and component boundaries.",
    matchPages: ["Admin", "Quality Hub"],
    rowIds: ["app-architecture-doc", "quick-stability", "pre-push-full", "build-health"],
  },
  {
    id: "finance-dashboard-tool",
    title: "Admin Tool: Finance Dashboard",
    description: "Tool-specific scans for finance UX, role safety, data integrity, and operational metrics health as implementation expands.",
    matchPages: ["Finance Dashboard"],
    rowIds: [
      "quick-stability",
      "pre-push-full",
      "security-deep",
      "ui-ux",
      "functionality",
      "cleanup",
      "accessibility",
      "performance",
      "data-integrity",
      "build-health",
    ],
  },
];

const severityBadgeClass: Record<string, string> = {
  critical: "bg-[#2f3137] text-[#eaedf1] border border-[#dc2626]",
  high: "bg-[#2f3137] text-[#eaedf1] border border-[#f59e0b]",
  medium: "bg-[#2f3137] text-[#eaedf1] border border-[#3b82f6]",
  low: "bg-[#2f3137] text-[#a5f3fc] border border-[#22B8C9]",
  stylistic: "bg-[#3f3f46] text-[#eaedf1] border border-[rgba(255,255,255,0.20)]",
};
function cloneInitialRegistry(): QualityHubRegistry {
  return JSON.parse(JSON.stringify(qualityHubInitialRegistry)) as QualityHubRegistry;
}

/** Upgrade persisted registry to code-defined seed when seed version changes. */
function upgradeRegistry(persisted: QualityHubRegistry): QualityHubRegistry {
  const seed = qualityHubInitialRegistry;
  const currentVersion = seed.meta.registryVersion ?? 0;
  const persistedVersion = persisted.meta?.registryVersion ?? 0;

  if (persistedVersion >= currentVersion) return persisted;

  // Preserve user-managed findings/runs/changelog while upgrading code-owned structure.
  const merged = mergeRegistries(seed, persisted);
  return {
    ...merged,
    meta: {
      ...merged.meta,
      version: seed.meta.version,
      registryVersion: currentVersion,
      project: persisted.meta?.project || seed.meta.project,
      createdAt: persisted.meta?.createdAt || seed.meta.createdAt,
      lastUpdatedAt: new Date().toISOString(),
      lastRunId: persisted.meta?.lastRunId || merged.meta.lastRunId || seed.meta.lastRunId,
    },
  };
}
function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}
function formatShortDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function formatShortDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
function downloadJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
function getAgentList(registry: QualityHubRegistry): QualityAgent[] {
  const map = new Map<string, QualityAgent>();
  registry.runs.forEach((run) => map.set(run.agent.id, run.agent));
  registry.findings.forEach((f) => { map.set(f.foundBy.agent.id, f.foundBy.agent); f.contributors.forEach((a) => map.set(a.id, a)); });
  if (!map.has(qualityHubDefaultAgent.id)) map.set(qualityHubDefaultAgent.id, qualityHubDefaultAgent);
  return Array.from(map.values()).sort((a, b) => a.agentName.localeCompare(b.agentName));
}
function nextRegistryWithTimestamp(registry: QualityHubRegistry): QualityHubRegistry {
  return { ...registry, meta: { ...registry.meta, lastUpdatedAt: new Date().toISOString() } };
}
function buildQualityHubTransferPackage(snapshot: QualityHubRegistry) {
  return { packageType: "chronicle-quality-hub-transfer", packageVersion: 1, exportedAt: new Date().toISOString(), registry: snapshot };
}

function Section({ title, children, badge }: { title: string; children: React.ReactNode; badge?: React.ReactNode }) {
  return (
    <section className={panelOuterClass}>
      <div className={panelHeaderClass}><div className={panelHeaderOverlayClass} /><div className="relative z-10 flex items-center justify-between w-full"><h2 className="text-[20px] font-semibold tracking-tight text-white">{title}</h2>{badge && <span>{badge}</span>}</div></div>
      <div className={panelBodyClass}><div className={panelInnerClass}>{children}</div></div>
    </section>
  );
}
function MetricCard({ label, value, tone = "default" }: { label: string; value: React.ReactNode; tone?: "default" | "danger" | "success" }) {
  const valueClass = tone === "danger" ? "text-[#ef4444]" : tone === "success" ? "text-[#a5f3fc]" : "text-white";
  return (<div className={cn(recessedBlockClass, "p-3")}><div className="text-[11px] font-black uppercase tracking-[0.1em] text-[#a1a1aa]">{label}</div><div className={cn("mt-1 text-2xl font-black", valueClass)}>{value}</div></div>);
}

function ChevronToggleButton({
  expanded,
  onToggle,
  label,
}: {
  expanded: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      title={label}
      className="inline-flex items-center justify-center p-0 m-0 h-auto w-auto bg-transparent border-0 rounded-none shadow-none text-white hover:text-white/85 transition-colors appearance-none"
    >
      <ChevronDown size={20} strokeWidth={2.6} className={cn("transition-transform duration-200", expanded && "rotate-180")} />
    </button>
  );
}

const changeLogSeverityBadge: Record<string, string> = {
  patch: "bg-[#2f3137] text-[#eaedf1] border border-[#3b82f6]",
  fix: "bg-[#2f3137] text-[#eaedf1] border border-[#f59e0b]",
  refactor: "bg-[#2f3137] text-[#a5f3fc] border border-[#22B8C9]",
  feature: "bg-[#2f3137] text-[#eaedf1] border border-[#8b5cf6]",
  breaking: "bg-[#2f3137] text-[#eaedf1] border border-[#dc2626]",
};
const changeLogStatusBadge: Record<string, string> = {
  planned: "bg-[#4a5f7f] text-[#eaedf1]",
  "in-progress": "bg-[#2f3137] text-[#a5f3fc] border border-[#3b82f6]",
  completed: "bg-[#166534] text-white",
};

function ChangeLogEntryCard({
  entry,
  onUpdateStatus,
  onAddComment,
}: {
  entry: ChangeLogEntry;
  onUpdateStatus?: (id: string, status: ChangeLogStatus) => void;
  onAddComment?: (id: string) => void;
}) {
  return (
    <details className={cn(recessedBlockClass, "group open:ring-1 open:ring-[#4a5f7f]/60")}>
      <summary className="cursor-pointer list-none px-4 py-3 relative">
        <div className="absolute top-3 right-10 text-[10px] font-semibold text-[#71717a] tracking-wide">
          {formatShortDateTime(entry.updatedAt)}
        </div>
        <div className="flex flex-wrap items-start gap-2 pr-8">
          <span className={cn("rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em]", changeLogSeverityBadge[entry.severity] || changeLogSeverityBadge.fix)}>{entry.severity}</span>
          <span className={cn("rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em]", changeLogStatusBadge[entry.status] || changeLogStatusBadge.completed)}>{entry.status}</span>
          <span className="rounded-full bg-[#4a5f7f] px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#eaedf1]">{entry.agent}</span>
        </div>
        <div className="mt-2 text-sm font-bold text-white">{entry.title}</div>
        {entry.summary && <div className="mt-1 text-xs text-[#a1a1aa]">{entry.summary}</div>}
        <ChevronDown size={16} className="absolute bottom-3 right-4 text-[#71717a] transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t border-[rgba(255,255,255,0.05)] px-4 py-4 space-y-5">
        {entry.problem && (
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#a1a1aa] mb-2">Problem</div>
            <div className="text-xs text-[#a1a1aa] whitespace-pre-wrap">{entry.problem}</div>
          </div>
        )}
        {entry.plan && (
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#a1a1aa] mb-2">Plan</div>
            <div className="text-xs text-[#a1a1aa] whitespace-pre-wrap">{entry.plan}</div>
          </div>
        )}
        {entry.changes && (
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#a1a1aa] mb-2">Changes Made</div>
            <div className="text-xs text-[#a1a1aa] whitespace-pre-wrap">{entry.changes}</div>
          </div>
        )}
        {entry.filesAffected.length > 0 && (
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#a1a1aa] mb-2">Files Affected</div>
            <div className="space-y-0.5">
              {entry.filesAffected.map((filePath) => (
                <div key={filePath} className="font-mono text-[11px] text-[#a1a1aa]">
                  {filePath}
                </div>
              ))}
            </div>
          </div>
        )}
        {entry.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {entry.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-[#4a5f7f]/30 px-2 py-0.5 text-[10px] font-bold text-[#eaedf1]">
                {tag}
              </span>
            ))}
          </div>
        )}
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#a1a1aa] mb-2">Metadata</div>
          <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2 text-xs text-[#a1a1aa]">
            <div><span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#eaedf1]">Created</span> {formatDate(entry.createdAt)}</div>
            <div><span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#eaedf1]">Updated</span> {formatDate(entry.updatedAt)}</div>
            <div><span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#eaedf1]">Agent</span> {entry.agent}</div>
            {entry.relatedFindingIds.length > 0 && <div><span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#eaedf1]">Related Issues</span> {entry.relatedFindingIds.join(", ")}</div>}
            {(entry.relatedRunIds ?? []).length > 0 && <div><span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#eaedf1]">Related Runs</span> {(entry.relatedRunIds ?? []).join(", ")}</div>}
          </div>
        </div>
        {onUpdateStatus && onAddComment && (
          <div className="grid gap-2 md:grid-cols-2">
            <select value={entry.status} onChange={(event) => onUpdateStatus(entry.id, event.target.value as ChangeLogStatus)} className={selectClass}>
              {CHANGE_LOG_STATUS.map((statusOption) => <option key={statusOption} value={statusOption}>{statusOption}</option>)}
            </select>
            <button type="button" onClick={() => onAddComment(entry.id)} className={neutralButtonClass}>Add Comment</button>
          </div>
        )}
        {entry.comments.length > 0 && (
          <div className="mt-3 space-y-2 rounded-lg border border-[rgba(255,255,255,0.05)] bg-[#1c1c1f] p-3">
            {entry.comments.map((comment) => (
              <div key={comment.id} className={cn(recessedStripClass, "px-2 py-2 text-xs text-[#a1a1aa]")}>
                <div className="font-bold text-[#eaedf1]">{comment.author}</div>
                <div className="text-[10px] text-[#71717a]">{formatDate(comment.timestamp)}</div>
                <div className="mt-1">{comment.text}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </details>
  );
}

function QualityHubHowToModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className={cn(panelOuterClass, "w-full max-w-4xl max-h-[85vh] overflow-hidden")}>
        <div className={panelHeaderClass}>
          <div className={panelHeaderOverlayClass} />
          <div className="relative z-10 flex items-center justify-between gap-4">
            <h2 className="text-[20px] font-semibold tracking-tight text-white">Quality Hub: How to Use</h2>
            <button type="button" onClick={onClose} className={neutralButtonClass}>
              Close
            </button>
          </div>
        </div>
        <div className={cn(panelBodyClass, "overflow-y-auto max-h-[calc(85vh-70px)]")}>
          <div className="space-y-4 text-sm text-[#c7c9cf]">
            <div className={cn(recessedBlockClass, "p-4")}>
              <div className="text-[11px] font-black uppercase tracking-[0.16em] text-[#a1a1aa] mb-2">Workflow</div>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Run or log a scan in <strong className="text-white">Scan Runs</strong>.</li>
                <li>Create/update issue records in <strong className="text-white">Issue Registry</strong>.</li>
                <li>Document implementation in <strong className="text-white">Change Log</strong>.</li>
                <li>Cross-link IDs across all three areas for traceability.</li>
              </ol>
            </div>
            <div className={cn(recessedBlockClass, "p-4")}>
              <div className="text-[11px] font-black uppercase tracking-[0.16em] text-[#a1a1aa] mb-2">Canonical Logging Rules</div>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong className="text-white">Issue Registry</strong>: diagnosis, severity, evidence, and lifecycle status.</li>
                <li><strong className="text-white">Scan Runs</strong>: who scanned, when, scope used, and output summary.</li>
                <li><strong className="text-white">Change Log</strong>: what was changed in code/config/content and why.</li>
                <li>Never mark an issue solved without a linked change entry and verification note.</li>
              </ul>
            </div>
            <div className={cn(recessedBlockClass, "p-4")}>
              <div className="text-[11px] font-black uppercase tracking-[0.16em] text-[#a1a1aa] mb-2">Agent Instructions</div>
              <ul className="list-disc pl-5 space-y-1">
                <li>Follow each module checklist in Overview exactly; do not free-form scope.</li>
                <li>For every finding, include route/component/file evidence before proposing fixes.</li>
                <li>If uncertain, log as likely and document uncertainty in evidence.</li>
                <li>When implementing, add a Change Log entry with files touched and expected outcome.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChangeLogView({
  registry,
  updateRegistry,
  onAddComment,
  onUpdateStatus,
}: {
  registry: QualityHubRegistry;
  updateRegistry: (fn: (p: QualityHubRegistry) => QualityHubRegistry) => void;
  onAddComment: (id: string) => void;
  onUpdateStatus: (id: string, status: ChangeLogStatus) => void;
}) {
  const [clSearch, setClSearch] = useState("");
  const [clSeverity, setClSeverity] = useState<"all" | ChangeLogSeverity>("all");
  const [clStatus, setClStatus] = useState<"all" | ChangeLogStatus>("all");
  const [clAgent, setClAgent] = useState<string>("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [draft, setDraft] = useState<Partial<ChangeLogEntry>>({ severity: "fix", status: "completed", agent: "Lovable" });

  const entries = useMemo(() => {
    const list = registry.changeLog || [];
    const term = clSearch.trim().toLowerCase();
    return list.filter((e) => {
      if (clSeverity !== "all" && e.severity !== clSeverity) return false;
      if (clStatus !== "all" && e.status !== clStatus) return false;
      if (clAgent !== "all" && e.agent !== clAgent) return false;
      if (!term) return true;
      return [e.title, e.summary, e.problem, e.plan, e.changes, e.agent, ...e.filesAffected, ...e.tags].filter(Boolean).join(" ").toLowerCase().includes(term);
    });
  }, [registry.changeLog, clSearch, clSeverity, clStatus, clAgent]);

  const agents = useMemo(() => {
    const set = new Set<string>();
    (registry.changeLog || []).forEach((e) => set.add(e.agent));
    return Array.from(set).sort();
  }, [registry.changeLog]);

  const handleAdd = () => {
    if (!draft.title?.trim()) return;
    const now = new Date().toISOString();
    const entry: ChangeLogEntry = {
      id: `cl-${Math.random().toString(36).slice(2, 10)}`,
      title: draft.title?.trim() || "",
      summary: draft.summary?.trim() || "",
      severity: draft.severity as ChangeLogSeverity || "fix",
      status: draft.status as ChangeLogStatus || "completed",
      problem: draft.problem?.trim() || "",
      plan: draft.plan?.trim() || "",
      changes: draft.changes?.trim() || "",
      filesAffected: (draft.filesAffected || []).filter(Boolean),
      agent: draft.agent?.trim() || "Lovable",
      relatedFindingIds: [],
      tags: (draft.tags || []).filter(Boolean),
      comments: [],
      createdAt: now,
      updatedAt: now,
    };
    updateRegistry((p) => ({ ...p, changeLog: [entry, ...(p.changeLog || [])] }));
    setDraft({ severity: "fix", status: "completed", agent: "Lovable" });
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      <Section title="Change Log" badge={
        <button type="button" onClick={() => setShowAddForm(!showAddForm)} className={subtleButtonClass}>{showAddForm ? "Cancel" : "+ Add Entry"}</button>
      }>
        <div className="space-y-4">
          {/* Add form */}
          {showAddForm && (
            <div className={cn(recessedBlockClass, "p-4 space-y-3")}>
              <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#a1a1aa] mb-2">New Change Log Entry</div>
              <input value={draft.title || ""} onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))} placeholder="Title (e.g. Fix chat layout breakpoint)" className={inputClass} />
              <input value={draft.summary || ""} onChange={(e) => setDraft((p) => ({ ...p, summary: e.target.value }))} placeholder="Summary (e.g. Chat Interface · Layout fix)" className={inputClass} />
              <div className="grid gap-2 md:grid-cols-3">
                <select value={draft.severity || "fix"} onChange={(e) => setDraft((p) => ({ ...p, severity: e.target.value as ChangeLogSeverity }))} className={selectClass}>
                  {CHANGE_LOG_SEVERITY.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={draft.status || "completed"} onChange={(e) => setDraft((p) => ({ ...p, status: e.target.value as ChangeLogStatus }))} className={selectClass}>
                  {CHANGE_LOG_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <input value={draft.agent || ""} onChange={(e) => setDraft((p) => ({ ...p, agent: e.target.value }))} placeholder="Agent (Lovable, Codex, Manual...)" className={inputClass} />
              </div>
              <textarea value={draft.problem || ""} onChange={(e) => setDraft((p) => ({ ...p, problem: e.target.value }))} placeholder="Problem — what was wrong?" className={cn(inputClass, "min-h-[60px]")} />
              <textarea value={draft.plan || ""} onChange={(e) => setDraft((p) => ({ ...p, plan: e.target.value }))} placeholder="Plan — proposed fix" className={cn(inputClass, "min-h-[60px]")} />
              <textarea value={draft.changes || ""} onChange={(e) => setDraft((p) => ({ ...p, changes: e.target.value }))} placeholder="Changes — what was actually done" className={cn(inputClass, "min-h-[60px]")} />
              <input value={(draft.filesAffected || []).join(", ")} onChange={(e) => setDraft((p) => ({ ...p, filesAffected: e.target.value.split(",").map((s) => s.trim()) }))} placeholder="Files affected (comma-separated)" className={inputClass} />
              <input value={(draft.tags || []).join(", ")} onChange={(e) => setDraft((p) => ({ ...p, tags: e.target.value.split(",").map((s) => s.trim()) }))} placeholder="Tags (comma-separated)" className={inputClass} />
              <button type="button" onClick={handleAdd} className={subtleButtonClass}>Save Entry</button>
            </div>
          )}
          {/* Filters */}
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            <input value={clSearch} onChange={(e) => setClSearch(e.target.value)} placeholder="Search change log..." className={cn("xl:col-span-1", inputClass)} />
            <select value={clSeverity} onChange={(e) => setClSeverity(e.target.value as typeof clSeverity)} className={selectClass}>
              <option value="all">All types</option>{CHANGE_LOG_SEVERITY.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={clStatus} onChange={(e) => setClStatus(e.target.value as typeof clStatus)} className={selectClass}>
              <option value="all">All statuses</option>{CHANGE_LOG_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={clAgent} onChange={(e) => setClAgent(e.target.value)} className={selectClass}>
              <option value="all">All agents</option>{agents.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className={cn(recessedStripClass, "p-2 text-xs text-[#eaedf1]")}><span className="font-bold text-white">{entries.length}</span> entries</div>
        </div>
      </Section>

      {entries.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-[#71717a] bg-[linear-gradient(to_bottom_right,#27272a,#18181b)] px-4 py-10 text-center text-sm text-[#a1a1aa]">No change log entries yet. Click "+ Add Entry" to start logging changes.</div>
      ) : (
        <Section title="Entries">
          <div className="space-y-2">
            {entries.map((entry) => (
              <ChangeLogEntryCard
                key={entry.id}
                entry={entry}
                onUpdateStatus={onUpdateStatus}
                onAddComment={onAddComment}
              />
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

export default function UiAuditPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialLoadDone = useRef(false);

  const [registry, setRegistry] = useState<QualityHubRegistry>(() => {
    if (typeof window === "undefined") return cloneInitialRegistry();
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return cloneInitialRegistry();
      const parsed = JSON.parse(raw);
      if (!isQualityHubRegistry(parsed)) return cloneInitialRegistry();
      return upgradeRegistry(parsed);
    } catch { return cloneInitialRegistry(); }
  });
  const [activeView, setActiveView] = useState<HubViewId>("overview");
  const [search, setSearch] = useState("");
  const [groupBy, setGroupBy] = useState<GroupBy>("domain");
  const [severityFilter, setSeverityFilter] = useState<"all" | QualityFinding["severity"]>("all");
  const [domainFilter, setDomainFilter] = useState<"all" | QualityFinding["domain"]>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | QualityFinding["status"]>("all");
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [importFeedback, setImportFeedback] = useState<string>("");
  const [agentDraft, setAgentDraft] = useState<QualityAgent>(qualityHubDefaultAgent);
  const [showHowToUse, setShowHowToUse] = useState(false);
  const [expandedResolvedGroups, setExpandedResolvedGroups] = useState<Record<string, boolean>>({});

  // Load from database on mount (if authenticated)
  useEffect(() => {
    if (!isAuthenticated || !user?.id || initialLoadDone.current) return;
    initialLoadDone.current = true;

    (async () => {
      const { data, error } = await (supabase as any)
        .from("quality_hub_registries")
        .select("registry")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error || !data) return; // use localStorage/initial fallback

      const dbRegistry = data.registry as unknown;
      if (!isQualityHubRegistry(dbRegistry)) return;

      setRegistry(upgradeRegistry(dbRegistry as QualityHubRegistry));
    })();
  }, [isAuthenticated, user?.id]);

  // Save to localStorage immediately + debounced save to DB
  const saveToDb = useCallback(async (reg: QualityHubRegistry) => {
    if (!isAuthenticated || !user?.id) return;
    try {
      await (supabase as any)
        .from("quality_hub_registries")
        .upsert({
          user_id: user.id,
          registry: reg as unknown as Record<string, unknown>,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });
    } catch {
      // silent fail — localStorage is the fallback
    }
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(registry));

    // Debounced DB save
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => saveToDb(registry), 1500);

    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [registry, saveToDb]);

  const updateRegistry = useCallback((updater: (p: QualityHubRegistry) => QualityHubRegistry) => {
    setRegistry((p) => nextRegistryWithTimestamp(updater(p)));
  }, []);

  const allAgents = useMemo(() => getAgentList(registry), [registry]);
  const findings = useMemo(() => sortFindings(registry.findings), [registry.findings]);
  const severityCounts = useMemo(() => countBySeverity(findings), [findings]);
  const statusCounts = useMemo(() => countByStatus(findings), [findings]);
  const domainCounts = useMemo(() => countByDomain(findings), [findings]);

  const filteredFindings = useMemo(() => {
    const term = search.trim().toLowerCase();
    return findings.filter((f) => {
      if (severityFilter !== "all" && f.severity !== severityFilter) return false;
      if (domainFilter !== "all" && f.domain !== domainFilter) return false;
      if (statusFilter !== "all" && f.status !== statusFilter) return false;
      if (agentFilter !== "all" && f.foundBy.agent.id !== agentFilter) return false;
      if (!term) return true;
      return [f.title, f.problem, f.currentState, f.page, f.component, f.route, ...f.files, ...f.tags].filter(Boolean).join(" ").toLowerCase().includes(term);
    });
  }, [findings, search, severityFilter, domainFilter, statusFilter, agentFilter]);

  const groupedFindings = useMemo(() => groupFindingsBy(filteredFindings, (f) => {
    if (groupBy === "severity") return f.severity;
    if (groupBy === "domain") return f.domain;
    if (groupBy === "status") return f.status;
    if (groupBy === "page") return f.page || "unspecified";
    if (groupBy === "component") return f.component || "unspecified";
    return f.foundBy.agent.agentName || "unspecified";
  }), [filteredFindings, groupBy]);

  const orderedGroupEntries = useMemo(() => Object.entries(groupedFindings).sort((a, b) => {
    if (groupBy === "severity") return QUALITY_SEVERITIES.indexOf(a[0] as QualityFinding["severity"]) - QUALITY_SEVERITIES.indexOf(b[0] as QualityFinding["severity"]);
    return a[0].localeCompare(b[0]);
  }), [groupedFindings, groupBy]);

  const moduleCompleted = registry.scanModules.filter((m) => m.status === "completed").length;
  const openFindings = statusCounts.open + statusCounts["in-progress"];
  const criticalOpenFindings = findings.filter(
    (finding) => finding.severity === "critical" && OPEN_FINDING_STATUSES.has(finding.status),
  ).length;
  const dominantDomain = Object.entries(domainCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "n/a";
  const recentChanges = useMemo(
    () => [...(registry.changeLog || [])]
      .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
      .slice(0, 5),
    [registry.changeLog],
  );
  const scanCatalogSections = useMemo<ScanCatalogSectionSummary[]>(() => {
    const modulesById = new Map(registry.scanModules.map((module) => [module.id, module]));
    const runsById = new Map(registry.runs.map((run) => [run.id, run]));
    const nowMs = Date.now();

    const normalize = (value?: string) => (value ?? "").toLowerCase().trim();
    const hasPageMatch = (finding: QualityFinding, matchPages: string[]) => {
      const haystack = [finding.page, finding.route, finding.component]
        .filter(Boolean)
        .map((value) => normalize(value))
        .join(" ");
      if (!haystack) return false;
      return matchPages.some((pageLabel) => haystack.includes(normalize(pageLabel)));
    };

    return SCAN_CATALOG_SECTIONS.map((section) => {
      const rows = section.rowIds
        .map((rowId): ScanCatalogRowSummary | null => {
          const row = SCAN_CATALOG_ROWS[rowId];
          if (!row) return null;

          const rowModuleSet = new Set(row.moduleIds);
          const linkedModules = row.moduleIds
            .map((moduleId) => modulesById.get(moduleId))
            .filter((module): module is QualityHubRegistry["scanModules"][number] => Boolean(module));

          const findingsForRow = registry.findings.filter((finding) => {
            const matchesModuleTag = finding.tags.some((tag) => rowModuleSet.has(tag));
            const matchesDomain = row.domainHints.includes(finding.domain);
            if (!matchesModuleTag && !matchesDomain) return false;
            if (!section.matchPages || section.matchPages.length === 0) return true;
            return hasPageMatch(finding, section.matchPages);
          });

          const findingIds = findingsForRow.map((finding) => finding.id);
          const issuesFound = findingsForRow.length;
          const openIssues = findingsForRow.filter((finding) => OPEN_FINDING_STATUSES.has(finding.status)).length;
          const resolvedIssues = issuesFound - openIssues;

          const lastScanCandidates = linkedModules
            .map((module) => module.lastRunId)
            .filter((runId): runId is string => Boolean(runId))
            .map((runId) => runsById.get(runId)?.finishedAt)
            .filter((finishedAt): finishedAt is string => Boolean(finishedAt));

          const lastScanAt = lastScanCandidates
            .sort((a, b) => Date.parse(b) - Date.parse(a))[0] ?? null;
          const daysSinceLastScan =
            lastScanAt && Number.isFinite(Date.parse(lastScanAt))
              ? Math.max(0, Math.floor((nowMs - Date.parse(lastScanAt)) / 86_400_000))
              : null;

          const checks = Array.from(
            new Set(
              linkedModules.flatMap((module) => module.checklist.checks).map((check) => check.trim()).filter(Boolean),
            ),
          );
          const logTargets = Array.from(
            new Set(linkedModules.flatMap((module) => module.checklist.loggingTargets).map((target) => target.replace(/-/g, " "))),
          );
          const moduleNames = linkedModules.map((module) => module.name);

          return {
            ...row,
            findingIds,
            issuesFound,
            openIssues,
            resolvedIssues,
            lastScanAt,
            daysSinceLastScan,
            checks,
            logTargets,
            moduleNames,
          };
        })
        .filter((row): row is ScanCatalogRowSummary => Boolean(row));

      const sectionUniqueFindingIds = new Set(rows.flatMap((row) => row.findingIds));
      const sectionIssuesFound = sectionUniqueFindingIds.size;
      const sectionOpenIssues = registry.findings.filter(
        (finding) => sectionUniqueFindingIds.has(finding.id) && OPEN_FINDING_STATUSES.has(finding.status),
      ).length;

      return {
        ...section,
        rows,
        sectionIssuesFound,
        sectionOpenIssues,
      };
    });
  }, [registry.findings, registry.runs, registry.scanModules]);

  const handleExport = () => { const snapshot = nextRegistryWithTimestamp(registry); setRegistry(snapshot); downloadJson(`chronicle-quality-hub-${toCompactIso()}.json`, buildQualityHubTransferPackage(snapshot)); setImportFeedback("Exported Quality Hub JSON package."); };
  const handleImportClick = () => { fileInputRef.current?.click(); };
  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    try {
      const text = await file.text(); const parsed = JSON.parse(text);
      const candidate = isQualityHubRegistry(parsed) ? parsed : isQualityHubRegistry(parsed?.registry) ? parsed.registry : null;
      if (!candidate) { setImportFeedback("Import failed: not a valid Quality Hub registry."); return; }
      updateRegistry((p) => mergeRegistries(p, candidate));
      setImportFeedback(`Imported and merged findings from ${file.name}.`);
    } catch { setImportFeedback("Import failed: could not parse JSON."); } finally { event.target.value = ""; }
  };
  const handleAgentDraft = (patch: Partial<QualityAgent>) => { setAgentDraft((p) => { const next = { ...p, ...patch }; return { ...next, id: makeAgentId(next.agentName, next.modelName) }; }); };
  const logRunSnapshot = () => {
    const now = new Date().toISOString(); const runId = newId("run");
    updateRegistry((p) => ({ ...p, runs: [{ id: runId, name: `Manual Snapshot ${new Date(now).toLocaleString()}`, profile: "standard" as const, status: "completed" as const, startedAt: now, finishedAt: now, agent: agentDraft, scope: ["src"], summary: summarizeRun(p.findings, 0), notes: "Manual snapshot captured from dashboard." }, ...p.runs], meta: { ...p.meta, lastRunId: runId, lastUpdatedAt: now } }));
    setImportFeedback("Run snapshot logged.");
  };
  const updateFindingStatus = (id: string, status: QualityFinding["status"]) => {
    const now = new Date().toISOString();
    updateRegistry((p) => ({ ...p, findings: p.findings.map((f) => f.id === id ? { ...f, status, updatedAt: now, contributors: Array.from(new Map([...f.contributors, agentDraft].map((a) => [a.id, a])).values()) } : f) }));
  };
  const updateVerification = (id: string, vs: QualityFinding["verificationStatus"]) => {
    const now = new Date().toISOString();
    updateRegistry((p) => ({ ...p, findings: p.findings.map((f) => f.id !== id ? f : { ...f, verificationStatus: vs, verifiedBy: vs === "verified" ? { agent: agentDraft, runId: p.meta.lastRunId || "manual-verification", timestamp: now } : f.verifiedBy, updatedAt: now }) }));
  };
  const addCommentToFinding = (id: string) => {
    const comment = window.prompt("Add note/comment for this finding:"); if (!comment?.trim()) return;
    const now = new Date().toISOString();
    updateRegistry((p) => ({ ...p, findings: p.findings.map((f) => f.id === id ? { ...f, comments: [...f.comments, { id: newId("comment"), author: `${agentDraft.agentName} (${agentDraft.modelName})`, timestamp: now, text: comment.trim() }], updatedAt: now } : f) }));
  };
  const addCommentToChangeLog = useCallback((id: string) => {
    const text = window.prompt("Add note/comment:");
    if (!text?.trim()) return;
    const now = new Date().toISOString();
    updateRegistry((p) => ({
      ...p,
      changeLog: (p.changeLog || []).map((entry) => (
        entry.id !== id
          ? entry
          : {
              ...entry,
              updatedAt: now,
              comments: [
                ...entry.comments,
                {
                  id: `clc-${Math.random().toString(36).slice(2, 8)}`,
                  author: "Manual",
                  timestamp: now,
                  text: text.trim(),
                },
              ],
            }
      )),
    }));
  }, [updateRegistry]);
  const updateChangeLogStatus = useCallback((id: string, status: ChangeLogStatus) => {
    const now = new Date().toISOString();
    updateRegistry((p) => ({
      ...p,
      changeLog: (p.changeLog || []).map((entry) => (
        entry.id !== id ? entry : { ...entry, status, updatedAt: now }
      )),
    }));
  }, [updateRegistry]);

  const activeViewMeta = HUB_VIEWS.find((v) => v.id === activeView) || HUB_VIEWS[0];

  return (
    <div className="min-h-screen bg-[#111113] text-[#eaedf1]">
      <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleImportFile} />
      <header className="flex-shrink-0 h-16 border-b border-slate-200 bg-white flex items-center justify-between px-4 lg:px-8 shadow-sm">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate('/?tab=admin&adminTool=style_guide')} className="p-2 text-[hsl(var(--ui-surface-2))] hover:bg-slate-100 rounded-full transition-colors" aria-label="Go back" title="Go back">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <h1 className="text-lg font-black text-[hsl(var(--ui-surface-2))] uppercase tracking-tight">Quality Hub</h1>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setShowHowToUse(true)} className="inline-flex items-center gap-2 justify-center h-10 px-5 rounded-xl border border-[hsl(var(--ui-border))] bg-[hsl(var(--ui-surface-2))] text-[hsl(var(--ui-text))] shadow-[0_10px_30px_rgba(0,0,0,0.35)] hover:brightness-125 active:brightness-150 transition-all active:scale-95 text-[10px] font-bold leading-none uppercase tracking-wider">How to Use</button>
          <button type="button" onClick={handleImportClick} className="inline-flex items-center gap-2 justify-center h-10 px-5 rounded-xl border border-[hsl(var(--ui-border))] bg-[hsl(var(--ui-surface-2))] text-[hsl(var(--ui-text))] shadow-[0_10px_30px_rgba(0,0,0,0.35)] hover:brightness-125 active:brightness-150 transition-all active:scale-95 text-[10px] font-bold leading-none uppercase tracking-wider">Import</button>
          <button type="button" onClick={handleExport} className="inline-flex items-center gap-2 justify-center h-10 px-5 rounded-xl border border-[hsl(var(--ui-border))] bg-[hsl(var(--ui-surface-2))] text-[hsl(var(--ui-text))] shadow-[0_10px_30px_rgba(0,0,0,0.35)] hover:brightness-125 active:brightness-150 transition-all active:scale-95 text-[10px] font-bold leading-none uppercase tracking-wider">Export</button>
          <button type="button" onClick={logRunSnapshot} className="inline-flex items-center gap-2 justify-center h-10 px-5 rounded-xl border border-[hsl(var(--ui-border))] bg-[hsl(var(--ui-surface-2))] text-[hsl(var(--ui-text))] shadow-[0_10px_30px_rgba(0,0,0,0.35)] hover:brightness-125 active:brightness-150 transition-all active:scale-95 text-[10px] font-bold leading-none uppercase tracking-wider">Log Snapshot</button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1480px] space-y-6 px-4 py-6 md:px-8 md:py-8">
        {/* Metrics */}
        <section className={panelOuterClass}><div className={panelBodyClass}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <MetricCard label="Open Issues" value={openFindings} />
            <MetricCard
              label="Critical Open"
              value={criticalOpenFindings}
              tone={criticalOpenFindings > 0 ? "danger" : "success"}
            />
            <MetricCard label="Verified" value={statusCounts.verified} tone="success" />
            <MetricCard label="Runs Logged" value={registry.runs.length} />
            <MetricCard label="Modules Completed" value={`${moduleCompleted}/${registry.scanModules.length}`} />
          </div>
          {!!importFeedback && <div className={cn(recessedStripClass, "mt-4 p-3 text-xs text-[#eaedf1]")}>{importFeedback}</div>}
        </div></section>

        {/* Nav */}
        <section className={panelOuterClass}>
          <div className={panelHeaderClass}><div className={panelHeaderOverlayClass} /><h2 className="relative z-10 text-[20px] font-semibold tracking-tight text-white">Quality Hub Navigation</h2></div>
          <div className={panelBodyClass}><div className={panelInnerClass}>
            <div className="grid gap-2 md:grid-cols-4">
              {HUB_VIEWS.map((v) => (
                <button key={v.id} type="button" onClick={() => setActiveView(v.id)} className={cn("rounded-xl border-none px-3 py-3 text-left transition shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)]", activeView === v.id ? "bg-[linear-gradient(180deg,#5a7292_0%,#4a5f7f_100%)] text-white" : "bg-[#3c3e47] hover:brightness-110")}>
                  <div className="text-xs font-black uppercase tracking-[0.14em] text-[#eaedf1]">{v.label}</div>
                  <div className="mt-1 text-[11px] text-[#a1a1aa]">{v.description}</div>
                </button>
              ))}
            </div>
            <div className={cn(recessedStripClass, "mt-3 p-3 text-xs text-[#eaedf1]")}><span className="font-bold text-white">{activeViewMeta.label}:</span> {activeViewMeta.description}</div>
          </div></div>
        </section>

        {/* Overview */}
        {activeView === "overview" && (
          <div className="space-y-6">
            {scanCatalogSections.map((section) => (
              <Section
                key={section.id}
                title={section.title}
                badge={
                  <span
                    className={cn(
                      "rounded-full border bg-[#2f3137] px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em]",
                      section.sectionOpenIssues === 0
                        ? "border-[#22c55e] text-[#22c55e]"
                        : "border-[#ef4444] text-[#ef4444]",
                    )}
                  >
                    Open {section.sectionOpenIssues}
                  </span>
                }
              >
                <div className="mb-3 text-xs text-[#a1a1aa]">{section.description}</div>
                <div className={cn(recessedStripClass, "mb-2 hidden px-3 py-2 md:grid md:grid-cols-[minmax(0,1fr)_120px_140px_140px] text-[10px] font-black uppercase tracking-[0.14em] text-[#71717a]")}>
                  <span>Scan</span>
                  <span className="text-right">Issue Status</span>
                  <span className="text-right">Last Scan</span>
                  <span className="text-right">Days Since Scan</span>
                </div>
                <div className="space-y-2">
                  {section.rows.map((row) => (
                    <details key={`${section.id}-${row.id}`} className={cn(recessedBlockClass, "group open:ring-1 open:ring-[#4a5f7f]/60")}>
                      <summary className="cursor-pointer list-none px-3 py-3 relative">
                        <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_120px_140px_140px] md:items-center">
                          <div className="pr-7">
                            <div className="text-sm font-bold text-[#eaedf1]">{row.label}</div>
                            <div className="mt-1 text-xs text-[#a1a1aa]">{row.description}</div>
                          </div>
                          <div className="md:text-right">
                            <div className="text-[10px] font-black uppercase tracking-[0.14em] text-[#71717a] md:hidden">Issue Status</div>
                            <div className="text-[11px]">
                              <span className="text-[#71717a]">Open:</span>{" "}
                              <span className={cn("font-black", row.openIssues === 0 ? "text-[#22c55e]" : "text-[#ef4444]")}>
                                {row.openIssues}
                              </span>
                            </div>
                            <div className="text-[11px]">
                              <span className="text-[#71717a]">Fixed:</span>{" "}
                              <span className="font-black text-white">{row.resolvedIssues}</span>
                            </div>
                          </div>
                          <div className="md:text-right">
                            <div className="text-[10px] font-black uppercase tracking-[0.14em] text-[#71717a] md:hidden">Last Scan</div>
                            <div className="text-sm font-bold text-[#eaedf1]">{row.lastScanAt ? formatShortDate(row.lastScanAt) : "Never"}</div>
                          </div>
                          <div className="md:text-right">
                            <div className="text-[10px] font-black uppercase tracking-[0.14em] text-[#71717a] md:hidden">Days Since Scan</div>
                            <div className="text-sm font-bold text-[#eaedf1]">
                              {row.daysSinceLastScan === null ? "—" : `${row.daysSinceLastScan} days`}
                            </div>
                          </div>
                        </div>
                        <ChevronDown size={16} className="absolute top-3 right-3 text-[#71717a] transition-transform group-open:rotate-180" />
                      </summary>
                      <div className="border-t border-[rgba(255,255,255,0.05)] px-3 py-3 space-y-2">
                        <div className={cn(recessedStripClass, "p-3")}>
                          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#a1a1aa] mb-2">What this scan checks</div>
                          {row.checks.length === 0 ? (
                            <div className="text-xs text-[#71717a]">No checks are linked yet for this scan row.</div>
                          ) : (
                            <ul className="list-disc pl-5 text-xs text-[#a1a1aa] space-y-1">
                              {row.checks.map((check, index) => (
                                <li key={`${row.id}-check-${index}`}>{check}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <div className="grid gap-2 md:grid-cols-2">
                          <div className={cn(recessedStripClass, "p-3")}>
                            <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#a1a1aa] mb-2">Backed by modules</div>
                            <div className="text-xs text-[#a1a1aa]">
                              {row.moduleNames.length > 0 ? row.moduleNames.join(" • ") : "No module linkage defined."}
                            </div>
                          </div>
                          <div className={cn(recessedStripClass, "p-3")}>
                            <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#a1a1aa] mb-2">Where to log results</div>
                            <div className="text-xs text-[#a1a1aa]">
                              {row.logTargets.length > 0 ? row.logTargets.join(" • ") : "Issue registry • scan runs • change log"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </details>
                  ))}
                </div>
              </Section>
            ))}

            <Section
              title="Recent Change Log (Mirror)"
              badge={
                <button
                  type="button"
                  onClick={() => setActiveView("changelog")}
                  className={neutralButtonClass}
                >
                  Open Change Log
                </button>
              }
            >
              <div className={cn(recessedStripClass, "mb-3 p-3 text-xs text-[#a1a1aa]")}>
                Live mirror of the latest Change Log entries. Cards below use the same renderer and field ordering as the Change Log tab.
              </div>
              {recentChanges.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#4a5f7f]/60 px-4 py-8 text-sm text-center text-[#a1a1aa]">
                  No change log entries yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {recentChanges.map((entry) => (
                    <ChangeLogEntryCard
                      key={entry.id}
                      entry={entry}
                      onUpdateStatus={updateChangeLogStatus}
                      onAddComment={addCommentToChangeLog}
                    />
                  ))}
                </div>
              )}
            </Section>
          </div>
        )}

        {/* Issue Registry */}
        {activeView === "findings" && (
          <div className="space-y-6">
            <Section title="Issue Registry Workspace">
              <div className="space-y-4">
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-5">
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search issues..." className={cn("xl:col-span-2", inputClass)} />
                  <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value as typeof severityFilter)} className={selectClass}><option value="all">All severities</option>{QUALITY_SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
                  <select value={domainFilter} onChange={(e) => setDomainFilter(e.target.value as typeof domainFilter)} className={selectClass}><option value="all">All domains</option>{QUALITY_DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}</select>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className={selectClass}><option value="all">All statuses</option>{QUALITY_FINDING_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}</select>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  <select value={agentFilter} onChange={(e) => setAgentFilter(e.target.value)} className={selectClass}><option value="all">All agents</option>{allAgents.map((a) => <option key={a.id} value={a.id}>{a.agentName} ({a.modelName})</option>)}</select>
                  <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as GroupBy)} className={selectClass}><option value="severity">Group by severity</option><option value="domain">Group by domain</option><option value="status">Group by status</option><option value="page">Group by page</option><option value="component">Group by component</option><option value="agent">Group by agent</option></select>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  <div className={cn(recessedStripClass, "p-2 text-xs text-[#eaedf1]")}><span className="font-bold text-white">{filteredFindings.length}</span> filtered issues</div>
                  <div className={cn(recessedStripClass, "p-2 text-xs text-[#eaedf1]")}>Dominant domain: <span className="font-bold text-white">{dominantDomain}</span></div>
                  <div className={cn(recessedStripClass, "p-2 text-xs text-[#eaedf1]")}>Confidence levels: {QUALITY_CONFIDENCE.length}</div>
                </div>
              </div>
            </Section>
            {orderedGroupEntries.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-[#71717a] bg-[linear-gradient(to_bottom_right,#27272a,#18181b)] px-4 py-10 text-center text-sm text-[#a1a1aa]">No findings yet. Import a JSON package to start.</div>
            ) : (
              orderedGroupEntries.map(([group, items]) => {
                const unresolvedCount = items.filter((f) => !RESOLVED_FINDING_STATUSES.has(f.status)).length;
                const resolvedCount = items.length - unresolvedCount;
                const showResolved = !!expandedResolvedGroups[group];

                return (
                <Section
                  key={group}
                  title={domainLabel(group)}
                  badge={
                    <span
                      className={cn(
                        "rounded-full border bg-[#2f3137] px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em]",
                        unresolvedCount === 0
                          ? "border-[#22c55e] text-[#22c55e]"
                          : "border-[#ef4444] text-[#ef4444]",
                      )}
                    >
                      Open {unresolvedCount}
                    </span>
                  }
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div className={cn(recessedStripClass, "px-3 py-1.5 text-[11px] text-[#a1a1aa]")}>
                      <span className="font-bold text-white">{unresolvedCount}</span> open/in-progress •{" "}
                      <span className="font-bold text-white">{resolvedCount}</span> fixed/verified
                    </div>
                    {resolvedCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setExpandedResolvedGroups((prev) => ({ ...prev, [group]: !prev[group] }))}
                        className={cn(recessedStripClass, "inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-[#eaedf1] hover:brightness-110 transition")}
                      >
                        {showResolved ? "Hide fixed" : `Show fixed (${resolvedCount})`}
                        <ChevronDown size={14} className={cn("transition-transform", showResolved && "rotate-180")} />
                      </button>
                    )}
                  </div>
                  {unresolvedCount === 0 && (
                    <div className={cn(recessedStripClass, "mb-3 p-2 text-xs text-[#a1a1aa]")}>
                      No open issues in this group. Fixed/verified items are available in the dropdown.
                    </div>
                  )}
                  <div className="space-y-2">{items.map((f) => {
                    const isResolved = RESOLVED_FINDING_STATUSES.has(f.status);
                    if (isResolved && !showResolved) return null;
                    return (
                    <details key={f.id} className={cn(recessedBlockClass, "group open:ring-1 open:ring-[#4a5f7f]/60")}>
                       <summary className="cursor-pointer list-none px-4 py-3 relative">
                        <div className="flex flex-wrap items-start gap-2 pr-8">
                          <span className={cn("rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em]", severityBadgeClass[f.severity])}>{f.severity}</span>
                          <span className="rounded-full bg-[#4a5f7f] px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#eaedf1]">{f.domain}</span>
                          <span className={cn("rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em]", f.status === "fixed" ? "bg-[#166534] text-white" : "bg-[#4a5f7f] text-[#eaedf1]")}>{f.status}</span>
                        </div>
                        <div className="mt-2 text-sm font-bold text-white">{f.title}</div>
                        <div className="mt-1 text-xs text-[#a1a1aa]">{f.page}{f.component ? ` • ${f.component}` : ""}</div>
                        <ChevronDown size={16} className="absolute bottom-3 right-4 text-[#71717a] transition-transform group-open:rotate-180" />
                      </summary>
                      <div className="border-t border-[rgba(255,255,255,0.05)] px-4 py-4 space-y-5">
                        {/* ── Summary ── */}
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#a1a1aa] mb-2">Summary</div>
                          <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-3 text-xs text-[#a1a1aa]">
                            <div><span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#eaedf1]">Severity</span> {f.severity}</div>
                            <div><span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#eaedf1]">Domain</span> {domainLabel(f.domain)}</div>
                            <div><span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#eaedf1]">Status</span> {titleCase(f.status)}</div>
                            <div><span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#eaedf1]">Confidence</span> {titleCase(f.confidence)}</div>
                            <div><span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#eaedf1]">Category</span> {f.category || "—"}</div>
                            <div><span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#eaedf1]">Page</span> {f.page}</div>
                            {f.route && <div><span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#eaedf1]">Route</span> {f.route}</div>}
                            {f.component && <div><span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#eaedf1]">Component</span> {f.component}</div>}
                          </div>
                        </div>
                        {/* ── Problem ── */}
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#a1a1aa] mb-2">Problem</div>
                          <div className="space-y-2 text-xs text-[#a1a1aa]">
                            <div><span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#eaedf1]">Problem</span> {f.problem || "—"}</div>
                            <div><span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#eaedf1]">Current State</span> {f.currentState || "—"}</div>
                          </div>
                        </div>
                        {/* ── Impact ── */}
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#a1a1aa] mb-2">Impact</div>
                          <div className="space-y-2 text-xs text-[#a1a1aa]">
                            <div><span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#eaedf1]">Why It Matters</span> {f.whyItMatters || "—"}</div>
                            <div><span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#eaedf1]">User Impact</span> {f.userImpact || "—"}</div>
                          </div>
                        </div>
                        {/* ── Files & Evidence ── */}
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#a1a1aa] mb-2">Files & Evidence</div>
                          <div className="grid gap-3 lg:grid-cols-2 text-xs text-[#a1a1aa]">
                            <div>
                             <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#eaedf1]">Files</span>
                              {f.files.length === 0 ? <span className="ml-1 text-[#71717a]">—</span> : <div className="mt-1 space-y-0.5">{f.files.map((file) => <div key={file} className="font-mono text-[11px] text-[#a1a1aa]">{file}</div>)}</div>}
                            </div>
                            <div>
                             <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#eaedf1]">Evidence</span>
                              {f.evidence.length === 0 ? <span className="ml-1 text-[#71717a]">—</span> : <ul className="mt-1 list-disc pl-5">{f.evidence.map((ev, i) => <li key={i}>{ev}</li>)}</ul>}
                            </div>
                          </div>
                          {f.tags.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{f.tags.map((t) => <span key={t} className="rounded-full bg-[#4a5f7f]/30 px-2 py-0.5 text-[10px] font-bold text-[#eaedf1]">{t}</span>)}</div>}
                        </div>
                        {/* ── Proposed Fix ── */}
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#a1a1aa] mb-2">Proposed Fix</div>
                          <div className="space-y-2 text-xs text-[#a1a1aa]">
                            <div><span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#eaedf1]">Recommendation</span> {f.recommendation || "—"}</div>
                            <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
                              <div><span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#eaedf1]">Fix Level</span> {titleCase(f.fixLevel)}</div>
                              <div><span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#eaedf1]">Difficulty</span> {titleCase(f.implementationDifficulty)}</div>
                              <div><span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#eaedf1]">Batchable</span> {f.batchable ? "Yes" : "No"}</div>
                              <div><span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#eaedf1]">Design System</span> {f.designSystemLevel ? "Yes" : "No"}</div>
                            </div>
                          </div>
                        </div>
                        {/* ── Expected Outcome ── */}
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#a1a1aa] mb-2">Expected Outcome</div>
                          <div className="space-y-2 text-xs text-[#a1a1aa]">
                            <div><span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#eaedf1]">Expected Behavior</span> {f.expectedBehavior || "—"}</div>
                            <div><span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#eaedf1]">Actual Behavior</span> {f.actualBehavior || "—"}</div>
                            {f.reproSteps.length > 0 && <div><span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#eaedf1]">Repro Steps</span><ol className="mt-1 list-decimal pl-5">{f.reproSteps.map((s, i) => <li key={i}>{s}</li>)}</ol></div>}
                          </div>
                        </div>
                        {/* ── Metadata ── */}
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#a1a1aa] mb-2">Metadata</div>
                          <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2 text-xs text-[#a1a1aa]">
                            <div><span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#eaedf1]">Found By</span> {f.foundBy.agent.agentName} ({f.foundBy.agent.modelName})</div>
                            <div><span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#eaedf1]">Source</span> {titleCase(f.sourceKind)}</div>
                            <div><span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#eaedf1]">Created</span> {formatDate(f.createdAt)}</div>
                            <div><span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#eaedf1]">Updated</span> {formatDate(f.updatedAt)}</div>
                            {f.verifiedBy && <div><span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#eaedf1]">Verified By</span> {f.verifiedBy.agent.agentName}</div>}
                            {f.contributors.length > 0 && <div><span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#eaedf1]">Contributors</span> {f.contributors.map((c) => c.agentName).join(", ")}</div>}
                            {f.relatedFindingIds.length > 0 && <div><span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#eaedf1]">Related Issues</span> {f.relatedFindingIds.join(", ")}</div>}
                            {(f.relatedRunIds ?? []).length > 0 && <div><span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#eaedf1]">Related Runs</span> {(f.relatedRunIds ?? []).join(", ")}</div>}
                            {(f.relatedChangeLogIds ?? []).length > 0 && <div><span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#eaedf1]">Related Changes</span> {(f.relatedChangeLogIds ?? []).join(", ")}</div>}
                          </div>
                        </div>
                        {/* ── Actions ── */}
                        <div className="grid gap-2 md:grid-cols-3">
                          <select value={f.status} onChange={(e) => updateFindingStatus(f.id, e.target.value as QualityFinding["status"])} className={selectClass}>{QUALITY_FINDING_STATUS.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}</select>
                          <select value={f.verificationStatus} onChange={(e) => updateVerification(f.id, e.target.value as QualityFinding["verificationStatus"])} className={selectClass}>{QUALITY_VERIFICATION_STATUS.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}</select>
                          <button type="button" onClick={() => addCommentToFinding(f.id)} className={neutralButtonClass}>Add Comment</button>
                        </div>
                        {f.comments.length > 0 && <div className="mt-3 space-y-2 rounded-lg border border-[rgba(255,255,255,0.05)] bg-[#1c1c1f] p-3">{f.comments.map((c) => <div key={c.id} className={cn(recessedStripClass, "px-2 py-2 text-xs text-[#a1a1aa]")}><div className="font-bold text-[#eaedf1]">{c.author}</div><div className="text-[10px] text-[#71717a]">{formatDate(c.timestamp)}</div><div className="mt-1">{c.text}</div></div>)}</div>}
                      </div>
                    </details>
                  )})}</div>
                </Section>
              )})
            )}
          </div>
        )}

        {/* Scan Runs */}
        {activeView === "runs" && (
          <div className="grid gap-6 lg:grid-cols-[430px_minmax(0,1fr)]">
            <Section title="Agent Attribution"><div className="space-y-3">
              <div><label className="text-[10px] font-black uppercase tracking-[0.16em] text-[#a1a1aa]">Agent Name</label><input value={agentDraft.agentName} onChange={(e) => handleAgentDraft({ agentName: e.target.value })} className={inputClass} /></div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><label className="text-[10px] font-black uppercase tracking-[0.16em] text-[#a1a1aa]">Model</label><input value={agentDraft.modelName} onChange={(e) => handleAgentDraft({ modelName: e.target.value })} className={inputClass} /></div>
                <div><label className="text-[10px] font-black uppercase tracking-[0.16em] text-[#a1a1aa]">Platform</label><input value={agentDraft.platform} onChange={(e) => handleAgentDraft({ platform: e.target.value })} className={inputClass} /></div>
              </div>
              <div className={cn(recessedStripClass, "p-3 text-[11px] text-[#eaedf1]")}>Active tag: <span className="font-bold text-white">{agentDraft.agentName}</span> · {agentDraft.modelName} · {agentDraft.platform}</div>
              <button type="button" onClick={logRunSnapshot} className={subtleButtonClass}>Log Run Snapshot</button>
            </div>
            <div className={cn(recessedBlockClass, "mt-4 p-3")}><div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#a1a1aa]">Known Agents</div><div className="mt-2 space-y-1">{allAgents.map((a) => <div key={a.id} className="text-xs text-[#a1a1aa]">{a.agentName} <span className="text-[#71717a]">({a.modelName})</span></div>)}</div></div>
            </Section>
            <Section title="Scan Run History"><div className="overflow-x-auto rounded-xl border border-[#4a5f7f]/45">
              <table className="w-full min-w-[720px] border-collapse"><thead className="bg-[#1a2030]"><tr><th className="px-3 py-2 text-left text-[10px] font-black uppercase tracking-[0.16em] text-[#a1a1aa]">Run</th><th className="px-3 py-2 text-left text-[10px] font-black uppercase tracking-[0.16em] text-[#a1a1aa]">Agent</th><th className="px-3 py-2 text-left text-[10px] font-black uppercase tracking-[0.16em] text-[#a1a1aa]">Profile</th><th className="px-3 py-2 text-left text-[10px] font-black uppercase tracking-[0.16em] text-[#a1a1aa]">Summary</th><th className="px-3 py-2 text-left text-[10px] font-black uppercase tracking-[0.16em] text-[#a1a1aa]">Finished</th></tr></thead>
              <tbody>{registry.runs.length === 0 ? <tr><td className="px-3 py-4 text-xs text-[#71717a]" colSpan={5}>No run history yet.</td></tr> : registry.runs.map((r) => <tr key={r.id} className="border-t border-[#4a5f7f]/25 bg-[#1a2030]"><td className="px-3 py-3 text-xs text-[#e4e4e7]"><div className="font-bold text-[#eaedf1]">{r.name}</div><div className="font-mono text-[11px] text-[#71717a]">{r.id}</div></td><td className="px-3 py-3 text-xs text-[#a1a1aa]">{r.agent.agentName}</td><td className="px-3 py-3 text-xs uppercase text-[#a1a1aa]">{r.profile}</td><td className="px-3 py-3 text-xs text-[#a1a1aa]">total {r.summary.findingsTotal} • open {r.summary.open}</td><td className="px-3 py-3 text-xs text-[#a1a1aa]">{formatDate(r.finishedAt)}</td></tr>)}</tbody></table>
            </div></Section>
          </div>
        )}

        {/* Change Log */}
        {activeView === "changelog" && (
          <ChangeLogView
            registry={registry}
            updateRegistry={updateRegistry}
            onAddComment={addCommentToChangeLog}
            onUpdateStatus={updateChangeLogStatus}
          />
        )}
      </div>
      <QualityHubHowToModal open={showHowToUse} onClose={() => setShowHowToUse(false)} />
    </div>
  );
}
