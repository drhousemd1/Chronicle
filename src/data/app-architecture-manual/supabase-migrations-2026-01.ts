import { defineManualArchitectureFiles } from "./types";

const migrationHeader = {
  label: "DB MIGRATION" as const,
  className: "db-migration" as const,
  filterValue: "db-migration" as const,
  navAccent: "db-migration" as const,
};

export const supabaseJanuaryMigrationArchitectureFiles = defineManualArchitectureFiles([
  {
    path: "/supabase/migrations/20260116060210_e47fe632-8ea5-4245-bb4a-f48cd24af03d.sql",
    header: migrationHeader,
    metric: "249 lines",
    metricDescription: "Initial Chronicle relational schema, access policies, storage, triggers, and indexes.",
    description:
      "Creates Chronicle's first profiles, scenarios, characters, codex entries, scenes, conversations, and messages tables. It enables row-level security, gives users ownership-scoped access through direct or parent records, installs updated-at and new-user profile triggers, creates the original public avatar and scene buckets, and indexes the principal ownership and relationship columns.",
    rows: [
      {
        id: "initial-schema-ownership",
        title: "Ownership-scoped application schema",
        summary:
          "Establishes the initial scenario and conversation data graph. Child codex, scene, and message access is checked through the owning scenario or conversation rather than trusting caller-supplied user IDs on those rows.",
        badgeLabel: "SCHEMA",
        badgeClass: "db-table",
        details: [],
      },
      {
        id: "initial-storage-and-triggers",
        title: "Shared timestamps, signup provisioning, and media storage",
        summary:
          "Adds the reusable updated_at trigger, creates a profile after auth signup, and configures public-read avatar and scene buckets with owner-folder write controls.",
        badgeLabel: "DATABASE",
        badgeClass: "db-migration",
        details: [],
      },
    ],
    reviewedSource: "Manual review of every table, foreign key, RLS policy, trigger, storage bucket/policy, and index in the migration.",
  },
  {
    path: "/supabase/migrations/20260116074008_bf01783c-7103-4f68-87d0-b771df78cc28.sql",
    header: migrationHeader,
    metric: "30 lines",
    metricDescription: "Cover-image storage and positioning schema change.",
    description:
      "Creates the public covers storage bucket with authenticated owner-folder upload, update, and delete policies plus public read access. It also adds the scenarios.cover_image_position JSON field so the UI can retain focal-point placement independently of the cover URL.",
    rows: [],
    reviewedSource: "Manual review of the covers bucket policies and scenarios cover-position column.",
  },
  {
    path: "/supabase/migrations/20260116105300_92f2632d-20c6-4269-beb3-1e89ef9cccb7.sql",
    header: migrationHeader,
    metric: "77 lines",
    metricDescription: "Character detail fields and playthrough-scoped character state.",
    description:
      "Adds age, location, the then-current structured-mood field, role description, physical appearance, current clothing, and preferred clothing to base characters. It also creates character_session_states so each conversation can override mutable character state without changing the reusable scenario character, protects those rows by user ownership, and keeps their update timestamp current.",
    rows: [],
    reviewedSource: "Manual review of base-character columns, session-state schema, uniqueness, RLS, and update trigger.",
  },
  {
    path: "/supabase/migrations/20260116120840_e71f09f9-d21a-473c-b9eb-2f265446cad5.sql",
    header: migrationHeader,
    metric: "8 lines",
    metricDescription: "Conversation and message time-position fields.",
    description:
      "Adds current day and time-of-day values to conversations and optional day/time stamps to individual messages. These fields provide the original persisted timeline coordinates used to organize a roleplay session and its messages.",
    rows: [],
    reviewedSource: "Manual review of the conversation and message column additions.",
  },
  {
    path: "/supabase/migrations/20260117105449_b3da9c51-aeac-4c54-8600-c803cb424bdc.sql",
    header: migrationHeader,
    metric: "47 lines",
    metricDescription: "User-owned page-background storage and selection records.",
    description:
      "Creates user_backgrounds for each user's uploaded background choices and selected state, protects every operation by matching auth.uid() to user_id, and creates a public-read backgrounds bucket whose write operations are restricted to the authenticated user's storage folder.",
    rows: [],
    reviewedSource: "Manual review of the user_backgrounds table, RLS policies, bucket, and storage policies.",
  },
  {
    path: "/supabase/migrations/20260118072822_1ceda35d-4086-47f2-bf00-372818d7cffb.sql",
    header: migrationHeader,
    metric: "59 lines",
    metricDescription: "Conversation-owned generated side-character persistence.",
    description:
      "Creates side_characters for AI-generated characters that belong to one conversation. The row stores identity, role, appearance, clothing, background, personality, avatar, first-mention, and extracted-trait data; deletion follows its conversation, ownership-based RLS protects all operations, and an update trigger maintains updated_at.",
    rows: [],
    reviewedSource: "Manual review of all side-character fields, conversation cascade, ownership policies, and update trigger.",
  },
  {
    path: "/supabase/migrations/20260121184250_c722b884-a26a-4e44-9031-62fc8148469d.sql",
    header: migrationHeader,
    metric: "9 lines",
    metricDescription: "Expanded session-level character override fields.",
    description:
      "Extends character_session_states with optional identity, demographic, role-description, preferred-clothing, and custom-section overrides. This lets a playthrough edit those values without mutating its reusable base character.",
    rows: [],
    reviewedSource: "Manual review of all six session-state column additions.",
  },
  {
    path: "/supabase/migrations/20260121191357_fd74cce4-e0d4-40e7-aeaa-688fe8082573.sql",
    header: migrationHeader,
    metric: "3 lines",
    metricDescription: "Session-level avatar overrides.",
    description:
      "Adds optional avatar URL and focal-position overrides to character_session_states so a playthrough may change a character's portrait without altering the scenario-level character record.",
    rows: [],
    reviewedSource: "Manual review of both session-state avatar columns.",
  },
  {
    path: "/supabase/migrations/20260121192854_f8a64a5b-13a3-4908-ada3-31ed2382ce01.sql",
    header: migrationHeader,
    metric: "5 lines",
    metricDescription: "Session-level control and role overrides.",
    description:
      "Adds optional controlled_by and character_role overrides to character_session_states. The playthrough can therefore change who controls a character or whether it is treated as main/side without rewriting the base character.",
    rows: [],
    reviewedSource: "Manual review of the two session-state role/control columns.",
  },
  {
    path: "/supabase/migrations/20260121193256_9ab78cc1-538b-4929-97a9-bce70850ac08.sql",
    header: migrationHeader,
    metric: "5 lines",
    metricDescription: "Control and role fields for generated side characters.",
    description:
      "Adds controlled_by and character_role to side_characters with AI and Side defaults. These fields allow a generated participant to be handed to the user or promoted in role while remaining attached to the conversation.",
    rows: [],
    reviewedSource: "Manual review of the side-character role/control additions and defaults.",
  },
  {
    path: "/supabase/migrations/20260121211645_0956581f-2150-43f5-a5d0-647d527aecd4.sql",
    header: migrationHeader,
    metric: "34 lines",
    metricDescription: "User-owned chat-sidebar background records.",
    description:
      "Creates sidebar_backgrounds to track each user's uploaded sidebar images and selected state. Row-level policies restrict select, insert, update, and delete to the owning user; this migration creates the metadata table but no separate storage bucket.",
    rows: [],
    reviewedSource: "Manual review of the sidebar background columns and four owner-only policies.",
  },
  {
    path: "/supabase/migrations/20260123085843_93bd23b4-e5ad-4f06-a77f-d2d1714de328.sql",
    header: migrationHeader,
    metric: "2 lines",
    metricDescription: "Scenario art-style selection field.",
    description:
      "Adds selected_art_style to scenarios with cinematic-2-5d as the initial default, allowing each scenario to retain the image-generation style selected by its owner.",
    rows: [],
    reviewedSource: "Manual review of the single scenarios column addition.",
  },
  {
    path: "/supabase/migrations/20260123102838_bdb40cd0-9995-486e-b51b-18fd21162d90.sql",
    header: migrationHeader,
    metric: "46 lines",
    metricDescription: "Conversation memory-event persistence.",
    description:
      "Creates memories for durable story events associated with a conversation and user, including content, story time, source classification, and optional source-message lineage. Owner-only RLS governs all operations, conversation and user indexes support lookup, and the shared timestamp trigger maintains updated_at.",
    rows: [],
    reviewedSource: "Manual review of memory fields, ownership policies, indexes, and timestamp trigger.",
  },
  {
    path: "/supabase/migrations/20260124054304_ba9c4be6-e606-47e6-9766-6d34e4295e0f.sql",
    header: migrationHeader,
    metric: "9 lines",
    metricDescription: "Scene tag-array migration.",
    description:
      "Adds a tags text array to scenes and copies each nonempty legacy scalar tag into that array when the array has not already been populated. The historical scalar tag column is deliberately left in place by this migration.",
    rows: [],
    reviewedSource: "Manual review of the tags column, conditional backfill, and retained scalar tag note.",
  },
  {
    path: "/supabase/migrations/20260129045919_5bb6cc8d-eafb-4b90-895b-98ee895d3e16.sql",
    header: migrationHeader,
    metric: "7 lines",
    metricDescription: "Nickname fields across reusable and playthrough characters.",
    description:
      "Adds a text nicknames field to base characters, generated side characters, and character session states so the same concept is available at reusable, conversation-owned, and session-override layers.",
    rows: [],
    reviewedSource: "Manual review of the three nickname column additions.",
  },
  {
    path: "/supabase/migrations/20260129061559_3948ce7f-b8a5-4dfc-ba48-56532095fddc.sql",
    header: migrationHeader,
    metric: "59 lines",
    metricDescription: "Image-library folders, assets, storage, ownership, and thumbnail linkage.",
    description:
      "Creates image_folders and library_images, links each image to a folder and each folder's optional thumbnail back to an image, and applies owner-only RLS to both tables. It also creates the public-read image_library bucket with owner-folder upload/delete controls and maintains folder update timestamps.",
    rows: [],
    reviewedSource: "Manual review of both tables, cyclic thumbnail relationship, RLS, bucket policies, and update trigger.",
  },
  {
    path: "/supabase/migrations/20260130062817_ebd86fbe-b9bf-459f-8ee4-9230846ec25c.sql",
    header: migrationHeader,
    metric: "7 lines",
    metricDescription: "Separate Image Library background selection.",
    description:
      "Adds image_library_selected to user_backgrounds so the Image Library can choose a background independently from the Hub, and adds a partial owner/selection index for efficient lookup of the active choice.",
    rows: [],
    reviewedSource: "Manual review of the selection column and partial index predicate.",
  },
]);
