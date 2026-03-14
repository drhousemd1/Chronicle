import type {
  UiAuditComponentVariantDriftItem,
  UiAuditColorConsolidationItem,
  UiAuditFinding,
  UiAuditInteractionStateMatrixRow,
  UiAuditReviewUnit,
  UiAuditScope,
  UiAuditTaxonomy,
} from "@/lib/ui-audit-schema";
import {
  UI_AUDIT_CATEGORIES,
  UI_AUDIT_CONFIDENCE,
  UI_AUDIT_SEVERITIES,
} from "@/lib/ui-audit-schema";

export const uiAuditScope: UiAuditScope = {
  sources: [
    "audit/reference/UI_UX_Accessibility_React_Handbook_2026_Unified.txt",
    "audit/reference/chronicle-style-guide-2026-03-13.html",
    "public/styleguide-mockup-reference.html",
    "src/components/admin/styleguide/StyleGuideTool.tsx",
    "docs/guides/ui-styling-theme-reference.md",
    "application code under src/",
  ],
  startedOn: "2026-03-12",
  updatedOn: "2026-03-13",
  notes:
    "Audit-first pass complete. Findings are persisted and grouped. Primary visual source is chronicle-style-guide-2026-03-13.html. Interaction-state matrix pass added for rest/hover/focus/active/disabled/loading coverage. This audit documents issues and drift without broad styling remediations.",
};

export const uiAuditTaxonomy: UiAuditTaxonomy = {
  severities: UI_AUDIT_SEVERITIES,
  confidence: UI_AUDIT_CONFIDENCE,
  categories: UI_AUDIT_CATEGORIES,
};

export const uiAuditProgress: UiAuditReviewUnit[] = [
  {
    id: "unit-app-shell",
    name: "App Shell and Route Host",
    route: "/",
    component: "Index",
    files: ["src/pages/Index.tsx", "src/App.tsx", "src/index.css"],
    status: "reviewed",
    notes:
      "Top-level navigation/header patterns reviewed. Repeated action button classes and token drift confirmed.",
  },
  {
    id: "unit-community-gallery",
    name: "Community Gallery",
    component: "GalleryHub",
    files: [
      "src/components/chronicle/GalleryHub.tsx",
      "src/components/chronicle/GalleryCategorySidebar.tsx",
      "src/components/chronicle/GalleryStoryCard.tsx",
    ],
    status: "reviewed",
    notes:
      "Search/filter controls, chip removal buttons, and sidebar close controls reviewed for a11y and consistency.",
  },
  {
    id: "unit-story-hub",
    name: "My Stories",
    component: "StoryHub",
    files: ["src/components/chronicle/StoryHub.tsx"],
    status: "reviewed",
    notes:
      "Card interaction model and hover-only controls reviewed. Keyboard access issues confirmed.",
  },
  {
    id: "unit-character-library",
    name: "Character Library",
    component: "CharactersTab",
    files: [
      "src/components/chronicle/CharactersTab.tsx",
      "src/components/chronicle/CharacterEditModal.tsx",
    ],
    status: "reviewed",
    notes:
      "Card patterns, modal patterns, typography scale, and radius drift reviewed.",
  },
  {
    id: "unit-story-builder",
    name: "Story Builder",
    component: "WorldTab",
    files: [
      "src/components/chronicle/WorldTab.tsx",
      "src/components/chronicle/StoryCardView.tsx",
      "src/components/chronicle/StoryGoalsSection.tsx",
    ],
    status: "reviewed",
    notes:
      "Scene gallery interactions, small target controls, and drift from shared tokens reviewed.",
  },
  {
    id: "unit-chat-interface",
    name: "Chat Interface",
    component: "ChatInterfaceTab",
    files: ["src/components/chronicle/ChatInterfaceTab.tsx"],
    status: "reviewed",
    notes:
      "Icon-only controls, hover-only actions, sidebar theming divergence, and target-size issues reviewed.",
  },
  {
    id: "unit-chat-history",
    name: "Chat History",
    component: "ConversationsTab",
    files: ["src/components/chronicle/ConversationsTab.tsx"],
    status: "reviewed",
    notes: "Session cards and action affordances reviewed.",
  },
  {
    id: "unit-image-library",
    name: "Image Library",
    component: "ImageLibraryTab",
    files: [
      "src/components/chronicle/ImageLibraryTab.tsx",
      "src/components/chronicle/ImageLibraryPickerModal.tsx",
      "src/components/chronicle/SceneTagEditorModal.tsx",
    ],
    status: "reviewed",
    notes:
      "Custom lightbox/modal semantics, tags editor interactions, and token drift reviewed.",
  },
  {
    id: "unit-account",
    name: "Account",
    component: "Account tabs",
    files: [
      "src/components/account/AccountSettingsTab.tsx",
      "src/components/account/SubscriptionTab.tsx",
      "src/components/account/PublicProfileTab.tsx",
    ],
    status: "reviewed",
    notes:
      "Form controls, icon-only toggles, and card consistency reviewed.",
  },
  {
    id: "unit-creator-profile",
    name: "Creator Profile",
    route: "/creator/:userId",
    component: "CreatorProfile",
    files: ["src/pages/CreatorProfile.tsx"],
    status: "reviewed",
    notes:
      "Header/theme mismatch and card duplication vs account profile surface reviewed.",
  },
  {
    id: "unit-admin",
    name: "Admin and Guide Surfaces",
    component: "AdminPage + StyleGuideTool",
    files: [
      "src/pages/Admin.tsx",
      "src/components/admin/styleguide/StyleGuideTool.tsx",
      "src/components/admin/guide/AppGuideTool.tsx",
    ],
    status: "reviewed",
    notes:
      "Style guide inconsistency catalog and admin card patterns reviewed.",
  },
  {
    id: "unit-auth",
    name: "Authentication Modal",
    component: "AuthModal",
    files: ["src/components/auth/AuthModal.tsx"],
    status: "reviewed",
    notes:
      "Theme variation and unlabeled icon controls reviewed.",
  },
  {
    id: "unit-primitives",
    name: "Shared Primitives and Tokens",
    component: "Chronicle UI + shadcn",
    files: [
      "src/components/chronicle/UI.tsx",
      "src/components/ui/dialog.tsx",
      "src/components/ui/button.tsx",
      "tailwind.config.ts",
      "src/index.css",
    ],
    status: "reviewed",
    notes:
      "Dual primitive systems and token usage drift reviewed.",
  },
  {
    id: "unit-gallery-route-page",
    name: "Gallery Route Page Wrapper",
    route: "/gallery",
    component: "Gallery",
    files: ["src/pages/Gallery.tsx", "src/App.tsx"],
    status: "reviewed",
    notes:
      "Standalone gallery page reviewed; route is currently not registered in the active app router.",
  },
  {
    id: "unit-not-found",
    name: "Not Found Route",
    route: "*",
    component: "NotFound",
    files: ["src/pages/NotFound.tsx"],
    status: "reviewed",
    notes:
      "Fallback route reviewed; SPA navigation consistency issue captured.",
  },
  {
    id: "unit-responsive-pass",
    name: "Cross-page Responsive and Tablet Pass",
    files: [
      "src/pages/Index.tsx",
      "src/components/chronicle/*.tsx",
      "src/components/account/*.tsx",
    ],
    status: "reviewed",
    notes:
      "Completed code-level responsive sweep across shell/chat/builder/account/gallery surfaces; fixed-width sidebar pressure points and hover dependence captured.",
  },
  {
    id: "unit-keyboard-nav-pass",
    name: "Keyboard Navigation Full Walkthrough",
    files: [
      "src/components/chronicle/*.tsx",
      "src/components/account/*.tsx",
      "src/components/admin/*.tsx",
    ],
    status: "reviewed",
    notes:
      "Completed code-level keyboard operability sweep; non-semantic click targets and non-keyboard collapsible headers captured.",
  },
  {
    id: "unit-interaction-state-pass",
    name: "Interaction State Matrix Pass",
    files: [
      "src/components/chronicle/UI.tsx",
      "src/components/ui/button.tsx",
      "src/components/chronicle/StoryHub.tsx",
      "src/components/chronicle/CharactersTab.tsx",
      "src/components/chronicle/WorldTab.tsx",
      "src/components/chronicle/ChatInterfaceTab.tsx",
      "src/components/chronicle/ConversationsTab.tsx",
      "src/pages/Index.tsx",
    ],
    status: "reviewed",
    notes:
      "Mapped rest/hover/focus/active/disabled/loading coverage across core interactive patterns and logged state-contract drift.",
  },
  {
    id: "unit-component-variant-pass",
    name: "Component Variant Drift Pass",
    files: [
      "src/pages/Index.tsx",
      "src/components/chronicle/StoryHub.tsx",
      "src/components/chronicle/GalleryStoryCard.tsx",
      "src/components/chronicle/CharactersTab.tsx",
      "src/components/chronicle/WorldTab.tsx",
      "src/components/chronicle/AvatarActionButtons.tsx",
      "src/components/chronicle/CoverImageActionButtons.tsx",
      "src/components/chronicle/SceneGalleryActionButtons.tsx",
      "src/components/chronicle/CharacterEditModal.tsx",
      "src/components/chronicle/StoryDetailModal.tsx",
      "src/components/chronicle/ChatInterfaceTab.tsx",
      "src/components/auth/AuthModal.tsx",
      "src/components/ui/dialog.tsx",
    ],
    status: "reviewed",
    notes:
      "Cataloged variant duplication and drift across button/card/modal/input families; persisted matrix for future batching.",
  },
];

export const tokenDriftSnapshot = {
  recordedOn: "2026-03-12",
  hardcodedHexTopValues: [
    { token: "#4a5f7f", occurrences: 325 },
    { token: "#2a2a2f", occurrences: 115 },
    { token: "#3b82f6", occurrences: 44 },
    { token: "#121214", occurrences: 26 },
    { token: "#1e1e22", occurrences: 23 },
  ],
  radiusVariants: [
    { token: "rounded-[10px]", occurrences: 28 },
    { token: "rounded-[2rem]", occurrences: 23 },
    { token: "rounded-[24px]", occurrences: 23 },
    { token: "rounded-[32px]", occurrences: 6 },
  ],
  typographyMicrosizes: [
    { token: "text-[10px]", occurrences: 262 },
    { token: "text-[9px]", occurrences: 68 },
    { token: "text-[8px]", occurrences: 30 },
    { token: "text-[7px]", occurrences: 38 },
  ],
};

