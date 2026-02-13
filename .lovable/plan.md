

# Fix Row Alignment in Character Builder Sections

## Problem
Hard-coded rows (Hair Color, Eye Color, etc.) extend further than user-added extra rows because extra rows have an X delete button that takes up space, while hard-coded rows have no spacer in that column. This creates a visually uneven layout.

## Solution
Add an invisible spacer element to `HardcodedRow` that matches the exact width of the X button in `ExtraRow`, ensuring both row types have identical total widths.

## Changes

### File: `src/components/chronicle/CharactersTab.tsx`

**`HardcodedRow` component (lines 102-131):** Add a transparent spacer div after the value textarea, matching the X button's dimensions (`p-1.5` padding + `w-4` icon = roughly `w-7` or `28px`). This creates a consistent right-side column for alignment.

Before:
```
[Label w-2/5] [sparkle] [Value flex-1]
```

After:
```
[Label w-2/5] [sparkle] [Value flex-1] [spacer w-7]
```

The spacer is invisible but reserves the same horizontal space as the delete button in `ExtraRow`.

### File: `src/components/chronicle/CharacterEditModal.tsx`

Apply the same spacer fix to the modal's hardcoded row component for consistency.

---

No other files are affected. This is a CSS/layout-only change.

