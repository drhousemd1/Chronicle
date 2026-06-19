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

type ReportStatus = "open" | "reviewing" | "resolved" | "dismissed";
type ReportFilter = ReportStatus | "all";
type FinanceReport = {
  id: string;
  reporter: string;
  accused: string;
  reason: string;
  storyId: string | null;
  date: string;
  status: ReportStatus;
};

const normalizeReportStatus = (status: string | null): ReportStatus => {
  if (status === "reviewing" || status === "resolved" || status === "dismissed") return status;
  return "open";
};

const normalizeReportFilter = (filter: string): ReportFilter => {
  if (filter === "all" || filter === "reviewing" || filter === "resolved" || filter === "dismissed") return filter;
  return "open";
};

export function ReportsPage() {
  const [reports,setReports] = useState<FinanceReport[]>([]);
  const [filter, setFilter]  = useState<ReportFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data, error: e } = await supabase.from("reports").select("*").order("created_at", { ascending: false });
      if (e) throw e;
      setReports((data || []).map((r): FinanceReport => ({
        id: r.id, reporter: r.reporter, accused: r.accused,
        reason: r.reason, storyId: r.story_id,
        date: new Date(r.created_at).toISOString().slice(0,10),
        status: normalizeReportStatus(r.status),
      })));
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to load reports"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadReports(); }, [loadReports]);

  // BF-10: `reports` is no longer exposed on the realtime publication.
  // Admin moderation view polls every 30s instead.
  useEffect(() => {
    const interval = window.setInterval(() => { loadReports(); }, 30_000);
    return () => { window.clearInterval(interval); };
  }, [loadReports]);

  const update = async (id: string, status: ReportStatus) => {
    setReports(rs => rs.map(r => r.id === id ? { ...r, status } : r));
    await supabase.from("reports").update({ status }).eq("id", id);
  };

  const displayed = reports.filter(r=>filter==="all"||r.status===filter);
  const ss = { open:{bg:C.redSoft,color:C.red}, reviewing:{bg:C.amberSoft,color:C.amber}, resolved:{bg:C.greenSoft,color:C.green}, dismissed:{bg:C.hover,color:C.dim} };

  if (loading) return <div style={{ padding:40, textAlign:"center", color:C.dim }}>Loading reports…</div>;
  if (error) return <div style={{ padding:40, textAlign:"center", color:C.red }}>{error} <button onClick={loadReports} style={{ marginLeft:8, cursor:"pointer" }}>Retry</button></div>;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
        <Stat label="Open"      value={reports.filter(r=>r.status==="open").length}      color={C.red}   soft={C.redSoft}   sub=""/>
        <Stat label="Reviewing" value={reports.filter(r=>r.status==="reviewing").length} color={C.amber} soft={C.amberSoft} sub=""/>
        <Stat label="Resolved"  value={reports.filter(r=>r.status==="resolved").length}  color={C.green} soft={C.greenSoft} sub=""/>
      </div>

      <Toggle
        options={[{label:"All",value:"all"},{label:"Open",value:"open"},
          {label:"Reviewing",value:"reviewing"},{label:"Resolved",value:"resolved"},{label:"Dismissed",value:"dismissed"}]}
        value={filter} onChange={(value) => setFilter(normalizeReportFilter(value))}/>

      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {displayed.length === 0 && <div style={{ padding:32, textAlign:"center", color:C.dim, fontSize:13 }}>No reports match this filter.</div>}
        {displayed.map(r=>{
          const style = ss[r.status]||ss.resolved;
          return (
            <Card key={r.id} style={{ borderLeft:`3px solid ${style.color}`, borderRadius:"0 12px 12px 0" }}>
              <div style={{ display:"flex", justifyContent:"space-between",
                alignItems:"flex-start", flexWrap:"wrap", gap:12 }}>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                    <Badge label={r.status} bg={style.bg} color={style.color}/>
                    <span style={{fontSize:11,color:C.dim}}>{r.date}</span>
                  </div>
                  <div style={{fontSize:14,marginBottom:4}}>
                    <span style={{color:C.amber,fontWeight:600}}>@{r.reporter}</span>
                    <span style={{color:C.muted}}> reported </span>
                    <span style={{color:C.red,fontWeight:600}}>@{r.accused}</span>
                  </div>
                  <div style={{fontSize:13,color:C.muted,marginBottom:10}}>
                    Reason: <span style={{color:C.text}}>{r.reason}</span>
                  </div>
                  {r.storyId && <a href={`#story/${r.storyId}`}
                    style={{fontSize:12,color:C.blue,textDecoration:"none",fontWeight:500}}>
                    → Inspect story {r.storyId}
                  </a>}
                </div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {r.status!=="reviewing" && r.status!=="dismissed" && <ActionBtn label="Mark Reviewing" color={C.amber} onClick={()=>update(r.id,"reviewing")}/>}
                  {r.status!=="resolved"  && <ActionBtn label="Resolve"        color={C.green} onClick={()=>update(r.id,"resolved")}/>}
                  {r.status!=="dismissed" && <ActionBtn label="Dismiss"        color={C.dim}   onClick={()=>update(r.id,"dismissed")}/>}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
