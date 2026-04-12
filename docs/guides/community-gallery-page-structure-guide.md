> **INSTRUCTIONS FOR LOVABLE / AI AGENTS**
>
> MANDATORY: Before editing this file, read `docs/guides/GUIDE_STYLE_RULES.md` in full.
>
> That file defines heading hierarchy, table formatting, code block rules, good-vs-bad content patterns, and section-specific requirements. You must follow it exactly.
>
> This document is the SINGLE SOURCE OF TRUTH for this page's architecture.
>
> When making changes to this page's code, you MUST:
>
> 1. READ `docs/guides/GUIDE_STYLE_RULES.md` before making any edits to this document
> 2. READ this entire document before making any code changes
> 3. UPDATE this document IN-PLACE after making code changes — do NOT append summaries
> 4. PRESERVE the exact 13-section format — do not skip sections, do not reorganize
> 5. USE REAL VALUES from the code — exact file paths, exact Tailwind classes, exact hex codes
> 6. UPDATE the Known Issues section (Section 12) when fixing or discovering bugs
> 7. CROSS-REFERENCE the Shared Elements page when modifying any shared component
>
> If a section does not apply, write: `N/A — [specific reason]`
>
> Never write: "see code for details" — this document exists so no one needs to read the code.

# PAGE: COMMUNITY GALLERY .

* * *

## 1\. PAGE OVERVIEW

| Field | Detail |
| --- | --- |
| **Page Title** | Community Gallery |
| **Route / URL Path** | No dedicated route. Rendered as a tab (`tab === "gallery"`) inside `src/pages/Index.tsx`. A legacy standalone route exists at `/gallery` via `src/pages/Gallery.tsx` but is not used in the main app flow. |
| **Primary Source File** | `src/components/chronicle/GalleryHub.tsx` |
| **Purpose** | A public-facing marketplace of user-published interactive stories. Users browse, search, filter, like, save, and play stories published by other creators. It also provides access to the Scenario Detail Modal for full story previews, character rosters, reviews, and creator profiles. |
| **User Role Access** | All authenticated users. Unauthenticated users are redirected to `/auth` if accessing via the legacy `/gallery` route. Within the main app (`Index.tsx`), the sidebar item is visible to all logged-in users. |
| **Navigation Sidebar** | Label: "Community Gallery", Icon: `Globe` (Lucide), Position: 1st item in sidebar nav order. |
| **Entry Points** | 1\. Sidebar nav click ("Community Gallery"). 2. Legacy direct URL `/gallery`. 3. Programmatic navigation via `react-router-dom` `useNavigate` from other pages. |

* * *

## 2\. LAYOUT & STRUCTURE

### Top-level layout wrapper

The Gallery tab is rendered inside the main app shell defined in `src/pages/Index.tsx`. The shell provides:

-   A collapsible left sidebar (nav items, app logo)
-   A top header bar (`h-16`, white background, `border-b border-slate-200`)
-   A main content area (`flex-1 overflow-hidden`)

When `tab === "gallery"`, the header displays the page title and sort toggle pills. The main content area renders `<GalleryHub />` which manages its own internal layout.

### Page header row (within Index.tsx header)

-   **Left side**: Page title "Community Gallery" (`text-lg font-black text-slate-900 uppercase tracking-tight`)
-   **Right of title**: Sort toggle pill bar -- a horizontally scrollable row of pill buttons inside a dark capsule container (`bg-[#2b2b2e] rounded-full p-1 border border-[#2b2b2e]`). Pills: "All Stories", "Recent", "Liked", "Saved", "Played", "Following". Active pill: `bg-[#4a5f7f] text-white shadow-sm`. Inactive: `text-[#a1a1aa] hover:text-[#e4e4e7]`. Each pill: `px-4 py-1.5 rounded-full text-xs font-bold`.
-   **Right side of header**: No action buttons specific to the Gallery tab.

### GalleryHub internal layout (`GalleryHub.tsx`)

The component is a full-height flex column with three vertical zones:

1.  **Chronicle discovery toolbar** (`sticky top-0 z-50`):
    
    -   Background: `rgba(18, 18, 20, 0.8)` with `backdrop-filter: blur(12px)`
    -   Contains: a left `Browse Categories` control rail (`lg:w-72`) plus a Chronicle recessed search surface (`flex-1`)
    -   The category trigger now lives on the left so it visually aligns with and opens the left filter panel instead of launching a panel on the opposite side of the page
