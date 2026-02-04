

# ScenarioDetailModal Updates: Remove Old Tags, Relocate Buttons, Add Scrolling

## Overview

This plan addresses 4 issues with the ScenarioDetailModal:
1. Remove the old `tags` display (legacy system) from the modal
2. Make the modal scrollable for long content
3. Move Like/Save/Play buttons under the cover image on the left
4. Add "Remove from Gallery" button for owners of published stories

---

## Analysis

### Issue 1: Old Tags Still Displaying

Looking at the code:
- **ScenarioDetailModal.tsx lines 349-361**: The modal displays `tags` prop which comes from the old `published_scenarios.tags` column
- **GalleryHub.tsx line 299**: Passes `tags={selectedPublished.tags}` to the modal
- **ScenarioHub.tsx line 203**: Passes `tags={selectedScenario.tags || []}` to the modal

The new tag system uses `content_themes` table with `customTags`, `genres`, `characterTypes`, etc. - which is already being displayed correctly in the Content Themes block.

**Solution**: Remove the old tags display from the modal. The `tags` prop can remain for backwards compatibility but won't be rendered. Note: We could also consider dropping the `tags` column from `published_scenarios` table but that's a separate migration.

### Issue 2: Modal Scrolling

The modal already has a `ScrollArea` component wrapping the content (line 184), but we should ensure it properly handles overflow with many characters or long descriptions.

### Issue 3: Button Placement

Currently the Like/Save/Play buttons are at the bottom of the info section (lines 363-439). Per the user's screenshot and request, they should be moved under the cover image on the left side.

### Issue 4: Remove from Gallery Button

The modal already has `onUnpublish` prop and displays the "Remove from Gallery" button for owned scenarios (lines 383-396), but it's inside the isOwned block with Edit/Play buttons. The user wants this button under the action buttons (Like/Save/Play) after they're moved to the left.

---

## Changes Required

### File: `src/components/chronicle/ScenarioDetailModal.tsx`

**1. Remove Old Tags Display (lines 349-361)**

Delete this entire block:
```tsx
{/* Tags */}
{tags.length > 0 && (
  <div className="flex flex-wrap gap-2 mb-6">
    {tags.map((tag) => (
      <span
        key={tag}
        className="px-3 py-1 bg-white/10 rounded-full text-xs text-white/80 font-medium"
      >
        #{tag}
      </span>
    ))}
  </div>
)}
```

**2. Restructure Layout for Button Placement**

Current layout:
```text
+------------------+---------------------+
| Cover Image      | Badges              |
|                  | Title               |
|                  | Stats               |
|                  | Publisher Info      |
|                  | Description         |
|                  | Content Themes      |
|                  | [Old Tags] <- REMOVE|
|                  | [Like][Save][Play]  |
+------------------+---------------------+
| Characters                             |
+----------------------------------------+
```

New layout:
```text
+------------------+---------------------+
| Cover Image      | Badges              |
|                  | Title               |
| [Like][Save]     | Stats               |
| [Play Story]     | Publisher Info      |
| [Remove from     | Description         |
|  Gallery]*       | Content Themes      |
+------------------+---------------------+
| Characters                             |
+----------------------------------------+
* Only shows for owners of published scenarios
```

**3. Move Action Buttons Under Cover Image**

- Move the action buttons div (lines 363-439) from the info section (right side) to below the cover image (left side)
- Keep the conditional logic for isOwned vs. gallery mode
- Add the "Remove from Gallery" button after Like/Save/Play for gallery mode scenarios that the user owns

**4. For Gallery Mode (non-owned scenarios)**

After the cover image, add:
```tsx
{/* Action Buttons - Under Cover */}
<div className="flex flex-wrap gap-2 mt-4">
  {onLike && (
    <button onClick={handleLike} className="...">
      <Heart /> Like
    </button>
  )}
  {onSave && (
    <button onClick={handleSave} className="...">
      <Bookmark /> Save  
    </button>
  )}
  <button onClick={handlePlay} className="...">
    <Play /> Play Story
  </button>
</div>
```

**5. For Owner Mode (isOwned scenarios)**

