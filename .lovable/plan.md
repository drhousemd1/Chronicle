

## Add "Sync All" Button Next to Save

**What it does:** Adds a "Sync All" button next to the existing "Save" button in the App Guide header. Save continues to save + sync the current document only. Sync All iterates through every guide document, fetches its markdown, and pushes each one to GitHub via the existing `syncToGitHub` function.

### Changes

**1. `src/components/admin/guide/AppGuideTool.tsx`**
- Add a `syncAllToGitHub` function that queries all documents from `guide_documents`, then calls `syncToGitHub('upsert', title, markdown)` for each one
- Register this function via a new `onRegisterSyncAll` callback prop (same pattern as `onRegisterSave`)

**2. `src/pages/Index.tsx`**
- Add a `guideSyncAllRef` similar to `guideSaveRef`
- Next to the existing "Save" button (line ~1735-1743), add a "Sync All" button that calls `guideSyncAllRef.current?.()`
- Pass `onRegisterSyncAll` down through `AdminPage`

**3. `src/pages/Admin.tsx`**
- Add `onRegisterSyncAll` to `AdminPageProps` and pass it through to `LazyAppGuide`

### Technical Details

- The Sync All function will fetch all docs via `select('id, title, markdown')` and loop through them calling the existing fire-and-forget `syncToGitHub` helper
- A toast notification will confirm when the bulk sync has been dispatched
- The button will use the same styling as the Save button for visual consistency
