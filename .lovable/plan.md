

# Simplify Model Settings to Static Info Page

## Problem
1. `grok-4-1-fast-non-reasoning` is still in `LLM_MODELS` — we don't use it
2. The UI has clickable model selector buttons — this isn't interactive, it's a status page
3. Text model shows "Connected" badge but Image model doesn't — inconsistent
4. The whole page looks like a "pick your model" UI when it should just list what the app uses

## Changes

### `src/constants.tsx`
- Remove `grok-4-1-fast-non-reasoning` from `LLM_MODELS` — only keep `grok-4-1-fast-reasoning`
- Remove its entry from `IMAGE_MODEL_MAP`

### `supabase/functions/chat/index.ts` + `extract-character-updates/index.ts`
- Remove `grok-4-1-fast-non-reasoning` from `VALID_GROK_MODELS` arrays

### `src/components/chronicle/ModelSettingsTab.tsx` — Full rewrite as static display
- Remove `selectedModelId` / `onSelectModel` props — nothing to select
- Remove the clickable model list entirely
- Replace with a clean static layout:
  - **Active Models** card showing two read-only rows:
    - Text: `Grok 4.1 Fast (Reasoning)` — with connection status badge (same as current)
    - Image: `grok-imagine-image` — with same connection status badge style
  - **API Connection** card — keep the Share toggle (admin-only) and Verify button as-is
- Sidebar cards stay mostly the same (Narrative Core info, About Grok link)

### Parent component that passes `selectedModelId` / `onSelectModel`
- Need to find and update the parent to stop passing these props

