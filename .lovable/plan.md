

## Put Age and Sex/Identity Side by Side

**File:** `src/components/chronicle/CharactersTab.tsx` — Lines 1402-1409

Replace the two separate `<div>` blocks for Age and Sex/Identity with a single `grid grid-cols-2 gap-3` row so they sit side by side:

```tsx
<div className="grid grid-cols-2 gap-3">
  <div>
    <label ...>Age</label>
    <AutoResizeTextarea ... />
  </div>
  <div>
    <label ...>Sex / Identity</label>
    <AutoResizeTextarea ... />
  </div>
</div>
```

No other changes needed.

