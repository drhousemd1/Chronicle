
# Comprehensive Implementation Plan: Scenario Builder Restructure, Story Goals, Tag Injection, and Goal Redesign

This plan covers every change discussed across our brainstorming sessions, organized into sequential work phases. Each phase is self-contained and testable before moving to the next. I have traced every code path to ensure nothing is missed.

---

## Phase 1: Content Theme Tag Injection into LLM System Prompt

This is the most immediately impactful and self-contained change. All the data already exists -- Content Themes are stored in the database and rendered in the UI -- they just never reach the AI.

### What Changes

**New file: `src/constants/tag-injection-registry.ts`**
- A lookup map that associates every tag (from `content-themes.ts`) with its category, strength tier (Subtle/Moderate/Strong), and injection text
- Contains all entries from the brainstorming document: Character Types (8 tags), Story Types (2 tags), Genres (21 tags), Origins (4 tags), Trigger Warnings (38 tags)
- Custom tags (user-created) will have no injection text and instead get a generic lighter directive

**Modified file: `src/services/llm.ts`**
- The `getSystemInstruction()` function gains a new parameter: `contentThemes?: ContentThemes`
- A new `buildContentThemeDirectives()` function reads the scenario's selected tags, looks up each one in the registry, and builds a structured prompt injection block organized by strength tier:
  - STRONG tags: "MANDATORY CONTENT DIRECTIVES" section
  - MODERATE tags: "EMPHASIZED THEMES" section
  - SUBTLE tags: "NARRATIVE FLAVOR" section
  - Custom tags: "ADDITIONAL THEMES" section with generic handling
- This block is inserted into the system prompt between the WORLD CONTEXT and the CAST sections

**Modified file: `src/components/chronicle/ChatInterfaceTab.tsx`**
- Content Themes need to be available when building the LLM call
- The `handleSend`, `handleRegenerateMessage`, and `handleContinueConversation` functions already pass `appData` -- Content Themes need to be loaded and passed through to the LLM service
- The `buildLLMAppData()` helper (added in the previous scene-presence fix) will be extended to include `contentThemes`

**Modified file: `src/pages/Index.tsx`**
- Content Themes are already loaded for the WorldTab -- they need to be included in the `ScenarioData` or passed alongside it to the ChatInterfaceTab
- Trace: Content Themes are fetched via `supabaseData.fetchContentThemes(scenarioId)` and stored in state. They are currently only passed to `WorldTab` as a prop. They need to also be accessible in `ChatInterfaceTab`

**Modified file: `src/types.ts`**
- Add `contentThemes?: ContentThemes` to the `ScenarioData` type so it flows through naturally

### Files Affected Summary
| File | Change |
|------|--------|
| `src/constants/tag-injection-registry.ts` | New file -- complete tag-to-injection mapping |
| `src/services/llm.ts` | Add `buildContentThemeDirectives()`, inject into system prompt |
| `src/types.ts` | Add `contentThemes` to `ScenarioData` |
| `src/pages/Index.tsx` | Include content themes in scenario data passed to chat |
| `src/components/chronicle/ChatInterfaceTab.tsx` | Pass content themes through to LLM calls |

---

## Phase 2: Scenario Builder UI Restructure

These are UI-level changes to the WorldTab component with corresponding data model updates where needed.

### 2A: Story Card Container (Consolidate Cover Image + Name + Description)

**Modified file: `src/components/chronicle/WorldTab.tsx`**
- The current "Cover Image" section (lines 372-475) becomes the "Story Card" section
- The "Scenario Name" and "Brief Description" fields (currently inside World Core at lines 487-493) are moved INTO the Story Card container, below the cover image preview/controls
- The World Core section header remains, but it starts with "Story Premise" (renamed to "Scenario") instead
- The existing data model stays unchanged -- cover image uses its own props, name/description live in `world.core` -- this is purely a visual regrouping
- The steel-blue header text changes from "Cover Image" to "Story Card"

