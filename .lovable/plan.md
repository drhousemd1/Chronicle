

# Finance Dashboard Full Stabilization

## Overview
This plan addresses three categories of work: (A) missing database objects, (B) build error fixes, and (C) wiring mock/localStorage widgets to live database + storage.

---

## Current State Assessment

**Database gaps** (tables missing from production):
- `ai_usage_test_events` — migration file exists but was never applied
- `ad_spend` — migration file exists but was never applied
- `admin_notes` — migration file exists but was never applied
- `reports` — migration file exists but was never applied
- `user_strikes` — migration file exists but was never applied
- `finance_documents` — no migration exists yet

**Missing function**: `set_admin_access` — migration file exists but was never applied

**Build errors**: `src/data/ui-audit-findings.ts` has 4 invalid `fixLevel` enum values and type widening in `findingsResolved` map

**Mock/localStorage widgets**:
- Reports page uses `MOCK_REPORTS` array (lines 2857-2917)
- Documents page uses `localStorage` (lines 5517-5720+)

---

## Step 1: Apply Missing Migrations via New Combined Migration

Create a single new migration that applies all the missing objects. The existing migration files are in the repo but were never executed against the database. I will create one migration combining:

- `ai_usage_test_events` table + indexes + RLS policies (from the test tracing migration)
- `set_admin_access` function + admin roles view policy (from the admin role sync migration)
- `ad_spend`, `admin_notes`, `reports`, `user_strikes` tables + triggers + RLS (from the finance live wiring migration)
- Security RLS hardening policies (from the security hardening migration)
- Security definer search_path hardening (from the definer hardening migration)
- **New**: `finance_documents` table + indexes + RLS + updated_at trigger
- **New**: Private `finance_documents` storage bucket + storage RLS policies

All statements use `CREATE IF NOT EXISTS` / `DROP POLICY IF EXISTS` patterns to be idempotent.

## Step 2: Fix Build Errors in `ui-audit-findings.ts`

**File**: `src/data/ui-audit-findings.ts`

4 invalid `fixLevel` values:
| Line | Wrong value | Correct value |
|------|------------|---------------|
| 2711 | `"accessibility"` | `"shared-component"` |
| 3147 | `"runtime"` | `"infrastructure"` |
| 3192 | `"security"` | `"infrastructure"` |
| 3242 | `"documentation"` | `"infrastructure"` |

Type widening fix at line 3554: add `as const` assertions:
```typescript
status: "fixed" as const,
verificationStatus: "verified" as const,
```

## Step 3: Wire Reports Page to Live Database

**File**: `src/components/admin/finance/FinanceDashboardTool.tsx`

Replace the `ReportsPage` function (lines ~2857-2917):
- Remove `MOCK_REPORTS` constant usage
- Add `useEffect` to load reports from `supabase.from("reports").select("*")`
- Add loading/error states
- Add realtime subscription via `supabase.channel("reports-changes")`
- Wire status update buttons to `supabase.from("reports").update({ status }).eq("id", id)`
- Add dismissed filter option
- Remove the TODO comment at line 2914
- Keep existing card layout, filter toggle, stat counters, and action buttons

## Step 4: Wire Documents Page to Live Storage + Database

**File**: `src/components/admin/finance/FinanceDashboardTool.tsx`

Replace `DocumentsPage` function (lines ~5517-5720+):
- Remove `localStorage` reads/writes
- Load docs from `supabase.from("finance_documents").select("*").order("created_at", { ascending: false })`
- Upload flow: upload file to `finance_documents` storage bucket, then insert metadata row
- Delete flow: delete storage object + database row
- Preview: generate signed URL from storage bucket for preview/download
- Keep existing upload modal UI, category/note fields, preview modal, file type badges

## Step 5: Deploy and Verify Edge Functions

Confirm these edge functions deploy successfully:
- `admin-ai-usage-summary`
- `admin-ai-usage-timeseries`
- `admin-api-usage-test-report`
- `api-usage-test-session`
- `track-api-usage-test`
- `track-ai-usage`
- `xai-billing-balance`

## Step 6: Verification Queries

Run the 4 verification SQL queries from the task spec to confirm all tables, functions, policies, and storage buckets exist.

---

## Files Changed
- **New database migration** — all missing tables, functions, policies, storage bucket
- `src/data/ui-audit-findings.ts` — fix 4 invalid enum values + type widening
- `src/components/admin/finance/FinanceDashboardTool.tsx` — wire Reports + Documents to live DB/storage

## What Stays Untouched
- All other dashboard widgets (Overview, Marketing, Notes, User Management, API Usage, xAI Billing)
- All existing UI layout and styling
- Edge function code (already exists)
- All other application pages and features

