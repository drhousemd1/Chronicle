

# Fix "Like" Button Text Toggle

## Problem
The "Save" button correctly toggles between "Save" and "Saved", but the "Like" button always shows "Like" regardless of state. It should show "Liked" when active.

## Change — `src/components/chronicle/StoryDetailModal.tsx`, line 357

**Current:**
```
Like
```

**New:**
```
{isLiked ? 'Liked' : 'Like'}
```

One word change in one file. All other button labels are correct.

