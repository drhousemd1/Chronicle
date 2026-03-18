
CREATE TABLE public.quality_hub_registries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  registry JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.quality_hub_registries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own registry"
  ON public.quality_hub_registries FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own registry"
  ON public.quality_hub_registries FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own registry"
  ON public.quality_hub_registries FOR UPDATE
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own registry"
  ON public.quality_hub_registries FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
