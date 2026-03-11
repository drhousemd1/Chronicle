

# Fix: Show More Click, Swatch Grid Width, and Minimum Card Height

## Problem
1. **"Show more" button unclickable** — The `CardEditOverlay` hover overlay (`position: absolute; inset: 0; zIndex: 9`) covers the entire card including the toggle button, intercepting all clicks.
2. **Swatch grid too dense** — `minmax(220px, 1fr)` fits 5 columns at 1841px viewport; previously was 4.
3. **Cards still have uneven heights** — No minimum height is enforced, so cards with less content are shorter than neighbors.

## Changes (single file: `StyleGuideTool.tsx`)

### 1. Fix "Show more" click (CollapsibleCardBody ~line 220)
Add `position: 'relative'` and `zIndex: 10` to the toggle button row so it sits above the CardEditOverlay's z-index 9 overlay. The button's existing `e.stopPropagation()` will prevent the click from bubbling to the overlay.

### 2. Restore swatch grid to 4 columns
Change all color section grids from `minmax(220px, 1fr)` → `minmax(280px, 1fr)` across ~8 grid containers (lines ~942, 968, 986, 1001, 1016, etc.). This restores 4 columns at 1841px width.

### 3. Add minimum card height
Add `minHeight: 260` to the inner card `<div>` of each V2 card component (SwatchCardV2, TypoCardV2, ButtonCardV2, InputCardV2, BadgeCardV2, PanelCardV2) so all cards have a consistent minimum size. The card content uses `display: 'flex', flexDirection: 'column'` with the CollapsibleCardBody taking `flex: 1` so the toggle row's `marginTop: 'auto'` pushes it to the bottom consistently.

