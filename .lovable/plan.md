

# Community Gallery - Fix Search Bar & Sort Filter Styling

## Overview

Two issues to fix in `src/components/chronicle/GalleryHub.tsx`:

1. **Search bar needs white background** - Keep the blue container but make the search input itself white
2. **Sort filter toggle must match Your Stories slider** - Use the exact same styling from Index.tsx

---

## File to Modify

| File | Changes |
|------|---------|
| `src/components/chronicle/GalleryHub.tsx` | Fix search input background + match sort toggle styling to Your Stories |

---

## Detailed Changes

### 1. Search Input - White Background (lines 174-181)

**Current:**
```tsx
<input
  ...
  className="w-full pl-12 pr-24 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent"
/>
```

**Updated:**
```tsx
<input
  ...
  className="w-full pl-12 pr-24 py-4 bg-white border border-white rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent shadow-lg"
/>
```

Changes:
- `bg-white/10` → `bg-white` (solid white background)
- `text-white` → `text-slate-900` (dark text on white)
- `placeholder:text-white/50` → `placeholder:text-slate-400` (gray placeholder)
- Added `shadow-lg` for depth

### 2. Search Icon Color (line 173)

**Current:**
```tsx
<Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
```

**Updated:**
```tsx
<Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
```

### 3. Sort Filter Toggle - Match Your Stories Slider (lines 212-234)

**Current:**
```tsx
<div className="flex justify-center">
  <div className="inline-flex bg-white/10 rounded-full p-1 border border-white/20">
    {[...].map((option) => (
      <button
        ...
        className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
          sortBy === option.key
            ? 'bg-white text-[#4a5f7f] shadow-sm'
            : 'text-white/70 hover:text-white'
        }`}
      >
        {option.label}
      </button>
    ))}
  </div>
</div>
```

**Updated (exact match to Your Stories slider from Index.tsx lines 1230-1264):**
```tsx
<div className="flex justify-center">
  <div className="flex items-center bg-slate-200 rounded-full p-1 gap-0.5">
    {[...].map((option) => (
      <button
        ...
        className={cn(
          "px-4 py-1.5 rounded-full text-xs font-bold transition-all",
          sortBy === option.key 
            ? "bg-white text-slate-900 shadow-sm" 
            : "text-slate-500 hover:text-slate-700"
        )}
      >
        {option.label}
      </button>
    ))}
  </div>
</div>
```

Key styling changes:
- Container: `bg-white/10 border border-white/20` → `bg-slate-200 gap-0.5` (light gray, no border)
- Active button: `text-[#4a5f7f]` → `text-slate-900`
- Inactive button: `text-white/70 hover:text-white` → `text-slate-500 hover:text-slate-700`
- Button padding: `py-2 text-sm font-medium` → `py-1.5 text-xs font-bold`
- Add `cn()` import for consistency with rest of codebase

### 4. Add cn Import

Add the `cn` utility import at the top of the file:
```tsx
import { cn } from "@/lib/utils";
```

---

## Visual Summary

| Element | Before | After |
|---------|--------|-------|
| Search input background | `bg-white/10` (semi-transparent) | `bg-white` (solid white) |
| Search input text | `text-white` | `text-slate-900` |
| Search icon | `text-white/50` | `text-slate-400` |
| Filter container | `bg-white/10 border border-white/20` | `bg-slate-200` |
| Active filter button | `text-[#4a5f7f]` | `text-slate-900` |
| Inactive filter button | `text-white/70` | `text-slate-500` |
| Filter button text size | `text-sm font-medium` | `text-xs font-bold` |

This ensures the search bar has a clean white background while keeping the steel blue container, and the sort filter toggle matches exactly the slider on the Your Stories page.

