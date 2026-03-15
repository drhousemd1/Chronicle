

## Plan: Persist Character Builder Nav Button Images

### Problem
The "Edit Button Image" feature stores images only in React local state (`useState`). They vanish on page reload. Images are also stored as raw base64 data URLs, which is inefficient.

### Changes

**1. Database migration — add `nav_button_images` column to `stories` table**

```sql
ALTER TABLE public.stories
ADD COLUMN nav_button_images jsonb DEFAULT '{}'::jsonb;
```

This stores a JSON object like:
```json
{
  "physicalAppearance": { "url": "https://...storage.../nav-btn-xxx.jpg", "x": 10, "y": -5, "scale": 0.8 },
  "personality": { "url": "https://...", "x": 0, "y": 0, "scale": 1 }
}
```

**2. Add persistence service function** in `src/services/supabase-data.ts`

A function `updateNavButtonImages(scenarioId, images)` that updates the `nav_button_images` column on the `stories` table.

**3. Update `CharactersTab` props and initialization**

- Add `scenarioId` prop to `CharactersTab`
- Pass `activeId` from `Index.tsx` when rendering CharactersTab
- On mount / when `scenarioId` changes, load `nav_button_images` from the story record and populate `navButtonImages` state
- On "Save" in the editor, compress the image (reuse existing `compressAndUpload` from `src/utils.ts` → upload to `backgrounds` bucket at a `nav-buttons/` path), store the resulting URL + position/scale, then persist to the database

**4. Image compression on upload**

When the user uploads a nav button image, before saving:
- Compress to ~400px width (these are small button backgrounds), JPEG quality 0.75
- Upload to the `backgrounds` storage bucket under `{userId}/nav-btn-{key}-{timestamp}.jpg`
- Store the public URL (not base64) in the database

**5. Add "Reset" button to the editor modal**

In the `DialogFooter` of the nav image editor modal, add a "Reset" button that:
- Removes the image for the current button (sets `draftNavImage` to null)
- When saved, deletes the stored URL from the database record for that key
- Visually returns the button to its default (no background image) appearance

This is functionally what the existing "Remove" button does — so we rename "Remove" to "Reset" to match the user's expectation, and ensure it also clears the persisted data on save.

### Files Modified

| File | Change |
|------|--------|
| `stories` table | Add `nav_button_images` jsonb column |
| `src/services/supabase-data.ts` | Add `updateNavButtonImages()` function |
| `src/pages/Index.tsx` | Pass `scenarioId` prop to `CharactersTab` |
| `src/components/chronicle/CharactersTab.tsx` | Accept `scenarioId`, load images on mount, compress+upload on save, rename "Remove" → "Reset" |

