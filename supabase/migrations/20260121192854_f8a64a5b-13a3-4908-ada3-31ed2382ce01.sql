-- Add controlled_by and character_role columns to character_session_states
-- These allow session-scoped overrides for control type and character role

ALTER TABLE public.character_session_states
ADD COLUMN IF NOT EXISTS controlled_by TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS character_role TEXT DEFAULT NULL;