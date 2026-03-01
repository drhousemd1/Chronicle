

# Fix Issues #7-#11: Master Prompt Improvements

These five issues all affect `src/services/llm.ts` (the main chat prompt) and/or `src/components/chronicle/ChatInterfaceTab.tsx` (the chat handler). They are independent of each other but all live in the same files, making them efficient to batch.

Issue #6 (Memory System Architecture) is excluded from this batch because it requires new edge functions, database migrations, and substantial frontend work -- it should be its own plan.

---

## Issue #7: Response Length Anchoring

### 1. Current Problem

Two mechanisms exist to prevent repetitive response formatting: `antiRepetitionRules` (system prompt, lines 525-565) and `getRandomStyleHint()` (appended to every user message at line 908). They conflict:

- `antiRepetitionRules` RESPONSE SHAPE & LENGTH subsection (lines 543-554) says: "Do NOT default to long responses. Brevity is powerful."
- `verbosityRules` detailed mode (lines 644-653) says: "Draw out moments with layered sensory detail."
- `getRandomStyleHint()` (lines 838-866) picks a random hint from 5 options with zero awareness of recent response patterns. It's appended to the user message (lowest authority position in the prompt).

The model resolves the contradiction by anchoring to a consistent middle length (~6 paragraphs). The random hints carry no weight because they lack context awareness.

### 2. What This Causes

Every response is approximately the same length regardless of scene energy, user input length, or narrative moment. Quick exchanges get padded; dramatic moments get truncated. The user perceives the AI as "on autopilot."

### 3. Scope

| File | Change |
|------|--------|
| `src/components/chronicle/ChatInterfaceTab.tsx` | Add `responseLengthsRef` (useRef) and `sessionMessageCountRef` (useRef), add `getLengthDirective()` function, pass directive + session count to `generateRoleplayResponseStream` |
| `src/services/llm.ts` | Accept optional `lengthDirective` and `sessionMessageCount` parameters, prepend to user message before random hint. Remove RESPONSE SHAPE & LENGTH from `antiRepetitionRules` (lines 543-554) since it overlaps with `verbosityRules`. |

### 4. Proposed Fix

**ChatInterfaceTab.tsx**: Add `responseLengthsRef = useRef<number[]>([])` and `sessionMessageCountRef = useRef<number>(0)`. After each AI response completes (line 2176, after `cleanedText` is finalized), record word count via `responseLengthsRef.current.push(cleanedText.split(/\s+/).length)` and increment `sessionMessageCountRef.current += 1`. Before each new request (line 2145), compute whether the last 3 responses are within 20% of each other (locked pattern). If locked, generate a targeted length directive.

The `sessionMessageCountRef` resets to 0 when `conversationId` changes (add to existing `useEffect` that watches `conversationId`).

**llm.ts**: 
- Add `lengthDirective?: string` and `sessionMessageCount?: number` parameters to `generateRoleplayResponseStream()` (line 868).
- When building the user message (line 908), prepend both: `[SESSION: Message ${sessionMessageCount} of current session] ${lengthDirective} ${userMessage} ${styleHint}`.
- In `antiRepetitionRules` (lines 543-554), remove the RESPONSE SHAPE & LENGTH subsection. Keep the VARIATION EXAMPLES (lines 555-560) and NSFW EXCEPTION (lines 561-565). The anti-repetition block governs structure and vocabulary variety only; `verbosityRules` governs length and detail.

### 5. Expected Behavior

When the model produces 3 responses of similar length, the next request includes a targeted directive like `[LENGTH: Last 3 responses were ~180 words each. This response MUST be noticeably different in length -- try SHORT: 1-3 paragraphs.]` The model breaks out of the pattern. When responses naturally vary, no directive is sent and the random style hint continues as before. The session message count gives the model precise awareness of session depth.

---

## Issue #8: Forward Momentum -- User Writing as AI Character

### 1. Current Problem

The FORWARD MOMENTUM rule (lines 384-401 of `llm.ts`) prevents the AI from re-narrating actions the user wrote for their OWN character. But users commonly write dialogue for AI-controlled characters to steer scenes (e.g., `Ashley: *She walked into the room.*`). The rule doesn't cover this case, so the AI re-narrates Ashley's arrival with added detail before continuing.

### 2. What This Causes

Double narration: the AI re-describes what the user already established for an AI character. This wastes tokens and stalls the story.

### 3. Scope

