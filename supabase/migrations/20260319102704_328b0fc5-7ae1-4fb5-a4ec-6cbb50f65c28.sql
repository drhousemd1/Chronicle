
CREATE OR REPLACE FUNCTION public.save_scenario_atomic(
  p_scenario_id uuid,
  p_user_id uuid,
  p_story jsonb,
  p_characters jsonb DEFAULT '[]'::jsonb,
  p_codex_entries jsonb DEFAULT '[]'::jsonb,
  p_scenes jsonb DEFAULT '[]'::jsonb
)
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
BEGIN
  -- Verify ownership
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- 1. Upsert the story record
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
    updated_at = now();

  -- 2. Sync characters: delete removed, upsert current
  SELECT ARRAY(SELECT (elem->>'id')::uuid FROM jsonb_array_elements(p_characters) AS elem)
    INTO incoming_char_ids;

  DELETE FROM characters
    WHERE scenario_id = p_scenario_id
    AND id != ALL(incoming_char_ids);

  FOR char_record IN SELECT * FROM jsonb_array_elements(p_characters) LOOP
    INSERT INTO characters (
      id, user_id, scenario_id, name, nicknames, age, sex_type, sexual_orientation,
      location, current_mood, controlled_by, character_role, role_description,
      tags, avatar_url, avatar_position, physical_appearance, currently_wearing,
      preferred_clothing, personality, goals, background, tone, key_life_events,
      relationships, secrets, fears, sections, is_library
    ) VALUES (
      (char_record->>'id')::uuid,
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
      updated_at = now();
  END LOOP;

  -- 3. Sync codex entries: delete removed, upsert current
  SELECT ARRAY(SELECT (elem->>'id')::uuid FROM jsonb_array_elements(p_codex_entries) AS elem)
    INTO incoming_codex_ids;

  DELETE FROM codex_entries
    WHERE scenario_id = p_scenario_id
    AND id != ALL(incoming_codex_ids);

  FOR codex_record IN SELECT * FROM jsonb_array_elements(p_codex_entries) LOOP
    INSERT INTO codex_entries (id, scenario_id, title, body)
    VALUES (
      (codex_record->>'id')::uuid,
      p_scenario_id,
      COALESCE(codex_record->>'title', ''),
      COALESCE(codex_record->>'body', '')
    )
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      body = EXCLUDED.body,
      updated_at = now();
  END LOOP;

  -- 4. Sync scenes: delete removed, upsert current
  SELECT ARRAY(SELECT (elem->>'id')::uuid FROM jsonb_array_elements(p_scenes) AS elem)
    INTO incoming_scene_ids;

  DELETE FROM scenes
    WHERE scenario_id = p_scenario_id
    AND id != ALL(incoming_scene_ids);

  FOR scene_record IN SELECT * FROM jsonb_array_elements(p_scenes) LOOP
    INSERT INTO scenes (id, scenario_id, image_url, tags, is_starting_scene)
    VALUES (
      (scene_record->>'id')::uuid,
      p_scenario_id,
      scene_record->>'image_url',
      COALESCE(ARRAY(SELECT jsonb_array_elements_text(scene_record->'tags')), '{}'::text[]),
      COALESCE((scene_record->>'is_starting_scene')::boolean, false)
    )
    ON CONFLICT (id) DO UPDATE SET
      image_url = EXCLUDED.image_url,
      tags = EXCLUDED.tags,
      is_starting_scene = EXCLUDED.is_starting_scene;
  END LOOP;
END;
$function$;
