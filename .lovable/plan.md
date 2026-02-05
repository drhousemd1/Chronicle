

# Fix Badge Collision - Replace Text with Icon

## Summary

The badges are colliding because "Remixable" is too long. The solution is:

1. **Remove "Saved" badge** from tile display (keep save functionality working)
2. **Keep "Published" badge** as-is
3. **Replace "Remixable" text badge with just a Pencil icon** using the same purple color
4. **Rename toggle to "Allow Edits"** in the ShareScenarioModal
5. **Show Edit icon badge everywhere** the story has "allow_remix" enabled (Your Stories, Community Gallery, Saved stories)

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/chronicle/ScenarioHub.tsx` | Remove Saved badge, replace Remixable badge with Pencil icon only |
| `src/components/chronicle/GalleryScenarioCard.tsx` | Replace Remixable badge with Pencil icon only |
| `src/components/chronicle/ScenarioDetailModal.tsx` | Replace REMIXABLE badge with Pencil icon only |
| `src/components/chronicle/ShareScenarioModal.tsx` | Change "Allow Remixing" label to "Allow Edits" |

---

## Change 1: ScenarioHub.tsx - Remove "Saved" Badge + Replace "Remixable" with Icon

**Remove "Saved" badge entirely** (lines 39-43):
```tsx
// DELETE THIS BLOCK
{scen.isBookmarked && (
  <div className="px-2.5 py-1 backdrop-blur-sm rounded-lg text-xs font-bold shadow-lg bg-[#2a2a2f] text-yellow-400 uppercase tracking-wide">
    Saved
  </div>
)}
```

**Replace "Remixable" text badge with Pencil icon** (lines 51-57):
```tsx
{/* Edit icon badge - shows for stories with allow_remix enabled */}
{publishedData?.allow_remix && (
  <div className="p-1.5 backdrop-blur-sm rounded-lg shadow-lg bg-[#2a2a2f]">
    <Pencil className="w-4 h-4 text-purple-400" />
  </div>
)}
```

**Update import** - add `Pencil`, remove `Sparkles`:
```tsx
import { Eye, Heart, Bookmark, Play, Pencil } from "lucide-react";
```

---

## Change 2: GalleryScenarioCard.tsx - Replace "Remixable" with Icon

**Replace the existing Remixable badge** (lines 98-104) with just an icon:
```tsx
{/* Edit icon badge - shows for stories with allow_remix enabled */}
{published.allow_remix && (
  <div className="absolute top-4 left-4 p-1.5 backdrop-blur-sm rounded-lg shadow-lg bg-[#2a2a2f]">
    <Pencil className="w-4 h-4 text-purple-400" />
  </div>
)}
```

**Update import** - replace `Sparkles` with `Pencil`:
```tsx
import { Heart, Bookmark, Play, Pencil, Eye } from 'lucide-react';
```

---

## Change 3: ScenarioDetailModal.tsx - Replace REMIXABLE Badge with Icon

**Replace the existing Remixable badge** (lines 223-231) with icon-only:
```tsx
{/* Edit icon badge */}
{allowRemix && (
  <div className="absolute top-3 left-3">
    <span className="p-2 bg-[#2a2a2f] rounded-lg shadow-lg flex items-center justify-center">
      <Pencil className="w-4 h-4 text-purple-400" />
    </span>
  </div>
)}
```

**Update import** - add `Pencil`, can remove `Sparkles` if unused:
```tsx
import { Heart, Bookmark, Play, Pencil, Edit, Loader2, Eye, X, Globe } from 'lucide-react';
```

---

## Change 4: ShareScenarioModal.tsx - Rename Toggle to "Allow Edits"

**Update the label text** (lines 124-125):
```tsx
<Label htmlFor="allow-remix" className="text-white font-semibold cursor-pointer">
  Allow Edits
</Label>
```

**Update the description** (lines 127-129):
```tsx
<p className="text-xs text-zinc-400 mt-0.5">
  Others can clone and edit their own copy
</p>
```

**Update the permissions list item** (line 148):
```tsx
{allowRemix && <li className="text-purple-300">Clone and edit their own version</li>}
```

---

## Visual Result

**Before (colliding):**
```text
[Published] [✦ Remixable]    [SFW]
```

**After (no collision):**
```text
[Published] [✏️]              [SFW]
```

The Pencil icon in a small charcoal pill takes up minimal horizontal space and clearly indicates editability.

---

## Badge Visibility Summary

| Scenario State | What Badge Shows |
|---------------|------------------|
| User's own story, published, edits enabled | `[Published] [✏️]` + `[SFW/NSFW]` |
| User's own story, published, edits disabled | `[Published]` + `[SFW/NSFW]` |
| Saved story with edits enabled | `[✏️]` + `[SFW/NSFW]` |
| Saved story without edits | `[SFW/NSFW]` only |
| Gallery story with edits enabled | `[✏️]` + `[SFW/NSFW]` |
| Gallery story without edits | `[SFW/NSFW]` only |

