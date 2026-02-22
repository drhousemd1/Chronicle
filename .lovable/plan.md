

# Add Drag-to-Resize for Images in Guide Editor

## What This Does
Adds resize handles (small corner squares) to images inside the Guide Editor's contentEditable area. When you click an image, handles appear; dragging a corner resizes the image proportionally. The new size persists in the markdown via the `width` attribute on the `<img>` tag.

## How It Works

1. **Click-to-select**: Add a `click` event listener on the editor div that detects clicks on `<img>` elements. When an image is clicked, overlay 4 small resize handles (corner squares) positioned absolutely around the image.

2. **Drag-to-resize**: On `mousedown` of a handle, track `mousemove` to calculate the new width based on drag delta. Constrain to maintain aspect ratio. Apply the new width directly to the `img.style.width`. Minimum width: 50px. Maximum width: editor container width.

3. **Deselect**: Clicking anywhere else in the editor (not on the image or handles) removes the handles.

4. **Persist size**: After resize ends (`mouseup`), trigger `handleInput()` which runs turndown on the HTML. Turndown will capture the `width` style. Add a custom turndown rule to preserve image width as an HTML `<img>` tag in the markdown output (since standard markdown `![](url)` has no width support).

5. **Touch support**: Include `touchstart`/`touchmove`/`touchend` on handles for iPad usage per project conventions.

## Technical Details

**Single file changed**: `src/components/admin/guide/GuideEditor.tsx`

**Changes:**
- Add a `selectedImage` ref to track the currently selected image element
- Add a `useEffect` that attaches a delegated click listener to the editor div for image selection
- Create `showResizeHandles(img)` and `removeResizeHandles()` helper functions that add/remove absolutely-positioned corner divs
- Each handle div gets mousedown/touchstart listeners that initiate proportional resize tracking
- On mouseup/touchend, call `handleInput()` to sync the resized dimensions to markdown
- Add a custom turndown rule for `img` elements that preserves `width`/`style` attributes as inline HTML `<img>` tags rather than converting to `![]()`
- Add CSS for handles: `8x8px`, `bg-blue-500`, `cursor: nwse-resize` (and appropriate cursors per corner), `position: absolute`, `z-index: 10`

**No database changes. No new dependencies. No other files modified.**

## User Experience
- Click an image in the editor -- blue corner handles appear
- Drag any corner -- image resizes proportionally
- Click elsewhere -- handles disappear
- Size is saved automatically when you save the document
