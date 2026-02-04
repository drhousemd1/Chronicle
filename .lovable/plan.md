
# Update HintBox Background to Match Cover Image Placeholder

## Overview

Make the HintBox background match the dark color used in the "NO COVER" placeholder image area.

---

## Current Colors

**Cover Image Placeholder:**
- Uses `bg-gradient-to-br from-zinc-800 to-zinc-900`
- `zinc-800` = `#27272a`
- `zinc-900` = `#18181b`

**Current HintBox:**
- Uses `bg-[#2a2a2f]/50` (semi-transparent, lighter)

---

## Change

**File:** `src/components/chronicle/WorldTab.tsx` (line 41)

| Element | Current | Updated |
|---------|---------|---------|
| Background | `bg-[#2a2a2f]/50` | `bg-zinc-800/80` |

The `zinc-800/80` provides a solid darker background that matches the cover image placeholder while maintaining slight transparency for blending.

```tsx
// Current
<div className="bg-[#2a2a2f]/50 rounded-xl p-4 space-y-2 border border-white/5">

// Updated
<div className="bg-zinc-800/80 rounded-xl p-4 space-y-2 border border-white/5">
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/chronicle/WorldTab.tsx` | Line 41 - change `bg-[#2a2a2f]/50` to `bg-zinc-800/80` |
