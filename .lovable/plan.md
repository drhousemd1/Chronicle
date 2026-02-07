

# Fix: Stop Absent Characters From Speaking (Especially on Refresh)

## The Problem

When you hit the Refresh button, James speaks even though he's at work. The AI also sometimes generates dialogue for user-controlled characters. This happens because of three missing pieces that were planned but not yet wired in.

## Root Causes Found

### 1. The AI literally cannot see where characters are
In the code that builds the character information sent to the AI (`llm.ts` lines 58-67), each character block includes their name, sex, role, control type, and traits -- but **never their location or mood**. So the AI sees:

```text
CHARACTER: James (Male)
ROLE: Main
CONTROL: User
TAGS: ...
```

It has zero idea James is "at work." It just sees him listed in the cast and assumes he's available.

### 2. Session updates never reach the AI
During a play session, when the extraction service updates James's location to "at work," that update goes into session state (used by the UI). But all three places that call the AI -- Send, Refresh, and Continue -- pass the **base character data**, not the session-merged version. So even if the UI correctly shows "James: at work," the AI still sees the original base data with no location.

### 3. No rules about scene presence
The system prompt tells the AI "only generate dialogue for CONTROL: AI characters" but says nothing about **location awareness**. There is no rule saying "if a character is in a different location, they are off-screen and should not speak or appear." Without this rule, the AI treats every listed character as fair game.

## The Fix (Two Files)

### File 1: `src/services/llm.ts` -- Add location/mood to character context + scene-presence rules

**A) Add LOCATION and MOOD to each character block (lines 58-67):**

The character context will change from:
```text
CHARACTER: James (Male)
ROLE: Main
CONTROL: User
```

To:
```text
CHARACTER: James (Male)
ROLE: Main
CONTROL: User
LOCATION: At work (downtown office)
MOOD: Focused
```

This gives the AI the data it needs to make scene-presence decisions.

**B) Add SCENE PRESENCE rules to the INSTRUCTIONS section (after the CONTROL CONTEXT rule around line 349):**

A new mandatory rule block that tells the AI:
- Check each character's LOCATION before giving them dialogue
- Characters at a DIFFERENT location are OFF-SCREEN: they do not speak, act, think, or appear
- Present characters may talk ABOUT absent characters, but absent characters get no tagged paragraphs
- An absent character may only enter a scene if the user explicitly brings them in or a significant story event causes their arrival
- "Same building, different room" still counts as ABSENT unless they have a reason to enter

**C) Reinforce CONTROL rules in the regeneration directive (lines 416-428):**

Add an explicit reminder to the regeneration directive:
- Reiterate that CONTROL: User characters must NOT have AI-generated dialogue
- Reiterate that only characters present at the scene location may speak

This is important because the regeneration directive is appended to the user message content, and the AI sometimes "forgets" system-level rules when processing user-level instructions. Adding the control reminder directly in the regeneration block ensures it stays top-of-mind.

### File 2: `src/components/chronicle/ChatInterfaceTab.tsx` -- Pass session-merged characters to the LLM

**A) Create a `buildLLMAppData` helper** that merges session state into `appData` before passing it to the LLM. This uses the existing `getEffectiveCharacter()` function (already defined at line 497) which merges location, mood, clothing, controlledBy, and other session overrides.

**B) Update all three call sites to use session-merged data:**

- `handleSend` (line 1578): Currently passes raw `appData` -- will use `buildLLMAppData()`
- `handleRegenerateMessage` (line 1693): Currently builds `truncatedAppData` from raw `appData` -- will build from `buildLLMAppData()` instead
- `handleContinueConversation` (line 1783): Currently passes raw `appData` -- will use `buildLLMAppData()`

This ensures that when you've played 20 messages and the extraction service has updated James's location to "at work," the AI actually sees that location in the next call.

## Why This Specifically Fixes the Refresh Problem

The Refresh button was the worst offender because:
1. The regeneration directive says "provide a different take" -- without location data, the AI interprets "different" as "include different characters"
2. Without scene-presence rules, the AI has no constraint preventing it from pulling in any cast member
3. Without control reminders in the regeneration block, the AI sometimes generates user-controlled character dialogue

After this fix:
- The AI will see `LOCATION: At work` next to James and `CONTROL: User` 
- The scene-presence rules explicitly forbid dialogue from characters at different locations
- The regeneration directive will explicitly remind the AI about control and presence rules

## Technical Details

### Character Context Enhancement (llm.ts, lines 58-67)

```typescript
const characterContext = appData.characters.map(c => {
  const traits = c.sections.map(s => 
    `${s.title}: ${s.items.map(it => `${it.label}=${it.value}`).join(', ')}`
  ).join('\n');
  const nicknameInfo = c.nicknames ? `\nNICKNAMES: ${c.nicknames}` : '';
  const locationInfo = c.location ? `\nLOCATION: ${c.location}` : '';
  const moodInfo = c.currentMood ? `\nMOOD: ${c.currentMood}` : '';
  return `CHARACTER: ${c.name} (${c.sexType})${nicknameInfo}
ROLE: ${c.characterRole}
CONTROL: ${c.controlledBy}${locationInfo}${moodInfo}
TAGS: ${c.tags}
TRAITS:
${traits}`;
}).join('\n\n');
```

### Scene Presence Rules (llm.ts, INSTRUCTIONS section after line 349)

```text
- SCENE PRESENCE (CRITICAL - NEVER VIOLATE):
    * Check each character's LOCATION field before giving them dialogue or actions.
    * Characters are ONLY present in a scene if they share the same location as the current action.
    * Characters at a DIFFERENT location are OFF-SCREEN:
      - They do NOT speak, act, think, or appear
      - They do NOT walk in, call out, or interrupt uninvited
      - They do NOT "come to check" or "hear something"
      - Present characters MAY talk ABOUT them, but the absent character gets NO tagged paragraphs
    * An absent character may ONLY enter the scene if:
      1. The user explicitly brings them in or calls for them
      2. A significant in-story event would realistically cause them to appear
    * "Same building but different room" = ABSENT unless they have a reason to enter the specific room
    * When in doubt, keep absent characters absent
```

### Regeneration Directive Enhancement (llm.ts, lines 416-428)

Add these lines to the existing regeneration directive:

```text
9. CONTROL RULES STILL APPLY: Do NOT generate dialogue or actions for characters 
   marked as CONTROL: User. Only AI-controlled characters speak.
10. SCENE PRESENCE STILL APPLIES: Only characters at the SAME LOCATION as the 
    current scene may have dialogue. Characters elsewhere are OFF-SCREEN.
```

### Session-Merged AppData Helper (ChatInterfaceTab.tsx)

```typescript
const buildLLMAppData = useCallback((): ScenarioData => {
  return {
    ...appData,
    characters: appData.characters.map(c => getEffectiveCharacter(c))
  };
}, [appData, getEffectiveCharacter]);
```

Then update all three call sites to use `buildLLMAppData()` instead of raw `appData`.

## Files Modified

| File | Changes |
|------|---------|
| `src/services/llm.ts` | Add LOCATION and MOOD to character context block; add SCENE PRESENCE rules to INSTRUCTIONS; add control and presence reminders to regeneration directive |
| `src/components/chronicle/ChatInterfaceTab.tsx` | Create `buildLLMAppData` helper; update `handleSend`, `handleRegenerateMessage`, and `handleContinueConversation` to pass session-merged character data to the LLM |
