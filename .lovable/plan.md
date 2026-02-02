

# Fix Avatar Panel Button Styling

## Problem

The "Upload Image" and "AI Generate" buttons are not scaling properly and don't match the design reference. The reference shows:
- **Upload Image**: Dark outlined button with border, upload icon, and dropdown chevron
- **AI Generate**: Purple-to-blue gradient background with sparkle icon

## Root Cause

1. **Scaling Issue**: The `UploadSourceMenu` wraps the button in a React fragment (`<>...</>`), so the `flex-1` class passed via `className` only applies to the inner button, not the fragment wrapper. This breaks the flex layout.

2. **Styling Mismatch**: Both buttons currently use the same `primary` variant (solid dark), but the reference shows distinct styles.

---

## Solution

### 1. Fix UploadSourceMenu Wrapper

Change the fragment wrapper to a `div` that accepts and applies the `className` prop, ensuring `flex-1` works correctly:

**File: `src/components/chronicle/UploadSourceMenu.tsx`**

```tsx
// Before (line 33-34):
return (
  <>

// After:
return (
  <div className={className}>
```

Also remove className from the inner Button since it's now on the wrapper:

```tsx
// Before (line 40):
className={`gap-2 ${className}`}

// After:
className="gap-2 w-full"
```

### 2. Add New Button Variants to UI.tsx

Add an `outlineDark` variant for Upload Image and a `gradient` variant for AI Generate:

**File: `src/components/chronicle/UI.tsx`**

```tsx
export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "brand" | "outlineDark" | "gradient";

const styles: Record<ButtonVariant, string> = {
  // ... existing variants ...
  outlineDark: "bg-zinc-900/80 text-white border border-zinc-600 hover:bg-zinc-800 hover:border-zinc-500",
  gradient: "bg-gradient-to-r from-purple-600 via-violet-500 to-blue-500 text-white border-0 hover:from-purple-500 hover:via-violet-400 hover:to-blue-400 shadow-lg",
};
```

### 3. Update Button Usage in CharactersTab.tsx

**File: `src/components/chronicle/CharactersTab.tsx`**

Update the UploadSourceMenu call:
```tsx
<UploadSourceMenu
  variant="outlineDark"
  className="flex-1"
  // ... other props
/>
```

Update the AI Generate button to use gradient variant and add sparkle icon:
```tsx
import { Sparkles } from 'lucide-react';

<Button variant="gradient" onClick={handleAiPortrait} disabled={isGeneratingImg} className="flex-1 gap-2">
  <Sparkles className="w-4 h-4" />
  {isGeneratingImg ? "..." : "AI Generate"}
</Button>
```

### 4. Add Upload Icon to UploadSourceMenu

Add an upload icon before the label text:

**File: `src/components/chronicle/UploadSourceMenu.tsx`**

```tsx
<Button ...>
  <Upload className="w-4 h-4" />
  {isUploading ? 'Uploading...' : label}
  <ChevronDown className="w-4 h-4" />
</Button>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/chronicle/UI.tsx` | Add `outlineDark` and `gradient` button variants |
| `src/components/chronicle/UploadSourceMenu.tsx` | Fix wrapper element, add upload icon |
| `src/components/chronicle/CharactersTab.tsx` | Use new variants, add Sparkles icon to AI Generate |

---

## Visual Result

After these changes:
- **Upload Image**: Dark outlined button with upload icon, text, and chevron
- **AI Generate**: Purple-to-blue gradient with sparkle icon
- Both buttons will scale equally using `flex-1` layout

