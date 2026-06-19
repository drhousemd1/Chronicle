
-- ============ Columns ============
ALTER TABLE public.user_backgrounds ADD COLUMN IF NOT EXISTS image_path text;
ALTER TABLE public.sidebar_backgrounds ADD COLUMN IF NOT EXISTS image_path text;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS cover_image_path text;
ALTER TABLE public.characters ADD COLUMN IF NOT EXISTS avatar_path text;
ALTER TABLE public.side_characters ADD COLUMN IF NOT EXISTS avatar_path text;

-- ============ Backfill telemetry table ============
CREATE TABLE IF NOT EXISTS public.media_migration_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_bucket text NOT NULL,
  target_bucket text NOT NULL,
  source_path text,
  target_path text,
  owner_user_id uuid,
  ref_table text,
  ref_id uuid,
  error_code text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.media_migration_errors TO authenticated;
GRANT ALL ON public.media_migration_errors TO service_role;

ALTER TABLE public.media_migration_errors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read media migration errors" ON public.media_migration_errors;
CREATE POLICY "Admins can read media migration errors"
  ON public.media_migration_errors FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============ Storage RLS helper for published media ============
CREATE OR REPLACE FUNCTION public.can_read_private_story_media(p_bucket text, p_path text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_owner_seg text;
BEGIN
  IF p_path IS NULL OR p_path = '' THEN
    RETURN false;
  END IF;
  v_owner_seg := split_part(p_path, '/', 1);

  -- Owner branch
  IF v_caller IS NOT NULL AND v_owner_seg = v_caller::text THEN
    RETURN true;
  END IF;

  -- Admin branch
  IF v_caller IS NOT NULL AND public.has_role(v_caller, 'admin') THEN
    RETURN true;
  END IF;

  -- Published story cover (private bucket, signed read for anyone)
  IF p_bucket = 'story_covers_private' THEN
    RETURN EXISTS (
      SELECT 1
      FROM public.stories s
      JOIN public.published_scenarios ps ON ps.scenario_id = s.id
      JOIN public.profiles p ON p.id = ps.publisher_id
      WHERE s.cover_image_path = p_path
        AND ps.is_published = true
        AND ps.is_hidden = false
        AND COALESCE(p.hide_published_works, false) = false
    );
  END IF;

  RETURN false;
END;
$$;

-- ============ promote_story_cover_to_public RPC ============
CREATE OR REPLACE FUNCTION public.promote_story_cover_to_public(p_scenario_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_owner uuid;
  v_path text;
  v_url text;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  SELECT user_id, cover_image_path, cover_image_url
    INTO v_owner, v_path, v_url
  FROM public.stories WHERE id = p_scenario_id;
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Scenario not found';
  END IF;
  IF v_owner <> v_caller AND NOT public.has_role(v_caller, 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  -- Returns enough info for the edge function to perform copy; actual file
  -- copy is done by the publish-cover edge function using service role.
  RETURN jsonb_build_object(
    'scenario_id', p_scenario_id,
    'owner_id', v_owner,
    'cover_image_path', v_path,
    'cover_image_url', v_url
  );
END;
$$;

-- ============ Trigger (created disabled) for private media url enforcement ============
CREATE OR REPLACE FUNCTION public.enforce_private_media_url_null()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_TABLE_NAME = 'sidebar_backgrounds' THEN
    -- default/shared rows are public theme assets, exempt
    IF COALESCE(NEW.category, '') IN ('default','shared') THEN
      RETURN NEW;
    END IF;
    IF NEW.image_url IS NOT NULL THEN
      RAISE EXCEPTION 'User sidebar theme rows must have NULL image_url after Batch D lockdown';
    END IF;
    IF NEW.image_path IS NULL THEN
      RAISE EXCEPTION 'User sidebar theme rows require image_path';
    END IF;
  ELSIF TG_TABLE_NAME = 'user_backgrounds' THEN
    IF NEW.image_url IS NOT NULL THEN
      RAISE EXCEPTION 'user_backgrounds rows must have NULL image_url after Batch D lockdown';
    END IF;
    IF NEW.image_path IS NULL THEN
      RAISE EXCEPTION 'user_backgrounds rows require image_path';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_private_media_url_null_user ON public.user_backgrounds;
CREATE TRIGGER trg_enforce_private_media_url_null_user
  BEFORE INSERT OR UPDATE ON public.user_backgrounds
  FOR EACH ROW EXECUTE FUNCTION public.enforce_private_media_url_null();
ALTER TABLE public.user_backgrounds DISABLE TRIGGER trg_enforce_private_media_url_null_user;

DROP TRIGGER IF EXISTS trg_enforce_private_media_url_null_sidebar ON public.sidebar_backgrounds;
CREATE TRIGGER trg_enforce_private_media_url_null_sidebar
  BEFORE INSERT OR UPDATE ON public.sidebar_backgrounds
  FOR EACH ROW EXECUTE FUNCTION public.enforce_private_media_url_null();
ALTER TABLE public.sidebar_backgrounds DISABLE TRIGGER trg_enforce_private_media_url_null_sidebar;

-- ============ Storage RLS for new private buckets ============
-- user_backgrounds_private: owner-only
DROP POLICY IF EXISTS "user_bg_priv owner read"   ON storage.objects;
DROP POLICY IF EXISTS "user_bg_priv owner write"  ON storage.objects;
DROP POLICY IF EXISTS "user_bg_priv owner update" ON storage.objects;
DROP POLICY IF EXISTS "user_bg_priv owner delete" ON storage.objects;
CREATE POLICY "user_bg_priv owner read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'user_backgrounds_private'
    AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(),'admin')));
