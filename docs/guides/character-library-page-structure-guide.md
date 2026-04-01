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

# Character Library Page — Structure Guide

---

## 1. Page Overview

| Property | Value |
|---|---|
| **Route** | `/?tab=library` (defined inside `Index.tsx`, rendered when `activeTab === "library"`) |
| **Primary Source Files** | `src/pages/Index.tsx` (header, state, handlers), `src/components/chronicle/CharactersTab.tsx` (card grid + editor) |
| **Purpose** | Global reusable character repository. Characters here are independent of any scenario and can be imported into any Scenario Builder via the CharacterPicker. |
| **User Role Access** | Any authenticated user |
| **Sidebar Position** | 3rd item — "Character Library" |
| **Entry Points** | Sidebar click, programmatic `setActiveTab("library")` |

The Character Library is a standalone tab that manages characters with `is_library = true` in the `characters` table. Unlike scenario-bound characters, library characters persist across scenarios and can be imported into any story.

---

## 2. Layout and Structure

The page has **two distinct views** controlled by whether a character is selected:

### Card Grid View (no character selected)

```
┌─────────────────────────────────────────────────┐
│  Header: "Character Library" [Search bar]        │
├─────────────────────────────────────────────────┤
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐ │
│  │ Char 1 │  │ Char 2 │  │ Char 3 │  │ + New  │ │
│  │ Card   │  │ Card   │  │ Card   │  │ Card   │ │
│  │        │  │        │  │        │  │        │ │
│  └────────┘  └────────┘  └────────┘  └────────┘ │
│  Responsive: grid-cols-1 sm:grid-cols-2          │
│              lg:grid-cols-4 gap-8                 │
│  Container: p-10 bg-black relative z-10          │
└─────────────────────────────────────────────────┘
```

**Search bar**: Positioned to the right of the "Character Library" title in the header. Filters the card grid in real-time by matching against character name, nicknames, role description, tags, and all hardcoded section field values (physical appearance, clothing, etc.). Client-side filter — no database calls. Case-insensitive partial string matching. State: `librarySearchQuery`.

**Background**: The container uses `bg-black relative z-10` to ensure a fully opaque solid black background with no bleed-through from the parent layout.

### Character Editor View (character selected)

```
┌─────────────────────────────────────────────────┐
│  Header: [← Back] "Character Library" [AI Fill] [Cancel] [Update Character] │
├──────────────┬──────────────────────────────────┤
│  Avatar &    │  Section 1: Physical Appearance   │
│  Profile     │  Section 2: Currently Wearing     │
│  Panel       │  Section 3: Preferred Clothing    │
│  (sticky)    │  Section 4: Personality           │
│              │  Section 5: Tone                  │
│  lg:col-span-1│  Section 6: Background           │
│              │  Section 7: Key Life Events       │
│              │  Section 8: Relationships         │
│              │  Section 9: Secrets               │
│              │  Section 10: Fears                │
│              │  Section 11: Character Goals      │
│              │  + Custom Sections                │
│              │  lg:col-span-2                    │
└──────────────┴──────────────────────────────────┘
```

- Editor grid: `lg:grid-cols-3`
- Left column: Avatar/Profile panel with `sticky top-10`
- Right column: `lg:col-span-2`, vertical stack of all trait sections
- Header shows back arrow only when a character is selected
- **Save button is hidden** in library tab — "Update Character" is the sole save action

---

## 3. UI Elements — Complete Inventory

| Element | Type | Location | Behavior |
|---|---|---|---|
| **"Character Library"** heading | `<h1>` | Header bar | `text-lg font-black text-slate-900 uppercase tracking-tight` — static title |
| **Search bar** | `<input>` | Header bar (grid view only) | `w-64` text input to the right of the title. Filters card grid by name, nicknames, description, tags, and all profile fields. Hidden when a character is selected. |
| **← Back button** | `<button>` | Header bar (editor only) | Deselects character, returns to card grid |
| **AI Fill button** | `<button>` | Header bar (editor only) | Premium iridescent gradient style. Opens `AIPromptModal` with mode `fill`. Sends character data + user prompt to AI for bulk field population. |
| **Update Character button** | `<button>` | Header bar (editor only) | Saves character to library via `handleSaveToLibrary()`. Stays in editor after saving. |
| **Cancel button** | `<button>` | Header bar (editor only) | For new unsaved characters: removes from local state. For already-persisted characters: just deselects (returns to grid without removing). |
| **Character cards** | `<div>` interactive | Card grid | Click selects character for editing. Hover reveals delete button. |
| **"New Character" card** | `<div>` interactive | Card grid (last position) | Dashed border card. Creates a new blank character and immediately opens editor. Also serves as the empty state when no characters exist — shown alone in the grid. |
| **Delete button (per card)** | `<button>` | Card overlay (hover) | Opens `DeleteConfirmDialog`. |
| **Section collapse toggles** | `<button>` | Each trait section header | `ChevronDown` / `ChevronUp` icons. Toggles section between expanded (edit) and collapsed (summary) views. |
| **Add Extra Row** | `<button>` | Inside each section (edit mode) | `+ Add [SectionName]` — appends a new key-value extras row. |
| **Per-field AI Sparkle** | `<button>` | Next to each field label (edit mode) | `<Sparkles>` icon. Sends single field value + context to AI for enhancement. Shows `animate-pulse` while processing. |
| **Add Section** | `<button>` | Bottom of editor | `+ Add Custom Section` — appends a user-defined section with custom title and extras rows. |

