

# Responsive Avatar Action Buttons - Complete Overhaul

## Overview

Replace the current button implementation with ChatGPT's recommended design that properly handles scaling, uses consistent text sizes, and matches the visual mockup. This involves adding design tokens, creating a dedicated `AvatarActionButtons` component, and ensuring proper responsive behavior.

---

## Problem Analysis

### Current Issues

1. **Text size mismatch**: The Button base uses `text-sm`, and `text-xs` passed via className gets overridden because base styles come first in the template string
2. **Upload button clips text**: The UploadSourceMenu uses whitespace-nowrap but has no way to shrink gracefully - text just slides behind the AI Generate button
3. **No design tokens**: The dark UI panel uses hardcoded values instead of CSS variables
4. **Wrong button architecture**: ChatGPT's mockup shows a split button (main action + dropdown chevron as separate clickable zones), not a single button with icons

---

## Solution

### Step 1: Add Dark UI Design Tokens to index.css

Add the ChatGPT-provided variables inside `:root`:

```css
/* Dark UI Panel Tokens */
--ui-surface: 38 38 42;
--ui-surface-2: 46 48 54;
--ui-border: 255 255 255 / 0.10;
--ui-border-hover: 255 255 255 / 0.16;
--ui-text: 232 237 242;
--ui-text-muted: 232 237 242 / 0.75;
--accent-teal: 34 184 200;
--accent-purple: 109 94 247;
```

**File**: `src/index.css`

---

### Step 2: Create Dedicated AvatarActionButtons Component

Create a new, self-contained component that implements ChatGPT's exact design with proper responsive scaling:

**File**: `src/components/chronicle/AvatarActionButtons.tsx` (new file)

Key features:
- Split button design for Upload (main zone + chevron zone with divider)
- Proper `h-10` fixed height for both buttons (matching design reference)
- `text-sm` consistent across both buttons
- Gradient overlay for AI Generate button (teal-to-purple glaze)
- `flex-1` on the wrapper divs, not the buttons themselves
- `min-w-0` and `overflow-hidden` on button text to allow shrinking
- Focus-visible states with colored rings

```tsx
import React from "react";
import { Sparkles, Upload, ChevronDown } from "lucide-react";

interface AvatarActionButtonsProps {
  onUploadClick: () => void;
  onUploadMenuClick: () => void;
  onGenerateClick: () => void;
  disabled?: boolean;
  isGenerating?: boolean;
}

export function AvatarActionButtons({
  onUploadClick,
  onUploadMenuClick,
  onGenerateClick,
  disabled = false,
  isGenerating = false,
}: AvatarActionButtonsProps) {
  return (
    <div className="flex items-stretch gap-2 w-full">
      {/* Upload Split Button */}
      <div className="flex flex-1 min-w-0 h-10 overflow-hidden rounded-2xl border border-white/10 bg-[rgb(46,48,54)] shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
        <button
          type="button"
          onClick={onUploadClick}
          disabled={disabled}
          className="flex flex-1 min-w-0 items-center justify-center gap-2 px-3
            text-[rgb(232,237,242)] text-sm font-semibold
            hover:bg-white/5 active:bg-white/10 disabled:opacity-50
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(34,184,200)]/40"
        >
          <Upload className="w-4 h-4 shrink-0" />
          <span className="truncate">Upload Image</span>
        </button>
        <div className="w-px bg-white/10" />
        <button
          type="button"
          onClick={onUploadMenuClick}
          disabled={disabled}
          aria-label="Upload options"
          className="flex w-10 items-center justify-center shrink-0
            text-[rgb(232,237,242)] hover:bg-white/5 active:bg-white/10 disabled:opacity-50
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(34,184,200)]/40"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* AI Generate Button */}
      <button
        type="button"
        onClick={onGenerateClick}
        disabled={disabled || isGenerating}
        className="relative flex flex-1 min-w-0 h-10 items-center justify-center gap-2 px-3
          rounded-2xl border border-white/10 overflow-hidden
          text-[rgb(232,237,242)] text-sm font-semibold disabled:opacity-50
          shadow-[0_12px_40px_rgba(0,0,0,0.45)]
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(109,94,247)]/45"
      >
        {/* Background layers */}
        <span className="absolute inset-0 bg-[rgb(46,48,54)]" />
        <span className="absolute inset-0 bg-gradient-to-b from-[rgba(34,184,200,0.22)] to-[rgba(109,94,247,0.18)]" />
        {/* Content */}
        <span className="relative z-10 flex items-center gap-2">
          <Sparkles className="w-4 h-4 shrink-0" />
          <span className="truncate">{isGenerating ? "Generating..." : "AI Generate"}</span>
        </span>
      </button>
    </div>
  );
}
```

---

### Step 3: Integrate in CharactersTab with Dropdown Logic

Update `CharactersTab.tsx` to use the new component and connect the dropdown menu:

**File**: `src/components/chronicle/CharactersTab.tsx`

Replace lines 382-414 with:

```tsx
<div className="flex flex-col gap-2 w-full">
  <DropdownMenu>
    <AvatarActionButtons
      onUploadClick={() => fileInputRef.current?.click()}
      onUploadMenuClick={() => {}} // Handled by trigger
      onGenerateClick={handleAiPortrait}
      disabled={isUploading}
      isGenerating={isGeneratingImg}
    />
    {/* Connect dropdown menu to chevron somehow */}
  </DropdownMenu>
  {selected.avatarDataUrl && (
    <Button ...>Reposition</Button>
  )}
</div>
```

**Note**: The split button dropdown integration requires connecting the chevron to a DropdownMenuTrigger. One approach is to make the chevron button the trigger and render a Popover/Menu from it, or restructure to use `DropdownMenuTrigger` with `asChild`.

---

### Step 4: Handle Responsive Behavior

The key responsive fixes:
- `min-w-0` on flex children allows shrinking below content width
- `truncate` on text spans prevents overflow (shows ellipsis)
- Fixed `h-10` height prevents vertical scaling issues
- `flex-1` on both button containers makes them share space equally

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/index.css` | Add dark UI design tokens (8 CSS variables) |
| `src/components/chronicle/AvatarActionButtons.tsx` | Create new component (50-70 lines) |
| `src/components/chronicle/CharactersTab.tsx` | Replace button row with new component, integrate dropdown |

---

## Visual Matching Notes

The mockup shows:
- **Button height**: `h-10` (40px) or `h-12` (48px) - will use h-10 for better fit
- **Border radius**: `rounded-2xl` (16px)
- **Colors**: Dark surface `#2E3036`, light text `#E8EDF2`
- **AI Generate gradient**: Teal (#22B8C8) to Purple (#6D5EF7) vertical gradient overlay
- **Shadow**: Deep shadow on both buttons
- **Split button divider**: 1px white/10 line between main and chevron zones

---

## Alternative: Simpler Integration

If the split-button dropdown is too complex to wire up, we can keep the current UploadSourceMenu approach but:
1. Fix the Button component so className-provided `text-*` classes take precedence (move base styles to come after className)
2. Apply matching heights, colors, and truncate behavior

This would involve modifying `UI.tsx` to restructure the className template string order.

