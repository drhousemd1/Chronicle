
# Fix Share Your Story Section Styling

## Overview

Update the "Share Your Story" section in `src/components/chronicle/WorldTab.tsx` to:
1. Use the steel blue header color (`#4a5f7f`) instead of the purple/blue gradient
2. Restyle the "Publish to Gallery" button to match the "Upload Image" button design with drop shadow

---

## File to Modify

| File | Changes |
|------|---------|
| `src/components/chronicle/WorldTab.tsx` | Update Share section header color and button styling |

---

## Detailed Changes

### 1. Section Header (line 879)

**Current:**
```tsx
<div className="bg-gradient-to-r from-blue-600 to-purple-600 border-b border-white/20 px-6 py-4 flex items-center gap-3 shadow-lg">
```

**Updated:**
```tsx
<div className="bg-[#4a5f7f] border-b border-white/20 px-6 py-4 flex items-center gap-3 shadow-lg">
```

This changes from the purple/blue gradient to the steel blue (`#4a5f7f`) used by all other section headers on the page.

### 2. Publish to Gallery Button (lines 890-899)

**Current:**
```tsx
<div className="mt-4">
  <Button 
    variant="primary"
    onClick={() => setShowShareModal(true)}
    className="w-full !bg-gradient-to-r !from-blue-600 !to-purple-600 hover:!from-blue-500 hover:!to-purple-500"
  >
    <Share2 className="w-4 h-4 mr-2" />
    Publish to Gallery
  </Button>
</div>
```

**Updated:**
```tsx
<div className="mt-4">
  <button
    type="button"
    onClick={() => setShowShareModal(true)}
    className="flex h-10 w-full items-center justify-center gap-2 px-4
      rounded-xl border border-[hsl(var(--ui-border))] 
      bg-[hsl(var(--ui-surface-2))] shadow-[0_10px_30px_rgba(0,0,0,0.35)]
      text-[hsl(var(--ui-text))] text-[10px] font-bold leading-none
      hover:bg-white/5 active:bg-white/10
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent-teal))]/40
      transition-colors"
  >
    <Share2 className="w-3.5 h-3.5 shrink-0" />
    <span>Publish to Gallery</span>
  </button>
</div>
```

This exact styling is copied from the Upload Image button in `CoverImageActionButtons.tsx`, including:
- `shadow-[0_10px_30px_rgba(0,0,0,0.35)]` for the drop shadow
- `bg-[hsl(var(--ui-surface-2))]` for the dark surface background
- `border-[hsl(var(--ui-border))]` for the consistent border
- `text-[10px] font-bold` for the button text style
- `h-10 rounded-xl` for the height and border radius

---

## Summary

| Element | Before | After |
|---------|--------|-------|
| Header background | `bg-gradient-to-r from-blue-600 to-purple-600` | `bg-[#4a5f7f]` (steel blue) |
| Button style | Custom Button component with gradient | Native button with Upload Image styling |
| Button shadow | None | `shadow-[0_10px_30px_rgba(0,0,0,0.35)]` |
| Button background | Gradient | `bg-[hsl(var(--ui-surface-2))]` (dark surface) |
