

# Fix Three Issues: Custom Section Trash Icon, Step X Color, Goal Delete Button

## Issue 1: Custom Section Trash Icon Color (CharactersTab)
The trash icon in custom section headers (slate blue bar) is red (`text-red-500`), which is hard to see against the dark header. Change to white.

**File**: `src/components/chronicle/CharactersTab.tsx` (line 1229)
- Change `text-red-500 hover:text-red-400 p-1 rounded-md hover:bg-red-900/30` → `text-white hover:text-red-400 p-1 rounded-md hover:bg-white/10`

## Issue 2: Step X Icon Color (CharacterGoalsSection)
The X button to remove a step is grey (`text-zinc-500`). It should be red to match other X buttons.

**File**: `src/components/chronicle/CharacterGoalsSection.tsx` (line 323)
- Change `text-zinc-500 hover:text-rose-400` → `text-red-500 hover:text-red-400`

## Issue 3: Remove Goal Trash Icon (CharacterGoalsSection)
The trash icon positioned at `absolute top-4 right-4` inside each goal card should be removed entirely. It sits near the progress circle and is unwanted.

**File**: `src/components/chronicle/CharacterGoalsSection.tsx` (lines 233-236)
- Delete the entire block:
```tsx
{isEditMode && (
  <button onClick={() => deleteGoal(goal.id)} ...>
    <Trash2 ... />
  </button>
)}
```

Three files, three targeted fixes.

