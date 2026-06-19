
-- BF-02: art_styles backend prompt exposure
DROP POLICY IF EXISTS "Anyone can read art styles" ON public.art_styles;
CREATE POLICY "Admins can read art styles" ON public.art_styles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

REVOKE SELECT ON public.art_styles FROM anon;

CREATE OR REPLACE FUNCTION public.get_public_art_styles()
RETURNS TABLE(id text, display_name text, thumbnail_url text, sort_order integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, display_name, thumbnail_url, sort_order
  FROM public.art_styles
  ORDER BY sort_order ASC NULLS LAST, display_name ASC;
$$;
REVOKE ALL ON FUNCTION public.get_public_art_styles() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_art_styles() TO anon, authenticated, service_role;

-- BF-03: app_settings key-scoped exposure
DROP POLICY IF EXISTS "Anyone authenticated can read settings" ON public.app_settings;

CREATE POLICY "Admins can read all settings" ON public.app_settings
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Auth can read public settings keys" ON public.app_settings
  FOR SELECT TO authenticated
  USING (setting_key IN ('shared_keys', 'nav_button_images', 'subscription_tiers_v1'));

CREATE OR REPLACE FUNCTION public.get_public_app_flags()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_result jsonb;
BEGIN
  SELECT jsonb_object_agg(setting_key, setting_value)
    INTO v_result
  FROM public.app_settings
  WHERE setting_key IN ('shared_keys', 'nav_button_images');
  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$;
REVOKE ALL ON FUNCTION public.get_public_app_flags() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_app_flags() TO anon, authenticated, service_role;

-- BF-07: child tables honor publisher hide_published_works
DROP POLICY IF EXISTS "Users can view own or published stories" ON public.stories;
CREATE POLICY "Users can view own or visible published stories" ON public.stories
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.published_scenarios ps
      JOIN public.profiles p ON p.id = ps.publisher_id
      WHERE ps.scenario_id = stories.id
        AND ps.is_published = true
        AND ps.is_hidden = false
        AND COALESCE(p.hide_published_works, false) = false
    )
  );

DROP POLICY IF EXISTS "Users can view own or published characters" ON public.characters;
CREATE POLICY "Users can view own or visible published characters" ON public.characters
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.published_scenarios ps
      JOIN public.profiles p ON p.id = ps.publisher_id
      WHERE ps.scenario_id = characters.scenario_id
        AND ps.is_published = true
        AND ps.is_hidden = false
        AND COALESCE(p.hide_published_works, false) = false
    )
  );

DROP POLICY IF EXISTS "Users can view codex via own or published story" ON public.codex_entries;
CREATE POLICY "Users can view codex via own or visible published story" ON public.codex_entries
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.stories s
      WHERE s.id = codex_entries.scenario_id AND s.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.published_scenarios ps
      JOIN public.profiles p ON p.id = ps.publisher_id
      WHERE ps.scenario_id = codex_entries.scenario_id
        AND ps.is_published = true
        AND ps.is_hidden = false
        AND COALESCE(p.hide_published_works, false) = false
    )
  );

DROP POLICY IF EXISTS "Anyone can view published story themes" ON public.content_themes;
CREATE POLICY "Anyone can view visible published story themes" ON public.content_themes
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.stories s
      WHERE s.id = content_themes.scenario_id AND s.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.published_scenarios ps
      JOIN public.profiles p ON p.id = ps.publisher_id
      WHERE ps.scenario_id = content_themes.scenario_id
        AND ps.is_published = true
        AND ps.is_hidden = false
        AND COALESCE(p.hide_published_works, false) = false
    )
  );

DROP POLICY IF EXISTS "Users can view scenes via own or published story" ON public.scenes;
CREATE POLICY "Users can view scenes via own or visible published story" ON public.scenes
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.stories s
      WHERE s.id = scenes.scenario_id AND s.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.published_scenarios ps
      JOIN public.profiles p ON p.id = ps.publisher_id
      WHERE ps.scenario_id = scenes.scenario_id
        AND ps.is_published = true
        AND ps.is_hidden = false
        AND COALESCE(p.hide_published_works, false) = false
    )
  );

-- BF-09: scenario_likes social graph
DROP POLICY IF EXISTS "Anyone can view likes" ON public.scenario_likes;
CREATE POLICY "Users can view own likes" ON public.scenario_likes
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.get_my_liked_scenarios(p_published_scenario_ids uuid[])
RETURNS TABLE(published_scenario_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sl.published_scenario_id
  FROM public.scenario_likes sl
  WHERE sl.user_id = auth.uid()
    AND sl.published_scenario_id = ANY(COALESCE(p_published_scenario_ids, ARRAY[]::uuid[]));
$$;
REVOKE ALL ON FUNCTION public.get_my_liked_scenarios(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_liked_scenarios(uuid[]) TO authenticated, service_role;

-- BF-12: tighten record_scenario_view + record_scenario_play visibility
CREATE OR REPLACE FUNCTION public.record_scenario_view(p_published_scenario_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.published_scenarios ps
    JOIN public.profiles p ON p.id = ps.publisher_id
    WHERE ps.id = p_published_scenario_id
      AND ps.is_published = true
      AND ps.is_hidden = false
      AND COALESCE(p.hide_published_works, false) = false
  ) THEN
    RAISE EXCEPTION 'Scenario not available';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.scenario_views
    WHERE published_scenario_id = p_published_scenario_id
      AND user_id = v_user_id
      AND viewed_at > now() - interval '24 hours'
  ) THEN
    RETURN;
  END IF;

  INSERT INTO public.scenario_views (published_scenario_id, user_id)
  VALUES (p_published_scenario_id, v_user_id);

  UPDATE public.published_scenarios
  SET view_count = view_count + 1, updated_at = now()
  WHERE id = p_published_scenario_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_scenario_play(p_published_scenario_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.published_scenarios ps
    JOIN public.profiles p ON p.id = ps.publisher_id
    WHERE ps.id = p_published_scenario_id
      AND ps.is_published = true
      AND ps.is_hidden = false
      AND COALESCE(p.hide_published_works, false) = false
  ) THEN
    RAISE EXCEPTION 'Scenario not available';
  END IF;

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

-- BF-14: guide_images storage: admin-only writes, public reads preserved
DROP POLICY IF EXISTS "Authenticated users can upload guide images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete own guide images" ON storage.objects;

CREATE POLICY "Admins can upload guide images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'guide_images' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update guide images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'guide_images' AND public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (bucket_id = 'guide_images' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete guide images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'guide_images' AND public.has_role(auth.uid(), 'admin'::app_role));
