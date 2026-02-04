

# Add "Remove From Gallery" for Story Owners

## Overview

The modal already has the UI and handler for "Remove from Gallery" (lines 294-308 in ScenarioDetailModal.tsx), but GalleryHub.tsx is not passing the required props to enable it. We need to:
1. Detect if the logged-in user is the owner (publisher) of the story
2. Pass the `isOwned`, `isPublished`, and `onUnpublish` props to the modal
3. Implement the unpublish handler to remove the story from the gallery

---

## Analysis

### What Already Exists

| Component | What's in place |
|-----------|----------------|
| `ScenarioDetailModal` | Has `isOwned`, `isPublished`, `onUnpublish` props (lines 54-59) |
| `ScenarioDetailModal` | Has "Remove from Gallery" button UI (lines 294-308) that shows when `isOwned && isPublished && onUnpublish` |
| `gallery-data.ts` | Has `unpublishScenario(scenarioId)` function (lines 252-260) |
| `PublishedScenario` type | Has `publisher_id` field (line 19) |

### What's Missing

| Location | What's needed |
|----------|--------------|
| `GalleryHub.tsx` | Check if `user?.id === selectedPublished.publisher_id` |
| `GalleryHub.tsx` | Pass `isOwned`, `isPublished`, `onUnpublish` to modal |
| `GalleryHub.tsx` | Implement `handleUnpublish` that calls `unpublishScenario` and removes from list |

---

## Changes Required

### File: `src/components/chronicle/GalleryHub.tsx`

### 1. Add unpublishScenario to imports

```tsx
import { 
  // ... existing imports
  unpublishScenario  // ADD THIS
} from '@/services/gallery-data';
```

### 2. Add handleUnpublish function

Add after the `handleViewDetails` function (around line 212):

```tsx
const handleUnpublish = async (published: PublishedScenario) => {
  if (!user) return;
  
  try {
    await unpublishScenario(published.scenario_id);
    // Remove from local list
    setScenarios(prev => prev.filter(s => s.id !== published.id));
    // Close the modal
    setDetailModalOpen(false);
    setSelectedPublished(null);
    toast.success('Story removed from gallery');
  } catch (error) {
    console.error('Failed to unpublish:', error);
    toast.error('Failed to remove from gallery');
  }
};
```

### 3. Update ScenarioDetailModal props

Update the modal (around lines 422-449) to pass ownership props:

```tsx
{selectedPublished && (
  <TooltipProvider>
    <ScenarioDetailModal
      open={detailModalOpen}
      onOpenChange={setDetailModalOpen}
      scenarioId={selectedPublished.scenario_id}
      title={selectedPublished.scenario?.title || "Untitled"}
      description={selectedPublished.scenario?.description || ""}
      coverImage={selectedPublished.scenario?.cover_image_url || ""}
      coverImagePosition={selectedPublished.scenario?.cover_image_position || { x: 50, y: 50 }}
      tags={selectedPublished.tags}
      contentThemes={selectedPublished.contentThemes}
      likeCount={selectedPublished.like_count}
      saveCount={selectedPublished.save_count}
      playCount={selectedPublished.play_count}
      viewCount={selectedPublished.view_count}
      publisher={selectedPublished.publisher}
      publishedAt={selectedPublished.created_at}
      isLiked={likes.has(selectedPublished.id)}
      isSaved={saves.has(selectedPublished.id)}
      allowRemix={selectedPublished.allow_remix}
      onLike={() => handleLike(selectedPublished)}
      onSave={() => handleSave(selectedPublished)}
      onPlay={() => handlePlay(selectedPublished)}
      // ADD THESE THREE PROPS:
      isOwned={user?.id === selectedPublished.publisher_id}
      isPublished={selectedPublished.is_published}
      onUnpublish={() => handleUnpublish(selectedPublished)}
    />
  </TooltipProvider>
)}
```

---

## How It Works

1. When user clicks on a story card, `handleViewDetails` opens the modal with `selectedPublished`
2. GalleryHub checks if `user?.id === selectedPublished.publisher_id`
3. If true, `isOwned=true` is passed to the modal
4. Modal shows the "Remove from Gallery" button (already exists at lines 294-308)
5. User clicks button → `handleUnpublish` is called → `unpublishScenario(scenario_id)` sets `is_published: false`
6. Story is removed from local state and disappears from gallery
7. Story remains in "Your Stories" page (it's just unpublished, not deleted)

---

## Visual Result

When you (the owner) view your own published story in the gallery modal, you will see:

```text
+------------------------------------------+----------------------------------------+
| LEFT COLUMN                              | RIGHT COLUMN                           |
|                                          |                                        |
| [Cover Image]                            | Test story  👁 29 ...                  |
|                                          | by Anonymous                           |
|                                          |                                        |
| [Edit] [Play]                            | SYNOPSIS                               |
|                                          | ...                                    |
| [Remove from Gallery]  ← THIS BUTTON     |                                        |
|                                          |                                        |
+------------------------------------------+----------------------------------------+
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/chronicle/GalleryHub.tsx` | Add `unpublishScenario` import, `handleUnpublish` function, pass `isOwned`/`isPublished`/`onUnpublish` to modal |

No changes needed to:
- `ScenarioDetailModal.tsx` - already has the button UI and handler
- `gallery-data.ts` - already has `unpublishScenario` function

This is a minimal change that connects existing functionality.

