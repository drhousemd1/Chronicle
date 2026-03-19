

# Add Fix Documentation to All 4 Fixed Findings

## Problem
The 4 findings marked as "fixed" only have `status: "fixed"` set — they have no record of what was actually changed, when, or by whom. This makes it impossible to trace the work later.

## Approach
For each of the 4 fixed findings, add structured fix documentation using the existing schema fields:
- **`comments`** — Add a comment entry describing exactly what was changed, in which files, and what the fix achieved
- **`verificationStatus`** — Set to `"verified"` 
- **`verifiedBy`** — Add an agent stamp with timestamp
- **`actualBehavior`** / **`expectedBehavior`** — Fill in the before/after state
- **`updatedAt`** — Set to the fix date

## Changes per finding

### qh-sec-20260318-001 (sync-guide-to-github auth)
- **Comment**: "Added `supabase.auth.getUser()` validation after CORS check in `supabase/functions/sync-guide-to-github/index.ts`. Function now returns 401 if no valid Bearer token is present. Unauthenticated callers can no longer trigger GitHub write/delete operations."
- **Expected**: "Edge function validates caller identity before performing GitHub operations"
- **Actual**: "Auth guard added; unauthenticated requests receive 401 Unauthorized"

### qh-sec-20260318-002 (missing config.toml entries)
- **Comment**: "Added `[functions.evaluate-goal-progress]`, `[functions.migrate-base64-images]`, and `[functions.sync-guide-to-github]` entries to `supabase/config.toml` with `verify_jwt = false`. Note: `evaluate-arc-progress` was renamed to `evaluate-goal-progress` during the Story Goals refactor, so no entry was needed for the old name."
- **Expected**: "All deployed edge function directories have matching config.toml entries"
- **Actual**: "Config now lists all 13 functions; directory count matches config entry count"

### qh-data-20260318-003 (localStorage.clear)
- **Comment**: "Replaced `localStorage.clear()` in `src/pages/Index.tsx` with a scoped `clearChronicleStorage()` helper that iterates localStorage keys and only removes those matching Chronicle-owned prefixes: `rpg_`, `draft_`, `chronicle_`, `quality_hub_`. Other origin data is preserved."
- **Expected**: "Fatal-screen recovery only removes Chronicle-owned localStorage keys"
- **Actual**: "Scoped deletion implemented; unrelated browser data is no longer destroyed"

### qh-func-20260318-001 (evaluate-arc-progress stale)
- **Comment**: "This finding is stale. The `evaluate-arc-progress` function was renamed to `evaluate-goal-progress` during the Story Goals refactor (replaced branching arc system with linear checkbox goals). The frontend now invokes `evaluate-goal-progress`, and the config.toml entry was added under that name. No code references to `evaluate-arc-progress` remain."
- **Expected**: "Frontend invocation matches a registered and deployed edge function"
- **Actual**: "Function renamed to evaluate-goal-progress; config entry and frontend invocation aligned"

## File changed
- `src/data/ui-audit-findings.ts` — Add comments, expectedBehavior, actualBehavior, verificationStatus, verifiedBy, and updatedAt to the 4 fixed findings' `extra` objects
- Bump `registryVersion` from `4` to `5` to force UI refresh

