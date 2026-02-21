

# Fix Label Sizes to Match Reference Containers

## The Problem
Every other container on the Scenario Builder uses `text-[10px] font-black` for labels (e.g., "PRIMARY LOCATIONS", "STORY TYPE", "BASICS"). The Story Arcs section uses `text-xs font-bold` -- that's 12px instead of 10px and bold (700) instead of black (900). Both size AND weight are wrong.

## The Fix
Change every label class from `text-xs font-bold` to `text-[10px] font-black` across all 5 Story Arc files. This is a direct find-and-replace with no logic changes.

## Files and Exact Lines

### StoryGoalsSection.tsx
- Line 242: "Goal Name" label
- Line 281: "Desired Outcome" label
- Line 316: "Steps" h4

### ArcBranchLane.tsx
- Line 78: "FAIL PATH" / "SUCCEED PATH"
- Line 85: Trigger label
- Line 112: Step label (e.g., "PROGRESSION STEP 1")
- Line 142: "FAILED" label
- Line 163: "SUCCEEDED" label

### ArcPhaseCard.tsx
- Line 168: "Phase N" label
- Line 183: "Goal Name" label
- Line 205: "Desired Outcome" label
- Line 236: "Steps" h4

### GuidanceStrengthSlider.tsx
- Line 35: "Guidance Strength" label
- Line 78: RIGID/NORMAL/FLEXIBLE labels

### ArcModeToggle.tsx
- Line 19: "Simple" button text
- Line 31: "Advanced" button text

## What Changes
`text-xs font-bold` becomes `text-[10px] font-black` on every label listed above. Nothing else changes -- no layout, no colors, no logic.
