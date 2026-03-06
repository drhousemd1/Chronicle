

## Plan: Add 5-Minute Time Interval Option

### Changes

Two files need a single line added to their time interval dropdowns:

**1. `src/components/chronicle/ChatInterfaceTab.tsx`** (~line 4103)
Add `<option value={5}>5 minutes</option>` before the 10 minutes option.

**2. `src/components/chronicle/WorldTab.tsx`** (~line 1041)
Add `<option value={5}>5 minutes</option>` before the 10 minutes option.

**3. `src/types.ts`** — Update comments from `// minutes: 10, 15, 30, or 60` to `// minutes: 5, 10, 15, 30, or 60` (lines 25, 37).

No other changes needed — the timer logic already works with any numeric interval value, and the default of 15 minutes remains unchanged for scenarios without a selection.

