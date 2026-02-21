
# Fix Story Arc Layout Issues

## Problem

The Steps section (branch lanes, connectors, mode toggle) is currently nested INSIDE the left column of the `grid-cols-[1fr_220px]` layout. This means the fail/success branch lanes only get about 60% of the card width instead of the full width. The mockup clearly shows the branches spanning the entire card width below the Goal Name / Desired Outcome / Progress Ring area.

## Changes

### 1. Move Steps section outside the grid (`StoryGoalsSection.tsx`)

The current structure is:
```
<grid [1fr | 220px]>
  <left-column>
    Goal Name
    Desired Outcome
    Guidance Strength
    Steps <-- WRONG: cramped inside left column
      Connectors
      Branch lanes
  </left-column>
  <right-column>
    Delete button
    Progress ring
  </right-column>
</grid>
Add Next Phase
```

It needs to be:
```
<grid [1fr | 220px]>
  <left-column>
    Goal Name
    Desired Outcome
    Guidance Strength
  </left-column>
  <right-column>
    Delete button
    Progress ring
  </right-column>
</grid>
Steps <-- CORRECT: full card width
  Connectors
  Branch lanes
Add Next Phase
```

Move the entire Steps `<div>` block (lines 337-386) to be a sibling AFTER the closing `</div>` of the grid, not inside the left column. This gives the branch lanes the full card width.

### 2. Fix the same layout issue in `ArcPhaseCard.tsx`

The ArcPhaseCard has the same problem -- Steps section is inside the left grid column. Move it outside the grid to span full width, identical to the fix above.

### 3. Fix React ref warnings

The console shows "Function components cannot be given refs" warnings for `ArcConnectors` and `AutoResizeTextarea` in `ArcBranchLane`. These are caused by parent components passing refs. The fix is to either wrap these with `React.forwardRef` or remove the ref passing. Since `ArcConnectors` is used directly (not via ref), this is likely from a stray `ref` prop somewhere. Will investigate and fix.

### Files to modify

| File | Change |
|------|--------|
| `src/components/chronicle/StoryGoalsSection.tsx` | Move the Steps section div (with connectors and branch lanes) from inside the left grid column to after the grid, so it spans full card width |
| `src/components/chronicle/arc/ArcPhaseCard.tsx` | Same layout fix -- move Steps section outside the grid |

### No styling changes needed

The individual component styles (branch lanes, step cards, connectors, mode toggle, guidance slider, progress ring) all look correct. The issue is purely structural -- the branches are in the wrong place in the DOM hierarchy.
