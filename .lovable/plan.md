

# Update ScenarioDetailModal Styling

## Overview

This plan updates the `ScenarioDetailModal` popup to match the HTML mockup styling while preserving all existing data bindings and functionality. The changes are purely visual/layout - no data mapping changes needed.

---

## Key Styling Changes from Mockup

| Element | Current | Updated (from mockup) |
|---------|---------|----------------------|
| Modal background | `#1a1a1f` | `#121214` |
| Modal border radius | `rounded-3xl` | `rounded-[32px]` |
| Left column width | `w-64` (256px) | `w-[420px]` |
| Image aspect ratio | `aspect-[2/3]` | `aspect-[3/4]` |
| SFW/NSFW badge | On right side info | Overlay on cover image (top-right) |
| Action buttons | Stacked vertically | Horizontal row with equal widths |
| Button text | "Like", "Save", "Play Story" | "Like", "Bookmark", "Play" |
| Stats display | Separate row below title | Inline with title (same line) |
| Publisher "by" line | Card with avatar | Simple "by Username" text under title |
| Content themes | Single box with all fields | Grid layout (Genre, Character Types, Story Origin) + separate Trigger Warnings row |
| Characters section | Icon + "Characters" header | Uppercase label + "VIEW ALL" link |

---

## Changes Required

### File: `src/components/chronicle/ScenarioDetailModal.tsx`

### 1. Update Modal Container Styling

```tsx
// Change from:
className="relative w-full max-w-4xl max-h-[90vh] bg-[#1a1a1f] rounded-3xl shadow-2xl ring-1 ring-white/10 overflow-hidden flex flex-col"

// Change to:
className="relative w-full max-w-6xl max-h-[90vh] bg-[#121214] rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden flex flex-col md:flex-row"
```

### 2. Restructure Left Column

- Width: `md:w-[420px]`
- Image aspect ratio: `aspect-[3/4]`
- Add SFW/NSFW badge overlay on image
- Add gradient overlay on image
- Action buttons in horizontal row (flex gap-2)

### 3. Update Action Buttons

**Non-owned (gallery) mode:**
```tsx
<div className="flex gap-2">
  {/* Like button */}
  <button className="flex-1 h-12 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-center gap-2">
    <Heart className="w-5 h-5" />
    <span className="text-sm font-semibold">Like</span>
  </button>
  
  {/* Bookmark button */}
  <button className="flex-1 h-12 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-center gap-2">
    <Bookmark className="w-5 h-5" />
    <span className="text-sm font-semibold">Bookmark</span>
  </button>
  
  {/* Play button */}
  <button className="flex-1 h-12 bg-[#3b82f6] hover:bg-[#2563eb] rounded-xl flex items-center justify-center gap-2 shadow-md">
    <Play className="w-5 h-5 fill-current" />
    <span className="text-sm font-semibold">Play</span>
  </button>
</div>
```

### 4. Update Right Column Header

**Title with inline stats:**
```tsx
<div className="flex items-start justify-between mb-2">
  <div className="flex flex-col gap-1">
    {/* Title + Stats on same line */}
    <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight flex items-center gap-4">
      {title || "Untitled Story"}
      {!isOwned && (
        <div className="flex items-center gap-4 ml-4">
          <div className="flex items-center gap-1.5 text-[#94a3b8]">
            <Eye className="w-4 h-4" />
            <span className="text-xs font-bold">{formatCount(viewCount)}</span>
          </div>
          {/* ... likes, saves, plays */}
        </div>
      )}
    </h1>
    
    {/* Publisher "by" line */}
    {publisher && !isOwned && (
      <div className="flex items-center gap-2 mt-1">
        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 overflow-hidden">
          {publisher.avatar_url && <img src={publisher.avatar_url} ... />}
        </div>
        <p className="text-sm text-[#94a3b8]">
          by <span className="text-white font-medium">{publisher.username || 'Anonymous'}</span>
        </p>
      </div>
    )}
  </div>
</div>
```

### 5. Update Synopsis Section

```tsx
<div className="mt-6">
  <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">Synopsis</h3>
  <p className="text-[#e2e8f0] leading-relaxed max-w-2xl">
    {description || "No description provided."}
  </p>
</div>
```

### 6. Update Content Themes to Grid Layout

Replace the current box-based layout with a grid:

