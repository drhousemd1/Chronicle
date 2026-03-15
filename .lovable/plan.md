

## Plan: Fix Chat Interface Sidebar Column Scroll/Crop Issue

**Root cause**: The parent container at line 3614 uses `overflow-hidden` (when no expanded tile), so all content must fit within the available height. The `h3` → `div` change added `relative overflow-hidden` and `border-t border-white/20` to each header, which creates a new block formatting context and adds 1px of border per header. In tight viewports this can cause the bottom content to get clipped.

**File**: `src/components/chronicle/ChatInterfaceTab.tsx`

### Fix 1: Revert headers back to `h3` elements with gradient styling applied directly

Instead of using a `div` wrapper with nested children for the gloss sheen, apply the gradient styling directly on the `h3` element (as it was originally) and skip the `relative overflow-hidden` wrapper and gloss sheen child div. This keeps the 3D gradient look without the extra structural overhead.

**Lines 3716-3725** — Replace the `div` wrapper structure for "Main Characters" with:
```tsx
<h3
  className="text-[11px] font-bold text-white bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] border-t border-white/20 px-4 py-1.5 rounded-lg mb-3 tracking-tight uppercase flex items-center justify-between cursor-pointer select-none shadow-lg"
  onClick={() => setMainCharsCollapsed(prev => !prev)}
>
  Main Characters
  <ChevronDown className={`w-3.5 h-3.5 text-white transition-transform duration-200 ${mainCharsCollapsed ? 'rotate-180' : ''}`} />
</h3>
```

**Lines 3772-3781** — Same for "Side Characters".

This restores the original single-element structure while keeping the gradient + border-t for the 3D effect. The gloss sheen overlay is dropped (it's a nice-to-have that only the Story Builder needs since those headers are larger).

### Fix 2: Make the sidebar content area scrollable as a fallback

Change line 3614 from `overflow-hidden` to `overflow-y-auto` as the default (instead of only when `hasExpandedTile` is true):
```tsx
<div className="flex-1 flex flex-col p-4 gap-3 overflow-y-auto">
```

This ensures the sidebar column can always scroll if content exceeds available height, preventing any future cropping regardless of header size.

### Summary
- 2 changes: revert headers to simpler `h3` structure with gradient, fix sidebar overflow
- No visual regression — gradient + border-t still produces the 3D look
- Eliminates the `relative overflow-hidden` that may have created layout issues

