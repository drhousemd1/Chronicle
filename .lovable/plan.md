
I reproduced the issue from your latest session data and found two concrete causes:

1) The save call does a `PATCH` on `app_settings` by `setting_key='nav_button_images'`, but if that row does not exist, PostgREST returns `204` with **0 rows updated** (no error).  
2) The current code only inserts on `updateError`, so no row ever gets created in that case.  
3) The “Edit Buttons (Admin)” control is currently gated by `user` only, not admin role, so authenticated non-admin users can see it.

### Implementation Plan

1. **Fix persistence logic to create-if-missing (real upsert behavior)**
   - File: `src/services/supabase-data.ts`
   - Update `updateNavButtonImages()` so it:
     - runs `update(...).eq('setting_key', 'nav_button_images').select('id')`
     - checks whether any row was actually updated
     - inserts `{ setting_key: 'nav_button_images', setting_value: ... }` when update matched 0 rows
     - throws on real DB errors (no silent failure)

2. **Make save flow wait for persistence before closing**
   - File: `src/components/chronicle/CharactersTab.tsx`
   - In `handleSaveNavImage()`:
     - `await updateNavButtonImages(updatedImages)` before closing the modal
     - only close modal after successful DB write
     - on failure, keep modal open and surface an explicit error state (instead of just console/no-op)

3. **Restrict editor visibility to admins only**
   - Files:
     - `src/components/chronicle/CharactersTab.tsx`
     - `src/pages/Index.tsx`
   - Add a prop like `canEditAdminUi` (or `isAdmin`) to `CharactersTab`
   - Pass `isAdminState` from `Index.tsx`
   - Change render condition from `{user && (...)}` to `{user && canEditAdminUi && (...)}` for “Edit Buttons (Admin)”

4. **Clean up stale wiring**
   - File: `src/components/chronicle/CharactersTab.tsx`
   - Remove unused `compressAndUpload` import
   - Remove unused `scenarioId` prop if no longer needed (and stop passing it from `Index.tsx`)

5. **Update architecture docs to match behavior**
   - File: `docs/guides/character-builder-page-structure-guide.md`
   - Document that nav button style images are global app settings and that editor visibility is admin-only.

### Technical Details (exact behavior change)

- Current broken path:
  - `PATCH app_settings?setting_key=eq.nav_button_images` → `204` + 0 rows
  - no insert happens because there is no thrown error
  - reload gets `[]` so images disappear

- Fixed path:
  - `update + select` to detect matched rows
  - if matched rows = 0, perform insert
  - subsequent loads return the saved JSON object
  - non-admin users won’t see the editor button at all

### Validation Checklist

1. As admin: upload nav image, save, navigate away, return → image persists.  
2. Hard refresh page → image still persists.  
3. Check network after first save on fresh DB: update(0 rows) then insert(1 row), then later saves update existing row.  
4. Login as non-admin user → “Edit Buttons (Admin)” does not render.
