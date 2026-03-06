

## Plan: Fix Sidebar Theme Modal — Button Weight and Preview Aspect Ratio

### Issue 1: Button too bold
The "+ Upload Image" button uses `font-black` (line 68) while all other action buttons in the app use `font-bold`. Changing to `font-bold` will match the rest of the UI.

### Issue 2: Thumbnails use wrong aspect ratio
The grid tiles currently use `aspect-video` (16:9 landscape), which crops most of the 300×1080 portrait images. Switching to a portrait aspect ratio (`aspect-[3/5]`) will show the full image content, matching the recommended 300×1080 dimensions.

### Changes (single file: `SidebarThemeModal.tsx`)

1. **Line 68**: Change `font-black` → `font-bold` on the upload button.
2. **Lines 99, 124**: Change `aspect-video` → `aspect-[3/5]` on both the Default tile and the uploaded background tiles, so previews display in portrait matching the actual image proportions.
3. **Line 130**: Change `object-cover` → `object-cover object-top` on the `<img>` tag so the top of each image is visible when minor cropping occurs.

