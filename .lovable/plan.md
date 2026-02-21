

# Fix Story Arc Remaining Issues

## 6 Changes

### 1. Auto-populate steps when toggling to Advanced mode
When the mode toggle switches to "advanced", if either the success or fail branch has 0 steps, auto-add 1 empty step to each. This happens in both `StoryGoalsSection.tsx` (root phase) and `ArcPhaseCard.tsx` (linked phases).

**StoryGoalsSection.tsx**: Replace the `ArcModeToggle` `onChange` callback to check branch steps and auto-add if empty.

**ArcPhaseCard.tsx**: Same logic in its mode toggle handler.

### 2. Center "+ Add Step" text under each lane
Currently the "+ Add Step" button is left-aligned. Add `justify-center` to center it under the lane it belongs to.

**File**: `ArcBranchLane.tsx` line 191-198 -- add `justify-center` to the button class.

### 3. Make "+ Add Next Phase" a dashed-outline centered button
Replace the current right-aligned text link with a centered dashed-outline button matching the "Add New Story Arc" pattern:

```
w-full flex items-center justify-center gap-2 py-2.5 text-sm bg-transparent
border-2 border-dashed border-zinc-500 text-blue-400 hover:border-blue-400
hover:bg-blue-500/5 font-medium rounded-xl transition-colors cursor-pointer mt-4
```

**File**: `StoryGoalsSection.tsx` lines 351-361 -- replace the button and its wrapping div.

### 4. Restore the fading vertical connector line above the split
The image shows a vertical line running from the "STEPS" label area down to the horizontal split bar, with a fade-out at the very top. Currently the `ArcConnectors` split connector has the fade gradient but the `marginTop: -20px` is cutting it off visually. The fix is to extend the height and remove the negative margin so the line is visible and fades properly above the horizontal bar.

**File**: `ArcConnectors.tsx` -- for the split type, change:
- Container height from 68px to 88px
- Remove the negative margin
- Extend viewBox upward more (from y=-20 to y=-40)
- Move the stem start from y=-20 to y=-40

### 5. Step card border color on status change
When a step's status is "failed", the card gets a red border. When "succeeded", it gets a slate blue border. When "pending", the default `border-white/15`.

**File**: `ArcBranchLane.tsx` lines 105-108 -- make the border class dynamic based on `step.status`:
- `'failed'` -> `border-red-500/50`
- `'succeeded'` -> `border-blue-400/50`
- default -> `border-white/15`

### 6. Add dotted connector line between fail and succeed columns
Add a horizontal dotted line between the two branch lanes to visually show the pathway between them. This goes inside the grid container, rendered as an SVG or a styled `<div>` with a dashed border.

**File**: `StoryGoalsSection.tsx` -- inside the 2-column grid area (line 323), add a visual connector. Also in `ArcPhaseCard.tsx` (line 243).

Implementation: After the grid div, add a horizontal dashed line overlay centered vertically in the grid. Use an absolutely positioned element inside a `relative` wrapper:

```tsx
<div className="relative">
  {/* Dotted center line connecting fail and succeed */}
  <div className="absolute top-1/2 left-1/4 right-1/4 border-t-2 border-dashed border-zinc-500/40 -translate-y-1/2 pointer-events-none" />
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px' }}>
    {/* lanes */}
  </div>
</div>
```

## Files to Modify

| File | Changes |
|------|---------|
| `ArcBranchLane.tsx` | Center Add Step, dynamic step card border color |
| `StoryGoalsSection.tsx` | Auto-add steps on Advanced toggle, dashed Add Next Phase button, dotted connector line |
| `ArcPhaseCard.tsx` | Auto-add steps on Advanced toggle, dotted connector line |
| `ArcConnectors.tsx` | Fix fading vertical stem visibility |

## Technical Details

### Auto-populate steps (StoryGoalsSection.tsx)

Replace the mode toggle onChange:
```tsx
onChange={(m) => {
  updateGoal(goal.id, { mode: m });
  if (m === 'advanced') {
    const fb = ensureBranch(branches.fail, 'fail');
    const sb = ensureBranch(branches.success, 'success');
    if (fb.steps.length === 0) {
      addStep(goal.id, 'fail');
    }
    if (sb.steps.length === 0) {
      addStep(goal.id, 'success');
    }
  }
}}
```

### Dynamic step card border (ArcBranchLane.tsx)

```tsx
<div
  key={step.id}
  className={cn(
    "p-2.5 pb-3 rounded-[18px] border",
    step.status === 'failed' ? "border-red-500/50" :
    step.status === 'succeeded' ? "border-blue-400/50" :
    "border-white/15"
  )}
  style={{ background: stepCardBg }}
>
```

### Connector fade fix (ArcConnectors.tsx)

For split type:
- Height: 88px (was 68px)
- No negative margin (was -20px)
- viewBox: `0 -40 100 88`
- Stem starts at y=-40 (was -20)

### Add Next Phase button

```tsx
<button
  type="button"
  onClick={() => addPhase(goal.id)}
  className="w-full flex items-center justify-center gap-2 py-2.5 text-sm bg-transparent border-2 border-dashed border-zinc-500 text-blue-400 hover:border-blue-400 hover:bg-blue-500/5 font-medium rounded-xl transition-colors cursor-pointer mt-4"
>
  <Plus className="w-5 h-5" />
  Add Next Phase
</button>
```

