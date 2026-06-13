/* eslint-disable react-refresh/only-export-components */
import React from "react";

// ─── inject global styles for always-visible scrollbars ───────
export const GLOBAL_STYLE = `
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
export const C = {
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
export const D = {
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
export const ShellCard = ({ children, style={} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
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
export const Tray = ({ children, style={} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{
    background: D.tray,
    boxShadow: D.trayShadow,
    borderRadius: 16,
    ...style,
  }}>{children}</div>
);
export const MONTHLY_FORECAST = [
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

export const ANNUAL = [
  { year:"Yr 1", cRev:3208,  cEBIT:-1644, bRev:10454,  bEBIT:4666,   oRev:35933,  oEBIT:26586  },
  { year:"Yr 2", cRev:6116,  cEBIT:918,   bRev:37499,  bEBIT:28299,  oRev:255758, oEBIT:211404 },
  { year:"Yr 3", cRev:13242, cEBIT:7195,  bRev:142921, bEBIT:115809, oRev:1857645,oEBIT:1569961},
];

export const BREAKEVEN = [
  { users:1,  ebit:-337 }, { users:5,  ebit:-268 }, { users:10, ebit:-206 },
  { users:15, ebit:-119 }, { users:20, ebit:-57  }, { users:25, ebit:46   },
  { users:30, ebit:108  }, { users:40, ebit:258  }, { users:50, ebit:423  },
  { users:75, ebit:824  }, { users:100,ebit:1201 }, { users:150,ebit:1995 },
];

export const MOCK_USERS = [
  { id:1, email:"alice@example.com", username:"alice_w",  tier:"Premium", status:"active",    strikes:0, stories:12, reportCount:0, reported:false, joined:"2026-01-14" },
  { id:2, email:"bob@example.com",   username:"bob_r",    tier:"Elite",   status:"active",    strikes:1, stories:34, reportCount:1, reported:true,  joined:"2026-01-22" },
  { id:3, email:"carol@example.com", username:"carol_s",  tier:"Starter", status:"active",    strikes:0, stories:4,  reportCount:0, reported:false, joined:"2026-02-03" },
  { id:4, email:"dave@example.com",  username:"dave_m",   tier:"Starter", status:"suspended", strikes:3, stories:8,  reportCount:3, reported:true,  joined:"2026-01-08" },
  { id:5, email:"eve@example.com",   username:"eve_t",    tier:"Premium", status:"cancelled", strikes:0, stories:22, reportCount:0, reported:false, joined:"2025-12-20" },
  { id:6, email:"frank@example.com", username:"frank_l",  tier:"Free",    status:"active",    strikes:0, stories:1,  reportCount:0, reported:false, joined:"2026-03-10" },
  { id:7, email:"grace@example.com", username:"grace_k",  tier:"Elite",   status:"active",    strikes:2, stories:67, reportCount:1, reported:true,  joined:"2026-01-30" },
  { id:8, email:"henry@example.com", username:"henry_b",  tier:"Starter", status:"active",    strikes:0, stories:9,  reportCount:0, reported:false, joined:"2026-02-18" },
];



export const MODEL_RATES = [
  { model:"grok-4.3",          input:"$1.25/M", output:"$2.50/M",   note:"Primary text model"  },
  { model:"grok-imagine-image", input:"—",        output:"$0.02/img", note:"Image generation"    },
];

// ─── helpers ──────────────────────────────────────────────────
export const fmt$ = (n: number) => Math.abs(n) >= 1000 ? `$${(n/1000).toFixed(1)}k` : `$${Math.round(n)}`;

export const Badge = ({ label, bg, color }: { label: string; bg: string; color: string }) => (
  <span style={{ fontSize:11, fontWeight:600, padding:"2px 9px", borderRadius:20,
    background:bg, color, whiteSpace:"nowrap", display:"inline-block" }}>{label}</span>
);

export const tierMeta   = {
  Elite:{bg:"#fef3c7",color:"#92400e"},
  Premium:{bg:"#ede9fe",color:"#5b21b6"},
  Starter:{bg:"#dbeafe",color:"#1e40af"},
  Alpha:{bg:"#e0f2fe",color:"#075985"},
  Free:{bg:"#f1f5f9",color:"#475569"},
  Admin:{bg:"#fee2e2",color:"#991b1b"},
  "Admin (CFO)":{bg:"#ffedd5",color:"#9a3412"},
};
export const statusMeta = { active:{bg:"#d1fae5",color:"#065f46"}, cancelled:{bg:"#f1f5f9",color:"#475569"}, suspended:{bg:"#fee2e2",color:"#991b1b"} };

export const tierBadge  = (t: string) => <Badge label={t}  {...((tierMeta as Record<string, {bg:string;color:string}>)[t]   || tierMeta.Free)} />;
export const statusBadge= (s: string) => <Badge label={s}  {...((statusMeta as Record<string, {bg:string;color:string}>)[s] || statusMeta.cancelled)} />;

export const USER_TIER_OVERRIDES_KEY = "admin_user_tier_overrides_v1";
export const DEFAULT_TIER_PRICES: Record<string, number> = { alpha: 0, free: 0, starter: 9.99, premium: 19.99, elite: 39.99, admin: 0 };
export const USER_TIER_OPTIONS = [
  { value: "alpha", label: "Alpha" },
  { value: "starter", label: "Starter" },
  { value: "premium", label: "Premium" },
  { value: "elite", label: "Elite" },
  { value: "admin", label: "Admin" },
  { value: "admin_cfo", label: "Admin (CFO)" },
];

export const tierLabelBySlug = {
  alpha: "Alpha",
  free: "Free",
  starter: "Starter",
  premium: "Premium",
  elite: "Elite",
  admin: "Admin",
  admin_cfo: "Admin (CFO)",
};

export const isObject = (value: unknown) => typeof value === "object" && value !== null;

export const normalizeUserTierSlug = (value: unknown): string => {
  if (typeof value !== "string") return "alpha";
  const normalized = value.trim().toLowerCase();
  if (normalized === "staff") return "admin_cfo";
  if (normalized === "trial" || normalized === "tester" || normalized === "alpha_testing") return "alpha";
  if (normalized in tierLabelBySlug) return normalized;
  return "alpha";
};

export const isAdminTierSlug = (tierSlug: string) => tierSlug === "admin" || tierSlug === "admin_cfo";

export const tierSlugFromRole = (role: string) => {
  if (role === "admin") return "admin";
  return "alpha";
};

export const tierCostLabel = (tierSlug: string, tierPrices: Record<string, number>) => {
  if (tierSlug === "alpha") return "Alpha Testing (No Billing)";
  if (tierSlug === "free") return "Free";
  if (isAdminTierSlug(tierSlug)) return "Internal (No Billing)";
  const price = tierPrices[tierSlug];
  return typeof price === "number" ? `$${price.toFixed(2)}/mo` : "—";
};

export const formatMembershipAge = (joinedIso: string | null | undefined) => {
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
export const Card = ({ children, style={} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ background:C.card, border:`1px solid ${C.cardBorder}`,
    borderRadius:12, padding:"20px 22px", ...style }}>{children}</div>
);

export const Stat = ({ label, value, sub, color, soft }: { label: string; value: string | number; sub?: string; color?: string; soft?: string }) => (
  <div style={{ background:soft||C.surface, border:`1px solid ${C.cardBorder}`,
    borderRadius:10, padding:"16px 20px", flex:1, minWidth:130 }}>
    <div style={{ fontSize:11, color:C.muted, marginBottom:6, fontWeight:600,
      textTransform:"uppercase", letterSpacing:"0.04em" }}>{label}</div>
    <div style={{ fontSize:24, fontWeight:700, color:color||C.text, lineHeight:1 }}>{value}</div>
    {sub && <div style={{ fontSize:11, color:C.dim, marginTop:5 }}>{sub}</div>}
  </div>
);

export const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.08em",
    textTransform:"uppercase", color:C.dim, marginBottom:14 }}>{children}</div>
);

export const Toggle = ({ options, value, onChange }: { options: { value: string; label: string }[]; value: string; onChange: (v: string) => void }) => (
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

export const ActionBtn = ({ label, color, onClick }: { label: string; color: string; onClick?: () => void }) => (
  <button onClick={onClick} style={{
    padding:"4px 10px", borderRadius:6, border:`1px solid ${color}44`,
    background:`${color}10`, color, fontSize:11, cursor:"pointer",
    fontWeight:600, whiteSpace:"nowrap",
  }}>{label}</button>
);

export const ChartTip = ({ active, payload, label, prefix="$" }: { active?: boolean; payload?: any[]; label?: string; prefix?: string }) => {
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

export const TIER_BREAKDOWN = [
  { name:"Starter", price:9.99,  apiCost:4.002, users:24, color:"#1e40af", soft:"#dbeafe" },
  { name:"Premium", price:19.99, apiCost:12.007, users:17, color:"#5b21b6", soft:"#ede9fe" },
  { name:"Elite",   price:39.99, apiCost:29.885, users:6,  color:"#92400e", soft:"#fef3c7" },
  { name:"Admin",   price:0,     apiCost:0,     users:0,  color:"#dc2626", soft:"#fef2f2" },
];

export const PAID_TIER_SNAPSHOT_META = [
  { slug:"starter", name:"Starter", color:"#1e40af", apiCost:4.002 },
  { slug:"premium", name:"Premium", color:"#5b21b6", apiCost:12.007 },
  { slug:"elite",   name:"Elite",   color:"#92400e", apiCost:29.885 },
  { slug:"admin",   name:"Admin",   color:"#dc2626", apiCost:0 },
];

// ─── slate header — flush top of ShellCard, no margin needed ──
export const SlateHeader = ({ title, right }: { title: string; right?: React.ReactNode }) => (
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
export const HdrToggle = ({ options, value, onChange }: { options: { v: string; l: string }[]; value: string; onChange?: (v: string) => void }) => (
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
export const DarkToggle = ({ options, value, onChange }: { options: { v: string; l: string }[]; value: string; onChange?: (v: string) => void }) => (
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
