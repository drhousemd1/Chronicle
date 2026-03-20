

# Outward vs Inward Personality Precedence Fix

## The Actual Problem

After reading the full code, here's what's happening:

1. **Both outward and inward traits start at identical scores** — `getDefaultScore()` returns 75 for both Normal and Flexible traits (line 167). The bracket system maps this to "Strong Influence" for both.

2. **The conflict resolution rule is vague** — Line 728 says: *"honor BOTH: show outward behavior through actions/dialogue while weaving inward feelings through thoughts"* — but this is a suggestion, not a hard constraint. The model treats it as "blend both equally."

3. **The NSFW rules actively undermine shyness** — Lines 486-505 emphasize "amplify explicit language," "escalate," and "sexual directness." The PERSONALITY-MODULATED INTIMACY block (lines 493-505) has good shy guidance but is weaker in phrasing than the surrounding escalation rules. The model resolves the conflict by leaning into escalation.

4. **Tone is injected as flat data with no enforcement rule** — Line 242: `TONE: key=value`. There's no instruction telling the model that Tone constrains dialogue expression. It's just informational.

5. **The injection order buries tone** — In the character block (line 259), the order is: `personality → tone → background → life events → relationships → secrets → fears → goals → tags → traits`. Tone appears after personality but has no special weight.

## Why Score Offset Is The Right Approach

The bracket system already exists and works. The model reads "Primary Influence" vs "Strong Influence" and adjusts behavior accordingly. The problem is that outward shy at 75% ("Strong Influence") and inward dominant at 75% ("Strong Influence") are **equal weight** — the model picks whichever feels more "active" (dominance wins).

An offset solves this structurally:
- Outward shy at 75% + 15 offset = 90% → "Primary Influence" 
- Inward dominant at 75% = 75% → "Strong Influence"

The model now reads one as "Drives actions, dialogue, thoughts consistently" and the other as "Regular integration; frequent expression balanced with other traits." That's a clear, unambiguous hierarchy the model will follow.

As inward scores rise through story progression (the adherence scoring system already handles this), the inward trait naturally catches up and can eventually surpass the outward trait — creating organic character evolution without any new systems.

## Changes

### 1. `src/services/llm.ts` — Score Offset for Outward vs Inward Traits

In `personalityContext()` (line 170), apply a +15 effective score bonus to outward traits and a -10 penalty to inward traits when formatting for the prompt. This affects only the **displayed score and bracket** sent to the model — not the stored `adherenceScore` on the trait object.

```typescript
// In formatTrait, add a parameter for trait category
const formatTrait = (t: any, category: 'standard' | 'outward' | 'inward' = 'standard') => {
  const level = ...;
  const rawScore = t.adherenceScore ?? getDefaultScore(level);
  
  // Apply precedence offset: outward traits get visibility bonus,
  // inward traits get suppression until they earn higher scores
  const effectiveScore = category === 'outward' 
    ? Math.min(rawScore + 15, 100)
    : category === 'inward' 
      ? Math.max(rawScore - 10, 0)
      : rawScore;
  
  const score = effectiveScore;
  // ... rest uses score for bracket lookup
};
```

