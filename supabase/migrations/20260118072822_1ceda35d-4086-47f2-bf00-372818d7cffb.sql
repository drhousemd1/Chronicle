-- Create side_characters table for persisting AI-generated characters per conversation
CREATE TABLE public.side_characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Core fields
  name TEXT NOT NULL,
  age TEXT DEFAULT '',
  sex_type TEXT DEFAULT '',
  location TEXT DEFAULT '',
  current_mood TEXT DEFAULT '',
  role_description TEXT DEFAULT '',
  
  -- Appearance (JSONB)
  physical_appearance JSONB DEFAULT '{"build": "", "height": "", "makeup": "", "body_hair": "", "eye_color": "", "genitalia": "", "skin_tone": "", "hair_color": "", "breast_size": "", "body_markings": "", "temporary_conditions": ""}'::jsonb,
  currently_wearing JSONB DEFAULT '{"top": "", "bottom": "", "miscellaneous": "", "undergarments": ""}'::jsonb,
  preferred_clothing JSONB DEFAULT '{"work": "", "sleep": "", "casual": "", "underwear": "", "miscellaneous": ""}'::jsonb,
  
  -- Side-character specific (JSONB)
  background JSONB DEFAULT '{"origin": "", "occupation": "", "backstory": "", "relationships": ""}'::jsonb,
  personality JSONB DEFAULT '{"traits": "", "motivations": "", "speech_style": "", "mannerisms": ""}'::jsonb,
  
  -- Avatar
  avatar_url TEXT DEFAULT '',
  avatar_position JSONB DEFAULT '{"x": 50, "y": 50}'::jsonb,
  
  -- Metadata
  first_mentioned_in TEXT DEFAULT '',
  extracted_traits JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.side_characters ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own side characters"
  ON public.side_characters FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own side characters"
  ON public.side_characters FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own side characters"
  ON public.side_characters FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own side characters"
  ON public.side_characters FOR DELETE
  USING (auth.uid() = user_id);

-- Update trigger for updated_at
CREATE TRIGGER update_side_characters_updated_at
  BEFORE UPDATE ON public.side_characters
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();