### 2B: Rename "Story Premise" to "Scenario"

**Modified file: `src/components/chronicle/WorldTab.tsx`**
- The FieldLabel at line 496 changes from "Story Premise" to "Scenario"
- The `fieldName` prop stays as `storyPremise` (no data migration needed)

**Modified file: `src/services/llm.ts`**
- Line 49: `STORY PREMISE:` changes to `SCENARIO:`
- The variable reference stays `appData.world.core.storyPremise`

**Modified file: `src/services/world-ai.ts`**
- The `FIELD_PROMPTS.storyPremise` label changes from "Story Premise" to "Scenario"
- The instruction text is updated accordingly

### 2C: Remove "Rules of Magic and Technology"

**Modified file: `src/components/chronicle/WorldTab.tsx`**
- Remove the FieldLabel and TextArea for "Rules of Magic and Technology" (lines 503-505)
- The field stays in the `WorldCore` type as dead data so existing scenarios do not break

**Modified file: `src/services/llm.ts`**
- Remove line 50: `RULES/TECH: ${appData.world.core.rulesOfMagicTech}`

**Modified file: `src/services/world-ai.ts`**
- Remove the `rulesOfMagicTech` entry from `FIELD_PROMPTS`
- Remove the reference to it in `buildPrompt()` context section

### 2D: Restructure Locations into Label + Description Rows

**Modified file: `src/types.ts`**
- Add new type: `LocationEntry = { id: string; label: string; description: string }`
- Add `structuredLocations?: LocationEntry[]` to `WorldCore`
- Keep the existing `locations: string` field for backward compatibility

**Modified file: `src/components/chronicle/WorldTab.tsx`**
- Replace the single "Primary Locations" TextArea with a structured row-based UI
- Each row has two inputs: Label (e.g., "The Lakehouse") and Description (e.g., "A secluded cabin by the lake where...")
- Two empty rows by default with ghost text placeholders
- "Add Location" button to add more rows
- Delete button on each row
- The component manages `structuredLocations` in `world.core`, falling back to parsing the legacy `locations` string if `structuredLocations` is empty

**Modified file: `src/services/llm.ts`**
- Update the LOCATIONS block in `worldContext` to format structured locations:

```text
LOCATIONS:
- The Lakehouse: A secluded cabin by the lake where...
- Downtown Office: James's workplace in the financial district...
```

- Falls back to the raw string if no structured locations exist

**Modified file: `src/services/world-ai.ts`**
- Update `FIELD_PROMPTS.locations` to reflect structured format
- Update `buildPrompt()` context to handle structured locations

**Modified file: `src/services/supabase-data.ts`**
- The `world_core` JSONB column already stores the entire WorldCore object, so structured locations will be persisted automatically as part of it -- no migration needed

### 2E: Add Custom Content Button

**Modified file: `src/types.ts`**
- Add `customWorldSections?: WorldCustomSection[]` to `WorldCore`
- Add type: `WorldCustomSection = { id: string; title: string; items: WorldCustomItem[] }`
- Add type: `WorldCustomItem = { id: string; label: string; value: string }`

**Modified file: `src/components/chronicle/WorldTab.tsx`**
- Below the existing World Core fields (after Tone and Themes), add an "Add Custom Content" button
- When clicked, it creates a new custom container with:
  - An editable title field
  - Label + Description row pairs (same pattern as Character Builder custom sections)
  - "Add Item" button within the container
  - Delete container button
- Renders all existing custom world sections with edit/delete controls

**Modified file: `src/services/llm.ts`**
- Add custom world sections to the world context in the system prompt:

```text
CUSTOM WORLD CONTENT:
[Section Title]: 
  - Label: Description
  - Label: Description
```

