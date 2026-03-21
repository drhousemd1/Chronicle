

# Clean Up Model System: Remove Legacy Models, Rework Admin Panel

## What's Wrong Now

1. **`constants.tsx` has 6 models with fake pricing** — only 2 are actually used (`grok-4-1-fast-reasoning` for text, `grok-imagine-image` for images). The other 4 (`grok-4-fast-*`, `grok-3-mini`, `grok-3`) are legacy dead weight with wrong pricing descriptions.

2. **Admin Model Settings panel shows all 6 models as selectable options** — it looks like a "pick your model" UI, which is misleading. This is an admin-only panel and should just show what the app uses, not present a buffet of choices.

3. **`IMAGE_MODEL_MAP` has entries for all 6 models** — only needs 2 entries (the ones we keep), plus a default fallback.

4. **Edge functions (`chat/index.ts`, `extract-character-updates/index.ts`) have `VALID_GROK_MODELS` whitelists with all 6 models** — should only accept the models we actually use.

5. **DB default for `stories.selected_model` is `'gemini-3-flash-preview'`** — stale from the original multi-provider era. App code overrides it, but it's garbage in the schema.

## What Will Change

### 1. `src/constants.tsx` — Strip to only active models, remove pricing

Remove `grok-4-fast-non-reasoning`, `grok-4-fast-reasoning`, `grok-3-mini`, `grok-3` from `LLM_MODELS`. Keep only:
- `grok-4-1-fast-reasoning` — primary text model for all AI
- `grok-4-1-fast-non-reasoning` — kept as non-reasoning alternative (same price)

Remove all pricing from descriptions. Descriptions should say what the model does, not what it costs (since costs change and we keep getting it wrong).

Clean up `IMAGE_MODEL_MAP` to only have entries for the 2 remaining models, both mapping to `grok-imagine-image`.

Update comment to be clear: "App-wide model config. Set by admin. Not user-selectable."

### 2. `src/components/chronicle/ModelSettingsTab.tsx` — Rework completely

Instead of a "pick any of 6 models" selector, redesign to show:
- **Active Text Model**: `Grok 4.1 Fast (Reasoning)` — displayed as the current app-wide model, not as one option among many
- **Active Image Model**: `grok-imagine-image` — shown for reference
- **Connection status** and **API key sharing toggle** (keep existing admin functionality)
- Clear label: "App-wide AI Configuration — set by admin, applies to all users"
- Remove the model selection list entirely since there's effectively only one choice (reasoning). If the admin ever needs to switch to non-reasoning, they can still do it, but it shouldn't look like a model marketplace.

Actually — keep the selector but only show the 2 remaining models. Make the UI clearly state this is the app-wide setting, not a per-user preference.

### 3. Edge functions — Trim valid model lists

**`supabase/functions/chat/index.ts` line 87**: Change `VALID_GROK_MODELS` to only `['grok-4-1-fast-reasoning', 'grok-4-1-fast-non-reasoning']`.

**`supabase/functions/extract-character-updates/index.ts` line 507**: Same change.

### 4. DB migration — Fix stale default

Create a migration to change `stories.selected_model` default from `'gemini-3-flash-preview'` to `'grok-4-1-fast-reasoning'`.

### 5. `ModelSettingsContext.tsx` — Add clarifying comment

Add comment: "App-wide model setting controlled by admin. Not a per-user preference."

### Critical: What NOT to break

- `getImageModelForTextModel()` still works — it has `|| 'grok-imagine-image'` default
- `getGatewayForModel()` still returns `'xai'` — no change
- All edge function validation still falls back to `'grok-4-1-fast-reasoning'` for invalid model IDs
- `supabase-data.ts` and `utils.ts` still reference `LLM_MODELS[0].id` which will still be `'grok-4-1-fast-reasoning'`
- The retry logic in `character-ai.ts` still works — it retries with the same model

### Files Modified
- `src/constants.tsx` — remove 4 legacy models, remove pricing, clean IMAGE_MODEL_MAP
- `src/components/chronicle/ModelSettingsTab.tsx` — rework UI to show app-wide config, not model marketplace
- `supabase/functions/chat/index.ts` — trim VALID_GROK_MODELS
- `supabase/functions/extract-character-updates/index.ts` — trim VALID_GROK_MODELS
- `src/contexts/ModelSettingsContext.tsx` — add clarifying comment
- DB migration — fix `stories.selected_model` default

