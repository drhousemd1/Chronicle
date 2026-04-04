

# Replay-Safety Hardening for Finance Migration

## Problem
Migration `20260404051740...` has ALTER blocks that add only *some* columns, but the subsequent UPDATE statements reference columns that aren't added yet (they're added later in `20260404053120...`). On a fresh DB replay, the UPDATEs fail.

## Exact Changes

**File**: `supabase/migrations/20260404051740_72f00518-df04-4eda-a14e-38593ab3fbea.sql`

### 2.1 — ad_spend ALTER block (lines 16-24)
Add 7 missing columns: `campaign_name`, `platform`, `amount`, `currency`, `period_start`, `period_end`, `notes`

### 2.2 — admin_notes ALTER block (lines 61-64)
Add 2 missing columns: `content`, `author_id`

### 2.3 — reports ALTER block (lines 92-96)
Add 3 missing columns: `reporter`, `accused`, `story_id`

### 2.4 — user_strikes ALTER block (lines 141-148)
Add 1 missing column: `expires_at`

### 2.5 — ai_usage_test_events ALTER block (lines 194-206)
Add 6 missing columns: `event_type`, `function_name`, `payload`, `response_summary`, `status_code`, `error_message`

## What stays untouched
- All UPDATE/backfill logic — identical
- All policy/trigger/function logic — identical
- All other files — no changes
- The second migration file (`20260404053120...`) — untouched (becomes a harmless no-op)
- `FinanceDashboardTool.tsx`, edge functions, `types.ts` — untouched

## Verification
- Build + lint pass
- Column inventory query for all 5 tables
- `set_admin_access` signature check