export const uiAuditColorConsolidationPlan: UiAuditColorConsolidationItem[] = [
  {
    id: "color-plan-001",
    decision: "keep",
    sourceColors: ["#121214"],
    targetColor: "#121214",
    semanticRole: "app-shell background",
    scope: "app-wide",
    priority: "now",
    rationale:
      "Near-black shell background is a stable anchor and already widely used across dark-page wrappers.",
    evidence: [
      "Hex scan shows `#121214` with 28 occurrences.",
      "Style guide maps Near Black to major page backgrounds (Gallery/Account/Creator).",
    ],
    sampleFiles: ["src/components/chronicle/GalleryHub.tsx", "src/pages/CreatorProfile.tsx"],
  },
  {
    id: "color-plan-002",
    decision: "keep",
    sourceColors: ["#2a2a2f"],
    targetColor: "#2a2a2f",
    semanticRole: "primary dark panel surface",
    scope: "app-wide",
    priority: "now",
    rationale:
      "This is the dominant panel/container neutral and should remain the default dark surface token.",
    evidence: [
      "Hex scan shows `#2a2a2f` as the top neutral with 133 occurrences.",
      "Used across cards, panel bodies, badges, and dark inputs in multiple pages.",
    ],
    sampleFiles: ["src/components/chronicle/WorldTab.tsx", "src/components/chronicle/StoryDetailModal.tsx"],
  },
  {
    id: "color-plan-003",
    decision: "keep",
    sourceColors: ["#4a5f7f"],
    targetColor: "#4a5f7f",
    semanticRole: "brand primary action/background",
    scope: "app-wide",
    priority: "now",
    rationale:
      "This is the established brand blue used for headers, active states, and primary actions.",
    evidence: [
      "Hex scan shows `#4a5f7f` with 333 occurrences.",
      "Style guide repeatedly identifies Slate Blue as app-wide.",
    ],
    sampleFiles: ["src/components/chronicle/UI.tsx", "src/components/chronicle/CharactersTab.tsx"],
  },
  {
    id: "color-plan-004",
    decision: "keep",
    sourceColors: ["#5a6f8f"],
    targetColor: "#5a6f8f",
    semanticRole: "brand primary hover",
    scope: "app-wide",
    priority: "next",
    rationale:
      "Retain one explicit hover companion for brand primary rather than many page-local hover blues.",
    evidence: [
      "`#5a6f8f` appears as the common hover tone for slate-blue buttons and chips.",
      "Near-duplicate hover blues exist and can map to this single hover token.",
    ],
    sampleFiles: ["src/components/chronicle/GalleryHub.tsx", "src/components/chronicle/ChatInterfaceTab.tsx"],
  },
  {
    id: "color-plan-005",
    decision: "keep",
    sourceColors: ["#3b82f6"],
    targetColor: "#3b82f6",
    semanticRole: "accent/info/focus",
    scope: "app-wide",
    priority: "now",
    rationale:
      "Blue-500 already acts as the accent and information color for links, focus, and utility actions.",
    evidence: [
      "Hex scan shows `#3b82f6` with 45 occurrences.",
      "Style guide identifies True Blue as app-wide for links/focus/tag accents.",
    ],
    sampleFiles: ["src/components/chronicle/WorldTab.tsx", "src/components/chronicle/StoryDetailModal.tsx"],
  },
  {
    id: "color-plan-006",
    decision: "keep",
    sourceColors: ["#94a3b8"],
    targetColor: "#94a3b8",
    semanticRole: "muted readable text on dark surfaces",
    scope: "app-wide",
    priority: "next",
    rationale:
      "This muted slate still reads well on dark backgrounds and should be the default muted-text token.",
    evidence: [
      "Hex scan shows `#94a3b8` with 30 occurrences.",
      "Contrast check on soft-black backgrounds remains comfortably above common body-text minimums.",
    ],
    sampleFiles: ["src/pages/Index.tsx", "src/components/chronicle/ChatInterfaceTab.tsx"],
  },
  {
    id: "color-plan-007",
    decision: "keep",
    sourceColors: ["#ef4444"],
    targetColor: "#ef4444",
    semanticRole: "destructive status",
    scope: "app-wide",
    priority: "now",
    rationale:
      "Red destructive state is semantically distinct and should remain stable.",
    evidence: [
      "Red is used repeatedly for destructive actions and warnings.",
      "Contrast checks on dark panels remain acceptable for status labeling.",
    ],
    sampleFiles: ["src/components/chronicle/StoryDetailModal.tsx", "src/components/chronicle/ReviewModal.tsx"],
  },
  {
    id: "color-plan-017",
    decision: "keep",
    sourceColors: ["#34d399"],
    targetColor: "#34d399",
    semanticRole: "success status",
    scope: "app-wide",
    priority: "now",
    rationale:
      "Success/positive outcomes need one stable semantic green token.",
    evidence: [
      "Emerald accents appear in success and published-state treatments.",
      "Contrast on dark surfaces remains strong.",
    ],
    sampleFiles: ["src/components/chronicle/StoryHub.tsx", "src/components/account/SubscriptionTab.tsx"],
  },
  {
    id: "color-plan-018",
    decision: "keep",
    sourceColors: ["#f59e0b"],
    targetColor: "#f59e0b",
    semanticRole: "warning/attention status",
    scope: "app-wide",
    priority: "now",
    rationale:
      "Warning/attention semantics should use one canonical amber token.",
    evidence: [
      "Amber appears across warning and save-state contexts.",
      "Contrast checks on dark surfaces are acceptable.",
    ],
    sampleFiles: ["src/components/chronicle/StoryDetailModal.tsx", "src/components/chronicle/ChatInterfaceTab.tsx"],
  },
  {
    id: "color-plan-008",
    decision: "merge",
    sourceColors: ["#2b2b2e", "#2e2e33", "#2b2d33", "#27272a"],
    targetColor: "#2a2a2f",
    semanticRole: "panel/surface neutral cluster",
    scope: "mixed",
    priority: "now",
    rationale:
      "These values are visually near-identical and currently create unnecessary panel-level variation.",
    evidence: [
      "Near-duplicate distance checks: `#2a2a2f` vs `#2b2b2e` = 1.7, `#2a2a2f` vs `#2b2d33` = 5.1.",
      "Each appears in repeated panel and badge contexts with overlapping intent.",
    ],
    sampleFiles: ["src/components/chronicle/StoryHub.tsx", "src/components/account/SubscriptionTab.tsx"],
  },
  {
    id: "color-plan-009",
    decision: "merge",
    sourceColors: ["#1a1a1a", "#18181b", "#1c1f26"],
    targetColor: "#121214",
    semanticRole: "shell/background dark cluster",
    scope: "mixed",
    priority: "now",
    rationale:
      "These dark shell values differ by only a few RGB points and should map to one base background token.",
    evidence: [
      "Near-duplicate checks: `#18181b` vs `#1a1a1a` = 3.0, `#1a1a1a` vs `#1c1f26` = 13.2.",
      "Used for wrappers and sidebars where semantic role is equivalent.",
    ],
    sampleFiles: ["src/pages/Index.tsx", "src/components/chronicle/ChatInterfaceTab.tsx"],
  },
  {
    id: "color-plan-010",
    decision: "merge",
    sourceColors: ["#1e1e22"],
    targetColor: "#2a2a2f",
    semanticRole: "card/panel body",
    scope: "page-specific",
    priority: "next",
    rationale:
      "Charcoal card bodies overlap with default dark panel token and can be consolidated to reduce drift.",
    evidence: [
      "`#1e1e22` appears 25 times and frequently sits adjacent to `#2a2a2f` containers.",
      "Master inconsistency report flags theme fragmentation across dark surfaces.",
    ],
    sampleFiles: ["src/components/account/AccountSettingsTab.tsx", "src/pages/style-guide/ui-audit.tsx"],
  },
  {
    id: "color-plan-011",
    decision: "merge",
    sourceColors: ["#2d6fdb", "#6b82a8", "#3d5170"],
    targetColor: "#5a6f8f",
    semanticRole: "brand-hover variants",
    scope: "mixed",
    priority: "next",
    rationale:
      "Brand hover blues are fragmented; use one hover token for predictable interaction feedback.",
    evidence: [
      "These hover tones are close in use intent and frequently attached to primary-brand controls.",
      "Style guide buttons section currently documents many one-off hover values.",
    ],
    sampleFiles: ["src/components/chronicle/GalleryHub.tsx", "src/components/chronicle/CharacterEditModal.tsx"],
  },
  {
    id: "color-plan-012",
    decision: "merge",
    sourceColors: ["#71717a", "#64748b"],
    targetColor: "#94a3b8",
    semanticRole: "secondary metadata text",
    scope: "app-wide",
    priority: "now",
    rationale:
      "Lower-contrast grays should be promoted to one readable muted token for text on dark surfaces.",
    evidence: [
      "Contrast check: `#71717a` on `#2a2a2f` is 2.95:1 (risk for normal text).",
      "Stone/Cool gray labels are used for metadata and helper text in multiple flows.",
    ],
    sampleFiles: ["src/components/chronicle/ConversationsTab.tsx", "src/components/chronicle/StoryCardView.tsx"],
  },
  {
    id: "color-plan-013",
    decision: "merge",
    sourceColors: ["#e4e4e7", "#e5e7eb", "#d1d5db", "#d4d4d8", "#e2e2e2"],
    targetColor: "#e2e8f0",
    semanticRole: "light neutral text/border set",
    scope: "mixed",
    priority: "next",
    rationale:
      "Light neutral variants are currently over-granular and should resolve to one shared light neutral token.",
    evidence: [
      "Near-duplicate checks show small deltas among these light grays (for example `#e4e4e7` vs `#e5e7eb` = 5.1).",
      "Used interchangeably in borders, helper text, and modal details.",
    ],
    sampleFiles: ["src/components/admin/styleguide/StyleGuideTool.tsx", "src/components/chronicle/StoryDetailModal.tsx"],
  },
  {
    id: "color-plan-014",
    decision: "deprecate",
    sourceColors: ["#7ba3d4"],
    targetColor: "#3b82f6",
    semanticRole: "page-local blue accent",
    scope: "page-specific",
    priority: "later",
    rationale:
      "Steel-blue one-offs duplicate accent behavior and can map to the global accent token.",
    evidence: [
      "`#7ba3d4` appears in localized account/profile styling but overlaps with existing accent-blue usage.",
      "No strong semantic distinction beyond visual preference.",
    ],
    sampleFiles: ["src/components/account/SubscriptionTab.tsx", "src/pages/CreatorProfile.tsx"],
  },
  {
    id: "color-plan-015",
    decision: "deprecate",
    sourceColors: ["#93c5fd"],
    targetColor: "#3b82f6",
    semanticRole: "light-blue variant accent",
    scope: "page-specific",
    priority: "later",
    rationale:
      "Light-blue accents duplicate existing accent family and add unnecessary palette breadth.",
    evidence: [
      "`#93c5fd` appears as a low-frequency variant while core accent blue already exists.",
      "Can be represented via opacity/tint from existing accent tokens.",
    ],
    sampleFiles: ["src/components/admin/styleguide/StyleGuideTool.tsx"],
  },
  {
    id: "color-plan-016",
    decision: "deprecate",
    sourceColors: ["#facc15", "#fbbf24"],
    targetColor: "#f59e0b",
    semanticRole: "warning/attention amber variants",
    scope: "mixed",
    priority: "later",
    rationale:
      "Multiple amber variants can be simplified to one warning token plus opacity variants.",
    evidence: [
      "Amber variants are currently split across badges and accents with overlapping intent.",
      "Core warning amber `#f59e0b` is already widely present in controls and status states.",
    ],
    sampleFiles: ["src/components/admin/styleguide/StyleGuideTool.tsx", "src/components/chronicle/ChatInterfaceTab.tsx"],
  },
];

