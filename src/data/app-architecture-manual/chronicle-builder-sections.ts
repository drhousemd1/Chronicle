import { defineManualArchitectureFiles } from "./types";

const componentHeader = {
  label: "REACT COMPONENT" as const,
  className: "component" as const,
  filterValue: "component" as const,
  navAccent: "component" as const,
};

export const chronicleBuilderSectionArchitectureFiles = defineManualArchitectureFiles([
  {
    path: "/src/components/chronicle/CharacterGoalsSection.tsx",
    header: componentHeader,
    metric: "360 lines",
    metricDescription: "Character-specific goal and progress editor.",
    description:
      "Edits a character's goals, desired outcomes, guidance strength, and ordered completion steps while also supporting a collapsed read view. It seeds one empty goal when the supplied collection is empty, calculates progress from completed steps when steps exist, stamps updates and completed steps, and delegates optional AI enhancement of goal text back to the owning character editor.",
    rows: [
      {
        id: "character-goal-state",
        title: "Goal and step state",
        summary:
          "Creates stable goal and step IDs, returns immutable collection updates to the parent, and derives visible progress from step completion rather than duplicating it when steps are present.",
        badgeLabel: "FORM STATE",
        badgeClass: "feature",
        details: [
          { label: "Edits", values: ["CharacterGoal title", "desiredOutcome", "flexibility", "GoalStep description and completed state"], kind: "plain" },
          { label: "Uses", values: ["/src/components/chronicle/GuidanceStrengthSlider.tsx", "/src/components/chronicle/CircularProgress.tsx", "/src/components/chronicle/AutoResizeTextarea.tsx"], kind: "files" },
          { label: "Output", values: ["complete next CharacterGoal array through onChange"], kind: "plain" },
        ],
      },
      {
        id: "character-goal-ai-handoff",
        title: "Optional AI enhancement handoff",
        summary:
          "Supplies stable field keys, current-value readers, and setters for goal outcome or step text without making a provider request itself.",
        badgeLabel: "AI HANDOFF",
        badgeClass: "integration",
        details: [
          { label: "Caller Contract", values: ["onEnhanceField", "enhancingField"], kind: "plain" },
          { label: "Guardrail", values: ["all enhancement buttons are disabled while any field is being processed"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of default seeding, sorting, progress calculation, CRUD operations, step timestamps, read-only behavior, and AI callbacks.",
  },
  {
    path: "/src/components/chronicle/ContentThemesSection.tsx",
    header: componentHeader,
    metric: "372 lines",
    metricDescription: "Story discoverability and content-classification editor.",
    description:
      "Edits the ContentThemes object used to classify a story by character types, SFW or NSFW story type, genres, origin, trigger warnings, and custom tags. Prebuilt values come from the content-theme constants, callers receive a complete next themes object, and validation messages for story type or tags are rendered without the component deciding publish eligibility.",
    rows: [
      {
        id: "content-theme-categories",
        title: "Prebuilt and custom category selection",
        summary:
          "Supports multi-select category lists, single-select story type, and caller-visible custom values that are not present in the predefined catalogues.",
        badgeLabel: "CLASSIFICATION",
        badgeClass: "data-block",
        details: [
          { label: "Catalogues", values: ["CHARACTER_TYPES", "STORY_TYPES", "GENRES", "ORIGINS", "TRIGGER_WARNINGS"], kind: "plain" },
          { label: "Custom Input", values: ["Enter saves", "Escape cancels", "duplicate values are rejected"], kind: "plain" },
          { label: "Output", values: ["updated ContentThemes through onUpdate"], kind: "plain" },
        ],
      },
      {
        id: "content-theme-publish-feedback",
        title: "Publish-validation feedback",
        summary:
          "Marks story-type or tag sections when the owning publish workflow reports missing or invalid classification data.",
        badgeLabel: "VALIDATION UI",
        badgeClass: "component",
        details: [
          { label: "Inputs", values: ["storyTypeError", "tagsError"], kind: "plain" },
          { label: "Does Not Own", values: ["publish validation rules", "gallery persistence", "search indexing"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of all selector helpers, custom-value lifecycle, field updates, validation rendering, and the complete themes surface.",
  },
  {
    path: "/src/components/chronicle/PersonalitySection.tsx",
    header: componentHeader,
    metric: "363 lines",
    metricDescription: "Character personality trait editor with standard and split models.",
    description:
      "Edits CharacterPersonality as either one standard trait list or separate outward and inward lists. Each trait carries a label, value, and flexibility setting; mode switches copy meaningful data into the destination representation so a user does not silently lose entered traits, and optional AI enhancement can request both a label and value for a selected row.",
    rows: [
      {
        id: "personality-mode-conversion",
        title: "Standard and split personality conversion",
        summary:
          "Transforms populated traits when changing modes, generating new IDs for copied rows and retaining empty starter rows only when a destination would otherwise be blank.",
        badgeLabel: "STATE TRANSFORM",
        badgeClass: "code-logic",
        details: [
          { label: "Standard", values: ["personality.traits"], kind: "plain" },
          { label: "Split", values: ["personality.outwardTraits", "personality.inwardTraits"], kind: "plain" },
          { label: "Guardrail", values: ["only traits with a real label or value are migrated between modes"], kind: "plain" },
        ],
      },
      {
        id: "personality-trait-ai",
        title: "Trait AI enhancement contract",
        summary:
          "Uses the character-ai generate-both protocol to request a paired label and value, then parses the response before applying either field.",
        badgeLabel: "AI HANDOFF",
        badgeClass: "integration",
        details: [
          { label: "Uses", values: ["/src/services/character-ai.ts"], kind: "files" },
          { label: "Input", values: ["stable trait field key", "current label and value"], kind: "plain" },
          { label: "Output", values: ["parsed label/value patch through the parent-owned enhancer"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of default personality data, row editing, flexibility, mode conversion, collapsed display, and AI enhancement parsing.",
  },
  {
    path: "/src/components/chronicle/StoryGoalsSection.tsx",
    header: componentHeader,
    metric: "365 lines",
    metricDescription: "Story-level goal and milestone editor.",
    description:
      "Edits StoryGoal records, desired outcomes, guidance strength, and completion steps for the overall story. It seeds one empty goal for a blank collection, calculates progress exclusively from step completion, sorts goals by that progress, renders publish-error emphasis supplied by the parent, and delegates optional AI text enhancement without invoking a provider itself.",
    rows: [
      {
        id: "story-goal-state",
        title: "Story goal and milestone state",
        summary:
          "Creates and updates stable goal and step records, stamps goal changes and step completion, and returns the full next collection to the Story Builder.",
        badgeLabel: "FORM STATE",
        badgeClass: "feature",
        details: [
          { label: "Edits", values: ["StoryGoal title", "desiredOutcome", "flexibility", "GoalStep description and completed state"], kind: "plain" },
          { label: "Progress", values: ["completed steps divided by total steps; goals without steps show zero"], kind: "plain" },
          { label: "Output", values: ["complete next StoryGoal array through onChange"], kind: "plain" },
        ],
      },
      {
        id: "story-goal-publish-and-ai",
        title: "Publish feedback and AI handoff",
        summary:
          "Shows the owning workflow's publish error state and exposes stable enhancement field contracts for outcomes and step descriptions.",
        badgeLabel: "EDITOR INTEGRATION",
        badgeClass: "integration",
        details: [
          { label: "Inputs", values: ["hasError", "onEnhanceField", "enhancingField"], kind: "plain" },
          { label: "Does Not Own", values: ["publish eligibility", "provider calls", "goal persistence"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of default seeding, goal and step CRUD, progress, sort order, read-only view, publish-error state, and enhancement callbacks.",
  },
  {
    path: "/src/components/chronicle/SideCharacterCard.tsx",
    header: componentHeader,
    metric: "119 lines",
    metricDescription: "Compact AI- or user-controlled side-character card.",
    description:
      "Displays a side character's avatar or initial, name, and User or AI control badge, with optional edit and delete actions. An isUpdating state overlays a blue progress treatment and avatar-generation state shows a spinner; the component does not load, generate, edit, or delete the character itself.",
    rows: [],
    reviewedSource: "Manual review of avatar fallbacks, control badge, updating treatment, theme variation, and optional action menu.",
  },
  {
    path: "/src/components/chronicle/MemoriesModal.tsx",
    header: componentHeader,
    metric: "386 lines",
    metricDescription: "Conversation memory manager.",
    description:
      "Displays, creates, edits, and deletes the conversation's durable Memory records through async callbacks supplied by the chat owner. New memories are limited to 300 characters and tagged with a selected story day and time of day; existing rows are sorted chronologically, distinguish message-derived memories, and can be edited individually or removed in a confirmed delete-all action.",
    rows: [
      {
        id: "memory-management-actions",
        title: "Memory CRUD handoff",
        summary:
          "Owns form and pending-state behavior while delegating all durable persistence to the surrounding conversation runtime.",
        badgeLabel: "PERSISTENCE UI",
        badgeClass: "feature",
        details: [
          { label: "Creates", values: ["content", "day", "time of day"], kind: "plain" },
          { label: "Mutates", values: ["onUpdateMemory", "onDeleteMemory", "onDeleteAllMemories"], kind: "plain" },
          { label: "Guardrails", values: ["blank content rejected", "300-character maximum", "delete-all browser confirmation"], kind: "plain" },
        ],
      },
      {
        id: "memory-runtime-toggle",
        title: "Memory participation toggle",
        summary:
          "Displays and changes the parent-owned setting that decides whether saved chat memories participate in the roleplay workflow.",
        badgeLabel: "RUNTIME SETTING",
        badgeClass: "context",
        details: [
          { label: "Input", values: ["memoriesEnabled"], kind: "plain" },
          { label: "Output", values: ["onToggleEnabled"], kind: "plain" },
          { label: "Does Not Own", values: ["prompt inclusion or memory retrieval"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of enable state, add/edit/delete flows, day/time selectors, sorting, message-source display, and async error handling.",
  },
]);
