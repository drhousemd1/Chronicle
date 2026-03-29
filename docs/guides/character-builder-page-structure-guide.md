> **INSTRUCTIONS FOR LOVABLE / AI AGENTS**
>
> MANDATORY: Before editing this file, read `docs/guides/GUIDE_STYLE_RULES.md` in full.
>
> That file defines heading hierarchy, table formatting, code block rules, good-vs-bad content patterns, and section-specific requirements. You must follow it exactly.
>
> This document is the SINGLE SOURCE OF TRUTH for this page's architecture.
>
> When making changes to this page's code, you MUST:
>
> 1. READ `docs/guides/GUIDE_STYLE_RULES.md` before making any edits to this document
> 2. READ this entire document before making any code changes
> 3. UPDATE this document IN-PLACE after making code changes — do NOT append summaries
> 4. PRESERVE the exact 13-section format — do not skip sections, do not reorganize
> 5. USE REAL VALUES from the code — exact file paths, exact Tailwind classes, exact hex codes
> 6. UPDATE the Known Issues section (Section 12) when fixing or discovering bugs
> 7. CROSS-REFERENCE the Shared Elements page when modifying any shared component
>
> If a section does not apply, write: `N/A — [specific reason]`
>
> Never write: "see code for details" — this document exists so no one needs to read the code.

# Character Builder Page

## 1. Page Overview

**Route**: `tab === "characters"` in `Index.tsx`
**Primary Source File**: `CharactersTab.tsx` (1299 lines)
**Purpose**: Full character creation and editing interface with avatar management, 11 hardcoded trait sections, personality system, goals, and user-created custom sections.

**Sidebar Position**: Shares 6th item ("Scenario Builder") with the World tab -- both tabs activate the same sidebar entry.

**Entry Points**:
- Clicking a character in the World tab's Character Roster
- Clicking the "Add Character" placeholder in the Character Roster
- Clicking the back arrow from the World tab navigates here (grid view)

**Two Views**:
- **Grid View** (no character selected): Responsive card grid showing all characters plus a "New Character" placeholder
- **Detail View** (character selected): Two-column editor with avatar panel and trait sections

---

## 2. Layout and Structure

### Grid View (No Selection)

Responsive grid layout:
```
grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8
```

Shows character cards with avatar, name, role badge, and tags. Includes a "New Character" placeholder card at the end.

### Detail View (Character Selected)

Two-column layout:
```
grid-cols-1 lg:grid-cols-3 gap-10
```

**Left Column (1/3)** -- Avatar Panel:
- Sticky sidebar: `lg:sticky lg:top-0 lg:max-h-[calc(100vh-9rem)]`
- Avatar image with action buttons
- Basic info fields (Name, Nicknames, Age, Sex/Identity, Sexual Orientation, Location, Current Mood)
- Controlled By toggle (AI/User)
- Character Role toggle (Main/Side)
- Role Description with AI enhance

**Right Column (2/3)** -- Trait Sections:
- Scrollable stack of sections: `space-y-6`
- 11 hardcoded sections + personality + goals + user-created custom sections
- "Add Category" button at the bottom

### Header Bar

Shows back arrow, "Character Builder" title, and context-sensitive buttons:
- **Detail view**: AI Generate, AI Fill, Save, Cancel, Character Library
- **Grid view**: Import from Library, Create New

---

## 3. UI Elements -- Complete Inventory

