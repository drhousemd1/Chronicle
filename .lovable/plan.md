

## Plan: Fix Roster Tile Collapse Object-Position Bounce

### Problem
The `<img>` in `CharacterRosterTile` uses `transition-all duration-300`, which causes CSS to animate `object-position` when toggling between expanded (`object-top` = `50% 0%`) and collapsed (computed `X% Y%`). This creates a visible two-step repositioning during collapse.

### Fix
**`src/components/chronicle/WorldTab.tsx` line 189** — Replace `transition-all` with specific transition properties that exclude `object-position`:

Change:
```tsx
className={`block w-full transition-all duration-300 ${...}`}
```
To:
```tsx
className={`block w-full transition-[height,object-fit] duration-300 ${...}`}
```

This keeps the smooth height animation for expand/collapse but snaps `object-position` instantly — no bounce.

One line change. No other files affected.

