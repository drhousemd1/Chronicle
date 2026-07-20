import { defineManualArchitectureFiles } from "./types";

const componentHeader = {
  label: "REACT COMPONENT" as const,
  className: "component" as const,
  filterValue: "component" as const,
  navAccent: "component" as const,
};

const codeHeader = {
  label: "CODE LOGIC" as const,
  className: "code-logic" as const,
  filterValue: "code-logic" as const,
  navAccent: "code-logic" as const,
};

export const adminFinanceArchitectureFiles = defineManualArchitectureFiles([
  {
    path: "/src/components/admin/AdminToolEditModal.tsx",
    header: componentHeader,
    metric: "237 lines",
    metricDescription: "Admin-hub tile metadata editor.",
    description:
      "Edits an admin tool tile's title, description, and thumbnail preview. Thumbnail files are uploaded under the signed-in administrator's path in the avatars bucket; the parent-provided onSave callback remains responsible for persisting the tile metadata itself.",
    rows: [
      {
        id: "admin-tile-thumbnail",
        title: "Tile thumbnail upload",
        summary: "Requires a current Supabase user, uploads the selected image, and returns its public URL to the local edit draft.",
        badgeLabel: "STORAGE",
        badgeClass: "integration",
        details: [
          { label: "Writes", values: ["avatars bucket: <user-id>/admin-tools/<tool-id>-<timestamp>.<extension>"], kind: "buckets" },
          { label: "Does Not Own", values: ["removing the previously uploaded storage object", "persisting the final tile metadata"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of modal synchronization, authenticated upload, preview removal, save callback, and error states.",
  },
  {
    path: "/src/components/admin/ImageGenerationTool.tsx",
    header: componentHeader,
    metric: "261 lines",
    metricDescription: "Administrative art-style prompt editor.",
    description:
      "Loads privileged art_styles fields that the public art-style context intentionally omits, then lets an administrator edit each style's display name, thumbnail URL, default backend prompt, masculine prompt, and androgynous prompt. Each style is saved independently, and thumbnail uploads use the avatars bucket before the resulting URL is written to art_styles.",
    rows: [
      {
        id: "image-style-admin-data",
        title: "Privileged art-style configuration",
        summary: "Reads and writes backend prompt fields directly under admin RLS instead of exposing them through the public sanitized style provider.",
        badgeLabel: "ADMIN DATA",
        badgeClass: "data-block",
        details: [
          { label: "Reads/Writes", values: ["art_styles"], kind: "tables" },
          { label: "Storage", values: ["avatars/admin/styles"], kind: "buckets" },
          { label: "Guardrail", values: ["backend prompt fields must remain admin-only and must not be added to the public useArtStyles context"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of admin-only query, local dirty state, per-style save, thumbnail upload, and gender-variant prompts.",
  },
  {
    path: "/src/components/admin/finance/FinanceDashboardTool.tsx",
    header: componentHeader,
    metric: "186 lines",
    metricDescription: "Finance dashboard composition and shared-data owner.",
    description:
      "Composes the nine finance workspaces, owns their internal navigation, loads the shared administrator user model and tier prices, derives active-user and paid-tier summaries, samples monthly API cost, and passes the appropriate shared data into Overview, Finance Projections, and User Management. Other finance pages are mounted from the page registry with no shared props.",
    rows: [
      {
        id: "finance-dashboard-data",
        title: "Shared finance read model",
        summary: "Combines finance-user records, tier overrides, tier prices, and monthly usage estimates before downstream finance pages render.",
        badgeLabel: "DATA FLOW",
        badgeClass: "data-block",
        details: [
          { label: "Uses", values: ["/src/services/finance-dashboard/finance-users.ts", "/src/services/admin-usage-metrics.ts"], kind: "files" },
          { label: "Supplies", values: ["dashboard users", "tier prices", "tier overrides", "active-user breakdown", "subscriber snapshot rows"], kind: "plain" },
          { label: "Failure Handling", values: ["user-load and tier-save failures are logged; a failed tier change triggers a full user reload"], kind: "plain" },
        ],
      },
      {
        id: "finance-dashboard-routing",
        title: "Internal finance workspace routing",
        summary: "Switches between Overview, Finance and Projections, Strategy, Users, API Usage, Subscription Tiers, Documents, Revenue Calculator, and Styling Rules without changing the application route.",
        badgeLabel: "NAVIGATION",
        badgeClass: "component",
        details: [
          { label: "Uses", values: ["/src/components/admin/finance/shared/FinanceSidebar.tsx", "/src/components/admin/finance/shared/FinanceHeader.tsx"], kind: "files" },
          { label: "Does Not Own", values: ["the outer Admin route or Chronicle app authorization"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of page registry, user loading, tier mutation, usage sampling, derived summaries, and prop routing.",
  },
  {
    path: "/src/components/admin/finance/calculator/RevenueCalculatorPage.tsx",
    header: componentHeader,
    metric: "357 lines",
    metricDescription: "Interactive subscription revenue calculator.",
    description:
      "Calculates monthly gross revenue, Stripe fees, modeled xAI cost, fixed hosting cost, and net income from administrator-entered Starter, Premium, and Elite subscriber counts. It also projects selected future months from a growth-rate input. Its tier prices, message limits, image limits, API-cost assumptions, Stripe formula, and hosting amount are local calculator assumptions rather than live billing mutations.",
    rows: [
      {
        id: "revenue-calculator-model",
        title: "Scenario calculation model",
        summary: "Recomputes per-tier and aggregate economics entirely in browser state as subscriber counts and growth assumptions change.",
        badgeLabel: "CALCULATION",
        badgeClass: "code-logic",
        details: [
          { label: "Inputs", values: ["subscriber counts by paid tier", "monthly growth percentage"], kind: "plain" },
          { label: "Outputs", values: ["gross revenue", "Stripe fees", "modeled API spend", "hosting", "net income", "1/3/6/12-month projections"], kind: "plain" },
          { label: "Does Not Own", values: ["live tier configuration", "real invoices", "database persistence"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of subscriber inputs, fee formulas, tier assumptions, projection math, and output cards.",
  },
  {
    path: "/src/components/admin/finance/documents/DocumentsPage.tsx",
    header: componentHeader,
    metric: "417 lines",
    metricDescription: "Private finance-document library.",
    description:
      "Lists finance_documents rows, stages a selected local file with optional category and note, uploads it to the private finance_documents bucket, and inserts the metadata row for the authenticated administrator. It generates one-hour signed URLs for preview or download and deletes both the storage object and its database row.",
    rows: [
      {
        id: "finance-document-storage",
        title: "Document storage lifecycle",
        summary: "Keeps binary files in private storage and metadata in the matching table, using short-lived signed URLs rather than public object URLs.",
        badgeLabel: "STORAGE",
        badgeClass: "integration",
        details: [
          { label: "Reads/Writes", values: ["finance_documents"], kind: "tables" },
          { label: "Bucket", values: ["finance_documents"], kind: "buckets" },
          { label: "Preview", values: ["images directly", "PDFs in an iframe", "unsupported formats through download"], kind: "plain" },
          { label: "Guardrail", values: ["upload requires an authenticated user ID and preview URLs expire after one hour"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of list, stage, upload, insert, signed URL, preview, download, and dual-delete operations.",
  },
  {
    path: "/src/components/admin/finance/overview/MarketingAdSpend.tsx",
    header: codeHeader,
    metric: "1 line",
    metricDescription: "Marketing tracker compatibility export.",
    description:
      "Re-exports AdSpendTracker from OverviewPage so FinanceProjectionsPage can import the tracker through a focused module path. It contains no independent state, data access, or rendering logic.",
    rows: [],
    reviewedSource: "Manual review of the complete re-export.",
  },
  {
    path: "/src/components/admin/finance/overview/OverviewPage.tsx",
    header: componentHeader,
    metric: "1,115 lines",
    metricDescription: "Finance overview, marketing, usage, and notes dashboard.",
    description:
      "Assembles subscriber economics, application growth, net-income estimates, API usage, marketing subscriptions, and administrator notes into the finance landing page. User and paid-tier snapshots arrive from FinanceDashboardTool; live usage, xAI billing, ad-spend channels, and the saved overview note are loaded through dedicated services. The file is currently excluded from TypeScript checking and contains several reusable subpanels consumed elsewhere.",
    rows: [
      {
        id: "finance-overview-economic-panels",
        title: "Subscriber, growth, income, and API summaries",
        summary: "Derives financial cards and charts from supplied dashboard users, tier snapshot rows, usage timeseries, and xAI billing data.",
        badgeLabel: "FINANCE MODEL",
        badgeClass: "code-logic",
        details: [
          { label: "Exports", values: ["SubscriberSnapshot", "AppGrowth", "NetIncomeMini", "ApiUsageMini", "AdSpendTracker", "OverviewPage"], kind: "plain" },
          { label: "Uses", values: ["/src/services/admin-usage-metrics.ts", "/src/services/xai-billing.ts"], kind: "files" },
          { label: "Risk", values: ["the file uses @ts-nocheck, so type errors inside these dashboards are not caught by the normal TypeScript build"], kind: "plain" },
        ],
      },
      {
        id: "finance-overview-ad-spend",
        title: "Marketing and ad-spend records",
        summary: "Loads channels, calculates active/paid/free/cancelled and annual-cost summaries, and supports adding, editing, and deleting marketing records.",
        badgeLabel: "PERSISTENCE",
        badgeClass: "data-block",
        details: [
          { label: "Uses", values: ["/src/services/finance-dashboard/finance-ad-spend.ts"], kind: "files" },
          { label: "Operations", values: ["fetchAdSpendChannels", "saveAdSpendChannel", "deleteAdSpendChannel"], kind: "plain" },
        ],
      },
      {
        id: "finance-overview-note",
        title: "Persistent administrator note",
        summary: "Provides a small rich-text note editor and persists its HTML through the finance-notes service.",
        badgeLabel: "PERSISTENCE",
        badgeClass: "data-block",
        details: [
          { label: "Uses", values: ["/src/services/finance-dashboard/finance-notes.ts"], kind: "files" },
          { label: "Output", values: ["saved finance overview note HTML"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of all exported panels, live-service calls, ad-spend editor, note editor, and Overview composition.",
  },
  {
    path: "/src/components/admin/finance/projections/FinanceProjectionsPage.tsx",
    header: componentHeader,
    metric: "516 lines",
    metricDescription: "Finance projection and tier-economics workspace.",
    description:
      "Models 24 months of paid-tier growth, revenue, modeled API spend, Stripe fees, hosting cost, and EBITDA from current user counts, current tier prices, administrator-adjustable growth assumptions, and a sampled month of API usage. It embeds overview subpanels and the marketing tracker so projection assumptions and surrounding operating data can be viewed together. The file is currently excluded from TypeScript checking.",
    rows: [
      {
        id: "finance-projection-model",
        title: "Twenty-four-month projection model",
        summary: "Builds conservative, base, and optimistic subscriber/revenue paths while allowing tier growth and price assumptions to be adjusted locally.",
        badgeLabel: "CALCULATION",
        badgeClass: "code-logic",
        details: [
          { label: "Inputs", values: ["dashboard users", "tier prices", "monthly API usage timeseries", "growth assumptions"], kind: "plain" },
          { label: "Outputs", values: ["subscriber projections", "revenue", "costs", "EBITDA", "tier-economics cards"], kind: "plain" },
          { label: "Does Not Own", values: ["saving forecast assumptions", "changing live subscription prices"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of starting counts, API-cost load, growth and price controls, forecast calculations, and embedded overview panels.",
  },
  {
    path: "/src/components/admin/finance/shared/FinanceHeader.tsx",
    header: componentHeader,
    metric: "74 lines",
    metricDescription: "Finance page title and summary header.",
    description:
      "Displays the active finance page label and subtitle, an active-user breakdown by tier, and a net-income card. The active-user counts are supplied by FinanceDashboardTool; the displayed $658 net-income value is explicitly a placeholder and is not calculated in this component.",
    rows: [],
    reviewedSource: "Manual review of supplied props, page-label lookup, tier summary, dark/light styling, and placeholder net-income card.",
  },
  {
    path: "/src/components/admin/finance/shared/FinanceSidebar.tsx",
    header: componentHeader,
    metric: "67 lines",
    metricDescription: "Finance workspace navigation sidebar.",
    description:
      "Renders the Finance Dashboard brand, every supplied finance navigation item, active-page styling, optional item descriptors, and a footer. It changes only the parent-owned page state through onPageChange and does not alter the browser route.",
    rows: [],
    reviewedSource: "Manual review of navigation rendering, active state, callback boundary, and sticky layout.",
  },
  {
    path: "/src/components/admin/finance/shared/finance-shared.tsx",
    header: codeHeader,
    metric: "357 lines",
    metricDescription: "Finance design tokens, shared calculations, fixtures, and view primitives.",
    description:
      "Centralizes the finance dashboard's light and dark palettes, shadows, injected scrollbar/contenteditable styles, reusable cards and controls, number and membership formatters, tier normalization, tier and status badges, fixed finance fixtures, forecast assumptions, model-rate examples, and paid-tier snapshot metadata. It mixes visual primitives with mock/model data, so callers must distinguish live inputs from static planning assumptions.",
    rows: [
      {
        id: "finance-shared-ui",
        title: "Finance visual primitives",
        summary: "Supplies ShellCard, Tray, Card, Stat, section labels, toggles, buttons, chart tooltip, and headers using the finance-specific palettes.",
        badgeLabel: "UI SYSTEM",
        badgeClass: "component",
        details: [
          { label: "Exports", values: ["GLOBAL_STYLE", "C", "D", "ShellCard", "Tray", "Card", "Stat", "Toggle", "ActionBtn", "ChartTip", "SlateHeader", "HdrToggle", "DarkToggle"], kind: "plain" },
          { label: "Boundary", values: ["finance dashboard only; not Chronicle's global UI primitive layer"], kind: "plain" },
        ],
      },
      {
        id: "finance-shared-model-data",
        title: "Tier normalization and planning fixtures",
        summary: "Defines tier aliases, default prices, admin-tier recognition, membership-age formatting, and static forecast/model datasets used by planning screens.",
        badgeLabel: "MODEL DATA",
        badgeClass: "data-block",
        details: [
          { label: "Static Data", values: ["MONTHLY_FORECAST", "ANNUAL", "BREAKEVEN", "MOCK_USERS", "MODEL_RATES", "TIER_BREAKDOWN", "PAID_TIER_SNAPSHOT_META"], kind: "plain" },
          { label: "Guardrail", values: ["static fixtures are assumptions and must not be presented as live billing or user truth"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of every exported token, component, formatter, tier helper, and static data collection.",
  },
  {
    path: "/src/components/admin/finance/strategy/StrategyPage.tsx",
    header: componentHeader,
    metric: "1,163 lines",
    metricDescription: "Static business-strategy and unit-economics workbook.",
    description:
      "Presents six local strategy tabs covering competitor context, unit economics, break-even calculations, a 36-month forecast, pricing sensitivity, and annual summaries. The figures come from large checked-in datasets and local formulas inside this file; despite broad copied imports at the top, it does not load or save Supabase data in its active component logic.",
    rows: [
      {
        id: "strategy-market-data",
        title: "Competitor and market reference",
        summary: "Stores and renders competitor pricing, limits, features, scale indicators, source notes, and a solo-developer reality check.",
        badgeLabel: "REFERENCE DATA",
        badgeClass: "data-block",
        details: [
          { label: "Data", values: ["S1_COMPETITORS", "S1_ROWS", "S1_REALITY"], kind: "plain" },
          { label: "Freshness Risk", values: ["market data is checked-in static research and does not refresh automatically"], kind: "plain" },
        ],
      },
      {
        id: "strategy-economics",
        title: "Economic scenarios and forecasts",
        summary: "Calculates break-even, cost assumptions, subscriber scenarios, 36-month forecasts, pricing sensitivity, and annual takeaways from local strategy constants.",
        badgeLabel: "CALCULATION",
        badgeClass: "code-logic",
        details: [
          { label: "Tabs", values: ["Unit Economics", "Break-Even Calc", "36-Month Forecast", "Pricing Sensitivity", "Annual Summary"], kind: "plain" },
          { label: "Does Not Own", values: ["live finance telemetry", "database persistence", "subscription configuration"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of all six tab datasets, formulas, controls, and rendered tables/charts.",
  },
  {
    path: "/src/components/admin/finance/style-rules/FinanceStyleRulesPage.tsx",
    header: componentHeader,
    metric: "211 lines",
    metricDescription: "Finance dashboard maintenance rules.",
    description:
      "Renders the finance dashboard's internal styling and editing rules, including spacing, colors, card conventions, table and chart guidance, and warnings about modifying the large finance page files. The page is static documentation; its broad imports are unused and it performs no active Supabase, billing, or subscription work.",
    rows: [],
    reviewedSource: "Manual review of the rules dataset and rendered documentation; confirmed imported data services are not used by the component.",
  },
  {
    path: "/src/components/admin/finance/tiers/SubscriptionTiersPage.tsx",
    header: componentHeader,
    metric: "463 lines",
    metricDescription: "Live subscription-tier configuration editor.",
    description:
      "Loads the shared tier configuration, renders a subscriber-facing preview, and lets an administrator change tier names, prices, accents, badges, message limits, image limits, and feature toggles. Save and Apply delegates persistence and app-wide notification to the subscription-tier configuration service used by the public Subscription tab.",
    rows: [
      {
        id: "subscription-tier-editing",
        title: "Tier configuration publishing",
        summary: "Maintains an editable local copy until Save and Apply publishes all tiers through the shared configuration service.",
        badgeLabel: "CONFIGURATION",
        badgeClass: "data-block",
        details: [
          { label: "Uses", values: ["/src/services/subscription-tier-config.ts"], kind: "files" },
          { label: "Edits", values: ["identity and price", "message/image limits", "feature booleans", "accent and badge"], kind: "plain" },
          { label: "Consumer", values: ["/src/components/account/SubscriptionTab.tsx"], kind: "files" },
        ],
      },
    ],
    reviewedSource: "Manual review of config load, preview derivation, field updates, feature toggles, save operation, and error state.",
  },
  {
    path: "/src/components/admin/finance/usage/ApiUsagePage.tsx",
    header: componentHeader,
    metric: "1,025 lines",
    metricDescription: "API usage, test-session, validation, and xAI billing dashboard.",
    description:
      "Displays aggregate Chronicle AI counters, usage/cost timeseries, grouped metric series, API test-session accounting, validation matrix results, xAI model-pricing reference, and a live xAI billing summary. Usage and test data come from admin usage services; billing is fetched through a server-side edge-function path so management credentials do not enter the browser. The file is currently excluded from TypeScript checking.",
    rows: [
      {
        id: "api-usage-telemetry",
        title: "Usage and cost telemetry",
        summary: "Loads summary counters and a selected time period, then renders event-volume or estimated-cost series grouped by core, builder, runtime, character, or all activity.",
        badgeLabel: "TELEMETRY",
        badgeClass: "data-block",
        details: [
          { label: "Uses", values: ["fetchAdminUsageSummary", "fetchAdminUsageTimeseries"], kind: "plain" },
          { label: "Refresh", values: ["summary polling", "period-specific timeseries polling"], kind: "plain" },
          { label: "Guardrail", values: ["estimated costs are server-derived telemetry, not provider invoices"], kind: "plain" },
        ],
      },
      {
        id: "api-usage-test-report",
        title: "Test-session and validation matrix",
        summary: "Maps tracked API usage sessions into metric columns and overlays registry-defined pass, fail, or blank validation rows for admin review.",
        badgeLabel: "VALIDATION",
        badgeClass: "test",
        details: [
          { label: "Uses", values: ["fetchAdminApiUsageTestReport", "/src/data/api-usage-validation-registry.ts"], kind: "plain" },
          { label: "Shows", values: ["trusted server events", "client diagnostics", "costed events", "token/cost estimates", "validation status per session"], kind: "plain" },
        ],
      },
      {
        id: "api-usage-billing",
        title: "xAI pricing and billing review",
        summary: "Shows model pricing/reference limits and requests the current credit and billing summary through the protected xAI billing service.",
        badgeLabel: "EXTERNAL SERVICE",
        badgeClass: "integration",
        details: [
          { label: "Uses", values: ["/src/services/xai-billing.ts"], kind: "files" },
          { label: "Security", values: ["xAI management or API keys remain in the edge-function environment"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of pricing reference, counters, polling, series selection, trace columns, validation matrix, and billing refresh.",
  },
  {
    path: "/src/components/admin/finance/users/ReportsPage.tsx",
    header: componentHeader,
    metric: "191 lines",
    metricDescription: "Standalone report-status review table.",
    description:
      "Loads reports ordered newest-first, filters them by open, reviewing, resolved, dismissed, or all, and writes status transitions back to the reports table. It is a smaller standalone report queue; UserManagementPage separately integrates reports with account and strike context.",
    rows: [],
    reviewedSource: "Manual review of report query, filters, status updates, retry state, and table actions.",
  },
  {
    path: "/src/components/admin/finance/users/UserManagementPage.tsx",
    header: componentHeader,
    metric: "972 lines",
    metricDescription: "Account, tier, report, and strike administration workspace.",
    description:
      "Combines the finance-user model supplied by FinanceDashboardTool with live reports and user_strikes data. It supports account search and filtering, confirmed tier changes, admin-UI entitlement display, report review, strike issuance and reversal, and per-user moderation history. The file is currently excluded from TypeScript checking.",
    rows: [
      {
        id: "user-management-moderation",
        title: "Reports and strike lifecycle",
        summary: "Loads moderation records, joins them to displayed users, records the issuing administrator, changes report status, and reverses the latest active strike when requested.",
        badgeLabel: "MODERATION",
        badgeClass: "data-block",
        details: [
          { label: "Reads/Writes", values: ["reports", "user_strikes"], kind: "tables" },
          { label: "Strike Policy", values: ["reason-specific points", "optional fall-off date", "three active strikes updates the current page's user status to suspended"], kind: "plain" },
          { label: "Important Limit", values: ["the suspend/unsuspend control updates local dashboard state only; this component does not persist that status to an account table"], kind: "plain" },
        ],
      },
      {
        id: "user-management-tier",
        title: "Tier and admin-access changes",
        summary: "Confirms tier changes before delegating persistence to FinanceDashboardTool's finance-user service boundary.",
        badgeLabel: "ACCOUNT CONFIG",
        badgeClass: "integration",
        details: [
          { label: "Callback", values: ["onTierChange(userId, tierSlug)"], kind: "plain" },
          { label: "Persisted By", values: ["/src/services/finance-dashboard/finance-users.ts"], kind: "files" },
          { label: "Displays", values: ["tier cost", "admin UI access", "account status", "story count", "membership age"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of moderation loads, joins, filters, strike/report writes, tier confirmation, local suspend behavior, and user table.",
  },
]);
