

# Fix Modal Content Area to Fill Available Height

The modal height was increased to `h-[85vh]`, but the content `ScrollArea` (line 1245) still uses `max-h-[calc(90vh-160px)]` which doesn't grow to fill the modal. The fix is to make the modal use flex layout and let the content area stretch.

## Changes — `src/components/chronicle/CharacterEditModal.tsx`

### Line 1049 — Add flex layout to DialogContent
Add `flex flex-col` to the existing className so children stack and the ScrollArea can flex-grow.

### Line 1245 — Update ScrollArea
Change `max-h-[calc(90vh-160px)]` to `min-h-0` (needed for flex children with overflow) and keep `flex-1`:
```
<ScrollArea className="flex-1 min-h-0 bg-[#2a2a2f]">
```

This lets the scroll area fill all remaining space after the header, making the full 85vh usable.

### Files Changed
- `src/components/chronicle/CharacterEditModal.tsx`

