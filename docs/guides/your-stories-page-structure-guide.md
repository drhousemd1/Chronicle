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

# Your Stories Page — Structure Guide

---

## 1. Page Overview

| Field | Value |
|-------|-------|
| **Route** | `tab === "hub"` inside `Index.tsx` (no URL change — tab state is in-memory) |
| **Primary Source Files** | `src/pages/Index.tsx` (shell, header, sidebar, state, handlers) · `src/components/chronicle/StoryHub.tsx` (card grid + detail modal orchestration) |
| **Purpose** | Personal scenario management hub — browse, filter, play, edit, delete, and publish the authenticated user's own scenarios plus any bookmarked (saved) scenarios from the Community Gallery |
| **User Role Access** | Any authenticated user. No admin/moderator distinction — every user sees only their own scenarios and their saved bookmarks |
| **Sidebar Position** | Second item: `Your Stories` with the grid icon (`IconsList.Hub`) |
| **Entry Points** | Sidebar click · Default landing tab after login · Back navigation from Scenario Builder ("Save and Close") · Back navigation from Chat Interface ("Back" button) |

---

## 2. Layout and Structure

The hub renders inside the main app shell defined in `Index.tsx`. The overall page structure from outer to inner:

```
<aside>  Sidebar (collapsible, 280px or 72px)
<main>
  <header>  Top bar (h-16, white bg, border-b)
    ├── Title "Your Stories"
    ├── Filter pill bar (dark capsule)
    └── Settings gear dropdown
  <div>  Content area (flex-1, overflow-hidden)
    └── Background layer (optional user-uploaded image with configurable overlay)
        └── <StoryHub>
              ├── Card grid (responsive columns)
              ├── "New Story" dashed card (always shown)
              ├── Infinite scroll sentinel + loading spinner
              └── StoryDetailModal (overlay)
```

### Header Row

The header contains three elements laid out with `justify-between`:

1. **Left side** — Title + filter pills:
   - `h1` "Your Stories" — `text-lg font-black text-slate-900 uppercase tracking-tight`
   - Filter pill bar — a dark capsule container with 4 filter buttons

2. **Right side** — Settings gear dropdown (see Section 3)

### Filter Pill Bar

A horizontal row of 4 filter buttons inside a dark rounded container:

| Container | `bg-[#2b2b2e] rounded-full p-1 gap-0.5 border border-[#2b2b2e]` |
|-----------|------------------------------------------------------------------|
| Active pill | `bg-[#4a5f7f] text-white shadow-sm` |
| Inactive pill | `text-[#a1a1aa] hover:text-[#e4e4e7]` |
| All pills | `px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap` |

Filter options and their behavior:

