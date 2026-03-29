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

# Scenario Builder Page (Structure Guide)

> **Scope**: This guide covers the world-building / scenario editing side only. The Character Builder is documented in a separate guide.

---

## 1. Page Overview

- **Route**: `tab === "world"` in `Index.tsx`
- **Primary source file**: `WorldTab.tsx` (~1270 lines)
- **Purpose**: Full scenario editing interface — world-building, story arcs, scenes, art style selection, content themes, and publishing to the community gallery.
- **Sidebar position**: 6th item ("Scenario Builder") — activates for both `world` and `characters` tabs.
- **Entry points**:
  - Sidebar click (creates a new scenario if none is currently active)
  - Clicking "Edit" on a scenario card in Your Stories
  - Clicking the back arrow from the Character Builder tab
- **Sub-views**: None — single scrolling page with collapsible sections.

---

## 2. Layout and Structure

**Two-column layout**:
- **Left sidebar** (260px, `bg-[#2a2a2f]`): Character Roster panel listing all characters attached to this scenario.
- **Right main area** (`flex-1 overflow-y-auto bg-slate-50/30`): Scrollable content area.

**Main content container**: `max-w-4xl mx-auto p-4 lg:p-10 pb-20 space-y-12`

**Section card pattern** (repeated for each major section):
- Shell: `bg-[#2a2a2f] rounded-[24px] border border-white/10 shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)]`
- Header bar: `bg-[#4a5f7f] border-b border-white/20 px-6 py-4` with white title text
- Inner content: `p-6 bg-[#3a3a3f]/30 rounded-2xl border border-white/5`

**Header bar** (above the two-column layout): Back arrow (left), "Scenario Builder" title (center), Save and Save and Close buttons (right).

---

## 3. UI Elements — Complete Inventory

| Element | Location | Description |
|---------|----------|-------------|
| Back Arrow | Header | Returns to Your Stories (from world tab) or to world tab (from characters tab) |
| "Save" button | Header | Shadow Surface style, 12-second safety timeout, calls `handleSave(false)` |
| "Save and Close" button | Header | Shadow Surface style, saves then navigates back to the hub |
| Character Roster sidebar | Left panel | Lists Main and Side characters with avatar + name + controlledBy label |
| Add Character placeholder | Sidebar bottom | Dashed border button, navigates to Characters tab |
| **Story Card section** | Main | Cover image (`aspect-[2/3]`) + Scenario Name input + Brief Description textarea |
| Cover Image actions | Story Card | Dropdown menu: Upload from Device, Select from Library, Generate with AI |
| Reposition / Remove buttons | Story Card | Only shown when a cover image exists |
| **World Core section** | Main | Scenario (`storyPremise`) textarea, Primary Locations rows, Custom World Content sections |
| Sparkle (AI Enhance) buttons | Per field | Calls `aiEnhanceWorldField` via `world-ai.ts` — see Section 10 |
| Add Location button | Locations | Blue text link style (`text-blue-400`) with Plus icon |
| Add Custom Content button | World Core | Full-width dashed border button |
| **Story Arcs section** | Main | Goal name, desired outcome, guidance strength slider, steps with simple/advanced mode toggle |
| Add New Story Arc button | Story Arcs | Dashed border style (`border-2 border-dashed border-zinc-500 text-blue-400`) |
| **Opening Dialog section** | Main | Textarea + HintBox + Starting Day counter (increment/decrement) + Time of Day icons (Sunrise/Day/Sunset/Night) + Mode dropdown (Manual/Automatic) + Time Interval dropdown (5/10/15/30/60 minutes, shown when Automatic) |
| **Scene Gallery section** | Main | HintBox + action buttons (Upload/Library/Generate) + image grid (2–3 columns) + tag editor + starting scene star |
| **Art Style Preference section** | Main | Grid of style thumbnails (2–5 columns responsive), radio-select with blue ring on active |
| **World Codex section** | Main | Dialog Formatting (read-only critical rules + editable additional rules textarea) + Additional Entries (title/body pairs) |
| **Content Themes section** | Main | Tag selectors for: Character Types, Story Type (SFW/NSFW toggle), Genre, Origin, Trigger Warnings, Custom Tags |
| **Share Your Story section** | Main | "Publish to Gallery" button, opens ShareScenarioModal |

