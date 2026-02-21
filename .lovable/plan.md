
# Story Arc System: Detailed Breakdown and Implementation Plan

## What We're Changing

The current "Story Goals" section uses a simple linear step list with checkboxes. We're replacing the **steps area** with a branching **Story Arc** system that has fail/success paths, phase chaining, and Simple/Advanced modes. The top half of each goal card (Goal Name, Desired Outcome, Guidance Strength, Progress Ring) stays the same.

---

## Component-by-Component Breakdown

### 1. Rename: "Story Goals" becomes "Story Arcs"

- Header text changes from "Story Goals" to "Story Arcs"
- "Add Story Goal" button becomes "+ Add New Story Arc"
- This is a UI-only rename; the underlying data key `storyGoals` in `WorldCore` stays the same for backward compatibility

### 2. Type System Changes (src/types.ts)

The current `GoalStep` type is too simple for branching. We need new types:

**Current:**
```
GoalStep = { id, description, completed, completedAt? }
```

**New types needed:**

- `StepStatus`: `'pending' | 'failed' | 'succeeded'` (replaces boolean `completed`)
- `ArcStep`: `{ id, description, status: StepStatus, statusEventOrder: number, completedAt? }` -- replaces GoalStep for story arcs
- `ArcBranch`: `{ id, type: 'fail' | 'success', triggerDescription: string, steps: ArcStep[] }` -- each branch has a trigger + ordered steps
- `ArcMode`: `'simple' | 'advanced'` -- toggle per goal
- `ArcPhase`: `{ id, title, desiredOutcome, flexibility, mode: ArcMode, branches: { fail?: ArcBranch, success?: ArcBranch }, createdAt, updatedAt }` -- a linked phase card

**Modified `StoryGoal`:**
Add these fields alongside existing ones:
- `mode: ArcMode` (defaults to `'simple'`)
- `branches: { fail?: ArcBranch, success?: ArcBranch }` (the branching steps, replaces `steps` for new UI)
- `linkedPhases?: ArcPhase[]` (subsequent phases in the chain)
- `statusEventCounter: number` (global counter for ordering status events)

The old `steps: GoalStep[]` field stays for backward compatibility. Progress calculation shifts to use `branches.success.steps` instead.

### 3. Simple vs Advanced Mode Toggle

A toggle button pair appears in the Steps header row (right-aligned):

- **SIMPLE** (default): Fail path is passive. No fail steps shown, no "+ Add Step" on fail side. Fail trigger text is read-only and shows "AI will handle dynamically". Only the success path is editable.
- **ADVANCED**: Both fail and success paths are fully editable. Fail lane shows steps, "+ Add Step", and editable trigger.

This toggle exists on every goal card and every linked phase card.

### 4. Branching Steps UI (replaces current linear steps)

Below the existing Guidance Strength slider, a "Steps" section renders:

**Top split connector**: A visual line splitting from center into two lanes (CSS/SVG border drawing, purely decorative).

**Two-column layout** (side by side, ~50/50):

- **Left: Fail Path** (reddish tint, `bg-red-500/10` border)
  - Header card: "FAIL PATH" title bar with reddish background
  - "RESISTANCE TRIGGER" label + text input for describing what triggers failure
  - Recovery Step cards (numbered: "RECOVERY STEP 1", "RECOVERY STEP 2"...)
  - Each step card has: description input, FAILED button (X), SUCCEEDED button (checkmark), delete (trash)
  - "+ ADD STEP" button at bottom

- **Right: Succeed Path** (greenish tint, `bg-green-500/10` border)
  - Header card: "SUCCEED PATH" title bar with greenish background
  - "SUCCESS TRIGGER" label + text input for describing what triggers success
  - Progression Step cards (numbered: "PROGRESSION STEP 1", "PROGRESSION STEP 2"...)
  - Same controls as fail steps
  - "+ ADD STEP" button at bottom

**Bottom merge connector**: Visual line merging the two lanes back together.

### 5. Step Status Controls and Rigidity Rules

Each step has two status buttons: **Failed (X)** and **Succeeded (checkmark)**.

- Clicking a status sets `step.status` to that value and assigns the next `statusEventOrder` number
- Clicking the same status again toggles back to `pending`
- Visual states: `pending` = neutral, `failed` = red highlight on X, `succeeded` = green highlight on checkmark

