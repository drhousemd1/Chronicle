
# Fix: Steps Not Generated and Personality Not Updated by AI Update

## Root Cause Analysis

### Problem 1: Steps Never Generated
The extraction AI returns goals with `desired_outcome`, `current_status`, and `progress` but never includes `new_steps` in its output. This happens because:

1. The response format example (line 299 of the edge function) shows a goal WITHOUT any `new_steps` -- the AI mimics examples more than instructions
2. No explicit mandatory rule states "ALWAYS propose new_steps for every goal"
3. The `gemini-2.5-flash-lite` default model may lack the capacity for this complex multi-format output

### Problem 2: Placeholder Personality Not Updated
The character has "trait one, trait two, trait three" in custom sections. The AI doesn't update these because:
1. Placeholder text isn't "contradicted" by dialogue -- it's just empty/generic
2. The prompt tells the AI to correct "stale" data but doesn't tell it to replace obvious placeholder content

---

## Fix 1: Update Extraction Prompt (Edge Function)

**File: `supabase/functions/extract-character-updates/index.ts`**

### A) Make `new_steps` mandatory for ALL goal updates

Add an explicit rule in the GOALS section after the format description (around line 209):

```
MANDATORY: When creating a NEW goal, you MUST include new_steps with 5-8 narrative-quality steps.
When UPDATING an existing goal that has fewer than 3 steps, propose additional new_steps to flesh it out.
```

### B) Update the response format example to include `new_steps`

Change the example at line 299 from:
```json
{ "character": "CharacterName", "field": "goals.Save Enough Money", "value": "desired_outcome: ... | current_status: ... | progress: 10" }
```
to:
```json
{ "character": "CharacterName", "field": "goals.Save Enough Money", "value": "desired_outcome: ... | current_status: ... | progress: 10 | new_steps: Step 1: Research high-yield savings accounts and compare interest rates to find the best option for building an emergency fund. Step 2: Set up automatic transfers from checking to savings each payday, starting with a comfortable amount that doesn't cause financial strain. Step 3: Track monthly spending to identify areas where expenses can be reduced, redirecting savings toward the emergency fund goal." }
```

### C) Add placeholder detection rule

Add to the STALENESS CORRECTION section:
```
- If a stored value contains obvious PLACEHOLDER text (e.g., "trait one", "trait two", "example text", or generic filler), treat it as EMPTY and generate real content based on dialogue context.
- Replace any generic or template-style values with specific, dialogue-informed content.
```

### D) Upgrade default model

Change the default model from `gemini-2.5-flash-lite` (line 313) to `gemini-2.5-flash`. The lite model struggles with the complex multi-field extraction format. The standard flash model handles structured output much more reliably.

### E) Add `max_tokens` parameter

Add `max_tokens: 8192` to the API request body (line 345-352) to prevent output truncation on long extractions with multiple characters and goals.

---

## Fix 2: Update Deep Scan in CharacterEditModal

**File: `src/components/chronicle/CharacterEditModal.tsx`**

### A) Upgrade model for deep scan

The deep scan call at line 420 sends `modelId: modelId || 'gemini-2.5-flash'`. This is already correct (using standard flash, not lite). No change needed here.

### B) Add logging for step parsing

Add console.log statements inside the goal merge logic (around line 498-508) to log when `new_steps` are parsed and how many are added. This helps debug future issues without needing to check edge function logs.

---

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/extract-character-updates/index.ts` | Update prompt: mandatory new_steps rule, fix response example, add placeholder detection, upgrade default model to flash, add max_tokens |
| `src/components/chronicle/CharacterEditModal.tsx` | Add debug logging for step parsing in deep scan merge |

## Expected Behavior After Fix

1. When the AI creates a new goal, it will include 5-8 narrative steps
2. When updating an existing goal with fewer than 3 steps, it will propose additional steps
3. Placeholder text like "trait one, trait two" will be detected and replaced with real content from dialogue
4. Output will not be truncated thanks to the increased max_tokens limit
5. The standard flash model provides more reliable structured output than flash-lite
