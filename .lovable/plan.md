I audited the uploaded HTML directly. The correct target is the Story Detail Modal block in `user-uploads://updated_ui_design-4.html` around lines 720-930. The previous change was wrong because it only changed the outer shell and did not implement the actual HTML structure you provided.

Plan

1. Rebuild `src/components/chronicle/StoryDetailModal.tsx` to match the uploaded HTML block exactly, while preserving all existing data and behavior.
2. Limit changes strictly to this modal and its matching style-guide entry so nothing else drifts.

Exact implementation scope from the HTML reference

- Modal shell
  - Switch back to the HTML spec: `rounded-[32px]`, larger `0 20px 50px rgba(0,0,0,0.5)` shadow, and a width closer to the reference instead of the current oversized flatter shell.
- Two-panel layout
  - Restore the darker left panel (`#1c1c1f`) with the fixed-width cover/actions column.
  - Keep the right side as the scrollable content panel.
- Right-side header
  - Add the gradient banner from the HTML (`#5a7292 -> #4a5f7f`) with the gloss overlay.
  - Move the story title into that banner.
  - Remove the current body-only title presentation and the current vertical divider styling.
- Left column
  - Match the HTML cover block, cover shadow, and badge placement.
  - Restyle the action buttons to the HTML surface style (`#2f3137`, inset highlights, rounded-xl, bold uppercase sizing), while keeping existing logic for like/save/play/edit/remove.
- Content body
  - Match the HTML spacing and section rhythm.
  - Replace the current underlined section headings with the neutral uppercase zinc labels from the HTML.
  - Convert the creator row into the inset surface card shown in the HTML.
- Characters / reviews
  - Keep the existing functionality and data loading.
  - Align typography, spacing, and review card presentation to the uploaded HTML block.

Files to update

- `src/components/chronicle/StoryDetailModal.tsx`
- `src/components/admin/styleguide/StyleGuideTool.tsx` to sync the Story Detail Modal spec to this HTML-based source of truth so future edits do not drift again

Guardrails

- No changes outside the view-more story modal and its matching style-guide documentation.
- No invented styling beyond what appears in the uploaded HTML reference.
- Preserve all existing modal logic; only restructure/restyle what is necessary to match the provided design.