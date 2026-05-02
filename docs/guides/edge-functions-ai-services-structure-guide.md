> **INSTRUCTIONS FOR LOVABLE / AI AGENTS**
>
> MANDATORY: Before editing this file, read `docs/guides/GUIDE_STYLE_RULES.md` in full.
>
> This document is the SINGLE SOURCE OF TRUTH for this page's architecture.

# PAGE: EDGE FUNCTIONS & AI SERVICES

---

## 1. Page Overview

| Field | Detail |
|-------|--------|
| **Purpose** | Central reference for all backend Edge Functions and frontend AI service files. Documents the AI model chain, prompt templates, extraction logic, and image generation pipeline. |
| **Directory** | `supabase/functions/` (Edge Functions), `src/services/` (frontend services) |

---

## 2. Edge Functions Inventory

| Function | Path | Purpose | AI Model Used |
|----------|------|---------|---------------|
| `chat` | `supabase/functions/chat/index.ts` | Main LLM chat endpoint — streams roleplay responses | User-selected model |
| `extract-character-updates` | `supabase/functions/extract-character-updates/index.ts` | Extracts character state changes from conversation (throttled: fires every 5th message) | `grok-4.20-0309-reasoning` (default), `grok-3-mini` (403 safe-mode retry) |
| `extract-memory-events` | `supabase/functions/extract-memory-events/index.ts` | Extracts memory-worthy events from messages | `grok-4.20-0309-reasoning` |
| `evaluate-goal-progress` | `supabase/functions/evaluate-goal-progress/index.ts` | Evaluates story goal progress | `grok-4.20-0309-reasoning` |
| `generate-cover-image` | `supabase/functions/generate-cover-image/index.ts` | Generates scenario cover images | Image generation model |
| `generate-scene-image` | `supabase/functions/generate-scene-image/index.ts` | Generates in-chat scene images | Image generation model |
| `generate-side-character` | `supabase/functions/generate-side-character/index.ts` | AI-generates side character profiles | AI model |
| `generate-side-character-avatar` | `supabase/functions/generate-side-character-avatar/index.ts` | Generates avatars for side characters | Image generation model |
| `check-shared-keys` | `supabase/functions/check-shared-keys/index.ts` | Validates shared API keys | N/A |
| `compress-day-memories` | `supabase/functions/compress-day-memories/index.ts` | Compresses completed-day bullet memories into a 2-3 sentence synopsis | `grok-4.20-0309-reasoning` |
| `sync-guide-to-github` | `supabase/functions/sync-guide-to-github/index.ts` | Syncs guide documents to GitHub repo | N/A |
| `migrate-base64-images` | `supabase/functions/migrate-base64-images/index.ts` | Migrates legacy base64 images to storage | N/A |

---

## 3. Frontend AI Services

### `src/services/llm.ts` (~1054 lines)

Core LLM integration service.

| Export | Purpose |
|--------|--------|
| `generateRoleplayResponseStream()` | Streams AI responses for chat. Accepts optional `lengthDirective` (adaptive length control) and `sessionMessageCount` (precise session depth). |
| `getSystemInstruction()` | Builds the complete system prompt. Includes IN-SESSION TRAIT DYNAMICS, personality-driven NSFW pacing, control quick-reference at top of INSTRUCTIONS, and forward momentum AI-character canon rule. |
| `buildCharacterStateBlock()` | Constructs character context for prompt injection |
| `getCriticalDialogRules()` | Dialog formatting rules (first/third person POV) |
| `buildContentThemeDirectives()` | Imported from `tag-injection-registry.ts` |

### `src/services/character-ai.ts` (~1266 lines)

Character AI operations.

| Export | Purpose |
|--------|--------|
| `aiFillCharacter()` | AI fills missing character fields |
| `aiGenerateCharacter()` | AI generates complete character from prompt |
| `buildFullContext()` | Builds world + other-characters context |

### `src/services/world-ai.ts`

