
# Add Drop Shadow to Character Goals Container

## Overview

The Character Goals section container currently has a basic `shadow-xl` which isn't very visible on dark backgrounds. I'll update it to use the same prominent drop shadow used on other parent containers throughout the app.

---

## Change

### Current Styling (line 229)
```tsx
<div className="w-full bg-[#2a2a2f] rounded-[24px] border border-white/10 overflow-hidden shadow-xl">
```

### Updated Styling
```tsx
<div className="w-full bg-[#2a2a2f] rounded-[24px] border border-white/10 overflow-hidden shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)]">
```

---

## Shadow Value Explanation

The custom shadow `shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)]` provides:
- **0**: No horizontal offset
- **12px**: Vertical offset (shadow appears below the element)
- **32px**: Large blur radius for a soft, spread-out shadow
- **-2px**: Negative spread to keep the shadow contained
- **rgba(0,0,0,0.50)**: 50% black opacity for a strong, visible shadow

This matches the shadow used on:
- Folder cards in ImageLibraryTab
- Scenario cards in ScenarioHub  
- Image picker modal folders

---

## File to Modify

| File | Line | Change |
|------|------|--------|
| `src/components/chronicle/CharacterGoalsSection.tsx` | 229 | Replace `shadow-xl` with `shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)]` |
