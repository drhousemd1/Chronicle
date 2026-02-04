

# Add Content Themes Section to Scenario Builder

## Overview

Add a new "Content Themes" section in the Scenario Builder (WorldTab) positioned above the "Share Your Story" section. This section will allow users to categorize their scenarios with structured tags across 6 categories, with prebuilt options and the ability to add custom tags. The selected themes will also be displayed in the ScenarioDetailModal and the SFW/NSFW status will appear as a badge on GalleryScenarioCard tiles.

---

## Database Changes

### New Table: `scenario_content_themes`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | Primary key |
| `scenario_id` | uuid (FK) | References scenarios table |
| `character_types` | text[] | Selected character types |
| `story_type` | text | 'SFW' or 'NSFW' |
| `genres` | text[] | Selected genres |
| `origin` | text[] | Selected origins |
| `trigger_warnings` | text[] | Selected trigger warnings |
| `custom_tags` | text[] | User-defined custom tags |
| `created_at` | timestamptz | Creation timestamp |
| `updated_at` | timestamptz | Update timestamp |

### RLS Policies

- Users can read themes for published scenarios
- Users can CRUD their own scenario themes

---

## Files to Create

### 1. `src/components/chronicle/ContentThemesSection.tsx`

New component for the Content Themes UI section with:

- **Category Selector Component**: Reusable component for each theme category that displays:
  - Prebuilt options as clickable pills/chips
  - Input field for adding custom options
  - Selected items shown as highlighted pills

- **Categories:**
  - **Character Types**: Female, Male, Non-binary, Transgender, Intersex, Futanari, Mythical, Monster
  - **Story Type**: SFW, NSFW (single select, mutually exclusive)
  - **Genre**: Fictional, Fantasy, Romance, Dark Romance, Why Choose, Reverse Harem, Gothic Romance, Paranormal Romance, Enemies To Lovers, Hentai, Anime, Royalty, Action, Adventure, Religious, Historical, Sci-Fi, Horror, FanFiction, Philosophy, Political, Detective, Manga
  - **Origin**: Original, Game, Movie, Novel
  - **Trigger Warnings**: Cheating, Cuckold, CNC, NTR, Chastity, Hypno, BDSM, Voyeurism, Bondage, Impregnation, Sissification, Breeding, Femdom, Gore, Bloodplay, Forced Orgasm, Humiliation, Drug Use
  - **Custom Tags**: Free-form input (no hashtag prefix in display)

