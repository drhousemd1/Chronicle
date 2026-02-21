

# Fix Story Arc Connectors, Lane Sizing, and Padding

## Problems Identified

1. **Connector lines are diagonal** -- the current SVG uses `L100,56` which draws diagonal lines. The mockup HTML uses **right-angle connectors**: vertical lines (`V`) and horizontal lines (`H`) forming an upside-down "T" shape for split, and a "T" shape for merge. No diagonals whatsoever.

2. **Fail/Success lanes are unequal width** -- the `flex gap-4` container with `flex-1` on each lane should make them equal, but the card's `padding: 30px` on both sides plus `gap-4` (16px) eats into available space. The lanes themselves also have `padding: 10px` inside.

3. **Cards are too crowded** -- the outer content area has `padding: 24px 30px` which is excessive for the available width.

## Changes

### 1. Rewrite `ArcConnectors.tsx` to use right-angle lines (matching the HTML mockup exactly)

The HTML mockup builds connectors using `M`, `V`, and `H` commands only:

**Split connector** (top splits to two branches):
```
M centerX startY    -- start at top center
V splitY             -- vertical line down to split point  
M leftX endY         -- move to left branch bottom
V splitY             -- vertical line up to split height
H rightX             -- horizontal line across to right branch
V endY               -- vertical line down to right branch bottom
```

This creates an inverted "T" with corner nodes -- a vertical stem from center, a horizontal bar, and two vertical drops to each lane center.

**Merge connector** (two branches merge back):
Same pattern but inverted -- vertical lines up from each branch center, horizontal bar connecting them, vertical line down from center.

Since we can't dynamically measure DOM positions in a static SVG, we'll use the viewBox `0 0 100 66` with percentage-based coordinates:
- Center at x=50
- Left lane center at x=25 (25%)
- Right lane center at x=75 (75%)
- Use `V` and `H` commands for all straight right-angle lines

### 2. Reduce outer content padding in `StoryGoalsSection.tsx`

Change the content area padding from `padding: '24px 30px'` to `padding: '20px 16px'`. This gives the branch lanes more horizontal room.

### 3. Change branch lane container from `flex gap-4` to CSS grid

Replace `<div className="flex gap-4">` with `<div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px' }}>`. This guarantees equal-width lanes (the HTML mockup uses `grid-template-columns: repeat(2, minmax(0, 1fr))` for this exact reason).

### 4. Apply same fixes to `ArcPhaseCard.tsx`

Same grid change for the branch lanes container.

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/chronicle/arc/ArcConnectors.tsx` | Rewrite SVG to use right-angle `V`/`H` path commands instead of diagonal `L` commands. Use viewBox `0 0 100 66` with x positions at 25%, 50%, 75%. |
| `src/components/chronicle/StoryGoalsSection.tsx` | Reduce content padding from `24px 30px` to `20px 16px`. Change branch lanes from `flex gap-4` to `grid grid-cols-2 gap-4`. |
| `src/components/chronicle/arc/ArcPhaseCard.tsx` | Same grid change for branch lanes container. |

## Technical Details

### ArcConnectors.tsx -- new SVG paths

```tsx
// Split: inverted T-shape
<path d="M 50 0 V 22" ... />  // vertical stem from center
<path d="M 25 66 V 22 H 75 V 66" ... />  // horizontal bar + vertical drops

// Merge: T-shape (inverted of split)
<path d="M 25 0 V 44 H 75 V 0" ... />  // vertical rises + horizontal bar
<path d="M 50 44 V 66" ... />  // vertical stem down to center
```

Using `viewBox="0 0 100 66"` with `preserveAspectRatio="none"` so the SVG stretches to fill the container width, making the 25% and 75% x-coordinates align with the actual lane centers.

### StoryGoalsSection.tsx padding change

Line 244: `padding: '24px 30px'` becomes `padding: '20px 16px'`

### Branch lanes grid (both files)

Replace:
```tsx
<div className="flex gap-4" style={{ marginTop: '12px' }}>
```
With:
```tsx
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px', marginTop: '12px' }}>
```

