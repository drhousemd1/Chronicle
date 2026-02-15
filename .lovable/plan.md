
# Update Your Stories Filter Toggle Styling

## Change

Update the segmented filter bar ("My Stories", "Saved Stories", "Published", "All") on the Your Stories page so the active toggle pill is slate blue instead of white, and the active text is white instead of black. Inactive text will also be adjusted for better contrast against the black background.

## Technical Details

**File:** `src/pages/Index.tsx`, lines 1427-1469

**Active state** (applied to whichever filter is selected):
- Change from: `bg-white text-slate-900 shadow-sm`
- Change to: `bg-slate-600 text-white shadow-sm`

**Inactive state** (non-selected filters):
- Change from: `text-slate-500 hover:text-slate-700`
- Change to: `text-slate-400 hover:text-slate-300`

**Track background** (the outer pill container):
- Change from: `bg-slate-200`
- Change to: `bg-slate-800` (to match the black page background better)

This applies to all four filter buttons (My Stories, Saved Stories, Published, All) at lines 1428-1469.
