

## Change Day/Time Badge Color to Match Hover Action Icons

### Root Issue
The day/time badge in the bottom left of message bubbles uses hardcoded `text-white`, which is visually harsh and stands out. The hover action icons (regenerate, three-dot menu) use `text-slate-400 hover:text-white`, creating a softer, more integrated appearance.

### Fix
**File: `src/components/chronicle/ChatInterfaceTab.tsx`** (line 3717)

Replace the hardcoded `text-white` class on the day/time badge container with `text-slate-400`, matching the hover action icons' default state. This softens the badge visually while keeping it subtle and readable.

```tsx
// Before
<div className="absolute bottom-3 left-4 flex items-center gap-2 text-sm text-white">

// After
<div className="absolute bottom-3 left-4 flex items-center gap-2 text-sm text-slate-400">
```

The icons (Sunrise, Sun, Sunset, Moon) inherit the text color from the parent `<div>`, so they'll automatically adjust to `text-slate-400` as well.

