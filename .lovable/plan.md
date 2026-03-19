
Replace the current Story Arc style-guide card with a source-faithful implementation instead of trying to manually recreate it.

1. Remove the fake static Story Arc replica
- Delete the hand-built Story Arc block from `public/style-guide-component-example.html`.
- Keep the existing Physical Appearance and Chat Settings cards as-is for now.
- Do not touch app colors, typography, or the real Story Arc component styles.

2. Stop using copy-by-eye for the arc card
- The current mismatch is happening because the style guide card is handwritten HTML inside an iframe.
- A 1:1 Story Arc spec cannot be reliable in that format because `ArcPhaseCard` is composed from:
  - `ArcPhaseCard.tsx`
  - `ArcBranchLane.tsx`
  - `GuidanceStrengthSlider.tsx`
  - `ArcModeToggle.tsx`
  - `ArcConnectors.tsx`
  - `ArcFlowConnector.tsx`
- Those layers, paddings, internal wrappers, state styles, and branch-specific variants need to come from the real component tree.

3. Rebuild the Story Arc entry inside the React style guide tool
- Add a dedicated Story Arc card directly in `src/components/admin/styleguide/StyleGuideTool.tsx` instead of the standalone HTML file.
- Render the actual `ArcPhaseCard` component with seeded sample data and inert handlers.
- Wrap it in the same style-guide card shell/collapsible pattern already expected by the style guide.

4. Seed the preview with exact representative data
- Use a sample `ArcPhase` object that intentionally exercises the real visuals:
  - title
  - desiredOutcome
  - `flexibility: "normal"`
  - `mode: "advanced"`
  - fail branch with trigger + failed step
  - success branch with trigger + succeeded step
  - event order values that produce the real connector behavior if needed
- Include the fail sentinel card and the success add-step button by using the real branch setup the component expects.

5. Make the preview non-destructive but visually real
- Pass no-op handlers for update/delete/enhance actions so buttons still render exactly like production.
- If needed, freeze the data in local component state only for preview purposes, but avoid changing source styles or logic.

6. Keep the spec-sheet details below the live preview
- Under the real preview, keep the white collapsible bar and details section.
- The details text can remain documentation, but the preview itself must come from the real component.
- This gives you the exact layers/padding/headers from source while preserving the style-guide format.

7. Scope control
- Only fix the Story Arc style-guide entry in this pass.
- Do not redo unrelated cards unless you explicitly want the same “real component instead of HTML clone” treatment there too.

Technical note
- Right now `StyleGuideTool.tsx` embeds `/style-guide-component-example.html` in an iframe, which is why the Story Arc card was recreated by approximation.
- The robust fix is to move the Story Arc preview into React so the style guide can mount the actual component code instead of an imitation.
- If you want true copy/paste fidelity, this is the correct implementation path.