- **Styling**: Dark theme matching the Scenario Builder (bg-[#2a2a2f], steel blue header #4a5f7f, white titles)

### 2. `src/constants/content-themes.ts`

Constants file containing the prebuilt options for each category.

---

## Files to Modify

### 1. `src/components/chronicle/WorldTab.tsx`

- Import and add `ContentThemesSection` component
- Position above the "Share Your Story" section
- Pass content themes state and update handlers
- Add state for content themes data

### 2. `src/services/supabase-data.ts`

- Add `fetchContentThemes(scenarioId)` function
- Add `saveContentThemes(scenarioId, themes)` function
- Add ContentThemes type

### 3. `src/components/chronicle/ScenarioDetailModal.tsx`

- Add new props for content themes data
- Display themes in organized sections below description:
  - Genre: [comma-separated list]
  - Character Types: [comma-separated list]
  - Story Origin: [origin value]
  - Trigger Warnings: [comma-separated list]
- Keep existing Like/Bookmark/Play buttons visible

### 4. `src/components/chronicle/GalleryScenarioCard.tsx`

- Add SFW/NSFW badge in top-right corner
- Style: NSFW in red text, SFW in white/gray text
- Fetch and display story_type from content themes

### 5. `src/services/gallery-data.ts`

- Update `fetchPublishedScenarios()` to join content themes
- Update `PublishedScenario` interface to include content themes

### 6. `src/components/chronicle/GalleryHub.tsx`

- Pass content themes data to ScenarioDetailModal

### 7. `src/pages/Index.tsx`

- Add content themes state management for active scenario
- Fetch and save content themes when scenario changes

### 8. `src/types.ts`

- Add `ContentThemes` type definition

---

## UI Design Specifications

### ContentThemesSection Layout

```text
+----------------------------------------------------------+
| [Tags Icon]  Content Themes                              |  <- Steel blue header (#4a5f7f)
+----------------------------------------------------------+
|                                                          |
|  ┌────────────────────────────────────────────────────┐  |
|  │ Character Types                                    │  |
|  │ ┌──────┐ ┌──────┐ ┌────────┐ ┌───────────┐        │  |
|  │ │Female│ │ Male │ │Non-bin.│ │Transgender│ ...    │  |
|  │ └──────┘ └──────┘ └────────┘ └───────────┘        │  |
|  │ [+ Add custom...]                                  │  |
|  └────────────────────────────────────────────────────┘  |
|                                                          |
|  ┌────────────────────────────────────────────────────┐  |
|  │ Story Type                                         │  |
|  │ ┌─────┐ ┌──────┐                                   │  |
|  │ │ SFW │ │ NSFW │    (mutually exclusive)           │  |
|  │ └─────┘ └──────┘                                   │  |
|  └────────────────────────────────────────────────────┘  |
|                                                          |
|  ┌────────────────────────────────────────────────────┐  |
|  │ Genre                                              │  |
|  │ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │  |
|  │ │Fantasy │ │Romance │ │ Horror │ │ Sci-Fi │ ...   │  |
|  │ └────────┘ └────────┘ └────────┘ └────────┘       │  |
|  │ [+ Add custom...]                                  │  |
|  └────────────────────────────────────────────────────┘  |
|                                                          |
|  ┌────────────────────────────────────────────────────┐  |
|  │ Origin                                             │  |
|  │ ┌────────┐ ┌──────┐ ┌───────┐ ┌───────┐           │  |
|  │ │Original│ │ Game │ │ Movie │ │ Novel │           │  |
|  │ └────────┘ └──────┘ └───────┘ └───────┘           │  |
|  │ [+ Add custom...]                                  │  |
|  └────────────────────────────────────────────────────┘  |
|                                                          |
|  ┌────────────────────────────────────────────────────┐  |
|  │ Trigger Warnings                                   │  |
|  │ ┌────────┐ ┌──────┐ ┌──────┐ ┌──────────┐         │  |
|  │ │Cheating│ │ CNC  │ │ BDSM │ │ Bondage  │ ...     │  |
|  │ └────────┘ └──────┘ └──────┘ └──────────┘         │  |
|  │ [+ Add custom...]                                  │  |
|  └────────────────────────────────────────────────────┘  |
|                                                          |
|  ┌────────────────────────────────────────────────────┐  |
|  │ Custom Tags                                        │  |
|  │ [Type tag and press Enter...]                      │  |
|  │                                                    │  |
|  │ (Tags display without # prefix)                    │  |
|  └────────────────────────────────────────────────────┘  |
|                                                          |
+----------------------------------------------------------+
```

### Pill/Chip States

- **Unselected**: `bg-zinc-800 text-zinc-400 border-zinc-700`
- **Selected**: `bg-blue-500/20 text-blue-300 border-blue-500/30`
- **Hover**: Slightly lighter background

### Gallery Card SFW/NSFW Badge

- Position: Top-right corner of cover image
- NSFW: Red text (`text-rose-400`) on semi-transparent dark background
- SFW: White/gray text (`text-white/80`) on semi-transparent dark background

### ScenarioDetailModal Theme Display

Displayed between the description and existing tags section:

```text
Genre
Fictional, Reverse Harem, Enemies To Lovers

Character Types
Female, Male, Non-binary

Story Origin
Novel

Trigger Warnings
Cheating, CNC, Bondage, BDSM
```

---

## Technical Implementation Details

### Content Themes Type

```typescript
export type ContentThemes = {
  characterTypes: string[];
  storyType: 'SFW' | 'NSFW' | null;
  genres: string[];
  origin: string[];
  triggerWarnings: string[];
  customTags: string[];
};
```

### Database Migration

```sql
CREATE TABLE content_themes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id uuid REFERENCES scenarios(id) ON DELETE CASCADE UNIQUE,
  character_types text[] DEFAULT '{}',
  story_type text,
  genres text[] DEFAULT '{}',
  origin text[] DEFAULT '{}',
  trigger_warnings text[] DEFAULT '{}',
  custom_tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS policies
ALTER TABLE content_themes ENABLE ROW LEVEL SECURITY;

-- Users can manage their own scenario themes
CREATE POLICY "Users can CRUD own scenario themes"
ON content_themes FOR ALL USING (
  EXISTS (
    SELECT 1 FROM scenarios s
    WHERE s.id = content_themes.scenario_id
    AND s.user_id = auth.uid()
  )
);

-- Public can read themes for published scenarios
CREATE POLICY "Anyone can view published scenario themes"
ON content_themes FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM published_scenarios ps
    WHERE ps.scenario_id = content_themes.scenario_id
    AND ps.is_published = true
    AND ps.is_hidden = false
  )
);
```

### Auto-save Behavior

Content themes will auto-save when changes are made, following the same pattern as other scenario data in the app.

---

## Summary of Changes

| Area | Change |
|------|--------|
| Database | New `content_themes` table with RLS |
| Constants | New `content-themes.ts` with prebuilt options |
| WorldTab | Add ContentThemesSection above Share section |
| ScenarioDetailModal | Display content themes data |
| GalleryScenarioCard | Add SFW/NSFW badge |
| gallery-data.ts | Join content themes in fetch |
| supabase-data.ts | Add CRUD functions for content themes |
| Index.tsx | State management for content themes |
| types.ts | ContentThemes type definition |