### Publish Validation Error States

When the user clicks "Publish to Gallery", `validateForPublish()` runs and highlights invalid fields. Errors **clear live** as the user fixes them (see Section 6 for mechanism).

| Pattern | Classes | Applied To |
|---------|---------|------------|
| Invalid input border | `border-red-500 ring-2 ring-red-500` | Story Name, Story Premise, Brief Description, Opening Dialog, Story Arc Title, Desired Outcome textareas/inputs |
| Inline error text | `text-sm text-red-500 font-medium mt-1` | `<p>` below each invalid field |
| Error label color | `text-red-500` (replaces normal label color) | Field labels for invalid inputs |
| Cover image error | `border-red-500 ring-2 ring-red-500` on preview container + error text | Cover image preview area |
| Section-level error | `border-red-500` on section card shell | Story Arcs, Locations, Content Themes sections (via `hasError` prop) |
| Bottom summary panel | `bg-red-500/10 border border-red-500/30 rounded-2xl p-6` | Fixed panel listing all current errors, each wrapped in `data-publish-error` for auto-scroll |

---

## 4. Cards / List Items

### Character Roster Button
- Avatar: `w-14 h-14 rounded-xl border-2 border-slate-100`
- Name: `text-sm font-bold text-slate-800`
- ControlledBy label: `text-[10px] font-black text-slate-400 uppercase`
- Hover: `hover:bg-slate-50`, avatar `group-hover:scale-105`, name `group-hover:text-blue-600`
- Note: Uses **light theme** styling, contrasting with the dark main content area

### Cover Image Preview
- Container: `aspect-[2/3] rounded-2xl`
- Reposition mode: crosshair cursor + "Drag to Refocus" label + blue ring border
- Empty state: dashed border with gradient placeholder background

### Scene Image Tile
- Container: `aspect-video rounded-xl border border-zinc-700 bg-zinc-800`
- Bottom gradient bar: shows tag count badge + edit (pencil) icon button
- Hover state: reveals delete button (rose color) and starting scene star toggle
- Starting scene indicator: amber star icon + "Start" label

### Content Theme Tag Pill
- Selected state: `bg-blue-500/20 text-blue-300 border-blue-500/30`
- Unselected state: `bg-zinc-800 text-zinc-400 border-zinc-700`
- Custom tags: include X remove button
- "Add custom" button: dashed border style

---

## 5. Modals and Overlays

| Modal | Trigger | Component |
|-------|---------|-----------|
| CoverImageGenerationModal | "Generate with AI" in cover image actions | `CoverImageGenerationModal.tsx` |
| SceneImageGenerationModal | "Generate with AI" in scene gallery actions | `SceneImageGenerationModal.tsx` |
| SceneTagEditorModal | Pencil icon on a scene image tile | `SceneTagEditorModal.tsx` |
| ShareScenarioModal | "Publish to Gallery" button | `ShareScenarioModal.tsx` |
| ImageLibraryPickerModal | "Select from Library" in cover or scene actions | `ImageLibraryPickerModal.tsx` (reused for both contexts) |

**Styled delete dialogs**: Cover image removal and scene deletion use the `DeleteConfirmDialog` component.

---

## 6. Data Architecture

### Primary Data Type
`ScenarioData` — the in-memory representation containing:
- `world: World` (with `WorldCore` sub-object)
- `characters: Character[]`
- `story: { openingDialog }`
- `scenes: Scene[]`
- `contentThemes: ContentThemes`
- `uiSettings`
- `selectedArtStyle`

### WorldCore Fields
`scenarioName`, `briefDescription`, `storyPremise`, `structuredLocations: LocationEntry[]`, `customWorldSections: WorldCustomSection[]`, `dialogFormatting`, `storyGoals: StoryGoal[]`.

### Database Tables
- **`scenarios`**: `world_core` (jsonb), `ui_settings` (jsonb), `opening_dialog` (jsonb), `cover_image_url`, `cover_image_position`, `selected_model`, `selected_art_style`, `title`, `description`, `tags`
- **`characters`**: Linked via `scenario_id`
- **`codex_entries`**: Linked via `scenario_id` (World Codex additional entries)
- **`scenes`**: Linked via `scenario_id`, includes `image_url`, `tags[]`, `is_starting_scene`
- **`content_themes`**: Linked via `scenario_id`, stores tag arrays per category

