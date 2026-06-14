-- qh-sec-20260607-004: characters parent binding
-- Ensure scenario_id (when set) belongs to a story owned by auth.uid()

DROP POLICY IF EXISTS "Users can create own characters" ON public.characters;
DROP POLICY IF EXISTS "Users can update own characters" ON public.characters;

CREATE POLICY "Users can create own characters"
ON public.characters
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (
    scenario_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.stories s
      WHERE s.id = characters.scenario_id
        AND s.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can update own characters"
ON public.characters
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND (
    scenario_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.stories s
      WHERE s.id = characters.scenario_id
        AND s.user_id = auth.uid()
    )
  )
);