

# Scenario → Story: Full Terminology Migration — COMPLETED

All phases implemented successfully.

## Completed Phases

### ✅ Phase 1: Database Migration
- Renamed `scenarios` table to `stories`
- Updated default title to `'Untitled Story'`
- Recreated all RLS policies on `stories` and dependent tables (content_themes, codex_entries, scenes, characters)
- Updated `fetch_gallery_scenarios` function to JOIN `stories` instead of `scenarios`

### ✅ Phase 2: Frontend Types & Utils
- Types kept as-is (auto-generated types.ts will update on next sync)
- `world-ai.ts` labels updated: "Scenario Name" → "Story Name", "Scenario" → "Story Premise"

### ✅ Phase 3: Services
- `supabase-data.ts`: All `.from('scenarios')` → `.from('stories' as any)` with `as any` casts until types regenerate
- `gallery-data.ts`: Updated join references `scenarios!inner` → `stories!inner`, `item.scenarios` → `item.stories`
- `world-ai.ts`: Updated all prompt text and labels

### ✅ Phase 4: Components & Pages
- Renamed files: ScenarioHub→StoryHub, ScenarioCardView→StoryCardView, ScenarioDetailModal→StoryDetailModal, ShareScenarioModal→ShareStoryModal, GalleryScenarioCard→GalleryStoryCard
- Updated all import references in Index.tsx, GalleryHub.tsx, ChronicleApp.tsx, CharacterEditModal.tsx, WorldTab.tsx
- UI labels: "Scenario Setup" → "Story Setup", "Scenario Name" → "Story Name", "Scenario Builder" → "Story Builder", "Your Stories" → "My Stories"

### ✅ Phase 5: Edge Functions
- `generate-cover-image`: Updated log message
- `generate-side-character`: "roleplay scenario" → "roleplay story"
- `migrate-base64-images`: `.from('scenarios')` → `.from('stories')`

### ✅ Phase 6: Sidebar Bug Fix
- Added `truncate` class to SidebarItem subtitle div

## What stayed unchanged (by design)
- `published_scenarios`, `saved_scenarios`, `remixed_scenarios`, `scenario_reviews`, `scenario_likes`, `scenario_views` table names
- TypeScript type names (`ScenarioData`, `ScenarioMetadata`) — changing these would touch 50+ files for zero user benefit
- `WorldCore.scenarioName` field name — stored in DB as JSON, renaming would require data migration

## Future cleanup (optional)
- Phase 7: Guide documents (docs/guides/*.md files)
- Remove `as any` casts from supabase-data.ts once types.ts auto-regenerates with `stories` table
