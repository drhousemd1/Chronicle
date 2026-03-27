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
  { id: "findings", label: "Findings", description: "Detailed issue ledger" },
  { id: "runs", label: "Runs", description: "Run history and agent setup" },
  { id: "changelog", label: "Change Log", description: "Development change history and fix log" },
];

const severityBadgeClass: Record<string, string> = {
  critical: "bg-[#2f3137] text-[#eaedf1] border border-[#dc2626]",
  high: "bg-[#2f3137] text-[#eaedf1] border border-[#f59e0b]",
  medium: "bg-[#2f3137] text-[#eaedf1] border border-[#3b82f6]",
  low: "bg-[#2f3137] text-[#a5f3fc] border border-[#22B8C9]",
  stylistic: "bg-[#3f3f46] text-[#eaedf1] border border-[rgba(255,255,255,0.20)]",
};
const moduleStatusClass: Record<string, string> = {
  "not-started": "bg-[#3f3f46] text-[#a1a1aa]",
  "in-progress": "bg-[#2f3137] text-[#a5f3fc] border border-[#3b82f6]",
  completed: "bg-[#2f3137] text-[#a5f3fc] border border-[#22B8C9]",
  blocked: "bg-[#2f3137] text-[#eaedf1] border border-[#dc2626]",
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

  // Baseline scan data is versioned in code. When seed version increases,
  // replace stale persisted snapshots so module/status + finding set stays authoritative.
  return seed;
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

  const updateRegistry = (updater: (p: QualityHubRegistry) => QualityHubRegistry) => { setRegistry((p) => nextRegistryWithTimestamp(updater(p))); };

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
  const dominantDomain = Object.entries(domainCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "n/a";

  // Helper: get the finished timestamp for a completed scan module
  const getModuleCompletedDate = (lastRunId?: string): string | null => {
    if (!lastRunId) return null;
    const run = registry.runs.find((r) => r.id === lastRunId);
    return run?.finishedAt || null;
  };

  const handleReset = async () => {
    if (!window.confirm("Reset Quality Hub and remove all current runs/findings?")) return;
    const fresh = cloneInitialRegistry();
    setRegistry(fresh);
    setImportFeedback("Quality Hub reset to clean baseline.");
    // Also reset DB
    if (isAuthenticated && user?.id) {
      await (supabase as any).from("quality_hub_registries").delete().eq("user_id", user.id);
    }
  };
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
          <button type="button" onClick={handleImportClick} className="inline-flex items-center gap-2 justify-center h-10 px-5 rounded-xl border border-[hsl(var(--ui-border))] bg-[hsl(var(--ui-surface-2))] text-[hsl(var(--ui-text))] shadow-[0_10px_30px_rgba(0,0,0,0.35)] hover:brightness-125 active:brightness-150 transition-all active:scale-95 text-[10px] font-bold leading-none uppercase tracking-wider">Import</button>
          <button type="button" onClick={handleExport} className="inline-flex items-center gap-2 justify-center h-10 px-5 rounded-xl border border-[hsl(var(--ui-border))] bg-[hsl(var(--ui-surface-2))] text-[hsl(var(--ui-text))] shadow-[0_10px_30px_rgba(0,0,0,0.35)] hover:brightness-125 active:brightness-150 transition-all active:scale-95 text-[10px] font-bold leading-none uppercase tracking-wider">Export</button>
          <button type="button" onClick={logRunSnapshot} className="inline-flex items-center gap-2 justify-center h-10 px-5 rounded-xl border border-[hsl(var(--ui-border))] bg-[hsl(var(--ui-surface-2))] text-[hsl(var(--ui-text))] shadow-[0_10px_30px_rgba(0,0,0,0.35)] hover:brightness-125 active:brightness-150 transition-all active:scale-95 text-[10px] font-bold leading-none uppercase tracking-wider">Log Snapshot</button>
          <button type="button" onClick={handleReset} className="inline-flex items-center gap-2 justify-center h-10 px-5 rounded-xl border border-[hsl(var(--ui-border))] bg-[hsl(var(--ui-surface-2))] text-[hsl(var(--ui-text))] shadow-[0_10px_30px_rgba(0,0,0,0.35)] hover:brightness-125 active:brightness-150 transition-all active:scale-95 text-[10px] font-bold leading-none uppercase tracking-wider">Reset Hub</button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1480px] space-y-6 px-4 py-6 md:px-8 md:py-8">
        {/* Metrics */}
        <section className={panelOuterClass}><div className={panelBodyClass}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <MetricCard label="Open Findings" value={openFindings} />
            <MetricCard label="Critical" value={severityCounts.critical} tone="danger" />
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
          <div className="grid gap-6 lg:grid-cols-2">
            <Section title="Scan Modules"><div className="space-y-2">
              {registry.scanModules.map((m) => {
                const completedDate = m.status === "completed" ? getModuleCompletedDate(m.lastRunId) : null;
                return (
                  <div key={m.id} className={cn(recessedBlockClass, "p-3")}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-bold text-[#eaedf1]">{m.name}</div>
                        <div className="mt-1 text-xs text-[#a1a1aa]">{m.description}</div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={cn("rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-wider", moduleStatusClass[m.status])}>{m.status}</span>
                        {completedDate && (
                          <span className="text-[10px] text-[#71717a]">{formatShortDate(completedDate)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div></Section>
            <Section title="App Pages"><div className="space-y-2">
              {registry.reviewUnits.map((u) => {
                const completedDate = u.status === "reviewed" && u.lastRunId ? getModuleCompletedDate(u.lastRunId) : null;
                return (
                  <div key={u.id} className={cn(recessedBlockClass, "p-3")}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-bold text-[#eaedf1]">{u.name}</div>
                        <div className="text-xs text-[#a1a1aa]">{u.route || "No route set"}</div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={cn("rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em]", u.status === "in-progress" ? "bg-[#2f3137] text-[#a5f3fc] border border-[#3b82f6]" : u.status === "reviewed" ? "bg-[#2f3137] text-[#a5f3fc] border border-[#22B8C9]" : "bg-[#4a5f7f] text-[#eaedf1]")}>{u.status}</span>
                        {completedDate && <span className="text-[10px] text-[#71717a]">{formatShortDate(completedDate)}</span>}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-[#a1a1aa]">{u.notes}</div>
                  </div>
                );
              })}
            </div></Section>
          </div>
        )}

        {/* Findings */}
        {activeView === "findings" && (
          <div className="space-y-6">
            <Section title="Findings Workspace">
              <div className="space-y-4">
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-5">
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search findings..." className={cn("xl:col-span-2", inputClass)} />
                  <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value as typeof severityFilter)} className={selectClass}><option value="all">All severities</option>{QUALITY_SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
                  <select value={domainFilter} onChange={(e) => setDomainFilter(e.target.value as typeof domainFilter)} className={selectClass}><option value="all">All domains</option>{QUALITY_DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}</select>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className={selectClass}><option value="all">All statuses</option>{QUALITY_FINDING_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}</select>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  <select value={agentFilter} onChange={(e) => setAgentFilter(e.target.value)} className={selectClass}><option value="all">All agents</option>{allAgents.map((a) => <option key={a.id} value={a.id}>{a.agentName} ({a.modelName})</option>)}</select>
                  <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as GroupBy)} className={selectClass}><option value="severity">Group by severity</option><option value="domain">Group by domain</option><option value="status">Group by status</option><option value="page">Group by page</option><option value="component">Group by component</option><option value="agent">Group by agent</option></select>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  <div className={cn(recessedStripClass, "p-2 text-xs text-[#eaedf1]")}><span className="font-bold text-white">{filteredFindings.length}</span> filtered findings</div>
                  <div className={cn(recessedStripClass, "p-2 text-xs text-[#eaedf1]")}>Dominant domain: <span className="font-bold text-white">{dominantDomain}</span></div>
                  <div className={cn(recessedStripClass, "p-2 text-xs text-[#eaedf1]")}>Confidence levels: {QUALITY_CONFIDENCE.length}</div>
                </div>
              </div>
            </Section>
            {orderedGroupEntries.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-[#71717a] bg-[linear-gradient(to_bottom_right,#27272a,#18181b)] px-4 py-10 text-center text-sm text-[#a1a1aa]">No findings yet. Import a JSON package to start.</div>
            ) : (
              orderedGroupEntries.map(([group, items]) => (
                <Section key={group} title={domainLabel(group)} badge={<span className="rounded-full bg-[#23262b] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#eaedf1]">{items.length}</span>}>
                  <div className="space-y-2">{items.map((f) => (
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
                            {f.relatedFindingIds.length > 0 && <div><span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#eaedf1]">Related</span> {f.relatedFindingIds.join(", ")}</div>}
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
                  ))}</div>
                </Section>
              ))
            )}
          </div>
        )}

        {/* Runs */}
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
            <Section title="Run History"><div className="overflow-x-auto rounded-xl border border-[#4a5f7f]/45">
              <table className="w-full min-w-[720px] border-collapse"><thead className="bg-[#1a2030]"><tr><th className="px-3 py-2 text-left text-[10px] font-black uppercase tracking-[0.16em] text-[#a1a1aa]">Run</th><th className="px-3 py-2 text-left text-[10px] font-black uppercase tracking-[0.16em] text-[#a1a1aa]">Agent</th><th className="px-3 py-2 text-left text-[10px] font-black uppercase tracking-[0.16em] text-[#a1a1aa]">Profile</th><th className="px-3 py-2 text-left text-[10px] font-black uppercase tracking-[0.16em] text-[#a1a1aa]">Summary</th><th className="px-3 py-2 text-left text-[10px] font-black uppercase tracking-[0.16em] text-[#a1a1aa]">Finished</th></tr></thead>
              <tbody>{registry.runs.length === 0 ? <tr><td className="px-3 py-4 text-xs text-[#71717a]" colSpan={5}>No run history yet.</td></tr> : registry.runs.map((r) => <tr key={r.id} className="border-t border-[#4a5f7f]/25 bg-[#1a2030]"><td className="px-3 py-3 text-xs text-[#e4e4e7]"><div className="font-bold text-[#eaedf1]">{r.name}</div><div className="font-mono text-[11px] text-[#71717a]">{r.id}</div></td><td className="px-3 py-3 text-xs text-[#a1a1aa]">{r.agent.agentName}</td><td className="px-3 py-3 text-xs uppercase text-[#a1a1aa]">{r.profile}</td><td className="px-3 py-3 text-xs text-[#a1a1aa]">total {r.summary.findingsTotal} • open {r.summary.open}</td><td className="px-3 py-3 text-xs text-[#a1a1aa]">{formatDate(r.finishedAt)}</td></tr>)}</tbody></table>
            </div></Section>
          </div>
        )}

        {/* Change Log */}
        {activeView === "changelog" && <ChangeLogView registry={registry} updateRegistry={updateRegistry} />}
      </div>
    </div>
  );
}
