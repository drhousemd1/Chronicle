

# Your Stories Page -- Bug Fixes and Improvements (8 Items)

This plan fixes all 8 known issues on the Your Stories page, adds background overlay controls, and updates the App Guide document.

---

## 1. Replace browser `confirm()` with DeleteConfirmDialog

**What changes:** In `Index.tsx`, the `handleDeleteScenario` function currently uses native browser `confirm()` popups for both bookmark removal and scenario deletion. These look out of place with the rest of the app's dark themed UI.

**Fix:** Replace both `confirm()` calls with the existing `DeleteConfirmDialog` component. The dialog already exists and is imported in `Index.tsx`. We'll use the `deleteConfirmId` state that already exists, but extend it to distinguish between "remove bookmark" and "delete scenario" flows. A new state `deleteConfirmType` tracks which type of deletion is pending.

- Bookmark removal: title "Remove Bookmark?", message "Remove this story from your bookmarks?", button text stays "Delete" (or we can keep it generic)
- Scenario deletion: title "Delete Scenario?", message "Delete this entire scenario? This cannot be undone."

**Files:** `src/pages/Index.tsx`

---

## 2. Remix/clone confirmation dialog

**What changes:** When clicking "Edit" on a bookmarked scenario, the app silently clones it. Users have no idea this is happening until after the fact.

**Fix:** Before cloning, show a confirmation dialog (using the same `DeleteConfirmDialog` pattern but with custom title/message/button text -- or a new simple confirmation dialog). The message will read:

> "You are about to open another creator's story in the editor. This will clone the details of the story and create a version in 'Your Stories' that you can then edit. This will not affect the original creator's uploaded story."

We'll add a new state `remixConfirmId` to track which scenario is pending remix confirmation. When confirmed, proceed with the existing clone logic.

**Files:** `src/pages/Index.tsx`

---

## 3. Empty state dark theme fix

**What changes:** When there are no stories, the empty state shows light-themed colors (white backgrounds, dark text) against the black page background.

**Fix:** Replace the current empty state in `ScenarioHub.tsx` (lines 233-248) with just the "New Story" skeleton card -- the same dashed-border dark card shown in the uploaded reference image. No text, no separate CTA section. Just the skeleton placeholder card sitting in the grid by itself. Users click it to create their first story.

**Files:** `src/components/chronicle/ScenarioHub.tsx`

---

## 4. Simplify stats row for unpublished cards

**What changes:** Currently all cards show views, likes, saves, and plays -- even unpublished ones where they're all 0. This adds visual noise.

**Fix:** For unpublished scenarios (no `publishedData`), show only the Play icon with count 0 to maintain consistent card spacing. For published scenarios, show all 4 stats as before.

**Files:** `src/components/chronicle/ScenarioHub.tsx`

---

## 5. "Created by" with correct author attribution

**What changes:** The "Written by" line always shows the hub owner's username, even for bookmarked scenarios from other creators.

**Fix:** 
- Change "Written by" to "Created by" everywhere
- For bookmarked scenarios (`scen.isBookmarked === true`), display the original creator's name. This data is available from the `savedScenarios` join -- the published scenario includes the publisher's profile. We'll pass the original creator name through to `ScenarioHub` via a new `bookmarkedCreatorNames` map prop.
- For owned scenarios, continue showing the owner's username

**Files:** `src/components/chronicle/ScenarioHub.tsx`, `src/pages/Index.tsx`

---

## 6. Background overlay controls (opacity slider, color picker, intensity)

**What changes:** Currently the background overlay is hardcoded at `bg-black/10`. Users can't control it.

**Fix:** Add overlay controls to the `BackgroundPickerModal`:
- **Overlay color**: Simple toggle between Black and White
- **Overlay opacity**: Slider from 0% to 80%

These settings are stored in `user_backgrounds` table (new columns: `overlay_color` and `overlay_opacity`) or more simply as user-level preferences in a new pair of columns on the relevant background row. However, since the overlay applies to the selected background globally, the simplest approach is to store `overlay_color` (text, default 'black') and `overlay_opacity` (numeric, default 10) on the `user_backgrounds` table itself so each background can have its own overlay settings.

