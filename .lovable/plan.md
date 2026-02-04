

# Fix: Character Cards Not Loading for Remixable/Bookmarked Scenarios

## Problem Identified

When clicking "Edit" on a bookmarked (remixable) story, the character cards remain blank even though scenario metadata loads correctly.

**Root Cause:** The `characters`, `codex_entries`, and `scenes` tables have RLS policies that only allow viewing data when the user owns the **parent scenario**. Since the scenario now allows viewing published content, the child tables need matching policies.

Current restrictive policies:

| Table | Policy | Expression |
|-------|--------|------------|
| `characters` | Users can view own characters | `auth.uid() = user_id` |
| `codex_entries` | Users can view codex via scenario | `scenarios.user_id = auth.uid()` |
| `scenes` | Users can view scenes via scenario | `scenarios.user_id = auth.uid()` |

These all fail when viewing someone else's published scenario.

---

## Solution

Update the RLS policies for `characters`, `codex_entries`, and `scenes` to allow viewing data that belongs to **published scenarios** (same logic as the `scenarios` table fix).

---

## Database Migration

```sql
-- 1. FIX CHARACTERS TABLE
-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view own characters" ON public.characters;

-- Create new policy: view own OR view if scenario is published
CREATE POLICY "Users can view own or published characters"
  ON public.characters FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.published_scenarios ps
      WHERE ps.scenario_id = characters.scenario_id
      AND ps.is_published = true
      AND ps.is_hidden = false
    )
  );

-- 2. FIX CODEX_ENTRIES TABLE
-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view codex via scenario" ON public.codex_entries;

-- Create new policy: view if own scenario OR published scenario
CREATE POLICY "Users can view codex via own or published scenario"
  ON public.codex_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.scenarios s
      WHERE s.id = codex_entries.scenario_id
      AND s.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.published_scenarios ps
      WHERE ps.scenario_id = codex_entries.scenario_id
      AND ps.is_published = true
      AND ps.is_hidden = false
    )
  );

-- 3. FIX SCENES TABLE
-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view scenes via scenario" ON public.scenes;

-- Create new policy: view if own scenario OR published scenario
CREATE POLICY "Users can view scenes via own or published scenario"
  ON public.scenes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.scenarios s
      WHERE s.id = scenes.scenario_id
      AND s.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.published_scenarios ps
      WHERE ps.scenario_id = scenes.scenario_id
      AND ps.is_published = true
      AND ps.is_hidden = false
    )
  );
```

---

## Files to Modify

| File | Changes |
|------|---------|
| Database migration | Update RLS policies for `characters`, `codex_entries`, and `scenes` tables |

No frontend code changes required - `fetchScenarioById` already queries all these tables correctly, it's just RLS blocking the results.

---

## Security Considerations

1. **Only published scenario data is exposed** - The `EXISTS` subquery ensures only content from actively published scenarios can be viewed by others
2. **Write operations unchanged** - INSERT, UPDATE, DELETE policies remain owner-only
3. **Hidden/unpublished content stays private** - The `is_published = true AND is_hidden = false` checks protect unlisted content
4. **Consistent with scenarios fix** - Uses the exact same pattern as the previous `scenarios` table policy update

---

## Result

After this fix:
- Clicking "Edit" on a bookmarked/remixable story will load character cards correctly
- Codex entries and scene images will also populate
- Users can only READ published content - they cannot modify the original author's data
- When they save changes, a new copy is created under their account (the existing remix flow)

