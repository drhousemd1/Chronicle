

# Fix Scene Image Aspect Ratio: Proper Grok API Integration + Dynamic Detection

## Background

The current code has three problems:
1. The Grok API call does NOT pass a `size` parameter, so it defaults to 1024x1024 (square) -- regardless of what the hint text says
2. The hint text recommends "1024x768, 4:3" which isn't even a valid Grok dimension
3. The thumbnail footer hardcodes "16:9" instead of showing the real aspect ratio

## Grok Supported Dimensions

The grok-2-image-1212 API supports these sizes:
- 1024x1024 (1:1)
- 1280x896 (4:3)
- 896x1280 (3:4)
- 1408x768 (16:9)
- 768x1408 (9:16)
- 1296x864 (3:2)
- 864x1296 (2:3)

## Recommended Default: 4:3 (1280x896)

Scene images display in the chat at `max-w-2xl` (672px) with `h-auto`. A 4:3 landscape ratio is the best balance:
- Wide enough to feel immersive and scene-like
- Not so wide that the image becomes a thin strip (16:9 at 672px = only 378px tall)
- 4:3 at 672px = 504px tall, which fills the viewport nicely
- Matches traditional scene/environment composition ratios

## Changes

### 1. Pass `size` to Grok API (`supabase/functions/generate-scene-image/index.ts`)

In the `generateImage` function, add `size: "1280x896"` to the request body so Grok actually generates a 4:3 landscape image instead of defaulting to 1:1 square.

### 2. Update hint text (`src/components/chronicle/WorldTab.tsx`, line 887)

Change from `"Recommend: 1024x768, 4:3 aspect ratio."` to `"Recommend: 1280x896, 4:3 landscape."` -- this now matches an actual Grok-supported dimension.

### 3. Update AI generation prompt (`src/components/chronicle/WorldTab.tsx`, line 1187)

Keep the "4:3 aspect ratio" wording in the prompt since 4:3 is indeed the correct ratio to use.

### 4. Dynamic aspect ratio detection on thumbnails

Extract the shared `STANDARD_RATIOS`, `getClosestRatio`, and `AspectRatioIcon` from `ImageLibraryTab.tsx` into a new `src/components/chronicle/AspectRatioUtils.tsx` file. Then:

- **`WorldTab.tsx`**: Add a `useEffect` + `useState` that loads each scene image's natural dimensions and detects its real aspect ratio using `getClosestRatio`. Replace the hardcoded "16:9" in the thumbnail footer with the detected ratio and the `AspectRatioIcon` component.
- **`ImageLibraryTab.tsx`**: Remove the local `STANDARD_RATIOS`, `getClosestRatio`, and `AspectRatioIcon` definitions and import them from the shared file instead.

### 5. Update cover image generation prompt (line 1187)

Change `"4:3 aspect ratio environment background"` to keep it as 4:3 since that is the correct ratio, but update dimensions reference if present.

## Files Changed

1. **`supabase/functions/generate-scene-image/index.ts`** -- add `size: "1280x896"` to Grok image API call
2. **`src/components/chronicle/AspectRatioUtils.tsx`** (new) -- shared ratio detection utilities
3. **`src/components/chronicle/WorldTab.tsx`** -- fix hint text, add dynamic ratio detection on thumbnails
4. **`src/components/chronicle/ImageLibraryTab.tsx`** -- import shared utilities instead of local definitions

