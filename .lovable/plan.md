

# Apply Unified Card Styling to Community Gallery + Add Stats to Your Stories

## Summary

Two main changes needed:
1. **Apply card UI improvements to GalleryScenarioCard** - Update badges, title/synopsis layout to match the changes we made to ScenarioHub
2. **Add publisher info and engagement stats to ScenarioHub cards** - Show "by [username]" and view/like/save/play counts

---

## Change 1: Update GalleryScenarioCard Badge Styling

The GalleryScenarioCard currently has different badge styling than what we just applied to ScenarioHub. We need to unify them.

### Current Issues in GalleryScenarioCard

| Badge | Current Styling | Should Be |
|-------|-----------------|-----------|
| Remixable | `bg-purple-500/80` with white text | `bg-[#2a2a2f]` with `text-purple-400` |
| SFW/NSFW | Already correct (charcoal + colored text) | No change needed |

### Changes to GalleryScenarioCard.tsx

**Update Remixable badge** (around line 99-104):

```tsx
{/* Remix Badge - Top Left with charcoal styling */}
{published.allow_remix && (
  <div className="absolute top-4 left-4 px-2.5 py-1 bg-[#2a2a2f] backdrop-blur-sm rounded-lg text-xs font-bold text-purple-400 flex items-center gap-1.5 shadow-lg uppercase tracking-wide">
    <Sparkles className="w-3 h-3" />
    Remixable
  </div>
)}
```

---

## Change 2: Update GalleryScenarioCard Title/Synopsis Layout

The GalleryScenarioCard should use the same lower-third positioning we applied to ScenarioHub.

### Changes to GalleryScenarioCard.tsx

Update the bottom info section (around line 142-175) to use `h-1/3` with `justify-start` and `line-clamp-3`:

```tsx
{/* Bottom Info - Positioned at top of lower third */}
<div className="absolute inset-x-0 bottom-0 h-1/3 p-6 pointer-events-none flex flex-col justify-start">
  <h3 className="text-xl font-black text-white leading-tight tracking-tight group-hover:text-blue-300 transition-colors truncate flex-shrink-0">
    {scenario?.title || "Untitled Story"}
  </h3>
  <p className="text-xs text-white/70 line-clamp-3 leading-relaxed italic mt-1 overflow-hidden">
    {scenario?.description || "No description provided."}
  </p>
  
  {/* Publisher & Stats */}
  <div className="flex items-center justify-between mt-auto">
    <span className="text-xs text-white/60 font-medium">
      by {publisher?.username || 'Anonymous'}
    </span>
    <div className="flex items-center gap-3 text-[10px] text-white/50">
      <span className="flex items-center gap-1">
        <Eye className="w-3 h-3" />
        {published.view_count}
      </span>
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
  </div>
</div>
```

The key change is using `mt-auto` on the stats row to push it to the bottom of the container while keeping the title at the top.

---

## Change 3: Add Publisher Info and Stats to ScenarioHub Cards

### New Data Requirements

For user-owned scenarios in "Your Stories", we need to:
1. Fetch the user's profile (username) once
2. Fetch published scenario stats for scenarios that are published

### Approach

Since the "Your Stories" page shows the user's own scenarios:
- The publisher is always the current user (fetch their profile once)
- Stats are only available for published scenarios

We'll need to:
1. Pass the current user's profile to ScenarioHub
2. Fetch published scenario data (including stats) for published scenarios
3. Display the same info bar as Gallery cards

### New Props for ScenarioCard

```tsx
interface ScenarioCardProps {
  scen: ScenarioMetadata;
  onPlay: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onViewDetails: (id: string) => void;
  isPublished?: boolean;
  contentThemes?: ContentThemes;
  publishedData?: PublishedScenario;  // NEW - contains stats
  ownerUsername?: string;             // NEW - current user's username
}
```

### New Service Function

**File: src/services/gallery-data.ts**

Add function to fetch published data with stats for user's scenarios:

```tsx
export async function fetchUserPublishedScenarios(
  userId: string
): Promise<Map<string, PublishedScenario>> {
  const { data, error } = await supabase
    .from('published_scenarios')
    .select('*')
    .eq('publisher_id', userId)
    .eq('is_published', true);
    
  if (error) throw error;
  
  const map = new Map<string, PublishedScenario>();
  for (const row of data || []) {
    map.set(row.scenario_id, row as PublishedScenario);
  }
  return map;
}
```

### Changes to Index.tsx

1. Add state for published scenarios data: `const [publishedScenariosData, setPublishedScenariosData] = useState<Map<string, PublishedScenario>>(new Map());`
2. Add state for user profile: `const [userProfile, setUserProfile] = useState<{ username: string | null } | null>(null);`
3. Fetch both in `loadData()`:
   - Fetch user profile from `profiles` table
   - Replace `fetchUserPublishedScenarioIds` with `fetchUserPublishedScenarios` (returns full data, not just IDs)
4. Pass to ScenarioHub:
   - `publishedScenariosData` instead of just IDs
   - `ownerUsername={userProfile?.username || 'Anonymous'}`

### Changes to ScenarioHub.tsx

Update ScenarioCard to show publisher info and stats:

```tsx
{/* Bottom Info - Positioned at top of lower third */}
<div className="absolute inset-x-0 bottom-0 h-1/3 p-6 pointer-events-none flex flex-col justify-start">
  <h3 className="text-xl font-black text-white leading-tight tracking-tight group-hover:text-blue-300 transition-colors truncate flex-shrink-0">
    {scen.title || "Unnamed Story"}
  </h3>
  <p className="text-xs text-white/70 line-clamp-3 leading-relaxed italic mt-1 overflow-hidden">
    {scen.description || "No summary provided."}
  </p>
  
  {/* Publisher & Stats */}
  <div className="flex items-center justify-between mt-auto">
    <span className="text-xs text-white/60 font-medium">
      by {ownerUsername || 'Anonymous'}
    </span>
    {publishedData && (
      <div className="flex items-center gap-3 text-[10px] text-white/50">
        <span className="flex items-center gap-1">
          <Eye className="w-3 h-3" />
          {publishedData.view_count}
        </span>
        <span className="flex items-center gap-1">
          <Heart className="w-3 h-3" />
          {publishedData.like_count}
        </span>
        <span className="flex items-center gap-1">
          <Bookmark className="w-3 h-3" />
          {publishedData.save_count}
        </span>
        <span className="flex items-center gap-1">
          <Play className="w-3 h-3" />
          {publishedData.play_count}
        </span>
      </div>
    )}
  </div>
</div>
```

For non-published scenarios, only show "by [username]" without stats.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/chronicle/GalleryScenarioCard.tsx` | Update Remixable badge styling, update bottom info layout to match ScenarioHub |
| `src/components/chronicle/ScenarioHub.tsx` | Add publisher info and stats row, add new props, import icons |
| `src/services/gallery-data.ts` | Add `fetchUserPublishedScenarios()` function |
| `src/pages/Index.tsx` | Fetch user profile and published scenarios data, pass to ScenarioHub |

---

## Visual Layout Summary (Both Card Types)

```text
+----------------------------------+
|  [Saved] [Published]     [NSFW]  |  Badges: Status left, Rating right
|  [Remixable]                     |
|                                  |
|      [Edit] [Delete] [Play]      |  Center hover actions (on hover)
|                                  |
|----------------------------------|  Top of lower 1/3
|  Story Title                     |
|  Synopsis text up to 3 lines...  |
|                                  |
|  by Username    👁6 ❤1 🔖1 ▶0   |  Publisher + stats at bottom
+----------------------------------+
```

