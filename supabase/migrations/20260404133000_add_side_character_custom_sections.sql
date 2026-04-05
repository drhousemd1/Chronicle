ALTER TABLE public.side_characters
ADD COLUMN IF NOT EXISTS custom_sections JSONB DEFAULT '[]'::jsonb;

UPDATE public.side_characters
SET custom_sections = '[]'::jsonb
WHERE custom_sections IS NULL;
