

# Fix Story Arc Issues - 3 Remaining Problems

## Issue 1: The fading vertical line going UP is not visible

The `ArcConnectors` component renders an SVG with a vertical stem that fades from transparent to opaque going downward. However, the SVG's `viewBox` starts at y=-40 and the container has `height: 88px`, but `preserveAspectRatio="none"` combined with the viewBox coordinates means the upward-extending line gets clipped or compressed.

**Fix**: The problem is that the SVG container height is 88px but the viewBox goes from -40 to 48 (range of 88), so the line from y=-40 to y=24 should render. The issue is likely that `overflow: visible` isn't working as expected, or the container's fixed height clips it. The fix is to ensure the SVG height matches the viewBox range and the container doesn't clip the upward line. Change the approach: make the vertical stem part of the visible area by shifting the viewBox to start at 0 and adjusting all coordinates accordingly.

**File**: `ArcConnectors.tsx`
- For split type: change viewBox to `0 0 100 88` 
- Move all coordinates up: stem from y=0 to y=64, horizontal bar at y=64, drops from y=64 to y=88
- Gradient fades from transparent at y=0 to opaque at y=64
- This ensures the full line is within the visible SVG area

## Issue 2: Dotted connector lines should connect BETWEEN each pair of steps, not one line across the grid

From the reference image, there is a horizontal dotted line connecting each RECOVERY STEP to its corresponding PROGRESSION STEP at the same vertical position. This is NOT a single line spanning the whole grid - it's per-step-row connectors.

**Current implementation**: A single `absolute` div with `border-dashed` spanning `left-[25%] right-[25%]` across the entire grid. This is wrong.

**Fix**: Move the dotted connector logic INTO `ArcBranchLane` or render it per-step-row. The cleanest approach is to render the dotted connectors from `StoryGoalsSection` and `ArcPhaseCard` where both branches are visible. Since both lanes are in a 2-column grid, we need to render a dotted line in the gap between columns, at the vertical center of each step card row.

However, since steps may not be equal counts in each lane, the simplest correct approach is: render the dotted line as part of each step card, extending from the edge of the card toward the center gap. In `ArcBranchLane`:
- For fail path steps: add a dotted line extending from the RIGHT edge of each step card
- For success path steps: add a dotted line extending from the LEFT edge of each step card

This creates the visual connection between corresponding steps.

**Implementation**: In `ArcBranchLane.tsx`, for each step card, add an absolutely positioned dotted line:
- Fail path: `<div className="absolute top-1/2 -right-2 w-4 border-t-2 border-dashed border-zinc-500/40" />` (extends right from the card into the gap)
- Success path: `<div className="absolute top-1/2 -left-2 w-4 border-t-2 border-dashed border-zinc-500/40" />` (extends left from the card into the gap)

Each step card wrapper needs `position: relative` (already has it via the className). The dotted line sits at the vertical midpoint of the step card and extends into the gap between columns.

## Issue 3: Linked phases must be INSIDE the same container, not separate

Currently, `ArcPhaseCard` is rendered OUTSIDE the root phase card's container div (line 374-386 in StoryGoalsSection). Each phase gets its own `rounded-2xl border` container. The user wants all phases to be part of the SAME arc container.

**Fix**: Move the linked phases rendering INSIDE the root phase card's container div, before the closing `</div>` of the root card. The "Add Next Phase" button also moves inside accordingly. When a new phase is added, it appears inside the same rounded container, and the "Add Next Phase" button shifts below the newest phase.

**File**: `StoryGoalsSection.tsx`
- Move lines 374-386 (linked phases map) to INSIDE the root phase card div (before line 372)
- Move the "Add Next Phase" button to also be inside
- Remove the outer `space-y-0` wrapper since everything is now in one container
- Add a merge connector between the steps section and each subsequent phase
- Each phase section gets a separator (border-top) instead of being a separate card

**File**: `ArcPhaseCard.tsx`  
- Remove the outer container's `rounded-2xl border border-blue-500/20` since it's no longer a standalone card
- Remove the chain connector SVG at the top since phases are now inline
- Keep the phase content (goal name, desired outcome, guidance, steps) but render it as a section within the parent container, separated by a border-top

## Files to Modify

