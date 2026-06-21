## Operational redeploy + boot-log verification

Scope: redeploy 10 edge functions from latest repo code and verify clean startup logs. No source, schema, RLS, storage, migration, secret, Quality Hub, or UI changes.

### Functions to redeploy (single batched call)
1. chat
2. extract-character-updates
3. extract-memory-events
4. evaluate-goal-progress
5. evaluate-goal-alignment
6. compress-day-memories
7. track-ai-usage
8. track-api-usage-test
9. api-usage-test-session
10. admin-api-usage-test-report

### Steps

1. Call `supabase--deploy_edge_functions` once with all 10 function names.
2. For each function, call `supabase--edge_function_logs` and inspect the most recent boot/import lines. Focus on:
   - "booted" / "listening" / serve start lines
   - Import errors referencing `../_shared/cors.ts`, `../_shared/rate-limit.ts`, `../_shared/xai-responses.ts`, `../_shared/server-usage.ts`, `../_shared/usage-cost.ts`
   - Any Deno module resolution, syntax, or top-level throw errors
3. If a function fails deploy or boot, stop immediately and report the exact function name + failing log lines. No remediation attempts beyond reporting.
4. If all clean, report:
   - Per-function deploy status
   - Per-function boot log summary (or raw key lines)
   - Confirmation no source/schema/RLS/storage/migration/secret changes occurred
   - Readiness statement for Responses API + `store:false` + medium reasoning roleplay test run

### Out of scope (will not touch)
Source files, migrations, RLS, storage buckets/policies, secrets, Quality Hub registries, schema snapshot files, UI.
