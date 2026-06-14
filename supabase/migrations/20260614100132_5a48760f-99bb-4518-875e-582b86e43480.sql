CREATE OR REPLACE FUNCTION public.get_creator_stats(creator_user_id uuid)
 RETURNS TABLE(published_count bigint, total_likes bigint, total_saves bigint, total_views bigint, total_plays bigint, follower_count bigint)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_caller uuid := auth.uid();
  v_is_owner boolean := (v_caller IS NOT NULL AND v_caller = creator_user_id);
  v_is_admin boolean := (v_caller IS NOT NULL AND public.has_role(v_caller, 'admin'));
  v_hide_works boolean;
  v_hide_details boolean;
  v_followers bigint;
BEGIN
  SELECT
    COALESCE(hide_published_works, false),
    COALESCE(hide_profile_details, false)
  INTO v_hide_works, v_hide_details
  FROM public.profiles
  WHERE id = creator_user_id;

  SELECT COUNT(*)::bigint INTO v_followers
  FROM public.creator_follows WHERE creator_id = creator_user_id;

  IF (v_hide_works OR v_hide_details) AND NOT v_is_owner AND NOT v_is_admin THEN
    RETURN QUERY SELECT 0::bigint, 0::bigint, 0::bigint, 0::bigint, 0::bigint, v_followers;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    COUNT(*)::bigint,
    COALESCE(SUM(like_count),0)::bigint,
    COALESCE(SUM(save_count),0)::bigint,
    COALESCE(SUM(view_count),0)::bigint,
    COALESCE(SUM(play_count),0)::bigint,
    v_followers
  FROM public.published_scenarios
  WHERE publisher_id = creator_user_id
    AND is_published = true
    AND is_hidden = false;
END;
$function$;