---

## 4. Cards / List Items

### Character Card

```
┌──────────────────────────────┐  aspect-[2/3]
│  ┌──────────────────────────┐│  rounded-[2rem]
│  │     Cover Image          ││  border border-[#4a5f7f]
│  │     (object-cover)       ││
│  │     hover: scale-110     ││  Hover effects:
│  │     duration-700         ││    • Card: -translate-y-3
│  │                          ││    • Image: scale-110
│  │  ┌─────┐ ┌─────┐        ││    • Shadow intensifies
│  │  │Tag 1│ │Tag 2│        ││
│  │  └─────┘ └─────┘        ││  Tag badges: bg-blue-600
│  ├──────────────────────────┤│    text-[10px] rounded-full
│  │  ┌──────┐                ││
│  │  │ Main │  Character Name││  Role badge:
│  │  └──────┘                ││    Main → bg-indigo-600
│  │  Short description...    ││    Side → bg-slate-600
│  │                    [🗑️]  ││
│  └──────────────────────────┘│  Delete: visible on hover
└──────────────────────────────┘
```

- **Card container**: `aspect-[2/3] rounded-[2rem] border border-[#4a5f7f] overflow-hidden cursor-pointer`
- **Hover lift**: `group-hover:-translate-y-3 transition-all duration-500`
- **Image zoom**: `group-hover:scale-110 transition-transform duration-700`
- **Gradient overlay**: `bg-gradient-to-t from-black/90 via-black/50 to-transparent`
- **Name**: `text-xl font-black text-white`
- **Description**: `text-sm text-zinc-400 line-clamp-2`
- **Tag badges**: `bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full`
- **Role badge**: Main → `bg-indigo-600`, Side → `bg-slate-600`

### "New Character" Card

- **Style**: `border-2 border-dashed border-zinc-600 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-[2rem]`
- **Content**: Centered `Plus` icon + "New Character" text
- **Hover**: `hover:border-blue-500 hover:bg-zinc-800/80`
- **Action**: Creates new character object in local state and opens editor
- **Empty state**: When no library characters exist, this card is shown alone in the grid as the sole empty-state element

---

## 5. Modals and Overlays

| Modal | Source Component | Trigger | Purpose |
|---|---|---|---|
| **DeleteConfirmDialog** | `DeleteConfirmDialog.tsx` | Delete button on character card | Custom message: *"This will permanently delete the character from your Global Library."* Calls `executeDeleteCharacter()` on confirm. |
| **AvatarGenerationModal** | `AvatarGenerationModal.tsx` | "Generate Portrait" button in Avatar panel | AI portrait generation using selected art style. Uploads result to `avatars` storage bucket. |
| **AIPromptModal** | `AIPromptModal.tsx` | "AI Fill" or "AI Generate" header buttons | Text input for user prompt. Mode determines whether AI fills empty fields only (`fill`) or overwrites all fields (`generate`). |
| **CharacterPicker** | `CharacterPicker.tsx` | **NOT available from library tab** | Only accessible from Scenario Builder. Allows importing library characters into a scenario. |

### 5.1 Cancel Button Behavior Rules

| Scenario | Cancel Action |
|---|---|
| **New unsaved character** (created via "New Character" card, never saved) | Removes character from `library` state array and deselects. Tracked via `unsavedNewCharacterIds` Set. |
| **Existing persisted character** (loaded from DB or previously saved) | Just deselects character and returns to card grid. Character remains in library unchanged. |

### 5.2 Library Copy Mechanism (Scenario Builder → Library)

When saving a character to the library from the **Scenario Builder** (via "+ Character Library" button):

