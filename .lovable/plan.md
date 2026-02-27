

# Complete Character Evolution System Fix — Updated Plan

This plan incorporates Claude's independent code review findings alongside our original diagnosis. Claude's analysis confirmed all five original problems are real and correctly diagnosed, but identified **two critical gaps** in our fix approach plus **three additional issues** we hadn't caught.

---

## What Claude Found That We Missed

### Gap 1: Step Parsing Regex Is Broken
The current regex `split(/Step\s+\d+:\s*/i)` can split mid-sentence on prose like "Step 2 of her recovery was difficult", creating phantom steps from narrative text. The fix must anchor the split to line boundaries: `(?:^|\n)Step\s+\d+:\s*` — this prevents false splits inside descriptions.

### Gap 2: Personality Updates Never Build a Patch
The dotted-field branch in `applyExtractedUpdates` handles `physicalAppearance`, `currentlyWearing`, `preferredClothing`, `background`, and `_extras` sections — but **there is no branch for `personality.*`**. When the AI returns `personality.outwardTraits`, it falls through every condition and does nothing. Even after we fix persistence and merging, personality updates will still silently fail because the patch object never gets built. This is confirmed in the code at lines 1705-1726.

### Issue A: `_extras` Items Are Always Appended, Never Deduplicated
If the AI returns a relationship update for "Emma: close friend" and that label already exists in `_extras`, a duplicate "Emma" entry gets pushed in. Over time this creates duplicate entries.

### Issue B: Side Characters Get Fewer Update Paths
The side character patch block (lines 1746-1776) only handles `physicalAppearance` and `currentlyWearing` dotted fields. Goals, background, personality, and other sections are not handled for side characters.

### Issue C: No Extraction Concurrency Guard
If messages are sent rapidly, two extraction calls can run concurrently, both read the same state, and the second write overwrites the first. A simple `extractionInProgress` ref guard would prevent this.

---

## Complete Implementation Plan (All Issues Addressed)

### Change 1 — Fix Goal Step Logic (append to replace + regex + cap)
**File:** `src/components/chronicle/ChatInterfaceTab.tsx`

**Current behavior:** When `new_steps` is returned for an existing goal, steps are appended via `push()`. The split regex can create phantom steps from prose.

**After fix:**
- Replace the step split regex from `/Step\s+\d+:\s*/i` to `/(?:^|\n)Step\s+\d+:\s*/i` (line-boundary anchored) in both the existing-goal and new-goal parsing blocks.
- Change existing-goal `new_steps` handling from `push()` to full replacement: `updatedSteps = parsedSteps`.
- Apply `complete_steps` AFTER replacement (not before — the current code applies completion first, then appends new steps, which means completion indices refer to the old list).
- Hard cap: if parsed steps exceed 8, keep only the first 8. If parsed steps exceed 15, reject entirely and only apply `progress`/`currentStatus`.
- Apply same regex fix in the new-goal creation block (lines 1629-1637).

### Change 2 — Goal REMOVE Signal + Lifecycle Management
**File:** `src/components/chronicle/ChatInterfaceTab.tsx`

**Current behavior:** Goals are only ever created or updated, never removed. Conflicting/obsolete goals accumulate forever.

**After fix:**
- In `applyExtractedUpdates`, when a goal update value is exactly `"REMOVE"`, delete that goal from the array.
- Add title-based deduplication: reject new goals whose normalized title is >80% similar to an existing goal.
- Enforce max 5 active goals per character. New goals beyond this limit are ignored with a console warning.
- The prompt will also instruct the AI to update a goal's title when direction shifts (rather than always remove+recreate), preserving progress history.

**File:** `supabase/functions/extract-character-updates/index.ts`

**Prompt changes:**
- Add a "GOAL LIFECYCLE MANAGEMENT" section that instructs the AI to output `goals.OldGoalTitle = "REMOVE"` when a goal is obsolete or contradicted.
- Instruct to consolidate conflicting goals (update one, remove the other).
- Max 1 new goal per character per extraction. Prefer updating existing goals.
- Tone down "DESIRES & PREFERENCES AS GOALS" — only sustained/repeated interests become goals, not casual mentions.