2.  **Slate-blue divider**:
    
    -   `linear-gradient(90deg, transparent 0%, rgba(110,137,173,0.55) 18%, rgba(110,137,173,0.8) 50%, rgba(110,137,173,0.55) 82%, transparent 100%)`
3.  **Main content area** (`flex-col lg:flex-row`):
    
    -   **Left**: `<GalleryCategorySidebar />` (conditional, `w-full lg:w-72`) inside an animated width wrapper so the left filter rail expands/collapses from the same side as the trigger
    -   **Right**: Scrollable main content with active filter chips + card grid

### Secondary panels / drawers

-   **Category Sidebar** (`GalleryCategorySidebar.tsx`): A Chronicle shell panel that opens from the left rail when `Browse Categories` is toggled. Width: `w-full` on smaller widths and `w-72` (288px) on desktop. Outer shell: `bg-[#2a2a2f]` with Chronicle bevel shadow. Header: `bg-gradient-to-b from-[#5a7292] to-[#4a5f7f]`. Body: `bg-[#2e2e33]`. The old yellow accent strip was removed in favor of Chronicle slate-blue styling.
-   **Scenario Detail Modal** (`StoryDetailModal.tsx`): Full-screen overlay modal. Triggered by clicking any card.
-   **Review Modal** (`ReviewModal.tsx`): Nested modal within the Detail Modal for leaving/editing reviews.

### Empty state

-   **Icon**: `Globe` (Lucide), `w-10 h-10 text-white/30`, inside a `w-20 h-20 bg-white/10 rounded-full` circle
-   **Title**: "No stories found" (or "No stories from followed creators" when on Following tab). `text-xl font-bold text-white`
-   **Subtitle**: Contextual message. `text-white/60 max-w-md`
-   **No CTA button** in the empty state.

### Loading behavior

Uses React Query's `useInfiniteQuery` for data fetching with automatic caching (30s stale time). Initial load shows a centered `Loader2` spinner (`w-8 h-8 animate-spin text-slate-400`) inside a `h-64` container. Subsequent page loads via infinite scroll show a smaller spinner (`w-6 h-6`) at the bottom of the grid. Data is fetched via the `fetch_gallery_scenarios` database RPC function which handles filtering, search, sorting, and pagination server-side. A Supabase Realtime subscription automatically updates the gallery when stories are published, updated, or removed.

* * *

## 3\. UI ELEMENTS -- COMPLETE INVENTORY

