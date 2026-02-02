

# Side-by-Side Layout + AI Generate Button Styling Fix

## Overview

Three changes requested:
1. Switch buttons back to horizontal (side-by-side) layout
2. Remove the ChevronDown icon from the Upload Image button
3. Fix the AI Generate button styling to match the mockup

---

## Detailed Visual Analysis: AI Generate Button

### Mockup (Image 2) vs Current (Image 3)

| Property | Mockup | Current | Fix Required |
|----------|--------|---------|--------------|
| **Base background** | Deep navy `~hsl(220, 25%, 16%)` | Lighter gray `hsl(228, 7%, 20%)` | Use darker, bluer base |
| **Gradient direction** | Horizontal (left-to-right): teal on LEFT, purple on RIGHT | Vertical (top-to-bottom) | Change to `bg-gradient-to-r` |
| **Gradient strength** | Strong, visible colored glows at edges | Very subtle, barely visible | Increase opacity from 0.22/0.18 to ~0.35/0.30 |
| **Teal glow position** | LEFT side of button | Top of button | Left side via `from-` position |
| **Purple glow position** | RIGHT side of button | Bottom of button | Right side via `to-` position |
| **Sparkles icon** | Teal/cyan colored (matches glow) | White/gray (same as text) | Add `text-[hsl(var(--accent-teal))]` to icon |
| **Border visibility** | Very subtle, almost invisible | Visible white/10 | Reduce to `white/5` or remove |
| **Overall feel** | Rich, glowing, premium | Flat, muted | More saturation + stronger gradient |

---

## Implementation

### File: `src/components/chronicle/AvatarActionButtons.tsx`

### 1. Change Layout to Side-by-Side

```tsx
// Line 34: Change from vertical to horizontal
<div className="flex gap-2 w-full">
```

### 2. Remove ChevronDown Icon from Upload Button

```tsx
// Line 51: Delete this line entirely
<ChevronDown className="w-3.5 h-3.5 shrink-0" />
```

Also remove `ChevronDown` from the imports on line 2.

### 3. Fix AI Generate Button Styling

**Current gradient (wrong direction, too subtle):**
```tsx
<span className="absolute inset-0 bg-gradient-to-b from-[hsl(var(--accent-teal)/0.22)] to-[hsl(var(--accent-purple)/0.18)]" />
```

**Fixed gradient (horizontal, stronger):**
```tsx
<span className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--accent-teal)/0.35)] to-[hsl(var(--accent-purple)/0.30)]" />
```

**Make the Sparkles icon teal colored:**
```tsx
// Current
<Sparkles className="w-3.5 h-3.5 shrink-0" />

// Fixed
<Sparkles className="w-3.5 h-3.5 shrink-0 text-[hsl(var(--accent-teal))]" />
```

**Reduce border visibility:**
```tsx
// Current
border border-[hsl(var(--ui-border))]

// Fixed - more subtle
border border-white/5
```

**Darken the base background layer for more contrast:**
```tsx
// Current base
<span className="absolute inset-0 bg-[hsl(var(--ui-surface-2))]" />

// Fixed - darker, bluer base
<span className="absolute inset-0 bg-[hsl(220_25%_16%)]" />
```

---

## Summary of Changes

| Change | Location | Before | After |
|--------|----------|--------|-------|
| Layout direction | Line 34 | `flex flex-col gap-2` | `flex gap-2` |
| ChevronDown import | Line 2 | Imported | Remove from imports |
| ChevronDown in button | Line 51 | `<ChevronDown .../>` | Delete entirely |
| Gradient direction | Line 90 | `bg-gradient-to-b` | `bg-gradient-to-r` |
| Gradient opacity | Line 90 | `0.22/0.18` | `0.35/0.30` |
| Background base | Line 88 | `bg-[hsl(var(--ui-surface-2))]` | `bg-[hsl(220_25%_16%)]` |
| Border | Line 81 | `border-[hsl(var(--ui-border))]` | `border-white/5` |
| Sparkles icon | Line 95 | No color class | Add `text-[hsl(var(--accent-teal))]` |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/chronicle/AvatarActionButtons.tsx` | Layout to horizontal, remove chevron, fix AI Generate styling |

