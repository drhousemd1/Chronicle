

# Fix Image Library Folder Detail View: Buttons, Text Contrast, and Back Arrow

## Problems
1. "Edit Folder" and "+ Upload Images" buttons use the old `UI.tsx` Button component instead of the app's Shadow Surface button standard
2. Folder name and description text is hardcoded `text-slate-900` / `text-slate-500` -- invisible on dark or custom backgrounds
3. No back arrow in the page header to exit the folder view -- the existing back arrow is inside the content area, not the fixed header

## Changes

### 1. `src/components/chronicle/ImageLibraryTab.tsx` (Folder Detail View, lines 534-582)

**Button styling** -- Replace `<Button variant="secondary">` and `<Button variant="primary">` with inline-styled buttons matching the Shadow Surface spec:
- `rounded-xl bg-[hsl(var(--ui-surface-2))] border-[hsl(var(--ui-border))] text-[hsl(var(--ui-text))] shadow-[0_10px_30px_rgba(0,0,0,0.35)] h-10 px-6 text-[10px] font-bold uppercase tracking-wider`

**Text contrast** -- Change folder name from `text-slate-900` to `text-white` and description from `text-slate-500` to `text-white/60`. These will always be readable since the Image Library page uses a black background (or custom dark backgrounds).

**Back arrow styling** -- Update the existing back arrow's hover state from `hover:bg-slate-100` to `hover:bg-white/10` so it works on dark backgrounds.

### 2. `src/pages/Index.tsx` (Header, around line 1451)

**Add back arrow to header** -- When the Image Library tab is active AND a folder is selected, show a back arrow to the left of "Image Library" in the page header. This requires:
- Exposing the `selectedFolder` state from `ImageLibraryTab` up to `Index.tsx` (via a callback prop or lifting state)
- OR: Adding a ref-based approach

The simpler approach: Add a `onFolderChange` callback prop to `ImageLibraryTab` that reports when a folder is opened/closed. `Index.tsx` tracks this with a `isInImageFolder` boolean state and conditionally renders a back arrow in the header that triggers folder exit.

**Alternatively** (simpler, no state lifting): Move the back arrow logic entirely into the `ImageLibraryTab` component's folder detail header -- it already has one at line 541. Just restyle it for dark backgrounds and keep it as-is. The page header "IMAGE LIBRARY" stays static.

**Recommended approach**: Keep it simple -- leave the back arrow inside `ImageLibraryTab`'s folder detail view (it already exists), just fix its styling for dark backgrounds. No header changes needed since the back arrow is already visible and functional in the content area.

### 3. Also fix in `ImageLibraryTab.tsx`

**Delete image confirm dialog** (line 342) -- Currently uses `confirm('Delete this image?')`. Should be replaced with the new `DeleteConfirmDialog` for consistency (bonus fix).

**Delete folder confirm dialog** (line 214) -- Same issue.

## Summary of File Edits

### `src/components/chronicle/ImageLibraryTab.tsx`
- Lines 547: Back arrow hover: `hover:bg-slate-100` to `hover:bg-white/10`, text color to `text-white`
- Line 552: Folder name: `text-slate-900` to `text-white`
- Line 554: Description: `text-slate-500` to `text-white/60`
- Lines 559-571: Replace both Button components with Shadow Surface styled buttons
- Lines 214, 342: Replace `confirm()` calls with `DeleteConfirmDialog`
