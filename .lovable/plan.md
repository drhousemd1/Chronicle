

# Fix: Skip Interim Page When Navigating Back from Character Builder

## Problem

The back button in the Character Builder header navigates through a 3-step chain:

```text
Character Builder (selectedCharacterId set)
  -> Back -> Interim Page (no selectedCharacterId, tab still "characters")
    -> Back -> Scenario Builder (tab "world")
```

The user wants one press of Back to go directly from the Character Builder to the Scenario Builder page, skipping the interim page entirely.

## Solution

**File: `src/pages/Index.tsx` (lines 1401-1414)**

Change the back button's `onClick` handler so that when a character is selected, it both deselects the character AND switches back to the world tab in one action:

```typescript
onClick={() => {
  if (selectedCharacterId) {
    setSelectedCharacterId(null);
    setTab("world"); // Go straight back to Scenario Builder
  } else {
    setTab("world");
  }
}}
```

This makes the navigation:

```text
Character Builder -> Back -> Scenario Builder (world tab)
```

The interim page (Cancel / Import / New Character) is still reachable via the Add/Create button in the character roster -- it just won't appear as a stop when navigating backwards.

## Technical Details

- Single line addition: add `setTab("world");` inside the `if (selectedCharacterId)` branch at line 1406
- No other files need changes
- The interim page itself remains functional when accessed via the "Add Character" flow

