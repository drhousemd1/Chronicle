
-- Admin-only helper RPC used by admin-media-cleanup to broadly verify
-- whether candidate legacy avatar names are still referenced anywhere.
CREATE OR REPLACE FUNCTION public.scan_legacy_avatar_refs(p_names text[])
RETURNS TABLE(name text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin required';
  END IF;
  RETURN QUERY
  WITH cand AS (SELECT unnest(p_names) AS n)
  SELECT DISTINCT c.n
  FROM cand c
  WHERE
    EXISTS (SELECT 1 FROM public.character_state_message_snapshots s WHERE s.snapshot::text LIKE '%'||c.n||'%')
    OR EXISTS (SELECT 1 FROM public.side_character_message_snapshots s WHERE s.snapshot::text LIKE '%'||c.n||'%')
    OR EXISTS (SELECT 1 FROM public.conversation_world_state_snapshots s WHERE s.snapshot::text LIKE '%'||c.n||'%')
    OR EXISTS (SELECT 1 FROM public.messages m WHERE m.content LIKE '%'||c.n||'%')
    OR EXISTS (SELECT 1 FROM public.memories m WHERE m.content LIKE '%'||c.n||'%')
    OR EXISTS (SELECT 1 FROM public.stories st WHERE st.world_core::text LIKE '%'||c.n||'%' OR st.opening_dialog::text LIKE '%'||c.n||'%' OR st.nav_button_images::text LIKE '%'||c.n||'%' OR st.ui_settings::text LIKE '%'||c.n||'%')
    OR EXISTS (SELECT 1 FROM public.characters ch WHERE ch.sections::text LIKE '%'||c.n||'%' OR ch.background::text LIKE '%'||c.n||'%' OR ch.physical_appearance::text LIKE '%'||c.n||'%')
    OR EXISTS (SELECT 1 FROM public.character_session_states cs WHERE cs.background::text LIKE '%'||c.n||'%' OR cs.physical_appearance::text LIKE '%'||c.n||'%')
    OR EXISTS (SELECT 1 FROM public.side_characters sc WHERE sc.background::text LIKE '%'||c.n||'%' OR sc.physical_appearance::text LIKE '%'||c.n||'%' OR sc.custom_sections::text LIKE '%'||c.n||'%')
    OR EXISTS (SELECT 1 FROM public.codex_entries ce WHERE ce.body LIKE '%'||c.n||'%')
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.avatar_url LIKE '%'||c.n||'%')
    OR EXISTS (SELECT 1 FROM public.characters ch WHERE ch.avatar_url LIKE '%'||c.n||'%')
    OR EXISTS (SELECT 1 FROM public.side_characters sc WHERE sc.avatar_url LIKE '%'||c.n||'%')
    OR EXISTS (SELECT 1 FROM public.character_session_states cs WHERE cs.avatar_url LIKE '%'||c.n||'%');
END;
$$;

