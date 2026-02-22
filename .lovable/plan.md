

# Community Gallery -- Complete Overhaul (7 Fixes)

This tackles all 7 issues in one cohesive update. The changes are interconnected (e.g., the new database function serves both pagination and server-side filtering), so it makes sense to do them together.

---

## What You'll Notice After This

- **Scrolling loads more stories automatically** -- no more 50-story cap. As you scroll down, more appear with a small loading spinner at the bottom.
- **Search works on story titles and descriptions** -- not just tags. Type "dragon" and it finds stories named "Dragon's Revenge" even if they're not tagged that way.
- **Filters actually work properly** -- filtering by "Fantasy" genre now searches the entire database, not just the first 50 stories you happened to download.
- **View counts are honest** -- clicking the same story 10 times in one day only counts as 1 view. After 24 hours it can count again.
- **New stories appear automatically** -- if someone publishes while you're browsing, it shows up without refreshing.
- **Following tab works reliably** -- even if you follow hundreds of creators, it won't break.
- **Everything is faster and more reliable** -- React Query handles caching, retries, and loading states properly.

---

## Technical Details

### Database Migration 1: `scenario_views` table + `record_view` function

Creates a table to track who viewed what and when, plus a function that only increments the view count if the user hasn't viewed in the last 24 hours.

```text
Table: scenario_views
  - id (uuid, primary key)
  - published_scenario_id (uuid, NOT NULL, references published_scenarios)
  - user_id (uuid, NOT NULL)
  - viewed_at (timestamptz, default now())
  - Index on (published_scenario_id, user_id, viewed_at DESC) for fast lookups

RLS: users can insert and select their own views only

Function: record_scenario_view(p_published_scenario_id, p_user_id)
  - Checks for existing view within last 24 hours
  - If none found: inserts new view record AND increments view_count on published_scenarios
  - If found: does nothing (returns silently)
```

### Database Migration 2: `fetch_gallery_scenarios` RPC function

A single powerful database function that handles all the heavy lifting -- filtering, searching, sorting, and pagination -- all on the server side.

```text
Function: fetch_gallery_scenarios(
  p_search_text text,        -- full-text search on title + description
  p_search_tags text[],      -- tag overlap filter
  p_sort_by text,            -- 'recent', 'liked', 'saved', 'played'
  p_limit int,               -- page size (default 20)
  p_offset int,              -- pagination offset
  p_story_types text[],      -- content theme filters
  p_genres text[],
  p_origins text[],
  p_trigger_warnings text[],
  p_custom_tags text[],
  p_publisher_ids uuid[]     -- for Following tab
)

Returns: JSON array of published scenarios with joined scenario, profile, and content theme data

Logic:
  - Joins published_scenarios + scenarios + profiles + content_themes
  - Applies all filters using SQL (array overlap for themes, to_tsvector for text search)
  - Falls back to ILIKE for partial text matches
  - Sorts by the chosen column
  - Returns paginated results
```

### Database Migration 3: Full-text search index

```text
CREATE INDEX idx_scenarios_fulltext_search 
  ON scenarios USING GIN (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
  );
```

### Database Migration 4: Enable Realtime

```text
ALTER PUBLICATION supabase_realtime ADD TABLE public.published_scenarios;
```

### File: `src/services/gallery-data.ts`

Changes:
- Add new `fetchGalleryScenarios()` function that calls the `fetch_gallery_scenarios` RPC
- Add `recordView()` function that calls the `record_scenario_view` RPC (replaces `incrementViewCount`)
- Keep all existing functions (likes, saves, reviews, etc.) -- they still work fine
- Remove client-side content theme filtering code (lines 191-224) since it's now server-side

### File: `src/components/chronicle/GalleryHub.tsx`

Major rewrite -- replaces manual state management with React Query:

- **React Query `useInfiniteQuery`**: Replaces all the manual `useState`/`useEffect`/`fetchInProgress` logic. Query key includes sort, search text, search tags, category filters, and followed creator IDs.
- **Infinite scroll sentinel**: An invisible div at the bottom of the grid, watched by `IntersectionObserver`. When it enters the viewport, triggers `fetchNextPage()`.
- **Separate `useQuery` for user interactions**: Fetches likes/saves for visible scenario IDs.
- **Realtime subscription**: `useEffect` that subscribes to `postgres_changes` on `published_scenarios`. On INSERT, invalidates the query. On UPDATE, patches the cached data. On DELETE, removes from cache.
- **Search input**: Now sends the raw text to the RPC as `search_text` (for title/description search) AND still extracts tags for tag-based search. Both work simultaneously.
- **View count**: Calls `recordView()` instead of `incrementViewCount()` when opening detail modal.
- **Following tab**: Fetches followed creator IDs once (via a small `useQuery`), passes them as `p_publisher_ids` to the same RPC function. No URL length issues since RPC sends data in POST body.

### File: `src/pages/Gallery.tsx`

Minor change only -- the search tag splitting logic moves into GalleryHub since it now handles both text and tag search internally. Gallery.tsx just passes the sort option.

### App Guide Update

Update the Community Gallery page in the App Guide to:
- Remove the 7 items from "Known Issues" and "Planned/Future Changes"
- Document the new features: infinite scroll, full-text search, view deduplication, real-time updates
- Note new implementation details: React Query, server-side filtering, `fetch_gallery_scenarios` RPC

---

## No Other Files Affected

GalleryScenarioCard, ScenarioDetailModal, GalleryCategorySidebar, and all other components remain unchanged. The changes are isolated to the data layer and the GalleryHub orchestration component.

