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

# Shared Elements / Architecture

> **Purpose**: At-a-glance cross-reference map of components, patterns, and UI elements that appear in multiple locations. When changing a shared element, consult this document to identify every location that needs modification.

---

## Usage Kind Classification

| Kind | Meaning | Update Rule |
|------|---------|-------------|
| **Imported** | True shared component via `import`. Change the source file once. | Single change propagates automatically. |
| **Duplicated** | Copy-paste implementation. Same code exists independently in multiple files. | Must change **each location independently**. |
| **Forked** | Intentionally diverged variant. Similar but not identical. | Review when changing, may not need matching updates. |

---

## Quick-Reference Index

| Element | Canonical Owner | Locations | Usage Kinds | Risk |
|---------|----------------|-----------|-------------|------|
| AutoResizeTextarea | *(none — duplicated)* | 9 | Duplicated ×9 | 🔴 High |
| HardcodedRow / ExtraRow | *(none — duplicated)* | 2 | Duplicated ×2 | 🔴 High |
| Character Editing Fields | CharactersTab.tsx | 2 | Imported ×1, Duplicated ×1 | 🔴 High |
| CollapsibleSection | *(none — duplicated)* | 2 | Duplicated ×2 | 🟡 Medium |
| ImageLibraryPickerModal | ImageLibraryPickerModal.tsx | 6 | Imported ×6 | 🟡 Medium |
| AvatarActionButtons | AvatarActionButtons.tsx | 3 | Imported ×3 | 🟡 Medium |
| GuidanceStrengthSlider | GuidanceStrengthSlider.tsx | 3 | Imported ×3 | 🟡 Medium |
| PersonalitySection | PersonalitySection.tsx | 2 | Imported ×2 | 🟡 Medium |
| CharacterGoalsSection | CharacterGoalsSection.tsx | 2 | Imported ×2 | 🟡 Medium |
| StoryGoalsSection | StoryGoalsSection.tsx | 3 | Imported ×3 | 🟡 Medium |
| AvatarGenerationModal | AvatarGenerationModal.tsx | 2 | Imported ×2 | 🟢 Low |
| DeleteConfirmDialog | DeleteConfirmDialog.tsx | 3 | Imported ×3 | 🟢 Low |
| AIPromptModal | AIPromptModal.tsx | 1 | Imported ×1 | 🟢 Low |
| Button (UI.tsx) | chronicle/UI.tsx | 5+ | Imported | 🟢 Low |
| TextArea (UI.tsx) | chronicle/UI.tsx | 3+ | Imported | 🟢 Low |
| Arc System Components | arc/*.tsx | 4 | Imported | 🟢 Low |
| SideCharacterCard | SideCharacterCard.tsx | 1 | Imported ×1 | 🟢 Low |
| character-ai.ts | services/character-ai.ts | 2 flows | Imported | 🟡 Medium |
| world-ai.ts | services/world-ai.ts | 2 | Imported | 🟢 Low |
| llm.ts (injection) | services/llm.ts | 1 (canonical) | Imported | 🟡 Medium |

---

## Per-Element Details

---

### 🔴 AutoResizeTextarea (Duplicated — High Risk)

Identical `useEffect` + `ref` auto-resize textarea implementation copy-pasted across 9 files. No shared component exists.

| File Path | Page/Context | Usage Kind | Notes |
|-----------|-------------|------------|-------|
| `CharactersTab.tsx` | Character Builder | Duplicated | Used in all hardcoded/extra rows |
| `PersonalitySection.tsx` | Character Builder (personality sub-component) | Duplicated | Used in trait rows |
| `StoryGoalsSection.tsx` | World Tab / Scenario Card | Duplicated | Used in goal fields |
| `WorldTab.tsx` | World Builder | Duplicated | Used in world field rows |
| `CharacterEditModal.tsx` | Chat Interface popup editor | Duplicated | Used in all hardcoded/extra rows |
| `ScenarioCardView.tsx` | Scenario Card detail view | Duplicated | Used in scenario fields |
| `ArcBranchLane.tsx` | Arc system (within goals) | Duplicated | Used in branch descriptions |
| `ArcPhaseCard.tsx` | Arc system (within goals) | Duplicated | Used in phase descriptions |
| `CharacterEditorModalScreen.tsx` | Character edit form | Duplicated | Used in form fields |

**Propagation rule**: When changing the auto-resize behavior (e.g., max height, resize logic, styling), you must update **all 9 files independently**. Consider extracting to a shared component.

---

### 🔴 HardcodedRow / ExtraRow Pattern (Duplicated — High Risk)

The row layout pattern `[Label (w-2/5)] [Sparkle button] [Value textarea (flex-1)] [Lock/Delete icon (w-7)]` is independently implemented in two files.

| File Path | Page/Context | Usage Kind | Notes |
|-----------|-------------|------------|-------|
| `CharactersTab.tsx` | Character Builder (full-page editor) | Duplicated | HardcodedRow + ExtraRow inline components |
| `CharacterEditModal.tsx` | Chat Interface (popup editor) | Duplicated | Same layout, independently defined |

**Propagation rule**: When changing row layout, field styling, sparkle button behavior, or lock/delete icon placement, update **both files**. Changes include: label width ratios, sparkle button positioning, textarea styling, and icon sizing.

---

### 🔴 Character Editing Fields (Cross-Page System — High Risk)

The complete set of character trait sections exists in two parallel implementations. Any new field added to one **MUST** be added to the other.

| File Path | Page/Context | Usage Kind | Notes |
|-----------|-------------|------------|-------|
| `CharactersTab.tsx` | Character Builder (full-page) | Canonical | All 11 hardcoded sections + custom sections + goals |
| `CharacterEditModal.tsx` | Chat Interface (popup modal) | Duplicated | Mirrors all sections in collapsible format |

**Sections that must stay in sync** (11 hardcoded + custom):
1. Physical Appearance (11 hardcoded fields + extras)
2. Currently Wearing (4 fields + extras)
3. Preferred Clothing (5 fields + extras)
4. Personality (split mode toggle + traits)
5. Tone (extras only)
6. Background (6 fields + extras)
7. Key Life Events (extras only)
8. Relationships (extras only)
9. Secrets (extras only)
10. Fears (extras only)
11. Goals and Desires (goals with arc steps)
12. Custom Sections (user-created, dynamic)

**Propagation rule**: When adding/removing/renaming a character field:
1. Update `CharactersTab.tsx` (full-page editor)
2. Update `CharacterEditModal.tsx` (popup editor)
3. Update `types.ts` (TypeScript interface)
4. Update `character-ai.ts` (AI enhancement prompts in `CHARACTER_FIELD_PROMPTS`)
5. Update `llm.ts` (injection mapping for LLM system prompt)
6. Update database default values if adding a new jsonb sub-field

---

### 🟡 CollapsibleSection (Duplicated — Medium Risk)

Collapsible section pattern with chevron toggle, independently defined in two files.

| File Path | Page/Context | Usage Kind | Notes |
|-----------|-------------|------------|-------|
| `CharacterEditModal.tsx` | Chat Interface popup editor | Duplicated | Inline component definition |
| `ScenarioCardView.tsx` | Scenario Card detail view | Duplicated | Inline component definition |

**Propagation rule**: When changing collapse animation, chevron styling, or section header layout, update both files.

---

### 🟡 ImageLibraryPickerModal (Imported — Medium Risk)

Single shared component for selecting images from the user's image library. Used in 6 different contexts.

| File Path | Page/Context | Usage Kind | Notes |
|-----------|-------------|------------|-------|
| `AvatarActionButtons.tsx` | Character Builder / Chat modal | Imported | Avatar selection |
| `CoverImageActionButtons.tsx` | Scenario Builder | Imported | Cover image selection |
| `SceneGalleryActionButtons.tsx` | Scene Gallery | Imported | Scene image selection |
| `BackgroundPickerModal.tsx` | Chat Interface settings | Imported | Chat background selection |
| `SidebarThemeModal.tsx` | Sidebar customization | Imported | Sidebar background selection |
| `UploadSourceMenu.tsx` | Image upload flow | Imported | Generic image source |

**Propagation rule**: Change once in `ImageLibraryPickerModal.tsx`. All 6 consumers update automatically. However, test each context after changes since they may pass different callbacks or expect different behaviors.

---

### 🟡 AvatarActionButtons (Imported — Medium Risk)

Dropdown menu with Upload/Library/Generate options for avatar management.

| File Path | Page/Context | Usage Kind | Notes |
|-----------|-------------|------------|-------|
| `CharactersTab.tsx` | Character Builder (full-page) | Imported | Character avatar management |
| `CharacterEditModal.tsx` | Chat Interface (popup editor) | Imported | Character avatar in modal |
| `PublicProfileTab.tsx` | Account Settings | Imported | User profile avatar |

**Propagation rule**: Change once in `AvatarActionButtons.tsx`. Test in all 3 contexts — profile avatar has different upload path than character avatars.

---

### 🟡 GuidanceStrengthSlider (Imported — Medium Risk)

Slider component for setting AI guidance strength on goals/arcs.

| File Path | Page/Context | Usage Kind | Notes |
|-----------|-------------|------------|-------|
| `CharacterGoalsSection.tsx` | Character Builder goals | Imported | Per-goal guidance |
| `StoryGoalsSection.tsx` | World Builder goals | Imported | Per-story-goal guidance |
| `ArcPhaseCard.tsx` | Arc system phase cards | Imported | Per-phase guidance |

**Propagation rule**: Change once in `GuidanceStrengthSlider.tsx`. All 3 consumers update automatically.

---

### 🟡 PersonalitySection (Imported — Medium Risk)

Component for managing personality traits with split mode (standard/outward+inward).

| File Path | Page/Context | Usage Kind | Notes |
|-----------|-------------|------------|-------|
| `CharactersTab.tsx` | Character Builder (full-page) | Imported | Full-width rendering |
| `CharacterEditModal.tsx` | Chat Interface (popup editor) | Imported | Compact rendering in modal |

**Propagation rule**: Change once in `PersonalitySection.tsx`. Both contexts receive same component.

---

### 🟡 CharacterGoalsSection (Imported — Medium Risk)

Component for managing character goals with arc steps and guidance sliders.

| File Path | Page/Context | Usage Kind | Notes |
|-----------|-------------|------------|-------|
| `CharactersTab.tsx` | Character Builder (full-page) | Imported | Character-level goals |
| `CharacterEditModal.tsx` | Chat Interface (popup editor) | Imported | Same goals in modal context |

**Propagation rule**: Change once in `CharacterGoalsSection.tsx`.

---

### 🟡 StoryGoalsSection (Imported — Medium Risk)

Component for managing story-level goals with arc system integration.

| File Path | Page/Context | Usage Kind | Notes |
|-----------|-------------|------------|-------|
| `WorldTab.tsx` | World Builder | Imported | Story goals in world context |
| `CharacterEditModal.tsx` | Chat Interface (Scenario Card view) | Imported | Story goals in modal |
| `ScenarioCardView.tsx` | Scenario Card detail | Imported | Story goals on scenario card |

**Propagation rule**: Change once in `StoryGoalsSection.tsx`.

---

### 🟢 AvatarGenerationModal (Imported — Low Risk)

Modal for AI-powered avatar generation with art style selection.

| File Path | Page/Context | Usage Kind | Notes |
|-----------|-------------|------------|-------|
| `CharactersTab.tsx` | Character Builder | Imported | Character avatar generation |
| `PublicProfileTab.tsx` | Account Settings | Imported | Profile avatar generation |

**Propagation rule**: Change once in `AvatarGenerationModal.tsx`.

---

### 🟢 DeleteConfirmDialog (Imported — Low Risk)

Reusable confirmation dialog for delete actions.

| File Path | Page/Context | Usage Kind | Notes |
|-----------|-------------|------------|-------|
| `Index.tsx` | Character deletion flow | Imported | Character delete confirmation |
| `ImageLibraryTab.tsx` | Image Library | Imported | Image/folder delete confirmation |
| `ReviewModal.tsx` | Review system | Imported | Review delete confirmation |

**Propagation rule**: Change once in `DeleteConfirmDialog.tsx`.

---

### 🟢 AIPromptModal (Imported — Low Risk)

Modal for entering AI guidance prompts, used by both AI Fill and AI Generate flows.

| File Path | Page/Context | Usage Kind | Notes |
|-----------|-------------|------------|-------|
| `Index.tsx` | Character Builder header | Imported | Serves both AI Fill and AI Generate via `mode` prop |

**Propagation rule**: Change once in `AIPromptModal.tsx`. Single consumer but dual-mode behavior.

---

### 🟢 UI Primitives (chronicle/UI.tsx)

Custom Button and TextArea components distinct from shadcn equivalents.

| Component | Consumers | Notes |
|-----------|-----------|-------|
| `Button` | CharactersTab, ChatInterfaceTab, PublicProfileTab, WorldTab, and others | Custom variants: primary, secondary, danger, ghost, brand, outlineDark, gradient |
| `TextArea` | CharactersTab, ChatInterfaceTab | Has `autoResize` prop (but most files use their own duplicated AutoResizeTextarea instead) |
| `Input` | CharactersTab, WorldTab | Custom styled input |
| `Card`, `Label`, `SectionTitle`, `Avatar` | Various chronicle components | Layout primitives |

**⚠️ Important**: `Button` from `chronicle/UI.tsx` is **different** from `@/components/ui/button` (shadcn). Do not confuse them. The chronicle Button has custom variants (`brand`, `outlineDark`, `gradient`) not available in shadcn.

---

### 🟢 Arc System Components (Imported — Low Risk)

Properly shared via imports within the arc subsystem.

| Component | File | Imported By |
|-----------|------|-------------|
| `ArcModeToggle` | `arc/ArcModeToggle.tsx` | StoryGoalsSection, ArcPhaseCard |
| `ArcBranchLane` | `arc/ArcBranchLane.tsx` | ArcPhaseCard |
| `ArcConnectors` | `arc/ArcConnectors.tsx` | ArcPhaseCard |
| `ArcPhaseCard` | `arc/ArcPhaseCard.tsx` | StoryGoalsSection |
| `ArcFlowConnector` | `arc/ArcFlowConnector.tsx` | StoryGoalsSection |

**Propagation rule**: Self-contained system. Changes propagate via imports.

---

## Shared Services / Backend Logic

### character-ai.ts (Medium Risk)

| Export | Used By | Purpose |
|--------|---------|---------|
| `buildFullContext()` | Sparkle enhancement, AI Fill, AI Generate | Builds complete world + all-characters context |
| `buildCharacterSelfContext()` | Sparkle enhancement, AI Fill, AI Generate | Builds single-character context |
| `aiEnhanceCharacterField()` | CharactersTab, CharacterEditModal (via sparkle buttons) | Per-field AI enhancement |
| `aiFillCharacter()` | Index.tsx (via AIPromptModal) | Fill empty character fields |
| `aiGenerateCharacter()` | Index.tsx (via AIPromptModal) | Generate character + create themed sections |
| `CHARACTER_FIELD_PROMPTS` | Internal | Field-specific AI instructions — must be updated when adding new fields |

**Propagation rule**: When adding a new character field, add its entry to `CHARACTER_FIELD_PROMPTS` for sparkle support, and ensure `buildCharacterSelfContext()` includes it.

---

### llm.ts (Medium Risk)

Single canonical source for injecting character and world data into LLM system prompts.

**Propagation rule**: When adding a new character field:
1. Add the field to the character injection block in `llm.ts`
2. Define the injection format (e.g., `FIELD_NAME: {value}`)
3. Handle both hardcoded fields and `_extras` arrays if applicable

---

### world-ai.ts (Low Risk)

| Export | Used By | Purpose |
|--------|---------|---------|
| `aiEnhanceWorldField()` | WorldTab, ScenarioCardView | Per-field AI enhancement for world fields |

**Propagation rule**: Change once. Single canonical source.

---

## Global Propagation Checklist

When adding a **new character field**:
- [ ] `types.ts` — add to Character interface and relevant sub-type
- [ ] `CharactersTab.tsx` — add HardcodedRow or section
- [ ] `CharacterEditModal.tsx` — add matching row in popup editor
- [ ] `character-ai.ts` — add to `CHARACTER_FIELD_PROMPTS` for sparkle support
- [ ] `llm.ts` — add injection mapping for LLM system prompt
- [ ] Database — add default value to `characters` table jsonb column if needed

When adding a **new world field**:
- [ ] `types.ts` — add to WorldCore interface
- [ ] `WorldTab.tsx` — add row in world builder
- [ ] `world-ai.ts` — add to AI enhancement prompts
- [ ] `llm.ts` — add injection mapping

When adding a **new image picker context**:
- [ ] Wire `ImageLibraryPickerModal` with appropriate `onSelect` callback
- [ ] Test folder browsing and image selection in the new context

When modifying **AutoResizeTextarea** behavior:
- [ ] Update all 9 files listed above (or extract to shared component first)

---

### 🟢 SideCharacterCard (Imported — Low Risk)

Component for displaying AI-generated side characters with adaptive theming.

| File Path | Page/Context | Usage Kind | Notes |
|-----------|-------------|------------|-------|
| `ChatInterfaceTab.tsx` | Chat Interface sidebar | Imported | Receives `isDarkBg={!sidebarBgIsLight}` for adaptive frosted glass styling |

**Propagation rule**: Change once in `SideCharacterCard.tsx`. The `isDarkBg` prop controls all adaptive styling (card bg, text color, avatar fallback, menu buttons, dropdown theme).

---

## Known Issues from Bug Report (Added 2026-03-01)

- **ACTIVE — Bug #2**: `personality.traits` missing from TRACKABLE FIELDS constant in extraction logic — only `outward` and `inward` personality sub-fields are tracked. The top-level `traits` array is never extracted or updated.
- **ACTIVE — Bug #3**: `preferredClothing` field name mismatch — the UI and database use `preferred_clothing` (snake_case) but the extraction prompt references `preferredClothing` (camelCase). This inconsistency means extracted clothing preference updates may silently fail to apply.

> Last updated: 2026-03-06 — Added SideCharacterCard with `isDarkBg` adaptive theming prop.