
# Character Builder Page -- Guide Content

## What This Does
Write the full markdown documentation for the "Character Builder Page (Structure Guide)" document (ID: `9fd23ab1-4fd0-4b07-a594-599360a2ae90`) following the same 13-section structure used in all other guides. This covers the character creation and editing interface within the Scenario Builder, treated as its own page per user convention.

## Content Summary (based on code review)

**1. Page Overview** -- Route: `tab === "characters"` in `Index.tsx`. Primary source: `CharactersTab.tsx` (1299 lines). Purpose: full character creation and editing interface with avatar management, 11 hardcoded trait sections, personality system, goals, and user-created custom sections. Sidebar position: shares 6th item ("Scenario Builder") with the world tab. Entry points: clicking a character in the World tab's Character Roster, clicking "Add Character" placeholder, or clicking the back arrow from world tab navigates here. Two views: character grid (no character selected) and character detail editor (character selected).

**2. Layout and Structure** -- Two views. **Grid View** (no selection): responsive grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8`) of character cards with "New Character" placeholder button. **Detail View** (character selected): two-column layout (`grid-cols-1 lg:grid-cols-3 gap-10`). Left column (1/3): Avatar Panel -- sticky sidebar (`lg:sticky lg:top-0 lg:max-h-[calc(100vh-9rem)]`) with avatar image, action buttons, and basic info fields (Name, Nicknames, Age, Sex/Identity, Sexual Orientation, Location, Current Mood, Controlled By toggle, Character Role toggle, Role Description). Right column (2/3): scrollable trait sections stacked vertically (`space-y-6`). Header bar shows back arrow, "Character Builder" title, AI Generate, AI Fill, Save, Cancel, and Character Library buttons.

**3. UI Elements -- Complete Inventory**

| Element | Location | Description |
|---------|----------|-------------|
| Back Arrow | Header | Returns to character grid (if in detail) or to world tab (if in grid) |
| "AI Generate" button | Header (detail view only) | Sparkle gradient button, opens AIPromptModal, calls `aiGenerateCharacter()` |
| "AI Fill" button | Header (detail view only) | Sparkle gradient button, opens AIPromptModal, calls `aiFillCharacter()` |
| "Save" button | Header (detail view only) | Shadow Surface style, 12s safety timeout |
| "Cancel" button | Header (detail view only) | Shadow Surface style, returns to world tab |
| "+ Character Library" / "Update Character" | Header (detail view only) | Shadow Surface style, saves to persistent library via `saveCharacterToLibrary()` |
| "Import from Library" button | Header (grid view only) | Opens CharacterPicker modal |
| "Create New" button | Header (grid view only) | Creates blank character |
| Avatar image | Left panel | `w-48 h-48 rounded-2xl`, repositionable via drag (mouse + touch), crosshair overlay in reposition mode |
| AvatarActionButtons | Left panel | Dropdown: Upload from Device, Select from Library, Generate with AI |
| "Reposition" / "Save Position" button | Left panel | Toggles reposition mode with blue ring indicator |
| Sparkle (AI Enhance) buttons | Per hardcoded row | Calls `aiEnhanceCharacterField()` via `character-ai.ts` |
| "Add Row" buttons | Per section | Dashed border, adds user `_extras` row |
| "Add Category" button | Bottom of traits column | Shadow Surface style, adds new custom section |
| Controlled By toggle | Left panel | AI / User segmented control (`bg-zinc-800 rounded-xl`) |
| Character Role toggle | Left panel | Main / Side segmented control |
| Personality split mode toggle | Personality section | Standard / Split segmented control |

**4. Cards / List Items**

- **Character Grid Card**: `aspect-[2/3] rounded-[2rem]` with cover image, gradient overlay (`from-slate-950 via-slate-900/20 to-transparent`), character name, role description, role badge (Main: `bg-indigo-600`, Side: `bg-slate-600`), tag badges (`bg-blue-600`). Hover: `-translate-y-3`, `scale-110` image. Delete button: top-right, `bg-black/40`, appears on hover.
- **New Character Placeholder**: `aspect-[2/3] rounded-[2rem] border-2 border-dashed border-zinc-600`, centered Plus icon + "New Character" text. Hover: `border-blue-400`, icon/text turn `text-blue-400`.
- **HardcodedRow**: `[Read-only Label (w-2/5)] [Sparkle button] [AutoResizeTextarea (flex-1)] [Lock icon (w-7)]`. Label: `text-xs font-bold bg-zinc-900/50 text-zinc-400 uppercase tracking-widest`. Lock icon indicates field cannot be renamed.
- **ExtraRow (user-added)**: `[Editable Label (w-2/5)] [Sparkle button] [Editable Value (flex-1)] [Delete X button]`. Same styling but label is editable and has red X delete instead of lock.
- **Personality TraitRow**: `[Trait Name (w-1/3)] [Sparkle] [Description (flex-1)] [Flexibility dropdown] [Delete X]`. Flexibility: rigid (red), normal (blue), flexible (emerald).

**5. Modals and Overlays**

| Modal | Trigger | Component |
|-------|---------|-----------|
| AvatarGenerationModal | "Generate with AI" in avatar actions | `AvatarGenerationModal.tsx` |
| AIPromptModal | "AI Generate" or "AI Fill" header buttons | `AIPromptModal.tsx` |
| CharacterPicker | "Import from Library" header button | `CharacterPicker.tsx` |
| ImageLibraryPickerModal | "Select from Library" in avatar actions | `ImageLibraryPickerModal.tsx` (reused) |

No browser `confirm()` or `prompt()` dialogs in the character builder itself.

**6. Data Architecture**

- **Primary data type**: `Character` -- contains `name`, `nicknames`, `age`, `sexType`, `sexualOrientation`, `roleDescription`, `location`, `currentMood`, `controlledBy`, `characterRole`, `tags`, `avatarDataUrl`, `avatarPosition`, `physicalAppearance: PhysicalAppearance`, `currentlyWearing: CurrentlyWearing`, `preferredClothing: PreferredClothing`, `personality: CharacterPersonality`, `background: CharacterBackground`, `tone: CharacterTone`, `keyLifeEvents: CharacterKeyLifeEvents`, `relationships: CharacterRelationships`, `secrets: CharacterSecrets`, `fears: CharacterFears`, `goals: CharacterGoal[]`, `sections: CharacterTraitSection[]`.
- **PhysicalAppearance fields**: `hairColor`, `eyeColor`, `build`, `bodyHair`, `height`, `breastSize`, `genitalia`, `skinTone`, `makeup`, `bodyMarkings`, `temporaryConditions`, plus `_extras: CharacterExtraRow[]`.
- **CurrentlyWearing fields**: `top`, `bottom`, `undergarments`, `miscellaneous`, plus `_extras`.
- **PreferredClothing fields**: `casual`, `work`, `sleep`, `undergarments`, `miscellaneous`, plus `_extras`.
- **CharacterBackground fields**: `jobOccupation`, `educationLevel`, `residence`, `hobbies`, `financialStatus`, `motivation`, plus `_extras`.
- **Extras-only sections** (Tone, Key Life Events, Relationships, Secrets, Fears): Only have `_extras: CharacterExtraRow[]` -- no hardcoded sub-fields.
- **CharacterPersonality**: `splitMode: boolean`, `traits: PersonalityTrait[]`, `outwardTraits: PersonalityTrait[]`, `inwardTraits: PersonalityTrait[]`. Each trait has `id`, `label`, `value`, `flexibility` (rigid/normal/flexible).
- **CharacterGoal**: `id`, `title`, `desiredOutcome`, `mode` (guidance strength), `steps: StoryGoalStep[]` with simple/advanced toggle.
- **Database table**: `characters` -- stores all fields as jsonb columns (`physical_appearance`, `currently_wearing`, `preferred_clothing`, `personality`, `background`, `tone`, `key_life_events`, `relationships`, `secrets`, `fears`, `goals`, `sections`). `is_library` boolean distinguishes library copies from scenario-bound characters.
- **State management**: Characters live in `activeData.characters` array in `Index.tsx`. Direct `useState`, no React Query. Updates via `onUpdate(id, patch)` which patches the character in the array.

**7. Component Tree**

```
Index.tsx
  > header (back arrow + "Character Builder" + AI Generate/Fill/Save/Cancel/Library buttons)
  > CharactersTab
    > [Grid View - no selection]
      > Character Grid Cards (per character)
      > New Character Placeholder
    > [Detail View - character selected]
      > Left Column (Avatar Panel)
        > Avatar image + reposition overlay
        > AvatarActionButtons
        > Reposition toggle button
        > Basic info fields (Name, Nicknames, Age, Sex, Orientation, Location, Mood)
        > Controlled By toggle (AI/User)
        > Character Role toggle (Main/Side)
        > Role Description + AI enhance
      > Right Column (Trait Sections)
        > HardcodedSection: Physical Appearance (11 rows + extras)
        > HardcodedSection: Currently Wearing (4 rows + extras)
        > HardcodedSection: Preferred Clothing (5 rows + extras)
        > PersonalitySection (split mode toggle + trait rows)
        > HardcodedSection: Tone (extras only)
        > HardcodedSection: Background (6 rows + extras)
        > HardcodedSection: Key Life Events (extras only)
        > HardcodedSection: Relationships (extras only)
        > HardcodedSection: Secrets (extras only)
        > HardcodedSection: Fears (extras only)
        > CharacterGoalsSection (goals with arc steps)
        > Custom Sections (user-created, blue header)
        > "Add Category" button
    > AvatarGenerationModal
