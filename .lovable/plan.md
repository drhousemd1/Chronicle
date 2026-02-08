

# Plan: Story Card Layout Tweaks, Remove Tone/Themes, and Scenario Card View in Chat Modal

## 1. Story Card Layout Restructure (WorldTab.tsx)

**Remove the HintBox** from the Story Card section (the "This image appears on your story card..." hint at line 428-430).

**Rearrange to a side-by-side layout**: Instead of the current stacked layout (image on left, hint+buttons on right, then name/description below), change to:
- Left side: Cover image placeholder (keep existing `w-48 aspect-[2/3]` portrait)
- Right side (vertically stacked):
  - Upload Image + AI Generate buttons (CoverImageActionButtons) at top
  - Scenario Name field
  - Brief Description field
  - Reposition/Remove buttons (if cover exists)

This means the `mt-8 space-y-6` block (lines 476-485) moves into the right-side column next to the image, and the HintBox is deleted entirely.

**Files changed:**
- `src/components/chronicle/WorldTab.tsx` -- restructure the Story Card inner layout

---

## 2. Remove "Tone & Central Themes" Field Everywhere

The `toneThemes` field appears in 8 files. It needs to be removed from UI rendering and from LLM/AI injection, while keeping the field in the type definition as dead data for backward compatibility.

**Changes:**
- `src/components/chronicle/WorldTab.tsx` (lines 568-571) -- remove the FieldLabel and TextArea for "Tone & Central Themes"
- `src/services/llm.ts` (line 116) -- remove `TONE & THEMES: ${appData.world.core.toneThemes}` from the system prompt
- `src/services/world-ai.ts`:
  - Remove `toneThemes` from the `EnhanceableWorldFields` type union (line 5)
  - Remove the `toneThemes` entry from `FIELD_PROMPTS` (lines 44-48)
  - Remove the context reference `if (worldContext.toneThemes...)` block (lines 90-92)
- `src/services/character-ai.ts` (lines 143, 462, 568) -- remove references to `toneThemes` from `analyzeStoryType()` and world context builders
- `src/components/chronicle/CharactersTab.tsx` (line 174) -- remove `toneThemes` from `buildWorldContext()`
- `src/types.ts` -- keep `toneThemes: string` in `WorldCore` (dead data, no migration needed)
- `src/utils.ts` -- keep the normalization for backward compat
- `src/services/supabase-data.ts` -- keep default values for backward compat

---

## 3. Scenario Card View Toggle in Character Edit Modal

This is the largest change. When a user opens the CharacterEditModal during a chat session, they should be able to toggle between "Character Card" (current view) and "Scenario Card" (new view) using a pill-style toggle in the header.

### 3A. Toggle UI in Modal Header

Add a pill-style toggle bar in the `DialogHeader` (line 814-940 area), positioned to the left of the AI Update button. The toggle uses the same styling as the Gallery Hub sort filter:

```
bg-white/10 rounded-full p-1 border border-white/10
```

Two options:
- "Character Card" (active by default)
- "Scenario Card"

The active pill gets `bg-[#4a5f7f] text-white shadow-sm`, inactive gets `text-zinc-400 hover:text-zinc-200`.

### 3B. New Props for CharacterEditModal

The modal needs access to the scenario's world data to render the Scenario Card view:

```typescript
// New props added:
scenarioWorldCore?: WorldCore;           // The world core data (from session or base)
onSaveScenarioCard?: (patch: Partial<WorldCore>) => void;  // Save handler for scenario card edits
```

These are session-scoped, meaning edits to the scenario card during a chat session do NOT modify the saved base scenario. Instead, they persist in session state -- similar to how character edits work with `character_session_states`.

### 3C. Session-Scoped World Core State

