
# Fix Image Library Back Arrow: Match Scenario Builder Style and Remove Duplicate

## Problem
1. The header back arrow for Image Library uses different styling than the Scenario Builder's back arrow (different padding, hover color, icon style)
2. There's a duplicate back arrow inside the folder detail view content area -- the one in the header is sufficient
3. The folder name/description inside the folder detail view should remain but without its own back arrow

## Changes

### 1. `src/pages/Index.tsx` (line 1456-1462)
Replace the Image Library header back arrow to match the Scenario Builder's exact pattern:
- Change from `ArrowLeft` lucide icon to inline SVG chevron (same as Scenario Builder)
- Change className from `p-1.5 hover:bg-white/10 rounded-full transition-colors text-[hsl(var(--ui-text))]` to `p-2 hover:bg-slate-100 rounded-full transition-colors` (exact match)

### 2. `src/components/chronicle/ImageLibraryTab.tsx` (lines 564-569)
Remove the duplicate back arrow button from the folder detail view's internal header. The folder name and description remain, but the back arrow is gone since the header already has one.

## Files Modified
1. `src/pages/Index.tsx` -- Restyle header back arrow to match Scenario Builder
2. `src/components/chronicle/ImageLibraryTab.tsx` -- Remove duplicate back arrow from folder detail content
