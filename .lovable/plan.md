

# Fix: Icon Consistency on Story Builder Page

## Summary
Standardize delete icons across the Story Builder — replace Red X with trash cans, remove redundant delete buttons on custom content rows, and add delete/lock icons to Story Goal cards.

## Changes

### 1. World Core — Custom Content: Remove Red X from rows
Since each custom section already has a trash can on its title row (to delete the whole section), the per-row Red X is redundant.

**`src/components/chronicle/WorldTab.tsx`**:
- **Structured rows** (lines 984–995): Remove the `<X>` delete button entirely from each structured item row
- **Freeform rows** (lines 1040–1052): Remove the `<X>` delete button entirely from each freeform item row

### 2. Story Goals — Steps: Replace Red X with Trash2
**`src/components/chronicle/StoryGoalsSection.tsx`** (lines 337–341):
- Replace `<X className="h-4 w-4" />` with `<Trash2 size={16} />` 
- Update styling from `text-red-500 hover:text-red-400` to `text-zinc-500 hover:text-rose-400` to match the location trash icon pattern
- Add `Lock` and `Trash2` to imports, can remove `X` if no longer used

### 3. Story Goals — Goal Cards: Add trash/lock icon
**`src/components/chronicle/StoryGoalsSection.tsx`** (around line 238–239):
- Add a trash can or lock icon to the right of the "Goal Name" label row (not next to the progress ring — above the input, inline with the label)
- For the first goal card (`idx === 0` from `sortedGoals`): show a `Lock` icon (`w-3.5 h-3.5 text-zinc-400`)
- For subsequent goal cards (`idx >= 1`): show a `Trash2` button (`text-zinc-500 hover:text-rose-400`) that calls `deleteGoal(goal.id)`
- Layout: Add the icon to the existing `<label>` line using a flex wrapper with `justify-between`, so it sits right-aligned on the same line as "Goal Name" without affecting the progress ring or other elements

### 4. Story Goals — Delete protection
- Update `deleteGoal` to prevent deleting when only one goal remains (or guard at the UI level by only showing trash for `idx >= 1`)

## Files Modified
- `src/components/chronicle/WorldTab.tsx` — Remove per-row X buttons from custom content (both structured and freeform)
- `src/components/chronicle/StoryGoalsSection.tsx` — Replace step X with trash, add goal-level trash/lock icons

