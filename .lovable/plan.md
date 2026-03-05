

## Fix: "Create New" Character Should Navigate to Character Builder

**Problem:** Clicking "+ New Character" in the CharacterCreationModal (World tab) creates the character and adds it to the roster, but never switches to the Character Builder tab. The user stays on the World tab seeing just the card instead of the full editor.

**Root Cause:** In `Index.tsx` line 2083, `onCreateCharacter` calls `handleCreateCharacter()` which sets `selectedCharacterId` but does not call `setTab("characters")`. Compare with `onSelectCharacter` on line 2085 which correctly does `setTab("characters")`.

**Fix:** In `src/pages/Index.tsx`, update the `onCreateCharacter` callback (line 2083) to also navigate to the characters tab after creating:

```tsx
onCreateCharacter={() => { handleCreateCharacter(); setTab("characters"); }}
```

One line change, one file.

