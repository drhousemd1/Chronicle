
Goal
- Redesign the “more content” indicator in Main Characters so it feels like a deliberate stacked element, not a detached pill, while using tighter spacing and consistent alignment with existing cards.

What will be changed

1) Match vertical spacing to existing card-to-card spacing exactly
- File: `src/components/chronicle/ChatInterfaceTab.tsx`
- Current list uses `space-y-2` between cards and also `pb-2` at the bottom, while indicator uses `mt-2`, which compounds into extra whitespace.
- Update the main-character list wrapper so the bottom padding does not add extra gap before the indicator:
  - Change from fixed `space-y-2 pb-2` to conditional spacing:
    - when the indicator can appear (more than 3 cards): keep `space-y-2` and remove bottom padding (`pb-0`)
    - otherwise keep `pb-2` behavior for normal breathing room.
- Keep indicator top margin at exactly `mt-2` so the visual gap from third card to indicator equals the card-to-card gap.

2) Make the indicator as wide as cards and visually integrated with the stack
- Replace the current small “hint pill” with a full-width card-like row directly below the list.
- Styling will mirror card surface treatment so it reads as same family:
  - `w-full`
  - same rounded profile as cards (`rounded-2xl`)
  - same/similar surface color (`bg-white/30` with subtle blur)
  - subtle border treatment consistent with cards.
- Height will be compact (not full card height), but width will match cards exactly.

3) Center-only content with arrow + numeric count (no words)
- In the center of the new row:
  - downward chevron icon
  - numeric hidden-count only: `{mainCharactersForDisplay.length - 3}`
- Remove all words like “more below”.
- Keep contrast high enough to read over sidebar backgrounds (avoid low-contrast slate text).

4) Keep bottom spacing to Side Characters consistent
- Remove extra bottom margin from indicator container (no added `mb-*`).
- Let parent layout (`gap-4` on sidebar stack) provide the same section-to-section spacing used elsewhere.
- This keeps spacing below the indicator aligned with the rest of stacked sections, including the Side Characters title bar.

5) Keep behavior logic unchanged
- Indicator visibility remains:
  - `mainCharactersForDisplay.length > 3 && canScrollDownMainChars`
- It still disappears when user reaches the bottom of the scroll area.
- No absolute overlays, no touching/overlapping character cards.

Concrete implementation targets
- `src/components/chronicle/ChatInterfaceTab.tsx`
  - update list bottom spacing logic near the main-character list wrapper
  - replace current centered black hint pill block with full-width card-like indicator block
  - retain existing scroll state logic (`canScrollDownMainChars`)
- `tailwind.config.ts`
  - no new animation needed; likely no edits required for this revision.

Validation checklist
1) With 4+ main characters:
- gap between card 2→3 and card 3→indicator is visually equal.
2) Indicator width:
- full width matches character cards.
3) Indicator content:
- only chevron + number, centered, no text label.
4) Spacing to next section:
- distance from indicator to “Side Characters” header matches existing section rhythm.
5) Scroll behavior:
- indicator hides at bottom and reappears when scrolled up.
