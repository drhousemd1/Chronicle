
# Update App Guide Documents: Image Library and Character Library

## Overview

Both guide documents need updates to reflect recent code changes. The Image Library guide has significant outdated information, while the Character Library guide needs minor updates.

---

## Image Library Page Guide -- Updates Needed

### 1. Page Overview Table
- Update line count from "730 lines" to "896 lines"
- Add mention of search/filter capability (previously listed as absent)

### 2. Image Tile (Section 4) -- Major Rewrite
The current guide describes a simple square tile with a hover overlay. The actual tile now has:
- A wrapper div with `border border-[#4a5f7f]` and `rounded-xl overflow-hidden` (matching the brand border standard)
- `overflow-hidden` on the image container to clip the zoom effect within the image area
- A gray footer bar (`bg-zinc-700 px-3 py-2`) below the image showing title and detected aspect ratio with an orientation icon
- The old `bg-black/30` hover overlay has been **removed** -- only the image zoom effect remains on hover
- Star and delete buttons remain, positioned inside the image container

### 3. Lightbox (Section 5) -- Major Rewrite
The current guide describes a white lightbox card. The actual lightbox now has:
- Dark theme: `bg-zinc-900` card with `border border-[#4a5f7f]`
- Backdrop: `bg-black/85` (was `bg-black/60`)
- Editable title field with label, input (`bg-zinc-800 border-zinc-700 rounded-lg`), and focus ring (`ring-[#4a5f7f]`)
- Tag editor section: displays tags as blue pills (`bg-blue-500/20 text-blue-300 rounded-full border border-blue-500/30`) without `#` prefix, each with an X remove button; plus an "Add tag" input and counter ("X/10 tags")
- Save and Cancel footer buttons using the standard Shadow Surface style
- Max height reduced for image: `max-h-[50vh]` (was implied full)

### 4. Aspect Ratio Detection -- New Feature
- Add documentation for the `STANDARD_RATIOS` array and `getClosestRatio()` helper
- Add documentation for the `AspectRatioIcon` SVG component
- Explain the `useEffect` that loads each image to detect natural dimensions and maps to closest standard ratio
- State: `aspectRatios: Record<string, { label, orientation }>`

### 5. Search/Filter -- New Feature
- The `searchQuery` prop is passed from `Index.tsx` header
- `filteredImages` memo filters by tag, title, and filename (case-insensitive partial match)
- Remove known issue #6 ("No search or filter")

### 6. Tag Management -- New Feature
- `handleUpdateImageTags(imageId, newTags)` function persists tags to `library_images` table
- Tags are added via Enter key in lightbox input, removed via X button on pill
- Tags display without `#` prefix (plain text)
- Maximum 10 tags per image

### 7. Data Architecture Updates
- `library_images` table: add `title` (text) and `tags` (text[]) columns to the documented schema
- Folder loading now uses `get_folders_with_details` RPC instead of N+1 queries -- remove known issue #2 and #3

### 8. Styling Reference Updates
- Remove `bg-black/30` from image hover overlay (no longer exists)
- Add `border-[#4a5f7f]` for image tile wrapper
- Add `bg-zinc-700` for image footer bar
- Change lightbox colors from `bg-white` to `bg-zinc-900`
- Change lightbox backdrop from `bg-black/60` to `bg-black/85`
- Add tag pill colors: `bg-blue-500/20`, `text-blue-300`, `border-blue-500/30`
- Add `bg-zinc-800` and `border-zinc-700` for lightbox input fields

### 9. Known Issues Updates
- Remove issue #2 (N+1 queries -- fixed by RPC)
- Remove issue #3 (two-query thumbnail -- fixed by RPC)
- Remove issue #6 (no search/filter -- now implemented)
- Update issue #5 (lightbox is now dark-themed, 600px max still applies)
- Update issue #4 (light-theme empty state -- still relevant but lightbox is now dark)

### 10. Component Tree Update
- Add aspect ratio detection under Image Tile
- Add tag editor and title editor under Lightbox
- Add filteredImages logic note

### 11. Custom Events/Callbacks Update
- Add `handleUpdateImageTags(imageId, newTags)` 
- Update `loadFolders()` to note it now uses RPC

---

## Character Library Page Guide -- Updates Needed

### 1. Tag Display
- Update tag badge description: tags display as plain text without `#` prefix
- This affects the TagInput component used in the character editor's Tags field

### 2. Verify No Other Changes
- After thorough review, the Character Library guide is otherwise accurate and up to date

---

## Technical Approach

Both guides are stored in the `guide_documents` table. The updates will be made by reading the current markdown, applying all the changes listed above, and writing the updated markdown back via Supabase update queries. The existing document structure (numbered sections, tables, ASCII diagrams, code blocks) will be preserved. All new content will follow the same formatting patterns already established in the documents.

