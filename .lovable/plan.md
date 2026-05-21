# Redeploy `track-ai-usage` and verify fail-open behavior

## Scope
Operational redeploy + verification only. No source code changes to `supabase/functions/track-ai-usage/index.ts`, `supabase/functions/_shared/cors.ts`, or any other project file.

## Steps

1. **Redeploy the function** from current repo code
   - `supabase--deploy_edge_functions` with `["track-ai-usage"]`.

2. **Check startup/import logs** (before any request handling)
   - `supabase--edge_function_logs` for `track-ai-usage`.
   - Confirm `booted` + `Listening on ...` lines for the new deployment.
   - Look for any pre-handler crash, especially around `../_shared/cors.ts` import.

3. **Verify fail-open behavior with live curl tests** via `supabase--curl_edge_functions` (POST /track-ai-usage). For each case, assert HTTP 200 and body `{ ok: false, skipped: true, reason: "<...>" }`:

   | Case | Request | Expected `reason` |
   |---|---|---|
   | Missing auth | No `Authorization` header (override with empty) | `unauthorized` |
   | Invalid auth | `Authorization: Bearer invalid.token.value` | `invalid_token` |
   | Unsupported event type | Valid preview-session auth, body `{"eventType":"__bogus__"}` | `unsupported_event_type` |
   | Insert failure | Valid auth, body with allowed `eventType` but malformed metadata that would fail insert (best-effort; if insert succeeds, note it — current code already wraps insert errors and returns `usage_insert_failed`) | `usage_insert_failed` (or note pass-through) |
   | Unexpected error | Send non-JSON body (`"not json"`) with valid auth to exercise outer `try/catch` | Either `unsupported_event_type` (empty parse) or `unexpected_error` — both return 200 with `skipped: true` |

   Env-missing case is not testable against live (env is configured); rely on code review confirmation that the branch returns 200 + `env_not_configured`.

4. **Re-check logs** after the test calls for any warnings/errors emitted, and confirm none escape as 5xx.

5. **Report results** raw:
   - Deploy result
   - Raw boot/log lines
   - Each curl: status code + response body
   - Pass/fail summary against the 5 fail-open requirements

## Out of scope
- No edits to edge function code, shared CORS, frontend, DB, or migrations.
- No changes to secrets or config.toml.
