

# Fix: Full 4-Sided Border on All Text Inputs App-Wide

## Problem
Every text input and textarea uses `border-t border-black/35`, which only sets a **top** border. When `focus:border-blue-500` activates, only the top edge turns blue — producing the fade-down effect in image 1. The correct behavior (image 2) requires all 4 sides to have a border.

## Fix
Global find-and-replace: change `border-t border-black/35` → `border border-black/35` across all 15 affected files. This gives all 4 sides the subtle dark border at rest, which then uniformly turns blue on focus.

## Affected Files (15)

| File | Approx. occurrences |
|------|---------------------|
| `WorldTab.tsx` | ~10+ |
| `StoryCardView.tsx` | ~8 |
| `CharacterEditModal.tsx` | multiple |
| `CharacterGoalsSection.tsx` | multiple |
| `StoryGoalsSection.tsx` | ~4 |
| `PersonalitySection.tsx` | 3 |
| `ContentThemesSection.tsx` | 2 |
| `ArcPhaseCard.tsx` | 2 |
| `ArcBranchLane.tsx` | 3 |
| `ConversationsTab.tsx` | 1 |
| `AvatarGenerationModal.tsx` | 2 |
| `CoverImageGenerationModal.tsx` | 2 |
| `SceneImageGenerationModal.tsx` | 1 |
| `AIPromptModal.tsx` | 1 |
| `ModelSettingsTab.tsx` | if present |

## Edge Cases
- Conditional border classes (e.g., `publishErrors ? 'border border-red-500 ...' : 'border-t border-black/35'`) — the error branch already uses `border`, so only the normal branch needs `border-t` → `border`.
- Read-only / non-focusable inputs also get the change for visual consistency.
- No structural or spacing impact — `border-t` and `border` use the same 1px width; adding side/bottom borders on a dark-on-dark surface is visually imperceptible at rest.

