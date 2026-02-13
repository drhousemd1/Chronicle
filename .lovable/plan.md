
# Add New Hardcoded Character Sections

## Overview
Add six new hardcoded character sections to the character builder, reordering all trait sections to the specified order. These sections will appear in the Scenario Builder (CharactersTab), the Chat Edit Modal (CharacterEditModal), and the system prompt context sent to the AI.

## New Sections

### Background (hardcoded rows with Lock icons + Add Row)
- Job / Occupation
- Education Level
- Residence
- Hobbies
- Financial Status
- Motivation

### Tone (empty, just "+ Add Row" button)
### Key Life Events (empty, just "+ Add Row" button)
### Relationships (empty, just "+ Add Row" button)
### Secrets (empty, just "+ Add Row" button)
### Fears (empty, just "+ Add Row" button)

## Section Order (top to bottom)
1. Physical Appearance
2. Currently Wearing
3. Preferred Clothing
4. Personality
5. Tone
6. Background
7. Key Life Events
8. Relationships
9. Secrets
10. Fears
11. Goals and Desires

## Technical Details

### 1. Type System (`src/types.ts`)

Add a new `CharacterBackground` type with the six hardcoded fields plus `_extras` for user-added rows:

```typescript
export type CharacterBackground = {
  jobOccupation: string;
  educationLevel: string;
  residence: string;
  hobbies: string;
  financialStatus: string;
  motivation: string;
  _extras?: CharacterExtraRow[];
};
```

Add five new "extras-only" types for the empty sections (Tone, Key Life Events, Relationships, Secrets, Fears). These only hold user-added rows:

```typescript
export type CharacterTone = {
  _extras?: CharacterExtraRow[];
};
export type CharacterKeyLifeEvents = {
  _extras?: CharacterExtraRow[];
};
export type CharacterRelationships = {
  _extras?: CharacterExtraRow[];
};
export type CharacterSecrets = {
  _extras?: CharacterExtraRow[];
};
export type CharacterFears = {
  _extras?: CharacterExtraRow[];
};
```

Add corresponding defaults and update the `Character` type to include these new fields:

```typescript
export type Character = {
  // ... existing fields ...
  background?: CharacterBackground;
  tone?: CharacterTone;
  keyLifeEvents?: CharacterKeyLifeEvents;
  relationships?: CharacterRelationships;
  secrets?: CharacterSecrets;
  fears?: CharacterFears;
  // ... rest ...
};
```

All new fields are optional (`?`) for backward compatibility with existing saved characters.

Also update `CharacterSessionState` to include optional overrides for each new section.

### 2. Scenario Builder (`src/components/chronicle/CharactersTab.tsx`)

- Add new state keys to `expandedSections` for: `tone`, `background`, `keyLifeEvents`, `relationships`, `secrets`, `fears`
- Add change handlers for `CharacterBackground` fields (like `handlePhysicalAppearanceChange`)
- Add extras handlers for all six new sections (reuse existing `handleAddExtra`/`handleUpdateExtra`/`handleDeleteExtra` pattern, extended to support the new section keys)
- Add collapsed view components for each section
- Render sections in specified order: Physical Appearance, Currently Wearing, Preferred Clothing, Personality, Tone, Background, Key Life Events, Relationships, Secrets, Fears, Goals and Desires
- Background section uses `HardcodedRow` for its 6 fields + `ExtraRow` for user-added rows
- Tone/Key Life Events/Relationships/Secrets/Fears sections use `HardcodedSection` with only `ExtraRow` items and the `+ Add Row` button

### 3. Chat Edit Modal (`src/components/chronicle/CharacterEditModal.tsx`)

- Add corresponding `CollapsibleSection` entries for all six new sections in the right column
- Add draft fields and update handlers
- Same rendering order as CharactersTab
- Background uses `HardcodedRow` for hardcoded fields + `ModalExtraRow` for extras
- Other four sections use only `ModalExtraRow` + `+ Add Row`
- Update `CharacterEditDraft` to include the new section types

### 4. Data Layer (`src/services/supabase-data.ts`)

- Update `dbToCharacter` and `characterToDb` mapping functions to handle the new fields
- Map to/from the database JSON columns (the existing `characters` table stores these as JSONB, so no schema migration needed -- the new fields can be stored within the existing character JSON structure or as new columns)
- If new DB columns are needed, create a migration adding nullable JSONB columns for `background`, `tone`, `key_life_events`, `relationships`, `secrets`, `fears`

### 5. System Prompt / AI Context (`src/services/llm.ts` or chat edge function)

- Include the new section data in the character context block sent to the AI so it can reference and update these fields during conversation
- Update the extract-character-updates edge function to recognize the new field paths (e.g., `background.jobOccupation`, `tone._extras`, etc.)

### 6. Character Edit Form (`src/components/chronicle/CharacterEditForm.tsx`)

- Update the `CharacterEditDraft` interface to include the new fields
- Add corresponding form sections

## Design Notes

- **Tone as its own section**: Agreed with your reasoning. A character's tone varies by situation ("With strangers: formal and guarded", "With family: warm and playful"), so an expandable row-based section is more appropriate than a single field buried in the avatar container.
- **Styling**: All new sections will use the existing `HardcodedSection` component with the same slate-blue header, and the unified `+ Add Row` button style (`border-2 border-dashed border-zinc-500`, `text-sm`, `py-2.5`, `rounded-xl`).
- **Lock icons**: Background's six hardcoded rows will show the Lock icon matching Physical Appearance / Currently Wearing / Preferred Clothing.
- **Backward compatibility**: All new fields are optional, so existing characters will render without errors (empty sections show "No data" in collapsed view).
