
-- Stage B Migration A: schema + helpers (buckets remain public until Migration B + bucket flip)

ALTER TABLE public.scenes ADD COLUMN IF NOT EXISTS image_path text NULL;
ALTER TABLE public.library_images ADD COLUMN IF NOT EXISTS image_path text NULL;

CREATE INDEX IF NOT EXISTS idx_scenes_image_path ON public.scenes(image_path) WHERE image_path IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_library_images_image_path ON public.library_images(image_path) WHERE image_path IS NOT NULL;

-- Backfill image_path from existing public URLs.
UPDATE public.scenes
SET image_path = substring(image_url FROM '/object/public/scenes/(.+)$')
WHERE image_path IS NULL
  AND image_url ~ '/object/public/scenes/';

UPDATE public.library_images
SET image_path = substring(image_url FROM '/object/public/image_library/(.+)$')
WHERE image_path IS NULL
  AND image_url ~ '/object/public/image_library/';

-- Record rows that could not be backfilled (no row data, just counts and a sample of ids).
DO $$
DECLARE
  v_scene_unmig bigint;
  v_lib_unmig bigint;
  v_scene_ids jsonb;
  v_lib_ids jsonb;
BEGIN
  SELECT COUNT(*), COALESCE(jsonb_agg(id) FILTER (WHERE rn <= 25), '[]'::jsonb)
  INTO v_scene_unmig, v_scene_ids
  FROM (
    SELECT id, row_number() OVER (ORDER BY created_at NULLS LAST) AS rn
    FROM public.scenes
    WHERE image_path IS NULL
      AND image_url IS NOT NULL
      AND image_url <> ''
      AND image_url NOT LIKE 'storage://%'
  ) s;

  SELECT COUNT(*), COALESCE(jsonb_agg(id) FILTER (WHERE rn <= 25), '[]'::jsonb)
  INTO v_lib_unmig, v_lib_ids
  FROM (
    SELECT id, row_number() OVER (ORDER BY created_at NULLS LAST) AS rn
    FROM public.library_images
    WHERE image_path IS NULL
      AND image_url IS NOT NULL
      AND image_url <> ''
      AND image_url NOT LIKE 'storage://%'
  ) l;

  INSERT INTO public.app_settings (setting_key, setting_value, updated_by, updated_at)
  VALUES (
    'qh_sec_20260607_003_unmigrated',
    jsonb_build_object(
      'recorded_at', now(),
      'scenes_unmigrated_count', v_scene_unmig,
      'scenes_sample_ids', v_scene_ids,
      'library_images_unmigrated_count', v_lib_unmig,
      'library_images_sample_ids', v_lib_ids,
      'note', 'Rows whose image_url did not match /object/public/<bucket>/ and could not be backfilled to image_path.'
    ),
    NULL,
    now()
  )
  ON CONFLICT (setting_key) DO UPDATE
  SET setting_value = EXCLUDED.setting_value,
      updated_at = EXCLUDED.updated_at;
END;
$$;

-- Update get_folders_with_details to return thumbnail_path alongside legacy thumbnail_url.
DROP FUNCTION IF EXISTS public.get_folders_with_details();
DROP FUNCTION IF EXISTS public.get_folders_with_details(uuid);

