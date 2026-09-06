import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  QUALITY_CONFIDENCE,
  QUALITY_DOMAINS,
  QUALITY_FINDING_STATUS,
  QUALITY_SEVERITIES,
  QUALITY_VERIFICATION_STATUS,
  QualityAgent,
  QualityFinding,
  QualityHubRegistry,
  isQualityHubRegistry,
  makeAgentId,
} from "@/lib/ui-audit-schema";
import {
  countByDomain,
  countBySeverity,
  countByStatus,
  groupFindingsBy,
  newId,
  sortFindings,
  summarizeRun,
  toCompactIso,
} from "@/lib/ui-audit-utils";
import {
  canonicalJsonEqual,
  cloneLegacyChangeLog,
  guardQualityHubRegistryUpdate,
  legacyChangeLogEqual,
  mergeRegistryUpgradePreservingLegacyChangeLog,
  prepareQualityHubWorkspaceImport,
  type QualityHubRegistryInput,
  withLegacyChangeLog,
} from "@/lib/quality-hub-read-only";
import {
  qualityHubDefaultAgent,
  qualityHubInitialRegistry,
} from "@/data/ui-audit-findings";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/use-auth";
import {
  QualityHubChangelogMigrationCapture,
} from "@/features/quality-hub/quality-hub-changelog-migration-capture";
import {
  capturePreloadLocalStorage,
} from "@/features/quality-hub/quality-hub-changelog-migration-capture-support";
import ChangelogRecordList from "@/components/admin/knowledge-base/ChangelogRecordList";
import {
  buildQualityHubChangelogHref,
  buildWorkManualHref,
} from "@/data/chronicle-knowledge-base/knowledge-routes";
import {
  isChronicleCapabilityId,
  type ChronicleCapabilityId,
} from "@/data/chronicle-knowledge-base/capability-ids";
import { getOperationalCapability } from "@/data/chronicle-knowledge-base/operational-capability-registry";

const STORAGE_KEY = "chronicle-quality-hub-v1";
const PENDING_OWNER_SAVE_KEY_PREFIX = "chronicle-quality-hub-pending-v1";

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
  { id: "changelog", label: "Changelog", description: "Read-only repository change history" },
];

type QualityHubChangelogCapability = ChronicleCapabilityId | undefined;

export type QualityHubQueryState = Readonly<{
  activeView: HubViewId;
  changelogCapability: QualityHubChangelogCapability;
}>;

function readQualityHubQuery(search: string): QualityHubQueryState {
  const params = new URLSearchParams(search);
  const requestedView = params.get("view");
  const activeView = HUB_VIEWS.some((view) => view.id === requestedView)
    ? (requestedView as HubViewId)
    : "overview";
  const requestedCapability = params.get("capability");
  const changelogCapability =
    activeView === "changelog" &&
    requestedCapability !== null &&
    isChronicleCapabilityId(requestedCapability) &&
    getOperationalCapability(requestedCapability)
      ? requestedCapability
      : undefined;
  return Object.freeze({ activeView, changelogCapability });
}

const RESOLVED_FINDING_STATUSES = new Set<QualityFinding["status"]>(["fixed", "verified"]);
const OPEN_FINDING_STATUSES = new Set<QualityFinding["status"]>(["open", "in-progress"]);

type ScanCatalogRow = {
  id: string;
  label: string;
  description: string;
  moduleIds: string[];
  domainHints: readonly QualityFinding["domain"][];
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
};

