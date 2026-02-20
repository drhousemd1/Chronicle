

# Fix Review Modal: Scrolling and Width

## Problem

The Radix `ScrollArea` component isn't scrolling because its viewport doesn't get a concrete height constraint in this custom dialog layout. The "Overall" score is cut off at the bottom.

## Solution

Two changes to `src/components/chronicle/ReviewModal.tsx`:

### 1. Replace ScrollArea with a native scrolling div

Radix `ScrollArea` requires specific height constraints that don't play well with this custom flex layout. Replace it with a plain `div` using `overflow-y-auto flex-1 min-h-0`, which natively respects the flex container's `max-h-[90vh]` constraint.

**Line 107**: Change:
```tsx
<ScrollArea className="flex-1 min-h-0 overflow-hidden">
```
To:
```tsx
<div className="flex-1 min-h-0 overflow-y-auto">
```

**Line 163**: Change closing `</ScrollArea>` to `</div>`

Remove the `ScrollArea` import since it's no longer needed.

### 2. Widen the modal to reduce text wrapping

Change `max-w-lg` (512px) to `max-w-xl` (576px) on line 98 to give more horizontal space, reducing description text wrapping and making the content shorter overall.

**Line 98**: Change `max-w-lg` to `max-w-xl`

These two changes together ensure the content scrolls properly and the Overall score + comment box are always accessible.
