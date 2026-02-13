
-- Add new JSONB columns for character sections
ALTER TABLE public.characters
  ADD COLUMN IF NOT EXISTS background jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS tone jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS key_life_events jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS relationships jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS secrets jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS fears jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS personality jsonb DEFAULT NULL;

-- Add same columns to character_session_states for session overrides
ALTER TABLE public.character_session_states
  ADD COLUMN IF NOT EXISTS background jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS tone jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS key_life_events jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS relationships jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS secrets jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS fears jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS personality jsonb DEFAULT NULL;
