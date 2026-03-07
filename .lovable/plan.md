
Pass 7 — Dialogue Momentum + Loop Elimination

Objective
- Stop confirmation loops, stop “later/soon/tomorrow” stalling, reduce rehashing, and hard-cap verbose outputs (especially Detailed mode).

What I found (root causes)
1) Regeneration currently duplicates the same user message in context:
- `handleRegenerateMessage()` keeps the prior user turn in truncated history and also appends that user turn again in `generateRoleplayResponseStream()`.
- This strongly reinforces repetitive “confirm again” patterns.

2) 403 fallback behavior encourages evasive output:
- `supabase/functions/chat/index.ts` retry directive currently says “deflect/redirect/change subject,” which can produce “we’ll discuss later” loops.

3) Prompt hierarchy conflict in `llm.ts`:
- Priority text allows intimate-scene depth to override anti-repetition constraints.
- This weakens loop prevention exactly when scenes intensify.

4) Detailed verbosity is under-constrained:
- Detailed mode has no hard paragraph cap and request `max_tokens` is always `4096`, enabling very long outputs.

Implementation plan
1) Harden forward-progress rules in `src/services/llm.ts`
- Add a strict “Confirmation Closure Protocol”:
  - If user already affirmed/consented, AI must not ask for that confirmation again.
  - Convert confirmation into immediate action in the same response.
- Add a strict “No Deferral Loop” rule:
  - Disallow repeated “later/soon/tomorrow/after dinner” placeholders unless a concrete action happens now.
- Add “No Rephrase of prior assistant beat” rule:
  - Do not paraphrase prior assistant asks; advance to next beat.
- Update priority hierarchy:
  - NSFW depth may override brevity only, never forward-momentum/no-loop constraints.
- Add explicit paragraph caps:
  - concise: 1–2 paragraphs
  - balanced: 1–3 paragraphs
  - detailed: 2–3 paragraphs, max 4 only for exceptional multi-character turning points

2) Cap generation length by verbosity in `src/services/llm.ts`
- Replace fixed `max_tokens: 4096` with verbosity-based caps (e.g., concise/balanced/detailed tiers).
- Keep streaming behavior unchanged.

3) Fix regeneration context bug in `src/components/chronicle/ChatInterfaceTab.tsx`
- Ensure regenerated request includes the triggering user message exactly once.
- Preserve existing “replace-in-place” regeneration UX.

4) Add runtime anti-loop micro-directive in `src/components/chronicle/ChatInterfaceTab.tsx`
- Before send/regenerate/continue, derive a short guard from recent turns:
  - If user already said yes/understands, inject “do not re-ask, take action now.”
  - If prior assistant question stem repeats, inject “avoid rephrasing prior ask.”
- Keep this internal (not user-visible).

5) Replace 403 retry directive in `supabase/functions/chat/index.ts`
- Swap current deflection wording for “safe pivot with immediate concrete action.”
- Explicitly forbid postponement language in fallback retry.
- Keep existing 422 behavior when both attempts fail.

Technical details
- No database schema changes.
- No RLS/policy changes (all current public tables remain RLS-enabled; unchanged).
- Affected files only:
  - `src/services/llm.ts`
  - `src/components/chronicle/ChatInterfaceTab.tsx`
  - `supabase/functions/chat/index.ts`

Acceptance checks
1) “Tell me you understand” test:
- User confirms once → next response must act, not ask for reconfirmation.

2) Regeneration test:
- Refreshing the same AI message should produce a different take without re-asking the same confirmation.

3) Deferral test:
- Across 5+ turns, no repeated “later/soon/tomorrow” loop unless paired with immediate present-tense action.

4) Verbosity test:
- Detailed mode outputs max 3 paragraphs normally, max 4 only in clear high-intensity multi-character moments.

5) Backend fallback test:
- On 403 retry, output should pivot into concrete in-scene progression rather than evasive postponement.
