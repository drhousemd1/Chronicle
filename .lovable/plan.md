

# Fix Story Builder Sidebar Height — Use Flex Instead of h-full

## Problem
The `<div className="h-full overflow-hidden">` wrapper around WorldTab is inside `<main className="flex-1 min-h-0 flex flex-col overflow-hidden">`. After the header takes its space, `h-full` (100% of parent) doesn't correctly fill only the remaining space in a flex-col context — it can overflow or collapse depending on content. The sidebar's `lg:h-full` then has no reliable height to fill.

## Fix

### `src/pages/Index.tsx` (~line 2548)
Change the WorldTab wrapper from:
```
<div className="h-full overflow-hidden">
```
to:
```
<div className="flex-1 min-h-0 overflow-hidden">
```

This tells the flex-col parent to give this div all remaining space after the header, and `min-h-0` allows it to shrink properly so the sidebar's `h-full` resolves correctly.

### Also fix the Characters tab wrapper (~line 2531) for consistency
Same change: `h-full overflow-hidden` → `flex-1 min-h-0 overflow-hidden`

## Files Modified
- `src/pages/Index.tsx` — two wrapper divs changed from `h-full` to `flex-1 min-h-0`