const SCAN_CATALOG_ROWS: Record<string, ScanCatalogRow> = {
  "app-guide-doc": {
    id: "app-guide-doc",
    label: "App Guide Documentation Consistency",
    description: "Checks that each long-form App Guide document still matches live routes, file ownership, and behavior descriptions.",
    moduleIds: ["module-app-guide-integrity", "module-docs"],
    domainHints: ["documentation"],
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
    domainHints: [...QUALITY_DOMAINS],
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
    id: "app-guide-tool",
    title: "Admin Tool: App Guide",
    description: "Tool-specific scans for long-form system docs freshness and route/component/source-truth alignment.",
    matchPages: ["Admin", "Quality Hub"],
    rowIds: ["app-guide-doc", "quick-stability", "pre-push-full", "build-health"],
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

const LOVABLE_SUPABASE_REQUIRED_TAG = "lovable-supabase-required";
const lovableSupabaseBadgeClass =
  "inline-flex max-w-full items-center rounded-full border border-[#34d399]/40 bg-[#5ee68c] px-2.5 py-1 text-[10px] font-black leading-none text-[#06351c] shadow-[0_0_18px_rgba(94,230,140,0.16)]";

function requiresLovableSupabaseChange(finding: QualityFinding): boolean {
  return finding.tags.includes(LOVABLE_SUPABASE_REQUIRED_TAG);
}

function cloneInitialRegistry(): QualityHubRegistry {
  const initial = structuredClone(qualityHubInitialRegistry);
  return {
    ...initial,
    changeLog: [],
  };
}

const RETIRED_SCAN_MODULE_IDS: ReadonlySet<string> = new Set([
  "module-app-architecture-integrity",
  "module-api-inspector-integrity",
]);
const RETIRED_REVIEW_UNIT_IDS: ReadonlySet<string> = new Set(["unit-api-inspector"]);

function normalizeActiveQualityHubRegistry(registry: QualityHubRegistry): QualityHubRegistry {
  return {
    ...registry,
    scanModules: registry.scanModules
      .filter((module) => !RETIRED_SCAN_MODULE_IDS.has(module.id))
      .map((module) => ({
        ...module,
        checklist: {
          ...module.checklist,
          loggingTargets: module.checklist.loggingTargets.map((target) => (
            target === "change-log" || target === "knowledge-base-current-work"
              ? "chronicle-records-if-triggered"
              : target
          )),
        },
      })),
    reviewUnits: registry.reviewUnits.filter((unit) => !RETIRED_REVIEW_UNIT_IDS.has(unit.id)),
  };
}

/** Upgrade operational data without merging repository seed history into the frozen legacy Changelog. */
function upgradeRegistry(persisted: QualityHubRegistryInput): QualityHubRegistry {
  const seed = qualityHubInitialRegistry;
  const currentVersion = seed.meta.registryVersion ?? 0;
  const persistedVersion = persisted.meta?.registryVersion ?? 0;
  const protectedChangeLog = cloneLegacyChangeLog(persisted.changeLog);
  const safePersisted: QualityHubRegistry = {
    ...persisted,
    changeLog: protectedChangeLog,
  };

  if (persistedVersion >= currentVersion) {
    return withLegacyChangeLog(
      normalizeActiveQualityHubRegistry(safePersisted),
      protectedChangeLog,
    );
  }

  const merged = mergeRegistryUpgradePreservingLegacyChangeLog(seed, safePersisted);
  return withLegacyChangeLog(normalizeActiveQualityHubRegistry({
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
  }), protectedChangeLog);
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

function downloadText(filename: string, contents: string) {
  const blob = new Blob([contents], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
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
              <div className="text-[11px] font-black uppercase tracking-[0.16em] text-[#a1a1aa] mb-2">Workflow authority</div>
              <p>
                Quality Hub stores scan mechanics and scan results. It does not decide whether
                Chronicle work needs a scan, Issue, Current Work project, Changelog entry, or
                broad check package.
              </p>
              <Link className="mt-3 inline-block font-semibold text-[#8dc5ff] hover:underline" to={buildWorkManualHref("start-here")}>
                Open Chronicle Work Manual — Start Here
              </Link>
            </div>
            <div className={cn(recessedBlockClass, "p-4")}>
              <div className="text-[11px] font-black uppercase tracking-[0.16em] text-[#a1a1aa] mb-2">Quality Hub mechanics</div>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong className="text-white">Overview</strong> selects an already-authorized scan module.</li>
                <li><strong className="text-white">Scan Runs</strong> records who scanned, when, the bounded scope, checks, omissions, and result summary.</li>
                <li><strong className="text-white">Issue Registry</strong> stores findings that meet the Work Manual&apos;s Issue trigger.</li>
                <li><strong className="text-white">Changelog</strong> is a read-only projection of canonical accepted history.</li>
              </ul>
            </div>
            <div className={cn(recessedBlockClass, "p-4")}>
              <div className="text-[11px] font-black uppercase tracking-[0.16em] text-[#a1a1aa] mb-2">Live-system evidence</div>
              <ul className="list-disc pl-5 space-y-1">
                <li>The Work Manual decides when live Lovable or Supabase inspection is required.</li>
                <li>The synchronized repository reference states the last documented backend structure; it does not prove inaccessible live state.</li>
                <li>Never store private rows, secrets, tokens, user emails, story or chat contents, or private media in scan evidence.</li>
                <li>Label inaccessible live facts as unverified rather than inventing them.</li>
              </ul>
            </div>
            <div className={cn(recessedBlockClass, "p-4")}>
              <div className="text-[11px] font-black uppercase tracking-[0.16em] text-[#a1a1aa] mb-2">Evidence limits</div>
              <ul className="list-disc pl-5 space-y-1">
                <li>A scan establishes only what its named checks and inspected sources support.</li>
                <li>A suspected finding is not automatically a verified Issue.</li>
                <li>A Quality Scan pass does not prove deployment, live Supabase state, or untested product behavior.</li>
                <li>Record uncertainty and skipped scope explicitly.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CanonicalChangeLogView({
  capability,
}: {
  capability: QualityHubChangelogCapability;
}) {
  const capabilityLabel = capability
    ? (getOperationalCapability(capability)?.displayName ?? capability)
    : null;

  return (
    <div className="space-y-6">
      <Section
        title="Changelog"
        badge={(
          <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#d4d4d8]">
            Repository history · Read-only
          </span>
        )}
      >
        <div className="space-y-4">
          <p className="text-sm leading-6 text-[#d4d4d8]">
            This view reads Chronicle&apos;s canonical repository Changelog. Historical
            Quality Hub records remain historical and are not relabeled as modern
            accepted changes. It is a read-only history surface; the Chronicle Work
            Manual separately governs when Current Work or an accepted Changelog
            record is created.
          </p>
          <p className="text-sm leading-6 text-[#d4d4d8]">
            The primary records below explain what was broken, why the work was
            needed, what changed, and what result or verification limit was
            recorded. Each record links to its complete technical history.
          </p>
          <nav aria-label="Changelog scope" className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {capability ? (
              <>
                <span className="font-bold text-white">{capabilityLabel}</span>
                <Link
                  className="font-semibold text-[#93c5fd] underline underline-offset-4 hover:text-[#bfdbfe]"
                  to={buildQualityHubChangelogHref()}
                >
                  Show all Chronicle records
                </Link>
              </>
            ) : (
              <>
                <span className="font-bold text-white">All Chronicle records</span>
                <Link
                  className="font-semibold text-[#93c5fd] underline underline-offset-4 hover:text-[#bfdbfe]"
                  to={buildQualityHubChangelogHref("community-gallery")}
                >
                  Show Community Gallery only
                </Link>
              </>
            )}
          </nav>
          <ChangelogRecordList
            capability={capability}
            detailScope={capability ?? "global"}
            detailOrigin="quality-hub"
            scopeLabel={
              capability
                ? `Records positively verified to affect ${capabilityLabel}.`
                : "All records currently in the canonical Chronicle Changelog."
            }
            emptyMessage={
              capability
                ? `No canonical Changelog records are currently verified as affecting ${capabilityLabel}.`
                : "No canonical Chronicle Changelog records are currently recorded."
            }
          />
        </div>
      </Section>
    </div>
  );
}

type OwnerHydrationState = "waiting" | "loading" | "ready" | "read-error";
type OwnerRegistryRevision =
  | { userId: string; exists: false; updatedAt: null }
  | { userId: string; exists: true; updatedAt: string | null };

type PendingOwnerSave = Readonly<{
  version: 2;
  ownerUserId: string;
  localRevision: number;
  baseExists: boolean | null;
  baseUpdatedAt: string | null;
  baseRegistry: QualityHubRegistryInput | null;
  registry: QualityHubRegistry;
}>;

type PendingOwnerSaveReadResult =
  | { status: "absent" }
  | { status: "invalid" }
  | { status: "ready"; value: PendingOwnerSave };

function pendingOwnerSaveKey(ownerUserId: string): string {
  return `${PENDING_OWNER_SAVE_KEY_PREFIX}:${encodeURIComponent(ownerUserId)}`;
}

function readPendingOwnerSave(ownerUserId: string): PendingOwnerSaveReadResult {
  if (typeof window === "undefined") return { status: "absent" };
  try {
    const raw = window.localStorage.getItem(pendingOwnerSaveKey(ownerUserId));
    if (!raw) return { status: "absent" };
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== "object"
      || parsed === null
      || (parsed as { version?: unknown }).version !== 2
      || (parsed as { ownerUserId?: unknown }).ownerUserId !== ownerUserId
      || !Number.isSafeInteger((parsed as { localRevision?: unknown }).localRevision)
      || (parsed as { localRevision: number }).localRevision < 1
      || !(
        typeof (parsed as { baseExists?: unknown }).baseExists === "boolean"
        || (parsed as { baseExists?: unknown }).baseExists === null
      )
      || !(
        typeof (parsed as { baseUpdatedAt?: unknown }).baseUpdatedAt === "string"
        || (parsed as { baseUpdatedAt?: unknown }).baseUpdatedAt === null
      )
      || !(
        (parsed as { baseRegistry?: unknown }).baseRegistry === null
        || isQualityHubRegistry((parsed as { baseRegistry?: unknown }).baseRegistry)
      )
      || !isQualityHubRegistry((parsed as { registry?: unknown }).registry)
    ) {
      return { status: "invalid" };
    }
    return { status: "ready", value: parsed as PendingOwnerSave };
  } catch {
    return { status: "invalid" };
  }
}

function writePendingOwnerSave(
  ownerUserId: string,
  localRevision: number,
  baseRevision: OwnerRegistryRevision | null,
  baseRegistry: QualityHubRegistryInput | null,
  registry: QualityHubRegistry,
) {
  const envelope: PendingOwnerSave = {
    version: 2,
    ownerUserId,
    localRevision,
    baseExists: baseRevision?.exists ?? null,
    baseUpdatedAt: baseRevision?.updatedAt ?? null,
    baseRegistry: baseRegistry === null ? null : structuredClone(baseRegistry),
    registry: structuredClone(registry),
  };
  window.localStorage.setItem(
    pendingOwnerSaveKey(ownerUserId),
    JSON.stringify(envelope),
  );
}

function clearPendingOwnerSave(
  ownerUserId: string,
  localRevision: number,
  registry: QualityHubRegistry,
) {
  const pending = readPendingOwnerSave(ownerUserId);
  if (
    pending.status === "ready"
    && pending.value.localRevision === localRevision
    && canonicalJsonEqual(pending.value.registry, registry)
  ) {
    try {
      window.localStorage.removeItem(pendingOwnerSaveKey(ownerUserId));
    } catch {
      // A confirmed database copy remains authoritative. If browser storage
      // cannot be cleared, the next hydration will recognize the exact match.
    }
  }
}

function refreshPendingOwnerSaveBase(
  ownerUserId: string,
  localRevision: number,
  registry: QualityHubRegistry,
  baseRevision: OwnerRegistryRevision,
  baseRegistry: QualityHubRegistryInput | null,
) {
  const pending = readPendingOwnerSave(ownerUserId);
  if (
    pending.status === "ready"
    && pending.value.localRevision === localRevision
    && canonicalJsonEqual(pending.value.registry, registry)
  ) {
    writePendingOwnerSave(
      ownerUserId,
      localRevision,
      baseRevision,
      baseRegistry,
      registry,
    );
  }
}

function settlePendingOwnerSave(
  ownerUserId: string,
  localRevision: number,
  registry: QualityHubRegistry,
  confirmedRevision: OwnerRegistryRevision,
) {
  const pending = readPendingOwnerSave(ownerUserId);
  if (pending.status !== "ready") return;
  if (
    pending.value.localRevision === localRevision
    && canonicalJsonEqual(pending.value.registry, registry)
  ) {
    clearPendingOwnerSave(ownerUserId, localRevision, registry);
    return;
  }
  if (
    pending.value.localRevision > localRevision
    && legacyChangeLogEqual(registry.changeLog, pending.value.registry.changeLog)
  ) {
    try {
      writePendingOwnerSave(
        ownerUserId,
        pending.value.localRevision,
        confirmedRevision,
        registry,
        pending.value.registry,
      );
    } catch {
      // The confirmed database write remains valid. The older pending envelope
      // is deliberately retained so a later hydration shows a conflict instead
      // of discarding the newer local change.
    }
  }
}

export default function UiAuditPage({
  migrationCaptureMode = false,
}: {
  migrationCaptureMode?: boolean;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inFlightSaveRef = useRef<Promise<void> | null>(null);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const ownerHydrationRequestRef = useRef(0);
  const hydratedOwnerUserIdRef = useRef<string | null | undefined>(undefined);
  const ownerRegistryRevisionRef = useRef<OwnerRegistryRevision | null>(null);
  const ownerRegistrySnapshotRef = useRef<QualityHubRegistryInput | null>(null);
  const ownerRecoveryBlockedOwnerRef = useRef<string | null>(null);
  const ownerRecoveryReloadOwnerRef = useRef<string | null>(null);
  const [preloadLocalStorageCapture] = useState(() => {
    if (typeof window === "undefined") return capturePreloadLocalStorage(null);
    try {
      return capturePreloadLocalStorage(window.localStorage);
    } catch {
      return capturePreloadLocalStorage(null);
    }
  });

  const [registry, setRegistry] = useState<QualityHubRegistry>(() => {
    if (migrationCaptureMode) return cloneInitialRegistry();
    if (typeof window === "undefined") return cloneInitialRegistry();
    // Browser storage is shared across signed-in owners. Never render that
    // unscoped snapshot while authentication or owner hydration is pending.
    if (authLoading || (isAuthenticated && user?.id)) return cloneInitialRegistry();
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return cloneInitialRegistry();
      const parsed = JSON.parse(raw);
      if (!isQualityHubRegistry(parsed)) return cloneInitialRegistry();
      return upgradeRegistry(parsed);
    } catch { return cloneInitialRegistry(); }
  });
  const registryRef = useRef(registry);
  const protectedLegacyChangeLogRef = useRef(
    cloneLegacyChangeLog(registry.changeLog),
  );
  const pendingPersistenceRef = useRef<{
    revision: number;
    registry: QualityHubRegistry;
    ownerUserId: string | null;
  } | null>(null);
  const persistenceSequenceRef = useRef(0);
  const consumedPersistenceRevisionRef = useRef(0);
  const { activeView, changelogCapability } = useMemo(
    () => readQualityHubQuery(location.search),
    [location.search],
  );
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
  const [ownerHydrationState, setOwnerHydrationState] = useState<OwnerHydrationState>(
    migrationCaptureMode ? "ready" : "waiting",
  );
  const [ownerRecoveryBlocked, setOwnerRecoveryBlocked] = useState(false);
  const [ownerHydrationEpoch, setOwnerHydrationEpoch] = useState(0);
  const [persistenceRevision, setPersistenceRevision] = useState(0);

  const cancelPendingPersistence = useCallback(() => {
    pendingPersistenceRef.current = null;
    consumedPersistenceRevisionRef.current = persistenceSequenceRef.current;
  }, []);

  useEffect(() => {
    if (migrationCaptureMode) return;

    const requestId = ownerHydrationRequestRef.current + 1;
    ownerHydrationRequestRef.current = requestId;
    cancelPendingPersistence();
    ownerRecoveryBlockedOwnerRef.current = null;
    setOwnerRecoveryBlocked(false);

    if (authLoading) {
      setOwnerHydrationState("waiting");
      return;
    }
    const nextOwnerUserId = isAuthenticated && user?.id ? user.id : null;
    const ownerIdentityChanged = hydratedOwnerUserIdRef.current !== undefined
      && hydratedOwnerUserIdRef.current !== nextOwnerUserId;
    hydratedOwnerUserIdRef.current = nextOwnerUserId;
    if (ownerIdentityChanged) {
      const safeRegistry = cloneInitialRegistry();
      protectedLegacyChangeLogRef.current = [];
      ownerRegistryRevisionRef.current = null;
      ownerRegistrySnapshotRef.current = null;
      registryRef.current = safeRegistry;
      setRegistry(safeRegistry);
    }
    if (!isAuthenticated || !user?.id) {
      ownerRegistryRevisionRef.current = null;
      ownerRegistrySnapshotRef.current = null;
      setOwnerHydrationState("ready");
      return;
    }

    setOwnerHydrationState("loading");
    ownerRegistryRevisionRef.current = null;
    ownerRegistrySnapshotRef.current = null;
    void supabase
      .from("quality_hub_registries")
      .select("registry, updated_at")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (ownerHydrationRequestRef.current !== requestId) return;
        if (error) {
          ownerRecoveryReloadOwnerRef.current = null;
          ownerRegistryRevisionRef.current = null;
          ownerRegistrySnapshotRef.current = null;
          setOwnerHydrationState("read-error");
          setImportFeedback(
            "Quality Hub could not read the owner database. Changes are disabled until the owner workspace can be verified.",
          );
          return;
        }
        const pendingOwnerSave = readPendingOwnerSave(user.id);
        setOwnerRecoveryBlocked(false);
        let recoveredRegistry: QualityHubRegistry | null = null;
        if (data) {
          const dbRegistry: unknown = data.registry;
          if (!isQualityHubRegistry(dbRegistry)) {
            ownerRecoveryReloadOwnerRef.current = null;
            ownerRegistryRevisionRef.current = null;
            ownerRegistrySnapshotRef.current = null;
            setOwnerHydrationState("read-error");
            setImportFeedback(
              "The owner database contains an invalid Quality Hub registry. Changes are disabled until the owner workspace can be verified.",
            );
            return;
          }
          let hydratedRegistry = upgradeRegistry(dbRegistry);
          const protectedLegacyChangeLog = cloneLegacyChangeLog(
            dbRegistry.changeLog,
          );
          const hydratedRevision: OwnerRegistryRevision = {
            userId: user.id,
            exists: true,
            updatedAt: typeof data.updated_at === "string" ? data.updated_at : null,
          };
          protectedLegacyChangeLogRef.current = protectedLegacyChangeLog;
          ownerRegistryRevisionRef.current = hydratedRevision;
          ownerRegistrySnapshotRef.current = structuredClone(dbRegistry);

          if (pendingOwnerSave.status === "invalid") {
            ownerRecoveryBlockedOwnerRef.current = user.id;
            setOwnerRecoveryBlocked(true);
            setImportFeedback(
              "Quality Hub found an unreadable unsaved local change for this owner. It was not applied or deleted; use the recovery controls below before making another change.",
            );
          } else if (pendingOwnerSave.status === "ready") {
            if (canonicalJsonEqual(pendingOwnerSave.value.registry, dbRegistry)) {
              clearPendingOwnerSave(
                user.id,
                pendingOwnerSave.value.localRevision,
                pendingOwnerSave.value.registry,
              );
            } else if (
              pendingOwnerSave.value.baseExists === true
              && pendingOwnerSave.value.baseUpdatedAt === hydratedRevision.updatedAt
              && pendingOwnerSave.value.baseRegistry !== null
              && canonicalJsonEqual(
                pendingOwnerSave.value.baseRegistry,
                dbRegistry,
              )
              && legacyChangeLogEqual(
                protectedLegacyChangeLog,
                pendingOwnerSave.value.registry.changeLog,
              )
            ) {
              hydratedRegistry = upgradeRegistry(pendingOwnerSave.value.registry);
              recoveredRegistry = hydratedRegistry;
              setImportFeedback(
                "Quality Hub recovered an unsaved local change against the same owner revision and is retrying its guarded database save.",
              );
            } else {
              ownerRecoveryBlockedOwnerRef.current = user.id;
              setOwnerRecoveryBlocked(true);
              setImportFeedback(
                "Quality Hub preserved an unsaved local change but did not apply it because the owner database changed. Use the recovery controls below before making another change.",
              );
            }
          }
          registryRef.current = hydratedRegistry;
          setRegistry(hydratedRegistry);
        } else {
          // Browser storage is not owner-scoped. Once an authenticated read proves
          // this owner has no row, start from a clean workspace instead of adopting
          // data that may have been left by a different signed-in owner.
          let safeRegistry = cloneInitialRegistry();
          protectedLegacyChangeLogRef.current = [];
          const hydratedRevision: OwnerRegistryRevision = {
            userId: user.id,
            exists: false,
            updatedAt: null,
          };
          ownerRegistryRevisionRef.current = hydratedRevision;
          ownerRegistrySnapshotRef.current = null;

          if (pendingOwnerSave.status === "invalid") {
            ownerRecoveryBlockedOwnerRef.current = user.id;
            setOwnerRecoveryBlocked(true);
            setImportFeedback(
              "Quality Hub found an unreadable unsaved local change for this owner. It was not applied or deleted; use the recovery controls below before making another change.",
            );
          } else if (pendingOwnerSave.status === "ready") {
            if (canonicalJsonEqual(pendingOwnerSave.value.registry, safeRegistry)) {
              clearPendingOwnerSave(
                user.id,
                pendingOwnerSave.value.localRevision,
                pendingOwnerSave.value.registry,
              );
            } else if (
              pendingOwnerSave.value.baseExists === false
              && pendingOwnerSave.value.baseRegistry === null
              && legacyChangeLogEqual([], pendingOwnerSave.value.registry.changeLog)
            ) {
              safeRegistry = upgradeRegistry(pendingOwnerSave.value.registry);
              recoveredRegistry = safeRegistry;
              setImportFeedback(
                "Quality Hub recovered an unsaved local change for this new owner and is retrying its guarded database save.",
              );
            } else {
              ownerRecoveryBlockedOwnerRef.current = user.id;
              setOwnerRecoveryBlocked(true);
              setImportFeedback(
                "Quality Hub preserved an unsaved local change but could not verify it against this missing owner row. Use the recovery controls below before making another change.",
              );
            }
          }
          registryRef.current = safeRegistry;
          setRegistry(safeRegistry);
        }
        setOwnerHydrationState("ready");
        if (
          ownerRecoveryReloadOwnerRef.current === user.id
          && ownerRecoveryBlockedOwnerRef.current !== user.id
        ) {
          ownerRecoveryReloadOwnerRef.current = null;
          setImportFeedback(
            "Discarded the unsaved recovery copy. Quality Hub reloaded the current owner database version and enabled changes.",
          );
        }
        if (recoveredRegistry) {
          const revision = persistenceSequenceRef.current + 1;
          persistenceSequenceRef.current = revision;
          pendingPersistenceRef.current = {
            revision,
            registry: recoveredRegistry,
            ownerUserId: user.id,
          };
          setPersistenceRevision(revision);
        }
      });

    return () => {
      if (ownerHydrationRequestRef.current === requestId) {
        ownerHydrationRequestRef.current += 1;
      }
    };
  }, [authLoading, cancelPendingPersistence, isAuthenticated, migrationCaptureMode, ownerHydrationEpoch, user?.id]);

  // Save to localStorage immediately, then serialize owner-database writes behind
  // the exact owner row that this page actually hydrated.
  const saveToDb = useCallback((
    reg: QualityHubRegistry,
    localRevision: number,
  ): Promise<void> => {
    if (migrationCaptureMode) {
      return Promise.reject(new Error(
        "Quality Hub registry writes are locked for Changelog migration capture.",
      ));
    }
    if (ownerHydrationState !== "ready" || !isAuthenticated || !user?.id) {
      return Promise.resolve();
    }

    const ownerUserId = user.id;
    const queuedSave = saveQueueRef.current
      .catch(() => undefined)
      .then(async () => {
        if (ownerRecoveryBlockedOwnerRef.current === ownerUserId) {
          throw new Error(
            "Quality Hub database save was stopped because an unsaved recovery copy needs review.",
          );
        }
        const expectedRevision = ownerRegistryRevisionRef.current;
        const expectedSnapshot = ownerRegistrySnapshotRef.current;
        if (
          !expectedRevision
          || expectedRevision.userId !== ownerUserId
          || hydratedOwnerUserIdRef.current !== ownerUserId
        ) {
          throw new Error(
            "Quality Hub database save was stopped because the active owner changed. Reload before trying again.",
          );
        }
        if (!legacyChangeLogEqual(
          protectedLegacyChangeLogRef.current,
          reg.changeLog,
        )) {
          throw new Error(
            "Quality Hub database save was blocked because it would change the read-only legacy Changelog.",
          );
        }
        refreshPendingOwnerSaveBase(
          ownerUserId,
          localRevision,
          reg,
          expectedRevision,
          expectedSnapshot,
        );

        const { data: currentRow, error: currentRowError } = await supabase
          .from("quality_hub_registries")
          .select("registry, updated_at")
          .eq("user_id", ownerUserId)
          .maybeSingle();
        if (currentRowError) {
          throw new Error(
            "Quality Hub could not recheck the owner database, so the save was stopped.",
          );
        }
        if (ownerRegistryRevisionRef.current !== expectedRevision) {
          throw new Error(
            "Quality Hub database save was stopped because a newer local save finished first.",
          );
        }

        if (expectedRevision.exists) {
          const currentRegistry: unknown = currentRow?.registry;
          const currentUpdatedAt = typeof currentRow?.updated_at === "string"
            ? currentRow.updated_at
            : null;
          if (
            !currentRow
            || !isQualityHubRegistry(currentRegistry)
            || currentUpdatedAt !== expectedRevision.updatedAt
            || !expectedSnapshot
            || !canonicalJsonEqual(currentRegistry, expectedSnapshot)
            || !legacyChangeLogEqual(
              protectedLegacyChangeLogRef.current,
              currentRegistry.changeLog,
            )
          ) {
            throw new Error(
              "Quality Hub detected newer owner data and refused to overwrite it. Reload before saving again.",
            );
          }
        } else if (currentRow != null) {
          throw new Error(
            "Quality Hub detected a newly created owner record and refused to overwrite it. Reload before saving again.",
          );
        }

        const updatedAt = new Date().toISOString();
        let confirmedRow: { registry: Json; updated_at: string | null };
        if (expectedRevision.exists) {
          const baseUpdate = supabase
            .from("quality_hub_registries")
            .update({
              registry: reg as unknown as Json,
              updated_at: updatedAt,
            })
            .eq("user_id", ownerUserId);
          const revisionUpdate = expectedRevision.updatedAt === null
            ? baseUpdate.is("updated_at", null)
            : baseUpdate.eq("updated_at", expectedRevision.updatedAt);
          const { data, error } = await revisionUpdate
            .select("registry, updated_at")
            .maybeSingle();
          if (error || !data) {
            throw new Error(
              "Quality Hub detected a concurrent owner update and refused to overwrite it. Reload before saving again.",
            );
          }
          confirmedRow = data;
        } else {
          const { data, error } = await supabase
            .from("quality_hub_registries")
            .insert({
              user_id: ownerUserId,
              registry: reg as unknown as Json,
              updated_at: updatedAt,
            })
            .select("registry, updated_at")
            .single();
          if (error || !data) {
            throw new Error(
              "Quality Hub could not create the owner record without overwriting newer data. Reload before trying again.",
            );
          }
          confirmedRow = data;
        }

        if (
          !isQualityHubRegistry(confirmedRow.registry)
          || !canonicalJsonEqual(confirmedRow.registry, reg)
          || typeof confirmedRow.updated_at !== "string"
          || !legacyChangeLogEqual(
            protectedLegacyChangeLogRef.current,
            confirmedRow.registry.changeLog,
          )
        ) {
          throw new Error(
            "Quality Hub could not verify the saved owner data, so this page will not treat the save as current. Reload before making another change.",
          );
        }
        const confirmedRevision: OwnerRegistryRevision = {
          userId: ownerUserId,
          exists: true,
          updatedAt: confirmedRow.updated_at,
        };
        settlePendingOwnerSave(
          ownerUserId,
          localRevision,
          reg,
          confirmedRevision,
        );
        if (
          hydratedOwnerUserIdRef.current !== ownerUserId
          || ownerRegistryRevisionRef.current !== expectedRevision
        ) {
          return;
        }
        ownerRegistryRevisionRef.current = confirmedRevision;
        ownerRegistrySnapshotRef.current = structuredClone(reg);
      });

    saveQueueRef.current = queuedSave;
    inFlightSaveRef.current = queuedSave;
    queuedSave.then(
      () => {
        if (inFlightSaveRef.current === queuedSave) inFlightSaveRef.current = null;
      },
      () => {
        if (inFlightSaveRef.current === queuedSave) inFlightSaveRef.current = null;
      },
    );
    return queuedSave;
  }, [isAuthenticated, migrationCaptureMode, ownerHydrationState, user?.id]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (migrationCaptureMode) return;
    if (persistenceRevision === 0) return;
    if (ownerHydrationState === "waiting" || ownerHydrationState === "loading") return;
    const pending = pendingPersistenceRef.current;
    if (!pending || pending.revision !== persistenceRevision) return;
    if (consumedPersistenceRevisionRef.current >= pending.revision) return;
    const currentOwnerUserId = isAuthenticated && user?.id ? user.id : null;
    if (pending.ownerUserId !== currentOwnerUserId) {
      consumedPersistenceRevisionRef.current = pending.revision;
      pendingPersistenceRef.current = null;
      return;
    }
    consumedPersistenceRevisionRef.current = pending.revision;
    pendingPersistenceRef.current = null;
    if (pending.ownerUserId === null) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(pending.registry));
    } catch {
      setImportFeedback(
        "Quality Hub could not update its general browser copy. The owner-specific recovery copy remains available while the database save is verified.",
      );
    }

    // Quality Hub actions are low-frequency manual operations. Start the guarded
    // owner save immediately so navigation cannot silently cancel a pending edit.
    void saveToDb(pending.registry, pending.revision).catch((error: unknown) => {
      if (hydratedOwnerUserIdRef.current === pending.ownerUserId) {
        ownerRecoveryBlockedOwnerRef.current = pending.ownerUserId;
        setOwnerRecoveryBlocked(true);
        setImportFeedback(
          error instanceof Error
            ? error.message
            : "Quality Hub database save was stopped.",
        );
      }
    });
  }, [isAuthenticated, migrationCaptureMode, ownerHydrationState, persistenceRevision, saveToDb, user?.id]);

  const persistUserRegistry = useCallback((nextRegistry: QualityHubRegistry): boolean => {
    const guarded = guardQualityHubRegistryUpdate(
      protectedLegacyChangeLogRef.current,
      nextRegistry,
    );
    if (!guarded.accepted) {
      setImportFeedback(guarded.reason);
      return false;
    }
    const revision = persistenceSequenceRef.current + 1;
    const ownerUserId = isAuthenticated && user?.id ? user.id : null;
    if (
      ownerRecoveryBlocked
      || (ownerUserId !== null && ownerRecoveryBlockedOwnerRef.current === ownerUserId)
    ) {
      setImportFeedback(
        "Quality Hub did not accept the change because an older unsaved recovery copy still needs review. Download or discard that copy before making another change.",
      );
      return false;
    }
    if (
      ownerHydrationState !== "ready"
      || hydratedOwnerUserIdRef.current !== ownerUserId
      || (
        ownerUserId !== null
        && ownerRegistryRevisionRef.current?.userId !== ownerUserId
      )
    ) {
      setImportFeedback(
        "Quality Hub did not accept the change because the active owner workspace is not ready. Reload and try again after the owner database finishes loading.",
      );
      return false;
    }
    if (ownerUserId) {
      try {
        writePendingOwnerSave(
          ownerUserId,
          revision,
          ownerRegistryRevisionRef.current,
          ownerRegistrySnapshotRef.current,
          guarded.registry,
        );
      } catch {
        setImportFeedback(
          "Quality Hub could not create its owner-specific recovery copy, so the change was not accepted. Free browser storage and try again.",
        );
        return false;
      }
    } else {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(guarded.registry));
      } catch {
        setImportFeedback(
          "Quality Hub could not save the signed-out local workspace, so the change was not accepted. Free browser storage and try again.",
        );
        return false;
      }
    }
    registryRef.current = guarded.registry;
    setRegistry(guarded.registry);
    persistenceSequenceRef.current = revision;
    pendingPersistenceRef.current = {
      revision,
      registry: guarded.registry,
      ownerUserId,
    };
    setPersistenceRevision(revision);
    return true;
  }, [isAuthenticated, ownerHydrationState, ownerRecoveryBlocked, user?.id]);

  const updateRegistry = useCallback((
    updater: (p: QualityHubRegistry) => QualityHubRegistry,
  ): boolean => {
    const activeOwnerUserId = isAuthenticated && user?.id ? user.id : null;
    if (migrationCaptureMode) {
      setImportFeedback("Quality Hub writes are locked until the Changelog migration capture is complete.");
      return false;
    }
    if (
      ownerRecoveryBlocked
      || (
        activeOwnerUserId !== null
        && ownerRecoveryBlockedOwnerRef.current === activeOwnerUserId
      )
    ) {
      setImportFeedback(
        "Quality Hub did not accept the change because an older unsaved recovery copy still needs review. Download or discard that copy before making another change.",
      );
      return false;
    }
    if (
      ownerHydrationState !== "ready"
      || hydratedOwnerUserIdRef.current !== activeOwnerUserId
    ) {
      setImportFeedback(
        ownerHydrationState === "read-error"
          ? "Quality Hub cannot accept changes because the owner database could not be verified. Reload and try again after the database read succeeds."
          : "Quality Hub is still loading the active owner workspace. Try again when loading finishes.",
      );
      return false;
    }
    const updaterInput = withLegacyChangeLog(
      registryRef.current,
      protectedLegacyChangeLogRef.current,
    );
    const nextRegistry = nextRegistryWithTimestamp(
      normalizeActiveQualityHubRegistry(updater(updaterInput)),
    );
    return persistUserRegistry(nextRegistry);
  }, [isAuthenticated, migrationCaptureMode, ownerHydrationState, ownerRecoveryBlocked, persistUserRegistry, user?.id]);

  const waitForPendingRegistrySave = useCallback(async () => {
    if (inFlightSaveRef.current) await inFlightSaveRef.current;
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
            new Set(linkedModules.flatMap((module) => module.checklist.loggingTargets).map((target) => (
              target === "change-log" ||
              target === "knowledge-base-current-work" ||
              target === "chronicle-records-if-triggered"
                ? "Chronicle records only when the Work Manual trigger applies"
                : target.replace(/-/g, " ")
            ))),
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

  const handleExport = () => {
    if (migrationCaptureMode) {
      setImportFeedback("Use the authenticated migration export on this internal capture route.");
      return;
    }
    const snapshot = nextRegistryWithTimestamp(withLegacyChangeLog(
      registryRef.current,
      protectedLegacyChangeLogRef.current,
    ));
    downloadJson(
      `chronicle-quality-hub-${toCompactIso()}.json`,
      buildQualityHubTransferPackage(snapshot),
    );
    setImportFeedback(
      "Exported Quality Hub workspace data without saving. Its embedded legacy Changelog remains read-only.",
    );
  };
  const handleDownloadOwnerRecovery = () => {
    const ownerUserId = isAuthenticated && user?.id ? user.id : null;
    if (
      !ownerUserId
      || ownerHydrationState !== "ready"
      || hydratedOwnerUserIdRef.current !== ownerUserId
    ) {
      setImportFeedback("The active owner does not match the locked recovery copy. Wait for owner loading to finish before using recovery controls.");
      return;
    }
    try {
      const raw = window.localStorage.getItem(pendingOwnerSaveKey(ownerUserId));
      if (raw === null) {
        setImportFeedback("The owner recovery copy is no longer present. Reload before making another change.");
        return;
      }
      downloadText(
        `chronicle-quality-hub-owner-recovery-${toCompactIso()}.json`,
        raw,
      );
      setImportFeedback(
        "Downloaded the exact unsaved owner recovery copy. Quality Hub remains locked until that copy is explicitly discarded or safely reconciled.",
      );
    } catch {
      setImportFeedback(
        "Quality Hub could not read or download the owner recovery copy. It remains locked and was not deleted.",
      );
    }
  };
  const handleDiscardOwnerRecovery = () => {
    const ownerUserId = isAuthenticated && user?.id ? user.id : null;
    if (
      !ownerUserId
      || ownerHydrationState !== "ready"
      || hydratedOwnerUserIdRef.current !== ownerUserId
    ) {
      setImportFeedback("The active owner does not match the locked recovery copy. Wait for owner loading to finish before using recovery controls.");
      return;
    }
    const confirmed = window.confirm(
      "Discard the preserved unsaved Quality Hub recovery copy and continue with the owner database version? Download the recovery copy first if you may need it.",
    );
    if (!confirmed) return;
    try {
      window.localStorage.removeItem(pendingOwnerSaveKey(ownerUserId));
      ownerRecoveryReloadOwnerRef.current = ownerUserId;
      setOwnerHydrationState("loading");
      setImportFeedback(
        "Discarded the unsaved recovery copy. Quality Hub is reloading the owner database before changes are enabled.",
      );
      setOwnerHydrationEpoch((current) => current + 1);
    } catch {
      setImportFeedback(
        "Quality Hub could not discard the owner recovery copy. It remains locked and the recovery data was not intentionally deleted.",
      );
    }
  };
  const handleImportClick = () => {
    if (migrationCaptureMode) {
      setImportFeedback("Generic Quality Hub imports are disabled during migration capture.");
      return;
    }
    fileInputRef.current?.click();
  };
  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    const importOwnerRequestId = ownerHydrationRequestRef.current;
    const importOwnerUserId = hydratedOwnerUserIdRef.current;
    const importOwnerRevision = ownerRegistryRevisionRef.current;
    if (migrationCaptureMode) {
      setImportFeedback("Generic Quality Hub imports are disabled during migration capture.");
      event.target.value = "";
      return;
    }
    if (ownerHydrationState !== "ready") {
      setImportFeedback(
        "Import cancelled because the owner workspace is still loading. Choose the file again after loading finishes.",
      );
      event.target.value = "";
      return;
    }
    try {
      const text = await file.text(); const parsed = JSON.parse(text);
      if (
        ownerHydrationRequestRef.current !== importOwnerRequestId
        || hydratedOwnerUserIdRef.current !== importOwnerUserId
        || ownerRegistryRevisionRef.current !== importOwnerRevision
      ) {
        setImportFeedback(
          "Import cancelled because the active owner changed while the file was being read. Choose the file again after loading finishes.",
        );
        return;
      }
      const candidate = isQualityHubRegistry(parsed) ? parsed : isQualityHubRegistry(parsed?.registry) ? parsed.registry : null;
      if (!candidate) { setImportFeedback("Import failed: not a valid Quality Hub registry."); return; }
      const prepared = prepareQualityHubWorkspaceImport(
        registryRef.current,
        protectedLegacyChangeLogRef.current,
        candidate,
      );
      if (!prepared.accepted) {
        setImportFeedback(prepared.reason);
        return;
      }
      const nextRegistry = nextRegistryWithTimestamp(
        normalizeActiveQualityHubRegistry(prepared.registry),
      );
      if (!persistUserRegistry(nextRegistry)) return;
      setImportFeedback(
        isAuthenticated
          ? `Imported Quality Hub workspace data from ${file.name}. Its guarded owner-database save is being verified, and the read-only legacy Changelog was unchanged.`
          : `Imported Quality Hub workspace data from ${file.name} into the local workspace. The read-only legacy Changelog was unchanged.`,
      );
    } catch { setImportFeedback("Import failed: could not parse JSON."); } finally { event.target.value = ""; }
  };
  const handleAgentDraft = (patch: Partial<QualityAgent>) => { setAgentDraft((p) => { const next = { ...p, ...patch }; return { ...next, id: makeAgentId(next.agentName, next.modelName) }; }); };
  const logRunSnapshot = () => {
    const now = new Date().toISOString(); const runId = newId("run");
    const accepted = updateRegistry((p) => ({ ...p, runs: [{ id: runId, name: `Manual Snapshot ${new Date(now).toLocaleString()}`, profile: "standard" as const, status: "completed" as const, startedAt: now, finishedAt: now, agent: agentDraft, scope: ["src"], summary: summarizeRun(p.findings, 0), notes: "Manual snapshot captured from dashboard." }, ...p.runs], meta: { ...p.meta, lastRunId: runId, lastUpdatedAt: now } }));
    if (accepted) {
      setImportFeedback(
        isAuthenticated
          ? "Run snapshot added to this workspace. Its guarded owner-database save is being verified."
          : "Run snapshot saved to the local workspace.",
      );
    }
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
  const setActiveView = useCallback((nextView: HubViewId) => {
    const params = new URLSearchParams(location.search);
    if (nextView === "overview") {
      params.delete("view");
    } else {
      params.set("view", nextView);
    }
    if (nextView !== "changelog" || activeView !== "changelog") {
      params.delete("capability");
    }
    const search = params.toString();
    navigate(
      {
        pathname: location.pathname,
        search: search ? `?${search}` : "",
      },
      { replace: false },
    );
  }, [activeView, location.pathname, location.search, navigate]);

  const activeViewMeta = HUB_VIEWS.find((v) => v.id === activeView) || HUB_VIEWS[0];
  const activeOwnerUserId = isAuthenticated && user?.id ? user.id : null;
  const writeControlsDisabled = migrationCaptureMode
    || ownerHydrationState !== "ready"
    || hydratedOwnerUserIdRef.current !== activeOwnerUserId
    || ownerRecoveryBlocked;

  return (
    <div className="min-h-screen bg-[#111113] text-[#eaedf1]">
      <input ref={fileInputRef} type="file" accept="application/json" className="hidden" disabled={writeControlsDisabled} onChange={handleImportFile} />
      <header className="flex-shrink-0 min-h-16 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-2 px-4 py-2 lg:h-16 lg:flex-nowrap lg:px-8 lg:py-0 shadow-sm">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate('/?tab=admin')} className="p-2 text-[hsl(var(--ui-surface-2))] hover:bg-slate-100 rounded-full transition-colors" aria-label="Go back" title="Go back">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <h1 className="text-lg font-black text-[hsl(var(--ui-surface-2))] uppercase tracking-tight">Quality Hub</h1>
        </div>
        <div className="flex max-w-full flex-wrap items-center justify-end gap-2 lg:flex-nowrap lg:gap-3">
          <button type="button" onClick={() => setShowHowToUse(true)} className="inline-flex items-center gap-2 justify-center h-10 px-5 rounded-xl border border-[hsl(var(--ui-border))] bg-[hsl(var(--ui-surface-2))] text-[hsl(var(--ui-text))] shadow-[0_10px_30px_rgba(0,0,0,0.35)] hover:brightness-125 active:brightness-150 transition-all active:scale-95 text-[10px] font-bold leading-none uppercase tracking-wider">How to Use</button>
          <button type="button" disabled={writeControlsDisabled} onClick={handleImportClick} className="inline-flex items-center gap-2 justify-center h-10 px-5 rounded-xl border border-[hsl(var(--ui-border))] bg-[hsl(var(--ui-surface-2))] text-[hsl(var(--ui-text))] shadow-[0_10px_30px_rgba(0,0,0,0.35)] hover:brightness-125 active:brightness-150 transition-all active:scale-95 text-[10px] font-bold leading-none uppercase tracking-wider disabled:cursor-not-allowed disabled:opacity-40" title="Import Quality Hub workspace data without changing Changelog history.">Import Workspace</button>
          <button type="button" disabled={writeControlsDisabled} onClick={handleExport} className="inline-flex items-center gap-2 justify-center h-10 px-5 rounded-xl border border-[hsl(var(--ui-border))] bg-[hsl(var(--ui-surface-2))] text-[hsl(var(--ui-text))] shadow-[0_10px_30px_rgba(0,0,0,0.35)] hover:brightness-125 active:brightness-150 transition-all active:scale-95 text-[10px] font-bold leading-none uppercase tracking-wider disabled:cursor-not-allowed disabled:opacity-40" title={migrationCaptureMode ? "Use the authenticated migration export below." : "Export Quality Hub workspace data without saving or changing Changelog history."}>Export Workspace</button>
          <button type="button" disabled={writeControlsDisabled} onClick={logRunSnapshot} className="inline-flex items-center gap-2 justify-center h-10 px-5 rounded-xl border border-[hsl(var(--ui-border))] bg-[hsl(var(--ui-surface-2))] text-[hsl(var(--ui-text))] shadow-[0_10px_30px_rgba(0,0,0,0.35)] hover:brightness-125 active:brightness-150 transition-all active:scale-95 text-[10px] font-bold leading-none uppercase tracking-wider disabled:cursor-not-allowed disabled:opacity-40">Log Snapshot</button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1480px] space-y-6 px-4 py-6 md:px-8 md:py-8">
        {migrationCaptureMode ? (
          <QualityHubChangelogMigrationCapture
            authLoading={authLoading}
            isAuthenticated={isAuthenticated}
            authenticatedUserId={user?.id ?? null}
            preloadLocalStorage={preloadLocalStorageCapture}
            beforeOwnerRead={waitForPendingRegistrySave}
          />
        ) : null}

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
          {ownerRecoveryBlocked ? (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-[#dc2626] bg-[#2b1719] p-4 text-sm text-[#f4d7d9]"
            >
              <div className="font-black text-white">Unsaved owner recovery needs review</div>
              <p className="mt-1 max-w-4xl text-xs leading-5">
                Quality Hub has locked all writes so a newer action cannot overwrite the preserved recovery copy. Download that exact copy before choosing to discard it; Chronicle will then reload the current owner database version before enabling changes.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={ownerHydrationState !== "ready" || hydratedOwnerUserIdRef.current !== activeOwnerUserId}
                  onClick={handleDownloadOwnerRecovery}
                  className={cn(neutralButtonClass, "disabled:cursor-not-allowed disabled:opacity-40")}
                >
                  Download Unsaved Recovery
                </button>
                <button
                  type="button"
                  disabled={ownerHydrationState !== "ready" || hydratedOwnerUserIdRef.current !== activeOwnerUserId}
                  onClick={handleDiscardOwnerRecovery}
                  className="rounded-xl border border-[#dc2626] bg-[#3a1b1f] px-4 py-2 text-xs font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Discard Recovery and Use Database Version
                </button>
              </div>
            </div>
          ) : null}
        </div></section>

        {/* Nav */}
        <section className={panelOuterClass}>
          <div className={panelHeaderClass}><div className={panelHeaderOverlayClass} /><h2 className="relative z-10 text-[20px] font-semibold tracking-tight text-white">Quality Hub Navigation</h2></div>
          <div className={panelBodyClass}><div className={panelInnerClass}>
            <div className="grid gap-2 md:grid-cols-4">
              {HUB_VIEWS.map((v) => (
                <button key={v.id} type="button" aria-current={activeView === v.id ? "page" : undefined} onClick={() => setActiveView(v.id)} className={cn("rounded-xl border-none px-3 py-3 text-left transition shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)]", activeView === v.id ? "bg-[linear-gradient(180deg,#5a7292_0%,#4a5f7f_100%)] text-white" : "bg-[#3c3e47] hover:brightness-110")}>
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
                              {row.logTargets.length > 0
                                ? row.logTargets.join(" • ")
                                : "Issue Registry • Scan Runs • capability Current Work"}
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
              title="Recent Repository Changes Preview"
              badge={
                <button
                  type="button"
                  onClick={() => setActiveView("changelog")}
                  className={neutralButtonClass}
                >
                  Open Changelog
                </button>
              }
            >
              <div className={cn(recessedStripClass, "mb-3 p-3 text-xs text-[#a1a1aa]")}>
                This is a five-record preview from Chronicle&apos;s repository-owned
                Changelog. Open an individual complete record for its full history,
                or open the Changelog view for the complete chronological list.
              </div>
              <ChangelogRecordList
                limit={5}
                mode="preview"
                detailScope="global"
                detailOrigin="quality-hub-overview"
                scopeLabel="Newest records currently in the canonical Chronicle Changelog."
                emptyMessage="No canonical Chronicle Changelog records are currently recorded."
              />
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
              <div className="rounded-xl border-2 border-dashed border-[#71717a] bg-[linear-gradient(to_bottom_right,#27272a,#18181b)] px-4 py-10 text-center text-sm text-[#a1a1aa]">No findings yet. Import a workspace JSON package to start.</div>
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
                          {requiresLovableSupabaseChange(f) && (
                            <span
                              className={lovableSupabaseBadgeClass}
                              title="This finding requires Lovable to apply or verify live Supabase database, RLS, RPC, or storage changes."
                            >
                              Lovable Supabase Change Required
                            </span>
                          )}
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
                          <select disabled={writeControlsDisabled} value={f.status} onChange={(e) => updateFindingStatus(f.id, e.target.value as QualityFinding["status"])} className={cn(selectClass, "disabled:cursor-not-allowed disabled:opacity-40")}>{QUALITY_FINDING_STATUS.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}</select>
                          <select disabled={writeControlsDisabled} value={f.verificationStatus} onChange={(e) => updateVerification(f.id, e.target.value as QualityFinding["verificationStatus"])} className={cn(selectClass, "disabled:cursor-not-allowed disabled:opacity-40")}>{QUALITY_VERIFICATION_STATUS.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}</select>
                          <button type="button" disabled={writeControlsDisabled} onClick={() => addCommentToFinding(f.id)} className={cn(neutralButtonClass, "disabled:cursor-not-allowed disabled:opacity-40")}>Add Comment</button>
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
              <button type="button" disabled={writeControlsDisabled} onClick={logRunSnapshot} className={cn(subtleButtonClass, "disabled:cursor-not-allowed disabled:opacity-40")}>Log Run Snapshot</button>
            </div>
            <div className={cn(recessedBlockClass, "mt-4 p-3")}><div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#a1a1aa]">Known Agents</div><div className="mt-2 space-y-1">{allAgents.map((a) => <div key={a.id} className="text-xs text-[#a1a1aa]">{a.agentName} <span className="text-[#71717a]">({a.modelName})</span></div>)}</div></div>
            </Section>
            <Section title="Scan Run History"><div className="overflow-x-auto rounded-xl border border-[#4a5f7f]/45">
              <table className="w-full min-w-[720px] border-collapse"><thead className="bg-[#1a2030]"><tr><th className="px-3 py-2 text-left text-[10px] font-black uppercase tracking-[0.16em] text-[#a1a1aa]">Run</th><th className="px-3 py-2 text-left text-[10px] font-black uppercase tracking-[0.16em] text-[#a1a1aa]">Agent</th><th className="px-3 py-2 text-left text-[10px] font-black uppercase tracking-[0.16em] text-[#a1a1aa]">Profile</th><th className="px-3 py-2 text-left text-[10px] font-black uppercase tracking-[0.16em] text-[#a1a1aa]">Summary</th><th className="px-3 py-2 text-left text-[10px] font-black uppercase tracking-[0.16em] text-[#a1a1aa]">Finished</th></tr></thead>
              <tbody>{registry.runs.length === 0 ? <tr><td className="px-3 py-4 text-xs text-[#71717a]" colSpan={5}>No run history yet.</td></tr> : registry.runs.map((r) => <tr key={r.id} className="border-t border-[#4a5f7f]/25 bg-[#1a2030]"><td className="px-3 py-3 text-xs text-[#e4e4e7]"><div className="font-bold text-[#eaedf1]">{r.name}</div><div className="font-mono text-[11px] text-[#71717a]">{r.id}</div></td><td className="px-3 py-3 text-xs text-[#a1a1aa]">{r.agent.agentName}</td><td className="px-3 py-3 text-xs uppercase text-[#a1a1aa]">{r.profile}</td><td className="px-3 py-3 text-xs text-[#a1a1aa]">total {r.summary.findingsTotal} • open {r.summary.open}</td><td className="px-3 py-3 text-xs text-[#a1a1aa]">{formatDate(r.finishedAt)}</td></tr>)}</tbody></table>
            </div></Section>
          </div>
        )}

        {/* Changelog */}
        {activeView === "changelog" && (
          <CanonicalChangeLogView capability={changelogCapability} />
        )}
      </div>
      <QualityHubHowToModal open={showHowToUse} onClose={() => setShowHowToUse(false)} />
    </div>
  );
}
