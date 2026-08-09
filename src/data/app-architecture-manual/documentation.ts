import { defineManualArchitectureFiles } from "./types";
import { architectureExtraPaths } from "../architecture-extra-paths";
import { architectureFileMetrics } from "../architecture-file-metrics";

const documentationHeader = {
  label: "DOCUMENTATION" as const,
  className: "documentation" as const,
  filterValue: "documentation" as const,
  navAccent: "documentation" as const,
};

const changelogArchitectureFiles = defineManualArchitectureFiles(
  architectureExtraPaths
    .filter(
      (sourcePath) =>
        sourcePath.startsWith(
          "/docs/architecture-knowledge/changelog/entries/",
        ) && sourcePath.endsWith(".md"),
    )
    .map((sourcePath) => {
      const recordId = sourcePath.slice(
        "/docs/architecture-knowledge/changelog/entries/".length,
        -".md".length,
      );
      const isLegacyRecord = recordId.startsWith("LEGACY-QH-");
      const isCorrectionRecord = recordId.includes("-COR-");
      const lineCount = architectureFileMetrics[sourcePath]?.lineCount;
      if (typeof lineCount !== "number") {
        throw new Error(
          `Architecture metrics are missing for Changelog record ${recordId}.`,
        );
      }

      const metricDescription = isLegacyRecord
        ? `Repository-backed historical Changelog record ${recordId}.`
        : isCorrectionRecord
          ? `Repository-backed append-only Changelog correction ${recordId}.`
          : `Repository-backed accepted Chronicle Changelog record ${recordId}.`;
      const description = isLegacyRecord
        ? `Preserves ${recordId} as one canonical historical Quality Hub entry, including its original status, source lineage, exact payload hashes, reviewed Community Gallery applicability, and explicit statement that the legacy result was not reverified as modern acceptance.`
        : isCorrectionRecord
          ? `Preserves ${recordId} as an append-only clarification of an existing Changelog record. The correction identifies its target and clarified fields without replacing the immutable original history.`
          : `Records ${recordId} as one canonical accepted Chronicle closeout, including what was broken, why the change mattered, what changed, the accepted outcome, evidence limits, Issue disposition, source fingerprint, and reciprocal archived Current Work relationship.`;
      const reviewedSource = isLegacyRecord
        ? "Generated architecture inventory plus the Phase 5 receipt validation of exact identity, legacy provenance, and reviewed capability classification on August 4, 2026."
        : isCorrectionRecord
          ? "Generated architecture inventory plus operational validation of the correction target, append-only history, and effective rendered narrative."
          : "Generated architecture inventory plus protected closeout validation of the accepted narrative, Issue disposition, evidence limits, and reciprocal archive relationship on August 8, 2026.";

      return {
        path: sourcePath as `/${string}`,
        header: documentationHeader,
        metric: `${lineCount.toLocaleString("en-US")} lines`,
        metricDescription,
        description,
        rows: [],
        reviewedSource,
      };
    }),
);

