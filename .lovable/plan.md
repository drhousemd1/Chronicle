
Goal: make the View More modal scrollbar definitively dark (black) and remove the brittle selector that failed.

Plan

1) Fix the root cause in the ScrollArea component API (not via DOM-guess selectors)
- File: `src/components/ui/scroll-area.tsx`
- Add optional props to `ScrollArea`:
  - `scrollbarClassName?: string`
  - `thumbClassName?: string`
- Thread these into `ScrollBar`, and apply `thumbClassName` directly on `ScrollAreaPrimitive.ScrollAreaThumb` with `cn(...)`.
- Keep existing defaults (`bg-border`) so other screens do not change unless explicitly overridden.

2) Apply explicit black scrollbar styling in the View More modal
- File: `src/components/chronicle/StoryDetailModal.tsx`
- Update the right-column `ScrollArea` usage:
  - Remove the broken class: `[&_[data-radix-scroll-area-thumb]]:bg-white/20`
  - Pass explicit props instead, e.g.:
    - `thumbClassName="bg-black"` (pure black, exact request)
    - `scrollbarClassName="bg-transparent"` (or no extra track tint if preferred)
- Keep existing layout/border classes unchanged.

3) Keep modal-dismiss behavior unchanged
- Retain current overlay click-to-close implementation (already fixed and working).
- No behavioral changes except scrollbar color reliability.

Technical details (why previous attempt failed)
- Session replay shows the rendered thumb is:
  - `class="relative flex-1 rounded-full bg-border"`
- The attempted selector targeted `[data-radix-scroll-area-thumb]`, but that attribute is not present on the thumb node, so no override applied.
- Direct prop-based thumb styling avoids fragile attribute assumptions and ensures predictable color control.

Validation checklist
- Open View More modal and confirm scrollbar thumb is black at rest and while dragging.
- Confirm it no longer appears light/white in this modal.
- Confirm clicking outside modal still closes it.
- Quick regression: other `ScrollArea` usages look unchanged unless explicitly styled.
