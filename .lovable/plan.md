

# Fix Story Arc Header, Connector Lines, and Conditional Rendering

## 3 Issues to Fix

### Issue 1: Header has 2 icons and is too large

**Current (line 231-240)**: The header has a `Target` Lucide icon AND a `▸` triangle character in the text -- that's 2 icons. The font-size is `28px` which is too large.

**Fix**:
- Remove the `▸` character from the h2 text
- Replace the `Target` icon with a single appropriate icon -- `GitBranch` from lucide-react makes sense for "Story Arcs" (branching narrative paths)
- Reduce font-size from `28px` to `18px`
- Reduce `minHeight` from `80px` to `56px`

### Issue 2: Connector lines use curves instead of straight lines

**Current**: `ArcConnectors.tsx` uses cubic bezier curves (`C` commands in SVG path data):
- Split: `M200,0 L200,18 C200,36 140,48 100,56` -- curves outward
- Merge: `M100,10 C140,18 200,30 200,48 L200,66` -- curves inward

**Fix**: Replace with straight lines using only `M` and `L` commands:
- Split: A vertical line down from center, then two straight diagonal lines going to left and right endpoints
- Merge: Two straight diagonal lines from left and right converging to center, then vertical line down

The SVG paths become:
- Split left: `M200,0 L200,22 L100,56`
- Split right: `M200,0 L200,22 L300,56`
- Merge left: `M100,10 L200,44 L200,66`
- Merge right: `M300,10 L200,44 L200,66`

These are purely straight-line segments with no curves.

### Issue 3: Merge connector shows even when there's no next phase

**Current**: In `StoryGoalsSection.tsx` line 440, `<ArcConnectors type="merge" />` always renders at the bottom of the steps section. Same in `ArcPhaseCard.tsx` line 357.

**Fix**:
- In `StoryGoalsSection.tsx`: Only render the merge connector if `(goal.linkedPhases || []).length > 0` -- meaning there's at least one phase after the root card to connect to.
- In `ArcPhaseCard.tsx`: Add a new prop `hasNextPhase: boolean` and only render the merge connector when `hasNextPhase` is true. Pass this prop from `StoryGoalsSection.tsx` based on the phase's index in the array.

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/chronicle/StoryGoalsSection.tsx` | Replace `Target` import with `GitBranch`, remove `▸` from header, reduce header size. Conditionally render merge connector only when linkedPhases exist. Pass `hasNextPhase` prop to ArcPhaseCard. |
| `src/components/chronicle/arc/ArcConnectors.tsx` | Replace curved SVG paths with straight lines (`L` commands only, no `C` curves). |
| `src/components/chronicle/arc/ArcPhaseCard.tsx` | Add `hasNextPhase` prop. Only render merge connector when `hasNextPhase` is true. |

