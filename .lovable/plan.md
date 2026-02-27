
Goal: replace the current low-contrast “1 more below” text with a clean, readable, standalone “more content” indicator that is visually separate from the 3rd card and does not overlap or clash with cards/background.

What is currently wrong (confirmed in code and screenshot):
1) The current indicator is just tiny `text-slate-400` + icon on a busy image background, so readability is poor.
2) It sits too close to the card stack visually, so it feels like an artifact rather than intentional UI.
3) It uses a bouncing animation that draws attention in an awkward way.
4) It does not look like a deliberate control/affordance.

Implementation plan

1) Replace the current plain-text indicator with a detached “hint pill” row
- File: `src/components/chronicle/ChatInterfaceTab.tsx`
- Keep indicator outside the scroll container (as requested), but make it a distinct row with its own spacing.
- Structure:
  - Outer row: centered container with `mt-2 mb-2` (or similar) so it is clearly separated from both the 3rd card and the “Side Characters” header.
  - Inner hint pill: `inline-flex items-center gap-1.5 rounded-full px-3 py-1.5`
  - Visual treatment (high contrast, neutral): semi-opaque dark background + light text + subtle border + mild backdrop blur.
- Result: the indicator reads as its own UI element, not something “behind” a card.

2) Improve legibility and simplify message
- Replace tiny low-contrast label with readable semantic text, for example:
  - “More characters below”
- Keep optional count in a subtle badge only if it remains legible, otherwise omit count entirely for cleaner appearance.
- Increase text size slightly (`text-xs`) and use high-contrast color (`text-white/90` style equivalent).

3) Use a static downward cue (no awkward animation)
- Keep a downward chevron icon to satisfy the directional cue request.
- Remove bounce animation from this indicator (or reduce to near-imperceptible if any motion remains).
- This avoids the “gimmicky” feel and keeps the UI mature.

4) Keep behavior logic, only improve presentation
- Continue using existing visibility logic:
  - show only when `mainCharactersForDisplay.length > 3 && canScrollDownMainChars`
  - hide automatically when user reaches bottom of the main character list
- No overlay/absolute positioning for this indicator.
- No visual effect touching cards.

5) Cleanup any now-unused animation utility
- If `animate-bounce-gentle` is no longer used anywhere after this change:
  - remove unused class usage in `ChatInterfaceTab.tsx`
  - optionally remove corresponding custom animation/keyframe from `tailwind.config.ts` (only if unused globally) to keep styles clean.

Validation checklist
1) With 4+ main characters, confirm:
- exactly 3 full cards visible
- a separate hint pill appears below the list
- hint does not overlap any card
2) Scroll to bottom:
- hint disappears cleanly
3) Collapse/expand Main Characters:
- hint state updates correctly
4) Test on busy/light/dark sidebar backgrounds:
- text remains readable and intentional
5) Confirm spacing:
- no clashing with “Side Characters” header

Technical notes
- No backend changes are needed.
- This is a focused front-end refinement in:
  - `src/components/chronicle/ChatInterfaceTab.tsx`
  - possibly `tailwind.config.ts` only for animation cleanup if unused.
