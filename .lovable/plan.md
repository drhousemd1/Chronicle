

# Multi-Feature Update Plan

This plan covers 5 distinct changes across the application. Due to the scope, each is broken into its own section.

---

## 1. Add Guidance Strength Slider to Character Goals

**Problem:** Character goals in the Character Builder and Chat Edit Modal are missing the flexibility/guidance strength control that Story Goals already have.

**Solution:** Add a `flexibility` field to `CharacterGoal` type and build a new slider UI matching the mockup (gradient blue bar with RIGID / NORMAL / FLEXIBLE labels and dynamic hint text below).

### UI Design (matching mockup)
- Header: "GUIDANCE STRENGTH" with subtitle "How strongly the AI should steer toward this goal."
- A 3-stop slider with a gradient blue track (dark navy to bright blue)
- Three labels below: RIGID, NORMAL, FLEXIBLE -- the active one is highlighted in blue
- Below the slider: a rounded hint box showing the guidance description text
- Guidance text per level:
  - **Rigid:** "Treat the goal as the primary story arc and ultimate focus. Allow organic deviations, subplots, and temporary shifts based on user inputs, but always keep the goal in mind and steer the narrative back naturally over time through character actions, events, or motivations. Do not abandon or diminish the goal's importance, integrating it seamlessly as the story progresses toward resolution."
  - **Normal:** "Steer towards the goal by weaving it in naturally when opportunities arise. Make persistent attempts to incorporate and advance it throughout the story, even in the face of initial user resistance, but allow gradual adaptation if the user's inputs show sustained and consistent conflict with the goal, treating it as a recurring influence until deviation becomes clearly dominant."
  - **Flexible:** "Steer towards the goal with light guidance. Make a few subtle attempts (e.g., 2-3 opportunities) to incorporate it, but prioritize flexibility and adapt fully to story deviations if the user's inputs continue to conflict, letting the narrative evolve based on player choices."

### Files Changed
| File | Change |
|------|--------|
| `src/types.ts` | Add `flexibility?: GoalFlexibility` to `CharacterGoal` type |
| `src/components/chronicle/CharacterGoalsSection.tsx` | Add GuidanceStrengthSlider component and render it per goal (edit mode) |
| `src/components/chronicle/StoryGoalsSection.tsx` | Replace the current 3-button toggle with the same GuidanceStrengthSlider component |
| `src/services/llm.ts` | Update `characterGoalsContext` to inject flexibility directives (same pattern as story goals) |

A shared `GuidanceStrengthSlider` component will be created so both Story Goals and Character Goals use the identical UI.

---

## 2. Replace Story Goals Flexibility Toggle with Slider

This is merged into item 1 above. The current 3-button toggle in `StoryGoalsSection.tsx` will be replaced with the same shared `GuidanceStrengthSlider` component, giving both goal types a consistent, polished UI.

---

## 3. Add Hardcoded Personality Container

**Problem:** Personality is essential for every character but currently only exists as a structured section for Side Characters. Main characters rely on user-created custom sections, which is inconsistent.

**Solution:** Add a hardcoded "Personality" section to the `Character` type and render it in all locations where character data appears.

### Personality Container Design
- Container title: "Personality"
- First element: a toggle labeled "Split into Outward & Inward Personalities"
- When **off**: A single list of personality trait items (label + value pairs, like other hardcoded sections)
- When **on**: Two sub-headings appear -- "Outward Personality" and "Inward Personality" -- each with their own trait list
- Each trait line gets a small dropdown at the end: Rigid / Normal / Flexible (no hint text needed)

### Type Changes
```text
// New types in src/types.ts
type PersonalityTraitFlexibility = 'rigid' | 'normal' | 'flexible';

type PersonalityTrait = {
  id: string;
  label: string;
  value: string;
  flexibility: PersonalityTraitFlexibility;
};

type CharacterPersonality = {
  splitMode: boolean;  // false = unified, true = outward/inward split
  traits: PersonalityTrait[];          // Used when splitMode = false
  outwardTraits: PersonalityTrait[];   // Used when splitMode = true
  inwardTraits: PersonalityTrait[];    // Used when splitMode = true
};
```

Add `personality?: CharacterPersonality` to the `Character` type.