| Element | Location | Description |
|---------|----------|-------------|
| Back Arrow | Header | Returns to character grid (if in detail) or to world tab (if in grid) |
| "AI Generate" button | Header (detail view only) | Sparkle gradient button, opens AIPromptModal, calls `aiGenerateCharacter()` |
| "AI Fill" button | Header (detail view only) | Sparkle gradient button, opens AIPromptModal, calls `aiFillCharacter()` |
| "Save" button | Header (detail view only) | Shadow Surface style, 12s safety timeout |
| "Cancel" button | Header (detail view only) | Shadow Surface style, returns to world tab |
| "+ Character Library" / "Update Character" | Header (detail view only) | Shadow Surface style, saves to persistent library via `saveCharacterToLibrary()`. Shows "Update Character" if already in library. |
| "Import from Library" button | Header (grid view only) | Opens CharacterPicker modal |
| "Create New" button | Header (grid view only) | Creates blank character with defaults |
| Avatar image | Left panel | `w-48 h-48 rounded-2xl`, repositionable via drag (mouse + touch), crosshair overlay in reposition mode |
| AvatarActionButtons | Left panel | Dropdown menu: Upload from Device, Select from Library, Generate with AI |
| "Reposition" / "Save Position" button | Left panel | Toggles reposition mode with blue ring indicator |
| Sparkle (AI Enhance) buttons | Per hardcoded row | Calls `aiEnhanceCharacterField()` via `character-ai.ts` |
| "Add Row" buttons | Per section | Dashed border, adds user `_extras` row |
| "Add Category" button | Bottom of traits column | Shadow Surface style, adds new custom section |
| Controlled By toggle | Left panel | AI / User segmented control (`bg-zinc-800 rounded-xl`) |
| Character Role toggle | Left panel | Main / Side segmented control |
| Personality split mode toggle | Personality section | Standard / Split segmented control |

---

## 4. Cards / List Items

### Character Grid Card
- `aspect-[2/3] rounded-[2rem]` with cover image
- Gradient overlay: `from-slate-950 via-slate-900/20 to-transparent`
- Character name, role description text
- Role badge: Main = `bg-indigo-600`, Side = `bg-slate-600`
- Tag badges: `bg-blue-600`
- Hover: `-translate-y-3`, image `scale-110`, name turns `text-blue-300`
- Delete button: top-right, `bg-black/40`, appears on hover

### New Character Placeholder
- `aspect-[2/3] rounded-[2rem] border-2 border-dashed border-zinc-600`
- Centered Plus icon + "New Character" text
- Hover: `border-blue-400`, icon/text turn `text-blue-400`

### HardcodedRow
```
[Read-only Label (w-2/5)] [Sparkle button] [AutoResizeTextarea (flex-1)] [Lock icon (w-7)]
```
- Label: `text-xs font-bold bg-zinc-900/50 text-zinc-400 uppercase tracking-widest`
- Lock icon (zinc-400) indicates the field cannot be renamed

### ExtraRow (User-Added)
```
[Editable Label (w-2/5)] [Sparkle button] [Editable Value (flex-1)] [Delete X button]
```
- Same styling as HardcodedRow but label is editable (`text-white`)
- Red X delete button instead of lock icon

### Personality TraitRow
```
[Trait Name (w-1/3)] [Sparkle] [Description (flex-1)] [Flexibility dropdown] [Delete X]
```
- Flexibility color coding: rigid = `text-red-400`, normal = `text-blue-400`, flexible = `text-emerald-400`

---

## 5. Modals and Overlays

| Modal | Trigger | Component |
|-------|---------|-----------|
| AvatarGenerationModal | "Generate with AI" in avatar actions dropdown | `AvatarGenerationModal.tsx` |
| AIPromptModal | "AI Generate" or "AI Fill" header buttons | `AIPromptModal.tsx` |
| CharacterPicker | "Import from Library" header button (grid view) | `CharacterPicker.tsx` |
| ImageLibraryPickerModal | "Select from Library" in avatar actions dropdown | `ImageLibraryPickerModal.tsx` (reused component) |

**No browser `confirm()` or `prompt()` dialogs** are used in the character builder itself (unlike the World tab which uses `confirm()` for deletions).

---

## 6. Data Architecture

### Primary Data Type: `Character`

Top-level fields:
- `name`, `nicknames`, `age`, `sexType`, `sexualOrientation`, `roleDescription`
- `location`, `currentMood`, `controlledBy` (AI/User), `characterRole` (Main/Side)
- `tags` (comma-separated string), `avatarDataUrl`, `avatarPosition: {x, y}`

### Structured Sub-Objects

