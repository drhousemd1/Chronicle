
-- Phase 1: Rename scenarios table to stories
-- This is a terminology-only migration. No logic changes.

-- 1. Rename the table
ALTER TABLE scenarios RENAME TO stories;

-- 2. Update the default value for title
ALTER TABLE stories ALTER COLUMN title SET DEFAULT 'Untitled Story';

-- 3. Drop and recreate ALL RLS policies on stories (previously scenarios)
-- DROP existing policies
DROP POLICY IF EXISTS "Users can create own scenarios" ON stories;
DROP POLICY IF EXISTS "Users can delete own scenarios" ON stories;
DROP POLICY IF EXISTS "Users can update own scenarios" ON stories;
DROP POLICY IF EXISTS "Users can view own or published scenarios" ON stories;

-- Recreate with updated names
CREATE POLICY "Users can create own stories" ON stories FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own stories" ON stories FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own stories" ON stories FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view own or published stories" ON stories FOR SELECT TO authenticated USING (
  (auth.uid() = user_id) OR (EXISTS (
    SELECT 1 FROM published_scenarios ps
    WHERE ps.scenario_id = stories.id AND ps.is_published = true AND ps.is_hidden = false
  ))
);

-- 4. Update RLS policies on content_themes (references scenarios table)
DROP POLICY IF EXISTS "Users can CRUD own scenario themes" ON content_themes;
CREATE POLICY "Users can CRUD own story themes" ON content_themes FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM stories s WHERE s.id = content_themes.scenario_id AND s.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM stories s WHERE s.id = content_themes.scenario_id AND s.user_id = auth.uid()));

DROP POLICY IF EXISTS "Anyone can view published scenario themes" ON content_themes;
CREATE POLICY "Anyone can view published story themes" ON content_themes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM published_scenarios ps WHERE ps.scenario_id = content_themes.scenario_id AND ps.is_published = true AND ps.is_hidden = false));

-- 5. Update RLS policies on codex_entries (references scenarios)
DROP POLICY IF EXISTS "Users can create codex via scenario" ON codex_entries;
DROP POLICY IF EXISTS "Users can delete codex via scenario" ON codex_entries;
DROP POLICY IF EXISTS "Users can update codex via scenario" ON codex_entries;
DROP POLICY IF EXISTS "Users can view codex via own or published scenario" ON codex_entries;

CREATE POLICY "Users can create codex via story" ON codex_entries FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM stories WHERE stories.id = codex_entries.scenario_id AND stories.user_id = auth.uid()));
CREATE POLICY "Users can delete codex via story" ON codex_entries FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM stories WHERE stories.id = codex_entries.scenario_id AND stories.user_id = auth.uid()));
CREATE POLICY "Users can update codex via story" ON codex_entries FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM stories WHERE stories.id = codex_entries.scenario_id AND stories.user_id = auth.uid()));
CREATE POLICY "Users can view codex via own or published story" ON codex_entries FOR SELECT TO authenticated
  USING (
    (EXISTS (SELECT 1 FROM stories s WHERE s.id = codex_entries.scenario_id AND s.user_id = auth.uid()))
    OR (EXISTS (SELECT 1 FROM published_scenarios ps WHERE ps.scenario_id = codex_entries.scenario_id AND ps.is_published = true AND ps.is_hidden = false))
  );

-- 6. Update RLS policies on scenes (references scenarios)
DROP POLICY IF EXISTS "Users can create scenes via scenario" ON scenes;
DROP POLICY IF EXISTS "Users can delete scenes via scenario" ON scenes;
DROP POLICY IF EXISTS "Users can update scenes via scenario" ON scenes;
DROP POLICY IF EXISTS "Users can view scenes via own or published scenario" ON scenes;

CREATE POLICY "Users can create scenes via story" ON scenes FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM stories WHERE stories.id = scenes.scenario_id AND stories.user_id = auth.uid()));
CREATE POLICY "Users can delete scenes via story" ON scenes FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM stories WHERE stories.id = scenes.scenario_id AND stories.user_id = auth.uid()));
CREATE POLICY "Users can update scenes via story" ON scenes FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM stories WHERE stories.id = scenes.scenario_id AND stories.user_id = auth.uid()));
CREATE POLICY "Users can view scenes via own or published story" ON scenes FOR SELECT TO authenticated
  USING (
    (EXISTS (SELECT 1 FROM stories s WHERE s.id = scenes.scenario_id AND s.user_id = auth.uid()))
    OR (EXISTS (SELECT 1 FROM published_scenarios ps WHERE ps.scenario_id = scenes.scenario_id AND ps.is_published = true AND ps.is_hidden = false))
  );

-- 7. Update RLS policies on characters (references scenarios)
DROP POLICY IF EXISTS "Users can view own or published characters" ON characters;
CREATE POLICY "Users can view own or published characters" ON characters FOR SELECT TO authenticated
  USING (
    (auth.uid() = user_id) OR (EXISTS (
      SELECT 1 FROM published_scenarios ps
      WHERE ps.scenario_id = characters.scenario_id AND ps.is_published = true AND ps.is_hidden = false
    ))
  );

-- 8. Update fetch_gallery_scenarios function (JOIN scenarios → JOIN stories)
CREATE OR REPLACE FUNCTION public.fetch_gallery_scenarios(
  p_search_text text DEFAULT NULL,
  p_search_tags text[] DEFAULT NULL,
  p_sort_by text DEFAULT 'recent',
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0,
  p_story_types text[] DEFAULT NULL,
  p_genres text[] DEFAULT NULL,
  p_origins text[] DEFAULT NULL,
  p_trigger_warnings text[] DEFAULT NULL,
  p_custom_tags text[] DEFAULT NULL,
  p_publisher_ids uuid[] DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
    JOIN stories s ON s.id = ps.scenario_id
    LEFT JOIN profiles p ON p.id = ps.publisher_id
    LEFT JOIN content_themes ct ON ct.scenario_id = ps.scenario_id
    WHERE ps.is_published = true
      AND ps.is_hidden = false
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
$function$;
