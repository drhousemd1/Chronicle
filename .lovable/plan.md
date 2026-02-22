

# Scenario Builder Page -- Guide Content

## What This Does
Write the full markdown documentation for the "Scenario Builder Page (Structure Guide)" document (ID: `135ed2fb-1547-4b4f-b062-df99a625a559`) following the same 13-section structure used in all other guides. This covers the scenario/world-building side only -- the character builder will be a separate guide.

## Content Summary (based on code review)

**1. Page Overview** -- Route: `tab === "world"` in `Index.tsx`. Primary source: `WorldTab.tsx` (1270 lines). Purpose: full scenario editing interface for world-building, story arcs, scenes, art style, content themes, and publishing. Sidebar position: 6th item ("Scenario Builder" -- activates for both `world` and `characters` tabs). Entry points: sidebar click (creates new scenario if none active), clicking "Edit" on a scenario card in Your Stories, or clicking the back arrow from Character Builder. No sub-views -- single scrolling page with collapsible sections.

**2. Layout and Structure** -- Two-column layout: left sidebar (260px, `bg-[#2a2a2f]`) showing Character Roster, right main area (`flex-1 overflow-y-auto bg-slate-50/30`). Main content is `max-w-4xl mx-auto p-4 lg:p-10 pb-20 space-y-12`. Each major section is a dark card (`bg-[#2a2a2f] rounded-[24px] border border-white/10 shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)]`) with a steel blue header (`bg-[#4a5f7f]`). Header bar shows back arrow, "Scenario Builder" title, and Save / Save and Close buttons.

**3. UI Elements -- Complete Inventory**

| Element | Location | Description |
|---------|----------|-------------|
| Back Arrow | Header | Returns to Your Stories (from world tab) or to world tab (from characters tab) |
| "Save" button | Header | Shadow Surface style, 12s safety timeout, `handleSave(false)` |
| "Save and Close" button | Header | Shadow Surface style, saves then navigates to hub |
| Character Roster sidebar | Left panel | Lists Main and Side characters with avatar + name + controlledBy label |
| Add Character placeholder | Sidebar | Dashed border button, navigates to Characters tab |
| Story Card section | Main | Cover image (aspect-[2/3]) + Scenario Name + Brief Description fields |
| Cover Image actions | Story Card | Dropdown: Upload from Device, Select from Library, Generate with AI |
| Reposition / Remove buttons | Story Card | Only shown when cover image exists |
| World Core section | Main | Scenario (storyPremise) textarea, Primary Locations rows, Custom World Content sections |
| Sparkle (AI Enhance) buttons | Per field | Calls `aiEnhanceWorldField` via `world-ai.ts` |
| Add Location button | Locations | Blue text link style (`text-blue-400`) |
| Add Custom Content button | World Core | Dashed border, full width |
| Story Arcs section | Main | Goal name, desired outcome, guidance strength slider, steps with simple/advanced mode toggle |
| Opening Dialog section | Main | Textarea + HintBox + Starting Day counter + Time of Day icons (Sunrise/Day/Sunset/Night) |
| Scene Gallery section | Main | HintBox + action buttons (Upload/Library/Generate) + image grid (2-3 cols) + tag editor + starting scene star |
| Art Style Preference section | Main | Grid of style thumbnails (2-5 cols), radio-select with blue ring |
| World Codex section | Main | Dialog Formatting (read-only critical rules + editable additional rules) + Additional Entries |
| Content Themes section | Main | Tag selectors for Character Types, Story Type (SFW/NSFW), Genre, Origin, Trigger Warnings, Custom Tags |
| Share Your Story section | Main | "Publish to Gallery" button, opens ShareScenarioModal |

**4. Cards / List Items**

- **Character Roster Button**: `w-14 h-14 rounded-xl border-2 border-slate-100` avatar with name (`text-sm font-bold text-slate-800`) and controlledBy label (`text-[10px] font-black text-slate-400 uppercase`). Hover: `hover:bg-slate-50`, avatar `group-hover:scale-105`, name `group-hover:text-blue-600`.
- **Cover Image Preview**: `aspect-[2/3] rounded-2xl`, reposition mode shows crosshair + "Drag to Refocus" label + blue ring. Empty state: dashed border gradient placeholder.
- **Scene Image Tile**: `aspect-video rounded-xl border border-zinc-700 bg-zinc-800`. Bottom gradient bar shows tag count + edit (pencil) button. Hover reveals delete (rose) button and starting scene star toggle. Starting scene shows amber star + "Start" label.
- **Content Theme Tag Pill**: Selected: `bg-blue-500/20 text-blue-300 border-blue-500/30`. Unselected: `bg-zinc-800 text-zinc-400 border-zinc-700`. Custom tags have X remove button. "Add custom" uses dashed border style.

**5. Modals and Overlays**

