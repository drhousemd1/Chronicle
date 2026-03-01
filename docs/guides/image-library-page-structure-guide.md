> **INSTRUCTIONS FOR LOVABLE / AI AGENTS**
>
> MANDATORY: Before editing this file, read `docs/guides/GUIDE_STYLE_RULES.md` in full.
>
> That file defines heading hierarchy, table formatting, code block rules, good-vs-bad content patterns, and section-specific requirements. You must follow it exactly.
>
> This document is the SINGLE SOURCE OF TRUTH for this page's architecture.
>
> When making changes to this page's code, you MUST:
>
> 1. READ `docs/guides/GUIDE_STYLE_RULES.md` before making any edits to this document
> 2. READ this entire document before making any code changes
> 3. UPDATE this document IN-PLACE after making code changes — do NOT append summaries
> 4. PRESERVE the exact 13-section format — do not skip sections, do not reorganize
> 5. USE REAL VALUES from the code — exact file paths, exact Tailwind classes, exact hex codes
> 6. UPDATE the Known Issues section (Section 12) when fixing or discovering bugs
> 7. CROSS-REFERENCE the Shared Elements page when modifying any shared component
>
> If a section does not apply, write: `N/A — [specific reason]`
>
> Never write: "see code for details" — this document exists so no one needs to read the code.

# Image Library Page (Structure Guide)

---

## 1. Page Overview

| Property | Value |
|---|---|
| **Route** | `tab === "image_library"` inside `Index.tsx` |
| **Primary Source** | `src/components/chronicle/ImageLibraryTab.tsx` (896 lines) |
| **Purpose** | Folder-based image organization for reuse across the app (avatars, covers, scene images) |
| **Sidebar Position** | 4th item — "Image Library" |
| **Entry Points** | Sidebar click, `ImageLibraryPickerModal` (read-only picker used from other pages) |
| **Auth Required** | Yes — all operations scoped to authenticated user |
| **Search/Filter** | Yes — `searchQuery` prop filters images by tag, title, and filename (case-insensitive partial match) |

The Image Library provides a centralized folder-based system for organizing uploaded images. Users create folders, upload images into them, set folder thumbnails, and can later pick images from the library when setting avatars, cover images, or scene images via the `ImageLibraryPickerModal`.

---

## 2. Layout and Structure

The page has **two distinct views** depending on whether a folder is selected:

### Folder Grid (no folder selected)

```
┌─────────────────────────────────────────────────────────┐
│  Header: ← Back | "Image Library" | ⚙ Background       │
├─────────────────────────────────────────────────────────┤
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌ ─ ─ ─ ┐   │
│  │      │  │      │  │      │  │      │  │  + New │   │
│  │Folder│  │Folder│  │Folder│  │Folder│  │ Folder │   │
│  │ Card │  │ Card │  │ Card │  │ Card │  │        │   │
│  │      │  │      │  │      │  │      │  └ ─ ─ ─ ┘   │
│  └──────┘  └──────┘  └──────┘  └──────┘               │
└─────────────────────────────────────────────────────────┘
```

- Grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 lg:gap-8`
- Padding: `p-4 lg:p-10`
- Background: inherits page background (customizable via `BackgroundPickerModal`)

### Folder Detail (folder selected)

```
┌─────────────────────────────────────────────────────────┐
│  Header: ← Back | "Image Library" [Search] | ⚙ Bg      │
├─────────────────────────────────────────────────────────┤
│  Folder Name (h1)          Folder description            │
├─────────────────────────────────────────────────────────┤
│  ┌───────────┐  ┌───────────┐  ┌───────────┐           │
│  │   image   │  │   image   │  │   image   │           │
│  │           │  │           │  │           │           │
│  ├───────────┤  ├───────────┤  ├───────────┤           │
│  │title  4:5 │  │title 16:9 │  │title  1:1 │           │
│  └───────────┘  └───────────┘  └───────────┘           │
└─────────────────────────────────────────────────────────┘
```

- Max width: `max-w-6xl mx-auto`
- Image grid: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6`
- Padding: `p-4 lg:p-10`

---

## 3. UI Elements — Complete Inventory

