
# Auto-populate a Default Story Arc

## What changes
When the Story Arcs section renders with an empty goals array, it will automatically create one default (blank) story arc so users don't have to click "Add New Story Arc" manually.

## Technical approach

**File:** `src/components/chronicle/StoryGoalsSection.tsx`

Add a `useEffect` that fires when the component mounts. If `goals` is empty, call `onChange` with a single default story arc (using the same shape as the existing `addGoal` function).

This is a ~5-line addition:
- Import `useEffect` (already have `React` imported)
- Add a `useEffect` after the `migratedGoals` memo that checks if `goals.length === 0` and calls `onChange` with one pre-populated blank arc

The default arc will have the same empty structure as clicking "Add New Story Arc" — no pre-filled text, just the container visible and ready for input.
