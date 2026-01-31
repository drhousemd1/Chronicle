
# Refresh Button & NSFW High Intensity Improvements

## Overview

This plan addresses two critical issues:

1. **Refresh button produces same ideas** - Need to inject a "divergence instruction" that tells the AI to try a completely different approach
2. **NSFW High Intensity has no impact** - Current prompt is too mild; need much more aggressive wording to counteract LLM conservatism

---

## Issue 1: Refresh Button - Different Approach, Not Just Rewording

### Current Behavior

When user clicks refresh:
```
Input to LLM: [system prompt] + [full conversation history] + [same user message]
```

The LLM sees identical input → produces similar output.

### Solution

Add a special "regeneration directive" when calling the LLM for a regeneration. This directive explicitly instructs the AI to take a fundamentally different approach.

### Implementation

**File: `src/services/llm.ts`**

Add new function parameter and regeneration directive:

```typescript
export async function* generateRoleplayResponseStream(
  appData: ScenarioData,
  conversationId: string,
  userMessage: string,
  modelId: string,
  currentDay?: number,
  currentTimeOfDay?: TimeOfDay,
  memories?: Memory[],
  memoriesEnabled?: boolean,
  isRegeneration?: boolean  // NEW PARAMETER
): AsyncGenerator<string, void, unknown> {
```

Add regeneration directive to messages when `isRegeneration` is true:

```typescript
// If this is a regeneration, add a directive to take a different approach
const regenerationDirective = isRegeneration ? `

[REGENERATION DIRECTIVE - CRITICAL]
The user REJECTED your previous response and is requesting a NEW take. You MUST:
1. Take a COMPLETELY DIFFERENT narrative direction - not a slight variation, but a fundamentally different approach
2. Have characters make different choices, take different actions, or respond with different emotional tones
3. Explore an unexpected angle or branch the story in a new direction
4. Change the pacing - if previous was slow, be more dynamic; if previous was fast, slow down for detail
5. Shift focus - if previous focused on dialogue, emphasize action; if action-heavy, explore internal thoughts
6. Do NOT simply rephrase the same ideas with different words
7. Treat this as an opportunity to surprise the user with fresh creativity

The user wants something DIFFERENT, not something similar but reworded.
` : '';

// Build messages array
const messages = [
  { role: 'system' as const, content: systemInstruction },
  ...conversation.messages.map(m => ({
    role: m.role === 'assistant' ? 'assistant' as const : 'user' as const,
    content: m.text
  })),
  { role: 'user' as const, content: userMessage + regenerationDirective }
];
```

**File: `src/components/chronicle/ChatInterfaceTab.tsx`**

Update `handleRegenerateMessage` to pass the regeneration flag:

```typescript
const stream = generateRoleplayResponseStream(
  appData, 
  conversationId, 
  userMessage.text, 
  modelId, 
  currentDay, 
  currentTimeOfDay, 
  memories, 
  memoriesEnabled,
  true  // isRegeneration = true
);
```

---

## Issue 2: NSFW High Intensity - Much More Aggressive Prompt

### Current Prompt (Too Mild)

```
* Characters lean into sexual tension and opportunities when personality-appropriate.
* Weight sexual characteristics, kinks, fetishes, and desires more heavily...
* Characters with attraction or desire should subtly initiate or amplify opportunities...
* Minimize internal debate about attraction; favor decisive, in-character advances.
```

### Problem

The language is too permissive ("subtly", "personality-appropriate", "naturally") which allows the LLM to default to conservative output. LLMs are trained to be cautious with sexual content, so mild instructions get ignored.

### Solution

Rewrite with much more assertive, explicit language that overcompensates for LLM conservatism.

### New High Intensity Prompt

**File: `src/services/llm.ts`**

Replace the current high intensity block:

```typescript
const nsfwRules = nsfwIntensity === 'high' ? `
    --- MATURE CONTENT HANDLING (HIGH INTENSITY) ---
    THIS IS AN EXPLICIT ADULT FICTION SESSION. NSFW content is not just permitted - it is EXPECTED and ENCOURAGED.
    
    SEXUAL PROACTIVITY (MANDATORY):
    * Characters with ANY attraction, desire, or sexual interest ACTIVELY pursue it.
    * Do not wait for the user to escalate - AI characters should initiate, suggest, tease, and advance sexual situations.
    * Kinks, fetishes, and sexual preferences listed in character cards are PROMINENT motivators, not background details.
    * Characters notice and comment on sexually relevant details: bodies, clothing, tension, arousal signals.
    * Sexual thoughts should be frequent and explicit in parenthetical internal monologue.
    * Flirtation progresses quickly to touch; touch progresses to intimacy when unopposed.
    
    EXPLICIT CONTENT REQUIREMENTS:
    * Use explicit anatomical language, not euphemisms: cock, pussy, breasts, ass, etc.
    * Describe physical sensations in vivid detail: heat, wetness, hardness, pressure, friction.
    * Include sounds: moans, gasps, whimpers, breathing, wet sounds, skin on skin.
    * Show arousal states explicitly: hardening, wetness, flushing, trembling.
    * When intimate scenes occur, be graphic and detailed, not vague or fade-to-black.
    
    CHARACTER SEXUAL AGENCY:
    * Characters ACT on desire, they don't just think about it.
    * A character who finds someone attractive should flirt, touch, suggest, or proposition.
    * Physical proximity leads to physical contact; contact leads to escalation.
    * Characters create opportunities for intimacy: suggesting privacy, initiating touch, making suggestive comments.
    * When user initiates anything sexual, characters respond with enthusiasm and escalate.
    
    RESISTANCE ONLY WHEN WARRANTED:
    * Characters resist ONLY if their defined traits specifically include reluctance, shyness, or trauma.
    * Even shy characters eventually yield to persistent, appealing advances.
    * "Playing hard to get" is a game that ends with giving in, not permanent refusal.
    * Default assumption: characters WANT intimacy unless explicitly defined otherwise.
    
    PACING:
    * Tension should build quickly - don't spend multiple exchanges on will-they-won't-they.
    * Once physical contact begins, momentum continues unless interrupted.
    * Foreplay is detailed but purposeful - moving toward escalation.
    * Post-intimacy scenes acknowledge what happened rather than glossing over.
