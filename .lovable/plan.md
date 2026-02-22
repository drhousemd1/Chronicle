

# Remove Black Hover Overlay from Image Library Thumbnails

## The Problem

There's a semi-transparent black overlay (`bg-black/30`) on line 703 of `ImageLibraryTab.tsx` that appears when hovering over image thumbnails. This overlay doesn't scale with the image zoom, creating a visible misaligned dark box. No other tiles in the app use this overlay.

## The Fix

**File:** `src/components/chronicle/ImageLibraryTab.tsx`

Remove line 703 (the hover overlay div):
```tsx
{/* Hover overlay */}
<div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
```

This leaves only the image zoom effect on hover, matching the behavior of all other tiles in the app.

