

# Update Header Color and Add Category Button Styling

## Summary

Two styling updates to `CharacterEditModal.tsx`:

1. **Change "Edit Character" header background** - From slate blue (#4a5f7f) to black
2. **Update "+ Add Category" button** - Match the Cancel button styling

---

## File to Modify

`src/components/chronicle/CharacterEditModal.tsx`

---

## Technical Changes

### 1. Change Header Background to Black (Line 518)

**Current:**
```tsx
<DialogHeader className="px-6 py-4 border-b border-white/20 bg-[#4a5f7f]">
```

**Updated:**
```tsx
<DialogHeader className="px-6 py-4 border-b border-white/20 bg-black">
```

---

### 2. Update Add Category Button to Match Cancel Button (Lines 1084-1089)

**Current:**
```tsx
<Button
  onClick={addNewSection}
  className="w-full bg-zinc-800 hover:bg-zinc-700 text-white border-white/10"
>
  <Plus className="w-4 h-4 mr-2" /> Add Category
</Button>
```

**Updated (matching Cancel button style):**
```tsx
<button
  type="button"
  onClick={addNewSection}
  className="w-full flex h-10 px-6 items-center justify-center gap-2
    rounded-xl border border-[hsl(var(--ui-border))] 
    bg-[hsl(var(--ui-surface-2))] shadow-[0_10px_30px_rgba(0,0,0,0.35)]
    text-[hsl(var(--ui-text))] text-[10px] font-bold leading-none uppercase tracking-wider
    hover:bg-white/5 active:bg-white/10 disabled:opacity-50
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20
    transition-colors"
>
  <Plus className="w-4 h-4" /> Add Category
</button>
```

Key changes:
- Switch from `<Button>` component to native `<button>` element
- Use same styling classes as Cancel button
- Add `w-full` to maintain full width
- Use `rounded-xl` corners
- Apply dark surface background with CSS variables
- Heavy drop shadow
- Small uppercase text styling

---

## Summary of Changes

| Element | Current | Updated |
|---------|---------|---------|
| Header background | `bg-[#4a5f7f]` (slate blue) | `bg-black` |
| Add Category button | `<Button>` with zinc-800 | Native `<button>` matching Cancel style |

