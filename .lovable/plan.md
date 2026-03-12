

# Fix: Slide-Up Overlay Height

The overlay at `h-[45%]` is way too tall — it covers the text area and sits behind buttons, defeating its purpose. The bottom info section (title + description + stats + author) takes up roughly 25% of the card height. The overlay should only cover that area, sitting just above the title.

## Change in `src/components/chronicle/StoryHub.tsx`

**Line 82**: Reduce overlay height from `h-[45%]` to `h-[25%]`:

```tsx
// FROM:
<div className="absolute inset-x-0 bottom-0 h-[45%] bg-black/70 pointer-events-none translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out z-[1]" />

// TO:
<div className="absolute inset-x-0 bottom-0 h-[25%] bg-black/70 pointer-events-none translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out z-[1]" />
```

This keeps the overlay snug behind the text block without reaching the action buttons.

