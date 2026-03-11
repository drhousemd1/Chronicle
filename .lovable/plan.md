

# Apply Style Guide Edit: Sky Blue → True Blue (All Instances)

## Edit from Registry

| Field | Value |
|-------|-------|
| **Current** | `blue-400` / `#60a5fa` |
| **Target** | `blue-500` / `#3b82f6` (True Blue) |
| **Scope** | Every instance app-wide — text, border, ring, focus, hover, group-hover, bg variants |

## 1. Global replacement: `blue-400` → `blue-500` across 36 files

Every Tailwind class containing `blue-400` shifts to `blue-500`. This includes `text-blue-400`, `border-blue-400`, `ring-blue-400`, `hover:text-blue-400`, `hover:bg-blue-400`, `hover:border-blue-400`, `group-hover:text-blue-400`, `focus:border-blue-400`, `focus:ring-blue-400`, `ring-blue-400/60`, `text-blue-400/50`, `bg-blue-400`, etc.

Hover states that previously went from 500→400 now go 500→400 still works (lighter hover) or shift to match — specifically `hover:bg-blue-400` → `hover:bg-blue-400` stays if it's a hover on a blue-500 base (it becomes the same shade, so shift to `hover:bg-blue-400` keeping the lighter hover pattern). Actually since the target IS blue-500, we replace blue-400 with blue-500 universally. Where this creates `bg-blue-500 hover:bg-blue-500` (identical), we adjust hover to `hover:bg-blue-400` for contrast.

### Files (36 total, grouped):

**chronicle/ (33 files):**
`PersonalitySection.tsx`, `CharacterGoalsSection.tsx`, `StoryGoalsSection.tsx`, `ContentThemesSection.tsx`, `CharactersTab.tsx`, `CharacterPicker.tsx`, `CharacterEditForm.tsx`, `CharacterCreationModal.tsx`, `CharacterEditModal.tsx`, `ChatInterfaceTab.tsx`, `StoryHub.tsx`, `StoryCardView.tsx`, `StoryDetailModal.tsx`, `GalleryStoryCard.tsx`, `GalleryHub.tsx`, `GalleryCategorySidebar.tsx`, `ImageLibraryTab.tsx`, `ImageLibraryPickerModal.tsx`, `ShareStoryModal.tsx`, `EnhanceModeModal.tsx`, `AvatarGenerationModal.tsx`, `CoverImageGenerationModal.tsx`, `SceneImageGenerationModal.tsx`, `GuidanceStrengthSlider.tsx`, `CircularProgress.tsx`, `ModelSettingsTab.tsx`, `WorldTab.tsx`, `UI.tsx`, `ReviewModal.tsx`, `BackgroundPickerModal.tsx`, `SidebarThemeModal.tsx`, `arc/ArcPhaseCard.tsx`, `arc/ArcModeToggle.tsx`

**account/ (1 file):** `PublicProfileTab.tsx`

**pages/ (1 file):** `CreatorProfile.tsx`

**admin/ (1 file):** `GuideEditor.tsx` — `#60a5fa` → `#3b82f6`

### Hover-state logic
- `hover:bg-blue-400` on a `bg-blue-500` base → keep as `hover:bg-blue-400` (lighter hover is fine, already blue-400 which is the old value but in context of hover it provides contrast)
- Actually no — the instruction is to replace ALL blue-400. So `hover:bg-blue-400` → `hover:bg-blue-500`. But that makes hover identical to base. In those cases: `bg-blue-500 hover:bg-blue-500` → change hover to `hover:bg-blue-600` for visual feedback.
- `text-blue-400 hover:text-blue-300` → `text-blue-500 hover:text-blue-300` (hover goes lighter, fine)

## 2. Update Style Guide Tool (`StyleGuideTool.tsx`)

- **Remove** both "Sky Blue" swatches (app-wide at line 1053 AND page-specific at line 1110)
- **Merge all locations** into the "True Blue" swatch — add: "+ Add links, active slider labels, SFW badge text, user message bubble border, dashed add button text, sparkle icons, character name hover, AI/Player toggle, Steps icons, circular progress, share modal icons, filter badges, personality trait normal, focus rings on style selectors, input focus borders"
- **Update** all preview instances using `#60a5fa` or `blue-400` to `#3b82f6` / `blue-500`:
  - Dashed Add button card (line 1550-1560): preview color, textColor, visualEffects
  - Time of Day selector card (line 1868-1883): border reference
  - AI Enhance Sparkle button card (line 2130-2132)
  - Icon Colors entry (line 4371-4373)
  - Art style selector ring preview (line 3757)
  - Create New Story card metadata (line 1614-1617)
  - Any other preview/metadata references

## 3. Clear processed edit from database

Migration to remove the entry from `styleguide_edits` in `app_settings`.

## 4. Final audit

Search for any remaining `blue-400` and `#60a5fa` to confirm zero orphans.

