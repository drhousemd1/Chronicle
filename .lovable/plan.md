

# Fix: Admin Button Spacing

## Problem
The two admin buttons (Download Session Log and Download Master Prompt) sit directly next to each other with no gap. The Time Progression section above uses `flex flex-col gap-2` to space its rows — the admin section is missing this wrapper.

## Fix
Wrap the two admin buttons in a `<div className="flex flex-col gap-2">` container, matching the exact same pattern used at line 4876 for the Time Progression rows.

## File
- **`src/components/chronicle/ChatInterfaceTab.tsx`** — Add `flex flex-col gap-2` wrapper around the two buttons (after the subtitle text, around lines 4921–5080)