### Save Flow
`handleSaveWithData()` in `Index.tsx` → calls `supabaseData.saveScenario()` → uses `Promise.all` for parallel saves of characters, codex entries, and scenes. Registry refreshes fire-and-forget after save.

### State Management
Direct `useState` in `Index.tsx`: `activeData`, `activeId`, `activeCoverImage`, `activeCoverPosition`. No React Query.

### Art Styles
Fetched from `art_styles` table via `ArtStylesContext`. Each style has: `id`, `displayName`, `thumbnailUrl`, `backendPrompt`, `backendPromptMasculine`, `backendPromptAndrogynous`.

### Publish Validation System

**Source file**: `src/utils/publish-validation.ts`

**Function**: `validateForPublish({ scenarioTitle, world, characters, openingDialog, contentThemes, coverImage })` → returns `PublishValidationErrors`

**Validation rules**:

| # | Field | Rule | Error key |
|---|-------|------|-----------|
| 1 | Story title | Non-empty and not `"Untitled Story"` | `storyTitle` |
| 2 | Story premise | `world.core.storyPremise` non-empty | `storyPremise` |
| 3 | Opening dialog | `openingDialog.text` non-empty | `openingDialog` |
| 4 | Tags | ≥ 5 tags across characterTypes + genres + origin + triggerWarnings + customTags (excludes storyType) | `tags` (includes live count) |
| 5 | SFW/NSFW | `contentThemes.storyType` must be `"SFW"` or `"NSFW"` | `storyType` |
| 6 | Characters | ≥ 1 character | `noCharacters` |
| 7 | Character names | Each character's name non-empty and not `"New Character"` | `characters[id]` |
| 8 | NSFW age | If NSFW, all characters with numeric age must be ≥ 18 | `characters[id]` |
| 9 | Location | ≥ 1 `structuredLocation` with both label and description filled | `location` |
| 10 | Story arc | ≥ 1 `storyGoal` with both title and desired outcome filled | `storyArc` |
| 11 | Cover image | `coverImage` URL non-empty | `coverImage` |
| 12 | Brief description | `world.core.briefDescription` non-empty | `briefDescription` |

**`PublishValidationErrors` interface**: All fields are optional strings, except `characters` which is `Record<string, string[]>` (character ID → array of error messages).

**Live re-validation**: A `useEffect` in `WorldTab.tsx` watches `[world, characters, openingDialog, contentThemes, coverImage]`. When `publishErrors` is non-empty, it re-runs `validateForPublish` on every state change, so errors clear/update in real-time (e.g., tag count updates from "currently 0" to "currently 3" as the user selects tags).

**`hasError` prop propagation**: `StoryGoalsSection` and `ContentThemesSection` receive a `hasError: boolean` prop from `WorldTab` to apply section-level `border-red-500` highlighting.

---

## 7. Component Tree

```
Index.tsx
  > header (back arrow + "Scenario Builder" + Save / Save and Close buttons)
  > WorldTab                          ← uses publish-validation.ts
    > aside (Character Roster sidebar)
      > CharacterButton (per character)
      > AddCharacterPlaceholder
    > main scrollable area
      > Story Card section
        > Cover image preview + CoverImageActionButtons
        > Scenario Name input + Brief Description textarea
      > World Core section
        > Scenario (storyPremise) textarea + AI Enhance button
        > Primary Locations (structured rows) + Add Location
        > Custom World Content sections + Add Custom Content
      > StoryGoalsSection              ← receives hasError prop
        > per goal: ArcModeToggle, GuidanceStrengthSlider, ArcBranchLane, ArcConnectors, ArcPhaseCard
      > Opening Dialog section
        > HintBox, textarea, Starting Day counter, Time of Day icons
        > Mode dropdown (Manual/Automatic), Time Interval dropdown (5/10/15/30/60 min)
      > Scene Gallery section
        > SceneGalleryActionButtons (Upload/Library/Generate)
        > Scene image tile grid
      > Art Style Preference section
        > Style thumbnail grid (radio-select)
      > World Codex section
        > Dialog Formatting (critical rules read-only + additional rules editable)
        > Additional Entries (title/body pairs)
      > ContentThemesSection           ← receives hasError prop
        > CategorySelector per category
        > StoryTypeSelector
        > CustomTagsSection
      > Share Your Story section
        > "Publish to Gallery" button
        > Publish error summary panel (conditional)
    > SceneTagEditorModal
    > CoverImageGenerationModal
    > SceneImageGenerationModal
    > ShareScenarioModal
```