### Files Affected Summary (Phase 2)
| File | Change |
|------|--------|
| `src/types.ts` | Add `LocationEntry`, `WorldCustomSection`, `WorldCustomItem` types; add `structuredLocations` and `customWorldSections` to `WorldCore` |
| `src/components/chronicle/WorldTab.tsx` | Story Card consolidation, rename Story Premise, remove Rules of Magic, restructure Locations, add Custom Content |
| `src/services/llm.ts` | Rename STORY PREMISE label, remove RULES/TECH line, format structured locations, add custom world sections |
| `src/services/world-ai.ts` | Update field prompts and context building |

---

## Phase 3: Story Goals System

### 3A: Type Definitions

**Modified file: `src/types.ts`**
- Add new type: `GoalFlexibility = 'rigid' | 'normal' | 'flexible'`
- Add new type: `GoalStep = { id: string; description: string; completed: boolean; completedAt?: number }`
- Add new type: `StoryGoal = { id: string; title: string; desiredOutcome: string; currentStatus: string; steps: GoalStep[]; flexibility: GoalFlexibility; createdAt: number; updatedAt: number }`
- Add `storyGoals?: StoryGoal[]` to `WorldCore` (so it persists as part of the world data)

### 3B: Story Goals UI Component

**New file: `src/components/chronicle/StoryGoalsSection.tsx`**
- A dedicated component for the Story Goals container
- Same dark-theme styling as all other Scenario Builder containers (steel-blue header, `#2a2a2f` body)
- Each goal card includes:
  - Goal Title (input)
  - Desired Outcome (textarea)
  - Current Status Summary (textarea)
  - Flexibility Toggle: three-button toggle (Rigid / Normal / Flexible) with visual differentiation
    - Rigid: red/amber accent -- "Must pursue"
    - Normal: blue accent -- "Guide toward"
    - Flexible: green/gray accent -- "Suggest if fitting"
  - Steps section with checkboxes:
    - Each step has a checkbox, description text, and delete button
    - "Add Step" button
    - Progress ring showing `completedSteps / totalSteps * 100`
  - Delete Goal button
- "Add Story Goal" button at the bottom

### 3C: Wire Story Goals into WorldTab

**Modified file: `src/components/chronicle/WorldTab.tsx`**
- Add the StoryGoalsSection component between the existing World Core fields and the Opening Dialog section
- Pass `world.core.storyGoals` and an update handler

### 3D: Inject Story Goals into LLM System Prompt

**Modified file: `src/services/llm.ts`**
- Add a `buildStoryGoalsContext()` function that reads `appData.world.core.storyGoals` and generates prompt text
- Story goals are injected between the WORLD CONTEXT and CAST sections, organized by flexibility level:

```text
STORY GOALS (Global narrative direction for ALL characters):

[RIGID - MANDATORY] Goal: "Reach the Mountain Fortress"
  Desired Outcome: The party successfully reaches...
  Current Status: They have gathered supplies...
  Steps: [x] Leave town  [x] Cross river  [ ] Navigate forest  [ ] Reach fortress
  Progress: 50%
  DIRECTIVE: This goal is MANDATORY. The narrative must actively work toward achieving this...

[NORMAL - GUIDED] Goal: "Romance subplot"
  ...
  DIRECTIVE: This goal is a guiding objective. Actively pursue it when...

[FLEXIBLE - SUGGESTED] Goal: "Discover ancient ruins"
  ...
  DIRECTIVE: This goal is a suggestion. Consider it when it fits...
```

### Files Affected Summary (Phase 3)
| File | Change |
|------|--------|
| `src/types.ts` | Add `GoalFlexibility`, `GoalStep`, `StoryGoal` types; add `storyGoals` to `WorldCore` |
| `src/components/chronicle/StoryGoalsSection.tsx` | New component -- full Story Goals UI |
| `src/components/chronicle/WorldTab.tsx` | Wire in StoryGoalsSection |
| `src/services/llm.ts` | Add `buildStoryGoalsContext()`, inject into system prompt |

---

## Phase 4: Redesign Character Goals to Step-Based Planning

