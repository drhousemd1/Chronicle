

# Fill Out Character Library Page (Structure Guide)

## Overview

Write the full documentation for the "Character Library Page (Structure Guide)" document (ID: `195a779c-58e5-43a7-a460-33406955589a`) in the `guide_documents` table. The markdown content will follow the exact same 13-section structure used by the Community Gallery and Your Stories guides.

## Document Content

The guide will be saved as markdown to the existing `guide_documents` row via a database update. The content covers all aspects of the Character Library page based on thorough code review.

### Section Breakdown

**1. Page Overview** -- Route (`tab === "library"` inside `Index.tsx`), primary source files (`Index.tsx` + `CharactersTab.tsx`), purpose (global reusable character repository independent of any scenario), user role access (any authenticated user), sidebar position (3rd item, "Character Library"), entry points (sidebar click, programmatic navigation).

**2. Layout and Structure** -- Two distinct views: Card Grid (no character selected) and Character Editor (character selected). Card grid uses responsive `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8` with `p-10 bg-black`. Editor uses a 2-column layout (`lg:grid-cols-3`) with left column for Avatar/Profile panel (sticky) and right column (`lg:col-span-2`) for 11 hardcoded trait sections plus custom sections. Header shows back arrow (when character selected), title, and action buttons (AI Fill, Save, Cancel, Character Library button).

**3. UI Elements -- Complete Inventory** -- Full table of all interactive elements: title heading, back button, AI Fill button (premium iridescent gradient style), Save button, Cancel button, Update Character button, character cards, "New Character" dashed card, delete confirm dialog, AI Prompt Modal.

**4. Cards / List Items** -- Character card breakdown: `aspect-[2/3]`, `rounded-[2rem]`, `border border-[#4a5f7f]`, hover lift (`-translate-y-3`), cover image zoom (`scale-110 duration-700`), gradient overlay, tag badges (`bg-blue-600`), role badge (Main: `bg-indigo-600`, Side: `bg-slate-600`), name, description, delete button on hover. "New Character" card: dashed border, `bg-gradient-to-br from-zinc-800 to-zinc-900`, plus icon.

**5. Modals and Overlays** -- DeleteConfirmDialog (custom message for library: "This will permanently delete the character from your Global Library."), AvatarGenerationModal (AI portrait generation), AIPromptModal (prompt input for AI Fill/Generate), CharacterPicker (NOT available from library tab -- only from Scenario Builder).

**6. Data Architecture** -- `characters` table with `is_library = true` filter. Functions: `fetchCharacterLibrary()`, `saveCharacterToLibrary()`, `deleteCharacterFromLibrary()`. No React Query -- direct state management via `useState`. RLS: all CRUD operations scoped to `auth.uid() = user_id`. Library characters are loaded during initial `Promise.all` boot sequence. Character updates are optimistic (local state only until explicit Save).

**7. Component Tree** -- Full tree showing `Index.tsx > header (back, title, action buttons) > CharactersTab > Card Grid OR Editor (Avatar panel + 11 HardcodedSections + PersonalitySection + CharacterGoalsSection + Custom Sections)`.

**8. Custom Events and Callbacks** -- `handleCreateCharacter()`, `handleUpdateCharacter()`, `handleDeleteCharacterFromList()` / `executeDeleteCharacter()`, `handleSaveCharacter()`, `handleSaveToLibrary()`, `handleCancelCharacterEdit()`, `handleAiFill()`, `handleAiGenerate()`, `handleAddSection()`, `handleEnhanceField()` (per-field AI sparkle).

**9. Styling Reference** -- Key colors (card border `#4a5f7f`, section headers `#4a5f7f`, card surfaces `#2a2a2f`, inner surfaces `#3a3a3f/30`, field inputs `bg-zinc-900/50 border-white/10`), typography (card title `text-xl font-black`, section headers `text-xl font-bold text-white`, field labels `text-[10px] font-bold uppercase tracking-widest`), radii (`rounded-[2rem]` cards, `rounded-[24px]` sections, `rounded-2xl` inner cards).

**10. Cross-Page Dependencies** -- Scenario Builder (import from library via CharacterPicker), Chat Interface (character session states reference library characters), Your Stories (no direct link but shared data boot).

**11. Security and Access Control** -- All `characters` table operations scoped to `auth.uid() = user_id`. `is_library = true` filter ensures library queries only return library characters. No cross-user visibility for library characters.

**12. Known Issues / Quirks** -- Cancel button on new character removes it from library state (intentional for unsaved characters but could confuse users). No search/filter on the library grid. Save button in header saves to DB then deselects character (navigates back to grid). Empty state text says "Select import a character" (minor grammar issue). Light-theme heading text (`text-slate-900`) on dark background in editor view.

**13. Planned / Future Changes** -- No planned changes documented.

### Character Editor -- 11 Hardcoded Sections Detail

Each section documented with its fields, collapsed view behavior, extras support, and AI enhance capability:

1. **Physical Appearance** -- 11 fields (Hair Color, Eye Color, Build, Body Hair, Height, Breast Size, Genitalia, Skin Tone, Makeup, Body Markings, Temporary Conditions) + extras + AI per-field
2. **Currently Wearing** -- 4 fields (Shirt/Top, Pants/Bottoms, Undergarments, Miscellaneous) + extras + AI
3. **Preferred Clothing** -- 5 fields (Casual, Work, Sleep, Undergarments, Miscellaneous) + extras + AI
4. **Personality** -- `PersonalitySection` component, split/unified mode, trait rows with flexibility toggle (Rigid/Normal/Flexible), outward vs inward traits
5. **Tone** -- Extras-only section (no hardcoded fields), user adds rows
6. **Background** -- 6 fields (Job/Occupation, Education Level, Residence, Hobbies, Financial Status, Motivation) + extras + AI
7. **Key Life Events** -- Extras-only section
8. **Relationships** -- Extras-only section
9. **Secrets** -- Extras-only section
10. **Fears** -- Extras-only section
11. **Character Goals** -- `CharacterGoalsSection` component, goal cards with steps, progress tracking, guidance strength slider, flexibility setting

## Implementation

Single database update to write the markdown content to the existing `guide_documents` row with ID `195a779c-58e5-43a7-a460-33406955589a`. No code file changes needed.

