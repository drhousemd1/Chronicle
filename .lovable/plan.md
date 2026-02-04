

# Social Sharing & Discovery System - Complete Implementation Plan

## Overview

This plan implements a community-driven story sharing and discovery system, allowing users to publish their scenarios to a public gallery, discover others' work, and optionally remix scenarios for personal use.

---

## Database Architecture

### New Tables Required

#### 1. `published_scenarios` - Public Gallery Listings
```sql
CREATE TABLE public.published_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  publisher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Publishing Options
  allow_remix BOOLEAN NOT NULL DEFAULT false,  -- Can others clone and edit?
  
  -- Discovery Tags
  tags TEXT[] NOT NULL DEFAULT '{}',
  
  -- Engagement Metrics
  like_count INTEGER NOT NULL DEFAULT 0,
  save_count INTEGER NOT NULL DEFAULT 0,
  play_count INTEGER NOT NULL DEFAULT 0,
  
  -- Status
  is_published BOOLEAN NOT NULL DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(scenario_id)  -- A scenario can only be published once
);
```

#### 2. `scenario_likes` - Like Tracking
```sql
CREATE TABLE public.scenario_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  published_scenario_id UUID NOT NULL REFERENCES published_scenarios(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(published_scenario_id, user_id)  -- One like per user per scenario
);
```

#### 3. `saved_scenarios` - User's Saved Stories
```sql
CREATE TABLE public.saved_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  published_scenario_id UUID NOT NULL REFERENCES published_scenarios(id) ON DELETE CASCADE,
  
  -- Tracking
  source_scenario_id UUID NOT NULL,  -- Original scenario ID for reference
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, published_scenario_id)  -- Can only save once
);
```

#### 4. `remixed_scenarios` - Tracking Remixes (Analytics)
```sql
CREATE TABLE public.remixed_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_published_id UUID NOT NULL REFERENCES published_scenarios(id) ON DELETE SET NULL,
  remixed_scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  remixer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

### Row-Level Security Policies

#### `published_scenarios`
```sql
-- Anyone authenticated can view published scenarios
CREATE POLICY "Anyone can view published scenarios"
  ON published_scenarios FOR SELECT
  TO authenticated
  USING (is_published = true);

-- Only publisher can insert/update/delete their own
CREATE POLICY "Publishers can manage own publications"
  ON published_scenarios FOR ALL
  TO authenticated
  USING (publisher_id = auth.uid())
  WITH CHECK (publisher_id = auth.uid());
```

#### `scenario_likes`
```sql
-- Users can view all likes (for count display)
CREATE POLICY "Anyone can view likes"
  ON scenario_likes FOR SELECT TO authenticated USING (true);

-- Users can only manage their own likes
CREATE POLICY "Users manage own likes"
  ON scenario_likes FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

#### `saved_scenarios`
```sql
-- Users can only see their own saves
CREATE POLICY "Users view own saves"
  ON saved_scenarios FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can only manage their own saves
CREATE POLICY "Users manage own saves"
  ON saved_scenarios FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

---

## Frontend Architecture

### New Files to Create

| File | Purpose |
|------|---------|
| `src/pages/Gallery.tsx` | Public gallery page with search and filtering |
| `src/components/chronicle/GalleryHub.tsx` | Gallery grid display component |
| `src/components/chronicle/GalleryScenarioCard.tsx` | Card for gallery scenarios with like/save buttons |
| `src/components/chronicle/ShareScenarioModal.tsx` | Modal for publishing with options |
| `src/components/chronicle/TagInput.tsx` | Tag entry component for publishing |
| `src/services/gallery-data.ts` | Supabase queries for gallery operations |

### Modified Files

| File | Changes |
|------|---------|
| `src/App.tsx` | Add `/gallery` route |
| `src/pages/Index.tsx` | Add navigation to gallery, handle saved scenarios display |
| `src/components/chronicle/WorldTab.tsx` | Add Share button below World Codex |
| `src/components/chronicle/ScenarioHub.tsx` | Differentiate saved scenarios visually |
| `src/types.ts` | Add new type definitions |

---

## User Flows

### Flow 1: Publishing a Scenario

```
User in Scenario Builder
         │
         ▼
   Click "Share" button (below World Codex)
         │
         ▼
   ShareScenarioModal opens
         │
         ├── Toggle: "Allow Remix" (on/off)
         │      └── When ON: Others can clone and edit
         │      └── When OFF: Others can only play
         │
         ├── Tag Input: Add searchable tags
         │      └── e.g., "fantasy", "romance", "mystery"
         │
         └── Click "Publish to Gallery"
                  │
                  ▼
         Scenario appears in public Gallery
