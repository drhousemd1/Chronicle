-- Extend character_session_states table to support full character editing within sessions
-- These fields allow session-scoped overrides without modifying base scenario data

ALTER TABLE public.character_session_states
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS age TEXT,
ADD COLUMN IF NOT EXISTS sex_type TEXT,
ADD COLUMN IF NOT EXISTS role_description TEXT,
ADD COLUMN IF NOT EXISTS preferred_clothing JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS custom_sections JSONB DEFAULT '[]'::jsonb;