

# Reorder: Sentinel Card Above Add Step Button

## Overview
Swap the order of the "Dynamic Recovery" sentinel card and the "+ Add Step" button so the sentinel always sits directly below the last user-created step, with the add button at the very bottom.

## Change

**File:** `src/components/chronicle/arc/ArcBranchLane.tsx` (lines 238-271)

Move the sentinel card block (lines 250-271) above the "+ Add Step" button block (lines 238-248). The resulting order will be:

1. User-created step cards (existing loop)
2. Sentinel "DYNAMIC RECOVERY" card (fail branch only)
3. "+ Add Step" button (advanced mode only)

This way, new steps added by the user will appear between existing steps and the sentinel, pushing it down naturally -- and the add button always stays at the very bottom as the last interactive element.

## What Does NOT Change
- Sentinel card styling, text, or behavior
- Add Step button styling or behavior
- Simple mode behavior (no add button shown, sentinel still renders)
- Any data model or backend logic

