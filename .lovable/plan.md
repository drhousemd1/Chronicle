

## Plan: Reduce Gap Between Scene Gallery Label and Content Area

### Problem
The Scene Gallery header row has `mb-4` (16px margin-bottom), placing the label far above the content area. Every other label on the page uses `mb-1` (4px) to sit just slightly above its associated input/content. The user's screenshots clearly show the inconsistency.

### Fix in `src/components/chronicle/WorldTab.tsx` (line 992)

Change `mb-4` to `mb-1` on the header row:

```tsx
<div className="flex items-center justify-between gap-4 mb-1">
```

This single change brings the label+buttons row snug above the dashed empty-state box, matching how "Additional Formatting Rules" and "Opening Dialog" labels sit relative to their inputs.

