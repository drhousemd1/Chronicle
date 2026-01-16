-- Add hardcoded attribute columns to characters table
ALTER TABLE characters ADD COLUMN IF NOT EXISTS age TEXT DEFAULT '';
ALTER TABLE characters ADD COLUMN IF NOT EXISTS location TEXT DEFAULT '';
ALTER TABLE characters ADD COLUMN IF NOT EXISTS current_mood TEXT DEFAULT '';
ALTER TABLE characters ADD COLUMN IF NOT EXISTS role_description TEXT DEFAULT '';

ALTER TABLE characters ADD COLUMN IF NOT EXISTS physical_appearance JSONB DEFAULT '{
  "hair_color": "",
  "eye_color": "",
  "build": "",
  "body_hair": "",
  "height": "",
  "breast_size": "",
  "genitalia": "",
  "skin_tone": "",
  "makeup": "",
  "body_markings": "",
  "temporary_conditions": ""
}'::jsonb;

ALTER TABLE characters ADD COLUMN IF NOT EXISTS currently_wearing JSONB DEFAULT '{
  "top": "",
  "bottom": "",
  "undergarments": "",
  "miscellaneous": ""
}'::jsonb;

ALTER TABLE characters ADD COLUMN IF NOT EXISTS preferred_clothing JSONB DEFAULT '{
  "casual": "",
  "work": "",
  "sleep": "",
  "underwear": "",
  "miscellaneous": ""
}'::jsonb;

-- Create character_session_states table for per-playthrough isolation
CREATE TABLE IF NOT EXISTS character_session_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  location TEXT DEFAULT '',
  current_mood TEXT DEFAULT '',
  physical_appearance JSONB DEFAULT '{}',
  currently_wearing JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(character_id, conversation_id)
);

-- Enable RLS on character_session_states
ALTER TABLE character_session_states ENABLE ROW LEVEL SECURITY;

-- RLS Policies for character_session_states
CREATE POLICY "Users can view own session states"
ON character_session_states FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own session states"
ON character_session_states FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own session states"
ON character_session_states FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own session states"
ON character_session_states FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_character_session_states_updated_at
BEFORE UPDATE ON character_session_states
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();