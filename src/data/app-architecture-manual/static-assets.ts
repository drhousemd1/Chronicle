import { defineManualArchitectureFiles } from "./types";

const assetHeader = {
  label: "ASSET" as const,
  className: "documentation" as const,
  filterValue: "documentation" as const,
  navAccent: "documentation" as const,
};

const documentationHeader = {
  label: "DOCUMENTATION" as const,
  className: "documentation" as const,
  filterValue: "documentation" as const,
  navAccent: "documentation" as const,
};

export const staticAssetArchitectureFiles = defineManualArchitectureFiles([
  {
    path: "/public/favicon.ico",
    header: assetHeader,
    metric: "109 lines",
    metricDescription: "Browser tab and bookmark icon.",
    description:
      "Provides the checked-in Chronicle favicon served directly from the public root. The browser discovers it through the application's HTML metadata; React does not import it.",
    rows: [],
    reviewedSource: "Manual inspection of image format, dimensions, byte size, public placement, and HTML/browser role.",
  },
  {
    path: "/public/images/styleguide/mockup-ref.png",
    header: assetHeader,
    metric: "1,554 lines",
    metricDescription: "Style Guide mock-up reference screenshot.",
    description:
      "Preserves a full reference image used to compare Chronicle's Style Guide presentation against an approved visual direction. No current source file imports this exact path, so it is reference evidence rather than an active application image.",
    rows: [],
    reviewedSource: "Manual inspection of dimensions, byte size, path purpose, and repository-wide consumer search.",
  },
  {
    path: "/public/images/styleguide/slate-blue-main-chars-pill.png",
    header: assetHeader,
    metric: "3,384 lines",
    metricDescription: "Style Guide character-pill color reference.",
    description:
      "Stores the approved slate-blue main-character pill reference used during Style Guide visual review. It is not imported by the current frontend and does not control runtime colors or character roles.",
    rows: [],
    reviewedSource: "Manual inspection of dimensions, byte size, path purpose, and repository-wide consumer search.",
  },
  {
    path: "/public/images/styleguide/slate-blue-panel-headers.png",
    header: assetHeader,
    metric: "4,517 lines",
    metricDescription: "Style Guide panel-header color reference.",
    description:
      "Stores a visual reference for slate-blue panel headers used during Style Guide comparison work. It is not imported by current React code and has no direct effect on application styling.",
    rows: [],
    reviewedSource: "Manual inspection of dimensions, byte size, path purpose, and repository-wide consumer search.",
  },
  {
    path: "/public/images/styles/cinematic-2-5d.png",
    header: assetHeader,
    metric: "1,543 lines",
    metricDescription: "Cinematic 2.5D art-style thumbnail.",
    description:
      "Provides the public thumbnail for Chronicle's Cinematic 2.5D art-style option. avatar-styles.ts references this URL, and the Admin page also uses it as the default thumbnail when creating the corresponding style record.",
    rows: [],
    reviewedSource: "Manual inspection of image metadata and direct consumers in avatar-styles.ts and Admin.tsx.",
  },
  {
    path: "/public/images/styles/comic-book.png",
    header: assetHeader,
    metric: "1,868 lines",
    metricDescription: "Comic Book art-style thumbnail.",
    description:
      "Provides the public thumbnail shown for the Comic Book art-style option defined in avatar-styles.ts. It is a display asset only; the backend prompt associated with the style is not stored in this image.",
    rows: [],
    reviewedSource: "Manual inspection of image metadata and the exact avatar-styles.ts consumer.",
  },
  {
    path: "/public/images/styles/hyper-realism.png",
    header: assetHeader,
    metric: "6,750 lines",
    metricDescription: "Hyper-Realism art-style thumbnail.",
    description:
      "Provides the public thumbnail shown for the Hyper-Realism art-style option defined in avatar-styles.ts. Selecting the style sends its ID through the application; this bitmap is only the visual preview.",
    rows: [],
    reviewedSource: "Manual inspection of image metadata and the exact avatar-styles.ts consumer.",
  },
  {
    path: "/public/images/styles/modern-anime.png",
    header: assetHeader,
    metric: "6,599 lines",
    metricDescription: "Modern Anime art-style thumbnail.",
    description:
      "Provides the public thumbnail shown for the Modern Anime art-style option defined in avatar-styles.ts. It does not contain or define the backend generation prompt.",
    rows: [],
    reviewedSource: "Manual inspection of image metadata and the exact avatar-styles.ts consumer.",
  },
  {
    path: "/public/images/styles/photo-realism.png",
    header: assetHeader,
    metric: "6,329 lines",
    metricDescription: "Photo Realism art-style thumbnail.",
    description:
      "Provides the public thumbnail shown for the Photo Realism art-style option defined in avatar-styles.ts. Runtime image generation uses the selected style identity, while this file remains presentation-only.",
    rows: [],
    reviewedSource: "Manual inspection of image metadata and the exact avatar-styles.ts consumer.",
  },
  {
    path: "/public/images/time-backgrounds/day.png",
    header: assetHeader,
    metric: "6,176 lines",
    metricDescription: "Daytime chat background.",
    description:
      "Provides the daytime image selected by ChatInterfaceTab's day/time background resolver. It is served from the public root and changes the visible chat atmosphere without changing story time or persistence state.",
    rows: [],
    reviewedSource: "Manual inspection of image metadata and the day branch in ChatInterfaceTab's background resolver.",
  },
  {
    path: "/public/images/time-backgrounds/night.png",
    header: assetHeader,
    metric: "1,485 lines",
    metricDescription: "Nighttime chat background.",
    description:
      "Provides the night image selected by ChatInterfaceTab's day/time background resolver. It is a visual treatment tied to the chosen time category and does not itself determine current story time.",
    rows: [],
    reviewedSource: "Manual inspection of image metadata and the night branch in ChatInterfaceTab's background resolver.",
  },
  {
    path: "/public/images/time-backgrounds/sunrise.png",
    header: assetHeader,
    metric: "5,720 lines",
    metricDescription: "Sunrise chat background.",
    description:
      "Provides the sunrise image selected by ChatInterfaceTab's day/time background resolver. It is loaded directly from the public path when the interface resolves the sunrise state.",
    rows: [],
    reviewedSource: "Manual inspection of image metadata and the sunrise branch in ChatInterfaceTab's background resolver.",
  },
  {
    path: "/public/images/time-backgrounds/sunset.png",
    header: assetHeader,
    metric: "5,982 lines",
    metricDescription: "Sunset chat background.",
    description:
      "Provides the sunset image selected by ChatInterfaceTab's day/time background resolver. It affects only the rendered chat backdrop and is not a source of story-state truth.",
    rows: [],
    reviewedSource: "Manual inspection of image metadata and the sunset branch in ChatInterfaceTab's background resolver.",
  },
  {
    path: "/public/placeholder.svg",
    header: assetHeader,
    metric: "1 line",
    metricDescription: "Generic public placeholder illustration.",
    description:
      "Contains the default scalable placeholder graphic supplied with the original frontend scaffold. No current source file references this exact public path, so it has no active Chronicle UI role.",
    rows: [],
    reviewedSource: "Manual inspection of SVG content, byte size, and repository-wide consumer search.",
  },
  {
    path: "/public/robots.txt",
    header: documentationHeader,
    metric: "14 lines",
    metricDescription: "Web-crawler directives served from the site root.",
    description:
      "Defines user-agent crawling rules and sitemap-facing directives returned as /robots.txt by the built site. It governs cooperative crawler behavior only; it is not authentication, authorization, or a privacy boundary.",
    rows: [],
    reviewedSource: "Manual review of every crawler directive and public serving behavior.",
  },
  {
    path: "/public/screenshots/auth-modal-full.png",
    header: assetHeader,
    metric: "922 lines",
    metricDescription: "Authentication modal reference screenshot.",
    description:
      "Preserves a full authentication-modal screenshot for visual comparison and documentation. No current frontend source imports this path, so it does not render the live AuthModal or define its behavior.",
    rows: [],
    reviewedSource: "Manual inspection of image metadata, filename intent, and repository-wide consumer search.",
  },
  {
    path: "/public/spellcheck/en-words.txt",
    header: assetHeader,
    metric: "234,143 lines",
    metricDescription: "English word list loaded by chat spellcheck.",
    description:
      "Supplies the newline-delimited English dictionary fetched by chat-spellcheck.ts and cached in memory for misspelling detection and suggestions. Because it is served as a static public file, it contains vocabulary only and no user-authored text.",
    rows: [],
    reviewedSource: "Manual review of file format, size, public path, and the dictionary loader in chat-spellcheck.ts.",
  },
  {
    path: "/public/style-guide-component-example.html",
    header: documentationHeader,
    metric: "3,180 lines",
    metricDescription: "Standalone component-library preview embedded by StyleGuideTool.",
    description:
      "Contains the static HTML, CSS, and JavaScript catalog of Chronicle UI component examples shown inside the admin Style Guide iframe. StyleGuideTool loads this exact public page; changes here alter the reference preview but not the corresponding production React components unless those components are separately updated.",
    rows: [
      {
        id: "component-example-catalog",
        title: "Static UI reference catalog",
        summary:
          "Demonstrates shell, navigation, cards, controls, dialogs, rows, builder surfaces, and other visual patterns in a self-contained page used for design comparison.",
        badgeLabel: "STYLE GUIDE",
        badgeClass: "documentation",
        details: [],
      },
      {
        id: "component-example-boundary",
        title: "Reference versus runtime",
        summary:
          "The iframe is an admin design reference. Its HTML is not a shared component implementation and can drift from production unless manually reconciled.",
        badgeLabel: "STATIC HTML",
        badgeClass: "data-block",
        details: [],
      },
    ],
    reviewedSource: "Manual review of the static document structure and its iframe consumer in StyleGuideTool.",
  },
  {
    path: "/public/styleguide-mockup-reference.html",
    header: documentationHeader,
    metric: "1,877 lines",
    metricDescription: "Archived standalone Style Guide mock-up reference.",
    description:
      "Preserves an older self-contained Style Guide mock-up used as a visual comparison artifact. The current StyleGuideTool does not load this file, and the path is retained only in App Architecture's existing reference navigation; it has no production UI behavior.",
    rows: [],
    reviewedSource: "Manual review of the HTML artifact and repository-wide consumer search.",
  },
  {
    path: "/src/assets/admin/security-shield-v2-cropped.png",
    header: assetHeader,
    metric: "2,351 lines",
    metricDescription: "Security-control marker used by App Architecture.",
    description:
      "Provides the shield icon rendered beside security-sensitive architecture rows and schema controls on the App Architecture page. It is an explanatory marker only and does not implement or verify the security control it labels.",
    rows: [],
    reviewedSource: "Manual inspection of image metadata and the direct import and uses in app-architecture.tsx.",
  },
  {
    path: "/src/assets/admin/settings-cog.png",
    header: assetHeader,
    metric: "88 lines",
    metricDescription: "Conditional-lane marker used by Roleplay Pipeline.",
    description:
      "Provides the small cog icon rendered by the Roleplay Pipeline page when an item runs only under a setting, mode, admin action, optional follow-up, or other condition. It communicates the map's settingsGate metadata and does not control the underlying runtime condition.",
    rows: [],
    reviewedSource: "Manual inspection of image metadata and the direct import and conditional rendering in api-inspector.tsx.",
  },
  {
    path: "/src/assets/guide-screenshots/account-profile-tab.png",
    header: assetHeader,
    metric: "480 lines",
    metricDescription: "App Guide reference for the account public-profile tab.",
    description:
      "Captures the public-profile tab for visual documentation of account navigation and layout. No current source file imports the bitmap directly; it is retained as guide-review evidence rather than a runtime asset.",
    rows: [],
    reviewedSource: "Manual inspection of image metadata, subject, and repository-wide consumer search.",
  },
  {
    path: "/src/assets/guide-screenshots/account-settings-tab.png",
    header: assetHeader,
    metric: "168 lines",
    metricDescription: "App Guide reference for account settings.",
    description:
      "Captures the account settings tab for guide comparison. It is not imported by the active account component and does not define settings behavior.",
    rows: [],
    reviewedSource: "Manual inspection of image metadata, subject, and repository-wide consumer search.",
  },
  {
    path: "/src/assets/guide-screenshots/account-subscription-tab.png",
    header: assetHeader,
    metric: "375 lines",
    metricDescription: "App Guide reference for the subscription tab.",
    description:
      "Captures the account subscription view for documentation and visual review. It has no current runtime importer and does not supply subscription data.",
    rows: [],
    reviewedSource: "Manual inspection of image metadata, subject, and repository-wide consumer search.",
  },
  {
    path: "/src/assets/guide-screenshots/arcs-guidance.png",
    header: assetHeader,
    metric: "3,538 lines",
    metricDescription: "App Guide reference for story-arc guidance.",
    description:
      "Captures the story-arc guidance interface for documentation and visual comparison. It is retained as reference evidence and is not an active input to arc logic or rendering.",
    rows: [],
    reviewedSource: "Manual inspection of image metadata, subject, and repository-wide consumer search.",
  },
  {
    path: "/src/assets/guide-screenshots/art-style-grid.png",
    header: assetHeader,
    metric: "3,822 lines",
    metricDescription: "App Guide reference for the art-style selector grid.",
    description:
      "Captures the art-style selection grid for visual documentation. The live grid is driven by art-style data and components; this screenshot is not used to render or configure it.",
    rows: [],
    reviewedSource: "Manual inspection of image metadata, subject, and repository-wide consumer search.",
  },
  {
    path: "/src/assets/guide-screenshots/character-roster.png",
    header: assetHeader,
    metric: "3,102 lines",
    metricDescription: "App Guide reference for the character roster.",
    description:
      "Captures the character-roster presentation used during guide review. It is documentation evidence only and does not populate the live roster or establish character state.",
    rows: [],
    reviewedSource: "Manual inspection of image metadata, subject, and repository-wide consumer search.",
  },
  {
    path: "/src/assets/guide-screenshots/chat-day-time-panel.png",
    header: assetHeader,
    metric: "522 lines",
    metricDescription: "App Guide reference for the chat day/time panel.",
    description:
      "Captures the compact day/time control panel for documentation. It does not drive the live day counter, time state, or background selection.",
    rows: [],
    reviewedSource: "Manual inspection of image metadata, subject, and repository-wide consumer search.",
  },
  {
    path: "/src/assets/guide-screenshots/chat-history-card-hover.png",
    header: assetHeader,
    metric: "613 lines",
    metricDescription: "App Guide reference for chat-history card hover state.",
    description:
      "Captures the hover affordances on a chat-history card for guide comparison. It is not consumed by ConversationsTab and has no interaction behavior of its own.",
    rows: [],
    reviewedSource: "Manual inspection of image metadata, subject, and repository-wide consumer search.",
  },
  {
    path: "/src/assets/guide-screenshots/chat-history-full.png",
    header: assetHeader,
    metric: "596 lines",
    metricDescription: "App Guide reference for the full chat-history page.",
    description:
      "Captures the overall chat-history layout for documentation and drift review. It is retained evidence rather than a runtime dependency.",
    rows: [],
    reviewedSource: "Manual inspection of image metadata, subject, and repository-wide consumer search.",
  },
  {
    path: "/src/assets/guide-screenshots/chat-input-bar.png",
    header: assetHeader,
    metric: "1,443 lines",
    metricDescription: "App Guide reference for the chat composer.",
    description:
      "Captures the roleplay message input and controls for guide review. The live composer remains owned by ChatInterfaceTab and ChatSpellcheckTextarea; this image supplies no input behavior.",
    rows: [],
    reviewedSource: "Manual inspection of image metadata, subject, and repository-wide consumer search.",
  },
  {
    path: "/src/assets/guide-screenshots/chat-message-bubble.png",
    header: assetHeader,
    metric: "2,077 lines",
    metricDescription: "App Guide reference for assistant message bubbles.",
    description:
      "Captures the assistant-message presentation used during chat-interface review. It does not provide message content, rendering logic, or retry/continue controls.",
    rows: [],
    reviewedSource: "Manual inspection of image metadata, subject, and repository-wide consumer search.",
  },
  {
    path: "/src/assets/guide-screenshots/chat-settings-modal.png",
    header: assetHeader,
    metric: "1,384 lines",
    metricDescription: "App Guide reference for chat settings.",
    description:
      "Captures the chat settings modal for documentation and visual comparison. The screenshot does not define settings defaults, persistence, or prompt behavior.",
    rows: [],
    reviewedSource: "Manual inspection of image metadata, subject, and repository-wide consumer search.",
  },
  {
    path: "/src/assets/guide-screenshots/chat-sidebar-chars.png",
    header: assetHeader,
    metric: "1,690 lines",
    metricDescription: "App Guide reference for chat sidebar characters.",
    description:
      "Captures the character area in the roleplay sidebar for guide review. It does not determine roster membership, active character state, or character-card data.",
    rows: [],
    reviewedSource: "Manual inspection of image metadata, subject, and repository-wide consumer search.",
  },
  {
    path: "/src/assets/guide-screenshots/chat-user-bubble.png",
    header: assetHeader,
    metric: "1,991 lines",
    metricDescription: "App Guide reference for user message bubbles.",
    description:
      "Captures user-authored message presentation for chat-interface documentation. It does not contain or store live conversation data.",
    rows: [],
    reviewedSource: "Manual inspection of image metadata, subject, and repository-wide consumer search.",
  },
  {
    path: "/src/assets/guide-screenshots/content-themes-tags.png",
    header: assetHeader,
    metric: "3,731 lines",
    metricDescription: "App Guide reference for content-theme tags.",
    description:
      "Captures the content-theme and tag controls for documentation. The active taxonomy and prompt directives come from constants and services, not from this image.",
    rows: [],
    reviewedSource: "Manual inspection of image metadata, subject, and repository-wide consumer search.",
  },
  {
    path: "/src/assets/guide-screenshots/gallery-card-badges.png",
    header: assetHeader,
    metric: "2,142 lines",
    metricDescription: "App Guide reference for gallery-card badges.",
    description:
      "Captures the badge treatment on gallery story cards for visual review. It does not define publishing, remix, content-rating, or badge-selection logic.",
    rows: [],
    reviewedSource: "Manual inspection of image metadata, subject, and repository-wide consumer search.",
  },
  {
    path: "/src/assets/guide-screenshots/gallery-card-hover.png",
    header: assetHeader,
    metric: "2,227 lines",
    metricDescription: "App Guide reference for gallery-card hover state.",
    description:
      "Captures hover controls on a Community Gallery card for documentation. GalleryStoryCard owns the live interactions; this image is only a reference snapshot.",
    rows: [],
    reviewedSource: "Manual inspection of image metadata, subject, and repository-wide consumer search.",
  },
  {
    path: "/src/assets/guide-screenshots/gallery-detail-content.png",
    header: assetHeader,
    metric: "1,615 lines",
    metricDescription: "App Guide reference for gallery story details.",
    description:
      "Captures the content region of a gallery story detail view for documentation and layout review. It contains no live story record and is not read by StoryDetailModal.",
    rows: [],
    reviewedSource: "Manual inspection of image metadata, subject, and repository-wide consumer search.",
  },
  {
    path: "/src/assets/guide-screenshots/gallery-empty-state.png",
    header: assetHeader,
    metric: "283 lines",
    metricDescription: "App Guide reference for the gallery empty state.",
    description:
      "Captures the no-results or empty Community Gallery presentation for visual review. The live empty-state condition and text are determined by GalleryHub.",
    rows: [],
    reviewedSource: "Manual inspection of image metadata, subject, and repository-wide consumer search.",
  },
  {
    path: "/src/assets/guide-screenshots/gallery-sidebar.png",
    header: assetHeader,
    metric: "1,531 lines",
    metricDescription: "App Guide reference for gallery filtering navigation.",
    description:
      "Captures the Community Gallery sidebar for guide comparison. It does not own category, search, content-rating, or filter state.",
    rows: [],
    reviewedSource: "Manual inspection of image metadata, subject, and repository-wide consumer search.",
  },
  {
    path: "/src/assets/guide-screenshots/header-bar.png",
    header: assetHeader,
    metric: "3,039 lines",
    metricDescription: "App Guide reference for the global header bar.",
    description:
      "Captures Chronicle's header composition for documentation and visual comparison. AppShellHeader and AppShellTopBar own the active header behavior and layout.",
    rows: [],
    reviewedSource: "Manual inspection of image metadata, subject, and repository-wide consumer search.",
  },
  {
    path: "/src/assets/guide-screenshots/left-sidebar.png",
    header: assetHeader,
    metric: "3,114 lines",
    metricDescription: "App Guide reference for the primary sidebar.",
    description:
      "Captures Chronicle's main left navigation for guide review. AppSidebar owns the actual routes, active state, collapse behavior, and permissions.",
    rows: [],
    reviewedSource: "Manual inspection of image metadata, subject, and repository-wide consumer search.",
  },
  {
    path: "/src/assets/guide-screenshots/my-stories-card-hover.png",
    header: assetHeader,
    metric: "1,792 lines",
    metricDescription: "App Guide reference for My Stories card hover state.",
    description:
      "Captures hover actions on an owned-story card for documentation. StoryHub and StoryCardView own the live edit, open, share, and delete behavior.",
    rows: [],
    reviewedSource: "Manual inspection of image metadata, subject, and repository-wide consumer search.",
  },
  {
    path: "/src/assets/guide-screenshots/my-stories-cards-badges.png",
    header: assetHeader,
    metric: "1,759 lines",
    metricDescription: "App Guide reference for My Stories card badges.",
    description:
      "Captures status and metadata badges on owned-story cards for visual review. It does not compute publication, privacy, content, or progress state.",
    rows: [],
    reviewedSource: "Manual inspection of image metadata, subject, and repository-wide consumer search.",
  },
  {
    path: "/src/assets/guide-screenshots/my-stories-delete-dialog.png",
    header: assetHeader,
    metric: "998 lines",
    metricDescription: "App Guide reference for story deletion confirmation.",
    description:
      "Captures the owned-story delete dialog for documentation. The live confirmation, storage cleanup, and database deletion are implemented elsewhere.",
    rows: [],
    reviewedSource: "Manual inspection of image metadata, subject, and repository-wide consumer search.",
  },
  {
    path: "/src/assets/guide-screenshots/my-stories-detail-modal.png",
    header: assetHeader,
    metric: "1,398 lines",
    metricDescription: "App Guide reference for owned-story details.",
    description:
      "Captures the My Stories detail modal for layout documentation. It is not a data source for the active StoryDetailModal.",
    rows: [],
    reviewedSource: "Manual inspection of image metadata, subject, and repository-wide consumer search.",
  },
  {
    path: "/src/assets/guide-screenshots/my-stories-full.png",
    header: assetHeader,
    metric: "821 lines",
    metricDescription: "App Guide reference for the full My Stories mobile view.",
    description:
      "Captures a narrow-screen My Stories layout for responsive documentation. It does not participate in runtime breakpoints or render decisions.",
    rows: [],
    reviewedSource: "Manual inspection of image metadata, subject, and repository-wide consumer search.",
  },
  {
    path: "/src/assets/guide-screenshots/my-stories-new-story.png",
    header: assetHeader,
    metric: "1,794 lines",
    metricDescription: "App Guide reference for the new-story action.",
    description:
      "Captures the My Stories create-new-story affordance for visual review. The actual navigation and scenario initialization live in StoryHub and the application page controller.",
    rows: [],
    reviewedSource: "Manual inspection of image metadata, subject, and repository-wide consumer search.",
  },
  {
    path: "/src/assets/guide-screenshots/story-card-panel.png",
    header: assetHeader,
    metric: "4,054 lines",
    metricDescription: "App Guide reference for the Story Card editor panel.",
    description:
      "Captures the Story Card portion of the builder for documentation. The active fields, state, AI enhancement, and persistence are implemented in Story Builder components and services.",
    rows: [],
    reviewedSource: "Manual inspection of image metadata, subject, and repository-wide consumer search.",
  },
  {
    path: "/src/assets/guide-screenshots/story-setup-heading.png",
    header: assetHeader,
    metric: "3,055 lines",
    metricDescription: "App Guide reference for the Story Setup heading area.",
    description:
      "Captures the Story Builder heading and surrounding layout for visual comparison. It has no active relationship to builder state or routing.",
    rows: [],
    reviewedSource: "Manual inspection of image metadata, subject, and repository-wide consumer search.",
  },
  {
    path: "/src/assets/guide-screenshots/world-codex.png",
    header: assetHeader,
    metric: "3,635 lines",
    metricDescription: "App Guide reference for the World Codex editor.",
    description:
      "Captures the World Codex builder section for documentation. The live world fields, custom sections, enhancement prompts, normalization, and save behavior are owned by Story Builder and its domain services.",
    rows: [],
    reviewedSource: "Manual inspection of image metadata, subject, and repository-wide consumer search.",
  },
  {
    path: "/src/assets/resume-session-hero.png",
    header: assetHeader,
    metric: "1,505 lines",
    metricDescription: "Retained resume-session illustration with no current source consumer.",
    description:
      "Stores a previously used resume-session hero image. A repository-wide search finds no current import or public-path reference, so it does not appear in the active Chronicle interface and should be treated as unused retained media.",
    rows: [],
    reviewedSource: "Manual inspection of image metadata and repository-wide consumer search confirming no active use.",
  },
]);