| Element | Location | Component | Behavior |
|---|---|---|---|
| Back button (←) | Header bar | `Index.tsx` header | Appears when inside a folder; calls `exitFolder()` via `onFolderChange` callback |
| "Image Library" heading | Header bar | `Index.tsx` header | Static title |
| Search bar | Header bar | `Index.tsx` header | Filters images within folder by tag, title, filename. `searchQuery` prop passed to `ImageLibraryTab`. |
| Background picker (⚙) | Header bar | `BackgroundPickerModal` | Opens modal for customizing page background |
| Folder card | Folder grid | Inline in `ImageLibraryTab` | 2:3 portrait tile with thumbnail, name, description, image count badge |
| "New Folder" card | Folder grid (last) | Inline button | Dashed border card, calls `handleCreateFolder()` |
| Edit button | Folder card hover overlay | Inline button | Opens `FolderEditModal` for that folder |
| Open button | Folder card hover overlay | Inline button | Calls `handleOpenFolder()` to enter folder detail |
| Delete button (folder) | Folder card top-right on hover | Inline button | Opens `DeleteConfirmDialog` |
| Folder name (h1) | Folder detail header | Inline | `text-2xl font-black text-white` |
| Upload Images button | Folder detail header right | Inline button + hidden file input | Triggers file picker, calls `handleUploadImages()` |
| Image tile | Folder detail grid | Inline div | Image with border, footer bar, hover zoom |
| Star/thumbnail button | Image tile top-left on hover | Inline button | Calls `handleSetThumbnail()`, amber when active |
| Delete button (image) | Image tile top-right on hover | Inline button | Opens `DeleteConfirmDialog` |
| Aspect ratio footer | Image tile footer bar | Inline div | Shows title and detected aspect ratio with orientation icon |
| Lightbox overlay | Full screen on image click | Inline div | Fixed overlay with enlarged image, title editor, tag editor, save/cancel buttons |
| `FolderEditModal` | Both views | `FolderEditModal` component | Dialog for editing folder name and description |
| `DeleteConfirmDialog` | Folder detail view | `DeleteConfirmDialog` component | Confirm dialog with custom messages per delete type |

---

## 4. Cards / List Items

### Folder Card

```
┌─────────────────────────────┐  ← border border-[#4a5f7f]
│         [🗑 delete]          │  ← top-4 right-4, opacity-0 on idle
│                              │
│      (thumbnail image        │  ← h-full w-full object-cover
│       or FolderOpen icon)    │     hover: scale-110 duration-700
│                              │
│  ┌─ gradient overlay ──────┐ │  ← from-slate-950 via-slate-900/20
│  │  [12 IMAGES]            │ │  ← bg-blue-600 badge
│  │  Folder Name            │ │  ← text-xl font-black
│  │  description italic     │ │  ← text-xs text-white/70
│  └─────────────────────────┘ │
│                              │
│  ┌─ hover overlay ─────────┐ │  ← bg-black/30
│  │   [Edit]  [Open]        │ │  ← white + blue buttons
│  └─────────────────────────┘ │
└─────────────────────────────┘
```

| Property | Value |
|---|---|
| Aspect ratio | `aspect-[2/3]` |
| Border radius | `rounded-[2rem]` |
| Border | `border border-[#4a5f7f]` |
| Shadow | `shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)]` |
| Hover lift | `-translate-y-3` + `shadow-2xl` |
| Image zoom on hover | `scale-110 duration-700` |
| Empty state | `FolderOpen` icon (`w-16 h-16 text-white/10`) on `bg-slate-900` |
| Gradient overlay | `from-slate-950 via-slate-900/20 to-transparent opacity-90` |
| Badge | `bg-blue-600 text-[9px] font-black uppercase tracking-widest` |
| Name | `text-xl font-black text-white`, hover: `text-blue-300` |
| Description | `text-xs text-white/70 line-clamp-2 italic` |

### "New Folder" Card

| Property | Value |
|---|---|
| Aspect ratio | `aspect-[2/3]` |
| Border | `border-2 border-dashed border-zinc-600`, hover: `border-blue-400` |
| Background | `bg-gradient-to-br from-zinc-800 to-zinc-900` |
| Icon | `Plus` in `w-16 h-16 rounded-full bg-zinc-700/50` |
| Label | `text-sm font-black uppercase tracking-widest text-zinc-500` |

### Image Tile (Folder Detail)