| Modal | Trigger | Component |
|-------|---------|-----------|
| CoverImageGenerationModal | "Generate with AI" in cover actions | `CoverImageGenerationModal.tsx` |
| SceneImageGenerationModal | "Generate with AI" in scene actions | `SceneImageGenerationModal.tsx` |
| SceneTagEditorModal | Pencil icon on scene tile | `SceneTagEditorModal.tsx` |
| ShareScenarioModal | "Publish to Gallery" button | `ShareScenarioModal.tsx` |
| ImageLibraryPickerModal | "Select from Library" in cover/scene actions | `ImageLibraryPickerModal.tsx` (reused) |

Browser dialogs: `confirm()` for cover removal and scene deletion.

**6. Data Architecture**

- **Primary data type**: `ScenarioData` -- contains `world: World` (with `WorldCore`), `characters: Character[]`, `story: { openingDialog }`, `scenes: Scene[]`, `contentThemes: ContentThemes`, `uiSettings`, `selectedArtStyle`.
- **WorldCore fields**: `scenarioName`, `briefDescription`, `storyPremise`, `structuredLocations: LocationEntry[]`, `customWorldSections: WorldCustomSection[]`, `factions`, `historyTimeline`, `plotHooks`, `dialogFormatting`, `storyGoals: StoryGoal[]`.
- **Database tables**: `scenarios` (world_core jsonb, ui_settings jsonb, opening_dialog jsonb, cover_image_url, cover_image_position, selected_model, selected_art_style, title, description, tags), `characters`, `codex_entries`, `scenes`, `content_themes`.
- **Save flow**: `handleSaveWithData()` in Index.tsx calls `supabaseData.saveScenario()` which uses `Promise.all` for characters, codex, and scenes. Fire-and-forget registry refreshes after save.
- **State management**: Direct `useState` in `Index.tsx` (`activeData`, `activeId`, `activeCoverImage`, `activeCoverPosition`). No React Query.
- **Art styles**: Fetched from `art_styles` table via `ArtStylesContext`. Each style has `id`, `displayName`, `thumbnailUrl`, `backendPrompt`, `backendPromptMasculine`, `backendPromptAndrogynous`.

**7. Component Tree**

```
Index.tsx
  > header (back arrow + "Scenario Builder" + Save/Save and Close buttons)
  > WorldTab
    > aside (Character Roster sidebar)
      > CharacterButton (per character)
      > AddCharacterPlaceholder
    > main scrollable area
      > Story Card section (cover image + fields + CoverImageActionButtons)
      > World Core section (Scenario, Primary Locations, Custom World Content)
      > StoryGoalsSection
        > per goal: ArcModeToggle, GuidanceStrengthSlider, ArcBranchLane, ArcConnectors, ArcPhaseCard
      > Opening Dialog section (HintBox, textarea, day/time controls)
      > Scene Gallery section (SceneGalleryActionButtons, scene tiles)
      > Art Style Preference section (style grid)
      > World Codex section (Dialog Formatting + Additional Entries)
      > ContentThemesSection (CategorySelector per category + StoryTypeSelector + CustomTagsSection)
      > Share Your Story section (Publish button)
    > SceneTagEditorModal
    > CoverImageGenerationModal
    > SceneImageGenerationModal
    > ShareScenarioModal
```

**8. Custom Events and Callbacks**

| Callback | Purpose |
|----------|---------|
| `onUpdateWorld(world)` | Patches the world object (core + entries) |
| `updateCore(patch)` | Shorthand for patching `world.core` |
| `onUpdateOpening(patch)` | Updates opening dialog text, starting day, starting time |
| `onUpdateScenes(scenes)` | Replaces the full scenes array |
| `onUpdateCoverImage(url)` | Sets cover image URL |
| `onUpdateCoverPosition(pos)` | Sets cover image focal point `{x, y}` |
| `onUpdateArtStyle(styleId)` | Sets selected art style ID |
| `onUpdateContentThemes(themes)` | Replaces full ContentThemes object |
| `onNavigateToCharacters()` | Switches to Characters tab |
| `onSelectCharacter(id)` | Navigates to Characters tab with specific character selected |
| `handleEnhanceField(fieldName)` | AI enhancement for World Core fields via `world-ai.ts` |
| `handleCoverUpload` | File input -> resize (1024x1536, 0.85) -> upload to storage -> set URL |
| `handleAddScene` | File input -> resize (1024x768, 0.7) -> upload -> create Scene object |
| `handleDeleteScene` / `handleDeleteCover` | Browser confirm -> remove from state |

**9. Styling Reference**

- Section card shell: `bg-[#2a2a2f] rounded-[24px] border border-white/10 shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)]`
- Section header: `bg-[#4a5f7f] border-b border-white/20 px-6 py-4`
- Inner content area: `p-6 bg-[#3a3a3f]/30 rounded-2xl border border-white/5`
- Field labels: `text-[10px] font-black text-zinc-400 uppercase tracking-widest`
- Text inputs: `bg-zinc-900/50 border border-zinc-700 text-white placeholder:text-zinc-500 rounded-lg focus:ring-2 focus:ring-blue-500/20`
- AI enhance button: `text-zinc-400 hover:text-cyan-400 hover:bg-white/5`, pulsing cyan when active
- Add Location / Add Item: `text-blue-400 hover:text-blue-300` with Plus icon
- Add Custom Content / Add New Story Arc: `border-2 border-dashed border-zinc-500 text-blue-400`
- Save buttons: Shadow Surface style (`border-[hsl(var(--ui-border))] bg-[hsl(var(--ui-surface-2))] shadow-[0_10px_30px_rgba(0,0,0,0.35)]`), hover `brightness-125`, active `brightness-150 scale-95`
- Navy blue section titles (Custom World Content): `bg-[#1e293b] rounded-xl border border-white/5`
- Sidebar: `bg-[#2a2a2f]`, section headers `bg-[#4a5f7f] px-4 py-2 rounded-xl`

