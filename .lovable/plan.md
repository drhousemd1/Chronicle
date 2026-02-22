

# Arc Flow Connector: Right-Angle Routing with Glow Effect

## The Problem

The current Bezier curve connector tries to draw a smooth S-curve between steps across the two columns, but the narrow gap between columns makes it look awkward and cramped. The dashed styling also feels lightweight and hard to follow visually.

## The Solution

Replace the Bezier curve with a clean **right-angle routed path** (orthogonal routing) and switch to a **solid navy blue line with a glow effect**.

### Visual Style
- **Path shape**: Horizontal out from source edge, 90-degree turn straight up/down, 90-degree turn horizontal into target edge
- **Line**: Solid (no dash), 2px stroke
- **Color**: Navy blue (`#1e3a5f`) with a glowing effect via an SVG blur filter
- **Glow**: A second copy of the path rendered behind with a Gaussian blur filter in a lighter blue (`#3b82f6` at ~40% opacity) to create a soft neon-like glow

### Path Routing Logic

Instead of a Bezier curve, the path will use three segments:

```text
Source (right edge) ---horizontal---> midpoint X
                                        |
                                     vertical
                                        |
                                      midpoint X ---horizontal---> Target (left edge)
```

The `midX` will be calculated as the exact center between the two columns (halfway between source right edge and target left edge). This creates a clean L-shaped or Z-shaped connector depending on vertical direction.

SVG path: `M sx sy L midX sy L midX ty L tx ty` (three straight segments with right angles).

## Technical Details

### File: `src/components/chronicle/arc/ArcFlowConnector.tsx`

1. **Replace the Bezier `C` command** with line `L` commands for right-angle routing:
   - `M sx sy` (start at source edge center)
   - `L midX sy` (horizontal to column gap center)
   - `L midX ty` (vertical to target Y)
   - `L tx ty` (horizontal to target edge)

2. **Add SVG filter** for the glow effect:
   - Define a `<filter>` with `<feGaussianBlur>` (stdDeviation ~4) and `<feMerge>` to layer blur behind the crisp line

3. **Render two paths**:
   - Background glow path: lighter blue, wider stroke, blur filter applied
   - Foreground path: solid navy blue, 2px, crisp

4. **Remove** `strokeDasharray` (no more dashed line)

No other files need to change -- the connector component is self-contained.
