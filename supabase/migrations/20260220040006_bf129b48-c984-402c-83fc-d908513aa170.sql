
-- Phase 1: Extend profiles table with new columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS about_me text DEFAULT '',
  ADD COLUMN IF NOT EXISTS preferred_genres text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS hide_published_works boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS hide_profile_details boolean DEFAULT false;

-- Update handle_new_user to generate random display name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  random_name text;
BEGIN
  random_name := 'User' || substr(md5(random()::text), 1, 8);
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'username', random_name);
  RETURN NEW;
END;
$$;

-- Phase 2+3: Creator follows table
CREATE TABLE public.creator_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL,
  creator_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (follower_id, creator_id)
);

ALTER TABLE public.creator_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own follows"
  ON public.creator_follows FOR SELECT
  TO authenticated
  USING (follower_id = auth.uid());

CREATE POLICY "Users can follow creators"
  ON public.creator_follows FOR INSERT
  TO authenticated
  WITH CHECK (follower_id = auth.uid() AND creator_id != auth.uid());

CREATE POLICY "Users can unfollow"
  ON public.creator_follows FOR DELETE
  TO authenticated
  USING (follower_id = auth.uid());

-- Allow anyone authenticated to view profiles (needed for public creator pages)
-- The existing SELECT policy already uses USING(true), so no change needed.

-- Create a function to get creator stats (avoids complex client queries)
CREATE OR REPLACE FUNCTION public.get_creator_stats(creator_user_id uuid)
RETURNS TABLE (
  published_count bigint,
  total_likes bigint,
  total_saves bigint,
  total_views bigint,
  total_plays bigint,
  follower_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    COUNT(*)::bigint as published_count,
    COALESCE(SUM(like_count), 0)::bigint as total_likes,
    COALESCE(SUM(save_count), 0)::bigint as total_saves,
    COALESCE(SUM(view_count), 0)::bigint as total_views,
    COALESCE(SUM(play_count), 0)::bigint as total_plays,
    (SELECT COUNT(*)::bigint FROM creator_follows WHERE creator_id = creator_user_id) as follower_count
  FROM published_scenarios
  WHERE publisher_id = creator_user_id
    AND is_published = true
    AND is_hidden = false;
$$;