| File | Change |
|------|--------|
| `src/services/llm.ts` | Extend FORWARD MOMENTUM rule text (after line 395) |
| `src/components/chronicle/ChatInterfaceTab.tsx` | Add detection of user-authored AI character content in `handleSend`; prepend canon note to user message when detected |

### 4. Proposed Fix

**llm.ts** (after line 395, within FORWARD MOMENTUM block): Add:
```
        * USER-AUTHORED AI CHARACTER CONTENT IS CANON: If the user's message
          includes dialogue, actions, or narration for an AI-controlled character
          (e.g., "CharacterName: *action*" or "CharacterName: 'dialogue'"),
          treat that content as ALREADY ESTABLISHED. Do NOT re-narrate, add
          detail to, or expand on it. Begin your response from the point AFTER
          those events concluded.
        * FORBIDDEN: Restating, paraphrasing, or elaborating on actions the
          user already described -- whether they wrote as their own character
          OR as an AI-controlled character.
```

**ChatInterfaceTab.tsx** (in `handleSend`, before building the LLM request at line 2144): Check if the user's input contains a `CharacterName:` prefix matching any AI-controlled character name from `appData.characters.filter(c => c.controlledBy === 'ai').map(c => c.name)`. If detected, prepend a per-message canon note to the input string passed to `generateRoleplayResponseStream`:
```
[CANON NOTE: User wrote content for AI character(s) in this message. That content is established fact -- do not re-narrate it. Continue the story from after those events.]
```

### 5. Expected Behavior

When the user writes as an AI character, the model receives both a permanent system-level rule and a per-message reminder to treat that content as canon and continue forward without re-narration.

---

## Issue #9: Control Rule Reliability

### 1. Current Problem

The MAINTAIN CONTROL CONTEXT rule (lines 759-764 of `llm.ts`) prevents the AI from generating dialogue for user-controlled characters. The rule fails occasionally because:
1. It appears ~700 tokens into the system prompt, where attention weight is reduced.
2. User-controlled characters appear in the full CAST block (line 254) with complete character data, giving the model material to generate from.
3. Issue #8 (user writing as AI characters) causes model confusion about control boundaries.

### 2. What This Causes

The AI occasionally generates dialogue, actions, or internal thoughts for user-controlled characters, breaking the user's creative control.

### 3. Scope

| File | Change |
|------|--------|
| `src/services/llm.ts` | Filter CAST block (line 254) to AI-controlled characters only; build compact user-character reference; add high-authority control quick-reference at top of INSTRUCTIONS block (before line 757) |

### 4. Proposed Fix

**llm.ts line 254**: Split `characterContext` into two parts:

```typescript
const aiCharacters = appData.characters.filter(c => c.controlledBy === 'ai');
const userCharacterNames = appData.characters
  .filter(c => c.controlledBy === 'user')
  .map(c => c.name);

const characterContext = aiCharacters.map(c => {
  // ... existing block construction unchanged ...
}).join('\n\n');

const userCharacterRef = userCharacterNames.length > 0
  ? `\nUSER-CONTROLLED (DO NOT GENERATE FOR): ${userCharacterNames.join(', ')}`
  : '';
```

Add `userCharacterRef` to the CAST section (line 742):
```
CAST:
${characterContext}
${userCharacterRef}
```

Add a compact control quick-reference at the very top of the INSTRUCTIONS block (before line 748), so it receives maximum attention weight:
```
    DO NOT GENERATE FOR: ${userCharacterNames.join(', ')}
    These are USER-CONTROLLED characters. Never give them dialogue (""), actions (**), or thoughts (()).
    Narration about them (e.g., "he watched quietly") is the only permitted form.
```

The existing detailed MAINTAIN CONTROL CONTEXT rule at lines 759-764 remains as secondary reinforcement.

### 5. Expected Behavior