### Change 3 — Add Personality Branch in Patch Builder
**File:** `src/components/chronicle/ChatInterfaceTab.tsx`

**Current behavior:** The dotted-field handler (lines 1705-1726) has branches for `physicalAppearance`, `currentlyWearing`, `preferredClothing`, `background`, and `_extras` sections. There is NO branch for `personality.*`. Personality updates silently fall through and are lost.

**After fix:**
- Add an `else if (parent === 'personality')` branch after the background handler.
- For `child` values of `outwardTraits`, `inwardTraits`, or `traits`: parse the value as trait entries (handle both "Label: Description" string format and JSON array format) and merge into the existing personality object.
- For other personality child keys (e.g., `splitMode`): assign directly.
- Set `patch.personality = mergedPersonalityObject`.

### Change 4 — Fix Persistence (Save + Load 7 Missing Fields)
**File:** `src/services/supabase-data.ts`

**Current behavior:** `updateSessionState` only saves basics, appearance, goals, avatar, and control fields. `fetchSessionStates` only reads those same fields. The 7 fields (`personality`, `background`, `tone`, `keyLifeEvents`, `relationships`, `secrets`, `fears`) are never written or read despite existing as columns in the database.

**After fix in `updateSessionState`:**
- Add to patch type: `personality`, `background`, `tone`, `keyLifeEvents`, `relationships`, `secrets`, `fears`.
- Add mapping lines:
  - `if (patch.personality !== undefined) updateData.personality = patch.personality;`
  - `if (patch.background !== undefined) updateData.background = patch.background;`
  - `if (patch.tone !== undefined) updateData.tone = patch.tone;`
  - `if (patch.keyLifeEvents !== undefined) updateData.key_life_events = patch.keyLifeEvents;`
  - `if (patch.relationships !== undefined) updateData.relationships = patch.relationships;`
  - `if (patch.secrets !== undefined) updateData.secrets = patch.secrets;`
  - `if (patch.fears !== undefined) updateData.fears = patch.fears;`

**After fix in `fetchSessionStates`:**
- Add field reads in the row mapping:
  - `personality: row.personality || undefined`
  - `background: row.background || undefined`
  - `tone: row.tone || undefined`
  - `keyLifeEvents: row.key_life_events || undefined`
  - `relationships: row.relationships || undefined`
  - `secrets: row.secrets || undefined`
  - `fears: row.fears || undefined`

### Change 5 — Fix Effective Merge (Display + LLM Context)
**File:** `src/components/chronicle/ChatInterfaceTab.tsx`

**Current behavior:** `getEffectiveCharacter` (lines 581-609) merges basics, appearance, goals, avatar, and control — but not personality, background, tone, keyLifeEvents, relationships, secrets, fears, or nicknames.

**After fix:**
- Add merge lines for all 7 section fields plus nicknames:
  - `nicknames: sessionState.nicknames || baseChar.nicknames`
  - `personality: sessionState.personality || baseChar.personality`
  - `background: sessionState.background || baseChar.background`
  - `tone: sessionState.tone || baseChar.tone`
  - `keyLifeEvents: sessionState.keyLifeEvents || baseChar.keyLifeEvents`
  - `relationships: sessionState.relationships || baseChar.relationships`
  - `secrets: sessionState.secrets || baseChar.secrets`
  - `fears: sessionState.fears || baseChar.fears`

This ensures the character card UI, the edit modal, AND the LLM context all reflect the session-evolved state.

### Change 6 — Fix `preferredClothing` Field Name Mismatch
**File:** `src/components/chronicle/ChatInterfaceTab.tsx`

**Current behavior:** The extraction prompt says `preferredClothing.underwear` but the app type uses `undergarments`. Updates are silently lost.

**After fix:** In the `preferredClothing` branch of the dotted-field handler, add: `if (child === 'underwear') child = 'undergarments';`

### Change 7 — Fix `_extras` Deduplication
**File:** `src/components/chronicle/ChatInterfaceTab.tsx`

**Current behavior:** `_extras` items are always appended. If the AI updates "Emma: close friend" and an "Emma" entry already exists, a duplicate is created.

