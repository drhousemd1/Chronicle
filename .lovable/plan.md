

# Collapse Retry Clones in the UI

## Overview
Instead of rendering a new step card for each retry attempt, the UI will hide retry clone cards and instead update the retry badge on the **original** step card to reflect the current retry count. All backend data (clone records, resistance history, retry lineage) stays exactly as-is -- this is a **frontend-only display change**.

## How It Works Today
When a recovery step succeeds, the system clones the failed progression step as a new card inserted below the original. Each clone has `retryOf` pointing to the original, a `retryCount`, and its own status. In rigid mode, this can produce an unbounded number of cards.

## What Changes

### 1. Hide retry clone cards from rendering
**File:** `src/components/chronicle/arc/ArcBranchLane.tsx`

- Filter out steps where `step.retryOf` is set before rendering. These clones still exist in the data, they just won't render as separate cards.

### 2. Show the retry badge on the original step (not only on clones)
**File:** `src/components/chronicle/arc/ArcBranchLane.tsx`

- Currently the retry badge only shows when `step.retryOf` is truthy (i.e., on clones).
- Change it so the **original** step shows the badge when it has active retries. Look for any clone in the branch whose `retryOf` matches this step's `id`, and display the highest `retryCount` from those clones.
- The badge text stays `Retry X of Y` with the same styling.

### 3. Update progress calculation to still work correctly
**Files:** `src/components/chronicle/arc/ArcPhaseCard.tsx`, `src/components/chronicle/StoryGoalsSection.tsx`

- The progress calculation already excludes failed steps that have pending retry clones. This logic remains unchanged since the data model is untouched.

### 4. Keep LLM context serialization as-is
**File:** `src/services/llm.ts`

- The LLM still sees the full retry lineage (all clones, all statuses) for proper temporal awareness. No changes needed here.

## What Does NOT Change
- The clone-on-recovery backend logic (StoryGoalsSection.tsx lines 194-236) -- clones are still created in the data
- The `ArcStep` type definition -- `retryOf`, `retryCount`, `permanentlyFailed` fields all stay
- LLM serialization -- AI still sees every retry attempt
- The `permanentlyFailed` badge -- still shows on the original step when max retries are exhausted
- Progress percentage calculation

## Result
- In rigid mode, even after 50 retries, the user sees one card with a badge reading "Retry 50 of (infinity)"
- All 50 retry records remain in the data for the AI to reference
- UI stays clean and compact regardless of retry count
