

# Idempotent Hardening of Finance Repair Migration

## Problem
The repair migration's UPDATE statements reference columns that may not exist in a fresh database replay:
- `ad_spend`: references `campaign_name`, `platform`, `amount`, `notes` — never added
- `admin_notes`: references `content` — never added
- `reports`: references `reporter`, `accused` — never added  
- `ai_usage_test_events`: references `event_type`, `payload` — never added

If the migration runs against a DB where the earlier creation migration used different column sets, these UPDATEs fail.

## Fix
Patch the existing `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` blocks in `supabase/migrations/20260404051740_72f00518-df04-4eda-a14e-38593ab3fbea.sql` to include ALL columns referenced in the subsequent UPDATE statements. No new migration file. No logic changes.

### ad_spend section (line 16-24)
Add to the ALTER block:
- `campaign_name text`
- `platform text`
- `amount numeric(12,2)`
- `currency text`
- `period_start date`
- `period_end date`
- `notes text`

### admin_notes section (line 61-64)
Add to the ALTER block:
- `content text`
- `author_id uuid`

### reports section (line 92-96)
Add to the ALTER block:
- `reporter text`
- `accused text`
- `story_id uuid`

### ai_usage_test_events section (line 194-206)
Add to the ALTER block:
- `event_type text`
- `function_name text`
- `payload jsonb`
- `response_summary text`
- `status_code integer`
- `error_message text`

## What stays untouched
- All policy/trigger/function logic — identical
- All UPDATE backfill logic — identical
- All other files — no changes
- The second migration file (`20260404051750_...`) — untouched

## Verification
- Run column inventory query for all 5 tables
- Confirm `set_admin_access` args are `_target_user_id uuid, _enabled boolean`
- Confirm build passes

