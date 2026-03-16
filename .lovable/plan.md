

# Add Gradient + Gloss Effects to Logo Symbol

## Current State
The "C" logo icon at lines 1683 and 1711 in `src/pages/Index.tsx` uses a flat `bg-[#4a5f7f]` background. The existing glow effect (`shadow-xl shadow-[#4a5f7f]/30`) stays.

## Changes — `src/pages/Index.tsx`

### 1. Update logo icon classes (lines 1683 and 1711)
Replace `bg-[#4a5f7f]` with `bg-gradient-to-b from-[#5a7292] to-[#4a5f7f]` and add `border-t border-white/20 relative overflow-hidden`.

### 2. Add gloss sheen overlay
Insert inside each logo div (before the "C" text):
```html
<div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/[0.07] via-transparent to-transparent pointer-events-none" />
```
Wrap the "C" text in a `<span className="relative z-[1]">C</span>`.

### 3. Both instances
- Line 1683 (loading state)
- Line 1711 (sidebar header)

### Files Changed
- `src/pages/Index.tsx` — logo icon at 2 locations

