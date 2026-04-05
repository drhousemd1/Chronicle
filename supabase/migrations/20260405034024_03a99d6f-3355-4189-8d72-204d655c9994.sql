ALTER TABLE public.side_characters
  ADD COLUMN IF NOT EXISTS custom_sections jsonb DEFAULT '[]'::jsonb;

UPDATE public.side_characters
  SET custom_sections = '[]'::jsonb
  WHERE custom_sections IS NULL;

ALTER TABLE public.side_characters
  ALTER COLUMN custom_sections SET NOT NULL;