

## Plan: Fix Side Clipping and Scrollbar Overlap

### Problems
1. The modal (`sm:max-w-4xl` = 896px) is too narrow for 7 tall tiles — the blue selection ring clips on the sides
2. The scrollbar overlaps the rightmost thumbnail because `pr-1` isn't enough space

### Changes (single file: `SidebarThemeModal.tsx`)

1. **Widen modal** (line 54): `sm:max-w-4xl` → `sm:max-w-6xl` (1152px) — gives 7 narrow portrait tiles room to breathe including their ring outlines

2. **Add inner padding for ring visibility** (line 94): The scroll container needs padding on all sides so `ring-offset-2` isn't clipped. Change `pt-2 pr-1` → `p-2 pr-4` — the extra `pr-4` keeps the scrollbar away from thumbnails, and `p-2` ensures the ring isn't clipped on top/bottom/left

3. **Remove `overflow-hidden` from tiles** (lines 100, 125): The `overflow-hidden` on each tile clips the outer ring. Change to `overflow-clip` which clips content but not box-shadow/outlines, or better: keep `overflow-hidden` only on the `<img>` wrapper and move ring to an outer element. Simplest fix: replace `overflow-hidden` with nothing and add `overflow-hidden` only to the inner image via a wrapper — but actually the ring is outside the element so `overflow-hidden` on the tile itself won't clip it. The clipping is from the scroll container. The `p-2` fix handles this.

