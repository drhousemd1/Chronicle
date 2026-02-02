

# Fix Avatar Action Buttons - Stack Layout and Refined Styling

## Problem Analysis

Comparing the current state (images 1 & 2) to the mockup (image 3):

| Issue | Current | Mockup |
|-------|---------|--------|
| **Layout** | Side-by-side (causes scaling issues) | Should be stacked vertically |
| **Border radius** | `rounded-2xl` (16px) - too round | More rectangular with softer corners (`rounded-xl` or 12px) |
| **Upload button** | Split button with text truncating | Single button with "Upload Image ▾" text inline |
| **AI Generate** | Gradient is close but button is too round | More rectangular, gradient matches |

---

## Solution

### 1. Change Layout from Horizontal to Vertical Stack

Change the flex container from `flex-row` to `flex-col`:

**File**: `src/components/chronicle/AvatarActionButtons.tsx`

```tsx
// Line 34: Change from horizontal to vertical
<div className="flex flex-col gap-2 w-full">
```

### 2. Reduce Border Radius

Change `rounded-2xl` (16px) to `rounded-xl` (12px) for a more rectangular look:

```tsx
// Line 36: Upload button container
rounded-2xl → rounded-xl

// Line 93: AI Generate button
rounded-2xl → rounded-xl
```

### 3. Simplify Upload Button to Single-Line Design

The mockup shows "Upload Image" with a chevron inline as one text element, not a split button. Restructure to:

```tsx
// Simplified Upload button - chevron is part of the main button text
<div className="flex h-10 w-full rounded-xl border border-[hsl(var(--ui-border))] bg-[hsl(var(--ui-surface-2))] shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
  <DropdownMenuTrigger asChild>
    <button className="flex flex-1 items-center justify-center gap-2 px-4 ...">
      <Upload className="w-4 h-4 shrink-0" />
      <span>Upload Image</span>
      <ChevronDown className="w-4 h-4 shrink-0 ml-1" />
    </button>
  </DropdownMenuTrigger>
</div>
```

This makes the entire button a dropdown trigger with the chevron as part of the label.

### 4. Make AI Generate Button Full Width

Since it's now in a vertical stack:

```tsx
// Line 88-97: Remove flex-1, add w-full
<button
  className="relative flex w-full h-10 items-center justify-center gap-2 px-4
    rounded-xl border ..."
>
```

---

## Complete Updated Component Structure

```tsx
<div className="flex flex-col gap-2 w-full">
  {/* Upload Button - Full width, single dropdown trigger */}
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <button className="flex h-10 w-full items-center justify-center gap-2 px-4
        rounded-xl border border-[hsl(var(--ui-border))] 
        bg-[hsl(var(--ui-surface-2))] shadow-[0_10px_30px_rgba(0,0,0,0.35)]
        text-[hsl(var(--ui-text))] text-sm font-semibold
        hover:bg-white/5 active:bg-white/10 disabled:opacity-50
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent-teal))]/40
        transition-colors"
      >
        <Upload className="w-4 h-4 shrink-0" />
        <span>Upload Image</span>
        <ChevronDown className="w-4 h-4 shrink-0" />
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent ...>
      <DropdownMenuItem>From Device</DropdownMenuItem>
      <DropdownMenuItem>From Library</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>

  {/* AI Generate Button - Full width */}
  <button className="relative flex w-full h-10 items-center justify-center gap-2 px-4
    rounded-xl border ..."
  >
    {/* Gradient background layers */}
    <span className="relative z-10 flex items-center gap-2">
      <Sparkles className="w-4 h-4 shrink-0" />
      <span>AI Generate</span>
    </span>
  </button>
</div>
```

---

## Key Style Changes Summary

| Property | Before | After |
|----------|--------|-------|
| Container direction | `flex items-stretch gap-2` (horizontal) | `flex flex-col gap-2` (vertical) |
| Border radius | `rounded-2xl` | `rounded-xl` |
| Upload button | Split button with separate chevron zone | Single button with inline chevron |
| Button width | `flex-1` (share horizontal space) | `w-full` (full width in stack) |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/chronicle/AvatarActionButtons.tsx` | Change to vertical layout, reduce border radius, simplify upload to single dropdown trigger |

---

## Visual Result

After these changes:
- **Upload Image** button: Full-width, rectangular with soft corners, "Upload Image ▾" as single label
- **AI Generate** button: Full-width, same rounded-xl corners, gradient preserved
- Buttons stacked vertically, no more horizontal scaling/clipping issues
- Matches mockup's more rectangular aesthetic

