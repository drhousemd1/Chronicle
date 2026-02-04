

# UI Improvements for Like/Save Responsiveness, Button Text, Filters, and Published Tag

## Summary

This plan addresses 5 improvements:
1. **Like/Save count not updating in real-time** - Modal stats don't refresh immediately
2. **"Bookmark" button text change** - Change to "Save" / "Saved"
3. **Filter text "Bookmarked" change** - Change to "Saved Stories" on Your Stories page
4. **Add "Published" tag** - Show on tiles for published stories
5. **Add "Published Stories" filter** - New filter option on Your Stories page

---

## 1. Make Like/Save Counts Update Immediately

### Problem
When clicking Like or Bookmark in the modal, the counts in the top-right stats area don't update until the modal is closed and reopened. The `GalleryHub` passes static props (`likeCount`, `saveCount`) from `selectedPublished` which doesn't get updated after interactions.

### Solution
The `GalleryHub` already updates `scenarios` state after like/save actions (lines 140-144, 167-171, 180-184). The issue is that `selectedPublished` is set once when opening the modal and never updated. We need to derive the selected scenario's current data from the updated `scenarios` array.

**File:** `src/components/chronicle/GalleryHub.tsx`

Update the modal props to use live data from `scenarios` state:

```tsx
// Instead of passing selectedPublished directly, find the live version
const liveSelectedPublished = selectedPublished 
  ? scenarios.find(s => s.id === selectedPublished.id) || selectedPublished
  : null;

// Then use liveSelectedPublished for all modal props
<ScenarioDetailModal
  likeCount={liveSelectedPublished.like_count}
  saveCount={liveSelectedPublished.save_count}
  viewCount={liveSelectedPublished.view_count}
  isLiked={likes.has(liveSelectedPublished.id)}
  isSaved={saves.has(liveSelectedPublished.id)}
  // ... rest of props
/>
```

---

## 2. Change "Bookmark" Button to "Save/Saved"

**File:** `src/components/chronicle/ScenarioDetailModal.tsx` (line 284)

Current:
```tsx
<span className="text-sm font-semibold">Bookmark</span>
```

Change to:
```tsx
<span className="text-sm font-semibold">{isSaved ? 'Saved' : 'Save'}</span>
```

---

## 3. Change "Bookmarked" Filter to "Saved Stories"

**File:** `src/pages/Index.tsx` (line 1263)

Current:
```tsx
>
  Bookmarked
</button>
```

Change to:
```tsx
>
  Saved Stories
</button>
```

---

## 4. Add "Published" Tag to Story Tiles

Stories that are published to the gallery should show a "Published" tag at the top of the tile, similar to the existing "Saved" tag.

### Approach
The `ScenarioHub` component needs to know which scenarios are published. Currently, publication status is only fetched when opening the detail modal. We need to pass publication status from the parent.

**File:** `src/pages/Index.tsx`

1. Fetch all published scenario IDs for the user's scenarios when loading data
2. Pass this information to `ScenarioHub` or include it in the `ScenarioMetadata`

**File:** `src/services/gallery-data.ts`

Add a new function to get all published scenario IDs for a user:

```tsx
export async function fetchUserPublishedScenarioIds(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('published_scenarios')
    .select('scenario_id')
    .eq('publisher_id', userId)
    .eq('is_published', true);
    
  if (error) throw error;
  return new Set((data || []).map(p => p.scenario_id));
}
```

**File:** `src/pages/Index.tsx`

1. Add state: `const [publishedScenarioIds, setPublishedScenarioIds] = useState<Set<string>>(new Set());`
2. Fetch in `loadData()`: call `fetchUserPublishedScenarioIds(user.id)`
3. Pass to `ScenarioHub`: `publishedScenarioIds={publishedScenarioIds}`

**File:** `src/components/chronicle/ScenarioHub.tsx`

1. Add prop: `publishedScenarioIds?: Set<string>`
2. In `ScenarioCard`, add the Published tag:

```tsx
{/* Published tag - show if published and not bookmarked */}
{!scen.isBookmarked && publishedScenarioIds?.has(scen.id) && (
  <div className="absolute top-4 right-4 px-2.5 py-1 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wide rounded-full z-10 shadow-lg">
    Published
  </div>
)}
```

Note: Position right side since "Saved" tag uses left side.

---

## 5. Add "Published Stories" Filter Option

**File:** `src/pages/Index.tsx`

1. Update the `HubFilter` type (line 142):
```tsx
type HubFilter = "my" | "bookmarked" | "published" | "all";
```

2. Update `filteredRegistry` (around line 225) to handle the new filter:
```tsx
case "published":
  return registry.filter(s => publishedScenarioIds.has(s.id));
```

3. Add the new filter button after "Saved Stories" (around line 1265):
```tsx
<button
  onClick={() => setHubFilter("published")}
  className={cn(
    "px-4 py-1.5 rounded-full text-xs font-bold transition-all",
    hubFilter === "published" 
      ? "bg-white text-slate-900 shadow-sm" 
      : "text-slate-500 hover:text-slate-700"
  )}
>
  Published
</button>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/services/gallery-data.ts` | Add `fetchUserPublishedScenarioIds()` function |
| `src/pages/Index.tsx` | Add published IDs state, fetch on load, update filter type, add filter case, add filter button, rename "Bookmarked" to "Saved Stories" |
| `src/components/chronicle/ScenarioHub.tsx` | Add `publishedScenarioIds` prop, show "Published" tag on cards |
| `src/components/chronicle/GalleryHub.tsx` | Use live data for modal props so counts update immediately |
| `src/components/chronicle/ScenarioDetailModal.tsx` | Change "Bookmark" to "Save/Saved" |

---

## Technical Notes

- The like/save count update issue is a React state synchronization problem - `selectedPublished` is a snapshot that doesn't update when `scenarios` state changes
- The "Published" tag will show on the right side of cards (opposite to "Saved" which shows on left) to avoid overlap
- The new filter will only show user's own published stories, not all published stories from the gallery