1. A **new UUID** is generated for the library copy
2. `saveCharacterCopyToLibrary()` **inserts** (not upserts) a new row with `is_library = true` and `scenario_id = null`
3. The original scenario character row is **untouched** — it keeps its original ID and `scenario_id`
4. The mapping (scenario char ID → library char ID) is stored in `characterInLibrary` state (type: `Record<string, string | boolean>`)
5. Subsequent "Update Character" clicks use the mapped library ID to update the existing library copy

This prevents the bug where saving to library would overwrite the scenario character row and remove it from the scenario.

---

## 6. Data Architecture

### Database Table

**`characters`** table filtered by `is_library = true`:

| Column | Type | Purpose |
|---|---|---|
| `id` | uuid | Primary key |
| `user_id` | uuid | Owner (auth.uid()) |
| `name` | text | Character name |
| `is_library` | boolean | `true` for library characters |
| `scenario_id` | uuid (nullable) | Always `null` for library characters |
| `avatar_url` | text | Storage URL for portrait |
| `avatar_position` | jsonb | `{x, y}` focal point for avatar cropping |
| `physical_appearance` | jsonb | 11-field object |
| `currently_wearing` | jsonb | 4-field object |
| `preferred_clothing` | jsonb | 5-field object |
| `personality` | jsonb | Trait rows with flexibility settings |
| `tone` | jsonb | Extras-only data |
| `background` | jsonb | 6-field object |
| `key_life_events` | jsonb | Extras-only data |
| `relationships` | jsonb | Extras-only data |
| `secrets` | jsonb | Extras-only data |
| `fears` | jsonb | Extras-only data |
| `goals` | jsonb | Goal objects with steps, progress, flexibility |
| `sections` | jsonb | Custom user-defined sections array |
| `tags` | text | Comma-separated tag string |
| `character_role` | text | "Main" or "Side" |
| `controlled_by` | text | "AI" or "Player" |
| `sex_type` | text | Character sex |
| `age` | text | Character age |
| `role_description` | text | Character role description |
| `nicknames` | text | Character nicknames |
| `sexual_orientation` | text | Character sexual orientation |

### Service Functions (in `supabase-data.ts`)

| Function | Purpose |
|---|---|
| `fetchCharacterLibrary()` | Queries `characters` where `is_library = true` and `user_id = auth.uid()` |
| `saveCharacterToLibrary(character)` | Upserts character with `is_library: true`, `scenario_id: null` |
| `saveCharacterCopyToLibrary(character, userId, newId)` | Inserts a new character row with a new ID, `is_library: true`, `scenario_id: null`. Used when saving from Scenario Builder to avoid overwriting the scenario character. |
| `deleteCharacterFromLibrary(id)` | Deletes character by ID |

### State Management

- **No React Query** — all library state is managed via `useState` in `Index.tsx`
- `library` state array holds all fetched library characters
- `selectedCharacterId` holds the currently-editing character ID (or `null` for grid view)
- `librarySearchQuery` filters the library array client-side into `filteredLibrary`
- `unsavedNewCharacterIds` (Set) tracks newly created characters that haven't been saved yet — used by Cancel to decide whether to remove or just deselect
- `characterInLibrary` (Record<string, string | boolean>) maps scenario character IDs to their library copy IDs
- Characters are loaded during the initial `Promise.all` boot sequence alongside scenarios, conversations, etc.
- **Optimistic updates**: Local state is updated immediately on user actions; database writes happen on explicit "Update Character"

---

## 7. Component Tree

```
Index.tsx
├── Header Bar
│   ├── ← Back Button (when character selected)
│   ├── Title: "Character Library"
│   ├── Search Input (grid view only)
│   ├── AI Fill Button (editor only)
│   ├── Cancel Button (editor only)
│   └── Update Character Button (editor only)
│
└── CharactersTab.tsx
    ├── [Grid View - no character selected]
    │   ├── Character Card × N (filtered by search)
    │   │   ├── Cover Image with zoom
    │   │   ├── Tag Badges
    │   │   ├── Role Badge (Main/Side)
    │   │   ├── Name + Description
    │   │   └── Delete Button (hover)
    │   └── "New Character" Dashed Card
    │
    └── [Editor View - character selected]
        ├── Left Column (sticky)
        │   └── Avatar / Profile Panel
        │       ├── Avatar Image with position controls
        │       ├── Generate Portrait button
        │       ├── Upload button
        │       ├── Name field
        │       ├── Age field
        │       ├── Sex field
        │       ├── Role dropdown (Main/Side)
        │       ├── Controlled By (AI/Player)
        │       ├── Role Description
        │       ├── Tags field
        │       └── Nicknames field
        │
        └── Right Column (lg:col-span-2)
            ├── CharacterEditorModalScreen.tsx
            │   ├── Section: Physical Appearance (11 fields + extras)
            │   ├── Section: Currently Wearing (4 fields + extras)
            │   ├── Section: Preferred Clothing (5 fields + extras)
            │   ├── PersonalitySection.tsx (split/unified mode)
            │   ├── Section: Tone (extras-only)
            │   ├── Section: Background (6 fields + extras)
            │   ├── Section: Key Life Events (extras-only)
            │   ├── Section: Relationships (extras-only)
            │   ├── Section: Secrets (extras-only)
            │   ├── Section: Fears (extras-only)
            │   ├── CharacterGoalsSection.tsx (goal cards)
            │   └── Custom Sections × N
            └── "+ Add Custom Section" button
```

