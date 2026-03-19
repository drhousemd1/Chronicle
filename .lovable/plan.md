
Replace the branching Story Arc system completely in the app with a duplicated linear “Story Goals” component based on `CharacterGoalsSection`, while preserving the archived Story Arc only in the style guide HTML.

1. Replace the app’s StoryGoalsSection implementation
- Rebuild `src/components/chronicle/StoryGoalsSection.tsx` as a near-direct copy of `CharacterGoalsSection.tsx`.
- Keep the same shell, collapse behavior, progress ring, slider, step list, add/remove step flow, and sparkle actions.
- Rename labels to story-specific text:
  - section title: `Story Goals`
  - add button: `Add New Story Goal`
- Remove all arc-only UI:
  - branch lanes
  - mode toggle
  - connectors
  - linked phases
  - branch status logic

2. Simplify the actual data model
- Update `src/types.ts` so `StoryGoal` becomes a plain linear goal shape like character goals:
  - `id`, `title`, `desiredOutcome`, `currentStatus?`, `steps`, `flexibility`, `createdAt`, `updatedAt`
- Delete the story-arc-specific types from app code usage:
  - `ArcStep`, `ArcBranch`, `ArcMode`, `ArcPhase`
  - `StepStatus`, `ResistanceClassification`, `ResistanceEvent`
- Keep `storyGoals` on `WorldCore`, but it should now mean simple story goals only.

3. Replace all app references that still think in “story arcs”
- Update `WorldTab.tsx`, `StoryCardView.tsx`, and any other render points to use the simplified section with the same placement as today.
- Update labels, validation text, placeholders, and error copy from “Story Arc(s)” to “Story Goal(s)”.
- Keep the style guide archive untouched, since it is isolated in `public/style-guide-component-example.html`.

4. Remove arc logic from runtime/chat behavior
- In `ChatInterfaceTab.tsx`, replace all branch/phase scanning with simple step scanning:
  - current step = first incomplete step
  - goal summary uses linear steps only
- Remove the `evaluate-arc-progress` invocation and all resistance-score/status-event update logic.
- Replace it with simple goal-step completion behavior if the current chat flow still needs progress tracking; otherwise remove the auto-evaluator entirely so runtime behavior matches the simplified model.

5. Clean prompt/context builders so they match the new structure
- Update `src/services/llm.ts` to serialize only linear story goals and steps.
- Update `src/services/character-ai.ts` to stop mentioning arc modes.
- Update `supabase/functions/generate-narrative-directive/index.ts` text from “STORY ARCS” to “STORY GOALS” and keep only simple current-step context.
- Remove or repurpose `supabase/functions/evaluate-arc-progress/index.ts` so nothing in the app depends on arc terminology or arc-only payloads anymore.

6. App-wide cleanup pass
- Search the repo for:
  - `Story Arc`
  - `Story Arcs`
  - `ArcPhase`
  - `ArcBranch`
  - `ArcMode`
  - `ArcStep`
  - `evaluate-arc-progress`
  - `linkedPhases`
  - `statusEventCounter`
  - resistance-related fields
- Remove or rename every app-facing reference so production code is clean and only reflects “Story Goals”.
- Leave the archived style-guide card intact, but do not leave stray production comments or dead references that imply the app still uses story arcs.

7. Validation/check pass
- Compare the rebuilt `StoryGoalsSection` directly against `CharacterGoalsSection` so styling, spacing, controls, and behavior match exactly except for the title/text.
- Verify the simplified `StoryGoal` shape is the only shape consumed in the app.
- Verify no app path still depends on branches/phases/resistance logic.
- Verify the style guide still preserves the old Story Arc archive independently.

Technical note
- I checked the code paths first: the current `StoryGoalsSection` is still fully arc-based, and chat/runtime logic still reads branches, linked phases, resistance scores, and calls `evaluate-arc-progress`.
- The correct implementation is not to “keep arc types around”; it is to replace the app’s Story Goals system with the duplicated linear component and then remove arc-specific production logic everywhere except the archived style-guide HTML.
