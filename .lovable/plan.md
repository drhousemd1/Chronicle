

## Fix Age / Sex-Identity Column Ratio

The current `grid-cols-2` splits them 50/50. Age only needs space for ~6 digits, so it should be much narrower.

### Change in `src/components/chronicle/CharactersTab.tsx` — Line 1402

Replace `grid grid-cols-2 gap-3` with a custom grid template that gives Age roughly 1/3 and Sex/Identity 2/3:

```tsx
<div className="grid gap-3" style={{ gridTemplateColumns: '120px 1fr' }}>
```

This gives Age a fixed ~120px width (enough for 6 digits) and lets Sex/Identity take the remaining space.

