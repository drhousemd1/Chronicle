

## Plan: Persist Style Guide Edits to Supabase — Complete ✅

### What was done:

1. **Seeded `app_settings` rows** — `styleguide_edits` and `styleguide_keeps` rows inserted into the database
2. **Rewrote all storage helpers** in `StyleGuideEditsModal.tsx` from sync localStorage to async Supabase operations (`getEditsRegistry`, `upsertEdit`, `removeEdit`, `getKeeps`, `addKeep`, `removeKeep`, `getEditsCount`)
3. **Updated all consumers** in `StyleGuideTool.tsx` — `refreshEditsState`, `handleKeep`, `handleEditOpen`, `handleSaveEdit`, `handleRemoveKeep` are all async now
4. **Updated `Index.tsx`** — `getEditsCount()` call now uses `.then()` since it's async
5. **Every edit, keep, and delete auto-saves to Supabase immediately** — no data loss on domain changes
