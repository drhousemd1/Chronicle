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

function ActionModal({ user, allReports, strikeHistory, onClose, onAddStrike, onRemoveStrike, onToggleSuspend, onUpdateReport }: any) {
  const [tab, setTab]                     = useState("reports");
  const [showAddStrike, setShowAddStrike] = useState(false);
  const [newReason, setNewReason]         = useState("plagiarism");
  const [newNote, setNewNote]             = useState("");
  const [newFallOff, setNewFallOff]       = useState("");
  const history = Array.isArray(strikeHistory) ? strikeHistory : [];

  const reasonMeta  = Object.fromEntries(STRIKE_REASONS.map(r => [r.id, r]));
  const userReports = allReports.filter((r) => (
    r.accusedUserId === user.id || r.accused === user.username
  ));
  const openReports = userReports.filter(r => r.status !== "resolved" && r.status !== "dismissed");
  const ptColor     = (pts) => pts >= 99 ? C.red : pts >= 2 ? C.orange : C.amber;

  // Unified chronological timeline — reports + strikes merged and sorted
  const timeline = [
    ...userReports.map(r => ({ type:"report", date:r.date, data:r })),
    ...history.map(s => ({ type:"strike", date:s.issuedAt, data:s })),
  ].sort((a,b) => new Date(a.date) - new Date(b.date));

  const handleAddStrike = () => {
    const reason = reasonMeta[newReason];
    const today  = new Date().toISOString().slice(0, 10);
    const entry  = {
      reason: newReason, points: reason.points,
      note: newNote || "(no note)", issuedBy:"admin",
      issuedAt: today, fallsOffAt: newFallOff || null, status:"active",
    };
    void onAddStrike(user.id, entry);
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
          Live moderation data from <code>reports</code> and <code>user_strikes</code>.
          Falls-off date is set manually per strike.
        </div>
      </div>
    </div>
  );
}

