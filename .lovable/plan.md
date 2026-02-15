
# Fix: Remove Dead LOVABLE_API_KEY Check and Add Model Validation

## Root Causes

1. **`extract-character-updates` edge function** still has a `LOVABLE_API_KEY` check at lines 193-196. This key is no longer used (everything goes through `XAI_API_KEY`), but the function throws an error if it's missing -- which it is, since it was never needed for xAI.

2. **Stale model IDs in database**: Users who previously selected a Gemini model still have `google/gemini-3-flash-preview` stored in the `selected_model` column. When loaded, `appData.selectedModel` passes this stale ID through to edge functions. The `chat` function catches and corrects it, but `extract-character-updates` does not validate the incoming model and sends the invalid ID directly to xAI, which returns a 400 error.

3. **`supabase-data.ts` doesn't sanitize stored models**: When loading from the database, it passes `scenario.selected_model` through without checking if it's a valid Grok model.

## Changes

### File 1: `supabase/functions/extract-character-updates/index.ts`

- **Remove the dead `LOVABLE_API_KEY` check** (lines 193-196) -- this code throws before the xAI code is reached
- **Add Grok model validation** (same pattern as `chat/index.ts`): validate incoming `modelId` against `['grok-3', 'grok-3-mini', 'grok-2']` and force fallback to `grok-3-mini` if invalid

### File 2: `src/services/supabase-data.ts`

- **Sanitize `selectedModel` on load**: When reading `scenario.selected_model`, validate it against the current `LLM_MODELS` list. If the stored value doesn't match any current model ID, fall back to `LLM_MODELS[0].id` (`grok-3`).
- Change lines 353 and 430 from:
  ```
  selectedModel: scenario.selected_model || LLM_MODELS[0].id,
  ```
  to:
  ```
  selectedModel: (scenario.selected_model && LLM_MODELS.some(m => m.id === scenario.selected_model)) 
    ? scenario.selected_model 
    : LLM_MODELS[0].id,
  ```

### File 3: `src/utils.ts`

- Same validation in `normStr(raw?.selectedModel)` path (line 388): validate against `LLM_MODELS` before accepting the stored value.

## Files Modified

1. `supabase/functions/extract-character-updates/index.ts` -- Remove dead LOVABLE_API_KEY check, add model validation
2. `src/services/supabase-data.ts` -- Sanitize stale model IDs on database load
3. `src/utils.ts` -- Sanitize stale model IDs on import/local load
