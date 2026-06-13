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
import { fetchAdSpendChannels, saveAdSpendChannel, deleteAdSpendChannel } from "@/services/finance-dashboard/finance-ad-spend";
import { fetchAdminOverviewNote, saveAdminOverviewNote } from "@/services/finance-dashboard/finance-notes";
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

export function SubscriberSnapshot({ rows }: { rows?: { name: string; price: number; apiCost: number; users: number; color: string; soft?: string }[] }) {
  const tierRows = rows?.length ? rows : TIER_BREAKDOWN;
  const [period, setPeriod] = React.useState<"mo"|"yr">("mo");
  const mult = period === "yr" ? 12 : 1;
  const label = period === "mo" ? "mo" : "yr";

  // Totals
  const totals = tierRows.reduce((acc, t) => {
    const revenue   = t.users * t.price * mult;
    const apiSpend  = t.users * t.apiCost * mult;
    const stripeFee = t.price > 0 ? t.users * ((t.price * 0.029) + 0.30) * mult : 0;
    const net       = revenue - apiSpend - stripeFee;
    return {
      users: acc.users + t.users,
      income: acc.income + revenue,
      api: acc.api + apiSpend,
      stripe: acc.stripe + stripeFee,
      net: acc.net + net,
    };
  }, { users: 0, income: 0, api: 0, stripe: 0, net: 0 });

  return (
    <ShellCard style={{ flex:1 }}>
      <SlateHeader title="Subscriber Snapshot" />
      <div style={{ padding:"18px 20px 20px" }}>
        <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:14 }}>
          <DarkToggle
            options={[{ v:"mo", l:"Month" }, { v:"yr", l:"Year" }]}
            value={period}
            onChange={(v) => setPeriod(v as "mo"|"yr")}
          />
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"12px 1fr 44px 76px 76px 76px 72px",
          gap:8, paddingBottom:8, borderBottom:`1px solid ${D.divider}` }}>
          <div />
          {["Tier","Users","Income","API Cost","Stripe","Net"].map((h,i) => (
            <div key={h} style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.06em",
              color:D.muted, fontWeight:700, textAlign: i > 0 ? "right" : "left" }}>{h}</div>
          ))}
        </div>
        {tierRows.map((t: { name: string; price: number; apiCost: number; users: number; color: string; soft?: string }, i: number) => {
          const revenue   = t.users * t.price * mult;
          const apiSpend  = t.users * t.apiCost * mult;
          const stripeFee = t.price > 0 ? t.users * ((t.price * 0.029) + 0.30) * mult : 0;
          const net       = revenue - apiSpend - stripeFee;
          return (
            <div key={t.name}>
              <div style={{ display:"grid", gridTemplateColumns:"12px 1fr 44px 76px 76px 76px 72px",
                gap:8, alignItems:"center", padding:"10px 0" }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:t.color }} />
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:D.text }}>{t.name}</div>
                  <div style={{ fontSize:11, color:D.muted }}>${t.price}/mo</div>
                </div>
                <div style={{ fontSize:13, fontWeight:700, color:D.text, textAlign:"center" }}>{t.users}</div>
                <div style={{ fontSize:13, fontWeight:600, color: revenue > 0 ? D.green : D.muted, textAlign:"right" }}>${revenue.toFixed(2)}</div>
                <div style={{ fontSize:13, fontWeight:600, color:D.red, textAlign:"right" }}>-${apiSpend.toFixed(2)}</div>
                <div style={{ fontSize:13, fontWeight:600, color:D.red, textAlign:"right" }}>-${stripeFee.toFixed(2)}</div>
                <div style={{ fontSize:13, fontWeight:700, textAlign:"right", color: net >= 0 ? D.green : D.red }}>
                  {net >= 0 ? "" : "-"}${Math.abs(net).toFixed(2)}
                </div>
              </div>
              {i < tierRows.length - 1 && <div style={{ borderTop:`1px solid ${D.divider}` }} />}
            </div>
          );
        })}
      </div>
    </ShellCard>
  );
}

function buildGrowthBuckets(period: string) {
  const now = new Date();
  if (period === "day") {
    return Array.from({ length: 8 }, (_, i) => {
      const point = new Date(now);
      point.setMinutes(0, 0, 0);
      point.setHours(point.getHours() - ((7 - i) * 3));
      return {
        date: point,
        label: point.toLocaleTimeString([], { hour: "numeric" }),
      };
    });
  }

  if (period === "week") {
    return Array.from({ length: 8 }, (_, i) => {
      const point = new Date(now);
      point.setHours(23, 59, 59, 999);
      point.setDate(point.getDate() - ((7 - i) * 7));
      return {
        date: point,
        label: `Wk${i + 1}`,
      };
    });
  }

  if (period === "month") {
    return Array.from({ length: 8 }, (_, i) => {
      const point = new Date(now);
      point.setHours(23, 59, 59, 999);
      point.setMonth(point.getMonth() - (7 - i));
      return {
        date: point,
        label: point.toLocaleString([], { month: "short" }),
      };
    });
  }

  return Array.from({ length: 8 }, (_, i) => {
    const point = new Date(now);
    point.setHours(23, 59, 59, 999);
    point.setFullYear(point.getFullYear() - (7 - i));
    return {
      date: point,
      label: String(point.getFullYear()),
    };
  });
}

