import { defineManualArchitectureFiles } from "./types";

const componentHeader = {
  label: "REACT COMPONENT" as const,
  className: "component" as const,
  filterValue: "component" as const,
  navAccent: "component" as const,
};

const codeLogicHeader = {
  label: "CODE LOGIC" as const,
  className: "code-logic" as const,
  filterValue: "code-logic" as const,
  navAccent: "code-logic" as const,
};

export const characterBuilderEditorArchitectureFiles = defineManualArchitectureFiles([
  {
    path: "/src/features/character-builder/CharacterBuilderScreen.tsx",
    header: componentHeader,
    metric: "1,994 lines",
    metricDescription: "Full character-building workspace for scenario-owned main characters.",
    description:
      "Displays the scenario's character library and, after selection, edits one main character across the canonical built-in trait sections and user-created sections. The screen owns section navigation, completion indicators, field-level AI enhancement, avatar positioning, and navigation-button artwork, but it delegates the character record itself to the parent through onUpdate, onDelete, onSelect, and optional section-creation callbacks.",
    rows: [
      {
        id: "character-builder-field-workspace",
        title: "Character field and section workspace",
        summary:
          "Maps the selected Character into built-in editors for identity, appearance, clothing, personality, tone, background, life events, relationships, secrets, fears, and goals, alongside structured or freeform custom sections.",
        badgeLabel: "STATE EDITOR",
        badgeClass: "feature",
        details: [
          { label: "Input", values: ["ScenarioData.characters", "selected character ID", "optional parent-owned custom-section creator"], kind: "plain" },
          { label: "Writes Through", values: ["onUpdate with a character ID and partial Character patch", "onDelete", "onSelect"], kind: "plain" },
          { label: "Section Rules", values: ["canonical basics key with legacy profile alias", "built-in field groups", "structured and freeform custom sections", "extras attached to supported built-in sections"], kind: "plain" },
          { label: "Guardrails", values: ["invalid active sections return to the first available section", "new custom sections become the active section", "timestamps are refreshed on custom section and item edits"], kind: "plain" },
        ],
      },
      {
        id: "character-builder-ai-enhancement",
        title: "Field-level AI enhancement",
        summary:
          "Opens the enhancement-mode chooser for one field, sends the current field and surrounding character/scenario context to the character AI service, and writes only the returned field value back through the normal character update boundary.",
        badgeLabel: "AI ACTION",
        badgeClass: "api-call",
        details: [
          { label: "Service", values: ["aiEnhanceCharacterField"], kind: "plain" },
          { label: "Inputs", values: ["field key", "current field text", "selected character", "full ScenarioData", "selected model", "optional custom label", "enhancement mode"], kind: "plain" },
          { label: "Special Handling", values: ["generate-both responses may supply a new extra-row label and value"], kind: "plain" },
          { label: "Failure Handling", values: ["one enhancement runs at a time", "errors leave the current value intact", "a toast reports the failure"], kind: "plain" },
        ],
      },
      {
        id: "character-builder-avatar",
        title: "Avatar generation and crop position",
        summary:
          "Accepts generated avatar URLs and private storage paths, lets the user reposition the square avatar crop with mouse or touch, and translates that stored crop position for the differently shaped character header tile.",
        badgeLabel: "MEDIA",
        badgeClass: "integration",
        details: [
          { label: "Receives", values: ["signed or sentinel avatar URL", "private avatar storage path", "stored percentage position"], kind: "plain" },
          { label: "Writes", values: ["avatarDataUrl", "avatarPath", "avatarPosition"], kind: "plain" },
          { label: "Boundary", values: ["AvatarGenerationModal owns image generation and upload", "the screen persists the returned path without uploading the generated image a second time"], kind: "plain" },
          { label: "Guardrails", values: ["positions are clamped to 0-100", "natural image dimensions are cached for preview-to-tile coordinate conversion"], kind: "plain" },
        ],
      },
      {
        id: "character-builder-nav-artwork",
        title: "Character-section navigation artwork",
        summary:
          "Loads the shared character navigation-image map, lets an administrator upload, drag, and scale artwork for one section button, and persists the completed map in app settings.",
        badgeLabel: "APP SETTINGS",
        badgeClass: "integration",
        details: [
          { label: "Storage", values: ["backgrounds bucket for newly uploaded image files", "app_settings through updateNavButtonImages"], kind: "plain" },
          { label: "Compatibility", values: ["normalizes profile to the canonical basics key", "writes both aliases while older consumers still expect profile"], kind: "plain" },
          { label: "Failure Handling", values: ["the editor remains open when app-setting persistence fails", "the draft is not discarded so the user can retry"], kind: "plain" },
        ],
      },
      {
        id: "character-builder-progress",
        title: "Section navigation and completion feedback",
        summary:
          "Builds the sidebar from canonical built-in and current custom sections, calculates each section's filled-field percentage, and presents the active section without changing the underlying completion data.",
        badgeLabel: "NAVIGATION",
        badgeClass: "component",
        details: [
          { label: "Uses", values: ["calculateCharacterSectionProgress", "TraitNavButton", "TraitProgressRing", "TabFieldNavigator"], kind: "plain" },
          { label: "Does Not Own", values: ["overall scenario save", "database persistence of the Character record", "global character-library import"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of selection and navigation state, field and custom-section mutation, AI enhancement, avatar generation and positioning, navigation-image storage, section progress, empty-library rendering, and parent callback boundaries.",
  },
  {
    path: "/src/features/character-builder/rows/AutoResizeTextareaField.tsx",
    header: componentHeader,
    metric: "38 lines",
    metricDescription: "Controlled textarea that grows to fit its current value.",
    description:
      "Renders a controlled multiline field and recalculates its height from scrollHeight whenever the supplied value changes. It reports text edits through onChange and owns no character data, validation, or persistence.",
    rows: [],
    reviewedSource: "Manual review of the textarea ref, value-driven height reset, and controlled onChange boundary.",
  },
  {
    path: "/src/features/character-builder/rows/ExtraRow.tsx",
    header: componentHeader,
    metric: "78 lines",
    metricDescription: "Editable label/value row for user-defined character facts.",
    description:
      "Renders one CharacterExtraRow with an editable label, auto-resizing value, optional AI-enhance action, and delete action. The parent supplies every mutation callback; this row does not decide which section owns the extra or persist it.",
    rows: [],
    reviewedSource: "Manual review of label/value callbacks, enhancement loading state, deletion, and layout behavior.",
  },
  {
    path: "/src/features/character-builder/rows/HardcodedRow.tsx",
    header: componentHeader,
    metric: "71 lines",
    metricDescription: "Locked-label editor row for a built-in character field.",
    description:
      "Displays a non-editable canonical field label beside a controlled auto-resizing value editor, with an optional AI-enhance action. The lock icon communicates that the field name belongs to Chronicle's schema while the parent owns the value and any enhancement request.",
    rows: [],
    reviewedSource: "Manual review of locked-label rendering, controlled text editing, optional enhancement action, and loading state.",
  },
  {
    path: "/src/features/character-builder/sections/HardcodedSection.tsx",
    header: componentHeader,
    metric: "39 lines",
    metricDescription: "Presentational collapsible shell for a canonical character section.",
    description:
      "Provides the shared titled card, expand/collapse button, body surface, and optional collapsed summary used around built-in character sections. Expansion state and all section content are supplied by the parent.",
    rows: [],
    reviewedSource: "Manual review of title, toggle callback, expanded children, collapsed-content fallback, and styling boundary.",
  },
  {
    path: "/src/features/character-builder/sidebar/TraitNavButton.tsx",
    header: componentHeader,
    metric: "78 lines",
    metricDescription: "Character-section navigation button with artwork and completion feedback.",
    description:
      "Renders one sidebar section choice with an icon, optional positioned background image, active styling, and a TraitProgressRing. It delegates navigation to onClick and does not calculate progress or store artwork.",
    rows: [],
    reviewedSource: "Manual review of active styling, optional image positioning, icon rendering, progress delegation, and click boundary.",
  },
  {
    path: "/src/features/character-builder/sidebar/TraitProgressRing.tsx",
    header: componentHeader,
    metric: "64 lines",
    metricDescription: "SVG indicator for section field completion.",
    description:
      "Clamps a supplied percentage to 0-100 and renders either a circular progress stroke with the numeric percentage or a check mark at full completion. It is purely presentational and does not count fields itself.",
    rows: [],
    reviewedSource: "Manual review of percentage clamping, SVG circumference math, completion state, and accessible display role.",
  },
  {
    path: "/src/features/character-builder/types/character-builder.types.ts",
    header: codeLogicHeader,
    metric: "33 lines",
    metricDescription: "Shared contracts for character-builder navigation and progress.",
    description:
      "Defines the canonical built-in section keys, SectionProgress count/percentage shape, and NavButtonImageConfig used by the builder's sidebar and image editor. The file contains type contracts only and performs no runtime work.",
    rows: [],
    reviewedSource: "Manual review of exported section-key, progress, and navigation-image contracts.",
  },
  {
    path: "/src/features/character-builder/utils/section-keys.ts",
    header: codeLogicHeader,
    metric: "66 lines",
    metricDescription: "Canonical section-key and legacy-alias resolver.",
    description:
      "Defines the ordered built-in character sections and normalizes the legacy profile key to the current basics key. Its helpers return aliases, canonicalize keys, and compare section identities so navigation artwork and active-section state remain stable across older saved settings.",
    rows: [],
    reviewedSource: "Manual review of canonical section order, profile/basics aliasing, custom-key preservation, and match helpers.",
  },
  {
    path: "/src/features/character-builder/utils/section-progress.ts",
    header: codeLogicHeader,
    metric: "168 lines",
    metricDescription: "Field-aware completion calculator for every character section.",
    description:
      "Counts filled and total fields for the selected built-in or custom character section and returns a percentage used by the builder sidebar. It handles structured and freeform custom sections, split or combined personality layouts, extras, and goal title/outcome/step content instead of treating every section as the same shape.",
    rows: [
      {
        id: "character-section-progress-rules",
        title: "Section-specific counting rules",
        summary:
          "Uses an explicit field list for each canonical section so the completion ring measures the data that section actually owns.",
        badgeLabel: "DERIVED STATE",
        badgeClass: "code-logic",
        details: [
          { label: "Built-In Coverage", values: ["basics", "physical appearance", "currently wearing", "preferred clothing", "personality", "tone", "background", "key life events", "relationships", "secrets", "fears", "character goals"], kind: "plain" },
          { label: "Custom Coverage", values: ["structured label/value items", "freeform items", "legacy freeformValue"], kind: "plain" },
          { label: "Guardrails", values: ["empty or unknown sections return zero completion", "percentages are derived from filled/total counts", "extras count only their value field"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of every canonical section branch, custom-section handling, personality modes, extras, and goal-step counting.",
  },
  {
    path: "/src/features/character-editor-modal/CharacterEditorModalScreen.tsx",
    header: componentHeader,
    metric: "1,977 lines",
    metricDescription: "Session-scoped character and scenario-card editor used during a playthrough.",
    description:
      "Creates an isolated draft for the selected main or side character, supports view and edit workflows across the full character schema, and returns one consolidated draft through onSave. The modal can also switch to a session-scoped Scenario Card view, upload or regenerate an avatar, and run an explicit deep scan over recent dialogue; it does not commit character or scenario changes until the parent save callback accepts the draft.",
    rows: [
      {
        id: "character-editor-draft-boundary",
        title: "Session-scoped character draft",
        summary:
          "Copies the selected main or side character into local editable state when the modal opens, preserving each record type's supported fields while preventing incomplete edits from mutating the live session immediately.",
        badgeLabel: "DRAFT OWNER",
        badgeClass: "feature",
        details: [
          { label: "Main Character Fields", values: ["identity and control", "appearance and clothing", "personality", "background", "tone", "life events", "relationships", "secrets", "fears", "goals", "custom sections", "avatar"], kind: "plain" },
          { label: "Side Character Fields", values: ["identity and control", "appearance and clothing", "compact background and personality", "custom sections", "avatar"], kind: "plain" },
          { label: "Commit Boundary", values: ["onSave receives the complete CharacterEditDraft", "onOpenChange owns modal visibility", "the component does not directly persist the accepted draft"], kind: "plain" },
        ],
      },
      {
        id: "character-editor-deep-scan",
        title: "Recent-dialogue deep scan",
        summary:
          "Fetches the latest 50 conversation messages, separates user and assistant text, sends all available character context to extract-character-updates, and merges matching returned updates into the draft for user review before save.",
        badgeLabel: "SUPPORT CALL",
        badgeClass: "api-call",
        details: [
          { label: "Reads", values: ["messages by conversation_id, newest 50 then restored to chronological order", "all supplied main and side character context"], kind: "plain" },
          { label: "Invokes", values: ["extract-character-updates edge function"], kind: "edges" },
          { label: "May Update Draft", values: ["supported scalar and nested fields", "custom section items", "existing goals and completed steps", "new goals and their proposed steps"], kind: "plain" },
          { label: "Evidence", values: ["character_card_ai_update usage event", "API validation snapshot covering conversation, character, dialogue, and character payload presence"], kind: "plain" },
          { label: "Guardrails", values: ["updates must match the selected character name or nickname", "REMOVE does not delete goals", "new_steps are ignored for existing goals", "no result leaves the draft unchanged"], kind: "plain" },
        ],
      },
      {
        id: "character-editor-avatar",
        title: "Session avatar upload and regeneration",
        summary:
          "Allows a local image to be cropped to 512 by 512 and uploaded to private avatar storage, or asks the avatar edge function to generate a replacement from the current draft's appearance fields.",
        badgeLabel: "MEDIA",
        badgeClass: "integration",
        details: [
          { label: "Upload Path", values: ["browser canvas crop", "uploadAvatar", "stored avatar path plus signed or sentinel URL"], kind: "plain" },
          { label: "Generation Path", values: ["generate-side-character-avatar edge function", "model ID", "appearance-derived prompt", "character name"], kind: "plain" },
          { label: "Evidence", values: ["single.character_avatar validation snapshot", "character_avatar_generated usage event"], kind: "plain" },
          { label: "Draft Effects", values: ["avatarDataUrl", "avatarPath", "avatarPosition", "mouse and touch repositioning"], kind: "plain" },
        ],
      },
      {
        id: "character-editor-scenario-card",
        title: "Session scenario-card editing",
        summary:
          "Maintains a separate WorldCore draft for premise, locations, custom world content, and story goals, then returns that patch through onSaveScenarioCard without overwriting unrelated world-core fields.",
        badgeLabel: "SESSION STATE",
        badgeClass: "feature",
        details: [
          { label: "Input", values: ["scenarioWorldCore"], kind: "plain" },
          { label: "Editable Copy", values: ["storyPremise", "structuredLocations", "customWorldSections with copied items", "storyGoals with copied steps"], kind: "plain" },
          { label: "Commit Boundary", values: ["onSaveScenarioCard receives a Partial<WorldCore> patch"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of modal initialization, main/side draft mapping, scenario draft, deep-scan message and edge-function flow, goal and section merge rules, avatar upload/generation/repositioning, field mutation helpers, and save callbacks.",
  },
  {
    path: "/src/features/character-editor-modal/ScenarioCardEditorView.tsx",
    header: componentHeader,
    metric: "371 lines",
    metricDescription: "Editor for the active session's scenario-card fields.",
    description:
      "Edits a Partial<WorldCore> draft supplied by CharacterEditorModalScreen. It presents the story premise, ordered location rows, structured or freeform custom world sections, and StoryGoalsSection, and reports every change through the supplied React state setter; it does not save the scenario or access Supabase directly.",
    rows: [
      {
        id: "scenario-card-draft-shapes",
        title: "Scenario-card collections",
        summary:
          "Supports adding, editing, and removing locations and custom world content while preserving the WorldCore data shapes expected by the parent save boundary.",
        badgeLabel: "DRAFT EDITOR",
        badgeClass: "feature",
        details: [
          { label: "Owns UI For", values: ["storyPremise", "structuredLocations", "structured customWorldSections", "freeform customWorldSections", "storyGoals"], kind: "plain" },
          { label: "Empty Defaults", values: ["two editable location rows when no locations exist", "one freeform item when a freeform section has no item array"], kind: "plain" },
          { label: "Does Not Own", values: ["database persistence", "session authorization", "scenario-wide save", "story-goal business rules inside StoryGoalsSection"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of premise editing, location collection behavior, structured/freeform custom sections, goal delegation, collapse summaries, and parent state-setter boundary.",
  },
  {
    path: "/src/features/navigation/builder-tabs.ts",
    header: codeLogicHeader,
    metric: "26 lines",
    metricDescription: "Canonical builder-tab and legacy-route translation helpers.",
    description:
      "Defines the story_builder and character_builder tab IDs and converts the legacy world and characters route values in both directions. The helpers keep older navigation callers working while the visible builder uses the canonical tab vocabulary.",
    rows: [],
    reviewedSource: "Manual review of canonical IDs, legacy IDs, and both conversion helpers.",
  },
  {
    path: "/src/features/shared-builder/utils/image-position.ts",
    header: codeLogicHeader,
    metric: "63 lines",
    metricDescription: "Crop-position conversion between differently sized image frames.",
    description:
      "Converts a stored percentage position from one cover-cropped preview frame to another by calculating each frame's rendered image overflow. When either frame has no overflow on an axis, it keeps that axis centered instead of inventing movement.",
    rows: [],
    reviewedSource: "Manual review of percent clamping, cover-scale math, overflow offsets, and preview-to-tile coordinate conversion.",
  },
]);
