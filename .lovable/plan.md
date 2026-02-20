

# Fix Creator Name Color and Unify Section Header Sizes

## 1. Creator Name Color

In `ScenarioDetailModal.tsx`, the publisher display name (e.g., "Dr. House") currently uses `text-white`. Change it to the slate blue brand color `text-[#4a5f7f]` so it stands out in the "by" line.

**File**: `src/components/chronicle/ScenarioDetailModal.tsx` (line ~375)

Change:
```tsx
<span className="text-white font-medium">
```
To:
```tsx
<span className="text-[#4a5f7f] font-medium">
```

## 2. Unify Section Header Sizes

All section headers should use the same size. Currently "SYNOPSIS" and "CHARACTERS" use `text-xs` while the content theme headers use `text-[10px]`. Standardize all to `text-xs`.

**File**: `src/components/chronicle/ScenarioDetailModal.tsx`

Headers to update from `text-[10px]` to `text-xs`:
- "GENRE" (line ~414)
- "CHARACTER TYPES" (line ~419)
- "STORY ORIGIN" (line ~424)
- "TRIGGER WARNINGS" (line ~433)
- "CUSTOM TAGS" (line ~441)

No changes needed for "SYNOPSIS" and "CHARACTERS" -- they already use `text-xs`.