```

### Flow 2: Discovering & Saving

```
User visits /gallery
         │
         ▼
   Search by tags or browse
         │
         ▼
   Hover over scenario card
         │
         ├── ❤ Like (increment like_count)
         │
         ├── ★ Save to My Stories
         │      └── Creates entry in saved_scenarios
         │      └── Appears on user's hub with visual indicator
         │
         └── ▶ Play (opens chat, read-only scenario data)
```

### Flow 3: Saved Scenario in Hub

```
User's "Your Stories" hub
         │
         ├── Own scenarios: [Edit] [Play]
         │
         └── Saved scenarios (visual indicator):
                  │
                  ├── If allow_remix = false: [Play only]
                  │
                  └── If allow_remix = true: [Edit] [Play]
                           │
                           └── Edit creates a REMIX:
                                 - Deep clones all data
                                 - New scenario ID
                                 - Links to original via remixed_scenarios
                                 - User now owns the clone
```

---

## Visual Differentiation for Saved Scenarios

### Approach: Gradient Accent Overlay

For saved/imported scenarios on the hub, apply:

1. **Gradient highlight behind title** - A subtle purple/magenta gradient bar
2. **"Saved" badge** - Small badge in corner
3. **Creator attribution** - "By @username" under title

```tsx
// Example styling for saved scenario cards
<div className="relative">
  {isSaved && (
    <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-purple-900/60 via-purple-800/30 to-transparent pointer-events-none" />
  )}
  <div className="absolute top-4 left-4 px-2 py-1 bg-purple-500/80 rounded-lg text-xs font-bold text-white">
    SAVED
  </div>
  {/* ... rest of card */}
  {isSaved && (
    <p className="text-xs text-purple-300">By {creatorUsername}</p>
  )}
</div>
```

---

## Technical Implementation Details

### 1. Share Button in WorldTab.tsx

Add after World Codex section (around line 870):

```tsx
{/* Share Section */}
<section>
  <div className="w-full bg-[#2a2a2f] rounded-[24px] border border-white/10 overflow-hidden shadow-lg">
    <div className="bg-[#4a5f7f] border-b border-white/20 px-6 py-4 flex items-center gap-3 shadow-lg">
      <ShareIcon className="text-white" />
      <h2 className="text-white text-xl font-bold tracking-tight">Share Your Story</h2>
    </div>
    <div className="p-6">
      <div className="p-6 bg-[#3a3a3f]/30 rounded-2xl border border-white/5">
        <HintBox hints={[
          "Publish to the gallery for others to discover.",
          "Choose whether others can remix or play-only.",
          "Add tags so players can find your story."
        ]} />
        <div className="mt-4">
          <Button 
            onClick={() => setShowShareModal(true)}
            className="w-full premium-button"
          >
            Publish to Gallery
          </Button>
        </div>
      </div>
    </div>
  </div>
</section>
```

### 2. Gallery Data Service

```typescript
// src/services/gallery-data.ts

