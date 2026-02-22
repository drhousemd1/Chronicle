

# Fix Hover Effect + Add Aspect Ratio with Icon to Image Thumbnails

---

## What You'll Notice After This

- Image thumbnails lift up when hovered, matching the rest of the app
- Below the title in the gray footer, a new line shows "Aspect Ratio:" followed by a small shape icon (tall rectangle, wide rectangle, or square) and the ratio text (e.g. "3:4", "16:9")
- The icon visually communicates the shape so users don't need to interpret the numbers

---

## 1. Fix hover lift effect

The outer div has `group-hover:-translate-y-2` but it IS the `group` element, so it can't trigger off itself. Change to `hover:-translate-y-2 hover:shadow-lg`.

**File:** `src/components/chronicle/ImageLibraryTab.tsx` (line 620)

---

## 2. Detect aspect ratios from loaded images

Add a `useState<Map>` to store detected aspect ratios keyed by image ID. When `folderImages` changes, load each image URL in a browser `Image()` object, read `naturalWidth`/`naturalHeight`, and match to the closest standard ratio from this list:

- 1:1, 9:16, 2:3, 3:4, 4:5, 16:9, 3:2, 4:3, 5:4, 3:5, 7:9, 9:7, 5:3

The matching picks whichever standard ratio has the smallest absolute difference from the actual width/height ratio.

---

## 3. Add aspect ratio icon + label to gray footer

Extend the gray footer bar to show a second line:

```
Image Title Here
[icon] 3:4
```

The icon is a small inline SVG -- a simple rounded rectangle whose proportions reflect the orientation:
- **Portrait** (taller than wide): a tall narrow rounded rect
- **Landscape** (wider than tall): a short wide rounded rect  
- **Square**: a square rounded rect

Styled subtly: `text-[10px] text-zinc-400` for the ratio text, icon in `text-zinc-400` at ~12px.

---

## Technical Details

### File: `src/components/chronicle/ImageLibraryTab.tsx`

1. **Line 620:** Change `group-hover:-translate-y-2` to `hover:-translate-y-2`

2. **New constant** (top of file or inside component):
   ```typescript
   const STANDARD_RATIOS = [
     { w: 1, h: 1, label: '1:1' },
     { w: 9, h: 16, label: '9:16' },
     { w: 2, h: 3, label: '2:3' },
     { w: 3, h: 4, label: '3:4' },
     { w: 4, h: 5, label: '4:5' },
     { w: 3, h: 5, label: '3:5' },
     { w: 7, h: 9, label: '7:9' },
     { w: 16, h: 9, label: '16:9' },
     { w: 3, h: 2, label: '3:2' },
     { w: 4, h: 3, label: '4:3' },
     { w: 5, h: 4, label: '5:4' },
     { w: 5, h: 3, label: '5:3' },
     { w: 9, h: 7, label: '9:7' },
   ];
   ```

3. **New state + useEffect:**
   - `const [aspectRatios, setAspectRatios] = useState<Record<string, { label: string; orientation: 'portrait' | 'landscape' | 'square' }>>({})`
   - `useEffect` iterates `folderImages`, creates `new Image()` for each, on load computes ratio and finds closest match, batches updates into state

4. **New inline component** `AspectRatioIcon`:
   - Takes `orientation` prop
   - Renders a 12x12 SVG with a rounded rect sized to match:
     - Portrait: rect ~6x10
     - Landscape: rect ~10x6
     - Square: rect ~9x9
   - Stroke color: `currentColor` (inherits `text-zinc-400`)

5. **Gray footer bar** (lines 667-670): Add a second row below the title:
   ```tsx
   <div className="flex items-center gap-1.5 mt-1">
     <AspectRatioIcon orientation={ratioInfo.orientation} />
     <span className="text-[10px] text-zinc-400">{ratioInfo.label}</span>
   </div>
   ```

