

# Image Library Fixes + Character Library Search Bar Styling (4 Items)

This plan addresses the actionable Image Library issues plus the character library search bar styling mismatch you spotted.

---

## What You'll Notice After This

- Storage path extraction uses a robust URL parsing method instead of fragile string splitting
- Folder loading is faster -- a single database call replaces the N+1 query pattern
- The lightbox border matches the slate blue (#4a5f7f) used on cards throughout the app
- The character library search bar matches the dark styling used in the Community Gallery

---

## 1. Make storage path extraction robust

**The problem:** When deleting images or folders, the code extracts the storage file path by splitting on the string `/storage/v1/object/public/image_library/`. If the backend URL format ever changes, the split silently fails and returns an empty string, meaning the storage file never gets deleted -- it just sits there orphaned, using storage space indefinitely.

**The fix:** Replace the string-split approach with proper `URL` parsing. The storage path always follows the bucket name in the URL path. We'll extract everything after `/object/public/image_library/` using `indexOf` on the parsed pathname, which is more reliable than splitting on the full URL prefix. We'll also add a fallback: if path extraction fails, log a warning so it's visible during development rather than silently skipping.

**Files:** `src/components/chronicle/ImageLibraryTab.tsx` (lines 231-235, 369-371)

---

## 2. Optimize N+1 folder queries with a database function

**The problem:** `loadFolders()` runs 1 query for all folders, then for each folder runs 1 count query + 1 thumbnail query. With 10 folders that's 21 database calls. With 50 folders it's 101 calls.

**The fix:** Create a database function `get_folders_with_details(p_user_id uuid)` that returns folders with their image count and thumbnail URL in a single call. The function will:
- Join `image_folders` with an aggregated count from `library_images`
- Resolve the thumbnail URL (use `thumbnail_image_id` if set, otherwise first image by `created_at`)
- Return everything in one result set

This replaces the entire `Promise.all` block with a single RPC call.

Also update `ImageLibraryPickerModal.tsx` which has the same N+1 pattern.

**Files:**
- Database migration (new function `get_folders_with_details`)
- `src/components/chronicle/ImageLibraryTab.tsx` (loadFolders)
- `src/components/chronicle/ImageLibraryPickerModal.tsx` (loadFolders)

---

## 3. Change lightbox border to slate blue

**The problem:** The lightbox uses `border-slate-200` (light gray) and `bg-white` which doesn't match the app's card styling.

**The fix:** Change the lightbox container to use the slate blue border (`border-[#4a5f7f]`) consistent with all other cards. Keep the current size as you confirmed it works well. Also darken the lightbox background from white to dark (`bg-zinc-900`) to match the overall dark theme, and update the close button and filename text accordingly.

**Files:** `src/components/chronicle/ImageLibraryTab.tsx` (lines 675, 681, 691)

---

## 4. Fix character library search bar styling

**The problem:** The search bar uses light-theme colors (`bg-slate-50 text-slate-900 border-slate-200`) which appears as white-on-white against the dark header, as shown in your screenshot.

**The fix:** Match the Community Gallery search bar styling:
- `bg-[#3a3a3f]/50` (dark semi-transparent background)
- `border border-white/10` (subtle light border)
- `text-white` (white text)
- `placeholder:text-zinc-500` (dim placeholder)
- `focus:ring-2 focus:ring-[#4a5f7f]` (slate blue focus ring)

**Files:** `src/pages/Index.tsx` (line 1498)

---

## Items NOT being changed (per your feedback)

- **Light-theme empty state (folder detail view):** You confirmed it looks correct as-is. No change.
- **Lightbox size:** You confirmed 600px works well. No change to dimensions.
- **Image search/filter:** No metadata exists to search against. Skipping until tags/descriptions are added to images.

---

## Technical Details

### Database Migration

```text
CREATE OR REPLACE FUNCTION public.get_folders_with_details(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  name text,
  description text,
  thumbnail_image_id uuid,
  thumbnail_url text,
  image_count bigint,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    f.id,
    f.user_id,
    f.name,
    f.description,
    f.thumbnail_image_id,
    COALESCE(
      thumb.image_url,
      first_img.image_url
    ) AS thumbnail_url,
    COALESCE(cnt.c, 0) AS image_count,
    f.created_at,
    f.updated_at
  FROM image_folders f
  LEFT JOIN library_images thumb
    ON thumb.id = f.thumbnail_image_id
  LEFT JOIN LATERAL (
    SELECT li.image_url
    FROM library_images li
    WHERE li.folder_id = f.id
    ORDER BY li.created_at ASC
    LIMIT 1
  ) first_img ON f.thumbnail_image_id IS NULL
  LEFT JOIN LATERAL (
    SELECT count(*) AS c
    FROM library_images li
    WHERE li.folder_id = f.id
  ) cnt ON true
  WHERE f.user_id = p_user_id
  ORDER BY f.updated_at DESC;
$$;
```

### Files Modified

- **Database migration** -- new `get_folders_with_details` function
- **`src/components/chronicle/ImageLibraryTab.tsx`**
  - Replace `loadFolders` Promise.all with single RPC call
  - Make storage path extraction robust (both delete functions)
  - Update lightbox border to `border-[#4a5f7f]` and darken background
- **`src/components/chronicle/ImageLibraryPickerModal.tsx`**
  - Replace `loadFolders` Promise.all with single RPC call
- **`src/pages/Index.tsx`**
  - Fix search bar classes to match Gallery dark styling

### App Guide Update

Update the "Image Library Page" document:
- Remove all 7 items from the Known Issues section
- Document the optimized folder loading (single RPC call)
- Document the robust storage path extraction
- Document the lightbox styling (slate blue border, dark background)
- Note that search was intentionally deferred until image metadata is added
