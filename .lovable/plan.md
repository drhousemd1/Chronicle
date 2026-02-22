

# Fixed-Size Lightbox (No Black Bars)

## What Changes

The lightbox modal gets a fixed width and a fixed-height image area. The image scales with `object-contain` inside that area, and the existing `bg-zinc-900` card background shows through around smaller/narrower images -- no black bars, no extra wrapper elements.

## File: `src/components/chronicle/ImageLibraryTab.tsx`

### Change 1: Fixed container width (line 766)

Replace `max-w-[600px]` with `w-[600px] max-w-[95vw]` so the modal is always 600px wide.

### Change 2: Fixed-height image area (lines 769-773)

Replace the current `img` tag:
```
<img ... className="w-full h-auto max-h-[50vh] object-contain rounded-lg cursor-pointer" />
```

With:
```
<img ... className="w-full h-[50vh] object-contain rounded-lg cursor-pointer" />
```

The key change is swapping `h-auto max-h-[50vh]` to just `h-[50vh]`. This makes the image area always 50vh tall. `object-contain` ensures the image scales proportionally within that fixed space, and the surrounding `bg-zinc-900` of the card naturally fills any remaining area -- no black bars, no extra divs.

## Result

- Modal is always 600px wide regardless of image aspect ratio
- Image area is always 50vh tall
- Portrait, landscape, and square images all scale to fit within that area
- The dark card background naturally shows around images that don't fill the space -- seamless, no added elements
- Title, tags, and buttons stay in a fixed, consistent position
