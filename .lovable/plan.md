
Goal: fix repetitive “quote → action → thought” output and weak initiative without introducing one-off logic or changing core architecture.

Implementation scope (2 files only):
1) `src/services/llm.ts`
2) `src/components/chronicle/ChatInterfaceTab.tsx`

What’s causing the issue now:
- Prompt rules currently over-bias the model into a fixed template (strict formatting + dialogue requirements + heavy internal-thought guidance + examples that mirror the same shape).
- There is no hard “state change per turn” contract, so responses can stay emotionally descriptive but narratively static.
- Runtime anti-loop checks catch confirmation/deferral loops, but not structural repetition or low-initiative drift.
- Continue prompt currently says “wait for user response,” which can reinforce passive pacing.

Plan of changes:

1) Prompt-level momentum + variety contract (`llm.ts`)
- Add a new mandatory “TURN PROGRESSION CONTRACT” block:
  - Every response must introduce at least one concrete scene delta (decision, reveal, physical action, escalation, environment/event shift).
  - AI-controlled characters must initiate at least one proactive move each turn (not just react).
  - Questions are optional and capped (max 1), and cannot be the only forward movement.
- Add a “STRUCTURE VARIETY GUARD” block:
  - Explicitly forbid repeating the same output skeleton across consecutive turns, especially repeated `dialogue + action + thought` triads.
- Make thought usage optional/sparse:
  - Keep thought quality rules, but add frequency caps (e.g., concise/balanced: usually 0–1 thought blocks total; detailed: 0–2).
  - Clarify: include thoughts only when they add net-new strategic/desire insight.
- Update style-hint pools to diversify openings and pacing:
  - Add action-led and dialogue-heavy variants.
  - Remove/soften hints that repeatedly bias toward “single short dialogue line then narration.”

2) Runtime anti-stagnation directive (`ChatInterfaceTab.tsx`)
- Extend `getAntiLoopDirective()` with two additional detectors over recent assistant messages:
  - Structural repetition detector (same triad pattern repeated in recent turns).
  - Low-initiative detector (reassurance/reflective loops with little scene movement).
- When triggered, inject a short micro-directive before send/regenerate:
  - “Break template; execute a concrete new beat now; do not rely on quote-action-thought default.”
- Keep existing anti-loop logic (confirmation/deferral/rephrase) intact.

3) Continue behavior fix (`ChatInterfaceTab.tsx`)
- Update `handleContinueConversation()` prompt text so it requires a decisive forward beat now (instead of “wait for user response”).
- Preserve control boundaries: AI still cannot puppeteer user-controlled characters.

4) Safety/consistency constraints (unchanged)
- Do not alter control enforcement (AI vs User characters).
- Do not alter scene-presence checks.
- Do not change model provider routing or backend schema.

Validation plan (end-to-end, same story/session):
- Generate 6–8 back-to-back assistant turns and verify:
  - No persistent triad template across consecutive turns.
  - Clear scene progression each turn (new action/event/reveal).
  - Higher initiative (AI drives beats instead of only mirroring user).
  - Internal thoughts appear selectively, not by default every block.
- Spot-check regenerate and continue flows for the same improvements.
