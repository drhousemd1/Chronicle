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