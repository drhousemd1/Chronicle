

# Remove Container Borders, Keep Dashed Placeholder Borders

Remove `border border-ghost-white` from all section containers and inner content cards in `WorldTab.tsx`, while preserving dashed borders on placeholder elements.

## Changes: `src/components/chronicle/WorldTab.tsx`

Remove `border border-ghost-white` from these locations:

**Outer section containers** (the `rounded-[24px]` wrappers):
- Line 509 — Cover Image section
- Line 638 — World Core section
- Line 888 — Opening Dialog section
- Line 1072 — Scene Gallery section
- Line 1193 — Art Style section
- Line 1260 area — World Codex section (and any others)

**Section headers** (`border-b border-ghost-white` on the steel-blue headers):
- Lines 511, 639, 889, 1073, 1194, etc.

**Inner content cards** (`bg-[#3a3a3f]/30 rounded-2xl border border-ghost-white`):
- Lines 518, 644, 894, etc.

**Keep untouched**: All `border-dashed` elements (image placeholder, character placeholder, add buttons).

This is a visual test — if you like the cleaner look we keep it, otherwise we revert.

