import { defineManualArchitectureFiles } from "./types";

const componentHeader = {
  label: "REACT COMPONENT" as const,
  className: "component" as const,
  filterValue: "component" as const,
  navAccent: "component" as const,
};

export const chronicleLibrarySessionThemeArchitectureFiles = defineManualArchitectureFiles([
  {
    path: "/src/components/chronicle/CharacterPicker.tsx",
    header: componentHeader,
    metric: "206 lines",
    metricDescription: "Searchable global-character importer with lazy detail loading.",
    description:
      "Presents lightweight character summaries from the global library, filters them by name or tags, and fetches the selected character's full record only when the user imports it. CharacterPickerWithRefresh refreshes the library when the modal opens and converts full Character records into display summaries; the picker itself owns search, image expansion, loading feedback, and selection, but it does not save the imported character into the scenario.",
    rows: [],
    reviewedSource: "Manual review of summary construction, library refresh, search filtering, full-record fetch, tile expansion, import loading, and callback boundaries.",
  },
  {
    path: "/src/components/chronicle/ConversationsTab.tsx",
    header: componentHeader,
    metric: "157 lines",
    metricDescription: "Paginated launcher for saved roleplay sessions.",
    description:
      "Sorts ConversationMetadata by most recent update, renders at most 30 saved sessions at a time, and reports resume or delete actions to its parent with both scenario and conversation IDs. Each card shows the scenario image, title, creator, message count, update date, and last-message preview; this component does not load message history or delete database rows itself.",
    rows: [],
    reviewedSource: "Manual review of sorting, 30-item pagination, metadata rendering, empty state, resume callbacks, and delete callbacks.",
  },
  {
    path: "/src/components/chronicle/SidebarThemeModal.tsx",
    header: componentHeader,
    metric: "690 lines",
    metricDescription: "Sidebar-background selector, category editor, and ordering workspace.",
    description:
      "Owns the editing session for user-uploaded sidebar backgrounds. It mirrors the supplied UserBackground records while the modal is open, groups them into ordered categories, allows selection, upload, library import, deletion, category renaming, and drag-and-drop movement, and persists changed category and sort-order values through updateSidebarBackgroundCategories. Uploading files, adding library images, deleting storage objects, and applying the selected background remain parent-owned callbacks.",
    rows: [
      {
        id: "sidebar-theme-category-model",
        title: "Category and ordering model",
        summary:
          "Derives stable category rows from each background's category, sortOrder, and createdAt values while keeping Uncategorized first and retaining the user's existing category order across prop refreshes.",
        badgeLabel: "STATE OWNER",
        badgeClass: "feature",
        details: [
          { label: "Inputs", values: ["UserBackground[]", "selected background ID", "upload and library callbacks"], kind: "plain" },
          { label: "Local State", values: ["local background mirror", "category order", "active drag and drop target", "library picker visibility"], kind: "plain" },
          { label: "Empty Values", values: ["missing categories become Uncategorized", "an empty collection still exposes one Uncategorized row", "the Default tile selects no custom background"], kind: "plain" },
        ],
      },
      {
        id: "sidebar-theme-drag-persistence",
        title: "Drag, rename, and persistence boundary",
        summary:
          "Moves one background within or between categories, renumbers the affected rows, updates the parent immediately, and sends only changed category and sort-order values to the database service.",
        badgeLabel: "PERSISTENCE",
        badgeClass: "integration",
        details: [
          { label: "Writes Through", values: ["updateSidebarBackgroundCategories"], kind: "plain" },
          { label: "Persists", values: ["background ID", "category", "sort_order"], kind: "plain" },
          { label: "Does Not Own", values: ["file upload", "library-to-sidebar copy", "background deletion", "selected-theme persistence"], kind: "plain" },
          { label: "Guardrails", values: ["same-position drops are ignored", "source and destination rows are renumbered", "drag state and auto-scroll animation are cleared when the modal closes"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of prop synchronization, category derivation, renaming, drag geometry, reordering, database updates, upload routing, library selection, deletion routing, and selection behavior.",
  },
]);
