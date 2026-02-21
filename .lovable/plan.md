

# Fix Active Flow Connector Logic

## The Problem

The `computeActiveFlow` function has the logic inverted:
- Currently: when a step **fails**, it crosses to the opposite branch
- Correct: when a step **fails**, it stays on the same branch (no connector line); when it **succeeds** on the fail branch, it crosses to the success branch

## The Correct Logic

1. Recovery Step 1 **fails** -> no cross-over line, flow continues down to Recovery Step 2
2. Recovery Step 1 **succeeds** -> dotted line crosses from Recovery Step 1 to next pending Progression step
3. Progression Step 1 **fails** -> dotted line crosses from Progression Step 1 to next pending Recovery step
4. Progression Step 1 **succeeds** -> no cross-over, flow continues down Progression path

In short: **failure stays on the same branch, success on the fail branch crosses over, failure on the success branch crosses over**.

## Changes

**File**: `src/components/chronicle/StoryGoalsSection.tsx` (lines 97-112)

Replace the `computeActiveFlow` logic:

```typescript
// If the latest step SUCCEEDED on the fail branch -> cross to success branch
if (latest.step.status === 'succeeded' && latest.branch === 'fail') {
  const nextPending = successBranch.steps.find(s => s.status === 'pending');
  if (!nextPending) return null;
  return { failActiveId: latest.step.id, successActiveId: nextPending.id };
}

// If the latest step FAILED on the success branch -> cross to fail branch
if (latest.step.status === 'failed' && latest.branch === 'success') {
  const nextPending = failBranch.steps.find(s => s.status === 'pending');
  if (!nextPending) return null;
  return { failActiveId: nextPending.id, successActiveId: latest.step.id };
}

// All other cases (failed on fail branch = stay, succeeded on success = stay) -> no cross-over
return null;
```

This is the only file that needs changing. The same `computeActiveFlow` function is already used by `ArcPhaseCard.tsx` since it was duplicated there -- so both files need the same fix.

**Files to modify:**
| File | Change |
|------|--------|
| `StoryGoalsSection.tsx` | Fix `computeActiveFlow` logic (lines 97-112) |
| `ArcPhaseCard.tsx` | Fix duplicated `computeActiveFlow` logic |