```tsx
{/* Metadata Grid - Genre, Character Types, Story Origin */}
<div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-8">
  {contentThemes?.genres.length > 0 && (
    <div>
      <h4 className="text-[10px] font-bold text-white/40 uppercase mb-2">Genre</h4>
      <p className="text-sm text-white">{contentThemes.genres.join(', ')}</p>
    </div>
  )}
  {contentThemes?.characterTypes.length > 0 && (
    <div>
      <h4 className="text-[10px] font-bold text-white/40 uppercase mb-2">Character Types</h4>
      <p className="text-sm text-white">{contentThemes.characterTypes.join(', ')}</p>
    </div>
  )}
  {contentThemes?.origin.length > 0 && (
    <div>
      <h4 className="text-[10px] font-bold text-white/40 uppercase mb-2">Story Origin</h4>
      <p className="text-sm text-white">{contentThemes.origin.join(', ')}</p>
    </div>
  )}
</div>

{/* Trigger Warnings - Separate Row */}
{contentThemes?.triggerWarnings.length > 0 && (
  <div className="mt-6">
    <h4 className="text-[10px] font-bold text-white/40 uppercase mb-2">Trigger Warnings</h4>
    <p className="text-sm text-red-400 leading-relaxed font-medium">
      {contentThemes.triggerWarnings.join(', ')}
    </p>
  </div>
)}
```

### 7. Update Characters Section

```tsx
<div className="mt-auto pt-8 border-t border-white/5">
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest">Characters</h3>
    {characters.length > 4 && (
      <button className="text-[10px] font-bold text-[#3b82f6] hover:underline uppercase">
        View All
      </button>
    )}
  </div>
  
  <div className="flex flex-wrap gap-4">
    {characters.map((char) => (
      <div key={char.id} className="flex flex-col items-center gap-2 group cursor-pointer">
        <div className="w-14 h-14 rounded-full border-2 border-white/10 p-0.5 group-hover:border-[#3b82f6] transition-all">
          {char.avatarUrl ? (
            <img src={char.avatarUrl} className="w-full h-full rounded-full object-cover" alt={char.name} />
          ) : (
            <div className="w-full h-full rounded-full bg-[#2a2a2f] flex items-center justify-center text-white/30">
              {char.name.charAt(0)}
            </div>
          )}
        </div>
        <span className="text-[10px] text-white/60 group-hover:text-white">{char.name}</span>
      </div>
    ))}
  </div>
</div>
```

### 8. Add Helper Function for Count Formatting

```tsx
// Add at top of component
const formatCount = (count: number): string => {
  if (count >= 1000) {
    return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return count.toString();
};
```

### 9. Remove Close Button from Right Side

Move close button styling:
- Keep absolute position but adjust for new layout
- Use `text-white/20 hover:text-white` styling

---

## Layout Visual Summary

```text
+------------------------------------------+----------------------------------------+
| LEFT COLUMN (420px)                      | RIGHT COLUMN (flex-1)                  |
|                                          |                                        |
| +--------------------------------------+ | Title          👁 2.4k ❤️ 1.2k 🔖 850 ▶️ 4.5k  [X] |
| |                                      | | by Xaden Riorson                      |
| |         Cover Image                  | |                                        |
| |         (3:4 aspect)                 | | SYNOPSIS                               |
| |                                      | | Description text...                    |
| |                          [SFW]       | |                                        |
| |          ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓       | | GENRE        CHARACTER TYPES    ORIGIN |
| +--------------------------------------+ | Epic Fantasy  Dragon Rider...   Original |
|                                          |                                        |
| +----------+ +----------+ +--------+   | TRIGGER WARNINGS                       |
| |   Like   | | Bookmark | |  Play  |   | Violence, Explicit Content...          |
| +----------+ +----------+ +--------+   |                                        |
|                                          | ─────────────────────────────────────  |
|                                          | CHARACTERS                 VIEW ALL   |
|                                          | (avatar) (avatar) (avatar) (avatar)   |
+------------------------------------------+----------------------------------------+
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/chronicle/ScenarioDetailModal.tsx` | Update layout, styling, and element positioning |

---

## What Stays the Same

- All data bindings (title, description, contentThemes, characters, etc.)
- All interaction handlers (handleLike, handleSave, handlePlay, handleEdit, handleUnpublish)
- All conditional rendering logic (isOwned, isPublished, etc.)
- Character fetching logic
- Loading states and skeletons

This is a **styling-only update** - no changes to data flow or functionality.

