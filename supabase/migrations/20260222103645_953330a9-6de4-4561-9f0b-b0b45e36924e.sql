ALTER TABLE public.library_images
ADD COLUMN tags text[] NOT NULL DEFAULT '{}';