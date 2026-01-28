

# Proactive Side Character Generation Toggle

## Overview

This plan adds a user-controlled toggle that allows players to choose whether the AI proactively generates side characters from its trained knowledge of established media (books, movies, etc.) or only generates characters when explicitly prompted by the user.

---

## How It Works

When **enabled** (default ON for creative freedom):
- The AI behaves as it currently does - recognizing story contexts and proactively introducing canonical characters at appropriate moments
- Great for stories based on established media like ACOTAR, where the AI can accurately introduce characters like Ianthe, Nala, and Mor at narrative-appropriate times

When **disabled**:
- The AI will only create new named characters when:
  1. The user explicitly mentions them by name, OR
  2. The scene absolutely requires a minor NPC (e.g., a waiter taking an order)
- Characters from source material will NOT be proactively introduced

---

## User Interface

### Toggle Location: Chat Interface Settings Menu

The toggle will be added to the existing settings popover in the chat interface (alongside Show Backgrounds, Transparent Bubbles, Dark Mode, and Offset Bubbles). This is the ideal location because:

1. It's a **session-level preference** - users might want proactive generation for one story but not another
2. It's **contextually relevant** during active play when the behavior would be noticed
3. It follows the existing UI pattern for chat display options

### Toggle Design

```text
┌─────────────────────────────────────────────┐
│ Show Backgrounds                      [✓]   │
│ Transparent Bubbles                   [ ]   │
│ Dark Mode                             [ ]   │
│ Offset Bubbles                        [ ]   │
├─────────────────────────────────────────────┤
│ Proactive Character Discovery         [✓]   │
│ ─────────────────────────────────────────── │
│ When enabled, the AI may introduce          │
│ characters from established media           │
│ (books, movies) at story-appropriate        │
│ moments.                                    │
└─────────────────────────────────────────────┘
```

---

## Technical Implementation

### Step 1: Extend the Type Definitions

**File: `src/types.ts`**

Add `proactiveCharacterDiscovery` to the `uiSettings` type within `ScenarioData`:

```typescript
uiSettings?: {
  showBackgrounds: boolean;
  transparentBubbles: boolean;
  darkMode: boolean;
  offsetBubbles?: boolean;
  proactiveCharacterDiscovery?: boolean;  // NEW - defaults to true
};
```

### Step 2: Update Data Parsing/Defaults

**File: `src/utils.ts`**

Ensure the new setting has a default value when parsing scenario data:

```typescript
const uiSettings = {
  showBackgrounds: ...,
  transparentBubbles: ...,
  darkMode: ...,
  proactiveCharacterDiscovery: typeof raw?.uiSettings?.proactiveCharacterDiscovery === "boolean" 
    ? raw.uiSettings.proactiveCharacterDiscovery 
    : true,  // Default to enabled for creative freedom
};
```

### Step 3: Add Toggle to Chat Interface Settings

**File: `src/components/chronicle/ChatInterfaceTab.tsx`**

Add the toggle to the existing settings popover (around line 2510):

```typescript
<div className="flex items-center justify-between">
  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
    Proactive Character Discovery
  </span>
  <input
    type="checkbox"
    checked={appData.uiSettings?.proactiveCharacterDiscovery !== false}
    onChange={(e) => handleUpdateUiSettings({ proactiveCharacterDiscovery: e.target.checked })}
    className="accent-blue-500"
  />
</div>
<p className="text-[9px] text-slate-400 font-medium leading-relaxed">
  When enabled, the AI may introduce characters from established media (books, movies) at story-appropriate moments.
</p>
```

### Step 4: Modify System Prompt Based on Setting

**File: `src/services/llm.ts`**

Add conditional instructions in the `getSystemInstruction` function:

