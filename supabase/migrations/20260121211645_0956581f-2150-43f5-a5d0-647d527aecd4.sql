-- Create sidebar backgrounds table for chat interface theming
CREATE TABLE public.sidebar_backgrounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  is_selected BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sidebar_backgrounds ENABLE ROW LEVEL SECURITY;

-- Users can view their own sidebar backgrounds
CREATE POLICY "Users can view own sidebar backgrounds"
  ON public.sidebar_backgrounds
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own sidebar backgrounds
CREATE POLICY "Users can insert own sidebar backgrounds"
  ON public.sidebar_backgrounds
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own sidebar backgrounds
CREATE POLICY "Users can update own sidebar backgrounds"
  ON public.sidebar_backgrounds
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own sidebar backgrounds
CREATE POLICY "Users can delete own sidebar backgrounds"
  ON public.sidebar_backgrounds
  FOR DELETE
  USING (auth.uid() = user_id);