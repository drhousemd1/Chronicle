

# Change Story Card Title Weight to Match Header Buttons

## File: `src/components/chronicle/WorldTab.tsx`

**Line 513** — Change `font-bold` to `font-semibold` (keeping `text-xl`):

```tsx
// From:
<h2 className="text-white text-xl font-bold tracking-tight">Story Card</h2>

// To:
<h2 className="text-white text-xl font-semibold tracking-tight">Story Card</h2>
```

One word change: `font-bold` (700) → `font-semibold` (600). Size stays the same.