```typescript
function getSystemInstruction(
  appData: ScenarioData, 
  currentDay?: number, 
  currentTimeOfDay?: TimeOfDay,
  memories?: Memory[],
  memoriesEnabled?: boolean
): string {
  // ... existing code ...

  // NEW: Conditional character introduction rules based on setting
  const proactiveDiscovery = appData.uiSettings?.proactiveCharacterDiscovery !== false;
  
  const characterIntroductionRules = proactiveDiscovery 
    ? `- NEW CHARACTER INTRODUCTION:
        * You may introduce new characters when narratively appropriate.
        * For stories based on established media, you may introduce canonical characters at fitting moments.
        * Always use proper CharacterName: tagging when introducing new characters.`
    : `- NEW CHARACTER INTRODUCTION RULES (STRICT MODE):
        * DO NOT proactively introduce characters from source material or your training data.
        * Only introduce NEW named characters when:
          1. The user has explicitly mentioned or described them, OR
          2. The scene absolutely requires an NPC interaction (e.g., ordering at a restaurant needs a server)
        * For required NPCs, invent a simple first name - do not use known characters from books, movies, or other media unless the user has established them.
        * Wait for the user to introduce major characters they want in the story.`;

  return `
    You are an expert Game Master and roleplayer...
    
    ${characterIntroductionRules}
    
    ... rest of existing instructions ...
  `;
}
```

### Step 5: Update Function Signature

**File: `src/services/llm.ts`**

The `generateRoleplayResponseStream` function already receives `appData` which contains `uiSettings`, so no signature change is needed. The `getSystemInstruction` function already has access to `appData`.

### Step 6: Database Persistence

**File: `src/services/supabase-data.ts`**

The `uiSettings` object is already persisted as JSON in the database, so the new field will automatically be saved and loaded with existing scenarios.

---

## Implementation Flow

```text
┌─────────────────────────────────────────────────────────────────────┐
│                        User toggles setting                          │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  ChatInterfaceTab calls handleUpdateUiSettings()                     │
│  { proactiveCharacterDiscovery: true/false }                         │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Index.tsx updates appData.uiSettings via handleUpdateActive()       │
│  Setting persists to Supabase via saveScenarioData()                 │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Next message: generateRoleplayResponseStream() builds system        │
│  prompt with appropriate character introduction rules                │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
         ┌─────────────────────┐        ┌─────────────────────────────┐
         │  ENABLED (default)  │        │        DISABLED             │
         │                     │        │                             │
         │ AI may introduce    │        │ AI only introduces          │
         │ canonical chars     │        │ characters when user        │
         │ from media          │        │ mentions them or scene      │
         │                     │        │ requires minor NPC          │
         └─────────────────────┘        └─────────────────────────────┘
```

---

## Additional Enhancement: Alias Detection

While not strictly part of the toggle feature, adding alias detection will prevent duplicate character cards (like "Mor" and "Morrigan") regardless of the toggle state:

**File: `src/services/side-character-generator.ts`**

Add a helper function:

```typescript
function isPotentialAlias(newName: string, existingName: string): boolean {
  const newLower = newName.toLowerCase().trim();
  const existingLower = existingName.toLowerCase().trim();
  
  // Exact match
  if (newLower === existingLower) return true;
  
  // One is contained in the other (Mor ↔ Morrigan)
  if (existingLower.includes(newLower) || newLower.includes(existingLower)) {
    return true;
  }
  
  // First 3+ characters match
  const minLength = Math.min(newLower.length, existingLower.length);
  if (minLength >= 3) {
    const prefix = newLower.slice(0, minLength);
    if (existingLower.startsWith(prefix)) return true;
  }
  
  return false;
}
```

Then integrate into `detectNewCharacters()` to skip creating new characters when a potential alias is found.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/types.ts` | Add `proactiveCharacterDiscovery` to `uiSettings` type |
| `src/utils.ts` | Add default value for new setting |
| `src/components/chronicle/ChatInterfaceTab.tsx` | Add toggle UI to settings popover |
| `src/services/llm.ts` | Add conditional character introduction rules to system prompt |
| `src/services/side-character-generator.ts` | Add alias detection to prevent duplicates |

---

## Testing Scenarios

1. **Toggle OFF + ACOTAR scenario**: AI should NOT introduce Ianthe, Nala, Mor unprompted
2. **Toggle ON + ACOTAR scenario**: AI may introduce canonical characters at appropriate moments
3. **Toggle OFF + generic NPC needed**: AI should still invent a name for required NPCs (waiter, guard)
4. **Alias detection**: "Mor:" and "Morrigan:" should not create duplicate cards

---

## Default Behavior

The toggle defaults to **ON** (enabled) to preserve the creative experience your wife enjoyed. Users who prefer stricter control can turn it off.