After the cover image, add:
```tsx
{/* Action Buttons - Under Cover */}
<div className="flex flex-wrap gap-2 mt-4">
  {onEdit && (
    <button onClick={handleEdit} className="...">
      <Edit /> Edit Story
    </button>
  )}
  <button onClick={handlePlay} className="...">
    <Play /> Play Story
  </button>
  {isPublished && onUnpublish && (
    <button onClick={handleUnpublish} className="...">
      <Globe /> Remove from Gallery
    </button>
  )}
</div>
```

---

## Updated Modal Layout Code Structure

```tsx
<div className="flex flex-col md:flex-row gap-6 md:gap-8">
  {/* Left Column: Cover Image + Action Buttons */}
  <div className="w-full md:w-64 flex-shrink-0">
    {/* Cover Image */}
    <div className="aspect-[2/3] w-full overflow-hidden rounded-2xl ...">
      ...
    </div>
    
    {/* Action Buttons - Moved here */}
    <div className="flex flex-wrap gap-2 mt-4">
      {isOwned ? (
        <>
          {/* Edit + Play + Remove from Gallery */}
        </>
      ) : (
        <>
          {/* Like + Save + Play */}
        </>
      )}
    </div>
  </div>

  {/* Right Column: Info Section */}
  <div className="flex-1 min-w-0">
    {/* Badges, Title, Stats, Publisher, Description, Content Themes */}
    {/* NO action buttons here anymore */}
    {/* NO old tags here anymore */}
  </div>
</div>
```

---

## Button Styling Updates

For the buttons under the cover image, use a stacked vertical layout on mobile and horizontal on larger screens:

```tsx
<div className="flex flex-col gap-2 mt-4">
  {/* Like button (if not owned) */}
  <button className="w-full px-4 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 ...">
    <Heart className="w-4 h-4" /> Like
  </button>
  
  {/* Save button (if not owned) */}
  <button className="w-full px-4 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 ...">
    <Bookmark className="w-4 h-4" /> Save
  </button>
  
  {/* Play Story button */}
  <button className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 ...">
    <Play className="w-4 h-4 fill-current" /> Play Story
  </button>
  
  {/* Remove from Gallery (for owner of published story) */}
  {isOwned && isPublished && onUnpublish && (
    <button className="w-full px-4 py-2.5 bg-[#2a2a2f] border border-white/10 text-white/70 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:text-white ...">
      <Globe className="w-4 h-4" /> Remove from Gallery
    </button>
  )}
</div>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/chronicle/ScenarioDetailModal.tsx` | Remove old tags block, restructure layout to move action buttons under cover image, add Remove from Gallery button for owners |

---

## Visual Summary

### Before (Current)
```text
+-------------------------+-----------------------------+
| [Cover Image 2:3]       | NSFW  REMIXABLE             |
|                         | Test Story                  |
|                         | 👁 14  ❤️ 0  🔖 0  ▶️ 1      |
|                         | Anonymous - Feb 3, 2026     |
|                         | Description...              |
|                         | Content Themes Box          |
|                         | #4th wing  <- OLD TAGS      |
|                         | [Like][Save][Play Story]    |
+-------------------------+-----------------------------+
| Characters: (avatar) (avatar)                        |
+------------------------------------------------------+
```

### After (Updated)
```text
+-------------------------+-----------------------------+
| [Cover Image 2:3]       | NSFW  REMIXABLE             |
|                         | Test Story                  |
| [Like] [Save]           | 👁 14  ❤️ 0  🔖 0  ▶️ 1      |
| [Play Story]            | Anonymous - Feb 3, 2026     |
| [Remove from Gallery]*  | Description...              |
|                         | Content Themes Box          |
+-------------------------+-----------------------------+
| Characters: (avatar) (avatar)                        |
+------------------------------------------------------+
* Only shows if user owns the published story
```

---

## Notes

- The modal already has `ScrollArea` wrapping the content for scrollability
- The `tags` prop will remain in the interface for backwards compatibility but won't be rendered
- Button widths will be `w-full` to fit nicely under the 256px cover image
- The "Remove from Gallery" button uses the same premium shadow surface styling as other UI elements

