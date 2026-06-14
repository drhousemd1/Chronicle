-- Stage B: tighten scenes storage bucket. Replace public-readable SELECT
-- policy with owner / admin / published-scenario gated policy via
-- public.can_read_scene_storage_object(name). Also re-run the image_path
-- backfill to capture any rows uploaded after Migration A but before this
-- migration runs.

-- Re-backfill image_path from legacy public URLs (idempotent).
UPDATE public.scenes
SET image_path = substring(image_url FROM '/object/public/scenes/(.+)$')
WHERE (image_path IS NULL OR image_path = '')
  AND image_url IS NOT NULL
  AND image_url ~ '/object/public/scenes/';

-- Drop the permissive public SELECT policy and add a gated one.
DROP POLICY IF EXISTS "Anyone can view scenes" ON storage.objects;

CREATE POLICY "Owners admins or published scenes can view"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'scenes'
    AND public.can_read_scene_storage_object(name)
  );
