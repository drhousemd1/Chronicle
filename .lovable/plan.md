
# Fix: Remove Double-Nesting of Story Goals Container

## Problem

The `StoryGoalsSection` component already renders its own complete container with a steel-blue header, rounded corners, and internal padding (lines 82-88 of `StoryGoalsSection.tsx`). However, in `ScenarioCardView.tsx` (lines 305-328), it is additionally wrapped inside a `CollapsibleSection` component which renders a SECOND container with another "Story Goals" header. This creates the nested double-header appearance shown in Image 1.

The `WorldTab.tsx` does not have this problem because it renders `StoryGoalsSection` directly at line 666 without any wrapping container.

## Fix

**File: `src/components/chronicle/ScenarioCardView.tsx`** (lines 304-328)

Replace the `CollapsibleSection` wrapper around `StoryGoalsSection` with a direct render of the component -- matching the pattern used in `WorldTab.tsx`.

Before:
```
<CollapsibleSection
  title="Story Goals"
  isExpanded={...}
  onToggle={...}
  collapsedContent={...}
>
  <StoryGoalsSection goals={storyGoals} onChange={...} />
</CollapsibleSection>
```

After:
```
<StoryGoalsSection goals={storyGoals} onChange={...} />
```

This is a single-line change that removes the redundant outer wrapper while keeping the `StoryGoalsSection`'s own styled container intact -- matching Image 2 exactly.

## Technical Note

No other files need changes. The `StoryGoalsSection` component is self-contained with its own dark-theme container (`bg-[#2a2a2f]`, rounded-[24px], steel-blue header with Target icon). The collapsible behavior for Story Goals within the Scenario Card modal is not needed since the section is always visible when toggled to the Scenario Card view.
