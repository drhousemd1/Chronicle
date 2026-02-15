

# Master Plan: Prompt Architecture Improvements and Memory Consolidation

This document captures all agreed-upon changes, corrected per your feedback, and incorporates the Grok analysis for the NSFW prompt restructuring.

---

## Agreed Decisions (Corrections Applied)

### 1. Day-Based Memory Consolidation -- 5-10 bullet points per day summary
When the `currentDay` counter advances, all events from the completed day are consolidated into a **5-10 bullet point summary** (not 3-5). Each bullet point can contain multiple related facts to avoid ejecting important events. This keeps things bounded without losing critical narrative beats.

### 2. Conversation History Windowing
Send only the last ~40 messages to the generation API. Rely on the memories/day-summary system for older continuity.

### 3. Staleness Tracking for Extraction
Add a `field_update_log` to character session states. If high-volatility fields (mood, location, clothing) remain unchanged for 8+ turns while the character was active, inject a STALENESS ALERT into the extraction prompt.

### 4. Brain Icon -- REMOVE from UI, keep memories hidden in backend
The brain icon and the MemoriesModal are removed from the user-facing UI entirely. The memories infrastructure continues to exist in the background as a backend-only system (used for day summaries and event tracking injected into the prompt). The user never interacts with it directly. This avoids confusion from having data in multiple places.

### 5. Dual-Model SFW/NSFW Routing -- REMOVED FROM PLAN
Not being pursued. Removed entirely.

---

## Prompt Architecture Changes (all in `src/services/llm.ts`)

### Change 1: Add Priority Hierarchy

Insert a new block at the start of the INSTRUCTIONS section (before the existing control/scene presence rules at ~line 539) that establishes explicit rule precedence:

```text
PRIORITY HIERARCHY (GOVERNS ALL RULES BELOW):
1. Control rules (who speaks) -- always highest priority
2. Scene Presence (location checks) -- always enforced
3. Line of Sight -- always enforced
4. During intimate/erotic scenes: NSFW depth and sensory immersion 
   OVERRIDE brevity and anti-repetition constraints
5. Personality traits ALWAYS modulate how content is expressed, 
   including NSFW content
```

**Why:** Grok follows explicit hierarchies. This resolves ambiguity that currently causes it to default to short, conservative responses during intimate scenes.

### Change 2: Replace Brevity Rule

Replace lines 615-616:
```text
BREVITY IS WELCOME: Write only as much as the moment needs. Short, punchy
responses are just as valid as longer descriptive ones. Never pad for length.
```

With:
```text
RESPONSE LENGTH: Match length to the scene's energy and emotional weight.
- Quick exchanges and casual moments: short, punchy responses are ideal.
- Emotionally charged moments, dramatic reveals, intimate scenes: detailed, 
  immersive responses with sensory depth. Do NOT truncate these for brevity.
- Never pad with filler, but never cut short a moment that deserves richness.
```

**Why:** The old wording actively suppressed descriptive output in all contexts. The replacement preserves the anti-padding intent while exempting scenes that deserve depth. This also addresses your general complaint about responses being too short and nondescriptive -- "brevity is welcome" was a major contributor to that.

### Change 3: Add NSFW Intensification Block

Add a new sub-block inside the High Intensity NSFW section (after the existing PACING block, ~line 452). This is based on Grok's recommendations with modifications:

```text
NSFW INTENSIFICATION (ACTIVE WHEN HIGH INTENSITY IS ON):
During intimate scenes, amplify explicit, sensory immersion to evoke 
a vivid erotic novel style -- prolong acts with layered buildup, 
vulgar language, and raw details:
- Use direct, anatomical terminology (e.g., cock, pussy, ass, tits, cum) 
  integrated naturally into actions and dialogue.
- Describe physical sensations in detail (e.g., the slick heat of arousal, 
  throbbing hardness, clenching muscles, shivering skin).
- Incorporate vocal and emotional reactions (e.g., breathy moans, 
  desperate whimpers, gasps of pleasure, waves of ecstasy building 
  to release).
- Draw out progression step-by-step: Tease foreplay, escalate 
  penetration or touch, layer multiple senses (sight, sound, taste, 
  smell) before climax.
- FORBIDDEN: Summarizing intimate acts (e.g., "They made love" or 
  "He finished quickly"). Show, don't tell.
- FORBIDDEN: Rushing to orgasm/climax in fewer than 3 exchanges 
  unless the user explicitly drives it there.
```

