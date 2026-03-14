

## Three Changes to PersonalitySection, CharactersTab, CharacterEditModal, and StoryCardView

### 1. Change "Trait name" placeholder to "PERSONALITY TRAIT" and remove normal-case override

**File: `PersonalitySection.tsx` (line 99)**
- Change `placeholder="Trait name"` → `placeholder="PERSONALITY TRAIT"`
- Remove `placeholder:normal-case placeholder:tracking-normal` from the className so the placeholder renders in the same uppercase tracking as typed text

### 2. Change all "Label" placeholders to "LABEL" and remove normal-case overrides

Five locations across four files:

| File | Line | Current |
|------|------|---------|
| `CharactersTab.tsx` | 503 | `placeholder="Label"` |
| `CharactersTab.tsx` | 1875 | `placeholder="Label"` |
| `CharacterEditModal.tsx` | 161 | `placeholder="Label"` |
| `CharacterEditModal.tsx` | 1786 | `placeholder="Label"` |
| `StoryCardView.tsx` | 237 | `placeholder="Label..."` |

Each changes to `placeholder="LABEL"` and removes `placeholder:normal-case placeholder:tracking-normal` (or `placeholder:tracking-normal`) from the className.

### 3. Sections already default to expanded — no changes needed

Both `CharactersTab.tsx` (line 564) and `CharacterEditModal.tsx` (line 332) already initialize all `expandedSections` values to `true`. The `StoryCardView` uses `!== false` which also defaults to expanded. The Character Builder page now uses separate toggle pages, so each page shows its content expanded by default. The collapse toggle buttons remain for users who want to collapse sections. No code changes required here.

