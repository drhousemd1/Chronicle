

# Pass 13: Prompt Surgery + Narrative Director Fix

## What I Found in the Conversation

I read every message. Across ~35 messages:
- Ashley says "I feel so lost/overwhelmed" in slightly different words every turn
- Sarah says "That's it sweetheart, keep going" with an internal strategy thought every turn
- James has said maybe 20 words total ("yea of course", "why?", "*nods*")
- Nothing has happened. No goal has advanced. No scene delta. The journal reveal took 10 messages of building up to it.
- Every single AI response has 4-6 tagged character blocks alternating Ashley/Sarah
- Every single block ends with a parenthetical internal thought

## Why It's Broken

**Problem 1: Narrative Director (Pass 14) is completely dead.** Zero edge function logs. The function uses `grok-3-mini` which likely doesn't exist on the xAI API anymore (all other functions were migrated to `grok-4-1-fast-reasoning` on March 4th, but this function was created after that migration and used the old model name). So the "top-down guidance" system we built isn't running at all.

**Problem 2: The INSTRUCTIONS block is ~120 lines with 6 VIOLATION CHECK paragraphs.** The model ignores all of them. The block count cap says "default to 1 block" but the PARAGRAPH TAGGING rule says "EVERY paragraph must begin with a speaker tag" — the model interprets this as needing to produce multi-speaker tagged blocks. Combined with the MULTI-CHARACTER RESPONSES section explicitly showing how to alternate speakers, it's practically an invitation to ping-pong.

**Problem 3: Anti-loop directives fire but are toothless.** They're prepended as plain text to the user message. The model sees `[ANTI-PING-PONG: ...] [ANTI-STAGNATION: ...] *James nodded*` and just ignores the bracketed tags because the user message is so short the model treats it as minimal input.

## Plan

### 1. Fix narrative director model — `supabase/functions/generate-narrative-directive/index.ts`
Change `grok-3-mini` to `grok-4-1-fast-reasoning` (same model all other extraction functions use). This is why Pass 14 is dead.

### 2. Compress INSTRUCTIONS block by ~50% — `src/services/llm.ts`
- **Delete** all 6 VIOLATION CHECK paragraphs (model doesn't self-check, wasted tokens)
- **Merge** STRUCTURE VARIETY GUARD into BLOCK COUNT CAP section
- **Merge** INTERNAL THOUGHT USAGE into formatting — thoughts are OPTIONAL, never default, never the ending beat, max 0-1 per response for concise/balanced
- **Remove** redundant DIALOGUE REQUIREMENTS section
- **Compress** ANTI-REPETITION, FORWARD MOMENTUM, CONFIRMATION CLOSURE into ~3 lines each
- **Remove** the regeneration hint that says "more internal thought" (line ~971) — this literally tells the model to add thoughts

### 3. Add thought-tail rule to formatting — `src/services/llm.ts`
Add to STRICT FORMATTING RULES: "Internal thoughts (parentheses) are OPTIONAL. Use ONLY when they reveal strategy, hidden intent, or information the reader needs. A thought that restates what was just said or shown is FORBIDDEN. Thoughts may NOT be the final beat of a response."

### 4. Make anti-loop directives stronger injection — `src/components/chronicle/ChatInterfaceTab.tsx`
Instead of prepending to user message text, pass them as a separate `runtimeDirectives` parameter to `generateRoleplayResponseStream()` and inject them as a dedicated system-level message (or append to system prompt). This gives them much higher attention weight than being buried in the user message.

### 5. Add thought-tail detector to `getAntiLoopDirective()` — `src/components/chronicle/ChatInterfaceTab.tsx`
Check if last 2+ AI responses end with a parenthetical thought. If so, inject: `[ANTI-THOUGHT-TAIL: Your recent responses all ended with internal thoughts. This response must NOT end with a thought. End with dialogue or action.]`

### 6. Update documentation — `docs/guides/edge-functions-ai-services-structure-guide.md`

### Files Changed
- `supabase/functions/generate-narrative-directive/index.ts` — fix model name
- `src/services/llm.ts` — compress INSTRUCTIONS (~120 lines → ~60), remove regen thought hint, add thought rules
- `src/components/chronicle/ChatInterfaceTab.tsx` — thought-tail detector, stronger directive injection
- `docs/guides/edge-functions-ai-services-structure-guide.md` — Pass 13 entry

