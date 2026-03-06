
You’re right, and the inconsistency is reproducible from the code.

Root cause:
- These hint tooltips are embedded under labels/spans with different font weights (`font-semibold`, `font-bold`, `font-black`).
- Tooltip text style is not explicitly locked for weight, so each tooltip ends up visually different depending on where it’s used.

Implementation plan (make it consistent with the Dynamic Background tooltip look):
1. Standardize one shared “info hint tooltip” text style and reuse it everywhere these blue info icons are used.
   - Typography lock: `text-xs`, `font-semibold`, `leading-relaxed`, `normal-case`, `tracking-normal`.
   - Keep existing per-tooltip max width (e.g., 220/300) so layout doesn’t jump.
2. Apply that exact style to all 4 affected hint tooltips:
   - Dynamic Backgrounds (reference tooltip) in `src/components/chronicle/ChatInterfaceTab.tsx`
   - Opening Dialog tooltip in `src/components/chronicle/WorldTab.tsx`
   - Scene Gallery Photos tooltip in `src/components/chronicle/WorldTab.tsx`
   - Art Style Selection tooltip in `src/components/chronicle/WorldTab.tsx`
3. Normalize bullet tooltip internals so they render with same weight as non-bullet tooltip text.
   - Add explicit list text style (`font-semibold` + existing bullet spacing classes) for Opening Dialog and Scene Gallery list content.
4. Do not change spacing/layout in this pass.
   - No changes to section padding, title alignment, button position, or card/container dimensions.
   - This pass is strictly text-consistency for hint boxes.

Technical files touched:
- `src/components/chronicle/WorldTab.tsx`
  - Update 3 tooltip content class strings and 2 list class strings.
- `src/components/chronicle/ChatInterfaceTab.tsx`
  - Update Dynamic Background tooltip class string to the same canonical text style.

Validation checklist after implementation:
- All four hint popups have identical visual weight and readability.
- Opening Dialog and Scene Gallery no longer appear heavier than Dynamic Background.
- Art Style tooltip matches the same typography standard.
- No regressions in uppercase/tracking bleed, and no clipping/layout regressions.
