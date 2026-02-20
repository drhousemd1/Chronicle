

# Fix "Written by Anonymous" and Gallery Loading Issues

## Issue 1: "Written by Anonymous" on Your Stories page

**Root cause**: The `fetchUserProfile` function in `supabase-data.ts` only fetches `username` from the profiles table, but the user's `username` is null. Their **display name** is "Dr. House" (stored in `display_name`), which is what should be shown.

**Changes:**

### `src/services/supabase-data.ts` (lines 1751-1764)
- Update `fetchUserProfile` to select `display_name` in addition to (or instead of) `username`
- Update the return type to include `display_name`

### `src/pages/Index.tsx`
- **Line 172**: Update the `userProfile` state type to include `display_name`
- **Line 1745**: Change `ownerUsername={userProfile?.username || undefined}` to `ownerUsername={userProfile?.display_name || userProfile?.username || undefined}` so it prefers display_name

---

## Issue 2: Community Gallery not loading (spinning forever)

**Root cause**: The `published_scenarios` table has no foreign key constraint pointing to `scenarios.id`. PostgREST uses foreign keys to resolve relationship joins like `scenarios!inner(...)`. Without a FK, the `scenarios!inner` join in `fetchPublishedScenarios` may fail or behave unpredictably.

Additionally, the CreatorProfile page query (line 63) uses the same `scenarios!inner` pattern, which has the same fragility.

**Changes:**

### Database migration
- Add a foreign key from `published_scenarios.scenario_id` to `scenarios.id` to make PostgREST joins reliable:
```sql
ALTER TABLE public.published_scenarios
  ADD CONSTRAINT published_scenarios_scenario_id_fkey
  FOREIGN KEY (scenario_id) REFERENCES public.scenarios(id)
  ON DELETE CASCADE;
```

### `src/services/gallery-data.ts`
- Add error handling / fallback in `fetchPublishedScenarios` so it doesn't silently hang if the join fails -- wrap the query in a try/catch and return an empty array with an error toast instead of throwing

---

## Summary of file changes

| File | Change |
|---|---|
| `src/services/supabase-data.ts` | Fetch `display_name` in `fetchUserProfile` |
| `src/pages/Index.tsx` | Update type and prefer `display_name` over `username` |
| Database migration | Add FK from `published_scenarios.scenario_id` to `scenarios.id` |
| `src/services/gallery-data.ts` | Improve error resilience in `fetchPublishedScenarios` |

