-- Create covers storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('covers', 'covers', true);

-- Allow authenticated users to upload covers
CREATE POLICY "Users can upload covers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'covers' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow public read access to covers
CREATE POLICY "Public can view covers"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'covers');

-- Allow users to update their own covers
CREATE POLICY "Users can update their covers"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'covers' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to delete their own covers
CREATE POLICY "Users can delete their covers"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'covers' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Add cover_image_position column to scenarios table
ALTER TABLE scenarios 
ADD COLUMN cover_image_position JSONB DEFAULT '{"x": 50, "y": 50}';