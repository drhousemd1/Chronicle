
ALTER TABLE public.user_backgrounds ALTER COLUMN image_url DROP NOT NULL;
ALTER TABLE public.sidebar_backgrounds ALTER COLUMN image_url DROP NOT NULL;

UPDATE public.user_backgrounds
   SET image_url = NULL
 WHERE image_path IS NOT NULL
   AND image_url IS NOT NULL;

UPDATE public.sidebar_backgrounds
   SET image_url = NULL
 WHERE image_path IS NOT NULL
   AND image_url IS NOT NULL
   AND COALESCE(category, '') NOT IN ('default','shared');

DROP POLICY IF EXISTS "Users can upload backgrounds" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own backgrounds" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own backgrounds" ON storage.objects;

CREATE POLICY "Admins can upload backgrounds"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'backgrounds' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update backgrounds"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'backgrounds' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete backgrounds"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'backgrounds' AND public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS trg_enforce_private_user_backgrounds ON public.user_backgrounds;
CREATE TRIGGER trg_enforce_private_user_backgrounds
  BEFORE INSERT OR UPDATE ON public.user_backgrounds
  FOR EACH ROW EXECUTE FUNCTION public.enforce_private_media_url_null();

DROP TRIGGER IF EXISTS trg_enforce_private_sidebar_backgrounds ON public.sidebar_backgrounds;
CREATE TRIGGER trg_enforce_private_sidebar_backgrounds
  BEFORE INSERT OR UPDATE ON public.sidebar_backgrounds
  FOR EACH ROW EXECUTE FUNCTION public.enforce_private_media_url_null();