### 4A: Update Type Definitions

**Modified file: `src/types.ts`**
- Modify `CharacterGoal`:
  - Keep: `id`, `title`, `desiredOutcome`, `currentStatus`, `createdAt`, `updatedAt`
  - Add: `steps: GoalStep[]` (reuses the same `GoalStep` type from Phase 3)
  - Change: `progress` becomes a calculated value (not stored) -- OR keep it stored but auto-calculate from steps when steps exist
  - Deprecate: `milestones?: GoalMilestone[]` (keep in type for backward compatibility, stop rendering)
- The `GoalStep` type is shared between Story Goals and Character Goals

### 4B: Redesign CharacterGoalsSection Component

**Modified file: `src/components/chronicle/CharacterGoalsSection.tsx`**
- Replace the milestone timeline UI with step-based checkboxes
- Each goal now shows:
  - Goal Title (input)
  - Desired Outcome (textarea -- narrative-quality, descriptive)
  - Current Status Summary (textarea)
  - Steps section:
    - Ordered list of steps with checkboxes
    - Step description (textarea -- enforced to be descriptive, not one-liners)
    - "Add Step" button
    - Delete step button
    - Drag-to-reorder (optional, can defer)
  - Progress ring: calculated as `completedSteps / totalSteps * 100`
  - Remove the old milestone history timeline
  - Remove the progress slider (progress is now calculated)
- Both expanded (edit) and collapsed (view) modes are updated

### 4C: Update CharacterEditModal Goal Handling

**Modified file: `src/components/chronicle/CharacterEditModal.tsx`**
- The deep scan merge logic (lines 392-460) already handles goal updates
- Update the merge logic to handle the new `steps` field:
  - When the extraction service marks a step as completed, toggle its `completed` flag
  - When the extraction service proposes new steps, append them
  - When it updates `currentStatus`, apply as before

### 4D: Update Extraction Service for Step-Based Goals

**Modified file: `supabase/functions/extract-character-updates/index.ts`**
- Update `CharacterGoalData` interface to include `steps`
- Update `buildCharacterStateBlock()` to present steps to the extraction AI:

```text
[GOALS - REVIEW EACH ONE AGAINST DIALOGUE]
  Sissification:
    desired_outcome: Ashley will convince James...
    current_status: James tried on the thong...
    steps:
      [x] Step 1: Find a way to get James to try on one of Ashley's thongs
      [x] Step 2: Get James to wear Ashley's thongs permanently
      [ ] Step 3: Find a way to get James to start wearing Ashley's bras
      ...
    progress: 33% (2/6 steps)
```

- Update the extraction prompt to instruct the AI:
  - Review each step against the dialogue
  - If a step was achieved, output it as completed
  - If a new desire/goal is discovered, create a goal AND propose 5-10 narrative-quality steps (silently -- no user confirmation pop-up)
  - Steps must be descriptive (2+ sentences), not one-liners

- Update the response format to support step operations:

```json
{
  "character": "Ashley",
  "field": "goals.Sissification",
  "value": "desired_outcome: ... | current_status: ... | progress: 50 | complete_steps: 1,2,3 | new_steps: Step 7: ..."
}
```

### 4E: Update ChatInterfaceTab Goal Application Logic

**Modified file: `src/components/chronicle/ChatInterfaceTab.tsx`**
- The `applyExtractedUpdates` function (around line 1290) needs to handle the new step-based format
- When receiving `complete_steps` in the extraction response, toggle those step checkboxes
- When receiving `new_steps`, append them to the goal's steps array
- Recalculate progress from completed steps count

### 4F: Update CharactersTab (Scenario Builder Character Page)

**Modified file: `src/components/chronicle/CharactersTab.tsx`**
- The CharactersTab also renders character goals in the Scenario Builder view
- It uses `CharacterGoalsSection` component, so most changes propagate automatically
- Verify that the data flow for saving/loading goals handles the new `steps` field