---

## 8. Custom Events and Callbacks

| Handler | Defined In | Trigger | Behavior |
|---|---|---|---|
| `handleCreateCharacter()` | `Index.tsx` | "New Character" card click | Creates blank character object, appends to `library` state, adds ID to `unsavedNewCharacterIds`, sets as selected |
| `handleUpdateCharacter(patch)` | `Index.tsx` | Any field edit in editor | Updates character in `library` state array (optimistic, no DB write) |
| `handleDeleteCharacterFromList(id)` | `Index.tsx` | Delete button on card | Opens `DeleteConfirmDialog` with library-specific message |
| `executeDeleteCharacter()` | `Index.tsx` | Confirm in DeleteConfirmDialog | Calls `deleteCharacterFromLibrary(id)`, removes from `library` state |
| `handleSaveToLibrary()` | `Index.tsx` | "Update Character" button (library tab) or "+ Character Library" button (Scenario Builder) | In library tab: saves via `saveCharacterToLibrary()`, removes from `unsavedNewCharacterIds`. From Scenario Builder: creates a copy with new UUID via `saveCharacterCopyToLibrary()` or updates existing copy. |
| `handleCancelCharacterEdit()` | `Index.tsx` | Cancel button | For new unsaved characters (in `unsavedNewCharacterIds`): removes from `library`. For persisted characters: just deselects. |
| `handleAiFill(prompt)` | `Index.tsx` | AI Fill button → AIPromptModal submit | Sends character data + prompt to AI. Merges AI response into character fields. |
| `handleAiGenerate(prompt)` | `Index.tsx` | AI Generate option | Same as AI Fill but overwrites all fields instead of only empty ones |
| `handleAddSection(title)` | `CharacterEditorModalScreen.tsx` | "+ Add Custom Section" button | Appends new section object to character's `sections` array |
| `handleEnhanceField(fieldKey, getValue, setValue, label)` | `Index.tsx` | Per-field Sparkle button | Sends single field value + context to AI for enhancement. Updates field via `setValue` callback. |

---

## 9. Styling Reference

### Colors

| Element | Value | Usage |
|---|---|---|
| Card border | `#4a5f7f` | `border-[#4a5f7f]` on character cards |
| Section headers | `#4a5f7f` | `bg-[#4a5f7f]` on collapsible section header bars |
| Card surfaces | `#2a2a2f` | `bg-[#2a2a2f]` on section card bodies |
| Inner surfaces | `#3a3a3f/30` | `bg-[#3a3a3f]/30` on collapsed content areas |
| Field inputs | — | `bg-zinc-900/50 border-white/10` |
| Page background | `black` | `bg-black relative z-10` on the grid container (fully opaque, no bleed-through) |
| Card gradient | — | `bg-gradient-to-t from-black/90 via-black/50 to-transparent` |
| Tag badges | — | `bg-blue-600 text-white` — tags display as plain text without `#` prefix |
| Role badge (Main) | — | `bg-indigo-600 text-white` |
| Role badge (Side) | — | `bg-slate-600 text-white` |
| AI Fill button | — | Premium iridescent gradient with shimmer animation |

### Typography

| Element | Classes |
|---|---|
| Page title | `text-lg font-black text-slate-900 uppercase tracking-tight` |
| Card character name | `text-xl font-black text-white` |
| Card description | `text-sm text-zinc-400 line-clamp-2` |
| Section headers | `text-xl font-bold text-white` |
| Field labels | `text-[10px] font-bold uppercase tracking-widest text-zinc-400` |
| Tag text | `text-[10px]` |

### Border Radii