| Filter | State value | What it shows |
|--------|-------------|---------------|
| **My Stories** | `"my"` | Only `registry` (user's own scenarios) |
| **Saved Stories** | `"bookmarked"` | Only bookmarked scenarios from Community Gallery (converted `savedScenarios` with `isBookmarked: true`) |
| **Published** | `"published"` | Only user's own scenarios that exist in `publishedScenarioIds` |
| **All** | `"all"` | `registry` + bookmarked scenarios combined (default) |

### Background Layer

The hub content area is wrapped in a `div` with `bg-black`. If the user has selected a background image:
- `backgroundImage`, `backgroundSize: 'cover'`, `backgroundPosition: 'center'` are applied
- A configurable overlay sits on top — color (black or white) and opacity (0–80%) are controlled per-background via the BackgroundPickerModal (see Section 5.4)
- Overlay settings are stored in the `user_backgrounds` table columns `overlay_color` (default `'black'`) and `overlay_opacity` (default `10`)
- The overlay renders as a `pointer-events-none` div with dynamic `backgroundColor` and `opacity` based on stored settings

### Card Grid

Rendered by `<StoryHub>`. Uses a responsive CSS grid:

```
grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5
gap-4 lg:gap-8
```

### Empty State

When there are no scenarios, the grid shows only the "New Story" skeleton card — the same dashed-border dark card that always appears at the end of the grid. No separate empty state CTA or light-themed section. The skeleton card is self-explanatory for creating the first story.

### Infinite Scroll / Pagination

Scenarios load 50 at a time (`SCENARIO_PAGE_SIZE = 50`). An `IntersectionObserver` sentinel div sits below the grid with `rootMargin: '200px'`. When it becomes visible and more scenarios exist, `onLoadMore` fires to fetch the next batch. A `Loader2` spinner appears during loading. This matches the Community Gallery's pagination pattern.

---

## 3. UI Elements — Complete Inventory

| # | Element | Location | Component / Source | Interactive? | Notes |
|---|---------|----------|--------------------|-------------|-------|
| 1 | **Title "Your Stories"** | Header, left | `Index.tsx` | No | `h1`, uppercase, font-black |
| 2 | **Filter pill: My Stories** | Header, left | `Index.tsx` | Yes — sets `hubFilter` to `"my"` | Dark capsule button |
| 3 | **Filter pill: Saved Stories** | Header, left | `Index.tsx` | Yes — sets `hubFilter` to `"bookmarked"` | Dark capsule button |
| 4 | **Filter pill: Published** | Header, left | `Index.tsx` | Yes — sets `hubFilter` to `"published"` | Dark capsule button |
| 5 | **Filter pill: All** | Header, left | `Index.tsx` | Yes — sets `hubFilter` to `"all"` | Default active filter |
| 6 | **Settings gear ⚙️** | Header, right | `Index.tsx` via `DropdownMenu` | Yes — opens dropdown | Single menu item: "Change Background" |
| 7 | **Scenario Card** | Grid | `ScenarioCard` in `StoryHub.tsx` | Yes — click opens detail modal; hover reveals action buttons | See Section 4 for full breakdown |
| 8 | **"New Story" card** | Grid (last item) | `StoryHub.tsx` inline | Yes — calls `onCreate` → `handleCreateNewScenario` | Dashed border, `+` icon, always shown (even when grid is empty) |
| 9 | **StoryDetailModal** | Overlay | `StoryDetailModal.tsx` | Yes — Play, Edit, Unpublish buttons | Opened via card click |
| 10 | **BackgroundPickerModal** | Overlay | `BackgroundPickerModal.tsx` | Yes — select/upload/delete backgrounds, adjust overlay | Opened via Settings dropdown |
| 11 | **DeleteConfirmDialog** | Overlay | `DeleteConfirmDialog.tsx` | Yes — confirm/cancel | Used for both bookmark removal and scenario deletion with context-aware titles/messages |
| 12 | **Remix Confirm Dialog** | Overlay | `AlertDialog` in `Index.tsx` | Yes — confirm/cancel | Shown before cloning a bookmarked scenario for editing |

---

## 4. Cards / List Items — Scenario Card

The `ScenarioCard` component is defined inside `StoryHub.tsx`. Each card represents a single scenario.

### Card Container
| Property | Value |
|----------|-------|
| Aspect ratio | `aspect-[2/3]` (portrait, 2:3) |
| Rounded corners | `rounded-[2rem]` (32px) |
| Shadow | `!shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)]` |
| Border | `border border-[#4a5f7f]` |
| Hover effect | `-translate-y-3` lift + `shadow-2xl` + cover image `scale-110` zoom |
| Click | Opens `StoryDetailModal` via `onViewDetails` |

### Cover Image
- Fills the card via `h-full w-full object-cover`
- `objectPosition` is set from `scen.coverImagePosition` (default `50% 50%`)
- Hover: `transition-transform duration-700 group-hover:scale-110`
- **Fallback** (no cover image): Dark background with first character of title rendered as a large watermark (`text-6xl text-white/10 font-black italic`)

### Gradient Overlay
Sits over the image at all times:
```
bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent
opacity-90 → group-hover:opacity-95
```

### Badges

**Top-left badge container** — `absolute top-4 left-4 flex items-center gap-2 z-10`:

| Badge | Condition | Styling |
|-------|-----------|---------|
| **Published** | `isPublished && !scen.isBookmarked` | `bg-[#2a2a2f] text-emerald-400 uppercase tracking-wide text-xs font-bold px-2.5 py-1 rounded-lg backdrop-blur-sm` |
| **Remix/Edit icon** | `publishedData?.allow_remix` | Purple pencil icon (`<Pencil>`) in `bg-[#2a2a2f]` pill |

**Top-right badge** — `absolute top-4 right-4`:

| Badge | Condition | Styling |
|-------|-----------|---------|
| **SFW** | `contentThemes?.storyType === 'SFW'` | `text-blue-400 bg-[#2a2a2f] uppercase text-xs font-bold` |
| **NSFW** | `contentThemes?.storyType === 'NSFW'` | `text-red-400 bg-[#2a2a2f] uppercase text-xs font-bold` |

Content themes are fetched for both owned and bookmarked scenarios, so SFW/NSFW badges appear on all cards.

### Hover Action Buttons

Three buttons appear centered over the card on hover (`opacity-0 → group-hover:opacity-100`, `scale-90 → group-hover:scale-100`):

| Button | Color | Action |
|--------|-------|--------|
| **Edit** | `bg-white text-slate-900` | `onEdit(scen.id)` |
| **Delete** | `bg-rose-600 text-white` | `onDelete(scen.id)` |
| **Play** | `bg-blue-600 text-white` | `onPlay(scen.id)` |

All buttons: `px-4 py-2 rounded-xl font-bold text-xs shadow-2xl`, with `e.stopPropagation()` to prevent triggering the card click.

### Bottom Info Bar

Positioned `absolute inset-x-0 bottom-0 p-4 pb-5 pointer-events-none`:

| Element | Details |
|---------|---------|
| **Title** | `text-lg font-black text-white leading-tight tracking-tight truncate` · hover: `text-blue-300` |
| **Description** | `text-xs text-white/60 line-clamp-2 leading-relaxed italic min-h-[2.5rem]` |
| **Stats row** | For **published** scenarios (has `publishedData`): four inline stats with `text-[10px] text-white/50` — Eye (views), Heart (likes), Bookmark (saves), Play (plays). For **unpublished** scenarios: only the Play icon with count 0 to maintain consistent card spacing |
| **"Created by" line** | `text-[11px] text-white/50 font-medium` — shows `displayAuthor`. For owned scenarios: owner's username. For bookmarked scenarios: the original creator's name (fetched from publisher profile via `bookmarkedCreatorNames` map). Falls back to "Anonymous" |

### "New Story" Card

Always rendered (even when grid is empty). Same `aspect-[2/3]` ratio:
- `border-2 border-dashed border-zinc-600`
- `bg-gradient-to-br from-zinc-800 to-zinc-900`
- Centered `+` in a circle + "NEW STORY" label
- Hover: `border-blue-400`, icon/text turn `text-blue-400`

---

## 5. Modals and Overlays

### 5.1 StoryDetailModal

**Source:** `src/components/chronicle/StoryDetailModal.tsx` (681 lines)

**Trigger:** Clicking a scenario card calls `handleViewDetails(id)` which:
1. Sets `selectedScenario` from registry
2. Opens modal (`detailModalOpen = true`)
3. Parallel-fetches `contentThemes` and `publicationStatus`

**Layout:** Full-screen overlay with `bg-black/90 backdrop-blur-sm`. Content container: `max-w-6xl max-h-[90vh] bg-[#121214] rounded-[32px]`, split into two columns:

| Column | Width | Content |
|--------|-------|---------|
| **Left** | `md:w-[420px]` | Cover image (aspect `3:4`, rounded-2xl), SFW/NSFW badge, Allow-Edits badge, action buttons row, "Remove from Gallery" button |
| **Right** | `flex-1` (ScrollArea) | Title, star/spice ratings (gallery mode), stats row (gallery mode), creator section (gallery mode), description, tags, content themes, character roster, reviews section |

**Action Buttons (Owned mode — `isOwned: true`):**
- Edit (white/5 bg, Edit icon) + Play (blue-500 bg, Play icon)

**Action Buttons (Gallery mode — `isOwned: false`):**
- Like (toggleable rose highlight) + Save (toggleable amber highlight) + Play

**Additional features:**
- **Unpublish button** — "Remove from Gallery" — shown when `isPublished && isOwned`
- **Character roster** — Fetched via `fetchScenarioCharacters(scenarioId)`, displayed as avatar circles
- **Reviews section** — Fetched via `fetchScenarioReviews`, paginated (5 per page), includes user's own review with edit/delete capability
- **Creator section** — Avatar, display name, overall rating — clickable to navigate to `/creator/:publisherId`

### 5.2 ShareStoryModal

**Source:** `src/components/chronicle/ShareStoryModal.tsx` (200 lines)

**Note:** This modal is available from the Scenario Builder (World Tab), not directly from the hub. Included here because it controls the publish/unpublish flow that affects hub badges.

**Layout:** `Dialog` with `bg-[#2a2a2f] border-white/10 max-w-lg`

**Content:**
1. Story title display in dark card
2. "Allow Edits" toggle (`Switch` component) — controls `allow_remix` flag
3. Permissions info box (blue tint) — lists what others can do
4. Action buttons:
   - **Unpublish** (rose-500 tint) — only shown if already published
   - **Publish to Gallery** / **Update Publication** (blue-600)
5. Stats footer (likes, saves, plays) — only shown if published

**Data flow:**
- On open: calls `getPublishedScenario(scenarioId)` to check existing publication
- Publish: calls `publishScenario(scenarioId, userId, allowRemix, [])`
- Unpublish: calls `unpublishScenario(scenarioId)`

### 5.3 DeleteConfirmDialog

**Source:** `src/components/chronicle/DeleteConfirmDialog.tsx` (53 lines)

**Layout:** `AlertDialog` with `bg-[hsl(var(--ui-surface))] rounded-xl max-w-sm`

**Buttons:**
- Cancel — `bg-[hsl(var(--ui-surface-2))]` dark surface
- Delete — `bg-red-600 hover:bg-red-700`

**Usage in hub:** The hub's `handleDeleteScenario` opens the `DeleteConfirmDialog` with context-aware titles and messages:
- **Bookmark removal:** Title "Remove Bookmark?", message "Remove this story from your bookmarks? You can always save it again from the Gallery."
- **Scenario deletion:** Title "Delete Scenario?", message "Delete this entire scenario and all its data? This cannot be undone."

State is managed via `deleteConfirmId` (which scenario) and `deleteConfirmType` (`'bookmark'` or `'scenario'`). On confirm, the appropriate action (unsave or delete) is executed.

### 5.4 Remix Confirmation Dialog

When a user clicks "Edit" on a bookmarked scenario, a confirmation dialog appears before any cloning occurs:

**Message:** "You are about to open another creator's story in the editor. This will clone the details of the story and create a version in 'Your Stories' that you can then edit. This will not affect the original creator's uploaded story."

**Buttons:** Cancel / Continue

State is managed via `remixConfirmId`. On confirm, the clone flow proceeds: `cloneScenarioForRemix()` → track in `remixed_scenarios` → refresh registry → switch to editing the clone → toast "Your copy is ready!"

### 5.5 BackgroundPickerModal

**Source:** `src/components/chronicle/BackgroundPickerModal.tsx`

**Trigger:** Settings gear dropdown → "Change Background"

**Layout:** `Dialog` wrapping a `Card` component — `sm:max-w-2xl`, no built-in close button (uses Dialog overlay click).

**Content:**
1. Header: "Your Backgrounds" title + "+ Upload Background" dropdown (From Device / From Library)
2. Grid (`grid-cols-2 md:grid-cols-3 gap-6`):
   - **Default tile** — subtle gradient, "Default" label, blue check if selected
   - **Uploaded backgrounds** — image thumbnails with hover delete (rose-500), blue check if selected
3. Empty state when no backgrounds uploaded
4. **Overlay Controls** section (below the grid):
   - **Overlay Color** — toggle between Black and White (two buttons, active state highlighted)
   - **Overlay Opacity** — slider from 0% to 80%
   - Changes are saved per-background via `updateBackgroundOverlay()` which writes to `overlay_color` and `overlay_opacity` columns
   - Overlay controls only appear when a non-default background is selected

**Data flow:**
- Upload: reads file → compresses via `resizeImage(1920, 1080, 0.8)` → uploads to storage → creates `user_backgrounds` row
- Select: calls `setSelectedBackground(userId, id)` — marks one background as `is_selected`
- Delete: calls `deleteUserBackground(userId, id, imageUrl)` — removes from storage + DB
- Overlay update: calls `updateBackgroundOverlay(bgId, color, opacity)` → updates DB columns

---

## 6. Data Architecture

### Tables Involved

| Table | Role in Hub |
|-------|-------------|
| `scenarios` | User's own scenarios — provides the `registry` array. Columns used: `id`, `title`, `description`, `cover_image_url`, `cover_image_position`, `tags`, `created_at`, `updated_at` |
| `published_scenarios` | Tracks which scenarios are published. Provides `publishedScenariosData` map. Key columns: `scenario_id`, `publisher_id`, `allow_remix`, `like_count`, `save_count`, `play_count`, `view_count`, `is_published` |
| `saved_scenarios` | User's bookmarked scenarios from gallery. Provides `savedScenarios` array. Joins to `published_scenarios` → `scenarios` to get title/cover |
| `content_themes` | Content categorization (SFW/NSFW, genres, trigger warnings). Provides `contentThemesMap`. Fetched for both owned and bookmarked scenarios |
| `profiles` | User's own profile for `ownerUsername` display. Also used to resolve bookmarked scenario creator names. Columns: `username`, `display_name` |
| `user_backgrounds` | Hub background images. Columns: `image_url`, `is_selected`, `image_library_selected`, `overlay_color` (default 'black'), `overlay_opacity` (default 10) |
| `characters` | Loaded per-scenario for the detail modal character roster |
| `scenario_reviews` | Loaded per-scenario for the detail modal reviews section |
| `scenario_likes` | Loaded per-scenario for the detail modal like state |
| `remixed_scenarios` | Written to when user clones a bookmarked scenario for editing |

### Initial Load Flow

When `Index.tsx` mounts and the user is authenticated, a single `Promise.all` fires parallel requests (each wrapped in a 15-second timeout with fallback):

```
1. fetchMyScenariosPaginated(userId, 50, 0) → setRegistry (first page)
2. fetchCharacterLibrary()                   → setLibrary
3. fetchConversationRegistry()               → setConversationRegistry
4. fetchUserBackgrounds(userId)              → setHubBackgrounds (includes overlay settings)
5. getImageLibraryBackground(userId)         → setSelectedImageLibraryBackgroundId
6. fetchSavedScenarios(userId)               → setSavedScenarios
7. fetchUserPublishedScenarios(userId)       → setPublishedScenariosData
8. fetchUserProfile(userId)                  → setUserProfile
```

After the parallel fetch, content themes are fetched for all scenario IDs (both owned and bookmarked):
```
9. fetchContentThemesForScenarios([...ownedIds, ...bookmarkedIds]) → setContentThemesMap
```

Bookmarked creator names are resolved from the saved scenarios data and stored in a `bookmarkedCreatorNames` map for display on cards.

### Hub Filter Logic

The `filteredRegistry` is a `useMemo` that combines `registry`, `savedScenarios`, `hubFilter`, and `publishedScenarioIds`:

- **Bookmarked scenarios** are converted from `SavedScenario` to `ScenarioMetadata` format by extracting data from the joined `published_scenarios.scenarios` relation. They get `isBookmarked: true` to distinguish them from owned scenarios.
- Bookmarked scenarios whose `source_scenario_id` already exists in `registry` (user owns a copy) are excluded to avoid duplicates.

### Data Flow for Card Display

Each `ScenarioCard` receives:
- `scen` — `ScenarioMetadata` (from `filteredRegistry`)
- `isPublished` — `publishedScenarioIds.has(scen.id)`
- `contentThemes` — `contentThemesMap.get(scen.id)` (fetched for both owned and bookmarked)
- `publishedData` — `publishedScenariosData.get(scen.id)` (for stats: views, likes, saves, plays)
- `displayAuthor` — from `getDisplayAuthor(scen)`: returns original creator name for bookmarked scenarios, owner username for owned scenarios

---

## 7. Component Tree

```
Index.tsx (IndexContent)
├── <aside> Sidebar
│   └── SidebarItem (label="Your Stories", tab="hub")
├── <header> Top bar
│   ├── Title "Your Stories"
│   ├── Filter pills (inline buttons)
│   └── Settings gear → DropdownMenu → "Change Background"
├── <div> Content area (tab === "hub")
│   ├── Background image layer (optional, with configurable overlay)
│   └── StoryHub
│       ├── ScenarioCard (×N) — one per scenario in filteredRegistry
│       ├── "New Story" card (always shown, even when empty)
│       ├── Infinite scroll sentinel (IntersectionObserver)
│       └── StoryDetailModal (if selectedScenario)
│           └── TooltipProvider wrapper
├── BackgroundPickerModal (if isBackgroundModalOpen)
│   └── ImageLibraryPickerModal (sub-modal for "From Library" option)
├── DeleteConfirmDialog (context-aware: bookmark removal or scenario deletion)
└── Remix Confirmation Dialog (AlertDialog, shown before cloning bookmarked scenarios)
```

---

## 8. Custom Events and Callbacks

### handlePlayScenario(id: string)

1. Immediately switches to `chat_interface` tab with `playingConversationId = "loading"` (instant visual feedback)
2. Calls `fetchScenarioForPlay(id)` — optimized fetch that skips loading existing conversation messages
3. Loads content themes for LLM injection
4. Creates a new `Conversation` with opening dialog as first message (if enabled)
5. Saves conversation to DB in background (fire-and-forget)
6. Optimistically updates `conversationRegistry`
7. Sets `activeData` and `playingConversationId`

### handleEditScenario(id: string)

1. Calls `fetchScenarioById(id)` — full fetch including all conversations with messages
2. Checks ownership via `getScenarioOwner(id)`
3. **If not owned** (bookmarked scenario):
   - Shows a **remix confirmation dialog** explaining that a clone will be created (see Section 5.4)
   - On confirm: creates a clone via `cloneScenarioForRemix()`
   - Tracks the remix in `remixed_scenarios` table
   - Refreshes registry to show the new clone
   - Switches to editing the clone
   - Shows toast: "Your copy is ready!"
4. **If owned**:
   - Loads content themes
   - Sets active data directly
5. Navigates to `tab = "world"` (Scenario Builder)

### handleDeleteScenario(id: string)

1. Checks if the scenario is a bookmark (`savedScenarios` lookup + not in `registry`)
2. Opens `DeleteConfirmDialog` with context-aware title and message:
   - **If bookmarked**: Title "Remove Bookmark?", message about removing from bookmarks
   - **If owned**: Title "Delete Scenario?", message about permanent deletion
3. On confirm:
   - **Bookmarked**: calls `unsaveScenario()` → refreshes `savedScenarios`
   - **Owned**: calls `deleteScenario(id)` → refreshes both `registry` and `conversationRegistry`. If the deleted scenario was active, clears active state and returns to hub.

### handleCreateNewScenario()

1. Generates UUID
2. Creates default scenario data via `createDefaultScenarioData()`
3. Sets as active with empty cover image and default content themes
4. Navigates to `tab = "world"` (Scenario Builder)

### Hub Background Handlers

| Handler | Action |
|---------|--------|
| `handleUploadBackground(file)` | Reads file → resizes to 1920×1080 @ 0.8 quality → uploads to storage → creates DB row → adds to `hubBackgrounds` state |
| `handleSelectBackground(id \| null)` | Calls `setSelectedBackground(userId, id)` → updates `selectedHubBackgroundId` and marks in `hubBackgrounds` |
| `handleDeleteBackground(id, imageUrl)` | Calls `deleteUserBackground()` → removes from state. If was selected, resets to null (default) |

### StoryHub Internal Handlers

| Handler | Location | Action |
|---------|----------|--------|
| `handleViewDetails(id)` | `StoryHub.tsx` | Sets `selectedScenario`, opens modal, parallel-fetches content themes + publication status |
| `handleUnpublish()` | `StoryHub.tsx` | Calls `unpublishScenario(selectedScenario.id)`, sets `publicationStatus = null`, shows toast |

### Pagination Handlers

| Handler | Location | Action |
|---------|----------|--------|
| `handleLoadMoreScenarios()` | `Index.tsx` | Fetches next 50 scenarios via `fetchMyScenariosPaginated`, appends to `registry`, updates `hasMoreScenarios` flag |

---

## 9. Styling Reference

### Color Tokens Used

| Token / Value | Where Used |
|---------------|------------|
| `bg-black` | Hub content area background |
| `bg-[#1a1a1a]` | Sidebar background |
| `bg-[#2b2b2e]` | Filter pill bar container |
| `bg-[#4a5f7f]` | Active sidebar item, active filter pill |
| `bg-[#2a2a2f]` | Card badges, detail modal surfaces |
| `bg-[#121214]` | Detail modal main background |
| `text-emerald-400` | "Published" badge text |
| `text-red-400` | "NSFW" badge text |
| `text-blue-400` | "SFW" badge text, various interactive elements |
| `text-purple-400` | Remix/edit pencil icon |
| `text-white/60` | Card description text |
| `text-white/50` | Card stats text, "Created by" line |
| `text-[#a1a1aa]` | Inactive filter pill text |
| `border-[#4a5f7f]` | Card border |
| `bg-rose-600` | Delete button on card hover |
| `bg-blue-600` | Play button on card hover |
| `bg-white` | Edit button on card hover |

### Card Styling Details

| Property | Value |
|----------|-------|
| Card shadow | `shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)]` |
| Hover lift | `group-hover:-translate-y-3` |
| Hover shadow | `group-hover:shadow-2xl` |
| Cover zoom | `group-hover:scale-110` with `duration-700` |
| Action button appear | `opacity-0 → group-hover:opacity-100` with `scale-90 → group-hover:scale-100` and `duration-300` |
| Gradient overlay | `from-slate-950 via-slate-900/60 to-transparent` |

### New Story Card

| Property | Value |
|----------|-------|
| Border | `border-2 border-dashed border-zinc-600` |
| Background | `bg-gradient-to-br from-zinc-800 to-zinc-900` |
| Hover | `hover:border-blue-400` |
| Circle icon | `w-16 h-16 rounded-full bg-zinc-700/50` → hover: `bg-blue-900/30` |

---

## 10. Cross-Page Dependencies

| Page / Feature | Interaction |
|----------------|-------------|
| **Scenario Builder** (tab="world") | Edit flow: hub card → `handleEditScenario` → loads full scenario data → switches to `tab="world"`. Scenario Builder's "Save and Close" returns to hub. Title/description set in Builder appear on hub cards. |
| **Chat Interface** (tab="chat_interface") | Play flow: hub card → `handlePlayScenario` → creates new conversation → switches to `tab="chat_interface"`. Chat's "Back" button returns to hub. |
| **Community Gallery** (tab="gallery") | Saved/bookmarked scenarios from gallery appear in hub under "Saved Stories" filter. Gallery's save/unsave calls `handleGallerySaveChange` which refreshes `savedScenarios`. |
| **Chat History** (tab="conversations") | Shares `conversationRegistry` state. Playing a scenario from hub adds to the registry. Deleting a scenario from hub refreshes the conversation registry. |
| **Creator Profile** (`/creator/:id`) | Detail modal's creator section links to creator profile page via `navigate('/creator/${publisherId}')`. |
| **Character Library** (tab="library") | Not directly linked from hub, but characters are loaded during edit/play flows. The "Import from Library" feature is in Scenario Builder. |
| **Image Library** (tab="image_library") | BackgroundPickerModal has a "From Library" option that opens `ImageLibraryPickerModal` to pick an image from the user's image library. |

---

## 11. Security and Access Control

### RLS Policies Relevant to Hub

**`scenarios` table:**
- SELECT: `auth.uid() = user_id OR EXISTS(published_scenarios WHERE is_published AND NOT is_hidden)` — user sees own scenarios + any published scenario (needed for bookmarked scenario data)
- INSERT/UPDATE/DELETE: `auth.uid() = user_id` — only own scenarios

**`saved_scenarios` table:**
- SELECT/INSERT/DELETE: `user_id = auth.uid()` — only own bookmarks
- No UPDATE policy (bookmarks are insert-or-delete only)

**`published_scenarios` table:**
- SELECT: `is_published = true AND is_hidden = false` — anyone can see published, non-hidden scenarios
- INSERT/UPDATE/DELETE: `publisher_id = auth.uid()` — only own publications

**`content_themes` table:**
- SELECT: Own scenarios OR published scenarios
- ALL: Own scenarios (via join to `scenarios.user_id`)

**`user_backgrounds` table:**
- All operations: `auth.uid() = user_id` — only own backgrounds

### Hub-Level Filtering

The hub only shows:
1. User's own scenarios (from `fetchMyScenariosPaginated(userId)` which filters by `user_id`)
2. User's saved bookmarks (from `fetchSavedScenarios(userId)` which filters by `user_id`)

There is no way for a user to see another user's unpublished scenarios through the hub.

---

## 12. Known Issues / Quirks

*No known issues at this time. All previously documented issues have been resolved.*

---

## 13. Planned / Future Changes

*No planned changes documented at this time.*