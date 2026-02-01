
# Fix: Make Add Buttons Visually Clickable in Default State

## The Real Problem

The "+ Add Row" and "+ Add Goal" buttons look like plain text because they have **no background color** in their default state. Adding hover effects doesn't solve this - the buttons need to be visually distinct BEFORE hovering.

## Solution

Add a subtle background color to the default state, matching the skeleton card pattern from ScenarioHub:

**Skeleton Card (works well):**
```jsx
className="border-2 border-dashed border-slate-200 bg-slate-50/50 ..."
```

**Current Add Buttons (broken):**
```jsx
className="border-2 border-dashed border-slate-300 text-slate-500 ..." // No background!
```

**Fixed Add Buttons:**
```jsx
className="border-2 border-dashed border-slate-300 bg-slate-50/50 text-slate-500 ..."
```

---

## Files to Modify

| File | Change |
|------|--------|
| `CharactersTab.tsx` | Add `bg-slate-50/50` to "+ Add Row" button |
| `CharacterGoalsSection.tsx` | Add `bg-slate-50/50` to "+ Add Goal" button |

---

## Technical Details

### CharactersTab.tsx (line 621)

From:
```jsx
className="w-full py-3 border-2 border-dashed border-slate-300 text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 rounded-xl transition-all mt-4"
```

To:
```jsx
className="w-full py-3 border-2 border-dashed border-slate-300 bg-slate-50/50 text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all mt-4"
```

### CharacterGoalsSection.tsx (line 229)

From:
```jsx
className="w-full py-3 border-2 border-dashed border-slate-300 text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 rounded-xl transition-all mt-4"
```

To:
```jsx
className="w-full py-3 border-2 border-dashed border-slate-300 bg-slate-50/50 text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all mt-4"
```

---

## Visual Comparison

### Before (current - looks like text):
```
                    + Add Row
```
*(just text floating with an invisible light border)*

### After (with background - looks like a button):
```
┌─────────────────────────────────────────────────────────────┐
│                        + Add Row                            │  ← subtle gray background
└─────────────────────────────────────────────────────────────┘
```

The `bg-slate-50/50` creates a visible "button area" that signals interactivity without requiring a hover.
