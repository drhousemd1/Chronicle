

## Fix Form Inputs Section: Remove Memories Modal + Drop "Light Theme" Labels

### Problems

1. **Memories Modal entries exist twice** — once as `InputCardV2` (lines 2436-2461) and once as legacy `EntryCard` (lines 3893-3913). The Memories system is now backend-handled, so these entries should be removed entirely from the style guide.

2. **"Light Theme" labeling is wrong** — The app has ONE theme, not two. Several entries are misleadingly labeled with "(Light Theme)" as if there's a theme toggle. The entries themselves are accurate (UI.tsx genuinely uses `bg-slate-50`/`border-slate-200`), but the naming implies a dual-theme system that doesn't exist.

3. **"Image Generation Modals (Light Theme)" subheading** (line 2392) — The generation modals (`AvatarGenerationModal`, `CoverImageGenerationModal`, `SceneImageGenerationModal`) don't actually use `bg-slate-50`/`border-slate-200`. A search confirms zero matches. This entry is fabricated.

### Changes

**File: `src/components/admin/styleguide/StyleGuideTool.tsx`**

#### 1. Remove Memories Modal — InputCardV2 section (lines 2436-2461)
Delete the entire `PageSubheading>Memories Modal` block and its `InconsistencyNote`.

#### 2. Remove Memories Modal — Legacy EntryCard (lines 3893-3913)
Delete the `EntryCard name="Memories Modal (Slate Theme)"` and its `InconsistencyNote`.

#### 3. Remove fabricated "Image Generation Modals (Light Theme)" section (lines 2392-2413)
Delete the entire `PageSubheading>Image Generation Modals (Light Theme)` block. The generation modals don't use these styles.

#### 4. Rename Chronicle UI entries — drop "(Light Theme)" label
- Line 2546: `"Chronicle UI Input (Light Theme)"` → `"Chronicle UI Input"`
- Line 2568: `"Chronicle UI TextArea (Light Theme)"` → `"Chronicle UI TextArea"`
- Line 2559 notes: Remove "⚠ Light theme —" prefix, keep the rest describing the actual styling difference
- Line 2581 notes: Same treatment

#### 5. Clean up InconsistencyNote referencing light theme (lines 2604-2607)
- Update the `UI.tsx` note from "Defines light-theme Input/TextArea" to just "Defines Input/TextArea with bg-slate-50 border-slate-200 styling. Components in dark contexts need !important overrides."
- Remove "Uses !important CSS overrides to force dark styling on Chronicle UI Input." — it's redundant with the CharacterPicker card's own notes field.

#### 6. Update Auth InconsistencyNote (line 2281)
Remove reference to "slate-50 (Chronicle light)" — replace with just "slate-50 (Chronicle UI)".

