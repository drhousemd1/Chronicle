

# Remove Unauthorized Gradient Overlays from Story/Content Cards

## Problem
A `bg-gradient-to-t from-zinc-800 via-slate-900/60 to-transparent` overlay was added to regular story/content cards at some point without instruction. This creates a dark gradient rising from the bottom of every card. Only placeholder cards (New Story, New Folder, No Cover) should have gradient backgrounds — regular cards should not.

## Cards to Fix (REMOVE gradient overlay)
8 locations across 7 files where the unauthorized gradient overlay exists on regular content cards:

| File | Line | Context |
|------|------|---------|
| `StoryHub.tsx` | 78 | My Stories cards |
| `GalleryStoryCard.tsx` | 84 | Community Gallery cards |
| `CreatorProfile.tsx` | 301 | Creator profile story cards |
| `PublicProfileTab.tsx` | 478 | Public profile story cards |
| `CharactersTab.tsx` | 600 | Character avatar cards |
| `ImageLibraryTab.tsx` | 476 | Image library folder cards |
| `ImageLibraryPickerModal.tsx` | 173 | Image picker cards |
| `Admin.tsx` | 157 | Admin tool cards |

## Placeholder Cards (KEEP as-is)
These use `bg-gradient-to-br from-zinc-800 to-zinc-900` as a background fill (not an overlay) and are correct:
- `StoryHub.tsx` line 263 — "New Story" dashed placeholder
- `ImageLibraryTab.tsx` line 537 — "New Folder" dashed placeholder
- `WorldTab.tsx` line 561 — "No Cover" dashed placeholder

## Plan
Delete the gradient overlay `<div>` element entirely from each of the 8 locations listed above. These are standalone `<div className="absolute inset-0 bg-gradient-to-t ...">` elements that serve no structural purpose beyond the visual effect.

## Files Modified
- `src/components/chronicle/StoryHub.tsx`
- `src/components/chronicle/GalleryStoryCard.tsx`
- `src/pages/CreatorProfile.tsx`
- `src/components/account/PublicProfileTab.tsx`
- `src/components/chronicle/CharactersTab.tsx`
- `src/components/chronicle/ImageLibraryTab.tsx`
- `src/components/chronicle/ImageLibraryPickerModal.tsx`
- `src/pages/Admin.tsx`

