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

type StrategyCompetitor = (typeof S1_COMPETITORS)[number];
type StrategyCompetitorKey = keyof StrategyCompetitor;
type StrategyMarketRow =
  | { group: string; label?: never; key?: never; note?: never }
  | { label: string; key: StrategyCompetitorKey; note: string | null; group?: never };

// Row definitions for the transposed table
const S1_ROWS: StrategyMarketRow[] = [
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
  { label:"xAI input price",                 value:"$1.25",    unit:"/M tokens", note:"grok-4.3" },
  { label:"xAI output price",                value:"$2.50",    unit:"/M tokens", note:"grok-4.3" },
  { label:"Extraction: every Nth message",   value:"5",        unit:"messages",  note:"Throttled — 80% cost reduction vs every-msg" },
  { label:"Image generation cost",           value:"$0.02",    unit:"/image",    note:"grok-imagine-image" },
  { label:"Cost per chat message (calc)",    value:"$0.01056", unit:"",          note:"Derived from token inputs/outputs above" },
  { label:"Extraction cost amortized/msg",   value:"$0.00211", unit:"",          note:"Spread across every message" },
  { label:"TOTAL cost per message",          value:"$0.01267", unit:"",          note:"Chat + extraction combined", highlight:true },
];
const S2_PER_USER = [
  { tier:"Free Trial", price:0,     msgLimit:20,   imgLimit:0,   msgCost:0.253, imgCost:0,   totalApi:0.253, grossProfit:-0.253, margin:"0%",   ltv:"—",   annualRev:"—"   },
  { tier:"Starter",    price:9.99,  msgLimit:300,  imgLimit:10,  msgCost:3.802, imgCost:0.2, totalApi:4.002, grossProfit:5.988,  margin:"60.0%",ltv:"$165",annualRev:"$120"},
  { tier:"Premium",    price:19.99, msgLimit:900,  imgLimit:30,  msgCost:11.407, imgCost:0.6, totalApi:12.007, grossProfit:7.983, margin:"39.9%",ltv:"$315",annualRev:"$240"},
  { tier:"Elite",      price:39.99, msgLimit:2200, imgLimit:100, msgCost:27.885, imgCost:2.0, totalApi:29.885, grossProfit:10.105, margin:"25.3%",ltv:"$720",annualRev:"$480"},
];
const S2_INFRA = [
  { scale:"0–499 users",     cost:371,  starterCover:62,  premiumCover:46, eliteCover:37,  note:"Supabase free tier + basic hosting. Covers launch phase.", current:true },
  { scale:"500–4,999 users", cost:946,  starterCover:158, premiumCover:119,eliteCover:94,  note:"Supabase Pro + modest hosting. Scales to a few thousand users.", current:false },
  { scale:"5K–49,999 users", cost:4404, starterCover:735, premiumCover:552,eliteCover:436, note:"Supabase Team + CDN + increased compute. Meaningful scale.", current:false },
];

