

# Hover Slide-Up Dark Overlay on Story Cards

## What
Add a darker overlay panel that slides up from the bottom of each story card on hover, stopping just above the title. This creates a cinematic "reveal" effect that makes the bottom text pop even more. Since this is experimental, the implementation will be clean and easy to remove.

## How

**File**: `src/components/chronicle/StoryHub.tsx` (ScenarioCard component)

Add a new `div` between the existing flat overlay (line 79) and the hover actions (line 82). This div will:
- Be absolutely positioned at the bottom, covering roughly the bottom 45% of the card
- Use `bg-black/70` for the darker opacity
- Animate with `translate-y-full` by default, sliding to `translate-y-0` on `group-hover`
- Use `transition-transform duration-500 ease-out` for a smooth slide
- Stay `pointer-events-none` so it doesn't interfere with clicks

```tsx
{/* Hover slide-up dark overlay - experimental */}
<div className="absolute inset-x-0 bottom-0 h-[45%] bg-black/70 pointer-events-none translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out z-[1]" />
```

The existing bottom info div (z-index is implicitly above due to DOM order or we bump it) will sit on top of this overlay, making the title/description/stats significantly more readable on hover.

One line addition, one file. Easy to remove later.

