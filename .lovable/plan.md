
# Fix App Guide: Copy/Paste + Image Support

## Problems Identified
1. **Copy/paste broken**: The `contentEditable` div has no `onPaste` handler. Browser default paste inserts raw HTML that doesn't reliably trigger `onInput`, causing content to silently diverge from the markdown state.
2. **No image support**: No `onDrop` or clipboard-image handling exists. No storage bucket for guide images. No upload logic.

## Solution

### 1. Create `guide_images` Storage Bucket
- New database migration to create a `guide_images` public bucket
- RLS policies: authenticated users can upload, anyone can read (guide content may be shared)

### 2. Add `onPaste` Handler (GuideEditor.tsx)
- Intercept paste events on the contentEditable div
- **Text paste**: Strip formatting from pasted HTML to keep it clean, insert as sanitized HTML, then trigger `handleInput` to sync markdown state
- **Image paste** (from clipboard screenshots): Extract the image blob from `clipboardData.files`, compress it (JPEG, 0.85 quality, max 1024px width per project standards), upload to `guide_images` bucket, insert an `<img>` tag with the public URL at the cursor position, then trigger `handleInput`

### 3. Add `onDrop` Handler (GuideEditor.tsx)
- Intercept drop events on the contentEditable div
- Detect image files from `dataTransfer.files`
- Same flow as paste: compress, upload to `guide_images/{userId}/{timestamp}.jpg`, insert `<img>` tag at drop position
- Show a subtle visual indicator (border highlight) during drag-over via `onDragOver`

### 4. Image Upload Utility
- Create a helper function `uploadGuideImage(file: File): Promise<string>` in the GuideEditor file (or a small utility)
- Compress using canvas (max 1024px width, JPEG 0.85)
- Upload to `guide_images` bucket at path `{userId}/{timestamp}-{random}.jpg`
- Return the public URL

### 5. Turndown Image Rule
- Ensure the turndown instance converts `<img>` tags back to markdown image syntax `![alt](url)` -- this should work by default with turndown, but will verify and add a custom rule if needed

## Technical Details

**Files modified:**
- `src/components/admin/guide/GuideEditor.tsx` -- add `onPaste`, `onDrop`, `onDragOver` handlers, image upload utility, compression helper

**Database migration:**
- Create `guide_images` storage bucket (public)
- RLS: authenticated users can INSERT to `guide_images`, public SELECT

**No other files changed.** The toolbar, sidebar, and AppGuideTool remain untouched.

## Behavior After Fix
- **Ctrl+V / Cmd+V text**: Pastes clean content, markdown state syncs immediately
- **Ctrl+V / Cmd+V screenshot**: Image uploads to storage, appears inline in the editor as an `<img>`, saved as `![](url)` in markdown
- **Drag-and-drop image file**: Same as screenshot paste -- uploads, inserts inline
- **Drag-over visual**: Subtle blue border or overlay to indicate drop zone is active
