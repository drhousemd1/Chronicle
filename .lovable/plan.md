

# Fix: Mode Toggle Stale State + Connector Targeting Wrong Step

## Two Bugs

### Bug 1: Advanced mode toggle needs 3 clicks
In `StoryGoalsSection.tsx` (line 335-343) and `ArcPhaseCard.tsx` (line 248-254), the mode toggle handler calls `updateGoal` for the mode change, then calls `addStep` (which internally calls `updateBranch` -> `updateGoal` again). Each call reads from the same stale snapshot. React batches them and only the last one wins, so the mode change gets overwritten.

**Fix**: Merge mode + initial steps into a single `updateGoal`/`onUpdate` call.

### Bug 2: Recovery Step 2 connector points at Progression Step 2 instead of Step 1
The current connector is a tiny 16px CSS horizontal line rendered at the vertical position of the source step. If Recovery Step 2 is lower on screen than Progression Step 1, the line shoots sideways at the WRONG height, visually pointing at whatever happens to be at that same Y position on the other side.

The user's reference HTML uses SVG paths drawn between actual DOM positions (using `getBoundingClientRect()`). We need the same approach:
- `computeActiveFlow` must return both the source step ID AND the target step ID (the first pending step on the opposite branch)
- An SVG overlay in the parent draws a curved/angled path FROM the source step card TO the target step card
- Step cards need `data-step-id` attributes so we can find them in the DOM
- A `useEffect` + `ResizeObserver` recalculates the path when layout changes

## Detailed Changes

### 1. Update `computeActiveFlow` (both files)

Return source AND target IDs:

```text
function computeActiveFlow(failBranch, successBranch):
  -> { sourceId, sourceBranch, targetId, targetBranch } | null

  If latest resolved step SUCCEEDED on fail branch:
    targetId = first PENDING step on success branch
    (if no pending step exists, return null)

  If latest resolved step FAILED on success branch:
    targetId = first PENDING step on fail branch
    (if no pending step exists, return null)

  Otherwise: return null (no cross-over)
```

### 2. Remove connector rendering from `ArcBranchLane.tsx`

Remove the `activeFlowStepId` and `flowDirection` props entirely. Remove the CSS horizontal dotted line (lines 110-116). Step cards keep their existing structure but get a `data-step-id={step.id}` attribute on the outer div.

### 3. Add SVG connector overlay to parent (new component `ArcFlowConnector`)

Create `src/components/chronicle/arc/ArcFlowConnector.tsx`:
- Takes `containerRef`, `sourceStepId`, `targetStepId` as props
- Uses `useEffect` to find step cards by `[data-step-id]` inside the container
- Calls `getBoundingClientRect()` on both to get positions relative to the container
- Draws a dashed SVG path (line or bezier curve) from source center-edge to target center-edge
- Uses `ResizeObserver` on the container to redraw when layout changes

### 4. Wire it up in the parent grid wrapper (both `StoryGoalsSection.tsx` and `ArcPhaseCard.tsx`)

The `<div className="relative mt-3">` wrapper gets a ref. Inside it, after the grid, render `<ArcFlowConnector>` when `flow` is not null:

```text
<div ref={containerRef} className="relative mt-3">
  <div className="grid grid-cols-2 gap-4">
    <ArcBranchLane ... />   (no more activeFlowStepId prop)
    <ArcBranchLane ... />
  </div>
  {flow && (
    <ArcFlowConnector
      containerRef={containerRef}
      sourceStepId={flow.sourceId}
      targetStepId={flow.targetId}
    />
  )}
</div>
```

### 5. Fix mode toggle stale state (both files)

Replace the mode toggle handler to build the complete state in one call:

```text
onChange={(m) => {
  const patch: any = { mode: m, updatedAt: now() };
  if (m === 'advanced') {
    const fb = ensureBranch(branches.fail, 'fail');
    const sb = ensureBranch(branches.success, 'success');
    const newFail = fb.steps.length === 0
      ? { ...fb, steps: [{ id: uid('astep'), description: '', status: 'pending', statusEventOrder: 0 }] }
      : fb;
    const newSuccess = sb.steps.length === 0
      ? { ...sb, steps: [{ id: uid('astep'), description: '', status: 'pending', statusEventOrder: 0 }] }
      : sb;
    patch.branches = { ...branches, fail: newFail, success: newSuccess };
  }
  updateGoal(goal.id, patch);  // ONE call
}}
```

## Files to Create/Modify

| File | Change |
|------|--------|
| `src/components/chronicle/arc/ArcFlowConnector.tsx` | **NEW** - SVG overlay that draws a dashed path between two step cards by ID |
| `src/components/chronicle/arc/ArcBranchLane.tsx` | Remove `activeFlowStepId`/`flowDirection` props and CSS line. Add `data-step-id` to step cards |
| `src/components/chronicle/StoryGoalsSection.tsx` | Update `computeActiveFlow` return type. Fix mode toggle to single call. Add `containerRef` + `ArcFlowConnector` |
| `src/components/chronicle/arc/ArcPhaseCard.tsx` | Same changes as StoryGoalsSection for phase-level |

