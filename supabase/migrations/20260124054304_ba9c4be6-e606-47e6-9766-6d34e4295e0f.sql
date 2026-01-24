-- Add tags array column to scenes table
ALTER TABLE public.scenes ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Migrate existing tag data to tags array
UPDATE public.scenes 
SET tags = ARRAY[tag] 
WHERE tag IS NOT NULL AND tag != '' AND (tags IS NULL OR tags = '{}');

-- Note: Keeping the old 'tag' column for backwards compatibility during transition
-- It can be dropped in a future migration once all data is migrated