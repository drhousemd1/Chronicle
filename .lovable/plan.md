
# Fix Vertical Line and Dotted Flow Connector

## 3 Changes

### 1. Fix the invisible vertical line (THE REAL BUG)

The vertical stem going UP from the horizontal bar is invisible because of an SVG gradient bug. The gradient uses `gradientUnits="objectBoundingBox"` (the default) applied to a perfectly vertical line where `x1 = x2 = 50`. A vertical line has a bounding box with **zero width**, which makes the gradient coordinate system degenerate -- the browser can't compute coordinates and renders nothing.

**Fix**: Add `gradientUnits="userSpaceOnUse"` to the gradient definition and change `y1`/`y2` from relative (0, 1) to absolute SVG coordinates (0, 64). This tells the browser to use the SVG coordinate space directly instead of the element's bounding box.

**File**: `ArcConnectors.tsx`, line 20

Before:
```
<linearGradient id="fade-down" x1="0" y1="0" x2="0" y2="1">
```

After:
```
<linearGradient id="fade-down" x1="0" y1="0" x2="0" y2="64" gradientUnits="userSpaceOnUse">
```

### 2. Replace static dotted lines with a single dynamic "active flow" connector

The current code puts a dotted line on EVERY step card. That's wrong. There should be only ONE dotted line at a time showing the current flow between branches.

**How it works**: When a step is marked as failed or succeeded, the `statusEventOrder` tracks the chronological sequence. The "active flow line" connects the most recently resolved step to the next pending step on the opposite branch.

Example flow:
- Resistance trigger fires, goes to Fail Step 1
- Fail Step 1 fails (statusEventOrder=1) -> dotted line to Fail Step 2
- Fail Step 2 succeeds (statusEventOrder=2) -> dotted line from Fail Step 2 across to Succeed Step 1
- Succeed Step 2 fails (statusEventOrder=3) -> dotted line from Succeed Step 2 across to Fail Step 3

**Logic**: Find the step with the highest `statusEventOrder` across both branches. If that step failed, the flow crosses to the opposite branch's next pending step. If it succeeded and is on the fail branch, it crosses to the next pending succeed step. The dotted line renders from that source step to the target step.

**Implementation**: 
- Remove the static dotted line from `ArcBranchLane.tsx` (lines 106-110)
- Add a new computed "activeFlowLine" in both `StoryGoalsSection.tsx` and `ArcPhaseCard.tsx` that calculates source and target step positions
- Render a single absolutely-positioned dotted line in the grid area connecting the two steps

The flow line computation:
```
1. Collect all steps with statusEventOrder > 0 from both branches
2. Find the one with the highest statusEventOrder (most recent)
3. If it failed: target = next pending step on the OPPOSITE branch
4. If it succeeded on fail branch: target = next pending step on succeed branch
5. If it succeeded on succeed branch: no cross-over, flow continues on succeed branch
6. Render a horizontal dotted line at the vertical position of the source step, 
   extending from one column to the other
```

**File changes**:
- `ArcBranchLane.tsx`: Remove the static dotted line div (lines 106-110), add a `data-step-index` attribute to each step card for positioning
- `StoryGoalsSection.tsx`: Add flow line computation and render a single dotted connector
- `ArcPhaseCard.tsx`: Same flow line computation and render

### 3. Ensure the dotted line renders correctly between the two columns

The dotted line will be rendered as an absolutely positioned div inside the `relative` wrapper around the grid. It will be positioned at the vertical midpoint of the source step card and extend horizontally across the gap between columns.

Since steps have variable heights (auto-resizing textareas), we need to use refs to measure actual step positions. A simpler approach: use CSS with `data-active-flow` attributes and position the line based on the step index.

Actually, the simplest correct approach: render the dotted line as part of the step card itself (only on the one active step), extending outward toward the opposite lane. This avoids complex ref-based positioning.

- On the source step card only, render a dotted line extending from its edge toward the gap
- On the target step card only, render a dotted line extending from its edge toward the gap
- Together they create a visual connection across the gap

**Props change for ArcBranchLane**: Add `activeFlowStepId?: string` and `flowDirection?: 'left' | 'right'` props. Only the step matching `activeFlowStepId` gets the dotted connector, pointing in `flowDirection`.

## Files to Modify

| File | Changes |
|------|---------|
| `ArcConnectors.tsx` | Add `gradientUnits="userSpaceOnUse"` and absolute y coordinates to fix invisible line |
| `ArcBranchLane.tsx` | Remove static dotted lines from all steps; add conditional dotted line only on active flow step |
| `StoryGoalsSection.tsx` | Compute active flow line (source step, target step, direction) and pass to branch lanes |
| `ArcPhaseCard.tsx` | Same active flow computation and pass to branch lanes |

## Technical: Active Flow Computation

```typescript
function computeActiveFlow(
  failBranch: ArcBranch, 
  successBranch: ArcBranch
): { failActiveId?: string; successActiveId?: string } | null {
  // Gather all resolved steps with their branch info
  const resolved: Array<{ step: ArcStep; branch: 'fail' | 'success' }> = [];
  
  failBranch.steps.forEach(s => {
    if (s.statusEventOrder > 0) resolved.push({ step: s, branch: 'fail' });
  });
  successBranch.steps.forEach(s => {
    if (s.statusEventOrder > 0) resolved.push({ step: s, branch: 'success' });
  });
  
  if (resolved.length === 0) return null;
  
  // Find most recent
  resolved.sort((a, b) => b.step.statusEventOrder - a.step.statusEventOrder);
  const latest = resolved[0];
  
  // Determine if flow crosses branches
  if (latest.step.status === 'failed') {
    // Failed -> crosses to opposite branch's next pending step
    const opposite = latest.branch === 'fail' ? successBranch : failBranch;
    const nextPending = opposite.steps.find(s => s.status === 'pending');
    if (!nextPending) return null;
    
    return latest.branch === 'fail' 
      ? { failActiveId: latest.step.id, successActiveId: nextPending.id }
      : { failActiveId: nextPending.id, successActiveId: latest.step.id };
  }
  
  if (latest.step.status === 'succeeded' && latest.branch === 'fail') {
    // Succeeded on fail branch -> crosses to succeed branch
    const nextPending = successBranch.steps.find(s => s.status === 'pending');
    if (!nextPending) return null;
    return { failActiveId: latest.step.id, successActiveId: nextPending.id };
  }
  
  // Succeeded on success branch -> no cross-over needed
  return null;
}
```

The function returns the IDs of the two steps that should have dotted connectors extending toward each other. Each branch lane receives its active step ID and renders the dotted line only on that step.
