ALTER TABLE public.user_backgrounds 
ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'Uncategorized',
ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;