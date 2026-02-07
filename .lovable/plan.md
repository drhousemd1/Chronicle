

# Character Card Update System: Full Analysis and Fix Plan

## Background

You worked with ChatGPT and Claude independently to diagnose why character cards feel stale during play sessions. Both LLMs identified overlapping issues but with different emphasis and recommendations. Below is a point-by-point comparison of their findings against the actual codebase, followed by a consolidated implementation plan.

---

## ISSUE 1: Goals Are Not Tracked by the Extractor

### Claude's Finding
Goals are missing from the `TRACKABLE FIELDS` list in the extraction prompt. The AI has no idea it should track goals. Claude proposes a complex `goals.add`, `goals.update`, `goals.milestone`, `goals.complete`, `goals.abandon` format with full JSON payloads in the value field.

### ChatGPT's Finding
Goals are "not wired in" end-to-end: the extractor prompt doesn't define them, the merge logic doesn't handle them, and session state persistence doesn't include them. ChatGPT recommends wiring goals as a separate full-path effort.

### My Verification (Actual Codebase)
- **Confirmed:** The extraction prompt (lines 97-103 in `extract-character-updates/index.ts`) lists `nicknames`, `physicalAppearance.*`, `currentlyWearing.*`, `preferredClothing.*`, `location`, and `currentMood`. Goals are absent.
- **However:** The database already has a `goals` JSONB column on `character_session_states` (confirmed via schema query). The `Character` type already has `goals?: CharacterGoal[]`. The `CharacterGoalsSection` UI component exists and is fully built. So the plumbing is partially there.
- **Missing links:** 
  1. `fetchSessionStates` does NOT read the `goals` column from the database (line 906-932).
  2. `updateSessionState` does NOT handle a `goals` key in the patch (lines 970-1027).
  3. `getEffectiveCharacter` does NOT merge goals from session state (lines 489-515).
  4. `applyExtractedUpdates` has no `goals.*` handler.
  5. `extractCharacterUpdatesFromDialogue` does NOT pass goals data to the edge function (lines 1098-1109).

### My Recommendation
Both LLMs are correct that goals are completely unwired for extraction. However, Claude's proposed `goals.add.GoalTitle = JSON` format is overly complex for LLM output -- asking the AI to emit valid JSON inside a JSON value field is fragile and prone to parsing failures. 

**Better approach:** Use the existing `sections.*` mechanism for now, with a dedicated "Goals" section that the extractor manages via `sections.Goals.GoalTitle = "status description (progress: X%)"`. This requires zero new parsing logic and leverages the already-working custom sections pipeline. Then separately, wire the `goals` column end-to-end for the structured Goals UI component (title, desiredOutcome, currentStatus, progress, milestones) -- but handle that as a separate pass from the extractor output, using the existing structured CharacterGoal format.

For the structured goals wiring, wire the 5 missing links listed above. The extraction prompt should use a simpler format: `goals.GoalTitle = "currentStatus text | progress: 25"` which is a single flat string that the frontend can parse.

---

## ISSUE 2: "Delta Extractor" vs "State Maintainer" Philosophy

### Claude's Finding
The current extraction rules (rules 2 and 12) are the "killer" -- "Extract ONLY explicitly stated changes" and "Return empty updates array if nothing clearly changed." Claude recommends a full philosophy replacement with mandatory volatile field reviews every turn, contextual inference, and minimum output requirements of 2-3 updates per turn.

### ChatGPT's Finding
Agrees completely but with more nuance. ChatGPT introduces "volatility tiers" (high: mood/location/clothing, medium: temp conditions, low: stable appearance traits) and adds conflict resolution rules. ChatGPT specifically warns against forcing the model to fill every field every time, as that causes hallucination.

### My Verification (Actual Codebase)
- **Confirmed:** Lines 117-129 of the extraction prompt are extremely conservative. Rule 2 says "ONLY explicitly stated changes (not implied or assumed)" and Rule 12 says "Return empty updates array if nothing clearly changed."
- The temperature is set to 0.2 (line 188), which further biases toward conservative, minimal output.

### My Recommendation
Both LLMs are right. The prompt philosophy needs to shift. However, I agree more with ChatGPT's measured approach:

