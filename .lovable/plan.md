

# Add Sexual Orientation Field + Reorder Avatar Fields + Placeholder Cleanup

## What's Changing

Three things that were previously approved but not yet implemented:

1. **Reorder fields in the avatar panel**: Move "Sex / Identity" below "Age" as a full-width row (instead of side-by-side with Age)
2. **Add "Sexual Orientation" field**: New single-row input after Sex / Identity, before Location
3. **Remove remaining "e.g.," from placeholders**: The GuidanceStrengthSlider has some in AI-facing text (left alone), but the previous cleanup was already applied to UI components

## New Field Order (Avatar Panel)

```text
Name
Nicknames
Age          (half-width, right side empty)
Sex / Identity        (full-width)
Sexual Orientation    (full-width, NEW)
Location              (full-width)
Current Mood          (full-width)
Role Description      (full-width)
```

## Technical Details

### Database Migration
Add `sexual_orientation` text column to three tables:
- `characters` (default `''`)
- `character_session_states` (nullable)
- `side_characters` (default `''`)

### Type System (`src/types.ts`)
- Add `sexualOrientation: string` to `Character` type (after `sexType`)
- Add `sexualOrientation?: string` to `CharacterSessionState` type (after `sexType`)
- Add `sexualOrientation: string` to `SideCharacter` type (after `sexType`)

### Data Layer (`src/services/supabase-data.ts`)
- Character read: `sexualOrientation: row.sexual_orientation || ''`
- Character write: `sexual_orientation: char.sexualOrientation`
- Session state read/write/patch: same pattern
- Side character read/write/patch: same pattern

### Scenario Builder Card (`src/components/chronicle/CharactersTab.tsx`)
Lines 710-718: Break the `grid-cols-2` containing Age + Sex/Identity. Age stays half-width, Sex/Identity becomes full-width row, add Sexual Orientation full-width row after it, before Location.

### Character Edit Modal (`src/components/chronicle/CharacterEditModal.tsx`)
- Add `sexualOrientation` to draft state and collapsed summary
- Add new FieldInput for "Sexual Orientation" after Sex / Identity, before Location (lines 1316-1333)

### Chat Session Edit Form (`src/components/chronicle/CharacterEditForm.tsx`)
- Add `sexualOrientation` to `CharacterEditDraft` interface
- Break the Age/Sex grid-cols-2 into separate rows
- Add Sexual Orientation field after Sex, before Role Description

### AI Integration (`src/services/character-ai.ts`)
- Include `sexualOrientation` in character summary strings
- Add to empty field detection for auto-fill
- Add to AI fill JSON schema

### LLM Prompt (`src/services/llm.ts`)
- Include sexual orientation in character prompt block

### Chat Session State (`src/components/chronicle/ChatInterfaceTab.tsx`)
- Map `sexualOrientation` when merging session + base character
- Include in session state patches

### Default Character (`src/pages/Index.tsx`)
- Add `sexualOrientation: ''` to default character object

### Side Character Generator (`src/services/side-character-generator.ts`)
- Add `sexualOrientation: ''` to default

### Edge Functions
- `generate-side-character/index.ts`: Add `sexualOrientation` to generation prompt schema
- `generate-scene-image/index.ts`: Include in character description

## Files Modified
| File | Change |
|---|---|
| Database migration | Add `sexual_orientation` column to 3 tables |
| `src/types.ts` | Add `sexualOrientation` to Character, CharacterSessionState, SideCharacter |
| `src/services/supabase-data.ts` | Read/write/patch mappings for all 3 types |
| `src/components/chronicle/CharactersTab.tsx` | Reorder fields, add Sexual Orientation |
| `src/components/chronicle/CharacterEditModal.tsx` | Add field + collapsed summary |
| `src/components/chronicle/CharacterEditForm.tsx` | Add field, reorder layout |
| `src/services/character-ai.ts` | AI prompt and auto-fill support |
| `src/services/llm.ts` | Character prompt block |
| `src/components/chronicle/ChatInterfaceTab.tsx` | Session state mapping |
| `src/pages/Index.tsx` | Default character value |
| `src/services/side-character-generator.ts` | Default value |
| `supabase/functions/generate-side-character/index.ts` | Generation prompt |
| `supabase/functions/generate-scene-image/index.ts` | Character description |

