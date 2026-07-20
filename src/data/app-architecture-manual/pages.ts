import { defineManualArchitectureFiles } from "./types";

const componentHeader = {
  label: "REACT COMPONENT" as const,
  className: "component" as const,
  filterValue: "component" as const,
  navAccent: "component" as const,
};

const testHeader = {
  label: "TEST" as const,
  className: "test" as const,
  filterValue: "test" as const,
  navAccent: "test" as const,
};

export const pageArchitectureFiles = defineManualArchitectureFiles([
  {
    path: "/src/pages/Admin.tsx",
    header: componentHeader,
    metric: "279 lines",
    metricDescription: "Admin hub and router for embedded and standalone operator tools.",
    description:
      "Presents the administrator's tool library, loads embedded tools only when selected, and routes standalone documentation tools to their protected URLs. Tool titles, descriptions, and thumbnails begin from checked-in defaults and may be overridden through the app_settings admin_tool_meta record; a failed metadata write restores the previous visible list.",
    rows: [
      {
        id: "admin-tool-catalog",
        title: "Admin tool catalog and metadata",
        summary:
          "Defines the available admin tools, merges approved database overrides, ignores known stale App Dashboard descriptions, and lets an administrator edit the displayed metadata.",
        badgeLabel: "ADMIN CATALOG",
        badgeClass: "component",
        details: [
          { label: "Table", values: ["app_settings: admin_tool_meta"], kind: "tables" },
          { label: "Failure Handling", values: ["retain defaults on read failure", "roll back optimistic metadata state when persistence fails"], kind: "plain" },
        ],
      },
      {
        id: "admin-tool-routing",
        title: "Embedded and standalone tool routing",
        summary:
          "Lazy-loads Image Generation, App Guide, App Dashboard, and Finance Dashboard inside the shell, while App Architecture, Supabase Schema Reference, Roleplay Pipeline, Quality Hub, and Validation Evidence Ledger use dedicated protected routes.",
        badgeLabel: "TOOL ROUTER",
        badgeClass: "code-logic",
        details: [],
      },
    ],
    reviewedSource: "Manual review of default tools, database override merge, save rollback, standalone-route decisions, lazy embedded tools, and edit modal wiring.",
  },
  {
    path: "/src/pages/CreatorProfile.tsx",
    header: componentHeader,
    metric: "399 lines",
    metricDescription: "Public creator profile, published-work list, statistics, rating, and follow actions.",
    description:
      "Loads the creator identified by the route parameter and renders their public profile, aggregate story statistics, rating, and published works. It respects profile and published-work privacy flags, checks whether the signed-in visitor follows the creator, allows follow/unfollow writes for other users, and gives the owner a path back to profile editing.",
    rows: [
      {
        id: "creator-public-load",
        title: "Public profile and work projection",
        summary:
          "Combines the get_public_creator_profile and get_creator_stats RPCs with the gallery rating service, normalizes avatar positions and numeric counters, and maps the RPC's embedded work rows into gallery cards.",
        badgeLabel: "PUBLIC READ",
        badgeClass: "integration",
        details: [
          { label: "RPCs", values: ["get_public_creator_profile", "get_creator_stats"], kind: "rpcs" },
          { label: "Privacy", values: ["hide_profile_details blocks the page", "hide_published_works suppresses the work gallery"], kind: "plain" },
        ],
      },
      {
        id: "creator-follow-state",
        title: "Follower relationship",
        summary:
          "Reads the visitor's creator_follows row and inserts or deletes that relationship while updating the displayed follower count locally.",
        badgeLabel: "FOLLOW WRITE",
        badgeClass: "integration",
        details: [{ label: "Table", values: ["creator_follows"], kind: "tables" }],
      },
    ],
    reviewedSource: "Manual review of route identity, RPC normalization, rating request, follow lookup/write, privacy exits, owner behavior, stats, and published-work rendering.",
  },
  {
    path: "/src/pages/Gallery.tsx",
    header: componentHeader,
    metric: "122 lines",
    metricDescription: "Standalone community-gallery route with NSFW visibility controls.",
    description:
      "Wraps GalleryHub in a standalone page for community discovery. It forwards sort changes, records a play before navigating to the main shell, and uses the shared device-local adult-confirmation hook so NSFW stories remain hidden until the user explicitly approves them.",
    rows: [],
    reviewedSource: "Manual review of auth state, gallery sort, play tracking/navigation, NSFW toggle and confirmation modal, and GalleryHub props.",
  },
  {
    path: "/src/pages/Index.tsx",
    header: componentHeader,
    metric: "1,371 lines",
    metricDescription: "Primary Chronicle workspace controller and composition root.",
    description:
      "Composes the signed-in and guest Chronicle workspace. It owns the active tab, scenario, conversation, builder, account, gallery, admin, cover, theme, and top-bar coordination state; delegates coherent workflows to the use-index hooks; lazy-loads large workspace surfaces; enforces authentication around protected actions; and connects AppSidebar and AppShellTopBar commands to the currently rendered workspace. Durable business operations are delegated to services and hooks rather than implemented directly in the visual panels.",
    rows: [
      {
        id: "index-workspace-composition",
        title: "Workspace composition and navigation",
        summary:
          "Chooses the active hub, builder, character, conversation, chat, image, gallery, account, subscription, or admin surface and supplies the exact state and actions required by that surface.",
        badgeLabel: "COMPOSITION ROOT",
        badgeClass: "component",
        details: [
          { label: "Shell", values: ["AppSidebar", "AppShellTopBar", "AppShellWorkspace"], kind: "files" },
          { label: "Lazy Surfaces", values: ["Story Builder", "Character Builder", "Chat Interface", "Scenario Hub", "Gallery", "Image Library", "Conversations", "Account", "Admin"], kind: "plain" },
        ],
      },
      {
        id: "index-workflow-delegation",
        title: "Workflow delegation",
        summary:
          "Connects authenticated loading, shell bootstrap, dialog state, backgrounds, character editing, scenario lifecycle, and scenario persistence through dedicated hooks so each workflow has a narrower owner.",
        badgeLabel: "ORCHESTRATION",
        badgeClass: "hook",
        details: [],
      },
      {
        id: "index-protected-actions",
        title: "Authentication and admin boundaries",
        summary:
          "Routes guest-safe tabs normally, opens authentication before protected commands, and renders the admin surface only after the cached and refreshed admin state is true.",
        badgeLabel: "ACCESS BOUNDARY",
        badgeClass: "code-logic",
        details: [],
        security: true,
      },
      {
        id: "index-cross-surface-actions",
        title: "Cross-surface commands",
        summary:
          "Owns top-level actions that span views, including gallery play, builder back/save/publish, account profile save, story transfer, style-guide actions, scenario and conversation deletion, and background selection.",
        badgeLabel: "SHELL COMMANDS",
        badgeClass: "code-logic",
        details: [],
      },
    ],
    reviewedSource: "Manual review of imports, lazy module boundaries, state groups, every use-index hook call, auth/admin guards, shell props, active-tab rendering, modals, and cross-surface handlers.",
  },
  {
    path: "/src/pages/NotFound.tsx",
    header: componentHeader,
    metric: "24 lines",
    metricDescription: "Fallback route for unknown Chronicle URLs.",
    description:
      "Shows a 404 message for any route not matched by App.tsx, logs the missing pathname for diagnostics, and provides a direct link back to the application root.",
    rows: [],
    reviewedSource: "Manual review of pathname logging, fallback content, and home navigation.",
  },
  {
    path: "/src/pages/style-guide/api-inspector.tsx",
    header: componentHeader,
    metric: "3,023 lines",
    metricDescription: "Admin Roleplay Pipeline renderer, navigator, source viewer, and Markdown exporter.",
    description:
      "Builds the Roleplay Pipeline documentation UI from the authoritative live-map data, line-reference map, prompt-review documents, and supporting coverage audit. It normalizes those sources into navigable sections, phases, owner groups, and expandable cards; computes line badges only from mapped references; keeps the side navigation synchronized with the scrolled content; opens prompt/source snapshots in a modal; and exports the displayed pipeline as Markdown.",
    rows: [
      {
        id: "api-inspector-model",
        title: "Pipeline view-model construction",
        summary:
          "Converts live runtime sections and the supporting coverage audit into a common shell/phase/group/item model while preserving ownership, tag classification, details, source references, review metadata, and prompt snapshots.",
        badgeLabel: "VIEW MODEL",
        badgeClass: "code-logic",
        details: [],
      },
      {
        id: "api-inspector-navigation",
        title: "Synchronized navigation and expansion",
        summary:
          "Tracks the nearest visible documentation anchor, scrolls the matching rail entry into view, opens parent containers before a jump, and briefly highlights the destination.",
        badgeLabel: "NAVIGATION",
        badgeClass: "component",
        details: [],
      },
      {
        id: "api-inspector-source-export",
        title: "Prompt, source, and pipeline exports",
        summary:
          "Opens curated prompt blueprints or mapped source snippets in a modal and downloads either that artifact or the complete rendered pipeline as Markdown.",
        badgeLabel: "REVIEW EXPORT",
        badgeClass: "documentation",
        details: [],
      },
    ],
    reviewedSource: "Manual review of render contracts, source-line parsing, model builders, audit integration, navigation anchors, accordions, prompt modal, and download paths.",
  },
  {
    path: "/src/pages/style-guide/app-architecture.tsx",
    header: componentHeader,
    metric: "4,070 lines",
    metricDescription: "Current admin repository-map renderer being replaced by the manual source-backed registry.",
    description:
      "Renders Chronicle's App Architecture route with filter controls, nested repository navigation, expandable file cards, generated relationship details, database references, source jumps, legend, and Markdown download. This rebuild will replace its embedded and fallback description stack with the complete manual registry while preserving the established page layout and interactions.",
    rows: [
      {
        id: "architecture-page-rendering",
        title: "Repository navigation and file cards",
        summary:
          "Builds the left repository tree, filters visible records, keeps scroll position and active navigation synchronized, and renders each file's metric, specific purpose, and optional distinct responsibility rows.",
        badgeLabel: "ARCHITECTURE UI",
        badgeClass: "component",
        details: [],
      },
      {
        id: "architecture-page-data-boundary",
        title: "Manual profile and detected relationship boundary",
        summary:
          "The finished page must take human-authored purpose and responsibility text from the manual registry while displaying mechanically detected imports and backend relationships as separate factual metadata, never generated prose.",
        badgeLabel: "SOURCE TRUTH",
        badgeClass: "documentation",
        details: [],
      },
    ],
    reviewedSource: "Manual review of current embedded overrides, generated inventory inputs, navigation assembly, filter and scroll behavior, file-card rendering, relationship details, source links, legend, and export behavior. Metric will be refreshed after this page is rebuilt.",
  },
  {
    path: "/src/pages/style-guide/supabase-schema-reference.tsx",
    header: componentHeader,
    metric: "477 lines",
    metricDescription: "Searchable admin view of the curated Supabase schema reference.",
    description:
      "Displays the manually reviewed Supabase object reference as searchable, filterable table, function, storage, and view cards. It explains object purpose, access and security rationale, data category, sensitivity, app location, and field-level meaning; maintains independent navigation and content scrolling; and provides a legend for the reference vocabulary. The page is read-only and receives all schema content from the dedicated reference data module.",
    rows: [
      {
        id: "schema-reference-search-filter",
        title: "Object search and type filtering",
        summary:
          "Filters the same source-backed object set by object type and a normalized search index that includes names, purpose, access, locations, and row descriptions.",
        badgeLabel: "SCHEMA SEARCH",
        badgeClass: "component",
        details: [],
      },
      {
        id: "schema-reference-object-cards",
        title: "Object and field explanations",
        summary:
          "Renders one expandable object card with purpose and security rationale, then exposes the full column or resource rows with type, purpose, data category, sensitivity, and application location.",
        badgeLabel: "SCHEMA REFERENCE",
        badgeClass: "documentation",
        details: [],
      },
    ],
    reviewedSource: "Manual review of imported reference contract, legend, filter/search logic, navigation, expansion state, access splitting, object cards, and field tables.",
  },
  {
    path: "/src/pages/style-guide/ui-audit.tsx",
    header: componentHeader,
    metric: "1,530 lines",
    metricDescription: "Admin Quality Hub for audit findings, run history, verification, comments, and handoffs.",
    description:
      "Provides the working interface for Chronicle quality scans. It loads and normalizes the checked-in issue registry, groups findings by scan section, supports status and verification updates, records comments and run snapshots, exports/imports the registry, identifies findings that require Lovable-controlled backend work, and shows current, resolved, and run-history views. Mutations are sent to the local maintenance endpoint rather than written directly to Supabase.",
    rows: [
      {
        id: "quality-hub-page-registry",
        title: "Finding registry and scan groups",
        summary:
          "Organizes application-wide, page-level, and admin-tool scans into stable groups and calculates open, resolved, severity, and verification summaries from their findings.",
        badgeLabel: "QUALITY REGISTRY",
        badgeClass: "data-block",
        details: [],
      },
      {
        id: "quality-hub-maintenance",
        title: "Finding maintenance",
        summary:
          "Creates findings, updates status and verification, appends comments, captures run snapshots, and uses the local maintenance API to persist the checked-in registry.",
        badgeLabel: "LOCAL TOOLING",
        badgeClass: "integration",
        details: [],
      },
      {
        id: "quality-hub-handoff",
        title: "Import, export, and controlled handoff",
        summary:
          "Downloads or restores the registry and marks database, RLS, RPC, or storage work that must be planned and executed through Lovable rather than silently treated as a frontend fix.",
        badgeLabel: "AUDIT HANDOFF",
        badgeClass: "documentation",
        details: [],
      },
    ],
    reviewedSource: "Manual review of registry contracts and normalization, scan groups, local API writes, filters and summaries, status/verification/comments, runs, import/export, resolved grouping, and Lovable-required markers.",
  },
  {
    path: "/src/pages/style-guide/validation-evidence-ledger.tsx",
    header: componentHeader,
    metric: "214 lines",
    metricDescription: "Development-only read surface for append-only roleplay validation evidence.",
    description:
      "Loads the locally derived Validation Evidence Ledger through development-only endpoints and displays active gate counts, derived gate status, freshness, latest execution, automated and manual history counts, and legacy reconciliation. A gate modal fetches its immutable raw report by execution ID. Production builds intentionally show an unavailable state and receive no evidence files.",
    rows: [
      {
        id: "ledger-local-load",
        title: "Local-only ledger loading",
        summary:
          "Fetches the derived snapshot without browser caching only in development and distinguishes unavailable, missing, loading, ready, and error states without interpreting missing evidence as success.",
        badgeLabel: "LOCAL EVIDENCE",
        badgeClass: "integration",
        details: [],
      },
      {
        id: "ledger-derived-status",
        title: "Gate and reconciliation display",
        summary:
          "Shows stored pass/fail/error execution facts separately from derived Not Run, expected-red, manual-review, freshness, and orphaned-legacy classifications.",
        badgeLabel: "DERIVED STATUS",
        badgeClass: "data-block",
        details: [],
      },
    ],
    reviewedSource: "Manual review of development guard, snapshot fetch, source identity, summary counters, gate table, raw-report fetch, modal, and legacy reconciliation section.",
  },
  {
    path: "/src/pages/style-guide/validation-evidence-ledger.test.tsx",
    header: testHeader,
    metric: "64 lines",
    metricDescription: "Render tests for local ledger, expected-red, and production-unavailable behavior.",
    description:
      "Stubs the ledger fetch and verifies that the page renders derived validation states without relabeling expected-red execution history, and that the production/local-unavailable path exposes no evidence content.",
    rows: [],
    reviewedSource: "Manual review of the mocked ledger snapshot, expected-red rendering assertion, and local-only availability case.",
  },
]);
