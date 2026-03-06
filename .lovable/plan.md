

## Plan: Remove Excess Gap Between Scene Gallery Label and Content

### Root Cause
The `mb-1` fix on the header row was correct, but the **grid container** on line 1028 has `mt-6` (24px top margin), which is the actual source of the large gap between the label and the content area.

### Fix in `src/components/chronicle/WorldTab.tsx` (line 1028)

Change `mt-6` to `mt-1` on the grid div:

```tsx
// Before
<div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">

// After
<div className="mt-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
```

This brings the empty-state box (and scene images when present) snug below the label row, matching the tight spacing used by every other label-to-content pair on the page.

