
You’re right, and here is exactly why this went wrong:

1) I changed the behavior, not just sizing  
- I moved most metadata behind a collapsible block instead of keeping the original visible content structure.  
- That made it look like information was deleted, even when it was still in code but hidden.

2) I introduced a logic bug for Swatches  
- `SwatchCardV2` only enables “Show more” when `effect` exists.  
- Most swatches don’t have `effect`, so they got no toggle and lost access to extra rows (including visibility flags) in the UI.

3) I used the wrong sizing strategy  
- I used `minHeight` (minimum) instead of a consistent collapsed base height.  
- So cards with more always-visible text still grew unevenly, which caused staggered heights.

4) I used the wrong grid width target  
- The `minmax(280px, 1fr)` width is still narrow enough to produce 5 columns at your desktop width.  
- That is why swatches did not return to the old 4-wide behavior.

5) The edit overlay interaction is still conflicting  
- The full-card hover/edit layer can still intercept interactions depending on pointer/hover state, which is why toggle behavior feels broken.

Implementation plan to fix it correctly (no information removed):

A. Restore full metadata visibility model (no content loss)  
- Keep all original metadata rows present and renderable for every card type.  
- Do not gate access to rows behind optional fields like `effect`.

B. Rebuild “Show more” as overflow-based, not field-based  
- Render full metadata content inside a measured container.  
- Collapsed state: fixed metadata viewport height.  
- Show toggle only when content actually overflows.  
- If no overflow, keep a reserved empty footer slot so all cards align.

C. Enforce uniform collapsed card size with a true base height  
- Replace “minimum-only” behavior with a consistent collapsed card baseline per card family.  
- Cards expand only when user clicks “Show more”.

D. Restore swatch desktop density to prior look  
- Increase color-grid min width to the previous effective size so desktop returns to 4 across at your viewport.  
- Keep responsive behavior on smaller widths.

E. Fix overlay so controls are always clickable  
- Scope edit overlay interaction to the preview area (or make non-action overlay regions non-interactive).  
- Ensure show-more row has guaranteed click priority and never triggers edit modal.

File to update:
- `src/components/admin/styleguide/StyleGuideTool.tsx`

Acceptance criteria:
- No metadata fields disappear from any card.
- “Show more” appears only when there is hidden overflow content.
- Cards align to consistent collapsed heights.
- Swatches display 4 columns on your current desktop viewport.
- Clicking “Show more” never opens the edit modal.
