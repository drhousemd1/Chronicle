
# Implementation Plan: Phases 2-5 (Continuing from Completed Phase 1)

Phase 1 (Content Theme Tag Injection) is complete. This plan covers the remaining four phases in sequence.

---

## Phase 2: Scenario Builder UI Restructure

### 2A: Story Card Container
**File: `src/components/chronicle/WorldTab.tsx`**
- Rename the "Cover Image" section header (line 377) from "Cover Image" to "Story Card"
- Move the "Scenario Name" field (lines 487-489) and "Brief Description" field (lines 491-493) from inside the World Core section into the Cover Image/Story Card section, placing them below the cover image controls (after line 470, before the closing divs)
- The World Core section now starts directly with "Scenario" (formerly Story Premise)

### 2B: Rename "Story Premise" to "Scenario"
**File: `src/components/chronicle/WorldTab.tsx`**
- Line 496: Change FieldLabel from "Story Premise" to "Scenario" (fieldName prop stays `storyPremise`)

**File: `src/services/llm.ts`**
- Line 50: Change `STORY PREMISE:` to `SCENARIO:`

**File: `src/services/world-ai.ts`**
- Line 16-19: Update `FIELD_PROMPTS.storyPremise` label from "Story Premise" to "Scenario" and update instruction text accordingly

### 2C: Remove "Rules of Magic and Technology"
**File: `src/components/chronicle/WorldTab.tsx`**
- Remove lines 503-505 (the FieldLabel and TextArea for "Rules of Magic & Technology")
- Keep the field in the `WorldCore` type as dead data for backward compatibility

**File: `src/services/llm.ts`**
- Remove line 51: `RULES/TECH: ${appData.world.core.rulesOfMagicTech}`

**File: `src/services/world-ai.ts`**
- Remove the `rulesOfMagicTech` entry from `FIELD_PROMPTS` (lines 26-30)
- Remove the context reference in `buildPrompt()` (lines 95-97)

### 2D: Structured Locations
**File: `src/types.ts`**
- Add type: `LocationEntry = { id: string; label: string; description: string }`
- Add `structuredLocations?: LocationEntry[]` to `WorldCore`
- Keep existing `locations: string` field for backward compatibility

**File: `src/components/chronicle/WorldTab.tsx`**
- Replace the single "Primary Locations" TextArea (lines 507-509) with a structured row-based UI:
  - Each row: Label input (1/3 width) + Description AutoResizeTextarea (2/3 width) + Delete button
  - Two empty rows by default with ghost text placeholders
  - "Add Location" button below
- Manage `structuredLocations` in `world.core`, fall back to legacy `locations` string if empty

**File: `src/services/llm.ts`**
- Update the LOCATIONS line in `worldContext` to format structured locations as `- Label: Description` entries
- Fall back to raw string if no structured locations exist

**File: `src/services/world-ai.ts`**
- Update `FIELD_PROMPTS.locations` to reflect the new structured format

### 2E: Custom Content Sections
**File: `src/types.ts`**
- Add types: `WorldCustomSection = { id: string; title: string; items: WorldCustomItem[] }` and `WorldCustomItem = { id: string; label: string; value: string }`
- Add `customWorldSections?: WorldCustomSection[]` to `WorldCore`

**File: `src/components/chronicle/WorldTab.tsx`**
- After the Tone and Themes field (line 514), add:
  - Render existing custom world sections as collapsible containers with editable title, label+description rows, and delete controls
  - "Add Custom Content" button (elongated dark button style, matching the existing pattern from CharactersTab)

**File: `src/services/llm.ts`**
- Add custom world sections to the world context block in the system prompt

---

## Phase 3: Story Goals System

### 3A: Type Definitions
**File: `src/types.ts`**
- Add: `GoalFlexibility = 'rigid' | 'normal' | 'flexible'`
- Add: `GoalStep = { id: string; description: string; completed: boolean; completedAt?: number }`
- Add: `StoryGoal = { id: string; title: string; desiredOutcome: string; currentStatus: string; steps: GoalStep[]; flexibility: GoalFlexibility; createdAt: number; updatedAt: number }`
- Add `storyGoals?: StoryGoal[]` to `WorldCore`

### 3B: Story Goals UI Component
**New file: `src/components/chronicle/StoryGoalsSection.tsx`**
- Dark-theme container matching all other Scenario Builder sections (steel-blue `#4a5f7f` header, `#2a2a2f` body)
- Each goal card includes:
  - Goal Title (input)
  - Desired Outcome (textarea)
  - Current Status Summary (textarea)
  - Flexibility Toggle: three-button segmented control (Rigid / Normal / Flexible)
    - Rigid: red/amber accent -- "Must pursue"
    - Normal: blue accent -- "Guide toward"
    - Flexible: green/gray accent -- "Suggest if fitting"
  - Steps section with checkboxes, description text, delete button per step
  - "Add Step" button
  - Progress ring: `completedSteps / totalSteps * 100`
  - Delete Goal button
- "Add Story Goal" button at the bottom of the section

### 3C: Wire into WorldTab
**File: `src/components/chronicle/WorldTab.tsx`**
- Import and render `StoryGoalsSection` between the World Core section and the Opening Dialog section
- Pass `world.core.storyGoals` and an update handler that patches `world.core`

