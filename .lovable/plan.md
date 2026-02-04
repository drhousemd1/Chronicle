

# Character Roster Panel - Styling Refinements

## Changes Required

Two targeted styling updates in `src/components/chronicle/WorldTab.tsx`:

### 1. Darken the Add/Create Box with + Icon

The inner box containing the + icon needs a darker background to match the "NO COVER" placeholder style.

**Current:**
```tsx
<div className="w-14 h-14 shrink-0 rounded-xl bg-[#3a3a3f]/50 border-2 border-dashed border-zinc-600 ...">
```

**Updated:**
```tsx
<div className="w-14 h-14 shrink-0 rounded-xl bg-[#1a1a1f] border-2 border-dashed border-zinc-600 ...">
```

The background changes from `bg-[#3a3a3f]/50` (lighter gray with transparency) to `bg-[#1a1a1f]` (solid dark charcoal, almost black).

### 2. Restore Blue Background for Section Headers

Change "Main Characters" and "Side Characters" headers back to the steel blue color.

**Current:**
```tsx
<div className="bg-[#3a3a3f]/60 px-4 py-2 rounded-xl mb-3 border border-white/5">
  <div className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider">Main Characters</div>
</div>
```

**Updated:**
```tsx
<div className="bg-[#4a5f7f] px-4 py-2 rounded-xl mb-3 shadow-sm">
  <div className="text-[10px] font-bold text-white uppercase tracking-wider">Main Characters</div>
</div>
```

- Background: `bg-[#3a3a3f]/60` → `bg-[#4a5f7f]` (steel blue, same as "Character Roster" header)
- Border: `border border-white/5` → `shadow-sm`
- Text: `text-zinc-300` → `text-white`

---

## Summary

| Element | Before | After |
|---------|--------|-------|
| + Icon box background | `#3a3a3f` at 50% | `#1a1a1f` (solid dark) |
| Section header background | `#3a3a3f` at 60% | `#4a5f7f` (steel blue) |
| Section header text | `zinc-300` | `white` |

