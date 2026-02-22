

# Image Library Fixes + Character Library Search Bar Restyle (5 Items)

---

## What You'll Notice After This

- Image thumbnails inside folders use the slate blue border (#4a5f7f) instead of white
- Clicking a thumbnail opens a lightbox with a much darker backdrop (bg-black/85 instead of bg-black/60)
- A tag system lets you add/remove tags on each image via the lightbox view
- A search bar (dark styled, matching the Gallery header) appears in the Image Library header when inside a folder, filtering images by tags
- The Character Library search bar is restyled to match the Gallery header pill bar aesthetic (dark rounded container with proper colors)

---

## 1. Fix image thumbnail borders inside folders

**The problem:** Line 591 in `ImageLibraryTab.tsx` uses `border-slate-200` (light gray) for image tiles inside folders.

**The fix:** Change to `border border-[#4a5f7f]` to match the unified card border standard used everywhere else (folders, story cards, gallery cards).

**File:** `src/components/chronicle/ImageLibraryTab.tsx` (line 591)

---

## 2. Darken lightbox backdrop

**The problem:** The lightbox overlay uses `bg-black/60` which doesn't provide enough contrast -- images behind bleed through.

**The fix:** Change to `bg-black/85` for a much darker backdrop that properly isolates the lightbox image.

**File:** `src/components/chronicle/ImageLibraryTab.tsx` (line 653)

---

## 3. Add tag system to images

**What it does:** After clicking a thumbnail to open the lightbox, users see a tag area below the filename. They can type tags and press Enter to add them. Tags are saved to the database. This gives images searchable metadata.

**Implementation:**
- Add a `tags` column (`text[] DEFAULT '{}'`) to the `library_images` table via migration
- Add `tags` to the `LibraryImage` type
- In the lightbox view, render existing tags as removable pills and an input to add new ones (styled dark to match the lightbox)
- On add/remove, update the database and local state immediately
- Use the same `TagInput`-style interaction pattern but simplified for inline use

**Files:**
- Database migration (add `tags` column to `library_images`)
- `src/components/chronicle/ImageLibraryTab.tsx` (lightbox section, LibraryImage type, loadFolderImages mapping)

---

## 4. Add search bar to Image Library header (inside folder view)

**What it does:** When viewing images inside a folder, a search input appears to the right of the "Image Library" title in the header. It filters the displayed images by matching against their tags.

**Styling:** Matches the Gallery header dark style -- `bg-[#2b2b2e] rounded-full` container with the same color palette (`text-white`, `placeholder:text-zinc-500`, `border-[#2b2b2e]`).

**Implementation:**
- Add `imageLibrarySearchQuery` state to `Index.tsx`
- Show the search input next to the "Image Library" title only when `isInImageFolder` is true
- Pass the search query down to `ImageLibraryTab` which filters `folderImages` client-side by tag matches
- Clear the search query when exiting a folder

**Files:** `src/pages/Index.tsx` (header section for image_library tab)

---

## 5. Restyle Character Library search bar

**The problem:** The current search bar (image 3) uses `bg-[#3a3a3f]/50 border-white/10` which renders as a washed-out gray blob against the white header. It looks nothing like the dark pill bar in the Gallery header (image 4).

**The fix:** Wrap the search input in a dark container matching the Gallery header style:
- Container: `bg-[#2b2b2e] rounded-full p-1 border border-[#2b2b2e]`
- Input inside: transparent background, `text-white`, `placeholder:text-zinc-500`
- This creates the same dark rounded bar appearance as the Gallery sort pills

**File:** `src/pages/Index.tsx` (lines 1492-1499)

---

## Technical Details

### Database Migration

```sql
ALTER TABLE public.library_images
ADD COLUMN tags text[] NOT NULL DEFAULT '{}';
```

### Files Modified

- **Database migration** -- add `tags` column to `library_images`
- **`src/components/chronicle/ImageLibraryTab.tsx`**
  - Line 591: Change image tile border from `border-slate-200` to `border-[#4a5f7f]`
  - Line 653: Change lightbox backdrop from `bg-black/60` to `bg-black/85`
  - Add `tags` to `LibraryImage` type and `loadFolderImages` mapping
  - Add tag editor UI below filename in lightbox (dark styled pills + input)
  - Accept optional `searchQuery` prop to filter images by tags
- **`src/pages/Index.tsx`**
  - Add `imageLibrarySearchQuery` state
  - Add dark-styled search input to image_library header (when in folder)
  - Pass `searchQuery` prop to `ImageLibraryTab`
  - Restyle character library search bar to match Gallery dark pill bar aesthetic
  - Clear image search query on folder exit

### App Guide Update

Update the "Image Library Page" guide document:
- Document the tag system (how tags are added, stored, searched)
- Document the search bar in the header
- Document the updated thumbnail borders and lightbox styling
- Remove any remaining known issues that are now fixed

