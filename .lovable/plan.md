

## Plan: Apply Phase B Tile Card Changes

### Summary
Replace the compact gray info card at the top of the Character Builder sidebar with a full 268×140 image tile (matching the roster/chat tile visual family), and normalize the WorldTab roster tile to match the exact Phase B spec.

### Changes

**1. `src/components/chronicle/CharactersTab.tsx`**

- Add `useMemo` to the React import
- Add constants and helpers after existing nav constants (line ~127):
  - `CHARACTER_HEADER_TILE_WIDTH = 268`, `CHARACTER_HEADER_TILE_HEIGHT = 140`, `CHARACTER_AVATAR_PREVIEW_SIZE = 192`
  - `Size2D` type, `avatarNaturalSizeCache` map
  - `clampPercent` and `mapObjectPositionFromPreviewToTile` functions (same as WorldTab)
- Inside the component, after `selected` is computed:
  - Add `headerTileImageSize` state initialized from cache
  - Add `useEffect` to load/cache natural image dimensions
  - Add `headerTileObjectPosition` memo using the mapping function
- Replace the top sidebar header (lines 1216–1241) — remove the slate/navy gradient wrapper and the compact `bg-[#2e2e33]` info row. Replace with:
  - Simple `<div className="p-3">` wrapper
  - 268×140 rounded-2xl tile with `border-[#4a5f7f]`
  - Full-bleed avatar image with mapped `objectPosition`, or gradient initials fallback
  - Hover-only dark overlay (`group-hover:bg-black/25`)
  - Bottom-left name + bottom-right AI/User badge
  - No edit icon, no reposition controls, no extra wrapper panel

**2. `src/components/chronicle/WorldTab.tsx`**

Minor adjustments to match Phase B spec exactly:
- Remove the separate bottom gradient overlay div (line 224: `h-24 bg-gradient-to-t from-black/90`)
- Update bottom info div: remove `pointer-events-none`, add `drop-shadow` on name text
- Use `hasAvatar` variable explicitly (already using `char.avatarDataUrl` check — just add the const)
- Ensure `bg-black` fallback on no-image tiles

These are primarily cosmetic alignment changes — the WorldTab tile is already ~95% matching.

