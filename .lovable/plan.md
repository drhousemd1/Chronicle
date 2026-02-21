

# Fix Story Arc Step Layout, Connector, and Styling Issues

## Changes

### 1. Remove step count text below progress ring
Both `StoryGoalsSection.tsx` (lines 275-279) and `ArcPhaseCard.tsx` (lines 199-203) show "0/1 Steps" or "No Steps" below the progress ring. Remove this `<p>` element entirely -- just keep the ring.

### 2. "Add Next Phase" button -- slate blue style
Currently `border border-blue-400/40 bg-blue-900/30`. Change to match the slate blue style from image 2: `bg-[#1e293b] border border-slate-500/40 text-white`.

### 3. Restructure step card layout in ArcBranchLane.tsx
Current layout crams everything on one header row. Change to:

```
Row 1: [PROGRESSION STEP 1]          [trash icon]
Row 2: Failed [X]  Succeeded [check]
Row 3: [text input field]
Row 4: (only if completed) Completed on Day X at Time Y
```

- Move step label and trash to their own row with `justify-between`
- Move Failed/Succeeded buttons to a second row (no gap-1.5 cramming)
- Completion meta (lines 180-184): only render when `step.completedAt` exists, not always. Remove the hardcoded "Completed on (Day #)" fallback.

### 4. Add Step button text consistency
Currently uses `text-sm font-bold`. The reference "Add Step" in CharacterGoalsSection uses `text-sm` with no bold. Change to match: `text-sm font-medium`.

### 5. Extend top connector line with fade-out
The chain connector SVG at the top of the Steps section (`ArcConnectors.tsx` split type) has a vertical stem that starts at y=0 and stops abruptly. Extend the stem upward using a `linearGradient` that fades from transparent at the top to the line color at the bottom, making it look like it emerges smoothly. Change the split connector to start the vertical stem at y=-16 (extend the viewBox) and apply a gradient fade.

### 6. Match subheading sizes to CharacterGoalsSection
CharacterGoalsSection uses `text-[10px]` for labels like "Goal Name", "Desired Outcome", "Steps". Story Arcs currently uses `text-xs` (12px) which looks noticeably larger. Change all label classes in Story Arcs to `text-[10px]` to match.

Affected labels across files:
- **StoryGoalsSection.tsx**: "Goal Name" (line 242), "Desired Outcome" (line 286), "Steps" h4 (line 321)
- **ArcPhaseCard.tsx**: "Goal Name" (line 183), "Desired Outcome" (line 210), "Steps" h4 (line 241), "Phase N" (line 168)
- **ArcBranchLane.tsx**: "FAIL PATH"/"SUCCEED PATH" (line 78), trigger labels (line 85), step labels (line 112), "FAILED"/"SUCCEEDED" labels (lines 132, 153)
- **GuidanceStrengthSlider.tsx**: "GUIDANCE STRENGTH" label, slider labels

## Files to Modify

| File | Changes |
|------|---------|
| `StoryGoalsSection.tsx` | Remove step count text, slate blue Add Next Phase button, label sizes to `text-[10px]` |
| `ArcPhaseCard.tsx` | Remove step count text, label sizes to `text-[10px]` |
| `ArcBranchLane.tsx` | Restructure step card rows, completion meta conditional, Add Step button style, label sizes to `text-[10px]` |
| `ArcConnectors.tsx` | Extend top stem with gradient fade-out |
| `GuidanceStrengthSlider.tsx` | Label sizes to `text-[10px]` |

## Technical Details

### Step card restructure (ArcBranchLane.tsx)

```tsx
{/* Row 1: Step label + delete */}
<div className="flex items-center justify-between mb-1.5">
  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
    {stepLabel} {idx + 1}
  </span>
  <button onClick={() => onDeleteStep(step.id)} ...>
    <Trash2 size={13} />
  </button>
</div>

{/* Row 2: Status buttons */}
<div className="flex items-center gap-3 mb-2">
  {/* Failed button (conditional) */}
  {/* Succeeded button */}
</div>

{/* Row 3: Description input */}
<AutoResizeTextarea ... />

{/* Row 4: Completion meta - ONLY when completed */}
{step.completedAt && (
  <div className="flex items-center gap-1 mt-2 text-[10px] text-zinc-400">
    <Clock size={11} />
    <span>Completed on Day {step.completedAt}</span>
  </div>
)}
```

### Connector fade (ArcConnectors.tsx)

For the split connector, extend viewBox to `0 -20 100 68` and add a gradient on the top stem:

```tsx
<defs>
  <linearGradient id="fade-down" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stopColor="rgba(232,238,248,0)" />
    <stop offset="100%" stopColor="rgba(232,238,248,0.82)" />
  </linearGradient>
</defs>
{/* Fading stem */}
<line x1="50" y1="-20" x2="50" y2="24" stroke="url(#fade-down)" ... />
```

### Add Next Phase button

```tsx
className="flex items-center gap-2 h-[42px] px-5 rounded-xl border border-slate-500/40 bg-[#1e293b] text-white font-bold text-[10px] uppercase tracking-wider cursor-pointer hover:bg-[#253347] transition-colors"
```

