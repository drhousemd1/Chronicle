

# Fix Reposition Button Styling on Character Builder

## Problem
The Reposition button in CharactersTab uses the Chronicle `Button` component with `variant="secondary"` which renders as a white/light button. It should use the Shadow Surface dark styling matching the Story Builder's Reposition button.

## Change

**File**: `src/components/chronicle/CharactersTab.tsx` (line 746-752)

Keep the `Button` component and its current sizing (`w-full`), but override the colors via className:

- **Default state**: Add `bg-[hsl(240_6%_18%)] border-[hsl(0_0%_100%_/_0.10)] text-[hsl(var(--ui-text))] hover:bg-[hsl(240_6%_22%)] shadow-[0_10px_30px_hsl(0_0%_0%_/_0.35)] uppercase tracking-wider`
- **Active (repositioning) state**: Keep `bg-blue-500 text-white`

The `w-full text-[10px] font-bold leading-none` sizing stays exactly as-is.

