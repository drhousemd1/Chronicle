import { defineManualArchitectureFiles } from "./types";

const componentHeader = {
  label: "REACT COMPONENT" as const,
  className: "component" as const,
  filterValue: "component" as const,
  navAccent: "component" as const,
};

const hookHeader = {
  label: "HOOK" as const,
  className: "hook" as const,
  filterValue: "hook" as const,
  navAccent: "hook" as const,
};

export const storyBuilderArchitectureFiles = defineManualArchitectureFiles([
  {
    path: "/src/features/story-builder/StoryBuilderScreen.tsx",
    header: componentHeader,
    metric: "1,062 lines",
    metricDescription: "Primary scenario-authoring workspace for story, world, cast, rules, and media.",
    description:
      "Composes the complete Story Builder from parent-owned World, Character, OpeningDialog, Scene, cover, art-style, and content-theme state. It edits the story card, world core, locations, custom world content, goals, opening configuration, scenes, style preference, AI rules, themes, sharing, and roster navigation, while reporting accepted changes through focused parent callbacks rather than saving the scenario itself.",
    rows: [
      {
        id: "story-builder-world-authoring",
        title: "World and opening-state authoring",
        summary:
          "Edits the scenario's core identity and narrative context, structured locations, custom world sections, story goals, opening message, starting day/time, pacing mode, and time interval.",
        badgeLabel: "STATE EDITOR",
        badgeClass: "feature",
        details: [
          { label: "World Writes", values: ["onUpdateWorld for World.core and codex entries", "onUpdateContentThemes", "onUpdateArtStyle"], kind: "plain" },
          { label: "Opening Writes", values: ["onUpdateOpening for opening text, day, time of day, mode, and interval"], kind: "plain" },
          { label: "Collection Rules", values: ["locations and custom world sections retain stable IDs", "custom sections support structured rows or freeform text fields", "StoryGoalsSection owns goal editing behavior"], kind: "plain" },
        ],
      },
      {
        id: "story-builder-publish-validation",
        title: "Publish-readiness feedback",
        summary:
          "Receives save-validation failures from the application shell, highlights the owning fields and characters, scrolls to the first problem, and revalidates live while the user corrects the scenario.",
        badgeLabel: "VALIDATION",
        badgeClass: "code-logic",
        details: [
          { label: "Uses", values: ["validateForPublish", "chronicle:save-validation-failed browser event"], kind: "plain" },
          { label: "Checks Context", values: ["story title and description", "world data", "main and side characters", "opening dialog", "content themes", "cover image"], kind: "plain" },
          { label: "Does Not Own", values: ["the final save decision", "publishing to the community", "database persistence"], kind: "plain" },
        ],
      },
      {
        id: "story-builder-ai-enhancement",
        title: "World-field AI enhancement",
        summary:
          "Builds a WorldEnhanceContext from the current story, cast, opening, custom entries, and themes, then requests enhancement for the selected world field using the active model and enhancement mode.",
        badgeLabel: "AI ACTION",
        badgeClass: "api-call",
        details: [
          { label: "Service", values: ["aiEnhanceWorldField"], kind: "plain" },
          { label: "Context", values: ["WorldCore", "OpeningDialog", "characters", "world entries", "ContentThemes"], kind: "plain" },
          { label: "Supported Routing", values: ["core fields", "story goal outcomes and steps", "arc phase outcomes", "custom world fields", "general custom content"], kind: "plain" },
          { label: "Failure Handling", values: ["requires a selected model", "one field reports loading at a time", "failures preserve current text and display a toast"], kind: "plain" },
        ],
      },
      {
        id: "story-builder-composition",
        title: "Roster, media, sharing, and modal composition",
        summary:
          "Coordinates character selection and creation, delegates cover and scene operations to useStoryBuilderMedia, and opens sharing, enhancement, content-type, and character-creation modals without duplicating their internal behavior.",
        badgeLabel: "COMPOSITION",
        badgeClass: "component",
        details: [
          { label: "Child Surfaces", values: ["StoryRosterSidebar", "StoryCardSection", "SceneGallerySection", "StoryBuilderMediaModals", "ShareScenarioModal", "CharacterCreationModal", "CustomContentTypeModal", "EnhanceModeModal"], kind: "plain" },
          { label: "Media Boundary", values: ["cover and scene generation are story-authoring media calls, not API Call 1 roleplay generation"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of all props, publish-validation event handling, world/opening mutations, AI enhancement, roster composition, story sections, media controller wiring, sharing controls, and modal boundaries.",
  },
  {
    path: "/src/features/story-builder/components/SceneGallerySection.tsx",
    header: componentHeader,
    metric: "143 lines",
    metricDescription: "Scene-image gallery and starting-scene selector.",
    description:
      "Renders the current Scene collection as editable image tiles, shows detected aspect ratios, opens the scene editor, requests deletion, and allows exactly one scene to be marked as the starting background. Upload, library import, generation, editing, deletion, and state mutation are delegated to StoryBuilderMediaController.",
    rows: [],
    reviewedSource: "Manual review of gallery actions, hidden file input, tile rendering, editor launch, deletion, starting-scene toggle, aspect-ratio display, and empty state.",
  },
  {
    path: "/src/features/story-builder/components/StoryBuilderFieldLabel.tsx",
    header: componentHeader,
    metric: "64 lines",
    metricDescription: "Field label with optional AI-enhance action.",
    description:
      "Displays a Story Builder field label and, when supplied, an enhancement button with loading and disabled states. It owns no field value or AI request; the parent decides whether enhancement is available and handles the click.",
    rows: [],
    reviewedSource: "Manual review of label rendering, optional action, loading/disabled styling, and callback boundary.",
  },
  {
    path: "/src/features/story-builder/components/StoryBuilderMediaModals.tsx",
    header: componentHeader,
    metric: "61 lines",
    metricDescription: "Modal composition layer for Story Builder cover and scene operations.",
    description:
      "Connects StoryBuilderMediaController to the scene tag editor, cover generator, scene generator, and cover/scene deletion confirmations. It contains no upload or generation logic; it translates controller state and handlers into the modal props.",
    rows: [],
    reviewedSource: "Manual review of all five modal/dialog bindings and controller callback ownership.",
  },
  {
    path: "/src/features/story-builder/components/StoryCardSection.tsx",
    header: componentHeader,
    metric: "210 lines",
    metricDescription: "Story title, description, cover image, and cover-position editor.",
    description:
      "Renders the visible story-card fields and cover preview. It reports title and description edits, exposes AI-enhance actions, highlights publish errors, and delegates cover upload, library selection, generation, deletion, and mouse/touch repositioning to StoryBuilderMediaController.",
    rows: [],
    reviewedSource: "Manual review of cover preview and positioning events, cover actions, title/description controls, enhancement controls, validation rendering, and hidden upload input.",
  },
  {
    path: "/src/features/story-builder/hooks/use-story-builder-media.ts",
    header: hookHeader,
    metric: "497 lines",
    metricDescription: "State and side-effect owner for Story Builder cover and scene media.",
    description:
      "Centralizes cover and scene upload, private-media URL resolution, image generation, crop positioning, scene editing, deletion confirmation, aspect-ratio detection, and starting-scene selection. It mutates parent-owned cover and Scene state through callbacks and returns a controller consumed by StoryCardSection, SceneGallerySection, and StoryBuilderMediaModals.",
    rows: [
      {
        id: "story-builder-cover-media",
        title: "Cover image lifecycle",
        summary:
          "Accepts local uploads, library sentinels, or generated images, maintains the rendered signed URL plus private bucket path, and reports crop-position changes as percentages.",
        badgeLabel: "MEDIA STORAGE",
        badgeClass: "integration",
        details: [
          { label: "Upload", values: ["resizes local cover data to at most 1024 by 1536", "uploadCoverImage", "story_covers_private"], kind: "plain" },
          { label: "Library", values: ["resolves storage://story_covers_private sentinels through getSignedMediaUrl"], kind: "plain" },
          { label: "Generated Image", values: ["accepts the edge function's signed URL and bucket-relative path without re-uploading"], kind: "plain" },
          { label: "Writes", values: ["onUpdateCoverImage", "onUpdateCoverPosition"], kind: "plain" },
        ],
      },
      {
        id: "story-builder-scene-media",
        title: "Scene image lifecycle",
        summary:
          "Creates Scene records from device uploads, media-library choices, or generated images and keeps scene metadata changes in the parent-owned Scene array.",
        badgeLabel: "MEDIA STORAGE",
        badgeClass: "integration",
        details: [
          { label: "Device Upload", values: ["resizes to at most 1024 by 768", "uploadSceneImage", "scenes private bucket", "signed preview URL", "bucket-relative imagePath"], kind: "plain" },
          { label: "Generation", values: ["generate-cover-image edge function with destinationBucket scenes", "server-resolved art-style ID", "4:3 landscape scene prompt"], kind: "plain" },
          { label: "Evidence", values: ["single.scene_image validation snapshot", "scene_image_generated usage event"], kind: "plain" },
          { label: "Collection Rules", values: ["new scenes prepend to the array", "one scene can be the starting scene", "deletion waits for confirmation"], kind: "plain" },
        ],
      },
      {
        id: "story-builder-media-controller",
        title: "Controller and cleanup boundary",
        summary:
          "Exposes stable handlers and refs to the three rendering components while keeping transient modal, drag, upload, generation, and deletion state in one place.",
        badgeLabel: "HOOK STATE",
        badgeClass: "hook",
        details: [
          { label: "Transient State", values: ["upload/generation flags", "cover drag start", "modal visibility", "editing scene", "pending deletions", "scene aspect ratios"], kind: "plain" },
          { label: "Guardrails", values: ["missing user prevents uploads and generation", "editing state closes if its scene is removed", "cover positions are clamped", "file inputs are reset after selection"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of controller contract, cover upload/library/generation paths, private media handling, mouse/touch positioning, scene upload/library/generation paths, validation and usage events, aspect-ratio detection, edit/delete flows, and parent state callbacks.",
  },
  {
    path: "/src/features/story-builder/sidebar/AddCharacterPlaceholderCard.tsx",
    header: componentHeader,
    metric: "27 lines",
    metricDescription: "Roster action for creating another main or side character.",
    description:
      "Renders the add-character button at the end of a roster group and optionally highlights it when publish validation requires another character. The parent supplies the label, error state, and creation action.",
    rows: [],
    reviewedSource: "Manual review of label, validation styling, and onClick delegation.",
  },
  {
    path: "/src/features/story-builder/sidebar/StoryRosterCharacterTile.tsx",
    header: componentHeader,
    metric: "162 lines",
    metricDescription: "Main or side character tile in the Story Builder roster.",
    description:
      "Displays one Character's avatar, name, controller, and publish errors, with separate actions to expand the complete avatar or open the character editor. It caches natural image dimensions and converts the stored square-preview crop to the roster tile's wide frame so both surfaces show the intended focal point.",
    rows: [],
    reviewedSource: "Manual review of natural-size cache, crop conversion, expanded/collapsed rendering, edit and expansion actions, controller label, and validation messages.",
  },
  {
    path: "/src/features/story-builder/sidebar/StoryRosterGroup.tsx",
    header: componentHeader,
    metric: "73 lines",
    metricDescription: "Collapsible roster group with character tiles and creation action.",
    description:
      "Renders one titled roster collection, its Character tiles, the add-character action, and any group-level validation errors. Collapsed state, character selection, tile expansion, and character creation remain parent-owned.",
    rows: [],
    reviewedSource: "Manual review of group collapse, tile mapping, per-character errors, add action, and additional validation errors.",
  },
  {
    path: "/src/features/story-builder/sidebar/StoryRosterSidebar.tsx",
    header: componentHeader,
    metric: "76 lines",
    metricDescription: "Responsive main/side character navigation rail for Story Builder.",
    description:
      "Partitions the supplied Character array by characterRole and renders separate Main Characters and Side Characters groups. It passes individual validation errors and the missing-AI/missing-user main-character errors to the appropriate group, while all selection, expansion, collapse, and creation state is controlled by StoryBuilderScreen.",
    rows: [],
    reviewedSource: "Manual review of role partitioning, group props, publish error routing, and responsive sidebar layout.",
  },
]);
