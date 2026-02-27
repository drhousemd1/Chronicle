

# Add "More Characters Below" Visual Indicator

## What
When there are more than 3 main characters, add a bottom fade/gradient overlay at the bottom of the character list to hint that more cards exist below the visible area -- similar to how `ScrollableSection` already works with its bottom fade indicator.

## Change

**File:** `src/components/chronicle/ChatInterfaceTab.tsx` (lines ~3062-3083)

Wrap the scrollable character list `div` in a `relative` container and add a conditional bottom gradient overlay when `mainCharactersForDisplay.length > 3`:

- Add a `relative` wrapper around the scrollable div
- Add an absolutely-positioned bottom gradient that fades from transparent to the sidebar's background tone (a warm semi-transparent white, matching the sidebar aesthetic)
- The gradient should be ~32px tall, `pointer-events-none`, and sit at `z-10`
- Only render it when there are more than 3 characters
- Optionally: hide the gradient when the user has scrolled to the bottom (using a simple scroll listener + state, mirroring the pattern from `ScrollableSection.tsx`)

This gives a clear visual cue that more content is below without being intrusive.

### Technical detail

```text
+---------------------------+
|  Character Card 1         |
|  Character Card 2         |
|  Character Card 3         |
|  ~~~~~~~~fade~~~~~~~~~~~~ |  <-- gradient overlay (only when >3 chars)
+---------------------------+
   (scroll to see Card 4+)
```

The gradient colors will use `from-transparent to-white/60` (or similar warm tone) to blend naturally with the sidebar background.

A scroll event handler on the list div will track whether the user is at the bottom -- if so, hide the fade (same logic as `ScrollableSection`'s `canScrollDown` pattern).

**Single file changed:** `src/components/chronicle/ChatInterfaceTab.tsx`
