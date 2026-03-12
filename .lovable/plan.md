

# Fix Scrollbar Color and Click-Outside-to-Close on Story Detail Modal

## Problems
1. **White scrollbar**: The `ScrollArea` on the right column uses the default `bg-border` thumb color, which renders as a white/light bar against the dark modal background.
2. **No click-outside-to-close**: The modal uses a raw `<div>` wrapper instead of `DialogContent`, so clicking the overlay doesn't close it. Every other modal in the app allows clicking outside to dismiss.

## Changes

### File: `src/components/chronicle/StoryDetailModal.tsx`

**1. Click-outside-to-close (line 232)**
Add an `onClick` handler to the outer overlay `<div>` that calls `onOpenChange(false)`. The inner modal container already has `e.stopPropagation()` (line 235), so clicks inside the modal won't bubble up.

```tsx
// Line 232: Add onClick to the overlay div
<div className="fixed inset-0 z-50 flex items-center justify-center p-4"
     onClick={() => onOpenChange(false)}>
```

**2. Dark scrollbar (line 374)**
Add a custom className to the `ScrollArea`'s `ScrollBar` thumb to use a dark color. Since `ScrollArea` doesn't expose a thumb class prop, we'll style it via a CSS class on the `ScrollArea` wrapper:

```tsx
<ScrollArea className="flex-1 md:border-l border-[#4a5f7f] [&_[data-radix-scroll-area-thumb]]:bg-white/20">
```

This targets the Radix scroll thumb via attribute selector and sets it to a subtle `bg-white/20` that fits the dark theme.

