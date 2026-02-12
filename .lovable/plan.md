

# Fix: Label/Description Gap in Location & Custom Content Tables

## Problem
The label fields (e.g., location names, custom content labels) are tiny and there's a huge gap before the description fields. This affects:
- **Scenario Builder** (WorldTab.tsx) -- Locations and Custom World Content
- **Scenario Card View** (ScenarioCardView.tsx) -- Locations and Custom World Content
- **Character Builder** (CharactersTab.tsx, CharacterEditModal.tsx) -- Custom categories

## Root Cause
Two related issues:
1. The `AutoResizeTextarea` component in `ScenarioCardView.tsx`, `CharactersTab.tsx`, and `CharacterEditModal.tsx` uses plain string concatenation (`${className}`) instead of `cn()` for merging Tailwind classes. This means `w-2/5` or `w-1/3` can't override the base `w-full`.
2. The `Input` and `TextArea` components in `UI.tsx` wrap their elements in a `<div className="w-full">` container. Even if the width class on the inner element works, the outer div forces full width, creating the gap.

## Solution

### File 1: `ScenarioCardView.tsx`
- Import `cn` from `@/lib/utils`
- Change `AutoResizeTextarea` className from string concat to `cn()` (same fix we did in PersonalitySection.tsx)

### File 2: `CharactersTab.tsx`
- Import `cn` from `@/lib/utils`
- Same `cn()` fix in its `AutoResizeTextarea`

### File 3: `CharacterEditModal.tsx`
- Import `cn` from `@/lib/utils`
- Same `cn()` fix in its `AutoResizeTextarea`

### File 4: `UI.tsx` (Input and TextArea components)
- Import `cn` from `@/lib/utils`
- Change the wrapping `<div className="w-full">` to `<div className={cn("w-full", className)}>`  so width classes pass through to the container
- Use `cn()` for the inner element class merging so `w-1/3` properly overrides `w-full`

This is the same pattern that fixed the PersonalitySection -- using Tailwind Merge via `cn()` to let specific width classes override the base `w-full`.

## Files Changed

| File | Change |
|------|--------|
| `src/components/chronicle/ScenarioCardView.tsx` | Import `cn`, use it in AutoResizeTextarea |
| `src/components/chronicle/CharactersTab.tsx` | Import `cn`, use it in AutoResizeTextarea |
| `src/components/chronicle/CharacterEditModal.tsx` | Import `cn`, use it in AutoResizeTextarea |
| `src/components/chronicle/UI.tsx` | Import `cn`, fix Input and TextArea wrapper div and inner element class merging |