export const documentationArchitectureFiles = defineManualArchitectureFiles([
  {
    path: "/docs/architecture-knowledge/chronicle-overview.md",
    header: documentationHeader,
    metric: "426 lines",
    metricDescription: "Chronicle overview, Community Gallery application-map chapter, and Admin Panel image outline.",
    description:
      "Owns Chronicle's detailed product overview, including product purpose, authored-story lifecycle, public discovery, roleplay persistence, ownership, privacy, state boundaries, failure expectations, and capability handoffs. It also supplies the populated Community Gallery application-map tab and the current Admin Panel image-and-heading outline; the other application-map tabs intentionally remain blank.",
    rows: [],
    reviewedSource: "Repository-source review of headings, asset tokens, tab boundaries, long-form content, and current Knowledge Base routing.",
  },
  {
    path: "/docs/architecture-knowledge/community-gallery.md",
    header: documentationHeader,
    metric: "921 lines",
    metricDescription: "Source-readable Community Gallery overview, UI contract, curated App Architecture, and operational-tab boundaries.",
    description:
      "Owns the stable Community Gallery purpose, ownership and access rules, discovery controls, cards, Story Detail, reviews, NSFW presentation, authentication boundaries, handoffs, every documented interface function, and the curated current-source runtime account. The React architecture component is presentation-only, Issues are rendered from issue records, and Supabase Tables reuse the shared authority document.",
    rows: [],
    reviewedSource: "August 8, 2026 repository review of routes, components, state, persistence, handoffs, repaired failure recovery, tests, and evidence boundaries.",
  },
  {
    path: "/docs/architecture-knowledge/manifest.json",
    header: documentationHeader,
    metric: "221 lines",
    metricDescription: "Repository-owned manifest for Chronicle Knowledge Base section, tab, metadata, and content routing.",
    description:
      "Records the twelve Chronicle Overview tabs, fourteen capability sections, Gallery's seven tabs, the shared three-tab placeholder contract for unfinished capabilities, review dates, operational content kinds, source-document identities, and the shared Supabase and rough-draft documents.",
    rows: [],
    reviewedSource: "Manual review of exact repository-owned order, labels, content kinds, populated-versus-blank state, metadata, shared documents, and operational-record routing.",
  },
  {
    path: "/docs/architecture-knowledge/issues/community-gallery/CG-ISSUE-001.md",
    header: documentationHeader,
    metric: "53 lines",
    metricDescription: "Canonical resolved Community Gallery request-failure Issue.",
    description:
      "Preserves the request-failure discrepancy, required behavior, repaired behavior, source evidence, evidence limits, verification dates, and resolution through accepted change CG-CHANGE-001 and archived project CG-WORK-002.",
    rows: [],
    reviewedSource: "Source review of the Gallery request service, delivered recovery branches, focused regressions, accepted evidence limits, and protected reciprocal closeout on August 8, 2026.",
  },
  {
    path: "/docs/current-work/active/community-gallery/CG-WORK-001.md",
    header: documentationHeader,
    metric: "1,252 lines",
    metricDescription: "Canonical active project for the Community Gallery Knowledge Base pilot.",
    description:
      "Owns the still-active Community Gallery documentation pilot's Resume Here state, outcome contract, verified facts, scope, decisions, traceability chain, bounded work steps, narrow proof claims, and append-only history. It is the sole active Primary project after the separate Gallery runtime Issue completed its accepted closeout, while the documentation pilot's own final visual-review phase remains unstarted.",
    rows: [],
    reviewedSource: "Operational-contract validation, rendered Current Work review, the completed Changelog narrative recovery, protected project creation, and the synchronized separation between the secondary documentation pilot and primary runtime repair through August 8, 2026.",
  },
  {
    path: "/docs/current-work/archive/community-gallery/CG-WORK-002.md",
    header: documentationHeader,
    metric: "342 lines",
    metricDescription: "Canonical archived project for Community Gallery request-failure recovery.",
    description:
      "Preserves the complete bounded repair for the Gallery discrepancy in which a failed discovery request could appear to be a legitimate empty result or the end of the catalog. It records the investigation, implementation, evidence-based completion, accepted evidence limits, resolved Issue, reciprocal Changelog relationship, and guarded terminal closeout without claiming deployment or unrelated Gallery behavior.",
    rows: [],
    reviewedSource: "Operational-contract validation, pre-repair regression evidence, bounded source repair, complete repository checks, independent review, and local delivery-surface inspection through August 8, 2026.",
  },
  {
    path: "/docs/current-work/archive/community-gallery/.gitkeep",
    header: documentationHeader,
    metric: "1 lines",
    metricDescription: "Directory anchor for archived Community Gallery work records.",
    description:
      "Keeps the canonical Community Gallery work archive present beside terminal records. Archived CG-WORK-002 demonstrates the reciprocal accepted-change and resolved-Issue closeout; Deferred work remains visible in Current Work rather than being archived.",
    rows: [],
    reviewedSource: "Manual review of the populated archive directory, CG-WORK-002 reciprocal closeout, and terminal-record placement rule on August 8, 2026.",
  },
  {
    path: "/docs/architecture-knowledge/changelog/entries/.gitkeep",
    header: documentationHeader,
    metric: "1 lines",
    metricDescription: "Retained directory anchor for Chronicle's shared Changelog records.",
    description:
      "Keeps the one canonical repository Changelog directory present across empty and populated states. Modern accepted closeouts, preserved historical Quality Hub records, and append-only corrections all belong here as separate Markdown records; capability pages select from this same source instead of maintaining copied histories.",
    rows: [],
    reviewedSource: "Manual review of the shared Changelog source boundary and its accepted, legacy, and correction record contract through the Phase 5 import on August 4, 2026.",
  },
  {
    path: "/docs/architecture-knowledge/changelog/migration-receipt.md",
    header: documentationHeader,
    metric: "5,062 lines",
    metricDescription: "Canonical receipt for the complete legacy Quality Hub Changelog migration.",
    description:
      "Accounts for all 203 migrated Quality Hub identities, their captured-source hashes and differences, the approved owner-union selection rationale, privacy-safe repository transcription, Community Gallery applicability, and the exact generated Markdown hash for every installed record. It preserves the unrecoverable earlier 170-entry membership as an explicit provenance limit rather than presenting it as known history.",
    rows: [],
    reviewedSource: "Exact receipt-to-record validation, source-package hash verification, privacy scan, and canonical reconciliation on August 4, 2026.",
  },
  ...changelogArchitectureFiles,
  {
    path: "/docs/architecture-knowledge/supabase-tables.md",
    header: documentationHeader,
    metric: "15 lines",
    metricDescription: "Shared Supabase authority, verification, and Lovable-handoff instruction.",
    description:
      "Directs every capability to the protected Supabase Schema Reference, identifies the checked-in source module, forbids agents from inventing backend structure, explains that Lovable controls the live project, and requires any Lovable schema change to update the Codex-accessible reference.",
    rows: [],
    reviewedSource: "Manual review of the application link, source path, verification scope, no-guessing rule, Lovable execution boundary, and synchronization requirement.",
  },
  {
    path: "/docs/architecture-knowledge/chronicle-application-manual-writer-rough-draft.md",
    header: documentationHeader,
    metric: "126 lines",
    metricDescription: "Visible historical rough draft for the future Chronicle application-manual writing skill.",
    description:
      "Preserves the historical monospaced rough draft beneath the capability sections. It describes intended research depth, source-truth rules, writing standards, and tab concepts for later reconciliation, but it is displayed as a draft and does not override the active repository manifest.",
    rows: [],
    reviewedSource: "Manual review of draft labeling, full visible text, and its non-authoritative relationship to the repository manifest.",
  },
  {
    path: "/.lovable/notes/byok-routing-investigation.md",
    header: documentationHeader,
    metric: "72 lines",
    metricDescription: "Lovable-side incident investigation note.",
    description: "Records the symptoms, suspected gateway-routing cause, affected frontend and edge-function files, known-correct routes, and recovery steps for a prior Bring Your Own Key routing problem. It is an incident reference, not an active runtime configuration.",
    rows: [{
      id: "byok-routing-investigation",
      title: "BYOK routing incident record",
      summary: "Preserves the troubleshooting path to reuse if direct provider keys begin bypassing the expected gateway or proxy route again.",
      badgeLabel: "DOCUMENTATION",
      badgeClass: "documentation",
      details: [
        { label: "Covers", values: ["observed routing symptoms", "suspected cause", "files to inspect", "known-correct functions", "recurrence recovery steps"], kind: "plain" },
        { label: "Requires", values: ["current code and deployed edge configuration must be rechecked before applying these historical notes"], kind: "plain" },
      ],
    }],
    reviewedSource: "Manual review of every section heading and the documented incident resolution.",
  },
  {
    path: "/.lovable/plan.md",
    header: documentationHeader,
    metric: "39 lines",
    metricDescription: "Lovable deployment plan for the synchronized roleplay Edge Function bundle.",
    description: "Records a narrowly scoped deployment plan for six roleplay Edge Functions at a verified source revision, explains how two shared artifact-identity modules enter those bundles transitively, lists log-based startup verification, and explicitly excludes schema, policy, secret, storage, and unrelated function changes.",
    rows: [{
      id: "roleplay-edge-deployment-plan",
      title: "Six-function roleplay deployment",
      summary: "Limits the deployment to chat and five roleplay support functions whose source matches the requested overhaul revision, with boot-log verification and a stop-on-error boundary.",
      badgeLabel: "DOCUMENTATION",
      badgeClass: "documentation",
      security: true,
      details: [
        { label: "Deploys", values: ["chat", "compress-day-memories", "evaluate-goal-alignment", "evaluate-goal-progress", "extract-character-updates", "extract-memory-events"], kind: "plain" },
        { label: "Does Not Change", values: ["database schema", "RLS", "storage", "authentication", "secrets", "unrelated Edge Functions"], kind: "plain" },
      ],
    }],
    reviewedSource: "Manual review of synchronized revision evidence, exact function list, shared import path, verification steps, and non-goals.",
  },
  {
    path: "/docs/guides/GUIDE_STYLE_RULES.md",
    header: documentationHeader,
    metric: "140 lines",
    metricDescription: "Authoring standard for Chronicle page guides.",
    description: "Defines the required heading hierarchy, table rules, code-block formatting, good-versus-bad content patterns, section-specific expectations, and the thirteen-section template used when Chronicle's operator-facing page guides are written or refreshed.",
    rows: [{
      id: "guide-document-authoring-standard",
      title: "Guide authoring standard",
      summary: "Keeps separate page guides consistent enough that agents can locate layout, interactions, data, security, dependencies, and known issues in the same order.",
      badgeLabel: "DOCUMENTATION",
      badgeClass: "documentation",
      details: [
        { label: "Defines", values: ["heading hierarchy", "table and code formatting", "specific-vs-vague writing examples", "thirteen required guide sections"], kind: "plain" },
        { label: "Used By", values: ["all page-structure guides under /docs/guides"], kind: "plain" },
      ],
    }],
    reviewedSource: "Manual review of all seven rule groups and the required template.",
  },
  {
    path: "/docs/guides/account-page-structure-guide.md",
    header: documentationHeader,
    metric: "160 lines",
    metricDescription: "Account-page architecture guide.",
    description: "Explains the Account surface across public profile, settings, and subscription tabs, including its layout, controls, modals, profile data, component tree, state, styling, access controls, dependencies, and known issues.",
    rows: [{
      id: "account-page-guide",
      title: "Account surface map",
      summary: "Orients maintainers to how account profile data and subscription/settings views are composed and protected.",
      badgeLabel: "DOCUMENTATION",
      badgeClass: "documentation",
      details: [
        { label: "Primary Source Files", values: ["/src/components/account/PublicProfileTab.tsx", "/src/components/account/AccountSettingsTab.tsx", "/src/components/account/SubscriptionTab.tsx"], kind: "files" },
        { label: "Covers", values: ["layout", "UI inventory", "events and modals", "profile data", "state", "security", "cross-page dependencies"], kind: "plain" },
      ],
    }],
    reviewedSource: "Manual review of the complete guide outline and its profile-data section.",
  },
  {
    path: "/docs/guides/admin-panel-page-structure-guide.md",
    header: documentationHeader,
    metric: "314 lines",
    metricDescription: "Admin-panel architecture guide.",
    description: "Maps the ten-tile Admin hub, embedded-versus-standalone routing, tile metadata persistence, edit modal, Chronicle Knowledge Base, App Architecture, Supabase Schema Reference, Roleplay Pipeline, Quality Hub, Validation Evidence Ledger, component tree, state, styling, and layered Admin access boundary.",
    rows: [{
      id: "admin-panel-guide",
      title: "Admin tool surface map",
      summary: "Explains how the central admin route discovers, displays, edits, and opens Chronicle's internal tools.",
      badgeLabel: "DOCUMENTATION",
      badgeClass: "documentation",
      security: true,
      details: [
        { label: "Primary Source Files", values: ["/src/pages/Admin.tsx", "/src/App.tsx", "/src/components/admin/AdminToolEditModal.tsx", "/src/pages/style-guide/chronicle-knowledge-base.tsx"], kind: "files" },
        { label: "Covers", values: ["ten stable tool IDs", "embedded and protected route selection", "metadata persistence", "Admin state", "Knowledge Base integration", "security and access control", "cross-tool references"], kind: "plain" },
      ],
    }],
    reviewedSource: "Manual review of all thirteen required guide sections, ten current default tiles, every route branch, persistence flow, component tree, security boundary, and cross-page dependency.",
  },
  {
    path: "/docs/guides/app-overview-global-systems.md",
    header: documentationHeader,
    metric: "296 lines",
    metricDescription: "Application-shell and global-systems guide.",
    description: "Documents Chronicle's top-level shell, sidebar navigation, shared UI, initial data loading, authentication, user roles, component tree, global state providers, styling tokens, RLS pattern, and cross-page dependencies.",
    rows: [{
      id: "global-app-systems-guide",
      title: "Application shell and global systems",
      summary: "Shows how route-level screens sit inside the shared shell and which global providers and authentication rules they rely on.",
      badgeLabel: "DOCUMENTATION",
      badgeClass: "documentation",
      security: true,
      details: [
        { label: "Primary Source Files", values: ["/src/App.tsx", "/src/pages/Index.tsx", "/src/components/app-shell/AppShellWorkspace.tsx", "/src/hooks/use-auth.ts"], kind: "files" },
        { label: "Covers", values: ["shell layout", "navigation", "bootstrap data", "authentication and roles", "providers", "RLS expectations", "global styling"], kind: "plain" },
      ],
    }],
    reviewedSource: "Manual review of all global layout, data, auth, and dependency sections.",
  },
  {
    path: "/docs/guides/character-builder-page-structure-guide.md",
    header: documentationHeader,
    metric: "396 lines",
    metricDescription: "Character Builder architecture guide.",
    description: "Describes the Character Builder's grid and detail modes, section navigation, hardcoded and custom rows, modals, Character data shape, persistence, component tree, AI enhancement paths, security, and known defects.",
    rows: [{
      id: "character-builder-guide",
      title: "Character Builder implementation map",
      summary: "Explains how character fields, sections, media, AI helpers, progress, and persistence fit together on the dedicated builder screen.",
      badgeLabel: "DOCUMENTATION",
      badgeClass: "documentation",
      details: [
        { label: "Primary Source Files", values: ["/src/features/character-builder/CharacterBuilderScreen.tsx", "/src/features/character-builder/sections/HardcodedSection.tsx", "/src/features/character-builder/rows/HardcodedRow.tsx"], kind: "files" },
        { label: "Covers", values: ["grid/detail layout", "row contracts", "Character data", "AI fill/enhance/generate", "RLS and avatar storage", "known builder quirks"], kind: "plain" },
      ],
    }],
    reviewedSource: "Manual review of all thirteen sections and the AI/backend injection map.",
  },
  {
    path: "/docs/guides/character-library-page-structure-guide.md",
    header: documentationHeader,
    metric: "463 lines",
    metricDescription: "Character Library architecture guide.",
    description: "Documents the character-library card grid and editor, cancellation and scenario-to-library copy behavior, character persistence, component tree, events, styling, security, dependencies, and the eleven hardcoded editor sections.",
    rows: [{
      id: "character-library-guide",
      title: "Character Library implementation map",
      summary: "Explains how reusable characters are browsed, created, copied, edited, cancelled, and persisted outside a specific story.",
      badgeLabel: "DOCUMENTATION",
      badgeClass: "documentation",
      details: [
        { label: "Primary Source Files", values: ["/src/components/chronicle/CharactersTab.tsx", "/src/features/character-editor-modal/CharacterEditorModalScreen.tsx", "/src/services/persistence/characters.ts"], kind: "files" },
        { label: "Covers", values: ["grid/editor layout", "copy and cancel behavior", "character table", "component tree", "RLS", "hardcoded section inventory"], kind: "plain" },
      ],
    }],
    reviewedSource: "Manual review of the complete guide including its editor-section appendix.",
  },
  {
    path: "/docs/guides/chat-history-page-structure-guide.md",
    header: documentationHeader,
    metric: "247 lines",
    metricDescription: "Conversation-history architecture guide.",
    description: "Maps the conversation-history page, conversation cards, hover actions, deletion and rename dialogs, persistence data, state, styling, cross-page navigation, and ownership/security constraints.",
    rows: [{
      id: "chat-history-guide",
      title: "Conversation history implementation map",
      summary: "Explains how saved roleplay sessions are listed, selected, renamed, deleted, and reopened.",
      badgeLabel: "DOCUMENTATION",
      badgeClass: "documentation",
      details: [
        { label: "Primary Source Files", values: ["/src/components/chronicle/ConversationsTab.tsx", "/src/services/persistence/conversations.ts"], kind: "files" },
        { label: "Covers", values: ["history layout", "conversation card behavior", "modals", "data and state", "security", "known quirks"], kind: "plain" },
      ],
    }],
    reviewedSource: "Manual review of all thirteen guide sections.",
  },
  {
    path: "/docs/guides/chat-interface-page-structure-guide.md",
    header: documentationHeader,
    metric: "345 lines",
    metricDescription: "Live roleplay interface architecture guide.",
    description: "Documents the live chat layout, controls, message presentation, settings and media modals, LLM request path, character-state tracking, side-character discovery, memory system, debug traces, component tree, state, styling, and access boundaries.",
    rows: [{
      id: "chat-interface-guide",
      title: "Live roleplay interface map",
      summary: "Orients maintainers to the user-visible chat surface and the major runtime, persistence, memory, side-character, and debug systems it coordinates.",
      badgeLabel: "DOCUMENTATION",
      badgeClass: "documentation",
      details: [
        { label: "Primary Source Files", values: ["/src/components/chronicle/ChatInterfaceTab.tsx", "/src/services/llm.ts", "/src/features/chat-runtime/use-post-turn-support-queue.ts"], kind: "files" },
        { label: "Covers", values: ["chat UI", "Normal Send/Retry/Continue entry points", "state and memory support", "debug trace", "character-aware styling", "security"], kind: "plain" },
        { label: "Requires", values: ["current runtime code and the Roleplay Pipeline page must be checked before relying on older line references in this guide"], kind: "plain" },
      ],
    }],
    reviewedSource: "Manual review of all sections, with emphasis on LLM, state, memory, and debug architecture.",
  },
  {
    path: "/docs/guides/community-gallery-page-structure-guide.md",
    header: documentationHeader,
    metric: "358 lines",
    metricDescription: "Community Gallery architecture guide.",
    description: "Explains the gallery layout, filters, cards, detail and review modals, query/cache behavior, Supabase tables and mutations, component tree, styling, security, dependencies, and recent improvements.",
    rows: [{
      id: "community-gallery-guide",
      title: "Community Gallery implementation map",
      summary: "Shows how published stories are queried, filtered, displayed, reviewed, remixed, and protected on the public discovery surface.",
      badgeLabel: "DOCUMENTATION",
      badgeClass: "documentation",
      details: [
        { label: "Primary Source Files", values: ["/src/components/chronicle/GalleryHub.tsx", "/src/components/chronicle/GalleryStoryCard.tsx", "/src/services/gallery-data.ts"], kind: "files" },
        { label: "Covers", values: ["gallery layout and cards", "detail/review flows", "React Query cache", "tables and mutations", "RLS", "cross-page dependencies"], kind: "plain" },
      ],
    }],
    reviewedSource: "Manual review of all gallery sections and the data/cache contract.",
  },
  {
    path: "/docs/guides/edge-functions-ai-services-structure-guide.md",
    header: documentationHeader,
    metric: "177 lines",
    metricDescription: "AI service and edge-function guide.",
    description: "Inventories Chronicle's AI-facing edge functions, frontend AI services, prompt architecture, image-generation paths, constants, and known AI-layer risks. Several size estimates and orchestration notes are historical and must be checked against current code.",
    rows: [{
      id: "ai-service-guide",
      title: "AI and edge-function map",
      summary: "Provides a cross-cutting index for model calls, prompt ownership, browser services, and server-side AI gateways.",
      badgeLabel: "DOCUMENTATION",
      badgeClass: "documentation",
      details: [
        { label: "Primary Source Files", values: ["/src/services/llm.ts", "/src/services/character-ai.ts", "/src/services/world-ai.ts", "/supabase/functions/chat/index.ts"], kind: "files" },
        { label: "Covers", values: ["edge-function inventory", "frontend AI services", "system prompts", "known AI bugs", "image calls", "model configuration"], kind: "plain" },
        { label: "Requires", values: ["current App Architecture and Roleplay Pipeline records override historical line counts or retired orchestration described here"], kind: "plain" },
      ],
    }],
    reviewedSource: "Manual review of the edge inventory, frontend services, prompt architecture, and known-risk sections.",
  },
  {
    path: "/docs/guides/image-library-page-structure-guide.md",
    header: documentationHeader,
    metric: "522 lines",
    metricDescription: "Image Library architecture guide.",
    description: "Documents folder and image-grid modes, cards, image actions and lightbox behavior, picker/background modals, aspect-ratio handling, tables, private storage, signed URLs, search, component tree, security, and cross-page consumers.",
    rows: [{
      id: "image-library-guide",
      title: "Image Library implementation map",
      summary: "Explains how users organize, preview, select, and reuse privately stored images across Chronicle builders and settings.",
      badgeLabel: "DOCUMENTATION",
      badgeClass: "documentation",
      security: true,
      details: [
        { label: "Primary Source Files", values: ["/src/components/chronicle/ImageLibraryTab.tsx", "/src/components/chronicle/ImageLibraryPickerModal.tsx", "/src/services/persistence/signed-media.ts"], kind: "files" },
        { label: "Covers", values: ["folder and image UI", "modals and lightbox", "tables and RPC", "private storage and signed URLs", "search", "RLS"], kind: "plain" },
      ],
    }],
    reviewedSource: "Manual review of the full guide, including storage and RLS sections.",
  },
  {
    path: "/docs/guides/mappings/story-character-refactor-path-map.json",
    header: documentationHeader,
    metric: "26 lines",
    metricDescription: "Manual legacy-to-current source-path map.",
    description: "Maps four former monolithic story and character files to the current extracted builder, sidebar, row, utility, type, and editor modules. It is the concise path translation used when older guides or handoffs reference pre-refactor owners.",
    rows: [{
      id: "story-character-refactor-path-map",
      title: "Legacy path translation",
      summary: "Connects WorldTab, CharactersTab, CharacterEditModal, and StoryCardView references to their extracted replacement modules.",
      badgeLabel: "DOCUMENTATION",
      badgeClass: "documentation",
      details: [
        { label: "Maps", values: ["WorldTab to story-builder modules", "CharactersTab to character-builder modules", "CharacterEditModal to CharacterEditorModalScreen", "StoryCardView to ScenarioCardEditorView"], kind: "plain" },
        { label: "Used With", values: ["/docs/guides/story-character-builder-refactor-blueprint.md"], kind: "files" },
      ],
    }],
    reviewedSource: "Manual review of every source-to-target mapping.",
  },
  {
    path: "/docs/guides/quality-hub-scan-playbook.md",
    header: documentationHeader,
    metric: "62 lines",
    metricDescription: "Quality Hub scanner operating procedure.",
    description: "Defines the command entry, module checklist, log format, Supabase snapshot rule, completion criteria, and agent guidance for running the repository Quality Hub scan without silently omitting modules.",
    rows: [{
      id: "quality-hub-scan-playbook",
      title: "Quality scan operating contract",
      summary: "Specifies how npm run quality:scan should enumerate modules, record checks, reconcile backend snapshots, and report completion.",
      badgeLabel: "DOCUMENTATION",
      badgeClass: "documentation",
      details: [
        { label: "Used By", values: ["/scripts/run-quality-hub-scan.mjs", "/package.json"], kind: "files" },
        { label: "Defines", values: ["module checklist", "required logging", "Supabase snapshot handling", "completion rule", "agent-use boundaries"], kind: "plain" },
      ],
    }],
    reviewedSource: "Manual review of the complete playbook.",
  },
  {
    path: "/docs/guides/scenario-builder-page-structure-guide.md",
    header: documentationHeader,
    metric: "424 lines",
    metricDescription: "Story Builder architecture guide.",
    description: "Describes Story Builder layout, roster and media cards, publish validation, modals, Scenario data, save flow, media ownership, component tree, AI enhancement and prompt injection, security, and known defects.",
    rows: [{
      id: "story-builder-guide",
      title: "Story Builder implementation map",
      summary: "Explains how story setup fields, characters, scenes, cover media, content themes, goals, validation, AI helpers, and persistence are composed.",
      badgeLabel: "DOCUMENTATION",
      badgeClass: "documentation",
      details: [
        { label: "Primary Source Files", values: ["/src/features/story-builder/StoryBuilderScreen.tsx", "/src/features/story-builder/sidebar/StoryRosterSidebar.tsx", "/src/services/persistence/scenarios.ts"], kind: "files" },
        { label: "Covers", values: ["builder layout", "publish validation", "Scenario and WorldCore data", "media ownership", "AI enhancement and prompt injection", "RLS"], kind: "plain" },
      ],
    }],
    reviewedSource: "Manual review of all guide sections, especially save, media, prompt, and validation flows.",
  },
  {
    path: "/docs/guides/shared-elements-architecture-structure-guide.md",
    header: documentationHeader,
    metric: "383 lines",
    metricDescription: "Cross-page shared-component guide.",
    description: "Classifies imported, duplicated, and cross-page UI patterns; documents high-risk editing-field duplication; inventories shared modals, controls, arc components, and AI services; and provides a propagation checklist for changes that cross builders or pages.",
    rows: [{
      id: "shared-elements-guide",
      title: "Shared UI and service map",
      summary: "Identifies which Chronicle elements are truly shared, which remain duplicated, and where a change must be propagated to avoid builder drift.",
      badgeLabel: "DOCUMENTATION",
      badgeClass: "documentation",
      details: [
        { label: "Covers", values: ["AutoResizeTextarea duplication", "hardcoded/extra row patterns", "character editing fields", "shared pickers and modals", "arc UI", "AI service ownership", "propagation checklist"], kind: "plain" },
        { label: "Requires", values: ["current import paths must be checked because this guide intentionally records some duplication and refactor risk"], kind: "plain" },
      ],
    }],
    reviewedSource: "Manual review of the quick-reference index, per-element details, services, and propagation checklist.",
  },
  {
    path: "/docs/guides/storage-privacy-migration.md",
    header: documentationHeader,
    metric: "208 lines",
    metricDescription: "Storage privacy migration record.",
    description: "Records the public/private classification of avatar, cover, background, scene, image-library, and finance-document storage; the code paths that consume them; the completed private-storage stages; and the checks used to verify signed-URL behavior and privacy boundaries.",
    rows: [{
      id: "storage-privacy-migration-record",
      title: "Storage privacy architecture",
      summary: "Explains why each bucket is public or private and how ownership, signed URLs, portability, cleanup, and chat-runtime access were migrated.",
      badgeLabel: "DOCUMENTATION",
      badgeClass: "documentation",
      security: true,
      details: [
        { label: "Covers Buckets", values: ["avatars", "covers", "backgrounds", "scenes", "image_library", "finance_documents"], kind: "buckets" },
        { label: "Covers", values: ["bucket classification", "code paths", "private scene migration", "verification", "deferred work", "schema snapshot refresh"], kind: "plain" },
      ],
    }],
    reviewedSource: "Manual review of bucket classifications, migration stages, and final verification sections.",
  },
  {
    path: "/docs/guides/story-character-builder-refactor-blueprint.md",
    header: documentationHeader,
    metric: "418 lines",
    metricDescription: "Builder refactor blueprint and ownership record.",
    description: "Defines why Story Builder and Character Builder were split, their current ownership map, extraction targets, naming standards, duplicate-handling policy, phased migration, chain-impact risks, old-to-new mapping requirements, and completion criteria.",
    rows: [{
      id: "builder-refactor-blueprint",
      title: "Story and character builder extraction plan",
      summary: "Provides the reasoning and safety boundaries behind the extracted builder modules now present under src/features.",
      badgeLabel: "DOCUMENTATION",
      badgeClass: "documentation",
      details: [
        { label: "Maps", values: ["story builder ownership", "character builder ownership", "modal/editor duplication", "section keys", "tab naming", "legacy file retirement"], kind: "plain" },
        { label: "Uses", values: ["/docs/guides/mappings/story-character-refactor-path-map.json"], kind: "files" },
        { label: "Requires", values: ["the actual current source tree overrides any migration phase still described as future work"], kind: "plain" },
      ],
    }],
    reviewedSource: "Manual review of objectives, ownership maps, all phases, impact map, and acceptance criteria.",
  },
  {
    path: "/docs/guides/your-stories-page-structure-guide.md",
    header: documentationHeader,
    metric: "575 lines",
    metricDescription: "Your Stories page architecture guide.",
    description: "Documents the personal story hub's header, filters, backgrounds, responsive card grid, empty and pagination states, story cards, detail/share/delete/remix/background modals, data flow, events, styling, security, and known issues.",
    rows: [{
      id: "your-stories-guide",
      title: "Personal story hub implementation map",
      summary: "Explains how owned stories are loaded, filtered, displayed, opened, edited, shared, remixed, deleted, and continued.",
      badgeLabel: "DOCUMENTATION",
      badgeClass: "documentation",
      security: true,
      details: [
        { label: "Primary Source Files", values: ["/src/components/chronicle/StoryHub.tsx", "/src/components/chronicle/StoryDetailModal.tsx", "/src/services/persistence/scenarios.ts"], kind: "files" },
        { label: "Covers", values: ["hub layout and filters", "story cards", "modals", "pagination", "scenario data flow", "RLS and ownership"], kind: "plain" },
      ],
    }],
    reviewedSource: "Manual review of the full guide, including actions, data flow, and security.",
  },
  {
    path: "/docs/transfer/Additional_Instructions.md",
    header: documentationHeader,
    metric: "954 lines",
    metricDescription: "Historical multi-prompt feature-transfer handoff.",
    description: "Preserves a fourteen-prompt Lovable transfer sequence for types, utilities, story transfer, UI Audit, character and chat UI, admin tools, and validation. It is a historical implementation handoff and must not override the current codebase or current App Architecture records.",
    rows: [{
      id: "historical-transfer-instructions",
      title: "Archived feature-transfer sequence",
      summary: "Records the original dependency order, style constraints, protected areas, source excerpts, and validation steps used to transfer a prior sandbox feature set.",
      badgeLabel: "DOCUMENTATION",
      badgeClass: "documentation",
      details: [
        { label: "Covers", values: ["foundation types and utilities", "story transfer", "UI Audit", "character and chat changes", "admin integration", "per-prompt validation"], kind: "plain" },
        { label: "Historical Only", values: ["use current source files and active guides before applying any instruction from this handoff"], kind: "plain" },
      ],
    }],
    reviewedSource: "Manual review of the purpose, dependency order, global constraints, prompt sequence, and validation sections.",
  },
  {
    path: "/docs/transfer/chronicle_transfer_pack.md",
    header: documentationHeader,
    metric: "7 lines",
    metricDescription: "Archived transfer-pack placeholder.",
    description: "Marks the former generated Chronicle transfer pack as intentionally removed from source control and directs maintainers to the applicable Chronicle Knowledge Base Current Work record for active handoff data. It identifies the repository Changelog as read-only accepted history rather than an active workspace.",
    rows: [{
      id: "archived-transfer-pack-one",
      title: "Archived transfer artifact",
      summary: "Prevents an obsolete generated handoff snapshot from being mistaken for current operational documentation.",
      badgeLabel: "DOCUMENTATION",
      badgeClass: "documentation",
      details: [
        { label: "Directs To", values: ["applicable Chronicle Knowledge Base Current Work record", "repository Changelog for read-only accepted history"], kind: "plain" },
        { label: "Requires", values: ["new full snapshots belong in release artifacts rather than committed source"], kind: "plain" },
      ],
    }],
    reviewedSource: "Manual review of the complete archive notice.",
  },
  {
    path: "/docs/transfer/chronicle_transfer_pack-2.md",
    header: documentationHeader,
    metric: "7 lines",
    metricDescription: "Second archived transfer-pack placeholder.",
    description: "Marks the second former generated Chronicle transfer pack as intentionally removed from source control and directs maintainers to the applicable Chronicle Knowledge Base Current Work record for active handoff data. It identifies the repository Changelog as read-only accepted history rather than an active workspace.",
    rows: [{
      id: "archived-transfer-pack-two",
      title: "Archived transfer artifact",
      summary: "Preserves only the disposition of the second obsolete snapshot so it cannot be confused with a current project handoff.",
      badgeLabel: "DOCUMENTATION",
      badgeClass: "documentation",
      details: [
        { label: "Directs To", values: ["applicable Chronicle Knowledge Base Current Work record", "repository Changelog for read-only accepted history"], kind: "plain" },
        { label: "Requires", values: ["new full snapshots belong in release artifacts rather than committed source"], kind: "plain" },
      ],
    }],
    reviewedSource: "Manual review of the complete archive notice.",
  },
]);
