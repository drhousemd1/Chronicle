

# Fix: Steps Only 2 Instead of 5-8 and Traits Still Not Updated

## Root Cause Analysis

### Problem 1: Only 2 Steps Per Goal

The edge function logs confirm the AI generates `new_steps` but only 2 per goal. Here's the chain of failure:

1. The character state block sent to the AI includes goals with `complete_steps: 1, 2` already referenced
2. The AI interprets this as "Steps 1-2 already exist" and only generates continuation Steps 3-4
3. But the CLIENT doesn't actually have these goals on the character card yet -- they're brand new
4. When the client creates the goal, it only gets the 2 continuation steps, not a full 5-8

The fix: Change the prompt to require that `new_steps` ALWAYS contain the COMPLETE journey of 5-8 steps, numbered from Step 1. The AI should output ALL steps (past, present, future), and the client uses `complete_steps` to mark which ones are done. This eliminates the gap between what the AI thinks exists and what the client has.

### Problem 2: Personality Traits Never Updated

Looking at the 28 extracted updates in the logs, there are ZERO `sections.Personality.*` entries. The AI didn't generate any personality updates at all. The client-side placeholder replacement code works correctly, but it never fires because there's nothing to replace.

The fix: Add an explicit "PLACEHOLDER SCAN" phase to the prompt that forces the AI to examine every custom section item and output a replacement if the label or value is a placeholder. Make it a numbered step in the mandatory process, not just a passive rule.

---

## Fix 1: Edge Function Prompt Changes

**File: `supabase/functions/extract-character-updates/index.ts`**

### A) Rewrite the new_steps instruction (line 206-211)

Change the `new_steps` description to make clear that steps must ALWAYS be a complete list:

```
- goals.GoalTitle = "desired_outcome: ... | current_status: ... | progress: XX | complete_steps: 1,3 | new_steps: Step 1: ... Step 2: ... Step 3: ... Step 4: ... Step 5: ..."
  IMPORTANT: Always include desired_outcome, current_status, and progress for every goal update.
  Use complete_steps to mark step numbers (1-indexed) that were achieved in the dialogue.
  
  new_steps RULES (CRITICAL - READ CAREFULLY):
  - new_steps must contain the COMPLETE list of ALL steps for the goal, numbered from Step 1
  - Include BOTH already-completed steps AND future steps in new_steps
  - The total count must be 5-8 steps that map the FULL journey from start to desired outcome  
  - Do NOT only include "continuation" steps -- always include the full plan from Step 1
  - Use complete_steps to indicate which of these steps are already done
  - Every goal update MUST include new_steps with 5-8 steps. No exceptions.
```

### B) Update the example goal (line 306) to reinforce this pattern

The example already has 6 steps starting from Step 1 -- this is correct. No change needed here.

### C) Update the desire-as-goal example (line 227)

Verify this example also has 5+ complete steps starting from Step 1. Based on the current code, it already has 6 steps -- good.

### D) Add PHASE 3 - PLACEHOLDER SCAN to mandatory process (after Phase 2, around line 191)

Add a new mandatory phase:

```
PHASE 3 - PLACEHOLDER SCAN (MANDATORY - DO NOT SKIP)
For EACH character, scan ALL custom section items:
- If an item has a placeholder LABEL (e.g., "Trait 1", "Trait 2", "Item 1") or a placeholder VALUE (e.g., "trait one", "example text", empty/generic filler):
  -> You MUST output a replacement using a DESCRIPTIVE label and a dialogue-informed value
  -> Example: If you see "Trait 1: trait one" in a Personality section, output:
     sections.Personality.Nurturing Nature = "Nurturing and protective, especially toward family members. Shows warmth through physical affection and verbal reassurance."
- Generate content based on what the dialogue reveals about the character's personality, background, or status
- This phase ensures no placeholder content survives a scan
```

### E) Strengthen the user message (line 356)

Add explicit mention of Phase 3:

```
Analyze this dialogue and extract ALL character state changes. Remember: Phase 2 (reviewing existing state) is MANDATORY. Phase 3 (placeholder scan) is MANDATORY -- check every custom section item for placeholder labels or values and replace them. For EVERY goal, new_steps must contain the FULL list of 5-8 steps starting from Step 1.
```

---

## Fix 2: Client-Side Step Deduplication

**File: `src/components/chronicle/CharacterEditModal.tsx`**

Since the AI will now always output ALL steps (including already-completed ones), the existing goal merge logic (lines 486-508) needs a small update for the EXISTING goal path:

When an existing goal already has steps and the AI sends a full new_steps list, we should REPLACE the entire step list rather than APPEND. This prevents duplicate steps.

At lines 498-508, change the logic:

```typescript
// Handle new_steps: If the AI provides a full step list, replace existing steps
if (newStepsMatch) {
  const newStepsRaw = newStepsMatch[1].trim();
  const stepEntries = newStepsRaw.split(/Step\s+\d+:\s*/i).filter(Boolean);
  console.log(`[deep-scan] Goal "${existingGoal.title}" - received ${stepEntries.length} steps from AI (full replacement)`);
  
  // Replace entire step list with AI's complete plan
  updatedSteps = [];
  for (const desc of stepEntries) {
    const trimmed = desc.trim().replace(/\|$/, '').trim();
    if (trimmed) {
      updatedSteps.push({ id: uid('step'), description: trimmed, completed: false });
    }
  }
  
  // Re-apply complete_steps marking on the fresh list
  if (completeStepsMatch) {
    const indices = completeStepsMatch[1].trim().split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
    for (const idx of indices) {
      if (idx >= 1 && idx <= updatedSteps.length) {
        updatedSteps[idx - 1] = { ...updatedSteps[idx - 1], completed: true, completedAt: now() };
      }
    }
  }
}
```

This means the complete_steps handling at lines 488-496 should be MOVED inside the newStepsMatch block (applied AFTER step replacement), rather than being processed independently before it.

---

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/extract-character-updates/index.ts` | Rewrite new_steps rules to require full 5-8 step lists; add Phase 3 placeholder scan; strengthen user message |
| `src/components/chronicle/CharacterEditModal.tsx` | Change existing goal step merge from append to replace; move complete_steps handling inside newStepsMatch block |

## Expected Behavior After Fix

1. Every goal (new or existing) will have 5-8 complete steps numbered from Step 1
2. The AI will scan ALL custom section items and replace any placeholder labels/values
3. "Trait 1", "Trait 2", "Trait 3" will be replaced with descriptive labels like "Nurturing Nature"
4. Existing goals that get updated won't accumulate duplicate steps

