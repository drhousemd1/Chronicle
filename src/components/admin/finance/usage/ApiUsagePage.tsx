/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import {
  DEFAULT_SUBSCRIPTION_TIERS,
  TIER_FEATURE_SECTIONS,
  loadSubscriptionTiersConfig,
  saveSubscriptionTiersConfig,
  getFeatureLabel,
  getTierSubtitleById,
  type SubscriptionTierConfig,
  type TierFeatureKey,
} from "@/services/subscription-tier-config";
import { fetchXaiBillingSummary, type XaiBillingSummary } from "@/services/xai-billing";
import {
  fetchAdminApiUsageTestReport,
  fetchAdminUsageSummary,
  fetchAdminUsageTimeseries,
  getEmptyUsageSummary,
  getEmptyUsageTimeseries,
  type AdminApiUsageTestReport,
  type AdminUsagePeriod,
} from "@/services/admin-usage-metrics";
import { API_USAGE_VALIDATION_ROWS } from "@/data/api-usage-validation-registry";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  C,
  D,
  ShellCard,
  Tray,
  MONTHLY_FORECAST,
  ANNUAL,
  BREAKEVEN,
  MODEL_RATES,
  fmt$,
  Badge,
  tierMeta,
  statusMeta,
  tierBadge,
  statusBadge,
  USER_TIER_OVERRIDES_KEY,
  DEFAULT_TIER_PRICES,
  USER_TIER_OPTIONS,
  tierLabelBySlug,
  isObject,
  normalizeUserTierSlug,
  isAdminTierSlug,
  tierSlugFromRole,
  tierCostLabel,
  formatMembershipAge,
  Card,
  Stat,
  SectionLabel,
  Toggle,
  ActionBtn,
  ChartTip,
  TIER_BREAKDOWN,
  PAID_TIER_SNAPSHOT_META,
  SlateHeader,
  HdrToggle,
  DarkToggle,
} from "../shared/finance-shared";

// ─── models Chronicle actively uses (highlighted green) ───────
const CHRONICLE_MODELS = new Set([
  "grok-4.3",
  "grok-imagine-image",
]);

// ─── fallback data from docs.x.ai/developers/models.md ────────
const FALLBACK_MODELS = [
  { model:"grok-4.3",                     type:"Language", input:"$1.25", cachedInput:"$0.20", output:"$2.50", context:"1,000,000", rateLimit:"10M TPM / 1800 RPM" },
  { model:"grok-4.20-0309-non-reasoning", type:"Language", input:"$1.25", cachedInput:"$0.20", output:"$2.50", context:"2,000,000", rateLimit:"10M TPM / 1800 RPM" },
  { model:"grok-4.20-multi-agent-0309",   type:"Language", input:"$1.25", cachedInput:"$0.20", output:"$2.50", context:"2,000,000", rateLimit:"10M TPM / 1800 RPM" },
  { model:"grok-4-1-fast-reasoning",      type:"Language", input:"$0.20", cachedInput:"$0.05", output:"$0.50", context:"2,000,000", rateLimit:"4M TPM / 607 RPM" },
  { model:"grok-4-1-fast-non-reasoning",  type:"Language", input:"$0.20", cachedInput:"$0.05", output:"$0.50", context:"2,000,000", rateLimit:"4M TPM / 607 RPM" },
  { model:"grok-imagine-image",           type:"Image",    input:"—",     cachedInput:"—",     output:"$0.02/img", context:"—",         rateLimit:"300 RPM" },
  { model:"grok-imagine-image-pro",       type:"Image",    input:"—",     cachedInput:"—",     output:"$0.07/img", context:"—",         rateLimit:"30 RPM"  },
  { model:"grok-imagine-video",           type:"Video",    input:"—",     cachedInput:"—",     output:"$0.05/sec", context:"—",         rateLimit:"60 RPM"  },
];

