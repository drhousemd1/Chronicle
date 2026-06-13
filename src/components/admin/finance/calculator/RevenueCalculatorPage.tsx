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

export function RevenueCalcPage() {
  const API_COST  = { starter: 4.002, premium: 12.007, elite: 29.885 };
  const stripeFee = (price: number) => price * 0.029 + 0.30;
  return <CalcTab API_COST={API_COST} stripeFee={stripeFee} />;
}

type RevenueTierId = "starter" | "premium" | "elite";
type RevenueTierValues = Record<RevenueTierId, number>;

// Pulled out so it can hold its own useState cleanly
function CalcTab({ API_COST, stripeFee }: { API_COST: RevenueTierValues; stripeFee: (revenue: number, subs?: number) => number }) {
  const [users, setUsers]   = useState<RevenueTierValues>({ starter:10, premium:5, elite:2 });
  const [prices, setPrices] = useState<RevenueTierValues>({ starter:9.99, premium:19.99, elite:39.99 });
  const HOSTING = 371;

  const tiers: Array<{ id: RevenueTierId; label: string; color: string; msgLimit: number; imgLimit: number }> = [
    { id:"starter", label:"Starter", color:"#60a5fa", msgLimit:300,  imgLimit:10  },
    { id:"premium", label:"Premium", color:"#a78bfa", msgLimit:900,  imgLimit:30  },
    { id:"elite",   label:"Elite",   color:"#fbbf24", msgLimit:2200, imgLimit:100 },
  ];

  const calc = tiers.map(t => {
    const n      = users[t.id];
    const price  = prices[t.id];
    const rev    = n * price;
    const stripe = n * stripeFee(price);
    const api    = n * API_COST[t.id];
    const net    = rev - stripe - api;
    return { ...t, n, price, rev, stripe, api, net };
  });

  const totalRev    = calc.reduce((a, t) => a + t.rev, 0);
  const totalStripe = calc.reduce((a, t) => a + t.stripe, 0);
  const totalApi    = calc.reduce((a, t) => a + t.api, 0);
  const totalNet    = totalRev - totalStripe - totalApi - HOSTING;
  const totalUsers  = calc.reduce((a, t) => a + t.n, 0);

  const projections = [1, 3, 6, 12].map(mo => ({
    mo, label: mo===1?"1 month":mo===3?"3 months":mo===6?"6 months":"12 months",
    net: totalNet * mo, rev: totalRev * mo,
    costs: (totalStripe + totalApi + HOSTING) * mo,
  }));

  const numInput = (
    val: number,
    onChange: (value: number) => void,
    { step=1, min=0, prefix="" }: { step?: number; min?: number; prefix?: string } = {},
  ) => (
    <div style={{ display:"flex", alignItems:"center", gap:4 }}>
      {prefix && <span style={{ fontSize:13, color:D.muted, fontWeight:600 }}>{prefix}</span>}
      <button onClick={() => onChange(Math.max(min, val - step))} style={{
        width:24, height:24, borderRadius:6, border:"none",
        background:D.elevated, boxShadow:D.btnShadow,
        color:D.text, fontSize:15, cursor:"pointer",
        display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, flexShrink:0,
      }}>−</button>
      <input type="number" value={val} min={min} step={step}
        onChange={e => onChange(Math.max(min, parseFloat(e.target.value)||0))}
        style={{ width:70, textAlign:"center", border:"none",
          borderTop:"1px solid rgba(0,0,0,0.35)",
          borderRadius:6, padding:"4px 6px", fontSize:13, fontWeight:700,
          color:D.text, background:D.recessed, outline:"none" }}/>
      <button onClick={() => onChange(val + step)} style={{
        width:24, height:24, borderRadius:6, border:"none",
        background:D.elevated, boxShadow:D.btnShadow,
        color:D.text, fontSize:15, cursor:"pointer",
        display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, flexShrink:0,
      }}>+</button>
    </div>
  );

  const fmt  = (n: number) => n < 0 ? `-$${Math.abs(n).toFixed(2)}` : `+$${n.toFixed(2)}`;
  const fmtK = (n: number) => {
    const abs = Math.abs(n);
    const str = abs >= 1000 ? `$${(abs/1000).toFixed(1)}k` : `$${abs.toFixed(2)}`;
    return n < 0 ? `−${str}` : `+${str}`;
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

      {/* time projections */}
      <div>
        <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase",
          letterSpacing:"0.08em", color:D.muted, marginBottom:10 }}>
          Projected net income over time
        </div>
        <p style={{ fontSize:12, color:D.muted, margin:"0 0 14px", lineHeight:1.5 }}>
          Assumes subscriber counts and prices stay the same each month. No growth factored in — adjust inputs below and these update instantly.
        </p>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
          {projections.map(p => {
            const isPos = p.net >= 0;
            return (
              <ShellCard key={p.mo}>
                <SlateHeader title={p.label} />
                <div style={{ padding:"16px 16px 18px" }}>
                  <div style={{ fontSize:28, fontWeight:900, lineHeight:1, marginBottom:14,
                    color: isPos ? D.green : D.red }}>
                    {fmtK(p.net)}
                  </div>
                  <div style={{ background:D.tray, boxShadow:D.trayShadow, borderRadius:10,
                    padding:"10px 12px", display:"flex", flexDirection:"column", gap:5, fontSize:11 }}>
                    <div style={{ display:"flex", justifyContent:"space-between" }}>
                      <span style={{color:D.muted}}>Total revenue</span>
                      <span style={{fontWeight:700, color:D.green}}>${p.rev >= 1000 ? `${(p.rev/1000).toFixed(1)}k` : p.rev.toFixed(0)}</span>
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between" }}>
                      <span style={{color:D.muted}}>Total costs</span>
                      <span style={{fontWeight:700, color:D.red}}>−${p.costs >= 1000 ? `${(p.costs/1000).toFixed(1)}k` : p.costs.toFixed(0)}</span>
                    </div>
                  </div>
                </div>
              </ShellCard>
            );
          })}
        </div>
      </div>

      {/* inputs row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
        {calc.map(t => (
          <ShellCard key={t.id}>
            <SlateHeader title={t.label} />
            <div style={{ padding:"18px 16px" }}>
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                {/* user count */}
                <div>
                  <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase",
                    letterSpacing:"0.06em", color:D.muted, marginBottom:6 }}>Subscribers</div>
                  {numInput(t.n, (v: number) => setUsers(u => ({...u,[t.id]:Math.round(v)})), { step:1, min:0 })}
                </div>

                {/* price */}
                <div>
                  <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase",
                    letterSpacing:"0.06em", color:D.muted, marginBottom:6 }}>Price / month</div>
                  {numInput(t.price, (v: number) => setPrices(p => ({...p,[t.id]:v})), { step:0.50, min:0, prefix:"$" })}
                </div>

                {/* live breakdown */}
                <div style={{ background:D.tray, boxShadow:D.trayShadow, borderRadius:10,
                  padding:"12px 14px", display:"flex", flexDirection:"column", gap:6 }}>
                  {[
                    { label:"Gross revenue",       val:`$${t.rev.toFixed(2)}`,     color:D.green },
                    { label:"Stripe fees",          val:`−$${t.stripe.toFixed(2)}`, color:D.red, note:"2.9% + $0.30/sub" },
                    { label:"xAI API cost",         val:`−$${t.api.toFixed(2)}`,    color:D.red, note:`${t.msgLimit.toLocaleString()} msgs + ${t.imgLimit} imgs` },
                    { label:"Net (before hosting)", val:fmt(t.net), color:t.net>=0?D.green:D.red, bold:true },
                  ].map(row => (
                    <div key={row.label} style={{ display:"flex", justifyContent:"space-between",
                      alignItems:"baseline", fontSize:12 }}>
                      <div>
                        <span style={{ color:D.muted }}>{row.label}</span>
                        {row.note && <span style={{ fontSize:10, color:D.muted, marginLeft:5 }}>({row.note})</span>}
                      </div>
                      <span style={{ fontWeight:row.bold?800:600, color:row.color, fontFeatureSettings:'"tnum"' }}>
                        {row.val}
                      </span>
                    </div>
                  ))}
                </div>

                {/* per-sub stats */}
                <div style={{ background:D.recessed, borderTop:"1px solid rgba(0,0,0,0.35)",
                  borderRadius:8, padding:"10px 12px" }}>
                  <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase",
                    letterSpacing:"0.05em", color:D.muted, marginBottom:6 }}>Per subscriber</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:4, fontSize:11 }}>
                    <div style={{ display:"flex", justifyContent:"space-between" }}>
                      <span style={{color:D.muted}}>You receive after Stripe</span>
                      <span style={{fontWeight:700, color:D.text}}>${(t.price - stripeFee(t.price)).toFixed(2)}</span>
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between" }}>
                      <span style={{color:D.muted}}>xAI API cost</span>
                      <span style={{fontWeight:700, color:D.red}}>−${API_COST[t.id].toFixed(3)}</span>
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between",
                      borderTop:`1px solid ${D.divider}`, paddingTop:4, marginTop:2 }}>
                      <span style={{color:D.muted}}>Net per sub (excl. hosting)</span>
                      <span style={{fontWeight:800, color:t.net>=0?D.green:D.red}}>
                        {t.n > 0 ? fmt(t.net / t.n) : "$0.00"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ShellCard>
        ))}
      </div>

      {/* monthly summary */}
      <ShellCard>
        <SlateHeader title={`Monthly Summary — ${totalUsers} total subscribers`} />
        <div style={{ padding:"16px 20px 20px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start",
            flexWrap:"wrap", gap:16, marginBottom:20 }}>
            <div style={{ fontSize:12, color:D.muted, lineHeight:1.5 }}>
              Hosting is $371/mo fixed (Supabase free tier, 0–499 users)
              {totalUsers >= 500 && <span style={{ color:D.amber, fontWeight:700 }}> ⚠ Above 499 users — hosting jumps to $946/mo at 500+</span>}
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:11, color:D.muted, marginBottom:2 }}>Monthly net income</div>
              <div style={{ fontSize:36, fontWeight:900, lineHeight:1,
                color: totalNet >= 0 ? D.green : D.red }}>
                {fmtK(totalNet)}
              </div>
            </div>
          </div>

          {/* cost waterfall */}
          <div style={{ background:D.tray, boxShadow:D.trayShadow,
            borderRadius:12, overflow:"hidden", marginBottom:16 }}>
            {[
              { label:"Gross revenue",       val:totalRev,    color:D.green, sign:"+"  },
              { label:"Stripe payment fees", val:-totalStripe,color:D.red,   sign:"−", note:"2.9% + $0.30 per subscriber" },
              { label:"xAI API costs",       val:-totalApi,   color:D.red,   sign:"−", note:"Based on tier message/image limits" },
              { label:"Hosting (Supabase)",  val:-HOSTING,    color:D.muted, sign:"−", note:"Fixed — Supabase free tier + server" },
              { label:"Net income",          val:totalNet,    color:totalNet>=0?D.green:D.red, sign:totalNet>=0?"+":"−", bold:true },
            ].map((row, i) => {
              const isLast = i === 4;
              return (
                <div key={row.label} style={{
                  display:"flex", justifyContent:"space-between", alignItems:"center",
                  padding:"12px 16px",
                  background: isLast ? D.tray : i%2===0?"transparent":"rgba(255,255,255,0.02)",
                  borderTop: i > 0 ? `1px solid ${D.divider}` : "none",
                }}>
                  <div>
                    <span style={{ fontSize:13, fontWeight:isLast?700:400, color:isLast?row.color:D.text }}>
                      {row.label}
                    </span>
                    {row.note && <span style={{ fontSize:11, color:D.muted, marginLeft:8 }}>{row.note}</span>}
                  </div>
                  <span style={{ fontSize:isLast?20:14, fontWeight:isLast?900:600,
                    color:row.color, fontFeatureSettings:'"tnum"' }}>
                    {row.sign}${Math.abs(row.val).toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* per-tier net contribution bar */}
          <div>
            <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase",
              letterSpacing:"0.06em", color:D.muted, marginBottom:10 }}>
              Net contribution by tier (before hosting)
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {calc.map(t => {
                const barMax = Math.max(...calc.map(x => Math.abs(x.net)), 1);
                const pct    = Math.abs(t.net) / barMax * 100;
                return (
                  <div key={t.id} style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:70, fontSize:12, fontWeight:600, color:t.color, flexShrink:0 }}>
                      {t.label}
                    </div>
                    <div style={{ flex:1, height:20, background:D.recessed,
                      borderRadius:6, overflow:"hidden", position:"relative" }}>
                      <div style={{
                        position:"absolute", left:0, top:0, bottom:0,
                        width:`${pct}%`, background:t.net>=0?t.color:D.red,
                        borderRadius:6, opacity:0.8, minWidth:t.n>0?4:0,
                      }}/>
                    </div>
                    <div style={{ width:90, textAlign:"right", fontSize:13, fontWeight:700,
                      color:t.net>=0?D.green:D.red, flexShrink:0 }}>
                      {fmt(t.net)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </ShellCard>

    </div>
  );
}
