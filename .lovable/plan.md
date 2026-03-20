
Assuming “refresh” means the Regenerate button (the refresh icon): no, this was not fully updated across all generation paths.

What I found
- The new anti-rehash system prompt in `src/services/llm.ts` is global, so it applies to send, regenerate, and continue at the base prompt level.
- But the extra per-turn safeguard `[CANON NOTE: ...]` currently exists only in normal send flow inside `src/components/chronicle/ChatInterfaceTab.tsx` (`handleSend`).
- `handleRegenerateMessage` sends the original user message back through `generateRoleplayResponseStream(...)` without adding that canon note.
- `handleContinueConversation` also does not add any canon carry-forward note, so it relies only on the base system prompt plus the continue instruction.

Why it behaves the way you saw
- Delete last AI message + send again works better because `handleSend` adds the explicit canon note.
- Regenerate can slip back into rephrasing because that explicit note is missing there.
- Continue may also be less reliable if the model focuses on the continue instruction and underweights the earlier user-authored AI dialogue.

Plan
1. Centralize canon-note handling
- Move the “user authored dialogue for AI characters” detection into a shared helper so it is not duplicated only in `handleSend`.
- Put this in `src/services/llm.ts` (or a small shared helper beside it) so every generation path uses the same rule.

2. Support all three generation modes explicitly
- Update generation calls to identify request type:
  - send
  - regenerate
  - continue
- For send/regenerate: inspect the active user message being sent.
- For continue: inspect the most recent relevant user message in conversation history and carry that canon forward when applicable.

3. Apply canon note to regenerate
- Update `handleRegenerateMessage` / shared generation path so regenerated outputs get the same `[CANON NOTE]` protection as a fresh send.
- This is the main fix for the behavior you reported.

4. Apply canon carry-forward to continue
- Update continue flow so if the most recent user turn included AI-authored dialogue/actions, the continue request includes a high-priority canon reminder instead of relying only on the base prompt.
- Keep the current goal-driven continue instruction, but append/inject canon context so “continue” starts after the user-established dialogue rather than rephrasing it.

5. Preserve current prompt features
- Keep the existing:
  - global “USER-AUTHORED AI DIALOGUE ACCEPTANCE” rule
  - regeneration directive
  - narrative director tags
  - anti-loop directives
- Only make canon enforcement consistent across request types.

Files to update
- `src/components/chronicle/ChatInterfaceTab.tsx`
- `src/services/llm.ts`

Verification
- Fresh send with user-authored AI dialogue should continue cleanly.
- Regenerate on that same turn should produce a different continuation, not restate the user-written AI dialogue.
- Continue after that turn should also move forward without rephrasing.
- Test with the exact Sarah/Monopoly-style case that previously failed on regenerate.
