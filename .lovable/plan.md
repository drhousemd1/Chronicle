
# Avatar Panel Improvements

## Overview

Address 6 issues with the Avatar panel: broken shadow effect, column spacing, field consolidation, and layout optimizations.

---

## Issue 1: Fix Broken Shadow Effect

### Problem
The shadow appears as harsh right-angle lines on the right side with no shadow on the left. This is caused by `overflow-hidden` on the container clipping the shadow, combined with the sticky container having overflow scroll.

### Solution
The shadow is being clipped by the parent `lg:overflow-y-auto` container. The shadow needs to be applied in a way that doesn't get clipped.

**Current (line 332):**
```tsx
<div className="w-full bg-[#2a2a2f] rounded-[24px] border border-white/10 overflow-hidden shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)]">
```

**Fix:** Wrap the panel in a container with padding to give the shadow room to render, and remove the shadow-clipping overflow:

```tsx
<div className="pb-4 px-2"> {/* Shadow breathing room */}
  <div className="w-full bg-[#2a2a2f] rounded-[24px] border border-white/10 overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
```

Also update the parent sticky container (line 328) to not clip:
```tsx
<div className="space-y-6 lg:sticky lg:top-0 lg:max-h-[calc(100vh-9rem)] lg:overflow-y-auto lg:pr-4 lg:pb-6 lg:pl-2 lg:overscroll-contain">
```

---

## Issue 2: Increase Column Spacing

### Problem
The Profile and Character Traits columns are too close together.

### Solution
Increase the grid gap from `gap-6` to `gap-10` or `gap-12`.

**Current (line 326):**
```tsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
```

**Updated:**
```tsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
```

---

## Issue 3: Age and Sex/Identity Side-by-Side

### Problem
Age takes up a full row but typically only needs a small value.

### Solution
Create a 2-column grid for Age and Sex/Identity fields.

**Current (lines 470-477):**
```tsx
<div>
  <label>Age</label>
  <input ... />
</div>
<div>
  <label>Sex / Identity</label>
  <input ... />
</div>
```

**Updated:**
```tsx
<div className="grid grid-cols-2 gap-3">
  <div>
    <label>Age</label>
    <input ... />
  </div>
  <div>
    <label>Sex / Identity</label>
    <input ... />
  </div>
</div>
```

---

## Issue 4: Controlled By and Character Role Side-by-Side

### Problem
These toggle sections each take a full row.

### Solution
Create a 2-column grid for both toggle sections.

**Current (lines 487-521):**
```tsx
<div className="space-y-1.5">
  <label>Controlled By</label>
  <div className="flex p-1 bg-zinc-800 rounded-xl">...</div>
</div>
<div className="space-y-1.5">
  <label>Character Role</label>
  <div className="flex p-1 bg-zinc-800 rounded-xl">...</div>
</div>
```

**Updated:**
```tsx
<div className="grid grid-cols-2 gap-3">
  <div className="space-y-1.5">
    <label>Controlled By</label>
    <div className="flex p-1 bg-zinc-800 rounded-xl">...</div>
  </div>
  <div className="space-y-1.5">
    <label>Character Role</label>
    <div className="flex p-1 bg-zinc-800 rounded-xl">...</div>
  </div>
</div>
```

---

## Issue 5: Remove Tags Section

### Problem
Tags field is a remnant that serves no purpose.

### Solution
Delete the entire Tags input block.

**Remove (lines 527-530):**
```tsx
<div>
  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Tags</label>
  <input type="text" value={selected.tags} onChange={(e) => onUpdate(selected.id, { tags: e.target.value })} placeholder="Separated by commas" className="w-full px-3 py-2 text-sm bg-zinc-900/50 border border-white/10 text-white placeholder:text-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
</div>
```

---

## Issue 6: Upload Image and AI Generate Side-by-Side

### Problem
AI Generate button is on its own row.

### Solution
Move AI Generate into the same row as Upload Image when no Reposition button is shown, or create a 2-button row when avatar exists.

**Current structure (lines 381-412):**
```tsx
<div className="flex flex-col gap-2 w-full">
  <div className="flex gap-2 w-full">
    <UploadSourceMenu ... className="flex-1" />
    {selected.avatarDataUrl && <Button>Reposition</Button>}
  </div>
  <Button className="w-full">AI Generate</Button>
</div>
```

**Updated - all buttons in one row when no avatar:**
```tsx
<div className="flex gap-2 w-full">
  <UploadSourceMenu ... className="flex-1" />
  <Button className="flex-1">AI Generate</Button>
</div>
```

**Updated - 2 rows when avatar exists (Upload + Reposition, then AI Generate or alternative layout):**
```tsx
<div className="flex flex-col gap-2 w-full">
  <div className="flex gap-2 w-full">
    <UploadSourceMenu ... className="flex-1" />
    <Button className="flex-1">AI Generate</Button>
  </div>
  {selected.avatarDataUrl && (
    <Button className="w-full">Reposition</Button>
  )}
</div>
```

---

## Summary of Changes

| Issue | Location | Change |
|-------|----------|--------|
| 1. Shadow fix | Lines 328, 332 | Add padding wrapper, adjust overflow |
| 2. Column spacing | Line 326 | Change `gap-6` to `gap-10` |
| 3. Age + Sex side-by-side | Lines 470-477 | Wrap in `grid grid-cols-2` |
| 4. Toggles side-by-side | Lines 487-521 | Wrap in `grid grid-cols-2` |
| 5. Remove Tags | Lines 527-530 | Delete entirely |
| 6. Buttons side-by-side | Lines 381-412 | Restructure button layout |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/chronicle/CharactersTab.tsx` | All 6 modifications above |

---

## Visual Result

After these changes:
- Shadow will render evenly around all sides of the Avatar panel
- More breathing room between Profile and Character Traits columns
- Condensed Avatar panel with Age/Sex and toggles in 2-column layouts
- No unused Tags field
- Buttons consolidated into fewer rows
