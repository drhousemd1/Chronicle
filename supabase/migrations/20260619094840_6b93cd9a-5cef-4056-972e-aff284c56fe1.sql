
-- =========================================================================
-- BF-11: Lock down published_scenarios direct read access
-- =========================================================================

DROP POLICY IF EXISTS "Anyone can view published scenarios" ON public.published_scenarios;

CREATE POLICY "Owners can view own publications"
ON public.published_scenarios
FOR SELECT
TO authenticated
USING (publisher_id = auth.uid());

CREATE POLICY "Admins can view all publications"
ON public.published_scenarios
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

REVOKE SELECT ON public.published_scenarios FROM anon;

-- =========================================================================
-- BF-11: Sanitized saved-scenarios reader (omits reported_count and all
-- moderation/internal fields). Scoped to auth.uid().
-- =========================================================================

CREATE OR REPLACE FUNCTION public.get_saved_scenarios_for_user()
RETURNS TABLE(
  id uuid,
  user_id uuid,
  published_scenario_id uuid,
  source_scenario_id uuid,
  created_at timestamptz,
  ps_id uuid,
  ps_scenario_id uuid,
  ps_publisher_id uuid,
  ps_allow_remix boolean,
  ps_tags text[],
  ps_like_count integer,
  ps_save_count integer,
  ps_play_count integer,
  ps_view_count integer,
  ps_avg_rating numeric,
  ps_review_count integer,
  ps_is_published boolean,
  ps_is_hidden boolean,
  ps_created_at timestamptz,
  ps_updated_at timestamptz,
  story_id uuid,
  story_title text,
  story_description text,
  story_cover_image_url text,
  story_cover_image_position jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ss.id,
    ss.user_id,
    ss.published_scenario_id,
    ss.source_scenario_id,
    ss.created_at,
    ps.id,
    ps.scenario_id,
    ps.publisher_id,
    ps.allow_remix,
    ps.tags,
    ps.like_count,
    ps.save_count,
    ps.play_count,
    ps.view_count,
    ps.avg_rating,
    ps.review_count,
    ps.is_published,
    ps.is_hidden,
    ps.created_at,
    ps.updated_at,
    s.id,
    s.title,
    s.description,
    s.cover_image_url,
    s.cover_image_position
  FROM public.saved_scenarios ss
  JOIN public.published_scenarios ps ON ps.id = ss.published_scenario_id
  JOIN public.stories s ON s.id = ps.scenario_id
  LEFT JOIN public.profiles pub ON pub.id = ps.publisher_id
  WHERE ss.user_id = auth.uid()
    AND ps.is_published = true
    AND ps.is_hidden = false
    AND COALESCE(pub.hide_published_works, false) = false
  ORDER BY ss.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_saved_scenarios_for_user() TO authenticated;

-- =========================================================================
-- BF-11: Owner/admin-only moderation counter reader (no UI consumer yet)
-- =========================================================================

CREATE OR REPLACE FUNCTION public.get_scenario_moderation_counters(p_published_scenario_id uuid)
RETURNS TABLE(reported_count integer)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_publisher uuid;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT publisher_id INTO v_publisher
  FROM public.published_scenarios
  WHERE id = p_published_scenario_id;

  IF v_publisher IS NULL THEN
    RETURN;
  END IF;

  IF v_publisher <> v_caller AND NOT public.has_role(v_caller, 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT ps.reported_count
  FROM public.published_scenarios ps
  WHERE ps.id = p_published_scenario_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_scenario_moderation_counters(uuid) TO authenticated;

-- =========================================================================
-- BF-10: Reports — drop Realtime, drop raw own-SELECT, add sanitized RPC
-- =========================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'reports'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.reports';
  END IF;
END $$;

DROP POLICY IF EXISTS "Users can view own submitted reports" ON public.reports;

CREATE OR REPLACE FUNCTION public.get_my_submitted_reports()
RETURNS TABLE(
  id uuid,
  story_id text,
  reason text,
  status text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.id, r.story_id, r.reason, r.status, r.created_at
  FROM public.reports r
  WHERE r.reporter_user_id = auth.uid()
  ORDER BY r.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_submitted_reports() TO authenticated;

-- =========================================================================
-- BF-10: User strikes — drop raw own-SELECT, add sanitized status RPC
-- =========================================================================

DROP POLICY IF EXISTS "Users can view own strikes" ON public.user_strikes;

CREATE OR REPLACE FUNCTION public.get_my_account_status()
RETURNS TABLE(
  active_strike_count integer,
  total_points integer,
  latest_status text,
  latest_falls_off_at date
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN us.status = 'active' THEN 1 ELSE 0 END), 0)::integer AS active_strike_count,
    COALESCE(SUM(CASE WHEN us.status = 'active' THEN us.points ELSE 0 END), 0)::integer AS total_points,
    (
      SELECT us2.status
      FROM public.user_strikes us2
      WHERE us2.user_id = v_caller
      ORDER BY us2.created_at DESC
      LIMIT 1
    ) AS latest_status,
    (
      SELECT us2.falls_off_at
      FROM public.user_strikes us2
      WHERE us2.user_id = v_caller
      ORDER BY us2.created_at DESC
      LIMIT 1
    ) AS latest_falls_off_at
  FROM public.user_strikes us
  WHERE us.user_id = v_caller;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_account_status() TO authenticated;
