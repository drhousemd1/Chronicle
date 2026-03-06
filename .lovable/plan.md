

## Plan: Fix Scene Gallery Button Spacing & Empty State Text Color

### Issue 1: Buttons too close to empty state box
The header row (line 992) has `mb-1` and the grid has `mt-1`, totaling only 8px between the buttons and the content below. Need to add more spacing **below the button row only**, without moving the title.

**Fix**: Change `mt-1` on the grid (line 1028) to `mt-3` (12px). This pushes the content area down from the buttons without affecting the title-to-label spacing above.

### Issue 2: Subtitle text too dark
- Line 1095: "No scenes uploaded" uses `text-zinc-500` — looks fine.
- Line 1096: "Upload images to enable dynamic backgrounds in chat." uses `text-zinc-600` — too dark/hard to read.

**Fix**: Change `text-zinc-600` to `text-zinc-500` on line 1096 so both lines use the same gray tone.

### Files changed
- `src/components/chronicle/WorldTab.tsx` — 2 lines