**10. Backend Injection / AI Prompts**

This is a critical section for the Scenario Builder -- every field ultimately feeds into the LLM system prompt:

| Field | Injection Point (in `llm.ts` system prompt) | Format |
|-------|----------------------------------------------|--------|
| `storyPremise` | `SCENARIO: {value}` | Direct text injection |
| `factions` | `FACTIONS: {value}` | Direct text injection |
| `structuredLocations` | `LOCATIONS:\n- Label: Description` per entry | Structured list, falls back to legacy `locations` text |
| `dialogFormatting` | `DIALOG FORMATTING:` -- hard-coded critical rules (quotes/asterisks/parentheses + POV rules) prepended, user's additional rules appended | Critical rules are immutable; user rules are additive |
| `customWorldSections` | `CUSTOM WORLD CONTENT:\n[Section Title]:\n- Label: Value` per item | Nested structured injection |
| `storyGoals` | `STORY DIRECTION:\n[Arc Name] (RIGID/NORMAL/FLEXIBLE)` with serialized branches, step statuses, resistance history | Complex structured injection with status tracking |
| Content Themes tags | Injected via `buildContentThemeDirectives()` from `tag-injection-registry.ts` in three tiers: Strong (Mandatory), Moderate (Emphasized), Subtle (Flavor) | See tag injection registry for per-tag directives |
| `selectedArtStyle` | Used by `generate-cover-image` and `generate-scene-image` edge functions -- the style's `backendPrompt` is sent alongside the user's prompt | Not injected into chat LLM, only image generation |
| Opening Dialog | Inserted as the first assistant message in a new conversation | Direct text, not part of system prompt |

**AI Enhancement (Sparkle buttons)**: The `world-ai.ts` service builds a structured expansion prompt for each field with field-specific instructions (max sentence counts, formatting guidance) and cross-references other filled WorldCore fields for context. Calls the `chat` edge function with `stream: false`.

**GuidanceStrengthSlider descriptions** (injected into system prompt per goal):
- **Rigid**: "PRIMARY ARC. Allow organic deviations and subplots, but always steer the narrative back... Never abandon or diminish its importance."
- **Normal**: "GUIDED. Weave in naturally... Persist through initial user resistance... Only adapt gradually if the user sustains consistent conflict."
- **Flexible**: "LIGHT GUIDANCE. If the user's inputs continue to conflict, adapt fully..."

**Story Arc step statuses** injected: `[checkmark]` succeeded, `[X]` failed, `[arrow DEVIATED]`, `[circle PERMANENTLY FAILED]`, with retry counts and resistance history.

**11. Security and Access Control**

- `scenarios` table: INSERT/UPDATE/DELETE scoped to `auth.uid() = user_id`. SELECT allows own or published scenarios.
- `characters` table: Same pattern, SELECT includes characters from published scenarios.
- `scenes`, `codex_entries`: CRUD scoped via parent scenario ownership (`EXISTS (SELECT 1 FROM scenarios WHERE ...)`).
- `content_themes`: Own scenario CRUD + public read for published scenarios.
- `art_styles`: Public read, admin-only write.
- Storage: Cover images and scene images uploaded to user-scoped paths.

**12. Known Issues / Quirks**

- Scene deletion and cover removal use browser `confirm()` (not styled modals).
- Auto-resizing textarea is duplicated in both `WorldTab.tsx` and `StoryGoalsSection.tsx` (same implementation, not extracted to shared component).
- Legacy fields kept for backward compatibility but hidden from UI: `settingOverview`, `rulesOfMagicTech`, `narrativeStyle`, `locations` (plain text -- replaced by `structuredLocations`).
- Custom World Content AI enhancement re-uses `briefDescription` field name as a hack (passes custom context via the briefDescription parameter).
- Scene image generation calls `generate-cover-image` edge function (not a separate scene-specific function) with a landscape-oriented prompt prefix.
- `handleSaveWithData` includes UUID migration logic for legacy non-UUID IDs.
- Content theme tags are stored in a separate `content_themes` table but also kept in-memory on `ScenarioData.contentThemes`.
- The Character Roster sidebar in World tab uses light theme styling (`bg-slate-50`, `text-slate-800`) for character buttons, contrasting with the dark-themed main content.

**13. Planned / Future Changes** -- None documented.

## Implementation
Single database update to write the markdown content to `guide_documents` row `135ed2fb-1547-4b4f-b062-df99a625a559`. No code file changes needed.
