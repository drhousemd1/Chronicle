
# Remove Hash Symbol from Tag Display

## What Changes

Remove the `#` prefix from tag pills across three files so tags display as clean text (e.g., "futanari" instead of "#futanari").

## Files to Update

**1. `src/components/chronicle/TagInput.tsx` (line 61)**
- Change `#{tag}` to `{tag}`

**2. `src/components/chronicle/ImageLibraryTab.tsx` (line 795)**
- Change `#{tag}` to `{tag}`

**3. `src/components/chronicle/GalleryHub.tsx` (line 436)**
- Change `#{tag}` to `{tag}`

All three are simple one-character removals. The tag pills keep their styling, just without the `#` prefix.
