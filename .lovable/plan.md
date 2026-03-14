

## Update Navigation Bar Buttons to Match Add Row / Add Text Field Buttons

### What's changing
The navigation sidebar buttons currently use a tighter shadow (`0 2px 6px`) and `rounded-[14px]`. Updating them to use the same shadow (`0 8px 24px`) and `rounded-xl` (12px) used by Add Row, Add Text Field, and segmented toggle buttons — making Add Row the canonical style.

### Changes

**File: `src/components/chronicle/CharactersTab.tsx`**

Two locations:

1. **`NavButton` component** (~line 339-344): Update shadow from `0_2px_6px_rgba(0,0,0,0.40)` → `0_8px_24px_rgba(0,0,0,0.45)` and radius from `rounded-[14px]` → `rounded-xl`. Also update the active-state shadow similarly.

2. **`navActionButtonClass` string** (~line 732): Same shadow and radius update.

No functional or interaction changes — hover lift, active press, brightness transitions all stay.