CREATE OR REPLACE FUNCTION public.get_folders_with_details()
 RETURNS TABLE(id uuid, user_id uuid, name text, description text, thumbnail_image_id uuid, thumbnail_url text, thumbnail_path text, image_count bigint, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    f.id,
    f.user_id,
    f.name,
    f.description,
    f.thumbnail_image_id,
    COALESCE(thumb.image_url, first_img.image_url) AS thumbnail_url,
    COALESCE(thumb.image_path, first_img.image_path) AS thumbnail_path,
    COALESCE(cnt.c, 0) AS image_count,
    f.created_at,
    f.updated_at
  FROM image_folders f
  LEFT JOIN library_images thumb
    ON thumb.id = f.thumbnail_image_id
  LEFT JOIN LATERAL (
    SELECT li.image_url, li.image_path
    FROM library_images li
    WHERE li.folder_id = f.id
    ORDER BY li.created_at ASC
    LIMIT 1
  ) first_img ON f.thumbnail_image_id IS NULL
  LEFT JOIN LATERAL (
    SELECT count(*) AS c
    FROM library_images li
    WHERE li.folder_id = f.id
  ) cnt ON true
  WHERE f.user_id = auth.uid()
  ORDER BY f.updated_at DESC;
$function$;

REVOKE EXECUTE ON FUNCTION public.get_folders_with_details() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_folders_with_details() TO authenticated;

-- can_read_scene_storage_object: storage RLS gate for the scenes bucket once it goes private.
CREATE OR REPLACE FUNCTION public.can_read_scene_storage_object(p_path text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_caller uuid := auth.uid();
  v_owner_segment text;
BEGIN
  IF p_path IS NULL OR p_path = '' THEN
    RETURN false;
  END IF;

  v_owner_segment := split_part(p_path, '/', 1);

  -- Owner branch
  IF v_caller IS NOT NULL AND v_owner_segment = v_caller::text THEN
    RETURN true;
  END IF;

  -- Admin branch
  IF v_caller IS NOT NULL AND public.has_role(v_caller, 'admin') THEN
    RETURN true;
  END IF;

  -- Public published-scenario branch (anon-safe)
  RETURN EXISTS (
    SELECT 1
    FROM public.scenes s
    JOIN public.published_scenarios ps ON ps.scenario_id = s.scenario_id
    JOIN public.profiles p ON p.id = ps.publisher_id
    WHERE s.image_path = p_path
      AND ps.is_published = true
      AND ps.is_hidden = false
      AND COALESCE(p.hide_published_works, false) = false
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.can_read_scene_storage_object(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_read_scene_storage_object(text) TO anon, authenticated;

-- save_scenario_atomic: preserve image_path for scenes.
CREATE OR REPLACE FUNCTION public.save_scenario_atomic(p_scenario_id uuid, p_user_id uuid, p_story jsonb, p_characters jsonb DEFAULT '[]'::jsonb, p_codex_entries jsonb DEFAULT '[]'::jsonb, p_scenes jsonb DEFAULT '[]'::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  char_record jsonb;
  codex_record jsonb;
  scene_record jsonb;
  incoming_char_ids uuid[];
  incoming_codex_ids uuid[];
  incoming_scene_ids uuid[];
  v_story_existed boolean := false;
  v_rows integer;
  v_id uuid;
BEGIN
  -- Auth gate
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Pre-flight: reject if scenario exists and belongs to another user
  PERFORM 1 FROM public.stories
    WHERE id = p_scenario_id AND user_id <> p_user_id;
  IF FOUND THEN
    RAISE EXCEPTION 'Unauthorized: scenario owned by another user';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.stories WHERE id = p_scenario_id AND user_id = p_user_id
  ) INTO v_story_existed;

  INSERT INTO stories (
    id, user_id, title, description, cover_image_url, cover_image_position,
    tags, world_core, ui_settings, opening_dialog, selected_model,
    selected_art_style, version, is_draft, nav_button_images
  ) VALUES (
    p_scenario_id,
    p_user_id,
    COALESCE(p_story->>'title', 'Untitled Story'),
    COALESCE(p_story->>'description', ''),
    COALESCE(p_story->>'cover_image_url', ''),
    COALESCE((p_story->'cover_image_position')::jsonb, '{"x":50,"y":50}'::jsonb),
    COALESCE(ARRAY(SELECT jsonb_array_elements_text(p_story->'tags')), '{}'::text[]),
    COALESCE((p_story->'world_core')::jsonb, '{}'::jsonb),
    COALESCE((p_story->'ui_settings')::jsonb, '{"darkMode":false,"showBackgrounds":true,"transparentBubbles":false}'::jsonb),
    COALESCE((p_story->'opening_dialog')::jsonb, '{"text":"","enabled":true}'::jsonb),
    p_story->>'selected_model',
    COALESCE(p_story->>'selected_art_style', 'cinematic-2-5d'),
    COALESCE((p_story->>'version')::int, 3),
    COALESCE((p_story->>'is_draft')::boolean, false),
    COALESCE((p_story->'nav_button_images')::jsonb, '{}'::jsonb)
  )
  ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    cover_image_url = EXCLUDED.cover_image_url,
    cover_image_position = EXCLUDED.cover_image_position,
    tags = EXCLUDED.tags,
    world_core = EXCLUDED.world_core,
    ui_settings = EXCLUDED.ui_settings,
    opening_dialog = EXCLUDED.opening_dialog,
    selected_model = EXCLUDED.selected_model,
    selected_art_style = EXCLUDED.selected_art_style,
    version = EXCLUDED.version,
    is_draft = EXCLUDED.is_draft,
    nav_button_images = EXCLUDED.nav_button_images,
    updated_at = now()
  WHERE public.stories.user_id = p_user_id;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_story_existed AND v_rows = 0 THEN
    RAISE EXCEPTION 'Unauthorized: story ownership guard blocked update for scenario %', p_scenario_id;
  END IF;

  SELECT ARRAY(SELECT (elem->>'id')::uuid FROM jsonb_array_elements(p_characters) AS elem)
    INTO incoming_char_ids;

  DELETE FROM characters
    WHERE scenario_id = p_scenario_id
    AND id != ALL(incoming_char_ids);

  FOR char_record IN SELECT * FROM jsonb_array_elements(p_characters) LOOP
    v_id := (char_record->>'id')::uuid;
    INSERT INTO characters (
      id, user_id, scenario_id, name, nicknames, age, sex_type, sexual_orientation,
      location, current_mood, controlled_by, character_role, role_description,
      tags, avatar_url, avatar_position, physical_appearance, currently_wearing,
      preferred_clothing, personality, goals, background, tone, key_life_events,
      relationships, secrets, fears, sections, is_library
    ) VALUES (
      v_id,
      p_user_id,
      p_scenario_id,
      COALESCE(char_record->>'name', ''),
      COALESCE(char_record->>'nicknames', ''),
      COALESCE(char_record->>'age', ''),
      char_record->>'sex_type',
      COALESCE(char_record->>'sexual_orientation', ''),
      COALESCE(char_record->>'location', ''),
      COALESCE(char_record->>'current_mood', ''),
      char_record->>'controlled_by',
      char_record->>'character_role',
      COALESCE(char_record->>'role_description', ''),
      char_record->>'tags',
      char_record->>'avatar_url',
      COALESCE((char_record->'avatar_position')::jsonb, '{"x":50,"y":50}'::jsonb),
      COALESCE((char_record->'physical_appearance')::jsonb, '{}'::jsonb),
      COALESCE((char_record->'currently_wearing')::jsonb, '{}'::jsonb),
      COALESCE((char_record->'preferred_clothing')::jsonb, '{}'::jsonb),
      (char_record->'personality')::jsonb,
      COALESCE((char_record->'goals')::jsonb, '[]'::jsonb),
      COALESCE((char_record->'background')::jsonb, '{}'::jsonb),
      COALESCE((char_record->'tone')::jsonb, '{}'::jsonb),
      COALESCE((char_record->'key_life_events')::jsonb, '{}'::jsonb),
      COALESCE((char_record->'relationships')::jsonb, '{}'::jsonb),
      COALESCE((char_record->'secrets')::jsonb, '{}'::jsonb),
      COALESCE((char_record->'fears')::jsonb, '{}'::jsonb),
      COALESCE((char_record->'sections')::jsonb, '[]'::jsonb),
      COALESCE((char_record->>'is_library')::boolean, false)
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      nicknames = EXCLUDED.nicknames,
      age = EXCLUDED.age,
      sex_type = EXCLUDED.sex_type,
      sexual_orientation = EXCLUDED.sexual_orientation,
      location = EXCLUDED.location,
      current_mood = EXCLUDED.current_mood,
      controlled_by = EXCLUDED.controlled_by,
      character_role = EXCLUDED.character_role,
      role_description = EXCLUDED.role_description,
      tags = EXCLUDED.tags,
      avatar_url = EXCLUDED.avatar_url,
      avatar_position = EXCLUDED.avatar_position,
      physical_appearance = EXCLUDED.physical_appearance,
      currently_wearing = EXCLUDED.currently_wearing,
      preferred_clothing = EXCLUDED.preferred_clothing,
      personality = EXCLUDED.personality,
      goals = EXCLUDED.goals,
      background = EXCLUDED.background,
      tone = EXCLUDED.tone,
      key_life_events = EXCLUDED.key_life_events,
      relationships = EXCLUDED.relationships,
      secrets = EXCLUDED.secrets,
      fears = EXCLUDED.fears,
      sections = EXCLUDED.sections,
      is_library = EXCLUDED.is_library,
      updated_at = now()
    WHERE public.characters.user_id = p_user_id
      AND public.characters.scenario_id = p_scenario_id;

    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows = 0 THEN
      RAISE EXCEPTION 'Unauthorized: characters row % blocked by ownership guard', v_id;
    END IF;
  END LOOP;

  SELECT ARRAY(SELECT (elem->>'id')::uuid FROM jsonb_array_elements(p_codex_entries) AS elem)
    INTO incoming_codex_ids;

  DELETE FROM codex_entries
    WHERE scenario_id = p_scenario_id
    AND id != ALL(incoming_codex_ids);

  FOR codex_record IN SELECT * FROM jsonb_array_elements(p_codex_entries) LOOP
    v_id := (codex_record->>'id')::uuid;
    INSERT INTO codex_entries (id, scenario_id, title, body)
    VALUES (
      v_id,
      p_scenario_id,
      COALESCE(codex_record->>'title', ''),
      COALESCE(codex_record->>'body', '')
    )
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      body = EXCLUDED.body,
      updated_at = now()
    WHERE public.codex_entries.scenario_id = p_scenario_id;

    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows = 0 THEN
      RAISE EXCEPTION 'Unauthorized: codex_entries row % blocked by ownership guard', v_id;
    END IF;
  END LOOP;

  SELECT ARRAY(SELECT (elem->>'id')::uuid FROM jsonb_array_elements(p_scenes) AS elem)
    INTO incoming_scene_ids;

  DELETE FROM scenes
    WHERE scenario_id = p_scenario_id
    AND id != ALL(incoming_scene_ids);

  FOR scene_record IN SELECT * FROM jsonb_array_elements(p_scenes) LOOP
    v_id := (scene_record->>'id')::uuid;
    INSERT INTO scenes (id, scenario_id, image_url, image_path, tags, is_starting_scene)
    VALUES (
      v_id,
      p_scenario_id,
      COALESCE(scene_record->>'image_url', ''),
      NULLIF(scene_record->>'image_path', ''),
      COALESCE(ARRAY(SELECT jsonb_array_elements_text(scene_record->'tags')), '{}'::text[]),
      COALESCE((scene_record->>'is_starting_scene')::boolean, false)
    )
    ON CONFLICT (id) DO UPDATE SET
      image_url = EXCLUDED.image_url,
      image_path = EXCLUDED.image_path,
      tags = EXCLUDED.tags,
      is_starting_scene = EXCLUDED.is_starting_scene
    WHERE public.scenes.scenario_id = p_scenario_id;

    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows = 0 THEN
      RAISE EXCEPTION 'Unauthorized: scenes row % blocked by ownership guard', v_id;
    END IF;
  END LOOP;
END;
$function$;