**Rigidity interaction:**
- When flexibility is **Rigid**: On the **success branch**, the "Failed" button is hidden (steps can only succeed, never fail -- it's mandatory). The "Succeeded" label changes to "Completed".
- When flexibility is **Normal** or **Flexible**: Both Failed and Succeeded buttons appear on both branches.

### 6. Progress Calculation Change

Currently: `completed steps / total steps`

New formula: `succeeded success-branch steps / total success-branch steps * 100`

Only the success branch drives progress. Fail branch steps don't count toward the progress ring. If no success steps exist, progress is 0%.

### 7. Phase Chaining ("Add Next Phase")

Each goal card gets an "ADD NEXT PHASE" button (bottom-right of the card). Clicking it:
- Appends a new phase to `goal.linkedPhases[]`
- The new phase gets its own: Goal Name, Desired Outcome, Guidance Strength slider, progress ring, and its own branching steps area (with Simple/Advanced toggle)
- Phase labels appear sequentially: "PHASE 2", "PHASE 3", etc.
- A vertical connector line visually links phases

Phases within an arc are sequential (Phase 1 leads to Phase 2 leads to Phase 3). They represent progression of the same narrative arc over time.

### 8. "+ Add New Story Arc" vs "Add Next Phase"

- **"+ Add New Story Arc"**: Creates a completely separate, independent arc (a new `StoryGoal` entry). This is the existing "Add Story Goal" button, renamed.
- **"ADD NEXT PHASE"**: Extends the current arc with a linked sequential phase. This is new.

### 9. Recovery Connector Lines (decorative, deferred)

The mockup shows dashed dotted lines between fail and success branches representing branch handoffs. This is a complex SVG rendering feature that depends on step statuses and event ordering. **This should be deferred to a later iteration** since it's purely visual and the underlying status data will already be tracked.

### 10. "Completed on (Day #), (Time icon)" line

Each step card shows a hardcoded placeholder line: "Completed on (Day #), (Time icon)". This is a future feature placeholder. For now we can render it as static text that updates when a step's status changes, using the `completedAt` timestamp if available, or show it as a muted placeholder.

### 11. LLM Prompt Serialization Updates (src/services/llm.ts)

The `storyGoalsContext` builder needs to serialize the new branching structure:
- Include the current mode (simple/advanced)
- For each branch, include the trigger description and step statuses
- Include linked phases with their own branch states
- The status event ordering tells the LLM the temporal sequence of attempts
- This is what prevents repetition and keeps the AI contextually aware across calls

### 12. Data Migration / Backward Compatibility

Existing `StoryGoal` objects have `steps: GoalStep[]` (simple linear steps). When the new component loads:
- If `branches` is undefined but `steps` exists with data, migrate: map each old step into a success-branch `ArcStep` with `status: step.completed ? 'succeeded' : 'pending'`
- Set `mode` to `'simple'` by default
- This is a runtime migration, no database schema change needed (data is stored as JSONB in `world_core`)

---

## Files to Create/Modify

| File | What Changes |
|------|-------------|
| `src/types.ts` | Add `StepStatus`, `ArcStep`, `ArcBranch`, `ArcMode`, `ArcPhase` types. Extend `StoryGoal` with `mode`, `branches`, `linkedPhases`, `statusEventCounter` |
| `src/components/chronicle/StoryGoalsSection.tsx` | Major rewrite of the steps area. Rename to "Story Arcs". Add Simple/Advanced toggle, two-column branch layout, step status controls, phase chaining, rigidity-based control hiding |
| `src/services/llm.ts` | Update `storyGoalsContext` to serialize branches, triggers, step statuses, linked phases |
| `src/services/character-ai.ts` | Minor update to include branch data in AI context summary |

No database migrations needed -- story goals are stored as JSONB inside `world_core` on the `scenarios` table.

---

## What Stays the Same

- Goal Name input
- Desired Outcome textarea (with AI sparkle enhance)
- Guidance Strength slider (Rigid / Normal / Flexible)
- Progress ring (visual, just changes its calculation source)
- Delete goal button
- The overall card styling and layout proportions

## What's New

- Simple/Advanced mode toggle per goal
- Two-column fail/success branch layout replacing linear step list
- Trigger description fields (Resistance Trigger, Success Trigger)
- Step status buttons (Failed X, Succeeded checkmark) replacing simple checkboxes
- Status event ordering counter
- Phase chaining (Add Next Phase)
- Rigidity-conditional control hiding (rigid hides "Failed" on success branch)
- Runtime migration of old linear steps to success-branch steps

## Suggested Implementation Order

1. Types first (new type definitions)
2. StoryGoalsSection component rewrite (the bulk of the work)
3. LLM prompt updates
4. Testing with existing data (backward compat migration)
