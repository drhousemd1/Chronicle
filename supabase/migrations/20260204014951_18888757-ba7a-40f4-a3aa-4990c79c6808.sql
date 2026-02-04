-- =============================================
-- SOCIAL SHARING & DISCOVERY SYSTEM
-- =============================================

-- 1. Published Scenarios Table (Public Gallery Listings)
CREATE TABLE public.published_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID NOT NULL REFERENCES public.scenarios(id) ON DELETE CASCADE,
  publisher_id UUID NOT NULL,
  
  -- Publishing Options
  allow_remix BOOLEAN NOT NULL DEFAULT false,
  
  -- Discovery Tags
  tags TEXT[] NOT NULL DEFAULT '{}',
  
  -- Engagement Metrics
  like_count INTEGER NOT NULL DEFAULT 0,
  save_count INTEGER NOT NULL DEFAULT 0,
  play_count INTEGER NOT NULL DEFAULT 0,
  
  -- Content Moderation
  reported_count INTEGER NOT NULL DEFAULT 0,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  
  -- Status
  is_published BOOLEAN NOT NULL DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(scenario_id)
);

-- GIN index for fast tag searches
CREATE INDEX idx_published_scenarios_tags ON public.published_scenarios USING GIN (tags);
CREATE INDEX idx_published_scenarios_publisher ON public.published_scenarios (publisher_id);

-- Enable RLS
ALTER TABLE public.published_scenarios ENABLE ROW LEVEL SECURITY;

-- RLS Policies for published_scenarios
CREATE POLICY "Anyone can view published scenarios"
  ON public.published_scenarios FOR SELECT
  TO authenticated
  USING (is_published = true AND is_hidden = false);

CREATE POLICY "Publishers can insert own publications"
  ON public.published_scenarios FOR INSERT
  TO authenticated
  WITH CHECK (publisher_id = auth.uid());

CREATE POLICY "Publishers can update own publications"
  ON public.published_scenarios FOR UPDATE
  TO authenticated
  USING (publisher_id = auth.uid());

CREATE POLICY "Publishers can delete own publications"
  ON public.published_scenarios FOR DELETE
  TO authenticated
  USING (publisher_id = auth.uid());

-- 2. Scenario Likes Table
CREATE TABLE public.scenario_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  published_scenario_id UUID NOT NULL REFERENCES public.published_scenarios(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(published_scenario_id, user_id)
);

CREATE INDEX idx_scenario_likes_published ON public.scenario_likes (published_scenario_id);
CREATE INDEX idx_scenario_likes_user ON public.scenario_likes (user_id);

-- Enable RLS
ALTER TABLE public.scenario_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for scenario_likes
CREATE POLICY "Anyone can view likes"
  ON public.scenario_likes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own likes"
  ON public.scenario_likes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own likes"
  ON public.scenario_likes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- 3. Saved Scenarios Table
CREATE TABLE public.saved_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  published_scenario_id UUID NOT NULL REFERENCES public.published_scenarios(id) ON DELETE CASCADE,
  source_scenario_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, published_scenario_id)
);

CREATE INDEX idx_saved_scenarios_user ON public.saved_scenarios (user_id);

-- Enable RLS
ALTER TABLE public.saved_scenarios ENABLE ROW LEVEL SECURITY;

-- RLS Policies for saved_scenarios
CREATE POLICY "Users can view own saves"
  ON public.saved_scenarios FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own saves"
  ON public.saved_scenarios FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own saves"
  ON public.saved_scenarios FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- 4. Remixed Scenarios Table (Analytics)
CREATE TABLE public.remixed_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_published_id UUID REFERENCES public.published_scenarios(id) ON DELETE SET NULL,
  remixed_scenario_id UUID NOT NULL REFERENCES public.scenarios(id) ON DELETE CASCADE,
  remixer_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_remixed_scenarios_original ON public.remixed_scenarios (original_published_id);
CREATE INDEX idx_remixed_scenarios_remixer ON public.remixed_scenarios (remixer_id);

-- Enable RLS
ALTER TABLE public.remixed_scenarios ENABLE ROW LEVEL SECURITY;

-- RLS Policies for remixed_scenarios
CREATE POLICY "Users can view own remixes"
  ON public.remixed_scenarios FOR SELECT
  TO authenticated
  USING (remixer_id = auth.uid());

CREATE POLICY "Users can insert own remixes"
  ON public.remixed_scenarios FOR INSERT
  TO authenticated
  WITH CHECK (remixer_id = auth.uid());

-- =============================================
-- ATOMIC COUNTER FUNCTIONS
-- =============================================

-- Increment like count
CREATE OR REPLACE FUNCTION public.increment_like_count(published_id UUID)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE published_scenarios 
  SET like_count = like_count + 1, updated_at = now()
  WHERE id = published_id;
END;
$$;

-- Decrement like count
CREATE OR REPLACE FUNCTION public.decrement_like_count(published_id UUID)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE published_scenarios 
  SET like_count = GREATEST(0, like_count - 1), updated_at = now()
  WHERE id = published_id;
END;
$$;

-- Increment save count
CREATE OR REPLACE FUNCTION public.increment_save_count(published_id UUID)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE published_scenarios 
  SET save_count = save_count + 1, updated_at = now()
  WHERE id = published_id;
END;
$$;

-- Decrement save count
CREATE OR REPLACE FUNCTION public.decrement_save_count(published_id UUID)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE published_scenarios 
  SET save_count = GREATEST(0, save_count - 1), updated_at = now()
  WHERE id = published_id;
END;
$$;

-- Increment play count
CREATE OR REPLACE FUNCTION public.increment_play_count(published_id UUID)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE published_scenarios 
  SET play_count = play_count + 1, updated_at = now()
  WHERE id = published_id;
END;
$$;

-- Updated at trigger for published_scenarios
CREATE TRIGGER update_published_scenarios_updated_at
  BEFORE UPDATE ON public.published_scenarios
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();