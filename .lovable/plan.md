

# Fix: Replace Ugly Gradient Overlay With Clean "More Below" Indicator

## Problem
The current bottom-fade gradient overlaps the third character card, creating a messy visual effect. It looks like a smudge sitting on top of the card content.

## Solution
Remove the gradient overlay entirely. Instead, add a small, standalone row **below** the scrollable list (outside the scroll container) with a subtle downward arrow icon and text like "scroll for more". This element sits in its own space, doesn't touch or overlap any card.

## Visual concept

```text
+---------------------------+
|  Character Card 1         |
|  Character Card 2         |
|  Character Card 3         |
+---------------------------+
                             
      ChevronDown icon       <-- standalone row, not overlapping
      "X more below"
```

## Changes

**File:** `src/components/chronicle/ChatInterfaceTab.tsx`

1. **Remove** the `relative` wrapper div and the gradient overlay element (lines 3065, 3095-3100, 3101).
2. **Add** a new element *after* the scroll container (but still inside the collapsible wrapper), only rendered when `mainCharactersForDisplay.length > 3 && canScrollDownMainChars`:
   - A centered row with a small `ChevronDown` icon (from lucide) and muted text showing how many more characters are hidden
   - Styled to match the sidebar aesthetic: small muted text, subtle animation (gentle bounce on the arrow)
   - Completely separate from the card list -- has its own padding/margin, no absolute positioning, no overlapping
3. **Update scroll state**: keep the existing `canScrollDownMainChars` logic so the indicator hides once user scrolls to bottom.

The indicator will show something like: a small bouncing down-chevron with "{n} more" in muted text, sitting cleanly below card 3.

**Single file changed:** `src/components/chronicle/ChatInterfaceTab.tsx`
