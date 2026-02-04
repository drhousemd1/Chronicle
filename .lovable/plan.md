
# Add Story Filter Toggle to "Your Stories" Tab

## Overview

Add a segmented toggle control in the "Your Stories" header that allows users to filter between:
- **My Stories** - Scenarios created by the user
- **Bookmarked** - Scenarios saved/bookmarked from other users in the Community Gallery
- **All** - Combined view showing both

---

## Visual Design

The toggle will appear in the header bar, positioned after the "Your Stories" title:

```
┌─────────────────────────────────────────────────────────────────┐
│  YOUR STORIES      [My Stories] [Bookmarked] [All]    ⚙ Settings│
└─────────────────────────────────────────────────────────────────┘
```

Using a segmented button group style with:
- Rounded pill-shaped container with slate background
- Active segment highlighted with white background and shadow
- Inactive segments with slate text

---

## Changes

### 1. Add Filter State to Index.tsx

**File:** `src/pages/Index.tsx` (around line 111)

Add a new state variable to track the current filter:

```tsx
type HubFilter = "my" | "bookmarked" | "all";
const [hubFilter, setHubFilter] = useState<HubFilter>("all");
```

### 2. Add State for Saved Scenarios

**File:** `src/pages/Index.tsx`

Add state to store saved/bookmarked scenarios:

```tsx
const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>([]);
```

### 3. Fetch Saved Scenarios on Mount

**File:** `src/pages/Index.tsx`

Import `fetchSavedScenarios` from gallery-data and fetch saved scenarios when user is authenticated:

```tsx
import { fetchSavedScenarios, SavedScenario } from '@/services/gallery-data';

// In useEffect or separate effect:
useEffect(() => {
  if (user) {
    fetchSavedScenarios(user.id).then(setSavedScenarios).catch(console.error);
  }
}, [user]);
```

### 4. Add Filter Toggle UI to Header

**File:** `src/pages/Index.tsx` (around line 1108-1112)

Add the segmented toggle control next to the "Your Stories" title:

```tsx
{tab === "hub" && (
  <div className="flex items-center gap-6">
    <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight">
      Your Stories
    </h1>
    <div className="flex items-center bg-slate-200 rounded-full p-1 gap-0.5">
      <button
        onClick={() => setHubFilter("my")}
        className={cn(
          "px-4 py-1.5 rounded-full text-xs font-bold transition-all",
          hubFilter === "my" 
            ? "bg-white text-slate-900 shadow-sm" 
            : "text-slate-500 hover:text-slate-700"
        )}
      >
        My Stories
      </button>
      <button
        onClick={() => setHubFilter("bookmarked")}
        className={cn(
          "px-4 py-1.5 rounded-full text-xs font-bold transition-all",
          hubFilter === "bookmarked" 
            ? "bg-white text-slate-900 shadow-sm" 
            : "text-slate-500 hover:text-slate-700"
        )}
      >
        Bookmarked
      </button>
      <button
        onClick={() => setHubFilter("all")}
        className={cn(
          "px-4 py-1.5 rounded-full text-xs font-bold transition-all",
          hubFilter === "all" 
            ? "bg-white text-slate-900 shadow-sm" 
            : "text-slate-500 hover:text-slate-700"
        )}
      >
        All
      </button>
    </div>
  </div>
)}
```

### 5. Convert Saved Scenarios to Display Format

**File:** `src/pages/Index.tsx`

Create a computed list that merges and filters scenarios based on the selected filter:

```tsx
const filteredRegistry = useMemo(() => {
  const myScenarioIds = new Set(registry.map(s => s.id));
  
  // Convert saved scenarios to ScenarioMetadata format
  const bookmarkedScenarios: ScenarioMetadata[] = savedScenarios
    .filter(saved => 
      saved.published_scenario?.scenario && 
      !myScenarioIds.has(saved.source_scenario_id) // Exclude own scenarios
    )
    .map(saved => ({
      id: saved.source_scenario_id,
      title: saved.published_scenario!.scenario!.title,
      description: saved.published_scenario!.scenario!.description || '',
      coverImage: saved.published_scenario!.scenario!.cover_image_url || '',
      coverImagePosition: saved.published_scenario!.scenario!.cover_image_position || { x: 50, y: 50 },
      tags: saved.published_scenario!.tags || [],
      createdAt: new Date(saved.created_at).getTime(),
      updatedAt: new Date(saved.created_at).getTime(),
      isBookmarked: true,  // Mark as bookmarked for UI differentiation
    }));
  
  switch (hubFilter) {
    case "my":
      return registry;
    case "bookmarked":
      return bookmarkedScenarios;
    case "all":
      return [...registry, ...bookmarkedScenarios];
  }
}, [registry, savedScenarios, hubFilter]);
```

### 6. Update ScenarioHub Props

**File:** `src/pages/Index.tsx`

Pass the filtered registry to ScenarioHub:

```tsx
<ScenarioHub
  registry={filteredRegistry}
  onPlay={handlePlayScenario}
  onEdit={handleEditScenario}
  onDelete={handleDeleteScenario}
  onCreate={handleCreateNewScenario}
/>
```

### 7. Update ScenarioMetadata Type (Optional Enhancement)

**File:** `src/types.ts`

Add an optional flag to identify bookmarked scenarios:

```tsx
export type ScenarioMetadata = {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  coverImagePosition?: { x: number; y: number };
  tags: string[];
  createdAt: number;
  updatedAt: number;
  isBookmarked?: boolean;  // NEW: For UI differentiation
};
```

### 8. Visual Badge for Bookmarked Scenarios (Optional)

**File:** `src/components/chronicle/ScenarioHub.tsx`

Add a visual indicator for bookmarked scenarios:

```tsx
{scen.isBookmarked && (
  <div className="absolute top-4 left-4 px-2 py-1 bg-purple-600 text-white text-[10px] font-bold uppercase tracking-wide rounded-full z-10">
    Saved
  </div>
)}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Index.tsx` | Add hubFilter state, savedScenarios state, fetch saved scenarios, add filter toggle UI, compute filtered registry |
| `src/types.ts` | Add optional `isBookmarked` field to ScenarioMetadata |
| `src/components/chronicle/ScenarioHub.tsx` | Add "SAVED" badge for bookmarked scenarios |

---

## Result

After implementation:
- Users can toggle between "My Stories", "Bookmarked", and "All" views
- Bookmarked scenarios from other users will appear with a "SAVED" badge
- The filter selection persists while on the hub tab
- "All" view shows both created and bookmarked stories together
