-- Allow authenticated users to view all profiles (for displaying publisher info)
-- This is safe as profiles only contain public info (username, avatar_url)
CREATE POLICY "Anyone authenticated can view profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Drop the restrictive policy (optional but cleaner)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;