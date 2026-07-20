import { defineManualArchitectureFiles } from "./types";

const migrationHeader = {
  label: "DB MIGRATION" as const,
  className: "db-migration" as const,
  filterValue: "db-migration" as const,
  navAccent: "db-migration" as const,
};

export const supabaseFebruaryMigrationArchitectureFiles = defineManualArchitectureFiles([
  {
    path: "/supabase/migrations/20260201110439_6cdfe17b-a3c7-4304-88da-fdc323f205cd.sql",
    header: migrationHeader,
    metric: "2 lines",
    metricDescription: "Historical-name tracking for session character resolution.",
    description:
      "Adds previous_names to character_session_states as a text array. Session-level character resolution can retain former names after an in-play rename instead of treating the renamed participant as unrelated.",
    rows: [],
    reviewedSource: "Manual review of the session-state column and default.",
  },
  {
    path: "/supabase/migrations/20260204014951_18888757-ba7a-40f4-a3aa-4990c79c6808.sql",
    header: migrationHeader,
    metric: "230 lines",
    metricDescription: "Public scenario gallery, engagement records, remix lineage, and counters.",
    description:
      "Creates published_scenarios as the gallery listing for a source scenario, plus scenario_likes, saved_scenarios, and remixed_scenarios for user engagement and remix attribution. It applies authenticated visibility and owner-write policies, indexes discovery relationships and tags, and adds security-definer counter functions for likes, saves, plays, and the publication update timestamp.",
    rows: [
      {
        id: "gallery-publication-model",
        title: "Publication and engagement model",
        summary:
          "Separates the owner's private scenario from its public listing, records one like/save per user, and tracks remix lineage without transferring ownership of the source scenario.",
        badgeLabel: "GALLERY",
        badgeClass: "db-table",
        details: [],
      },
      {
        id: "gallery-counter-rpcs",
        title: "Atomic gallery counters",
        summary:
          "Introduces database functions that update aggregate like, save, and play counts without requiring the client to perform read-modify-write sequences.",
        badgeLabel: "RPC",
        badgeClass: "db-migration",
        details: [],
      },
    ],
    reviewedSource: "Manual review of all four tables, indexes, RLS policies, five counter functions, and the update trigger.",
  },
  {
    path: "/supabase/migrations/20260204015411_550ad934-7473-44aa-a80a-2360ad34af02.sql",
    header: migrationHeader,
    metric: "8 lines",
    metricDescription: "Authenticated public-profile visibility.",
    description:
      "Replaces the owner-only profile SELECT policy with an authenticated-user read policy so gallery and creator surfaces can display usernames and avatars while profile writes remain governed by their existing owner rules.",
    rows: [],
    reviewedSource: "Manual review of the added profile SELECT policy and removed restrictive policy.",
  },
  {
    path: "/supabase/migrations/20260204022356_b1b52c7e-0b25-48c1-a1a1-1f609e36699f.sql",
    header: migrationHeader,
    metric: "31 lines",
    metricDescription: "Admin-managed application settings and shared-key switch.",
    description:
      "Creates app_settings as a unique key/JSON value registry, allows authenticated clients to read settings, restricts inserts and updates to the original administrator UUID, and seeds shared_keys with xAI sharing disabled. Later migrations replace the hardcoded administration pattern with role checks.",
    rows: [],
    reviewedSource: "Manual review of table fields, RLS policies, hardcoded admin guard, and seeded setting.",
  },
  {
    path: "/supabase/migrations/20260204022742_e4b1fe10-b270-4665-8126-8f58a2f59c4e.sql",
    header: migrationHeader,
    metric: "4 lines",
    metricDescription: "Anonymous read access for application settings.",
    description:
      "Adds an anonymous SELECT policy to app_settings so unauthenticated edge-function calls could read the shared-key switch. A later security migration removes this policy.",
    rows: [],
    reviewedSource: "Manual review of the single anonymous read policy and its role target.",
  },
  {
    path: "/supabase/migrations/20260204023529_8258f5cf-56db-4a9f-9fae-39b40c600239.sql",
    header: migrationHeader,
    metric: "16 lines",
    metricDescription: "Published-scenario read access.",
    description:
      "Replaces scenarios' owner-only SELECT policy with one that also exposes a scenario when a visible, published_scenarios record references it. Creation, updates, and deletion remain governed by the separate owner policies.",
    rows: [],
    reviewedSource: "Manual review of the dropped and replacement scenarios SELECT policies.",
  },
  {
    path: "/supabase/migrations/20260204025057_fe34f52b-9f33-44bb-97bf-546b4a04167d.sql",
    header: migrationHeader,
    metric: "57 lines",
    metricDescription: "Published child-content read access.",
    description:
      "Expands SELECT access for characters, codex entries, and scenes so authenticated users can read content belonging to a visible published scenario as well as their own scenario content. Write and delete ownership policies are not broadened.",
    rows: [],
    reviewedSource: "Manual review of all three removed owner-only policies and their publication-aware replacements.",
  },
  {
    path: "/supabase/migrations/20260204045006_ad9f1b7e-07c2-4a17-9505-76ca93c6007d.sql",
    header: migrationHeader,
    metric: "16 lines",
    metricDescription: "Gallery view counter and increment function.",
    description:
      "Adds view_count to published_scenarios and introduces a security-definer increment_view_count function that atomically updates the counter and publication timestamp. A later migration replaces this unrestricted increment with authenticated, deduplicated view recording.",
    rows: [],
    reviewedSource: "Manual review of the aggregate column and increment function.",
  },
  {
    path: "/supabase/migrations/20260204061347_41d8784d-39df-4552-8fbf-5c620d013255.sql",
    header: migrationHeader,
    metric: "42 lines",
    metricDescription: "Scenario discovery themes and published visibility.",
    description:
      "Creates one content_themes record per scenario for character types, story type, genres, origins, trigger warnings, and custom tags. Owners can manage their scenario's themes, visible publications expose them for discovery, and the shared timestamp trigger maintains updated_at.",
    rows: [],
    reviewedSource: "Manual review of theme fields, scenario uniqueness/cascade, owner and publication policies, and update trigger.",
  },
  {
    path: "/supabase/migrations/20260213102837_873c00b9-7f12-47b9-92bf-fefac418496c.sql",
    header: migrationHeader,
    metric: "20 lines",
    metricDescription: "Structured character narrative sections and session overrides.",
    description:
      "Adds background, tone, life events, relationships, secrets, fears, and personality JSON sections to base characters and matching nullable overrides to character_session_states. Base rows receive empty defaults while session rows can distinguish no override from an explicit replacement.",
    rows: [],
    reviewedSource: "Manual review of the seven base fields, seven session overrides, and differing defaults.",
  },
  {
    path: "/supabase/migrations/20260215071650_f0e6a4aa-cd1d-4225-9820-e618cdd9d9ca.sql",
    header: migrationHeader,
    metric: "94 lines",
    metricDescription: "Gallery counter authorization hardening.",
    description:
      "Removes anonymous app_settings access and replaces gallery counter functions with authenticated versions. Like and save increments require the caller's matching engagement record; decrements, play increments, and view increments require an authenticated caller, while aggregate updates remain atomic and nonnegative.",
    rows: [],
    reviewedSource: "Manual review of the removed policy and all six replacement security-definer functions.",
  },
  {
    path: "/supabase/migrations/20260218060313_0cd4031b-0fb5-41fb-9f3b-16569e043c1d.sql",
    header: migrationHeader,
    metric: "4 lines",
    metricDescription: "Sexual-orientation fields across character state layers.",
    description:
      "Adds sexual_orientation to reusable characters, conversation-owned side characters, and session character overrides. Base and side records default to an empty value while the session field remains nullable to preserve override semantics.",
    rows: [],
    reviewedSource: "Manual review of the three character-layer column additions.",
  },
  {
    path: "/supabase/migrations/20260219072507_c3bfd1c8-d916-481f-b0e6-5dbee6b8f592.sql",
    header: migrationHeader,
    metric: "97 lines",
    metricDescription: "Role-based administration and database-backed art styles.",
    description:
      "Creates the app_role enum, user_roles table, and security-definer has_role function so authorization can use database roles without recursive RLS. It seeds the initial admin and creates public-readable, admin-writable art_styles with image-generation prompts, thumbnails, ordering, gender variants, initial style records, and timestamp maintenance.",
    rows: [
      {
        id: "role-check-foundation",
        title: "Database role authorization",
        summary:
          "Moves administrator checks toward a reusable role table and security-definer lookup while restricting ordinary users to viewing only their own role assignments.",
        badgeLabel: "SECURITY",
        badgeClass: "db-migration",
        details: [],
        security: true,
      },
      {
        id: "art-style-registry",
        title: "Image-generation style registry",
        summary:
          "Stores user-visible style identity and server-facing prompt variants in a public-read registry whose writes require the admin role.",
        badgeLabel: "IMAGE DATA",
        badgeClass: "db-table",
        details: [],
      },
    ],
    reviewedSource: "Manual review of enum/table/RLS/function/admin seed, art-style schema and policies, seeded prompts, and update trigger.",
  },
  {
    path: "/supabase/migrations/20260220040006_bf129b48-c984-402c-83fc-d908513aa170.sql",
    header: migrationHeader,
    metric: "82 lines",
    metricDescription: "Creator profiles, follows, and aggregate statistics.",
    description:
      "Extends profiles with display name, biography, genre preferences, and privacy switches; updates signup provisioning to assign a random display name; creates owner-controlled creator_follows records; and adds get_creator_stats to aggregate a creator's visible publications, engagement totals, and followers.",
    rows: [],
    reviewedSource: "Manual review of profile additions, signup trigger replacement, follows table/RLS, and aggregate function.",
  },
  {
    path: "/supabase/migrations/20260220061845_556ed3a7-2448-4ca1-9a61-ec1d2aba0022.sql",
    header: migrationHeader,
    metric: "1 line",
    metricDescription: "Profile-avatar focal position.",
    description:
      "Adds avatar_position to profiles with a centered x/y default so creator-profile avatars can preserve their chosen crop independently of the image URL.",
    rows: [],
    reviewedSource: "Manual review of the single profile column; the source file has one unterminated line, so byte-newline counting would misleadingly report zero.",
  },
  {
    path: "/supabase/migrations/20260220102050_909dcf10-8c9a-4cbd-947d-d8f197f4bc96.sql",
    header: migrationHeader,
    metric: "114 lines",
    metricDescription: "Multi-dimension scenario reviews and publication aggregates.",
    description:
      "Creates one review per user/publication with ten 1-to-5 rating dimensions, an optional comment, and a precomputed weighted score. It validates every rating, maintains review timestamps, and recalculates published_scenarios.review_count and avg_rating after insert, update, or delete.",
    rows: [],
    reviewedSource: "Manual review of rating schema, ownership policies, validation trigger, aggregate columns, and aggregate-maintenance trigger.",
  },
  {
    path: "/supabase/migrations/20260222041015_a346410c-5300-48f3-82b5-454327fd7545.sql",
    header: migrationHeader,
    metric: "41 lines",
    metricDescription: "Admin-only guide-document storage.",
    description:
      "Creates guide_documents for ordered rich JSON and Markdown guide content. Every CRUD operation requires the database admin role, and the shared timestamp trigger maintains updated_at.",
    rows: [],
    reviewedSource: "Manual review of guide fields, all four admin-only policies, and update trigger.",
  },
  {
    path: "/supabase/migrations/20260222083507_2fd8d79b-48ab-47c6-942e-d02c5295cb6a.sql",
    header: migrationHeader,
    metric: "24 lines",
    metricDescription: "Guide-image storage bucket and access rules.",
    description:
      "Creates the public guide_images bucket, permits authenticated uploads, allows public reads, and restricts deletion to objects whose first folder segment matches the authenticated user. The upload policy itself does not enforce an owner-folder path.",
    rows: [],
    reviewedSource: "Manual review of bucket visibility and insert/select/delete storage policies.",
  },
  {
    path: "/supabase/migrations/20260222085834_acaf4e99-32a5-4555-8818-1f0a62866f98.sql",
    header: migrationHeader,
    metric: "165 lines",
    metricDescription: "Deduplicated gallery views, server-side discovery, search index, and realtime.",
    description:
      "Creates owner-readable scenario_views and record_scenario_view, which records at most one view per user/publication in 24 hours before incrementing the publication. It also adds fetch_gallery_scenarios for server-side filters, search, ordering, pagination, joined creator/theme data, a full-text scenario index, and realtime publication updates.",
    rows: [
      {
        id: "gallery-view-dedup",
        title: "Twenty-four-hour view deduplication",
        summary:
          "Authenticates the viewer, records the view event, and updates the aggregate only when no matching recent event exists.",
        badgeLabel: "RPC",
        badgeClass: "db-migration",
        details: [],
      },
      {
        id: "gallery-query-rpc",
        title: "Server-side gallery projection",
        summary:
          "Returns publication, scenario, publisher, and content-theme data after applying visibility, tag, creator, theme, search, sort, limit, and offset rules in the database.",
        badgeLabel: "QUERY",
        badgeClass: "db-migration",
        details: [],
      },
    ],
    reviewedSource: "Manual review of views table/index/RLS, deduplicating RPC, full gallery RPC, full-text index, and realtime publication change.",
  },
  {
    path: "/supabase/migrations/20260222092928_9f413a65-0af6-4527-833e-fc2d7af9f2a5.sql",
    header: migrationHeader,
    metric: "8 lines",
    metricDescription: "Background overlay color and opacity.",
    description:
      "Adds required overlay_color and overlay_opacity settings to both user_backgrounds and sidebar_backgrounds so each saved background can retain its readability treatment.",
    rows: [],
    reviewedSource: "Manual review of the four non-null background columns and defaults.",
  },
  {
    path: "/supabase/migrations/20260222102901_678fd7fe-9449-4439-8ea0-a3ca8a33e2b3.sql",
    header: migrationHeader,
    metric: "47 lines",
    metricDescription: "Image-folder projection with thumbnail fallback and counts.",
    description:
      "Creates get_folders_with_details, a stable security-definer query that returns one user's folders with explicit thumbnail or first-image fallback, image count, and timestamps ordered by recent folder updates. The caller supplies the user ID in this historical function version.",
    rows: [],
    reviewedSource: "Manual review of return contract, explicit and fallback thumbnail joins, count join, user filter, and ordering.",
  },
  {
    path: "/supabase/migrations/20260222103645_953330a9-6de4-4561-9f0b-b0b45e36924e.sql",
    header: migrationHeader,
    metric: "1 line",
    metricDescription: "Image-library tag array.",
    description:
      "Adds a non-null tags text array to library_images so saved media can be categorized and filtered independently of its folder or title.",
    rows: [],
    reviewedSource: "Manual review of the single library_images column and default.",
  },
  {
    path: "/supabase/migrations/20260222104504_81e975a3-b584-4285-bb63-8469556d8c1c.sql",
    header: migrationHeader,
    metric: "1 line",
    metricDescription: "Image-library display title.",
    description:
      "Adds a required title field to library_images with an empty default, separating a user-facing media title from the stored filename and URL.",
    rows: [],
    reviewedSource: "Manual review of the single library_images title column.",
  },
]);