---

## 8. Custom Events and Callbacks

| Callback | Purpose |
|----------|---------|
| `onUpdateWorld(world)` | Patches the world object (core + entries) |
| `updateCore(patch)` | Shorthand for patching `world.core` fields |
| `onUpdateOpening(patch)` | Updates opening dialog text, starting day, starting time |
| `onUpdateScenes(scenes)` | Replaces the full scenes array |
| `onUpdateCoverImage(url)` | Sets cover image URL |
| `onUpdateCoverPosition(pos)` | Sets cover image focal point `{x, y}` |
| `onUpdateArtStyle(styleId)` | Sets selected art style ID |
| `onUpdateContentThemes(themes)` | Replaces full ContentThemes object |
| `onNavigateToCharacters()` | Switches to Characters tab |
| `onSelectCharacter(id)` | Navigates to Characters tab with a specific character pre-selected |
| `handleEnhanceField(fieldName)` | AI enhancement for World Core fields via `world-ai.ts` |
| `handleCoverUpload` | File input → resize (1024×1536, quality 0.85) → upload to storage → set URL |
| `handleAddScene` | File input → resize (1024×768, quality 0.7) → upload → create Scene object |
| `handleDeleteScene` | Opens styled `DeleteConfirmDialog` → on confirm, removes scene from state |
| `handleDeleteCover` | Opens styled `DeleteConfirmDialog` → on confirm, clears cover image from state |
| `publishErrors` state | Set by "Publish" click via `validateForPublish()`, then live-updated by `useEffect` on every input change until all errors resolve |
| `hasError` prop | Boolean passed to `StoryGoalsSection` and `ContentThemesSection` — derived from `publishErrors.storyArc` / `publishErrors.tags` / `publishErrors.storyType` presence |

---

## 9. Styling Reference

| Element | Classes / Styles |
|---------|-----------------|
| Section card shell | `bg-[#2a2a2f] rounded-[24px] border border-white/10 shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)]` |
| Section header | `bg-[#4a5f7f] border-b border-white/20 px-6 py-4` |
| Inner content area | `p-6 bg-[#3a3a3f]/30 rounded-2xl border border-white/5` |
| Field labels | `text-[10px] font-black text-zinc-400 uppercase tracking-widest` |
| Text inputs | `bg-zinc-900/50 border border-zinc-700 text-white placeholder:text-zinc-500 rounded-lg focus:ring-2 focus:ring-blue-500/20` |
| AI enhance button | `text-zinc-400 hover:text-cyan-400 hover:bg-white/5` — pulsing cyan animation when active |
| Add Location / Add Item | `text-blue-400 hover:text-blue-300` with Plus icon |
| Add Custom Content / Add New Story Arc | `border-2 border-dashed border-zinc-500 text-blue-400` |
| Save buttons | Shadow Surface style: `border-[hsl(var(--ui-border))] bg-[hsl(var(--ui-surface-2))] shadow-[0_10px_30px_rgba(0,0,0,0.35)]`, hover `brightness-125`, active `brightness-150 scale-95` |
| Custom World Content section titles | `bg-[#1e293b] rounded-xl border border-white/5` (navy blue) |
| Sidebar | `bg-[#2a2a2f]`, section headers `bg-[#4a5f7f] px-4 py-2 rounded-xl` |

---

## 10. Backend Injection / AI Prompts

This is a **critical section** — every field in the Scenario Builder ultimately feeds into the LLM system prompt that drives chat conversations. Understanding these injection points is essential for knowing how edits here affect AI behavior.

### System Prompt Injection Map

