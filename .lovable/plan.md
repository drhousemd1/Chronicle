

# ScenarioHub Card UI Redesign

## Overview

This plan implements 4 fixes to improve the scenario card design on the "Your Stories" page to match the Community Gallery styling and improve visual consistency.

---

## Fix 1: Unify Badge Styling and Position (Top-Left Corner)

### Changes

Move status badges (Saved, Published) to a **top-left** flex container. Update styling to use charcoal background with colored text:

**File:** `src/components/chronicle/ScenarioHub.tsx`

```tsx
{/* Top-left badge container - flows horizontally */}
<div className="absolute top-4 left-4 flex items-center gap-2 z-10">
  {/* Saved badge - yellow text */}
  {scen.isBookmarked && (
    <div className="px-2.5 py-1 backdrop-blur-sm rounded-lg text-xs font-bold shadow-lg bg-[#2a2a2f] text-yellow-400 uppercase tracking-wide">
      Saved
    </div>
  )}
  
  {/* Published badge - green text */}
  {!scen.isBookmarked && isPublished && (
    <div className="px-2.5 py-1 backdrop-blur-sm rounded-lg text-xs font-bold shadow-lg bg-[#2a2a2f] text-emerald-400 uppercase tracking-wide">
      Published
    </div>
  )}
</div>
```

**Badge Color Reference:**

| Badge | Position | Background | Text Color |
|-------|----------|-----------|------------|
| Saved | Top-Left | `bg-[#2a2a2f]` | `text-yellow-400` |
| Published | Top-Left | `bg-[#2a2a2f]` | `text-emerald-400` |
| Remixable | Top-Left | `bg-[#2a2a2f]` | `text-purple-400` |
| SFW | Top-Right | `bg-[#2a2a2f]` | `text-blue-400` |
| NSFW | Top-Right | `bg-[#2a2a2f]` | `text-red-400` |

---

## Fix 2: Move Delete Button to Hover Action Row

### Changes

Remove floating trash icon from top-right. Add Delete button inline with Edit and Play:

**File:** `src/components/chronicle/ScenarioHub.tsx`

```tsx
{/* Hover Actions - Edit, Delete, Play */}
<div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 scale-90 group-hover:scale-100">
  <button 
    onClick={(e) => { e.stopPropagation(); onEdit(scen.id); }}
    className="px-6 py-2.5 bg-white text-slate-900 rounded-xl font-bold text-sm shadow-2xl hover:bg-slate-50 transition-colors"
  >
    Edit
  </button>
  <button 
    onClick={handleDeleteClick}
    className="px-6 py-2.5 bg-rose-600 text-white rounded-xl font-bold text-sm shadow-2xl hover:bg-rose-500 transition-colors"
  >
    Delete
  </button>
  <button 
    onClick={(e) => { e.stopPropagation(); onPlay(scen.id); }}
    className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-2xl hover:bg-blue-500 transition-colors"
  >
    Play
  </button>
</div>
```

Also remove the floating trash button that's currently at top-right.

---

## Fix 3: Add SFW/NSFW Badge (Top-Right Corner)

### Changes

Add SFW/NSFW badge to Your Stories cards, positioned in the **top-right corner** (same as Community Gallery).

**File:** `src/services/supabase-data.ts`

Add batch fetch function:

```tsx
export async function fetchContentThemesForScenarios(
  scenarioIds: string[]
): Promise<Map<string, ContentThemes>> {
  if (scenarioIds.length === 0) return new Map();
  
  const { data, error } = await supabase
    .from('content_themes')
    .select('*')
    .in('scenario_id', scenarioIds);
    
  if (error) throw error;
  
  const map = new Map<string, ContentThemes>();
  for (const row of data || []) {
    map.set(row.scenario_id, {
      characterTypes: row.character_types || [],
      storyType: row.story_type || null,
      genres: row.genres || [],
      origin: row.origin || [],
      triggerWarnings: row.trigger_warnings || [],
      customTags: row.custom_tags || []
    });
  }
  return map;
}
```

**File:** `src/pages/Index.tsx`

1. Add state for content themes map
2. Fetch themes after loading registry
3. Pass map to ScenarioHub

**File:** `src/components/chronicle/ScenarioHub.tsx`

Add SFW/NSFW badge in top-right:

```tsx
{/* SFW/NSFW Badge - Top Right */}
{contentThemes?.storyType && (
  <div className={cn(
    "absolute top-4 right-4 px-2.5 py-1 backdrop-blur-sm rounded-lg text-xs font-bold shadow-lg bg-[#2a2a2f] z-10",
    contentThemes.storyType === 'NSFW' ? "text-red-400" : "text-blue-400"
  )}>
    {contentThemes.storyType}
  </div>
)}
```

---

## Fix 4: Reposition Title to Top of Lower Third

### Changes

Move title/description area higher on the card:

**File:** `src/components/chronicle/ScenarioHub.tsx`

```tsx
{/* Bottom Info - Positioned at top of lower third */}
<div className="absolute inset-x-0 bottom-0 h-1/3 p-6 pointer-events-none flex flex-col justify-start">
  <h3 className="text-xl font-black text-white leading-tight tracking-tight group-hover:text-blue-300 transition-colors truncate flex-shrink-0">
    {scen.title || "Unnamed Story"}
  </h3>
  <p className="text-xs text-white/70 line-clamp-3 leading-relaxed italic mt-1 overflow-hidden">
    {scen.description || "No summary provided."}
  </p>
</div>
```

Key changes:
- `h-28` → `h-1/3` (one-third of card height)
- Added `justify-start` to push content to top of container
- `line-clamp-3` already handles truncation with `...`

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/chronicle/ScenarioHub.tsx` | Update badge positions (left for status, right for SFW/NSFW), move delete to hover row, reposition title area |
| `src/pages/Index.tsx` | Add content themes state, fetch themes for all scenarios, pass to ScenarioHub |
| `src/services/supabase-data.ts` | Add `fetchContentThemesForScenarios()` batch function |

---

## Visual Layout Summary

```text
+----------------------------------+
|  [Saved] [Published]    [NSFW]   |  ← Badges: Left = status, Right = rating
|                                  |
|                                  |
|      [Edit] [Delete] [Play]      |  ← Center hover actions (on hover)
|                                  |
|----------------------------------|  ← Top of lower 1/3
|  Story Title                     |
|  Synopsis text that can be       |
|  up to 3 lines with ellipsis...  |
+----------------------------------+
```