export function AppGrowth({ users }: { users?: any[] }) {
  const [period, setPeriod] = useState("week");
  const [view,   setView]   = useState("total");

  const growthData = useMemo(() => {
    const buckets = buildGrowthBuckets(period);
    const activeUsers = (users || []).filter((user: any) => (
      user.status === "active" &&
      !user.canViewAdminUi &&
      !isAdminTierSlug(user.tierSlug)
    ));

    const withJoined = activeUsers.map((user: any) => ({
      ...user,
      joinedAt: new Date(user.joined || Date.now()),
    }));

    const countFor = (untilDate: Date, tierSlug: string | null = null) => withJoined.filter((user: any) => {
      if (Number.isNaN(user.joinedAt.getTime())) return false;
      if (user.joinedAt > untilDate) return false;
      if (!tierSlug) return true;
      return user.tierSlug === tierSlug;
    }).length;

    return buckets.map((bucket) => ({
      label: bucket.label,
      total: countFor(bucket.date, null),
      starter: countFor(bucket.date, "starter"),
      premium: countFor(bucket.date, "premium"),
      elite: countFor(bucket.date, "elite"),
    }));
  }, [users, period]);

  const totalCount = growthData.length ? growthData[growthData.length - 1].total : 0;

  return (
    <ShellCard style={{ flex:1 }}>
      <SlateHeader title="App Growth" />
      <div style={{ padding:"16px 20px 20px" }}>
        <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:12 }}>
          <DarkToggle options={[{l:"Total",v:"total"},{l:"By tier",v:"tier"}]} value={view} onChange={setView} />
        </div>
        <ResponsiveContainer width="100%" height={120}>
          <AreaChart data={growthData} margin={{ top:4, right:8, left:0, bottom:0 }}>
            <defs>
              <linearGradient id="growthBlue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="label" tick={{ fill:D.muted, fontSize:11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill:D.muted, fontSize:11 }} axisLine={false} tickLine={false} width={28} domain={["auto","auto"]} />
            <Tooltip
              contentStyle={{ background:D.shell, border:"none", boxShadow:D.shellShadow, borderRadius:10, fontSize:12, color:D.text }}
              formatter={(value, name) => {
                const label = name === "total"
                  ? "Total active users"
                  : name === "starter"
                  ? "Starter"
                  : name === "premium"
                  ? "Premium"
                  : "Elite";
                return [value, label];
              }}
            />
            {view === "total" ? (
              <Area dataKey="total" name="total" stroke="#3b82f6" strokeWidth={2} fill="url(#growthBlue)" dot={false} type="monotone" />
            ) : (
              <>
                <Area dataKey="starter" name="starter" stroke="#3b82f6" strokeWidth={2} fill="none" dot={false} type="monotone" />
                <Area dataKey="premium" name="premium" stroke="#a78bfa" strokeWidth={2} fill="none" dot={false} type="monotone" />
                <Area dataKey="elite" name="elite" stroke="#fbbf24" strokeWidth={2} fill="none" dot={false} type="monotone" />
              </>
            )}
          </AreaChart>
        </ResponsiveContainer>
        <div style={{ display:"flex", justifyContent:"center", marginTop:12 }}>
          <DarkToggle options={[{l:"Day",v:"day"},{l:"Week",v:"week"},{l:"Month",v:"month"},{l:"Year",v:"year"}]} value={period} onChange={setPeriod} />
        </div>
        <div style={{ fontSize:11, color:D.muted, marginTop:10, textAlign:"right" }}>
          Current total active users: <span style={{ color:D.text, fontWeight:700 }}>{totalCount}</span>
        </div>
      </div>
    </ShellCard>
  );
}

// ─── net income mini card ─────────────────────────────────────

