

# Image Library Layout & Styling Improvements (5 Items)

---

## What You'll Notice After This

- The "Edit Folder" button inside folders is removed (editing is done from the main folder grid hover overlay)
- The "+ Upload Images" button moves to the white header bar, to the left of the cogwheel
- The folder name and description display inline on one line instead of stacked
- The FolderEditModal gets dark-themed styling to match the rest of the app
- Image thumbnails get a gray footer bar below the image with the title displayed there, all wrapped in the slate blue border

---

## 1. Remove "Edit Folder" button from inside-folder view

The edit button at lines 592-599 of `ImageLibraryTab.tsx` is redundant since the main folder grid already has an Edit hover overlay. We simply remove it.

**File:** `src/components/chronicle/ImageLibraryTab.tsx` (lines 592-599)

---

## 2. Move "+ Upload Images" button to the header

The upload button needs to move from the `ImageLibraryTab` content area into the white header bar in `Index.tsx`, positioned to the left of the Settings cogwheel.

This requires:
- Exposing a `onUploadClick` callback prop from `ImageLibraryTab` (or using a ref). The simplest approach: add a ref-based trigger. We'll use `React.useImperativeHandle` on `ImageLibraryTab` to expose a `triggerUpload()` method, then call it from the header button.
- Alternatively (simpler): move the hidden file input and upload handler to remain inside `ImageLibraryTab`, but expose a callback via the `onFolderChange` mechanism. The cleanest approach is to pass an `uploadRef` from `Index.tsx` into `ImageLibraryTab`, which assigns `fileInputRef.current?.click` to it. The header button then calls `uploadRef.current?.()`.
- Add the styled upload button to the `tab === "image_library"` header section in `Index.tsx`, shown only when `isInImageFolder` is true, positioned before the cogwheel dropdown.
- Remove the upload button from the `ImageLibraryTab` content area (lines 600-615).

**Files:**
- `src/components/chronicle/ImageLibraryTab.tsx` -- add `uploadRef` prop, remove upload button from content
- `src/pages/Index.tsx` -- add upload button to header, pass `uploadRef` to `ImageLibraryTab`

---

## 3. Make folder name and description inline

Change the folder detail header from a stacked layout:
```
Test Folder
Character Profile Images
```
To inline:
```
Test Folder  Character Profile Images
```

Keep the same text styling (h1 for name, p for description) but put them in a `flex items-baseline gap-3` row instead of a stacked div. No color or size changes.

**File:** `src/components/chronicle/ImageLibraryTab.tsx` (lines 584-589)

---

## 4. Restyle FolderEditModal to dark theme

The modal currently uses default white `DialogContent` (image 3). Update it to match the app's dark theme:
- `DialogContent`: `bg-zinc-900 border-[#4a5f7f] text-white`
- Labels: keep `text-slate-500` (they read fine on dark)
- Input/Textarea: `bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500`
- Cancel button: Shadow Surface standard styling
- Save button: Shadow Surface standard styling
- Remove the X close button by adding a custom close override or hiding it

**File:** `src/components/chronicle/FolderEditModal.tsx`

---

## 5. Add gray footer bar to image thumbnails

Change the thumbnail from a square with a gradient text overlay to a slightly taller rectangle:
- The image stays `aspect-square` inside a container
- Below the image, add a gray bar (`bg-zinc-700`) with padding, displaying the title in white text
- The entire element (image + footer) is wrapped in the `border border-[#4a5f7f]` with `rounded-xl overflow-hidden`
- Remove the gradient overlay that currently sits on top of the image for the title
- The footer text uses `text-xs font-medium text-white truncate`

**File:** `src/components/chronicle/ImageLibraryTab.tsx` (lines 626-678, the image grid tiles)

---

## Technical Details

### Files Modified

- **`src/components/chronicle/ImageLibraryTab.tsx`**
  - Add `uploadRef` prop (type `React.MutableRefObject<(() => void) | null>`)
  - Assign `fileInputRef.current?.click` to `uploadRef` in a useEffect
  - Remove Edit Folder button (lines 592-599)
  - Remove Upload Images button from content (lines 600-607)
  - Keep hidden file input and upload handler in ImageLibraryTab
  - Make folder name/description inline (flex row with gap)
  - Restructure image tiles: image in aspect-square container + gray footer bar with title, all wrapped in slate blue border

- **`src/pages/Index.tsx`**
  - Create `imageLibraryUploadRef = React.useRef<(() => void) | null>(null)`
  - Pass `uploadRef={imageLibraryUploadRef}` to `ImageLibraryTab`
  - Add upload button to header before cogwheel, visible only when `isInImageFolder`:
    ```
    Shadow Surface button: "+ Upload Images"
    ```

- **`src/components/chronicle/FolderEditModal.tsx`**
  - Dark theme: `DialogContent` bg-zinc-900 border-[#4a5f7f]
  - Input/Textarea: bg-zinc-800 border-zinc-700 text-white
  - Buttons: Shadow Surface standard styling for both Cancel and Save
  - Hide the default X close button via DialogContent className override

