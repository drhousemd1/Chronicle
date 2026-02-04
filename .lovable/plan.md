

# Add View Count Tracking and Display

## Overview

Currently, there is no `view_count` column in the database - the detail modal uses an Eye icon but displays `play_count`. To properly track views separately from plays, we need to add a new column and tracking mechanism.

---

## Current State Analysis

| Field | In Database | Displayed on Card | Displayed in Modal |
|-------|-------------|-------------------|-------------------|
| `like_count` | ✅ | ✅ Heart | ✅ Heart |
| `save_count` | ✅ | ✅ Bookmark | ✅ Bookmark |
| `play_count` | ✅ | ✅ Play (just added) | ❌ Missing |
| `view_count` | ❌ Missing | ❌ | ✅ Eye (shows play_count) |

The modal currently shows `playCount` with an Eye icon, which is misleading.

---

## Changes Required

### 1. Database Migration

Add `view_count` column to `published_scenarios` table:

```sql
ALTER TABLE published_scenarios 
ADD COLUMN view_count integer DEFAULT 0 NOT NULL;

-- Create increment function
CREATE OR REPLACE FUNCTION increment_view_count(published_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE published_scenarios 
  SET view_count = view_count + 1 
  WHERE id = published_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### 2. Update gallery-data.ts

| Change | Details |
|--------|---------|
| Add `view_count` to interface | Add field to `PublishedScenario` type |
| Add to fetch queries | Include in SELECT statements |
| Add `incrementViewCount()` | New function to increment view count |

---

### 3. Update GalleryScenarioCard.tsx

Add Eye icon with view count to the stats display at the bottom:

```tsx
<span className="flex items-center gap-1">
  <Eye className="w-3 h-3" />
  {published.view_count}
</span>
```

Import the `Eye` icon from lucide-react.

---

### 4. Update ScenarioDetailModal.tsx

Add play count to the stats row alongside view count:

```tsx
{/* Stats Row */}
<div className="flex items-center gap-4 text-sm text-white/60 mb-4">
  <span className="flex items-center gap-1.5">
    <Eye className="w-4 h-4" />
    {viewCount.toLocaleString()}
  </span>
  <span className="flex items-center gap-1.5">
    <Heart className="w-4 h-4" />
    {likeCount.toLocaleString()}
  </span>
  <span className="flex items-center gap-1.5">
    <Bookmark className="w-4 h-4" />
    {saveCount.toLocaleString()}
  </span>
  <span className="flex items-center gap-1.5">
    <Play className="w-4 h-4" />
    {playCount.toLocaleString()}
  </span>
</div>
```

Add `viewCount` prop to the component interface.

---

### 5. Update GalleryHub.tsx

Increment view count when opening the detail modal.

---

## Files to Modify

| File | Changes |
|------|---------|
| Database | Add `view_count` column and increment function |
| `src/services/gallery-data.ts` | Add view_count to types, queries, and add increment function |
| `src/components/chronicle/GalleryScenarioCard.tsx` | Add Eye icon with view_count to card footer |
| `src/components/chronicle/ScenarioDetailModal.tsx` | Add viewCount prop and Play stat to stats row |
| `src/components/chronicle/GalleryHub.tsx` | Increment view count on modal open, pass viewCount prop |

---

## Visual Result

**Card Footer (4 stats):**
- 👁 [view count]
- ❤️ [like count]
- 🔖 [save count]
- ▶️ [play count]

**Detail Modal Stats (4 stats):**
- 👁 [view count]
- ❤️ [like count]
- 🔖 [save count]
- ▶️ [play count]

