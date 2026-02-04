

# Community Gallery - Search Header Styling & Sort Filter

## Overview

Update the Community Gallery search header to:
1. Use the steel blue (`#4a5f7f`) background matching the Scenario Builder
2. Add a segmented filter toggle for quick sorting: All, Most Recent, Most Liked, Most Saved, Most Played

---

## File Changes

| File | Changes |
|------|---------|
| `src/components/chronicle/GalleryHub.tsx` | Restyle search header container + add sort filter state and UI |
| `src/services/gallery-data.ts` | Add sortBy parameter to fetchPublishedScenarios function |

---

## Detailed Changes

### 1. GalleryHub.tsx - Add Sort State & Filter Toggle

**Add new state variable (after line 29):**
```tsx
const [sortBy, setSortBy] = useState<'all' | 'recent' | 'liked' | 'saved' | 'played'>('all');
```

**Update loadScenarios dependency (line 58):**
Include `sortBy` in the callback dependencies so changing the filter reloads data.

### 2. GalleryHub.tsx - Restyle Search Header Container (lines 165-205)

**Current search header:**
```tsx
<div className="p-6 border-b border-slate-200">
  <div className="max-w-2xl mx-auto">
    ...
  </div>
</div>
```

**Updated search header with steel blue background:**
```tsx
<div className="p-6 bg-[#4a5f7f]">
  <div className="max-w-2xl mx-auto space-y-4">
    {/* Search input */}
    <div className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search by tags: fantasy, romance, mystery..."
        className="w-full pl-12 pr-24 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent"
      />
      <button
        onClick={handleSearch}
        className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-white text-[#4a5f7f] rounded-xl font-semibold text-sm hover:bg-white/90 transition-colors"
      >
        Search
      </button>
    </div>
    
    {/* Filter tags display (if any) */}
    {searchTags.length > 0 && (
      <div className="flex items-center gap-2">
        <span className="text-sm text-white/70">Filtering by:</span>
        {searchTags.map(tag => (
          <span key={tag} className="px-2 py-1 bg-white/20 text-white rounded-full text-xs font-medium">
            #{tag}
          </span>
        ))}
        <button
          onClick={() => { setSearchTags([]); setSearchQuery(''); }}
          className="text-sm text-white/70 hover:text-white underline ml-2"
        >
          Clear
        </button>
      </div>
    )}

    {/* Sort Filter Toggle */}
    <div className="flex justify-center">
      <div className="inline-flex bg-white/10 rounded-full p-1 border border-white/20">
        {[
          { key: 'all', label: 'All' },
          { key: 'recent', label: 'Most Recent' },
          { key: 'liked', label: 'Most Liked' },
          { key: 'saved', label: 'Most Saved' },
          { key: 'played', label: 'Most Played' },
        ].map((option) => (
          <button
            key={option.key}
            onClick={() => setSortBy(option.key as typeof sortBy)}
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
  </div>
</div>
```

### 3. gallery-data.ts - Add Sort Parameter to fetchPublishedScenarios

**Update function signature (line 49):**
```tsx
export async function fetchPublishedScenarios(
  searchTags?: string[],
  sortBy: 'all' | 'recent' | 'liked' | 'saved' | 'played' = 'all',
  limit = 50,
  offset = 0
): Promise<PublishedScenario[]> {
```

**Update order clause based on sortBy (replace line 77):**
```tsx
// Apply sorting based on sortBy parameter
switch (sortBy) {
  case 'liked':
    query = query.order('like_count', { ascending: false });
    break;
  case 'saved':
    query = query.order('save_count', { ascending: false });
    break;
  case 'played':
    query = query.order('play_count', { ascending: false });
    break;
  case 'recent':
  case 'all':
  default:
    query = query.order('created_at', { ascending: false });
    break;
}
```

### 4. GalleryHub.tsx - Update loadScenarios Call

**Update the fetchPublishedScenarios call (line 40):**
```tsx
const data = await fetchPublishedScenarios(
  searchTags.length > 0 ? searchTags : undefined,
  sortBy
);
```

**Update useCallback dependencies (line 58):**
```tsx
}, [user, searchTags, sortBy]);
```

---

## Visual Reference

The sort filter toggle matches Image 2 styling:
- Pill-shaped container with subtle background
- Active item has solid white background with dark text
- Inactive items have transparent background with muted text
- Smooth transitions on hover and selection

The steel blue header matches the Scenario Builder panels exactly (`#4a5f7f`).

---

## Sort Options Mapping

| Filter | Database Sort | Purpose |
|--------|--------------|---------|
| All | `created_at DESC` | Default view, newest first |
| Most Recent | `created_at DESC` | Explicitly sort by publish date |
| Most Liked | `like_count DESC` | Popular by engagement |
| Most Saved | `save_count DESC` | Popular by saves/bookmarks |
| Most Played | `play_count DESC` | Popular by plays |

