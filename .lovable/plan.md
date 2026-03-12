

# Fix Hover Button Wrapping on Story Cards

## Problem
The Edit/Delete/Play buttons use `flex-wrap` which causes them to stack when the card is narrow (at 100% zoom). They need to always stay in one row.

## Solution
In `src/components/chronicle/StoryHub.tsx` (~line 82), two changes:

1. **Remove `flex-wrap`** — prevents buttons from wrapping to a new line
2. **Reduce horizontal padding** from `px-4` to `px-3` on the buttons themselves (lines 85, 91, 97) to give them more room to fit side by side

This keeps the buttons compact enough to always fit in a single row regardless of card width.

### File: `src/components/chronicle/StoryHub.tsx`
- Line 82: Remove `flex-wrap` from the container div
- Lines 85, 91, ~97: Change `px-4` → `px-3` on all three buttons

