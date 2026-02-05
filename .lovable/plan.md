
# Fix Custom Category Layout, Button Color, and Footer Clipping

## Summary

Three issues to fix in `CharacterEditModal.tsx`:

1. **Vertical text in custom categories (expanded view)** - Match the working structure from CharactersTab.tsx
2. **Save Changes button wrong color** - Change from blue to Slate Blue (#4a5f7f)
3. **Buttons clipping at bottom** - Adjust footer spacing to prevent clipping

---

## File to Modify

`src/components/chronicle/CharacterEditModal.tsx`

---

## Technical Changes

### 1. Fix Custom Category Item Layout (Lines 1018-1043)

The working code in `CharactersTab.tsx` uses this structure:

```tsx
<div className="flex items-start gap-2">
  <div className="flex-1 flex gap-2 min-w-0">
    <div className="w-1/3 min-w-0">
      <AutoResizeTextarea
        ...
        className="w-full px-3 py-2 text-xs font-bold bg-zinc-900/50 border border-white/10 text-white placeholder:text-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
      />
    </div>
    <AutoResizeTextarea
      ...
      className="flex-1 min-w-0 px-3 py-2 text-sm bg-zinc-900/50 border border-white/10 text-white placeholder:text-zinc-600 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
    />
  </div>
  <button ...>X</button>
</div>
```

The key fix is:
- Add `min-w-0` to the flex container holding both textareas
- Wrap the Label textarea in a `<div className="w-1/3 min-w-0">` instead of applying `w-1/3` directly to the textarea
- Add `w-full` to the Label textarea and `min-w-0` to the Description textarea

This prevents flex items from refusing to shrink below their content width, which causes vertical character stacking.

---

### 2. Change Save Changes Button to Slate Blue (Lines 1109-1122)

**Current:**
```tsx
className="flex h-10 px-6 items-center justify-center gap-2
  rounded-xl border border-blue-500/30 
  bg-blue-600 shadow-[0_10px_30px_rgba(0,0,0,0.35)]
  text-white text-[10px] font-bold leading-none uppercase tracking-wider
  hover:bg-blue-500 active:bg-blue-400 ..."
```

**Updated:**
```tsx
className="flex h-10 px-6 items-center justify-center gap-2
  rounded-xl border border-[#5a6f8f] 
  bg-[#4a5f7f] shadow-[0_10px_30px_rgba(0,0,0,0.35)]
  text-white text-[10px] font-bold leading-none uppercase tracking-wider
  hover:bg-[#5a6f8f] active:bg-[#6a7f9f] ..."
```

Uses the established brand slate blue color (#4a5f7f) with lighter hover state (#5a6f8f).

---

### 3. Fix Footer Button Clipping (Lines 527 and 1094)

Adjust the ScrollArea max-height and footer padding to prevent button clipping:

**ScrollArea (line 527):**
```tsx
// Current:
<ScrollArea className="flex-1 max-h-[calc(90vh-140px)] bg-[#2a2a2f]">

// Updated - increase subtraction to account for footer height:
<ScrollArea className="flex-1 max-h-[calc(90vh-160px)] bg-[#2a2a2f]">
```

**DialogFooter (line 1094):**
```tsx
// Current:
<DialogFooter className="px-6 py-4 border-t border-white/10 bg-[#2a2a2f] gap-3">

// Updated - add margin-top negative to ensure it's fully visible:
<DialogFooter className="px-6 py-5 border-t border-white/10 bg-[#2a2a2f] gap-3 flex-shrink-0">
```

Adding `flex-shrink-0` prevents the footer from being compressed, and increasing `py-4` to `py-5` gives the buttons more breathing room.

---

## Summary of All Changes

| Issue | Location | Fix |
|-------|----------|-----|
| Vertical text in expanded custom items | Lines 1018-1043 | Wrap Label in `div.w-1/3.min-w-0`, add `min-w-0` to flex container and Description textarea |
| Wrong button color | Lines 1109-1122 | Change `bg-blue-600` to `bg-[#4a5f7f]` (Slate Blue) |
| Button clipping | Lines 527, 1094 | Change `max-h-[calc(90vh-140px)]` to `max-h-[calc(90vh-160px)]`, add `flex-shrink-0` to footer, increase footer padding |
