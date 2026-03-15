

## What went wrong + Fix Plan

The previous implementation deviated from the exact code provided. Here are the specific differences between what's currently in `WorldTab.tsx` and what the revised instructions specify:

### WorldTab.tsx — CharacterRosterTile differences

| # | Issue | Current Code | Instructions Say |
|---|-------|-------------|-----------------|
| 1 | Missing `group` class | `"relative overflow-hidden rounded-2xl bg-black..."` | Should have `group` on wrapper div |
| 2 | Wrong border/error styling | Error: `border-2 border-red-500 ring-2 ring-red-500`, else: complex shadow (no border) | Error: `border-red-500`, else: `border-[#4a5f7f]` |
| 3 | Missing hover overlay | None | Separate div: `bg-black/0 group-hover:bg-black/25` at `z-[5]` |
| 4 | Gradient overlay structure | Single `z-10` div with padding, flex layout inside | Separate `z-[6]` div, `h-24`, gradient only |
| 5 | Bottom info overlay | Name + badge inside gradient div | Separate `z-30` div with `p-3`, `min-w-0 flex-1` layout |
| 6 | Badge styling | `text-white/70`, no background color | Colored bg (`bg-blue-500` for User, `bg-slate-500` for AI), `rounded-full px-2 py-0.5` pill |
| 7 | Expand button scope | Always rendered (not conditional on avatar) | Wrapped in `{char.avatarDataUrl && (...)}` |
| 8 | No-avatar fallback | `bg-zinc-800` | `bg-gradient-to-br from-zinc-800 to-zinc-900`, different text color `text-slate-500` |
| 9 | `tileObjectPosition` return type | Returns string (`"50% 50%"`) | Returns object `{ x, y }` with separate interpolation in style |

### ChatInterfaceTab.tsx — Already correct
Line 3388 already has `border-2 border-[#4a5f7f] hover:border-[#4a5f7f]`. No change needed.

### Sidebar width — Already correct
Line 614 already has `w-[300px]`. No change needed.

### State + cleanup — Already correct
`expandedRosterTileId` state and cleanup effect are present.

---

## Plan: Single phase — Replace CharacterRosterTile with exact code from instructions

**File**: `src/components/chronicle/WorldTab.tsx`

**What**: Replace lines 114-238 (the entire `CharacterRosterTile` component) with the exact code block from the revised instructions (lines 160-303 of the uploaded file). Also update `tileObjectPosition` useMemo return type from string to object.

This is a single focused replacement — no other files need changes.

