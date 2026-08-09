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

const codeHeader = {
  label: "CODE LOGIC" as const,
  className: "code-logic" as const,
  filterValue: "code-logic" as const,
  navAccent: "code-logic" as const,
};

export const pageArchitectureFiles = defineManualArchitectureFiles([
  {
    path: "/src/pages/Admin.tsx",
    header: componentHeader,
    metric: "297 lines",
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
          "Lazy-loads Image Generation, App Guide, App Dashboard, and Finance Dashboard inside the shell, while App Architecture, Chronicle Knowledge Base, Supabase Schema Reference, Roleplay Pipeline, Quality Hub, and Validation Evidence Ledger use dedicated protected routes.",
        badgeLabel: "TOOL ROUTER",
        badgeClass: "code-logic",
        details: [],
      },
    ],
    reviewedSource: "Manual review of default tools, database override merge, save rollback, standalone-route decisions, lazy embedded tools, and edit modal wiring.",
  },
  {
    path: "/src/pages/Admin.test.tsx",
    header: testHeader,
    metric: "19 lines",
    metricDescription: "Source-level regression guard for the Knowledge Base and App Architecture Admin tiles.",
    description:
      "Reads Admin.tsx and verifies that Chronicle Knowledge Base has its own stable tile ID, approved visible label, and standalone route while the existing App Architecture tile and route remain present. It protects route identity but does not perform an authenticated browser interaction.",
    rows: [],
    reviewedSource: "Manual review of the four tile, label, and route assertions.",
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
    metricDescription: "Admin repository map for reviewed files, folders, relationships, and backend references.",
    description:
      "Renders Chronicle's separate App Architecture route with filter controls, nested repository navigation, expandable file cards, generated relationship details, database references, source jumps, legend, and Markdown download. It remains the exhaustive repository lookup and is not replaced by the capability-oriented Chronicle Knowledge Base.",
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
          "Takes human-authored purpose and responsibility text from the manual registry while displaying mechanically detected imports and backend relationships as separate factual metadata; neither source is presented as runtime execution proof.",
        badgeLabel: "SOURCE TRUTH",
        badgeClass: "documentation",
        details: [],
      },
    ],
    reviewedSource: "Manual review of manual and generated inventory inputs, navigation assembly, filters, scroll behavior, file-card rendering, relationships, source links, legend, and export behavior.",
  },
  {
    path: "/src/pages/style-guide/chronicle-knowledge-base.tsx",
    header: componentHeader,
    metric: "188 lines",
    metricDescription: "Protected Chronicle Knowledge Base page and source-backed manual renderer.",
    description:
      "Renders the migrated Chronicle manual as the application map, fourteen capability sections, shared Supabase directions, Community Gallery's source-backed architecture account, and the visible manual-writer rough draft. It resolves the two checked-in image assets, renders Markdown without raw HTML injection, and provides the Chronicle white header with a chevron back to the Admin hub.",
    rows: [
      {
        id: "knowledge-base-content-renderer",
        title: "Typed content dispatch",
        summary:
          "Maps each manifest tab to blank content, source Markdown, derived issue records, or the shared Supabase reference. The Gallery architecture component wraps the Markdown presentation but does not own a separate copy of its facts.",
        badgeLabel: "KNOWLEDGE UI",
        badgeClass: "component",
        details: [
          { label: "Manifest", values: ["/docs/architecture-knowledge/manifest.json"], kind: "files" },
          { label: "Components", values: ["/src/components/admin/knowledge-base/KnowledgeSwitcher.tsx", "/src/components/admin/knowledge-base/CommunityGalleryArchitecture.tsx"], kind: "files" },
        ],
      },
      {
        id: "knowledge-base-navigation",
        title: "Protected route and specialist links",
        summary:
          "Returns to `/?tab=admin` through the header chevron and converts internal Markdown links into React Router links, including the direct Supabase Schema Reference destination.",
        badgeLabel: "NAVIGATION",
        badgeClass: "code-logic",
        details: [],
      },
    ],
    reviewedSource: "Manual review of page shell, header navigation, source Markdown mapping, asset resolution, Gallery architecture presentation boundary, all rendered sections, and rough-draft output.",
  },
  {
    path: "/src/pages/style-guide/chronicle-knowledge-base.test.tsx",
    header: testHeader,
    metric: "699 lines",
    metricDescription: "Rendered migration, route, image, architecture, issue, and Supabase-link coverage.",
    description:
      "Renders the page inside a memory router; verifies the twelve-tab application map, fourteen capability sections, Gallery's seven tabs, the shared three-tab placeholder contract, both source-backed images, source-backed Gallery architecture, one open Issue, the active Gallery project, the exact 22-record canonical Gallery Changelog projection and specialist link, the Supabase application link, and the back-chevron destination.",
    rows: [],
    reviewedSource: "Manual review of section-count assertions, representative tab content, navigation transitions, source-backed asset alternatives, and specialist-route linking.",
  },
  {
    path: "/src/pages/style-guide/changelog-record.tsx",
    header: componentHeader,
    metric: "276 lines",
    metricDescription: "Admin-protected, URL-addressable reader for one complete canonical Changelog record.",
    description:
      "Loads one identity from Chronicle's validated global Changelog registry and presents its complete source-backed narrative through the shared presenter. It distinguishes an invalid address, registry failure, unknown identity, and a known record excluded from Community Gallery scope; preserves the originating Changelog or archive return path; and never widens a Gallery-scoped request into unrelated global history.",
    rows: [
      {
        id: "changelog-record-route-state",
        title: "Truthful direct-load states",
        summary:
          "Validates the requested scope before loading, then keeps loading failure, missing identity, Gallery exclusion, and successful canonical lookup as distinct reader states.",
        badgeLabel: "ROUTE STATE",
        badgeClass: "code-logic",
        details: [],
      },
      {
        id: "changelog-record-route-return",
        title: "Source-aware return navigation",
        summary:
          "Returns to the exact Community Gallery, filtered or global Quality Hub, five-record preview, or reciprocal archived Current Work surface identified by the validated origin.",
        badgeLabel: "NAVIGATION",
        badgeClass: "component",
        details: [],
      },
    ],
    reviewedSource: "Manual review of URL parsing, global lookup, Gallery scope enforcement, canonical detail rendering, heading focus, and source-aware return navigation on August 8, 2026.",
  },
  {
    path: "/src/pages/style-guide/changelog-record.test.tsx",
    header: testHeader,
    metric: "448 lines",
    metricDescription: "Direct-load, scope, failure, correction, and archive-navigation tests for the full-record reader.",
    description:
      "Covers complete canonical loading, unknown IDs, missing or invalid scopes without registry access, Gallery exclusions, loader validation failures, focus after resolution, corrected effective and immutable history, and reciprocal accepted-record archive navigation.",
    rows: [],
    reviewedSource: "Manual review of all seven full-record route fixtures and assertions on August 8, 2026.",
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
    path: "/src/features/quality-hub/quality-hub-changelog-migration-capture-support.ts",
    header: codeHeader,
    metric: "77 lines",
    metricDescription: "Authenticated owner-reader and pre-load browser-history capture boundary for Quality Hub migration.",
    description:
      "Captures the browser's Quality Hub registry before the asynchronous owner read can replace page state and distinguishes absent, malformed, and valid local history without substituting seed data. Its authenticated reader re-verifies the expected Supabase user, selects that owner's registry and updated timestamp, validates the registry and projected Changelog, and returns the owner identity, optional email, read time, and raw registry only to the separately routed migration coordinator.",
    rows: [
      {
        id: "quality-hub-migration-owner-read",
        title: "Authenticated owner snapshot",
        summary:
          "Supplies both initial and final owner-database reads to the capture component so local or seed history cannot masquerade as the authenticated migration source.",
        badgeLabel: "OWNER READ",
        badgeClass: "integration",
        details: [
          { label: "Table", values: ["quality_hub_registries"], kind: "tables" },
          {
            label: "Consumer",
            values: ["/src/features/quality-hub/quality-hub-changelog-migration-capture.tsx"],
            kind: "files",
          },
        ],
        security: true,
      },
    ],
    reviewedSource: "Manual review of localStorage parsing and Changelog projection, absent and invalid states, authenticated-user equality, owner-row query, registry validation, and returned snapshot metadata.",
  },
  {
    path: "/src/features/quality-hub/quality-hub-changelog-migration-capture.test.tsx",
    header: testHeader,
    metric: "273 lines",
    metricDescription: "Component tests for the Quality Hub migration capture lock and export preparation states.",
    description:
      "Verifies pre-load local-history classification, authenticated owner loading, pending-save coordination, direct Codex-operated preparation, separate JSON and checksum downloads, and clipboard access for owner-only staging. It also proves that a changed owner row, changed local storage, or malformed pre-load history blocks preparation instead of exporting fallback data.",
    rows: [],
    reviewedSource: "Manual review of local capture fixtures, secure-crypto setup, owner-reader sequencing, direct readiness assertions, download and clipboard behavior, and all owner, local-storage, and malformed-data rejection cases.",
  },
  {
    path: "/src/features/quality-hub/quality-hub-changelog-migration-capture.tsx",
    header: componentHeader,
    metric: "360 lines",
    metricDescription: "Temporary read-only coordinator for authenticated Quality Hub Changelog migration capture.",
    description:
      "Runs only on the separately keyed internal Admin capture route, never on the normal Quality Hub. It reads the authenticated owner history, coordinates any pending normal-page save, rereads the owner and local sources immediately before preparation, delegates stable package construction to the migration library, and exposes waiting, loading, ready, verifying, exported, and error states. Codex can copy or download the JSON and checksum without asking the user to attest to browser-tab state.",
    rows: [
      {
        id: "quality-hub-migration-capture-sequence",
        title: "Evidence-gated capture sequence",
        summary:
          "Combines the support module's authenticated snapshots, the repository seed, live local-history comparison, and build identity into one internal export request after both live sources pass their final reread.",
        badgeLabel: "CAPTURE FLOW",
        badgeClass: "component",
        details: [
          {
            label: "Reads",
            values: [
              "/src/features/quality-hub/quality-hub-changelog-migration-capture-support.ts",
              "/src/data/ui-audit-findings.ts",
            ],
            kind: "files",
          },
          {
            label: "Serializes Through",
            values: ["/src/lib/quality-hub-changelog-migration.ts"],
            kind: "files",
          },
        ],
      },
    ],
    reviewedSource: "Manual review of the separately routed capture boundary, build-identity inputs, initial and final read ordering, local snapshot conversion, retry gates, export preparation, download and clipboard controls, status messages, source counts, and staging handoff.",
  },
  {
    path: "/src/pages/style-guide/ui-audit.tsx",
    header: componentHeader,
    metric: "1,818 lines",
    metricDescription: "Admin Quality Hub for audit findings, run history, verification, comments, and handoffs.",
    description:
      "Provides the working interface for Chronicle quality scans. The normal route hydrates the authenticated owner's Quality Hub workspace before enabling finding and run-history writes, while its visible Changelog tab and five-record Overview preview read only the repository-owned canonical history. It groups findings by scan section, supports status and verification updates, records comments and run snapshots, imports or exports non-Changelog workspace data, identifies findings that require Lovable-controlled backend work, and shows current, resolved, and run-history views. The embedded legacy Changelog is retained unchanged for compatibility but is neither rendered nor editable: upgrades, imports, user actions, and owner-database saves pass through one preservation guard. Writes remain disabled until the rendered authentication owner exactly matches the successfully hydrated owner. Existing-owner saves serialize, recheck the exact row loaded by the page, validate the returned copy, and refuse to overwrite a newer owner revision. An owner-specific browser recovery record stores the exact database base and survives a failed save; the next hydration retries it only when that complete base is unchanged. A changed or unreadable base, or a save refusal detected while the page is open, immediately locks every write until the exact recovery envelope is downloaded or explicitly discarded. Discarding triggers a fresh owner-database read before changes are enabled, so the discarded local state cannot silently return. Merely loading, hydrating, or exporting does not trigger a save. The separately keyed internal migration route remains an isolated read-only capture path and is not linked from the normal interface.",
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
        title: "Owner-registry maintenance",
        summary:
          "Updates finding status and verification, appends finding comments, captures run snapshots, and persists those deliberate non-Changelog changes only after the current authentication owner matches a successful hydration. Each existing-owner save rechecks the row and stops on a stale revision instead of overwriting newer data; failed saves retain the exact prior database base and an owner-scoped recovery copy for a safe retry. An unresolved recovery conflict blocks later edits from overwriting that copy and exposes explicit download and discard controls. Confirmed discard reloads the owner row before any new write can begin.",
        badgeLabel: "OWNER DATA",
        badgeClass: "integration",
        details: [],
      },
      {
        id: "quality-hub-handoff",
        title: "Import, export, and controlled handoff",
        summary:
          "Downloads or restores supported Quality Hub workspace data without changing repository Changelog history or the frozen embedded legacy copy, and marks database, RLS, RPC, or storage work that must be planned and executed through Lovable rather than silently treated as a frontend fix.",
        badgeLabel: "AUDIT HANDOFF",
        badgeClass: "documentation",
        details: [],
      },
    ],
    reviewedSource: "Manual review of registry contracts and normalization, canonical Changelog loading, protected legacy-history snapshots, exact auth-owner/hydrated-owner gating, owner-scoped failed-save recovery with complete base comparison, conflict locking and explicit download/discard resolution, stale-row detection, serialized conditional persistence, returned-row verification, import cancellation and rejection, export side-effect boundaries, route-specific capture mode, scan groups, filters and summaries, status/verification/comments, runs, resolved grouping, and Lovable-required markers on August 6, 2026.",
  },
  {
    path: "/src/pages/style-guide/ui-audit-changelog.test.tsx",
    header: testHeader,
    metric: "257 lines",
    metricDescription: "Page-level route and source-parity tests for Quality Hub's canonical Changelog views.",
    description:
      "Renders the real Quality Hub route and proves that the Community Gallery deep link shows the exact canonical 22-record projection, the global and invalid-capability routes show the exact 203-record registry, and the Overview's recent five records do not come from the old owner-registry Changelog. It also verifies safe invalid-view fallback, URL updates, Back and Forward restoration, stale capability removal, active navigation semantics, the visible read-only label, and the absence of Changelog mutation controls.",
    rows: [],
    reviewedSource: "Manual review of authentication and storage isolation, exact canonical ID comparisons, owner-only sentinel exclusion, route fallbacks, URL state, browser-history controls, recent-record limit, and active navigation assertion on August 5, 2026.",
  },
  {
    path: "/src/pages/style-guide/ui-audit-migration-lock.test.tsx",
    header: testHeader,
    metric: "419 lines",
    metricDescription: "Whole-page regression tests for normal Quality Hub hydration and the separate authenticated capture route.",
    description:
      "Renders the real Quality Hub page with controlled authentication and owner-registry responses. Normal-mode cases prove that no capture panel or checkbox appears, no persistence occurs merely from loading or hydration, existing rows use guarded conditional updates, a deliberate user action can initialize a proven-missing owner row, browser data from a different owner is not inherited, embedded legacy history remains unchanged, and an owner-read failure cannot overwrite database history. Capture-mode cases prove that generic mutations remain disabled while stable preparation, owner-row changes, local-storage changes, signed-out states, and read failures are handled without downloading fallback history.",
    rows: [],
    reviewedSource: "Manual review of the authentication and Supabase mocks, exact owner query and write assertions, normal-route content checks, no-load-write timing, explicit user-action persistence, capture-route locked controls, stable two-read preparation, source-change rejection, and authenticated failure states.",
  },
  {
    path: "/src/pages/style-guide/ui-audit-read-only.test.tsx",
    header: testHeader,
    metric: "438 lines",
    metricDescription: "Page-level regression tests for the permanent Quality Hub Changelog read-only cutover.",
    description:
      "Exercises the real Quality Hub page with deterministic owner-row and local-storage fixtures. It proves older local workspaces upgrade without seeded Changelog merging; edited or reordered legacy history blocks the entire import before persistence; imports without Changelog, finding status and verification changes, comments, and run snapshots remain writable while retaining the exact protected history; and export does not save. Persistence regressions cover stale and concurrent owner rows, exact-base failed-save recovery and conflicts, immediate in-session write locking, exact recovery download, owner-specific discard followed by fresh database hydration, the immediate authentication-switch gap, owner-read and browser-storage failures, late old-owner responses, serialized rapid edits, mismatched returned rows, truthful action feedback, and delayed-import cancellation after an owner switch. The delivered instructions also direct active work to capability Current Work plus guarded closeout.",
    rows: [],
    reviewedSource: "Manual review of the owner-row model, file-import simulation, local and database persistence assertions, exact legacy-history preservation, exact-base failed-save recovery, conflict locking and resolution, authentication and owner-switch races, browser-storage failure handling, serialization, export side-effect checks, and delivered How to Use wording on August 6, 2026.",
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