**PhysicalAppearance** (11 hardcoded fields + extras):
`hairColor`, `eyeColor`, `build`, `bodyHair`, `height`, `breastSize`, `genitalia`, `skinTone`, `makeup`, `bodyMarkings`, `temporaryConditions`, plus `_extras: CharacterExtraRow[]`

**CurrentlyWearing** (4 hardcoded + extras):
`top`, `bottom`, `undergarments`, `miscellaneous`, plus `_extras`

**PreferredClothing** (5 hardcoded + extras):
`casual`, `work`, `sleep`, `undergarments`, `miscellaneous`, plus `_extras`

**CharacterBackground** (6 hardcoded + extras):
`jobOccupation`, `educationLevel`, `residence`, `hobbies`, `financialStatus`, `motivation`, plus `_extras`

**Extras-Only Sections** (no hardcoded sub-fields):
- `tone: { _extras: CharacterExtraRow[] }`
- `keyLifeEvents: { _extras: CharacterExtraRow[] }`
- `relationships: { _extras: CharacterExtraRow[] }`
- `secrets: { _extras: CharacterExtraRow[] }`
- `fears: { _extras: CharacterExtraRow[] }`

**CharacterPersonality**:
- `splitMode: boolean` -- toggles between standard and split personality
- `traits: PersonalityTrait[]` -- used in standard mode
- `outwardTraits: PersonalityTrait[]` -- used in split mode (public persona)
- `inwardTraits: PersonalityTrait[]` -- used in split mode (inner self)
- Each trait: `{ id, label, value, flexibility }` where flexibility = rigid | normal | flexible

**CharacterGoal**:
- `id`, `title`, `desiredOutcome`, `mode` (guidance strength)
- `steps: StoryGoalStep[]` with simple/advanced toggle

**Custom Sections**: `sections: CharacterTraitSection[]` -- user-created sections with custom titles and `_extras` rows

### Database Table: `characters`

All structured fields stored as jsonb columns: `physical_appearance`, `currently_wearing`, `preferred_clothing`, `personality`, `background`, `tone`, `key_life_events`, `relationships`, `secrets`, `fears`, `goals`, `sections`.

`is_library` boolean distinguishes persistent library copies from scenario-bound characters.

### State Management

Characters live in `activeData.characters` array in `Index.tsx`. Uses direct `useState` (no React Query). Updates flow through `onUpdate(id, patch)` which patches the character object in the array.

---

## 7. Component Tree

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

---

## 8. Custom Events and Callbacks

| Callback | Purpose |
|----------|---------|
| `onUpdate(id, patch)` | Patches a character in the `activeData.characters` array |
| `onDelete(id)` | Removes character from array |
| `onSelect(id)` | Switches to detail view for that character |
| `onAddNew()` | Creates blank character with defaults |
| `handleEnhanceField(fieldKey, section, getCurrentValue, setValue, customLabel)` | Per-field AI enhancement via `character-ai.ts` |
| `handlePhysicalAppearanceChange(field, value)` | Updates a Physical Appearance field on the selected character |
| `handleCurrentlyWearingChange(field, value)` | Updates a Currently Wearing field |
| `handlePreferredClothingChange(field, value)` | Updates a Preferred Clothing field |
| `handleBackgroundChange(field, value)` | Updates a Background field |
| `handleAddExtra(section)` / `handleUpdateExtra` / `handleDeleteExtra` | CRUD operations on `_extras` arrays across all sections |
| `handleSaveToLibrary` | Saves or updates character in persistent library (`is_library = true`) |
| `handleAiPortrait` | Opens AvatarGenerationModal |
| `handleAvatarGenerated(imageUrl)` | Compresses image (512x512, 0.85 quality) + uploads to `avatars` bucket + sets URL on character |

---

## 9. Styling Reference

### Section Cards
- Shell: `bg-[#2a2a2f] rounded-[24px] border border-white/10 shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)]`
- Hardcoded section header: `bg-[#4a5f7f] border-b border-white/20 px-5 py-3` (steel blue)
- Custom/user-created section header: `bg-blue-900/40 border-b border-blue-500/20 px-5 py-3` (dark blue, editable title)
- Inner content area: `p-5 pb-6 bg-[#3a3a3f]/30 rounded-2xl border border-white/5`

