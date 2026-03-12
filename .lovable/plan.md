

# Update Style Guide: Story Card Panel Entry

## What Changed
The "Story Card" `PanelCardV2` entry (lines 3739-3782 in `StyleGuideTool.tsx`) currently documents the old unauthorized gradient overlay (`from-zinc-800 via-slate-900/60 to-transparent`). It needs to be updated to reflect the corrected flat dark overlay (`bg-black/40`).

## Changes

### 1. Update existing "Story Card" PanelCardV2 (Story Builder section, ~line 3739)

**Metadata updates:**
- `background`: Change from `"gradient overlay: from-zinc-800 via-slate-900/60 to-transparent"` → `"flat overlay: bg-black/40 (uniform 40% black, no gradient)"`
- `locations`: Update to `"StoryHub.tsx, GalleryStoryCard.tsx, CreatorProfile.tsx, PublicProfileTab.tsx, CharactersTab.tsx, ImageLibraryTab.tsx"`
- `purpose`: Clarify: `"Card for stories across My Stories, Gallery, Creator Profile, and Account pages. Aspect 2/3. Flat dark overlay ensures text readability over cover images."`
- Add `notes`: `"Overlay is a uniform bg-black/40 — NOT a gradient. Placeholder cards (New Story, New Folder) use bg-gradient-to-br for background fill, which is different."`

**Preview update:**
- Replace line 3755 (`bg-gradient-to-t from-zinc-800 via-slate-900/60 to-transparent opacity-90`) with `bg-black/40 pointer-events-none` to match the actual implementation.

### Files Modified
- `src/components/admin/styleguide/StyleGuideTool.tsx` — one existing PanelCardV2 entry updated (no new entries needed since this card already exists)

