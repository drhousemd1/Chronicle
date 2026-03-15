

## Problem Diagnosis

The screenshots show 5 consecutive regenerations producing the **exact same structure**: Ashley block → Sarah block → Ashley block → Sarah block → Ashley block. Every time. The content varies slightly but the pattern, block count, and emotional loop are identical.

The core issue is **not the system prompt wording**. The prompt already says "default to 1 block." The model is ignoring it because:

1. **The PARAGRAPH TAGGING rule says "EVERY paragraph must begin with a speaker tag"** — this implicitly tells the model to produce multiple tagged sections. Combined with 2 AI characters in the scene, it naturally alternates between them.

2. **No runtime enforcement exists.** The anti-loop directive detects question repetition, structural triads, and passivity — but has **zero detection for multi-character ping-pong** (the exact problem). The model breaks the block cap rule and nothing catches it.

3. **The prompt is ~4,000+ tokens of INSTRUCTIONS alone.** The block cap rule at line 847 is buried deep inside a wall of rules after control, scene presence, formatting, line-of-sight, anti-repetition, NSFW, verbosity, realism, paragraph tagging, and naming rules. By the time the model reaches it, attention weight is minimal.

4. **No "measurable progress" is happening because both characters are emotional-reaction loops.** Ashley vents → Sarah comforts → Ashley vents more → Sarah comforts more. Each block technically has a "scene delta" (a new tear, a hand on a knee) but nothing actually changes.

## Plan — Two-Pronged Fix

### Prong 1: Runtime ping-pong detector in `ChatInterfaceTab.tsx` (~line 649)

Add a new detector to `getAntiLoopDirective()` that counts character blocks in the last AI response. If it finds 3+ blocks alternating between the same 2 characters, inject a hard directive:

```
[ANTI-PING-PONG: Your last response alternated between the same two characters 
across 5 blocks. This turn, write from ONE character's perspective only. 
Other characters may be mentioned in narration but do NOT get their own tagged block. 
Advance the scene: reveal new information, make a decision, or change the physical situation.]
```

This is a **code-level** fix — not a prompt rule the model can ignore.

### Prong 2: Restructure prompt rule ordering in `src/services/llm.ts`

Move the **BLOCK COUNT CAP** and **TURN PROGRESSION CONTRACT** to the TOP of the INSTRUCTIONS block, immediately after the priority hierarchy (line 787). Currently they're buried at lines 440 and 847 respectively. The model pays most attention to:
- The beginning of the system prompt
- The end of the system prompt  
- The user message

Rules buried in the middle of a 4K-token instruction block get the least attention weight.

Specifically:
1. Move the BLOCK COUNT CAP from inside MULTI-CHARACTER RESPONSES (line 847) to right after the priority hierarchy (line 796), as a standalone top-level rule.
2. Move TURN PROGRESSION CONTRACT (line 440) to immediately after the block count cap.
3. This puts the two most critical rules — "how many blocks" and "what qualifies as progress" — in the highest-attention position.

### Prong 3: Add emotional-loop detector to `getAntiLoopDirective()`

Detect when the last 2+ AI responses are dominated by emotional-reaction words without action verbs that change the situation. The existing passive detector checks for "watched/observed" but not for "sobbed/trembled/murmured/whispered/shuddered" emotional-stasis words. Add a pattern that catches this and injects:

```
[ANTI-STAGNATION: Recent responses are emotional reactions without scene change. 
Something EXTERNAL must happen now: a phone rings, someone enters, a decision 
is made, a character physically moves to a new position or activity. 
Emotional processing is NOT forward movement.]
```

### Files Changed
- `src/services/llm.ts` — reorder INSTRUCTIONS block (move block cap + progression contract to top)
- `src/components/chronicle/ChatInterfaceTab.tsx` — add ping-pong detector and emotional-loop detector to `getAntiLoopDirective()`
- `docs/guides/edge-functions-ai-services-structure-guide.md` — document Pass 12

### What This Does NOT Change
- No new prompt rules added (just reordered existing ones)
- No changes to backend/edge functions
- No changes to character data, story arc serialization, or memory system

