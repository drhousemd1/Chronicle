

# Finance Dashboard Contract Repair

## Problem
The previous migration created tables with schemas that don't match what the frontend code and edge functions expect. Every table has missing columns:

| Table | Missing columns code needs |
|-------|---------------------------|
| `ad_spend` | `name`, `description`, `url`, `status`, `recurring_cost`, `cost_cadence`, `start_date`, `spent_override` |
| `admin_notes` | `note_key`, `content_html`, `updated_by` |
| `reports` | `reporter_user_id`, `accused_user_id`, `note` |
| `ai_usage_test_events` | `user_id`, `event_key`, `api_call_group`, `event_source`, `model_id`, `input_chars`, `output_chars`, `input_tokens_est`, `output_tokens_est`, `total_tokens_est`, `est_cost_usd`, `status`, `metadata` |
| `user_strikes` | `report_id`, `points`, `note`, `status`, `issued_at`, `falls_off_at`, `updated_at` |
| `set_admin_access` | Function arg is `_user_id` but code calls `_target_user_id` |

## What I will do

### Step 1: Apply the repair migration
Create `supabase/migrations/20260404_finance_contract_repair.sql` with the exact SQL provided. This adds all missing columns using `ADD COLUMN IF NOT EXISTS`, backfills data, rebuilds RLS policies, and recreates `set_admin_access` with the correct `_target_user_id` argument name.

### Step 2: Verify with SQL queries
Run the 4 verification queries to confirm all columns, functions, and policies are correct.

### Step 3: Code checks
Confirm `FinanceDashboardTool.tsx`, `track-api-usage-test/index.ts`, and `admin-api-usage-test-report/index.ts` field references match the repaired schema. No code changes needed — the migration aligns the DB to the existing code contract.

## Files changed
- **New migration**: `supabase/migrations/20260404_finance_contract_repair.sql`
- Types file will auto-regenerate after migration

## What stays untouched
- `src/components/admin/finance/FinanceDashboardTool.tsx` — already uses correct field names
- All edge functions — already use correct field names
- All UI layout and styling

