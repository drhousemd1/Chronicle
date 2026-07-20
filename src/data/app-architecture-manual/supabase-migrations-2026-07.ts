import { defineManualArchitectureFiles } from "./types";

const migrationHeader = {
  label: "DB MIGRATION" as const,
  className: "db-migration" as const,
  filterValue: "db-migration" as const,
  navAccent: "db-migration" as const,
};

export const supabaseJulyMigrationArchitectureFiles = defineManualArchitectureFiles([
  {
    path: "/supabase/migrations/20260719001853_b7174d69-8075-443a-a464-6da9a10d50df.sql",
    header: migrationHeader,
    metric: "233 lines",
    metricDescription: "Terminal removal of structured mood from atomic saving and live schema.",
    description:
      "In one transaction, replaces save_scenario_atomic with a version that no longer reads, inserts, or updates the retired structured-mood field, then drops that field from characters, side_characters, and character_session_states. All existing ownership, child synchronization, private media path, and affected-row guards remain intact; after this migration, structured mood is not part of the live database schema.",
    rows: [
      {
        id: "mood-free-atomic-save",
        title: "Mood-free atomic story synchronization",
        summary:
          "Removes the retired structured-mood field from the function's character column, value, and update lists without weakening authentication, parent ownership, or synchronized child behavior.",
        badgeLabel: "FUNCTION REPLACEMENT",
        badgeClass: "db-migration",
        details: [],
      },
      {
        id: "mood-column-removal",
        title: "Destructive terminal schema cleanup",
        summary:
          "Drops the structured-mood column from all three character-state layers inside the same transaction, intentionally deleting the retired stored values.",
        badgeLabel: "COLUMN DROP",
        badgeClass: "db-migration",
        details: [],
      },
    ],
    reviewedSource: "Manual comparison with the prior atomic-save function and review of all three terminal DROP COLUMN statements within the transaction.",
  },
]);
