

# Fix Creator Section Text Alignment

## Problem
The "Created by:" and "Creator rating:" lines are horizontally centered relative to each other instead of being left-aligned. They should both start at the same left edge, flush with the right side of the avatar.

## Fix

**File**: `src/components/chronicle/ScenarioDetailModal.tsx`, line 429

The text column `<div>` wrapping "Created by" and "Creator rating" has no text/flex alignment, causing the two lines to center. Add `text-left` to force both lines to left-align from the same starting edge.

Change:
```
<div>
```
To:
```
<div className="text-left">
```

This single change ensures both the "Created by:" line and the "Creator rating:" line start at the same left position, directly after the avatar image.
