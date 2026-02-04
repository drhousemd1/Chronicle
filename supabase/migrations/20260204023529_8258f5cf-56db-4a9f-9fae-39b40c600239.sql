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