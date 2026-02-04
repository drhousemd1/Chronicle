
# Community Gallery Redesign with Category Sidebar

## Overview

This plan redesigns the Community Gallery to match the HTML mockup with:
1. A glass-effect sticky header with search bar and "Browse Categories" button
2. A collapsible sidebar with categorized filtering (Story Type, Genre, Origin, Trigger Warnings, Custom Tags)
3. Updated sort options as text links with underline indicator
4. A new blue gradient divider under the sort options
5. Updated card design (3:4 aspect ratio, bottom gradient, simplified layout)
6. Adding new trigger warnings to the Scenario Builder

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/constants/content-themes.ts` | Modify | Add new trigger warnings |
| `src/components/chronicle/GalleryHub.tsx` | Major rewrite | New layout with sidebar |
| `src/components/chronicle/GalleryScenarioCard.tsx` | Modify | Update to match mockup card style |
| `src/components/chronicle/GalleryCategorySidebar.tsx` | **Create** | New collapsible category sidebar component |

---

## 1. Add New Trigger Warnings

**File:** `src/constants/content-themes.ts`

Add the following to the `TRIGGER_WARNINGS` array:

```typescript
export const TRIGGER_WARNINGS = [
  // Existing...
  'Cheating',
  'Cuckold',
  'CNC',
  'NTR',
  'Chastity',
  'Hypno',
  'BDSM',
  'Voyeurism',
  'Bondage',
  'Impregnation',
  'Sissification',
  'Breeding',
  'Femdom',
  'Gore',
  'Bloodplay',
  'Forced Orgasm',
  'Humiliation',
  'Drug Use',
  // NEW ADDITIONS:
  'Coercion / Manipulation',
  'Blackmail',
  'Somnophilia',
  'Captivity',
  'Physical Abuse',
  'Domestic Violence',
  'Murder',
  'Stalking',
  'Isolation Control',
  'Medical Play',
  'Age Gap',
  'Incest',
  'Pseudo-Incest',
  'Degradation',
  'Breath Play',
  'Knife Play',
  'Free Use',
  'Self Harm',
  'Eating Disorders',
  'Mental Illness',
  'Dark Themes'
] as const;
```

---

## 2. Create Category Sidebar Component

**File:** `src/components/chronicle/GalleryCategorySidebar.tsx` (NEW)

A new component implementing the collapsible sidebar from the mockup:

### Features:
- Collapsible sections with chevron arrows (Genre, Origin, Trigger Warnings, Custom Tags)
- Story Type section (SFW/NSFW) always visible at top
- "Filter by" toggle button that reveals checkboxes for multi-select
- Clicking items toggles selection
- Yellow/gold accent bar at top (`border-t-3` style)
- Dark background (#18181b)

### Structure:

```tsx
interface CategoryFilter {
  storyType: ('SFW' | 'NSFW')[];
  genres: string[];
  origin: string[];
  triggerWarnings: string[];
  customTags: string[];
}

