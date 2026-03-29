

# Add Admin Tier to Subscriber Snapshot + Wire Up API Usage Tier Filter

## What's already working
The **Modify button** on the User Accounts table is already fully wired to the database. When you change a user to Admin or Admin (CFO), it:
- Saves the tier override to `app_settings`
- Calls the `set_admin_access` database function which inserts/deletes from the `user_roles` table
- This grants real admin access (the admin panel visibility, etc.)

So the Modify flow is **not just visual** — it's already persisting to the database correctly.

## What needs to change

### 1. Add Admin row to Subscriber Snapshot
Currently `PAID_TIER_SNAPSHOT_META` and `TIER_BREAKDOWN` only include Starter/Premium/Elite. I'll add an Admin entry (price: $0, color: red to match the existing Admin badge) so the Subscriber Snapshot shows admin users with $0 income but tracked API costs.

Both the Overview and Finance page snapshot builders (`snapshotRows` and `financeSnapshotRows`) filter `dashboardUsers` by `tierSlug` — adding the admin slug will automatically count admin users.

### 2. Wire the "Tier" toggle in API Usage to show per-tier breakdown
Currently the Tier toggle in `ApiUsageMini` sets `byTier` state but doesn't change the data. I'll:
- Update the `admin-ai-usage-timeseries` edge function to accept an optional `userIds` filter parameter
- Pass admin user IDs when "Tier" is selected (from the `dashboardUsers` prop)
- Or, simpler approach: add a `tier` parameter to the edge function that filters `ai_usage_events` by joining against `user_roles` for admin users, and against the tier override settings for other tiers

**Simpler approach chosen**: Since we only have admin users right now, I'll make the Tier toggle show a breakdown chart with an "Admin" line. The edge function will accept an optional `userIds` array to filter events to specific users.

### 3. Pass users data to ApiUsageMini
Currently `ApiUsageMini` doesn't receive the users list. I'll pass `dashboardUsers` so it can determine which user IDs are admin-tier and request filtered data when "Tier" is selected.

## Files changed
- `src/components/admin/finance/FinanceDashboardTool.tsx` — add Admin to `PAID_TIER_SNAPSHOT_META`, pass users to `ApiUsageMini`, implement tier-filtered chart
- `supabase/functions/admin-ai-usage-timeseries/index.ts` — accept optional `userIds` filter to scope usage events to specific users

## What stays untouched
- The Modify button logic (already works correctly)
- `set_admin_access` database function (already deployed)
- All other dashboard widgets

