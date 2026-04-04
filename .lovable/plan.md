

# Fix `event_type` NOT NULL Constraint on `ai_usage_test_events`

## Problem
The `ai_usage_test_events` table has an `event_type` column that is `NOT NULL` with no default. Both edge functions (`track-api-usage-test` and `track-ai-usage`) insert rows using `event_key` but never set `event_type`. Every insert fails with a not-null constraint violation.

## Fix
One database migration:

```sql
ALTER TABLE public.ai_usage_test_events
  ALTER COLUMN event_type SET DEFAULT '';
```

This makes existing inserts succeed by falling back to an empty string. No edge function or frontend code changes needed.

## Files changed
- **New migration** — adds default `''` to `event_type` column

## What stays untouched
- All edge function code
- All frontend code
- All other tables

