import { defineManualArchitectureFiles } from "./types";

const migrationHeader = {
  label: "DB MIGRATION" as const,
  className: "db-migration" as const,
  filterValue: "db-migration" as const,
  navAccent: "db-migration" as const,
};

export const supabaseAprilMigrationArchitectureFiles = defineManualArchitectureFiles([
  {
    path: "/supabase/migrations/20260401033000_security_definer_search_path_hardening.sql",
    header: migrationHeader,
    metric: "25 lines",
    metricDescription: "Bulk search-path hardening for public security-definer functions.",
    description:
      "Enumerates every SECURITY DEFINER function in the public schema and sets its search_path to public using each function's exact identity arguments. This reduces object-shadowing risk consistently across legacy and current privileged functions and is safe to rerun.",
    rows: [],
    reviewedSource: "Manual review of pg_proc/pg_namespace selection, security-definer filter, identity-argument resolution, and generated ALTER FUNCTION statement.",
  },
  {
    path: "/supabase/migrations/20260404033146_1f7cf63a-1eeb-4b0d-9cf2-7b358fed3f3b.sql",
    header: migrationHeader,
    metric: "214 lines",
    metricDescription: "Finance Dashboard schema stabilization and private finance-document storage.",
    description:
      "Reintroduces or aligns finance-facing operational objects: test trace events, admin access synchronization, ad spend, admin notes, user reports, strikes, and finance document metadata. It applies admin-role policies, lets authenticated users file reports, creates a private finance_documents bucket with admin-only object access, and enables report realtime updates.",
    rows: [
      {
        id: "finance-schema-stabilization",
        title: "Finance and moderation working schemas",
        summary:
          "Defines the table shapes the Finance Dashboard expected at this point, including a second historical shape for several tables later reconciled by the union migration.",
        badgeLabel: "ADMIN DATA",
        badgeClass: "db-table",
        details: [],
      },
      {
        id: "finance-private-documents",
        title: "Private finance-document boundary",
        summary:
          "Stores finance file metadata separately from bytes and restricts both metadata and private bucket objects to database administrators.",
        badgeLabel: "PRIVATE STORAGE",
        badgeClass: "db-migration",
        details: [],
        security: true,
      },
    ],
    reviewedSource: "Manual review of all created tables, replacement policies, triggers, bucket policies, admin-access function, and realtime change.",
  },
  {
    path: "/supabase/migrations/20260404051740_72f00518-df04-4eda-a14e-38593ab3fbea.sql",
    header: migrationHeader,
    metric: "331 lines",
    metricDescription: "Union repair for divergent finance and usage-test schemas.",
    description:
      "Reconciles columns from competing ad_spend, admin_notes, reports, user_strikes, and ai_usage_test_events definitions without discarding existing data. It backfills the canonical fields, consolidates policies and timestamp triggers, recreates the admin-access RPC with an explicit admin check and setting synchronization, reapplies finance bucket protection, and idempotently enables report realtime.",
    rows: [
      {
        id: "union-schema-backfill",
        title: "Non-destructive schema convergence",
        summary:
          "Adds missing fields from both historical versions and translates existing values into the canonical operational columns before tightening defaults, indexes, and policies.",
        badgeLabel: "DATA REPAIR",
        badgeClass: "db-migration",
        details: [],
      },
      {
        id: "usage-event-shape-convergence",
        title: "Test-event contract convergence",
        summary:
          "Combines the earlier event_type/payload representation with the later event_key, source, model, size, token, cost, and metadata representation so edge functions and admin reports can use one row shape.",
        badgeLabel: "TRACE DATA",
        badgeClass: "db-table",
        details: [],
      },
    ],
    reviewedSource: "Manual review of each ALTER/backfill/default/index/policy branch, admin function replacement, storage policies, and idempotent realtime block.",
  },
  {
    path: "/supabase/migrations/20260404051750_46d7ae9a-122e-4d01-9b06-6e8f7cbfff3a.sql",
    header: migrationHeader,
    metric: "11 lines",
    metricDescription: "Locked search path for the finance timestamp trigger helper.",
    description:
      "Replaces set_updated_at_finance_live_tables with the same updated_at behavior plus an explicit public search_path, aligning this trigger helper with the privileged-function hardening standard.",
    rows: [],
    reviewedSource: "Manual review of the replacement trigger function and search-path declaration.",
  },
  {
    path: "/supabase/migrations/20260404053120_aa23dfb6-e36a-4149-8128-054373894f09.sql",
    header: migrationHeader,
    metric: "27 lines",
    metricDescription: "Idempotent prerequisite fields for the finance union repair.",
    description:
      "Ensures all legacy columns referenced by earlier finance-repair backfills exist on ad_spend, admin_notes, reports, and ai_usage_test_events. Every addition is conditional so databases that already contain the columns are unchanged.",
    rows: [],
    reviewedSource: "Manual review of every conditional column addition and the repair statement that depends on it.",
  },
  {
    path: "/supabase/migrations/20260404095143_ff50e98c-4171-4230-aaf5-5c306b94388d.sql",
    header: migrationHeader,
    metric: "1 line",
    metricDescription: "Usage-test event status field.",
    description:
      "Adds an optional status field to ai_usage_test_events with an ok default so test traces can distinguish successful and unsuccessful event outcomes.",
    rows: [],
    reviewedSource: "Manual review of the event field and default.",
  },
  {
    path: "/supabase/migrations/20260404095700_1f06ecdb-655e-497f-b7dc-85061f16fcdb.sql",
    header: migrationHeader,
    metric: "1 line",
    metricDescription: "Default for legacy usage-test event type.",
    description:
      "Sets an empty-string default on ai_usage_test_events.event_type so inserts using the newer event_key vocabulary do not fail the retained legacy column requirement.",
    rows: [],
    reviewedSource: "Manual review of the altered event_type default.",
  },
  {
    path: "/supabase/migrations/20260404133000_add_side_character_custom_sections.sql",
    header: migrationHeader,
    metric: "6 lines",
    metricDescription: "Initial side-character custom-section field and null repair.",
    description:
      "Adds side_characters.custom_sections as a JSON array and converts any null values to an empty array. The following migration makes the repaired field non-null.",
    rows: [],
    reviewedSource: "Manual review of the conditional column addition and null backfill.",
  },
  {
    path: "/supabase/migrations/20260405034024_03a99d6f-3355-4189-8d72-204d655c9994.sql",
    header: migrationHeader,
    metric: "8 lines",
    metricDescription: "Required side-character custom sections.",
    description:
      "Idempotently ensures custom_sections exists, repeats the null-to-empty-array repair, and then makes the side-character field non-null so consumers can always treat it as an array.",
    rows: [],
    reviewedSource: "Manual review of column creation, data repair, and NOT NULL constraint.",
  },
  {
    path: "/supabase/migrations/20260417041136_297c107c-c7f2-49be-9458-9f4502ee75a7.sql",
    header: migrationHeader,
    metric: "159 lines",
    metricDescription: "Generation lineage, state snapshots, and goal-step derivations.",
    description:
      "Adds generation identity to messages and memory-source lineage, then creates owner-protected message-scoped snapshots for base and side characters plus story_goal_step_derivations. Unique keys bind each derived state or completed goal step to its conversation, source message, and generation so retry/supersession logic can distinguish accepted evidence from stale assistant output.",
    rows: [
      {
        id: "message-generation-lineage",
        title: "Message and memory generation identity",
        summary:
          "Assigns every message a generation ID and lets memories name the source generation, which is essential when retries share a parent message but not an accepted assistant generation.",
        badgeLabel: "LINEAGE",
        badgeClass: "db-migration",
        details: [],
      },
      {
        id: "character-message-snapshots",
        title: "Generation-scoped character snapshots",
        summary:
          "Stores JSON snapshots for base and side characters against the exact assistant message and generation, with owner-only CRUD and uniqueness per character/message/generation.",
        badgeLabel: "STATE SNAPSHOT",
        badgeClass: "db-table",
        details: [],
      },
      {
        id: "goal-step-derivations",
        title: "Evidence-linked goal progress",
        summary:
          "Records a goal-step completion against the exact source message and generation, including story time, and prevents duplicate derivations for the same evidence tuple.",
        badgeLabel: "GOAL STATE",
        badgeClass: "db-table",
        details: [],
      },
    ],
    reviewedSource: "Manual review of message/memory columns, indexes, both snapshot schemas and policies, and goal-derivation schema and policies.",
  },
]);
