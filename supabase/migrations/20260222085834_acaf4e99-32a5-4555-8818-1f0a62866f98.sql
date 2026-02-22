
-- 1. scenario_views table for view count deduplication
CREATE TABLE public.scenario_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  published_scenario_id uuid NOT NULL REFERENCES public.published_scenarios(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  viewed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_scenario_views_dedup 
  ON public.scenario_views (published_scenario_id, user_id, viewed_at DESC);

ALTER TABLE public.scenario_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own views"
  ON public.scenario_views FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own views"
  ON public.scenario_views FOR SELECT
  USING (user_id = auth.uid());

-- 2. record_scenario_view RPC (24-hour dedup)
CREATE OR REPLACE FUNCTION public.record_scenario_view(p_published_scenario_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Check if user viewed this in the last 24 hours
  IF EXISTS (
    SELECT 1 FROM scenario_views
    WHERE published_scenario_id = p_published_scenario_id
      AND user_id = v_user_id
      AND viewed_at > now() - interval '24 hours'
  ) THEN
    RETURN; -- Already viewed recently, do nothing
  END IF;

  -- Insert new view record
  INSERT INTO scenario_views (published_scenario_id, user_id)
  VALUES (p_published_scenario_id, v_user_id);

  -- Increment the count
  UPDATE published_scenarios
  SET view_count = view_count + 1, updated_at = now()
  WHERE id = p_published_scenario_id;
END;
$$;

-- 3. fetch_gallery_scenarios RPC for server-side filtering, search, pagination
CREATE OR REPLACE FUNCTION public.fetch_gallery_scenarios(
  p_search_text text DEFAULT NULL,
  p_search_tags text[] DEFAULT NULL,
  p_sort_by text DEFAULT 'recent',
  p_limit int DEFAULT 20,
  p_offset int DEFAULT 0,
  p_story_types text[] DEFAULT NULL,
  p_genres text[] DEFAULT NULL,
  p_origins text[] DEFAULT NULL,
  p_trigger_warnings text[] DEFAULT NULL,
  p_custom_tags text[] DEFAULT NULL,
  p_publisher_ids uuid[] DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
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
    JOIN scenarios s ON s.id = ps.scenario_id
    LEFT JOIN profiles p ON p.id = ps.publisher_id
    LEFT JOIN content_themes ct ON ct.scenario_id = ps.scenario_id
    WHERE ps.is_published = true
      AND ps.is_hidden = false
      -- Tag filter
      AND (p_search_tags IS NULL OR ps.tags && p_search_tags)
      -- Publisher filter (for Following tab)
      AND (p_publisher_ids IS NULL OR ps.publisher_id = ANY(p_publisher_ids))
      -- Content theme filters
      AND (p_story_types IS NULL OR ct.story_type = ANY(p_story_types))
      AND (p_genres IS NULL OR ct.genres && p_genres)
      AND (p_origins IS NULL OR ct.origin && p_origins)
      AND (p_trigger_warnings IS NULL OR ct.trigger_warnings && p_trigger_warnings)
      AND (p_custom_tags IS NULL OR ct.custom_tags && p_custom_tags)
      -- Full-text search on title and description
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

-- 4. Full-text search GIN index
CREATE INDEX idx_scenarios_fulltext_search 
  ON public.scenarios USING GIN (
    to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(description, ''))
  );

-- 5. Enable Realtime for published_scenarios
ALTER PUBLICATION supabase_realtime ADD TABLE public.published_scenarios;
