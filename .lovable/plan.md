

## Plan: Fix Tooltip Bullet Text Alignment + Wider Width

### Problem
`list-inside` causes wrapped text to flow under the bullet point. The user wants text to align consistently to the right of the bullet.

### Fix in `src/components/chronicle/WorldTab.tsx` (line 890)

Two changes:
1. **Widen tooltip**: `max-w-[260px]` → `max-w-[300px]`
2. **Fix bullet alignment**: Change `list-inside` to `list-outside` and add `pl-4` so bullets sit in the padding and all text lines align flush

```tsx
<TooltipContent side="top" className="max-w-[300px] text-xs normal-case tracking-normal">
  <ul className="space-y-1 list-disc list-outside pl-4">
```

This makes wrapped lines stay indented to the right of the bullet instead of wrapping underneath it.

