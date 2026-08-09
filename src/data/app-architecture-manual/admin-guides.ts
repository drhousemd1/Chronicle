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

const testHeader = {
  label: "TEST" as const,
  className: "test" as const,
  filterValue: "test" as const,
  navAccent: "test" as const,
};

export const adminGuideArchitectureFiles = defineManualArchitectureFiles([
  {
    path: "/src/components/admin/knowledge-base/KnowledgeSwitcher.tsx",
    header: componentHeader,
    metric: "167 lines",
    metricDescription: "Reusable accessible tab, metadata, issue-count, and content-panel boundary for the Chronicle Knowledge Base.",
    description:
      "Renders one capability heading, description, compact tab rail, review metadata, and internally scrolling content panel. It owns roving tab focus, wrapping Arrow navigation, Home and End selection, scroll reset, placeholder review dates, and issue styling whose count is derived from the tab's issue records.",
    rows: [
      {
        id: "knowledge-switcher-keyboard",
        title: "Semantic tab interaction",
        summary:
          "Connects tablist, tab, and tabpanel roles through stable IDs, keeps only the selected tab in the natural tab order, and moves selection and focus with Left, Right, Home, and End keys.",
        badgeLabel: "ACCESSIBLE TABS",
        badgeClass: "component",
        details: [],
      },
      {
        id: "knowledge-switcher-issues",
        title: "Derived issue state",
        summary:
          "Keeps an empty Issues tab white and badge-free; when issue records exist, derives the red state, count badge, and accessible open-issue label directly from the array length.",
        badgeLabel: "DERIVED STATE",
        badgeClass: "code-logic",
        details: [],
      },
    ],
    reviewedSource: "Manual review of active-tab state, refs, effects, selection, keyboard handling, issue derivation, metadata fallbacks, ARIA relationships, and render callback.",
  },
  {
    path: "/src/components/admin/knowledge-base/KnowledgeSwitcher.test.tsx",
    header: testHeader,
    metric: "111 lines",
    metricDescription: "Keyboard, scroll-reset, metadata, and issue-state tests for KnowledgeSwitcher.",
    description:
      "Exercises wrapping Left and Right navigation, Home and End behavior, roving tabindex and focus, panel scroll reset, selected-tab metadata, populated issue count and accessible name, and the badge-free empty Issues state.",
    rows: [],
    reviewedSource: "Manual review of all three rendered interaction fixtures and assertions.",
  },
  {
    path: "/src/components/admin/knowledge-base/ChangelogRecordList.tsx",
    header: componentHeader,
    metric: "207 lines",
    metricDescription: "Shared read-only renderer for Chronicle's canonical repository Changelog.",
    description:
      "Loads the validated shared canonical repository Changelog, optionally selects one capability, and renders complete bordered narratives for the Community Gallery and full Quality Hub histories. Quality Hub's overview uses the same renderer for a five-record preview, and every narrative links to a dedicated read-only full-record route without creating another editable copy. Loading, validation failure, legitimate empty history, and populated history remain visibly distinct so missing or malformed source files cannot be presented as an empty Changelog.",
    rows: [
      {
        id: "canonical-changelog-projection",
        title: "One source, multiple read-only views",
        summary:
          "Uses the same effective records for the global Quality Hub history, the Community Gallery projection, and the five-record Quality Hub overview preview without maintaining copied Changelog data in any page component.",
        badgeLabel: "SOURCE OWNER",
        badgeClass: "documentation",
        details: [
          {
            label: "Loads",
            values: ["/src/data/chronicle-knowledge-base/changelog-record-sources.ts"],
            kind: "files",
          },
        ],
      },
      {
        id: "canonical-changelog-load-states",
        title: "Truthful load states",
        summary:
          "Shows a loading message while records are read, an alert when discovery or validation fails, the supplied empty message only after a valid zero-record result, and record rows only after successful validation.",
        badgeLabel: "FAILURE STATE",
        badgeClass: "code-logic",
        details: [],
      },
    ],
    reviewedSource: "Manual review of loader lifecycle, stale-result guard, capability selection, five-record preview limit, count wording, provenance labels, state branches, complete bordered narratives, and dedicated record links on August 8, 2026.",
  },
  {
    path: "/src/components/admin/knowledge-base/ChangelogRecordNarrative.tsx",
    header: componentHeader,
    metric: "590 lines",
    metricDescription: "Shared narrative presenter for accepted, historical, and corrected Changelog records.",
    description:
      "Turns one validated effective Changelog entry into either a complete primary narrative, a clearly labeled Quality Hub preview, or the full read-only record. It keeps the problem, reason, changes, result, evidence limits, Issue disposition, work-record relationship, provenance, and append-only correction history visible without clipping or inventing conclusions that are absent from imported Quality Hub history.",
    rows: [
      {
        id: "changelog-narrative-variants",
        title: "Source-faithful narrative variants",
        summary:
          "Renders modern accepted fields directly from the accepted-closeout contract, derives historical sections only from the preserved Quality Hub payload, and applies authorized corrections while retaining the immutable original and ordered correction history.",
        badgeLabel: "NARRATIVE MODEL",
        badgeClass: "documentation",
        details: [],
      },
      {
        id: "changelog-narrative-depth",
        title: "Orientation and full-record depth",
        summary:
          "Uses the same canonical entry for the complete capability and Quality Hub narratives, the bounded five-record preview, and the dedicated full-record presentation instead of maintaining copied histories.",
        badgeLabel: "SHARED VIEW",
        badgeClass: "component",
        details: [],
      },
    ],
    reviewedSource: "Manual review of accepted, legacy, preview, detail, provenance, Issue-disposition, archive, immutable-original, and correction-history branches on August 8, 2026.",
  },
  {
    path: "/src/components/admin/knowledge-base/ChangelogRecordNarrative.test.tsx",
    header: testHeader,
    metric: "550 lines",
    metricDescription: "Narrative, evidence-boundary, and correction-history component fixtures.",
    description:
      "Exercises complete accepted and historical narratives, accepted evidence and Issue disposition, reciprocal archive navigation, source-state detail, corrected effective text, immutable originals, and ordered append-only corrections. These fixtures validate rendered meaning without creating production accepted or correction records.",
    rows: [],
    reviewedSource: "Manual review of all accepted, legacy, and corrected narrative assertions on August 8, 2026.",
  },
  {
    path: "/src/components/admin/knowledge-base/changelog-record-route.ts",
    header: codeHeader,
    metric: "41 lines",
    metricDescription: "Typed URL builder for the one protected full Changelog record route.",
    description:
      "Defines the supported global or Community Gallery scope and compatible Knowledge Base, Quality Hub, overview-preview, or archive origins, normalizes incompatible URL combinations to a safe return surface, and creates one encoded record URL. Keeping this helper outside the React component preserves fast-refresh boundaries and prevents each reader from inventing a different deep-link shape.",
    rows: [],
    reviewedSource: "Manual review of record-ID encoding and the complete scope and origin unions on August 8, 2026.",
  },
  {
    path: "/src/components/admin/knowledge-base/ChangelogRecordList.test.tsx",
    header: testHeader,
    metric: "426 lines",
    metricDescription: "Component tests for canonical Changelog rows, limits, and load-state truthfulness.",
    description:
      "Exercises accepted, historical, and correction provenance labels; stable record identities; preview limits; legitimate empty history; validation errors; rejected loaders; and stale asynchronous results after the requested capability changes. These tests verify the shared renderer in isolation rather than proving either complete page route.",
    rows: [],
    reviewedSource: "Manual review of all ready, limited, empty, error, rejected-promise, and stale-loader fixtures and assertions on August 5, 2026.",
  },
  {
    path: "/src/components/admin/knowledge-base/OperationalRecordContent.tsx",
    header: componentHeader,
    metric: "412 lines",
    metricDescription: "Read-only dispatcher for Gallery Issues, Current Work, and canonical Changelog history.",
    description:
      "Renders the selected capability's parsed Issue and active Current Work records from their canonical Markdown directories, then delegates Changelog display to the shared repository-backed Changelog renderer. Each record class receives its own reviewed date and explicit empty or failure meaning instead of invented work, dates, completion, or proof.",
    rows: [
      {
        id: "operational-record-content-source-boundary",
        title: "Canonical record rendering",
        summary:
          "Selects only the record kind requested by the manifest tab and delegates Markdown display without maintaining a second editable copy of the record.",
        badgeLabel: "SOURCE OWNER",
        badgeClass: "documentation",
        details: [],
      },
      {
        id: "operational-record-content-empty-state",
        title: "Truthful absence messaging",
        summary:
          "Distinguishes an empty record directory from proof that no defects, work, or prior changes exist and preserves the Current Work authority statement even when no project is active.",
        badgeLabel: "EMPTY STATE",
        badgeClass: "code-logic",
        details: [],
      },
    ],
    reviewedSource: "Manual review of record-kind selection, Markdown rendering, authority wording, and all three empty-state branches.",
  },
  {
    path: "/src/components/admin/knowledge-base/CommunityGalleryArchitecture.tsx",
    header: componentHeader,
    metric: "20 lines",
    metricDescription: "Presentation-only boundary for the source-backed Community Gallery architecture manual.",
    description:
      "Wraps the App Architecture Markdown rendered from docs/architecture-knowledge/community-gallery.md and identifies that file as the source owner. It intentionally contains no route, component, persistence, or workflow facts, preventing the React component from becoming a second independently maintained architecture account.",
    rows: [
      {
        id: "gallery-architecture-source-boundary",
        title: "Canonical source boundary",
        summary:
          "Provides a stable presentation hook while leaving every editable architecture statement in the capability document read directly by people, agents, tests, and the renderer.",
        badgeLabel: "SOURCE OWNER",
        badgeClass: "documentation",
        details: [
          { label: "Canonical Document", values: ["/docs/architecture-knowledge/community-gallery.md"], kind: "files" },
        ],
      },
    ],
    reviewedSource: "Manual review confirming that the component contains presentation only and no duplicated Gallery architecture facts.",
  },
  {
    path: "/src/components/admin/guide/AppGuideTool.tsx",
    header: componentHeader,
    metric: "363 lines",
    metricDescription: "Database-backed application guide workspace.",
    description:
      "Owns the administrator guide-document list, selected document, Markdown body, metadata, table of contents, freshness state, create/rename/delete/save actions, mark-reviewed action, truth-level changes, and synchronization to repository Markdown through the sync-guide-to-github edge function. It registers Save and Sync All callbacks with the outer admin top bar.",
    rows: [
      {
        id: "app-guide-document-lifecycle",
        title: "Guide document lifecycle",
        summary: "Loads, creates, renames, edits, reviews, reorders, and deletes guide_documents rows while hydrating normalized freshness metadata for the sidebar and editor.",
        badgeLabel: "PERSISTENCE",
        badgeClass: "data-block",
        details: [
          { label: "Reads/Writes", values: ["guide_documents"], kind: "tables" },
          { label: "Coordinates", values: ["/src/components/admin/guide/GuideSidebar.tsx", "/src/components/admin/guide/GuideEditor.tsx", "/src/components/admin/guide/guide-freshness.ts"], kind: "files" },
          { label: "Guardrail", values: ["the selected database document and its edited Markdown remain the active source until explicitly saved"], kind: "plain" },
        ],
      },
      {
        id: "app-guide-github-sync",
        title: "Repository guide synchronization",
        summary: "Sends one document or all current documents to the server-side GitHub sync function after database operations succeed.",
        badgeLabel: "EDGE FUNCTION",
        badgeClass: "edge-fn",
        details: [
          { label: "Invokes", values: ["sync-guide-to-github"], kind: "edges" },
          { label: "Actions", values: ["upsert", "delete"], kind: "plain" },
          { label: "Failure Handling", values: ["sync failures are logged or warned but do not roll back the database document operation"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of every guide_documents operation, document hydration, top-bar registration, freshness updates, and GitHub sync call.",
  },
  {
    path: "/src/components/admin/guide/GuideEditor.tsx",
    header: componentHeader,
    metric: "470 lines",
    metricDescription: "Markdown guide editor, previewer, and search surface.",
    description:
      "Switches between editable Markdown and rendered preview, reports heading-derived table-of-contents entries to the parent, supports in-document search with next/previous matches, displays line numbers synchronized to editor scroll, shows source-freshness and truth-level controls, and exposes mark-reviewed and save actions supplied by AppGuideTool.",
    rows: [
      {
        id: "guide-editor-markdown",
        title: "Markdown editing and preview",
        summary: "Uses ReactMarkdown with GitHub-flavored Markdown and syntax highlighting, plus a theme-aware render map for headings, lists, code, tables, links, and blockquotes.",
        badgeLabel: "EDITOR",
        badgeClass: "component",
        details: [
          { label: "Uses", values: ["react-markdown", "remark-gfm", "rehype-highlight"], kind: "plain" },
          { label: "Outputs", values: ["Markdown changes", "document title changes", "heading table of contents"], kind: "plain" },
          { label: "Guardrail", values: ["rendered links open in a new tab with noopener and noreferrer"], kind: "plain" },
        ],
      },
      {
        id: "guide-editor-review-state",
        title: "Freshness and source-confidence controls",
        summary: "Displays whether the document is fresh, aging, stale, or unknown and lets an administrator change its truth level or mark the current source review complete.",
        badgeLabel: "REVIEW STATE",
        badgeClass: "context",
        details: [
          { label: "Uses", values: ["/src/components/admin/guide/guide-freshness.ts"], kind: "files" },
          { label: "Does Not Own", values: ["persistence of freshness metadata; AppGuideTool writes it"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of editor modes, Markdown renderers, TOC extraction, line gutter, search, freshness controls, and callbacks.",
  },
  {
    path: "/src/components/admin/guide/GuideLoadErrorBoundary.tsx",
    header: componentHeader,
    metric: "37 lines",
    metricDescription: "Guide-editor render error boundary.",
    description:
      "Catches rendering errors from its guide-editor descendants, replaces the failed subtree with a focused error state, and lets the administrator clear the boundary state and retry rendering. It does not log, persist, or diagnose the original exception itself.",
    rows: [],
    reviewedSource: "Manual review of derived error state, retry handler, fallback UI, and child rendering.",
  },
  {
    path: "/src/components/admin/guide/GuideSidebar.tsx",
    header: componentHeader,
    metric: "170 lines",
    metricDescription: "Guide document and heading navigation sidebar.",
    description:
      "Lists guide documents in sort order, marks the active document, shows a freshness indicator for each document, exposes create and delete callbacks, and renders the selected document's heading hierarchy as clickable table-of-contents entries. It receives all document data and mutations from AppGuideTool.",
    rows: [],
    reviewedSource: "Manual review of document list, active state, freshness styling, create/delete actions, TOC hierarchy, and theme variants.",
  },
  {
    path: "/src/components/admin/guide/guide-freshness.ts",
    header: codeHeader,
    metric: "166 lines",
    metricDescription: "Guide source-freshness policy and normalization.",
    description:
      "Defines guide truth levels and freshness metadata, safely normalizes untrusted JSON metadata, clamps review intervals to one through 365 days, patches freshness fields without discarding unrelated content, and derives fresh, aging, stale, or unknown display state from the most defensible timestamp. The default stale threshold is 21 days.",
    rows: [
      {
        id: "guide-freshness-derivation",
        title: "Freshness derivation",
        summary: "Uses the explicit last-reviewed timestamp when available, otherwise the guide row update time, and reports unknown when neither timestamp is valid.",
        badgeLabel: "POLICY",
        badgeClass: "code-logic",
        details: [
          { label: "Truth Levels", values: ["code-verified", "mixed", "inferred"], kind: "plain" },
          { label: "Freshness States", values: ["fresh", "aging", "stale", "unknown"], kind: "plain" },
          { label: "Exports", values: ["normalizeFreshnessMeta", "patchFreshnessMeta", "buildGuideFreshness", "formatFreshnessTimestamp", "getTruthLevelLabel"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of input coercion, timestamp precedence, threshold calculation, labels, and all exported helpers.",
  },
  {
    path: "/src/components/admin/styleguide/StyleGuideDownloadModal.tsx",
    header: componentHeader,
    metric: "265 lines",
    metricDescription: "Browser-side Style Guide exporter.",
    description:
      "Exports the currently rendered Style Guide content as standalone HTML, Markdown, or JSON. HTML clones the live content; Markdown and JSON walk known section and card DOM patterns to extract titles, descriptions, value rows, code examples, and warnings. Downloads are created as temporary browser Blob URLs and then revoked.",
    rows: [
      {
        id: "style-guide-export",
        title: "Rendered-content serialization",
        summary: "Transforms the contentRef DOM rather than re-reading source files, so export accuracy depends on the current Style Guide markup matching the selectors in this modal.",
        badgeLabel: "EXPORT",
        badgeClass: "code-logic",
        details: [
          { label: "Formats", values: ["HTML", "Markdown", "JSON"], kind: "plain" },
          { label: "Input", values: ["rendered Style Guide DOM under contentRef"], kind: "plain" },
          { label: "Risk", values: ["selector or inline-style changes in StyleGuideTool can silently omit content from Markdown or JSON exports"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of DOM cloning, Markdown extraction, JSON extraction, Blob download, and format selection.",
  },
  {
    path: "/src/components/admin/styleguide/StyleGuideEditsModal.tsx",
    header: componentHeader,
    metric: "452 lines",
    metricDescription: "Style Guide keep/edit review workflow.",
    description:
      "Stores Style Guide card decisions in app_settings, provides async helpers for the edits registry and keep list, and renders the keep-or-edit prompt, edit-detail form, and complete edits-list modal. Edit records can describe page-specific or app-wide changes and optionally select a replacement swatch.",
    rows: [
      {
        id: "style-guide-edit-storage",
        title: "Persistent style-review registry",
        summary: "Reads and writes the styleguide_edits and styleguide_keeps keys in app_settings while returning safe empty fallbacks when the table cannot be read.",
        badgeLabel: "PERSISTENCE",
        badgeClass: "data-block",
        details: [
          { label: "Reads/Writes", values: ["app_settings"], kind: "tables" },
          { label: "Keys", values: ["styleguide_edits", "styleguide_keeps"], kind: "plain" },
          { label: "Failure Handling", values: ["read failures return fallback data; write failures are logged and not rethrown"], kind: "plain" },
        ],
      },
      {
        id: "style-guide-edit-modals",
        title: "Keep, edit, and review dialogs",
        summary: "Lets an administrator keep a card unchanged, record a structured edit request, revise or remove an edit, and inspect all pending edits.",
        badgeLabel: "REVIEW FLOW",
        badgeClass: "feature",
        details: [
          { label: "Uses", values: ["/src/components/chronicle/ChooserModal.tsx"], kind: "files" },
          { label: "Output", values: ["EditEntry records with card identity, current details, comment, scope, and optional target value"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of persistence helpers, edit data model, keep/edit decision modal, edit form, swatch choice, and list management.",
  },
  {
    path: "/src/components/admin/styleguide/StyleGuideTool.tsx",
    header: componentHeader,
    metric: "558 lines",
    metricDescription: "Interactive Chronicle Style Guide and review hub.",
    description:
      "Renders Chronicle's design-token and component examples, overlays every reviewable card with Keep/Edit controls, loads saved decisions, exposes edit-count and download actions to the admin top bar, and includes the current general-purpose and scan-only agent protocols as reference content. The review state comes from StyleGuideEditsModal helpers; the visual examples themselves are authored in this file.",
    rows: [
      {
        id: "style-guide-card-review",
        title: "Card-level keep/edit overlay",
        summary: "Wraps documented visual cards with hover actions and persistent Keep or Edit markers without changing the underlying component example.",
        badgeLabel: "REVIEW FLOW",
        badgeClass: "feature",
        details: [
          { label: "Uses", values: ["/src/components/admin/styleguide/StyleGuideEditsModal.tsx"], kind: "files" },
          { label: "Registers", values: ["open download modal", "open edits list", "current edit count"], kind: "plain" },
          { label: "Guardrail", values: ["saved edit records are review instructions; they do not automatically alter application styles"], kind: "plain" },
        ],
      },
      {
        id: "style-guide-reference-content",
        title: "Visual and workflow reference",
        summary: "Provides checked-in examples of colors, typography, controls, cards, forms, and agent workflow protocols used for design and implementation review.",
        badgeLabel: "DOCUMENTATION",
        badgeClass: "documentation",
        details: [
          { label: "Download", values: ["/src/components/admin/styleguide/StyleGuideDownloadModal.tsx"], kind: "files" },
          { label: "Navigation", values: ["can switch back to the App Guide through a caller callback"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of edit context, card overlay, saved decision loading, top-bar registrations, protocols, rendered sections, and modals.",
  },
]);
