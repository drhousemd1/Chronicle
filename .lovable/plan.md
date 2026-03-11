

# Enhance Edit Detail Modal for Color Swatches

## Overview
Add two new fields to the Edit Detail Modal when editing **swatch** cards specifically:
1. **"Page specific change" / "App wide change" checkboxes** -- to categorize the scope of the change
2. **"Change to" dropdown** -- populated with all color swatches from the style guide, showing a color preview circle + name, so you can select a replacement color without typing

These fields only appear for swatch-type edits. Other card types keep the current modal as-is.

## Changes

### File: `src/components/admin/styleguide/StyleGuideEditsModal.tsx`

**A. Extend `EditEntry` type** to include optional swatch-specific fields:
- `pageSpecificChange?: boolean`
- `appWideChange?: boolean`  
- `changeTo?: string` (the selected color name/value)

**B. Extend `EditDetailModal` props** to accept:
- `allSwatches?: Array<{ color: string; name: string }>` -- the full list of colors for the dropdown (passed from parent)

**C. Add state and UI inside `EditDetailModal`** (only when `cardType === 'SWATCH'`):
- Two checkboxes: "Page specific change" and "App wide change"
- A "Change to" select dropdown populated with `allSwatches`, each option rendering a small color circle + name
- These values get saved into the `EditEntry` on save

### File: `src/components/admin/styleguide/StyleGuideTool.tsx`

**D. Collect all swatch data** into an array and pass it to `EditDetailModal` as `allSwatches`. This can be built from the existing hardcoded `SwatchCardV2` calls -- extract a flat array of `{ color, name }` from all color sections.

**E. Pass `allSwatches` prop** through the `<EditDetailModal>` invocation (~line 4461).

## UI Details
- Checkboxes use existing app checkbox styling, positioned below the comment textarea
- Dropdown uses a custom select with color circle previews (inline `div` with `backgroundColor` + name text)
- Existing modal styling (dark theme, rounded-xl, HSL tokens) is preserved exactly
- The "Change to" dropdown includes a pencil/edit icon option at the bottom for manual entry if the desired color isn't in the list