This means at default 75%:
- Outward: 90% → "Primary Influence" (drives behavior consistently)
- Inward: 65% → "Moderate Influence" (occasional influence, doesn't override)

As inward rises to 90% through story events: 80% effective → "Strong Influence" — it starts surfacing.
As inward hits 100%: 90% effective → "Primary Influence" — it matches outward.

### 2. `src/services/llm.ts` — Annotate Outward/Inward Headers

Change the personality headers to explicitly state their role:

```
OUTWARD PERSONALITY (governs visible behavior, dialogue, and actions):
INWARD PERSONALITY (governs internal thoughts and hidden motivation):
```

### 3. `src/services/llm.ts` — Strengthen the Conflict Resolution Rule

Replace line 728's vague "honor BOTH" with a precise precedence rule:

```
* When OUTWARD and INWARD traits conflict:
  - OUTWARD traits govern all visible expression: dialogue, actions, body language, vocal tone
  - INWARD traits govern internal thoughts (parentheses) and subconscious motivation
  - An inward trait may surface in visible expression ONLY when its influence bracket 
    is HIGHER than the conflicting outward trait's bracket
  - At equal brackets, OUTWARD always wins visible expression
  - Example: Outward Shy [90% - Primary] vs Inward Dominance [65% - Moderate] → 
    Character speaks hesitantly, acts nervously; dominance appears only in (thoughts)
  - Example: Outward Shy [45% - Moderate] vs Inward Dominance [90% - Primary] → 
    Dominance surfaces through actions, but residual hesitation colors delivery
```

### 4. `src/services/llm.ts` — Enforce Tone as Expression Filter

Add a rule to the INSTRUCTIONS block (after PERSONALITY TRAIT ADHERENCE):

```
- TONE ENFORCEMENT (MANDATORY):
    * All spoken dialogue, vocal descriptions, and speech patterns MUST conform to the character's TONE.
    * Tone is the DELIVERY MECHANISM for personality — it controls HOW traits are expressed in words.
    * Shy/reserved tone = soft voice, hesitations ("u-um..."), nervous pauses, sentence fragments, 
      reliance on others for cues — even when inward traits push for assertiveness.
    * Bold/commanding tone = direct speech, declaratives, confident rhythm.
    * Tone NEVER contradicts outward personality in dialogue. Inward cravings may color 
      internal thoughts but do not alter vocal delivery unless the inward trait's bracket 
      exceeds the outward trait's bracket.
```

### 5. `src/services/llm.ts` — Add NSFW Outward/Inward Modulation

After the existing PERSONALITY-MODULATED INTIMACY block (line 505), add:

```
OUTWARD/INWARD CONFLICT IN INTIMATE SCENES:
- Shy/reserved outward + dominant/craving inward = desire expressed through hesitation:
  trembling touches, whispered half-requests, blushing while initiating, reliance on 
  partner to interpret and lead — even while internally desperate for control.
- The outward trait sets VISIBLE behavior. The inward trait sets MOTIVATION and (thoughts).
- WRONG: Shy character suddenly commanding with confidence, sharp whispers, dominant posture
- RIGHT: Shy character nervously reaching out, voice cracking, internally thrilled but 
  externally fumbling — "I... c-could you maybe... (God, just do it already...)"
- This applies until the inward trait's influence bracket exceeds the outward trait's bracket,
  at which point the character's outward behavior may shift to match inner drive.
```

### 6. `src/services/llm.ts` — Reorder Character Block Injection

Move TONE immediately after PERSONALITY and before BACKGROUND so the model reads them as a unit:

```
Current:  personality → tone → background → life events → ...
Keep as:  personality → tone → background → life events → ...
```

(This is already correct in the current code — no change needed here.)

### 7. `public/api-call-inspector-chronicle.html` — Update Documentation

- Update the "Personality Traits" documentation to reflect the outward/inward score offset
- Document the new precedence rule and tone enforcement
- Update the priority hierarchy to note that Tone enforces personality expression

### 8. `docs/guides/chat-interface-page-structure-guide.md`

- Document the outward +15 / inward -10 offset in the adherence scoring section

## What This Achieves

- At story start: Ashley's shy/reserved outward traits show as "Primary Influence" (90%) while her inward dominance shows as "Moderate Influence" (65%). The model will make her visibly nervous, hesitant, and reliant on Sarah.
- As story progresses: If user consistently encourages Ashley's dominance, the adherence scoring system raises the inward score. At raw 85%+, the inward effective score (75%+) enters "Strong Influence" and starts surfacing visibly.
- Organic evolution: No sudden personality flips. The bracket gap narrows gradually as the story earns it.

## Files Modified
- `src/services/llm.ts` — score offset, headers, conflict rule, tone enforcement, NSFW modulation
- `public/api-call-inspector-chronicle.html` — documentation updates
- `docs/guides/chat-interface-page-structure-guide.md` — offset documentation

