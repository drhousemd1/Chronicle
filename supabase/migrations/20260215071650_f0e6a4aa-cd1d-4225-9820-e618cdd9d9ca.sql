
-- Fix 1: Remove anonymous read policy on app_settings
DROP POLICY IF EXISTS "Anyone can read settings" ON app_settings;

-- Fix 2: Add validation to counter functions

-- Like count: validate like record exists for caller
CREATE OR REPLACE FUNCTION public.increment_like_count(published_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM scenario_likes 
    WHERE published_scenario_id = published_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: No like record found';
  END IF;
  UPDATE published_scenarios 
  SET like_count = like_count + 1, updated_at = now()
  WHERE id = published_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_like_count(published_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- After deletion, the like record won't exist, so just validate user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  UPDATE published_scenarios 
  SET like_count = GREATEST(0, like_count - 1), updated_at = now()
  WHERE id = published_id;
END;
$$;

-- Save count: validate save record exists for caller
CREATE OR REPLACE FUNCTION public.increment_save_count(published_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM saved_scenarios 
    WHERE published_scenario_id = published_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: No save record found';
  END IF;
  UPDATE published_scenarios 
  SET save_count = save_count + 1, updated_at = now()
  WHERE id = published_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_save_count(published_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  UPDATE published_scenarios 
  SET save_count = GREATEST(0, save_count - 1), updated_at = now()
  WHERE id = published_id;
END;
$$;

-- Play count: require authentication
CREATE OR REPLACE FUNCTION public.increment_play_count(published_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  UPDATE published_scenarios 
  SET play_count = play_count + 1, updated_at = now()
  WHERE id = published_id;
END;
$$;

-- View count: require authentication
CREATE OR REPLACE FUNCTION public.increment_view_count(published_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  UPDATE published_scenarios 
  SET view_count = view_count + 1, updated_at = now()
  WHERE id = published_id;
END;
$$;
