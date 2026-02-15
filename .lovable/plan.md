

# Fix: Text Input Area Styling

## Problem

The text input area currently shows two nested dark shapes with uneven padding — wider on the sides than top/bottom. This happens because the `TextArea` component from `UI.tsx` wraps the `<textarea>` in a `<div>`, and the current styling applies padding directly to the inner textarea (`!py-4 !px-6`) rather than creating a uniform border padding on the outer wrapper.

## Solution

Restructure the input area so the layout is:

1. **Outer wrapper** -- `bg-[hsl(var(--ui-surface-2))]` (same color as the buttons), uniform thin padding (e.g., `p-2`), `rounded-2xl`, with the `ui-border` border. This acts as the visible "frame" around the text area.
2. **Inner textarea** -- `bg-[#1e2028]` (hint box color), `rounded-xl`, white text, no extra border. This is the actual typing surface.

This creates a clear delineation: the lighter button-colored frame surrounds the darker input field, with uniform spacing on all sides.

## Technical Details

- **File**: `src/components/chronicle/ChatInterfaceTab.tsx`
- **Change**: Replace the current `<TextArea>` usage (lines 3134-3144) with a wrapping div that provides the uniform padding/border, and move the textarea styling so the inner element has only the dark background and text color. Since the `TextArea` component from `UI.tsx` applies `className` to both the wrapper div and the inner element (per the existing architecture note), we will bypass the wrapper by using a raw `<textarea>` element directly, giving us full control over the two-layer styling without the "bubble-in-bubble" issue.

**Structure:**
```text
[Outer div: bg-[hsl(var(--ui-surface-2))], border-[hsl(var(--ui-border))], p-2, rounded-2xl]
  [textarea: bg-[#1e2028], rounded-xl, text-white, w-full, no border]
```

- Padding will be uniform (`p-2`) on all four sides
- The outer container color matches the Chat Settings / Generate Image / Send buttons
- The inner textarea uses the dark hint-box color for clear contrast