- Use volatility tiers rather than blanket "be aggressive."
- Keep stable traits (hair color, eye color, build) conservative -- these should NOT be inferred.
- Make volatile fields (mood, location, clothing) proactive with contextual inference allowed.
- Do NOT force a minimum output count. Instead, use softer language like "If the character is present and active, at least mood and location should be current." Forcing "at least 3 updates" will produce hallucinated filler.
- Raise temperature from 0.2 to 0.3 for slightly more creative output.

---

## ISSUE 3: Session Summary as Anchor

### Claude's Finding
Add a mandatory "Session Summary" custom section with three items: Current Situation, Recent Events, Active Goals. Update Current Situation every 1-2 turns.

### ChatGPT's Finding
Same recommendation with "Open Threads" instead of "Active Goals." ChatGPT adds hard constraints on keeping items short and character-limited.

### My Verification (Actual Codebase)
The custom sections system (`sections.SectionTitle.ItemLabel`) already works end-to-end in the extraction and merge pipeline. The `applyExtractedUpdates` function (lines 1224-1271) handles `sections.*` field format correctly, including creating new sections and adding new items.

### My Recommendation
This is a pure prompt change and is low-risk. Add Session Summary to the extraction prompt with three items: Current Situation, Recent Events, Active Goals. Use the existing `sections.*` mechanism -- no code changes needed for this to work. Both LLMs are correct here and this is essentially free to implement.

---

## ISSUE 4: Pass Current Volatile State to the Extractor

### Claude's Finding
Build a "state header" for each character that explicitly shows the AI what values it's maintaining (current mood, location, outfit, session summary). Replace the existing character context building.

### ChatGPT's Finding
Same recommendation. "Models perform better when the values they are expected to maintain are presented clearly."

### My Verification (Actual Codebase)
Currently the frontend sends character data including `physicalAppearance`, `currentlyWearing`, `location`, `currentMood` (lines 1098-1109). The edge function builds these into a pipe-separated string (lines 62-90). So the data IS being passed, but not in a structured "state header" format that emphasizes what the AI should maintain.

### My Recommendation
Both LLMs are correct, but the improvement is more formatting than data. The data is already there. The edge function's `characterContext` building (lines 62-90) just needs restructuring to present it as "CURRENT STATE TO MAINTAIN" rather than a flat dump. This is a backend-only change in the edge function. The frontend should additionally pass `goals` and `preferredClothing` data, which are currently omitted.

---

## ISSUE 5: Gate Shimmer on Meaningful Patches

### Claude's Finding
Not addressed.

### ChatGPT's Finding
Only show the "Updating..." shimmer if the extracted patch contains at least one applied change. Currently shimmer fires even if extraction returns empty.

### My Verification (Actual Codebase)
Looking at lines 1430-1437 in `handleSend`:
```
extractCharacterUpdatesFromDialogue(userInput, fullText).then(updates => {
    if (updates.length > 0) {
        applyExtractedUpdates(updates);
    }
});
```
The shimmer indicator is triggered inside `applyExtractedUpdates` -> `showCharacterUpdateIndicator`, which is only called when there ARE updates, and only for matched characters. So the shimmer is already gated on having updates. ChatGPT's concern is likely misplaced based on assumptions without seeing the actual code.

### My Recommendation
No change needed. The shimmer is already gated correctly.

---

## ISSUE 6: Periodic Consolidation

### Claude's Finding
Every 10 messages, run a deeper "consolidation pass" that reviews all fields for staleness, reconciles contradictions, and compresses overly long sections. Proposes adding `updateCounter` state and a `consolidate` flag.

### ChatGPT's Finding
Similar recommendation: "Every 8-12 turns or on major scene breaks." Also suggests optional "last updated" metadata per bucket.

### My Verification (Actual Codebase)
No consolidation logic exists. Each turn runs extraction independently with no awareness of how many turns have passed.

### My Recommendation
This is a nice-to-have but adds complexity. The prompt philosophy fix (Issue 2) should handle most staleness problems. If we implement consolidation, I'd use a simpler approach: count messages in the conversation array rather than adding new React state. Pass a `consolidate: true` flag to the edge function every 10 messages. The edge function appends extra instructions to the system prompt when consolidating.

This should be a Phase 2 item -- implement the core fixes first and see if they resolve the staleness before adding consolidation.

---

## ISSUE 7: "Last Updated" Metadata