World-building AI operations.

| Export | Purpose |
|--------|--------|
| `aiEnhanceWorldField()` | AI enhances individual world fields |

### `src/services/side-character-generator.ts`

Side character discovery and creation.

| Export | Purpose |
|--------|--------|
| `parseMessageSegments()` | Parses message into dialog/action/thought segments |
| `detectNewCharacters()` | Identifies new character names in AI responses |
| `createSideCharacter()` | Creates side character entry |

---

## 4. System Prompt Architecture

The system prompt in `getSystemInstruction()` is constructed in this order:

```
1. Role definition + world context
2. Character state blocks (AI-controlled characters only; user-controlled listed as names-only reference)
3. Story arc/goal directives (with flexibility levels)
4. Content theme directives (genres, character types, trigger warnings)
5. Custom world sections
6. Structured locations
7. Dialog formatting rules (POV-dependent)
8. Time of day context
9. Memory context (if enabled)
10. Opening dialog (if first message)
11. INSTRUCTIONS block:
    a. DO NOT GENERATE FOR quick-reference (user-controlled characters, top of block)
    b. Priority hierarchy
    c. Control context + scene presence
    d. Forward momentum (includes AI-character canon rule)
    e. Anti-repetition (shape variation only, no length rules)
    f. NSFW rules (intensity/permissiveness only, no verbosity overlap)
    g. Verbosity rules (includes intimate scene detail lines for detailed mode)
    h. IN-SESSION TRAIT DYNAMICS (trait softening over session depth)
    i. Personality trait adherence
```

---

## 5. Known Bugs in AI Layer

