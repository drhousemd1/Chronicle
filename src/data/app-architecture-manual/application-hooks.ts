import { defineManualArchitectureFiles } from "./types";

const hookHeader = {
  label: "HOOK" as const,
  className: "hook" as const,
  filterValue: "hook" as const,
  navAccent: "hook" as const,
};

const testHeader = {
  label: "TEST" as const,
  className: "test" as const,
  filterValue: "test" as const,
  navAccent: "test" as const,
};

export const applicationHookArchitectureFiles = defineManualArchitectureFiles([
  {
    path: "/src/hooks/use-auth.ts",
    header: hookHeader,
    metric: "65 lines",
    metricDescription: "Supabase session state and email/password authentication actions.",
    description:
      "Owns Chronicle's browser authentication state. It subscribes to Supabase auth changes before reading the existing session, exposes the current user and session with a loading flag, and provides email/password sign-up, sign-in, and sign-out actions. Sign-up returns users to the application root after email confirmation; OAuth is handled separately by the Lovable integration.",
    rows: [
      {
        id: "auth-session-lifecycle",
        title: "Session lifecycle",
        summary:
          "Keeps React state synchronized with Supabase token refreshes, sign-ins, and sign-outs, then unsubscribes when the hook is removed.",
        badgeLabel: "AUTH STATE",
        badgeClass: "hook",
        details: [
          { label: "Source", values: ["supabase.auth.onAuthStateChange", "supabase.auth.getSession"], kind: "plain" },
          { label: "Provides", values: ["user", "session", "loading", "isAuthenticated"], kind: "plain" },
        ],
      },
      {
        id: "auth-email-actions",
        title: "Email and password actions",
        summary:
          "Delegates sign-up, password sign-in, and sign-out to Supabase and returns service errors to the calling UI instead of swallowing them.",
        badgeLabel: "AUTH ACTIONS",
        badgeClass: "integration",
        details: [],
      },
    ],
    reviewedSource: "Manual review of auth listener ordering, session hydration, redirect construction, and all exposed authentication actions.",
  },
  {
    path: "/src/hooks/use-gallery-nsfw-preference.ts",
    header: hookHeader,
    metric: "101 lines",
    metricDescription: "Device-local NSFW visibility preference and adult-confirmation flow.",
    description:
      "Separates the user's request to show NSFW gallery content from the required 18+ confirmation on the current device. Both flags are stored in localStorage, but NSFW visibility is never restored unless the age-confirmation flag is also present. The access hook owns the confirmation modal state and can postpone an action until the user approves.",
    rows: [
      {
        id: "gallery-nsfw-storage",
        title: "Local preference storage",
        summary:
          "Reads and writes the visibility and age-confirmation flags defensively so blocked browser storage does not break the gallery.",
        badgeLabel: "BROWSER STATE",
        badgeClass: "data-block",
        details: [
          { label: "Keys", values: ["chronicle.gallery.showNsfw", "chronicle.gallery.nsfwAgeConfirmed"], kind: "plain" },
        ],
      },
      {
        id: "gallery-nsfw-approval",
        title: "Confirmation-gated access",
        summary:
          "Turns visibility off immediately, but routes a request to turn it on through the confirmation modal unless this device has already recorded approval.",
        badgeLabel: "AGE GATE",
        badgeClass: "code-logic",
        details: [],
      },
    ],
    reviewedSource: "Manual review of localStorage hydration, toggle behavior, deferred approval callback, confirmation, and modal cleanup.",
  },
  {
    path: "/src/hooks/use-index-authenticated-data.ts",
    header: hookHeader,
    metric: "245 lines",
    metricDescription: "Authenticated workspace hydration and deferred conversation enrichment.",
    description:
      "Loads the signed-in user's main workspace data into the Index page: owned scenarios, character library, conversation registry, backgrounds, saved and published scenarios, profile, content themes, and selected backgrounds. Every major initial request has a timeout fallback so one slow backend surface does not hold the entire shell indefinitely. Conversation rows are enriched only when the conversation tab is opened.",
    rows: [
      {
        id: "authenticated-data-hydration",
        title: "Authenticated workspace hydration",
        summary:
          "Backfills canonical world data, loads the initial scenario page and account-owned supporting data in parallel, then writes each result into its owning Index state setter.",
        badgeLabel: "DATA LOAD",
        badgeClass: "hook",
        details: [
          { label: "Primary Inputs", values: ["authenticated user ID", "scenario page size"], kind: "plain" },
          { label: "Backend Effects", values: ["canonical world_core backfill may update old scenarios", "all other startup operations are reads"], kind: "plain" },
          { label: "Failure Rule", values: ["15-20 second request fallbacks prevent an unresolved request from freezing shell loading"], kind: "plain" },
        ],
      },
      {
        id: "conversation-registry-enrichment",
        title: "Conversation-tab enrichment",
        summary:
          "Expands lightweight conversation registry rows only when the user enters conversation history and avoids repeating the work while the registry length remains unchanged.",
        badgeLabel: "DEFERRED LOAD",
        badgeClass: "code-logic",
        details: [],
      },
    ],
    reviewedSource: "Manual review of timeout wrapper, authenticated load sequence, theme ID aggregation, selected-background hydration, and conversation enrichment effect.",
  },
  {
    path: "/src/hooks/use-index-background-workspace.ts",
    header: hookHeader,
    metric: "156 lines",
    metricDescription: "User background upload, selection, overlay, and deletion state.",
    description:
      "Owns the Index page's user-background workspace. It resizes uploaded images before storage, creates the corresponding user-background record, keeps hub and image-library selections separate, updates overlay color and opacity optimistically, and removes deleted backgrounds from both storage-backed data and local React state.",
    rows: [
      {
        id: "background-upload",
        title: "Optimized background upload",
        summary:
          "Reads the selected file, resizes it to a maximum 1920 by 1080 JPEG, uploads it through the background service, creates its database row, and prepends the result to the visible library.",
        badgeLabel: "MEDIA WRITE",
        badgeClass: "integration",
        details: [],
      },
      {
        id: "background-selection-overlay",
        title: "Selection and overlay state",
        summary:
          "Persists the chosen hub or image-library background and keeps overlay edits responsive locally while the database update completes.",
        badgeLabel: "WORKSPACE STATE",
        badgeClass: "hook",
        details: [],
      },
    ],
    reviewedSource: "Manual review of FileReader flow, image resizing, storage/database calls, selection derivations, optimistic overlay update, and deletion cleanup.",
  },
  {
    path: "/src/hooks/use-index-character-workspace.ts",
    header: hookHeader,
    metric: "560 lines",
    metricDescription: "Character editing, library transfer, search, and AI-assisted authoring actions.",
    description:
      "Owns character operations shared by story editing and the reusable character library. It snapshots a character before editing so Cancel can restore an existing record or remove a newly created unsaved one, routes updates to the correct story or library collection, supports import and deletion, invokes AI Fill and AI Generate, copies story characters into the library without ID collisions, searches all supported character fields, and creates custom sections.",
    rows: [
      {
        id: "character-edit-transactions",
        title: "Edit, save, and cancel transactions",
        summary:
          "Tracks story and library edits independently, restores the pre-edit snapshot on cancellation, removes unsaved new characters, and clears tracking only after save or deletion.",
        badgeLabel: "EDIT STATE",
        badgeClass: "hook",
        details: [
          { label: "Scopes", values: ["story characters", "character library"], kind: "plain" },
          { label: "Cancel Guarantee", values: ["existing character restored exactly", "new unsaved character removed rather than retained as an empty row"], kind: "plain" },
        ],
      },
      {
        id: "character-library-boundary",
        title: "Story and library transfer",
        summary:
          "Imports a library character into the active story, updates an existing library copy when linked, or creates a new UUID-backed library copy when no link exists.",
        badgeLabel: "LIBRARY WRITE",
        badgeClass: "integration",
        details: [],
      },
      {
        id: "character-ai-authoring",
        title: "AI-assisted character authoring",
        summary:
          "Sends the selected character, current scenario, model ID, optional user prompt, and existing-detail preference to the appropriate character AI service, then applies only the returned patch.",
        badgeLabel: "AI AUTHORING",
        badgeClass: "api-call",
        details: [],
      },
      {
        id: "character-library-search",
        title: "Deep character-library search",
        summary:
          "Matches names, nicknames, role text, tags, physical appearance, current and preferred clothing, and custom section labels or values rather than searching only the title.",
        badgeLabel: "SEARCH",
        badgeClass: "code-logic",
        details: [],
      },
    ],
    reviewedSource: "Manual review of edit snapshots, story/library branching, create/import/delete actions, AI calls, library-copy identity, deep filtering, and custom-section creation.",
  },
  {
    path: "/src/hooks/use-index-character-workspace.test.ts",
    header: testHeader,
    metric: "168 lines",
    metricDescription: "Regression tests for canceling character edits.",
    description:
      "Proves that canceling an existing story-character edit restores the original object without disturbing other characters, and that canceling a newly created unsaved character removes it and clears its tracking state.",
    rows: [],
    reviewedSource: "Manual review of the hook harness and both cancellation regression cases.",
  },
  {
    path: "/src/hooks/use-index-dialog-state.ts",
    header: hookHeader,
    metric: "215 lines",
    metricDescription: "Central modal, confirmation, menu, and transfer-notice state for the Index shell.",
    description:
      "Centralizes transient interface state that would otherwise clutter the Index page: character picker, AI prompt, user menu, scenario/character/bookmark deletion, conversation deletion, remix confirmation, authentication, story import/export, transfer warnings, and both background pickers. It exposes named open, close, and open-change actions so each dialog can clear its associated target when dismissed.",
    rows: [
      {
        id: "dialog-target-ownership",
        title: "Dialog targets and cleanup",
        summary:
          "Stores the exact entity or conversation targeted by destructive and remix confirmations, then clears both the target and type when the dialog closes.",
        badgeLabel: "DIALOG STATE",
        badgeClass: "hook",
        details: [],
      },
      {
        id: "story-transfer-feedback",
        title: "Story-transfer controls and feedback",
        summary:
          "Owns import mode, export/import modal visibility, success/error/info notice text, and detailed warnings so the persistence hook can report transfer results without owning presentation state.",
        badgeLabel: "TRANSFER UI",
        badgeClass: "component",
        details: [],
      },
    ],
    reviewedSource: "Manual review of every state value and open, close, toggle, target-clear, and transfer-notice action returned by the hook.",
  },
  {
    path: "/src/hooks/use-index-scenario-lifecycle.ts",
    header: hookHeader,
    metric: "659 lines",
    metricDescription: "Scenario creation, play/edit/resume, remix, deletion, and conversation-history lifecycle.",
    description:
      "Owns transitions into and out of playable and editable scenarios. It creates new sessions from opening-dialog defaults, restores editor drafts when backend child data is unexpectedly empty, clones non-owned scenarios for remixing, creates and deletes scenarios, resumes saved conversations with paginated message state, loads older messages, and deletes individual or all conversation-history rows while keeping the local registries synchronized.",
    rows: [
      {
        id: "scenario-play-start",
        title: "New play-session creation",
        summary:
          "Loads the scenario and content themes, converts the opening dialog into the first assistant message, creates a conversation with the configured day/time progression, saves it, and updates the conversation registry before entering chat.",
        badgeLabel: "PLAY START",
        badgeClass: "integration",
        details: [],
      },
      {
        id: "scenario-edit-recovery",
        title: "Editor loading and draft recovery",
        summary:
          "Verifies ownership before editing and uses a local draft only to recover unexpectedly missing backend character data; a successful repair save clears that safety copy.",
        badgeLabel: "RECOVERY",
        badgeClass: "code-logic",
        details: [],
      },
      {
        id: "scenario-remix-delete",
        title: "Remix and deletion boundaries",
        summary:
          "Clones a non-owned scenario under a new ID, records remix lineage when available, or removes an owned scenario and its local registry state through explicit confirmation flows.",
        badgeLabel: "OWNERSHIP",
        badgeClass: "integration",
        details: [],
      },
      {
        id: "conversation-history-lifecycle",
        title: "Conversation resume and history cleanup",
        summary:
          "Restores a selected conversation, tracks whether older messages remain, appends earlier pages on demand, and reconciles local active data after deleting one or every saved conversation.",
        badgeLabel: "SESSION HISTORY",
        badgeClass: "hook",
        details: [],
      },
    ],
    reviewedSource: "Manual review of play, edit, local-draft repair, remix, create/delete, resume overlay, pagination, and individual/all conversation deletion paths.",
  },
  {
    path: "/src/hooks/use-index-scenario-persistence.ts",
    header: hookHeader,
    metric: "650 lines",
    metricDescription: "Verified scenario saving plus story import, export, and navigation safety.",
    description:
      "Owns durable scenario writes and portable story transfer from the Index shell. It migrates legacy non-UUID entity IDs before saving, requires a scenario name, writes a local safety snapshot, delegates the database transaction to the verified scenario-save service, refreshes registries, exports Markdown/JSON/RTF packages, imports supported text and document formats, copies or clears non-portable scene images, and stashes active work before navigation.",
    rows: [
      {
        id: "scenario-id-migration",
        title: "Legacy identity migration",
        summary:
          "Replaces non-UUID scenario, character, world-entry, scene, conversation, and message identifiers while preserving references used by the selected character and active conversation.",
        badgeLabel: "IDENTITY",
        badgeClass: "code-logic",
        details: [],
      },
      {
        id: "scenario-verified-save",
        title: "Verified save with local safety copy",
        summary:
          "Stores a browser draft before calling the backend save transaction, keeps it when child verification reports a mismatch, and removes it only after a verified save.",
        badgeLabel: "PERSISTENCE",
        badgeClass: "integration",
        details: [
          { label: "Required", values: ["active UUID-backed scenario", "authenticated user", "non-empty scenario name"], kind: "plain" },
          { label: "Refreshes", values: ["scenario registry", "conversation registry"], kind: "plain" },
        ],
      },
      {
        id: "story-transfer-export",
        title: "Story export",
        summary:
          "Serializes the active story and editor state to Chronicle Markdown, JSON, or RTF and downloads the generated package with a normalized, date-stamped filename.",
        badgeLabel: "EXPORT",
        badgeClass: "code-logic",
        details: [],
      },
      {
        id: "story-transfer-import",
        title: "Story import and media portability",
        summary:
          "Reads supported files, applies merge or rewrite semantics, ensures scene images are owned by the current user or cleared, updates editor state, and reports detailed warnings without silently treating partial imports as complete.",
        badgeLabel: "IMPORT",
        badgeClass: "integration",
        details: [],
      },
    ],
    reviewedSource: "Manual review of ID migration, verified save, local safety snapshots, all export formats, import modes, DOCX limits, scene-media portability, navigation stashing, and background draft saving.",
  },
  {
    path: "/src/hooks/use-index-shell-bootstrap.ts",
    header: hookHeader,
    metric: "334 lines",
    metricDescription: "Index routing guards, account bootstrap, responsive shell state, and deferred module warmup.",
    description:
      "Coordinates startup behavior that spans the whole Index shell. It resolves query-string deep links, refuses admin routes until access is confirmed, opens auth from a URL signal, persists sidebar collapse state, enforces guest-allowed tabs, refreshes cached admin status, preloads the active API-usage test session and navigation images, clears account-form feedback when leaving its page, and warms lazy chunks during browser idle time.",
    rows: [
      {
        id: "shell-query-guard",
        title: "Deep-link and admin access resolution",
        summary:
          "Normalizes old and current builder tab names, routes public tabs immediately, and sends an unverified or non-admin user to Gallery instead of honoring an admin-tool URL.",
        badgeLabel: "ROUTE GUARD",
        badgeClass: "code-logic",
        details: [],
      },
      {
        id: "shell-browser-preferences",
        title: "Responsive and browser-local shell state",
        summary:
          "Persists sidebar collapse, automatically collapses it on tablet-width screens, opens the auth modal from a one-use URL parameter, and times out transfer notices.",
        badgeLabel: "SHELL STATE",
        badgeClass: "hook",
        details: [],
      },
      {
        id: "shell-admin-preload",
        title: "Admin and test-session bootstrap",
        summary:
          "Caches verified admin access and loads the active API-usage test session only for an authenticated administrator; failures leave the protected surface unavailable rather than granting access.",
        badgeLabel: "ADMIN STATE",
        badgeClass: "integration",
        details: [],
      },
      {
        id: "shell-idle-warmup",
        title: "Deferred module warmup",
        summary:
          "Loads supplied lazy-module functions sequentially during idle time, tolerating transient chunk-fetch failures without delaying initial rendering.",
        badgeLabel: "PERFORMANCE",
        badgeClass: "code-logic",
        details: [],
      },
    ],
    reviewedSource: "Manual review of query resolution, admin checks, guest restrictions, local browser effects, test-session/nav-image preloads, account cleanup, and idle warmup cancellation.",
  },
  {
    path: "/src/hooks/use-index-shell-bootstrap.test.ts",
    header: testHeader,
    metric: "29 lines",
    metricDescription: "Access-control tests for Index query-string routing.",
    description:
      "Proves that a non-admin deep link cannot resolve the admin shell, a confirmed administrator retains the requested admin tool, and ordinary builder deep links normalize to their supported shell tab.",
    rows: [],
    reviewedSource: "Manual review of all resolveShellQueryTarget access and normalization cases.",
  },
  {
    path: "/src/hooks/use-mobile.tsx",
    header: hookHeader,
    metric: "19 lines",
    metricDescription: "Reactive viewport check for the 768-pixel mobile boundary.",
    description:
      "Exposes whether the browser viewport is narrower than 768 pixels. It initializes from the current width, listens to the matching media query, updates when that boundary changes, and removes the listener when no longer used.",
    rows: [],
    reviewedSource: "Manual review of the media-query boundary, initial measurement, event subscription, and cleanup.",
  },
]);
