
# Fix Hover Action Buttons Scaling Issue

## Problem

The Edit, Delete, and Play buttons on story cards use fixed pixel-based sizing (`px-6 py-2.5`) that doesn't adapt to the card width. When viewing on smaller screens or narrower viewports, the cards shrink but the buttons remain the same absolute size, causing them to:
- Extend beyond the card edges
- Appear oversized relative to the card
- Overlap or crowd together

## Solution

Make the hover action buttons responsive by:
1. Adding horizontal padding to the button container so buttons stay within card bounds
2. Using smaller padding on the buttons themselves
3. Making the gap between buttons smaller on narrow cards
4. Adding `flex-wrap` so buttons can wrap if needed on very small cards
5. Using `max-w-full` to prevent button overflow

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/chronicle/ScenarioHub.tsx` | Update hover action buttons with responsive sizing and container padding |
| `src/components/chronicle/GalleryScenarioCard.tsx` | Update hover action buttons with responsive sizing and container padding |

---

## Change 1: ScenarioHub.tsx - Responsive Hover Buttons

**Update the hover actions container (lines 80-100):**

```tsx
{/* Hover Actions - Edit, Delete, Play */}
<div className="absolute inset-0 flex items-center justify-center gap-2 px-4 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 scale-90 group-hover:scale-100 flex-wrap">
  <button 
    onClick={(e) => { e.stopPropagation(); onEdit(scen.id); }}
    className="px-4 py-2 bg-white text-slate-900 rounded-xl font-bold text-xs shadow-2xl hover:bg-slate-50 transition-colors"
  >
    Edit
  </button>
  <button 
    onClick={handleDeleteClick}
    className="px-4 py-2 bg-rose-600 text-white rounded-xl font-bold text-xs shadow-2xl hover:bg-rose-500 transition-colors"
  >
    Delete
  </button>
  <button 
    onClick={(e) => { e.stopPropagation(); onPlay(scen.id); }}
    className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs shadow-2xl hover:bg-blue-500 transition-colors"
  >
    Play
  </button>
</div>
```

**Key changes:**
- Container: `gap-3` to `gap-2` (tighter spacing)
- Container: Added `px-4` (horizontal padding to keep buttons within card)
- Container: Added `flex-wrap` (allows wrapping on very small cards)
- Buttons: `px-6 py-2.5` to `px-4 py-2` (smaller padding)
- Buttons: `text-sm` to `text-xs` (slightly smaller text)

---

## Change 2: GalleryScenarioCard.tsx - Responsive Hover Buttons

**Update the hover actions container (lines 106-139):**

```tsx
{/* Hover Actions */}
<div className="absolute inset-0 flex items-center justify-center gap-2 px-4 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 scale-90 group-hover:scale-100 flex-wrap">
  <button
    onClick={handleLike}
    disabled={isLiking}
    className={cn(
      "p-2.5 rounded-xl shadow-2xl transition-all",
      isLiked 
        ? "bg-rose-500 text-white" 
        : "bg-white/90 text-slate-700 hover:bg-rose-100 hover:text-rose-500"
    )}
  >
    <Heart className={cn("w-4 h-4", isLiked && "fill-current")} />
  </button>
  <button
    onClick={handleSave}
    disabled={isSaving}
    className={cn(
      "p-2.5 rounded-xl shadow-2xl transition-all",
      isSaved 
        ? "bg-amber-500 text-white" 
        : "bg-white/90 text-slate-700 hover:bg-amber-100 hover:text-amber-500"
    )}
  >
    <Bookmark className={cn("w-4 h-4", isSaved && "fill-current")} />
  </button>
  <button
    onClick={handlePlay}
    className="px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs shadow-2xl hover:bg-blue-500 transition-colors flex items-center gap-1.5"
  >
    <Play className="w-3.5 h-3.5 fill-current" />
    Play
  </button>
</div>
```

**Key changes:**
- Container: `gap-3` to `gap-2` (tighter spacing)
- Container: Added `px-4` (horizontal padding)
- Container: Added `flex-wrap`
- Icon buttons: `p-3` to `p-2.5` (slightly smaller)
- Icon buttons: `w-5 h-5` icons to `w-4 h-4` (smaller icons)
- Play button: `px-6 py-3` to `px-4 py-2.5`
- Play button: `text-sm` to `text-xs`
- Play button: `gap-2` to `gap-1.5`
- Play icon: `w-4 h-4` to `w-3.5 h-3.5`

---

## Visual Result

**Before (overflow on narrow cards):**
```
+------------------+
|  [PUBLISHED]     |
|                  |
| [Edit][Delete][Play] <-- Buttons extend off card
|                  |
+------------------+
```

**After (buttons stay within card):**
```
+------------------+
|  [PUBLISHED]     |
|                  |
|  [Edit][Del][▶]  |  <-- Buttons fit with padding
|                  |
+------------------+
```

On very narrow cards, buttons will wrap to a second row instead of overflowing.
