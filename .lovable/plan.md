

## Plan: Fix Story Builder Buttons Section

Three changes:

1. **Section header**: Change `title="Buttons"` to `title="Button Styles"` on line 1037.

2. **Rename "Shadow Surface" to "Default Button"**: Change `buttonName="Shadow Surface"` to `buttonName="Default Button"` on line 1041.

3. **Simplify preview to single button**: Remove the duplicate SAVE AND CLOSE button from the preview (line 1044), keep just one button labeled "DEFAULT BUTTON". Update `locations` to list all the specific label variations that use this style (DRAFTS, SAVE AND CLOSE, SAVE DRAFT, Upload Image, etc.).

All changes in `src/components/admin/styleguide/StyleGuideTool.tsx`, lines 1037-1053.

