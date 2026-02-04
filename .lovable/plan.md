
# Fix "Remove from Gallery" Button & Badge Styling

## Overview

Two issues need to be fixed:

1. **"Remove from Gallery" button not appearing when viewing your own stories from the Community Gallery** - The button logic exists but the props aren't being passed from `GalleryHub.tsx`

2. **SFW/NSFW badge styling mismatch** - The modal uses a different style than the gallery cards

---

## Issue 1: Add "Remove from Gallery" to GalleryHub

### Root Cause

In `GalleryHub.tsx`, the `ScenarioDetailModal` is rendered without these required props:
- `isOwned` (not passed → defaults to false)
- `isPublished` (not passed → defaults to false)
- `onUnpublish` (not passed → undefined)

The button only shows when all three are truthy.

### Solution

**File:** `src/components/chronicle/GalleryHub.tsx`

1. **Add unpublish handler function** (after `handleViewDetails`):
```tsx
const handleUnpublish = async () => {
  if (!selectedPublished || !user) return;
  try {
    await unpublishScenario(selectedPublished.scenario_id);
    // Remove from local list
    setScenarios(prev => prev.filter(s => s.id !== selectedPublished.id));
    setDetailModalOpen(false);
    toast.success('Your story has been removed from the Gallery');
  } catch (e) {
    console.error('Failed to unpublish:', e);
    toast.error('Failed to remove from gallery');
  }
};
```

2. **Add `unpublishScenario` to imports** (line 14):
```tsx
import { 
  // ... existing imports
  unpublishScenario
} from '@/services/gallery-data';
```

3. **Update ScenarioDetailModal props** (lines 425-447):

Add these three new props:
```tsx
<ScenarioDetailModal
  // ... existing props
  isOwned={user?.id === selectedPublished.publisher_id}
  isPublished={true}  // All stories in gallery are published
  onUnpublish={user?.id === selectedPublished.publisher_id ? handleUnpublish : undefined}
/>
```

---

## Issue 2: Fix SFW/NSFW Badge Styling

### Current (Wrong)

**Modal (lines 206-217 of ScenarioDetailModal.tsx):**
```tsx
<span className={cn(
  "px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg",
  contentThemes.storyType === 'NSFW'
    ? "bg-red-500/90 text-white"     // ❌ Solid red bg, white text
    : "bg-blue-500/90 text-white"    // ❌ Solid blue bg, white text
)}>
```

### Correct (Matches Gallery Cards)

**From GalleryScenarioCard.tsx (lines 88-92):**
```tsx
<div className={cn(
  "... bg-[#2a2a2f]",
  published.contentThemes.storyType === 'NSFW'
    ? "text-red-400"    // ✅ Dark bg, red text
    : "text-blue-400"   // ✅ Dark bg, blue text
)}>
```

### Fix Required

**File:** `src/components/chronicle/ScenarioDetailModal.tsx` (lines 206-217)

Change to:
```tsx
{contentThemes?.storyType && (
  <div className="absolute top-3 right-3">
    <span className={cn(
      "px-2.5 py-1 backdrop-blur-sm rounded-lg text-xs font-bold shadow-lg bg-[#2a2a2f]",
      contentThemes.storyType === 'NSFW'
        ? "text-red-400"
        : "text-blue-400"
    )}>
      {contentThemes.storyType}
    </span>
  </div>
)}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/chronicle/GalleryHub.tsx` | Add `unpublishScenario` import, add `handleUnpublish` function, pass `isOwned`, `isPublished`, `onUnpublish` props to modal |
| `src/components/chronicle/ScenarioDetailModal.tsx` | Update SFW/NSFW badge styling to match gallery cards (dark bg + colored text) |

---

## Visual Reference

### Badge Styling (After Fix)

Both gallery cards AND modal will show:
- **NSFW**: Dark charcoal background (`#2a2a2f`) with red text (`text-red-400`)
- **SFW**: Dark charcoal background (`#2a2a2f`) with blue text (`text-blue-400`)

### "Remove from Gallery" Behavior (After Fix)

| Viewing From | Your Own Story | Someone Else's Story |
|--------------|----------------|----------------------|
| Your Stories page | ✅ Shows button | N/A |
| Community Gallery | ✅ Shows button | ❌ No button |