export const uiAuditInteractionStateMatrix: UiAuditInteractionStateMatrixRow[] = [
  {
    id: "ism-001",
    pattern: "shadcn Button primitive",
    page: "Shared primitives",
    component: "ui/button.tsx",
    files: ["src/components/ui/button.tsx"],
    stateCoverage: {
      rest: "covered",
      hover: "covered",
      focusVisible: "covered",
      active: "partial",
      disabled: "covered",
      loading: "not-applicable",
    },
    keyboardParity: "covered",
    semantics: "semantic",
    severity: "low",
    confidence: "confirmed",
    systemic: true,
    evidence: [
      "Base variant includes explicit `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` (`src/components/ui/button.tsx:8`).",
      "Disabled behavior is standardized via `disabled:pointer-events-none disabled:opacity-50` (`src/components/ui/button.tsx:8`).",
      "Semantic button rendering is default (`src/components/ui/button.tsx:41-43`).",
    ],
    currentState:
      "This primitive has a mostly complete interaction-state contract and acts as the strongest baseline in the repo.",
    recommendation:
      "Use this as the reference contract when normalizing page-local and Chronicle-specific button patterns.",
  },
  {
    id: "ism-002",
    pattern: "Chronicle Button primitive",
    page: "Shared primitives",
    component: "chronicle/UI.tsx Button",
    files: ["src/components/chronicle/UI.tsx"],
    stateCoverage: {
      rest: "covered",
      hover: "covered",
      focusVisible: "missing",
      active: "covered",
      disabled: "partial",
      loading: "not-applicable",
    },
    keyboardParity: "covered",
    semantics: "semantic",
    severity: "medium",
    confidence: "confirmed",
    systemic: true,
    evidence: [
      "Chronicle button base includes rest/hover/active styles but no explicit `focus-visible` state (`src/components/chronicle/UI.tsx:12-21`).",
      "Disabled treatment is limited to `opacity-50 pointer-events-none` (`src/components/chronicle/UI.tsx:22`).",
      "Primitive renders a semantic `<button>` (`src/components/chronicle/UI.tsx:24-32`).",
    ],
    currentState:
      "The primitive is semantically correct but its state model is less complete than the shadcn primitive.",
    recommendation:
      "Add a standardized focus-visible token and align disabled semantics with a shared state contract.",
  },
  {
    id: "ism-003",
    pattern: "App shell sidebar nav item",
    page: "App Shell",
    route: "/",
    component: "SidebarItem",
    files: ["src/pages/Index.tsx"],
    stateCoverage: {
      rest: "covered",
      hover: "covered",
      focusVisible: "missing",
      active: "covered",
      disabled: "not-applicable",
      loading: "not-applicable",
    },
    keyboardParity: "covered",
    semantics: "semantic",
    severity: "medium",
    confidence: "confirmed",
    systemic: false,
    evidence: [
      "Sidebar item uses a semantic `<button>` with active and hover classes (`src/pages/Index.tsx:86-90`).",
      "No explicit focus-visible ring/outline classes are present in the button class list (`src/pages/Index.tsx:89-90`).",
    ],
    currentState:
      "Pointer states are clearly represented, but keyboard focus styling is not explicitly modeled.",
    recommendation:
      "Apply the same focus-visible token used in shared button primitives to shell navigation controls.",
  },
  {
    id: "ism-004",
    pattern: "My Stories card interactions",
    page: "My Stories",
    component: "StoryHub story card",
    files: ["src/components/chronicle/StoryHub.tsx"],
    stateCoverage: {
      rest: "covered",
      hover: "covered",
      focusVisible: "missing",
      active: "missing",
      disabled: "not-applicable",
      loading: "not-applicable",
    },
    keyboardParity: "missing",
    semantics: "non-semantic",
    severity: "critical",
    confidence: "confirmed",
    systemic: true,
    evidence: [
      "Card activation is bound to a clickable `<div>` (`src/components/chronicle/StoryHub.tsx:57`).",
      "Primary card actions are hover-revealed with `opacity-0 group-hover:opacity-100` (`src/components/chronicle/StoryHub.tsx:118-139`).",
      "No focus-visible or focus-within equivalent is defined for action reveal in this card pattern.",
    ],
    currentState:
      "The pattern is pointer-optimized and hides key actions until hover, with no keyboard-first equivalent state path.",
    recommendation:
      "Convert card activation to semantic controls and add focus-within parity for all hover-revealed actions.",
  },
  {
    id: "ism-005",
    pattern: "Character library card interactions",
    page: "Character Library",
    component: "CharactersTab card grid",
    files: ["src/components/chronicle/CharactersTab.tsx"],
    stateCoverage: {
      rest: "covered",
      hover: "covered",
      focusVisible: "missing",
      active: "missing",
      disabled: "not-applicable",
      loading: "not-applicable",
    },
    keyboardParity: "missing",
    semantics: "non-semantic",
    severity: "critical",
    confidence: "confirmed",
    systemic: true,
    evidence: [
      "Card selection is implemented on a clickable `<div>` (`src/components/chronicle/CharactersTab.tsx:582`).",
      "Delete control appears only on hover via `opacity-0 group-hover:opacity-100` (`src/components/chronicle/CharactersTab.tsx:620-624`).",
      "No focus-within reveal or keyboard-equivalent activation state exists on the card wrapper.",
    ],
    currentState:
      "The card interaction model depends on hover and lacks a complete keyboard-operable state sequence.",
    recommendation:
      "Use semantic button/link wrappers for card activation and expose destructive controls for keyboard/touch parity.",
  },
  {
    id: "ism-006",
    pattern: "Scene gallery card interactions",
    page: "Story Builder",
    component: "WorldTab scene cards",
    files: ["src/components/chronicle/WorldTab.tsx"],
    stateCoverage: {
      rest: "covered",
      hover: "covered",
      focusVisible: "missing",
      active: "missing",
      disabled: "not-applicable",
      loading: "not-applicable",
    },
    keyboardParity: "missing",
    semantics: "non-semantic",
    severity: "critical",
    confidence: "confirmed",
    systemic: true,
    evidence: [
      "Scene edit/open is attached to clickable `<div ... onClick>` wrapper (`src/components/chronicle/WorldTab.tsx:1120`).",
      "Delete and starting-scene actions are hover-gated (`src/components/chronicle/WorldTab.tsx:1144-1165`).",
      "No focus-visible treatment is defined on the interactive card wrapper.",
    ],
    currentState:
      "Interaction states are heavily hover-dependent with non-semantic card activation.",
    recommendation:
      "Move card activation to semantic controls and implement focus/keyboard-equivalent state visibility.",
  },
  {
    id: "ism-007",
    pattern: "Chat message action cluster",
    page: "Chat Interface",
    component: "Message bubble top-right actions",
    files: ["src/components/chronicle/ChatInterfaceTab.tsx"],
    stateCoverage: {
      rest: "partial",
      hover: "covered",
      focusVisible: "missing",
      active: "partial",
      disabled: "covered",
      loading: "partial",
    },
    keyboardParity: "partial",
    semantics: "mixed",
    severity: "high",
    confidence: "confirmed",
    systemic: false,
    evidence: [
      "Action cluster is hidden by default and only revealed on hover (`opacity-0 group-hover:opacity-100`) (`src/components/chronicle/ChatInterfaceTab.tsx:3558-3560`).",
      "Action buttons include disabled styles (`disabled:opacity-30`) but no explicit focus-visible class (`src/components/chronicle/ChatInterfaceTab.tsx:3587-3600`).",
      "Regenerate loading is icon-only spin state without unified text/announcement pattern (`src/components/chronicle/ChatInterfaceTab.tsx:3602`).",
    ],
    currentState:
      "State behavior exists but is uneven: hover and disabled are modeled, focus-visible and loading semantics are inconsistent.",
    recommendation:
      "Add focus-visible styling, expose actions via focus-within, and standardize loading semantics for icon actions.",
  },
  {
    id: "ism-008",
    pattern: "Chat composer quick-action bar",
    page: "Chat Interface",
    component: "Settings / Generate Image / Send buttons",
    files: ["src/components/chronicle/ChatInterfaceTab.tsx"],
    stateCoverage: {
      rest: "covered",
      hover: "covered",
      focusVisible: "missing",
      active: "covered",
      disabled: "covered",
      loading: "partial",
    },
    keyboardParity: "covered",
    semantics: "semantic",
    severity: "medium",
    confidence: "confirmed",
    systemic: false,
    evidence: [
      "Quick-action buttons include hover, active, and disabled states (`src/components/chronicle/ChatInterfaceTab.tsx:3871-3902`).",
      "No explicit focus-visible classes are present on these buttons (`src/components/chronicle/ChatInterfaceTab.tsx:3873-3901`).",
      "Loading feedback is inconsistent: Generate uses spinner + label while Send uses `...` (`src/components/chronicle/ChatInterfaceTab.tsx:3885-3893`, `3903`).",
    ],
    currentState:
      "This is a semantically correct control cluster with incomplete focus/loading consistency.",
    recommendation:
      "Adopt a shared focus-visible style and a single loading-text/icon convention for async composer actions.",
  },
  {
    id: "ism-009",
    pattern: "Day/time steppers and mode toggles",
    page: "Story Builder",
    component: "WorldTab starting day/time controls",
    files: ["src/components/chronicle/WorldTab.tsx"],
    stateCoverage: {
      rest: "covered",
      hover: "covered",
      focusVisible: "missing",
      active: "covered",
      disabled: "partial",
      loading: "not-applicable",
    },
    keyboardParity: "partial",
    semantics: "semantic",
    severity: "medium",
    confidence: "likely",
    systemic: false,
    evidence: [
      "Stepper and toggle controls rely on hover/active classes but omit explicit focus-visible styling (`src/components/chronicle/WorldTab.tsx:951-990`, `1019-1038`).",
      "Only one stepper control shows an explicit disabled class in this group (`src/components/chronicle/WorldTab.tsx:951-953`).",
      "Time-of-day icon buttons expose `title` but no explicit accessible name/state attribute contract (`src/components/chronicle/WorldTab.tsx:981-993`).",
    ],
    currentState:
      "The control group has clear visual state changes for pointer use, but keyboard and assistive-tech state clarity is less explicit.",
    recommendation:
      "Add focus-visible treatment and consistent accessible labeling/state attributes for icon toggles and steppers.",
  },
  {
    id: "ism-010",
    pattern: "AI media action button suites",
    page: "Story Builder / Character editor",
    component: "Avatar/Cover/Scene action button groups",
    files: [
      "src/components/chronicle/AvatarActionButtons.tsx",
      "src/components/chronicle/CoverImageActionButtons.tsx",
      "src/components/chronicle/SceneGalleryActionButtons.tsx",
    ],
    stateCoverage: {
      rest: "covered",
      hover: "covered",
      focusVisible: "covered",
      active: "covered",
      disabled: "covered",
      loading: "covered",
    },
    keyboardParity: "covered",
    semantics: "semantic",
    severity: "low",
    confidence: "confirmed",
    systemic: true,
    evidence: [
      "Upload actions include hover/active/disabled/focus-visible states (`AvatarActionButtons.tsx:41-47`, same pattern mirrored in Cover/Scene action files).",
      "AI generate buttons include explicit focus-visible ring, disabled state, and text-based loading label (`AvatarActionButtons.tsx:79-85`, `174-176`).",
    ],
    currentState:
      "This shared action-suite family is one of the most complete and consistent interaction-state implementations in the app.",
    recommendation:
      "Use this family as a template for normalizing other async action clusters.",
  },
  {
    id: "ism-011",
    pattern: "Conversations list actions",
    page: "Chat History",
    component: "ConversationsTab session rows",
    files: ["src/components/chronicle/ConversationsTab.tsx"],
    stateCoverage: {
      rest: "covered",
      hover: "covered",
      focusVisible: "missing",
      active: "covered",
      disabled: "not-applicable",
      loading: "not-applicable",
    },
    keyboardParity: "covered",
    semantics: "semantic",
    severity: "medium",
    confidence: "confirmed",
    systemic: false,
    evidence: [
      "Session controls are semantic buttons for resume/delete/load-more actions (`src/components/chronicle/ConversationsTab.tsx:60-63`, `104-110`, `142-145`).",
      "Hover states are defined, but explicit focus-visible styling is absent in button class lists (`src/components/chronicle/ConversationsTab.tsx:62`, `109`, `144`).",
    ],
    currentState:
      "Core actions are keyboard-reachable, but focus visibility consistency is weaker than hover visibility.",
    recommendation:
      "Add shared focus-visible styling to session action controls to match state parity expectations.",
  },
];

