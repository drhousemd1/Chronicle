

# Reskin SidebarThemeModal to Match App Design System

## What's Changing

Replace the current flat dark modal with the standardized "Dark Premium" modal spec used across the app (same as Chat Settings, AI generation modals, etc.), and port over the new features from the Claude-designed JSX file.

## New Features from the Uploaded File
1. **Slate-blue gradient header** with gloss sheen (matching all other modals)
2. **Inner tray** (`#2e2e33`) containing the grid and controls
3. **Close button** inside the tray alongside Upload Image
4. **Categorized rows** — tiles grouped under renamable category labels (click-to-rename)
5. **Drag-and-drop reordering** — tiles can be dragged between categories, with auto-scroll and blue drop indicators
6. **"Drop here to create new category"** zone that appears while dragging
7. **Info tooltip** for recommended dimensions (replaces plain text)
8. **Grip handle icon** on each tile indicating draggability
9. **Row structure persistence** via existing background storage

## Implementation

### File: `src/components/chronicle/SidebarThemeModal.tsx`
Full rewrite incorporating:

- **Outer shell**: `bg-[#2a2a2f]`, `rounded-[24px]`, standard inset bevel shadow stack
- **Header**: `bg-gradient-to-b from-[#5a7292] to-[#4a5f7f]` with gloss sheen overlay, white uppercase title
- **Inner tray**: `bg-[#2e2e33]`, `rounded-2xl`, inset shadow
- **Buttons** (Close, Upload): `bg-[#3c3e47]`, `rounded-xl`, standard row shadow stack
- **Tile cards**: `bg-[#1c1c1f]`, `aspect-[1/3]`, `rounded-xl`, blue-500 selection ring
- **Grid**: 7-column layout with categorized rows
- **Drag-and-drop**: HTML5 drag API with auto-scroll near edges, blue drop indicator lines, "new category" drop zone
- **Renamable row labels**: Click to edit inline, blur/enter to save
- **Info tooltip**: Using existing Tooltip components from the app
- **Close button**: Calls `onClose` prop
- **Keep existing props interface** unchanged — the parent (`ChatInterfaceTab.tsx`) passes `backgrounds`, `onSelectBackground`, `onUpload`, `onDelete`, `isUploading` and those all still work
- Categories/row structure stored as local state initially; the `backgrounds` prop from the parent populates the first "Uncategorized" row
- The "From Library" dropdown option still opens `ImageLibraryPickerModal`

### File: `src/components/chronicle/ChatInterfaceTab.tsx`
No changes needed — the props interface stays the same.

## What Stays the Same
- All existing props and callbacks
- Selection behavior (blue check badge)
- Delete on hover (rose-500 trash button)
- Upload dropdown (From Device / From Library)
- Default tile as first option

