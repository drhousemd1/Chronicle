

# Image Library Lightbox Improvements (4 Items)

---

## What You'll Notice After This

- The lightbox replaces the static filename text with an editable "Title" input field, pre-populated with the upload filename
- Renaming the title updates the database and shows on the thumbnail (always visible, not hover-only)
- The X close button is replaced with Save and Cancel buttons in the bottom-right, styled using the Shadow Surface button standard
- The search bar also matches against image titles, not just tags

---

## 1. Add `title` column to `library_images` table

A new `title` column (text, defaults to empty string) will be added to the `library_images` table. When empty, the UI falls back to displaying `filename`. This keeps the original filename intact as metadata while giving users a human-friendly editable title.

**Database migration:**
```sql
ALTER TABLE public.library_images
ADD COLUMN title text NOT NULL DEFAULT '';
```

---

## 2. Replace filename text with editable Title input in lightbox

**Current:** Static `<p>` showing `lightboxImage.filename`
**New:** An input field labeled "Title" pre-populated with `title` (falling back to `filename` if title is empty). Editing updates local state only -- changes are committed when the user clicks Save.

The input will use the same dark styling as the tag input (`bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white`).

**Files:** `src/components/chronicle/ImageLibraryTab.tsx`

---

## 3. Replace X close button with Save and Cancel buttons

**Current:** Floating X button in top-right corner.
**New:** A footer row at the bottom of the lightbox with Cancel (left) and Save (right) buttons using the Shadow Surface button standard:
- `rounded-xl bg-[hsl(var(--ui-surface-2))] border-[hsl(var(--ui-border))] text-[hsl(var(--ui-text))] shadow-[0_10px_30px_rgba(0,0,0,0.35)] h-10 px-6 text-[10px] font-bold uppercase tracking-wider`

Cancel discards any title changes and closes the lightbox. Save persists the title to the database (and tags, which already save immediately), then closes. Since tags already auto-save on Enter, the Save button primarily handles the title update.

**Files:** `src/components/chronicle/ImageLibraryTab.tsx`

---

## 4. Show title always visible on thumbnails + update search

**Current:** Filename shows only on hover via a gradient overlay.
**New:** The title (or filename fallback) is always visible at the bottom of the thumbnail, overlaid on a persistent gradient. The hover-only behavior is removed.

**Search update:** The `filteredImages` logic will also match against `title` and `filename`, not just tags:
```
img.tags.some(...) || title.includes(query) || filename.includes(query)
```

**Files:** `src/components/chronicle/ImageLibraryTab.tsx`

---

## Technical Details

### Database Migration

```sql
ALTER TABLE public.library_images
ADD COLUMN title text NOT NULL DEFAULT '';
```

### Files Modified

- **Database migration** -- add `title` column
- **`src/components/chronicle/ImageLibraryTab.tsx`**
  - Add `title` to `LibraryImage` type
  - Add `title` to `loadFolderImages` mapping
  - Lightbox: replace static filename `<p>` with editable input, add local `editTitle` state
  - Lightbox: remove X close button, add Save/Cancel footer with Shadow Surface styling
  - Save handler: update `title` in DB via supabase update, then close
  - Thumbnail: make title/filename always visible (remove `opacity-0 group-hover:opacity-100`)
  - `filteredImages`: also match against `title` and `filename`
- **`src/components/chronicle/ImageLibraryPickerModal.tsx`**
  - Add `title` to image mapping
