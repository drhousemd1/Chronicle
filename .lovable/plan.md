

# Fix: Break Repetitive Response Structure

## What's Changing

Three targeted changes across two files to break the monotonous response pattern, incorporating both the original plan and Grok's best suggestions (concrete examples and runtime style hints).

## Changes

### 1. Update Dialogue Requirements (`src/services/llm.ts`, lines 237-243)

Replace the rigid "at least one line" rule with flexible guidance:

```
- DIALOGUE REQUIREMENTS:
    * Almost every response should contain spoken dialogue (text in quotes),
      but a rare action-only or thought-only beat is acceptable when it fits.
    * Vary how much dialogue appears: sometimes one line, sometimes several
      rapid exchanges. Match the scene's energy.
    * Focus on external dialogue, but ensure actions and internal thoughts
      occur naturally where appropriate.
    * AVOID predictable patterns - do NOT always place dialogue in the same
      position or use the same amount every time.
```

### 2. Add Response Shape and Variation Examples to Anti-Repetition Protocol (`src/services/llm.ts`, after line 287)

Add two new subsections -- structural rules plus concrete do/don't examples (Grok's suggestion):

```
* RESPONSE SHAPE & LENGTH:
  - Match response length to the moment. A quick reply = short response.
    A dramatic reveal = more detail. Do NOT pad with filler.
  - A single sentence or two can be a complete response if that's all the scene needs.
  - FORBIDDEN PATTERN: Do not repeatedly produce the same layout
    (e.g., [narration block] -> [single dialogue line] -> [narration block]).
    Vary where dialogue appears and how much narration surrounds it.
  - Vary the speech-to-narration ratio between responses:
    * Sometimes mostly dialogue with brief action beats
    * Sometimes a short narration-only beat before a spoken line
    * Sometimes rapid back-and-forth with minimal description
  - Do NOT default to long responses. Brevity is powerful.

* VARIATION EXAMPLES (for inspiration - do NOT copy directly):
  - Short: "Hey, what's up?" She grinned, tilting her head.
  - Dialogue-heavy: "Wait, really?" he asked. "Yeah, totally," she replied. "But why now?"
  - Narration-focused: Her heart raced as the door creaked open -- no words needed in that frozen moment.
  - Mixed: She whispered, "Come closer," her thoughts swirling. Then she pulled him in.
  - AVOID: Always starting with narration, always ending with thoughts, or using equal-length blocks every time.
```

### 3. Add Brevity Reinforcement (`src/services/llm.ts`, ~line 481)

After "Keep responses immersive, descriptive, and emotionally resonant":

```
- BREVITY IS WELCOME: Write only as much as the moment needs. Short, punchy
  responses are just as valid as longer descriptive ones. Never pad for length.
```

### 4. Add Runtime Style Hints (Grok's suggestion) (`src/services/llm.ts`, ~line 526)

Before sending the user message, randomly append a subtle style nudge from a rotating list. This ensures each request gets a fresh structural hint, fighting pattern entrenchment at the code level:

```typescript
const styleHints = [
  '[Style: lean into dialogue this time, keep narration minimal]',
  '[Style: try a shorter response -- punchy and direct]',
  '[Style: lead with action or speech, not narration]',
  '[Style: mix several short dialogue exchanges with brief action beats]',
  '[Style: try a different paragraph structure than your last response]',
  '[Style: focus on one vivid sensory detail rather than broad description]',
  '[Style: let the character pause or hesitate -- less is more]',
  '[Style: open with dialogue, weave action through it]',
];
const hint = styleHints[Math.floor(Math.random() * styleHints.length)];
```

This hint gets appended to the user message content, so it's a fresh nudge every turn without bloating the system prompt.

### 5. Add Temperature Parameter (`supabase/functions/chat/index.ts`)

Currently no temperature is set, so the API uses its default. Add `temperature: 0.9` to both the Lovable and xAI API calls to boost creativity and reduce pattern adherence. This is a subtle but effective lever.

## Files Changed

| File | Change |
|------|--------|
| `src/services/llm.ts` | Update dialogue requirements, add response shape rules with examples, add brevity reinforcement, add runtime style hints |
| `supabase/functions/chat/index.ts` | Add `temperature: 0.9` to API request bodies |

## What This Does NOT Do

- No strict word/paragraph min/max counts
- No formulaic template rotation
- No prompt chaining or second API calls (overkill)

## Expected Behavior

- Responses vary naturally in length (1 sentence to ~2 paragraphs)
- Dialogue placement shifts between responses
- The rigid "gray block, white line, gray block" pattern breaks
- Each request gets a fresh structural nudge via the random style hint
- Higher temperature adds natural variety to word choice and structure

