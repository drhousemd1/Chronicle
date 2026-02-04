
# Remove "Discover Stories" Header Bar

## Overview

Remove the steel blue header bar containing "Discover Stories" text from the Community Gallery search section.

---

## File to Modify

| File | Changes |
|------|---------|
| `src/components/chronicle/GalleryHub.tsx` | Delete the blue header bar div (lines 171-174) |

---

## Detailed Changes

### Remove Steel Blue Header Bar (lines 171-174)

**Current:**
```tsx
<div className="bg-[#2a2a2f] border-b border-white/10">
  {/* Steel blue header bar */}
  <div className="bg-[#4a5f7f] px-6 py-4">
    <h2 className="text-white text-xl font-bold tracking-tight text-center">Discover Stories</h2>
  </div>
  
  {/* Content area */}
  <div className="p-6">
```

**Updated:**
```tsx
<div className="bg-[#2a2a2f] border-b border-white/10">
  {/* Content area */}
  <div className="p-6">
```

Simply delete lines 171-174 (the comment and the entire `<div className="bg-[#4a5f7f]...">` block with the h2 inside).

---

## Result

The search header will display just the dark charcoal container with the search bar and sort filter toggle - no title bar above it.