### Field Rows
- Hardcoded labels: `text-xs font-bold bg-zinc-900/50 border border-white/10 text-zinc-400 uppercase tracking-widest`
- User-added labels: Same styling but `text-white` (editable)
- Text inputs: `bg-zinc-900/50 border border-white/10 text-white placeholder:text-zinc-600 rounded-lg focus:ring-2 focus:ring-blue-500/20`

### Interactive Elements
- AI enhance button: `text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10`, pulsing blue animation when active
- Add Row: `text-blue-400 border-2 border-dashed border-zinc-500 hover:border-blue-400 rounded-xl`
- Controlled By toggle: AI selected = `text-blue-400`, User selected = `text-amber-400`, within `bg-zinc-800 rounded-xl`
- Character Role toggle: Main selected = `text-indigo-400`, Side selected = `text-zinc-300`
- Personality flexibility: rigid = `text-red-400`, normal = `text-blue-400`, flexible = `text-emerald-400`

### Grid Cards
- Hover: `-translate-y-3`, image `scale-110`, name `text-blue-300`

---

## 10. Backend Injection / AI Prompts

Every character field is injected into the LLM system prompt (built in `llm.ts`). This is how the AI "knows" each character during chat:

| Field | Injection Format |
|-------|-----------------|
| `name`, `sexType` | `CHARACTER: {name} ({sexType})` |
| `age` | `AGE: {value}` |
| `nicknames` | `NICKNAMES: {value}` |
| `sexualOrientation` | `SEXUAL ORIENTATION: {value}` |
| `controlledBy` | `CONTROL: {value}` (AI or User) |
| `characterRole` | `ROLE: {value}` (Main or Side) |
| `roleDescription` | `ROLE DESCRIPTION: {value}` |
| `location` | `LOCATION: {value}` |
| `currentMood` | `MOOD: {value}` |
| `personality` | `PERSONALITY:` block -- standard mode: `{label}: {value}` per trait; split mode: `(outward) ...` / `(inward) ...` with `[{flexibility}]` tags |
| `tone._extras` | `TONE: {label}={value}, ...` |
| `background` fields | `BACKGROUND: Job: ..., Education: ..., Residence: ..., Hobbies: ..., Financial: ..., Motivation: ...` plus extras |
| `keyLifeEvents._extras` | `KEY LIFE EVENTS: {label}={value}, ...` |
| `relationships._extras` | `RELATIONSHIPS: {label}={value}, ...` |
| `secrets._extras` | `SECRETS: {label}={value}, ...` |
| `fears._extras` | `FEARS: {label}={value}, ...` |
| `goals` | `GOALS:\n- {title} [{mode}]: {outcome}` with active step details and optional `currentStatus` |
| `physicalAppearance` | Hardcoded fields injected as structured block; `_extras` appended as `ADDITIONAL ATTRIBUTES` |
| `currentlyWearing` | Same structured pattern as Physical Appearance |
| `preferredClothing` | Same structured pattern as Physical Appearance |
| `sections` (custom) | `TRAITS:\n{title}: {label}={value}, ...` per section; includes `freeformValue` via normalized Notes rows |
| `tags` | `TAGS: {value}` |

### AI Enhancement (Sparkle Buttons)

The `character-ai.ts` service provides per-field AI enhancement:
- `CHARACTER_FIELD_PROMPTS` contains field-specific instructions with per-field max sentence counts and formatting guidance
- Builds full world + other-characters context via `buildFullContext()` and character self-context via `buildCharacterSelfContext()`
- Uses **Grok-only** model chain with content-filter fallback: `grok-3` → `grok-3-mini` → `grok-2`
- This is hardcoded regardless of the user's selected model setting

### AI Fill

`aiFillCharacter()` in `character-ai.ts`:
- Scans all sections for empty fields
- Builds a JSON-returning prompt instructing the LLM to only fill empties
- Parses response with robust JSON extraction (markdown stripping, regex, balanced-brace fallback)
- Applies results only to fields that were actually empty
- Supports user guidance prompt and "Use existing details" toggle (controls whether LLM prioritizes existing character data or user guidance)

