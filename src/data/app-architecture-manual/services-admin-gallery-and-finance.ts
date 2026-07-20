import { defineManualArchitectureFiles } from "./types";

const serviceHeader = {
  label: "SERVICE" as const,
  className: "service" as const,
  filterValue: "service" as const,
  navAccent: "service" as const,
};

const testHeader = {
  label: "TEST" as const,
  className: "test" as const,
  filterValue: "test" as const,
  navAccent: "test" as const,
};

const integrationHeader = {
  label: "INTEGRATION" as const,
  className: "integration" as const,
  filterValue: "integration" as const,
  navAccent: "integration" as const,
};

export const adminGalleryFinanceServiceArchitectureFiles = defineManualArchitectureFiles([
  {
    path: "/src/services/admin-debug-trace-authorization.test.ts",
    header: testHeader,
    metric: "68 lines",
    metricDescription: "Source-contract tests for administrator-only debug trace access.",
    description:
      "Verifies that debug-trace authorization uses the backend has_role RPC and that the chat edge function checks that role before exposing turn-level debug traces. The test prevents a browser-only admin flag from becoming the security boundary for private prompt evidence.",
    rows: [],
    reviewedSource: "Manual review of both source-contract assertions and their backend-role and chat-edge targets.",
  },
  {
    path: "/src/services/admin-usage-metrics.ts",
    header: serviceHeader,
    metric: "401 lines",
    metricDescription: "Normalized admin summaries, timeseries, and API test-session reports.",
    description:
      "Calls three admin edge functions and converts their loosely typed response bodies into stable dashboard contracts. It exposes aggregate AI activity, period-based usage and cost points, and API-usage test sessions with validation rows and pass/fail/blank summaries. Validation row definitions come from the checked-in registry, and a failure always takes precedence over a pass when snapshots are aggregated.",
    rows: [
      {
        id: "admin-usage-summary-timeseries",
        title: "Usage counters and timeseries",
        summary:
          "Normalizes text, image, builder, character-state, memory, and generation counters plus text/image cost estimates, substituting zero only when a numeric response field is absent or invalid.",
        badgeLabel: "ADMIN METRICS",
        badgeClass: "api-call",
        details: [
          { label: "Edge Functions", values: ["admin-ai-usage-summary", "admin-ai-usage-timeseries"], kind: "edges" },
        ],
      },
      {
        id: "admin-api-test-report",
        title: "API test-session report",
        summary:
          "Maps server and client-diagnostic event counts, cost estimates, and validation status by session while preserving the checked-in validation row order and definitions.",
        badgeLabel: "TEST REPORT",
        badgeClass: "data-block",
        details: [{ label: "Edge Function", values: ["admin-api-usage-test-report"], kind: "edges" }],
      },
    ],
    reviewedSource: "Manual review of public contracts, validation precedence, empty fallbacks, all three edge calls, numeric normalization, row-registry mapping, and per-session summaries.",
  },
  {
    path: "/src/services/admin-usage-metrics.validation.test.ts",
    header: testHeader,
    metric: "35 lines",
    metricDescription: "Unit tests for aggregate API validation status.",
    description:
      "Proves pass, fail, and blank derivation across mixed snapshots and ensures a missing required field remains failed even if a later snapshot reports that row as sent.",
    rows: [],
    reviewedSource: "Manual review of both aggregation test cases.",
  },
  {
    path: "/src/services/ai-usage-telemetry-integrity.test.ts",
    header: testHeader,
    metric: "246 lines",
    metricDescription: "Cross-service tests for authoritative versus diagnostic AI usage accounting.",
    description:
      "Checks that browser-submitted usage remains diagnostic-only, admin counters and costs exclude those rows, provider-call edge functions emit authoritative telemetry, duplicate client diagnostics do not overcount test sessions, Responses token usage survives response-validation errors, and builder and avatar callers pass the intended usage category.",
    rows: [],
    reviewedSource: "Manual review of all telemetry-integrity source contracts covering client diagnostics, server events, cost estimation, response errors, and category propagation.",
  },
  {
    path: "/src/services/api-usage-test-session.ts",
    header: serviceHeader,
    metric: "191 lines",
    metricDescription: "Authenticated lifecycle control for admin API-usage test sessions.",
    description:
      "Starts, fetches, and stops the administrator's active API-usage test session through the api-usage-test-session edge function. It requires a real Supabase access token, retries active-session reads when requested, mirrors only the enabled flag and active session ID in localStorage, and clears that local state when a session ends or test mode is explicitly disabled.",
    rows: [
      {
        id: "api-test-session-auth",
        title: "Authenticated session commands",
        summary:
          "Sends get, start, and stop actions with the current bearer token and surfaces backend error, details, hint, and transport context when an operation fails.",
        badgeLabel: "ADMIN SESSION",
        badgeClass: "api-call",
        details: [{ label: "Edge Function", values: ["api-usage-test-session"], kind: "edges" }],
      },
      {
        id: "api-test-local-mirror",
        title: "Local tracking mirror",
        summary:
          "Stores whether event capture is enabled and which server-owned session receives events; local values do not create or authorize a test session by themselves.",
        badgeLabel: "LOCAL STATE",
        badgeClass: "data-block",
        details: [],
      },
    ],
    reviewedSource: "Manual review of token requirement, retries, payload error assembly, get/start/stop operations, and localStorage synchronization.",
  },
  {
    path: "/src/services/api-usage-validation.ts",
    header: serviceHeader,
    metric: "442 lines",
    metricDescription: "Required-versus-sent prompt coverage snapshots for admin test sessions.",
    description:
      "Builds validation snapshots that compare the fields expected from the current scenario and response job with the fields actually serialized into API Call 1. It records sent, missing, and non-applicable row IDs, includes response-job modes and source receipts, and submits the resulting diagnostic snapshot to the test-session tracker without blocking roleplay if telemetry fails.",
    rows: [
      {
        id: "api-validation-presence",
        title: "Expected and observed field presence",
        summary:
          "Uses the checked-in validation registry to determine which story, character, current-state, history, source, goal, and response-detail rows should exist, then searches the rendered request sections for their actual presence.",
        badgeLabel: "PROMPT COVERAGE",
        badgeClass: "code-logic",
        details: [],
      },
      {
        id: "api-validation-snapshot",
        title: "Diagnostic test-session event",
        summary:
          "Sends the trace version, response mode, expected IDs, sent IDs, missing IDs, and supporting metadata to track-api-usage-test only when a local admin test session is active.",
        badgeLabel: "DIAGNOSTIC ONLY",
        badgeClass: "api-call",
        details: [{ label: "Edge Function", values: ["track-api-usage-test"], kind: "edges" }],
      },
    ],
    reviewedSource: "Manual review of required-row derivation, Call 1 presence checks, mode/source metadata, local session gating, and fail-open tracking submission.",
  },
  {
    path: "/src/services/api-usage-validation.test.ts",
    header: testHeader,
    metric: "476 lines",
    metricDescription: "Prompt-coverage tests for authored fields and side-character facts.",
    description:
      "Proves that populated canonical story and character fields are marked sent when rendered, become missing when removed from the prompt, leave non-authored rows undefined, and validate AI-generated side-character facts through the same compiled representation.",
    rows: [],
    reviewedSource: "Manual review of all three Call 1 coverage fixtures and their sent/missing/non-authored assertions.",
  },
  {
    path: "/src/services/app-settings.ts",
    header: serviceHeader,
    metric: "68 lines",
    metricDescription: "Admin authorization, shared-key health, and cached admin state.",
    description:
      "Provides the browser-side admin settings boundary. It checks shared API-key health through an edge function, verifies administrator access through the has_role RPC, caches only the last confirmed admin boolean in localStorage, and updates shared-key configuration in app_settings. A missing user ID always resolves as non-admin.",
    rows: [
      {
        id: "app-settings-admin-check",
        title: "Backend administrator check",
        summary:
          "Uses has_role with the requested user and the admin role; the local cache supports startup rendering but does not replace the backend verification.",
        badgeLabel: "ACCESS CHECK",
        badgeClass: "integration",
        details: [{ label: "RPC", values: ["has_role"], kind: "rpcs" }],
        security: true,
      },
      {
        id: "app-settings-shared-keys",
        title: "Shared provider-key settings",
        summary:
          "Reads key health from check-shared-keys and persists administrator changes to the shared settings row.",
        badgeLabel: "KEY SETTINGS",
        badgeClass: "integration",
        details: [
          { label: "Edge Function", values: ["check-shared-keys"], kind: "edges" },
          { label: "Table", values: ["app_settings"], kind: "tables" },
        ],
        security: true,
      },
    ],
    reviewedSource: "Manual review of shared-key status, role RPC, local cache, missing-user behavior, and settings update.",
  },
  {
    path: "/src/services/finance-dashboard/finance-ad-spend.ts",
    header: serviceHeader,
    metric: "101 lines",
    metricDescription: "Admin advertising-spend mapping and CRUD operations.",
    description:
      "Maps ad_spend rows into finance-dashboard channel records and provides authenticated fetch, insert/update, and delete operations for campaign costs, cadence, dates, currency, status, links, overrides, and notes.",
    rows: [],
    reviewedSource: "Manual review of row mapping, date/cost normalization, fetch ordering, create/update payloads, current-user ownership, and deletion.",
  },
  {
    path: "/src/services/finance-dashboard/finance-notes.ts",
    header: serviceHeader,
    metric: "232 lines",
    metricDescription: "Sanitized shared overview note for the finance dashboard.",
    description:
      "Loads and saves the Finance Dashboard's shared administrator note in admin_notes. Before persistence and rendering, it parses the supplied HTML, permits a narrow formatting allowlist, removes unsafe elements and attributes, normalizes links, and converts the note to a predictable payload with updater identity and timestamps.",
    rows: [
      {
        id: "finance-note-sanitizer",
        title: "Allowlisted rich-text sanitizer",
        summary:
          "Preserves supported paragraphs, headings, lists, emphasis, code, line breaks, and safe links while removing scripts, event handlers, unsupported styles, and unsafe URL schemes.",
        badgeLabel: "CONTENT SAFETY",
        badgeClass: "code-logic",
        details: [],
        security: true,
      },
      {
        id: "finance-note-persistence",
        title: "Single shared note record",
        summary:
          "Fetches the newest overview note and upserts the normalized value under the stable admin note key.",
        badgeLabel: "ADMIN NOTE",
        badgeClass: "integration",
        details: [{ label: "Table", values: ["admin_notes"], kind: "tables" }],
      },
    ],
    reviewedSource: "Manual review of HTML parsing and allowlist, URL/attribute handling, payload construction, fetch, and upsert behavior.",
  },
  {
    path: "/src/services/finance-dashboard/finance-notes.test.ts",
    header: testHeader,
    metric: "46 lines",
    metricDescription: "Sanitizer tests for finance overview note HTML.",
    description:
      "Checks that approved formatting survives, dangerous elements and attributes are stripped, and the saved payload uses the stable overview-note identity and sanitized body.",
    rows: [],
    reviewedSource: "Manual review of all finance-note sanitizer and payload assertions.",
  },
  {
    path: "/src/services/finance-dashboard/finance-users.ts",
    header: serviceHeader,
    metric: "143 lines",
    metricDescription: "Admin user, access, tier, story, strike, and report aggregation.",
    description:
      "Builds the Finance Dashboard user table by combining profile data, role rows, story counts, strikes, reports, and subscription-tier overrides. It resolves each user's effective tier, reports whether they can view admin UI, and saves either an admin-role change through the protected set_admin_access RPC or a tier override in app_settings.",
    rows: [
      {
        id: "finance-user-aggregation",
        title: "Cross-table user projection",
        summary:
          "Normalizes profiles and joins role, story, strike, report, and tier-override information into one dashboard row per user.",
        badgeLabel: "USER REPORT",
        badgeClass: "data-block",
        details: [{ label: "Tables", values: ["profiles", "user_roles", "stories", "app_settings"], kind: "tables" }],
      },
      {
        id: "finance-user-controls",
        title: "Tier and admin controls",
        summary:
          "Uses set_admin_access for privilege changes and stores finance tier overrides separately so billing display state is not confused with role authorization.",
        badgeLabel: "ADMIN WRITE",
        badgeClass: "integration",
        details: [{ label: "RPC", values: ["set_admin_access"], kind: "rpcs" }],
        security: true,
      },
    ],
    reviewedSource: "Manual review of all source queries, aggregation maps, effective tier resolution, admin RPC, and tier-override persistence.",
  },
  {
    path: "/src/services/gallery-data.ts",
    header: serviceHeader,
    metric: "659 lines",
    metricDescription: "Community publishing, discovery, engagement, reviews, and remix data boundary.",
    description:
      "Owns Chronicle's community-gallery data operations. It publishes and unpublishes scenarios, manages likes and saved-story collections, records plays and views through server functions, fetches filtered gallery pages and a user's published work, tracks remixes, submits and deletes detailed reviews, exposes public review and creator-rating projections, and loads the character previews used by scenario detail cards.",
    rows: [
      {
        id: "gallery-publishing",
        title: "Publish and unpublish",
        summary:
          "Creates or updates the public scenario record, prepares the cover through publish-cover, retains content-theme metadata, and removes publication when the owner unpublishes.",
        badgeLabel: "PUBLISHING",
        badgeClass: "integration",
        details: [
          { label: "Table", values: ["published_scenarios"], kind: "tables" },
          { label: "Edge Function", values: ["publish-cover"], kind: "edges" },
        ],
      },
      {
        id: "gallery-data-interactions",
        title: "Likes, saves, plays, views, and remixes",
        summary:
          "Reads and toggles the user's collection relationships, records server-owned play/view counters, and stores remix lineage between a source publication and the new scenario.",
        badgeLabel: "ENGAGEMENT",
        badgeClass: "integration",
        details: [
          { label: "Tables", values: ["scenario_likes", "saved_scenarios", "remixed_scenarios"], kind: "tables" },
          { label: "RPCs", values: ["record_scenario_play", "record_scenario_view"], kind: "rpcs" },
        ],
      },
      {
        id: "gallery-discovery",
        title: "Filtered public discovery",
        summary:
          "Uses server-side gallery and public-profile functions to return sort/filter pages with creator, content-theme, and interaction data rather than exposing raw private scenario rows.",
        badgeLabel: "PUBLIC READ",
        badgeClass: "api-call",
        details: [{ label: "RPCs", values: ["fetch_gallery_scenarios", "get_public_profiles", "get_saved_scenarios_for_user"], kind: "rpcs" }],
      },
      {
        id: "gallery-reviews",
        title: "Scenario reviews and creator rating",
        summary:
          "Persists one detailed review per user and publication, exposes privacy-safe public review rows, and retrieves the creator's weighted aggregate rating.",
        badgeLabel: "REVIEWS",
        badgeClass: "integration",
        details: [
          { label: "Table", values: ["scenario_reviews"], kind: "tables" },
          { label: "RPCs", values: ["get_public_scenario_reviews", "get_creator_overall_rating"], kind: "rpcs" },
        ],
      },
    ],
    reviewedSource: "Manual review of every exported gallery operation, table/RPC/edge boundary, interaction identity, filtering, review persistence, creator rating, and character preview mapping.",
  },
  {
    path: "/src/services/review-ratings.ts",
    header: serviceHeader,
    metric: "84 lines",
    metricDescription: "Weighted story-review score and star-display calculations.",
    description:
      "Defines the nine creator-review categories and their database columns, computes a weighted average from whichever scored categories are present, clamps each value to the one-to-five range, rounds the display result to the nearest half star, and splits that display value into full, half, and empty star counts.",
    rows: [],
    reviewedSource: "Manual review of category weights, partial-score normalization, clamping, half-star rounding, star breakdown, and category metadata.",
  },
  {
    path: "/src/services/subscription-tier-config.ts",
    header: serviceHeader,
    metric: "254 lines",
    metricDescription: "Shared subscription-tier defaults, normalization, persistence, and live updates.",
    description:
      "Defines Chronicle's Free, Starter, Premium, and Elite limits and feature flags, groups those features for subscription UI, normalizes an unknown stored configuration against safe defaults, loads or saves the configuration in app_settings, and subscribes to realtime changes so open pricing and finance surfaces stay synchronized.",
    rows: [
      {
        id: "subscription-tier-normalization",
        title: "Stable tier identities and safe values",
        summary:
          "Preserves the four known tier IDs, accepts only valid numeric, text, badge, and boolean values, clamps limits and prices to zero or higher, and fills absent values from checked-in defaults.",
        badgeLabel: "TIER CONTRACT",
        badgeClass: "code-logic",
        details: [],
      },
      {
        id: "subscription-tier-persistence",
        title: "Shared settings and realtime updates",
        summary:
          "Reads and upserts subscription_tiers_v1 in app_settings and listens for changes to that exact key until the caller unsubscribes.",
        badgeLabel: "LIVE CONFIG",
        badgeClass: "integration",
        details: [{ label: "Table", values: ["app_settings"], kind: "tables" }],
      },
    ],
    reviewedSource: "Manual review of tier and feature definitions, all normalization helpers, labels, load/save upsert, realtime filter, and unsubscribe cleanup.",
  },
  {
    path: "/src/services/usage-tracking.ts",
    header: serviceHeader,
    metric: "56 lines",
    metricDescription: "Fail-open browser diagnostic events for AI feature usage.",
    description:
      "Defines the client-side AI usage event vocabulary and submits diagnostic event source, metadata, and count to track-ai-usage. Tracking is deliberately fail-open: an edge or network failure is logged as a skipped metric and never blocks the user operation that produced it.",
    rows: [],
    reviewedSource: "Manual review of event categories, default source/count, edge payload, and both handled and thrown failure paths.",
  },
  {
    path: "/src/services/xai-billing.ts",
    header: serviceHeader,
    metric: "21 lines",
    metricDescription: "Admin client for normalized xAI credit and invoice data.",
    description:
      "Calls the protected xai-billing-balance edge function and returns its normalized management- or legacy-API credit totals, remaining and used balances, current-month usage, next invoice estimate, and fetch timestamp. Service errors are surfaced to the dashboard rather than replaced with invented billing values.",
    rows: [],
    reviewedSource: "Manual review of the billing response contract, protected edge invocation, and error propagation.",
  },
  {
    path: "/src/services/supabase-data.ts",
    header: integrationHeader,
    metric: "7 lines",
    metricDescription: "Stable barrel export for Chronicle persistence modules.",
    description:
      "Re-exports scenario, character, conversation, content-theme, media-setting, side-character, shared mapping, and signed-media services under one import surface. It contains no database behavior of its own; callers that import supabaseData receive the functions owned by those narrower persistence files.",
    rows: [],
    reviewedSource: "Manual review of every persistence module re-exported by the barrel.",
  },
]);