interface GalleryCategorySidebarProps {
  isOpen: boolean;
  filters: CategoryFilter;
  onFilterChange: (filters: CategoryFilter) => void;
  popularCustomTags: string[]; // Fetched from database
}
```

### Section Icons (Lucide equivalents for iconify icons in mockup):

| Section | Icon | Color |
|---------|------|-------|
| Story Type - SFW | `Shield` | blue-400 |
| Story Type - NSFW | `Flame` | orange-500 |
| Genre - Fiction/Fantasy | `BookOpen` | blue-400 |
| Genre - Romance types | `Heart` | pink-400 |
| Genre - Dark themes | `Skull` | purple-400 |
| Genre - Anime/Hentai | `Tv` | cyan-400 |
| Origin - Original | `Sparkles` | amber-400 |
| Origin - Game | `Gamepad2` | green-400 |
| Origin - Movie | `Film` | red-400 |
| Origin - Novel | `BookMarked` | blue-400 |
| Trigger Warnings | `AlertTriangle` | red-400 |
| Custom Tags | `Tag` | purple-400 |

### Collapsible Logic:
- Each section header is clickable to toggle collapse
- Chevron rotates 180deg when collapsed
- Uses `hidden` class toggle for content visibility

### Filter Mode:
- "Filter by" button in Story Type header toggles checkbox visibility
- When checkboxes visible, clicking row toggles checkbox
- When checkboxes hidden, clicking row immediately filters (single-select behavior)

---

## 3. Redesign GalleryHub Layout

**File:** `src/components/chronicle/GalleryHub.tsx`

### New Layout Structure:

```text
+----------------------------------------------------------+
| [Search Input]                    [Browse Categories]     | <- Glass nav header
+----------------------------------------------------------+
|           |                                               |
| Category  |     [All] [Recent] [Liked] [Saved] [Played]  |
| Sidebar   |     ──────────── blue divider ────────────   |
| (280px)   |                                               |
| (hidden   |     [Card] [Card] [Card] [Card]              |
|  by       |     [Card] [Card] [Card] [Card]              |
|  default) |                                               |
|           |                                               |
+----------------------------------------------------------+
```

### Key Changes:

1. **Header redesign:**
   - Glass effect: `bg-[rgba(18,18,20,0.8)] backdrop-blur-[12px] border-b border-white/5`
   - Search input with icon (left aligned, takes flex-1)
   - "Browse Categories" button (steel blue #4a5f7f background)
   - Remove the old sort toggle pills from header area

2. **Sort options moved to main content area:**
   - Horizontal text links (not pills)
   - Active state: `text-blue-500 border-b-2 border-blue-500`
   - Inactive: `text-gray-500 hover:text-white`
   - Blue gradient divider below: `background-image: linear-gradient(90deg, transparent, #3b82f6, transparent)`

3. **Grid update:**
   - 4 columns on XL: `xl:grid-cols-4`
   - Cards use 3:4 aspect ratio (as in mockup)

4. **Sidebar state:**
   - `const [sidebarOpen, setSidebarOpen] = useState(false);`
   - Toggle on "Browse Categories" click
   - Sidebar uses `hidden` class when closed

5. **Category filter state:**
   - Add `categoryFilters` state object
   - Pass to `fetchPublishedScenarios` with updated parameters

---

## 4. Update Gallery Data Service

**File:** `src/services/gallery-data.ts`

### Add category filter support to `fetchPublishedScenarios`:

```typescript
interface CategoryFilter {
  storyType?: ('SFW' | 'NSFW')[];
  genres?: string[];
  origin?: string[];
  triggerWarnings?: string[];
  customTags?: string[];
}

export async function fetchPublishedScenarios(
  searchTags?: string[],
  sortBy: SortOption = 'all',
  categoryFilters?: CategoryFilter,
  limit = 50,
  offset = 0
): Promise<PublishedScenario[]> {
  // ... existing query setup ...
  
  // If category filters are provided, we need to filter via content_themes
  // This requires a more complex query or post-fetch filtering
}
```

### Implementation approach:
Since content_themes is a separate table, we have two options:
1. Filter client-side after fetching (simpler, works for reasonable dataset sizes)
2. Use a Supabase RPC function for server-side filtering (better for large datasets)

For initial implementation, use client-side filtering after the join.

---

## 5. Update Card Design

**File:** `src/components/chronicle/GalleryScenarioCard.tsx`

### Changes from current to match mockup:

| Aspect | Current | Mockup |
|--------|---------|--------|
| Aspect ratio | 2:3 | 3:4 |
| Border radius | 2rem | 2xl (1rem) |
| Bottom gradient | via-slate-900/40 | More opaque (0.9 at bottom) |
| Stats position | Bottom right with icons | Bottom left, minimal |
| Title style | xl font-black | xl font-bold |
| Description | Italic | Not italic |
| Hover effects | Translate-y, scale | scale-110 on image only |

### Updated card structure:
```tsx
<div className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-[#2a2a2f] border border-white/5 hover:border-blue-500/30 transition-all cursor-pointer shadow-xl">
  <img className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
  <div className="absolute inset-0 p-5 flex flex-col justify-end">
    <h4 className="text-xl font-bold mb-1">{title}</h4>
    <p className="text-xs text-gray-300 line-clamp-2 mb-3">{description}</p>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
          <Heart className="text-red-500" /> {likeCount}
        </span>
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-{color}/20 text-{color}">{storyType}</span>
      </div>
      <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
        <MessageCircle /> {playCount}
      </div>
    </div>
  </div>
</div>
```

---

## 6. Add Popular Custom Tags Query

**File:** `src/services/gallery-data.ts`

Add function to fetch popular custom tags across all published scenarios:

```typescript
export async function fetchPopularCustomTags(limit = 20): Promise<string[]> {
  const { data, error } = await supabase
    .from('content_themes')
    .select('custom_tags, scenario_id')
    .not('custom_tags', 'is', null);
  
  if (error) throw error;
  
  // Count occurrences of each tag
  const tagCounts = new Map<string, number>();
  data?.forEach(row => {
    (row.custom_tags || []).forEach(tag => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });
  });
  
  // Sort by count and return top tags
  return Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag]) => tag);
}
```

---

## Visual Reference

### Header (Glass Nav):
```text
+------------------------------------------------------------------+
| [🔍 Search input placeholder text...           ] [Browse Categories] |
+------------------------------------------------------------------+
```

### Sort Options (centered, text style):
```text
              All Stories  Most Recent  Most Liked  Most Saved  Most Played
              ___________
              (blue underline on active)
              
              ═══════════════════ blue gradient line ═══════════════════
```

### Sidebar Structure:
```text
┌──────────────────────────────┐
│ ▀▀▀ yellow/gold accent ▀▀▀  │
├──────────────────────────────┤
│ STORY TYPE          [Filter] │
│ ┌────────────────────────┐   │
│ │ 🛡️ SFW                │   │
│ ├────────────────────────┤   │
│ │ 🔥 NSFW               │   │
│ └────────────────────────┘   │
│                              │
│ GENRE                    ▼   │
│ ┌────────────────────────┐   │
│ │ 📖 Fiction            │   │
│ │ ✨ Fantasy            │   │
│ │ 💕 Romance            │   │
│ │ 🖤 Dark Romance       │   │
│ │ ...                   │   │
│ └────────────────────────┘   │
│                              │
│ ORIGIN                   ▼   │
│ ┌────────────────────────┐   │
│ │ ⭐ Original Story     │   │
│ │ 🎮 Game               │   │
│ │ 🎬 Movie              │   │
│ │ 📚 Novel              │   │
│ └────────────────────────┘   │
│                              │
│ TRIGGER WARNINGS         ▼   │
│ ┌────────────────────────┐   │
│ │ ⚠️ Cheating           │   │
│ │ ⚠️ CNC                │   │
│ │ ⚠️ Blackmail          │   │
│ │ ...                   │   │
│ └────────────────────────┘   │
│                              │
│ POPULAR CUSTOM TAGS      ▼   │
│ ┌────────────────────────┐   │
│ │ 🏷️ (dynamic tags)     │   │
│ └────────────────────────┘   │
└──────────────────────────────┘
```

---

## Summary of Changes

1. **content-themes.ts**: Add 21 new trigger warning options
2. **GalleryCategorySidebar.tsx**: New component for category filtering
3. **GalleryHub.tsx**: Complete redesign with glass header, sidebar toggle, new sort UI
4. **GalleryScenarioCard.tsx**: Update aspect ratio and styling to match mockup
5. **gallery-data.ts**: Add category filtering support and popular tags query

The "Browse Categories" button will use the steel blue color (#4a5f7f) as requested.