```
┌───────────────────────────┐  ← border border-[#4a5f7f]
│  [★]                 [🗑] │  ← buttons inside image container
│                           │
│       image               │  ← aspect-square, object-cover
│       hover: scale-110    │     overflow-hidden clips zoom
│                           │
├───────────────────────────┤
│  Title text         4:5 □ │  ← bg-zinc-700 footer bar
└───────────────────────────┘
```

| Property | Value |
|---|---|
| Wrapper | `rounded-xl overflow-hidden border border-[#4a5f7f] shadow-sm` hover: `shadow-lg` |
| Image container | `aspect-square bg-slate-100 overflow-hidden` |
| Image hover | `scale-110 duration-700` (zoom clipped by `overflow-hidden`) |
| Star button (idle) | `bg-white/80 text-slate-600`, hidden until hover |
| Star button (active) | `bg-amber-500 text-white`, always visible |
| Delete button | `bg-rose-500 text-white rounded-lg`, hidden until hover |
| Footer bar | `bg-zinc-700 px-3 py-2` |
| Title in footer | `text-xs text-white truncate font-medium` |
| Aspect ratio label | `text-[10px] text-zinc-400` with `AspectRatioIcon` |

**Note**: The old `bg-black/30` hover overlay and bottom filename gradient have been **removed**. Only the image zoom effect remains on hover.

### Aspect Ratio Detection

Each image's natural dimensions are detected via an `Image()` element `onload` handler. The dimensions are compared against a `STANDARD_RATIOS` array to find the closest standard ratio:

| Ratios (portrait) | Ratios (landscape) | Square |
|---|---|---|
| 9:16, 2:3, 3:4, 4:5, 3:5, 7:9 | 16:9, 5:3, 3:2, 4:3, 5:4, 9:7 | 1:1 |

- **Helper**: `getClosestRatio(w, h)` returns `{ label, orientation }` where orientation is `portrait`, `landscape`, or `square`
- **Icon**: `AspectRatioIcon` renders a 12×12 SVG with a stroked rectangle whose proportions match the detected orientation
- **State**: `aspectRatios: Record<string, { label: string; orientation }>` — populated via `useEffect` when `folderImages` changes
- **Display**: Footer bar shows the ratio label (e.g., "4:5") and orientation icon

---

## 5. Modals and Overlays

### FolderEditModal

- **Source**: `src/components/chronicle/FolderEditModal.tsx`
- **Trigger**: "Edit" button on folder card hover, or "Edit Folder" button in folder detail header
- **Fields**: Name (text input), Description (textarea)
- **Actions**: Save (calls `handleUpdateFolder`), Cancel (closes modal)
- **UI**: Uses `Dialog` from shadcn/ui, dark themed

### DeleteConfirmDialog

- **Source**: `src/components/chronicle/DeleteConfirmDialog.tsx`
- **Trigger**: Delete button on folder card or image tile
- **Messages**:
  - Folder: "This will permanently delete this folder and all its images."
  - Image: "This will permanently delete this image."
- **Actions**: Confirm (executes delete), Cancel

### Lightbox

```
┌──────────────── bg-black/85 ────────────────┐
│                                              │
│   ┌── bg-zinc-900 border-[#4a5f7f] ──────┐  │
│   │                                       │  │
│   │   [image max-h-[50vh] object-contain] │  │
│   │                                       │  │
│   │   Title                               │  │
│   │   ┌─────────────────────────────────┐ │  │
│   │   │ Enter image title...            │ │  │
│   │   └─────────────────────────────────┘ │  │
│   │                                       │  │
│   │   [tag1 ✕] [tag2 ✕] [tag3 ✕]        │  │
│   │   ┌─────────────────────────────────┐ │  │
│   │   │ Add tag and press Enter...      │ │  │
│   │   └─────────────────────────────────┘ │  │
│   │   3/10 tags • Press Enter to add      │  │
│   │                                       │  │
│   │                   [Cancel]  [Save]    │  │
│   └───────────────────────────────────────┘  │
│                                              │
└──────────────────────────────────────────────┘
```

