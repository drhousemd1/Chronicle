

# Fix: Two Dotted Lines Instead of One

## The Problem

`computeActiveFlow` returns two step IDs — one for each branch. Both branch lanes render a dotted line on their respective active step. Since these steps are at different vertical positions (e.g., Recovery Step 2 and Progression Step 1), the result is TWO separate horizontal dashes at different heights instead of ONE connector.

## The Fix

Only pass `activeFlowStepId` to the SOURCE branch (the one containing the step that just got resolved). Don't pass it to the TARGET branch. This produces exactly one dotted line pointing from the source step toward the other column.

## Changes

### File: `src/components/chronicle/StoryGoalsSection.tsx`

Change how `flow` results are passed to the two `ArcBranchLane` components (lines 362-387).

Currently both lanes get an ID:
```
activeFlowStepId={flow?.failActiveId}    // fail lane
activeFlowStepId={flow?.successActiveId} // success lane
```

Change to only pass the ID to the SOURCE lane. `computeActiveFlow` already tells us which branch is the source based on the logic:
- Succeeded on fail branch: source = fail lane
- Failed on success branch: source = success lane

Update `computeActiveFlow` to also return which branch is the source:

```typescript
function computeActiveFlow(
  failBranch: ArcBranch,
  successBranch: ArcBranch
): { sourceId: string; sourceBranch: 'fail' | 'success' } | null {
  // ... same resolved/sort logic ...
  
  if (latest.step.status === 'succeeded' && latest.branch === 'fail') {
    return { sourceId: latest.step.id, sourceBranch: 'fail' };
  }
  if (latest.step.status === 'failed' && latest.branch === 'success') {
    return { sourceId: latest.step.id, sourceBranch: 'success' };
  }
  return null;
}
```

Then pass props like:
```
// Fail lane: only gets activeFlowStepId if it's the source
activeFlowStepId={flow?.sourceBranch === 'fail' ? flow.sourceId : undefined}
flowDirection="right"

// Success lane: only gets activeFlowStepId if it's the source
activeFlowStepId={flow?.sourceBranch === 'success' ? flow.sourceId : undefined}
flowDirection="left"
```

Result: exactly ONE dotted line extending from the source step toward the opposite column.

### File: `src/components/chronicle/arc/ArcPhaseCard.tsx`

Same change — update the duplicated `computeActiveFlow` and only pass `activeFlowStepId` to the source lane.

## Files to Modify

| File | Change |
|------|--------|
| `StoryGoalsSection.tsx` | Simplify `computeActiveFlow` return type; only pass active ID to source lane |
| `ArcPhaseCard.tsx` | Same changes for phase-level flow |

