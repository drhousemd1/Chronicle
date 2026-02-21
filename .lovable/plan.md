

# Fix: Counter Race Condition and Dotted Line Visibility

## Root Cause Analysis

### Bug 1: statusEventCounter race condition (THE REAL PROBLEM)

In `StoryGoalsSection.tsx` lines 179-193, `toggleStatus` makes two calls:

```
updateGoal(goalId, { statusEventCounter: counter });  // call 1
updateStep(goalId, type, stepId, { ... });             // call 2 -> calls updateBranch -> calls updateGoal
```

Both calls read from the same `migratedGoals` snapshot. React batches them, so only the LAST `onChange` wins. The counter update from call 1 is overwritten by call 2 (which only patches branches). Result: `statusEventCounter` stays at 0 forever, every step gets `statusEventOrder = 1`, and `computeActiveFlow` can't determine the latest step.

### Bug 2: Dotted line is only 8px wide

Even when `computeActiveFlow` returns valid IDs, the dotted connector is `w-[8px]` -- practically invisible.

## Fix

### File 1: `src/components/chronicle/StoryGoalsSection.tsx`

**Merge the two calls into one.** Replace the `toggleStatus` function (lines 179-193) so it does a single `updateGoal` call that includes BOTH the counter update AND the step status update:

```typescript
const toggleStatus = (goalId: string, type: 'fail' | 'success', stepId: string, targetStatus: StepStatus) => {
  const goal = migratedGoals.find(g => g.id === goalId);
  if (!goal) return;
  const branch = ensureBranch(goal.branches?.[type], type);
  const step = branch.steps.find(s => s.id === stepId);
  if (!step) return;
  const newStatus = step.status === targetStatus ? 'pending' : targetStatus;
  const counter = (goal.statusEventCounter || 0) + 1;
  const updatedSteps = branch.steps.map(s =>
    s.id === stepId
      ? { ...s, status: newStatus, statusEventOrder: newStatus !== 'pending' ? counter : 0, completedAt: newStatus === 'succeeded' ? now() : undefined }
      : s
  );
  const branches = goal.branches || {};
  updateGoal(goalId, {
    statusEventCounter: counter,
    branches: { ...branches, [type]: { ...branch, steps: updatedSteps } },
  });
};
```

This is ONE `updateGoal` call containing both the counter and the step change. No race condition.

### File 2: `src/components/chronicle/arc/ArcBranchLane.tsx`

Make the dotted line wider so it's actually visible. Change `w-[8px]` to `w-[16px]` and adjust positioning:

```
- flowDirection === 'right' ? "-right-[8px] w-[8px]" : "-left-[8px] w-[8px]"
+ flowDirection === 'right' ? "-right-[16px] w-[16px]" : "-left-[16px] w-[16px]"
```

This makes each side's dotted line extend 16px into the gap (the gap is `gap-4` = 16px), so both sides together visually connect across the full gap.

### File 3: `src/components/chronicle/arc/ArcPhaseCard.tsx`

Apply the same race condition fix to `toggleStatus` in ArcPhaseCard (lines 144-155). Merge counter + step update into a single `onUpdate` call:

```typescript
const toggleStatus = (type: 'fail' | 'success', stepId: string, targetStatus: StepStatus) => {
  const branch = type === 'fail' ? failBranch : successBranch;
  const step = branch.steps.find(s => s.id === stepId);
  if (!step) return;
  const newStatus = step.status === targetStatus ? 'pending' : targetStatus;
  const counter = (phase.statusEventCounter || 0) + 1;
  const updatedSteps = branch.steps.map(s =>
    s.id === stepId
      ? { ...s, status: newStatus, statusEventOrder: newStatus !== 'pending' ? counter : 0, completedAt: newStatus === 'succeeded' ? now() : undefined }
      : s
  );
  onUpdate({
    statusEventCounter: counter,
    branches: { ...branches, [type]: { ...branch, steps: updatedSteps } },
    updatedAt: now(),
  });
};
```

## Summary

| File | Change |
|------|--------|
| `StoryGoalsSection.tsx` | Merge toggleStatus into single updateGoal call to fix counter race |
| `ArcPhaseCard.tsx` | Same race condition fix for phase-level toggleStatus |
| `ArcBranchLane.tsx` | Increase dotted line width from 8px to 16px |

## Cross-over logic (unchanged, already correct)

- Succeeded on fail branch -> dotted line crosses to next pending success step
- Failed on success branch -> dotted line crosses to next pending fail step
- Failed on fail branch -> no line (stays on same branch)
- Succeeded on success branch -> no line (stays on same branch)
