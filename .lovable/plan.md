
# Add Nicknames Field to Characters

## Overview

This plan adds a "Nicknames" field to all character types (main characters, side characters, and session states). The field stores comma-separated aliases that help the system correctly identify when different names refer to the same character.

## Problem Being Solved

Currently, the alias detection in `isPotentialAlias()` only catches substring matches (e.g., "Mor" for "Morrigan"). It cannot detect:
- Relational nicknames: "Mom" for Sarah, "Sis" for Jessica
- Pet names: "Babe", "Honey", "Love" for a romantic partner
- Shortened forms that aren't substrings: "Rhy" might work, but "Prick" (a nickname Feyre uses for Rhys) wouldn't

---

## Technical Changes

### 1. Type Definitions

**File: `src/types.ts`**

Add `nicknames` field to Character, SideCharacter, and CharacterSessionState types:

```typescript
export type Character = {
  // ... existing fields ...
  name: string;
  nicknames: string;  // NEW - comma-separated aliases (e.g., "Mom, Mother, Ma")
  // ...
};

export type SideCharacter = {
  // ... existing fields ...
  name: string;
  nicknames: string;  // NEW
  // ...
};

export type CharacterSessionState = {
  // ... existing fields ...
  nicknames?: string;  // NEW - session-scoped nickname overrides
  // ...
};
```

### 2. Database Schema

**Migration: Add `nicknames` column**

```sql
-- Add nicknames column to characters table
ALTER TABLE characters ADD COLUMN nicknames text DEFAULT '';

-- Add nicknames column to side_characters table
ALTER TABLE side_characters ADD COLUMN nicknames text DEFAULT '';

-- Add nicknames column to character_session_states table
ALTER TABLE character_session_states ADD COLUMN nicknames text DEFAULT '';
```

### 3. Data Service Updates

**File: `src/services/supabase-data.ts`**

Update converters to include nicknames:

```typescript
function dbToCharacter(row: any): Character {
  return {
    // ... existing fields ...
    nicknames: row.nicknames || '',
    // ...
  };
}

function characterToDb(char: Character, userId: string, scenarioId?: string) {
  return {
    // ... existing fields ...
    nicknames: char.nicknames || '',
    // ...
  };
}
```

Similar updates for side character and session state converters.

### 4. UI Components

**File: `src/components/chronicle/CharactersTab.tsx`**

Add Nicknames input below the Name field in the character editor:

```typescript
<Input 
  label="Name" 
  value={selected.name} 
  onChange={(v) => onUpdate(selected.id, { name: v })} 
  placeholder="Character name" 
/>
<Input 
  label="Nicknames" 
  value={selected.nicknames || ''} 
  onChange={(v) => onUpdate(selected.id, { nicknames: v })} 
  placeholder="e.g., Mom, Mother (comma-separated)" 
/>
```

**File: `src/components/chronicle/CharacterEditModal.tsx`**

Add Nicknames field to the session edit modal (for both main and side characters).

**File: `src/components/chronicle/CharacterEditForm.tsx`**

Add nicknames to the inline edit form if used.

### 5. Alias Detection Enhancement

**File: `src/services/side-character-generator.ts`**

Update `isPotentialAlias()` and related functions to check nicknames:

```typescript
export function isPotentialAlias(
  newName: string, 
  existingName: string,
  existingNicknames?: string
): boolean {
  const newLower = newName.toLowerCase().trim();
  const existingLower = existingName.toLowerCase().trim();
  
  // Existing substring checks...
  if (newLower === existingLower) return true;
  if (existingLower.includes(newLower) || newLower.includes(existingLower)) return true;
  
  // NEW: Check against nicknames
  if (existingNicknames) {
    const nicknameList = existingNicknames.split(',').map(n => n.trim().toLowerCase());
    if (nicknameList.includes(newLower)) {
      return true;
    }
  }
  
  // Existing prefix check...
  return false;
}
```

