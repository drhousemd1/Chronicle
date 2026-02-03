

# Condensed View Styling + Header Cleanup

## Overview

Two sets of changes:
1. **Update condensed view styling** - Vertical layout with dimmer text and better spacing
2. **Clean up section headers** - Remove green "Section" label, make header text pure white

---

## Changes

### 1. Remove "Section" Label & Fix Header Color

Both files have the same pattern that needs updating:

**Current header (both files):**
```tsx
<div className="flex items-center gap-3">
  <span className="text-[#a5d6a7] font-bold tracking-wide uppercase text-xs">Section</span>
  <h2 className="text-[#e8f5e9] text-xl font-bold tracking-tight">{title}</h2>
</div>
```

**Updated header:**
```tsx
<h2 className="text-white text-xl font-bold tracking-tight">{title}</h2>
```

Color changes:
| Element | Current | Updated |
|---------|---------|---------|
| "Section" label | `text-[#a5d6a7]` (green) | **Removed entirely** |
| Title | `text-[#e8f5e9]` (greenish white) | `text-white` (pure white) |

---

### 2. Update `CollapsedFieldRow` to Vertical Layout

**Current (horizontal):**
```tsx
const CollapsedFieldRow: React.FC<{ label: string; value: string }> = ({ label, value }) => {
  if (!value) return null;
  return (
    <div className="flex gap-3 py-0.5">
      <span className="text-[10px] font-bold text-zinc-500 uppercase w-24 shrink-0">{label}</span>
      <span className="text-sm text-zinc-200">{value}</span>
    </div>
  );
};
```

**Updated (vertical, dimmer text):**
```tsx
const CollapsedFieldRow: React.FC<{ label: string; value: string }> = ({ label, value }) => {
  if (!value) return null;
  return (
    <div className="space-y-1">
      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">{label}</span>
      <p className="text-sm text-zinc-400">{value}</p>
    </div>
  );
};
```

Key changes:
- Layout: `flex gap-3` → `space-y-1` (vertical stack)
- Value color: `text-zinc-200` → `text-zinc-400` (dimmer)
- Label: Remove `w-24`, add `block` and `tracking-widest`
- Value: `<span>` → `<p>` for block display

---

### 3. Increase Spacing Between Field Groups

Update all three collapsed view containers:

| Component | Line | Current | Updated |
|-----------|------|---------|---------|
| `CollapsedPhysicalAppearance` | 287 | `space-y-0.5` | `space-y-4` |
| `CollapsedCurrentlyWearing` | 308 | `space-y-0.5` | `space-y-4` |
| `CollapsedPreferredClothing` | 322 | `space-y-0.5` | `space-y-4` |

---

## Visual Comparison

**Before (current collapsed view):**
```
HAIR           Blonde, wavy
EYES           Blue
BUILD          Athletic
```
(bright white values, horizontal layout, tight spacing)

**After (updated):**
```
HAIR
Blonde, wavy

EYES
Blue

BUILD
Athletic
```
(dimmer gray values, vertical layout, clear separation)

**Before (header):**
```
SECTION  Physical Appearance
↑ green   ↑ greenish-white
```

**After (header):**
```
Physical Appearance
↑ pure white
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/chronicle/CharactersTab.tsx` | Remove "Section" label (line 37), change header to `text-white` (line 38), update `CollapsedFieldRow` to vertical layout (lines 272-279), update spacing to `space-y-4` (lines 287, 308, 322) |
| `src/components/chronicle/CharacterGoalsSection.tsx` | Remove "Section" label (line 268), change header to `text-white` (line 269) |