| Element | Value |
|---|---|
| Character cards | `rounded-[2rem]` |
| Section containers | `rounded-[24px]` |
| Inner content cards | `rounded-2xl` |
| Field inputs | `rounded-lg` |
| Tag badges | `rounded-full` |

---

## 10. Cross-Page Dependencies

| Page | Relationship |
|---|---|
| **Scenario Builder** | Characters can be imported from the library into a scenario via `CharacterPicker`. When saving a scenario character to the library via "+ Character Library", a **copy** is created with a new UUID — the scenario character is not affected. The mapping is tracked in `characterInLibrary` state. |
| **Chat Interface** | `character_session_states` table references character IDs. Session states are created from library characters when a conversation starts. The session state is a snapshot — changes to the library character do not retroactively update active sessions. |
| **Your Stories** | No direct link to Character Library. Both share the same boot sequence (`Promise.all` in `Index.tsx`) but operate on different data (scenarios vs. library characters). |
| **Community Gallery** | No interaction. Gallery shows published scenarios, not individual characters. |

---

## 11. Security and Access Control

| Rule | Implementation |
|---|---|
| **Row Level Security** | All `characters` table operations require `auth.uid() = user_id` |
| **Library isolation** | `is_library = true` filter on all library queries ensures only library characters are returned |
| **No cross-user visibility** | Library characters are private — no RLS policy allows viewing other users' library characters |
| **Published character visibility** | Characters attached to published scenarios (`scenario_id` referencing a published scenario) can be viewed by anyone via a separate SELECT policy. Library characters (`scenario_id = null`) never match this policy. |
| **Storage** | Avatar images stored in `avatars` bucket (public). Filename includes user ID for namespacing. |

---

## 12. Known Issues / Quirks

No known issues. All previously documented issues have been resolved.

---

## 13. Planned / Future Changes

No planned changes are currently documented for the Character Library page.

---

## Appendix: Character Editor — 11 Hardcoded Sections Detail

Each section uses the same collapsible card pattern: a `bg-[#4a5f7f]` header bar with title and toggle chevron, wrapping a `bg-[#2a2a2f] rounded-[24px]` card body.

### Section 1: Physical Appearance

| Field | Key | Type |
|---|---|---|
| Hair Color | `hair_color` | Text input |
| Eye Color | `eye_color` | Text input |
| Build | `build` | Text input |
| Body Hair | `body_hair` | Text input |
| Height | `height` | Text input |
| Breast Size | `breast_size` | Text input |
| Genitalia | `genitalia` | Text input |
| Skin Tone | `skin_tone` | Text input |
| Makeup | `makeup` | Text input |
| Body Markings | `body_markings` | Text input |
| Temporary Conditions | `temporary_conditions` | Text input |

- **Extras**: ✅ Supported — user can add custom key-value rows
- **AI Enhance**: ✅ Per-field sparkle button
- **Collapsed view**: Shows populated field values as summary text

### Section 2: Currently Wearing

| Field | Key | Type |
|---|---|---|
| Shirt / Top | `top` | Text input |
| Pants / Bottoms | `bottom` | Text input |
| Undergarments | `undergarments` | Text input |
| Miscellaneous | `miscellaneous` | Text input |

- **Extras**: ✅ Supported
- **AI Enhance**: ✅ Per-field sparkle button
- **Collapsed view**: Shows populated field values

### Section 3: Preferred Clothing

| Field | Key | Type |
|---|---|---|
| Casual | `casual` | Text input |
| Work | `work` | Text input |
| Sleep | `sleep` | Text input |
| Undergarments | `underwear` | Text input |
| Miscellaneous | `miscellaneous` | Text input |

- **Extras**: ✅ Supported
- **AI Enhance**: ✅ Per-field sparkle button
- **Collapsed view**: Shows populated field values

### Section 4: Personality

- **Component**: `PersonalitySection.tsx`
- **Mode toggle**: Split (Outward vs Inward traits) or Unified (single list)
- **Each trait**: Label + value, with a "Flexibility" slider (1-5) controlling how strictly the AI should follow the trait during roleplay
- **Collapsed view**: Trait labels listed inline

### Sections 5–10: Extras-Only Sections

These sections (Tone, Background, Key Life Events, Relationships, Secrets, Fears) each have hardcoded fields specific to their domain, plus an extensible `_extras` array for user-added key-value rows. All follow the same collapsible card pattern with AI sparkle per-field.

### Section 11: Character Goals

- **Component**: `CharacterGoalsSection.tsx`
- **Structure**: Each goal has a title, description, steps (sub-goals), progress tracking, and a flexibility slider
- **Collapsed view**: Goal titles listed with progress indicators