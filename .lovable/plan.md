

# Styling Fixes for Content Themes Section

## Overview

Fix 4 styling inconsistencies in the Content Themes section to match the established design patterns in the Scenario Builder.

---

## Issues and Fixes

### Issue 1: SFW/NSFW Badge Text Size on Gallery Cards

**Current:** The badge uses `text-[10px]` which matches the stats text  
**Problem:** User wants consistent sizing with the rest of the card text  
**Fix:** Keep `text-[10px]` as this is intentional for badge compactness - same as stats row. However, if user wants it larger to match title/description, we can adjust to `text-xs` (12px).

**File:** `src/components/chronicle/GalleryScenarioCard.tsx` (line 89)

**Change:**
```tsx
// Current (10px)
"...text-[10px] font-bold shadow-lg"

// Updated to match card description text (12px)
"...text-xs font-bold shadow-lg"
```

---

### Issue 2: "+ Add custom" Button Text Color

**Current:** Uses `text-zinc-500` (inactive gray color)  
**Desired:** Match the blue color used for interactive buttons like "Add Milestone Step" (`text-blue-400`)

**File:** `src/components/chronicle/ContentThemesSection.tsx` (line 146)

**Change:**
```tsx
// Current
className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800/50 text-zinc-500 border border-dashed border-zinc-600 hover:border-zinc-500 hover:text-zinc-400 transition-all flex items-center gap-1"

// Updated
className="px-3 py-1.5 rounded-lg text-xs font-medium bg-transparent text-blue-400 border-2 border-dashed border-zinc-500 hover:border-blue-400 hover:bg-blue-500/5 transition-all flex items-center gap-1"
```

---

### Issue 3: Custom Tag Chip Styling (Green vs Blue)

**Current:** Custom options use emerald/green styling (`bg-emerald-500/20 text-emerald-300 border-emerald-500/30`)  
**Desired:** Match prebuilt selected styling (`bg-blue-500/20 text-blue-300 border-blue-500/30`)

**File:** `src/components/chronicle/ContentThemesSection.tsx` (line 103)

**Change:**
```tsx
// Current
className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"

// Updated - Match prebuilt selected state
className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30"
```

Also update the Custom Tags section (line 247) from violet to blue:
```tsx
// Current
className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-500/20 text-violet-300 border border-violet-500/30"

// Updated
className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30"
```

---

### Issue 4: "Add" Button Styling in Custom Tags

**Current:** Standard blue button (`bg-blue-600 text-white`)  
**Desired:** Match "Publish to Gallery" and "Upload Image" premium styling

**File:** `src/components/chronicle/ContentThemesSection.tsx` (lines 232-237)

**Change:**
```tsx
// Current
<button
  type="button"
  onClick={addTag}
  disabled={!input.trim()}
  className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
>
  Add
</button>

// Updated - Premium shadow surface style
<button
  type="button"
  onClick={addTag}
  disabled={!input.trim()}
  className="flex h-10 items-center justify-center gap-2 px-4
    rounded-xl border border-[hsl(var(--ui-border))] 
    bg-[hsl(var(--ui-surface-2))] shadow-[0_10px_30px_rgba(0,0,0,0.35)]
    text-[hsl(var(--ui-text))] text-[10px] font-bold leading-none
    hover:bg-white/5 active:bg-white/10 
    disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
>
  Add
</button>
```

---

## Files Modified

| File | Changes |
|------|---------|
| `src/components/chronicle/GalleryScenarioCard.tsx` | SFW/NSFW badge text size → `text-xs` |
| `src/components/chronicle/ContentThemesSection.tsx` | 3 styling fixes: button colors, chip colors, Add button styling |

---

## Visual Summary

| Element | Before | After |
|---------|--------|-------|
| "+ Add custom" button | Gray inactive (`text-zinc-500`) | Blue interactive (`text-blue-400`) |
| Custom tag chips | Green (`emerald`) | Blue (`blue-500`) - matches selected prebuilt |
| Custom Tags "Add" button | Simple blue button | Premium dark surface with shadow |
| SFW/NSFW badge | 10px text | 12px text (same as description) |

