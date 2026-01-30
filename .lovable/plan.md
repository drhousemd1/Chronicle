
# Fix Plan: UI Consistency Between Your Stories and Image Library

## Overview

This plan addresses three UI consistency issues between the "Your Stories" page and the "Image Library" page, plus a title positioning fix for story cards.

---

## Fix #1: Skeleton Card Styling Consistency

**Problem:** The "New Story" skeleton card on Your Stories has a transparent background (`bg-slate-50/50`) with black text, while the "New Folder" card on Image Library has a solid gray background (`bg-slate-100`) with gray text (`text-slate-400`).

**Solution:** Update the Image Library "New Folder" card to match Your Stories styling - use the same semi-transparent background and black text.

**File:** `src/components/chronicle/ImageLibraryTab.tsx`

**Changes at line 497:**
- Change `bg-slate-100` to `bg-slate-50/50`
- Keep the same styling patterns otherwise

**Changes at line 502:**
- Change `text-slate-400` to `text-black` for the "New Folder" text

---

## Fix #2: Tile Dimensions Consistency

**Problem:** Image Library tiles appear smaller because the grid starts at 2 columns on mobile, while Your Stories starts at 1 column.

**Solution:** Update Image Library grid to match Your Stories grid settings exactly.

**File:** `src/components/chronicle/ImageLibraryTab.tsx`

**Changes at line 417:**
- Current: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8`
- Updated: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8`

This makes the tiles the same size across both pages at all screen widths.

---

## Fix #3: Fixed Title Height on Story Cards

**Problem:** Story card titles ("Acotar", "Test Story") are at different vertical positions because the text block aligns to the bottom and flows upward. When there's more description text, the title gets pushed higher.

**Solution:** Change the text container to use flexbox with a fixed-height structure where titles are always at the same position, and descriptions flow downward from the title with overflow handling.

**File:** `src/components/chronicle/ScenarioHub.tsx`

**Changes at lines 57-64:**

Before:
```tsx
<div className="absolute inset-x-0 bottom-0 p-6 pointer-events-none">
  <h3 className="text-xl font-black text-white leading-tight mb-1 tracking-tight group-hover:text-blue-300 transition-colors truncate">
    {scen.title || "Unnamed Story"}
  </h3>
  <p className="text-xs text-white/70 line-clamp-3 leading-relaxed italic">
    {scen.description || "No summary provided."}
  </p>
</div>
```

After:
```tsx
<div className="absolute inset-x-0 bottom-0 h-28 p-6 pointer-events-none flex flex-col">
  <h3 className="text-xl font-black text-white leading-tight tracking-tight group-hover:text-blue-300 transition-colors truncate flex-shrink-0">
    {scen.title || "Unnamed Story"}
  </h3>
  <p className="text-xs text-white/70 line-clamp-3 leading-relaxed italic mt-1">
    {scen.description || "No summary provided."}
  </p>
</div>
```

Key changes:
- Add `h-28` to set a fixed height for the text container (this positions the title consistently)
- Change to `flex flex-col` layout
- Add `flex-shrink-0` to the title so it doesn't compress
- Change `mb-1` to `mt-1` on description so it flows down from title
- Remove the bottom alignment - the container is now anchored to bottom but has fixed height

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/chronicle/ImageLibraryTab.tsx` | Update "New Folder" card to semi-transparent with black text; update grid to match Your Stories |
| `src/components/chronicle/ScenarioHub.tsx` | Fixed-height text container with title at consistent position |

---

## Expected Results

| Issue | Before | After |
|-------|--------|-------|
| New Folder text | Gray text on solid gray background | Black text on semi-transparent background |
| Tile sizes | Smaller on Image Library | Same size as Your Stories |
| Title positions | Varies based on description length | All titles at the same height from bottom |
