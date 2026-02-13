

# Master Plan Document: Version 6 (Final)
# Character Builder and Scenario Builder Overhaul

This is the complete, implementation-ready plan. All terminology is unified. No summaries or simplifications.

---

## PHASE 1: UI Cleanup ✅ COMPLETED

### #6: Remove "Setting Overview" -- FULL REMOVAL

**Current state:**
- `WorldTab.tsx` renders a "Setting Overview" labeled textarea
- `llm.ts` line 134 injects `SETTING OVERVIEW: ${appData.world.core.settingOverview}` into the LLM prompt
- `types.ts` line 97 defines `settingOverview: string` on the `WorldCore` type

**Changes:**
- Remove the Setting Overview label and textarea from `WorldTab.tsx`
- Remove line 134 (`SETTING OVERVIEW: ${appData.world.core.settingOverview}`) from `llm.ts`
- Remove `settingOverview: string` from `WorldCore` in `types.ts` (line 97)
- Increase Scenario textarea default to `rows={8}`

---

### #7: Remove "Narrative Style" -- FULL REMOVAL

**Current state:**
- `WorldTab.tsx` renders a "Narrative Style" labeled textarea
- `llm.ts` line 139 injects `NARRATIVE STYLE: ${appData.world.core.narrativeStyle}` into the LLM prompt
- `types.ts` line 105 defines `narrativeStyle: string` on the `WorldCore` type

**Changes:**
- Remove the Narrative Style label and textarea from `WorldTab.tsx`
- Remove `NARRATIVE STYLE: ${appData.world.core.narrativeStyle}` from `llm.ts` (line 139)
- Remove `narrativeStyle: string` from `WorldCore` in `types.ts` (line 105)
- Keep Dialog Formatting and Additional Formatting Rules as-is

---

### #2: Rename "Character Goals" to "Goals and Desires"

**Current state:**
- `CharacterGoalsSection.tsx` header reads "Character Goals"
- `StoryGoalsSection.tsx` header reads "Story Goals"
- `extract-character-updates` edge function already has a `DESIRES AND PREFERENCES AS GOALS` rule but the section name mismatch may confuse the AI
- Both goal components use standard shadcn `Input` and `Textarea` which do not auto-resize

**Changes:**
- Rename header in `CharacterGoalsSection.tsx`: "Character Goals" becomes "Goals and Desires"
- Rename header in `StoryGoalsSection.tsx`: "Story Goals" becomes "Story Goals and Desires" (for consistency)
- Update `extract-character-updates` prompt to add: "The goals section is labeled 'Goals and Desires'. Treat 'desires', 'wants', 'preferences', 'kinks', and 'fantasies' as synonymous with goals. Route all such content into existing goals, not new sections."
- Replace standard shadcn `Input` and `Textarea` in both `CharacterGoalsSection.tsx` and `StoryGoalsSection.tsx` with auto-resizing textareas (same `AutoResizeTextarea` pattern used in `CharactersTab.tsx` and `PersonalitySection.tsx`)

---

### #4: Custom Section Alignment on Scenario Builder

**Current state:**
- Custom world content sections in `WorldTab.tsx` are wrapped in `bg-blue-900/40 rounded-2xl border border-white/5 p-5` which adds extra padding that misaligns content with hard-coded sections above
- The heading inside uses `text-white font-bold text-lg` which differs visually from hard-coded section subheadings (`text-[10px] font-black text-zinc-400 uppercase tracking-widest`)

**Changes:**
- Remove the navy blue wrapper (`bg-blue-900/40 p-5 rounded-2xl border`) from custom sections
- Add a thin left-border accent (`border-l-2 border-blue-500/30`) for visual distinction between user-created and system sections
- Style the custom section heading to match hard-coded labels: `text-[10px] font-black text-zinc-400 uppercase tracking-widest`
- The heading remains editable but styled to match hard-coded labels visually
- Content rows render at the same indentation level as Primary Locations rows
- Keep the delete button for the section, positioned inline with the heading