### AI Generate

`aiGenerateCharacter()` in `character-ai.ts`:
- Same as AI Fill but also creates new custom sections based on detected story themes:
  - NSFW → Kinks & Fantasies
  - Fantasy → Abilities & Skills
  - Mystery → Secrets & Connections
  - Sci-Fi → Tech & Augments
- Returns `emptyFieldsFill` + `newSections` + `existingSectionAdditions`

---

## 11. Security and Access Control

### Database RLS
- `characters` table: INSERT/UPDATE/DELETE scoped to `auth.uid() = user_id`
- SELECT allows own characters OR characters from published scenarios (via join to `published_scenarios`)

### Avatar Storage
- Stored in `avatars` bucket (public read)
- Uploaded to user-scoped paths: `{userId}/avatar-{charId}-{timestamp}.jpg`

### Library Characters
- Use `is_library = true` flag
- Same RLS rules apply -- scoped to owning user

---

## 12. Known Issues / Quirks

- **AutoResizeTextarea duplication**: The same component is duplicated across `CharactersTab.tsx`, `PersonalitySection.tsx`, `StoryGoalsSection.tsx`, `WorldTab.tsx`, and `CharacterEditModal.tsx` -- not extracted to a shared component.
- **Grok-only AI**: AI Generate/Fill use Grok-only models (`grok-3` with fallback chain) regardless of the user's selected model setting. Hardcoded with "GROK ONLY" comments.
- **Tags as string**: The `tags` field on characters is a comma-separated string, not an array, unlike `content_themes` and scenario tags which use arrays.
- **Legacy delete icon**: Grid view delete button uses the legacy `Icons.Trash` component rather than lucide's `Trash2`.
- **All sections expanded**: When switching from grid to detail view, all 12 sections start expanded (`expandedSections` defaults all to `true`), which creates a long scroll on first load.
- **AI Fill toggle**: The AIPromptModal has a "Use existing details" toggle that controls whether the LLM strongly follows existing character data or treats user guidance as primary.
- **Independent library save**: Character Library save (`isSavingToLibrary`) is independent from scenario save to prevent UI state conflicts.
- **Avatar compression inconsistency**: User-uploaded avatars compress to 512x512 at 0.7 quality; AI-generated avatars compress at 0.85 quality.

---

### Bug Report Items (Added 2026-03-01)

- **RESOLVED — Bug #1 — 2026-03-01**: `buildCharacterStateBlock()` now outputs scaffolding placeholders for all section types when empty, including `currentlyWearing`, `physicalAppearance`, `preferredClothing`, `background`, `personality`, and all extras-only sections (tone, keyLifeEvents, relationships, secrets, fears). AI can now see and populate all 16 section types.
- **RESOLVED — Bug #2 — 2026-03-01**: `personality.traits` added to TRACKABLE FIELDS for unified personality mode. Characters not using split mode will now have traits extracted correctly.
- **RESOLVED — Bug #3 — 2026-03-01**: Extraction prompt now uses correct field name `undergarments`.
- **RESOLVED — Bug #4 — 2026-03-01**: Default extraction model changed from `grok-3-mini` to `grok-3`. Deep Scan also uses `grok-3`. The 403 safe-mode retry path intentionally remains on `grok-3-mini`.
- **RESOLVED — Bug #5 — 2026-03-01**: Extraction prompt augmented with 7-block analytical depth framework covering psychological inference, progressive trait refinement, conflict resolution, split personality mode detection, tone inference from dialogue, cross-field coherence enforcement, and complete trait lifecycle management.
- **ACTIVE — Bug #6**: Memory system architecture incomplete — no long-term accumulation. Memories are extracted per-message but never summarized or consolidated.
- **RESOLVED — Bug #7**: Previous issue resolved.
- **RESOLVED — Bug #8**: Previous issue resolved.

---

## 13. Planned / Future Changes

None documented.