| Field | Injection Point (in `llm.ts`) | Format |
|-------|-------------------------------|--------|
| `scenarioName` | `STORY NAME: {value}` | Direct text injection |
| `briefDescription` | `BRIEF DESCRIPTION: {value}` | Direct text injection |
| `storyPremise` | `STORY PREMISE: {value}` | Direct text injection |
| `structuredLocations` | `LOCATIONS:\n- Label: Description` per entry | Structured list |
| `dialogFormatting` | `DIALOG FORMATTING:` section | Hard-coded critical rules (quotes for speech, asterisks for actions, parentheses for thoughts, POV rules) are **prepended and immutable**; user's additional rules are **appended** |
| `customWorldSections` | `CUSTOM WORLD CONTENT:\n[Section Title]:\n- Label: Value` per item | Nested structured injection; supports both structured rows and freeform section notes |
| `storyGoals` | `STORY GOALS:\n[Goal Name] (RIGID/NORMAL/FLEXIBLE)` | Complex structured injection with desired outcome, current status, steps, and directive behavior |
| Content Themes tags | Injected via `buildContentThemeDirectives()` from `tag-injection-registry.ts` | Three tiers: **Strong** (Mandatory Content Directives), **Moderate** (Emphasized Themes), **Subtle** (Narrative Flavor) |
| `selectedArtStyle` | Used by `generate-cover-image` and `generate-scene-image` edge functions | The style's `backendPrompt` is sent alongside the user's image prompt. **Not injected into the chat LLM** — only affects image generation. |
| Opening Dialog | Inserted as the **first assistant message** in a new conversation | Direct text insertion, not part of the system prompt |

### AI Enhancement (Sparkle Buttons)

The `world-ai.ts` service powers the sparkle/enhance buttons on World Core fields:

- **How it works**: Builds a structured expansion prompt for each field with field-specific instructions (max sentence counts, formatting guidance).
- **Cross-referencing**: Automatically includes other filled WorldCore fields as context (e.g., when enhancing `storyPremise`, it includes `scenarioName` and `briefDescription` if they exist).
- **Field configurations** (from `world-ai.ts`):
  - `scenarioName`: 2–5 word evocative name (max 1 sentence)
  - `briefDescription`: 1–2 sentence hook for story card (max 2 sentences)
  - `storyPremise`: Situation + Tension + Stakes format (max 4 sentences)
  - `dialogFormatting`: Additional formatting rules (max 3 sentences)
  - `customContent`: generic enhancer for custom world rows and freeform sections
  - `worldCustomField`: targeted enhancer for a specific custom world field
  - `storyGoalOutcome`: targeted enhancer for story-goal desired outcome
  - `storyGoalStep`: targeted enhancer for individual goal steps
  - `arcPhaseOutcome`: targeted enhancer for arc/phase outcomes
- **API call**: Invokes the `chat` edge function with `stream: false` for a synchronous response.

### Guidance Strength Slider — Injected Descriptions

The `GuidanceStrengthSlider` component sets a `GoalFlexibility` value per Story Arc that gets injected into the system prompt:

- **Rigid**: "Treat the goal as the primary story arc and ultimate focus. Allow organic deviations, subplots, and temporary shifts based on user inputs, but always keep the goal in mind and steer the narrative back naturally over time through character actions, events, or motivations. Do not abandon or diminish the goal's importance, integrating it seamlessly as the story progresses toward resolution."
- **Normal**: "Steer towards the goal by weaving it in naturally when opportunities arise. Make persistent attempts to incorporate and advance it throughout the story, even in the face of initial user resistance, but allow gradual adaptation if the user's inputs show sustained and consistent conflict with the goal, treating it as a recurring influence until deviation becomes clearly dominant."
- **Flexible**: "Steer towards the goal with light guidance. Make a few subtle attempts (e.g., 2–3 opportunities) to incorporate it, but prioritize flexibility and adapt fully to story deviations if the user's inputs continue to conflict, letting the narrative evolve based on player choices."

### Story Arc Step Status Injection

Step statuses are serialized into the system prompt with visual markers:
- `[✓]` — succeeded
- `[✗]` — failed
- `[→ DEVIATED]` — deviated from plan
- `[⊘ PERMANENTLY FAILED]` — cannot be retried

Includes retry counts and resistance history per step for the AI to reason about narrative persistence.

### Content Theme Tag Injection

