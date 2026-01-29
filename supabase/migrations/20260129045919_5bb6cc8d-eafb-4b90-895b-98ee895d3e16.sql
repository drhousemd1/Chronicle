-- Add nicknames column to characters table
ALTER TABLE characters ADD COLUMN nicknames text DEFAULT '';

-- Add nicknames column to side_characters table
ALTER TABLE side_characters ADD COLUMN nicknames text DEFAULT '';

-- Add nicknames column to character_session_states table
ALTER TABLE character_session_states ADD COLUMN nicknames text DEFAULT '';