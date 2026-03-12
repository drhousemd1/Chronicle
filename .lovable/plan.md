

# Consolidate White Variants → Ghost White

## Overview
5 pending edits in the style guide registry, each replacing a white variant with Ghost White (`rgba(248,250,252,0.3)` / `ghost-white` Tailwind class). Two edits (Faint White / Dim White) are already done. This plan covers the remaining 5.

## Edit 1: Whisper White (`border-white/5` → `border-ghost-white`)
**156 instances across 14 files** (excluding StyleGuideTool.tsx):

| File | ~Count |
|------|--------|
| `ChatInterfaceTab.tsx` | ~40 |
| `CharacterEditModal.tsx` | ~20 |
| `CharactersTab.tsx` | ~15 |
| `WorldTab.tsx` | ~15 |
| `StoryCardView.tsx` | ~10 |
| `CharacterGoalsSection.tsx` | ~10 |
| `PersonalitySection.tsx` | ~8 |
| `ContentThemesSection.tsx` | ~5 |
| `ConversationsTab.tsx` | ~5 |
| `StoryDetailModal.tsx` | ~5 |
| `StoryGoalsSection.tsx` | ~5 |
| `DraftsModal.tsx` | ~3 |
| `AIPromptModal.tsx` | ~2 |
| `GuidanceStrengthSlider.tsx` | ~2 |
| `AccountSettingsTab.tsx` | ~2 |

Also replace `bg-white/5` → `bg-ghost-white` in same files where found.

## Edit 2: Milky White (`bg-white/30` → `bg-ghost-white`)
**~5 instances across 2 files**:
- `SideCharacterCard.tsx`: `bg-white/30` → `bg-ghost-white`, `hover:bg-white` → `hover:bg-ghost-white`
- `ChatInterfaceTab.tsx`: Same pattern in sidebar character cards + overflow indicator + scene button hover

## Edit 3: Ice White (`bg-slate-50` → `bg-ghost-white`)
**~188 instances across 14 files**. Global replace of `bg-slate-50` with `bg-ghost-white` everywhere in `src/`.

Key files: `UI.tsx`, `ModelSettingsTab.tsx`, `BackgroundPickerModal.tsx`, `ImageLibraryPickerModal.tsx`, `WorldTab.tsx`, `ChatInterfaceTab.tsx`, `StoryHub.tsx`, `ImageLibraryTab.tsx`.

Also covers `hover:bg-slate-50` → `hover:bg-ghost-white`.

## Edit 4: Frosted White (`slate-50/50` → `ghost-white`)
**1 instance**:
- `Index.tsx` line 1702: `bg-slate-50/50` → `bg-ghost-white`

## Edit 5: White (`text-white` / `bg-white` → ghost-white)
Scoped to the locations listed in the edit entry:
- **Dialog/speech text**: Chat message text in `ChatInterfaceTab.tsx`
- **Sidebar bg**: `bg-white` on the chat sidebar in `ChatInterfaceTab.tsx`
- **Day counter bg**: Day counter `bg-white` in `ChatInterfaceTab.tsx`
- **Text input field bg**: Chat input `bg-white` in `ChatInterfaceTab.tsx`

~4-6 specific instances replaced. NOT a global `text-white` replacement.

## Style Guide Updates (per rule #2)
For each edit completed:
1. Remove the swatch card for the deprecated color from each page section
2. Update the consolidated Ghost White swatch's `locations` to include the absorbed locations
3. Remove the deprecated color from `ALL_SWATCHES`
4. Update `locationImages` arrays (remove old entries, note new ones needed)
5. Clear processed edits from the `styleguide_edits` registry

## Validation (3 passes)
After all replacements:
1. Search for each deprecated token to confirm 0 remaining instances outside StyleGuideTool
2. Verify `ALL_SWATCHES` no longer contains removed colors
3. Verify no duplicate Ghost White swatches exist per section

## Files Modified
- ~16 component files (token replacements)
- `src/pages/Index.tsx` (Frosted White)
- `src/components/admin/styleguide/StyleGuideTool.tsx` (swatch cleanup + registry)
- Database: clear processed edits from `app_settings`

