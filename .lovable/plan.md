
# Fix Chat Avatar Resolution for Renamed Characters

## Problem Summary

After renaming a character (e.g., from "Jake" to "Sarah"):
- The sidebar card shows the correct avatar for "Sarah" ✓
- The "Updating..." effect now triggers on the correct card ✓
- BUT: The chat avatar shows a placeholder "S" instead of the actual image ✗

**Root cause:** The chat message rendering calls `findCharacterByName("Sarah", appData)`, which searches the **raw base data** in `appData.characters`. The base data still has the original name - only the session state has "Sarah". So the lookup fails and falls back to showing a placeholder.

---

## Solution

Create a **session-aware character lookup** inside `ChatInterfaceTab.tsx` that:
1. Searches effective (session-merged) character names first
2. Falls back to nicknames
3. Falls back to previousNames
4. Returns the **effective** character with the correct avatar

Then replace all calls to `findCharacterByName(name, appData)` with this new lookup in the chat rendering code.

---

## Implementation Details

### 1. Create session-aware lookup function

Add a new function in ChatInterfaceTab.tsx (near the existing `findAnyCharacterByName`):

```typescript
// Session-aware character lookup - searches effective names, nicknames, and previousNames
const findCharacterWithSession = useCallback((name: string | null): (Character & { previousNames?: string[] }) | SideCharacter | null => {
  if (!name) return null;
  const nameLower = name.toLowerCase().trim();
  
  // Build effective main characters with session overrides
  const effectiveMainChars = appData.characters.map(c => getEffectiveCharacter(c));
  
  // Search effective main characters by current name
  let found = effectiveMainChars.find(c => c.name.toLowerCase() === nameLower);
  if (found) return found;
  
  // Search main characters by nicknames
  found = effectiveMainChars.find(c => {
    if (!c.nicknames) return false;
    return c.nicknames.split(',').some(n => n.trim().toLowerCase() === nameLower);
  });
  if (found) return found;
  
  // Search main characters by previousNames (hidden field)
  found = effectiveMainChars.find(c => {
    if (!c.previousNames?.length) return false;
    return c.previousNames.some(n => n.toLowerCase() === nameLower);
  });
  if (found) return found;
  
  // Search side characters by name
  const sideChars = appData.sideCharacters || [];
  let sideFound = sideChars.find(sc => sc.name.toLowerCase() === nameLower);
  if (sideFound) return sideFound;
  
  // Search side characters by nicknames
  sideFound = sideChars.find(sc => {
    if (!sc.nicknames) return false;
    return sc.nicknames.split(',').some(n => n.trim().toLowerCase() === nameLower);
  });
  if (sideFound) return sideFound;
  
  return null;
}, [appData.characters, appData.sideCharacters, getEffectiveCharacter]);
```

### 2. Update chat avatar rendering to use new lookup

Replace `findCharacterByName(segment.speakerName, appData)` with `findCharacterWithSession(segment.speakerName)` in multiple locations:

**Location 1 - Line 2424** (saved messages with speaker tags):
```typescript
// Before:
segmentChar = findCharacterByName(segment.speakerName, appData);

// After:
segmentChar = findCharacterWithSession(segment.speakerName);
```

**Location 2 - Lines 2534-2536** (streaming content):
```typescript
// Before:
const segmentChar = segment.speakerName 
  ? findCharacterByName(segment.speakerName, appData)
  : appData.characters.find(c => c.controlledBy === 'AI');

// After:
const segmentChar = segment.speakerName 
  ? findCharacterWithSession(segment.speakerName)
  : getEffectiveCharacter(appData.characters.find(c => c.controlledBy === 'AI')!);
```

**Location 3 - Lines 2545-2547** (previous segment lookup):
```typescript
// Before:
const prevChar = prevSegment.speakerName 
  ? findCharacterByName(prevSegment.speakerName, appData)
  : appData.characters.find(c => c.controlledBy === 'AI');

// After:
const prevChar = prevSegment.speakerName 
  ? findCharacterWithSession(prevSegment.speakerName)
  : getEffectiveCharacter(appData.characters.find(c => c.controlledBy === 'AI')!);
```

### 3. Update fallback character lookups

For AI character fallbacks (lines 2435-2436, 2450-2451), ensure we use effective data:

```typescript
// Before:
const aiChars = appData.characters.filter(c => c.controlledBy === 'AI');
segmentChar = aiChars.length > 0 ? aiChars[0] : null;

// After:
const aiChars = appData.characters.filter(c => c.controlledBy === 'AI');
segmentChar = aiChars.length > 0 ? getEffectiveCharacter(aiChars[0]) : null;
```

---

## Data Flow After Fix

```
Chat message contains "Sarah:" speaker tag
       ↓
findCharacterWithSession("Sarah") called
       ↓
Searches effective main characters (session-merged data)
       ↓
Finds character with name="Sarah" (from session state)
       ↓
Returns effective character with correct avatarDataUrl
       ↓
Chat renders actual avatar image, not placeholder
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/chronicle/ChatInterfaceTab.tsx` | Add `findCharacterWithSession` function and update 5-6 call sites to use it |

---

## Why This Works

The key insight is that `getEffectiveCharacter` already correctly merges:
- Session name ("Sarah") ✓
- Session avatar URL ✓
- Previous names array ✓

We just weren't using it for the chat avatar lookups. By creating `findCharacterWithSession` that wraps the effective character data, all the pieces connect.