| Bug # | Description | Affected Files | Status |
|-------|-------------|----------------|--------|
| #1 | `buildCharacterStateBlock()` now outputs scaffolding placeholders for all section types when empty | `supabase/functions/extract-character-updates/index.ts` | RESOLVED — 2026-03-01 |
| #2 | `personality.traits` added to TRACKABLE FIELDS for unified mode | `supabase/functions/extract-character-updates/index.ts` | RESOLVED — 2026-03-01 |
| #3 | `preferredClothing` field name mismatch (underwear vs undergarments) | `supabase/functions/extract-character-updates/index.ts` | RESOLVED — 2026-03-01 — preferredClothing.underwear renamed to preferredClothing.undergarments in TRACKABLE FIELDS |
| #4 | Default model changed to `grok-3`; 403 retry remains `grok-3-mini` | `supabase/functions/extract-character-updates/index.ts` | RESOLVED — 2026-03-01 |
| #5 | Extraction prompt lacks analytical depth | `supabase/functions/extract-character-updates/index.ts` | RESOLVED — 2026-03-01 — Added 7-block analytical depth framework: psychological inference, progressive refinement, conflict resolution, split mode detection, tone inference, cross-field coherence, complete trait lifecycle |
| #6 | Memory system incomplete — no long-term accumulation | `supabase/functions/extract-memory-events/index.ts`, `supabase/functions/compress-day-memories/index.ts`, `src/services/llm.ts`, `src/services/supabase-data.ts`, `src/types.ts`, `src/components/chronicle/ChatInterfaceTab.tsx` | RESOLVED — 2026-03-01 — Auto-extraction fires after every AI response, day-transition compression via compress-day-memories edge function (grok-3-mini), entryType field distinguishes bullets from synopses, previousDayRef reset on conversation switch, memoriesLoaded guard prevents stale-state compression |
| #7 | Response length anchoring — all responses same length | `src/services/llm.ts`, `src/components/chronicle/ChatInterfaceTab.tsx` | RESOLVED — 2026-03-01 — Added adaptive length directive system with responseLengthsRef tracking, removed RESPONSE SHAPE & LENGTH from antiRepetitionRules |
| #8 | Forward momentum — AI re-narrates user-authored AI character content | `src/services/llm.ts`, `src/components/chronicle/ChatInterfaceTab.tsx` | RESOLVED — 2026-03-01 — Added AI-character canon rule to FORWARD MOMENTUM, canon note detection in handleSend |
| #9 | Control rule reliability — AI generates for user-controlled characters | `src/services/llm.ts` | RESOLVED — 2026-03-01 — CAST filtered to AI-only, DO NOT GENERATE FOR quick-reference at top of INSTRUCTIONS |
| #10 | No in-session trait evolution guidance | `src/services/llm.ts`, `src/types.ts` | RESOLVED — 2026-03-01 — Added IN-SESSION TRAIT DYNAMICS block, personality-driven NSFW pacing, adherenceScore/scoreTrend on PersonalityTrait |
| #11 | NSFW intensity and verbosity instruction overlap | `src/services/llm.ts` | RESOLVED — 2026-03-01 — Moved sensory detail lines from nsfwRules to verbosityRules detailed block |
| #12 | Dialogue loops — AI re-asks confirmed questions, defers action with "later/soon/tomorrow," rehashes prior dialogue | `src/services/llm.ts`, `src/components/chronicle/ChatInterfaceTab.tsx`, `supabase/functions/chat/index.ts` | RESOLVED — 2026-03-07 — Added Confirmation Closure Protocol, No Deferral Loop, No Rehash rules to system prompt. Priority hierarchy updated: forward-momentum rules rank #2, never overridden. Runtime anti-loop micro-directives injected before send/regenerate. |
| #13 | Regeneration context duplication — user message included twice (in truncated history + as new message) reinforcing repetition | `src/components/chronicle/ChatInterfaceTab.tsx` | RESOLVED — 2026-03-07 — Truncation now excludes the triggering user message from history since generateRoleplayResponseStream re-adds it |
| #14 | Detailed mode verbosity uncapped — 7-9 paragraph responses | `src/services/llm.ts` | RESOLVED — 2026-03-07 — Hard paragraph caps: concise 1-2, balanced 1-3, detailed 2-3 (max 4 exceptional). Verbosity-based max_tokens: concise=1024, balanced=2048, detailed=3072 |
| #15 | 403 retry directive encouraged evasive/deferral output | `supabase/functions/chat/index.ts` | RESOLVED — 2026-03-07 — Replaced "deflect/redirect/change subject" with "concrete immediate action pivot," explicitly forbids postponement language |
| #16 | Repetitive "quote→action→thought" triad pattern and passive/reactive AI output | `src/services/llm.ts`, `src/components/chronicle/ChatInterfaceTab.tsx` | RESOLVED — 2026-03-15 — Added TURN PROGRESSION CONTRACT (mandatory scene delta + proactive move per turn), STRUCTURE VARIETY GUARD (forbids repeating same output skeleton), thought frequency caps (0-1 for concise/balanced, 0-2 for detailed), runtime structural repetition and low-initiative detectors in getAntiLoopDirective, diversified style hints with action-led/decision-driven variants, continue prompt rewritten to demand decisive forward action |
| #17 | Multi-character ping-pong — AI generates 8+ alternating character blocks in a single response | `src/services/llm.ts` | RESOLVED — 2026-03-15 — Added block count cap (1-3 blocks, max 4 detailed) to MULTI-CHARACTER RESPONSES. Removed "rapid exchanges" from DIALOGUE REQUIREMENTS and STRUCTURE VARIETY GUARD. Merged PROACTIVE NARRATIVE DRIVE into TURN PROGRESSION CONTRACT, folded RESPONSE SHAPE VARIATION into STRUCTURE VARIETY GUARD, removed duplicate NO REHASH. Removed ping-pong-encouraging style hints. |
| #18 | Ping-pong persists despite prompt rules — model ignores block cap buried in mid-prompt | `src/services/llm.ts`, `src/components/chronicle/ChatInterfaceTab.tsx` | RESOLVED — 2026-03-15 — BLOCK COUNT CAP and TURN PROGRESSION CONTRACT moved to top of INSTRUCTIONS block (immediately after priority hierarchy) for maximum attention weight. Runtime ping-pong detector added to getAntiLoopDirective: counts alternating character blocks in last AI response, injects [ANTI-PING-PONG] directive forcing single-character perspective. Emotional-loop detector added: detects stasis reactions (sobbed/trembled/whispered) without scene-change verbs, injects [ANTI-STAGNATION] directive forcing external event. BLOCK COUNT CAP removed from MULTI-CHARACTER RESPONSES section (now top-level). |


