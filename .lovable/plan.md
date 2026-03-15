

## Plan: Remove slate blue border from Character Builder navigation sidebar

**File**: `src/components/chronicle/CharactersTab.tsx`, line 1166

**Change**: Remove `border-r border-[#4a5f7f]/80` from the `<aside>` element's className. The sidebar already has a heavy box-shadow that provides visual separation from the content area, so the border is redundant.

