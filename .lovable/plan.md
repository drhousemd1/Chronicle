
# Fix Plan: Character Goals Section UI Consistency

## Problem Summary

The Character Goals section has two UI inconsistencies compared to the other hardcoded sections (Physical Appearance, Currently Wearing, Preferred Clothing):

1. **Wrong color scheme**: Uses amber colors instead of the slate/emerald theme
2. **Wrong button placement**: The "+ Add" button is in the header instead of at the bottom

---

## Visual Comparison

### Current (Incorrect) Goals Section:
- Background: Amber (`bg-amber-50`)
- Header: Amber (`bg-amber-100`, text: `text-amber-900`)
- Column headers: Amber (`text-amber-700`)
- "+ Add" button: In the header area

### Correct Pattern (from HardcodedSection):
- Background: Slate (`bg-slate-100`, border: `border-slate-300`)
- Header: Emerald (`bg-emerald-100`, text: `text-emerald-900`)
- Column headers: Slate (`text-slate-500`)
- Add button: At the BOTTOM of the card (like "+ Add Row" in custom sections)

---

## Changes Required

### File: `src/components/chronicle/CharacterGoalsSection.tsx`

**1. Update Card styling (line 66)**

From:
```jsx
<Card className="... !bg-amber-50 border border-amber-200">
```

To:
```jsx
<Card className="... !bg-slate-100 border border-slate-300">
```

**2. Update Header styling (line 68)**

From:
```jsx
<div className="flex justify-between items-center bg-amber-100 rounded-xl px-3 py-2">
  <span className="text-amber-900 font-bold text-base">Character Goals</span>
  {/* Remove the + Add button from here */}
</div>
```

To:
```jsx
<div className="flex justify-between items-center bg-emerald-100 rounded-xl px-3 py-2">
  <span className="text-emerald-900 font-bold text-base">Character Goals</span>
</div>
```

**3. Update Column Headers (lines 86-97)**

Change `text-amber-700` to `text-slate-500` for consistency with HardcodedInput labels.

**4. Update Table Border (line 85)**

From: `border-b border-amber-200`
To: `border-b border-slate-200`

**5. Update Row Styling (lines 106-109)**

From:
```jsx
goal.progress >= 100 ? 'bg-emerald-50/50' : 'hover:bg-amber-100/50'
```

To:
```jsx
goal.progress >= 100 ? 'bg-emerald-50/50' : 'hover:bg-slate-50'
```

**6. Update Input Field Styling (lines 120-121, 135-136, 151-152)**

From: `border-amber-200 focus:border-amber-400`
To: `border-slate-200 focus:border-blue-500` (matching app's standard input styling)

**7. Move "+ Add Goal" Button to Bottom**

Remove the button from the header area (lines 70-80).

Add a new button at the BOTTOM of the goals list, AFTER the empty state area:

```jsx
{/* Add Goal Button - at bottom like custom sections */}
{!readOnly && sortedGoals.length > 0 && (
  <Button 
    variant="ghost" 
    className="w-full border border-dashed border-slate-300 text-slate-500 hover:bg-slate-50 mt-4"
    onClick={addGoal}
  >
    + Add Goal
  </Button>
)}
```

**8. Update Empty State Styling (lines 213-227)**

From: `text-amber-600/60`, `text-amber-700 hover:text-amber-900`
To: `text-slate-400`, standard ghost button styling

---

## Technical Details

### Complete Revised Structure:

```text
┌─────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Character Goals                            (emerald)│    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  GOAL          DESIRED OUTCOME    CURRENT STATUS    %       │
│  ─────────────────────────────────────────────────────      │
│  [textarea]    [textarea]         [textarea]        [ring]  │
│  [textarea]    [textarea]         [textarea]        [ring]  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              + Add Goal (dashed border)             │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Color Mapping Summary:

| Element | Incorrect (Amber) | Correct (Slate/Emerald) |
|---------|-------------------|-------------------------|
| Card background | `bg-amber-50` | `bg-slate-100` |
| Card border | `border-amber-200` | `border-slate-300` |
| Header background | `bg-amber-100` | `bg-emerald-100` |
| Header text | `text-amber-900` | `text-emerald-900` |
| Column headers | `text-amber-700` | `text-slate-500` |
| Row hover | `bg-amber-100/50` | `bg-slate-50` |
| Input borders | `border-amber-*` | `border-slate-*` |
| Empty state text | `text-amber-600/60` | `text-slate-400` |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/chronicle/CharacterGoalsSection.tsx` | Update all amber colors to slate/emerald, move Add button to bottom |

---

## Implementation Notes

- This is purely a styling fix with no logic changes
- The `CircularProgress` component doesn't need changes as it uses neutral/standard colors
- The delete button styling (rose colors) is correct and matches custom section row delete buttons
- The completed goal styling (`bg-emerald-50/50`) is appropriate and should remain
