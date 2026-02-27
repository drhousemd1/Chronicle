

## Remove Avatar Image Border

The avatar thumbnail on line 70 has `border-2 border-[#4a5f7f]` which adds a slate blue border around the image. The user wants only the outer container card to have the border, not the image itself.

### Change

**File: `src/components/chronicle/WorldTab.tsx`** -- Line 70

Remove `border-2 border-[#4a5f7f]` from the avatar wrapper div, keeping everything else (rounded corners, overflow hidden, shadow, hover scale, background).

Before:
```
className="w-14 h-14 shrink-0 rounded-xl border-2 border-[#4a5f7f] overflow-hidden shadow-sm transition-transform duration-300 group-hover:scale-105 bg-zinc-800"
```

After:
```
className="w-14 h-14 shrink-0 rounded-xl overflow-hidden shadow-sm transition-transform duration-300 group-hover:scale-105 bg-zinc-800"
```

