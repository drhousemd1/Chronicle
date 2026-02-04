

# Update Character Roster Panel Styling

## Overview

Update the Character Roster sidebar in the Scenario Builder (WorldTab.tsx) to match the dark charcoal theme used on the right-hand side panels (like Cover Image, Scene Gallery, etc.).

## Current State

The Character Roster panel currently uses a light theme:
- Section headers: `bg-slate-100` with `text-slate-500`
- Add/Create buttons: Light dashed border with slate colors
- Overall sidebar: `bg-white` background

## Target State

Match the dark theme styling from the right-side panels:
- Section headers: Steel blue `bg-[#4a5f7f]` with white text
- Add/Create buttons: Dark theme with blue accent on hover
- Keep the sidebar background light (white) as it contrasts nicely with the dark section headers

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/chronicle/WorldTab.tsx` | Update Main/Side Characters section headers and AddCharacterPlaceholder styling |

---

## Detailed Changes

### 1. Section Headers (Main Characters / Side Characters)

**Before:**
```tsx
<div className="bg-slate-100 px-3 py-1.5 rounded-lg mb-3">
  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Main Characters</div>
</div>
```

**After:**
```tsx
<div className="bg-[#4a5f7f] px-4 py-2 rounded-xl mb-3 shadow-sm">
  <div className="text-[10px] font-bold text-white uppercase tracking-wider">Main Characters</div>
</div>
```

Key styling changes:
- Background: `bg-slate-100` becomes `bg-[#4a5f7f]` (steel blue brand color)
- Text: `text-slate-500` becomes `text-white`
- Padding: Slightly increased for better visual weight
- Border radius: `rounded-lg` becomes `rounded-xl` to match other elements
- Added subtle shadow for depth

### 2. AddCharacterPlaceholder Button

**Before:**
```tsx
<button className="group/add w-full flex items-center gap-4 p-2 rounded-2xl transition-all duration-300 hover:bg-blue-50/50 cursor-pointer">
  <div className="w-14 h-14 shrink-0 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300 ...">
    <span className="text-2xl font-light">+</span>
  </div>
  <div className="text-left">
    <div className="text-xs font-bold text-slate-400 group-hover/add:text-blue-600 ...">Add / Create</div>
    <div className="text-[9px] font-black text-slate-300 group-hover/add:text-blue-300 ...">Character Registry</div>
  </div>
</button>
```

**After:**
```tsx
<button className="group/add w-full flex items-center gap-4 p-2 rounded-2xl transition-all duration-300 bg-slate-100/50 hover:bg-blue-50 border-2 border-dashed border-slate-300 hover:border-blue-400 cursor-pointer">
  <div className="w-14 h-14 shrink-0 rounded-xl bg-white border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 transition-all duration-300 group-hover/add:border-blue-400 group-hover/add:bg-blue-50 group-hover/add:text-blue-500">
    <span className="text-2xl font-light">+</span>
  </div>
  <div className="text-left">
    <div className="text-xs font-bold text-slate-500 group-hover/add:text-blue-600 transition-colors uppercase tracking-tight">Add / Create</div>
    <div className="text-[9px] font-black text-slate-400 group-hover/add:text-blue-400 uppercase tracking-widest mt-0.5">Character Registry</div>
  </div>
</button>
```

Key styling changes:
- Added background to the whole button: `bg-slate-100/50`
- Added outer dashed border to match the memory note pattern
- Improved contrast on text colors
- Better hover states with blue accent

---

## Visual Comparison

```text
BEFORE                           AFTER
┌────────────────────┐          ┌────────────────────┐
│ Character Roster   │          │ Character Roster   │
├────────────────────┤          ├────────────────────┤
│ ┌────────────────┐ │          │ ┌────────────────┐ │
│ │ Main Characters│ │ (light)  │ │ MAIN CHARACTERS│ │ (steel blue)
│ └────────────────┘ │          │ └────────────────┘ │
│  [avatar] Name     │          │  [avatar] Name     │
│  ┌- - - - - - - ─┐ │          │ ┌─ ─ ─ ─ ─ ─ ─ ─┐ │
│  │ + Add/Create  │ │          │ │  + Add/Create │ │ (dashed border)
│  └- - - - - - - ─┘ │          │ └─ ─ ─ ─ ─ ─ ─ ─┘ │
│ ┌────────────────┐ │          │ ┌────────────────┐ │
│ │ Side Characters│ │ (light)  │ │ SIDE CHARACTERS│ │ (steel blue)
│ └────────────────┘ │          │ └────────────────┘ │
└────────────────────┘          └────────────────────┘
```

---

## Implementation Summary

1. Update both "Main Characters" and "Side Characters" header divs to use steel blue background with white text
2. Update AddCharacterPlaceholder to have a more prominent dashed border style matching the interactive button pattern from other sections
3. Keep the sidebar background white for contrast

This creates visual consistency between the Character Roster panel and the dark-themed sections on the right side while maintaining the app's established design language.

