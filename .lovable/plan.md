# Issue #16 — Terminal `current_mood` Removal (Revised Plan)

## 1. Live-object scan (unchanged, confirmed)

- Columns (all `text NULL DEFAULT ''::text`, no indexes / CHECKs / FKs):
  - `public.characters.current_mood`
  - `public.side_characters.current_mood`
  - `public.character_session_states.current_mood`
- Functions referencing `current_mood` (via `pg_proc.prosrc`): only `public.save_scenario_atomic(uuid, uuid, jsonb, jsonb, jsonb, jsonb)`.
- Views: none. Triggers: none. Policies: none. Indexes / constraints / generated cols: none.

## 2. Execution gate (blocking)

Do NOT approve or apply this migration until the application-side removal of `current_mood` reads/writes is **deployed** (not just passing local checks). Current repo still references `current_mood` in:

- `src/services/persistence/characters.ts`
- `src/services/persistence/side-characters.ts`
- `src/services/persistence/conversations.ts`
- `src/data/api-inspector-prompt-documents.ts`
- `supabase/functions/extract-character-updates/index.ts`
- Snapshot artifacts: `src/integrations/supabase/types.ts`, `src/data/supabase-schema-map.ts`, `src/data/database-schema-inventory.ts`, `src/data/supabase-schema-reference.ts`

Frontend + edge function commits removing all live reads/writes of `current_mood` must be pushed and deployed first. Only then does Thomas approve the SQL below.

## 3. Exact terminal migration SQL (approval-ready)

```sql
-- Issue #16 terminal: remove structured mood.
-- Preserves save_scenario_atomic behavior verbatim except for three deletions:
--   1) `current_mood` removed from characters INSERT column list
--   2) `COALESCE(char_record->>'current_mood', '')` removed from VALUES list
--   3) `current_mood = EXCLUDED.current_mood,` removed from ON CONFLICT DO UPDATE SET
-- All ownership guards, row-count guards, delete-orphans logic, story/codex/scenes
-- handling, SECURITY DEFINER, and search_path are unchanged.
BEGIN;

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
  v_story_existed boolean := false;
  v_rows integer;
  v_id uuid;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  PERFORM 1 FROM public.stories
    WHERE id = p_scenario_id AND user_id <> p_user_id;
  IF FOUND THEN
    RAISE EXCEPTION 'Unauthorized: scenario owned by another user';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.stories WHERE id = p_scenario_id AND user_id = p_user_id
  ) INTO v_story_existed;

  INSERT INTO stories (
    id, user_id, title, description, cover_image_url, cover_image_path, cover_image_position,
    tags, world_core, ui_settings, opening_dialog, selected_model,
    selected_art_style, version, is_draft, nav_button_images
  ) VALUES (
    p_scenario_id,
    p_user_id,
    COALESCE(p_story->>'title', 'Untitled Story'),
    COALESCE(p_story->>'description', ''),
    COALESCE(p_story->>'cover_image_url', ''),
    NULLIF(p_story->>'cover_image_path', ''),
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
    cover_image_path = EXCLUDED.cover_image_path,
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
      location, controlled_by, character_role, role_description,
      tags, avatar_url, avatar_path, avatar_position, physical_appearance, currently_wearing,
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
      char_record->>'controlled_by',
      char_record->>'character_role',
      COALESCE(char_record->>'role_description', ''),
      char_record->>'tags',
      char_record->>'avatar_url',
      NULLIF(char_record->>'avatar_path', ''),
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
      controlled_by = EXCLUDED.controlled_by,
      character_role = EXCLUDED.character_role,
      role_description = EXCLUDED.role_description,
      tags = EXCLUDED.tags,
      avatar_url = EXCLUDED.avatar_url,
      avatar_path = EXCLUDED.avatar_path,
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

ALTER TABLE public.characters               DROP COLUMN current_mood;
ALTER TABLE public.side_characters          DROP COLUMN current_mood;
ALTER TABLE public.character_session_states DROP COLUMN current_mood;

COMMIT;
```

CASCADE is intentionally omitted from the DROP COLUMNs — the pre-scan showed no dependent objects. If any unexpected dependency exists at execution time, the migration aborts cleanly.

## 4. Exact verification queries (post-execution)

```sql
-- (a) No current_mood columns remain anywhere.
SELECT table_schema || '.' || table_name || '.' || column_name AS ref
FROM information_schema.columns
WHERE column_name = 'current_mood';
-- Expect: 0 rows.

-- (b) No function body in public references current_mood.
SELECT n.nspname || '.' || p.proname AS fn
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.prosrc ILIKE '%current_mood%';
-- Expect: 0 rows.

-- (c) No view references current_mood.
SELECT table_schema || '.' || table_name AS view_ref
FROM information_schema.views
WHERE view_definition ILIKE '%current_mood%';
-- Expect: 0 rows.

-- (d) No policy references current_mood.
SELECT schemaname || '.' || tablename || '.' || policyname AS policy_ref
FROM pg_policies
WHERE qual ILIKE '%current_mood%'
   OR with_check ILIKE '%current_mood%';
-- Expect: 0 rows.

-- (e) save_scenario_atomic still exists with SECURITY DEFINER and unchanged signature.
SELECT p.proname,
       p.prosecdef                                  AS security_definer,
       pg_get_function_identity_arguments(p.oid)    AS args
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'save_scenario_atomic';
-- Expect: 1 row; prosecdef = t;
-- args = 'p_scenario_id uuid, p_user_id uuid, p_story jsonb,
--         p_characters jsonb, p_codex_entries jsonb, p_scenes jsonb'.
```

Plus a smoke run of `save_scenario_atomic` from an owning user through the app to confirm ownership guards and unrelated save behavior are intact.

## 5. Out of scope (unchanged)

No changes to RLS, auth, storage, other policies, secrets, or unrelated schema. Only the three columns and the mood-related tokens inside `save_scenario_atomic` change.

Stopping here. Awaiting Thomas's explicit approval AND confirmation that the application-side removal is deployed before any migration call.
