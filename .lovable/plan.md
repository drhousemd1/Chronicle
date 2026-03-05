

# Scenario → Story: Full Terminology Migration

This is a large but low-risk rename-only change. No logic or behavior changes. We'll do it in phases within a single implementation pass.

---

## Phase 1: Database Migration (SQL)

**Rename the `scenarios` table to `stories`:**
- `ALTER TABLE scenarios RENAME TO stories;`
- Update the default value for `title` column: `'Untitled Scenario'` → `'Untitled Story'`
- Update ALL RLS policies on `stories` (they reference `scenarios` internally)
- Update ALL RLS policies on dependent tables that `JOIN scenarios` (content_themes, codex_entries, scenes, characters, messages via conversations)
- Update ALL database functions that reference `scenarios`:
  - `fetch_gallery_scenarios` → rename + update internal JOINs
  - `get_folders_with_details` (no change needed)
  - Counter functions reference `published_scenarios` (no rename needed there — `published_scenarios` stays since it's a junction/publication table, not the core entity)
- Update the `handle_new_user` function (no scenario refs)
- **Note**: `published_scenarios`, `saved_scenarios`, `remixed_scenarios`, `scenario_reviews`, `scenario_likes`, `scenario_views` tables will NOT be renamed in this pass — they are publication/interaction tables and renaming them would be extremely high-risk for minimal UX benefit. Their names are never user-facing.

**Single migration SQL covering all of the above.**

---

## Phase 2: Frontend Types & Utils (~4 files)

- **`src/types.ts`**: 
  - Rename `ScenarioData` → `StoryData`, `ScenarioMetadata` → `StoryMetadata`
  - Rename `WorldCore.scenarioName` → `WorldCore.storyName`
  - Update comment on `storyPremise` (remove "renamed to Scenario in UI")
  - Keep type aliases for backward compat: `export type ScenarioData = StoryData;`

- **`src/utils.ts`**:
  - Update `SCENARIO_PREFIX`, function names (`createDefaultScenarioData` → `createDefaultStoryData`, etc.)
  - Change fallback title `"New Scenario"` → `"New Story"` (line 807 in Index.tsx)
  - Change `"Untitled Scenario"` references

---

## Phase 3: Services (~3 files)

- **`src/services/supabase-data.ts`**: Update all `.from('scenarios')` → `.from('stories')`, update `scenarioName` references in worldCore defaults
- **`src/services/gallery-data.ts`**: Update any `scenarios` table references
- **`src/services/world-ai.ts`**: Update field prompts (`scenarioName` label → `"Story Name"`, prompt text)

---

## Phase 4: Components & Pages (~12+ files)

- **`src/pages/Index.tsx`**:
  - Sidebar label `"Your Stories"` → `"My Stories"` (line 1449)
  - Sidebar label `"Scenario Builder"` → `"Story Builder"` (line 1457)
  - Subtitle fallback `"Unsaved Draft"` stays, but derived title logic changes: always show `"New Story"` until user fills in Story Name
  - Add `truncate` class to subtitle div (line 90) to fix the overflow bug
  - Update all variable names (`handleCreateNewScenario` → `handleCreateNewStory`, etc.)

- **`src/components/chronicle/WorldTab.tsx`**:
  - `"Scenario Setup"` → `"Story Setup"` (line 445)
  - `"Scenario Name"` field label → `"Story Name"` (line 521)

- **`src/components/chronicle/ScenarioHub.tsx`** → rename file to `StoryHub.tsx`
- **`src/components/chronicle/ScenarioCardView.tsx`** → rename file to `StoryCardView.tsx`
- **`src/components/chronicle/ScenarioDetailModal.tsx`** → rename file to `StoryDetailModal.tsx`
- **`src/components/chronicle/ShareScenarioModal.tsx`** → rename file to `ShareStoryModal.tsx`
- **`src/components/chronicle/GalleryScenarioCard.tsx`** → rename file to `GalleryStoryCard.tsx`
- **`src/components/chronicle/GalleryHub.tsx`**: Update imports and internal references
- **`src/components/chronicle/DeleteConfirmDialog.tsx`**: Update "scenario" text in dialog messages
- **`src/components/chronicle/SceneImageGenerationModal.tsx`**: Update `scenarioTitle` prop names

---

## Phase 5: Edge Functions (~3 files)

- **`supabase/functions/generate-cover-image/index.ts`**: `scenarioTitle` variable name, prompt text
- **`supabase/functions/generate-side-character/index.ts`**: "roleplay scenario" → "roleplay story" in prompts
- **`supabase/functions/migrate-base64-images/index.ts`**: `.from('scenarios')` → `.from('stories')`

---

## Phase 6: Sidebar Subtitle Bug Fix

In `SidebarItem` (Index.tsx line 90), add `truncate` to the subtitle div so long names don't overflow. Change the derived title logic so that when `scenarioName` (now `storyName`) is empty, it shows `"New Story"` instead of deriving from character names.

---

## Phase 7: Guide Documents

Update all `docs/guides/*.md` files that reference "scenario" terminology. Also update `guide_documents` table content via the insert tool for any stored guides that reference "Scenario Builder" / "Scenario Setup".

---

## Scope Summary

| Layer | Files | Risk |
|-------|-------|------|
| Database | 1 migration (table rename + RLS + functions) | Medium — must be done first |
| Types/Utils | 2 files | Low |
| Services | 3 files | Low |
| Components | ~12 files (includes renames) | Low |
| Edge Functions | 3 files | Low |
| Docs/Guides | ~15 files | None |
| Sidebar bug | 1 file (Index.tsx) | None |

**What stays unchanged**: `published_scenarios`, `saved_scenarios`, `remixed_scenarios`, `scenario_reviews`, `scenario_likes`, `scenario_views` table names — these are backend-only, never user-facing, and renaming them would require updating dozens of RLS policies and functions for zero UX benefit.

This will be implemented incrementally: database first, then types, then services, then components, then edge functions, then docs. Each phase builds on the previous one.

