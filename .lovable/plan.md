

# Fix extract-memory-events 401 "Invalid JWT"

## Root Cause

The `config.toml` file has `verify_jwt = true` for `extract-memory-events` (line 15-16). This was added by ChatGPT Codex. It causes the Supabase **gateway** to reject the request with `{"code":401,"message":"Invalid JWT"}` before the function code ever runs.

Lovable Cloud deploys edge functions with `verify_jwt = false` by default. All your edge functions already validate JWTs internally in their own code (lines 17-25 of `extract-memory-events/index.ts` do `getUser()` checks). The gateway-level check is redundant and creates race conditions when the frontend calls functions before the auth session is fully refreshed.

This same issue affects **every function** listed in `config.toml` — they all have `verify_jwt = true` added by Codex.

## Fix

**File**: `supabase/config.toml`

Remove all `verify_jwt = true` function blocks. Keep only the `project_id` line. Lovable Cloud's default (`verify_jwt = false`) will apply, and each function's internal auth check continues to protect it.

The resulting file will be:
```toml
project_id = "gialzvvswxadxolnwots"
```

No other files change. No edge function code changes. The functions already handle auth internally.

## Why This Is Safe

Every edge function in the repo already has internal JWT validation (`getUser()` or `getClaims()` + admin role checks). Removing the gateway-level check just stops the double-validation that causes the 401 race condition.

