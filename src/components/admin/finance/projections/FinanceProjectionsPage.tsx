/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { AdSpendTracker } from "../overview/MarketingAdSpend";
import { SubscriberSnapshot, NetIncomeMini, AppGrowth, ApiUsageMini } from "../overview/OverviewPage";
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

export function FinancePage({ users = [], tierPrices = DEFAULT_TIER_PRICES }: { users?: any[]; tierPrices?: Record<string, number> }) {
  const [growth,      setGrowth]      = useState({ starter:12, premium:8, elite:5 });
  const [prices,      setPrices]      = useState(() => ({
    starter: typeof tierPrices?.starter === "number" ? tierPrices.starter : DEFAULT_TIER_PRICES.starter,
    premium: typeof tierPrices?.premium === "number" ? tierPrices.premium : DEFAULT_TIER_PRICES.premium,
    elite: typeof tierPrices?.elite === "number" ? tierPrices.elite : DEFAULT_TIER_PRICES.elite,
  }));
  const [chartMonths, setChartMonths] = useState(12);
  const [financeAdminApiCost, setFinanceAdminApiCost] = useState(0);

  const setG = (tier, val) => setGrowth(g => ({ ...g, [tier]: val }));
  const setP = (tier, val) => setPrices(p => ({ ...p, [tier]: Math.max(0, parseFloat(val.toFixed(2))) }));

  useEffect(() => {
    setPrices({
      starter: typeof tierPrices?.starter === "number" ? tierPrices.starter : DEFAULT_TIER_PRICES.starter,
      premium: typeof tierPrices?.premium === "number" ? tierPrices.premium : DEFAULT_TIER_PRICES.premium,
      elite: typeof tierPrices?.elite === "number" ? tierPrices.elite : DEFAULT_TIER_PRICES.elite,
    });
  }, [tierPrices?.starter, tierPrices?.premium, tierPrices?.elite]);

  // Fetch real admin API cost for finance snapshot
  useEffect(() => {
    fetchAdminUsageTimeseries("month").then((ts) => {
      const latestPoint = ts.points[ts.points.length - 1];
      const monthlyCost = latestPoint ? (latestPoint.textCostUsd + latestPoint.imageCostUsd) : 0;
      setFinanceAdminApiCost(monthlyCost);
    }).catch(() => {});
  }, []);

  const tierCounts = useMemo(() => ({
    starter: users.filter((u) => u.status === "active" && (u.tierSlug === "starter" || u.tier === "Starter")).length,
    premium: users.filter((u) => u.status === "active" && (u.tierSlug === "premium" || u.tier === "Premium")).length,
    elite:   users.filter((u) => u.status === "active" && (u.tierSlug === "elite" || u.tier === "Elite")).length,
    free:    users.filter((u) => u.status === "active" && (u.tierSlug === "free" || u.tier === "Free")).length,
    admin:   users.filter((u) => u.status === "active" && (u.tierSlug === "admin" || u.tierSlug === "admin_cfo" || u.tier === "Admin" || u.tier === "Admin (CFO)")).length,
  }), [users]);

  const totalPaid = tierCounts.starter + tierCounts.premium + tierCounts.elite;
  const financeSnapshotRows = useMemo(() => (
    PAID_TIER_SNAPSHOT_META.map((tier) => ({
      ...tier,
      price: typeof prices[tier.slug] === "number" ? prices[tier.slug] : DEFAULT_TIER_PRICES[tier.slug],
      users: tierCounts[tier.slug] ?? 0,
      apiCost: tier.slug === "admin" && tierCounts.admin > 0
        ? financeAdminApiCost / tierCounts.admin
        : tier.apiCost,
    }))
  ), [prices, tierCounts, financeAdminApiCost]);

  const ECON = {
    starter: { price:prices.starter, api:4.002, stripe:prices.starter*0.029+0.30  },
    premium: { price:prices.premium, api:12.007, stripe:prices.premium*0.029+0.30 },
    elite:   { price:prices.elite,   api:29.885, stripe:prices.elite*0.029+0.30   },
  };
  const HOSTING = 371;
  const netPer = t => ECON[t].price - ECON[t].api - ECON[t].stripe;

  const currentMonthlyRev    = Object.keys(ECON).reduce((s,t) => s + tierCounts[t] * ECON[t].price, 0);
  const currentMonthlyCosts  = Object.keys(ECON).reduce((s,t) => s + tierCounts[t] * (ECON[t].api + ECON[t].stripe), 0);
  const currentNet           = currentMonthlyRev - currentMonthlyCosts - HOSTING;
  const isAlreadyProfit      = currentNet >= 0;

  const wtPrice  = totalPaid > 0 ? currentMonthlyRev   / totalPaid : netPer("starter");
  const wtCosts  = totalPaid > 0 ? currentMonthlyCosts / totalPaid : ECON.starter.api + ECON.starter.stripe;
  const netPerUser = wtPrice - wtCosts;
  const BREAKEVEN_USERS = Math.ceil(HOSTING / netPerUser);

  const liveData = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => {
      const mo = i + 1;
      const s  = Math.round(tierCounts.starter * Math.pow(1 + growth.starter/100, mo));
      const p  = Math.round(tierCounts.premium * Math.pow(1 + growth.premium/100, mo));
      const e  = Math.round(tierCounts.elite   * Math.pow(1 + growth.elite/100,   mo));
      const rev  = s*ECON.starter.price + p*ECON.premium.price + e*ECON.elite.price;
      const costs= s*(ECON.starter.api+ECON.starter.stripe) + p*(ECON.premium.api+ECON.premium.stripe) + e*(ECON.elite.api+ECON.elite.stripe);
      return { mo:`M${mo}`, starter:s, premium:p, elite:e, total:s+p+e,
               rev:Math.round(rev), net:Math.round(rev-costs-HOSTING) };
    });
  }, [
    tierCounts,
    growth,
    ECON.starter.api,
    ECON.starter.price,
    ECON.starter.stripe,
    ECON.premium.api,
    ECON.premium.price,
    ECON.premium.stripe,
    ECON.elite.api,
    ECON.elite.price,
    ECON.elite.stripe,
  ]);

  const breakEvenMonth = liveData.find(d => d.net >= 0)?.mo ?? "Never";
  const mEnd = liveData[liveData.length - 1];

  const Tip = ({ text }) => {
    const [show, setShow] = useState(false);
    return (
      <span style={{ position:"relative", display:"inline-block", marginLeft:5 }}>
        <span onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}
          style={{ cursor:"help", fontSize:11, color:D.muted, fontWeight:700,
            background:D.tray, border:`1px solid rgba(255,255,255,0.08)`, borderRadius:"50%",
            width:16, height:16, display:"inline-flex", alignItems:"center", justifyContent:"center" }}>?</span>
        {show && (
          <div style={{ position:"absolute", bottom:"120%", left:"50%", transform:"translateX(-50%)",
            background:"#1e293b", color:"#fff", fontSize:11, lineHeight:1.6,
            padding:"8px 12px", borderRadius:8, width:240, zIndex:100,
            boxShadow:"0 4px 16px rgba(0,0,0,0.25)", pointerEvents:"none" }}>{text}</div>
        )}
      </span>
    );
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

      {/* ── Current status widgets ────────────────────────── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <SubscriberSnapshot rows={financeSnapshotRows} />
        <NetIncomeMini users={users} />
        <AppGrowth users={users} />
        <ApiUsageMini users={users} />
      </div>

      {/* Growth projection */}
      <ShellCard>
        <SlateHeader title="Growth Projection" />
        <div style={{ padding:"16px 20px 20px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start",
          flexWrap:"wrap", gap:12, marginBottom:20 }}>
          <div>
            <div style={{ fontSize:13, fontWeight:800, color:D.text, marginBottom:2 }}>
              Growth projection — from your current {totalPaid} paid subscribers
            </div>
            <div style={{ fontSize:12, color:D.muted }}>
              Each tier grows independently. Starter typically grows fastest — it's your cheapest entry point.
            </div>
          </div>
          <DarkToggle
            options={[{l:"1mo",v:1},{l:"3mo",v:3},{l:"6mo",v:6},{l:"12mo",v:12},{l:"24mo",v:24}]}
            value={chartMonths} onChange={setChartMonths} />
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:12, marginBottom:20 }}>
          {[
            { key:"starter", label:"Starter growth/mo", color:"#1e40af",
              tip:"How fast your Starter ($9.99) subscriber count grows each month. Expect this to be your highest — it's your cheapest and easiest sell. 10–15% is realistic with active marketing." },
            { key:"premium", label:"Premium growth/mo", color:"#5b21b6",
              tip:"Monthly growth rate for Premium ($19.99) subscribers. Usually slower than Starter — fewer people start at a higher price. 5–10% is realistic." },
            { key:"elite",   label:"Elite growth/mo",   color:"#92400e",
              tip:"Monthly growth rate for Elite ($39.99) subscribers. This is your slowest-growing tier — high price means fewer conversions. Even 2–5% is solid." },
          ].map(({ key, label, color, tip }) => (
            <div key={key} style={{ background:D.tray, borderRadius:10, padding:"14px 16px",
              border:`1px solid rgba(255,255,255,0.08)` }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                <div style={{ fontSize:11, fontWeight:700, color:D.muted, textTransform:"uppercase",
                  letterSpacing:"0.06em", display:"flex", alignItems:"center" }}>
                  {label}<Tip text={tip} />
                </div>
                <div style={{ fontSize:22, fontWeight:900, color:D.text }}>{growth[key]}%</div>
              </div>
              <input type="range" min={0} max={30} step={1} value={growth[key]}
                onChange={e => setG(key, parseInt(e.target.value))}
                style={{ width:"100%", accentColor:D.blue, cursor:"pointer", marginBottom:8 }} />
              <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                {[{v:2,l:"Low"},{v:5,l:"Slow"},{v:10,l:"Steady"},{v:18,l:"Fast"}].map(({v,l}) => (
                  <button key={v} onClick={() => setG(key, v)}
                    style={{ padding:"4px 10px", borderRadius:6, fontSize:11, fontWeight:600,
                      border:"none", cursor:"pointer",
                      background:growth[key]===v?D.blue:D.elevated,
                      boxShadow:D.btnShadow,
                      color:growth[key]===v?"#fff":D.muted }}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={liveData.slice(0, chartMonths)} margin={{ top:4, right:16, left:0, bottom:0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={D.divider} />
            <XAxis dataKey="mo" tick={{ fill:D.muted, fontSize:11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill:D.muted, fontSize:11 }} axisLine={false} tickLine={false}
              tickFormatter={v => fmt$(v)} width={60} />
            <Tooltip
              contentStyle={{ background:D.shell, border:"none", boxShadow:D.shellShadow, borderRadius:10, fontSize:12 }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const d = liveData.find(x => x.mo === label);
                return (
                  <div style={{ background:D.shell, boxShadow:D.shellShadow, borderRadius:10,
                    padding:"10px 14px", fontSize:12 }}>
                    <div style={{ fontWeight:700, color:D.text, marginBottom:6 }}>{label}</div>
                    {payload.map((p,i) => (
                      <div key={i} style={{ display:"flex", justifyContent:"space-between",
                        gap:16, color:D.muted, marginBottom:2 }}>
                        <span>{p.name}</span>
                        <span style={{ fontWeight:700, color:p.value>=0?D.green:D.red }}>
                          {p.value>=0?"+":""}{fmt$(p.value)}
                        </span>
                      </div>
                    ))}
                    {d && (
                      <div style={{ borderTop:`1px solid ${D.divider}`, marginTop:6, paddingTop:6,
                        color:D.muted, fontSize:11 }}>
                        <div style={{ marginBottom:2 }}>
                          <span>Total subscribers </span>
                          <span style={{ fontWeight:700, color:D.text }}>{d.total}</span>
                        </div>
                        <div style={{ display:"flex", gap:8 }}>
                          <span>Starter <strong style={{color:D.text}}>{d.starter}</strong></span>
                          <span>Premium <strong style={{color:D.text}}>{d.premium}</strong></span>
                          <span>Elite <strong style={{color:D.text}}>{d.elite}</strong></span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }}
            />
            <ReferenceLine y={0} stroke={D.red} strokeDasharray="4 2"
              label={{ value:"Break-even", position:"insideTopRight", fill:D.red, fontSize:10 }} />
            <Line dataKey="rev" name="Monthly revenue" stroke={D.green} strokeWidth={2.5} dot={false} type="monotone" />
            <Line dataKey="net" name="Monthly profit/loss" stroke={"#60a5fa"} strokeWidth={2.5} dot={false} type="monotone" strokeDasharray="6 3" />
          </LineChart>
        </ResponsiveContainer>

        {/* Snapshot tiles: 1mo / 3mo / 6mo / 12mo / 24mo + Current below 1mo */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:10, marginTop:16 }}>
          {/* Row 1: projection tiles */}
          {[1,3,6,12,24].map(mo => {
            const d = liveData.find(x => x.mo === `M${mo}`) ?? liveData[liveData.length-1];
            const isPos = d.net >= 0;
            return (
              <div key={mo} style={{ background:D.shell, border:`1px solid rgba(255,255,255,0.08)`,
                borderRadius:12, overflow:"hidden" }}>
                <div style={{ background:"linear-gradient(180deg,#5a7292 0%,#4a5f7f 100%)",
                  padding:"8px 10px", fontSize:11, fontWeight:700, color:"#fff" }}>
                  {mo === 1 ? "1 month" : `${mo} months`}
                </div>
                <div style={{ padding:"10px 12px" }}>
                  <div style={{ fontSize:20, fontWeight:900, lineHeight:1, marginBottom:8,
                    color: isPos ? D.green : D.red }}>
                    {isPos ? "+" : ""}{fmt$(d.net)}
                  </div>
                  <div style={{ background:D.tray, borderRadius:6, padding:"6px 8px",
                    display:"flex", flexDirection:"column", gap:3, fontSize:10 }}>
                    <div style={{ display:"flex", justifyContent:"space-between" }}>
                      <span style={{color:D.muted}}>Revenue</span>
                      <span style={{fontWeight:700, color:D.green}}>{fmt$(d.rev)}</span>
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between" }}>
                      <span style={{color:D.muted}}>Subs</span>
                      <span style={{fontWeight:600, color:D.text}}>{d.total} ({d.starter}S/{d.premium}P/{d.elite}E)</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Row 2: Current sits under 1 month only */}
          <div style={{ background:D.shell, border:`1px solid rgba(255,255,255,0.08)`,
            borderRadius:12, overflow:"hidden" }}>
            <div style={{ background:"linear-gradient(180deg,#5a7292 0%,#4a5f7f 100%)",
              padding:"8px 10px", fontSize:11, fontWeight:700, color:"#fff" }}>
              Current
            </div>
            <div style={{ padding:"10px 12px" }}>
              <div style={{ fontSize:20, fontWeight:900, lineHeight:1, marginBottom:8,
                color: currentNet >= 0 ? D.green : D.red }}>
                {currentNet >= 0 ? "+" : ""}{fmt$(currentNet)}
              </div>
              <div style={{ background:D.tray, borderRadius:6, padding:"6px 8px",
                display:"flex", flexDirection:"column", gap:3, fontSize:10 }}>
                <div style={{ display:"flex", justifyContent:"space-between" }}>
                  <span style={{color:D.muted}}>Revenue</span>
                  <span style={{fontWeight:700, color:D.green}}>{fmt$(currentMonthlyRev)}</span>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between" }}>
                  <span style={{color:D.muted}}>Subs</span>
                  <span style={{fontWeight:600, color:D.text}}>{totalPaid} ({tierCounts.starter}S/{tierCounts.premium}P/{tierCounts.elite}E)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div></ShellCard>

      {/* Price adjustment */}
      <ShellCard><div style={{ padding:"16px 20px 20px" }}>
        <div style={{ fontSize:13, fontWeight:800, color:D.text, marginBottom:4 }}>
          Adjust tier pricing
        </div>
        <div style={{ fontSize:12, color:D.muted, marginBottom:16, lineHeight:1.5 }}>
          Change what you charge per tier — the projection, chart, and all month cards above update instantly.
          Use this to model a price increase or test what different price points do to your net income.
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
          {[
            { key:"starter", label:"Starter", color:"#1e40af",
              tip:"Current Starter price. Raising this improves margin but may reduce new signups — your most price-sensitive tier." },
            { key:"premium", label:"Premium", color:"#5b21b6",
              tip:"Current Premium price. Mid-tier subscribers are somewhat price-insensitive. A $2–5 increase is often absorbed without churn." },
            { key:"elite",   label:"Elite",   color:"#92400e",
              tip:"Current Elite price. These are your highest-value subscribers. They chose the top tier, so they're least likely to churn from a price increase." },
          ].map(({ key, label, color, tip }) => {
            const keep = netPer(key);
            const stripe = ECON[key].stripe;
            const api = ECON[key].api;
            return (
              <div key={key} style={{ background:D.tray, border:`1px solid rgba(255,255,255,0.08)`,
                borderRadius:12, overflow:"hidden" }}>
                <div style={{ background:"linear-gradient(180deg,#5a7292 0%,#4a5f7f 100%)",
                  padding:"10px 16px", display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:color }} />
                  <span style={{ fontSize:13, fontWeight:700, color:"#fff" }}>{label}</span>
                  <Tip text={tip} />
                </div>
                <div style={{ padding:"16px" }}>
                  {/* Price stepper */}
                  <div style={{ fontSize:10, fontWeight:700, color:D.muted, textTransform:"uppercase",
                    letterSpacing:"0.06em", marginBottom:8 }}>Price / month</div>
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:16 }}>
                    <span style={{ fontSize:13, color:D.muted, fontWeight:600 }}>$</span>
                    <button onClick={() => setP(key, prices[key] - 1)}
                      style={{ width:28, height:28, borderRadius:6, border:"none",
                        background:D.elevated, boxShadow:D.btnShadow, cursor:"pointer", fontSize:15, fontWeight:700, color:D.text,
                        display:"flex", alignItems:"center", justifyContent:"center" }}>−</button>
                    <input type="number" value={prices[key]} min={0} step={0.50}
                      onChange={e => setP(key, parseFloat(e.target.value)||0)}
                      style={{ width:72, textAlign:"center", border:`1px solid rgba(255,255,255,0.08)`,
                        borderRadius:6, padding:"5px 8px", fontSize:17, fontWeight:800,
                        color:D.text, background:D.recessed, outline:"none" }} />
                    <button onClick={() => setP(key, prices[key] + 1)}
                      style={{ width:28, height:28, borderRadius:6, border:"none",
                        background:D.elevated, boxShadow:D.btnShadow, cursor:"pointer", fontSize:15, fontWeight:700, color:D.text,
                        display:"flex", alignItems:"center", justifyContent:"center" }}>+</button>
                  </div>
                  {/* Breakdown */}
                  <div style={{ background:D.shell, borderRadius:8, padding:"10px 12px",
                    display:"flex", flexDirection:"column", gap:5, fontSize:12 }}>
                    <div style={{ display:"flex", justifyContent:"space-between" }}>
                      <span style={{color:D.muted}}>xAI API cost</span>
                      <span style={{color:D.red, fontWeight:600}}>−${api.toFixed(3)}</span>
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between" }}>
                      <span style={{color:D.muted}}>Stripe fee</span>
                      <span style={{color:D.red}}>−${stripe.toFixed(2)}</span>
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between",
                      borderTop:`1px solid ${D.divider}`, paddingTop:5, marginTop:2 }}>
                      <span style={{color:D.text, fontWeight:600}}>You keep</span>
                      <span style={{color:keep>=0?D.green:D.red, fontWeight:800,
                        fontSize:14}}>{keep>=0?"+":""}{fmt$(keep)}/mo</span>
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between" }}>
                      <span style={{color:D.muted, fontSize:11}}>Margin</span>
                      <span style={{color:D.muted, fontSize:11}}>{prices[key]>0?((keep/prices[key])*100).toFixed(1):"—"}%</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div></ShellCard>

      {/* Unit economics */}
      <ShellCard><div style={{ padding:"16px 20px 20px" }}>
        <div style={{ fontSize:13, fontWeight:800, color:D.text, marginBottom:4 }}>What you make per subscriber</div>
        <div style={{ fontSize:12, color:D.muted, marginBottom:16 }}>Where each subscriber's money goes before it reaches you.</div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead>
              <tr style={{ background:D.tray, borderBottom:`1px solid ${D.divider}` }}>
                {[
                  {h:"Tier",tip:null},
                  {h:"Price/mo",tip:"What they pay you each month."},
                  {h:"Messages",tip:"AI responses per month."},
                  {h:"Images",tip:"AI-generated images per month."},
                  {h:"xAI cost",tip:"What you pay xAI to serve their usage."},
                  {h:"Stripe fee",tip:"Stripe takes 2.9% + $0.30 per payment, every month."},
                  {h:"You keep",tip:"Left after xAI and Stripe. Hosting ($371/mo) comes out of the combined total."},
                  {h:"Margin",tip:"% of subscription kept after xAI and Stripe."},
                  {h:"LTV (18mo)",tip:"If a subscriber stays 18 months (industry average), this is the total you keep from them."},
                ].map(({h,tip})=>(
                  <th key={h} style={{ padding:"9px 14px", textAlign:"left", color:D.muted,
                    fontWeight:600, fontSize:11, textTransform:"uppercase", letterSpacing:"0.04em", whiteSpace:"nowrap" }}>
                    <span style={{display:"inline-flex",alignItems:"center"}}>{h}{tip&&<Tip text={tip}/>}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                {tier:"Free Trial",price:"$0",    msg:"20",   img:"0",  api:"$0.04",stripe:"—",    keep:"—",     margin:"—",    ltv:"—"},
                {tier:"Starter",   price:"$9.99", msg:"300",  img:"10", api:"$4.00",stripe:"$0.59",keep:"$5.40", margin:"54.0%",ltv:"$97"},
                {tier:"Premium",   price:"$19.99",msg:"900",  img:"30", api:"$12.01",stripe:"$0.88",keep:"$7.10",margin:"35.5%",ltv:"$128"},
                {tier:"Elite",     price:"$39.99",msg:"2,200",img:"100",api:"$29.89",stripe:"$1.46",keep:"$8.65",margin:"21.6%",ltv:"$156"},
              ].map((r,i)=>(
                <tr key={i} style={{ borderBottom:`1px solid ${D.divider}`, background:i%2===0?D.shell:"rgba(255,255,255,0.02)" }}>
                  <td style={{padding:"11px 14px"}}>{tierBadge(r.tier)}</td>
                  <td style={{padding:"11px 14px",fontWeight:700,color:D.text}}>{r.price}</td>
                  <td style={{padding:"11px 14px",color:D.muted}}>{r.msg}</td>
                  <td style={{padding:"11px 14px",color:D.muted}}>{r.img}</td>
                  <td style={{padding:"11px 14px",color:D.red,fontWeight:600}}>{r.api}</td>
                  <td style={{padding:"11px 14px",color:D.red}}>{r.stripe}</td>
                  <td style={{padding:"11px 14px",color:D.green,fontWeight:700}}>{r.keep}</td>
                  <td style={{padding:"11px 14px",color:D.text}}>{r.margin}</td>
                  <td style={{padding:"11px 14px",color:D.text,fontWeight:600}}>{r.ltv}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop:14, padding:"12px 16px", background:D.tray,
          border:`1px solid rgba(255,255,255,0.08)`, borderRadius:8, fontSize:12, color:D.muted, lineHeight:1.7 }}>
          💡 <strong style={{color:D.text}}>Hosting note:</strong> Your $371/mo hosting is shared across all subscribers.
          At {BREAKEVEN_USERS} subs it's covered. At 100 subs it's $3.71/person.
        </div>
      </div></ShellCard>

      <AdSpendTracker />

    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// USERS
// ══════════════════════════════════════════════════════════════
// ─── strike policy & mock history ────────────────────────────
