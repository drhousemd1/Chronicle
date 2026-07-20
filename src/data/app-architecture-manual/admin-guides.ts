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

export const adminGuideArchitectureFiles = defineManualArchitectureFiles([
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
