-- Add avatar columns to character_session_states for session-scoped avatar overrides
ALTER TABLE public.character_session_states
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS avatar_position JSONB DEFAULT '{"x": 50, "y": 50}'::jsonb;