```

**8. Custom Events and Callbacks**

| Callback | Purpose |
|----------|---------|
| `onUpdate(id, patch)` | Patches a character in the `activeData.characters` array |
| `onDelete(id)` | Removes character from array |
| `onSelect(id)` | Switches to detail view for that character |
| `onAddNew()` | Creates blank character with defaults |
| `handleEnhanceField(fieldKey, section, getCurrentValue, setValue, customLabel)` | Per-field AI enhancement via `character-ai.ts` |
| `handlePhysicalAppearanceChange(field, value)` | Updates a PA field on the selected character |
| `handleCurrentlyWearingChange(field, value)` | Updates a CW field |
| `handlePreferredClothingChange(field, value)` | Updates a PC field |
| `handleBackgroundChange(field, value)` | Updates a Background field |
| `handleAddExtra(section)` / `handleUpdateExtra` / `handleDeleteExtra` | CRUD on `_extras` arrays across all sections |
| `handleSaveToLibrary` | Saves or updates character in persistent library (`is_library = true`) |
| `handleAiPortrait` | Opens AvatarGenerationModal |
| `handleAvatarGenerated(imageUrl)` | Compresses (512x512, 0.85) + uploads to `avatars` bucket + sets URL |

**9. Styling Reference**

- Section card shell: `bg-[#2a2a2f] rounded-[24px] border border-white/10 shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)]`
- Section header (hardcoded): `bg-[#4a5f7f] border-b border-white/20 px-5 py-3` (steel blue)
- Section header (custom/user-created): `bg-blue-900/40 border-b border-blue-500/20 px-5 py-3` (dark blue, editable title)
- Inner content area: `p-5 pb-6 bg-[#3a3a3f]/30 rounded-2xl border border-white/5`
- Field labels (hardcoded): `text-xs font-bold bg-zinc-900/50 border border-white/10 text-zinc-400 uppercase tracking-widest`
- Field labels (user-added): Same styling but `text-white` (editable)
- Text inputs: `bg-zinc-900/50 border border-white/10 text-white placeholder:text-zinc-600 rounded-lg focus:ring-2 focus:ring-blue-500/20`
- AI enhance button: `text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10`, pulsing blue when active
- Add Row: `text-blue-400 border-2 border-dashed border-zinc-500 hover:border-blue-400 rounded-xl`
- Controlled By toggle: AI selected = `text-blue-400`, User selected = `text-amber-400`, within `bg-zinc-800 rounded-xl`
- Character Role toggle: Main selected = `text-indigo-400`, Side selected = `text-zinc-300`
- Personality flexibility colors: rigid = `text-red-400`, normal = `text-blue-400`, flexible = `text-emerald-400`
- Grid card hover: `-translate-y-3`, image `scale-110`, name `text-blue-300`

**10. Backend Injection / AI Prompts**

Every character field is injected into the LLM system prompt (in `llm.ts`):

| Field | Injection Format |
|-------|-----------------|
| `name`, `sexType` | `CHARACTER: {name} ({sexType})` |
| `nicknames` | `NICKNAMES: {value}` |
| `sexualOrientation` | `SEXUAL ORIENTATION: {value}` |
| `controlledBy` | `CONTROL: {value}` (AI or User) |
| `characterRole` | `ROLE: {value}` (Main or Side) |
| `location` | `LOCATION: {value}` |
| `currentMood` | `MOOD: {value}` |
| `personality` | `PERSONALITY:` block -- standard traits as `{label}: {value}`, split mode as `(outward) ...` / `(inward) ...` with `[{flexibility}]` tags |
| `tone._extras` | `TONE: {label}={value}, ...` |
| `background` fields | `BACKGROUND: Job: ..., Education: ..., Residence: ..., Hobbies: ..., Financial: ..., Motivation: ...` plus extras |
| `keyLifeEvents._extras` | `KEY LIFE EVENTS: {label}={value}, ...` |
| `relationships._extras` | `RELATIONSHIPS: {label}={value}, ...` |
| `secrets._extras` | `SECRETS: {label}={value}, ...` |
| `fears._extras` | `FEARS: {label}={value}, ...` |
| `goals` | `GOALS:\n- {title} [{mode}]: {outcome}` with active step details |
| `physicalAppearance` | Hardcoded fields injected as structured block; `_extras` appended as `ADDITIONAL ATTRIBUTES` |
| `currentlyWearing` | Same pattern as PA |
| `preferredClothing` | Same pattern as PA |
| `sections` (custom) | `TRAITS:\n{title}: {label}={value}, ...` per section |
| `tags` | `TAGS: {value}` |

**AI Enhancement (Sparkle buttons)**: The `character-ai.ts` service has field-specific prompts in `CHARACTER_FIELD_PROMPTS` with per-field instructions and max sentence counts. Builds full world + other-characters context via `buildFullContext()` and character self-context via `buildCharacterSelfContext()`. Uses Grok-only model chain with content-filter fallback (`grok-3` -> `grok-3-mini` -> `grok-2`).

**AI Fill**: `aiFillCharacter()` -- scans all sections for empty fields, builds a JSON-returning prompt that instructs the LLM to only fill empties, parses response with robust JSON extraction (markdown stripping, regex, balanced-brace fallback). Applies results only to fields that were actually empty. Supports user guidance prompt and "use existing details" toggle.

**AI Generate**: `aiGenerateCharacter()` -- same as AI Fill but also creates new custom sections based on detected story themes (NSFW -> Kinks & Fantasies, Fantasy -> Abilities & Skills, Mystery -> Secrets & Connections, Sci-Fi -> Tech & Augments). Returns `emptyFieldsFill` + `newSections` + `existingSectionAdditions`.

**11. Security and Access Control**

- `characters` table: INSERT/UPDATE/DELETE scoped to `auth.uid() = user_id`. SELECT allows own characters or characters from published scenarios.
- Avatar uploads: stored in `avatars` bucket (public read), uploaded to user-scoped paths (`{userId}/avatar-{charId}-{timestamp}.jpg`).
- Library characters use `is_library = true` flag and same RLS rules.

**12. Known Issues / Quirks**

- `AutoResizeTextarea` is duplicated across `CharactersTab.tsx`, `PersonalitySection.tsx`, `StoryGoalsSection.tsx`, `WorldTab.tsx`, and `CharacterEditModal.tsx` -- same implementation, not extracted to a shared component.
- AI Generate/Fill use Grok-only models (`grok-3` with fallback chain) regardless of the user's selected model setting -- hardcoded comment "GROK ONLY" in multiple places.
- The `tags` field on characters is a comma-separated string, not an array, unlike `content_themes` and scenario tags which use arrays.
- Grid view delete button uses the legacy `Icons.Trash` component rather than lucide's `Trash2`.
- When switching from grid view to detail view, all 12 sections start expanded (`expandedSections` defaults all to `true`), which can be a lot of scroll on first load.
- The AI Fill `AIPromptModal` has a "Use existing details" toggle that controls whether the LLM strongly follows existing character data or treats user guidance as primary.
- Character Library save is independent from scenario save -- the `isSavingToLibrary` state is separate to prevent UI conflicts.
- Avatar upload compresses to 512x512 at 0.7 quality; AI-generated avatars compress at 0.85 quality (slight inconsistency).

**13. Planned / Future Changes** -- None documented.

## Implementation
Single database update to write the markdown content to `guide_documents` row `9fd23ab1-4fd0-4b07-a594-599360a2ae90`. No code file changes needed.
