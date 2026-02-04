
# Match Cover Image Container to Character Builder Styling

## Overview

Transform the "Cover Image" section in the Scenario Setup page (WorldTab.tsx) to match the dark charcoal theme used in the Character Builder page, including:
- Dark container styling with steel blue header
- Premium action buttons matching AvatarActionButtons

---

## Current State

The Cover Image section currently uses a light theme:
- White card background (`Card` component)
- Black text header
- Standard `Button` components with light styling
- `UploadSourceMenu` with light dropdown

---

## Target State

Match the Character Builder's Avatar panel styling:
- **Container:** Dark charcoal background (`bg-[#2a2a2f]`)
- **Header:** Steel blue (`bg-[#4a5f7f]`) with white text
- **Inner card:** Subtle depth (`bg-[#3a3a3f]/30`)
- **Buttons:** Premium side-by-side buttons matching `AvatarActionButtons`

---

## Changes Required

### File: `src/components/chronicle/WorldTab.tsx`

#### 1. Replace Card Container with Dark Theme Container

**Lines ~362-468 (Cover Image Section)**

Replace the light `Card` wrapper with the dark theme structure:

```tsx
{/* Cover Image Section - Dark Theme */}
<section>
  <div className="w-full bg-[#2a2a2f] rounded-[24px] border border-white/10 overflow-hidden shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)]">
    {/* Section Header - Steel Blue */}
    <div className="bg-[#4a5f7f] border-b border-white/20 px-6 py-4 flex items-center gap-3 shadow-lg">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
      <h2 className="text-white text-xl font-bold tracking-tight">Cover Image</h2>
    </div>
    
    {/* Content */}
    <div className="p-6">
      <div className="p-6 bg-[#3a3a3f]/30 rounded-2xl border border-white/5">
        {/* ... existing content with updated styling ... */}
      </div>
    </div>
  </div>
</section>
```

#### 2. Update HintBox for Dark Theme

Modify the HintBox tips area to work on dark background (already uses `bg-slate-900`, so should work well).

#### 3. Replace Action Buttons with Premium Pattern

Replace the current button row:
```tsx
<UploadSourceMenu ... />
<Button variant="primary" ... >AI Generate</Button>
```

With a new `CoverImageActionButtons` component (or inline implementation) matching `AvatarActionButtons`:
- Dark outlined "Upload Image" button using UI tokens
- Premium multi-layer "AI Generate" button with teal/purple iridescence

#### 4. Update Reposition/Remove Buttons for Dark Theme

Update conditional buttons to use dark theme variants:
- **Reposition:** Use `outlineDark` variant or custom dark styling
- **Remove:** Update ghost variant colors for dark background

---

## New Component (Optional but Recommended)

### File: `src/components/chronicle/CoverImageActionButtons.tsx`

Create a component similar to `AvatarActionButtons` specifically for the Cover Image section:

```tsx
import React, { useState } from "react";
import { Sparkles, Upload, Image as ImageIcon } from "lucide-react";
// ... dropdown imports ...
import { ImageLibraryPickerModal } from "./ImageLibraryPickerModal";

interface CoverImageActionButtonsProps {
  onUploadFromDevice: () => void;
  onSelectFromLibrary: (imageUrl: string) => void;
  onGenerateClick: () => void;
  disabled?: boolean;
  isGenerating?: boolean;
  isUploading?: boolean;
  uploadLabel?: string;
}

export function CoverImageActionButtons({
  onUploadFromDevice,
  onSelectFromLibrary,
  onGenerateClick,
  disabled = false,
  isGenerating = false,
  isUploading = false,
  uploadLabel = "Upload Image",
}: CoverImageActionButtonsProps) {
  // Same implementation as AvatarActionButtons
  // with h-10, text-[10px] font-bold buttons
  // Premium 9-layer AI Generate button
}
```

---

## Visual Comparison

| Element | Current (Light) | Target (Dark) |
|---------|-----------------|---------------|
| Container BG | White (`Card`) | `#2a2a2f` |
| Header BG | White + border | `#4a5f7f` (steel blue) |
| Header Text | `text-slate-900` | `text-white` |
| Inner Card | None | `bg-[#3a3a3f]/30` |
| Upload Button | Light primary | Dark outlined with UI tokens |
| AI Generate | Light primary | Premium 9-layer with teal/purple |
| Border | `ring-slate-900/5` | `border-white/10` |
| Shadow | Light shadow | `shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)]` |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/chronicle/WorldTab.tsx` | Replace Cover Image section styling |
| `src/components/chronicle/CoverImageActionButtons.tsx` | Create new component (copy pattern from AvatarActionButtons) |

---

## Technical Notes

- The dark UI tokens (`--ui-surface`, `--ui-border`, etc.) defined in `index.css` should be used for consistency
- The premium AI Generate button uses a 9-layer architecture with iridescent borders and color blooms
- The container structure matches `HardcodedSection` and the Avatar panel in CharactersTab.tsx
