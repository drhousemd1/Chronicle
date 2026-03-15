

## Audit: Phase B Spec vs Current Code

I read every relevant line of code and compared it against the exact JSX in the uploaded document (including the page images where the markdown parser mangled the code blocks). Here is an honest accounting of what matches and what doesn't.

---

### CharactersTab.tsx

| Spec requirement | Current code | Status |
|---|---|---|
| `useMemo` in React import | Present (line 1) | Correct |
| Constants: `CHARACTER_HEADER_TILE_WIDTH=268`, `HEIGHT=140`, `PREVIEW_SIZE=192` | Present (lines 128-130) | Correct |
| `clampPercent`, `Size2D` helpers | Present (lines 132-134) | Correct |
| Cache named `avatarNaturalSizeCache` | Named `headerTileNaturalSizeCache` instead | Minor naming difference, functionally identical |
| Mapping function named `mapObjectPositionFromPreviewToTile` | Named `mapHeaderTilePosition` instead | Minor naming difference, functionally identical |
| `headerTileImageSize` state, `useEffect` for natural-size caching, `headerTileObjectPosition` memo | Present and correct (lines 659-692) | Correct |
| Header tile: `p-3` wrapper, 268x140 tile, `rounded-2xl`, `border-[#4a5f7f]`, `bg-black` | Present (lines 1287-1290) | Correct |
| **No persistent bottom gradient overlay** | Has `h-16 bg-gradient-to-t from-black/80` on line 1306 | **WRONG — must remove** |
| Hover-only overlay `group-hover:bg-black/25` | Present (line 1304) | Correct |
| Bottom info: name + AI/User badge | Present (lines 1308-1318) | Correct |
| No edit icon / reposition controls in header tile | Correct — none present | Correct |
| No slate/navy wrapper card behind tile | Correct — removed | Correct |

**One real issue found:** The persistent bottom gradient on the header tile (line 1306) must be removed. The spec explicitly says "No persistent overlay, only hover overlay."

---

### WorldTab.tsx (CharacterRosterTile)

| Spec requirement | Current code | Status |
|---|---|---|
| `const hasAvatar = Boolean(char.avatarDataUrl)` | Uses `char.avatarDataUrl` directly in conditionals | Minor — functionally equivalent but spec wants explicit variable |
| useEffect deps: `[char.avatarDataUrl, hasAvatar]` | Uses `[char.avatarDataUrl]` | Minor — `hasAvatar` is derived, no functional difference |
| Expand/collapse button gated behind `hasAvatar` | Uses `char.avatarDataUrl &&` (line 201) | Correct behavior, different expression |
| **No persistent bottom gradient** | Has `h-16 bg-gradient-to-t from-black/80` on line 224 | **WRONG — must remove** |
| Content layer: `absolute inset-x-0 bottom-0 z-30 p-3` with nested flex `items-end justify-between gap-2` | Uses `absolute bottom-0 left-0 right-0 z-30 p-3 flex items-end gap-2` (flat, no nesting) | **Differs from spec** — spec has a nested structure with `min-w-0 flex-1` wrapper div |
| Name text: `drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]` class | Uses inline `style={{ textShadow: '0 1px 4px rgba(0,0,0,0.7)' }}` | **Differs from spec** — should use the Tailwind drop-shadow class with spec values |
| Badge: `tracking-wide` | Uses `tracking-widest` | **Minor difference** |
| Hover overlay | Present and correct (line 198) | Correct |
| No-avatar gradient initials fallback | Present and correct (line 192) | Correct |

---

### Summary of actual issues to fix

1. **CharactersTab.tsx line 1306:** Remove the persistent bottom gradient div from the header tile.
2. **WorldTab.tsx line 224:** Remove the persistent bottom gradient div from roster tiles.
3. **WorldTab.tsx lines 227-235:** Restructure bottom info to match spec's nested layout: outer `inset-x-0 bottom-0 z-30 p-3` div → inner `flex items-end justify-between gap-2` div → name in `min-w-0 flex-1` wrapper with `drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]` class instead of inline textShadow.
4. **WorldTab.tsx:** Add explicit `const hasAvatar = Boolean(char.avatarDataUrl)` and use it (cosmetic alignment with spec).
5. **WorldTab.tsx badge:** Change `tracking-widest` to `tracking-wide` per spec.

Items 1-3 are real behavioral/visual differences. Items 4-5 are cosmetic code alignment. No other regressions found. Everything else matches the spec.

