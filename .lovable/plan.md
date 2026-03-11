

# Fix: "View" Link Hidden Behind Edit Overlay

## Problem
The `CardEditOverlay` renders a hover overlay at `zIndex: 9` covering the entire card (`inset: 0`). The "View" link sits inside the card content at a lower z-index, so it's unclickable when hovering.

## Solution (single file: `StyleGuideTool.tsx`)

Give the "View" link the same z-index treatment already used by the "Show more" toggle — wrap or style it with `position: relative; zIndex: 10` so it sits above the overlay (z-index 9).

### Change in `CollapsibleCardBody` (~line 280-286)

Update the "View" span to include `position: 'relative', zIndex: 10`:

```tsx
{onViewLocations && (
  <span
    onClick={(e) => { e.stopPropagation(); onViewLocations(); }}
    style={{ fontSize: 11, fontWeight: 600, color: '#3b82f6', cursor: 'pointer', position: 'relative', zIndex: 10 }}
  >View</span>
)}
```

This is the exact same pattern already used for the "Show more / Show less" toggle to prevent click bubbling to the edit overlay. One line change, no other modifications needed.

