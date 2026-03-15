

# Pass 13c (Revised): Anti-Repetitive Multi-Character Pattern

## What's Actually Wrong

The problem is not that two characters ever speak in the same response — a one-off is fine. The problem is it happens **every single message**. The existing ANTI-PING-PONG detector (line 695) only checks the last single response for alternating blocks. It does not detect the cross-message pattern where every response includes both characters.

## Changes

### 1. Add MULTI-RESPONSE PATTERN rule — `src/services/llm.ts`

Replace the overly strict "USER TURN BOUNDARY" concept with a pattern-focused rule inserted after SILENCE IS VALID:

```
- NO AUTO-FOLLOW-UP PATTERN (MANDATORY):
    * A second AI character MAY respond in the same turn — but NOT every turn.
    * If the last 2+ responses EACH featured multiple AI characters, this response MUST 
      feature ONLY the focal character. Break the pattern.
    * One-off reactions are fine. The repetitive cycle of Character A acts → Character B 
      responds → every single message is the problem.
    * Do NOT automatically generate a follow-up from a second character just because 
      they are present. Only include them when their reaction genuinely changes the 
      scene direction.
```

This is the key reframe: occasional multi-character responses are fine; the disease is the pattern.

### 2. Upgrade the cross-message multi-character detector — `src/components/chronicle/ChatInterfaceTab.tsx`

The existing ping-pong detector (line 695) only checks the last message. Add a new detector that looks at the last **3** AI messages and checks if **all of them** contain 2+ different character tags. If so, inject:

`[ANTI-MULTI-CHAR-PATTERN: Your last 3 responses ALL featured multiple AI characters. This response MUST be single-character only. Pick the focal character, write their beat, and STOP. Other characters can be referenced in narration but get NO tagged blocks this turn.]`

This fires only when the pattern is established (3+ consecutive), not on a one-off.

### 3. Update continue prompt — `src/components/chronicle/ChatInterfaceTab.tsx`

Add to the continue prompt (line 3092): "If your last 2+ responses each featured multiple AI characters, this response must focus on ONE character only. Break the pattern."

### Files Changed
- `src/services/llm.ts` — add NO AUTO-FOLLOW-UP PATTERN rule (replaces the rejected USER TURN BOUNDARY)
- `src/components/chronicle/ChatInterfaceTab.tsx` — add cross-message multi-character pattern detector, update continue prompt

