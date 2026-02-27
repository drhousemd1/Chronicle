
## What I found (why your current fix still fails)

You’re right — the previous fix did not fully solve the layout behavior you’re describing.

After reviewing the current implementation in `src/components/chronicle/ChatInterfaceTab.tsx`, the “Main Characters” panel still uses:

- `ScrollableSection maxHeight="400px"` (hard cap)
- hidden scrollbars (`scrollbar-none`)
- nested scroll regions (sidebar container is now `overflow-y-auto`, plus inner `ScrollableSection` is also scrollable)

### Why this still shows only ~2.75 cards
Your character cards are now taller than before (avatar + padding + controls), so `400px` is no longer enough for exactly 3 full tiles.  
With current card height, 400px naturally cuts off part of card 3.

### Why it feels “not scrollable”
Even when technically scrollable, this setup is easy to fail in practice because:
1. Scrollbar is hidden (no visual affordance),
2. Nested scroll containers can steal scroll behavior,
3. Collapsible wrapper uses overflow animation container around scroll content.

So your experience (“still clipped, can’t scroll”) is consistent with the current code.

---

## Revised implementation approach (full fix)

## Goal behavior after fix
1. Main Characters always shows **exactly 3 full cards by default** (when expanded and enough characters exist).
2. If there are more than 3, the list itself clearly scrolls.
3. No clipping of the 3rd card.
4. Works even with collapsible sections enabled.
5. Side Characters remains independently scrollable and not broken by Main list.

---

## Changes to make

### 1) Replace fragile fixed-height guessing with a guaranteed 3-card viewport
**File:** `src/components/chronicle/ChatInterfaceTab.tsx`

- Replace `maxHeight="400px"` for main list with a calculated height that matches card geometry:
  - `height = 3 * cardHeight + 2 * gap`
- Make card height explicit (or enforce a min-height) so this remains stable.
- Example pattern:
  - add `min-h-[132px]` (or measured final value) to each main card root
  - set main list container to `h-[calc(132px*3+0.5rem*2)]` (if gap is `space-y-2`)

This removes guesswork and guarantees 3 full cards, not 2.75.

### 2) Make Main Characters the only scroll owner for that section
**File:** `src/components/chronicle/ChatInterfaceTab.tsx`

- Keep the sidebar body as layout container (`min-h-0`) but avoid relying on outer scroll for character list behavior.
- Ensure the Main Characters list has:
  - `overflow-y-auto`
  - visible or thin scrollbar (not hidden)
- Remove `scrollbar-none` for this list so users can see that more content exists.

### 3) Avoid nested-scroll conflicts
**File:** `src/components/chronicle/ChatInterfaceTab.tsx` + `src/components/chronicle/ScrollableSection.tsx` (if needed)

- Use one scrollable layer per section:
  - Main section scrolls internally for >3 cards
  - Side section scrolls in its own area
- If needed, keep outer sidebar container `overflow-hidden` and rely on section-level scrolling to prevent event contention.

### 4) Keep collapsible animation but prevent clipping side effects
**File:** `src/components/chronicle/ChatInterfaceTab.tsx`

- Keep collapse/expand UI, but avoid placing critical height logic inside a container that masks overflow unpredictably.
- Apply fixed viewport height at the list container level (inside expanded state), not via parent max-height animation hacks.

### 5) Optional hardening for future UI drift
**File:** `src/components/chronicle/ChatInterfaceTab.tsx`

- Introduce constants near render code:
  - `MAIN_CHAR_CARD_MIN_HEIGHT`
  - `MAIN_CHAR_VISIBLE_COUNT`
  - `MAIN_CHAR_GAP`
- Use these constants for both card min-height and container height calc.
- This prevents regressions when card internals change again.

---

## Technical implementation sequence

1. **Main card sizing normalization**
   - Add explicit min-height to main character card root in `renderCharacterCard`.
2. **Main list viewport sizing**
   - Replace `ScrollableSection maxHeight="400px"` with fixed 3-card viewport sizing.
3. **Scrollbar visibility**
   - Remove `scrollbar-none` from Main Characters list; use thin/subtle scrollbar styles.
4. **Scroll ownership cleanup**
   - Adjust parent sidebar overflow behavior to avoid nested conflict.
5. **Side list verification**
   - Ensure Side Characters still expands/collapses and scrolls correctly with remaining space.

---

## Expected result after this revision

- With 4 main characters:
  - Cards 1–3 fully visible.
  - Card 4 accessible via clear scrolling.
- With 2 or 3 main characters:
  - No clipping, no awkward empty cut-off.
- With collapsed/expanded toggles:
  - Smooth behavior, no hidden partial tiles.
- The behavior remains stable even if card content slightly changes later.

---

## Validation checklist (must pass)

1. Open chat with 4+ main characters.
2. Confirm exactly 3 full cards visible in Main Characters.
3. Confirm scrolling reveals all remaining cards.
4. Confirm no clipped third card.
5. Collapse/expand Main Characters and retest.
6. Confirm Side Characters list still scrolls/behaves correctly.
7. Test at common widths (1024, 1366, 1536) to ensure no regression.

---

## Files impacted

- `src/components/chronicle/ChatInterfaceTab.tsx` (primary)
- `src/components/chronicle/ScrollableSection.tsx` (only if we decide to add section-specific scrollbar behavior instead of replacing usage)

This revision directly targets the real failure mode in the current code (hard 400px cap + hidden/nested scroll behavior), not just cosmetic class tweaks.
