
# Scenario Detail Modal - Full Preview Before Playing

## Overview

Create a new "Scenario Detail Modal" that opens when clicking anywhere on a scenario tile (except action buttons). This modal shows the full story details, author information, engagement stats, and character portraits - giving users a complete preview before deciding to play, edit, or save a story.

## Current Behavior Problem

Currently, clicking on a tile card triggers `onPlay` immediately, taking users directly to the chat interface. Users cannot:
- Read the full description (truncated with `...` on cards)
- See all the characters in the story
- Get detailed information before committing to play

## Proposed Solution

### 1. New Scenario Detail Modal Component

Create `src/components/chronicle/ScenarioDetailModal.tsx` - a full-featured modal displaying:

**Layout (inspired by the reference screenshot):**
```
┌──────────────────────────────────────────────────────────────────┐
│  [X Close]                                                       │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────────┐    Story Title                             │
│   │                 │    ──────────────────                      │
│   │   Cover Image   │    [Play Count] [Save Count] [Like Count]  │
│   │     (Large)     │                                            │
│   │                 │    ┌──────────────────────────────────┐    │
│   │                 │    │ Creator: @username   [Follow*]   │    │
│   │                 │    │ Published: Jan 15, 2026          │    │
│   └─────────────────┘    └──────────────────────────────────┘    │
│                                                                  │
│        Full description text goes here. This is the complete     │
│        description that was previously truncated on the card.    │
│        Users can now read the entire story premise without...    │
│                                                                  │
│        ┌─────┐ ┌─────┐ ┌─────────┐ ┌─────────┐                   │
│        │#tag1│ │#tag2│ │#fantasy│ │#romance │ (All Tags)        │
│        └─────┘ └─────┘ └─────────┘ └─────────┘                   │
│                                                                  │
│        [❤ Like]  [🔖 Save]  [▶ Play Story]                       │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│   CHARACTERS                                                     │
│   ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                           │
│   │      │ │      │ │      │ │      │                           │
│   │Avatar│ │Avatar│ │Avatar│ │Avatar│                           │
│   │      │ │      │ │      │ │      │                           │
│   └──────┘ └──────┘ └──────┘ └──────┘                           │
│    Name     Name     Name     Name                               │
└──────────────────────────────────────────────────────────────────┘

* Follow button disabled - shows "Follow" but links to future profile page
```

### 2. Data Requirements

**For Gallery/Community scenarios (PublishedScenario):**
- Already have: title, description, cover image, tags, like/save/play counts, publisher info
- Need to fetch: characters from the scenario (using the RLS policy we just updated)

**For Your Stories/Bookmarked scenarios (ScenarioMetadata):**
- Already have: title, description, cover image, tags
- Need to fetch: characters from the scenario
- For bookmarked: also get publisher info from savedScenario data

### 3. Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/chronicle/ScenarioDetailModal.tsx` | **Create** | New modal component with full scenario preview |
| `src/services/gallery-data.ts` | **Modify** | Add `fetchScenarioCharacters()` function to fetch character avatars |
| `src/components/chronicle/GalleryScenarioCard.tsx` | **Modify** | Change card click to open detail modal instead of playing |
| `src/components/chronicle/GalleryHub.tsx` | **Modify** | Add state for detail modal, pass onViewDetails handler |
| `src/components/chronicle/ScenarioHub.tsx` | **Modify** | Add detail modal support for Your Stories cards |
| `src/pages/Index.tsx` | **Modify** | Handle detail modal state for the main hub |

---

## Technical Implementation Details

### ScenarioDetailModal Props

```typescript
interface ScenarioDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  
  // Core scenario data
  scenarioId: string;
  title: string;
  description: string;
  coverImage: string;
  coverImagePosition: { x: number; y: number };
  tags: string[];
  
  // Stats (for published scenarios)
  likeCount?: number;
  saveCount?: number;
  playCount?: number;
  
  // Publisher info
  publisher?: {
    username: string | null;
    avatar_url: string | null;
  };
  publishedAt?: string;
  
  // Interaction state
  isLiked?: boolean;
  isSaved?: boolean;
  allowRemix?: boolean;
  
  // Actions
  onLike?: () => void;
  onSave?: () => void;
  onPlay: () => void;
  onEdit?: () => void;
  
  // Display mode
  isOwned?: boolean; // Shows Edit button instead of Like/Save
}
```

### Character Fetching

Add to `gallery-data.ts`:
```typescript
export async function fetchScenarioCharacters(scenarioId: string): Promise<{
  id: string;
  name: string;
  avatarUrl: string;
  avatarPosition: { x: number; y: number };
}[]> {
  const { data, error } = await supabase
    .from('characters')
    .select('id, name, avatar_url, avatar_position')
    .eq('scenario_id', scenarioId);
    
  if (error) throw error;
  
  return (data || []).map(char => ({
    id: char.id,
    name: char.name,
    avatarUrl: char.avatar_url || '',
    avatarPosition: (char.avatar_position as { x: number; y: number }) || { x: 50, y: 50 }
  }));
}
```

### Card Click Behavior Changes

**GalleryScenarioCard.tsx changes:**
```typescript
// Change the outer div onClick
<div 
  className="group relative cursor-pointer"
  onClick={onViewDetails}  // <-- Changed from onPlay
>
  // ... existing content ...
  
  // The Play button still calls onPlay directly
  <button onClick={handlePlay}>Play</button>
</div>
```

**ScenarioHub.tsx ScenarioCard changes:**
```typescript
// Same pattern - card click opens details, buttons still work
<div className="group relative cursor-pointer" onClick={() => onViewDetails(scen.id)}>
  // Edit/Play buttons still have stopPropagation and call their handlers
</div>
```

### Modal Design Elements

The modal will use:
- `Dialog` from `@/components/ui/dialog` (existing component)
- `ScrollArea` for content overflow
- Dark gradient header similar to card design
- Character avatar grid at bottom
- Consistent styling with the app's design system

### Visual Styling

- Modal max-width: `max-w-3xl` (768px)
- Cover image: Left side, portrait orientation, similar to reference
- Dark mode ready (uses existing Tailwind classes)
- Rounded corners matching app aesthetic
- Character avatars: 64x64px rounded circles in a horizontal scroll

---

## User Experience Flow

**Gallery/Bookmarked Scenarios:**
1. User clicks on scenario tile (not on action button)
2. Detail modal opens, fetches character data in background
3. User sees full description, all tags, author info
4. User sees character avatar thumbnails at bottom
5. User can Like, Save, or Play from the modal
6. Clicking Play closes modal and starts the story

**Your Stories (Owned):**
1. User clicks on scenario tile (not on Edit/Play buttons)
2. Detail modal opens (no like/save buttons, shows Edit instead)
3. User sees their full story details
4. User can Edit or Play from the modal

---

## Security Considerations

- Character data fetching uses existing RLS policies (updated in previous fix)
- No new database changes required
- Published scenario characters are already viewable via the policy update

---

## Edge Cases

| Scenario | Handling |
|----------|----------|
| No cover image | Show large initial letter (same as cards) |
| No characters | Show "No characters yet" message |
| No description | Show "No description provided" |
| No tags | Hide tag section |
| Loading characters | Show skeleton/spinner in character section |
| Click action button | stopPropagation prevents modal open, action fires directly |

---

## Future Enhancement: Follow Button

The modal includes a "Follow" button placeholder next to the author name. This button will be disabled/greyed out with a tooltip saying "Coming soon" since the user profile system is not yet implemented. This sets up the UX pattern for future work.
