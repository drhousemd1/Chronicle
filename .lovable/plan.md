

# Test: Add Text Drop Shadow to My Stories Cards

## What We're Testing
Adding a CSS `text-shadow` to the bottom info section of story cards (title, description, stats, attribution) to see if it improves readability against cover images.

## Change
**File: `src/components/chronicle/StoryHub.tsx`** — one line change

Add `drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]` (or use inline `style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}`) to the bottom info container at **line 104**:

```
- <div className="absolute inset-x-0 bottom-0 p-4 pb-5 pointer-events-none flex flex-col">
+ <div className="absolute inset-x-0 bottom-0 p-4 pb-5 pointer-events-none flex flex-col" style={{ textShadow: '0 2px 6px rgba(0,0,0,0.7)' }}>
```

This single inline style on the parent will cascade to the title, description, stats icons/text, and "Created by" — all elements get the shadow. Easy to revert by removing that one `style` prop.

