

# Fix: Vertical Alignment of Icons in Locations & Story Goal Steps

## Problem
1. **Primary Locations**: Lock icons (idx < 2) use `pt-2` but trash icons (idx >= 2) use `mt-2` — inconsistent vertical centering relative to the input fields.
2. **Story Goal Steps**: The row uses `items-start` with the checkbox at `mt-2.5`, SparkleButton has no vertical offset, and trash has `mt-2` — all misaligned relative to the text input.

## Fix

### 1. `src/components/chronicle/WorldTab.tsx` — Trash icon alignment (line 862)
Change the trash button from `mt-2 ... p-1` to match the lock icon's wrapper pattern:
- Wrap in a `div` with `w-7 flex-shrink-0 flex items-center justify-center pt-2` (same as the lock icon wrapper)
- Remove `mt-2` and `p-1` from the button itself

### 2. `src/components/chronicle/StoryGoalsSection.tsx` — Steps row alignment (lines 320, 335, 351)
- Change the step row container from `items-start` to `items-center` so all elements (checkbox, input, sparkle button, trash) naturally center-align vertically
- Remove the manual offsets: checkbox `mt-2.5` → remove, trash `mt-2` → remove
- This ensures the checkbox, sparkle button, and trash icon all sit centered relative to the input field height

## Files Modified
- `src/components/chronicle/WorldTab.tsx` — 1 block (~lines 854-865)
- `src/components/chronicle/StoryGoalsSection.tsx` — 3 lines (~320, 325, 351)

