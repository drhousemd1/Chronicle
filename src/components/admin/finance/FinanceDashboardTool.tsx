// @ts-nocheck
/**
 * Chronicle Admin Dashboard
 * Light theme · Left sidebar navigation
 * ─────────────────────────────────────────────────────────────
 * Sections:  Overview · Finance · Users · Reports · API Usage
 * TODO markers indicate Supabase wiring points
 */

import React, { useState, useMemo, useEffect } from "react";
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
  type AdminApiUsageTestRow,
  type AdminApiUsageTestReport,
  type AdminApiUsageValidationStatus,
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

// ─── inject global styles for always-visible scrollbars ───────
const GLOBAL_STYLE = `
  .force-scrollbar { overflow-x: scroll !important; }
  .force-scrollbar::-webkit-scrollbar { height: 10px !important; display: block !important; }
  .force-scrollbar::-webkit-scrollbar-track { background: #e2e8f0; border-radius: 4px; }
  .force-scrollbar::-webkit-scrollbar-thumb { background: #94a3b8; border-radius: 4px; }
  [contenteditable][data-placeholder]:empty:before {
    content: attr(data-placeholder);
    color: #52525b;
    pointer-events: none;
  }
  .force-scrollbar::-webkit-scrollbar-thumb:hover { background: #64748b; }
`;

// ─── palette ──────────────────────────────────────────────────
const C = {
  bg:          "#f4f6f9",
  sidebar:     "#ffffff",
  surface:     "#ffffff",
  card:        "#ffffff",
  cardBorder:  "#e8ecf2",
  hover:       "#f0f4fa",
  activeNav:   "#eef3fc",
  text:        "#1a2133",
  muted:       "#374151",
  dim:         "#4b5563",
  divider:     "#e8ecf2",
  blue:        "#2563eb",
  blueSoft:    "#eff4ff",
  blueLight:   "#3b82f6",
  purple:      "#7c3aed",
  purpleSoft:  "#f5f3ff",
  amber:       "#d97706",
  amberSoft:   "#fffbeb",
  green:       "#059669",
  greenSoft:   "#ecfdf5",
  red:         "#dc2626",
  redSoft:     "#fef2f2",
  orange:      "#ea580c",
  conservative:"#475569",
  base:        "#2563eb",
  optimistic:  "#059669",
};

// ─── dark palette — overview + sidebar only ───────────────────
const D = {
  bg:          "#0d0e12",
  sidebar:     "#1b1b20",
  shell:       "#2a2a2f",
  tray:        "#2e2e33",
  elevated:    "#3c3e47",
  recessed:    "#1c1c1f",
  shellShadow: "0 12px 32px -2px rgba(0,0,0,0.50), inset 1px 1px 0 rgba(255,255,255,0.09), inset -1px -1px 0 rgba(0,0,0,0.35)",
  trayShadow:  "inset 1px 1px 0 rgba(255,255,255,0.07), inset -1px -1px 0 rgba(0,0,0,0.30), 0 4px 12px rgba(0,0,0,0.25)",
  btnShadow:   "0 8px 24px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.09), inset 0 -1px 0 rgba(0,0,0,0.20)",
  text:        "#e4e1e8",
  muted:       "#a1a1aa",
  dim:         "#525260",
  divider:     "rgba(255,255,255,0.06)",
  blue:        "#3b82f6",
  blueGlow:    "0 2px 8px rgba(59,130,246,0.35)",
  blueActive:  "rgba(59,130,246,0.12)",
  green:       "#22c55e",
  greenDim:    "rgba(34,197,94,0.15)",
  red:         "#ef4444",
  redDim:      "rgba(239,68,68,0.15)",
  amber:       "#f59e0b",
  amberDim:    "rgba(245,158,11,0.15)",
  purple:      "#a78bfa",
  glow:        (color: string) => `0 0 18px ${color}22`,
};

// ─── outer shell card — 24px radius, overflow hidden so header clips ──
const ShellCard = ({ children, style={} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{
    background: D.shell,
    boxShadow: D.shellShadow,
    borderRadius: 24,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    ...style,
  }}>{children}</div>
);

// ─── inner tray — 16px radius, sits inside shell ─────────────
const Tray = ({ children, style={} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{
    background: D.tray,
    boxShadow: D.trayShadow,
    borderRadius: 16,
    ...style,
  }}>{children}</div>
);
const MONTHLY_FORECAST = [
  { mo:"M1",  cPaid:10, cRev:160,  cEBIT:-230, bPaid:25,  bRev:480,  bEBIT:46,   oPaid:50,  oRev:1060, oEBIT:544  },
  { mo:"M2",  cPaid:11, cRev:200,  cEBIT:-197, bPaid:28,  bRev:520,  bEBIT:82,   oPaid:59,  oRev:1269, oEBIT:724  },
  { mo:"M3",  cPaid:12, cRev:210,  cEBIT:-188, bPaid:31,  bRev:590,  bEBIT:142,  oPaid:69,  oRev:1469, oEBIT:898  },
  { mo:"M4",  cPaid:13, cRev:250,  cEBIT:-154, bPaid:34,  bRev:630,  bEBIT:178,  oPaid:81,  oRev:1719, oEBIT:1114 },
  { mo:"M5",  cPaid:14, cRev:240,  cEBIT:-161, bPaid:38,  bRev:690,  bEBIT:231,  oPaid:95,  oRev:1999, oEBIT:1356 },
  { mo:"M6",  cPaid:15, cRev:250,  cEBIT:-152, bPaid:42,  bRev:770,  bEBIT:300,  oPaid:112, oRev:2379, oEBIT:1683 },
  { mo:"M7",  cPaid:16, cRev:290,  cEBIT:-118, bPaid:47,  bRev:870,  bEBIT:387,  oPaid:132, oRev:2799, oEBIT:2046 },
  { mo:"M8",  cPaid:17, cRev:280,  cEBIT:-125, bPaid:52,  bRev:939,  bEBIT:450,  oPaid:155, oRev:3258, oEBIT:2445 },
  { mo:"M9",  cPaid:18, cRev:320,  cEBIT:-92,  bPaid:58,  bRev:1049, bEBIT:545,  oPaid:182, oRev:3858, oEBIT:2961 },
  { mo:"M10", cPaid:19, cRev:330,  cEBIT:-83,  bPaid:64,  bRev:1159, bEBIT:641,  oPaid:214, oRev:4528, oEBIT:3540 },
  { mo:"M11", cPaid:20, cRev:320,  cEBIT:-89,  bPaid:71,  bRev:1309, bEBIT:771,  oPaid:252, oRev:5317, oEBIT:4223 },
  { mo:"M12", cPaid:21, cRev:360,  cEBIT:-56,  bPaid:79,  bRev:1449, bEBIT:898,  oPaid:297, oRev:6289, oEBIT:5072 },
];

const ANNUAL = [
  { year:"Yr 1", cRev:3208,  cEBIT:-1644, bRev:10454,  bEBIT:4666,   oRev:35933,  oEBIT:26586  },
  { year:"Yr 2", cRev:6116,  cEBIT:918,   bRev:37499,  bEBIT:28299,  oRev:255758, oEBIT:211404 },
  { year:"Yr 3", cRev:13242, cEBIT:7195,  bRev:142921, bEBIT:115809, oRev:1857645,oEBIT:1569961},
];

const BREAKEVEN = [
  { users:1,  ebit:-337 }, { users:5,  ebit:-268 }, { users:10, ebit:-206 },
  { users:15, ebit:-119 }, { users:20, ebit:-57  }, { users:25, ebit:46   },
  { users:30, ebit:108  }, { users:40, ebit:258  }, { users:50, ebit:423  },
  { users:75, ebit:824  }, { users:100,ebit:1201 }, { users:150,ebit:1995 },
];

const MOCK_USERS = [
  { id:1, email:"alice@example.com", username:"alice_w",  tier:"Premium", status:"active",    strikes:0, stories:12, reportCount:0, reported:false, joined:"2026-01-14" },
  { id:2, email:"bob@example.com",   username:"bob_r",    tier:"Elite",   status:"active",    strikes:1, stories:34, reportCount:1, reported:true,  joined:"2026-01-22" },
  { id:3, email:"carol@example.com", username:"carol_s",  tier:"Starter", status:"active",    strikes:0, stories:4,  reportCount:0, reported:false, joined:"2026-02-03" },
  { id:4, email:"dave@example.com",  username:"dave_m",   tier:"Starter", status:"suspended", strikes:3, stories:8,  reportCount:3, reported:true,  joined:"2026-01-08" },
  { id:5, email:"eve@example.com",   username:"eve_t",    tier:"Premium", status:"cancelled", strikes:0, stories:22, reportCount:0, reported:false, joined:"2025-12-20" },
  { id:6, email:"frank@example.com", username:"frank_l",  tier:"Free",    status:"active",    strikes:0, stories:1,  reportCount:0, reported:false, joined:"2026-03-10" },
  { id:7, email:"grace@example.com", username:"grace_k",  tier:"Elite",   status:"active",    strikes:2, stories:67, reportCount:1, reported:true,  joined:"2026-01-30" },
  { id:8, email:"henry@example.com", username:"henry_b",  tier:"Starter", status:"active",    strikes:0, stories:9,  reportCount:0, reported:false, joined:"2026-02-18" },
];

const MOCK_REPORTS = [
  { id:1, reporter:"carol_s", accused:"bob_r",   reason:"Stolen character art",         storyId:"s-0042", date:"2026-03-20", status:"open"      },
  { id:2, reporter:"frank_l", accused:"dave_m",  reason:"Deepfake explicit content",    storyId:"s-0017", date:"2026-03-19", status:"open"      },
  { id:3, reporter:"alice_w", accused:"grace_k", reason:"Underage character depiction", storyId:"s-0081", date:"2026-03-18", status:"reviewing" },
  { id:4, reporter:"henry_b", accused:"dave_m",  reason:"Copyright infringement",       storyId:"s-0017", date:"2026-03-15", status:"resolved"  },
];

const MODEL_RATES = [
  { model:"grok-3-fast",       input:"$0.20/M", output:"$0.50/M",   note:"Primary chat model"  },
  { model:"grok-3-mini-fast",  input:"$0.10/M", output:"$0.30/M",   note:"Fallback / extraction"},
  { model:"grok-2-image-1212", input:"—",        output:"$0.02/img", note:"Image generation"    },
];

// ─── helpers ──────────────────────────────────────────────────
const fmt$ = (n: number) => Math.abs(n) >= 1000 ? `$${(n/1000).toFixed(1)}k` : `$${Math.round(n)}`;

const Badge = ({ label, bg, color }: { label: string; bg: string; color: string }) => (
  <span style={{ fontSize:11, fontWeight:600, padding:"2px 9px", borderRadius:20,
    background:bg, color, whiteSpace:"nowrap", display:"inline-block" }}>{label}</span>
);

const tierMeta   = {
  Elite:{bg:"#fef3c7",color:"#92400e"},
  Premium:{bg:"#ede9fe",color:"#5b21b6"},
  Starter:{bg:"#dbeafe",color:"#1e40af"},
  Free:{bg:"#f1f5f9",color:"#475569"},
  Admin:{bg:"#fee2e2",color:"#991b1b"},
  "Admin (CFO)":{bg:"#ffedd5",color:"#9a3412"},
};
const statusMeta = { active:{bg:"#d1fae5",color:"#065f46"}, cancelled:{bg:"#f1f5f9",color:"#475569"}, suspended:{bg:"#fee2e2",color:"#991b1b"} };

const tierBadge  = (t: string) => <Badge label={t}  {...((tierMeta as Record<string, {bg:string;color:string}>)[t]   || tierMeta.Free)} />;
const statusBadge= (s: string) => <Badge label={s}  {...((statusMeta as Record<string, {bg:string;color:string}>)[s] || statusMeta.cancelled)} />;

const USER_TIER_OVERRIDES_KEY = "admin_user_tier_overrides_v1";
const DEFAULT_TIER_PRICES = { free: 0, starter: 9.99, premium: 19.99, elite: 39.99 };
const USER_TIER_OPTIONS = [
  { value: "free", label: "Free" },
  { value: "starter", label: "Starter" },
  { value: "premium", label: "Premium" },
  { value: "elite", label: "Elite" },
  { value: "admin", label: "Admin" },
  { value: "admin_cfo", label: "Admin (CFO)" },
];

const tierLabelBySlug = {
  free: "Free",
  starter: "Starter",
  premium: "Premium",
  elite: "Elite",
  admin: "Admin",
  admin_cfo: "Admin (CFO)",
};

const isObject = (value: unknown) => typeof value === "object" && value !== null;

const normalizeUserTierSlug = (value: unknown): string => {
  if (typeof value !== "string") return "free";
  const normalized = value.trim().toLowerCase();
  if (normalized === "staff") return "admin_cfo";
  if (normalized in tierLabelBySlug) return normalized;
  return "free";
};

const isAdminTierSlug = (tierSlug: string) => tierSlug === "admin" || tierSlug === "admin_cfo";

const tierSlugFromRole = (role: string) => {
  if (role === "admin") return "admin";
  return "free";
};

const tierCostLabel = (tierSlug: string, tierPrices: Record<string, number>) => {
  if (tierSlug === "free") return "Free";
  if (isAdminTierSlug(tierSlug)) return "Internal (No Billing)";
  const price = tierPrices[tierSlug];
  return typeof price === "number" ? `$${price.toFixed(2)}/mo` : "—";
};

const formatMembershipAge = (joinedIso: string | null | undefined) => {
  const joinedDate = joinedIso ? new Date(joinedIso) : new Date();
  if (Number.isNaN(joinedDate.getTime())) return { label: "—", since: "unknown" };

  const now = new Date();
  const days = Math.max(0, Math.floor((now.getTime() - joinedDate.getTime()) / 86400000));
  const months = Math.floor(days / 30.44);
  const years = Math.floor(months / 12);
  const remMo = months % 12;

  let label;
  if (days < 7) label = `${days}d`;
  else if (days < 30) label = `${Math.floor(days / 7)}w`;
  else if (months < 12) label = `${months} mo`;
  else if (remMo === 0) label = `${years} yr`;
  else label = `${years} yr ${remMo} mo`;

  return { label, since: joinedDate.toISOString().slice(0, 10) };
};

// ─── shared UI ───────────────────────────────────────────────
const Card = ({ children, style={} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ background:C.card, border:`1px solid ${C.cardBorder}`,
    borderRadius:12, padding:"20px 22px", ...style }}>{children}</div>
);

const Stat = ({ label, value, sub, color, soft }: { label: string; value: string | number; sub?: string; color?: string; soft?: string }) => (
  <div style={{ background:soft||C.surface, border:`1px solid ${C.cardBorder}`,
    borderRadius:10, padding:"16px 20px", flex:1, minWidth:130 }}>
    <div style={{ fontSize:11, color:C.muted, marginBottom:6, fontWeight:600,
      textTransform:"uppercase", letterSpacing:"0.04em" }}>{label}</div>
    <div style={{ fontSize:24, fontWeight:700, color:color||C.text, lineHeight:1 }}>{value}</div>
    {sub && <div style={{ fontSize:11, color:C.dim, marginTop:5 }}>{sub}</div>}
  </div>
);

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.08em",
    textTransform:"uppercase", color:C.dim, marginBottom:14 }}>{children}</div>
);

const Toggle = ({ options, value, onChange }: { options: { value: string; label: string }[]; value: string; onChange: (v: string) => void }) => (
  <div style={{ display:"flex", background:"#f1f5f9", borderRadius:8, padding:3,
    gap:2, border:`1px solid ${C.divider}`, flexShrink:0 }}>
    {options.map((o: { value: string; label: string }) => (
      <button key={o.value} onClick={() => onChange(o.value)} style={{
        padding:"5px 12px", borderRadius:6, border:"none", cursor:"pointer",
        fontSize:12, fontWeight:600, transition:"all .15s",
        background: value===o.value ? "#fff" : "transparent",
        color:       value===o.value ? C.text : C.muted,
        boxShadow:   value===o.value ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
      }}>{o.label}</button>
    ))}
  </div>
);

const ActionBtn = ({ label, color, onClick }: { label: string; color: string; onClick?: () => void }) => (
  <button onClick={onClick} style={{
    padding:"4px 10px", borderRadius:6, border:`1px solid ${color}44`,
    background:`${color}10`, color, fontSize:11, cursor:"pointer",
    fontWeight:600, whiteSpace:"nowrap",
  }}>{label}</button>
);

const ChartTip = ({ active, payload, label, prefix="$" }: { active?: boolean; payload?: any[]; label?: string; prefix?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"#fff", border:`1px solid ${C.cardBorder}`,
      borderRadius:8, padding:"10px 14px", fontSize:12,
      boxShadow:"0 4px 12px rgba(0,0,0,0.08)" }}>
      <div style={{ color:C.muted, marginBottom:6, fontWeight:500 }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color:p.color||C.text, marginBottom:2 }}>
          {p.name}: {prefix}{typeof p.value==="number" ? p.value.toLocaleString() : p.value}
        </div>
      ))}
    </div>
  );
};

const TIER_BREAKDOWN = [
  { name:"Starter", price:9.99,  apiCost:0.827, users:24, color:"#1e40af", soft:"#dbeafe" },
  { name:"Premium", price:19.99, apiCost:2.481, users:17, color:"#5b21b6", soft:"#ede9fe" },
  { name:"Elite",   price:39.99, apiCost:6.598, users:6,  color:"#92400e", soft:"#fef3c7" },
];

const PAID_TIER_SNAPSHOT_META = [
  { slug:"starter", name:"Starter", color:"#1e40af", apiCost:0.827 },
  { slug:"premium", name:"Premium", color:"#5b21b6", apiCost:2.481 },
  { slug:"elite",   name:"Elite",   color:"#92400e", apiCost:6.598 },
];

// ─── slate header — flush top of ShellCard, no margin needed ──
const SlateHeader = ({ title, right }: { title: string; right?: React.ReactNode }) => (
  <div style={{
    background:"linear-gradient(180deg, #5a7292 0%, #4a5f7f 100%)",
    borderTop:"1px solid rgba(255,255,255,0.20)",
    boxShadow:"0 10px 15px -3px rgba(0,0,0,0.30), 0 4px 6px -4px rgba(0,0,0,0.30)",
    padding:"13px 20px",
    display:"flex", alignItems:"center", justifyContent:"space-between",
    position:"relative", overflow:"hidden", flexShrink:0,
  }}>
    <div style={{ position:"absolute", inset:0, pointerEvents:"none",
      background:"linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0) 30%)" }}/>
    <span style={{ fontSize:14, fontWeight:700, color:"#fff",
      letterSpacing:"-0.015em", position:"relative" }}>{title}</span>
    {right && <span style={{ position:"relative" }}>{right}</span>}
  </div>
);

// ─── toggle group for inside SlateHeader ─────────────────────
const HdrToggle = ({ options, value, onChange }: { options: { v: string; l: string }[]; value: string; onChange?: (v: string) => void }) => (
  <div style={{ display:"flex", background:"rgba(0,0,0,0.25)", borderRadius:8,
    padding:3, gap:2, boxShadow:"inset 0 1px 3px rgba(0,0,0,0.4)" }}>
    {options.map((o: { v: string; l: string }) => (
      <button key={o.v} onClick={() => onChange && onChange(o.v)} style={{
        padding:"4px 10px", borderRadius:6, border:"none", cursor:"pointer",
        fontSize:11, fontWeight:700,
        color:      value===o.v ? "#fff" : "rgba(255,255,255,0.45)",
        background: value===o.v ? D.elevated : "transparent",
        boxShadow:  value===o.v ? D.btnShadow : "none",
        transition: "all .12s",
      }}>{o.l}</button>
    ))}
  </div>
);

// ─── dark toggle — content area buttons below headers ─────────
const DarkToggle = ({ options, value, onChange }: { options: { v: string; l: string }[]; value: string; onChange?: (v: string) => void }) => (
  <div style={{ display:"flex", background:D.recessed, borderRadius:8, padding:3, gap:2,
    boxShadow:"inset 0 1px 3px rgba(0,0,0,0.5)", border:"1px solid rgba(0,0,0,0.35)" }}>
    {options.map((o: { v: string; l: string }) => (
      <button key={o.v} onClick={() => onChange && onChange(o.v)} style={{
        padding:"5px 12px", borderRadius:6, border:"none", cursor:"pointer",
        fontSize:12, fontWeight:700,
        color:      value===o.v ? D.text : D.muted,
        background: value===o.v ? D.elevated : "transparent",
        boxShadow:  value===o.v ? D.btnShadow : "none",
        transition: "all .12s",
      }}>{o.l}</button>
    ))}
  </div>
);