export function UsersPage({ users, setUsers, tierPrices, usersLoading, onTierChange, onRefreshUsers }: any) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [reports, setReports] = useState([]);
  const [strikes, setStrikes] = useState([]);
  const [moderationLoading, setModerationLoading] = useState(false);
  const [moderationError, setModerationError] = useState<string | null>(null);
  const [actionModal, setActionModal] = useState(null);
  const [pendingTierChange, setPendingTierChange] = useState(null);
  const [editingTierUserId, setEditingTierUserId] = useState(null);
  const [editingTierSlug, setEditingTierSlug] = useState("alpha");

  const usersById = useMemo(() => {
    const map = {};
    users.forEach((user) => {
      map[user.id] = user;
    });
    return map;
  }, [users]);

  const loadModerationData = useCallback(async () => {
    setModerationLoading(true);
    setModerationError(null);
    try {
      const [reportsRes, strikesRes] = await Promise.all([
        supabase
          .from("reports")
          .select("id, reporter_user_id, accused_user_id, story_id, reason, note, status, created_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("user_strikes")
          .select("id, user_id, report_id, reason, points, note, status, issued_by, issued_at, falls_off_at")
          .order("issued_at", { ascending: false }),
      ]);

      if (reportsRes.error) throw reportsRes.error;
      if (strikesRes.error) throw strikesRes.error;

      const nextReports = (reportsRes.data || []).map((row) => ({
        id: row.id,
        reporterUserId: row.reporter_user_id,
        accusedUserId: row.accused_user_id,
        reporter: usersById[row.reporter_user_id]?.username || row.reporter_user_id?.slice?.(0, 8) || "unknown",
        accused: usersById[row.accused_user_id]?.username || row.accused_user_id?.slice?.(0, 8) || "unknown",
        reason: row.reason || "Policy report",
        storyId: row.story_id ? String(row.story_id) : "—",
        date: row.created_at ? String(row.created_at).slice(0, 10) : "unknown",
        status: row.status || "open",
        note: row.note || "",
      }));

      const nextStrikes = (strikesRes.data || []).map((row) => ({
        id: row.id,
        userId: row.user_id,
        reportId: row.report_id,
        reason: row.reason || "other",
        points: Number(row.points || 1),
        note: row.note || "(no note)",
        status: row.status || "active",
        issuedBy: row.issued_by ? String(row.issued_by).slice(0, 8) : "admin",
        issuedAt: row.issued_at ? String(row.issued_at).slice(0, 10) : "unknown",
        fallsOffAt: row.falls_off_at || null,
      }));

      setReports(nextReports);
      setStrikes(nextStrikes);
    } catch (error) {
      console.error("Failed to load moderation tables:", error);
      setModerationError("Moderation tables unavailable (reports/user_strikes).");
      setReports([]);
      setStrikes([]);
    } finally {
      setModerationLoading(false);
    }
  }, [usersById]);

  useEffect(() => {
    void loadModerationData();
  }, [loadModerationData]);

  const openReportsByUserId = useMemo(() => {
    const map = {};
    reports.forEach((report) => {
      if (report.status !== "resolved" && report.status !== "dismissed") {
        if (!map[report.accusedUserId]) map[report.accusedUserId] = [];
        map[report.accusedUserId].push(report);
      }
    });
    return map;
  }, [reports]);

  const activeStrikesByUserId = useMemo(() => {
    const map = {};
    strikes.forEach((strike) => {
      if (strike.status === "active") {
        map[strike.userId] = (map[strike.userId] || 0) + 1;
      }
    });
    return map;
  }, [strikes]);

  const strikeHistoryByUserId = useMemo(() => {
    const map = {};
    strikes.forEach((strike) => {
      if (!map[strike.userId]) map[strike.userId] = [];
      map[strike.userId].push(strike);
    });
    return map;
  }, [strikes]);

  const usersWithSignals = useMemo(() => users.map((user) => {
    const openReports = openReportsByUserId[user.id] || [];
    return {
      ...user,
      reportCount: openReports.length,
      reported: openReports.length > 0,
      strikes: activeStrikesByUserId[user.id] || 0,
    };
  }), [users, openReportsByUserId, activeStrikesByUserId]);

  const displayed = useMemo(() => usersWithSignals.filter((u) => {
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
  }), [usersWithSignals, filter, search]);

  const addStrike = async (id, strikePayload) => {
    setModerationError(null);
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user?.id) throw new Error("Authentication required");

      const { error } = await supabase
        .from("user_strikes")
        .insert({
          user_id: id,
          report_id: strikePayload.reportId || null,
          reason: strikePayload.reason || "other",
          points: Number(strikePayload.points || 1),
          note: strikePayload.note || "(no note)",
          status: "active",
          issued_by: authData.user.id,
          issued_at: new Date().toISOString(),
          falls_off_at: strikePayload.fallsOffAt || null,
        });
      if (error) throw error;

      const nextStrikeCount = (activeStrikesByUserId[id] || 0) + 1;
      if (nextStrikeCount >= 3) {
        setUsers((allUsers) => allUsers.map((user) => (
          user.id === id ? { ...user, status: "suspended" } : user
        )));
      }
      await loadModerationData();
    } catch (error) {
      console.error("Failed to add strike:", error);
      setModerationError("Failed to add strike.");
    }
  };

  const removeStrike = async (id) => {
    setModerationError(null);
    const latestActiveStrike = strikes.find((strike) => strike.userId === id && strike.status === "active");
    if (!latestActiveStrike) return;
    try {
      const { error } = await supabase
        .from("user_strikes")
        .update({ status: "reversed" })
        .eq("id", latestActiveStrike.id);
      if (error) throw error;
      await loadModerationData();
    } catch (error) {
      console.error("Failed to remove strike:", error);
      setModerationError("Failed to reverse strike.");
    }
  };

  const toggleSuspend = (id) => setUsers((us) => us.map((u) => u.id !== id ? u : {
    ...u,
    status: u.status === "suspended" ? "active" : "suspended",
  }));
  const updateReport = async (id, status) => {
    setModerationError(null);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const reviewerId = authData?.user?.id || null;
      const payload = reviewerId
        ? { status, reviewed_by: reviewerId }
        : { status };

      const { error } = await supabase
        .from("reports")
        .update(payload)
        .eq("id", id);
      if (error) throw error;
      await loadModerationData();
    } catch (error) {
      console.error("Failed to update report:", error);
      setModerationError("Failed to update report status.");
    }
  };

  const modalUser = actionModal ? usersWithSignals.find((u) => u.id === actionModal.id) : null;
  const pendingChangeDetails = pendingTierChange ? {
    fromLabel: tierLabelBySlug[pendingTierChange.fromTierSlug] || "Alpha",
    toLabel: tierLabelBySlug[pendingTierChange.toTierSlug] || "Alpha",
  } : null;

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
    setEditingTierSlug("alpha");
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
          strikeHistory={strikeHistoryByUserId[modalUser.id] || []}
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
          { label:"Active Users",            value: usersWithSignals.filter((u) => u.status === "active").length },
          { label:"Cancelled Subscriptions", value: usersWithSignals.filter((u) => u.status === "cancelled").length },
          { label:"Suspended",               value: usersWithSignals.filter((u) => u.status === "suspended").length },
          { label:"Pending Reviews",         value: usersWithSignals.filter((u) => u.reported).length },
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
        {moderationLoading && <span style={{ fontSize:11, color:D.muted }}>Loading moderation data...</span>}
        {moderationError && <span style={{ fontSize:11, color:D.red }}>{moderationError}</span>}
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
                const openReports = openReportsByUserId[u.id] || [];
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
        Wired to live <code style={{ color:D.muted }}>profiles</code>, <code style={{ color:D.muted }}>user_roles</code>, <code style={{ color:D.muted }}>stories</code>, <code style={{ color:D.muted }}>reports</code>, and <code style={{ color:D.muted }}>user_strikes</code>. Tier overrides persist in <code style={{ color:D.muted }}>app_settings.{USER_TIER_OVERRIDES_KEY}</code>, and admin UI access syncs to <code style={{ color:D.muted }}>user_roles</code>.
      </p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// REPORTS
// ══════════════════════════════════════════════════════════════
