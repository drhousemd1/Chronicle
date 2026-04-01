-- Security hardening: tighten broad storage/app_settings read surfaces.

-- ---------------------------------------------------------------------------
-- guide_images bucket: limit uploads to admins only.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can upload guide images" ON storage.objects;

CREATE POLICY "Admins can upload guide images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'guide_images'
  AND public.has_role(auth.uid(), 'admin')
);

-- ---------------------------------------------------------------------------
-- app_settings: replace broad authenticated read policy with scoped access.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone authenticated can read settings" ON public.app_settings;
DROP POLICY IF EXISTS "Anyone can read settings" ON public.app_settings;

CREATE POLICY "Authenticated can read shared app settings"
ON public.app_settings
FOR SELECT
TO authenticated
USING (
  setting_key IN (
    'subscription_tiers_v1',
    'nav_button_images'
  )
);

CREATE POLICY "Admins can read all settings"
ON public.app_settings
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
