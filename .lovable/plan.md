

# Fix Button Scaling and Text Size

## Problem

The "Upload Image" and "AI Generate" buttons have:
1. **Text too large** compared to other UI elements (labels use `text-[10px]`, buttons use `text-sm`)
2. **Text wrapping awkwardly** due to tight flex container
3. **Not scaling properly** when container width decreases

## Root Cause

The Button component's base style uses `text-sm font-semibold` with `px-4 py-2` padding. When placed in a narrow flex container with `flex-1`, the buttons can't shrink gracefully - they squeeze until text wraps.

## Solution

### 1. Reduce Button Text Size for These Specific Buttons

Add a `text-xs` override to make button text proportional to nearby labels.

**File: `src/components/chronicle/CharactersTab.tsx`**

```tsx
// Line 398 - UploadSourceMenu
className="flex-1 text-xs"

// Line 400 - AI Generate button  
className="flex-1 gap-2 text-xs"
```

### 2. Add `whitespace-nowrap` and `min-w-0` to Prevent Wrapping

Ensure button text stays on one line and buttons can shrink:

```tsx
// UploadSourceMenu (line 398)
className="flex-1 text-xs min-w-0"

// AI Generate button (line 400)
className="flex-1 gap-2 text-xs whitespace-nowrap min-w-0"
```

### 3. Update UploadSourceMenu Button to Prevent Text Wrap

**File: `src/components/chronicle/UploadSourceMenu.tsx`**

Add `whitespace-nowrap` to the inner button:

```tsx
// Line 40
className="gap-2 w-full whitespace-nowrap"
```

### 4. Reduce Icon Size Proportionally

Make icons match the smaller text:

```tsx
// UploadSourceMenu.tsx line 42
<Upload className="w-3.5 h-3.5" />

// UploadSourceMenu.tsx line 44
<ChevronDown className="w-3.5 h-3.5" />

// CharactersTab.tsx line 401
<Sparkles className="w-3.5 h-3.5" />
```

---

## Alternative Approach: Smaller Button Variant

If the above doesn't fully resolve it, we could add a `size="sm"` option to the Button component:

**File: `src/components/chronicle/UI.tsx`**

```tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "default" | "sm";
}

// In the component:
const sizeStyles = {
  default: "px-4 py-2 text-sm",
  sm: "px-3 py-1.5 text-xs",
};

// In base, remove px/py/text-sm, then add sizeStyles[size] to className
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/chronicle/CharactersTab.tsx` | Add `text-xs min-w-0 whitespace-nowrap` to button classes, reduce icon size |
| `src/components/chronicle/UploadSourceMenu.tsx` | Add `whitespace-nowrap` to button, reduce icon sizes |

---

## Visual Result

After these changes:
- Button text will be proportional to input labels
- Text won't wrap across multiple lines
- Buttons will scale gracefully side-by-side
- Icons will match the smaller text size