| Element | Type | Label / Text | Position on Screen | Color -- Background | Color -- Text/Icon | Size / Weight | Interaction / Behavior | Component File | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Page title | Heading | "Community Gallery" | Header bar, left side | Transparent | `text-slate-900` | `text-lg font-black uppercase tracking-tight` | Static | `src/pages/Index.tsx` | Rendered by Index.tsx header, not GalleryHub |
| Sort pill bar | Button group | "All Stories", "Recent", "Liked", "Saved", "Played", "Following" | Header bar, right of title | Container: `bg-[#2b2b2e]` | Active: white. Inactive: `#a1a1aa` | `text-xs font-bold` | Clicking sets `gallerySortBy` state, triggers data refetch | `src/pages/Index.tsx` | Sort state is lifted to Index.tsx and passed as prop |
| Browse Categories button | Button | "Browse Categories" | GalleryHub toolbar, left rail | Closed: `#3c3e47 / bg-[#3c3e47]`. Open: `#2a2a2f / bg-[#2a2a2f]` | `#FFFFFF / text-white`, supporting copy `#A1A1AA / text-zinc-400` | Full rail card, `rounded-[24px] px-4 py-3` | Toggles the left filter panel open/close. The control now stays on the same side as the panel it opens. | `src/components/chronicle/GalleryHub.tsx` | Includes a `LayoutGrid` icon capsule, helper copy, active-filter count badge, and chevron |
| Filter count badge | Badge | Number (e.g. "3") | Right side of Browse Categories button | `#4A5F7F / bg-[#4a5f7f]/30` | White | `rounded-full px-2 py-1 text-[10px] font-black` | Static, shows count of active category filters | `src/components/chronicle/GalleryHub.tsx` | Only rendered when `activeFilterCount > 0` |
| Search shell | Text input surface | "Search titles, descriptions, or #tags..." | GalleryHub toolbar, right side | `#2A2A2F / bg-[#2a2a2f]` with inner icon well `#1C1C1F / bg-[#1c1c1f]` | `#FFFFFF / text-white`, placeholder `#71717A / text-zinc-500` | `min-h-[72px] rounded-[24px] px-4 py-3` | Live-applies search after a short debounce; Enter also applies immediately | `src/components/chronicle/GalleryHub.tsx` | Replaces the older flat search input + separate Search button combination |
| Search icon | Icon | n/a | Inside search shell, left icon well | `#1C1C1F / bg-[#1c1c1f]` | `#A1A1AA / text-zinc-400` | `h-4 w-4` inside `h-11 w-11` pill | Decorative | `src/components/chronicle/GalleryHub.tsx` | Lucide `Search` |
| Clear search button | Button | "Clear" | Right side of search shell | `#3C3E47 / bg-[#3c3e47]` | `#EAEDF1 / text-[#eaedf1]` | `h-10 rounded-xl px-4 text-xs font-bold` | Clears `searchQuery`, `searchText`, and `searchTags` | `src/components/chronicle/GalleryHub.tsx` | Only shown when the search field is not empty |
| Active filter chips | Chip/pill | Filter name (e.g. "#romance", "Fantasy") | Below GalleryHub header, in filter bar | Search tags: `bg-white/20`. Story types: `bg-blue-500/20`. Genres: `bg-purple-500/20`. Origins: `bg-green-500/20`. Trigger warnings: `bg-amber-500/20` | Search: white. Types: `text-blue-400`. Genres: `text-purple-400`. Origins: `text-green-400`. Warnings: `text-amber-400` | `px-2 py-1 rounded-full text-xs font-medium` | Click X to remove individual filter | `src/components/chronicle/GalleryHub.tsx` | Each chip has an X button (`hover:text-red-300`) |
| "Clear all" link | Text button | "Clear all" | After filter chips, right | Transparent | `text-white/70 hover:text-white` | `text-sm underline` | Clears all search tags and category filters | `src/components/chronicle/GalleryHub.tsx` |  |
| Loading spinner | Spinner | n/a | Center of content area | Transparent | `text-slate-400` | `w-8 h-8` | Animated spin | `src/components/chronicle/GalleryHub.tsx` | Lucide `Loader2` |
| Empty state icon | Icon container | Globe icon | Center of content area | `bg-white/10` (circle) | `text-white/30` | Circle: `w-20 h-20 rounded-full`. Icon: `w-10 h-10` | Static | `src/components/chronicle/GalleryHub.tsx` |  |
| Empty state title | Heading | "No stories found" / "No stories from followed creators" | Center, below icon | Transparent | White | `text-xl font-bold` | Static | `src/components/chronicle/GalleryHub.tsx` | Text varies by context |
| Empty state description | Paragraph | Contextual help text | Center, below title | Transparent | `text-white/60` | `max-w-md` | Static | `src/components/chronicle/GalleryHub.tsx` |  |

* * *

## 4\. CARDS / LIST ITEMS

### Card Grid Layout