- **Trigger**: Click on any image tile in folder detail
- **Backdrop**: `bg-black/85` (fixed, `z-50`)
- **Card**: `bg-zinc-900 rounded-xl shadow-2xl border border-[#4a5f7f] p-3 max-w-[600px]`
- **Image**: `max-h-[50vh] object-contain rounded-lg`
- **Title editor**: Label (`text-[10px] font-bold uppercase tracking-wider text-zinc-500`), input (`bg-zinc-800 border-zinc-700 rounded-lg text-sm`, focus: `ring-1 ring-[#4a5f7f]`)
- **Tag editor**: Tags as blue pills (`bg-blue-500/20 text-blue-300 rounded-full text-xs font-medium border border-blue-500/30`) with X remove button. Tags display as **plain text without `#` prefix**. Add tag input (`bg-zinc-800 border-zinc-700 rounded-lg`). Counter: `{count}/10 tags`.
- **Footer buttons**: Cancel and Save using `bg-[hsl(var(--ui-surface-2))] border-[hsl(var(--ui-border))] text-[hsl(var(--ui-text))] shadow-[0_10px_30px_rgba(0,0,0,0.35)] h-10 px-6 text-[10px] font-bold uppercase tracking-wider rounded-xl`
- **Close**: Click outside, or Escape key
- **Animation**: `animate-in fade-in zoom-in-95 duration-150`

### ImageLibraryPickerModal (used from OTHER pages)

- **Source**: `src/components/chronicle/ImageLibraryPickerModal.tsx`
- **Purpose**: Read-only picker that lets users select an image from their library folders
- **Flow**: Open modal → browse folders → select image → confirm → returns selected image URL
- **Used by**: `UploadSourceMenu` component, which appears in Avatar, Cover Image, and Scene Image upload flows
- **Does NOT appear on the Image Library page itself** — it is only used from other pages

### BackgroundPickerModal

- **Source**: `src/components/chronicle/BackgroundPickerModal.tsx`
- **Purpose**: Customize page background image
- **Shared with**: Your Stories page (separate selection state via `image_library_selected` flag)

---

## 6. Data Architecture

### Database Tables

**`image_folders`**

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key, `gen_random_uuid()` |
| `user_id` | uuid | Owner, used in RLS |
| `name` | text | Default: 'New Folder' |
| `description` | text | Nullable, default empty string |
| `thumbnail_image_id` | uuid | FK to `library_images.id`, nullable |
| `created_at` | timestamptz | Default: `now()` |
| `updated_at` | timestamptz | Default: `now()` |

**`library_images`**

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key, `gen_random_uuid()` |
| `user_id` | uuid | Owner, used in RLS |
| `folder_id` | uuid | FK to `image_folders.id` |
| `image_url` | text | Public URL from storage |
| `filename` | text | Original filename from upload |
| `title` | text | Editable title, default empty string |
| `tags` | text[] | Array of tag strings, default `'{}'` |
| `is_thumbnail` | boolean | Default: false (legacy, not actively used — `thumbnail_image_id` on folder is preferred) |
| `created_at` | timestamptz | Default: `now()` |

### Storage

- **Bucket**: `image_library`
- **Path pattern**: `{user_id}/{folder_id}/{uuid}-{timestamp}.jpg`
- **Upload process**: File → `FileReader.readAsDataURL()` → `resizeImage(dataUrl, 1920, 1080, 0.85)` → `fetch()` to blob → `supabase.storage.upload()`
- **Access**: Public URLs via `getPublicUrl()`

### Folder Loading — RPC

Folders are loaded via the `get_folders_with_details` database function (RPC), which returns all folder data in a **single query** including:
- Folder metadata (`id`, `name`, `description`, etc.)
- Thumbnail URL (resolved from `thumbnail_image_id` or first image fallback)
- Image count per folder

This eliminates the previous N+1 query pattern where separate count and thumbnail queries were run per folder.

### State Management

- Direct `useState` — no React Query or global store
- `folders: ImageFolder[]` — loaded on mount via RPC, updated optimistically
- `selectedFolder: ImageFolder | null` — current open folder
- `folderImages: LibraryImage[]` — images in current folder
- `editingFolder: ImageFolder | null` — folder being edited in modal
- `lightboxImage: LibraryImage | null` — image shown in lightbox
- `editTitle: string` — title being edited in lightbox
- `deleteTarget: { type, id } | null` — pending delete confirmation
- `aspectRatios: Record<string, { label, orientation }>` — detected aspect ratios for loaded images
- `searchQuery: string` — passed as prop from `Index.tsx` header, filters `folderImages` into `filteredImages`

### Search/Filter