### Files Changed
| File | Change |
|------|--------|
| `src/types.ts` | Add `PersonalityTrait`, `CharacterPersonality` types; add `personality?` field to `Character` and `CharacterSessionState` |
| New: `src/components/chronicle/PersonalitySection.tsx` | Hardcoded personality container with split toggle and per-trait flexibility dropdown |
| `src/components/chronicle/CharactersTab.tsx` | Render `PersonalitySection` between Preferred Clothing and Character Goals |
| `src/components/chronicle/CharacterEditModal.tsx` | Render `PersonalitySection` for main characters (between clothing and goals) |
| `src/services/llm.ts` | Inject personality data into character context block with outward/inward distinction and flexibility directives |
| `supabase/functions/extract-character-updates/index.ts` | Add `personality.outward.*` and `personality.inward.*` as trackable fields |

### Backend Prompt Handling
- When split mode is on, inject as:
  ```
  OUTWARD PERSONALITY:
    - [RIGID] Charismatic: "Commands attention in social settings..."
  INWARD PERSONALITY:
    - [FLEXIBLE] Anxious: "Internally nervous despite outward confidence..."
  ```
- When split mode is off, inject as:
  ```
  PERSONALITY:
    - [NORMAL] Nurturing: "Warm and protective toward family..."
  ```

---

## 4. Remove "Current Status Summary" from Goals

**Analysis:** You raise a valid concern. The "Current Status Summary" is indeed redundant with the step-based tracking system. The AI has two places to update progress -- the free-text `currentStatus` field AND the structured steps -- and this creates confusion. The AI may update one and ignore the other, defeating the purpose of the step system.

**Recommendation: Remove it.** The steps + progress ring already communicate where things stand. The "Desired Outcome" describes the destination, the steps describe the journey, and the progress ring shows completion. `currentStatus` is the redundant middle layer.

### Files Changed
| File | Change |
|------|--------|
| `src/types.ts` | Make `currentStatus` optional on both `CharacterGoal` and `StoryGoal` (keep for backward compat but stop using) |
| `src/components/chronicle/CharacterGoalsSection.tsx` | Remove the "Current Status Summary" field from both edit and collapsed views |
| `src/components/chronicle/StoryGoalsSection.tsx` | Remove the "Current Status Summary" field |
| `src/components/chronicle/CharacterEditModal.tsx` | Remove any currentStatus references in goal parsing/display |
| `src/services/llm.ts` | Remove `currentStatus` from character goals context; for story goals, remove the current_status line |
| `supabase/functions/extract-character-updates/index.ts` | Remove `current_status` from the goal update format; update prompt to not request it |

---

## 5. Fix Wasted Space in Locations and Custom Content Tables

**Problem:** The label input is `w-1/3` which is too narrow, creating a massive gap between the label and description fields.

**Solution:** Change the label width from `w-1/3` to `w-2/5` (40%) and ensure the description field fills the remaining space naturally with `flex-1`. This closes the gap while still keeping the label distinguishable.

### Files Changed
| File | Change |
|------|--------|
| `src/components/chronicle/ScenarioCardView.tsx` | Change location label from `w-1/3` to `w-2/5`; change custom content label from `w-1/3` to `w-2/5` |

This is a simple CSS-only change on lines 174 and 257.

---

## Implementation Order

Since these changes touch overlapping files, they should be implemented in this sequence:

1. **Type changes first** (types.ts) -- add `flexibility` to CharacterGoal, add CharacterPersonality types, make currentStatus optional
2. **Shared GuidanceStrengthSlider component** (new file)
3. **PersonalitySection component** (new file)
4. **CharacterGoalsSection.tsx** -- add slider, remove currentStatus
5. **StoryGoalsSection.tsx** -- replace toggle with slider, remove currentStatus
6. **CharactersTab.tsx** -- add PersonalitySection
7. **CharacterEditModal.tsx** -- add PersonalitySection, update goal handling
8. **llm.ts** -- update context injection for personality + flexibility + remove currentStatus
9. **extract-character-updates edge function** -- add personality tracking, update goal format
10. **ScenarioCardView.tsx** -- fix label widths

## Estimated Scope
- 2 new component files
- 8 existing files modified
- 1 edge function updated and redeployed

