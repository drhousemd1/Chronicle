

## Plan: Re-apply Phase B Character Builder Header Tile

The WorldTab roster tile changes are already in place. Only the CharactersTab header tile needs to be restored.

### What was lost

The Character Builder sidebar top area still uses the old compact gray info row (lines 1216-1241) instead of the 268x140 image tile from Phase B.

### Changes

**1. `src/components/chronicle/CharactersTab.tsx`**

- **Import**: Add `useMemo` to the React import (line 1)
- **Constants** (after line 126): Add `CHARACTER_HEADER_TILE_WIDTH = 268`, `CHARACTER_HEADER_TILE_HEIGHT = 140`, `CHARACTER_AVATAR_PREVIEW_SIZE = 192`, `Size2D` type, `avatarNaturalSizeCache`, `clampPercent`, and `mapObjectPositionFromPreviewToTile` (same functions already in WorldTab)
- **State/effects** (after `selected` is computed, around line 609): Add `headerTileImageSize` state initialized from cache, `useEffect` to load/cache natural image dimensions, and `headerTileObjectPosition` memo
- **Replace top sidebar header** (lines 1216-1241): Remove the slate/navy gradient wrapper and compact `bg-[#2e2e33]` info row. Replace with a `<div className="p-3">` containing a 268x140 rounded-2xl tile with `border-[#4a5f7f]`, full-bleed avatar image using mapped `objectPosition`, hover-only dark overlay, bottom-left name, bottom-right AI/User badge, and gradient initials fallback when no avatar

No changes needed to WorldTab -- those are already applied.

