-- Allow anonymous users to read app settings (for edge functions)
CREATE POLICY "Anyone can read settings"
  ON public.app_settings FOR SELECT
  TO anon
  USING (true);