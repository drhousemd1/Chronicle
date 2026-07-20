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

export const chronicleControlArchitectureFiles = defineManualArchitectureFiles([
  {
    path: "/src/components/chronicle/AIPromptModal.tsx",
    header: componentHeader,
    metric: "169 lines",
    metricDescription: "Character AI-fill and generation guidance dialog.",
    description:
      "Collects optional free-form guidance and a use-existing-details choice before a character AI-fill or AI-generation request. The caller owns the actual model request and character mutation; this dialog only returns the prompt, consistency flag, and selected mode, and prevents closing while that caller reports processing.",
    rows: [],
    reviewedSource: "Manual review of the complete dialog state, submit contract, mode copy, close guard, and rendered controls.",
  },
  {
    path: "/src/components/chronicle/AccountButton.tsx",
    header: componentHeader,
    metric: "91 lines",
    metricDescription: "Compact authenticated-user menu.",
    description:
      "Reads the signed-in user's display name and avatar from profiles, derives initials when no avatar exists, and exposes callbacks for Public Profile, Account Settings, and Sign Out. It renders nothing for signed-out users and does not perform navigation or authentication mutations itself.",
    rows: [],
    reviewedSource: "Manual review of the profile lookup, fallback identity rules, authenticated rendering guard, and menu callbacks.",
  },
  {
    path: "/src/components/chronicle/AspectRatioUtils.tsx",
    header: codeLogicHeader,
    metric: "45 lines",
    metricDescription: "Shared image-aspect classification helpers.",
    description:
      "Defines Chronicle's supported portrait, landscape, and square aspect-ratio presets, selects the closest preset for supplied image dimensions, and renders the small orientation icon used by image-library surfaces. It performs display classification only and does not crop or transform image data.",
    rows: [],
    reviewedSource: "Manual review of the ratio catalogue, nearest-ratio calculation, orientation result, and icon geometry.",
  },
  {
    path: "/src/components/chronicle/AutoResizeTextarea.tsx",
    header: componentHeader,
    metric: "63 lines",
    metricDescription: "Controlled textarea that tracks its rendered content height.",
    description:
      "Wraps a controlled textarea and recalculates its height from scrollHeight when its value, parent size, or browser viewport changes. It preserves spellcheck, forwards plain value changes, and deliberately hides the native resize handle so the component remains content-sized.",
    rows: [],
    reviewedSource: "Manual review of the layout effect, ResizeObserver lifecycle, window listener cleanup, and controlled-input contract.",
  },
  {
    path: "/src/components/chronicle/AvatarActionButtons.tsx",
    header: componentHeader,
    metric: "192 lines",
    metricDescription: "Avatar upload, library-selection, and generation action group.",
    description:
      "Presents the three avatar-source choices used by character and profile editors: a caller-owned device upload, selection from Chronicle's Image Library, or a caller-owned AI-generation flow. Library selection opens ImageLibraryPickerModal with the private character-avatar destination and returns the copied image URL to the parent.",
    rows: [
      {
        id: "avatar-source-routing",
        title: "Avatar source routing",
        summary:
          "Keeps source selection in the UI while leaving upload persistence and image generation with the owning editor.",
        badgeLabel: "MEDIA FLOW",
        badgeClass: "feature",
        details: [
          { label: "Device", values: ["invokes onUploadFromDevice"], kind: "plain" },
          { label: "Library", values: ["opens /src/components/chronicle/ImageLibraryPickerModal.tsx", "copies into character_avatars_private"], kind: "files" },
          { label: "Generation", values: ["invokes onGenerateClick; no provider call is made here"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of source menus, disabled-state rules, picker destination, selection callback, and generation handoff.",
  },
  {
    path: "/src/components/chronicle/ChangeNameModal.tsx",
    header: componentHeader,
    metric: "102 lines",
    metricDescription: "Character primary-name replacement dialog.",
    description:
      "Collects a new character name, trims it, rejects blank or unchanged values, then returns the accepted name to the owning screen. The local field resets whenever the dialog opens; this component does not update character records itself.",
    rows: [],
    reviewedSource: "Manual review of open-state reset, validation, save callback, and close behavior.",
  },
  {
    path: "/src/components/chronicle/CharacterCreationModal.tsx",
    header: componentHeader,
    metric: "49 lines",
    metricDescription: "Character-creation path chooser.",
    description:
      "Configures ChooserModal with two product choices: import an existing library character or create a new character from scratch. It translates the selected option key into the appropriate caller callback and owns no character data.",
    rows: [],
    reviewedSource: "Manual review of the static option definitions and callback routing.",
  },
  {
    path: "/src/components/chronicle/CharacterEditModal.tsx",
    header: componentHeader,
    metric: "15 lines",
    metricDescription: "Compatibility export for the feature-owned character editor modal.",
    description:
      "Re-exports CharacterEditorModalScreen, its prop contract, and CharacterEditDraft from the character-editor-modal feature under the older Chronicle component path. It contains no editing behavior; all UI, state, validation, and persistence coordination live in the feature module.",
    rows: [],
    reviewedSource: "Manual review of the complete wrapper and its type re-exports.",
  },
  {
    path: "/src/components/chronicle/CharactersTab.tsx",
    header: componentHeader,
    metric: "13 lines",
    metricDescription: "Compatibility export for the feature-owned Character Builder.",
    description:
      "Renders CharacterBuilderScreen and re-exports its prop type from the character-builder feature. The file preserves the historical CharactersTab import path but does not own character form state, AI filling, completion logic, or saving.",
    rows: [],
    reviewedSource: "Manual review of the complete delegation wrapper.",
  },
  {
    path: "/src/components/chronicle/ChooserModal.tsx",
    header: componentHeader,
    metric: "88 lines",
    metricDescription: "Reusable two- or three-option decision dialog.",
    description:
      "Renders a consistent Chronicle modal for a small set of mutually exclusive actions, including icon, title, description, and approved hover accent for each option. Selecting a card reports its stable key and closes the dialog; product-specific meaning remains in the caller's option definitions.",
    rows: [],
    reviewedSource: "Manual review of the option contract, layout variants, hover-class allowlist, selection callback, and close sequence.",
  },
  {
    path: "/src/components/chronicle/CircularProgress.tsx",
    header: componentHeader,
    metric: "91 lines",
    metricDescription: "Circular percentage indicator with optional action behavior.",
    description:
      "Clamps a numeric value to zero through one hundred and converts it into an SVG stroke offset, color, and centered percentage label. Optional click handling makes the indicator keyboard-focusable, while light and dark variants alter only presentation.",
    rows: [],
    reviewedSource: "Manual review of value clamping, circumference math, color thresholds, SVG rendering, and optional interaction semantics.",
  },
  {
    path: "/src/components/chronicle/CustomContentTypeModal.tsx",
    header: componentHeader,
    metric: "43 lines",
    metricDescription: "World-builder custom-section type chooser.",
    description:
      "Configures ChooserModal so a caller can create either a structured label-and-description world section or a single free-form text section. It returns the selected WorldCustomSectionType and does not create or persist the section.",
    rows: [],
    reviewedSource: "Manual review of both supported content types and the typed selection callback.",
  },
  {
    path: "/src/components/chronicle/DeleteConfirmDialog.tsx",
    header: componentHeader,
    metric: "67 lines",
    metricDescription: "Shared irreversible-action confirmation dialog.",
    description:
      "Provides Chronicle's consistent confirmation surface for deletion actions, with optional caller-supplied title and message. Only the explicit Delete action invokes onConfirm; the dialog does not decide what is deleted or perform data mutation itself.",
    rows: [],
    reviewedSource: "Manual review of default copy, cancel path, destructive action callback, and open-state contract.",
  },
  {
    path: "/src/components/chronicle/EnhanceModeModal.tsx",
    header: componentHeader,
    metric: "44 lines",
    metricDescription: "AI field-enhancement style chooser.",
    description:
      "Lets a builder choose between a concise tag-oriented enhancement and a longer descriptive enhancement, returning the typed precise or detailed mode to the caller. It does not build prompts or invoke an AI service.",
    rows: [],
    reviewedSource: "Manual review of the two modes, explanatory copy, and typed callback.",
  },
  {
    path: "/src/components/chronicle/FieldHeaderRow.tsx",
    header: componentHeader,
    metric: "17 lines",
    metricDescription: "Builder-field label alignment wrapper.",
    description:
      "Applies a shared minimum height, spacing, and horizontal alignment to builder field headers so plain labels line up with labels that also contain AI actions, tooltips, or delete controls. It renders caller content unchanged.",
    rows: [],
    reviewedSource: "Manual review of the complete presentational wrapper and its documented spacing purpose.",
  },
  {
    path: "/src/components/chronicle/FolderEditModal.tsx",
    header: componentHeader,
    metric: "102 lines",
    metricDescription: "Image-library folder metadata editor.",
    description:
      "Copies the selected ImageFolder's name and description into local form state when opened, then returns a trimmed patch to the Image Library owner. A blank name is normalized to Untitled Folder; the component does not write image_folders itself.",
    rows: [],
    reviewedSource: "Manual review of folder-state synchronization, normalization, save patch, null guard, and close behavior.",
  },
  {
    path: "/src/components/chronicle/GalleryNsfwAgeModal.tsx",
    header: componentHeader,
    metric: "87 lines",
    metricDescription: "Adult-content age confirmation dialog.",
    description:
      "Blocks the Gallery's NSFW enable action behind an explicit 18-or-older confirmation and allows dismissal through the close control, backdrop, or Go Back action. It reports confirmation to the parent but does not persist age, identity, or preference data itself.",
    rows: [],
    reviewedSource: "Manual review of the overlay interaction, confirmation callback, dismissal paths, and absence of persistence.",
  },
  {
    path: "/src/components/chronicle/GalleryNsfwToggle.tsx",
    header: componentHeader,
    metric: "26 lines",
    metricDescription: "Gallery NSFW visibility toggle adapter.",
    description:
      "Configures the shared LabeledToggle with Show NSFW and Hide NSFW labels and forwards the checked state to the Gallery owner. Age confirmation and preference persistence are intentionally handled outside this component.",
    rows: [],
    reviewedSource: "Manual review of the controlled toggle contract and labels.",
  },
  {
    path: "/src/components/chronicle/GuidanceStrengthSlider.tsx",
    header: componentHeader,
    metric: "88 lines",
    metricDescription: "Three-level story-goal flexibility control.",
    description:
      "Maps the rigid, normal, and flexible GoalFlexibility values to a three-position visual slider and displays the corresponding behavioral guidance. Clicking the track or a label returns the selected enum to the goal editor; this file does not apply the goal to roleplay prompts.",
    rows: [],
    reviewedSource: "Manual review of enum mappings, click thresholds, descriptive guidance, and controlled value output.",
  },
  {
    path: "/src/components/chronicle/ModelSettingsTab.tsx",
    header: componentHeader,
    metric: "166 lines",
    metricDescription: "Admin provider-health and shared-key control surface.",
    description:
      "Displays Chronicle's fixed text and image model names, checks whether the backend xAI key is configured and reachable, and shows whether shared provider access is enabled. Administrators can update the shared-key setting; non-admin users receive the read-only status view.",
    rows: [
      {
        id: "model-provider-health",
        title: "Provider health check",
        summary:
          "Calls the app-settings service on load and on demand to report configuration, reachability, and shared-access state without exposing the provider secret.",
        badgeLabel: "SERVICE",
        badgeClass: "integration",
        details: [
          { label: "Uses", values: ["/src/services/app-settings.ts", "/src/hooks/use-auth.tsx"], kind: "files" },
          { label: "Reads", values: ["xAI configured", "provider reachable", "xAI shared"], kind: "plain" },
          { label: "Guardrail", values: ["the API key value is never rendered"], kind: "plain" },
        ],
      },
      {
        id: "model-shared-key-toggle",
        title: "Admin shared-access mutation",
        summary:
          "Checks the current user's admin role before exposing the switch that delegates shared-key changes to updateSharedKeySetting.",
        badgeLabel: "ADMIN ACTION",
        badgeClass: "integration",
        security: true,
        details: [
          { label: "Calls", values: ["checkIsAdmin", "updateSharedKeySetting"], kind: "plain" },
          { label: "Disabled When", values: ["the setting is updating", "no xAI key is configured"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of model labels, health-check lifecycle, admin check, shared-setting mutation, and rendered status rules.",
  },
  {
    path: "/src/components/chronicle/ScrollableSection.tsx",
    header: componentHeader,
    metric: "72 lines",
    metricDescription: "Overflow section with directional fade cues.",
    description:
      "Constrains child content to a configurable maximum height, tracks whether more content exists above or below the current scroll position, and fades in the matching visual indicators. It rechecks on child changes and viewport resize but does not virtualize content.",
    rows: [],
    reviewedSource: "Manual review of overflow detection, scroll thresholds, resize handling, and fade rendering.",
  },
  {
    path: "/src/components/chronicle/SpiceRating.tsx",
    header: componentHeader,
    metric: "56 lines",
    metricDescription: "Flame-based adult-content intensity rating.",
    description:
      "Renders a configurable number of flame icons for a numeric spice rating. In interactive mode it previews hovered levels and reports a selected integer to the parent; in display mode the buttons are disabled and no state is mutated.",
    rows: [],
    reviewedSource: "Manual review of display and interactive modes, hover state, level calculation, and callback.",
  },
  {
    path: "/src/components/chronicle/StarRating.tsx",
    header: componentHeader,
    metric: "74 lines",
    metricDescription: "Full- and half-star rating display and selector.",
    description:
      "Displays numeric ratings with full, half, and empty stars in amber or slate. Interactive mode previews and returns whole-star selections; half stars are display-only representations of supplied fractional values.",
    rows: [],
    reviewedSource: "Manual review of full and half-state calculation, color variants, hover preview, and selection behavior.",
  },
  {
    path: "/src/components/chronicle/StoryCardView.tsx",
    header: componentHeader,
    metric: "13 lines",
    metricDescription: "Compatibility export for the scenario-card editor view.",
    description:
      "Renders ScenarioCardEditorView and re-exports its prop type from the character-editor-modal feature. It preserves the older StoryCardView import path but contains no scenario-card form or persistence logic.",
    rows: [],
    reviewedSource: "Manual review of the complete delegation wrapper.",
  },
  {
    path: "/src/components/chronicle/StoryExportFormatModal.tsx",
    header: componentHeader,
    metric: "52 lines",
    metricDescription: "Story-export format chooser.",
    description:
      "Uses the three-column chooser to return Markdown, JSON, or Word as a typed StoryExportFormat. The descriptions distinguish readable exports with embedded restore data from the full-fidelity JSON backup; actual serialization and download are owned elsewhere.",
    rows: [],
    reviewedSource: "Manual review of all three formats, explanatory copy, and typed selection callback.",
  },
  {
    path: "/src/components/chronicle/StoryImportModeModal.tsx",
    header: componentHeader,
    metric: "43 lines",
    metricDescription: "Story-import conflict strategy chooser.",
    description:
      "Returns either merge, which preserves existing content while blending imported values, or rewrite, which prefers imported values on conflicts. It selects the import strategy only; parsing, normalization, and mutation live in the story-transfer workflow.",
    rows: [],
    reviewedSource: "Manual review of the two StoryImportMode options and callback.",
  },
  {
    path: "/src/components/chronicle/TabFieldNavigator.tsx",
    header: componentHeader,
    metric: "38 lines",
    metricDescription: "Builder text-field keyboard navigation boundary.",
    description:
      "Intercepts Tab and Shift+Tab inside its container and moves focus among visible textareas and non-specialized text inputs. Hidden, file, checkbox, and radio controls are excluded, and native tab behavior is preserved when focus would leave the managed field list.",
    rows: [],
    reviewedSource: "Manual review of the DOM query, visibility filter, forward and reverse indexing, and boundary behavior.",
  },
  {
    path: "/src/components/chronicle/TagInput.tsx",
    header: componentHeader,
    metric: "90 lines",
    metricDescription: "Normalized tag-list editor.",
    description:
      "Displays removable tags and converts entered text to trimmed lowercase tags on Enter, comma, semicolon, or blur. It prevents duplicates, enforces the caller's maximum count, supports Backspace removal of the last tag, and returns the complete next tag array to the parent.",
    rows: [],
    reviewedSource: "Manual review of normalization, delimiter handling, duplicate and count guards, removal behavior, and controlled output.",
  },
  {
    path: "/src/components/chronicle/UI.tsx",
    header: componentHeader,
    metric: "159 lines",
    metricDescription: "Legacy Chronicle-specific UI convenience primitives.",
    description:
      "Defines the older Button, SmallButton, Card, Label, Input, TextArea, SectionTitle, and Avatar wrappers still used by Chronicle feature screens. These wrappers centralize visual classes and controlled-value contracts but are separate from the broader components/ui primitive library.",
    rows: [
      {
        id: "chronicle-ui-inputs",
        title: "Controlled form wrappers",
        summary:
          "Input and TextArea translate browser events into string callbacks; TextArea optionally grows from its content height.",
        badgeLabel: "FORM CONTROLS",
        badgeClass: "component",
        details: [
          { label: "Exports", values: ["Input", "TextArea", "Label"], kind: "plain" },
          { label: "Effects", values: ["spellcheck enabled", "optional textarea auto-resize"], kind: "plain" },
        ],
      },
      {
        id: "chronicle-ui-display",
        title: "Buttons and display frames",
        summary:
          "Button variants, cards, titles, and avatar fallbacks provide shared Chronicle styling without owning product behavior.",
        badgeLabel: "DISPLAY",
        badgeClass: "component",
        details: [
          { label: "Exports", values: ["Button", "SmallButton", "Card", "SectionTitle", "Avatar"], kind: "plain" },
          { label: "Boundary", values: ["all actions and data are supplied by callers"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of every exported primitive, prop contract, variant map, input callback, and avatar fallback.",
  },
  {
    path: "/src/components/chronicle/UploadSourceMenu.tsx",
    header: componentHeader,
    metric: "80 lines",
    metricDescription: "Reusable device-or-library image source menu.",
    description:
      "Adds a source dropdown to Chronicle's older Button wrapper and opens ImageLibraryPickerModal when the user chooses the library. The caller supplies the device-upload handler, destination bucket, and selected-image handler; this component performs no upload itself.",
    rows: [
      {
        id: "upload-source-menu-routing",
        title: "Image source handoff",
        summary:
          "Routes a device choice directly to the owner or a library choice through the private-copy picker for the requested destination bucket.",
        badgeLabel: "MEDIA FLOW",
        badgeClass: "feature",
        details: [
          { label: "Uses", values: ["/src/components/chronicle/ImageLibraryPickerModal.tsx", "/src/services/persistence/library-copy.ts"], kind: "files" },
          { label: "Destinations", values: ["caller-supplied DestinationBucket; defaults to avatars"], kind: "plain" },
          { label: "Does Not Own", values: ["binary upload", "database record creation", "AI image generation"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of menu choices, disabled states, destination propagation, picker lifecycle, and callbacks.",
  },
  {
    path: "/src/components/chronicle/WorldTab.tsx",
    header: componentHeader,
    metric: "13 lines",
    metricDescription: "Compatibility export for the feature-owned Story Builder.",
    description:
      "Renders StoryBuilderScreen and re-exports its prop type from the story-builder feature. It preserves the historical WorldTab import path but owns no builder fields, AI operations, import/export behavior, or persistence.",
    rows: [],
    reviewedSource: "Manual review of the complete delegation wrapper.",
  },
  {
    path: "/src/components/chronicle/ChatSpellcheckTextarea.tsx",
    header: componentHeader,
    metric: "226 lines",
    metricDescription: "Roleplay composer with application-managed spellchecking.",
    description:
      "Loads Chronicle's English spell dictionary, builds a story-specific allowlist, overlays clickable wavy underlines over misspelled ranges, and replaces selected words from a suggestion menu while preserving caret focus. It disables browser spellcheck so dictionary results and roleplay names are handled consistently, auto-grows with content, and submits on Enter unless Shift is held.",
    rows: [
      {
        id: "chat-spell-detection",
        title: "Dictionary and overlay pipeline",
        summary:
          "Combines the asynchronously loaded dictionary with caller-supplied names or terms, computes misspelled character ranges, and renders a transparent interaction overlay aligned with the textarea.",
        badgeLabel: "TEXT ANALYSIS",
        badgeClass: "code-logic",
        details: [
          { label: "Uses", values: ["/src/lib/chat-spellcheck.ts"], kind: "files" },
          { label: "Input", values: ["composer value", "allowlist entries"], kind: "plain" },
          { label: "Failure Handling", values: ["dictionary-load failure leaves the normal textarea usable without custom marks"], kind: "plain" },
        ],
      },
      {
        id: "chat-spell-replacement",
        title: "Suggestion application",
        summary:
          "Opens suggestions from click or context-menu interaction, replaces exactly the selected misspelled range, then restores focus and places the caret after the replacement.",
        badgeLabel: "COMPOSER ACTION",
        badgeClass: "feature",
        details: [
          { label: "Output", values: ["complete updated composer string through onChange"], kind: "plain" },
          { label: "Dismissal", values: ["value change", "outside click", "Escape"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of dictionary loading, allowlist construction, range overlay, menu positioning, replacement, caret restoration, and submit handling.",
  },
  {
    path: "/src/components/chronicle/chat/TypingIndicatorBubble.tsx",
    header: componentHeader,
    metric: "38 lines",
    metricDescription: "Accessible roleplay-response activity indicator.",
    description:
      "Shows three staggered animated dots while an assistant response is being prepared, using the active chat-bubble color or transparent-bubble treatment and the selected alignment width. The live-region status announces that the AI character is writing; the component does not observe request state itself.",
    rows: [],
    reviewedSource: "Manual review of alignment inputs, color behavior, animation, and live-region semantics.",
  },
  {
    path: "/src/components/chronicle/image-library-types.ts",
    header: codeLogicHeader,
    metric: "25 lines",
    metricDescription: "Image Library view-model contracts.",
    description:
      "Defines the normalized ImageFolder and LibraryImage shapes consumed by ImageLibraryTab, the picker, and folder-editing controls. The contracts combine database identity and ownership fields with UI-ready timestamps, thumbnail information, image counts, tags, and optional storage paths; they contain no fetching or persistence logic.",
    rows: [],
    reviewedSource: "Manual review of both exported type contracts and each field's consuming role.",
  },
]);