### Avatar Generation

1. User triggers avatar generation in Character Builder
2. Frontend builds prompt from character traits + selected art style
3. Art style prompt injected from `art_styles` table (`backend_prompt` / `backend_prompt_masculine` / `backend_prompt_androgynous`)
4. Edge Function generates image and returns URL
5. Image stored in Supabase Storage

### Scene Image Generation

1. User clicks image button in chat or AI triggers via `[SCENE: ...]` tag
2. Edge Function `generate-scene-image` builds prompt from conversation context
3. Image generated and stored in Supabase Storage
4. Stored in `scenes` table linked to scenario

---

## 7. Constants & Configuration

| File | Purpose |
|------|--------|
| `src/constants/avatar-styles.ts` | Avatar style presets |
| `src/constants/content-themes.ts` | Content theme options (genres, character types, origins) |
| `src/constants/tag-injection-registry.ts` | Maps content theme tags to AI prompt directives |

---

## 12. Known Issues & Gotchas

See Section 5 above for comprehensive bug list.

- **RESOLVED — 2026-03-04**: Model migration — all extraction/compression Edge Functions migrated from `grok-3` / `grok-3-mini` to `grok-4-1-fast-reasoning` as the default model.
- **RESOLVED — 2026-03-04**: Extraction throttling — `extract-character-updates` now only fires every 5th AI response (controlled by `extractionCountRef` in `ChatInterfaceTab.tsx`) to reduce API costs.
- **RESOLVED — 2026-03-04**: CORS hardening — all 12 Edge Functions now use dynamic origin checking via `getCorsHeaders(req)` against an `ALLOWED_ORIGINS` whitelist instead of wildcard `'*'`.
- **RESOLVED — 2026-03-07**: Pass 7 — Dialogue momentum & loop elimination. Confirmation Closure Protocol, No Deferral Loop, No Rehash rules added to system prompt. Priority hierarchy hardened (forward-momentum = #2 priority, never overridden). Runtime anti-loop micro-directives in ChatInterfaceTab. Regeneration context duplication fixed. Verbosity hard-capped with paragraph limits and verbosity-based max_tokens. 403 retry directive rewritten to require concrete action instead of evasive deflection.
- **RESOLVED — 2026-03-15**: Pass 8 — Anti-stagnation & initiative. TURN PROGRESSION CONTRACT mandates concrete scene delta + proactive AI move each turn. STRUCTURE VARIETY GUARD forbids repeating same output skeleton. Internal thoughts made optional with frequency caps. Runtime detectors added for structural triad repetition and low-initiative drift. Style hints diversified with action-led and decision-driven variants. Continue prompt rewritten to demand decisive forward action.
- **RESOLVED — 2026-03-15**: Pass 9 — Multi-character block flooding & prompt declutter. Block count cap added to MULTI-CHARACTER RESPONSES (1-3 blocks, max 4 detailed). PROACTIVE NARRATIVE DRIVE merged into TURN PROGRESSION CONTRACT. RESPONSE SHAPE VARIATION merged into STRUCTURE VARIETY GUARD. Duplicate NO REHASH removed (kept in FORWARD MOMENTUM). "Dialogue-heavy: rapid exchanges" removed from valid shapes. Ping-pong-encouraging style hints replaced.
- **RESOLVED — 2026-03-15**: Pass 10 — Goal-directedness added to TURN PROGRESSION CONTRACT. Every response must now advance at least one active goal, desire, story arc, or core motivation. Non-directional responses explicitly forbidden. AI characters must drive scenes toward their defined goals rather than taking generic action.
- **RESOLVED — 2026-03-15**: Pass 11 — Block-count-as-target fix & paragraph cap clarification. Block count default changed from "1-3" to "1 (default), 2 only for meaningful reactions, 3 only for pivotal moments." Paragraph caps now explicitly state they count TOTAL paragraphs across all character blocks combined. TURN PROGRESSION CONTRACT strengthened with measurable-progress quality bar (vague circling dialogue no longer counts). Style hint encouraging "mix several short dialogue exchanges" replaced with single-character-driven beat.
- **RESOLVED — 2026-03-15**: Pass 12 — Runtime enforcement & prompt restructuring. BLOCK COUNT CAP and TURN PROGRESSION CONTRACT moved from mid-prompt to top of INSTRUCTIONS block (immediately after priority hierarchy) for maximum attention weight. Runtime ping-pong detector added to getAntiLoopDirective: detects 3+ alternating blocks between same 2 characters, injects [ANTI-PING-PONG] directive forcing single-character perspective. Emotional-loop detector added: detects stasis reactions without scene-change verbs, injects [ANTI-STAGNATION] directive forcing external event. BLOCK COUNT CAP removed from MULTI-CHARACTER RESPONSES (now standalone top-level rule).
- **RESOLVED — 2026-03-15**: Pass 13 — Prompt surgery & narrative director fix. Fixed narrative director model from `grok-3-mini` (dead) to `grok-4-1-fast-reasoning`. Compressed INSTRUCTIONS block by ~50%: removed all VIOLATION CHECK paragraphs (model doesn't self-check), merged RESISTANCE HANDLING and DIALOGUE REQUIREMENTS into existing sections, compressed ANTI-REPETITION (25→3 lines), FORWARD MOMENTUM (28→5 lines), CONFIRMATION CLOSURE + NO DEFERRAL (32→7 lines), STRUCTURE VARIETY + INTERNAL THOUGHT USAGE (52→12 lines). Added thought-tail rule: thoughts may NOT be final beat. Fixed regeneration hint removing "more internal thought". Runtime directives (anti-loop + DIRECTOR) now injected as dedicated system message instead of prepended to user text for higher attention weight. Added thought-tail detector to getAntiLoopDirective.

- **RESOLVED — 2026-03-15**: Pass 13 (continued) — Narrative director deployment fix & continue button rewire. Confirmed zero edge function logs for `generate-narrative-directive` (never fired). Added explicit invocation logging to `generateNarrativeDirective()` and error/warn branches. Wired `handleContinueConversation` to consume `narrativeDirectiveRef.current` as `[DIRECTOR]` tag (was previously ignored). Added `generateNarrativeDirective()` call after continue response completes to prime next click. Continue prompt rewritten from generic "DECISIVE FORWARD ACTION" to goal-aware prompt that injects active character goals, pending arc steps, and demands EXECUTION not preparation. Continue handler now also tracks extraction count and response lengths (was missing both).

- **RESOLVED — 2026-03-20**: Pass 15 — Narrative Director removal. The `generate-narrative-directive` edge function and all client-side `[DIRECTOR]` tag logic have been completely removed. The background "second API call" produced tactical directives based on the previous conversation state, which frequently conflicted with the user's latest input — causing the AI to follow outdated suggestions instead of naturally continuing. Removed: edge function, `narrativeDirectiveRef`, `generateNarrativeDirective()` callback, director tag consumption in handleSend/handleContinue/handleRegenerate, `[DIRECTOR]` from priority hierarchy (#2 → removed, remaining priorities renumbered). Anti-loop runtime directives and goal-aware continue prompts remain fully functional.

---

## 13. Planned / Future Changes

None documented.

> Last updated: 2026-03-20 — Pass 15: Narrative Director system removed to fix outdated/disconnected AI responses.