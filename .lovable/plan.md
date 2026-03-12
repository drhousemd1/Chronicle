

# Fix: Use Crisp Text Shadow Instead of Blobby Halo

## Problem
The current `textShadow: '0 2px 8px rgba(0,0,0,1), 0 0 20px rgba(0,0,0,0.9)'` uses large blur radii (8px, 20px) at full opacity, creating a dark rectangular blob behind the text instead of a shadow that conforms to the letter shapes.

## Solution
Replace with a tight, multi-layer shadow using tiny blur values that hug the letterforms:

**File: `src/components/chronicle/StoryHub.tsx`** — line 104

```tsx
// From:
style={{ textShadow: '0 2px 8px rgba(0,0,0,1), 0 0 20px rgba(0,0,0,0.9)' }}

// To:
style={{ textShadow: '0 1px 2px rgba(0,0,0,0.9), 0 2px 4px rgba(0,0,0,0.7), 0 0 1px rgba(0,0,0,0.9)' }}
```

The 1-2px blur layers trace letter shapes closely, while the third layer (0 0 1px) adds a thin outline effect. This produces a readable, natural-looking shadow rather than a dark blob. Still a single `style` prop — easy to revert.

