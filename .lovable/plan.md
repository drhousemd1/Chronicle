

# Fix Arc Connector: Single Glowing Line

## Problem
The current implementation renders two separate SVG paths — a wide blurred background path and a thin foreground path — which appear as two distinct lines instead of one line with a glow.

## Solution
Use a single path with an SVG filter that creates the glow effect around it. The filter will:
1. Take the original path graphic
2. Create a blurred, color-shifted copy behind it
3. Merge them together as one visual unit

This produces one crisp navy line with a soft blue aura around it.

## Technical Details

### File: `src/components/chronicle/arc/ArcFlowConnector.tsx`

Update the SVG filter and path rendering:

1. **Revise the SVG filter** to use `flood` + `composite` to create a colored glow behind the source graphic:
   - `feFlood` fills with the glow color (`#3b82f6`, ~40% opacity)
   - `feComposite` clips the flood to the path shape
   - `feGaussianBlur` blurs that colored shape
   - `feMerge` layers: blurred glow on bottom, original crisp path on top

2. **Remove the second (glow) `<path>` element** — only one `<path>` remains

3. **Apply the filter to the single path**, which is stroked with navy `#1e3a5f` at 2px

Result: one line, one DOM element, unified glow effect.

