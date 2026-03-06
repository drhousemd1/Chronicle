ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS time_progression_mode text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS time_progression_interval integer NOT NULL DEFAULT 15;