| File | Changes |
|------|---------|
| `ArcConnectors.tsx` | Fix viewBox so the upward fading line is visible within the SVG bounds |
| `ArcBranchLane.tsx` | Add per-step dotted connector lines extending toward the opposite lane |
| `StoryGoalsSection.tsx` | Move linked phases + Add Next Phase button inside the root card container |
| `ArcPhaseCard.tsx` | Remove standalone card wrapper and chain connector; render as inline section |

## Technical Details

### ArcConnectors.tsx - Fix fading line

```tsx
// Split type - all coordinates shifted so everything is in positive viewBox space
<div style={{ height: '88px', width: '100%' }}>
  <svg width="100%" height="88" viewBox="0 0 100 88" preserveAspectRatio="none" style={{ display: 'block' }}>
    <defs>
      <linearGradient id="fade-down" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="rgba(232,238,248,0)" />
        <stop offset="100%" stopColor="rgba(232,238,248,0.82)" />
      </linearGradient>
    </defs>
    {/* Fading vertical stem */}
    <line x1="50" y1="0" x2="50" y2="64" stroke="url(#fade-down)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    {/* Horizontal bar */}
    <line x1="25" y1="64" x2="75" y2="64" stroke="rgba(232,238,248,0.82)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    {/* Left drop */}
    <line x1="25" y1="64" x2="25" y2="88" stroke="rgba(232,238,248,0.82)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    {/* Right drop */}
    <line x1="75" y1="64" x2="75" y2="88" stroke="rgba(232,238,248,0.82)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
  </svg>
</div>
```

### ArcBranchLane.tsx - Per-step dotted connectors

Add a prop `type` is already available. For each step card, add a relative wrapper and a dotted line extending into the gap:

```tsx
<div key={step.id} className="relative">
  {/* Dotted connector to opposite lane */}
  {!isPassive && (
    <div className={cn(
      "absolute top-1/2 border-t-2 border-dashed border-zinc-500/40 -translate-y-1/2 pointer-events-none",
      isFail ? "-right-[8px] w-[8px]" : "-left-[8px] w-[8px]"
    )} />
  )}
  <div className={cn("p-2.5 pb-3 rounded-[18px] border", ...)} style={{ background: stepCardBg }}>
    {/* existing step card content */}
  </div>
</div>
```

### StoryGoalsSection.tsx - Phases inside same container

Move the linked phases rendering and the Add Next Phase button inside the root card div:

```tsx
<div className="p-5 pb-6 bg-[#3a3a3f]/30 rounded-2xl border border-blue-500/20 relative">
  {/* ... existing root phase content (goal name, outcome, guidance, steps) ... */}

  {/* Linked Phases - INSIDE the same container */}
  {(goal.linkedPhases || []).map((phase, idx) => (
    <React.Fragment key={phase.id}>
      <ArcConnectors type="merge" />
      <ArcPhaseCard
        phase={phase}
        phaseNumber={idx + 2}
        onUpdate={(patch) => updatePhase(goal.id, phase.id, patch)}
        onDelete={() => deletePhase(goal.id, phase.id)}
        onEnhanceField={onEnhanceField}
        enhancingField={enhancingField}
        hasNextPhase={idx < (goal.linkedPhases || []).length - 1}
      />
    </React.Fragment>
  ))}

  {/* Add Next Phase - INSIDE the same container */}
  <button type="button" onClick={() => addPhase(goal.id)} className="w-full ...">
    Add Next Phase
  </button>
</div>
```

### ArcPhaseCard.tsx - Remove standalone wrapper

Remove the outer `<div className="relative">` with chain connector SVG. Return only the phase content section with a top border separator instead of a full card wrapper:

```tsx
return (
  <div className="mt-4 pt-5 border-t border-white/10">
    {/* Phase label + delete */}
    <div className="flex items-center justify-between mb-5">
      <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
        Phase {phaseNumber}
      </span>
      <button onClick={onDelete} ...>
        <Trash2 size={15} />
      </button>
    </div>
    {/* Rest of phase content: goal name, outcome, guidance, steps */}
  </div>
);
```

No more standalone card, no chain connector SVG, no separate border/rounded container. It's just an inline section within the parent arc container.

