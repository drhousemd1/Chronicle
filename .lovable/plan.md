

## Problem Diagnosis

The block cap of "1-3 character blocks" is being treated as a **hard target** rather than a maximum. The model writes exactly 3 Ashley blocks + 2 Sarah blocks every single time — shallow ping-pong dialogue where nobody says anything meaningful. The paragraph caps (1-3 for balanced) don't clarify they apply to **total response length**, so the model interprets each short tagged block as fitting within the cap.

The core issues:
1. **"1-3 blocks" reads as "aim for 3"** — the model fills the quota every time
2. **Paragraph caps and block caps are ambiguous together** — the model treats each character block as a separate paragraph, so 5 short blocks "technically" fit
3. **No quality gate per block** — nothing says a 2-line reaction doesn't count as a valid block
4. **TURN PROGRESSION CONTRACT says "advance a goal" but doesn't say HOW MUCH** — a single vague dialogue line technically "advances" a goal

## Plan (single file: `src/services/llm.ts`)

### 1. Rewrite BLOCK COUNT CAP (~line 841) to make 1 the default

Current: "1-3 character blocks total (max 4 for detailed)"
Replace with:

```
* BLOCK COUNT CAP (MANDATORY): Default to 1 character block per response — 
  one character acts/speaks, others are referenced in narration if needed.
  Use 2 blocks when a second character's REACTION meaningfully changes the 
  scene (not just acknowledging). Use 3 blocks ONLY for pivotal moments 
  (reveals, confrontations, major decisions). Detailed mode allows max 3.
  A block of 1-2 reaction lines does NOT justify its own section — fold 
  brief reactions into the acting character's narration instead.
  NEVER alternate the same two characters back-and-forth across 3+ blocks.
```

### 2. Clarify paragraph caps apply to TOTAL response (~lines 672, 686, 693)

Add to each verbosity level: "Paragraph caps count TOTAL paragraphs across ALL character blocks combined. A 2-block response with 2 paragraphs each = 4 paragraphs = OVER CAP for balanced mode."

### 3. Strengthen TURN PROGRESSION CONTRACT goal advancement (~line 441)

Change "advance at least one active goal" to include a quality bar:

```
* Every response must make MEASURABLE PROGRESS on at least one active goal — 
  a new step completed, information revealed, relationship dynamic shifted, 
  or obstacle encountered. Vague dialogue that circles around a topic without 
  changing anything does NOT count as advancement.
```

### 4. Update style hints

Remove `'[Style: mix several short dialogue exchanges with brief action beats]'` from balanced hints — it encourages the multi-block pattern. Replace with something like `'[Style: one character drives this beat — others react briefly in narration]'`.

### 5. Documentation

Update `docs/guides/edge-functions-ai-services-structure-guide.md` — note Pass 11 fix for block-count-as-target and paragraph cap clarification.

