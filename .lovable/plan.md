
Replace the current Story Arc work with the same structure the two cards above already use, but populated by the real Story Arc source instead of an approximation.

1. Remove the extra React card I added below the iframe
- Delete the standalone `ArcPhaseCardPreview` from `src/components/admin/styleguide/StyleGuideTool.tsx`.
- Restore the style guide to a single continuous card list in the existing preview area.

2. Rebuild Story Arc as Card 3 inside the existing style-guide system
- Add a third `.card` to `public/style-guide-component-example.html` directly after Chat Settings.
- Match the exact same shell pattern as Cards 1–2:
  - `card-header`
  - full-width `preview-section`
  - white `details-toggle`
  - collapsible `details-content`

3. Duplicate the actual Story Arc section structure, not just `ArcPhaseCard`
- Use `StoryGoalsSection.tsx` as the source of truth, because that contains the missing outer shell, section header, section body padding, inner container, steps block, linked phase area, and add button structure.
- Reproduce the full visible stack:
  - outer story-arcs shell
  - gradient section header
  - content padding
  - single arc container
  - main story arc block
  - linked phase block(s)
  - add next phase button
- Keep Story Arc in the app unchanged.

4. Use the real component markup/classes as literally as possible
- Copy the exact wrappers, spacing, headers, and ordering from `StoryGoalsSection.tsx` and `ArcPhaseCard.tsx`.
- Only replace React-only behavior with static equivalents where absolutely necessary.
- Reuse the same visual conventions already used by Cards 1–2 so the dropdown/details behavior works identically.

5. Include the missing linked-phase layout
- The preview should show the main Story Arc container plus at least one linked phase underneath it, since that is part of the real section structure you want preserved for future reference.
- This is the key difference between duplicating the component tree and showing only an isolated phase card.

6. Recreate the details dropdown exactly like the cards above
- Use the same white toggle bar and collapsible details region pattern already present in Card 1 and Card 2.
- Add Story Arc-specific documentation beneath it, but keep the preview section visually primary.

7. Preserve this as a future-proof reference replica
- Treat the new Card 3 as a source-faithful archive of the Story Arc UI before later removal from the app.
- Scope this pass to fixing Story Arc only, not redesigning the rest of the style guide.

Technical note
- The current failure is structural: `ArcPhaseCard` alone is only the inner linked-phase piece, while the real Story Arc UI lives in `StoryGoalsSection`.
- The fix is to duplicate the full section hierarchy into Card 3 inside the existing HTML style-guide card system, not append a separate React preview underneath the iframe.