-   Grid classes: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 lg:gap-8`
-   Outer gallery region padding: `px-6 pb-6 pt-4`
-   Grid wrapper padding: `pb-10`

### Card Container (`GalleryScenarioCard.tsx`)

| Property | Value |
| --- | --- |
| **Aspect ratio** | `aspect-[2/3]` (portrait, 2:3) |
| **Width** | `w-full` (fills grid column) |
| **Border** | `border border-[#4a5f7f]` (slate blue brand border) |
| **Border radius** | `rounded-[2rem]` (32px) |
| **Shadow** | `shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)]` |
| **Background (no image)** | Gradient: `bg-gradient-to-br from-slate-800 to-slate-900` |
| **Hover state** | Card lifts: `-translate-y-3`, shadow intensifies: `shadow-2xl`. Cover image scales: `scale-110` over 700ms. Title text changes to `text-blue-300`. Gradient overlay opacity: 90% to 95%. Action buttons appear (scale 90% to 100%, opacity 0 to 100%). |
| **Click behavior** | Clicking anywhere on the card (except action buttons) fires `onViewDetails` which opens the Scenario Detail Modal and increments view count. |

### Card Internal Elements

| Element | Description | Background Color | Text/Icon Color | Position within Card | Conditional Logic |
| --- | --- | --- | --- | --- | --- |
| Cover image | Full-bleed image, `object-cover` | n/a | n/a | Behind all layers | Rendered if `scenario.cover_image_url` exists. Uses `objectPosition` from `cover_image_position`. |
| No-image fallback | Large initial letter | `bg-gradient-to-br from-slate-800 to-slate-900` | `text-white/10` | Centered | Shown when no cover image. Displays first character of title at `text-6xl font-black uppercase tracking-tighter italic`. |
| Gradient overlay | Darkening gradient | `bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent` | n/a | Over image, under content | Always rendered. Opacity 90%, increases to 95% on hover. |
| SFW/NSFW badge | Content rating pill | `bg-[#2a2a2f] backdrop-blur-sm` | SFW: `text-blue-400`. NSFW: `text-red-400` | Top-right corner (`top-4 right-4`) | Only shown if `contentThemes.storyType` exists |
| Remix (edit) badge | Pencil icon | `bg-[#2a2a2f] backdrop-blur-sm` | `text-purple-400` | Top-left corner (`top-4 left-4`) | Only shown if `allow_remix === true` |
| Like button (hover) | Heart icon button | Liked: `bg-rose-500 text-white`. Not liked: `bg-white/90 text-slate-700` | See background | Center of card (hover overlay) | Only visible on hover. |
| Save button (hover) | Bookmark icon button | Saved: `bg-amber-500 text-white`. Not saved: `bg-white/90 text-slate-700` | See background | Center of card (hover overlay) | Only visible on hover. |
| Play button (hover) | "Play" text + Play icon | `bg-blue-600` | White | Center of card (hover overlay) | Only visible on hover. |
| Title | Story title text | Transparent | `text-white`, hover: `text-blue-300` | Bottom-left, overlaying gradient | Always visible. `text-lg font-black leading-tight tracking-tight truncate`. |
| Description | Story description | Transparent | `text-white/60` | Below title | Always visible. `text-xs italic line-clamp-2 leading-relaxed min-h-[2.5rem]`. |
| Stats row | View, Like, Save, Play counts | Transparent | `text-white/50` | Below description | Always visible. `text-[10px]` with `gap-3`. |
| Author line | "Written by: {name}" | Transparent | `text-white/50` | Bottom of card, below stats | Always visible. `text-[11px] font-medium`. |

* * *

## 5\. MODALS & OVERLAYS

### Modal: Scenario Detail Modal

| Field | Detail |
| --- | --- |
| **Trigger** | Clicking anywhere on a `GalleryScenarioCard` (fires `onViewDetails`). Also increments `view_count`. |
| **Component File** | `src/components/chronicle/StoryDetailModal.tsx` |
| **Overlay** | `bg-black/90 backdrop-blur-sm` |
| **Dimensions** | `max-w-[900px] max-h-[700px]`. Two-column layout on desktop (`md:flex-row`), single column on mobile. |
| **Border radius** | `rounded-[32px]` |
| **Background** | `bg-[#2a2a2f]` |
| **Border** | No explicit border; Chronicle bevel comes from inset shell shadows |

**Left Column (`w-[340px]` desktop):** Cover image (3:4 aspect), SFW/NSFW badge, remix badge, action buttons row (Like, Save, Play), "Remove from Gallery" button (publisher only).

**Right Column (native `overflow-y-auto`, `scrollbar-none`, `flex-1`):** Title, star/spice ratings, stats row, creator section (clickable avatar + name), status badges, synopsis, content themes grid, trigger warnings, custom tags, characters section (circular avatars), reviews section with pagination. The modal intentionally uses native scrolling here so mouse-wheel and trackpad gestures work reliably without a visible scrollbar thumb.

**Status badge behavior:** The purple `EDITABLE` badge shows a tooltip clarifying that loading the story into Story Builder creates a separate custom version and does not change the original published story.

**Review CTA:** `Leave a Review` / `Edit Review` uses the Chronicle raised slate-blue pill treatment instead of a flat fill.

### Modal: Review Modal

| Field | Detail |
| --- | --- |
| **Trigger** | "Leave a Review" or "Edit Review" button in Scenario Detail Modal |
| **Component File** | `src/components/chronicle/ReviewModal.tsx` |
| **Dimensions** | `max-w-xl max-h-[90vh]` |

Chronicle-styled quick review flow with three tiers:
- **Quick rating:** `Story` 1-5 stars (main rating) and optional `Spice` 1-5 flames
- **Additional Feedback:** collapsible optional category ratings for deeper creator feedback (`Concept Strength`, `Motivation / Tension`, `Worldbuilding & Vibe`, `Replayability`, `Character Details & Complexity`)
- **Optional comment:** separate freeform note field

Submit is enabled once the user has set either a story rating or a spice rating. The detailed category ratings stay hidden behind the optional expandable Additional Feedback section so the modal stays low-friction by default, and the modal body remains scrollable when the section is expanded. Clicking outside this nested modal closes only the review modal and returns the user to the Scenario Detail Modal.

### Modal: Delete Confirm Dialog

| Field | Detail |
| --- | --- |
| **Trigger** | "Delete Review" button in Review Modal |
| **Component File** | `src/components/chronicle/DeleteConfirmDialog.tsx` |

* * *

## 6\. DATA ARCHITECTURE

### 6a. Primary Data Fetching

-   **No dedicated hook.** Data is fetched directly inside `GalleryHub.tsx` using a `useCallback` + `useEffect` pattern (not React Query).
-   **Function:** `loadScenarios()` in `GalleryHub.tsx`
-   **Internally calls:** `fetchPublishedScenarios()`, `getUserInteractions()` from `src/services/gallery-data.ts`

### 6b. React Query Cache Key(s)

-   **None.** The Community Gallery does NOT use React Query.

### 6c. Cache & Sync Strategy

No IndexedDB caching. No background sync. Fresh fetch every time.

### 6d. Supabase Tables

| Table Name | Relevant Columns | RLS Enabled |
| --- | --- | --- |
| `published_scenarios` | id, scenario\_id, publisher\_id, allow\_remix, tags, like/save/play/view\_count, avg\_rating, review\_count, is\_published | Yes |
| `scenarios` | id, title, description, cover\_image\_url, cover\_image\_position, world\_core | Yes |
| `profiles` | id, username, avatar\_url, display\_name | Yes |
| `content_themes` | scenario\_id, story\_type, genres, origin, trigger\_warnings, custom\_tags, character\_types | Yes |
| `scenario_likes` | id, published\_scenario\_id, user\_id | Yes |
| `saved_scenarios` | id, user\_id, published\_scenario\_id, source\_scenario\_id | Yes |
| `scenario_reviews` | id, published\_scenario\_id, user\_id, all rating columns, comment, raw\_weighted\_score | Yes |
| `creator_follows` | id, follower\_id, creator\_id | Yes |
| `characters` | id, name, avatar\_url, avatar\_position, scenario\_id | Yes |

### 6e. Mutations

| Function | Operation | Optimistic Update |
| --- | --- | --- |
| `toggleLike()` | INSERT/DELETE on scenario\_likes + RPC increment/decrement\_like\_count | Yes |
| `saveScenarioToCollection()` | INSERT on saved\_scenarios + RPC increment\_save\_count | Yes |
| `unsaveScenario()` | DELETE on saved\_scenarios + RPC decrement\_save\_count | Yes |
| `unpublishScenario()` | UPDATE published\_scenarios set is\_published = false | Yes |
| `incrementPlayCount()` | RPC increment\_play\_count | Fire-and-forget |
| `incrementViewCount()` | RPC increment\_view\_count | Yes |
| `submitReview()` | UPSERT on scenario\_reviews | No (refetches) |
| `deleteReview()` | DELETE on scenario\_reviews | No (refetches) |

* * *

## 7\. COMPONENT TREE

```
<Index>
  <header> (tab === "gallery")
    "Community Gallery" title
    Sort pill bar (All/Recent/Liked/Saved/Played/Following)
  </header>
  <GalleryHub>
    <header> (glassmorphic search bar)
    <GalleryCategorySidebar />
    <main>
      Active filter chips (conditional)
      <GalleryScenarioCard /> (x N)
    </main>
    <StoryDetailModal /> (conditional)
      <StarRating />
      <SpiceRating />
      <ReviewModal /> (conditional)
        <StarRating /> (interactive, x9)
        <SpiceRating /> (interactive)
        <DeleteConfirmDialog /> (conditional)
  </GalleryHub>
```

* * *

## 8\. CUSTOM EVENTS

The Gallery does not dispatch or listen for custom DOM events. All communication is via React props and callbacks (`onPlay`, `onSaveChange`, `onSortChange`).

* * *

## 9\. STYLING REFERENCE

### 9a. Key Colors

| Element | Hex | Tailwind |
| --- | --- | --- |
| Gallery background | #121214 | `bg-[#121214]` |
| Sort pill / action accent | #4a5f7f | `bg-[#4a5f7f]` |
| Card border | #4a5f7f | `border-[#4a5f7f]` |
| Category sidebar | #18181b | `bg-[#18181b]` |
| Category accent | Yellow 400 | `bg-yellow-400` |
| Detail modal | #121214 | `bg-[#121214]` |
| Like active | Rose 500 | `bg-rose-500` |
| Save active | Amber 500 | `bg-amber-500` |
| Play button | #3b82f6 | `bg-[#3b82f6]` |

### 9b. Key Typography

| Context | Size | Weight |
| --- | --- | --- |
| Page title | text-lg | font-black uppercase |
| Card title | text-lg | font-black |
| Card description | text-xs | italic |
| Card stats | text-\[10px\] | normal |
| Detail modal title | text-3xl md:text-4xl | font-extrabold |

### 9c. Key Radii

| Element | Value |
| --- | --- |
| Card | rounded-\[2rem\] |
| Detail modal | rounded-\[32px\] |
| Review modal | rounded-2xl |

* * *

## 10\. CROSS-PAGE DEPENDENCIES

-   Index.tsx header renders sort pills and page title
-   `handleGalleryPlay` callback switches to chat interface tab
-   `handleGallerySaveChange` triggers refresh of saved scenarios in Your Stories tab
-   Creator Profile page navigation via `/creator/{publisherId}`
-   Authentication required for Like, Save, Play, Review actions

* * *

## 11\. SECURITY & ACCESS CONTROL

-   Gallery viewable by all authenticated users
-   Like, Save, Play, Review require authentication
-   RLS enforced on all queries
-   "Remove from Gallery" is publisher-only (not admin-only)
-   All interaction mutations include user\_id scoping

* * *

## 12\. KNOWN ISSUES & GOTCHAS

-   RESOLVED: 2026-04-10 — The gallery discovery shell used a disconnected control model where `Browse Categories` lived on the far right while the filter panel opened on the left. The trigger now lives on the left rail, visually aligns with the panel, and uses Chronicle shell styling instead of the old off-theme yellow accent treatment.

* * *

## 13\. RECENTLY IMPLEMENTED IMPROVEMENTS

-   **Gallery discovery shell refresh**: Reworked the Community Gallery toolbar so `Browse Categories` now lives on the left rail and visually aligns with the left filter panel. Replaced the older flat search field + separate Search button with a Chronicle recessed search surface that auto-applies after a short debounce, and restyled the filter panel itself into Chronicle dark slate-blue shell language.
-   **Scenario detail modal interaction polish**: Replaced the modal's custom scrollbar wrapper with native hidden-scroll behavior so trackpad/wheel scrolling works reliably in the right detail pane. Added explanatory tooltip copy to the `EDITABLE` badge and upgraded the review CTA to the Chronicle raised slate-blue pill style.
-   **Review flow simplification**: Reworked `ReviewModal` into a Chronicle-styled quick review surface with story stars, optional spice flames, an expandable Additional Feedback ratings section, and a separate optional comment field instead of the old always-open weighted questionnaire.
-   **Infinite scroll**: Stories load 20 at a time as user scrolls. IntersectionObserver triggers fetching next page. "You've reached the end" message when all loaded.
-   **Server-side filtering**: All content theme filters (story type, genre, origin, trigger warnings, custom tags) are now applied server-side via the `fetch_gallery_scenarios` RPC function.
-   **Full-text search**: Search now works on story titles and descriptions (not just tags). Uses PostgreSQL GIN index with `to_tsvector` plus ILIKE fallback for partial matches. Hashtag prefixed terms (#fantasy) search tags; plain text searches titles/descriptions.
-   **View count deduplication**: Views tracked in `scenario_views` table with 24-hour deduplication via `record_scenario_view` RPC. Same user viewing same story multiple times within 24 hours only counts once.
-   **Real-time updates**: Supabase Realtime subscription on `published_scenarios` table. New stories appear automatically; unpublished/hidden stories are removed from the grid without refresh.
-   **React Query migration**: Replaced manual useState/useEffect/fetchInProgress with `useInfiniteQuery`. Provides automatic caching (30s stale time), deduplication, loading states, and error handling.
-   **Following tab fix**: Publisher IDs sent via RPC POST body instead of URL query params. No URL length limits regardless of how many creators are followed.

## 14\. PLANNED / FUTURE CHANGES

-   No planned changes at this time.

> Last updated: 2026-04-10 — refreshed the gallery discovery toolbar, left filter rail, and Chronicle search shell
