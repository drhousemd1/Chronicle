
You’re right to be pissed — the current fix is still wrong because it targeted `height` while the real problem is **grid item stretching**.

## What’s actually broken
`CardEditOverlay` is the direct child of multiple CSS grids. Grid items default to `align-self: stretch`, so each overlay wrapper gets stretched to the row’s tallest card. That makes the hover layer look like it’s “one fixed size” per row.

## Correct fix plan (single-file, minimal-risk)
**File:** `src/components/admin/styleguide/StyleGuideTool.tsx`

1. **Fix wrapper sizing at the source (`CardEditOverlay`)**
   - Update wrapper style from the current clipped version to:
     - `position: 'relative'`
     - `alignSelf: 'start'` (critical: opt out of grid stretch)
     - `width: '100%'` (keep full column width)
   - Remove `overflow: 'hidden'` from the wrapper so card shadows/hover elevation are not chopped.

2. **Keep overlay bounds matched to card**
   - Keep the hover overlay absolutely positioned with `inset: 0`.
   - Keep `borderRadius: 10` on overlay (matches current wrapped card shells).
   - No forced `height: '100%'` anywhere in wrapper.

3. **Do not change individual card components unless needed**
   - `SwatchCardV2`, `TypoCardV2`, `ButtonCardV2`, `EntryCard` already define their own card surface.
   - This avoids another broad visual regression.

4. **Regression check after patch**
   - Hover cards in mixed-height rows (especially Buttons and Inputs sections).
   - Confirm overlay no longer extends below shorter cards.
   - Confirm keep/edit pills still click correctly and keep-remove still works.
   - Confirm card shadows are visible (not clipped).

## Why this will work
This addresses the real layout mechanic (grid stretch) instead of fighting symptoms with height hacks. One targeted wrapper fix will normalize overlay sizing across all card grids.
