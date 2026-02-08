
# Fix: Steps Still Not Generated and Placeholder Labels Not Renamed

## Root Cause Analysis

### Problem 1: Steps Never Generated
The edge function prompt **does** contain the `new_steps` instruction and the response format example includes `new_steps`. However, the AI is still not including `new_steps` in its output. The root cause is a **contradicting example** at line 227 in the prompt:

```
goals.Explore Rock Climbing = "desired_outcome: ... | current_status: ... | progress: 5"
```

This "desire as a goal" example has NO `new_steps`, directly contradicting the mandatory rule. LLMs prioritize examples over instructions -- when one example shows `new_steps` and another omits it, the model sees it as optional. This example needs to include `new_steps`.

Additionally, the user prompt message (line 354) says "extract ALL character state changes" but doesn't reinforce the steps requirement. A reminder in the user message will strengthen compliance.

### Problem 2: Placeholder Labels Not Renamed
Looking at Image 2: the VALUES have been correctly updated (e.g., "Nurturing and protective, especially towards her family") but the LABELS remain as "Trait 1", "Trait 2", "Trait 3". 

This happens because:
1. The AI sees `Trait 1: (some value)` in the character state block (line 123)
2. It outputs `sections.Personality.Trait 1 = "Nurturing and protective..."` -- using the same label it was given
3. The client merge code (line 578) matches by label and updates the value, but never changes the label itself
4. The placeholder detection rule only covers placeholder VALUES, not placeholder LABELS

The fix needs BOTH a prompt change (tell AI to use descriptive labels) AND a client-side change (rename placeholder labels when updating them).

---

## Fix 1: Edge Function Prompt Updates

**File: `supabase/functions/extract-character-updates/index.ts`**

### A) Fix the contradicting desire example (line 227)

Add `new_steps` to the desire example so ALL examples consistently include steps:

```
goals.Explore Rock Climbing = "desired_outcome: ... | current_status: ... | progress: 5 | new_steps: Step 1: Research local climbing gyms... Step 2: Visit the nearest gym..."
```

### B) Add placeholder LABEL detection rules

Add to the STALENESS CORRECTION section (after line 279):

```
- If a custom section item has a PLACEHOLDER LABEL (e.g., "Trait 1", "Trait 2", "Item 1", or any generic numbered label), 
  you MUST use a DESCRIPTIVE label instead. Example: Instead of "sections.Personality.Trait 1 = Nurturing", 
  use "sections.Personality.Nurturing Nature = Nurturing and protective...".
- NEVER use generic labels like "Trait 1", "Trait 2", "Item 1", "Item 2" in your output.
```

### C) Add step reminder in user message (line 354)

Change the user message from:
```
Analyze this dialogue and extract ALL character state changes. Remember: Phase 2 (reviewing existing state) is MANDATORY.
```
to:
```
Analyze this dialogue and extract ALL character state changes. Remember: Phase 2 (reviewing existing state) is MANDATORY. For EVERY goal (new or existing with <3 steps), you MUST include new_steps.
```

---

## Fix 2: Client-Side Placeholder Label Replacement

**File: `src/components/chronicle/CharacterEditModal.tsx`**

When the AI sends a new descriptive label (e.g., `sections.Personality.Nurturing Nature`) and no existing item matches that label, but the section contains items with placeholder labels (matching pattern `/^(trait|item|entry|row)\s*\d+$/i`), the merge logic should replace the first unused placeholder item instead of creating a new one.

At lines 577-589, add detection logic:

```typescript
const section = updatedSections[sectionIndex];
const itemIndex = section.items.findIndex(i => i.label.toLowerCase() === itemLabel.toLowerCase());

if (itemIndex === -1) {
  // Check for placeholder labels to replace
  const placeholderPattern = /^(trait|item|entry|row|example|placeholder)\s*\d*$/i;
  const placeholderIdx = section.items.findIndex(i => placeholderPattern.test(i.label.trim()));
  
  if (placeholderIdx !== -1) {
    // Replace the placeholder item with the new descriptive label and value
    section.items[placeholderIdx] = { 
      ...section.items[placeholderIdx], 
      label: itemLabel, 
      value, 
      updatedAt: now() 
    };
  } else {
    // No placeholder found, create new item
    section.items.push({ id: uid('item'), label: itemLabel, value, createdAt: now(), updatedAt: now() });
  }
} else {
  section.items[itemIndex] = { ...section.items[itemIndex], value, updatedAt: now() };
}
```

This ensures that when the AI sends descriptive labels, they replace placeholder items rather than duplicating entries.

---

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/extract-character-updates/index.ts` | Fix contradicting desire example, add placeholder label rules, add step reminder in user message |
| `src/components/chronicle/CharacterEditModal.tsx` | Add placeholder label detection and replacement in section merge logic |

## Expected Behavior After Fix

1. ALL new goals will include 5-8 narrative steps (no contradicting examples remain)
2. Existing goals with fewer than 3 steps get additional steps proposed
3. Placeholder labels like "Trait 1" get replaced with descriptive labels like "Nurturing Nature"
4. The user message reinforces the mandatory steps requirement
