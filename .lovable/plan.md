

# Fix Shadow Bleed on Step Cards

## Problem

The shadow `shadow-[0_14px_26px_rgba(0,0,0,0.4)]` uses `blur: 26px` with only `offset-y: 14px`, causing the shadow to extend ~12px above each card. This is most visible on the Dynamic Recovery sentinel but technically affects all step cards.

## Fix

Add a negative spread radius to pull the shadow inward, preventing upward bleed. Change from:

`shadow-[0_14px_26px_rgba(0,0,0,0.4)]`

to:

`shadow-[0_14px_26px_-6px_rgba(0,0,0,0.4)]`

The `-6px` spread shrinks the shadow box so the blur doesn't extend above the card's top edge, while still producing a natural shadow below.

## Changes

**File:** `src/components/chronicle/arc/ArcBranchLane.tsx`

- **Line 113** (regular step cards): Update shadow class
- **Line 241** (sentinel card): Update shadow class

Both get the same fix: `shadow-[0_14px_26px_-6px_rgba(0,0,0,0.4)]`

