

# Fix Plan: Style Selection Button Ring/Focus Issues

## Problem Analysis

Based on the screenshots and code review, there are **two distinct issues** causing the inconsistent blue ring behavior:

### Issue 1: Ring Clipping on Left/Right Edges

The grid container for style buttons has no padding:
```tsx
<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
```

The parent container has `overflow-y-auto`, which clips content outside its bounds. CSS rings render **outside** the element, so when the first button in a row has a ring, the left edge gets clipped against the scrollable container.

### Issue 2: Focus Styling Overrides Selection Ring

The current button styling has a conflict:
```tsx
className={cn(
  selectedStyleId === style.id
    ? "ring-2 ring-blue-400 shadow-md"     // Selected = blue ring
    : "ring-1 ring-border",                 // Unselected = gray ring
  "focus:ring-2 focus:ring-blue-100"        // Focus = light blue ring (OVERRIDES!)
)}
```

**What happens:**
1. Modal opens → first button is selected with `ring-2 ring-blue-400`
2. User clicks a button → button receives focus
3. Focus state applies `focus:ring-blue-100` which **overrides** the selected blue ring
4. Ring appears much lighter (almost invisible)
5. User clicks textarea → focus leaves button → blue ring returns

---

## Solution

### Fix 1: Add Padding to Grid Container

Add horizontal padding to the grid container wrapper to give rings room to render without clipping:

**All 3 modals:** Wrap the grid in a container with `-mx-1` margin and `px-1` padding, or simply add `px-1` padding to allow rings to render.

```tsx
<div className="space-y-3">
  <Label>Style</Label>
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 px-1">
    {/* buttons */}
  </div>
</div>
```

### Fix 2: Remove Focus Ring Override

Remove the conflicting `focus:ring-*` classes from the button. The selected state already shows a ring, and we don't want focus to change it. Instead, keep only `outline-none` to remove browser default:

**Before:**
```tsx
"focus:ring-2 focus:ring-blue-100 focus:ring-offset-0"
```

**After:**
```tsx
"focus-visible:outline-none"
```

Or alternatively, make focus styling **additive** rather than replacing the ring - but removing it entirely is cleaner since we already have visual selection indication via the ring and checkmark.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/chronicle/SceneImageGenerationModal.tsx` | Add `px-1` to grid, remove focus:ring classes |
| `src/components/chronicle/CoverImageGenerationModal.tsx` | Add `px-1` to grid, remove focus:ring classes |
| `src/components/chronicle/AvatarGenerationModal.tsx` | Add `px-1` to grid, remove focus:ring classes |

---

## Detailed Changes

### SceneImageGenerationModal.tsx

**Line 86:** Add `px-1` to grid container
```tsx
<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 px-1">
```

**Lines 93-100:** Remove conflicting focus styling
```tsx
className={cn(
  "relative rounded-xl p-2 transition-all duration-200 cursor-pointer",
  "bg-card hover:bg-accent/50",
  selectedStyle === style.id
    ? "ring-2 ring-blue-400 shadow-md"
    : "ring-1 ring-border hover:ring-slate-300",
  "focus-visible:outline-none"
)}
```

### CoverImageGenerationModal.tsx

**Line 153:** Add `px-1` to grid container
```tsx
<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 px-1">
```

**Lines 159-166:** Remove conflicting focus styling
```tsx
className={cn(
  "relative rounded-xl p-2 transition-all duration-200 cursor-pointer",
  "bg-card hover:bg-accent/50",
  selectedStyleId === style.id
    ? "ring-2 ring-blue-400 shadow-md"
    : "ring-1 ring-border hover:ring-slate-300",
  "focus-visible:outline-none"
)}
```

### AvatarGenerationModal.tsx

**Line 225:** Add `px-1` to grid container
```tsx
<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 px-1">
```

**Lines 231-238:** Remove conflicting focus styling
```tsx
className={cn(
  "relative rounded-xl p-2 transition-all duration-200 cursor-pointer",
  "bg-card hover:bg-accent/50",
  selectedStyleId === style.id
    ? "ring-2 ring-blue-400 shadow-md"
    : "ring-1 ring-border hover:ring-slate-300",
  "focus-visible:outline-none"
)}
```

---

## Expected Result After Fix

| Behavior | Before | After |
|----------|--------|-------|
| Initial load | Blue ring clipped on left edge | Full blue ring visible |
| Click thumbnail | Blue ring disappears | Blue ring stays visible |
| Click textarea | Blue ring reappears | Blue ring unchanged |
| Edge items (first/last column) | Rings clipped | Rings fully visible |

---

## Why This Works

1. **`px-1` padding**: Creates 4px of horizontal space inside the grid container, giving rings room to render without being clipped by the parent's overflow

2. **Removing `focus:ring-*`**: Stops the focus state from overriding the selection ring. The checkmark badge provides sufficient visual feedback that the item is selected, so we don't need additional focus indication

3. **`focus-visible:outline-none`**: Removes the browser's default focus outline while maintaining accessibility (focus-visible only triggers for keyboard navigation, not mouse clicks)

