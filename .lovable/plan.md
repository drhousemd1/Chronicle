

# Fix Arc Connector Visibility and Thickness

## Problem
The glow filter's `floodOpacity="0.4"` makes the line too faint, and the `strokeWidth="2"` is thicker than the white structural lines elsewhere in the UI (which appear to be ~1px).

## Changes

### File: `src/components/chronicle/arc/ArcFlowConnector.tsx`

1. **Increase glow opacity**: Change `floodOpacity` from `0.4` to `0.8` so the glow aura is clearly visible
2. **Use full-opacity stroke**: Change stroke color from `#1e3a5f` to a brighter navy like `#2563eb` (or keep `#1e3a5f` but ensure the glow compensates) -- the core line needs to be fully visible, not washed out
3. **Reduce stroke width**: Change `strokeWidth` from `"2"` to `"1"` to match the thin white structural lines in the rest of the UI
4. **Reduce blur spread slightly**: Change `stdDeviation` from `4` to `3` since a thinner line needs a tighter glow to look proportional

Result: A crisp, thin navy line with a visible blue glow -- matching the visual weight of the white lines but in the blue/navy color scheme.

