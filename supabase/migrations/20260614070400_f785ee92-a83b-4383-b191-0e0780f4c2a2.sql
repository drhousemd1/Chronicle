-- qh-sec-20260607-002: published_scenarios ownership + quarantine

DROP POLICY IF EXISTS "Publishers can insert own publications" ON public.published_scenarios;
DROP POLICY IF EXISTS "Publishers can update own publications" ON public.published_scenarios;

CREATE POLICY "Publishers can insert own publications"
ON public.published_scenarios
FOR INSERT
TO authenticated
WITH CHECK (
  publisher_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.stories s
    WHERE s.id = published_scenarios.scenario_id
      AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Publishers can update own publications"
ON public.published_scenarios
FOR UPDATE
TO authenticated
USING (publisher_id = auth.uid())
WITH CHECK (
  publisher_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.stories s
    WHERE s.id = published_scenarios.scenario_id
      AND s.user_id = auth.uid()
  )
);

-- Quarantine: hide any legacy rows whose publisher does not match the
-- underlying story owner. No row deletion. Currently zero such rows.
UPDATE public.published_scenarios ps
SET is_hidden = true, updated_at = now()
FROM public.stories s
WHERE s.id = ps.scenario_id
  AND ps.publisher_id <> s.user_id
  AND ps.is_hidden = false;