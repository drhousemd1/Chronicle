

# Fix Goals and Desires Layout to Match Story Arcs

## Problem
The Character Builder's "Goals and Desires" uses a 12-column grid (`col-span-9` content / `col-span-3` progress ring) which constrains the Guidance Strength slider and hint box to 75% width. The Story Arcs container solved this by placing the progress ring inline with only the title row, letting everything below span full width.

## Change — Single File: `src/components/chronicle/CharacterGoalsSection.tsx`

**Lines 232-345**: Restructure the inner goal card layout from a 12-column grid to match the Story Arcs pattern:

1. **Replace** the `grid grid-cols-1 md:grid-cols-12` wrapper with a simple vertical layout
2. **Row 1** (flex): Goal Name (`flex-1`) + Progress Ring (`shrink-0`, same `w-20 h-20` sizing as Story Arcs) — side by side
3. **Below Row 1** (full width): Desired Outcome, Guidance Strength slider, Steps section — all span 100%

The progress ring changes from the `CircularProgress` component (96px with custom SVG) to a simple CSS ring matching Story Arcs (`w-20 h-20 rounded-full border-[8px] border-[rgba(51,80,125,0.85)]` with percentage text inside). The progress percentage label below it stays.

No other sections, files, or styling changes.

