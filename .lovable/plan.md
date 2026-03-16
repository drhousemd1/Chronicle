

# Add Gradient + Gloss Effects to Active Sort/Filter Pills

## Summary
Apply the same gradient and gloss sheen treatment (used on sidebar items and logo) to the active-state pill buttons on the Community Gallery and My Stories filter bars.

## Current State
All active pills use flat `bg-[#4a5f7f] text-white shadow-sm`. There are 3 locations in `src/pages/Index.tsx`:

1. **My Stories hub filter pills** (lines 1920-1967) — 5 pills: My Stories, Saved Stories, Published, Drafts, All
2. **Community Gallery sort pills** (lines 2052-2055) — 6 pills: All Stories, Recent, Liked, Saved, Played, Following
3. **Account tab pills** (lines 2692-2695) — mentioned but user only asked for Gallery + My Stories

## Changes — `src/pages/Index.tsx`

### Active pill class update (all instances for Gallery + My Stories)
Replace the active state:
```
"bg-[#4a5f7f] text-white shadow-sm"
```
With:
```
"relative overflow-hidden bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] border-t border-white/20 text-white shadow-sm"
```

### Add gloss sheen overlay
Each active pill button needs a sheen div inside it. Since these are simple `<button>` elements with text content, wrap the label text in `<span className="relative z-[1]">` and add the sheen div:
```html
<button className="...active classes...">
  <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/[0.07] via-transparent to-transparent pointer-events-none" />
  <span className="relative z-[1]">My Stories</span>
</button>
```

This applies to:
- 5 My Stories filter pills (lines 1917-1970)
- 6 Gallery sort pills (line 2048 loop)

The Gallery pills are rendered in a `.map()` loop so only one code change is needed there. The My Stories pills are individual buttons so each needs updating.

### Files Changed
- `src/pages/Index.tsx` — active pill styling at 2 locations (My Stories filters + Gallery sort)

