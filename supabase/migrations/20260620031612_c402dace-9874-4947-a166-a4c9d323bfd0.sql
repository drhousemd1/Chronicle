
-- 1) Covers bucket: drop user write/update/delete; keep public SELECT; add admin write/update/delete.
DROP POLICY IF EXISTS "Users can upload covers" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their covers" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their covers" ON storage.objects;

CREATE POLICY "covers admin write"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'covers' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "covers admin update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'covers' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "covers admin delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'covers' AND public.has_role(auth.uid(), 'admin'));

-- 2) Avatars bucket: restrict user writes to profile-avatar filenames in own folder.
--    Profile pattern: <uid>/avatar-<digits>.<ext>  (no UUID after `avatar-`).
--    Character pattern <uid>/avatar-<uuid>-<ts>.<ext> is rejected.
DROP POLICY IF EXISTS "Users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatars" ON storage.objects;

CREATE POLICY "Users can upload profile avatars"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (auth.uid())::text = (storage.foldername(name))[1]
    AND name ~ ('^' || (auth.uid())::text || '/avatar-[0-9]+\.(jpg|jpeg|png|webp|gif)$')
  );

CREATE POLICY "Users can update profile avatars"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (auth.uid())::text = (storage.foldername(name))[1]
    AND name ~ ('^' || (auth.uid())::text || '/avatar-[0-9]+\.(jpg|jpeg|png|webp|gif)$')
  );
-- "Users can delete own avatars" stays as-is so users can prune their own folder.

-- 3) Null the legacy public avatar URL on rows where private avatar_path is canonical.
UPDATE public.characters
   SET avatar_url = NULL
 WHERE avatar_path IS NOT NULL
   AND avatar_url IS NOT NULL
   AND avatar_url LIKE '%/storage/v1/object/public/avatars/%';

UPDATE public.side_characters
   SET avatar_url = NULL
 WHERE avatar_path IS NOT NULL
   AND avatar_url IS NOT NULL
   AND avatar_url LIKE '%/storage/v1/object/public/avatars/%';

UPDATE public.character_session_states
   SET avatar_url = NULL
 WHERE avatar_path IS NOT NULL
   AND avatar_url IS NOT NULL
   AND avatar_url LIKE '%/storage/v1/object/public/avatars/%';
