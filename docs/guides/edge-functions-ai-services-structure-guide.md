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
| `extract-character-updates` | `supabase/functions/extract-character-updates/index.ts` | Extracts character state changes from conversation | grok-3-mini (Bug #4: should be grok-3) |
| `extract-memory-events` | `supabase/functions/extract-memory-events/index.ts` | Extracts memory-worthy events from messages | AI model |
| `evaluate-arc-progress` | `supabase/functions/evaluate-arc-progress/index.ts` | Evaluates story arc progress against goals | AI model |
| `generate-cover-image` | `supabase/functions/generate-cover-image/index.ts` | Generates scenario cover images | Image generation model |
| `generate-scene-image` | `supabase/functions/generate-scene-image/index.ts` | Generates in-chat scene images | Image generation model |
| `generate-side-character` | `supabase/functions/generate-side-character/index.ts` | AI-generates side character profiles | AI model |
| `generate-side-character-avatar` | `supabase/functions/generate-side-character-avatar/index.ts` | Generates avatars for side characters | Image generation model |
| `check-shared-keys` | `supabase/functions/check-shared-keys/index.ts` | Validates shared API keys | N/A |
| `sync-guide-to-github` | `supabase/functions/sync-guide-to-github/index.ts` | Syncs guide documents to GitHub repo | N/A |
| `migrate-base64-images` | `supabase/functions/migrate-base64-images/index.ts` | Migrates legacy base64 images to storage | N/A |

---

## 3. Frontend AI Services

### `src/services/llm.ts` (~1054 lines)

Core LLM integration service.

| Export | Purpose |
|--------|--------|
| `generateRoleplayResponseStream()` | Streams AI responses for chat |
| `getSystemInstruction()` | Builds the complete system prompt |
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
2. Character state blocks (all characters)
3. Story arc/goal directives (with flexibility levels)
4. Content theme directives (genres, character types, trigger warnings)
5. Custom world sections
6. Structured locations
7. Dialog formatting rules (POV-dependent)
8. Time of day context
9. Memory context (if enabled)
10. Opening dialog (if first message)
```

---

## 5. Known Bugs in AI Layer

| Bug # | Description | Affected Files | Status |
|-------|-------------|----------------|--------|
| #1 | `buildCharacterStateBlock()` omits empty sections — AI cannot see 13/16 possible character section types | `src/services/llm.ts` | ACTIVE |
| #2 | `personality.traits` missing from TRACKABLE FIELDS | `supabase/functions/extract-character-updates/index.ts` | ACTIVE |
| #3 | `preferredClothing` field name mismatch (camelCase vs snake_case) | `supabase/functions/extract-character-updates/index.ts` | ACTIVE |
| #4 | Wrong model: `grok-3-mini` instead of `grok-3` for extraction | `supabase/functions/extract-character-updates/index.ts` | ACTIVE |
| #5 | Extraction prompt lacks analytical depth | `supabase/functions/extract-character-updates/index.ts` | ACTIVE |
| #6 | Memory system incomplete — no long-term accumulation | `supabase/functions/extract-memory-events/index.ts` | ACTIVE |

---

## 6. Image Generation Pipeline

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

---

## 13. Planned / Future Changes

- Memory consolidation system (long-term memory summarization)
- Fix extraction model from grok-3-mini to grok-3
- Improve extraction prompt depth

> Last updated: 2026-03-01 — Initial creation.