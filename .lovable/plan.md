

# Fix Overflow Indicator Spacing and Colors

## Problems
1. **Extra spacing** between 3rd card and indicator -- the cards use `space-y-2` (0.5rem) between each other, but the indicator sits outside the scroll container with `mt-2` which compounds with the container boundary, creating a larger gap than card-to-card.
2. **No bottom spacing** before "Side Characters" header -- the section after the indicator lacks the same `mb-3` rhythm used between headers and content.
3. **White text** on the arrow and number when everything else on this background uses dark/black text.

## Changes

**File: `src/components/chronicle/ChatInterfaceTab.tsx`**

1. Fix the scroll container's bottom padding: remove the conditional `pb-2` logic entirely -- the `space-y-2` on the inner div handles card gaps, and the indicator handles the bottom. Add a small `pb-[0.5rem]` always so the last card in the scroll area has breathing room matching card-to-card gap.

2. Change indicator top margin from `mt-2` to `mt-0` -- the scroll container's bottom padding already provides the 0.5rem gap, so no additional margin is needed on the indicator itself. This ensures the gap from 3rd card to indicator exactly matches card-to-card spacing.

3. Change indicator text/icon colors from `text-white/90` to `text-black/80` for both the `ChevronDown` icon and the number `span`.

4. Add `mb-3` to the indicator (or its wrapper) so the spacing from indicator to "Side Characters" header matches the `mb-3` used between "Main Characters" header and the first card.

## Technical Detail

Lines ~3075: Change `space-y-2 ${conditional pb}` to just `space-y-2 pb-2` (always).

Lines ~3096-3101: Update the indicator div:
- Change `mt-2` to `mt-0` (scroll container's `pb-2` provides the gap)
- Add `mb-3` for consistent spacing to next section header
- Change `text-white/90` to `text-black/80` on both icon and span

