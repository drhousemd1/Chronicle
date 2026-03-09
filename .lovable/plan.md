

## Plan: Style Guide Audit & Correction — Complete ✅

### Status: ✅ All 3 Passes Complete

Audited and corrected all 8 sections of the Visual Style Guide against live source code.

### What was fixed:

**Pass 1 — Colors & Typography:**
- "Button Background" swatch: `#2F3137` (screenshot approximation) → `hsl(228 7% 20%)` / `bg-[hsl(var(--ui-surface-2))]` (actual CSS variable)
- "Button Text Color" swatch: `#eaedf1` → `hsl(210 20% 93%)` / `text-[hsl(var(--ui-text))]` (actual CSS variable)
- Typography specs updated to use Tailwind class names (e.g., `text-xl font-bold tracking-tight`) instead of raw pixel values
- Field label tracking corrected from `0.5px` to `tracking-wider (0.05em)`
- Button text tile renamed from "Header actions" to "Shadow Surface" with `leading-none` added

**Pass 2 — Buttons, Forms & Badges:**
- Header Action Button completely rewritten to Shadow Surface pattern with real Tailwind `className` strings
- Button previews now render using actual `className` attributes instead of inline `style` objects
- Card Hover Buttons updated to correct `h-8 px-4` compact variant from source (StoryHub.tsx)
- Delete button corrected from `bg-#ef4444` to `bg-[hsl(var(--destructive))]`
- Form inputs and badges converted to `className`-based rendering
- Code blocks now show actual `className` strings from source

**Pass 3 — Panels, Modals & Icons:**
- Panel Container: `previewDark` removed, rendered with actual `className`
- Panel Header Bar: uses actual `className` with `px-5 py-3` (was `16px 24px`)
- Story Card: added live rendered preview with gradient overlay and `rounded-[2rem]`
- Modal Container/Header/Footer: `previewDark` removed, rendered with real Tailwind classes
- Modal Footer buttons now use actual HSL token classes from DeleteConfirmDialog.tsx
- Icon Size Scale/Containers: `previewDark` removed, previews render on white background
- Icon Colors: white swatch gets border treatment instead of dark background

**Dark Background Cleanup:**
- Removed `previewDark` from: buttons (all 5), panel container, modal container/header/footer, icon size scale, icon containers
- Kept `previewDark` only for: form inputs (dark on dark), modal backdrop (transparency demo)
