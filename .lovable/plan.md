

# Fix: Bookmarked Stories Not Appearing in "Your Stories" Tab

## Problem Identified

When a user bookmarks a story in the Community Gallery:
1. The save IS written to the `saved_scenarios` table in the database
2. The Gallery's local UI updates correctly (bookmark icon fills in)
3. **BUT** the "Your Stories" page's `savedScenarios` state is NOT refreshed
4. The "Bookmarked" filter shows nothing until you reload the page

## Root Cause

The `GalleryHub` component handles saves internally but has no way to notify `Index.tsx` that a save occurred. The `savedScenarios` state is only fetched once on initial page load (line 169).

```typescript
// Current: GalleryHub only has onPlay callback
<GalleryHub onPlay={handleGalleryPlay} />

// Missing: No callback for when saves happen
```

---

## Solution

Add an `onSaveChange` callback to `GalleryHub` that triggers whenever a user bookmarks or unbookmarks a story. Index.tsx will use this to refresh its `savedScenarios` state.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/chronicle/GalleryHub.tsx` | Add `onSaveChange` prop, call it after save/unsave operations |
| `src/pages/Index.tsx` | Pass callback to GalleryHub that refreshes savedScenarios |

---

## Technical Changes

### 1. GalleryHub.tsx - Add callback prop

Update the interface and component:

```typescript
interface GalleryHubProps {
  onPlay: (scenarioId: string, publishedScenarioId: string) => void;
  onSaveChange?: () => void;  // New callback
}

export const GalleryHub: React.FC<GalleryHubProps> = ({ onPlay, onSaveChange }) => {
  // ... existing code ...

  const handleSave = async (published: PublishedScenario) => {
    // ... existing save logic ...
    
    try {
      if (isSaved) {
        await unsaveScenario(published.id, user.id);
        // ... existing UI updates ...
        toast.success('Removed from your collection');
      } else {
        await saveScenarioToCollection(published.id, published.scenario_id, user.id);
        // ... existing UI updates ...
        toast.success('Saved to your stories!');
      }
      
      // Notify parent that saves changed
      onSaveChange?.();
      
    } catch (error) {
      // ... error handling ...
    }
  };
```

### 2. Index.tsx - Pass refresh callback

```typescript
// Add a handler to refresh saved scenarios
const handleGallerySaveChange = useCallback(async () => {
  if (!user) return;
  try {
    const savedScens = await fetchSavedScenarios(user.id);
    setSavedScenarios(savedScens);
  } catch (e) {
    console.error('Failed to refresh saved scenarios:', e);
  }
}, [user]);

// Update GalleryHub usage
<GalleryHub 
  onPlay={handleGalleryPlay} 
  onSaveChange={handleGallerySaveChange}
/>
```

---

## Data Flow After Fix

```
User clicks Bookmark in Gallery
         ↓
GalleryHub.handleSave()
         ↓
Save written to saved_scenarios table
         ↓
GalleryHub local UI updates (icon fills)
         ↓
onSaveChange() callback fires  ← NEW
         ↓
Index.tsx refetches savedScenarios
         ↓
filteredRegistry updates
         ↓
Bookmarked tab now shows the story
```

---

## Result

After this fix:
- Bookmarking a story in the Community Gallery will immediately appear in the "Bookmarked" filter
- Unbookmarking will immediately remove it from the "Bookmarked" filter
- No page refresh required
- Both save and unsave actions trigger the refresh