Tags selected in the Content Themes section are processed through `tag-injection-registry.ts`:
- Each tag maps to a specific narrative directive
- Directives are grouped into three strength tiers that affect how strongly the AI incorporates them
- **Strong (Mandatory)**: Core content directives the AI must follow
- **Moderate (Emphasized)**: Themes the AI should actively incorporate
- **Subtle (Flavor)**: Light narrative seasoning the AI may weave in naturally

---

## 11. Security and Access Control

| Resource | Policy |
|----------|--------|
| `scenarios` table | INSERT/UPDATE/DELETE scoped to `auth.uid() = user_id`. SELECT allows own scenarios OR published scenarios. |
| `characters` table | Same CRUD pattern. SELECT includes characters from published scenarios. |
| `scenes` table | All CRUD scoped via parent scenario ownership (`EXISTS (SELECT 1 FROM scenarios WHERE ...)`) |
| `codex_entries` table | Same parent-ownership pattern as scenes |
| `content_themes` table | Own scenario CRUD + public read for published scenarios |
| `art_styles` table | Public read for all authenticated users. Admin-only write. |
| Storage (covers) | Cover images uploaded to user-scoped paths in `covers` bucket |
| Storage (scenes) | Scene images uploaded to user-scoped paths in `scenes` bucket |

---

## 12. Known Issues / Quirks

- ~~**Browser dialogs**~~: ✅ **RESOLVED** — Scene deletion and cover removal now use the styled `DeleteConfirmDialog` component instead of native `confirm()` dialogs.
- ~~**Duplicated auto-resize textarea**~~: ✅ **RESOLVED** — Extracted to a shared `AutoResizeTextarea.tsx` component, imported by both `WorldTab.tsx` and `StoryGoalsSection.tsx`.
- ~~**Legacy fields**~~: ✅ **RESOLVED** — `settingOverview`, `rulesOfMagicTech`, `narrativeStyle`, and legacy world-core aliases have been removed from runtime contracts. Story Builder now uses canonical fields only.
- ~~**Custom World Content AI hack**~~: ✅ **RESOLVED** — A dedicated `customContent` field configuration was added to `world-ai.ts` with its own prompt. Custom content and Story Arc enhancement now uses `customContent` instead of hijacking `briefDescription`.
- **Scene image generation reuse**: Scene image generation in the **Scenario Builder** calls `generate-cover-image` (with a landscape prompt prefix) because `generate-scene-image` is designed for chat context (requires `recentMessages`, `characters` data). This is intentional — the builder has no dialogue context to analyze. The chat interface correctly uses `generate-scene-image`.
- **UUID migration**: `handleSaveWithData` includes UUID migration logic for legacy non-UUID character/entry IDs.
- **Dual storage for content themes**: Content theme tags are stored in a separate `content_themes` database table but also kept in-memory on `ScenarioData.contentThemes`.
- **Sidebar theme contrast**: The Character Roster sidebar uses light theme styling (`bg-slate-50`, `text-slate-800`) for character buttons, which contrasts with the dark-themed main content area.

---

### Bug Report Items (Added 2026-03-01)

- **RESOLVED — Bug #1**: `buildCharacterStateBlock()` omits empty sections — fixed, empty sections now included in system prompt. (Resolved 2026-03-01)
- **RESOLVED — Bug #4**: Wrong AI model — now uses `grok-4-1-fast-reasoning` for extraction. (Resolved 2026-03-04)
- **RESOLVED — Bug #5**: Extraction prompt lacks analytical depth — prompt rewritten with deeper analysis. (Resolved 2026-03-01)
- **RESOLVED — Bug #6**: Memory system architecture incomplete — fixed with auto-extraction, day-compression, and synopsis system. (Resolved 2026-03-01)
- **RESOLVED — Bug #7**: Previous issue resolved.
- **RESOLVED — Bug #8**: Previous issue resolved.

### Publish Validation UX Fixes (2026-03-05)

- **RESOLVED**: Publish error messages stayed red/stuck after user fixed the field. Fixed via live re-validation `useEffect` in `WorldTab.tsx`.
- **RESOLVED**: Tag count in error message showed "currently 0" even after selecting tags. Fixed by same live re-validation.
- **RESOLVED**: Cover image and brief description had no publish validation. Added as rules #11 and #12 in `validateForPublish()`.

---

## 13. Planned / Future Changes

None documented.
