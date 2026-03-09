

## Fix Hover Overlay Sizing

The hover overlay doesn't fill the full card because the `CardEditOverlay` wrapper `div` only has `position: 'relative'` — it doesn't stretch to fill its CSS grid cell. The cards inside have their own height, but in a grid with `repeat(auto-fit, minmax(220px, 1fr))`, each cell can be taller than its content (grid rows align to the tallest card).

### Fix

**File: `src/components/admin/styleguide/StyleGuideTool.tsx`** — Line 30

Change the wrapper div style from:
```tsx
style={{ position: 'relative' }}
```
to:
```tsx
style={{ position: 'relative', height: '100%' }}
```

And ensure the child card div inside each card component (SwatchCardV2, TypoCardV2, ButtonCardV2, etc.) also stretches to fill with `height: '100%'` so the overlay's `inset: 0` matches the full grid cell height.

This is a one-line fix on the wrapper, plus adding `height: '100%'` to each card's root div so everything stretches uniformly in the grid.

