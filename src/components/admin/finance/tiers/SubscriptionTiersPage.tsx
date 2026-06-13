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

const DEFAULT_TIERS = DEFAULT_SUBSCRIPTION_TIERS;
const FEATURE_SECTIONS = TIER_FEATURE_SECTIONS;

type TierEditorRow = {
  key: TierFeatureKey | "msgLimit" | "imgLimit";
  label: string;
  hint: string;
  type: "limit" | "toggle";
};

function isFeatureToggleRow(row: TierEditorRow): row is TierEditorRow & { key: TierFeatureKey; type: "toggle" } {
  return row.type === "toggle";
}

function NumInput({ value, onChange, min=0, step=1 }: { value: number; onChange: (value: number) => void; min?: number; step?: number }) {
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

export function TiersPage() {
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
            const allFeatureKeys = FEATURE_SECTIONS.flatMap(s => s.rows as TierEditorRow[])
              .filter(isFeatureToggleRow)
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
                        {(section.rows as TierEditorRow[]).map(row => {
                          if (!isFeatureToggleRow(row)) return null;
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