---

## PHASE 2: Prompt Engineering (Static Rules + Defaulted Bracket Injection)

### #3: Goal Guidance Strength -- Add Directives to Character Goals

**Current state:**
- Story goals (`llm.ts` lines 69-92) have BOTH a tag (`[RIGID - MANDATORY]`) AND a directive sentence. They are fully implemented.
- Character goals (`llm.ts` lines 95-112) have ONLY a tag (`[RIGID]`) with NO directive text. They are missing the guidance entirely.
- The global GOAL PURSUIT rule at line 523 provides only a vague one-liner.

**Changes to character goals (lines 95-112):**
Add directive text after each character goal, matching the agreed middle-ground wording:

- Rigid: "PRIMARY ARC. Allow organic deviations and subplots, but always steer the narrative back toward this goal through character actions, events, or motivations. Never abandon or diminish its importance."
- Normal: "GUIDED. Weave in naturally when opportunities arise. Persist through initial user resistance by making repeated attempts. Only adapt gradually if the user sustains consistent conflict over multiple exchanges."
- Flexible: "LIGHT GUIDANCE. If the user's inputs continue to conflict, adapt fully and let the narrative evolve based on player choices."

Note: "Make 2-3 subtle attempts" has been removed from Flexible because the scoring system (Phase 4) will handle attempt tracking numerically. The AI should not be counting attempts.

**Changes to story goals (lines 71-74):**
Replace the existing directive text with the same agreed middle-ground wording above, so both story goals and character goals use identical directive language.

**Changes to GOAL PURSUIT rule (line 523):**
Update to reference the directives: "AI-controlled characters should actively consider and pursue their defined GOALS when generating dialogue and actions. Follow the directive attached to each goal for guidance on how persistently to pursue it."

---

### #5: Personality Trait Adherence -- Static Rules + Bracket Injection

**Current state:**
- Personality traits are injected at `llm.ts` lines 116-131 with tags like `[RIGID]`, `[NORMAL]`, `[FLEXIBLE]`
- There is NO explanation anywhere in the prompt of what these tags mean for personality
- The AI is left to guess how to interpret them

**Change 1: Add global PERSONALITY TRAIT ADHERENCE rule (near line 523, after GOAL PURSUIT)**

```
PERSONALITY TRAIT ADHERENCE:
  - [RIGID] traits are core and enduring. Express consistently in behavior,
    dialogue, and thoughts even as the character evolves. For INWARD traits,
    maintain as undertone (e.g., self-doubt amid growing confidence). For
    OUTWARD traits, show through actions/dialogue. Do not abandon unless
    the user explicitly updates the character sheet.
  - [NORMAL] traits should be expressed reliably but allow context-driven
    softening. Persist through initial story shifts; gradually ease only if
    the user sustains a conflicting direction over multiple exchanges.
  - [FLEXIBLE] traits are guidelines for initial behavior. Adapt after
    sustained user resistance. Allow full evolution if the scene demands.
  - When OUTWARD and INWARD traits conflict, honor BOTH: show outward
    behavior through actions/dialogue while weaving inward feelings through
    thoughts and internal reactions.
  - Weight expression by influence level: Primary traits shape most
    responses; Subtle ones appear sparingly. Balance across all traits
    for natural, varied behavior.
  - Interpret based on outcomes: Successful manifestation reinforces
    traits, even amid in-character resistance; only outright prevention
    reduces influence.
```

**Change 2: Replace current trait injection format (lines 116-131)**

Currently each trait is injected as:
```
  - [RIGID] Shy and reserved: "description..."
```

Replace with the unified bracket format. In Phase 2 (before the scoring system exists), scores are defaulted from the level:
- Rigid = 100 (maps to Primary Influence bracket)
- Normal = 75 (maps to Strong Influence bracket)
- Flexible = 75 (maps to Strong Influence bracket)

The code computes the bracket from the score and generates one line per trait:

```
  TraitLabel [Level, Score% - BracketName]: BracketGuidance
```

