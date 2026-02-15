
# Grok-Only: Purge All Non-Grok Models and Hardcode Grok as the Sole AI Provider

## Overview

Remove ALL Google Gemini and OpenAI model options. The app uses Grok exclusively via the xAI API. Every fallback, default, model list, and edge function will be locked to Grok models only.

---

## Changes

### 1. `src/constants.tsx` -- Strip model list to Grok only

- Remove all 6 Google/OpenAI entries from `LLM_MODELS`
- Keep only the 3 Grok models, with `grok-3` first (default)
- Remove `requiresKey: true` since Grok is now the only option (the key is managed by the admin)
- Change `gateway` type to just `'xai'` everywhere
- Simplify `IMAGE_MODEL_MAP` to only Grok entries
- Change `getImageModelForTextModel` default fallback from `google/gemini-2.5-flash-image` to `grok-2-image-1212`
- Simplify `getGatewayForModel` to always return `'xai'`
- Add prominent comment: `// GROK ONLY -- This app exclusively uses xAI Grok models. Do NOT add Gemini/OpenAI.`

### 2. `src/services/character-ai.ts` -- Fix fallback models

- Change `FALLBACK_MODELS` from `['openai/gpt-5-mini', 'openai/gpt-5-nano']` to `['grok-3-mini', 'grok-2']`
- Add comment: `// GROK ONLY -- All AI calls use xAI Grok. No Gemini. No OpenAI.`

### 3. `src/components/chronicle/CharactersTab.tsx` -- Fix 2 hardcoded fallbacks

- Line 253: `'google/gemini-3-flash-preview'` to `'grok-3'`
- Line 1251: `"google/gemini-3-flash-preview"` to `"grok-3"`

### 4. `src/components/chronicle/CharacterEditModal.tsx` -- Fix 2 hardcoded fallbacks

- Line 517: `'gemini-2.5-flash'` to `'grok-3-mini'`
- Line 848: `'gemini-3-flash-preview'` to `'grok-3'`

### 5. `src/components/chronicle/ModelSettingsTab.tsx` -- Simplify UI

- Remove the "Built-in" vs "Requires API Key" legend since everything is Grok now
- Remove provider grouping complexity (only one provider: xAI)
- Remove BYOK badge logic (the key is admin-managed, shared)
- Simplify the subtitle and connection panel text

### 6. `src/contexts/ModelSettingsContext.tsx` -- Already uses `LLM_MODELS[0].id`, will auto-resolve to `grok-3`

No code change needed, just inherits from the constants fix.

### 7. `src/utils.ts` -- Already uses `LLM_MODELS[0].id`, same as above

No code change needed.

### 8. `src/services/supabase-data.ts` -- Already uses `LLM_MODELS[0].id`

No code change needed.

### 9. Edge Functions -- Replace all Gemini/OpenAI defaults with Grok

**`supabase/functions/chat/index.ts`**
- Remove `normalizeModelId` function (no more legacy Gemini/OpenAI IDs)
- Remove `callLovableAI` function entirely
- Simplify `getGateway` to always return `'xai'`
- Add comment: `// GROK ONLY -- All chat calls go to xAI. No Gemini. No OpenAI.`

**`supabase/functions/extract-character-updates/index.ts`**
- Line 412: `'google/gemini-2.5-flash'` to `'grok-3-mini'`
- Remove `normalizeModelId` function
- Add Grok-only comment

**`supabase/functions/extract-memory-events/index.ts`**
- Line 110: `"google/gemini-3-flash-preview"` to `"grok-3-mini"`
- Switch from Lovable gateway to xAI API endpoint
- Add Grok-only comment

**`supabase/functions/generate-side-character/index.ts`**
- Line 50: `'google/gemini-3-flash-preview'` to `'grok-3'`
- Remove `normalizeModelId`
- Add Grok-only comment

**`supabase/functions/generate-side-character-avatar/index.ts`**
- Remove all Google/OpenAI entries from `IMAGE_MODEL_MAP` and `TEXT_MODEL_MAP`
- Line 36 fallback: `'google/gemini-2.5-flash-image'` to `'grok-2-image-1212'`
- Line 46: `'google/gemini-2.5-flash'` to `'grok-3-mini'`
- Line 167: `'google/gemini-3-flash-preview'` to `'grok-3'`
- Add Grok-only comment

**`supabase/functions/generate-scene-image/index.ts`**
- Remove all Google/OpenAI entries from `IMAGE_MODEL_MAP`
- Line 83 fallback: `'google/gemini-2.5-flash-image'` to `'grok-2-image-1212'`
- Line 271: `"google/gemini-3-flash-preview"` to `"grok-3-mini"`
- Line 450: `'google/gemini-3-flash-preview'` to `'grok-3'`
- Add Grok-only comment

**`supabase/functions/generate-cover-image/index.ts`**
- Line 59: `'google/gemini-2.5-flash-image'` to `'grok-2-image-1212'`
- Remove the entire Lovable gateway code path (lines 93-106)
- Always use xAI endpoint
- Add Grok-only comment

---

## Files Modified

1. `src/constants.tsx`
2. `src/services/character-ai.ts`
3. `src/components/chronicle/CharactersTab.tsx`
4. `src/components/chronicle/CharacterEditModal.tsx`
5. `src/components/chronicle/ModelSettingsTab.tsx`
6. `supabase/functions/chat/index.ts`
7. `supabase/functions/extract-character-updates/index.ts`
8. `supabase/functions/extract-memory-events/index.ts`
9. `supabase/functions/generate-side-character/index.ts`
10. `supabase/functions/generate-side-character-avatar/index.ts`
11. `supabase/functions/generate-scene-image/index.ts`
12. `supabase/functions/generate-cover-image/index.ts`
