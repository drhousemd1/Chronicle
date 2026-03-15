

## Plan: Move Nav Button Images to Global Admin Setting

### Problem
Nav button images were incorrectly stored on the `stories` table (per-story). This is a **global admin-only** feature — you're customizing the app's navigation button appearance for all users. It should be stored in `app_settings` (which already has admin-only RLS), not tied to any individual story.

This also explains the persistence bug: the save was trying to UPDATE a story row by `scenarioId`, which may not exist or may change when you switch stories.

### Changes

**1. `src/services/supabase-data.ts`** — Rewrite both functions to use `app_settings`

- `updateNavButtonImages(images)` — upsert to `app_settings` with key `'nav_button_images'`, storing the images object in `setting_value`. No `scenarioId` needed.
- `loadNavButtonImages()` — read from `app_settings` where `setting_key = 'nav_button_images'`. Returns `{}` if no row exists.

This uses the same pattern as `admin_tool_meta` in `Admin.tsx`.

**2. `src/components/chronicle/CharactersTab.tsx`**

- Remove `scenarioId` from the persistence calls
- On mount, load from `app_settings` (no dependency on `scenarioId`)
- On save, persist to `app_settings` (no dependency on `scenarioId`)
- The "Edit Buttons (Admin)" button is already gated behind admin check — no change needed there

**3. `src/pages/Index.tsx`** — Remove `scenarioId` prop pass to `CharactersTab` (if it was only added for this feature)

**4. No database migration needed** — `app_settings` already exists with the right structure and admin-only RLS policies. The `nav_button_images` column on `stories` can remain (harmless, unused).

### Result
- Images persist globally across all stories
- Only admin can read/write (existing `app_settings` RLS)
- No dependency on which story is open
- Uses the same proven pattern as other admin settings