Update `getKnownCharacterNames()` to include nicknames in the registry:

```typescript
export function getKnownCharacterNames(appData: ScenarioData): Set<string> {
  const names = new Set<string>();
  appData.characters.forEach(c => {
    names.add(c.name.toLowerCase());
    // Add nicknames to known names set
    if (c.nicknames) {
      c.nicknames.split(',').forEach(n => names.add(n.trim().toLowerCase()));
    }
  });
  appData.sideCharacters?.forEach(c => {
    names.add(c.name.toLowerCase());
    if (c.nicknames) {
      c.nicknames.split(',').forEach(n => names.add(n.trim().toLowerCase()));
    }
  });
  return names;
}
```

### 6. AI Context Integration

**File: `src/services/llm.ts`**

Include nicknames in the character context sent to the AI:

```typescript
const characterContext = appData.characters.map(c => {
  const traits = c.sections.map(s => `${s.title}: ...`).join('\n');
  const nicknameInfo = c.nicknames ? `\nNICKNAMES: ${c.nicknames}` : '';
  return `CHARACTER: ${c.name} (${c.sexType})${nicknameInfo}
ROLE: ${c.characterRole}
...`;
}).join('\n\n');
```

### 7. Character Update Extraction

**File: `supabase/functions/extract-character-updates/index.ts`**

Add `nicknames` to trackable fields so the AI can discover and record new nicknames during play:

```typescript
const systemPrompt = `...
TRACKABLE FIELDS:
- nicknames (comma-separated alternative names, aliases, pet names)
- physicalAppearance.hairColor, ...
...`;
```

---

## UI Layout (Scenario Builder)

The Nicknames field appears directly below Name in the left column:

```text
+---------------------------+
|         [Avatar]          |
|   [Upload] [Reposition]   |
|       [AI Generate]       |
+---------------------------+
| NAME                      |
| [Rhys                   ] |
+---------------------------+
| NICKNAMES                 |
| [Rhysand, Prick         ] |
+---------------------------+
| AGE                       |
| [535                    ] |
+---------------------------+
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/types.ts` | Add `nicknames` field to Character, SideCharacter, CharacterSessionState |
| `src/utils.ts` | Add default empty string for nicknames in createDefaultCharacter |
| `src/services/supabase-data.ts` | Update converters to include nicknames field |
| `src/services/side-character-generator.ts` | Enhance alias detection with nickname checking |
| `src/services/llm.ts` | Include nicknames in AI character context |
| `src/components/chronicle/CharactersTab.tsx` | Add Nicknames input field |
| `src/components/chronicle/CharacterEditModal.tsx` | Add Nicknames field to modal |
| `src/components/chronicle/CharacterEditForm.tsx` | Add Nicknames to inline form |
| `supabase/functions/extract-character-updates/index.ts` | Add nicknames to trackable fields |
| `supabase/functions/generate-side-character/index.ts` | Include nicknames in generated profile |
| **Database Migration** | Add `nicknames` column to 3 tables |

---

## Expected Behavior

1. **Scenario Builder**: Users can add comma-separated nicknames below the character name
2. **Chat Interface**: When the AI or user refers to a character by nickname, the system correctly maps it to the existing character instead of creating a new one
3. **Automatic Updates**: The AI can discover new nicknames during play (e.g., if a character says "call me Rhy") and add them to the character's profile
4. **Session Persistence**: Nicknames added during a playthrough persist for that session

---

## Edge Cases Handled

| Scenario | Current Behavior | With Nicknames |
|----------|------------------|----------------|
| Sarah called "Mom" | Creates new "Mom" character card | Matches to Sarah |
| Morrigan called "Mor" | Works (substring match) | Still works + explicit support |
| Partner called "Babe" | Creates new "Babe" character | Matches if "Babe" is in nicknames |
| New pet name emerges | No tracking | AI can add to nicknames field |
