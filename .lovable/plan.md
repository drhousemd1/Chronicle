

## Fix: Hover Overlay Sizing

The problem is that `height: '100%'` on the `CardEditOverlay` wrapper makes it stretch to the full grid cell height (which equals the tallest card in that row), but the actual card inside is shorter. So the overlay background extends beyond the card's visible area — making every card look wrong.

### Root Cause

In a CSS grid with `repeat(auto-fit, minmax(220px, 1fr))`, each cell stretches to the row's tallest item. The wrapper now fills that full height, but the card content inside doesn't — creating a mismatch where the dark overlay hangs below the card.

### Fix (line 28-30 of StyleGuideTool.tsx)

Revert `height: '100%'` and instead use `display: 'flex', flexDirection: 'column'` on the wrapper so it only sizes to its content. The overlay with `inset: 0` will then match the card's actual dimensions.

```tsx
// Line 29-30: Change from
<div style={{ position: 'relative', height: '100%' }}

// To
<div style={{ position: 'relative' }}
```

Then, to make the overlay fit the card (which has `borderRadius: 10` and `overflow: 'hidden'`), the overlay should also inherit the card's rounding. But since the overlay is on the wrapper (outside the card), the simplest fix is to add `overflow: 'hidden', borderRadius: 10` to the wrapper div so the overlay clips to the card shape.

### Final wrapper style
```tsx
<div
  style={{ position: 'relative', overflow: 'hidden', borderRadius: 10 }}
  onMouseEnter={...}
  onMouseLeave={...}
>
```

This removes the height stretch, keeps the overlay contained to each card's natural size, and clips the overlay to the card's rounded corners.

