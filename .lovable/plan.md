

# Update AI Fill, Generate, and Update for New Character Sections

## Problem
The AI Fill, AI Generate (Scenario Builder), and AI Update (Chat Edit Modal) features were built before the six new character sections were added. They currently only know about basics, physicalAppearance, currentlyWearing, preferredClothing, and custom sections. The new hardcoded sections (Background, Tone, Key Life Events, Relationships, Secrets, Fears) and Personality are completely invisible to all three AI tools.

## What Will Be Fixed

### 1. AI Fill (fills empty fields only)
- Will now detect and fill empty Background fields (Job/Occupation, Education Level, Residence, Hobbies, Financial Status, Motivation)
- Will now detect and fill empty Personality trait values (both outward and inward)
- The prompt will list these new empty fields so the AI knows to generate content for them

### 2. AI Generate (fills empty fields + creates new content)
- Same as AI Fill, plus awareness of the new sections when generating additional content
- Will no longer suggest creating "Background", "Personality", "Tone", "Fears", or "Desires" as custom sections since they are now hardcoded

### 3. AI Update / Deep Scan (extracts changes from dialogue)
- Will send Background, Tone, Key Life Events, Relationships, Secrets, and Fears data to the extraction edge function so the AI can see and update them
- The edge function's trackable fields list will include the new field paths
- The CharacterEditModal's merge logic will handle updates to `background.*`, `tone._extras`, `keyLifeEvents._extras`, `relationships._extras`, `secrets._extras`, `fears._extras`

## Technical Details

### File 1: `src/services/character-ai.ts`

**CHARACTER_FIELD_PROMPTS** (line 11-38): Add entries for the 6 Background fields:
- `jobOccupation`, `educationLevel`, `residence`, `hobbies`, `financialStatus`, `motivation`

**getEmptyHardcodedFields** (line 157-203): Add new categories to the returned object:
- `background` - check all 6 fields + any `_extras` with empty values
- `personality` - check trait values in both outward and inward arrays
- `tone` - check `_extras` for empty values
- `keyLifeEvents` - check `_extras` for empty values  
- `relationships` - check `_extras` for empty values
- `secrets` - check `_extras` for empty values
- `fears` - check `_extras` for empty values

**buildAiFillPrompt** (line 226-294): 
- Add the new categories to `fieldsToFill` list
- Add the new fields to the JSON example format
- Update the `totalEmpty` count in `aiFillCharacter`

**aiFillCharacter result application** (line 488-543):
- Apply `background` fields from result
- Apply `personality` trait values from result
- Apply `_extras` values for tone/keyLifeEvents/relationships/secrets/fears

**buildAiGeneratePrompt** (line 297-435):
- Remove "Background", "Personality", "Tone", "Fears", "Desires" from the `standardSections` list since they are now hardcoded
- Add the new empty field categories to `emptyFieldsList`

**aiGenerateCharacter result application** (line 594-698):
- Same new field application logic as aiFillCharacter

### File 2: `supabase/functions/extract-character-updates/index.ts`

**CharacterData interface** (line 33-44): Add optional fields:
- `background?: Record<string, string>`
- `tone?: { _extras?: Array<{label: string; value: string}> }`
- `keyLifeEvents?: { _extras?: Array<{label: string; value: string}> }`
- `relationships?: { _extras?: Array<{label: string; value: string}> }`
- `secrets?: { _extras?: Array<{label: string; value: string}> }`
- `fears?: { _extras?: Array<{label: string; value: string}> }`
- `personality?: { traits?: Array<{label: string; value: string}>; outwardTraits?: ...; inwardTraits?: ... }`

**buildCharacterStateBlock** (line 56-128): Add new sections to the character state output:
- Background fields under `[STABLE]`
- Personality traits under `[STABLE]`
- Tone, Key Life Events, Relationships, Secrets, Fears extras under `[STABLE]`

**TRACKABLE FIELDS section** (line 210-222): Add:
- `background.jobOccupation`, `background.educationLevel`, `background.residence`, `background.hobbies`, `background.financialStatus`, `background.motivation`, `background._extras`
- `tone._extras`, `keyLifeEvents._extras`, `relationships._extras`, `secrets._extras`, `fears._extras`
- `personality.outwardTraits`, `personality.inwardTraits`

### File 3: `src/components/chronicle/CharacterEditModal.tsx`

**buildCharData** (line 464-488): Add the new sections to the data sent to the edge function:
- `background`, `tone`, `keyLifeEvents`, `relationships`, `secrets`, `fears`, `personality`

**Nested field handling** (line 702-710): Add cases for:
- `background.*` fields
- `tone._extras`, `keyLifeEvents._extras`, `relationships._extras`, `secrets._extras`, `fears._extras` array appends
- `personality.*` updates

### File 4: `src/components/chronicle/ChatInterfaceTab.tsx`

The inline extraction call (around line 1240) also builds character data -- this needs the same `buildCharData` update to include the new sections.

## Summary of Changes
- 4 files modified (character-ai.ts, extract-character-updates edge function, CharacterEditModal.tsx, ChatInterfaceTab.tsx)
- 1 edge function redeployed
- No database changes needed
- Backward compatible -- existing characters without these fields will simply have empty arrays/objects

