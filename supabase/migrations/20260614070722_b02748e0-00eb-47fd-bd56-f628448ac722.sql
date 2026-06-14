-- qh-sec-20260607-011: gallery counter integrity
-- 1) scenario_plays ledger table
CREATE TABLE IF NOT EXISTS public.scenario_plays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  published_scenario_id uuid NOT NULL REFERENCES public.published_scenarios(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  played_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_scenario_plays_user_scenario_played_at
  ON public.scenario_plays(user_id, published_scenario_id, played_at DESC);
CREATE INDEX IF NOT EXISTS idx_scenario_plays_published_scenario_id
  ON public.scenario_plays(published_scenario_id);

GRANT SELECT ON public.scenario_plays TO authenticated;
GRANT ALL ON public.scenario_plays TO service_role;
ALTER TABLE public.scenario_plays ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own plays" ON public.scenario_plays;
CREATE POLICY "Users can view own plays"
ON public.scenario_plays
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 2) Generic counter-sync trigger functions
CREATE OR REPLACE FUNCTION public.sync_published_scenario_like_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  v_id := COALESCE(NEW.published_scenario_id, OLD.published_scenario_id);
  UPDATE public.published_scenarios
    SET like_count = (SELECT count(*) FROM public.scenario_likes WHERE published_scenario_id = v_id),
        updated_at = now()
    WHERE id = v_id;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_published_scenario_save_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  v_id := COALESCE(NEW.published_scenario_id, OLD.published_scenario_id);
  UPDATE public.published_scenarios
    SET save_count = (SELECT count(*) FROM public.saved_scenarios WHERE published_scenario_id = v_id),
        updated_at = now()
    WHERE id = v_id;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_published_scenario_play_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  v_id := COALESCE(NEW.published_scenario_id, OLD.published_scenario_id);
  UPDATE public.published_scenarios
    SET play_count = (SELECT count(*) FROM public.scenario_plays WHERE published_scenario_id = v_id),
        updated_at = now()
    WHERE id = v_id;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS sync_like_count ON public.scenario_likes;
CREATE TRIGGER sync_like_count
AFTER INSERT OR DELETE ON public.scenario_likes
FOR EACH ROW EXECUTE FUNCTION public.sync_published_scenario_like_count();

DROP TRIGGER IF EXISTS sync_save_count ON public.saved_scenarios;
CREATE TRIGGER sync_save_count
AFTER INSERT OR DELETE ON public.saved_scenarios
FOR EACH ROW EXECUTE FUNCTION public.sync_published_scenario_save_count();

DROP TRIGGER IF EXISTS sync_play_count ON public.scenario_plays;
CREATE TRIGGER sync_play_count
AFTER INSERT OR DELETE ON public.scenario_plays
FOR EACH ROW EXECUTE FUNCTION public.sync_published_scenario_play_count();

-- 3) Throttled record_scenario_play RPC (5-minute window per user/scenario)
CREATE OR REPLACE FUNCTION public.record_scenario_play(p_published_scenario_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Must reference a real, published, non-hidden scenario
  IF NOT EXISTS (
    SELECT 1 FROM public.published_scenarios
    WHERE id = p_published_scenario_id
      AND is_published = true
      AND is_hidden = false
  ) THEN
    RAISE EXCEPTION 'Scenario not available';
  END IF;

  -- 5-minute throttle per user/scenario
  IF EXISTS (
    SELECT 1 FROM public.scenario_plays
    WHERE published_scenario_id = p_published_scenario_id
      AND user_id = v_user_id
      AND played_at > now() - interval '5 minutes'
  ) THEN
    RETURN;
  END IF;

  INSERT INTO public.scenario_plays (published_scenario_id, user_id)
  VALUES (p_published_scenario_id, v_user_id);
END;
$$;

REVOKE ALL ON FUNCTION public.record_scenario_play(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_scenario_play(uuid) TO authenticated, service_role;

-- 4) Remove legacy counter RPCs (replaced by triggers / record_scenario_play)
DROP FUNCTION IF EXISTS public.increment_like_count(uuid);
DROP FUNCTION IF EXISTS public.decrement_like_count(uuid);
DROP FUNCTION IF EXISTS public.increment_save_count(uuid);
DROP FUNCTION IF EXISTS public.decrement_save_count(uuid);
DROP FUNCTION IF EXISTS public.increment_play_count(uuid);
DROP FUNCTION IF EXISTS public.increment_view_count(uuid);

-- 5) One-time backfill so existing rows match the truth tables
UPDATE public.published_scenarios ps
SET like_count = sub.c, updated_at = now()
FROM (SELECT published_scenario_id, count(*)::int AS c FROM public.scenario_likes GROUP BY published_scenario_id) sub
WHERE ps.id = sub.published_scenario_id AND ps.like_count IS DISTINCT FROM sub.c;

UPDATE public.published_scenarios ps
SET like_count = 0, updated_at = now()
WHERE ps.like_count <> 0
  AND NOT EXISTS (SELECT 1 FROM public.scenario_likes sl WHERE sl.published_scenario_id = ps.id);

UPDATE public.published_scenarios ps
SET save_count = sub.c, updated_at = now()
FROM (SELECT published_scenario_id, count(*)::int AS c FROM public.saved_scenarios GROUP BY published_scenario_id) sub
WHERE ps.id = sub.published_scenario_id AND ps.save_count IS DISTINCT FROM sub.c;

UPDATE public.published_scenarios ps
SET save_count = 0, updated_at = now()
WHERE ps.save_count <> 0
  AND NOT EXISTS (SELECT 1 FROM public.saved_scenarios ss WHERE ss.published_scenario_id = ps.id);
-- play_count stays at its current value; the new ledger starts empty.
-- Triggers will keep it in sync going forward.
