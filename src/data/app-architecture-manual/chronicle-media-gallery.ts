import { defineManualArchitectureFiles } from "./types";

const componentHeader = {
  label: "REACT COMPONENT" as const,
  className: "component" as const,
  filterValue: "component" as const,
  navAccent: "component" as const,
};

const testHeader = {
  label: "TEST" as const,
  className: "test" as const,
  filterValue: "test" as const,
  navAccent: "test" as const,
};

export const chronicleMediaGalleryArchitectureFiles = defineManualArchitectureFiles([
  {
    path: "/src/components/chronicle/AvatarGenerationModal.tsx",
    header: componentHeader,
    metric: "331 lines",
    metricDescription: "Character-avatar prompt and generation workflow.",
    description:
      "Builds an avatar prompt from optional user guidance or the character's sex, age, physical appearance, and clothing, lets the user choose a server-resolved art style and negative prompt, then invokes generate-side-character-avatar. Successful image URLs and storage paths return to the owning editor; validation snapshots and AI-usage events record the request category without storing provider secrets in the browser.",
    rows: [
      {
        id: "avatar-generation-request",
        title: "Avatar generation request",
        summary:
          "Validates the prompt and selected style, sends only the safe style identifier plus character context to the edge function, and resets local form state after a successful image result.",
        badgeLabel: "EDGE FUNCTION",
        badgeClass: "edge-fn",
        details: [
          { label: "Invokes", values: ["generate-side-character-avatar"], kind: "edges" },
          { label: "Request", values: ["avatarPrompt", "characterName", "modelId", "styleId", "optional negativePrompt", "usageEventType"], kind: "plain" },
          { label: "Output", values: ["imageUrl", "optional imagePath through onGenerated"], kind: "plain" },
          { label: "Failure Handling", values: ["inline error from invocation, function payload, or missing image result"], kind: "plain" },
        ],
      },
      {
        id: "avatar-generation-observability",
        title: "Avatar-generation observability",
        summary:
          "Writes a required-presence validation snapshot before invocation and an AI usage event only after a generated image is returned.",
        badgeLabel: "TELEMETRY",
        badgeClass: "integration",
        details: [
          { label: "Uses", values: ["/src/services/api-usage-validation.ts", "/src/services/usage-tracking.ts", "/src/contexts/ArtStylesContext.tsx"], kind: "files" },
          { label: "Guardrail", values: ["style prompts are resolved by the backend from art_styles; the browser sends styleId only"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of character-data prompt shaping, style selection, validation telemetry, edge invocation, usage tracking, reset, and errors.",
  },
  {
    path: "/src/components/chronicle/BackgroundPickerModal.tsx",
    header: componentHeader,
    metric: "257 lines",
    metricDescription: "Page-background selection and overlay editor.",
    description:
      "Displays the user's available backgrounds, the default no-background choice, private device upload, private Image Library copy, deletion, and the selected background's black-or-white overlay opacity. It owns the modal and source-selection UI while delegating database records, uploads, deletion, selection, and overlay persistence to the parent.",
    rows: [
      {
        id: "background-sources",
        title: "Background source selection",
        summary:
          "Accepts JPEG, PNG, or WebP from a hidden file input or copies a selected Image Library asset into the user-background destination before handing its URL to the owner.",
        badgeLabel: "MEDIA FLOW",
        badgeClass: "feature",
        details: [
          { label: "Device", values: ["File through onUpload"], kind: "plain" },
          { label: "Library", values: ["/src/components/chronicle/ImageLibraryPickerModal.tsx", "user_backgrounds_private"], kind: "files" },
          { label: "Persistence Boundary", values: ["the parent creates user_backgrounds and selects the resulting row"], kind: "plain" },
        ],
      },
      {
        id: "background-display-settings",
        title: "Background selection and overlay settings",
        summary:
          "Reports the selected background ID or null and, when supported by the owner, returns black or white overlay color with zero-to-eighty-percent opacity.",
        badgeLabel: "DISPLAY STATE",
        badgeClass: "component",
        details: [
          { label: "Outputs", values: ["onSelectBackground", "onOverlayChange", "onDelete"], kind: "plain" },
          { label: "Keyboard", values: ["background cards activate on Enter or Space"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of background rendering, device and library sources, overlay controls, selection accessibility, deletion, and parent callbacks.",
  },
  {
    path: "/src/components/chronicle/CoverImageActionButtons.tsx",
    header: componentHeader,
    metric: "181 lines",
    metricDescription: "Story-cover upload, library, and generation actions.",
    description:
      "Presents device upload, Image Library selection, and AI generation entry points for a story cover. The private library picker copies the selected image into story_covers before returning its URL; the parent owns device upload, generation, and assignment to the story.",
    rows: [],
    reviewedSource: "Manual review of the source dropdown, private destination, disabled states, generation callback, and picker lifecycle.",
  },
  {
    path: "/src/components/chronicle/CoverImageGenerationModal.tsx",
    header: componentHeader,
    metric: "282 lines",
    metricDescription: "Story-cover AI image generation workflow.",
    description:
      "Collects cover-image guidance, an optional negative prompt, and a backend-resolved art-style ID, then invokes generate-cover-image with the optional scenario title. It records required-field validation before the call, records successful AI usage after an image is returned, and gives the resulting URL and storage path to the Story Builder.",
    rows: [
      {
        id: "cover-generation-request",
        title: "Cover-image request boundary",
        summary:
          "Validates prompt and style locally, invokes the image edge function, and handles invocation, payload, or missing-result failures inside the dialog.",
        badgeLabel: "EDGE FUNCTION",
        badgeClass: "edge-fn",
        details: [
          { label: "Invokes", values: ["generate-cover-image"], kind: "edges" },
          { label: "Request", values: ["prompt", "styleId", "optional negativePrompt", "optional scenarioTitle"], kind: "plain" },
          { label: "Guardrail", values: ["the browser sends the art-style identifier, not the protected backend prompt"], kind: "plain" },
          { label: "Uses", values: ["/src/services/api-usage-validation.ts", "/src/services/usage-tracking.ts", "/src/contexts/ArtStylesContext.tsx"], kind: "files" },
        ],
      },
    ],
    reviewedSource: "Manual review of prompt validation, style lookup, request payload, validation and usage telemetry, success reset, and error display.",
  },
  {
    path: "/src/components/chronicle/SceneGalleryActionButtons.tsx",
    header: componentHeader,
    metric: "181 lines",
    metricDescription: "Scene-gallery upload, library, and generation actions.",
    description:
      "Presents device upload, Image Library selection, and AI generation entry points for a roleplay scene image. Library selection copies the private source into the scenes destination before reporting its URL; actual upload, generation, scene creation, and persistence remain with the owning chat or story screen.",
    rows: [],
    reviewedSource: "Manual review of all source actions, scenes destination, disabled states, and caller boundaries.",
  },
  {
    path: "/src/components/chronicle/SceneImageGenerationModal.tsx",
    header: componentHeader,
    metric: "184 lines",
    metricDescription: "Scene-image prompt and style dialog.",
    description:
      "Collects a scene description and one art-style ID for a 4:3 landscape image, then awaits the caller's onGenerate workflow. It clears the prompt after success and prevents closing or editing while generation is active; unlike the avatar and cover modals, this component does not invoke Supabase directly.",
    rows: [],
    reviewedSource: "Manual review of art-style context, prompt validation, async caller handoff, processing lock, reset, and aspect guidance.",
  },
  {
    path: "/src/components/chronicle/SceneTagEditorModal.tsx",
    header: componentHeader,
    metric: "165 lines",
    metricDescription: "Scene title and tag editor.",
    description:
      "Copies the selected Scene's title and tags into local state, previews its image, and returns an updated title plus at most ten unique tags to the scene owner. Leading hash characters are removed from new tags; saving closes the modal, but persistence occurs in the caller.",
    rows: [],
    reviewedSource: "Manual review of scene synchronization, image preview, title editing, tag normalization and limit, removal, save, and close behavior.",
  },
  {
    path: "/src/components/chronicle/ImageLibraryPickerModal.tsx",
    header: componentHeader,
    metric: "373 lines",
    metricDescription: "Private Image Library browser and destination-copy boundary.",
    description:
      "Loads the signed-in user's folders through get_folders_with_details, loads the selected folder's library_images, signs private previews, and copies one selected image into a caller-specified consumer bucket before returning it. Legacy rows without image_path are visible but not selectable, preventing callers from depending on an expiring private source URL.",
    rows: [
      {
        id: "library-picker-read-model",
        title: "Folders, images, and private previews",
        summary:
          "Normalizes folder and image database rows into the shared view models and resolves signed URLs in batches for the visible private storage paths.",
        badgeLabel: "DATA FLOW",
        badgeClass: "data-block",
        details: [
          { label: "Calls", values: ["get_folders_with_details"], kind: "rpcs" },
          { label: "Reads", values: ["library_images"], kind: "tables" },
          { label: "Uses", values: ["/src/services/persistence/signed-media.ts"], kind: "files" },
        ],
      },
      {
        id: "library-picker-copy",
        title: "Consumer-owned storage copy",
        summary:
          "Copies the selected private image bytes to the requested destination so avatar, cover, scene, or background records never retain a fragile Image Library preview URL.",
        badgeLabel: "STORAGE BOUNDARY",
        badgeClass: "integration",
        details: [
          { label: "Uses", values: ["/src/services/persistence/library-copy.ts"], kind: "files" },
          { label: "Input", values: ["image ID", "image_path", "preview URL", "filename", "DestinationBucket", "user ID"], kind: "plain" },
          { label: "Output", values: ["public-or-sentinel URL", "destination path and bucket through optional onSelectWithPath"], kind: "plain" },
          { label: "Rejects", values: ["unknown user", "no selected image", "legacy row without image_path", "failed storage copy"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of authentication guard, folder RPC, image query, signed preview mapping, selection state, legacy-path rejection, storage copy, and callbacks.",
  },
  {
    path: "/src/components/chronicle/ImageLibraryTab.tsx",
    header: componentHeader,
    metric: "948 lines",
    metricDescription: "Full private Image Library workspace.",
    description:
      "Owns the user's folder-and-image management workspace: folder loading and CRUD, multi-image upload, client-side image resizing, private storage writes and deletion, image metadata editing, thumbnail selection, signed previews, search, ratio classification, and folder navigation. It keeps image_folders, library_images, and image_library storage synchronized and exposes the top-bar upload trigger through a ref.",
    rows: [
      {
        id: "image-library-folders",
        title: "Folder lifecycle",
        summary:
          "Loads folder summaries, creates and edits image_folders, selects folders, assigns thumbnail_image_id, and removes a folder only after its contained storage objects are collected.",
        badgeLabel: "PERSISTENCE",
        badgeClass: "data-block",
        details: [
          { label: "Calls", values: ["get_folders_with_details"], kind: "rpcs" },
          { label: "Writes", values: ["image_folders"], kind: "tables" },
          { label: "Uses", values: ["/src/components/chronicle/FolderEditModal.tsx", "/src/components/chronicle/DeleteConfirmDialog.tsx"], kind: "files" },
        ],
      },
      {
        id: "image-library-upload",
        title: "Image upload and record creation",
        summary:
          "Processes each selected image, resizes it to JPEG, writes a user-and-folder-scoped object, creates library_images metadata, and updates the visible folder count.",
        badgeLabel: "STORAGE WRITE",
        badgeClass: "integration",
        details: [
          { label: "Writes", values: ["image_library storage bucket", "library_images"], kind: "plain" },
          { label: "Path", values: ["userId/folderId/generated filename"], kind: "plain" },
          { label: "Uses", values: ["resizeImage", "uuid", "browser FileReader"], kind: "plain" },
          { label: "Failure Handling", values: ["per-batch error toast; file input resets after processing"], kind: "plain" },
        ],
      },
      {
        id: "image-library-image-management",
        title: "Image metadata and deletion",
        summary:
          "Loads private images with signed URLs, filters them by search text, edits title and tags, and deletes both storage bytes and database rows while preventing negative folder counts.",
        badgeLabel: "MEDIA MANAGEMENT",
        badgeClass: "feature",
        details: [
          { label: "Reads and Writes", values: ["library_images"], kind: "tables" },
          { label: "Storage", values: ["image_library"], kind: "buckets" },
          { label: "Uses", values: ["/src/components/chronicle/AspectRatioUtils.tsx", "/src/services/persistence/signed-media.ts"], kind: "files" },
        ],
      },
    ],
    reviewedSource: "Manual review of every Supabase operation, storage path, signed-URL flow, folder and image mutation, upload transformation, search, metadata editing, and exposed upload ref.",
  },
  {
    path: "/src/components/chronicle/GalleryCategorySidebar.tsx",
    header: componentHeader,
    metric: "250 lines",
    metricDescription: "Gallery content filter panel.",
    description:
      "Edits the Gallery's story type, genre, origin, trigger-warning, and custom-tag filter collections with collapsible categories and category-specific icons. When NSFW display is disabled it removes NSFW from the available story types, and Clear all returns a fully empty CategoryFilters object.",
    rows: [],
    reviewedSource: "Manual review of the CategoryFilters contract, catalogue mappings, NSFW visibility rule, toggling, active count, and clear behavior.",
  },
  {
    path: "/src/components/chronicle/GalleryHub.tsx",
    header: componentHeader,
    metric: "646 lines",
    metricDescription: "Public Gallery query, interaction, and story-launch workspace.",
    description:
      "Builds the public Gallery from sanitized paginated scenario results, followed-creator IDs, category filters, debounced text and hashtag search, sort choice, and the signed-in user's like/save sets. It coordinates infinite scrolling, detail views, views, likes, saves, play counts, NSFW approval, owner unpublishing, and React Query cache reconciliation while delegating actual data operations to gallery-data.",
    rows: [
      {
        id: "gallery-query",
        title: "Sanitized Gallery query",
        summary:
          "Builds stable query parameters and pages twenty published stories at a time through fetchGalleryScenarios; Following mode first reads creator_follows for the current user.",
        badgeLabel: "QUERY FLOW",
        badgeClass: "data-block",
        details: [
          { label: "Uses", values: ["/src/services/gallery-data.ts", "React Query infinite query"], kind: "files" },
          { label: "Reads", values: ["creator_follows when sortBy is following"], kind: "tables" },
          { label: "Filters", values: ["search text", "hashtags", "story types", "genres", "origins", "trigger warnings", "custom tags", "publisher IDs"], kind: "plain" },
          { label: "Security Boundary", values: ["no raw published_scenarios realtime subscription; sanitized fetch and explicit cache invalidation are used instead"], kind: "plain" },
        ],
      },
      {
        id: "gallery-interactions",
        title: "Authenticated Gallery interactions",
        summary:
          "Requires authentication for like, save, play, and NSFW-gated actions, delegates durable changes to gallery-data, and adjusts or invalidates cached counts after success.",
        badgeLabel: "USER ACTIONS",
        badgeClass: "feature",
        details: [
          { label: "Actions", values: ["toggleLike", "saveScenarioToCollection", "unsaveScenario", "incrementPlayCount", "recordView", "unpublishScenario"], kind: "plain" },
          { label: "Uses", values: ["/src/components/chronicle/GalleryStoryCard.tsx", "/src/components/chronicle/StoryDetailModal.tsx"], kind: "files" },
          { label: "NSFW Rule", values: ["hidden cover cards may remain in the grid, but opening or playing an NSFW story requests explicit approval first"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of query construction, followed creators, pagination, search parsing, NSFW handling, interactions, cache updates, modal ownership, and security comment.",
  },
  {
    path: "/src/components/chronicle/GalleryStoryCard.tsx",
    header: componentHeader,
    metric: "186 lines",
    metricDescription: "Published-scenario card for the public Gallery.",
    description:
      "Displays a PublishedScenario's cover, publisher, themes, summary, ratings, view/like/save/play counts, remix indicator, and current user's interaction state. Card activation opens details, while like, save, and play stop event propagation, expose pending state, and delegate their work to GalleryHub.",
    rows: [],
    reviewedSource: "Manual review of published data mapping, cover positioning, NSFW presentation, interaction callbacks, pending states, and keyboard/card behavior.",
  },
  {
    path: "/src/components/chronicle/ShareStoryModal.tsx",
    header: componentHeader,
    metric: "189 lines",
    metricDescription: "Story publication and remix-permission manager.",
    description:
      "Loads a scenario's current publication, lets its owner publish or unpublish it, and writes the allow-remix choice through gallery-data. It keeps a local PublishedScenario summary for immediate counts and button state; the underlying publication record, Gallery caches, and publish validation belong to the service and surrounding screen.",
    rows: [
      {
        id: "share-story-publication",
        title: "Publication lifecycle",
        summary:
          "Reads getPublishedScenario on open, calls publishScenario with the owner and remix setting, or calls unpublishScenario for the selected story.",
        badgeLabel: "PERSISTENCE",
        badgeClass: "integration",
        details: [
          { label: "Uses", values: ["/src/services/gallery-data.ts"], kind: "files" },
          { label: "Input", values: ["scenarioId", "scenarioTitle", "userId", "allowRemix"], kind: "plain" },
          { label: "Output", values: ["published or unpublished service state plus local display summary"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of publication loading, remix setting, publish and unpublish calls, local summary, counts, and pending states.",
  },
  {
    path: "/src/components/chronicle/StoryDetailModal.tsx",
    header: componentHeader,
    metric: "791 lines",
    metricDescription: "Full story detail, character, theme, and review surface.",
    description:
      "Presents the detailed view shared by owned stories and published Gallery stories, including cover positioning, summary, content classifications, characters, author, publication/remix state, statistics, reviews, and available edit, play, like, save, or unpublish actions. It loads scenario characters and paginated public reviews, loads the signed-in user's review, computes average spice from applicable review rows, and opens ReviewModal without allowing nested modal events to dismiss the parent incorrectly.",
    rows: [
      {
        id: "story-detail-read-model",
        title: "Characters and review read model",
        summary:
          "Loads scenario characters when the modal opens, loads public review pages in groups of five, and separately resolves the current user's review so it can be created or edited.",
        badgeLabel: "DATA FLOW",
        badgeClass: "data-block",
        details: [
          { label: "Uses", values: ["fetchScenarioCharacters", "fetchScenarioReviews", "fetchUserReview from /src/services/gallery-data.ts"], kind: "files" },
          { label: "Derived", values: ["average spice from reviews with positive spice_level", "whether more review rows can be loaded"], kind: "plain" },
          { label: "Navigation", values: ["character/public-profile links use React Router"], kind: "plain" },
        ],
      },
      {
        id: "story-detail-actions",
        title: "Owner and audience actions",
        summary:
          "Coordinates pending states and closes the detail surface at the appropriate time while leaving durable like, save, play, edit, and unpublish behavior with supplied callbacks.",
        badgeLabel: "USER FLOW",
        badgeClass: "feature",
        details: [
          { label: "Audience", values: ["like", "save", "play", "submit/update/delete review"], kind: "plain" },
          { label: "Owner", values: ["edit", "play", "unpublish"], kind: "plain" },
          { label: "Uses", values: ["/src/components/chronicle/ReviewModal.tsx", "/src/components/chronicle/StarRating.tsx", "/src/components/chronicle/SpiceRating.tsx"], kind: "files" },
        ],
      },
    ],
    reviewedSource: "Manual review of props, modal nesting, character and review loads, pagination, derived ratings, scrolling, owner/audience actions, and all detail sections.",
  },
  {
    path: "/src/components/chronicle/StoryHub.tsx",
    header: componentHeader,
    metric: "323 lines",
    metricDescription: "My Stories grid and owned-story detail coordinator.",
    description:
      "Renders the user's story registry as owned, draft, published, or bookmarked cards, provides create/edit/delete/play callbacks, and supports parent-driven infinite loading. Opening a card loads its content themes and publication status in parallel for ScenarioDetailModal; owner unpublishing is handled through gallery-data, while the parent remains the owner of the underlying registry.",
    rows: [
      {
        id: "story-hub-cards",
        title: "Owned and bookmarked story cards",
        summary:
          "Combines ScenarioMetadata with caller-supplied publication, content-theme, and author maps to render status, remix, cover, actions, and public counters without refetching each card.",
        badgeLabel: "VIEW MODEL",
        badgeClass: "component",
        details: [
          { label: "Inputs", values: ["registry", "publishedScenarioIds", "contentThemesMap", "publishedScenariosData", "ownerUsername", "bookmarkedCreatorNames"], kind: "plain" },
          { label: "Actions", values: ["onCreate", "onPlay", "onEdit", "onDelete", "open details"], kind: "plain" },
        ],
      },
      {
        id: "story-hub-details",
        title: "Story detail enrichment",
        summary:
          "Fetches content themes and the current publication row only after a story is selected, then supplies ownership-aware actions to the shared detail modal.",
        badgeLabel: "DETAIL FLOW",
        badgeClass: "feature",
        details: [
          { label: "Uses", values: ["/src/services/supabase-data.ts", "/src/services/gallery-data.ts", "/src/components/chronicle/StoryDetailModal.tsx"], kind: "files" },
          { label: "Failure Handling", values: ["theme or publication lookup may independently resolve to null; the local story still opens"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of card composition, owned/bookmarked author rules, detail enrichment, infinite-scroll sentinel, unpublish, and parent callbacks.",
  },
  {
    path: "/src/components/chronicle/ReviewModal.tsx",
    header: componentHeader,
    metric: "299 lines",
    metricDescription: "Published-scenario review editor.",
    description:
      "Creates, updates, or deletes a user's review with a primary story rating, optional spice level for non-SFW stories, optional category ratings, and a comment. Existing reviews are normalized into form state, including suppression of legacy category values that merely mirror the primary score, and persistence is delegated to gallery-data.",
    rows: [
      {
        id: "review-modal-normalization",
        title: "Existing-review normalization",
        summary:
          "Maps database columns through REVIEW_CATEGORIES and hides legacy mirrored detailed ratings so they are not presented as intentional user feedback.",
        badgeLabel: "DATA NORMALIZATION",
        badgeClass: "code-logic",
        details: [
          { label: "Uses", values: ["/src/services/review-ratings.ts", "/src/services/gallery-data.ts"], kind: "files" },
          { label: "SFW Rule", values: ["spice control is hidden only when storyType is explicitly SFW"], kind: "plain" },
          { label: "Submission Minimum", values: ["at least one story star or one spice flame"], kind: "plain" },
        ],
      },
      {
        id: "review-modal-persistence",
        title: "Review persistence and nested-modal behavior",
        summary:
          "Submits or deletes the current user's review, refreshes the parent detail view after success, and isolates backdrop clicks from the underlying StoryDetailModal.",
        badgeLabel: "PERSISTENCE",
        badgeClass: "integration",
        details: [
          { label: "Calls", values: ["submitReview", "deleteReview"], kind: "plain" },
          { label: "Uses", values: ["/src/components/chronicle/DeleteConfirmDialog.tsx"], kind: "files" },
          { label: "Failure Handling", values: ["logs one submit or delete failure and leaves the editor available"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of existing-review hydration, legacy detection, ratings, comment, submit/delete calls, pending state, and modal event isolation.",
  },
  {
    path: "/src/components/chronicle/ReviewModal.test.ts",
    header: testHeader,
    metric: "17 lines",
    metricDescription: "Review-modal failure-log duplication guard.",
    description:
      "Reads ReviewModal.tsx as source text and asserts that the submit-failure and delete-failure console messages each occur exactly once. It protects against accidental duplicate error logging but does not render the modal or verify review persistence.",
    rows: [],
    reviewedSource: "Manual review of the complete Vitest source-contract test and its two occurrence assertions.",
  },
]);
