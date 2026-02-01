
# Fix Character Name Sync with Hidden Previous Names

## The Approach

Store old names in a **hidden backend field** (`previousNames`) that is:
- Used internally for character resolution and AI context
- **Never** displayed in the UI
- Separate from the user-editable `nicknames` field

This gives us the technical benefits of name tracking without polluting the user interface.

---

## Database Change

Add a new column `previous_names` to `character_session_states`:

```sql
ALTER TABLE character_session_states 
ADD COLUMN previous_names text[] DEFAULT '{}';
```

This is a text array that stores all previous names for a character within this session. For example: `['Jake', 'Jacob']`

---

## TypeScript Type Updates

### src/types.ts

Add `previousNames` to the `CharacterSessionState` type:

```typescript
export type CharacterSessionState = {
  // ... existing fields
  previousNames?: string[];  // Hidden field - stores old names for lookup, never shown in UI
  // ...
};
```

---

## Service Layer Updates

### src/services/supabase-data.ts

**1. Update the fetch function** to read `previous_names`:

```typescript
// In the session state converter
previousNames: data.previous_names || [],
```

**2. Update the `updateSessionState` function** to accept and save `previousNames`:

```typescript
patch: Partial<{
  // ... existing fields
  previousNames: string[];  // Add this
}>

// In the function body:
if (patch.previousNames !== undefined) {
  updateData.previous_names = patch.previousNames;
}
```

---

## ChangeNameModal.tsx - Simple Name Change Only

Keep the modal simple - it just returns the new name:

```typescript
// No changes needed from current implementation
onSave: (newName: string) => void;
```

The modal does NOT touch nicknames or previousNames - that's handled by the calling code.

---

## CharacterEditModal.tsx - Track Previous Names

When saving a name change, add the old name to `previousNames`:

```typescript
onSave={(newName) => {
  const oldName = draft.name || character?.name || '';
  
  // Add old name to hidden previousNames array (if different)
  let updatedPreviousNames = [...(draft.previousNames || [])];
  if (oldName && oldName !== newName && !updatedPreviousNames.includes(oldName)) {
    updatedPreviousNames.push(oldName);
  }
  
  setDraft(prev => ({
    ...prev,
    name: newName,
    previousNames: updatedPreviousNames,
  }));
  toast.success(`Name changed to ${newName}`);
}}
```

---

## ChatInterfaceTab.tsx Updates

### 1. Merge previousNames in getEffectiveCharacter

```typescript
return {
  ...baseChar,
  name: sessionState.name || baseChar.name,
  previousNames: sessionState.previousNames || [],  // ADD THIS
  // ... rest of fields
};
```

### 2. Save previousNames to session state

In `handleSaveMainCharacterEdit`:

```typescript
await supabaseData.updateSessionState(sessionState.id, {
  name: draft.name,
  previousNames: draft.previousNames,  // ADD THIS
  // ... rest of fields
});
```

### 3. Include previousNames in extraction context

When building character data for the edge function:

```typescript
const charactersData = appData.characters.map(c => {
  const effective = getEffectiveCharacter(c);
  return {
    name: effective.name,
    previousNames: effective.previousNames,  // ADD THIS
    nicknames: effective.nicknames,
    // ... rest of fields
  };
});
```

### 4. Search previousNames in applyExtractedUpdates

Update the character lookup to also search `previousNames`:

```typescript
// Build effective character lookup
const effectiveMainChars = appData.characters.map(c => ({
  base: c,
  effective: getEffectiveCharacter(c)
}));

// Search by current name, nicknames, AND previousNames
let matchedMain = effectiveMainChars.find(({ effective }) => 
  effective.name.toLowerCase() === charNameLower
);

if (!matchedMain) {
  // Check nicknames
  matchedMain = effectiveMainChars.find(({ effective }) => {
    if (!effective.nicknames) return false;
    return effective.nicknames.split(',').some(n => 
      n.trim().toLowerCase() === charNameLower
    );
  });
}

if (!matchedMain) {
  // Check previousNames (hidden field)
  matchedMain = effectiveMainChars.find(({ effective }) => {
    if (!effective.previousNames?.length) return false;
    return effective.previousNames.some(n => 
      n.toLowerCase() === charNameLower
    );
  });
}

const mainChar = matchedMain?.base;
```

---

## Edge Function Update

### supabase/functions/extract-character-updates/index.ts

**1. Update the interface:**

```typescript
interface CharacterData {
  name: string;
  previousNames?: string[];  // ADD THIS
  nicknames?: string;
  // ... rest of fields
}
```

**2. Include previous names in AI context:**

```typescript
const characterContext = (characters || []).map((c: CharacterData) => {
  const fields: string[] = [];
  fields.push(`Name: ${c.name}`);
  
  // Include previous names so AI can map old names to current character
  if (c.previousNames?.length) {
    fields.push(`Previously known as: ${c.previousNames.join(', ')}`);
  }
  if (c.nicknames) {
    fields.push(`Nicknames: ${c.nicknames}`);
  }
  // ... rest of fields
}).join('\n');
```

---

## Data Flow Summary

```
User changes "Jake" to "Sarah" in ChangeNameModal
       ↓
CharacterEditModal adds "Jake" to previousNames array
       ↓
handleSaveMainCharacterEdit saves: name="Sarah", previousNames=["Jake"]
       ↓
getEffectiveCharacter returns: name="Sarah", previousNames=["Jake"]
       ↓
Extraction context sent to edge function includes previousNames
       ↓
AI sees: "Name: Sarah | Previously known as: Jake"
       ↓
AI returns update for "Sarah" (or "Jake" if referenced in old dialogue)
       ↓
applyExtractedUpdates searches: name → nicknames → previousNames
       ↓
Finds character via previousNames → triggers correct card update
       ↓
Avatar resolves correctly (same character ID)
```

---

## What the User Sees

- **Nothing about previous names** - completely hidden from UI
- The `nicknames` field remains user-controlled and unchanged
- Name changes work seamlessly
- Avatar always shows correctly
- "Updating..." effect triggers on the right card

---

## Files to Modify

| File | Change |
|------|--------|
| Database migration | Add `previous_names text[]` column |
| `src/types.ts` | Add `previousNames?: string[]` to CharacterSessionState |
| `src/services/supabase-data.ts` | Read/write previousNames in session state |
| `src/components/chronicle/CharacterEditModal.tsx` | Track old name when changing name |
| `src/components/chronicle/ChatInterfaceTab.tsx` | Merge, save, send, and search previousNames |
| `supabase/functions/extract-character-updates/index.ts` | Include previousNames in AI context |