export function NetIncomeMini({ users = [] }: { users?: any[] }) {
  const [period, setPeriod] = useState<AdminUsagePeriod>("week");
  const [view,   setView]   = useState("total");
  const [costData, setCostData] = useState<{ label: string; textCost: number; imageCost: number }[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchAdminUsageTimeseries(period).then((ts) => {
      if (cancelled) return;
      setCostData(ts.points.map((p) => ({
        label: p.label,
        textCost: p.textCostUsd,
        imageCost: p.imageCostUsd,
      })));
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [period]);

  // Revenue = sum of (users × tier price) — currently $0 since no paying subscribers
  const paidTiers = PAID_TIER_SNAPSHOT_META.filter(t => t.slug !== "admin");
  const tierPrices = DEFAULT_TIER_PRICES;
  const activeUsers = users.filter((u: any) => u.status === "active");

  // Build per-point net income data
  const data = costData.map((pt) => {
    // For now revenue is 0 per time-bucket (no paying subscribers)
    // Total API cost for this time bucket
    const totalCost = pt.textCost + pt.imageCost;
    // Net = revenue - costs (will be negative until there are paying users)
    return { label: pt.label, net: -totalCost, cost: totalCost };
  });

  const totalNet = data.reduce((a, d) => a + d.net, 0);
  const isPositive = totalNet >= 0;
  const displayTotal = Math.abs(totalNet).toFixed(2);

  return (
    <ShellCard style={{ flex:1 }}>
      <SlateHeader title="Net Income" />
      <div style={{ padding:"16px 20px 20px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
          <div style={{ fontSize:24, fontWeight:800, color: isPositive ? D.green : D.red, lineHeight:1 }}>
            {isPositive ? "+" : "-"}${displayTotal}
          </div>
          <DarkToggle options={[{l:"Total",v:"total"},{l:"By tier",v:"tier"}]} value={view} onChange={setView} />
        </div>
        <ResponsiveContainer width="100%" height={90}>
          <AreaChart data={data} margin={{ top:4, right:4, left:0, bottom:0 }}>
            <defs>
              <linearGradient id="netGreen2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={isPositive ? "#22c55e" : "#ef4444"} stopOpacity={0.25} />
                <stop offset="95%" stopColor={isPositive ? "#22c55e" : "#ef4444"} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="label" tick={{ fill:D.muted, fontSize:10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill:D.muted, fontSize:10 }} axisLine={false} tickLine={false} width={28} tickFormatter={v => `$${v}`} />
            <Tooltip contentStyle={{ background:D.shell, border:"none", boxShadow:D.shellShadow, borderRadius:10, fontSize:12, color:D.text }}
              formatter={(v: any) => [`$${Math.abs(Number(v)).toFixed(2)}`, "Net"]} />
            <Area dataKey="net" name="Net" stroke={isPositive ? "#22c55e" : "#ef4444"} strokeWidth={2} fill="url(#netGreen2)" dot={false} type="monotone" />
          </AreaChart>
        </ResponsiveContainer>
        <div style={{ display:"flex", justifyContent:"center", marginTop:12 }}>
          <DarkToggle options={[{l:"Day",v:"day"},{l:"Week",v:"week"},{l:"Month",v:"month"},{l:"Year",v:"year"}]} value={period} onChange={setPeriod} />
        </div>
        <div style={{ fontSize:11, color:D.muted, marginTop:10, textAlign:"right" }}>
          Revenue: $0.00 · API costs: ${data.reduce((a, d) => a + d.cost, 0).toFixed(2)}
        </div>
      </div>
    </ShellCard>
  );
}

// ─── API usage mini card ──────────────────────────────────────

export function ApiUsageMini({ expanded = false, users = [] }: { expanded?: boolean; users?: any[] }) {
  const [period,  setPeriod]  = useState<AdminUsagePeriod>("week");
  const [apiType, setApiType] = useState("text");
  const [byTier,  setByTier]  = useState("total");
  const [billing, setBilling] = useState<XaiBillingSummary | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [usageData, setUsageData] = useState<{ label: string; cost: number }[]>([]);
  const [usageLoading, setUsageLoading] = useState(false);

  const adminUserIds = useMemo(() =>
    users.filter((u: any) => u.tierSlug === "admin" || u.tierSlug === "admin_cfo" || u.tier === "Admin" || u.tier === "Admin (CFO)")
      .map((u: any) => u.id),
    [users]
  );

  const loadBilling = async () => {
    setBillingLoading(true);
    setBillingError(null);
    try {
      const summary = await fetchXaiBillingSummary();
      setBilling(summary);
    } catch (error) {
      console.error("Failed to load xAI billing summary:", error);
      setBillingError("Billing unavailable");
    } finally {
      setBillingLoading(false);
    }
  };

  useEffect(() => {
    void loadBilling();
    const interval = setInterval(() => {
      void loadBilling();
    }, 120000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setUsageLoading(true);
    const filterUserIds = byTier === "tier" && adminUserIds.length > 0 ? adminUserIds : undefined;
    fetchAdminUsageTimeseries(period, filterUserIds).then((ts) => {
      if (cancelled) return;
      setUsageData(
        ts.points.map((p) => ({
          label: p.label,
          cost: apiType === "text" ? p.textCostUsd : p.imageCostUsd,
        }))
      );
      setUsageLoading(false);
    }).catch(() => {
      if (!cancelled) setUsageLoading(false);
    });
    return () => { cancelled = true; };
  }, [period, apiType, byTier, adminUserIds]);

  const data  = usageData;
  const total = data.reduce((a, d) => a + d.cost, 0).toFixed(2);
  const color = apiType === "text" ? D.red : D.purple;
  const gradId = apiType === "text" ? "apiTextD" : "apiImageD";
  const remainingText = billing ? `$${billing.prepaidCredits.remainingUsd.toFixed(2)} remaining` : "—";
  const totalText = billing ? `$${billing.prepaidCredits.totalUsd.toFixed(2)} total` : "of $—";
  return (
    <ShellCard style={{ flex:1 }}>
      <SlateHeader title="API Usage" />
      <div style={{ padding:"16px 20px 20px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
          <div style={{ fontSize:24, fontWeight:800, color, lineHeight:1 }}>-${total}</div>
          <div style={{ display:"flex", gap:6 }}>
            <DarkToggle options={[{l:"Total",v:"total"},{l:"Tier",v:"tier"}]} value={byTier} onChange={setByTier} />
            <DarkToggle options={[{l:"Text",v:"text"},{l:"Image",v:"image"}]} value={apiType} onChange={setApiType} />
          </div>
        </div>
        <ResponsiveContainer width="100%" height={90}>
          <AreaChart data={data} margin={{ top:4, right:4, left:0, bottom:0 }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={color} stopOpacity={0.25} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="label" tick={{ fill:D.muted, fontSize:10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill:D.muted, fontSize:10 }} axisLine={false} tickLine={false} width={28} tickFormatter={v => `$${v}`} />
            <Tooltip contentStyle={{ background:D.shell, border:"none", boxShadow:D.shellShadow, borderRadius:10, fontSize:12, color:D.text }}
              formatter={(v: any) => [`$${Number(v).toFixed(2)}`, apiType === "text" ? "Text API" : "Image API"]} />
            <Area dataKey="cost" stroke={color} strokeWidth={2} fill={`url(#${gradId})`} dot={false} type="monotone" />
          </AreaChart>
        </ResponsiveContainer>
        <div style={{ display:"flex", justifyContent:"center", marginTop:12 }}>
          <DarkToggle options={[{l:"Day",v:"day"},{l:"Week",v:"week"},{l:"Month",v:"month"},{l:"Year",v:"year"}]} value={period} onChange={setPeriod} />
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
          marginTop:12, paddingTop:10, borderTop:`1px solid ${D.divider}` }}>
          <span style={{ fontSize:11, color:D.muted }}>xAI account balance</span>
          <span style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:12, fontWeight:700, color:billingError ? D.red : D.text }}>
              {billingLoading ? "Loading..." : billingError ? billingError : remainingText}
              {!billingLoading && !billingError && (
                <span style={{ fontSize:11, fontWeight:400, color:D.muted, marginLeft:4 }}>
                  of {totalText}
                </span>
              )}
            </span>
            <button
              onClick={() => void loadBilling()}
              style={{
                padding:"4px 8px",
                borderRadius:6,
                border:"none",
                cursor:"pointer",
                background:D.elevated,
                boxShadow:D.btnShadow,
                color:D.text,
                fontSize:10,
                fontWeight:700,
              }}
            >
              Refresh
            </button>
          </span>
        </div>
      </div>
    </ShellCard>
  );
}

// ─── ad spend tracker ─────────────────────────────────────────
const AD_CHANNELS = [
  {
    id:"reddit",
    name:"Reddit",
    desc:"Post in r/CharacterAI, r/AIRoleplay, r/singularity — organic first, paid later",
    type:"organic",
    status:"active",
    spent:0,
    cost:0,
    costCadence:"mo",
    startDate:"",
    cpa:null,
    url:"https://reddit.com/r/CharacterAI",
  },
];

async function loadAdSpendChannelsFromSupabase() {
  return fetchAdSpendChannels(AD_CHANNELS);
}

const STATUS_META = {
  active:    { label:"Active",    bg:"#d1fae5", color:"#065f46" },
  cancelled: { label:"Cancelled", bg:"#fee2e2", color:"#991b1b" },
};

const TYPE_META = {
  organic:   { label:"Free",      color:"#059669" },
  free_tool: { label:"Free tool", color:"#2563eb" },
  paid:      { label:"Paid",      color:"#dc2626" },
};

function AdSpendMini() {
  const [all, setAll] = useState(AD_CHANNELS);

  useEffect(() => {
    let cancelled = false;
    void loadAdSpendChannelsFromSupabase()
      .then((channels) => {
        if (cancelled) return;
        setAll(channels);
      })
      .catch((error) => {
        console.error("Failed to load ad spend mini data:", error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const active      = all.filter(c => c.status === "active");
  const cancelled   = all.filter(c => c.status === "cancelled");
  const paid        = active.filter(c => c.cost > 0);
  const free        = active.filter(c => !c.cost || c.cost === 0);
  const monthlyCost = paid.filter(c => c.costCadence === "mo").reduce((s,c) => s + c.cost, 0);
  const yearlyCost  = paid.filter(c => c.costCadence === "yr").reduce((s,c) => s + c.cost, 0);
  return (
    <ShellCard style={{ flex:1 }}>
      <SlateHeader title="Marketing & Ad Spend" />
      <div style={{ padding:"16px 20px 20px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
          <div style={{ fontSize:13, color:D.muted }}>
            Monthly costs
            <span style={{ fontSize:24, fontWeight:800, color:D.red, marginLeft:10 }}>
              -${monthlyCost.toFixed(2)}
            </span>
          </div>
        </div>
        <div style={{ background:D.tray, boxShadow:D.trayShadow, borderRadius:12, overflow:"hidden" }}>
          {[
            { label:"Active subscriptions",    value: active.length },
            { label:"Paid subscriptions",      value: paid.length },
            { label:"Free subscriptions",      value: free.length },
            { label:"Cancelled subscriptions", value: cancelled.length },
            ...(yearlyCost > 0 ? [{ label:"Annual costs", value:`-$${yearlyCost.toFixed(2)}/yr`, monetary:true }] : []),
          ].map((row, i) => (
            <div key={row.label} style={{ display:"flex", justifyContent:"space-between",
              alignItems:"center", padding:"9px 14px", fontSize:12,
              borderTop: i > 0 ? `1px solid ${D.divider}` : "none" }}>
              <span style={{ color:D.muted }}>{row.label}</span>
              <span style={{ fontWeight:700, color: row.monetary ? D.red : D.text }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </ShellCard>
  );
}

export function AdSpendTracker() {
  const [channels,   setChannels]   = useState(AD_CHANNELS);
  const [filter,     setFilter]     = useState("all");
  const [showAdd,    setShowAdd]    = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [saveError,  setSaveError]  = useState<string | null>(null);
  const [form, setForm] = useState({ name:"", desc:"", url:"", status:"active", spent:"", cost:"", costCadence:"mo", startDate:"" });

  const loadChannels = async () => {
    setLoading(true);
    try {
      const nextChannels = await loadAdSpendChannelsFromSupabase();
      setChannels(nextChannels);
      setSaveError(null);
    } catch (error) {
      console.error("Failed to load ad spend channels:", error);
      setSaveError("Unable to load ad spend data.");
      setChannels(AD_CHANNELS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadChannels();
  }, []);

  const displayed   = channels.filter(c =>
    filter === "all"       ? true :
    filter === "paid"      ? c.cost > 0 :
    filter === "active"    ? c.status === "active" :
    filter === "cancelled" ? c.status === "cancelled" : true
  );

  function autoSpent(c: any) {
    if (!c.startDate || !c.cost) return parseFloat(c.spent) || 0;
    const start = new Date(c.startDate);
    const now = new Date();
    if (isNaN(start.getTime())) return parseFloat(c.spent) || 0;
    if (c.costCadence === "mo") {
      const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
      return Math.max(0, months) * c.cost;
    } else {
      const years = now.getFullYear() - start.getFullYear();
      return Math.max(0, years) * c.cost;
    }
  }

  const openAdd = () => {
    setForm({ name:"", desc:"", url:"", status:"active", spent:"", cost:"", costCadence:"mo", startDate:"" });
    setEditTarget(null);
    setShowAdd(true);
  };

  const openEdit = (c: any) => {
    setForm({ name:c.name, desc:c.desc||"", url:c.url||"", status:c.status,
              spent:c.spent||"", cost:c.cost||"", costCadence:c.costCadence||"mo", startDate:c.startDate||"" });
    setEditTarget(c.id);
    setShowAdd(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;

    setSaveError(null);

    const entry = {
      name: form.name.trim(), desc: form.desc.trim(), url: form.url.trim(),
      status: form.status,
      spent: parseFloat(form.spent) || 0,
      cost: parseFloat(form.cost) || 0,
      costCadence: form.costCadence,
      startDate: form.startDate,
      cpa: null,
    };

    try {
      await saveAdSpendChannel({ editTarget, entry });

      await loadChannels();
      setShowAdd(false);
      setEditTarget(null);
    } catch (error) {
      console.error("Failed to save ad spend channel:", error);
      setSaveError("Failed to save ad spend channel. Check table/policies.");
    }
  };

  const handleDelete = async () => {
    if (!editTarget) return;
    setSaveError(null);
    try {
      await deleteAdSpendChannel(editTarget);
      await loadChannels();
      setShowAdd(false);
      setEditTarget(null);
    } catch (error) {
      console.error("Failed to delete ad spend channel:", error);
      setSaveError("Failed to delete ad spend channel.");
    }
  };

  const STATUS_BADGES = {
    active:    { bg:"#14532d", text:"#86efac", label:"Active" },
    cancelled: { bg:"#450a0a", text:"#fca5a5", label:"Cancelled" },
  };

  const inputStyle: React.CSSProperties = {
    width:"100%", boxSizing:"border-box" as const,
    background:D.recessed, border:`1px solid rgba(255,255,255,0.08)`,
    borderRadius:8, padding:"8px 12px", fontSize:13,
    color:D.text, outline:"none",
  };
  const labelStyle: React.CSSProperties = { fontSize:11, fontWeight:700, color:D.muted,
    textTransform:"uppercase" as const, letterSpacing:"0.06em", marginBottom:5, display:"block" };

  return (
    <ShellCard>
      <SlateHeader title="Marketing & Ad Spend" />
      <div style={{ padding:"16px 22px 20px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:10 }}>
          <div style={{ fontSize:13, color:D.muted }}>
            Monthly costs
            <span style={{ fontSize:24, fontWeight:800, color:D.red, marginLeft:10 }}>
              -${channels.filter(c => c.status==="active" && c.cost > 0 && c.costCadence==="mo")
                  .reduce((s,c) => s + c.cost, 0)
                  .toFixed(2)}
            </span>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <button onClick={openAdd} style={{
              padding:"5px 14px", borderRadius:8, border:"none", cursor:"pointer",
              background:D.elevated, boxShadow:D.btnShadow,
              color:D.text, fontSize:12, fontWeight:700 }}>
              + Add new
            </button>
            <DarkToggle options={[{l:"All",v:"all"},{l:"Paid",v:"paid"},{l:"Active",v:"active"},{l:"Cancelled",v:"cancelled"}]} value={filter} onChange={setFilter} />
          </div>
        </div>

        <div style={{ background:D.tray, boxShadow:D.trayShadow, borderRadius:16, overflow:"hidden" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 110px 100px 100px 100px 70px",
            gap:0, padding:"10px 16px", borderBottom:`1px solid rgba(255,255,255,0.04)` }}>
            {["Channel","Status","Subscribed","Cost","Spent",""].map((h,i) => (
              <div key={i} style={{ fontSize:10, fontWeight:700, textTransform:"uppercase",
                letterSpacing:"0.07em", color:D.muted,
                textAlign: i === 0 ? "left" : "center" }}>{h}</div>
            ))}
          </div>
          {displayed.map((c, i) => {
            const sb = (STATUS_BADGES as Record<string, {bg:string;text:string;label:string}>)[c.status] || STATUS_BADGES.active;
            const spent = autoSpent(c);
            return (
              <div key={c.id} style={{ background: i%2===0 ? "transparent" : "rgba(255,255,255,0.02)" }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 110px 100px 100px 100px 70px",
                  gap:0, alignItems:"center", padding:"12px 16px" }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:D.text }}>{c.name}</div>
                    <div style={{ fontSize:11, color:D.muted, marginTop:2, lineHeight:1.4 }}>{c.desc}</div>
                  </div>
                  <div style={{ display:"flex", justifyContent:"center" }}>
                    <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px",
                      borderRadius:20, background:sb.bg, color:sb.text, whiteSpace:"nowrap" }}>
                      {sb.label}
                    </span>
                  </div>
                  <div style={{ textAlign:"center", fontSize:11, color:c.startDate ? D.text : D.dim }}>
                    {c.startDate || "—"}
                  </div>
                  <div style={{ textAlign:"center", lineHeight:1.3 }}>
                    {c.cost > 0
                      ? <><span style={{ fontSize:13, fontWeight:600, color:D.text }}>${c.cost.toFixed(2)}</span>
                          <span style={{ fontSize:10, color:D.muted }}>/{c.costCadence}</span></>
                      : <span style={{ fontSize:12, fontWeight:700, color:D.muted }}>Free</span>}
                  </div>
                  <div style={{ textAlign:"center", lineHeight:1.3 }}>
                    {spent > 0
                      ? <><span style={{ fontSize:13, fontWeight:600, color:D.red }}>-${spent.toFixed(2)}</span>
                          {c.startDate && <div style={{ fontSize:10, color:D.dim }}>auto-calc</div>}</>
                      : <span style={{ fontSize:13, color:D.dim }}>—</span>}
                  </div>
                  <div style={{ display:"flex", justifyContent:"center" }}>
                    <button onClick={() => openEdit(c)} style={{
                      padding:"5px 12px", borderRadius:10, border:"none",
                      background:D.elevated, boxShadow:D.btnShadow,
                      color:D.text, fontSize:11, fontWeight:700, cursor:"pointer" }}>
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {displayed.length === 0 && (
            <div style={{ padding:"24px 16px", textAlign:"center", color:D.muted, fontSize:13 }}>
              No channels match this filter.
            </div>
          )}
        </div>
        <p style={{ fontSize:11, color:saveError ? D.red : D.muted, marginTop:12 }}>
          {loading ? "Loading ad spend data..." : saveError || "Live table: ad_spend"}
        </p>
      </div>

      {/* Add / Edit modal */}
      {showAdd && (
        <div onClick={() => setShowAdd(false)} style={{
          position:"fixed", inset:0, background:"rgba(0,0,0,0.6)",
          display:"flex", alignItems:"center", justifyContent:"center", zIndex:200 }}>
          <div onClick={e => e.stopPropagation()} style={{
            background:D.shell, boxShadow:D.shellShadow,
            borderRadius:20, overflow:"hidden", width:480, maxWidth:"92vw" }}>
            <div style={{ background:"linear-gradient(180deg,#5a7292 0%,#4a5f7f 100%)",
              padding:"14px 20px", fontSize:14, fontWeight:700, color:"#fff" }}>
              {editTarget ? "Edit channel" : "Add marketing channel"}
            </div>
            <div style={{ padding:"20px", display:"flex", flexDirection:"column", gap:14 }}>
              <div>
                <label style={labelStyle}>Channel name *</label>
                <input value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))}
                  placeholder="e.g. Product Hunt" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Description</label>
                <input value={form.desc} onChange={e => setForm(f=>({...f,desc:e.target.value}))}
                  placeholder="What is this channel for?" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>URL</label>
                <input value={form.url} onChange={e => setForm(f=>({...f,url:e.target.value}))}
                  placeholder="https://..." style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Status</label>
                <select value={form.status} onChange={e => setForm(f=>({...f,status:e.target.value}))}
                  style={{...inputStyle}}>
                  <option value="active">Active</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div>
                  <label style={labelStyle}>Recurring cost ($)</label>
                  <input type="number" value={form.cost} onChange={e => setForm(f=>({...f,cost:e.target.value}))}
                    placeholder="0.00" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Billed</label>
                  <select value={form.costCadence} onChange={e => setForm(f=>({...f,costCadence:e.target.value}))}
                    style={{...inputStyle}}>
                    <option value="mo">Monthly</option>
                    <option value="yr">Yearly</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={labelStyle}>
                  Subscription start date
                  <span style={{ fontWeight:400, textTransform:"none", marginLeft:6, fontSize:10, color:D.dim }}>
                    — amount spent auto-calculates from this date
                  </span>
                </label>
                <input type="date" value={form.startDate} onChange={e => setForm(f=>({...f,startDate:e.target.value}))}
                  style={{...inputStyle, colorScheme:"dark"}} />
              </div>
              <div style={{ display:"flex", gap:10, justifyContent:"space-between", marginTop:4 }}>
                {editTarget
                  ? <button onClick={handleDelete} style={{
                      padding:"8px 20px", borderRadius:10, border:"none", cursor:"pointer",
                      background:"#dc2626", color:"#ffffff",
                      fontSize:13, fontWeight:700, boxShadow:"0 2px 8px rgba(220,38,38,0.4)" }}>
                      Delete
                    </button>
                  : <div />}
                <div style={{ display:"flex", gap:10 }}>
                  <button onClick={() => setShowAdd(false)} style={{
                    padding:"8px 18px", borderRadius:8, border:"none", cursor:"pointer",
                    background:D.elevated, boxShadow:D.btnShadow, color:D.muted, fontSize:13, fontWeight:600 }}>
                    Cancel
                  </button>
                  <button onClick={handleSave} style={{
                    padding:"8px 18px", borderRadius:8, border:"none", cursor:"pointer",
                    background:D.elevated, boxShadow:D.btnShadow, color:D.text, fontSize:13, fontWeight:700 }}>
                    {editTarget ? "Save changes" : "Add channel"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </ShellCard>
  );
}

// ══════════════════════════════════════════════════════════════
// OVERVIEW
// ══════════════════════════════════════════════════════════════
// ─── Notes Editor ─────────────────────────────────────────────
function NotesEditor() {
  const editorRef = React.useRef(null);
  const [fontSize, setFontSize] = useState("14px");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const autoSaveRef = React.useRef<number | null>(null);

  const exec = (cmd, val = null) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
  };

  const loadNote = async () => {
    setLoading(true);
    setSaveError(null);
    try {
      const data = await fetchAdminOverviewNote();
      if (editorRef.current) {
        editorRef.current.innerHTML = data?.content_html || "";
      }
      if (data?.updated_at) {
        setLastSavedAt(new Date(data.updated_at).toLocaleString());
      } else {
        setLastSavedAt(null);
      }
    } catch (error) {
      console.error("Failed to load admin notes:", error);
      setSaveError("Unable to load notes from admin_notes.");
    } finally {
      setLoading(false);
    }
  };

  const persistNote = async (mode: "manual" | "auto") => {
    if (!editorRef.current) return;
    const contentHtml = editorRef.current.innerHTML || "";
    setSaving(true);
    setSaveError(null);
    try {
      const data = await saveAdminOverviewNote(contentHtml);
      if (data?.updated_at) {
        setLastSavedAt(new Date(data.updated_at).toLocaleString());
      } else {
        setLastSavedAt(new Date().toLocaleString());
      }
    } catch (error) {
      console.error(`Failed to ${mode} save admin notes:`, error);
      setSaveError("Failed to save notes. Check admin_notes table and RLS.");
    } finally {
      setSaving(false);
    }
  };

  const scheduleAutoSave = () => {
    if (autoSaveRef.current) {
      window.clearTimeout(autoSaveRef.current);
    }
    autoSaveRef.current = window.setTimeout(() => {
      void persistNote("auto");
    }, 1200);
  };

  useEffect(() => {
    void loadNote();
    return () => {
      if (autoSaveRef.current) {
        window.clearTimeout(autoSaveRef.current);
      }
    };
  }, []);

  const insertCheckbox = () => {
    editorRef.current?.focus();
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    // Build checkbox + label span
    const wrapper = document.createElement("div");
    wrapper.style.cssText = "display:flex;align-items:flex-start;gap:8px;margin:3px 0;";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.style.cssText = `margin-top:3px;accent-color:${D.blue};flex-shrink:0;cursor:pointer;`;
    cb.addEventListener("change", e => {
      const lbl = e.target.nextSibling;
      if (lbl) lbl.style.textDecoration = e.target.checked ? "line-through" : "none";
      if (lbl) lbl.style.color = e.target.checked ? D.muted : D.text;
    });
    const lbl = document.createElement("span");
    lbl.contentEditable = "true";
    lbl.style.cssText = `outline:none;min-width:40px;color:${D.text};`;
    lbl.textContent = "\u200B"; // zero-width space so cursor lands inside
    wrapper.appendChild(cb);
    wrapper.appendChild(lbl);
    range.deleteContents();
    range.insertNode(wrapper);
    // Place cursor inside label
    const newRange = document.createRange();
    newRange.setStart(lbl, 0);
    newRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(newRange);
  };

  const ToolBtn = ({ icon, cmd, val, title, active }) => (
    <button
      title={title}
      onMouseDown={e => {
        e.preventDefault();
        if (cmd) {
          exec(cmd, val);
        } else if (typeof val === "function") {
          val();
        }
      }}
      style={{ width:30, height:30, borderRadius:6, border:"none", cursor:"pointer",
        background: active ? D.blue : D.elevated,
        boxShadow: D.btnShadow,
        color: active ? "#fff" : D.muted,
        fontSize:13, fontWeight:700,
        display:"flex", alignItems:"center", justifyContent:"center",
        flexShrink:0 }}>
      {icon}
    </button>
  );

  const SizeBtn = ({ label, px }) => (
    <button
      onMouseDown={e => { e.preventDefault(); setFontSize(px); exec("fontSize", 3); }}
      style={{ padding:"0 8px", height:30, borderRadius:6, border:"none", cursor:"pointer",
        background: fontSize===px ? D.blue : D.elevated,
        boxShadow: D.btnShadow,
        color: fontSize===px ? "#fff" : D.muted,
        fontSize:11, fontWeight:700, flexShrink:0 }}>
      {label}
    </button>
  );

  return (
    <ShellCard>
      <SlateHeader title="Notes" />
      <div style={{ padding:"12px 16px 16px" }}>
        {/* Toolbar */}
        <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap",
          padding:"8px 10px", background:D.tray, borderRadius:8,
          marginBottom:10, boxShadow:D.trayShadow }}>
          <ToolBtn icon="B"  cmd="bold"          title="Bold"          />
          <ToolBtn icon={<em>I</em>} cmd="italic" title="Italic"       />
          <ToolBtn icon={<span style={{textDecoration:"underline"}}>U</span>} cmd="underline" title="Underline" />
          <ToolBtn icon={<span style={{textDecoration:"line-through"}}>S</span>} cmd="strikeThrough" title="Strikethrough" />
          <div style={{ width:1, height:20, background:D.divider, margin:"0 4px" }} />
          <SizeBtn label="Small"  px="12px" />
          <SizeBtn label="Normal" px="14px" />
          <SizeBtn label="Large"  px="18px" />
          <SizeBtn label="H1"     px="24px" />
          <div style={{ width:1, height:20, background:D.divider, margin:"0 4px" }} />
          <ToolBtn icon="☑" title="Add checkbox" cmd={null} val={insertCheckbox} />
          <div style={{ width:1, height:20, background:D.divider, margin:"0 4px" }} />
          <button
            onMouseDown={e => {
              e.preventDefault();
              void persistNote("manual");
            }}
            style={{ padding:"0 14px", height:30, borderRadius:6, border:"none", cursor:"pointer",
              background:D.elevated, boxShadow:D.btnShadow,
              color:D.text, fontSize:12, fontWeight:700, flexShrink:0 }}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>

        {/* Editable area */}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          style={{
            minHeight:180,
            padding:"12px 14px",
            background:D.recessed,
            borderRadius:8,
            border:`1px solid rgba(255,255,255,0.06)`,
            outline:"none",
            fontSize,
            color:D.text,
            lineHeight:1.7,
            caretColor:D.text,
          }}
          data-placeholder="Start typing your notes..."
          onInput={scheduleAutoSave}
        />
        <div style={{ fontSize:10, color:saveError ? D.red : D.dim, marginTop:6, textAlign:"right" }}>
          {loading
            ? "Loading notes..."
            : saveError
              ? saveError
              : lastSavedAt
                ? `Live table: admin_notes · Last saved ${lastSavedAt}`
                : "Live table: admin_notes · Not saved yet"}
        </div>
      </div>
    </ShellCard>
  );
}

export function OverviewPage({ onNavigate, snapshotRows, users }: { onNavigate: (page: string) => void; snapshotRows: any[]; users: any[] }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:22 }}>

      {/* top row: 2 columns, 2 cards each */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <SubscriberSnapshot rows={snapshotRows} />
          <AppGrowth users={users} />
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <ApiUsageMini users={users} />
          <NetIncomeMini users={users} />
        </div>
      </div>

      <AdSpendMini />

      {/* Notes */}
      <NotesEditor />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// FINANCE
// ══════════════════════════════════════════════════════════════
