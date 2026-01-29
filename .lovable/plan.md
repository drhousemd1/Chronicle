

# Fix Image Preview Positioning - Viewport-Centered Approach

## Problem
The current implementation positions the preview above the thumbnail, which causes it to extend off-screen when thumbnails are near the top of the viewport.

## Recommended Solution: Viewport-Centered Preview

Position the preview in the **center of the viewport** rather than relative to the thumbnail. This approach:
- Guarantees the preview is always fully visible
- Works regardless of where the thumbnail is located
- Matches patterns used by Figma, Pinterest, and Google Photos
- Creates a clean, predictable user experience

## Visual Comparison

```text
CURRENT (problematic):              PROPOSED (centered):
                                    
+------------------+                +------------------------+
|  Preview (cut off top)            |      Viewport          |
|                                   |                        |
+==================+                |  +------------------+  |
|    Viewport      |                |  |    Preview       |  |
|                  |                |  |   (centered)     |  |
|   [thumbnail]    |                |  |                  |  |
|                  |                |  +------------------+  |
+==================+                |                        |
                                    |   [thumbnail]          |
                                    +------------------------+
```

## Technical Implementation

### Updated Code in ImageLibraryTab.tsx

**Remove position tracking** (no longer needed):
```tsx
// Remove this line:
const [previewPosition, setPreviewPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

// Simplify onMouseEnter (no position calculation needed):
onMouseEnter={() => setPreviewImage(image)}
onMouseLeave={() => setPreviewImage(null)}
```

**Viewport-centered overlay**:
```tsx
{previewImage && (
  <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center p-8">
    <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-3 max-w-[500px] animate-in fade-in zoom-in-95 duration-150">
      <img
        src={previewImage.imageUrl}
        alt={previewImage.filename}
        className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
      />
      <p className="text-sm text-slate-500 text-center mt-2 truncate px-2">
        {previewImage.filename}
      </p>
    </div>
  </div>
)}
```

## Key Changes

| Aspect | Before | After |
|--------|--------|-------|
| Position | Above thumbnail (can overflow) | Centered in viewport (always visible) |
| Position state | Required for x/y tracking | Not needed (simpler code) |
| Overlay container | Transform-based positioning | Flexbox centering with `inset-0` |
| Max width | 400px | 500px (more room in center) |
| Max height | 60vh | 70vh (more vertical space) |

## Benefits

1. **Always visible** - No edge cases where preview is cut off
2. **Simpler code** - No position calculations needed
3. **Larger preview** - Can show bigger images since we're not constrained by proximity to thumbnail
4. **Consistent UX** - Preview always appears in the same place

## File to Modify

| File | Changes |
|------|---------|
| `src/components/chronicle/ImageLibraryTab.tsx` | Remove position state, simplify hover handlers, update overlay positioning |

