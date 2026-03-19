

# Fix First Critical/High Findings from Quality Hub

## Fixes to implement (5 findings)

### Fix 1 — Auth guard on `sync-guide-to-github` (CRITICAL: qh-sec-20260318-001)
**File**: `supabase/functions/sync-guide-to-github/index.ts`
- Add Supabase client import
- After CORS check, extract the Authorization header and call `supabase.auth.getUser()`
- Return 401 if no valid user session
- This prevents unauthenticated GitHub write/delete operations

### Fix 2 — Auth guard on `migrate-base64-images` (related to qh-sec-20260318-002)
**File**: `supabase/functions/migrate-base64-images/index.ts`
- Same pattern: add auth check after CORS handler
- Return 401 if unauthenticated
- This is an admin-level operation that must not be publicly callable

### Fix 3 — Add missing config.toml entries (HIGH: qh-sec-20260318-002)
**File**: `supabase/config.toml`
- Add entries for `evaluate-goal-progress`, `migrate-base64-images`, and `sync-guide-to-github`
- Set `verify_jwt = false` to match existing pattern (auth is handled in-function)
- Note: `evaluate-arc-progress` no longer exists — it was renamed to `evaluate-goal-progress` in recent refactor

### Fix 4 — Replace `localStorage.clear()` with scoped deletion (HIGH: qh-data-20260318-003)
**File**: `src/pages/Index.tsx` (line 1713)
- Replace `localStorage.clear()` with a function that only removes Chronicle-owned keys
- Known prefixes/keys: `rpg_campaign_studio_v3_codex`, `rpg_campaign_studio_v3_char_lib`, `rpg_scenario_v3_*`, `rpg_conversation_registry_v1`, `draft_*`, `draft_registry`, `chronicle_sidebar_collapsed`, `chronicle_model_preference`, `quality_hub_registry`
- Iterate `localStorage` keys, remove only those matching Chronicle prefixes
- Preserves unrelated browser data from other apps on the same origin

### Fix 5 — Mark stale arc-progress finding as fixed (HIGH: qh-func-20260318-001)
**File**: `src/data/ui-audit-findings.ts`
- The `evaluate-arc-progress` finding is stale — we already renamed it to `evaluate-goal-progress`
- Add `status: "fixed"` override to this finding's extras

## Status Updates in findings data
After applying fixes 1–4, update these findings to `status: "fixed"`:
- `qh-sec-20260318-001` (sync-guide auth)
- `qh-sec-20260318-002` (missing config.toml entries)
- `qh-data-20260318-003` (localStorage.clear)
- `qh-func-20260318-001` (evaluate-arc-progress stale)

All done via adding `status: "fixed"` to the `extra` parameter of each `finding()` call.

### Files Modified
1. `supabase/functions/sync-guide-to-github/index.ts` — add auth guard
2. `supabase/functions/migrate-base64-images/index.ts` — add auth guard
3. `supabase/config.toml` — add 3 missing function entries
4. `src/pages/Index.tsx` — scoped localStorage cleanup
5. `src/data/ui-audit-findings.ts` — mark 4 findings as "fixed"