**The bracket lookup table (stored as a code-side config object in `llm.ts`, never sent to the API):**

| Score Range | Bracket Name | Guidance Text |
|---|---|---|
| 90-100% | Primary Influence | Drives actions, dialogue, thoughts consistently. Express prominently in every relevant moment. |
| 70-89% | Strong Influence | Regular integration; frequent expression balanced with other traits. |
| 40-69% | Moderate Influence | Occasional influence; appears when fitting without overriding scenes. |
| 20-39% | Subtle Influence | Rare undertones; minimal impact. Hints or internal conflicts only if immersive. |
| 0-19% | Minimal/Remove | TRAIT at drop-off threshold. Ignore in responses; system will remove from sheet. |

**Example injection for a 3-trait character (split mode) in Phase 2 with defaulted scores:**

```
OUTWARD PERSONALITY:
  Dominant [Rigid, 100% - Primary Influence]: Drives actions, dialogue, thoughts consistently. Express prominently in every relevant moment.
  Confident [Normal, 75% - Strong Influence]: Regular integration; frequent expression balanced with other traits.

INWARD PERSONALITY:
  Self-conscious [Flexible, 75% - Strong Influence]: Regular integration; frequent expression balanced with other traits.
```

**Example of the same character after Phase 4 scoring has been running and "Self-conscious" has been rejected multiple times:**

```
OUTWARD PERSONALITY:
  Dominant [Rigid, 100% - Primary Influence]: Drives actions, dialogue, thoughts consistently. Express prominently in every relevant moment.
  Confident [Normal, 72% - Strong Influence]: Regular integration; frequent expression balanced with other traits.

INWARD PERSONALITY:
  Self-conscious [Flexible, 30% - Subtle Influence]: Rare undertones; minimal impact. Hints or internal conflicts only if immersive.
```

The format is identical in Phase 2 and Phase 4. Only the numbers change. Zero format transition between phases.

---

## PHASE 3: Structural Refactor

### #1: Row Layout for Hard-Coded Containers

**Current state:**
- Physical Appearance, Currently Wearing, and Preferred Clothing use `HardcodedInput` in `CharactersTab.tsx` (lines 94-131), which renders a label above the input in a stacked layout
- Users cannot add custom rows to these sections

**New layout (matching custom category row style):**

```text
[Hair Color     ] [sparkle] [value field                    ]
[Eye Color      ] [sparkle] [value field                    ]
[Build          ] [sparkle] [value field                    ]
... (all system rows - labels are read-only)
[user label     ]           [user value                     ] [X]
[+ Add Row]
```

**Design:**
- System rows: Label text is hard-coded and non-editable (displayed in a styled box). The value field is editable. The sparkle (AI generation) button is present.
- User-added rows: Both label and value are editable, with an X delete button. These use the same row layout.
- System rows cannot be deleted.

**Data storage (no migration needed):**
Store user-added extras as an `_extras` key inside the existing JSONB columns. Example for `physical_appearance`:
```json
{
  "hairColor": "Brown",
  "eyeColor": "Blue",
  "_extras": [
    { "id": "ext_1", "label": "Freckles", "value": "Light across nose" }
  ]
}
```

**Type changes (`src/types.ts`):**
```typescript
export type CharacterExtraRow = {
  id: string;
  label: string;
  value: string;
};
```
Add optional `_extras?: CharacterExtraRow[]` to `PhysicalAppearance`, `CurrentlyWearing`, and `PreferredClothing` types. These are optional so existing data loads without errors.

**Files affected:**
- `src/types.ts` -- add `CharacterExtraRow` type, add `_extras` to appearance/clothing types
- `src/components/chronicle/CharactersTab.tsx` -- create reusable row layout component, replace `HardcodedInput` usage
- `src/components/chronicle/CharacterEditModal.tsx` -- same row layout for the chat modal
- `src/services/llm.ts` -- include extras in character context when building the prompt
- `supabase/functions/extract-character-updates/index.ts` -- add extras to TRACKABLE FIELDS so the AI knows it can write to them
- `src/services/supabase-data.ts` -- ensure extras are saved/loaded correctly

