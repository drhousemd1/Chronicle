

## Plan: Redesign Scene Gallery Section Layout

### Changes to `src/components/chronicle/WorldTab.tsx`

**1. Replace HintBox + buttons layout (lines 991-1022) with new structure:**

Remove the current side-by-side HintBox + buttons layout. Replace with:
- A header row containing: left-aligned label "Scene Gallery Photos" with Info icon + tooltip (same pattern as Opening Dialog), and right-aligned Upload Image + AI Generate buttons side by side
- Remove the outer `bg-[#3a3a3f]/30` wrapper that adds the lighter padding area — the buttons/label row sits directly inside the `p-6` container

**2. Make buttons horizontal instead of vertical:**

The `SceneGalleryActionButtons` component currently uses `flex-col` layout. We need to change it to `flex-row` (side by side). This requires editing `src/components/chronicle/SceneGalleryActionButtons.tsx` — change `flex-col` to `flex-row` on the wrapper div (line 33).

**3. Darken the empty state area (lines 1089-1094):**

Change the empty state container from `border-2 border-dashed border-zinc-700` to also include a darker background matching text input areas: add `bg-[#1e1e22]` (or similar dark surface matching the input fields on the page). This makes the "No scenes uploaded" text more readable against a darker backdrop rather than blending with the surrounding padding.

**4. Tooltip content for the Info icon:**

Uses the same `list-outside pl-4` bullet pattern with `normal-case tracking-normal`:
- Upload images to be used for different scenes.
- Add "tags" for each image.
- Background adapts based on tags mentioned in dialog.
- Recommend: 1280x896, 4:3 landscape.

### Files modified:
- `src/components/chronicle/WorldTab.tsx` — layout restructure + tooltip + darker empty state
- `src/components/chronicle/SceneGalleryActionButtons.tsx` — `flex-col` → `flex-row`

