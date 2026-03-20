

# Fix: Character Builder — Replace Red X with Trash2 + Align Icons

## Summary
Standardize all delete icons across the Character Builder to use `Trash2` instead of `X`, fix lock icon vertical centering, add lock/trash to Goals and Desires cards, and match the personality dropdown height to its row.

## Changes

### 1. `src/components/chronicle/CharactersTab.tsx`

**a) BuiltInRow lock icon centering (line 496, 526)**
- Change row container from `items-start` to `items-center` so the lock icon centers vertically on the description field
- The lock wrapper already has `w-7 flex-shrink-0 flex items-center justify-center` — just needs the parent `items-center`

**b) ExtraRow: Replace X with Trash2 (lines 573-580)**
- Replace `<X className="w-4 h-4" />` with `<Trash2 size={16} />`
- Change class from `text-red-500 hover:text-red-400 p-1.5 rounded-md hover:bg-red-900/30 mt-1` to `text-zinc-500 hover:text-rose-400 transition-colors p-1`
- Wrap in the standard centering div: `w-7 flex-shrink-0 flex items-center justify-center`
- Change ExtraRow container from `items-start` to `items-center`
- This fixes: Physical Appearance, Currently Wearing, Preferred Clothing, Tone, Background, Key Life Events, Relationships, Secrets, Fears (all use ExtraRow)

**c) Custom Content sections — structured rows (line 2157-2167)**
- Replace `<X>` with `<Trash2 size={16} />`
- Update styling to `text-zinc-500 hover:text-rose-400 transition-colors p-1`
- Wrap in centering div, change row to `items-center`

**d) Custom Content sections — freeform rows (line 2062-2072)**
- Replace `<X>` with `<Trash2 size={16} />`
- Update styling to `text-zinc-500 hover:text-rose-400 transition-colors p-1`
- Wrap in centering div, change row to `items-center`

### 2. `src/components/chronicle/PersonalitySection.tsx`

**a) Replace X with Trash2 (lines 138-145)**
- Replace `<X className="w-4 h-4" />` with `<Trash2 size={16} />`
- Update styling to `text-zinc-500 hover:text-rose-400 transition-colors p-1`
- Change row container from `items-start` to `items-center`
- Add `Trash2` to imports, can remove `X`

**b) Dropdown height (line 132)**
- Remove `mt-1` from the select element
- Add `self-stretch` or match the input height by adding `h-full` or explicitly sizing to match the label/description fields. Set `py-2` to match the input padding so the dropdown aligns at the same height as adjacent fields.

### 3. `src/components/chronicle/CharacterGoalsSection.tsx`

**a) Steps: Replace X with Trash2 (line 333)**
- Replace `<X className="h-4 w-4" />` with `<Trash2 size={16} />`
- Update styling to `text-zinc-500 hover:text-rose-400 transition-colors p-1`
- Change step row from `items-start` to `items-center`
- Remove `mt-2.5` from Checkbox, remove `mt-2` from delete button
- Add `Lock` to imports

**b) Goal cards: Add lock/trash icon (around line 240)**
- Change the "Goal Name" label line to a flex row with `justify-between`
- For the first goal (`goalIdx === 0` from `sortedGoals.map`): show `<Lock className="w-3.5 h-3.5 text-zinc-400" />` right-aligned
- For subsequent goals (`goalIdx >= 1`): show `<Trash2>` button that calls `deleteGoal(goal.id)`, styled `text-zinc-500 hover:text-rose-400`
- Position sits on the label row, above the input field, no displacement of progress ring

## Files Modified
- `src/components/chronicle/CharactersTab.tsx` — BuiltInRow centering, ExtraRow X→Trash2, Custom content X→Trash2
- `src/components/chronicle/PersonalitySection.tsx` — X→Trash2, dropdown height
- `src/components/chronicle/CharacterGoalsSection.tsx` — Steps X→Trash2, goal card lock/trash, step alignment

