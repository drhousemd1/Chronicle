-- Create content_themes table for scenario categorization
CREATE TABLE content_themes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id uuid REFERENCES scenarios(id) ON DELETE CASCADE UNIQUE NOT NULL,
  character_types text[] DEFAULT '{}',
  story_type text,
  genres text[] DEFAULT '{}',
  origin text[] DEFAULT '{}',
  trigger_warnings text[] DEFAULT '{}',
  custom_tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE content_themes ENABLE ROW LEVEL SECURITY;

-- Users can manage their own scenario themes
CREATE POLICY "Users can CRUD own scenario themes"
ON content_themes FOR ALL USING (
  EXISTS (
    SELECT 1 FROM scenarios s
    WHERE s.id = content_themes.scenario_id
    AND s.user_id = auth.uid()
  )
);

-- Public can read themes for published scenarios
CREATE POLICY "Anyone can view published scenario themes"
ON content_themes FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM published_scenarios ps
    WHERE ps.scenario_id = content_themes.scenario_id
    AND ps.is_published = true
    AND ps.is_hidden = false
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_content_themes_updated_at
BEFORE UPDATE ON content_themes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();