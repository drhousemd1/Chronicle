
Goal: Make the “Upload Image” + “AI Generate” button text the same size as the other Avatar panel UI text (specifically the label text for Name/Nicknames/Age), and stop any overflow/clipping on narrow screens.

What’s happening now (confirmed in code)
- In `src/components/chronicle/CharactersTab.tsx`, the Avatar panel labels (“Name”, “Nicknames”, “Age”, etc.) use:
  - `text-[10px] font-bold ... uppercase tracking-widest`
- In `src/components/chronicle/AvatarActionButtons.tsx`, both buttons currently use:
  - `text-sm font-semibold`
  - This is visibly larger than the rest of the Avatar panel typography, which is exactly what you’re seeing.

Implementation approach (minimal, targeted, consistent)
1) Match the button typography to the Avatar panel label typography
- File: `src/components/chronicle/AvatarActionButtons.tsx`
- Change BOTH buttons’ typography from `text-sm font-semibold` to match the panel’s label scale:
  - Use `text-[10px] font-bold` (same size as Name/Nicknames/Age labels)
  - Keep casing as-is (“Upload Image”, “AI Generate”) unless you want them uppercase. (Your labels are uppercase; buttons in your mockups are typically Title Case. We can keep Title Case and only match size.)
- Add `leading-none` to keep the 10px type from looking vertically “floaty” inside a tall button.
- Add `min-w-0` on the button + `truncate` on the text span so even on very narrow screens, text won’t blow out of the container.

Concrete class changes for the two main buttons
- Upload button (`<button ...>`)
  - Replace: `text-[hsl(var(--ui-text))] text-sm font-semibold`
  - With: `text-[hsl(var(--ui-text))] text-[10px] font-bold leading-none`
  - Add: `min-w-0`
  - Change the label span to: `<span className="min-w-0 truncate">...</span>`
- AI Generate button (`<button ...>`)
  - Replace: `text-[hsl(var(--ui-text))] text-sm font-semibold`
  - With: `text-[hsl(var(--ui-text))] text-[10px] font-bold leading-none`
  - Add: `min-w-0`
  - Change the label span to: `<span className="min-w-0 truncate">...</span>`

2) Scale the icons down to fit the 10px typography
- File: `src/components/chronicle/AvatarActionButtons.tsx`
- Current icons are `w-4 h-4` (16px). That reads too big next to 10px type.
- Change icons used inside the buttons to `w-3.5 h-3.5` (14px):
  - Upload icon
  - ChevronDown icon
  - Sparkles icon

3) Fix dropdown menu item text size to match (so nothing “randomly” looks bigger)
- File: `src/components/chronicle/AvatarActionButtons.tsx`
- Radix dropdown menu items have a default `text-sm` coming from `src/components/ui/dropdown-menu.tsx`.
- Override the two `DropdownMenuItem` rows with `text-[10px]` and shrink their icons to `w-3.5 h-3.5`.
  - This prevents the dropdown from feeling mismatched against the Avatar panel’s typography.

4) Bring the “Reposition / Save Position” button in the Avatar panel down to the same size
- File: `src/components/chronicle/CharactersTab.tsx`
- The “Reposition” button uses your local `Button` component from `src/components/chronicle/UI.tsx` which has a base `text-sm`.
- Since `className` is appended last in that Button implementation, we can override safely by adding:
  - `className="w-full text-[10px] font-bold leading-none ..."`
- This ensures all action buttons in the Avatar panel (Upload, AI Generate, Reposition) are the same scale.

Validation checklist (what you should see after)
- “Upload Image” and “AI Generate” text should visually match the “Name / Nicknames / Age” label size (10px).
- Nothing should overflow the Avatar panel on narrow screens:
  - If the screen gets extremely narrow, the button text should truncate (ellipsis) rather than spilling out.
- Icons should feel proportionate and no longer dominate the line.

Files that will be changed
- `src/components/chronicle/AvatarActionButtons.tsx`
  - Reduce text size to `text-[10px]`
  - Add truncation/min-width rules for safety
  - Shrink icons
  - Override dropdown item typography
- `src/components/chronicle/CharactersTab.tsx`
  - Override “Reposition / Save Position” button typography to `text-[10px]` for consistency within the Avatar panel

Optional follow-up (not required for this fix, but will help the “app isn’t responsive” issue)
- Do a quick responsive audit of the Avatar panel container widths/padding and the left-column sticky layout; the current layout is heavily “desktop-first” and will need some deliberate mobile breakpoints (spacing, sticky behavior, grid collapse, and consistent typography scale across components).
