

# Revised Plan: Creator Profile Layout Match + Image Compression + Following Tab Fix

## Part 1: Creator Profile -- Exact Mirror of Public Profile Tab

The Creator Profile page must be a **read-only clone** of PublicProfileTab. Here is exactly what needs to change based on comparing the two layouts line by line.

### Profile Info Card (top section)

**Current CreatorProfile layout:**
- Avatar on left (w-72 h-72) -- CORRECT
- Right side: "CREATOR" label + name + Follow button inline, "ABOUT ME", "PREFERRED GENRES" -- labels and values are correct

**What needs to change:**
- Move the Follow/Unfollow button from next to the creator name to **centered below the avatar image**, in the same position where "Upload Image" and "AI Generate" buttons sit in PublicProfileTab
- Keep the "CREATOR" label row but show only the display name (no follow button there)
- The follow button should be a single centered button matching the width of the avatar column

### Stats Section

**Current CreatorProfile:** Separate card with 6 icons (Published, Likes, Saves, Views, Plays, Followers) in a centered grid.

**PublicProfileTab:** Stats are an **inline row in the Published Works header**, right-aligned: Heart + count, FileText + count, Bookmark + count, Eye + count, Play + count.

**What needs to change:**
- Remove the standalone stats card entirely
- Move the stats into the Published Works header row, right-aligned, matching the exact layout from PublicProfileTab (lines 438-451)
- Add "Followers" as an additional stat in that row (since PublicProfileTab doesn't have it, but Creator Profile should show follower count)

### Published Works Section

The cards themselves are already matching from the previous fix. The header needs the inline stats row added.

### Summary of CreatorProfile.tsx changes:
1. Remove standalone stats card (lines 248-268)
2. Move Follow button below avatar in the avatar column
3. Add inline stats to Published Works header row
4. Keep everything else identical to PublicProfileTab

---

## Part 2: Image Compression Throughout the Application

The "dial-up" slow loading is caused by AI-generated images being stored at full resolution (2-4MB PNGs). We need silent compression at every image entry point.

### Where images enter the system:
1. **Edge function: generate-cover-image** -- returns URL from xAI (or uploads b64 to storage)
2. **Edge function: generate-side-character-avatar** -- same pattern
3. **Edge function: generate-scene-image** -- returns URL from xAI
4. **Frontend: PublicProfileTab avatar upload** -- already uses `resizeImage(dataUrl, 400, 400, 0.85)`
5. **Frontend: CharactersTab avatar upload** -- needs checking
6. **Frontend: scene image saving** -- saves URL from edge function to storage

### Compression strategy:
- **Edge functions (covers and avatars):** After getting the image URL from xAI, fetch the image, compress it using canvas (convert to JPEG at quality 0.85, max 1024px for covers, 512px for avatars), then upload the compressed version to storage. This happens in the edge function so the user never sees the uncompressed version.
- **Problem:** Edge functions run in Deno, which doesn't have Canvas/Image APIs. So compression must happen on the **frontend** before uploading to storage.
- **Revised approach:** Add a frontend utility `compressAndUpload(imageUrl, bucket, userId, maxWidth, maxHeight, quality)` that:
  1. Fetches the image URL
  2. Draws it to a canvas at reduced dimensions
  3. Exports as JPEG at specified quality
  4. Uploads the compressed blob to storage
  5. Returns the public URL

This utility will be used in:
- `CoverImageGenerationModal` (after receiving URL from edge function)
- `AvatarGenerationModal` (after receiving URL from edge function)
- `SceneImageGenerationModal` (after receiving URL from edge function)
- Profile avatar upload (already has resizeImage, just needs to use the new utility)

### Files to modify:
- `src/utils.ts` -- Add `compressAndUpload` utility
- `src/components/chronicle/CoverImageGenerationModal.tsx` -- Use compression before saving
- `src/components/chronicle/AvatarGenerationModal.tsx` -- Use compression before saving
- `src/components/chronicle/SceneImageGenerationModal.tsx` -- Use compression before saving
- `src/components/account/PublicProfileTab.tsx` -- Already compresses, ensure consistency

---

## Part 3: Fix "Following" Tab in Community Gallery

### Current problem:
The "Following" tab in GalleryHub.tsx (lines 86-112) fetches ALL published scenarios and filters client-side:
```
const data = await fetchPublishedScenarios(undefined, 'all', 50, 0);
const filtered = data.filter(s => creatorIds.includes(s.publisher_id));
```

This downloads everything just to show a subset.

### Fix:
Update `fetchPublishedScenarios` in `gallery-data.ts` to accept an optional `publisherIds` parameter. When provided, add `.in('publisher_id', publisherIds)` to the query so the database does the filtering.

Update GalleryHub.tsx to pass `creatorIds` directly to the fetch function.

---

## Technical Implementation Order

1. **CreatorProfile.tsx** -- Restructure layout to mirror PublicProfileTab exactly (move follow button, remove stats card, add inline stats to Published Works header)
2. **src/utils.ts** -- Add `compressAndUpload` utility function
3. **Image generation modals** -- Integrate compression into cover, avatar, and scene image saving flows
4. **gallery-data.ts** -- Add `publisherIds` parameter to `fetchPublishedScenarios`
5. **GalleryHub.tsx** -- Pass creator IDs to the fetch function for the Following tab

