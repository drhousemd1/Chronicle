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

export function FinanceStyleRulesPage() {
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
