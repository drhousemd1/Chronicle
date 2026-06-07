Operational redeploy only — no source code or schema changes.

## Steps

1. Deploy `extract-character-updates` via `supabase--deploy_edge_functions(["extract-character-updates"])`.
2. Fetch recent logs via `supabase--edge_function_logs` for that function.
3. Verify clean startup: look for `booted` / `Listening on` lines and absence of import errors referencing `_shared/state-sync-completeness.ts`, `_shared/cors.ts`, or `_shared/rate-limit.ts`.
4. Report deploy result and relevant log lines back to the user.

## Out of scope

- No edits to function source unless deploy fails due to a real import/runtime error (in which case I will stop and report before changing anything).
- No DB, RLS, storage, migration, or other function changes.
