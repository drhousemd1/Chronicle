-- Add image_library_selected column to user_backgrounds table
-- This tracks which background is selected for the Image Library page separately from the Hub page
ALTER TABLE public.user_backgrounds ADD COLUMN IF NOT EXISTS image_library_selected boolean DEFAULT false;

-- Create an index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_user_backgrounds_image_library_selected 
ON public.user_backgrounds(user_id, image_library_selected) 
WHERE image_library_selected = true;