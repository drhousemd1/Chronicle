import { defineManualArchitectureFiles } from "./types";

const migrationHeader = {
  label: "DB MIGRATION" as const,
  className: "db-migration" as const,
  filterValue: "db-migration" as const,
  navAccent: "db-migration" as const,
};

export const supabaseJuneMigrationArchitectureFiles = defineManualArchitectureFiles([
  {
    path: "/supabase/migrations/20260614065158_b4d722f1-85ff-4d27-b81c-f093f2f3f5a5.sql",
    header: migrationHeader,
    metric: "230 lines",
    metricDescription: "Row-level ownership guards inside atomic story synchronization.",
    description:
      "Replaces save_scenario_atomic with a stricter version that rejects cross-user story IDs before mutation and constrains every story, character, codex, and scene conflict update to the caller-owned parent. It checks affected-row counts and raises when a conflicting child ID cannot be updated under the expected story, preventing caller-supplied UUIDs from overwriting another user's records.",
    rows: [],
    reviewedSource: "Manual review of authentication, preflight ownership, guarded conflict clauses, row-count checks, authoritative child deletion, and all four synchronized data groups.",
  },
  {
    path: "/supabase/migrations/20260614065630_594a420a-072a-4cdb-a66a-f236de6846fb.sql",
    header: migrationHeader,
    metric: "37 lines",
    metricDescription: "Character-to-story ownership binding.",
    description:
      "Replaces character insert and update policies so user_id must match auth.uid() and any non-null scenario_id must point to a story owned by that same user. Library characters may still have no parent story.",
    rows: [],
    reviewedSource: "Manual review of both replacement policies and the nullable parent-story branch.",
  },
  {
    path: "/supabase/migrations/20260614070400_f785ee92-a83b-4383-b191-0e0780f4c2a2.sql",
    header: migrationHeader,
    metric: "39 lines",
    metricDescription: "Publication ownership binding and legacy-row quarantine.",
    description:
      "Requires publication inserts and updates to reference a story owned by the authenticated publisher, then hides any existing publication whose publisher differs from the underlying story owner. The repair quarantines mismatched rows rather than deleting them.",
    rows: [],
    reviewedSource: "Manual review of insert/update policy conditions and the non-destructive mismatch update.",
  },
  {
    path: "/supabase/migrations/20260614070722_b02748e0-00eb-47fd-bd56-f628448ac722.sql",
    header: migrationHeader,
    metric: "166 lines",
    metricDescription: "Ledger-backed gallery counters and throttled play recording.",
    description:
      "Creates scenario_plays, synchronizes publication like/save/play totals from their underlying event tables through triggers, and adds record_scenario_play with authentication, visible-publication checks, and a five-minute per-user throttle. It removes the older client-invoked counter RPCs and backfills like/save aggregates from truth rows; play_count begins using the new ledger only going forward.",
    rows: [
      {
        id: "gallery-counter-truth",
        title: "Event-ledger counter ownership",
        summary:
          "Makes insert/delete events in likes, saves, and plays the source of aggregate counts instead of trusting clients to call increment and decrement functions in the right order.",
        badgeLabel: "COUNTER INTEGRITY",
        badgeClass: "db-migration",
        details: [],
      },
      {
        id: "scenario-play-throttle",
        title: "Authenticated play registration",
        summary:
          "Records a play only for a visible publication and suppresses repeated user/publication events inside five minutes before the trigger updates the aggregate.",
        badgeLabel: "PLAY LEDGER",
        badgeClass: "db-table",
        details: [],
      },
    ],
    reviewedSource: "Manual review of play schema/RLS/grants, three counter functions/triggers, record RPC, dropped legacy RPCs, and aggregate backfill.",
  },
  {
    path: "/supabase/migrations/20260614071711_6c0e510c-bc5b-456a-8168-1687e24e3ed3.sql",
    header: migrationHeader,
    metric: "302 lines",
    metricDescription: "Creator-profile privacy enforcement across direct reads, RPCs, and gallery search.",
    description:
      "Restricts direct profile SELECT to owners and admins, then exposes only deliberate public projections through get_public_profiles and get_public_creator_profile. It enforces hide_profile_details and hide_published_works in profile output, creator statistics, publication RLS, and the security-definer gallery query so privileged query execution cannot bypass creator privacy.",
    rows: [
      {
        id: "creator-public-projections",
        title: "Privacy-aware public profile projections",
        summary:
          "Returns only profile chips or a shaped creator profile, masking identity details and/or published works for ordinary viewers while preserving owner and admin access.",
        badgeLabel: "PRIVACY",
        badgeClass: "db-migration",
        details: [],
        security: true,
      },
      {
        id: "creator-gallery-enforcement",
        title: "Gallery and statistic enforcement",
        summary:
          "Applies the same privacy decision to publication policies, creator totals, and gallery result construction rather than relying on the frontend to hide already-returned data.",
        badgeLabel: "SERVER ENFORCED",
        badgeClass: "db-migration",
        details: [],
      },
    ],
    reviewedSource: "Manual review of profile policies, both public profile RPCs, statistics function, publication policy, and complete gallery-function replacement.",
  },
  {
    path: "/supabase/migrations/20260614100132_5a48760f-99bb-4518-875e-582b86e43480.sql",
    header: migrationHeader,
    metric: "42 lines",
    metricDescription: "Creator statistics aligned with both privacy flags.",
    description:
      "Replaces get_creator_stats so either hide_published_works or hide_profile_details zeroes publication and engagement totals for non-owner, non-admin callers. Follower count remains visible in that privacy branch.",
    rows: [],
    reviewedSource: "Manual review of both privacy values, owner/admin exceptions, follower calculation, and aggregate query.",
  },
  {
    path: "/supabase/migrations/20260614100327_b44457a0-db46-4327-b4cd-f89faf0a2d59.sql",
    header: migrationHeader,
    metric: "377 lines",
    metricDescription: "Private media path foundation for scenes and Image Library assets.",
    description:
      "Adds bucket-relative image_path fields to scenes and library_images, backfills paths from legacy public URLs, and records counts/sample IDs for rows that cannot be translated. It updates folder projections and atomic story saving to retain paths, and introduces can_read_scene_storage_object so a private scene object remains readable to its owner, an admin, or viewers of a visible published story.",
    rows: [
      {
        id: "media-path-backfill",
        title: "URL-to-path transition and exception record",
        summary:
          "Separates durable object identity from public URL presentation and records unmigrated counts/sample IDs in app_settings instead of silently treating unknown URLs as converted.",
        badgeLabel: "MEDIA MIGRATION",
        badgeClass: "db-migration",
        details: [],
      },
      {
        id: "scene-private-read-helper",
        title: "Scene object read authorization",
        summary:
          "Authorizes owner/admin reads directly and anonymous publication reads only when a path belongs to a visible story whose creator has not hidden published works.",
        badgeLabel: "STORAGE RLS",
        badgeClass: "db-migration",
        details: [],
        security: true,
      },
      {
        id: "atomic-save-media-path",
        title: "Path-aware story synchronization",
        summary:
          "Extends the ownership-guarded atomic save function so scene image paths survive story edits alongside the retained URL field.",
        badgeLabel: "ATOMIC SAVE",
        badgeClass: "db-migration",
        details: [],
      },
    ],
    reviewedSource: "Manual review of both columns/indexes/backfills, exception telemetry, folder RPC, read helper, grants, and complete atomic-save replacement.",
  },
  {
    path: "/supabase/migrations/20260614101828_f8eaf601-dbab-46e4-9c6e-bac43faad060.sql",
    header: migrationHeader,
    metric: "29 lines",
    metricDescription: "Owner/admin-only Image Library object access.",
    description:
      "Removes public reads from image_library and allows authenticated owners or admins to read objects by the first path segment. Uploads remain restricted to the authenticated user's own prefix.",
    rows: [],
    reviewedSource: "Manual review of removed public policy and replacement SELECT/INSERT path conditions.",
  },
  {
    path: "/supabase/migrations/20260614110123_f5920e48-fe09-4103-8fe8-c0ddce58a979.sql",
    header: migrationHeader,
    metric: "22 lines",
    metricDescription: "Published-aware private scene-object policy.",
    description:
      "Re-runs the legacy scene URL-to-path backfill, removes the permissive public scene-object SELECT policy, and delegates reads to can_read_scene_storage_object for owner, admin, or visible-publication authorization.",
    rows: [],
    reviewedSource: "Manual review of the idempotent backfill and replacement storage SELECT policy.",
  },
  {
    path: "/supabase/migrations/20260619074538_c40f68e6-46ad-48e2-ab2a-2864aad5b794.sql",
    header: migrationHeader,
    metric: "259 lines",
    metricDescription: "Backend prompt secrecy, scoped settings, social privacy, and counter visibility hardening.",
    description:
      "Removes public direct access to art-style backend prompts and app settings, replacing them with sanitized public RPCs and a three-key authenticated settings allowlist. It propagates hide_published_works through story/character/codex/theme/scene policies, restricts likes to owner/admin reads with a current-user lookup RPC, hardens view/play registration to visible creators, and makes guide-image writes admin-only.",
    rows: [
      {
        id: "public-config-projections",
        title: "Sanitized art-style and setting projections",
        summary:
          "Exposes style labels/thumbnails/order and approved public flags without returning backend prompts or unrestricted settings rows.",
        badgeLabel: "DATA MINIMIZATION",
        badgeClass: "db-migration",
        details: [],
        security: true,
      },
      {
        id: "published-child-privacy",
        title: "Creator privacy on published child content",
        summary:
          "Requires visible publication state and a creator who has not hidden works before non-owner access to story and child content is allowed.",
        badgeLabel: "RLS",
        badgeClass: "db-migration",
        details: [],
      },
    ],
    reviewedSource: "Manual review of every dropped/replacement policy, four RPCs, grants, visibility checks, and guide-image policies.",
  },
  {
    path: "/supabase/migrations/20260619090615_73d44546-16d8-4241-beae-7535557b105e.sql",
    header: migrationHeader,
    metric: "86 lines",
    metricDescription: "Privacy-shaped public reviews and creator ratings.",
    description:
      "Creates get_public_scenario_reviews with bounded pagination and reviewer identity masking, plus get_creator_overall_rating with hidden-work owner/admin exceptions. It removes broad raw review reads; users retain access to their own reviews while admins can read, update, and delete all reviews.",
    rows: [],
    reviewedSource: "Manual review of both RPCs, bounds, publication/privacy filters, grants, and replacement review policies.",
  },
  {
    path: "/supabase/migrations/20260619094840_6b93cd9a-5cef-4056-972e-aff284c56fe1.sql",
    header: migrationHeader,
    metric: "226 lines",
    metricDescription: "Sanitized publication, moderation, report, and strike access.",
    description:
      "Restricts direct published_scenarios reads to owners/admins and exposes saved publications through a sanitized current-user projection that omits moderation fields. It adds owner/admin moderation-counter access, removes reports from realtime, and replaces raw self-reads of reports and strikes with limited get_my_submitted_reports and get_my_account_status results.",
    rows: [
      {
        id: "sanitized-saved-publications",
        title: "Saved-story projection without moderation internals",
        summary:
          "Returns the current user's saved publication and story display fields only when the publication remains visible and its creator has not hidden works.",
        badgeLabel: "SANITIZED RPC",
        badgeClass: "db-migration",
        details: [],
      },
      {
        id: "sanitized-user-moderation-status",
        title: "Limited report and account-status views",
        summary:
          "Lets a user see report status and aggregate strike state without exposing raw administrative notes, accused-user details, or full strike rows.",
        badgeLabel: "PRIVACY",
        badgeClass: "db-migration",
        details: [],
        security: true,
      },
    ],
    reviewedSource: "Manual review of publication policies, four RPCs, direct-read removals, realtime removal, visibility filters, and grants.",
  },
  {
    path: "/supabase/migrations/20260619105616_26249211-83b9-43ce-b6b8-ead8b86f591b.sql",
    header: migrationHeader,
    metric: "216 lines",
    metricDescription: "Private media paths, migration telemetry, and storage authorization foundation.",
    description:
      "Adds path fields for page/sidebar backgrounds, story covers, base-character avatars, and side-character avatars; creates admin-readable media_migration_errors; and adds private-media authorization and cover-promotion metadata RPCs. It installs but initially disables URL-null enforcement triggers and defines owner/admin storage policies for private background, avatar, and story-cover buckets, including published-cover reads.",
    rows: [
      {
        id: "private-media-identities",
        title: "Bucket-relative canonical media identities",
        summary:
          "Introduces path columns so signed URL hydration can replace durable storage of public URLs across user backgrounds, story covers, and character avatars.",
        badgeLabel: "PRIVATE MEDIA",
        badgeClass: "db-migration",
        details: [],
      },
      {
        id: "media-lockdown-guard",
        title: "Deferred URL-null enforcement",
        summary:
          "Defines validation that user media rows must use paths rather than public URLs, but creates its triggers disabled so data migration can finish before enforcement begins.",
        badgeLabel: "ROLLOUT GUARD",
        badgeClass: "db-migration",
        details: [],
      },
      {
        id: "private-bucket-policies",
        title: "Owner/admin private bucket policies",
        summary:
          "Scopes background and avatar objects to owner folders and permits public story-cover reads only through the published-media helper.",
        badgeLabel: "STORAGE RLS",
        badgeClass: "db-migration",
        details: [],
        security: true,
      },
    ],
    reviewedSource: "Manual review of all path fields, telemetry table/policy, read/promotion helpers, disabled triggers, and four private bucket policy groups.",
  },
  {
    path: "/supabase/migrations/20260619110330_cd5809a8-816c-47ad-b033-57dacf21afc2.sql",
    header: migrationHeader,
    metric: "222 lines",
    metricDescription: "Atomic story synchronization with cover and avatar paths.",
    description:
      "Replaces save_scenario_atomic again so story cover_image_path and character avatar_path are inserted and updated alongside their URL fields. It preserves the authentication, parent ownership, conflict-update, child deletion, and row-count guards from the hardened function.",
    rows: [],
    reviewedSource: "Manual review of the complete replacement function, new path mappings, and retained ownership guards.",
  },
  {
    path: "/supabase/migrations/20260620025928_f9345a5d-e4d5-4936-b73d-4c39726fd0d7.sql",
    header: migrationHeader,
    metric: "9 lines",
    metricDescription: "Session-level private avatar path.",
    description:
      "Adds character_session_states.avatar_path for a playthrough-specific object in character_avatars_private and documents the signed-URL hydration contract. This stage intentionally does not attach URL-null enforcement to session states.",
    rows: [],
    reviewedSource: "Manual review of the column, database comment, and explicit no-trigger transition note.",
  },
  {
    path: "/supabase/migrations/20260620030630_abf5629d-719f-4374-89cd-fb5ccf3fc384.sql",
    header: migrationHeader,
    metric: "40 lines",
    metricDescription: "Enforced private user and sidebar background migration.",
    description:
      "Makes background URL columns nullable, clears legacy URLs when a private path exists, restricts the old public backgrounds bucket to admin writes, and enables path-required URL-null triggers for user backgrounds and non-default/non-shared sidebar backgrounds.",
    rows: [],
    reviewedSource: "Manual review of nullability, data updates, public bucket policy replacements, and enabled trigger attachments.",
  },
  {
    path: "/supabase/migrations/20260620031612_c402dace-9874-4947-a166-a4c9d323bfd0.sql",
    header: migrationHeader,
    metric: "59 lines",
    metricDescription: "Public cover/character-avatar write lockdown and URL cleanup.",
    description:
      "Removes user writes from the public covers bucket in favor of admin operations, narrows public avatars uploads/updates to profile-avatar filenames under the user's folder, and clears legacy public avatar URLs from character rows whose private avatar_path is already canonical.",
    rows: [],
    reviewedSource: "Manual review of covers policy replacements, profile-avatar regex/path conditions, retained delete behavior, and three table cleanup updates.",
  },
  {
    path: "/supabase/migrations/20260620035738_5523a3aa-0c51-4608-bcb2-61c0dfca12c2.sql",
    header: migrationHeader,
    metric: "111 lines",
    metricDescription: "Admin reference scan and guarded cleanup of legacy character avatars.",
    description:
      "Creates the admin-only scan_legacy_avatar_refs RPC, which searches snapshot, message, memory, story, character, codex, profile, and URL-bearing fields for candidate object names. It then performs a one-time deletion of public character-avatar objects only when a private mirror exists with no live URL reference or when exhaustive reference checks show a no-mirror object is orphaned; profile-avatar filenames are excluded by pattern.",
    rows: [
      {
        id: "avatar-reference-scan",
        title: "Cross-system legacy reference scan",
        summary:
          "Checks structured and unstructured storage-reference surfaces before an admin cleanup tool treats a candidate avatar object as removable.",
        badgeLabel: "SAFETY CHECK",
        badgeClass: "db-migration",
        details: [],
      },
      {
        id: "avatar-destructive-cleanup",
        title: "Pattern-bounded destructive cleanup",
        summary:
          "Deletes only UUID-pattern character avatars under two evidence classes, bypasses storage deletion protection only inside the supervised transaction, and reports before/after counts.",
        badgeLabel: "DESTRUCTIVE",
        badgeClass: "db-migration",
        details: [],
        security: true,
      },
    ],
    reviewedSource: "Manual review of all searched tables/fields, function authorization, object-name regex, mirror/reference conditions, delete override, and result notice.",
  },
  {
    path: "/supabase/migrations/20260620070054_85e99ec3-3d12-4e7a-a447-2fb3896618cf.sql",
    header: migrationHeader,
    metric: "12 lines",
    metricDescription: "Realtime removal and trigger-helper execution lockdown.",
    description:
      "Removes published_scenarios from realtime and revokes direct execution of internal signup, timestamp, aggregate, counter-sync, review-validation, and media-enforcement trigger functions from public, anonymous, and authenticated roles. PostgreSQL triggers continue to invoke them internally.",
    rows: [],
    reviewedSource: "Manual review of publication removal and every revoked function signature/role.",
  },
]);
