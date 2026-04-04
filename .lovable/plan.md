

# Add Missing `status` Column to `ai_usage_test_events`

## Problem

The `ai_usage_test_events` table is missing a `status` text column. Two edge functions try to insert into it:

1. **`track-api-usage-test`** (line 167) — inserts `status: "ok"` or `"fail"`
2. **`track-ai-usage`** (line in the test-trace mirror block) — inserts `status: "ok"` or custom string

The table has `status_code` (integer) but no `status` (text). Every insert that includes `status` fails with a column-not-found error, producing the 500 "Failed to insert trace event" response.

This is the root cause of the errors you're seeing when the API usage test tracking is active — every tracked event (character AI, chat, memory, avatars, etc.) tries to write a trace row and fails.

## Fix

One database migration adding the missing column:

```sql
ALTER TABLE public.ai_usage_test_events
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'ok';
```

No edge function or frontend code changes needed — they already use the correct column name.

## What stays untouched
- All edge function code (already correct)
- All frontend tracking code (`trackAiUsageEvent`, `trackApiValidationSnapshot`)
- All other tables
- UI layout and styling