export async function fetchPublishedScenarios(
  searchTags?: string[],
  limit = 50,
  offset = 0
) {
  let query = supabase
    .from('published_scenarios')
    .select(`
      id,
      scenario_id,
      publisher_id,
      allow_remix,
      tags,
      like_count,
      save_count,
      play_count,
      created_at,
      scenarios!inner (
        id,
        title,
        description,
        cover_image_url,
        cover_image_position,
        world_core
      ),
      profiles!published_scenarios_publisher_id_fkey (
        username,
        avatar_url
      )
    `)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (searchTags?.length) {
    query = query.overlaps('tags', searchTags);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function publishScenario(
  scenarioId: string,
  publisherId: string,
  allowRemix: boolean,
  tags: string[]
) {
  const { data, error } = await supabase
    .from('published_scenarios')
    .upsert({
      scenario_id: scenarioId,
      publisher_id: publisherId,
      allow_remix: allowRemix,
      tags,
      is_published: true
    }, { onConflict: 'scenario_id' })
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

export async function toggleLike(
  publishedScenarioId: string,
  userId: string
) {
  // Check if already liked
  const { data: existing } = await supabase
    .from('scenario_likes')
    .select('id')
    .eq('published_scenario_id', publishedScenarioId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    // Unlike
    await supabase
      .from('scenario_likes')
      .delete()
      .eq('id', existing.id);
    
    // Decrement count
    await supabase.rpc('decrement_like_count', { 
      published_id: publishedScenarioId 
    });
    
    return false; // Now unliked
  } else {
    // Like
    await supabase
      .from('scenario_likes')
      .insert({
        published_scenario_id: publishedScenarioId,
        user_id: userId
      });
    
    // Increment count
    await supabase.rpc('increment_like_count', { 
      published_id: publishedScenarioId 
    });
    
    return true; // Now liked
  }
}

export async function saveScenario(
  publishedScenarioId: string,
  sourceScenarioId: string,
  userId: string
) {
  const { error } = await supabase
    .from('saved_scenarios')
    .insert({
      user_id: userId,
      published_scenario_id: publishedScenarioId,
      source_scenario_id: sourceScenarioId
    });
    
  if (error) throw error;
  
  // Increment save count
  await supabase.rpc('increment_save_count', { 
    published_id: publishedScenarioId 
  });
}

export async function remixScenario(
  publishedScenarioId: string,
  userId: string
) {
  // 1. Fetch the original scenario's full data
  const { data: published } = await supabase
    .from('published_scenarios')
    .select('scenario_id, allow_remix')
    .eq('id', publishedScenarioId)
    .single();
    
  if (!published?.allow_remix) {
    throw new Error('This scenario does not allow remixing');
  }
  
  // 2. Fetch full scenario data including characters, scenes, codex
  const originalData = await fetchScenarioById(published.scenario_id);
  
  // 3. Create a new scenario with cloned data but new IDs
  const newScenarioId = crypto.randomUUID();
  // ... deep clone logic with new IDs
  
  // 4. Save to user's account
  await saveScenario(newScenarioId, clonedData, metadata, userId);
  
  // 5. Track the remix
  await supabase
    .from('remixed_scenarios')
    .insert({
      original_published_id: publishedScenarioId,
      remixed_scenario_id: newScenarioId,
      remixer_id: userId
    });
    
  return newScenarioId;
}
```

### 3. Database Functions for Atomic Counter Updates

```sql
-- Increment like count atomically
CREATE OR REPLACE FUNCTION increment_like_count(published_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE published_scenarios 
  SET like_count = like_count + 1, updated_at = now()
  WHERE id = published_id;
END;
$$;

-- Decrement like count atomically  
CREATE OR REPLACE FUNCTION decrement_like_count(published_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE published_scenarios 
  SET like_count = GREATEST(0, like_count - 1), updated_at = now()
  WHERE id = published_id;
END;
$$;

-- Similar functions for save_count and play_count
```

---

## Additional Considerations (Not Mentioned But Critical)

### 1. Content Moderation
- Add `reported_count` and `is_hidden` columns to `published_scenarios`
- Future: Add report functionality for inappropriate content

### 2. Unpublish Capability
- Users should be able to unpublish their scenarios (set `is_published = false`)
- This removes from gallery but doesn't delete saved references

### 3. Creator Attribution
- Display creator's username on saved/gallery cards
- Link to their profile (future feature)

### 4. Deep Clone for Remix
When remixing, must clone:
- `scenarios` row (new ID, new user_id)
- All `characters` (new IDs)
- All `codex_entries` (new IDs)
- All `scenes` (new IDs, copy storage files)
- Opening dialog and world core

### 5. Saved Scenario Permissions
- Saved scenarios should NOT create a local copy initially
- They reference the original scenario data
- Only when playing, it creates a conversation linked to original scenario
- This preserves storage and allows updates from original creator

### 6. Updates from Original Creator
- When a saved scenario's source is updated, users see the latest version
- Remix creates a point-in-time copy that doesn't update

### 7. Gallery Pagination
- Implement infinite scroll or pagination for large galleries
- Use `range()` in Supabase queries

### 8. Search Performance
- Consider adding a GIN index on `published_scenarios.tags` for fast array searches
```sql
CREATE INDEX idx_published_scenarios_tags ON published_scenarios USING GIN (tags);
```

---

## Implementation Order

1. **Database Migration** - Create all tables, RLS policies, and functions
2. **Types & Service Layer** - Add TypeScript types and gallery-data.ts
3. **Gallery Page** - Create /gallery route and GalleryHub component
4. **Share Modal** - Add ShareScenarioModal to WorldTab
5. **Gallery Cards** - Create GalleryScenarioCard with like/save/play buttons
6. **Hub Integration** - Modify ScenarioHub to show saved scenarios with visual indicator
7. **Play Flow** - Handle play-only vs remix permissions
8. **Remix Flow** - Implement deep clone and new scenario creation

---

## Summary of Files

### New Files (8)
- `src/pages/Gallery.tsx`
- `src/components/chronicle/GalleryHub.tsx`
- `src/components/chronicle/GalleryScenarioCard.tsx`
- `src/components/chronicle/ShareScenarioModal.tsx`
- `src/components/chronicle/TagInput.tsx`
- `src/services/gallery-data.ts`
- Database migration file (4 tables + RLS + functions)

### Modified Files (5)
- `src/App.tsx` - Add gallery route
- `src/pages/Index.tsx` - Fetch saved scenarios, navigation
- `src/components/chronicle/WorldTab.tsx` - Add Share section
- `src/components/chronicle/ScenarioHub.tsx` - Visual indicators for saved
- `src/types.ts` - New types

