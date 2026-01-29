-- Create image_folders table
CREATE TABLE public.image_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL DEFAULT 'New Folder',
  description text DEFAULT '',
  thumbnail_image_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create library_images table
CREATE TABLE public.library_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  folder_id uuid NOT NULL REFERENCES public.image_folders(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  filename text DEFAULT '',
  is_thumbnail boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Add foreign key for thumbnail (after library_images exists)
ALTER TABLE public.image_folders 
ADD CONSTRAINT fk_thumbnail_image 
FOREIGN KEY (thumbnail_image_id) REFERENCES public.library_images(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.image_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_images ENABLE ROW LEVEL SECURITY;

-- Policies for image_folders
CREATE POLICY "Users can view own folders" ON public.image_folders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own folders" ON public.image_folders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own folders" ON public.image_folders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own folders" ON public.image_folders FOR DELETE USING (auth.uid() = user_id);

-- Policies for library_images
CREATE POLICY "Users can view own images" ON public.library_images FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own images" ON public.library_images FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own images" ON public.library_images FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own images" ON public.library_images FOR DELETE USING (auth.uid() = user_id);

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('image_library', 'image_library', true);

-- Storage policies
CREATE POLICY "Users can upload to image_library" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'image_library' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can view image_library" ON storage.objects FOR SELECT USING (bucket_id = 'image_library');
CREATE POLICY "Users can delete own image_library files" ON storage.objects FOR DELETE USING (
  bucket_id = 'image_library' AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create trigger for updated_at
CREATE TRIGGER update_image_folders_updated_at
BEFORE UPDATE ON public.image_folders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();