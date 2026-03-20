

# Fix: Location Placeholder Text Consistency

## Problem
In both `WorldTab.tsx` and `StoryCardView.tsx`, location rows use inconsistent placeholder text — the first row says "e.g. The Lakehouse" / "A secluded cabin by the lake..." while subsequent rows say "Location name..." / "Describe this location...". All rows should use the same placeholders.

## Fix
In both files, remove the `idx === 0` ternary and use a single placeholder for all rows:
- **Label input**: `"LOCATION"` (replaces both "e.g. The Lakehouse" and "Location name...")
- **Description textarea**: `"Description of location..."` (replaces both "A secluded cabin by the lake..." and "Describe this location...")

## Files changed (4 lines total)
- **`src/components/chronicle/WorldTab.tsx`** — Line 836: change placeholder to `"LOCATION"`, Line 847: change placeholder to `"Description of location..."`
- **`src/components/chronicle/StoryCardView.tsx`** — Line 153: change placeholder to `"LOCATION"`, Line 163: change placeholder to `"Description of location..."`

