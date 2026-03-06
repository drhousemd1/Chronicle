

## Plan: Fix Scene Gallery Title to Match Standard Label Style

### Problem
The Scene Gallery title uses `text-[11px] font-bold uppercase tracking-widest text-[hsl(var(--ui-text))]` which doesn't match the standard used everywhere else on the page: `text-[10px] font-black text-zinc-400 uppercase tracking-widest`.

### Fix in `src/components/chronicle/WorldTab.tsx` (line 994)

Change:
```tsx
<span className="text-[11px] font-bold uppercase tracking-widest text-[hsl(var(--ui-text))]">Scene Gallery Photos</span>
```

To:
```tsx
<label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Scene Gallery Photos</label>
```

Three corrections:
1. `text-[11px]` → `text-[10px]`
2. `font-bold` → `font-black`
3. `text-[hsl(var(--ui-text))]` → `text-zinc-400`
4. `<span>` → `<label>` (matching other field labels)

