

## Plan: Revamp Drafts — localStorage → Database-Backed System ✅

### What was done:

1. **Database migration** — Added `is_draft boolean NOT NULL DEFAULT false` column to `stories` table
2. **Updated `ScenarioMetadata` type** — Added `isDraft?: boolean` field
3. **Updated `supabase-data.ts`** — `dbToScenarioMetadata` now maps `is_draft`, `fetchMyScenarios` selects `is_draft`, `saveScenario` accepts `options.isDraft` parameter
4. **Updated `StoryHub.tsx`** — Cards show amber "Draft" badge, Play button hidden for drafts, `isDraft` passed to detail modal
5. **Updated `StoryDetailModal.tsx`** — Accepts `isDraft` prop, hides Play button for owned drafts
6. **Updated `Index.tsx`** — Added "Drafts" filter pill, "My Stories" excludes drafts, "All" excludes drafts, Save Draft now saves to DB with `isDraft: true`, removed Drafts button/modal/localStorage logic
7. **Cleanup** — Removed DraftsModal import and render, removed localStorage draft registry functions