CREATE POLICY "user_bg_priv owner write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'user_backgrounds_private' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "user_bg_priv owner update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'user_backgrounds_private' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "user_bg_priv owner delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'user_backgrounds_private' AND auth.uid()::text = (storage.foldername(name))[1]);

-- sidebar_backgrounds_private: owner-only
DROP POLICY IF EXISTS "sidebar_bg_priv owner read"   ON storage.objects;
DROP POLICY IF EXISTS "sidebar_bg_priv owner write"  ON storage.objects;
DROP POLICY IF EXISTS "sidebar_bg_priv owner update" ON storage.objects;
DROP POLICY IF EXISTS "sidebar_bg_priv owner delete" ON storage.objects;
CREATE POLICY "sidebar_bg_priv owner read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'sidebar_backgrounds_private'
    AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(),'admin')));
CREATE POLICY "sidebar_bg_priv owner write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'sidebar_backgrounds_private' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "sidebar_bg_priv owner update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'sidebar_backgrounds_private' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "sidebar_bg_priv owner delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'sidebar_backgrounds_private' AND auth.uid()::text = (storage.foldername(name))[1]);

-- character_avatars_private: owner-only
DROP POLICY IF EXISTS "char_avatar_priv owner read"   ON storage.objects;
DROP POLICY IF EXISTS "char_avatar_priv owner write"  ON storage.objects;
DROP POLICY IF EXISTS "char_avatar_priv owner update" ON storage.objects;
DROP POLICY IF EXISTS "char_avatar_priv owner delete" ON storage.objects;
CREATE POLICY "char_avatar_priv owner read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'character_avatars_private'
    AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(),'admin')));
CREATE POLICY "char_avatar_priv owner write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'character_avatars_private' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "char_avatar_priv owner update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'character_avatars_private' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "char_avatar_priv owner delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'character_avatars_private' AND auth.uid()::text = (storage.foldername(name))[1]);

-- story_covers_private: owner read/write + signed-read for published covers via helper
DROP POLICY IF EXISTS "story_covers_priv owner read"        ON storage.objects;
DROP POLICY IF EXISTS "story_covers_priv owner write"       ON storage.objects;
DROP POLICY IF EXISTS "story_covers_priv owner update"      ON storage.objects;
DROP POLICY IF EXISTS "story_covers_priv owner delete"      ON storage.objects;
DROP POLICY IF EXISTS "story_covers_priv published readable" ON storage.objects;
CREATE POLICY "story_covers_priv owner write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'story_covers_private' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "story_covers_priv owner update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'story_covers_private' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "story_covers_priv owner delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'story_covers_private' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "story_covers_priv published readable" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'story_covers_private'
    AND public.can_read_private_story_media('story_covers_private', name));
