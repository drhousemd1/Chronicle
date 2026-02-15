

# Community Gallery Header Fixes

## What's changing

Three fixes to the Community Gallery page, all in `src/components/chronicle/GalleryHub.tsx` and `src/pages/Index.tsx`:

1. **Move the sort toggle pills to the page header** -- Place them next to the "Community Gallery" title text in `Index.tsx`, exactly like the Your Stories page has its filter pills next to its title. This keeps it fixed and consistent.

2. **Replace the faint header border with the blue gradient divider** -- Remove the subtle `rgba(255,255,255,0.05)` border-bottom on GalleryHub's search header. Move the navy blue gradient divider up to sit directly below the search bar header (sticky, does not scroll).

3. **Clear the search placeholder** -- Change `"Type here to Search for Characters"` to `""`.

## Technical Details

### File 1: `src/pages/Index.tsx`

**Around line 1480** -- Change the gallery tab header from just a title to a title + sort toggle, matching the Your Stories pattern:

Current:
```tsx
{tab === "gallery" && (
  <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight">
    Community Gallery
  </h1>
)}
```

New: Wrap in a flex container with the sort toggle pills, same structure as the `tab === "hub"` block (lines 1422-1474). The sort pills will use the same styling (`bg-[#2b2b2e]` container, `bg-[#4a5f7f]` active state).

This requires lifting `sortBy` and `setSortBy` out of GalleryHub -- or adding `sortBy`/`onSortChange` props to GalleryHub and managing state in Index.tsx. We'll add a new state `gallerySortBy` in Index.tsx and pass it down.

### File 2: `src/components/chronicle/GalleryHub.tsx`

1. **Props**: Add `sortBy` and `onSortChange` props so the parent controls sorting.
2. **Line 256**: Change `placeholder="Type here to Search for Characters"` to `placeholder=""`.
3. **Line 245**: Remove `borderBottom: '1px solid rgba(255, 255, 255, 0.05)'` from the header style.
4. **Lines 364-396**: Remove the sort toggle and the old blue gradient divider from the scrollable area.
5. **After the header (after line 285)**: Add the blue gradient divider as a sticky element directly below the search header so it stays fixed when scrolling. It replaces the old faint border.

