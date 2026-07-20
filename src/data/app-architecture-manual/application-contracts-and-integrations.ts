import { defineManualArchitectureFiles } from "./types";

const codeLogicHeader = {
  label: "CODE LOGIC" as const,
  className: "code-logic" as const,
  filterValue: "code-logic" as const,
  navAccent: "code-logic" as const,
};

const contextHeader = {
  label: "CONTEXT PROVIDER" as const,
  className: "context" as const,
  filterValue: "context" as const,
  navAccent: "context" as const,
};

const integrationHeader = {
  label: "INTEGRATION" as const,
  className: "integration" as const,
  filterValue: "integration" as const,
  navAccent: "integration" as const,
};

const testHeader = {
  label: "TEST" as const,
  className: "test" as const,
  filterValue: "test" as const,
  navAccent: "test" as const,
};

export const applicationContractAndIntegrationArchitectureFiles = defineManualArchitectureFiles([
  {
    path: "/src/contexts/ArtStylesContext.tsx",
    header: contextHeader,
    metric: "77 lines",
    metricDescription: "Browser-safe art-style catalog shared by image-generation controls.",
    description:
      "Loads the public presentation fields for image styles through the sanitized get_public_art_styles RPC and exposes them to descendants with lookup and refresh actions. Backend prompt text never enters this context: if the RPC fails, the provider retains a small prompt-free fallback list containing only IDs, display names, thumbnails, and sort order.",
    rows: [
      {
        id: "art-style-public-boundary",
        title: "Public art-style boundary",
        summary:
          "Keeps internal generation prompts server-side while giving browser components the identifiers and thumbnails needed to select a style.",
        badgeLabel: "SAFE CATALOG",
        badgeClass: "context",
        details: [
          { label: "RPC", values: ["get_public_art_styles"], kind: "rpcs" },
          { label: "Browser Fields", values: ["id", "displayName", "thumbnailUrl", "sortOrder"], kind: "plain" },
        ],
        security: true,
      },
    ],
    reviewedSource: "Manual review of fallback initialization, RPC mapping, prompt-secrecy boundary, refresh action, lookup, loading state, and provider guard.",
  },
  {
    path: "/src/contexts/ModelSettingsContext.tsx",
    header: contextHeader,
    metric: "67 lines",
    metricDescription: "Shared selected text-model setting with local cache and profile persistence.",
    description:
      "Provides the selected Grok model ID to the application. It starts from a validated localStorage cache, then replaces that value with the authenticated user's profiles.preferred_model when available. Updates change React state immediately, refresh the local cache, and write the profile setting asynchronously.",
    rows: [
      {
        id: "model-setting-hydration",
        title: "Validated model selection",
        summary:
          "Accepts only IDs present in LLM_MODELS and falls back to the first supported model when browser or profile data is missing or stale.",
        badgeLabel: "MODEL STATE",
        badgeClass: "context",
        details: [
          { label: "Browser Key", values: ["rpg_studio_global_model"], kind: "plain" },
          { label: "Table Field", values: ["profiles.preferred_model"], kind: "tables" },
        ],
      },
    ],
    reviewedSource: "Manual review of cache initialization, authenticated profile hydration, supported-model validation, provider value, and asynchronous profile update.",
  },
  {
    path: "/src/constants/avatar-styles.ts",
    header: codeLogicHeader,
    metric: "32 lines",
    metricDescription: "Prompt-free fallback metadata for image style selection.",
    description:
      "Defines the browser-visible AvatarStyle shape, the five fallback style choices, the default style ID, and an ID lookup helper. It intentionally contains no internal image-generation prompt text; edge functions resolve that information from the database after receiving a style ID.",
    rows: [],
    reviewedSource: "Manual review of the public field contract, fallback values, default selection, lookup, and server-only prompt warning.",
  },
  {
    path: "/src/constants/content-themes.ts",
    header: codeLogicHeader,
    metric: "89 lines",
    metricDescription: "Creator-facing option lists for scenario theme classification.",
    description:
      "Supplies the fixed Character Type, Story Type, Genre, Origin, and Trigger Warning choices shown by content-theme controls. This file defines selectable labels only; it does not decide prompt behavior, which belongs to the tag-injection registry.",
    rows: [],
    reviewedSource: "Manual review of every exported option family and the separation between selectable labels and model-facing instructions.",
  },
  {
    path: "/src/constants/tag-injection-registry.ts",
    header: codeLogicHeader,
    metric: "201 lines",
    metricDescription: "Model-facing guidance associated with selected scenario themes.",
    description:
      "Maps supported content-theme labels to category, strength metadata, and scenario-agnostic prompt guidance. Lookups are case-insensitive and return softened language. The directive builder combines selected registered themes and custom tags into one STORY THEMES block that frames them as creator-approved direction rather than a checklist that must appear in every response.",
    rows: [
      {
        id: "theme-injection-registry",
        title: "Registered theme guidance",
        summary:
          "Keeps the visible theme label and its model-facing interpretation together while preserving the source category and intended strength.",
        badgeLabel: "PROMPT DATA",
        badgeClass: "context-injection",
        details: [],
      },
      {
        id: "theme-directive-builder",
        title: "Single prompt directive block",
        summary:
          "Selects known guidance, gives unknown custom tags a lighter generic treatment, and emits nothing when no themes are selected.",
        badgeLabel: "PROMPT BUILDER",
        badgeClass: "code-logic",
        details: [],
      },
    ],
    reviewedSource: "Manual review of registry contract and entries, case-insensitive lookup, softened phrasing, custom-tag handling, and final directive construction.",
  },
  {
    path: "/src/integrations/lovable/index.ts",
    header: integrationHeader,
    metric: "38 lines",
    metricDescription: "Lovable Cloud OAuth bridge for Google and Apple sign-in.",
    description:
      "Wraps Lovable Cloud OAuth for Google and Apple. It forwards the optional redirect and provider parameters, returns immediately when Lovable redirects or reports an error, and otherwise installs the returned tokens into the shared Supabase client so the normal Chronicle auth listener receives the new session.",
    rows: [],
    reviewedSource: "Manual review of provider restriction, option forwarding, redirect/error branches, Supabase token handoff, and normalized thrown-error handling.",
  },
  {
    path: "/src/integrations/supabase/client.ts",
    header: integrationHeader,
    metric: "16 lines",
    metricDescription: "Typed browser client for Chronicle's Supabase project.",
    description:
      "Creates the shared Supabase client from Vite's project URL and publishable-key environment variables and binds it to the generated Database contract. Authentication tokens are stored in browser localStorage, persisted across reloads, and refreshed automatically.",
    rows: [],
    reviewedSource: "Manual review of environment inputs, generated Database binding, and auth storage, persistence, and token-refresh configuration.",
  },
  {
    path: "/src/integrations/supabase/types.ts",
    header: integrationHeader,
    metric: "2,578 lines",
    metricDescription: "Generated TypeScript snapshot of the public Supabase schema.",
    description:
      "Describes the current public schema as TypeScript Row, Insert, and Update contracts for tables and views, plus function arguments and returns, enums, composite types, and generic lookup helpers. Application database calls use this file for compile-time field and result checking. It is generated schema evidence rather than a place for hand-authored business behavior and must be refreshed after terminal database changes.",
    rows: [
      {
        id: "supabase-generated-contract",
        title: "Generated database contract",
        summary:
          "Provides Database, Tables, TablesInsert, TablesUpdate, Enums, and CompositeTypes helpers so callers can derive exact public-schema shapes without repeating them.",
        badgeLabel: "GENERATED TYPES",
        badgeClass: "integration",
        details: [
          { label: "Source Authority", values: ["terminal Supabase schema at generation time"], kind: "plain" },
          { label: "Guardrail", values: ["regenerate after schema changes; do not manually patch individual columns"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of file generation warning, Database schema layout, table/view/function/enum coverage, generic helpers, and constants export.",
  },
  {
    path: "/src/types.ts",
    header: codeLogicHeader,
    metric: "719 lines",
    metricDescription: "Central domain contracts for stories, sessions, characters, memory, goals, and UI settings.",
    description:
      "Defines Chronicle's shared in-memory domain vocabulary. It connects messages and conversations to story time, world and goal authoring to scenario data, main and side characters to session overrides, content themes to UI settings, and post-turn persistence to memories, generation-safe character snapshots, source metadata, and goal-step derivations. It also exports the empty defaults used when builders and normalizers create supported character sections.",
    rows: [
      {
        id: "types-story-conversation",
        title: "Story and conversation contracts",
        summary:
          "Defines messages, conversations, opening-dialog settings, world data, locations, goals, scenes, scenario payloads, scenario registry rows, and conversation registry rows.",
        badgeLabel: "STORY STATE",
        badgeClass: "data-block",
        details: [],
      },
      {
        id: "types-character-state",
        title: "Character and session-state contracts",
        summary:
          "Defines main and side character profiles, control and role, physical state, clothing, personality, goals, custom sections, private media paths, and per-conversation overrides.",
        badgeLabel: "CHARACTER STATE",
        badgeClass: "data-block",
        details: [],
      },
      {
        id: "types-persistence-lineage",
        title: "Post-turn persistence and lineage",
        summary:
          "Defines durable memories, field-change provenance, main and side-character message snapshots, source message and generation identity, and goal-step derivation records.",
        badgeLabel: "SOURCE LINEAGE",
        badgeClass: "data-block",
        details: [],
      },
      {
        id: "types-defaults",
        title: "Supported empty defaults",
        summary:
          "Provides the canonical empty content-theme, physical-appearance, clothing, background, personality, relationship, secret, fear, and side-character shapes used by creation and normalization code.",
        badgeLabel: "DEFAULTS",
        badgeClass: "code-logic",
        details: [],
      },
    ],
    reviewedSource: "Manual review of every exported domain family and default, including message generation IDs, session overrides, private media paths, memory and snapshot lineage, goals, and retired structured-mood absence.",
  },
  {
    path: "/src/types/finance-dashboard.ts",
    header: codeLogicHeader,
    metric: "24 lines",
    metricDescription: "Shared row and navigation contracts for the admin finance dashboard.",
    description:
      "Defines the normalized user metrics displayed by finance and account-review pages, the allowed finance-dashboard page IDs, and the icon/label/description shape used to build that dashboard's navigation.",
    rows: [],
    reviewedSource: "Manual review of DashboardUser metrics, FinancePageId values, and FinanceNavItem contract.",
  },
  {
    path: "/src/utils.ts",
    header: codeLogicHeader,
    metric: "649 lines",
    metricDescription: "Shared identity, normalization, image-storage, default-data, and legacy browser-storage utilities.",
    description:
      "Provides cross-cutting utility functions used by builders and persistence code. It creates UUIDs and local-only IDs, sanitizes UI settings, safely parses and truncates text, resizes images, uploads compressed media to public or private Supabase buckets, constructs default and test scenario data, normalizes imported or legacy scenario shapes into supported contracts, and retains browser-storage registry helpers for local data paths.",
    rows: [
      {
        id: "utils-identities-settings",
        title: "Identity and setting normalization",
        summary:
          "Creates RFC 4122 UUIDs for database entities, prefixed local IDs for JSON-only rows, clamps numbers, and accepts only supported UI-setting values and colors.",
        badgeLabel: "NORMALIZATION",
        badgeClass: "code-logic",
        details: [],
      },
      {
        id: "utils-image-storage",
        title: "Image compression and storage",
        summary:
          "Uses browser canvas compression before upload; the private-bucket path returns a durable storage sentinel and a temporary signed URL that callers must not persist.",
        badgeLabel: "MEDIA STORAGE",
        badgeClass: "integration",
        details: [
          { label: "Private Buckets", values: ["story_covers_private", "character_avatars_private", "user_backgrounds_private", "sidebar_backgrounds_private", "scenes", "image_library"], kind: "buckets" },
        ],
      },
      {
        id: "utils-scenario-normalization",
        title: "Scenario defaults and legacy normalization",
        summary:
          "Creates an empty supported scenario and converts unknown imported values into safe strings, numbers, UUID-backed entities, canonical world fields, supported time values, and validated UI settings.",
        badgeLabel: "SCENARIO SHAPE",
        badgeClass: "code-logic",
        details: [],
      },
      {
        id: "utils-browser-registries",
        title: "Legacy browser registries",
        summary:
          "Reads and writes local scenario, character-library, and conversation registries, limits conversation history metadata to 200 recent rows, and removes scenario-owned entries during cleanup.",
        badgeLabel: "LOCAL STORAGE",
        badgeClass: "data-block",
        details: [],
      },
    ],
    reviewedSource: "Manual review of every exported utility family, media side effects, default/test data, scenario normalization, and local registry operations.",
  },
  {
    path: "/src/utils/publish-validation.ts",
    header: codeLogicHeader,
    metric: "128 lines",
    metricDescription: "Pre-publication completeness and adult-content validation.",
    description:
      "Validates that a story has the minimum data needed for publication: title, premise, opening dialog, at least five non-story-type tags, SFW/NSFW classification, one AI and one user character, valid character names, one complete location, one complete story goal, cover image, and brief description. For NSFW stories it also rejects any character whose numeric age is below 18.",
    rows: [
      {
        id: "publish-validation-contract",
        title: "Field-specific publication errors",
        summary:
          "Returns errors keyed to the exact builder surface, including per-character message arrays, so the UI can direct the creator to missing or disallowed data.",
        badgeLabel: "PUBLISH GATE",
        badgeClass: "code-logic",
        details: [],
      },
    ],
    reviewedSource: "Manual review of all eleven publication requirements, tag counting, AI/user character checks, NSFW age handling, and hasPublishErrors.",
  },
  {
    path: "/src/utils/publish-validation.test.ts",
    header: testHeader,
    metric: "146 lines",
    metricDescription: "Regression tests for publication requirements and NSFW age enforcement.",
    description:
      "Proves that an empty scenario reports every required publishing gap, a complete scenario passes without errors, and an under-18 character blocks publication when the story is classified as NSFW.",
    rows: [],
    reviewedSource: "Manual review of the valid fixture builder and all three publication-validation cases.",
  },
]);
