-- 1. Profiles SELECT: restrict to owner + admin
DROP POLICY IF EXISTS "Anyone authenticated can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 2. Public chips RPC (minimal, no about_me / preferred_genres / privacy flags beyond display)
CREATE OR REPLACE FUNCTION public.get_public_profiles(p_user_ids uuid[])
RETURNS TABLE(
  id uuid,
  username text,
  display_name text,
  avatar_url text,
  avatar_position jsonb,
  hide_profile_details boolean,
  hide_published_works boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    CASE WHEN COALESCE(p.hide_profile_details,false) THEN NULL ELSE p.username END,
    CASE WHEN COALESCE(p.hide_profile_details,false) THEN NULL ELSE p.display_name END,
    CASE WHEN COALESCE(p.hide_profile_details,false) THEN NULL ELSE p.avatar_url END,
    CASE WHEN COALESCE(p.hide_profile_details,false) THEN NULL ELSE p.avatar_position END,
    COALESCE(p.hide_profile_details,false),
    COALESCE(p.hide_published_works,false)
  FROM public.profiles p
  WHERE p.id = ANY(p_user_ids);
$$;

REVOKE ALL ON FUNCTION public.get_public_profiles(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_profiles(uuid[]) TO authenticated, anon;

-- 3. Creator profile RPC enforcing both flags server-side
CREATE OR REPLACE FUNCTION public.get_public_creator_profile(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_is_owner boolean := (v_caller IS NOT NULL AND v_caller = p_user_id);
  v_is_admin boolean := (v_caller IS NOT NULL AND public.has_role(v_caller, 'admin'));
  v_profile public.profiles%ROWTYPE;
  v_works jsonb;
  v_result jsonb;
BEGIN
  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Privacy: hide_profile_details masks everything except id flag
  IF COALESCE(v_profile.hide_profile_details,false) AND NOT v_is_owner AND NOT v_is_admin THEN
    RETURN jsonb_build_object(
      'id', v_profile.id,
      'hide_profile_details', true,
      'hide_published_works', true
    );
  END IF;

  v_result := jsonb_build_object(
    'id', v_profile.id,
    'username', v_profile.username,
    'display_name', v_profile.display_name,
    'avatar_url', v_profile.avatar_url,
    'avatar_position', v_profile.avatar_position,
    'about_me', v_profile.about_me,
    'preferred_genres', COALESCE(to_jsonb(v_profile.preferred_genres), '[]'::jsonb),
    'hide_profile_details', COALESCE(v_profile.hide_profile_details,false),
    'hide_published_works', COALESCE(v_profile.hide_published_works,false)
  );

  -- Privacy: hide_published_works hides works list
  IF COALESCE(v_profile.hide_published_works,false) AND NOT v_is_owner AND NOT v_is_admin THEN
    v_result := v_result || jsonb_build_object('works', '[]'::jsonb);
  ELSE
    SELECT COALESCE(jsonb_agg(to_jsonb(w) ORDER BY w.created_at DESC), '[]'::jsonb)
    INTO v_works
    FROM (
      SELECT
        ps.id,
        ps.scenario_id,
        ps.like_count,
        ps.save_count,
        ps.play_count,
        ps.view_count,
        ps.allow_remix,
        ps.created_at,
        s.title AS scenario_title,
        s.description AS scenario_description,
        s.cover_image_url AS scenario_cover_image_url,
        s.cover_image_position AS scenario_cover_image_position,
        ct.story_type
      FROM public.published_scenarios ps
      JOIN public.stories s ON s.id = ps.scenario_id
      LEFT JOIN public.content_themes ct ON ct.scenario_id = ps.scenario_id
      WHERE ps.publisher_id = p_user_id
        AND (
          (ps.is_published = true AND ps.is_hidden = false)
          OR v_is_owner
          OR v_is_admin
        )
    ) w;
    v_result := v_result || jsonb_build_object('works', COALESCE(v_works,'[]'::jsonb));
  END IF;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_public_creator_profile(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_creator_profile(uuid) TO authenticated, anon;

-- 4. get_creator_stats: zero out public counters when hidden (follower_count stays public)
CREATE OR REPLACE FUNCTION public.get_creator_stats(creator_user_id uuid)
RETURNS TABLE(
  published_count bigint,
  total_likes bigint,
  total_saves bigint,
  total_views bigint,
  total_plays bigint,
  follower_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_is_owner boolean := (v_caller IS NOT NULL AND v_caller = creator_user_id);
  v_is_admin boolean := (v_caller IS NOT NULL AND public.has_role(v_caller, 'admin'));
  v_hide boolean;
  v_followers bigint;
BEGIN
  SELECT COALESCE(hide_published_works,false) INTO v_hide
  FROM public.profiles WHERE id = creator_user_id;

  SELECT COUNT(*)::bigint INTO v_followers
  FROM public.creator_follows WHERE creator_id = creator_user_id;

  IF v_hide AND NOT v_is_owner AND NOT v_is_admin THEN
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
$$;

-- 5. Tighten published_scenarios SELECT to honor hide_published_works
DROP POLICY IF EXISTS "Anyone can view published scenarios" ON public.published_scenarios;

CREATE POLICY "Anyone can view published scenarios"
ON public.published_scenarios
FOR SELECT
TO authenticated, anon
USING (
  (
    is_published = true
    AND is_hidden = false
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = published_scenarios.publisher_id
        AND COALESCE(p.hide_published_works,false) = false
    )
  )
  OR publisher_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
);

-- 6. fetch_gallery_scenarios: exclude hidden publishers (security definer bypasses RLS)
CREATE OR REPLACE FUNCTION public.fetch_gallery_scenarios(
  p_search_text text DEFAULT NULL::text,
  p_search_tags text[] DEFAULT NULL::text[],
  p_sort_by text DEFAULT 'recent'::text,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0,
  p_story_types text[] DEFAULT NULL::text[],
  p_genres text[] DEFAULT NULL::text[],
  p_origins text[] DEFAULT NULL::text[],
  p_trigger_warnings text[] DEFAULT NULL::text[],
  p_custom_tags text[] DEFAULT NULL::text[],
  p_publisher_ids uuid[] DEFAULT NULL::uuid[]
)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_is_admin boolean := (v_caller IS NOT NULL AND public.has_role(v_caller, 'admin'));
  v_result json;
BEGIN
  SELECT json_agg(row_data)
  INTO v_result
  FROM (
    SELECT json_build_object(
      'id', ps.id,
      'scenario_id', ps.scenario_id,
      'publisher_id', ps.publisher_id,
      'allow_remix', ps.allow_remix,
      'tags', ps.tags,
      'like_count', ps.like_count,
      'save_count', ps.save_count,
      'play_count', ps.play_count,
      'view_count', ps.view_count,
      'avg_rating', ps.avg_rating,
      'review_count', ps.review_count,
      'is_published', ps.is_published,
      'created_at', ps.created_at,
      'updated_at', ps.updated_at,
      'scenario', json_build_object(
        'id', s.id,
        'title', s.title,
        'description', s.description,
        'cover_image_url', s.cover_image_url,
        'cover_image_position', s.cover_image_position
      ),
      'publisher', json_build_object(
        'username', p.username,
        'avatar_url', p.avatar_url,
        'display_name', p.display_name
      ),
      'contentThemes', CASE WHEN ct.id IS NOT NULL THEN json_build_object(
        'characterTypes', COALESCE(ct.character_types, ARRAY[]::text[]),
        'storyType', ct.story_type,
        'genres', COALESCE(ct.genres, ARRAY[]::text[]),
        'origin', COALESCE(ct.origin, ARRAY[]::text[]),
        'triggerWarnings', COALESCE(ct.trigger_warnings, ARRAY[]::text[]),
        'customTags', COALESCE(ct.custom_tags, ARRAY[]::text[])
      ) ELSE NULL END
    ) AS row_data
    FROM published_scenarios ps
    JOIN stories s ON s.id = ps.scenario_id
    LEFT JOIN profiles p ON p.id = ps.publisher_id
    LEFT JOIN content_themes ct ON ct.scenario_id = ps.scenario_id
    WHERE ps.is_published = true
      AND ps.is_hidden = false
      AND (
        COALESCE(p.hide_published_works,false) = false
        OR ps.publisher_id = v_caller
        OR v_is_admin
      )
      AND (p_search_tags IS NULL OR ps.tags && p_search_tags)
      AND (p_publisher_ids IS NULL OR ps.publisher_id = ANY(p_publisher_ids))
      AND (p_story_types IS NULL OR ct.story_type = ANY(p_story_types))
      AND (p_genres IS NULL OR ct.genres && p_genres)
      AND (p_origins IS NULL OR ct.origin && p_origins)
      AND (p_trigger_warnings IS NULL OR ct.trigger_warnings && p_trigger_warnings)
      AND (p_custom_tags IS NULL OR ct.custom_tags && p_custom_tags)
      AND (
        p_search_text IS NULL
        OR p_search_text = ''
        OR to_tsvector('english', COALESCE(s.title, '') || ' ' || COALESCE(s.description, '')) @@ plainto_tsquery('english', p_search_text)
        OR s.title ILIKE '%' || p_search_text || '%'
        OR s.description ILIKE '%' || p_search_text || '%'
      )
    ORDER BY
      CASE WHEN p_sort_by = 'liked' THEN ps.like_count END DESC NULLS LAST,
      CASE WHEN p_sort_by = 'saved' THEN ps.save_count END DESC NULLS LAST,
      CASE WHEN p_sort_by = 'played' THEN ps.play_count END DESC NULLS LAST,
      CASE WHEN p_sort_by IN ('recent', 'all') THEN ps.created_at END DESC NULLS LAST,
      ps.created_at DESC
    LIMIT p_limit
    OFFSET p_offset
  ) sub;

  RETURN COALESCE(v_result, '[]'::json);
END;
$$;
