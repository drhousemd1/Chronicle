-- Create user_backgrounds table for storing user background preferences
CREATE TABLE public.user_backgrounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  is_selected BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_backgrounds ENABLE ROW LEVEL SECURITY;

-- RLS Policies - users can only access their own backgrounds
CREATE POLICY "Users can view own backgrounds"
  ON public.user_backgrounds FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own backgrounds"
  ON public.user_backgrounds FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own backgrounds"
  ON public.user_backgrounds FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own backgrounds"
  ON public.user_backgrounds FOR DELETE
  USING (auth.uid() = user_id);

-- Create backgrounds storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('backgrounds', 'backgrounds', true);

-- Storage policies for backgrounds bucket
CREATE POLICY "Users can upload backgrounds"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'backgrounds' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own backgrounds"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'backgrounds' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own backgrounds"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'backgrounds' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view backgrounds"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'backgrounds');