function SubscriberSnapshot({ rows }: { rows?: { name: string; price: number; apiCost: number; users: number; color: string; soft?: string }[] }) {
  const tierRows = rows?.length ? rows : TIER_BREAKDOWN;
  return (
    <ShellCard style={{ flex:1 }}>
      <SlateHeader title="Subscriber Snapshot" />
      <div style={{ padding:"18px 20px 20px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"12px 1fr 44px 64px 68px 68px 64px",
          gap:8, paddingBottom:8, borderBottom:`1px solid ${D.divider}` }}>
          <div />
          {["Tier","Users","Income","API Cost","Stripe","Net"].map((h,i) => (
            <div key={h} style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.06em",
              color:D.muted, fontWeight:700, textAlign: i > 0 ? "right" : "left" }}>{h}</div>
          ))}
        </div>
        {tierRows.map((t: { name: string; price: number; apiCost: number; users: number; color: string; soft?: string }, i: number) => {
          const revenue   = t.users * t.price;
          const apiSpend  = t.users * t.apiCost;
          const stripeFee = t.users * ((t.price * 0.029) + 0.30);
          const net       = revenue - apiSpend - stripeFee;
          return (
            <div key={t.name}>
              <div style={{ display:"grid", gridTemplateColumns:"12px 1fr 44px 64px 68px 68px 64px",
                gap:8, alignItems:"center", padding:"10px 0" }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:t.color }} />
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:D.text }}>{t.name}</div>
                  <div style={{ fontSize:11, color:D.muted }}>${t.price}/mo</div>
                </div>
                <div style={{ fontSize:13, fontWeight:700, color:D.text, textAlign:"center" }}>{t.users}</div>
                <div style={{ fontSize:13, fontWeight:600, color:D.green, textAlign:"right" }}>${Math.round(revenue)}</div>
                <div style={{ fontSize:13, fontWeight:600, color:D.red, textAlign:"right" }}>-${apiSpend.toFixed(2)}</div>
                <div style={{ fontSize:13, fontWeight:600, color:D.red, textAlign:"right" }}>-${stripeFee.toFixed(2)}</div>
                <div style={{ fontSize:13, fontWeight:700, textAlign:"right", color: net >= 0 ? D.green : D.red }}>
                  {net >= 0 ? "" : "-"}${Math.abs(Math.round(net))}
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

function AppGrowth({ users }: { users?: any[] }) {
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
const NET_INCOME_DATA = {
  total: {
    day:   [
      { label:"12am", net:0.12 }, { label:"3am",  net:0.03 }, { label:"6am",  net:0.18 },
      { label:"9am",  net:0.54 }, { label:"12pm", net:0.93 }, { label:"3pm",  net:0.81 },
      { label:"6pm",  net:0.66 }, { label:"9pm",  net:0.42 },
    ],
    week:  [
      { label:"Mon", net:1.68 }, { label:"Tue", net:2.49 }, { label:"Wed", net:2.94 },
      { label:"Thu", net:1.92 }, { label:"Fri", net:3.63 }, { label:"Sat", net:4.20 },
      { label:"Sun", net:3.36 },
    ],
    month: [
      { label:"Wk1", net:9.6 }, { label:"Wk2", net:14.4 }, { label:"Wk3", net:18.3 }, { label:"Wk4", net:17.1 },
    ],
    year:  [
      { label:"Jan", net:36 }, { label:"Feb", net:54 }, { label:"Mar", net:72 },
      { label:"Apr", net:63 }, { label:"May", net:87 }, { label:"Jun", net:99 },
      { label:"Jul", net:114}, { label:"Aug", net:105}, { label:"Sep", net:123},
      { label:"Oct", net:132}, { label:"Nov", net:144}, { label:"Dec", net:156},
    ],
  },
  tier: {
    week: [
      { label:"Mon", starter:0.80, premium:0.60, elite:0.28 },
      { label:"Tue", starter:1.20, premium:0.90, elite:0.39 },
      { label:"Wed", starter:1.44, premium:1.08, elite:0.42 },
      { label:"Thu", starter:0.96, premium:0.72, elite:0.24 },
      { label:"Fri", starter:1.80, premium:1.26, elite:0.57 },
      { label:"Sat", starter:2.10, premium:1.50, elite:0.60 },
      { label:"Sun", starter:1.68, premium:1.20, elite:0.48 },
    ],
  },
};

function NetIncomeMini() {
  const [period, setPeriod] = useState("week");
  const [view,   setView]   = useState("total");
  const data = view === "tier"
    ? ((NET_INCOME_DATA.tier as Record<string, any[]>)[period] || NET_INCOME_DATA.tier.week)
    : (NET_INCOME_DATA.total as Record<string, any[]>)[period];
  const total = view === "total"
    ? data.reduce((a: number, d: any) => a + d.net, 0).toFixed(2)
    : data.reduce((a: number, d: any) => a + (d.starter||0) + (d.premium||0) + (d.elite||0), 0).toFixed(2);
  return (
    <ShellCard style={{ flex:1 }}>
      <SlateHeader title="Net Income" />
      <div style={{ padding:"16px 20px 20px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
          <div style={{ fontSize:24, fontWeight:800, color:D.green, lineHeight:1 }}>+${total}</div>
          <DarkToggle options={[{l:"Total",v:"total"},{l:"By tier",v:"tier"}]} value={view} onChange={setView} />
        </div>
        <ResponsiveContainer width="100%" height={90}>
          <AreaChart data={data} margin={{ top:4, right:4, left:0, bottom:0 }}>
            <defs>
              <linearGradient id="netGreen2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="label" tick={{ fill:D.muted, fontSize:10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill:D.muted, fontSize:10 }} axisLine={false} tickLine={false} width={28} tickFormatter={v => `$${v}`} />
            <Tooltip contentStyle={{ background:D.shell, border:"none", boxShadow:D.shellShadow, borderRadius:10, fontSize:12, color:D.text }}
              formatter={(v, name) => [`$${v}`, String(name).charAt(0).toUpperCase() + String(name).slice(1)]} />
            {view === "total" && <Area dataKey="net" name="Net" stroke="#22c55e" strokeWidth={2} fill="url(#netGreen2)" dot={false} type="monotone" />}
            {view === "tier" && <>
              <Area dataKey="starter" name="Starter" stroke="#60a5fa" strokeWidth={2} fill="none" dot={false} type="monotone" />
              <Area dataKey="premium" name="Premium" stroke="#a78bfa" strokeWidth={2} fill="none" dot={false} type="monotone" />
              <Area dataKey="elite"   name="Elite"   stroke="#fbbf24" strokeWidth={2} fill="none" dot={false} type="monotone" />
            </>}
          </AreaChart>
        </ResponsiveContainer>
        <div style={{ display:"flex", justifyContent:"center", marginTop:12 }}>
          <DarkToggle options={[{l:"Day",v:"day"},{l:"Week",v:"week"},{l:"Month",v:"month"},{l:"Year",v:"year"}]} value={period} onChange={setPeriod} />
        </div>
      </div>
    </ShellCard>
  );
}

// ─── API usage mini card ──────────────────────────────────────

function ApiUsageMini({ expanded = false }) {
  const [period,  setPeriod]  = useState<AdminUsagePeriod>("week");
  const [apiType, setApiType] = useState("text");
  const [byTier,  setByTier]  = useState("total");
  const [billing, setBilling] = useState<XaiBillingSummary | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [usageData, setUsageData] = useState<{ label: string; cost: number }[]>([]);
  const [usageLoading, setUsageLoading] = useState(false);

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
    fetchAdminUsageTimeseries(period).then((ts) => {
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
  }, [period, apiType]);

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
  const all         = AD_CHANNELS;
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

function AdSpendTracker() {
  const [channels,   setChannels]   = useState(AD_CHANNELS);
  const [filter,     setFilter]     = useState("all");
  const [showAdd,    setShowAdd]    = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState({ name:"", desc:"", url:"", status:"active", spent:"", cost:"", costCadence:"mo", startDate:"" });

  const totalSpent  = channels.reduce((a, c) => a + autoSpent(c), 0);
  const activeCount = channels.filter(c => c.status === "active").length;
  const cancelCount = channels.filter(c => c.status === "cancelled").length;
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

  const handleSave = () => {
    if (!form.name.trim()) return;
    const entry = {
      name: form.name.trim(), desc: form.desc.trim(), url: form.url.trim(),
      status: form.status,
      spent: parseFloat(form.spent) || 0,
      cost: parseFloat(form.cost) || 0,
      costCadence: form.costCadence,
      startDate: form.startDate,
      cpa: null,
    };
    if (editTarget) {
      setChannels(cs => cs.map(c => c.id !== editTarget ? c : { ...c, ...entry }));
    } else {
      setChannels(cs => [...cs, { id: Date.now().toString(), type:"organic", ...entry }]);
    }
    setShowAdd(false);
    setEditTarget(null);
  };

  const handleDelete = () => {
    setChannels(cs => cs.filter(c => c.id !== editTarget));
    setShowAdd(false);
    setEditTarget(null);
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
        <p style={{ fontSize:11, color:D.dim, marginTop:12 }}>
          TODO: Wire to Supabase `ad_spend` table.
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

  const exec = (cmd, val = null) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
  };

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
            onMouseDown={e => { e.preventDefault(); /* TODO: save editorRef.current.innerHTML to Supabase admin_notes table */ }}
            style={{ padding:"0 14px", height:30, borderRadius:6, border:"none", cursor:"pointer",
              background:D.elevated, boxShadow:D.btnShadow,
              color:D.text, fontSize:12, fontWeight:700, flexShrink:0 }}>
            Save
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
          onInput={() => {/* TODO: debounce + save to Supabase */}}
        />
        <div style={{ fontSize:10, color:D.dim, marginTop:6, textAlign:"right" }}>
          TODO: auto-save to Supabase on input
        </div>
      </div>
    </ShellCard>
  );
}

function OverviewPage({ onNavigate, snapshotRows, users }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:22 }}>

      {/* top row: 2 columns, 2 cards each */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <SubscriberSnapshot rows={snapshotRows} />
          <AppGrowth users={users} />
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <ApiUsageMini />
          <NetIncomeMini />
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
function FinancePage({ users = [], tierPrices = DEFAULT_TIER_PRICES }) {
  const [growth,      setGrowth]      = useState({ starter:12, premium:8, elite:5 });
  const [prices,      setPrices]      = useState(() => ({
    starter: typeof tierPrices?.starter === "number" ? tierPrices.starter : DEFAULT_TIER_PRICES.starter,
    premium: typeof tierPrices?.premium === "number" ? tierPrices.premium : DEFAULT_TIER_PRICES.premium,
    elite: typeof tierPrices?.elite === "number" ? tierPrices.elite : DEFAULT_TIER_PRICES.elite,
  }));
  const [chartMonths, setChartMonths] = useState(12);

  const setG = (tier, val) => setGrowth(g => ({ ...g, [tier]: val }));
  const setP = (tier, val) => setPrices(p => ({ ...p, [tier]: Math.max(0, parseFloat(val.toFixed(2))) }));

  useEffect(() => {
    setPrices({
      starter: typeof tierPrices?.starter === "number" ? tierPrices.starter : DEFAULT_TIER_PRICES.starter,
      premium: typeof tierPrices?.premium === "number" ? tierPrices.premium : DEFAULT_TIER_PRICES.premium,
      elite: typeof tierPrices?.elite === "number" ? tierPrices.elite : DEFAULT_TIER_PRICES.elite,
    });
  }, [tierPrices?.starter, tierPrices?.premium, tierPrices?.elite]);

  const tierCounts = useMemo(() => ({
    starter: users.filter((u) => u.status === "active" && (u.tierSlug === "starter" || u.tier === "Starter")).length,
    premium: users.filter((u) => u.status === "active" && (u.tierSlug === "premium" || u.tier === "Premium")).length,
    elite:   users.filter((u) => u.status === "active" && (u.tierSlug === "elite" || u.tier === "Elite")).length,
    free:    users.filter((u) => u.status === "active" && (u.tierSlug === "free" || u.tier === "Free")).length,
  }), [users]);

  const totalPaid = tierCounts.starter + tierCounts.premium + tierCounts.elite;
  const financeSnapshotRows = useMemo(() => (
    PAID_TIER_SNAPSHOT_META.map((tier) => ({
      ...tier,
      price: typeof prices[tier.slug] === "number" ? prices[tier.slug] : DEFAULT_TIER_PRICES[tier.slug],
      users: tierCounts[tier.slug] ?? 0,
    }))
  ), [prices, tierCounts]);

  const ECON = {
    starter: { price:prices.starter, api:0.827, stripe:prices.starter*0.029+0.30  },
    premium: { price:prices.premium, api:2.481, stripe:prices.premium*0.029+0.30 },
    elite:   { price:prices.elite,   api:6.598, stripe:prices.elite*0.029+0.30   },
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
  }, [tierCounts, growth, prices]);

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
        <NetIncomeMini />
        <AppGrowth users={users} />
        <ApiUsageMini />
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
                {tier:"Starter",   price:"$9.99", msg:"300",  img:"10", api:"$0.83",stripe:"$0.59",keep:"$8.57", margin:"85.8%",ltv:"$154"},
                {tier:"Premium",   price:"$19.99",msg:"900",  img:"30", api:"$2.48",stripe:"$0.88",keep:"$16.63",margin:"83.2%",ltv:"$299"},
                {tier:"Elite",     price:"$39.99",msg:"2,200",img:"100",api:"$6.60",stripe:"$1.46",keep:"$31.93",margin:"79.9%",ltv:"$575"},
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
const STRIKE_REASONS = [
  { id:"plagiarism",   label:"Plagiarism",                  points:1, desc:"Posting another creator's work (art, writing, characters) as their own." },
  { id:"real_person",  label:"Real person explicit content", points:2, desc:"Cover images or story content depicting real, identifiable people in pornographic or sexual situations." },
  { id:"minor_char",   label:"Underage character depiction", points:2, desc:"Creating stories or scenarios that sexualize characters who are or appear to be minors." },
  { id:"csam",         label:"CSAM / minor exploitation",    points:99,desc:"Immediate permanent ban. Depicting or generating pornographic material involving minors. No appeal." },
  { id:"harassment",   label:"Harassment / targeted abuse",  points:1, desc:"Repeated targeting of another user with hostile content or messages." },
  { id:"spam",         label:"Spam / abuse of platform",     points:1, desc:"Bulk creation of low-quality content, fake accounts, or platform manipulation." },
  { id:"other",        label:"Other policy violation",       points:1, desc:"Moderator discretion — documented in notes." },
];

const MOCK_STRIKE_HISTORY = {
  2: [ // bob_r — 1 strike
    { id:1, reason:"plagiarism", points:1, note:"Uploaded character art lifted directly from @artstation_user123.", issuedBy:"admin", issuedAt:"2026-02-14", fallsOffAt:null, status:"active" },
  ],
  4: [ // dave_m — 3 strikes (suspended)
    { id:1, reason:"minor_char",  points:2, note:"Story 's-0017' contained explicitly sexualized scenario involving a character stated to be 16.", issuedBy:"admin", issuedAt:"2026-01-20", fallsOffAt:null, status:"active" },
    { id:2, reason:"harassment",  points:1, note:"Sent hostile messages to @carol_s after content report.", issuedBy:"admin", issuedAt:"2026-02-28", fallsOffAt:null, status:"active" },
    { id:3, reason:"plagiarism",  points:1, note:"Second plagiarism incident. Cover art from known artist.", issuedBy:"admin", issuedAt:"2026-03-15", fallsOffAt:null, status:"active" },
  ],
  7: [ // grace_k — 2 strikes
    { id:1, reason:"real_person", points:2, note:"Generated explicit content using photorealistic likeness of a public figure.", issuedBy:"admin", issuedAt:"2026-02-05", fallsOffAt:null, status:"active" },
    { id:2, reason:"spam",        points:1, note:"Created 40+ near-identical scenario cards within 24 hours.", issuedBy:"admin", issuedAt:"2026-03-10", fallsOffAt:null, status:"active" },
  ],
};

function ActionModal({ user, allReports, onClose, onAddStrike, onRemoveStrike, onToggleSuspend, onUpdateReport }) {
  const [tab, setTab]                     = useState("reports");
  const [history, setHistory]             = useState(MOCK_STRIKE_HISTORY[user.id] || []);
  const [showAddStrike, setShowAddStrike] = useState(false);
  const [newReason, setNewReason]         = useState("plagiarism");
  const [newNote, setNewNote]             = useState("");
  const [newFallOff, setNewFallOff]       = useState("");

  const reasonMeta  = Object.fromEntries(STRIKE_REASONS.map(r => [r.id, r]));
  const userReports = allReports.filter(r => r.accused === user.username);
  const openReports = userReports.filter(r => r.status !== "resolved" && r.status !== "dismissed");
  const ptColor     = (pts) => pts >= 99 ? C.red : pts >= 2 ? C.orange : C.amber;

  // Unified chronological timeline — reports + strikes merged and sorted
  const timeline = [
    ...userReports.map(r => ({ type:"report", date:r.date, data:r })),
    ...history.map(s => ({ type:"strike", date:s.issuedAt, data:s })),
  ].sort((a,b) => new Date(a.date) - new Date(b.date));

  const handleAddStrike = () => {
    const reason = reasonMeta[newReason];
    const today  = "2026-03-26";
    const entry  = {
      id: history.length + 1, reason: newReason, points: reason.points,
      note: newNote || "(no note)", issuedBy:"admin",
      issuedAt: today, fallsOffAt: newFallOff || null, status:"active",
    };
    setHistory(h => [...h, entry]);
    onAddStrike(user.id);
    setNewNote(""); setNewFallOff(""); setShowAddStrike(false);
  };

  const handleDismiss = (reportId) => onUpdateReport(reportId, "dismissed");
  const handleBan     = () => { onToggleSuspend(user.id); };

  const statusPill = (status) => {
    const map = {
      active:    { bg:C.amberSoft,  color:C.amber  },
      dismissed: { bg:C.bg,         color:C.dim    },
      removed:   { bg:C.bg,         color:C.dim    },
      suspended: { bg:C.redSoft,    color:C.red    },
      banned:    { bg:C.redSoft,    color:C.red    },
      open:      { bg:C.redSoft,    color:C.red    },
      reviewing: { bg:C.amberSoft,  color:C.amber  },
      resolved:  { bg:C.greenSoft,  color:C.green  },
      "strike added": { bg:C.amberSoft, color:C.orange },
    };
    const s = map[status] || { bg:C.bg, color:C.muted };
    return (
      <span style={{ fontSize:10, fontWeight:700, padding:"3px 9px", borderRadius:10,
        background:s.bg, color:s.color, whiteSpace:"nowrap", textTransform:"capitalize" }}>
        {status}
      </span>
    );
  };

  const tabBtn = (id, label, alert) => (
    <button key={id} onClick={() => setTab(id)} style={{
      padding:"9px 18px", borderRadius:8, border:`1.5px solid ${tab===id ? C.blue : C.cardBorder}`,
      cursor:"pointer", fontSize:12, fontWeight:700,
      background: tab===id ? C.blueSoft : "#fff",
      color:       tab===id ? C.blue    : C.muted,
      display:"flex", alignItems:"center", gap:6,
    }}>
      {alert && (
        <span style={{ width:7, height:7, borderRadius:"50%", background:C.red,
          display:"inline-block", flexShrink:0 }}/>
      )}
      {label}
    </button>
  );

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", zIndex:1000,
      display:"flex", alignItems:"center", justifyContent:"center", padding:24,
    }} onClick={onClose}>
      <div style={{ background:"#fff", borderRadius:16, width:"100%", maxWidth:900,
        maxHeight:"90vh", display:"flex", flexDirection:"column",
        boxShadow:"0 20px 60px rgba(0,0,0,0.2)",
      }} onClick={e => e.stopPropagation()}>

        {/* header */}
        <div style={{ padding:"18px 24px", borderBottom:`1px solid ${C.divider}`,
          display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexShrink:0 }}>
          <div>
            <div style={{ fontSize:16, fontWeight:800, color:C.text }}>Account Review</div>
            <div style={{ fontSize:13, color:C.muted, marginTop:2 }}>
              {user.email} · <span style={{color:C.blue}}>@{user.username}</span>
              <span style={{ marginLeft:10 }}>{statusBadge(user.status)}</span>
            </div>
          </div>
          <button onClick={onClose} style={{
            width:28, height:28, borderRadius:"50%", border:`1px solid ${C.divider}`,
            background:C.bg, color:C.muted, cursor:"pointer", fontSize:16,
            display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700,
          }}>×</button>
        </div>

        {/* quick stats bar */}
        <div style={{ display:"flex", borderBottom:`1px solid ${C.divider}`, flexShrink:0 }}>
          {[
            { label:"Times reported", value:user.reportCount, color:user.reportCount>0?C.amber:C.dim },
            { label:"Open reports",   value:openReports.length, color:openReports.length>0?C.red:C.dim },
            { label:"Active strikes", value:history.filter(s=>s.status==="active").length,
              color:user.strikes>=3?C.red:user.strikes>0?C.orange:C.dim },
            { label:"Stories",        value:user.stories, color:C.muted },
            { label:"Member",         value:(()=>{
                const d=Math.floor((new Date("2026-03-26")-new Date(user.joined))/86400000);
                const m=Math.floor(d/30.44);
                return m<12?`${m} mo`:`${Math.floor(m/12)}y ${m%12}m`;
              })(), color:C.muted },
          ].map((s,i) => (
            <div key={i} style={{ flex:1, padding:"10px 0", textAlign:"center",
              borderRight:i<4?`1px solid ${C.divider}`:"none" }}>
              <div style={{ fontSize:16, fontWeight:800, color:s.color }}>{s.value}</div>
              <div style={{ fontSize:10, color:C.dim, textTransform:"uppercase",
                letterSpacing:"0.04em", marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* tab buttons — proper buttons not underlined text */}
        <div style={{ display:"flex", gap:8, padding:"14px 24px",
          borderBottom:`1px solid ${C.divider}`, flexShrink:0 }}>
          {tabBtn("reports", `Review Needed (${openReports.length})`, openReports.length > 0)}
          {tabBtn("history", "Report / Strike History")}
        </div>

        {/* body */}
        <div style={{ overflowY:"auto", padding:"18px 24px", flex:1 }}>

          {/* ── Review Needed tab ── */}
          {tab === "reports" && (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {openReports.length === 0 ? (
                <div style={{ padding:28, textAlign:"center", color:C.dim, fontSize:13,
                  background:C.bg, borderRadius:10, border:`1px solid ${C.cardBorder}` }}>
                  Nothing needs review for this user.
                </div>
              ) : openReports.map((r, i) => (
                <div key={i} style={{
                  border:`1.5px solid ${C.red}33`, borderRadius:10,
                  padding:"14px 16px", background:C.redSoft,
                }}>
                  <div style={{ display:"flex", justifyContent:"space-between",
                    alignItems:"flex-start", gap:8, marginBottom:10 }}>
                    <div>
                      <div style={{ fontSize:14, fontWeight:800, color:C.text }}>{r.reason}</div>
                      <div style={{ fontSize:11, color:C.muted, marginTop:3 }}>
                        Reported by <strong style={{color:C.text}}>@{r.reporter}</strong>
                        {" · "}Story <strong style={{color:C.blue}}>{r.storyId}</strong>
                        {" · "}{r.date}
                      </div>
                    </div>
                    {statusPill(r.status)}
                  </div>
                  <div style={{ display:"flex", justifyContent:"flex-end" }}>
                    <button onClick={() => setTab("history")} style={{
                      padding:"8px 20px", borderRadius:7, border:"none", cursor:"pointer",
                      background:C.blue, color:"#fff", fontSize:12, fontWeight:700,
                    }}>Review</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Report / Strike History tab ── */}
          {tab === "history" && (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

              {/* chronological timeline table */}
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                  <thead>
                    <tr style={{ background:C.bg, borderBottom:`2px solid ${C.divider}` }}>
                      {["Date","Type","Issue","Notes","Status","Strike Given","Falls Off"].map(h => (
                        <th key={h} style={{ padding:"8px 12px", textAlign:"left", color:C.muted,
                          fontWeight:700, fontSize:10, textTransform:"uppercase",
                          letterSpacing:"0.04em", whiteSpace:"nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {timeline.length === 0 ? (
                      <tr><td colSpan={7} style={{ padding:24, textAlign:"center",
                        color:C.dim, fontSize:13 }}>No history on record.</td></tr>
                    ) : timeline.map((item, i) => {
                      const isStrike = item.type === "strike";
                      const d = item.data;
                      const isLatest = i === timeline.length - 1;
                      return (
                        <tr key={i} style={{
                          borderBottom:`1px solid ${C.divider}`,
                          background: isLatest && (d.status==="open"||d.status==="active")
                            ? C.redSoft : i%2===0?"#fff":C.bg,
                        }}>
                          <td style={{ padding:"10px 12px", color:C.muted, whiteSpace:"nowrap" }}>
                            {item.date}
                          </td>
                          <td style={{ padding:"10px 12px", whiteSpace:"nowrap" }}>
                            <span style={{ fontSize:11, fontWeight:700,
                              color: isStrike ? C.orange : C.blue }}>
                              {isStrike ? "Strike" : "Report"}
                            </span>
                          </td>
                          <td style={{ padding:"10px 12px", fontWeight:600, color:C.text, maxWidth:160 }}>
                            {isStrike
                              ? (reasonMeta[d.reason]?.label || d.reason)
                              : d.reason}
                          </td>
                          <td style={{ padding:"10px 12px", color:C.muted, fontSize:11,
                            maxWidth:180, lineHeight:1.4 }}>
                            {isStrike
                              ? d.note
                              : <>By <strong>@{d.reporter}</strong> · Story {d.storyId}</>}
                          </td>
                          <td style={{ padding:"10px 12px" }}>
                            {statusPill(isStrike
                              ? (d.status==="active" ? "strike added" : d.status)
                              : d.status)}
                          </td>
                          <td style={{ padding:"10px 12px", color:C.muted, fontSize:11,
                            whiteSpace:"nowrap" }}>
                            {isStrike ? d.issuedAt : "—"}
                          </td>
                          <td style={{ padding:"10px 12px", fontSize:11, whiteSpace:"nowrap" }}>
                            {isStrike
                              ? (d.fallsOffAt
                                  ? <span style={{color:C.text, fontWeight:600}}>{d.fallsOffAt}</span>
                                  : <span style={{color:C.dim}}>Not set</span>)
                              : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* action buttons */}
              {!showAddStrike ? (
                <div style={{ display:"flex", gap:8, paddingTop:4 }}>
                  <button onClick={()=>setShowAddStrike(true)} style={{
                    padding:"9px 18px", borderRadius:8, border:`1.5px solid ${C.orange}44`,
                    background:C.amberSoft, color:C.orange, fontSize:13, fontWeight:700, cursor:"pointer",
                  }}>Add Strike</button>
                  <button onClick={() => {
                    const openRpt = userReports.find(r => r.status !== "resolved" && r.status !== "dismissed");
                    if (openRpt) handleDismiss(openRpt.id);
                  }} style={{
                    padding:"9px 18px", borderRadius:8, cursor:"pointer", fontSize:13,
                    fontWeight:700, border:`1.5px solid ${C.cardBorder}`,
                    background:"#fff", color:C.muted,
                  }}>Dismiss</button>
                  <button style={{
                    padding:"9px 18px", borderRadius:8, border:`1.5px solid ${C.blue}44`,
                    background:C.blueSoft, color:C.blue, fontSize:13, fontWeight:700, cursor:"pointer",
                  }}>View Story</button>
                  <button onClick={handleBan} style={{
                    padding:"9px 18px", borderRadius:8, border:"none", cursor:"pointer",
                    background:C.red, color:"#fff", fontSize:13, fontWeight:700, marginLeft:"auto",
                  }}>Ban Account</button>
                </div>
              ) : (
                <div style={{ border:`1.5px solid ${C.orange}44`, borderRadius:10,
                  padding:16, background:C.amberSoft }}>
                  <div style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:12 }}>Add Strike</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    <div>
                      <div style={{ fontSize:11, fontWeight:600, color:C.muted, marginBottom:5 }}>Reason</div>
                      <select value={newReason} onChange={e=>setNewReason(e.target.value)} style={{
                        width:"100%", padding:"8px 10px", borderRadius:7,
                        border:`1px solid ${C.cardBorder}`, fontSize:13,
                        color:C.text, background:"#fff", outline:"none",
                      }}>
                        {STRIKE_REASONS.map(r => (
                          <option key={r.id} value={r.id}>
                            {r.label} ({r.points >= 99 ? "INSTANT BAN" : `+${r.points} pt${r.points>1?"s":""}`})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <div style={{ fontSize:11, fontWeight:600, color:C.muted, marginBottom:5 }}>
                        Notes <span style={{fontWeight:400}}>(what happened)</span>
                      </div>
                      <textarea value={newNote} onChange={e=>setNewNote(e.target.value)}
                        placeholder="e.g. Story s-0042 contained explicit content depicting a character stated to be 15..."
                        rows={3} style={{ width:"100%", padding:"8px 10px", borderRadius:7,
                          boxSizing:"border-box", border:`1px solid ${C.cardBorder}`,
                          fontSize:12, color:C.text, background:"#fff",
                          outline:"none", resize:"vertical", lineHeight:1.5 }}/>
                    </div>
                    <div>
                      <div style={{ fontSize:11, fontWeight:600, color:C.muted, marginBottom:5 }}>
                        Falls off date <span style={{fontWeight:400}}>(optional — leave blank if no expiry set yet)</span>
                      </div>
                      <input type="date" value={newFallOff} onChange={e=>setNewFallOff(e.target.value)}
                        style={{ padding:"7px 10px", borderRadius:7,
                          border:`1px solid ${C.cardBorder}`, fontSize:13,
                          color:C.text, background:"#fff", outline:"none" }}/>
                    </div>
                    <div style={{ display:"flex", gap:8, marginTop:4 }}>
                      <button onClick={handleAddStrike} style={{
                        padding:"8px 18px", borderRadius:7, border:"none", cursor:"pointer",
                        background:C.orange, color:"#fff", fontSize:13, fontWeight:700,
                      }}>Confirm Strike</button>
                      <button onClick={()=>setShowAddStrike(false)} style={{
                        padding:"8px 14px", borderRadius:7, border:`1px solid ${C.cardBorder}`,
                        background:"#fff", color:C.muted, fontSize:13, cursor:"pointer",
                      }}>Cancel</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* footer */}
        <div style={{ padding:"12px 24px", borderTop:`1px solid ${C.divider}`,
          fontSize:11, color:C.dim, flexShrink:0 }}>
          TODO: Wire to Supabase <code>user_strikes</code> + <code>reports</code> tables.
          Falls-off date set manually per strike — no automatic expiry.
        </div>
      </div>
    </div>
  );
}

function UsersPage({ users, setUsers, tierPrices, usersLoading, onTierChange, onRefreshUsers }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [reports, setReports] = useState([]);
  const [actionModal, setActionModal] = useState(null);
  const [pendingTierChange, setPendingTierChange] = useState(null);
  const [editingTierUserId, setEditingTierUserId] = useState(null);
  const [editingTierSlug, setEditingTierSlug] = useState("free");

  const displayed = useMemo(() => users.filter((u) => {
    if (filter === "active" && u.status !== "active") return false;
    if (filter === "cancelled" && u.status !== "cancelled") return false;
    if (filter === "suspended" && u.status !== "suspended") return false;
    if (filter === "strikes" && u.strikes === 0) return false;
    if (filter === "pending" && !u.reported) return false;
    if (search) {
      const term = search.toLowerCase();
      const haystack = `${u.email} ${u.username} ${u.displayName || ""}`.toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    return true;
  }), [users, filter, search]);

  const addStrike = (id) => setUsers((us) => us.map((u) => u.id !== id ? u : {
    ...u,
    strikes: u.strikes + 1,
    status: u.strikes + 1 >= 3 ? "suspended" : u.status,
  }));
  const removeStrike = (id) => setUsers((us) => us.map((u) => u.id !== id ? u : {
    ...u,
    strikes: Math.max(0, u.strikes - 1),
  }));
  const toggleSuspend = (id) => setUsers((us) => us.map((u) => u.id !== id ? u : {
    ...u,
    status: u.status === "suspended" ? "active" : "suspended",
  }));
  const updateReport = (id, status) => setReports((rs) => rs.map((r) => r.id === id ? { ...r, status } : r));

  const modalUser = actionModal ? users.find((u) => u.id === actionModal.id) : null;
  const pendingChangeDetails = pendingTierChange ? {
    fromLabel: tierLabelBySlug[pendingTierChange.fromTierSlug] || "Free",
    toLabel: tierLabelBySlug[pendingTierChange.toTierSlug] || "Free",
  } : null;

  const openReportsByUser = useMemo(() => {
    const map = {};
    reports.forEach((r) => {
      if (r.status !== "resolved" && r.status !== "dismissed") {
        if (!map[r.accused]) map[r.accused] = [];
        map[r.accused].push(r);
      }
    });
    return map;
  }, [reports]);

  const requestTierChange = (user, rawTierSlug) => {
    const nextTierSlug = normalizeUserTierSlug(rawTierSlug);
    if (nextTierSlug === user.tierSlug) return;

    const userLabel = user.displayName || user.email || `@${user.username}`;
    setPendingTierChange({
      userId: user.id,
      userLabel,
      fromTierSlug: user.tierSlug,
      toTierSlug: nextTierSlug,
    });
  };

  const beginTierEdit = (user) => {
    setEditingTierUserId(user.id);
    setEditingTierSlug(user.tierSlug);
  };

  const cancelTierEdit = () => {
    setEditingTierUserId(null);
    setEditingTierSlug("free");
  };

  const applyTierEdit = (user) => {
    requestTierChange(user, editingTierSlug);
    cancelTierEdit();
  };

  const confirmTierChange = async () => {
    if (!pendingTierChange) return;
    const next = pendingTierChange;
    setPendingTierChange(null);
    await onTierChange(next.userId, next.toTierSlug);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      {modalUser && (
        <ActionModal
          user={modalUser}
          allReports={reports}
          onClose={() => setActionModal(null)}
          onAddStrike={addStrike}
          onRemoveStrike={removeStrike}
          onToggleSuspend={toggleSuspend}
          onUpdateReport={updateReport}
        />
      )}
      <AlertDialog
        open={pendingTierChange !== null}
        onOpenChange={(open) => {
          if (!open) setPendingTierChange(null);
        }}
      >
        <AlertDialogContent className="rounded-2xl bg-[hsl(240_6%_10%)] border border-[hsl(0_0%_100%_/_0.10)] shadow-[0_10px_30px_hsl(0_0%_0%_/_0.5)] max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[hsl(var(--ui-text))] text-base font-bold">
              Confirm User Tier Change
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[hsl(var(--ui-text-muted))] text-sm leading-relaxed">
              {pendingTierChange && pendingChangeDetails
                ? `You are about to change ${pendingTierChange.userLabel}'s account from ${pendingChangeDetails.fromLabel} to ${pendingChangeDetails.toLabel}. Are you sure you want to continue?`
                : "Are you sure you want to continue?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel className="rounded-xl bg-[hsl(240_6%_18%)] border-[hsl(0_0%_100%_/_0.10)] text-[hsl(var(--ui-text))] hover:bg-[hsl(240_6%_22%)] h-10 px-6 text-[10px] font-bold leading-none uppercase tracking-wider shadow-[0_10px_30px_hsl(0_0%_0%_/_0.35)]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void confirmTierChange()}
              className="rounded-xl bg-[hsl(217_91%_60%)] hover:brightness-110 text-white border-0 h-10 px-6 text-[10px] font-bold leading-none uppercase tracking-wider shadow-[0_10px_30px_hsl(0_0%_0%_/_0.35)]"
            >
              Accept
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
        {[
          { label:"Active Users",            value: users.filter((u) => u.status === "active").length },
          { label:"Cancelled Subscriptions", value: users.filter((u) => u.status === "cancelled").length },
          { label:"Suspended",               value: users.filter((u) => u.status === "suspended").length },
          { label:"Pending Reviews",         value: users.filter((u) => u.reported).length },
        ].map((s) => (
          <ShellCard key={s.label} style={{ flex:1, minWidth:140 }}>
            <SlateHeader title={s.label} />
            <div style={{ padding:"14px 20px 18px" }}>
              <div style={{ fontSize:26, fontWeight:800, color:D.text, lineHeight:1 }}>{s.value}</div>
            </div>
          </ShellCard>
        ))}
      </div>

      <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          style={{ background:D.recessed, border:"none", borderTop:"1px solid rgba(0,0,0,0.35)",
            borderRadius:8, color:D.text, padding:"7px 14px", fontSize:12, width:180,
            flexShrink:0, outline:"none", boxShadow:"none" }}
        />
        <DarkToggle
          options={[
            { l:"All",             v:"all" },
            { l:"Active Users",    v:"active" },
            { l:"Cancelled",       v:"cancelled" },
            { l:"Suspended",       v:"suspended" },
            { l:"Has Strikes",     v:"strikes" },
            { l:"Pending Reviews", v:"pending" },
          ]}
          value={filter}
          onChange={setFilter}
        />
        <button
          onClick={() => void onRefreshUsers()}
          style={{
            padding:"6px 12px", borderRadius:8, border:"none", cursor:"pointer",
            background:D.elevated, boxShadow:D.btnShadow, color:D.text, fontSize:11, fontWeight:700,
          }}
        >
          Refresh
        </button>
        {usersLoading && <span style={{ fontSize:11, color:D.muted }}>Loading users...</span>}
      </div>

      <ShellCard>
        <SlateHeader title="User Accounts" />
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13, minWidth:1040 }}>
            <thead>
              <tr style={{ background:D.tray, borderBottom:`1px solid ${D.divider}` }}>
                {["User","Tier & Cost","","View Admin UI","Status","Reported","Strikes","Stories","Member Since","Action"].map((h, idx) => (
                  <th key={`${h}-${idx}`} style={{ padding:"11px 16px", textAlign:"left", color:D.muted,
                    fontWeight:700, fontSize:10, textTransform:"uppercase",
                    letterSpacing:"0.06em", whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayed.map((u, i) => {
                const openReports = openReportsByUser[u.username] || [];
                const hasAction = openReports.length > 0;
                const latestReport = openReports[0];
                const membership = formatMembershipAge(u.joined);
                return (
                  <tr key={u.id} style={{
                    borderBottom:`1px solid ${D.divider}`,
                    background: hasAction ? "rgba(239,68,68,0.10)" : i%2===0 ? D.shell : "rgba(255,255,255,0.02)",
                    borderLeft: hasAction ? "3px solid #ef4444" : "3px solid transparent",
                  }}>
                    <td style={{padding:"12px 16px"}}>
                      <div style={{color:D.text, fontSize:13}}>{u.email}</div>
                      <div style={{color:D.blue, fontSize:12, marginTop:2, fontWeight:500}}>@{u.username}</div>
                    </td>
                    <td style={{padding:"12px 16px"}}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                        {tierBadge(u.tier)}
                      </div>
                      <div style={{ marginTop:2, fontSize:12, fontWeight:700,
                        color: u.status==="cancelled" ? D.dim : D.muted,
                        textDecoration: u.status==="cancelled" ? "line-through" : "none" }}>
                        {tierCostLabel(u.tierSlug, tierPrices)}
                      </div>
                    </td>
                    <td style={{padding:"12px 16px", width:210}}>
                      {editingTierUserId === u.id ? (
                        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                          <select
                            value={editingTierSlug}
                            onChange={(e) => setEditingTierSlug(normalizeUserTierSlug(e.target.value))}
                            style={{
                              background:D.recessed,
                              border:"none",
                              borderTop:"1px solid rgba(0,0,0,0.35)",
                              borderRadius:6,
                              color:D.text,
                              padding:"5px 8px",
                              fontSize:11,
                              fontWeight:700,
                              outline:"none",
                              cursor:"pointer",
                              minWidth:120,
                            }}
                          >
                            {USER_TIER_OPTIONS.map((tierOption) => (
                              <option key={tierOption.value} value={tierOption.value}>
                                {tierOption.label}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => applyTierEdit(u)}
                            style={{
                              padding:"5px 8px",
                              borderRadius:7,
                              border:"none",
                              background:D.elevated,
                              boxShadow:D.btnShadow,
                              color:D.text,
                              fontSize:10,
                              fontWeight:700,
                              cursor:"pointer",
                              textTransform:"uppercase",
                            }}
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelTierEdit}
                            style={{
                              padding:"5px 8px",
                              borderRadius:7,
                              border:"none",
                              background:D.recessed,
                              borderTop:"1px solid rgba(255,255,255,0.06)",
                              color:D.muted,
                              fontSize:10,
                              fontWeight:700,
                              cursor:"pointer",
                              textTransform:"uppercase",
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => beginTierEdit(u)}
                          style={{
                            width:120,
                            padding:"6px 0",
                            borderRadius:8,
                            border:"none",
                            cursor:"pointer",
                            background:D.elevated,
                            boxShadow:D.btnShadow,
                            color:D.text,
                            fontSize:11,
                            fontWeight:700,
                            textTransform:"uppercase",
                            letterSpacing:"0.04em",
                          }}
                        >
                          Modify
                        </button>
                      )}
                    </td>
                    <td style={{padding:"12px 16px"}}>
                      {u.canViewAdminUi ? (
                        <Badge label="Yes" bg="#d1fae5" color="#065f46" />
                      ) : (
                        <Badge label="No" bg="#f1f5f9" color="#475569" />
                      )}
                    </td>
                    <td style={{padding:"12px 16px"}}>{statusBadge(u.status)}</td>
                    <td style={{padding:"12px 16px"}}>
                      {u.reportCount > 0
                        ? <span style={{fontWeight:700, fontSize:14, color:D.text}}>{u.reportCount}</span>
                        : <span style={{color:D.dim}}>—</span>}
                    </td>
                    <td style={{padding:"12px 16px"}}>
                      {u.strikes > 0
                        ? <span style={{fontWeight:700, fontSize:14, color:D.text}}>{u.strikes} ★</span>
                        : <span style={{color:D.dim}}>—</span>}
                    </td>
                    <td style={{padding:"12px 16px", color:D.muted}}>{u.stories}</td>
                    <td style={{padding:"12px 16px"}}>
                      <div>
                        <div style={{fontSize:13, fontWeight:600, color:D.text}}>{membership.label}</div>
                        <div style={{fontSize:10, color:D.muted, marginTop:1}}>since {membership.since}</div>
                      </div>
                    </td>
                    <td style={{padding:"12px 16px"}}>
                      {hasAction ? (
                        <div>
                          <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:5 }}>
                            <span style={{ width:7, height:7, borderRadius:"50%",
                              background:"#ef4444", display:"inline-block",
                              boxShadow:"0 0 0 2px rgba(239,68,68,0.25)" }}/>
                            <span style={{ fontSize:12, fontWeight:700, color:D.text }}>
                              {openReports.length > 1 ? `${openReports.length} issues` : latestReport.reason}
                            </span>
                          </div>
                          {openReports.length === 1 && (
                            <div style={{ fontSize:10, color:D.muted, marginBottom:6 }}>
                              {latestReport.date}
                            </div>
                          )}
                          <button onClick={() => setActionModal(u)} style={{
                            padding:"5px 12px", borderRadius:8, border:"none",
                            background:D.elevated, boxShadow:D.btnShadow,
                            color:D.text, fontSize:11, fontWeight:700, cursor:"pointer",
                          }}>Review →</button>
                        </div>
                      ) : (
                        <span style={{color:D.dim}}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ShellCard>
      <p style={{fontSize:11, color:D.dim}}>
        Wired to live <code style={{ color:D.muted }}>profiles</code> + <code style={{ color:D.muted }}>user_roles</code> + <code style={{ color:D.muted }}>stories</code>. Tier overrides persist in <code style={{ color:D.muted }}>app_settings.{USER_TIER_OVERRIDES_KEY}</code>, and admin UI access syncs to <code style={{ color:D.muted }}>user_roles</code>.
      </p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// REPORTS
// ══════════════════════════════════════════════════════════════
function ReportsPage() {
  const [reports,setReports] = useState(MOCK_REPORTS);
  const [filter, setFilter]  = useState("all");

  const displayed = reports.filter(r=>filter==="all"||r.status===filter);
  const update    = (id,status) => setReports(rs=>rs.map(r=>r.id===id?{...r,status}:r));

  const ss = { open:{bg:C.redSoft,color:C.red}, reviewing:{bg:C.amberSoft,color:C.amber}, resolved:{bg:C.greenSoft,color:C.green} };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
        <Stat label="Open"      value={reports.filter(r=>r.status==="open").length}      color={C.red}   soft={C.redSoft}   sub=""/>
        <Stat label="Reviewing" value={reports.filter(r=>r.status==="reviewing").length} color={C.amber} soft={C.amberSoft} sub=""/>
        <Stat label="Resolved"  value={reports.filter(r=>r.status==="resolved").length}  color={C.green} soft={C.greenSoft} sub=""/>
      </div>

      <Toggle
        options={[{label:"All",value:"all"},{label:"Open",value:"open"},
          {label:"Reviewing",value:"reviewing"},{label:"Resolved",value:"resolved"}]}
        value={filter} onChange={setFilter}/>

      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
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
                  <a href={`#story/${r.storyId}`}
                    style={{fontSize:12,color:C.blue,textDecoration:"none",fontWeight:500}}>
                    → Inspect story {r.storyId}
                  </a>
                </div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {r.status!=="reviewing" && <ActionBtn label="Mark Reviewing" color={C.amber} onClick={()=>update(r.id,"reviewing")}/>}
                  {r.status!=="resolved"  && <ActionBtn label="Resolve"        color={C.green} onClick={()=>update(r.id,"resolved")}/>}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      <p style={{fontSize:11,color:C.dim}}>
        TODO: Wire to Supabase `reports` table. Add realtime subscription for instant notification of new reports.
      </p>
    </div>
  );
}

// ─── models Chronicle actively uses (highlighted green) ───────
const CHRONICLE_MODELS = new Set([
  "grok-4-1-fast-reasoning",
  "grok-imagine-image",
]);

// ─── fallback data from docs.x.ai/developers/models.md ────────
const FALLBACK_MODELS = [
  { model:"grok-4.20-0309-reasoning",     type:"Language", input:"$2.00", cachedInput:"$0.20", output:"$6.00", context:"2,000,000", rateLimit:"4M TPM / 607 RPM" },
  { model:"grok-4.20-0309-non-reasoning", type:"Language", input:"$2.00", cachedInput:"$0.20", output:"$6.00", context:"2,000,000", rateLimit:"4M TPM / 607 RPM" },
  { model:"grok-4.20-multi-agent-0309",   type:"Language", input:"$2.00", cachedInput:"$0.20", output:"$6.00", context:"2,000,000", rateLimit:"4M TPM / 607 RPM" },
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
const USAGE_SERIES_META = [
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

const UsageMetricHeader = ({ label, help }) => (
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

function UsagePage() {
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

  const loadUsageSummary = async () => {
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
  };

  const loadUsageTimeseries = async (nextPeriod: AdminUsagePeriod) => {
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
  };

  const loadTestReport = async () => {
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
  };

  useEffect(() => {
    void loadUsageSummary();
    void loadTestReport();
    const interval = setInterval(() => {
      void loadUsageSummary();
      void loadTestReport();
    }, 120000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    void loadUsageTimeseries(period);
    const interval = setInterval(() => {
      void loadUsageTimeseries(period);
    }, 120000);
    return () => clearInterval(interval);
  }, [period]);

  const activeSeries = useMemo(() => {
    if (seriesGroup === "all") return USAGE_SERIES_META;
    return USAGE_SERIES_META.filter((series) => series.group === seriesGroup);
  }, [seriesGroup]);

  const chartData = useMemo(() => (
    usageTimeseries.points.map((point) => {
      const row: Record<string, number | string> = { label: point.label };
      activeSeries.forEach((series) => {
        const raw = Number((point as any)[series.key] || 0);
        row[series.key] = mode === "cost" ? raw * series.costPerEvent : raw;
      });
      return row;
    })
  ), [usageTimeseries, activeSeries, mode]);

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
    USAGE_SERIES_META.map((series) => [series.key, series.costPerEvent])
  ) as Record<string, number>;
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
  const MIN_TRACE_COLUMNS = 5;
  const traceColumns = useMemo(() => {
    const realColumns = sessionColumns.map((session, index) => {
      const createdAt = new Date(session.createdAt);
      const createdLabel = Number.isNaN(createdAt.getTime())
        ? "Tracked session"
        : createdAt.toLocaleDateString([], { month: "short", day: "numeric" });

      return {
        key: session.sessionId || `session-${index + 1}`,
        label: session.sessionName || `Session ${index + 1}`,
        subLabel: createdLabel,
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
  }, [sessionColumns]);
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
    { key:"totalTokensEst", label:"Total Tokens (Est.)", render:(v) => Math.round(Number(v)).toLocaleString() },
    { key:"totalCostEstUsd", label:"Total Cost", render:(v) => `-$${Number(v).toFixed(4)}` },
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
                  const series = USAGE_SERIES_META.find((entry) => entry.key === name);
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
            {timeseriesLoading ? "Loading chart..." : mode === "cost" ? "Cost view uses estimated per-event rates." : "Usage view shows event counts."}
          </div>
        </div>
      </ShellCard>

      <ShellCard>
        <SlateHeader title="API Test Session Trace" />
        <div style={{ padding:"14px 20px 20px" }}>
          <div style={{ fontSize:11, color:D.muted, marginBottom:10 }}>
            Admin-only test runs from Chat Settings toggle. Session names are columns; tracked metrics are rows.
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
            Pass: <span style={{ color:D.green, fontWeight:700 }}>{testReport.validationSummary.overall.pass}</span>
            {" · "}
            Fail: <span style={{ color:D.red, fontWeight:700 }}>{testReport.validationSummary.overall.fail}</span>
            {" · "}
            Blank: <span style={{ color:D.text, fontWeight:700 }}>{testReport.validationSummary.overall.blank}</span>
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
              Connect your xAI billing account to see credit balance, usage this month, and a low-balance warning directly here.
              Fetched via a Supabase edge function so your API key never touches the browser.
            </div>
            <button style={{ padding:"7px 16px", borderRadius:8, border:"none",
              background:D.elevated, boxShadow:D.btnShadow,
              color:D.text, fontSize:12, fontWeight:700, cursor:"pointer" }}>
              Connect xAI Billing →
            </button>
          </div>

          {/* Placeholder layout */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:16 }}>
            {[
              { label:"Prepaid credits remaining", value:"—",    note:"of $— total",       color:D.text },
              { label:"Used this month",           value:"—",    note:"billed to credits", color:D.text },
              { label:"Next invoice",              value:"$0.00",note:"no invoiced billing",color:D.text },
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

          {/* Waterfall rows */}
          <div style={{ background:D.tray, boxShadow:D.trayShadow, borderRadius:12, overflow:"hidden" }}>
            {[
              { label:"Total usage",          value:"—",    note:null },
              { label:"Prepaid credits used", value:"—",    note:null },
              { label:"Free credits used",    value:"—",    note:null },
              { label:"Next invoice",         value:"$0.00",note:"No invoiced billing set up", bold:true },
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

          <p style={{ fontSize:11, color:D.dim, marginTop:14, lineHeight:1.6 }}>
            TODO: Create Supabase edge function <code style={{color:D.muted}}>xai-billing-balance</code> that calls
            <code style={{color:D.muted}}> api.x.ai/v1/billing/credits</code> and <code style={{color:D.muted}}>api.x.ai/v1/billing/usage</code>.
            Store API key in Supabase secrets. Refresh on page load + manual refresh button.
            Add a low-balance alert when remaining credits drop below a configurable threshold.
          </p>
        </div>
      </ShellCard>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// SUBSCRIPTION TIERS
// ══════════════════════════════════════════════════════════════

const DEFAULT_TIERS = DEFAULT_SUBSCRIPTION_TIERS;
const FEATURE_SECTIONS = TIER_FEATURE_SECTIONS;

function NumInput({ value, onChange, min=0, step=1 }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:4 }}>
      <button onClick={() => onChange(Math.max(min, value - step))} style={{
        width:24, height:24, borderRadius:6, border:"none",
        background:D.elevated, boxShadow:D.btnShadow,
        color:D.text, fontSize:14, cursor:"pointer",
        display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700,
      }}>−</button>
      <input type="number" value={value} min={min} step={step}
        onChange={e => onChange(Math.max(min, Number(e.target.value)))}
        style={{ width:64, textAlign:"center", border:"none",
          borderTop:"1px solid rgba(0,0,0,0.35)",
          borderRadius:6, padding:"4px 6px", fontSize:12, fontWeight:600,
          color:D.text, background:D.recessed, outline:"none" }} />
      <button onClick={() => onChange(value + step)} style={{
        width:24, height:24, borderRadius:6, border:"none",
        background:D.elevated, boxShadow:D.btnShadow,
        color:D.text, fontSize:14, cursor:"pointer",
        display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700,
      }}>+</button>
    </div>
  );
}

function TiersPage() {
  const [tiers, setTiers] = useState<SubscriptionTierConfig[]>(DEFAULT_TIERS);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadTiers = async () => {
      const loadedTiers = await loadSubscriptionTiersConfig();
      if (isMounted) {
        setTiers(loadedTiers);
      }
    };

    void loadTiers();

    return () => {
      isMounted = false;
    };
  }, []);

  const updateTier    = (id: string, field: keyof SubscriptionTierConfig, value: string | number | null) =>
    setTiers(ts => ts.map(t => t.id !== id ? t : { ...t, [field]: value }));
  const updateFeature = (id: string, key: TierFeatureKey, value: boolean) =>
    setTiers(ts => ts.map(t => t.id !== id ? t : { ...t, features: { ...t.features, [key]: value } }));

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await saveSubscriptionTiersConfig(tiers);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (error) {
      console.error("Failed to save subscription tiers:", error);
      setSaveError("Save failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:28 }}>

      {/* ── save bar ── */}
      <ShellCard>
        <div style={{ padding:"14px 20px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontSize:13, color:D.text }}>
            Edit the controls below — the preview updates instantly.
            <span style={{ color:D.muted, marginLeft:6 }}>
              Save & Apply publishes this configuration to the live Subscription tab.
            </span>
          </div>
          <button onClick={() => void handleSave()} disabled={saving} style={{
            padding:"8px 22px", borderRadius:10, border:"none", cursor:"pointer",
            background: saved ? D.green : D.blue,
            boxShadow: saved ? D.glow(D.green) : D.blueGlow,
            color:"#fff", fontSize:13, fontWeight:700, transition:"background .2s",
            flexShrink:0, marginLeft:16,
            opacity: saving ? 0.8 : 1,
          }}>{saving ? "Saving..." : saved ? "✓ Applied!" : "Save & Apply"}</button>
        </div>
      </ShellCard>

      {/* ══ ROW 1 — Live preview ══ */}
      <div>
        <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase",
          letterSpacing:"0.08em", color:D.muted, marginBottom:14 }}>
          Live preview — what subscribers see
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
          {tiers.map((t, ti) => {
            const allFeatureKeys = FEATURE_SECTIONS.flatMap(s => s.rows)
              .filter(row => row.type === "toggle")
              .map(row => row.key);

            // Features enabled in this tier
            const myFeatures = allFeatureKeys.filter(k => t.features[k]);

            // Features enabled in the previous tier (inherited)
            const prevTier = ti > 0 ? tiers[ti - 1] : null;
            const inheritedKeys = new Set(prevTier
              ? allFeatureKeys.filter(k => prevTier.features[k])
              : []);

            // New features = enabled here but NOT in previous tier
            const newFeatures = myFeatures.filter(k => !inheritedKeys.has(k));
            // Inherited features = enabled in both this and previous tier
            const inheritedFeatures = myFeatures.filter(k => inheritedKeys.has(k));

            // Limits: is this tier's limit higher than previous?
            const msgIsNew = !prevTier || t.msgLimit !== prevTier.msgLimit;
            const imgIsNew = !prevTier || t.imgLimit !== prevTier.imgLimit;

            return (
              <div key={t.id} style={{
                background: D.shell,
                boxShadow: t.badge
                  ? `0 12px 32px -2px rgba(0,0,0,0.50), inset 1px 1px 0 ${t.accent}44, inset -1px -1px 0 rgba(0,0,0,0.35)`
                  : D.shellShadow,
                borderRadius:24, overflow:"hidden",
                display:"flex", flexDirection:"column",
                position:"relative",
              }}>
                {/* colored accent top bar */}
                <div style={{ height:4, background:t.accent, flexShrink:0 }} />
                {t.badge && (
                  <div style={{ position:"absolute", top:14, right:14,
                    background:t.accent, color:"#fff", fontSize:10, fontWeight:700,
                    padding:"2px 10px", borderRadius:20, whiteSpace:"nowrap" }}>
                    {t.badge}
                  </div>
                )}
                <div style={{ padding:"20px 18px 22px", display:"flex", flexDirection:"column", flex:1 }}>
                  <div style={{ fontSize:15, fontWeight:700, color:D.text, marginBottom:3 }}>{t.name}</div>
                  <div style={{ fontSize:11, color:D.muted, marginBottom:16 }}>
                    {getTierSubtitleById(t.id)}
                  </div>
                  <div style={{ display:"flex", alignItems:"baseline", gap:4, marginBottom:18 }}>
                    <span style={{ fontSize:30, fontWeight:800, color:D.text, lineHeight:1 }}>
                      {t.price === 0 ? "$0" : `$${t.price % 1 === 0 ? t.price : t.price.toFixed(2)}`}
                    </span>
                    {t.price > 0 && <span style={{ fontSize:12, color:D.muted }}>/mo</span>}
                  </div>
                  <button style={{ width:"100%", padding:"9px 0", borderRadius:10, marginBottom:18,
                    border:"none",
                    background: t.id==="free" ? D.elevated : t.accent,
                    boxShadow: D.btnShadow,
                    color:"#fff", fontSize:13, fontWeight:700, cursor:"default" }}>
                    {t.id === "free" ? "Start Free" : `Get ${t.name}`}
                  </button>

                  {/* "Everything in X, plus:" inherited block */}
                  {prevTier && (inheritedFeatures.length > 0 || !msgIsNew) && (
                    <div style={{ marginBottom:10 }}>
                      <div style={{ fontSize:11, fontWeight:700, color:D.muted, marginBottom:6 }}>
                        Everything in {prevTier.name}, plus:
                      </div>
                    </div>
                  )}

                  {/* NEW features for this tier — highlighted */}
                  {(newFeatures.length > 0 || msgIsNew || (ti > 0 && imgIsNew && t.imgLimit > 0)) && (
                    <div style={{ background:D.tray, boxShadow:D.trayShadow,
                      borderRadius:12, padding:"12px 14px", marginBottom:10,
                      display:"flex", flexDirection:"column", gap:7 }}>
                      {msgIsNew && (
                        <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                          <span style={{ color:t.accent, fontWeight:800, fontSize:13 }}>✓</span>
                          <span style={{ fontSize:12, color:D.text, fontWeight:600 }}>
                            {t.msgLimit === 0 ? "Messages" : `${t.msgLimit.toLocaleString()} messages / mo`}
                          </span>
                        </div>
                      )}
                      {ti > 0 && imgIsNew && t.imgLimit > 0 && (
                        <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                          <span style={{ color:t.accent, fontWeight:800, fontSize:13 }}>✓</span>
                          <span style={{ fontSize:12, color:D.text, fontWeight:600 }}>{t.imgLimit} images / mo</span>
                        </div>
                      )}
                      {newFeatures.map(k => (
                        <div key={k} style={{ display:"flex", alignItems:"flex-start", gap:7 }}>
                          <span style={{ color:t.accent, fontWeight:800, fontSize:13, flexShrink:0, lineHeight:"18px" }}>✓</span>
                          <span style={{ fontSize:12, color:D.text, fontWeight:600, lineHeight:"18px" }}>{getFeatureLabel(k as TierFeatureKey)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* INHERITED features — dimmed, shows continuity */}
                  {(inheritedFeatures.length > 0 || (!msgIsNew && t.msgLimit > 0) || (!imgIsNew && t.imgLimit > 0)) && (
                    <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                      {!msgIsNew && t.msgLimit > 0 && (
                        <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                          <span style={{ color:D.dim, fontSize:11 }}>✓</span>
                          <span style={{ fontSize:11, color:D.muted }}>{t.msgLimit.toLocaleString()} messages / mo</span>
                        </div>
                      )}
                      {!imgIsNew && t.imgLimit > 0 && (
                        <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                          <span style={{ color:D.dim, fontSize:11 }}>✓</span>
                          <span style={{ fontSize:11, color:D.muted }}>{t.imgLimit} images / mo</span>
                        </div>
                      )}
                      {inheritedFeatures.map(k => (
                        <div key={k} style={{ display:"flex", alignItems:"flex-start", gap:7 }}>
                          <span style={{ color:D.dim, fontSize:11, flexShrink:0, lineHeight:"17px" }}>✓</span>
                          <span style={{ fontSize:11, color:D.muted, lineHeight:"17px" }}>{getFeatureLabel(k as TierFeatureKey)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* First tier — just show all enabled features normally */}
                  {!prevTier && (
                    <div style={{ background:D.tray, boxShadow:D.trayShadow,
                      borderRadius:12, padding:"12px 14px",
                      display:"flex", flexDirection:"column", gap:7 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                        <span style={{ color:t.accent, fontWeight:800, fontSize:13 }}>✓</span>
                        <span style={{ fontSize:12, color:D.text, fontWeight:600 }}>
                          {t.msgLimit === 0 ? "Limited messages" : `${t.msgLimit.toLocaleString()} messages / mo`}
                        </span>
                      </div>
                      {t.imgLimit > 0 && (
                        <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                          <span style={{ color:t.accent, fontWeight:800, fontSize:13 }}>✓</span>
                          <span style={{ fontSize:12, color:D.text, fontWeight:600 }}>{t.imgLimit} images / mo</span>
                        </div>
                      )}
                      {myFeatures.map(k => (
                        <div key={k} style={{ display:"flex", alignItems:"flex-start", gap:7 }}>
                          <span style={{ color:t.accent, fontWeight:800, fontSize:13, flexShrink:0, lineHeight:"18px" }}>✓</span>
                          <span style={{ fontSize:12, color:D.text, fontWeight:600, lineHeight:"18px" }}>{getFeatureLabel(k as TierFeatureKey)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ══ ROW 2 — Admin editor ══ */}
      <div>
        <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase",
          letterSpacing:"0.08em", color:D.muted, marginBottom:14 }}>
          Admin editor — adjust tiers
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
          {tiers.map(t => (
            <ShellCard key={t.id} style={{
              borderTop:`3px solid ${t.accent}`,
            }}>
              <div style={{ padding:"18px 16px", display:"flex", flexDirection:"column", gap:14 }}>

                {/* header */}
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ width:10, height:10, borderRadius:"50%", background:t.accent, flexShrink:0 }} />
                  <div style={{ fontSize:14, fontWeight:700, color:D.text }}>{t.name}</div>
                </div>

                {/* badge text */}
                <div>
                  <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase",
                    letterSpacing:"0.06em", color:D.muted, marginBottom:5 }}>Badge label</div>
                  <input value={t.badge || ""} placeholder="e.g. Most Popular"
                    onChange={e => updateTier(t.id, "badge", e.target.value || null)}
                    style={{ width:"100%", boxSizing:"border-box",
                      border:"none", borderTop:"1px solid rgba(0,0,0,0.35)",
                      borderRadius:6, padding:"6px 9px", fontSize:12, color:D.text,
                      background:D.recessed, outline:"none" }} />
                </div>

                {/* price */}
                <div>
                  <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase",
                    letterSpacing:"0.06em", color:D.muted, marginBottom:5 }}>Price / mo ($)</div>
                  <NumInput value={t.price} step={1} min={0}
                    onChange={v => updateTier(t.id, "price", v)} />
                </div>

                {/* message limit */}
                <div>
                  <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase",
                    letterSpacing:"0.06em", color:D.muted, marginBottom:5 }}>Messages / mo</div>
                  <NumInput value={t.msgLimit} step={50} min={0}
                    onChange={v => updateTier(t.id, "msgLimit", v)} />
                </div>

                {/* image limit */}
                <div>
                  <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase",
                    letterSpacing:"0.06em", color:D.muted, marginBottom:5 }}>Images / mo</div>
                  <NumInput value={t.imgLimit} step={5} min={0}
                    onChange={v => updateTier(t.id, "imgLimit", v)} />
                </div>

                {/* feature checkboxes */}
                <div>
                  <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase",
                    letterSpacing:"0.06em", color:D.muted, marginBottom:8 }}>Features</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
                    {FEATURE_SECTIONS.map((section, si) => (
                      <div key={si}>
                        <div style={{
                          fontSize:10, fontWeight:700, color:D.muted,
                          textTransform:"uppercase", letterSpacing:"0.05em",
                          padding:"7px 0 3px",
                          borderTop: si > 0 ? `1px solid ${D.divider}` : "none",
                          marginTop: si > 0 ? 4 : 0,
                        }}>
                          {section.icon} {section.label}
                        </div>
                        {section.rows.map(row => {
                          if (row.type === "limit") return null;
                          const checked = !!t.features[row.key];
                          return (
                            <label key={row.key} style={{
                              display:"flex", alignItems:"flex-start", gap:8,
                              padding:"5px 0", cursor:"pointer",
                            }}>
                              <input type="checkbox" checked={checked}
                                onChange={() => updateFeature(t.id, row.key, !checked)}
                                style={{ marginTop:2, accentColor:t.accent, flexShrink:0 }} />
                              <div>
                                <div style={{ fontSize:12, fontWeight:600, color:D.text, lineHeight:1.3 }}>
                                  {row.label}
                                </div>
                                <div style={{ fontSize:10, color:D.muted, lineHeight:1.3 }}>
                                  {row.hint}
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ShellCard>
          ))}
        </div>
        <p style={{ fontSize:11, color:D.dim, marginTop:14 }}>
          {saveError ? (
            <span style={{ color: D.red }}>{saveError}</span>
          ) : (
            <>Saved tier settings are persisted in <code style={{color:D.muted}}>app_settings.subscription_tiers_v1</code> and used by the account Subscription page.</>
          )}
        </p>
      </div>

    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// STRATEGY — all 6 sheets
// ══════════════════════════════════════════════════════════════

// ── Sheet 1: Market Context ─────────────────────────────────
// Each competitor object: all comparable dimensions for investor-grade comparison
const S1_COMPETITORS = [
  {
    name:"Chronicle (you)", scale:"you", launch:2026, team:"1 person",
    visits:"—", paidEst:"pre-launch",
    // Pricing
    entryPrice:"$9.99/mo", midPrice:"$19.99/mo", topPrice:"$39.99/mo",
    annualDiscount:"None yet",
    virtualCurrency:"None — direct subscription",
    addOnPurchases:"None planned",
    // Messaging
    freeMessages:"20 (trial)",
    starterMessages:"300/mo",
    midMessages:"900/mo",
    topMessages:"2,200/mo",
    unlimitedMessages:"✗",
    // Images
    freeImages:"0",
    starterImages:"10/mo",
    midImages:"30/mo",
    topImages:"100/mo",
    videoGen:"✗",
    // AI Features
    longTermMemory:"Premium+ (day memories compressed across sessions)",
    aiCharacterGen:"Premium+ (AI-assisted generation)",
    aiScenarioGen:"Premium+ (AI-assisted generation)",
    customCharacters:"All tiers",
    nsfw:"All tiers",
    voiceFeature:"✗",
    // Social / Community
    communityGallery:"All tiers",
    publishContent:"✗",
    creatorBadge:"✗",
    // Platform
    multipleCharacters:"Yes — scenario engine",
    contextWindow:"Not publicly specified",
    mobileApp:"✗",
    verifiedSource:"Internal",
  },
  {
    name:"SpicyChat.ai", scale:"giant", launch:2023, team:"Team",
    visits:"74,850,000", paidEst:"750K–2.2M",
    entryPrice:"$5.00/mo", midPrice:"$14.95/mo", topPrice:"$24.95/mo",
    annualDiscount:"Yes — publicly available",
    virtualCurrency:"✗ — subscription only",
    addOnPurchases:"✗",
    freeMessages:"Limited (free tier)",
    starterMessages:"No ads + larger context",
    midMessages:"Longer replies + conv. images",
    topMessages:"Priority generation",
    unlimitedMessages:"✓ (all paid tiers)",
    freeImages:"✗",
    starterImages:"✗",
    midImages:"Conversation images",
    topImages:"Conversation images",
    videoGen:"✗",
    longTermMemory:"Semantic Memory 2.0 (True Supporter+)",
    aiCharacterGen:"✗",
    aiScenarioGen:"✗",
    customCharacters:"Up to 100 personas (top tier)",
    nsfw:"All tiers",
    voiceFeature:"Text-to-speech (top tier)",
    communityGallery:"✓",
    publishContent:"✓",
    creatorBadge:"✗",
    multipleCharacters:"Yes — up to 100 personas",
    contextWindow:"4K–16K tokens (tier-gated)",
    mobileApp:"✓",
    verifiedSource:"Official docs",
  },
  {
    name:"Candy.ai", scale:"giant", launch:2022, team:"Company",
    visits:"100,400,000", paidEst:"1M–3M",
    entryPrice:"$13.99/mo", midPrice:"$13.99/mo", topPrice:"$13.99/mo",
    annualDiscount:"$3.99/mo effective (annual)",
    virtualCurrency:"100 tokens/mo (for extras)",
    addOnPurchases:"Yes — token top-ups",
    freeMessages:"Free trial (limited)",
    starterMessages:"Unlimited",
    midMessages:"Unlimited",
    topMessages:"Unlimited",
    unlimitedMessages:"✓",
    freeImages:"✗",
    starterImages:"Included",
    midImages:"Included",
    topImages:"Included",
    videoGen:"✗",
    longTermMemory:"✓",
    aiCharacterGen:"✗",
    aiScenarioGen:"✗",
    customCharacters:"✓",
    nsfw:"✓ (paid)",
    voiceFeature:"AI phone calls (paid)",
    communityGallery:"✓",
    publishContent:"✗",
    creatorBadge:"✗",
    multipleCharacters:"Yes",
    contextWindow:"Not specified",
    mobileApp:"✓",
    verifiedSource:"Official site",
  },
  {
    name:"GPTGirlfriend", scale:"large", launch:2023, team:"Team",
    visits:"8,460,000", paidEst:"85K–250K",
    entryPrice:"$12/mo ($144/yr)", midPrice:"$24.50/mo ($294/yr)", topPrice:"$33–$50/mo ($396/yr)",
    annualDiscount:"Yes — annual pricing available",
    virtualCurrency:"Coins (400–2,000+/mo by tier)",
    addOnPurchases:"Yes — coin bundles",
    freeMessages:"Free trial",
    starterMessages:"5,000/mo (Premium)",
    midMessages:"20,000/mo (Deluxe)",
    topMessages:"Unlimited (Elite)",
    unlimitedMessages:"✓ (Elite only)",
    freeImages:"✗",
    starterImages:"Via coins",
    midImages:"In-chat pictures (Deluxe+)",
    topImages:"In-chat pictures + priority",
    videoGen:"✗",
    longTermMemory:"8K memory (Deluxe) · 16K memory (Elite)",
    aiCharacterGen:"✗",
    aiScenarioGen:"✗",
    customCharacters:"✓",
    nsfw:"✓ (Premium+)",
    voiceFeature:"Voice interaction (Deluxe+)",
    communityGallery:"✗",
    publishContent:"✗",
    creatorBadge:"✓ (Elite — creator badge)",
    multipleCharacters:"Yes",
    contextWindow:"8K (Deluxe) · 16K (Elite)",
    mobileApp:"✓",
    verifiedSource:"Third-party research — pricing page hidden/removed. Last known: Premium $12, Deluxe $24.50, Elite $33–$50. May be outdated.",
  },
  {
    name:"OurDream.ai", scale:"mid", launch:2025, team:"Small",
    visits:"4,000,000", paidEst:"40K–120K",
    entryPrice:"$19.99/mo", midPrice:"$19.99/mo", topPrice:"$19.99/mo",
    annualDiscount:"$9.99/mo effective",
    virtualCurrency:"DreamCoins (1,000/mo + 1K signup bonus)",
    addOnPurchases:"Yes — DreamCoins",
    freeMessages:"✗ (mostly paywalled)",
    starterMessages:"Unlimited",
    midMessages:"Unlimited",
    topMessages:"Unlimited",
    unlimitedMessages:"✓",
    freeImages:"✗",
    starterImages:"✓ image gen",
    midImages:"✓ image gen",
    topImages:"✓ image gen",
    videoGen:"✓ (included)",
    longTermMemory:"✗",
    aiCharacterGen:"✗",
    aiScenarioGen:"✗",
    customCharacters:"✓",
    nsfw:"✓",
    voiceFeature:"✗",
    communityGallery:"✗",
    publishContent:"✗",
    creatorBadge:"✗",
    multipleCharacters:"Yes",
    contextWindow:"Not specified",
    mobileApp:"✓",
    verifiedSource:"Official site",
  },
  {
    name:"Kupid.ai", scale:"small", launch:2023, team:"Small",
    visits:"~500,000", paidEst:"5K–15K",
    entryPrice:"$12.99/mo", midPrice:"$24.99/mo", topPrice:"$24.99/mo",
    annualDiscount:"Weekly/yearly/lifetime available",
    virtualCurrency:"✗ — weekly quota system",
    addOnPurchases:"✗",
    freeMessages:"15/mo",
    starterMessages:"~25 photos/wk equivalent",
    midMessages:"~75 photos/wk equivalent",
    topMessages:"~75 photos/wk equivalent",
    unlimitedMessages:"✗ — weekly quotas",
    freeImages:"✗",
    starterImages:"25 photos/wk",
    midImages:"75 photos/wk",
    topImages:"75 photos/wk",
    videoGen:"8–25 videos/wk (paid)",
    longTermMemory:"30–100 messages remembered",
    aiCharacterGen:"4–8 custom creations",
    aiScenarioGen:"✗",
    customCharacters:"4–8 custom creations",
    nsfw:"✓",
    voiceFeature:"12–35 voice min/wk",
    communityGallery:"✗",
    publishContent:"✗",
    creatorBadge:"✗",
    multipleCharacters:"Yes",
    contextWindow:"Last 30–100 messages",
    mobileApp:"✓",
    verifiedSource:"Official pricing page",
  },
  {
    name:"Soulkyn ⭐", scale:"solo", launch:2025, team:"1 person",
    visits:"~1,100,000", paidEst:"11K–33K",
    entryPrice:"$11.99/mo", midPrice:"$24.99/mo", topPrice:"$99.99/mo",
    annualDiscount:"~10% off 3mo, ~20% off annual",
    virtualCurrency:"✗ — subscription tiers",
    addOnPurchases:"✗",
    freeMessages:"5,000/mo (capped free)",
    starterMessages:"Unlimited",
    midMessages:"Unlimited",
    topMessages:"Unlimited",
    unlimitedMessages:"✓ (paid)",
    freeImages:"5 quota",
    starterImages:"300 quota/mo",
    midImages:"Unlimited generation",
    topImages:"Unlimited + 300 AI edits",
    videoGen:"50/mo quota (top tier)",
    longTermMemory:"✓",
    aiCharacterGen:"✗",
    aiScenarioGen:"✗",
    customCharacters:"✓",
    nsfw:"✓",
    voiceFeature:"Voice messages (paid tiers)",
    communityGallery:"✗",
    publishContent:"✗",
    creatorBadge:"✗",
    multipleCharacters:"Yes",
    contextWindow:"Not specified",
    mobileApp:"✓",
    verifiedSource:"Third-party (official checkout not public)",
  },
];

// Row definitions for the transposed table
const S1_ROWS = [
  { group:"Scale & Team" },
  { label:"Monthly Visits",         key:"visits",            note:null },
  { label:"Est. Paid Users",         key:"paidEst",           note:null },
  { label:"Launch Year",             key:"launch",            note:null },
  { label:"Team Size",               key:"team",              note:null },
  { group:"Pricing Model" },
  { label:"Entry Paid Tier",         key:"entryPrice",        note:"Lowest paid monthly price" },
  { label:"Mid Tier",                key:"midPrice",          note:null },
  { label:"Top Tier",                key:"topPrice",          note:null },
  { label:"Annual Discount",         key:"annualDiscount",    note:null },
  { label:"Virtual Currency",        key:"virtualCurrency",   note:"Coins, tokens, DreamCoins, etc." },
  { label:"Add-On Purchases",        key:"addOnPurchases",    note:"Can you buy more without upgrading?" },
  { group:"Messaging" },
  { label:"Free Messages",           key:"freeMessages",      note:null },
  { label:"Entry Tier Messages",     key:"starterMessages",   note:null },
  { label:"Mid Tier Messages",       key:"midMessages",       note:null },
  { label:"Top Tier Messages",       key:"topMessages",       note:null },
  { label:"Unlimited Messages",      key:"unlimitedMessages", note:null },
  { group:"Image & Video" },
  { label:"Free Images",             key:"freeImages",        note:null },
  { label:"Entry Tier Images",       key:"starterImages",     note:null },
  { label:"Mid Tier Images",         key:"midImages",         note:null },
  { label:"Top Tier Images",         key:"topImages",         note:null },
  { label:"Video Generation",        key:"videoGen",          note:null },
  { group:"AI Features" },
  { label:"Long-Term Memory",        key:"longTermMemory",    note:"Persistent memory across sessions" },
  { label:"AI Character Generation", key:"aiCharacterGen",    note:null },
  { label:"AI Scenario Generation",  key:"aiScenarioGen",     note:null },
  { label:"Custom Characters",       key:"customCharacters",  note:null },
  { label:"NSFW Content",            key:"nsfw",              note:null },
  { label:"Voice Feature",           key:"voiceFeature",      note:null },
  { group:"Social & Community" },
  { label:"Community Gallery",       key:"communityGallery",  note:"Browse others' content" },
  { label:"Publish Content",         key:"publishContent",    note:"Share your own content" },
  { label:"Creator Badge",           key:"creatorBadge",      note:null },
  { group:"Platform" },
  { label:"Multiple Characters",     key:"multipleCharacters",note:null },
  { label:"Context Window",          key:"contextWindow",     note:"How much conversation remembered" },
  { label:"Mobile App",              key:"mobileApp",         note:null },
  { label:"Data Source",             key:"verifiedSource",    note:null },
];
const S1_REALITY = [
  { comp:"SpicyChat scale",      traffic:"74.8M visits/mo", detail:"Capture 0.01% = 7,480 visitors/mo → ~150 paid users at 2% conversion" },
  { comp:"GPTGirlfriend scale",  traffic:"8.46M visits/mo", detail:"Capture 0.1% = 8,460 visitors/mo → ~170 paid users at 2% conversion" },
  { comp:"Soulkyn benchmark ⭐", traffic:"~1.1M visits/mo", detail:"Best solo dev comp — took ~12 months to reach this. Started similar to Chronicle." },
  { comp:"Realistic Y1 target",  traffic:"5K–50K visits/mo",detail:"Solo dev with no marketing budget. Organic SEO + Reddit + niche communities." },
  { comp:"Paid conversion rate",  traffic:"1–3% of visitors",detail:"Industry standard for freemium adult AI. Free trial = 20 msg, then pay." },
  { comp:"Realistic Y1 paid",    traffic:"50–500 paid users",detail:"Low end: no marketing effort. High end: active community building on Reddit/Discord." },
];

// ── Sheet 2: Unit Economics ──────────────────────────────────
const S2_COST_INPUTS = [
  { label:"Chat: input tokens per message",  value:"7,450",    unit:"tokens",    note:"System prompt + history + user msg" },
  { label:"Chat: output tokens per message", value:"500",      unit:"tokens",    note:"Avg AI response length" },
  { label:"xAI input price",                 value:"$0.20",    unit:"/M tokens", note:"grok-4-1-fast-reasoning" },
  { label:"xAI output price",                value:"$0.50",    unit:"/M tokens", note:"grok-4-1-fast-reasoning" },
  { label:"Extraction: every Nth message",   value:"5",        unit:"messages",  note:"Throttled — 80% cost reduction vs every-msg" },
  { label:"Image generation cost",           value:"$0.02",    unit:"/image",    note:"grok-imagine-image" },
  { label:"Cost per chat message (calc)",    value:"$0.00174", unit:"",          note:"Derived from token inputs/outputs above" },
  { label:"Extraction cost amortized/msg",   value:"$0.00035", unit:"",          note:"Spread across every message" },
  { label:"TOTAL cost per message",          value:"$0.00209", unit:"",          note:"Chat + extraction combined", highlight:true },
];
const S2_PER_USER = [
  { tier:"Free Trial", price:0,     msgLimit:20,   imgLimit:0,   msgCost:0.042, imgCost:0,   totalApi:0.042, grossProfit:-0.042, margin:"0%",   ltv:"—",   annualRev:"—"   },
  { tier:"Starter",    price:9.99,  msgLimit:300,  imgLimit:10,  msgCost:0.627, imgCost:0.2, totalApi:0.827, grossProfit:9.163,  margin:"91.7%",ltv:"$165",annualRev:"$120"},
  { tier:"Premium",    price:19.99, msgLimit:900,  imgLimit:30,  msgCost:1.881, imgCost:0.6, totalApi:2.481, grossProfit:17.509, margin:"87.6%",ltv:"$315",annualRev:"$240"},
  { tier:"Elite",      price:39.99, msgLimit:2200, imgLimit:100, msgCost:4.598, imgCost:2.0, totalApi:6.598, grossProfit:33.392, margin:"83.5%",ltv:"$720",annualRev:"$480"},
];
const S2_INFRA = [
  { scale:"0–499 users",     cost:371,  starterCover:41,  premiumCover:22, eliteCover:12, note:"Supabase free tier + basic hosting. Covers launch phase.", current:true },
  { scale:"500–4,999 users", cost:946,  starterCover:104, premiumCover:55, eliteCover:29, note:"Supabase Pro + modest hosting. Scales to a few thousand users.", current:false },
  { scale:"5K–49,999 users", cost:4404, starterCover:481, premiumCover:252,eliteCover:132,note:"Supabase Team + CDN + increased compute. Meaningful scale.", current:false },
];

// ── Sheet 3: Break-Even Calculator ──────────────────────────
const S3_BREAKEVEN = [
  { users:1,    starterRev:0,      premiumRev:0,      eliteRev:39.99,   totalRev:39.99,   apiCost:6.598,   infraCost:371, ebitda:-337.608, margin:-8.44,  status:"Loss" },
  { users:5,    starterRev:19.98,  premiumRev:19.99,  eliteRev:79.98,   totalRev:119.95,  apiCost:17.331,  infraCost:371, ebitda:-268.381, margin:-2.24,  status:"Loss" },
  { users:10,   starterRev:49.95,  premiumRev:59.97,  eliteRev:79.98,   totalRev:189.9,   apiCost:24.774,  infraCost:371, ebitda:-205.874, margin:-1.08,  status:"Loss" },
  { users:15,   starterRev:69.93,  premiumRev:99.95,  eliteRev:119.97,  totalRev:289.85,  apiCost:37.988,  infraCost:371, ebitda:-119.138, margin:-0.41,  status:"Near break-even" },
  { users:20,   starterRev:99.9,   premiumRev:139.93, eliteRev:119.97,  totalRev:359.8,   apiCost:45.431,  infraCost:371, ebitda:-56.631,  margin:-0.16,  status:"Near break-even" },
  { users:25,   starterRev:119.88, premiumRev:159.92, eliteRev:199.95,  totalRev:479.75,  apiCost:62.762,  infraCost:371, ebitda:45.988,   margin:0.096,  status:"✅ Profitable" },
  { users:30,   starterRev:149.85, premiumRev:199.9,  eliteRev:199.95,  totalRev:549.7,   apiCost:70.205,  infraCost:371, ebitda:108.495,  margin:0.197,  status:"✅ Profitable" },
  { users:40,   starterRev:199.8,  premiumRev:279.86, eliteRev:239.94,  totalRev:719.6,   apiCost:90.862,  infraCost:371, ebitda:257.738,  margin:0.358,  status:"✅ Profitable" },
  { users:50,   starterRev:249.75, premiumRev:339.83, eliteRev:319.92,  totalRev:909.5,   apiCost:115.636, infraCost:371, ebitda:422.864,  margin:0.465,  status:"✅ Profitable" },
  { users:75,   starterRev:369.63, premiumRev:519.74, eliteRev:479.88,  totalRev:1369.25, apiCost:174.281, infraCost:371, ebitda:823.969,  margin:0.602,  status:"✅ Strong profit" },
  { users:100,  starterRev:499.5,  premiumRev:699.65, eliteRev:599.85,  totalRev:1799,    apiCost:227.155, infraCost:371, ebitda:1200.845, margin:0.668,  status:"✅ Strong profit" },
  { users:150,  starterRev:749.25, premiumRev:1039.48,eliteRev:919.77,  totalRev:2708.5,  apiCost:342.791, infraCost:371, ebitda:1994.709, margin:0.736,  status:"✅ Strong profit" },
  { users:200,  starterRev:999,    premiumRev:1399.3, eliteRev:1199.7,  totalRev:3598,    apiCost:454.31,  infraCost:371, ebitda:2772.69,  margin:0.771,  status:"✅ Strong profit" },
  { users:300,  starterRev:1498.5, premiumRev:2098.95,eliteRev:1799.55, totalRev:5397,    apiCost:681.465, infraCost:371, ebitda:4344.535, margin:0.805,  status:"✅ Strong profit" },
  { users:500,  starterRev:2497.5, premiumRev:3498.25,eliteRev:2999.25, totalRev:8995,    apiCost:1135.775,infraCost:371, ebitda:7488.225, margin:0.832,  status:"✅ Strong profit" },
  { users:750,  starterRev:3746.25,premiumRev:5237.38,eliteRev:4518.87, totalRev:13502.5, apiCost:1705.721,infraCost:371, ebitda:11425.779,margin:0.846,  status:"✅ Strong profit" },
  { users:1000, starterRev:4995,   premiumRev:6996.5, eliteRev:5998.5,  totalRev:17990,   apiCost:2271.55, infraCost:371, ebitda:15347.45, margin:0.853,  status:"✅ Strong profit" },
  { users:2000, starterRev:9990,   premiumRev:13993,  eliteRev:11997,   totalRev:35980,   apiCost:4543.1,  infraCost:371, ebitda:31065.9,  margin:0.863,  status:"✅ Strong profit" },
  { users:5000, starterRev:24975,  premiumRev:34982.5,eliteRev:29992.5, totalRev:89950,   apiCost:11357.75,infraCost:371, ebitda:78221.25, margin:0.870,  status:"✅ Strong profit" },
];

// ── Sheet 4: 36-Month Scenario Forecast ──────────────────────
const S4_SCENARIOS = [
  { scenario:"Conservative", m1:10, growth:0.08, starterPct:0.6, premiumPct:0.3, elitePct:0.1, desc:"Very limited marketing. Word of mouth only. Realistic floor." },
  { scenario:"Base",         m1:25, growth:0.12, starterPct:0.5, premiumPct:0.35,elitePct:0.15,desc:"Some Reddit/Discord presence. Organic SEO building." },
  { scenario:"Optimistic",   m1:50, growth:0.18, starterPct:0.4, premiumPct:0.35,elitePct:0.25,desc:"Active community building. Featured on AI directories. Some press." },
];
const S4_FORECAST = [
  { mo:1,  cPaid:10, cRev:159.9,   cEBIT:-230.1,  cCum:-230.1,   bPaid:25, bRev:479.75,  bEBIT:46.0,    bCum:46.0,     oPaid:50,    oRev:1059.5,   oEBIT:544.0,   oCum:544.0,    milestone:"B break-even · O break-even" },
  { mo:2,  cPaid:11, cRev:199.89,  cEBIT:-196.7,  cCum:-426.8,   bPaid:28, bRev:519.72,  bEBIT:81.8,    bCum:127.8,    oPaid:59,    oRev:1269.41,  oEBIT:724.2,   oCum:1268.2,   milestone:"" },
  { mo:3,  cPaid:12, cRev:209.88,  cEBIT:-187.5,  cCum:-614.4,   bPaid:31, bRev:589.69,  bEBIT:141.9,   bCum:269.7,    oPaid:69,    oRev:1469.31,  oEBIT:897.7,   oCum:2165.9,   milestone:"" },
  { mo:4,  cPaid:13, cRev:249.87,  cEBIT:-154.2,  cCum:-768.5,   bPaid:34, bRev:629.66,  bEBIT:177.7,   bCum:447.4,    oPaid:81,    oRev:1719.19,  oEBIT:1113.7,  oCum:3279.6,   milestone:"" },
  { mo:5,  cPaid:14, cRev:239.86,  cEBIT:-160.9,  cCum:-929.4,   bPaid:38, bRev:689.62,  bEBIT:231.1,   bCum:678.5,    oPaid:95,    oRev:1999.05,  oEBIT:1356.4,  oCum:4636.0,   milestone:"" },
  { mo:6,  cPaid:15, cRev:249.85,  cEBIT:-151.7,  cCum:-1081.1,  bPaid:42, bRev:769.58,  bEBIT:300.3,   bCum:978.8,    oPaid:112,   oRev:2378.88,  oEBIT:1683.4,  oCum:6319.4,   milestone:"" },
  { mo:7,  cPaid:16, cRev:289.84,  cEBIT:-118.3,  cCum:-1199.4,  bPaid:47, bRev:869.53,  bEBIT:387.0,   bCum:1365.8,   oPaid:132,   oRev:2798.68,  oEBIT:2046.2,  oCum:8365.6,   milestone:"" },
  { mo:8,  cPaid:17, cRev:279.83,  cEBIT:-125.0,  cCum:-1324.5,  bPaid:52, bRev:939.48,  bEBIT:449.5,   bCum:1815.3,   oPaid:155,   oRev:3258.45,  oEBIT:2444.9,  oCum:10810.5,  milestone:"" },
  { mo:9,  cPaid:18, cRev:319.82,  cEBIT:-91.6,   cCum:-1416.1,  bPaid:58, bRev:1049.42, bEBIT:545.4,   bCum:2360.8,   oPaid:182,   oRev:3858.18,  oEBIT:2961.2,  oCum:13771.7,  milestone:"$1K MRR (B+O)" },
  { mo:10, cPaid:19, cRev:329.81,  cEBIT:-82.5,   cCum:-1498.6,  bPaid:64, bRev:1159.36, bEBIT:641.3,   bCum:3002.1,   oPaid:214,   oRev:4527.86,  oEBIT:3540.1,  oCum:17311.8,  milestone:"$1K MRR" },
  { mo:11, cPaid:20, cRev:319.8,   cEBIT:-89.2,   cCum:-1587.8,  bPaid:71, bRev:1309.29, bEBIT:770.6,   bCum:3772.7,   oPaid:252,   oRev:5317.48,  oEBIT:4223.2,  oCum:21535.0,  milestone:"$1K MRR" },
  { mo:12, cPaid:21, cRev:359.79,  cEBIT:-55.8,   cCum:-1643.6,  bPaid:79, bRev:1449.21, bEBIT:893.2,   bCum:4665.9,   oPaid:297,   oRev:6277.03,  oEBIT:5051.5,  oCum:26586.4,  milestone:"$1K MRR · Year 1 end" },
  { mo:13, cPaid:22, cRev:369.78,  cEBIT:-46.7,   cCum:-1690.3,  bPaid:88, bRev:1599.12, bEBIT:1024.9,  bCum:5690.9,   oPaid:350,   oRev:7356.5,   oEBIT:5986.4,  oCum:32572.8,  milestone:"" },
  { mo:14, cPaid:23, cRev:409.77,  cEBIT:-13.3,   cCum:-1703.5,  bPaid:98, bRev:1769.02, bEBIT:1174.2,  bCum:6865.0,   oPaid:413,   oRev:8685.87,  oEBIT:7135.0,  oCum:39707.8,  milestone:"" },
  { mo:15, cPaid:24, cRev:399.76,  cEBIT:-20.0,   cCum:-1723.5,  bPaid:109,bRev:1978.91, bEBIT:1356.8,  bCum:8221.8,   oPaid:487,   oRev:10255.13, oEBIT:8490.4,  oCum:48198.2,  milestone:"" },
  { mo:16, cPaid:25, cRev:409.75,  cEBIT:-10.8,   cCum:-1734.3,  bPaid:122,bRev:2208.78, bEBIT:1557.8,  bCum:9779.6,   oPaid:574,   oRev:12084.26, oEBIT:9496.0,  oCum:57694.1,  milestone:"" },
  { mo:17, cPaid:27, cRev:439.73,  cEBIT:15.9,    cCum:-1718.5,  bPaid:136,bRev:2458.64, bEBIT:1776.2,  bCum:11555.9,  oPaid:677,   oRev:14253.23, oEBIT:11370.2, oCum:69064.3,  milestone:"C break-even!" },
  { mo:18, cPaid:29, cRev:489.71,  cEBIT:58.4,    cCum:-1660.1,  bPaid:152,bRev:2738.48, bEBIT:2021.4,  bCum:13577.2,  oPaid:798,   oRev:16762.02, oEBIT:13540.4, oCum:82604.7,  milestone:"" },
  { mo:24, cPaid:42, cRev:689.58,  cEBIT:235.1,   cCum:-726.1,   bPaid:296,bRev:5337.04, bEBIT:4291.2,  bCum:32965.3,  oPaid:2148,  oRev:45108.52, oEBIT:38039.2, oCum:237990.7, milestone:"⭐ $5K MRR (O) · Year 2 end" },
  { mo:30, cPaid:63, cRev:1049.37, cEBIT:550.3,   cCum:1686.1,   bPaid:580,bRev:10434.2, bEBIT:8170.7,  bCum:71717.4,  oPaid:5796,  oRev:121682.04,oEBIT:100762.5,oCum:662954.0, milestone:"🎯 $10K MRR (O)" },
  { mo:36, cPaid:97, cRev:1559.03, cEBIT:1002.1,  cCum:6468.6,   bPaid:1141,bRev:20548.59,bEBIT:17006.4,bCum:148774.0, oPaid:15643, oRev:328353.57,oEBIT:279386.8,oCum:1807951.8,milestone:"Year 3 end" },
];

// ── Sheet 5: Pricing Sensitivity ────────────────────────────
const S5_STARTER = [
  { price:"$4.99",  api:0.827, gp:4.163, gm:0.834, u371:89,  u946:227, rev100:5988,  vsGGPT:"-67%",vsCan:"-58%",pos:"Undercuts market — good for acquisition" },
  { price:"$6.99",  api:0.827, gp:6.163, gm:0.882, u371:60,  u946:153, rev100:8388,  vsGGPT:"-53%",vsCan:"-42%",pos:"Undercuts market — good for acquisition" },
  { price:"$7.99",  api:0.827, gp:7.163, gm:0.896, u371:52,  u946:132, rev100:9588,  vsGGPT:"-47%",vsCan:"-33%",pos:"Undercuts market — good for acquisition" },
  { price:"$9.99",  api:0.827, gp:9.163, gm:0.917, u371:40,  u946:103, rev100:11988, vsGGPT:"-33%",vsCan:"-17%",pos:"✅ Recommended — matches GPTGirlfriend low tier", rec:true },
  { price:"$12.99", api:0.827, gp:12.163,gm:0.936, u371:31,  u946:78,  rev100:15588, vsGGPT:"-13%",vsCan:"+8%", pos:"Mid-market — solid positioning" },
  { price:"$14.99", api:0.827, gp:14.163,gm:0.945, u371:26,  u946:67,  rev100:17988, vsGGPT:"-0%", vsCan:"+25%",pos:"Premium — smaller audience, higher margin" },
  { price:"$19.99", api:0.827, gp:19.163,gm:0.959, u371:19,  u946:49,  rev100:23988, vsGGPT:"+33%",vsCan:"+67%",pos:"Premium — smaller audience, higher margin" },
];
const S5_PREMIUM = [
  { price:"$9.99",  api:2.481, gp:7.509, gm:0.752, u371:49,  u946:126, rev100:11988, vsGGPT:"-50%",vsCan:"-17%",pos:"Near-starter pricing — consider removing Starter tier" },
  { price:"$12.99", api:2.481, gp:10.509,gm:0.809, u371:35,  u946:90,  rev100:15588, vsGGPT:"-35%",vsCan:"+8%", pos:"Near-starter pricing — consider removing Starter tier" },
  { price:"$14.99", api:2.481, gp:12.509,gm:0.834, u371:30,  u946:76,  rev100:17988, vsGGPT:"-25%",vsCan:"+25%",pos:"Near-starter pricing — consider removing Starter tier" },
  { price:"$19.99", api:2.481, gp:17.509,gm:0.876, u371:21,  u946:54,  rev100:23988, vsGGPT:"—",   vsCan:"+67%",pos:"✅ Recommended", rec:true },
  { price:"$24.99", api:2.481, gp:22.509,gm:0.901, u371:16,  u946:42,  rev100:29988, vsGGPT:"+25%",vsCan:"+108%",pos:"Good — matches GPTGirlfriend Deluxe" },
  { price:"$29.99", api:2.481, gp:27.509,gm:0.917, u371:13,  u946:34,  rev100:35988, vsGGPT:"+50%",vsCan:"+150%",pos:"High-end — Elite-tier positioning needed" },
  { price:"$34.99", api:2.481, gp:32.509,gm:0.929, u371:11,  u946:29,  rev100:41988, vsGGPT:"+75%",vsCan:"+192%",pos:"High-end — Elite-tier positioning needed" },
];

// ── Sheet 6: Annual Summary + Key Takeaways ─────────────────
const S6_ANNUAL = [
  { year:"Year 1", cPaid:21, cRev:3208,    cEBIT:-1644,   cMargin:"-51%", bPaid:79,   bRev:10454,   bEBIT:4666,    bMargin:"45%",  oPaid:297,   oRev:35933,    oEBIT:26586,   oMargin:"74%",  milestone:"First year — build audience, reach break-even" },
  { year:"Year 2", cPaid:42, cRev:6116,    cEBIT:918,     cMargin:"15%",  bPaid:296,  bRev:37499,   bEBIT:28299,   bMargin:"75%",  oPaid:2148,  oRev:255758,   oEBIT:211404,  oMargin:"83%",  milestone:"Product-market fit proven, growing profitably" },
  { year:"Year 3", cPaid:97, cRev:13242,   cEBIT:7195,    cMargin:"54%",  bPaid:1141, bRev:142921,  bEBIT:115809,  bMargin:"81%",  oPaid:15643, oRev:1857645,  oEBIT:1569961, oMargin:"85%",  milestone:"Scale phase — strong margins at all scenarios" },
];
const S6_TAKEAWAYS = [
  { icon:"✅", title:"Break-even is only 25 paid users", body:"At $371/mo infra cost and 50/35/15 tier mix, 25 paying customers covers all your costs. This is achievable in Month 1." },
  { icon:"💸", title:"Free users cost almost nothing",   body:"20 free messages × $0.0021 = $0.04 per free user. At 1,000 free trials, your cost is $42. Don't worry about them." },
  { icon:"🎯", title:"Soulkyn is your benchmark",         body:"Solo developer, similar niche, launched similarly. Now at ~1.1M monthly visits. It took ~12 months. Focus on that trajectory, not Candy.ai's 100M." },
  { icon:"⚠️", title:"Your biggest risk isn't API cost",  body:"It's distribution — how do people find you? Reddit, Discord, AI tool directories (There's An AI For That, Futurepedia), SEO. That's where to focus energy." },
  { icon:"💰", title:"Each Elite user is worth $720 LTV", body:"Assuming 18-month average lifetime. One Elite user signing up pays for 2 months of your entire infrastructure cost." },
  { icon:"🚀", title:"Don't launch with all tiers active",body:"Current SubscriptionTab.tsx has no payment flow. Consider launching with just one paid tier (Starter), get 25 users, prove the model, then add tiers." },
];

const STRAT_TABS = [
  { id:"market",    label:"Market Context",       icon:"🌐" },
  { id:"unit",      label:"Unit Economics",       icon:"🧮" },
  { id:"breakeven", label:"Break-Even Calc",      icon:"⚖️" },
  { id:"forecast",  label:"36-Month Forecast",    icon:"📅" },
  { id:"pricing",   label:"Pricing Sensitivity",  icon:"💲" },
  { id:"summary",   label:"Annual Summary",       icon:"📋" },
];

function StrategyPage() {
  const [tab, setTab] = useState("market");
  const [sensTier, setSensTier] = useState("starter");
  const sensData = sensTier === "starter" ? S5_STARTER : S5_PREMIUM;

  const thRow = (cols) => (
    <tr style={{ background:D.tray, borderBottom:`1px solid ${D.divider}` }}>
      {cols.map(h => (
        <th key={h} style={{ padding:"9px 12px", textAlign:"left", color:D.muted,
          fontWeight:700, fontSize:10, textTransform:"uppercase",
          letterSpacing:"0.06em", whiteSpace:"nowrap" }}>{h}</th>
      ))}
    </tr>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

      {/* sub-tab bar */}
      <div style={{ display:"flex", gap:2, background:D.tray,
        boxShadow:D.trayShadow, borderRadius:10, padding:4, flexWrap:"wrap" }}>
        {STRAT_TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding:"7px 14px", borderRadius:7, border:"none", cursor:"pointer",
            fontSize:12, fontWeight:600, transition:"all .15s", display:"flex", alignItems:"center", gap:5,
            background: tab===t.id ? D.elevated : "transparent",
            color:       tab===t.id ? D.text : D.muted,
            boxShadow:   tab===t.id ? D.btnShadow : "none",
          }}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* ── Tab 1: Market Context ── */}
      {tab === "market" && (
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
          <ShellCard>
            <SlateHeader title="Comparable platforms — full pricing & feature comparison" />
            <div style={{ padding:"16px 20px 20px" }}>
            <p style={{ fontSize:12, color:D.muted, margin:"0 0 14px", lineHeight:1.6 }}>
              Sources: Semrush / Similarweb Jan 2026 + public pricing pages. Paid user counts are modeled estimates (1–3% conversion, industry standard). Pricing verified from official pages where available; third-party sourced otherwise.
            </p>
            <div
              className="force-scrollbar"
              onWheel={e => { e.stopPropagation(); }}
              style={{ paddingBottom:4, overscrollBehaviorX:"contain", touchAction:"pan-x" }}>
              <table style={{ borderCollapse:"collapse", fontSize:12, width:"100%" }}>
                <thead>
                  <tr style={{ background:D.tray, borderBottom:`2px solid ${D.divider}` }}>
                    <th style={{ padding:"8px 14px", textAlign:"left", color:D.muted, fontWeight:700,
                      fontSize:10, textTransform:"uppercase", letterSpacing:"0.06em",
                      border:`1px solid rgba(255,255,255,0.08)`, minWidth:180, position:"sticky", left:0, zIndex:2, background:D.tray }}>
                      Metric
                    </th>
                    {S1_COMPETITORS.map((c,i) => {
                      const dot = { giant:C.red, large:C.orange, mid:C.amber, small:C.green, solo:C.blue, you:"#8b5cf6" }[c.scale];
                      const isYou = c.scale === "you";
                      return (
                        <th key={i} style={{
                          padding:"8px 12px", textAlign:"left",
                          border:`1px solid rgba(255,255,255,0.08)`,
                          background: isYou ? "rgba(139,92,246,0.15)" : D.tray,
                          borderTop: isYou ? "3px solid #8b5cf6" : `1px solid rgba(255,255,255,0.08)`,
                          minWidth:140,
                        }}>
                          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2 }}>
                            <div style={{ width:7, height:7, borderRadius:"50%", background:dot, flexShrink:0 }}/>
                            <span style={{ fontWeight:700, color:D.text, fontSize:12, whiteSpace:"nowrap" }}>{c.name}</span>
                          </div>
                          <div style={{ fontSize:10, color:D.dim }}>{c.visits} visits · Est. {c.paidEst} paid</div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {S1_ROWS.map((row, ri) => {
                    if (row.group) {
                      return (
                        <tr key={`g-${ri}`} style={{ background:D.bg }}>
                          <td style={{
                            padding:"10px 14px 4px",
                            border:`1px solid rgba(255,255,255,0.08)`,
                            fontSize:10, fontWeight:800, color:"#8b5cf6",
                            textTransform:"uppercase", letterSpacing:"0.08em",
                            background:D.bg,
                            position:"sticky", left:0, zIndex:2,
                            whiteSpace:"nowrap",
                          }}>{row.group}</td>
                          {S1_COMPETITORS.map((_,ci) => (
                            <td key={ci} style={{
                              background:D.bg,
                              border:`1px solid rgba(255,255,255,0.08)`,
                              padding:"10px 0 4px",
                            }}/>
                          ))}
                        </tr>
                      );
                    }
                    return (
                      <tr key={`r-${ri}`} style={{
                        borderBottom:`1px solid ${D.divider}`,
                        background: ri%2===0 ? D.shell : "rgba(255,255,255,0.015)",
                      }}>
                        <td style={{
                          padding:"7px 14px",
                          border:`1px solid rgba(255,255,255,0.08)`,
                          background:D.tray,
                          position:"sticky", left:0, zIndex:1,
                        }}>
                          <div style={{ fontWeight:600, color:D.text, fontSize:12, whiteSpace:"nowrap" }}>{row.label}</div>
                          {row.note && <div style={{ fontSize:10, color:D.muted, marginTop:1 }}>{row.note}</div>}
                        </td>
                        {S1_COMPETITORS.map((c,ci) => {
                          const val = c[row.key] ?? "—";
                          const isYou = c.scale === "you";
                          const isCheck = val === "✓";
                          const isCross = val === "✗";
                          return (
                            <td key={ci} style={{
                              padding:"7px 12px",
                              border:`1px solid rgba(255,255,255,0.08)`,
                              background: isYou ? "rgba(139,92,246,0.06)" : "inherit",
                              verticalAlign:"top", lineHeight:1.5,
                              color: isCheck ? D.green : isCross ? D.dim : D.muted,
                              fontWeight: isCheck || isCross ? 700 : 400,
                              fontSize:12,
                            }}>
                              {val}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ display:"flex", gap:14, marginTop:12, flexWrap:"wrap" }}>
              {[{c:C.red,label:"Giant (70M+ visits)"},{c:C.orange,label:"Large"},{c:C.amber,label:"Mid"},{c:C.green,label:"Small"},{c:C.blue,label:"Solo dev"},{c:"#8b5cf6",label:"Chronicle (you)"}].map(l=>(
                <div key={l.label} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:D.muted}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:l.c}}/>
                  {l.label}
                </div>
              ))}
            </div>
          </div>
          </ShellCard>

          <ShellCard>
            <SlateHeader title="Solo developer reality check" />
            <div style={{ padding:"16px 20px 20px" }}>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                <thead>{thRow(["Benchmark","Traffic / Scale","What it means for Chronicle"])}</thead>
                <tbody>
                  {S1_REALITY.map((r, i) => (
                    <tr key={i} style={{ borderBottom:`1px solid ${D.divider}`, background:i%2===0?D.shell:"rgba(255,255,255,0.02)" }}>
                      <td style={{ padding:"11px 12px", fontWeight:700, color:D.text, whiteSpace:"nowrap" }}>{r.comp}</td>
                      <td style={{ padding:"11px 12px", color:D.text, fontWeight:600, whiteSpace:"nowrap" }}>{r.traffic}</td>
                      <td style={{ padding:"11px 12px", color:D.muted, lineHeight:1.5 }}>{r.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          </ShellCard>
        </div>
      )}

      {/* ── Tab 2: Unit Economics ── */}
      {tab === "unit" && (
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
          <ShellCard>
            <SlateHeader title="Cost inputs — verified from xAI pricing, March 2026" />
            <div style={{ padding:"16px 20px 20px" }}>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                <thead>{thRow(["Input","Value","Unit","Notes"])}</thead>
                <tbody>
                  {S2_COST_INPUTS.map((r, i) => (
                    <tr key={i} style={{
                      borderBottom:`1px solid ${D.divider}`,
                      background: r.highlight ? C.greenSoft : i%2===0?D.shell:"rgba(255,255,255,0.02)",
                      borderLeft: r.highlight ? `3px solid ${C.green}` : "3px solid transparent",
                    }}>
                      <td style={{ padding:"10px 12px", fontWeight: r.highlight?700:400, color:D.text }}>{r.label}</td>
                      <td style={{ padding:"10px 12px", fontWeight:700, color:r.highlight?C.green:C.blue, fontSize:14 }}>{r.value}</td>
                      <td style={{ padding:"10px 12px", color:D.muted }}>{r.unit}</td>
                      <td style={{ padding:"10px 12px", color:D.muted, fontSize:12 }}>{r.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          </ShellCard>

          <ShellCard>
            <SlateHeader title="Per-user monthly economics by tier" />
            <div style={{ padding:"16px 20px 20px" }}>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                <thead>{thRow(["Tier","Price/mo","Msg Limit","Img Limit","Msg API Cost","Img API Cost","Total API Cost","Gross Profit","Gross Margin","LTV (18mo avg)","Annual Rev/User"])}</thead>
                <tbody>
                  {S2_PER_USER.map((r, i) => (
                    <tr key={i} style={{ borderBottom:`1px solid ${D.divider}`, background:i%2===0?D.shell:"rgba(255,255,255,0.02)" }}>
                      <td style={{ padding:"10px 12px" }}>{tierBadge(r.tier==="Free Trial"?"Free":r.tier)}</td>
                      <td style={{ padding:"10px 12px", fontWeight:700, color:D.text }}>${r.price}</td>
                      <td style={{ padding:"10px 12px", color:D.muted }}>{r.msgLimit.toLocaleString()}</td>
                      <td style={{ padding:"10px 12px", color:D.muted }}>{r.imgLimit}</td>
                      <td style={{ padding:"10px 12px", color:C.red }}>${r.msgCost.toFixed(3)}</td>
                      <td style={{ padding:"10px 12px", color:C.red }}>${r.imgCost.toFixed(2)}</td>
                      <td style={{ padding:"10px 12px", color:C.red, fontWeight:700 }}>${r.totalApi.toFixed(3)}</td>
                      <td style={{ padding:"10px 12px", fontWeight:700, color:r.grossProfit>0?C.green:C.red }}>
                        {r.grossProfit>0?`$${r.grossProfit.toFixed(2)}`:`($${Math.abs(r.grossProfit).toFixed(3)})`}
                      </td>
                      <td style={{ padding:"10px 12px", color:D.text }}>{r.margin}</td>
                      <td style={{ padding:"10px 12px", color:D.text, fontWeight:700 }}>{r.ltv}</td>
                      <td style={{ padding:"10px 12px", color:D.text, fontWeight:600 }}>{r.annualRev}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ fontSize:11, color:D.muted, marginTop:10, lineHeight:1.6 }}>
              ℹ Free trial users cost <strong style={{color:D.text}}>$0.042 total</strong> per person (20 messages × $0.00209). At 1,000 free trials, total cost is $42. They either convert or churn at 4 cents each.
            </p>
          </div>
          </ShellCard>

          <ShellCard>
            <SlateHeader title="Infrastructure costs — fixed monthly, not per-user" />
            <div style={{ padding:"16px 20px 20px" }}>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {S2_INFRA.map((t, i) => (
                <div key={i} style={{
                  border: t.current ? `1.5px solid ${C.green}` : `1px solid ${C.cardBorder}`,
                  borderRadius:10, padding:"16px 18px",
                  background: t.current ? C.greenSoft : "#fff",
                }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                    <div>
                      <div style={{ fontSize:14, fontWeight:700, color:t.current?C.green:C.text }}>
                        {t.scale}
                        {t.current && <span style={{ marginLeft:8, fontSize:10, background:C.green, color:"#fff", padding:"2px 8px", borderRadius:10, fontWeight:700 }}>You are here</span>}
                      </div>
                      <div style={{ fontSize:11, color:D.muted, marginTop:3 }}>{t.note}</div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:22, fontWeight:800, color:D.text }}>${t.cost.toLocaleString()}</div>
                      <div style={{ fontSize:10, color:D.muted }}>/ month</div>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:10 }}>
                    {[{label:"Starter users to cover",val:t.starterCover,color:"#1e40af"},{label:"Premium users",val:t.premiumCover,color:"#5b21b6"},{label:"Elite users",val:t.eliteCover,color:"#92400e"}].map(s=>(
                      <div key={s.label} style={{ flex:1, background:`${s.color}0c`, border:`1px solid ${s.color}22`, borderRadius:8, padding:"10px", textAlign:"center" }}>
                        <div style={{ fontSize:20, fontWeight:800, color:s.color }}>{s.val}</div>
                        <div style={{ fontSize:10, color:D.muted, marginTop:2, lineHeight:1.3 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          </ShellCard>
        </div>
      )}

      {/* ── Tab 3: Break-Even Calculator ── */}
      {tab === "breakeven" && (() => {
        const chartData = S3_BREAKEVEN.filter(r => r.users <= 500).map(r => ({
          users:   r.users,
          revenue: Math.round(r.totalRev),
          costs:   Math.round(r.apiCost + r.infraCost),
          net:     Math.round(r.ebitda),
        }));

        return (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

            {/* where every number comes from */}
            <ShellCard>
              <SlateHeader title="Where every number comes from" />
              <div style={{ padding:"16px 20px 20px" }}>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:12 }}>

                <div style={{ padding:"14px 16px", background:D.tray, borderRadius:10, borderColor:`rgba(255,255,255,0.08)` }}>
                  <div style={{ fontSize:12, fontWeight:700, color:D.text, marginBottom:8 }}>🤖 AI (API) cost — sourced from xAI pricing</div>
                  <div style={{ fontSize:11, color:D.muted, lineHeight:1.7 }}>
                    Every message costs <strong style={{color:D.text}}>$0.00209</strong> in AI tokens:<br/>
                    &nbsp;• 7,450 input tokens × $0.20/M = $0.00149<br/>
                    &nbsp;• 500 output tokens × $0.50/M = $0.00025<br/>
                    &nbsp;• Character extraction every 5th msg = $0.00035<br/>
                    Images cost <strong style={{color:D.text}}>$0.02 each</strong> (grok-imagine-image).<br/><br/>
                    So per subscriber per month:<br/>
                    &nbsp;• Starter (300 msgs + 10 imgs): <strong style={{color:C.red}}>$0.83</strong><br/>
                    &nbsp;• Premium (900 msgs + 30 imgs): <strong style={{color:C.red}}>$2.48</strong><br/>
                    &nbsp;• Elite (2,200 msgs + 100 imgs): <strong style={{color:C.red}}>$6.60</strong>
                  </div>
                </div>

                <div style={{ padding:"14px 16px", background:D.tray, borderRadius:10, borderColor:`rgba(255,255,255,0.08)` }}>
                  <div style={{ fontSize:12, fontWeight:700, color:D.text, marginBottom:8 }}>🖥️ Hosting cost — sourced from Supabase pricing</div>
                  <div style={{ fontSize:11, color:D.muted, lineHeight:1.7 }}>
                    <strong style={{color:D.text}}>$371/mo fixed</strong> at launch scale (0–499 users).<br/>
                    This covers Supabase free tier + basic server hosting.<br/>
                    It doesn't change whether you have 1 or 499 users.<br/><br/>
                    It jumps when you scale:<br/>
                    &nbsp;• 500–4,999 users → <strong style={{color:D.text}}>$946/mo</strong> (Supabase Pro)<br/>
                    &nbsp;• 5K–49,999 users → <strong style={{color:D.text}}>$4,404/mo</strong> (Supabase Team + CDN)
                  </div>
                </div>

                <div style={{ padding:"14px 16px", background:D.tray, borderRadius:10, borderColor:`rgba(255,255,255,0.08)` }}>
                  <div style={{ fontSize:12, fontWeight:700, color:D.text, marginBottom:8 }}>👥 Tier split — 50% Starter / 35% Premium / 15% Elite</div>
                  <div style={{ fontSize:11, color:D.muted, lineHeight:1.7 }}>
                    This is the assumed mix across your total subscribers. So for 25 users:<br/>
                    &nbsp;• 12 on Starter (floor of 50%)<br/>
                    &nbsp;• 8 on Premium (floor of 35%)<br/>
                    &nbsp;• 5 on Elite (the remainder)<br/><br/>
                    The remainder goes to Elite — so at small numbers, Elite can have slightly more users than the percentage implies. That's why the numbers may look slightly off at 5–10 users.
                  </div>
                </div>

              </div>
            </div>
          </ShellCard>

            {/* chart */}
            <ShellCard>
              <SlateHeader title="Revenue vs costs — monthly snapshot by subscriber count" />
              <div style={{ padding:"16px 20px 20px" }}>
              <p style={{ fontSize:12, color:D.muted, margin:"0 0 14px", lineHeight:1.6 }}>
                Each point = a hypothetical <em>right now</em> snapshot, not over time. Green line is your net income. The green and red lines cross at ~25 subscribers — that's break-even.
              </p>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={chartData} margin={{ top:4, right:20, left:0, bottom:16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={D.divider}/>
                  <XAxis dataKey="users" tick={{ fill:D.muted, fontSize:11 }} axisLine={false} tickLine={false}
                    label={{ value:"Total subscribers", position:"insideBottom", offset:-8, fill:D.muted, fontSize:11 }}/>
                  <YAxis tick={{ fill:D.muted, fontSize:11 }} axisLine={false} tickLine={false} width={58}
                    tickFormatter={v => v >= 1000 ? `$${(v/1000).toFixed(0)}k` : `$${v}`}/>
                  <Tooltip
                    contentStyle={{ background:D.shell, borderColor:`rgba(255,255,255,0.08)`, borderRadius:8, fontSize:12 }}
                    formatter={(v, name) => [`$${v.toLocaleString()}`, name]}
                    labelFormatter={v => `${v} total subscribers`}
                  />
                  <ReferenceLine y={0} stroke={D.divider} strokeWidth={1}/>
                  <ReferenceLine x={25} stroke={D.green} strokeDasharray="5 3"
                    label={{ value:"Break-even", position:"insideTopRight", fill:D.green, fontSize:10, fontWeight:700 }}/>
                  <Line dataKey="revenue" name="Monthly revenue"      stroke={D.green}  strokeWidth={2.5} dot={false} type="monotone"/>
                  <Line dataKey="costs"   name="Monthly costs (API + hosting)" stroke={D.red} strokeWidth={2.5} dot={false} type="monotone"/>
                  <Line dataKey="net"     name="Net income"           stroke={"#60a5fa"}   strokeWidth={2} dot={false} type="monotone" strokeDasharray="5 3"/>
                </LineChart>
              </ResponsiveContainer>
              <div style={{ display:"flex", gap:20, marginTop:8, flexWrap:"wrap" }}>
                {[{c:C.green,l:"Monthly revenue"},{c:C.red,l:"Monthly costs (AI + hosting)"},{c:C.blue,l:"Net income (dashed)"}].map(l=>(
                  <div key={l.l} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:D.muted}}>
                    <div style={{width:14,height:3,background:l.c,borderRadius:2}}/>{l.l}
                  </div>
                ))}
              </div>
            </div>
          </ShellCard>

            {/* table */}
            <ShellCard>
              <SlateHeader title="Full monthly breakdown by subscriber count" />
              <div style={{ padding:"16px 20px 20px" }}>
              <p style={{ fontSize:12, color:D.muted, margin:"0 0 14px", lineHeight:1.6 }}>
                Each tier cell shows <strong>user count × price = revenue</strong> so you can see exactly where the money comes from. All figures are monthly.
              </p>
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                  <thead>
                    <tr style={{ background:D.tray, borderBottom:`2px solid ${D.divider}` }}>
                      <th style={{ padding:"9px 12px", textAlign:"left", color:D.muted, fontWeight:600, fontSize:10, textTransform:"uppercase", letterSpacing:"0.04em" }}>Total Subscribers</th>
                      <th style={{ padding:"9px 10px", textAlign:"center", color:"#1e40af", fontWeight:700, fontSize:10, textTransform:"uppercase" }}>Starter<br/><span style={{fontWeight:400,color:D.muted,fontSize:9}}>$9.99/user</span></th>
                      <th style={{ padding:"9px 10px", textAlign:"center", color:"#5b21b6", fontWeight:700, fontSize:10, textTransform:"uppercase" }}>Premium<br/><span style={{fontWeight:400,color:D.muted,fontSize:9}}>$19.99/user</span></th>
                      <th style={{ padding:"9px 10px", textAlign:"center", color:"#92400e", fontWeight:700, fontSize:10, textTransform:"uppercase" }}>Elite<br/><span style={{fontWeight:400,color:D.muted,fontSize:9}}>$39.99/user</span></th>
                      <th style={{ padding:"9px 12px", textAlign:"right", color:C.green, fontWeight:700, fontSize:10, textTransform:"uppercase" }}>Total Revenue</th>
                      <th style={{ padding:"9px 12px", textAlign:"right", color:C.red, fontWeight:600, fontSize:10, textTransform:"uppercase" }}>AI Cost<br/><span style={{fontWeight:400,fontSize:9}}>(xAI API)</span></th>
                      <th style={{ padding:"9px 12px", textAlign:"right", color:D.muted, fontWeight:600, fontSize:10, textTransform:"uppercase" }}>Hosting<br/><span style={{fontWeight:400,fontSize:9}}>(Supabase)</span></th>
                      <th style={{ padding:"9px 12px", textAlign:"right", color:D.text, fontWeight:800, fontSize:10, textTransform:"uppercase" }}>Net Income</th>
                    </tr>
                  </thead>
                  <tbody>
                    {S3_BREAKEVEN.map((r, i) => {
                      const isProfit = r.ebitda > 0;
                      const isNear   = r.status.includes("Near");
                      const bg = isProfit && i <= 2 ? C.greenSoft : isNear ? C.amberSoft : i%2===0?D.shell:"rgba(255,255,255,0.02)";
                      const bl = isProfit ? `3px solid ${C.green}` : isNear ? `3px solid ${C.amber}` : "3px solid transparent";
                      // Correct rounding: floor for S and P, remainder to E
                      const nS = Math.floor(r.users * 0.50);
                      const nP = Math.floor(r.users * 0.35);
                      const nE = r.users - nS - nP;
                      return (
                        <tr key={i} style={{ borderBottom:`1px solid ${D.divider}`, background:bg, borderLeft:bl }}>
                          <td style={{ padding:"9px 12px", fontWeight:800, color:D.text, fontSize:14 }}>
                            {r.users.toLocaleString()}
                            {r.users === 25 && <span style={{ marginLeft:8, fontSize:10, background:C.green, color:"#fff", padding:"1px 7px", borderRadius:10, fontWeight:700 }}>break-even</span>}
                          </td>
                          <td style={{ padding:"9px 10px", textAlign:"center" }}>
                            <div style={{ fontSize:12, fontWeight:700, color:"#1e40af" }}>{nS} users</div>
                            <div style={{ fontSize:10, color:D.muted }}>{nS} × $9.99 = ${r.starterRev.toFixed(0)}</div>
                          </td>
                          <td style={{ padding:"9px 10px", textAlign:"center" }}>
                            <div style={{ fontSize:12, fontWeight:700, color:"#5b21b6" }}>{nP} users</div>
                            <div style={{ fontSize:10, color:D.muted }}>{nP} × $19.99 = ${r.premiumRev.toFixed(0)}</div>
                          </td>
                          <td style={{ padding:"9px 10px", textAlign:"center" }}>
                            <div style={{ fontSize:12, fontWeight:700, color:"#92400e" }}>{nE} users</div>
                            <div style={{ fontSize:10, color:D.muted }}>{nE} × $39.99 = ${r.eliteRev.toFixed(0)}</div>
                          </td>
                          <td style={{ padding:"9px 12px", textAlign:"right", fontWeight:700, color:C.green, fontSize:13 }}>
                            ${r.totalRev >= 1000 ? `${(r.totalRev/1000).toFixed(1)}k` : r.totalRev.toFixed(0)}
                          </td>
                          <td style={{ padding:"9px 12px", textAlign:"right", color:C.red }}>
                            −${r.apiCost.toFixed(0)}
                          </td>
                          <td style={{ padding:"9px 12px", textAlign:"right", color:D.muted }}>
                            −$371
                          </td>
                          <td style={{ padding:"9px 12px", textAlign:"right", fontWeight:800, fontSize:14,
                            color: isProfit ? C.green : isNear ? C.amber : C.red }}>
                            {isProfit ? "+" : ""}{r.ebitda >= 1000 ? `$${(r.ebitda/1000).toFixed(1)}k` : `$${r.ebitda.toFixed(0)}`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop:14, background:"rgba(34,197,94,0.10)", border:`1px solid rgba(34,197,94,0.25)`,
                borderRadius:10, padding:"14px 18px", fontSize:13, color:D.text, lineHeight:1.7 }}>
                ⭐ <strong>Bottom line:</strong> At 25 subscribers (12 Starter + 8 Premium + 5 Elite), monthly revenue is ~$480 vs costs of $371 hosting + $63 API = $434. Net income: <strong style={{color:C.green}}>+$46/mo</strong>. Every subscriber after that adds 80–92 cents of profit per dollar depending on tier.
              </div>
            </div>
          </ShellCard>
          </div>
        );
      })()}

      {/* ── Tab 4: 36-Month Forecast ── */}
      {tab === "forecast" && (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <ShellCard>
            <SlateHeader title="Scenario assumptions" />
            <div style={{ padding:"16px 20px 20px" }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
              {S4_SCENARIOS.map((s, i) => {
                const color = [C.conservative, C.base, C.optimistic][i];
                const soft  = [C.bg, C.blueSoft, C.greenSoft][i];
                return (
                  <div key={i} style={{ background:"rgba(255,255,255,0.04)", border:`1.5px solid ${color}44`, borderRadius:10, padding:"14px 16px" }}>
                    <div style={{ fontSize:13, fontWeight:700, color, marginBottom:8 }}>{s.scenario}</div>
                    <div style={{ fontSize:12, color:D.muted, lineHeight:1.5, marginBottom:10 }}>{s.desc}</div>
                    <div style={{ display:"flex", flexDirection:"column", gap:4, fontSize:12 }}>
                      {[
                        ["Month 1 paid users", s.m1],
                        ["Monthly growth rate", `${(s.growth*100).toFixed(0)}%`],
                        ["Tier mix (S/P/E)", `${s.starterPct*100}/${s.premiumPct*100}/${s.elitePct*100}%`],
                      ].map(([l,v]) => (
                        <div key={l} style={{ display:"flex", justifyContent:"space-between" }}>
                          <span style={{ color:D.muted }}>{l}</span>
                          <span style={{ fontWeight:700, color }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          </ShellCard>

          <ShellCard>
            <SlateHeader title="36-month forecast — paid users, revenue, EBITDA (selected months)" />
            <div style={{ padding:"16px 20px 20px" }}>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11 }}>
                <thead>
                  <tr style={{ background:D.tray, borderBottom:`1px solid ${D.divider}` }}>
                    <th style={{ padding:"8px 10px", color:D.muted, fontWeight:600, fontSize:10, textTransform:"uppercase", letterSpacing:"0.04em" }}>Mo</th>
                    {[["Conservative",C.conservative],["",""],["",""],["Base",C.base],["",""],["",""],["Optimistic",C.optimistic],["",""],["",""],["Milestone",""]].map(([l,col],i)=>(
                      <th key={i} style={{ padding:"8px 8px", color:col||C.muted, fontWeight:700, fontSize:10, textTransform:"uppercase", letterSpacing:"0.04em", textAlign:"right" }}>{l||["Paid","Rev","EBITDA","Paid","Rev","EBITDA","Paid","Rev","EBITDA",""][i-1]||["Paid","Rev","EBITDA"][i%3]}</th>
                    ))}
                  </tr>
                  <tr style={{ borderBottom:`2px solid ${D.divider}` }}>
                    <th style={{ padding:"6px 10px", color:D.muted, fontSize:9 }}></th>
                    {["Paid","Rev","EBITDA (cum)","Paid","Rev","EBITDA (cum)","Paid","Rev","EBITDA (cum)","Milestone"].map((h,i)=>(
                      <th key={i} style={{ padding:"6px 8px", color:D.muted, fontWeight:600, fontSize:9, textTransform:"uppercase", textAlign:"right" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {S4_FORECAST.map((r, i) => {
                    const hasMilestone = r.milestone;
                    return (
                      <tr key={i} style={{
                        borderBottom:`1px solid ${D.divider}`,
                        background: hasMilestone ? "#fffdf0" : i%2===0?D.shell:"rgba(255,255,255,0.02)",
                      }}>
                        <td style={{ padding:"9px 10px", fontWeight:700, color:D.text }}>M{r.mo}</td>
                        <td style={{ padding:"9px 8px", textAlign:"right", color:D.muted }}>{r.cPaid}</td>
                        <td style={{ padding:"9px 8px", textAlign:"right", color:D.muted }}>${r.cRev.toFixed(0)}</td>
                        <td style={{ padding:"9px 8px", textAlign:"right", fontWeight:600, color:r.cCum>=0?C.green:C.red }}>
                          {r.cCum>=0?"+":""}{r.cCum>=1000?`$${(r.cCum/1000).toFixed(1)}k`:`$${r.cCum.toFixed(0)}`}
                        </td>
                        <td style={{ padding:"9px 8px", textAlign:"right", color:D.muted }}>{r.bPaid}</td>
                        <td style={{ padding:"9px 8px", textAlign:"right", color:D.muted }}>${r.bRev.toFixed(0)}</td>
                        <td style={{ padding:"9px 8px", textAlign:"right", fontWeight:600, color:r.bCum>=0?C.green:C.red }}>
                          {r.bCum>=0?"+":""}{r.bCum>=1000?`$${(r.bCum/1000).toFixed(1)}k`:`$${r.bCum.toFixed(0)}`}
                        </td>
                        <td style={{ padding:"9px 8px", textAlign:"right", color:D.muted }}>{r.oPaid.toLocaleString()}</td>
                        <td style={{ padding:"9px 8px", textAlign:"right", color:D.muted }}>{r.oRev>=1000?`$${(r.oRev/1000).toFixed(1)}k`:`$${r.oRev.toFixed(0)}`}</td>
                        <td style={{ padding:"9px 8px", textAlign:"right", fontWeight:600, color:C.green }}>
                          +{r.oCum>=1000000?`$${(r.oCum/1000000).toFixed(2)}M`:r.oCum>=1000?`$${(r.oCum/1000).toFixed(1)}k`:`$${r.oCum.toFixed(0)}`}
                        </td>
                        <td style={{ padding:"9px 10px", fontSize:11, color:C.amber, fontWeight:600, maxWidth:180 }}>{r.milestone}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p style={{ fontSize:11, color:D.muted, marginTop:10 }}>Showing selected months — M1–M12 fully, then M17, M18, M24, M30, M36 for milestones. Full 36-month month-by-month detail is in the Finance tab.</p>
          </div>
          </ShellCard>
        </div>
      )}

      {/* ── Tab 5: Pricing Sensitivity ── */}
      {tab === "pricing" && (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <ShellCard>
            <SlateHeader title="Pricing sensitivity analysis" />
            <div style={{ padding:"16px 20px 20px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12, marginBottom:14 }}>
              <div>
                <p style={{ fontSize:12, color:D.muted, margin:0, lineHeight:1.5 }}>
                  {sensTier==="starter"
                    ? "Starter tier: 300 msgs + 10 imgs, API cost = $0.827/mo fixed"
                    : "Premium tier: 900 msgs + 30 imgs, API cost = $2.481/mo fixed"}
                </p>
              </div>
              <Toggle options={[{label:"Starter",value:"starter"},{label:"Premium",value:"premium"}]} value={sensTier} onChange={setSensTier}/>
            </div>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                <thead>{thRow(["Price/mo","API Cost","Gross Profit","Gross Margin","Users → $371 infra","Users → $946 infra","Annual Rev (100 users)","vs GPTGirlfriend ($15)","vs Candy.ai ($12)","Positioning"])}</thead>
                <tbody>
                  {sensData.map((r, i) => (
                    <tr key={i} style={{
                      borderBottom:`1px solid ${D.divider}`,
                      background: r.rec ? C.greenSoft : i%2===0?D.shell:"rgba(255,255,255,0.02)",
                      borderLeft: r.rec ? `3px solid ${C.green}` : "3px solid transparent",
                    }}>
                      <td style={{ padding:"10px 12px", fontWeight:800, color:r.rec?C.green:C.text, fontSize:13 }}>{r.price}</td>
                      <td style={{ padding:"10px 12px", color:C.red }}>${r.api}</td>
                      <td style={{ padding:"10px 12px", color:C.green, fontWeight:700 }}>${r.gp.toFixed(2)}</td>
                      <td style={{ padding:"10px 12px", color:D.text }}>{(r.gm*100).toFixed(1)}%</td>
                      <td style={{ padding:"10px 12px" }}>
                        <span style={{ fontWeight:700, color:r.u371<=25?C.green:r.u371<=50?C.amber:C.red }}>{r.u371} users</span>
                      </td>
                      <td style={{ padding:"10px 12px", color:D.muted }}>{r.u946} users</td>
                      <td style={{ padding:"10px 12px", color:D.text, fontWeight:600 }}>${r.rev100.toLocaleString()}</td>
                      <td style={{ padding:"10px 12px", color: r.vsGGPT.startsWith("-")?C.green:C.red, fontWeight:600 }}>{r.vsGGPT}</td>
                      <td style={{ padding:"10px 12px", color: r.vsCan.startsWith("-")?C.green:C.red, fontWeight:600 }}>{r.vsCan}</td>
                      <td style={{ padding:"10px 12px", color:r.rec?C.green:C.muted, fontSize:11, lineHeight:1.4, maxWidth:200 }}>{r.pos}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display:"flex", gap:16, marginTop:12, flexWrap:"wrap" }}>
              {[{c:C.green,l:"≤25 users to cover infra"},{c:C.amber,l:"26–50 users"},{c:C.red,l:">50 users"}].map(l=>(
                <div key={l.l} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:D.muted}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:l.c}}/>{l.l}
                </div>
              ))}
            </div>
          </div>
          </ShellCard>
        </div>
      )}

      {/* ── Tab 6: Annual Summary ── */}
      {tab === "summary" && (
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
          <ShellCard>
            <SlateHeader title="Year-by-year summary — all 3 scenarios" />
            <div style={{ padding:"16px 20px 20px" }}>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                <thead>
                  <tr style={{ background:D.tray, borderBottom:`1px solid ${D.divider}` }}>
                    <th style={{ padding:"9px 12px", color:D.muted, fontWeight:600, fontSize:10, textTransform:"uppercase", letterSpacing:"0.04em" }}>Year</th>
                    {[["Conservative",C.conservative,"Paid (EOY)","Revenue","EBITDA","Margin"],
                      ["Base",C.base,"Paid (EOY)","Revenue","EBITDA","Margin"],
                      ["Optimistic",C.optimistic,"Paid (EOY)","Revenue","EBITDA","Margin"]].map(([label,color,...cols],gi)=>(
                      <React.Fragment key={gi}>
                        <th colSpan={4} style={{ padding:"9px 12px", color, fontWeight:700, fontSize:11,
                          textTransform:"uppercase", textAlign:"center",
                          borderLeft:`2px solid ${color}44` }}>{label}</th>
                      </React.Fragment>
                    ))}
                    <th style={{ padding:"9px 12px", color:D.muted, fontWeight:600, fontSize:10, textTransform:"uppercase", letterSpacing:"0.04em" }}>Key Milestone</th>
                  </tr>
                  <tr style={{ borderBottom:`2px solid ${D.divider}` }}>
                    <th style={{ padding:"6px 12px", color:D.muted, fontSize:9 }}></th>
                    {["Paid (EOY)","Revenue","EBITDA","Margin","Paid (EOY)","Revenue","EBITDA","Margin","Paid (EOY)","Revenue","EBITDA","Margin"].map((h,i)=>(
                      <th key={i} style={{ padding:"6px 8px", color:D.muted, fontWeight:600, fontSize:9, textTransform:"uppercase", textAlign:"right",
                        borderLeft: i===0||i===4||i===8?`2px solid ${[C.conservative,C.base,C.optimistic][Math.floor(i/4)]}44`:"none" }}>{h}</th>
                    ))}
                    <th style={{ padding:"6px 12px", color:D.muted, fontSize:9 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {S6_ANNUAL.map((r, i) => (
                    <tr key={i} style={{ borderBottom:`1px solid ${D.divider}`, background:i%2===0?D.shell:"rgba(255,255,255,0.02)" }}>
                      <td style={{ padding:"12px 12px", fontWeight:800, color:D.text, fontSize:14 }}>{r.year}</td>
                      <td style={{ padding:"12px 8px", textAlign:"right", color:D.muted, borderLeft:`2px solid ${C.conservative}22` }}>{r.cPaid}</td>
                      <td style={{ padding:"12px 8px", textAlign:"right", color:D.text, fontWeight:600 }}>${r.cRev.toLocaleString()}</td>
                      <td style={{ padding:"12px 8px", textAlign:"right", fontWeight:700, color:r.cEBIT>=0?C.green:C.red }}>
                        {r.cEBIT>=0?"+":""}{r.cEBIT>=0?`$${r.cEBIT.toLocaleString()}`:`($${Math.abs(r.cEBIT).toLocaleString()})`}
                      </td>
                      <td style={{ padding:"12px 8px", textAlign:"right", color:r.cEBIT>=0?C.green:C.red }}>{r.cMargin}</td>
                      <td style={{ padding:"12px 8px", textAlign:"right", color:D.muted, borderLeft:`2px solid ${C.base}22` }}>{r.bPaid}</td>
                      <td style={{ padding:"12px 8px", textAlign:"right", color:D.text, fontWeight:600 }}>${r.bRev.toLocaleString()}</td>
                      <td style={{ padding:"12px 8px", textAlign:"right", fontWeight:700, color:C.green }}>${r.bEBIT.toLocaleString()}</td>
                      <td style={{ padding:"12px 8px", textAlign:"right", color:C.green }}>{r.bMargin}</td>
                      <td style={{ padding:"12px 8px", textAlign:"right", color:D.muted, borderLeft:`2px solid ${C.optimistic}22` }}>{r.oPaid.toLocaleString()}</td>
                      <td style={{ padding:"12px 8px", textAlign:"right", color:D.text, fontWeight:600 }}>
                        {r.oRev>=1000000?`$${(r.oRev/1000000).toFixed(2)}M`:`$${r.oRev.toLocaleString()}`}
                      </td>
                      <td style={{ padding:"12px 8px", textAlign:"right", fontWeight:700, color:C.green }}>
                        {r.oEBIT>=1000000?`$${(r.oEBIT/1000000).toFixed(2)}M`:`$${r.oEBIT.toLocaleString()}`}
                      </td>
                      <td style={{ padding:"12px 8px", textAlign:"right", color:C.green }}>{r.oMargin}</td>
                      <td style={{ padding:"12px 12px", color:C.amber, fontSize:12, fontWeight:600, maxWidth:220, lineHeight:1.4 }}>{r.milestone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          </ShellCard>

          <ShellCard>
            <SlateHeader title="Key takeaways for a solo developer" />
            <div style={{ padding:"16px 20px 20px" }}>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {S6_TAKEAWAYS.map((t, i) => (
                <div key={i} style={{
                  display:"flex", gap:14, padding:"14px 16px",
                  background: i===5 ? C.amberSoft : C.bg,
                  border: `1px solid ${i===5 ? C.amber+"44" : C.cardBorder}`,
                  borderRadius:10, alignItems:"flex-start",
                }}>
                  <span style={{ fontSize:22, flexShrink:0 }}>{t.icon}</span>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:D.text, marginBottom:4 }}>{t.title}</div>
                    <div style={{ fontSize:12, color:D.muted, lineHeight:1.6 }}>{t.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          </ShellCard>
        </div>
      )}

    </div>
  );
}

// ── Revenue Calculator page wrapper ──────────────────────────
function RevenueCalcPage() {
  const API_COST  = { starter: 0.827, premium: 2.481, elite: 6.598 };
  const stripeFee = (price) => price * 0.029 + 0.30;
  return <CalcTab API_COST={API_COST} stripeFee={stripeFee} />;
}

// Pulled out so it can hold its own useState cleanly
function CalcTab({ API_COST, stripeFee }) {
  const [users, setUsers]   = useState({ starter:10, premium:5, elite:2 });
  const [prices, setPrices] = useState({ starter:9.99, premium:19.99, elite:39.99 });
  const HOSTING = 371;

  const tiers = [
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

  const numInput = (val, onChange, { step=1, min=0, prefix="" }={}) => (
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

  const fmt  = (n) => n < 0 ? `-$${Math.abs(n).toFixed(2)}` : `+$${n.toFixed(2)}`;
  const fmtK = (n) => {
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
                  {numInput(t.n, v => setUsers(u => ({...u,[t.id]:Math.round(v)})), { step:1, min:0 })}
                </div>

                {/* price */}
                <div>
                  <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase",
                    letterSpacing:"0.06em", color:D.muted, marginBottom:6 }}>Price / month</div>
                  {numInput(t.price, v => setPrices(p => ({...p,[t.id]:v})), { step:0.50, min:0, prefix:"$" })}
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
function DocumentsPage() {
  const STORAGE_KEY = "chronicle_admin_docs_v2";

  const loadDocs = () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
    catch { return []; }
  };

  const [docs,        setDocs]        = useState(loadDocs);
  const [showUpload,  setShowUpload]  = useState(false);
  const [dragging,    setDragging]    = useState(false);
  const [staged,      setStaged]      = useState(null); // file ready to save
  const [category,    setCategory]    = useState("");
  const [note,        setNote]        = useState("");
  const [preview,     setPreview]     = useState(null);

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" });
  const timeStr = now.toLocaleTimeString("en-US", { hour:"2-digit", minute:"2-digit" });

  const persist = (updated) => { setDocs(updated); localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); };

  const stageFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => setStaged({ name:file.name, type:file.type, size:file.size, data:e.target.result });
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) stageFile(file);
  };

  const handleSave = () => {
    if (!staged) return;
    const doc = {
      id:       Date.now(),
      name:     staged.name,
      type:     staged.type,
      size:     staged.size,
      data:     staged.data,
      category: category.trim() || "Uncategorized",
      note:     note.trim(),
      uploaded: `${dateStr} ${timeStr}`,
    };
    persist([doc, ...docs]);
    setShowUpload(false); setStaged(null); setCategory(""); setNote("");
  };

  const deleteDoc = (id) => persist(docs.filter(d => d.id !== id));

  const fmtSize = (b) => b < 1024*1024 ? `${(b/1024).toFixed(1)} KB` : `${(b/1024/1024).toFixed(1)} MB`;

  const FILE_COLOR = (type) => {
    if (type?.includes("pdf"))   return { label:"PDF", color:"#dc2626" };
    if (type?.includes("word") || type?.includes("docx")) return { label:"DOC", color:"#2563eb" };
    if (type?.includes("sheet") || type?.includes("xlsx")) return { label:"XLS", color:"#059669" };
    if (type?.includes("text") || type?.includes("markdown")) return { label:"TXT", color:"#7c3aed" };
    if (type?.includes("image")) return { label:"IMG", color:"#d97706" };
    return { label:"FILE", color:"#374151" };
  };

  const canPreview = (type) => type?.includes("pdf") || type?.includes("image") || type?.includes("text");

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

      {/* upload modal */}
      {showUpload && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:1000,
          display:"flex", alignItems:"center", justifyContent:"center", padding:24,
        }} onClick={() => { setShowUpload(false); setStaged(null); setCategory(""); setNote(""); }}>
          <div onClick={e => e.stopPropagation()}
            style={{ width:"100%", maxWidth:520, borderRadius:24, overflow:"hidden",
              display:"flex", flexDirection:"column",
              background:D.shell, boxShadow:D.shellShadow }}>
            <SlateHeader title="Upload Document"
              right={<span style={{ fontSize:12, color:"rgba(255,255,255,0.6)" }}>{dateStr} · {timeStr}</span>}
            />
            <div style={{ padding:"20px 24px", display:"flex", flexDirection:"column", gap:16 }}>
              {/* drop zone */}
              <label
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                style={{
                  display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
                  gap:8, padding: staged ? "16px" : "32px 24px", borderRadius:12, cursor:"pointer",
                  border:`2px dashed ${dragging ? D.blue : staged ? D.green : "rgba(255,255,255,0.15)"}`,
                  background: dragging ? D.blueActive : staged ? D.greenDim : D.tray,
                  transition:"all .15s",
                }}>
                {staged ? (
                  <>
                    <div style={{ fontSize:22 }}>✅</div>
                    <div style={{ fontSize:13, fontWeight:700, color:D.text }}>{staged.name}</div>
                    <div style={{ fontSize:11, color:D.muted }}>{fmtSize(staged.size)}</div>
                    <div style={{ fontSize:11, color:D.muted, marginTop:2 }}>Click to replace file</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize:28 }}>📄</div>
                    <div style={{ fontSize:13, fontWeight:600, color:D.text }}>Drop a file here or click to browse</div>
                    <div style={{ fontSize:11, color:D.muted }}>PDF, DOCX, XLSX, TXT, images, etc.</div>
                  </>
                )}
                <input type="file" onChange={e => { if (e.target.files[0]) stageFile(e.target.files[0]); }}
                  style={{ display:"none" }}/>
              </label>
              {/* category */}
              <div>
                <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase",
                  letterSpacing:"0.06em", color:D.muted, marginBottom:6 }}>Category</div>
                <input value={category} onChange={e => setCategory(e.target.value)}
                  placeholder="e.g. Financial, Strategy, Technical, Legal…"
                  style={{ width:"100%", boxSizing:"border-box", padding:"8px 12px", borderRadius:8,
                    border:"none", borderTop:"1px solid rgba(0,0,0,0.35)",
                    fontSize:13, color:D.text, background:D.recessed, outline:"none" }}/>
              </div>
              {/* notes */}
              <div>
                <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase",
                  letterSpacing:"0.06em", color:D.muted, marginBottom:6 }}>Notes</div>
                <textarea value={note} onChange={e => setNote(e.target.value)}
                  placeholder="What is this document about? Where did it come from?"
                  rows={3} style={{ width:"100%", boxSizing:"border-box", padding:"8px 12px",
                    borderRadius:8, border:"none", borderTop:"1px solid rgba(0,0,0,0.35)",
                    fontSize:13, color:D.text, background:D.recessed,
                    outline:"none", resize:"vertical", lineHeight:1.5 }}/>
              </div>
              {/* buttons */}
              <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
                <button onClick={() => { setShowUpload(false); setStaged(null); setCategory(""); setNote(""); }}
                  style={{ padding:"8px 18px", borderRadius:8, border:"none",
                    background:D.tray, color:D.muted, fontSize:13, fontWeight:600, cursor:"pointer" }}>
                  Cancel
                </button>
                <button onClick={handleSave} disabled={!staged}
                  style={{ padding:"8px 20px", borderRadius:8, border:"none",
                    cursor: staged ? "pointer" : "default",
                    background: staged ? D.blue : D.dim,
                    boxShadow: staged ? D.blueGlow : "none",
                    color:"#fff", fontSize:13, fontWeight:700 }}>
                  Save Document
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* preview modal */}
      {preview && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:1000,
          display:"flex", alignItems:"center", justifyContent:"center", padding:24,
        }} onClick={() => setPreview(null)}>
          <div style={{ width:"100%", maxWidth:900, maxHeight:"90vh",
            display:"flex", flexDirection:"column", borderRadius:24, overflow:"hidden",
            background:D.shell, boxShadow:D.shellShadow,
          }} onClick={e => e.stopPropagation()}>
            <SlateHeader title={preview.name}
              right={
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <span style={{ fontSize:11, color:"rgba(255,255,255,0.55)" }}>{preview.uploaded} · {fmtSize(preview.size)}</span>
                  <a href={preview.data} download={preview.name} style={{
                    padding:"4px 14px", borderRadius:8, border:"none",
                    background:D.elevated, boxShadow:D.btnShadow,
                    color:D.text, fontSize:11, fontWeight:700,
                    textDecoration:"none", display:"inline-block",
                  }}>Download</a>
                  <button onClick={() => setPreview(null)} style={{
                    width:26, height:26, borderRadius:"50%", border:"none",
                    background:D.elevated, color:D.muted, cursor:"pointer", fontSize:15,
                    display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700,
                  }}>×</button>
                </div>
              }
            />
            <div style={{ flex:1, overflow:"auto", background:D.tray }}>
              {preview.type?.includes("pdf") ? (
                <iframe src={preview.data} style={{ width:"100%", height:"75vh", border:"none" }} title={preview.name}/>
              ) : preview.type?.includes("image") ? (
                <div style={{ padding:24, textAlign:"center" }}>
                  <img src={preview.data} alt={preview.name} style={{ maxWidth:"100%", maxHeight:"70vh", borderRadius:8 }}/>
                </div>
              ) : (
                <pre style={{ padding:24, fontSize:12, lineHeight:1.7, color:D.text,
                  whiteSpace:"pre-wrap", wordBreak:"break-word", margin:0, fontFamily:"monospace" }}>
                  {atob(preview.data.split(",")[1])}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}

      {/* toolbar */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ fontSize:13, color:D.muted }}>
          {docs.length} document{docs.length !== 1 ? "s" : ""} stored
        </div>
        <button onClick={() => setShowUpload(true)} style={{
          padding:"8px 20px", borderRadius:10, border:"none", cursor:"pointer",
          background:D.elevated, boxShadow:D.btnShadow,
          color:D.text, fontSize:13, fontWeight:700,
        }}>+ Upload Document</button>
      </div>

      {/* table */}
      <ShellCard>
        <SlateHeader title="Documents" />
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead>
              <tr style={{ background:D.tray, borderBottom:`1px solid ${D.divider}` }}>
                {["Type","Name","Category","Notes","Uploaded","Actions"].map(h => (
                  <th key={h} style={{ padding:"10px 16px", textAlign:"left", color:D.muted,
                    fontWeight:700, fontSize:10, textTransform:"uppercase",
                    letterSpacing:"0.06em", whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {docs.length === 0 ? (
                <tr><td colSpan={6} style={{ padding:48, textAlign:"center", color:D.muted, fontSize:13 }}>
                  No documents yet. Click "+ Upload Document" to add your first one.
                </td></tr>
              ) : docs.map((doc, i) => {
                const fc = FILE_COLOR(doc.type);
                return (
                  <tr key={doc.id} style={{
                    borderBottom:`1px solid ${D.divider}`,
                    background: i%2===0 ? D.shell : "rgba(255,255,255,0.02)",
                  }}>
                    <td style={{ padding:"12px 16px" }}>
                      <span style={{ fontSize:10, fontWeight:800, color:D.text,
                        background:"rgba(255,255,255,0.08)", padding:"3px 8px", borderRadius:5,
                        letterSpacing:"0.04em" }}>
                        {fc.label}
                      </span>
                    </td>
                    <td style={{ padding:"12px 16px", fontWeight:600, color:D.text,
                      maxWidth:220, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {doc.name}
                    </td>
                    <td style={{ padding:"12px 16px", color:D.muted, fontSize:12 }}>{doc.category}</td>
                    <td style={{ padding:"12px 16px", color:D.muted, fontSize:12,
                      maxWidth:260, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {doc.note || <span style={{color:D.dim}}>—</span>}
                    </td>
                    <td style={{ padding:"12px 16px", color:D.muted, fontSize:11, whiteSpace:"nowrap" }}>
                      {doc.uploaded}
                    </td>
                    <td style={{ padding:"12px 16px" }}>
                      <div style={{ display:"flex", gap:6 }}>
                        {canPreview(doc.type) && (
                          <button onClick={() => setPreview(doc)} style={{
                            padding:"4px 12px", borderRadius:8, border:"none",
                            background:D.elevated, boxShadow:D.btnShadow,
                            color:D.text, fontSize:11, fontWeight:600, cursor:"pointer",
                          }}>View</button>
                        )}
                        <a href={doc.data} download={doc.name} style={{
                          padding:"4px 12px", borderRadius:8, border:"none",
                          background:D.elevated, boxShadow:D.btnShadow,
                          color:D.text, fontSize:11, fontWeight:600,
                          textDecoration:"none", display:"inline-block",
                        }}>↓</a>
                        <button onClick={() => deleteDoc(doc.id)} style={{
                          padding:"4px 10px", borderRadius:8, border:"none",
                          background:"rgba(239,68,68,0.15)", color:"#ef4444",
                          fontSize:11, fontWeight:700, cursor:"pointer",
                        }}>✕</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ShellCard>

      <p style={{ fontSize:11, color:D.dim }}>
        Documents are saved in your browser's local storage.
        TODO: Wire to Supabase Storage for persistent storage across devices.
      </p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// STYLING RULES — reference page, delete when no longer needed
// ══════════════════════════════════════════════════════════════
function StyleRulesPage() {
  const rules = [
    {
      section: "COLOR — THE ONLY RULE THAT MATTERS",
      items: [
        "Monetary values (revenue, income, MRR, LTV, prices) → green if positive, red if negative. Negative values always show a minus sign: -$42.18, not ($42.18).",
        "Everything else — counts, user numbers, stats, labels, toggles, table cells, 'all time', 'not used', type labels like Language/Image/Video — white (#e4e1e8) or gray (#a1a1aa). No blue, no purple, no amber, no orange for non-monetary data.",
        "Do not color-code table type columns (Language, Image, Video). White text only.",
        "Do not color-code stat counts (user counts, message counts, image counts). White text only.",
        "There is only ONE gray: D.muted (#a1a1aa) for secondary text, D.dim (#525260) only for truly de-emphasized footnotes. Do not invent a third gray by using D.dim for things the user needs to read.",
        "The 'Not used' label in tables must be D.muted, not D.dim. It must be legible. Thomas is red-green colorblind — never use red/green for informational labels.",
      ]
    },
    {
      section: "HEADERS — NEVER PUT BUTTONS IN THEM",
      items: [
        "SlateHeader is for the title ONLY. The right slot of SlateHeader is ONLY for 'Open →' navigation links on tile cards. Nothing else.",
        "Toggles, filters, refresh buttons, view switches — all go BELOW the header in the content area.",
        "This was corrected multiple times. Do not revert. The fix is: remove the 'right={...}' prop from SlateHeader and move its contents into the padding div below.",
        "The only exception ever allowed: 'Open →' text on the Finance & Projections and User Management overview tile cards.",
      ]
    },
    {
      section: "DARK THEME (Overview + API & Usage pages only)",
      items: [
        "Three-layer surface hierarchy: bg #0d0e12 → shell #2a2a2f → tray #2e2e33 → elevated buttons #3c3e47.",
        "Outer cards: ShellCard component (borderRadius:24, overflow:hidden). This clips SlateHeader corners — no negative margins, no borderRadius on SlateHeader itself.",
        "Inner content blocks (tables, stat rows): Tray or inline div with D.tray background and D.trayShadow. borderRadius:16.",
        "Buttons: D.elevated background, D.btnShadow. borderRadius:10.",
        "SlateHeader: linear-gradient(180deg, #5a7292 0%, #4a5f7f 100%), borderTop:1px solid rgba(255,255,255,0.20). Gloss sheen overlay inside. Sits flush at top of ShellCard — no padding needed on parent.",
        "DarkToggle for content area buttons. HdrToggle was created for headers but is no longer used in headers.",
        "No 1px solid borders for sectioning (the 'No-Line Rule'). Use tonal layering instead.",
        "Other pages (Finance, Strategy, Users, Tiers, Documents) remain LIGHT theme using C palette.",
      ]
    },
    {
      section: "LAYOUT — DON'T REORGANIZE UNLESS ASKED",
      items: [
        "When applying a style skin to a page, change colors/backgrounds/shadows only. Do not move toggles, reorder columns, remove data, or change what information is displayed.",
        "Do not remove existing buttons or controls when restyling.",
        "The overview page has 4 equal widgets in a 2×2 grid: Subscriber Snapshot, App Growth (left column), API Usage, Net Income (right column).",
        "Toggles below charts: Day/Week/Month/Year period selector centered. View toggles (Total/By tier, Text/Image, Cost/Usage) right-aligned above the chart.",
      ]
    },
    {
      section: "USER MANAGEMENT TABLE",
      items: [
        "Column order: User → Tier & Cost → Status → Reported → Strikes → Stories → Member Since → Action.",
        "Reported column: plain number, amber only if >0, dash if zero.",
        "Strikes column: plain number with ★, red if ≥3, orange if >0, dash if zero. No View button.",
        "Action column: red dot + flag label + Review button ONLY if open reports exist. Dash if clean.",
        "Row background: red tint only for rows with pending reviews. All other rows white. No alternating row colors.",
        "Row border: solid black border between rows.",
        "Stats row above table: Active Users / Cancelled Subscriptions / Suspended / Pending Reviews. No Strikes stat.",
      ]
    },
    {
      section: "ACTION MODAL (User Management)",
      items: [
        "Tab 1 'Review Needed': shows open reports. Each card has ONE button only: 'Review →' (right-aligned), which navigates to the history tab.",
        "Tab 2 'Report / Strike History': unified chronological table (Date/Type/Issue/Notes/Status/Strike Given/Falls Off). Action buttons at bottom: Add Strike / Dismiss / View Story / Ban Account.",
        "Dismiss = dismiss the report (no violation found). Not 'Dismiss Last Strike'.",
        "Falls Off date is set manually per strike. No automatic expiry. Field labeled 'Falls off date' not 'Expiry date'.",
        "Modal width: 900px max.",
      ]
    },
    {
      section: "NAVIGATION SIDEBAR",
      items: [
        "Dark theme always. Background #1b1b20.",
        "No emojis in nav items.",
        "User Management badge shows count of open/unresolved reports as a plain number.",
        "Reports page removed — all moderation is handled in User Management.",
        "Nav labels: uppercase, 11px, bold, letterSpacing:0.07em.",
      ]
    },
    {
      section: "SYNTAX — CHECK BEFORE DELIVERING",
      items: [
        "Always run the Babel parser check after every edit: node -e \"require('@babel/parser').parse(src, {sourceType:'module',plugins:['jsx']})\"",
        "Common bug: style={{ ... }> instead of style={{ ... }}> (missing closing brace). The parser catches this.",
        "When using Python to replace large blocks of code, verify the replacement was actually written to the file before copying to outputs.",
        "Template literals inside JSX attributes (title={`...`}) can sometimes cause parse issues — prefer simple strings when possible.",
        "After any multi-function Python replacement, re-run find_fn() to verify boundaries before replacing to avoid off-by-one errors.",
      ]
    },
    {
      section: "GENERAL PRINCIPLES",
      items: [
        "Read the instructions before coding. If asked to apply a style skin, do not reorganize or remove anything.",
        "If asked to fix X on page Y, fix only X on page Y. Do not 'improve' surrounding things.",
        "Preserve uncertainty in user-written text. Do not paraphrase or reword content the user has typed.",
        "When in doubt about color: use white (#e4e1e8) for values, gray (#a1a1aa) for labels. That's it.",
        "Don't use D.dim for anything the user needs to read. D.dim is for footnotes and TODO text only.",
      ]
    },
  ];

  return (
    <div style={{ maxWidth:800, padding:"4px 0", fontFamily:"'Inter',system-ui,sans-serif" }}>
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:C.text, margin:"0 0 6px", letterSpacing:"-0.02em" }}>
          Styling Rules
        </h1>
        <p style={{ fontSize:13, color:C.muted, margin:0 }}>
          Reference for Claude. Every rule here was corrected at least once. Read before touching anything.
          Delete this page when it's no longer needed.
        </p>
      </div>

      {rules.map((group, gi) => (
        <div key={gi} style={{ marginBottom:32 }}>
          <div style={{ fontSize:11, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.08em",
            color:C.blue, marginBottom:12, paddingBottom:8,
            borderBottom:`1px solid ${C.divider}` }}>
            {group.section}
          </div>
          <ol style={{ margin:0, padding:"0 0 0 20px", display:"flex", flexDirection:"column", gap:8 }}>
            {group.items.map((item, ii) => (
              <li key={ii} style={{ fontSize:13, color:C.text, lineHeight:1.65, paddingLeft:4 }}>
                {item}
              </li>
            ))}
          </ol>
        </div>
      ))}

      <div style={{ marginTop:16, padding:"12px 16px", background:C.bg,
        border:`1px solid ${C.cardBorder}`, borderRadius:8,
        fontSize:12, color:C.muted, lineHeight:1.6 }}>
        Last updated: March 27, 2026. Add new rules here whenever a correction is made more than once.
      </div>
    </div>
  );
}

const NAV = [
  { id:"overview",  label:"Overview",              icon:"", desc:"" },
  { id:"finance",   label:"Finance & Projections", icon:"", desc:"" },
  { id:"strategy",  label:"Strategy",              icon:"", desc:"" },
  { id:"users",     label:"User Management",       icon:"", desc:"" },
  { id:"usage",     label:"API & Usage",           icon:"", desc:"" },
  { id:"tiers",     label:"Subscription Tiers",    icon:"", desc:"" },
  { id:"documents", label:"Documents",             icon:"", desc:"" },
  { id:"calculator", label:"Revenue Calculator",   icon:"", desc:"" },
  { id:"style",     label:"Styling Rules",         icon:"", desc:"" },
];

const PAGE_COMPONENTS = { finance:FinancePage, strategy:StrategyPage, usage:UsagePage, tiers:TiersPage, documents:DocumentsPage, calculator:RevenueCalcPage, style:StyleRulesPage };
const PAGE_SUB = {
  overview:  "Summary of all systems",
  finance:   "Revenue · EBITDA · scenarios · tier economics",
  strategy:  "Competitive intel · pricing sensitivity · unit economics · reality check",
  users:     "Manage accounts, tiers, strikes, and pending reviews",
  usage:     "xAI API consumption and cost tracking",
  tiers:     "Manage pricing, limits, and features — changes propagate to the app",
  documents: "Upload and view financial analysis, strategy docs, and reference material",
  calculator: "Interactive revenue, cost, and net income projections",
  style:     "Design rules — read this before making any styling changes",
};

export default function ChronicleAdmin() {
  const [page,setPage] = useState("overview");
  const [dashboardUsers, setDashboardUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [tierPrices, setTierPrices] = useState(DEFAULT_TIER_PRICES);
  const [userTierOverrides, setUserTierOverrides] = useState({});

  const loadDashboardUsers = async () => {
    setUsersLoading(true);
    try {
      const [profilesRes, rolesRes, storiesRes, overrideRes, tiersConfig] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, username, display_name, created_at")
          .order("created_at", { ascending: true }),
        supabase
          .from("user_roles")
          .select("user_id, role"),
        supabase
          .from("stories")
          .select("user_id"),
        supabase
          .from("app_settings")
          .select("setting_value")
          .eq("setting_key", USER_TIER_OVERRIDES_KEY)
          .maybeSingle(),
        loadSubscriptionTiersConfig(),
      ]);

      if (profilesRes.error) console.error("Failed to load profiles:", profilesRes.error);
      if (rolesRes.error) console.error("Failed to load user roles:", rolesRes.error);
      if (storiesRes.error) console.error("Failed to load stories:", storiesRes.error);
      if (overrideRes.error) console.error("Failed to load user tier overrides:", overrideRes.error);

      const nextTierPrices = { ...DEFAULT_TIER_PRICES };
      tiersConfig.forEach((tier) => {
        if (tier.id in nextTierPrices) nextTierPrices[tier.id] = tier.price;
      });
      setTierPrices(nextTierPrices);

      const rawOverrides = isObject(overrideRes.data?.setting_value) ? overrideRes.data.setting_value : {};
      const normalizedOverrides = {};
      Object.entries(rawOverrides).forEach(([userId, tierSlug]) => {
        normalizedOverrides[userId] = normalizeUserTierSlug(tierSlug);
      });
      setUserTierOverrides(normalizedOverrides);

      const rolesByUserId = {};
      const adminRoleUsers = new Set();
      (rolesRes.data || []).forEach((row) => {
        if (row.role === "admin") adminRoleUsers.add(row.user_id);
        const existingRole = rolesByUserId[row.user_id];
        if (!existingRole || (existingRole !== "admin" && row.role === "admin")) {
          rolesByUserId[row.user_id] = row.role;
        }
      });

      const storyCountsByUserId = {};
      (storiesRes.data || []).forEach((story) => {
        storyCountsByUserId[story.user_id] = (storyCountsByUserId[story.user_id] || 0) + 1;
      });

      const liveUsers = (profilesRes.data || []).map((profile) => {
        const roleBasedTier = tierSlugFromRole(rolesByUserId[profile.id]);
        const tierSlug = normalizedOverrides[profile.id] || roleBasedTier;
        const tierLabel = tierLabelBySlug[tierSlug] || "Free";
        const fallbackName = `User ${profile.id.slice(0, 8)}`;

        return {
          id: profile.id,
          email: profile.display_name || profile.username || fallbackName,
          username: profile.username || profile.id.slice(0, 8),
          displayName: profile.display_name || null,
          tier: tierLabel,
          tierSlug,
          status: "active",
          strikes: 0,
          stories: storyCountsByUserId[profile.id] || 0,
          reportCount: 0,
          reported: false,
          joined: profile.created_at || new Date().toISOString(),
          canViewAdminUi: adminRoleUsers.has(profile.id),
        };
      });

      setDashboardUsers(liveUsers);
    } catch (error) {
      console.error("Failed to load dashboard users:", error);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboardUsers();
  }, []);

  const handleTierChange = async (userId, rawTierSlug) => {
    const tierSlug = normalizeUserTierSlug(rawTierSlug);
    const tierLabel = tierLabelBySlug[tierSlug] || "Free";
    const shouldHaveAdminUi = isAdminTierSlug(tierSlug);

    setDashboardUsers((currentUsers) => currentUsers.map((user) => (
      user.id === userId ? { ...user, tierSlug, tier: tierLabel, canViewAdminUi: shouldHaveAdminUi } : user
    )));

    const nextOverrides = { ...userTierOverrides, [userId]: tierSlug };
    setUserTierOverrides(nextOverrides);

    try {
      const { data: updatedRows, error: updateError } = await supabase
        .from("app_settings")
        .update({
          setting_value: nextOverrides,
          updated_at: new Date().toISOString(),
        })
        .eq("setting_key", USER_TIER_OVERRIDES_KEY)
        .select("id");

      if (updateError) throw updateError;

      if (!updatedRows || updatedRows.length === 0) {
        const { error: insertError } = await supabase
          .from("app_settings")
          .insert({
            setting_key: USER_TIER_OVERRIDES_KEY,
            setting_value: nextOverrides,
            updated_at: new Date().toISOString(),
          });

        if (insertError) throw insertError;
      }

      if (shouldHaveAdminUi) {
        const { error: roleInsertError } = await supabase
          .rpc("set_admin_access", { _target_user_id: userId, _enabled: true });
        if (roleInsertError) throw roleInsertError;
      } else {
        const { error: roleDeleteError } = await supabase
          .rpc("set_admin_access", { _target_user_id: userId, _enabled: false });
        if (roleDeleteError) throw roleDeleteError;
      }
    } catch (error) {
      console.error("Failed to save user tier override/admin access:", error);
      void loadDashboardUsers();
    }
  };

  const activeUserBreakdown = useMemo(() => {
    const counts = { Starter:0, Premium:0, Elite:0, Admin:0, "Admin (CFO)":0 };
    dashboardUsers.forEach((user) => {
      if (user.status === "active" && user.tier in counts) {
        counts[user.tier] += 1;
      }
    });

    return [
      { label:"Starter", count:counts.Starter },
      { label:"Premium", count:counts.Premium },
      { label:"Elite",   count:counts.Elite },
      { label:"Admin",   count:counts.Admin },
      { label:"Admin (CFO)", count:counts["Admin (CFO)"] },
    ];
  }, [dashboardUsers]);

  const snapshotRows = useMemo(() => (
    PAID_TIER_SNAPSHOT_META.map((tier) => ({
      ...tier,
      price: typeof tierPrices[tier.slug] === "number" ? tierPrices[tier.slug] : DEFAULT_TIER_PRICES[tier.slug],
      users: dashboardUsers.filter((user) => user.status === "active" && user.tierSlug === tier.slug).length,
    }))
  ), [dashboardUsers, tierPrices]);

  const navItems = useMemo(() => NAV, []);
  const ActivePage = PAGE_COMPONENTS[page];

  return (
    <div style={{ display:"flex", minHeight:"100vh",
      background: D.bg, fontFamily:"'Inter',system-ui,sans-serif" }}>
      <style>{GLOBAL_STYLE}</style>

      {/* ── left sidebar ── */}
      <aside style={{
        width:230, flexShrink:0,
        background: D.sidebar,
        borderRight:"1px solid rgba(0,0,0,0.4)",
        boxShadow:"4px 0 12px rgba(0,0,0,0.3)",
        display:"flex", flexDirection:"column",
        position:"sticky", top:0, height:"100vh", overflowY:"auto",
      }}>
        {/* wordmark */}
        <div style={{ padding:"24px 20px 20px" }}>
          <div style={{ fontSize:18, fontWeight:800, color:D.text, letterSpacing:"-0.03em" }}>
            Chronicle
          </div>
          <div style={{ fontSize:10, color:D.text, marginTop:3, fontWeight:700,
            textTransform:"uppercase", letterSpacing:"0.07em" }}>
            Finance Dashboard
          </div>
        </div>

        {/* nav */}
        <nav style={{ padding:"8px 10px", flex:1 }}>
          {navItems.map(item => {
            const active = page === item.id;
            return (
              <button key={item.id} onClick={() => setPage(item.id)}
                style={{
                  width:"100%", textAlign:"left",
                  display:"flex", alignItems:"center", gap:10,
                  padding:"9px 14px", borderRadius:8, border:"none",
                  cursor:"pointer", marginBottom:2, transition:"all .15s",
                  background: active ? D.blueActive : "transparent",
                  color:       active ? D.blue      : D.muted,
                  fontWeight:  700,
                  fontSize:11,
                  textTransform:"uppercase",
                  letterSpacing:"0.07em",
                  boxShadow: active ? "inset 1px 1px 0 rgba(255,255,255,0.09)" : "none",
                }}>
                <span style={{ flex:1 }}>{item.label}</span>
                {item.desc && (
                  <span style={{ fontSize:10,
                    background: active ? D.blue : D.elevated,
                    color:"#fff", borderRadius:10, padding:"2px 7px", fontWeight:700 }}>
                    {item.desc}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* footer */}
        <div style={{ padding:"14px 20px", borderTop:`1px solid ${D.divider}`,
          fontSize:10, color:D.dim, lineHeight:1.6,
          textTransform:"uppercase", letterSpacing:"0.05em" }}>
          <div style={{ fontWeight:700, color:D.muted }}>Chronicle RPG Studio</div>
          <div>Admin v0.1 · placeholder data</div>
        </div>
      </aside>

      {/* ── main content ── */}
      <main style={{ flex:1, overflowY:"auto", padding:"30px 34px", minWidth:0,
        background: (page === "overview" || page === "usage" || page === "users" || page === "documents" || page === "tiers" || page === "calculator" || page === "strategy" || page === "finance") ? D.bg : C.bg }}>
        <div style={{ marginBottom:24, display:"flex", alignItems:"flex-start",
          justifyContent:"space-between", gap:16 }}>
          <div>
            <h1 style={{ fontSize:19, fontWeight:700,
              color: (page === "overview" || page === "usage" || page === "users" || page === "documents" || page === "tiers" || page === "calculator" || page === "strategy" || page === "finance") ? D.text : C.text,
              margin:"0 0 3px", letterSpacing:"-0.015em" }}>
              {navItems.find(n=>n.id===page)?.label}
            </h1>
            <p style={{ fontSize:12, color: (page === "overview" || page === "usage" || page === "users" || page === "documents" || page === "tiers" || page === "calculator" || page === "strategy" || page === "finance") ? D.muted : C.dim, margin:0 }}>
              {PAGE_SUB[page]}
            </p>
          </div>
          <div style={{ display:"flex", gap:10, flexShrink:0, alignItems:"stretch" }}>
            {/* Active users badge */}
            <div style={{
              background: (page === "overview" || page === "usage" || page === "users" || page === "documents" || page === "tiers" || page === "calculator" || page === "strategy" || page === "finance") ? D.shell : "#fff",
              boxShadow: (page === "overview" || page === "usage" || page === "users" || page === "documents" || page === "tiers" || page === "calculator" || page === "strategy" || page === "finance") ? D.shellShadow : `1.5px solid ${C.cardBorder}`,
              border: (page === "overview" || page === "usage" || page === "users" || page === "documents" || page === "tiers" || page === "calculator" || page === "strategy" || page === "finance") ? "none" : `1.5px solid ${C.cardBorder}`,
              borderRadius:14, padding:"10px 18px", textAlign:"left",
            }}>
              <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase",
                letterSpacing:"0.08em",
                color: (page === "overview" || page === "usage" || page === "users" || page === "documents" || page === "tiers" || page === "calculator" || page === "strategy" || page === "finance") ? D.muted : C.muted,
                marginBottom:6 }}>Active Users</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,minmax(0,1fr))", gap:"6px 12px" }}>
                {activeUserBreakdown.map((t) => (
                  <div key={t.label} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8, minWidth:76 }}>
                    <span style={{ fontSize:11, fontWeight:700, color: (page === "overview" || page === "usage" || page === "users" || page === "documents" || page === "tiers" || page === "calculator" || page === "strategy" || page === "finance") ? D.muted : C.muted }}>{t.label}</span>
                    <span style={{ fontSize:14, fontWeight:800, lineHeight:1,
                      color: (page === "overview" || page === "usage" || page === "users" || page === "documents" || page === "tiers" || page === "calculator" || page === "strategy" || page === "finance") ? D.text : C.text }}>{t.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Net income badge */}
            <div style={{
              background: (page === "overview" || page === "usage" || page === "users" || page === "documents" || page === "tiers" || page === "calculator" || page === "strategy" || page === "finance") ? D.shell : C.greenSoft,
              boxShadow: (page === "overview" || page === "usage" || page === "users" || page === "documents" || page === "tiers" || page === "calculator" || page === "strategy" || page === "finance") ? D.shellShadow : `1.5px solid ${C.green}33`,
              border: (page === "overview" || page === "usage" || page === "users" || page === "documents" || page === "tiers" || page === "calculator" || page === "strategy" || page === "finance") ? "none" : `1.5px solid ${C.green}33`,
              borderRadius:14, padding:"10px 22px", textAlign:"right",
            }}>
              <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase",
                letterSpacing:"0.08em",
                color: (page === "overview" || page === "usage" || page === "users" || page === "documents" || page === "tiers" || page === "calculator" || page === "strategy" || page === "finance") ? D.muted : C.green,
                marginBottom:3 }}>Net Income</div>
              <div style={{ fontSize:26, fontWeight:800, lineHeight:1,
                color: (page === "overview" || page === "usage" || page === "users" || page === "documents" || page === "tiers" || page === "calculator" || page === "strategy" || page === "finance") ? D.text : C.green }}>
                $658
              </div>
              <div style={{ fontSize:11, marginTop:3, fontWeight:500,
                color: (page === "overview" || page === "usage" || page === "users" || page === "documents" || page === "tiers" || page === "calculator" || page === "strategy" || page === "finance") ? D.muted : C.green }}>
                placeholder · wires to all sources
              </div>
            </div>
          </div>
        </div>

        {page === "overview" ? (
          <OverviewPage onNavigate={setPage} snapshotRows={snapshotRows} users={dashboardUsers}/>
        ) : page === "finance" ? (
          <FinancePage users={dashboardUsers} tierPrices={tierPrices} />
        ) : page === "users" ? (
          <UsersPage
            users={dashboardUsers}
            setUsers={setDashboardUsers}
            tierPrices={tierPrices}
            usersLoading={usersLoading}
            onTierChange={handleTierChange}
            onRefreshUsers={loadDashboardUsers}
          />
        ) : ActivePage ? (
          <ActivePage/>
        ) : null}
      </main>
    </div>
  );
}
