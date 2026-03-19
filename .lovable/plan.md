

# Replace Story Arcs with Story Goals — Clean Codebase

## Summary
Remove the entire Story Arc branching system and replace it with a simple "Story Goals" component cloned from CharacterGoalsSection. Clean up all arc-related code, types, and references. Archive the visual spec to the style guide for reference.

## Phase 1 — Archive to Style Guide
**File: `public/style-guide-component-example.html`**
- Add a third `.card` block titled **"Story Arcs (NO LONGER IN USE)"**
- Document the key visual specs (branching lanes, phase cards, resistance scoring, mode toggle) with a static HTML preview
- Self-contained reference — no code comments needed elsewhere

## Phase 2 — Clean Up Types
**File: `src/types.ts`**
- Delete `StepStatus`, `ResistanceClassification`, `ResistanceEvent`, `ArcStep`, `ArcBranch`, `ArcMode`, `ArcPhase` types entirely (lines 101-148)
- Simplify `StoryGoal` to match `CharacterGoal` structure:
  ```ts
  export type StoryGoal = {
    id: string;
    title: string;
    desiredOutcome: string;
    progress: number;
    steps: GoalStep[];
    flexibility: GoalFlexibility;
    createdAt: number;
    updatedAt: number;
  };
  ```

## Phase 3 — Create Simple StoryGoalsSection
**New file: `src/components/chronicle/StoryGoalsSectionSimple.tsx`**
- Clone `CharacterGoalsSection.tsx` structure exactly
- Change header from "Goals and Desires" to "Story Goals"
- Use `Target` icon instead of `GitBranch`
- Accept `StoryGoal[]` (which now matches `CharacterGoal` shape)
- Same features: collapsible, progress ring, guidance strength slider, checkbox steps, AI enhance

## Phase 4 — Replace StoryGoalsSection Everywhere
**Files: `WorldTab.tsx`, `StoryCardView.tsx`, `CharacterEditModal.tsx`**
- Replace all `import { StoryGoalsSection }` with `import { StoryGoalsSectionSimple }`
- Update component usage (props stay the same)

## Phase 5 — Simplify LLM Serialization
**File: `src/services/llm.ts` (lines 68-175)**
- Replace entire `storyGoalsContext` builder with simple format matching `characterGoalsContext`:
  - `STORY GOALS:` header, each goal with `[RIGID/NORMAL/FLEXIBLE]`, title, outcome, simple `[x]/[ ]` step list, progress %, directive
- Remove all branch/phase/resistance/recovery serialization

**File: `src/services/character-ai.ts` (line 65)**
- Change `"Story Arcs:"` to `"Story Goals:"`

**File: `supabase/functions/generate-narrative-directive/index.ts` (lines 73-76)**
- Change `"STORY ARCS:"` to `"STORY GOALS:"` and `"No story arcs defined."` to `"No story goals defined."`

## Phase 6 — Simplify Chat Evaluation
**File: `src/components/chronicle/ChatInterfaceTab.tsx`**
- **Lines 1827-1944**: Replace `evaluateArcProgress` with `evaluateGoalProgress` — simple step completion toggle (mark next pending step as completed when AI classifies "aligned"), no resistance scoring, no branches
- **Lines 3089-3105**: Simplify story goal pending step gathering — just iterate `g.steps` for pending steps, no branches/phases
- **Line 2811**: Update call from `evaluateArcProgress` to `evaluateGoalProgress`
- Remove all imports of `ArcBranch`, `ArcStep`, `ArcPhase`, `ArcMode`, `StepStatus`, `ResistanceEvent`

## Phase 7 — Rename Validation
**File: `src/utils/publish-validation.ts`**
- Rename `storyArc` → `storyGoal` in `PublishValidationErrors` interface and error message: `"At least 1 story goal with title and desired outcome is required"`

**File: `src/components/chronicle/WorldTab.tsx`**
- Update `publishErrors.storyArc` → `publishErrors.storyGoal`

## Phase 8 — Update Guidance Slider Text
**File: `src/components/chronicle/GuidanceStrengthSlider.tsx`**
- Change "primary story arc" to "primary story goal" in rigid description

## Phase 9 — Delete Arc Components
Delete these files entirely (no longer imported):
- `src/components/chronicle/StoryGoalsSection.tsx` (old complex version)
- `src/components/chronicle/arc/ArcBranchLane.tsx`
- `src/components/chronicle/arc/ArcConnectors.tsx`
- `src/components/chronicle/arc/ArcFlowConnector.tsx`
- `src/components/chronicle/arc/ArcModeToggle.tsx`
- `src/components/chronicle/arc/ArcPhaseCard.tsx`

## Phase 10 — Simplify Edge Function
**File: `supabase/functions/evaluate-arc-progress/index.ts`**
- Simplify to evaluate simple step completion (aligned → mark complete) instead of resistance scoring. Rename prompt references from "story arc" to "story goal". Remove score delta/threshold logic.

## Files Changed (Total: ~14)
All changes are clean removals or simplifications. No deprecated comments, no leftover arc references.

