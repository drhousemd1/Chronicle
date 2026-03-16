

# Fix White Border Flash on Pill Transitions

## Problem
When clicking between filter pills, the `border-t border-white/20` class is conditionally applied only to the active pill. During the `transition-all` animation, the border animates from visible to invisible on the previously active pill, causing a brief white flash.

## Fix
Always apply a `border-t` to all pills, but use `border-transparent` for inactive ones and `border-white/20` for active ones. This way the border property transitions smoothly (or is always present) without a flash.

## Changes — 3 locations

### 1. `src/pages/Index.tsx` — My Stories pills (line 1928-1931)
Change inactive state from no border to `border-t border-transparent`, and remove `transition-all` (replace with `transition-colors`):
```
// Active:
"relative overflow-hidden bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] border-t border-white/20 text-white shadow-sm"
// Inactive:
"border-t border-transparent text-[#a1a1aa] hover:text-[#e4e4e7]"
```

### 2. `src/pages/Index.tsx` — Gallery sort pills (around line 2048-2055)
Same pattern: add `border-t border-transparent` to inactive state.

### 3. `src/pages/Gallery.tsx` — Standalone gallery pills (lines 63-75)
Same pattern.

### Files Changed
- `src/pages/Index.tsx` — 2 pill locations
- `src/pages/Gallery.tsx` — 1 pill location

