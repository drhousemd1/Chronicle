

# Fix Scenario Detail Modal: Avatar Size and Button Placement

## Changes in `src/components/chronicle/ScenarioDetailModal.tsx`

### 1. Enlarge publisher avatar to match character avatars

The publisher avatar next to "by Dr. House" is currently `w-5 h-5` (20px). The character circles below are `w-14 h-14` (56px). Increase the publisher avatar to `w-10 h-10` (40px) -- large enough to actually see the image, while still fitting naturally next to the "by" text line. The inner fallback text size will scale up accordingly.

### 2. Reposition "Remove from Gallery" button

Currently the button floats awkwardly with `justify-end mt-6`. Per Image 4, it should be pinned to the absolute bottom-right of the right column, visually aligned with the action buttons on the left. 

Move the "Remove from Gallery" button out of the scrollable content flow and into a sticky/fixed footer area at the bottom of the right column. Use `mt-auto` on a wrapper that pushes it to the bottom, and keep `justify-end` for right-alignment. Remove the `border-t` from the Characters section so it doesn't create a visual break before the button.

### Technical details

**File:** `src/components/chronicle/ScenarioDetailModal.tsx`

- **Lines ~230-243** (publisher avatar): Change `w-5 h-5` to `w-10 h-10`, increase fallback text from `text-[10px]` to `text-sm`
- **Lines ~322-336** (Remove from Gallery button): Move the `canShowUnpublish` block so it sits inside a bottom-pinned footer row that aligns with the left column's action buttons. The right column content div already uses `flex flex-col min-h-full` with `mt-auto` on the characters section -- reposition the unpublish button into a new bottom bar after the characters section, using `mt-auto pt-6 flex justify-end`.