function XaiModelPricing() {
  const [models,     setModels]     = useState(FALLBACK_MODELS);
  const [loading,    setLoading]    = useState(false);
  const [lastFetch,  setLastFetch]  = useState(null);
  const [fetchError, setFetchError] = useState(false);
  const [filter,     setFilter]     = useState("all");

  const fetchLive = async () => {
    setLoading(true); setFetchError(false);
    try {
      throw new Error("Edge function not yet deployed");
    } catch {
      setFetchError(true); setModels(FALLBACK_MODELS);
    } finally {
      setLoading(false); setLastFetch(new Date().toLocaleTimeString());
    }
  };

  const displayed = models.filter(m =>
    filter === "all"      ? true :
    filter === "language" ? m.type === "Language" :
    filter === "image"    ? m.type === "Image" :
    filter === "video"    ? m.type === "Video" :
    filter === "inuse"    ? CHRONICLE_MODELS.has(m.model) : true
  );

  const typeColor = { Language:"#60a5fa", Image:"#a78bfa", Video:"#fb923c" };

  return (
    <ShellCard>
      <SlateHeader title="xAI Model Pricing — Live" />
      <div style={{ padding:"16px 20px 20px" }}>
        {/* source + refresh + status row */}
        <div style={{ display:"flex", justifyContent:"space-between",
          alignItems:"center", flexWrap:"wrap", gap:12, marginBottom:16 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, fontSize:12, flexWrap:"wrap" }}>
            <span style={{ color:D.muted }}>Source:</span>
            <a href="https://docs.x.ai/developers/models" target="_blank" rel="noreferrer"
              style={{ color:D.blue, textDecoration:"none", fontSize:12 }}>docs.x.ai/developers/models</a>
            {lastFetch && <span style={{ color:D.dim }}>· Updated {lastFetch}</span>}
            {fetchError && <span style={{ fontSize:11, color:D.amber, fontWeight:600 }}>Using cached data</span>}
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <DarkToggle
              options={[
                {l:"All",v:"all"},{l:"Language",v:"language"},
                {l:"Image",v:"image"},{l:"Video",v:"video"},{l:"In use",v:"inuse"},
              ]}
              value={filter} onChange={setFilter}
            />
            <button onClick={fetchLive} disabled={loading} style={{
              padding:"6px 16px", borderRadius:8, border:"none", cursor: loading?"default":"pointer",
              background: D.elevated, boxShadow: D.btnShadow,
              color: D.text, fontSize:12, fontWeight:700,
            }}>{loading ? "Fetching…" : "Refresh"}</button>
          </div>
        </div>

        {/* legend */}
        <div style={{ display:"flex", gap:16, marginBottom:14, fontSize:11 }}>
          <span style={{ display:"flex", alignItems:"center", gap:5 }}>
            <span style={{ width:10, height:10, borderRadius:2,
              background:"rgba(34,197,94,0.2)", border:"1.5px solid #22c55e",
              display:"inline-block" }} />
            <span style={{ color:D.text, fontWeight:600 }}>Used by Chronicle</span>
          </span>
          <span style={{ color:D.muted }}>All others available but not currently in use</span>
        </div>

        {/* table inside a tray */}
        <div style={{ background:D.tray, boxShadow:D.trayShadow, borderRadius:16, overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead>
              <tr style={{ borderBottom:`1px solid rgba(255,255,255,0.06)` }}>
                {[
                  { label:"Model",      tip:"The model identifier used in API calls." },
                  { label:"Usage",      tip:"Whether Chronicle currently uses this model in production." },
                  { label:"Type",       tip:"Language = text in/out. Image = generates images. Video = generates video." },
                  { label:"Context",    tip:"Maximum tokens (words/characters) the model can process in one request. 1M tokens ≈ 750,000 words." },
                  { label:"Rate Limit", tip:"TPM = tokens per minute. RPM = requests per minute. These are the API throughput caps." },
                  { label:"Input price",  tip:"Cost per 1 million tokens sent TO the model. At typical usage, 1M tokens ≈ a full novel." },
                  { label:"Cached input", tip:"Discounted rate when xAI has seen the same prompt prefix before. Prompt caching is automatic." },
                  { label:"Output price", tip:"Cost per 1 million tokens the model generates back. Output is billed separately from input." },
                ].map(({ label, tip }) => (
                  <th key={label} title={tip} style={{ padding:"10px 14px", textAlign:"left", color:D.muted,
                    fontWeight:700, fontSize:10, textTransform:"uppercase",
                    letterSpacing:"0.06em", whiteSpace:"nowrap", cursor:"help",
                    borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                    {label}
                    <span style={{ marginLeft:4, fontSize:9, color:D.dim, fontWeight:400 }}>ⓘ</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayed.map((m, i) => {
                const inUse = CHRONICLE_MODELS.has(m.model);
                // Format output with plain-English unit labels
                const outputLabel = m.output.includes("/img") ? m.output.replace("/img"," per image")
                  : m.output.includes("/sec") ? m.output.replace("/sec"," per second")
                  : m.output === "—" ? "—"
                  : `${m.output} per 1M tokens`;
                const inputLabel  = m.input  === "—" ? "—" : `${m.input} per 1M tokens`;
                const cachedLabel = m.cachedInput === "—" ? "—" : `${m.cachedInput} per 1M tokens`;
                return (
                  <tr key={i} style={{
                    borderBottom:`1px solid rgba(255,255,255,0.04)`,
                    background: inUse ? "rgba(34,197,94,0.07)" : i%2===0?"transparent":"rgba(255,255,255,0.02)",
                    borderLeft: inUse ? "3px solid #22c55e" : "3px solid transparent",
                  }}>
                    <td style={{ padding:"11px 14px" }}>
                      <span style={{ fontFamily:"monospace", fontSize:12,
                        color: inUse ? "#22c55e" : D.text, fontWeight: inUse ? 700 : 400 }}>
                        {m.model}
                      </span>
                    </td>
                    <td style={{ padding:"11px 14px" }}>
                      {inUse ? (
                        <span style={{ fontSize:11, fontWeight:700, padding:"2px 9px",
                          borderRadius:20, background:"rgba(34,197,94,0.15)", color:"#22c55e",
                          whiteSpace:"nowrap" }}>In use</span>
                      ) : (
                      <span style={{ fontSize:11, fontWeight:600, color:D.muted }}>Not used</span>
                      )}
                    </td>
                    <td style={{ padding:"11px 14px" }}>
                      <span style={{ fontSize:11, fontWeight:600, color:D.text }}>
                        {m.type}
                      </span>
                    </td>
                    <td style={{ padding:"11px 14px", color:D.muted, fontSize:12 }}>
                      {m.context === "—" ? "—" : m.context}
                    </td>
                    <td style={{ padding:"11px 14px", color:D.muted, fontSize:12 }}>{m.rateLimit}</td>
                    <td style={{ padding:"11px 14px", color:D.text, fontWeight:600, fontSize:12 }}>{inputLabel}</td>
                    <td style={{ padding:"11px 14px", color:D.muted, fontSize:12 }}>{cachedLabel}</td>
                    <td style={{ padding:"11px 14px", color:D.text, fontWeight:600, fontSize:12 }}>{outputLabel}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p style={{ fontSize:11, color:D.dim, marginTop:14, lineHeight:1.6 }}>
          Hover any column header for a plain-English explanation. Prices are per 1 million tokens for language models
          (≈ 750,000 words), and per image or per second for generation models. Cached input pricing applies when xAI
          has processed the same prompt prefix before — caching is automatic. TODO: Wire Refresh to a Supabase edge
          function fetching <code style={{color:D.muted}}>docs.x.ai/developers/models.md</code> for live pricing.
        </p>
      </div>
    </ShellCard>
  );
}

// ══════════════════════════════════════════════════════════════
// API USAGE
// ══════════════════════════════════════════════════════════════
type UsageSeriesMeta = {
  key: string;
  label: string;
  color: string;
  group: string;
  costPerEvent?: number;
};

const USAGE_SERIES_META: UsageSeriesMeta[] = [
  { key:"messagesSent", label:"Messages Sent", color:"#60a5fa", group:"core", costPerEvent:0.0007 },
  { key:"messagesGenerated", label:"Messages Generated", color:"#22d3ee", group:"core", costPerEvent:0.0021 },
  { key:"imagesGenerated", label:"Images Generated", color:"#a78bfa", group:"core", costPerEvent:0.02 },
  { key:"aiFillClicks", label:"AI Fill", color:"#f59e0b", group:"builder", costPerEvent:0.015 },
  { key:"aiUpdateClicks", label:"AI Update", color:"#f97316", group:"builder", costPerEvent:0.02 },
  { key:"aiEnhanceClicks", label:"AI Enhance", color:"#34d399", group:"builder", costPerEvent:0.004 },
  { key:"characterUpdateCalls", label:"Card Update Calls", color:"#eab308", group:"runtime", costPerEvent:0.01 },
  { key:"characterCardsUpdated", label:"Cards Updated", color:"#f43f5e", group:"runtime", costPerEvent:0.004 },
  { key:"memoryExtractionCalls", label:"Memory Extract Calls", color:"#10b981", group:"runtime", costPerEvent:0.008 },
  { key:"memoryEventsExtracted", label:"Memory Events", color:"#22c55e", group:"runtime", costPerEvent:0.002 },
  { key:"memoryCompressionCalls", label:"Memory Compress Calls", color:"#14b8a6", group:"runtime", costPerEvent:0.008 },
  { key:"memoryBulletsCompressed", label:"Memory Bullets", color:"#06b6d4", group:"runtime", costPerEvent:0.002 },
  { key:"aiCharacterCardsGenerated", label:"AI Character Cards", color:"#fb7185", group:"characters", costPerEvent:0.018 },
  { key:"aiAvatarsGenerated", label:"AI Avatars", color:"#ec4899", group:"characters", costPerEvent:0.02 },
  { key:"sideCharacterAvatarsGenerated", label:"Side Char Avatars", color:"#c084fc", group:"characters", costPerEvent:0.02 },
  { key:"characterAvatarsGenerated", label:"Character Avatars", color:"#818cf8", group:"characters", costPerEvent:0.02 },
];

const COST_SERIES_META: UsageSeriesMeta[] = [
  { key:"textCostUsd", label:"Text Model Spend", color:"#60a5fa", group:"cost" },
  { key:"imageCostUsd", label:"Image Model Spend", color:"#a78bfa", group:"cost" },
];

const UsageMetricHeader = ({ label, help }: { label: string; help: string }) => (
  <span style={{ display:"inline-flex", alignItems:"center", gap:6 }}>
    <span>{label}</span>
    <span
      title={help}
      aria-label={help}
      style={{
        width:16,
        height:16,
        borderRadius:"999px",
        display:"inline-flex",
        alignItems:"center",
        justifyContent:"center",
        border:"1px solid rgba(255,255,255,0.35)",
        color:"rgba(255,255,255,0.95)",
        fontSize:10,
        fontWeight:800,
        lineHeight:1,
        cursor:"help",
      }}
    >
      ?
    </span>
  </span>
);

export function UsagePage() {
  const emptyTestReport = useMemo<AdminApiUsageTestReport>(() => ({
    fetchedAt: new Date().toISOString(),
    rows: [],
    validationRows: API_USAGE_VALIDATION_ROWS,
    validationStatusBySession: {},
    validationSummary: { overall: { pass: 0, fail: 0, blank: 0 }, bySession: {} },
  }), []);

  const [period,  setPeriod]  = useState<AdminUsagePeriod>("week");
  const [mode, setMode] = useState<"usage" | "cost">("usage");
  const [seriesGroup, setSeriesGroup] = useState<"core" | "builder" | "runtime" | "characters" | "all">("core");
  const [usageSummary, setUsageSummary] = useState(getEmptyUsageSummary());
  const [usageLoading, setUsageLoading] = useState(false);
  const [usageError, setUsageError] = useState<string | null>(null);
  const [usageTimeseries, setUsageTimeseries] = useState(getEmptyUsageTimeseries("week"));
  const [timeseriesLoading, setTimeseriesLoading] = useState(false);
  const [timeseriesError, setTimeseriesError] = useState<string | null>(null);
  const [testReport, setTestReport] = useState<AdminApiUsageTestReport>(emptyTestReport);
  const [testReportLoading, setTestReportLoading] = useState(false);
  const [testReportError, setTestReportError] = useState<string | null>(null);
  const [showAllTraceSessions, setShowAllTraceSessions] = useState(false);
  const [billing, setBilling] = useState<XaiBillingSummary | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);

  const loadUsageSummary = useCallback(async () => {
    setUsageLoading(true);
    setUsageError(null);
    try {
      const summary = await fetchAdminUsageSummary();
      setUsageSummary(summary);
    } catch (error) {
      console.error("Failed to load admin usage summary:", error);
      setUsageError("Usage metrics unavailable");
    } finally {
      setUsageLoading(false);
    }
  }, []);

  const loadUsageTimeseries = useCallback(async (nextPeriod: AdminUsagePeriod) => {
    setTimeseriesLoading(true);
    setTimeseriesError(null);
    try {
      const series = await fetchAdminUsageTimeseries(nextPeriod);
      setUsageTimeseries(series);
    } catch (error) {
      console.error("Failed to load usage timeseries:", error);
      setTimeseriesError("Timeseries unavailable");
      setUsageTimeseries(getEmptyUsageTimeseries(nextPeriod));
    } finally {
      setTimeseriesLoading(false);
    }
  }, []);

  const loadTestReport = useCallback(async () => {
    setTestReportLoading(true);
    setTestReportError(null);
    try {
      const report = await fetchAdminApiUsageTestReport(50);
      setTestReport(report);
    } catch (error) {
      console.error("Failed to load API usage test report:", error);
      setTestReportError("Test session report unavailable");
      setTestReport(emptyTestReport);
    } finally {
      setTestReportLoading(false);
    }
  }, [emptyTestReport]);

  const loadBilling = useCallback(async () => {
    setBillingLoading(true);
    setBillingError(null);
    try {
      const summary = await fetchXaiBillingSummary();
      setBilling(summary);
    } catch (error) {
      console.error("Failed to load xAI billing summary:", error);
      setBillingError("Billing unavailable");
      setBilling(null);
    } finally {
      setBillingLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsageSummary();
    void loadTestReport();
    void loadBilling();
    const interval = setInterval(() => {
      void loadUsageSummary();
      void loadTestReport();
      void loadBilling();
    }, 120000);
    return () => clearInterval(interval);
  }, [loadUsageSummary, loadTestReport, loadBilling]);

  useEffect(() => {
    void loadUsageTimeseries(period);
    const interval = setInterval(() => {
      void loadUsageTimeseries(period);
    }, 120000);
    return () => clearInterval(interval);
  }, [period, loadUsageTimeseries]);

  const activeSeries = useMemo(() => {
    if (mode === "cost") return COST_SERIES_META;
    if (seriesGroup === "all") return USAGE_SERIES_META;
    return USAGE_SERIES_META.filter((series) => series.group === seriesGroup);
  }, [seriesGroup, mode]);

  const chartData = useMemo(() => (
    usageTimeseries.points.map((point) => {
      const row: Record<string, number | string> = { label: point.label };
      activeSeries.forEach((series) => {
        const raw = Number((point as any)[series.key] || 0);
        row[series.key] = raw;
      });
      return row;
    })
  ), [usageTimeseries, activeSeries]);

  const yFormatter = mode === "cost"
    ? (v) => `$${Number(v).toFixed(2)}`
    : (v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(Math.round(v)));
  const formatEstimatedCost = (amount: number) => {
    if (amount >= 1) return `$${amount.toFixed(2)}`;
    if (amount >= 0.01) return `$${amount.toFixed(3)}`;
    if (amount >= 0.001) return `$${amount.toFixed(4)}`;
    return `$${amount.toFixed(5)}`;
  };
  const costByMetric = Object.fromEntries(
    USAGE_SERIES_META
      .filter((series) => typeof series.costPerEvent === "number")
      .map((series) => [series.key, series.costPerEvent])
  ) as Record<string, number | undefined>;
  const allSeriesMeta = [...USAGE_SERIES_META, ...COST_SERIES_META];
  const counters = usageSummary.counters;
  const summaryCards = [
    { metric:"messagesSent", label:"Messages Sent", value:counters.messagesSent, callTag:"API Call 1", help:"User turn count only. This is NOT full payload token cost. True API-call cost should include full prompt/context payload plus completion tokens." },
    { metric:"messagesGenerated", label:"Messages Generated", value:counters.messagesGenerated, callTag:"API Call 1", help:"Number of assistant messages generated and saved in chat sessions." },
    { metric:"imagesGenerated", label:"Images Generated", value:counters.imagesGenerated, help:"Total AI-generated images across scene, cover, side-character avatar, and character avatar pipelines." },
    { metric:"aiFillClicks", label:"AI Fill Clicks", value:counters.aiFillClicks, help:"Count of AI Fill button uses in builders." },
    { metric:"aiUpdateClicks", label:"AI Update Clicks", value:counters.aiUpdateClicks, help:"Count of AI Update (chat card hard-refresh/deep-scan) button clicks." },
    { metric:"aiEnhanceClicks", label:"AI Enhance Clicks", value:counters.aiEnhanceClicks, help:"Combined count of precise/detailed AI Enhance actions in character and world/story builders." },
    { metric:"aiCharacterCardsGenerated", label:"AI Character Cards", value:counters.aiCharacterCardsGenerated, callTag:"API Call 2", help:"Count of AI-generated text card/profile generation events for auto-created side characters." },
    { metric:"aiAvatarsGenerated", label:"AI Avatars", value:counters.aiAvatarsGenerated, callTag:"API Call 2", help:"Count of AI avatar image generations (side characters plus character avatars)." },
    { metric:"characterUpdateCalls", label:"Card Update Calls", value:counters.characterUpdateCalls, callTag:"API Call 2", help:"Number of second-pass character update extraction calls after chat responses." },
    { metric:"characterCardsUpdated", label:"Cards Updated", value:counters.characterCardsUpdated, callTag:"API Call 2", help:"Total characters updated by second-pass extraction (counted per updated character)." },
    { metric:"memoryExtractionCalls", label:"Memory Extract Calls", value:counters.memoryExtractionCalls, callTag:"API Call 2", help:"Number of memory extraction calls that scan assistant output for memory-worthy events." },
    { metric:"memoryEventsExtracted", label:"Memory Events", value:counters.memoryEventsExtracted, callTag:"API Call 2", help:"Total number of memory events extracted from those memory extraction calls." },
    { metric:"memoryCompressionCalls", label:"Memory Compress Calls", value:counters.memoryCompressionCalls, callTag:"API Call 2", help:"Number of day-transition memory compression calls." },
    { metric:"memoryBulletsCompressed", label:"Memory Bullets", value:counters.memoryBulletsCompressed, callTag:"API Call 2", help:"Total bullet memories compressed into day synopsis entries." },
  ];
  const sessionColumns = testReport.rows;
  const visibleSessionColumns = useMemo(
    () => showAllTraceSessions ? sessionColumns : sessionColumns.slice(0, 5),
    [sessionColumns, showAllTraceSessions]
  );
  const MIN_TRACE_COLUMNS = 5;
  const traceColumns = useMemo(() => {
    const nameCounts = sessionColumns.reduce((map, session) => {
      const name = session.sessionName || "Untitled Session";
      map.set(name, (map.get(name) || 0) + 1);
      return map;
    }, new Map<string, number>());
    const runIndexBySessionId = new Map<string, number>();
    const runIndexByName = new Map<string, number>();
    [...sessionColumns].reverse().forEach((session) => {
      const name = session.sessionName || "Untitled Session";
      const nextIndex = (runIndexByName.get(name) || 0) + 1;
      runIndexByName.set(name, nextIndex);
      runIndexBySessionId.set(session.sessionId, nextIndex);
    });

    const realColumns = visibleSessionColumns.map((session, index) => {
      const createdAt = new Date(session.createdAt);
      const createdLabel = Number.isNaN(createdAt.getTime())
        ? "Tracked session"
        : createdAt.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
      const sessionName = session.sessionName || `Session ${index + 1}`;
      const isDuplicateName = (nameCounts.get(sessionName) || 0) > 1;
      const runIndex = runIndexBySessionId.get(session.sessionId);
      const statusLabel = session.status && session.status !== "unknown" ? session.status : "tracked";
      const accountingLabel = session.eventAccountingMode === "server_authoritative"
        ? "server-costed"
        : session.eventAccountingMode === "server_authoritative_with_client_fallback"
          ? "server+client-est."
          : "client-estimated";
      const shortId = session.sessionId ? session.sessionId.slice(0, 8) : `#${index + 1}`;

      return {
        key: session.sessionId || `session-${index + 1}`,
        label: isDuplicateName && runIndex ? `${sessionName} · Run ${runIndex}` : sessionName,
        subLabel: `${createdLabel} · ${statusLabel} · ${accountingLabel} · ${shortId}`,
        session,
        placeholder: false,
      };
    });

    const requiredColumns = Math.max(MIN_TRACE_COLUMNS, realColumns.length);
    const filledColumns = [...realColumns];
    for (let i = realColumns.length; i < requiredColumns; i += 1) {
      filledColumns.push({
        key: `empty-trace-${i + 1}`,
        label: `Session ${i + 1}`,
        subLabel: "No run yet",
        session: null,
        placeholder: true,
      });
    }
    return filledColumns;
  }, [sessionColumns, visibleSessionColumns]);
  const hasTrackedSessions = sessionColumns.length > 0;
  const testMetricRows: Array<{ key: keyof AdminApiUsageTestRow; label: string; render: (value: number) => string }> = [
    { key:"messagesSent", label:"Messages Sent", render:(v) => Number(v).toLocaleString() },
    { key:"messagesGenerated", label:"Messages Generated", render:(v) => Number(v).toLocaleString() },
    { key:"imagesGenerated", label:"Images Generated", render:(v) => Number(v).toLocaleString() },
    { key:"aiFillClicks", label:"AI Fill Clicks", render:(v) => Number(v).toLocaleString() },
    { key:"aiUpdateClicks", label:"AI Update Clicks", render:(v) => Number(v).toLocaleString() },
    { key:"aiEnhanceClicks", label:"AI Enhance Clicks", render:(v) => Number(v).toLocaleString() },
    { key:"aiCharacterCards", label:"AI Character Cards", render:(v) => Number(v).toLocaleString() },
    { key:"aiAvatars", label:"AI Avatars", render:(v) => Number(v).toLocaleString() },
    { key:"cardUpdateCalls", label:"Card Update Calls", render:(v) => Number(v).toLocaleString() },
    { key:"cardsUpdated", label:"Cards Updated", render:(v) => Number(v).toLocaleString() },
    { key:"memoryExtractCalls", label:"Memory Extract Calls", render:(v) => Number(v).toLocaleString() },
    { key:"memoryEvents", label:"Memory Events", render:(v) => Number(v).toLocaleString() },
    { key:"memoryCompressed", label:"Memory Compressed", render:(v) => Number(v).toLocaleString() },
    { key:"memoryBullets", label:"Memory Bullets", render:(v) => Number(v).toLocaleString() },
    { key:"serverEventCount", label:"Trusted Server Events", render:(v) => Number(v).toLocaleString() },
    { key:"clientDiagnosticEventCount", label:"Client Diagnostic Rows", render:(v) => Number(v).toLocaleString() },
    { key:"costedEventCount", label:"Costed Rows", render:(v) => Number(v).toLocaleString() },
    { key:"totalTokensEst", label:"Total Tokens (Est.)", render:(v) => Math.round(Number(v)).toLocaleString() },
    { key:"totalCostEstUsd", label:"Estimated Spend", render:(v) => formatEstimatedCost(Number(v)) },
  ];
  const validationRows = useMemo(
    () => {
      const rows = Array.isArray(testReport.validationRows) && testReport.validationRows.length > 0
        ? testReport.validationRows
        : API_USAGE_VALIDATION_ROWS;
      return [...rows].sort((a, b) => a.sort - b.sort);
    },
    [testReport.validationRows]
  );
  const getValidationStatus = (sessionId: string, rowId: string): AdminApiUsageValidationStatus => {
    const sessionMap = testReport.validationStatusBySession[sessionId];
    if (!sessionMap) return "blank";
    const status = sessionMap[rowId];
    return status === "pass" || status === "fail" || status === "blank" ? status : "blank";
  };
  const visibleValidationSummary = useMemo(() => {
    const summary = { pass: 0, fail: 0, blank: 0 };
    for (const session of visibleSessionColumns) {
      const sessionMap = testReport.validationStatusBySession[session.sessionId] || {};
      for (const row of validationRows) {
        const status = sessionMap[row.id];
        if (status === "pass") summary.pass += 1;
        else if (status === "fail") summary.fail += 1;
        else summary.blank += 1;
      }
    }
    return summary;
  }, [testReport.validationStatusBySession, validationRows, visibleSessionColumns]);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

      {/* summary stat badges */}
      <div style={{ display:"grid", gap:12, gridTemplateColumns:"repeat(5, minmax(220px, 1fr))", overflowX:"auto" }}>
        {summaryCards.map(s => (
          <ShellCard key={s.metric} style={{ minWidth:0 }}>
            <SlateHeader title={<UsageMetricHeader label={s.label} help={s.help} />} />
            <div style={{ padding:"16px 22px 20px" }}>
              <div style={{ fontSize:10, color:D.muted, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:8 }}>
                ({s.callTag || "Single Call"})
              </div>
              <div style={{ fontSize:26, fontWeight:800, color:D.text, lineHeight:1 }}>
                {usageLoading ? "…" : Number(s.value).toLocaleString()}
              </div>
              <div style={{ fontSize:11, color:D.muted, marginTop:6 }}>all time</div>
              {typeof costByMetric[s.metric] === "number" && (
                <div style={{ display:"flex", alignItems:"baseline", gap:6, marginTop:6, flexWrap:"wrap" }}>
                  <span style={{ fontSize:20, fontWeight:900, lineHeight:1, color:D.red }}>
                    -{formatEstimatedCost(costByMetric[s.metric])}
                  </span>
                  <span style={{ fontSize:11, color:D.muted }}>
                    (Avg. per event)
                  </span>
                </div>
              )}
            </div>
          </ShellCard>
        ))}
      </div>
      {usageError && (
        <div style={{ fontSize:12, color:D.red }}>{usageError}</div>
      )}
      {timeseriesError && (
        <div style={{ fontSize:12, color:D.red }}>{timeseriesError}</div>
      )}

      {/* main chart */}
      <ShellCard>
        <SlateHeader title="API Cost / Usage" />
        <div style={{ padding:"16px 20px 24px" }}>
          <div style={{ display:"flex", justifyContent:"flex-end", gap:6, marginBottom:16, flexWrap:"wrap" }}>
            <DarkToggle
              options={[{l:"Core",v:"core"},{l:"Builder",v:"builder"},{l:"Runtime",v:"runtime"},{l:"Characters",v:"characters"},{l:"All",v:"all"}]}
              value={seriesGroup}
              onChange={setSeriesGroup}
            />
            <DarkToggle options={[{l:"Usage",v:"usage"},{l:"Cost",v:"cost"}]} value={mode} onChange={setMode} />
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:10, marginBottom:12 }}>
            {activeSeries.map((series) => (
              <div key={series.key} style={{ display:"flex", alignItems:"center", gap:6 }}>
                <span style={{ width:10, height:10, borderRadius:999, background:series.color, boxShadow:D.glow(series.color) }} />
                <span style={{ fontSize:11, color:D.muted }}>{series.label}</span>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData} margin={{top:4,right:8,left:0,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
              <XAxis dataKey="label" tick={{fill:D.muted,fontSize:11}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:D.muted,fontSize:11}} axisLine={false} tickLine={false}
                tickFormatter={yFormatter} width={40}/>
              <Tooltip contentStyle={{ background:D.shell, border:"none", boxShadow:D.shellShadow,
                borderRadius:10, fontSize:12, color:D.text }}
                formatter={(value, name) => {
                  const series = allSeriesMeta.find((entry) => entry.key === name);
                  if (mode === "cost") {
                    return [`$${Number(value).toFixed(4)}`, `${series?.label || name} (est.)`];
                  }
                  return [Number(value).toLocaleString(), series?.label || name];
                }}/>
              {activeSeries.map((series) => (
                <Line
                  key={series.key}
                  dataKey={series.key}
                  name={series.key}
                  stroke={series.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  type="monotone"
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
          <div style={{ display:"flex", justifyContent:"center", marginTop:14 }}>
            <DarkToggle options={[{l:"Day",v:"day"},{l:"Week",v:"week"},{l:"Month",v:"month"},{l:"Year",v:"year"}]}
              value={period} onChange={setPeriod}/>
          </div>
          <div style={{ fontSize:11, color:D.muted, marginTop:10, textAlign:"right" }}>
            {timeseriesLoading ? "Loading chart..." : mode === "cost" ? "Cost view uses server-estimated spend from provider usage metadata." : "Usage view shows event counts."}
          </div>
        </div>
      </ShellCard>

      <ShellCard>
        <SlateHeader title="API Test Session Trace" />
        <div style={{ padding:"14px 20px 20px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:12, flexWrap:"wrap", marginBottom:10 }}>
            <div style={{ fontSize:11, color:D.muted }}>
              Admin-only test runs from Chat Settings toggle. Repeated story names are kept as separate runs; trusted server rows are preferred over client diagnostics for cost totals.
            </div>
            {sessionColumns.length > 5 && (
              <button
                type="button"
                onClick={() => setShowAllTraceSessions((value) => !value)}
                style={{
                  border: `1px solid ${D.divider}`,
                  background: D.tray,
                  color: D.text,
                  borderRadius: 10,
                  padding: "7px 10px",
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                {showAllTraceSessions ? "Show latest 5" : `Show all ${sessionColumns.length}`}
              </button>
            )}
          </div>
          {testReportError && (
            <div style={{ fontSize:12, color:D.red, marginBottom:8 }}>{testReportError}</div>
          )}
          <div style={{ overflowX:"auto", borderRadius:12, background:D.tray, boxShadow:D.trayShadow }}>
            <table style={{ width:"100%", borderCollapse:"collapse", minWidth:Math.max(900, 230 + traceColumns.length * 140) }}>
              <thead>
                <tr style={{ background:"rgba(255,255,255,0.03)" }}>
                  <th
                    style={{
                      padding:"10px 12px",
                      fontSize:11,
                      fontWeight:800,
                      letterSpacing:"0.06em",
                      textTransform:"uppercase",
                      color:D.muted,
                      borderBottom:`1px solid ${D.divider}`,
                      borderRight:`1px solid ${D.divider}`,
                      textAlign:"left",
                      whiteSpace:"nowrap",
                    }}
                  >
                    Metric
                  </th>
                  {traceColumns.map((column) => (
                    <th
                      key={column.key}
                      style={{
                        padding:"10px 12px",
                        fontSize:11,
                        fontWeight:800,
                        letterSpacing:"0.06em",
                        textTransform:"uppercase",
                        color:D.text,
                        borderBottom:`1px solid ${D.divider}`,
                        borderLeft:`1px solid ${D.divider}`,
                        textAlign:"left",
                        whiteSpace:"nowrap",
                        minWidth:140,
                        background:"rgba(255,255,255,0.02)",
                      }}
                    >
                      <div style={{ fontSize:11, fontWeight:800 }}>{column.label}</div>
                      <div style={{ fontSize:10, fontWeight:600, marginTop:3, color:D.muted, textTransform:"none", letterSpacing:"0.01em" }}>
                        {column.subLabel}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {testMetricRows.map((metric) => (
                  <tr key={metric.key}>
                    <td style={{ padding:"10px 12px", fontSize:12, color:D.text, borderBottom:`1px solid ${D.divider}`, borderRight:`1px solid ${D.divider}`, textAlign:"left", whiteSpace:"nowrap", fontWeight:700 }}>
                      {metric.label}
                    </td>
                    {traceColumns.map((column) => {
                      const rawValue = Number(column.session?.[metric.key] ?? 0);
                      const rendered = metric.render(rawValue);
                      const isCost = metric.key === "totalCostEstUsd";
                      const isPlaceholder = column.placeholder;
                      return (
                        <td
                          key={`${metric.key}-${column.key}`}
                          style={{
                            padding:"10px 12px",
                            fontSize:12,
                            color:isPlaceholder ? D.muted : (isCost ? D.red : D.text),
                            borderBottom:`1px solid ${D.divider}`,
                            borderLeft:`1px solid ${D.divider}`,
                            textAlign:"left",
                            whiteSpace:"nowrap",
                            fontWeight:isPlaceholder ? 500 : (isCost ? 800 : 500),
                          }}
                        >
                          {isPlaceholder ? "—" : rendered}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!hasTrackedSessions && (
            <div style={{ padding:"12px 4px 0", fontSize:12, color:D.muted, textAlign:"center" }}>
              {testReportLoading
                ? "Loading test session traces..."
                : "No tracked test sessions yet. Enable tracking in Chat Settings (Admin) and run a session."}
            </div>
          )}
          <div style={{ height:1, background:D.divider, margin:"18px 0 14px" }} />

          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:10, flexWrap:"wrap", marginBottom:10 }}>
            <div style={{ fontSize:14, fontWeight:700, color:D.text }}>API Payload Validation Matrix</div>
          </div>
          <div style={{ fontSize:11, color:D.muted, marginBottom:10 }}>
            `✓` sent and validated, `✕` triggered but required payload element missing, blank means not triggered yet.
          </div>

          <div style={{ overflowX:"auto", borderRadius:12, background:D.tray, boxShadow:D.trayShadow }}>
            <table style={{ width:"100%", borderCollapse:"collapse", minWidth:Math.max(900, 230 + traceColumns.length * 140) }}>
              <thead>
                <tr style={{ background:"rgba(255,255,255,0.03)" }}>
                  <th
                    style={{
                      padding:"10px 12px",
                      fontSize:11,
                      fontWeight:800,
                      letterSpacing:"0.06em",
                      textTransform:"uppercase",
                      color:D.muted,
                      borderBottom:`1px solid ${D.divider}`,
                      borderRight:`1px solid ${D.divider}`,
                      textAlign:"left",
                      whiteSpace:"nowrap",
                    }}
                  >
                    Validation Row
                  </th>
                  {traceColumns.map((column) => (
                    <th
                      key={`validation-${column.key}`}
                      style={{
                        padding:"10px 12px",
                        fontSize:11,
                        fontWeight:800,
                        letterSpacing:"0.06em",
                        textTransform:"uppercase",
                        color:D.text,
                        borderBottom:`1px solid ${D.divider}`,
                        borderLeft:`1px solid ${D.divider}`,
                        textAlign:"left",
                        whiteSpace:"nowrap",
                        minWidth:140,
                        background:"rgba(255,255,255,0.02)",
                      }}
                    >
                      <div style={{ fontSize:11, fontWeight:800 }}>{column.label}</div>
                      <div style={{ fontSize:10, fontWeight:600, marginTop:3, color:D.muted, textTransform:"none", letterSpacing:"0.01em" }}>
                        {column.subLabel}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {validationRows.map((row) => (
                  <tr key={row.id}>
                    <td
                      style={{
                        padding:"10px 12px",
                        fontSize:12,
                        color:D.text,
                        borderBottom:`1px solid ${D.divider}`,
                        borderRight:`1px solid ${D.divider}`,
                        textAlign:"left",
                        whiteSpace:"nowrap",
                        fontWeight:700,
                      }}
                    >
                      <span style={{ display:"inline-flex", alignItems:"center", gap:6 }}>
                        <span>{row.label}</span>
                        <span
                          title={row.helpText}
                          aria-label={row.helpText}
                          style={{
                            width:16,
                            height:16,
                            borderRadius:"999px",
                            display:"inline-flex",
                            alignItems:"center",
                            justifyContent:"center",
                            border:"1px solid rgba(255,255,255,0.35)",
                            color:"rgba(255,255,255,0.95)",
                            fontSize:10,
                            fontWeight:800,
                            lineHeight:1,
                            cursor:"help",
                            flexShrink:0,
                          }}
                        >
                          ?
                        </span>
                      </span>
                    </td>
                    {traceColumns.map((column) => {
                      const status: AdminApiUsageValidationStatus = column.session
                        ? getValidationStatus(column.session.sessionId, row.id)
                        : "blank";
                      const display = status === "pass" ? "✓" : status === "fail" ? "✕" : "";
                      const color = status === "pass" ? D.green : status === "fail" ? D.red : D.muted;
                      return (
                        <td
                          key={`${row.id}-${column.key}`}
                          style={{
                            padding:"10px 12px",
                            fontSize:14,
                            fontWeight:800,
                            color,
                            borderBottom:`1px solid ${D.divider}`,
                            borderLeft:`1px solid ${D.divider}`,
                            textAlign:"center",
                            whiteSpace:"nowrap",
                            minHeight:24,
                          }}
                        >
                          {display}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ paddingTop:10, fontSize:11, color:D.muted, textAlign:"right" }}>
            Visible columns — Pass: <span style={{ color:D.green, fontWeight:700 }}>{visibleValidationSummary.pass}</span>
            {" · "}
            Fail: <span style={{ color:D.red, fontWeight:700 }}>{visibleValidationSummary.fail}</span>
            {" · "}
            Blank: <span style={{ color:D.text, fontWeight:700 }}>{visibleValidationSummary.blank}</span>
          </div>
        </div>
      </ShellCard>

      <XaiModelPricing />

      {/* xAI Billing Balance */}
      <ShellCard>
        <SlateHeader title="xAI API Balance" />
        <div style={{ padding:"16px 20px 20px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start",
            flexWrap:"wrap", gap:16, marginBottom:20 }}>
            <div style={{ fontSize:12, color:D.muted, lineHeight:1.6, maxWidth:480 }}>
              Live xAI billing summary from the management API/legacy billing API.
              Fetched via a Supabase edge function so your API key never touches the browser.
            </div>
            <button
              onClick={() => { void loadBilling(); }}
              style={{ padding:"7px 16px", borderRadius:8, border:"none",
              background:D.elevated, boxShadow:D.btnShadow,
              color:D.text, fontSize:12, fontWeight:700, cursor:"pointer" }}>
              {billingLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:16 }}>
            {[
              {
                label:"Prepaid credits remaining",
                value: billing ? `$${billing.prepaidCredits.remainingUsd.toFixed(2)}` : "—",
                note: billing ? `of $${billing.prepaidCredits.totalUsd.toFixed(2)} total` : "No data",
                color:D.text,
              },
              {
                label:"Used this month",
                value: billing ? `$${billing.prepaidCredits.usedThisMonthUsd.toFixed(2)}` : "—",
                note:"billed to credits",
                color:D.text,
              },
              {
                label:"Next invoice",
                value: billing ? `$${billing.nextInvoiceUsd.toFixed(2)}` : "$0.00",
                note: billing ? `source: ${billing.source}` : "no invoiced billing",
                color:D.text,
              },
            ].map(s => (
              <div key={s.label} style={{ background:D.tray, boxShadow:D.trayShadow,
                borderRadius:12, padding:"14px 16px" }}>
                <div style={{ fontSize:10, fontWeight:700, color:D.muted, textTransform:"uppercase",
                  letterSpacing:"0.06em", marginBottom:8 }}>{s.label}</div>
                <div style={{ fontSize:26, fontWeight:800, color:s.color, lineHeight:1 }}>{s.value}</div>
                <div style={{ fontSize:11, color:D.muted, marginTop:4 }}>{s.note}</div>
              </div>
            ))}
          </div>

          <div style={{ background:D.tray, boxShadow:D.trayShadow, borderRadius:12, overflow:"hidden" }}>
            {[
              {
                label:"Total usage",
                value: billing ? `$${billing.prepaidCredits.usedUsd.toFixed(2)}` : "—",
                note:null,
              },
              {
                label:"Prepaid credits used",
                value: billing ? `$${billing.prepaidCredits.usedUsd.toFixed(2)}` : "—",
                note:null,
              },
              { label:"Free credits used", value:"$0.00", note:null },
              {
                label:"Next invoice",
                value: billing ? `$${billing.nextInvoiceUsd.toFixed(2)}` : "$0.00",
                note:"No invoiced billing set up",
                bold:true,
              },
            ].map((row, i) => (
              <div key={row.label} style={{ display:"flex", justifyContent:"space-between",
                alignItems:"center", padding:"11px 16px",
                borderTop: i > 0 ? `1px solid ${D.divider}` : "none",
                background: row.bold ? "rgba(255,255,255,0.03)" : "transparent" }}>
                <div>
                  <span style={{ fontSize:13, fontWeight:row.bold?700:400, color:D.text }}>{row.label}</span>
                  {row.note && <span style={{ fontSize:11, color:D.muted, marginLeft:8 }}>{row.note}</span>}
                </div>
                <span style={{ fontSize:row.bold?16:13, fontWeight:row.bold?800:600, color:D.text }}>{row.value}</span>
              </div>
            ))}
          </div>

          <p style={{ fontSize:11, color:D.muted, marginTop:14, lineHeight:1.6 }}>
            {billingError
              ? `Status: ${billingError}. Ensure XAI_MANAGEMENT_KEY + XAI_TEAM_ID (preferred) or XAI_API_KEY are configured.`
              : billing
                ? `Last updated: ${new Date(billing.fetchedAt).toLocaleString()} (${billing.source}).`
                : "No billing data yet."}
          </p>
        </div>
      </ShellCard>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// SUBSCRIPTION TIERS
// ══════════════════════════════════════════════════════════════