**Empty field handling (already correct):**
`llm.ts` lines 83-86 and `extract-character-updates` lines 74-76 both use `.filter(([_, v]) => v)` which skips empty strings. A male character with empty `breastSize` does NOT waste tokens. No change needed.

---

## PHASE 4: Dynamic Scoring System

### The Scoring Table (code-side only, never sent to API)

```text
Level      Starting  Boost on    Drop on     Neutral   Adapt
           Score     Alignment   Rejection   Decay     Threshold
---------------------------------------------------------------
Rigid      100%      +0          0           0         None
Normal     75%       +3          -1          0         20%
Flexible   75%       +5          -5          0         20%
```

**Design rationale:**
- Normal and Flexible start at the same score (75%) because Flexible is not less important than Normal -- it is just more adaptable. The user took the time to add the trait, so it starts with equal weight.
- Neutral decay is 0 for ALL levels. Traits do not passively erode. They only change on active alignment or rejection signals. This prevents scenarios where off-topic chat or in-character resistance (that is part of the RP dynamic) slowly undermines traits the user intentionally set.
- Normal drops very slowly (-1 per rejection): approximately 55 clear rejections to reach 20% threshold. Genuinely persistent.
- Flexible drops faster (-5 per rejection): approximately 11 clear rejections to reach threshold. Quick pivot but not instant.
- Normal builds slowly (+3 on alignment): gradual reinforcement over time.
- Flexible rebounds fast (+5 on alignment): if user changes their mind, trait recovers quickly.
- Rigid never changes. Always 100%. Always Primary Influence.

### Impact Bracket Table (code-side only, used to generate injected text)

```text
Score Range    Bracket Name           Guidance Text Injected Per Trait
-------------------------------------------------------------------
90-100%        Primary Influence      Drives actions, dialogue, thoughts
                                      consistently. Express prominently
                                      in every relevant moment.

70-89%         Strong Influence       Regular integration; frequent
                                      expression balanced with other
                                      traits.

40-69%         Moderate Influence     Occasional influence; appears when
                                      fitting without overriding scenes.

20-39%         Subtle Influence       Rare undertones; minimal impact.
                                      Hints or internal conflicts only
                                      if immersive.

0-19%          Minimal/Remove         TRAIT at drop-off threshold. Ignore
                                      in responses; system will remove
                                      from sheet.
```

### Code Implementation of Bracket Lookup

In `llm.ts`, stored as a config object:

```typescript
const traitImpactMap = {
  'Primary Influence':  { min: 90, max: 100, desc: 'Drives actions, dialogue, thoughts consistently. Express prominently in every relevant moment.' },
  'Strong Influence':   { min: 70, max: 89,  desc: 'Regular integration; frequent expression balanced with other traits.' },
  'Moderate Influence': { min: 40, max: 69,  desc: 'Occasional influence; appears when fitting without overriding scenes.' },
  'Subtle Influence':   { min: 20, max: 39,  desc: 'Rare undertones; minimal impact. Hints or internal conflicts only if immersive.' },
  'Minimal/Remove':     { min: 0,  max: 19,  desc: 'TRAIT at drop-off threshold. Ignore in responses; system will remove from sheet.' }
};

function getTraitGuidance(traitLabel: string, level: string, score: number): string {
  // Rigid is always locked at 100% / Primary Influence
  if (level === 'Rigid') {
    return `${traitLabel} [Rigid, 100% - Primary Influence]: Drives actions, dialogue, thoughts consistently. Express prominently in every relevant moment.`;
  }
  // Find bracket based on score
  const bracket = Object.entries(traitImpactMap).find(
    ([_, range]) => score >= range.min && score <= range.max
  );
  const bracketName = bracket ? bracket[0] : 'Moderate Influence';
  const bracketDesc = bracket ? bracket[1].desc : traitImpactMap['Moderate Influence'].desc;
  return `${traitLabel} [${level}, ${score}% - ${bracketName}]: ${bracketDesc}`;
}
```

