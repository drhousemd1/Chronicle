import { defineManualArchitectureFiles } from "./types";

const migrationHeader = {
  label: "DB MIGRATION" as const,
  className: "db-migration" as const,
  filterValue: "db-migration" as const,
  navAccent: "db-migration" as const,
};

export const supabaseMarchMigrationArchitectureFiles = defineManualArchitectureFiles([
  {
    path: "/supabase/migrations/20260301080644_77ccf1b7-a903-4632-b18b-bc2c5bd25c5f.sql",
    header: migrationHeader,
    metric: "1 line",
    metricDescription: "Memory record-shape classification.",
    description:
      "Adds required memories.entry_type with a bullet default, allowing ordinary event rows and compressed or otherwise specialized memory rows to be distinguished without inferring their shape from content.",
    rows: [],
    reviewedSource: "Manual review of the single memory column and default.",
  },
  {
    path: "/supabase/migrations/20260304234938_47c7a098-a2a8-484e-986a-ad6d5d1cadde.sql",
    header: migrationHeader,
    metric: "20 lines",
    metricDescription: "Role-based settings administration and model preference.",
    description:
      "Ensures the initial administrator role exists, replaces hardcoded-UUID app_settings write policies with has_role-based admin checks, and adds profiles.preferred_model for a user-level model choice.",
    rows: [],
    reviewedSource: "Manual review of role seed, policy replacements, and profile model field.",
  },
  {
    path: "/supabase/migrations/20260305030013_cc1329f9-9721-41af-9c62-f1ba4e276d99.sql",
    header: migrationHeader,
    metric: "178 lines",
    metricDescription: "Scenarios-to-stories terminology migration and dependent policy/query rewrite.",
    description:
      "Renames scenarios to stories, changes its title default, and rebuilds ownership/publication policies on stories, content themes, codex entries, scenes, and characters using the new table name. It also replaces fetch_gallery_scenarios so its joined source is stories while preserving the public JSON contract and existing scenario_id field names.",
    rows: [
      {
        id: "stories-table-rename",
        title: "Primary content table rename",
        summary:
          "Changes the database object's name without renaming all historical foreign-key columns or public gallery payload keys, so current code must distinguish table terminology from retained scenario_id contracts.",
        badgeLabel: "SCHEMA",
        badgeClass: "db-migration",
        details: [],
      },
      {
        id: "stories-dependent-references",
        title: "Dependent access and gallery references",
        summary:
          "Recreates policies and the gallery query against stories so ownership checks and published reads do not break after the table rename.",
        badgeLabel: "DEPENDENCIES",
        badgeClass: "db-migration",
        details: [],
      },
    ],
    reviewedSource: "Manual review of the rename, title default, every replaced policy, and the complete gallery-function replacement.",
  },
  {
    path: "/supabase/migrations/20260306093838_7c434b63-08c9-4c2a-87f1-8a74631c8c90.sql",
    header: migrationHeader,
    metric: "2 lines",
    metricDescription: "Conversation time-progression configuration.",
    description:
      "Adds a required time_progression_mode and interval to conversations, defaulting to manual progression and a 15-unit interval for sessions that opt into automatic time movement.",
    rows: [],
    reviewedSource: "Manual review of both conversation fields and defaults.",
  },
  {
    path: "/supabase/migrations/20260306101842_b26e4cd9-3181-4be5-8752-860af1b7d12d.sql",
    header: migrationHeader,
    metric: "1 line",
    metricDescription: "Conversation countdown state.",
    description:
      "Adds nullable conversations.time_remaining so automatic progression can persist a countdown while manual or uninitialized sessions remain explicitly unset.",
    rows: [],
    reviewedSource: "Manual review of the single conversation field and null default.",
  },
  {
    path: "/supabase/migrations/20260311014709_37310a0a-14a5-4b79-92c7-dad4efd058d5.sql",
    header: migrationHeader,
    metric: "1 line",
    metricDescription: "Style-guide edit-state reset to an empty array.",
    description:
      "Resets the styleguide_edits app setting to an empty JSON array and refreshes its timestamp. This is a data correction, not a schema change.",
    rows: [],
    reviewedSource: "Manual review of the targeted setting key, value, and timestamp update.",
  },
  {
    path: "/supabase/migrations/20260311022710_52e69418-4bbd-447f-8402-fcd7a21c6657.sql",
    header: migrationHeader,
    metric: "1 line",
    metricDescription: "Second style-guide edit-state array reset.",
    description:
      "Again resets styleguide_edits to an empty JSON array. It duplicates the earlier correction against the unqualified app_settings table name and makes no schema change.",
    rows: [],
    reviewedSource: "Manual review of the one-row app_settings update.",
  },
  {
    path: "/supabase/migrations/20260311025419_a3e0b7f0-efea-4302-a3af-8966e0617625.sql",
    header: migrationHeader,
    metric: "1 line",
    metricDescription: "Style-guide edit-state object reset.",
    description:
      "Changes styleguide_edits to an empty JSON object and refreshes updated_at. Later migrations return the value to an array, making this an intermediate historical data-shape correction.",
    rows: [],
    reviewedSource: "Manual review of the targeted setting update and object value.",
  },
  {
    path: "/supabase/migrations/20260311031506_1152e0ff-67b4-4926-a137-effd40e49aad.sql",
    header: migrationHeader,
    metric: "1 line",
    metricDescription: "Style-guide edit-state restored to an array.",
    description:
      "Returns styleguide_edits from the temporary empty object to an empty JSON array and refreshes its timestamp.",
    rows: [],
    reviewedSource: "Manual review of the one-row setting correction.",
  },
  {
    path: "/supabase/migrations/20260311210328_33a40b2f-dfb9-4aab-99c8-ece6eea60657.sql",
    header: migrationHeader,
    metric: "1 line",
    metricDescription: "Final repeated style-guide edit-state reset in this sequence.",
    description:
      "Resets styleguide_edits to an empty JSON array once more. This historical migration contains no schema or policy work.",
    rows: [],
    reviewedSource: "Manual review of the setting key and replacement value.",
  },
  {
    path: "/supabase/migrations/20260312104812_ac47a4d9-d635-4a07-97ac-0230cbe96e47.sql",
    header: migrationHeader,
    metric: "1 line",
    metricDescription: "Story draft-state flag.",
    description:
      "Adds required stories.is_draft with a false default so an unfinished story can be distinguished from an ordinary saved story without relying on title or completeness heuristics.",
    rows: [],
    reviewedSource: "Manual review of the single story field and default.",
  },
  {
    path: "/supabase/migrations/20260315060000_4c1cf491-9205-4e62-af70-7d6a54061ba5.sql",
    header: migrationHeader,
    metric: "1 line",
    metricDescription: "Story-specific navigation artwork.",
    description:
      "Adds stories.nav_button_images as a JSON object so a story can persist custom navigation-button imagery without creating one column per control.",
    rows: [],
    reviewedSource: "Manual review of the story JSON field and empty-object default.",
  },
  {
    path: "/supabase/migrations/20260318040053_4ae7f151-eb74-4486-93f9-a4c31635606e.sql",
    header: migrationHeader,
    metric: "26 lines",
    metricDescription: "Per-user Quality Hub registry persistence.",
    description:
      "Creates one quality_hub_registries JSON document per user and protects select, insert, update, and delete through matching user ownership. It stores the Quality Hub's registry state as a single document rather than normalized finding rows.",
    rows: [],
    reviewedSource: "Manual review of registry uniqueness and all owner-only RLS policies.",
  },
  {
    path: "/supabase/migrations/20260319101104_4acf529e-0767-4378-9a4c-0eedb0272076.sql",
    header: migrationHeader,
    metric: "36 lines",
    metricDescription: "Authenticated image-folder projection.",
    description:
      "Replaces get_folders_with_details with a no-argument version that derives the owner from auth.uid(), while retaining explicit-thumbnail fallback, first-image fallback, image counts, and recent-update ordering. This removes the caller-selected user ID from the query contract.",
    rows: [],
    reviewedSource: "Manual review of the no-argument signature, auth-derived filter, joins, count, and ordering.",
  },
  {
    path: "/supabase/migrations/20260319102704_328b0fc5-7ae1-4fb5-a4ec-6cbb50f65c28.sql",
    header: migrationHeader,
    metric: "187 lines",
    metricDescription: "Ownership-checked atomic story graph synchronization.",
    description:
      "Creates save_scenario_atomic, which verifies the authenticated caller matches p_user_id, upserts the story, deletes removed child rows, and upserts the supplied characters, codex entries, and scenes in one database transaction. The historical character mapping includes all builder/state fields that existed at this revision, including the later-removed structured mood field.",
    rows: [
      {
        id: "atomic-story-upsert",
        title: "Story and child-set synchronization",
        summary:
          "Treats the submitted child ID lists as authoritative for the story: rows absent from the incoming arrays are deleted, while matching IDs are updated and new IDs inserted.",
        badgeLabel: "ATOMIC SAVE",
        badgeClass: "db-migration",
        details: [],
      },
      {
        id: "atomic-story-owner-guard",
        title: "Authenticated ownership boundary",
        summary:
          "Rejects missing or mismatched authentication before any mutation. The function still relies on its mapped fields and later replacement migrations for terminal behavior.",
        badgeLabel: "SECURITY",
        badgeClass: "db-migration",
        details: [],
        security: true,
      },
    ],
    reviewedSource: "Manual review of authorization, story mapping, authoritative child-ID deletion, and all character/codex/scene upsert branches.",
  },
  {
    path: "/supabase/migrations/20260319194000_9b1b2e0d-3a08-47e4-bedd-0f96f3d8a1cb.sql",
    header: migrationHeader,
    metric: "8 lines",
    metricDescription: "Removal of caller-selected image-folder access.",
    description:
      "Drops the vulnerable get_folders_with_details(uuid) overload, removes public and anonymous execution on the authenticated no-argument replacement, and grants it only to authenticated and service-role callers.",
    rows: [],
    reviewedSource: "Manual review of the dropped overload, revoked roles, and explicit execution grants.",
  },
  {
    path: "/supabase/migrations/20260321053351_a5cb85ae-38a2-4067-be8d-70ea3354f077.sql",
    header: migrationHeader,
    metric: "1 line",
    metricDescription: "Default story model update.",
    description:
      "Changes the default selected_model for new stories to grok-4-1-fast-reasoning. Existing rows retain their stored model unless separately updated.",
    rows: [],
    reviewedSource: "Manual review of the altered default and target column.",
  },
  {
    path: "/supabase/migrations/20260328083000_9f8e5e4a-usage-events.sql",
    header: migrationHeader,
    metric: "41 lines",
    metricDescription: "AI usage event storage with owner and admin visibility.",
    description:
      "Creates ai_usage_events for timestamped usage counters and bounded metadata, indexes time/type/user lookups, lets authenticated users insert and read their own events, and gives admins read access to all events. event_source distinguishes client diagnostics from other producers but does not itself prove server authority.",
    rows: [],
    reviewedSource: "Manual review of event constraints, indexes, RLS, owner policies, and admin policy.",
  },
  {
    path: "/supabase/migrations/20260328101500_6f9b2a2f_api_usage_test_tracing.sql",
    header: migrationHeader,
    metric: "127 lines",
    metricDescription: "API usage test sessions and detailed trace events.",
    description:
      "Creates ai_usage_test_sessions to scope an active or ended test to a user, optional story, and optional conversation, plus ai_usage_test_events for grouped call identity, model, character/token estimates, cost, latency, status, and metadata. It adds lookup indexes, session timestamp maintenance, owner insert/update/read rules, and admin read access.",
    rows: [
      {
        id: "usage-test-session-scope",
        title: "Test-session ownership and lifecycle",
        summary:
          "Stores the selected story/conversation and active/ended lifecycle so trace rows can be reviewed as one bounded admin test rather than mixed into ordinary usage history.",
        badgeLabel: "TEST SESSION",
        badgeClass: "db-table",
        details: [],
      },
      {
        id: "usage-test-event-evidence",
        title: "Per-call trace evidence",
        summary:
          "Persists call grouping, source, model, size estimates, cost, latency, status, and metadata under the owning session with nonnegative numeric constraints.",
        badgeLabel: "TRACE",
        badgeClass: "db-table",
        details: [],
      },
    ],
    reviewedSource: "Manual review of both table contracts, constraints, indexes, trigger, owner policies, and admin policies.",
  },
  {
    path: "/supabase/migrations/20260328113000_2f3d5c4a_admin_role_sync.sql",
    header: migrationHeader,
    metric: "34 lines",
    metricDescription: "Admin role visibility and controlled assignment RPC.",
    description:
      "Allows admins to read all user role assignments and creates set_admin_access, which verifies the caller is an admin before adding or removing the target user's admin role. Execution is revoked from PUBLIC and granted to authenticated callers, with the function itself enforcing authorization.",
    rows: [],
    reviewedSource: "Manual review of role-read policy, authorization branch, role mutation, revocation, and grant.",
  },
  {
    path: "/supabase/migrations/20260329052209_d77b6f33-9549-47a1-b485-bbc071fb8de0.sql",
    header: migrationHeader,
    metric: "2 lines",
    metricDescription: "Sidebar-background categories and ordering.",
    description:
      "Adds a required category and sort_order to sidebar_backgrounds so user-uploaded sidebar media can be grouped and deliberately ordered rather than shown only by creation time.",
    rows: [],
    reviewedSource: "Manual review of both sidebar-background fields and defaults.",
  },
  {
    path: "/supabase/migrations/20260329052422_69b1d25b-ec9d-4555-bc68-3d9e5cdcbf1f.sql",
    header: migrationHeader,
    metric: "2 lines",
    metricDescription: "Page-background categories and ordering.",
    description:
      "Adds the same category and sort_order fields to user_backgrounds, giving Hub and Image Library background selectors explicit grouping and display order.",
    rows: [],
    reviewedSource: "Manual review of both user-background fields and defaults.",
  },
  {
    path: "/supabase/migrations/20260329093915_a54de057-c2d2-4474-bef3-357a77824ece.sql",
    header: migrationHeader,
    metric: "9 lines",
    metricDescription: "Intentional no-op for a duplicate usage-telemetry scaffold.",
    description:
      "Documents that ai_usage_events and ai_usage_test_sessions were already created by earlier March migrations and executes only SELECT 1. It exists to preserve migration ordering without colliding with already-applied tables or policies.",
    rows: [],
    reviewedSource: "Manual review of the explanatory comments and sole no-op statement.",
  },
  {
    path: "/supabase/migrations/20260329112000_finance_live_wiring_tables.sql",
    header: migrationHeader,
    metric: "246 lines",
    metricDescription: "Finance operations, admin notes, user reports, and moderation strikes.",
    description:
      "Creates ad_spend, admin_notes, reports, and user_strikes with status/value constraints, indexes, and timestamp triggers. Admin-role policies govern financial records, notes, report review, and strike administration; authenticated users can submit and view their own reports and view their own strikes.",
    rows: [
      {
        id: "finance-admin-records",
        title: "Admin financial and note records",
        summary:
          "Stores recurring or annual advertising spend and keyed rich-text notes under admin-only CRUD policies.",
        badgeLabel: "FINANCE",
        badgeClass: "db-table",
        details: [],
      },
      {
        id: "report-strike-workflow",
        title: "Report and strike workflow",
        summary:
          "Lets users submit reports while reserving review and strike mutations for admins; reporters and accused users receive only their explicitly allowed read surfaces.",
        badgeLabel: "MODERATION",
        badgeClass: "db-table",
        details: [],
      },
    ],
    reviewedSource: "Manual review of all four schemas, constraints, indexes, triggers, and owner/admin policies.",
  },
  {
    path: "/supabase/migrations/20260331153000_security_rls_hardening.sql",
    header: migrationHeader,
    metric: "38 lines",
    metricDescription: "Guide-image upload and app-settings read hardening.",
    description:
      "Replaces broad authenticated guide-image uploads with admin-only uploads and removes broad app_settings SELECT policies. Authenticated users may read only subscription_tiers_v1 and nav_button_images, while admins retain read access to every setting.",
    rows: [],
    reviewedSource: "Manual review of removed policies, admin upload condition, two-key settings allowlist, and admin read policy.",
  },
]);
