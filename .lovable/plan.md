

## Plan: Fix Upload Button Weight, Remove Gray Bars, Fix Top Clipping

### Changes (single file: `SidebarThemeModal.tsx`)

1. **Button text size** (line 68): The reference "Chat Settings" / "Generate Image" buttons use `text-[10px] font-bold`. The upload button uses `text-xs font-bold` — `text-xs` is 12px vs 10px, making it appear bolder/heavier. Change `text-xs` to `text-[10px]` to match.

2. **Remove gray bars and show more tiles** (lines 95, 100, 125): The gray bars come from `object-contain` inside `aspect-[2/3]` tiles — the image is much taller than the container. Fix by:
   - Change tile aspect from `aspect-[2/3]` to `aspect-[1/3]` (closely matching the ~300×1080 image ratio)
   - Change image back to `object-cover` (tiles now match image proportions, so no cropping occurs)
   - Increase grid to 7 columns (`md:grid-cols-7`) since tiles are now narrower

3. **Fix top clipping of selection ring** (line 94): Add `pt-2` padding to the scroll container so the `ring-offset-2` on the selected tile's top edge isn't clipped.