export const uiAuditComponentVariantDriftMatrix: UiAuditComponentVariantDriftItem[] = [
  {
    id: "cvm-001",
    family: "button",
    variantName: "Shadow-surface action button recipe",
    classification: "near-duplicate",
    severity: "high",
    confidence: "confirmed",
    files: [
      "src/pages/Index.tsx",
      "src/components/chronicle/ChatInterfaceTab.tsx",
      "src/components/chronicle/StoryDetailModal.tsx",
      "src/components/chronicle/ConversationsTab.tsx",
      "src/components/chronicle/CharacterEditModal.tsx",
    ],
    evidence: [
      "Nearly identical utility stack is repeated in many places: `rounded-xl`, `h-10`, `text-[10px]`, uppercase tracking, `shadow-[0_10px_30px_rgba(0,0,0,0.35)]`.",
      "High-density duplication appears in app shell actions (`src/pages/Index.tsx:1915`, `1946`, `1994`, `2001`, `2025`, `2180`, `2187`, `2194`).",
      "Same recipe appears in chat composer actions (`src/components/chronicle/ChatInterfaceTab.tsx:3873-3901`) and modal actions (`src/components/chronicle/StoryDetailModal.tsx:323-364`).",
    ],
    currentState:
      "A de facto shared button variant exists, but it is copied inline across many files rather than encoded as a single variant API.",
    problem:
      "Copy-paste variants drift over time and make state/spacing updates expensive and error-prone.",
    recommendation:
      "Create one explicit shared variant (or small variant family) and map repeated inline recipes to that primitive.",
    estimatedReuseCount: 30,
    designSystemCandidate: true,
    fixLevel: "shared-component",
  },
  {
    id: "cvm-002",
    family: "button",
    variantName: "AI media action suite (Upload + AI Generate)",
    classification: "near-duplicate",
    severity: "medium",
    confidence: "confirmed",
    files: [
      "src/components/chronicle/AvatarActionButtons.tsx",
      "src/components/chronicle/CoverImageActionButtons.tsx",
      "src/components/chronicle/SceneGalleryActionButtons.tsx",
    ],
    evidence: [
      "All three files define the same two-button structure, including dropdown upload trigger and layered AI button visuals (`AvatarActionButtons.tsx:34-179`, `CoverImageActionButtons.tsx:34-179`, `SceneGalleryActionButtons.tsx:34-179`).",
      "Shared focus/disabled/loading semantics are repeated manually across all three implementations.",
    ],
    currentState:
      "The pattern is consistent but maintained in separate components with near-identical markup and class strings.",
    problem:
      "Behavioral updates require touching three files, increasing maintenance overhead and regression risk.",
    recommendation:
      "Extract this suite into one configurable shared component with context-specific labels/handlers.",
    estimatedReuseCount: 3,
    designSystemCandidate: true,
    fixLevel: "shared-component",
  },
  {
    id: "cvm-003",
    family: "card",
    variantName: "2:3 media card shell with hover lift and dark overlay",
    classification: "conflicted",
    severity: "high",
    confidence: "confirmed",
    files: [
      "src/components/chronicle/StoryHub.tsx",
      "src/components/chronicle/GalleryStoryCard.tsx",
      "src/components/chronicle/CharactersTab.tsx",
    ],
    evidence: [
      "Story and gallery cards share almost identical shell patterns (`group-hover:-translate-y-3`, `aspect-[2/3]`, `rounded-[2rem]`, `bg-black/40` overlay) (`StoryHub.tsx:57-107`, `GalleryStoryCard.tsx:62-84`).",
      "Characters card pattern uses the same shell grammar with small shadow/state drift (`CharactersTab.tsx:582-601`).",
      "Similar visuals are implemented separately instead of one reusable card family.",
    ],
    currentState:
      "The same card language appears in multiple files with slight differences in shadows, badges, and action reveal behavior.",
    problem:
      "Parallel implementations make it hard to keep interaction/accessibility and visual polish aligned.",
    recommendation:
      "Define a shared media-card base with variant slots for badges, stats, and actions.",
    estimatedReuseCount: 3,
    designSystemCandidate: true,
    fixLevel: "shared-component",
  },
  {
    id: "cvm-004",
    family: "panel",
    variantName: "Builder dark panel shell",
    classification: "near-duplicate",
    severity: "medium",
    confidence: "confirmed",
    files: [
      "src/components/chronicle/WorldTab.tsx",
      "src/components/chronicle/CharactersTab.tsx",
    ],
    evidence: [
      "Repeated builder panel shell in WorldTab: `bg-[#2a2a2f] rounded-[24px] border border-[#4a5f7f] shadow-[0_12px_32px_-2px...]` (`WorldTab.tsx:509`, `638`, `888`, `1072`, `1193`, `1260`).",
      "Same panel shell appears in CharactersTab sections (`CharactersTab.tsx:70`, `1206`).",
    ],
    currentState:
      "A stable panel pattern exists, but it is duplicated at each use site without a shared shell primitive.",
    problem:
      "Repeated structural classes increase the chance of spacing/radius drift and slow down global layout updates.",
    recommendation:
      "Extract a shared builder panel wrapper and reuse it across WorldTab/CharactersTab sections.",
    estimatedReuseCount: 8,
    designSystemCandidate: true,
    fixLevel: "shared-component",
  },
  {
    id: "cvm-005",
    family: "modal",
    variantName: "Dialog container and overlay architecture",
    classification: "conflicted",
    severity: "high",
    confidence: "confirmed",
    files: [
      "src/components/ui/dialog.tsx",
      "src/components/chronicle/StoryDetailModal.tsx",
      "src/components/chronicle/ReviewModal.tsx",
      "src/components/chronicle/SceneTagEditorModal.tsx",
      "src/components/chronicle/CharacterPicker.tsx",
      "src/components/chronicle/ImageLibraryTab.tsx",
    ],
    evidence: [
      "Base dialog primitive provides one standard overlay/content pipeline (`src/components/ui/dialog.tsx:22-50`).",
      "StoryDetail and Review bypass default content pipeline with custom portal wrappers (`StoryDetailModal.tsx:232-234`, `ReviewModal.tsx:94-96`).",
      "Other flows use custom fixed overlays outside dialog primitives (`SceneTagEditorModal.tsx:57-59`, `CharacterPicker.tsx:37`, `ImageLibraryTab.tsx:709`).",
    ],
    currentState:
      "Modal visuals and behaviors are implemented through multiple container architectures rather than one consistent stack.",
    problem:
      "Variant fragmentation makes interaction consistency, a11y behavior, and theming governance harder to enforce.",
    recommendation:
      "Standardize on a small approved modal architecture set and classify each existing modal against it.",
    estimatedReuseCount: 12,
    designSystemCandidate: true,
    fixLevel: "design-system",
  },
  {
    id: "cvm-006",
    family: "input",
    variantName: "Text field / textarea styling families",
    classification: "conflicted",
    severity: "medium",
    confidence: "likely",
    files: [
      "src/components/chronicle/UI.tsx",
      "src/components/chronicle/CharacterEditModal.tsx",
      "src/components/auth/AuthModal.tsx",
      "src/components/account/PublicProfileTab.tsx",
    ],
    evidence: [
      "Chronicle primitive input uses light surface tokens (`bg-ghost-white border-slate-200`) (`src/components/chronicle/UI.tsx:87`, `134`).",
      "CharacterEdit inputs use dark `bg-zinc-900/50 border-ghost-white` plus blue focus styles (`src/components/chronicle/CharacterEditModal.tsx:193`, `1794`).",
      "Auth modal introduces a separate translucent slate field style (`src/components/auth/AuthModal.tsx:179-216`).",
      "Public profile form uses another page-local field recipe (`src/components/account/PublicProfileTab.tsx:366`, `379`).",
    ],
    currentState:
      "Form controls are implemented with multiple visual/interaction recipes depending on page context.",
    problem:
      "Users see inconsistent field affordances and focus behavior across account/auth/builder flows.",
    recommendation:
      "Define a constrained input variant set (dark default, light default, dense compact) and migrate page-local one-offs.",
    estimatedReuseCount: 20,
    designSystemCandidate: true,
    fixLevel: "design-system",
  },
];

