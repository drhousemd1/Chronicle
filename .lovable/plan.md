
# Add Play Counter to Gallery Scenario Cards

## Overview

Add a play count indicator alongside the existing like and save counters at the bottom of Community Gallery scenario cards.

---

## Current State

The `play_count` is **already being tracked** in the database:
- `PublishedScenario` interface includes `play_count: number`
- Data is fetched in `fetchPublishedScenarios()`
- `incrementPlayCount()` function exists to update the count
- "Most Played" sorting option already works

Only the UI display is missing from the card.

---

## File to Modify

| File | Changes |
|------|---------|
| `src/components/chronicle/GalleryScenarioCard.tsx` | Add play count to the stats display (lines 144-153) |

---

## Detailed Changes

### Update Stats Display (lines 144-153)

**Current:**
```tsx
<div className="flex items-center gap-3 text-[10px] text-white/50">
  <span className="flex items-center gap-1">
    <Heart className={cn("w-3 h-3", isLiked && "fill-rose-400 text-rose-400")} />
    {published.like_count}
  </span>
  <span className="flex items-center gap-1">
    <Bookmark className={cn("w-3 h-3", isSaved && "fill-amber-400 text-amber-400")} />
    {published.save_count}
  </span>
</div>
```

**Updated:**
```tsx
<div className="flex items-center gap-3 text-[10px] text-white/50">
  <span className="flex items-center gap-1">
    <Heart className={cn("w-3 h-3", isLiked && "fill-rose-400 text-rose-400")} />
    {published.like_count}
  </span>
  <span className="flex items-center gap-1">
    <Bookmark className={cn("w-3 h-3", isSaved && "fill-amber-400 text-amber-400")} />
    {published.save_count}
  </span>
  <span className="flex items-center gap-1">
    <Play className="w-3 h-3" />
    {published.play_count}
  </span>
</div>
```

---

## Visual Result

The card footer stats will show:
- ❤️ [like count]
- 🔖 [save count]  
- ▶️ [play count]

All in the same compact style at the bottom-right of the card.

---

## No Additional Changes Needed

- The `Play` icon is already imported at the top of the file
- `published.play_count` is already available in the data
- No database or backend changes required
