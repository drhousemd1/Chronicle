

# Next Batch of Fixes — 5 Issues (Code-Verified)

## Technical Section
For each fix below, I verified the actual source code to confirm the issue exists and understand the exact change needed.

---

## 1. Performance: Message loading has no safety limit — users with long stories can crash the app (High)
**Finding:** `qh-perf-20260318-002`

**What's wrong:** When you open a story, the app loads ALL messages from ALL conversations in that story in one single database request (line 332 of `supabase-data.ts`). There's no limit on how many messages it pulls. The database has a built-in cap of 1,000 rows per query, but the app doesn't know about that cap — so if you have 1,200 messages across your conversations, the last 200 just silently disappear. On top of that, pulling thousands of messages in one request makes the app feel slow or unresponsive during loading.

**Why it matters:** Long-running stories are the core use case of this app. Power users who have been playing for weeks will hit this wall and either see missing messages or slow loads — and they'll have no idea why.

**Fix:** Add `.limit(5000)` guard to the message batch fetch. Also add a `console.warn` if the result count equals the limit, so we can trace truncation. This prevents silent data loss while keeping the batch optimization.

**Files:** `src/services/supabase-data.ts` (line ~332)

---

## 2. Type Safety: Every database call to the stories table bypasses type checking (High)
**Finding:** `qh-data-20260318-001`

**What's wrong:** Throughout `supabase-data.ts`, every query to the `stories` table uses `supabase.from('stories' as any)` — this "as any" trick tells TypeScript to stop checking the data shape. The `stories` table IS properly defined in the generated types file, so this bypass is completely unnecessary. It was likely added early on when the table didn't exist in types yet, and never cleaned up.

**Why it matters:** Without type checking, if someone adds or renames a column in the database, the code won't catch mismatches at build time — it'll just break at runtime for users. This is one of the main reasons TypeScript exists, and it's being deliberately turned off for one of the most important tables in the app.

**Fix:** Remove `as any` from all `supabase.from('stories' as any)` calls (lines 298, 314, 417, 500, 671, 687, 1553). The types file already has full `stories` table definitions.

**Files:** `src/services/supabase-data.ts` (~7 occurrences)

---

## 3. Data Integrity: Saving a story isn't atomic — partial failures leave broken data (High)
**Finding:** `qh-data-20260318-004`

**What's wrong:** When you save a story, the app first writes the main story record, then separately writes characters, codex entries, and scenes in parallel. If the story record saves but one of the child writes fails (network hiccup, timeout), you end up with a story that has mismatched data — maybe old characters with new world settings, or missing scenes. The user sees "saved" but the data is actually in a broken state.

**Why it matters:** Users trust the save button. If it says it worked, the data should be consistent. Partial saves are one of the hardest bugs to diagnose because they look fine until the user notices something's wrong hours later.

**Fix:** Create a database function (`save_scenario_atomic`) that performs all writes inside a single transaction. If any part fails, everything rolls back. Update the frontend `saveScenario` function to call this RPC instead of doing individual writes.

**Files:** New migration (RPC function), `src/services/supabase-data.ts`

---

## 4. Functionality: Story Goals day-context is disconnected — the goal system doesn't know what day it is (Medium)
**Finding:** `qh-docs-20260318-003`

**What's wrong:** The `StoryGoalsSection` component accepts `currentDay` and `currentTimeOfDay` as props, but neither the WorldTab nor StoryCardView actually passes them. The props default to `1` and `'day'` respectively. Meanwhile, in the chat interface where goals actually get *evaluated* by AI, the `evaluateGoalProgress` function (line 1820 of ChatInterfaceTab) sends step descriptions to the AI but **doesn't include the current day or time of day** in the evaluation payload. The AI evaluating your goals has no idea where you are in the story's timeline.

This matters because story goals are inherently time-sensitive — "escape the city by Day 3" or "confess before nightfall" are meaningless evaluations if the system doesn't know what day/time it is.

**Why it matters:** Goals that depend on pacing or deadlines can't be properly evaluated. The AI might mark a step complete without considering timing context, or fail to recognize urgency.

**Fix:** 
- Pass `currentDay` and `currentTimeOfDay` from `evaluateGoalProgress` into the edge function payload
- Update the `evaluate-goal-progress` edge function to include day/time context in the AI classification prompt
- Wire the props through WorldTab when it renders StoryGoalsSection in a conversation context

**Files:** `src/components/chronicle/ChatInterfaceTab.tsx`, `supabase/functions/evaluate-goal-progress/index.ts`, `src/components/chronicle/WorldTab.tsx`

---

## 5. Registry Housekeeping

Bump `registryVersion` from `6` to `7`. Each fixed finding gets full documentation: status, comments explaining what changed, expected/actual behavior, verification stamp.

**Files:** `src/data/ui-audit-findings.ts`

---

### Summary of files changed
- `src/services/supabase-data.ts` — Add message limit guard + remove `as any` casts
- New migration SQL — `save_scenario_atomic` RPC for transactional saves
- `src/components/chronicle/ChatInterfaceTab.tsx` — Pass day/time to goal evaluation
- `supabase/functions/evaluate-goal-progress/index.ts` — Include day/time in AI prompt
- `src/components/chronicle/WorldTab.tsx` — Wire currentDay/currentTimeOfDay props
- `src/data/ui-audit-findings.ts` — Mark 4 findings fixed with documentation, bump version

