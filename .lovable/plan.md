
Goal: remove the Story Builder toast behavior and keep feedback strictly inline, consistent with the no-toast policy.

What I found:
- The toast was introduced in `src/pages/Index.tsx`:
  - `storyTransferNotice` state + auto-dismiss effect (lines ~198–206)
  - `setStoryTransferNotice(...)` calls in import/export handlers (lines ~1022, ~1028, ~1080, ~1086)
  - a floating bottom-center toast render block (lines ~2732–2746) with `fixed bottom-6 left-1/2`.
- Transfer-pack reference shows this should be inline in the header (next to Save Draft), not a floating toast.

No critical unknowns:
- I’ll preserve user feedback for import/export, but only as inline header text (no overlays, no toaster infra).

Implementation plan:
1. Update `src/pages/Index.tsx` feedback rendering
   - Remove the floating toast JSX block at the bottom of the component.
   - Insert inline status text inside the Story Builder action group (`world/characters` header actions), immediately after `Save Draft`.
   - Reuse existing state (`storyTransferNotice`) to minimize risk and keep current success/error/info messaging.

2. Keep feedback behavior but make it non-toast
   - Keep the current `setStoryTransferNotice(...)` calls in import/export handlers.
   - Keep timed dismissal effect so inline status clears automatically.
   - Remove any comment text labeling this as “toast”.

3. Styling and UX alignment
   - Use compact inline text style (same transfer-pack pattern): small text, color by tone, truncate long message.
   - Keep message non-blocking and non-overlay (no fixed positioning, no z-layer popups).

4. Verification pass (code-level)
   - Confirm there is no `fixed bottom-*` story transfer notice render left in `Index.tsx`.
   - Confirm import/export still works and produces inline status in the header.
   - Confirm no toast library usage (`useToast`, `Toaster`, `sonner`) remains in app wiring.

Acceptance criteria:
- No floating toast appears anywhere for story import/export.
- Import/export still provides feedback via inline header text only.
- Finalize/Close and other header actions remain in correct order/layout.
