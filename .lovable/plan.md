

# Enhance the Sparkle Icon: Precise vs Detailed Mode Selector

## Analysis of Current Implementation

The current sparkle (star) enhancement system works as a single-click action that always produces the same style of output -- a narrative sentence-based expansion. The prompt in `src/services/character-ai.ts` instructs the AI to produce "max N sentences" with instructions like "Describe hair color, style, and length concisely." This often produces verbose, narrative-style output ("Platinum Blonde, shoulder-length with soft waves, often tied back in a practical ponytail...") when the user may prefer concise tags ("Platinum blonde; Shoulder-length waves; Practical ponytail").

The same pattern exists in `src/services/world-ai.ts` for world/scenario fields.

**Key issues identified:**
- Only one output format (narrative sentences) -- no user control
- Prompts say "be concise" but still instruct sentence-based output
- No semicolon-separated tag mode exists
- The sparkle button fires immediately with no choice presented to the user

## Proposed Solution

When the user clicks the sparkle icon, show a small centered modal with two options: **Precise** and **Detailed**. Selecting one triggers the AI call with the appropriate prompt variant.

### 1. Create an Enhancement Mode Selector Modal

**New file: `src/components/chronicle/EnhanceModeModal.tsx`**

A small, centered dialog with two clickable cards:
- **Precise** -- "Short, semicolon-separated tags focusing on key attributes"
- **Detailed** -- "1-2 sentence vivid description for immersive roleplay"

The modal receives a callback `onSelect(mode: 'precise' | 'detailed')`, calls it, and closes.

### 2. Update the prompt system in `character-ai.ts`

**File: `src/services/character-ai.ts`**

- Add a `mode` parameter (`'precise' | 'detailed'`) to `aiEnhanceCharacterField`
- Create two prompt builder variants:
  - **Precise mode**: "Expand into 3-5 short semicolon-separated tags. Focus on visual or key attributes only. No sentences, no narrative, no rationale. Example: 'Platinum blonde; Shoulder-length waves; Practical ponytail; Soft highlights'"
  - **Detailed mode**: Current behavior (1-2 sentence vivid description), essentially unchanged from what exists now
- Update `buildCharacterFieldPrompt` to branch on mode
- For precise mode, add a post-processing step: trim output, ensure semicolon separation, remove trailing periods

### 3. Update the prompt system in `world-ai.ts`

**File: `src/services/world-ai.ts`**

- Add the same `mode` parameter to `aiEnhanceWorldField`
- Create matching precise/detailed prompt variants for world fields
- Precise mode for world fields: semicolon-separated key points instead of sentences

### 4. Wire up the modal in `CharactersTab.tsx`

**File: `src/components/chronicle/CharactersTab.tsx`**

- Add state for the modal: `enhanceModeTarget` (stores the pending field info -- fieldKey, section, getCurrentValue, setValue, customLabel)
- When sparkle is clicked, instead of calling `handleEnhanceField` directly, store the target and open the modal
- On mode selection, call `handleEnhanceField` with the chosen mode and close the modal
- Pass `mode` through to `aiEnhanceCharacterField`

### 5. Wire up the modal in `WorldTab.tsx`

**File: `src/components/chronicle/WorldTab.tsx`**

- Same pattern: sparkle click opens modal, mode selection triggers the AI call with chosen mode

### 6. Wire up the modal in `PersonalitySection.tsx` (sparkle on traits)

**File: `src/components/chronicle/PersonalitySection.tsx`**

- The `onEnhanceField` callback signature gains a `mode` parameter
- Parent components pass mode through

## Files to Create
- `src/components/chronicle/EnhanceModeModal.tsx`

## Files to Modify
- `src/services/character-ai.ts` -- add mode parameter, dual prompt variants
- `src/services/world-ai.ts` -- add mode parameter, dual prompt variants
- `src/components/chronicle/CharactersTab.tsx` -- intercept sparkle click with modal
- `src/components/chronicle/WorldTab.tsx` -- intercept sparkle click with modal
- `src/components/chronicle/PersonalitySection.tsx` -- pass mode through enhance callback

## Technical Details

### Precise Mode Prompt Template (Character Fields)
```
Expand the following character detail into 3-5 short tags separated by semicolons.
Focus on visual or key attributes only. No sentences, no explanations, no narrative rationale.

WORLD & SCENARIO CONTEXT:
{fullContext}

THIS CHARACTER'S EXISTING DATA:
{selfContext}

CURRENT VALUE: {currentValue}
FIELD: {label}

Output format: Tag1; Tag2; Tag3; Tag4
Return ONLY the semicolon-separated tags. Nothing else.
```

### Detailed Mode Prompt Template (Character Fields)
Essentially the current prompt, unchanged.

### Modal Design
- Uses existing `Dialog` component from `src/components/ui/dialog.tsx`
- Dark theme consistent with existing modals (bg-zinc-900 borders)
- Two side-by-side cards with icon, title, and one-line description
- Clicking either card immediately triggers the action and closes the modal
- No extra buttons needed -- the cards themselves are the actions