### ChatGPT's Finding
Track timestamps or turn counters for volatile buckets. Feed into extractor: "Clothing last updated 40 turns ago."

### Claude's Finding
Not addressed.

### My Recommendation
Interesting idea but significant implementation overhead. Skip for now. The improved prompt philosophy should prevent most staleness. Revisit only if needed after the core fixes.

---

## Implementation Plan

### Phase 1: Core Fixes (Immediate)

**1. Rewrite the extraction prompt** -- `supabase/functions/extract-character-updates/index.ts`

Changes to the system prompt:
- Replace "EXTRACTION RULES" section with new "EXTRACTION PHILOSOPHY" section
- Add volatility tiers (high: mood, location, clothing, temp conditions; low: stable appearance traits)
- Add goals tracking to the trackable fields list (using simple format: `goals.GoalTitle = "status | progress: X%"`)
- Add Session Summary section requirement (Current Situation, Recent Events, Active Goals)
- Allow contextual inference for volatile fields with clear safe/unsafe examples
- Remove "Return empty updates array if nothing clearly changed"
- Restructure character context building to present as "CURRENT STATE TO MAINTAIN"

Changes to the request:
- Raise temperature from 0.2 to 0.3

**2. Wire goals end-to-end** -- Multiple files

- `src/services/supabase-data.ts`:
  - `fetchSessionStates`: Add `goals: row.goals || []` to the return mapping
  - `updateSessionState`: Add `if (patch.goals !== undefined) updateData.goals = patch.goals;` and add `goals` to the patch type
  - `createSessionState`: Include `goals: []` in the insert and return

- `src/components/chronicle/ChatInterfaceTab.tsx`:
  - `getEffectiveCharacter`: Add `goals: sessionState.goals || baseChar.goals || []` to the merge
  - `extractCharacterUpdatesFromDialogue`: Add `goals: effective.goals || []` to the character data sent to the edge function
  - `applyExtractedUpdates`: Add handler for `goals.*` field format that parses the simple "status | progress: X%" format and updates the structured CharacterGoal array

- `src/types.ts`:
  - `CharacterSessionState`: Add `goals?: CharacterGoal[]` field (note: the type currently does NOT include goals)

**3. Pass enriched context to edge function** -- `src/components/chronicle/ChatInterfaceTab.tsx`

- Add `preferredClothing` to the data sent in `extractCharacterUpdatesFromDialogue`
- Add `goals` data (as readable strings, not raw objects) to the character context

**4. Update edge function character context building** -- `supabase/functions/extract-character-updates/index.ts`

- Restructure `characterContext` to use "CURRENT STATE" format
- Add goals to the context when present
- Add `preferredClothing` to the context
- Update the `CharacterData` interface to include goals and preferredClothing

### Phase 2: Enhancement (After Testing Phase 1)

**5. Periodic consolidation** -- Both frontend and edge function

- Count conversation messages and pass `consolidate: true` every 10 messages
- Edge function appends consolidation instructions to system prompt when flag is true

**6. Enhanced logging** -- `ChatInterfaceTab.tsx`

- Add structured console logging for extraction results to aid debugging

---

### Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/extract-character-updates/index.ts` | Rewrite system prompt, restructure character context, update CharacterData interface, raise temperature |
| `src/types.ts` | Add `goals?: CharacterGoal[]` to `CharacterSessionState` type |
| `src/services/supabase-data.ts` | Wire goals in fetchSessionStates, createSessionState, updateSessionState |
| `src/components/chronicle/ChatInterfaceTab.tsx` | Wire goals in getEffectiveCharacter, extractCharacterUpdatesFromDialogue, applyExtractedUpdates |

---

### What We Are NOT Doing (And Why)

- **NOT forcing minimum output counts** -- Both LLMs suggest "at least 2-3 updates per turn." This will cause hallucinated filler updates. The improved prompt philosophy with volatile field awareness is sufficient.
- **NOT adding "last updated" timestamps** -- High implementation complexity for marginal benefit. The prompt fixes should handle recency.
- **NOT using Claude's complex goals.add/update/milestone/complete/abandon format** -- Too fragile for LLM JSON-in-JSON output. Using a simpler flat string format that the frontend parses.
- **NOT gating shimmer differently** -- Already correctly gated in current code.
- **NOT implementing consolidation in Phase 1** -- Let the prompt fixes settle first.

