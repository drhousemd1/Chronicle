
# Fix: Remove Rogue Library Saves, Auto-Save on Navigation, and Stuck "Saving" State

## Problems Identified

1. **Characters auto-added to library on every scenario save** (lines 716-735 in `handleSaveWithData`): Every time "Save" is clicked, ALL scenario characters are copied into the character library. This is the primary source of junk library entries.

2. **Auto-save on navigation creates junk "Your Stories" cards** (lines 762-785 `handleNavigateAway`): Clicking any sidebar item (Hub, Gallery, Library) triggers a full save of whatever draft is open, creating empty/junk scenario cards.

3. **"+ Character Library" button shows "Saving..."** when the unrelated Save button is clicked (line 1680): Both share the same `isSaving` state, so clicking Save makes the library button text change to "Saving..." too.

4. **Sidebar save button also triggers library sync** (lines 1318-1349): The sidebar's "Save Scenario" button calls `handleSave(true)` which goes through `handleSaveWithData`, which includes the library sync loop.

## Changes

### File: `src/pages/Index.tsx`

**A. Remove character-to-library sync from `handleSaveWithData` (lines 716-736)**

Delete the entire block that loops through characters and calls `saveCharacterToLibrary`. The ONLY path to add characters to the library should be the explicit "Add to Character Library" / "Update Character" button (`handleSaveToLibrary`).

```text
// DELETE this entire block (lines 716-736):
// Sync characters to library...
if (dataToSave.characters.length > 0) {
  for (const char of dataToSave.characters) { ... }
  const updatedLibrary = await supabaseData.fetchCharacterLibrary();
  setLibrary(updatedLibrary);
}
```

**B. Remove auto-save from `handleNavigateAway` (lines 762-785)**

Replace the auto-save logic with simple navigation. Instead of saving to the database, optionally stash the draft in localStorage so it's not lost if the user accidentally clicks away.

```typescript
const handleNavigateAway = useCallback(async (targetTab: TabKey | "library") => {
  // Stash draft to localStorage as a safety net (no DB save)
  if (activeId && activeData) {
    try {
      localStorage.setItem(`draft_${activeId}`, JSON.stringify(activeData));
    } catch (e) {
      console.warn("Could not stash draft to localStorage:", e);
    }
  }

  // Navigate without saving
  setActiveId(null);
  setActiveData(null);
  setSelectedCharacterId(null);
  setPlayingConversationId(null);
  setTab(targetTab);
}, [activeId, activeData]);
```

**C. Separate `isSaving` for library button (line 1680)**

Add a new state `isSavingToLibrary` and use it exclusively in `handleSaveToLibrary` instead of sharing `isSaving`. This prevents the library button from showing "Saving..." when the scenario Save button is clicked.

- Add state: `const [isSavingToLibrary, setIsSavingToLibrary] = useState(false);`
- In `handleSaveToLibrary`: replace `setIsSaving(true/false)` with `setIsSavingToLibrary(true/false)`
- In the library button (line 1671): change `disabled={isSaving}` to `disabled={isSavingToLibrary}`
- In the library button text (line 1680): change `isSaving` to `isSavingToLibrary`

**D. Also remove the library sync from `handleSaveCharacter` (lines 787-808)**

The `handleSaveCharacter` function at line 802 calls `handleSave()` which previously triggered the library sync. Since we removed the sync from `handleSaveWithData`, this path is already fixed. But verify `handleSaveCharacter` in the library tab path (line 794) only saves when explicitly on the library tab -- this is correct existing behavior.

## Summary of What Changes

| Before | After |
|--------|-------|
| Every Save syncs all characters to library | Only "Add to Character Library" button adds to library |
| Navigating away auto-saves to DB, creating junk cards | Navigation just stashes to localStorage, no DB write |
| Library button shows "Saving..." when Save is clicked | Library button has its own independent saving state |
| Multiple code paths add characters to library | Single code path: `handleSaveToLibrary` |

## Files Modified

1. **`src/pages/Index.tsx`** -- All changes are in this single file