REVOKE ALL ON FUNCTION public.scan_legacy_avatar_refs(text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.scan_legacy_avatar_refs(text[]) TO authenticated;

-- ----------------------------------------------------------------------------
-- Cleanup pass: delete legacy public 'avatars' bucket objects proven unreferenced.
-- Two safety classes, both pattern-matched to <uuid>/avatar-<uuid>-<ts>.<ext>
-- so profile avatars (avatar-<digits>.<ext>) are never touched.
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_deleted_with_mirror int;
  v_deleted_orphan int;
  v_total_before int;
  v_total_after int;
BEGIN
  -- Bypass storage.protect_delete() for this admin-supervised pass.
  PERFORM set_config('storage.allow_delete_query', 'true', true);

  SELECT count(*) INTO v_total_before FROM storage.objects WHERE bucket_id='avatars';

  -- Class 1: legacy character-avatar with a verified private mirror and no
  -- live avatar_url reference anywhere.
  WITH cand AS (
    SELECT o.name
    FROM storage.objects o
    WHERE o.bucket_id='avatars'
      AND o.name ~ '^[0-9a-f-]+/avatar-[0-9a-f-]{36}-[0-9]+\.(jpg|jpeg|png|webp)$'
      AND EXISTS (SELECT 1 FROM storage.objects p WHERE p.bucket_id='character_avatars_private' AND p.name = o.name)
      AND NOT EXISTS (SELECT 1 FROM public.characters c WHERE c.avatar_url LIKE '%/storage/v1/object/public/avatars/'||o.name||'%')
      AND NOT EXISTS (SELECT 1 FROM public.side_characters c WHERE c.avatar_url LIKE '%/storage/v1/object/public/avatars/'||o.name||'%')
      AND NOT EXISTS (SELECT 1 FROM public.character_session_states c WHERE c.avatar_url LIKE '%/storage/v1/object/public/avatars/'||o.name||'%')
      AND NOT EXISTS (SELECT 1 FROM public.profiles c WHERE c.avatar_url LIKE '%/storage/v1/object/public/avatars/'||o.name||'%')
  )
  DELETE FROM storage.objects o USING cand WHERE o.bucket_id='avatars' AND o.name = cand.name;
  GET DIAGNOSTICS v_deleted_with_mirror = ROW_COUNT;

  -- Class 2: legacy character-avatar with NO private mirror AND not referenced
  -- by any URL-bearing text/JSON column across the app.
  WITH cand AS (
    SELECT o.name
    FROM storage.objects o
    WHERE o.bucket_id='avatars'
      AND o.name ~ '^[0-9a-f-]+/avatar-[0-9a-f-]{36}-[0-9]+\.(jpg|jpeg|png|webp)$'
      AND NOT EXISTS (SELECT 1 FROM storage.objects p WHERE p.bucket_id='character_avatars_private' AND p.name = o.name)
  ),
  referenced AS (
    SELECT DISTINCT c.name
    FROM cand c
    WHERE
      EXISTS (SELECT 1 FROM public.character_state_message_snapshots s WHERE s.snapshot::text LIKE '%'||c.name||'%')
      OR EXISTS (SELECT 1 FROM public.side_character_message_snapshots s WHERE s.snapshot::text LIKE '%'||c.name||'%')
      OR EXISTS (SELECT 1 FROM public.conversation_world_state_snapshots s WHERE s.snapshot::text LIKE '%'||c.name||'%')
      OR EXISTS (SELECT 1 FROM public.messages m WHERE m.content LIKE '%'||c.name||'%')
      OR EXISTS (SELECT 1 FROM public.memories m WHERE m.content LIKE '%'||c.name||'%')
      OR EXISTS (SELECT 1 FROM public.stories st WHERE st.world_core::text LIKE '%'||c.name||'%' OR st.opening_dialog::text LIKE '%'||c.name||'%' OR st.nav_button_images::text LIKE '%'||c.name||'%' OR st.ui_settings::text LIKE '%'||c.name||'%')
      OR EXISTS (SELECT 1 FROM public.characters ch WHERE ch.sections::text LIKE '%'||c.name||'%' OR ch.background::text LIKE '%'||c.name||'%' OR ch.physical_appearance::text LIKE '%'||c.name||'%')
      OR EXISTS (SELECT 1 FROM public.character_session_states cs WHERE cs.background::text LIKE '%'||c.name||'%' OR cs.physical_appearance::text LIKE '%'||c.name||'%')
      OR EXISTS (SELECT 1 FROM public.side_characters sc WHERE sc.background::text LIKE '%'||c.name||'%' OR sc.physical_appearance::text LIKE '%'||c.name||'%' OR sc.custom_sections::text LIKE '%'||c.name||'%')
      OR EXISTS (SELECT 1 FROM public.codex_entries ce WHERE ce.body LIKE '%'||c.name||'%')
      OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.avatar_url LIKE '%'||c.name||'%')
      OR EXISTS (SELECT 1 FROM public.characters ch WHERE ch.avatar_url LIKE '%'||c.name||'%')
      OR EXISTS (SELECT 1 FROM public.side_characters sc WHERE sc.avatar_url LIKE '%'||c.name||'%')
      OR EXISTS (SELECT 1 FROM public.character_session_states cs WHERE cs.avatar_url LIKE '%'||c.name||'%')
  ),
  safe AS (
    SELECT name FROM cand WHERE name NOT IN (SELECT name FROM referenced)
  )
  DELETE FROM storage.objects o USING safe WHERE o.bucket_id='avatars' AND o.name = safe.name;
  GET DIAGNOSTICS v_deleted_orphan = ROW_COUNT;

  SELECT count(*) INTO v_total_after FROM storage.objects WHERE bucket_id='avatars';

  RAISE NOTICE 'Batch D avatar cleanup: deleted_with_mirror=%, deleted_orphan=%, avatars_before=%, avatars_after=%',
    v_deleted_with_mirror, v_deleted_orphan, v_total_before, v_total_after;
END $$;