The `searchQuery` prop is passed from the `Index.tsx` header search bar. When non-empty, a `filteredImages` memo filters `folderImages` by:
- Tag match (case-insensitive partial)
- Title match (case-insensitive partial)
- Filename match (case-insensitive partial)

The filtered array is used for rendering the image grid. No database calls are made — filtering is entirely client-side.

---

## 7. Component Tree

```
Index.tsx
├── Header bar
│   ├── Back button (← when in folder, via onFolderChange)
│   ├── "Image Library" heading
│   ├── Search bar (filters images in folder view)
│   └── BackgroundPickerModal (⚙ gear icon)
│
└── ImageLibraryTab
    ├── [Folder Grid view] (when selectedFolder === null)
    │   ├── Folder Card × N
    │   │   ├── Thumbnail image / FolderOpen icon
    │   │   ├── Gradient overlay
    │   │   ├── Image count badge
    │   │   ├── Name + description
    │   │   ├── Hover overlay (Edit + Open buttons)
    │   │   └── Delete button (top-right)
    │   ├── "New Folder" dashed card
    │   ├── Empty state (when no folders)
    │   └── FolderEditModal
    │
    └── [Folder Detail view] (when selectedFolder !== null)
        ├── Header (folder name, description)
        ├── filteredImages (searchQuery filters folderImages)
        ├── Image Grid
        │   └── Image Tile × N
        │       ├── Image container (overflow-hidden, hover zoom)
        │       ├── Star/thumbnail button (top-left)
        │       ├── Delete button (top-right)
        │       └── Footer bar (bg-zinc-700)
        │           ├── Title text
        │           └── Aspect ratio (label + orientation icon)
        ├── Empty state (when no images)
        ├── Lightbox overlay
        │   ├── Image (max-h-[50vh])
        │   ├── Title editor (input)
        │   ├── Tag editor (blue pills + add input)
        │   └── Save / Cancel buttons
        ├── FolderEditModal
        └── DeleteConfirmDialog
```

---

## 8. Custom Events and Callbacks

| Function | Trigger | Description |
|---|---|---|
| `loadFolders()` | Mount, `exitFolder()` | Fetches all folders via `get_folders_with_details` RPC — single query returns folder metadata, thumbnail URLs, and image counts |
| `loadFolderImages(folderId)` | `handleOpenFolder()` | Fetches all images in a folder, ordered by `created_at desc` |
| `handleCreateFolder()` | "New Folder" card click | Inserts new folder, adds to state, opens `FolderEditModal` |
| `handleUpdateFolder(id, patch)` | `FolderEditModal` save | Updates folder name/description in DB and local state |
| `handleDeleteFolder(id)` | Folder delete button | Sets `deleteTarget` to trigger `DeleteConfirmDialog` |
| `executeDeleteFolder(id)` | Confirm dialog confirm | Deletes images from storage, then deletes folder from DB (cascade handles image rows) |
| `handleOpenFolder(folder)` | Folder "Open" button | Sets `selectedFolder`, loads images, notifies parent via `onFolderChange(true, exitFn)` |
| `exitFolder()` | Back button (via parent) | Clears selected folder, reloads folders, notifies parent via `onFolderChange(false)` |
| `handleUploadImages(e)` | File input change | Reads files, resizes to 1920×1080 at 0.85 quality, uploads to storage, inserts DB rows |
| `handleDeleteImage(image)` | Image delete button | Sets `deleteTarget` to trigger `DeleteConfirmDialog` |
| `executeDeleteImage(image)` | Confirm dialog confirm | Deletes from storage (path extracted from URL), then deletes DB row |
| `handleSetThumbnail(image)` | Star button click | Updates `image_folders.thumbnail_image_id`, updates local state |
| `handleUpdateImageTags(imageId, newTags)` | Tag add/remove in lightbox | Updates `library_images.tags` in DB, updates `folderImages` and `lightboxImage` state |
| `onFolderChange(inFolder, exitFn?)` | Prop callback to `Index.tsx` | Tells parent whether user is inside a folder (controls back button visibility) |

---

## 9. Styling Reference

### Colors

