
-- Create guide_images storage bucket (public for reading)
INSERT INTO storage.buckets (id, name, public)
VALUES ('guide_images', 'guide_images', true);

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload guide images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'guide_images');

-- Allow anyone to read guide images (public bucket)
CREATE POLICY "Anyone can read guide images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'guide_images');

-- Allow authenticated users to delete their own uploads
CREATE POLICY "Authenticated users can delete own guide images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'guide_images' AND auth.uid()::text = (storage.foldername(name))[1]);
