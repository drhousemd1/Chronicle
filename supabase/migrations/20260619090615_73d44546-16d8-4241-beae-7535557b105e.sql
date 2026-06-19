
CREATE OR REPLACE FUNCTION public.get_public_scenario_reviews(
  p_published_scenario_id uuid,
  p_limit int DEFAULT 5,
  p_offset int DEFAULT 0
) RETURNS TABLE (
  id uuid,
  raw_weighted_score numeric,
  spice_level int,
  comment text,
  created_at timestamptz,
  reviewer_username text,
  reviewer_display_name text,
  reviewer_avatar_url text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    r.id,
    r.raw_weighted_score,
    r.spice_level,
    r.comment,
    r.created_at,
    CASE WHEN COALESCE(p.hide_profile_details,false) THEN NULL ELSE p.username END,
    CASE WHEN COALESCE(p.hide_profile_details,false) THEN NULL ELSE p.display_name END,
    CASE WHEN COALESCE(p.hide_profile_details,false) THEN NULL ELSE p.avatar_url END
  FROM public.scenario_reviews r
  JOIN public.published_scenarios ps ON ps.id = r.published_scenario_id
  JOIN public.profiles pub ON pub.id = ps.publisher_id
  LEFT JOIN public.profiles p ON p.id = r.user_id
  WHERE r.published_scenario_id = p_published_scenario_id
    AND ps.is_published = true
    AND ps.is_hidden = false
    AND COALESCE(pub.hide_published_works, false) = false
  ORDER BY r.created_at DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 5), 0), 50)
  OFFSET GREATEST(COALESCE(p_offset, 0), 0);
$$;

CREATE OR REPLACE FUNCTION public.get_creator_overall_rating(p_publisher_id uuid)
RETURNS TABLE (rating numeric, total_reviews bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_is_owner boolean := (v_caller IS NOT NULL AND v_caller = p_publisher_id);
  v_is_admin boolean := (v_caller IS NOT NULL AND public.has_role(v_caller,'admin'));
  v_hide boolean;
BEGIN
  SELECT COALESCE(hide_published_works,false) INTO v_hide
    FROM public.profiles WHERE id = p_publisher_id;
  IF v_hide AND NOT v_is_owner AND NOT v_is_admin THEN
    RETURN QUERY SELECT 0::numeric, 0::bigint; RETURN;
  END IF;
  RETURN QUERY
  SELECT COALESCE(AVG(r.raw_weighted_score),0)::numeric,
         COUNT(*)::bigint
  FROM public.scenario_reviews r
  JOIN public.published_scenarios ps ON ps.id = r.published_scenario_id
  WHERE ps.publisher_id = p_publisher_id
    AND ps.is_published = true
    AND ps.is_hidden = false
    AND r.raw_weighted_score IS NOT NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_scenario_reviews(uuid,int,int) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_creator_overall_rating(uuid) TO anon, authenticated;

DROP POLICY IF EXISTS "Anyone authenticated can view reviews" ON public.scenario_reviews;

CREATE POLICY "Users can view own reviews"
  ON public.scenario_reviews FOR SELECT
  TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Admins can view all reviews"
  ON public.scenario_reviews FOR SELECT
  TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE POLICY "Admins can update reviews"
  ON public.scenario_reviews FOR UPDATE
  TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE POLICY "Admins can delete reviews"
  ON public.scenario_reviews FOR DELETE
  TO authenticated USING (public.has_role(auth.uid(),'admin'));
