

# Revised Plan: Editor Toolbar + Image Library Guide Content

## Task 1: Add Formatting Toolbar to Guide Editor

The current `GuideEditor.tsx` is read-only (no textarea, no editing). We need to make it editable with a formatting toolbar, while keeping the same rendered preview look.

### What changes

**New file: `src/components/admin/guide/GuideEditorToolbar.tsx`**
A toolbar component with icon buttons for:
- **Bold** (wraps selection in `**`)
- **Italic** (wraps selection in `*`)
- **Heading 1 / 2 / 3** (prepends `# ` / `## ` / `### ` to line)
- **Bullet List** (prepends `- ` to line)
- **Numbered List** (prepends `1. ` to line)
- **Code Block** (wraps selection in triple backticks)
- **Insert Table** -- a small dropdown/popover: a grid of cells (e.g. 5x5 max) where you hover to select dimensions, then it inserts a markdown table with that many rows and columns. Simple and familiar (like Word's table picker).
- **Horizontal Rule** (inserts `---`)

Each button operates on a textarea ref -- inserting markdown syntax at the cursor position or wrapping the current selection.

**Modified: `src/components/admin/guide/GuideEditor.tsx`**
- Add a new `onMarkdownChange` prop
- Below the title bar, render the `GuideEditorToolbar`
- Below the toolbar, show a `<textarea>` for raw markdown editing (full width, dark themed, monospace font)
- Below the textarea, keep the existing rendered preview (so you type above and see the result below)
- The textarea and preview share the same scroll area or are stacked vertically

**Modified: `src/components/admin/guide/AppGuideTool.tsx`**
- Pass `onMarkdownChange={(md) => setActiveDocMarkdown(md)}` to `GuideEditor`

### Table Insertion UX
When you click the Table button, a small popover appears with a 5x5 grid. As you hover over cells, the grid highlights to show e.g. "3x4" (3 columns, 4 rows). Clicking inserts a markdown table template like:

```
| Col 1 | Col 2 | Col 3 |
|-------|-------|-------|
|       |       |       |
|       |       |       |
|       |       |       |
```

For adding rows/columns to an existing table, a simple approach: when the cursor is inside a table in the textarea, show "+Column" and "+Row" buttons in the toolbar (or at minimum, the user can just type a new `|` cell or a new row line -- markdown tables are straightforward to extend manually once the structure is there).

---

## Task 2: Fill Out Image Library Page Guide

Write the full markdown content to the existing document (ID: `6e01c9d9-79c7-4ccd-b182-6db680714e92`) following the same 13-section structure used by the other guides.

### Sections

1. **Page Overview** -- Route `tab === "image_library"` in `Index.tsx`, primary source `ImageLibraryTab.tsx`, purpose (folder-based image organization for reuse across the app), sidebar position 4th item, entry points (sidebar click, `ImageLibraryPickerModal` from other pages).

2. **Layout and Structure** -- Two views: Folder Grid and Folder Detail. Folder grid uses `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5`. Folder Detail has header row + square image grid. Header bar shows back arrow, title, background picker.

3. **UI Elements -- Complete Inventory** -- Full table of every interactive element (back button, heading, folder cards, new folder card, edit/upload buttons, image tiles, star/thumbnail button, delete buttons, lightbox, modals).

4. **Cards / List Items** -- Folder card breakdown (aspect-[2/3], rounded-[2rem], border, hover effects, badges, gradient overlay). "New Folder" dashed card. Image tile details (aspect-square, rounded-xl, hover overlay with star and delete).

5. **Modals and Overlays** -- FolderEditModal, DeleteConfirmDialog, Lightbox, ImageLibraryPickerModal (used from other pages), BackgroundPickerModal.

6. **Data Architecture** -- `image_folders` and `library_images` tables. Storage bucket `image_library` with path `{user_id}/{folder_id}/{filename}`. Image resizing (1920x1080, 0.85 quality). Direct useState management. Thumbnail resolution logic.

7. **Component Tree** -- Index.tsx > header > ImageLibraryTab > Folder Grid OR Folder Detail.

8. **Custom Events and Callbacks** -- loadFolders, loadFolderImages, handleCreateFolder, handleUpdateFolder, handleDeleteFolder, handleOpenFolder, exitFolder, handleUploadImages, handleDeleteImage, handleSetThumbnail, onFolderChange.

9. **Styling Reference** -- Key colors, typography, radii matching the code.

10. **Cross-Page Dependencies** -- ImageLibraryPickerModal used from UploadSourceMenu (Avatar, Cover, Scene image flows). BackgroundPickerModal shared with Your Stories.

11. **Security and Access Control** -- All CRUD on both tables scoped to auth.uid() = user_id. Storage scoped by user_id prefix.

12. **Known Issues / Quirks** -- Fragile storage cleanup via URL string splitting, N+1 count queries, two-query thumbnail resolution, light-theme empty state on dark background, 600px lightbox max-width.

13. **Planned / Future Changes** -- None documented.

### Implementation
Single database update to write markdown to `guide_documents` row `6e01c9d9-79c7-4ccd-b182-6db680714e92`.

---

## Technical Summary

| Change | Files |
|--------|-------|
| New toolbar component | `src/components/admin/guide/GuideEditorToolbar.tsx` (new) |
| Make editor editable + wire toolbar | `src/components/admin/guide/GuideEditor.tsx` (modified) |
| Pass onMarkdownChange prop | `src/components/admin/guide/AppGuideTool.tsx` (modified) |
| Image Library guide content | Database update only (no code files) |

