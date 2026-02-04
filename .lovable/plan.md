

# Community Gallery Redesign - Layout & Category Browser

## Overview

This plan updates the Community Gallery page layout based on the HTML mockup while **preserving the existing story cards (`GalleryScenarioCard`) and detail modal (`ScenarioDetailModal`) completely untouched**.

**Files that will NOT be modified:**
- `src/components/chronicle/GalleryScenarioCard.tsx` ❌
- `src/components/chronicle/ScenarioDetailModal.tsx` ❌

---

## Changes Summary

| Area | What Changes |
|------|-------------|
| Gallery Page Layout | Add glassmorphic header with search + Browse Categories button |
| Category Sidebar | New collapsible sidebar with category filtering |
| Content Themes Constants | Add new trigger warnings |
| Gallery Data Service | Support filtering by content themes (genres, triggers, etc.) |

---

## Part 1: Add New Trigger Warnings

**File:** `src/constants/content-themes.ts`

Add the following new trigger warnings to the `TRIGGER_WARNINGS` array:

```typescript
export const TRIGGER_WARNINGS = [
  // Existing warnings...
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
  // NEW WARNINGS:
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

## Part 2: Create Category Sidebar Component

**New File:** `src/components/chronicle/GalleryCategorySidebar.tsx`

A new collapsible sidebar component that allows filtering by:
- **Story Type** (SFW/NSFW)
- **Genre** (Fiction, Fantasy, Romance, Dark Romance, etc.)
- **Origin** (Original Story, Game, Movie, Novel)
- **Trigger Warnings** (all warnings from content-themes.ts)
- **Popular Custom Tags** (dynamically fetched from most-used tags)

### Key Features:
- Collapsible sections with chevron arrows
- Yellow accent border at top (per mockup: `border-top: 3px solid rgb(250, 204, 21)`)
- Dark background (`#18181b`)
- "Filter by" toggle button to show/hide checkboxes
- Clicking category items toggles selection
- Selected items have blue highlight

### Props Interface:
```typescript
interface GalleryCategorySidebarProps {
  isOpen: boolean;
  selectedFilters: {
    storyTypes: string[];
    genres: string[];
    origins: string[];
    triggerWarnings: string[];
    customTags: string[];
  };
  onFilterChange: (filters: typeof selectedFilters) => void;
}
```

### Icon Mapping for Categories:
| Category | Icon |
|----------|------|
| Story Type - SFW | `Shield` (green) |
| Story Type - NSFW | `Flame` (orange) |
| Genres - Fantasy | `Wand` |
| Genres - Romance | `Heart` |
| Genres - Dark Romance | `Moon` |
| Genres - Horror | `Skull` |
| Genres - Sci-Fi | `Rocket` |
| Genres - Action | `Zap` |
| Genres - Historical | `BookOpen` |
| Origin - Original | `Pen` |
| Origin - Game | `Gamepad2` |
| Origin - Movie | `Film` |
| Origin - Novel | `BookOpen` |
| Trigger Warnings | `AlertTriangle` (all use this) |
| Custom Tags | `Tag` |

---

## Part 3: Update GalleryHub Layout

**File:** `src/components/chronicle/GalleryHub.tsx`

### Changes:

1. **Replace the search header** with the new glassmorphic navigation bar:
   - Full-width search input on the left
   - "Browse Categories" button on the right (slate blue: `#4a5f7f`)
   - Glassmorphic background with backdrop blur

2. **Add sidebar state management:**
   ```typescript
   const [sidebarOpen, setSidebarOpen] = useState(false);
   const [categoryFilters, setCategoryFilters] = useState({
     storyTypes: [],
     genres: [],
     origins: [],
     triggerWarnings: [],
     customTags: []
   });
   ```

