

# Fix Character Tile Background Color

## Problem
The `CharacterButton` in `WorldTab.tsx` (line 76) uses `bg-black/80` — that's the harsh black background on the character tiles. No hover changes needed.

## Change

**File**: `src/components/chronicle/WorldTab.tsx`, line 76

Replace `bg-black/80` with `bg-gradient-to-br from-zinc-800 to-zinc-900` — matching the placeholder style used elsewhere.

Only the static background class changes. Everything else stays exactly as-is.

