

# Add "Remixable" Badge to Your Stories Page

## Summary

Add a "Remixable" badge to the "Your Stories" page for scenarios that are published AND have remixing enabled. This helps users quickly see which of their published stories can be remixed by others.

---

## Current State

- The "Published" badge shows in the top-left for published scenarios
- The `publishedData` prop (type `PublishedScenario`) is already passed to `ScenarioCard`
- `publishedData.allow_remix` contains the boolean we need
- The badge is NOT currently displayed on the Your Stories page

---

## Solution

Add the "Remixable" badge to the top-left badge container, right after the "Published" badge (or "Saved" badge if applicable). Both badges can show simultaneously if a story is both published and remixable.

### File: `src/components/chronicle/ScenarioHub.tsx`

**Add import for Sparkles icon:**
```tsx
import { Eye, Heart, Bookmark, Play, Sparkles } from "lucide-react";
```

**Update the badge container** (around lines 37-50) to include the Remixable badge:

```tsx
{/* Top-left badge container - flows horizontally */}
<div className="absolute top-4 left-4 flex items-center gap-2 z-10">
  {scen.isBookmarked && (
    <div className="px-2.5 py-1 backdrop-blur-sm rounded-lg text-xs font-bold shadow-lg bg-[#2a2a2f] text-yellow-400 uppercase tracking-wide">
      Saved
    </div>
  )}
  
  {!scen.isBookmarked && isPublished && (
    <div className="px-2.5 py-1 backdrop-blur-sm rounded-lg text-xs font-bold shadow-lg bg-[#2a2a2f] text-emerald-400 uppercase tracking-wide">
      Published
    </div>
  )}
  
  {/* NEW: Remixable badge - shows for published scenarios with allow_remix enabled */}
  {publishedData?.allow_remix && (
    <div className="px-2.5 py-1 backdrop-blur-sm rounded-lg text-xs font-bold shadow-lg bg-[#2a2a2f] text-purple-400 uppercase tracking-wide flex items-center gap-1.5">
      <Sparkles className="w-3 h-3" />
      Remixable
    </div>
  )}
</div>
```

---

## Visual Result

For a story that is published AND remixable, both badges will display side-by-side:

```text
+------------------------------------------+
|  [Published] [✦ Remixable]       [NSFW]  |
|                                          |
|        ...                               |
+------------------------------------------+
```

For a story that is published but NOT remixable:

```text
+------------------------------------------+
|  [Published]                     [NSFW]  |
|                                          |
|        ...                               |
+------------------------------------------+
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/chronicle/ScenarioHub.tsx` | Import `Sparkles` icon, add Remixable badge after Published badge |

---

## Technical Notes

- The data is already available via `publishedData` prop
- No new data fetching required
- Badge styling matches the existing unified system (charcoal background with purple text for Remixable)
- The badge only appears when `publishedData?.allow_remix` is truthy, so unpublished scenarios won't show it

