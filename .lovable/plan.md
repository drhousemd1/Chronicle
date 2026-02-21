

# Fix Story Arc Layout -- Following Your Exact Instructions

## 1. Progress ring inline with Goal Name

**Current**: Two-column grid `grid-cols-[1fr_220px]` puts Goal Name, Desired Outcome, AND Guidance Strength all in the left column, with the progress ring spanning the full right column height.

**Fix**: Replace the grid with a flex row for JUST the Goal Name + Delete button + Progress Ring. The Goal Name input keeps its current width -- it will be `flex-1` (taking remaining space after the ring). The progress ring and delete button sit to the right, on the same row.

The layout becomes:
```text
+-----------------------------------------------+
| GOAL NAME                                      |
| [Goal Name input (flex-1)] [Delete] [Progress] |
|                                     [  Ring  ] |
| DESIRED OUTCOME (full width)                   |
| [What success looks like...                   ]|
|                                                |
| GUIDANCE STRENGTH (full width)                 |
| [slider bar                                   ]|
| [hint box - full width                        ]|
|                                                |
| STEPS                                          |
| [split connector]                              |
| [Fail Path]  [Succeed Path]                    |
| [merge connector]                              |
+-----------------------------------------------+
```

## 2. Goal Name input stays current width

The Goal Name input will remain `flex-1` which gives it roughly the same width it has now (full width minus the progress ring area). No width change on the input itself.

## 3. Desired Outcome extends full width

Move Desired Outcome OUTSIDE the grid/flex row, so it sits below and spans the full card width.

## 4. Guidance Strength bar stays current size

The slider itself won't change width. It will naturally take the full width since it's no longer inside the constrained left column.

## 5. Hint box under slider -- full width

Same fix -- since it's outside the grid now, it automatically gets full width.

## 6. Fail/Success paths equal size -- decrease padding

Currently: card has `padding: 30px` and branch lanes have `gap-6` (24px) between them plus `padding: 14px` inside each lane. This leaves limited space.

**Fix**: Reduce card padding from `30px` to `20px` for the steps area, and reduce the gap between lanes from `gap-6` (24px) to `gap-4` (16px). Both lanes use `flex-1` so they will be equal width.

## 7. Fix connector path lines

Currently the SVG viewBox is `0 0 400 66` with paths going from x=60 to x=340. The lines look cramped because the endpoints don't align with the actual lane centers (which are at ~25% and ~75% of the container).

**Fix**: Adjust the SVG path coordinates so the split starts from center (x=200) and fans out to x=100 and x=300 (25% and 75% of viewBox), with smoother curves. Same adjustment for merge connector.

## Files to modify

| File | Changes |
|------|---------|
| `src/components/chronicle/StoryGoalsSection.tsx` | Replace grid with flex row for Goal Name + ring only. Move Desired Outcome, Guidance Strength below as full-width elements. Reduce padding in steps area. |
| `src/components/chronicle/arc/ArcPhaseCard.tsx` | Same layout restructuring as StoryGoalsSection. |
| `src/components/chronicle/arc/ArcConnectors.tsx` | Adjust SVG path coordinates so split/merge lines align with lane centers at 25%/75%. |
| `src/components/chronicle/arc/ArcBranchLane.tsx` | Reduce outer padding from 14px to 10px. |

## Technical Details

### StoryGoalsSection.tsx (lines 262-393)

Replace the `grid grid-cols-[1fr_220px]` block with:

```tsx
{/* Row 1: Goal Name + Delete + Progress Ring */}
<div className="flex items-start gap-4">
  <div className="flex-1">
    <label ...>Goal Name</label>
    <AutoResizeTextarea ... />
  </div>
  <button ... (delete) />
  <div ... (progress ring 154px) />
</div>

{/* Full width: Desired Outcome */}
<div>
  <label ...>Desired Outcome</label>
  <AutoResizeTextarea ... />
</div>

{/* Full width: Guidance Strength */}
<GuidanceStrengthSlider ... />
```

### ArcConnectors.tsx

Change path data from:
- Split: `M200,0 L200,22 Q200,33 120,44 L60,56` (too narrow)
- To: `M200,0 L200,20 C200,35 150,45 100,56` (wider, smoother curves to 25%/75%)

### ArcBranchLane.tsx

Change outer padding from `14px` to `10px`.

### Steps container

Change `flex gap-6` to `flex gap-4` for the branch lanes container.

