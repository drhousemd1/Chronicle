

# Restyle Scene Gallery to Match Image Library

## Overview

The Scene Gallery in the Scenario Builder currently has inconsistent styling compared to the Image Library. The thumbnails lack the dark card treatment, the edit modal uses light/white styling, and interaction patterns differ. This plan aligns both pages for visual and functional consistency.

## Changes

### 1. Add `title` field to `Scene` type (`src/types.ts`)

The Image Library has titles on images but scenes don't. Add an optional `title` field to the `Scene` type so scenes can be renamed.

### 2. Restyle Scene Thumbnails in `WorldTab.tsx` (lines 916-986)

**Current:** `aspect-video rounded-xl border border-zinc-700 bg-zinc-800` with a pencil edit button, tag count text, and no footer bar.

**New:** Match the Image Library card pattern:
- Outer wrapper: `group relative` with hover translate disabled (zoom only)
- Card container: `rounded-xl overflow-hidden border border-[#4a5f7f]` (slate blue border)
- Image area: `aspect-video` (16:9 ratio, not square like Image Library) with `object-cover`, zoom on hover (`transition-transform duration-700 group-hover:scale-110`), and clicking anywhere on the image opens the tag editor (remove pencil button)
- Footer bar: `bg-zinc-700 px-3 py-2` with scene title (or "Untitled scene") and "16:9" aspect ratio icon (since all scenes are landscape)
- No tags displayed on the thumbnail
- Delete button and Starting Scene star remain as hover overlays on top corners (same positioning as Image Library's star/delete)

### 3. Restyle `SceneTagEditorModal.tsx` to match Image Library lightbox

**Current:** White/light themed modal (`bg-white`, `text-slate-900`, `bg-slate-50` inputs) -- completely wrong colors.

**New:** Dark themed modal matching the Image Library lightbox:
- Overlay: `fixed inset-0 z-50 bg-black/85` with click-to-close
- Inner container: `bg-zinc-900 rounded-xl border border-[#4a5f7f] p-3 w-[600px]`
- Image at top: `w-full h-[50vh] object-contain rounded-lg` (same as Image Library)
- Title section: editable text input with label "TITLE", `bg-zinc-800 border border-zinc-700 rounded-lg text-white`
- Tag pills: `bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full` with X to remove (no `#` prefix)
- Tag input: `bg-zinc-800 border-zinc-700` with "Add tag and press Enter..." placeholder
- Tag count: `X/10 tags - Press Enter to add`
- Footer: Shadow Surface styled Cancel/Save buttons
- Add `onUpdateTitle` callback prop for saving the scene title

### 4. Update Scene Grid Layout

Change from `grid-cols-2 md:grid-cols-3 gap-6` to `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6` for better responsiveness, closer to the Image Library grid.

### 5. Wire up title saving

When the user saves from the modal, update both `title` and `tags` on the scene via the existing `onUpdateScenes` callback. The title is stored in-memory on the `Scene` object (same as tags) and persisted when the scenario is saved.

## Files Changed

1. **`src/types.ts`** -- Add optional `title?: string` to `Scene` type
2. **`src/components/chronicle/SceneTagEditorModal.tsx`** -- Complete restyle to dark theme matching Image Library lightbox, add title editing, rename to reflect broader scope
3. **`src/components/chronicle/WorldTab.tsx`** -- Restyle scene thumbnails (card with slate blue border, zinc-700 footer bar, zoom hover effect, click-to-open instead of pencil button), pass new title update handler to modal

## Visual Result

**Thumbnail (before):**
- Bare image with gradient overlay, tag count text, pencil icon to edit

**Thumbnail (after):**
```
+--[ #4a5f7f border ]------------------+
|                                       |
|   [16:9 scene image, zoom on hover]  |
|   [star icon]            [delete btn] |  <- hover overlays
|                                       |
+---------------------------------------+
| [bg-zinc-700] "Bedroom scene"  16:9  |  <- footer bar
+---------------------------------------+
```

**Edit Modal (before):** White background, light inputs, side-by-side layout

**Edit Modal (after):**
```
+--[ bg-zinc-900, #4a5f7f border ]-----+
|                                       |
|   [Scene image, object-contain]       |
|                                       |
|   TITLE                               |
|   [ Dark input: "Bedroom scene"  ]    |
|                                       |
|   [tag pill] [tag pill] [tag pill]    |
|   [ Add tag and press Enter...    ]   |
|   3/10 tags - Press Enter to add      |
|                                       |
|              [ Cancel ]  [ Save ]     |
+---------------------------------------+
```
