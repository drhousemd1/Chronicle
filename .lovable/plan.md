

# Fix: Character Builder Save Button Should Also Save Draft

## Problem
When clicking "Save" on the Character Builder page, `handleSaveCharacter()` only deselects the character and navigates back to the world tab. It does NOT persist the draft to the database. The user must separately click "Save Draft" to persist their work, which causes data loss if forgotten.

## Solution
Extract the draft-save logic (currently inline in the Save Draft button's `onClick`, lines 2117-2185) into a reusable `saveDraftInBackground()` function. Then call it from `handleSaveCharacter()` after the existing character-roster logic completes.

The background save will be silent — no loading spinner on the Save button, no "Saving..." text change. It just persists the draft quietly so data is never lost.

## Changes — Single File: `src/pages/Index.tsx`

### 1. Extract draft save into a reusable function
Pull the logic from the Save Draft button's inline `onClick` (lines 2117-2185) into a standalone async function like `saveDraftQuietly()`. This function will:
- Validate `activeId`, `activeData`, and `user` exist
- Handle UUID migration if needed
- Write local safety snapshot
- Call `saveScenarioWithVerification` with `isDraft: true`
- Refresh the registry
- Silently swallow errors (background save should never block the user)

### 2. Call it from `handleSaveCharacter()`
In the non-library branch of `handleSaveCharacter()` (line 1192-1195), after deselecting the character and navigating to the world tab, fire `saveDraftQuietly()` without awaiting it — fire-and-forget so the UI remains instant.

### 3. Save Draft button reuses the same function
Replace the inline `onClick` on the Save Draft button with a call to the same extracted function, but with the existing `setIsSaving` / notice UI wrappers preserved.

## What This Preserves
- Save button UX remains instant (no spinner, no delay)
- Save Draft button continues to show "Saving..." feedback and error notices
- The integrity-verified save flow and local snapshot safety net are unchanged
- No changes to Finalize and Close behavior

