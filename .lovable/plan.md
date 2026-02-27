
Goal
- Make spacing mathematically consistent and remove the oversized gap:
  1) gap between 3rd main card and overflow indicator = same as card-to-card gap
  2) gap between overflow indicator and “Side Characters” header = same as “Main Characters” header to 1st card
- Keep arrow/count dark for readability (black), as requested.

What is causing the mismatch now
- The parent stack uses `gap-4` (1rem) between sections.
- The indicator also has `mb-3` (0.75rem).
- Combined, this creates a much larger gap before “Side Characters” than intended.
- That is why it still looks wrong even after prior changes.

Implementation changes (single file)
- File: `src/components/chronicle/ChatInterfaceTab.tsx`

1) Keep card-to-indicator spacing equal to card spacing
- Keep inner list container at `space-y-2 pb-2`.
- Keep indicator top margin at `mt-0`.
- This preserves a clean 0.5rem gap from 3rd card to indicator (same as card-to-card).

2) Remove extra bottom spacing added by the indicator
- Remove `mb-3` from the indicator block.

3) Make section-to-section spacing match header-to-first-card spacing exactly (0.75rem)
- Adjust the parent vertical stack from `gap-4` to `gap-3`.
- Since `gap-3` = 0.75rem, this makes the distance from overflow indicator to “Side Characters” header match the “Main Characters” header to first card spacing.
- This also keeps layout rhythm consistent across that column instead of mixing multiple spacing systems.

4) Preserve requested color treatment
- Keep icon and number as dark text (`text-black/80`) with no text label.

Expected result
- 3rd card → indicator gap: same as card-to-card.
- Indicator → “Side Characters” header gap: same as header → first card.
- Arrow and count remain black and readable.
- No behavior changes to scroll logic or overflow visibility conditions.

Validation checklist
1) With 4+ main characters:
- Confirm card-to-card and card-to-indicator gaps are visually identical.
2) Confirm indicator-to-side-header spacing equals main-header-to-first-card spacing.
3) Confirm chevron and number are black (no white text).
4) Scroll down in Main Characters:
- indicator hides at bottom and reappears when not at bottom.
