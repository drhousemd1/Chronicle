

# Move Cancel/Save to Header, Remove X Button

## Verified Styles

**Header action button style** (Index.tsx line 2164 — "Save Draft" / "Finalize"):
```
inline-flex items-center justify-center h-10 px-6 rounded-xl border-0 bg-[#303035] text-[#eaedf1] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] hover:bg-[#343439] active:bg-[#343439] transition-all active:scale-95 text-xs font-bold leading-none disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent-teal))]/40
```

## Changes — `src/components/chronicle/CharacterEditModal.tsx`

### 1. Hide the default X close button (line 1049)
Add `[&>button]:hidden` to the `DialogContent` className to suppress the default radix close button.

### 2. Move Cancel + Save into the header (after AI Update button area, line ~1102)
Insert Cancel and Save buttons into the header's right side, next to the AI Update button. Both use the standard header action button style from above. Save text changes from "Save Changes" to "Save" (or "Saving..." when active).

### 3. Remove the footer (lines 1962-1998)
Delete the entire `<DialogFooter>` block containing the old Cancel and Save buttons.

### Files Changed
- `src/components/chronicle/CharacterEditModal.tsx`

