

## Plan: Show Full Image in Sidebar Theme Previews

### Problem
The tiles use `object-cover` which crops tall portrait images to fill the container. Since the source images are ~300×1080 (roughly 1:3.6 ratio) but tiles are `aspect-[2/3]` (1:1.5), a large portion of each image is cropped out.

### Fix (single file: `SidebarThemeModal.tsx`)

**Change `object-cover` to `object-contain`** on the background preview `<img>` tag (line ~130). This will scale the entire image to fit within the tile without cropping, showing the full content. The tile's dark `bg-zinc-800/50` background will fill any letterbox space naturally.

