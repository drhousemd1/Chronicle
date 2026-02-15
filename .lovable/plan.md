

# Shrink Chat Bubbles and Add More Spacing

## What's changing

Two adjustments to make the background images more visible behind chat messages:

1. **Narrower bubbles** -- Reduce the maximum width of chat bubbles so they don't span the entire chat area, leaving more background visible on the left and right.
2. **More vertical spacing** -- Increase the gap between messages so the background peeks through between them.

## Technical Details

**File:** `src/components/chronicle/ChatInterfaceTab.tsx`

### Change 1: Increase horizontal padding on the scroll container (line 2771)

Current: `px-4 md:px-8 lg:px-12`
New: `px-6 md:px-14 lg:px-20`

This adds more breathing room on the left and right edges.

### Change 2: Increase vertical spacing between messages (line 2771)

Current: `space-y-6`
New: `space-y-10`

More gap between each message bubble so the background shows through.

### Change 3: Reduce max-width of message bubbles (lines 2794-2797)

Current:
- Non-offset mode: `max-w-7xl` (80rem / 1280px)
- Offset mode: `max-w-4xl` (56rem / 896px)

New:
- Non-offset mode: `max-w-4xl` (56rem / 896px)
- Offset mode: `max-w-3xl` (48rem / 768px)

This pulls the bubbles in from both sides, letting the background image show through.

