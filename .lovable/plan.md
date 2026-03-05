
I found the exact issue and will fix it in two places so Story Arc validation behaves like the other fields.

## What’s wrong now
1. **Random red text placement**  
   In `WorldTab.tsx`, the story arc error is rendered as a standalone paragraph **between sections**:
   - `publishErrors.storyArc && <p ...>{publishErrors.storyArc}</p>`
   That’s why it appears “floating” in the middle of the page.

2. **Story Arc inputs not highlighted**  
   In `StoryGoalsSection.tsx`, `hasError` currently only adds a red border to the outer section.  
   The actual inputs:
   - **Story Arc Title**
   - **Desired Outcome**
   still use the default border classes and never get per-field error styles/messages.

## Implementation plan

### 1) `src/components/chronicle/WorldTab.tsx`
- Remove the standalone/floating story-arc error paragraph above `<StoryGoalsSection />`.
- Keep passing `hasError={!!publishErrors.storyArc}` to the section.
- Add `data-publish-error` targeting for Story Arcs container (or pass through to section root) so auto-scroll still lands correctly on Story Arc errors after publish validation.

### 2) `src/components/chronicle/StoryGoalsSection.tsx`
For each arc card, add field-level validation styling when publish errors are active:
- Compute per-card booleans:
  - `titleMissing = hasError && !goal.title.trim()`
  - `desiredOutcomeMissing = hasError && !goal.desiredOutcome.trim()`

Apply to **Story Arc Title** input:
- Border style when invalid: `border-red-500 ring-2 ring-red-500`
- Normal when valid: `border-zinc-700`
- Add inline error text below input:
  - class: `text-sm text-red-500 font-medium mt-1`
  - message: `Story arc title is required`

Apply to **Desired Outcome** input:
- Same conditional border/ring logic
- Same error text style (`text-sm text-red-500 font-medium mt-1`)
- message: `Desired outcome is required`

Also mark Story Arcs section root with `data-publish-error={hasError || undefined}` so first-error auto-scroll remains reliable without the removed floating line.

## Technical details (consistency rules)
- No error text below `text-sm` (>= 14px).
- Use the exact same invalid input treatment as Story Name:
  - `border-red-500 ring-2 ring-red-500`
- Use the same red text tone everywhere:
  - `text-red-500` for inline validation text.

## Expected result
- No more random error text floating between sections.
- Story Arc Title and Desired Outcome fields are explicitly highlighted in red when invalid.
- Validation styling is visually consistent with Story Name and other publish-required fields.
- Publish auto-scroll still jumps to Story Arcs when that requirement fails.
