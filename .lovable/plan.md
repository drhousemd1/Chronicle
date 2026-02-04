

# Fix: Published Scenarios Not Visible to Other Users

## Problem

Your published story is not visible to your wife (or any other user) in the Community Gallery because of an RLS policy conflict.

**Root Cause:**

The `fetchPublishedScenarios` function queries `published_scenarios` with an `!inner` join to the `scenarios` table:

```typescript
scenarios!inner (
  id,
  title,
  description,
  cover_image_url,
  cover_image_position
)
```

The `scenarios` table has RLS that only allows users to view their own scenarios:
```
Policy: Users can view own scenarios
USING: (auth.uid() = user_id)
```

When your wife queries the gallery, the join to `scenarios` fails because she doesn't own your scenario. The entire row is filtered out.

---

## Solution

Add a new RLS policy to the `scenarios` table that allows anyone to view scenarios that have been published (linked via the `published_scenarios` table).

```sql
CREATE POLICY "Anyone can view published scenarios via join"
  ON public.scenarios FOR SELECT
  USING (
    auth.uid() = user_id  -- Owner can always see
    OR 
    EXISTS (
      SELECT 1 FROM published_scenarios ps
      WHERE ps.scenario_id = id
      AND ps.is_published = true
      AND ps.is_hidden = false
    )
  );
```

However, since we already have a policy `Users can view own scenarios`, and PostgreSQL RESTRICTIVE policies (Permissive: No) require ALL policies to pass, we need to either:

1. **Drop the existing policy and create a new combined one**, OR
2. **Change the existing policy to be PERMISSIVE** (so that any ONE policy passing is sufficient)

The cleanest approach is to drop the old policy and create a new one that handles both cases.

---

## Database Migration

```sql
-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view own scenarios" ON public.scenarios;

-- Create a new policy that allows:
-- 1. Users to view their own scenarios
-- 2. Anyone to view scenarios that are published
CREATE POLICY "Users can view own or published scenarios"
  ON public.scenarios FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.published_scenarios ps
      WHERE ps.scenario_id = scenarios.id
      AND ps.is_published = true
      AND ps.is_hidden = false
    )
  );
```

---

## Files to Modify

| File | Changes |
|------|---------|
| Database migration | Drop old RLS policy, create new combined policy for `scenarios` table |

---

## Security Considerations

1. **Only published scenarios are exposed** - The `EXISTS` check ensures only scenarios linked to a published entry (with `is_published = true` and `is_hidden = false`) can be viewed by others
2. **Private scenarios remain private** - Unpublished scenarios are still only visible to their owner
3. **No sensitive data exposed** - The gallery only displays title, description, and cover image - not private story content

---

## Result

After this fix:
- Your wife will see your published story in the Community Gallery
- All users can browse published scenarios from any creator
- Unpublished scenarios remain private to their owners
- The "Saved Stories" (bookmarks) feature will also work correctly for viewing saved scenarios

