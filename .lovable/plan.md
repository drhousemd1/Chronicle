

## Plan: Remove Story Validation from Character Builder Save

### Problem
The character builder "Save" button (line 1974) calls `handleSave(false)` → `handleSaveWithData()`, which validates the story name (lines 854-858) and sets `storyNameError(true)` + switches to the World tab. This is wrong — the character builder save should just persist the character and navigate back to the story builder.

### Fix

**File: `src/pages/Index.tsx`**

Update the `handleSaveCharacter()` function (lines 948-969) so the non-library branch no longer calls `handleSave()`. Instead, it should simply:
1. Deselect the character (`setSelectedCharacterId(null)`)
2. Navigate back to the world tab (`setTab("world")`)

The character data is already in `activeData.characters` (it's edited in-place via state). No DB write is needed — the story gets saved to the DB only when the user clicks "Save and Close" on the story builder page, and the "Save Draft" button handles localStorage persistence.

Also update the **character builder's own Save button** (line 1968-1976) to call `handleSaveCharacter()` instead of `handleSave(false)`, so it follows the same logic — just deselect and navigate back, no validation or DB write.

### Files to Change
- `src/pages/Index.tsx` — update `handleSaveCharacter` and the character builder Save button onClick

