

## Plan: Auto-Capitalize Label Inputs to Match Hardcoded Labels

**Problem:** User-added label fields display as regular white text, while hardcoded labels are uppercase with wide tracking (`uppercase tracking-widest text-zinc-400`). This creates visual inconsistency.

**Solution:** Add `uppercase tracking-widest` CSS classes to all label input fields and change their text color to `text-zinc-400` to match the hardcoded label styling. This is a CSS-only change — no JavaScript text transformation needed. The `uppercase` CSS property visually capitalizes all text while preserving the original casing in the data model.

### Files to update

**1. `src/components/chronicle/CharactersTab.tsx`** — 2 locations
- Line 153: `ExtraRow` label textarea — add `uppercase tracking-widest` and change `text-white` to `text-zinc-400`
- Line 1241: Custom section item label textarea — same change

**2. `src/components/chronicle/CharacterEditModal.tsx`** — 2 locations
- Line 161: Extra row label textarea — same change
- Line 1768: Custom section item label textarea — same change

**3. `src/components/chronicle/WorldTab.tsx`** — 1 location
- Line 680: Custom world content section label — same change

**4. `src/components/chronicle/StoryCardView.tsx`** — 1 location
- Line 236: Custom world section label in story card — same change

All changes are identical: add `uppercase tracking-widest` and swap `text-white` to `text-zinc-400` on the label input className. No data model changes — the stored value stays as-typed, the CSS handles the visual formatting.

