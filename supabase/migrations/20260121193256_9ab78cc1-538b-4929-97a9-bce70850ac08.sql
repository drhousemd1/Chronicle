-- Add controlled_by and character_role columns to side_characters table
-- These allow users to toggle character control and promote side characters to main

ALTER TABLE public.side_characters
ADD COLUMN IF NOT EXISTS controlled_by TEXT DEFAULT 'AI',
ADD COLUMN IF NOT EXISTS character_role TEXT DEFAULT 'Side';