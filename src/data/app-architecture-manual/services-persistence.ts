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

export const persistenceServiceArchitectureFiles = defineManualArchitectureFiles([
  {
    path: "/src/services/persistence/character-state-snapshot-cleanup.test.ts",
    header: testHeader,
    metric: "77 lines",
    metricDescription: "Deletion-contract tests for source-linked character-state snapshots.",
    description:
      "Verifies that stale main-character and side-character snapshot cleanup deletes the exact requested row, surfaces backend deletion failures, and rejects a successful response that did not actually remove the target. This prevents superseded generation state from being treated as cleaned up when it still exists.",
    rows: [],
    reviewedSource: "Manual review of exact main and side snapshot deletion, backend error, and zero-row deletion assertions.",
  },
  {
    path: "/src/services/persistence/characters.ts",
    header: serviceHeader,
    metric: "244 lines",
    metricDescription: "Character row mapping, private-avatar hydration, and personal library CRUD.",
    description:
      "Defines the application-to-database boundary for main Character records. It maps every supported character field and structured subsection, persists private avatar paths as storage sentinels instead of expiring signed URLs, hydrates renderable avatar URLs in batches, and provides authenticated full-record and summary reads plus save, copy, and delete operations for the user's character library.",
    rows: [
      {
        id: "characters-row-mapping",
        title: "Character domain mapping",
        summary:
          "Translates snake_case database columns and nested JSON into Chronicle's Character shape and reverses that mapping for persistence, including control, role, card sections, goals, clothing, appearance, avatar placement, and timestamps.",
        badgeLabel: "DATA MAPPING",
        badgeClass: "data-block",
        details: [{ label: "Table", values: ["characters"], kind: "tables" }],
      },
      {
        id: "characters-private-avatar",
        title: "Private avatar reference handling",
        summary:
          "Persists the stable object path and storage sentinel, then batch-resolves a short-lived signed URL for display. Signed URLs are never written back as canonical avatar identity.",
        badgeLabel: "PRIVATE MEDIA",
        badgeClass: "integration",
        details: [{ label: "Bucket", values: ["character_avatars_private"], kind: "buckets" }],
        security: true,
      },
      {
        id: "characters-library",
        title: "Personal character library",
        summary:
          "Requires the current authenticated user for library lists, supports lightweight card summaries and full record fetches, marks saved rows as library-owned, creates independent copies with new IDs, and scopes deletion to library records.",
        badgeLabel: "LIBRARY CRUD",
        badgeClass: "data-block",
        details: [{ label: "Table", values: ["characters"], kind: "tables" }],
      },
    ],
    reviewedSource: "Manual review of both mapping directions, avatar sentinel and signed-URL handling, authentication, library queries, and save/copy/delete behavior.",
  },
  {
    path: "/src/services/persistence/content-themes.ts",
    header: serviceHeader,
    metric: "69 lines",
    metricDescription: "Scenario content-theme reads and upsert.",
    description:
      "Loads one scenario's selected story type, genres, character types, origin, trigger warnings, and custom tags; can batch-load those values for many scenario cards; and upserts the current theme selection under the scenario ID. Missing rows resolve to Chronicle's empty ContentThemes shape rather than an error.",
    rows: [],
    reviewedSource: "Manual review of single and multi-scenario reads, empty fallback, row mapping, and upsert payload.",
  },
  {
    path: "/src/services/persistence/conversations-memory-pruning.test.ts",
    header: testHeader,
    metric: "70 lines",
    metricDescription: "Deterministic evidence for superseded-memory pruning.",
    description:
      "Confirms that conversation memory loading returns only memories whose source message generation is still active while separately retaining debug-only pruning reports for rejected rows. The report explains why a stale memory was excluded without returning it to API Call 1.",
    rows: [],
    reviewedSource: "Manual review of active-memory output and stale-generation pruning evidence assertions.",
  },
  {
    path: "/src/services/persistence/conversations.ts",
    header: serviceHeader,
    metric: "979 lines",
    metricDescription: "Conversation, message, runtime-state, memory, snapshot, and goal evidence persistence.",
    description:
      "Owns the Supabase persistence boundary for an active roleplay conversation. It loads full or paginated message threads, preserves message and generation identity, saves conversation metadata and messages, stores tester comments, manages per-conversation character state, prunes source-linked memories against the full message identity index, and reads or writes the snapshot and goal-evidence records used to reconstruct effective runtime state.",
    rows: [
      {
        id: "conversations-thread-storage",
        title: "Conversation and message lifecycle",
        summary:
          "Maps conversation and message rows into chronological domain objects, supports recent-first loading plus older-page retrieval, upserts new messages with stable generation IDs, updates clock and title metadata, and provides registry enrichment for history lists.",
        badgeLabel: "THREAD STORAGE",
        badgeClass: "data-block",
        details: [{ label: "Tables", values: ["conversations", "messages"], kind: "tables" }],
      },
      {
        id: "conversations-debug-comments",
        title: "Generation-specific tester comments",
        summary:
          "Stores one normalized note and tag set per conversation, message, and generation, allowing Retry attempts that share a message parent to retain distinct human review comments.",
        badgeLabel: "TESTER REVIEW",
        badgeClass: "data-block",
        details: [{ label: "Table", values: ["conversation_dialog_debug_comments"], kind: "tables" }],
      },
      {
        id: "conversations-session-state",
        title: "Per-playthrough character state",
        summary:
          "Creates or hydrates a mutable state row for each main character in a conversation and applies narrowly supplied patches for identity, location, appearance, clothing, creator sections, goals, control, and private avatar references without modifying the base character card.",
        badgeLabel: "SESSION STATE",
        badgeClass: "data-block",
        details: [{ label: "Table", values: ["character_session_states"], kind: "tables" }],
      },
      {
        id: "conversations-memory-lineage",
        title: "Memory persistence and generation pruning",
        summary:
          "Fetches the complete lightweight message identity index, removes memories tied to deleted or superseded generations from active use, returns separate pruning evidence, and preserves source message and generation IDs on new bullet or synopsis rows.",
        badgeLabel: "MEMORY LINEAGE",
        badgeClass: "code-logic",
        details: [{ label: "Table", values: ["memories"], kind: "tables" }],
      },
      {
        id: "conversations-state-snapshots",
        title: "Source-linked state snapshots",
        summary:
          "Reads, upserts, and verifies deletion of main-character message snapshots keyed by character, source message, and source generation so effective-state reconstruction can reject stale Retry lineage.",
        badgeLabel: "STATE SNAPSHOTS",
        badgeClass: "data-block",
        details: [{ label: "Table", values: ["character_state_message_snapshots"], kind: "tables" }],
      },
      {
        id: "conversations-goal-evidence",
        title: "Goal completion and alignment records",
        summary:
          "Persists source-linked story-goal step derivations and one current alignment state per conversation, goal kind, optional character scope, and goal. It validates character-goal ownership and retains prior-state, scoring, trend, rationale, and evaluation timing.",
        badgeLabel: "GOAL STATE",
        badgeClass: "data-block",
        details: [{ label: "Tables", values: ["story_goal_step_derivations", "goal_alignment_states"], kind: "tables" }],
      },
    ],
    reviewedSource: "Manual review of thread pagination, message identity, registry enrichment, comment keys, session state mapping, memory pruning, snapshot cleanup, goal derivations, and alignment-state validation.",
  },
  {
    path: "/src/services/persistence/library-copy.ts",
    header: serviceHeader,
    metric: "154 lines",
    metricDescription: "Ownership-safe copy of private library images into consumer storage.",
    description:
      "Copies bytes selected from a private image library or scene object into the current user's destination bucket before a story, character, scene, cover, or background persists the reference. It never stores the source's expiring preview URL, generates a unique destination path, and returns either a public URL or a storage sentinel plus an immediate preview URL according to the destination's privacy model.",
    rows: [],
    reviewedSource: "Manual review of source and destination contracts, signed source fetch, extension inference, unique path generation, upload, and public-versus-private return values.",
  },
  {
    path: "/src/services/persistence/media-settings.test.ts",
    header: testHeader,
    metric: "75 lines",
    metricDescription: "Persistence tests for sanitized story display settings.",
    description:
      "Verifies that story UI settings are sanitized before the JSON column is updated and that a failed write is thrown to the caller instead of being silently treated as a successful background or display-settings save.",
    rows: [],
    reviewedSource: "Manual review of settings sanitization and failed-write propagation tests.",
  },
  {
    path: "/src/services/persistence/media-settings.ts",
    header: serviceHeader,
    metric: "471 lines",
    metricDescription: "Private media uploads and user-controlled visual setting persistence.",
    description:
      "Owns browser-side persistence for character avatars, story covers, scene images, page backgrounds, sidebar backgrounds, profile display data, story UI settings, and administrator navigation artwork. Private media is stored by path and sentinel and hydrated with signed URLs; background row selection, overlay settings, categories, ordering, and object deletion are kept synchronized with their tables and buckets.",
    rows: [
      {
        id: "media-settings-uploads",
        title: "Media upload boundaries",
        summary:
          "Routes character avatars and story covers to private buckets with stable paths and signed previews, keeps the scene helper's existing string return contract, and reserves public upload behavior for intentionally public surfaces.",
        badgeLabel: "STORAGE",
        badgeClass: "integration",
        details: [{ label: "Buckets", values: ["character_avatars_private", "story_covers_private", "scenes"], kind: "buckets" }],
        security: true,
      },
      {
        id: "media-settings-backgrounds",
        title: "Page and image-library backgrounds",
        summary:
          "Creates, selects, deselects, hydrates, deletes, and adjusts overlay settings for user page backgrounds, including the separate selection used by the Image Library workspace.",
        badgeLabel: "BACKGROUND STATE",
        badgeClass: "data-block",
        details: [{ label: "Table", values: ["user_backgrounds"], kind: "tables" }],
      },
      {
        id: "media-settings-sidebar",
        title: "Sidebar background collection",
        summary:
          "Maintains the sidebar-specific background table and private bucket, including selection, deletion, signed display URLs, categories, and stable sort order.",
        badgeLabel: "SIDEBAR MEDIA",
        badgeClass: "data-block",
        details: [{ label: "Table", values: ["sidebar_backgrounds"], kind: "tables" }],
      },
      {
        id: "media-settings-ui-metadata",
        title: "Profile, story, and admin visual settings",
        summary:
          "Reads the small public profile projection, writes sanitized per-story UI settings, and stores the administrator-managed navigation image map under the stable app_settings key.",
        badgeLabel: "UI SETTINGS",
        badgeClass: "data-block",
        details: [{ label: "Tables", values: ["profiles", "stories", "app_settings"], kind: "tables" }],
      },
    ],
    reviewedSource: "Manual review of all public/private upload helpers, background and sidebar CRUD, signed hydration, storage cleanup, category ordering, profile read, story settings, and navigation settings.",
  },
  {
    path: "/src/services/persistence/scenario-delete-cover-cleanup.test.ts",
    header: testHeader,
    metric: "79 lines",
    metricDescription: "Ordering tests for public-cover cleanup during story deletion.",
    description:
      "Proves deleteScenario asks publish-cover to remove the public mirror before deleting the story row, while keeping the cleanup best-effort so an absent mirror or edge-function failure cannot prevent the owner's story from being deleted.",
    rows: [],
    reviewedSource: "Manual review of edge-call ordering and nonblocking cleanup failure tests.",
  },
  {
    path: "/src/services/persistence/scenarios.ts",
    header: serviceHeader,
    metric: "734 lines",
    metricDescription: "Scenario graph loading, atomic saving, verification, deletion, remixing, and media hydration.",
    description:
      "Owns persistence for a Chronicle story as a coordinated graph of story metadata, canonical world content, UI settings, opening dialog, characters, lore entries, scenes, and conversations. It hydrates private cover, avatar, and scene media for display; normalizes older world and UI shapes; prepares ownership-safe media; writes the authored graph through save_scenario_atomic; and provides integrity verification, deletion cleanup, remix cloning, and paginated library reads.",
    rows: [
      {
        id: "scenarios-load-edit",
        title: "Full editor load",
        summary:
          "Fetches the story and all editor-owned child records, batches conversation messages by conversation ID, normalizes world/opening/UI settings, hydrates private media, and returns a complete ScenarioData graph for editing.",
        badgeLabel: "EDITOR LOAD",
        badgeClass: "data-block",
        details: [{ label: "Tables", values: ["stories", "characters", "codex_entries", "scenes", "conversations", "messages"], kind: "tables" }],
      },
      {
        id: "scenarios-load-play",
        title: "Lean playthrough load",
        summary:
          "Loads story, characters, lore, and scenes plus only the conversation count. Existing conversation messages are intentionally excluded because the selected thread is loaded separately by conversation persistence.",
        badgeLabel: "PLAY LOAD",
        badgeClass: "data-block",
        details: [],
      },
      {
        id: "scenarios-atomic-save",
        title: "Atomic scenario graph save",
        summary:
          "Normalizes world and UI fields, converts base64 or private media to stable owner-scoped references, copies cross-owner scene images, maps characters, lore, and scenes, and submits the complete graph to the ownership-protected save_scenario_atomic RPC.",
        badgeLabel: "ATOMIC SAVE",
        badgeClass: "integration",
        details: [{ label: "RPC", values: ["save_scenario_atomic"], kind: "rpcs" }],
        security: true,
      },
      {
        id: "scenarios-save-verification",
        title: "Post-save integrity check",
        summary:
          "Counts persisted characters, lore entries, and scenes, retries the atomic save once when counts are below the authored graph, and returns a boolean so the UI can distinguish a verified save from a write that remains incomplete.",
        badgeLabel: "INTEGRITY",
        badgeClass: "code-logic",
        details: [],
      },
      {
        id: "scenarios-delete-remix",
        title: "Deletion and remix ownership",
        summary:
          "Removes the public cover mirror before deleting a story, clones remixable records with new IDs and owner-safe scene images, starts the clone without conversations or side characters, and records the original-to-remix relationship without blocking the saved copy when analytics tracking fails.",
        badgeLabel: "LIFECYCLE",
        badgeClass: "data-block",
        details: [
          { label: "Edge Function", values: ["publish-cover"], kind: "edges" },
          { label: "Table", values: ["remixed_scenarios"], kind: "tables" },
        ],
      },
    ],
    reviewedSource: "Manual review of row mapping, full and play-only loaders, canonical backfills, private-media hydration, atomic save payload, integrity retry, delete ordering, ownership query, remix clone, tracking, and pagination.",
  },
  {
    path: "/src/services/persistence/scene-media-portability.test.ts",
    header: testHeader,
    metric: "86 lines",
    metricDescription: "Ownership tests for imported and remixed private scene images.",
    description:
      "Checks that scene images already owned by the current user are only hydrated, cross-owner images are copied into the current user's namespace, and an uncopyable foreign image can be explicitly cleared instead of leaving an inaccessible storage path in the imported story.",
    rows: [],
    reviewedSource: "Manual review of same-owner hydration, cross-owner copy, and clear-on-failure fixtures.",
  },
  {
    path: "/src/services/persistence/scene-media-portability.ts",
    header: serviceHeader,
    metric: "112 lines",
    metricDescription: "Private scene-image ownership enforcement for saves, imports, and remixes.",
    description:
      "Ensures every persisted private scene image lives under the destination story owner's storage prefix. Same-owner references are preserved and signed for display; foreign references are copied into the current user's scenes namespace; and failed copies either stop the save or clear the image with a warning according to the caller's explicit policy.",
    rows: [],
    reviewedSource: "Manual review of path normalization, owner extraction, same-owner hydration, cross-owner copy, throw/clear failure modes, and result counters.",
  },
  {
    path: "/src/services/persistence/shared.ts",
    header: serviceHeader,
    metric: "279 lines",
    metricDescription: "Shared persistence normalizers and storage conversion helpers.",
    description:
      "Provides the conversion primitives used by scenario, character, session-state, and side-character persistence. It safely reconstructs optional creator sections from unknown JSON, maps physical appearance and clothing between application and database naming, converts base64 media into public URLs or private storage sentinels according to the caller's bucket, and exposes the shared Supabase client and domain defaults.",
    rows: [
      {
        id: "shared-json-normalization",
        title: "Defensive nested-field normalization",
        summary:
          "Validates unknown JSON shapes for extras, personality traits, background, and extras-only sections while preserving only supported strings, flexibility values, scores, and trend values.",
        badgeLabel: "NORMALIZATION",
        badgeClass: "code-logic",
        details: [],
      },
      {
        id: "shared-character-field-maps",
        title: "Character JSON field mapping",
        summary:
          "Maps physical appearance, current clothing, and preferred clothing between Chronicle's camelCase domain names and the snake_case keys stored inside Supabase JSON columns.",
        badgeLabel: "DATA MAPPING",
        badgeClass: "data-block",
        details: [],
      },
      {
        id: "shared-base64-storage",
        title: "Base64 media conversion",
        summary:
          "Decodes data URLs into blobs and either uploads them to an explicitly public bucket or stores them in one of Chronicle's private buckets and returns a stable storage sentinel. Failures preserve the input so the caller can decide whether to stop or recover.",
        badgeLabel: "MEDIA CONVERSION",
        badgeClass: "integration",
        details: [],
      },
    ],
    reviewedSource: "Manual review of timestamp and JSON guards, all physical/clothing mappings, public/private base64 upload paths, sentinel construction, and blob decoding.",
  },
  {
    path: "/src/services/persistence/side-characters.ts",
    header: serviceHeader,
    metric: "257 lines",
    metricDescription: "Dynamic side-character records, private avatars, and generation-linked snapshots.",
    description:
      "Maps dynamically discovered side characters between Supabase and Chronicle, loads them in creation order for a conversation, persists or patches their supported identity and state fields, hydrates private avatars, and manages source-message and source-generation snapshots used by effective-state reconstruction. Snapshot deletion verifies that the exact stale row was removed.",
    rows: [
      {
        id: "side-character-persistence",
        title: "Conversation-scoped side-character lifecycle",
        summary:
          "Fetches, upserts, updates, and deletes side-character rows while retaining their first-mentioned conversation, extracted traits, custom sections, control, role, physical state, and avatar placement.",
        badgeLabel: "SIDE CHARACTER",
        badgeClass: "data-block",
        details: [{ label: "Table", values: ["side_characters"], kind: "tables" }],
      },
      {
        id: "side-character-avatar",
        title: "Private avatar handling",
        summary:
          "Persists avatar paths as private storage sentinels and batch-resolves those paths to signed display URLs without treating the expiring URL as stored identity.",
        badgeLabel: "PRIVATE MEDIA",
        badgeClass: "integration",
        details: [{ label: "Bucket", values: ["character_avatars_private"], kind: "buckets" }],
        security: true,
      },
      {
        id: "side-character-snapshots",
        title: "Generation-linked state snapshots",
        summary:
          "Reads and upserts one snapshot per side character, source message, and source generation and fails cleanup if a requested stale snapshot row was not actually deleted.",
        badgeLabel: "STATE SNAPSHOTS",
        badgeClass: "data-block",
        details: [{ label: "Table", values: ["side_character_message_snapshots"], kind: "tables" }],
      },
    ],
    reviewedSource: "Manual review of database mapping, CRUD patches, avatar sentinel hydration, snapshot lineage keys, upsert, and verified deletion.",
  },
  {
    path: "/src/services/persistence/signed-media.ts",
    header: serviceHeader,
    metric: "166 lines",
    metricDescription: "Short-lived display access for Chronicle's private storage objects.",
    description:
      "Resolves private bucket paths into short-lived signed URLs for immediate rendering and never as values to persist. It deduplicates simultaneous requests, caches URLs until shortly before expiry, batch-resolves unique paths, validates Chronicle's storage sentinel scheme against known private buckets, and converts a sentinel back into a display URL when legacy-shaped records are loaded.",
    rows: [
      {
        id: "signed-media-cache",
        title: "Signed URL cache and request deduplication",
        summary:
          "Caches each bucket/path URL for the browser session, refreshes before expiry, and shares one in-flight signing request among simultaneous callers so lists do not create redundant storage calls.",
        badgeLabel: "SIGNED ACCESS",
        badgeClass: "integration",
        details: [],
        security: true,
      },
      {
        id: "signed-media-sentinels",
        title: "Stable private-media sentinel",
        summary:
          "Builds and parses storage://bucket/path values only for Chronicle's recognized private buckets, keeping durable object identity separate from expiring browser access URLs.",
        badgeLabel: "STORAGE IDENTITY",
        badgeClass: "code-logic",
        details: [],
      },
    ],
    reviewedSource: "Manual review of private bucket list, cache timing, in-flight deduplication, batch signing, sentinel validation, resolution, and debug cache clear.",
  },
]);
