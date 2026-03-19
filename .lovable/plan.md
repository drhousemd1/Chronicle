

# Fix: Quality Hub findings not showing "fixed" status

## Problem
The `status: "fixed"` values are correctly set in the seed data (`ui-audit-findings.ts`), but the Quality Hub's persistence layer is blocking the update. Here's why:

The upgrade function in `ui-audit.tsx` compares the seed's `registryVersion` against the user's persisted copy. Since both are currently version `3`, it skips the upgrade and keeps the old persisted data where all findings are still `"open"`.

## Fix
**Bump `registryVersion` from `3` to `4`** in `src/data/ui-audit-findings.ts` (line 1500).

That's it — one number change. When the page loads, the upgrade function sees `4 > 3`, replaces the stale persisted registry with the updated seed, and the four fixed findings display correctly.

### File changed
- `src/data/ui-audit-findings.ts` — line 1500: `registryVersion: 3` → `registryVersion: 4`