### 3D: Inject into LLM System Prompt
**File: `src/services/llm.ts`**
- Add `buildStoryGoalsContext()` function
- Insert between WORLD CONTEXT and CODEX, organized by flexibility level with directives:
  - RIGID: "This goal is MANDATORY. The narrative must actively work toward achieving this."
  - NORMAL: "This goal is a guiding objective. Actively pursue it when natural."
  - FLEXIBLE: "This goal is a suggestion. Consider it when it fits naturally."

---

## Phase 4: Redesign Character Goals to Step-Based Planning

### 4A: Update Type Definitions
**File: `src/types.ts`**
- Add `steps?: GoalStep[]` to `CharacterGoal` (reuses `GoalStep` from Phase 3)
- Keep `milestones?: GoalMilestone[]` for backward compatibility (stop rendering)
- Keep `progress` stored but auto-calculate from steps when steps exist

### 4B: Redesign CharacterGoalsSection
**File: `src/components/chronicle/CharacterGoalsSection.tsx`**
- Full redesign replacing the milestone timeline with step-based checkboxes:
  - Goal Title (input)
  - Desired Outcome (textarea)
  - Current Status Summary (textarea)
  - Steps section: ordered list with checkboxes, description textarea, delete button, "Add Step" button
  - Progress ring: calculated as `completedSteps / totalSteps * 100` (replaces the manual slider)
  - Remove the milestone history timeline UI entirely
  - Remove the progress slider
- Both collapsed and expanded views updated
- Note: This component is shared between CharactersTab and CharacterEditModal, so changes propagate automatically

### 4C: Update CharacterEditModal Goal Merge Logic
**File: `src/components/chronicle/CharacterEditModal.tsx`**
- Update the deep scan merge logic (around lines 412-460) to handle the new step-based format:
  - Parse `complete_steps` from extraction response to toggle step checkboxes
  - Parse `new_steps` to append new steps to goals
  - Recalculate progress from completed steps count

### 4D: Update Extraction Service
**File: `supabase/functions/extract-character-updates/index.ts`**
- Update `CharacterGoalData` interface to include `steps`
- Update `buildCharacterStateBlock()` to present steps with checkbox notation:
  ```
  [x] Step 1: Description...
  [ ] Step 2: Description...
  ```
- Update the extraction prompt to instruct the AI to:
  - Review each step against dialogue and mark completed ones
  - Silently propose 5-10 narrative-quality steps (2+ sentences each) for new goals
  - No confirmation pop-ups -- updates apply directly
- Update the response format: `"complete_steps: 1,2,3 | new_steps: Step 7: Description..."` appended to the goal value string

### 4E: Update ChatInterfaceTab Goal Application
**File: `src/components/chronicle/ChatInterfaceTab.tsx`**
- Update `applyExtractedUpdates` (around lines 1328-1390) to handle:
  - `complete_steps` field in goal value string: toggle matching step checkboxes to completed
  - `new_steps` field: parse and append new GoalStep objects
  - Recalculate progress from completed/total steps ratio

### 4F: Verify CharactersTab
**File: `src/components/chronicle/CharactersTab.tsx`**
- Uses `CharacterGoalsSection` component, so most changes propagate automatically
- Verify that goal saving/loading handles the new `steps` field without issues

---

## Phase 5: Inject Character Goals into LLM System Prompt

**File: `src/services/llm.ts`**
- Update the `characterContext` builder (lines 59-70) to include goals for each character:
  ```
  GOALS:
    - GoalTitle [Flexibility] (Progress% - Step X of Y): Current status summary
  ```
- Add a GOAL PURSUIT rule to the INSTRUCTIONS section telling the AI to consider character goals when generating dialogue and actions
- Characters with goals should actively pursue them in narration

---

## Files Changed Summary (All Phases)

| File | Phases | Changes |
|------|--------|---------|
| `src/types.ts` | 2, 3, 4 | Add LocationEntry, WorldCustomSection, WorldCustomItem, GoalFlexibility, GoalStep, StoryGoal types; update WorldCore and CharacterGoal |
| `src/components/chronicle/WorldTab.tsx` | 2, 3 | Story Card consolidation, rename Story Premise, remove Rules of Magic, structured Locations, Custom Content, wire in StoryGoalsSection |
| `src/services/llm.ts` | 2, 3, 4, 5 | Rename STORY PREMISE, remove RULES/TECH, structured locations, custom world sections, story goals injection, character goals injection |
| `src/services/world-ai.ts` | 2 | Update field prompts and context building |
| `src/components/chronicle/StoryGoalsSection.tsx` | 3 | New component -- Story Goals UI |
| `src/components/chronicle/CharacterGoalsSection.tsx` | 4 | Full redesign from milestones to step-based checkboxes |
| `src/components/chronicle/CharacterEditModal.tsx` | 4 | Update goal merge logic for steps |
| `src/components/chronicle/ChatInterfaceTab.tsx` | 4 | Update applyExtractedUpdates for step-based format |
| `src/components/chronicle/CharactersTab.tsx` | 4 | Verify goals rendering with new structure |
| `supabase/functions/extract-character-updates/index.ts` | 4 | Update goal data format, extraction prompt, response parsing |

## Deferred Items (Not in This Implementation)
1. Trait/Kink Registry System (pending Admin Panel)
2. Admin Panel (separate future plan)
3. Numerical Personality Scales (0-100)
4. Event-Based Trigger System
5. Decay Mechanisms
6. Contradiction Detection
7. Story Goal Progress Updates via Extraction Service
