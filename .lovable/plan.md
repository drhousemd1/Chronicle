

## Fix: AI Generating Extended Multi-Character Back-and-Forth

### Problem
The screenshots show single AI responses containing 8-9 alternating character-tagged blocks (Ashley → Sarah → Ashley → Sarah...). The prompt currently has no cap on how many character blocks per response, and several rules actively encourage this:

1. **DIALOGUE REQUIREMENTS** says "sometimes several rapid exchanges" — the model interprets this as license for 8+ blocks
2. **STRUCTURE VARIETY GUARD** lists "Dialogue-heavy: Multiple rapid exchanges with minimal narration between" as a valid shape
3. **PARAGRAPH TAGGING** says "EVERY paragraph must begin with a speaker tag" — combined with multi-character rules, this encourages a ping-pong pattern
4. **Paragraph caps** (1-3 for balanced) count paragraphs, but each tagged block is treated as a separate paragraph — so 8 short tagged blocks "technically" fit

### Root Cause
The prompt is bloated with overlapping rules that individually make sense but collectively create contradictions and over-specification. The model gets lost in the noise. Key issues:

- **DIALOGUE REQUIREMENTS**, **STRUCTURE VARIETY GUARD**, and **ANTI-REPETITION PROTOCOL → RESPONSE SHAPE VARIATION** all say overlapping things about structure
- **TURN PROGRESSION CONTRACT** and **PROACTIVE NARRATIVE DRIVE** overlap heavily (both say "take initiative, don't be passive")
- **FORWARD MOMENTUM** and **NO REHASH/NO REPHRASE** overlap (both say "don't repeat what was said")
- No explicit **per-response block count cap** for multi-character scenes

### Plan — Declutter + Add Block Cap (single file: `src/services/llm.ts`)

**1. Add explicit block count cap to MULTI-CHARACTER RESPONSES (~line 872)**
- Add: "Each AI response should contain 1-3 character blocks total (max 4 for detailed mode). A 'block' is one character's continuous section. Do NOT write extended back-and-forth conversations between characters in a single response."
- This is the single most impactful fix — directly caps the ping-pong.

**2. Tighten DIALOGUE REQUIREMENTS (~line 452)**
- Remove "sometimes several rapid exchanges" — this is what's causing the 8-block outputs.
- Replace with: "Dialogue should feel natural within the paragraph cap. Multi-character responses split blocks across characters, not extend them."

**3. Trim STRUCTURE VARIETY GUARD (~line 479)**
- Remove "Dialogue-heavy: Multiple rapid exchanges with minimal narration between" as a valid shape — it directly contradicts paragraph caps.
- Keep the other shapes (action-led, decision beat, environmental shift, surprise).

**4. Merge overlapping rules to reduce prompt size**
- Fold **PROACTIVE NARRATIVE DRIVE** (~line 422) into **TURN PROGRESSION CONTRACT** (~line 462) — they say the same thing. Delete the standalone PROACTIVE NARRATIVE DRIVE block and keep its banned-phrases list as a sub-bullet under TURN PROGRESSION.
- Fold **RESPONSE SHAPE VARIATION** from ANTI-REPETITION (~lines 569-582) into **STRUCTURE VARIETY GUARD** — they're the same rule stated twice. Remove the RESPONSE SHAPE VARIATION sub-section from anti-repetition entirely.
- Remove **NO REHASH** from forwardProgressRules (~line 622) — it duplicates the existing rule in FORWARD MOMENTUM (~line 394) about not re-describing. Keep the FORWARD MOMENTUM version.

**5. Update style hints**
- Remove `'[Style: rapid-fire dialogue exchange, no narration between lines]'` from concise hints — directly encourages the ping-pong.
- Remove `'[Style: weave multiple characters acting simultaneously — no waiting turns]'` from detailed hints — same issue.

**6. Update documentation** in `docs/guides/edge-functions-ai-services-structure-guide.md`
- Add bug #17 entry for multi-character block flooding
- Note the prompt declutter/consolidation

### What This Does NOT Change
- Control rules, scene presence, line of sight — untouched
- Backend/edge functions — untouched  
- NSFW/verbosity/realism rules — untouched
- Runtime anti-loop detectors — untouched
- Paragraph tagging system — untouched (tags are fine, just need block caps)

