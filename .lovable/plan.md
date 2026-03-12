

# Change Dashed Borders to Slate Blue

Two targeted changes based on the screenshots:

## 1. Cover Image "No Cover" placeholder (Image 1)
**File: `src/components/chronicle/WorldTab.tsx`** — line 563
- `border-2 border-dashed border-zinc-600` → `border-2 border-dashed border-[#4a5f7f]`

## 2. "Add/Create Main Character" and "Add/Create Side Character" placeholders (Image 2)
**File: `src/components/chronicle/WorldTab.tsx`** — lines 455, 458
- Outer dashed border: `border-2 border-dashed border-zinc-600 hover:border-zinc-500` → `border-2 border-dashed border-[#4a5f7f] hover:border-[#5a7a9f]`
- Inner icon box: `border-2 border-dashed border-zinc-600` → `border-2 border-dashed border-[#4a5f7f]`
- The `group-hover/add:border-zinc-400` on the inner icon box → `group-hover/add:border-[#5a7a9f]`

**Scope**: Only the WorldTab character placeholders and cover image placeholder. The other dashed borders (StoryHub "New Story", CharactersTab avatar placeholder, ImageLibrary folder) are not in scope per the user's screenshots.