### Change 4: Add Personality-Modulated Intimacy Block

Add immediately after the NSFW Intensification block:

```text
PERSONALITY-MODULATED INTIMACY:
- A shy character does not suddenly become aggressive. Their desire 
  shows through nervous touches, whispered confessions, and 
  trembling hands.
- A dominant character commands and directs explicitly.
- A reserved character may surprise themselves with intensity but 
  still filters through their established voice.
- ALWAYS filter explicit content through the character's established 
  personality traits and tone. Vulgarity levels should match the 
  character, not a universal mode.
- Tie to personality: For shy/reserved traits, express hesitantly 
  (e.g., whispered pleas); for bold/dominant, command explicitly 
  (e.g., growled demands).
```

**Why:** This prevents the "180-degree shift" problem seen in GPT Girlfriend Online where all characters become identically aggressive in NSFW mode regardless of their defined personality.

### Change 5: Add NSFW Exception to Anti-Repetition Block

Append to the end of the anti-repetition rules (after line 410):

```text
* NSFW EXCEPTION: During intimate scenes, rhythmic repetition of 
  sensory elements (moans, building sensations, escalating 
  descriptions) is PERMITTED and ENCOURAGED when it serves 
  tension-building. The anti-repetition rules apply to narrative 
  structure and dialogue patterns, not to the natural rhythm of 
  physical intimacy.
```

**Why:** The strict anti-repetition rules currently suppress the natural rhythm of intimate scenes. A targeted carve-out is safer than relaxing the overall rules (which were built to fix real text-recycling problems).

### Change 6: Add Violation Check to Line of Sight

Append to the end of the Line of Sight block (after line 370):

```text
* VIOLATION CHECK: Before finalizing your response, re-read it and 
  DELETE any references where a character names specific hidden 
  attributes (color, material, style) of concealed items. 
  Knowledge-based wondering is allowed; visual specifics of hidden 
  items are NOT.
```

**Why:** Mirrors the existing violation check pattern at lines 546-548 that already works for control enforcement.

### Change 7: Add NSFW-Aware Style Hints

Add a second style hints array and conditional selection logic (code change, ~15 lines):

```typescript
const nsfwStyleHints = [
  '[Style: draw out this moment with sensory detail -- what does it feel like?]',
  '[Style: build tension slowly, let the anticipation simmer]',
  '[Style: focus on physical sensations and sounds, not just actions]',
  '[Style: let the character express desire through their unique voice]',
  '[Style: extend the scene -- do not rush to conclusion]',
];
```

The `getRandomStyleHint()` function will check whether NSFW High Intensity is active. If so, it uses the `nsfwStyleHints` array instead of the general one. The general style hints ("try a shorter response", "lean into dialogue, keep narration minimal") actively work against NSFW quality when randomly selected during intimate scenes.

---

## UI Change

### Remove Brain Icon from Chat Bubbles

- Remove the `MemoryQuickSaveButton` component rendering from `ChatInterfaceTab.tsx` (around line 3012-3017)
- The `MemoryQuickSaveButton` component file itself can remain for now (dead code cleanup later) or be removed
- The memories infrastructure (`Memory` type, the edge function, the database table) stays intact for backend use in the day-summary system

---

## Summary of All Changes

| Change | File | Type | Lines |
|--------|------|------|-------|
| Priority Hierarchy | `llm.ts` | New prompt block | ~8 lines |
| Replace Brevity Rule | `llm.ts` | Rewrite existing | ~5 lines |
| NSFW Intensification | `llm.ts` | New prompt block | ~15 lines |
| Personality-Modulated Intimacy | `llm.ts` | New prompt block | ~12 lines |
| NSFW Anti-Repetition Exception | `llm.ts` | Append to existing | ~5 lines |
| Line of Sight Violation Check | `llm.ts` | Append to existing | ~4 lines |
| NSFW-Aware Style Hints | `llm.ts` | New code + array | ~15 lines |
| Remove Brain Icon | `ChatInterfaceTab.tsx` | Remove JSX | ~5 lines removed |

Total: ~65 new lines of prompt text, ~15 lines of code logic, ~5 lines removed from UI. No database migrations, no new edge functions, no architectural changes.

