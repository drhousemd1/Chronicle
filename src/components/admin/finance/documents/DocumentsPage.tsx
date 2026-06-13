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

type FinanceDocument = {
  id: string;
  uploaded_by: string;
  file_name: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  category: string;
  note: string;
  created_at: string;
  updated_at: string;
};

type StagedFinanceDocument = {
  file: File;
  name: string;
  type: string;
  size: number;
};

type PreviewFinanceDocument = FinanceDocument & { url: string };

export function DocumentsPage() {
  const [docs,        setDocs]        = useState<FinanceDocument[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [showUpload,  setShowUpload]  = useState(false);
  const [dragging,    setDragging]    = useState(false);
  const [staged,      setStaged]      = useState<StagedFinanceDocument | null>(null);
  const [category,    setCategory]    = useState("");
  const [note,        setNote]        = useState("");
  const [preview,     setPreview]     = useState<PreviewFinanceDocument | null>(null);
  const [uploading,   setUploading]   = useState(false);

  const loadDocs = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("finance_documents").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setDocs(data || []);
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  const stageFile = (file: File) => {
    setStaged({ file, name: file.name, type: file.type, size: file.size });
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) stageFile(file);
  };

  const handleSave = async () => {
    if (!staged) return;
    setUploading(true);
    try {
      const path = `${Date.now()}_${staged.name}`;
      const { error: uploadErr } = await supabase.storage.from("finance_documents").upload(path, staged.file, { contentType: staged.type });
      if (uploadErr) throw uploadErr;
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user?.id) throw new Error("Authentication required");
      const { error: insertErr } = await supabase.from("finance_documents").insert({
        uploaded_by: authData.user.id,
        file_name: staged.name,
        storage_path: path,
        mime_type: staged.type || "application/octet-stream",
        size_bytes: staged.size,
        category: category.trim() || "Uncategorized",
        note: note.trim(),
      });
      if (insertErr) throw insertErr;
      setShowUpload(false); setStaged(null); setCategory(""); setNote("");
      loadDocs();
    } catch (err) { alert("Upload failed: " + (err instanceof Error ? err.message : String(err))); }
    finally { setUploading(false); }
  };

  const deleteDoc = async (doc: FinanceDocument) => {
    setDocs(ds => ds.filter(d => d.id !== doc.id));
    await supabase.storage.from("finance_documents").remove([doc.storage_path]);
    await supabase.from("finance_documents").delete().eq("id", doc.id);
  };

  const getSignedUrl = async (storagePath: string) => {
    const { data } = await supabase.storage.from("finance_documents").createSignedUrl(storagePath, 3600);
    return data?.signedUrl || "";
  };

  const openPreview = async (doc: FinanceDocument) => {
    const url = await getSignedUrl(doc.storage_path);
    setPreview({ ...doc, url });
  };

  const downloadDoc = async (doc: FinanceDocument) => {
    const url = await getSignedUrl(doc.storage_path);
    if (url) { const a = document.createElement("a"); a.href = url; a.download = doc.file_name; a.click(); }
  };

  const fmtSize = (b: number) => b < 1024*1024 ? `${(b/1024).toFixed(1)} KB` : `${(b/1024/1024).toFixed(1)} MB`;

  const FILE_COLOR = (type: string) => {
    if (type?.includes("pdf"))   return { label:"PDF", color:"#dc2626" };
    if (type?.includes("word") || type?.includes("docx")) return { label:"DOC", color:"#2563eb" };
    if (type?.includes("sheet") || type?.includes("xlsx")) return { label:"XLS", color:"#059669" };
    if (type?.includes("text") || type?.includes("markdown")) return { label:"TXT", color:"#7c3aed" };
    if (type?.includes("image")) return { label:"IMG", color:"#d97706" };
    return { label:"FILE", color:"#374151" };
  };

  const canPreview = (type: string) => type?.includes("pdf") || type?.includes("image") || type?.includes("text");

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" });
  const timeStr = now.toLocaleTimeString("en-US", { hour:"2-digit", minute:"2-digit" });

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
                <input type="file" onChange={e => { const file = e.target.files?.[0]; if (file) stageFile(file); }}
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
                <button onClick={handleSave} disabled={!staged || uploading}
                  style={{ padding:"8px 20px", borderRadius:8, border:"none",
                    cursor: staged && !uploading ? "pointer" : "default",
                    background: staged ? D.blue : D.dim,
                    boxShadow: staged ? D.blueGlow : "none",
                    color:"#fff", fontSize:13, fontWeight:700 }}>
                  {uploading ? "Uploading…" : "Save Document"}
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
            <SlateHeader title={preview.file_name}
              right={
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <span style={{ fontSize:11, color:"rgba(255,255,255,0.55)" }}>{fmtSize(preview.size_bytes)}</span>
                  <button onClick={() => downloadDoc(preview)} style={{
                    padding:"4px 14px", borderRadius:8, border:"none",
                    background:D.elevated, boxShadow:D.btnShadow,
                    color:D.text, fontSize:11, fontWeight:700, cursor:"pointer",
                  }}>Download</button>
                  <button onClick={() => setPreview(null)} style={{
                    width:26, height:26, borderRadius:"50%", border:"none",
                    background:D.elevated, color:D.muted, cursor:"pointer", fontSize:15,
                    display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700,
                  }}>×</button>
                </div>
              }
            />
            <div style={{ flex:1, overflow:"auto", background:D.tray }}>
              {preview.mime_type?.includes("pdf") ? (
                <iframe src={preview.url} style={{ width:"100%", height:"75vh", border:"none" }} title={preview.file_name}/>
              ) : preview.mime_type?.includes("image") ? (
                <div style={{ padding:24, textAlign:"center" }}>
                  <img src={preview.url} alt={preview.file_name} style={{ maxWidth:"100%", maxHeight:"70vh", borderRadius:8 }}/>
                </div>
              ) : (
                <div style={{ padding:24, fontSize:13, color:D.text }}>
                  Preview not available for this file type. Use the download button.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* toolbar */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ fontSize:13, color:D.muted }}>
          {loading ? "Loading…" : `${docs.length} document${docs.length !== 1 ? "s" : ""} stored`}
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
                const fc = FILE_COLOR(doc.mime_type);
                const uploaded = new Date(doc.created_at).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" });
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
                      {doc.file_name}
                    </td>
                    <td style={{ padding:"12px 16px", color:D.muted, fontSize:12 }}>{doc.category}</td>
                    <td style={{ padding:"12px 16px", color:D.muted, fontSize:12,
                      maxWidth:260, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {doc.note || <span style={{color:D.dim}}>—</span>}
                    </td>
                    <td style={{ padding:"12px 16px", color:D.muted, fontSize:11, whiteSpace:"nowrap" }}>
                      {uploaded}
                    </td>
                    <td style={{ padding:"12px 16px" }}>
                      <div style={{ display:"flex", gap:6 }}>
                        {canPreview(doc.mime_type) && (
                          <button onClick={() => openPreview(doc)} style={{
                            padding:"4px 12px", borderRadius:8, border:"none",
                            background:D.elevated, boxShadow:D.btnShadow,
                            color:D.text, fontSize:11, fontWeight:600, cursor:"pointer",
                          }}>View</button>
                        )}
                        <button onClick={() => downloadDoc(doc)} style={{
                          padding:"4px 12px", borderRadius:8, border:"none",
                          background:D.elevated, boxShadow:D.btnShadow,
                          color:D.text, fontSize:11, fontWeight:600, cursor:"pointer",
                        }}>↓</button>
                        <button onClick={() => deleteDoc(doc)} style={{
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
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// STYLING RULES — reference page, delete when no longer needed
// ══════════════════════════════════════════════════════════════
