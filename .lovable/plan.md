
Goal: fix the Style Guide navigation lock so clicking **App Style Restructuring** never traps you in a blank view.

What’s broken now:
- In `src/components/admin/styleguide/StyleGuideTool.tsx`, `showRestructuring` swaps the main content to a blank white panel.
- Left-nav section buttons still only call `scrollTo(id)`.
- When restructuring mode is active, section DOM nodes aren’t rendered, so `scrollTo` has no target and appears “dead.”

Plan to implement:
1. Update view state handling in `StyleGuideTool.tsx`.
   - Replace loose toggle behavior with explicit mode state (guide vs restructuring) to avoid ambiguous transitions.
   - Keep the button name exactly **App Style Restructuring**.

2. Fix left-nav section click behavior (desktop + mobile nav variants).
   - Add a `handleSectionClick(id)` helper:
     - If restructuring is active: switch back to guide mode first, then scroll on next frame (`requestAnimationFrame`) so target sections exist.
     - If guide mode is already active: scroll immediately.

3. Keep restructuring workspace behavior exactly as requested.
   - Main panel remains a plain white blank workspace.
   - Sidebar stays visible and usable.

4. Add clear return affordance.
   - While restructuring is active, show a visible “return to guide” control in sidebar (without renaming/removing the App Style Restructuring button).
   - This prevents “stuck” UX even if users don’t click a section.

5. Validate interaction flow end-to-end.
   - Open Style Guide → click App Style Restructuring → white workspace appears.
   - Click any left-nav section → guide content returns and scroll lands correctly.
   - Re-enter restructuring mode and repeat.
   - Confirm no regressions to scroll-spy highlighting and download modal wiring.

Technical scope:
- File: `src/components/admin/styleguide/StyleGuideTool.tsx` only.
- No backend/database/auth changes.
- No Admin hub tool-list changes in `src/pages/Admin.tsx`.
