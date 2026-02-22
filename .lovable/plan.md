
# Community Gallery Page -- Full Documentation

This plan involves writing the complete "Community Gallery" page documentation into the existing App Guide document titled "Community Gallery Page (St..." in the Admin panel. The content below is the full markdown document that will be saved into that guide entry.

---

## What Will Be Written

The following is the complete, filled-out documentation for the Community Gallery page, following the template structure from the uploaded outline. It covers every section: page overview, layout, UI elements inventory, card anatomy, modals, data architecture, component tree, events, styling, cross-page dependencies, security, known issues, and planned changes.

---

## Technical Details

### File Changed
Only the **content** of the existing App Guide document "Community Gallery Page (St...)" will be updated via the editor UI (no source file changes). The markdown content to be saved is below.

---

### Full Document Content

```markdown
# PAGE: COMMUNITY GALLERY

---

## 1. PAGE OVERVIEW

| Field | Detail |
|---|---|
| **Page Title** | Community Gallery |
| **Route / URL Path** | No dedicated route. Rendered as a tab (`tab === "gallery"`) inside `src/pages/Index.tsx`. A legacy standalone route exists at `/gallery` via `src/pages/Gallery.tsx` but is not used in the main app flow. |
| **Primary Source File** | `src/components/chronicle/GalleryHub.tsx` |
| **Purpose** | A public-facing marketplace of user-published interactive stories. Users browse, search, filter, like, save, and play stories published by other creators. It also provides access to the Scenario Detail Modal for full story previews, character rosters, reviews, and creator profiles. |
| **User Role Access** | All authenticated users. Unauthenticated users are redirected to `/auth` if accessing via the legacy `/gallery` route. Within the main app (`Index.tsx`), the sidebar item is visible to all logged-in users. |
| **Navigation Sidebar** | Label: "Community Gallery", Icon: `Globe` (Lucide), Position: 1st item in sidebar nav order. |
| **Entry Points** | 1. Sidebar nav click ("Community Gallery"). 2. Legacy direct URL `/gallery`. 3. Programmatic navigation via `react-router-dom` `useNavigate` from other pages. |

---

## 2. LAYOUT & STRUCTURE

### Top-level layout wrapper
The Gallery tab is rendered inside the main app shell defined in `src/pages/Index.tsx`. The shell provides:
- A collapsible left sidebar (nav items, app logo)
- A top header bar (`h-16`, white background, `border-b border-slate-200`)
- A main content area (`flex-1 overflow-hidden`)

When `tab === "gallery"`, the header displays the page title and sort toggle pills. The main content area renders `<GalleryHub />` which manages its own internal layout.

### Page header row (within Index.tsx header)
- **Left side**: Page title "Community Gallery" (`text-lg font-black text-slate-900 uppercase tracking-tight`)
- **Right of title**: Sort toggle pill bar -- a horizontally scrollable row of pill buttons inside a dark capsule container (`bg-[#2b2b2e] rounded-full p-1 border border-[#2b2b2e]`). Pills: "All Stories", "Recent", "Liked", "Saved", "Played", "Following". Active pill: `bg-[#4a5f7f] text-white shadow-sm`. Inactive: `text-[#a1a1aa] hover:text-[#e4e4e7]`. Each pill: `px-4 py-1.5 rounded-full text-xs font-bold`.
- **Right side of header**: No action buttons specific to the Gallery tab.

### GalleryHub internal layout (`GalleryHub.tsx`)
The component is a full-height flex column with three vertical zones:

1. **Glassmorphic search header** (`sticky top-0 z-50`):
   - Background: `rgba(18, 18, 20, 0.8)` with `backdrop-filter: blur(12px)`
   - Contains: search input (left, flex-1) + "Browse Categories" button (right, flex-shrink-0)

2. **Blue gradient divider** (`sticky top-[60px] z-40 h-px opacity-50`):
   - `linear-gradient(90deg, transparent 0%, rgb(59, 130, 246) 50%, transparent 100%)`

3. **Main content area** (flex row):
   - **Left**: `<GalleryCategorySidebar />` (conditional, 288px wide, `w-72`)
   - **Right**: Scrollable main content with active filter chips + card grid

### Secondary panels / drawers
- **Category Sidebar** (`GalleryCategorySidebar.tsx`): A left-side panel that slides in when "Browse Categories" is clicked. Width: `w-72` (288px). Background: `bg-[#18181b]`. Border-right: `border-r border-white/10`. Has a yellow accent line at top (`h-0.5 bg-yellow-400`).
- **Scenario Detail Modal** (`ScenarioDetailModal.tsx`): Full-screen overlay modal. Triggered by clicking any card.
- **Review Modal** (`ReviewModal.tsx`): Nested modal within the Detail Modal for leaving/editing reviews.

### Empty state
- **Icon**: `Globe` (Lucide), `w-10 h-10 text-white/30`, inside a `w-20 h-20 bg-white/10 rounded-full` circle
- **Title**: "No stories found" (or "No stories from followed creators" when on Following tab). `text-xl font-bold text-white`
- **Subtitle**: Contextual message. `text-white/60 max-w-md`
- **No CTA button** in the empty state.

### Loading behavior
A centered `Loader2` spinner (`w-8 h-8 animate-spin text-slate-400`) is shown inside a `h-64` container while `isLoading` is true. This is one of the few pages that does NOT use the IndexedDB caching layer -- it fetches directly from Supabase on every load via `fetchPublishedScenarios()`.

---

## 3. UI ELEMENTS -- COMPLETE INVENTORY

| Element | Type | Label / Text | Position on Screen | Color -- Background | Color -- Text/Icon | Size / Weight | Interaction / Behavior | Component File | Notes |
|---|---|---|---|---|---|---|---|---|---|
| Page title | Heading | "Community Gallery" | Header bar, left side | Transparent | `text-slate-900` | `text-lg font-black uppercase tracking-tight` | Static | `src/pages/Index.tsx` | Rendered by Index.tsx header, not GalleryHub |
| Sort pill bar | Button group | "All Stories", "Recent", "Liked", "Saved", "Played", "Following" | Header bar, right of title | Container: `bg-[#2b2b2e]` | Active: white. Inactive: `#a1a1aa` | `text-xs font-bold` | Clicking sets `gallerySortBy` state, triggers data refetch | `src/pages/Index.tsx` | Sort state is lifted to Index.tsx and passed as prop |
| Search input | Text input | No placeholder text | GalleryHub header, left | `bg-[#3a3a3f]/50 border border-white/10` | `text-white` | Full width, `py-3 pl-12 pr-24 rounded-xl` | Type search terms, press Enter or click Search to filter by tags | `src/components/chronicle/GalleryHub.tsx` | Splits input on commas/semicolons/spaces, strips `#` prefix |
| Search icon | Icon | n/a | Inside search input, left | Transparent | `text-zinc-400` | `w-5 h-5` | Decorative | `src/components/chronicle/GalleryHub.tsx` | Lucide `Search` |
| Search button | Button | "Search" | Inside search input, right | `bg-[#4a5f7f]` | White | `px-4 py-1.5 rounded-lg font-semibold text-sm` | Triggers tag search | `src/components/chronicle/GalleryHub.tsx` | Hover: `bg-[#5a6f8f]` |
| Browse Categories button | Button | "Browse Categories" | GalleryHub header, far right | Default: `bg-[#4a5f7f]`, Active: `bg-[#5a6f8f]` | White | `px-4 py-3 rounded-lg font-semibold text-sm` | Toggles category sidebar open/close | `src/components/chronicle/GalleryHub.tsx` | Shows filter count badge when filters active |
| Filter count badge | Badge | Number (e.g. "3") | On Browse Categories button, right | `bg-white/20` | White | `px-1.5 py-0.5 rounded-full text-xs` | Static, shows count of active category filters | `src/components/chronicle/GalleryHub.tsx` | Only rendered when `activeFilterCount > 0` |
| Active filter chips | Chip/pill | Filter name (e.g. "#romance", "Fantasy") | Below GalleryHub header, in filter bar | Search tags: `bg-white/20`. Story types: `bg-blue-500/20`. Genres: `bg-purple-500/20`. Origins: `bg-green-500/20`. Trigger warnings: `bg-amber-500/20` | Search: white. Types: `text-blue-400`. Genres: `text-purple-400`. Origins: `text-green-400`. Warnings: `text-amber-400` | `px-2 py-1 rounded-full text-xs font-medium` | Click X to remove individual filter | `src/components/chronicle/GalleryHub.tsx` | Each chip has an X button (`hover:text-red-300`) |
| "Clear all" link | Text button | "Clear all" | After filter chips, right | Transparent | `text-white/70 hover:text-white` | `text-sm underline` | Clears all search tags and category filters | `src/components/chronicle/GalleryHub.tsx` | |
| "Filtering by:" label | Text | "Filtering by:" | Before filter chips | Transparent | `text-white/70` | `text-sm` | Static | `src/components/chronicle/GalleryHub.tsx` | |
| Loading spinner | Spinner | n/a | Center of content area | Transparent | `text-slate-400` | `w-8 h-8` | Animated spin | `src/components/chronicle/GalleryHub.tsx` | Lucide `Loader2` |
| Empty state icon | Icon container | Globe icon | Center of content area | `bg-white/10` (circle) | `text-white/30` | Circle: `w-20 h-20 rounded-full`. Icon: `w-10 h-10` | Static | `src/components/chronicle/GalleryHub.tsx` | |
| Empty state title | Heading | "No stories found" / "No stories from followed creators" | Center, below icon | Transparent | White | `text-xl font-bold` | Static | `src/components/chronicle/GalleryHub.tsx` | Text varies by context |
| Empty state description | Paragraph | Contextual help text | Center, below title | Transparent | `text-white/60` | `max-w-md` | Static | `src/components/chronicle/GalleryHub.tsx` | |

---

## 4. CARDS / LIST ITEMS

### Card Grid Layout
- Grid classes: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 lg:gap-8`
- Container padding: `px-8 pb-10`

### Card Container (`GalleryScenarioCard.tsx`)

| Property | Value |
|---|---|
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
|---|---|---|---|---|---|
| Cover image | Full-bleed image, `object-cover` | n/a | n/a | Behind all layers | Rendered if `scenario.cover_image_url` exists. Uses `objectPosition` from `cover_image_position` ({x}% {y}%). |
| No-image fallback | Large initial letter | `bg-gradient-to-br from-slate-800 to-slate-900` | `text-white/10` | Centered | Shown when no cover image. Displays first character of title at `text-6xl font-black uppercase tracking-tighter italic`. |
| Gradient overlay | Darkening gradient | `bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent` | n/a | Over image, under content | Always rendered. Opacity 90%, increases to 95% on hover. |
| SFW/NSFW badge | Content rating pill | `bg-[#2a2a2f] backdrop-blur-sm` | SFW: `text-blue-400`. NSFW: `text-red-400` | Top-right corner (`top-4 right-4`) | Only shown if `contentThemes.storyType` exists |
| Remix (edit) badge | Pencil icon | `bg-[#2a2a2f] backdrop-blur-sm` | `text-purple-400` | Top-left corner (`top-4 left-4`) | Only shown if `allow_remix === true` |
| Like button (hover) | Heart icon button | Liked: `bg-rose-500 text-white`. Not liked: `bg-white/90 text-slate-700` | See background | Center of card (hover overlay) | Only visible on hover. `p-2.5 rounded-xl shadow-2xl`. Heart icon filled when liked. |
| Save button (hover) | Bookmark icon button | Saved: `bg-amber-500 text-white`. Not saved: `bg-white/90 text-slate-700` | See background | Center of card (hover overlay) | Only visible on hover. `p-2.5 rounded-xl shadow-2xl`. Bookmark icon filled when saved. |
| Play button (hover) | "Play" text + Play icon | `bg-blue-600` | White | Center of card (hover overlay) | Only visible on hover. `px-4 py-2.5 rounded-xl font-bold text-xs shadow-2xl`. Hover: `bg-blue-500`. |
| Title | Story title text | Transparent | `text-white`, hover: `text-blue-300` | Bottom-left, overlaying gradient | Always visible. `text-lg font-black leading-tight tracking-tight truncate`. Single line with truncation. |
| Description | Story description | Transparent | `text-white/60` | Below title | Always visible. `text-xs italic line-clamp-2 leading-relaxed min-h-[2.5rem]`. 2-line clamp with minimum height to prevent layout shift. Falls back to "No description provided." |
| Stats row | View, Like, Save, Play counts | Transparent | `text-white/50` | Below description | Always visible. `text-[10px]` with `gap-3`. Icons: `w-3 h-3`. Like icon fills rose when liked. Bookmark icon fills amber when saved. |
| Author line | "Written by: {name}" | Transparent | `text-white/50` | Bottom of card, below stats | Always visible. `text-[11px] font-medium`. Falls back to "Anonymous". Uses `display_name` first, then `username`. |

---

## 5. MODALS & OVERLAYS

---

### Modal: Scenario Detail Modal

| Field | Detail |
|---|---|
| **Trigger** | Clicking anywhere on a `GalleryScenarioCard` (fires `onViewDetails`). Also increments `view_count` via `incrementViewCount()`. |
| **Component File** | `src/components/chronicle/ScenarioDetailModal.tsx` |
| **Overlay** | `bg-black/90 backdrop-blur-sm` (via Radix `DialogOverlay`) |
| **Dimensions** | `max-w-6xl max-h-[90vh]`. Two-column layout on desktop (`md:flex-row`), single column on mobile. |
| **Border radius** | `rounded-[32px]` |
| **Background** | `bg-[#121214]` |
| **Border** | `border border-white/10` |
| **Shadow** | `shadow-[0_20px_50px_rgba(0,0,0,0.5)]` |
| **Close button** | Top-right (`top-4 right-4 z-20`). X icon (`w-6 h-6`), `text-white/20 hover:text-white`. |

**Left Column (md:w-[420px]):**

| Element | Description | Style | Conditional |
|---|---|---|---|
| Cover image | 3:4 aspect ratio, `rounded-2xl`, `bg-[#2a2a2f]` fallback | Full object-cover with custom `objectPosition` | Always rendered |
| SFW/NSFW badge | Overlaid on cover image, top-right | Same style as card badge | If `contentThemes.storyType` exists |
| Remix badge | Overlaid on cover image, top-left | Pencil icon in `bg-[#2a2a2f]` pill | If `allowRemix` is true |
| Gradient overlay | Bottom of cover image | `h-32 bg-gradient-to-t from-black/60 to-transparent` | Always |
| Action buttons row | Like, Save, Play buttons in a horizontal row | Each `flex-1 h-12 rounded-xl`. Like: rose tones when active. Save: amber tones when active. Play: `bg-[#3b82f6]`. | Gallery mode (not owned): Like + Save + Play. Owned mode: Edit + Play. |
| "Remove from Gallery" button | Full-width button below actions | `h-10 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white rounded-xl font-semibold text-sm` | Only if `canUnpublish` is true (user is the publisher) |

**Right Column (ScrollArea, flex-1):**

| Element | Description | Style | Conditional |
|---|---|---|---|
| Title | Story title | `text-3xl md:text-4xl font-extrabold text-white tracking-tight` | Always |
| Story + Spice ratings | Cumulative star and flame ratings | `StarRating` and `SpiceRating` components, `size={16}` | Only in gallery mode, only if `reviewCount > 0` |
| Stats row | Eye, Heart, Bookmark, Play with counts | `text-[#94a3b8]`, icons `w-4 h-4`, counts `text-xs font-bold` | Gallery mode only (not owned) |
| Creator section | Clickable avatar + name + creator rating | Avatar: `w-14 h-14 rounded-full` with purple-blue gradient. Name: `text-[#4a5f7f] font-medium`. | Gallery mode only. Clicking navigates to `/creator/{publisherId}`. |
| Status badges | "PUBLISHED" (emerald), "EDITABLE" (purple) | `px-2.5 py-1 rounded-lg text-xs font-bold` | PUBLISHED: owned + published. EDITABLE: allowRemix true. |
| Synopsis section | Description text block | Header: `text-xs font-bold text-white/40 uppercase tracking-widest`. Body: `text-[#e2e8f0] leading-relaxed whitespace-pre-wrap` | Always |
| Content Themes grid | Genre, Character Types, Story Origin | `grid grid-cols-2 md:grid-cols-3 gap-6`. Labels: `text-xs font-bold text-white/40 uppercase`. Values: `text-sm text-white`. | Only if any content themes exist |
| Trigger Warnings | Separate row below themes grid | `text-sm text-red-400 font-medium` | If trigger warnings exist |
| Custom Tags | Below trigger warnings | `text-sm text-white` | If custom tags exist |
| Characters section | Circular avatar gallery (up to 8) | Avatar: `w-14 h-14 rounded-full border-2 border-white/10`. Name: `text-[10px] text-white/60 max-w-[4rem] truncate`. | Always rendered. Shows skeleton loaders while fetching. |
| Reviews section | Review cards with star/spice ratings | Gradient divider above. Review card: `p-3 rounded-xl bg-white/5 border border-white/5`. Reviewer avatar: `w-7 h-7`. | Gallery mode only, if `publishedScenarioId` exists |
| "Leave a Review" / "Edit Review" button | Opens Review Modal | `px-3 py-1.5 bg-[#4a5f7f] hover:bg-[#3d5170] text-white text-xs font-semibold rounded-full` | If user is authenticated |
| "See more reviews" button | Loads next page of reviews | `text-xs font-medium text-white/50 hover:text-white/80` | If `hasMoreReviews` is true (pagination: 5 per page) |

---

### Modal: Review Modal

| Field | Detail |
|---|---|
| **Trigger** | "Leave a Review" or "Edit Review" button in Scenario Detail Modal |
| **Component File** | `src/components/chronicle/ReviewModal.tsx` |
| **Overlay** | `bg-black/90 backdrop-blur-sm` |
| **Dimensions** | `max-w-xl max-h-[90vh]` |
| **Background** | `bg-[#121214]` |
| **Border** | `border border-white/10`, `rounded-2xl` |
| **Header** | "Rate This Scenario" (`text-lg font-bold text-white`). Close X button top-right. |

**Rating Categories (9 total, from `src/services/review-ratings.ts`):**

| Category | Label | Weight |
|---|---|---|
| conceptStrength | Concept Strength | 0.12 |
| initialSituation | Initial Situation | 0.12 |
| roleClarity | Role Clarity | 0.10 |
| motivationTension | Motivation / Tension | 0.10 |
| tonePromise | Tone Promise | 0.08 |
| lowFrictionStart | Low-Friction Start | 0.10 |
| worldbuildingVibe | Worldbuilding & Vibe | 0.12 |
| replayability | Replayability | 0.12 |
| characterDetailsComplexity | Character Details & Complexity | 0.14 |

Each category: label (`text-sm font-medium text-white`) + description (`text-sm text-white/40`) on left, interactive `StarRating` (`size={22}`) on right.

**Additional Fields:**
- Spice Level: Interactive `SpiceRating` component (flame icons, `size={22}`), separated by `border-t border-white/10`
- Overall Score Preview: Auto-computed weighted score displayed as non-interactive `StarRating` with numeric value
- Comment: `Textarea`, optional, max 1000 chars, `bg-white/5 border-white/10 text-white`

**Footer Buttons:**
| Button | Label | Background | Text | Action |
|---|---|---|---|---|
| Submit/Update | "Submit Review" or "Update Review" | `bg-[#4a5f7f] hover:bg-[#3d5170]` | White | Calls `submitReview()` (upsert to `scenario_reviews`), then `onReviewSubmitted()` callback |
| Delete (edit mode only) | "Delete Review" | `bg-red-600/20 border border-red-500/30` | `text-red-400` | Opens `DeleteConfirmDialog`, then calls `deleteReview()` |

**Validation:** All 9 rating categories and spice level must be >= 1 before submit is enabled (`disabled={!allRated}`).

---

### Modal: Delete Confirm Dialog

| Field | Detail |
|---|---|
| **Trigger** | "Delete Review" button in Review Modal |
| **Component File** | `src/components/chronicle/DeleteConfirmDialog.tsx` |
| **Title** | "Delete your review?" |
| **Message** | "Your ratings and comment will be permanently removed." |

---

## 6. DATA ARCHITECTURE

### 6a. Primary Data Fetching
- **No dedicated hook.** Data is fetched directly inside `GalleryHub.tsx` using a `useCallback` + `useEffect` pattern (not React Query).
- **Function:** `loadScenarios()` in `GalleryHub.tsx`
- **Internally calls:** `fetchPublishedScenarios()`, `getUserInteractions()` from `src/services/gallery-data.ts`
- **Returns:** Sets local state: `scenarios` (array of `PublishedScenario`), `likes` (Set), `saves` (Set)

### 6b. React Query Cache Key(s)
- **None.** The Community Gallery does NOT use React Query. All data is managed via local `useState` and fetched imperatively on mount / filter change.

### 6c. Cache & Sync Strategy
```
1. Component mounts or sort/filter changes -> loadScenarios() fires
2. Guard: fetchInProgress.current prevents duplicate fetches
3. If sortBy === 'following':
   a. Fetch creator_follows for current user -> get creatorIds
   b. If no follows, set empty array and return
   c. Call fetchPublishedScenarios() with creatorIds filter
4. Otherwise:
   a. Call fetchPublishedScenarios(searchTags, sortBy, 50, 0, contentThemeFilters)
5. After data returns:
   a. Set scenarios state
   b. If user logged in: call getUserInteractions() to get like/save Sets
6. No IndexedDB caching. No background sync. Fresh fetch every time.
```

### 6d. React Query Configuration
N/A -- this page does not use React Query.

### 6e. Supabase Tables

| Table Name | Relevant Columns | RLS Enabled | Scoping |
|---|---|---|---|
| `published_scenarios` | `id`, `scenario_id`, `publisher_id`, `allow_remix`, `tags`, `like_count`, `save_count`, `play_count`, `view_count`, `avg_rating`, `review_count`, `is_published`, `created_at`, `updated_at` | Yes | Public read (`is_published = true`), write scoped to `publisher_id = auth.uid()` |
| `scenarios` | `id`, `title`, `description`, `cover_image_url`, `cover_image_position`, `world_core` | Yes | Joined via `published_scenarios.scenario_id`. Inner join ensures only published scenarios' data is returned. |
| `profiles` | `id`, `username`, `avatar_url`, `display_name` | Yes | Public read for profile display. Fetched separately by publisher IDs. |
| `content_themes` | `scenario_id`, `story_type`, `genres`, `origin`, `trigger_warnings`, `custom_tags`, `character_types` | Yes | Fetched by scenario_id for published scenarios |
| `scenario_likes` | `id`, `published_scenario_id`, `user_id` | Yes | Scoped to `user_id = auth.uid()` |
| `saved_scenarios` | `id`, `user_id`, `published_scenario_id`, `source_scenario_id`, `created_at` | Yes | Scoped to `user_id = auth.uid()` |
| `scenario_reviews` | `id`, `published_scenario_id`, `user_id`, `concept_strength`, `initial_situation`, `role_clarity`, `motivation_tension`, `tone_promise`, `low_friction_start`, `worldbuilding_vibe`, `replayability`, `character_details_complexity`, `spice_level`, `comment`, `raw_weighted_score`, `created_at` | Yes | Read: public. Write: scoped to own user_id. Upsert on `(published_scenario_id, user_id)`. |
| `creator_follows` | `id`, `follower_id`, `creator_id` | Yes | Used only by "Following" tab to get followed creator IDs |
| `characters` | `id`, `name`, `avatar_url`, `avatar_position`, `scenario_id` | Yes | Fetched by `scenario_id` for detail modal character display |

### 6f. Mutations (service functions in `src/services/gallery-data.ts`)

| Function | Operation | Optimistic Update | Table(s) Affected |
|---|---|---|---|
| `toggleLike()` | INSERT or DELETE on `scenario_likes` + RPC `increment_like_count` / `decrement_like_count` | Yes -- updates `likes` Set and `like_count` in local `scenarios` state immediately | `scenario_likes`, `published_scenarios` |
| `saveScenarioToCollection()` | INSERT on `saved_scenarios` + RPC `increment_save_count` | Yes -- updates `saves` Set and `save_count` locally, shows toast "Saved to your stories!" | `saved_scenarios`, `published_scenarios` |
| `unsaveScenario()` | DELETE on `saved_scenarios` + RPC `decrement_save_count` | Yes -- updates `saves` Set and `save_count` locally, shows toast "Removed from your collection" | `saved_scenarios`, `published_scenarios` |
| `unpublishScenario()` | UPDATE `published_scenarios` set `is_published = false` | Yes -- removes from local `scenarios` array, closes detail modal, shows toast "Your story has been removed from the Gallery" | `published_scenarios` |
| `incrementPlayCount()` | RPC `increment_play_count` | Fire-and-forget (background) | `published_scenarios` |
| `incrementViewCount()` | RPC `increment_view_count` | Yes -- increments `view_count` in local state optimistically | `published_scenarios` |
| `submitReview()` | UPSERT on `scenario_reviews` | No -- triggers `loadReviews()` callback to refetch | `scenario_reviews` |
| `deleteReview()` | DELETE on `scenario_reviews` | No -- triggers `loadReviews()` callback to refetch | `scenario_reviews` |

### 6g. IndexedDB Keys Used
N/A -- this page does not use IndexedDB.

### 6h. localStorage Keys Used
N/A -- this page does not use localStorage.

---

## 7. COMPONENT TREE

```
<Index>                                                    # src/pages/Index.tsx
  <header> (tab === "gallery")                             # Inline in Index.tsx (~line 1466)
    "Community Gallery" title
    Sort pill bar (All/Recent/Liked/Saved/Played/Following)
  </header>
  <GalleryHub>                                             # src/components/chronicle/GalleryHub.tsx
    <header> (glassmorphic search bar)
      Search input + Search button
      Browse Categories button
    </header>
    <div> (blue gradient divider)
    <GalleryCategorySidebar />                              # src/components/chronicle/GalleryCategorySidebar.tsx
      <CategorySection /> (Story Type)                     # Inline in GalleryCategorySidebar.tsx
      <CategorySection /> (Genre)
      <CategorySection /> (Origin)
      <CategorySection /> (Trigger Warnings)
    <main>
      Active filter chips (conditional)
      <GalleryScenarioCard /> (x N)                        # src/components/chronicle/GalleryScenarioCard.tsx
    </main>
    <ScenarioDetailModal /> (conditional)                   # src/components/chronicle/ScenarioDetailModal.tsx
      <StarRating />                                       # src/components/chronicle/StarRating.tsx
      <SpiceRating />                                      # src/components/chronicle/SpiceRating.tsx
      <ReviewModal /> (conditional)                         # src/components/chronicle/ReviewModal.tsx
        <StarRating /> (interactive, x9)
        <SpiceRating /> (interactive)
        <DeleteConfirmDialog /> (conditional)               # src/components/chronicle/DeleteConfirmDialog.tsx
  </GalleryHub>
```

---

## 8. CUSTOM EVENTS

| Event Name | Direction | What Triggers It | Where It Is Handled | Effect |
|---|---|---|---|---|
| N/A | -- | -- | -- | The Gallery does not dispatch or listen for custom DOM events. All communication is via React props and callbacks (`onPlay`, `onSaveChange`, `onSortChange`). |

---

## 9. STYLING REFERENCE

### 9a. Page-Specific Color Usage

| Element | Purpose | Hex Code | Tailwind Class |
|---|---|---|---|
| Gallery background | Full content area background | `#121214` | `bg-[#121214]` |
| Search bar background | Glassmorphic header | `rgba(18, 18, 20, 0.8)` | Inline style |
| Search input background | Input field | `#3a3a3f` at 50% opacity | `bg-[#3a3a3f]/50` |
| Sort pill / action accent | Active pill, Search button, Browse Categories | `#4a5f7f` | `bg-[#4a5f7f]` |
| Sort pill hover | Button hover state | `#5a6f8f` | `hover:bg-[#5a6f8f]` |
| Sort pill bar container | Dark capsule background | `#2b2b2e` | `bg-[#2b2b2e]` |
| Inactive pill text | Non-selected sort option | `#a1a1aa` | `text-[#a1a1aa]` |
| Card border | Unified brand border | `#4a5f7f` | `border-[#4a5f7f]` |
| Card gradient overlay | Bottom darkening | Slate 950 to transparent | `from-slate-950 via-slate-900/60 to-transparent` |
| Category sidebar background | Sidebar panel | `#18181b` | `bg-[#18181b]` |
| Category sidebar accent | Top border stripe | Yellow 400 | `bg-yellow-400` |
| Blue gradient divider | Decorative separator | `rgb(59, 130, 246)` center | Inline `linear-gradient` |
| Detail modal background | Modal container | `#121214` | `bg-[#121214]` |
| Detail modal overlay | Background dim | Black at 90% | `bg-black/90` |
| Badge background (SFW/NSFW, remix) | Card and modal badges | `#2a2a2f` | `bg-[#2a2a2f]` |
| SFW badge text | Content rating | Blue 400 | `text-blue-400` |
| NSFW badge text | Content rating | Red 400 | `text-red-400` |
| Remix badge icon | Pencil icon | Purple 400 | `text-purple-400` |
| Like active | Heart filled | Rose 500 | `bg-rose-500` (card), `bg-rose-500/20` (modal) |
| Save active | Bookmark filled | Amber 500 | `bg-amber-500` (card), `bg-amber-500/20` (modal) |
| Play button | Primary CTA | `#3b82f6` (Blue 500) | `bg-[#3b82f6]` or `bg-blue-600` |
| Stats text | View/like/save/play counts | `#94a3b8` | `text-[#94a3b8]` |
| Creator name link | Publisher name | `#4a5f7f` | `text-[#4a5f7f]` |
| Trigger warnings text | Warning content | Red 400 | `text-red-400` |
| Review submit button | Primary action | `#4a5f7f` | `bg-[#4a5f7f]` |
| Review delete button | Destructive action | Red 600 at 20% | `bg-red-600/20` |

### 9b. Typography Specs

| Context | Font Size | Font Weight | Color |
|---|---|---|---|
| Page title (Index header) | `text-lg` | `font-black uppercase tracking-tight` | `text-slate-900` |
| Sort pill labels | `text-xs` | `font-bold` | Active: white. Inactive: `#a1a1aa` |
| Card title | `text-lg` | `font-black tracking-tight` | White (hover: `text-blue-300`) |
| Card description | `text-xs` | `font-normal italic` | `text-white/60` |
| Card stats | `text-[10px]` | Normal | `text-white/50` |
| Card author | `text-[11px]` | `font-medium` | `text-white/50` |
| Detail modal title | `text-3xl md:text-4xl` | `font-extrabold tracking-tight` | White |
| Section headers (modal) | `text-xs` | `font-bold uppercase tracking-widest` | `text-white/40` |
| Synopsis body | Default | Normal | `text-[#e2e8f0]` |
| Review card reviewer name | `text-sm` | `font-medium` | White |
| Review timestamp | `text-xs` | Normal | `text-white/30` |
| "Browse Categories" header | `text-sm` | `font-bold` | White |
| Category item text | `text-sm` | Normal | `text-white/70` (active: `text-blue-400`) |

### 9c. Spacing, Layout, Radii

| Element | Value |
|---|---|
| GalleryHub outer padding (header) | `px-6 py-4` |
| Content area padding | `px-8 pt-6 pb-4` (filter area), `px-8 pb-10` (grid area) |
| Card grid gap | `gap-4 lg:gap-8` |
| Card border radius | `rounded-[2rem]` (32px) |
| Search input border radius | `rounded-xl` |
| Button border radius (actions) | `rounded-xl` |
| Badge border radius | `rounded-lg` (badges), `rounded-full` (pills/chips) |
| Detail modal border radius | `rounded-[32px]` |
| Review modal border radius | `rounded-2xl` |
| Category sidebar width | `w-72` (288px) |
| Detail modal left column width | `md:w-[420px]` |

### 9d. Icons

| Icon Name | Library | Used For | Where in UI |
|---|---|---|---|
| `Search` | Lucide | Search input decoration | GalleryHub header, inside input |
| `LayoutGrid` | Lucide | Browse Categories button | GalleryHub header |
| `X` | Lucide | Close/remove buttons | Filter chips, sidebar close, modal close |
| `Globe` | Lucide | Empty state icon, "Remove from Gallery" | Empty state center, Detail modal |
| `Loader2` | Lucide | Loading spinner | Content area center, save/unpublish buttons |
| `Heart` | Lucide | Like button, like count | Card hover overlay, card stats, modal stats |
| `Bookmark` | Lucide | Save button, save count | Card hover overlay, card stats, modal stats |
| `Play` | Lucide | Play button, play count | Card hover overlay, card stats, modal stats |
| `Eye` | Lucide | View count | Card stats, modal stats |
| `Pencil` | Lucide | Remix/editable badge | Card top-left, modal cover image |
| `Edit` | Lucide | Edit button (owned mode) | Detail modal action row |
| `Star` / `StarHalf` | Lucide | Star ratings | StarRating component |
| `Flame` | Lucide | Spice ratings | SpiceRating component |
| `ChevronDown` / `ChevronRight` | Lucide | Collapsible section toggles | Category sidebar sections |
| `Shield` | Lucide | SFW story type icon | Category sidebar |
| `Flame` | Lucide | NSFW story type icon | Category sidebar |
| Various genre icons | Lucide | Genre category icons (Wand2, Heart, Moon, Skull, Rocket, etc.) | Category sidebar |
| `AlertTriangle` | Lucide | Trigger warning category icon | Category sidebar |
| `Tag` | Lucide | Default/fallback category icon | Category sidebar |

---

## 10. CROSS-PAGE DEPENDENCIES

| Dependency | Type | Detail |
|---|---|---|
| Index.tsx header | Parent UI | The sort pill bar and page title are rendered by `Index.tsx`, not `GalleryHub.tsx`. Sort state (`gallerySortBy`) is lifted to Index.tsx and passed as a prop. |
| Index.tsx `handleGalleryPlay` | Callback | When a user clicks "Play" on a gallery story, `GalleryHub` calls `onPlay(scenarioId, publishedScenarioId)`. Index.tsx handles this by calling `handlePlayScenario(scenarioId)` which switches to the chat interface tab. |
| Index.tsx `handleGallerySaveChange` | Callback | When a user saves/unsaves a story, `GalleryHub` calls `onSaveChange()`. Index.tsx responds by re-fetching `savedScenarios` to update the "Your Stories" tab's saved section. |
| Your Stories tab | Downstream data | Saved scenarios appear in the "Your Stories" hub. Saving/unsaving from Gallery triggers a refresh of that data via `fetchSavedScenarios()`. |
| Creator Profile page | Navigation target | Clicking a creator's name/avatar in the Detail Modal navigates to `/creator/{publisherId}`. The creator profile page (`src/pages/CreatorProfile.tsx`) is a read-only public page. |
| `profiles` table | Shared data | Publisher display names and avatars are fetched from the `profiles` table, which is also used by Account settings, Creator Profile, and other features. |
| `published_scenarios` table | Shared data | The same table is written to by the Scenario Builder's publish flow and read by this Gallery. `like_count`, `save_count`, `play_count`, `view_count` are updated by RPC functions. |
| Authentication | Prerequisite | Like, Save, Play, and Review actions require an authenticated user. Toast error "Please sign in to..." is shown for unauthenticated users attempting likes/saves. |

---

## 11. SECURITY & ACCESS CONTROL

| Field | Detail |
|---|---|
| **Authentication required** | Partially. The gallery can be *viewed* by any authenticated user. Like, Save, Play, and Review actions require authentication (toast error if not signed in). The legacy `/gallery` route redirects unauthenticated users to `/auth`. |
| **RLS enforced on all queries** | Yes. `published_scenarios` has public read for `is_published = true`. `scenario_likes`, `saved_scenarios`, `scenario_reviews` are scoped to `user_id = auth.uid()` for writes. |
| **User ID source** | `useAuth()` hook from `src/hooks/use-auth.ts`. Returns `user` object with `user.id`. |
| **What other users can see** | All published stories are visible to all authenticated users. Publisher display name and avatar are public. Review content is public. |
| **Admin-only elements** | None on this page. The "Remove from Gallery" button is publisher-only (checked via `user?.id === liveData.publisher_id`), not admin-only. |
| **Data isolation risks** | Low. All queries filter by `is_published = true`. Interaction mutations (like/save) always include `user.id`. The only risk would be if RPC functions (`increment_like_count`, etc.) lacked proper validation, but these are server-side Postgres functions. |

---

## 12. KNOWN ISSUES & GOTCHAS

- **No pagination.** The gallery fetches up to 50 scenarios per load (`limit = 50`). There is no infinite scroll or "Load More" button. Large galleries will only show the first 50 results.
- **Content theme filtering is client-side.** While search tags use Supabase's `overlaps` operator (server-side), content theme filters (genre, origin, trigger warnings, story type) are applied in JavaScript after fetching all results. This means filtered results may return fewer than 50 items even if more matching records exist.
- **`fetchInProgress` ref guard.** A `useRef(false)` flag prevents duplicate concurrent fetches. If a fetch fails and the ref is not reset (edge case in the `finally` block), subsequent fetches could be blocked. Currently handled correctly in `finally`.
- **View count increments on every detail modal open.** There is no deduplication -- opening the same card repeatedly will inflate view counts.
- **Play count fires in background.** `incrementPlayCount()` errors are caught and logged but not surfaced to the user. The play action proceeds regardless.
- **Review modal has duplicate console.error calls.** Lines 70-71 and 84-85 in `ReviewModal.tsx` each log the error twice.
- **No real-time updates.** If another user likes or publishes a story while the gallery is open, those changes won't appear until the user triggers a refetch (changing sort, applying filters, or reloading).
- **"Following" tab requires separate query.** The Following tab first queries `creator_follows`, then passes the resulting IDs to `fetchPublishedScenarios()` with a `.in()` filter. If a user follows many creators, this could hit URL length limits on the `.in()` clause.

---

## 13. PLANNED / FUTURE CHANGES

- **Pagination / infinite scroll.** Currently capped at 50 results. Cursor-based pagination or "Load More" is needed for a growing library.
- **Server-side content theme filtering.** Moving genre/origin/trigger warning filters to Supabase queries (JSONB containment operators) would improve performance and fix the "fewer than 50 filtered results" issue.
- **Real-time updates.** Adding Supabase Realtime subscriptions for `published_scenarios` could show new stories and live count updates.
- **React Query migration.** Converting the manual fetch pattern to React Query would enable caching, background refetching, and consistency with other pages.
- **Search improvements.** Full-text search on title and description (not just tag matching) would improve discoverability.
- **View count deduplication.** Tracking viewed scenario IDs in session storage to prevent inflated counts from repeated opens.
```

---

## Implementation Steps

1. Open the Admin Panel > App Guide tool.
2. Select the "Community Gallery Page (St..." document.
3. Replace the entire document content with the markdown above.
4. Save the document.

No source code files are modified. Only the App Guide document content is updated.
