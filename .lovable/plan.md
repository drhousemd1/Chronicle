

# Fix Three Issues: Persistent Tooltip, Poor AI Update Quality, and Slow Session Resume

## Issue 1: Persistent Tooltip on "AI Update" Button

**Root Cause:** The `TooltipProvider` with `delayDuration={300}` is wrapping only the AI Update button inside the `DialogHeader`. When the dialog opens, the tooltip renders in an "open" state because of how Radix tooltip interacts with dialog focus management. The dialog steals focus on mount, and the tooltip interprets this as a hover/focus event.

**Fix:** Change the tooltip to only show on explicit hover by using `delayDuration={500}` and, more importantly, adding `disableHoverableContent` to prevent the tooltip from staying open. Additionally, move the `TooltipProvider` to wrap the entire dialog (or remove it entirely since there is already a top-level `TooltipProvider` in the app). The core fix is to use `open` state controlled by mouse events rather than relying on the default focus-based trigger inside a dialog.

**File:** `src/components/chronicle/CharacterEditModal.tsx`

Changes:
- Remove the local `TooltipProvider` wrapping the button (the app already has a global one)
- Switch to a manually-controlled tooltip using `onMouseEnter`/`onMouseLeave` state so that it ONLY shows on actual mouse hover, not on dialog focus events
- Add `pointer-events-none` to `TooltipContent` to prevent hovering the tooltip itself from keeping it open

---

## Issue 2: Poor AI Update (Deep Scan) Quality

This is the most significant issue. The extraction edge function's system prompt has several fundamental problems causing the AI to create random containers, ignore the goals section structure, and generate "Session Summary" / "Plans" instead of proper goals.

**Root Causes:**

1. **The prompt explicitly instructs the AI to create "Session Summary" sections** (lines 168-171 of the edge function). This is why it keeps generating `sections.Session Summary.Current Situation`, `sections.Session Summary.Recent Events`, and `sections.Session Summary.Active Goals` -- the prompt literally tells it to.

2. **Goals are treated as a flat string format** (`goals.GoalTitle = "status | progress: XX"`) but the system prompt doesn't explain the full goal structure (desired outcome, milestone steps). The AI has no idea these fields exist, so it only fills `currentStatus` and `progress`.

3. **The prompt encourages creating new custom sections** for any character fact, secret, or backstory (Rule 9: "For new character facts, goals, secrets, or backstory revealed in dialogue, create appropriate entries"). This is why it creates random one-liner containers like "Plans", "Fantasies", etc. instead of grouping into existing sections.

4. **No instruction to prefer updating existing sections** over creating new ones. The AI defaults to creating new sections for every piece of information.

5. **No instruction to update stale information** -- the "Secrets" example still says "unbeknownst to Ashley" because the prompt says "Do NOT repeat current values if they haven't changed" but doesn't tell the AI to check if current values have become INACCURATE.

**Fix -- Rewrite the edge function's system prompt with these changes:**

| Problem | Solution |
|---------|----------|
| Session Summary being auto-generated | Remove the "SESSION SUMMARY" section entirely from the prompt. Session summaries add noise and duplicate what goals already track. |
| Goals missing desired outcome / milestones | Expand the goals format to: `goals.GoalTitle = "desired_outcome: X \| current_status: Y \| progress: Z"` so the AI fills all three fields |
| Random one-liner containers | Add explicit rule: "PREFER updating existing sections over creating new ones. Only create a new section if no existing section is a reasonable fit." |
| Stale information not updated | Add rule: "If current stored values are CONTRADICTED by the dialogue, update them even if the exact topic isn't newly mentioned." |
| "Plans" instead of "Goals" | Add explicit instruction: "Character objectives, plans, ambitions, and intentions should ALWAYS use the goals field, NEVER create a custom section for plans/objectives/ambitions." |

**Files:**
- `supabase/functions/extract-character-updates/index.ts` -- Rewrite the system prompt
- `src/components/chronicle/CharacterEditModal.tsx` -- Update the deep scan's goal parsing to handle the new format with `desired_outcome`

