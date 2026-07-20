import { defineManualArchitectureFiles } from "./types";

const migrationHeader = {
  label: "DB MIGRATION" as const,
  className: "db-migration" as const,
  filterValue: "db-migration" as const,
  navAccent: "db-migration" as const,
};

export const supabaseMayMigrationArchitectureFiles = defineManualArchitectureFiles([
  {
    path: "/supabase/migrations/20260502114500_update_story_default_model_to_grok_4_20_reasoning.sql",
    header: migrationHeader,
    metric: "3 lines",
    metricDescription: "Default story model update to Grok 4.20 reasoning.",
    description:
      "Changes the default selected_model for newly created stories to grok-4.20-0309-reasoning. It does not rewrite model choices already stored on existing stories.",
    rows: [],
    reviewedSource: "Manual review of the target table, column, and model identifier.",
  },
  {
    path: "/supabase/migrations/20260506224500_add_conversation_dialog_debug_comments.sql",
    header: migrationHeader,
    metric: "76 lines",
    metricDescription: "Generation-specific tester comments on roleplay dialogue.",
    description:
      "Creates conversation_dialog_debug_comments so a user can attach a note and tags to one exact conversation message generation. A unique conversation/message/generation key prevents duplicate comment rows, owner-only RLS protects all operations, and the standard timestamp trigger maintains edited comments.",
    rows: [],
    reviewedSource: "Manual review of lineage fields, uniqueness and lookup indexes, all owner policies, and timestamp trigger.",
  },
  {
    path: "/supabase/migrations/20260507031244_0c84d7a0-7fd0-4da9-b8a7-867e48406529.sql",
    header: migrationHeader,
    metric: "71 lines",
    metricDescription: "Idempotent duplicate of the dialog-debug comment schema.",
    description:
      "Repeats the conversation_dialog_debug_comments table, indexes, RLS policies, and timestamp trigger using conditional creation. It preserves migration history but adds no new architectural capability beyond the preceding migration.",
    rows: [],
    reviewedSource: "Manual comparison against the preceding dialog-comment migration and review of every repeated object.",
  },
  {
    path: "/supabase/migrations/20260507032313_e4496cef-ad79-47c3-872d-e361ce149dae.sql",
    header: migrationHeader,
    metric: "8 lines",
    metricDescription: "Dialog-comment timestamp trigger repair.",
    description:
      "Drops and recreates the updated_at trigger on conversation_dialog_debug_comments so edits consistently use the shared update_updated_at_column function.",
    rows: [],
    reviewedSource: "Manual review of the trigger replacement and invoked function.",
  },
  {
    path: "/supabase/migrations/20260509061600_1e750646-4b80-40be-ab44-7a8f56c8301a.sql",
    header: migrationHeader,
    metric: "20 lines",
    metricDescription: "Roleplay state-change evidence, world snapshots, and API-call traces.",
    description:
      "Creates three owner-protected diagnostic tables: conversation_state_change_events for field-level before/after previews tied to one message generation, conversation_world_state_snapshots for generation-scoped world JSON, and conversation_api_call_traces for request, response, parsed, applied, skipped, and error evidence across known roleplay call types.",
    rows: [
      {
        id: "state-change-events",
        title: "Applied state-change ledger",
        summary:
          "Records which entity and field changed, old/new previews, story time, summary, call type, and exact source generation without granting update access to immutable events.",
        badgeLabel: "STATE EVIDENCE",
        badgeClass: "db-table",
        details: [],
      },
      {
        id: "world-state-snapshots",
        title: "Generation-linked world snapshots",
        summary:
          "Stores at most one world-state snapshot per conversation/message/generation and allows the owner to inspect or maintain that derived state.",
        badgeLabel: "WORLD STATE",
        badgeClass: "db-table",
        details: [],
      },
      {
        id: "conversation-api-traces",
        title: "API and support-call trace records",
        summary:
          "Captures bounded call-type/status records with request, response, parsed output, applied changes, and errors for debugging the generation and support pipeline.",
        badgeLabel: "DEBUG TRACE",
        badgeClass: "db-table",
        details: [],
      },
    ],
    reviewedSource: "Manual review of all three schemas, checks, indexes, owner policies, uniqueness, and snapshot timestamp trigger.",
  },
  {
    path: "/supabase/migrations/20260521044256_424aa268-34cd-41aa-a2ea-dc2779b01344.sql",
    header: migrationHeader,
    metric: "112 lines",
    metricDescription: "Per-conversation story and character goal-alignment state.",
    description:
      "Creates goal_alignment_states for score, status, trend, accumulated support/resistance/drift signals, latest rationale and story time, source message/generation, and previous-state evidence. A scope constraint keeps story goals unscoped and character goals tied to a real character; uniqueness yields one current row per conversation, goal kind, character scope, and goal ID, while owner plus conversation ownership protects all operations.",
    rows: [],
    reviewedSource: "Manual review of goal/scope constraints, signal vocabulary, source lineage, indexes, conversation-backed owner policies, and timestamp trigger.",
  },
]);
