

# Fix Character Creation Persistence When Navigating Back

## Summary

When creating a new character in the Scenario Builder, clicking the back button in the header removes the character instead of preserving it. This is because the back button calls `handleCancelCharacterEdit()` which explicitly deletes the character. We need to change this behavior so that navigating back preserves the character changes (similar to how the auto-save works for sidebar navigation).

---

## Root Cause

**Location:** `src/pages/Index.tsx`, lines 1316-1328

**Current behavior:**
```tsx
<button 
  onClick={() => {
    if (selectedCharacterId) {
      handleCancelCharacterEdit(); // ← This REMOVES the character!
    } else {
      setTab("world");
    }
  }} 
  ...
>
```

When clicking the back button with a character selected, it calls `handleCancelCharacterEdit()` which:
1. Removes the character from `activeData.characters` (line 776-778)
2. Clears `selectedCharacterId`
3. Navigates to "world" tab

This explains why "Jim" disappears - the back button is designed to cancel/discard changes, not save them.

---

## Proposed Solution

Change the back button behavior to **preserve changes** instead of canceling them:

1. If a character is selected, just deselect it (don't delete it)
2. Navigate back to the world tab
3. Optionally trigger an auto-save to persist the changes

---

## Technical Changes

### File to Modify: `src/pages/Index.tsx`

### Option 1: Simple Navigation (Recommended)

Change the back button behavior from canceling to simple navigation:

**Lines 1316-1328 - Update the back button onClick:**

```tsx
<button 
  onClick={() => {
    if (selectedCharacterId) {
      // Just deselect - don't remove the character
      setSelectedCharacterId(null);
    } else {
      setTab("world");
    }
  }} 
  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
>
```

This keeps the character in the list when clicking back, allowing the user to continue editing or navigate elsewhere.

### Option 2: Navigate Back with Auto-Save

If we want to also trigger a save when going back:

```tsx
<button 
  onClick={async () => {
    if (selectedCharacterId) {
      setSelectedCharacterId(null);
      // Stay on characters tab with no selection
    } else {
      // When going from characters tab to world tab, auto-save first
      if (activeId && activeData) {
        try {
          await handleSaveWithData(activeData, false);
        } catch (e) {
          console.error("Auto-save failed:", e);
        }
      }
      setTab("world");
    }
  }} 
  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
>
```

---

## Additional Consideration: Cancel Button Behavior

The "Cancel" button in the character editor footer should keep its current behavior (removing the character) since it's explicitly labeled as "Cancel":

**Location:** Lines 1600-1610 (approximately)

This button should continue to call `handleCancelCharacterEdit()` since users clicking "Cancel" expect their changes to be discarded.

---

## Summary of Changes

| Element | Current Behavior | New Behavior |
|---------|------------------|--------------|
| Back button (← arrow) | Removes character from list | Deselects character, preserves data |
| Cancel button | Removes character from list | No change - keeps removing |
| Sidebar navigation | Now auto-saves | No change needed |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Index.tsx` | Update back button onClick handler (lines 1316-1328) |

---

## Implementation Order

1. Update the back button onClick handler to deselect instead of cancel
2. Test creating a new character, typing a name, clicking back - character should persist
3. Verify the Cancel button still removes characters as expected
4. Test navigating to sidebar items (Hub, Gallery) - auto-save should still work