**After fix:** Before pushing to `_extras`, check if an item with the same label (case-insensitive) already exists. If so, update its value in place instead of appending.

### Change 8 — Expand Side Character Update Paths
**File:** `src/components/chronicle/ChatInterfaceTab.tsx`

**Current behavior:** The side character patch block (lines 1746-1776) only handles `physicalAppearance` and `currentlyWearing` dotted fields. Other structured fields are dropped or mishandled.

**After fix:** Add handling for `preferredClothing`, `background`, `personality`, `goals`, and `_extras` sections in the side character patch block, mirroring the main character logic.

### Change 9 — Add Extraction Concurrency Guard
**File:** `src/components/chronicle/ChatInterfaceTab.tsx`

**Current behavior:** No guard exists. Rapid messages can trigger overlapping extraction calls that overwrite each other's results.

**After fix:** Add an `extractionInProgressRef = useRef(false)` guard. At the start of `extractCharacterUpdatesFromDialogue`, if the ref is true, skip and return empty. Set to true on entry, false on completion (in a finally block).

### Change 10 — Rebalance Extraction Prompt
**File:** `supabase/functions/extract-character-updates/index.ts`

**Current behavior:** ~60% of the prompt is goal instructions. Non-goal sections get brief mentions. No explicit personality format examples. The AI defaults to over-producing goals.

**After fix:**
- Restructure Phase 1 to give equal weight to all field categories: volatile state, appearance, personality evolution, background reveals, relationship developments, tone/speech patterns, fears/secrets, AND goals.
- Reduce Phase 2's goal review from dominant subsection to one subsection among equals.
- Simplify step instructions: "4-6 concise milestone steps" instead of multi-paragraph formatting rules.
- Add explicit format examples for personality trait updates, `_extras` updates, and tone updates at the same detail level as goal examples.
- Add rule: "If a character is actively speaking, you MUST update at least mood and location. An active character should never produce zero non-goal updates."
- Add rule: "Repeated behavior patterns across messages should update personality traits, not create micro-goals."

### Change 11 — Expand Context Window + Filter Noise
**File:** `src/components/chronicle/ChatInterfaceTab.tsx`

**Current behavior:** Context window is `slice(-6)` (last 6 messages). Error strings from failed API calls pollute the context.

**After fix:**
- Change to `slice(-20)` for the `recentMessages` passed to extraction.
- Filter out messages whose text contains error patterns like "Invalid token", "xAI/Grok error", "Payment required" before building `recentContext`.

---

## Implementation Order (Risk-Ranked)

| Order | Change | Risk |
|-------|--------|------|
| 1 | Fix step replacement + regex (Change 1) | Low |
| 2 | Add REMOVE goal handling (Change 2 frontend) | Low |
| 3 | Add `underwear` normalization (Change 6) | Trivial |
| 4 | Add personality branch (Change 3) | Low |
| 5 | Extend `updateSessionState` + `fetchSessionStates` (Change 4) | Low |
| 6 | Extend `getEffectiveCharacter` (Change 5) | Low |
| 7 | Fix `_extras` deduplication (Change 7) | Low |
| 8 | Expand side character updates (Change 8) | Low |
| 9 | Add concurrency guard (Change 9) | Low |
| 10 | Rewrite extraction prompt (Changes 2 prompt + 10) | Medium |
| 11 | Expand context window (Change 11) | Low |

---

## Files Changed Summary

| File | Changes |
|------|---------|
| `src/components/chronicle/ChatInterfaceTab.tsx` | Step replace logic, regex fix, REMOVE handling, goal caps, personality branch, `_extras` dedupe, field name normalization, side character update paths, concurrency guard, `getEffectiveCharacter` merge expansion, context window expansion |
| `src/services/supabase-data.ts` | `updateSessionState`: add 7 field mappings. `fetchSessionStates`: add 7 field reads |
| `supabase/functions/extract-character-updates/index.ts` | Prompt rewrite: balanced coverage, REMOVE signal, goal lifecycle management, explicit format examples, relaxed goal creation pressure |

No database migrations needed. No new edge functions. No schema changes.

