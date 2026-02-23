
# Fix Story Arc Step Card Styling

Three issues to fix in `src/components/chronicle/arc/ArcBranchLane.tsx`:

## 1. Add drop shadows to step cards

The Fail Path and Succeed Path header boxes have `shadow-[0_14px_26px_rgba(0,0,0,0.4)]` but the step cards below them have no shadow. Add the same shadow class to step cards (both regular steps and the dynamic recovery sentinel).

**File:** `src/components/chronicle/arc/ArcBranchLane.tsx`
- Line 112-119 (regular step card `div`): Add `shadow-[0_14px_26px_rgba(0,0,0,0.4)]` to the className
- Line 241 (sentinel card `div`): Add the same shadow

## 2. Unify Dynamic Recovery sentinel styling with regular step cards

The sentinel card currently has `opacity-60` and slightly different border (`border-white/10` instead of `border-white/15`). Make it match regular step cards:
- Change `border-white/10` to `border-white/15` (matching regular step cards)
- Remove the `opacity-60` from the outer div -- the content inside (text, textarea) is already styled with muted colors (`text-zinc-400`, `italic`) which is sufficient to communicate its read-only nature

**File:** `src/components/chronicle/arc/ArcBranchLane.tsx`, line 241

## 3. Fix Lock icon color to match Character Builder

The lock icon on the sentinel card uses `text-zinc-500` (line 248). The Character Builder uses `text-zinc-400`. Update to match.

**File:** `src/components/chronicle/arc/ArcBranchLane.tsx`, line 248
- Change `text-zinc-500` to `text-zinc-400`

## Summary of changes

All changes are in a single file: `src/components/chronicle/arc/ArcBranchLane.tsx`
- Add `shadow-[0_14px_26px_rgba(0,0,0,0.4)]` to regular step cards (line 112)
- Update sentinel card: add shadow, change border from `border-white/10` to `border-white/15`, remove `opacity-60`, fix lock icon from `text-zinc-500` to `text-zinc-400` (lines 241-249)
