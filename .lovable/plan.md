

# Restore Flat Dark Overlay on Story/Content Cards

## Problem
The cards previously had a subtle, uniform dark overlay across the entire card that made white text readable against cover images. This was removed along with the unauthorized gradient. It needs to be restored as a **flat overlay** (not a gradient).

## Solution
Add a single `div` with `bg-black/40` (uniform 40% black, no gradient) to each card, positioned after the cover image and before badges/actions. This matches what the user confirmed — "slightly dark everywhere."

```tsx
<div className="absolute inset-0 bg-black/40 pointer-events-none" />
```

## 6 Locations to Update

| File | Card type |
|------|-----------|
| `StoryHub.tsx` ~line 77 | My Stories cards |
| `GalleryStoryCard.tsx` ~line 82 | Community Gallery cards |
| `CreatorProfile.tsx` | Creator profile story cards |
| `PublicProfileTab.tsx` | Public profile story cards |
| `CharactersTab.tsx` | Character avatar cards |
| `ImageLibraryTab.tsx` | Image folder cards |

Insert after the cover image `<img>` / fallback `<div>` block and before badges/hover actions.

**Not touched**: Placeholder cards ("New Story", "New Folder") keep their existing `bg-gradient-to-br` background fill.