export const uiAuditFindings: UiAuditFinding[] = [
  {
    id: "uia-001",
    title: "Hardcoded color proliferation creates systemic token drift",
    severity: "high",
    confidence: "confirmed",
    category: "token-drift",
    page: "Global / multi-page",
    route: "/",
    component: "Theme tokens and Chronicle surfaces",
    files: [
      "src/index.css",
      "src/components/chronicle/WorldTab.tsx",
      "src/components/chronicle/StoryDetailModal.tsx",
      "src/components/account/PublicProfileTab.tsx",
    ],
    evidence: [
      "Code scan shows 325 occurrences of `#4a5f7f` and 115 of `#2a2a2f` as hardcoded values instead of semantic tokens.",
      "`docs/guides/ui-styling-theme-reference.md` states hardcoded hex values should ideally become tokens.",
      "`src/components/admin/styleguide/StyleGuideTool.tsx:5012-5017` flags surface color proliferation.",
    ],
    currentState:
      "Tokenized HSL variables exist, but many major surfaces still use repeated literal color values and page-local color decisions.",
    problem:
      "When color intent is encoded as literals, semantic theming and global adjustments become expensive and error-prone.",
    whyItMatters:
      "Color drift accumulates quickly across new features and weakens the design system's ability to stay coherent.",
    userImpact:
      "Users experience inconsistent contrast, emphasis, and visual meaning between similar components.",
    recommendation:
      "Promote repeated literals into semantic tokens and migrate high-frequency literals by class-of-use (surface, border, interactive states).",
    sourceOfTruth: "multi-source",
    fixLevel: "design-system",
    designSystemLevel: true,
    implementationDifficulty: "large",
    batchable: true,
    status: "open",
  },
  {
    id: "uia-002",
    title: "Border radius scale drift across cards, panels, and dialogs",
    severity: "high",
    confidence: "confirmed",
    category: "token-drift",
    page: "Global / multi-page",
    files: [
      "src/components/chronicle/StoryHub.tsx",
      "src/components/chronicle/CharactersTab.tsx",
      "src/components/chronicle/StoryDetailModal.tsx",
      "src/components/admin/styleguide/StyleGuideTool.tsx",
    ],
    evidence: [
      "Usage scan found `rounded-[10px]` (28), `rounded-[2rem]` (23), `rounded-[24px]` (23), and `rounded-[32px]` (6).",
      "`src/components/admin/styleguide/StyleGuideTool.tsx:5025-5030` explicitly documents radius variance.",
      "`src/index.css` defines a canonical `--radius` token, but many surfaces bypass it.",
    ],
    currentState:
      "Several radius scales are mixed without clear semantic intent for component families.",
    problem:
      "Near-duplicate radius values create visual noise and reduce trust in shared component contracts.",
    whyItMatters:
      "Radius inconsistency is highly noticeable in card-heavy interfaces and weakens perceived product quality.",
    userImpact:
      "The interface feels stitched together rather than system-driven, especially when moving between tabs.",
    recommendation:
      "Define a constrained radius scale by component role and map each outlier to an approved token.",
    sourceOfTruth: "multi-source",
    fixLevel: "design-system",
    designSystemLevel: true,
    implementationDifficulty: "medium",
    batchable: true,
    status: "open",
  },
  {
    id: "uia-003",
    title: "Micro typography is overused below comfortable reading size",
    severity: "high",
    confidence: "confirmed",
    category: "typography",
    page: "Global / multi-page",
    files: [
      "src/components/chronicle/WorldTab.tsx",
      "src/components/chronicle/CharactersTab.tsx",
      "src/components/chronicle/StoryDetailModal.tsx",
      "src/components/chronicle/UI.tsx",
    ],
    evidence: [
      "Typography scan found `text-[10px]` 262 times, `text-[9px]` 68 times, `text-[8px]` 30 times, and `text-[7px]` 38 times.",
      "Examples include status and metadata labels (`WorldTab`, `CharactersTab`, `StoryDetailModal`) that remain critical for interpretation.",
      "`src/components/admin/styleguide/StyleGuideTool.tsx:5032-5036` acknowledges button and typography size variance.",
    ],
    currentState:
      "Small caps and micro text are used for many labels, badges, and action contexts throughout core flows.",
    problem:
      "Overly small text harms readability and can fail practical accessibility expectations at normal viewing distance.",
    whyItMatters:
      "The handbook emphasizes readability and cognitive load reduction; tiny text increases effort and scanning errors.",
    userImpact:
      "Users, especially on laptops/tablets, can miss key states and controls or misread metadata.",
    recommendation:
      "Lift functional metadata and controls to a minimum readable size baseline, reserving micro text for truly secondary decoration.",
    sourceOfTruth: "multi-source",
    fixLevel: "design-system",
    designSystemLevel: true,
    implementationDifficulty: "medium",
    batchable: true,
    status: "open",
  },
  {
    id: "uia-004",
    title: "Clickable cards are implemented as non-semantic div elements",
    severity: "critical",
    confidence: "confirmed",
    category: "accessibility",
    page: "Story cards and scene grids",
    component: "StoryHub / CharactersTab / WorldTab",
    files: [
      "src/components/chronicle/StoryHub.tsx",
      "src/components/chronicle/CharactersTab.tsx",
      "src/components/chronicle/WorldTab.tsx",
    ],
    evidence: [
      "`StoryHub`: `src/components/chronicle/StoryHub.tsx:57` uses `<div ... onClick>` for card open.",
      "`CharactersTab`: `src/components/chronicle/CharactersTab.tsx:582` uses `<div ... onClick>` for card selection.",
      "`WorldTab`: `src/components/chronicle/WorldTab.tsx:1120` uses `<div ... onClick>` for scene edit entry.",
    ],
    currentState:
      "Core navigation actions rely on mouse click handlers on plain container elements.",
    problem:
      "These controls are not keyboard-operable by default and do not convey button/link semantics to assistive tech.",
    whyItMatters:
      "WCAG operability requirements and ARIA first principles require semantic interactive elements for primary actions.",
    userImpact:
      "Keyboard and assistive-technology users can be blocked from core flows like opening stories or editing scenes.",
    recommendation:
      "Convert interactive containers to semantic `<button>` or `<a>` patterns (or fully accessible custom widgets with keyboard handlers).",
    sourceOfTruth: "multi-source",
    fixLevel: "accessibility",
    designSystemLevel: false,
    implementationDifficulty: "medium",
    batchable: true,
    status: "open",
  },
  {
    id: "uia-005",
    title: "Icon-only controls frequently omit accessible names",
    severity: "high",
    confidence: "confirmed",
    category: "accessibility",
    page: "Chat, filters, auth, account",
    files: [
      "src/components/chronicle/ChatInterfaceTab.tsx",
      "src/components/chronicle/GalleryCategorySidebar.tsx",
      "src/components/auth/AuthModal.tsx",
      "src/components/account/AccountSettingsTab.tsx",
    ],
    evidence: [
      "Unlabeled kebab button: `src/components/chronicle/ChatInterfaceTab.tsx:3232-3234`.",
      "Unlabeled settings icon button: `src/components/chronicle/ChatInterfaceTab.tsx:3310-3312`.",
      "Unlabeled sidebar close icon: `src/components/chronicle/GalleryCategorySidebar.tsx:187-192`.",
      "Unlabeled password visibility toggles: `src/components/auth/AuthModal.tsx:201-207` and `224-230`.",
      "Account password visibility toggle uses icon only: `src/components/account/AccountSettingsTab.tsx` eye button in password field.",
    ],
    currentState:
      "Several icon-only buttons rely on visual context or `title`, without explicit accessible names.",
    problem:
      "Screen readers may announce ambiguous controls, reducing usability and confidence for non-visual navigation.",
    whyItMatters:
      "The handbook requires robust semantic labeling for controls; title-only metadata is not a dependable accessible name strategy.",
    userImpact:
      "Assistive technology users may not know what action each icon button performs.",
    recommendation:
      "Add explicit `aria-label` or hidden text labels to all icon-only controls, aligned to action intent.",
    sourceOfTruth: "research-brief",
    fixLevel: "accessibility",
    designSystemLevel: false,
    implementationDifficulty: "small",
    batchable: true,
    status: "open",
  },
  {
    id: "uia-006",
    title: "Hover-only action affordances hide essential controls on non-hover input modes",
    severity: "high",
    confidence: "confirmed",
    category: "interaction",
    page: "Story and character cards; chat messages",
    files: [
      "src/components/chronicle/StoryHub.tsx",
      "src/components/chronicle/CharactersTab.tsx",
      "src/components/chronicle/WorldTab.tsx",
      "src/components/chronicle/ChatInterfaceTab.tsx",
    ],
    evidence: [
      "Story card actions appear with `opacity-0 group-hover:opacity-100`: `src/components/chronicle/StoryHub.tsx:118`.",
      "Character delete action appears only on hover: `src/components/chronicle/CharactersTab.tsx:620-624`.",
      "Scene actions hide until hover: `src/components/chronicle/WorldTab.tsx:1144-1165`.",
      "Chat message actions hidden by default: `src/components/chronicle/ChatInterfaceTab.tsx:3558-3560`.",
    ],
    currentState:
      "Many secondary but important actions are visually unavailable unless pointer hover is present.",
    problem:
      "Hover-gated controls are weak for touch interfaces and keyboard users unless equivalent focus-visible behavior is added.",
    whyItMatters:
      "The handbook flags hover-only interaction as a common operability failure in responsive UI.",
    userImpact:
      "Users on touch devices may not discover edit/delete/regenerate actions consistently.",
    recommendation:
      "Expose controls via always-visible compact affordances or add focus-within and explicit menu entry points for non-hover input modes.",
    sourceOfTruth: "multi-source",
    fixLevel: "responsive",
    designSystemLevel: false,
    implementationDifficulty: "medium",
    batchable: true,
    status: "open",
  },
  {
    id: "uia-007",
    title: "Custom modal/lightbox implementations bypass dialog semantics and focus management",
    severity: "critical",
    confidence: "confirmed",
    category: "accessibility",
    page: "Image and scene editors",
    files: [
      "src/components/chronicle/SceneTagEditorModal.tsx",
      "src/components/chronicle/ImageLibraryTab.tsx",
    ],
    evidence: [
      "SceneTagEditor is custom fixed overlay without Radix dialog primitives: `src/components/chronicle/SceneTagEditorModal.tsx:57-63`.",
      "ImageLibrary lightbox is a click-dismiss fixed overlay with no dialog semantics: `src/components/chronicle/ImageLibraryTab.tsx:709-717`.",
      "No explicit focus trap or dialog title/description association in either implementation.",
    ],
    currentState:
      "At least two high-use overlays are custom container layers rather than accessible dialog components.",
    problem:
      "Without semantic dialog roles and focus management, keyboard and screen-reader behavior can break.",
    whyItMatters:
      "WCAG keyboard and focus criteria require predictable focus containment and announcement for modal contexts.",
    userImpact:
      "Users can lose navigation context or interact with background UI unintentionally while overlays are open.",
    recommendation:
      "Migrate these overlays to shared dialog primitives with semantic titles, close controls, and deterministic focus handling.",
    sourceOfTruth: "multi-source",
    fixLevel: "accessibility",
    designSystemLevel: true,
    implementationDifficulty: "medium",
    batchable: true,
    status: "open",
  },
  {
    id: "uia-008",
    title: "Radix Dialog is mounted but DialogContent is bypassed in key modals",
    severity: "high",
    confidence: "likely",
    category: "accessibility",
    page: "Scenario detail and review modals",
    files: [
      "src/components/chronicle/StoryDetailModal.tsx",
      "src/components/chronicle/ReviewModal.tsx",
      "src/components/ui/dialog.tsx",
    ],
    evidence: [
      "StoryDetail uses `DialogPortal` + custom fixed wrapper instead of `DialogContent`: `src/components/chronicle/StoryDetailModal.tsx:231-237`.",
      "ReviewModal uses the same pattern: `src/components/chronicle/ReviewModal.tsx:93-97`.",
      "`src/components/ui/dialog.tsx` defines semantics/focus behavior in `DialogContent` but these flows do not use it.",
    ],
    currentState:
      "Some modal flows partially use Radix but skip the primitive responsible for standard semantics and focus mechanics.",
    problem:
      "This pattern can silently weaken accessibility guarantees while appearing to use compliant infrastructure.",
    whyItMatters:
      "Accessibility regressions become hard to detect when modal architecture is inconsistent across screens.",
    userImpact:
      "Users may encounter inconsistent keyboard traversal and announcement behavior between modal types.",
    recommendation:
      "Standardize modal content onto `DialogContent` (or replicate equivalent semantics intentionally and explicitly).",
    sourceOfTruth: "multi-source",
    fixLevel: "shared-component",
    designSystemLevel: true,
    implementationDifficulty: "medium",
    batchable: true,
    status: "open",
  },
  {
    id: "uia-009",
    title: "Several interactive controls likely fall below WCAG 2.5.8 target-size minimum",
    severity: "high",
    confidence: "confirmed",
    category: "accessibility",
    page: "Chat time controls",
    component: "ChatInterfaceTab",
    files: ["src/components/chronicle/ChatInterfaceTab.tsx"],
    evidence: [
      "Pause/resume control uses `p-0.5` with 14px icon (`w-3.5 h-3.5`): `src/components/chronicle/ChatInterfaceTab.tsx:3357-3364`.",
      "Day stepper controls use `px-1.5 py-0.5` with 12px icons: `src/components/chronicle/ChatInterfaceTab.tsx:3381-3393`.",
      "Handbook section for WCAG 2.5.8 requires minimum 24x24 CSS pixel targets.",
    ],
    currentState:
      "Fine-grained time controls are compact and visually fit, but likely undersized for minimum touch/keyboard comfort.",
    problem:
      "Small targets increase motor error rates and fail modern accessibility baseline expectations.",
    whyItMatters:
      "Target size directly affects usability for users with limited dexterity and on touch devices.",
    userImpact:
      "Users can mis-tap or avoid controls entirely, reducing confidence in time-management features.",
    recommendation:
      "Increase control hit area to at least 24x24 (preferably 44+) while keeping visual glyph sizes compact if needed.",
    sourceOfTruth: "research-brief",
    fixLevel: "accessibility",
    designSystemLevel: false,
    implementationDifficulty: "small",
    batchable: true,
    status: "open",
  },
  {
    id: "uia-010",
    title: "Focus indicators are present but often low-contrast and visually subtle on dark surfaces",
    severity: "medium",
    confidence: "likely",
    category: "accessibility",
    page: "Forms and controls across builder/chat",
    files: [
      "src/components/chronicle/WorldTab.tsx",
      "src/components/chronicle/CharactersTab.tsx",
      "src/components/chronicle/StoryGoalsSection.tsx",
      "src/components/chronicle/ChatInterfaceTab.tsx",
    ],
    evidence: [
      "Frequent focus styles use low-opacity rings like `focus:ring-blue-500/20` and muted border changes.",
      "Many controls also apply `focus:outline-none` while relying on subtle custom rings.",
      "Handbook cites focus visibility and focus appearance as high-priority accessibility requirements.",
    ],
    currentState:
      "Custom focus rings exist, but many are low-contrast against dark backgrounds and dense surfaces.",
    problem:
      "If focus is not clearly visible, keyboard users can lose context in long forms and nested panels.",
    whyItMatters:
      "Focus visibility is foundational for operable UIs and required for compliance-oriented accessibility practice.",
    userImpact:
      "Keyboard navigation through complex builders becomes error-prone and cognitively expensive.",
    recommendation:
      "Define and apply a stronger, consistent focus token set for dark surfaces, with visible contrast at all control sizes.",
    sourceOfTruth: "multi-source",
    fixLevel: "design-system",
    designSystemLevel: true,
    implementationDifficulty: "medium",
    batchable: true,
    status: "open",
  },
  {
    id: "uia-011",
    title: "Long-form button styling is duplicated inline instead of using shared primitives",
    severity: "medium",
    confidence: "confirmed",
    category: "implementation",
    page: "App shell actions",
    route: "/",
    component: "Index header/action rail",
    files: ["src/pages/Index.tsx", "src/components/chronicle/UI.tsx"],
    evidence: [
      "Repeated class block appears in many action buttons (`src/pages/Index.tsx:1915`, `1946`, `1994`, `2001`, `2025`, `2180`, `2187`, `2194`).",
      "A shared Chronicle `Button` primitive exists but is not used for these repeated variants (`src/components/chronicle/UI.tsx`).",
    ],
    currentState:
      "Large style strings are copy-pasted across top-bar actions with only minor variation.",
    problem:
      "Copy-paste styling increases maintenance cost and introduces micro-drift when one instance is updated but others are missed.",
    whyItMatters:
      "Action controls are high-frequency and should be governed by shared component variants.",
    userImpact:
      "Inconsistent interaction and visual behavior can emerge over time across similar actions.",
    recommendation:
      "Promote these repeated patterns into explicit shared variants and map existing actions to the variant API.",
    sourceOfTruth: "code-observation",
    fixLevel: "shared-component",
    designSystemLevel: true,
    implementationDifficulty: "small",
    batchable: true,
    status: "open",
  },
  {
    id: "uia-012",
    title: "Published-work card layout is duplicated across multiple pages without a single source component",
    severity: "medium",
    confidence: "confirmed",
    category: "component",
    page: "Profile and story surfaces",
    files: [
      "src/components/chronicle/StoryHub.tsx",
      "src/pages/CreatorProfile.tsx",
      "src/components/account/PublicProfileTab.tsx",
      "src/components/chronicle/GalleryStoryCard.tsx",
    ],
    evidence: [
      "Very similar card structures exist independently in `StoryHub`, `CreatorProfile`, and `PublicProfileTab` with near-identical overlays/badges/text stacks.",
      "`CreatorProfile` comments explicitly state it mirrors `PublicProfileTab` while keeping separate implementation blocks.",
    ],
    currentState:
      "Core story-card presentation patterns are repeated instead of composed from one shared card system.",
    problem:
      "Visual and interaction parity must be manually maintained across each copy, making drift likely.",
    whyItMatters:
      "Card-heavy products benefit from strict component contracts to preserve trust and speed future fixes.",
    userImpact:
      "Users may see subtle inconsistencies in card behavior between similar contexts.",
    recommendation:
      "Establish a shared story-card family with variant props for context-specific metadata/action differences.",
    sourceOfTruth: "code-observation",
    fixLevel: "shared-component",
    designSystemLevel: true,
    implementationDifficulty: "medium",
    batchable: true,
    status: "open",
  },
  {
    id: "uia-013",
    title: "Two parallel UI systems are active with conflicting defaults",
    severity: "high",
    confidence: "confirmed",
    category: "design-system",
    page: "Global architecture",
    files: [
      "src/components/chronicle/UI.tsx",
      "src/components/ui/button.tsx",
      "src/components/ui/card.tsx",
      "src/components/admin/styleguide/StyleGuideTool.tsx",
    ],
    evidence: [
      "Chronicle-specific primitives define one style language (`src/components/chronicle/UI.tsx`).",
      "shadcn primitives define another baseline (`src/components/ui/*`).",
      "`src/components/admin/styleguide/StyleGuideTool.tsx:4995-5001` documents the dual-system inconsistency explicitly.",
    ],
    currentState:
      "Both component systems are used in production-facing surfaces with different radius, color, and state idioms.",
    problem:
      "Without a clear ownership boundary, component selection becomes ad hoc and design drift accelerates.",
    whyItMatters:
      "Shared component strategy is the backbone of scalable UX consistency and predictable accessibility baselines.",
    userImpact:
      "Users experience abrupt style and behavior shifts between adjacent workflows.",
    recommendation:
      "Define a component governance model (primary system + sanctioned adapters), then enforce usage boundaries.",
    sourceOfTruth: "multi-source",
    fixLevel: "design-system",
    designSystemLevel: true,
    implementationDifficulty: "large",
    batchable: false,
    status: "open",
  },
  {
    id: "uia-014",
    title: "Chronicle UI primitives default to light surfaces in a primarily dark application shell",
    severity: "medium",
    confidence: "confirmed",
    category: "design-system",
    page: "Shared primitives",
    component: "chronicle/UI.tsx",
    files: ["src/components/chronicle/UI.tsx", "src/components/chronicle/WorldTab.tsx"],
    evidence: [
      "`Card` default is `bg-white` and `border-slate-200`: `src/components/chronicle/UI.tsx:56-58`.",
      "`Input` and `TextArea` default to `bg-ghost-white` and light border palette: `src/components/chronicle/UI.tsx:87-88`, `134-135`.",
      "Style guide inconsistency report notes light Chronicle primitives in dark pane contexts (`StyleGuideTool.tsx:5043`).",
    ],
    currentState:
      "Shared Chronicle primitives are not aligned to the dominant dark-surface environment used by builder/chat flows.",
    problem:
      "A shared primitive should not force context-level visual exceptions unless explicitly themed by variant.",
    whyItMatters:
      "Primitive mismatch encourages local overrides and contributes to compounding style debt.",
    userImpact:
      "Adjacent panels can feel mismatched, reducing coherence and scannability.",
    recommendation:
      "Introduce semantic light/dark variants at primitive level and avoid implicit light defaults in dark-first flows.",
    sourceOfTruth: "multi-source",
    fixLevel: "design-system",
    designSystemLevel: true,
    implementationDifficulty: "medium",
    batchable: true,
    status: "open",
  },
  {
    id: "uia-015",
    title: "Modal visual and structural patterns are inconsistent across high-traffic flows",
    severity: "high",
    confidence: "confirmed",
    category: "component",
    page: "Global modal ecosystem",
    files: [
      "src/components/chronicle/ReviewModal.tsx",
      "src/components/chronicle/StoryDetailModal.tsx",
      "src/components/chronicle/SceneTagEditorModal.tsx",
      "src/components/chronicle/ImageLibraryTab.tsx",
      "src/components/admin/styleguide/StyleGuideTool.tsx",
    ],
    evidence: [
      "Backdrop/structure patterns vary across custom and Radix-style approaches (`ReviewModal`, `StoryDetailModal`, `SceneTagEditorModal`, `ImageLibraryTab`).",
      "Style guide inconsistency report flags multiple modal backgrounds, border styles, and overlay systems (`StyleGuideTool.tsx:5012-5034`).",
    ],
    currentState:
      "Dialogs and lightboxes do not follow one structural or visual contract.",
    problem:
      "Modal inconsistency affects accessibility, visual consistency, and team implementation speed.",
    whyItMatters:
      "Modal interactions are high risk for focus, keyboard escape, and cognitive orientation errors.",
    userImpact:
      "Users encounter varying close behavior, visual density, and state emphasis between similar modal tasks.",
    recommendation:
      "Define one modal architecture contract (structure, overlay, radius, spacing, action hierarchy) and map existing modals to it.",
    sourceOfTruth: "multi-source",
    fixLevel: "shared-component",
    designSystemLevel: true,
    implementationDifficulty: "large",
    batchable: true,
    status: "open",
  },
  {
    id: "uia-016",
    title: "Search input relies on placeholder text without a visible or programmatic label",
    severity: "low",
    confidence: "confirmed",
    category: "forms",
    page: "Community Gallery",
    component: "GalleryHub header search",
    files: ["src/components/chronicle/GalleryHub.tsx"],
    evidence: [
      "Search field has placeholder but no explicit `<label>` or `aria-label`: `src/components/chronicle/GalleryHub.tsx:358-365`.",
      "Search icon is decorative and does not provide an accessible name.",
    ],
    currentState:
      "Primary gallery search is discoverable visually but lacks explicit form labeling semantics.",
    problem:
      "Placeholder-only labeling is fragile for accessibility and can be lost on autofill/assistive workflows.",
    whyItMatters:
      "Form controls should be explicitly labeled to reduce ambiguity and support assistive tools reliably.",
    userImpact:
      "Screen-reader users may get reduced context for the field's purpose.",
    recommendation:
      "Add a visible or screen-reader-only label and associate it with the input via `htmlFor`/`id` or `aria-label`.",
    sourceOfTruth: "research-brief",
    fixLevel: "accessibility",
    designSystemLevel: false,
    implementationDifficulty: "small",
    batchable: true,
    status: "open",
  },
  {
    id: "uia-017",
    title: "Filter-chip remove controls use icon-only buttons without explicit names",
    severity: "medium",
    confidence: "confirmed",
    category: "accessibility",
    page: "Community Gallery",
    component: "Active filter chips",
    files: ["src/components/chronicle/GalleryHub.tsx"],
    evidence: [
      "Chip remove buttons render only `X` icons (`src/components/chronicle/GalleryHub.tsx:422-427`, `436-441`).",
      "No `aria-label` is applied to indicate which filter will be removed.",
    ],
    currentState:
      "Tag and filter chip dismiss controls are visible but not semantically specific for assistive tech.",
    problem:
      "Identical unlabeled remove icons make it difficult to distinguish actions in non-visual navigation.",
    whyItMatters:
      "Assistive users need control names with context to avoid accidental filter changes.",
    userImpact:
      "Users may remove the wrong filter and lose query state unexpectedly.",
    recommendation:
      "Use `aria-label` such as `Remove filter <name>` for each chip dismiss control.",
    sourceOfTruth: "code-observation",
    fixLevel: "accessibility",
    designSystemLevel: false,
    implementationDifficulty: "small",
    batchable: true,
    status: "open",
  },
  {
    id: "uia-018",
    title: "Chat sidebar switches to a light visual language inside dark app contexts",
    severity: "medium",
    confidence: "confirmed",
    category: "layout",
    page: "Chat Interface",
    component: "Chat sidebar",
    files: [
      "src/components/chronicle/ChatInterfaceTab.tsx",
      "src/components/admin/styleguide/StyleGuideTool.tsx",
    ],
    evidence: [
      "Sidebar defaults to white surfaces (`bg-white`, `bg-white/90`): `src/components/chronicle/ChatInterfaceTab.tsx:3279`.",
      "Style guide inconsistency summary flags this exact mismatch (`StyleGuideTool.tsx:5041`).",
    ],
    currentState:
      "A dark shell contains a light sidebar with independent color semantics and control treatment.",
    problem:
      "Theme discontinuity creates abrupt context switching and weakens hierarchy consistency.",
    whyItMatters:
      "Stable visual language is important for orientation in dense, long-running chat workflows.",
    userImpact:
      "Users can perceive the sidebar as a separate product surface rather than part of one coherent flow.",
    recommendation:
      "Either harmonize sidebar theming with dark shell tokens or clearly formalize this as an intentional subsystem pattern.",
    sourceOfTruth: "multi-source",
    fixLevel: "design-system",
    designSystemLevel: true,
    implementationDifficulty: "medium",
    batchable: false,
    status: "open",
  },
  {
    id: "uia-019",
    title: "CircularProgress uses role=button without keyboard activation handlers",
    severity: "high",
    confidence: "confirmed",
    category: "accessibility",
    page: "Shared interactive utility",
    component: "CircularProgress",
    files: ["src/components/chronicle/CircularProgress.tsx"],
    evidence: [
      "Component assigns `role=\"button\"` and `tabIndex={0}` (`src/components/chronicle/CircularProgress.tsx:55-56`).",
      "No keydown handler for Enter/Space is implemented in the same component.",
    ],
    currentState:
      "The component appears keyboard-focusable but does not provide expected keyboard activation semantics.",
    problem:
      "Users navigating by keyboard may focus the control but fail to activate it with standard key behavior.",
    whyItMatters:
      "Keyboard parity is required for operability and consistent with APG interaction expectations.",
    userImpact:
      "Keyboard users can encounter dead-end controls.",
    recommendation:
      "Use a semantic `<button>` element or add Enter/Space key handlers that mirror click behavior.",
    sourceOfTruth: "research-brief",
    fixLevel: "accessibility",
    designSystemLevel: false,
    implementationDifficulty: "small",
    batchable: true,
    status: "open",
  },
  {
    id: "uia-020",
    title: "Review modal contains duplicated error logging statements",
    severity: "low",
    confidence: "confirmed",
    category: "implementation",
    page: "Review flow",
    component: "ReviewModal",
    files: ["src/components/chronicle/ReviewModal.tsx"],
    evidence: [
      "Duplicate `console.error` in submit catch block: `src/components/chronicle/ReviewModal.tsx:68-69`.",
      "Duplicate `console.error` in delete catch block: `src/components/chronicle/ReviewModal.tsx:83-84`.",
    ],
    currentState:
      "Error logging is repeated back-to-back for the same exception paths.",
    problem:
      "Duplicated logs increase noise in debugging output and telemetry pipelines.",
    whyItMatters:
      "Implementation noise makes real signal harder to parse during incident triage.",
    userImpact:
      "Indirect; can slow issue diagnosis and increase support turnaround times.",
    recommendation:
      "Keep one structured log per error path and include context payload if needed.",
    sourceOfTruth: "code-observation",
    fixLevel: "page-level",
    designSystemLevel: false,
    implementationDifficulty: "small",
    batchable: true,
    status: "open",
  },
  {
    id: "uia-021",
    title: "Legacy Vite starter CSS remains in repository and conflicts with current design language",
    severity: "low",
    confidence: "likely",
    category: "implementation",
    page: "Global styles",
    files: ["src/App.css", "src/App.tsx"],
    evidence: [
      "`src/App.css` contains starter `.logo`, `.read-the-docs`, and `#root` layout rules (`src/App.css:1-42`).",
      "`App.tsx` does not import `App.css`, indicating this file is likely stale.",
    ],
    currentState:
      "A legacy stylesheet remains alongside active tokenized styles in `index.css`.",
    problem:
      "Unused style artifacts confuse maintenance and can be accidentally reintroduced.",
    whyItMatters:
      "Design-system hygiene matters for reliable onboarding and predictable style ownership.",
    userImpact:
      "None immediate, but it increases the chance of accidental regression during future edits.",
    recommendation:
      "Confirm dead status and remove/archive unused starter CSS in a controlled cleanup pass.",
    sourceOfTruth: "code-observation",
    fixLevel: "unknown",
    designSystemLevel: false,
    implementationDifficulty: "small",
    batchable: true,
    status: "open",
  },
  {
    id: "uia-022",
    title: "Creator and public profile published-work cards appear non-actionable despite card affordance styling",
    severity: "medium",
    confidence: "likely",
    category: "content-ux",
    page: "Creator and account profile",
    route: "/creator/:userId",
    component: "CreatorProfile and PublicProfileTab card grids",
    files: [
      "src/pages/CreatorProfile.tsx",
      "src/components/account/PublicProfileTab.tsx",
    ],
    evidence: [
      "Published-work cards use strong card affordances and hover transforms in both files.",
      "The repeated card blocks do not expose explicit open/play actions in their local markup sections.",
      "Card structure closely mirrors actionable story cards elsewhere, creating a likely expectation mismatch.",
    ],
    currentState:
      "Profile card visuals imply interactivity, but actionable pathways are not obvious in these grids.",
    problem:
      "Affordance mismatch can create false interaction expectations and navigation dead ends.",
    whyItMatters:
      "Users should be able to continue exploration from profile surfaces without guessing hidden routes.",
    userImpact:
      "Users may assume the UI is broken when cards do not open as expected.",
    recommendation:
      "Confirm intended behavior and either add explicit action affordances or reduce interactive affordance styling.",
    sourceOfTruth: "code-observation",
    fixLevel: "content-ux",
    designSystemLevel: false,
    implementationDifficulty: "small",
    batchable: false,
    status: "open",
  },
  {
    id: "uia-023",
    title: "Theme inconsistency between auth/account and core Chronicle surfaces",
    severity: "stylistic",
    confidence: "preference",
    category: "color",
    page: "Auth and account-adjacent flows",
    files: [
      "src/components/auth/AuthModal.tsx",
      "src/components/account/SubscriptionTab.tsx",
      "src/components/admin/styleguide/StyleGuideTool.tsx",
    ],
    evidence: [
      "Auth and plan surfaces use additional palette accents (purple/amber) beyond dominant Chronicle blue-dark language.",
      "Style guide inconsistency notes call out theme divergence in auth and modal surfaces (`StyleGuideTool.tsx:5003-5010`).",
    ],
    currentState:
      "Some account/auth surfaces intentionally use a broader accent palette than core builder/chat screens.",
    problem:
      "This may be intentional branding variation, but currently reads as inconsistent visual governance.",
    whyItMatters:
      "Unclear palette strategy increases subjective inconsistency reports and slows design decisions.",
    userImpact:
      "Low direct impact; primarily influences perceived polish and cohesion.",
    recommendation:
      "Document whether auth/account accents are intentional sub-brand patterns or consolidate to core accent rules.",
    sourceOfTruth: "style-guide",
    fixLevel: "design-system",
    designSystemLevel: true,
    implementationDifficulty: "unknown",
    batchable: false,
    status: "open",
  },
  {
    id: "uia-024",
    title: "NotFound route uses hard navigation anchor instead of router navigation primitive",
    severity: "low",
    confidence: "confirmed",
    category: "navigation",
    page: "Not Found",
    route: "*",
    files: ["src/pages/NotFound.tsx"],
    evidence: [
      "404 page uses raw `<a href=\"/\">` link rather than router-level navigation component (`src/pages/NotFound.tsx`).",
    ],
    currentState:
      "Fallback route works functionally but bypasses SPA navigation semantics.",
    problem:
      "Hard navigation can cause unnecessary full reload and breaks consistency with route handling patterns.",
    whyItMatters:
      "Consistent routing behavior improves perceived performance and predictability.",
    userImpact:
      "Minor; users may see full page refresh when recovering from invalid routes.",
    recommendation:
      "Use router-native navigation (`Link`/`navigate`) in fallback pages for consistency.",
    sourceOfTruth: "code-observation",
    fixLevel: "page-level",
    designSystemLevel: false,
    implementationDifficulty: "small",
    batchable: true,
    status: "open",
  },
  {
    id: "uia-025",
    title: "Chat sidebar section toggles are implemented on heading tags without keyboard support",
    severity: "high",
    confidence: "confirmed",
    category: "accessibility",
    page: "Chat Interface",
    component: "Main/Side character section toggles",
    files: ["src/components/chronicle/ChatInterfaceTab.tsx"],
    evidence: [
      "Collapsible section triggers are rendered as `<h3>` with click handlers (`src/components/chronicle/ChatInterfaceTab.tsx:3424-3427`, `3476-3479`).",
      "These headings are styled as interactive (`cursor-pointer`) but are not focusable controls and have no associated keyboard handlers.",
      "Search in file shows the only `onKeyDown` is tied to chat message input (`src/components/chronicle/ChatInterfaceTab.tsx:3915`).",
    ],
    currentState:
      "Section expand/collapse behavior depends on pointer click on heading elements.",
    problem:
      "Keyboard users cannot reliably discover or activate the same expand/collapse controls.",
    whyItMatters:
      "Interactive headers should use semantic buttons or equivalent keyboard-operable patterns to maintain input parity.",
    userImpact:
      "Users navigating by keyboard may be blocked from browsing character sections in chat setup.",
    recommendation:
      "Replace clickable headings with `<button>` controls (or button inside heading) and preserve heading semantics for structure.",
    sourceOfTruth: "research-brief",
    fixLevel: "accessibility",
    designSystemLevel: false,
    implementationDifficulty: "small",
    batchable: true,
    status: "open",
  },
  {
    id: "uia-026",
    title: "Primary shell and builder/chat views rely on fixed sidebar widths without narrow-screen fallback",
    severity: "medium",
    confidence: "likely",
    category: "responsive",
    page: "Global shell / builder / chat",
    route: "/",
    component: "Index shell, WorldTab, ChatInterfaceTab",
    files: [
      "src/pages/Index.tsx",
      "src/components/chronicle/WorldTab.tsx",
      "src/components/chronicle/ChatInterfaceTab.tsx",
    ],
    evidence: [
      "App shell sidebar uses fixed widths with no breakpoint-based drawer fallback (`src/pages/Index.tsx:1530`).",
      "Story Builder left rail is fixed `w-[260px]` (`src/components/chronicle/WorldTab.tsx:470`).",
      "Chat Interface left rail is fixed `w-[300px]` (`src/components/chronicle/ChatInterfaceTab.tsx:3279`).",
      "Top-level shell uses `h-screen` with `overflow-hidden` (`src/pages/Index.tsx:1528`), increasing risk of constrained content at reduced viewport widths.",
    ],
    currentState:
      "Multiple key views reserve a non-trivial fixed-width sidebar regardless of viewport size.",
    problem:
      "On narrower screens or split-view windows, primary content can become compressed and harder to use.",
    whyItMatters:
      "Responsive resilience is required for tablet/smaller laptop usability and for users running zoomed UI.",
    userImpact:
      "Users on constrained viewports may experience cramped content areas, truncated controls, and reduced scanability.",
    recommendation:
      "Introduce a responsive sidebar strategy (collapse-to-drawer/off-canvas behavior) and verify key flows at tablet breakpoints.",
    sourceOfTruth: "multi-source",
    fixLevel: "responsive",
    designSystemLevel: true,
    implementationDifficulty: "medium",
    batchable: false,
    status: "open",
  },
  {
    id: "uia-027",
    title: "Admin tool tiles are mouse-first cards without keyboard-equivalent activation",
    severity: "high",
    confidence: "confirmed",
    category: "accessibility",
    page: "Admin and Guide Surfaces",
    component: "AdminPage tool grid cards",
    files: ["src/pages/Admin.tsx"],
    evidence: [
      "Each tile is a clickable `<div>` with `onClick` rather than a semantic button/link (`src/pages/Admin.tsx:139-143`).",
      "Primary tile actions are hidden behind hover-only overlay controls (`src/pages/Admin.tsx:166-181`).",
      "No keyboard handler or focusable wrapper is attached to the clickable card container.",
    ],
    currentState:
      "Tool selection and edit/open discovery in admin relies on hover and pointer interactions.",
    problem:
      "Keyboard-only users lack equivalent access to card activation and discoverability of secondary actions.",
    whyItMatters:
      "Administrative surfaces still require baseline operability parity and predictable interaction semantics.",
    userImpact:
      "Some users may be unable to open or edit tools from the card grid without a mouse.",
    recommendation:
      "Refactor cards to semantic button/link elements with visible focus states and non-hover-dependent action access.",
    sourceOfTruth: "code-observation",
    fixLevel: "accessibility",
    designSystemLevel: false,
    implementationDifficulty: "small",
    batchable: true,
    status: "open",
  },
  {
    id: "uia-028",
    title: "Standalone Gallery page exists but is not reachable from the active router",
    severity: "low",
    confidence: "confirmed",
    category: "navigation",
    page: "Gallery route wrapper",
    route: "/gallery",
    component: "Gallery page",
    files: ["src/pages/Gallery.tsx", "src/App.tsx"],
    evidence: [
      "`src/pages/Gallery.tsx` defines a complete page-level gallery wrapper.",
      "`src/App.tsx` currently registers `/`, `/auth`, `/creator/:userId`, `/style-guide/ui-audit`, and `*` only.",
      "Route search for `/gallery` in `src` returns no active route references.",
    ],
    currentState:
      "A route-level page implementation exists but is effectively unreachable in the current navigation graph.",
    problem:
      "Unreachable page-level UI creates maintenance drift and ambiguity about intended user flow.",
    whyItMatters:
      "Clear routing ownership helps prevent stale behavior and duplicate UI patterns over time.",
    userImpact:
      "Low direct user impact now, but it increases future confusion and potential route regressions.",
    recommendation:
      "Either wire `/gallery` intentionally or deprecate/archive the standalone page in a later cleanup pass.",
    sourceOfTruth: "code-observation",
    fixLevel: "page-level",
    designSystemLevel: false,
    implementationDifficulty: "small",
    batchable: true,
    status: "open",
  },
  {
    id: "uia-029",
    title: "Dark neutral palette contains many near-duplicate values that fragment surface hierarchy",
    severity: "high",
    confidence: "confirmed",
    category: "token-drift",
    page: "Global / multi-page",
    component: "Surface/background neutral system",
    files: [
      "src/components/admin/styleguide/StyleGuideTool.tsx",
      "src/components/chronicle/*.tsx",
      "src/index.css",
    ],
    evidence: [
      "Color scan shows overlapping dark neutrals with high frequency: `#2a2a2f` (133), `#2b2b2e` (27), `#121214` (28), `#1e1e22` (25), `#1a1a1a` (16), `#18181b` (20).",
      "Near-duplicate distance checks show values that are effectively indistinguishable in many contexts, e.g. `#2a2a2f` vs `#2b2b2e` (distance 1.7), `#18181b` vs `#1a1a1a` (distance 3.0).",
      "Style guide swatches document all of these as separate named colors across pages (`src/components/admin/styleguide/StyleGuideTool.tsx:1117-1130`, `1272-1285`, `1675-1686`, `1777-1780`).",
    ],
    currentState:
      "Multiple almost-identical dark surface values are used as separate tokens/labels.",
    problem:
      "Subtle one-off neutral differences make hierarchy hard to reason about and increase maintenance drift.",
    whyItMatters:
      "A dark UI still needs a deliberate surface scale; too many close neutrals erode visual rhythm and token discipline.",
    userImpact:
      "Users perceive inconsistent panel depth and section boundaries across pages.",
    recommendation:
      "Consolidate dark surfaces into a small semantic ladder (for example: app background, surface, elevated surface, overlay) and map legacy values to that ladder.",
    sourceOfTruth: "multi-source",
    fixLevel: "design-system",
    designSystemLevel: true,
    implementationDifficulty: "medium",
    batchable: true,
    status: "open",
  },
  {
    id: "uia-030",
    title: "Primary blue roles are split across multiple close variants without stable semantic boundaries",
    severity: "high",
    confidence: "confirmed",
    category: "color",
    page: "Global / multi-page",
    component: "Primary, accent, and hover blue states",
    files: [
      "src/components/admin/styleguide/StyleGuideTool.tsx",
      "src/components/chronicle/UI.tsx",
      "src/components/chronicle/ChatInterfaceTab.tsx",
      "src/components/chronicle/GalleryHub.tsx",
    ],
    evidence: [
      "High-frequency blue values in app code include `#4a5f7f` (333), `#3b82f6` (45), `#5a6f8f` (23), `#2d6fdb` (8), `#7ba3d4` (12).",
      "Style guide marks both Slate Blue and True Blue as app-wide (`src/components/admin/styleguide/StyleGuideTool.tsx:1117`, `1146`) while page-level hover blues are defined separately (`1377`, `1382`, `1702`).",
      "Button recipes include many distinct blue pathways rather than one state model (`src/components/admin/styleguide/StyleGuideTool.tsx`, multiple `buttonColor=` definitions in Buttons section).",
    ],
    currentState:
      "Blue is used for primary actions, accents, badges, links, hover states, and focus visuals with overlapping but inconsistent shades.",
    problem:
      "Without strict role mapping, similar blues compete and state changes become page-specific rather than systemic.",
    whyItMatters:
      "Consistent color semantics improve predictability: users should learn one meaning for one hue family and state sequence.",
    userImpact:
      "Users can misread action priority when two different blues both appear primary in the same flow.",
    recommendation:
      "Define semantic blue tokens (`primary`, `primary-hover`, `accent`, `info`) and remap all blue usages to those roles.",
    sourceOfTruth: "multi-source",
    fixLevel: "design-system",
    designSystemLevel: true,
    implementationDifficulty: "medium",
    batchable: true,
    status: "open",
  },
  {
    id: "uia-031",
    title: "Secondary gray text token can drop below safe contrast on dark charcoal surfaces",
    severity: "medium",
    confidence: "confirmed",
    category: "accessibility",
    page: "Conversations / dark card surfaces",
    component: "Secondary metadata text",
    files: [
      "src/components/admin/styleguide/StyleGuideTool.tsx",
      "src/components/chronicle/ConversationsTab.tsx",
    ],
    evidence: [
      "Style guide maps Stone Gray `#71717a` to session metadata text on dark session cards (`src/components/admin/styleguide/StyleGuideTool.tsx:1618`).",
      "Style guide maps dark card background to Dark Charcoal `#2a2a2f` (`src/components/admin/styleguide/StyleGuideTool.tsx:1580`).",
      "Computed contrast for `#71717a` on `#2a2a2f` is `2.95:1`, below 4.5:1 for normal body-sized text.",
    ],
    currentState:
      "Secondary text often relies on low-chroma grays over dark charcoal surfaces.",
    problem:
      "Some gray-on-charcoal pairings can miss readable contrast targets for normal text sizes.",
    whyItMatters:
      "Low-contrast metadata increases scan effort and hurts readability for low-vision users.",
    userImpact:
      "Users may struggle to read timestamps, helper text, and secondary details in dense card lists.",
    recommendation:
      "Raise muted-text token luminance on dark surfaces or reserve low-contrast grays only for large/non-essential labels.",
    sourceOfTruth: "multi-source",
    fixLevel: "accessibility",
    designSystemLevel: true,
    implementationDifficulty: "small",
    batchable: true,
    status: "open",
  },
  {
    id: "uia-032",
    title: "Page-specific swatches outnumber app-wide swatches, signaling color-system over-specialization",
    severity: "medium",
    confidence: "likely",
    category: "design-system",
    page: "Style guide governance",
    component: "Color swatch registry",
    files: ["src/components/admin/styleguide/StyleGuideTool.tsx"],
    evidence: [
      "Style guide currently lists 127 swatches total.",
      "Swatch audit shows `appWide=true` on 49 entries and `pageSpecific=true` on 78 entries.",
      "Large number of page-local colors is accompanied by a built-in Master Inconsistency Report (`src/components/admin/styleguide/StyleGuideTool.tsx:5043-5065`).",
    ],
    currentState:
      "The documented palette leans heavily toward page-level exceptions rather than shared semantic tokens.",
    problem:
      "As page-specific overrides grow, consistency and future refactoring costs increase.",
    whyItMatters:
      "A scalable design system should maximize shared semantics and minimize one-off page color rules.",
    userImpact:
      "Users experience uneven visual language and state behavior between pages.",
    recommendation:
      "Run a consolidation pass that promotes repeated page-specific colors into shared semantic tokens and archives true one-offs.",
    sourceOfTruth: "code-observation",
    fixLevel: "design-system",
    designSystemLevel: true,
    implementationDifficulty: "medium",
    batchable: true,
    status: "open",
  },
  {
    id: "uia-033",
    title: "Focus-visible behavior is inconsistent across button systems and high-traffic action controls",
    severity: "high",
    confidence: "confirmed",
    category: "state",
    page: "Global / multi-page",
    component: "Buttons and action controls",
    files: [
      "src/components/ui/button.tsx",
      "src/components/chronicle/UI.tsx",
      "src/pages/Index.tsx",
      "src/components/chronicle/ChatInterfaceTab.tsx",
      "src/components/chronicle/ConversationsTab.tsx",
    ],
    evidence: [
      "shadcn button includes explicit focus-visible ring and offset states (`src/components/ui/button.tsx:8`).",
      "Chronicle button primitive has rest/hover/active styles but no focus-visible classes (`src/components/chronicle/UI.tsx:12-22`).",
      "Sidebar and other high-traffic buttons rely on hover/active styles without explicit focus-visible classes (`src/pages/Index.tsx:89-90`, `src/components/chronicle/ChatInterfaceTab.tsx:3873-3902`, `src/components/chronicle/ConversationsTab.tsx:62`, `109`, `144`).",
      "Research brief requires full keyboard operability with visible focus state and warns against weak focus visibility (`audit/reference/UI_UX_Accessibility_React_Handbook_2026_Unified.txt:179-180`, `704`).",
    ],
    currentState:
      "Some controls implement robust focus-visible states while many page-local controls do not model focus explicitly.",
    problem:
      "Users experience inconsistent keyboard focus feedback across similar actions depending on which component family is used.",
    whyItMatters:
      "A design system needs one dependable state contract so keyboard navigation is predictable in every major flow.",
    userImpact:
      "Keyboard users can lose context in dense interfaces where hover cues are strong but focus cues are absent.",
    recommendation:
      "Define a shared focus-visible token contract and apply it to Chronicle primitives plus page-local button recipes.",
    sourceOfTruth: "multi-source",
    fixLevel: "design-system",
    designSystemLevel: true,
    implementationDifficulty: "medium",
    batchable: true,
    status: "open",
  },
  {
    id: "uia-034",
    title: "Async loading feedback is not standardized across comparable actions",
    severity: "medium",
    confidence: "confirmed",
    category: "state",
    page: "Chat and modal action flows",
    component: "Quick actions, review actions, media generation actions",
    files: [
      "src/components/chronicle/ChatInterfaceTab.tsx",
      "src/components/chronicle/ReviewModal.tsx",
      "src/components/chronicle/AvatarActionButtons.tsx",
      "src/components/chronicle/CoverImageActionButtons.tsx",
    ],
    evidence: [
      "Chat Send uses `...` as loading text while Generate Image uses spinner + full label (`src/components/chronicle/ChatInterfaceTab.tsx:3885-3893`, `3903`).",
      "Review modal submit/delete actions add spinner icons but keep static action labels (`src/components/chronicle/ReviewModal.tsx:169-173`, `178-182`).",
      "Avatar/Cover action suites use explicit loading labels (`Uploading...`, `Generating...`) (`src/components/chronicle/AvatarActionButtons.tsx:50`, `175`; `src/components/chronicle/CoverImageActionButtons.tsx:50`).",
      "Research brief flags loading states without clear announcements as a recurring accessibility issue (`audit/reference/UI_UX_Accessibility_React_Handbook_2026_Unified.txt:447`, `673`).",
    ],
    currentState:
      "Loading indicators exist in many flows, but wording and visual semantics differ across equivalent action types.",
    problem:
      "Without a shared loading pattern, users get uneven feedback about what is happening and when controls are busy.",
    whyItMatters:
      "Clear, consistent loading states reduce uncertainty and improve trust in async-heavy interactions.",
    userImpact:
      "Users may misread whether an action is still processing or completed, especially in chat and review workflows.",
    recommendation:
      "Establish a standard loading state pattern (label + spinner + optional announcement) for primary and destructive async actions.",
    sourceOfTruth: "multi-source",
    fixLevel: "shared-component",
    designSystemLevel: true,
    implementationDifficulty: "small",
    batchable: true,
    status: "open",
  },
  {
    id: "uia-035",
    title: "Disabled-state styling drifts across controls, weakening affordance consistency",
    severity: "medium",
    confidence: "confirmed",
    category: "state",
    page: "Global / multi-page",
    component: "Buttons and icon controls",
    files: [
      "src/components/chronicle/UI.tsx",
      "src/components/chronicle/ChatInterfaceTab.tsx",
      "src/components/chronicle/WorldTab.tsx",
      "src/components/chronicle/ReviewModal.tsx",
      "src/components/chronicle/AvatarActionButtons.tsx",
    ],
    evidence: [
      "Chronicle primitive disables via `opacity-50 pointer-events-none` (`src/components/chronicle/UI.tsx:22`).",
      "Chat message controls use lighter disable treatment `disabled:opacity-30` (`src/components/chronicle/ChatInterfaceTab.tsx:3587`, `3599`).",
      "Review actions use `disabled:opacity-40 disabled:cursor-not-allowed` (`src/components/chronicle/ReviewModal.tsx:169`, `178`).",
      "Other shared action suites use `disabled:opacity-50` (`src/components/chronicle/AvatarActionButtons.tsx:45`, `84`; `src/components/chronicle/WorldTab.tsx:951`).",
    ],
    currentState:
      "Disabled states are present, but opacity levels and behavioral cues vary notably across similar controls.",
    problem:
      "Inconsistent disabled affordance creates ambiguity about whether controls are temporarily busy, unavailable, or broken.",
    whyItMatters:
      "State consistency is a core design-system signal that helps users quickly interpret interaction availability.",
    userImpact:
      "Users can misinterpret control readiness, especially in dense builder/chat contexts with many simultaneous actions.",
    recommendation:
      "Standardize disabled visual and behavioral treatment with one semantic token set for opacity, cursor, and pointer behavior.",
    sourceOfTruth: "code-observation",
    fixLevel: "design-system",
    designSystemLevel: true,
    implementationDifficulty: "small",
    batchable: true,
    status: "open",
  },
  {
    id: "uia-036",
    title: "AI media action suites are implemented three times with near-identical code",
    severity: "medium",
    confidence: "confirmed",
    category: "component",
    page: "Builder and character media flows",
    component: "Avatar/Cover/Scene action button groups",
    files: [
      "src/components/chronicle/AvatarActionButtons.tsx",
      "src/components/chronicle/CoverImageActionButtons.tsx",
      "src/components/chronicle/SceneGalleryActionButtons.tsx",
    ],
    evidence: [
      "All three files define the same upload dropdown + layered AI generate button structure with matching class stacks and state logic (`AvatarActionButtons.tsx:34-179`, `CoverImageActionButtons.tsx:34-179`, `SceneGalleryActionButtons.tsx:34-179`).",
      "Focus/disabled/loading behavior is repeated manually in each implementation.",
    ],
    currentState:
      "The same interaction component family is duplicated across three files with minimal functional variation.",
    problem:
      "Maintaining duplicates increases change cost and creates future drift risk when one copy is updated without the others.",
    whyItMatters:
      "Shared high-traffic actions should be governed by a single source of truth for consistency and safety.",
    userImpact:
      "Users may eventually encounter inconsistent behavior between similar media upload/generation workflows.",
    recommendation:
      "Extract one shared media-action suite component with configurable labels and handlers.",
    sourceOfTruth: "code-observation",
    fixLevel: "shared-component",
    designSystemLevel: true,
    implementationDifficulty: "small",
    batchable: true,
    status: "open",
  },
  {
    id: "uia-037",
    title: "Story, gallery, and character media cards share one visual language but are forked into separate implementations",
    severity: "high",
    confidence: "confirmed",
    category: "component",
    page: "StoryHub / Gallery / Character Library",
    component: "2:3 media card family",
    files: [
      "src/components/chronicle/StoryHub.tsx",
      "src/components/chronicle/GalleryStoryCard.tsx",
      "src/components/chronicle/CharactersTab.tsx",
    ],
    evidence: [
      "StoryHub and Gallery cards share near-identical shell behavior (`group-hover:-translate-y-3`, `aspect-[2/3]`, `rounded-[2rem]`, dark overlay) (`StoryHub.tsx:57-107`, `GalleryStoryCard.tsx:62-84`).",
      "CharactersTab card replicates the same shell grammar with slight shadow/action drift (`CharactersTab.tsx:582-624`).",
      "Card interaction and action-reveal differences are maintained per file instead of through a shared variant model.",
    ],
    currentState:
      "A de facto media-card system exists, but implementation is fragmented across separate components.",
    problem:
      "Fragmentation makes it difficult to apply consistent accessibility and state behavior across all card-heavy surfaces.",
    whyItMatters:
      "Card surfaces are core navigation and discovery elements; drift here compounds quickly as new features are added.",
    userImpact:
      "Users can experience subtle but noticeable inconsistencies in action visibility, emphasis, and affordance between similar cards.",
    recommendation:
      "Create a shared media-card base with composable slots/variants for badges, metadata, and action controls.",
    sourceOfTruth: "code-observation",
    fixLevel: "shared-component",
    designSystemLevel: true,
    implementationDifficulty: "medium",
    batchable: true,
    status: "open",
  },
  {
    id: "uia-038",
    title: "Input styling and focus behavior diverge across auth, account, and builder flows",
    severity: "medium",
    confidence: "likely",
    category: "forms",
    page: "Auth / Account / Builder",
    component: "Text input and textarea families",
    files: [
      "src/components/chronicle/UI.tsx",
      "src/components/chronicle/CharacterEditModal.tsx",
      "src/components/auth/AuthModal.tsx",
      "src/components/account/PublicProfileTab.tsx",
    ],
    evidence: [
      "Chronicle primitive fields use light recipe (`bg-ghost-white border-slate-200`) (`src/components/chronicle/UI.tsx:87`, `134`).",
      "CharacterEdit fields use dark `bg-zinc-900/50 border-ghost-white` with blue focus ring (`src/components/chronicle/CharacterEditModal.tsx:193`, `1794`).",
      "Auth modal uses separate translucent slate field styling (`src/components/auth/AuthModal.tsx:179-216`).",
      "Public profile form applies page-local field classes (`src/components/account/PublicProfileTab.tsx:366`, `379`).",
    ],
    currentState:
      "Multiple field style families coexist with different surface, border, and focus treatments.",
    problem:
      "Cross-flow inconsistency weakens form predictability and increases maintenance complexity.",
    whyItMatters:
      "Forms are repeated interactions where consistent affordance and feedback strongly affect completion confidence.",
    userImpact:
      "Users may need to relearn visual field cues when switching between account, auth, and builder contexts.",
    recommendation:
      "Define a constrained field-variant system and map current page-local styles to approved variants.",
    sourceOfTruth: "code-observation",
    fixLevel: "design-system",
    designSystemLevel: true,
    implementationDifficulty: "medium",
    batchable: true,
    status: "open",
  },
];
