
# Fix HintBox Background to Match Cover Image Placeholder

## The Issue

Looking at the screenshot, there's a visible color mismatch:
- **Cover Image Placeholder**: Uses `bg-gradient-to-br from-zinc-800 to-zinc-900` (darker, solid)
- **HintBox**: Uses `bg-zinc-800/80` (lighter due to 80% opacity showing through the container)

The placeholder appears much darker because:
1. It uses `zinc-900` (`#18181b`) as the gradient end color
2. It has no transparency

## Solution

Change the HintBox background from `bg-zinc-800/80` to `bg-zinc-900` to use the exact same dark color as the bottom of the placeholder gradient, with full opacity.

---

## Technical Change

**File:** `src/components/chronicle/WorldTab.tsx` (line 41)

```tsx
// Current
<div className="bg-zinc-800/80 rounded-xl p-4 space-y-2 border border-white/5">

// Updated  
<div className="bg-zinc-900 rounded-xl p-4 space-y-2 border border-white/5">
```

| Property | Current | Updated |
|----------|---------|---------|
| Background | `bg-zinc-800/80` | `bg-zinc-900` |
| Color Value | `#27272a` at 80% opacity | `#18181b` at 100% |

---

## Why This Works

- `zinc-900` (`#18181b`) is the same dark color used in the `to-zinc-900` part of the placeholder gradient
- Removing the `/80` transparency ensures the box appears as dark as the placeholder
- The visual result will be a matching dark background between both elements