**Database migration:** Add `overlay_color` (text, default 'black') and `overlay_opacity` (integer, default 10) columns to `user_backgrounds` table.

**Files:** `src/components/chronicle/BackgroundPickerModal.tsx`, `src/pages/Index.tsx`, `src/types.ts`

---

## 7. Lazy loading / pagination for scenarios

**What changes:** The hub loads all scenarios at once. For users with many scenarios, this is inefficient.

**Fix:** Currently `fetchMyScenarios` fetches all scenarios but only needs tile-level data (title, description, cover image, cover position, tags, created/updated dates). Looking at the current implementation, it already only fetches metadata-level fields -- it doesn't load full scenario data (characters, world, conversations) until you click Edit or Play. So the data per card is already minimal.

We'll add pagination consistent with the gallery:
- Load 50 scenarios at a time
- IntersectionObserver sentinel at bottom of grid triggers loading more
- `ScenarioHub` receives a `loadMore` callback and `hasMore` / `isLoadingMore` flags
- A small spinner shows at the bottom while loading the next batch

**Files:** `src/services/supabase-data.ts` (add paginated fetch), `src/components/chronicle/ScenarioHub.tsx`, `src/pages/Index.tsx`

---

## 8. Fetch content themes for bookmarked scenarios

**What changes:** SFW/NSFW badges don't show on bookmarked scenario cards because content themes are only fetched for owned scenarios.

**Fix:** After loading saved scenarios, also fetch content themes for their source scenario IDs and merge them into the `contentThemesMap`. The content themes are viewable via the existing RLS policy that allows reading themes for published scenarios.

**Files:** `src/pages/Index.tsx`

---

## Technical Details

### Database Migration

```text
ALTER TABLE user_backgrounds 
  ADD COLUMN overlay_color text NOT NULL DEFAULT 'black',
  ADD COLUMN overlay_opacity integer NOT NULL DEFAULT 10;
```

Also add the same columns to `sidebar_backgrounds` for consistency (the Image Library background uses the same picker pattern).

### Files Modified

- **`src/pages/Index.tsx`**
  - Replace `confirm()` with `DeleteConfirmDialog` using new `deleteConfirmType` state
  - Add `remixConfirmId` state and confirmation dialog before clone flow
  - Fetch content themes for bookmarked scenario IDs (item 8)
  - Build `bookmarkedCreatorNames` map from `savedScenarios` data
  - Pass overlay settings to the background div
  - Add pagination state (`scenarioOffset`, `hasMoreScenarios`, `isLoadingMoreScenarios`)
  - Pass `loadMore`/`hasMore`/`isLoadingMore` to `ScenarioHub`

- **`src/components/chronicle/ScenarioHub.tsx`**
  - Replace empty state with just the "New Story" skeleton card
  - Update stats row: only show Play for unpublished cards
  - Change "Written by" to "Created by" with correct attribution for bookmarked scenarios
  - Add IntersectionObserver sentinel and loading spinner for infinite scroll
  - Accept new props: `bookmarkedCreatorNames`, `onLoadMore`, `hasMore`, `isLoadingMore`

- **`src/components/chronicle/BackgroundPickerModal.tsx`**
  - Add overlay color toggle (Black / White) and opacity slider (0-80%)
  - Pass overlay settings back via new `onOverlayChange` callback

- **`src/types.ts`**
  - Add `overlayColor` and `overlayOpacity` to `UserBackground` type

- **`src/services/supabase-data.ts`**
  - Add `fetchMyScenariosPaginated(userId, limit, offset)` function
  - Update `fetchUserBackgrounds` to include new overlay columns

### App Guide Update

Update the "Your Stories Page (Structure Guide)" document:
- Remove all 8 items from the Known Issues section
- Integrate new feature documentation inline with existing sections:
  - Document the remix confirmation flow in the Edit flow section
  - Document the overlay controls in the Background Customization section
  - Document infinite scroll behavior
  - Document the "Created by" attribution logic
  - Document stats row display rules (Play only for unpublished, all 4 for published)

