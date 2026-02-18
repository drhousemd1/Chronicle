

# Fix Card Bottom Info: Dedicated Rows with No Clipping

## Problem
The bottom info section on story cards clips content because it uses fractional height constraints (`h-1/3`, `h-2/5`) and tries to fit variable-length text into a fixed area. The description, stats, and author overlap or get cut off.

## Solution
Restructure the bottom info into four clearly separated rows, each on its own line. Remove the fractional height constraint and use tighter padding with a stronger gradient to keep everything readable.

### New layout (4 dedicated lines):
1. **Title** -- single line, truncated
2. **Description** -- 2-line clamp, italic
3. **Stats icons** -- views, likes, saves, plays in a row
4. **"Written by: Name"**

### Changes

#### 1. GalleryScenarioCard.tsx (lines 141-174)

Remove `h-1/3` and `justify-start`. Replace with a `gap-1.5` vertical stack using `p-4 pb-5`. Each element is its own block -- no `mt-auto` or `justify-between`.

- Title: `text-lg` (down from `text-xl`), truncated
- Description: `line-clamp-2` (down from 3)
- Stats: own row, left-aligned
- Author: own row, "Written by:" prefix

Also strengthen gradient overlay from `via-slate-900/40` to `via-slate-900/60` so text is always readable.

#### 2. ScenarioHub.tsx (lines 102-137)

Same restructure:
- Remove `h-2/5` and `overflow-hidden` from container
- Same 4-row layout with `gap-1.5`
- Stats only render when `publishedData` exists (unchanged logic)
- Author uses "Written by:" prefix
- Strengthen gradient from `via-slate-900/20` to `via-slate-900/60`

### Technical Detail

**New bottom info block (both files):**

```text
+---------------------------+
| Title (truncated)         |
| Description (2 lines max) |
| Eye 12  Heart 5  Save 3  |
| Written by: AuthorName    |
+---------------------------+
```

```tsx
{/* Bottom Info */}
<div className="absolute inset-x-0 bottom-0 p-4 pb-5 pointer-events-none flex flex-col gap-1.5">
  <h3 className="text-lg font-black text-white leading-tight tracking-tight 
    group-hover:text-blue-300 transition-colors truncate">
    {title}
  </h3>
  <p className="text-xs text-white/60 line-clamp-2 leading-relaxed italic">
    {description}
  </p>
  <div className="flex items-center gap-3 text-[10px] text-white/50">
    {/* Eye, Heart, Bookmark, Play icons with counts */}
  </div>
  <span className="text-[11px] text-white/50 font-medium">
    Written by: {username}
  </span>
</div>
```

The gradient overlay line changes from:
- GalleryScenarioCard: `via-slate-900/40` to `via-slate-900/60`
- ScenarioHub: `via-slate-900/20` to `via-slate-900/60`

## Files Modified
| File | Change |
|---|---|
| `src/components/chronicle/GalleryScenarioCard.tsx` | Bottom info restructure (lines 141-174), gradient strengthen (line 84) |
| `src/components/chronicle/ScenarioHub.tsx` | Bottom info restructure (lines 102-137), gradient strengthen (line 87) |