### Files Affected Summary (Phase 4)
| File | Change |
|------|--------|
| `src/types.ts` | Add `steps` to `CharacterGoal`, deprecate `milestones` |
| `src/components/chronicle/CharacterGoalsSection.tsx` | Full redesign from milestone timeline to step-based checkboxes |
| `src/components/chronicle/CharacterEditModal.tsx` | Update goal merge logic for steps |
| `src/components/chronicle/ChatInterfaceTab.tsx` | Update `applyExtractedUpdates` for step-based format |
| `src/components/chronicle/CharactersTab.tsx` | Verify goals rendering with new structure |
| `supabase/functions/extract-character-updates/index.ts` | Update goal data format, extraction prompt, and response parsing |
| `src/services/llm.ts` | Include step-based goal details in character context sent to AI |

---

## Phase 5: Inject Character Goals into LLM System Prompt

Currently, character goals are tracked by the extraction service but are NOT included in the character context block sent to the narrative AI. This means the AI does not know about the goals when generating dialogue.

**Modified file: `src/services/llm.ts`**
- Update the `characterContext` builder (lines 58-69) to include goals:

```text
CHARACTER: Ashley (Female)
ROLE: Main
CONTROL: AI
LOCATION: Home - Living Room
MOOD: Playful
GOALS:
  - Sissification [Normal] (33% - Step 3 of 6): Currently working on getting James to wear bras
  - Relationship Control [Rigid] (60% - Step 6 of 10): Establishing dominance...
TAGS: ...
TRAITS: ...
```

- Add a GOAL PURSUIT rule to the INSTRUCTIONS section telling the AI to consider character goals when generating dialogue and actions

---

## Deferred Items (Not in This Plan)

These items were discussed but explicitly deferred to later phases:

1. **Trait/Kink Registry System** -- The structured database of personality traits and sub-traits (e.g., Femdom sub-categories). Deferred to when the Admin Panel is built, which will provide a UI for managing these categories without code changes.

2. **Admin Panel** -- A new page in the left navigation for managing tag injection registries, trait databases, and other configuration. This is a significant feature that warrants its own dedicated plan.

3. **Numerical Personality Scales (0-100)** -- The GPTGirlfriend-inspired system of weighted personality parameters with event-based triggers. This is a Tier 3 architectural change that requires extensive design work.

4. **Event-Based Trigger System** -- Automated personality adjustments based on significant story events (e.g., "first kiss: +5 confidence"). Related to the numerical scales, deferred together.

5. **Decay Mechanisms** -- Unused traits slowly regressing over time. Part of the numerical personality system.

6. **Contradiction Detection** -- Monitoring for inconsistencies in stored character data. Aspirational feature for a future phase.

7. **Story Goal Progress Updates via Extraction Service** -- Having the extraction service also update Story Goal progress (not just Character Goals). This can be added as a follow-up once both Story Goals and step-based Character Goals are working.

---

## Implementation Order and Rationale

```text
Phase 1 (Tag Injection)
  |-- Self-contained, high impact, no type changes affect other phases
  v
Phase 2 (UI Restructure)  
  |-- Changes WorldTab layout and types, must be done before Phase 3
  |   adds more containers to WorldTab
  v
Phase 3 (Story Goals)
  |-- Adds new containers to WorldTab and new types
  |   GoalStep type is shared with Phase 4
  v
Phase 4 (Character Goals Redesign)
  |-- Largest change, touches the most files
  |   Depends on GoalStep type from Phase 3
  v
Phase 5 (Goals in LLM Prompt)
  |-- Quick follow-up after Phase 4
  |   Ensures the AI actually sees goal data during narration
```

Each phase can be tested independently before proceeding to the next. Phase 1 can be verified by checking the system prompt output in console logs. Phases 2-3 are testable through the UI. Phase 4 requires an end-to-end test with the extraction service. Phase 5 is testable by examining the AI's narrative behavior around goals.