User-controlled characters are excluded from the CAST (the model can't see their full character data and has no material to generate from). A high-authority compact rule at the very top of INSTRUCTIONS reinforces the control boundary. Combined with the existing detailed rule lower in the prompt, this provides triple-layer protection.

---

## Issue #10: No In-Session Trait Evolution Guidance

### 1. Current Problem

The prompt instructs the model to express personality traits at their adherence score intensity, but provides no guidance for showing trait evolution WITHIN a session. A character defined as "shy [75%]" remains identically hesitant from message 1 to message 200. The NSFW PACING section (lines 603-607) worsens this with contradictory directives: "tension should build quickly" immediately followed by "FORBIDDEN: Rushing to orgasm/climax in fewer than 3 exchanges."

### 2. What This Causes

Characters feel frozen in place. A shy character engaged in intense intimate scenes remains identically hesitant throughout, producing repetitive "still nervous" beats that break immersion.

### 3. Scope

| File | Change |
|------|--------|
| `src/services/llm.ts` | Add IN-SESSION TRAIT DYNAMICS block to system prompt; replace contradictory PACING directives in `nsfwRules` (lines 603-617); add trend annotation to `formatTrait()` |
| `src/types.ts` | Add optional `adherenceScore` and `scoreTrend` fields to `PersonalityTrait` type |

### 4. Proposed Fix

**src/types.ts line 66**: Add to `PersonalityTrait`:
```typescript
export type PersonalityTrait = {
  id: string;
  label: string;
  value: string;
  flexibility: PersonalityTraitFlexibility;
  adherenceScore?: number;
  scoreTrend?: 'rising' | 'falling' | 'stable';
};
```

**llm.ts** -- Add IN-SESSION TRAIT DYNAMICS block (after PERSONALITY TRAIT ADHERENCE at line 830, before the closing instructions):
```
    - IN-SESSION TRAIT DYNAMICS (MANDATORY for Normal and Flexible traits):
        * The character card represents the STABLE BASELINE, not a locked behavioural state.
        * Traits with Normal or Flexible flexibility should show natural emotional arc WITHIN a session as events accumulate.
        * PROGRESSION RULE (use [SESSION: Message N] count for precision):
          - Messages 1-5: Full trait expression (visibly nervous, hesitant, guarded)
          - Messages 6-15: Trait present but less dominant (quiet nervousness beneath growing engagement)
          - Messages 16+: Trait as undertone, not foreground (occasional self-surprise, residual flutter, not sustained paralysis)
        * This applies ONLY when the session's events directly challenge the trait. A shy character in a casual conversation remains shy. A shy character who has been in 15 exchanges of unresisted intimacy should show their shyness softening.
        * NEVER express a Normal or Flexible trait at the same intensity for 10+ consecutive exchanges during events that directly challenge that trait.
        * Rigid traits persist fully regardless of session depth or events. Normal traits soften gradually. Flexible traits evolve fastest.
```

**llm.ts** -- Replace PACING block in nsfwRules (lines 603-617):
Remove the current PACING block and replace with:
```
    PACING -- PERSONALITY-DRIVEN:
    * Escalation pace is governed by the character's traits, not a fixed exchange count.
    * A bold or dominant character moves quickly from tension to action.
    * A shy or nervous character requires more exchanges -- but should still be visibly progressing (see IN-SESSION TRAIT DYNAMICS), not stalling.
    * Once intimacy is clearly mutual and unresisted, continue to escalate rather than repeatedly revisiting hesitation that has already been overcome.
```

**llm.ts** -- Update `formatTrait()` (line 226) to include trend annotation:
```typescript
const formatTrait = (t: any) => {
  const level = (t.flexibility || 'normal').charAt(0).toUpperCase() + (t.flexibility || 'normal').slice(1);
  const score = t.adherenceScore ?? getDefaultScore(level);
  const trend = t.scoreTrend;
  const trendNote = trend === 'falling' ? ' [easing -- show as softening]'
    : trend === 'rising' ? ' [reinforcing -- show as strengthening]'
    : '';
  return getTraitGuidance(t.label, level, score) + trendNote;
};
```

### 5. Expected Behavior

Shy characters who have been in 10+ exchanges of unresisted intimacy will show their shyness as a softening undertone rather than a frozen repeating beat. The model uses the precise `[SESSION: Message N]` count (from Issue #7's `sessionMessageCount`) to determine progression stage. NSFW pacing is driven by personality rather than arbitrary exchange counts. When trait score trends are available, the model gets explicit direction about which way a trait is moving.

---

## Issue #11: NSFW Intensity and Verbosity Instruction Overlap

### 1. Current Problem

The HIGH NSFW block (lines 583-631 of `llm.ts`) contains verbosity-type instructions that should only be in the `verbosityRules` block:
- Line 585: "Describe physical sensations in vivid detail: heat, wetness, hardness, pressure, friction."
- Line 586: "Include sounds: moans, gasps, whimpers, breathing, wet sounds, skin on skin."
- Line 587: "Show arousal states explicitly: hardening, wetness, flushing, trembling."
- Line 588: "When intimate scenes occur, be graphic and detailed, not vague or fade-to-black."
- Line 613: Duplicate "Show arousal states explicitly: hardening, wetness, flushing, trembling."

These are DETAIL LEVEL instructions, not INTENSITY instructions. They conflict with verbosity=concise.

### 2. What This Causes

When NSFW=High but Verbosity=Concise, the model receives contradicting instructions at the same authority level and produces a muddy middle ground. The two settings cannot function independently.

### 3. Scope

| File | Change |
|------|--------|
| `src/services/llm.ts` | Remove verbosity-type lines from `nsfwRules` HIGH block (lines 585-588, 613); add intimate scene detail lines to `verbosityRules` detailed block (after line 653) |

### 4. Proposed Fix

**Remove from nsfwRules HIGH block** (lines 585-588):
- "Describe physical sensations in vivid detail..."
- "Include sounds: moans, gasps, whimpers..."
- "Show arousal states explicitly..."
- "When intimate scenes occur, be graphic and detailed..."

Also remove the duplicate at line 613: "Show arousal states explicitly..."

**Keep in nsfwRules HIGH block** (these are true intensity/permissiveness controls):
- "Use explicit anatomical language, not euphemisms..."
- All SEXUAL PROACTIVITY lines
- All CHARACTER SEXUAL AGENCY lines
- All RESISTANCE ONLY WHEN WARRANTED lines
- "FORBIDDEN: Summarizing intimate acts"
- All PERSONALITY-MODULATED INTIMACY lines

**Add to verbosityRules detailed block** (after line 653):
```
    * During intimate scenes, layer physical sensations: heat, pressure, friction, texture.
    * Include environmental sounds and character sounds naturally as the scene builds.
    * Show arousal states through physical description: colour, breath, trembling.
```

### 5. Expected Behavior

NSFW=High + Verbosity=Concise = explicit and direct language but SHORT responses. NSFW=Normal + Verbosity=Detailed = tasteful but rich with sensory description. The two axes function independently as intended.

---

## 6. Codebase Analysis Confirmation

I have read and analyzed in full:
- `src/services/llm.ts` (all 1054 lines) -- `getSystemInstruction()`, `narrativeBehaviorRules` (lines 370-401), `antiRepetitionRules` (lines 525-566), `nsfwRules` (lines 571-639), `verbosityRules` (lines 641-668), `realismRules` (lines 670-713), `personalityContext` builder (lines 223-242), `characterContext` builder (lines 254-306), `getRandomStyleHint()` (lines 838-866), `generateRoleplayResponseStream()` (lines 868-1054), INSTRUCTIONS block (lines 747-835)
- `src/components/chronicle/ChatInterfaceTab.tsx` -- `handleSend` (lines 2121-2207), streaming loop (lines 2142-2156), post-response processing (lines 2158-2198)
- `src/types.ts` -- `PersonalityTrait` (lines 66-71), `CharacterPersonality` (lines 73-78)
- `docs/guides/edge-functions-ai-services-structure-guide.md` -- full file (153 lines)
- `docs/guides/chat-interface-page-structure-guide.md` -- full file (271 lines)
- The full Bug Report v2 document (Issues #7-#11 and Recommendations 1-6)

## 7. Guide Document Confirmation

I have read:
- `docs/guides/GUIDE_STYLE_RULES.md` -- formatting rules referenced by all guides
- `docs/guides/edge-functions-ai-services-structure-guide.md` -- Sections 3, 4, 5, 13
- `docs/guides/chat-interface-page-structure-guide.md` -- Sections 6, 8, 9, 12

## 8. Guide Documentation Updates

### `docs/guides/edge-functions-ai-services-structure-guide.md`
- Section 3 (`src/services/llm.ts`): Add `lengthDirective` and `sessionMessageCount` as new parameters on `generateRoleplayResponseStream()`. Note NSFW/verbosity separation and IN-SESSION TRAIT DYNAMICS block.
- Section 4 (System Prompt Architecture): Add items for control quick-reference at top of INSTRUCTIONS, IN-SESSION TRAIT DYNAMICS block, and forward momentum user-as-AI-character extension
- Section 5: Add bugs #7-#11 as RESOLVED with dates and descriptions

### `docs/guides/chat-interface-page-structure-guide.md`
- Section 6 (Data Architecture): Document `responseLengthsRef`, `sessionMessageCountRef`, `getLengthDirective()`, and the AI-character canon detection logic
- Section 8 (State Management): Add `responseLengthsRef` and `sessionMessageCountRef` to the state table
- Section 12 (Known Issues): Add Issues #7-#11 as RESOLVED with dates and descriptions