3. **Update layout structure:**
   ```tsx
   <div className="min-h-full flex flex-col bg-[#121214]">
     {/* Glassmorphic Header */}
     <header className="glass-nav sticky top-0 z-50 px-6 py-4 flex items-center gap-4">
       {/* Search input */}
       {/* Browse Categories button */}
     </header>
     
     <div className="flex-1 flex overflow-hidden">
       {/* Category Sidebar - conditionally rendered */}
       {sidebarOpen && <GalleryCategorySidebar ... />}
       
       {/* Main content area */}
       <main className="flex-1 overflow-y-auto p-8">
         {/* Sort filter tabs (All, Recent, Liked, Saved, Played) */}
         {/* Blue gradient divider */}
         {/* Story cards grid - UNCHANGED */}
       </main>
     </div>
   </div>
   ```

4. **Update search placeholder:** "Type here to Search for Characters"

5. **Move sort filters** from the search header into the main content area (centered, with blue underline on active tab)

---

## Part 4: Update Gallery Data Service

**File:** `src/services/gallery-data.ts`

Add support for filtering by content themes:

```typescript
export interface ContentThemeFilters {
  storyTypes?: string[];
  genres?: string[];
  origins?: string[];
  triggerWarnings?: string[];
  customTags?: string[];
}

export async function fetchPublishedScenarios(
  searchTags?: string[],
  sortBy: SortOption = 'all',
  limit = 50,
  offset = 0,
  contentThemeFilters?: ContentThemeFilters  // NEW PARAMETER
): Promise<PublishedScenario[]> {
  // ... existing query logic ...
  
  // If content theme filters provided, filter scenarios after fetch
  // based on their content_themes data
}
```

---

## Visual Layout Reference

```text
+------------------------------------------------------------------+
| [🔍 Search input...................................] [Browse Cat] |  ← Glassmorphic header
+------------------------------------------------------------------+
|        |                                                          |
| SIDEBAR|   All Stories | Recent | Liked | Saved | Played          |
| (280px)|   ─────────────────────────────────────────────          |
|        |                                                          |
| Story  |   +-------+  +-------+  +-------+  +-------+             |
| Type   |   | Card  |  | Card  |  | Card  |  | Card  |             |
| ├ SFW  |   +-------+  +-------+  +-------+  +-------+             |
| └ NSFW |                                                          |
|        |   +-------+  +-------+  +-------+  +-------+             |
| Genre  |   | Card  |  | Card  |  | Card  |  | Card  |             |
| ├ Fant.|   +-------+  +-------+  +-------+  +-------+             |
| ├ Rom. |                                                          |
| └ ...  |                                                          |
|        |                                                          |
| Origin |                                                          |
| ├ Orig.|                                                          |
| └ Game |                                                          |
|        |                                                          |
| Trigger|                                                          |
| ├ BDSM |                                                          |
| └ ...  |                                                          |
+--------+----------------------------------------------------------+
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/constants/content-themes.ts` | Modify | Add 21 new trigger warnings |
| `src/components/chronicle/GalleryCategorySidebar.tsx` | Create | New sidebar component |
| `src/components/chronicle/GalleryHub.tsx` | Modify | Update layout, add sidebar toggle |
| `src/services/gallery-data.ts` | Modify | Add content theme filtering |

---

## Styling Details

### Glassmorphic Header
```css
background-color: rgba(18, 18, 20, 0.8);
backdrop-filter: blur(12px);
border-bottom: 1px solid rgba(255, 255, 255, 0.05);
```

### Browse Categories Button
```css
background-color: #4a5f7f; /* Slate blue */
color: white;
border-radius: 0.5rem;
padding: 0.5rem 1rem;
```

### Sidebar Accent
```css
border-top: 3px solid rgb(250, 204, 21); /* Yellow accent */
background-color: #18181b;
```

### Blue Gradient Divider
```css
height: 1px;
background-image: linear-gradient(90deg, transparent 0%, rgb(59, 130, 246) 50%, transparent 100%);
opacity: 0.5;
```

---

## What Stays Unchanged

The following components remain **completely untouched**:
- `GalleryScenarioCard.tsx` - Story tile cards (as shown in user's screenshot)
- `ScenarioDetailModal.tsx` - Popup modal for story details (as shown in user's screenshot)
- All card data, styling, badges, stats display
- Modal layout, content themes display, character avatars

This plan only modifies the **page-level layout** and **filtering infrastructure**.

