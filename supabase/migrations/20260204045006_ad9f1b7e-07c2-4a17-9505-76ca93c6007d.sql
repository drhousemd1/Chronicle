-- Add view_count column to published_scenarios table
ALTER TABLE published_scenarios 
ADD COLUMN view_count integer DEFAULT 0 NOT NULL;

-- Create increment function for view count
CREATE OR REPLACE FUNCTION public.increment_view_count(published_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE published_scenarios 
  SET view_count = view_count + 1, updated_at = now()
  WHERE id = published_id;
END;
$$;