In `ChatInterfaceTab.tsx`:
- Add a new state: `worldCoreSessionOverrides` (type: `Partial<WorldCore> | null`)
- Build an `effectiveWorldCore` by merging `appData.world.core` with session overrides (same pattern as character session states)
- Pass this to `CharacterEditModal` as `scenarioWorldCore`
- The `onSaveScenarioCard` callback merges the patch into `worldCoreSessionOverrides`
- The `buildLLMAppData()` function already builds from `appData` -- update it to also merge world core session overrides so the LLM sees the session-scoped scenario changes

### 3D. Scenario Card View Content

When "Scenario Card" is selected, the modal body replaces the character editing content with scenario-relevant fields, styled identically using the existing `CollapsibleSection` components:

**Sections displayed:**
1. **Scenario** -- The main scenario/premise textarea (from `worldCore.storyPremise`)
2. **Setting Overview** -- `worldCore.settingOverview`
3. **Locations** -- Structured locations (label + description rows, same UI as WorldTab)
4. **Custom World Content** -- Any custom sections the user added
5. **Story Goals** -- The `StoryGoalsSection` component (already built), showing global goals with flexibility toggles and step checkboxes

The header subtitle changes from "Changes apply only to this playthrough" to "Global scenario settings for this playthrough" when Scenario Card is active.

The AI Update button remains visible in both views (it scans dialogue regardless of which card is shown).

### 3E. Data Flow Summary

```
ChatInterfaceTab
  |-- worldCoreSessionOverrides (state)
  |-- effectiveWorldCore = merge(appData.world.core, overrides)
  |-- passes to CharacterEditModal:
  |     scenarioWorldCore={effectiveWorldCore}
  |     onSaveScenarioCard={(patch) => mergeIntoOverrides(patch)}
  |-- passes to buildLLMAppData():
  |     world.core = effectiveWorldCore (so AI sees session changes)
```

### Files Changed (Section 3)

| File | Change |
|------|--------|
| `src/components/chronicle/CharacterEditModal.tsx` | Add view toggle state, new props, conditional rendering of Character Card vs Scenario Card content |
| `src/components/chronicle/ChatInterfaceTab.tsx` | Add `worldCoreSessionOverrides` state, `effectiveWorldCore` memo, pass new props to modal, update `buildLLMAppData` |

---

## Technical Details

### WorldTab.tsx Story Card Layout (Section 1)

The inner `flex flex-col md:flex-row gap-8` block keeps the image on the left. The right column (`flex flex-col gap-4 flex-1`) loses the HintBox and gains the Scenario Name and Brief Description fields moved up from below. The `mt-8 space-y-6` wrapper (lines 476-485) is removed; those fields go directly into the right column after the action buttons.

### Tone/Themes Removal Scope (Section 2)

Full audit results:
- **WorldTab.tsx line 569**: UI render -- REMOVE
- **llm.ts line 116**: LLM prompt injection -- REMOVE
- **world-ai.ts lines 5, 44-48, 90-92**: AI enhancement config -- REMOVE from type union and FIELD_PROMPTS
- **character-ai.ts lines 143, 462, 568**: Character generation context -- REMOVE references
- **CharactersTab.tsx line 174**: World context builder -- REMOVE reference
- **types.ts line 86**: Type definition -- KEEP (dead data)
- **utils.ts lines 197, 318**: Normalization -- KEEP (backward compat)
- **supabase-data.ts lines 289, 366**: Default values -- KEEP (backward compat)

### Scenario Card Session State (Section 3)

The session overrides pattern mirrors the existing `characterSessionStates` system. The key difference is that world core session overrides are global (shared across all characters), while character session states are per-character. When a user toggles to "Scenario Card" on any character and edits, the changes persist in a single `worldCoreSessionOverrides` state object for the entire chat session.

The scenario card uses the same `CollapsibleSection` component already defined inside `CharacterEditModal.tsx`. For Story Goals, we import and render `StoryGoalsSection` directly. For structured locations, we replicate the same row-based UI pattern from `WorldTab.tsx` (label input + description textarea + delete button per row).

