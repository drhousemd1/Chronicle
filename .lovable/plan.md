

# Fix: Complete Context Overhaul for AI Fill and Per-Row Sparkle Enhancement

## Problem

Both AI features are generating random, disconnected content because they lack context:

- **Per-row Sparkle**: Only passes scenario name and a deprecated empty field. No world data, no other characters, no self-context.
- **AI Fill**: Passes some world fields but zero info about other characters and only 5 basic fields (name/age/sex/role/tags) of the target character -- ignoring all already-filled traits, background, personality, etc.

## Solution

### File 1: `src/services/character-ai.ts`

**A. Add `buildFullContext()` utility** (new function)

Compiles a comprehensive context string from the entire scenario:

```text
WORLD:
- Scenario name, description, premise
- Locations (including structured locations)
- Factions, tone/themes, plot hooks, history
- Content themes (genres, story type)

OTHER CHARACTERS:
- For each non-target character: name, role, age, sex, key personality traits, relationship info
```

**B. Add `buildCharacterSelfContext()` utility** (new function)

Extracts everything already filled on the target character so new fields stay consistent:

```text
- Basic info (name, age, sex, role, tags, location, mood)
- Filled physical appearance fields
- Filled clothing fields
- Filled background fields
- Personality traits (outward/inward if split mode)
- Tone, relationships, secrets, fears, key life events (extras)
- Goals (titles and outcomes)
```

**C. Update `buildCharacterFieldPrompt()` (per-row sparkle prompt)**

- Change parameter from `worldContext: string` to accept the full context string (which now includes world + other characters + self-context)
- The prompt will now include all scenario and character data

**D. Update `aiEnhanceCharacterField()` signature**

- Change from `(fieldName, currentValue, characterContext, worldContext, modelId, customLabel)` to `(fieldName, currentValue, character, appData, modelId, customLabel)`
- Internally call `buildFullContext()` and `buildCharacterSelfContext()` to build the complete context

**E. Update `aiFillCharacter()` and `buildAiFillPrompt()`**

- Replace the minimal 5-line character context block with `buildCharacterSelfContext()` output
- Replace the world context builder with `buildFullContext()`
- Same for `buildAiGeneratePrompt()`

### File 2: `src/components/chronicle/CharactersTab.tsx`

**F. Remove broken `buildWorldContext()` function** (lines 235-238)

Delete entirely -- it's the 2-line function using a deprecated field.

**G. Update `handleEnhanceField()`** (lines 241-272)

- Remove the `buildWorldContext()` call
- Pass `selected` (full character) and `appData` directly to the updated `aiEnhanceCharacterField()`

```typescript
// Before:
const worldContext = buildWorldContext();
const enhanced = await aiEnhanceCharacterField(
  fieldKey, currentValue, selected, worldContext, modelId, customLabel
);

// After:
const enhanced = await aiEnhanceCharacterField(
  fieldKey, currentValue, selected, appData, modelId, customLabel
);
```

## What This Fixes

| Feature | Before | After |
|---------|--------|-------|
| Per-row sparkle world context | Scenario name + empty deprecated field | Full premise, locations, factions, themes, plot hooks |
| Per-row sparkle character context | Name, age, sex, role, tags only | All filled fields (appearance, personality, background, etc.) |
| Per-row sparkle other characters | None | Summaries of all other characters in scenario |
| AI Fill world context | 7 world fields | Same 7 fields + structured locations + content themes |
| AI Fill character self-context | Name, age, sex, role, tags | All filled fields across all sections |
| AI Fill other characters | None | Summaries of all other characters in scenario |

## Files Modified

1. `src/services/character-ai.ts` -- Add context builders, update signatures and prompts
2. `src/components/chronicle/CharactersTab.tsx` -- Remove broken context builder, pass full data to updated API

