

# Fix Remaining Story Arc Styling Issues

## 5 Issues to Fix

### 1. Label sizes: `text-xs` (12px) -> `text-[10px]` to match CharacterGoalsSection

The reference container (CharacterGoalsSection) uses `text-[10px]` for all labels: "Goal Name" (line 243), "Desired Outcome" (line 254), "Steps" (line 284). Story Arcs currently uses `text-xs` everywhere. Change all label classes to `text-[10px]`.

**Files affected:**
- `StoryGoalsSection.tsx` lines 242, 281, 316
- `ArcPhaseCard.tsx` lines 168, 183, 205, 236
- `ArcBranchLane.tsx` lines 78, 85, 112, 142, 163
- `GuidanceStrengthSlider.tsx` line 35
- `ArcModeToggle.tsx` lines 19, 31

### 2. Guidance Strength hint box: wrong background color

Current (line 88 of GuidanceStrengthSlider): `bg-[rgba(37,40,50,0.92)]` -- this has a blue tint.
Standard HintBox (WorldTab line 48): `bg-zinc-900 rounded-xl p-4 border border-white/5`

Change the description container to: `bg-zinc-900 rounded-xl border border-white/5 p-4`

### 3. Replace Add Step button with simple text link

Current (ArcBranchLane lines 191-199): Full styled button with height, background color, rounded corners, uppercase text.

Replace with the exact pattern from CharacterGoalsSection (line 335):
```
<button className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm mt-3 transition-colors">
  <Plus className="h-4 w-4" />
  <span>Add Step</span>
</button>
```

No background, no border, no uppercase -- just blue text with a plus icon.

### 4. Replace Add Next Phase button with simple text link

Same treatment as Add Step. Replace the current styled button (StoryGoalsSection line 353-361) with:
```
<button className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm mt-3 transition-colors">
  <Plus className="h-4 w-4" />
  <span>Add Next Phase</span>
</button>
```

Matching the "+ Add Location" reference image: simple blue text, no button chrome.

### 5. Input field styling consistency

Ensure ALL textareas in ArcBranchLane include `placeholder:text-zinc-600` to match CharacterGoalsSection inputs. Currently the trigger textarea (line 93) and step textarea (line 174) are missing this class.

## Files to Modify

| File | What Changes |
|------|-------------|
| `StoryGoalsSection.tsx` | Labels to `text-[10px]`, Add Next Phase to text link |
| `ArcPhaseCard.tsx` | Labels to `text-[10px]` |
| `ArcBranchLane.tsx` | Labels to `text-[10px]`, Add Step to text link, add `placeholder:text-zinc-600` |
| `GuidanceStrengthSlider.tsx` | Label to `text-[10px]`, hint box to `bg-zinc-900 border-white/5` |
| `ArcModeToggle.tsx` | Button text to `text-[10px]` |