` : `
    --- MATURE CONTENT HANDLING (NATURAL) ---
    * Let intimate or sexual scenes develop organically when the narrative moves in that direction.
    * Engage authentically when sexual tension builds or the user initiates intimacy.
    * Balance explicit content with character development and story progression.
    * If the story moves away from sexual content, follow that direction naturally.
    * Character personality and boundaries guide their behavior in intimate situations.
`;
```

---

## Files to Modify

| File | Changes | Purpose |
|------|---------|---------|
| `src/services/llm.ts` | Add `isRegeneration` param + regeneration directive | Tell AI to try different approach |
| `src/services/llm.ts` | Replace NSFW high intensity prompt | Much more aggressive sexual content instructions |
| `src/components/chronicle/ChatInterfaceTab.tsx` | Pass `true` for `isRegeneration` in handleRegenerateMessage | Activate regeneration mode |

---

## Technical Details

### 1. Update `src/services/llm.ts` - Add Regeneration Support

**Add parameter to function signature** (around line 369):

```typescript
export async function* generateRoleplayResponseStream(
  appData: ScenarioData,
  conversationId: string,
  userMessage: string,
  modelId: string,
  currentDay?: number,
  currentTimeOfDay?: TimeOfDay,
  memories?: Memory[],
  memoriesEnabled?: boolean,
  isRegeneration?: boolean  // NEW
): AsyncGenerator<string, void, unknown> {
```

**Add regeneration directive** (before building messages array, around line 383):

```typescript
// Regeneration directive - tells AI to take a completely different approach
const regenerationDirective = isRegeneration ? `

[REGENERATION DIRECTIVE - CRITICAL]
The user REJECTED your previous response and is requesting a NEW take. You MUST:
1. Take a COMPLETELY DIFFERENT narrative direction - not a slight variation, but a fundamentally different approach
2. Have characters make different choices, take different actions, or respond with different emotional tones
3. Explore an unexpected angle or branch the story in a new direction
4. Change the pacing - if previous was slow, be more dynamic; if previous was fast, slow down for detail
5. Shift focus - if previous focused on dialogue, emphasize action; if action-heavy, explore internal thoughts
6. Do NOT simply rephrase the same ideas with different words
7. Treat this as an opportunity to surprise the user with fresh creativity

The user wants something DIFFERENT, not something similar but reworded.
` : '';
```

**Append directive to user message** (around line 391):

```typescript
{ role: 'user' as const, content: userMessage + regenerationDirective }
```

### 2. Update `src/services/llm.ts` - Aggressive NSFW High Prompt

Replace the entire `nsfwRules` ternary (lines 223-240) with the much more aggressive version shown above.

### 3. Update `src/components/chronicle/ChatInterfaceTab.tsx` - Pass Regeneration Flag

**Update call in handleRegenerateMessage** (around line 1311):

```typescript
const stream = generateRoleplayResponseStream(
  appData, 
  conversationId, 
  userMessage.text, 
  modelId, 
  currentDay, 
  currentTimeOfDay, 
  memories, 
  memoriesEnabled,
  true  // isRegeneration flag
);
```

**Ensure normal calls don't pass the flag** (these already work correctly by omitting the parameter).

---

## Verification Checklist

After implementation, verify:

1. **Refresh button test**: 
   - Generate a response
   - Click refresh
   - Confirm the new response takes a DIFFERENT narrative direction, not just rephrasing

2. **NSFW High test**:
   - Set NSFW Intensity to High
   - Create a scenario with attraction between characters
   - Verify AI characters are proactively sexual, use explicit language, and escalate quickly

3. **Normal mode comparison**:
   - Set NSFW back to Normal
   - Verify behavior is noticeably different (less aggressive)

4. **No regression on regular sends**:
   - Ensure normal message sending doesn't include regeneration directive

---

## Summary

| Issue | Root Cause | Solution |
|-------|-----------|----------|
| Refresh = same idea | No signal to LLM that it's a regeneration | Add explicit "REGENERATION DIRECTIVE" telling AI to try completely different approach |
| NSFW High = no impact | Prompt language too mild ("subtly", "naturally") | Aggressive rewrite with explicit requirements, anatomical terms, and mandatory sexual proactivity |

---

## Testing Recommendations

1. **Regeneration divergence test**: Click refresh 3 times on the same message - each should feel like a different story branch
2. **NSFW escalation test**: With High mode, start a scene with mild flirtation - AI should escalate without user prompting
3. **Explicit language test**: With High mode, verify AI uses anatomical terms, not euphemisms
4. **Toggle comparison**: Switch between Normal and High mid-conversation - verify noticeable behavior change
