

# Fix Admin Panel: Add White Header and Match Tile Styling to Image Library

## Problem

Two issues with the current Admin Panel page:

1. **Missing white header bar** -- The admin tab is excluded from the header rendering condition on line 1341 of `Index.tsx`, so it shows no header unlike every other page.
2. **Tile styling mismatch** -- The current admin tool tiles use a square aspect ratio with a separate text section below the image. The Image Library uses 2:3 portrait tiles with a slate blue border (`#4a5f7f`), gradient overlay, title/description overlaid at the bottom, and hover-to-reveal action buttons (Edit/Open).

## Changes

### File: `src/pages/Index.tsx`

**1. Add "admin" to the header condition (line 1341)**

Add `"admin"` to the list of tabs that show the white header bar, so it renders the same `bg-white border-b border-slate-200` header as all other pages.

**2. Add header title for admin tab**

Add a `{tab === "admin" && ...}` block inside the header's left section (alongside the existing library, hub, image_library blocks) that renders:
```
ADMIN PANEL
```
Using the same `text-lg font-black text-slate-900 uppercase tracking-tight` styling as the other headers.

**3. Remove the back arrow and internal header from AdminPage**

Since the header is now provided by `Index.tsx`, the `AdminPage` component no longer needs its own header with back arrow, title, and subtitle.

### File: `src/pages/Admin.tsx`

**Restyle the tool tiles to match Image Library folder cards:**

- Use 2:3 portrait aspect ratio (`aspect-[2/3]`)
- Slate blue border (`border border-[#4a5f7f]`)
- Rounded corners (`rounded-[2rem]`)
- Gradient overlay from bottom (`bg-gradient-to-t from-slate-950 via-slate-900/20 to-transparent`)
- Title and description overlaid at the bottom of the card (white text, same font styling as Image Library folders)
- Hover-to-reveal action button overlay with an "Open" button (no Edit needed since admin tools don't need renaming)
- Hover lift effect (`group-hover:-translate-y-3 group-hover:shadow-2xl`)
- Remove the separate header section (title/subtitle/back arrow) since `Index.tsx` now provides the white header
- Use the same responsive grid as Image Library: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5`
- No skeleton/new folder cards (tools are predefined)
- Black background with padding matching the Image Library page

## Technical Details

### `src/pages/Index.tsx`

Line 1341 changes from:
```
(tab === "characters" || tab === "world" || tab === "library" || tab === "conversations" || tab === "hub" || tab === "image_library" || tab === "gallery")
```
to include `|| tab === "admin"`.

A new header title block is added after the existing gallery header block:
```tsx
{tab === "admin" && (
  <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight">
    Admin Panel
  </h1>
)}
```

### `src/pages/Admin.tsx`

The entire page layout is restructured. Remove the internal header (back arrow, title, subtitle). The hub view becomes a full-height scrollable grid matching the Image Library pattern:

```tsx
<div className="w-full h-full p-4 lg:p-10 flex flex-col overflow-y-auto">
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 lg:gap-8">
    {TOOLS.map((tool) => (
      <div key={tool.id} className="group relative cursor-pointer" onClick={() => setActiveTool(tool.id)}>
        <div className="aspect-[2/3] w-full overflow-hidden rounded-[2rem] bg-slate-200 shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)] transition-all duration-300 group-hover:-translate-y-3 group-hover:shadow-2xl border border-[#4a5f7f] relative">
          {/* Thumbnail image */}
          {/* Gradient overlay */}
          {/* Bottom text overlay with title + description */}
          {/* Hover action overlay with "Open" button */}
        </div>
      </div>
    ))}
  </div>
</div>
```

The `onBack` prop is removed from `AdminPage` since navigation is handled by the sidebar. The back button inside the `ImageGenerationTool` sub-view returns to the hub view internally.

## Files Modified

| File | Change |
|---|---|
| `src/pages/Index.tsx` | Add `"admin"` to header condition, add admin header title block |
| `src/pages/Admin.tsx` | Restyle tiles to match Image Library folders, remove internal header |
