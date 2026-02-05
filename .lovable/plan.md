

# Update Change Button Styling

## Summary

Update the "Change" button (for changing character name) to match the Cancel and Upload Image button styling.

---

## File to Modify

`src/components/chronicle/CharacterEditModal.tsx`

---

## Technical Changes

### Update Change Button (Lines 610-619)

**Current:**
```tsx
<Button
  type="button"
  size="sm"
  variant="outline"
  onClick={() => setIsChangeNameModalOpen(true)}
  className="gap-1.5 text-xs bg-zinc-900 hover:bg-zinc-800 text-white border-white/20"
>
  <Pencil className="w-3 h-3" />
  Change
</Button>
```

**Updated (matching Cancel button style):**
```tsx
<button
  type="button"
  onClick={() => setIsChangeNameModalOpen(true)}
  className="flex h-10 px-4 items-center justify-center gap-2
    rounded-xl border border-[hsl(var(--ui-border))] 
    bg-[hsl(var(--ui-surface-2))] shadow-[0_10px_30px_rgba(0,0,0,0.35)]
    text-[hsl(var(--ui-text))] text-[10px] font-bold leading-none uppercase tracking-wider
    hover:bg-white/5 active:bg-white/10
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20
    transition-colors"
>
  <Pencil className="w-3 h-3" />
  Change
</button>
```

**Key changes:**
- Switch from `<Button>` component to native `<button>` element
- Use `rounded-xl` corners
- Apply dark surface background with CSS variables (`bg-[hsl(var(--ui-surface-2))]`)
- Heavy drop shadow (`shadow-[0_10px_30px_rgba(0,0,0,0.35)]`)
- Small uppercase text styling (`text-[10px] font-bold uppercase tracking-wider`)
- Slightly smaller horizontal padding (`px-4`) since it's a compact button

---

## Summary

| Element | Current | Updated |
|---------|---------|---------|
| Change button | `<Button>` with zinc-900 bg | Native `<button>` matching Cancel/Upload Image style |

