
# Update Retry Badge to Show Max Attempts

## What Changes

In `src/components/chronicle/arc/ArcBranchLane.tsx`, update the retry badge text (around line 124) from:

**Before:** `Retry #1`  
**After:** `Retry 1 of 4` (normal), `Retry 1 of 2` (flexible), or `Retry 1 of ∞` (rigid)

## Technical Detail

One line change in the badge's inner text:

- The component already has `flexibility` prop (`'rigid' | 'normal' | 'flexible'`)
- The step already has `step.retryCount` (defaults to 1)
- Compute max: `rigid` = `'∞'`, `normal` = `4`, `flexible` = `2`
- Change the badge content from `` Retry #{step.retryCount || 1} `` to `` Retry {step.retryCount || 1} of {max} ``

Everything else (colors, icon, sizing) stays the same.
