

# Image Preview on Hover - Implementation Plan

## Current State
The image grid in `ImageLibraryTab.tsx` uses square thumbnails (`aspect-square`) with `object-cover` which crops images to fit uniformly. This looks clean but hides parts of non-square images.

## Proposed Solution: Floating Preview Overlay

After analyzing common patterns, I recommend a **floating preview overlay** approach rather than enlarging the tile itself. Here's why:

### Why Not Enlarge the Tile?
- Enlarging tiles would disrupt the grid layout and push other images around
- Variable-sized tiles would create a jarring, unpredictable experience
- It would be hard to maintain the star/delete buttons in consistent positions

### Recommended Approach: Hover Preview Overlay

When hovering over a thumbnail:
1. Keep the grid tile exactly as it is (square, cropped)
2. Show a floating preview **above/beside** the thumbnail showing the full uncropped image
3. The preview appears with a smooth fade-in animation
4. The preview is sized to show the image at a reasonable scale (max 400-500px) while maintaining aspect ratio

### Visual Design

```text
+------------------+
|  Preview Panel   |  <-- Appears on hover, shows full image
|  (full aspect)   |
|                  |
|  [filename.jpg]  |
+------------------+
        |
        v
   +---------+
   | Cropped |  <-- Original grid thumbnail
   | Square  |
   +---------+
```

### Technical Implementation

1. **Add state for hovered image**: Track which image is being hovered
2. **Create preview overlay component**: A fixed/absolute positioned element that shows the full image
3. **Position intelligently**: Show preview above/below the thumbnail based on available viewport space
4. **Smooth transitions**: Use Tailwind transitions for fade-in/scale effect

### Code Changes (ImageLibraryTab.tsx)

**New State**:
```tsx
const [previewImage, setPreviewImage] = useState<LibraryImage | null>(null);
const [previewPosition, setPreviewPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
```

**Updated Image Grid Item**:
```tsx
<div
  key={image.id}
  className="group relative aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm hover:shadow-lg transition-all cursor-pointer"
  onMouseEnter={(e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPreviewImage(image);
    setPreviewPosition({
      x: rect.left + rect.width / 2,
      y: rect.top
    });
  }}
  onMouseLeave={() => setPreviewImage(null)}
>
  {/* existing thumbnail content */}
</div>
```

**Preview Overlay Component**:
```tsx
{previewImage && (
  <div 
    className="fixed z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full"
    style={{ left: previewPosition.x, top: previewPosition.y - 8 }}
  >
    <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-2 max-w-[400px] animate-in fade-in zoom-in-95 duration-150">
      <img
        src={previewImage.imageUrl}
        alt={previewImage.filename}
        className="w-full h-auto max-h-[60vh] object-contain rounded-lg"
      />
      <p className="text-xs text-slate-500 text-center mt-2 truncate px-2">
        {previewImage.filename}
      </p>
    </div>
  </div>
)}
```

### Alternative Approach: Click to Open Lightbox

If you prefer a click-based interaction instead:
- Clicking an image opens a full-screen lightbox/modal
- User can see the image at full resolution
- Navigate between images with arrow keys or swipe
- This is more mobile-friendly but requires an extra click

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/chronicle/ImageLibraryTab.tsx` | Add hover state, position tracking, and preview overlay |

## Summary

The floating preview approach gives users a quick way to see the full uncropped image without disrupting the grid layout. It's lightweight (no extra components or modals), feels responsive, and matches modern image gallery patterns seen in apps like Pinterest and Figma.

