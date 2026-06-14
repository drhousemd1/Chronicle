-- Stage B — Migration B for qh-sec-20260607-003: tighten image_library storage policies.
-- The image_library bucket is being flipped to private. All reads must be
-- gated to the object's owner (or an admin); uploads remain owner-only.

DROP POLICY IF EXISTS "Users can view image_library" ON storage.objects;

CREATE POLICY "Owners can view own image_library"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'image_library'
  AND (
    (auth.uid())::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin')
  )
);

-- Re-assert the owner-only INSERT policy with an explicit WITH CHECK clause
-- to ensure uploads remain scoped under the user's prefix.
DROP POLICY IF EXISTS "Users can upload to image_library" ON storage.objects;
CREATE POLICY "Users can upload to image_library"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'image_library'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);
