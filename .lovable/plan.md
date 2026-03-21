

# Fix Fallback Logic: Retry Same Model, Don't Fall Back to Worse Models

## Problem With My Previous Plan
I proposed removing retry logic entirely — "if it fails, throw an error." That's reckless. API calls fail due to network issues, rate limits, and temporary outages all the time. Retry is essential. The actual problem is that the retry falls back to **different, worse models** (`grok-3-mini`). The fix is to retry with the **same model**.

## What Changes

### `src/services/character-ai.ts`
- **Delete `FALLBACK_MODELS` constant** (line 467) — no list of alternative models needed
- **Rewrite `callAIWithFallback`** to retry the **same model** (e.g., 2-3 attempts with the same `grok-4-1-fast-reasoning`) instead of cycling through different models
- Keep the content_filter check — if content is filtered, retry the same model (the edge function already has the `CONTENT_REDIRECT_DIRECTIVE` logic for 403s, so the retry here catches any remaining edge cases)
- Update the error message from "blocked by all available models" to something like "AI request failed after 3 attempts"
- Update the comment on line 463 from "content-filter fallback" to "AI call with retry"

### All other Phase 1 changes from the approved plan remain the same:
- `CharactersTab.tsx` lines 876, 2243: `'grok-3'` → `'grok-4-1-fast-reasoning'`
- `generate-scene-image/index.ts`: delete useless `TEXT_MODEL_MAP`, fix `'grok-3'` default
- `extract-character-updates/index.ts` line 568: `'grok-3-mini'` → `'grok-4-1-fast-reasoning'` for 403 retry
- `llm.ts` line 842: fix "OpenAI-compatible" comment
- `ChatInterfaceTab.tsx` lines 1475, 1482, 1537: fix "user's selected model" comments
- `constants.tsx`: update stale pricing in model descriptions

### Phase 2 (API Inspector fixes) also unchanged.

## Files Modified
- `src/services/character-ai.ts` — retry same model instead of falling back to worse models
- `src/components/chronicle/CharactersTab.tsx` — fix 2 stale defaults
- `supabase/functions/generate-scene-image/index.ts` — delete dead map, fix default
- `supabase/functions/extract-character-updates/index.ts` — fix 403 retry model
- `src/services/llm.ts` — fix misleading comment
- `src/components/chronicle/ChatInterfaceTab.tsx` — fix misleading comments
- `src/constants.tsx` — fix stale pricing
- `public/api-call-inspector-chronicle.html` — Phase 2 inspector accuracy fixes

