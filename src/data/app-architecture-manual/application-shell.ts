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

export const applicationShellArchitectureFiles = defineManualArchitectureFiles([
  {
    path: "/src/components/NavLink.tsx",
    header: componentHeader,
    metric: "28 lines",
    metricDescription: "Router-aware navigation-link adapter.",
    description:
      "Adapts React Router's NavLink callback state into Chronicle's older className, activeClassName, and pendingClassName prop pattern. It merges those classes with cn and forwards the anchor ref; it does not define destinations or product navigation itself.",
    rows: [],
    reviewedSource: "Manual review of the complete forwardRef adapter and exported prop contract.",
  },
  {
    path: "/src/components/account/AccountSettingsTab.tsx",
    header: componentHeader,
    metric: "165 lines",
    metricDescription: "Account identity, plan summary, and password-change screen.",
    description:
      "Shows the signed-in email address, derives a display-only subscription label from user metadata, and submits password changes through Supabase Auth. Client-side checks reject passwords shorter than six characters or mismatched confirmation before calling auth.updateUser; success and failure remain local status messages.",
    rows: [
      {
        id: "account-settings-password",
        title: "Password update boundary",
        summary:
          "Owns only the password-change form and delegates the actual credential update to Supabase Auth; it never reads or stores the previous password.",
        badgeLabel: "AUTH",
        badgeClass: "integration",
        details: [
          { label: "Input", values: ["new password", "confirmation password", "current authenticated user"], kind: "plain" },
          { label: "Calls", values: ["supabase.auth.updateUser({ password })"], kind: "plain" },
          { label: "Negative Guarantee", values: ["does not persist password values in application state after a successful update"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of tier normalization, form validation, Supabase Auth call, and rendered sections.",
  },
  {
    path: "/src/components/account/PublicProfileTab.tsx",
    header: componentHeader,
    metric: "727 lines",
    metricDescription: "Public creator-profile editor and published-work manager.",
    description:
      "Loads and edits the user's public profile, creator statistics, published scenarios, content-theme metadata, publisher metadata, and the user's like/save state. It owns avatar upload, generated-avatar adoption, crop-position persistence, profile privacy settings, genre editing, published-work interactions, and opening or playing the selected published scenario.",
    rows: [
      {
        id: "public-profile-load",
        title: "Profile and published-work read model",
        summary:
          "Builds the screen from the profiles row, get_creator_stats RPC, visible published_scenarios joined to stories, content_themes, publisher profiles, and per-user gallery interactions.",
        badgeLabel: "DATA FLOW",
        badgeClass: "data-block",
        details: [
          { label: "Reads", values: ["profiles", "published_scenarios", "stories", "content_themes"], kind: "plain" },
          { label: "Calls", values: ["get_creator_stats", "getUserInteractions"], kind: "plain" },
          { label: "Output", values: ["editable profile state", "creator totals", "PublishedScenario cards with themes and publisher metadata"], kind: "plain" },
        ],
      },
      {
        id: "public-profile-save",
        title: "Profile and avatar persistence",
        summary:
          "Updates profile text, privacy options, preferred genres, avatar URL, and avatar position while keeping binary image data in the avatars storage bucket.",
        badgeLabel: "PERSISTENCE",
        badgeClass: "data-block",
        details: [
          { label: "Writes", values: ["profiles", "avatars storage bucket"], kind: "plain" },
          { label: "Uses", values: ["/src/utils.ts", "/src/components/chronicle/AvatarGenerationModal.tsx", "/src/components/chronicle/AvatarActionButtons.tsx"], kind: "files" },
          { label: "Guardrail", values: ["profile saves are registered with the parent through onRegisterSave so the shell owns the visible Save action"], kind: "plain" },
        ],
      },
      {
        id: "public-profile-gallery-actions",
        title: "Published-work interactions",
        summary:
          "Coordinates like, save, view, and play actions and immediately reconciles local card and aggregate counters after each service call.",
        badgeLabel: "USER FLOW",
        badgeClass: "feature",
        details: [
          { label: "Uses", values: ["/src/services/gallery-data.ts", "/src/components/chronicle/GalleryStoryCard.tsx", "/src/components/chronicle/StoryDetailModal.tsx"], kind: "files" },
          { label: "User-visible Effect", values: ["profile showcase, aggregate statistics, published-story detail modal, and story launch callback"], kind: "plain" },
          { label: "Failure Handling", values: ["failed interaction calls are logged and do not optimistically retain a counter change that was never applied"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of all data loads, profile writes, avatar flows, drag positioning, gallery actions, and modal wiring.",
  },
  {
    path: "/src/components/account/SubscriptionTab.tsx",
    header: componentHeader,
    metric: "261 lines",
    metricDescription: "Live subscription-tier comparison screen.",
    description:
      "Loads the current subscription-tier configuration, subscribes to in-app configuration updates, normalizes the signed-in user's legacy tier aliases, and compares each tier with the tier below it so newly added limits and capabilities are visually separated from inherited benefits. The purchase buttons are currently presentation-only: this component does not start checkout or change a subscription.",
    rows: [
      {
        id: "subscription-tier-read-model",
        title: "Tier configuration and comparison",
        summary:
          "Consumes the shared finance configuration service and derives current-tier, inherited-feature, new-feature, message-limit, image-limit, price, accent, and coming-soon display state.",
        badgeLabel: "DATA FLOW",
        badgeClass: "context",
        details: [
          { label: "Uses", values: ["/src/services/subscription-tier-config.ts", "/src/hooks/use-auth.tsx"], kind: "files" },
          { label: "Accepts Legacy Aliases", values: ["pro as starter", "free_trial as free"], kind: "plain" },
          { label: "Does Not Own", values: ["billing checkout", "subscription mutation", "payment-provider calls"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of live config subscription, tier normalization, feature-delta calculations, and all rendered actions.",
  },
  {
    path: "/src/components/app-shell/AppShellHeader.tsx",
    header: componentHeader,
    metric: "22 lines",
    metricDescription: "Shared top-header frame.",
    description:
      "Renders the application top bar only when visible and provides responsive left and right content regions. It owns the header's layout, border, background, and wrapping behavior but receives all labels and actions from AppShellTopBar or another caller.",
    rows: [],
    reviewedSource: "Manual review of the complete conditional layout component.",
  },
  {
    path: "/src/components/app-shell/AppShellTopBar.tsx",
    header: componentHeader,
    metric: "681 lines",
    metricDescription: "Route-sensitive application action bar.",
    description:
      "Translates the active workspace tab and its typed configuration into the correct page title, back action, search or segmented control, and right-side commands. It centralizes shell-level actions for the Character Library, Story Builder, My Stories, Gallery, Image Library, Admin tools, account profile, chat history, and character editing, while deliberately returning no header for the immersive chat interface.",
    rows: [
      {
        id: "topbar-left-context",
        title: "Workspace identity and navigation controls",
        summary:
          "Selects the title, optional back button, search field, and view switcher from the active tab without owning the destination screen's data.",
        badgeLabel: "APP SHELL",
        badgeClass: "component",
        details: [
          { label: "Workspace Inputs", values: ["library", "builder", "hub", "gallery", "image library", "admin", "account", "conversations"], kind: "plain" },
          { label: "Shared Controls", values: ["BackButton", "SectionTitle", "SearchChip", "SegmentedControl"], kind: "plain" },
          { label: "Negative Guarantee", values: ["does not render over chat_interface"], kind: "plain" },
        ],
      },
      {
        id: "topbar-command-routing",
        title: "Contextual command routing",
        summary:
          "Exposes caller-owned commands for imports, exports, saves, deletion, background settings, guide maintenance, AI Fill, character selection, and account-profile persistence.",
        badgeLabel: "USER FLOW",
        badgeClass: "feature",
        details: [
          { label: "Story Builder", values: ["import", "export", "finalize and close", "save draft", "API usage tracking toggle", "transfer notice"], kind: "plain" },
          { label: "Character Editor", values: ["AI Fill", "save", "cancel", "save to library", "pick character", "create character"], kind: "plain" },
          { label: "Other Surfaces", values: ["delete all conversations", "gallery NSFW toggle", "image upload", "profile save", "admin guide and style-guide actions"], kind: "plain" },
          { label: "Guardrail", values: ["the parent screen remains the state and persistence owner; this file only invokes supplied callbacks"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of every tab branch, header helper, command callback, menu, tooltip, and no-header chat branch.",
  },
  {
    path: "/src/components/app-shell/AppShellTopBar.test.tsx",
    header: testHeader,
    metric: "43 lines",
    metricDescription: "Top-bar interaction regression test.",
    description:
      "Renders the Story Builder variant of AppShellTopBar and verifies that activating its settings control exposes the Track API Usage menu item. It protects the menu interaction path, but it does not cover the component's other workspace branches.",
    rows: [],
    reviewedSource: "Manual review of the single jsdom test and its assertions.",
  },
  {
    path: "/src/components/app-shell/AppShellWorkspace.tsx",
    header: componentHeader,
    metric: "13 lines",
    metricDescription: "Application workspace sizing frame.",
    description:
      "Provides the flex, minimum-height, overflow, and column layout boundary that allows the active main workspace to fill remaining shell space without expanding beyond the viewport. It does not choose or render a route itself.",
    rows: [],
    reviewedSource: "Manual review of the complete layout wrapper.",
  },
  {
    path: "/src/components/app-shell/AppSidebar.tsx",
    header: componentHeader,
    metric: "305 lines",
    metricDescription: "Primary application navigation sidebar.",
    description:
      "Renders Chronicle branding, collapse controls, primary workspace destinations, active-story context, the admin entry, and the authenticated user menu. All routing is callback-driven by the parent; the sidebar owns visual active state, collapsed tooltips, profile fallback initials, and which account actions are shown for signed-in versus signed-out users.",
    rows: [
      {
        id: "sidebar-navigation",
        title: "Primary workspace navigation",
        summary:
          "Displays Gallery, My Stories, Character Library, Image Library, Chat History, Story Builder, and the conditional Admin entry with active and collapsed states.",
        badgeLabel: "NAVIGATION",
        badgeClass: "component",
        details: [
          { label: "Input", values: ["active tab", "story title and active-story flag", "admin status", "collapse state"], kind: "plain" },
          { label: "Output", values: ["caller-owned selection callbacks; no direct route mutation"], kind: "plain" },
          { label: "User-visible Effect", values: ["persistent left-side entry point for all major Chronicle workspaces"], kind: "plain" },
        ],
      },
      {
        id: "sidebar-account-menu",
        title: "Authentication-aware account menu",
        summary:
          "Shows avatar, display-name fallback, email, public-profile, account-settings, and sign-out controls for authenticated users or a sign-in action otherwise.",
        badgeLabel: "AUTH",
        badgeClass: "integration",
        details: [
          { label: "Input", values: ["authentication state", "email", "display name", "avatar URL", "user-menu open state"], kind: "plain" },
          { label: "Does Not Own", values: ["authentication calls or profile persistence"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of navigation destinations, collapse behavior, admin condition, account menu, and all callbacks.",
  },
  {
    path: "/src/components/auth/AuthModal.tsx",
    header: componentHeader,
    metric: "315 lines",
    metricDescription: "Email/password and social authentication modal.",
    description:
      "Switches between sign-in and account-creation forms, validates email and minimum password length with Zod, checks signup password confirmation, delegates email/password operations to useAuth, and delegates Apple or Google OAuth to the Lovable integration. It resets sensitive form state when closed and translates common authentication errors into user-facing messages.",
    rows: [
      {
        id: "auth-modal-credential-flow",
        title: "Credential validation and submission",
        summary:
          "Normalizes email, validates credentials before network work, then calls the matching signIn or signUp operation and closes only after a successful result.",
        badgeLabel: "AUTH",
        badgeClass: "integration",
        details: [
          { label: "Uses", values: ["/src/hooks/use-auth.tsx", "Zod email and password schemas"], kind: "files" },
          { label: "Input", values: ["email", "password", "signup confirmation password"], kind: "plain" },
          { label: "Failure Handling", values: ["field-level validation", "invalid-credentials message", "already-registered message", "generic provider message"], kind: "plain" },
        ],
      },
      {
        id: "auth-modal-oauth",
        title: "Social sign-in handoff",
        summary:
          "Starts Apple or Google OAuth through lovable.auth with the current origin as the redirect target and keeps provider errors inside the modal.",
        badgeLabel: "EXTERNAL SERVICE",
        badgeClass: "integration",
        details: [
          { label: "Uses", values: ["/src/integrations/lovable/index.ts"], kind: "files" },
          { label: "Providers", values: ["Apple", "Google"], kind: "plain" },
          { label: "Guardrail", values: ["closing the dialog clears entered credentials and returns the form to sign-in mode"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of modal state, Zod validation, email/password flow, OAuth flow, error mapping, and reset behavior.",
  },
]);
