
-- Create scenario_reviews table
CREATE TABLE public.scenario_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  published_scenario_id uuid NOT NULL REFERENCES public.published_scenarios(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  concept_strength smallint NOT NULL,
  initial_situation smallint NOT NULL,
  role_clarity smallint NOT NULL,
  motivation_tension smallint NOT NULL,
  tone_promise smallint NOT NULL,
  low_friction_start smallint NOT NULL,
  worldbuilding_vibe smallint NOT NULL,
  replayability smallint NOT NULL,
  character_details_complexity smallint NOT NULL,
  spice_level smallint NOT NULL,
  comment text,
  raw_weighted_score numeric(4,3) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (published_scenario_id, user_id)
);

-- Enable RLS
ALTER TABLE public.scenario_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone authenticated can view reviews"
  ON public.scenario_reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can create own reviews"
  ON public.scenario_reviews FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own reviews"
  ON public.scenario_reviews FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own reviews"
  ON public.scenario_reviews FOR DELETE
  USING (user_id = auth.uid());

-- Validation trigger for rating values 1-5
CREATE OR REPLACE FUNCTION public.validate_review_ratings()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.concept_strength < 1 OR NEW.concept_strength > 5
    OR NEW.initial_situation < 1 OR NEW.initial_situation > 5
    OR NEW.role_clarity < 1 OR NEW.role_clarity > 5
    OR NEW.motivation_tension < 1 OR NEW.motivation_tension > 5
    OR NEW.tone_promise < 1 OR NEW.tone_promise > 5
    OR NEW.low_friction_start < 1 OR NEW.low_friction_start > 5
    OR NEW.worldbuilding_vibe < 1 OR NEW.worldbuilding_vibe > 5
    OR NEW.replayability < 1 OR NEW.replayability > 5
    OR NEW.character_details_complexity < 1 OR NEW.character_details_complexity > 5
    OR NEW.spice_level < 1 OR NEW.spice_level > 5
  THEN
    RAISE EXCEPTION 'All ratings must be between 1 and 5';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_review_ratings_trigger
  BEFORE INSERT OR UPDATE ON public.scenario_reviews
  FOR EACH ROW EXECUTE FUNCTION public.validate_review_ratings();

-- Add aggregation columns to published_scenarios
ALTER TABLE public.published_scenarios
  ADD COLUMN review_count integer NOT NULL DEFAULT 0,
  ADD COLUMN avg_rating numeric(3,2) NOT NULL DEFAULT 0;

-- Aggregation trigger function
CREATE OR REPLACE FUNCTION public.update_review_aggregates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  target_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_id := OLD.published_scenario_id;
  ELSE
    target_id := NEW.published_scenario_id;
  END IF;

  UPDATE published_scenarios
  SET
    review_count = (SELECT COUNT(*) FROM scenario_reviews WHERE published_scenario_id = target_id),
    avg_rating = COALESCE((SELECT AVG(raw_weighted_score) FROM scenario_reviews WHERE published_scenario_id = target_id), 0),
    updated_at = now()
  WHERE id = target_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_review_aggregates_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.scenario_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_review_aggregates();

-- Updated_at trigger for reviews
CREATE TRIGGER update_scenario_reviews_updated_at
  BEFORE UPDATE ON public.scenario_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
