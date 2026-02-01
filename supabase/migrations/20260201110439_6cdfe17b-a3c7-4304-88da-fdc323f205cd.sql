-- Add previous_names column to track old names for character resolution
ALTER TABLE character_session_states 
ADD COLUMN previous_names text[] DEFAULT '{}';