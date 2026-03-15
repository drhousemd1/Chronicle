

# Pass 13b: Kill Forced Multi-Character Dialogue

## The Problem

Line 724-734 in `llm.ts` — the PARAGRAPH TAGGING rule — includes an example that alternates `Ashley: → Caleb: → Ashley:` across 3 paragraphs. This directly teaches the model to ping-pong between characters every response. It contradicts the BLOCK COUNT CAP rule 45 lines above it.

The model sees a concrete example of alternating speakers and follows the example over the abstract rule. Examples always win over rules in LLM prompting.

## Changes

### 1. Rewrite PARAGRAPH TAGGING — `src/services/llm.ts`

Replace the current rule + example with one that reinforces single-character focus:

```
- PARAGRAPH TAGGING (MANDATORY):
    * EVERY paragraph MUST begin with a speaker tag: "CharacterName:"
    * Default: ALL paragraphs tagged with the SAME character (the focal character).
    * A second character tag is ONLY permitted when that character's reaction CHANGES the scene direction.
    * WRONG (forced ping-pong):
      Ashley: *She looked at him.*
      James: *He nodded.*
      Ashley: "Okay."
    * RIGHT (single focus):
      Ashley: *She looked at him, catching the subtle nod.* "Okay."
```

The example now shows how to fold a secondary character's minor reaction INTO the focal character's narration instead of giving them a separate block.

### 2. Add explicit "silence is valid" rule — `src/services/llm.ts`

Add after BLOCK COUNT CAP:
```
* Characters with NOTHING MEANINGFUL to contribute MUST stay silent. 
  A nod, smile, or filler line is NOT meaningful. Omit them entirely.
  Only include a character when they ADVANCE the scene.
```

### 3. Compress MULTI-CHARACTER RESPONSES — `src/services/llm.ts`

Cut lines 735-740 down to a cross-reference: "See BLOCK COUNT CAP and PARAGRAPH TAGGING above for multi-character formatting." The current section's example (`Sarah: *The woman walked in...*`) encourages adding characters.

### Files Changed
- `src/services/llm.ts` — rewrite paragraph tagging example, add silence rule, compress multi-character section

