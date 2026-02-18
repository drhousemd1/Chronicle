

# Fix Card Bottom Info: Consistent Heights with Pinned Footer

## Problem
Titles, stats, and "Written by:" appear at different vertical positions across cards because the bottom info section uses a simple `flex-col gap-1.5` -- content flows naturally, so shorter descriptions push everything up while longer ones push things down.

## Solution
Split the bottom info into two parts:
1. **Top part** (title + description): title is always at the same position; description gets a **fixed-height reserved area** (`min-h-[2.5rem]`) so it always occupies 2 lines of space regardless of actual content length
2. **Bottom part** (stats + author): pinned to the very bottom with `mt-auto`, so they never shift

The outer container gets a fixed height and uses `flex justify-end` so the entire info block is anchored to the card bottom consistently.

### Layout structure:
```text
|                              |
|         (cover image)        |
|                              |
|------ gradient overlay ------|
| Title (single line, truncate)|
| Description area (fixed h)   |  <-- always 2 lines tall even if short
|   (short text has gap below) |
| Stats icons row              |  <-- always same position
| Written by: Name             |  <-- always same position
+------------------------------+
```

## Technical Details

### Both files: GalleryScenarioCard.tsx (lines 141-170) and ScenarioHub.tsx (lines 102-133)

Replace the bottom info div with:

```tsx
<div className="absolute inset-x-0 bottom-0 p-4 pb-5 pointer-events-none flex flex-col">
  <h3 className="text-lg font-black text-white leading-tight tracking-tight group-hover:text-blue-300 transition-colors truncate">
    {title}
  </h3>
  <p className="text-xs text-white/60 line-clamp-2 leading-relaxed italic min-h-[2.5rem]">
    {description}
  </p>
  <div className="flex items-center gap-3 text-[10px] text-white/50 mt-1">
    {/* stats icons */}
  </div>
  <span className="text-[11px] text-white/50 font-medium mt-1">
    Written by: {name}
  </span>
</div>
```

Key changes:
- Remove `gap-1.5` from the container (use explicit `mt-1` on stats and author instead)
- Add `min-h-[2.5rem]` to the description paragraph -- this reserves exactly 2 lines of space at `text-xs` with `leading-relaxed`, so short descriptions leave a gap below them while long ones fill it
- Stats and "Written by:" always render at the same vertical position since the space above them is fixed

### Files Modified
| File | Lines |
|---|---|
| `src/components/chronicle/GalleryScenarioCard.tsx` | 141-170 |
| `src/components/chronicle/ScenarioHub.tsx` | 102-133 |