**New goals format in the prompt:**
```
GOALS TRACKING:
- goals.GoalTitle = "desired_outcome: What success looks like | current_status: Latest progress description | progress: XX"
  Examples:
  - goals.Move Out of City = "desired_outcome: Find affordable apartment downtown | current_status: Found apartment listings online | progress: 15"
  - goals.Get Promoted = "desired_outcome: Become team lead by year end | current_status: Completed the training program | progress: 60"
```

**New rules to add:**
```
SECTION MANAGEMENT RULES:
- ALWAYS prefer updating items in EXISTING sections over creating new sections
- Character objectives, plans, ambitions, and intentions MUST use "goals." format, NEVER "sections.Plans" or similar
- Only create a new custom section if the information genuinely doesn't fit any existing section
- If a section already exists with a similar name (e.g., "Background" vs "Backstory"), use the existing one
- NEVER create a "Session Summary" section - this is not a valid section type
- When information could be a goal (has a desired end state or objective), it MUST be a goal, not a section item

STALENESS CORRECTION:
- If a stored value is CONTRADICTED by the dialogue (e.g., a secret says "unbeknownst to X" but X now knows), UPDATE it
- Check existing custom section items for accuracy against the current dialogue context
- Correct outdated information even if the topic isn't directly being discussed
```

**Updated goal parsing on the frontend** (both in `CharacterEditModal.tsx` deep scan handler and in the edge function response handling):
- Parse `desired_outcome:` from the value string and map it to the `desiredOutcome` field on the `CharacterGoal` object
- Parse `current_status:` from the value string for the `currentStatus` field
- Keep the `progress:` parsing as-is

---

## Issue 3: Slow Session Resume from Chat History

**Root Cause:** `handleResumeFromHistory` makes 3 sequential async calls with no timeout, no loading indicator, and no parallelization:
1. `fetchScenarioById(scenarioId)` -- fetches scenario + ALL conversation messages (even ones we don't need)
2. `fetchConversationThread(conversationId)` -- re-fetches messages for the specific conversation
3. `fetchSideCharacters(conversationId)` -- fetches side characters

The first call (`fetchScenarioById`) loads ALL conversations with ALL their messages, which is wasteful since we only need the one specific conversation the user clicked on.

**Fix:**
1. Use `fetchScenarioForPlay` instead of `fetchScenarioById` -- this skips loading all conversation messages
2. Fetch the specific conversation thread and side characters in parallel (not sequentially)
3. Add the `withTimeout` wrapper to each call
4. Add `isResuming` loading state for immediate visual feedback
5. Show a loading overlay so the user knows something is happening

**File:** `src/pages/Index.tsx`

Changes:
```
async function handleResumeFromHistory(scenarioId, conversationId) {
  setIsResuming(true);
  try {
    // Use fetchScenarioForPlay (skips loading all messages) + thread + side chars in parallel
    const [scenarioResult, thread, sideCharacters] = await Promise.all([
      withTimeout(fetchScenarioForPlay(scenarioId), 15000, null, 'scenario'),
      withTimeout(fetchConversationThread(conversationId), 15000, null, 'thread'),
      withTimeout(fetchSideCharacters(conversationId), 15000, [], 'sideChars'),
    ]);
    
    // ... set state and navigate to chat
  } finally {
    setIsResuming(false);
  }
}
```

Also add a loading overlay in the JSX when `isResuming` is true.

---

## Summary of Files to Modify

| File | Changes |
|------|---------|
| `src/components/chronicle/CharacterEditModal.tsx` | Fix tooltip (mouse-only hover), update goal parsing for new format |
| `supabase/functions/extract-character-updates/index.ts` | Rewrite system prompt to fix goal structure, remove Session Summary, add section management rules, add staleness correction |
| `src/pages/Index.tsx` | Optimize `handleResumeFromHistory` with parallel fetching, timeouts, and loading state |