| Token / Value | Usage |
|---|---|
| `border-[#4a5f7f]` | Folder card border, image tile border, lightbox card border |
| `bg-blue-600` | Image count badge, "Open" button |
| `bg-amber-500` | Active thumbnail star button |
| `bg-rose-500` | Image delete button |
| `bg-slate-900` | Empty folder card background |
| `text-white/70` | Folder description |
| `text-white/10` | Empty folder icon color |
| `bg-gradient-to-br from-zinc-800 to-zinc-900` | "New Folder" card |
| `border-zinc-600` / `border-blue-400` | "New Folder" card idle/hover |
| `bg-black/30` | Folder hover overlay |
| `bg-zinc-700` | Image tile footer bar |
| `bg-black/85` | Lightbox backdrop |
| `bg-zinc-900` | Lightbox card |
| `bg-zinc-800 border-zinc-700` | Lightbox input fields (title, tag add) |
| `bg-blue-500/20 text-blue-300 border-blue-500/30` | Tag pills in lightbox |
| `hsl(var(--ui-surface-2))` | Save/Cancel buttons in lightbox |
| `hsl(var(--ui-border))` | Save/Cancel button borders |

### Typography

| Style | Usage |
|---|---|
| `text-xl font-black` | Folder card name |
| `text-2xl font-black text-white` | Folder detail heading |
| `text-xs text-white/70 italic` | Folder description on card |
| `text-[9px] font-black uppercase tracking-widest` | Image count badge |
| `text-[10px] font-bold uppercase tracking-wider` | Save/Cancel buttons |
| `text-sm font-black uppercase tracking-widest` | "New Folder" label |
| `text-xs text-white truncate font-medium` | Image title in footer bar |
| `text-[10px] text-zinc-400` | Aspect ratio label in footer bar |
| `text-[10px] font-bold uppercase tracking-wider text-zinc-500` | Lightbox field labels |

### Border Radii

| Radius | Usage |
|---|---|
| `rounded-[2rem]` | Folder cards |
| `rounded-xl` | Image tile wrapper, lightbox card, Save/Cancel buttons, hover action buttons |
| `rounded-lg` | Star/delete buttons on image tiles, lightbox inputs |
| `rounded-md` | Image count badge |
| `rounded-full` | Folder delete button, "New Folder" icon circle, tag pills |
| `rounded-2xl` | Empty state border in folder detail |

---

## 10. Cross-Page Dependencies

### ImageLibraryPickerModal

- **Used from**: `UploadSourceMenu` component
- **Appears in**: Avatar upload flow, Cover Image upload flow, Scene Image upload flow
- **Function**: Provides a "From Library" option alongside "From Device" when uploading images
- **Flow**: Opens modal → user browses folders → selects image → confirms → returns `imageUrl` to calling context

### BackgroundPickerModal

- **Shared with**: Your Stories page
- **Differentiation**: `user_backgrounds` table has `image_library_selected` boolean flag to track which page the background applies to
- **Trigger**: Gear icon in the header bar

### No direct dependency on

- Scenarios or characters (images are independent of story content)
- Chat interface (no runtime image injection from library)

---

## 11. Security and Access Control

### Row Level Security

**`image_folders`** — all four policies scope to `auth.uid() = user_id`:
- SELECT: Users can view own folders
- INSERT: Users can create own folders
- UPDATE: Users can update own folders
- DELETE: Users can delete own folders

**`library_images`** — all four policies scope to `auth.uid() = user_id`:
- SELECT: Users can view own images
- INSERT: Users can create own images
- UPDATE: Users can update own images
- DELETE: Users can delete own images

### Storage Security

- Bucket: `image_library`
- Files stored under `{user_id}/` prefix
- No cross-user visibility — users can only access their own files

---

## 12. Known Issues / Quirks

1. **Fragile storage cleanup**: When deleting folders or images, the storage path is extracted from the public URL by splitting on `'/storage/v1/object/public/image_library/'`. If the URL format ever changes, cleanup will silently fail, leaving orphaned files in storage.

2. **Light-theme empty state on dark background**: The empty state in folder detail view uses `border-slate-200` and `text-slate-500`, which are light-theme colors that may appear washed out on the dark page background.

3. **600px lightbox max-width**: The lightbox container has `max-w-[600px]`, which may feel small on large desktop screens for high-resolution images. The lightbox itself is dark-themed (`bg-zinc-900`).

4. **Folder delete cascade**: Deleting a folder attempts to clean up storage files first, then deletes the DB row. If the storage cleanup fails partway through, the DB delete still proceeds, potentially orphaning remaining storage files.

---

## 13. Planned / Future Changes

No planned changes are currently documented for the Image Library page.