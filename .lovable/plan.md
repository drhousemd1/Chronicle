

# Fix Preview Overlay Interaction Issues

## Problem
The viewport-centered preview overlay uses `pointer-events-none` on the full-viewport container (`inset-0`). While this should allow clicks to pass through, there are two issues:
1. The overlay visually obscures the thumbnails and their action buttons (star, delete)
2. Users expect to interact with buttons they can see on the thumbnail, but they're blocked by the preview

## Solution Options Considered

| Approach | Pros | Cons |
|----------|------|------|
| **Click-based lightbox** | Clean UX, no hover conflicts | Requires extra click to preview |
| **Smart positioning (avoid overlap)** | Keeps hover preview | Complex positioning logic |
| **Delayed hover preview** | Allows quick clicks | Doesn't solve core overlap issue |
| **Side panel preview** | Never overlaps thumbnails | Takes up layout space |

## Recommended Solution: Click-Based Lightbox

Replace the hover preview with a **click-to-open lightbox**. This is the most robust approach because:
- Users can freely interact with star/delete buttons without interference
- Click is an intentional action - no accidental previews
- Matches common image gallery patterns (Google Photos, iCloud, Dropbox)
- Mobile-friendly (no hover on touch devices anyway)

### User Flow
1. User sees thumbnail grid with hover overlays showing star/delete buttons
2. User can click star or delete buttons freely
3. **Clicking the image itself** opens a centered lightbox showing the full image
4. Click outside the lightbox or press Escape to close

### Technical Changes

**State Management**:
- Rename `previewImage` to `lightboxImage` for clarity
- Add keyboard handler for Escape key to close

**Thumbnail Grid Item**:
- Remove `onMouseEnter`/`onMouseLeave` handlers
- Add `onClick` on the image itself (not the buttons) to open lightbox
- Keep existing hover overlay and buttons as-is

**Lightbox Overlay**:
- Use `pointer-events-auto` (interactive, not pass-through)
- Add semi-transparent backdrop
- Click backdrop to close
- Add close button (X) in corner

### Code Changes

**Updated image grid item** (lines 581-622):
```tsx
<div
  key={image.id}
  className="group relative aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm hover:shadow-lg transition-all"
>
  {/* Clickable image to open lightbox */}
  <img
    src={image.imageUrl}
    alt={image.filename}
    className="w-full h-full object-cover cursor-pointer"
    onClick={() => setLightboxImage(image)}
  />

  {/* Hover overlay - unchanged */}
  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

  {/* Star button - unchanged (already has higher z-index via stacking) */}
  <button ... />
  
  {/* Delete button - unchanged */}
  <button ... />
</div>
```

**Updated lightbox overlay** (lines 636-650):
```tsx
{lightboxImage && (
  <div 
    className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/60"
    onClick={() => setLightboxImage(null)}
  >
    <div 
      className="relative bg-white rounded-xl shadow-2xl border border-slate-200 p-3 max-w-[600px] animate-in fade-in zoom-in-95 duration-150"
      onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
    >
      {/* Close button */}
      <button
        onClick={() => setLightboxImage(null)}
        className="absolute -top-3 -right-3 p-2 bg-white rounded-full shadow-lg hover:bg-slate-100 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
      
      <img
        src={lightboxImage.imageUrl}
        alt={lightboxImage.filename}
        className="w-full h-auto max-h-[75vh] object-contain rounded-lg"
      />
      <p className="text-sm text-slate-500 text-center mt-3 truncate px-2">
        {lightboxImage.filename}
      </p>
    </div>
  </div>
)}
```

**Add Escape key handler**:
```tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && lightboxImage) {
      setLightboxImage(null);
    }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [lightboxImage]);
```

**Add X icon import**:
```tsx
import { ..., X } from 'lucide-react';
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/chronicle/ImageLibraryTab.tsx` | Replace hover preview with click-based lightbox |

## Summary

This change converts the hover preview to a click-based lightbox, which:
- Eliminates all interaction conflicts with star/delete buttons
- Provides a cleaner, more intentional preview experience
- Includes proper close mechanisms (click outside, X button, Escape key)
- Works on mobile devices (where hover doesn't exist)