This function is called per trait when building the prompt. The AI only ever sees the computed one-liner output. The table, the scoring logic, the bracket lookup -- all stay in code.

### Outcome-Based Classification

The new `evaluate-adherence` edge function classifies each exchange based on narrative outcome, not surface-level tone or resistance signals.

**Classification rules (injected into the evaluate-adherence function's prompt):**

- **ALIGN**: The user's input allows the trait or goal to manifest or complete. The action succeeds, even if the user's character shows hesitation, reluctance, nervousness, or in-character resistance. If the outcome advances the trait's expression, it counts as alignment.
  - Example: "I'm nervous, but I let you lead" -- ALIGN (action completed, dominance expressed)
  - Example: User's character submits reluctantly while role-playing resistance -- ALIGN (the dominant trait manifested successfully)

- **REJECT**: The user outright prevents, counters, or redirects away from the trait or goal. The action does NOT complete. The user's character takes control in a way that directly contradicts the trait's expression.
  - Example: "No, I take control instead" -- REJECT (dominance was blocked)
  - Example: User's character physically stops the action and reverses the dynamic -- REJECT

- **NEUTRAL**: The message does not involve or reference the trait or goal at all. Off-topic conversation, worldbuilding, unrelated character interaction. Score does NOT change (0 adjustment).
  - Example: "Let's talk about something else" -- NEUTRAL (trait not engaged)
  - Example: Characters discussing the weather -- NEUTRAL for a dominance trait

**Confidence handling:** The function outputs a confidence level (high, medium, low) alongside each classification. Only high-confidence classifications trigger score adjustments. Low and medium confidence default to neutral (no change, no decay). This prevents misclassification from affecting scores while preserving the no-decay principle.

### New Edge Function: evaluate-adherence

**Why a separate function (not added to extract-character-updates):**
The `extract-character-updates` prompt is already ~300 lines handling 3 mandatory phases (scan, review, placeholder detection), goal lifecycle tracking, section management, and field volatility rules. Adding alignment classification to it risks degrading quality on all existing tasks. A separate function:
- Has a focused, short prompt: "Did the user align with, reject, or show neutrality toward each of these traits and goals?"
- Uses a fast, cheap model (e.g., `gemini-2.5-flash-lite`)
- Runs in parallel with `extract-character-updates` (no added latency to the user)
- Can fail silently without breaking character updates
- Is easy to tune independently

**Input:** The latest user message, the latest AI response, and a list of active traits and goals with their current scores and levels.

**Output:**
```json
{
  "adjustments": [
    {
      "character": "Sarah",
      "type": "trait",
      "name": "Self-conscious",
      "classification": "reject",
      "confidence": "high",
      "reason": "User's character confidently took charge"
    },
    {
      "character": "Sarah",
      "type": "goal",
      "name": "Become more dominant",
      "classification": "align",
      "confidence": "high",
      "reason": "Character initiated dominant behavior"
    }
  ]
}
```

The client receives this, applies the scoring table adjustments for high-confidence classifications only, recalculates impact brackets, and updates DB scores.

### Auto-Removal with Grace Period

When a trait's score drops below 20% (Minimal/Remove bracket):
- Code increments a `removalGraceCount` counter stored per trait in DB
- Only after 3 consecutive exchanges where the score remains below 20% does the code auto-remove the trait from the character's personality array in DB
- Next prompt build simply omits the removed trait
- If the score rebounds above 20% before the grace period completes (e.g., via alignment boosts), the counter resets to 0

This is handled entirely in code. No AI involvement needed for removal.

**Rebound after removal:** If a trait is auto-removed and the user wants it back, they re-add it manually. The system does not auto-revive removed traits.

### Applying Scoring to Goals

Same scoring table, same impact brackets, same classification logic. Goals additionally have steps and progress percentages. The adherence score modulates HOW ACTIVELY the AI pursues the goal, while steps track WHERE the goal is in its journey.

Example goal injection:
```
[GUIDED, adherence: 65% - Moderate Influence] Become more dominant
  (Progress: 40%, Step 3 of 6)
  Desired Outcome: "Establish a femdom dynamic"
  Moderate Influence: Occasional pursuit; weave in when natural opportunities arise.
```

Once scoring is active, the static Flexible directive ("If the user's inputs continue to conflict, adapt fully") gets replaced by the score-driven bracket guidance. The backend code handles this mapping -- the AI does not count attempts.

### End-to-End Flow

```text
Step 1: User sends message
           |
Step 2: Main LLM generates response (using current scores in prompt)
           |
Step 3: extract-character-updates runs (existing function)
         Updates mood, location, clothing, goals, sections
           |       (runs in parallel)
Step 4: evaluate-adherence runs (NEW edge function)
         For each trait and goal with scoring enabled:
           - Classify exchange as: align / reject / neutral
           - Output classification + confidence + reason
         Uses a fast/cheap model (e.g., gemini-2.5-flash-lite)
           |
Step 5: Client receives both results
         - Applies scoring table adjustments for high-confidence
           classifications only
         - Recalculates impact brackets
         - Checks grace period for any traits below 20%
         - Updates DB scores
           |
Step 6: Next user message triggers prompt build in llm.ts
         Code reads updated scores from DB
         Calls getTraitGuidance() per trait
         Generates bracket-based injection strings
         AI sees only the computed one-liners
```

If `evaluate-adherence` fails, scores simply do not update for that exchange. No impact on the main conversation.

### Type Changes Required (`src/types.ts`)

Add `adherenceScore` and `removalGraceCount` to `PersonalityTrait`:

```typescript
export type PersonalityTrait = {
  id: string;
  label: string;
  value: string;
  flexibility: PersonalityTraitFlexibility;
  adherenceScore?: number;      // 0-100, defaults based on flexibility level
  removalGraceCount?: number;   // consecutive exchanges below 20%
};
```

Add `adherenceScore` and `removalGraceCount` to `CharacterGoal`:

```typescript
export type CharacterGoal = {
  id: string;
  title: string;
  desiredOutcome: string;
  currentStatus?: string;       // Deprecated
  progress: number;
  flexibility?: GoalFlexibility;
  adherenceScore?: number;      // 0-100, defaults based on flexibility level
  removalGraceCount?: number;   // consecutive exchanges below 20%
  milestones?: GoalMilestone[]; // Deprecated
  steps?: GoalStep[];
  createdAt: number;
  updatedAt: number;
};
```

These are optional fields with sensible defaults, so existing data loads without errors. When `adherenceScore` is undefined, the code defaults it from the level: Rigid = 100, Normal = 75, Flexible = 75.

---

## IMPLEMENTATION ORDER

```text
Phase 1 (Low risk, ready now):
  #6: Remove Setting Overview (full removal from UI, types, prompt)
  #7: Remove Narrative Style (full removal from UI, types, prompt)
  #2: Rename "Goals and Desires", fix auto-resize in goal components
  #4: Fix custom section alignment on Scenario Builder

Phase 2 (Prompt engineering, no scoring yet):
  #3: Add goal directive text (middle-ground wording) to both
      story goals and character goals in llm.ts
  #5: Add PERSONALITY TRAIT ADHERENCE global rule to llm.ts
      Replace current trait injection with bracket format
      using defaulted scores (Rigid=100, Normal=75, Flexible=75)

Phase 3 (Structural refactor):
  #1: Row layout for Physical Appearance, Currently Wearing,
      Preferred Clothing + extras support via _extras key

Phase 4 (Scoring system):
  Step A: Add adherenceScore + removalGraceCount to
          PersonalityTrait and CharacterGoal types
  Step B: Create evaluate-adherence edge function
          (outcome-based classification, no neutral decay)
  Step C: Add scoring config (traitImpactMap) + getTraitGuidance()
          function to llm.ts
  Step D: Wire up client to call evaluate-adherence after each
          exchange (parallel with extract-character-updates)
          in character-ai.ts
  Step E: Update prompt injection to use getTraitGuidance() output
          instead of defaulted scores
  Step F: Add auto-removal logic with 3-exchange grace period
  Step G: Test with personality traits over long sessions
  Step H: Expand scoring to goals after personality validation
```

---

## FILES AFFECTED (Complete List)

| File | Phase | Changes |
|------|-------|---------|
| `src/components/chronicle/WorldTab.tsx` | 1 | Remove Setting Overview textarea and label. Remove Narrative Style textarea and label. Increase Scenario textarea to rows=8. Remove navy wrapper from custom sections, add left-border accent, match heading typography. |
| `src/services/llm.ts` | 1, 2, 4 | Remove `SETTING OVERVIEW:` line (line 134). Remove `NARRATIVE STYLE:` line (line 139). Add middle-ground directive text to character goals (lines 95-112). Update story goal directives (lines 71-74) to match. Update GOAL PURSUIT rule (line 523). Add PERSONALITY TRAIT ADHERENCE global rule after GOAL PURSUIT. Add `traitImpactMap` config object. Add `getTraitGuidance()` function. Replace `formatTrait` function (line 119) to use bracket injection format. Include `_extras` in character context. |
| `src/types.ts` | 1, 3, 4 | Remove `settingOverview: string` from `WorldCore` (line 97). Remove `narrativeStyle: string` from `WorldCore` (line 105). Add `CharacterExtraRow` type. Add `_extras?: CharacterExtraRow[]` to `PhysicalAppearance`, `CurrentlyWearing`, `PreferredClothing`. Add `adherenceScore?: number` and `removalGraceCount?: number` to `PersonalityTrait` (lines 59-64). Add same fields to `CharacterGoal` (lines 191-201). |
| `src/components/chronicle/CharacterGoalsSection.tsx` | 1 | Rename header from "Character Goals" to "Goals and Desires". Replace standard shadcn `Input` and `Textarea` with `AutoResizeTextarea` for Goal Name, Desired Outcome, and Step descriptions. |
| `src/components/chronicle/StoryGoalsSection.tsx` | 1 | Rename header from "Story Goals" to "Story Goals and Desires". Replace standard shadcn `Input` and `Textarea` with `AutoResizeTextarea`. |
| `supabase/functions/extract-character-updates/index.ts` | 1, 3 | Add desires alias to prompt: "Treat 'desires', 'wants', 'preferences', 'kinks', and 'fantasies' as synonymous with goals." Add `_extras` to TRACKABLE FIELDS for physical appearance, currently wearing, and preferred clothing. |
| `src/components/chronicle/CharactersTab.tsx` | 3 | Create reusable row layout component for hard-coded sections (system rows with read-only labels + editable values, user-added extras with editable labels + values + delete button, Add Row button). Replace current `HardcodedInput` usage. |
| `src/components/chronicle/CharacterEditModal.tsx` | 3 | Same row layout changes as CharactersTab for the chat modal view. |
| `src/services/supabase-data.ts` | 3, 4 | Handle `_extras` in save/load for appearance and clothing JSONB columns. Handle `adherenceScore` and `removalGraceCount` in save/load for personality traits and goals. |
| `supabase/functions/evaluate-adherence/index.ts` | 4 | NEW edge function. Receives latest user message, latest AI response, and list of active traits/goals with current scores and levels. Outputs per-trait/goal classification (align/reject/neutral), confidence (high/medium/low), and reason. Uses fast/cheap model. |
| `src/services/character-ai.ts` | 4 | Wire up `evaluate-adherence` call after each exchange, running in parallel with `extract-character-updates`. Apply scoring table adjustments for high-confidence classifications. Recalculate impact brackets. Check grace period. Update DB scores. |