// ── Sheet 3: Break-Even Calculator ──────────────────────────
const S3_BREAKEVEN = [
  { users:1   , starterRev:0      , premiumRev:0       , eliteRev:39.99   , totalRev:39.99   , apiCost:29.885  , infraCost:371, ebitda:-360.895 , margin:-9.025 , status:"Loss" },
  { users:5   , starterRev:19.98  , premiumRev:19.99   , eliteRev:79.98   , totalRev:119.95  , apiCost:79.781  , infraCost:371, ebitda:-330.831 , margin:-2.758 , status:"Loss" },
  { users:10  , starterRev:49.95  , premiumRev:59.97   , eliteRev:79.98   , totalRev:189.9   , apiCost:115.801 , infraCost:371, ebitda:-296.901 , margin:-1.563 , status:"Loss" },
  { users:15  , starterRev:69.93  , premiumRev:99.95   , eliteRev:119.97  , totalRev:289.85  , apiCost:177.704 , infraCost:371, ebitda:-258.854 , margin:-0.893 , status:"Loss" },
  { users:20  , starterRev:99.9   , premiumRev:139.93  , eliteRev:119.97  , totalRev:359.8   , apiCost:213.724 , infraCost:371, ebitda:-224.924 , margin:-0.625 , status:"Loss" },
  { users:25  , starterRev:119.88 , premiumRev:159.92  , eliteRev:199.95  , totalRev:479.75  , apiCost:293.505 , infraCost:371, ebitda:-184.755 , margin:-0.385 , status:"Loss" },
  { users:30  , starterRev:149.85 , premiumRev:199.9   , eliteRev:199.95  , totalRev:549.7   , apiCost:329.525 , infraCost:371, ebitda:-150.825 , margin:-0.274 , status:"Loss" },
  { users:40  , starterRev:199.8  , premiumRev:279.86  , eliteRev:239.94  , totalRev:719.6   , apiCost:427.448 , infraCost:371, ebitda:-78.848  , margin:-0.11  , status:"Near break-even" },
  { users:50  , starterRev:249.75 , premiumRev:339.83  , eliteRev:319.92  , totalRev:909.5   , apiCost:543.249 , infraCost:371, ebitda:-4.749   , margin:-0.005 , status:"Near break-even" },
  { users:75  , starterRev:369.63 , premiumRev:519.74  , eliteRev:479.88  , totalRev:1369.25 , apiCost:818.876 , infraCost:371, ebitda:179.374  , margin:0.131  , status:"✅ Profitable" },
  { users:100 , starterRev:499.5  , premiumRev:699.65  , eliteRev:599.85  , totalRev:1799    , apiCost:1068.62 , infraCost:371, ebitda:359.38   , margin:0.2    , status:"✅ Profitable" },
  { users:150 , starterRev:749.25 , premiumRev:1039.48 , eliteRev:919.77  , totalRev:2708.5  , apiCost:1611.869, infraCost:371, ebitda:725.631  , margin:0.268  , status:"✅ Profitable" },
  { users:200 , starterRev:999    , premiumRev:1399.3  , eliteRev:1199.7  , totalRev:3598    , apiCost:2137.24 , infraCost:371, ebitda:1089.76  , margin:0.303  , status:"✅ Strong profit" },
  { users:300 , starterRev:1498.5 , premiumRev:2098.95 , eliteRev:1799.55 , totalRev:5397    , apiCost:3205.86 , infraCost:371, ebitda:1820.14  , margin:0.337  , status:"✅ Strong profit" },
  { users:500 , starterRev:2497.5 , premiumRev:3498.25 , eliteRev:2999.25 , totalRev:8995    , apiCost:5343.1  , infraCost:371, ebitda:3280.9   , margin:0.365  , status:"✅ Strong profit" },
  { users:750 , starterRev:3746.25, premiumRev:5237.38 , eliteRev:4518.87 , totalRev:13502.5 , apiCost:8023.589, infraCost:371, ebitda:5107.911 , margin:0.378  , status:"✅ Strong profit" },
  { users:1000, starterRev:4995   , premiumRev:6996.5  , eliteRev:5998.5  , totalRev:17990   , apiCost:10686.2 , infraCost:371, ebitda:6932.8   , margin:0.385  , status:"✅ Strong profit" },
  { users:2000, starterRev:9990   , premiumRev:13993   , eliteRev:11997   , totalRev:35980   , apiCost:21372.4 , infraCost:371, ebitda:14236.6  , margin:0.396  , status:"✅ Strong profit" },
  { users:5000, starterRev:24975  , premiumRev:34982.5 , eliteRev:29992.5 , totalRev:89950   , apiCost:53431   , infraCost:371, ebitda:36148    , margin:0.402  , status:"✅ Strong profit" },
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
  { price:"$4.99",  api:4.002, gp:0.988, gm:0.198, u371:376, u946:957, rev100:5988,  vsGGPT:"-67%",vsCan:"-58%",pos:"Too low for current model cost" },
  { price:"$6.99",  api:4.002, gp:2.988, gm:0.427, u371:124, u946:317, rev100:8388,  vsGGPT:"-53%",vsCan:"-42%",pos:"Aggressive acquisition pricing" },
  { price:"$7.99",  api:4.002, gp:3.988, gm:0.499, u371:93,  u946:237, rev100:9588,  vsGGPT:"-47%",vsCan:"-33%",pos:"Low margin for current model cost" },
  { price:"$9.99",  api:4.002, gp:5.988, gm:0.599, u371:62,  u946:158, rev100:11988, vsGGPT:"-33%",vsCan:"-17%",pos:"Current Starter price", rec:true },
  { price:"$12.99", api:4.002, gp:8.988, gm:0.692, u371:41,  u946:105, rev100:15588, vsGGPT:"-13%",vsCan:"+8%", pos:"Healthier current-model margin" },
  { price:"$14.99", api:4.002, gp:10.988,gm:0.733, u371:34,  u946:86,  rev100:17988, vsGGPT:"-0%", vsCan:"+25%",pos:"Premium starter positioning" },
  { price:"$19.99", api:4.002, gp:15.988,gm:0.800, u371:23,  u946:59,  rev100:23988, vsGGPT:"+33%",vsCan:"+67%",pos:"High starter price" },
];
const S5_PREMIUM = [
  { price:"$9.99",  api:12.007, gp:-2.017,gm:-0.202,u371:-184,u946:-469,rev100:11988, vsGGPT:"-50%",vsCan:"-17%",pos:"Below current model cost" },
  { price:"$12.99", api:12.007, gp:0.983, gm:0.076, u371:377, u946:962, rev100:15588, vsGGPT:"-35%",vsCan:"+8%", pos:"Barely covers API usage" },
  { price:"$14.99", api:12.007, gp:2.983, gm:0.199, u371:124, u946:317, rev100:17988, vsGGPT:"-25%",vsCan:"+25%",pos:"Low current-model margin" },
  { price:"$19.99", api:12.007, gp:7.983, gm:0.399, u371:46,  u946:119, rev100:23988, vsGGPT:"—",   vsCan:"+67%",pos:"Current Premium price", rec:true },
  { price:"$24.99", api:12.007, gp:12.983,gm:0.520, u371:29,  u946:73,  rev100:29988, vsGGPT:"+25%",vsCan:"+108%",pos:"Healthier current-model margin" },
  { price:"$29.99", api:12.007, gp:17.983,gm:0.600, u371:21,  u946:53,  rev100:35988, vsGGPT:"+50%",vsCan:"+150%",pos:"Strong premium positioning" },
  { price:"$34.99", api:12.007, gp:22.983,gm:0.657, u371:16,  u946:41,  rev100:41988, vsGGPT:"+75%",vsCan:"+192%",pos:"High-end premium pricing" },
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

export function StrategyPage() {
  const [tab, setTab] = useState("market");
  const [sensTier, setSensTier] = useState("starter");
  const sensData = sensTier === "starter" ? S5_STARTER : S5_PREMIUM;

  const thRow = (cols: string[]) => (
    <tr style={{ background:D.tray, borderBottom:`1px solid ${D.divider}` }}>
      {cols.map((h: string) => (
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
                    if ("group" in row) {
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
              ℹ Free trial users cost <strong style={{color:D.text}}>$0.253 total</strong> per person (20 messages × $0.01267). At 1,000 free trials, total cost is $253. They either convert or churn at 25 cents each.
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
                    Every message costs <strong style={{color:D.text}}>$0.01267</strong> in AI tokens:<br/>
                    &nbsp;• 7,450 input tokens × $1.25/M = $0.00931<br/>
                    &nbsp;• 500 output tokens × $2.50/M = $0.00125<br/>
                    &nbsp;• Character extraction every 5th msg = $0.00211<br/>
                    Images cost <strong style={{color:D.text}}>$0.02 each</strong> (grok-imagine-image).<br/><br/>
                    So per subscriber per month:<br/>
                    &nbsp;• Starter (300 msgs + 10 imgs): <strong style={{color:C.red}}>$4.00</strong><br/>
                    &nbsp;• Premium (900 msgs + 30 imgs): <strong style={{color:C.red}}>$12.01</strong><br/>
                    &nbsp;• Elite (2,200 msgs + 100 imgs): <strong style={{color:C.red}}>$29.89</strong>
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
                    ? "Starter tier: 300 msgs + 10 imgs, API cost = $4.002/mo fixed"
                    : "Premium tier: 900 msgs + 30 imgs, API cost = $12.007/mo fixed"}
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
